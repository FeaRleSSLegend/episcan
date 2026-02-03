import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface RedirectIfAuthenticatedProps {
  children: React.ReactNode;
}

/**
 * RedirectIfAuthenticated Component
 * ==================================
 *
 * Wrapper for public auth pages (login, signup) that redirects
 * authenticated users back to the dashboard.
 *
 * This prevents the "back button" issue where a logged-in user
 * can navigate back to the login/signup pages.
 */
const RedirectIfAuthenticated = ({ children }: RedirectIfAuthenticatedProps) => {
  const { user, role, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, redirect to appropriate dashboard
  if (user) {
    // Redirect admins to admin dashboard
    if (role === "admin") {
      return <Navigate to="/admin" replace />;
    }
    // Redirect health officers to their dashboard
    if (role === "health_officer") {
      return <Navigate to="/dashboard" replace />;
    }
    // Default redirect to main dashboard
    return <Navigate to="/dashboard" replace />;
  }

  // User is not authenticated, show the auth page
  return <>{children}</>;
};

export default RedirectIfAuthenticated;
