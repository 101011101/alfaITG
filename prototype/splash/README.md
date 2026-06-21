# Alfa ITG — Splash (prototype)

The "jam everything together" sandbox. A small Vite + React + TS + Tailwind v4 +
shadcn app that wires the flashy components onto the 8-beat skeleton from
`../splash-wireframe.html` (the layout blueprint).

## Run it

```bash
npm install
npm run dev
```

## Layout

```
src/
  App.tsx                     # app shell + persistent chrome (header, corner CTA, progress bar)
  main.tsx                    # entry
  styles/globals.css          # Tailwind v4 + shadcn tokens + merged keyframes
  lib/
    utils.ts                  # cn()
    products.ts               # placeholder ALFA_* product data (shared by Beat 2 / 3 / 5)
  components/
    SplashBackground.tsx      # the default Silent-Precision pixel background (fixed, -z-10)
    sections/                 # ONE FILE PER BEAT — agents work here
      HeroSection.tsx         # Beat 1  — PixelHero
      TransitionSection.tsx   # Beat 2  — robot (Spline) + radial product orbit
      ProductsSection.tsx     # Beat 3  — tilted 3D marquee
      ProofSection.tsx        # Beat 4  — gooey morphing text
      GridSection.tsx         # Beat 5  — tilted 3D marquee (utility index)
      FishTankSection.tsx     # Beat 6  — blockout (TBD)
      ContactSection.tsx      # Beat 7  — CTA over ink-reveal
      NewsletterSection.tsx   # blockout (TBD)
    ui/                       # the reusable components (custom + shadcn primitives)
```

See `../splash-instructions.md` for the full build order and per-beat specs.

## Placeholders to replace with real ALFA assets

- `TransitionSection` Spline scene URL → real robot scene
- `lib/products.ts` → real product names / blurbs / relationships
- `ProofSection` texts → real proof points (hard number first)
- `ContactSection` image → real reveal image
- `pixel-perfect-hero` `BRAND_LOGOS` → real client logos
