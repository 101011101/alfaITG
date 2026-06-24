// Imperative 0..1 signal: how far the hero's scroll-to-expand zoom has progressed.
// The hero already re-renders every wheel tick from its own scrollProgress state, so
// publishing it here is free. The progress bar subscribes and fills the Hero segment
// IMPERATIVELY (a direct style write, no React state) so App doesn't re-render on
// every zoom frame. Mirrors heroCover. Notifies only on a real change.
let value = 0;
let subs: Array<(v: number) => void> = [];

export const heroZoom = {
  set(next: number) {
    if (next === value) return;
    value = next;
    for (const s of subs) s(value);
  },
  get() {
    return value;
  },
  subscribe(cb: (v: number) => void) {
    subs.push(cb);
    return () => {
      subs = subs.filter((s) => s !== cb);
    };
  },
};
