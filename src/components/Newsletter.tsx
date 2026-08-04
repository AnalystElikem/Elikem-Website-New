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

/** Quill / ERPNext often emit `style="text-align: left"` which overrides our justified layout. */
function stripInlineTextAlignFromHtml(html: string): string {
  return html.replace(
    /\sstyle\s*=\s*(["'])([\s\S]*?)\1/gi,
    (_full, quote: string, value: string) => {
      const parts = value
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !/^\s*text-align\s*:/i.test(s));
      if (parts.length === 0) return "";
      return ` style=${quote}${parts.join("; ")}${quote}`;
    },
  );
}

/**
 * Quill often emits many one-line `<p>` blocks. For each, CSS treats that line as the
 * paragraph’s last line, so `text-align: justify` never applies. Merge siblings into one
 * `<p>` so wrapped lines justify; the real closing `</p>` still gets a normal last line.
 */
function mergeAdjacentParagraphsInGiftHtml(html: string): string {
  const re = /<\/p>\s*<p(?:\s[^>]*)?>/gi;
  let out = html;
  let prev: string;
  do {
    prev = out;
    out = out.replace(re, " ");
  } while (out !== prev);
  return out;
}

function prepareGiftDescriptionHtml(html: string): string {
  return mergeAdjacentParagraphsInGiftHtml(stripInlineTextAlignFromHtml(html));
}

function GiftDescription({ text, isMobile }: { text: string; isMobile: boolean }) {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const textStyle: React.CSSProperties = {
    fontFamily: "Inter, sans-serif",
    fontSize: isMobile ? "15px" : "16px",
    lineHeight: 1.7,
    opacity: 0.92,
    marginBottom: "1.25rem",
  };
  if (trimmed.startsWith("<")) {
    return (
      <div
        className="free-gift-description-html"
        style={textStyle}
        dangerouslySetInnerHTML={{
          __html: prepareGiftDescriptionHtml(trimmed),
        }}
      />
    );
  }
  const plainBlocks = trimmed
    .split(/\n\s*\n+/)
    .map((b) => b.trim().replace(/\n/g, " "))
    .filter(Boolean);
  return (
    <div className="free-gift-description-html" style={textStyle}>
      {plainBlocks.map((block, i) => (
        <p key={i}>{block}</p>
      ))}
    </div>
  );
}

export default function Newsletter() {
  const { isMobile } = useResponsive();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [giftBook, setGiftBook] = useState<GiftBook | null | undefined>(undefined);

  // Spam guards: a hidden field people never see, and how long the form has been on screen.
  const [website, setWebsite] = useState(""); // honeypot — must stay empty
  const [formRenderedAt] = useState(() => Date.now());

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
    setIsError(false);

    try {
      const res = await fetch("/api/books/gift-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, website, formRenderedAt }),
      });

      if (res.ok) {
        setMessage("You’re in — check your email for next steps on your free book.");
        setEmail("");
      } else {
        const err = await res.json().catch(() => ({}));
        const reason = (err as { reason?: string }).reason;
        setIsError(true);
        if (reason === "no_book") {
          setMessage("This offer isn’t available right now. Please try again later.");
        } else if (
          reason === "invalid_email" ||
          reason === "undeliverable_domain" ||
          reason === "disposable_email"
        ) {
          setMessage("That email address doesn’t look deliverable. Mind checking it?");
        } else if (reason === "too_many_requests") {
          setMessage("Too many attempts just now. Please try again shortly.");
        } else {
          setMessage("Something went wrong. Please try again.");
        }
      }
    } catch {
      setIsError(true);
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
          alignItems: "start",
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

        <div style={{ textAlign: "left" }}>
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
              lineHeight: 1.28,
              marginBottom: "1rem",
              maxWidth: "46rem",
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
              position: "relative",
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: isMobile ? "14px" : "12px",
              maxWidth: "420px",
              margin: 0,
              alignItems: isMobile ? "stretch" : "center",
            }}
          >
            {/* Honeypot: invisible to people, irresistible to bots */}
            <input
              type="text"
              name="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              style={{
                position: "absolute",
                left: "-9999px",
                width: "1px",
                height: "1px",
                opacity: 0,
              }}
            />

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
                textAlign: "left",
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
                color: isError ? "#ffd0d0" : "#d8f5dc",
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
