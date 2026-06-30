import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { MarqueeSection } from "@/components/landing/MarqueeSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { CtaSection } from "@/components/landing/CtaSection";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0f0f11] font-sans text-white selection:bg-emerald-500/30">
      <Navbar />
      <HeroSection />
      <MarqueeSection />
      <PricingSection />
      <HowItWorksSection />
      <FaqSection />
      <CtaSection />
      <Footer />
    </div>
  );
}

