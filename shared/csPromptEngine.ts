import { VISUAL_GUIDES, buildVisualGuidesPromptReference } from "./visualGuides.ts";
import { analyzeBrazilianSlangAndTone } from "./slangToneDetector.ts";

export const SYSTEM_INSTRUCTION = `You are a senior CS Agent for a Shopee Brazil (Shopee Brasil) seller store.
Input is either "Order/Product > CX Concern" or a raw Shopee Seller Center paste (Order SN, Product, Tracking, Carrier, Estimated Delivery, Latest Logistic Date, timeline, "CX> ...", trailing agent notes).
Generate a warm, polite, policy-compliant reply split sentence-by-sentence into "rows":
1. "english": Natural English for the agent.
2. "portuguese": Warm, natural PT-BR ready to paste in Shopee Seller Chat.

HARD GUARDRAILS (NEVER VIOLATE):
- NEVER say "lost" or volunteer "refund" unless CX explicitly asks for a refund.
- NEVER invent/promise a specific delivery day/date, invent product specs (cite listing info only), or confirm charged billing/installments as seller.

MANDATORY SHOPEE BRAZIL POLICIES:
1. NO DIRECT STORE REFUNDS & REFUND TIMING:
   - Store NEVER issues direct refunds (no Pix/bank transfer). All payments/refunds go strictly through Shopee.
   - Refund request on order in transit:
     * Acknowledge latest tracking status & date (DD/MM/YYYY, strip "+0800") + include BOTH courier follow-up phrases ("we follow up this to courier" / "we expedite follow your order to courier" -> "nós acompanhamos isso junto à transportadora" / "aceleramos o acompanhamento do seu pedido junto à transportadora").
     * CASE A (WITHIN Estimated Delivery Date): Tell CX to **refuse package upon delivery** OR **submit Shopee webform**: https://help.shopee.com.br/portal/webform/d75e2dbb49594bd19d1ea83485339a45?entryPoint=1&lastArticleID=
     * CASE B (PAST/BEYOND Estimated Delivery Date): Tell CX to tap **"Return/Refund" ("Devolução/Reembolso")** in Shopee app (do NOT send webform here).
   - Include Shopee Guarantee ("Garantia Shopee") assuring money is safe and refunded immediately once accepted.

2. DELIVERY INQUIRY / DELAY / CUSTOMS / EXPEDITE / DE-ESCALATION:
   - Format dates DD/MM/YYYY. Share Tracking Number, Actual Assigned Courier, Estimated Delivery Date, and Latest Status if provided.
   - ACTUAL COURIER MAPPING (never say "Expresso padrão" when tracking exists):
     * Starts with "BR" -> **SPX** | Starts with "AJ" -> **Anjun Express** | Other tracking -> **Correios**.
   - CRITICAL 5–14 DAYS vs. PAST SCHEDULE RULE:
     * IF WITHIN 5–14 DAYS SCHEDULE (within 5–14d window AND not past EDD): Reassure ("no worries") that EDD is only an estimate and international orders usually arrive in **5–14 days** ("Fique tranquilo, pois essa data é apenas uma estimativa — normalmente os pedidos internacionais chegam em apenas 5 a 14 dias."), plus Shopee Guarantee.
     * ELSE (PAST EDD OR >14 DAYS): **STRICTLY DO NOT mention "5–14 days" ("5 a 14 dias")!** Lead with warm **Empathy** apologizing for the delay beyond schedule, include BOTH courier follow-up phrases ("we follow up this to courier" & "we expedite follow your order to courier" -> "nós acompanhamos isso junto à transportadora" & "aceleramos o acompanhamento do seu pedido junto à transportadora"), confirm parcel is safe (not lost), and reassure under Shopee Guarantee ("Garantia Shopee").
   - Context notes: Normal international transit has silent gaps between countries. Customs ("inspeção na alfândega") is handled by local authorities. Past EDD with today's scan: acknowledge missed EDD honestly and highlight today's new scan. Threats (Procon, Reclame Aqui, lawyer): stay calm/empathetic, never argue, never promise fixed date; only mention Return/Refund if CX demands money back. Expedite request: seller can't control courier speed/route, yet we follow up & expedite with courier (quote ship-out date if in preparation).

3. PRODUCT DEFECT: Ask for short video/photo first (never guarantee return/refund on the spot); team will review. Share 4 checks if relevant: 1. Power/voltage/current, 2. Overheating/ventilation, 3. Loose cables/connections, 4. Short circuit/wire insulation.

4. DELIVERED BUT NOT RECEIVED: Seller does not control final delivery; ask CX to check neighbors, family, or building concierge ("porteiro"), and if not found tap "Return/Refund" ("Devolução/Reembolso") in Shopee app.

5. CANCEL ORDER (BY STATUS):
   - Store cannot cancel directly or issue direct refunds; transactions belong to Shopee.
   - IN PREPARATION (not shipped/TO_SHIP): Tell CX to tap "Cancel Order" ("Cancelar pedido") in app. If button unavailable, explain payment already went to Taxes & Shipping costs, and reassure ("no worries") they can cancel via Shopee webform: https://help.shopee.com.br/portal/webform/d75e2dbb49594bd19d1ea83485339a45?entryPoint=1&lastArticleID= (Do NOT say refuse delivery.)
   - ALREADY SHIPPED (PICKUP_DONE/in transit): Within EDD -> refuse upon delivery or use webform above. Past EDD -> tap "Return/Refund" ("Devolução/Reembolso") in app. (Do NOT say "Cancel Order" button or Taxes+Shipping.)

6. POSITIVE / EARLY-STAGE:
   - Already received, tracking un-updated: reassure warmly driver just needs time to scan delivered (NO delay boilerplate).
   - Order just paid ("hope it arrives soon"): match warm tone, share status/tracking/5–14d EDD + Shopee Guarantee (NO follow-up escalation boilerplate).

7. DELIVERY TIME PREFERENCE / PRODUCT SPECS / ADDRESS UPDATE:
   - Time preference: seller cannot control courier routes/hours; local courier decides.
   - Specs: answer strictly from agent-provided info only; otherwise invite CX to check listing description.
   - Address/description: delivery strictly follows shipping label address; advise updating/removing old notes in Shopee app before ship-out.

8. PLATFORM SCOPE (Shopee Coins, ShopeePay, app bugs, canceled discrepancy, invalid/unpaid order, Airpay/installments):
   - Clarify seller handles products/shipping only (never confirm charged amounts); for discrepancies/invalid orders state what system actually shows; redirect billing/platform issues to Shopee Help Center ("Eu" -> "Central de Ajuda" / "Atendimento").

9. POOR QUALITY / MISSING PART / DAMAGE (TWO-STAGE):
   - STAGE 1 (no proof yet): Express warm empathy (e.g., glad they liked style/design, apologize for quality/damage/missing part like earring clutch/"tarraxa"), ask for short video/photo proof, and assure: "Rest assured we will make sure you won't be at a loss on this, and your purchase is protected by Shopee Guarantee." / "Fique tranquilo, pois garantiremos que você não saia no prejuízo com isso e a sua compra continua protegida pela Garantia Shopee."
   - STAGE 2 (CX sent proof): Thank warmly. Check item price (prefer unit price over Grand Total):
     * IF <= R$25: Never mention R$25 rule. Pick tier R$5/R$10/R$15/R$20/R$25 >= item price (e.g., R$11,77->R$15; R$23->R$25). Offer 2 exact options:
       1. Keep item + R$[VOUCHER] Store Voucher (fastest, no return needed).
       2. Return & Refund (send back for full refund once received).
     * IF > R$25: Escalate to higher team for best solution; update in chat within 24–48h.
   - STAGE 3A (Accepts Option 1): Confirm keeping item + sending R$[VOUCHER] store voucher for next order.
   - STAGE 3B (Chooses Option 2): Guide to tap "Return/Refund" ("Devolução/Reembolso") in Shopee app; full refund once received.

10. PAID ORDER SHOWS AS UNPAID:
    - Store has no access to payment processing; reassure "no worries" it updates in <24h; if >24h contact Shopee ("Eu" -> "Central de Ajuda") with receipt. Assure Shopee Guarantee and immediate ship-out once confirmed.

MANDATORY ASSURANCE & EMPATHY (EVERY REPLY & EVERY PATH):
- ASSURANCE (REQUIRED IN EVERY RESPONSE): Always include an explicit "Assurance" row ("isKeyRule": true) affirming Shopee Guarantee ("Garantia Shopee") + courier follow-up when in transit/delayed. (If within 5–14d schedule/EDD, include 5–14d reassurance; if past 5–14d/EDD, NEVER mention 5–14 days—use Empathy + courier follow-up + Shopee Guarantee.)
- EMPATHY (WHEN NEEDED): For frustration, anger, threats, worry, delay, defect, damage, missing item, non-receipt, cancellation, refund, or payment concern, include a warm Empathy sentence apologizing sincerely before steps/policy. For neutral/positive questions, match friendly tone without over-apologizing, still keeping the Assurance row.

FORMATTING & SELF-LEARNING RULES:
- Follow Selected CX Response Path & Guidance (or generate ALL items in "pathReplies" when "All CX Response Paths to Generate" is provided, keeping top-level rows matched to primary path).
- Use real Order SN, product, courier, tracking, voucher, and DD/MM/YYYY dates from input (only use [DATE]/[TRACKING] placeholders if missing). Join rows cleanly into "fullEnglishMessage" and "fullPortugueseMessage".
- "learnedScriptUpdates": Emit "create" if case introduces a NEW scenario not in Existing Script Library Scenarios, or "update" (with "existingScenarioId") if handling/policy changes. Must be generalized with placeholders ([DATE], [TRACKING], [STATUS], [VOUCHER], [ISSUE TOPIC], [INSERT SPEC]), 3–7 rows ("highlight": true on key rules), and 0–3 "guideIds". Return [] if already covered.
- "learnedRuleUpdates": Emit "create" or "update" (with "existingRuleId") for NEW/changed reusable Store Rules, thresholds, links, or workflows not already in Active Store CS Rules. Return [] only if fully covered.

SHOPEE BR UI LABELS:
- Return/Refund: "Eu" -> "A Caminho" -> "Pedir reembolso" ("Devolução/Reembolso")
- Partial Refund: "Eu" -> "Devolução/Reembolso" -> "Ver Reembolso parcial" -> "Aceitar Reembolso Parcial" -> "Confirmar"
- Cancel (Prep): "Minhas compras" -> "A Enviar" -> "Cancelar Pedido" -> "CONFIRMAR"
- Change Address: "A Pagar" -> "MODIFICAR" next to "Endereço de Entrega"
- Voucher: "Eu" -> "Cupons" -> "Loja" -> "Usar"; or Cart -> "Cupom Shopee" -> "Aplicar" -> "OK"
- Shopee CS: "Eu" -> "Central de Ajuda" -> "Chat Shopee" (Seg–Sex 08h–22h, Sáb–Dom 08h–20h)
- Copy Order ID: "Minhas compras" -> "ID do Pedido" -> "COPIAR" | Seller Chat: Home Chat / "Chat Vendedor"

${buildVisualGuidesPromptReference()}`;

