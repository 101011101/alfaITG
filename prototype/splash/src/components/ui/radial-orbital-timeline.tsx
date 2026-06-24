"use client";
// NOTE vs. source: `NodeJS.Timeout` -> `ReturnType<typeof setInterval>` so it compiles
// in a browser/Vite TS setup without @types/node. Behaviour identical.
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { frameClock } from "@/lib/frameClock";
import { reducedMotion as reducedMotionPref } from "@/lib/reducedMotion";
// Shared shape (single source of truth) — keeps timelineData structurally
// coupled to products.ts COMPANY/PRODUCTS at compile time.
import type { TimelineItem } from "@/lib/products";

interface RadialOrbitalTimelineProps {
  timelineData: TimelineItem[];
}

export default function RadialOrbitalTimeline({
  timelineData,
}: RadialOrbitalTimelineProps) {
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>(
    {}
  );
  // `rotationAngle` is the *base* offset used for the static (React-rendered)
  // layout — it only changes on click-to-center. The continuous idle spin lives
  // entirely in `rotationRef` and is applied by mutating node DOM in the rAF
  // tick (E4), so an idle orbit no longer re-renders all nodes ~60fps.
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [pulseEffect, setPulseEffect] = useState<Record<number, boolean>>({});
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null);
  // Honour WCAG 2.2.2: continuous auto-rotation is suppressed when the user
  // asks for reduced motion. We hold a static, readable layout instead.
  const [reducedMotion, setReducedMotion] = useState<boolean>(() =>
    reducedMotionPref.get()
  );
  // Orbit radius is derived from the viewport (E3) so the orbit never overflows
  // narrow phones. Recomputed on resize; clamped to a sensible min/max.
  const [radius, setRadius] = useState<number>(200);
  // Expanded card is PORTALED to <body> (fixed position) so it escapes the orbit's
  // 3D-perspective context, the robot's WebGL layer and the rail's transformed
  // stacking context entirely — guaranteeing it paints opaque, on top of everything.
  const [cardAnchor, setCardAnchor] = useState<{
    id: number;
    style: React.CSSProperties;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<number, HTMLDivElement | null>>({});
  // Accumulated idle-spin offset (degrees) added on top of `rotationAngle`.
  const rotationRef = useRef<number>(0);
  // Hovering icon → card crosses empty space; a short close delay (cancelled when
  // the cursor reaches the portaled card) keeps the card alive across that gap.
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Pure geometry: position of node `index` at a given total rotation offset.
  const computeNodeStyle = (index: number, total: number, offset: number) => {
    const angle = ((index / total) * 360 + offset) % 360;
    const radian = (angle * Math.PI) / 180;

    const x = radius * Math.cos(radian);
    const y = radius * Math.sin(radian);

    const zIndex = Math.round(100 + 50 * Math.cos(radian));
    const opacity = Math.max(
      0.4,
      Math.min(1, 0.4 + 0.6 * ((1 + Math.sin(radian)) / 2))
    );

    return { x, y, angle, zIndex, opacity };
  };

  // The static render uses base offset only; idle spin is layered on via rAF.
  const calculateNodePosition = (index: number, total: number) =>
    computeNodeStyle(index, total, rotationAngle);

  const getRelatedItems = (itemId: number): number[] => {
    const currentItem = timelineData.find((item) => item.id === itemId);
    return currentItem ? currentItem.relatedIds : [];
  };

  // Freeze the orbit at its current spun position: fold accumulated idle spin
  // into the React-rendered base so the static layout matches the DOM the rAF
  // tick last drew (prevents a jump when auto-rotate stops).
  const freezeRotation = () => {
    if (rotationRef.current) {
      const folded = rotationRef.current;
      rotationRef.current = 0;
      setRotationAngle((prev) => (prev + folded) % 360);
    }
  };

  // Track the reduced-motion preference and react to live changes (E2). Backed by
  // the shared singleton (one MediaQueryList for the whole app); we sync once on
  // mount and subscribe for live flips, cleaning up the subscription on unmount.
  useEffect(() => {
    setReducedMotion(reducedMotionPref.get());
    return reducedMotionPref.subscribe(setReducedMotion);
  }, []);

  // Derive the orbit radius from the viewport so it never overflows narrow
  // phones (E3). A fraction of the smaller axis, clamped to [120, 200].
  useEffect(() => {
    if (typeof window === "undefined") return;
    const apply = () => {
      const base = Math.min(window.innerWidth, window.innerHeight);
      setRadius(Math.max(120, Math.min(200, base * 0.32)));
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  // Shared open/close bookkeeping (C6) — used by hover, click, and container click.
  const openNode = (id: number, center: boolean) => {
    setExpandedItems({ [id]: true });
    setActiveNodeId(id);
    setAutoRotate(false);
    const newPulse: Record<number, boolean> = {};
    getRelatedItems(id).forEach((relId) => (newPulse[relId] = true));
    setPulseEffect(newPulse);
    if (center) centerViewOnNode(id);
    else freezeRotation();
  };

  const closeAll = () => {
    setExpandedItems({});
    setActiveNodeId(null);
    setAutoRotate(true);
    setPulseEffect({});
  };

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current || e.target === orbitRef.current) {
      closeAll();
    }
  };

  const toggleItem = (id: number) => {
    if (expandedItems[id]) {
      closeAll();
    } else {
      openNode(id, true);
    }
  };

  // Hover a node → STOP the rotation and expand its card in place (no re-center).
  const expandOnHover = (id: number) => openNode(id, false);

  // Keyboard parity: focusing a node reveals the same card hover would, and
  // Enter/Space toggle it. Auto-rotation stays paused while a node is focused
  // (openNode sets autoRotate=false) so the expanded card is readable.
  const expandOnFocus = (id: number) => {
    cancelClose();
    openNode(id, false);
  };

  const handleNodeKeyDown = (
    e: React.KeyboardEvent<HTMLDivElement>,
    id: number
  ) => {
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      e.stopPropagation();
      toggleItem(id);
    } else if (e.key === "Escape" && expandedItems[id]) {
      e.preventDefault();
      closeAll();
    }
  };

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = undefined;
  };
  // Close shortly after the cursor leaves BOTH the node and its card.
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => closeAll(), 140);
  };
  useEffect(() => () => cancelClose(), []); // clear any pending timer on unmount

  // Position the portaled card next to its node (fixed coords, opens outward).
  // Re-run whenever the expansion or the base rotation (click-to-center) changes;
  // the orbit is frozen while a card is open, so a one-shot measure is stable.
  useLayoutEffect(() => {
    const id = Number(Object.keys(expandedItems).find((k) => expandedItems[+k]));
    const el = Number.isFinite(id) ? nodeRefs.current[id] : null;
    if (!el) {
      setCardAnchor(null);
      return;
    }
    const r = el.getBoundingClientRect();
    const openLeft = r.left + r.width / 2 < window.innerWidth / 2;
    setCardAnchor({
      id,
      style: {
        position: "fixed",
        top: r.top + r.height / 2,
        transform: "translateY(-50%)",
        zIndex: 60,
        ...(openLeft
          ? { right: window.innerWidth - r.left + 16 }
          : { left: r.right + 16 }),
      },
    });
  }, [expandedItems, rotationAngle]);

  useEffect(() => {
    // Idle rotation, driven by the master clock: ~6°/s, mutating node DOM directly
    // (no setState → no re-render per frame). The clock gates it — 30fps, paused
    // when the panel is off-screen (el), and SKIPPED while the page is scrolling
    // (skipWhileScrolling) so it never competes with a scroll frame.
    // WCAG 2.2.2: hold a static layout when the user prefers reduced motion.
    if (!autoRotate || reducedMotion) return;
    const total = timelineData.length;
    const applyFrame = () => {
      const offset = (rotationAngle + rotationRef.current) % 360;
      timelineData.forEach((item, index) => {
        const el = nodeRefs.current[item.id];
        if (!el) return;
        const { x, y, zIndex, opacity } = computeNodeStyle(index, total, offset);
        el.style.transform = `translate(${x}px, ${y}px)`;
        el.style.zIndex = String(zIndex);
        el.style.opacity = String(opacity);
      });
    };
    return frameClock.subscribeDecoration(
      (ctx) => {
        rotationRef.current = (rotationRef.current + ctx.dt * 0.006) % 360;
        applyFrame();
      },
      { fps: 30, el: () => containerRef.current, skipWhileScrolling: true },
    );
    // rotationAngle is read as the base offset; re-arm if it (or autoRotate,
    // the radius, or the reduced-motion preference) changes.
  }, [autoRotate, rotationAngle, timelineData, radius, reducedMotion]);

  const centerViewOnNode = (nodeId: number) => {
    if (!nodeRefs.current[nodeId]) return;

    const nodeIndex = timelineData.findIndex((item) => item.id === nodeId);
    const totalNodes = timelineData.length;
    const targetAngle = (nodeIndex / totalNodes) * 360;

    // Fold any accumulated idle spin into the base, then re-center from there.
    rotationRef.current = 0;
    setRotationAngle(270 - targetAngle);
  };

  const isRelatedToActive = (itemId: number): boolean => {
    if (activeNodeId === null) return false;
    const relatedItems = getRelatedItems(activeNodeId);
    return relatedItems.includes(itemId);
  };

  return (
    <div
      className="w-full h-[100dvh] flex flex-col items-center justify-center"
      ref={containerRef}
      onClick={handleContainerClick}
    >
      <div className="relative w-full max-w-4xl h-full flex items-center justify-center">
        <div
          className="absolute w-full h-full flex items-center justify-center"
          ref={orbitRef}
          style={{
            perspective: "1000px",
          }}
        >
          {/* central hub removed — the robot is the centerpiece */}

          <div className="absolute w-96 h-96 rounded-full border border-white/10"></div>

          {timelineData.map((item, index) => {
            const position = calculateNodePosition(index, timelineData.length);
            const isExpanded = expandedItems[item.id];
            const isRelated = isRelatedToActive(item.id);
            const isPulsing = pulseEffect[item.id];
            const Icon = item.icon;

            const nodeStyle = {
              transform: `translate(${position.x}px, ${position.y}px)`,
              zIndex: isExpanded ? 200 : position.zIndex,
              opacity: isExpanded ? 1 : position.opacity,
            };

            return (
              <div
                key={item.id}
                ref={(el) => {
                  nodeRefs.current[item.id] = el;
                }}
                className="pointer-events-auto absolute cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                style={nodeStyle}
                role="button"
                tabIndex={0}
                aria-label={item.title}
                aria-expanded={!!isExpanded}
                aria-describedby={
                  isExpanded ? `orbit-card-${item.id}` : undefined
                }
                onMouseEnter={() => {
                  cancelClose();
                  expandOnHover(item.id);
                }}
                onMouseLeave={scheduleClose}
                onFocus={() => expandOnFocus(item.id)}
                onBlur={scheduleClose}
                onKeyDown={(e) => handleNodeKeyDown(e, item.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleItem(item.id);
                }}
              >
                <div
                  className={`absolute rounded-full -inset-1 ${
                    isPulsing ? "animate-pulse duration-1000" : ""
                  }`}
                  style={{
                    background: `radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)`,
                    width: `${item.energy * 0.5 + 40}px`,
                    height: `${item.energy * 0.5 + 40}px`,
                    left: `-${(item.energy * 0.5 + 40 - 40) / 2}px`,
                    top: `-${(item.energy * 0.5 + 40 - 40) / 2}px`,
                  }}
                ></div>

                <div
                  className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  ${
                    isExpanded
                      ? "bg-white text-black"
                      : isRelated
                      ? "bg-white/50 text-black"
                      : "bg-black text-white"
                  }
                  border-2
                  ${
                    isExpanded
                      ? "border-white shadow-lg shadow-white/30"
                      : isRelated
                      ? "border-white animate-pulse"
                      : "border-white/40"
                  }
                  transition-all duration-300 transform
                  ${isExpanded ? "scale-150" : ""}
                `}
                >
                  <Icon size={16} />
                </div>

                <div
                  className={`
                  absolute top-12  whitespace-nowrap
                  text-xs font-semibold tracking-wider
                  transition-all duration-300
                  ${isExpanded ? "text-white scale-125" : "text-white/85"}
                `}
                >
                  {item.title}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {cardAnchor &&
        (() => {
          const item = timelineData.find((t) => t.id === cardAnchor.id);
          if (!item) return null;
          return createPortal(
            <Card
              id={`orbit-card-${item.id}`}
              role="region"
              aria-label={`${item.title} details`}
              onMouseEnter={cancelClose}
              onMouseLeave={scheduleClose}
              style={cardAnchor.style}
              className="isolate w-64 overflow-hidden border-white/30 bg-neutral-950 shadow-xl shadow-white/10"
            >
              <img
                src={item.image}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-28 w-full object-cover"
              />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-white/80">
                <p>{item.content}</p>
              </CardContent>
            </Card>,
            document.body,
          );
        })()}
    </div>
  );
}
