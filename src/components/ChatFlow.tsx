import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Copy,
  Check,
  Send,
  RotateCcw,
  Table as TableIcon,
  AlertCircle,
  MessageSquare,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Undo2,
  Sparkles,
  Cloud,
  Trash2,
  ExternalLink,
  Keyboard,
} from "lucide-react";
import {
  AiProviderPreference,
  AiStatusInfo,
  ChatFlowChoice,
  ChatFlowSessionEntry,
  ChatFlowTurn,
  ScriptScenario,
  StoreRuleEntry,
  ToneOption,
} from "../types/cs";
import { copyToClipboard, formatRowsAsMarkdownTable } from "../utils/clipboard";
import {
  evaluateDeliveryScheduleStatus,
  getCourierTrackingUrl,
  isGenericExpressCarrier,
  parseShopeeOrderPaste,
  resolveCourierFromTracking,
} from "../utils/shopeeParser";
import { analyzeBrazilianSlangAndTone } from "../../shared/slangToneDetector";
import { formatAiProviderName } from "../utils/aiProviderLabels";
import { AiModelSelector } from "./AiModelSelector";
import { VisualGuideStrip } from "./VisualGuideStrip";

interface ChatFlowProps {
  scenarios: ScriptScenario[];
  storeRules?: StoreRuleEntry[];
  isSignedIn: boolean;
  onSignIn: () => void;
  prefillInput: string;
  onClearPrefill: () => void;
  savedSessions: ChatFlowSessionEntry[];
  onSaveChatFlowSession: (
    existingFlowId: string | null,
    session: {
      title: string;
      orderInput: string;
      trackingNumber?: string;
      carrierName?: string;
      estimatedDate?: string;
      lastUpdateDate?: string;
      latestStatus?: string;
      issueTopic?: string;
      productSpec?: string;
      voucherTier?: string;
      tone: ToneOption;
      turns: ChatFlowTurn[];
    }
  ) => Promise<string | null>;
  onDeleteChatFlowSession: (flowId: string) => Promise<void>;
  onOpenVisualGuides?: () => void;
}

const PROBING_FOCUS_PRESETS = [
  "Ask for short video or photo proof and clarify exact defect/missing part",
  "Offer Option 1 (Keep + Voucher) vs Option 2 (Return & Refund) and ask preference",
  "Ask if CX checked with neighbors, family, or building concierge (porteiro)",
  "Ask how many hours ago payment was made (<24h vs >24h) and method",
  "Ask if Cancel Order button is still visible in Shopee app",
];