export const CHAT_FLOW_INSTRUCTION = `
LIVE CHAT FLOW WITH PROBING QUESTIONS & CHOICES MODE:
You are generating the NEXT turn in an active multi-turn Shopee Brazil live customer chat.
- Read the full Order Context, Conversation History so far, and the Latest CX Message carefully.
- Do NOT repeat full boilerplate from earlier turns if already addressed, UNLESS the latest CX question needs that policy reminder (e.g., if CX pushes back asking for a refund or refuses proof, re-clarify Shopee Guarantee & the exact Return/Refund or webform rule cleanly).
- PROBING QUESTIONS:
  * Unless the conversation is completely resolved and CX confirmed satisfaction, include 1–2 concise, warm, helpful probing questions (in BOTH a dedicated "Probing Question" row in "rows" AND in the "probingQuestions" array, and naturally included in "fullEnglishMessage" & "fullPortugueseMessage") to uncover missing facts or guide CX to choose a clear next step.
  * Examples of smart probing questions by scenario:
    - Poor Quality / Missing Part / Damage (before proof): Ask CX to send a quick photo/video AND confirm whether only a part is missing (like an earring clutch) or if the item itself is damaged.
    - Poor Quality / Missing Part / Damage (proof received & <= R$25): Present Option 1 (Keep item + R$[VOUCHER] Store Voucher) and Option 2 (Return & Refund) AND probe cleanly: "Which of these two options works best for you—Option 1 to keep the item with the voucher, or Option 2 to return and refund?"
    - Delivered But Not Received: Probe whether they checked with family members, neighbors, or the building concierge ("porteiro"), and ask if they'd like step-by-step guidance to tap "Return/Refund" if nobody received it.
    - Unpaid / Already Paid Order: Probe how long ago they paid (less than 24h vs more than 24h) and via which method (Pix/Boleto/Card) so we can advise accurately.
    - Product Defect: Probe whether they checked power/connections/ventilation and ask for a short demonstration video.
    - Cancel Order: Probe whether the "Cancelar pedido" button still appears in their app (if in prep) or if they prefer refusing upon delivery / Shopee webform (if shipped within Est. Date) or Return/Refund (if beyond Est. Date).
    - Delivery / Customs / Expedite: Confirm tracking, courier follow-up, and probe if they received any SMS/courier contact attempt or if the delivery address/phone in Shopee is up to date.
- NEXT CX CHOICES ("nextChoices"):
  * Predict 3 to 5 realistic, distinct next replies or decisions the customer might send AFTER reading your message & probing questions.
  * Each choice MUST have:
    - "id": short slug (e.g., "sent-proof", "chose-option-1", "chose-option-2", "paid-over-24h")
    - "label": short crisp agent button label under 45 chars (e.g., "CX sends video/photo proof", "CX accepts Option 1 (Voucher)", "CX asks for direct Pix refund")
    - "cxMessage": realistic 1–2 sentence customer reply in English/Portuguese context (e.g., "CX: I'm sending the photo now—please check, the clutch didn't come in the bag.")
    - "kind": one of "probing-answer" (answers your probing question), "choice" (picks an option/preference), "escalate" (pushes back / asks refund / over limit), or "resolve" (confirms resolved / thanks)
`;

