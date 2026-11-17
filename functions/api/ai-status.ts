import {
  fetchLiveAvailableModelsEdge,
  getProviderConfigs,
} from "../_shared/aiEdge.ts";
import { jsonResponse, type PagesContext } from "../_shared/types.ts";

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const cfg = getProviderConfigs(context.env);
  const availableModels = await fetchLiveAvailableModelsEdge(context.env);

  return jsonResponse({
    geminiConfigured: cfg.gemini.configured,
    groqConfigured: cfg.groq.configured,
    openrouterConfigured: cfg.openrouter.configured,
    geminiModel: cfg.gemini.model,
    groqModel: cfg.groq.model,
    openrouterModel: cfg.openrouter.model,
    availableModels,
  });
}
