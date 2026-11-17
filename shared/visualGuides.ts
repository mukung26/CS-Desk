export type VisualGuideCategory =
  | "All"
  | "Refunds & Returns"
  | "Orders & Address"
  | "Vouchers"
  | "Support & Chat";

export interface VisualGuide {
  id: string;
  title: string;
  titlePt: string;
  category: Exclude<VisualGuideCategory, "All">;
  imagePath: string;
  fileName: string;
  whenToSend: string;
  summaryEn: string;
  summaryPt: string;
  uiStepsPt: string[];
  keywords: string[];
}

export interface RefundSlaRow {
  methodPt: string;
  methodEn: string;
  destinationPt: string;
  destinationEn: string;
  timeframePt: string;
  timeframeEn: string;
}

export const REFUND_SLA_ROWS: RefundSlaRow[] = [
  {
    methodPt: "Pix",
    methodEn: "Pix",
    destinationPt: "Na conta bancária do Pix utilizada na compra",
    destinationEn: "Pix bank account used for the purchase",
    timeframePt: "Até 3 dias corridos",
    timeframeEn: "Up to 3 calendar days",
  },
  {
    methodPt: "Cartão de Crédito",
    methodEn: "Credit Card",
    destinationPt: "Cartão de crédito (estorno na fatura)",
    destinationEn: "Credit card (statement credit)",
    timeframePt: "Em até 2 faturas à depender da sua instituição financeira",
    timeframeEn: "Up to 2 billing statements depending on your bank",
  },
  {
    methodPt: "Boleto (Conta Corrente)",
    methodEn: "Boleto (Checking Account)",
    destinationPt: "Conta Corrente cadastrada na Shopee no momento da solicitação da devolução",
    destinationEn: "Checking account registered in Shopee at return request",
    timeframePt: "Até 3 dias corridos",
    timeframeEn: "Up to 3 calendar days",
  },
  {
    methodPt: "Boleto (ShopeePay)",
    methodEn: "Boleto (ShopeePay)",
    destinationPt: "ShopeePay",
    destinationEn: "ShopeePay wallet",
    timeframePt: "Até 1 dia corrido",
    timeframeEn: "Up to 1 calendar day",
  },
  {
    methodPt: "Cartão de débito virtual Caixa",
    methodEn: "Caixa Virtual Debit Card",
    destinationPt: "Cartão de débito",
    destinationEn: "Debit card",
    timeframePt: "Até 3 dias corridos",
    timeframeEn: "Up to 3 calendar days",
  },
  {
    methodPt: "ShopeePay",
    methodEn: "ShopeePay",
    destinationPt: "Carteira ShopeePay",
    destinationEn: "ShopeePay wallet",
    timeframePt: "Até 1 dia corrido",
    timeframeEn: "Up to 1 calendar day",
  },
  {
    methodPt: "SParcelado",
    methodEn: "SParcelado",
    destinationPt: "Carteira SParcelado ou carteira ShopeePay",
    destinationEn: "SParcelado wallet or ShopeePay wallet",
    timeframePt: "Até 7 dias corridos",
    timeframeEn: "Up to 7 calendar days",
  },
  {
    methodPt: "Google Pay",
    methodEn: "Google Pay",
    destinationPt: "Cartão de crédito utilizado na compra (estorno na fatura)",
    destinationEn: "Credit card linked in Google Pay (statement credit)",
    timeframePt: "Em até 2 faturas à depender da sua instituição financeira",
    timeframeEn: "Up to 2 billing statements depending on your bank",
  },
];

