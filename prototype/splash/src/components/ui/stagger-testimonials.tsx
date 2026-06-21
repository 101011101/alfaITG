"use client"

// Adapted from the "stagger-testimonials" component → repurposed as ALFA NEWS cards.
// Mechanics unchanged (centered fanned carousel, prev/next). Data swapped to news
// items using local placeholder-kit imagery (offline).
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const SQRT_5000 = Math.sqrt(5000);

// TODO: replace with real ALFA press / proof items + real imagery.
const news = [
  {
    tempId: 0,
    testimonial: "Alfa ITG cuts unplanned downtime 41% across three pilot lines.",
    by: "ITG Wire · Mar 2026",
    imgSrc: "/media/images/industrial/robot-welding.jpg",
  },
  {
    tempId: 1,
    testimonial: "ALFA_Core named a leader in industrial-AI platforms.",
    by: "Analyst Brief · Feb 2026",
    imgSrc: "/media/images/industrial/robot-palletizing.jpg",
  },
  {
    tempId: 2,
    testimonial: "Digital twin flags a turbine fault six weeks before failure.",
    by: "Field Report · Jan 2026",
    imgSrc: "/media/images/industrial/robot-polishing.jpg",
  },
  {
    tempId: 3,
    testimonial: "Aerospace supplier scales ALFA_Sense to 12 plants.",
    by: "Case Study · Dec 2025",
    imgSrc: "/media/images/hero/f22-pair-inflight.jpg",
  },
  {
    tempId: 4,
    testimonial: "ALFA_Guard clears the safety envelope for autonomous cells.",
    by: "Compliance Note · Nov 2025",
    imgSrc: "/media/images/schematic/engine-cutaway.png",
  },
  {
    tempId: 5,
    testimonial: "310% ROI in year one, independently validated.",
    by: "ROI Audit · Oct 2025",
    imgSrc: "/media/images/hero/f22-twilight.jpg",
  },
  {
    tempId: 6,
    testimonial: "ALFA_Flow orchestrates 1M+ machine decisions a day.",
    by: "Ops Metrics · Sep 2025",
    imgSrc: "/media/images/industrial/robot-welding.jpg",
  },
  {
    tempId: 7,
    testimonial: "From signal to decision on the line in under 200ms.",
    by: "Benchmark · Aug 2025",
    imgSrc: "/media/images/hero/f22-pacific.jpg",
  },
];

interface NewsCardProps {
  position: number;
  item: typeof news[0];
  handleMove: (steps: number) => void;
  cardSize: number;
}

const NewsCard: React.FC<NewsCardProps> = ({ position, item, handleMove, cardSize }) => {
  const isCenter = position === 0;

  return (
    <div
      onClick={() => handleMove(position)}
      className={cn(
        "absolute left-1/2 top-1/2 cursor-pointer border-2 p-8 transition-all duration-500 ease-in-out",
        isCenter
          ? "z-10 bg-primary text-primary-foreground border-primary"
          : "z-0 bg-card text-card-foreground border-border hover:border-primary/50"
      )}
      style={{
        width: cardSize,
        height: cardSize,
        clipPath: `polygon(50px 0%, calc(100% - 50px) 0%, 100% 50px, 100% 100%, calc(100% - 50px) 100%, 50px 100%, 0 100%, 0 0)`,
        transform: `
          translate(-50%, -50%)
          translateX(${(cardSize / 1.5) * position}px)
          translateY(${isCenter ? -65 : position % 2 ? 15 : -15}px)
          rotate(${isCenter ? 0 : position % 2 ? 2.5 : -2.5}deg)
        `,
        boxShadow: isCenter ? "0px 8px 0px 4px hsl(var(--border))" : "0px 0px 0px 0px transparent"
      }}
    >
      <span
        className="absolute block origin-top-right rotate-45 bg-border"
        style={{ right: -2, top: 48, width: SQRT_5000, height: 2 }}
      />
      <img
        src={item.imgSrc}
        alt=""
        className="mb-4 h-14 w-12 bg-muted object-cover object-top"
        style={{ boxShadow: "3px 3px 0px hsl(var(--background))" }}
      />
      <h3 className={cn("text-base sm:text-xl font-medium", isCenter ? "text-primary-foreground" : "text-foreground")}>
        {item.testimonial}
      </h3>
      <p className={cn(
        "absolute bottom-8 left-8 right-8 mt-2 text-sm italic",
        isCenter ? "text-primary-foreground/80" : "text-muted-foreground"
      )}>
        {item.by}
      </p>
    </div>
  );
};

export const StaggerTestimonials: React.FC = () => {
  const [cardSize, setCardSize] = useState(365);
  const [list, setList] = useState(news);

  const handleMove = (steps: number) => {
    const newList = [...list];
    if (steps > 0) {
      for (let i = steps; i > 0; i--) {
        const item = newList.shift();
        if (!item) return;
        newList.push({ ...item, tempId: Math.random() });
      }
    } else {
      for (let i = steps; i < 0; i++) {
        const item = newList.pop();
        if (!item) return;
        newList.unshift({ ...item, tempId: Math.random() });
      }
    }
    setList(newList);
  };

  useEffect(() => {
    const updateSize = () => {
      const { matches } = window.matchMedia("(min-width: 640px)");
      setCardSize(matches ? 365 : 290);
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return (
    <div className="relative w-full overflow-hidden" style={{ height: 600 }}>
      {list.map((item, index) => {
        const position = list.length % 2
          ? index - (list.length + 1) / 2
          : index - list.length / 2;
        return (
          <NewsCard
            key={item.tempId}
            item={item}
            handleMove={handleMove}
            position={position}
            cardSize={cardSize}
          />
        );
      })}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        <button
          onClick={() => handleMove(-1)}
          className={cn(
            "flex h-14 w-14 items-center justify-center text-2xl transition-colors",
            "bg-background border-2 border-border hover:bg-primary hover:text-primary-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          )}
          aria-label="Previous news"
        >
          <ChevronLeft />
        </button>
        <button
          onClick={() => handleMove(1)}
          className={cn(
            "flex h-14 w-14 items-center justify-center text-2xl transition-colors",
            "bg-background border-2 border-border hover:bg-primary hover:text-primary-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          )}
          aria-label="Next news"
        >
          <ChevronRight />
        </button>
      </div>
    </div>
  );
};
