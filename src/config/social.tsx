// src/config/social.tsx

/* ================= BASE STYLE ================= */

const baseStyle = {
  width: "18px",
  height: "18px",
  display: "block",
};

/* ================= ICONS ================= */

export const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" style={baseStyle}>
    <path d="M19 0h-14C2.24 0 0 2.24 0 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5V5c0-2.76-2.24-5-5-5zM7 19H4V8h3v11zM5.5 6.73C4.67 6.73 4 6.05 4 5.23S4.67 3.73 5.5 3.73 7 4.41 7 5.23 6.33 6.73 5.5 6.73zM20 19h-3v-5.6c0-1.34-.03-3.06-1.87-3.06-1.87 0-2.16 1.46-2.16 2.96V19h-3V8h2.88v1.5h.04c.4-.75 1.37-1.54 2.82-1.54 3.02 0 3.58 1.99 3.58 4.58V19z"/>
  </svg>
);

export const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" style={baseStyle}>
    <path d="M18.5 3h2l-6.5 7.4L22 21h-6.5l-5-6.3L4 21H2l7.1-8.1L2 3h6.6l4.6 5.9L18.5 3z"/>
  </svg>
);

export const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" style={baseStyle}>
    <path d="M7 2C4.8 2 3 3.8 3 6v12c0 2.2 1.8 4 4 4h10c2.2 0 4-1.8 4-4V6c0-2.2-1.8-4-4-4H7zm5 5a5 5 0 110 10 5 5 0 010-10zm6.2-.8a1.2 1.2 0 11-2.4 0 1.2 1.2 0 012.4 0zM12 9.2A2.8 2.8 0 1012 15a2.8 2.8 0 000-5.6z"/>
  </svg>
);

export const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" style={baseStyle}>
    <path d="M13 3h3V0h-3c-3 0-5 2-5 5v3H5v4h3v12h4V12h3l.4-4H12V6c0-.6.4-1 1-1z"/>
  </svg>
);

export const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" style={baseStyle}>
    <path d="M23 7s-.2-1.5-.8-2.2c-.7-.8-1.5-.8-1.9-.9C17.7 3.5 12 3.5 12 3.5s-5.7 0-8.3.4c-.4 0-1.2.1-1.9.9C1.2 5.5 1 7 1 7S.8 8.8.8 10.5v3c0 1.7.2 3.5.2 3.5s.2 1.5.8 2.2c.7.8 1.6.8 2 .9 1.5.1 8.2.4 8.2.4s5.7 0 8.3-.4c.4-.1 1.2-.1 1.9-.9.6-.7.8-2.2.8-2.2s.2-1.8.2-3.5v-3c0-1.7-.2-3.5-.2-3.5zM10 15V9l5 3-5 3z"/>
  </svg>
);

/* ================= SOCIAL CONFIG ================= */

export const socialLinks = [
  {
    icon: LinkedInIcon,
    link: "https://www.linkedin.com/in/elikem-m-aflakpui",
  },
  {
    icon: XIcon,
    link: "https://x.com/elikemaflakpui",
  },
  {
    icon: InstagramIcon,
    link: "https://www.instagram.com/eaflakpui?igsh=YXJ4ZXhvYzV2eGU4&utm_source=qr",
  },
  {
    icon: FacebookIcon,
    link: "https://www.facebook.com/share/1Jk9Xrtwfg/?mibextid=wwXIfr",
  },
  {
    icon: YouTubeIcon,
    link: "https://www.youtube.com/@ElikemAflakpuiPs",
  },
];