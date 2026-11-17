import {
  evaluateDeliveryScheduleStatus,
  isGenericExpressCarrier,
  resolveCourierFromTracking,
} from "../../shared/csPromptEngine";

export {
  evaluateDeliveryScheduleStatus,
  isGenericExpressCarrier,
  resolveCourierFromTracking,
};

export interface CourierTrackingLink {
  courier: string;
  trackingNumber: string;
  url: string;
}

export function getCourierTrackingUrl(
  trackingNumber?: string,
  rawCarrier?: string
): CourierTrackingLink | null {
  const clean = trackingNumber?.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
  if (!clean || clean.length < 6) return null;
  const courier = resolveCourierFromTracking(clean, rawCarrier) || "Correios";

  if (courier === "SPX" || clean.startsWith("BR")) {
    return {
      courier: "SPX",
      trackingNumber: clean,
      url: `https://spx.shopee.com.br/track?tracking_number=${encodeURIComponent(clean)}`,
    };
  }
  if (courier === "Anjun Express" || clean.startsWith("AJ")) {
    return {
      courier: "Anjun Express",
      trackingNumber: clean,
      url: `https://anjunexpress.com.br/?tracking=${encodeURIComponent(clean)}`,
    };
  }
  return {
    courier: "Correios",
    trackingNumber: clean,
    url: `https://rastreamento.correios.com.br/app/index.php?objeto=${encodeURIComponent(clean)}`,
  };
}

export interface ParsedShopeeOrder {
  orderSn?: string;
  trackingNumber?: string;
  carrierName?: string;
  lastUpdateDate?: string;
  estimatedDate?: string;
  latestStatus?: string;
  productAmount?: string;
  voucherAmount?: string;
  cxConcern?: string;
  matchedScenarioId?: string;
}

function computeVoucherTier(priceStr: string): string | undefined {
  const numeric = Number.parseFloat(priceStr.replace(/[^\d.,]/g, "").replace(",", "."));
  if (Number.isNaN(numeric) || numeric <= 0) return undefined;
  if (numeric > 25) return undefined;
  if (numeric <= 5) return "R$5";
  if (numeric <= 10) return "R$10";
  if (numeric <= 15) return "R$15";
  if (numeric <= 20) return "R$20";
  return "R$25";
}

function formatIsoDateToBr(raw: string): string {
  const match = raw.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return raw.trim();
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

function extractValueAfterLabel(lines: string[], labelRegex: RegExp): string | undefined {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const inlineMatch = line.match(
      new RegExp(`^${labelRegex.source}\\s*[:\\-]?\\s*(.+)$`, "i")
    );
    if (inlineMatch && inlineMatch[1]?.trim()) {
      return inlineMatch[1].trim();
    }
    if (labelRegex.test(line)) {
      for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
        const nextLine = lines[j].trim();
        if (nextLine) return nextLine;
      }
    }
  }
  return undefined;
}

