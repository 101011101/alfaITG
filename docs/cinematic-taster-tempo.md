# Alfa ITG — Cinematic Taster: Tempo & Pacing

The **rhythm** companion to `cinematic-taster-prd.md`. The PRD says *what* each
beat is; this doc says *how fast it breathes* — the tension/release curve, the
scroll mechanic per beat, and the scroll-length budget. Beat numbers match the
PRD's §3 schema.

---

## 1. The core pacing principle

A scroll-driven site is a **film**, and film paces by two moves:

1. **Alternating tension and release** — peaks only land if rests precede them.
2. **Interleaving emotion and logic** — the F-22 video is *emotion* ("this is
   real, this is serious"); the schematic specs and the proof number are *logic*
   ("this fits my plant, and it works").

The failure mode is **all spectacle.** A buying committee's CFO and OT-security
lead need the logic beats, or the drama reads as *compensating*. Even for a
pitch taster, baking in the logic beats signals to the prospect that we
understand their conversion problem — not just animation.

---

## 2. The two mechanical levers

| Lever | What it does | Use for |
|---|---|---|
| **Pin + scrub** — section locks, animation tied 1:1 to the scroll wheel (both directions) | Slows time; creates set-pieces | **Spectacle** — hero, jet→schematic, product unfold, contact finale |
| **Free scroll** — native scroll, control returned to the user | Lets people read and scan at their own pace | **Rest & proof** — problem copy, proof, grid, fish tank, newsletter |

> **The rule:** spectacle is pinned; proof and navigation are free-scroll.
> **Pinning everything is the #1 way these sites tank their bounce and
> scroll-depth KPIs** (KPI doc 2.14 / 2.15). Scrub must map 1:1 both directions
> and always remain skippable (PRD §2 + the skip arrows in §4.1).

---

## 3. The beat-by-beat pacing map

`2a/2b` are the two tempo phases inside PRD Beat 2 — the peak transition and the
rest that follows it. The rest is load-bearing; don't collapse it into the peak.

| # | Beat | Scroll mechanic | ~Viewport-heights | Narrative job | Conversion job | Energy |
|---|---|---|---|---|---|---|
| 1 | **Hero** — F-22 video, "We are an Industrial AI company" | Pinned, slow; let the video breathe before copy fades in | 1.0–1.5 vh | Hook + atmosphere | 5-sec relevance check; persistent CTA appears in nav | ▰▰▰▱ rising |
| 1b | **The Problem** — copy over the still-flying jet | Free scroll over pinned video | 1.0 vh | Name the pain (downtime cost, labor gap) | Make them *feel* the cost | ▰▰▰▰ tension |
| 2a | **The Transition** — jet flies across, explodes into schematic | Pinned + scrubbed (the marquee set-piece) | 2.0–2.5 vh | "We see the machine, not the surface" = thesis | — (pure spectacle) | ▰▰▰▰▰ peak |
| 2b | **Thesis + Nav hub** — schematic holds, hotspots become teleports | Pin releases → interactive rest | 1.5 vh | State the thesis; orient the visitor | Self-navigation for the ~70% who research alone | ▰▰▱▱ release |
| 3 | **Product unfold** — schematic folds out, one ALFA_* per reveal | Pinned, scrubbed, one beat per product | ~1.0 vh × 5 | Show the 5 products as parts of one machine | Each product = a problem→outcome | ▰▰▰▱ rhythmic pulses |
| 4 | **Proof** — quantified results + analyst/ROI | Free scroll | 1.0–1.5 vh | "It actually works" | The gate before any ask — hard number | ▰▰▰▰ rising |
| 5 | **The Grid** — everything summarized, 2nd TOC | Free scroll, scannable, calm | 1.0 vh | Overview / recap / re-navigate | Catch-all routing for scanners | ▰▰▱▱ release |
| 6 | **Client Fish Tank** — clients swim in a tank, settle on hover | Ambient motion; tank fills its space on arrival | ~1.0 vh | Social proof, playful | Credibility transfer (logos = +43% conv.) | ▰▰▱▱ calm |
| 7 | **Contact finale** — everything converges to one CTA | Pinned, dramatic close | 1.0 vh | The payoff | The conversion event (call/email) | ▰▰▰▰▰ final peak |
| 8 | **Newsletter banner** — revolving banner, email capture | Free scroll (footer) | 0.5 vh | Stay in touch | Capture the ~95% not ready today (95:5) | ▰▱▱▱ denouement |

**Total ≈ 14–15 viewport-heights.** Long for a page, fine for a film — because
the schematic teleports + skip arrows let anyone shortcut the linear path.

---

## 4. The tension curve

Classic three-act shape: hook → spectacle peak → rest → rhythmic build → proof →
calm overview → closing peak → settle.

```
         2a TRANSITION                                   7 CONTACT
 HIGH │       ╱╲                          4 PROOF           ╱╲
      │  1b  ╱  ╲                            ╱╲            ╱  ╲
  MED │ ╱╲  ╱    ╲   3 PRODUCTS ╱╲╱╲╱╲    ╱   ╲   5   6  ╱    ╲
      │╱  ╲╱      ╲ ╱╲╱╲╱╲╱╲╱╲╱       ╲ ╱     ╲ ╱╲ ╱╲ ╱      ╲  8
  LOW │1           ╲__╱                 ╲╱      ╲╱    ╲╱        ╲___
      │             (2b hub rest)                (grid/tank rest)
      └──────────────────────────────────────────────────────────────►
       hook  PEAK   rest      rhythmic build   PROOF  release  PEAK  end
         └─── ACT 1 ───┘└──── ACT 2 ────┘└──────── ACT 3 ────────┘
```

**The two rests are the whole trick.** Beat 2b (thesis hub) and Beats 5–6
(grid + fish tank) are deliberate low-energy stretches. Without them the product
unfold gets exhausting by product #3 and the Contact peak doesn't land. Rests
aren't filler — they're what *makes* the peaks read as peaks.

---

## 5. One-line summary

Pace it as a **three-act film**: pin the spectacle (hero, transition, unfold,
finale), free-scroll the logic and rest (problem, proof, grid, fish tank,
newsletter), and protect the **two rest beats** so the transition and contact
peaks actually land — interleaving the F-22's *emotion* with the proof number's
*logic* so the drama closes deals instead of just impressing.
