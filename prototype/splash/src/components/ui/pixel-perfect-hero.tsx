"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* -----------------------------------------------------------------------------
 * CANVAS — RANDOM SHIMMER + COORDINATED CHLADNI NODE LINES
 * ---------------------------------------------------------------------------
 * Two layers:
 *
 *  1. BASE (always on, everywhere): the original Silent-Precision shimmer — every
 *     dot twinkles its size on its own random phase. This is the "random white
 *     splotches" that must persist even off the wave.
 *
 *  2. NODES (coordinated): a Chladni plate figure's amplitude darkens each dot —
 *     full brightness at the antinodes, smoothly down to PITCH BLACK at the nodal
 *     lines (where the plate doesn't move). A single figure:
 *
 *        chladni(X,Y; m,n) = cos(mπX)cos(nπY) − cos(nπX)cos(mπY)   X,Y ∈ [0,1]
 *
 *     |chladni()| is the local amplitude (0 at a node, max at an antinode). We
 *     PRECOMPUTE each figure value per pixel in init(); per frame we crossfade
 *     between figure 1 and figure 2 (so the dark valleys migrate between the two
 *     patterns) and scale every dot's colour toward black by its amplitude.
 *     Live-tunable: window.__pixelWave.tune({…}).
 * -------------------------------------------------------------------------- */

type WaveConfig = {
  m1: number; n1: number; // Chladni figure 1 (mode integers → number of lobes)
  m2: number; n2: number; // Chladni figure 2
  omega: number; // crossfade speed (rad/s): figure 1 ↔ figure 2
  figNorm: number; // |figure| amplitude mapped to full brightness
  figGamma: number; // darkening curve (>1 = broader dimming toward nodes)
  shimmerSpeed: number; // random-shimmer twinkle speed (size px/frame multiplier)
  shimmerFloor: number; // dimmest a twinkling dot gets (0 = fully dark at min size)
  brightness: number; // global dimmer (0–1) applied to the whole canvas
};

const WAVE: WaveConfig = {
  m1: 3, n1: 2,
  m2: 5, n2: 3,
  omega: 0.7,
  figNorm: 0.9,
  figGamma: 1.0,
  shimmerSpeed: 1,
  shimmerFloor: 0.6, // resting dots stay clearly colour; twinkle brightens on top
  brightness: 0.8,
};

// Per-frame globals: the two figure weights, set once per frame, read by every
// pixel (keeps the loop cheap).
let waveW1 = 1;
let waveW2 = 0;
let waveGap = 6;

const chladni = (X: number, Y: number, m: number, n: number) =>
  Math.cos(m * Math.PI * X) * Math.cos(n * Math.PI * Y) -
  Math.cos(n * Math.PI * X) * Math.cos(m * Math.PI * Y);

type Pixel = {
  x: number;
  y: number;
  color: string;
  ctx: CanvasRenderingContext2D;
  speed: number;
  size: number;
  sizeStep: number;
  minSize: number;
  maxSize: number;
  delay: number;
  counter: number;
  counterStep: number;
  isIdle: boolean;
  isReverse: boolean;
  isShimmer: boolean;
  w1: number; // precomputed Chladni figure-1 value at this pixel
  w2: number; // precomputed Chladni figure-2 value at this pixel
  tone: number; // per-pixel grey level (0 = black … 1 = white)
  draw: () => void;
  appear: () => void;
  shimmer: () => void;
};

function createPixel(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  x: number,
  y: number,
  color: string,
  baseSpeed: number,
  delay: number
): Pixel {
  const rand = (min: number, max: number) => Math.random() * (max - min) + min;
  const tone = rand(0, 1); // each dot's own grey level → black↔white variation

  const p: Pixel = {
    x, y, color, ctx,
    speed: rand(0.04, 0.12) * baseSpeed,
    size: 0,
    sizeStep: rand(0.12, 0.28),
    minSize: 0.5,
    maxSize: rand(1.5, 3.5),
    delay,
    counter: 0,
    counterStep: rand(1.8, 3.2) + (canvas.width + canvas.height) * 0.008,
    isIdle: false,
    isReverse: false,
    isShimmer: false,
    w1: 0,
    w2: 0,
    tone,
    draw() {
      const offset = (waveGap - p.size) / 2;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x + offset, p.y + offset, p.size, p.size);
    },
    // Entrance bloom: dots rise from the centre outward (delay = distance), then
    // settle into the perpetual random shimmer.
    appear() {
      p.isIdle = false;
      if (p.counter <= p.delay) {
        p.counter += p.counterStep;
        return;
      }
      if (p.size >= p.maxSize) p.isShimmer = true;
      if (p.isShimmer) p.shimmer();
      else p.size += p.sizeStep;
      p.draw();
    },
    // The base random shimmer: size drifts between minSize and maxSize forever.
    shimmer() {
      if (p.size >= p.maxSize) p.isReverse = true;
      else if (p.size <= p.minSize) p.isReverse = false;
      if (p.isReverse) p.size -= p.speed;
      else p.size += p.speed;
    },
  };

  return p;
}

