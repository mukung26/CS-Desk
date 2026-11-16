import React, { useMemo, useState } from "react";
import {
  Check,
  Copy,
  Download,
  Maximize2,
  Search,
} from "lucide-react";
import {
  REFUND_SLA_ROWS,
  VISUAL_GUIDES,
  VISUAL_GUIDE_CATEGORIES,
  type VisualGuide,
  type VisualGuideCategory,
} from "../../shared/visualGuides";
import { copyToClipboard } from "../utils/clipboard";
import { copyImageToClipboard, downloadImageFile } from "../utils/imageClipboard";
import { GuideThumbnail, VisualGuideModal } from "./VisualGuideStrip";

export const VisualGuidesGallery: React.FC = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<VisualGuideCategory>("All");
  const [previewGuide, setPreviewGuide] = useState<VisualGuide | null>(null);
  const [statusKey, setStatusKey] = useState<string | null>(null);
  const [blockedId, setBlockedId] = useState<string | null>(null);

  const markStatus = (key: string) => {
    setStatusKey(key);
    window.setTimeout(() => {
      setStatusKey((prev) => (prev === key ? null : prev));
    }, 1800);
  };

  const filteredGuides = useMemo(() => {
    const q = search.trim().toLowerCase();
    return VISUAL_GUIDES.filter((g) => {
      const matchesCat = category === "All" || g.category === category;
      if (!matchesCat) return false;
      if (!q) return true;
      return (
        g.title.toLowerCase().includes(q) ||
        g.titlePt.toLowerCase().includes(q) ||
        g.whenToSend.toLowerCase().includes(q) ||
        g.summaryPt.toLowerCase().includes(q) ||
        g.keywords.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [search, category]);

  const handleCopyFullSlaPt = async () => {
    const slaSummaryPt = REFUND_SLA_ROWS.map(
      (r) => `• ${r.methodPt}: ${r.destinationPt} — ${r.timeframePt}`
    ).join("\n");
    const ok = await copyToClipboard(
      `Confira os prazos oficiais de reembolso da Shopee por método de pagamento:\n${slaSummaryPt}`
    );
    if (ok) markStatus("sla-pt");
  };

  return (
    <div className="space-y-6">
      {/* Header & Search Filter */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Shopee Brazil Customer Visual Guides
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Official Portuguese step-by-step screenshots and Refund SLA table ready to copy-paste (<span className="font-mono text-xs">Ctrl+V</span>) or download for Shopee Chat.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
            {filteredGuides.length} of {VISUAL_GUIDES.length} guides
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search guides (Pix, reembolso, cupom, endereço, cancelar)..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-950 focus:border-[#EE4D2D] focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {VISUAL_GUIDE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  category === cat
                    ? "border-[#EE4D2D] bg-[#EE4D2D] text-white"
                    : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#EE4D2D] hover:text-[#EE4D2D]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Guides Grid */}
      {filteredGuides.length === 0 ? (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center space-y-2">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
            No matching visual guides
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Try clearing your search filter or switching to All categories.
          </p>
        </section>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredGuides.map((guide) => (
            <article
              key={guide.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col"
            >
              <button
                type="button"
                onClick={() => setPreviewGuide(guide)}
                className="relative w-full h-56 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 group cursor-pointer overflow-hidden"
              >
                <GuideThumbnail guide={guide} className="w-full h-full p-2" />
                <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-white bg-slate-900/80 rounded-md opacity-90 group-hover:bg-[#EE4D2D] transition-colors">
                  <Maximize2 className="w-3 h-3" />
                  Zoom
                </span>
              </button>

              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {guide.category} · {guide.titlePt}
                  </div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {guide.title}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {guide.whenToSend}
                  </p>
                  <ul className="pt-1 space-y-1 text-xs text-slate-700 dark:text-slate-300">
                    {guide.uiStepsPt.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  {blockedId === guide.id && (
                    <p className="text-[11px] text-amber-700 dark:text-amber-300">
                      Clipboard image permission blocked—use Download PNG and upload directly in Shopee Chat.
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        setBlockedId(null);
                        const res = await copyImageToClipboard(guide.imagePath);
                        if (res === "copied") {
                          markStatus(`${guide.id}-img`);
                        } else {
                          setBlockedId(guide.id);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#EE4D2D] hover:bg-[#d94123] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {statusKey === `${guide.id}-img` ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Copied Image
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy Image
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await copyToClipboard(guide.summaryPt);
                        if (ok) markStatus(`${guide.id}-pt`);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-[#EE4D2D] hover:text-[#EE4D2D] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {statusKey === `${guide.id}-pt` ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          Copied PT Caption
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy PT Caption
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void downloadImageFile(guide.imagePath, guide.fileName)
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      PNG
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* Official Refund SLA Reference Table */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Official Shopee Brazil Refund SLA Reference
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Exact timeframes by payment method (automatically enforced in Reply Generator &amp; Chat Flow).
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleCopyFullSlaPt()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#EE4D2D] hover:bg-[#d94123] rounded-lg transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto cursor-pointer"
          >
            {statusKey === "sla-pt" ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Copied All SLAs (PT)
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy SLA Summary (PT)
              </>
            )}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-2.5 px-4">Payment Method</th>
                <th className="py-2.5 px-4">Where Refund Goes (PT-BR)</th>
                <th className="py-2.5 px-4">Timeframe (PT-BR)</th>
                <th className="py-2.5 px-4">English Meaning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {REFUND_SLA_ROWS.map((row) => (
                <tr
                  key={row.methodPt}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                    {row.methodPt}
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                    {row.destinationPt}
                  </td>
                  <td className="py-3 px-4 font-medium text-[#EE4D2D] tabular-nums">
                    {row.timeframePt}
                  </td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400 tabular-nums">
                    {row.timeframeEn}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <VisualGuideModal
        guide={previewGuide}
        onClose={() => setPreviewGuide(null)}
      />
    </div>
  );
};
