# Placeholder Media Kit — Alfa ITG Cinematic Taster

A local, offline set of **stand-in** media so the taster can be built and demoed
before real assets exist. Nothing here is final — these are representative
placeholders chosen to *show the feel and where media sits* in each beat
(see `../../docs/cinematic-taster-prd.md` §3).

## Licensing — safe to use as placeholders

- **F-22 video + stills** → US Air Force imagery via Wikimedia Commons =
  **public domain** (US federal work). Safe to ship even in the demo.
- **Schematics + factory-robot photos** → Wikimedia Commons, free licenses
  (public domain / CC). Fine for an internal pitch; check the specific file's
  license page before any public/commercial use.
- **Total kit ≈ 36 MB.** All files are local — the demo runs with no network.

> ⚠️ Replace before production. The real hero shot (jet flying across +
> shattering into a 3D schematic), the real client logos, and a **sourced**
> proof number are NOT in here — they still need to come from Alfa / a 3D
> pipeline.

---

## videos/

| File | What it is | How to use it |
|---|---|---|
| `f22-refuel.webm` | F-22 mid-air refueling, ~steady framing (1.7 MB, webm — plays in all browsers) | **Beat 1 Hero** background loop. Best default: webm autoplays everywhere; pair with a darkened overlay + headline. Stands in for "cinematic motion footage," though the *real* hero wants a fly-across shot. |
| `f22-flyby.ogv` | Alternate F-22 clip (2.1 MB, ogv — **won't play in Safari**) | Backup hero / variety. Use only if testing in Chrome/Firefox, or transcode to mp4/webm first. |
| `robot-carve.webm` | Robot arm carving (17 MB, webm) | **Beat 3 Product Unfold** or any industrial b-roll slot — a moving "machine doing work" loop behind a product card. Large; trim/compress before real use. |

## images/hero/  — Beat 1 & 2 (the jet)

| File | What it is | How to use it |
|---|---|---|
| `f22-twilight.jpg` | F-22 banking at twilight, cinematic (2.8 MB) | **Hero poster** (the `poster=` frame shown before video loads) or a static hero if you drop video. The most "premium" still in the kit. |
| `f22-pair-inflight.jpg` | Two F-22s in flight (264 KB) | **Beat 2** "the jet flies across" — the *before* state of the jet→schematic transition. Small + light. |
| `f22-pacific.jpg` | F-22 over the Pacific, top-down (660 KB) | Alt hero / section divider / parallax layer. |

## images/schematic/  — Beat 2 (jet → schematic) & nav hub

| File | What it is | How to use it |
|---|---|---|
| `airframe-cutaway.png` | Boeing 727 full airframe cutaway, b&w line art (2.0 MB) | The **"explodes into schematic"** payoff and the **teleport nav hub** — its labeled parts are the natural clickable hotspots. Best stand-in for the real thing. |
| `engine-cutaway.png` | Jet engine (GE J85) cutaway line drawing (664 KB) | A single "component" detail — use when one schematic part zooms in, or as a product-card schematic. |
| `airframe-lines.png` | Simple glider line drawing (28 KB) | Minimal/abstract schematic — good for tiny UI, the progress-bar region, or a low-detail mobile fallback. |

## images/industrial/  — Beat 3 Products (also Beat 5 grid)

| File | What it is | How to use it |
|---|---|---|
| `robot-welding.jpg` | FANUC 6-axis welding robots (884 KB) | Product card imagery — reads as **Auto / Aero / heavy mfg**. |
| `robot-palletizing.jpg` | Robots palletizing bread (1.9 MB) | Product card — reads as **Food & Beverage** industry. |
| `robot-polishing.jpg` | Robot arm polishing guitars (6.7 MB) | Product card / b-roll — reads as **precision / consumer mfg**. Large; compress before use. |

---

## Quick usage notes

- **Video:** `<video autoplay muted loop playsinline poster="images/hero/f22-twilight.jpg"><source src="videos/f22-refuel.webm" type="video/webm"></video>`. Always `muted` (autoplay needs it) and always set a `poster`.
- **Browser support:** prefer the `.webm` files; the `.ogv` won't play in Safari. Transcode to `.mp4` (H.264) if you need universal support.
- **Weight:** `robot-carve.webm` (17 MB) and `robot-polishing.jpg` (6.7 MB) are the heavy ones — fine for a local demo, compress/resize before anything public.
- **Mapping at a glance:** Hero → `videos/f22-refuel.webm` + `hero/f22-twilight.jpg`; Transition → `hero/f22-pair-inflight.jpg` + `schematic/airframe-cutaway.png`; Products → `industrial/*`; Grid → reuse industrial + schematic; Fish tank/logos → still need real logos (use `placehold.co` boxes for now).
