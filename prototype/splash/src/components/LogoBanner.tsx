// Bottom company-logo banner — curved-arc carousel (design proposal #2).
// Locked to the bottom, TRANSLUCENT by default → opaque + paused on hover, both
// edges fade to transparent. Offline text wordmarks (TODO: real client logos).
// NOTE: this is the React port of design-proposals/logo-banner.html concept #2; the
// "curve" here is a perspective tilt approximation — port the full JS arc if wanted.
import { NeonTag, NEON } from "@/components/_diag";

const LOGOS = [
  "NORTHWIND", "VANTA", "ACME", "HELIOS", "ORBIT",
  "KESTREL", "AXIOM", "NIMBUS", "FORGE", "MERIDIAN",
];

export function LogoBanner() {
  const row = [...LOGOS, ...LOGOS]; // duplicated for a seamless -50% loop
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex h-24 items-end justify-center">
      <div className="group pointer-events-auto relative w-full">
        <NeonTag color={NEON.banner} label="LOGO BANNER" />
        <div className="opacity-40 transition-opacity duration-300 group-hover:opacity-100">
          <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
            <div className="flex w-max items-center gap-16 py-5 animate-logo-marquee [transform:perspective(900px)_rotateX(12deg)] group-hover:[animation-play-state:paused]">
              {row.map((name, i) => (
                <span
                  key={i}
                  className="select-none whitespace-nowrap text-lg font-semibold tracking-[0.25em] text-foreground/80"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