export interface RequestedPathInput {
  id: string;
  label: string;
  cxTrigger?: string;
  guidance: string;
}

export interface StoreRuleContext {
  id?: string;
  topic: string;
  english: string;
  portuguese: string;
  isPrimary?: boolean;
}

export interface ScriptScenarioContext {
  id: string;
  title: string;
  category: string;
  whenToUse: string;
  policyRule: string;
}

export interface GenerateReplyRequest {
  input: string;
  trackingNumber?: string;
  carrierName?: string;
  estimatedDate?: string;
  lastUpdateDate?: string;
  latestStatus?: string;
  issueTopic?: string;
  productSpec?: string;
  tone?: string;
  aiProvider?: "auto" | "gemini" | "groq" | "openrouter";
  aiModel?: string;
  slangToneHint?: string;
  detectedAmount?: string;
  voucherTier?: string;
  selectedScenarioTitle?: string;
  selectedPathLabel?: string;
  selectedPathTrigger?: string;
  selectedPathGuidance?: string;
  requestedPaths?: RequestedPathInput[];
  customStoreRules?: StoreRuleContext[];
  existingScenarios?: ScriptScenarioContext[];
}

export interface ChatFlowRequest {
  orderContext: string;
  latestCxMessage: string;
  conversationHistory?: Array<{ role: "cx" | "agent"; text: string }>;
  includeProbingQuestions?: boolean;
  probingFocus?: string;
  trackingNumber?: string;
  carrierName?: string;
  estimatedDate?: string;
  lastUpdateDate?: string;
  latestStatus?: string;
  issueTopic?: string;
  productSpec?: string;
  tone?: string;
  aiProvider?: "auto" | "gemini" | "groq" | "openrouter";
  aiModel?: string;
  slangToneHint?: string;
  detectedAmount?: string;
  voucherTier?: string;
  customStoreRules?: StoreRuleContext[];
}

export function parseDateOnlyToIso(raw?: string): string | null {
  if (!raw) return null;
  const isoMatch = raw.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  const brMatch = raw.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (brMatch) return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`;
  return null;
}

export function extractOrderSnDateIso(rawText: string): string | null {
  const snMatch = rawText.match(/\bOrder\s*(?:SN|#)?\s*[:\n\s#]*(\d{2})(\d{2})(\d{2})[A-Z0-9]{6,}/i);
  if (!snMatch) return null;
  const yy = Number.parseInt(snMatch[1], 10);
  const mm = Number.parseInt(snMatch[2], 10);
  const dd = Number.parseInt(snMatch[3], 10);
  if (yy < 20 || yy > 35 || mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  return `20${String(yy).padStart(2, "0")}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
}

export function diffCalendarDays(laterIso: string, earlierIso: string): number | null {
  const laterMs = Date.parse(`${laterIso}T00:00:00Z`);
  const earlierMs = Date.parse(`${earlierIso}T00:00:00Z`);
  if (Number.isNaN(laterMs) || Number.isNaN(earlierMs)) return null;
  return Math.round((laterMs - earlierMs) / 86_400_000);
}

export interface DeliveryScheduleEvaluation {
  todayIso: string;
  estimatedIso: string | null;
  startIso: string | null;
  daysElapsed: number | null;
  isPastEdd: boolean;
  isOver14Days: boolean;
  isWithin5to14Schedule: boolean;
  statusLabel: "within-5-14" | "past-edd" | "over-14-days";
  promptDirective: string;
}

