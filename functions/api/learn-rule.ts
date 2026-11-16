import {
  buildLearnRulePromptAndSchema,
  type LearnRuleRequest,
} from "../../shared/csPromptEngine.ts";
import {
  callGeminiEdgeWithFallback,
  mapGeminiEdgeError,
} from "../_shared/geminiEdge.ts";
import { jsonResponse, type PagesContext } from "../_shared/types.ts";

export async function onRequestPost(context: PagesContext): Promise<Response> {
  try {
    const body = (await context.request.json().catch(() => null)) as LearnRuleRequest | null;
    if (!body?.editedPortuguese?.trim() || !body?.rawInput?.trim()) {
      return jsonResponse(
        { error: "Provide the case input and edited reply to learn a rule." },
        400
      );
    }

    const apiKey = context.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return jsonResponse(
        {
          error:
            "GEMINI_API_KEY is not configured. Please add it in Cloudflare Pages > Settings > Environment variables.",
        },
        500
      );
    }

    const { contextLines, systemInstruction, responseSchema } =
      buildLearnRulePromptAndSchema(body);

    const jsonText = await callGeminiEdgeWithFallback({
      apiKey,
      preferredModel: context.env.GEMINI_MODEL,
      systemInstruction,
      userContent: contextLines,
      responseSchema,
    });

    if (!jsonText) {
      return jsonResponse({ learnedRuleUpdates: [] });
    }

    const parsed = JSON.parse(jsonText);
    return jsonResponse(parsed);
  } catch (err: unknown) {
    const mapped = mapGeminiEdgeError(err);
    console.error("Cloudflare learn-rule error:", mapped.message);
    return jsonResponse({ error: mapped.message }, mapped.status);
  }
}
