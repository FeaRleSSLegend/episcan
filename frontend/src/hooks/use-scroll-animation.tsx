import { useEffect, useRef, useState } from "react";

interface UseScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export const useScrollAnimation = ({
  threshold = 0.1,
  rootMargin = "0px 0px -50px 0px",
  triggerOnce = true,
}: UseScrollAnimationOptions = {}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce]);

  return { ref, isVisible };
};

// Wrapper component for animated sections
interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  animation?: "fade-up" | "fade-left" | "fade-right" | "scale" | "fade";
  delay?: number;
}

export const AnimatedSection = ({
  children,
  className = "",
  animation = "fade-up",
  delay = 0,
}: AnimatedSectionProps) => {
  const { ref, isVisible } = useScrollAnimation();

  const getAnimationClasses = () => {
    const baseClasses = "transition-all duration-700 ease-out";
    const delayStyle = delay ? `delay-[${delay}ms]` : "";

    if (!isVisible) {
      switch (animation) {
        case "fade-up":
          return `${baseClasses} opacity-0 translate-y-8`;
        case "fade-left":
          return `${baseClasses} opacity-0 -translate-x-8`;
        case "fade-right":
          return `${baseClasses} opacity-0 translate-x-8`;
        case "scale":
          return `${baseClasses} opacity-0 scale-95`;
        case "fade":
          return `${baseClasses} opacity-0`;
        default:
          return `${baseClasses} opacity-0 translate-y-8`;
      }
    }

    return `${baseClasses} opacity-100 translate-y-0 translate-x-0 scale-100 ${delayStyle}`;
  };

  return (
    <div
      ref={ref}
      className={`${getAnimationClasses()} ${className}`}
      style={{ transitionDelay: isVisible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
};

// Stagger children animations
interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

export const StaggerContainer = ({
  children,
  className = "",
  staggerDelay = 100,
}: StaggerContainerProps) => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <div ref={ref} className={className}>
      {Array.isArray(children)
        ? children.map((child, index) => (
            <div
              key={index}
              className={`transition-all duration-500 ease-out ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-6"
              }`}
              style={{
                transitionDelay: isVisible ? `${index * staggerDelay}ms` : "0ms",
              }}
            >
              {child}
            </div>
          ))
        : children}
    </div>
  );
};
