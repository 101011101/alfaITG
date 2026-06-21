'use client';
// Adapted for Vite/React (no Next.js): `next/image` -> plain <img>. Behaviour
// otherwise faithful to source. NOTE: this scroll-jacks the whole window —
// it pins the document at the top until the media is fully expanded, then
// releases to normal scroll (and re-collapses when you scroll back to top).

import {
  useEffect,
  useRef,
  useState,
  ReactNode,
  TouchEvent,
  WheelEvent,
} from 'react';
import { motion } from 'framer-motion';
import { frameScroll } from '@/lib/frameScroll';

interface ScrollExpandMediaProps {
  mediaType?: 'video' | 'image';
  mediaSrc: string;
  /** Optional secondary <source> for the video (e.g. mp4 fallback for Safari/iOS
   * when mediaSrc is a webm). Rendered after mediaSrc as a child <source>. */
  mediaSrcFallback?: string;
  posterSrc?: string;
  bgImageSrc: string;
  title?: string;
  date?: string;
  scrollToExpand?: string;
  textBlend?: boolean;
  children?: ReactNode;
  /** Persistent overlay rendered ON the media (visible pre-scroll, stays at full-bleed). */
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
  children,
  mediaOverlay,
}: ScrollExpandMediaProps) => {
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [showContent, setShowContent] = useState<boolean>(false);
  const [mediaFullyExpanded, setMediaFullyExpanded] = useState<boolean>(false);
  const [touchStartY, setTouchStartY] = useState<number>(0);
  const [isMobileState, setIsMobileState] = useState<boolean>(false);
  // When the user prefers reduced motion we skip the scroll-jack/zoom entirely and
  // present the media at its final (expanded) state with native scrolling.
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  const sectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      // Present the media fully expanded immediately; no scroll-jack, no zoom.
      setScrollProgress(1);
      setShowContent(true);
      setMediaFullyExpanded(false);
      return;
    }
    setScrollProgress(0);
    setShowContent(false);
    setMediaFullyExpanded(false);
  }, [mediaType, reducedMotion]);

  // The hero gate: while the zoom runs, the frame engine is OFF (the hero owns the
  // wheel). Once fully expanded, hand the wheel to the engine. Scrolling up at the
  // engine's top frame hands back here to collapse (via onTopUp).
  useEffect(() => {
    frameScroll.setOnTopUp(() => setMediaFullyExpanded(false));
  }, []);

  useEffect(() => {
    // Reduced-motion: never engage the frame engine; let the page scroll natively.
    if (reducedMotion) {
      frameScroll.stop();
      return;
    }
    // start LOCKED so the zoom-completing scroll rests on the expanded hero
    // frame instead of bleeding straight through to the robot.
    if (mediaFullyExpanded) frameScroll.start(true);
    else frameScroll.stop();
  }, [mediaFullyExpanded, reducedMotion]);

  useEffect(() => {
    // Reduced-motion: skip the scroll-hijack handlers entirely — native scrolling.
    if (reducedMotion) return;

    const handleWheel = (e: WheelEvent) => {
      if (mediaFullyExpanded && e.deltaY < 0 && window.scrollY <= 5) {
        setMediaFullyExpanded(false);
        e.preventDefault();
      } else if (!mediaFullyExpanded) {
        e.preventDefault();
        const scrollDelta = e.deltaY * 0.0009;
        const newProgress = Math.min(
          Math.max(scrollProgress + scrollDelta, 0),
          1
        );
        if (newProgress >= 0.87) {
          // snap the last 13% — completes the hero "zoom" into a full frame
          setScrollProgress(1);
          setMediaFullyExpanded(true);
          setShowContent(true);
        } else {
          setScrollProgress(newProgress);
          if (newProgress < 0.75) setShowContent(false);
        }
      }
    };

    // Keyboard mirror of handleWheel: the wheel listener was the ONLY way to drive
    // the hero zoom, so arrow keys did nothing until after the hero had already
    // expanded (frameScroll's key handler only binds post-expansion). This closes
    // that gap — ↓/PageDown/Space advance the zoom, ↑/PageUp/Shift+Space reverse it,
    // and ↑ at the top collapses back to the hero.
    const handleKeyDown = (e: KeyboardEvent) => {
      // Leave focused form fields to their own key handling.
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) {
        return;
      }
      const down =
        e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey);
      const up =
        e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey);
      if (!down && !up) return;

      // Expanded + at the top + going up → hand back to the hero (collapse).
      if (mediaFullyExpanded && up && window.scrollY <= 5) {
        setMediaFullyExpanded(false);
        e.preventDefault();
        return;
      }
      // While the hero is still zooming, arrow keys drive the expansion. Once
      // expanded, frameScroll's own key handler takes the frame-to-frame steps.
      if (!mediaFullyExpanded) {
        e.preventDefault();
        const STEP = 0.18; // fraction of the zoom per press (~6 presses to expand)
        const newProgress = Math.min(
          Math.max(scrollProgress + (down ? STEP : -STEP), 0),
          1
        );
        if (newProgress >= 0.87) {
          setScrollProgress(1);
          setMediaFullyExpanded(true);
          setShowContent(true);
        } else {
          setScrollProgress(newProgress);
          if (newProgress < 0.75) setShowContent(false);
        }
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      setTouchStartY(e.touches[0].clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartY) return;

      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY;

      if (mediaFullyExpanded && deltaY < -20 && window.scrollY <= 5) {
        setMediaFullyExpanded(false);
        e.preventDefault();
      } else if (!mediaFullyExpanded) {
        e.preventDefault();
        // Increase sensitivity for mobile, especially when scrolling back
        const scrollFactor = deltaY < 0 ? 0.008 : 0.005; // Higher sensitivity for scrolling back
        const scrollDelta = deltaY * scrollFactor;
        const newProgress = Math.min(
          Math.max(scrollProgress + scrollDelta, 0),
          1
        );
        if (newProgress >= 0.87) {
          // snap the last 13% — completes the hero "zoom" into a full frame
          setScrollProgress(1);
          setMediaFullyExpanded(true);
          setShowContent(true);
        } else {
          setScrollProgress(newProgress);
          if (newProgress < 0.75) setShowContent(false);
        }

        setTouchStartY(touchY);
      }
    };

    const handleTouchEnd = (): void => {
      setTouchStartY(0);
    };

    const handleScroll = (): void => {
      if (!mediaFullyExpanded) {
        window.scrollTo(0, 0);
      }
    };

    window.addEventListener('wheel', handleWheel as unknown as EventListener, {
      passive: false,
    });
    window.addEventListener('keydown', handleKeyDown as unknown as EventListener);
    window.addEventListener('scroll', handleScroll as EventListener);
    window.addEventListener(
      'touchstart',
      handleTouchStart as unknown as EventListener,
      { passive: false }
    );
    window.addEventListener(
      'touchmove',
      handleTouchMove as unknown as EventListener,
      { passive: false }
    );
    window.addEventListener('touchend', handleTouchEnd as EventListener);

    return () => {
      window.removeEventListener(
        'wheel',
        handleWheel as unknown as EventListener
      );
      window.removeEventListener(
        'keydown',
        handleKeyDown as unknown as EventListener
      );
      window.removeEventListener('scroll', handleScroll as EventListener);
      window.removeEventListener(
        'touchstart',
        handleTouchStart as unknown as EventListener
      );
      window.removeEventListener(
        'touchmove',
        handleTouchMove as unknown as EventListener
      );
      window.removeEventListener('touchend', handleTouchEnd as EventListener);
    };
  }, [scrollProgress, mediaFullyExpanded, touchStartY, reducedMotion]);

  useEffect(() => {
    const checkIfMobile = (): void => {
      setIsMobileState(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Grow PROPORTIONALLY toward the viewport so width & height reach full together —
  // no more mid-expansion "height frozen, width still widening" horizontal stretch.
  const startW = isMobileState ? 280 : 360;
  const startH = isMobileState ? 380 : 480;
  const mediaW = `calc(${startW}px + (100vw - ${startW}px) * ${scrollProgress})`;
  const mediaH = `calc(${startH}px + (100dvh - ${startH}px) * ${scrollProgress})`;
  const textTranslateX = scrollProgress * (isMobileState ? 180 : 150);
  // Second-text (mediaOverlay): starts at 30% scroll and fades in over a 0.25
  // window (earlier + twice as fast as before).
  const overlayOpacity = Math.min(Math.max((scrollProgress - 0.3) / 0.25, 0), 1);

  const firstWord = title ? title.split(' ')[0] : '';
  const restOfTitle = title ? title.split(' ').slice(1).join(' ') : '';

  return (
    <div
      ref={sectionRef}
      className='transition-colors duration-700 ease-in-out overflow-x-hidden'
    >
      <section className='relative flex flex-col items-center justify-start min-h-[100dvh]'>
        <div className='relative w-full flex flex-col items-center min-h-[100dvh]'>
          <motion.div
            className='absolute inset-0 z-0 h-full'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 - scrollProgress }}
            transition={{ duration: 0.1 }}
          >
            <img
              src={bgImageSrc}
              alt='Background'
              className='w-screen h-screen'
              style={{
                objectFit: 'cover',
                objectPosition: 'center',
              }}
            />
            <div className='absolute inset-0 bg-black/10' />
          </motion.div>

          <div className='container mx-auto flex flex-col items-center justify-start relative z-10'>
            <div className='flex flex-col items-center justify-center w-full h-[100dvh] relative'>
              <div
                className='absolute z-0 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-none rounded-2xl overflow-hidden'
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
                    <div className='relative w-full h-full pointer-events-none'>
                      <iframe
                        width='100%'
                        height='100%'
                        src={
                          mediaSrc.includes('embed')
                            ? mediaSrc +
                              (mediaSrc.includes('?') ? '&' : '?') +
                              'autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1'
                            : mediaSrc.replace('watch?v=', 'embed/') +
                              '?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1&playlist=' +
                              mediaSrc.split('v=')[1]
                        }
                        className='w-full h-full rounded-xl'
                        frameBorder='0'
                        allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                        allowFullScreen
                      />
                      <div
                        className='absolute inset-0 z-10'
                        style={{ pointerEvents: 'none' }}
                      ></div>

                      <motion.div
                        className='absolute inset-0 bg-black/30 rounded-xl'
                        initial={{ opacity: 0.7 }}
                        animate={{ opacity: 0.5 - scrollProgress * 0.3 }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                  ) : (
                    <div className='relative w-full h-full pointer-events-none'>
                      <video
                        key={`${mediaSrc}|${mediaSrcFallback ?? ''}`}
                        poster={posterSrc}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload='auto'
                        className='w-full h-full object-cover rounded-xl'
                        controls={false}
                        disablePictureInPicture
                        disableRemotePlayback
                      >
                        {/* webm first; mp4 fallback for Safari/iOS. poster always
                            shows if both fail. */}
                        <source
                          src={mediaSrc}
                          type={
                            mediaSrc.endsWith('.webm')
                              ? 'video/webm'
                              : 'video/mp4'
                          }
                        />
                        {mediaSrcFallback && (
                          <source
                            src={mediaSrcFallback}
                            type={
                              mediaSrcFallback.endsWith('.webm')
                                ? 'video/webm'
                                : 'video/mp4'
                            }
                          />
                        )}
                      </video>
                      <div
                        className='absolute inset-0 z-10'
                        style={{ pointerEvents: 'none' }}
                      ></div>

                      <motion.div
                        className='absolute inset-0 bg-black/30 rounded-xl'
                        initial={{ opacity: 0.7 }}
                        animate={{ opacity: 0.5 - scrollProgress * 0.3 }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                  )
                ) : (
                  <div className='relative w-full h-full'>
                    <img
                      src={mediaSrc}
                      alt={title || 'Media content'}
                      className='w-full h-full object-cover rounded-xl'
                    />

                    <motion.div
                      className='absolute inset-0 bg-black/50 rounded-xl'
                      initial={{ opacity: 0.7 }}
                      animate={{ opacity: 0.7 - scrollProgress * 0.3 }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                )}

                {mediaOverlay && (
                  <div
                    className='pointer-events-none absolute inset-0 z-20 flex items-center justify-center p-6 [&_a]:pointer-events-auto [&_button]:pointer-events-auto'
                    style={{ opacity: overlayOpacity, transition: 'opacity 0.15s linear' }}
                  >
                    {mediaOverlay}
                  </div>
                )}

                <div className='flex flex-col items-center text-center relative z-10 mt-4 transition-none'>
                  {date && (
                    <p
                      className='text-2xl text-blue-200'
                      style={{ transform: `translateX(-${textTranslateX}vw)` }}
                    >
                      {date}
                    </p>
                  )}
                  {scrollToExpand && (
                    <p
                      className='text-blue-200 font-medium text-center'
                      style={{ transform: `translateX(${textTranslateX}vw)` }}
                    >
                      {scrollToExpand}
                    </p>
                  )}
                </div>
              </div>

              <div
                className={`flex items-center justify-center text-center gap-4 w-full relative z-10 transition-none flex-col ${
                  textBlend ? 'mix-blend-difference' : 'mix-blend-normal'
                }`}
              >
                {/* Page-level H1: the brand/title is the top-level heading. The two
                    words split apart on scroll, so the first carries the h1 and the
                    second is a sibling h2 (keeps a single h1 on the page). */}
                <motion.h1
                  className='text-4xl md:text-5xl lg:text-6xl font-bold text-blue-200 transition-none'
                  style={{ transform: `translateX(-${textTranslateX}vw)` }}
                >
                  {firstWord}
                </motion.h1>
                <motion.h2
                  className='text-4xl md:text-5xl lg:text-6xl font-bold text-center text-blue-200 transition-none'
                  style={{ transform: `translateX(${textTranslateX}vw)` }}
                >
                  {restOfTitle}
                </motion.h2>
              </div>
            </div>

            {children && (
              // Only render (and reserve padding) when there's actually content —
              // an empty padded block was the dead space below the hero frame.
              <motion.section
                className='flex flex-col w-full px-8 py-10 md:px-16 lg:py-20'
                initial={{ opacity: 0 }}
                animate={{ opacity: showContent ? 1 : 0 }}
                transition={{ duration: 0.7 }}
              >
                {children}
              </motion.section>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ScrollExpandMedia;
