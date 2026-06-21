// Custom frame scroll engine — wheel-hijacked velocity model. Exactly these rules:
//   • A wheel event adds to velocity (capped at maxVel). Velocity decays by friction.
//   • The ONLY thing that stops you is the NOTCH at each frame's 100% position:
//       – cross a frame with |vel| < threshold  → STOP dead on it (vel = 0).
//       – cross a frame with |vel| ≥ threshold  → RAM through (vel ×= penalty), keep going.
//     The threshold is checked ONLY at the 100% notch — nowhere else.
//   • NO auto-align. Nothing pulls you to a frame at 80% or anywhere between. If a
//     scroll dies between frames, you just rest there.
//   • A new wheel motion is always the user's control (it cancels a nav animation).
// Tunable live via window.__frameScroll.tune({...}).

type Tunables = {
  gain: number; // wheel delta → velocity
  friction: number; // velocity decay per frame (0–1)
  restGap: number; // ms of no wheel = momentum surely over → a real pause, releases the beat
  reaccel: number; // a push must beat the stop speed by this × to leave a frame (1.05 = 5% faster)
  beatHold: number; // ms the frame stays dead-stopped before ANY re-accel can release it (0.3s)
  ram: boolean; // false ⇒ EVERY notch is a hard stop (no ram-through at all)
  threshold: number; // (only if ram) notch bar: below it you STOP, at/above you RAM
  penalty: number; // (only if ram) velocity ×= this when you ram a notch
  snapEase: number; // nav animation lerp (only used by goToPos)
  maxVel: number; // velocity clamp
};

const T: Tunables = {
  gain: 0.5,
  friction: 0.94,
  restGap: 300,
  reaccel: 1.05,
  beatHold: 300,
  ram: false,
  threshold: 90,
  penalty: 0.5,
  snapEase: 0.2,
  maxVel: 130, // must exceed `threshold` or ram can never trigger
};

let frames: number[] = [0];
let pos = 0;
let vel = 0;
let mode: "free" | "nav" = "free";
let navTarget = 0;
let running = false;
let raf = 0;
let lastScrolled = -1;
let onTopUp: (() => void) | null = null;

// Hard-stop lock: after landing on a notch we DELETE the incoming scroll stream
// until inertia INCREASES again. OS momentum (a flick's tail) can only ever shrink,
// so it gets swallowed forever and you rest on the frame; a real new push has to
// RISE to exist, so it's recognised instantly (no pause needed) and moves you one
// slide on. Also released by a direction reversal or a full pause.
let lastWheelT = 0;
let locked = false;
let lockDir = 0; // direction of travel that hit the notch

// On a dead stop we capture the inertia level we stopped at (stopRef, seeded from the
// first wheel delta after the stop) and when (stopTime). To leave the frame, a delta
// must beat stopRef by `reaccel` (5%) AND arrive after `beatHold` (0.3s). The OS
// momentum tail only ever shrinks below stopRef, so it can never clear that bar — no
// glitchy creep; only a deliberate harder push (or a real pause / reversal) moves on.
let stopRef = 0;
let stopSeeded = false;
let stopTime = 0;

// Touch drag: we synthesize wheel-like deltas from finger movement. Track the last
// Y so each move emits the incremental drag (dragging the finger UP scrolls the page
// DOWN, just like a native touch surface). Velocity tracking lets a flick coast.
let lastTouchY = 0;
let lastTouchT = 0;
let touchVel = 0; // px/ms of the most recent move — seeds a flick's coast on release

// Reduced motion: when the user prefers reduced motion we must NOT hijack scroll at
// all (no wheel/touch preventDefault) — native scrolling stays intact. Keyboard
// frame-jump still works. Evaluated at start() and kept live via the MQ 'change'.
let reducedMotion = false;
let motionMql: MediaQueryList | null = null;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

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

// The shared velocity model: turn one positive-down delta (wheel notch OR synthesized
// touch-drag) into velocity through the gesture/inertia/lock machinery. Both the wheel
// and touch paths funnel through here so a beat snaps identically whatever the input.
function applyDelta(deltaY: number) {
  mode = "free"; // user's final control

  const t = performance.now();
  const gap = t - lastWheelT;
  lastWheelT = t;
  const abs = Math.abs(deltaY);
  const d = deltaY > 0 ? 1 : deltaY < 0 ? -1 : 0;

  // Hard-stop lock = the beat. After a dead stop we DELETE the incoming stream until
  // it genuinely re-accelerates past the speed we stopped at. Rules, in order:
  if (locked) {
    if (gap >= T.restGap) {
      // A real pause: momentum is long over, so this delta is a fresh human push.
      locked = false;
    } else if (d !== 0 && d !== lockDir) {
      // Direction reversal (e.g. scrolling back up off the frame).
      locked = false;
    } else if (!stopSeeded) {
      // First delta after the stop = the inertia level we stopped at. Seed the bar
      // from it and swallow it — this is the momentary rest, never an advance.
      stopRef = abs;
      stopSeeded = true;
      return;
    } else if (t - stopTime >= T.beatHold && abs > stopRef * T.reaccel) {
      // 5% faster than the stop speed, and only after the 0.3s hold → move on.
      locked = false;
    } else {
      // stopRef stays PINNED to the speed we stopped at — the decaying tail is
      // always below it, so it can never clear the +50% bar. (Letting it ride down
      // was the leak: the bar collapsed toward zero and small inertia slipped past.)
      return; // delete the inertia tail
    }
  }

  vel = clamp(vel + deltaY * T.gain, -T.maxVel, T.maxVel);
}

