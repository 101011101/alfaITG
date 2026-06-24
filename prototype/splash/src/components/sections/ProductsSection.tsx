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
// TWO fades, two jobs:
//  • V_MASK (top/bottom) — the cards scroll in/out vertically via the marquee, so they
//    must dissolve there.
//  • H_MASK (left/right) — an AESTHETIC card vignette: the cards fade away toward the
//    panel's sides. This is panel-relative, so it tracks the panel as it slides. On its
//    OWN that left full-opacity cards at the screen edge mid-transition (the old leak);
//    it's safe now only because the rail's viewport-anchored mask (TRACK_EDGE_MASK_STYLE
//    in HorizontalRail) backstops the actual screen edge during transitions. So keep it
//    soft/wide for the look; the screen edge is guaranteed elsewhere.
//
// Applied to the panel-aligned perspective wrapper — NOT the rotated plane — so the
// fades stay axis-aligned instead of tilting with the cards. Several eased stops so the
// dissolve has no hard line. The two are composited with `intersect` (a pixel survives
// only if BOTH keep it), which also cleans up the corners.
//
// H_MASK is fully CLEAR for the outer 5% on each side — exactly matching CARD_FRAME's
// 5% layout clip below. So in normal rendering the cards dissolve to 0 right at the
// clip line (no faint hard edge), and the clip is a pure failsafe: even if the mask
// mis-renders, no card pixel can reach the outer 5% / the panel seam.
const H_MASK =
  "linear-gradient(to right," +
  " rgba(0,0,0,0) 0%, rgba(0,0,0,0) 5%," +
  " rgba(0,0,0,0.25) 10%, rgba(0,0,0,0.6) 15%, rgba(0,0,0,0.85) 19%, rgba(0,0,0,1) 22%," +
  " rgba(0,0,0,1) 78%," +
  " rgba(0,0,0,0.85) 81%, rgba(0,0,0,0.6) 85%, rgba(0,0,0,0.25) 90%," +
  " rgba(0,0,0,0) 95%, rgba(0,0,0,0) 100%)";
const V_MASK =
  "linear-gradient(to bottom," +
  " rgba(0,0,0,0) 0%, rgba(0,0,0,0.15) 5%, rgba(0,0,0,0.5) 11%, rgba(0,0,0,0.85) 16%, rgba(0,0,0,1) 20%," +
  " rgba(0,0,0,1) 80%," +
  " rgba(0,0,0,0.85) 84%, rgba(0,0,0,0.5) 89%, rgba(0,0,0,0.15) 95%, rgba(0,0,0,0) 100%)";

// overflow:hidden hard-clips the scale(1.15) spill at the panel box by layout (reliable
// every frame). translateZ(0) + will-change keep this wrapper on its own backing layer.
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

      {/* TWO nested frames:
          • FADE FRAME (full panel) carries the H+V mask vignette.
          • CARD FRAME (inset 5% left/right, its own overflow:hidden) holds the cards,
            so they're physically clipped a step INSIDE the fade. Belt-and-braces: even
            if the mask mis-renders, the cards can never reach the panel edge / seam.
            Inset is horizontal only — clipping top/bottom would chop the marquee's
            vertical fade into a hard line. */}
      <div aria-hidden="true" className="absolute inset-0" style={MASK_STYLE}>
        <div className="absolute inset-y-0 left-[5%] right-[5%] flex flex-row items-center justify-center overflow-hidden [perspective:1200px]">
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
      </div>
    </section>
  );
});
