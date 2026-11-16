interface GeminiEdgeParams {
  apiKey: string;
  preferredModel?: string;
  systemInstruction: string;
  userContent: string;
  responseSchema: Record<string, unknown>;
}

interface GeminiCandidatePart {
  text?: string;
  thought?: boolean;
}

interface GeminiRestResponse {
  candidates?: Array<{
    content?: {
      parts?: GeminiCandidatePart[];
    };
  }>;
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
}

function extractGeminiText(data: GeminiRestResponse): string {
  const parts = data.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return "";
  return parts
    .filter((part) => !part.thought && typeof part.text === "string")
    .map((part) => part.text ?? "")
    .join("")
    .trim();
}

function isRetryableStatus(status: number, message: string): boolean {
  return (
    status === 404 ||
    status === 429 ||
    status === 500 ||
    status === 503 ||
    message.includes("RESOURCE_EXHAUSTED") ||
    message.includes("NOT_FOUND") ||
    message.includes("UNAVAILABLE")
  );
}

async function invokeGeminiRest(
  apiKey: string,
  model: string,
  systemInstruction: string,
  userContent: string,
  responseSchema: Record<string, unknown>,
  includeThinkingLevel: boolean
): Promise<{ ok: true; text: string } | { ok: false; status: number; message: string }> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const generationConfig: Record<string, unknown> = {
    responseMimeType: "application/json",
    responseSchema,
  };

  if (includeThinkingLevel && !model.startsWith("gemini-2.5")) {
    generationConfig.thinkingConfig = { thinkingLevel: "LOW" };
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userContent }],
        },
      ],
      generationConfig,
    }),
  });

  const payloadText = await res.text();
  let parsed: GeminiRestResponse | null = null;
  try {
    parsed = JSON.parse(payloadText) as GeminiRestResponse;
  } catch {
    parsed = null;
  }

  if (!res.ok) {
    const errMsg =
      parsed?.error?.message ||
      `Gemini API error (${res.status}): ${payloadText.slice(0, 300)}`;
    return { ok: false, status: res.status, message: errMsg };
  }

  const text = parsed ? extractGeminiText(parsed) : "";
  return { ok: true, text };
}

export async function callGeminiEdgeWithFallback({
  apiKey,
  preferredModel,
  systemInstruction,
  userContent,
  responseSchema,
}: GeminiEdgeParams): Promise<string> {
  const primary = preferredModel?.trim() || "gemini-4-hydrogen";
  const candidates = Array.from(
    new Set([primary, "gemini-3.1-flash-lite", "gemini-2.5-flash"])
  );

  let lastStatus = 500;
  let lastMessage = "Failed to reach Gemini API.";

  for (let i = 0; i < candidates.length; i++) {
    const model = candidates[i];
    let result = await invokeGeminiRest(
      apiKey,
      model,
      systemInstruction,
      userContent,
      responseSchema,
      true
    );

    if (
      !result.ok &&
      result.status === 400 &&
      result.message.toLowerCase().includes("thinking")
    ) {
      result = await invokeGeminiRest(
        apiKey,
        model,
        systemInstruction,
        userContent,
        responseSchema,
        false
      );
    }

    if (result.ok) {
      return result.text;
    }

    lastStatus = result.status;
    lastMessage = result.message;

    if (!isRetryableStatus(result.status, result.message) || i === candidates.length - 1) {
      const error = new Error(lastMessage) as Error & { status?: number };
      error.status = lastStatus;
      throw error;
    }
  }

  const error = new Error(lastMessage) as Error & { status?: number };
  error.status = lastStatus;
  throw error;
}

export function mapGeminiEdgeError(err: unknown): { status: number; message: string } {
  const status =
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    typeof (err as { status?: unknown }).status === "number"
      ? (err as { status: number }).status
      : 500;
  const message =
    err instanceof Error ? err.message : "Failed to generate AI response.";

  if (
    status === 403 ||
    message.includes("PERMISSION_DENIED") ||
    message.includes("API_KEY_INVALID") ||
    message.includes("API key not valid")
  ) {
    return {
      status: 403,
      message:
        "Gemini API key permission error. Please verify GEMINI_API_KEY in Cloudflare Pages > Settings > Environment variables.",
    };
  }

  if (status === 429 || message.includes("RESOURCE_EXHAUSTED")) {
    return {
      status: 429,
      message: "Rate limit reached. Please wait a moment and try again.",
    };
  }

  return { status: status >= 400 && status < 600 ? status : 500, message };
}
