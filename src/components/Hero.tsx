import useResponsive from "../hooks/useResponsive";
import heroBg from "../assets/hero-bg.png";
import { socialLinks } from "../config/social";
import { useNavigate } from "react-router-dom";

export default function Hero() {
  const { isMobile, isTablet } = useResponsive();
  const navigate = useNavigate();

  const identityLink = {
    fontWeight: 500,
    color: "#777",
    cursor: "pointer",
    transition: "color 0.2s ease",
  } as const;

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        paddingTop: isMobile ? "90px" : "100px",
        paddingBottom: isMobile ? "90px" : "100px",
        paddingLeft: "20px",
        paddingRight: "20px",
        overflow: "hidden",
        animation: "fadeUp 1.2s ease-out",
      }}
    >
      {/* BACKGROUND */}
      <img
        src={heroBg}
        alt="hero background"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.36,
          filter: "blur(2px)",
        }}
      />

      {/* GRADIENT */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(circle at 30% 30%, rgba(0,0,0,0.03), transparent 40%),
            radial-gradient(circle at 70% 70%, rgba(0,0,0,0.02), transparent 40%)
          `,
        }}
      />

      {/* CONTENT */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "720px",
          width: "100%",
        }}
      >
        {/* IDENTITY */}
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            letterSpacing: "3px",
            fontSize: "12px",
            fontWeight: 500,
            color: "#777",
            marginBottom: "10px",
          }}
        >
          <span
            role="link"
            tabIndex={0}
            style={identityLink}
            onClick={() => navigate("/pastor")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate("/pastor");
              }
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#4b5a45";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#777";
            }}
          >
            PASTOR
          </span>
          <span style={{ margin: "0 6px", cursor: "default" }}>•</span>
          <span
            role="link"
            tabIndex={0}
            style={identityLink}
            onClick={() => navigate("/data")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate("/data");
              }
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#4b5a45";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#777";
            }}
          >
            DATA ANALYST
          </span>
          <span style={{ margin: "0 6px", cursor: "default" }}>•</span>
          <span
            role="link"
            tabIndex={0}
            style={identityLink}
            onClick={() => navigate("/writing")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate("/writing");
              }
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#4b5a45";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#777";
            }}
          >
            WRITER
          </span>
        </p>

        {/* NAME */}
        <h1
          style={{
            fontFamily: "Playfair Display, serif",
            fontWeight: 400,
            letterSpacing: "-0.6px",
            fontSize: isMobile ? "42px" : isTablet ? "60px" : "100px",
            color: "#4b5a45",
            marginBottom: "18px",
            lineHeight: "1.2",
          }}
        >
          Elikem Aflakpui
        </h1>

        {/* 🔥 EDITORIAL SOCIAL ICONS */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: isMobile ? "18px" : "50px",
            marginBottom: "34px",
            flexWrap: "wrap",
          }}
        >
          {socialLinks.map((item, i) => {
            const Icon = item.icon;

            return (
              <a
                key={i}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#4b5a45",
                  opacity: 0.85,
                  transition: "all 0.25s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseEnter={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.opacity = "1";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.opacity = "0.85";
                    e.currentTarget.style.transform = "translateY(0)";
                  }
                }}
              >
                {/* Slightly larger, clean */}
                <div style={{ transform: "scale(1.3)" }}>
                  <Icon />
                </div>
              </a>
            );
          })}
        </div>

        {/* DIVIDER */}
        <div
          style={{
            width: "50px",
            height: "1px",
            background: "#d6d2c8",
            margin: "0 auto 24px",
          }}
        />

        {/* TAGLINE */}
        <p
          style={{
            fontFamily: "Playfair Display, serif",
            fontSize: isMobile ? "15px" : "20px",
            color: "#6f6f6f",
            lineHeight: "1.7",
            maxWidth: "620px",
            margin: "0 auto 28px",
          }}
        >
          Faith at the Core. Insight in the Lead. Impact as the Legacy.
        </p>

        {/* CTA */}
        <button
          type="button"
          onClick={() => navigate("/contact")}
          style={{
            background: "#4b5a45",
            color: "white",
            padding: isMobile ? "14px 26px" : "16px 34px",
            border: "none",
            letterSpacing: "1.6px",
            textTransform: "uppercase",
            fontFamily: "Inter, sans-serif",
            fontWeight: 500,
            fontSize: "12px",
            cursor: "pointer",
            transition: "all 0.35s ease",
          }}
          onMouseEnter={(e) => {
            if (!isMobile) {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow =
                "0 10px 25px rgba(0,0,0,0.08)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isMobile) {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }
          }}
        >
          Start the Journey
        </button>
      </div>

      {/* SCROLL INDICATOR */}
      <div
        style={{
          position: "absolute",
          bottom: isMobile ? "16px" : "24px",
          fontSize: "24px",
          color: "#aaa",
        }}
      >
        ↓
      </div>
    </div>
  );
}