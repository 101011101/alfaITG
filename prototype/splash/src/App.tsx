import { useEffect, useRef, useState } from "react";
import { SplashBackground } from "./components/SplashBackground";
import { LogoBanner } from "./components/LogoBanner";
import { HeroSection } from "./components/sections/HeroSection";
import { HorizontalRail } from "./components/HorizontalRail";
import { frameScroll } from "./lib/frameScroll";

// Single source of truth for every beat of the page. Each view below is derived
// from this array so the progress bar, header nav and snap engine can never drift:
//  - `label`   : progress-bar / generic label (logo doubles as Hero, so hero needs no nav)
//  - `navLabel`: friendly header-nav label; presence of it puts the beat in the nav
//  - `isCta`   : render this nav item as the bordered call-to-action button
type Beat = { id: string; label: string; navLabel?: string; isCta?: boolean };
const BEATS: Beat[] = [
  { id: "hero", label: "Hero" },
  { id: "transition", label: "Transition", navLabel: "About" },
  { id: "products", label: "Products", navLabel: "Products" },
  { id: "proof", label: "Proof", navLabel: "Proof" },
  { id: "contact", label: "Contact", navLabel: "Contact", isCta: true },
];

// Header nav — every beat that carries a friendly navLabel (logo = Hero).
const NAV = BEATS.filter((b) => b.navLabel);

const goto = (id: string) => {
  const el = document.getElementById(id);
  if (!el) return;
  frameScroll.goToPos(el.getBoundingClientRect().top + window.scrollY);
};

