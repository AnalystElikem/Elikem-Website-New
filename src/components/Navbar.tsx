import { useCallback, useEffect, useRef, useState } from "react";
import useResponsive from "../hooks/useResponsive";
import pastorIcon from "../assets/ea-pastor-icon.png";
import analystIcon from "../assets/ea-dataanalyst-icon.png";
import writerIcon from "../assets/ea-writer-icon.png";
import { useNavigate, useLocation } from "react-router-dom";

/** Hide the bar again after this long with no scroll / touch / pointer activity */
const IDLE_HIDE_MS = 3200;
/** Treat as “top of page” so the header stays visible (iOS rubber-band, sub-pixel) */
const TOP_THRESHOLD_PX = 12;

function isAtDocumentTop(): boolean {
  if (typeof window === "undefined") return true;
  return window.scrollY < TOP_THRESHOLD_PX;
}

export default function Navbar() {
  const { isMobile } = useResponsive();

  const navigate = useNavigate();
  const location = useLocation();

  const logos = [pastorIcon, analystIcon, writerIcon];

  const [currentLogo, setCurrentLogo] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  /** Bar is tucked away until the user scrolls or touches; then it auto-hides after idle */
  const [barVisible, setBarVisible] = useState(() => isAtDocumentTop());

  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuOpenRef = useRef(menuOpen);
  const atScrollTopRef = useRef(isAtDocumentTop());
  menuOpenRef.current = menuOpen;

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    clearHideTimer();
    if (menuOpenRef.current) return;
    if (atScrollTopRef.current) return;
    hideTimerRef.current = window.setTimeout(() => {
      setBarVisible(false);
      setMenuOpen(false);
      hideTimerRef.current = null;
    }, IDLE_HIDE_MS);
  }, [clearHideTimer]);

  const wake = useCallback(() => {
    setBarVisible(true);
    if (!menuOpenRef.current) {
      scheduleHide();
    }
  }, [scheduleHide]);

  const syncScrollTopAndBar = useCallback(() => {
    atScrollTopRef.current = isAtDocumentTop();
    if (atScrollTopRef.current) {
      setBarVisible(true);
      clearHideTimer();
    } else {
      wake();
    }
  }, [wake, clearHideTimer]);

  useEffect(() => {
    setMenuOpen(false);
    clearHideTimer();
    atScrollTopRef.current = isAtDocumentTop();
    setBarVisible(atScrollTopRef.current);
  }, [location.pathname, clearHideTimer]);

  useEffect(() => {
    const passive = { passive: true } as const;

    window.addEventListener("scroll", syncScrollTopAndBar, passive);
    document.addEventListener("touchstart", syncScrollTopAndBar, passive);
    document.addEventListener("touchmove", syncScrollTopAndBar, passive);
    document.addEventListener("wheel", syncScrollTopAndBar, passive);
    document.addEventListener("pointerdown", syncScrollTopAndBar, passive);

    return () => {
      window.removeEventListener("scroll", syncScrollTopAndBar);
      document.removeEventListener("touchstart", syncScrollTopAndBar);
      document.removeEventListener("touchmove", syncScrollTopAndBar);
      document.removeEventListener("wheel", syncScrollTopAndBar);
      document.removeEventListener("pointerdown", syncScrollTopAndBar);
      clearHideTimer();
    };
  }, [syncScrollTopAndBar, clearHideTimer]);

  useEffect(() => {
    if (menuOpen) {
      clearHideTimer();
      setBarVisible(true);
    } else {
      scheduleHide();
    }
  }, [menuOpen, clearHideTimer, scheduleHide]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLogo((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
    { label: "ABOUT", path: "/about" },
    { label: "EXPERTISE", id: "expertise" },
    { label: "BOOKS", path: "/books" },
    { label: "WRITING", id: "latest-articles" },
    { label: "FREE GIFT", id: "newsletter" },
  ];

  const hidden = !barVisible;

  return (
    <header
      aria-hidden={hidden}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: isMobile ? "20px" : "28px 80px",
        width: "100%",
        boxSizing: "border-box",
        zIndex: 100,
        background: "#f5f2eb",
        borderBottom: "1px solid #e0dcd4",
        transform: barVisible ? "translateY(0)" : "translateY(-100%)",
        transition: "transform 0.38s cubic-bezier(0.22, 1, 0.36, 1)",
        pointerEvents: barVisible ? "auto" : "none",
        willChange: "transform",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: isMobile ? "12px" : "18px",
          minWidth: 0,
          flex: "0 1 auto",
        }}
      >
        <button
          type="button"
          aria-label="Go to home page"
          tabIndex={hidden ? -1 : 0}
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
            flexShrink: 0,
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
        <button
          type="button"
          aria-label="Go to home page"
          tabIndex={hidden ? -1 : 0}
          onClick={() => {
            if (location.pathname !== "/") {
              navigate("/");
            } else {
              document.getElementById("home")?.scrollIntoView({ behavior: "smooth" });
            }
          }}
          style={{
            border: "none",
            background: "transparent",
            padding: "4px 0",
            margin: 0,
            cursor: "pointer",
            fontFamily: '"Playfair Display", serif',
            fontWeight: 600,
            fontSize: isMobile ? "13px" : "17px",
            letterSpacing: "0.12em",
            color: "#2f2f2f",
            textAlign: "left",
            lineHeight: 1.2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            minWidth: 0,
            maxWidth: isMobile ? "min(52vw, 200px)" : "none",
          }}
        >
          ELIKEM AFLAKPUI
        </button>
      </div>

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
          {navItems.map((item: { label: string; id?: string; path?: string }) => (
            <span
              key={item.path || item.id}
              className="link link-underline"
              style={{ color: "#2f2f2f", cursor: "pointer" }}
              tabIndex={hidden ? -1 : 0}
              role="button"
              onClick={() => goToSection(item.id, item.path)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  goToSection(item.id, item.path);
                }
              }}
            >
              {item.label}
            </span>
          ))}

          <button
            type="button"
            className="button-primary"
            tabIndex={hidden ? -1 : 0}
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

      {isMobile && (
        <div
          onClick={() => setMenuOpen(!menuOpen)}
          className="link"
          tabIndex={hidden ? -1 : 0}
          role="button"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setMenuOpen(!menuOpen);
            }
          }}
          style={{
            fontSize: "24px",
            color: "#2f2f2f",
            cursor: "pointer",
          }}
        >
          ☰
        </div>
      )}

      {menuOpen && isMobile && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            marginTop: "10px",
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
          {navItems.map((item: { label: string; id?: string; path?: string }) => (
            <span
              key={item.path || item.id}
              tabIndex={0}
              role="button"
              onClick={() => {
                goToSection(item.id, item.path);
                setMenuOpen(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  goToSection(item.id, item.path);
                  setMenuOpen(false);
                }
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
    </header>
  );
}
