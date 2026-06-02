import { useState } from "react";
import useResponsive from "../hooks/useResponsive";
import { socialLinks } from "../config/social";

export default function Footer() {
  const { isMobile } = useResponsive();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setMessage("Successfully subscribed! Check your email.");
        setEmail("");
      } else {
        await res.json().catch(() => null);
        setMessage("Subscription failed. Please try again.");
      }
    } catch (error) {
      setMessage("Error subscribing. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: "#2f2f2f",
        color: "#ffffff",
        padding: isMobile ? "64px 20px" : "88px 40px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.2fr) minmax(0, 1fr)",
          alignItems: "start",
          gap: isMobile ? "40px" : "72px",
        }}
      >
        <div style={{ maxWidth: "560px" }}>
          <h2
            style={{
              fontFamily: "Playfair Display, serif",
              fontSize: isMobile ? "24px" : "32px",
              marginBottom: "20px",
              lineHeight: "1.2",
            }}
          >
            Let’s Build Something That Lasts.
          </h2>

          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 300,
              fontSize: isMobile ? "16px" : "17px",
              lineHeight: "1.9",
              opacity: 0.75,
              marginBottom: "28px",
            }}
          >
            If getting it right matters more to you than just getting it done,
            then we will understand each other. Let&apos;s talk.
          </p>

          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              lineHeight: 1.55,
              opacity: 0.55,
              margin: "0 0 12px",
            }}
          >
            Get updates, insights, and free resources delivered to your inbox.
          </p>

          <form
            onSubmit={handleSubscribe}
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: "10px",
              alignItems: isMobile ? "stretch" : "flex-start",
              maxWidth: "480px",
            }}
          >
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                padding: "12px 14px",
                flex: 1,
                minWidth: 0,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.05)",
                color: "white",
                outline: "none",
                fontSize: "14px",
                fontFamily: "Inter, sans-serif",
              }}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "12px 20px",
                background: "#ffffff",
                color: "#2f2f2f",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: 500,
                fontSize: "13px",
                fontFamily: "Inter, sans-serif",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                opacity: loading ? 0.6 : 1,
                whiteSpace: "nowrap",
              }}
            >
              {loading ? "…" : "Subscribe"}
            </button>
          </form>

          {message && (
            <p
              style={{
                marginTop: "10px",
                fontSize: "13px",
                color: message.includes("failed") ? "#ff6b6b" : "#51cf66",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {message}
            </p>
          )}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            alignItems: isMobile ? "center" : "flex-start",
            transform: isMobile ? "none" : "translateY(10px)",
          }}
        >
          <a
            href="mailto:elikemaflakpui@gmail.com"
            className="link link-underline"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              letterSpacing: "1px",
              color: "white",
              textDecoration: "none",
            }}
          >
            elikemaflakpui@gmail.com
          </a>

          <div style={{ display: "flex", gap: "20px" }}>
            {socialLinks.map((item, i) => {
              const Icon = item.icon;
              return (
                <a
                  key={i}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link"
                  style={{
                    color: "#ffffff",
                    opacity: 0.75,
                  }}
                >
                  <Icon />
                </a>
              );
            })}
          </div>

          <div
            style={{
              display: "flex",
              gap: "20px",
              marginTop: "6px",
              fontSize: "13px",
            }}
          >
            {["About", "Expertise", "Writing", "Free Gift"].map((item) => (
              <span
                key={item}
                className="link link-underline"
                style={{
                  color: "white",
                  opacity: 0.75,
                }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: "48px",
          height: "1px",
          background: "rgba(255,255,255,0.1)",
        }}
      />

      <div
        style={{
          marginTop: "20px",
          textAlign: "center",
          fontSize: "12px",
          opacity: 0.5,
        }}
      >
        © {new Date().getFullYear()} Elikem Aflakpui. All rights reserved.
      </div>
    </div>
  );
}
