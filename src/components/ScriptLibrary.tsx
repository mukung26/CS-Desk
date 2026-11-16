import React, { useState, useMemo } from "react";
import {
  Copy,
  Check,
  ArrowUpRight,
  Plus,
  X,
  Trash2,
  RotateCcw,
  Pencil,
  Cloud,
} from "lucide-react";
import {
  ScenarioCategory,
  ScriptPath,
  ScriptRow,
  ScriptScenario,
  UsageTrackEventPayload,
} from "../types/cs";
import {
  PlaceholderValues,
  applyPlaceholders,
  copyToClipboard,
  formatRowsAsMarkdownTable,
} from "../utils/clipboard";
import {
  detectDefaultPathForScenario,
  parseShopeeOrderPaste,
} from "../utils/shopeeParser";
import { VisualGuideStrip } from "./VisualGuideStrip";

interface ScriptLibraryProps {
  scenarios: ScriptScenario[];
  selectedScenarioId: string | null;
  isSignedIn: boolean;
  isSyncing?: boolean;
  onSignIn: () => void;
  onSelectScenario: (id: string | null) => void;
  onUseInGenerator: (sampleInput: string) => void;
  onTrackUsageEvents?: (events: UsageTrackEventPayload[]) => Promise<void> | void;
  onAddCustomScenario: (
    scenario: Omit<ScriptScenario, "id" | "number">
  ) => void | Promise<void>;
  onUpdateCustomScenario: (
    id: string,
    scenario: Omit<ScriptScenario, "id" | "number">
  ) => void | Promise<void>;
  onDeleteCustomScenario: (id: string) => void | Promise<void>;
  onResetDefaultScripts?: () => void | Promise<void>;
  onOpenVisualGuides?: () => void;
}

