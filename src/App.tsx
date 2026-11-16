/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from "react";
import { Search, Menu, X, Cloud, LogOut, AlertCircle } from "lucide-react";
import { onAuthStateChanged, User } from "firebase/auth";
import { INITIAL_SCENARIOS } from "./data/scenarios";
import { DEFAULT_STORE_RULES } from "./data/defaultStoreRules";
import {
  AppliedRuleChange,
  ChatFlowSessionEntry,
  LearnedRuleUpdate,
  ScenarioCategory,
  ScriptScenario,
  StoreRuleEntry,
} from "./types/cs";
import { ReplyGenerator } from "./components/ReplyGenerator";
import { ChatFlow } from "./components/ChatFlow";
import { ScriptLibrary } from "./components/ScriptLibrary";
import { StoreRules } from "./components/StoreRules";
import {
  auth,
  signInWithGooglePopup,
  signOutFirebase,
} from "./firebase";
import {
  applyLearnedStoreRuleUpdates,
  createCloudCustomScript,
  createCloudStoreRule,
  deleteCloudChatFlowSession,
  deleteCloudCustomScript,
  deleteCloudStoreRule,
  resetCloudStoreRulesToDefaults,
  saveCloudChatFlowSession,
  seedDefaultCloudStoreRulesIfEmpty,
  subscribeChatFlowSessions,
  subscribeCustomScripts,
  subscribeStoreRules,
  updateCloudCustomScript,
  updateCloudStoreRule,
  upsertCloudUserAccount,
} from "./services/cloudStorage";

type ActiveTab = "generator" | "chatflow" | "library" | "rules";

