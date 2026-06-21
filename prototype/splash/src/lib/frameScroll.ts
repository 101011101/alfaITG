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
  gestureGap: number; // ms of no wheel that counts as a NEW gesture (releases a hard stop)
  inertiaDropoff: number; // delta below this fraction of the gesture peak = OS inertia → ignored
  ram: boolean; // false ⇒ EVERY notch is a hard stop (no ram-through at all)
  threshold: number; // (only if ram) notch bar: below it you STOP, at/above you RAM
  penalty: number; // (only if ram) velocity ×= this when you ram a notch
  snapEase: number; // nav animation lerp (only used by goToPos)
  maxVel: number; // velocity clamp
};

const T: Tunables = {
  gain: 0.5,
  friction: 0.94,
  gestureGap: 120,
  inertiaDropoff: 0.7,
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

// Hard-stop lock: after stopping on a notch, swallow the rest of the scroll stream
// (the inertia tail) so it can't immediately push you off. Released by a NEW gesture
// (a pause longer than gestureGap) or a reversal.
let lastWheelT = 0;
let locked = false;
let lockDir = 0; // direction of travel that hit the notch

// Inertia rejection: a wheel "gesture" rises to a peak then decays. The decaying
// tail is OS momentum, not the user — once we've fallen off the peak we drop it.
let peakAbs = 0;
let decaying = false;

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

function onWheel(e: WheelEvent) {
  if (!running) return;
  // At the top frame, scrolling up hands control back to the hero (collapse).
  if (nearestIndex(pos) === 0 && e.deltaY < 0 && pos <= 2) {
    onTopUp?.();
    return;
  }
  e.preventDefault();
  mode = "free"; // user's final control

  const t = performance.now();
  const gap = t - lastWheelT;
  lastWheelT = t;
  const abs = Math.abs(e.deltaY);
  const d = e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : 0;

  // New gesture after a pause → reset the inertia tracking.
  if (gap >= T.gestureGap) {
    decaying = false;
    peakAbs = 0;
  }
  // Rising/at-peak = the user actively pushing. Once delta falls well below the
  // peak, we've entered the OS momentum tail — ignore everything from there.
  if (abs > peakAbs) {
    peakAbs = abs;
    decaying = false;
  } else if (abs < peakAbs * T.inertiaDropoff) {
    decaying = true;
  }
  if (decaying) return; // drop OS inertia — the engine's friction is the only glide

  // Hard-stop lock: hold a notch against a SUSTAINED push (released by a pause/reversal).
  if (locked) {
    if (gap >= T.gestureGap || (d !== 0 && d !== lockDir)) {
      locked = false;
    } else {
      return;
    }
  }

  vel = clamp(vel + e.deltaY * T.gain, -T.maxVel, T.maxVel);
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
      locked = true; // hold here until a new gesture pushes off
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
  const el = document.activeElement as HTMLElement | null;
  if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) {
    return;
  }
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
    decaying = false;
    peakAbs = 0;
    lastScrolled = -1;
    if (lockTail) {
      locked = true;
      lockDir = 1; // the zoom-completing gesture travels downward
      lastWheelT = performance.now(); // treat the continuing tail as the same gesture
    } else {
      locked = false;
    }
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    raf = requestAnimationFrame(tick);
  },
  stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("keydown", onKey);
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

// Live tuning handle in the console.
if (typeof window !== "undefined") {
  (window as unknown as { __frameScroll: typeof frameScroll }).__frameScroll = frameScroll;
}
