// The middle of the page = ONE pinned HORIZONTAL scroller.
// Once you reach the rail it pins (you can't scroll "down" anymore); scrolling
// instead slides the track sideways: Robot exits left → Products enters right →
// Proof enters. After Proof, a fast cross-fade brings Contact in OVER it and
// replaces it (buttons/text + ink mouse-trace only enable once fully revealed).
import { useEffect, useRef, useState } from "react";
import { TransitionSection } from "./sections/TransitionSection";
import { ProductsSection } from "./sections/ProductsSection";
import { ProofPanel } from "./sections/ProofPanel";
import InkReveal from "@/components/ui/ink-reveal";
import { Paperclip } from "lucide-react";
import { frameScroll } from "@/lib/frameScroll";

const clamp = (v: number) => Math.min(Math.max(v, 0), 1);
const PANELS = 3; // Robot, Products, Proof
const CONTACT_EMAIL = "IR@alfaitg.com";

export function HorizontalRail() {
  const railRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);

  // Contact form — no backend in this sandbox, so we hand off via mailto: and
  // show an inline confirmation. Inputs are controlled for honest validation.
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleContactSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim();
    const message = form.message.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError("Please enter a valid email address.");
      return;
    }
    setFormError(null);
    const subject = encodeURIComponent(
      name ? `Project enquiry — ${name}` : "Project enquiry",
    );
    const body = encodeURIComponent(
      `${message}\n\n— ${name || "Anonymous"}${email ? ` (${email})` : ""}`,
    );
    // Open the visitor's mail client prefilled to the company address.
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    setSent(true);
    setForm({ name: "", email: "", message: "" });
  };

  // Jump down to the footer's structured contact form (the alternative to the
  // overlay's instant mailto CTA). Uses the frame engine so it snaps cleanly.
  const goToFooter = () => {
    const el = document.getElementById("footer");
    if (el) frameScroll.goToPos(el.getBoundingClientRect().top + window.scrollY);
  };

  useEffect(() => {
    const onScroll = () => {
      const rail = railRef.current;
      const track = trackRef.current;
      const contact = contactRef.current;
      if (!rail || !track || !contact) return;
      const vh = window.innerHeight;
      const rect = rail.getBoundingClientRect();
      const total = rail.offsetHeight - vh; // scrollable distance inside the rail
      const sc = Math.min(Math.max(-rect.top, 0), total);

      // HORIZONTAL travel: one screen of scroll per panel transition.
      const hTravel = (PANELS - 1) * vh;
      const tx = (Math.min(sc, hTravel) / vh) * 100; // vw
      track.style.transform = `translate3d(-${tx}vw, 0, 0)`;

      // CONTACT = its OWN full-screen frame after Proof. The track (Proof/news)
      // fades OUT as Contact fades IN, so Contact never bleeds over static news.
      const c = clamp((sc - hTravel) / vh);
      contact.style.opacity = String(c);
      track.style.opacity = String(1 - c);
      setRevealed((prev) => (prev === c >= 1 ? prev : c >= 1));

      // FOOTER = its OWN full-screen frame after Contact. A final panel rises to
      // cover the bottom third while the CTA shifts up to stay clear of it.
      const f = clamp((sc - (hTravel + vh)) / vh); // 0→1
      if (footerRef.current)
        footerRef.current.style.transform = `translateY(${(1 - f) * 100}%)`;
      if (ctaRef.current)
        ctaRef.current.style.transform = `translateY(-${f * 30}vh)`;
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section ref={railRef} className="relative" style={{ height: "500vh" }}>
      {/* vertical sentinels = progress-bar + nav anchors (no CSS snap) */}
      <div id="transition" data-label="Schematic" className="absolute top-0 h-px w-full" />
      <div id="products" data-label="Products" className="absolute h-px w-full" style={{ top: "100vh" }} />
      <div id="proof" data-label="Proof" className="absolute h-px w-full" style={{ top: "200vh" }} />
      <div id="contact" data-label="Contact" className="absolute h-px w-full" style={{ top: "300vh" }} />
      <div id="footer" data-label="More" className="absolute h-px w-full" style={{ top: "400vh" }} />

      <div className="sticky top-0 h-screen overflow-hidden">
        {/* horizontal track of full-screen panels */}
        <div
          ref={trackRef}
          className="flex h-full will-change-transform"
          style={{ width: `${PANELS * 100}vw` }}
        >
          <div className="relative h-full w-screen shrink-0 overflow-hidden">
            <TransitionSection />
          </div>
          <div className="relative h-full w-screen shrink-0 overflow-hidden">
            <ProductsSection />
          </div>
          <div className="relative h-full w-screen shrink-0 overflow-hidden">
            <ProofPanel />
          </div>
        </div>

        {/* Contact overlay — fades in over the Proof panel, gated until revealed */}
        {/* pointer-events-none so it never blocks the robot/orbit beneath it while
            invisible; the CTA re-enables events once revealed. */}
        <div
          ref={contactRef}
          className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
          style={{ opacity: 0 }}
          aria-hidden={!revealed}
        >
          <img
            src="/media/images/hero/f22-pacific.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* The cross-fade reveals this BLACK mask (80% — image faintly shows
              behind). Always mounted so the fade is to black, not the image; the
              cursor trail only enables once fully revealed. */}
          <InkReveal
            maskColor={[0, 0, 0]}
            brushSize={147}
            enabled={revealed}
            style={{ opacity: 0.9 }}
          />
          <div
            ref={ctaRef}
            className={`relative z-10 flex flex-col items-center gap-6 px-4 text-center ${
              revealed ? "pointer-events-auto" : ""
            }`}
          >
            <h2 className="text-3xl font-bold text-white drop-shadow-lg md:text-5xl">
              Elevate Your Business with Innovation
            </h2>
            <p className="max-w-md text-sm text-white/80">
              Contact us today to learn how our AI and machine learning solutions
              can help you achieve your goals.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="mailto:IR@alfaitg.com"
                tabIndex={revealed ? 0 : -1}
                className="rounded-md bg-white px-6 py-3 font-semibold text-black transition-transform hover:scale-[1.03]"
              >
                Begin Your Transformation
              </a>
              <button
                onClick={goToFooter}
                tabIndex={revealed ? 0 : -1}
                className="rounded-md border border-white/50 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10"
              >
                Use the contact form ↓
              </button>
            </div>
          </div>
        </div>

        {/* FOOTER semi-beat — rises over the bottom third on the final scroll.
            Holds the "bottom of the page" info: hours, contact, social, legal.
            Starts translated fully below the sticky viewport; the scroll handler
            slides it up. */}
        <footer
          ref={footerRef}
          style={{ transform: "translateY(100%)" }}
          className="absolute inset-x-0 bottom-0 z-20 h-[64vh] overflow-y-auto border-t border-white/15 bg-black/95 backdrop-blur-md"
        >
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-8 py-9 text-left text-white/80 md:grid-cols-2">
            {/* LEFT — real contact form. No backend in this sandbox, so submit
                hands off to the visitor's mail client via mailto: and confirms
                inline. Inputs are controlled with sr-only labels for a11y. */}
            <form onSubmit={handleContactSubmit} className="flex flex-col gap-3" noValidate>
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white">
                Contact Us Today
              </h3>
              {sent ? (
                <div
                  role="status"
                  className="rounded-md border border-emerald-400/40 bg-emerald-400/10 px-3 py-4 text-sm text-emerald-200"
                >
                  <p className="font-semibold">Thanks — we'll be in touch.</p>
                  <p className="mt-1 text-emerald-200/70">
                    Your email client should have opened with your message ready
                    to send to {CONTACT_EMAIL}.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSent(false)}
                    className="mt-3 w-fit rounded border border-emerald-400/40 px-3 py-1 text-emerald-100 transition-colors hover:bg-emerald-400/10"
                  >
                    Send another
                  </button>
                </div>
              ) : (
                <>
                  <label htmlFor="contact-name" className="sr-only">
                    Your name
                  </label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Your Name"
                    className="rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/50 focus:outline-none"
                  />
                  <label htmlFor="contact-email" className="sr-only">
                    Email address (required)
                  </label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="Email*"
                    aria-invalid={!!formError}
                    aria-describedby={formError ? "contact-error" : undefined}
                    className="rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/50 focus:outline-none"
                  />
                  <label htmlFor="contact-message" className="sr-only">
                    Project details
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    rows={3}
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    placeholder="Share Your Project Details"
                    className="resize-none rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/50 focus:outline-none"
                  />
                  <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-white/60 hover:text-white">
                    <input type="file" multiple className="hidden" />
                    <Paperclip className="size-4" /> Attach Files
                    <span className="text-white/30">(Attachments 0)</span>
                  </label>
                  {formError && (
                    <p id="contact-error" role="alert" className="text-[12px] text-rose-300">
                      {formError}
                    </p>
                  )}
                  <button
                    type="submit"
                    className="mt-1 w-fit rounded border border-white/40 px-3 py-1 text-white transition-colors hover:bg-white/10"
                  >
                    Send
                  </button>
                  <p className="text-[11px] leading-snug text-white/30">
                    Sending opens your email client with the message prefilled —
                    nothing is submitted to a server.
                  </p>
                </>
              )}
            </form>

            {/* RIGHT — legal entity, help copy, hours, social. */}
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-white">
                  Alfa Intelligent Technology Group, Inc.
                </h3>
                <p className="text-sm text-white/60">
                  We know that our clients have unique needs. Send us a message
                  and we will get back to you soon. You can reach us at{" "}
                  <a
                    href="mailto:IR@alfaitg.com"
                    className="text-white/80 hover:text-white"
                  >
                    IR@alfaitg.com
                  </a>
                  .
                </p>
              </div>
              <div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-white">
                  Operating Hours
                </h3>
                <ul className="space-y-1 text-sm text-white/60">
                  <li>Mon–Fri · 9:00 am – 7:00 pm</li>
                  <li>Sat · Closed</li>
                  <li>Sun · Closed</li>
                </ul>
              </div>
              <div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-white">
                  Follow
                </h3>
                <ul className="flex gap-4 text-sm text-white/60">
                  <li>
                    <a href="#" className="hover:text-white">
                      LinkedIn
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      X / Twitter
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      GitHub
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="px-8 pb-4 text-center text-[11px] text-white/30">
            Copyright © 2026 Alfa ITG - All Rights Reserved.
          </div>
        </footer>
      </div>
    </section>
  );
}
