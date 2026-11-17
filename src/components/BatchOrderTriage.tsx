import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  Copy,
  ExternalLink,
  Layers,
  MessageSquare,
  RotateCcw,
  Send,
  Sparkles,
} from "lucide-react";
import {
  AiProviderPreference,
  AiStatusInfo,
  GeneratedReply,
  ScriptScenario,
  StoreRuleEntry,
  ToneOption,
  UsageTrackEventPayload,
} from "../types/cs";
import { copyToClipboard } from "../utils/clipboard";
import {
  detectDefaultPathForScenario,
  evaluateDeliveryScheduleStatus,
  getCourierTrackingUrl,
  parseShopeeOrderPaste,
  splitBatchOrderPastes,
} from "../utils/shopeeParser";
import { analyzeBrazilianSlangAndTone } from "../../shared/slangToneDetector";
import { formatAiProviderName } from "../utils/aiProviderLabels";
import { AiModelSelector } from "./AiModelSelector";

interface BatchOrderTriageProps {
  scenarios: ScriptScenario[];
  storeRules?: StoreRuleEntry[];
  aiProvider: AiProviderPreference;
  aiModel?: string;
  aiStatus?: AiStatusInfo | null;
  onChangeProvider?: (provider: AiProviderPreference) => void;
  onChangeModel?: (model: string) => void;
  onTrackUsageEvents?: (events: UsageTrackEventPayload[]) => Promise<void> | void;
  onOpenSingleOrder: (rawInput: string) => void;
  onOpenInChatFlow?: (rawInput: string) => void;
}

interface TriageCardResult {
  status: "idle" | "loading" | "done" | "error";
  reply?: GeneratedReply;
  editedPt?: string;
  error?: string;
}

const SAMPLE_BATCH_INPUT = `Order SN:
2611127GCAVN01
Fone Bluetooth Sem Fio TWS
Shipping Tracking No
AJ2611129988101
Shipping Carrier Name
Expresso padrão
Estimated Delivery Time
2026-12-02 01:45 +0800
Latest Logistic Status
inspeção na alfândega
Latest Logistic Date
2026-11-15 10:20 +0800

CX> Oxi, tô esperando faz dias e tá parado na alfândega! Vai demorar muito?
---
Order SN:
261018BR77X202
Smartwatch Esportivo Ultra
Shipping Tracking No
BR2699817253BR
Shipping Carrier Name
Expresso padrão
Estimated Delivery Time
2026-11-04 01:00 +0800
Latest Logistic Status
Em trânsito para centro de distribuição
Latest Logistic Date
2026-11-14 08:15 +0800

CX> Absurdo esse atraso!! Passou do prazo faz tempo, se não chegar vou no Procon e abrir processo!!
---
Order SN:
2611039SP7DN03
Brincos Dourados Boho Chic
R$11,77 x1
Shipping Tracking No
NX884422110BR
Shipping Carrier Name
Expresso padrão
Latest Logistic Status
DELIVERED

CX> Moça, o brinco é lindo mas veio sem a tarraxa... tô chateada, mando no zap?`;

