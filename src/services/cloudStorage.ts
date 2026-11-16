import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { User } from "firebase/auth";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { DEFAULT_STORE_RULES } from "../data/defaultStoreRules";
import {
  AppliedRuleChange,
  ChatFlowSessionEntry,
  ChatFlowTurn,
  LearnedRuleUpdate,
  ScenarioCategory,
  ScriptRow,
  ScriptScenario,
  StoreRuleEntry,
  ToneOption,
} from "../types/cs";

function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 120);
  return cleaned || `id_${Date.now()}`;
}

function clamp(val: string, max: number): string {
  return val.trim().slice(0, max);
}

function timestampToIso(ts: unknown): string {
  if (ts instanceof Timestamp) {
    return ts.toDate().toISOString();
  }
  if (typeof ts === "string" && ts) {
    return ts;
  }
  return new Date().toISOString();
}

function sanitizeRows(rows: ScriptRow[]): ScriptRow[] {
  const valid = rows
    .filter((r) => r.section.trim() || r.english.trim() || r.portuguese.trim())
    .slice(0, 30)
    .map((r) => ({
      section: clamp(r.section || "Section", 120),
      english: clamp(r.english || "-", 2000),
      portuguese: clamp(r.portuguese || "-", 2000),
      highlight: Boolean(r.highlight),
    }));
  if (valid.length === 0) {
    return [
      {
        section: "Main Reply",
        english: "Custom reply",
        portuguese: "Resposta personalizada",
        highlight: true,
      },
    ];
  }
  return valid;
}

// ==========================================
// 1. CLOUD CUSTOM SCRIPTS (Script Library)
// ==========================================

