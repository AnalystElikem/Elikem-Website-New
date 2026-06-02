import useResponsive from "../hooks/useResponsive";

// ✅ IMPORT IMAGES
import pastorIcon from "../assets/ea-pastor-icon.png";
import analystIcon from "../assets/ea-dataanalyst-icon.png";
import writerIcon from "../assets/ea-writer-icon.png";

export default function Expertise() {
  const { isMobile } = useResponsive();

  const items = [
    {
      title: "Pastor",
      text: "Spiritual guidance and community leadership focused on heart-centered service and faith.",
      icon: pastorIcon,
    },
    {
      title: "Data Analyst",
      text: "Leveraging analytical insights to drive strategic decisions and professional excellence.",
      icon: analystIcon,
    },
    {
      title: "Writer",
      text: "Crafting narratives that inspire change, distill truth, and leave a lasting legacy.",
      icon: writerIcon,
    },
  ];

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
          <div
            key={item.title}
            style={{
              background: "#ffffff",
              padding: isMobile ? "30px 20px" : "40px 30px",
              borderRadius: "6px",
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
              }}
            >
              {item.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}