export function evaluateDeliveryScheduleStatus(params: {
  rawText: string;
  estimatedDate?: string;
  lastUpdateDate?: string;
  todayIso?: string;
}): DeliveryScheduleEvaluation {
  const todayIso = params.todayIso ?? getBrazilTodayIso();
  const rawEstFromInput = params.rawText.match(
    /Estimated\s*Delivery\s*Time\s*[:\n\s]*([^\n]+)/i
  )?.[1];
  const estimatedIso =
    parseDateOnlyToIso(params.estimatedDate) ??
    parseDateOnlyToIso(rawEstFromInput);

  const shipOutRaw = params.rawText.match(
    /(?:Ship\s*Out\s*Date|Payment\s*Date|Order\s*Time|Create\s*Time)\s*[:\n\s]*([^\n]+)/i
  )?.[1];
  const startIso =
    parseDateOnlyToIso(shipOutRaw) ??
    extractOrderSnDateIso(params.rawText) ??
    parseDateOnlyToIso(params.lastUpdateDate);

  const daysElapsedRaw = startIso ? diffCalendarDays(todayIso, startIso) : null;
  const daysElapsed =
    daysElapsedRaw !== null && daysElapsedRaw >= 0 && daysElapsedRaw <= 365
      ? daysElapsedRaw
      : null;

  const explicitPastMention = /\b(?:past\s*(?:the\s*)?edd|beyond\s*est(?:imated)?|passou\s*(?:da\s*)?data|ultrapass(?:ou|ado)|prazo\s*(?:já\s*)?venc|vencido)\b/i.test(
    params.rawText
  );

  const isPastEdd = Boolean(
    (estimatedIso && estimatedIso < todayIso) || explicitPastMention
  );
  const isOver14Days = Boolean(daysElapsed !== null && daysElapsed > 14);
  const isWithin5to14Schedule = !isPastEdd && !isOver14Days;

  const statusLabel: DeliveryScheduleEvaluation["statusLabel"] = isPastEdd
    ? "past-edd"
    : isOver14Days
      ? "over-14-days"
      : "within-5-14";

  let promptDirective: string;
  if (!isWithin5to14Schedule) {
    const reasonDetail = isPastEdd
      ? estimatedIso
        ? `Estimated Delivery Date (${estimatedIso}) is earlier than today (${todayIso})`
        : "Order is explicitly beyond the Estimated Delivery Date"
      : `Elapsed time (${daysElapsed} days since ${startIso}) exceeds the 5–14 day schedule`;

    promptDirective = [
      `Delivery Schedule & Assurance Rule (OUTSIDE / PAST 5–14 DAYS SCHEDULE — ${reasonDetail}):`,
      `1. STRICTLY DO NOT MENTION "5–14 days" ("5 a 14 dias") anywhere in English or Portuguese!`,
      `2. Lead with warm EMPATHY sincerely apologizing for the delay past schedule.`,
      `3. Explicitly assure the customer we are following up with the assigned courier ("we follow up this to courier" and "we expedite follow your order to courier" -> "nós acompanhamos isso junto à transportadora" and "aceleramos o acompanhamento do seu pedido junto à transportadora") + Shopee Guarantee ("Garantia Shopee").`,
      isPastEdd
        ? `4. Because it is past EDD, if CX is requesting a refund/cancellation, instruct them to tap "Return/Refund" ("Devolução/Reembolso") in the Shopee app (do NOT send the webform link).`
        : null,
    ]
      .filter(Boolean)
      .join(" ");
  } else {
    promptDirective = [
      `Delivery Schedule & Assurance Rule (WITHIN 5–14 DAYS SCHEDULE${
        estimatedIso ? ` — Est. ${estimatedIso} >= ${todayIso}` : ""
      }${daysElapsed !== null ? `, ${daysElapsed}d elapsed` : ""}):`,
      `1. Reassure the customer ("no worries") that the estimated delivery date is only an estimate and international orders usually arrive within 5–14 days ("Fique tranquilo, pois essa data é apenas uma estimativa — normalmente os pedidos internacionais chegam em apenas 5 a 14 dias.").`,
      `2. Also provide Shopee Guarantee ("Garantia Shopee") assurance, and if the customer is asking to rush/wait/delayed/customs, include courier follow-up ("we follow up this to courier" / "we expedite follow your order to courier").`,
      `3. If in transit within EDD and requesting a refund/cancel, inform CX they can refuse delivery upon arrival or submit via Shopee's official webform.`,
    ].join(" ");
  }

  return {
    todayIso,
    estimatedIso,
    startIso,
    daysElapsed,
    isPastEdd,
    isOver14Days,
    isWithin5to14Schedule,
    statusLabel,
    promptDirective,
  };
}

export function getBrazilTodayIso(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")?.value ?? "2026";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${d}`;
}

export function isGenericExpressCarrier(carrier?: string): boolean {
  if (!carrier) return true;
  const norm = carrier
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  return (
    !norm ||
    norm === "expresso padrao" ||
    norm === "express padrao" ||
    norm === "standard express" ||
    norm === "shopee express padrao"
  );
}

export function resolveCourierFromTracking(
  trackingNumber?: string,
  rawCarrier?: string
): string | undefined {
  const trimmedCarrier = rawCarrier?.trim();
  const trimmedTracking = trackingNumber?.trim().toUpperCase();
  if (trimmedCarrier && !isGenericExpressCarrier(trimmedCarrier)) {
    return trimmedCarrier;
  }
  if (trimmedTracking) {
    if (trimmedTracking.startsWith("BR")) return "SPX";
    if (trimmedTracking.startsWith("AJ")) return "Anjun Express";
    return "Correios";
  }
  return trimmedCarrier || undefined;
}

export function extractTrackingFromText(rawText: string): string | undefined {
  const match = rawText.match(
    /Shipping\s*Tracking\s*No\s*[:\n\s]*([A-Z0-9]{6,})/i
  );
  if (match?.[1] && !/Shipping/i.test(match[1])) {
    return match[1].trim();
  }
  return undefined;
}

export function computeServerVoucherTier(rawText: string): string | null {
  const unitPriceMatch = rawText.match(/R\$\s*(\d+(?:[.,]\d{2}))\s*x\s*\d+/i);
  const grandTotalMatch = rawText.match(
    /(?:Grand\s*Total|Total)\s*[:\n\s]*R\$\s*(\d+(?:[.,]\d{2}))/i
  );
  const rawPrice = unitPriceMatch?.[1] ?? grandTotalMatch?.[1];
  if (!rawPrice) return null;
  const numeric = Number.parseFloat(rawPrice.replace(",", "."));
  if (Number.isNaN(numeric) || numeric <= 0 || numeric > 25) return null;
  if (numeric <= 5) return "R$5";
  if (numeric <= 10) return "R$10";
  if (numeric <= 15) return "R$15";
  if (numeric <= 20) return "R$20";
  return "R$25";
}

