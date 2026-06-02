import useResponsive from "../hooks/useResponsive";
import { useNavigate } from "react-router-dom";

// ✅ IMPORT IMAGES
import pastorIcon from "../assets/ea-pastor-icon.png";
import analystIcon from "../assets/ea-dataanalyst-icon.png";
import writerIcon from "../assets/ea-writer-icon.png";

export default function Expertise() {
  const { isMobile } = useResponsive();
  const navigate = useNavigate();

  const items = [
    {
      title: "Pastor",
      text: "Spiritual guidance and community leadership focused on heart-centered service and faith.",
      icon: pastorIcon,
      path: "/pastor",
      sectionId: "expertise-pastor",
    },
    {
      title: "Data Analyst",
      text: "Leveraging analytical insights to drive strategic decisions and professional excellence.",
      icon: analystIcon,
      path: "/data",
      sectionId: "expertise-data-analyst",
    },
    {
      title: "Writer",
      text: "Crafting narratives that inspire change, distill truth, and leave a lasting legacy.",
      icon: writerIcon,
      path: "/writing",
      sectionId: "expertise-writer",
    },
  ] as const;

  return (
    <div
      style={{
        padding: isMobile ? "40px 5px" : "80px 10px",
        textAlign: "center",
        background: "#f5f2eb",
      }}
    >

    {/* DIVIDER */}
    <div
        style={{
            width: "50px",
            height: "1px",
            background: "#d6d2c8",
            margin: "0 auto 24px",
          }}
        />

      <h2
        style={{
          fontFamily: "Playfair Display, serif",
          fontSize: isMobile ? "30px" : "42px",
          fontWeight: 500,
          color: "#4b5a45",
          marginBottom: isMobile ? "40px" : "60px",
        }}
      >
        Expertise & Services
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gap: isMobile ? "24px" : "40px",
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        {items.map((item) => (
          <button
            key={item.title}
            type="button"
            id={item.sectionId}
            onClick={() => navigate(item.path)}
            style={{
              background: "#ffffff",
              padding: isMobile ? "30px 20px" : "40px 30px",
              borderRadius: "6px",
              border: "1px solid transparent",
              cursor: "pointer",
              textAlign: "center",
              font: "inherit",
              transition: "box-shadow 0.25s ease, border-color 0.25s ease, transform 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.06)";
              e.currentTarget.style.borderColor = "#e0dcd2";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.borderColor = "transparent";
            }}
          >
            <img
              src={item.icon}
              alt={item.title}
              style={{
                width: isMobile ? "75px" : "100px",
                marginBottom: "8px",
                display: "block",        // ✅ ensures proper centering behaviour
                marginLeft: "auto",      // ✅ centers horizontally
                marginRight: "auto",
              }}
            />

            <h3
              style={{
                fontFamily: "Playfair Display, serif",
                fontSize: isMobile ? "20px" : "22px",
                color: "#4b5a45",
                marginBottom: "10px",
              }}
            >
              {item.title}
            </h3>

            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: isMobile ? "14px" : "17px",
                fontWeight: 300,
                color: "#6f6f6f",
                lineHeight: "1.7",
                textAlign: "justify",
                hyphens: "auto",
              }}
            >
              {item.text}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}