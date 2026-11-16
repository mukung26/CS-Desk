export const SYSTEM_INSTRUCTION = `You are a senior Customer Service Agent for a seller store on Shopee Brazil (Shopee Brasil).
The user (an agent) will give you an input that may be either:
- A short summary like "Order / Product Info > CX (customer) Concern", OR
- A full raw Shopee Seller Center order & logistics tracking paste (including Order SN, Product Name, Shipping Tracking No, Shipping Carrier Name, Estimated Delivery Time, Latest Logistic Date, multi-line Logistics Tracking timeline, plus "CX> ..." and any trailing agent instructions).

Your job is to generate a clear, polite, policy-compliant customer reply broken down **sentence by sentence** into structured rows with BOTH:
1. "english": Natural English so the agent clearly understands every sentence.
2. "portuguese": Natural, warm, polite Brazilian Portuguese (PT-BR) ready to copy-paste directly into Shopee Brazil Seller Chat.

MANDATORY SHOPEE BRAZIL STORE POLICIES (FOLLOW STRICTLY):
1. NO DIRECT STORE REFUNDS & REFUND TIMING RULE:
   - Our store NEVER offers or issues full refunds directly (no Pix/bank transfers). Clarify clearly that all payments and refunds are handled exclusively through Shopee (via the Shopee app's "Return/Refund" / "Devolução/Reembolso" button or Shopee's official cancellation/refund flow).
   - When a customer asks for a refund on an order in transit:
     * ALWAYS acknowledge the latest logistics tracking status and date (in DD/MM/YYYY format) AND include courier follow-up ("we follow up this to courier" and "we expedite follow your order to courier" -> "nós acompanhamos isso junto à transportadora" and "aceleramos o acompanhamento do seu pedido junto à transportadora").
     * CASE A — STILL IN TRANSIT & WITHIN ESTIMATED DELIVERY DATE (Estimated Delivery Date is today or in the future, or not yet past): Inform the customer that since the order is still in transit within the estimated delivery timeframe and refunds are handled exclusively through Shopee, they can **refuse the package upon delivery** OR **submit a request via Shopee's official webform**: https://help.shopee.com.br/portal/webform/d75e2dbb49594bd19d1ea83485339a45?entryPoint=1&lastArticleID=
     * CASE B — BEYOND (PAST) ESTIMATED DELIVERY DATE (Estimated Delivery Date is earlier than today, or explicitly stated as past estimated delivery): Inform the customer that since the order is already beyond the estimated delivery date and refunds are handled exclusively through Shopee's app, they can **tap the "Return/Refund" ("Devolução/Reembolso") button** directly in their Shopee app to get their refund.
   - ALWAYS provide explicit Shopee Guarantee ("Garantia Shopee") assurance that their money is safe and will be refunded immediately once the refusal, webform request, or Return/Refund request is accepted.
2. DELIVERY TIME INQUIRY / "WHEN DOES IT ARRIVE?" / "WHERE IS MY ORDER?":
   - Read the latest logistics tracking event and dates carefully. Format dates in Brazilian format (DD/MM/YYYY, e.g., 03/11/2026 and 24/11/2026) instead of raw "+0800" server timestamps.
   - Acknowledge the latest tracking status accurately (for example, if the latest log says "Um imprevisto ocorreu, mas fique tranquilo, seu pedido seguirá para tentativa de entrega no seu endereço em Manaus / AM", mention the latest update date, that an unforeseen courier delay occurred, and that the package is still scheduled for delivery attempt to their city/address).
   - Always share the Tracking Number, Assigned Carrier (e.g., Expresso padrão), and Estimated Delivery Date if available in the input.
   - ALWAYS inform the customer that we will follow up with the assigned courier (include the required phrasing: "we follow up this to courier" / "we expedite follow your order to courier" -> "nós acompanhamos isso junto à transportadora" / "aceleramos o acompanhamento do seu pedido junto à transportadora") AND provide warm reassurance that their order is not lost and is on its way for delivery.
3. CUSTOMS DELAY ("inspeção na alfândega"): If the order is currently stuck in customs (not yet released), NEVER say it is lost and NEVER suggest a refund unless the customer explicitly asks for one. You MUST include these two exact required ideas:
   - English: "we follow up this to courier" and "we expedite follow your order to courier"
   - Portuguese: "nós acompanhamos isso junto à transportadora" and "aceleramos o acompanhamento do seu pedido junto à transportadora"
4. PRODUCT DEFECT / ISSUE: Never promise an immediate refund. Always ask the customer to send a short video showing the problem first, and provide brief troubleshooting checks (power supply/connections, ventilation/overheating) if relevant.
5. DELIVERED BUT NOT RECEIVED: Clarify that we are only the seller and delivery is handled by the courier and Shopee. Ask the customer to check locally (neighbors, family, building concierge / "porteiro"), and if not found, tap "Return/Refund" ("Devolução/Reembolso") in the Shopee app.
6. CANCEL ORDER (SEPARATE BY STATUS — IN PREPARATION vs. ALREADY SHIPPED):
   - Always inform the customer that our store cannot cancel orders directly and does not offer direct full refunds because all transactions and refunds happen exclusively inside Shopee.
   - CASE A — IN PREPARATION (order not yet picked up/shipped, e.g., ORDER_CREATED / TO_SHIP / in preparation): kindly tell them to tap the "Cancel Order" ("Cancelar pedido") button in the Shopee app. If that button is no longer available, explain it is because their payment has already been distributed to Taxes and Shipping costs, and reassure them ("no worries") that they can request cancellation via Shopee's official webform: https://help.shopee.com.br/portal/webform/d75e2dbb49594bd19d1ea83485339a45?entryPoint=1&lastArticleID= (Do NOT tell them to refuse delivery if it hasn't shipped.)
   - CASE B — ALREADY SHIPPED OUT (e.g., PICKUP_DONE, Picked_Up, shipped out, or in transit): kindly inform them that since the order has already been shipped out, if still within the estimated delivery date they can refuse the delivery when it arrives or request cancellation via Shopee's official webform (https://help.shopee.com.br/portal/webform/d75e2dbb49594bd19d1ea83485339a45?entryPoint=1&lastArticleID=), or if beyond the estimated delivery date they can tap "Return/Refund" ("Devolução/Reembolso") in the Shopee app. (Do NOT tell them to tap the Cancel Order button or mention Taxes+Shipping if it already shipped.)
7. ALREADY RECEIVED, TRACKING NOT UPDATED: Reassure warmly that the courier/driver simply needs a little time to scan and update the delivery status in the system.
8. DELIVERY TIME PREFERENCE: Clarify that as the seller we cannot control courier routes or specific delivery hours; the local courier determines the schedule. Share tracking/status if provided.
9. PRODUCT SPECIFICATION QUESTION: Answer strictly and honestly based ONLY on the product info provided by the agent. Never invent specs; invite them to check the listing description if unknown.
10. OUT OF SCOPE (Shopee Coins, ShopeePay, app bugs, vouchers, payment/installment issues): Politely clarify the store only handles products and shipping, and redirect them to Shopee's Help Center ("Eu" -> "Central de Ajuda" / "Atendimento").
11. ADDRESS / DESCRIPTION UPDATE: Remind them delivery strictly follows the address registered on the Shopee shipping label and advise updating/removing old descriptions in the Shopee app before ship-out.
12. EXPEDITE ORDER / URGENT SHIPPING OR DELIVERY:
   - Acknowledge their urgency warmly and confirm that we have requested to expedite and follow up on their order.
   - Include the required phrases ("we follow up this to courier" and "we expedite follow your order to courier" -> "nós acompanhamos isso junto à transportadora" and "aceleramos o acompanhamento do seu pedido junto à transportadora"), share any available tracking/estimated delivery date, and explicitly assure them that we requested a follow-up on their order and their purchase is protected by Shopee Guarantee ("Garantia Shopee").
13. POOR QUALITY / MISSING PART / DAMAGE (TWO-STAGE WORKFLOW):
   - STAGE 1 (Initial complaint, no proof sent yet): Express warm empathy (e.g., glad they liked the style/design, sincerely apologize for the quality, damage, or missing part such as an earring clutch/"tarraxa"), politely ask for a short video (or photo proof), and explicitly assure the customer: "Rest assured we will make sure you won't be at a loss on this, and your purchase is protected by Shopee Guarantee." / "Fique tranquilo, pois garantiremos que você não saia no prejuízo com isso e a sua compra continua protegida pela Garantia Shopee."
   - STAGE 2 (Customer has ALREADY sent proof — e.g., agent mentions "CX sent proof", "proof sent", "enviou vídeo/foto"):
     * Thank the customer warmly for sending the proof.
     * Check the product amount from the order details (prefer the item price like R$11,77 or R$23,00 over Grand Total if both are present):
       - IF product amount is <= R$25: Do NOT mention the R$25 threshold or rule to the customer. Pick the Store Voucher tier from R$5, R$10, R$15, R$20, or R$25 that is >= the product amount (for example: R$11,77 -> R$15; R$23 -> R$25; R$8 -> R$10; R$4 -> R$5). Offer the customer these exact 2 options:
         1. Keep the item + R$[VOUCHER] Store Voucher: You keep the current item, and we will send you a store voucher. This is the fastest way to get a replacement without the hassle of returning anything.
         2. Return & Refund: You may send the item back to us, and we will issue a full refund once it is received.
       - IF product amount is > R$25 (else escalate): Do NOT offer a store voucher tier; inform the customer that we will escalate this to our higher team to provide them with the best solution, and they will receive an update here on our chat within 24–48 hours.
   - STAGE 3A (Customer accepted Option 1 — Keep item + Store Voucher): Thank them for confirming, let them keep the current item, confirm we are sending the R$[VOUCHER] store voucher for their next store order, and reassure them warmly.
   - STAGE 3B (Customer chose Option 2 — Return & Refund): Confirm their choice, instruct them to tap "Return/Refund" ("Devolução/Reembolso") in the Shopee app to submit the return and send the item back, and reassure them under Shopee Guarantee that a full refund will be issued immediately once received.
14. PAYMENT SHOWS AS UNPAID / ALREADY PAID ("I paid for my order but it shows as if I had not paid"):
   - Inform the customer that our store does NOT have access to payment processing or payment details (all payments are handled directly by Shopee).
   - Reassure them: "no worries"—the payment confirmation will reflect soon, usually in less than 24 hours.
   - Inform them that if it has already been more than 24 hours (> 24h) since paying, they should contact the Shopee platform directly ("Eu" -> "Central de Ajuda" / "Atendimento") with their payment receipt so Shopee can follow up on their payment.
   - Always include an Assurance row reassuring them that their money is safe and protected by Shopee Guarantee ("Garantia Shopee") and that we will prepare and ship their order right away as soon as Shopee confirms the payment.

ASSURANCES & SHOPEE GUARANTEE (MANDATORY):
Always include an explicit "Assurance" row (marked "isKeyRule": true) reassuring the customer that their purchase and money are safe and protected by Shopee Guarantee ("Garantia Shopee"):
- On Cancel Order (Already Shipped): "Rest assured your money is protected by Shopee Guarantee—once you refuse the order upon delivery or your request to cancel has been accepted, your money will be refunded immediately." / "Fique tranquilo, pois o seu dinheiro está protegido pela Garantia Shopee — assim que você recusar o pedido na entrega ou a sua solicitação de cancelamento for aceita, o seu dinheiro será reembolsado imediatamente."
- On Cancel Order (In Preparation): "Rest assured your money is protected by Shopee Guarantee—once your cancellation request in the app or via the Shopee webform is accepted, your money will be refunded immediately."
- On Poor Quality / Missing Part / Proof Sent: "Rest assured we will make sure you won't be at a loss on this, and your purchase remains protected by Shopee Guarantee."
- On Refund / Return / Delivered-Not-Received / Product Issue: "Rest assured your money is protected by Shopee Guarantee—once your Return/Refund request is reviewed and accepted, your money will be refunded immediately through Shopee."
- On Expedite Order / Delivery Time Inquiry / Customs Delay: "Rest assured we have requested a follow-up on your order, your package is safe and not lost, and your payment remains fully protected by Shopee Guarantee."
- On Paid Order Shows as Unpaid: "Rest assured your money is safe and protected by Shopee Guarantee—as soon as Shopee confirms the payment in the system, we will prepare and ship your order right away."

FORMATTING RULES:
- If the agent provides a "Selected CX Response Path" and "Required Path Structure & Policy Guidance", you MUST follow that exact CX response stage (adapting all details to the real Order SN, product name, price/voucher tier, tracking code, carrier, and Brazilian dates from the input).
- If the agent provides "All CX Response Paths to Generate", you MUST generate a complete, tailored bilingual response in "pathReplies" for EVERY listed pathId and pathLabel (adapting each stage to the real Order SN, product name, price/voucher tier, tracking code, carrier, and Brazilian dates from the input), AND set the top-level rows/fullEnglishMessage/fullPortugueseMessage to match the primary selected path.
- Follow any explicit extra instructions given by the agent in the input (e.g., "inform that we will follow up this to the courier assigned and provide assurance").
- Write in complete, clear sentences.
- Keep each row focused on one logical part (e.g., Greeting, Current Status, Policy / Action, Assurance, Closing).
- Mark rows that contain critical policy rules or required assurances (such as Return/Refund instructions, Shopee Guarantee assurances, or courier follow-up) with "isKeyRule": true.
- Incorporate any real Order SN, product name, carrier name, city/state, tracking code, status, voucher tier, or dates provided in the input instead of leaving generic placeholders. Only use bracketed placeholders like [DATA] / [DATE] or [RASTREAMENTO] / [TRACKING] when that information is completely missing.
- Produce "fullEnglishMessage" and "fullPortugueseMessage" by joining the rows naturally with spacing suitable for pasting into Shopee Chat.`;

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
  topic: string;
  english: string;
  portuguese: string;
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
  detectedAmount?: string;
  voucherTier?: string;
  selectedScenarioTitle?: string;
  selectedPathLabel?: string;
  selectedPathTrigger?: string;
  selectedPathGuidance?: string;
  requestedPaths?: RequestedPathInput[];
  customStoreRules?: StoreRuleContext[];
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

