import { useRef } from "react";
import type { CSSProperties, ReactNode } from "react";

/**
 * Wraps content in a gentle 3D tilt that follows the pointer.
 * Children can use the CSS variable --lift (0 -> 1 while hovered) to rise
 * off the surface, e.g. transform: translateZ(calc(var(--lift) * 40px)).
 * Does nothing on touch screens or for visitors who prefer reduced motion.
 */
type Props = {
  children: ReactNode;
  max?: number; // max tilt in degrees
  scale?: number; // hover scale
  style?: CSSProperties;
  id?: string;
};

export default function Tilt({ children, max = 8, scale = 1.015, style, id }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const enabled = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const move = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || !enabled()) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transition = "transform 0.08s linear, box-shadow 0.3s ease";
    el.style.transform = `perspective(900px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg) scale(${scale})`;
    el.style.setProperty("--lift", "1");
  };

  const leave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = "transform 0.5s ease, box-shadow 0.3s ease";
    el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)";
    el.style.setProperty("--lift", "0");
  };

  return (
    <div
      ref={ref}
      id={id}
      onMouseMove={move}
      onMouseLeave={leave}
      style={{
        transformStyle: "preserve-3d",
        willChange: "transform",
        ["--lift" as string]: 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
