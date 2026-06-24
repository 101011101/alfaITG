// BEAT 2 — "Jet → Schematic" reimagined [PIN].
// A 3D robot that LOOKS AT YOUR CURSOR, ringed by the hoverable product orbit.
// LAYERING FIX (both interactions at once):
//   - robot sits BELOW (z-10), interactive, so the Spline canvas gets the cursor
//     through the gaps and tracks it.
//   - the orbit sits ON TOP (z-20) but its container is pointer-events-none, so
//     moves pass THROUGH to the robot; only the nodes are pointer-events-auto,
//     so hovering a node still pauses + expands its card.
// Background is now transparent — the Silent-Precision pixel canvas shows through.
import { memo, useEffect, useRef, useState } from "react";
import RadialOrbitalTimeline from "@/components/ui/radial-orbital-timeline";
import { SplineScene } from "@/components/ui/splite";
import { COMPANY } from "@/lib/products";
import { useInViewport } from "@/lib/useInViewport";
import { reducedMotion as reducedMotionSignal } from "@/lib/reducedMotion";

export const TransitionSection = memo(function TransitionSection() {
  // Defer the heavy Spline mount (its ~3.9MB runtime chunk + WebGL context) until
  // the robot panel is nearly on-screen. A small (~10%) lead starts the download
  // just before the panel arrives instead of a full viewport early. Latched: once
  // mounted it stays mounted so scrolling back never reloads the scene (would pop).
  const robotRef = useRef<HTMLDivElement>(null);
  const near = useInViewport(robotRef, "10% 0px");
  const [mountSpline, setMountSpline] = useState(false);
  useEffect(() => {
    if (near) setMountSpline(true);
  }, [near]);

  // The live Spline robot tracks the CURSOR — pointless on touch (no cursor) and
  // expensive (WebGL + ~3.9MB) on phones, and it ignores prefers-reduced-motion.
  // On a coarse pointer OR reduced-motion we swap it for a static schematic image.
  const [staticFallback, setStaticFallback] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const coarse = window.matchMedia("(pointer: coarse)");
    const apply = () =>
      setStaticFallback(coarse.matches || reducedMotionSignal.get());
    apply();
    coarse.addEventListener("change", apply);
    const unsubscribe = reducedMotionSignal.subscribe(apply);
    return () => {
      coarse.removeEventListener("change", apply);
      unsubscribe();
    };
  }, []);

  return (
    <section className="relative h-full w-full overflow-hidden">
      {/* Robot — BELOW the orbit, interactive across the WHOLE frame so it tracks
          the cursor everywhere (the canvas now fills the panel, not a 460px box).
          On touch / reduced-motion this is a static schematic instead of WebGL. */}
      <div ref={robotRef} className="pointer-events-auto absolute inset-0 z-[10]">
        {staticFallback ? (
          <img
            src="/media/images/schematic/airframe-cutaway.webp"
            alt=""
            loading="lazy"
            decoding="async"
            width={1280}
            height={854}
            className="h-full w-full object-contain opacity-70"
          />
        ) : (
          mountSpline && (
            <SplineScene
              scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
              className="h-full w-full"
            />
          )
        )}
      </div>

      {/* Orbit — ON TOP, container non-interactive (moves pass through to the
          robot); only the nodes capture hover/click. */}
      <div className="pointer-events-none absolute inset-0 z-[20]">
        <RadialOrbitalTimeline timelineData={COMPANY} />
      </div>

      {/* Thesis copy. Sits BELOW the orbit (z-20) so an expanded product card
          renders on top of it, but ABOVE the robot (z-10) so it stays readable. */}
      <div className="pointer-events-none absolute left-1/2 top-12 z-[15] -translate-x-1/2 px-4 text-center">
        <h2 className="text-2xl font-bold text-foreground md:text-3xl">
          The company behind the machine
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A leader in Industrial AI since 1990. Hover a node to learn who we are.
        </p>
      </div>
    </section>
  );
});
