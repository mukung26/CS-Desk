import React, { useState, useEffect, useMemo } from "react";
import {
  Copy,
  Check,
  Send,
  RotateCcw,
  Bookmark,
  Table as TableIcon,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import {
  GeneratedReply,
  ScriptScenario,
  StoreRuleEntry,
  ToneOption,
} from "../types/cs";
import { copyToClipboard, formatRowsAsMarkdownTable } from "../utils/clipboard";
import {
  detectDefaultPathForScenario,
  parseShopeeOrderPaste,
} from "../utils/shopeeParser";

interface ReplyGeneratorProps {
  scenarios: ScriptScenario[];
  storeRules?: StoreRuleEntry[];
  isSignedIn: boolean;
  onSignIn: () => void;
  prefillInput: string;
  onClearPrefill: () => void;
  onSaveToHistory: (entry: {
    rawInput: string;
    trackingNumber?: string;
    estimatedDate?: string;
    tone: ToneOption;
    reply: GeneratedReply;
  }) => Promise<boolean>;
  onOpenInChatFlow?: (rawInput: string) => void;
  loadedReply?: {
    rawInput: string;
    trackingNumber?: string;
    estimatedDate?: string;
    tone: ToneOption;
    reply: GeneratedReply;
  } | null;
}

export const ReplyGenerator: React.FC<ReplyGeneratorProps> = ({
  scenarios,
  storeRules,
  isSignedIn,
  onSignIn,
  prefillInput,
  onClearPrefill,
  onSaveToHistory,
  onOpenInChatFlow,
  loadedReply,
}) => {
  const [input, setInput] = useState("");
  const [carrierName, setCarrierName] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [lastUpdateDate, setLastUpdateDate] = useState("");
  const [estimatedDate, setEstimatedDate] = useState("");
  const [latestStatus, setLatestStatus] = useState("");
  const [issueTopic, setIssueTopic] = useState("");
  const [productSpec, setProductSpec] = useState("");
  const [detectedOrderSn, setDetectedOrderSn] = useState<string | null>(null);
  const [detectedAmount, setDetectedAmount] = useState<string | null>(null);
  const [detectedVoucherTier, setDetectedVoucherTier] = useState("");
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [activePathId, setActivePathId] = useState<string | null>(null);
  const [manualScenarioLock, setManualScenarioLock] = useState(false);
  const [tone, setTone] = useState<ToneOption>(ToneOption.STANDARD);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState<GeneratedReply | null>(null);
  const [outputPathId, setOutputPathId] = useState<string | null>(null);
  const [editedPtByPath, setEditedPtByPath] = useState<Record<string, string>>({});
  const [editablePt, setEditablePt] = useState("");

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedFlag, setSavedFlag] = useState(false);

  const branchingScenarios = useMemo(
    () => scenarios.filter((s) => s.paths && s.paths.length > 0),
    [scenarios]
  );

  const activeScenario = useMemo(
    () => scenarios.find((s) => s.id === activeScenarioId) ?? null,
    [scenarios, activeScenarioId]
  );

  const activePath = useMemo(() => {
    if (!activeScenario?.paths?.length) return null;
    if (!activePathId) return null;
    return activeScenario.paths.find((p) => p.id === activePathId) ?? null;
  }, [activeScenario, activePathId]);

  const activeGeneratedPath = useMemo(() => {
    if (!reply?.pathReplies?.length) return null;
    return (
      reply.pathReplies.find((p) => p.pathId === outputPathId) ??
      reply.pathReplies[0]
    );
  }, [reply, outputPathId]);

  const displayedPolicySummary =
    activeGeneratedPath?.policySummary ?? reply?.policySummary ?? "";
  const displayedRows = activeGeneratedPath?.rows ?? reply?.rows ?? [];
  const displayedEditablePt = activeGeneratedPath
    ? editedPtByPath[activeGeneratedPath.pathId] ??
      activeGeneratedPath.fullPortugueseMessage
    : editablePt;

  const updateDisplayedEditablePt = (nextValue: string) => {
    if (activeGeneratedPath) {
      setEditedPtByPath((prev) => ({
        ...prev,
        [activeGeneratedPath.pathId]: nextValue,
      }));
    } else {
      setEditablePt(nextValue);
    }
  };

  const applyInputWithAutoParse = (
    nextText: string,
    forceOverwrite = false,
    explicitScenarioId?: string
  ) => {
    setInput(nextText);
    if (!nextText.trim()) {
      setDetectedOrderSn(null);
      setDetectedAmount(null);
      if (forceOverwrite) {
        setDetectedVoucherTier("");
      }
      if (!manualScenarioLock) {
        setActiveScenarioId(null);
        setActivePathId(null);
      }
      return;
    }

    const parsed = parseShopeeOrderPaste(nextText);
    setDetectedOrderSn(parsed.orderSn ?? null);
    setDetectedAmount(parsed.productAmount ?? null);
    if (parsed.voucherAmount) {
      setDetectedVoucherTier(parsed.voucherAmount);
    } else if (parsed.productAmount || forceOverwrite) {
      setDetectedVoucherTier("");
    }

    if (parsed.carrierName && (forceOverwrite || !carrierName)) {
      setCarrierName(parsed.carrierName);
    }
    if (parsed.trackingNumber && (forceOverwrite || !trackingNumber)) {
      setTrackingNumber(parsed.trackingNumber);
    }
    if (parsed.lastUpdateDate && (forceOverwrite || !lastUpdateDate)) {
      setLastUpdateDate(parsed.lastUpdateDate);
    }
    if (parsed.estimatedDate && (forceOverwrite || !estimatedDate)) {
      setEstimatedDate(parsed.estimatedDate);
    }
    if (parsed.latestStatus && (forceOverwrite || !latestStatus)) {
      setLatestStatus(parsed.latestStatus);
    }
    if (parsed.cxConcern && (forceOverwrite || !issueTopic)) {
      setIssueTopic(parsed.cxConcern);
    }

    const targetScenarioId =
      explicitScenarioId ??
      (manualScenarioLock ? activeScenarioId ?? undefined : parsed.matchedScenarioId);

    if (targetScenarioId) {
      const targetScenario = scenarios.find((s) => s.id === targetScenarioId);
      if (targetScenario?.paths && targetScenario.paths.length > 0) {
        setActiveScenarioId(targetScenario.id);
        const stageMatch = nextText.match(/CX Response Stage:\s*([^\n(]+)/i);
        const matchedStagePath = stageMatch?.[1]
          ? targetScenario.paths.find(
              (p) =>
                p.label.toLowerCase().trim() ===
                stageMatch[1].toLowerCase().trim()
            )
          : undefined;
        const defaultPathId =
          matchedStagePath?.id ??
          detectDefaultPathForScenario(targetScenario.id, nextText, parsed) ??
          targetScenario.paths[0].id;
        if (forceOverwrite || !manualScenarioLock) {
          setActivePathId(defaultPathId);
        }
      } else if (!manualScenarioLock) {
        setActiveScenarioId(null);
        setActivePathId(null);
      }
    } else if (!manualScenarioLock) {
      setActiveScenarioId(null);
      setActivePathId(null);
    }
  };

  useEffect(() => {
    if (prefillInput) {
      setManualScenarioLock(false);
      applyInputWithAutoParse(prefillInput, true);
      onClearPrefill();
    }
  }, [prefillInput, onClearPrefill]);

  useEffect(() => {
    if (loadedReply) {
      setInput(loadedReply.rawInput);
      const parsed = parseShopeeOrderPaste(loadedReply.rawInput);
      setDetectedOrderSn(parsed.orderSn ?? null);
      setDetectedAmount(parsed.productAmount ?? null);
      setDetectedVoucherTier(parsed.voucherAmount ?? "");
      setCarrierName(parsed.carrierName ?? "");
      setTrackingNumber(loadedReply.trackingNumber || parsed.trackingNumber || "");
      setLastUpdateDate(parsed.lastUpdateDate ?? "");
      setEstimatedDate(loadedReply.estimatedDate || parsed.estimatedDate || "");
      setLatestStatus(parsed.latestStatus ?? "");
      setIssueTopic(parsed.cxConcern ?? "");
      setTone(loadedReply.tone);
      setReply(loadedReply.reply);
      setEditablePt(loadedReply.reply.fullPortugueseMessage);

      if (loadedReply.reply.pathReplies?.length) {
        const ptMap: Record<string, string> = {};
        for (const p of loadedReply.reply.pathReplies) {
          ptMap[p.pathId] = p.fullPortugueseMessage;
        }
        setEditedPtByPath(ptMap);
        setOutputPathId(loadedReply.reply.pathReplies[0].pathId);
      } else {
        setEditedPtByPath({});
        setOutputPathId(null);
      }
      setError(null);
    }
  }, [loadedReply]);

  const markCopied = (key: string) => {
    setCopiedId(key);
    window.setTimeout(() => {
      setCopiedId((prev) => (prev === key ? null : prev));
    }, 1800);
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) {
      setError("Enter the order or product info and the customer's concern first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSavedFlag(false);

    try {
      const requestedPaths = activeScenario?.paths?.length
        ? activeScenario.paths.map((p) => ({
            id: p.id,
            label: p.label,
            cxTrigger: p.cxTrigger,
            guidance: p.rows
              .map((r) => `- ${r.section}: ${r.english}`)
              .join("\n"),
          }))
        : undefined;

      const res = await fetch("/api/generate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: trimmed,
          carrierName: carrierName.trim() || undefined,
          trackingNumber: trackingNumber.trim() || undefined,
          lastUpdateDate: lastUpdateDate.trim() || undefined,
          estimatedDate: estimatedDate.trim() || undefined,
          latestStatus: latestStatus.trim() || undefined,
          issueTopic: issueTopic.trim() || undefined,
          productSpec: productSpec.trim() || undefined,
          tone,
          detectedAmount: detectedAmount || undefined,
          voucherTier: detectedVoucherTier.trim() || undefined,
          selectedScenarioTitle: activeScenario?.title || undefined,
          selectedPathLabel: activePath?.label || undefined,
          selectedPathTrigger: activePath?.cxTrigger || undefined,
          selectedPathGuidance: activePath
            ? activePath.rows
                .map((r) => `- ${r.section}: ${r.english}`)
                .join("\n")
            : undefined,
          requestedPaths,
          customStoreRules: storeRules?.map((r) => ({
            topic: r.topic,
            english: r.english,
            portuguese: r.portuguese,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Unable to generate response.");
      }

      const generated = data as GeneratedReply;
      setReply(generated);
      setEditablePt(generated.fullPortugueseMessage);

      if (generated.pathReplies?.length) {
        const ptMap: Record<string, string> = {};
        for (const p of generated.pathReplies) {
          ptMap[p.pathId] = p.fullPortugueseMessage;
        }
        setEditedPtByPath(ptMap);
        const preferred =
          generated.pathReplies.find((p) => p.pathId === activePathId)
            ?.pathId ?? generated.pathReplies[0].pathId;
        setOutputPathId(preferred);
      } else {
        setEditedPtByPath({});
        setOutputPathId(null);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setInput("");
    setCarrierName("");
    setTrackingNumber("");
    setLastUpdateDate("");
    setEstimatedDate("");
    setLatestStatus("");
    setIssueTopic("");
    setProductSpec("");
    setDetectedOrderSn(null);
    setDetectedAmount(null);
    setDetectedVoucherTier("");
    setActiveScenarioId(null);
    setActivePathId(null);
    setManualScenarioLock(false);
    setTone(ToneOption.STANDARD);
    setReply(null);
    setOutputPathId(null);
    setEditedPtByPath({});
    setEditablePt("");
    setError(null);
    setSavedFlag(false);
  };

  const handleCopyFullPt = async () => {
    if (!displayedEditablePt) return;
    const ok = await copyToClipboard(displayedEditablePt);
    if (ok) markCopied("full-pt");
  };

  const handleCopyMarkdownTable = async () => {
    if (!reply || displayedRows.length === 0) return;
    const md = formatRowsAsMarkdownTable(displayedRows);
    const ok = await copyToClipboard(md);
    if (ok) markCopied("md-table");
  };

  const handleCopyRow = async (idx: number, text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) markCopied(`row-${idx}`);
  };

  const handleSave = async () => {
    if (!reply) return;
    if (!isSignedIn) {
      onSignIn();
      return;
    }
    const updatedPathReplies = reply.pathReplies?.map((p) => ({
      ...p,
      fullPortugueseMessage:
        editedPtByPath[p.pathId] ?? p.fullPortugueseMessage,
    }));

    const ok = await onSaveToHistory({
      rawInput: input.trim(),
      trackingNumber: trackingNumber.trim() || undefined,
      estimatedDate: estimatedDate.trim() || undefined,
      tone,
      reply: {
        ...reply,
        policySummary: displayedPolicySummary || reply.policySummary,
        rows: displayedRows.length > 0 ? displayedRows : reply.rows,
        fullPortugueseMessage: displayedEditablePt,
        pathReplies: updatedPathReplies,
      },
    });
    if (ok) {
      setSavedFlag(true);
      window.setTimeout(() => setSavedFlag(false), 2200);
    }
  };

  const quickPresets = [
    scenarios.find((s) => s.id === "s4"),
    scenarios.find((s) => s.id === "s6"),
    scenarios.find((s) => s.id === "s14"),
    scenarios.find((s) => s.id === "s15"),
    scenarios.find((s) => s.id === "s16"),
    scenarios.find((s) => s.id === "s13"),
    scenarios.find((s) => s.id === "s7"),
  ].filter((s): s is ScriptScenario => Boolean(s));

  return (
    <div className="space-y-6">
      {/* Input Form Panel */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              Shopee Brazil Reply Generator
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Paste <span className="font-mono text-xs text-slate-700">Order / Product Info &gt; CX Concern</span> to generate a sentence-by-sentence English and Portuguese response across all CX Response Paths.
            </p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear Form
          </button>
        </div>

        {/* Quick Sample Loaders */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500 mr-1">
            Load example:
          </span>
          {quickPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                setCarrierName("");
                setTrackingNumber("");
                setLastUpdateDate("");
                setEstimatedDate("");
                setLatestStatus("");
                setIssueTopic("");
                setProductSpec("");
                setDetectedVoucherTier("");
                setManualScenarioLock(false);
                applyInputWithAutoParse(preset.sampleInput, true, preset.id);
                setError(null);
              }}
              className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md hover:border-[#EE4D2D] hover:text-[#EE4D2D] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {preset.number}. {preset.title}
            </button>
          ))}
        </div>

        <form onSubmit={handleGenerate} className="mt-4 space-y-4">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <label
                htmlFor="cx-concern-input"
                className="block text-xs font-medium text-slate-700"
              >
                Order / Product Info &gt; Customer Concern (supports full Shopee Seller Center paste)
              </label>
              {(detectedOrderSn ||
                carrierName ||
                trackingNumber ||
                detectedAmount ||
                detectedVoucherTier) && (
                <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                  {[
                    detectedOrderSn ? `Order ${detectedOrderSn}` : null,
                    detectedAmount
                      ? detectedVoucherTier.trim()
                        ? `${detectedAmount} (Offer ${detectedVoucherTier.trim()} Voucher)`
                        : `${detectedAmount} (Escalate >R$25)`
                      : detectedVoucherTier.trim()
                        ? `Voucher ${detectedVoucherTier.trim()}`
                        : null,
                    carrierName || null,
                    trackingNumber || null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              )}
            </div>
            <textarea
              id="cx-concern-input"
              rows={6}
              value={input}
              onChange={(e) => applyInputWithAutoParse(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  void handleGenerate();
                }
              }}
              placeholder="Paste the Shopee Seller Center order + tracking log followed by CX> concern (e.g., CX> when does it arrives?) and any agent notes..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#EE4D2D] focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]/15 transition-colors"
            />
          </div>

          {/* Interactive CX Response Path Selector */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <label
                  htmlFor="generator-path-scenario"
                  className="text-xs font-semibold text-slate-700 whitespace-nowrap"
                >
                  CX Response Path:
                </label>
                <select
                  id="generator-path-scenario"
                  value={activeScenarioId ?? ""}
                  onChange={(e) => {
                    const nextId = e.target.value || null;
                    setManualScenarioLock(Boolean(nextId));
                    setActiveScenarioId(nextId);
                    if (nextId) {
                      const sc = scenarios.find((s) => s.id === nextId);
                      const parsed = parseShopeeOrderPaste(input);
                      setActivePathId(
                        detectDefaultPathForScenario(nextId, input, parsed) ??
                          sc?.paths?.[0]?.id ??
                          null
                      );
                    } else {
                      setActivePathId(null);
                    }
                  }}
                  className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 focus:border-[#EE4D2D] focus:outline-none"
                >
                  <option value="">Auto-detect from customer concern</option>
                  {branchingScenarios.map((s) => (
                    <option key={s.id} value={s.id}>
                      {String(s.number).padStart(2, "0")}. {s.title}
                    </option>
                  ))}
                </select>
              </div>
              {activeScenario && (
                <div className="flex items-center gap-3">
                  {activeScenario.paths && activeScenario.paths.length > 1 && (
                    <span className="text-[11px] font-medium text-[#EE4D2D]">
                      Generates all {activeScenario.paths.length} paths
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setManualScenarioLock(false);
                      setActiveScenarioId(null);
                      setActivePathId(null);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Clear path
                  </button>
                </div>
              )}
            </div>

            {activeScenario?.paths && activeScenario.paths.length > 0 ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  {activeScenario.paths.map((path) => {
                    const isActive = activePath?.id === path.id;
                    return (
                      <button
                        key={path.id}
                        type="button"
                        onClick={() => {
                          setManualScenarioLock(true);
                          setActivePathId(path.id);
                          if (
                            reply?.pathReplies?.some((p) => p.pathId === path.id)
                          ) {
                            setOutputPathId(path.id);
                          }
                        }}
                        className={
                          isActive
                            ? "px-3 py-1.5 text-xs font-medium rounded-lg border border-[#EE4D2D] bg-[#EE4D2D] text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                            : "px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-[#EE4D2D] hover:text-[#EE4D2D] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        }
                      >
                        {path.label}
                      </button>
                    );
                  })}
                </div>
                {activePath?.cxTrigger && (
                  <p className="text-xs text-slate-500">
                    <span className="font-medium text-slate-700">
                      Primary focus stage:{" "}
                    </span>
                    {activePath.cxTrigger}
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-slate-500">
                Paste any order + CX concern or pick a scenario above to generate tailored replies across every CX Response Path.
              </p>
            )}
          </div>

          {/* Order & Script Stats Grid (matches Script Library) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label
                htmlFor="last-update-input"
                className="block text-[11px] font-medium text-slate-500 mb-1"
              >
                Last Update [DATE]
              </label>
              <input
                id="last-update-input"
                type="text"
                value={lastUpdateDate}
                onChange={(e) => setLastUpdateDate(e.target.value)}
                placeholder="03/11/2026"
                className="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-1.5 text-xs tabular-nums text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#EE4D2D] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="est-date-input"
                className="block text-[11px] font-medium text-slate-500 mb-1"
              >
                Est. Delivery [DATE]
              </label>
              <input
                id="est-date-input"
                type="text"
                value={estimatedDate}
                onChange={(e) => setEstimatedDate(e.target.value)}
                placeholder="24/11/2026"
                className="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-1.5 text-xs tabular-nums text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#EE4D2D] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="tracking-input"
                className="block text-[11px] font-medium text-slate-500 mb-1"
              >
                [TRACKING]
              </label>
              <input
                id="tracking-input"
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="AJ261009127752101"
                className="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-1.5 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#EE4D2D] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="status-input"
                className="block text-[11px] font-medium text-slate-500 mb-1"
              >
                [STATUS]
              </label>
              <input
                id="status-input"
                type="text"
                value={latestStatus}
                onChange={(e) => setLatestStatus(e.target.value)}
                placeholder="em trânsito"
                className="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#EE4D2D] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="carrier-input"
                className="block text-[11px] font-medium text-slate-500 mb-1"
              >
                Assigned Courier
              </label>
              <input
                id="carrier-input"
                type="text"
                value={carrierName}
                onChange={(e) => setCarrierName(e.target.value)}
                placeholder="Expresso padrão"
                className="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#EE4D2D] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="topic-input"
                className="block text-[11px] font-medium text-slate-500 mb-1"
              >
                [ISSUE TOPIC]
              </label>
              <input
                id="topic-input"
                type="text"
                value={issueTopic}
                onChange={(e) => setIssueTopic(e.target.value)}
                placeholder="Shopee Coins / Pix"
                className="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#EE4D2D] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="voucher-input"
                className="block text-[11px] font-medium text-slate-500 mb-1"
              >
                [VOUCHER] (≤ R$25 tier)
              </label>
              <input
                id="voucher-input"
                type="text"
                value={detectedVoucherTier}
                onChange={(e) => setDetectedVoucherTier(e.target.value)}
                placeholder="R$15"
                className="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-1.5 text-xs tabular-nums text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#EE4D2D] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="spec-input"
                className="block text-[11px] font-medium text-slate-500 mb-1"
              >
                [INSERT SPEC]
              </label>
              <input
                id="spec-input"
                type="text"
                value={productSpec}
                onChange={(e) => setProductSpec(e.target.value)}
                placeholder="Bivolt 110V/220V"
                className="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#EE4D2D] focus:outline-none"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
            <p className="text-xs text-slate-500">
              Store rules enforced: Shopee Guarantee assurance, no direct store refunds, and{" "}
              <span className="font-medium text-slate-700">Devolução/Reembolso</span> guidance.
            </p>
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="tone-select"
                  className="text-xs font-medium text-slate-600 whitespace-nowrap"
                >
                  Tone:
                </label>
                <select
                  id="tone-select"
                  value={tone}
                  onChange={(e) => setTone(e.target.value as ToneOption)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-900 focus:border-[#EE4D2D] focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]/15"
                >
                  <option value={ToneOption.STANDARD}>Standard Polite</option>
                  <option value={ToneOption.EMPATHETIC}>Extra Empathetic</option>
                  <option value={ToneOption.FIRM}>Firm Policy</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#EE4D2D] hover:bg-[#d94123] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                {isLoading
                  ? "Generating Reply..."
                  : activeScenario?.paths && activeScenario.paths.length > 1
                    ? `Generate All ${activeScenario.paths.length} Paths`
                    : "Generate Bilingual Reply"}
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* Loading Skeleton */}
      {isLoading && (
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div className="h-5 w-56 bg-slate-100 rounded animate-pulse" />
            <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="grid grid-cols-12 gap-4 py-2">
                <div className="col-span-2 h-4 bg-slate-100 rounded animate-pulse" />
                <div className="col-span-5 h-4 bg-slate-100 rounded animate-pulse" />
                <div className="col-span-5 h-4 bg-slate-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {!isLoading && !reply && (
        <section className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <p className="text-sm font-medium text-slate-900">
            Ready for your next customer message
          </p>
          <p className="text-xs text-slate-500 mt-1.5 max-w-lg mx-auto leading-relaxed">
            Paste any order details and customer concern above, or pick an example scenario to test. You will get a sentence-by-sentence English and Portuguese table across every CX Response Path plus a ready-to-paste Shopee Chat reply.
          </p>
        </section>
      )}

      {/* Generated Output Panel */}
      {!isLoading && reply && (
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-medium text-slate-700">{reply.category}</span>
                <span aria-hidden="true">·</span>
                <span>{reply.detectedScenario}</span>
              </div>
              <p className="text-sm text-slate-700 mt-1">{displayedPolicySummary}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyMarkdownTable}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {copiedId === "md-table" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Copied Table
                  </>
                ) : (
                  <>
                    <TableIcon className="w-3.5 h-3.5" />
                    Copy Table
                  </>
                )}
              </button>

              {onOpenInChatFlow && input.trim() && (
                <button
                  type="button"
                  onClick={() => onOpenInChatFlow(input)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:border-[#EE4D2D] hover:text-[#EE4D2D] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Continue in Chat Flow
                </button>
              )}

              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {savedFlag ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Saved
                  </>
                ) : (
                  <>
                    <Bookmark className="w-3.5 h-3.5" />
                    Save Case
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCopyFullPt}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#EE4D2D] hover:bg-[#d94123] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {copiedId === "full-pt" ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Copied Portuguese
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Full Portuguese
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Generated CX Response Path Switcher */}
          {reply.pathReplies && reply.pathReplies.length > 0 && (
            <div className="px-5 sm:px-6 py-3 bg-slate-50/90 border-b border-slate-200 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-700 mr-1 whitespace-nowrap">
                  Generated CX Response Path:
                </span>
                {reply.pathReplies.map((pathItem) => {
                  const isActive = activeGeneratedPath?.pathId === pathItem.pathId;
                  return (
                    <button
                      key={pathItem.pathId}
                      type="button"
                      onClick={() => {
                        setOutputPathId(pathItem.pathId);
                        if (
                          activeScenario?.paths?.some(
                            (p) => p.id === pathItem.pathId
                          )
                        ) {
                          setActivePathId(pathItem.pathId);
                        }
                      }}
                      className={
                        isActive
                          ? "px-3 py-1.5 text-xs font-medium rounded-lg border border-[#EE4D2D] bg-[#EE4D2D] text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          : "px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-[#EE4D2D] hover:text-[#EE4D2D] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      }
                    >
                      {pathItem.pathLabel}
                    </button>
                  );
                })}
              </div>
              {activeGeneratedPath?.cxTrigger && (
                <p className="text-xs text-slate-500">
                  <span className="font-medium text-slate-700">
                    When CX responds:{" "}
                  </span>
                  {activeGeneratedPath.cxTrigger}
                </p>
              )}
            </div>
          )}

          {/* Bilingual Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500">
                  <th className="py-3 px-4 w-40">Section</th>
                  <th className="py-3 px-4 w-[38%]">English (for you)</th>
                  <th className="py-3 px-4 w-[42%]">Portuguese (send to CX)</th>
                  <th className="py-3 px-4 w-20 text-right">Copy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {displayedRows.map((row, idx) => (
                  <tr
                    key={`${activeGeneratedPath?.pathId ?? "main"}-${row.section}-${idx}`}
                    className={
                      row.isKeyRule
                        ? "bg-orange-50/55 hover:bg-orange-50/80 transition-colors"
                        : "hover:bg-slate-50/80 transition-colors"
                    }
                  >
                    <td className="py-3.5 px-4 align-top font-medium text-slate-900 text-xs">
                      <div>{row.section}</div>
                      {row.isKeyRule && (
                        <div className="text-[11px] font-semibold text-[#EE4D2D] mt-0.5">
                          Key store rule
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 align-top text-slate-600 leading-relaxed">
                      {row.english}
                    </td>
                    <td className="py-3.5 px-4 align-top text-slate-900 leading-relaxed">
                      {row.portuguese}
                    </td>
                    <td className="py-3.5 px-4 align-top text-right">
                      <button
                        type="button"
                        onClick={() => void handleCopyRow(idx, row.portuguese)}
                        title="Copy Portuguese sentence"
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded hover:border-[#EE4D2D] hover:text-[#EE4D2D] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {copiedId === `row-${idx}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Editable Full Portuguese Message Preview */}
          <div className="p-5 sm:p-6 bg-slate-50 border-t border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between gap-4">
              <label
                htmlFor="full-pt-preview"
                className="text-xs font-semibold text-slate-700"
              >
                Ready-to-Send Portuguese Message (editable before copying)
              </label>
              <span className="text-xs text-slate-500 tabular-nums">
                {displayedEditablePt.length} chars
              </span>
            </div>
            <textarea
              id="full-pt-preview"
              rows={5}
              value={displayedEditablePt}
              onChange={(e) => updateDisplayedEditablePt(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 leading-relaxed focus:border-[#EE4D2D] focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]/15"
            />
          </div>
        </section>
      )}
    </div>
  );
};
