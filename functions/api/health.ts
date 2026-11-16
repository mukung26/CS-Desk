import { jsonResponse, type PagesContext } from "../_shared/types.ts";

export async function onRequestGet(context: PagesContext): Promise<Response> {
  return jsonResponse({
    status: "ok",
    runtime: "cloudflare-pages",
    model: context.env.GEMINI_MODEL?.trim() || "gemini-4-hydrogen",
    hasApiKey: Boolean(context.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
}
