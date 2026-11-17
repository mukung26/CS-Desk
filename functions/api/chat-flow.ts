import {
  buildChatFlowPromptAndSchema,
  type ChatFlowRequest,
} from "../../shared/csPromptEngine.ts";
import {
  generateStructuredAiEdge,
  mapAiEdgeError,
} from "../_shared/aiEdge.ts";
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

    const { contextLines, systemInstruction, responseSchema } =
      buildChatFlowPromptAndSchema(body, orderContext, latestCxMessage);

    const result = await generateStructuredAiEdge({
      env: context.env,
      contents: contextLines,
      systemInstruction,
      responseSchema,
      aiProvider: body.aiProvider,
      aiModel: body.aiModel,
    });

    const parsed = JSON.parse(result.text);
    return jsonResponse({
      ...parsed,
      aiMeta: {
        provider: result.provider,
        model: result.model,
      },
    });
  } catch (err: unknown) {
    const mapped = mapAiEdgeError(err);
    console.error("Cloudflare chat-flow error:", mapped.message);
    return jsonResponse({ error: mapped.message }, mapped.status);
  }
}
