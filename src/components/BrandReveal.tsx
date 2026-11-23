import { useEffect, useRef } from "react";

/**
 * Brand reveal band: a muted, autoplaying 10s video of the EA mark assembling
 * into the name lockup. Plays while on screen, fades out and restarts when it
 * ends, and shows the final frame for visitors who prefer reduced motion.
 */
const BAND = "#141c16"; // matches the video's dark edge colour

export default function BrandReveal() {
  const wrap = useRef<HTMLDivElement>(null);
  const vid = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = vid.current;
    const w = wrap.current;
    if (!v || !w) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return; // poster (final frame) stays visible

    let visible = false;
    let timer: number | undefined;

    const play = () => {
      if (visible) v.play().catch(() => {});
    };
    const onEnded = () => {
      v.style.opacity = "0";
      timer = window.setTimeout(() => {
        v.currentTime = 0;
        v.style.opacity = "1";
        play();
      }, 900);
    };
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (visible) play();
        else v.pause();
      },
      { threshold: 0.35 }
    );
    io.observe(w);
    v.addEventListener("ended", onEnded);
    return () => {
      io.disconnect();
      v.removeEventListener("ended", onEnded);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  const fade = "radial-gradient(ellipse 78% 82% at 50% 50%, #000 62%, transparent 100%)";

  return (
    <section
      aria-label="Elikem Aflakpui brand introduction"
      style={{ background: BAND, display: "flex", justifyContent: "center" }}
    >
      <div
        ref={wrap}
        style={{ width: "100%", maxWidth: 1600, aspectRatio: "16 / 9", maxHeight: "86vh" }}
      >
        <video
          ref={vid}
          src="/ea-brand-reveal.mp4"
          poster="/ea-brand-reveal-poster.jpg"
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            transition: "opacity .8s ease",
            WebkitMaskImage: fade,
            maskImage: fade,
          }}
        />
      </div>
    </section>
  );
}