function onWheel(e: WheelEvent) {
  if (!running) return;
  // At the top frame, scrolling up hands control back to the hero (collapse).
  if (nearestIndex(pos) === 0 && e.deltaY < 0 && pos <= 2) {
    onTopUp?.();
    return;
  }
  e.preventDefault();
  applyDelta(e.deltaY);
}

// Touch mirrors the wheel: each move's vertical drag becomes a wheel-equivalent delta
// (finger up = page down, so deltaY = lastY − currentY), fed through applyDelta. The
// drag is scaled so a finger flick lands in the same velocity range as a trackpad
// flick. Respect the same input-guard as the keyboard path so a focused field's own
// touch scrolling (e.g. a textarea) is left alone.
const TOUCH_GAIN = 2.4; // px-of-drag → wheel-equivalent delta (tuned to feel native)

function inFormField() {
  const el = document.activeElement as HTMLElement | null;
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
}

function onTouchStart(e: TouchEvent) {
  if (!running || inFormField()) return;
  const tch = e.touches[0];
  if (!tch) return;
  lastTouchY = tch.clientY;
  lastTouchT = performance.now();
  touchVel = 0;
}

function onTouchMove(e: TouchEvent) {
  if (!running || inFormField()) return;
  const tch = e.touches[0];
  if (!tch) return;
  const y = tch.clientY;
  const dragY = lastTouchY - y; // finger up (y decreasing) → positive = scroll down
  lastTouchY = y;

  // At the top frame, dragging down (finger down → dragY < 0) hands control back to
  // the hero (collapse) — mirrors the wheel's top-handoff.
  if (nearestIndex(pos) === 0 && dragY < 0 && pos <= 2) {
    onTopUp?.();
    return;
  }
  e.preventDefault();

  const now = performance.now();
  const dt = now - lastTouchT || 16;
  lastTouchT = now;
  touchVel = dragY / dt; // px/ms, signed — remembered for the release flick

  applyDelta(dragY * TOUCH_GAIN);
}

function onTouchEnd() {
  if (!running) return;
  // A flick: hand off the finger's parting speed as a final shove so the beat can
  // coast/ram exactly as a trackpad flick would. Slow lifts (a deliberate settle)
  // add nothing and just rest where they are.
  const flick = touchVel * 16; // px/ms → ~per-frame delta
  if (Math.abs(flick) > 4) {
    applyDelta(flick * TOUCH_GAIN);
  }
  touchVel = 0;
}

function tick() {
  if (!running) {
    raf = 0;
    return;
  }
  raf = requestAnimationFrame(tick);

  // Nav animation (only from goToPos) — a deliberate, user-initiated move.
  if (mode === "nav") {
    const target = frames[navTarget];
    pos += (target - pos) * T.snapEase;
    if (Math.abs(target - pos) < 0.4) {
      pos = target;
      mode = "free";
      vel = 0;
    }
    drive();
    return;
  }

  // FREE
  vel *= T.friction;
  if (Math.abs(vel) < 0.1) {
    vel = 0; // fully stopped — rest exactly where you are (no auto-align)
    drive();
    return;
  }

  const oldPos = pos;
  let newPos = clamp(pos + vel, frames[0], frames[frames.length - 1]);

  // Notch: did we cross a frame's 100% position this step?
  let notch: number | null = null;
  for (const f of frames) {
    if (vel > 0 && oldPos < f && newPos >= f) {
      notch = f;
      break;
    }
    if (vel < 0 && oldPos > f && newPos <= f) {
      notch = f;
      break;
    }
  }
  if (notch !== null) {
    if (T.ram && Math.abs(vel) >= T.threshold) {
      vel *= T.penalty; // above threshold → ram through, lose half the speed
    } else {
      newPos = notch; // the STOP NOTCH — dead stop at 100%
      lockDir = Math.sign(vel) || lockDir;
      vel = 0;
      locked = true; // hold here until a deliberate re-acceleration pushes off
      stopSeeded = false; // next wheel delta seeds the inertia bar (stopRef)
      stopTime = performance.now(); // start the 0.1s momentary-rest hold
    }
  }
  pos = newPos;
  drive();
}

function drive() {
  const r = Math.round(pos);
  if (r !== lastScrolled) {
    window.scrollTo(0, pos);
    lastScrolled = r;
  }
}

