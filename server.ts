import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import {
  buildChatFlowPromptAndSchema,
  buildGenerateReplyPromptAndSchema,
  buildLearnRulePromptAndSchema,
  type ChatFlowRequest,
  type GenerateReplyRequest,
  type LearnRuleRequest,
} from "./shared/csPromptEngine.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "1mb" }));

function cleanEnvValue(raw?: string): string {
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

function cleanEnvUrl(raw: string | undefined, fallbackUrl: string): string {
  const cleaned = cleanEnvValue(raw).replace(/\/+$/, "");
  if (/^https?:\/\//i.test(cleaned)) {
    return cleaned;
  }
  return fallbackUrl;
}

const GEMINI_MODEL =
  cleanEnvValue(process.env.GEMINI_MODEL) || "gemini-3.1-flash-lite";
const AI_REQUEST_TIMEOUT_MS = Math.min(
  60000,
  Math.max(10000, Number(process.env.AI_REQUEST_TIMEOUT_MS) || 28000)
);

const DEFAULT_GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

function toCompletionsUrl(baseUrl: string): string {
  return baseUrl.endsWith("/chat/completions")
    ? baseUrl
    : `${baseUrl}/chat/completions`;
}

function getGroqConfig() {
  const apiKey = cleanEnvValue(process.env.GROQ_API_KEY);
  const baseUrl = cleanEnvUrl(process.env.GROQ_BASE_URL, DEFAULT_GROQ_BASE_URL);
  const model = cleanEnvValue(process.env.GROQ_MODEL) || "openai/gpt-oss-120b";
  return {
    configured: Boolean(apiKey),
    apiKey,
    baseUrl,
    completionsUrl: toCompletionsUrl(baseUrl),
    model,
  };
}

function getOpenRouterConfig() {
  const apiKey = cleanEnvValue(process.env.OPENROUTER_API_KEY);
  const baseUrl = cleanEnvUrl(
    process.env.OPENROUTER_BASE_URL,
    DEFAULT_OPENROUTER_BASE_URL
  );
  const model =
    cleanEnvValue(process.env.OPENROUTER_MODEL) ||
    "baidu/ernie-5.5-flash-preview:free";
  return {
    configured: Boolean(apiKey),
    apiKey,
    baseUrl,
    completionsUrl: toCompletionsUrl(baseUrl),
    model,
  };
}

function getGeminiClient(apiVersion?: string): GoogleGenAI | null {
  const apiKey = cleanEnvValue(process.env.GEMINI_API_KEY);
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    ...(apiVersion ? { apiVersion } : {}),
    httpOptions: {
      timeout: AI_REQUEST_TIMEOUT_MS,
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
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

async function withHardTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timer = setTimeout(() => {
          reject(
            new Error(
              `${label} timed out after ${Math.round(timeoutMs / 1000)}s (524 guard)`
            )
          );
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

type ConcreteAiProvider = "gemini" | "groq" | "openrouter";

interface StructuredAiResult {
  text: string;
  provider: ConcreteAiProvider;
  model: string;
}

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

let cachedModelLists: {
  expiresAt: number;
  gemini: string[];
  groq: string[];
  openrouter: string[];
} | null = null;

async function fetchLiveAvailableModels(): Promise<{
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

  const groq = getGroqConfig();
  const openrouter = getOpenRouterConfig();

  const geminiModels = Array.from(
    new Set([GEMINI_MODEL, ...CURATED_GEMINI_MODELS])
  );

  let groqModels = Array.from(new Set([groq.model, ...CURATED_GROQ_MODELS]));
  let openrouterModels = Array.from(
    new Set([openrouter.model, ...CURATED_OPENROUTER_MODELS])
  );

  const fetchGroqModels = async () => {
    if (!groq.configured) return;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    try {
      const res = await fetch(`${groq.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${groq.apiKey}` },
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
        const envFirst = liveChatIds.includes(groq.model) ? [groq.model] : [];
        groqModels = Array.from(
          new Set([...envFirst, ...preferredFirst, ...liveChatIds])
        );
      }
    } catch {
      // keep curated defaults on network timeout
    } finally {
      clearTimeout(timer);
    }
  };

  const fetchOpenRouterModels = async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    try {
      const res = await fetch(`${openrouter.baseUrl}/models`, {
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
          new Set([openrouter.model, ...preferred, ...liveFreeIds])
        );
      }
    } catch {
      // keep curated defaults on network timeout
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

async function callGeminiSingle(
  ai: GoogleGenAI,
  model: string,
  contents: string,
  config: Record<string, unknown>,
  timeoutMs: number
): Promise<StructuredAiResult> {
  const effectiveConfig: Record<string, unknown> = { ...config };
  let clientToUse = ai;

  if (model.startsWith("gemini-4")) {
    // Gemini 4 models support ThinkingLevel.LOW for lowest latency (MINIMAL returns 400)
    effectiveConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
  } else if (model.startsWith("gemini-3.1-flash-lite")) {
    effectiveConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.MINIMAL };
  } else if (model.startsWith("gemini-3")) {
    effectiveConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
  } else {
    delete effectiveConfig.thinkingConfig;
    // Gemini 2.5 requires v1beta for JSON responseMimeType & systemInstruction
    clientToUse = getGeminiClient("v1beta") || ai;
  }

  const res = await withHardTimeout(
    clientToUse.models.generateContent({
      model,
      contents,
      config: effectiveConfig,
    }),
    timeoutMs,
    `Gemini ${model}`
  );
  const text = stripJsonCodeFences(res.text ?? "");
  if (!text) {
    throw new Error(`Gemini ${model} returned an empty response.`);
  }
  return {
    text,
    provider: "gemini",
    model,
  };
}

async function callGeminiWithFallback(
  contents: string,
  config: Record<string, unknown>,
  pinnedModel?: string
): Promise<StructuredAiResult> {
  const ai = getGeminiClient();
  if (!ai) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  if (pinnedModel) {
    return await callGeminiSingle(
      ai,
      pinnedModel,
      contents,
      config,
      AI_REQUEST_TIMEOUT_MS
    );
  }

  const candidates = Array.from(
    new Set([GEMINI_MODEL, "gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-4-hydrogen"])
  );

  let lastError: unknown;
  for (let i = 0; i < candidates.length; i++) {
    const model = candidates[i];
    const attemptTimeout =
      i === 0 ? Math.min(18000, AI_REQUEST_TIMEOUT_MS) : Math.min(20000, AI_REQUEST_TIMEOUT_MS);

    try {
      return await callGeminiSingle(ai, model, contents, config, attemptTimeout);
    } catch (err: unknown) {
      lastError = err;
      const msg = extractErrorMessage(err);
      const retryable = isRetryableAiError(msg);
      if (!retryable) {
        throw err;
      }

      if (i < candidates.length - 1) {
        console.warn(
          `Gemini ${model} failed/timed out (${msg.slice(0, 140)}), falling back to ${candidates[i + 1]}`
        );
        await sleep(300);
      }
    }
  }

  throw lastError;
}

function schemaToCompactHint(schema: Record<string, unknown>, depth = 0): string {
  const t = String(schema.type || "").toUpperCase();
  if (t === "OBJECT" && schema.properties && typeof schema.properties === "object") {
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

async function callOpenAiCompatibleJson(params: {
  provider: Exclude<ConcreteAiProvider, "gemini">;
  providerLabel: string;
  completionsUrl: string;
  apiKey: string;
  model: string;
  userPrompt: string;
  systemInstruction: string;
  responseSchema: Record<string, unknown>;
  extraHeaders?: Record<string, string>;
}): Promise<StructuredAiResult> {
  const sendCompletion = async (includeResponseFormat: boolean) => {
    const controller = new AbortController();
    const timeoutTimer = setTimeout(
      () => controller.abort(),
      AI_REQUEST_TIMEOUT_MS
    );

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
        throw new Error(
          `${params.providerLabel} (${params.model}) API error (${res.status}): ${errBody.slice(0, 300) || res.statusText}`
        );
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
          `${params.providerLabel} (${params.model}) timed out after ${Math.round(AI_REQUEST_TIMEOUT_MS / 1000)}s (524 guard)`
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

async function callGroqJson(params: {
  userPrompt: string;
  systemInstruction: string;
  responseSchema: Record<string, unknown>;
  pinnedModel?: string;
}): Promise<StructuredAiResult> {
  const cfg = getGroqConfig();
  if (!cfg.configured) {
    throw new Error("GROQ_API_KEY is not configured in Settings > Secrets.");
  }

  if (params.pinnedModel) {
    return await callOpenAiCompatibleJson({
      provider: "groq",
      providerLabel: "Groq",
      completionsUrl: cfg.completionsUrl,
      apiKey: cfg.apiKey,
      model: params.pinnedModel,
      userPrompt: params.userPrompt,
      systemInstruction: params.systemInstruction,
      responseSchema: params.responseSchema,
    });
  }

  const groqModels = Array.from(
    new Set([
      cfg.model,
      "openai/gpt-oss-120b",
      "openai/gpt-oss-20b",
      "qwen/qwen3.8-27b",
    ])
  );

  let lastErr: unknown;
  for (let i = 0; i < groqModels.length; i++) {
    const model = groqModels[i];
    try {
      return await callOpenAiCompatibleJson({
        provider: "groq",
        providerLabel: "Groq",
        completionsUrl: cfg.completionsUrl,
        apiKey: cfg.apiKey,
        model,
        userPrompt: params.userPrompt,
        systemInstruction: params.systemInstruction,
        responseSchema: params.responseSchema,
      });
    } catch (err: unknown) {
      lastErr = err;
      const msg = extractErrorMessage(err);
      if (!isRetryableAiError(msg) || i === groqModels.length - 1) {
        throw err;
      }
      console.warn(
        `Groq ${model} failed (${msg.slice(0, 120)}), falling back to ${groqModels[i + 1]}...`
      );
      await sleep(250);
    }
  }
  throw lastErr;
}

async function callOpenRouterJson(params: {
  userPrompt: string;
  systemInstruction: string;
  responseSchema: Record<string, unknown>;
  pinnedModel?: string;
}): Promise<StructuredAiResult> {
  const cfg = getOpenRouterConfig();
  if (!cfg.configured) {
    throw new Error(
      "OPENROUTER_API_KEY is not configured in Settings > Secrets."
    );
  }
  const appUrl =
    cleanEnvValue(process.env.APP_URL) || "https://atendimentobr.app";

  if (params.pinnedModel) {
    return await callOpenAiCompatibleJson({
      provider: "openrouter",
      providerLabel: "OpenRouter",
      completionsUrl: cfg.completionsUrl,
      apiKey: cfg.apiKey,
      model: params.pinnedModel,
      extraHeaders: {
        "HTTP-Referer": appUrl,
        "X-Title": "Atendimento BR",
      },
      userPrompt: params.userPrompt,
      systemInstruction: params.systemInstruction,
      responseSchema: params.responseSchema,
    });
  }

  const candidates = Array.from(
    new Set([
      cfg.model,
      "baidu/ernie-5.5-flash-preview:free",
      "nvidia/nemotron-3.5-super-vl:free",
      "openrouter/free",
      "particle-ai/particle-1:free",
      "google/gemma-4-31b-it:free",
    ])
  );

  let lastErr: unknown;
  for (let i = 0; i < candidates.length; i++) {
    const model = candidates[i];
    try {
      return await callOpenAiCompatibleJson({
        provider: "openrouter",
        providerLabel: "OpenRouter",
        completionsUrl: cfg.completionsUrl,
        apiKey: cfg.apiKey,
        model,
        extraHeaders: {
          "HTTP-Referer": appUrl,
          "X-Title": "Atendimento BR",
        },
        userPrompt: params.userPrompt,
        systemInstruction: params.systemInstruction,
        responseSchema: params.responseSchema,
      });
    } catch (err: unknown) {
      lastErr = err;
      const msg = extractErrorMessage(err);
      if (!isRetryableAiError(msg) || i === candidates.length - 1) {
        throw err;
      }
      console.warn(
        `OpenRouter ${model} failed (${msg.slice(0, 120)}), falling back to ${candidates[i + 1]}...`
      );
      await sleep(250);
    }
  }
  throw lastErr;
}

async function generateStructuredAi(params: {
  contents: string;
  systemInstruction: string;
  responseSchema: Record<string, unknown>;
  aiProvider?: "auto" | "gemini" | "groq" | "openrouter";
  aiModel?: string;
}): Promise<StructuredAiResult> {
  const preference = params.aiProvider || "auto";
  const pinnedModel =
    typeof params.aiModel === "string" && params.aiModel.trim()
      ? params.aiModel.trim()
      : undefined;

  const geminiConfigured = Boolean(getGeminiClient());
  const groq = getGroqConfig();
  const openrouter = getOpenRouterConfig();

  const configuredMap: Record<ConcreteAiProvider, boolean> = {
    gemini: geminiConfigured,
    groq: groq.configured,
    openrouter: openrouter.configured,
  };

  const runProvider = (
    provider: ConcreteAiProvider,
    specificModel?: string
  ): Promise<StructuredAiResult> => {
    switch (provider) {
      case "gemini":
        return callGeminiWithFallback(
          params.contents,
          {
            systemInstruction: params.systemInstruction,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: "application/json",
            responseSchema: params.responseSchema,
          },
          specificModel
        );
      case "groq":
        return callGroqJson({
          userPrompt: params.contents,
          systemInstruction: params.systemInstruction,
          responseSchema: params.responseSchema,
          pinnedModel: specificModel,
        });
      case "openrouter":
        return callOpenRouterJson({
          userPrompt: params.contents,
          systemInstruction: params.systemInstruction,
          responseSchema: params.responseSchema,
          pinnedModel: specificModel,
        });
    }
  };

  const secretNameMap: Record<ConcreteAiProvider, string> = {
    gemini: "GEMINI_API_KEY",
    groq: "GROQ_API_KEY",
    openrouter: "OPENROUTER_API_KEY",
  };

  // Explicit provider selected -> run that provider directly (testing specific model or provider)
  if (preference !== "auto") {
    if (!configuredMap[preference]) {
      throw new Error(
        `${secretNameMap[preference]} is not configured in Settings > Secrets.`
      );
    }
    return await runProvider(preference, pinnedModel);
  }

  // Auto mode: cascade Gemini -> Groq -> OpenRouter
  const defaultOrder: ConcreteAiProvider[] = ["gemini", "groq", "openrouter"];
  const chain = defaultOrder.filter((p) => configuredMap[p]);
  if (chain.length === 0) {
    throw new Error(
      "No AI provider key configured. Add GEMINI_API_KEY, GROQ_API_KEY, or OPENROUTER_API_KEY in Settings > Secrets."
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
      console.warn(
        `${provider} chain failed (${msg.slice(0, 120)}). Failing over to ${chain[i + 1]}...`
      );
      await sleep(250);
    }
  }

  throw lastError;
}

function sendAiErrorResponse(
  res: express.Response,
  err: unknown,
  fallbackMessage: string
) {
  const message = err instanceof Error ? err.message : fallbackMessage;
  console.error(fallbackMessage, message);

  if (
    message.includes("not configured") ||
    message.includes("No AI provider key")
  ) {
    res.status(500).json({ error: message });
    return;
  }
  if (
    message.includes("PERMISSION_DENIED") ||
    message.includes("API_KEY_INVALID") ||
    message.includes("401")
  ) {
    res.status(403).json({
      error:
        "AI API key authentication error. Please verify GEMINI_API_KEY, GROQ_API_KEY, or OPENROUTER_API_KEY in Settings > Secrets.",
    });
    return;
  }
  if (message.includes("403")) {
    res.status(403).json({ error: message });
    return;
  }
  if (message.includes("RESOURCE_EXHAUSTED") || message.includes("429")) {
    res.status(429).json({
      error:
        "Rate limit reached on this model/provider. Switch to Auto or try another model.",
    });
    return;
  }
  if (isTimeoutOr524Error(message)) {
    res.status(504).json({
      error:
        "Upstream AI gateway timed out (524 / 504). Switch to Auto failover or try a faster model.",
    });
    return;
  }
  res.status(500).json({ error: message });
}

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    runtime: "express",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/ai-status", async (_req, res) => {
  const geminiConfigured = Boolean(getGeminiClient());
  const groq = getGroqConfig();
  const openrouter = getOpenRouterConfig();
  const availableModels = await fetchLiveAvailableModels();
  res.json({
    geminiConfigured,
    groqConfigured: groq.configured,
    openrouterConfigured: openrouter.configured,
    geminiModel: GEMINI_MODEL,
    groqModel: groq.model,
    openrouterModel: openrouter.model,
    availableModels,
  });
});

app.post("/api/generate-reply", async (req, res) => {
  try {
    const body = req.body as GenerateReplyRequest;
    const rawInput = typeof body?.input === "string" ? body.input.trim() : "";

    if (!rawInput) {
      res.status(400).json({
        error: "Please enter the order/product info and customer concern.",
      });
      return;
    }

    const { contextLines, systemInstruction, responseSchema } =
      buildGenerateReplyPromptAndSchema(body, rawInput);

    const result = await generateStructuredAi({
      contents: contextLines,
      systemInstruction,
      responseSchema,
      aiProvider: body.aiProvider,
      aiModel: body.aiModel,
    });

    const parsed = JSON.parse(result.text);
    res.json({
      ...parsed,
      aiMeta: {
        provider: result.provider,
        model: result.model,
      },
    });
  } catch (err: unknown) {
    sendAiErrorResponse(res, err, "Failed to generate customer reply.");
  }
});

app.post("/api/learn-rule", async (req, res) => {
  try {
    const body = req.body as LearnRuleRequest & {
      aiProvider?: "auto" | "gemini" | "groq" | "openrouter";
      aiModel?: string;
    };
    if (!body?.rawInput?.trim()) {
      res.status(400).json({
        error:
          "Provide the case input or instructions first to detect scenarios and rules.",
      });
      return;
    }

    const { contextLines, systemInstruction, responseSchema } =
      buildLearnRulePromptAndSchema(body);

    const result = await generateStructuredAi({
      contents: contextLines,
      systemInstruction,
      responseSchema,
      aiProvider: body.aiProvider,
      aiModel: body.aiModel,
    });

    res.json(JSON.parse(result.text));
  } catch (err: unknown) {
    sendAiErrorResponse(res, err, "Failed to learn scenario/rule update.");
  }
});

app.post("/api/chat-flow", async (req, res) => {
  try {
    const body = req.body as ChatFlowRequest;
    const orderContext =
      typeof body?.orderContext === "string" ? body.orderContext.trim() : "";
    const latestCxMessage =
      typeof body?.latestCxMessage === "string"
        ? body.latestCxMessage.trim()
        : "";

    if (!orderContext && !latestCxMessage) {
      res.status(400).json({
        error:
          "Please enter the order info or customer message to start the Chat Flow.",
      });
      return;
    }

    const { contextLines, systemInstruction, responseSchema } =
      buildChatFlowPromptAndSchema(body, orderContext, latestCxMessage);

    const result = await generateStructuredAi({
      contents: contextLines,
      systemInstruction,
      responseSchema,
      aiProvider: body.aiProvider,
      aiModel: body.aiModel,
    });

    const parsed = JSON.parse(result.text);
    res.json({
      ...parsed,
      aiMeta: {
        provider: result.provider,
        model: result.model,
      },
    });
  } catch (err: unknown) {
    sendAiErrorResponse(res, err, "Failed to generate Chat Flow step.");
  }
});

async function startServer() {
  if (process.env.NODE_ENV === "production") {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("/{*path}", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Atendimento BR server running at http://localhost:${PORT}`);
  });
}

startServer();
