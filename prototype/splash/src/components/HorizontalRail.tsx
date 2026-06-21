// The middle of the page = ONE pinned HORIZONTAL scroller.
// Once you reach the rail it pins (you can't scroll "down" anymore); scrolling
// instead slides the track sideways: Robot exits left → Products enters right →
// Proof enters. After Proof, a fast cross-fade brings Contact in OVER it and
// replaces it (buttons/text + ink mouse-trace only enable once fully revealed).
import { useEffect, useRef, useState } from "react";
import { TransitionSection } from "./sections/TransitionSection";
import { ProductsSection } from "./sections/ProductsSection";
import { ProofPanel } from "./sections/ProofPanel";
import InkReveal from "@/components/ui/ink-reveal";
import { NeonTag, NEON } from "@/components/_diag";

const clamp = (v: number) => Math.min(Math.max(v, 0), 1);
const PANELS = 3; // Robot, Products, Proof

export function HorizontalRail() {
  const railRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const rail = railRef.current;
      const track = trackRef.current;
      const contact = contactRef.current;
      if (!rail || !track || !contact) return;
      const vh = window.innerHeight;
      const rect = rail.getBoundingClientRect();
      const total = rail.offsetHeight - vh; // scrollable distance inside the rail
      const sc = Math.min(Math.max(-rect.top, 0), total);

      // HORIZONTAL travel: one screen of scroll per panel transition.
      const hTravel = (PANELS - 1) * vh;
      const tx = (Math.min(sc, hTravel) / vh) * 100; // vw
      track.style.transform = `translate3d(-${tx}vw, 0, 0)`;

      // CONTACT cross-fade: fast, over the next half-screen after Proof centers.
      const c = clamp((sc - hTravel) / (vh * 0.5));
      contact.style.opacity = String(c);
      setRevealed((prev) => (prev === c >= 1 ? prev : c >= 1));
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section ref={railRef} className="relative" style={{ height: "350vh" }}>
      {/* vertical sentinels = progress-bar/nav anchors AND proximity-snap targets */}
      <div id="transition" data-label="Schematic" className="absolute top-0 h-px w-full snap-start" />
      <div id="products" data-label="Products" className="absolute h-px w-full snap-start" style={{ top: "100vh" }} />
      <div id="proof" data-label="Proof" className="absolute h-px w-full snap-start" style={{ top: "200vh" }} />
      <div id="contact" data-label="Contact" className="absolute h-px w-full snap-start" style={{ top: "250vh" }} />

      <div className="sticky top-0 h-screen overflow-hidden">
        {/* horizontal track of full-screen panels */}
        <div
          ref={trackRef}
          className="flex h-full will-change-transform"
          style={{ width: `${PANELS * 100}vw` }}
        >
          <div className="relative h-full w-screen shrink-0 overflow-hidden">
            <TransitionSection />
          </div>
          <div className="relative h-full w-screen shrink-0 overflow-hidden">
            <ProductsSection />
          </div>
          <div className="relative h-full w-screen shrink-0 overflow-hidden">
            <ProofPanel />
          </div>
        </div>

        {/* Contact overlay — fades in over the Proof panel, gated until revealed */}
        {/* pointer-events-none so it never blocks the robot/orbit beneath it while
            invisible; the CTA re-enables events once revealed. */}
        <div
          ref={contactRef}
          className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
          style={{ opacity: 0 }}
          aria-hidden={!revealed}
        >
          <NeonTag color={NEON.contact} label="CONTACT" />
          <img
            src="/media/images/hero/f22-pacific.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* The cross-fade reveals this BLACK mask (80% — image faintly shows
              behind). Always mounted so the fade is to black, not the image; the
              cursor trail only enables once fully revealed. */}
          <InkReveal
            maskColor={[0, 0, 0]}
            brushSize={147}
            enabled={revealed}
            style={{ opacity: 0.9 }}
          />
          <div
            className={`relative z-10 flex flex-col items-center gap-6 px-4 text-center ${
              revealed ? "pointer-events-auto" : ""
            }`}
          >
            <h2 className="text-3xl font-bold text-white drop-shadow-lg md:text-5xl">
              Let&apos;s build it.
            </h2>
            <p className="max-w-md text-sm text-white/80">
              Everything converges here. One conversation to start.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="#"
                tabIndex={revealed ? 0 : -1}
                className="rounded-md bg-white px-6 py-3 font-semibold text-black transition-transform hover:scale-[1.03]"
              >
                Book a call
              </a>
              <a
                href="#"
                tabIndex={revealed ? 0 : -1}
                className="rounded-md border border-white/50 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10"
              >
                Email us
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