export const ROW_ITEM_SCHEMA: Record<string, unknown> = {
  type: "OBJECT",
  properties: {
    section: {
      type: "STRING",
      description:
        "Row label such as Greeting, Current Status, Policy Reminder, Action Required, Probing Question, Assurance, Closing.",
    },
    english: {
      type: "STRING",
      description: "Complete English sentence(s) for the agent to understand.",
    },
    portuguese: {
      type: "STRING",
      description:
        "Complete Brazilian Portuguese sentence(s) ready to send to the customer.",
    },
    isKeyRule: {
      type: "BOOLEAN",
      description:
        "True if this row contains a mandatory store rule, critical customer action, or Shopee Guarantee assurance.",
    },
  },
  required: ["section", "english", "portuguese", "isKeyRule"],
};

const VALID_GUIDE_IDS = VISUAL_GUIDES.map((g) => g.id);

export const SUGGESTED_GUIDE_IDS_SCHEMA: Record<string, unknown> = {
  type: "ARRAY",
  description:
    "0 to 3 relevant official Shopee Brazil visual guide screenshot IDs that help the customer follow the steps or check refund SLAs.",
  items: {
    type: "STRING",
    enum: VALID_GUIDE_IDS,
  },
};

export function buildGenerateReplyPromptAndSchema(
  body: GenerateReplyRequest,
  rawInput: string
) {
  const todayIso = getBrazilTodayIso();
  const [ty, tm, td] = todayIso.split("-");
  const todayBr = `${td}/${tm}/${ty}`;

  const scheduleEval = evaluateDeliveryScheduleStatus({
    rawText: rawInput,
    estimatedDate: body.estimatedDate,
    lastUpdateDate: body.lastUpdateDate,
    todayIso,
  });
  const deliveryWindowHint = scheduleEval.promptDirective;
  const slangAnalysis = analyzeBrazilianSlangAndTone(rawInput);
  const slangToneHint =
    body.slangToneHint?.trim() || slangAnalysis.promptHint || null;

  const resolvedVoucherTier =
    body.voucherTier?.trim() || computeServerVoucherTier(rawInput);

  const resolvedTracking =
    body.trackingNumber?.trim() || extractTrackingFromText(rawInput);
  const rawCarrierFromInput = rawInput
    .match(/Shipping\s*Carrier\s*Name\s*[:\n\s]*([^\n]+)/i)?.[1]
    ?.trim();
  const resolvedCourier = resolveCourierFromTracking(
    resolvedTracking,
    body.carrierName?.trim() || rawCarrierFromInput
  );

  const requestedPaths = Array.isArray(body.requestedPaths)
    ? body.requestedPaths.filter((p) => p && p.id && p.label)
    : [];

  const allPathsInstruction =
    requestedPaths.length > 0
      ? `All CX Response Paths to Generate (MUST return one item in "pathReplies" for EACH path below using its exact pathId and pathLabel):\n${requestedPaths
          .map(
            (p) =>
              `### pathId="${p.id}" | pathLabel="${p.label}"${
                p.cxTrigger ? ` | trigger="${p.cxTrigger}"` : ""
              }\n${p.guidance}`
          )
          .join("\n\n")}`
      : null;

  const contextLines = [
    `Agent Case Input:\n${rawInput}`,
    `Current Date (Brazil DD/MM/YYYY): ${todayBr}`,
    deliveryWindowHint,
    body.detectedAmount?.trim()
      ? `Detected Product Amount: ${body.detectedAmount.trim()}`
      : null,
    resolvedVoucherTier
      ? `Eligible Store Voucher Tier (<= R$25 rule): ${resolvedVoucherTier}`
      : null,
    body.selectedScenarioTitle?.trim()
      ? `Selected Scenario: ${body.selectedScenarioTitle.trim()}`
      : null,
    body.selectedPathLabel?.trim()
      ? `Primary Selected CX Response Path: ${body.selectedPathLabel.trim()}`
      : null,
    body.selectedPathTrigger?.trim()
      ? `Primary Path Trigger Context: ${body.selectedPathTrigger.trim()}`
      : null,
    body.selectedPathGuidance?.trim()
      ? `Primary Path Guidance:\n${body.selectedPathGuidance.trim()}`
      : null,
    allPathsInstruction,
    resolvedCourier
      ? `Assigned Shipping Carrier (Actual Courier): ${resolvedCourier}${
          resolvedTracking
            ? ` (resolved from tracking ${resolvedTracking}; name ${resolvedCourier} instead of "Expresso padrão")`
            : ""
        }`
      : null,
    resolvedTracking ? `Tracking Number: ${resolvedTracking}` : null,
    body.lastUpdateDate?.trim()
      ? `Last Tracking Update Date: ${body.lastUpdateDate.trim()}`
      : null,
    body.estimatedDate?.trim()
      ? `Estimated Delivery Date: ${body.estimatedDate.trim()}`
      : null,
    body.latestStatus?.trim()
      ? `Latest Order / Tracking Status: ${body.latestStatus.trim()}`
      : null,
    body.issueTopic?.trim()
      ? `Platform Issue Topic: ${body.issueTopic.trim()}`
      : null,
    body.productSpec?.trim()
      ? `Product Specification Detail: ${body.productSpec.trim()}`
      : null,
    Array.isArray(body.customStoreRules) && body.customStoreRules.length > 0
      ? `Active Store CS Rules:\n${body.customStoreRules
          .map((r) => `- ${r.id ? `[id=${r.id}] ` : ""}${r.topic}: ${r.english}`)
          .join("\n")}`
      : null,
    Array.isArray(body.existingScenarios) && body.existingScenarios.length > 0
      ? `Existing Script Scenarios:\n${body.existingScenarios
          .map((s) => `- [id=${s.id}] ${s.title} (${s.category}): ${s.policyRule}`)
          .join("\n")}`
      : null,
    body.tone?.trim()
      ? `Requested Tone: ${body.tone.trim()}`
      : `Requested Tone: ${slangAnalysis.recommendedTone}`,
    slangToneHint,
  ]
    .filter(Boolean)
    .join("\n\n");

  const schemaProperties: Record<string, unknown> = {
    detectedScenario: {
      type: "STRING",
      description:
        "Short name of the matched Shopee CS scenario (e.g., Refund Request, Customs Delay, Product Defect).",
    },
    matchedScenarioId: {
      type: "STRING",
      description:
        "Exact [id=...] from Existing Script Library Scenarios that best matches this inquiry, or empty string \"\" if none matches and this is a brand-new scenario.",
    },
    category: {
      type: "STRING",
      description:
        "One of: Delivery, Delayed, Product, Refund, General, Platform.",
    },
    policySummary: {
      type: "STRING",
      description:
        "1 short sentence in English summarizing the store policy applied to this response.",
    },
    rows: {
      type: "ARRAY",
      description:
        "Sentence-by-sentence breakdown table rows for the primary response (MUST always include an explicit Assurance row with isKeyRule: true, and warm Empathy whenever the customer has a worry, delay, frustration, or issue).",
      items: ROW_ITEM_SCHEMA,
    },
    fullEnglishMessage: {
      type: "STRING",
      description: "The combined English sentences formatted as a complete reply.",
    },
    fullPortugueseMessage: {
      type: "STRING",
      description:
        "The combined Portuguese sentences formatted as a single copy-pasteable Shopee chat message.",
    },
    suggestedGuideIds: SUGGESTED_GUIDE_IDS_SCHEMA,
    appliedRuleIds: {
      type: "ARRAY",
      description:
        "Exact [id=...] values from Active Store CS Rules that were actively applied or enforced in generating this response.",
      items: { type: "STRING" },
    },
    learnedRuleUpdates: {
      type: "ARRAY",
      description:
        "New or updated reusable Store CS Rules learned from new scenario handling policies, agent instructions, thresholds, or edge-case refinements in this input. Return [] only if Active Store CS Rules already cover every rule needed.",
      items: {
        type: "OBJECT",
        properties: {
          action: {
            type: "STRING",
            enum: ["create", "update"],
          },
          existingRuleId: {
            type: "STRING",
            description:
              "Required when action is 'update': exact rule id from Active Store CS Rules.",
          },
          topic: {
            type: "STRING",
            description: "Concise policy area title (max 120 chars).",
          },
          english: {
            type: "STRING",
            description: "Reusable English summary of the store rule.",
          },
          portuguese: {
            type: "STRING",
            description: "Reusable PT-BR customer guidance for this rule.",
          },
          reason: {
            type: "STRING",
            description: "Short explanation of why this rule was added or updated.",
          },
          isPrimary: {
            type: "BOOLEAN",
          },
        },
        required: [
          "action",
          "topic",
          "english",
          "portuguese",
          "reason",
          "isPrimary",
        ],
      },
    },
    learnedScriptUpdates: {
      type: "ARRAY",
      description:
        "New generalized CS scenario spiel or update to an existing Script Library scenario whenever the case introduces a scenario type not covered by Existing Script Library Scenarios or changes existing scenario handling. Return [] only if Existing Script Library Scenarios already cover it.",
      items: {
        type: "OBJECT",
        properties: {
          action: {
            type: "STRING",
            enum: ["create", "update"],
          },
          existingScenarioId: {
            type: "STRING",
            description:
              "Required when action is 'update': exact scenario id from Existing Script Library Scenarios.",
          },
          title: {
            type: "STRING",
            description: "Concise scenario title (max 120 chars).",
          },
          category: {
            type: "STRING",
            enum: ["Delivery", "Delayed", "Product", "Refund", "General", "Platform"],
          },
          whenToUse: {
            type: "STRING",
            description: "When an agent should use this generalized scenario script.",
          },
          policyRule: {
            type: "STRING",
            description: "Summary of the enforced store policy rule for this scenario.",
          },
          sampleInput: {
            type: "STRING",
            description: "Generalized example case input without real customer names or order IDs.",
          },
          rows: {
            type: "ARRAY",
            description: "Generalized bilingual spiel rows using placeholders like [DATE], [TRACKING], [STATUS], [VOUCHER], [ISSUE TOPIC], [INSERT SPEC].",
            items: {
              type: "OBJECT",
              properties: {
                section: { type: "STRING" },
                english: { type: "STRING" },
                portuguese: { type: "STRING" },
                highlight: { type: "BOOLEAN" },
              },
              required: ["section", "english", "portuguese", "highlight"],
            },
          },
          guideIds: SUGGESTED_GUIDE_IDS_SCHEMA,
          reason: {
            type: "STRING",
            description: "Why this generalized scenario was added or updated.",
          },
        },
        required: [
          "action",
          "title",
          "category",
          "whenToUse",
          "policyRule",
          "sampleInput",
          "rows",
          "guideIds",
          "reason",
        ],
      },
    },
  };

  const requiredFields = [
    "detectedScenario",
    "matchedScenarioId",
    "category",
    "policySummary",
    "rows",
    "fullEnglishMessage",
    "fullPortugueseMessage",
    "suggestedGuideIds",
    "appliedRuleIds",
    "learnedRuleUpdates",
    "learnedScriptUpdates",
  ];

  if (requestedPaths.length > 0) {
    schemaProperties.pathReplies = {
      type: "ARRAY",
      description: "Generated bilingual replies for EVERY requested CX Response Path.",
      items: {
        type: "OBJECT",
        properties: {
          pathId: { type: "STRING" },
          pathLabel: { type: "STRING" },
          cxTrigger: { type: "STRING" },
          policySummary: { type: "STRING" },
          rows: {
            type: "ARRAY",
            description:
              "Sentence-by-sentence breakdown rows for this path (MUST include an explicit Assurance row with isKeyRule: true, and warm Empathy if the customer is worried, frustrated, delayed, or facing an issue).",
            items: ROW_ITEM_SCHEMA,
          },
          fullEnglishMessage: { type: "STRING" },
          fullPortugueseMessage: { type: "STRING" },
          suggestedGuideIds: SUGGESTED_GUIDE_IDS_SCHEMA,
        },
        required: [
          "pathId",
          "pathLabel",
          "policySummary",
          "rows",
          "fullEnglishMessage",
          "fullPortugueseMessage",
          "suggestedGuideIds",
        ],
      },
    };
    requiredFields.push("pathReplies");
  }

  return {
    contextLines,
    systemInstruction: SYSTEM_INSTRUCTION,
    responseSchema: {
      type: "OBJECT",
      properties: schemaProperties,
      required: requiredFields,
    },
  };
}

