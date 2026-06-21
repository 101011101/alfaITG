// Bottom company-logo banner — curved-arc carousel (design proposal #2).
// Locked to the bottom, TRANSLUCENT by default → opaque + paused on hover, both
// edges fade to transparent. Placeholder brand marks (TODO: real client logos).
// Each logo renders MONOCHROME (forced white via `brightness(0) invert(1)`) and
// blooms to its full brand colour on individual hover — the source SVGs already
// carry their brand `fill`, so dropping the filter reveals the colour for free.
// NOTE: this is the React port of design-proposals/logo-banner.html concept #2; the
// "curve" here is a perspective tilt approximation — port the full JS arc if wanted.

// Placeholder defence/aerospace wordmarks (transparent SVGs in /public/media/logos).
// TODO: confirm real ALFA ITG partners + clear logo usage rights before launch.
const LOGOS = [
  "lockheed-martin", "honeywell", "boeing", "thales", "dassault", "safran",
  "naval-group", "mbda", "rheinmetall", "diehl", "airbus", "leonardo",
];

export function LogoBanner() {
  const row = [...LOGOS, ...LOGOS]; // duplicated for a seamless -50% loop
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex h-24 items-end justify-center">
      <div className="group pointer-events-auto relative w-full">
        <div className="opacity-60 transition-opacity duration-300 group-hover:opacity-100">
          <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
            <div className="flex w-max items-center gap-16 py-5 animate-logo-marquee [transform:perspective(900px)_rotateX(12deg)] group-hover:[animation-play-state:paused]">
              {row.map((name, i) => (
                <img
                  key={i}
                  src={`/media/logos/${name}.svg`}
                  alt={name}
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
