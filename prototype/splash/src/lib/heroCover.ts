// Tiny imperative signal: is the default page background (the Silent-Precision
// pixel canvas) currently HIDDEN behind the hero's opaque pre-expand twilight
// image? The hero writes it as it zooms; SplashBackground subscribes and freezes
// the canvas redraw loop while covered — there's no point animating a full-screen
// surface nobody can see, and freeing the main thread there is the single biggest
// steady-state saving (the hero is the page's resting state on load).
//
// Imperative (not React state) on purpose: scrollProgress changes every wheel
// tick, and routing that through component state would re-render on every frame —
// exactly the churn we're trying to avoid. Subscribers only fire when the boolean
// actually flips (once per scroll-out), never per frame.
let covered = false;
let subs: Array<(c: boolean) => void> = [];

export const heroCover = {
  set(next: boolean) {
    if (next === covered) return; // only notify on a real edge
    covered = next;
    for (const s of subs) s(covered);
  },
  get() {
    return covered;
  },
  subscribe(cb: (c: boolean) => void) {
    subs.push(cb);
    return () => {
      subs = subs.filter((s) => s !== cb);
    };
  },
};
