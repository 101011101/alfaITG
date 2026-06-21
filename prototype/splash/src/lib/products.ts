import type { ElementType } from "react";
import {
  Workflow,
  ShieldCheck,
  Bot,
  Sparkles,
  GraduationCap,
  Eye,
  History,
  Users,
  Target,
  Gem,
  Building2,
  Sprout,
} from "lucide-react";

// ALFA "Smart Solutions" — the six real offerings from the live site copy.
// Shape matches RadialOrbitalTimeline's TimelineItem so the Beat-2 orbit and the
// Beat-3 marquee share one source.
// Images come from the placeholder kit (public/media/images/industrial/*).
// TODO: swap placeholder imagery for real per-solution art when assets land.
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
    slug: "smart-automation",
    title: "Smart Automation",
    blurb: "Discover how Alfa ITG transforms workflows.",
    date: "Automation",
    content:
      "We harness real-time data to predict, automate, and interpret action across the line — turning complex industrial signal into decisions you can trust.",
    category: "Automation",
    icon: Workflow,
    image: "/media/images/industrial/robot-welding.jpg",
    relatedIds: [2, 4],
    status: "completed",
    energy: 100,
  },
  {
    id: 2,
    slug: "secure-factories",
    title: "Securing Future Factories",
    blurb: "Protecting industrial digital assets seamlessly.",
    date: "Security",
    content:
      "A safety and compliance envelope around autonomous operations, keeping the connected factory resilient end to end.",
    category: "Security",
    icon: ShieldCheck,
    image: "/media/images/industrial/robot-palletizing.jpg",
    relatedIds: [1, 3],
    status: "completed",
    energy: 88,
  },
  {
    id: 3,
    slug: "collaborative-robots",
    title: "Collaborative Robots",
    blurb: "Enhancing productivity with Cobots.",
    date: "Robotics",
    content:
      "Cobots that work alongside your team, lifting throughput without sacrificing safety on the floor.",
    category: "Robotics",
    icon: Bot,
    image: "/media/images/industrial/robot-polishing.jpg",
    relatedIds: [2, 4],
    status: "in-progress",
    energy: 72,
  },
  {
    id: 4,
    slug: "ai-innovating-industry",
    title: "AI Innovating Industry",
    blurb: "Harnessing Generative AI for smarter factories.",
    date: "Generative AI",
    content:
      "Our proprietary Industrial AI suite uses Generative AI to build tools that solve real customer needs — machine learning that powers smarter factories.",
    category: "Generative AI",
    icon: Sparkles,
    image: "/media/images/industrial/robot-welding.jpg",
    relatedIds: [1, 5],
    status: "in-progress",
    energy: 64,
  },
  {
    id: 5,
    slug: "workforce-innovation",
    title: "Workforce & Innovation",
    blurb: "Building skills for tomorrow's automation.",
    date: "Workforce",
    content:
      "Hands-on, industry-aligned upskilling that prepares teams for the next generation of Industrial AI and automation.",
    category: "Workforce",
    icon: GraduationCap,
    image: "/media/images/industrial/robot-palletizing.jpg",
    relatedIds: [4, 6],
    status: "pending",
    energy: 48,
  },
  {
    id: 6,
    slug: "vision-for-automation",
    title: "Vision for Automation",
    blurb: "Leadership insights on automation futures.",
    date: "Strategy",
    content:
      "Where Industrial AI takes manufacturing, energy, and automation next — leadership perspective on the road ahead.",
    category: "Strategy",
    icon: Eye,
    image: "/media/images/industrial/robot-polishing.jpg",
    relatedIds: [1, 5],
    status: "pending",
    energy: 32,
  },
];

// "About Alfa ITG" — the company story, rendered as the Beat-2 robot orbit
// (the halo around the robot). Same TimelineItem shape as PRODUCTS so it drops
// straight into RadialOrbitalTimeline. Distinct from PRODUCTS (the offerings
// marquee): this halo is who we are, not what we sell.
export const COMPANY: Product[] = [
  {
    id: 1,
    slug: "our-history",
    title: "Our History",
    blurb: "A leader in industrial equipment since 1990.",
    date: "Since 1990",
    content:
      "Established in 1990, Alfa ITG has been a leader in the industrial equipment industry — decades of experience and a deep understanding of the market.",
    category: "History",
    icon: History,
    image: "/media/images/industrial/robot-welding.jpg",
    relatedIds: [2, 3],
    status: "completed",
    energy: 100,
  },
  {
    id: 2,
    slug: "our-team",
    title: "Our Team",
    blurb: "Experienced professionals, passionate about your success.",
    date: "People",
    content:
      "Our team is made up of experienced professionals who work together to ensure our solutions meet the highest standards of quality and reliability.",
    category: "Team",
    icon: Users,
    image: "/media/images/industrial/robot-palletizing.jpg",
    relatedIds: [1, 3],
    status: "completed",
    energy: 84,
  },
  {
    id: 3,
    slug: "our-mission",
    title: "Our Mission",
    blurb: "High-quality solutions that exceed expectations.",
    date: "Purpose",
    content:
      "To provide high-quality industrial equipment that meets our clients' needs — exceeding expectations through exceptional service and innovative solutions.",
    category: "Mission",
    icon: Target,
    image: "/media/images/industrial/robot-polishing.jpg",
    relatedIds: [2, 4],
    status: "completed",
    energy: 72,
  },
  {
    id: 4,
    slug: "our-values",
    title: "Our Values",
    blurb: "Innovation, customer success, and security.",
    date: "Values",
    content:
      "Innovative IT for streamlined operations and growth — accelerating your path to market while reducing cost and ensuring security.",
    category: "Values",
    icon: Gem,
    image: "/media/images/industrial/robot-welding.jpg",
    relatedIds: [3, 5],
    status: "in-progress",
    energy: 60,
  },
  {
    id: 5,
    slug: "reliable-partner",
    title: "Reliable Partner",
    blurb: "Trusted by Fortune 500 clients across industries.",
    date: "Trust",
    content:
      "Partnering with Fortune 500 clients across a range of industries to deliver tailored IT solutions that drive success.",
    category: "Partnership",
    icon: Building2,
    image: "/media/images/hero/f22-pair-inflight.jpg",
    relatedIds: [4, 6],
    status: "in-progress",
    energy: 48,
  },
  {
    id: 6,
    slug: "the-foundation",
    title: "The Foundation",
    blurb: "Bridging academia and industry through AI.",
    date: "Foundation",
    content:
      "The Alfa ITG AI Foundation connects academia with industry, advancing sustainable growth through Industrial AI education and innovation.",
    category: "Foundation",
    icon: Sprout,
    image: "/media/images/schematic/engine-cutaway.png",
    relatedIds: [1, 5],
    status: "pending",
    energy: 36,
  },
];
