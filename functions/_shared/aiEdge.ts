import type { CloudflareEnv } from "./types.ts";

export type ConcreteAiProvider = "gemini" | "groq" | "openrouter";
export type AiProviderPreference = "auto" | ConcreteAiProvider;

export interface StructuredAiResult {
  text: string;
  provider: ConcreteAiProvider;
  model: string;
}

const DEFAULT_GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

const CURATED_GEMINI_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-4-hydrogen",
  "gemini-2.5-flash",
];

const CURATED_GROQ_MODELS = [
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "qwen/qwen3.8-27b",
];

const CURATED_OPENROUTER_MODELS = [
  "baidu/ernie-5.5-flash-preview:free",
  "nvidia/nemotron-3.5-super-vl:free",
  "openrouter/free",
  "particle-ai/particle-1:free",
  "google/gemma-4-31b-it:free",
  "google/gemma-4-26b-a4b-it:free",
];

export function cleanEnvValue(raw?: string): string {
  const val = (raw || "").trim();
  if (!val) return "";
  const lower = val.toLowerCase();
  if (
    lower === "na" ||
    lower === "n/a" ||
    lower === "none" ||
    lower === "null" ||
    lower === "undefined" ||
    lower === "my_gemini_api_key"
  ) {
    return "";
  }
  return val;
}

export function cleanEnvUrl(raw: string | undefined, fallbackUrl: string): string {
  const cleaned = cleanEnvValue(raw).replace(/\/+$/, "");
  if (/^https?:\/\//i.test(cleaned)) {
    return cleaned;
  }
  return fallbackUrl;
}

function toCompletionsUrl(baseUrl: string): string {
  return baseUrl.endsWith("/chat/completions")
    ? baseUrl
    : `${baseUrl}/chat/completions`;
}

function getTimeoutMs(env: CloudflareEnv): number {
  const raw = Number(cleanEnvValue(env.AI_REQUEST_TIMEOUT_MS));
  if (!Number.isFinite(raw) || raw <= 0) return 28000;
  return Math.min(60000, Math.max(10000, raw));
}

export function getProviderConfigs(env: CloudflareEnv) {
  const geminiKey = cleanEnvValue(env.GEMINI_API_KEY);
  const geminiModel = cleanEnvValue(env.GEMINI_MODEL) || "gemini-3.1-flash-lite";

  const groqKey = cleanEnvValue(env.GROQ_API_KEY);
  const groqBaseUrl = cleanEnvUrl(env.GROQ_BASE_URL, DEFAULT_GROQ_BASE_URL);
  const groqModel = cleanEnvValue(env.GROQ_MODEL) || "openai/gpt-oss-120b";

  const openrouterKey = cleanEnvValue(env.OPENROUTER_API_KEY);
  const openrouterBaseUrl = cleanEnvUrl(
    env.OPENROUTER_BASE_URL,
    DEFAULT_OPENROUTER_BASE_URL
  );
  const openrouterModel =
    cleanEnvValue(env.OPENROUTER_MODEL) || "baidu/ernie-5.5-flash-preview:free";

  return {
    timeoutMs: getTimeoutMs(env),
    appUrl: cleanEnvValue(env.APP_URL) || "https://atendimentobr.app",
    gemini: {
      configured: Boolean(geminiKey),
      apiKey: geminiKey,
      model: geminiModel,
    },
    groq: {
      configured: Boolean(groqKey),
      apiKey: groqKey,
      baseUrl: groqBaseUrl,
      completionsUrl: toCompletionsUrl(groqBaseUrl),
      model: groqModel,
    },
    openrouter: {
      configured: Boolean(openrouterKey),
      apiKey: openrouterKey,
      baseUrl: openrouterBaseUrl,
      completionsUrl: toCompletionsUrl(openrouterBaseUrl),
      model: openrouterModel,
    },
  };
}

