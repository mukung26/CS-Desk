import { getProviderConfigs } from "../_shared/aiEdge.ts";
import { jsonResponse, type PagesContext } from "../_shared/types.ts";

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const cfg = getProviderConfigs(context.env);
  return jsonResponse({
    status: "ok",
    runtime: "cloudflare-pages",
    providers: {
      gemini: cfg.gemini.configured,
      groq: cfg.groq.configured,
      openrouter: cfg.openrouter.configured,
    },
    models: {
      gemini: cfg.gemini.model,
      groq: cfg.groq.model,
      openrouter: cfg.openrouter.model,
    },
    timestamp: new Date().toISOString(),
  });
}
