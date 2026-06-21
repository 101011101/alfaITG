"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Inverse smoothstep: fast at the ends (snaps into/out of the sharp word),
// slow through the middle (lingers on the gooey morph). t and result in [0,1].
const easeMorph = (t: number) => {
  const x = Math.min(Math.max(t, 0), 1);
  return 0.5 - Math.sin(Math.asin(1 - 2 * x) / 3);
};

interface GooeyTextProps {
  texts: string[];
  morphTime?: number;
  cooldownTime?: number;
  className?: string;
  textClassName?: string;
}

export function GooeyText({
  texts,
  morphTime = 1,
  cooldownTime = 0.25,
  className,
  textClassName
}: GooeyTextProps) {
  const text1Ref = React.useRef<HTMLSpanElement>(null);
  const text2Ref = React.useRef<HTMLSpanElement>(null);

  // Keep the latest texts in a ref so the animation loop always reads current
  // copy WITHOUT re-firing the effect when the parent passes a new array literal.
  const textsRef = React.useRef(texts);
  textsRef.current = texts;

  React.useEffect(() => {
    const list = textsRef.current;
    let textIndex = list.length - 1;
    let time = new Date();
    let morph = 0;
    let cooldown = cooldownTime;

    // Seed the spans immediately so nothing is blank during the first cooldown.
    if (text1Ref.current && text2Ref.current) {
      text1Ref.current.textContent = list[textIndex % list.length];
      text2Ref.current.textContent = list[(textIndex + 1) % list.length];
    }

    const setMorph = (fraction: number) => {
      if (text1Ref.current && text2Ref.current) {
        text2Ref.current.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`;
        text2Ref.current.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;

        fraction = 1 - fraction;
        text1Ref.current.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`;
        text1Ref.current.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;
      }
    };

    const doCooldown = () => {
      morph = 0;
      if (text1Ref.current && text2Ref.current) {
        text2Ref.current.style.filter = "";
        text2Ref.current.style.opacity = "100%";
        text1Ref.current.style.filter = "";
        text1Ref.current.style.opacity = "0%";
      }
    };

    const doMorph = () => {
      morph -= cooldown;
      cooldown = 0;
      let fraction = morph / morphTime;

      if (fraction > 1) {
        cooldown = cooldownTime;
        fraction = 1;
      }

      // Remap the linear time-progress so the morph is fast near the sharp
      // endpoints and slow through the gooey middle.
      setMorph(easeMorph(fraction));
    };

    let raf = 0;

    function animate() {
      raf = requestAnimationFrame(animate);
      const current = textsRef.current;
      const newTime = new Date();
      const shouldIncrementIndex = cooldown > 0;
      const dt = (newTime.getTime() - time.getTime()) / 1000;
      time = newTime;

      cooldown -= dt;

      if (cooldown <= 0) {
        if (shouldIncrementIndex) {
          textIndex = (textIndex + 1) % current.length;
          if (text1Ref.current && text2Ref.current) {
            text1Ref.current.textContent = current[textIndex % current.length];
            text2Ref.current.textContent = current[(textIndex + 1) % current.length];
          }
        }
        doMorph();
      } else {
        doCooldown();
      }
    }

    animate();

    // Cancel the loop on teardown so re-runs (and StrictMode's mount→unmount→
    // mount) never leave orphaned rAF loops stacking on the same spans.
    return () => cancelAnimationFrame(raf);
  }, [morphTime, cooldownTime]);

  return (
    <div className={cn("relative", className)}>
      <svg className="absolute h-0 w-0" aria-hidden="true" focusable="false">
        <defs>
          <filter id="threshold">
            {/* Pure alpha threshold — NO intrinsic blur, so a settled word stays
                crisp. The gooey merge during a transition comes from the per-span
                CSS blur below: both words sit centered on the same spot, so their
                blurred alpha overlaps and this threshold fuses it into blobs. */}
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 19 -9"
            />
          </filter>
        </defs>
      </svg>

      <div
        className="relative flex h-full w-full items-center justify-center"
        style={{ filter: "url(#threshold)" }}
      >
        <span
          ref={text1Ref}
          className={cn(
            "absolute left-1/2 top-1/2 w-full -translate-x-1/2 -translate-y-1/2 select-none px-4 text-center leading-tight break-words text-[clamp(1.75rem,7vw,3.5rem)]",
            "text-foreground",
            textClassName
          )}
        />
        <span
          ref={text2Ref}
          className={cn(
            "absolute left-1/2 top-1/2 w-full -translate-x-1/2 -translate-y-1/2 select-none px-4 text-center leading-tight break-words text-[clamp(1.75rem,7vw,3.5rem)]",
            "text-foreground",
            textClassName
          )}
        />
      </div>
    </div>
  );
}
