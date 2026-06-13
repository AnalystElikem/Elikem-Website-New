import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  getDocument,
  GlobalWorkerOptions,
  type PDFDocumentProxy,
} from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = pdfWorker;

type PdfPageCanvasProps = {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  maxWidth: number;
  maxHeight?: number;
};

function PdfPageCanvas({
  pdf,
  pageNumber,
  maxWidth,
  maxHeight,
}: PdfPageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const taskRef = useRef<{ cancel: () => void } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || maxWidth < 48) return;

    let cancelled = false;

    (async () => {
      const page = await pdf.getPage(pageNumber);
      if (cancelled) return;

      const baseViewport = page.getViewport({ scale: 1 });
      const scaleW = maxWidth / baseViewport.width;
      const scaleH =
        maxHeight && maxHeight > 48 ? maxHeight / baseViewport.height : Infinity;
      const scale = Math.min(scaleW, scaleH) * 0.98;
      const viewport = page.getViewport({ scale });

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const renderTask = page.render({
        canvas,
        canvasContext: ctx,
        viewport,
      });
      taskRef.current = renderTask;
      try {
        await renderTask.promise;
      } catch (e: unknown) {
        const name = e instanceof Error ? e.name : "";
        if (name !== "RenderingCancelledException" && !cancelled) {
          console.warn("[BookPdfViewer] render", e);
        }
      }
    })();

    return () => {
      cancelled = true;
      taskRef.current?.cancel();
      taskRef.current = null;
    };
  }, [pdf, pageNumber, maxWidth, maxHeight]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: "block",
        margin: "0 auto",
        border: "1px solid #bfbbb3",
        background: "#fff",
      }}
    />
  );
}

const navBtn: CSSProperties = {
  flexShrink: 0,
  width: "44px",
  height: "44px",
  borderRadius: 0,
  border: "1px solid #bfbbb3",
  background: "#fff",
  color: "#4b5a45",
  fontSize: "20px",
  lineHeight: 1,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "background-color 0.15s ease, border-color 0.15s ease, opacity 0.15s ease",
};

type BookPdfViewerProps = {
  /** URL of the PDF file to display (same origin as the site). */
  url: string;
};

export default function BookPdfViewer({ url }: BookPdfViewerProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [maxWidth, setMaxWidth] = useState(640);
  const [maxHeight, setMaxHeight] = useState<number | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    let loaded: PDFDocumentProxy | null = null;

    setLoading(true);
    setError(null);
    setPdf(null);
    setCurrentPage(1);

    const loadingTask = getDocument({
      url,
      withCredentials: false,
    });

    loadingTask.promise
      .then((doc) => {
        if (cancelled) {
          void doc.destroy();
          return;
        }
        loaded = doc;
        setPdf(doc);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load the PDF preview. Try Download below.");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      void loadingTask.destroy();
      if (loaded) {
        void loaded.destroy();
        loaded = null;
      }
    };
  }, [url]);

  const numPages = pdf?.numPages ?? 0;
  const multiPage = numPages > 1;

  const goPrev = useCallback(() => {
    setCurrentPage((p) => Math.max(1, p - 1));
  }, []);

  const goNext = useCallback(() => {
    setCurrentPage((p) => (numPages ? Math.min(numPages, p + 1) : p));
  }, [numPages]);

  useEffect(() => {
    if (!multiPage) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrentPage((p) => Math.max(1, p - 1));
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setCurrentPage((p) => Math.min(numPages, p + 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [multiPage, numPages]);

  useEffect(() => {
    setCurrentPage((p) => (numPages ? Math.min(Math.max(1, p), numPages) : 1));
  }, [numPages]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const update = () => {
      const w = el.clientWidth;
      setMaxWidth(Math.max(160, Math.floor(w - 24)));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const update = () => {
      const h = stage.clientHeight;
      setMaxHeight(h > 80 ? Math.floor(h - 16) : undefined);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [pdf]);

  const atFirst = currentPage <= 1;
  const atLast = numPages > 0 && currentPage >= numPages;

  return (
    <div
      ref={wrapRef}
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "#e8e6e1",
        boxSizing: "border-box",
      }}
    >
      {loading ? (
        <p
          style={{
            padding: "32px 16px",
            textAlign: "center",
            color: "#6f6c64",
            fontSize: "13px",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          Opening book…
        </p>
      ) : null}
      {error ? (
        <p
          style={{
            padding: "32px 16px",
            textAlign: "center",
            color: "#8a4a4a",
            fontSize: "14px",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {error}
        </p>
      ) : null}
      {pdf && !error ? (
        <>
          <div
            ref={stageRef}
            style={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: multiPage ? "8px" : "0",
              padding: multiPage ? "8px 6px" : "12px 8px",
              boxSizing: "border-box",
            }}
          >
            {multiPage ? (
              <button
                type="button"
                aria-label="Previous page"
                disabled={atFirst}
                onClick={goPrev}
                style={{
                  ...navBtn,
                  opacity: atFirst ? 0.45 : 1,
                  cursor: atFirst ? "default" : "pointer",
                  borderColor: atFirst ? "#dcd8cf" : "#bfbbb3",
                }}
              >
                ‹
              </button>
            ) : null}

            <div
              style={{
                flex: 1,
                minWidth: 0,
                minHeight: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "auto",
                WebkitOverflowScrolling: "touch",
              }}
            >
              <PdfPageCanvas
                key={`${url}-p${currentPage}`}
                pdf={pdf}
                pageNumber={currentPage}
                maxWidth={multiPage ? maxWidth - 120 : maxWidth}
                maxHeight={maxHeight}
              />
            </div>

            {multiPage ? (
              <button
                type="button"
                aria-label="Next page"
                disabled={atLast}
                onClick={goNext}
                style={{
                  ...navBtn,
                  opacity: atLast ? 0.45 : 1,
                  cursor: atLast ? "default" : "pointer",
                  borderColor: atLast ? "#dcd8cf" : "#bfbbb3",
                }}
              >
                ›
              </button>
            ) : null}
          </div>

          {multiPage ? (
            <div
              style={{
                flexShrink: 0,
                textAlign: "center",
                padding: "10px 12px 12px",
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#6f6c64",
                borderTop: "1px solid #dcd8cf",
                background: "#fff",
              }}
            >
              Page {currentPage} of {numPages}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