// Animate to a specific frame index (used by keyboard + nav links).
function goToIndex(i: number) {
  navTarget = Math.max(0, Math.min(frames.length - 1, i));
  vel = 0;
  locked = false;
  mode = "nav";
}

// Step one frame from wherever we are.
function step(dir: number) {
  goToIndex(nearestIndex(pos) + dir);
}

// Any NON-scroll input (keyboard) snaps frame-by-frame. Ignored while a form field
// is focused so typing/space/arrows still work in inputs.
function onKey(e: KeyboardEvent) {
  if (!running) return;
  if (inFormField()) return;
  switch (e.key) {
    case "ArrowDown":
    case "ArrowRight":
    case "PageDown":
      e.preventDefault();
      step(1);
      break;
    case "ArrowUp":
    case "ArrowLeft":
    case "PageUp":
      e.preventDefault();
      // At the very top, hand back to the hero (collapse); else step up a frame.
      if (nearestIndex(pos) === 0) onTopUp?.();
      else step(-1);
      break;
    case " ": // Space / Shift+Space
      e.preventDefault();
      step(e.shiftKey ? -1 : 1);
      break;
    case "Home":
      e.preventDefault();
      goToIndex(0);
      break;
    case "End":
      e.preventDefault();
      goToIndex(frames.length - 1);
      break;
    default:
      break;
  }
}

// Attach / detach the scroll-HIJACK listeners (wheel + touch). Kept separate from the
// keyboard listener so reduced-motion can drop the hijack while keeping frame-jump keys.
// touch* are non-passive because onTouchMove calls preventDefault to suppress native scroll.
function bindHijack() {
  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("touchstart", onTouchStart, { passive: false });
  window.addEventListener("touchmove", onTouchMove, { passive: false });
  window.addEventListener("touchend", onTouchEnd, { passive: false });
}
function unbindHijack() {
  window.removeEventListener("wheel", onWheel);
  window.removeEventListener("touchstart", onTouchStart);
  window.removeEventListener("touchmove", onTouchMove);
  window.removeEventListener("touchend", onTouchEnd);
}

// React to a live reduced-motion preference flip while the engine is running: drop the
// hijack when it turns on (native scroll resumes), re-attach it when it turns off.
function onMotionChange(e: MediaQueryListEvent) {
  reducedMotion = e.matches;
  if (!running) return;
  if (reducedMotion) {
    unbindHijack();
    vel = 0;
    locked = false;
    mode = "free";
  } else {
    bindHijack();
  }
}

export const frameScroll = {
  setFrames(positions: number[]) {
    frames = positions.slice().sort((a, b) => a - b);
  },
  setOnTopUp(fn: () => void) {
    onTopUp = fn;
  },
  isRunning() {
    return running;
  },
  // lockTail=true begins LOCKED at the current frame so the gesture that started
  // the engine (e.g. the hero's completing zoom scroll) can't bleed straight
  // through to the next frame — the user must pause and scroll again. This gives
  // the hero the same "beat" every other frame already has via its notch lock.
  start(lockTail = false) {
    if (running) return;
    running = true;
    pos = window.scrollY;
    vel = 0;
    mode = "free";
    lastScrolled = -1;
    if (lockTail) {
      locked = true;
      lockDir = 1; // the zoom-completing gesture travels downward
      stopSeeded = false; // the zoom-completing tail seeds the bar, just like a notch
      stopTime = performance.now(); // start the 0.1s hold for the hero's beat
      lastWheelT = performance.now(); // treat the continuing tail as the same gesture
    } else {
      locked = false;
    }
    // Reduced motion: never hijack scroll — let the page scroll natively. We still bind
    // keyboard (frame-jump stays available) and keep the MQ listener so toggling the
    // preference live re-engages the cinematic engine without a reload.
    motionMql = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotion = motionMql.matches;
    motionMql.addEventListener("change", onMotionChange);
    if (!reducedMotion) {
      bindHijack();
    }
    window.addEventListener("keydown", onKey);
    raf = requestAnimationFrame(tick);
  },
  stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    unbindHijack();
    window.removeEventListener("keydown", onKey);
    if (motionMql) {
      motionMql.removeEventListener("change", onMotionChange);
      motionMql = null;
    }
  },
  /** Animate to the frame nearest a given scroll position (used by nav links). */
  goToPos(y: number) {
    goToIndex(nearestIndex(y));
  },
  tune(patch: Partial<Tunables>) {
    Object.assign(T, patch);
  },
  get debug() {
    return { mode, pos: Math.round(pos), vel: Math.round(vel * 100) / 100, frames, ...T };
  },
};

// Live tuning handle in the console. DEV-only so it isn't exposed in production builds.
if (import.meta.env.DEV && typeof window !== "undefined") {
  (window as unknown as { __frameScroll: typeof frameScroll }).__frameScroll = frameScroll;
}
