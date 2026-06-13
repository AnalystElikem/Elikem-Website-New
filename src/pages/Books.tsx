import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useResponsive from "../hooks/useResponsive";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import bookCoverFallback from "../assets/build-cover.png";

const ink = "#4b5a45";
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

function excerptFromDescription(raw: string, maxLen: number): string {
  if (!raw) return "";
  const text = raw
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen).trim()}…`;
}

export default function Books() {
  const { isMobile } = useResponsive();
  const [books, setBooks] = useState<SiteBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/books/catalog");
        if (!res.ok) throw new Error("Failed to load books");
        const data = (await res.json()) as { books?: SiteBook[] };
        if (!cancelled) setBooks(Array.isArray(data.books) ? data.books : []);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("We couldn’t load the library right now. Please try again later.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div
        className="books-page page-with-fixed-nav"
        style={{
          background: paper,
          minHeight: "100vh",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <Navbar />
        <div style={{ padding: "72px 24px 96px" }}>
          <div className="books-loading-panel">Loading library…</div>
        </div>
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
        <div className="book-read-message" style={{ paddingTop: 56 }}>
          <p style={{ color: "#8a4a4a" }}>{error}</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div
      className="books-page page-with-fixed-nav"
      style={{
        background: paper,
        minHeight: "100vh",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <Navbar />

      <header
        style={{
          maxWidth: "1120px",
          margin: "0 auto",
          padding: isMobile ? "28px 20px 24px" : "40px 40px 28px",
          borderBottom: "1px solid #e0dcd4",
        }}
      >
        <p className="books-eyebrow">Library</p>
        <h1
          style={{
            fontFamily: '"Playfair Display", serif',
            fontWeight: 400,
            fontSize: isMobile ? "34px" : "46px",
            lineHeight: 1.12,
            color: ink,
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          Books
        </h1>
        <p
          style={{
            margin: "18px 0 0",
            maxWidth: "100%",
            whiteSpace: "nowrap",
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            fontSize: isMobile ? "15px" : "16px",
            lineHeight: 1.7,
            color: "#5c5a54",
            fontWeight: 300,
          }}
        >
          Free reads on this site, downloads, Amazon links, and pre-orders—everything in one place.
        </p>
      </header>

      <section
        style={{
          maxWidth: "1120px",
          margin: "0 auto",
          padding: isMobile ? "28px 20px 80px" : "40px 40px 100px",
        }}
      >
        {books.length === 0 ? (
          <div className="books-empty-panel">
            New titles will appear here soon. Check back later.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "1fr"
                : "repeat(auto-fill, minmax(min(100%, 300px), 1fr))",
              gap: isMobile ? "24px" : "32px",
            }}
          >
            {books.map((book) => {
              const cover = book.imageUrl?.trim() ? book.imageUrl : bookCoverFallback;
              const blurb = excerptFromDescription(book.description, 200);
              const readPath = `/books/${encodeURIComponent(book.id)}/read`;
              const preorderPath = `/books/preorder/${encodeURIComponent(book.id)}`;
              const hasHttpFile =
                !!book.bookUrl?.trim() && /^https?:\/\//i.test(book.bookUrl.trim());
              const showFreeActions = book.isFree && hasHttpFile;
              const showAmazon = book.isAmazon && book.amazonUrl?.trim();
              const showPreorder = book.isPreorder;
              const showGenericOpen =
                book.bookUrl?.trim() &&
                !showFreeActions &&
                !showAmazon &&
                !showPreorder;

              return (
                <article key={book.id} className="books-catalog-card">
                  <div className="books-catalog-thumb">
                    <img src={cover} alt={book.bookName} />
                  </div>
                  <div
                    style={{
                      padding: "20px 20px 22px",
                      display: "flex",
                      flexDirection: "column",
                      flex: 1,
                      minHeight: 0,
                    }}
                  >
                    {(book.isFree || book.isAmazon || book.isPreorder) ? (
                      <div className="books-badges">
                        {book.isFree ? (
                          <span className="books-badge books-badge--accent">Free read</span>
                        ) : null}
                        {book.isAmazon ? <span className="books-badge">Amazon</span> : null}
                        {book.isPreorder ? <span className="books-badge">Pre-order</span> : null}
                      </div>
                    ) : null}
                    <h2
                      style={{
                        fontFamily: '"Playfair Display", serif',
                        fontSize: isMobile ? "19px" : "21px",
                        fontWeight: 500,
                        lineHeight: 1.28,
                        color: ink,
                        margin: "0 0 10px",
                      }}
                    >
                      {book.bookName}
                    </h2>
                    {blurb ? (
                      <p
                        style={{
                          fontSize: "14px",
                          lineHeight: 1.65,
                          color: "#5c5a54",
                          margin: "0 0 16px",
                          flex: 1,
                          fontWeight: 300,
                        }}
                      >
                        {blurb}
                      </p>
                    ) : (
                      <div style={{ flex: 1 }} />
                    )}
                    <div className="books-actions">
                      {showFreeActions ? (
                        <>
                          <Link to={readPath} className="books-btn">
                            Read online
                          </Link>
                          <a
                            href={book.bookUrl!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="books-link-quiet"
                            download
                          >
                            Download file
                          </a>
                        </>
                      ) : null}
                      {showAmazon ? (
                        <a
                          href={book.amazonUrl!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="books-btn books-btn--amazon"
                        >
                          Buy on Amazon
                        </a>
                      ) : null}
                      {showPreorder ? (
                        <Link to={preorderPath} className="books-btn books-btn--ghost">
                          Pre-order
                        </Link>
                      ) : null}
                      {showGenericOpen ? (
                        <a
                          href={book.bookUrl!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="books-btn"
                        >
                          Open book
                        </a>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
