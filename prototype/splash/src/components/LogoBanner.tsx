// Bottom company-logo banner — curved-arc carousel (design proposal #2).
// Locked to the bottom, TRANSLUCENT by default → opaque + paused on hover, both
// edges fade to transparent. Placeholder brand marks (TODO: real client logos).
// Each logo renders MONOCHROME (forced white via `brightness(0) invert(1)`) and
// blooms to its full brand colour on individual hover — the source SVGs already
// carry their brand `fill`, so dropping the filter reveals the colour for free.
// NOTE: this is the React port of design-proposals/logo-banner.html concept #2; the
// "curve" here is a perspective tilt approximation — port the full JS arc if wanted.
import { memo } from "react";

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

// Static — built once at module load. Duplicated for a seamless -50% loop; the second
// copy is purely visual, so it's hidden from assistive tech (with empty alt) to avoid
// announcing every partner twice.
const ROW = [
  ...LOGOS.map((l) => ({ ...l, dup: false })),
  ...LOGOS.map((l) => ({ ...l, dup: true })),
];

function LogoBannerImpl() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex h-24 items-end justify-center">
      <div className="group pointer-events-auto relative w-full">
        <div className="opacity-75 transition-opacity duration-300 group-hover:opacity-100">
          <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
            <div
              className="flex w-max items-center gap-16 py-5 animate-logo-marquee [transform:perspective(900px)_rotateX(12deg)] group-hover:[animation-play-state:paused]"
              aria-label="Trusted by defence and aerospace partners"
            >
              {ROW.map(({ slug, name, dup }, i) => (
                <img
                  key={i}
                  src={`/media/logos/${slug}.svg`}
                  alt={dup ? "" : `${name} logo`}
                  aria-hidden={dup || undefined}
                  draggable={false}
                  className="h-7 w-auto select-none object-contain opacity-70 transition-all duration-300 ease-out [filter:brightness(0)_invert(1)] hover:scale-110 hover:opacity-100 hover:[filter:none]"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Prop-less — memoized so App's per-scroll state flips don't re-reconcile the banner.
export const LogoBanner = memo(LogoBannerImpl);
