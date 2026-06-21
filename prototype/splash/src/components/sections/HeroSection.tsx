// BEAT 1 — Hero [PIN]. Scroll-to-expand VIDEO that zooms out to full-bleed,
// with the thesis overlaid ON the media (visible before scroll, stays at the end).
// NOTE: ScrollExpandMedia scroll-jacks the window — pinned at top until expanded.
// The on-image CTAs navigate only after the media is expanded (scroll unlocks).
import ScrollExpandMedia from "@/components/ui/scroll-expansion-hero";
import { NeonTag, NEON } from "@/components/_diag";

const goto = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

export function HeroSection() {
  return (
    <section id="hero" data-label="Hero" className="relative">
      <NeonTag color={NEON.hero} label="HERO" />
      <ScrollExpandMedia
        mediaType="video"
        mediaSrc="/media/videos/f22-hero.mp4"
        posterSrc="/media/images/hero/f22-twilight.jpg"
        bgImageSrc="/media/images/hero/f22-twilight.jpg"
        title="Alfa ITG"
        date="Industrial AI"
        scrollToExpand="Scroll to expand"
        textBlend
        mediaOverlay={
          <div className="max-w-3xl text-center">
            {/* mix-blend-difference + white = the inverse of whatever's behind
                it (no drop shadow). */}
            <h2 className="text-3xl font-bold text-white mix-blend-difference md:text-5xl">
              Empowering Fortune 500s with Industrial AI Solutions.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] md:text-lg">
              Our proprietary Industrial AI suite leverages Generative AI on
              real-time data — predicting, automating, and interpreting action
              from complex data sets across the line.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => goto("contact")}
                className="rounded-md bg-white px-6 py-3 font-semibold text-black transition-transform hover:scale-[1.03]"
              >
                Begin Your Transformation
              </button>
              <button
                onClick={() => goto("products")}
                className="rounded-md border border-white/60 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10"
              >
                Explore solutions
              </button>
            </div>
          </div>
        }
      />
      {/* after-scroll thesis block removed per spec — thesis now lives on the media. */}
    </section>
  );
}
