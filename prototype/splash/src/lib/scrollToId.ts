// Single smooth-scroll-to-beat helper, shared by the header/nav, the hero CTAs and
// the rail's "use the contact form" link. Consolidated so every jump uses the same
// scrollIntoView options (smooth, aligned to the top of the target beat).
export function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}
