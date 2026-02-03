import { useAuth } from "@/hooks/useAuth";
import StudentDashboard from "./dashboard/StudentDashboard";
import ParentDashboard from "./dashboard/ParentDashboard";
import HealthOfficerDashboard from "./dashboard/HealthOfficerDashboard";
import AdminDashboard from "./dashboard/AdminDashboard";
import { Loader2 } from "lucide-react";

const Dashboard = () => {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  switch (role) {
    case "student":
      return <StudentDashboard />;
    case "parent":
      return <ParentDashboard />;
    case "health_officer":
      return <HealthOfficerDashboard />;
    case "admin":
      return <AdminDashboard />;
    default:
      // Default to student dashboard if no role found
      return <StudentDashboard />;
  }
};

export default Dashboard;
