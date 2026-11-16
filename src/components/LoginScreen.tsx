import React from "react";
import { AlertCircle, Cloud, Lock, Moon, Sun } from "lucide-react";

interface LoginScreenProps {
  isSigningIn: boolean;
  error: string | null;
  isDark: boolean;
  onToggleDark: () => void;
  onSignIn: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  isSigningIn,
  error,
  isDark,
  onToggleDark,
  onSignIn,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <header className="h-14 px-4 sm:px-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0">
          Atendimento BR
        </span>

        <button
          type="button"
          onClick={onToggleDark}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-[#EE4D2D] hover:text-[#EE4D2D] transition-colors cursor-pointer"
        >
          {isDark ? (
            <>
              <Sun className="w-3.5 h-3.5" />
              Light Mode
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5" />
              Dark Mode
            </>
          )}
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-[#EE4D2D]">
              <Lock className="w-3.5 h-3.5" />
              Shopee Brazil CS Workspace
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Sign in to Atendimento BR
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Log in with your Google account to access the Reply Generator, Chat Flow, and your cloud-synced Script Library and Store Rules.
            </p>
          </div>

          <div className="border-t border-b border-slate-200 dark:border-slate-800 py-4 space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-start gap-2.5">
              <Cloud className="w-4 h-4 text-[#EE4D2D] shrink-0 mt-0.5" />
              <span>
                <strong className="font-medium text-slate-900 dark:text-slate-200">
                  Cloud Script Library &amp; Store Rules:
                </strong>{" "}
                All 16+ bilingual scripts, generalized self-learned scenarios, and policy rules sync across every PC.
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <Cloud className="w-4 h-4 text-[#EE4D2D] shrink-0 mt-0.5" />
              <span>
                <strong className="font-medium text-slate-900 dark:text-slate-200">
                  Saved Chat Flow Sessions:
                </strong>{" "}
                Resume multi-turn customer conversations anytime without losing context.
              </span>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-200 dark:border-red-900/70 bg-red-50 dark:bg-red-950/50 px-3.5 py-2.5 text-xs text-red-800 dark:text-red-300">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            disabled={isSigningIn}
            onClick={onSignIn}
            className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3 text-sm font-medium text-white bg-[#EE4D2D] hover:bg-[#d94123] disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z"
              />
            </svg>
            {isSigningIn ? "Signing in with Google..." : "Continue with Google"}
          </button>
        </div>
      </main>
    </div>
  );
};
