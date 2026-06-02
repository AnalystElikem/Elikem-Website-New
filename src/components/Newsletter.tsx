import { useState, useEffect } from "react";
import useResponsive from "../hooks/useResponsive";
import bookCoverFallback from "../assets/build-cover.png";

type GiftBook = {
  bookName: string;
  description: string;
  imageUrl: string | null;
  bookUrl: string | null;
};

const FALLBACK_DESCRIPTION = `A practical framework for building a life with clarity, alignment, and structure — across your work, leadership, and personal calling.

It will help you see clearly, build intentionally, and stay aligned — so what you're building can carry weight and stand the test of time.`;

function GiftDescription({ text, isMobile }: { text: string; isMobile: boolean }) {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const textStyle: React.CSSProperties = {
    fontFamily: "Inter, sans-serif",
    fontSize: isMobile ? "15px" : "16px",
    lineHeight: 1.8,
    opacity: 0.9,
    marginBottom: "20px",
  };
  if (trimmed.startsWith("<")) {
    return (
      <div
        className="free-gift-description-html"
        style={textStyle}
        dangerouslySetInnerHTML={{ __html: trimmed }}
      />
    );
  }
  return (
    <div style={{ ...textStyle, whiteSpace: "pre-wrap" }}>{trimmed}</div>
  );
}

export default function Newsletter() {
  const { isMobile } = useResponsive();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [giftBook, setGiftBook] = useState<GiftBook | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/books/footer/latest", { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) setGiftBook(null);
          return;
        }
        const json = (await res.json()) as { book: GiftBook | null };
        if (cancelled) return;
        setGiftBook(json.book ?? null);
      } catch {
        if (!cancelled) setGiftBook(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/books/gift-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setMessage("You’re in — check your email for next steps on your free book.");
        setEmail("");
      } else {
        const err = await res.json().catch(() => ({}));
        const reason = (err as { reason?: string }).reason;
        if (reason === "no_book") {
          setMessage("This offer isn’t available right now. Please try again later.");
        } else {
          setMessage("Something went wrong. Please try again.");
        }
      }
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isReady = giftBook !== undefined;
  const bookName = giftBook?.bookName?.trim() ?? "";

  const descriptionText =
    !isReady
      ? ""
      : giftBook && giftBook.description?.trim()
        ? giftBook.description.trim()
        : FALLBACK_DESCRIPTION;

  const coverSrc =
    isReady && giftBook?.imageUrl ? giftBook.imageUrl : bookCoverFallback;

  return (
    <div
      style={{
        background: "#5a6248",
        padding: isMobile ? "80px 20px" : "120px 20px",
        color: "white",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1.1fr",
          gap: isMobile ? "40px" : "80px",
          alignItems: "center",
          textAlign: isMobile ? "center" : "left",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            minHeight: isMobile ? "280px" : "400px",
            alignItems: "center",
          }}
        >
          {!isReady ? (
            <div
              aria-hidden
              style={{
                width: isMobile ? "220px" : "350px",
                aspectRatio: "2 / 3",
                maxWidth: "100%",
                background: "rgba(255,255,255,0.1)",
                borderRadius: "4px",
              }}
            />
          ) : giftBook?.bookUrl ? (
            <a
              href={giftBook.bookUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ lineHeight: 0 }}
            >
              <img
                src={coverSrc}
                alt=""
                style={{
                  width: isMobile ? "220px" : "350px",
                  display: "block",
                  filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.18))",
                  background: "transparent",
                }}
              />
            </a>
          ) : (
            <img
              src={coverSrc}
              alt=""
              style={{
                width: isMobile ? "220px" : "350px",
                display: "block",
                filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.18))",
                background: "transparent",
              }}
            />
          )}
        </div>

        <div>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              letterSpacing: "2px",
              fontSize: "12px",
              marginBottom: "16px",
              opacity: 0.7,
            }}
          >
            FREE GIFT
          </p>

          <h2
            style={{
              fontFamily: "Playfair Display, serif",
              fontSize: isMobile ? "28px" : "38px",
              lineHeight: "1.3",
              marginBottom: "20px",
              minHeight: isMobile ? "2.6em" : "2.4em",
            }}
          >
            {!isReady ? (
              <span style={{ opacity: 0.35 }}>Get a Free Copy</span>
            ) : (
              <>
                Get a Free Copy
                {bookName ? (
                  <>
                    {" "}
                    of <em style={{ fontStyle: "italic" }}>{bookName}</em>
                  </>
                ) : null}
              </>
            )}
          </h2>

          {!isReady ? (
            <div
              aria-hidden
              style={{
                minHeight: "120px",
                marginBottom: "20px",
                borderRadius: "4px",
                background: "rgba(255,255,255,0.08)",
              }}
            />
          ) : (
            <GiftDescription text={descriptionText} isMobile={isMobile} />
          )}

          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: isMobile ? "14px" : "12px",
              maxWidth: "420px",
              margin: isMobile ? "0 auto" : "0",
              alignItems: "center",
            }}
          >
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                padding: "14px",
                width: isMobile ? "100%" : "260px",
                border: "none",
                outline: "none",
                fontSize: "14px",
                textAlign: isMobile ? "center" : "left",
              }}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "14px 20px",
                width: isMobile ? "100%" : "auto",
                background: "#ffffff",
                color: "#5a6248",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: 500,
                letterSpacing: "1px",
                textTransform: "uppercase",
                transition: "all 0.35s ease",
                opacity: loading ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isMobile && !loading) {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow =
                    "0 12px 30px rgba(0,0,0,0.15)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile && !loading) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }
              }}
            >
              {loading ? "Sending..." : "Get the Book"}
            </button>
          </form>

          <p
            style={{
              fontSize: "12px",
              marginTop: "16px",
              opacity: 0.6,
            }}
          >
            You&apos;ll also receive occasional insights and updates — no noise,
            just value.
          </p>

          {message && (
            <p
              style={{
                marginTop: "14px",
                fontSize: "14px",
                color: message.includes("wrong") ? "#ffd0d0" : "#d8f5dc",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
