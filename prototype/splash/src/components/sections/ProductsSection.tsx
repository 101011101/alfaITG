// BEAT 3 — Products: full-bleed tilted 3D marquee. Rendered as a horizontal-rail panel.
import { memo } from "react";
import { Marquee } from "@/components/ui/marquee";
import { Card, CardContent } from "@/components/ui/card";
import { PRODUCTS, type Product } from "@/lib/products";

function ProductCard({ title, blurb, image, icon: Icon }: Product) {
  return (
    <Card className="w-60 overflow-hidden">
      <img src={image} alt="" loading="lazy" decoding="async" className="h-28 w-full object-cover" />
      <CardContent className="pt-4">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-full bg-muted">
            <Icon className="size-4" />
          </span>
          <p className="text-sm font-medium text-foreground">{title}</p>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{blurb}</p>
      </CardContent>
    </Card>
  );
}

// Edge treatment is a TRANSPARENCY MASK, not an opaque overlay. The opaque scrim
// painted a solid --background strip at the panel edges, which at the seams with the
// neighbouring rail panels (Robot / Proof) read as a block. A mask instead dissolves
// the cards themselves to NOTHING (revealing the shared background behind, like every
// other panel), and lets us hold a clean ~5% gutter on the horizontal sides so no card
// fragment ever reaches the seam.
//
// Applied to the panel-aligned perspective wrapper — NOT the rotated plane — so the
// gutters stay vertical instead of tilting with the cards. Alpha ramps are eased
// (several stops) so the dissolve has no hard line. mask-mode is alpha for gradients.
//
// Horizontal: ~5% fully-clear gutter each side, then ease in to full by ~15%.
const H_MASK =
  "linear-gradient(to right," +
  " rgba(0,0,0,0) 0%, rgba(0,0,0,0) 5%," +
  " rgba(0,0,0,0.2) 8%, rgba(0,0,0,0.55) 11%, rgba(0,0,0,0.85) 13%, rgba(0,0,0,1) 15%," +
  " rgba(0,0,0,1) 85%," +
  " rgba(0,0,0,0.85) 87%, rgba(0,0,0,0.55) 89%, rgba(0,0,0,0.2) 92%," +
  " rgba(0,0,0,0) 95%, rgba(0,0,0,0) 100%)";
// Vertical: cards scroll in/out here, so use a wider eased fade (no hard gutter needed).
const V_MASK =
  "linear-gradient(to bottom," +
  " rgba(0,0,0,0) 0%, rgba(0,0,0,0.15) 5%, rgba(0,0,0,0.5) 11%, rgba(0,0,0,0.85) 16%, rgba(0,0,0,1) 20%," +
  " rgba(0,0,0,1) 80%," +
  " rgba(0,0,0,0.85) 84%, rgba(0,0,0,0.5) 89%, rgba(0,0,0,0.15) 95%, rgba(0,0,0,0) 100%)";

// Intersect the two so a pixel survives only if BOTH masks keep it (clean corners too).
//
// will-change + translateZ(0) promote this wrapper to its OWN backing layer so the mask
// is baked into that layer's texture and travels as one unit when the horizontal rail
// translates the track. Without it the mask is a separate compositor step that lands a
// frame behind during fast scroll, briefly exposing card colour at the leading edge.
// overflow:hidden hard-clips the scale(1.15) spill at the panel box by layout (reliable
// every frame) instead of trusting the lagging mask to hide it.
const MASK_STYLE = {
  WebkitMaskImage: `${H_MASK}, ${V_MASK}`,
  maskImage: `${H_MASK}, ${V_MASK}`,
  WebkitMaskComposite: "source-in",
  maskComposite: "intersect",
  overflow: "hidden",
  willChange: "transform",
  transform: "translateZ(0)",
} as const;

// The tilted plane transform — hoisted so it isn't a fresh object each render.
const PLANE_STYLE = {
  transform:
    "translateZ(-120px) rotateX(16deg) rotateY(-8deg) rotateZ(14deg) scale(1.15)",
} as const;

export const ProductsSection = memo(function ProductsSection() {
  const columns = [false, true, false, true, false, true]; // alternate scroll direction
  return (
    <section className="relative h-full w-full overflow-hidden">
      <h2 className="absolute top-10 left-1/2 z-20 -translate-x-1/2 text-3xl font-bold text-foreground drop-shadow">
        Our Key Offerings
      </h2>

      {/* Accessible product list, exposed ONCE to assistive tech. The visual marquee
          below repeats every card (repeat=3 × 6 columns), so it's aria-hidden to avoid
          announcing the same products ~18 times. */}
      <ul className="sr-only">
        {PRODUCTS.map((p) => (
          <li key={p.slug}>
            {p.title}: {p.blurb}
          </li>
        ))}
      </ul>

      {/* Full-bleed tilted marquee plane. The mask (panel-aligned) fades the cards to
          nothing toward every edge and holds clean ~5% gutters on the horizontal sides
          so no card reaches the seams with the Robot / Proof panels. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 flex flex-row items-center justify-center [perspective:1200px]"
        style={MASK_STYLE}
      >
        <div className="flex flex-row items-center gap-6" style={PLANE_STYLE}>
          {columns.map((reverse, i) => (
            <Marquee key={i} vertical pauseOnHover reverse={reverse} repeat={3} className="[--duration:42s]">
              {PRODUCTS.map((p) => (
                <ProductCard key={p.slug} {...p} />
              ))}
            </Marquee>
          ))}
        </div>
      </div>
    </section>
  );
});
