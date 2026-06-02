import { useEffect, useState } from "react";
import useResponsive from "../hooks/useResponsive";
import pastorIcon from "../assets/ea-pastor-icon.png";
import analystIcon from "../assets/ea-dataanalyst-icon.png";
import writerIcon from "../assets/ea-writer-icon.png";
import { useNavigate, useLocation } from "react-router-dom";

export default function Navbar() {
  const { isMobile } = useResponsive();

  const navigate = useNavigate();      // ✅ CORRECT PLACE
  const location = useLocation();      // ✅ CORRECT PLACE

  const logos = [pastorIcon, analystIcon, writerIcon];

  const [currentLogo, setCurrentLogo] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLogo((prev) => (prev + 1) % logos.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // ✅ SINGLE CLEAN FUNCTION
  const goToSection = (id: string | undefined, path?: string) => {
    if (path) {
      navigate(path);
      return;
    }
    if (!id) return;
    if (location.pathname !== "/") {
      navigate("/");

      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const navItems = [
    { label: "HOME", id: "home" },
    { label: "ABOUT", id: "about" },
    { label: "EXPERTISE", id: "expertise" },
    { label: "WRITING", id: "latest-articles" },
    { label: "FREE GIFT", id: "newsletter" },
  ];

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: isMobile ? "20px" : "28px 80px",
        position: "relative",
        zIndex: 20,
      }}
    >
      {/* LOGO — home */}
      <button
        type="button"
        aria-label="Go to home page"
        onClick={() => {
          if (location.pathname !== "/") {
            navigate("/");
          } else {
            document.getElementById("home")?.scrollIntoView({ behavior: "smooth" });
          }
        }}
        style={{
          width: isMobile ? "64px" : "96px",
          height: isMobile ? "64px" : "96px",
          borderRadius: "50%",
          overflow: "hidden",
          background: "#eae6dc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "none",
          padding: 0,
          cursor: "pointer",
        }}
      >
        <img
          src={logos[currentLogo]}
          alt=""
          style={{
            width: "75%",
            height: "75%",
            objectFit: "contain",
            pointerEvents: "none",
          }}
        />
      </button>

      {/* DESKTOP NAV */}
      {!isMobile && (
        <div
          style={{
            display: "flex",
            gap: "36px",
            alignItems: "center",
            fontFamily: "Inter, sans-serif",
            fontWeight: 500,
            letterSpacing: "1.2px",
            fontSize: "13px",
          }}
        >
          {navItems.map((item: any) => (
            <span
              key={item.path || item.id}
              className="link link-underline"
              style={{ color: "#2f2f2f", cursor: "pointer" }}
              onClick={() => goToSection(item.id, item.path)}
            >
              {item.label}
            </span>
          ))}

          <button
            type="button"
            className="button-primary"
            onClick={() => navigate("/contact")}
            style={{
              padding: "10px 18px",
              fontWeight: 500,
              letterSpacing: "1.4px",
              textTransform: "uppercase",
              fontSize: "12px",
            }}
          >
            Contact
          </button>
        </div>
      )}

      {/* MOBILE HAMBURGER */}
      {isMobile && (
        <div
          onClick={() => setMenuOpen(!menuOpen)}
          className="link"
          style={{
            fontSize: "24px",
            color: "#2f2f2f",
            cursor: "pointer",
          }}
        >
          ☰
        </div>
      )}

      {/* MOBILE MENU */}
      {menuOpen && isMobile && (
        <div
          style={{
            position: "absolute",
            top: "80px",
            right: "20px",
            width: "220px",
            background: "#2f2f2f",
            color: "#ffffff",
            padding: "24px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
            borderRadius: "4px",
          }}
        >
          {navItems.map((item: any) => (
            <span
              key={item.path || item.id}
              onClick={() => {
                goToSection(item.id, item.path);
                setMenuOpen(false);
              }}
              style={{
                fontWeight: 500,
                letterSpacing: "1.2px",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              {item.label}
            </span>
          ))}

          <button
            type="button"
            className="button-primary"
            onClick={() => {
              navigate("/contact");
              setMenuOpen(false);
            }}
            style={{
              marginTop: "10px",
              padding: "10px",
              fontWeight: 500,
              letterSpacing: "1.2px",
              textTransform: "uppercase",
              fontSize: "12px",
            }}
          >
            Contact
          </button>
        </div>
      )}
    </div>
  );
}