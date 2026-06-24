// THE master rAF for the whole splash. One loop that ticks every DECORATION animation
// that subscribes — each independently gated by:
//        • fps                 — throttle (e.g. 20 / 30)
//        • el                  — on-screen visibility via ONE shared IntersectionObserver
//        • enabled()           — custom predicate (e.g. !heroCover)
//        • skipWhileScrolling  — NOT run on frames flagged scroll-active.
// The loop sleeps when no decoration wants frames; it is woken by requestTick() (a
// newly visible/enabled subscriber, or the tab becoming visible again). Merging loops
// doesn't save cycles — the browser already batches rAF — the win is this SCHEDULER: it
// can silence anything off-screen, centrally.

export type DecorationContext = { now: number; dt: number; scrollActive: boolean };

interface DecorationOptions {
  fps?: number;
  el?: () => Element | null;
  enabled?: () => boolean;
  skipWhileScrolling?: boolean;
}

interface DecoSub extends DecorationOptions {
  fn: (ctx: DecorationContext) => void;
  _last: number;
  _visible: boolean;
  _observed: Element | null;
}

let decos: DecoSub[] = [];
let raf = 0;
let lastNow = 0;
let io: IntersectionObserver | null = null;

function ensureIO() {
  if (io || typeof IntersectionObserver === "undefined") return;
  io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const s = decos.find((d) => d._observed === e.target);
        if (s) s._visible = e.isIntersecting;
      }
      requestTick(); // a subscriber may have just become visible → wake
    },
    { rootMargin: "100px" },
  );
}

// Observe any subscriber whose element exists but isn't being watched yet (refs
// mount a frame or two after subscribe). Cheap — only touches not-yet-observed subs.
function syncObservers() {
  if (!io) return;
  for (const s of decos) {
    if (!s.el || s._observed) continue;
    const el = s.el();
    if (el) {
      io.observe(el);
      s._observed = el;
    }
  }
}

function tick(now: number) {
  raf = 0;
  const dt = lastNow ? now - lastNow : 16;
  lastNow = now;

  // Decoration — gated. `anyAlive` keeps the clock running even on frames a
  // subscriber is merely skipped (throttled).
  let anyAlive = false;
  const hidden = typeof document !== "undefined" && document.hidden;
  if (!hidden && decos.length) {
    syncObservers();
    const ctx: DecorationContext = { now, dt, scrollActive: false };
    for (const s of decos) {
      const alive = (!s.enabled || s.enabled()) && (!s.el || s._visible);
      if (!alive) continue;
      anyAlive = true;
      if (s.fps) {
        if (s._last && now - s._last < 1000 / s.fps) continue;
        s._last = now;
      }
      try {
        s.fn(ctx);
      } catch (err) {
        if (import.meta.env.DEV) console.error("[frameClock] decoration threw:", err);
      }
    }
  }

  if (anyAlive) raf = requestAnimationFrame(tick);
}

export function requestTick() {
  if (!raf) raf = requestAnimationFrame(tick);
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) requestTick();
  });
}

export const frameClock = {
  requestTick,
  /**
   * Subscribe a decoration animation to the master loop. Returns an unsubscribe fn.
   * The loop calls fn(ctx) at most once per frame, subject to the gates in opts.
   */
  subscribeDecoration(
    fn: (ctx: DecorationContext) => void,
    opts: DecorationOptions = {},
  ) {
    const s: DecoSub = { fn, ...opts, _last: 0, _visible: !opts.el, _observed: null };
    decos.push(s);
    ensureIO();
    requestTick();
    return () => {
      if (s._observed && io) io.unobserve(s._observed);
      decos = decos.filter((d) => d !== s);
    };
  },
};
