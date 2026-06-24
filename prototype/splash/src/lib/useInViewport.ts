import { useEffect, useState, type RefObject } from "react";

/**
 * Reports whether the element referenced by `ref` is intersecting the viewport.
 * Used to PAUSE continuous animation loops (rAF / CSS) while their panel is
 * scrolled off-screen — on this site every rail panel is always mounted, so
 * without this every loop runs at once even though one panel is visible.
 *
 * `rootMargin` lets a loop wake slightly BEFORE it scrolls in (e.g. "100px" or
 * a full-viewport "100% 0px" to preload heavy mounts like Spline). Intersection
 * Observer accounts for 2D CSS transforms, so the horizontally-translated track
 * panels report correctly as they slide in/out.
 */
export function useInViewport(
  ref: RefObject<Element | null>,
  rootMargin = "0px",
): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // No IO (SSR / ancient browsers): assume visible so nothing stays silently paused.
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);

  return inView;
}
