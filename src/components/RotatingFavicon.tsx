import { useEffect } from "react";
import pastorIcon from "../assets/ea-pastor-icon.png";
import analystIcon from "../assets/ea-dataanalyst-icon.png";
import writerIcon from "../assets/ea-writer-icon.png";

/** Same order and cadence as `Navbar` logo rotation */
const ICONS = [pastorIcon, analystIcon, writerIcon] as const;
const ROTATE_MS = 5000;

/** Output size for favicon / touch icon (browser scales tab icon down). */
const OUT_PX = 320;
/**
 * Extra zoom past “cover” so the mark fills more of the square (source art has padding).
 * Higher = larger graphic in the tab (more edge crop).
 */
const ZOOM = 1.58;

function getOrCreateLink(rel: string, type?: string): HTMLLinkElement {
  const selector = `link[rel="${rel}"]`;
  let el = document.querySelector(selector) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    if (type) el.type = type;
    document.head.appendChild(el);
  } else if (type) {
    el.type = type;
  }
  return el;
}

function iconSrcToZoomedPngDataUrl(src: string, size: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      if (!iw || !ih) {
        reject(new Error("Invalid image size"));
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("No canvas context"));
        return;
      }

      const cover = Math.max(size / iw, size / ih);
      const scale = cover * ZOOM;
      const dw = iw * scale;
      const dh = ih * scale;
      const dx = (size - dw) / 2;
      const dy = (size - dh) / 2;

      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(img, dx, dy, dw, dh);

      let dataUrl: string;
      try {
        dataUrl = canvas.toDataURL("image/png");
      } catch {
        reject(new Error("toDataURL failed"));
        return;
      }
      resolve(dataUrl);
    };
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

/**
 * Cycles the browser tab favicon (and apple-touch-icon) through pastor → analyst → writer PNGs.
 * Renders each source into a larger square so the mark reads bigger in the tab.
 */
export default function RotatingFavicon() {
  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const favicon = getOrCreateLink("icon", "image/png");
    const apple = getOrCreateLink("apple-touch-icon", "image/png");
    favicon.setAttribute("sizes", `${OUT_PX}x${OUT_PX}`);
    apple.setAttribute("sizes", `${OUT_PX}x${OUT_PX}`);

    void (async () => {
      let dataUrls: string[];
      try {
        dataUrls = await Promise.all(
          ICONS.map((src) => iconSrcToZoomedPngDataUrl(src, OUT_PX))
        );
      } catch {
        dataUrls = [...ICONS];
      }

      if (cancelled) return;

      let index = 0;
      const apply = () => {
        const href = dataUrls[index];
        favicon.href = href;
        apple.href = href;
      };

      apply();
      intervalId = window.setInterval(() => {
        index = (index + 1) % dataUrls.length;
        apply();
      }, ROTATE_MS);
    })();

    return () => {
      cancelled = true;
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
  }, []);

  return null;
}
