import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import useResponsive from "../hooks/useResponsive";

const ink = "#4b5a45";
const muted = "#8a867d";
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

export default function BooksPreorder() {
  const { bookId = "" } = useParams<{ bookId: string }>();
  const { isMobile } = useResponsive();
  const [book, setBook] = useState<SiteBook | null | undefined>(undefined);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

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
        if (!cancelled) setBook(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bookId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!book) return;
    const qtyParsed = Number.parseInt(String(quantity).trim(), 10);
    if (!Number.isFinite(qtyParsed) || qtyParsed < 1 || qtyParsed > 999) {
      setMessage({
        ok: false,
        text: "Please enter a quantity between 1 and 999.",
      });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/books/preorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          book: book.id,
          email,
          full_name: fullName.trim(),
          quantity: qtyParsed,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        reason?: string;
      };
      if (res.ok && data.ok) {
        setMessage({
          ok: true,
          text: "Thank you — your pre-order was recorded. We’ll be in touch at the email you provided.",
        });
      } else {
        const reason = data.reason || "request_failed";
        const text =
          reason === "invalid_email"
            ? "Please enter a valid email address."
            : reason === "missing_full_name"
              ? "Please enter your full name."
              : reason === "full_name_too_long"
                ? "That name is too long. Please shorten it."
                : reason === "invalid_quantity"
                  ? "Please enter a quantity between 1 and 999."
                  : reason === "not_preorder"
                    ? "This title is not open for pre-order."
                    : reason === "book_not_found"
                      ? "This book could not be found."
                      : "Something went wrong. Please try again.";
        setMessage({ ok: false, text });
      }
    } catch {
      setMessage({ ok: false, text: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  if (book === undefined) {
    return (
      <div className="page-with-fixed-nav" style={{ background: paper, minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>
        <Navbar />
        <p style={{ padding: "80px 24px", textAlign: "center", color: muted }}>Loading…</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="page-with-fixed-nav" style={{ background: paper, minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>
        <Navbar />
        <div style={{ padding: "80px 24px", textAlign: "center", color: muted }}>
          <p>Book not found.</p>
          <Link to="/books" style={{ color: ink, fontWeight: 500 }}>
            ← Back to Books
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const preorderOpen = book.isPreorder;

  return (
    <div
      className="page-with-fixed-nav"
      style={{
        background: paper,
        minHeight: "100vh",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <Navbar />

      <main
        style={{
          maxWidth: "520px",
          margin: "0 auto",
          padding: isMobile ? "32px 20px 64px" : "48px 24px 80px",
        }}
      >
        <Link
          to="/books"
          style={{
            fontSize: "12px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: ink,
            textDecoration: "none",
            fontWeight: 500,
            display: "inline-block",
            marginBottom: "24px",
          }}
        >
          ← All books
        </Link>

        <h1
          style={{
            fontFamily: '"Playfair Display", serif',
            fontWeight: 400,
            fontSize: isMobile ? "28px" : "34px",
            color: ink,
            margin: "0 0 8px",
            lineHeight: 1.2,
          }}
        >
          Pre-order
        </h1>
        <p style={{ color: "#5c5a54", fontSize: "15px", lineHeight: 1.6, marginBottom: "28px" }}>
          Request a pre-order for the title below. Add your name, how many copies, and your email.
        </p>

        {!preorderOpen ? (
          <p style={{ color: muted, lineHeight: 1.7 }}>
            “{book.bookName}” is not currently offered for pre-order on this site.{" "}
            <Link to="/books" style={{ color: ink }}>
              Browse other books
            </Link>
            .
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: muted,
                marginBottom: "8px",
              }}
            >
              Book
            </label>
            <input
              type="text"
              readOnly
              value={book.bookName}
              aria-readonly
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px 14px",
                marginBottom: "22px",
                border: "1px solid #dcd8cf",
                borderRadius: "4px",
                fontSize: "15px",
                fontFamily: "inherit",
                background: "#f0ede6",
                color: ink,
              }}
            />
            <label
              style={{
                display: "block",
                fontSize: "11px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: muted,
                marginBottom: "8px",
              }}
            >
              Full name
            </label>
            <input
              type="text"
              required
              autoComplete="name"
              value={fullName}
              onChange={(ev) => setFullName(ev.target.value)}
              placeholder="Your full name"
              maxLength={200}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px 14px",
                marginBottom: "22px",
                border: "1px solid #dcd8cf",
                borderRadius: "4px",
                fontSize: "15px",
                fontFamily: "inherit",
              }}
            />
            <label
              style={{
                display: "block",
                fontSize: "11px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: muted,
                marginBottom: "8px",
              }}
            >
              Quantity
            </label>
            <input
              type="number"
              required
              min={1}
              max={999}
              step={1}
              inputMode="numeric"
              value={quantity}
              onChange={(ev) => setQuantity(ev.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px 14px",
                marginBottom: "22px",
                border: "1px solid #dcd8cf",
                borderRadius: "4px",
                fontSize: "15px",
                fontFamily: "inherit",
              }}
            />
            <label
              style={{
                display: "block",
                fontSize: "11px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: muted,
                marginBottom: "8px",
              }}
            >
              Email
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              placeholder="you@example.com"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px 14px",
                marginBottom: "24px",
                border: "1px solid #dcd8cf",
                borderRadius: "4px",
                fontSize: "15px",
                fontFamily: "inherit",
              }}
            />

            {message ? (
              <p
                style={{
                  marginBottom: "16px",
                  color: message.ok ? ink : "#b54a4a",
                  lineHeight: 1.6,
                  fontSize: "14px",
                }}
              >
                {message.text}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="button-primary"
              style={{
                padding: "12px 22px",
                fontSize: "12px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontWeight: 500,
                border: "none",
                cursor: submitting ? "wait" : "pointer",
              }}
            >
              {submitting ? "Sending…" : "Submit pre-order"}
            </button>
          </form>
        )}
      </main>

      <Footer />
    </div>
  );
}
