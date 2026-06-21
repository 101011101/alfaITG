import { useEffect, useRef, useState } from "react";
import { PixelCanvas } from "@/components/ui/pixel-perfect-hero";

const PARALLAX = 0.1; // background scrolls at 10% of real scroll speed

/**
 * The DEFAULT site background (Silent-Precision pixel kit), mounted once at the
 * app root behind everything (-z-10). It drifts up at PARALLAX (10%) of the real
 * scroll speed for a multi-dimensional, "deeper than the page" feel. The canvas
 * is sized to viewport + PARALLAX of the scrollable range so the drift never
 * reveals an edge (covers exactly at scroll 0 and at max scroll).
 */
export function SplashBackground() {
  const [colors, setColors] = useState<string[]>([]);
  const [extra, setExtra] = useState(0); // px of canvas below the viewport for the drift
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    div.className = "text-muted-foreground";
    const muted = getComputedStyle(div).color;
    div.className = "text-primary";
    const primary = getComputedStyle(div).color;
    document.body.removeChild(div);
    setColors([muted, muted, muted, muted, primary]);
  }, []);

  useEffect(() => {
    const measure = () => {
      const maxScroll = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      setExtra(maxScroll * PARALLAX);
    };
    const onScroll = () => {
      if (wrapRef.current) {
        wrapRef.current.style.transform = `translate3d(0, ${
          -window.scrollY * PARALLAX
        }px, 0)`;
      }
    };

    measure();
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    // Doc height changes (hero expand, images load) → re-measure the drift range.
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      <div
        ref={wrapRef}
        className="absolute inset-x-0 top-0 will-change-transform"
        style={{ height: `calc(100vh + ${extra}px)` }}
      >
        {colors.length > 0 && <PixelCanvas colors={colors} gap={6} />}
      </div>
      {/* vignette stays pinned to the viewport */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--background)_100%)] opacity-80" />
    </div>
  );
}
