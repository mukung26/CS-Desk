import {
  buildGenerateReplyPromptAndSchema,
  type GenerateReplyRequest,
} from "../../shared/csPromptEngine.ts";
import {
  generateStructuredAiEdge,
  mapAiEdgeError,
} from "../_shared/aiEdge.ts";
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

    const { contextLines, systemInstruction, responseSchema } =
      buildGenerateReplyPromptAndSchema(body, rawInput);

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
    console.error("Cloudflare generate-reply error:", mapped.message);
    return jsonResponse({ error: mapped.message }, mapped.status);
  }
}
