"use client"

// Adapted from the "stagger-testimonials" component → repurposed as ALFA NEWS
// cards styled like real press clippings. Mechanics unchanged (centered fanned
// carousel, prev/next). Each card = a news article: outlet masthead + kicker +
// serif headline + dek + date. Headlines are paraphrased from real 2026 defense
// / military-AI coverage (CNBC, Bloomberg, Reuters, Defense One, WSJ, Axios,
// Fortune, CNN) — swap for sourced press art / real permalinks when assets land.
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewsItem {
  tempId: number;
  outlet: string;
  brand: string;   // masthead accent (brand color)
  serif?: boolean; // outlets whose wordmark reads as a serif masthead
  kicker: string;
  headline: string;
  dek: string;
  date: string;
  imgSrc: string;
}

const news: NewsItem[] = [
  {
    tempId: 0,
    outlet: "CNBC",
    brand: "#0072C6",
    kicker: "Defense",
    headline: "Pentagon expands Palantir's AI role in $10B enterprise deal",
    dek: "The Maven Smart System moves from experiment to operational infrastructure, consolidating data and software across the Army.",
    date: "Mar 2026",
    imgSrc: "/media/images/industrial/robot-welding.jpg",
  },
  {
    tempId: 1,
    outlet: "Bloomberg",
    brand: "#111827",
    serif: true,
    kicker: "Markets",
    headline: "Industrials lead S&P 500 beat as defense and AI demand surge",
    dek: "U.S. manufacturers posted the biggest earnings surprise of any sector, powered by defense orders and AI capital spending.",
    date: "Mar 2026",
    imgSrc: "/media/images/schematic/engine-cutaway.png",
  },
  {
    tempId: 2,
    outlet: "Reuters",
    brand: "#FF8000",
    kicker: "Industry",
    headline: "Anduril lands 10-year, $20B-plus Pentagon agreement",
    dek: "The defense-tech firm challenges incumbents RTX and Lockheed Martin after a $5 billion private funding round.",
    date: "Mar 2026",
    imgSrc: "/media/images/hero/f22-pair-inflight.jpg",
  },
  {
    tempId: 3,
    outlet: "Defense One",
    brand: "#0E7C7B",
    kicker: "Technology",
    headline: "Pentagon eyes self-organizing drone swarms as autonomy budget skyrockets",
    dek: "Funding for the Defense Autonomous Working Group could leap from $226 million toward tens of billions under the new proposal.",
    date: "May 2026",
    imgSrc: "/media/images/industrial/robot-palletizing.jpg",
  },
  {
    tempId: 4,
    outlet: "Fortune",
    brand: "#7A1010",
    serif: true,
    kicker: "Analysis",
    headline: "Anduril's mega-deal rewrites the rules for Silicon Valley",
    dek: "A turning-point contract pulls venture-backed startups deeper into the defense industrial base — and raises new risks.",
    date: "Mar 2026",
    imgSrc: "/media/images/hero/f22-twilight.jpg",
  },
  {
    tempId: 5,
    outlet: "The Wall Street Journal",
    brand: "#1A1A1A",
    serif: true,
    kicker: "Finance",
    headline: "Defense-tech funding tops $14.6B in 2026, smashing last year",
    dek: "Anduril, Palantir, Shield AI and Saronic lead a record wave of private investment into military AI.",
    date: "Jun 2026",
    imgSrc: "/media/images/industrial/robot-polishing.jpg",
  },
  {
    tempId: 6,
    outlet: "Axios",
    brand: "#1E40AF",
    kicker: "Exclusive",
    headline: "Scoop: Palantir battles Pentagon over key intelligence contract",
    dek: "A dispute over a DIA award tests how fast software-first firms can scale inside government.",
    date: "May 2026",
    imgSrc: "/media/images/schematic/airframe-cutaway.png",
  },
  {
    tempId: 7,
    outlet: "CNN",
    brand: "#CC0000",
    kicker: "World",
    headline: "Embedded AI is redefining how military drones see and decide",
    dek: "On-board perception lets unmanned systems target and navigate even when communications are jammed.",
    date: "Apr 2026",
    imgSrc: "/media/images/hero/f22-pacific.jpg",
  },
];

const Masthead: React.FC<{ item: NewsItem }> = ({ item }) => (
  <span className="flex items-center gap-1.5">
    <span
      className="h-3.5 w-1 rounded-sm"
      style={{ background: item.brand }}
      aria-hidden
    />
    <span
      className={cn(
        "leading-none",
        item.serif
          ? "font-serif text-[15px] font-bold tracking-tight"
          : "text-xs font-extrabold uppercase tracking-[0.14em]"
      )}
      style={{ color: item.brand }}
    >
      {item.outlet}
    </span>
  </span>
);

interface NewsCardProps {
  position: number;
  item: NewsItem;
  handleMove: (steps: number) => void;
  cardSize: number;
}

const NewsCard: React.FC<NewsCardProps> = ({ position, item, handleMove, cardSize }) => {
  const isCenter = position === 0;

  return (
    <div
      onClick={() => handleMove(position)}
      className={cn(
        // White "paper" clipping so brand mastheads + serif headlines read like
        // real print on the dark Proof panel.
        "absolute left-1/2 top-1/2 flex cursor-pointer flex-col overflow-hidden border-2 bg-white text-neutral-900 transition-all duration-500 ease-in-out",
        isCenter
          ? "z-10 border-neutral-900 opacity-100"
          : "z-0 border-neutral-300 opacity-60 hover:opacity-90"
      )}
      style={{
        width: cardSize,
        height: cardSize,
        clipPath: `polygon(40px 0%, 100% 0%, 100% 100%, 0 100%, 0 0)`,
        transform: `
          translate(-50%, -50%)
          translateX(${(cardSize / 1.5) * position}px)
          translateY(${isCenter ? -65 : position % 2 ? 15 : -15}px)
          rotate(${isCenter ? 0 : position % 2 ? 2.5 : -2.5}deg)
        `,
        boxShadow: isCenter ? "0px 8px 0px 4px rgba(0,0,0,0.28)" : "none",
      }}
    >
      {/* article art */}
      <img
        src={item.imgSrc}
        alt=""
        className="h-[38%] w-full shrink-0 border-b border-neutral-200 bg-neutral-100 object-cover"
      />

      {/* article body */}
      <div className="flex flex-1 flex-col gap-1.5 px-5 py-4">
        <div className="flex items-center justify-between">
          <Masthead item={item} />
          <span className="text-[11px] font-medium text-neutral-400">{item.date}</span>
        </div>

        <span
          className="text-[10px] font-bold uppercase tracking-[0.18em]"
          style={{ color: item.brand }}
        >
          {item.kicker}
        </span>

        <h3 className="font-serif text-[17px] font-bold leading-snug text-neutral-900 sm:text-lg">
          {item.headline}
        </h3>

        <p className="text-[13px] leading-snug text-neutral-500">{item.dek}</p>

        <span
          className="mt-auto pt-1 text-[11px] font-semibold"
          style={{ color: item.brand }}
        >
          Read at {item.outlet} ↗
        </span>
      </div>
    </div>
  );
};

export const StaggerTestimonials: React.FC = () => {
  const [cardSize, setCardSize] = useState(365);
  const [list, setList] = useState<NewsItem[]>(news);

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
