# Alfa ITG — Splash (prototype)

The "jam everything together" sandbox. A small Vite + React + TS + Tailwind v4 +
shadcn app. As-built it's a scroll-driven single page of **5 frames**: a pinned
video Hero (Frame 1), then Frames 2→3→4 (Robot, Products, Proof) riding ONE
pinned horizontal rail, with Contact (Frame 5) cross-fading over Proof.

## Run it

```bash
npm install
npm run dev
```

## Layout

```
src/
  App.tsx                     # app shell + persistent chrome (header, corner CTA, progress bar)
  main.tsx                    # entry — mounts <App/> inside <ErrorBoundary/>
  styles/globals.css          # Tailwind v4 + shadcn tokens + keyframes
  lib/
    utils.ts                  # cn()
    products.ts               # PRODUCTS + COMPANY data (shared by Frames 2 & 3)
    frameScroll.ts            # scroll-hijack / frame-snap engine
  components/
    SplashBackground.tsx      # the default Silent-Precision pixel background (fixed, -z-10)
    LogoBanner.tsx            # bottom curved-arc partner-logo marquee
    ErrorBoundary.tsx         # crash fallback wrapping <App/>
    HorizontalRail.tsx        # the pinned horizontal scroller (Frames 2→3→4 + Contact)
    sections/                 # ONE FILE PER FRAME
      HeroSection.tsx         # Frame 1 — scroll-expand video hero
      TransitionSection.tsx   # Frame 2 — robot (Spline) + radial product orbit
      ProductsSection.tsx     # Frame 3 — tilted 3D marquee
      ProofPanel.tsx          # Frame 4 — gooey morphing text + news carousel
    ui/                       # the reusable components (custom + shadcn primitives)
```

See `../splash-instructions.md` for the full build order and per-frame specs.

## Placeholders to replace with real ALFA assets

- `TransitionSection` Spline scene URL → real robot scene
- `lib/products.ts` → real product names / blurbs / relationships
- `ProofPanel` texts → real proof points (hard number first)
- `HorizontalRail` Contact ink-reveal image → real reveal image
- `LogoBanner` partner logos → confirm trademark usage rights
