import { Link } from "react-router-dom";
import { ArrowRight, Lock, Clock, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedSection, StaggerContainer } from "@/hooks/use-scroll-animation";

const CTASection = () => {
  return (
    <section id="contact" className="py-16 md:py-24 lg:py-32 bg-foreground relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-secondary rounded-full blur-3xl" />
      </div>

      <div className="container relative z-10 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <AnimatedSection animation="fade-up">
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-background mb-4 sm:mb-6">
              Ready to Protect Your School Community?
            </h2>
          </AnimatedSection>
          
          <AnimatedSection animation="fade-up" delay={100}>
            <p className="text-sm sm:text-base lg:text-lg text-background/70 mb-8 sm:mb-10 max-w-2xl mx-auto px-2">
              Join hundreds of schools already using EPISCAN to detect health issues early and keep students safe. Start your free trial today.
            </p>
          </AnimatedSection>

          <AnimatedSection animation="fade-up" delay={200}>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-10 sm:mb-12">
              <Button 
                size="xl" 
                className="bg-background text-foreground hover:bg-background/90 shadow-xl" 
                asChild
              >
                <Link to="/signup">
                  Start Free Trial
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="xl" 
                className="border-background/50 text-background bg-transparent hover:bg-background/10 hover:text-background"
                asChild
              >
                <Link to="#contact" className="text-background">Schedule a Demo</Link>
              </Button>
            </div>
          </AnimatedSection>

          {/* Trust Points */}
          <StaggerContainer 
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 pt-8 sm:pt-10 border-t border-background/10"
            staggerDelay={150}
          >
            <div className="flex flex-col items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full bg-background/10 flex items-center justify-center">
                <Lock className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-background" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-heading font-semibold text-background text-sm sm:text-base">HIPAA Compliant</p>
                <p className="text-xs sm:text-sm text-background/60">Secure & private data</p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full bg-background/10 flex items-center justify-center">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-background" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-heading font-semibold text-background text-sm sm:text-base">24/7 Monitoring</p>
                <p className="text-xs sm:text-sm text-background/60">Always watching</p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full bg-background/10 flex items-center justify-center">
                <Headphones className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-background" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-heading font-semibold text-background text-sm sm:text-base">Dedicated Support</p>
                <p className="text-xs sm:text-sm text-background/60">Help when you need it</p>
              </div>
            </div>
          </StaggerContainer>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
