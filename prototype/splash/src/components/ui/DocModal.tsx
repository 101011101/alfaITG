// "Authorial Choices" popup — renders the canonical synthesised design doc.
//
// The doc is imported with ?raw from src/content/synthesised.md (kept inside the
// app root so Vercel can bundle it) and rendered with react-markdown.
//
// This whole module is loaded LAZILY (see App.tsx) so react-markdown / remark-gfm
// never touch the cinematic first paint — they download only on first open. The
// open/close animation is plain CSS (no framer-motion) to keep the chunk small.
//
// COEXISTENCE WITH THE SCROLL ENGINE: frameScroll.ts binds wheel/touch/keydown on
// window with preventDefault, which would otherwise eat scrolling INSIDE this popup.
// The scrollable panel stops those events from bubbling to window, so the engine
// stays dormant while the modal is open without us having to stop()/start() it.
import { useEffect, useRef, type ComponentPropsWithoutRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import doc from "../../content/synthesised.md?raw";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Focus is returned here on close (the header button that opened the modal). */
  triggerRef?: React.RefObject<HTMLElement | null>;
};

// Markdown element → Tailwind class map. No typography plugin, so each tag is
// styled explicitly against the dark popover tokens. The `pre`/`code` rules are
// the load-bearing ones: the doc's ASCII "Schema" block must keep its alignment
// (monospace, preserved whitespace, horizontal scroll instead of wrap).
const MD = {
  h1: (p: ComponentPropsWithoutRef<"h1">) => (
    <h1 className="mb-3 text-xl font-bold tracking-tight text-foreground" {...p} />
  ),
  h2: (p: ComponentPropsWithoutRef<"h2">) => (
    <h2 className="mt-7 mb-2 text-sm font-bold uppercase tracking-[0.18em] text-foreground" {...p} />
  ),
  p: (p: ComponentPropsWithoutRef<"p">) => (
    <p className="my-2 text-sm leading-relaxed text-muted-foreground" {...p} />
  ),
  ul: (p: ComponentPropsWithoutRef<"ul">) => (
    <ul className="my-2 ml-4 list-disc space-y-1.5 text-sm text-muted-foreground marker:text-muted-foreground/50" {...p} />
  ),
  ol: (p: ComponentPropsWithoutRef<"ol">) => (
    <ol className="my-2 ml-4 list-decimal space-y-1.5 text-sm text-muted-foreground" {...p} />
  ),
  li: (p: ComponentPropsWithoutRef<"li">) => <li className="pl-1 leading-relaxed" {...p} />,
  strong: (p: ComponentPropsWithoutRef<"strong">) => (
    <strong className="font-semibold text-foreground" {...p} />
  ),
  em: (p: ComponentPropsWithoutRef<"em">) => <em className="italic" {...p} />,
  hr: (p: ComponentPropsWithoutRef<"hr">) => <hr className="my-5 border-border" {...p} />,
  a: (p: ComponentPropsWithoutRef<"a">) => (
    <a className="text-foreground underline underline-offset-2 hover:opacity-80" {...p} />
  ),
  // Inline code vs. fenced block: a fenced block carries a language class or spans
  // multiple lines. We branch on that to keep it dependency-free.
  code: ({ className, children, ...rest }: ComponentPropsWithoutRef<"code">) => {
    const text = String(children);
    const isBlock = (className?.includes("language-") ?? false) || text.includes("\n");
    return isBlock ? (
      <code className="font-mono text-[12px] leading-snug text-foreground" {...rest}>
        {children}
      </code>
    ) : (
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[12px] text-foreground" {...rest}>
        {children}
      </code>
    );
  },
  pre: (p: ComponentPropsWithoutRef<"pre">) => (
    <pre
      className="my-3 overflow-x-auto whitespace-pre rounded-md border border-border bg-background/60 p-3"
      {...p}
    />
  ),
};

export default function DocModal({ open, onClose, triggerRef }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Esc to close · focus the panel on open · restore focus to the trigger on close
  // · lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      triggerRef?.current?.focus();
    };
  }, [open, onClose, triggerRef]);

  return createPortal(
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-opacity duration-200 ${
        open ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!open}
    >
      {/* backdrop — click to close */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden />

      {/* panel — stops scroll/keys from reaching the frameScroll engine */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="docmodal-title"
        tabIndex={-1}
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        className={`relative z-10 max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-popover/95 p-7 shadow-2xl backdrop-blur outline-none transition-all duration-200 ${
          open ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="size-4" />
        </button>

        {/* hidden a11y title target (the doc's own H1 carries the visible title) */}
        <span id="docmodal-title" className="sr-only">
          Authorial Choices
        </span>

        <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD}>
          {doc}
        </ReactMarkdown>
      </div>
    </div>,
    document.body,
  );
}
