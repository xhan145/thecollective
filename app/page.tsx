import MarketingNav from "@/components/marketing/MarketingNav";
import Hero from "@/components/marketing/Hero";
import MissionBand from "@/components/marketing/MissionBand";
import LoopShowcase from "@/components/marketing/LoopShowcase";
import ProductShowcase from "@/components/marketing/ProductShowcase";
import PracticeExamples from "@/components/marketing/PracticeExamples";
import TrustExplainer from "@/components/marketing/TrustExplainer";
import AiSection from "@/components/marketing/AiSection";
import SocialProof from "@/components/marketing/SocialProof";
import VisionSection from "@/components/marketing/VisionSection";
import FounderStory from "@/components/marketing/FounderStory";
import BetaCta from "@/components/marketing/BetaCta";
import MarketingFooter from "@/components/marketing/MarketingFooter";

export default function LandingPage() {
  return (
    <main className="w-full bg-[#FFF8EE] text-[#111111]">
      <MarketingNav />
      <Hero />
      <MissionBand />
      <LoopShowcase />
      <ProductShowcase />
      <PracticeExamples />
      <TrustExplainer />
      <AiSection />
      <SocialProof />
      <VisionSection />
      <FounderStory />
      <BetaCta />
      <MarketingFooter />
    </main>
  );
}
