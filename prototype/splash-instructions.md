# Splash Wireframe — Build Instructions

> **What this is:** the master build order for the **splash** — our "jam everything
> together" sandbox where an agent team wires a pile of flashy components onto the
> beat skeleton. This doc is the single source of truth: read § 1–3, then pick a
> task from § 5 and build it. Each task is self-contained.

---

## 1. The big stack decision (read first)

Every component we're jamming in is **React + TypeScript + shadcn + Tailwind**.
None of it can live inside the old vanilla `splash-wireframe.html`. So:

- **`splash-wireframe.html` is now the BLUEPRINT, not the build target.** It defines
  the beat order, the PIN/FREE intent, and the persistent chrome (header, corner CTA,
  right-edge progress bar). Treat it as the spec for layout + scroll behaviour.
- **The real splash is a React/Vite/Tailwind v4 app** living in `prototype/splash/src/`.
  We port the 8 beats into React sections and drop the fancy components into them.

### The 8 beats (from the blueprint), and what goes in each

| Beat | Section id | Blueprint role | What we're jamming in | Task |
|---|---|---|---|---|
| 1 | `#hero` | Hook / atmosphere | **Scroll-to-expand media hero** (ScrollExpandMedia). Pixel kit is demoted to the **site-wide default background** behind the *other* beats (see § 4) | T2 |
| 2 | `#transition` | "Jet → Schematic" | **3D robot** (Spline) on a Spotlight card, with a **radial orbital ring of products** the robot "looks at" | T3 |
| 3 | `#products` | Product unfold | **Tilted 3D marquee** of product cards | T4 |
| 4 | `#proof` | "It actually works" | **Gooey morphing text** flashing the proof words/numbers | T5 |
| 5 | `#grid` | Summary / utility index | ❌ **DELETED** in Part 2 ("Everything at a glance" removed) | — |
| 6 | `#fishtank` | Client fish tank | ❌ **DELETED** in Part 2 | — |
| 7 | `#contact` | Conversion finale | **Contact CTA above an ink-reveal** — cursor drags toward the button and paints away a mask to reveal an image | T7 |
| — | `#newsletter` | Email capture | _unchanged for now_ | — |

---

## 2. The one rule

This is a sandbox. **Bias toward building, not asking.** Ambiguous? Pick the most
obvious read, build it, drop a `// NOTE: assumption …`. We can always rip it out.

---

## 3. Conventions

- **Component source is already staged** under `prototype/splash/src/components/ui/`.
  The custom components are written for you (see § 6). The standard shadcn primitives
  (`card`, `avatar`, `badge`, `button`) come from the CLI in **T1**.
- **Import alias `@/`** → `prototype/splash/src/`. `cn` lives at `@/lib/utils`.
- **One section = one component** under `components/sections/` (e.g.
  `HeroSection.tsx`, `TransitionSection.tsx`). Keep the fancy UI pieces in `ui/`
  generic; put the ALFA-specific copy/data in the section wrapper.
- **Keep the chrome working.** The progress bar has one segment per beat and the
  header hides on scroll-down / corner CTA appears past the hero — port these from
  the blueprint's bottom `<script>`. New sections must keep auto-joining the bar.
- **Tag PIN vs FREE.** PIN beats (1, 2, 3, 7) are scroll-locked spectacle; FREE
  beats (4, 5, 6) are native scroll. Note it in each section component.
- **Leave breadcrumbs.** Comment assumptions, TODOs, and any place real ALFA assets
  (robot scene, product data, proof numbers, reveal image) still need to drop in.

---

## 4. The default background (Silent-Precision pixel kit)

> "I want the default background to be the Silent Precision kit — if a beat has no
> massive UI thing, that's the background."

`PixelHero` (`@/components/ui/pixel-perfect-hero.tsx`) is the animated pixel-canvas
backdrop. Two jobs:

1. **Beat 1 / Hero** no longer uses `PixelHero` — it's now the **ScrollExpandMedia**
   scroll-to-expand hero (T2). `PixelHero` stays in `ui/` as a spare; only its
   `PixelCanvas` is reused for the global background.
2. **Everywhere else**, the *pixel canvas* is the page's resting background. Beats
   that bring their own spectacle (2 robot, 3/5 marquee, 7 ink-reveal) sit **on top**
   of it; quiet beats (4 proof, 6 fish tank, newsletter) just let it show through.

   Practical approach: lift the `PixelCanvas` out of `PixelHero` into a fixed,
   `-z-10`, full-viewport `<SplashBackground/>` mounted once at the app root, and let
   `PixelHero` reuse it for the hero. Tint comes from the shadcn `--background` /
   `--primary` / `--muted-foreground` tokens, so set those first (T1).

