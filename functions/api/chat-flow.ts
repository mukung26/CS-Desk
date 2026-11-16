import {
  buildChatFlowPromptAndSchema,
  type ChatFlowRequest,
} from "../../shared/csPromptEngine.ts";
import {
  callGeminiEdgeWithFallback,
  mapGeminiEdgeError,
} from "../_shared/geminiEdge.ts";
import { jsonResponse, type PagesContext } from "../_shared/types.ts";

export async function onRequestPost(context: PagesContext): Promise<Response> {
  try {
    const body = (await context.request.json().catch(() => null)) as ChatFlowRequest | null;
    const orderContext =
      typeof body?.orderContext === "string" ? body.orderContext.trim() : "";
    const latestCxMessage =
      typeof body?.latestCxMessage === "string" ? body.latestCxMessage.trim() : "";

    if (!body || (!orderContext && !latestCxMessage)) {
      return jsonResponse(
        {
          error:
            "Please enter the order info or customer message to start the Chat Flow.",
        },
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
      buildChatFlowPromptAndSchema(body, orderContext, latestCxMessage);

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
    console.error("Cloudflare chat-flow error:", mapped.message);
    return jsonResponse({ error: mapped.message }, mapped.status);
  }
}
