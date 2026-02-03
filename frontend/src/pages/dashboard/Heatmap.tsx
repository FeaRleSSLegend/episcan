import { useState, useEffect } from "react";
import { MapPin, AlertTriangle, Users, Thermometer, Activity, Loader2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatSymptom } from "@/lib/formatters";

interface LocationData {
  location: string;
  totalReports: number;
  reportsToday: number;
  avgTemperature: number;
  symptomCounts: { [symptom: string]: number };
  riskLevel: "low" | "medium" | "high" | "critical";
  affectedStudents: number;
}

const LOCATION_COLORS: { [key: string]: string } = {
  low: "bg-success/20 border-success/50",
  medium: "bg-warning/20 border-warning/50",
  high: "bg-orange-500/20 border-orange-500/50",
  critical: "bg-destructive/20 border-destructive/50",
};

const RISK_BADGES: { [key: string]: string } = {
  low: "bg-success/10 text-success",
  medium: "bg-warning/10 text-warning",
  high: "bg-orange-500/10 text-orange-500",
  critical: "bg-destructive/10 text-destructive",
};

const calculateRiskLevel = (data: LocationData): "low" | "medium" | "high" | "critical" => {
  const { reportsToday, avgTemperature, symptomCounts } = data;
  const totalSymptoms = Object.values(symptomCounts).reduce((a, b) => a + b, 0);

  // Critical: 10+ reports today or avg temp >= 39
  if (reportsToday >= 10 || avgTemperature >= 39) return "critical";
  // High: 5+ reports today or avg temp >= 38.5 or 15+ total symptoms
  if (reportsToday >= 5 || avgTemperature >= 38.5 || totalSymptoms >= 15) return "high";
  // Medium: 3+ reports today or avg temp >= 38
  if (reportsToday >= 3 || avgTemperature >= 38) return "medium";
  // Low: Everything else
  return "low";
};

