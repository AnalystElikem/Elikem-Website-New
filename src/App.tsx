import { useEffect, useState } from "react";

export default function App() {
  const logos = [
    "/ea-pastor-icon.png",
    "/ea-dataanalyst-icon.png",
    "/ea-writer-icon.png",
  ];

  const [currentLogo, setCurrentLogo] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLogo((prev) => (prev + 1) % logos.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f2eb",
        fontFamily: "Inter, sans-serif",
        color: "#2f2f2f",
      }}
    >
      {/* NAVBAR */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "24px 60px",
        }}
      >
        {/* ROTATING LOGO */}
        <div
          style={{
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            overflow: "hidden",
            background: "#ddd",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={logos[currentLogo]}
            alt="role icon"
            style={{
              width: "80%",
              height: "80%",
              objectFit: "contain",
            }}
          />
        </div>

        {/* NAV LINKS */}
        <div style={{ display: "flex", gap: "32px", alignItems: "center" }}>
          <span style={{ cursor: "pointer" }}>ABOUT</span>
          <span style={{ cursor: "pointer" }}>EXPERTISE</span>
          <span style={{ cursor: "pointer" }}>WRITING</span>
          <span style={{ cursor: "pointer" }}>CONTACT</span>

          <button
            style={{
              border: "1px solid #2f2f2f",
              padding: "8px 16px",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            Book Elikem
          </button>
        </div>
      </div>

      {/* HERO */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          paddingTop: "140px",
          paddingBottom: "140px",
          overflow: "hidden",
        }}
      >
        {/* BACKGROUND IMAGE */}
        <img
          src="/hero-bg.png"
          alt="hero background"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.5,
          }}
        />

        {/* OVERLAY */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(245, 242, 235, 0.5)",
          }}
        />

        {/* CONTENT */}
        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Identity */}
          <p
            style={{
              letterSpacing: "4px",
              fontSize: "18px",
              color: "#777",
              marginBottom: "20px",
            }}
          >
            PASTOR • DATA ANALYST • WRITER
          </p>

          {/* Name */}
          <h1
            style={{
              fontFamily: "Playfair Display, serif",
              fontSize: "90px",
              color: "#4b5a45",
              marginBottom: "20px",
            }}
          >
            Elikem Aflakpui
          </h1>

          {/* Divider */}
          <div
            style={{
              width: "60px",
              height: "1px",
              background: "#ccc",
              marginBottom: "20px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          />

          {/* Tagline */}
          <p
            style={{
              fontStyle: "italic",
              color: "#777",
              maxWidth: "600px",
              marginBottom: "40px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            “Faith at the core, insight in the lead and impact as the legacy.”
          </p>

          {/* CTA */}
          <button
            style={{
              background: "#4b5a45",
              color: "white",
              padding: "14px 28px",
              border: "none",
              letterSpacing: "1px",
              cursor: "pointer",
            }}
          >
            START THE JOURNEY
          </button>
        </div>

        {/* Scroll indicator */}
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            fontSize: "20px",
            color: "#999",
          }}
        >
          ↓
        </div>
      </div>
    </div>
  );
}