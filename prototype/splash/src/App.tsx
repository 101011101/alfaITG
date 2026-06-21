import { useEffect, useRef, useState } from "react";
import { SplashBackground } from "./components/SplashBackground";
import { LogoBanner } from "./components/LogoBanner";
import { HeroSection } from "./components/sections/HeroSection";
import { HorizontalRail } from "./components/HorizontalRail";
import { frameScroll } from "./lib/frameScroll";

const BEATS = [
  { id: "hero", label: "Hero" },
  { id: "transition", label: "Transition" },
  { id: "products", label: "Products" },
  { id: "proof", label: "Proof" },
  { id: "contact", label: "Contact" },
];

const goto = (id: string) => {
  const el = document.getElementById(id);
  if (!el) return;
  frameScroll.goToPos(el.getBoundingClientRect().top + window.scrollY);
};

export default function App() {
  const [hideBar, setHideBar] = useState(false);
  const [showCorner, setShowCorner] = useState(false);
  const [active, setActive] = useState(0);
  const lastY = useRef(0);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const cursorAtTop = useRef(false);

  // Header behaviour:
  //  - scroll down -> hide; scroll up / at-top -> reveal
  //  - once revealed, auto-hide after a couple seconds of inactivity
  //  - cursor near the top edge pops it out and pins it open while hovering there
  useEffect(() => {
    const IDLE_MS = 2200; // inactivity before the revealed header tucks away
    const TOP_ZONE = 90; // px from the top that counts as "near the header"

    const scheduleHide = () => {
      clearTimeout(idleTimer.current);
      if (cursorAtTop.current) return; // stay open while the cursor lingers up top
      idleTimer.current = setTimeout(() => setHideBar(true), IDLE_MS);
    };

    const onScroll = () => {
      const y = window.scrollY;
      setShowCorner(y > window.innerHeight * 0.8);
      if (y <= 80) {
        setHideBar(false); // at the very top the header always shows
        clearTimeout(idleTimer.current);
      } else if (y < lastY.current) {
        setHideBar(false); // scrolling up reveals it...
        scheduleHide(); // ...but it tucks away again if you go idle
      } else {
        setHideBar(true); // scrolling down hides it immediately
        clearTimeout(idleTimer.current);
      }
      lastY.current = y;
    };

    const onMove = (e: MouseEvent) => {
      const atTop = e.clientY <= TOP_ZONE;
      if (atTop && !cursorAtTop.current) {
        cursorAtTop.current = true;
        setHideBar(false);
        clearTimeout(idleTimer.current);
      } else if (!atTop && cursorAtTop.current) {
        cursorAtTop.current = false;
        scheduleHide(); // cursor left the zone -> resume the idle countdown
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMove);
      clearTimeout(idleTimer.current);
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
      { threshold: 0.5 },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  // Feed the frame-scroll engine the frame positions (hero top + each rail
  // sentinel), recomputed on resize / layout change. The hero starts/stops the
  // engine; this effect only keeps the positions current.
  useEffect(() => {
    const SNAP_IDS = ["transition", "products", "proof", "contact", "footer"];
    const compute = () => {
      const ys = [0];
      for (const id of SNAP_IDS) {
        const el = document.getElementById(id);
        if (el) ys.push(Math.round(el.getBoundingClientRect().top + window.scrollY));
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
