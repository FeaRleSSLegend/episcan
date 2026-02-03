import { Activity, Users, AlertTriangle, CheckCircle2, TrendingDown, Shield, Map, FileText, MessageSquare, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useHealthReports } from "@/hooks/useHealthReports";
import OutbreakAlerts from "@/components/OutbreakAlerts";
import HealthReportsFilter from "@/components/dashboard/HealthReportsFilter";
import { useEffect, useState } from "react";

const HealthOfficerDashboard = () => {
  const { profile } = useAuth();
  const {
    totalReportsToday,
    totalReportsYesterday,
    healthyPercentage,
    totalStudents,
    weeklyTrend,
    topSymptoms,
    locationBreakdown,
    loading,
    error
  } = useHealthReports();

  // Calculate percentage change from yesterday
  const calculateChange = (today: number, yesterday: number) => {
    if (yesterday === 0) return today > 0 ? "+100%" : "No change";
    const change = ((today - yesterday) / yesterday) * 100;
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}% from yesterday`;
  };

  // Calculate change type (positive/negative/neutral)
  const getChangeType = (today: number, yesterday: number): "positive" | "negative" | "neutral" => {
    if (today === yesterday) return "neutral";
    // For health reports, fewer is better (positive)
    return today < yesterday ? "positive" : "negative";
  };

  const stats = [
    {
      title: "Total Reports Today",
      value: loading ? "..." : totalReportsToday.toLocaleString(),
      change: loading ? "Loading..." : calculateChange(totalReportsToday, totalReportsYesterday),
      changeType: loading ? "neutral" as const : getChangeType(totalReportsToday, totalReportsYesterday),
      icon: <Activity className="h-6 w-6" />,
      iconColor: "bg-primary/10 text-primary",
    },
    {
      title: "Healthy Students",
      value: loading ? "..." : `${healthyPercentage}%`,
      change: loading ? "Loading..." : `${totalStudents - Math.round(totalStudents * (1 - healthyPercentage / 100))} reporting symptoms`,
      changeType: "positive" as const,
      icon: <CheckCircle2 className="h-6 w-6" />,
      iconColor: "bg-success/10 text-success",
    },
    {
      title: "Active Alerts",
      value: loading ? "..." : locationBreakdown.length.toString(),
      change: loading ? "Loading..." : `${locationBreakdown.length} locations with reports`,
      changeType: "neutral" as const,
      icon: <AlertTriangle className="h-6 w-6" />,
      iconColor: "bg-warning/10 text-warning",
    },
    {
      title: "Total Students",
      value: loading ? "..." : totalStudents.toLocaleString(),
      change: "Registered in system",
      changeType: "neutral" as const,
      icon: <Users className="h-6 w-6" />,
      iconColor: "bg-primary/10 text-primary",
    },
  ];

  // Use real location breakdown for recent alerts
  const recentAlerts = locationBreakdown.slice(0, 3).map((loc, idx) => ({
    id: idx,
    message: `${loc.count} health report${loc.count > 1 ? 's' : ''} from ${loc.location}`,
    time: "Today",
    severity: loc.count > 5 ? "medium" : "low"
  }));

  // Show loading state
  if (loading) {
    return (
      <DashboardLayout userRole="health_officer">
        <DashboardHeader
          title={`Health Officer Dashboard`}
          subtitle={`Welcome, ${profile?.full_name || "Officer"}`}
        />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading health data...</span>
        </div>
      </DashboardLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <DashboardLayout userRole="health_officer">
        <DashboardHeader
          title={`Health Officer Dashboard`}
          subtitle={`Welcome, ${profile?.full_name || "Officer"}`}
        />
        <div className="p-6">
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
            <AlertTriangle className="h-5 w-5 inline mr-2" />
            Error loading health data: {error}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="health_officer">
      <DashboardHeader
        title={`Health Officer Dashboard`}
        subtitle={`Welcome, ${profile?.full_name || "Officer"}`}
      />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <StatsCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* AI-Powered Outbreak Alerts - THE "WOW" MOMENT! */}
        <OutbreakAlerts />

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-4 gap-4">
          <Link to="/dashboard/officer-messages">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2 w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              <MessageSquare className="h-6 w-6" />
              <span>Student Messages</span>
            </Button>
          </Link>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2">
            <Map className="h-6 w-6" />
            <span>View Heatmaps</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2">
            <FileText className="h-6 w-6" />
            <span>Generate Report</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2">
            <AlertTriangle className="h-6 w-6" />
            <span>Manage Alerts</span>
          </Button>
        </div>

        {/* Charts and Tables */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Weekly Trend Chart */}
          <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-heading text-lg font-semibold text-foreground">Weekly Health Trend</h3>
                <p className="text-sm text-muted-foreground">Symptom reports over the past 7 days</p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <TrendingDown className="h-4 w-4 text-success" />
                <span className="text-success font-medium">12% decrease</span>
              </div>
            </div>
            
            {/* Chart */}
            <div className="h-64 flex items-end justify-between gap-3">
              {weeklyTrend.map((item, i) => {
                const maxValue = Math.max(...weeklyTrend.map(d => d.count), 1);
                const normalizedValue = (item.count / maxValue) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex flex-col items-center">
                      <span className="text-xs text-muted-foreground mb-1">{item.count}</span>
                      <div
                        className="w-full bg-primary/20 rounded-t-md relative overflow-hidden"
                        style={{ height: `${Math.max(normalizedValue * 1.5, 20)}px` }}
                      >
                        <div
                          className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-md transition-all duration-500"
                          style={{ height: `${Math.max(normalizedValue * 1.5, 20)}px` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">{item.date}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Symptoms */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-heading text-lg font-semibold text-foreground mb-6">Top Symptoms</h3>
            <div className="space-y-4">
              {topSymptoms.length > 0 ? (
                topSymptoms.map((symptom) => (
                  <div key={symptom.symptom}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-foreground">{symptom.symptom}</span>
                      <span className="text-sm text-muted-foreground">{symptom.count}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${symptom.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No symptoms reported in the last 7 days
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-heading text-lg font-semibold text-foreground">Recent Alerts</h3>
            <Button variant="ghost" size="sm">View all</Button>
          </div>
          <div className="space-y-4">
            {recentAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  alert.severity === "medium" ? "bg-warning" :
                  alert.severity === "low" ? "bg-success" : "bg-primary"
                }`} />
                <div className="flex-1">
                  <p className="text-foreground">{alert.message}</p>
                  <p className="text-sm text-muted-foreground mt-1">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Health Reports with Filtering */}
        <HealthReportsFilter title="Health Reports (Filterable)" showUserInfo={true} />
      </div>
    </DashboardLayout>
  );
};

export default HealthOfficerDashboard;