let cachedModelLists: {
  expiresAt: number;
  gemini: string[];
  groq: string[];
  openrouter: string[];
} | null = null;

export async function fetchLiveAvailableModelsEdge(env: CloudflareEnv): Promise<{
  gemini: string[];
  groq: string[];
  openrouter: string[];
}> {
  if (cachedModelLists && Date.now() < cachedModelLists.expiresAt) {
    return {
      gemini: cachedModelLists.gemini,
      groq: cachedModelLists.groq,
      openrouter: cachedModelLists.openrouter,
    };
  }

  const cfg = getProviderConfigs(env);
  const geminiModels = Array.from(
    new Set([cfg.gemini.model, ...CURATED_GEMINI_MODELS])
  );
  let groqModels = Array.from(new Set([cfg.groq.model, ...CURATED_GROQ_MODELS]));
  let openrouterModels = Array.from(
    new Set([cfg.openrouter.model, ...CURATED_OPENROUTER_MODELS])
  );

  const fetchGroqModels = async () => {
    if (!cfg.groq.configured) return;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    try {
      const res = await fetch(`${cfg.groq.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${cfg.groq.apiKey}` },
        signal: controller.signal,
      });
      if (!res.ok) return;
      const json = (await res.json()) as { data?: Array<{ id?: string }> };
      const liveChatIds = (json.data || [])
        .map((m) => m.id || "")
        .filter(
          (id) =>
            Boolean(id) &&
            !/whisper|tts|playai|orpheus|guard|safeguard/i.test(id)
        )
        .sort();
      if (liveChatIds.length > 0) {
        const preferredFirst = CURATED_GROQ_MODELS.filter((id) =>
          liveChatIds.includes(id)
        );
        const envFirst = liveChatIds.includes(cfg.groq.model)
          ? [cfg.groq.model]
          : [];
        groqModels = Array.from(
          new Set([...envFirst, ...preferredFirst, ...liveChatIds])
        );
      }
    } catch {
      // Keep curated defaults on timeout
    } finally {
      clearTimeout(timer);
    }
  };

  const fetchOpenRouterModels = async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    try {
      const res = await fetch(`${cfg.openrouter.baseUrl}/models`, {
        signal: controller.signal,
      });
      if (!res.ok) return;
      const json = (await res.json()) as {
        data?: Array<{
          id?: string;
          pricing?: { prompt?: string; completion?: string };
        }>;
      };
      const liveFreeIds = (json.data || [])
        .filter((m) => {
          const id = m.id || "";
          if (!id || /lyria|whisper|tts|image|inkling/i.test(id)) return false;
          return (
            id === "openrouter/free" ||
            id.endsWith(":free") ||
            (m.pricing?.prompt === "0" && m.pricing?.completion === "0")
          );
        })
        .map((m) => m.id as string)
        .sort();
      if (liveFreeIds.length > 0) {
        const preferred = CURATED_OPENROUTER_MODELS.filter((id) =>
          liveFreeIds.includes(id)
        );
        openrouterModels = Array.from(
          new Set([cfg.openrouter.model, ...preferred, ...liveFreeIds])
        );
      }
    } catch {
      // Keep curated defaults on timeout
    } finally {
      clearTimeout(timer);
    }
  };

  await Promise.all([fetchGroqModels(), fetchOpenRouterModels()]);

  cachedModelLists = {
    expiresAt: Date.now() + 5 * 60 * 1000,
    gemini: geminiModels,
    groq: groqModels,
    openrouter: openrouterModels,
  };

  return {
    gemini: geminiModels,
    groq: groqModels,
    openrouter: openrouterModels,
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null) {
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  }
  return String(err);
}

function isTimeoutOr524Error(msg: string): boolean {
  const lower = msg.toLowerCase();
  return (
    lower.includes("524") ||
    lower.includes("504") ||
    lower.includes("deadline_exceeded") ||
    lower.includes("timeout") ||
    lower.includes("timed out") ||
    lower.includes("etimedout") ||
    lower.includes("aborted")
  );
}