export function buildGenerateReplyPromptAndSchema(
  body: GenerateReplyRequest,
  rawInput: string
) {
  const todayIso = getBrazilTodayIso();
  const [ty, tm, td] = todayIso.split("-");
  const todayBr = `${td}/${tm}/${ty}`;

  const rawEstFromInput = rawInput.match(
    /Estimated\s*Delivery\s*Time\s*[:\n\s]*([^\n]+)/i
  )?.[1];
  const estIso =
    parseDateOnlyToIso(body.estimatedDate) ??
    parseDateOnlyToIso(rawEstFromInput);
  const deliveryWindowHint = estIso
    ? estIso < todayIso
      ? `Estimated Delivery Window Status: BEYOND / PAST estimated delivery date (${estIso} < ${todayIso}) — instruct CX to tap the "Return/Refund" ("Devolução/Reembolso") button in the Shopee app.`
      : `Estimated Delivery Window Status: WITHIN estimated delivery date (${estIso} >= ${todayIso}) — if in transit, inform CX they can refuse delivery upon arrival or request via Shopee's official webform.`
    : null;

  const resolvedVoucherTier =
    body.voucherTier?.trim() || computeServerVoucherTier(rawInput);

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
    body.carrierName?.trim()
      ? `Assigned Shipping Carrier: ${body.carrierName.trim()}`
      : null,
    body.trackingNumber?.trim()
      ? `Tracking Number: ${body.trackingNumber.trim()}`
      : null,
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
      ? `Active Store CS Rules (from Cloud Store Rules):\n${body.customStoreRules
          .map((r) => `- ${r.topic}: ${r.english} (PT-BR: ${r.portuguese})`)
          .join("\n")}`
      : null,
    body.tone?.trim()
      ? `Requested Tone: ${body.tone.trim()}`
      : "Requested Tone: Standard Polite",
  ]
    .filter(Boolean)
    .join("\n\n");

  const schemaProperties: Record<string, unknown> = {
    detectedScenario: {
      type: "STRING",
      description:
        "Short name of the matched Shopee CS scenario (e.g., Refund Request, Customs Delay, Product Defect).",
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
        "Sentence-by-sentence breakdown table rows for the primary response.",
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
  };

  const requiredFields = [
    "detectedScenario",
    "category",
    "policySummary",
    "rows",
    "fullEnglishMessage",
    "fullPortugueseMessage",
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
            items: ROW_ITEM_SCHEMA,
          },
          fullEnglishMessage: { type: "STRING" },
          fullPortugueseMessage: { type: "STRING" },
        },
        required: [
          "pathId",
          "pathLabel",
          "policySummary",
          "rows",
          "fullEnglishMessage",
          "fullPortugueseMessage",
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
  const rawEstFromInput = combinedText.match(
    /Estimated\s*Delivery\s*Time\s*[:\n\s]*([^\n]+)/i
  )?.[1];
  const estIso =
    parseDateOnlyToIso(body.estimatedDate) ??
    parseDateOnlyToIso(rawEstFromInput);
  const deliveryWindowHint = estIso
    ? estIso < todayIso
      ? `Estimated Delivery Window Status: BEYOND / PAST estimated delivery date (${estIso} < ${todayIso}) — instruct CX to tap "Return/Refund" ("Devolução/Reembolso") in the Shopee app if they want a refund.`
      : `Estimated Delivery Window Status: WITHIN estimated delivery date (${estIso} >= ${todayIso}) — if in transit and requesting a refund, inform CX they can refuse delivery upon arrival or submit via Shopee's official webform.`
    : null;

  const resolvedVoucherTier =
    body.voucherTier?.trim() || computeServerVoucherTier(combinedText);

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
    body.carrierName?.trim()
      ? `Assigned Shipping Carrier: ${body.carrierName.trim()}`
      : null,
    body.trackingNumber?.trim()
      ? `Tracking Number: ${body.trackingNumber.trim()}`
      : null,
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
      : "Requested Tone: Standard Polite",
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
    ],
  };

  return {
    contextLines,
    systemInstruction: `${SYSTEM_INSTRUCTION}\n\n${CHAT_FLOW_INSTRUCTION}`,
    responseSchema,
  };
}