export const ScriptLibrary: React.FC<ScriptLibraryProps> = ({
  scenarios,
  selectedScenarioId,
  isSignedIn,
  isSyncing,
  onSignIn,
  onSelectScenario,
  onUseInGenerator,
  onTrackUsageEvents,
  onAddCustomScenario,
  onUpdateCustomScenario,
  onDeleteCustomScenario,
  onResetDefaultScripts,
  onOpenVisualGuides,
}) => {
  const [pasteInput, setPasteInput] = useState("");
  const [detectedOrderSn, setDetectedOrderSn] = useState<string | null>(null);
  const [detectedAmount, setDetectedAmount] = useState<string | null>(null);
  const [matchedScenarioId, setMatchedScenarioId] = useState<string | null>(
    null
  );
  const [autoFocusMatched, setAutoFocusMatched] = useState(true);

  const [placeholders, setPlaceholders] = useState<PlaceholderValues>({
    date: "",
    lastUpdateDate: "",
    estimatedDate: "",
    tracking: "",
    carrier: "",
    voucher: "",
    status: "",
    topic: "",
    spec: "",
  });

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingScenarioId, setEditingScenarioId] = useState<string | null>(
    null
  );
  const [isSavingScript, setIsSavingScript] = useState(false);
  const [activePathByScenario, setActivePathByScenario] = useState<
    Record<string, string>
  >({});

  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<ScenarioCategory>(
    ScenarioCategory.GENERAL
  );
  const [newWhenToUse, setNewWhenToUse] = useState("");
  const [newPolicyRule, setNewPolicyRule] = useState("");
  const [newSampleInput, setNewSampleInput] = useState("");
  const [newRows, setNewRows] = useState<ScriptRow[]>([
    { section: "Greeting", english: "", portuguese: "", highlight: false },
    { section: "Main Reply", english: "", portuguese: "", highlight: true },
    { section: "Closing", english: "", portuguese: "", highlight: false },
  ]);

  const markCopied = (key: string) => {
    setCopiedKey(key);
    window.setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 1800);
  };

  const handlePasteChange = (nextText: string) => {
    setPasteInput(nextText);
    if (!nextText.trim()) {
      setDetectedOrderSn(null);
      setDetectedAmount(null);
      setMatchedScenarioId(null);
      return;
    }

    const parsed = parseShopeeOrderPaste(nextText);
    setDetectedOrderSn(parsed.orderSn ?? null);
    setDetectedAmount(parsed.productAmount ?? null);
    setMatchedScenarioId(parsed.matchedScenarioId ?? null);

    setPlaceholders((prev) => ({
      ...prev,
      lastUpdateDate: parsed.lastUpdateDate ?? prev.lastUpdateDate,
      estimatedDate: parsed.estimatedDate ?? prev.estimatedDate,
      date:
        parsed.estimatedDate ??
        parsed.lastUpdateDate ??
        prev.date,
      tracking: parsed.trackingNumber ?? prev.tracking,
      carrier: parsed.carrierName ?? prev.carrier,
      voucher:
        parsed.voucherAmount ?? (parsed.productAmount ? "" : prev.voucher),
      status: parsed.latestStatus ?? prev.status,
      topic: parsed.cxConcern ?? prev.topic,
    }));

    const defaultPath = detectDefaultPathForScenario(
      parsed.matchedScenarioId,
      nextText,
      parsed
    );
    if (parsed.matchedScenarioId && defaultPath) {
      const scenarioId = parsed.matchedScenarioId;
      setActivePathByScenario((prev) => ({
        ...prev,
        [scenarioId]: defaultPath,
      }));
    }

    if (autoFocusMatched && parsed.matchedScenarioId) {
      onSelectScenario(parsed.matchedScenarioId);
    }
  };

  const handleClearPasteAndPlaceholders = () => {
    setPasteInput("");
    setDetectedOrderSn(null);
    setDetectedAmount(null);
    setMatchedScenarioId(null);
    setActivePathByScenario({});
    setPlaceholders({
      date: "",
      lastUpdateDate: "",
      estimatedDate: "",
      tracking: "",
      carrier: "",
      voucher: "",
      status: "",
      topic: "",
      spec: "",
    });
    onSelectScenario(null);
  };

  const getActivePath = (scenario: ScriptScenario): ScriptPath | undefined => {
    if (!scenario.paths || scenario.paths.length === 0) return undefined;
    const selectedId = activePathByScenario[scenario.id];
    return (
      scenario.paths.find((p) => p.id === selectedId) ?? scenario.paths[0]
    );
  };

  const getActiveRows = (scenario: ScriptScenario): ScriptRow[] => {
    return getActivePath(scenario)?.rows ?? scenario.rows;
  };

  const visibleScenarios = useMemo(() => {
    const base = selectedScenarioId
      ? scenarios.filter((s) => s.id === selectedScenarioId)
      : scenarios;

    if (!matchedScenarioId || selectedScenarioId) return base;
    return [...base].sort((a, b) => {
      if (a.id === matchedScenarioId) return -1;
      if (b.id === matchedScenarioId) return 1;
      return 0;
    });
  }, [scenarios, selectedScenarioId, matchedScenarioId]);

  const matchedScenarioObj = useMemo(
    () => scenarios.find((s) => s.id === matchedScenarioId) ?? null,
    [scenarios, matchedScenarioId]
  );

  const handleCopyFullScript = async (scenario: ScriptScenario) => {
    const activeRows = getActiveRows(scenario);
    const text = activeRows
      .map((r) => applyPlaceholders(r.portuguese, placeholders, "pt"))
      .join("\n\n");
    const ok = await copyToClipboard(text);
    if (ok) markCopied(`full-${scenario.id}`);
  };

  const handleCopyTable = async (scenario: ScriptScenario) => {
    const activeRows = getActiveRows(scenario);
    const resolved = activeRows.map((r) => ({
      section: r.section,
      english: applyPlaceholders(r.english, placeholders, "en"),
      portuguese: applyPlaceholders(r.portuguese, placeholders, "pt"),
    }));
    const ok = await copyToClipboard(formatRowsAsMarkdownTable(resolved));
    if (ok) markCopied(`table-${scenario.id}`);
  };

  const openCreateForm = () => {
    if (!isSignedIn) {
      onSignIn();
      return;
    }
    setEditingScenarioId(null);
    setNewTitle("");
    setNewCategory(ScenarioCategory.GENERAL);
    setNewWhenToUse("");
    setNewPolicyRule("");
    setNewSampleInput("");
    setNewRows([
      { section: "Greeting", english: "", portuguese: "", highlight: false },
      { section: "Main Reply", english: "", portuguese: "", highlight: true },
      { section: "Closing", english: "", portuguese: "", highlight: false },
    ]);
    setShowAddForm(true);
  };

  const openEditOrDuplicateForm = (
    scenario: ScriptScenario,
    asEdit: boolean
  ) => {
    if (!isSignedIn) {
      onSignIn();
      return;
    }
    const sourceRows = getActiveRows(scenario);
    setEditingScenarioId(asEdit ? scenario.id : null);
    setNewTitle(asEdit ? scenario.title : `${scenario.title} (Custom)`);
    setNewCategory(scenario.category);
    setNewWhenToUse(scenario.whenToUse);
    setNewPolicyRule(scenario.policyRule);
    setNewSampleInput(scenario.sampleInput);
    setNewRows(
      sourceRows.map((r) => ({
        section: r.section,
        english: r.english,
        portuguese: r.portuguese,
        highlight: Boolean(r.highlight),
      }))
    );
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCreateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn) {
      onSignIn();
      return;
    }
    const cleanedRows = newRows.filter(
      (r) => r.section.trim() && (r.english.trim() || r.portuguese.trim())
    );
    if (!newTitle.trim() || cleanedRows.length === 0) return;

    const editingSource = editingScenarioId
      ? scenarios.find((s) => s.id === editingScenarioId)
      : undefined;

    const payload: Omit<ScriptScenario, "id" | "number"> = {
      title: newTitle.trim(),
      category: newCategory,
      whenToUse: newWhenToUse.trim() || "Custom store response script.",
      policyRule:
        newPolicyRule.trim() ||
        "Follows Shopee Brazil store policy (no direct refunds; tap Return/Refund).",
      sampleInput:
        newSampleInput.trim() ||
        `${newTitle.trim()} > Customer needs help with this concern.`,
      rows: cleanedRows,
      ...(editingSource?.paths ? { paths: editingSource.paths } : {}),
      ...(editingSource?.guideIds ? { guideIds: editingSource.guideIds } : {}),
      sortOrder: editingSource
        ? editingSource.sortOrder ?? editingSource.number
        : scenarios.reduce(
            (max, s) => Math.max(max, (s.sortOrder ?? s.number) + 1),
            scenarios.length + 1
          ),
      isCustom: editingSource ? editingSource.isCustom : true,
    };

    setIsSavingScript(true);
    try {
      if (editingScenarioId) {
        await onUpdateCustomScenario(editingScenarioId, payload);
      } else {
        await onAddCustomScenario(payload);
      }
      setEditingScenarioId(null);
      setNewTitle("");
      setNewWhenToUse("");
      setNewPolicyRule("");
      setNewSampleInput("");
      setNewRows([
        { section: "Greeting", english: "", portuguese: "", highlight: false },
        { section: "Main Reply", english: "", portuguese: "", highlight: true },
        { section: "Closing", english: "", portuguese: "", highlight: false },
      ]);
      setShowAddForm(false);
    } finally {
      setIsSavingScript(false);
    }
  };

  const deliveryExample = scenarios.find((s) => s.id === "s4")?.sampleInput ?? "";

  return (
    <div className="space-y-6">
      {/* Auto-Fill Paste & Live Placeholder Bar */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Shopee CS Quick Script Library
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {isSignedIn
                ? isSyncing
                  ? "Syncing your Script Library from Cloud Firestore..."
                  : `${scenarios.length} cloud-synced scripts. Paste an order & CX concern below to auto-fill placeholders in real time.`
                : (
                  <>
                    Paste{" "}
                    <span className="font-mono text-xs text-slate-700 dark:text-slate-300">
                      Order / Product Info &gt; Customer Concern
                    </span>{" "}
                    or a full Shopee Seller Center dump to auto-fill every script table in real time.
                  </>
                )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {selectedScenarioId && (
              <button
                type="button"
                onClick={() => onSelectScenario(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Show All ({scenarios.length})
              </button>
            )}
            <button
              type="button"
              onClick={handleClearPasteAndPlaceholders}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear
            </button>
            {isSignedIn && onResetDefaultScripts && (
              <button
                type="button"
                onClick={() => void onResetDefaultScripts()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Restore Defaults
              </button>
            )}
            {!isSignedIn ? (
              <button
                type="button"
                onClick={onSignIn}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#EE4D2D] hover:bg-[#d94123] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Cloud className="w-3.5 h-3.5" />
                Sign in to Sync Scripts
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  showAddForm ? setShowAddForm(false) : openCreateForm()
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#EE4D2D] hover:bg-[#d94123] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {showAddForm ? (
                  <>
                    <X className="w-3.5 h-3.5" />
                    Close Form
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    Add Custom Script
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Order / Product Info > Customer Concern Paste Box */}
        <div className="mt-4 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="library-paste-input"
              className="text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Order / Product Info &gt; Customer Concern (supports full Shopee Seller Center paste)
            </label>
            <div className="flex items-center gap-3">
              {deliveryExample && (
                <button
                  type="button"
                  onClick={() => handlePasteChange(deliveryExample)}
                  className="text-xs font-medium text-[#EE4D2D] hover:underline cursor-pointer"
                >
                  Load Delivery Inquiry Example
                </button>
              )}
              <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoFocusMatched}
                  onChange={(e) => setAutoFocusMatched(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-600 text-[#EE4D2D] focus:ring-[#EE4D2D]"
                />
                Auto-focus matched script
              </label>
            </div>
          </div>

          <textarea
            id="library-paste-input"
            rows={4}
            value={pasteInput}
            onChange={(e) => handlePasteChange(e.target.value)}
            placeholder="Paste your Shopee Seller Center order + tracking log and CX> concern here to auto-fill dates, tracking code, status, and match the right script..."
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/70 px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-[#EE4D2D] focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]/15 transition-colors"
          />

          {(detectedOrderSn ||
            detectedAmount ||
            placeholders.carrier ||
            placeholders.tracking ||
            matchedScenarioObj) && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2">
              <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] tabular-nums">
                {[
                  detectedOrderSn ? `Order ${detectedOrderSn}` : null,
                  detectedAmount
                    ? placeholders.voucher
                      ? `${detectedAmount} (Offer ${placeholders.voucher} Voucher)`
                      : `${detectedAmount} (Escalate >R$25)`
                    : null,
                  placeholders.carrier || null,
                  placeholders.tracking || null,
                ]
                  .filter(Boolean)
                  .map((item, idx) => (
                    <React.Fragment key={item}>
                      {idx > 0 && <span aria-hidden="true">·</span>}
                      <span>{item}</span>
                    </React.Fragment>
                  ))}
              </div>

              {matchedScenarioObj && (
                <div className="flex items-center gap-3">
                  <span>
                    Matched:{" "}
                    <strong className="font-medium text-slate-900 dark:text-slate-100">
                      {String(matchedScenarioObj.number).padStart(2, "0")}.{" "}
                      {matchedScenarioObj.title}
                    </strong>
                  </span>
                  {selectedScenarioId !== matchedScenarioObj.id && (
                    <button
                      type="button"
                      onClick={() => onSelectScenario(matchedScenarioObj.id)}
                      className="text-xs font-medium text-[#EE4D2D] hover:underline cursor-pointer"
                    >
                      Focus Script
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      onTrackUsageEvents?.([
                        {
                          itemType: "script",
                          itemId: matchedScenarioObj.id,
                          itemTitle: matchedScenarioObj.title,
                          category: matchedScenarioObj.category,
                          event: "accessed",
                        },
                      ]);
                      onUseInGenerator(pasteInput);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-[#EE4D2D] cursor-pointer"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    Refine with AI
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Auto-Populated Placeholder Fields */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              Last Update [DATE]
            </label>
            <input
              type="text"
              value={placeholders.lastUpdateDate || ""}
              onChange={(e) =>
                setPlaceholders((p) => ({
                  ...p,
                  lastUpdateDate: e.target.value,
                  date: p.date || e.target.value,
                }))
              }
              placeholder="03/11/2026"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/70 px-2.5 py-1.5 text-xs tabular-nums text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-[#EE4D2D] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              Est. Delivery [DATE]
            </label>
            <input
              type="text"
              value={placeholders.estimatedDate || ""}
              onChange={(e) =>
                setPlaceholders((p) => ({
                  ...p,
                  estimatedDate: e.target.value,
                  date: e.target.value || p.date,
                }))
              }
              placeholder="24/11/2026"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/70 px-2.5 py-1.5 text-xs tabular-nums text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-[#EE4D2D] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              [TRACKING]
            </label>
            <input
              type="text"
              value={placeholders.tracking}
              onChange={(e) =>
                setPlaceholders((p) => ({ ...p, tracking: e.target.value }))
              }
              placeholder="AJ261009127752101"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/70 px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-[#EE4D2D] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              [STATUS]
            </label>
            <input
              type="text"
              value={placeholders.status}
              onChange={(e) =>
                setPlaceholders((p) => ({ ...p, status: e.target.value }))
              }
              placeholder="em trânsito"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/70 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-[#EE4D2D] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              [ISSUE TOPIC]
            </label>
            <input
              type="text"
              value={placeholders.topic}
              onChange={(e) =>
                setPlaceholders((p) => ({ ...p, topic: e.target.value }))
              }
              placeholder="Shopee Coins / Pix"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/70 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-[#EE4D2D] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              [VOUCHER] (≤ R$25 tier)
            </label>
            <input
              type="text"
              value={placeholders.voucher || ""}
              onChange={(e) =>
                setPlaceholders((p) => ({ ...p, voucher: e.target.value }))
              }
              placeholder="R$15"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/70 px-2.5 py-1.5 text-xs tabular-nums text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-[#EE4D2D] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              [INSERT SPEC]
            </label>
            <input
              type="text"
              value={placeholders.spec}
              onChange={(e) =>
                setPlaceholders((p) => ({ ...p, spec: e.target.value }))
              }
              placeholder="Bivolt 110V/220V"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/70 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-[#EE4D2D] focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* Add Custom Script Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreateCustom}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {editingScenarioId
                ? "Edit Cloud Custom Script"
                : "Create Cloud Custom Bilingual Script"}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Scenario Title
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Missing Accessory in Package"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#EE4D2D] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={newCategory}
                onChange={(e) =>
                  setNewCategory(e.target.value as ScenarioCategory)
                }
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-[#EE4D2D] focus:outline-none"
              >
                <option value={ScenarioCategory.GENERAL}>General</option>
                <option value={ScenarioCategory.DELIVERY}>Delivery</option>
                <option value={ScenarioCategory.DELAYED}>Delayed</option>
                <option value={ScenarioCategory.PRODUCT}>Product</option>
                <option value={ScenarioCategory.REFUND}>Refund</option>
                <option value={ScenarioCategory.PLATFORM}>Platform</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                When to Use
              </label>
              <input
                type="text"
                value={newWhenToUse}
                onChange={(e) => setNewWhenToUse(e.target.value)}
                placeholder="When customer reports a missing cable or part"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#EE4D2D] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Policy Note
              </label>
              <input
                type="text"
                value={newPolicyRule}
                onChange={(e) => setNewPolicyRule(e.target.value)}
                placeholder="Ask for unboxing photo; direct to Return/Refund if unresolved"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#EE4D2D] focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Sentence Rows
              </span>
              <button
                type="button"
                onClick={() =>
                  setNewRows((r) => [
                    ...r,
                    { section: "Detail", english: "", portuguese: "" },
                  ])
                }
                className="text-xs font-medium text-[#EE4D2D] hover:underline cursor-pointer"
              >
                + Add Row
              </button>
            </div>
            {newRows.map((row, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start"
              >
                <input
                  type="text"
                  value={row.section}
                  onChange={(e) => {
                    const next = [...newRows];
                    next[idx] = { ...next[idx], section: e.target.value };
                    setNewRows(next);
                  }}
                  placeholder="Section"
                  className="md:col-span-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#EE4D2D] focus:outline-none"
                />
                <input
                  type="text"
                  value={row.english}
                  onChange={(e) => {
                    const next = [...newRows];
                    next[idx] = { ...next[idx], english: e.target.value };
                    setNewRows(next);
                  }}
                  placeholder="English sentence (for you)"
                  className="md:col-span-5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#EE4D2D] focus:outline-none"
                />
                <input
                  type="text"
                  value={row.portuguese}
                  onChange={(e) => {
                    const next = [...newRows];
                    next[idx] = { ...next[idx], portuguese: e.target.value };
                    setNewRows(next);
                  }}
                  placeholder="Portuguese sentence (send to CX)"
                  className="md:col-span-5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#EE4D2D] focus:outline-none"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setEditingScenarioId(null);
              }}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingScript}
              className="px-4 py-2 text-xs font-medium text-white bg-[#EE4D2D] hover:bg-[#d94123] disabled:opacity-60 rounded-lg cursor-pointer"
            >
              {isSavingScript
                ? "Saving to Cloud..."
                : editingScenarioId
                  ? "Save Script Changes"
                  : "Save Script to Cloud"}
            </button>
          </div>
        </form>
      )}

      {/* Scenario Cards */}
      <div className="space-y-6">
        {visibleScenarios.map((scenario) => {
          const activePath = getActivePath(scenario);
          const activeRows = getActiveRows(scenario);

          return (
            <article
              key={scenario.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-mono tabular-nums font-semibold text-[#EE4D2D]">
                      {String(scenario.number).padStart(2, "0")}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{scenario.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">
                      {activeRows.length} sentences
                    </span>
                    {scenario.isCustom && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-slate-700 dark:text-slate-300 font-medium">Custom</span>
                      </>
                    )}
                  </div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-1">
                    {scenario.title}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditOrDuplicateForm(scenario, true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-[#EE4D2D] hover:text-[#EE4D2D] transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  {scenario.isCustom ? (
                    <button
                      type="button"
                      onClick={() => void onDeleteCustomScenario(scenario.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openEditOrDuplicateForm(scenario, false)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-[#EE4D2D] hover:text-[#EE4D2D] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Cloud className="w-3.5 h-3.5" />
                      Duplicate
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const aiInput = activePath
                        ? `${scenario.sampleInput}\n\nCX Response Stage: ${activePath.label}${activePath.cxTrigger ? ` (${activePath.cxTrigger})` : ""}`
                        : scenario.sampleInput;
                      onTrackUsageEvents?.([
                        {
                          itemType: "script",
                          itemId: scenario.id,
                          itemTitle: scenario.title,
                          category: scenario.category,
                          event: "accessed",
                        },
                      ]);
                      onUseInGenerator(aiInput);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    Customize with AI
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleCopyTable(scenario)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {copiedKey === `table-${scenario.id}` ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        Copied Table
                      </>
                    ) : (
                      "Copy Table"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleCopyFullScript(scenario)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#EE4D2D] hover:bg-[#d94123] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {copiedKey === `full-${scenario.id}` ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Copied PT
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy Full PT
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Quiet Context Summary */}
              <div className="px-5 py-3 bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">When to use: </span>
                  {scenario.whenToUse}
                </div>
                <div className="sm:border-l sm:border-slate-200 dark:sm:border-slate-700 sm:pl-6">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Rule: </span>
                  {scenario.policyRule}
                </div>
              </div>

              {/* Interactive CX Response Button Path Selector */}
              {scenario.paths && scenario.paths.length > 0 && activePath && (
                <div className="px-5 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mr-1">
                      CX Response Path:
                    </span>
                    {scenario.paths.map((path) => {
                      const isActive = activePath.id === path.id;
                      return (
                        <button
                          key={path.id}
                          type="button"
                          onClick={() =>
                            setActivePathByScenario((prev) => ({
                              ...prev,
                              [scenario.id]: path.id,
                            }))
                          }
                          className={
                            isActive
                              ? "px-3 py-1.5 text-xs font-medium rounded-lg border border-[#EE4D2D] bg-[#EE4D2D] text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                              : "px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#EE4D2D] hover:text-[#EE4D2D] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          }
                        >
                          {path.label}
                        </button>
                      );
                    })}
                  </div>
                  {activePath.cxTrigger && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        Use when:{" "}
                      </span>
                      {activePath.cxTrigger}
                    </p>
                  )}
                </div>
              )}

              {/* Bilingual Script Table */}
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
                    {activeRows.map((row, idx) => {
                      const resolvedEn = applyPlaceholders(
                        row.english,
                        placeholders,
                        "en"
                      );
                      const resolvedPt = applyPlaceholders(
                        row.portuguese,
                        placeholders,
                        "pt"
                      );
                      const rowKey = `${scenario.id}-${activePath?.id ?? "default"}-${idx}`;

                    return (
                      <tr
                        key={rowKey}
                        className={
                          row.highlight
                            ? "bg-orange-50/50 dark:bg-[#EE4D2D]/12 hover:bg-orange-50/75 dark:hover:bg-[#EE4D2D]/20 transition-colors"
                            : "hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                        }
                      >
                        <td className="py-3 px-4 align-top font-medium text-slate-900 dark:text-slate-100 text-xs">
                          <div>{row.section}</div>
                          {row.highlight && (
                            <div className="text-[11px] font-semibold text-[#EE4D2D] mt-0.5">
                              Must include
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 align-top text-slate-600 dark:text-slate-400 leading-relaxed">
                          {resolvedEn}
                        </td>
                        <td className="py-3 px-4 align-top text-slate-900 dark:text-slate-100 leading-relaxed">
                          {resolvedPt}
                        </td>
                        <td className="py-3 px-4 align-top text-right">
                          <button
                            type="button"
                            onClick={() => {
                              void copyToClipboard(resolvedPt).then((ok) => {
                                if (ok) markCopied(rowKey);
                              });
                            }}
                            title="Copy Portuguese sentence"
                            className="inline-flex items-center justify-center p-1.5 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded hover:border-[#EE4D2D] hover:text-[#EE4D2D] transition-colors cursor-pointer"
                          >
                            {copiedKey === rowKey ? (
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

            <VisualGuideStrip
              guideIds={scenario.guideIds}
              heading="Related Shopee BR Visual Guides"
              onBrowseAll={onOpenVisualGuides}
            />
          </article>
          );
        })}
      </div>
    </div>
  );
};