function isRetryableAiError(msg: string): boolean {
  const lower = msg.toLowerCase();
  return (
    isTimeoutOr524Error(msg) ||
    lower.includes("429") ||
    lower.includes("413") ||
    lower.includes("request too large") ||
    lower.includes("tpm") ||
    lower.includes("resource_exhausted") ||
    lower.includes("404") ||
    lower.includes("not_found") ||
    lower.includes("503") ||
    lower.includes("502") ||
    lower.includes("500") ||
    lower.includes("408") ||
    lower.includes("unavailable") ||
    lower.includes("thinking level") ||
    lower.includes("thinkingconfig") ||
    lower.includes("econnreset") ||
    lower.includes("fetch failed")
  );
}

function stripJsonCodeFences(raw: string): string {
  let cleaned = raw
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .trim();
  const fenced = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/i);
  if (fenced?.[1]) {
    cleaned = fenced[1].trim();
  }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return cleaned.slice(firstBrace, lastBrace + 1).trim();
  }
  return cleaned;
}

function schemaToCompactHint(
  schema: Record<string, unknown>,
  depth = 0
): string {
  const t = String(schema.type || "").toUpperCase();
  if (
    t === "OBJECT" &&
    schema.properties &&
    typeof schema.properties === "object"
  ) {
    if (depth > 3) return "object";
    const props = schema.properties as Record<string, Record<string, unknown>>;
    const entries = Object.entries(props).map(
      ([k, v]) => `"${k}": ${schemaToCompactHint(v, depth + 1)}`
    );
    return `{ ${entries.join(", ")} }`;
  }
  if (t === "ARRAY" && schema.items && typeof schema.items === "object") {
    return `[${schemaToCompactHint(schema.items as Record<string, unknown>, depth + 1)}]`;
  }
  if (Array.isArray(schema.enum)) {
    return schema.enum.map((v) => JSON.stringify(v)).join(" | ");
  }
  if (t === "BOOLEAN") return "boolean";
  if (t === "NUMBER" || t === "INTEGER") return "number";
  return "string";
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

async function callGeminiSingleEdge(params: {
  apiKey: string;
  model: string;
  systemInstruction: string;
  contents: string;
  responseSchema: Record<string, unknown>;
  timeoutMs: number;
}): Promise<StructuredAiResult> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    params.model
  )}:generateContent?key=${encodeURIComponent(params.apiKey)}`;

  const generationConfig: Record<string, unknown> = {
    responseMimeType: "application/json",
    responseSchema: params.responseSchema,
  };

  if (params.model.startsWith("gemini-4")) {
    generationConfig.thinkingConfig = { thinkingLevel: "LOW" };
  } else if (params.model.startsWith("gemini-3.1-flash-lite")) {
    generationConfig.thinkingConfig = { thinkingLevel: "MINIMAL" };
  } else if (params.model.startsWith("gemini-3")) {
    generationConfig.thinkingConfig = { thinkingLevel: "LOW" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), params.timeoutMs);

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: params.systemInstruction }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: params.contents }],
          },
        ],
        generationConfig,
      }),
      signal: controller.signal,
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
        `Gemini (${params.model}) API error (${res.status}): ${payloadText.slice(0, 300)}`;
      const err = new Error(errMsg) as Error & { status?: number };
      err.status = res.status;
      throw err;
    }

    const text = stripJsonCodeFences(parsed ? extractGeminiText(parsed) : "");
    if (!text) {
      throw new Error(`Gemini ${params.model} returned an empty response.`);
    }

    return {
      text,
      provider: "gemini",
      model: params.model,
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(
        `Gemini ${params.model} timed out after ${Math.round(params.timeoutMs / 1000)}s (524 guard)`
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function callGeminiWithFallbackEdge(params: {
  apiKey: string;
  defaultModel: string;
  systemInstruction: string;
  contents: string;
  responseSchema: Record<string, unknown>;
  timeoutMs: number;
  pinnedModel?: string;
}): Promise<StructuredAiResult> {
  if (params.pinnedModel) {
    return await callGeminiSingleEdge({
      apiKey: params.apiKey,
      model: params.pinnedModel,
      systemInstruction: params.systemInstruction,
      contents: params.contents,
      responseSchema: params.responseSchema,
      timeoutMs: params.timeoutMs,
    });
  }

  const candidates = Array.from(
    new Set([
      params.defaultModel,
      "gemini-3.1-flash-lite",
      "gemini-2.5-flash",
      "gemini-4-hydrogen",
    ])
  );

  let lastError: unknown;
  for (let i = 0; i < candidates.length; i++) {
    const model = candidates[i];
    const attemptTimeout =
      i === 0
        ? Math.min(18000, params.timeoutMs)
        : Math.min(20000, params.timeoutMs);

    try {
      return await callGeminiSingleEdge({
        apiKey: params.apiKey,
        model,
        systemInstruction: params.systemInstruction,
        contents: params.contents,
        responseSchema: params.responseSchema,
        timeoutMs: attemptTimeout,
      });
    } catch (err: unknown) {
      lastError = err;
      const msg = extractErrorMessage(err);
      if (!isRetryableAiError(msg) || i === candidates.length - 1) {
        throw err;
      }
      await sleep(250);
    }
  }

  throw lastError;
}

async function callOpenAiCompatibleJsonEdge(params: {
  provider: Exclude<ConcreteAiProvider, "gemini">;
  providerLabel: string;
  completionsUrl: string;
  apiKey: string;
  model: string;
  userPrompt: string;
  systemInstruction: string;
  responseSchema: Record<string, unknown>;
  timeoutMs: number;
  extraHeaders?: Record<string, string>;
}): Promise<StructuredAiResult> {
  const sendCompletion = async (includeResponseFormat: boolean) => {
    const controller = new AbortController();
    const timeoutTimer = setTimeout(() => controller.abort(), params.timeoutMs);

    try {
      const schemaGuide = schemaToCompactHint(params.responseSchema);
      const systemPrompt = `${params.systemInstruction}\n\nOUTPUT FORMAT: Return ONLY a valid JSON object (no markdown fences, no commentary) matching this exact shape:\n${schemaGuide}`;

      const bodyPayload: Record<string, unknown> = {
        model: params.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: params.userPrompt },
        ],
      };
      if (includeResponseFormat) {
        bodyPayload.response_format = { type: "json_object" };
      }

      const res = await fetch(params.completionsUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${params.apiKey}`,
          ...(params.extraHeaders || {}),
        },
        body: JSON.stringify(bodyPayload),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        if (
          includeResponseFormat &&
          res.status === 400 &&
          (errBody.toLowerCase().includes("response_format") ||
            errBody.toLowerCase().includes("json_object"))
        ) {
          return null;
        }
        const err = new Error(
          `${params.providerLabel} (${params.model}) API error (${res.status}): ${errBody.slice(0, 300) || res.statusText}`
        ) as Error & { status?: number };
        err.status = res.status;
        throw err;
      }

      const payload = (await res.json()) as {
        model?: string;
        choices?: Array<{ message?: { content?: string } }>;
      };
      const rawContent = payload?.choices?.[0]?.message?.content ?? "";
      const cleaned = stripJsonCodeFences(rawContent);
      if (!cleaned) {
        throw new Error(
          `${params.providerLabel} (${params.model}) returned an empty response.`
        );
      }

      return {
        text: cleaned,
        provider: params.provider,
        model: payload?.model || params.model,
      };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error(
          `${params.providerLabel} (${params.model}) timed out after ${Math.round(params.timeoutMs / 1000)}s (524 guard)`
        );
      }
      throw err;
    } finally {
      clearTimeout(timeoutTimer);
    }
  };

  const firstTry = await sendCompletion(true);
  if (firstTry) return firstTry;
  const fallbackTry = await sendCompletion(false);
  if (!fallbackTry) {
    throw new Error(
      `${params.providerLabel} (${params.model}) failed to produce JSON output.`
    );
  }
  return fallbackTry;
}

