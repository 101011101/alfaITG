// BEAT 4 — Proof panel (gooey left / news right). Rendered as a horizontal-rail panel.
import { GooeyText } from "@/components/ui/gooey-text-morphing";
import { StaggerTestimonials } from "@/components/ui/stagger-testimonials";

export function ProofPanel() {
  return (
    <section className="relative grid h-full w-full grid-cols-1 items-center gap-8 px-4 py-16 md:grid-cols-2">
      {/* LEFT — gooey proof points. */}
      <div className="flex flex-col items-center justify-center gap-8 text-center">
        <div className="flex h-[260px] w-full items-center justify-center">
          {/* Real credibility claims from the site copy, lead-first.
              NOTE: "310% ROI" is an ILLUSTRATIVE placeholder — swap for an
              audited figure once real metrics land. */}
          <GooeyText
            texts={["ITAR Registered", "Since 1990", "Fortune 500 partners", "310% ROI"]}
            morphTime={0.6}
            cooldownTime={1.25}
            className="h-full w-full font-bold"
            textClassName="text-white"
          />
        </div>
        <p className="max-w-md text-sm text-muted-foreground">
          ITAR-registered (Mar 2026) for Defense &amp; Aerospace markets — a trusted
          Fortune 500 partner since 1990. <span className="opacity-60">ROI figure illustrative.</span>
        </p>
      </div>

      {/* RIGHT — news carousel, clipped + faded on the center-facing edge. */}
      <div
        className="relative h-[600px] w-full overflow-hidden"
        style={{
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 24%, black 100%)",
          maskImage: "linear-gradient(to right, transparent 0%, black 24%, black 100%)",
        }}
      >
        <StaggerTestimonials />
      </div>
    </section>
  );
}
