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
      "Format dates in Brazilian DD/MM/YYYY, share latest tracking status, courier, and Est. Delivery. Always include courier follow-up ('we follow up this to courier' / 'we expedite follow your order to courier') and Shopee Guarantee assurance.",
    portuguese:
      'Use datas em DD/MM/AAAA e informe status, transportadora e previsão de entrega. Sempre inclua "nós acompanhamos isso junto à transportadora" e "aceleramos o acompanhamento do seu pedido junto à transportadora", além da Garantia Shopee.',
    isPrimary: false,
    sortOrder: 2,
  },
  {
    id: "default-4",
    topic: "Customs Delay ('Inspeção na Alfândega')",
    english:
      "Never tell the customer the package is lost and do not suggest a refund unless they ask. Always include both required courier follow-up phrases and reassure them under Shopee Guarantee.",
    portuguese:
      'Nunca diga que o pedido foi perdido. Sempre inclua "nós acompanhamos isso junto à transportadora" e "aceleramos o acompanhamento do seu pedido junto à transportadora", com segurança pela Garantia Shopee.',
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
    topic: "Product Defect / Malfunction",
    english:
      "Never promise an immediate refund. Always request a short video demonstrating the issue first, share basic checks (power connection, ventilation), and reassure under Shopee Guarantee. If proof sent & unresolved, guide to 'Return/Refund'.",
    portuguese:
      'Nunca prometa reembolso imediato. Peça primeiro um vídeo curto, sugira verificações básicas (energia, conexões, ventilação) e assegure pela Garantia Shopee. Se persistir após o vídeo, oriente para "Devolução/Reembolso".',
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
    topic: "Mandatory Shopee Guarantee ('Garantia Shopee') Assurance",
    english:
      "Every cancellation, refund, delivery delay, expedite, quality, or unpaid-order response must include a clear assurance row confirming their money/order is protected by Shopee Guarantee.",
    portuguese:
      "Todo atendimento de cancelamento, reembolso, atraso, agilização, qualidade ou pagamento pendente deve incluir uma garantia clara de que o valor e o pedido estão protegidos pela Garantia Shopee.",
    isPrimary: false,
    sortOrder: 10,
  },
];