export async function generateStructuredAiEdge(params: {
  env: CloudflareEnv;
  contents: string;
  systemInstruction: string;
  responseSchema: Record<string, unknown>;
  aiProvider?: AiProviderPreference;
  aiModel?: string;
}): Promise<StructuredAiResult> {
  const cfg = getProviderConfigs(params.env);
  const preference: AiProviderPreference = params.aiProvider || "auto";
  const pinnedModel =
    typeof params.aiModel === "string" && params.aiModel.trim()
      ? params.aiModel.trim()
      : undefined;

  const configuredMap: Record<ConcreteAiProvider, boolean> = {
    gemini: cfg.gemini.configured,
    groq: cfg.groq.configured,
    openrouter: cfg.openrouter.configured,
  };

  const secretNameMap: Record<ConcreteAiProvider, string> = {
    gemini: "GEMINI_API_KEY",
    groq: "GROQ_API_KEY",
    openrouter: "OPENROUTER_API_KEY",
  };

  const runProvider = async (
    provider: ConcreteAiProvider,
    specificModel?: string
  ): Promise<StructuredAiResult> => {
    if (provider === "gemini") {
      return await callGeminiWithFallbackEdge({
        apiKey: cfg.gemini.apiKey,
        defaultModel: cfg.gemini.model,
        systemInstruction: params.systemInstruction,
        contents: params.contents,
        responseSchema: params.responseSchema,
        timeoutMs: cfg.timeoutMs,
        pinnedModel: specificModel,
      });
    }

    if (provider === "groq") {
      if (specificModel) {
        return await callOpenAiCompatibleJsonEdge({
          provider: "groq",
          providerLabel: "Groq",
          completionsUrl: cfg.groq.completionsUrl,
          apiKey: cfg.groq.apiKey,
          model: specificModel,
          userPrompt: params.contents,
          systemInstruction: params.systemInstruction,
          responseSchema: params.responseSchema,
          timeoutMs: cfg.timeoutMs,
        });
      }

      const groqModels = Array.from(
        new Set([
          cfg.groq.model,
          "openai/gpt-oss-120b",
          "openai/gpt-oss-20b",
          "qwen/qwen3.8-27b",
        ])
      );
      let lastErr: unknown;
      for (let i = 0; i < groqModels.length; i++) {
        try {
          return await callOpenAiCompatibleJsonEdge({
            provider: "groq",
            providerLabel: "Groq",
            completionsUrl: cfg.groq.completionsUrl,
            apiKey: cfg.groq.apiKey,
            model: groqModels[i],
            userPrompt: params.contents,
            systemInstruction: params.systemInstruction,
            responseSchema: params.responseSchema,
            timeoutMs: cfg.timeoutMs,
          });
        } catch (err: unknown) {
          lastErr = err;
          const msg = extractErrorMessage(err);
          if (!isRetryableAiError(msg) || i === groqModels.length - 1) {
            throw err;
          }
          await sleep(200);
        }
      }
      throw lastErr;
    }

    // openrouter
    const extraHeaders = {
      "HTTP-Referer": cfg.appUrl,
      "X-Title": "Atendimento BR",
    };

    if (specificModel) {
      return await callOpenAiCompatibleJsonEdge({
        provider: "openrouter",
        providerLabel: "OpenRouter",
        completionsUrl: cfg.openrouter.completionsUrl,
        apiKey: cfg.openrouter.apiKey,
        model: specificModel,
        extraHeaders,
        userPrompt: params.contents,
        systemInstruction: params.systemInstruction,
        responseSchema: params.responseSchema,
        timeoutMs: cfg.timeoutMs,
      });
    }

    const candidates = Array.from(
      new Set([
        cfg.openrouter.model,
        "baidu/ernie-5.5-flash-preview:free",
        "nvidia/nemotron-3.5-super-vl:free",
        "openrouter/free",
        "particle-ai/particle-1:free",
        "google/gemma-4-31b-it:free",
      ])
    );

    let lastErr: unknown;
    for (let i = 0; i < candidates.length; i++) {
      try {
        return await callOpenAiCompatibleJsonEdge({
          provider: "openrouter",
          providerLabel: "OpenRouter",
          completionsUrl: cfg.openrouter.completionsUrl,
          apiKey: cfg.openrouter.apiKey,
          model: candidates[i],
          extraHeaders,
          userPrompt: params.contents,
          systemInstruction: params.systemInstruction,
          responseSchema: params.responseSchema,
          timeoutMs: Math.min(20000, cfg.timeoutMs),
        });
      } catch (err: unknown) {
        lastErr = err;
        const msg = extractErrorMessage(err);
        if (!isRetryableAiError(msg) || i === candidates.length - 1) {
          throw err;
        }
        await sleep(200);
      }
    }
    throw lastErr;
  };

  if (preference !== "auto") {
    if (!configuredMap[preference]) {
      throw new Error(
        `${secretNameMap[preference]} is not configured in Cloudflare Pages > Settings > Variables and Secrets.`
      );
    }
    return await runProvider(preference, pinnedModel);
  }

  const defaultOrder: ConcreteAiProvider[] = ["gemini", "groq", "openrouter"];
  const chain = defaultOrder.filter((p) => configuredMap[p]);
  if (chain.length === 0) {
    throw new Error(
      "No AI provider key configured. Add GEMINI_API_KEY, GROQ_API_KEY, or OPENROUTER_API_KEY in Cloudflare Pages > Settings > Variables and Secrets."
    );
  }

  let lastError: unknown;
  for (let i = 0; i < chain.length; i++) {
    const provider = chain[i];
    try {
      return await runProvider(provider);
    } catch (err: unknown) {
      lastError = err;
      const msg = extractErrorMessage(err);
      const hasNext = i < chain.length - 1;
      if (!hasNext || !isRetryableAiError(msg)) {
        throw err;
      }
      await sleep(200);
    }
  }

  throw lastError;
}

