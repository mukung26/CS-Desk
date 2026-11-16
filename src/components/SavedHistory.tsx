import React, { useState } from "react";
import { Copy, Check, Trash2, ArrowUpRight, Search, Cloud } from "lucide-react";
import { SavedCaseEntry } from "../types/cs";
import { copyToClipboard } from "../utils/clipboard";

interface SavedHistoryProps {
  entries: SavedCaseEntry[];
  isSignedIn: boolean;
  isSyncing: boolean;
  onSignIn: () => void;
  onLoadEntry: (entry: SavedCaseEntry) => void;
  onDeleteEntry: (id: string) => void;
  onClearAll: () => void;
  onGoToGenerator: () => void;
}

export const SavedHistory: React.FC<SavedHistoryProps> = ({
  entries,
  isSignedIn,
  isSyncing,
  onSignIn,
  onLoadEntry,
  onDeleteEntry,
  onClearAll,
  onGoToGenerator,
}) => {
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = entries.filter((item) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      item.rawInput.toLowerCase().includes(q) ||
      item.reply.detectedScenario.toLowerCase().includes(q) ||
      item.reply.fullPortugueseMessage.toLowerCase().includes(q)
    );
  });

  const handleCopy = async (id: string, ptText: string) => {
    const ok = await copyToClipboard(ptText);
    if (ok) {
      setCopiedId(id);
      window.setTimeout(() => {
        setCopiedId((prev) => (prev === id ? null : prev));
      }, 1800);
    }
  };

  return (
    <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            Saved Customer Replies
          </h1>
          <p className="text-sm text-slate-500 mt-0.5 tabular-nums">
            {isSignedIn
              ? isSyncing
                ? "Syncing saved history from Cloud Firestore..."
                : `${entries.length} saved ${entries.length === 1 ? "case" : "cases"} in Cloud Firestore (accessible on any PC)`
              : "Sign in with Google to save and access your customer cases from any PC."}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {isSignedIn && (
            <>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search saved replies..."
                  className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#EE4D2D] focus:outline-none w-52"
                />
              </div>
              {entries.length > 0 && (
                <button
                  type="button"
                  onClick={onClearAll}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-slate-200 rounded-lg hover:bg-red-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {!isSignedIn ? (
        <div className="p-10 text-center">
          <p className="text-sm font-medium text-slate-900">
            Cloud Sync Requires Sign-In
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Your Saved History is stored in Cloud Firestore (not local browser storage) so you can switch PCs anytime. Sign in with Google to load or save cases.
          </p>
          <button
            type="button"
            onClick={onSignIn}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#EE4D2D] hover:bg-[#d94123] rounded-lg transition-colors cursor-pointer"
          >
            <Cloud className="w-3.5 h-3.5" />
            Sign in with Google
          </button>
        </div>
      ) : entries.length === 0 ? (
        <div className="p-10 text-center">
          <p className="text-sm font-medium text-slate-900">
            No saved replies yet
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Generate a bilingual reply in Reply Generator or Chat Flow and click Save Case to sync it to your Cloud Firestore log.
          </p>
          <button
            type="button"
            onClick={onGoToGenerator}
            className="mt-4 inline-flex items-center px-4 py-2 text-xs font-medium text-white bg-[#EE4D2D] hover:bg-[#d94123] rounded-lg transition-colors cursor-pointer"
          >
            Go to Reply Generator
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-500">
          No saved cases match &ldquo;{query}&rdquo;.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500">
                <th className="py-2.5 px-4 w-36">Saved</th>
                <th className="py-2.5 px-4 w-44">Scenario</th>
                <th className="py-2.5 px-4">Order / Concern</th>
                <th className="py-2.5 px-4 w-48 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filtered.map((entry) => {
                const dateLabel = new Date(entry.createdAt).toLocaleString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                );
                return (
                  <tr
                    key={entry.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3 px-4 align-top text-xs text-slate-500 font-mono tabular-nums whitespace-nowrap">
                      {dateLabel}
                    </td>
                    <td className="py-3 px-4 align-top">
                      <div className="text-xs font-medium text-slate-900">
                        {entry.reply.detectedScenario}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {entry.reply.category} · {entry.tone}
                      </div>
                    </td>
                    <td className="py-3 px-4 align-top">
                      <p className="text-xs text-slate-700 line-clamp-2">
                        {entry.rawInput}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                        {entry.reply.fullPortugueseMessage}
                      </p>
                    </td>
                    <td className="py-3 px-4 align-top text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            void handleCopy(
                              entry.id,
                              entry.reply.fullPortugueseMessage
                            )
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:border-[#EE4D2D] hover:text-[#EE4D2D] transition-colors cursor-pointer"
                        >
                          {copiedId === entry.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Copy PT
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => onLoadEntry(entry)}
                          title="Re-open in generator"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <ArrowUpRight className="w-3 h-3" />
                          Open
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteEntry(entry.id)}
                          title="Delete entry"
                          className="inline-flex items-center p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
};
