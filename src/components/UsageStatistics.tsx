import React, { useMemo, useState } from "react";
import {
  BarChart3,
  BookOpen,
  FileCheck2,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import {
  ScriptScenario,
  StoreRuleEntry,
  UsageStatEntry,
  UsageStatItemType,
} from "../types/cs";

interface UsageStatisticsProps {
  stats: UsageStatEntry[];
  scenarios: ScriptScenario[];
  storeRules: StoreRuleEntry[];
  isSignedIn: boolean;
  isSyncing: boolean;
  onSignIn: () => void;
  onOpenScript: (scenarioId: string) => void;
  onOpenRules: () => void;
  onOpenGenerator: () => void;
  onResetStats: () => Promise<void>;
}

type FilterScope = "all" | "script" | "rule";
type SortMode = "total" | "applied" | "accessed" | "recent";

interface MergedUsageRow {
  key: string;
  itemType: UsageStatItemType;
  itemId: string;
  itemTitle: string;
  category: string;
  isPrimaryRule?: boolean;
  scriptNumber?: number;
  appliedCount: number;
  accessedCount: number;
  totalCount: number;
  lastEvent?: "applied" | "accessed";
  updatedAt?: string;
  existsInCatalog: boolean;
}

function formatRelativeOrShortDate(iso?: string): string {
  if (!iso) return "Never";
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return "—";
  const diffMin = Math.floor((Date.now() - ms) / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(ms).toLocaleDateString("pt-BR");
}

export const UsageStatistics: React.FC<UsageStatisticsProps> = ({
  stats,
  scenarios,
  storeRules,
  isSignedIn,
  isSyncing,
  onSignIn,
  onOpenScript,
  onOpenRules,
  onOpenGenerator,
  onResetStats,
}) => {
  const [scope, setScope] = useState<FilterScope>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("total");
  const [showUnused, setShowUnused] = useState(true);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const { scriptRows, ruleRows } = useMemo(() => {
    const statByKey = new Map<string, UsageStatEntry>();
    for (const st of stats) {
      statByKey.set(`${st.itemType}:${st.itemId}`, st);
    }

    const scripts: MergedUsageRow[] = scenarios.map((sc) => {
      const matched = statByKey.get(`script:${sc.id}`);
      const appliedCount = matched?.appliedCount ?? 0;
      const accessedCount = matched?.accessedCount ?? 0;
      return {
        key: `script:${sc.id}`,
        itemType: "script",
        itemId: sc.id,
        itemTitle: sc.title,
        category: sc.category,
        scriptNumber: sc.number,
        appliedCount,
        accessedCount,
        totalCount: appliedCount + accessedCount,
        lastEvent: matched?.lastEvent,
        updatedAt: matched?.updatedAt,
        existsInCatalog: true,
      };
    });

    for (const st of stats) {
      if (st.itemType !== "script") continue;
      if (!scenarios.some((sc) => sc.id === st.itemId)) {
        scripts.push({
          key: `script:${st.itemId}`,
          itemType: "script",
          itemId: st.itemId,
          itemTitle: st.itemTitle,
          category: st.category || "Archived",
          appliedCount: st.appliedCount,
          accessedCount: st.accessedCount,
          totalCount: st.appliedCount + st.accessedCount,
          lastEvent: st.lastEvent,
          updatedAt: st.updatedAt,
          existsInCatalog: false,
        });
      }
    }

    const rules: MergedUsageRow[] = storeRules.map((rule) => {
      const matched = statByKey.get(`rule:${rule.id}`);
      const appliedCount = matched?.appliedCount ?? 0;
      const accessedCount = matched?.accessedCount ?? 0;
      return {
        key: `rule:${rule.id}`,
        itemType: "rule",
        itemId: rule.id,
        itemTitle: rule.topic,
        category: rule.isPrimary ? "Primary Rule" : "Policy Rule",
        isPrimaryRule: rule.isPrimary,
        appliedCount,
        accessedCount,
        totalCount: appliedCount + accessedCount,
        lastEvent: matched?.lastEvent,
        updatedAt: matched?.updatedAt,
        existsInCatalog: true,
      };
    });

    for (const st of stats) {
      if (st.itemType !== "rule") continue;
      if (!storeRules.some((r) => r.id === st.itemId)) {
        rules.push({
          key: `rule:${st.itemId}`,
          itemType: "rule",
          itemId: st.itemId,
          itemTitle: st.itemTitle,
          category: st.category || "Archived Rule",
          appliedCount: st.appliedCount,
          accessedCount: st.accessedCount,
          totalCount: st.appliedCount + st.accessedCount,
          lastEvent: st.lastEvent,
          updatedAt: st.updatedAt,
          existsInCatalog: false,
        });
      }
    }

    return { scriptRows: scripts, ruleRows: rules };
  }, [stats, scenarios, storeRules]);

  const summary = useMemo(() => {
    const scriptApplied = scriptRows.reduce((s, r) => s + r.appliedCount, 0);
    const scriptAccessed = scriptRows.reduce((s, r) => s + r.accessedCount, 0);
    const activeScripts = scriptRows.filter((r) => r.totalCount > 0).length;

    const ruleApplied = ruleRows.reduce((s, r) => s + r.appliedCount, 0);
    const ruleAccessed = ruleRows.reduce((s, r) => s + r.accessedCount, 0);
    const activeRules = ruleRows.filter((r) => r.totalCount > 0).length;

    const topScript = [...scriptRows]
      .filter((r) => r.totalCount > 0)
      .sort((a, b) => b.totalCount - a.totalCount)[0];
    const topRule = [...ruleRows]
      .filter((r) => r.totalCount > 0)
      .sort((a, b) => b.totalCount - a.totalCount)[0];

    return {
      totalEvents: scriptApplied + scriptAccessed + ruleApplied + ruleAccessed,
      scriptApplied,
      scriptAccessed,
      scriptTotal: scriptApplied + scriptAccessed,
      activeScripts,
      ruleApplied,
      ruleAccessed,
      ruleTotal: ruleApplied + ruleAccessed,
      activeRules,
      topScript,
      topRule,
    };
  }, [scriptRows, ruleRows]);

  const filterAndSort = (rows: MergedUsageRow[]) => {
    const q = searchQuery.trim().toLowerCase();
    return [...rows]
      .filter((r) => {
        if (!showUnused && r.totalCount === 0) return false;
        if (!q) return true;
        return (
          r.itemTitle.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.itemId.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortMode === "applied") {
          if (b.appliedCount !== a.appliedCount) {
            return b.appliedCount - a.appliedCount;
          }
        } else if (sortMode === "accessed") {
          if (b.accessedCount !== a.accessedCount) {
            return b.accessedCount - a.accessedCount;
          }
        } else if (sortMode === "recent") {
          const aMs = a.updatedAt ? Date.parse(a.updatedAt) || 0 : 0;
          const bMs = b.updatedAt ? Date.parse(b.updatedAt) || 0 : 0;
          if (bMs !== aMs) return bMs - aMs;
        }
        if (b.totalCount !== a.totalCount) return b.totalCount - a.totalCount;
        if (b.appliedCount !== a.appliedCount) return b.appliedCount - a.appliedCount;
        return (a.scriptNumber ?? 999) - (b.scriptNumber ?? 999);
      });
  };

  const filteredScripts = useMemo(
    () => filterAndSort(scriptRows),
    [scriptRows, searchQuery, sortMode, showUnused]
  );
  const filteredRules = useMemo(
    () => filterAndSort(ruleRows),
    [ruleRows, searchQuery, sortMode, showUnused]
  );

  const maxScriptTotal = Math.max(
    1,
    ...filteredScripts.map((r) => r.totalCount)
  );
  const maxRuleTotal = Math.max(1, ...filteredRules.map((r) => r.totalCount));

  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      await onResetStats();
      setConfirmingReset(false);
    } finally {
      setIsResetting(false);
    }
  };

  const renderSectionTable = (
    title: string,
    subtitle: string,
    rows: MergedUsageRow[],
    maxCount: number,
    itemKind: "script" | "rule"
  ) => (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {itemKind === "script" ? (
            <BookOpen className="w-4 h-4 text-[#EE4D2D] shrink-0" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-[#EE4D2D] shrink-0" />
          )}
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          </div>
        </div>
        <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
          Showing {rows.length} {itemKind === "script" ? "scripts" : "rules"}
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="px-5 py-8 text-center text-xs text-slate-500 dark:text-slate-400">
          No {itemKind === "script" ? "scripts" : "store rules"} match your current filter.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-4 w-12">#</th>
                <th className="py-2.5 px-4">
                  {itemKind === "script" ? "Script Scenario" : "Store Policy Rule"}
                </th>
                <th className="py-2.5 px-4 w-44 hidden md:table-cell">Share</th>
                <th className="py-2.5 px-4 w-24 text-right">Applied</th>
                <th className="py-2.5 px-4 w-24 text-right">Accessed</th>
                <th className="py-2.5 px-4 w-20 text-right">Total</th>
                <th className="py-2.5 px-4 w-28 text-right hidden sm:table-cell">
                  Last Used
                </th>
                <th className="py-2.5 px-4 w-28 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {rows.map((row, idx) => {
                const appliedWidth =
                  row.totalCount > 0
                    ? Math.round((row.appliedCount / maxCount) * 100)
                    : 0;
                const accessedWidth =
                  row.totalCount > 0
                    ? Math.round((row.accessedCount / maxCount) * 100)
                    : 0;
                return (
                  <tr
                    key={row.key}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-400 dark:text-slate-500">
                      {String(idx + 1).padStart(2, "0")}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {row.scriptNumber !== undefined && (
                          <span className="font-mono text-[11px] tabular-nums text-[#EE4D2D] font-semibold">
                            {String(row.scriptNumber).padStart(2, "0")}
                          </span>
                        )}
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {row.itemTitle}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <span>{row.category}</span>
                        {row.isPrimaryRule && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-medium text-[#EE4D2D]">
                              Primary
                            </span>
                          </>
                        )}
                        {!row.existsInCatalog && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>Archived</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <div
                        className="h-2 w-full rounded bg-slate-100 dark:bg-slate-800 overflow-hidden flex"
                        title={`Applied: ${row.appliedCount}, Accessed: ${row.accessedCount}`}
                      >
                        {appliedWidth > 0 && (
                          <div
                            className="h-full bg-[#EE4D2D]"
                            style={{ width: `${appliedWidth}%` }}
                          />
                        )}
                        {accessedWidth > 0 && (
                          <div
                            className="h-full bg-slate-400 dark:bg-slate-500"
                            style={{ width: `${accessedWidth}%` }}
                          />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                      {row.appliedCount}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                      {row.accessedCount}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-[#EE4D2D]">
                      {row.totalCount}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500 dark:text-slate-400 whitespace-nowrap hidden sm:table-cell">
                      {formatRelativeOrShortDate(row.updatedAt)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {row.existsInCatalog ? (
                        <button
                          type="button"
                          onClick={() =>
                            itemKind === "script"
                              ? onOpenScript(row.itemId)
                              : onOpenRules()
                          }
                          className="text-xs font-medium text-[#EE4D2D] hover:underline whitespace-nowrap cursor-pointer"
                        >
                          {itemKind === "script" ? "Open Script →" : "Open Rules →"}
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                          Removed
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#EE4D2D]" />
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Usage Statistics
              </h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {isSignedIn
                ? isSyncing
                  ? "Syncing script and rule usage telemetry from Cloud Firestore..."
                  : "Tracks how often Reply Generator applies Store Rules & Script Library scenarios, or when scripts are loaded into the generator."
                : "Sign in with Google to track and sync Reply Generator usage across devices."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenGenerator}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#EE4D2D] hover:bg-[#d94123] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Reply Generator
            </button>

            {isSignedIn && stats.length > 0 && !confirmingReset && (
              <button
                type="button"
                onClick={() => setConfirmingReset(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-red-300 hover:text-red-600 dark:hover:text-red-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Stats
              </button>
            )}

            {isSignedIn && confirmingReset && (
              <div className="inline-flex items-center gap-2 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/70 rounded-lg px-2.5 py-1">
                <span className="text-xs text-red-800 dark:text-red-300 font-medium">
                  Clear all counts?
                </span>
                <button
                  type="button"
                  disabled={isResetting}
                  onClick={() => void handleConfirmReset()}
                  className="px-2 py-0.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 rounded cursor-pointer"
                >
                  {isResetting ? "Clearing..." : "Confirm"}
                </button>
                <button
                  type="button"
                  disabled={isResetting}
                  onClick={() => setConfirmingReset(false)}
                  className="px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Summary KPI Strip */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-3.5">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Total Tracked Events</span>
              <TrendingUp className="w-3.5 h-3.5 text-[#EE4D2D]" />
            </div>
            <div className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {summary.totalEvents}
            </div>
            <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
              Applied ({summary.scriptApplied + summary.ruleApplied}) · Accessed (
              {summary.scriptAccessed + summary.ruleAccessed})
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-3.5">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Script Library Uses</span>
              <BookOpen className="w-3.5 h-3.5 text-[#EE4D2D]" />
            </div>
            <div className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {summary.scriptTotal}
            </div>
            <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
              {summary.activeScripts} of {scenarios.length} scripts active
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-3.5">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Store Rule Applications</span>
              <FileCheck2 className="w-3.5 h-3.5 text-[#EE4D2D]" />
            </div>
            <div className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {summary.ruleTotal}
            </div>
            <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
              {summary.activeRules} of {storeRules.length} rules triggered
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-3.5">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Most Frequent</span>
              <ShieldCheck className="w-3.5 h-3.5 text-[#EE4D2D]" />
            </div>
            <div className="mt-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
              {summary.topScript
                ? `${summary.topScript.itemTitle} (${summary.topScript.totalCount})`
                : "No script events yet"}
            </div>
            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {summary.topRule
                ? `Rule: ${summary.topRule.itemTitle} (${summary.topRule.totalCount})`
                : "Rule: No rule events yet"}
            </div>
          </div>
        </div>

        {/* Filter & Sort Controls */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ["all", "All Items"],
                ["script", `Scripts (${scenarios.length})`],
                ["rule", `Store Rules (${storeRules.length})`],
              ] as Array<[FilterScope, string]>
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setScope(key)}
                className={
                  scope === key
                    ? "px-3 py-1.5 text-xs font-medium rounded-lg border border-[#EE4D2D] bg-[#EE4D2D] text-white transition-colors cursor-pointer"
                    : "px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#EE4D2D] hover:text-[#EE4D2D] transition-colors cursor-pointer"
                }
              >
                {label}
              </button>
            ))}

            <div className="flex items-center gap-3 ml-1 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#EE4D2D] inline-block" />
                Applied by Generator
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-slate-400 dark:bg-slate-500 inline-block" />
                Accessed / Loaded
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter scripts or rules..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-[#EE4D2D] focus:outline-none"
              />
            </div>

            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              aria-label="Sort usage statistics"
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 focus:border-[#EE4D2D] focus:outline-none"
            >
              <option value="total">Sort: Total Uses</option>
              <option value="applied">Sort: Most Applied</option>
              <option value="accessed">Sort: Most Accessed</option>
              <option value="recent">Sort: Recently Used</option>
            </select>

            <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showUnused}
                onChange={(e) => setShowUnused(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-600 text-[#EE4D2D] focus:ring-[#EE4D2D]"
              />
              Show unused (0)
            </label>
          </div>
        </div>
      </section>

      {!isSignedIn ? (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center space-y-3">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
            Sign in required to persist usage statistics
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Sign in with your Google account to save and sync script &amp; rule usage counts across devices.
          </p>
          <button
            type="button"
            onClick={onSignIn}
            className="px-4 py-2 text-xs font-medium text-white bg-[#EE4D2D] hover:bg-[#d94123] rounded-lg cursor-pointer"
          >
            Sign in with Google
          </button>
        </section>
      ) : (
        <>
          {summary.totalEvents === 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                No usage events recorded yet. Generate a reply, pick a Quick Example preset, or choose a CX Response Path in the Reply Generator to start tracking live counts.
              </p>
              <button
                type="button"
                onClick={onOpenGenerator}
                className="text-xs font-medium text-[#EE4D2D] hover:underline whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
              >
                Go to Reply Generator →
              </button>
            </div>
          )}

          {(scope === "all" || scope === "script") &&
            renderSectionTable(
              "Script Library Scenarios",
              "Counts whenever Reply Generator matches/applies a scenario script or an agent loads one via presets, path picker, or Script Library.",
              filteredScripts,
              maxScriptTotal,
              "script"
            )}

          {(scope === "all" || scope === "rule") &&
            renderSectionTable(
              "Store CS Policy Rules",
              "Counts whenever Reply Generator enforces or updates an active Store CS Rule while generating a response.",
              filteredRules,
              maxRuleTotal,
              "rule"
            )}
        </>
      )}
    </div>
  );
};
