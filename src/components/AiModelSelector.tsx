import React, { useState, useEffect } from "react";
import { AiProviderPreference, AiStatusInfo } from "../types/cs";
import { formatAutoRouteOptionLabel } from "../utils/aiProviderLabels";

interface AiModelSelectorProps {
  idPrefix: string;
  aiProvider: AiProviderPreference;
  aiModel: string;
  aiStatus: AiStatusInfo | null;
  onChangeProvider: (provider: AiProviderPreference) => void;
  onChangeModel: (model: string) => void;
}

export const AiModelSelector: React.FC<AiModelSelectorProps> = ({
  idPrefix,
  aiProvider,
  aiModel,
  aiStatus,
  onChangeProvider,
  onChangeModel,
}) => {
  const [useCustomModel, setUseCustomModel] = useState(false);

  const modelsForProvider =
    aiProvider === "gemini"
      ? aiStatus?.availableModels?.gemini ?? [
          "gemini-3.1-flash-lite",
          "gemini-4-hydrogen",
          "gemini-2.5-flash",
        ]
      : aiProvider === "groq"
        ? aiStatus?.availableModels?.groq ?? [
            "openai/gpt-oss-120b",
            "openai/gpt-oss-20b",
            "qwen/qwen3.8-27b",
          ]
        : aiProvider === "openrouter"
          ? aiStatus?.availableModels?.openrouter ?? [
              "baidu/ernie-5.5-flash-preview:free",
              "nvidia/nemotron-3.5-super-vl:free",
              "openrouter/free",
              "particle-ai/particle-1:free",
              "google/gemma-4-31b-it:free",
            ]
          : [];

  const defaultModelForProvider =
    aiProvider === "gemini"
      ? aiStatus?.geminiModel || "gemini-3.1-flash-lite"
      : aiProvider === "groq"
        ? aiStatus?.groqModel || "openai/gpt-oss-120b"
        : aiProvider === "openrouter"
          ? aiStatus?.openrouterModel || "baidu/ernie-5.5-flash-preview:free"
          : "";

  useEffect(() => {
    if (aiProvider === "auto") {
      setUseCustomModel(false);
    } else if (aiModel && !modelsForProvider.includes(aiModel)) {
      setUseCustomModel(true);
    } else {
      setUseCustomModel(false);
    }
  }, [aiProvider, aiModel, modelsForProvider]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5">
        <label
          htmlFor={`${idPrefix}-ai-route`}
          className="text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap"
        >
          AI:
        </label>
        <select
          id={`${idPrefix}-ai-route`}
          value={aiProvider}
          onChange={(e) => {
            const next = e.target.value as AiProviderPreference;
            onChangeProvider(next);
            onChangeModel("");
            setUseCustomModel(false);
          }}
          className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 focus:border-[#EE4D2D] focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]/15"
        >
          <option value="auto">{formatAutoRouteOptionLabel(aiStatus)}</option>
          <option
            value="gemini"
            disabled={aiStatus ? !aiStatus.geminiConfigured : false}
          >
            {aiStatus && !aiStatus.geminiConfigured
              ? "Gemini (set GEMINI_API_KEY)"
              : "Gemini"}
          </option>
          <option
            value="groq"
            disabled={aiStatus ? !aiStatus.groqConfigured : false}
          >
            {aiStatus && !aiStatus.groqConfigured
              ? "Groq (set GROQ_API_KEY)"
              : "Groq"}
          </option>
          <option
            value="openrouter"
            disabled={aiStatus ? !aiStatus.openrouterConfigured : false}
          >
            {aiStatus && !aiStatus.openrouterConfigured
              ? "OpenRouter (set OPENROUTER_API_KEY)"
              : "OpenRouter"}
          </option>
        </select>
      </div>

      {aiProvider !== "auto" && (
        <div className="flex items-center gap-1.5">
          <label
            htmlFor={`${idPrefix}-ai-model`}
            className="text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap"
          >
            Model:
          </label>
          <select
            id={`${idPrefix}-ai-model`}
            value={useCustomModel ? "__custom__" : aiModel}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "__custom__") {
                setUseCustomModel(true);
                if (!aiModel || modelsForProvider.includes(aiModel)) {
                  onChangeModel(defaultModelForProvider);
                }
              } else {
                setUseCustomModel(false);
                onChangeModel(val);
              }
            }}
            className="max-w-[230px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 focus:border-[#EE4D2D] focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]/15"
          >
            <option value="">
              Default ({defaultModelForProvider})
            </option>
            {modelsForProvider.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
            <option value="__custom__">Custom model ID...</option>
          </select>

          {useCustomModel && (
            <input
              type="text"
              aria-label="Custom AI model ID"
              value={aiModel}
              onChange={(e) => onChangeModel(e.target.value)}
              placeholder="Enter model ID to test..."
              className="w-48 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-[#EE4D2D] focus:outline-none"
            />
          )}
        </div>
      )}
    </div>
  );
};
