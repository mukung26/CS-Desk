export interface PlaceholderValues {
  date: string;
  lastUpdateDate?: string;
  estimatedDate?: string;
  tracking: string;
  carrier?: string;
  voucher?: string;
  status: string;
  topic: string;
  spec: string;
}

export function applyPlaceholders(
  text: string,
  values: PlaceholderValues,
  language: "en" | "pt"
): string {
  let result = text;

  const isLatestUpdateSentence =
    /latest\s+update|última\s+atualização|updates\s+since|atualizações\s+desde/i.test(
      text
    );
  const isEstimatedSentence = /estimated|estimada/i.test(text);

  let dateToUse = values.date.trim();
  if (isLatestUpdateSentence && values.lastUpdateDate?.trim()) {
    dateToUse = values.lastUpdateDate.trim();
  } else if (isEstimatedSentence && values.estimatedDate?.trim()) {
    dateToUse = values.estimatedDate.trim();
  } else if (!dateToUse) {
    dateToUse =
      values.estimatedDate?.trim() || values.lastUpdateDate?.trim() || "";
  }

  if (dateToUse) {
    result = result.replace(/\[DATE\]/g, dateToUse).replace(/\[DATA\]/g, dateToUse);
  }
  if (values.tracking.trim()) {
    const val = values.tracking.trim();
    result = result.replace(/\[TRACKING\]/g, val).replace(/\[RASTREAMENTO\]/g, val);
  }
  if (values.voucher?.trim()) {
    const val = values.voucher.trim();
    result = result.replace(/\[VOUCHER\]/g, val);
  }
  if (values.status.trim()) {
    const val = values.status.trim();
    result = result.replace(/\[STATUS\]/g, val);
  }
  if (values.topic.trim()) {
    const val = values.topic.trim();
    result = result.replace(/\[ISSUE TOPIC\]/g, val).replace(/\[ASSUNTO\]/g, val);
  }
  if (values.spec.trim()) {
    const val = values.spec.trim();
    result = result
      .replace(/\[INSERT SPEC FROM PAGE\]/g, val)
      .replace(/\[INSERIR ESPECIFICAÇÃO DA PÁGINA\]/g, val);
  }

  void language;
  return result;
}

export function formatRowsAsMarkdownTable(
  rows: Array<{ section: string; english: string; portuguese: string }>
): string {
  const header = "| Section | English (for you) | Portuguese (send to CX) |";
  const divider = "| :--- | :--- | :--- |";
  const body = rows.map(
    (r) =>
      `| ${r.section.replace(/\|/g, "\\|")} | ${r.english.replace(/\|/g, "\\|")} | ${r.portuguese.replace(/\|/g, "\\|")} |`
  );
  return [header, divider, ...body].join("\n");
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  }
}
