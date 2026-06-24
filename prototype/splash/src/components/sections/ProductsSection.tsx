// BEAT 3 — Products: full-bleed tilted 3D marquee. Rendered as a horizontal-rail panel.
import { memo } from "react";
import { Marquee } from "@/components/ui/marquee";
import { Card, CardContent } from "@/components/ui/card";
import { PRODUCTS, type Product } from "@/lib/products";

function ProductCard({ title, blurb, image, icon: Icon }: Product) {
  return (
    <Card className="w-60 overflow-hidden">
      <img src={image} alt="" loading="lazy" decoding="async" width={240} height={112} className="h-28 w-full object-cover" />
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

// Edge treatment is a TRANSPARENCY MASK, not an opaque overlay (an opaque --background
// scrim read as a solid block at the seams with the Robot / Proof panels). A mask
// dissolves the cards themselves to NOTHING, revealing the shared background behind.
//
// SCOPE: this panel only owns the VERTICAL fade — the cards scroll in/out top/bottom
// via the marquee, so they must dissolve there. The HORIZONTAL (left/right) fade is
// NOT here anymore: it now lives on the rail's viewport-anchored wrapper
// (TRACK_EDGE_MASK_STYLE in HorizontalRail). A panel-relative horizontal mask scrolled
// its clear gutters off-screen mid-transition, so the viewport edge sliced the panel's
// full-opacity middle — cards hit the hard overflow clip with no fade. Anchoring the
// horizontal fade to the screen fixed that; keeping it here too would double-fade.
//
// Applied to the panel-aligned perspective wrapper — NOT the rotated plane — so the
// fade stays axis-aligned instead of tilting with the cards. Several eased stops so
// the dissolve has no hard line.
const V_MASK =
  "linear-gradient(to bottom," +
  " rgba(0,0,0,0) 0%, rgba(0,0,0,0.15) 5%, rgba(0,0,0,0.5) 11%, rgba(0,0,0,0.85) 16%, rgba(0,0,0,1) 20%," +
  " rgba(0,0,0,1) 80%," +
  " rgba(0,0,0,0.85) 84%, rgba(0,0,0,0.5) 89%, rgba(0,0,0,0.15) 95%, rgba(0,0,0,0) 100%)";

// overflow:hidden hard-clips the scale(1.15) spill at the panel box by layout (reliable
// every frame). translateZ(0) + will-change keep this wrapper on its own backing layer.
const MASK_STYLE = {
  WebkitMaskImage: V_MASK,
  maskImage: V_MASK,
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
          below repeats every card (repeat=2 × 6 columns), so it's aria-hidden to avoid
          announcing the same products ~12 times. */}
      <ul className="sr-only">
        {PRODUCTS.map((p) => (
          <li key={p.slug}>
            {p.title}: {p.blurb}
          </li>
        ))}
      </ul>

      {/* Full-bleed tilted marquee plane. The panel-aligned mask fades the cards to
          nothing at the TOP/BOTTOM (where the marquee scrolls them in/out); the
          left/right fade at the screen edges is owned by the rail's viewport mask. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 flex flex-row items-center justify-center [perspective:1200px]"
        style={MASK_STYLE}
      >
        <div className="flex flex-row items-center gap-6" style={PLANE_STYLE}>
          {columns.map((reverse, i) => (
            <Marquee key={i} vertical pauseOnHover reverse={reverse} repeat={2} className="[--duration:42s]">
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
