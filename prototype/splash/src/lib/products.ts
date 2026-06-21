import type { ElementType } from "react";
import { Cpu, Radar, ShieldCheck, Workflow, Boxes } from "lucide-react";

// Placeholder ALFA_* product data. Shape matches RadialOrbitalTimeline's
// TimelineItem so the Beat-2 orbit and the Beat-3 marquee share one source.
// Images come from the placeholder kit (public/media/images/industrial/*).
// TODO: replace with real product names, blurbs, relationships, and imagery.
export interface Product {
  id: number;
  slug: string;
  title: string;
  blurb: string;
  date: string;
  content: string;
  category: string;
  icon: ElementType;
  image: string;
  relatedIds: number[];
  status: "completed" | "in-progress" | "pending";
  energy: number;
}

export const PRODUCTS: Product[] = [
  {
    id: 1,
    slug: "alfa-core",
    title: "ALFA_Core",
    blurb: "The industrial AI engine every other product plugs into.",
    date: "Platform",
    content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    category: "Platform",
    icon: Cpu,
    image: "/media/images/industrial/robot-welding.jpg",
    relatedIds: [2, 5],
    status: "completed",
    energy: 100,
  },
  {
    id: 2,
    slug: "alfa-sense",
    title: "ALFA_Sense",
    blurb: "Real-time sensing + anomaly detection on the line.",
    date: "Sensing",
    content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    category: "Sensing",
    icon: Radar,
    image: "/media/images/industrial/robot-palletizing.jpg",
    relatedIds: [1, 3],
    status: "completed",
    energy: 88,
  },
  {
    id: 3,
    slug: "alfa-guard",
    title: "ALFA_Guard",
    blurb: "Safety + compliance envelope around autonomous decisions.",
    date: "Assurance",
    content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    category: "Assurance",
    icon: ShieldCheck,
    image: "/media/images/industrial/robot-welding.jpg",
    relatedIds: [2, 4],
    status: "in-progress",
    energy: 64,
  },
  {
    id: 4,
    slug: "alfa-flow",
    title: "ALFA_Flow",
    blurb: "Orchestrates the whole pipeline end to end.",
    date: "Orchestration",
    content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    category: "Orchestration",
    icon: Workflow,
    image: "/media/images/industrial/robot-palletizing.jpg",
    relatedIds: [3, 5],
    status: "pending",
    energy: 40,
  },
  {
    id: 5,
    slug: "alfa-twin",
    title: "ALFA_Twin",
    blurb: "Live digital twin you can interrogate and simulate against.",
    date: "Simulation",
    content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    category: "Simulation",
    icon: Boxes,
    image: "/media/images/industrial/robot-polishing.jpg",
    relatedIds: [1, 4],
    status: "pending",
    energy: 28,
  },
];
