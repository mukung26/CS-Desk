export interface SlangMatch {
  term: string;
  regionOrStyle: string;
  meaning: string;
}

export type CustomerMood =
  | "High-Risk / Frustrated"
  | "Anxious / Impatient"
  | "Informal / Conversational"
  | "Positive / Casual"
  | "Neutral";

export type RecommendedToneValue =
  | "Standard Polite"
  | "Extra Empathetic"
  | "Firm Policy";

export interface SlangToneAnalysis {
  hasSignals: boolean;
  slangMatches: SlangMatch[];
  escalationSignals: string[];
  mood: CustomerMood;
  recommendedTone: RecommendedToneValue;
  empathyLevel: "High (De-escalation)" | "Warm & Reassuring" | "Standard";
  summaryNote: string;
  promptHint: string;
}

interface SlangRule {
  pattern: RegExp;
  term: string;
  regionOrStyle: string;
  meaning: string;
}

const SLANG_RULES: SlangRule[] = [
  {
    pattern: /\b(?:oxi|oxente)\b/i,
    term: "oxi / oxente",
    regionOrStyle: "Nordeste",
    meaning: "expression of surprise or disbelief",
  },
  {
    pattern: /\bvisse\b/i,
    term: "visse",
    regionOrStyle: "Nordeste",
    meaning: "did you see / okay?",
  },
  {
    pattern: /\b(?:uai|s[oô])\b/i,
    term: "uai / sô",
    regionOrStyle: "Minas Gerais",
    meaning: "regional exclamation / emphasis",
  },
  {
    pattern: /\bbah\b|\btch[eê]\b|\btri\b/i,
    term: "bah / tchê",
    regionOrStyle: "Sul (RS)",
    meaning: "regional surprise or emphasis",
  },
  {
    pattern: /\b(?:zap|wpp|whats|whatsapp)\b/i,
    term: "zap / whats",
    regionOrStyle: "BR Chat Slang",
    meaning: "WhatsApp",
  },
  {
    pattern: /\b(?:t[oô]|to)\s+(?:esperando|aqui|com|sem|tentando|precisando|put[oa]|nervos[oa]|brav[oa]|preocupad[oa])/i,
    term: "tô (estou)",
    regionOrStyle: "Informal PT-BR",
    meaning: "contraction of 'estou' (I am)",
  },
  {
    pattern: /\bt[aá]\s+(?:demorando|parado|atrasado|errado|mostrando|escrito|dif[ií]cil|osso|foda)/i,
    term: "tá (está)",
    regionOrStyle: "Informal PT-BR",
    meaning: "contraction of 'está' (it is)",
  },
  {
    pattern: /\b(?:vc|vcs|oc[eê]|c[eê])\b/i,
    term: "vc / cê",
    regionOrStyle: "BR Chat Slang",
    meaning: "short for 'você' (you)",
  },
  {
    pattern: /\b(?:pq|blz|beleza|tbm?)\b/i,
    term: "pq / blz / tb",
    regionOrStyle: "BR Chat Slang",
    meaning: "chat abbreviations (por que / beleza / também)",
  },
  {
    pattern: /\b(?:mano|cara|mo[çc]o|mo[çc]a|miga|vei|v[eé]i)\b/i,
    term: "mano / cara / moço",
    regionOrStyle: "Informal BR",
    meaning: "colloquial address",
  },
  {
    pattern: /\b(?:cad[eê]|cade)\b/i,
    term: "cadê",
    regionOrStyle: "Colloquial BR",
    meaning: "where is it? (impatient/direct)",
  },
  {
    pattern: /\b(?:bora|valeu|tmj|top|show|massa)\b/i,
    term: "show / valeu / top",
    regionOrStyle: "Casual BR",
    meaning: "friendly / casual approval",
  },
  {
    pattern: /\b(?:aff|p[oô]|caramba|eita|slk|miseric[oó]rdia|saco)\b/i,
    term: "pô / aff / eita",
    regionOrStyle: "Informal BR",
    meaning: "frustration or exasperation",
  },
  {
    pattern: /\b(?:zoado|zuado|ferrou|lascou|osso)\b/i,
    term: "zoado / osso / lascou",
    regionOrStyle: "BR Slang",
    meaning: "messed up / bad situation",
  },
];

const HIGH_RISK_PATTERNS: Array<{ regex: RegExp; label: string }> = [
  { regex: /\bprocon\b/i, label: "Procon" },
  { regex: /\breclame\s*aqui\b/i, label: "Reclame Aqui" },
  { regex: /\b(?:advogad[oa]|lawyer|processar|processo|justi[çc]a|\bsue\b)\b/i, label: "Legal threat" },
  { regex: /\b(?:golpe|scam|engana[çc][aã]o|fraude|roubo)\b/i, label: "Scam accusation" },
  { regex: /\b(?:palha[çc]ada|descaso|enrola[çc][aã]o|vergonha|absurdo|rid[ií]culo|lixo|porcaria)\b/i, label: "Strong frustration" },
  { regex: /\b(?:denunciar|reportar|report\s*page|pol[ií]cia|celso\s*russomanno)\b/i, label: "Report / escalation" },
];

const ANXIOUS_PATTERNS: Array<{ regex: RegExp; label: string }> = [
  { regex: /\b(?:urgente|urgent|socorro|pelo\s*amor|emerg[eê]ncia)\b/i, label: "Urgent request" },
  { regex: /\b(?:cad[eê]|cade|nada\s*at[eé]\s*agora|sem\s*resposta|faz\s*dias|sumiu)\b/i, label: "Waiting / missing update" },
  { regex: /\b(?:preciso\s*(?:pra|para|antes)|viagem|presente|anivers[aá]rio|casamento)\b/i, label: "Time-sensitive event" },
  { regex: /\b(?:n[aã]o\s*aguento\s*mais|cansad[oa]|chatead[oa]|decepcionad[oa]|frustrad[oa])\b/i, label: "Disappointment" },
];

