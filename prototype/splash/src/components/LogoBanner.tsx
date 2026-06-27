// Bottom company-logo banner — scrolling marquee (design proposal #2).
// Locked to the bottom, TRANSLUCENT by default → opaque + paused on hover, both
// edges fade to transparent. Placeholder brand marks (TODO: real client logos).
// Each logo renders MONOCHROME (forced white via `brightness(0) invert(1)`) and
// blooms to its full brand colour on individual hover — the source SVGs already
// carry their brand `fill`, so dropping the filter reveals the colour for free.
//
// WHY JS-DRIVEN (not a CSS keyframe): per-logo :hover needs the pointer hit-test to
// match what's painted. A CSS `transform` animation runs on the COMPOSITOR, and the
// browser hit-tests the track against a position that doesn't track the live painted
// transform — so hovering one logo lit up another several down. Driving translateX on
// the MAIN thread (via the shared frameClock) commits the same transform used for both
// paint AND hit-testing every frame, so hover resolves to the exact logo under the
// cursor. Pause-on-hover then freezes in place with no snap.
import { memo, useEffect, useRef } from "react";
import { frameClock } from "@/lib/frameClock";
import { reducedMotion } from "@/lib/reducedMotion";

// Placeholder defence/aerospace wordmarks (transparent SVGs in /public/media/logos).
// TODO: confirm real ALFA ITG partners + clear logo usage rights before launch.
// `slug` = the SVG filename; `name` = the human label used for alt text.
const LOGOS = [
  { slug: "lockheed-martin", name: "Lockheed Martin" },
  { slug: "honeywell", name: "Honeywell" },
  { slug: "boeing", name: "Boeing" },
  { slug: "thales", name: "Thales" },
  { slug: "dassault", name: "Dassault" },
  { slug: "safran", name: "Safran" },
  { slug: "naval-group", name: "Naval Group" },
  { slug: "mbda", name: "MBDA" },
  { slug: "rheinmetall", name: "Rheinmetall" },
  { slug: "diehl", name: "Diehl" },
  { slug: "airbus", name: "Airbus" },
  { slug: "leonardo", name: "Leonardo" },
];

// One full set traversal time — preserves the old 32s CSS-marquee feel.
const LOOP_MS = 32000;

// The second set is purely visual (seamless loop), so it's hidden from assistive tech
// with empty alt to avoid announcing every partner twice.
function LogoSet({ dup = false, innerRef }: { dup?: boolean; innerRef?: React.Ref<HTMLDivElement> }) {
  return (
    <div ref={innerRef} className="flex shrink-0 items-center gap-16" aria-hidden={dup || undefined}>
      {LOGOS.map(({ slug, name }) => (
        <img
          key={slug}
          src={`/media/logos/${slug}.svg`}
          alt={dup ? "" : `${name} logo`}
          draggable={false}
          className="h-7 w-auto select-none object-contain opacity-70 transition-all duration-300 ease-out [filter:brightness(0)_invert(1)] hover:scale-110 hover:opacity-100 hover:[filter:none]"
        />
      ))}
    </div>
  );
}

function LogoBannerImpl() {
  const trackRef = useRef<HTMLDivElement>(null);
  const setRef = useRef<HTMLDivElement>(null);
  const hoveredRef = useRef(false);
  const offsetRef = useRef(0); // px the track is shifted left
  const strideRef = useRef(0); // one-set width + gap → the seamless wrap distance
  const reducedRef = useRef(false);

  useEffect(() => {
    reducedRef.current = reducedMotion.get();
    const unsubRM = reducedMotion.subscribe((v) => (reducedRef.current = v));

    // Seamless stride = one set's width plus the gap to the next set. Re-measured on
    // layout change (SVGs finishing load, window resize) so the wrap stays exact.
    const measure = () => {
      const track = trackRef.current;
      const set = setRef.current;
      if (!track || !set) return;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      strideRef.current = set.offsetWidth + gap;
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (setRef.current) ro.observe(setRef.current);

    const unsub = frameClock.subscribeDecoration(
      (ctx) => {
        const track = trackRef.current;
        if (!track) return;
        const stride = strideRef.current;
        if (stride > 0 && !hoveredRef.current && !reducedRef.current) {
          // Advance by a fraction of one loop; clamp dt so a tab-away gap can't jump.
          offsetRef.current += (Math.min(ctx.dt, 100) / LOOP_MS) * stride;
          if (offsetRef.current >= stride) offsetRef.current -= stride;
        }
        track.style.transform = `translate3d(${-offsetRef.current}px,0,0)`;
      },
      { el: () => trackRef.current },
    );

    return () => {
      unsub();
      unsubRM();
      ro.disconnect();
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex h-24 items-end justify-center">
      <div
        className="pointer-events-auto relative w-full opacity-75 transition-opacity duration-300 hover:opacity-100"
        onPointerEnter={() => (hoveredRef.current = true)}
        onPointerLeave={() => (hoveredRef.current = false)}
      >
        <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
          <div
            ref={trackRef}
            className="flex w-max items-center gap-16 py-5 will-change-transform"
            aria-label="Trusted by defence and aerospace partners"
          >
            <LogoSet innerRef={setRef} />
            <LogoSet dup />
          </div>
        </div>
      </div>
    </div>
  );
}

// Prop-less — memoized so App's per-scroll state flips don't re-reconcile the banner.
export const LogoBanner = memo(LogoBannerImpl);