---

## 4b. Part 2 — Remediation applied (investigation-confirmed fixes)

A 6-agent investigation confirmed all 7 reported lenses; fixes applied (build green):

- **Hero (🟣):** now a **video** (`/media/videos/f22-refuel.webm` + F-22 poster), the
  **thesis is overlaid ON the media** (visible pre-scroll, via new `mediaOverlay` prop),
  the media **zooms out to full-bleed** at scroll-end (caps raised to `100vw/100dvh`,
  radius → 0), and the old after-scroll thesis block was **removed**.
- **Robot (🔵):** the `pointer-events-none` wrapper was the bug — the inner robot box is
  now `pointer-events-auto` so the Spline canvas receives the cursor; scene kept as the
  canonical cursor-tracking robot. Orbit nodes outside the box still reachable.
- **Products (🟢):** stage was capped (`h-[480px]/max-w-[900px]`) → now **full-bleed**
  (`absolute inset-0`, perspective 1200px), with kit robot photos on each card.
- **Proof (🟡):** slowed (`morphTime 0.8`, `cooldownTime 2.5`) and given a solid
  **neon-yellow fill** so the gooey `#threshold` filter actually fuses.
- **Contact / ink (🟠):** tracking moved from canvas-only to a **window `pointermove`**
  listener mapped via the canvas rect → no more dead zone over the buttons.
- **Deletions (🔴):** `GridSection` + `FishTankSection` removed (files, imports, BEATS).
- **Assets:** placeholder kit copied to `public/media/`; wired into hero, transition
  (ghosted schematic), products, and contact.
- **Neon diagnostics:** `src/components/_diag.tsx` (`NeonTag`) tags each still-suspect
  section a bright neon. **TEMPORARY** — remove the file + usages once signed off.

## 4c. Part 2 (round 2) — applied

Investigation team confirmed all lenses; fixes applied (build green):

