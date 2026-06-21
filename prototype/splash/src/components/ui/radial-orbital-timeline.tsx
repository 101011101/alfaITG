"use client";
// NOTE vs. source: `NodeJS.Timeout` -> `ReturnType<typeof setInterval>` so it compiles
// in a browser/Vite TS setup without @types/node. Behaviour identical.
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<number, HTMLDivElement | null>>({});
  // Accumulated idle-spin offset (degrees) added on top of `rotationAngle`.
  const rotationRef = useRef<number>(0);

  // Pure geometry: position of node `index` at a given total rotation offset.
  const computeNodeStyle = (index: number, total: number, offset: number) => {
    const angle = ((index / total) * 360 + offset) % 360;
    const radius = 200;
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

  const collapseOnHover = () => closeAll();

  useEffect(() => {
    // Smooth 60fps idle rotation via rAF (was a 20fps setInterval that fought
    // the per-node CSS transition → the glitchy/steppy halo). ~6°/sec.
    // Drives the spin by mutating node DOM directly (no setState) so idle
    // rotation doesn't re-render the whole component each frame (E4).
    if (!autoRotate) return;
    let raf = 0;
    let last = 0;
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
    const tick = (now: number) => {
      if (last) {
        const dt = now - last;
        rotationRef.current = (rotationRef.current + dt * 0.006) % 360;
        applyFrame();
      }
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // rotationAngle is read as the base offset; re-arm if it (or autoRotate) changes.
  }, [autoRotate, rotationAngle, timelineData]);

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
      className="w-full h-screen flex flex-col items-center justify-center"
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
            // Open the card OUTWARD (toward empty space), not over the robot.
            const openLeft = position.x < 0;

            const nodeStyle = {
              transform: `translate(${position.x}px, ${position.y}px)`,
              zIndex: isExpanded ? 200 : position.zIndex,
              opacity: isExpanded ? 1 : position.opacity,
            };

            return (
              <div
                key={item.id}
                ref={(el) => (nodeRefs.current[item.id] = el)}
                className="pointer-events-auto absolute cursor-pointer"
                style={nodeStyle}
                onMouseEnter={() => expandOnHover(item.id)}
                onMouseLeave={collapseOnHover}
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
                  ${isExpanded ? "text-white scale-125" : "text-white/70"}
                `}
                >
                  {item.title}
                </div>

                {isExpanded && (
                  <Card
                    className={`absolute top-1/2 -translate-y-1/2 w-64 overflow-hidden bg-black/90 backdrop-blur-lg border-white/30 shadow-xl shadow-white/10 ${
                      openLeft ? "right-full mr-4" : "left-full ml-4"
                    }`}
                  >
                    <img
                      src={item.image}
                      alt=""
                      className="h-28 w-full object-cover"
                    />
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-white/80">
                      <p>{item.content}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
