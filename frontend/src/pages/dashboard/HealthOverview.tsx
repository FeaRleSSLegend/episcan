import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Users, AlertTriangle, TrendingUp, Heart, Thermometer } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const HealthOverview = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["health-overview-stats"],
    queryFn: async () => {
      const [reportsResult, usersResult, alertsResult] = await Promise.all([
        supabase.from("symptom_reports").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("symptom_reports").select("*", { count: "exact", head: true }).gte("severity", "moderate"),
      ]);

      return {
        totalReports: reportsResult.count || 0,
        totalUsers: usersResult.count || 0,
        activeAlerts: alertsResult.count || 0,
      };
    },
  });

  const { data: recentReports } = useQuery({
    queryKey: ["recent-symptom-reports"],
    queryFn: async () => {
      const { data } = await supabase
        .from("symptom_reports")
        .select("*, profiles(full_name)")
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const statCards = [
    {
      title: "Total Check-ins",
      value: stats?.totalReports || 0,
      description: "All time health reports",
      icon: Activity,
      color: "text-primary",
    },
    {
      title: "Registered Users",
      value: stats?.totalUsers || 0,
      description: "Active platform users",
      icon: Users,
      color: "text-green-500",
    },
    {
      title: "Active Alerts",
      value: stats?.activeAlerts || 0,
      description: "Requiring attention",
      icon: AlertTriangle,
      color: "text-amber-500",
    },
    {
      title: "Health Score",
      value: "92%",
      description: "Overall school health",
      icon: Heart,
      color: "text-rose-500",
    },
  ];

  return (
    <DashboardLayout>
      <DashboardHeader
        title="Health Overview"
        subtitle="Monitor overall health status across the institution"
      />

      <div className="p-4 lg:p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? "..." : stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Health Trends
              </CardTitle>
              <CardDescription>Weekly symptom report trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <p>Chart visualization coming soon</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Thermometer className="h-5 w-5 text-amber-500" />
                Recent Reports
              </CardTitle>
              <CardDescription>Latest symptom check-ins</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentReports && recentReports.length > 0 ? (
                  recentReports.map((report: any) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <div>
                        <p className="font-medium text-sm">
                          {report.profiles?.full_name || "Anonymous"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Severity: {report.severity}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(report.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No recent reports</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Symptom Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Symptom Distribution</CardTitle>
            <CardDescription>Most commonly reported symptoms this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {["Fever", "Cough", "Headache", "Fatigue"].map((symptom) => (
                <div key={symptom} className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-primary">--</p>
                  <p className="text-sm text-muted-foreground">{symptom}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default HealthOverview;
