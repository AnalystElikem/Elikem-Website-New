import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import useResponsive from "../hooks/useResponsive";

const TOPICS = [
  { value: "general", label: "General enquiry" },
  { value: "pastor", label: "Pastoral / spiritual" },
  { value: "data-analyst", label: "Data & analytics" },
  { value: "writer", label: "Writing / editorial" },
] as const;

type TopicValue = (typeof TOPICS)[number]["value"];

function isTopicValue(v: string): v is TopicValue {
  return TOPICS.some((t) => t.value === v);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputStyle = (): React.CSSProperties => ({
  width: "100%",
  padding: "14px 16px",
  border: "1px solid #d6d2c8",
  borderRadius: "4px",
  fontSize: "15px",
  fontFamily: "Inter, sans-serif",
  background: "#fff",
  color: "#2f2f2f",
  outline: "none",
  boxSizing: "border-box",
});

export default function EnquiryForm() {
  const { isMobile } = useResponsive();
  const location = useLocation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [topic, setTopic] = useState<TopicValue>("general");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  useEffect(() => {
    const st = location.state as { enquiryTopic?: string } | null;
    const t = st?.enquiryTopic;
    if (t && isTopicValue(t)) {
      setTopic(t);
    }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const nameT = name.trim();
    const emailT = email.trim();
    const phoneT = phone.trim();
    const messageT = message.trim();

    if (!nameT) {
      setStatus({ type: "err", text: "Please add your name or organization." });
      setLoading(false);
      return;
    }

    if (!emailT && !phoneT) {
      setStatus({
        type: "err",
        text: "Please enter either an email or a phone number so we can reach you (both is fine too).",
      });
      setLoading(false);
      return;
    }

    if (emailT && !EMAIL_RE.test(emailT)) {
      setStatus({ type: "err", text: "That email doesn’t look valid — please check it." });
      setLoading(false);
      return;
    }

    if (!messageT) {
      setStatus({
        type: "err",
        text: "Please tell us what you’d like us to know in the message field.",
      });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameT,
          email: emailT,
          phone: phoneT,
          topic,
          message: messageT,
        }),
      });

      const contentType = res.headers.get("content-type") || "";
      const raw = await res.text();
      let data: {
        ok?: boolean;
        reason?: string;
        detail?: string;
        message?: string;
        hint?: string;
      } = {};

      if (contentType.includes("application/json")) {
        try {
          data = JSON.parse(raw) as typeof data;
        } catch {
          data = {};
        }
      }

      if (res.ok && data.ok) {
        setStatus({
          type: "ok",
          text: "Thank you — your message was sent. I’ll be in touch soon.",
        });
        setName("");
        setEmail("");
        setPhone("");
        setMessage("");
        setTopic("general");
      } else {
        const reason = data.reason;
        const erpDetail =
          typeof data.detail === "string" ? data.detail.trim() : "";

        let text =
          "Something went wrong. Please check your details and try again.";

        if (!contentType.includes("application/json")) {
          text =
            "We couldn’t send your message right now. Please refresh and try again, or email us directly.";
        } else if (typeof data.message === "string" && data.message && !reason) {
          text =
            import.meta.env.DEV
              ? data.message
              : "Something went wrong. Please try again later.";
        } else if (reason === "missing_name") {
          text = "Please add your name or organization.";
        } else if (reason === "missing_contact") {
          text =
            "Please enter either an email or a phone number so we can reach you.";
        } else if (reason === "invalid_email") {
          text = "Please enter a valid email address.";
        } else if (reason === "missing_feedback") {
          text = "Please fill in what you’d like us to know.";
        } else if (reason === "feedback_too_long") {
          text = "Your message is too long. Please shorten it and try again.";
        } else if (reason === "erpnext_not_configured") {
          text =
            "We couldn’t send your message right now. Please try again later or email us directly.";
        } else if (reason === "erpnext_create_failed") {
          text =
            "We couldn’t save your message. Please try again or email us directly.";
        } else if (reason === "erpnext" && erpDetail) {
          const line = erpDetail.split("\n")[0] ?? erpDetail;
          const cleaned = line
            .replace(/^ERPNext API error \(\d+\):\s*/i, "")
            .trim();
          if (
            import.meta.env.DEV &&
            cleaned.length > 0 &&
            cleaned.length < 320
          ) {
            text = `Could not save: ${cleaned}`;
          } else {
            text =
              "We couldn’t save your message. Please try again or email us directly.";
          }
        } else if (reason === "server_error") {
          text =
            typeof data.hint === "string" && import.meta.env.DEV
              ? `Server error: ${data.hint}`
              : "Something went wrong. Please try again or email us directly.";
        }

        setStatus({ type: "err", text });
      }
    } catch {
      setStatus({
        type: "err",
        text: "Network error. Please try again in a moment.",
      });
    } finally {
      setLoading(false);
    }
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: "Inter, sans-serif",
    fontSize: "12px",
    letterSpacing: "0.5px",
    color: "#4b5a45",
    marginBottom: "8px",
    fontWeight: 600,
  };

  const hintStyle: React.CSSProperties = {
    fontFamily: "Inter, sans-serif",
    fontSize: "13px",
    color: "#6f6f6f",
    lineHeight: 1.55,
    marginTop: "10px",
    marginBottom: 0,
  };

  return (
    <div
      style={{
        padding: isMobile ? "56px 20px" : "88px 40px",
        background: "#eae6dc",
        borderTop: "1px solid #d6d2c8",
      }}
    >
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            letterSpacing: "2px",
            fontSize: "12px",
            marginBottom: "14px",
            color: "#6f6f6f",
          }}
        >
          CONTACT
        </p>
        <h2
          style={{
            fontFamily: "Playfair Display, serif",
            fontSize: isMobile ? "30px" : "40px",
            fontWeight: 500,
            color: "#4b5a45",
            marginBottom: "12px",
            lineHeight: 1.2,
          }}
        >
          Let's Connect
        </h2>
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: isMobile ? "15px" : "16px",
            fontWeight: 300,
            color: "#5c5c5c",
            lineHeight: 1.75,
            marginBottom: "32px",
            maxWidth: "52ch",
          }}
        >
          Tell us what’s on your mind. Add{" "}
          <strong style={{ fontWeight: 600 }}>either an email or a phone number</strong>{" "}
          (or both) so we can get back to you.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Name / Organization */}
          <div style={{ marginBottom: "24px" }}>
            <label htmlFor="enquiry-name" style={labelStyle}>
              Name / Organization
            </label>
            <input
              id="enquiry-name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle()}
            />
          </div>

          {/* Email + Phone — side by side on larger screens */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: isMobile ? "20px" : "24px",
              marginBottom: "8px",
            }}
          >
            <div>
              <label htmlFor="enquiry-email" style={labelStyle}>
                Email
              </label>
              <input
                id="enquiry-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle()}
                aria-label="Email (optional if phone provided)"
              />
            </div>
            <div>
              <label htmlFor="enquiry-phone" style={labelStyle}>
                Phone number
              </label>
              <input
                id="enquiry-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+233 …"
                style={inputStyle()}
                aria-label="Phone number (optional if email provided)"
              />
            </div>
          </div>
          <p style={{ ...hintStyle, marginBottom: "24px" }}>
            Whichever you fill in first is fine — we only need{" "}
            <strong style={{ fontWeight: 600 }}>one</strong> way to reach you
            (email <em>or</em> phone). Both is welcome too.
          </p>

          {/* Feedback type */}
          <div style={{ marginBottom: "24px" }}>
            <label htmlFor="enquiry-topic" style={labelStyle}>
              Feedback Type
            </label>
            <select
              id="enquiry-topic"
              name="topic"
              value={topic}
              onChange={(e) => {
                const v = e.target.value;
                if (isTopicValue(v)) setTopic(v);
              }}
              style={{
                ...inputStyle(),
                cursor: "pointer",
              }}
            >
              {TOPICS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Main message */}
          <div style={{ marginBottom: "28px" }}>
            <label htmlFor="enquiry-message" style={labelStyle}>
              What do you want us to know?{" "}
              <span style={{ color: "#8b3a3a", fontWeight: 600 }}>*</span>
            </label>
            <textarea
              id="enquiry-message"
              name="message"
              required
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Your question, idea, or context…"
              style={{
                ...inputStyle(),
                resize: "vertical",
                minHeight: "160px",
                lineHeight: 1.65,
              }}
            />
          </div>

          {status ? (
            <p
              role="status"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "14px",
                marginBottom: "20px",
                color: status.type === "ok" ? "#3d5a40" : "#8b3a3a",
                lineHeight: 1.55,
              }}
            >
              {status.text}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "14px 28px",
              background: "#4b5a45",
              color: "#ffffff",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              letterSpacing: "1.2px",
              fontSize: "12px",
              fontFamily: "Inter, sans-serif",
              fontWeight: 500,
              textTransform: "uppercase",
              opacity: loading ? 0.75 : 1,
              transition: "opacity 0.2s ease, transform 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(-2px)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {loading ? "Sending…" : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}
