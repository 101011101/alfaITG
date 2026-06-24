// Native-scroll frame model. The site scrolls natively; this module is the single
// source of truth for the snap-FRAME geometry (the y-positions of each beat) and the
// "which frame are we nearest" lookup that the progress bar / nav and the scroll-linked
// visuals (background drift, horizontal rail) read from.
//
// It exposes:
//   • setFrames()  — App feeds the measured beat y-positions (recomputed on resize).
//   • indexAt(p)   — nearest snap-frame index to a scroll position (progress / nav).
//
// There is no per-frame pub/sub here: the site is pure native scroll, so every
// scroll-linked component watches the window `scroll` event directly.

let frames: number[] = [0];

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
  // Nearest snap-frame index to a scroll position — the single source of truth for the
  // progress bar / nav "active beat". Pass window.scrollY.
  indexAt(p: number) {
    return nearestIndex(p);
  },
};
