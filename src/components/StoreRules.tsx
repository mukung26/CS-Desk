import React, { useState } from "react";
import { Plus, Pencil, Trash2, RotateCcw, Cloud, Check, X } from "lucide-react";
import { StoreRuleEntry } from "../types/cs";

interface StoreRulesProps {
  rules: StoreRuleEntry[];
  isSignedIn: boolean;
  isSyncing: boolean;
  onSignIn: () => void;
  onAddRule: (rule: Omit<StoreRuleEntry, "id">) => Promise<void>;
  onUpdateRule: (id: string, rule: Omit<StoreRuleEntry, "id">) => Promise<void>;
  onDeleteRule: (id: string) => Promise<void>;
  onResetDefaults: () => Promise<void>;
}

export const StoreRules: React.FC<StoreRulesProps> = ({
  rules,
  isSignedIn,
  isSyncing,
  onSignIn,
  onAddRule,
  onUpdateRule,
  onDeleteRule,
  onResetDefaults,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [english, setEnglish] = useState("");
  const [portuguese, setPortuguese] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const openCreateForm = () => {
    if (!isSignedIn) {
      onSignIn();
      return;
    }
    setEditingRuleId(null);
    setTopic("");
    setEnglish("");
    setPortuguese("");
    setIsPrimary(false);
    setShowForm(true);
  };

  const openEditForm = (rule: StoreRuleEntry) => {
    if (!isSignedIn) {
      onSignIn();
      return;
    }
    setEditingRuleId(rule.id);
    setTopic(rule.topic);
    setEnglish(rule.english);
    setPortuguese(rule.portuguese);
    setIsPrimary(rule.isPrimary);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !english.trim() || !portuguese.trim()) return;
    setSubmitting(true);
    try {
      const existing = rules.find((r) => r.id === editingRuleId);
      const sortOrder = existing ? existing.sortOrder : rules.length;
      if (editingRuleId) {
        await onUpdateRule(editingRuleId, {
          topic: topic.trim(),
          english: english.trim(),
          portuguese: portuguese.trim(),
          isPrimary,
          sortOrder,
        });
      } else {
        await onAddRule({
          topic: topic.trim(),
          english: english.trim(),
          portuguese: portuguese.trim(),
          isPrimary,
          sortOrder,
        });
      }
      setShowForm(false);
      setEditingRuleId(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Shopee Brazil Store CS Rules
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {isSignedIn
                ? isSyncing
                  ? "Syncing your Store Rules from Cloud Firestore..."
                  : `${rules.length} cloud-synced policy rules enforced across Reply Generator & Chat Flow.`
                : "Sign in with Google to save custom Store Rules in Cloud Firestore across any PC."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {!isSignedIn ? (
              <button
                type="button"
                onClick={onSignIn}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#EE4D2D] hover:bg-[#d94123] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Cloud className="w-3.5 h-3.5" />
                Sign in to Sync Rules
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => void onResetDefaults()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restore Defaults
                </button>
                <button
                  type="button"
                  onClick={() =>
                    showForm ? setShowForm(false) : openCreateForm()
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#EE4D2D] hover:bg-[#d94123] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {showForm ? (
                    <>
                      <X className="w-3.5 h-3.5" />
                      Close Form
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      Add Store Rule
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {showForm && isSignedIn && (
          <form
            onSubmit={handleSubmit}
            className="p-5 sm:p-6 bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 space-y-3"
          >
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {editingRuleId ? "Edit Cloud Store Rule" : "Add Cloud Store Rule"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Policy Area
                </label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Fragile Packaging Guarantee"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#EE4D2D] focus:outline-none"
                />
              </div>
              <div className="flex items-end pb-1.5">
                <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isPrimary}
                    onChange={(e) => setIsPrimary(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-600 text-[#EE4D2D] focus:ring-[#EE4D2D]"
                  />
                  Highlight as Primary Store Rule
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Rule Summary (English)
                </label>
                <textarea
                  rows={3}
                  required
                  value={english}
                  onChange={(e) => setEnglish(e.target.value)}
                  placeholder="Explain the policy rule for agents and AI generation..."
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#EE4D2D] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Customer Guidance (Portuguese)
                </label>
                <textarea
                  rows={3}
                  required
                  value={portuguese}
                  onChange={(e) => setPortuguese(e.target.value)}
                  placeholder="Orientação padrão em português para o cliente..."
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#EE4D2D] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingRuleId(null);
                }}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#EE4D2D] hover:bg-[#d94123] disabled:opacity-60 rounded-lg cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                {submitting
                  ? "Saving..."
                  : editingRuleId
                    ? "Save Rule Changes"
                    : "Save Rule to Cloud"}
              </button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4 w-52">Policy Area</th>
                <th className="py-3 px-4 w-[38%]">Rule Summary (English)</th>
                <th className="py-3 px-4 w-[38%]">
                  Customer Guidance (Portuguese)
                </th>
                {isSignedIn && (
                  <th className="py-3 px-4 w-24 text-right">Edit</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {rules.map((rule) => (
                <tr
                  key={rule.id}
                  className={
                    rule.isPrimary
                      ? "bg-orange-50/55 dark:bg-[#EE4D2D]/12 hover:bg-orange-50/80 dark:hover:bg-[#EE4D2D]/20 transition-colors"
                      : "hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  }
                >
                  <td className="py-3.5 px-4 align-top font-medium text-slate-900 dark:text-slate-100 text-xs">
                    <div>{rule.topic}</div>
                    {rule.isPrimary && (
                      <div className="text-[11px] font-semibold text-[#EE4D2D] mt-0.5">
                        Primary store rule
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 align-top text-slate-600 dark:text-slate-400 leading-relaxed">
                    {rule.english}
                  </td>
                  <td className="py-3.5 px-4 align-top text-slate-900 dark:text-slate-100 leading-relaxed">
                    {rule.portuguese}
                  </td>
                  {isSignedIn && (
                    <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditForm(rule)}
                          title="Edit rule"
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-[#EE4D2D] rounded hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void onDeleteRule(rule.id)}
                          title="Delete rule"
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
