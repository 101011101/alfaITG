import { useEffect, useRef, useState } from "react";
import { SplashBackground } from "./components/SplashBackground";
import { LogoBanner } from "./components/LogoBanner";
import { HeroSection } from "./components/sections/HeroSection";
import { HorizontalRail } from "./components/HorizontalRail";
import { frameScroll } from "./lib/frameScroll";
import { heroZoom } from "./lib/heroZoom";

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
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
};

export default function App() {
  const [hideBar, setHideBar] = useState(false);
  const [showCorner, setShowCorner] = useState(false);
  const [active, setActive] = useState(0);
  const [atTop, setAtTop] = useState(true);
  const lastY = useRef(0);
  const heroFillRef = useRef<HTMLDivElement>(null); // Hero segment fill, driven by zoom progress
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

    // The actual header-state update. CRITICAL: it uses the `pos` the engine hands
    // it — NOT window.scrollY. Reading scrollY here (right after the engine's
    // scrollTo write) forced a synchronous reflow on EVERY scroll frame. innerHeight
    // is cached and refreshed on resize for the same reason. (setState on unchanged
    // primitives bails out in React, so the only cost is this function running.)
    let vh = window.innerHeight;
    const apply = (p = window.scrollY) => {
      const y = p;
      setAtTop(y <= 80);
      setShowCorner(y > vh * 0.8);
      if (y > lastY.current + DELTA) { pauseFade(); setHideBar(true); } // scrolling down hides now
      else if (y < lastY.current - DELTA) reveal(); // scrolling up reveals, then idle-fades
      else if (y <= 80) reveal(); // settled at the hero: reveal, then idle-fades
      lastY.current = y;
    };

    // Native scroll drives the header state. (subscribe is kept for the
    // scroll-linked-visuals contract; the page scrolls natively.)
    const unsub = frameScroll.subscribe(apply);
    const onNativeScroll = () => {
      apply();
    };
    const onResize = () => { vh = window.innerHeight; };

    const onMove = (e: MouseEvent) => {
      if (e.clientY <= TOP_ZONE) reveal(); // reach for the top edge -> reveal, then idle-fades
    };

    apply(); // set initial state synchronously (no first-frame flash)
    armFade(); // start the countdown on load so it fades if left untouched
    window.addEventListener("scroll", onNativeScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      pauseFade();
      unsub();
      window.removeEventListener("scroll", onNativeScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  // Active progress segment — read straight from the frame engine (single source of
  // truth) instead of a second IntersectionObserver. The old observer watched 1px
  // sentinels with threshold 0; several were in view at once, so the highlight fired
  // erratically and disagreed with the frame the engine was actually parked on. Now
  // the engine's own nearest-frame index drives it, so the bar can never dis.
  useEffect(() => {
    const update = (p = window.scrollY) =>
      setActive(Math.min(frameScroll.indexAt(p), BEATS.length - 1));
    const unsub = frameScroll.subscribe(update);
    // Native scroll updates the active progress segment.
    const onNative = () => {
      update();
    };
    update();
    window.addEventListener("scroll", onNative, { passive: true });
    return () => {
      unsub();
      window.removeEventListener("scroll", onNative);
    };
  }, []);

  // The Hero segment fills with the zoom (which isn't scroll, so the engine-driven
  // `active` above can't show it). Driven imperatively off the heroZoom signal so a
  // per-frame zoom value never re-renders App. Only meaningful while on the hero
  // (active === 0); past that the segment is muted like any other inactive beat.
  useEffect(() => {
    const setFill = () => {
      const el = heroFillRef.current;
      if (el) el.style.height = `${(active === 0 ? heroZoom.get() : 0) * 100}%`;
    };
    setFill();
    return heroZoom.subscribe(setFill);
  }, [active]);

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
      {/* Skip link — first focusable element so keyboard/AT users can bypass the
          fixed chrome and jump straight to the page content. */}
      <a
        href="#main-content"
        className="sr-only z-[100] rounded bg-background px-4 py-2 text-foreground outline outline-2 outline-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      <SplashBackground />

      {/* Top header. Reveals on hover OR keyboard focus (focus-within), and the
          idle-fade is paused while either is active so it can't vanish mid-use. */}
      <header
        onMouseEnter={() => { hoveringHeader.current = true; pauseHeaderFade.current(); }}
        onMouseLeave={() => { hoveringHeader.current = false; revealHeader.current(); }}
        onFocusCapture={() => { hoveringHeader.current = true; pauseHeaderFade.current(); setHideBar(false); }}
        onBlurCapture={() => { hoveringHeader.current = false; revealHeader.current(); }}
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
      <nav
        aria-label="Section progress"
        className="fixed right-7 top-1/2 z-50 flex -translate-y-1/2 flex-col items-center gap-1"
      >
        {BEATS.map((b, i) => (
          <div key={b.id} className="flex flex-col items-center gap-1">
            <button
              aria-label={`Go to ${b.label}`}
              aria-current={active === i ? "true" : undefined}
              onClick={() => goto(b.id)}
              className={`relative w-1 overflow-hidden rounded transition-all ${
                active === i ? "h-8" : "h-6"
              } ${
                // Hero (i===0) base is always muted; its fill overlay (below) shows
                // the zoom. Other beats use the plain active/inactive highlight.
                i !== 0 && active === i ? "bg-foreground" : "bg-muted-foreground/40"
              }`}
            >
              {i === 0 && (
                <span
                  ref={heroFillRef}
                  className="absolute inset-x-0 bottom-0 bg-foreground"
                  style={{ height: 0 }}
                />
              )}
            </button>
            {i < BEATS.length - 1 && (
              <button
                aria-label={`Skip to ${BEATS[i + 1].label}`}
                onClick={() => goto(BEATS[i + 1].id)}
                className="text-[9px] leading-none text-muted-foreground/70 hover:text-foreground"
              >
                <span aria-hidden="true">▾</span>
              </button>
            )}
          </div>
        ))}
      </nav>

      <main id="main-content">
        <HeroSection />
        <HorizontalRail />
      </main>

      <LogoBanner />
    </>
  );
}
