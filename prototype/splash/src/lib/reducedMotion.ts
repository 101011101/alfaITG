// Single source of truth for the user's prefers-reduced-motion setting. Replaces
// the separate matchMedia listeners that had drifted across frameScroll, the hero
// and the pixel canvas — one of which never listened for 'change' at all, so it
// went stale when the preference was flipped live. One MediaQueryList + one change
// listener here; everything else reads get() or subscribes (mirrors heroCover).
let value = false;
let subs: Array<(v: boolean) => void> = [];

if (typeof window !== "undefined" && window.matchMedia) {
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  value = mql.matches;
  mql.addEventListener("change", (e) => {
    value = e.matches;
    for (const s of subs) s(value);
  });
}

export const reducedMotion = {
  get() {
    return value;
  },
  subscribe(cb: (v: boolean) => void) {
    subs.push(cb);
    return () => {
      subs = subs.filter((s) => s !== cb);
    };
  },
};