export function subscribeCustomScripts(
  userId: string,
  baseNumberOffset: number,
  onData: (scripts: ScriptScenario[]) => void
) {
  const path = `users/${userId}/customScripts`;
  const q = query(collection(db, path), where("ownerId", "==", userId));

  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => {
          const data = d.data();
          const createdIso = timestampToIso(data.createdAt);
          return {
            createdMs:
              data.createdAt instanceof Timestamp
                ? data.createdAt.toMillis()
                : Date.parse(createdIso) || 0,
            scenario: {
              id: d.id,
              number: baseNumberOffset + 1,
              title: String(data.title || "Untitled Script"),
              category: (data.category as ScenarioCategory) || ScenarioCategory.GENERAL,
              whenToUse: String(data.whenToUse || ""),
              policyRule: String(data.policyRule || ""),
              sampleInput: String(data.sampleInput || ""),
              rows: Array.isArray(data.rows) ? (data.rows as ScriptRow[]) : [],
              isCustom: true,
            } satisfies ScriptScenario,
          };
        })
        .sort((a, b) => a.createdMs - b.createdMs)
        .map((entry, idx) => ({
          ...entry.scenario,
          number: baseNumberOffset + idx + 1,
        }));

      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function createCloudCustomScript(
  userId: string,
  input: Omit<ScriptScenario, "id" | "number">
): Promise<string> {
  const scriptId = sanitizeId(`custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  const path = `users/${userId}/customScripts/${scriptId}`;
  try {
    await setDoc(doc(db, path), {
      ownerId: userId,
      title: clamp(input.title || "Custom Script", 160),
      category: input.category,
      whenToUse: clamp(input.whenToUse || "", 600),
      policyRule: clamp(input.policyRule || "", 800),
      sampleInput: clamp(input.sampleInput || "", 2500),
      rows: sanitizeRows(input.rows),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return scriptId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateCloudCustomScript(
  userId: string,
  scriptId: string,
  input: Omit<ScriptScenario, "id" | "number">
): Promise<void> {
  const safeId = sanitizeId(scriptId);
  const path = `users/${userId}/customScripts/${safeId}`;
  try {
    await updateDoc(doc(db, path), {
      title: clamp(input.title || "Custom Script", 160),
      category: input.category,
      whenToUse: clamp(input.whenToUse || "", 600),
      policyRule: clamp(input.policyRule || "", 800),
      sampleInput: clamp(input.sampleInput || "", 2500),
      rows: sanitizeRows(input.rows),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCloudCustomScript(
  userId: string,
  scriptId: string
): Promise<void> {
  const safeId = sanitizeId(scriptId);
  const path = `users/${userId}/customScripts/${safeId}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ==========================================
// 2. AUTO-APPLY LEARNED STORE RULES
// ==========================================

export async function applyLearnedStoreRuleUpdates(
  userId: string,
  existingRules: StoreRuleEntry[],
  updates: LearnedRuleUpdate[]
): Promise<AppliedRuleChange[]> {
  const validUpdates = updates
    .filter((u) => u && u.topic?.trim() && u.english?.trim() && u.portuguese?.trim())
    .slice(0, 3);

  if (validUpdates.length === 0) return [];

  const changes: AppliedRuleChange[] = [];
  let nextSortOrder = existingRules.reduce(
    (max, r) => Math.max(max, r.sortOrder + 1),
    existingRules.length
  );

  for (const item of validUpdates) {
    const cleanTopic = clamp(item.topic, 160);
    const cleanEnglish = clamp(item.english, 2000);
    const cleanPortuguese = clamp(item.portuguese, 2000);
    if (!cleanTopic || !cleanEnglish || !cleanPortuguese) continue;

    const matchedById = item.existingRuleId
      ? existingRules.find((r) => r.id === item.existingRuleId)
      : undefined;
    const matchedByTopic = existingRules.find(
      (r) => r.topic.toLowerCase().trim() === cleanTopic.toLowerCase()
    );
    const target = matchedById ?? matchedByTopic;

    if (target) {
      const sameContent =
        target.topic.trim() === cleanTopic &&
        target.english.trim() === cleanEnglish &&
        target.portuguese.trim() === cleanPortuguese &&
        target.isPrimary === Boolean(item.isPrimary);
      if (sameContent) continue;

      await updateCloudStoreRule(userId, target.id, {
        topic: cleanTopic,
        english: cleanEnglish,
        portuguese: cleanPortuguese,
        isPrimary: Boolean(item.isPrimary),
        sortOrder: target.sortOrder,
      });

      changes.push({
        action: "update",
        ruleId: target.id,
        topic: cleanTopic,
        reason: item.reason || "Updated from Reply Generator",
      });
    } else {
      const newRuleId = await createCloudStoreRule(userId, {
        topic: cleanTopic,
        english: cleanEnglish,
        portuguese: cleanPortuguese,
        isPrimary: Boolean(item.isPrimary),
        sortOrder: Math.min(1000, nextSortOrder++),
      });

      changes.push({
        action: "create",
        ruleId: newRuleId,
        topic: cleanTopic,
        reason: item.reason || "Learned from Reply Generator",
      });
    }
  }

  return changes;
}

// ==========================================
// 3. CLOUD STORE RULES (Store Rules)
// ==========================================

export function subscribeStoreRules(
  userId: string,
  onData: (rules: StoreRuleEntry[]) => void
) {
  const path = `users/${userId}/storeRules`;
  const q = query(collection(db, path), where("ownerId", "==", userId));

  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => {
          const data = d.data();
          return {
            id: d.id,
            topic: String(data.topic || ""),
            english: String(data.english || ""),
            portuguese: String(data.portuguese || ""),
            isPrimary: Boolean(data.isPrimary),
            sortOrder: typeof data.sortOrder === "number" ? data.sortOrder : 0,
          } satisfies StoreRuleEntry;
        })
        .sort((a, b) => a.sortOrder - b.sortOrder);

      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function seedDefaultCloudStoreRulesIfEmpty(
  userId: string
): Promise<void> {
  const path = `users/${userId}/storeRules`;
  try {
    const q = query(collection(db, path), where("ownerId", "==", userId));
    const snap = await getDocs(q);
    if (!snap.empty) return;

    const batch = writeBatch(db);
    DEFAULT_STORE_RULES.forEach((rule) => {
      const ref = doc(db, `${path}/${sanitizeId(rule.id)}`);
      batch.set(ref, {
        ownerId: userId,
        topic: clamp(rule.topic, 160),
        english: clamp(rule.english, 2000),
        portuguese: clamp(rule.portuguese, 2000),
        isPrimary: Boolean(rule.isPrimary),
        sortOrder: rule.sortOrder,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function resetCloudStoreRulesToDefaults(
  userId: string
): Promise<void> {
  const path = `users/${userId}/storeRules`;
  try {
    const q = query(collection(db, path), where("ownerId", "==", userId));
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    DEFAULT_STORE_RULES.forEach((rule) => {
      const ref = doc(db, `${path}/${sanitizeId(rule.id)}`);
      batch.set(ref, {
        ownerId: userId,
        topic: clamp(rule.topic, 160),
        english: clamp(rule.english, 2000),
        portuguese: clamp(rule.portuguese, 2000),
        isPrimary: Boolean(rule.isPrimary),
        sortOrder: rule.sortOrder,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function createCloudStoreRule(
  userId: string,
  rule: Omit<StoreRuleEntry, "id">
): Promise<string> {
  const ruleId = sanitizeId(`rule-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  const path = `users/${userId}/storeRules/${ruleId}`;
  try {
    await setDoc(doc(db, path), {
      ownerId: userId,
      topic: clamp(rule.topic, 160),
      english: clamp(rule.english, 2000),
      portuguese: clamp(rule.portuguese, 2000),
      isPrimary: Boolean(rule.isPrimary),
      sortOrder: Math.min(1000, Math.max(0, Math.round(rule.sortOrder))),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ruleId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateCloudStoreRule(
  userId: string,
  ruleId: string,
  rule: Omit<StoreRuleEntry, "id">
): Promise<void> {
  const safeId = sanitizeId(ruleId);
  const path = `users/${userId}/storeRules/${safeId}`;
  try {
    await updateDoc(doc(db, path), {
      topic: clamp(rule.topic, 160),
      english: clamp(rule.english, 2000),
      portuguese: clamp(rule.portuguese, 2000),
      isPrimary: Boolean(rule.isPrimary),
      sortOrder: Math.min(1000, Math.max(0, Math.round(rule.sortOrder))),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCloudStoreRule(
  userId: string,
  ruleId: string
): Promise<void> {
  const safeId = sanitizeId(ruleId);
  const path = `users/${userId}/storeRules/${safeId}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ==========================================
// 4. CLOUD USER ACCOUNT PROFILE
// ==========================================

export async function upsertCloudUserAccount(user: User): Promise<void> {
  const path = `users/${user.uid}`;
  const ref = doc(db, path);
  const email = clamp(user.email || "", 254);
  const displayName = clamp(
    user.displayName || user.email?.split("@")[0] || "CS Agent",
    160
  );

  try {
    const existingSnap = await getDoc(ref);
    if (!existingSnap.exists()) {
      await setDoc(ref, {
        ownerId: user.uid,
        email,
        displayName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        email,
        displayName,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ==========================================
// 5. CLOUD CHAT FLOW SESSIONS
// ==========================================

function sanitizeChatFlowTurns(turns: ChatFlowTurn[]): ChatFlowTurn[] {
  return turns.slice(0, 30).map((t, index) => ({
    id: sanitizeId(t.id || `turn-${index + 1}`),
    turnNumber: typeof t.turnNumber === "number" ? t.turnNumber : index + 1,
    cxLabel: clamp(t.cxLabel || "Customer Turn", 160),
    cxMessage: clamp(t.cxMessage || "-", 4000),
    detectedScenario: clamp(t.detectedScenario || "General Inquiry", 200),
    category: clamp(t.category || "General", 80),
    policySummary: clamp(t.policySummary || "", 1000),
    rows: (t.rows || []).slice(0, 30).map((r) => ({
      section: clamp(r.section || "Section", 120),
      english: clamp(r.english || "-", 2000),
      portuguese: clamp(r.portuguese || "-", 2000),
      isKeyRule: Boolean(r.isKeyRule),
    })),
    probingQuestions: (t.probingQuestions || []).slice(0, 5).map((pq) => ({
      english: clamp(pq.english || "", 1000),
      portuguese: clamp(pq.portuguese || "", 1000),
    })),
    nextChoices: (t.nextChoices || []).slice(0, 8).map((c, cIdx) => ({
      id: sanitizeId(c.id || `choice-${cIdx + 1}`),
      label: clamp(c.label || "Choice", 120),
      cxMessage: clamp(c.cxMessage || "", 1500),
      kind: c.kind || "choice",
    })),
    fullEnglishMessage: clamp(t.fullEnglishMessage || "", 8000),
    fullPortugueseMessage: clamp(t.fullPortugueseMessage || "", 8000),
    ...(t.editedPortuguese
      ? { editedPortuguese: clamp(t.editedPortuguese, 8000) }
      : {}),
  }));
}

export function subscribeChatFlowSessions(
  userId: string,
  onData: (sessions: ChatFlowSessionEntry[]) => void
) {
  const path = `users/${userId}/chatFlows`;
  const q = query(collection(db, path), where("ownerId", "==", userId));

  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => {
          const data = d.data();
          const createdAt = timestampToIso(data.createdAt);
          const updatedAt = timestampToIso(data.updatedAt);
          return {
            updatedMs:
              data.updatedAt instanceof Timestamp
                ? data.updatedAt.toMillis()
                : Date.parse(updatedAt) || 0,
            entry: {
              id: d.id,
              title: String(data.title || "Chat Flow Session"),
              orderInput: String(data.orderInput || ""),
              trackingNumber: data.trackingNumber
                ? String(data.trackingNumber)
                : undefined,
              carrierName: data.carrierName
                ? String(data.carrierName)
                : undefined,
              estimatedDate: data.estimatedDate
                ? String(data.estimatedDate)
                : undefined,
              lastUpdateDate: data.lastUpdateDate
                ? String(data.lastUpdateDate)
                : undefined,
              latestStatus: data.latestStatus
                ? String(data.latestStatus)
                : undefined,
              issueTopic: data.issueTopic ? String(data.issueTopic) : undefined,
              productSpec: data.productSpec
                ? String(data.productSpec)
                : undefined,
              voucherTier: data.voucherTier
                ? String(data.voucherTier)
                : undefined,
              tone: (data.tone as ToneOption) || ToneOption.STANDARD,
              turns: Array.isArray(data.turns)
                ? (data.turns as ChatFlowTurn[])
                : [],
              createdAt,
              updatedAt,
            } satisfies ChatFlowSessionEntry,
          };
        })
        .sort((a, b) => b.updatedMs - a.updatedMs)
        .map((x) => x.entry);

      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function saveCloudChatFlowSession(
  userId: string,
  existingFlowId: string | null,
  session: {
    title: string;
    orderInput: string;
    trackingNumber?: string;
    carrierName?: string;
    estimatedDate?: string;
    lastUpdateDate?: string;
    latestStatus?: string;
    issueTopic?: string;
    productSpec?: string;
    voucherTier?: string;
    tone: ToneOption;
    turns: ChatFlowTurn[];
  }
): Promise<string> {
  const safeTurns = sanitizeChatFlowTurns(session.turns);
  if (safeTurns.length === 0) {
    throw new Error("Cannot save an empty Chat Flow session.");
  }

  const flowId = existingFlowId
    ? sanitizeId(existingFlowId)
    : sanitizeId(`flow-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  const path = `users/${userId}/chatFlows/${flowId}`;

  const fields: Record<string, unknown> = {
    title: clamp(session.title || "Chat Flow Session", 200),
    orderInput: clamp(session.orderInput || "", 8000),
    tone: session.tone,
    turns: safeTurns,
    updatedAt: serverTimestamp(),
  };

  if (session.trackingNumber?.trim()) {
    fields.trackingNumber = clamp(session.trackingNumber, 80);
  }
  if (session.carrierName?.trim()) {
    fields.carrierName = clamp(session.carrierName, 120);
  }
  if (session.estimatedDate?.trim()) {
    fields.estimatedDate = clamp(session.estimatedDate, 40);
  }
  if (session.lastUpdateDate?.trim()) {
    fields.lastUpdateDate = clamp(session.lastUpdateDate, 40);
  }
  if (session.latestStatus?.trim()) {
    fields.latestStatus = clamp(session.latestStatus, 200);
  }
  if (session.issueTopic?.trim()) {
    fields.issueTopic = clamp(session.issueTopic, 200);
  }
  if (session.productSpec?.trim()) {
    fields.productSpec = clamp(session.productSpec, 300);
  }
  if (session.voucherTier?.trim()) {
    fields.voucherTier = clamp(session.voucherTier, 40);
  }

  try {
    if (existingFlowId) {
      await updateDoc(doc(db, path), fields);
    } else {
      await setDoc(doc(db, path), {
        ownerId: userId,
        ...fields,
        createdAt: serverTimestamp(),
      });
    }
    return flowId;
  } catch (error) {
    handleFirestoreError(
      error,
      existingFlowId ? OperationType.UPDATE : OperationType.CREATE,
      path
    );
  }
}

export async function deleteCloudChatFlowSession(
  userId: string,
  flowId: string
): Promise<void> {
  const safeId = sanitizeId(flowId);
  const path = `users/${userId}/chatFlows/${safeId}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