- **Logo banner (🟪):** new `LogoBanner.tsx` (curved-arc concept #2) — fixed to the
  bottom, **translucent → opaque + paused on hover**, both edges mask-faded. Mounted
  in `App.tsx`. Design proposals live in `design-proposals/logo-banner.html`.
- **Gooey (🟡):** root cause was the **threshold-filtered flex parent collapsing to 0**
  (both spans absolute) + the drop-shadow glow being clipped by the alpha threshold.
  Fix: sized the filter container (`relative h-full w-full`) + centered the spans +
  solid `#faff00` fill (no drop-shadow). Slowed cadence (`cooldownTime 2.5`).
- **Proof (🟡):** now a **two-column** section — gooey LEFT, news carousel RIGHT
  (`stagger-testimonials.tsx`, repurposed as ALFA news w/ kit imagery), clipped to its
  half + **mask-faded on the center-facing edge**.
- **Orbit (🔵):** re-layered — robot **below** (interactive, tracks cursor through the
  gaps), orbit **above** in a `pointer-events-none` container with **only the nodes
  interactive**, so both work. Nodes now **hover → pause + expand** (lorem content).
  `bg-black` removed → Silent-Precision background shows through.
- **Hero 2nd text (🟣):** the `mediaOverlay` thesis is now **hidden until 50% scroll**
  (opacity driven by `scrollProgress`) and **clipped within the frame** (`overflow-hidden`).

Still verify-in-browser: gooey "gooeyness", robot scene actually tracking, orbit
hover-layering feel, banner curve.

## 4d. Part 2 (round 3) — applied

- **Hero 2nd text:** entrance now starts at **30%** scroll over a **0.25** window
  (earlier + 2× faster). `scroll-expansion-hero.tsx` overlayOpacity.
- **Orbit center dot:** central hub removed (`radial-orbital-timeline.tsx`).
- **Orbit cards:** now open **outward** (away from the robot: left/right by node side)
  via `openLeft`, and root `overflow-hidden` dropped so they're not clipped.
- **Gooey:** added a real `feGaussianBlur` (stdDeviation 6) before the threshold +
  softened cutoff (−140→−110) so **every** transition fuses; morph slowed to **0.75×**
  (`morphTime` 0.9→1.2).
- **Ink brush:** +5% (`brushSize` 140→147).
- **Newsletter section:** deleted (logo banner replaces the revolving-banner slot).
- **Robot light stroke:** the `Spotlight` is marked **`fill="#ff0000"` (vibrant red)**,
  PENDING owner confirmation before deletion (`TransitionSection.tsx`).

## 4e. Part 2 (round 4) — applied

Investigation confirmed all items; built after validation:

- **Ring glitch:** rotation now `requestAnimationFrame` (60fps) + dropped the
  per-node `transition-all` it was fighting (`radial-orbital-timeline.tsx`).
- **Pink frame / hero gap:** the empty padded trailing block in
  `scroll-expansion-hero.tsx` only renders when it has children → no dead space,
  and `#hero` is ~one viewport so the neon ring hugs the frame.
- **Frame too wide:** media now grows **proportionally** (`calc()` toward 100vw/100dvh
  together) instead of width outrunning height → no horizontal stretch.
- **Parallax → 10%** (`SplashBackground.tsx`).
- **Horizontal rail (corrected):** the middle of the page is now ONE pinned
  HORIZONTAL scroller — `HorizontalRail.tsx` (`h-[400vh]`, sticky inner, a
  `300vw` track translated by scroll). Robot, Products, Proof are full-screen
  PANELS (`TransitionSection`/`ProductsSection`/`ProofPanel`, no own ids/heights).
  At the rail you can't scroll down; scrolling slides the track: **Robot exits left
  → Products in from right → Proof**. Vertical sentinels (`#transition/#products/
  #proof/#contact`) keep the progress bar + nav working.
- **Proof→Contact:** after Proof centers, a fast cross-fade brings **Contact in
  over the Proof panel and replaces it**; buttons/text `pointer-events-none` and
  **InkReveal unmounted until fully revealed**. (`HorizontalReveal`/`ProofContactBeat`
  removed; `ProofSection`/`ContactSection` replaced by `ProofPanel` + the rail overlay.)

## 5. Task Queue

> Status: TODO · IN PROGRESS (@who) · BLOCKED (reason) · DONE → move to § 7.
> Tasks T2–T7 are independent once **T1** is done — fan them out in parallel.
>
> **CURRENT STATE (first pass already wired & building):** the app scaffold exists
> at `prototype/splash/`, installs clean (`npm install`), type-checks and builds
> (`npm run build`), and every beat has a working first-pass implementation in
> `src/components/sections/*`. So T2–T7 are now **refine / polish / real-assets**
> tasks, not build-from-scratch. Run `npm run dev` and iterate per beat.

---

### T1 — Scaffold the app + install everything  ✅ DONE
- **Status:** DONE — booting Vite app at `prototype/splash/`, `npm run build` passes.
- **Goal:** a running Vite + React + TS + Tailwind v4 + shadcn app at `prototype/splash/src/` where `cn`, the shadcn primitives, and all keyframes exist.
- **Build:**
  1. Scaffold Vite React-TS in `prototype/splash/src/` (or wire it so `@/` → that dir). Add Tailwind v4 + `tw-animate-css`.
  2. `npx shadcn@latest init` — when it asks for the components dir, **use `components/ui`** (the pasted components import from `@/components/ui/*`; deviating breaks every import).
  3. `npx shadcn@latest add card avatar badge button` (these back the marquee cards, orbital nodes, and orbital buttons).
  4. Install npm deps (union of every component below):
     ```bash
     npm i clsx tailwind-merge lucide-react class-variance-authority \
       @radix-ui/react-slot @radix-ui/react-avatar \
       @splinetool/runtime @splinetool/react-spline
     # framer-motion only if you swap in the ibelick interactive spotlight (we use the aceternity SVG one — not required)
     ```
  5. Point the global stylesheet at `prototype/splash/src/styles/globals.css` (already written — merges marquee, marquee-vertical, spotlight, loader keyframes). Add your shadcn `:root`/`.dark` tokens to it.
  6. Port the 8 beats from `splash-wireframe.html` into `components/sections/*` + the persistent chrome (header, corner CTA, progress bar). Render them in order in `App.tsx`.
- **Acceptance:** app boots, all 8 empty beat sections scroll, progress bar + header behaviour match the blueprint, `cn` and shadcn primitives import clean.
- **As built (differs slightly from the plan above):** Vite + Tailwind v4 were scaffolded by hand (no `shadcn init`); the four primitives (`card`/`avatar`/`badge`/`button`) were hand-authored into `src/components/ui/` instead of the CLI; shadcn tokens + the dark theme live in `src/styles/globals.css`; chrome is in `src/App.tsx`. `radial-orbital-timeline.tsx` was de-`NodeJS.Timeout`'d to `ReturnType<typeof setInterval>`.

---

### T2 — Scroll-to-expand hero + global pixel background (Beat 1) — `[PIN]`
- **Status:** DONE (first pass) — refine copy + real assets.
- **Where:** `#hero` (`ScrollExpandMedia`), plus an app-root `<SplashBackground/>`.
- **Goal:** a scroll-to-expand media hero that gates the page; the pixel canvas is the resting backdrop behind every other beat.
- **Build:** `HeroSection` uses `ScrollExpandMedia` (image mode, ALFA copy + a Book-a-call / Explore-products CTA in the expanded content). `SplashBackground` lifts `PixelCanvas` into a fixed `-z-10` root layer so quiet beats (4/6/newsletter) show it through.
- **Components:** `@/components/ui/scroll-expansion-hero.tsx` · `@/components/ui/pixel-perfect-hero.tsx` (PixelCanvas) · deps: `framer-motion`, `lucide-react`
- **Notes / TODO:**
  - **Scroll-jack:** `ScrollExpandMedia` pins the window at the top until expanded, then releases — beats 2–8 are only reachable after the expand. Intended gate; confirm it feels right with the header/progress chrome.
  - Swap placeholders → real ALFA assets. For the **F-22 video loop**: set `mediaType="video"`, `mediaSrc` to the loop, `posterSrc` to a still.
  - `next/image` was swapped to `<img>` (we're on Vite, not Next).

---

### T3 — Robot + radial product orbit (Beat 2 "Jet → Schematic") — `[PIN]`
- **Status:** TODO
- **Where:** `#transition`
- **Goal:** replace the jet→schematic beat with an **interactive 3D robot** that sits inside a **radial orbital ring of the ALFA products**, so it reads as "the robot is looking at / surrounded by the products."
- **Build:**
  1. Base = the Spline card: black `Card` + `Spotlight fill="white"` + `SplineScene` (`splite.tsx`). Replace the demo scene URL with a **robot** `.splinecode` scene (placeholder is fine — `// TODO: robot scene`). Keep the left-side headline/sub copy slot for ALFA's "we see the machine, not the surface" thesis.
  2. Overlay `RadialOrbitalTimeline` (`radial-orbital-timeline.tsx`) so its orbit is **centered on the robot**. Feed `timelineData` = the **5 ALFA_\* products** (one node each: `title`, `icon` from lucide, `relatedIds` linking related products, `status`, `energy`). The auto-rotating ring + the robot at center = "robot watching the products."
  3. Make the orbital nodes the **NAV-HUB teleport targets** the blueprint calls for in Beat 2b: clicking a product node scrolls to that product in Beat 3.
- **Components:** `splite.tsx`, `spotlight.tsx`, `radial-orbital-timeline.tsx` · CLI: `card badge button` · deps: `@splinetool/runtime @splinetool/react-spline lucide-react`
- **Notes:** the orbital component is `h-screen bg-black` by design — fits a PIN beat. Layer the robot card and the orbit in the same centered stack (robot lower z, orbit higher z, nodes clickable). `animate-spotlight` keyframe is already in `globals.css`.

---

### T4 — Product unfold as a tilted 3D marquee (Beat 3) — `[PIN]`
- **Status:** TODO
- **Where:** `#products`
- **Goal:** the gridded product section looks like the 3D testimonials marquee — several columns of cards, tilted in perspective, scrolling vertically (alternating up/down), edges faded.
- **Build:** use the `DemoOne` layout from the 3d-testimonials demo: a `[perspective:300px]` stage with the `translateX/Z rotateX/Y/Z` transform, 4 `Marquee vertical` columns (alternate `reverse`), gradient edge overlays. Swap the testimonial data for **ALFA product cards** (product name, one-line value prop, icon/logo instead of avatar). Each card is a teleport/scroll target so Beat 2's orbit nodes can land here.
- **Component:** `@/components/ui/marquee.tsx` · CLI: `card avatar` · deps: `@radix-ui/react-avatar`
- **Notes:** marquee/marquee-vertical keyframes already in `globals.css`. `pauseOnHover` so a visitor can stop and read a product.

---

### T5 — Proof as flashing gooey words (Beat 4) — `[FREE]`
- **Status:** TODO
- **Where:** `#proof`
- **Goal:** the proof beat flashes its punchy claims with the gooey morph effect — e.g. `"310% ROI" → "Analyst-validated" → "It actually works" → …`.
- **Build:** drop `GooeyText` (`gooey-text-morphing.tsx`) center-stage over the pixel background. Feed `texts` = the ALFA proof points (hard number first). Tune `morphTime` / `cooldownTime` for a confident, readable cadence (not too fast). Keep one supporting line (analyst / ROI signal) static beneath it.
- **Component:** `@/components/ui/gooey-text-morphing.tsx`
- **Notes:** the SVG `#threshold` filter is inlined in the component — no global CSS needed. `text-foreground`, so it inherits theme color over the pixel bg.

---

### T6 — Summary grid as a tilted 3D marquee (Beat 5) — `[FREE]`
- **Status:** TODO
- **Where:** `#grid`
- **Goal:** the "utility index" / second table-of-contents rendered as the same 3D marquee, but as a fast scannable index of **everything** (all products + sections), distinct from the cinematic Beat-2 map.
- **Build:** reuse the T4 marquee layout/component with a denser, more utilitarian card (label + tiny meta, link to its section). This is the scannable counterpart to Beat 2's cinematic nav hub.
- **Component:** `@/components/ui/marquee.tsx` (shared with T4) · CLI: `card avatar`
- **Notes:** same component, different data + card density. Consider `repeat`/speed tweaks so it reads as "index," not "showcase."

---

### T7 — Contact finale over ink-reveal (Beat 7) — `[PIN]`
- **Status:** TODO
- **Where:** `#contact`
- **Goal:** the final CTA (Book a call / email us) sits **above** a full-bleed ink-reveal: as the cursor moves toward the button, it paints away a mask and reveals a cool image behind it.
- **Build:**
  1. Beat container `position: relative; overflow: hidden`. Layer order, bottom→top: (a) the reveal **image** (`<img>` absolute inset-0, object-cover — `// TODO: pick the reveal image`), (b) `<InkReveal/>` (`ink-reveal.tsx`) as the mask canvas painting away on cursor move, (c) the **contact CTA** on top at a higher z-index so it stays clickable.
  2. Set `InkReveal`'s `maskColor` to match the page background so, before hover, the beat looks like solid background; moving the cursor toward the button "inks" the image into view.
  3. Keep the CTA buttons (`Book a call`, `email us`) above the canvas and fully clickable (canvas is `cursor:none` — make sure pointer events still reach the buttons; raise the CTA z-index above the canvas's `z-index:1`).
- **Component:** `@/components/ui/ink-reveal.tsx`
- **Notes:** ink-reveal is pure canvas, no extra deps. Default `maskColor` is `[252,250,248]` (near-white) — change to your real bg. This is the conversion moment, so verify the buttons never get blocked by the canvas.

---

## 6. Staged component source (already written)

These live in `prototype/splash/src/`. Custom ones are pre-written; primitives via CLI.

| File | Export | Source / origin | Status |
|---|---|---|---|
| `lib/utils.ts` | `cn` | shadcn | ✅ written |
| `styles/globals.css` | — | merged keyframes | ✅ written |
| `components/ui/scroll-expansion-hero.tsx` | `ScrollExpandMedia` (default) | scroll-expand hero (next/image→img) | ✅ written |
| `components/ui/pixel-perfect-hero.tsx` | `PixelHero`, `PixelCanvas` | Silent-Precision kit (bg only now) | ✅ written |
| `components/ui/splite.tsx` | `SplineScene` | Spline wrapper | ✅ written |
| `components/ui/spotlight.tsx` | `Spotlight` | aceternity (SVG) | ✅ written |
| `components/ui/radial-orbital-timeline.tsx` | `RadialOrbitalTimeline` | orbital ring | ✅ written |
| `components/ui/marquee.tsx` | `Marquee` | 3d-testimonials | ✅ written |
| `components/ui/gooey-text-morphing.tsx` | `GooeyText` | gooey morph | ✅ written |
| `components/ui/ink-reveal.tsx` | `InkReveal` (default) | ink-reveal canvas | ✅ written |
| `components/ui/card.tsx` | `Card …` | shadcn | ✅ written |
| `components/ui/avatar.tsx` | `Avatar …` | shadcn | ✅ written |
| `components/ui/badge.tsx` | `Badge` | shadcn | ✅ written |
| `components/ui/button.tsx` | `Button` | shadcn | ✅ written |

Plus the app shell: `App.tsx`, `main.tsx`, `index.html`, `vite.config.ts`,
`tsconfig*.json`, `package.json`, `src/lib/products.ts` (shared product data),
`src/components/SplashBackground.tsx`, and `src/components/sections/*` (8 beats).

---

## 7. Done

Move finished tasks here with a one-line summary.

- _(nothing yet)_

---

## 8. Idea backlog (unsorted dumping ground)

- Beat 6 fish tank + newsletter still on the plain blockout — pick effects later.
- Robot scene, product data, proof numbers, and the T7 reveal image are all
  placeholders until real ALFA assets land.
