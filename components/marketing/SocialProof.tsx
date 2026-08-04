import Section from "./Section";
import { SHOW_METRICS, SHOW_TESTIMONIALS } from "@/lib/marketing/content";

export default function SocialProof() {
  if (!SHOW_METRICS && !SHOW_TESTIMONIALS) return null; // no fabricated proof
  return (
    <Section bg="cream">
      <h2 className="text-center font-display text-title text-content lg:text-display">From the beta</h2>
      {/* Real metrics/testimonials render here once the flags + data are set. */}
    </Section>
  );
}
