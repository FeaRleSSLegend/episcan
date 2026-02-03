import { Link } from "react-router-dom";
import { Backpack, Baby, BookOpen, Stethoscope, Cog, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedSection, StaggerContainer } from "@/hooks/use-scroll-animation";

interface Role {
  icon: LucideIcon;
  title: string;
  description: string;
  features: string[];
  color: string;
  iconColor: string;
}

const roles: Role[] = [
  {
    icon: Backpack,
    title: "Students",
    description: "Quick daily health check-ins, receive alerts, and access preventive health tips.",
    features: ["30-second daily reports", "Real-time alerts", "Health tips & guidance"],
    color: "bg-gradient-to-br from-primary to-primary/70",
    iconColor: "text-primary-foreground",
  },
  {
    icon: Baby,
    title: "Parents",
    description: "Monitor your child's health reports and receive instant outbreak notifications.",
    features: ["Child health tracking", "Push notifications", "School heatmaps"],
    color: "bg-gradient-to-br from-success to-success/70",
    iconColor: "text-primary-foreground",
  },
  {
    icon: BookOpen,
    title: "Teachers",
    description: "Track classroom health trends and report observed symptoms.",
    features: ["Class health dashboard", "Symptom reporting", "Trend analysis"],
    color: "bg-gradient-to-br from-warning to-warning/70",
    iconColor: "text-primary-foreground",
  },
  {
    icon: Stethoscope,
    title: "Health Officers",
    description: "Full dashboard access with heatmaps, analytics, and intervention tools.",
    features: ["Real-time monitoring", "Outbreak detection", "Report generation"],
    color: "bg-gradient-to-br from-destructive to-destructive/70",
    iconColor: "text-primary-foreground",
  },
  {
    icon: Cog,
    title: "Administrators",
    description: "Manage users, configure alerts, and access comprehensive analytics.",
    features: ["User management", "System configuration", "Compliance reports"],
    color: "bg-gradient-to-br from-secondary to-secondary/70",
    iconColor: "text-secondary-foreground",
  },
];

const RolesSection = () => {
  return (
    <section id="for-schools" className="py-16 md:py-24 lg:py-32 bg-background">
      <div className="container px-4 sm:px-6">
        {/* Section Header */}
        <AnimatedSection animation="fade-up" className="text-center max-w-3xl mx-auto mb-10 md:mb-16">
          <span className="inline-block px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-3 sm:mb-4">
            For Everyone
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 sm:mb-6">
            Designed for{" "}
            <span className="text-gradient">Every Role</span>
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground px-2">
            Whether you're a student, parent, teacher, or administrator, EPISCAN provides tailored experiences for everyone in your school community.
          </p>
        </AnimatedSection>

        {/* Roles Grid */}
        <StaggerContainer 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-10 sm:mb-12"
          staggerDelay={100}
        >
          {roles.map((role, index) => (
            <div
              key={role.title}
              className={`group relative bg-gradient-card rounded-xl sm:rounded-2xl border border-border/50 p-4 sm:p-6 hover:shadow-xl hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 ${
                index === 4 ? "lg:col-start-2" : ""
              }`}
            >
              {/* Icon */}
              <div className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-lg sm:rounded-xl ${role.color} flex items-center justify-center mb-3 sm:mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <role.icon className={`h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 ${role.iconColor}`} strokeWidth={1.5} />
              </div>
              
              <h3 className="font-heading text-lg sm:text-xl font-semibold text-foreground mb-1.5 sm:mb-2">
                {role.title}
              </h3>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4">
                {role.description}
              </p>
              <ul className="space-y-1.5 sm:space-y-2">
                {role.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-xs sm:text-sm text-foreground">
                    <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-primary flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </StaggerContainer>

        {/* CTA */}
        <AnimatedSection animation="fade-up" className="text-center">
          <Button variant="hero" size="lg" asChild>
            <Link to="/signup">Get Started Free</Link>
          </Button>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default RolesSection;
