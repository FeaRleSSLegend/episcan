import { CircleCheckBig, Clipboard, Microscope, Bell, BarChart3, type LucideIcon } from "lucide-react";
import { AnimatedSection } from "@/hooks/use-scroll-animation";
import stepCheckin from "@/assets/step-checkin.png";
import stepAnalysis from "@/assets/step-analysis.png";
import stepAlerts from "@/assets/step-alerts.png";
import stepReports from "@/assets/step-reports.png";

interface Step {
  number: string;
  title: string;
  description: string;
  points: string[];
  icon: LucideIcon;
  gradient: string;
  image: string;
}

const steps: Step[] = [
  {
    number: "01",
    title: "Daily Health Check-ins",
    description: "Students and staff complete quick daily health reports via mobile or web. Simple checkboxes for symptoms, optional temperature logging.",
    points: [
      "Takes less than 30 seconds",
      "Works on any device",
      "Optional voice input for accessibility",
    ],
    icon: Clipboard,
    gradient: "from-primary to-primary/60",
    image: stepCheckin,
  },
  {
    number: "02",
    title: "AI-Powered Analysis",
    description: "Our system analyzes reports in real-time, detecting patterns and potential outbreak clusters before they spread.",
    points: [
      "Pattern recognition algorithms",
      "Geographic clustering detection",
      "Historical trend comparison",
    ],
    icon: Microscope,
    gradient: "from-success to-success/60",
    image: stepAnalysis,
  },
  {
    number: "03",
    title: "Instant Alerts & Actions",
    description: "Health officers and admins receive immediate notifications with recommended actions and response protocols.",
    points: [
      "Push notifications & SMS",
      "Customizable alert thresholds",
      "Action recommendation engine",
    ],
    icon: Bell,
    gradient: "from-warning to-warning/60",
    image: stepAlerts,
  },
  {
    number: "04",
    title: "Track & Report",
    description: "Monitor intervention effectiveness, generate compliance reports, and share anonymized data with public health authorities.",
    points: [
      "Automated reporting",
      "Compliance documentation",
      "Public health integration",
    ],
    icon: BarChart3,
    gradient: "from-destructive to-destructive/60",
    image: stepReports,
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-16 md:py-24 lg:py-32 bg-muted/30">
      <div className="container px-4 sm:px-6">
        {/* Section Header */}
        <AnimatedSection animation="fade-up" className="text-center max-w-3xl mx-auto mb-10 md:mb-16">
          <span className="inline-block px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-3 sm:mb-4">
            How It Works
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 sm:mb-6">
            Simple Steps to{" "}
            <span className="text-gradient">Safer Schools</span>
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground px-2">
            From daily check-ins to outbreak prevention, see how EPISCAN keeps your school community healthy.
          </p>
        </AnimatedSection>

        {/* Steps */}
        <div className="space-y-8 md:space-y-12 lg:space-y-20">
          {steps.map((step, index) => (
            <AnimatedSection
              key={step.number}
              animation={index % 2 === 0 ? "fade-right" : "fade-left"}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-16 items-center ${
                index % 2 === 1 ? "lg:grid-flow-dense" : ""
              }`}
            >
              {/* Content */}
              <div className={index % 2 === 1 ? "lg:col-start-2" : ""}>
                <span className="inline-block font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-primary/20 mb-2 sm:mb-4">
                  {step.number}
                </span>
                <h3 className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-3 sm:mb-4">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm sm:text-base lg:text-lg leading-relaxed mb-4 sm:mb-6">
                  {step.description}
                </p>
                <ul className="space-y-2 sm:space-y-3">
                  {step.points.map((point) => (
                    <li key={point} className="flex items-center gap-2 sm:gap-3">
                      <CircleCheckBig className="h-4 w-4 sm:h-5 sm:w-5 text-success flex-shrink-0" strokeWidth={2} />
                      <span className="text-foreground text-sm sm:text-base">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Visual with Image */}
              <div className={index % 2 === 1 ? "lg:col-start-1 lg:row-start-1" : ""}>
                <div className="bg-gradient-card rounded-xl sm:rounded-2xl border border-border/50 p-3 sm:p-4 lg:p-6 shadow-lg overflow-hidden">
                  <img 
                    src={step.image} 
                    alt={step.title}
                    className="w-full h-auto rounded-lg sm:rounded-xl object-cover aspect-video"
                  />
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
