import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useResponsive from "../hooks/useResponsive";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import aboutContent from "../content/aboutintro.json";

// IMAGES
import img1 from "../assets/about/fam1.jpg";
import img2 from "../assets/about/fam2.jpg";
import img3 from "../assets/about/fam3.jpg";
import img4 from "../assets/about/fam4.jpg";
import img5 from "../assets/about/fam5.jpg";

export default function About() {
  const { isMobile, isTablet } = useResponsive();
  const navigate = useNavigate();

  const images = [img1, img2, img3, img4, img5];
  const [index, setIndex] = useState(0);

  // AUTO SLIDE
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ background: "#f5f2eb", minHeight: "100vh" }}>
      <Navbar />

      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: isMobile ? "40px 20px" : "80px 40px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1.2fr 1fr",
            gap: isMobile ? "60px" : "100px",
            alignItems: "center",
          }}
        >
          {/* IMAGE SLIDER */}
          <div
            style={{
              position: "relative",
              height: isMobile ? "420px" : "720px",
              overflow: "hidden",
            }}
          >
            {images.map((img, i) => (
              <img
                key={i}
                src={img}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center",
                  filter: "grayscale(100%) contrast(1.05)",
                  opacity: i === index ? 1 : 0,
                  transition: "opacity 1.2s ease",
                }}
              />
            ))}
          </div>

          {/* TEXT */}
          <div
            style={{
              maxWidth: "520px",
              justifySelf: isMobile ? "center" : "start",
              textAlign: isMobile ? "center" : "left",
              display: "flex",
              flexDirection: "column",
              alignItems: isMobile ? "center" : "flex-start",
            }}
          >
            {/* TITLE */}
            <h2
              style={{
                fontFamily: "Playfair Display, serif",
                fontSize: isMobile ? "32px" : isTablet ? "38px" : "48px",
                fontWeight: 400,
                color: "#4b5a45",
                marginBottom: "28px",
                lineHeight: "1.2",
                letterSpacing: "-0.4px",
                width: "100%",
              }}
            >
              First Things First
            </h2>

            {/* PARAGRAPHS */}
            {aboutContent.familyIntro.split("\n\n").map((para, index) => (
              <p
                key={index}
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 300,
                  fontSize: isMobile ? "15px" : "17px",
                  color: "#5c5c5c",
                  lineHeight: "1.7",
                  textAlign: isMobile ? "center" : "justify",
                  hyphens: "auto",
                  marginBottom: "10px",
                  /*marginBottom: index === Array.length -1 ? "24px" : "20px",*/
                  width: "100%",
                }}
              >
                {para}
              </p>
            ))}

            {/* BUTTONS */}
            <div
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: "16px",
                width: "100%",
                justifyContent: isMobile ? "center" : "flex-end", // ✅ KEY LINE
                alignItems: isMobile ? "center" : "flex-end",
              }}
            >
              {[
                { label: "Pastor", path: "/pastor" },
                { label: "Data Analyst", path: "/data" },
                { label: "Writer", path: "/writing" },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  style={{
                    background: "#4b5a45",
                    border: "none",
                    padding: "12px 24px",
                    cursor: "pointer",
                    letterSpacing: "1px",
                    fontSize: "14px",
                    fontFamily: "Inter, sans-serif",
                    color: "#ffffff",
                    transition: "all 0.3s ease",
                    width: isMobile ? "100%" : "auto",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "0.85";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "1";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}