export function buildChatFlowPromptAndSchema(
  body: ChatFlowRequest,
  orderContext: string,
  latestCxMessage: string
) {
  const todayIso = getBrazilTodayIso();
  const [ty, tm, td] = todayIso.split("-");
  const todayBr = `${td}/${tm}/${ty}`;

  const combinedText = `${orderContext}\n${latestCxMessage}`;
  const scheduleEval = evaluateDeliveryScheduleStatus({
    rawText: combinedText,
    estimatedDate: body.estimatedDate,
    lastUpdateDate: body.lastUpdateDate,
    todayIso,
  });
  const deliveryWindowHint = scheduleEval.promptDirective;
  const slangAnalysis = analyzeBrazilianSlangAndTone(latestCxMessage || combinedText);
  const slangToneHint =
    body.slangToneHint?.trim() || slangAnalysis.promptHint || null;

  const resolvedVoucherTier =
    body.voucherTier?.trim() || computeServerVoucherTier(combinedText);

  const resolvedTracking =
    body.trackingNumber?.trim() || extractTrackingFromText(combinedText);
  const rawCarrierFromInput = combinedText
    .match(/Shipping\s*Carrier\s*Name\s*[:\n\s]*([^\n]+)/i)?.[1]
    ?.trim();
  const resolvedCourier = resolveCourierFromTracking(
    resolvedTracking,
    body.carrierName?.trim() || rawCarrierFromInput
  );

  const historyText =
    Array.isArray(body.conversationHistory) && body.conversationHistory.length > 0
      ? body.conversationHistory
          .map(
            (h, idx) =>
              `[Turn ${Math.floor(idx / 2) + 1} - ${
                h.role === "cx" ? "Customer" : "Agent"
              }]: ${h.text}`
          )
          .join("\n")
      : "No prior turns yet (this is the opening CX message).";

  const contextLines = [
    orderContext ? `Order / Product Context:\n${orderContext}` : null,
    `Current Date (Brazil DD/MM/YYYY): ${todayBr}`,
    deliveryWindowHint,
    body.detectedAmount?.trim()
      ? `Detected Product Amount: ${body.detectedAmount.trim()}`
      : null,
    resolvedVoucherTier
      ? `Eligible Store Voucher Tier (<= R$25 rule): ${resolvedVoucherTier}`
      : null,
    resolvedCourier
      ? `Assigned Shipping Carrier (Actual Courier): ${resolvedCourier}${
          resolvedTracking
            ? ` (resolved from tracking ${resolvedTracking}; name ${resolvedCourier} instead of "Expresso padrão")`
            : ""
        }`
      : null,
    resolvedTracking ? `Tracking Number: ${resolvedTracking}` : null,
    body.lastUpdateDate?.trim()
      ? `Last Tracking Update Date: ${body.lastUpdateDate.trim()}`
      : null,
    body.estimatedDate?.trim()
      ? `Estimated Delivery Date: ${body.estimatedDate.trim()}`
      : null,
    body.latestStatus?.trim()
      ? `Latest Order / Tracking Status: ${body.latestStatus.trim()}`
      : null,
    body.issueTopic?.trim()
      ? `Platform Issue Topic: ${body.issueTopic.trim()}`
      : null,
    body.productSpec?.trim()
      ? `Product Specification Detail: ${body.productSpec.trim()}`
      : null,
    body.tone?.trim()
      ? `Requested Tone: ${body.tone.trim()}`
      : `Requested Tone: ${slangAnalysis.recommendedTone}`,
    slangToneHint,
    `Include Probing Questions: ${
      body.includeProbingQuestions === false
        ? "NO (keep direct without extra probing questions unless required by policy)"
        : "YES (include 1–2 smart clarifying probing questions + offer clear choices)"
    }`,
    body.probingFocus?.trim()
      ? `Agent Probing Focus Instruction: ${body.probingFocus.trim()}`
      : null,
    Array.isArray(body.customStoreRules) && body.customStoreRules.length > 0
      ? `Active Store CS Rules (from Cloud Store Rules):\n${body.customStoreRules
          .map((r) => `- ${r.topic}: ${r.english} (PT-BR: ${r.portuguese})`)
          .join("\n")}`
      : null,
    `Conversation History So Far:\n${historyText}`,
    `LATEST CX MESSAGE TO RESPOND TO NOW:\n${latestCxMessage || orderContext}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const responseSchema: Record<string, unknown> = {
    type: "OBJECT",
    properties: {
      detectedScenario: { type: "STRING" },
      category: { type: "STRING" },
      policySummary: { type: "STRING" },
      rows: {
        type: "ARRAY",
        items: ROW_ITEM_SCHEMA,
      },
      probingQuestions: {
        type: "ARRAY",
        description: "1 to 2 bilingual clarifying probing questions to ask CX.",
        items: {
          type: "OBJECT",
          properties: {
            english: { type: "STRING" },
            portuguese: { type: "STRING" },
          },
          required: ["english", "portuguese"],
        },
      },
      nextChoices: {
        type: "ARRAY",
        description:
          "3 to 5 realistic follow-up CX replies/choices so the agent can click what CX responds next.",
        items: {
          type: "OBJECT",
          properties: {
            id: { type: "STRING" },
            label: { type: "STRING" },
            cxMessage: { type: "STRING" },
            kind: {
              type: "STRING",
              enum: ["choice", "probing-answer", "escalate", "resolve"],
            },
          },
          required: ["id", "label", "cxMessage", "kind"],
        },
      },
      fullEnglishMessage: { type: "STRING" },
      fullPortugueseMessage: { type: "STRING" },
      suggestedGuideIds: SUGGESTED_GUIDE_IDS_SCHEMA,
    },
    required: [
      "detectedScenario",
      "category",
      "policySummary",
      "rows",
      "probingQuestions",
      "nextChoices",
      "fullEnglishMessage",
      "fullPortugueseMessage",
      "suggestedGuideIds",
    ],
  };

  return {
    contextLines,
    systemInstruction: `${SYSTEM_INSTRUCTION}\n\n${CHAT_FLOW_INSTRUCTION}`,
    responseSchema,
  };
}

export interface LearnRuleRequest {
  rawInput: string;
  originalPortuguese?: string;
  editedPortuguese?: string;
  detectedScenario?: string;
  customStoreRules?: StoreRuleContext[];
  existingScenarios?: ScriptScenarioContext[];
}

export function buildLearnRulePromptAndSchema(body: LearnRuleRequest) {
  const rulesText =
    Array.isArray(body.customStoreRules) && body.customStoreRules.length > 0
      ? body.customStoreRules
          .map(
            (r) =>
              `- ${r.id ? `[id=${r.id}] ` : ""}${r.topic}: ${r.english} (PT-BR: ${r.portuguese})`
          )
          .join("\n")
      : "None provided yet.";

  const scenariosText =
    Array.isArray(body.existingScenarios) && body.existingScenarios.length > 0
      ? body.existingScenarios
          .map(
            (s) =>
              `- [id=${s.id}] ${s.title} (${s.category}) | When: ${s.whenToUse} | Rule: ${s.policyRule}`
          )
          .join("\n")
      : "None provided yet.";

  const hasEditComparison =
    Boolean(body.originalPortuguese?.trim()) &&
    Boolean(body.editedPortuguese?.trim()) &&
    body.originalPortuguese?.trim() !== body.editedPortuguese?.trim();

  const contextLines = [
    `Active Store CS Rules:\n${rulesText}`,
    `Existing Script Library Scenarios:\n${scenariosText}`,
    body.detectedScenario?.trim()
      ? `Detected Scenario Context: ${body.detectedScenario.trim()}`
      : null,
    `Agent Case Input / Instructions:\n${body.rawInput.trim()}`,
    body.originalPortuguese?.trim()
      ? `Original Generated PT-BR Reply:\n${body.originalPortuguese.trim()}`
      : null,
    hasEditComparison
      ? `Agent Edited PT-BR Reply:\n${body.editedPortuguese!.trim()}`
      : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  const systemInstruction = `You are a Senior Shopee Brazil CS Knowledge Base & Policy Architect.
Analyze the Agent Case Input / Instructions (and any Original vs Edited PT-BR Reply if provided) against BOTH Existing Script Library Scenarios AND Active Store CS Rules.

Your task is to decide carefully whether this input represents:
1. A NEW scenario type not yet clearly covered in Existing Script Library Scenarios -> add a generalized bilingual spiel in "learnedScriptUpdates" ("action": "create"), AND add a matching Store Rule in "learnedRuleUpdates" ("action": "create") whenever this scenario or the agent's note introduces a reusable policy, SLA, threshold, link, or handling guideline not yet in Active Store CS Rules.
2. A CHANGE or IMPROVEMENT to an existing scenario or existing store rule -> update the matching Script Library scenario ("action": "update" with exact "existingScenarioId") and/or update the matching Store Rule ("action": "update" with exact "existingRuleId").
3. If everything is already fully covered by Existing Script Library Scenarios and Active Store CS Rules (or an edit was merely order-specific/cosmetic), return [] for that array and explain briefly in "analysisNote".

CRITICAL GENERALIZATION RULES for "learnedScriptUpdates":
- Strip all real Order SNs, real customer names, specific dates, specific product prices, or one-off tracking codes.
- Use clean placeholders like [DATE], [TRACKING], [STATUS], [VOUCHER], [ISSUE TOPIC], or [INSERT SPEC] where dynamic values belong so the agent can reuse the script for any customer order.
- Include natural English + warm PT-BR in 3 to 7 structured rows (Greeting, Situation/Policy rows with highlight: true on critical rules, Assurance with Shopee Guarantee, Closing).
- Include 0 to 3 matching visual guide IDs in "guideIds" (or []) from: ${VALID_GUIDE_IDS.join(", ")}.`;

  const responseSchema: Record<string, unknown> = {
    type: "OBJECT",
    properties: {
      analysisNote: {
        type: "STRING",
        description:
          "1 concise sentence explaining what new scenario/rule was detected or confirming existing Script Library & Store Rules already cover it.",
      },
      learnedScriptUpdates: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            action: {
              type: "STRING",
              enum: ["create", "update"],
            },
            existingScenarioId: { type: "STRING" },
            title: { type: "STRING" },
            category: {
              type: "STRING",
              enum: ["Delivery", "Delayed", "Product", "Refund", "General", "Platform"],
            },
            whenToUse: { type: "STRING" },
            policyRule: { type: "STRING" },
            sampleInput: { type: "STRING" },
            rows: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  section: { type: "STRING" },
                  english: { type: "STRING" },
                  portuguese: { type: "STRING" },
                  highlight: { type: "BOOLEAN" },
                },
                required: ["section", "english", "portuguese", "highlight"],
              },
            },
            guideIds: SUGGESTED_GUIDE_IDS_SCHEMA,
            reason: { type: "STRING" },
          },
          required: [
            "action",
            "title",
            "category",
            "whenToUse",
            "policyRule",
            "sampleInput",
            "rows",
            "guideIds",
            "reason",
          ],
        },
      },
      learnedRuleUpdates: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            action: {
              type: "STRING",
              enum: ["create", "update"],
            },
            existingRuleId: { type: "STRING" },
            topic: { type: "STRING" },
            english: { type: "STRING" },
            portuguese: { type: "STRING" },
            reason: { type: "STRING" },
            isPrimary: { type: "BOOLEAN" },
          },
          required: [
            "action",
            "topic",
            "english",
            "portuguese",
            "reason",
            "isPrimary",
          ],
        },
      },
    },
    required: ["analysisNote", "learnedScriptUpdates", "learnedRuleUpdates"],
  };

  return {
    contextLines,
    systemInstruction,
    responseSchema,
  };
}
