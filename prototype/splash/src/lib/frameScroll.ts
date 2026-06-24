// Native-scroll frame model. The site scrolls natively; this module is the single
// source of truth for the snap-FRAME geometry (the y-positions of each beat) and the
// "which frame are we nearest" lookup that the progress bar / nav and the scroll-linked
// visuals (background drift, horizontal rail) read from.
//
// It exposes:
//   • setFrames()  — App feeds the measured beat y-positions (recomputed on resize).
//   • indexAt(p)   — nearest snap-frame index to a scroll position (progress / nav).
//   • subscribe()  — register a per-frame callback (kept for the synchronized-visuals
//                    contract); the components also watch native scroll directly.
//   • isHijacking()— whether scroll is being driven by a hijack engine. There is no
//                    such engine here (the site is pure native scroll), so this is
//                    always false — the components' native-scroll paths always run.

let frames: number[] = [0];

// Per-frame subscribers. Retained so scroll-linked visuals can register a synchronized
// callback; in the pure native-scroll model nothing drives them centrally, so each
// component's own native-scroll handler is what updates it.
let frameSubs: Array<(pos: number) => void> = [];

const nearestIndex = (p: number) => {
  let bi = 0;
  let bd = Infinity;
  frames.forEach((f, i) => {
    const d = Math.abs(f - p);
    if (d < bd) {
      bd = d;
      bi = i;
    }
  });
  return bi;
};

export const frameScroll = {
  setFrames(positions: number[]) {
    frames = positions.slice().sort((a, b) => a - b);
  },
  // Subscribe to a per-frame callback (receives a scroll position). Returns an
  // unsubscribe fn. Used by scroll-linked visuals; in the native-scroll model the
  // components also watch native scroll, which is what actually updates them.
  subscribe(cb: (pos: number) => void) {
    frameSubs.push(cb);
    return () => {
      frameSubs = frameSubs.filter((f) => f !== cb);
    };
  },
  // Whether scroll is being driven by a hijack engine. The site is pure native scroll,
  // so this is always false — every component's native-scroll path always runs.
  isHijacking() {
    return false;
  },
  // Nearest snap-frame index to a scroll position — the single source of truth for the
  // progress bar / nav "active beat". Pass window.scrollY.
  indexAt(p: number) {
    return nearestIndex(p);
  },
};