const POSITIVE_PATTERNS =
  /\b(?:obrigad[oa]|valeu|show|top|massa|amei|lindo|perfeito|ansios[oa]|espero\s*que\s*chegue|hope\s*it\s*arrives|😊|❤️|🙏)\b/i;

function extractCxSnippet(rawText: string): string {
  const cxMatch = rawText.match(/(?:^|\n)\s*CX\s*[>:]\s*([\s\S]+)$/i);
  if (cxMatch?.[1]?.trim()) {
    return cxMatch[1].trim();
  }
  const gtIndex = rawText.indexOf(">");
  if (gtIndex !== -1 && gtIndex < rawText.length - 1) {
    return rawText.slice(gtIndex + 1).trim();
  }
  return rawText.trim();
}

export function analyzeBrazilianSlangAndTone(rawText: string): SlangToneAnalysis {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return {
      hasSignals: false,
      slangMatches: [],
      escalationSignals: [],
      mood: "Neutral",
      recommendedTone: "Standard Polite",
      empathyLevel: "Standard",
      summaryNote: "",
      promptHint: "",
    };
  }

  const targetText = extractCxSnippet(trimmed);
  const slangMatches: SlangMatch[] = [];
  const seenTerms = new Set<string>();

  for (const rule of SLANG_RULES) {
    if (rule.pattern.test(targetText) && !seenTerms.has(rule.term)) {
      seenTerms.add(rule.term);
      slangMatches.push({
        term: rule.term,
        regionOrStyle: rule.regionOrStyle,
        meaning: rule.meaning,
      });
    }
    if (slangMatches.length >= 6) break;
  }

  const escalationSignals: string[] = [];
  for (const item of HIGH_RISK_PATTERNS) {
    if (item.regex.test(targetText) && !escalationSignals.includes(item.label)) {
      escalationSignals.push(item.label);
    }
  }

  const anxiousSignals: string[] = [];
  for (const item of ANXIOUS_PATTERNS) {
    if (item.regex.test(targetText) && !anxiousSignals.includes(item.label)) {
      anxiousSignals.push(item.label);
    }
  }

  const capsWords = targetText.match(/\b[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{4,}\b/g) ?? [];
  const hasCapsShouting = capsWords.filter((w) => !/^(SHOPEE|BRASIL|SPX|PIX|INVALID|PICKED|DELIVERED)$/.test(w)).length >= 2;
  const hasExcessivePunctuation = /[!?]{3,}/.test(targetText);

  if (hasCapsShouting && !escalationSignals.includes("ALL-CAPS emphasis")) {
    escalationSignals.push("ALL-CAPS emphasis");
  }
  if (hasExcessivePunctuation && !escalationSignals.includes("Repeated !!!/???")) {
    escalationSignals.push("Repeated !!!/???");
  }

  const allSignals = [...escalationSignals, ...anxiousSignals];

  let mood: CustomerMood = "Neutral";
  let recommendedTone: RecommendedToneValue = "Standard Polite";
  let empathyLevel: SlangToneAnalysis["empathyLevel"] = "Standard";

  if (escalationSignals.length > 0) {
    mood = "High-Risk / Frustrated";
    recommendedTone = "Extra Empathetic";
    empathyLevel = "High (De-escalation)";
  } else if (anxiousSignals.length > 0) {
    mood = "Anxious / Impatient";
    recommendedTone = "Extra Empathetic";
    empathyLevel = "Warm & Reassuring";
  } else if (POSITIVE_PATTERNS.test(targetText) && slangMatches.length === 0) {
    mood = "Positive / Casual";
    recommendedTone = "Standard Polite";
    empathyLevel = "Standard";
  } else if (slangMatches.length > 0) {
    mood = "Informal / Conversational";
    recommendedTone = "Standard Polite";
    empathyLevel = "Warm & Reassuring";
  }

  const hasSignals = slangMatches.length > 0 || allSignals.length > 0;

  const summaryParts: string[] = [];
  if (slangMatches.length > 0) {
    summaryParts.push(
      `BR Slang: ${slangMatches.map((s) => `${s.term} (${s.regionOrStyle})`).join(", ")}`
    );
  }
  if (allSignals.length > 0) {
    summaryParts.push(`Cues: ${allSignals.join(", ")}`);
  }
  summaryParts.push(`Mood: ${mood}`);

  const promptHint = hasSignals
    ? `Detected Brazilian Slang & Customer Tone: Mood="${mood}" | Empathy Level="${empathyLevel}"${
        slangMatches.length > 0
          ? ` | Regional/Informal PT-BR expressions used by CX: ${slangMatches
              .map((s) => `"${s.term}" (${s.regionOrStyle}: ${s.meaning})`)
              .join("; ")}`
          : ""
      }${
        allSignals.length > 0
          ? ` | Urgency/Frustration Signals: ${allSignals.join(", ")}`
          : ""
      }. Understand any informal/regional slang accurately, NEVER mirror unprofessional slang back, and respond in warm, respectful, clear PT-BR calibrated to this customer's emotional state.`
    : "";

  return {
    hasSignals,
    slangMatches,
    escalationSignals: allSignals,
    mood,
    recommendedTone,
    empathyLevel,
    summaryNote: summaryParts.join(" · "),
    promptHint,
  };
}
