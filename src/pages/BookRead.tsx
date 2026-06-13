import { lazy, Suspense, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import useResponsive from "../hooks/useResponsive";

function BookPdfViewerLoadFailed() {
  return (
    <div
      style={{
        padding: "32px 20px",
        textAlign: "center",
        color: "#8a4a4a",
        fontSize: "14px",
        lineHeight: 1.55,
        maxWidth: "28rem",
        margin: "0 auto",
      }}
    >
      The PDF reader could not load (often a blocked script or network issue). Try{" "}
      <strong>Download PDF</strong> above, or refresh the page.
    </div>
  );
}

const BookPdfViewer = lazy(() =>
  import("../components/BookPdfViewer").catch((err) => {
    console.error("[BookRead] BookPdfViewer chunk failed:", err);
    return { default: BookPdfViewerLoadFailed };
  }),
);

const paper = "#f5f2eb";

type SiteBook = {
  id: string;
  bookName: string;
  description: string;
  imageUrl: string | null;
  bookUrl: string | null;
  isFree: boolean;
  isAmazon: boolean;
  isPreorder: boolean;
  amazonUrl: string | null;
};

export default function BookRead() {
  const { bookId = "" } = useParams<{ bookId: string }>();
  const { isMobile } = useResponsive();
  const [book, setBook] = useState<SiteBook | null | undefined>(undefined);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!bookId) {
      setBook(null);
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `/api/books/catalog/${encodeURIComponent(bookId)}`,
          { cache: "no-store" }
        );
        if (res.status === 404) {
          if (!cancelled) setBook(null);
          return;
        }
        if (!res.ok) throw new Error("fetch failed");
        const data = (await res.json()) as { book?: SiteBook };
        if (!cancelled) setBook(data.book ?? null);
      } catch {
        if (!cancelled) {
          setError("Could not load this title.");
          setBook(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bookId]);

  if (book === undefined && !error) {
    return (
      <div
        className="books-page page-with-fixed-nav"
        style={{ background: paper, minHeight: "100vh", fontFamily: "Inter, sans-serif" }}
      >
        <Navbar />
        <div style={{ padding: "72px 24px" }}>
          <div className="books-loading-panel">Opening title…</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="books-page page-with-fixed-nav"
        style={{ background: paper, minHeight: "100vh", fontFamily: "Inter, sans-serif" }}
      >
        <Navbar />
        <div className="book-read-message" style={{ paddingTop: 48 }}>
          <p style={{ color: "#8a4a4a" }}>{error}</p>
          <p style={{ margin: 0 }}>
            <Link to="/books">All books</Link>
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  const allowed =
    book &&
    book.isFree &&
    book.bookUrl &&
    /^https?:\/\//i.test(book.bookUrl.trim());

  const streamPath =
    allowed ? `/api/books/read/${encodeURIComponent(book.id)}/stream` : "";

  const notFound = book === null;
  const gated = book !== null && !allowed;

  return (
    <div
      className="books-page page-with-fixed-nav"
      style={{
        background: allowed ? "#fff" : paper,
        fontFamily: "Inter, sans-serif",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        ...(allowed
          ? {
              height: "100dvh",
              maxHeight: "100dvh",
              overflow: "hidden",
              paddingLeft: "env(safe-area-inset-left, 0px)",
              paddingRight: "env(safe-area-inset-right, 0px)",
            }
          : {
              minHeight: "100vh",
            }),
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <Navbar />
      </div>

      {allowed ? (
        <div className="book-read-toolbar">
          <Link to="/books" className="book-read-toolbar__back">
            All books
          </Link>
          <span className="book-read-toolbar__title" title={book.bookName}>
            {book.bookName}
          </span>
          <a
            href={`${streamPath}?attachment=1`}
            download={`${(book.bookName || "book").replace(/["'\\/<>|:*?]/g, "_")}.pdf`}
            className="books-btn books-btn--ghost book-read-toolbar__download"
          >
            Download PDF
          </a>
        </div>
      ) : null}

      {notFound ? (
        <div className="book-read-message">
          <p>We couldn’t find that book.</p>
          <p style={{ margin: 0 }}>
            <Link to="/books">All books</Link>
          </p>
        </div>
      ) : gated ? (
        <div className="book-read-message">
          <p>
            {book && !book.isFree
              ? "This title isn’t marked as a free on-site read."
              : "There’s no file link for this title yet, so it can’t be shown here."}
          </p>
          <p style={{ margin: 0 }}>
            <Link to="/books">Back to books</Link>
          </p>
        </div>
      ) : allowed ? (
        <main
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            width: "100%",
            maxWidth: "1200px",
            margin: "0 auto",
            padding: isMobile ? "0 10px 10px" : "0 16px 16px",
            boxSizing: "border-box",
          }}
        >
          <div className="book-read-stage">
            <Suspense
              fallback={
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#6f6c64",
                    fontSize: "13px",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    background: "#e8e6e1",
                  }}
                >
                  Loading reader…
                </div>
              }
            >
              <BookPdfViewer key={streamPath} url={streamPath} />
            </Suspense>
          </div>
        </main>
      ) : null}

      {!allowed ? <Footer /> : null}
    </div>
  );
}
