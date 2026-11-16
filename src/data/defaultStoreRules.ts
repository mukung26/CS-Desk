import { StoreRuleEntry } from "../types/cs";

export const DEFAULT_STORE_RULES: StoreRuleEntry[] = [
  {
    id: "default-1",
    topic: "Direct Refund & Shopee Transactions",
    english:
      "We do not offer or issue full refunds directly from our store (no Pix/bank transfers). All payments and refunds happen exclusively inside Shopee, so clarify refunds are handled through Shopee's Return/Refund flow.",
    portuguese:
      'A nossa loja não oferece nem realiza reembolsos integrais diretamente, pois todos os pagamentos e reembolsos acontecem exclusivamente dentro da Shopee pelo fluxo de "Devolução/Reembolso".',
    isPrimary: true,
    sortOrder: 0,
  },
  {
    id: "default-2",
    topic: "Refund Timing (Within vs. Beyond Est. Delivery)",
    english:
      "Always acknowledge latest tracking status + courier follow-up and provide Shopee Guarantee assurance. If in transit & within Est. Delivery Date: advise CX they can refuse delivery or request via Shopee webform. If beyond Est. Delivery Date: instruct CX to tap 'Return/Refund'.",
    portuguese:
      'Sempre confirme a última atualização + acompanhamento com a transportadora e a Garantia Shopee. Se em trânsito dentro do prazo estimado: oriente a recusar na entrega ou solicitar pelo formulário oficial da Shopee. Se após o prazo estimado: toque em "Devolução/Reembolso".',
    isPrimary: false,
    sortOrder: 1,
  },
  {
    id: "default-3",
    topic: "Delivery Time Inquiry & Expedite Order",
    english:
      "Format dates in Brazilian DD/MM/YYYY, share latest tracking status, resolved courier, and Est. Delivery. Reassure CX ('no worries') that the date is only an estimate—international orders usually arrive within 5–14 days. Always include courier follow-up ('we follow up this to courier' / 'we expedite follow your order to courier') and Shopee Guarantee assurance.",
    portuguese:
      'Use datas em DD/MM/AAAA e informe status, transportadora e previsão. Tranquilize o cliente que essa data é apenas uma estimativa (pedidos internacionais costumam chegar em apenas 5 a 14 dias). Sempre inclua "nós acompanhamos isso junto à transportadora" e "aceleramos o acompanhamento do seu pedido junto à transportadora", além da Garantia Shopee.',
    isPrimary: false,
    sortOrder: 2,
  },
  {
    id: "default-4",
    topic: "Customs Delay ('Inspeção na Alfândega') & Arrived in Brazil",
    english:
      "Never volunteer 'lost' or 'refund' unless CX asks, and never promise a specific delivery date of your own. Explain customs or domestic sorting gaps cleanly, include both required follow-up phrases ('we follow up this to courier' / 'we expedite follow your order to courier'), and reassure under Shopee Guarantee.",
    portuguese:
      'Nunca mencione pedido perdido nem ofereça reembolso sem o cliente pedir, e nunca prometa data fixa de entrega por conta própria. Explique a triagem local/alfândega, inclua "nós acompanhamos isso junto à transportadora" e "aceleramos o acompanhamento do seu pedido junto à transportadora", com Garantia Shopee.',
    isPrimary: false,
    sortOrder: 3,
  },
  {
    id: "default-5",
    topic: "Cancel Order (In Preparation vs. Already Shipped)",
    english:
      "Store cannot cancel directly. In preparation: tap 'Cancel Order'; if unavailable, payment was distributed to Taxes + Shipping costs -> use Shopee webform. Already shipped: refuse upon delivery or use Shopee webform. Always add Shopee Guarantee immediate-refund assurance.",
    portuguese:
      'Em preparação: toque em "Cancelar pedido"; se indisponível, o pagamento já foi direcionado para Impostos e Frete -> use o formulário da Shopee. Já enviado: recuse na entrega ou use o formulário da Shopee. Sempre garanta reembolso imediato pela Garantia Shopee.',
    isPrimary: false,
    sortOrder: 4,
  },
  {
    id: "default-6",
    topic: "Poor Quality / Missing Part / Damage (2 Stages)",
    english:
      "Stage 1: Empathy + request short video/photo proof + assure no loss. Stage 2 (after proof): if item <= R$25 (do not mention limit), offer Option 1 (Keep item + R$5/10/15/20/25 Store Voucher >= item amount) or Option 2 (Return & Refund). If > R$25, escalate for a 24–48h chat update.",
    portuguese:
      'Etapa 1: Empatia + pedir vídeo/foto + garantir que não sairá no prejuízo. Etapa 2: até R$25 (sem citar o limite), oferecer Opção 1 (Ficar com o item + Cupom da Loja >= valor) ou Opção 2 (Devolução e Reembolso). Acima de R$25: encaminhar à equipe superior (atualização em 24–48h).',
    isPrimary: false,
    sortOrder: 5,
  },
  {
    id: "default-7",
    topic: "Product Defect / Malfunction (Ask Video First)",
    english:
      "Never guarantee an immediate return or refund on the spot. Always request a short video or photo first and say our team will review it, share common troubleshooting checks (1. Power supply, 2. Overheating/ventilation, 3. Loose connections, 4. Short circuit/wire insulation), and reassure under Shopee Guarantee.",
    portuguese:
      'Nunca garanta devolução ou reembolso imediato na hora. Peça primeiro um vídeo curto ou foto para análise da equipe, sugira verificações comuns (1. Fonte/voltagem, 2. Superaquecimento/ventilação, 3. Conexões soltas, 4. Curto-circuito/isolamento) e assegure pela Garantia Shopee.',
    isPrimary: false,
    sortOrder: 6,
  },
  {
    id: "default-8",
    topic: "Delivered but Not Received",
    english:
      "Clarify that we are only the seller and delivery is managed by the courier and Shopee. Ask CX to check with neighbors, family, or concierge ('porteiro'), then tap 'Return/Refund' with Shopee Guarantee assurance.",
    portuguese:
      'Esclareça que somos apenas o vendedor. Peça para verificar com vizinhos, familiares ou porteiro e, se não localizar, tocar em "Devolução/Reembolso" no aplicativo da Shopee com Garantia Shopee.',
    isPrimary: false,
    sortOrder: 7,
  },
  {
    id: "default-9",
    topic: "Paid Order Shows as Unpaid",
    english:
      "Inform CX we have no access to payment processing. Reassure it usually reflects in less than 24 hours; if >24 hours, instruct them to contact Shopee platform support with their payment receipt, plus Shopee Guarantee assurance.",
    portuguese:
      'Informe que não temos acesso aos pagamentos. Tranquilize que normalmente compensa em menos de 24 horas; se passar de 24h, oriente a contatar o atendimento da Shopee com o comprovante, com proteção da Garantia Shopee.',
    isPrimary: false,
    sortOrder: 8,
  },
  {
    id: "default-10",
    topic: "Out-of-Scope Platform & Account Issues",
    english:
      "Shopee Coins, ShopeePay, Pix payment errors, vouchers, and app bugs belong to Shopee Platform Support. Redirect politely to 'Me' -> 'Help Center'. Address updates go strictly to the Shopee shipping label.",
    portuguese:
      'Moedas Shopee, ShopeePay, erros de pagamento, cupons e falhas no app são tratados pela plataforma ("Eu" -> "Central de Ajuda"). Entregas seguem sempre o endereço cadastrado na etiqueta da Shopee.',
    isPrimary: false,
    sortOrder: 9,
  },
  {
    id: "default-11",
    topic: "Mandatory Assurance & Empathy (All Replies)",
    english:
      "Every Reply Generator response must include an explicit Assurance row confirming their order/money is protected by Shopee Guarantee (and for Est. Delivery inquiries, reassure them 'no worries'—that date is only an estimate since international orders usually arrive within 5–14 days), plus genuine Empathy whenever the customer is worried, frustrated, delayed, or facing an issue.",
    portuguese:
      'Todo atendimento deve incluir uma linha clara de Garantia ("Garantia Shopee") — nos casos de prazo, tranquilizando que a data é apenas uma estimativa (pedidos internacionais costumam chegar em 5 a 14 dias) — e empatia sincera sempre que o cliente demonstrar preocupação, atraso, frustração ou problema.',
    isPrimary: true,
    sortOrder: 10,
  },
  {
    id: "default-12",
    topic: "Official Shopee BR Refund SLA & In-App UI Paths",
    english:
      "Refund SLA: Pix, Boleto (checking account), and Caixa Virtual Debit take up to 3 calendar days; ShopeePay (and Boleto -> ShopeePay) up to 1 calendar day; Credit Card / Google Pay up to 2 billing statements; SParcelado up to 7 calendar days. Always use exact PT-BR labels ('Eu' -> 'A Caminho' -> 'Pedir reembolso', 'Cancelar Pedido', 'Central de Ajuda' -> 'Chat Shopee' Mon-Fri 08h-22h / Sat-Sun 08h-20h).",
    portuguese:
      'Prazos de reembolso: Pix, Boleto (conta corrente) e Débito Caixa até 3 dias corridos; ShopeePay até 1 dia corrido; Cartão de Crédito/Google Pay em até 2 faturas; SParcelado até 7 dias corridos. Sempre oriente os botões exatos do app ("Pedir reembolso", "Cancelar Pedido", "Central de Ajuda" -> "Chat Shopee").',
    isPrimary: false,
    sortOrder: 11,
  },
  {
    id: "default-13",
    topic: "Actual Courier Mapping (Expresso Padrão)",
    english:
      "Even when Shopee Seller Center displays 'Expresso padrão', identify the actual courier from the tracking prefix: starts with 'BR' = SPX, starts with 'AJ' = Anjun Express, any other tracking number (not BR or AJ) = Correios. Always name the real courier in replies.",
    portuguese:
      'Mesmo quando constar "Expresso padrão" no sistema, identifique a transportadora real pelo código de rastreio: iniciado em "BR" = SPX, iniciado em "AJ" = Anjun Express, e outros códigos (não BR/AJ) = Correios. Informe sempre a transportadora real ao cliente.',
    isPrimary: true,
    sortOrder: 12,
  },
  {
    id: "default-14",
    topic: "Never Volunteer Lost/Refund, Promised Dates, or Guessed Specs",
    english:
      "Never mention 'lost' or 'refund' unless the customer explicitly asks. Never invent your own promised delivery dates. Answer product specs strictly from the listing without guessing, and never confirm charged billing amounts as the seller.",
    portuguese:
      'Nunca mencione "perdido" ou "reembolso" sem o cliente pedir. Nunca prometa datas de entrega por conta própria. Responda especificações apenas conforme o anúncio e nunca confirme valores cobrados pela Shopee.',
    isPrimary: true,
    sortOrder: 13,
  },
  {
    id: "default-15",
    topic: "Past EDD With Fresh Tracking Scan Today",
    english:
      "When the Estimated Delivery Date has passed yet tracking shows a fresh update today, acknowledge the missed EDD honestly instead of quoting it as still valid, highlight today's newest movement scan, explain international customs/local distribution delays, and include both courier follow-up phrases + Shopee Guarantee.",
    portuguese:
      'Quando a data estimada já passou mas há atualização de rastreio hoje, reconheça o atraso com transparência em vez de citar o prazo antigo como válido, destaque a nova movimentação de hoje e inclua ambas as frases de acompanhamento junto à transportadora + Garantia Shopee.',
    isPrimary: false,
    sortOrder: 14,
  },
  {
    id: "default-16",
    topic: "De-Escalation (Threats, Procon, Lawyer)",
    english:
      "When CX is angry or threatens complaints, Procon, or a lawyer: stay calm, never argue or defend, never promise a specific delivery day, share tracking/customs context + both courier follow-up phrases + Shopee Guarantee, and only add the 'Return/Refund' step if they demand their money back.",
    portuguese:
      'Em ameaças, reclamações ou menção a advogado/Procon: mantenha a calma, não discuta, nunca prometa data específica de entrega, informe o status e acompanhamento junto à transportadora + Garantia Shopee, e só adicione "Devolução/Reembolso" se exigirem o dinheiro de volta.',
    isPrimary: false,
    sortOrder: 15,
  },
  {
    id: "default-17",
    topic: "Positive / Early-Stage & Already-Received Tone",
    english:
      "For positive or eager early messages right after payment ('hope it arrives soon'), match the warm tone and quote current status + EDD (5–14 days estimate) without unnecessary follow-up/escalation text. For already-received parcels with un-updated tracking, simply reassure that the driver needs a little time to scan as delivered.",
    portuguese:
      'Para mensagens positivas logo após o pagamento, mantenha o tom acolhedor informando status e previsão (5 a 14 dias) sem texto desnecessário de atraso. Para pedidos já entregues sem atualização no rastreio, apenas tranquilize sobre a baixa do entregador.',
    isPrimary: false,
    sortOrder: 16,
  },
  {
    id: "default-18",
    topic: "Canceled Discrepancy, Invalid Orders & Installment Billing",
    english:
      "If CX claims an order was canceled without refund while system shows paid/shipped, state the actual system status and redirect refund/cancellation disputes to Shopee. If order is Invalid/Unpaid with no payment date, explain no payment was captured so store cannot refund. For Airpay/credit card installments or billing amounts, redirect directly to Shopee ('Me' -> 'Help Center').",
    portuguese:
      'Em divergência de cancelamento, informe o status real do sistema (pago/enviado) e direcione à Shopee. Em pedido Inválido/Não pago, esclareça que a loja não recebeu o pagamento. Em dúvidas de parcelamento, Airpay ou cobranças, nunca confirme valores — direcione à "Central de Ajuda" da Shopee.',
    isPrimary: false,
    sortOrder: 17,
  },
];
