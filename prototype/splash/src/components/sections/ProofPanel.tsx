// BEAT 4 — Proof panel (gooey left / news right). Rendered as a horizontal-rail panel.
import { GooeyText } from "@/components/ui/gooey-text-morphing";
import { StaggerTestimonials } from "@/components/ui/stagger-testimonials";
import { NeonTag, NEON } from "@/components/_diag";

export function ProofPanel() {
  return (
    <section className="relative grid h-full w-full grid-cols-1 items-center gap-8 px-4 py-16 md:grid-cols-2">
      <NeonTag color={NEON.proof} label="PROOF" />

      {/* LEFT — gooey proof points. */}
      <div className="flex flex-col items-center justify-center gap-8 text-center">
        <div className="flex h-[260px] w-full items-center justify-center">
          {/* TODO: real, sourced proof points — hard number first. */}
          <GooeyText
            texts={["310% ROI", "Analyst-validated", "Battle-tested", "It actually works"]}
            morphTime={1.2}
            cooldownTime={2.5}
            className="h-full w-full font-bold"
            textClassName="text-[#faff00]"
          />
        </div>
        <p className="max-w-md text-sm text-muted-foreground">
          The gate before any ask — an independent ROI signal you can take to the board.
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