function parseBrDateToIso(brDate?: string): string | null {
  if (!brDate) return null;
  const match = brDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function detectScenarioId(
  rawText: string,
  cxConcern?: string,
  estimatedDate?: string,
  lastUpdateDate?: string
): string | undefined {
  const concernText = (cxConcern || rawText).toLowerCase();
  const fullLower = rawText.toLowerCase();

  // Playbook Flow 18: Threats, Procon, Reclame Aqui, Lawyer, Report
  if (
    /procon|reclame\s*aqui|advogad|lawyer|processar|\bsue\b|report\s*page|denunciar|pol[ií]cia/i.test(
      concernText
    )
  ) {
    return "s23";
  }

  // Playbook Flow 12: Invalid / Unpaid Order Refund Question
  if (
    (/\binvalid\b|inv[aá]lido/i.test(fullLower) ||
      /invalid|inv[aá]lido/i.test(concernText)) &&
    /refund|reembolso|dinheiro/i.test(concernText)
  ) {
    return "s19";
  }

  // Playbook Flow 11: "Order was canceled but no refund" discrepancy (while paid & shipped)
  if (
    /(?:cancel|cancelad[oa]).*(?:no\s*refund|sem\s*reembolso|n[aã]o\s*(?:recebi|veio)\s*(?:o\s*)?reembolso)/i.test(
      concernText
    ) &&
    !/\binvalid\b/i.test(fullLower)
  ) {
    return "s18";
  }

  // Playbook Flow 21: Payment / Installment Inquiry (Airpay, Credit Card, duplicate charge)
  if (
    /airpay|parcela|parcelamento|installment|credit\s*card|cart[aã]o\s*de\s*cr[eé]dito|duplicad|cobran[cç]a\s*indevida/i.test(
      concernText
    )
  ) {
    return "s24";
  }

  // Check explicit CX concern first, then full paste context
  if (/already\s*received|já\s*recebi|tracking\s*not\s*updated|rastreio\s*não\s*atualiz/i.test(concernText)) {
    return "s8";
  }
  if (/delivered\s*but\s*not\s*received|consta\s*como\s*entregue|diz\s*que\s*foi\s*entregue|não\s*recebi/i.test(concernText)) {
    return "s5";
  }
  if (/pix|direct\s*refund|full\s*refund|reembolso\s*direto|devolver\s*o\s*dinheiro/i.test(concernText)) {
    if (/already\s*shipped|já\s*enviado|in\s*transit|em\s*trânsito/i.test(fullLower)) {
      return "s7";
    }
    if (/past|atrasad|ultrapass/i.test(fullLower)) {
      return "s6";
    }
    return "s12";
  }
  if (/cancel|cancelar/i.test(concernText)) {
    if (
      /pickup_done|picked_up|already\s*shipped|shipped\s*out|já\s*enviado|já\s*foi\s*enviado|em\s*trânsito|coletado/i.test(
        fullLower
      )
    ) {
      return "s7";
    }
    return "s13";
  }
  if (/refund|reembolso|devolução/i.test(concernText)) {
    if (
      /past|beyond|atrasad|ultrapass|pickup_done|picked_up|in\s*transit|em\s*trânsito|estimated\s*delivery\s*time/i.test(
        fullLower
      )
    ) {
      return "s6";
    }
    return "s12";
  }
  if (
    /sent\s*proof|proof\s*sent|cx\s*send\s*proof|enviou\s*(o\s*)?(vídeo|video|foto|prova)|mandei\s*(o\s*)?(vídeo|video|foto)|poor\s*quality|bad\s*quality|quality|qualidade|missing|clutch|tarraxa|veio\s*sem|faltando|sem\s*a\s*peça|damage|damaged|danificad/i.test(
      concernText
    )
  ) {
    return "s15";
  }
  if (/defect|broken|not\s*working|shut|desliga|quebrad|não\s*funciona|defeito|problema/i.test(concernText)) {
    return "s2";
  }
  if (/address|endereço|casa\s*\d|descrição/i.test(concernText)) {
    return "s1";
  }
  if (/4pm|5pm|horário|hora\s*da\s*entrega|delivery\s*time\s*preference|só\s*estou\s*em\s*casa/i.test(concernText)) {
    return "s9";
  }
  if (/voltage|voltagem|bivolt|size|tamanho|material|spec|especificaç/i.test(concernText)) {
    return "s10";
  }
  if (
    /shows?\s*(?:as\s*(?:if\s*)?)?(?:i\s*had\s*)?(?:not\s*paid|unpaid)|paid\s*for\s*my\s*order|already\s*paid|não\s*consta\s*(?:o\s*)?pagamento|já\s*paguei|aguardando\s*pagamento|não\s*compensou/i.test(
      concernText
    ) ||
    (/\bunpaid\b/i.test(fullLower) && /\bpaid\b|paguei|pagamento/i.test(concernText))
  ) {
    return "s16";
  }
  if (/coins|moedas|shopeepay|voucher|cupom|app\s*bug|pagamento|boleto/i.test(concernText)) {
    return "s11";
  }
  if (/expedite|rush|urgent|prioritize|agilizar|acelerar|urgente|prioridade|o mais rápido/i.test(concernText)) {
    return "s14";
  }

  // Playbook Flow 05: Arrived in Brazil with no updates
  if (/chegou\s*(?:no|ao)\s*brasil|arrived\s*in\s*brazil/i.test(fullLower) && !/liberado\s*na\s*alfândega/i.test(fullLower)) {
    return "s17";
  }

  // Playbook Flow 17: Past EDD, yet tracking updated today
  const estIso = parseBrDateToIso(estimatedDate);
  const lastIso = parseBrDateToIso(lastUpdateDate);
  const todayIso = new Date().toISOString().slice(0, 10);
  if (
    (estIso && estIso < todayIso && ((lastIso && lastIso === todayIso) || /updated\s*today|atualiza[çc][aã]o\s*hoje|\btoday\b/i.test(fullLower))) ||
    (/past\s*(?:the\s*)?edd|passou\s*(?:da\s*)?data/i.test(concernText) && /updated\s*today|atualiz.*hoje/i.test(fullLower))
  ) {
    return "s22";
  }

  if (/alfândega|customs/i.test(concernText) || (/inspeção\s*na\s*alfândega/i.test(fullLower) && !/liberado\s*na\s*alfândega/i.test(fullLower))) {
    return "s3";
  }

  // Playbook Flow 16: Order Just Paid — Early Stage Positive Reassurance
  if (/hope\s*it\s*arrives\s*soon|espero\s*que\s*chegue\s*logo|just\s*paid|acabei\s*de\s*pagar/i.test(concernText)) {
    return "s21";
  }

  // Playbook Flow 15: "Will it be delivered?" confirmation
  if (/will\s*(?:it|my\s*order)\s*(?:still\s*)?be\s*delivered|vai\s*(?:mesmo\s*)?ser\s*entregue|chegar\s*mesmo/i.test(concernText)) {
    return "s20";
  }

  if (/when\s*does\s*it\s*arrive|where\s*is\s*my\s*order|cadê|quando\s*chega|prazo|imprevisto|trânsito/i.test(concernText)) {
    return "s4";
  }

  return undefined;
}

export function parseShopeeOrderPaste(rawText: string): ParsedShopeeOrder {
  if (!rawText.trim()) return {};

  const lines = rawText.split(/\r?\n/);
  const result: ParsedShopeeOrder = {};

  const orderSn = extractValueAfterLabel(lines, /Order\s*SN/i);
  if (orderSn && /^[A-Z0-9]{8,}$/i.test(orderSn)) {
    result.orderSn = orderSn;
  }

  const tracking = extractValueAfterLabel(lines, /Shipping\s*Tracking\s*No/i);
  if (tracking && !/Shipping\s*Carrier/i.test(tracking)) {
    result.trackingNumber = tracking;
  }

  const carrier = extractValueAfterLabel(lines, /Shipping\s*Carrier\s*Name/i);
  const rawCarrier =
    carrier && !/Integrated|Shipping\s*Logistics/i.test(carrier)
      ? carrier
      : undefined;
  const resolvedCarrier = resolveCourierFromTracking(
    result.trackingNumber,
    rawCarrier
  );
  if (resolvedCarrier) {
    result.carrierName = resolvedCarrier;
  }

  const estRaw = extractValueAfterLabel(lines, /Estimated\s*Delivery\s*Time/i);
  if (estRaw) {
    result.estimatedDate = formatIsoDateToBr(estRaw);
  }

  const latestRaw = extractValueAfterLabel(lines, /Latest\s*Logistic\s*Date/i);
  if (latestRaw) {
    result.lastUpdateDate = formatIsoDateToBr(latestRaw);
  }

  const latestStatus = extractValueAfterLabel(lines, /Latest\s*Logistic\s*Status/i);
  if (latestStatus) {
    result.latestStatus = latestStatus;
  }

  const unitPriceMatch = rawText.match(/R\$\s*(\d+(?:[.,]\d{2}))\s*x\s*\d+/i);
  const grandTotalMatch = rawText.match(/(?:Grand\s*Total|Total)\s*[:\n\s]*R\$\s*(\d+(?:[.,]\d{2}))/i);
  if (unitPriceMatch?.[1]) {
    result.productAmount = `R$${unitPriceMatch[1]}`;
  } else if (grandTotalMatch?.[1]) {
    result.productAmount = `R$${grandTotalMatch[1]}`;
  }

  if (result.productAmount) {
    result.voucherAmount = computeVoucherTier(result.productAmount);
  }

  const cxMatch = rawText.match(/(?:^|\n)\s*CX\s*[>:]\s*(.+)/i);
  if (cxMatch && cxMatch[1]) {
    result.cxConcern = cxMatch[1].trim();
  }

  result.matchedScenarioId = detectScenarioId(
    rawText,
    result.cxConcern,
    result.estimatedDate,
    result.lastUpdateDate
  );

  return result;
}

export function detectDefaultPathForScenario(
  scenarioId: string | undefined,
  rawText: string,
  parsed: ParsedShopeeOrder
): string | undefined {
  if (!scenarioId) return undefined;
  const lower = rawText.toLowerCase();

  if (scenarioId === "s15") {
    if (
      /accept(ed)?\s*(option\s*1|voucher|offer)|chose\s*option\s*1|aceitou|ficar\s*com\s*o\s*item/i.test(
        lower
      )
    ) {
      return "accepted-voucher";
    }
    if (
      /chose\s*option\s*2|accept(ed)?\s*(option\s*2|return)|prefere\s*devolver|devolu[cç][aã]o\s*e\s*reembolso/i.test(
        lower
      )
    ) {
      return "accepted-return";
    }
    if (
      /sent\s*proof|proof\s*sent|cx\s*send\s*proof|enviou\s*(o\s*)?(vídeo|video|foto|prova)|mandei\s*(o\s*)?(vídeo|video|foto)/i.test(
        lower
      )
    ) {
      return parsed.voucherAmount
        ? "proof-under-25"
        : parsed.productAmount
          ? "proof-over-25"
          : "proof-under-25";
    }
    return "initial";
  }

  if (scenarioId === "s13") {
    return /unavailable|missing|not\s*available|não\s*disponível|sem\s*botão/i.test(
      lower
    )
      ? "button-missing"
      : "initial";
  }

  if (scenarioId === "s14") {
    if (/order_created|to_ship|being\s*prepared|in\s*preparation|em\s*prepara[çc][aã]o|just\s*placed/i.test(lower)) {
      return "in-preparation-urgent";
    }
    return /trip|event|specific\s*date|prazo\s*espec[ií]fico/i.test(lower)
      ? "specific-deadline"
      : "initial";
  }

  if (scenarioId === "s16") {
    return /(?:>|over|more\s*than|mais\s*de|passou\s*de)\s*24\s*h/i.test(lower)
      ? "over-24h"
      : "initial";
  }

  if (scenarioId === "s23") {
    return /refund|reembolso|dinheiro\s*de\s*volta|money\s*back/i.test(lower)
      ? "demands-refund"
      : "initial";
  }

  if (["s17", "s18", "s19", "s20", "s21", "s22", "s24"].includes(scenarioId)) {
    return "initial";
  }

  if (scenarioId === "s6") {
    const estBr = parsed.estimatedDate;
    if (estBr && /^\d{2}\/\d{2}\/\d{4}$/.test(estBr)) {
      const [d, m, y] = estBr.split("/");
      const estIso = `${y}-${m}-${d}`;
      const todayIso = new Date().toISOString().slice(0, 10);
      if (estIso >= todayIso) {
        return "within-est";
      }
      return "beyond-est";
    }
    if (
      /within|before\s*est|in\s*transit/i.test(lower) &&
      !/past|beyond|atrasad|ultrapass/i.test(lower)
    ) {
      return "within-est";
    }
    return "beyond-est";
  }

  if (scenarioId === "s2") {
    return /sent\s*video|still\s*not\s*working|continua|já\s*mandei\s*o\s*vídeo/i.test(
      lower
    )
      ? "video-sent"
      : "initial";
  }

  return undefined;
}

export function splitBatchOrderPastes(rawText: string, maxItems = 5): string[] {
  const trimmed = rawText.trim();
  if (!trimmed) return [];

  // 1. Explicit horizontal separators (--- or ===)
  if (/^\s*(?:---+|===+)\s*$/m.test(trimmed)) {
    return trimmed
      .split(/^\s*(?:---+|===+)\s*$/m)
      .map((chunk) => chunk.trim())
      .filter(Boolean)
      .slice(0, maxItems);
  }

  // 2. Auto-detect multiple Order SN / Order # headers
  const lines = trimmed.split(/\r?\n/);
  const blocks: string[] = [];
  let current: string[] = [];

  const isOrderBoundary = (line: string, idx: number): boolean => {
    if (idx === 0) return false;
    const t = line.trim();
    if (!t) return false;
    const startsNewOrder =
      /^Order\s*(?:SN\s*:?|#[A-Z0-9]{6,})/i.test(t) ||
      /^Case\s*\d+\s*[:\-]/i.test(t);
    if (!startsNewOrder) return false;
    // Only split if current block already has substantial content or a CX concern
    const currentText = current.join("\n");
    return (
      currentText.trim().length > 25 &&
      (/(?:CX\s*[>:]|Order\s*(?:SN|#))/i.test(currentText) || current.length >= 2)
    );
  };

  for (let i = 0; i < lines.length; i++) {
    if (isOrderBoundary(lines[i], i)) {
      const joined = current.join("\n").trim();
      if (joined) blocks.push(joined);
      current = [lines[i]];
    } else {
      current.push(lines[i]);
    }
  }
  const tail = current.join("\n").trim();
  if (tail) blocks.push(tail);

  if (blocks.length > 1) {
    return blocks.slice(0, maxItems);
  }

  // 3. Fallback: split on double blank lines when multiple blocks contain ">" or "CX"
  const doubleBreakParts = trimmed
    .split(/\n{3,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (doubleBreakParts.length > 1) {
    return doubleBreakParts.slice(0, maxItems);
  }

  return [trimmed];
}
