import {
  buildGenerateReplyPromptAndSchema,
  type GenerateReplyRequest,
} from "../../shared/csPromptEngine.ts";
import {
  callGeminiEdgeWithFallback,
  mapGeminiEdgeError,
} from "../_shared/geminiEdge.ts";
import { jsonResponse, type PagesContext } from "../_shared/types.ts";

export async function onRequestPost(context: PagesContext): Promise<Response> {
  try {
    const body = (await context.request.json().catch(() => null)) as GenerateReplyRequest | null;
    const rawInput = typeof body?.input === "string" ? body.input.trim() : "";

    if (!rawInput || !body) {
      return jsonResponse(
        { error: "Please enter the order/product info and customer concern." },
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
      buildGenerateReplyPromptAndSchema(body, rawInput);

    const jsonText = await callGeminiEdgeWithFallback({
      apiKey,
      preferredModel: context.env.GEMINI_MODEL,
      systemInstruction,
      userContent: contextLines,
      responseSchema,
    });

    if (!jsonText) {
      return jsonResponse(
        { error: "Empty response received from the AI service. Please try again." },
        502
      );
    }

    const parsed = JSON.parse(jsonText);
    return jsonResponse(parsed);
  } catch (err: unknown) {
    const mapped = mapGeminiEdgeError(err);
    console.error("Cloudflare generate-reply error:", mapped.message);
    return jsonResponse({ error: mapped.message }, mapped.status);
  }
}
