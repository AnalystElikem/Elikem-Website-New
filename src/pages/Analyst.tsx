import { useNavigate } from "react-router-dom";
import useResponsive from "../hooks/useResponsive";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import analystContent from "../content/analyst.json";

// IMAGE (replace later with a strong portrait)
import analystImg from "../assets/about/ps_ea1.png";

export default function Analyst() {
  const { isMobile } = useResponsive();
  const navigate = useNavigate();

  return (
    <div className="page-with-fixed-nav" style={{ background: "#f5f2eb", minHeight: "100vh" }}>
      <Navbar />

      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: isMobile ? "40px 20px" : "80px 40px",
        }}
      >
        {/* 🔥 EDITORIAL HERO */}
        <div
        style={{
            position: "relative",
            marginBottom: "100px",
        }}
        >
        {/* IMAGE */}
        <div
            style={{
            width: isMobile ? "100%" : "65%",
            height: isMobile ? "500px" : "650px",
            overflow: "hidden",
            position: "relative",
            }}
        >
            <img
            src={analystImg}
            alt="Analyst Elikem"
            style={{
                width: "120%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "10% 10%",
                transform: "scale(1.1) translateX(-5%)",
                filter: "grayscale(100%) contrast(1.05)",
            }}
            />
        </div>

        {/* TEXT BLOCK */}
        <div
            style={{
            position: isMobile ? "absolute" : "absolute",
            
            // 📱 MOBILE → bottom center
            ...(isMobile
              ? {
                  left: "50%",
                  bottom: "0",
                  transform: "translateX(-50%) translateY(-20px)",
                  width: "90%",
                  textAlign: "center",
                }
              : {
                  // 💻 DESKTOP → right side, vertically centered
                  top: "50%",
                  right: "5%",
                  transform: "translateY(-50%)",
                  width: "420px",
                  textAlign: "left",
                }),

            background: isMobile ?"rgba(63, 74, 58, 0.92)" : "#3f4a3a",
            backdropFilter: isMobile ? "blur(6px)" : "none",
            padding: isMobile ? "20px" : "40px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.2)", // subtle depth
            }}
        >
            <h1
            style={{
                fontFamily: "Playfair Display, serif",
                fontSize: isMobile ? "28px" : "64px",
                color: "#ffffff", // 🔥 white on dark
                marginBottom: "16px",
                lineHeight: "1.1",
            }}
            >
            {analystContent.hero.title}
            </h1>

            <p
            style={{
                fontFamily: "Inter, sans-serif",
                fontSize: isMobile ? "14px" : "16px",
                color: "rgba(255,255,255,0.85)", // 🔥 softened white
                lineHeight: "1.7",
                ...(!isMobile
                  ? { textAlign: "justify" as const, hyphens: "auto" as const }
                  : {}),
            }}
            >
            {analystContent.hero.subtitle}
            </p>
        </div>
        </div>

        {/* 🔥 CONTENT */}
        <div
          style={{
            maxWidth: "680px",
            margin: "0 auto",
          }}
        >
          {analystContent.sections.map((section, i) => (
            <div key={i} style={{ marginBottom: "36px" }}>
              {section.title && (
                <h3
                  style={{
                    fontFamily: "Playfair Display, serif",
                    fontSize: "22px",
                    color: "#4b5a45",
                    marginBottom: "12px",
                    textAlign: "start",
                  }}
                >
                  {section.title}
                </h3>
              )}

              {section.text.split("\n\n").map((para, index) => (
                <p
                  key={index}
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: isMobile ? "15px" : "17px",
                    color: "#5c5c5c",
                    lineHeight: "1.7",
                    marginBottom: "16px",
                    textAlign: "justify",
                    hyphens: "auto",
                    wordBreak: "break-word",
                  }}
                >
                  {para}
                </p>
              ))}
            </div>
          ))}

          {/* 🔥 SIGNATURE */}
          <div style={{ marginTop: "50px" }}>
            {analystContent.signature.map((line, i) => (
              <p
                key={i}
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: isMobile ? "15px" : "17px",
                  color: "#5c5c5c",
                  lineHeight: "1.7",
                  marginBottom: "10px",
                  textAlign: "justify",
                  hyphens: "auto",
                  wordBreak: "break-word",
                }}
              >
                {line}
              </p>
            ))}
          </div>

          {/* 🔥 CTA */}
          <div style={{ marginTop: "40px" }}>
            <button
              type="button"
              onClick={() =>
                navigate("/contact", {
                  state: { enquiryTopic: "data-analyst" },
                })
              }
              style={{
                background: "#4b5a45",
                border: "none",
                padding: "14px 28px",
                color: "#ffffff",
                cursor: "pointer",
                letterSpacing: "1px",
                fontSize: "12px",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.85";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {analystContent.cta}
            </button>
          </div>

          {/* 🔥 EXPLORE OTHER ROLES */}
          <div style={{ marginTop: "60px", paddingTop: "40px", borderTop: "1px solid #e0dcd2" }}>
            <button
              type="button"
              onClick={() =>
                navigate({ pathname: "/", hash: "expertise-data-analyst" })
              }
              style={{
                display: "block",
                width: "100%",
                maxWidth: "420px",
                margin: "0 auto 24px",
                background: "transparent",
                border: "none",
                padding: "8px 0",
                fontFamily: "Inter, sans-serif",
                fontSize: isMobile ? "13px" : "14px",
                color: "#4b5a45",
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: "4px",
                letterSpacing: "0.3px",
              }}
            >
              ← Back to Data Analyst on the homepage
            </button>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: isMobile ? "13px" : "14px",
                color: "#8b8b8b",
                letterSpacing: "0.8px",
                marginBottom: "20px",
                textTransform: "uppercase",
              }}
            >
              Explore Other Roles
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: "12px",
              }}
            >
              <button
                onClick={() => navigate("/pastor")}
                style={{
                  background: "#f5f2eb",
                  border: "1px solid #d4cfc4",
                  padding: "12px 24px",
                  color: "#4b5a45",
                  cursor: "pointer",
                  letterSpacing: "0.8px",
                  fontSize: "12px",
                  transition: "all 0.3s ease",
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 500,
                  flex: isMobile ? 1 : "auto",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#4b5a45";
                  e.currentTarget.style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#f5f2eb";
                  e.currentTarget.style.color = "#4b5a45";
                }}
              >
                Pastor
              </button>
              <button
                onClick={() => navigate("/writing")}
                style={{
                  background: "#f5f2eb",
                  border: "1px solid #d4cfc4",
                  padding: "12px 24px",
                  color: "#4b5a45",
                  cursor: "pointer",
                  letterSpacing: "0.8px",
                  fontSize: "12px",
                  transition: "all 0.3s ease",
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 500,
                  flex: isMobile ? 1 : "auto",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#4b5a45";
                  e.currentTarget.style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#f5f2eb";
                  e.currentTarget.style.color = "#4b5a45";
                }}
              >
                Writer
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
