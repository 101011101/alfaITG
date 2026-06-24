import { memo, useEffect, useRef, useState } from "react";
import { PixelCanvas } from "@/components/ui/pixel-perfect-hero";
import { heroCover } from "@/lib/heroCover";

const PARALLAX = 0.1; // background scrolls at 10% of real scroll speed

/**
 * The DEFAULT site background (Silent-Precision pixel kit), mounted once at the
 * app root behind everything (-z-10). It drifts up at PARALLAX (10%) of the real
 * scroll speed for a multi-dimensional, "deeper than the page" feel. The canvas
 * is sized to viewport + PARALLAX of the scrollable range so the drift never
 * reveals an edge (covers exactly at scroll 0 and at max scroll).
 */
function SplashBackgroundImpl() {
  const [colors, setColors] = useState<string[]>([]);
  const [extra, setExtra] = useState(0); // px of canvas below the viewport for the drift
  // Freeze the canvas redraw while the hero's opaque twilight image hides it (no
  // point animating an unseen full-screen surface — the biggest steady-state cost
  // since the hero is the page's resting state). Seeded from the current signal in
  // case the hero set it before this mounted.
  const [paused, setPaused] = useState(() => heroCover.get());
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => heroCover.subscribe(setPaused), []);

  useEffect(() => {
    // Read the design tokens straight off the root element's custom properties
    // instead of creating/measuring/removing throwaway <div>s. The values are the
    // same oklch colours the .text-muted-foreground / .text-primary classes resolve
    // to (--color-* alias --muted-foreground / --primary), which the canvas assigns
    // directly to ctx.fillStyle (oklch is a valid fillStyle in every current browser).
    const root = getComputedStyle(document.documentElement);
    const muted = root.getPropertyValue("--muted-foreground").trim();
    const primary = root.getPropertyValue("--primary").trim();
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
    // `p` = scroll position. One style write, no reads.
    const apply = (p: number) => {
      if (wrapRef.current) {
        wrapRef.current.style.transform = `translate3d(0, ${-p * PARALLAX}px, 0)`;
      }
    };

    // Native scroll drives the background drift.
    const onNativeScroll = () => {
      apply(window.scrollY);
    };

    measure();
    apply(window.scrollY);
    window.addEventListener("scroll", onNativeScroll, { passive: true });
    window.addEventListener("resize", measure);
    // Doc height changes (hero expand, images load) → re-measure the drift range.
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);

    return () => {
      window.removeEventListener("scroll", onNativeScroll);
      window.removeEventListener("resize", measure);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      <div
        ref={wrapRef}
        className="absolute inset-x-0 top-0 will-change-transform"
        style={{ height: `calc(100dvh + ${extra}px)` }}
      >
        {colors.length > 0 && <PixelCanvas colors={colors} gap={8} paused={paused} />}
      </div>
      {/* vignette stays pinned to the viewport */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--background)_100%)] opacity-80" />
    </div>
  );
}

// Prop-less — memoized so App's per-scroll state flips don't re-reconcile the background.
export const SplashBackground = memo(SplashBackgroundImpl);
