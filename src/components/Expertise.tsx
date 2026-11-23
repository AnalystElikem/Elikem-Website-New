import useResponsive from "../hooks/useResponsive";

import Tilt from "./Tilt";

// Each role gets its own piece of the EA logo: halo (Pastor), graph (Data Analyst), book (Writer)
import pastorIcon from "../assets/logo-pieces/top-pastor.png";
import analystIcon from "../assets/logo-pieces/top-data.png";
import writerIcon from "../assets/logo-pieces/top-writer.png";

export default function Expertise() {
  const { isMobile } = useResponsive();

  const items = [
    {
      title: "Pastor",
      text: "Spiritual guidance and community leadership focused on heart-centered service and faith.",
      icon: pastorIcon,
      sectionId: "expertise-pastor",
    },
    {
      title: "Data Analyst",
      text: "Leveraging analytical insights to drive strategic decisions and professional excellence.",
      icon: analystIcon,
      sectionId: "expertise-data-analyst",
    },
    {
      title: "Writer",
      text: "Crafting narratives that inspire change, distill truth, and leave a lasting legacy.",
      icon: writerIcon,
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
          <Tilt key={item.title} id={item.sectionId} max={7} scale={1.02}
            style={{
              background: "linear-gradient(145deg, #ecece6 0%, #fbfaf6 70%)",
              padding: isMobile ? "30px 24px" : "40px 32px",
              borderRadius: "18px",
              textAlign: "left",
              boxShadow: "0 18px 40px rgba(60,66,52,0.10), 0 2px 6px rgba(60,66,52,0.05)",
            }}
          >
            <img
              src={item.icon}
              alt=""
              aria-hidden="true"
              style={{
                width: isMobile ? "130px" : "150px",
                display: "block",
                marginBottom: "18px",
                transition: "transform 0.35s ease, filter 0.35s ease",
                transform: "translateZ(calc(var(--lift) * 48px)) translateY(calc(var(--lift) * -8px))",
                filter: "drop-shadow(0 calc(var(--lift) * 14px) calc(var(--lift) * 12px) rgba(60,66,52,0.22))",
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
              }}
            >
              {item.text}
            </p>
          </Tilt>
        ))}
      </div>
    </div>
  );
}