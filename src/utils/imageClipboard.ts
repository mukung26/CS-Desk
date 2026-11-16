export type CopyImageResult = "copied" | "unsupported" | "error";

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Unable to load image: ${src}`));
    img.src = src;
  });
}

async function toPngBlob(imagePath: string): Promise<Blob> {
  const res = await fetch(imagePath);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${imagePath}`);
  }
  const rawBlob = await res.blob();
  if (rawBlob.type === "image/png") {
    return rawBlob;
  }

  const objectUrl = URL.createObjectURL(rawBlob);
  try {
    const img = await loadImageElement(objectUrl);
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas 2D context unavailable.");
    }
    ctx.drawImage(img, 0, 0);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas PNG conversion failed."));
      }, "image/png");
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function copyImageToClipboard(
  imagePath: string
): Promise<CopyImageResult> {
  try {
    if (
      typeof navigator === "undefined" ||
      !navigator.clipboard?.write ||
      typeof ClipboardItem === "undefined"
    ) {
      return "unsupported";
    }
    const pngBlob = await toPngBlob(imagePath);
    await navigator.clipboard.write([
      new ClipboardItem({
        "image/png": pngBlob,
      }),
    ]);
    return "copied";
  } catch (err) {
    const name = err instanceof Error ? err.name : "";
    if (name === "NotAllowedError" || name === "SecurityError") {
      return "unsupported";
    }
    return "error";
  }
}

export async function downloadImageFile(
  imagePath: string,
  fileName: string
): Promise<void> {
  const res = await fetch(imagePath);
  if (!res.ok) {
    throw new Error(`Unable to download ${fileName}`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    URL.revokeObjectURL(url);
  }
}
