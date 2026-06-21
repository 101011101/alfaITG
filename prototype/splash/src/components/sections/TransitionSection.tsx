// BEAT 2 — "Jet → Schematic" reimagined [PIN].
// A 3D robot that LOOKS AT YOUR CURSOR, ringed by the hoverable product orbit.
// LAYERING FIX (both interactions at once):
//   - robot sits BELOW (z-10), interactive, so the Spline canvas gets the cursor
//     through the gaps and tracks it.
//   - the orbit sits ON TOP (z-20) but its container is pointer-events-none, so
//     moves pass THROUGH to the robot; only the nodes are pointer-events-auto,
//     so hovering a node still pauses + expands its card.
// Background is now transparent — the Silent-Precision pixel canvas shows through.
import RadialOrbitalTimeline from "@/components/ui/radial-orbital-timeline";
import { SplineScene } from "@/components/ui/splite";
import { COMPANY } from "@/lib/products";
import { NeonTag, NEON } from "@/components/_diag";

export function TransitionSection() {
  return (
    <section className="relative h-full w-full overflow-hidden">
      <NeonTag color={NEON.robot} label="ROBOT" />

      {/* Robot — BELOW the orbit, interactive across the WHOLE frame so it tracks
          the cursor everywhere (the canvas now fills the panel, not a 460px box). */}
      <div className="pointer-events-none absolute inset-0 z-[10] flex items-center justify-center">
        <div className="pointer-events-auto relative h-full w-full">
          <SplineScene
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="h-full w-full"
          />
        </div>
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
}