export function mapAiEdgeError(err: unknown): {
  status: number;
  message: string;
} {
  const message =
    err instanceof Error ? err.message : "Failed to generate AI response.";

  if (
    message.includes("not configured") ||
    message.includes("No AI provider key")
  ) {
    return { status: 500, message };
  }
  if (
    message.includes("PERMISSION_DENIED") ||
    message.includes("API_KEY_INVALID") ||
    message.includes("API key not valid") ||
    message.includes("401")
  ) {
    return {
      status: 403,
      message:
        "AI API key authentication error. Please verify GEMINI_API_KEY, GROQ_API_KEY, or OPENROUTER_API_KEY in Cloudflare Pages > Settings > Variables and Secrets.",
    };
  }
  if (message.includes("403")) {
    return { status: 403, message };
  }
  if (message.includes("RESOURCE_EXHAUSTED") || message.includes("429")) {
    return {
      status: 429,
      message:
        "Rate limit reached on this model/provider. Switch to Auto or try another model.",
    };
  }
  if (isTimeoutOr524Error(message)) {
    return {
      status: 504,
      message:
        "Upstream AI gateway timed out (524 / 504). Switch to Auto failover or try a faster model.",
    };
  }

  const rawStatus =
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    typeof (err as { status?: unknown }).status === "number"
      ? (err as { status: number }).status
      : 500;

  return {
    status: rawStatus >= 400 && rawStatus < 600 ? rawStatus : 500,
    message,
  };
}
