// BEAT 3 — Products: full-bleed tilted 3D marquee. Rendered as a horizontal-rail panel.
import type { ElementType } from "react";
import { Marquee } from "@/components/ui/marquee";
import { Card, CardContent } from "@/components/ui/card";
import { PRODUCTS, type Product } from "@/lib/products";

function ProductCard({ title, blurb, image, icon: Icon }: Product & { icon: ElementType }) {
  return (
    <Card className="w-60 overflow-hidden">
      <img src={image} alt="" className="h-28 w-full object-cover" />
      <CardContent className="pt-4">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-full bg-muted">
            <Icon className="size-4" />
          </span>
          <figcaption className="text-sm font-medium text-foreground">{title}</figcaption>
        </div>
        <blockquote className="mt-3 text-sm text-muted-foreground">{blurb}</blockquote>
      </CardContent>
    </Card>
  );
}

export function ProductsSection() {
  const columns = [false, true, false, true, false, true]; // alternate scroll direction
  return (
    <section className="relative h-full w-full overflow-hidden">
      <h2 className="absolute top-10 left-1/2 z-20 -translate-x-1/2 text-3xl font-bold text-foreground drop-shadow">
        Our Key Offerings
      </h2>

      {/* Full-bleed tilted marquee plane. */}
      <div className="absolute inset-0 flex flex-row items-center justify-center [perspective:1200px]">
        <div
          className="flex flex-row items-center gap-6"
          style={{
            transform:
              "translateZ(-120px) rotateX(16deg) rotateY(-8deg) rotateZ(14deg) scale(1.15)",
          }}
        >
          {columns.map((reverse, i) => (
            <Marquee key={i} vertical pauseOnHover reverse={reverse} repeat={3} className="[--duration:42s]">
              {PRODUCTS.map((p) => (
                <ProductCard key={p.slug} {...p} />
              ))}
            </Marquee>
          ))}
        </div>
        {/* Edge fades. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1/5 bg-gradient-to-b from-background" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/5 bg-gradient-to-t from-background" />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-gradient-to-r from-background" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-gradient-to-l from-background" />
      </div>
    </section>
  );
}
