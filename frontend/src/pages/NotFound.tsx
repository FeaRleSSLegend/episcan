import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import BackButton from "@/components/ui/back-button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-muted">
      <div className="container px-4 sm:px-6">
        <div className="pt-6">
          <BackButton fallbackPath="/" />
        </div>
        <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center">
          <div className="text-center px-4">
            <h1 className="mb-4 text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground">404</h1>
            <p className="mb-6 text-lg sm:text-xl text-muted-foreground">Oops! Page not found</p>
            <a href="/" className="text-primary font-medium underline hover:text-primary/90">
              Return to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
