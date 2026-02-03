import { Activity, Heart, Bell, CheckCircle2, Lightbulb, Plus, MessageSquare, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import RecentCheckins from "@/components/dashboard/RecentCheckins";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useStudentStats } from "@/hooks/useStudentStats";

const StudentDashboard = () => {
  const { profile, user } = useAuth();

  // ✅ REPLACED MOCK DATA WITH REAL SUPABASE QUERIES
  const {
    weeklyCheckins,
    currentHealth,
    healthDescription,
    activeAlerts,
    activeAlertDetails,
    streak,
    loading,
    error,
    lastCheckinTime
  } = useStudentStats(user?.id);

  // Determine health icon color based on current health
  const getHealthColor = () => {
    switch (currentHealth) {
      case 'Good':
        return 'bg-success/10 text-success';
      case 'Mild Symptoms':
        return 'bg-warning/10 text-warning';
      case 'Moderate':
        return 'bg-orange-500/10 text-orange-500';
      case 'Severe':
        return 'bg-destructive/10 text-destructive';
      case 'Pending Check-in':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-primary/10 text-primary';
    }
  };

  const getHealthChangeType = (): "positive" | "negative" | "neutral" => {
    if (currentHealth === 'Good') return 'positive';
    if (currentHealth === 'Severe' || currentHealth === 'Moderate') return 'negative';
    if (currentHealth === 'Pending Check-in') return 'neutral';
    return 'neutral';
  };

  // Get alert display text
  const getAlertDisplayText = () => {
    if (loading) return 'Loading...';
    if (activeAlerts === 0) return 'No active alerts';
    if (activeAlertDetails.length > 0) {
      return activeAlertDetails[0].title;
    }
    return 'Check your location';
  };

  const stats = [
    {
      title: "Check-ins This Week",
      value: loading ? "..." : weeklyCheckins.toString(),
      change: loading ? "Loading..." : weeklyCheckins >= 5 ? "Great progress!" : "Keep going!",
      changeType: "positive" as const,
      icon: <CheckCircle2 className="h-6 w-6" />,
      iconColor: "bg-success/10 text-success",
    },
    {
      title: "Current Health",
      value: loading ? "..." : currentHealth,
      change: loading ? "Loading..." : healthDescription,
      changeType: loading ? "neutral" as const : getHealthChangeType(),
      icon: <Heart className="h-6 w-6" />,
      iconColor: loading ? "bg-primary/10 text-primary" : getHealthColor(),
    },
    {
      title: "Active Alerts",
      value: loading ? "..." : activeAlerts === 0 ? "None" : activeAlerts.toString(),
      change: getAlertDisplayText(),
      changeType: activeAlerts > 0 ? "negative" as const : "positive" as const,
      icon: <Bell className="h-6 w-6" />,
      iconColor: activeAlerts > 0 ? "bg-warning/10 text-warning" : "bg-success/10 text-success",
    },
    {
      title: "Streak",
      value: loading ? "..." : streak > 0 ? `${streak} day${streak > 1 ? 's' : ''}` : "Start today!",
      change: loading ? "Loading..." : streak > 0 ? "Keep it up!" : "Submit your first check-in",
      changeType: "positive" as const,
      icon: <Activity className="h-6 w-6" />,
      iconColor: "bg-warning/10 text-warning",
    },
  ];


  const healthTips = [
    "Stay hydrated - drink at least 8 glasses of water daily",
    "Get 8 hours of sleep for optimal health",
    "Wash hands frequently to prevent illness",
  ];

  return (
    <DashboardLayout userRole="student">
      <DashboardHeader 
        title={`Welcome, ${profile?.full_name || "Student"}!`}
        subtitle="Your personal health dashboard" 
      />
      
      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-gradient-primary rounded-xl p-4 sm:p-6 text-primary-foreground">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="font-heading text-lg sm:text-xl font-bold mb-1 sm:mb-2">Daily Health Check-in</h2>
                <p className="text-primary-foreground/80 text-sm sm:text-base">
                  Complete your daily check-in to stay healthy.
                </p>
              </div>
              <Link to="/dashboard/checkin" className="flex-shrink-0">
                <Button variant="secondary" size="default" className="gap-2 w-full sm:w-auto">
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-base">Check In</span>
                </Button>
              </Link>
            </div>
          </div>

          <div className="bg-card border border-primary/20 rounded-xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="font-heading text-lg sm:text-xl font-bold mb-1 sm:mb-2 text-foreground">Anonymous Message</h2>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Share health concerns confidentially.
                </p>
              </div>
              <Link to="/dashboard/messages" className="flex-shrink-0">
                <Button variant="outline" size="default" className="gap-2 w-full sm:w-auto border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                  <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-base">Send</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {stats.map((stat) => (
            <StatsCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Recent Check-ins - Now using real data */}
          <RecentCheckins />

          {/* Health Tips */}
          <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="font-heading text-base sm:text-lg font-semibold text-foreground">Health Tips</h3>
              <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
            </div>
            <div className="space-y-2 sm:space-y-4">
              {healthTips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/50 rounded-lg">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary text-xs sm:text-sm font-bold">{i + 1}</span>
                  </div>
                  <p className="text-foreground text-sm sm:text-base">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Need Help Button */}
      <Link 
        to="/dashboard/messages" 
        className="fixed bottom-6 right-6 z-50 group"
      >
        <Button 
          size="lg" 
          className="rounded-full shadow-lg gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground px-6 py-6 transition-all duration-300 hover:scale-105"
        >
          <MessageSquare className="h-5 w-5" />
          <span className="font-medium">Need Help?</span>
        </Button>
      </Link>
    </DashboardLayout>
  );
};

export default StudentDashboard;