export const BatchOrderTriage: React.FC<BatchOrderTriageProps> = ({
  scenarios,
  storeRules,
  aiProvider,
  aiModel = "",
  aiStatus = null,
  onChangeProvider,
  onChangeModel,
  onTrackUsageEvents,
  onOpenSingleOrder,
  onOpenInChatFlow,
}) => {
  const [batchInput, setBatchInput] = useState("");
  const [resultsByKey, setResultsByKey] = useState<Record<string, TriageCardResult>>({});
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const parsedItems = useMemo(() => {
    const blocks = splitBatchOrderPastes(batchInput, 5);
    return blocks
      .map((raw, idx) => {
        const parsed = parseShopeeOrderPaste(raw);
        const slang = analyzeBrazilianSlangAndTone(raw);
        const schedule = evaluateDeliveryScheduleStatus({
          rawText: raw,
          estimatedDate: parsed.estimatedDate,
          lastUpdateDate: parsed.lastUpdateDate,
        });
        const matchedScenario = parsed.matchedScenarioId
          ? scenarios.find((s) => s.id === parsed.matchedScenarioId)
          : undefined;
        const trackingLink = getCourierTrackingUrl(
          parsed.trackingNumber,
          parsed.carrierName
        );

        let priorityRank = 2;
        let priorityLabel = "Standard";
        if (
          slang.mood === "High-Risk / Frustrated" ||
          parsed.matchedScenarioId === "s23" ||
          parsed.matchedScenarioId === "s6" ||
          !schedule.isWithin5to14Schedule
        ) {
          priorityRank = 0;
          priorityLabel = "High Priority";
        } else if (
          slang.mood === "Anxious / Impatient" ||
          parsed.matchedScenarioId === "s3" ||
          parsed.matchedScenarioId === "s15" ||
          parsed.matchedScenarioId === "s2" ||
          parsed.matchedScenarioId === "s5"
        ) {
          priorityRank = 1;
          priorityLabel = "Medium Priority";
        }

        const key = `${idx}-${parsed.orderSn || raw.slice(0, 24)}`;
        return {
          key,
          index: idx + 1,
          raw,
          parsed,
          slang,
          schedule,
          matchedScenario,
          trackingLink,
          priorityRank,
          priorityLabel,
        };
      })
      .sort((a, b) => a.priorityRank - b.priorityRank);
  }, [batchInput, scenarios]);

  const markCopied = (key: string) => {
    setCopiedKey(key);
    window.setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 1800);
  };

  const generateSingleCard = async (item: (typeof parsedItems)[number]) => {
    setResultsByKey((prev) => ({
      ...prev,
      [item.key]: { status: "loading" },
    }));

    try {
      const targetPath =
        item.matchedScenario?.paths && item.matchedScenario.paths.length > 0
          ? item.matchedScenario.paths.find(
              (p) =>
                p.id ===
                detectDefaultPathForScenario(
                  item.matchedScenario!.id,
                  item.raw,
                  item.parsed
                )
            ) ?? item.matchedScenario.paths[0]
          : undefined;

      const resolvedTone =
        item.slang.recommendedTone === "Extra Empathetic"
          ? ToneOption.EMPATHETIC
          : ToneOption.STANDARD;

      const res = await fetch("/api/generate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: item.raw,
          carrierName: item.parsed.carrierName || undefined,
          trackingNumber: item.parsed.trackingNumber || undefined,
          lastUpdateDate: item.parsed.lastUpdateDate || undefined,
          estimatedDate: item.parsed.estimatedDate || undefined,
          latestStatus: item.parsed.latestStatus || undefined,
          issueTopic: item.parsed.cxConcern || undefined,
          tone: resolvedTone,
          aiProvider,
          aiModel: aiModel.trim() || undefined,
          slangToneHint: item.slang.promptHint || undefined,
          detectedAmount: item.parsed.productAmount || undefined,
          voucherTier: item.parsed.voucherAmount || undefined,
          selectedScenarioTitle: item.matchedScenario?.title || undefined,
          selectedPathLabel: targetPath?.label || undefined,
          selectedPathTrigger: targetPath?.cxTrigger || undefined,
          selectedPathGuidance: targetPath
            ? targetPath.rows.map((r) => `- ${r.section}: ${r.english}`).join("\n")
            : undefined,
          customStoreRules: storeRules?.map((r) => ({
            id: r.id,
            topic: r.topic,
            english: r.english,
            portuguese: r.portuguese,
            isPrimary: r.isPrimary,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to draft reply.");
      }

      const generated = data as GeneratedReply;
      setResultsByKey((prev) => ({
        ...prev,
        [item.key]: {
          status: "done",
          reply: generated,
          editedPt: generated.fullPortugueseMessage,
        },
      }));

      if (onTrackUsageEvents && item.matchedScenario) {
        void onTrackUsageEvents([
          {
            itemType: "script",
            itemId: item.matchedScenario.id,
            itemTitle: item.matchedScenario.title,
            category: item.matchedScenario.category,
            event: "applied",
          },
        ]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unexpected batch error.";
      setResultsByKey((prev) => ({
        ...prev,
        [item.key]: { status: "error", error: msg },
      }));
    }
  };

  const handleDraftAll = async () => {
    if (parsedItems.length === 0 || isBatchRunning) return;
    setIsBatchRunning(true);
    try {
      // Concurrency pool of 2 to keep throughput high without triggering 524/429
      const queue = [...parsedItems];
      const worker = async () => {
        while (queue.length > 0) {
          const next = queue.shift();
          if (next) await generateSingleCard(next);
        }
      };
      await Promise.all([worker(), worker()]);
    } finally {
      setIsBatchRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#EE4D2D]" />
              Batch Order Triage (Up to 5 Orders)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Paste 2–5 customer inquiries separated by <span className="font-mono">---</span> or multiple <span className="font-mono">Order SN:</span> headers. Cards sort automatically by urgency, slang risk, and delivery schedule.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setBatchInput(SAMPLE_BATCH_INPUT);
                setResultsByKey({});
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-[#EE4D2D] hover:text-[#EE4D2D] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Load Sample Batch (3 Orders)
            </button>
            <button
              type="button"
              onClick={() => {
                setBatchInput("");
                setResultsByKey({});
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear Batch
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <label
              htmlFor="batch-paste-input"
              className="text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Multi-Order Paste Input (separate orders with --- or Order SN:)
            </label>
            <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {parsedItems.length} {parsedItems.length === 1 ? "order" : "orders"} detected (max 5)
            </span>
          </div>
          <textarea
            id="batch-paste-input"
            rows={7}
            value={batchInput}
            onChange={(e) => setBatchInput(e.target.value)}
            placeholder={`Paste Order 1 + CX> ...\n---\nPaste Order 2 + CX> ...\n---\nPaste Order 3 + CX> ...`}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/70 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-[#EE4D2D] focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]/15"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              High-priority escalations, Procon threats, and past-schedule orders appear first in the triage grid.
            </p>
            {onChangeProvider && onChangeModel && (
              <AiModelSelector
                idPrefix="batch"
                aiProvider={aiProvider}
                aiModel={aiModel}
                aiStatus={aiStatus}
                onChangeProvider={onChangeProvider}
                onChangeModel={onChangeModel}
              />
            )}
          </div>
          <button
            type="button"
            disabled={parsedItems.length === 0 || isBatchRunning}
            onClick={() => void handleDraftAll()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#EE4D2D] hover:bg-[#d94123] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            {isBatchRunning
              ? "Drafting Batch..."
              : `Draft All Replies (${parsedItems.length})`}
          </button>
        </div>
      </section>

      {parsedItems.length === 0 ? (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
            Ready for multi-order triage
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-lg mx-auto leading-relaxed">
            Paste 2 to 5 customer inquiries above or load the sample batch to inspect priorities, tracking links, slang cues, and draft Portuguese replies in parallel.
          </p>
        </section>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {parsedItems.map((item) => {
            const cardState = resultsByKey[item.key] ?? { status: "idle" };
            const currentPt =
              cardState.editedPt ?? cardState.reply?.fullPortugueseMessage ?? "";

            return (
              <article
                key={item.key}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  {/* Card Header: Clean metadata with dot separators (Zero-Pill Rule) */}
                  <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span
                          className={`font-semibold ${
                            item.priorityRank === 0
                              ? "text-red-600 dark:text-red-400"
                              : item.priorityRank === 1
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-emerald-700 dark:text-emerald-400"
                          }`}
                        >
                          {item.priorityLabel}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
                          ·
                        </span>
                        <span className="font-mono text-slate-800 dark:text-slate-200 tabular-nums">
                          {item.parsed.orderSn ? `Order ${item.parsed.orderSn}` : `Case #${item.index}`}
                        </span>
                        {item.parsed.carrierName && (
                          <>
                            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
                              ·
                            </span>
                            <span className="text-slate-600 dark:text-slate-300">
                              {item.parsed.carrierName}
                            </span>
                          </>
                        )}
                        {cardState.reply?.aiMeta && (
                          <>
                            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
                              ·
                            </span>
                            <span className="text-slate-500 dark:text-slate-400">
                              {formatAiProviderName(cardState.reply.aiMeta.provider)} (
                              {cardState.reply.aiMeta.model})
                            </span>
                          </>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">
                        {cardState.reply?.detectedScenario ||
                          item.matchedScenario?.title ||
                          "General Customer Inquiry"}
                      </h3>
                    </div>

                    {item.trackingLink && (
                      <a
                        href={item.trackingLink.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:border-[#EE4D2D] hover:text-[#EE4D2D] transition-colors whitespace-nowrap shrink-0"
                      >
                        Track {item.trackingLink.courier}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {/* Diagnostic metadata strip */}
                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        Schedule:{" "}
                      </span>
                      {item.schedule.isWithin5to14Schedule
                        ? "Within 5–14d schedule (cite 5–14d estimate + Guarantee)"
                        : "Past 5–14d / Past EDD (omit 5–14d · Empathy + Courier Follow-Up)"}
                    </div>
                    {item.slang.hasSignals && (
                      <div>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          Tone &amp; Slang:{" "}
                        </span>
                        {item.slang.summaryNote}
                      </div>
                    )}
                    {item.parsed.cxConcern && (
                      <p className="text-slate-800 dark:text-slate-200 pt-0.5">
                        <span className="font-medium text-slate-500 dark:text-slate-400">
                          CX:{" "}
                        </span>
                        {item.parsed.cxConcern}
                      </p>
                    )}
                  </div>

                  {/* Loading / Error / Draft Output */}
                  {cardState.status === "loading" && (
                    <div className="space-y-2 py-3">
                      <div className="h-4 w-3/4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                      <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                      <div className="h-4 w-5/6 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                    </div>
                  )}

                  {cardState.status === "error" && (
                    <div className="flex items-start gap-2 rounded-lg border border-red-200 dark:border-red-900/70 bg-red-50 dark:bg-red-950/50 px-3 py-2 text-xs text-red-800 dark:text-red-300">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{cardState.error}</span>
                    </div>
                  )}

                  {cardState.status === "done" && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          Portuguese Draft (editable)
                        </span>
                        <span className="tabular-nums">{currentPt.length} chars</span>
                      </div>
                      <textarea
                        rows={4}
                        value={currentPt}
                        onChange={(e) => {
                          const val = e.target.value;
                          setResultsByKey((prev) => ({
                            ...prev,
                            [item.key]: {
                              ...prev[item.key],
                              editedPt: val,
                            },
                          }));
                        }}
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/70 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 leading-relaxed focus:bg-white dark:focus:bg-slate-900 focus:border-[#EE4D2D] focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenSingleOrder(item.raw)}
                      className="px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:border-[#EE4D2D] hover:text-[#EE4D2D] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Open in Single
                    </button>
                    {onOpenInChatFlow && (
                      <button
                        type="button"
                        onClick={() => onOpenInChatFlow(item.raw)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:border-[#EE4D2D] hover:text-[#EE4D2D] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <MessageSquare className="w-3 h-3" />
                        Chat Flow
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={cardState.status === "loading"}
                      onClick={() => void generateSingleCard(item)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:border-[#EE4D2D] hover:text-[#EE4D2D] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {cardState.status === "done" ? "Regenerate" : "Draft Reply"}
                    </button>
                    {cardState.status === "done" && currentPt && (
                      <button
                        type="button"
                        onClick={async () => {
                          const ok = await copyToClipboard(currentPt);
                          if (ok) markCopied(item.key);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#EE4D2D] hover:bg-[#d94123] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {copiedKey === item.key ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Copy PT
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
