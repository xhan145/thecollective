import MarketingNav from "@/components/marketing/MarketingNav";
import Hero from "@/components/marketing/Hero";
import TryThisFirst from "@/components/marketing/TryThisFirst";
import ProductShowcase from "@/components/marketing/ProductShowcase";
import PracticeExamples from "@/components/marketing/PracticeExamples";
import FeedbackExplainer from "@/components/marketing/FeedbackExplainer";
import TrustExplainer from "@/components/marketing/TrustExplainer";
import AiSection from "@/components/marketing/AiSection";
import NotEndlessFeed from "@/components/marketing/NotEndlessFeed";
import MissionBand from "@/components/marketing/MissionBand";
import SocialProof from "@/components/marketing/SocialProof";
import FounderStory from "@/components/marketing/FounderStory";
import VisionSection from "@/components/marketing/VisionSection";
import BetaCta from "@/components/marketing/BetaCta";
import MarketingFooter from "@/components/marketing/MarketingFooter";

export default function LandingPage() {
  return (
    <main className="w-full bg-[#FFF8EE] text-[#111111]">
      <MarketingNav />
      {/* Concrete-first: hero action → try a real rep → see the loop → focus, then explainers. */}
      <Hero />
      <TryThisFirst />
      <ProductShowcase />
      <PracticeExamples />
      <FeedbackExplainer />
      <TrustExplainer />
      <AiSection />
      <NotEndlessFeed />
      <MissionBand />
      <SocialProof />
      <FounderStory />
      <VisionSection />
      <BetaCta />
      <MarketingFooter />
    </main>
  );
}
