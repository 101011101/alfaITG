// ⚠️ TEMPORARY DIAGNOSTIC — remove once each section is fixed + signed off.
// Each "wrong" section gets one bright neon, so it's unmistakable which is which.
// To remove the whole system later: delete this file + every <NeonTag .../> usage.

export const NEON = {
  hero: "#ff00e6", // magenta
  robot: "#00f0ff", // cyan
  products: "#39ff14", // green
  proof: "#faff00", // yellow
  contact: "#ff5e00", // orange
  banner: "#b026ff", // violet
} as const;

export function NeonTag({ color, label }: { color: string; label: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[60]" aria-hidden>
      {/* neon inner ring + glow framing the broken section */}
      <div
        className="absolute inset-0"
        style={{ boxShadow: `inset 0 0 0 3px ${color}, inset 0 0 60px ${color}55` }}
      />
      {/* corner badge naming the lens */}
      <span
        className="absolute left-3 top-3 rounded px-2 py-1 text-[11px] font-extrabold tracking-[0.2em] text-black"
        style={{ background: color, boxShadow: `0 0 14px ${color}` }}
      >
        {label}
      </span>
    </div>
  );
}
