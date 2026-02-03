import { 
  Stethoscope, 
  Siren, 
  PieChart, 
  School, 
  Lock, 
  Tablet,
  Globe2,
  MessageCircle,
  type LucideIcon
} from "lucide-react";
import { AnimatedSection, StaggerContainer } from "@/hooks/use-scroll-animation";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
}

const features: Feature[] = [
  {
    icon: Stethoscope,
    title: "Real-Time Health Monitoring",
    description: "Track student and staff health reports in real-time with our intuitive dashboard.",
    gradient: "from-primary to-primary/60",
  },
  {
    icon: Siren,
    title: "Instant Outbreak Alerts",
    description: "Get notified immediately when potential outbreaks are detected in your school.",
    gradient: "from-destructive to-destructive/60",
  },
  {
    icon: PieChart,
    title: "Advanced Analytics",
    description: "Comprehensive analytics and trend analysis to make data-driven health decisions.",
    gradient: "from-success to-success/60",
  },
  {
    icon: School,
    title: "Multi-Role Access",
    description: "Separate portals for students, parents, teachers, health officers, and admins.",
    gradient: "from-warning to-warning/60",
  },
  {
    icon: Lock,
    title: "Privacy First",
    description: "HIPAA-compliant data handling with anonymized reporting and secure storage.",
    gradient: "from-secondary to-secondary/60",
  },
  {
    icon: Tablet,
    title: "Mobile-First Design",
    description: "Easy daily health check-ins from any device with our responsive interface.",
    gradient: "from-primary to-primary/60",
  },
  {
    icon: MessageCircle,
    title: "Anonymous Messaging",
    description: "Students can privately reach health officers with sensitive health concerns while staying anonymous.",
    gradient: "from-destructive to-destructive/60",
  },
  {
    icon: Globe2,
    title: "Interactive Heatmaps",
    description: "Visualize health trends across classrooms and hostels with dynamic heatmaps.",
    gradient: "from-success to-success/60",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-16 md:py-24 lg:py-32 bg-background">
      <div className="container px-4 sm:px-6">
        {/* Section Header */}
        <AnimatedSection animation="fade-up" className="text-center max-w-3xl mx-auto mb-10 md:mb-16">
          <span className="inline-block px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-3 sm:mb-4">
            Features
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 sm:mb-6">
            Everything You Need for{" "}
            <span className="text-gradient">School Health Safety</span>
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground px-2">
            EPISCAN provides a comprehensive suite of tools to monitor, detect, and respond to health concerns across your entire campus.
          </p>
        </AnimatedSection>

        {/* Features Grid */}
        <StaggerContainer 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8"
          staggerDelay={100}
        >
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative bg-gradient-card rounded-xl sm:rounded-2xl border border-border/50 p-4 sm:p-6 hover:shadow-xl hover:border-primary/30 transition-all duration-300 hover:-translate-y-1"
            >
              {/* Icon Container */}
              <div className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-3 sm:mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-primary-foreground" strokeWidth={1.5} />
              </div>
              
              <h3 className="font-heading text-base sm:text-lg font-semibold text-foreground mb-1.5 sm:mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
};

export default FeaturesSection;
