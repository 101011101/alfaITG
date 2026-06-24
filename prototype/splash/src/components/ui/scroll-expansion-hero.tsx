'use client';
// NATIVE-SCROLL hero. No scroll-jacking: a tall (200vh) section with a sticky
// stage; the zoom is scrubbed directly from real scroll position (0 at the top →
// 1 after one viewport), so it scrubs both ways naturally and the page scrolls
// normally into the rail below. Reduced motion presents it expanded immediately.

import { useEffect, useRef, useState, ReactNode } from 'react';
import { heroCover } from '@/lib/heroCover';
import { heroZoom } from '@/lib/heroZoom';
import { reducedMotion as reducedMotionSignal } from '@/lib/reducedMotion';

// Below this progress the twilight image (opacity = 1 - scrollProgress) is opaque
// enough to hide the pixel canvas behind it, so we freeze the canvas redraw.
const COVER_THRESHOLD = 0.25;

interface ScrollExpandMediaProps {
  mediaType?: 'video' | 'image';
  mediaSrc: string;
  /** Optional secondary <source> for the video (mp4 fallback for Safari/iOS). */
  mediaSrcFallback?: string;
  posterSrc?: string;
  bgImageSrc: string;
  title?: string;
  date?: string;
  scrollToExpand?: string;
  textBlend?: boolean;
  /** Persistent overlay rendered ON the media (fades in as it expands). */
  mediaOverlay?: ReactNode;
}

