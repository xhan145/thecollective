/** Decorative drifting aurora backdrop (see globals.css ambient layer).
 *  Host must be position:relative; put content in a `relative z-[1]` wrap.
 *  Motion is gated by prefers-reduced-motion AND html[data-motion]. */
export default function AmbientBackdrop() {
  return <div aria-hidden className="ambient-aurora" />;
}