export const ChatFlow: React.FC<ChatFlowProps> = ({
  scenarios,
  storeRules,
  isSignedIn,
  onSignIn,
  prefillInput,
  onClearPrefill,
  savedSessions,
  onSaveChatFlowSession,
  onDeleteChatFlowSession,
  onOpenVisualGuides,
}) => {
  const [orderInput, setOrderInput] = useState("");
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

  const [tone, setTone] = useState<ToneOption>(ToneOption.STANDARD);
  const [manualToneLock, setManualToneLock] = useState(false);
  const [aiProvider, setAiProvider] = useState<AiProviderPreference>("auto");
  const [aiModel, setAiModel] = useState("");
  const [aiStatus, setAiStatus] = useState<AiStatusInfo | null>(null);
  const [includeProbingQuestions, setIncludeProbingQuestions] = useState(true);
  const [showOrderStats, setShowOrderStats] = useState(true);

  const [activeFlowId, setActiveFlowId] = useState<string | null>(null);
  const [turns, setTurns] = useState<ChatFlowTurn[]>([]);
  const [editedPtByTurn, setEditedPtByTurn] = useState<Record<string, string>>(
    {}
  );
  const [customCxReply, setCustomCxReply] = useState("");
  const [probingFocus, setProbingFocus] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [cloudFlowSavedBadge, setCloudFlowSavedBadge] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/ai-status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: AiStatusInfo | null) => {
        if (active && data) setAiStatus(data);
      })
      .catch(() => {
        // ignore status check failure
      });
    return () => {
      active = false;
    };
  }, []);

  const slangAnalysis = useMemo(
    () => analyzeBrazilianSlangAndTone(`${orderInput}\n${customCxReply}`),
    [orderInput, customCxReply]
  );

  const scheduleEval = useMemo(
    () =>
      evaluateDeliveryScheduleStatus({
        rawText: orderInput,
        estimatedDate,
        lastUpdateDate,
      }),
    [orderInput, estimatedDate, lastUpdateDate]
  );

  const trackingLink = useMemo(
    () => getCourierTrackingUrl(trackingNumber, carrierName),
    [trackingNumber, carrierName]
  );

  const applyOrderInputWithAutoParse = (
    nextText: string,
    forceOverwrite = false
  ) => {
    setOrderInput(nextText);
    if (!nextText.trim()) {
      setDetectedOrderSn(null);
      setDetectedAmount(null);
      if (forceOverwrite) {
        setDetectedVoucherTier("");
      }
      if (!manualToneLock) {
        setTone(ToneOption.STANDARD);
      }
      return;
    }

    if (!manualToneLock) {
      const nextSlang = analyzeBrazilianSlangAndTone(nextText);
      if (nextSlang.recommendedTone === "Extra Empathetic") {
        setTone(ToneOption.EMPATHETIC);
      } else {
        setTone(ToneOption.STANDARD);
      }
    }

    const parsed = parseShopeeOrderPaste(nextText);
    setDetectedOrderSn(parsed.orderSn ?? null);
    setDetectedAmount(parsed.productAmount ?? null);
    if (parsed.voucherAmount) {
      setDetectedVoucherTier(parsed.voucherAmount);
    } else if (parsed.productAmount || forceOverwrite) {
      setDetectedVoucherTier("");
    }

    if (
      parsed.carrierName &&
      (forceOverwrite || !carrierName || isGenericExpressCarrier(carrierName))
    ) {
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
  };

  useEffect(() => {
    if (prefillInput) {
      setActiveFlowId(null);
      setTurns([]);
      setEditedPtByTurn({});
      applyOrderInputWithAutoParse(prefillInput, true);
      onClearPrefill();
    }
  }, [prefillInput, onClearPrefill]);

  const markCopied = (key: string) => {
    setCopiedId(key);
    window.setTimeout(() => {
      setCopiedId((prev) => (prev === key ? null : prev));
    }, 1800);
  };

  const requestNextTurn = async ({
    cxLabel,
    cxMessage,
    baseTurns,
  }: {
    cxLabel: string;
    cxMessage: string;
    baseTurns: ChatFlowTurn[];
  }) => {
    const trimmedOrder = orderInput.trim();
    const trimmedCx = cxMessage.trim();
    if (!trimmedOrder && !trimmedCx) {
      setError("Paste order details or a customer message first.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const conversationHistory = baseTurns.flatMap((t) => [
        { role: "cx" as const, text: t.cxMessage },
        {
          role: "agent" as const,
          text: editedPtByTurn[t.id] ?? t.fullPortugueseMessage,
        },
      ]);

      const res = await fetch("/api/chat-flow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderContext: trimmedOrder,
          latestCxMessage: trimmedCx || trimmedOrder,
          conversationHistory,
          includeProbingQuestions,
          probingFocus: probingFocus.trim() || undefined,
          carrierName: carrierName.trim() || undefined,
          trackingNumber: trackingNumber.trim() || undefined,
          lastUpdateDate: lastUpdateDate.trim() || undefined,
          estimatedDate: estimatedDate.trim() || undefined,
          latestStatus: latestStatus.trim() || undefined,
          issueTopic: issueTopic.trim() || undefined,
          productSpec: productSpec.trim() || undefined,
          tone,
          aiProvider,
          aiModel: aiModel.trim() || undefined,
          slangToneHint:
            analyzeBrazilianSlangAndTone(
              `${trimmedOrder}\n${trimmedCx}`
            ).promptHint || undefined,
          detectedAmount: detectedAmount || undefined,
          voucherTier: detectedVoucherTier.trim() || undefined,
          customStoreRules: storeRules?.map((r) => ({
            topic: r.topic,
            english: r.english,
            portuguese: r.portuguese,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Unable to generate next Chat Flow turn.");
      }

      const turnId = `turn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newTurn: ChatFlowTurn = {
        id: turnId,
        turnNumber: baseTurns.length + 1,
        cxLabel,
        cxMessage: trimmedCx || trimmedOrder,
        detectedScenario: data.detectedScenario,
        category: data.category,
        policySummary: data.policySummary,
        rows: Array.isArray(data.rows) ? data.rows : [],
        probingQuestions: Array.isArray(data.probingQuestions)
          ? data.probingQuestions
          : [],
        nextChoices: Array.isArray(data.nextChoices) ? data.nextChoices : [],
        fullEnglishMessage: data.fullEnglishMessage || "",
        fullPortugueseMessage: data.fullPortugueseMessage || "",
        suggestedGuideIds: Array.isArray(data.suggestedGuideIds)
          ? (data.suggestedGuideIds as string[])
          : undefined,
        aiMeta: data.aiMeta,
      };

      const nextTurns = [...baseTurns, newTurn];
      const nextEditedMap = {
        ...editedPtByTurn,
        [turnId]: newTurn.fullPortugueseMessage,
      };
      setTurns(nextTurns);
      setEditedPtByTurn(nextEditedMap);
      setCustomCxReply("");
      setProbingFocus("");
      if (baseTurns.length === 0) {
        setShowOrderStats(false);
      }

      if (isSignedIn) {
        const flowTitle =
          [detectedOrderSn ? `Order ${detectedOrderSn}` : null, newTurn.detectedScenario]
            .filter(Boolean)
            .join(" · ") || "Chat Flow Session";
        const turnsWithEdits = nextTurns.map((t) => ({
          ...t,
          ...(nextEditedMap[t.id] ? { editedPortuguese: nextEditedMap[t.id] } : {}),
        }));
        const flowTargetId = baseTurns.length === 0 ? null : activeFlowId;
        void onSaveChatFlowSession(flowTargetId, {
          title: flowTitle,
          orderInput: trimmedOrder || trimmedCx,
          trackingNumber: trackingNumber.trim() || undefined,
          carrierName: carrierName.trim() || undefined,
          estimatedDate: estimatedDate.trim() || undefined,
          lastUpdateDate: lastUpdateDate.trim() || undefined,
          latestStatus: latestStatus.trim() || undefined,
          issueTopic: issueTopic.trim() || undefined,
          productSpec: productSpec.trim() || undefined,
          voucherTier: detectedVoucherTier.trim() || undefined,
          tone,
          turns: turnsWithEdits,
        })
          .then((savedId) => {
            if (savedId) {
              setActiveFlowId(savedId);
              setCloudFlowSavedBadge(true);
              window.setTimeout(() => setCloudFlowSavedBadge(false), 1800);
            }
          })
          .catch((syncErr: unknown) => {
            console.warn("Unable to sync Chat Flow session:", syncErr);
          });
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unexpected Chat Flow error.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartFlow = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsed = parseShopeeOrderPaste(orderInput);
    const initialCx =
      parsed.cxConcern ||
      orderInput.trim();
    await requestNextTurn({
      cxLabel: "Initial Customer Inquiry",
      cxMessage: initialCx,
      baseTurns: [],
    });
  };

  const handleSelectChoice = async (choice: ChatFlowChoice) => {
    await requestNextTurn({
      cxLabel: choice.label,
      cxMessage: choice.cxMessage,
      baseTurns: turns,
    });
  };

  const handleSendCustomCx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCxReply.trim()) {
      setError("Enter or paste what the customer replied, or pick a choice above.");
      return;
    }
    await requestNextTurn({
      cxLabel: "Custom CX Reply",
      cxMessage: customCxReply.trim(),
      baseTurns: turns,
    });
  };

  const handleUndoTurn = () => {
    if (turns.length === 0) return;
    const removed = turns[turns.length - 1];
    setTurns((prev) => prev.slice(0, -1));
    setEditedPtByTurn((prev) => {
      const next = { ...prev };
      delete next[removed.id];
      return next;
    });
    setError(null);
  };

  const handleResetAll = () => {
    setActiveFlowId(null);
    setOrderInput("");
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
    setTone(ToneOption.STANDARD);
    setManualToneLock(false);
    setTurns([]);
    setEditedPtByTurn({});
    setCustomCxReply("");
    setProbingFocus("");
    setShowOrderStats(true);
    setError(null);
  };

  const handleLoadSession = (session: ChatFlowSessionEntry) => {
    setActiveFlowId(session.id);
    setOrderInput(session.orderInput);
    const parsed = parseShopeeOrderPaste(session.orderInput);
    setDetectedOrderSn(parsed.orderSn ?? null);
    setDetectedAmount(parsed.productAmount ?? null);
    const resolvedTracking = session.trackingNumber || parsed.trackingNumber || "";
    setTrackingNumber(resolvedTracking);
    setCarrierName(
      resolveCourierFromTracking(
        resolvedTracking,
        session.carrierName || parsed.carrierName
      ) || ""
    );
    setLastUpdateDate(session.lastUpdateDate || parsed.lastUpdateDate || "");
    setEstimatedDate(session.estimatedDate || parsed.estimatedDate || "");
    setLatestStatus(session.latestStatus || parsed.latestStatus || "");
    setIssueTopic(session.issueTopic || parsed.cxConcern || "");
    setProductSpec(session.productSpec || "");
    setDetectedVoucherTier(session.voucherTier || parsed.voucherAmount || "");
    setTone(session.tone);
    setTurns(session.turns);
    const nextEdits: Record<string, string> = {};
    session.turns.forEach((t) => {
      nextEdits[t.id] = t.editedPortuguese || t.fullPortugueseMessage;
    });
    setEditedPtByTurn(nextEdits);
    setShowOrderStats(false);
    setError(null);
  };

  const handleManualSyncFlow = async () => {
    if (!isSignedIn) {
      onSignIn();
      return;
    }
    if (turns.length === 0) return;
    const flowTitle =
      [detectedOrderSn ? `Order ${detectedOrderSn}` : null, turns[turns.length - 1]?.detectedScenario]
        .filter(Boolean)
        .join(" · ") || "Chat Flow Session";
    const turnsWithEdits = turns.map((t) => ({
      ...t,
      ...(editedPtByTurn[t.id] ? { editedPortuguese: editedPtByTurn[t.id] } : {}),
    }));
    const savedId = await onSaveChatFlowSession(activeFlowId, {
      title: flowTitle,
      orderInput: orderInput.trim() || turns[0].cxMessage,
      trackingNumber: trackingNumber.trim() || undefined,
      carrierName: carrierName.trim() || undefined,
      estimatedDate: estimatedDate.trim() || undefined,
      lastUpdateDate: lastUpdateDate.trim() || undefined,
      latestStatus: latestStatus.trim() || undefined,
      issueTopic: issueTopic.trim() || undefined,
      productSpec: productSpec.trim() || undefined,
      voucherTier: detectedVoucherTier.trim() || undefined,
      tone,
      turns: turnsWithEdits,
    });
    if (savedId) {
      setActiveFlowId(savedId);
      setCloudFlowSavedBadge(true);
      window.setTimeout(() => setCloudFlowSavedBadge(false), 1800);
    }
  };

  const quickPresets = useMemo(
    () =>
      ["s4", "s6", "s15", "s16", "s5", "s13", "s2"]
        .map((id) => scenarios.find((s) => s.id === id))
        .filter((s): s is ScriptScenario => Boolean(s)),
    [scenarios]
  );

  const latestTurn = turns.length > 0 ? turns[turns.length - 1] : null;

  const shortcutCtxRef = useRef({ latestTurn, editedPtByTurn });
  shortcutCtxRef.current = { latestTurn, editedPtByTurn };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.altKey &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey &&
        (e.code === "KeyC" || e.key.toLowerCase() === "c")
      ) {
        const { latestTurn: curTurn, editedPtByTurn: ptMap } =
          shortcutCtxRef.current;
        if (!curTurn) return;
        const textToCopy = ptMap[curTurn.id] ?? curTurn.fullPortugueseMessage;
        if (!textToCopy) return;
        e.preventDefault();
        void copyToClipboard(textToCopy).then((ok) => {
          if (ok) markCopied(`${curTurn.id}-full`);
        });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="space-y-6">
      {/* Order Context & Chat Flow Launcher */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Interactive Chat Flow (Probing Questions &amp; Choices)
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Start with an order + customer message to generate guided bilingual replies with clarifying probing questions and clickable CX response choices.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {latestTurn && (
              <span className="hidden xl:inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mr-1">
                <Keyboard className="w-3.5 h-3.5" />
                <kbd className="px-1.5 py-0.5 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded">
                  Alt+C
                </kbd>{" "}
                Copy Latest PT
              </span>
            )}
            {turns.length > 0 && (
              <button
                type="button"
                onClick={() => void handleManualSyncFlow()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-[#EE4D2D] hover:text-[#EE4D2D] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {cloudFlowSavedBadge ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Synced to Cloud
                  </>
                ) : (
                  <>
                    <Cloud className="w-3.5 h-3.5" />
                    {isSignedIn ? "Sync Flow" : "Sign In to Sync"}
                  </>
                )}
              </button>
            )}
            {turns.length > 0 && (
              <button
                type="button"
                onClick={() => setShowOrderStats((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {showOrderStats ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    Hide Case Setup
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    Edit Case Context
                  </>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={handleResetAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Flow
            </button>
          </div>
        </div>

        {/* Cloud Saved Chat Flow Sessions Bar */}
        {isSignedIn && savedSessions.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                <Cloud className="w-3.5 h-3.5 text-[#EE4D2D]" />
                Saved Cloud Chat Flows ({savedSessions.length})
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Resume across any PC
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {savedSessions.slice(0, 6).map((session) => {
                const isActive = activeFlowId === session.id;
                return (
                  <div
                    key={session.id}
                    className={`inline-flex items-center rounded-lg border text-xs ${
                      isActive
                        ? "border-[#EE4D2D] bg-orange-50/70 dark:bg-[#EE4D2D]/15 text-slate-900 dark:text-slate-100"
                        : "border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleLoadSession(session)}
                      className="px-2.5 py-1.5 font-medium hover:text-[#EE4D2D] transition-colors cursor-pointer"
                    >
                      {session.title} ({session.turns.length}t)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (activeFlowId === session.id) {
                          setActiveFlowId(null);
                        }
                        void onDeleteChatFlowSession(session.id);
                      }}
                      title="Delete Chat Flow session"
                      className="pr-2 pl-1 py-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Compact detected summary when collapsed */}
        {!showOrderStats &&
          (detectedOrderSn || carrierName || trackingNumber || detectedAmount) && (
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono text-slate-600 dark:text-slate-400 tabular-nums">
              <span>
                {[
                  detectedOrderSn ? `Order ${detectedOrderSn}` : null,
                  detectedAmount
                    ? detectedVoucherTier.trim()
                      ? `${detectedAmount} (Offer ${detectedVoucherTier.trim()} Voucher)`
                      : `${detectedAmount} (Escalate >R$25)`
                    : null,
                  carrierName || null,
                  trackingNumber || null,
                  estimatedDate ? `Est. ${estimatedDate}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
              {trackingLink && (
                <a
                  href={trackingLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-sans text-xs font-medium text-[#EE4D2D] hover:underline whitespace-nowrap"
                >
                  Track {trackingLink.courier}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

        {showOrderStats && (
          <>
            {/* Quick Sample Loaders */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1">
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
                    setTurns([]);
                    setEditedPtByTurn({});
                    applyOrderInputWithAutoParse(preset.sampleInput, true);
                    setError(null);
                  }}
                  className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:border-[#EE4D2D] hover:text-[#EE4D2D] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {preset.number}. {preset.title}
                </button>
              ))}
            </div>

            <form onSubmit={handleStartFlow} className="mt-4 space-y-4">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <label
                    htmlFor="chatflow-order-input"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    Order / Product Info &gt; Opening Customer Concern
                  </label>
                  {(detectedOrderSn ||
                    carrierName ||
                    trackingNumber ||
                    detectedAmount ||
                    detectedVoucherTier) && (
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
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
                  id="chatflow-order-input"
                  rows={5}
                  value={orderInput}
                  onChange={(e) => applyOrderInputWithAutoParse(e.target.value)}
                  placeholder="Paste the Shopee Seller Center order + tracking log followed by CX> concern..."
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/70 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-[#EE4D2D] focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]/15 transition-colors"
                />
                {(slangAnalysis.hasSignals ||
                  !scheduleEval.isWithin5to14Schedule ||
                  estimatedDate.trim()) && (
                  <div className="mt-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="space-y-0.5 text-slate-600 dark:text-slate-300">
                      {slangAnalysis.hasSignals && (
                        <div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            Tone &amp; BR Slang:{" "}
                          </span>
                          <span
                            className={
                              slangAnalysis.mood === "High-Risk / Frustrated"
                                ? "font-medium text-red-700 dark:text-red-400"
                                : slangAnalysis.mood === "Anxious / Impatient"
                                  ? "font-medium text-amber-700 dark:text-amber-400"
                                  : "text-slate-700 dark:text-slate-300"
                            }
                          >
                            {slangAnalysis.summaryNote}
                          </span>
                        </div>
                      )}
                      {(estimatedDate.trim() || !scheduleEval.isWithin5to14Schedule) && (
                        <div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            Assurance Rule:{" "}
                          </span>
                          {scheduleEval.isWithin5to14Schedule ? (
                            <span className="text-emerald-700 dark:text-emerald-400">
                              Within 5–14d schedule · Reassure 5–14 days + Shopee Guarantee
                            </span>
                          ) : (
                            <span className="text-amber-700 dark:text-amber-400 font-medium">
                              Past 5–14d / Past EDD · 5–14 days suppressed · Lead with Empathy + Courier Follow-Up
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {slangAnalysis.recommendedTone === "Extra Empathetic" &&
                      tone !== ToneOption.EMPATHETIC && (
                        <button
                          type="button"
                          onClick={() => {
                            setTone(ToneOption.EMPATHETIC);
                            setManualToneLock(true);
                          }}
                          className="px-2.5 py-1 text-xs font-medium text-[#EE4D2D] bg-white dark:bg-slate-900 border border-[#EE4D2D]/50 rounded-md hover:bg-orange-50 dark:hover:bg-[#EE4D2D]/15 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Apply Extra Empathetic
                        </button>
                      )}
                  </div>
                )}
              </div>

              {/* 8-field Order & Script Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label
                    htmlFor="cf-last-update"
                    className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1"
                  >
                    Last Update [DATE]
                  </label>
                  <input
                    id="cf-last-update"
                    type="text"
                    value={lastUpdateDate}
                    onChange={(e) => setLastUpdateDate(e.target.value)}
                    placeholder="03/11/2026"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/70 px-2.5 py-1.5 text-xs tabular-nums text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-[#EE4D2D] focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="cf-est-date"
                    className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1"
                  >
                    Est. Delivery [DATE]
                  </label>
                  <input
                    id="cf-est-date"
                    type="text"
                    value={estimatedDate}
                    onChange={(e) => setEstimatedDate(e.target.value)}
                    placeholder="24/11/2026"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/70 px-2.5 py-1.5 text-xs tabular-nums text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-[#EE4D2D] focus:outline-none"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <label
                      htmlFor="cf-tracking"
                      className="block text-[11px] font-medium text-slate-500 dark:text-slate-400"
                    >
                      [TRACKING]
                    </label>
                    {trackingLink && (
                      <a
                        href={trackingLink.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-[#EE4D2D] hover:underline whitespace-nowrap"
                      >
                        Track {trackingLink.courier}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <input
                    id="cf-tracking"
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => {
                      const nextTracking = e.target.value;
                      setTrackingNumber(nextTracking);
                      const autoCouriers = ["SPX", "Anjun Express", "Correios"];
                      if (
                        !carrierName.trim() ||
                        isGenericExpressCarrier(carrierName) ||
                        autoCouriers.includes(carrierName.trim())
                      ) {
                        const resolved = resolveCourierFromTracking(nextTracking);
                        if (resolved) setCarrierName(resolved);
                      }
                    }}
                    placeholder="AJ261009127752101"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/70 px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-[#EE4D2D] focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="cf-status"
                    className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1"
                  >
                    [STATUS]
                  </label>
                  <input
                    id="cf-status"
                    type="text"
                    value={latestStatus}
                    onChange={(e) => setLatestStatus(e.target.value)}
                    placeholder="em trânsito"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/70 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-[#EE4D2D] focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="cf-carrier"
                    className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1"
                  >
                    Assigned Courier
                  </label>
                  <input
                    id="cf-carrier"
                    type="text"
                    value={carrierName}
                    onChange={(e) => setCarrierName(e.target.value)}
                    placeholder="SPX / Anjun Express / Correios"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/70 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-[#EE4D2D] focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="cf-topic"
                    className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1"
                  >
                    [ISSUE TOPIC]
                  </label>
                  <input
                    id="cf-topic"
                    type="text"
                    value={issueTopic}
                    onChange={(e) => setIssueTopic(e.target.value)}
                    placeholder="Shopee Coins / Pix"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/70 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-[#EE4D2D] focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="cf-voucher"
                    className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1"
                  >
                    [VOUCHER] (≤ R$25 tier)
                  </label>
                  <input
                    id="cf-voucher"
                    type="text"
                    value={detectedVoucherTier}
                    onChange={(e) => setDetectedVoucherTier(e.target.value)}
                    placeholder="R$15"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/70 px-2.5 py-1.5 text-xs tabular-nums text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-[#EE4D2D] focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="cf-spec"
                    className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1"
                  >
                    [INSERT SPEC]
                  </label>
                  <input
                    id="cf-spec"
                    type="text"
                    value={productSpec}
                    onChange={(e) => setProductSpec(e.target.value)}
                    placeholder="Bivolt 110V/220V"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/70 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-[#EE4D2D] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
                <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeProbingQuestions}
                    onChange={(e) =>
                      setIncludeProbingQuestions(e.target.checked)
                    }
                    className="rounded border-slate-300 dark:border-slate-600 text-[#EE4D2D] focus:ring-[#EE4D2D]"
                  />
                  Include clarifying probing questions &amp; CX choices on every turn
                </label>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <AiModelSelector
                    idPrefix="cf"
                    aiProvider={aiProvider}
                    aiModel={aiModel}
                    aiStatus={aiStatus}
                    onChangeProvider={setAiProvider}
                    onChangeModel={setAiModel}
                  />
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="cf-tone"
                      className="text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap"
                    >
                      Tone:
                    </label>
                    <select
                      id="cf-tone"
                      value={tone}
                      onChange={(e) => {
                        setTone(e.target.value as ToneOption);
                        setManualToneLock(true);
                      }}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 focus:border-[#EE4D2D] focus:outline-none"
                    >
                      <option value={ToneOption.STANDARD}>Standard Polite</option>
                      <option value={ToneOption.EMPATHETIC}>
                        Extra Empathetic
                      </option>
                      <option value={ToneOption.FIRM}>Firm Policy</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#EE4D2D] hover:bg-[#d94123] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {isLoading
                      ? "Generating Turn..."
                      : turns.length > 0
                        ? "Restart Chat Flow"
                        : "Start Chat Flow"}
                  </button>
                </div>
              </div>
            </form>
          </>
        )}
      </section>

      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-200 dark:border-red-900/70 bg-red-50 dark:bg-red-950/50 px-4 py-3 text-xs text-red-800 dark:text-red-300">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Conversation Turns Thread */}
      {turns.map((turn) => {
        const editedPt = editedPtByTurn[turn.id] ?? turn.fullPortugueseMessage;
        return (
          <section
            key={turn.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden"
          >
            {/* CX Turn Banner */}
            <div className="px-5 sm:px-6 py-3.5 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono font-semibold text-[#EE4D2D] tabular-nums">
                    TURN {String(turn.turnNumber).padStart(2, "0")}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500" aria-hidden="true">
                    ·
                  </span>
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    {turn.cxLabel}
                  </span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {turn.category} · {turn.detectedScenario}
                  {turn.aiMeta && (
                    <>
                      {" · "}
                      {formatAiProviderName(turn.aiMeta.provider)} ({turn.aiMeta.model})
                    </>
                  )}
                </span>
              </div>
              <p className="mt-1.5 text-sm text-slate-900 dark:text-slate-100">{turn.cxMessage}</p>
            </div>

            {/* Agent Reply Header & Actions */}
            <div className="px-5 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <p className="text-xs text-slate-600 dark:text-slate-400">{turn.policySummary}</p>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await copyToClipboard(
                      formatRowsAsMarkdownTable(turn.rows)
                    );
                    if (ok) markCopied(`${turn.id}-table`);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {copiedId === `${turn.id}-table` ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Copied Table
                    </>
                  ) : (
                    <>
                      <TableIcon className="w-3.5 h-3.5" />
                      Copy Table
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const ok = await copyToClipboard(editedPt);
                    if (ok) markCopied(`${turn.id}-full`);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#EE4D2D] hover:bg-[#d94123] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {copiedId === `${turn.id}-full` ? (
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

            {/* Bilingual Breakdown Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <th className="py-2.5 px-4 w-40">Section</th>
                    <th className="py-2.5 px-4 w-[38%]">English (for you)</th>
                    <th className="py-2.5 px-4 w-[42%]">Portuguese (send to CX)</th>
                    <th className="py-2.5 px-4 w-20 text-right">Copy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                  {turn.rows.map((row, idx) => {
                    const isProbingRow = /probing|question|clarif/i.test(
                      row.section
                    );
                    return (
                      <tr
                        key={`${turn.id}-row-${idx}`}
                        className={
                          row.isKeyRule
                            ? "bg-orange-50/55 dark:bg-[#EE4D2D]/12 hover:bg-orange-50/80 dark:hover:bg-[#EE4D2D]/20 transition-colors"
                            : isProbingRow
                              ? "bg-slate-50/80 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-colors"
                              : "hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                        }
                      >
                        <td className="py-3 px-4 align-top font-medium text-slate-900 dark:text-slate-100 text-xs">
                          <div>{row.section}</div>
                          {row.isKeyRule && (
                            <div className="text-[11px] font-semibold text-[#EE4D2D] mt-0.5">
                              Key store rule
                            </div>
                          )}
                          {!row.isKeyRule && isProbingRow && (
                            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                              Probing question
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 align-top text-slate-600 dark:text-slate-400 leading-relaxed">
                          {row.english}
                        </td>
                        <td className="py-3 px-4 align-top text-slate-900 dark:text-slate-100 leading-relaxed">
                          {row.portuguese}
                        </td>
                        <td className="py-3 px-4 align-top text-right">
                          <button
                            type="button"
                            onClick={async () => {
                              const ok = await copyToClipboard(row.portuguese);
                              if (ok) markCopied(`${turn.id}-row-${idx}`);
                            }}
                            title="Copy Portuguese sentence"
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded hover:border-[#EE4D2D] hover:text-[#EE4D2D] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            {copiedId === `${turn.id}-row-${idx}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Clarifying Probing Questions Highlight */}
            {turn.probingQuestions.length > 0 && (
              <div className="px-5 sm:px-6 py-4 bg-slate-50/70 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <HelpCircle className="w-3.5 h-3.5 text-[#EE4D2D]" />
                  Probing Questions Included to Guide CX
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {turn.probingQuestions.map((pq, idx) => (
                    <div
                      key={`${turn.id}-pq-${idx}`}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1 text-xs">
                        <p className="text-slate-600 dark:text-slate-400">{pq.english}</p>
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {pq.portuguese}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          const ok = await copyToClipboard(pq.portuguese);
                          if (ok) markCopied(`${turn.id}-pq-${idx}`);
                        }}
                        title="Copy PT-BR probing question"
                        className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-[#EE4D2D] border border-slate-200 dark:border-slate-700 rounded hover:border-[#EE4D2D] shrink-0 cursor-pointer"
                      >
                        {copiedId === `${turn.id}-pq-${idx}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Editable PT-BR Message */}
            <div className="px-5 sm:px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between gap-4">
                <label
                  htmlFor={`pt-msg-${turn.id}`}
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Ready-to-Send Portuguese Message (Turn {turn.turnNumber})
                </label>
                <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  {editedPt.length} chars
                </span>
              </div>
              <textarea
                id={`pt-msg-${turn.id}`}
                rows={4}
                value={editedPt}
                onChange={(e) =>
                  setEditedPtByTurn((prev) => ({
                    ...prev,
                    [turn.id]: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 leading-relaxed focus:border-[#EE4D2D] focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]/15"
              />
            </div>

            <VisualGuideStrip
              guideIds={turn.suggestedGuideIds}
              onBrowseAll={onOpenVisualGuides}
            />
          </section>
        );
      })}

      {/* Loading Skeleton */}
      {isLoading && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="h-5 w-64 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
            <div className="h-4 w-28 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="grid grid-cols-12 gap-4 py-2">
                <div className="col-span-2 h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                <div className="col-span-5 h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                <div className="col-span-5 h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Next CX Choices & Continue Chat Flow Panel */}
      {!isLoading && latestTurn && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Next CX Choices — How did the customer reply?
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tap a predicted CX choice below or paste the customer&apos;s actual Shopee Chat reply to generate the next turn.
              </p>
            </div>
            <button
              type="button"
              onClick={handleUndoTurn}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
              Undo Turn {latestTurn.turnNumber}
            </button>
          </div>

          {/* Interactive Next Choices */}
          {latestTurn.nextChoices.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {latestTurn.nextChoices.map((choice) => (
                <button
                  key={choice.id}
                  type="button"
                  onClick={() => void handleSelectChoice(choice)}
                  className="text-left p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 hover:bg-orange-50/60 dark:hover:bg-[#EE4D2D]/15 hover:border-[#EE4D2D] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-[#EE4D2D]">
                      {choice.label}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 group-hover:text-[#EE4D2D] shrink-0">
                      Select →
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {choice.cxMessage}
                  </p>
                </button>
              ))}
            </div>
          )}

          {/* Optional Probing Question Steering for Next Turn */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-[#EE4D2D]" />
              <span>Optional: Steer the next probing question</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PROBING_FOCUS_PRESETS.map((preset) => {
                const isSelected = probingFocus === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() =>
                      setProbingFocus((prev) => (prev === preset ? "" : preset))
                    }
                    className={
                      isSelected
                        ? "px-2.5 py-1 text-[11px] font-medium rounded-md border border-[#EE4D2D] bg-[#EE4D2D] text-white transition-colors cursor-pointer"
                        : "px-2.5 py-1 text-[11px] font-medium rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-[#EE4D2D] hover:text-[#EE4D2D] transition-colors cursor-pointer"
                    }
                  >
                    {preset}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom CX Reply Box */}
          <form
            onSubmit={handleSendCustomCx}
            className="flex flex-col sm:flex-row gap-2.5 pt-1"
          >
            <input
              type="text"
              value={customCxReply}
              onChange={(e) => setCustomCxReply(e.target.value)}
              placeholder="Or type/paste CX's exact message (e.g., 'Já paguei faz 2 dias no Pix', 'O porteiro disse que não chegou')..."
              className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/70 px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-[#EE4D2D] focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]/15"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#EE4D2D] hover:bg-[#d94123] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Generate Next Turn
            </button>
          </form>
        </section>
      )}
    </div>
  );
};