const ScrollExpandMedia = ({
  mediaType = 'video',
  mediaSrc,
  mediaSrcFallback,
  posterSrc,
  bgImageSrc,
  title,
  date,
  scrollToExpand,
  textBlend,
  mediaOverlay,
}: ScrollExpandMediaProps) => {
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [isMobileState, setIsMobileState] = useState<boolean>(false);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const sectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setReducedMotion(reducedMotionSignal.get());
    return reducedMotionSignal.subscribe(setReducedMotion);
  }, []);

  // Scroll-driven zoom tied to the section's OWN pinned scroll range, not a guessed
  // viewport height — so progress hits 1.0 at the exact moment the sticky stage
  // releases. That guarantees the frame stays put for the whole zoom and only
  // scrolls away once it's fully expanded (no early release, no dead gap).
  // Reduced motion presents it expanded immediately. Publishes heroZoom (progress
  // bar) + heroCover (background-canvas freeze).
  useEffect(() => {
    if (reducedMotion) {
      setScrollProgress(1);
      heroZoom.set(1);
      heroCover.set(false);
      return;
    }
    let raf = 0;
    const compute = () => {
      raf = 0;
      const el = sectionRef.current;
      if (!el) return;
      const range = el.offsetHeight - window.innerHeight; // the pinned scroll distance
      const p = range > 0 ? Math.min(Math.max(-el.getBoundingClientRect().top / range, 0), 1) : 0;
      setScrollProgress(p);
      heroZoom.set(p);
      heroCover.set(p < COVER_THRESHOLD);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [reducedMotion]);

  useEffect(() => {
    const check = () => setIsMobileState(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Grow PROPORTIONALLY toward the viewport so width & height reach full together.
  const startW = isMobileState ? 280 : 360;
  const startH = isMobileState ? 380 : 480;
  const mediaW = `calc(${startW}px + (100vw - ${startW}px) * ${scrollProgress})`;
  const mediaH = `calc(${startH}px + (100dvh - ${startH}px) * ${scrollProgress})`;
  const textTranslateX = scrollProgress * (isMobileState ? 180 : 150);
  const overlayOpacity = Math.min(Math.max((scrollProgress - 0.3) / 0.25, 0), 1);

  const firstWord = title ? title.split(' ')[0] : '';
  const restOfTitle = title ? title.split(' ').slice(1).join(' ') : '';

  return (
    // 200vh tall → its pinned range scrubs the zoom, then the full frame scrolls
    // away into the rail. The stage inside is sticky-pinned.
    // clip (not hidden) for the title's horizontal overflow — overflow:hidden here
    // makes this a scroll container and BREAKS the sticky pin (frame would scroll
    // off during the zoom instead of staying put).
    <div ref={sectionRef} className="relative h-[200vh] [overflow-x:clip]">
      {/* Snap target at the exact scroll where the zoom completes (the pin-release
          point = section height − one viewport). `snap-always` (scroll-snap-stop:
          always) forces a stop on the fully-zoomed frame even on a fast scroll, so
          you can't blow past 100% — and it catches the same point on the way back up. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 h-px w-full snap-start snap-always"
        style={{ top: 'calc(100% - 100vh)' }}
      />
      <div className="sticky top-0 flex h-[100dvh] w-full items-center justify-center overflow-hidden">
        {/* Twilight background — fades out as the media expands. */}
        <div
          className="absolute inset-0 z-0"
          style={{ opacity: 1 - scrollProgress }}
        >
          <img
            src={bgImageSrc}
            alt=""
            fetchPriority="high"
            decoding="async"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/10" />
        </div>

        {/* The growing media frame — centred, scrubbed by scrollProgress. */}
        <div
          className="absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl"
          style={{
            width: mediaW,
            height: mediaH,
            maxWidth: '100vw',
            maxHeight: '100dvh',
            borderRadius: `${(1 - scrollProgress) * 16}px`,
            boxShadow: '0px 0px 50px rgba(0, 0, 0, 0.3)',
          }}
        >
          {mediaType === 'video' ? (
            mediaSrc.includes('youtube.com') ? (
              <div className="pointer-events-none relative h-full w-full">
                <iframe
                  width="100%"
                  height="100%"
                  src={
                    mediaSrc.includes('embed')
                      ? mediaSrc +
                        (mediaSrc.includes('?') ? '&' : '?') +
                        'autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1'
                      : mediaSrc.replace('watch?v=', 'embed/') +
                        '?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1&playlist=' +
                        mediaSrc.split('v=')[1]
                  }
                  className="h-full w-full rounded-xl"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                <div
                  className="absolute inset-0 rounded-xl bg-black/30"
                  style={{ opacity: 0.5 - scrollProgress * 0.3 }}
                />
              </div>
            ) : (
              <div className="pointer-events-none relative h-full w-full">
                <video
                  key={`${mediaSrc}|${mediaSrcFallback ?? ''}`}
                  poster={posterSrc}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="h-full w-full rounded-xl object-cover"
                  controls={false}
                  disablePictureInPicture
                  disableRemotePlayback
                >
                  <source
                    src={mediaSrc}
                    type={mediaSrc.endsWith('.webm') ? 'video/webm' : 'video/mp4'}
                  />
                  {mediaSrcFallback && (
                    <source
                      src={mediaSrcFallback}
                      type={mediaSrcFallback.endsWith('.webm') ? 'video/webm' : 'video/mp4'}
                    />
                  )}
                </video>
                <div
                  className="absolute inset-0 rounded-xl bg-black/30"
                  style={{ opacity: 0.5 - scrollProgress * 0.3 }}
                />
              </div>
            )
          ) : (
            <div className="relative h-full w-full">
              <img
                src={mediaSrc}
                alt={title || 'Media content'}
                fetchPriority="high"
                decoding="async"
                className="h-full w-full rounded-xl object-cover"
              />
              <div
                className="absolute inset-0 rounded-xl bg-black/50"
                style={{ opacity: 0.7 - scrollProgress * 0.3 }}
              />
            </div>
          )}

          {mediaOverlay && (
            <div
              className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center p-6 [&_a]:pointer-events-auto [&_button]:pointer-events-auto"
              style={{ opacity: overlayOpacity, transition: 'opacity 0.15s linear' }}
            >
              {mediaOverlay}
            </div>
          )}

          {/* Date + scroll prompt inside the frame, split apart as it expands. */}
          <div className="relative z-10 mt-4 flex flex-col items-center text-center">
            {date && (
              <p
                className="text-2xl text-blue-200"
                style={{ transform: `translateX(-${textTranslateX}vw)` }}
              >
                {date}
              </p>
            )}
            {scrollToExpand && (
              <p
                className="text-center font-medium text-blue-200"
                style={{ transform: `translateX(${textTranslateX}vw)` }}
              >
                {scrollToExpand}
              </p>
            )}
          </div>
        </div>

        {/* Brand title — centred over the media, splits apart and flies off as it expands. */}
        <div
          className={`pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 text-center ${
            textBlend ? 'mix-blend-difference' : 'mix-blend-normal'
          }`}
        >
          <h1
            className="text-4xl font-bold text-blue-200 md:text-5xl lg:text-6xl"
            style={{ transform: `translateX(-${textTranslateX}vw)` }}
          >
            {firstWord}
          </h1>
          <h2
            className="text-center text-4xl font-bold text-blue-200 md:text-5xl lg:text-6xl"
            style={{ transform: `translateX(${textTranslateX}vw)` }}
          >
            {restOfTitle}
          </h2>
        </div>
      </div>
    </div>
  );
};

export default ScrollExpandMedia;
