import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
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
import { INITIAL_SCENARIOS } from "../data/scenarios";
import {
  AppliedRuleChange,
  AppliedScriptChange,
  ChatFlowSessionEntry,
  ChatFlowTurn,
  LearnedRuleUpdate,
  LearnedScriptUpdate,
  ScenarioCategory,
  ScriptPath,
  ScriptRow,
  ScriptScenario,
  StoreRuleEntry,
  ToneOption,
  UsageStatEntry,
  UsageStatEventType,
  UsageStatItemType,
  UsageTrackEventPayload,
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

function sanitizePaths(paths?: ScriptPath[]): ScriptPath[] | undefined {
  if (!Array.isArray(paths) || paths.length === 0) return undefined;
  return paths.slice(0, 10).map((p, idx) => ({
    id: sanitizeId(p.id || `path-${idx + 1}`),
    label: clamp(p.label || `Path ${idx + 1}`, 160),
    ...(p.cxTrigger?.trim() ? { cxTrigger: clamp(p.cxTrigger, 400) } : {}),
    rows: sanitizeRows(p.rows || []),
  }));
}

function sanitizeGuideIds(ids?: string[]): string[] | undefined {
  if (!Array.isArray(ids)) return undefined;
  const cleaned = ids
    .map((id) => (typeof id === "string" ? id.trim() : ""))
    .filter(Boolean)
    .slice(0, 6);
  return cleaned.length > 0 ? cleaned : undefined;
}

// ==========================================
// 1. CLOUD SCRIPT LIBRARY (All Scripts)
// ==========================================

export function subscribeCustomScripts(
  userId: string,
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
          const createdMs =
            data.createdAt instanceof Timestamp
              ? data.createdAt.toMillis()
              : Date.parse(createdIso) || 0;
          const sortOrder =
            typeof data.sortOrder === "number" ? data.sortOrder : 1000;
          return {
            createdMs,
            sortOrder,
            scenario: {
              id: d.id,
              number: sortOrder,
              sortOrder,
              title: String(data.title || "Untitled Script"),
              category:
                (data.category as ScenarioCategory) || ScenarioCategory.GENERAL,
              whenToUse: String(data.whenToUse || ""),
              policyRule: String(data.policyRule || ""),
              sampleInput: String(data.sampleInput || ""),
              rows: Array.isArray(data.rows) ? (data.rows as ScriptRow[]) : [],
              ...(Array.isArray(data.paths) && data.paths.length > 0
                ? { paths: data.paths as ScriptPath[] }
                : {}),
              ...(Array.isArray(data.guideIds) && data.guideIds.length > 0
                ? { guideIds: data.guideIds as string[] }
                : {}),
              isCustom: data.isCustom === false ? false : true,
            } satisfies ScriptScenario,
          };
        })
        .sort((a, b) => {
          if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
          return a.createdMs - b.createdMs;
        })
        .map((entry, idx) => ({
          ...entry.scenario,
          number: idx + 1,
        }));

      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function seedDefaultCloudCustomScriptsIfNeeded(
  userId: string
): Promise<void> {
  const userPath = `users/${userId}`;
  const scriptsPath = `users/${userId}/customScripts`;
  try {
    const userRef = doc(db, userPath);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.exists() ? userSnap.data() : null;

    const q = query(collection(db, scriptsPath), where("ownerId", "==", userId));
    const existingSnap = await getDocs(q);
    const existingById = new Map(existingSnap.docs.map((d) => [d.id, d.data()]));

    const batch = writeBatch(db);
    let mutationCount = 0;

    INITIAL_SCENARIOS.forEach((scenario) => {
      const safeId = sanitizeId(scenario.id);
      const safePaths = sanitizePaths(scenario.paths);
      const safeGuides = sanitizeGuideIds(scenario.guideIds);
      const existingData = existingById.get(safeId);

      if (!existingData) {
        batch.set(doc(db, `${scriptsPath}/${safeId}`), {
          ownerId: userId,
          title: clamp(scenario.title, 160),
          category: scenario.category,
          whenToUse: clamp(scenario.whenToUse, 600),
          policyRule: clamp(scenario.policyRule, 800),
          sampleInput: clamp(scenario.sampleInput, 2500),
          rows: sanitizeRows(scenario.rows),
          ...(safePaths ? { paths: safePaths } : {}),
          ...(safeGuides ? { guideIds: safeGuides } : {}),
          sortOrder: Math.min(1000, Math.max(0, scenario.number)),
          isCustom: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        mutationCount++;
        return;
      }

      // Safely upgrade unmodified built-in defaults when catalog rules/paths improve
      if (existingData.isCustom !== false) return;

      const rows = Array.isArray(existingData.rows) ? existingData.rows : [];
      const paths = Array.isArray(existingData.paths) ? existingData.paths : [];
      const hasSection = (kw: string) =>
        rows.some((r: Record<string, unknown>) =>
          String(r?.section || "").toLowerCase().includes(kw.toLowerCase())
        );

      const needsPlaybookUpgrade =
        (safeId === "s2" && !hasSection("Short circuit")) ||
        (safeId === "s4" && !hasSection("Normal gap")) ||
        ((safeId === "s10" || safeId === "s11") && !hasSection("Assurance")) ||
        (safeId === "s14" && paths.length < 3);

      if (needsPlaybookUpgrade) {
        batch.update(doc(db, `${scriptsPath}/${safeId}`), {
          title: clamp(scenario.title, 160),
          category: scenario.category,
          whenToUse: clamp(scenario.whenToUse, 600),
          policyRule: clamp(scenario.policyRule, 800),
          sampleInput: clamp(scenario.sampleInput, 2500),
          rows: sanitizeRows(scenario.rows),
          ...(safePaths ? { paths: safePaths } : {}),
          ...(safeGuides ? { guideIds: safeGuides } : {}),
          sortOrder: Math.min(1000, Math.max(0, scenario.number)),
          isCustom: false,
          updatedAt: serverTimestamp(),
        });
        mutationCount++;
      }
    });

    if (userSnap.exists() && userData?.scriptsSeeded !== true) {
      batch.update(userRef, {
        scriptsSeeded: true,
        updatedAt: serverTimestamp(),
      });
      mutationCount++;
    }

    if (mutationCount > 0) {
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, scriptsPath);
  }
}

export async function resetCloudCustomScriptsToDefaults(
  userId: string
): Promise<void> {
  const scriptsPath = `users/${userId}/customScripts`;
  try {
    const defaultIds = new Set(INITIAL_SCENARIOS.map((s) => sanitizeId(s.id)));
    const q = query(collection(db, scriptsPath), where("ownerId", "==", userId));
    const snap = await getDocs(q);
    const toDelete = snap.docs.filter((d) => defaultIds.has(d.id));
    if (toDelete.length > 0) {
      const deleteBatch = writeBatch(db);
      toDelete.forEach((d) => deleteBatch.delete(d.ref));
      await deleteBatch.commit();
    }

    const batch = writeBatch(db);
    INITIAL_SCENARIOS.forEach((scenario) => {
      const safeId = sanitizeId(scenario.id);
      const safePaths = sanitizePaths(scenario.paths);
      const safeGuides = sanitizeGuideIds(scenario.guideIds);
      batch.set(doc(db, `${scriptsPath}/${safeId}`), {
        ownerId: userId,
        title: clamp(scenario.title, 160),
        category: scenario.category,
        whenToUse: clamp(scenario.whenToUse, 600),
        policyRule: clamp(scenario.policyRule, 800),
        sampleInput: clamp(scenario.sampleInput, 2500),
        rows: sanitizeRows(scenario.rows),
        ...(safePaths ? { paths: safePaths } : {}),
        ...(safeGuides ? { guideIds: safeGuides } : {}),
        sortOrder: Math.min(1000, Math.max(0, scenario.number)),
        isCustom: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    batch.update(doc(db, `users/${userId}`), {
      scriptsSeeded: true,
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, scriptsPath);
  }
}

export async function createCloudCustomScript(
  userId: string,
  input: Omit<ScriptScenario, "id" | "number">
): Promise<string> {
  const scriptId = sanitizeId(`custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  const path = `users/${userId}/customScripts/${scriptId}`;
  const safePaths = sanitizePaths(input.paths);
  const safeGuides = sanitizeGuideIds(input.guideIds);
  try {
    await setDoc(doc(db, path), {
      ownerId: userId,
      title: clamp(input.title || "Custom Script", 160),
      category: input.category,
      whenToUse: clamp(input.whenToUse || "", 600),
      policyRule: clamp(input.policyRule || "", 800),
      sampleInput: clamp(input.sampleInput || "", 2500),
      rows: sanitizeRows(input.rows),
      ...(safePaths ? { paths: safePaths } : {}),
      ...(safeGuides ? { guideIds: safeGuides } : {}),
      sortOrder: Math.min(
        1000,
        Math.max(0, Math.round(typeof input.sortOrder === "number" ? input.sortOrder : 500))
      ),
      isCustom: input.isCustom === false ? false : true,
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
  const safePaths = sanitizePaths(input.paths);
  const safeGuides = sanitizeGuideIds(input.guideIds);
  const fields: Record<string, unknown> = {
    title: clamp(input.title || "Custom Script", 160),
    category: input.category,
    whenToUse: clamp(input.whenToUse || "", 600),
    policyRule: clamp(input.policyRule || "", 800),
    sampleInput: clamp(input.sampleInput || "", 2500),
    rows: sanitizeRows(input.rows),
    updatedAt: serverTimestamp(),
  };
  if (safePaths) {
    fields.paths = safePaths;
  }
  if (safeGuides) {
    fields.guideIds = safeGuides;
  }
  if (typeof input.sortOrder === "number") {
    fields.sortOrder = Math.min(1000, Math.max(0, Math.round(input.sortOrder)));
  }
  if (typeof input.isCustom === "boolean") {
    fields.isCustom = input.isCustom;
  }
  try {
    await updateDoc(doc(db, path), fields);
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

export async function applyLearnedScriptUpdates(
  userId: string,
  existingScenarios: ScriptScenario[],
  updates: LearnedScriptUpdate[]
): Promise<AppliedScriptChange[]> {
  const validUpdates = updates
    .filter(
      (u) =>
        u &&
        u.title?.trim() &&
        Array.isArray(u.rows) &&
        u.rows.length > 0
    )
    .slice(0, 2);

  if (validUpdates.length === 0) return [];

  const changes: AppliedScriptChange[] = [];
  let nextSortOrder = existingScenarios.reduce(
    (max, s) => Math.max(max, (s.sortOrder ?? s.number) + 1),
    existingScenarios.length + 1
  );

  for (const item of validUpdates) {
    const cleanTitle = clamp(item.title, 160);
    const cleanWhen = clamp(item.whenToUse || "Generalized Shopee Brazil CS scenario.", 600);
    const cleanRule = clamp(item.policyRule || "Follows Shopee Brazil store policy.", 800);
    const cleanSample = clamp(item.sampleInput || `${cleanTitle} > Customer asks about this scenario.`, 2500);
    const cleanRows = sanitizeRows(item.rows);
    const cleanGuides = sanitizeGuideIds(item.guideIds);
    const cleanCategory = Object.values(ScenarioCategory).includes(item.category)
      ? item.category
      : ScenarioCategory.GENERAL;

    const matchedById = item.existingScenarioId
      ? existingScenarios.find((s) => s.id === item.existingScenarioId)
      : undefined;
    const matchedByTitle = existingScenarios.find(
      (s) => s.title.toLowerCase().trim() === cleanTitle.toLowerCase()
    );
    const target = matchedById ?? matchedByTitle;

    if (target) {
      const resolvedGuides = cleanGuides ?? sanitizeGuideIds(target.guideIds);
      const sameRows =
        target.rows.length === cleanRows.length &&
        target.rows.every(
          (r, idx) =>
            r.section.trim() === cleanRows[idx].section &&
            r.english.trim() === cleanRows[idx].english &&
            r.portuguese.trim() === cleanRows[idx].portuguese
        );
      const sameGuides =
        (target.guideIds ?? []).join(",") === (resolvedGuides ?? []).join(",");
      if (
        target.title.trim() === cleanTitle &&
        target.whenToUse.trim() === cleanWhen &&
        target.policyRule.trim() === cleanRule &&
        sameRows &&
        sameGuides
      ) {
        continue;
      }

      await updateCloudCustomScript(userId, target.id, {
        title: cleanTitle,
        category: cleanCategory,
        whenToUse: cleanWhen,
        policyRule: cleanRule,
        sampleInput: cleanSample,
        rows: cleanRows,
        paths: target.paths,
        guideIds: resolvedGuides,
        sortOrder: target.sortOrder ?? target.number,
        isCustom: target.isCustom,
      });

      changes.push({
        action: "update",
        scenarioId: target.id,
        title: cleanTitle,
        reason: item.reason || "Updated generalized spiel in Script Library",
      });
    } else {
      const newId = await createCloudCustomScript(userId, {
        title: cleanTitle,
        category: cleanCategory,
        whenToUse: cleanWhen,
        policyRule: cleanRule,
        sampleInput: cleanSample,
        rows: cleanRows,
        guideIds: cleanGuides,
        sortOrder: Math.min(1000, nextSortOrder++),
        isCustom: true,
      });

      changes.push({
        action: "create",
        scenarioId: newId,
        title: cleanTitle,
        reason: item.reason || "Added new generalized scenario to Script Library",
      });
    }
  }

  return changes;
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
    if (snap.empty) {
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
      return;
    }

    const existingById = new Map(snap.docs.map((d) => [d.id, d.data()]));
    const hasCourierRule = snap.docs.some((d) => {
      const data = d.data();
      const text = `${String(data.topic || "")} ${String(data.english || "")}`.toLowerCase();
      return text.includes("anjun") && text.includes("correios");
    });

    const batch = writeBatch(db);
    let mutationCount = 0;

    for (const rule of DEFAULT_STORE_RULES) {
      const safeId = sanitizeId(rule.id);
      if (existingById.has(safeId)) continue;
      if (safeId === "default-13" && hasCourierRule) continue;

      batch.set(doc(db, `${path}/${safeId}`), {
        ownerId: userId,
        topic: clamp(rule.topic, 160),
        english: clamp(rule.english, 2000),
        portuguese: clamp(rule.portuguese, 2000),
        isPrimary: Boolean(rule.isPrimary),
        sortOrder: rule.sortOrder,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      mutationCount++;
    }

    const rulesToSync: Array<{ id: string; legacyPrefixes: string[]; checkPresent: string }> = [
      {
        id: "default-3",
        legacyPrefixes: [
          "Format dates in Brazilian DD/MM/YYYY",
        ],
        checkPresent: "IF within the 5–14 days schedule",
      },
      {
        id: "default-4",
        legacyPrefixes: ["Never say an order in customs inspection is lost"],
        checkPresent: "never promise a specific delivery date",
      },
      {
        id: "default-7",
        legacyPrefixes: ["Never promise an immediate refund. Always request a short video"],
        checkPresent: "Short circuit",
      },
      {
        id: "default-11",
        legacyPrefixes: [
          "Every cancellation, refund, delivery delay",
          "Every Reply Generator response must include an explicit Assurance row confirming their order/money is protected by Shopee Guarantee (and for Est. Delivery inquiries",
        ],
        checkPresent: "if past EDD or >14 days, do NOT mention 5–14 days",
      },
      {
        id: "default-15",
        legacyPrefixes: [
          "When the Estimated Delivery Date has passed yet tracking shows a fresh update today, acknowledge",
        ],
        checkPresent: "do NOT mention 5–14 days anymore",
      },
    ];
    for (const item of rulesToSync) {
      const existingData = existingById.get(item.id);
      const latestDefault = DEFAULT_STORE_RULES.find((r) => r.id === item.id);
      if (!existingData || !latestDefault) continue;
      const currentEn = String(existingData.english || "");
      const hasUpdate = currentEn.includes(item.checkPresent);
      const matchesLegacy = item.legacyPrefixes.some((p) => currentEn.startsWith(p));
      if (!hasUpdate && matchesLegacy) {
        batch.update(doc(db, `${path}/${item.id}`), {
          topic: clamp(latestDefault.topic, 160),
          english: clamp(latestDefault.english, 2000),
          portuguese: clamp(latestDefault.portuguese, 2000),
          isPrimary: Boolean(latestDefault.isPrimary),
          sortOrder: latestDefault.sortOrder,
          updatedAt: serverTimestamp(),
        });
        mutationCount++;
      }
    }

    if (mutationCount > 0) {
      await batch.commit();
    }
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
    ...(sanitizeGuideIds(t.suggestedGuideIds)
      ? { suggestedGuideIds: sanitizeGuideIds(t.suggestedGuideIds) }
      : {}),
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

// ==========================================
// 6. CLOUD USAGE STATISTICS (Scripts & Rules)
// ==========================================

export function subscribeUsageStats(
  userId: string,
  onData: (stats: UsageStatEntry[]) => void
) {
  const path = `users/${userId}/usageStats`;
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
            id: d.id,
            itemType:
              data.itemType === "rule"
                ? ("rule" as UsageStatItemType)
                : ("script" as UsageStatItemType),
            itemId: String(data.itemId || ""),
            itemTitle: String(data.itemTitle || "Untitled"),
            category: String(data.category || ""),
            appliedCount:
              typeof data.appliedCount === "number" ? data.appliedCount : 0,
            accessedCount:
              typeof data.accessedCount === "number" ? data.accessedCount : 0,
            lastEvent:
              data.lastEvent === "accessed"
                ? ("accessed" as UsageStatEventType)
                : ("applied" as UsageStatEventType),
            createdAt,
            updatedAt,
          } satisfies UsageStatEntry;
        })
        .sort(
          (a, b) =>
            b.appliedCount + b.accessedCount - (a.appliedCount + a.accessedCount)
        );

      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function recordCloudUsageEvents(
  userId: string,
  events: UsageTrackEventPayload[]
): Promise<void> {
  if (!userId || events.length === 0) return;

  const aggregated = new Map<
    string,
    {
      statId: string;
      itemType: UsageStatItemType;
      itemId: string;
      itemTitle: string;
      category: string;
      appliedDelta: number;
      accessedDelta: number;
      lastEvent: UsageStatEventType;
    }
  >();

  for (const ev of events) {
    if (!ev.itemId?.trim()) continue;
    const safeItemId = sanitizeId(ev.itemId).slice(0, 110);
    const statId = sanitizeId(`${ev.itemType}_${safeItemId}`);
    const cleanTitle = clamp(
      ev.itemTitle || (ev.itemType === "script" ? "CS Script" : "Store Rule"),
      200
    );
    const cleanCategory = clamp(
      ev.category || (ev.itemType === "script" ? "General" : "Policy"),
      80
    );
    const existing = aggregated.get(statId);
    if (existing) {
      if (ev.event === "applied") existing.appliedDelta += 1;
      else existing.accessedDelta += 1;
      existing.itemTitle = cleanTitle;
      existing.category = cleanCategory;
      existing.lastEvent = ev.event;
    } else {
      aggregated.set(statId, {
        statId,
        itemType: ev.itemType,
        itemId: safeItemId,
        itemTitle: cleanTitle,
        category: cleanCategory,
        appliedDelta: ev.event === "applied" ? 1 : 0,
        accessedDelta: ev.event === "accessed" ? 1 : 0,
        lastEvent: ev.event,
      });
    }
  }

  const basePath = `users/${userId}/usageStats`;
  for (const entry of aggregated.values()) {
    const docPath = `${basePath}/${entry.statId}`;
    const ref = doc(db, docPath);
    try {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const updateFields: Record<string, unknown> = {
          itemTitle: entry.itemTitle,
          category: entry.category,
          lastEvent: entry.lastEvent,
          updatedAt: serverTimestamp(),
        };
        if (entry.appliedDelta > 0) {
          updateFields.appliedCount = increment(entry.appliedDelta);
        }
        if (entry.accessedDelta > 0) {
          updateFields.accessedCount = increment(entry.accessedDelta);
        }
        await updateDoc(ref, updateFields);
      } else {
        await setDoc(ref, {
          ownerId: userId,
          itemType: entry.itemType,
          itemId: entry.itemId,
          itemTitle: entry.itemTitle,
          category: entry.category,
          appliedCount: entry.appliedDelta,
          accessedCount: entry.accessedDelta,
          lastEvent: entry.lastEvent,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  }
}

export async function resetCloudUsageStats(userId: string): Promise<void> {
  const path = `users/${userId}/usageStats`;
  try {
    const q = query(collection(db, path), where("ownerId", "==", userId));
    const snap = await getDocs(q);
    if (snap.empty) return;
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
