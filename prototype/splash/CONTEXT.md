# Alfa ITG — Splash · Transport / Context Sheet

> Paste this into a fresh chat to load full context on the splash site.
> Location: `prototype/splash/` in repo `alfaITG`. Stack: Vite + React + TS + Tailwind v4 + shadcn.

---

## 1. What this is

A scroll-driven single-page splash site for **Alfa ITG** ("Industrial AI"). The page is
built around **frames** — full-viewport "stops" the scroll snaps to. There are 5 frames,
each a labeled section.

Despite the README mentioning an "8-beat" vertical skeleton, the **as-built** structure is
just two things rendered in `App.tsx`: `HeroSection` + `HorizontalRail`. The middle of the
site is ONE pinned horizontal scroller.

---

## 2. The frames (core mental model)

```
FRAME 1 — HERO        vertical, pinned. scroll-expand video.          magenta
   ↓ vertical scroll
═══ HORIZONTAL RAIL (pinned, 350vh) ═══════════════════════════
FRAME 2 ROBOT  →  FRAME 3 PRODUCTS  →  FRAME 4 PROOF              cyan / green / yellow
                                  FRAME 5 CONTACT (fades OVER proof) orange
═══════════════════════════════════════════════════════════════
```

- **Frame 1 (Hero):** real VERTICAL frame. Pins at top, video expands on scroll.
- **Frames 2→3→4 (Robot, Products, Proof):** HORIZONTAL. On the rail, downward scroll
  slides the `track` sideways — one panel per screen. Robot exits left as Products enters.
- **Frame 5 (Contact):** not a slide — CROSS-FADES in on top of Proof and replaces it.

**frame = labeled section = snap target = nav anchor** — same thing seen from different code.

---

## 3. Terminology sheet

### Beats / frames (the `BEATS` array + scroll anchors)

| # | Canonical term | `id` | `data-label` | NeonTag | Color | Component |
|---|---|---|---|---|---|---|
| 1 | **Hero** | `hero` | Hero | HERO | magenta `#ff00e6` | `HeroSection` — scroll-expand video, thesis on media |
| 2 | **Transition** ⚠️ (aka Robot / Schematic) | `transition` | Schematic | ROBOT | cyan `#00f0ff` | `TransitionSection` — cursor-tracking Spline robot + radial product orbit |
| 3 | **Products** | `products` | Products | PRODUCTS | green `#39ff14` | `ProductsSection` — tilted 3D card marquee |
| 4 | **Proof** | `proof` | Proof | PROOF | yellow `#faff00` | `ProofPanel` — gooey ROI text (left) + news carousel (right) |
| 5 | **Contact** | `contact` | Contact | CONTACT | orange `#ff5e00` | inline in `HorizontalRail` — CTA over ink-reveal |

### Persistent chrome (always on screen, in `App.tsx`)

| Element | Term | Notes |
|---|---|---|
| Top bar | **Header** | Wordmark "ALFA ITG" + nav. Hides on scroll-down. |
| Floating button | **Corner CTA** | Appears past 80% of first viewport. |
| Right-edge dots | **Progress bar** (segments = beats) | One per beat + skip arrows. |
| Fixed pixel field | **Splash Background** (Silent-Precision pixel kit) | Parallax 10% scroll, `-z-10`. |
| Bottom carousel | **Logo Banner** | Curved-arc client-logo marquee. Neon: violet `#b026ff`. |

### Mechanism terms

| Term | Meaning |
|---|---|
| **Horizontal Rail** | 350vh pinned section; scrolling down slides panels sideways. |
| **Panel** | A full-screen slide on the rail's horizontal `track` (3: Robot, Products, Proof). |
| **Sentinel** | Invisible 1px divs marking vertical scroll positions; serve as nav anchors + snap targets. |
| **Escape velocity / speed bump** | Snap rule in `App.tsx`: must flick with intent (peak velocity ≥ `ESCAPE`) to leave a frame, else "trapped" back. |
| **Contact cross-fade** | Fast fade bringing Contact OVER Proof in last half-screen of rail scroll. |
| **NeonTag / lens** | TEMPORARY diagnostic ring+badge naming each section (`_diag.tsx`). Delete when signed off. |

### Products (shared by Frame 2 orbit + Frame 3 marquee, `lib/products.ts`)

| Term | What | Category |
|---|---|---|
| **ALFA_Core** | industrial AI engine | Platform |
| **ALFA_Sense** | sensing + anomaly detection | Sensing |
| **ALFA_Guard** | safety/compliance envelope | Assurance |
| **ALFA_Flow** | pipeline orchestration | Orchestration |
| **ALFA_Twin** | live digital twin | Simulation |

---

## 4. File map

```
prototype/splash/src/
  App.tsx                     # shell: header, corner CTA, progress bar, snap logic. Renders Hero + Rail.
  main.tsx                    # entry
  styles/globals.css          # Tailwind v4 + shadcn tokens + keyframes
  lib/
    utils.ts                  # cn()
    products.ts               # ALFA_* product data (shared by Frame 2 orbit / Frame 3 marquee)
  components/
    _diag.tsx                 # NeonTag + NEON color map (TEMPORARY diagnostic labels)
    SplashBackground.tsx      # pixel-field background, parallax, mounted once at root
    LogoBanner.tsx            # bottom logo marquee
    HorizontalRail.tsx        # the pinned horizontal scroller (Frames 2-5 live here)
    sections/
      HeroSection.tsx         # Frame 1
      TransitionSection.tsx   # Frame 2 (robot + orbit)
      ProductsSection.tsx     # Frame 3 (marquee)
      ProofPanel.tsx          # Frame 4 (gooey + news)
      # Frame 5 (Contact) is INLINE in HorizontalRail.tsx, no separate file
    ui/                       # reusable components (shadcn + custom): scroll-expansion-hero,
                              # radial-orbital-timeline, marquee, gooey-text-morphing,
                              # stagger-testimonials, ink-reveal, pixel-perfect-hero, splite, etc.
```

---

## 5. Known inconsistencies / open items

- **Frame 2 has 4 names:** file `TransitionSection`, NeonTag `ROBOT`, sentinel `data-label="Schematic"`,
  nav/`BEATS` `Transition`, README `Beat 2`. NOT yet unified. (Suggestion: "Transition" = the frame's
  identity; "Robot"/"Schematic" describe its contents.)
- **README is stale:** documents files that don't exist (`ProofSection`, `GridSection`, `FishTankSection`,
  `ContactSection`, `NewsletterSection`). The build collapsed these.
- **"Beat" vocabulary is legacy** from `../splash-wireframe.html`; doesn't fully match as-built.
- **NeonTag system is temporary** — delete `_diag.tsx` + all `<NeonTag>` usages once sections sign off.
- **Placeholders to replace:** Spline robot scene URL, `products.ts` real data, Proof points (real ROI
  numbers), Contact reveal image, real client logos in Logo Banner.

---

## 6. Run

```bash
cd prototype/splash && npm install && npm run dev
```
