import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import RolesSection from "@/components/landing/RolesSection";
import CTASection from "@/components/landing/CTASection";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <RolesSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
