import {
  buildLearnRulePromptAndSchema,
  type LearnRuleRequest,
} from "../../shared/csPromptEngine.ts";
import {
  generateStructuredAiEdge,
  mapAiEdgeError,
  type AiProviderPreference,
} from "../_shared/aiEdge.ts";
import { jsonResponse, type PagesContext } from "../_shared/types.ts";

export async function onRequestPost(context: PagesContext): Promise<Response> {
  try {
    const body = (await context.request.json().catch(() => null)) as
      | (LearnRuleRequest & {
          aiProvider?: AiProviderPreference;
          aiModel?: string;
        })
      | null;
    if (!body?.rawInput?.trim()) {
      return jsonResponse(
        { error: "Provide the case input or instructions first to detect scenarios and rules." },
        400
      );
    }

    const { contextLines, systemInstruction, responseSchema } =
      buildLearnRulePromptAndSchema(body);

    const result = await generateStructuredAiEdge({
      env: context.env,
      contents: contextLines,
      systemInstruction,
      responseSchema,
      aiProvider: body.aiProvider,
      aiModel: body.aiModel,
    });

    if (!result.text) {
      return jsonResponse({
        analysisNote: "No new scenario or rule updates detected.",
        learnedScriptUpdates: [],
        learnedRuleUpdates: [],
      });
    }

    const parsed = JSON.parse(result.text);
    return jsonResponse(parsed);
  } catch (err: unknown) {
    const mapped = mapAiEdgeError(err);
    console.error("Cloudflare learn-rule error:", mapped.message);
    return jsonResponse({ error: mapped.message }, mapped.status);
  }
}
