import React, { useEffect, useState } from "react";
import {
  Check,
  Copy,
  Download,
  Image as ImageIcon,
  Maximize2,
  X,
} from "lucide-react";
import { VISUAL_GUIDE_BY_ID, type VisualGuide } from "../../shared/visualGuides";
import { copyToClipboard } from "../utils/clipboard";
import { copyImageToClipboard, downloadImageFile } from "../utils/imageClipboard";

interface GuideThumbnailProps {
  guide: VisualGuide;
  className?: string;
}

export const GuideThumbnail: React.FC<GuideThumbnailProps> = ({
  guide,
  className = "h-32 w-full",
}) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`${className} flex flex-col items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 px-3 text-center`}
      >
        <ImageIcon className="w-5 h-5" />
        <span className="text-[11px] font-medium truncate max-w-full">
          {guide.fileName}
        </span>
      </div>
    );
  }

  return (
    <img
      src={guide.imagePath}
      alt={guide.title}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`${className} object-contain bg-slate-100 dark:bg-slate-950`}
    />
  );
};

interface VisualGuideModalProps {
  guide: VisualGuide | null;
  onClose: () => void;
}

export const VisualGuideModal: React.FC<VisualGuideModalProps> = ({
  guide,
  onClose,
}) => {
  const [statusKey, setStatusKey] = useState<string | null>(null);
  const [clipboardBlocked, setClipboardBlocked] = useState(false);

  useEffect(() => {
    if (!guide) return;
    setClipboardBlocked(false);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [guide, onClose]);

  if (!guide) return null;

  const markStatus = (key: string) => {
    setStatusKey(key);
    window.setTimeout(() => {
      setStatusKey((prev) => (prev === key ? null : prev));
    }, 1800);
  };

  const handleCopyImage = async () => {
    setClipboardBlocked(false);
    const res = await copyImageToClipboard(guide.imagePath);
    if (res === "copied") {
      markStatus("img");
    } else {
      setClipboardBlocked(true);
    }
  };

  const handleCopyPtCaption = async () => {
    const ok = await copyToClipboard(guide.summaryPt);
    if (ok) markStatus("pt");
  };

  const handleDownload = async () => {
    await downloadImageFile(guide.imagePath, guide.fileName);
    markStatus("dl");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={guide.title}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {guide.category} · {guide.titlePt}
            </div>
            <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
              {guide.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close guide preview"
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-7 bg-slate-100 dark:bg-slate-950 p-4 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800">
            <GuideThumbnail
              guide={guide}
              className="w-full max-h-[60vh] rounded-lg"
            />
          </div>

          <div className="lg:col-span-5 p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  When to send to CX
                </h3>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {guide.whenToSend}
                </p>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Official Shopee BR App Steps
                </h3>
                <ul className="mt-1.5 space-y-1 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {guide.uiStepsPt.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Ready-to-Send PT-BR Caption
                </h3>
                <p className="mt-1.5 text-xs text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-3 leading-relaxed">
                  {guide.summaryPt}
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              {clipboardBlocked && (
                <p className="text-[11px] text-amber-700 dark:text-amber-300">
                  Browser blocked direct image clipboard copy—use Download PNG and drag/upload into Shopee Chat.
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleCopyImage()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#EE4D2D] hover:bg-[#d94123] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {statusKey === "img" ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Image Copied (Ctrl+V)
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
                  onClick={() => void handleCopyPtCaption()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-[#EE4D2D] hover:text-[#EE4D2D] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {statusKey === "pt" ? (
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
                  onClick={() => void handleDownload()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  {statusKey === "dl" ? "Downloaded" : "Download PNG"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface VisualGuideStripProps {
  guideIds?: string[];
  heading?: string;
  onBrowseAll?: () => void;
}

export const VisualGuideStrip: React.FC<VisualGuideStripProps> = ({
  guideIds,
  heading = "Recommended Shopee BR Visual Guides to Attach",
  onBrowseAll,
}) => {
  const [previewGuide, setPreviewGuide] = useState<VisualGuide | null>(null);
  const [statusKey, setStatusKey] = useState<string | null>(null);
  const [blockedId, setBlockedId] = useState<string | null>(null);

  const guides = (guideIds || [])
    .map((id) => VISUAL_GUIDE_BY_ID[id])
    .filter((g): g is VisualGuide => Boolean(g));

  if (guides.length === 0) return null;

  const markStatus = (key: string) => {
    setStatusKey(key);
    window.setTimeout(() => {
      setStatusKey((prev) => (prev === key ? null : prev));
    }, 1800);
  };

  return (
    <>
      <div className="px-5 sm:px-6 py-4 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
            <ImageIcon className="w-3.5 h-3.5 text-[#EE4D2D]" />
            <span>{heading}</span>
            <span className="font-normal text-slate-500 dark:text-slate-400 tabular-nums">
              · {guides.length}
            </span>
          </div>
          {onBrowseAll && (
            <button
              type="button"
              onClick={onBrowseAll}
              className="text-xs font-medium text-[#EE4D2D] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              Browse all 10 Visual Guides →
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {guides.map((guide) => (
            <div
              key={guide.id}
              className="flex gap-3 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            >
              <button
                type="button"
                onClick={() => setPreviewGuide(guide)}
                title="Preview full image"
                className="relative w-24 h-20 shrink-0 rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 group cursor-pointer"
              >
                <GuideThumbnail guide={guide} className="w-full h-full" />
                <span className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/35 transition-colors flex items-center justify-center">
                  <Maximize2 className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
              </button>

              <div className="min-w-0 flex-1 flex flex-col justify-between gap-2">
                <div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {guide.category} · {guide.titlePt}
                  </div>
                  <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {guide.title}
                  </h3>
                  <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                    {guide.whenToSend}
                  </p>
                </div>

                {blockedId === guide.id && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-300">
                    Clipboard blocked—click PNG download.
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-1.5">
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
                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-white bg-[#EE4D2D] hover:bg-[#d94123] rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {statusKey === `${guide.id}-img` ? (
                      <>
                        <Check className="w-3 h-3" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
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
                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded hover:border-[#EE4D2D] hover:text-[#EE4D2D] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {statusKey === `${guide.id}-pt` ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        PT Copied
                      </>
                    ) : (
                      "PT Caption"
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => void downloadImageFile(guide.imagePath, guide.fileName)}
                    title={`Download ${guide.fileName}`}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    PNG
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <VisualGuideModal
        guide={previewGuide}
        onClose={() => setPreviewGuide(null)}
      />
    </>
  );
};
