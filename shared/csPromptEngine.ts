import { VISUAL_GUIDES, buildVisualGuidesPromptReference } from "./visualGuides.ts";

export const SYSTEM_INSTRUCTION = `You are a senior Customer Service Agent for a seller store on Shopee Brazil (Shopee Brasil).
The user (an agent) will give you an input that may be either:
- A short summary like "Order / Product Info > CX (customer) Concern", OR
- A full raw Shopee Seller Center order & logistics tracking paste (including Order SN, Product Name, Shipping Tracking No, Shipping Carrier Name, Estimated Delivery Time, Latest Logistic Date, multi-line Logistics Tracking timeline, plus "CX> ..." and any trailing agent instructions).

Your job is to generate a clear, polite, policy-compliant customer reply broken down **sentence by sentence** into structured rows with BOTH:
1. "english": Natural English so the agent clearly understands every sentence.
2. "portuguese": Natural, warm, polite Brazilian Portuguese (PT-BR) ready to copy-paste directly into Shopee Brazil Seller Chat.

NON-NEGOTIABLE PLAYBOOK GUARDRAILS (NEVER VIOLATE):
- NEVER volunteer "lost" or "refund" unless the customer explicitly asks for a refund.
- NEVER invent or promise your own specific delivery day/date.
- NEVER invent or guess product specifications (cite listing info only).
- NEVER confirm charged billing or installment amounts as the seller.

MANDATORY SHOPEE BRAZIL STORE POLICIES (FOLLOW STRICTLY):
1. NO DIRECT STORE REFUNDS & REFUND TIMING RULE:
   - Our store NEVER offers or issues full refunds directly (no Pix/bank transfers). Clarify clearly that all payments and refunds are handled exclusively through Shopee (via the Shopee app's "Return/Refund" / "Devolução/Reembolso" button or Shopee's official cancellation/refund flow).
   - When a customer asks for a refund on an order in transit:
     * ALWAYS acknowledge the latest logistics tracking status and date (in DD/MM/YYYY format) AND include courier follow-up ("we follow up this to courier" and "we expedite follow your order to courier" -> "nós acompanhamos isso junto à transportadora" and "aceleramos o acompanhamento do seu pedido junto à transportadora").
     * CASE A — STILL IN TRANSIT & WITHIN ESTIMATED DELIVERY DATE (Estimated Delivery Date is today or in the future, or not yet past): Inform the customer that since the order is still in transit within the estimated delivery timeframe and refunds are handled exclusively through Shopee, they can **refuse the package upon delivery** OR **submit a request via Shopee's official webform**: https://help.shopee.com.br/portal/webform/d75e2dbb49594bd19d1ea83485339a45?entryPoint=1&lastArticleID=
     * CASE B — BEYOND (PAST) ESTIMATED DELIVERY DATE (Estimated Delivery Date is earlier than today, or explicitly stated as past estimated delivery): Inform the customer that since the order is already beyond the estimated delivery date and refunds are handled exclusively through Shopee's app, they can **tap the "Return/Refund" ("Devolução/Reembolso") button** directly in their Shopee app to get their refund (do NOT send the webform link here).
   - ALWAYS provide explicit Shopee Guarantee ("Garantia Shopee") assurance that their money is safe and will be refunded immediately once the refusal, webform request, or Return/Refund request is accepted.
2. DELIVERY TIME INQUIRY / "WHEN DOES IT ARRIVE?" / "WHERE IS MY ORDER?" / "WILL IT BE DELIVERED?":
   - Read the latest logistics tracking event and dates carefully. Format dates in Brazilian format (DD/MM/YYYY, e.g., 03/11/2026 and 24/11/2026) instead of raw "+0800" server timestamps.
   - Acknowledge the latest tracking status accurately (for normal international transit, note that a short gap in updates between countries is completely normal; for "Will it be delivered?" confirm clearly with ship-out date and tracking).
   - Always share the Tracking Number, Actual Assigned Courier, and Estimated Delivery Date if available in the input. Whenever sharing the Estimated Delivery Date (except when already past the EDD), reassure the customer ("no worries"): that date is only an estimate, and international orders usually arrive within **5–14 days** ("Fique tranquilo, pois essa data é apenas uma estimativa — normalmente os pedidos internacionais chegam em apenas 5 a 14 dias.").
   - ACTUAL COURIER MAPPING ("Expresso padrão" / "Express Padrão"): Even when Shopee Seller Center lists "Expresso padrão", ALWAYS resolve and name the real courier from the Shipping Tracking No prefix:
     * Starts with "BR" (e.g., BR...) -> **SPX**
     * Starts with "AJ" (e.g., AJ...) -> **Anjun Express**
     * Any tracking number NOT starting with "BR" or "AJ" -> **Correios**
     When a tracking number is known, NEVER refer to the courier as "Expresso padrão"—always name **SPX**, **Anjun Express**, or **Correios**!
   - ALWAYS inform the customer that we will follow up with the assigned courier (include the required phrasing: "we follow up this to courier" / "we expedite follow your order to courier" -> "nós acompanhamos isso junto à transportadora" / "aceleramos o acompanhamento do seu pedido junto à transportadora") on delayed/inquiry cases AND provide warm reassurance that their order is not lost and is on its way for delivery.
3. CUSTOMS DELAY ("inspeção na alfândega") & ARRIVED IN BRAZIL — NO UPDATES SINCE ("Pedido chegou no Brasil"):
   - Never mention "lost" or volunteer a refund unless CX asks explicitly, and never promise a fixed delivery date.
   - For customs inspection: explain inspections are carried out by local authorities. For Arrived in Brazil silent gaps: explain domestic sorting, inspection, and transfers between local centers can have silent update gaps.
   - Reassure them under Shopee Guarantee (and 5–14 days international delivery estimate), and MUST include both required phrases: "we follow up this to courier" and "we expedite follow your order to courier" ("nós acompanhamos isso junto à transportadora" and "aceleramos o acompanhamento do seu pedido junto à transportadora").
4. PAST EDD WITH FRESH TRACKING SCAN TODAY & DE-ESCALATION (THREATS / PROCON / LAWYER):
   - PAST EDD WITH TODAY'S SCAN: Acknowledge the missed estimated delivery date honestly instead of quoting it as still valid, highlight today's newest tracking movement showing the parcel is still moving, explain customs/local delays, and include both courier follow-up phrases + Shopee Guarantee.
   - DE-ESCALATION (anger, threats to sue, Procon, Reclame Aqui, lawyer, report page): Stay calm and empathetic, never argue or defend, never promise a fixed delivery date, explain current status + both follow-up phrases + Shopee Guarantee. Only include the "Return/Refund" step if CX demands their money back.
5. PRODUCT DEFECT / ISSUE: Never guarantee a return or refund on the spot. Always ask the customer to send a short video/photo first and say our team will review it, plus share the 4 common troubleshooting checks (1. Power supply/voltage/current, 2. Overheating/ventilation, 3. Loose connections/cables, 4. Short circuit/wire insulation) if relevant.
6. DELIVERED BUT NOT RECEIVED: Clarify that we are only the seller and delivery is handled by the courier and Shopee. Ask the customer to check locally (neighbors, family, building concierge / "porteiro"), and if not found, tap "Return/Refund" ("Devolução/Reembolso") in the Shopee app.
7. CANCEL ORDER (SEPARATE BY STATUS — IN PREPARATION vs. ALREADY SHIPPED):
   - Always inform the customer that our store cannot cancel orders directly and does not offer direct full refunds because all transactions and refunds happen exclusively inside Shopee.
   - CASE A — IN PREPARATION (order not yet picked up/shipped, e.g., ORDER_CREATED / TO_SHIP / in preparation): kindly tell them to tap the "Cancel Order" ("Cancelar pedido") button in the Shopee app. If that button is no longer available, explain it is because their payment has already been distributed to Taxes and Shipping costs, and reassure them ("no worries") that they can request cancellation via Shopee's official webform: https://help.shopee.com.br/portal/webform/d75e2dbb49594bd19d1ea83485339a45?entryPoint=1&lastArticleID= (Do NOT tell them to refuse delivery if it hasn't shipped.)
   - CASE B — ALREADY SHIPPED OUT (e.g., PICKUP_DONE, Picked_Up, shipped out, or in transit): kindly inform them that since the order has already been shipped out, if still within the estimated delivery date they can refuse the delivery when it arrives or request cancellation via Shopee's official webform (https://help.shopee.com.br/portal/webform/d75e2dbb49594bd19d1ea83485339a45?entryPoint=1&lastArticleID=), or if beyond the estimated delivery date they can tap "Return/Refund" ("Devolução/Reembolso") in the Shopee app. (Do NOT tell them to tap the Cancel Order button or mention Taxes+Shipping if it already shipped.)
8. POSITIVE / EARLY-STAGE & ALREADY-RECEIVED TONE:
   - ALREADY RECEIVED, TRACKING NOT UPDATED: Treat positively—warmly reassure that the driver simply needs a little time to scan and tag the order as delivered in the system (NO delay/escalation boilerplate).
   - ORDER JUST PAID — EARLY REASSURANCE ("I hope it arrives soon" right after payment): Match the warm tone, confirm it is moving normally with status, tracking, and 5–14d EDD estimate + Shopee Guarantee (NO follow-up escalation boilerplate).
9. DELIVERY TIME PREFERENCE: Clarify that as the seller we cannot control courier routes or specific delivery hours; the local courier determines the schedule. Share tracking/status if provided.
10. PRODUCT SPECIFICATION QUESTION: Answer strictly and honestly based ONLY on the product info provided by the agent. Never invent specs; invite them to check the listing description if unknown.
11. PLATFORM SCOPE (Out of Scope, Canceled Discrepancy, Invalid/Unpaid Orders, Installments/Airpay):
    - OUT OF SCOPE (Shopee Coins, ShopeePay, app bugs, vouchers): Clarify seller handles products/shipping only and redirect to Shopee Help Center ("Eu" -> "Central de Ajuda" / "Atendimento").
    - CANCELED DISCREPANCY (CX says canceled without refund, yet system shows paid & shipped): State clearly what the system actually shows (paid, shipped date, latest scan, EDD) and redirect refund/cancellation disputes to Shopee Support.
    - INVALID / UNPAID ORDER REFUND QUESTION (status INVALID, no payment date): Explain no payment was captured/received by the store so store cannot refund, and redirect to Shopee Support.
    - PAYMENT / INSTALLMENT INQUIRY (Airpay, credit card installments, duplicate charges): Never confirm charged amounts as seller; clarify payments/installments/billing belong solely to Shopee and redirect to Shopee Help Center.
12. ADDRESS / DESCRIPTION UPDATE: Remind them delivery strictly follows the address registered on the Shopee shipping label and advise updating/removing old descriptions in the Shopee app before ship-out.
13. EXPEDITE ORDER / URGENT SHIPPING OR DELIVERY:
    - Clarify warmly that as seller we do not control courier speed or routing once shipped, yet confirm we follow up and expedite ("we follow up this to courier" and "we expedite follow your order to courier" -> "nós acompanhamos isso junto à transportadora" and "aceleramos o acompanhamento do seu pedido junto à transportadora"). If just placed / in preparation, quote estimated ship-out date. If shipped, share tracking & 5–14d EDD estimate + Shopee Guarantee.
14. POOR QUALITY / MISSING PART / DAMAGE (TWO-STAGE WORKFLOW):
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
15. PAYMENT SHOWS AS UNPAID / ALREADY PAID ("I paid for my order but it shows as if I had not paid"):
    - Inform the customer that our store does NOT have access to payment processing or payment details (all payments are handled directly by Shopee).
    - Reassure them: "no worries"—the payment confirmation will reflect soon, usually in less than 24 hours.
    - Inform them that if it has already been more than 24 hours (> 24h) since paying, they should contact the Shopee platform directly ("Eu" -> "Central de Ajuda" / "Atendimento") with their payment receipt so Shopee can follow up on their payment.
    - Always include an Assurance row reassuring them that their money is safe and protected by Shopee Guarantee ("Garantia Shopee") and that we will prepare and ship their order right away as soon as Shopee confirms the payment.

ASSURANCES, SHOPEE GUARANTEE & EMPATHY (MANDATORY FOR EVERY REPLY):
1. ALWAYS INCLUDE ASSURANCE (EVERY REPLY & EVERY PATH):
   - EVERY response (including general inquiries, address updates, product spec questions, out-of-scope redirects, and newly detected scenarios—plus every item in "pathReplies") MUST include an explicit "Assurance" row (marked "isKeyRule": true) reassuring the customer that their order/purchase/payment is cared for and protected by Shopee Guarantee ("Garantia Shopee"):
   - On Cancel Order (Already Shipped): "Rest assured your money is protected by Shopee Guarantee—once you refuse the order upon delivery or your request to cancel has been accepted, your money will be refunded immediately." / "Fique tranquilo, pois o seu dinheiro está protegido pela Garantia Shopee — assim que você recusar o pedido na entrega ou a sua solicitação de cancelamento for aceita, o seu dinheiro será reembolsado imediatamente."
   - On Cancel Order (In Preparation): "Rest assured your money is protected by Shopee Guarantee—once your cancellation request in the app or via the Shopee webform is accepted, your money will be refunded immediately."
   - On Poor Quality / Missing Part / Proof Sent: "Rest assured we will make sure you won't be at a loss on this, and your purchase remains protected by Shopee Guarantee."
   - On Refund / Return / Delivered-Not-Received / Product Issue: "Rest assured your money is protected by Shopee Guarantee—once your Return/Refund request is reviewed and accepted, your money will be refunded immediately through Shopee."
   - On Expedite Order / Delivery Time Inquiry / Customs Delay / Arrived in Brazil / Past EDD Today-Scan: "No worries—that date is only an estimate, as international orders usually arrive within 5–14 days. Rest assured we have requested a follow-up on your order, your package is safe and not lost, and your payment remains fully protected by Shopee Guarantee." / "Fique tranquilo, pois essa data é apenas uma estimativa — normalmente os pedidos internacionais chegam em apenas 5 a 14 dias. Já solicitamos o acompanhamento do seu pedido, o seu pacote está seguro e não foi perdido, e o seu pagamento continua totalmente protegido pela Garantia Shopee."
   - On Paid Order Shows as Unpaid: "Rest assured your money is safe and protected by Shopee Guarantee—as soon as Shopee confirms the payment in the system, we will prepare and ship your order right away."
   - On General / Address Update / Product Spec / Out-of-Scope / Canceled Discrepancy / Invalid Order / Installments / Any Other Scenario: "Rest assured your purchase is protected by Shopee Guarantee, and we are always here to help if you need anything else." / "Fique tranquilo, pois a sua compra está protegida pela Garantia Shopee e estamos sempre à disposição para ajudar no que precisar."

2. ALWAYS INCLUDE EMPATHY (WHEN NEEDED):
   - Whenever the customer expresses frustration, anger, threats, worry, urgency, confusion, delay, defect, damage, wrong/missing item, non-receipt, cancellation, refund desire, or payment concern, ALWAYS include a dedicated warm "Empathy" sentence (in a "Greeting & Empathy" or "Empathy" row) acknowledging their feelings and apologizing sincerely for any inconvenience before giving steps/policy (e.g., "We completely understand your concern and sincerely apologize for any inconvenience." / "Entendemos perfeitamente a sua preocupação e pedimos sinceras desculpas por qualquer transtorno.").
   - For purely neutral or positive questions (e.g., simple voltage/size question or eager post-payment message), match their friendly positive tone without over-apologizing, while still including the mandatory Assurance row.

FORMATTING RULES:
- If the agent provides a "Selected CX Response Path" and "Required Path Structure & Policy Guidance", you MUST follow that exact CX response stage (adapting all details to the real Order SN, product name, price/voucher tier, tracking code, carrier, and Brazilian dates from the input).
- If the agent provides "All CX Response Paths to Generate", you MUST generate a complete, tailored bilingual response in "pathReplies" for EVERY listed pathId and pathLabel (adapting each stage to the real Order SN, product name, price/voucher tier, tracking code, carrier, and Brazilian dates from the input), AND set the top-level rows/fullEnglishMessage/fullPortugueseMessage to match the primary selected path.
- Follow any explicit extra instructions given by the agent in the input (e.g., "inform that we will follow up this to the courier assigned and provide assurance").
- Write in complete, clear sentences.
- Keep each row focused on one logical part (e.g., Greeting, Empathy, Current Status, Policy / Action, Assurance, Closing).
- Mark rows that contain critical policy rules or required assurances (such as Return/Refund instructions, Shopee Guarantee assurances, or courier follow-up) with "isKeyRule": true.
- Incorporate any real Order SN, product name, carrier name, city/state, tracking code, status, voucher tier, or dates provided in the input instead of leaving generic placeholders. Only use bracketed placeholders like [DATA] / [DATE] or [RASTREAMENTO] / [TRACKING] when that information is completely missing.
- Produce "fullEnglishMessage" and "fullPortugueseMessage" by joining the rows naturally with spacing suitable for pasting into Shopee Chat.

SELF-LEARNING STORE RULES ("learnedRuleUpdates") & SCRIPT LIBRARY ("learnedScriptUpdates"):
1. "learnedScriptUpdates" (Script Library Generalized Spiel):
   - Compare the customer's actual concern and resolution flow semantically against EVERY scenario in "Existing Script Library Scenarios" (do NOT skip just because a broad word like "refund", "problem", or "delivery" appeared).
   - Emit an entry when:
     * This case introduces a NEW customer-service scenario type not clearly covered by Existing Script Library Scenarios (e.g., wrong color/size/variant sent, missing freebie, warranty or Nota Fiscal/invoice request, customs fee/tax question, damaged packaging, split order, payment method change, etc.) -> "action": "create", OR
     * The agent introduces new steps, policy wording, thresholds, or handling changes that refine an existing scenario -> "action": "update" (referencing its exact "existingScenarioId").
   - EVERY Script Library entry MUST be a **generalized reusable spiel** (never hardcode specific Order SNs, real customer names, specific product prices, or one-off tracking numbers):
     * Use clear placeholders such as [DATE], [TRACKING], [STATUS], [VOUCHER], [ISSUE TOPIC], or [INSERT SPEC] where order-specific values go.
     * Provide concise "title", "category" (Delivery | Delayed | Product | Refund | General | Platform), "whenToUse", "policyRule", a generalized "sampleInput", 3–7 bilingual "rows" (with "highlight": true on key policy/assurance rows), and "guideIds" (0–3 matching visual guide IDs, or []).

2. "learnedRuleUpdates" (Store Rules):
   - Compare any policy, threshold, SLA, link, escalation condition, or agent instruction implied by the case/agent notes (including any new handling rule needed for a newly detected scenario type) against "Active Store CS Rules (from Cloud Store Rules)".
   - Emit an entry when:
     * The case/agent introduces a NEW reusable store policy, workflow instruction, link, threshold, or handling rule NOT already captured in Active Store CS Rules ("action": "create"), OR
     * The agent modifies, corrects, or refines an EXISTING rule listed in Active Store CS Rules ("action": "update", referencing its exact "existingRuleId").
   - NEVER emit rules for routine order-specific details (Order SNs, tracking codes, names, dates) when existing rules already cover it.
   - IMPORTANT: When a case introduces a brand-new scenario type whose handling includes a new store rule/guideline, emit BOTH a "learnedScriptUpdates" entry AND a "learnedRuleUpdates" entry. Only return [] when existing scenarios and rules already fully cover everything.

EXACT SHOPEE BRAZIL APP UI NAVIGATION & REFUND SLA REFERENCE:
- Use exact Shopee Brasil UI labels when guiding customers:
  * Return/Refund request: "Eu" -> "A Caminho" -> "Pedir reembolso" (choose "Recebi todos os meus itens, mas tive problemas" or "Eu não recebi um ou mais itens do pedido") / "Devolução/Reembolso".
  * Partial Refund Counter-Offer acceptance: "Eu" -> "Devolução/Reembolso" -> "Ver Reembolso parcial" -> "Aceitar Reembolso Parcial" -> "Confirmar".
  * Cancel in preparation ("A Enviar"): "Minhas compras" -> "A Enviar" -> select order -> "Cancelar Pedido" -> select reason -> "CONFIRMAR".
  * Change address (while "A Pagar" / before shipping label): "A Pagar" -> select order -> "MODIFICAR" next to "Endereço de Entrega".
  * Redeem/Use Store Voucher: "Eu" -> "Cupons" -> aba "Loja" -> "Insira o código promocional" / "Usar"; or in Cart ("Carrinho") tap "Cupom Shopee" / "Adicionar código de cupom da loja" -> "Aplicar" -> "OK".
  * Contact Shopee CS: "Eu" -> scroll to "Central de Ajuda" -> scroll to Atendimento ao cliente -> "Chat Shopee" (Seg–Sex 08h–22h, Sáb–Dom 08h–20h).
  * Find & Copy Order ID: "Minhas compras" -> select order -> "ID do Pedido" -> "COPIAR".
  * Contact Seller Chat: Home Chat icon or "Chat Vendedor" inside "Detalhes do Pedido".
- Always cite exact Refund SLA timelines when asked "when will my refund arrive?" / "quanto tempo demora o reembolso?".
- Always populate "suggestedGuideIds" (0 to 3 matching visual guide IDs) whenever attaching one of the official customer screenshots makes your reply clearer.

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
      ? `Active Store CS Rules (from Cloud Store Rules):\n${body.customStoreRules
          .map(
            (r) =>
              `- ${r.id ? `[id=${r.id}] ` : ""}${r.topic}: ${r.english} (PT-BR: ${r.portuguese})`
          )
          .join("\n")}`
      : null,
    Array.isArray(body.existingScenarios) && body.existingScenarios.length > 0
      ? `Existing Script Library Scenarios:\n${body.existingScenarios
          .map(
            (s) =>
              `- [id=${s.id}] ${s.title} (${s.category}) | When: ${s.whenToUse} | Rule: ${s.policyRule}`
          )
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
