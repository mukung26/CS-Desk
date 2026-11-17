import { AiResponseMeta, AiStatusInfo } from "../types/cs";

export function formatAutoRouteOptionLabel(aiStatus: AiStatusInfo | null): string {
  if (!aiStatus) {
    return "Auto (Gemini → Groq → OpenRouter)";
  }
  const active: string[] = [];
  if (aiStatus.geminiConfigured) active.push("Gemini");
  if (aiStatus.groqConfigured) active.push("Groq");
  if (aiStatus.openrouterConfigured) active.push("OpenRouter");

  if (active.length <= 1) {
    return `Auto (${active[0] || "Gemini"} + Retry Guard)`;
  }
  return `Auto (${active.join(" → ")})`;
}

export function formatAiProviderName(
  provider: AiResponseMeta["provider"]
): string {
  switch (provider) {
    case "gemini":
      return "Gemini";
    case "groq":
      return "Groq";
    case "openrouter":
      return "OpenRouter";
  }
}
