import { useEffect, useRef, useState } from "react";
import useResponsive from "../hooks/useResponsive";
import aboutContent from "../content/about.json";
import profileImg from "../assets/elikem-profile.jpg";
import { useNavigate } from "react-router-dom";

export default function AboutTeaser() {
  const navigate = useNavigate(); // ✅ USED NOW

  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  const { isMobile, isTablet } = useResponsive();

  useEffect(() => {
    const currentRef = sectionRef.current;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (currentRef) observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, []);

  return (
    <div
      ref={sectionRef}
      style={{
        padding: isMobile ? "60px 20px" : "60px 0",
        display: "flex",
        justifyContent: "center",
        background: "#f5f2eb",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(40px)",
        transition: "all 1s ease",
      }}
    >
      <div
        className="about-grid"
        style={{
          width: "1200px",
          maxWidth: "92%",
          gap: isMobile ? "32px" : "48px",
          alignItems: "center",
        }}
      >
        {/* IMAGE */}
        <div
          style={{
            width: "100%",
            height: isMobile ? "360px" : isTablet ? "420px" : "520px",
            overflow: "hidden",
          }}
        >
          <img
            src={profileImg}
            alt="Elikem Aflakpui"
            style={{
              width: "150%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "40% 70%",
              transform: "scale(1.5)",
              filter: "grayscale(100%) contrast(1.05)",
            }}
          />
        </div>

        {/* TEXT */}
        <div
          style={{
            maxWidth: "560px",
            justifySelf: isMobile ? "center" : "start",
            textAlign: isMobile ? "center" : "left",
          }}
        >
          {/* TITLE */}
          <h2
            style={{
              fontFamily: "Playfair Display, serif",
              fontSize: isMobile ? "32px" : isTablet ? "38px" : "46px",
              fontWeight: 400,
              color: "#4b5a45",
              marginBottom: "28px",
              lineHeight: "1.2",
              letterSpacing: "-0.4px",
            }}
          >
            {aboutContent.title}
          </h2>

          {/* PARAGRAPHS */}
          {aboutContent.paragraphs.map((para, index) => (
            <p
              key={index}
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 300,
                fontSize: isMobile ? "15px" : "17px",
                color: "#5c5c5c",
                lineHeight: "1.9",
                textAlign: isMobile ? "center" : "justify",
                marginBottom: index === 2 ? "36px" : "20px",
              }}
            >
              {para}
            </p>
          ))}

          {/* CTA */}
          <button
            onClick={() => navigate("/about")} // ✅ FIXED
            style={{
              background: "transparent",
              border: "none",
              fontWeight: 500,
              letterSpacing: "1px",
              cursor: "pointer",
              color: "#4b5a45",
              fontSize: "14px",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.6";
              e.currentTarget.style.transform = "translateX(6px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.transform = "translateX(0)";
            }}
          >
            Find Out More →
          </button>
        </div>
      </div>
    </div>
  );
}