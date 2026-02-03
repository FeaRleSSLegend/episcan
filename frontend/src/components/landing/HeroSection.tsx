import { Link } from "react-router-dom";
import { ArrowRight, Stethoscope, Users, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedSection } from "@/hooks/use-scroll-animation";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-24 lg:pt-20 pb-12 bg-gradient-hero overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/30 rounded-full blur-3xl" />
      </div>

      <div className="container relative z-10 px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            <AnimatedSection animation="fade-up">
              <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-4 sm:mb-6">
                Early Health Detection for{" "}
                <span className="text-gradient">Safer Schools</span>
              </h1>
            </AnimatedSection>

            <AnimatedSection animation="fade-up" delay={100}>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed mb-6 sm:mb-8 max-w-xl mx-auto lg:mx-0">
                EPISCAN empowers schools with real-time health monitoring, outbreak detection, and actionable insights to keep students, staff, and communities safe.
              </p>
            </AnimatedSection>

            <AnimatedSection animation="fade-up" delay={200}>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                <Button variant="hero" size="xl" asChild>
                  <Link to="/signup">
                    Start Free Trial
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Link>
                </Button>
                <Button variant="hero-outline" size="xl" asChild>
                  <Link to="#how-it-works">
                    Watch Demo
                  </Link>
                </Button>
              </div>
            </AnimatedSection>

            {/* Trust Badges */}
            <AnimatedSection animation="fade" delay={300}>
              <div className="mt-10 sm:mt-12 pt-6 sm:pt-8 border-t border-border/50">
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">Trusted by leading institutions</p>
                <div className="flex items-center justify-center lg:justify-start gap-4 sm:gap-8 opacity-60 flex-wrap">
                  <div className="font-heading font-semibold text-foreground text-sm sm:text-base">University of Lagos</div>
                  <div className="font-heading font-semibold text-foreground text-sm sm:text-base">FGGC Benin</div>
                  <div className="font-heading font-semibold text-foreground text-sm sm:text-base hidden sm:block">Kings College</div>
                </div>
              </div>
            </AnimatedSection>
          </div>

          {/* Hero Visual - Simplified Dashboard */}
          <AnimatedSection animation="fade-left" delay={200} className="relative w-full max-w-md mx-auto lg:max-w-none">
            <div className="relative bg-gradient-card rounded-2xl sm:rounded-3xl shadow-xl border border-border/50 p-4 sm:p-6 lg:p-8 backdrop-blur-sm">
              {/* Dashboard Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Today's Overview</p>
                  <h3 className="font-heading text-lg sm:text-xl lg:text-2xl font-bold text-foreground">Health Dashboard</h3>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-success/10 text-success rounded-full text-xs sm:text-sm font-medium">
                  <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                  All Clear
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-background/80 rounded-xl p-3 sm:p-4 border border-border/50">
                  <Stethoscope className="h-5 w-5 text-primary mb-2" strokeWidth={1.5} />
                  <p className="text-xl sm:text-2xl font-bold text-foreground">1,247</p>
                  <p className="text-xs text-muted-foreground">Reports Today</p>
                </div>
                <div className="bg-background/80 rounded-xl p-3 sm:p-4 border border-border/50">
                  <Users className="h-5 w-5 text-primary mb-2" strokeWidth={1.5} />
                  <p className="text-xl sm:text-2xl font-bold text-foreground">98.5%</p>
                  <p className="text-xs text-muted-foreground">Healthy</p>
                </div>
                <div className="bg-background/80 rounded-xl p-3 sm:p-4 border border-border/50">
                  <CheckCircle2 className="h-5 w-5 text-success mb-2" strokeWidth={1.5} />
                  <p className="text-xl sm:text-2xl font-bold text-foreground">0</p>
                  <p className="text-xs text-muted-foreground">Outbreaks</p>
                </div>
              </div>

              {/* Weekly Trend Chart */}
              <div className="bg-background/80 rounded-xl p-4 border border-border/50">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-foreground">Weekly Trend</p>
                  <span className="text-xs text-success font-medium">↓ 12% symptoms</span>
                </div>
                <div className="flex items-end justify-between h-16 gap-2">
                  {[40, 55, 35, 60, 45, 30, 25].map((height, i) => (
                    <div key={i} className="flex-1 flex flex-col gap-0.5">
                      <div 
                        className="bg-primary/30 rounded-t-sm relative overflow-hidden"
                        style={{ height: `${height}%` }}
                      >
                        <div 
                          className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-sm"
                          style={{ height: `${height * 0.7}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
                    <span key={day}>{day}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating Status Badge */}
            <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 bg-background/95 backdrop-blur-sm rounded-xl shadow-lg border border-border/50 p-3 animate-float">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-success to-success/60 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-primary-foreground" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">All Clear</p>
                  <p className="text-xs text-muted-foreground">No outbreaks detected</p>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
