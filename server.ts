import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import {
  buildChatFlowPromptAndSchema,
  buildGenerateReplyPromptAndSchema,
  type ChatFlowRequest,
  type GenerateReplyRequest,
} from "./shared/csPromptEngine.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "1mb" }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-4-hydrogen";

async function generateContentWithFallback(
  contents: string,
  config: Record<string, unknown>
) {
  const candidates = Array.from(
    new Set([GEMINI_MODEL, "gemini-3.1-flash-lite", "gemini-2.5-flash"])
  );

  let lastError: unknown;
  for (let i = 0; i < candidates.length; i++) {
    const model = candidates[i];
    const effectiveConfig = { ...config };
    if (model.startsWith("gemini-2.5")) {
      delete effectiveConfig.thinkingConfig;
    }

    try {
      return await ai.models.generateContent({
        model,
        contents,
        config: effectiveConfig,
      });
    } catch (err: unknown) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isRetryable =
        msg.includes("429") ||
        msg.includes("RESOURCE_EXHAUSTED") ||
        msg.includes("404") ||
        msg.includes("NOT_FOUND") ||
        msg.includes("503") ||
        msg.includes("UNAVAILABLE");
      if (!isRetryable || i === candidates.length - 1) {
        throw err;
      }
      console.warn(
        `Model ${model} unavailable/rate-limited, falling back to ${candidates[i + 1]}`
      );
    }
  }
  throw lastError;
}

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    runtime: "express",
    timestamp: new Date().toISOString(),
  });
});

app.post("/api/generate-reply", async (req, res) => {
  try {
    const body = req.body as GenerateReplyRequest;
    const rawInput = typeof body?.input === "string" ? body.input.trim() : "";

    if (!rawInput) {
      res.status(400).json({ error: "Please enter the order/product info and customer concern." });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({
        error: "GEMINI_API_KEY is not configured. Please add it in Settings > Secrets.",
      });
      return;
    }

    const { contextLines, systemInstruction, responseSchema } =
      buildGenerateReplyPromptAndSchema(body, rawInput);

    const response = await generateContentWithFallback(contextLines, {
      systemInstruction,
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: "application/json",
      responseSchema,
    });

    const jsonText = (response.text ?? "").trim();
    if (!jsonText) {
      res.status(502).json({ error: "Empty response received from the AI service. Please try again." });
      return;
    }

    const parsed = JSON.parse(jsonText);
    res.json(parsed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to generate customer reply.";
    console.error("Error generating Shopee CS reply:", message);

    if (message.includes("PERMISSION_DENIED") || message.includes("API_KEY_INVALID") || message.includes("403")) {
      res.status(403).json({
        error: "Gemini API key permission error. Please verify GEMINI_API_KEY in Settings > Secrets.",
      });
      return;
    }
    if (message.includes("RESOURCE_EXHAUSTED") || message.includes("429")) {
      res.status(429).json({
        error: "Rate limit reached. Please wait a moment and try again.",
      });
      return;
    }

    res.status(500).json({ error: message });
  }
});

app.post("/api/chat-flow", async (req, res) => {
  try {
    const body = req.body as ChatFlowRequest;
    const orderContext =
      typeof body?.orderContext === "string" ? body.orderContext.trim() : "";
    const latestCxMessage =
      typeof body?.latestCxMessage === "string" ? body.latestCxMessage.trim() : "";

    if (!orderContext && !latestCxMessage) {
      res.status(400).json({
        error: "Please enter the order info or customer message to start the Chat Flow.",
      });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({
        error: "GEMINI_API_KEY is not configured. Please add it in Settings > Secrets.",
      });
      return;
    }

    const { contextLines, systemInstruction, responseSchema } =
      buildChatFlowPromptAndSchema(body, orderContext, latestCxMessage);

    const response = await generateContentWithFallback(contextLines, {
      systemInstruction,
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: "application/json",
      responseSchema,
    });

    const jsonText = (response.text ?? "").trim();
    if (!jsonText) {
      res.status(502).json({
        error: "Empty response received from the AI service. Please try again.",
      });
      return;
    }

    const parsed = JSON.parse(jsonText);
    res.json(parsed);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to generate Chat Flow step.";
    console.error("Error generating Shopee CS chat flow:", message);

    if (
      message.includes("PERMISSION_DENIED") ||
      message.includes("API_KEY_INVALID") ||
      message.includes("403")
    ) {
      res.status(403).json({
        error: "Gemini API key permission error. Please verify GEMINI_API_KEY in Settings > Secrets.",
      });
      return;
    }
    if (message.includes("RESOURCE_EXHAUSTED") || message.includes("429")) {
      res.status(429).json({
        error: "Rate limit reached. Please wait a moment and try again.",
      });
      return;
    }

    res.status(500).json({ error: message });
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