type PixelCanvasProps = {
  colors: string[];
  gap?: number;
};

export function PixelCanvas({ colors, gap = 5 }: PixelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pixelsRef = useRef<Pixel[]>([]);
  const animationRef = useRef<number>(0);
  const lastFrameRef = useRef(performance.now());
  const startRef = useRef(performance.now());
  const reducedMotionRef = useRef(false);

  const init = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap || colors.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = wrap.getBoundingClientRect();
    const w = Math.floor(width);
    const h = Math.floor(height);
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    waveGap = gap;
    const baseSpeed = reducedMotionRef.current ? 0 : WAVE.shimmerSpeed;

    const pixels: Pixel[] = [];
    for (let x = 0; x < w; x += gap) {
      for (let y = 0; y < h; y += gap) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const dx = x - w / 2;
        const dy = y - h / 2;
        const delay = reducedMotionRef.current ? 0 : Math.sqrt(dx * dx + dy * dy) * 0.65;
        const pix = createPixel(ctx, canvas, x, y, color, baseSpeed, delay);
        // Precompute both Chladni figures at this pixel (normalized plate coords
        // [0,1]). Constant → the per-frame loop just blends them.
        const X = w > 0 ? x / w : 0;
        const Y = h > 0 ? y / h : 0;
        pix.w1 = chladni(X, Y, WAVE.m1, WAVE.n1);
        pix.w2 = chladni(X, Y, WAVE.m2, WAVE.n2);
        pixels.push(pix);
      }
    }

    pixelsRef.current = pixels;
  }, [colors, gap]);

  const animate = useCallback(() => {
    cancelAnimationFrame(animationRef.current);
    const frameInterval = 1000 / 60;

    const loop = () => {
      animationRef.current = requestAnimationFrame(loop);

      const now = performance.now();
      const elapsed = now - lastFrameRef.current;
      if (elapsed < frameInterval) return;
      lastFrameRef.current = now - (elapsed % frameInterval);

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = WAVE.brightness; // global dimmer over both layers

      // Crossfade the figure weights: b sweeps 0→1→0 so the dark valleys migrate
      // figure 1 → figure 2 → figure 1. Reduced motion → frozen on fig 1.
      const t = (now - startRef.current) / 1000;
      const b = reducedMotionRef.current ? 0 : (1 - Math.cos(WAVE.omega * t)) / 2;
      waveW1 = 1 - b;
      waveW2 = b;

      const figNorm = WAVE.figNorm;
      const figGamma = WAVE.figGamma;
      const shimmerFloor = WAVE.shimmerFloor;

      for (const p of pixelsRef.current) {
        // Entrance bloom, then the perpetual random shimmer (updates p.size).
        if (!p.isShimmer) {
          p.appear();
          continue;
        }
        p.shimmer();

        // RANDOM SHIMMER (antinodes): each dot's current size also drives its
        // brightness, so dots twinkle between dim/small and bright/large — the
        // "random white splotches" of the resting background.
        const tw = (p.size - p.minSize) / (p.maxSize - p.minSize); // 0…1
        let bright = shimmerFloor + (1 - shimmerFloor) * tw;

        // NODE DARKENING: local wave amplitude |F| scales brightness — full at
        // antinodes, smoothly down to pitch black at the nodal lines (|F| = 0).
        const F = waveW1 * p.w1 + waveW2 * p.w2;
        let factor = Math.abs(F) / figNorm;
        if (factor > 1) factor = 1;
        if (figGamma !== 1) factor = Math.pow(factor, figGamma);
        bright *= factor;

        // Grey level: per-pixel tone (black↔white) × twinkle × node darkening.
        const val = (255 * p.tone * bright) | 0;
        ctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
        const offset = (waveGap - p.size) / 2;
        ctx.fillRect(p.x + offset, p.y + offset, p.size, p.size);
      }
    };

    animationRef.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    startRef.current = performance.now();
    init();

    const resizeObserver = new ResizeObserver(() => init());
    if (wrapRef.current) resizeObserver.observe(wrapRef.current);

    animate();

    // Live tuning handle in the console. Patching mode integers / colours needs a
    // re-init (remap the per-pixel shapes + LUT), so tune() always re-inits.
    (window as unknown as { __pixelWave: unknown }).__pixelWave = {
      tune: (patch: Partial<WaveConfig>) => {
        Object.assign(WAVE, patch);
        init();
      },
      get config() {
        return { ...WAVE };
      },
    };

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationRef.current);
    };
  }, [init, animate]);

  return (
    <div ref={wrapRef} className="absolute inset-0 overflow-hidden">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