const CATEGORY_FILTERS: ScenarioCategory[] = [
  ScenarioCategory.ALL,
  ScenarioCategory.REFUND,
  ScenarioCategory.DELIVERY,
  ScenarioCategory.DELAYED,
  ScenarioCategory.PRODUCT,
  ScenarioCategory.PLATFORM,
];

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("generator");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);

  const [sidebarSearch, setSidebarSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ScenarioCategory>(
    ScenarioCategory.ALL
  );
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(
    null
  );

  const [customScenarios, setCustomScenarios] = useState<ScriptScenario[]>([]);
  const [savedChatFlows, setSavedChatFlows] = useState<ChatFlowSessionEntry[]>([]);
  const [storeRules, setStoreRules] =
    useState<StoreRuleEntry[]>(DEFAULT_STORE_RULES);

  const [prefillInput, setPrefillInput] = useState("");
  const [chatFlowPrefill, setChatFlowPrefill] = useState("");
  const [generatorResetKey, setGeneratorResetKey] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      setCustomScenarios([]);
      setSavedChatFlows([]);
      setStoreRules(DEFAULT_STORE_RULES);
      setIsSyncingCloud(false);
      return;
    }

    setIsSyncingCloud(true);
    setCloudError(null);

    let scriptsLoaded = false;
    let rulesLoaded = false;
    let flowsLoaded = false;
    const markDone = () => {
      if (scriptsLoaded && rulesLoaded && flowsLoaded) {
        setIsSyncingCloud(false);
      }
    };

    void upsertCloudUserAccount(user).catch((err: unknown) => {
      console.warn("Unable to sync user account profile:", err);
    });

    void seedDefaultCloudStoreRulesIfEmpty(user.uid).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      setCloudError(
        msg.includes("Quota exceeded")
          ? "Cloud Firestore daily free-tier quota exceeded. It will reset tomorrow."
          : "Unable to initialize Cloud Store Rules."
      );
    });

    const unsubScripts = subscribeCustomScripts(
      user.uid,
      INITIAL_SCENARIOS.length,
      (items) => {
        scriptsLoaded = true;
        setCustomScenarios(items);
        markDone();
      }
    );

    const unsubRules = subscribeStoreRules(user.uid, (items) => {
      rulesLoaded = true;
      setStoreRules(items.length > 0 ? items : DEFAULT_STORE_RULES);
      markDone();
    });

    const unsubFlows = subscribeChatFlowSessions(user.uid, (items) => {
      flowsLoaded = true;
      setSavedChatFlows(items);
      markDone();
    });

    return () => {
      unsubScripts();
      unsubRules();
      unsubFlows();
    };
  }, [authReady, user]);

  const handleSignIn = async () => {
    setCloudError(null);
    try {
      await signInWithGooglePopup();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sign-in cancelled.";
      if (msg.includes("popup-closed-by-user") || msg.includes("cancelled-popup-request")) {
        return;
      }
      if (msg.includes("unauthorized-domain")) {
        const host = window.location.hostname;
        setCloudError(
          `Domain "${host}" is not authorized for Google Sign-In yet. Add "${host}" in Firebase Console → Authentication → Settings → Authorized domains.`
        );
        return;
      }
      if (msg.includes("popup-blocked")) {
        setCloudError("Sign-in popup was blocked by your browser. Please allow popups for this site and try again.");
        return;
      }
      if (msg.includes("operation-not-allowed")) {
        setCloudError(
          "Google Sign-In provider is disabled in Firebase. Enable Google under Firebase Console → Authentication → Sign-in method."
        );
        return;
      }
      setCloudError(`Google Sign-In failed (${msg}).`);
    }
  };

  const handleSignOut = async () => {
    setCloudError(null);
    await signOutFirebase();
  };

  const allScenarios = useMemo(
    () => [...INITIAL_SCENARIOS, ...customScenarios],
    [customScenarios]
  );

  const filteredScenarios = useMemo(() => {
    const q = sidebarSearch.trim().toLowerCase();
    return allScenarios.filter((s) => {
      const matchesCat =
        categoryFilter === ScenarioCategory.ALL || s.category === categoryFilter;
      if (!matchesCat) return false;
      if (!q) return true;
      return (
        s.title.toLowerCase().includes(q) ||
        s.whenToUse.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
      );
    });
  }, [allScenarios, categoryFilter, sidebarSearch]);

  const handleApplyLearnedRules = async (
    updates: LearnedRuleUpdate[]
  ): Promise<AppliedRuleChange[]> => {
    if (!user || updates.length === 0) return [];
    setCloudError(null);
    try {
      return await applyLearnedStoreRuleUpdates(user.uid, storeRules, updates);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update Store Rules.";
      setCloudError(
        msg.includes("Quota exceeded")
          ? "Cloud Firestore daily free-tier quota exceeded. Quota resets tomorrow."
          : "Unable to save learned Store Rule updates to Cloud Firestore."
      );
      return [];
    }
  };

  const handleAddCustomScenario = async (
    scenario: Omit<ScriptScenario, "id" | "number">
  ) => {
    if (!user) {
      await handleSignIn();
      return;
    }
    setCloudError(null);
    try {
      const newId = await createCloudCustomScript(user.uid, scenario);
      setSelectedScenarioId(newId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save script.";
      setCloudError(
        msg.includes("Quota exceeded")
          ? "Cloud Firestore daily free-tier quota exceeded."
          : "Unable to save custom script to Cloud Firestore."
      );
    }
  };

  const handleUpdateCustomScenario = async (
    id: string,
    scenario: Omit<ScriptScenario, "id" | "number">
  ) => {
    if (!user) {
      await handleSignIn();
      return;
    }
    setCloudError(null);
    try {
      await updateCloudCustomScript(user.uid, id, scenario);
    } catch {
      setCloudError("Unable to update custom script in Cloud Firestore.");
    }
  };

  const handleDeleteCustomScenario = async (id: string) => {
    if (!user) return;
    setCloudError(null);
    try {
      await deleteCloudCustomScript(user.uid, id);
      if (selectedScenarioId === id) {
        setSelectedScenarioId(null);
      }
    } catch {
      setCloudError("Unable to delete custom script from Cloud Firestore.");
    }
  };

  const handleSelectScenarioFromSidebar = (scenario: ScriptScenario) => {
    setSelectedScenarioId(scenario.id);
    setActiveTab("library");
    setMobileSidebarOpen(false);
  };

  const handleNewCase = () => {
    setPrefillInput("");
    setChatFlowPrefill("");
    setGeneratorResetKey((k) => k + 1);
    setActiveTab("generator");
    setMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Bar — 3-Zone Contract */}
      <header className="sticky top-0 z-30 h-14 bg-white border-b border-slate-200 px-4 lg:px-6 flex items-center justify-between gap-4">
        {/* Zone 1: Single text wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen((v) => !v)}
            aria-label="Toggle scenarios sidebar"
            className="lg:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100 cursor-pointer"
          >
            {mobileSidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("generator");
            }}
            className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            Atendimento BR
          </a>
        </div>

        {/* Zone 2: Single-line nav links */}
        <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("generator")}
            className={`py-4 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === "generator"
                ? "border-[#EE4D2D] text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Reply Generator
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("chatflow")}
            className={`py-4 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === "chatflow"
                ? "border-[#EE4D2D] text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Chat Flow
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedScenarioId(null);
              setActiveTab("library");
            }}
            className={`py-4 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === "library"
                ? "border-[#EE4D2D] text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Script Library
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("rules")}
            className={`py-4 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === "rules"
                ? "border-[#EE4D2D] text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Store Rules
          </button>
        </nav>

        {/* Zone 3: Cloud Sign-In + New Case */}
        <div className="flex items-center gap-2 shrink-0">
          {authReady &&
            (user ? (
              <div className="hidden sm:flex items-center gap-2 pr-1">
                <span
                  title={user.email || "Signed in"}
                  className="text-xs text-slate-600 max-w-[140px] truncate"
                >
                  {user.email}
                </span>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  title="Sign out"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => void handleSignIn()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:border-[#EE4D2D] hover:text-[#EE4D2D] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Cloud className="w-3.5 h-3.5" />
                Cloud Sign In
              </button>
            ))}

          <button
            type="button"
            onClick={handleNewCase}
            className="px-4 py-1.5 text-xs font-medium text-white bg-[#EE4D2D] hover:bg-[#d94123] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            New Case
          </button>
        </div>
      </header>

      {/* Mobile Nav Tabs */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-2">
          {(
            [
              ["generator", "Generator"],
              ["chatflow", "Chat Flow"],
              ["library", "Scripts"],
              ["rules", "Rules"],
            ] as Array<[ActiveTab, string]>
          ).map(([tabKey, label]) => (
            <button
              key={tabKey}
              type="button"
              onClick={() => setActiveTab(tabKey)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === tabKey
                  ? "bg-[#EE4D2D]/10 text-[#EE4D2D]"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {authReady && user && (
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="px-2.5 py-1 text-xs text-slate-500 border border-slate-200 rounded-md whitespace-nowrap shrink-0 cursor-pointer"
          >
            Sign Out
          </button>
        )}
      </div>

      {/* Main Workspace Layout: Sidebar + Content */}
      <div className="flex-1 flex relative">
        {/* Left Sidebar */}
        <aside
          className={`${
            mobileSidebarOpen
              ? "flex fixed top-14 bottom-0 left-0 z-20 shadow-lg"
              : "hidden"
          } lg:flex flex-col w-72 shrink-0 bg-white border-r border-slate-200 lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] overflow-hidden`}
        >
          <div className="p-4 border-b border-slate-200 space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-slate-900">
                CS Scenarios
              </h2>
              <span className="text-xs text-slate-500 tabular-nums">
                {filteredScenarios.length} of {allScenarios.length}
              </span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                placeholder="Filter scenarios..."
                className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#EE4D2D] focus:outline-none"
              />
            </div>

            {/* Interactive Category Filter */}
            <div className="flex flex-wrap gap-1">
              {CATEGORY_FILTERS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    categoryFilter === cat
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2.5 space-y-1">
            {filteredScenarios.length === 0 ? (
              <p className="text-xs text-slate-500 px-2 py-4 text-center">
                No matching scenarios.
              </p>
            ) : (
              filteredScenarios.map((scenario) => {
                const isSelected =
                  activeTab === "library" && selectedScenarioId === scenario.id;
                return (
                  <button
                    key={scenario.id}
                    type="button"
                    onClick={() => handleSelectScenarioFromSidebar(scenario)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-orange-50/70 border-[#EE4D2D]/40 text-slate-900"
                        : "border-transparent hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-[11px] tabular-nums text-slate-400 shrink-0">
                        {String(scenario.number).padStart(2, "0")}
                      </span>
                      <span className="text-xs font-medium leading-snug">
                        {scenario.title}
                      </span>
                    </div>
                    <div className="mt-1 pl-5 text-[11px] text-slate-500">
                      {scenario.category} · {scenario.rows.length} sentences
                      {scenario.isCustom ? " · Cloud" : ""}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Main Content Viewport */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-4">
          {/* Cloud Sync Banner when signed out */}
          {authReady && !user && (
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <Cloud className="w-4 h-4 text-[#EE4D2D] shrink-0" />
                <span>
                  Sign in with Google to save &amp; sync your{" "}
                  <strong>Script Library</strong>,{" "}
                  <strong>Chat Flow</strong>, and{" "}
                  <strong>Store Rules</strong> (including auto-learned rules) in Cloud Firestore across any PC.
                </span>
              </div>
              <button
                type="button"
                onClick={() => void handleSignIn()}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#EE4D2D] hover:bg-[#d94123] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Sign in with Google
              </button>
            </div>
          )}

          {cloudError && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{cloudError}</span>
            </div>
          )}

          {activeTab === "generator" && (
            <ReplyGenerator
              key={generatorResetKey}
              scenarios={allScenarios}
              storeRules={storeRules}
              isSignedIn={Boolean(user)}
              onSignIn={() => void handleSignIn()}
              prefillInput={prefillInput}
              onClearPrefill={() => setPrefillInput("")}
              onApplyLearnedRules={handleApplyLearnedRules}
              onOpenStoreRules={() => setActiveTab("rules")}
              onOpenInChatFlow={(rawText) => {
                setChatFlowPrefill(rawText);
                setActiveTab("chatflow");
              }}
            />
          )}

          {activeTab === "chatflow" && (
            <ChatFlow
              scenarios={allScenarios}
              storeRules={storeRules}
              isSignedIn={Boolean(user)}
              onSignIn={() => void handleSignIn()}
              prefillInput={chatFlowPrefill}
              onClearPrefill={() => setChatFlowPrefill("")}
              savedSessions={savedChatFlows}
              onSaveChatFlowSession={async (existingFlowId, session) => {
                if (!user) return null;
                return saveCloudChatFlowSession(user.uid, existingFlowId, session);
              }}
              onDeleteChatFlowSession={async (flowId) => {
                if (user) await deleteCloudChatFlowSession(user.uid, flowId);
              }}
            />
          )}

          {activeTab === "library" && (
            <ScriptLibrary
              scenarios={filteredScenarios}
              selectedScenarioId={selectedScenarioId}
              isSignedIn={Boolean(user)}
              onSignIn={() => void handleSignIn()}
              onSelectScenario={setSelectedScenarioId}
              onUseInGenerator={(sample) => {
                setPrefillInput(sample);
                setActiveTab("generator");
              }}
              onAddCustomScenario={handleAddCustomScenario}
              onUpdateCustomScenario={handleUpdateCustomScenario}
              onDeleteCustomScenario={handleDeleteCustomScenario}
            />
          )}

          {activeTab === "rules" && (
            <StoreRules
              rules={storeRules}
              isSignedIn={Boolean(user)}
              isSyncing={isSyncingCloud}
              onSignIn={() => void handleSignIn()}
              onAddRule={async (rule) => {
                if (user) await createCloudStoreRule(user.uid, rule);
              }}
              onUpdateRule={async (id, rule) => {
                if (user) await updateCloudStoreRule(user.uid, id, rule);
              }}
              onDeleteRule={async (id) => {
                if (user) await deleteCloudStoreRule(user.uid, id);
              }}
              onResetDefaults={async () => {
                if (user) await resetCloudStoreRulesToDefaults(user.uid);
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}