export default function App() {
  const [hideBar, setHideBar] = useState(false);
  const [showCorner, setShowCorner] = useState(false);
  const [active, setActive] = useState(0);
  const [atTop, setAtTop] = useState(true);
  const lastY = useRef(0);
  const hoveringHeader = useRef(false); // pause the idle-fade while the nav is in use
  const revealHeader = useRef<() => void>(() => {});
  const pauseHeaderFade = useRef<() => void>(() => {});

  // Header behaviour (tuned for the scroll-jacked frame site):
  //  - it hides immediately while you scroll DOWN (get out of the way while reading)
  //  - any reveal (scroll UP, settling at the top, or reaching the top edge) shows it
  //    and arms a 3s idle timer that fades it back out once you stop interacting
  //  - a small delta keeps a frame-snap's overshoot from flipping it
  //  - hovering the header itself pauses the fade so it can't vanish mid-click
  useEffect(() => {
    const TOP_ZONE = 90; // px from the top that counts as "reaching for the header"
    const DELTA = 8; // ignore sub-threshold jitter / snap overshoot
    const IDLE = 3000; // ms of inactivity before the header fades away
    let timer: ReturnType<typeof setTimeout> | undefined;

    const pauseFade = () => { if (timer) clearTimeout(timer); };
    const armFade = () => {
      pauseFade();
      timer = setTimeout(() => {
        if (!hoveringHeader.current) setHideBar(true);
      }, IDLE);
    };
    const reveal = () => { setHideBar(false); armFade(); }; // show now, fade after 3s idle
    revealHeader.current = reveal;
    pauseHeaderFade.current = pauseFade;

    const onScroll = () => {
      const y = window.scrollY;
      setAtTop(y <= 80);
      setShowCorner(y > window.innerHeight * 0.8);
      if (y > lastY.current + DELTA) { pauseFade(); setHideBar(true); } // scrolling down hides now
      else if (y < lastY.current - DELTA) reveal(); // scrolling up reveals, then idle-fades
      else if (y <= 80) reveal(); // settled at the hero: reveal, then idle-fades
      lastY.current = y;
    };

    const onMove = (e: MouseEvent) => {
      if (e.clientY <= TOP_ZONE) reveal(); // reach for the top edge -> reveal, then idle-fades
    };

    onScroll();
    armFade(); // start the countdown on load so it fades if left untouched
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      pauseFade();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMove);
    };
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
      { threshold: 0 },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
    // threshold:0 (any pixel visible), not 0.5: the watched targets are 1px
    // `h-px` sentinels, where "50% visible" is a sub-pixel coin-flip that fires
    // erratically. threshold:0 resolves the active beat reliably.
  }, []);

  // Feed the frame-scroll engine the frame positions (hero top + each rail
  // sentinel), recomputed on resize / layout change. The hero starts/stops the
  // engine; this effect only keeps the positions current.
  useEffect(() => {
    // Snap frames = every beat past the hero (hero lives at position 0 above),
    // plus the trailing "footer" sentinel. Derived from BEATS so it stays in
    // lock-step with the nav / progress bar.
    //
    // COUPLING: these ids must match the sentinel <div id=...> elements rendered
    // by HorizontalRail (the `h-px` markers the IntersectionObserver also watches).
    // HorizontalRail is owned elsewhere — keep this list and its sentinels aligned.
    const SNAP_IDS = [...BEATS.filter((b) => b.id !== "hero").map((b) => b.id), "footer"];
    const compute = () => {
      const ys = [0];
      const missing: string[] = [];
      for (const id of SNAP_IDS) {
        const el = document.getElementById(id);
        if (el) ys.push(Math.round(el.getBoundingClientRect().top + window.scrollY));
        else missing.push(id);
      }
      // DEV drift guard: a snap id with no matching sentinel <div id=...> means
      // this list and HorizontalRail's rendered sentinels have fallen out of sync.
      if (import.meta.env.DEV && missing.length) {
        console.warn("[App] snap ids with no DOM sentinel (App↔HorizontalRail drift):", missing);
      }
      frameScroll.setFrames(ys);
    };
    compute();
    window.addEventListener("resize", compute);
    const ro = new ResizeObserver(compute);
    ro.observe(document.body);
    return () => {
      window.removeEventListener("resize", compute);
      ro.disconnect();
    };
  }, []);

  return (
    <>
      <SplashBackground />

      {/* Top header */}
      <header
        onMouseEnter={() => { hoveringHeader.current = true; pauseHeaderFade.current(); }}
        onMouseLeave={() => { hoveringHeader.current = false; revealHeader.current(); }}
        className={`fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b px-6 transition-[opacity,background-color,border-color] duration-500 ${
          hideBar ? "pointer-events-none opacity-0" : "opacity-100"
        } ${
          atTop
            ? "border-transparent bg-transparent"
            : "border-border/60 bg-background/80 backdrop-blur"
        }`}
      >
        {/* Wordmark doubles as "home" — back to the top/hero. */}
        <button
          onClick={() => goto("hero")}
          className="font-bold tracking-[0.2em] text-foreground transition-opacity hover:opacity-70"
        >
          ALFA&nbsp;ITG
        </button>
        <nav className="flex items-center gap-5 text-sm text-muted-foreground">
          {NAV.map((item) => {
            const isActive = BEATS[active]?.id === item.id;
            return item.isCta ? (
              <button
                key={item.id}
                onClick={() => goto(item.id)}
                className={`rounded border px-3 py-1 text-foreground transition-colors ${
                  isActive ? "border-foreground bg-accent" : "border-foreground/40 hover:bg-accent"
                }`}
              >
                {item.navLabel}
              </button>
            ) : (
              <button
                key={item.id}
                onClick={() => goto(item.id)}
                className={`transition-colors ${
                  isActive ? "text-foreground" : "hover:text-foreground"
                }`}
              >
                {item.navLabel}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Always-visible corner CTA (appears after hero) */}
      <button
        onClick={() => goto("contact")}
        className={`fixed bottom-5 right-5 z-50 rounded border border-foreground/40 bg-background/80 px-3 py-1 text-foreground backdrop-blur transition-opacity duration-300 hover:bg-accent ${
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
