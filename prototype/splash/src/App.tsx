import { useEffect, useRef, useState } from "react";
import { SplashBackground } from "./components/SplashBackground";
import { LogoBanner } from "./components/LogoBanner";
import { HeroSection } from "./components/sections/HeroSection";
import { HorizontalRail } from "./components/HorizontalRail";

const BEATS = [
  { id: "hero", label: "Hero" },
  { id: "transition", label: "Transition" },
  { id: "products", label: "Products" },
  { id: "proof", label: "Proof" },
  { id: "contact", label: "Contact" },
];

const goto = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

export default function App() {
  const [hideBar, setHideBar] = useState(false);
  const [showCorner, setShowCorner] = useState(false);
  const [active, setActive] = useState(0);
  const lastY = useRef(0);

  // Header hides on scroll-down / shows on scroll-up; corner CTA appears past hero.
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setHideBar(y > lastY.current && y > 80);
      setShowCorner(y > window.innerHeight * 0.8);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Active progress segment = section currently in view.
  useEffect(() => {
    const sections = BEATS.map((b) => document.getElementById(b.id)).filter(
      Boolean,
    ) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const i = sections.indexOf(e.target as HTMLElement);
            if (i >= 0) setActive(i);
          }
        }),
      { threshold: 0.5 },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  // Scroll snap with a "speed bump" / minimum ESCAPE VELOCITY.
  // To LEAVE the current frame you must scroll with intent (peak velocity ≥ ESCAPE).
  // A gentle scroll — or leftover inertia that merely drifts toward the next frame —
  // is TRAPPED and pulled back to the frame the gesture started from. A deliberate
  // fast flick escapes and advances. Snap points = hero (0) + every rail sentinel.
  useEffect(() => {
    const SNAP_IDS = ["transition", "products", "proof", "contact"];
    const ESCAPE = 1.3;          // px/ms (smoothed) needed to escape a frame — tunable
    const SETTLE_MS = 140;       // wait after scroll stops before deciding
    const NEW_GESTURE_GAP = 180; // a pause longer than this begins a fresh gesture

    let timer: ReturnType<typeof setTimeout>;
    let snapping = false;
    let lastY = window.scrollY;
    let lastT = performance.now();
    let vel = 0; // smoothed velocity (px/ms)
    let peak = 0; // peak smoothed velocity this gesture
    let anchor = -1; // frame index the current gesture started from

    const points = () => {
      const ys = [0];
      for (const id of SNAP_IDS) {
        const el = document.getElementById(id);
        if (el) ys.push(Math.round(el.getBoundingClientRect().top + window.scrollY));
      }
      return ys.sort((a, b) => a - b);
    };
    const nearest = (pts: number[], y: number) => {
      let bi = 0;
      let bd = Infinity;
      pts.forEach((p, i) => {
        const d = Math.abs(p - y);
        if (d < bd) {
          bd = d;
          bi = i;
        }
      });
      return bi;
    };

    const decide = () => {
      if (snapping) return;
      const pts = points();
      const y = window.scrollY;
      const near = nearest(pts, y);
      if (anchor < 0 || anchor >= pts.length) anchor = near;
      // Settle if we never left; else ESCAPE (fast) or get TRAPPED back (slow).
      const targetIdx = near === anchor ? anchor : peak >= ESCAPE ? near : anchor;
      const target = pts[targetIdx];
      anchor = targetIdx;
      peak = 0;
      vel = 0;
      if (Math.abs(target - y) > 1) {
        snapping = true;
        window.scrollTo({ top: target, behavior: "smooth" });
        window.setTimeout(() => {
          snapping = false;
          lastY = window.scrollY;
          lastT = performance.now();
        }, 650);
      }
    };

    const onScroll = () => {
      if (snapping) return;
      const now = performance.now();
      const y = window.scrollY;
      const dt = Math.max(now - lastT, 1);
      if (now - lastT > NEW_GESTURE_GAP) {
        vel = 0;
        peak = 0;
        anchor = nearest(points(), y); // remember where this gesture began
      }
      const inst = Math.min(Math.abs(y - lastY) / dt, 4); // clamp single-event spikes
      vel = vel * 0.75 + inst * 0.25; // smooth
      peak = Math.max(peak, vel);
      lastY = y;
      lastT = now;
      clearTimeout(timer);
      timer = setTimeout(decide, SETTLE_MS);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(timer);
    };
  }, []);

  return (
    <>
      <SplashBackground />

      {/* Top header */}
      <header
        className={`fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-border/60 bg-background/80 px-6 backdrop-blur transition-transform duration-300 ${
          hideBar ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <span className="font-bold tracking-[0.2em]">ALFA&nbsp;ITG</span>
        <nav className="flex items-center gap-5 text-sm text-muted-foreground">
          <button onClick={() => goto("products")} className="hover:text-foreground">
            Products
          </button>
          <button onClick={() => goto("proof")} className="hover:text-foreground">
            Proof
          </button>
          <button
            onClick={() => goto("contact")}
            className="rounded border border-foreground/40 px-3 py-1 text-foreground hover:bg-accent"
          >
            Contact
          </button>
        </nav>
      </header>

      {/* Always-visible corner CTA (appears after hero) */}
      <button
        onClick={() => goto("contact")}
        className={`fixed bottom-5 right-5 z-50 rounded-md bg-emerald-400 px-4 py-2 font-bold text-emerald-950 shadow-lg transition-opacity duration-300 ${
          showCorner ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        Contact ↗
      </button>

      {/* Right-edge progress bar: one segment per beat + skip arrows. */}
      <div className="fixed right-7 top-1/2 z-50 flex -translate-y-1/2 flex-col items-center gap-1">
        {BEATS.map((b, i) => (
          <div key={b.id} className="flex flex-col items-center gap-1">
            <button
              title={b.label}
              onClick={() => goto(b.id)}
              className={`w-1 rounded transition-all ${
                active === i ? "h-8 bg-foreground" : "h-6 bg-muted-foreground/40"
              }`}
            />
            {i < BEATS.length - 1 && (
              <button
                title="Skip to next"
                onClick={() => goto(BEATS[i + 1].id)}
                className="text-[9px] leading-none text-muted-foreground/50 hover:text-foreground"
              >
                ▾
              </button>
            )}
          </div>
        ))}
      </div>

      <main>
        <HeroSection />
        <HorizontalRail />
      </main>

      <LogoBanner />
    </>
  );
}