const Heatmap = () => {
  const { role } = useAuth();
  const [locationData, setLocationData] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);

  useEffect(() => {
    const fetchHeatmapData = async () => {
      try {
        setLoading(true);

        // Fetch reports from last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const { data: reports, error } = await supabase
          .from("health_reports")
          .select("*")
          .gte("created_at", sevenDaysAgo.toISOString())
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Group by location
        const locationMap: { [loc: string]: any[] } = {};
        (reports || []).forEach((report: any) => {
          if (!locationMap[report.location]) {
            locationMap[report.location] = [];
          }
          locationMap[report.location].push(report);
        });

        // Calculate stats for each location
        const locationStats: LocationData[] = Object.entries(locationMap).map(([location, locReports]) => {
          const reportsToday = locReports.filter(
            (r) => new Date(r.created_at) >= todayStart
          ).length;

          const temps = locReports
            .filter((r) => r.temperature)
            .map((r) => r.temperature);
          const avgTemperature = temps.length > 0
            ? temps.reduce((a, b) => a + b, 0) / temps.length
            : 0;

          const symptomCounts: { [symptom: string]: number } = {};
          locReports.forEach((r) => {
            (r.symptoms || []).forEach((s: string) => {
              symptomCounts[s] = (symptomCounts[s] || 0) + 1;
            });
          });

          const uniqueStudents = new Set(locReports.map((r) => r.user_id)).size;

          const data: LocationData = {
            location,
            totalReports: locReports.length,
            reportsToday,
            avgTemperature: Math.round(avgTemperature * 10) / 10,
            symptomCounts,
            riskLevel: "low",
            affectedStudents: uniqueStudents,
          };

          data.riskLevel = calculateRiskLevel(data);

          return data;
        });

        // Sort by risk level
        const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        locationStats.sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]);

        setLocationData(locationStats);
      } catch (error) {
        console.error("Error fetching heatmap data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHeatmapData();

    // Real-time subscription
    const channel = supabase
      .channel("heatmap-updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "health_reports",
        },
        () => {
          fetchHeatmapData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const topSymptoms = (symptoms: { [symptom: string]: number }) => {
    return Object.entries(symptoms)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([symptom, count]) => ({ symptom, count }));
  };

  return (
    <DashboardLayout userRole={role || "health_officer"}>
      <DashboardHeader
        title="Health Heatmap"
        subtitle="Visualize symptom density across campus locations"
      />

      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        {/* Back Button */}
        <Link to="/dashboard">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Locations</p>
                  <p className="text-xl font-bold">{locationData.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">High Risk</p>
                  <p className="text-xl font-bold">
                    {locationData.filter((l) => l.riskLevel === "high" || l.riskLevel === "critical").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Users className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Students Affected</p>
                  <p className="text-xl font-bold">
                    {locationData.reduce((sum, l) => sum + l.affectedStudents, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <Activity className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Reports Today</p>
                  <p className="text-xl font-bold">
                    {locationData.reduce((sum, l) => sum + l.reportsToday, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Heatmap Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Location Health Map
            </CardTitle>
            <CardDescription>
              Click on a location to see detailed symptom breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : locationData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No health reports in the last 7 days</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {locationData.map((loc) => (
                  <div
                    key={loc.location}
                    onClick={() => setSelectedLocation(loc)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-105 ${LOCATION_COLORS[loc.riskLevel]} ${
                      selectedLocation?.location === loc.location ? "ring-2 ring-primary" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-foreground truncate">{loc.location}</h3>
                      <Badge className={RISK_BADGES[loc.riskLevel]}>
                        {loc.riskLevel}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground">
                        <span className="font-medium text-foreground">{loc.reportsToday}</span> reports today
                      </p>
                      <p className="text-muted-foreground">
                        <span className="font-medium text-foreground">{loc.affectedStudents}</span> students
                      </p>
                      {loc.avgTemperature > 0 && (
                        <p className="text-muted-foreground flex items-center gap-1">
                          <Thermometer className="h-3 w-3" />
                          Avg: <span className="font-medium text-foreground">{loc.avgTemperature}°C</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Location Details */}
        {selectedLocation && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  {selectedLocation.location} Details
                </span>
                <Badge className={RISK_BADGES[selectedLocation.riskLevel]}>
                  {selectedLocation.riskLevel.toUpperCase()} RISK
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Total Reports (7 days)</p>
                  <p className="text-2xl font-bold">{selectedLocation.totalReports}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Reports Today</p>
                  <p className="text-2xl font-bold">{selectedLocation.reportsToday}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Affected Students</p>
                  <p className="text-2xl font-bold">{selectedLocation.affectedStudents}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Avg Temperature</p>
                  <p className="text-2xl font-bold">
                    {selectedLocation.avgTemperature > 0 ? `${selectedLocation.avgTemperature}°C` : "N/A"}
                  </p>
                </div>
              </div>

              {/* Top Symptoms */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Top Symptoms</h4>
                <div className="space-y-2">
                  {topSymptoms(selectedLocation.symptomCounts).map(({ symptom, count }) => {
                    const maxCount = Math.max(...Object.values(selectedLocation.symptomCounts), 1);
                    const percentage = (count / maxCount) * 100;
                    return (
                      <div key={symptom}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-foreground">{formatSymptom(symptom)}</span>
                          <span className="text-muted-foreground">{count} reports</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {Object.keys(selectedLocation.symptomCounts).length === 0 && (
                    <p className="text-sm text-muted-foreground">No symptoms reported</p>
                  )}
                </div>
              </div>

              {/* All Symptoms */}
              {Object.keys(selectedLocation.symptomCounts).length > 3 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">All Reported Symptoms</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(selectedLocation.symptomCounts)
                      .sort(([, a], [, b]) => b - a)
                      .map(([symptom, count]) => (
                        <Badge key={symptom} variant="outline" className="text-xs">
                          {formatSymptom(symptom)} ({count})
                        </Badge>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Legend */}
        <Card>
          <CardContent className="p-4">
            <h4 className="text-sm font-semibold mb-3">Risk Level Legend</h4>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-success/50" />
                <span className="text-sm">Low Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-warning/50" />
                <span className="text-sm">Medium Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-orange-500/50" />
                <span className="text-sm">High Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-destructive/50" />
                <span className="text-sm">Critical Risk</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Heatmap;
