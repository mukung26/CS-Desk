/**
 * Brazilian Regional Slang, Emotional Temperature & Legal Threat Detector
 * Tailored for Shopee Brazil Customer Service operations.
 */

export interface DetectedSlangCategory {
  id: "legal-risk" | "distrust-risk" | "colloquial-slang" | "urgency-anxiety";
  label: string;
  badgeColor: string;
  level: "critical" | "warning" | "info";
  icon: string;
  description: string;
  toneTip: string;
  matchedTerms: string[];
}

export interface SlangAnalysisResult {
  hasSlangOrTriggers: boolean;
  highestRiskLevel: "critical" | "warning" | "info" | "none";
  categories: DetectedSlangCategory[];
  promptEmpathyContext: string;
}

interface PatternRule {
  id: DetectedSlangCategory["id"];
  label: string;
  badgeColor: string;
  level: DetectedSlangCategory["level"];
  icon: string;
  description: string;
  toneTip: string;
  regex: RegExp;
}

const PATTERNS: PatternRule[] = [
  {
    id: "legal-risk",
    label: "Ameaça Legal / Procon",
    badgeColor: "bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300 border-red-300 dark:border-red-800",
    level: "critical",
    icon: "⚖️",
    description: "Cliente mencionou Procon, Reclame Aqui, Juizado ou ação judicial.",
    toneTip:
      "Protocolo de Desescalada: Jamais confronte ou argumente. Valide os direitos sob o CDC, assegure a proteção total da Garantia Shopee e oriente a recusa do pacote ou o botão oficial de Reembolso sem burocracia.",
    regex:
      /\b(procon|reclame\s*aqui|reclameaqui|pequenas\s*causas|juizado|processar|vou\s+processar|processo\s+judicial|advogad[oa]|chamar\s+(?:o|meu)\s+advogado|estelionato|pol[ií]cia|abrir\s+b\.?o\.?|boletim\s+de\s+ocorr[eê]ncia|cdc\b|c[oó]digo\s+de\s+defesa|lei\s+do\s+consumidor)\b/gi,
  },
  {
    id: "distrust-risk",
    label: "Suspeita de Golpe / Desconfiança",
    badgeColor: "bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800",
    level: "warning",
    icon: "🛡️",
    description: "Cliente suspeita de golpe, calote, enrolação ou expressa forte frustração.",
    toneTip:
      "Garantia de Confiança: Enfatize que todo o pagamento fica retido em custódia segura na Garantia Shopee (o vendedor não recebe o valor antes da entrega) e forneça a transportadora e código de rastreamento oficial.",
    regex:
      /\b(golpe|isso\s+[eé]\s+golpe|parece\s+golpe|furada|calote|vou\s+levar\s+calote|tomei\s+calote|pilantragem|enrola[cç][aã]o|t[aã]o\s+me\s+enrolando|s[oó]\s+enrolando|falta\s+de\s+respeito|palha[cç]ada|palha[cç]o|engana[cç][aã]o|sacanagem|t[aá]\s+de\s+sacanagem|lixo\s+de\s+atendimento|empresa\s+lixo|produto\s+falso|loja\s+falsa)\b/gi,
  },
  {
    id: "urgency-anxiety",
    label: "Urgência / Presente / Viagem",
    badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300 dark:border-blue-800",
    level: "info",
    icon: "⏰",
    description: "Cliente tem prazo apertado, é presente para terceiros ou tem viagem programada.",
    toneTip:
      "Acolhimento com Empatia: Compreenda a sensibilidade da data (aniversário/evento), tranquilize que remessas internacionais costumam chegar em 5 a 14 dias e confirme que já solicitamos acompanhamento prioritário com a transportadora.",
    regex:
      /\b(preciso\s+pra\s+ontem|[eé]\s+urgente|urg[eê]ncia|com\s+urg[eê]ncia|presente\b|presente\s+de\s+anivers[aá]rio|presente\s+pr[oa]\s+meu\s+filho|presente\s+de\s+natal|[eé]\s+presente|vou\s+viajar|tenho\s+viagem|antes\s+de\s+viajar|t[oô]\s+esperando\s+faz\s+tempo|faz\s+semanas|que\s+demora|demorando\s+muito)\b/gi,
  },
  {
    id: "colloquial-slang",
    label: "Gírias / WhatsApp PT-BR",
    badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-300 dark:border-purple-800",
    level: "info",
    icon: "💬",
    description: "Uso de termos coloquiais do cotidiano brasileiro ou gírias de chat/WhatsApp.",
    toneTip:
      "Tom Conversacional: Responda de forma acessível e direta em português brasileiro acolhedor, evitando excesso de formalismo ou termos robóticos.",
    regex:
      /\b(zap\b|manda\s+no\s+zap|chama\s+no\s+zap|zapzap|whats\b|blz\b|beleza\b|mano\b|v[eé]i\b|suave\b|valeu\b|trampo\b|grana\b|t[oô]\s+sem\s+grana|dinheiro\s+suado|pix\s+caiu|fiz\s+o\s+pix|paguei\s+no\s+boleto|n[aã]o\s+t[oô]\s+conseguindo|n\s+to\s+conseguindo)\b/gi,
  },
];

export function detectBrazilianSlangAndTone(rawText: string): SlangAnalysisResult {
  if (!rawText || !rawText.trim()) {
    return {
      hasSlangOrTriggers: false,
      highestRiskLevel: "none",
      categories: [],
      promptEmpathyContext: "",
    };
  }

  const detected: DetectedSlangCategory[] = [];
  const matchedTermSet = new Set<string>();

  for (const pattern of PATTERNS) {
    const matches = rawText.match(pattern.regex);
    if (matches && matches.length > 0) {
      const distinctTerms = Array.from(
        new Set(matches.map((m) => m.toLowerCase().trim()))
      );
      distinctTerms.forEach((t) => matchedTermSet.add(t));

      detected.push({
        id: pattern.id,
        label: pattern.label,
        badgeColor: pattern.badgeColor,
        level: pattern.level,
        icon: pattern.icon,
        description: pattern.description,
        toneTip: pattern.toneTip,
        matchedTerms: distinctTerms,
      });
    }
  }

  let highestRiskLevel: SlangAnalysisResult["highestRiskLevel"] = "none";
  if (detected.some((d) => d.level === "critical")) {
    highestRiskLevel = "critical";
  } else if (detected.some((d) => d.level === "warning")) {
    highestRiskLevel = "warning";
  } else if (detected.some((d) => d.level === "info")) {
    highestRiskLevel = "info";
  }

  // Construct calibrated prompt guidance context for AI generation
  let promptEmpathyContext = "";
  if (detected.length > 0) {
    const summaryLines = detected.map(
      (d) =>
        `- [${d.label}] (Detected terms: ${d.matchedTerms.join(", ")}): ${d.toneTip}`
    );
    promptEmpathyContext = `Customer Tone & Regional Expression Alerts:\n${summaryLines.join("\n")}`;
  }

  return {
    hasSlangOrTriggers: detected.length > 0,
    highestRiskLevel,
    categories: detected,
    promptEmpathyContext,
  };
}