export const VISUAL_GUIDES: VisualGuide[] = [
  {
    id: "refund-sla",
    title: "Refund SLA Table (By Payment Method)",
    titlePt: "Prazos de Reembolso da Shopee",
    category: "Refunds & Returns",
    imagePath: "/assets/aistudio/Refund_Service_Level_Agreement_7a543e07.png",
    fileName: "Shopee_Prazos_Reembolso.png",
    whenToSend:
      "Send when CX asks when their refund will arrive, how long Pix/Card/Boleto refunds take, or where the money is credited.",
    summaryEn:
      "Shopee refund timelines: Pix/Boleto (bank)/Caixa Virtual Debit up to 3 calendar days; ShopeePay/Boleto (ShopeePay) up to 1 calendar day; Credit Card/Google Pay up to 2 billing statements; SParcelado up to 7 calendar days.",
    summaryPt:
      "Confira na imagem os prazos oficiais de reembolso da Shopee conforme o seu método de pagamento (Pix, Boleto e Débito Caixa: até 3 dias corridos; ShopeePay: até 1 dia corrido; Cartão de Crédito e Google Pay: até 2 faturas; SParcelado: até 7 dias corridos).",
    uiStepsPt: [
      "Pix: Na conta bancária do Pix utilizada na compra (até 3 dias corridos)",
      "Cartão de Crédito / Google Pay: Estorno na fatura em até 2 faturas (depende do banco)",
      "Boleto: Conta Corrente cadastrada (até 3 dias corridos) ou ShopeePay (até 1 dia corrido)",
      "Cartão de débito virtual Caixa: Até 3 dias corridos · ShopeePay: Até 1 dia corrido · SParcelado: Até 7 dias corridos",
    ],
    keywords: [
      "refund",
      "sla",
      "prazo",
      "reembolso",
      "pix",
      "fatura",
      "cartão",
      "boleto",
      "shopeepay",
      "sparcelado",
      "google pay",
      "dias corridos",
    ],
  },
  {
    id: "return-refund",
    title: "Request Return / Refund ('Pedir reembolso')",
    titlePt: "Como Solicitar Devolução/Reembolso",
    category: "Refunds & Returns",
    imagePath: "/assets/aistudio/ReturnRefund_request_guide_75c89296.png",
    fileName: "Shopee_Pedir_Reembolso.png",
    whenToSend:
      "Send whenever instructing CX to open a Return/Refund request (past Est. Delivery, delivered-not-received, defective item after video, or Option 2 return).",
    summaryEn:
      'Step-by-step guide: 1. Tap "Eu" (Me) → 2. Tap "A Caminho" → 3. Tap "Pedir reembolso" → 4. Choose whether you received the items with problems or did not receive them.',
    summaryPt:
      'Siga o passo a passo da imagem para solicitar o reembolso: 1. Toque em "Eu" → 2. Toque em "A Caminho" → 3. Toque em "Pedir reembolso" → 4. Selecione a opção que melhor descreve o seu problema.',
    uiStepsPt: [
      '1. Clique em "Eu"',
      '2. Clique em "A Caminho"',
      '3. Clique em "Pedir reembolso"',
      '4. Selecione "Recebi todos os meus itens, mas tive problemas" ou "Eu não recebi um ou mais itens do pedido"',
    ],
    keywords: [
      "return",
      "refund",
      "pedir reembolso",
      "devolução",
      "reembolso",
      "a caminho",
      "não recebi",
      "defeito",
      "delivered not received",
    ],
  },
  {
    id: "counter-offer",
    title: "Accept Partial Refund Counter-Offer",
    titlePt: "Como Aceitar Reembolso Parcial",
    category: "Refunds & Returns",
    imagePath: "/assets/aistudio/CounterOffer_0d12edd7.png",
    fileName: "Shopee_Aceitar_Reembolso_Parcial.png",
    whenToSend:
      "Send when CX has a partial refund proposal in their Return/Refund dispute and needs instructions to accept without returning the item.",
    summaryEn:
      'Step-by-step guide: 1. "Eu" → 2. "Devolução/Reembolso" → 3. "Ver Reembolso parcial" → 4. "Aceitar Reembolso Parcial" → 5. "Confirmar".',
    summaryPt:
      'Para aceitar a proposta de reembolso parcial sem precisar devolver o item: 1. Toque em "Eu" → 2. "Devolução/Reembolso" → 3. "Ver Reembolso parcial" → 4. "Aceitar Reembolso Parcial" → 5. "Confirmar".',
    uiStepsPt: [
      '1. Clique em "Eu"',
      '2. Clique em "Devolução/Reembolso"',
      '3. Clique em "Ver Reembolso parcial"',
      '4. Clique em "Aceitar Reembolso Parcial"',
      '5. Clique em "Confirmar" para liberar o reembolso sem precisar devolver o item',
    ],
    keywords: [
      "partial refund",
      "counter offer",
      "reembolso parcial",
      "aceitar reembolso",
      "ver reembolso parcial",
      "proposta",
    ],
  },
  {
    id: "cancel-order",
    title: "Cancel Order (In Preparation / 'A Enviar')",
    titlePt: "Como Cancelar Pedido em Preparação",
    category: "Orders & Address",
    imagePath: "/assets/aistudio/Cancel_Order_Guide_a2224d63.png",
    fileName: "Shopee_Cancelar_Pedido.png",
    whenToSend:
      "Send when order is still in preparation (not yet shipped) and CX wants to cancel in the Shopee app.",
    summaryEn:
      'Step-by-step guide: 1. Select the order under "A Enviar" → 2. Tap "Cancelar Pedido" → 3. Select the cancellation reason → 4. Tap "CONFIRMAR".',
    summaryPt:
      'Para cancelar o pedido enquanto ainda está em preparação: 1. Acesse "Minhas compras" → "A Enviar" e selecione o pedido → 2. Toque em "Cancelar Pedido" → 3. Selecione o motivo do cancelamento → 4. Toque em "CONFIRMAR".',
    uiStepsPt: [
      '1. Em "Minhas compras" → "A Enviar", selecione o pedido',
      '2. Selecione "Cancelar Pedido" nos Detalhes do Pedido',
      "3. Selecione o motivo do cancelamento",
      '4. Selecione "CONFIRMAR"',
    ],
    keywords: [
      "cancel",
      "cancelar",
      "cancelar pedido",
      "a enviar",
      "in preparation",
      "em preparação",
    ],
  },
  {
    id: "change-address",
    title: "Change Delivery Address (Unpaid / Before Label)",
    titlePt: "Como Alterar Endereço de Entrega",
    category: "Orders & Address",
    imagePath: "/assets/aistudio/Change_Address_90fde91f.png",
    fileName: "Shopee_Alterar_Endereco.png",
    whenToSend:
      "Send when CX asks to change or update their delivery address/description on a pending/unpaid order before ship-out.",
    summaryEn:
      'Step-by-step guide: 1. Tap "A Pagar" → 2. Select the order → 3. Tap "MODIFICAR" next to "Endereço de Entrega" → 4. Select or add the updated address.',
    summaryPt:
      'Para alterar o endereço diretamente pelo app (enquanto disponível antes do envio): 1. Toque em "A Pagar" → 2. Selecione o pedido → 3. Em "Endereço de Entrega", toque em "MODIFICAR" → 4. Selecione ou adicione o novo endereço.',
    uiStepsPt: [
      '1. Selecione "A Pagar"',
      "2. Selecione o pedido",
      '3. Em "Endereço de Entrega", selecione "MODIFICAR"',
      "4. Selecione o endereço desejado ou toque em \"Adicione um novo endereço\"",
    ],
    keywords: [
      "address",
      "endereço",
      "modificar",
      "alterar endereço",
      "a pagar",
      "descrição",
    ],
  },
  {
    id: "voucher-wallet",
    title: "Voucher Wallet ('Meus Cupons' → 'Loja')",
    titlePt: "Como Resgatar Cupom na Carteira",
    category: "Vouchers",
    imagePath: "/assets/aistudio/Voucher_Wallet_e0bff0ab.png",
    fileName: "Shopee_Meus_Cupons_Loja.png",
    whenToSend:
      "Send when CX received a Store Voucher (e.g., Option 1 <= R$25 resolution) or needs to find/enter a store voucher in their account.",
    summaryEn:
      'Shows where to find & redeem store vouchers: "Eu" → "Cupons" → "Loja" tab → enter promo code or tap "Usar".',
    summaryPt:
      'Veja na imagem onde encontrar e resgatar o cupom da loja: acesse "Eu" → "Cupons" → aba "Loja" → insira o código promocional ou toque em "Usar".',
    uiStepsPt: [
      '1. Na aba "Eu", toque em "Cupons" (Minha Carteira)',
      '2. Selecione a aba "Loja"',
      '3. Toque em "Insira o código promocional" ou clique em "Usar" no cupom disponível',
    ],
    keywords: [
      "voucher",
      "cupom",
      "cupons",
      "loja",
      "meus cupons",
      "resgatar",
      "option 1",
    ],
  },
  {
    id: "voucher-steps",
    title: "Apply Voucher in Cart ('Cupom Shopee' → 'Aplicar')",
    titlePt: "Como Aplicar Cupom no Carrinho",
    category: "Vouchers",
    imagePath: "/assets/aistudio/Voucher_Steps_dfe9c4dd.png",
    fileName: "Shopee_Aplicar_Cupom_Carrinho.png",
    whenToSend:
      "Send when CX asks how to apply a voucher code in their shopping cart at checkout.",
    summaryEn:
      'Step-by-step cart guide: 1. Tap "Cupom Shopee" (or store coupon row) in Carrinho → 2. Enter the voucher code → 3. Tap "Aplicar" and "OK".',
    summaryPt:
      'Para aplicar o código do cupom no Carrinho: 1. Selecione "Cupom Shopee" (ou "Adicionar código de cupom da loja") → 2. Digite o código do cupom → 3. Toque em "Aplicar" e depois em "OK".',
    uiStepsPt: [
      '1. No Carrinho, selecione "Cupom Shopee" (ou "Adicionar código de cupom da loja")',
      "2. Digite o código do cupom",
      '3. Selecione "Aplicar" e confirme em "OK"',
    ],
    keywords: [
      "apply voucher",
      "aplicar cupom",
      "carrinho",
      "código",
      "cupom shopee",
      "checkout",
    ],
  },
  {
    id: "contact-shopee-cs",
    title: "Contact Shopee Customer Service ('Chat Shopee')",
    titlePt: "Como Falar com o Chat da Shopee",
    category: "Support & Chat",
    imagePath:
      "/assets/aistudio/How_to_contact_Shopee_Customer_Service_Guide_7671959c.png",
    fileName: "Shopee_Contato_Atendimento.png",
    whenToSend:
      "Send for Out-of-Scope platform issues (Shopee Coins, ShopeePay, payment >24h unpaid, Pix bugs, account issues) so CX can reach live Shopee CS.",
    summaryEn:
      'Step-by-step guide: 1. Tap "Eu" → 2. Scroll to "Central de Ajuda" → 3. Scroll to Atendimento ao cliente and tap "Chat Shopee" (Mon–Fri 08h–22h, Sat–Sun 08h–20h).',
    summaryPt:
      'Para falar diretamente com o atendimento da Shopee: 1. Toque em "Eu" → 2. Role até "Central de Ajuda" → 3. Role até Atendimento ao cliente e toque em "Chat Shopee" (Segunda a Sexta: 08h às 22h · Sábado e Domingo: 08h às 20h).',
    uiStepsPt: [
      '1. Toque no ícone "Eu" no canto inferior direito',
      '2. Role a página até Suporte Shopee e clique em "Central de Ajuda"',
      '3. Role até a área de Atendimento ao cliente e clique em "Chat Shopee" (Seg–Sex: 08h às 22h | Sáb–Dom: 08h às 20h)',
    ],
    keywords: [
      "shopee cs",
      "central de ajuda",
      "chat shopee",
      "atendimento",
      "unpaid",
      "coins",
      "shopeepay",
      "out of scope",
      "payment",
    ],
  },
  {
    id: "find-order",
    title: "Find Order & Copy Order ID ('ID do Pedido')",
    titlePt: "Como Encontrar e Copiar o ID do Pedido",
    category: "Orders & Address",
    imagePath: "/assets/aistudio/Find_Order_Guide_7785b01b.png",
    fileName: "Shopee_Encontrar_ID_Pedido.png",
    whenToSend:
      "Send when CX cannot find their order in the app or needs to copy their Order ID (ID do Pedido) for Shopee support/webform.",
    summaryEn:
      'Step-by-step guide: 1. Open "Eu" / "Minhas compras" (e.g., "A Avaliar") → 2. Select the order → 3. View "ID do Pedido" and tap "COPIAR".',
    summaryPt:
      'Para localizar seu pedido e copiar o número do pedido: 1. Acesse "Eu" → "Minhas compras" (ex.: "A Avaliar" / "A Caminho") → 2. Selecione o pedido → 3. Veja o "ID do Pedido" e toque em "COPIAR".',
    uiStepsPt: [
      '1. Acesse "Minhas compras" (ex.: A Avaliar, A Caminho ou Em preparação)',
      "2. Selecione o pedido",
      '3. Visualize o "ID do Pedido" e toque em "COPIAR", se necessário',
    ],
    keywords: [
      "order id",
      "id do pedido",
      "copiar",
      "encontrar pedido",
      "minhas compras",
      "webform",
    ],
  },
  {
    id: "contact-seller",
    title: "Chat Icons & Contact Seller ('Chat Vendedor')",
    titlePt: "Ícones de Chat / Botão Chat Vendedor",
    category: "Support & Chat",
    imagePath: "/assets/aistudio/Contact_Seller_Guide_85431f98.png",
    fileName: "Shopee_Chat_Vendedor.png",
    whenToSend:
      "Send when guiding CX back to Seller Chat (e.g., to send proof video/photos or check updates from Detalhes do Pedido).",
    summaryEn:
      'Shows where to open chat with the seller: tap the Chat icon on the Shopee Home screen or the "Chat Vendedor" button inside "Detalhes do Pedido".',
    summaryPt:
      'Para nos enviar mensagens, fotos ou vídeos pelo chat: toque no ícone do chat na tela inicial da Shopee ou no botão "Chat Vendedor" dentro de "Detalhes do Pedido".',
    uiStepsPt: [
      "Na tela inicial da Shopee: toque no ícone do chat no topo direito",
      'Dentro de "Detalhes do Pedido": toque no botão "Chat Vendedor"',
    ],
    keywords: [
      "chat vendedor",
      "contatar vendedor",
      "enviar vídeo",
      "enviar foto",
      "detalhes do pedido",
    ],
  },
];

export const VISUAL_GUIDE_BY_ID: Record<string, VisualGuide> = Object.fromEntries(
  VISUAL_GUIDES.map((g) => [g.id, g])
);

export const VISUAL_GUIDE_CATEGORIES: VisualGuideCategory[] = [
  "All",
  "Refunds & Returns",
  "Orders & Address",
  "Vouchers",
  "Support & Chat",
];

export function buildVisualGuidesPromptReference(): string {
  const guideLines = VISUAL_GUIDES.map(
    (g) => `- id="${g.id}" | ${g.title}: ${g.whenToSend}`
  ).join("\n");

  const slaLines = REFUND_SLA_ROWS.map(
    (r) => `- ${r.methodPt}: ${r.timeframePt} (${r.timeframeEn})`
  ).join("\n");

  return `SHOPEE REFUND SLAS:
${slaLines}

VISUAL GUIDES (return 0-3 ids in "suggestedGuideIds"):
${guideLines}`;
}
