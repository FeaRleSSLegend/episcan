import { useState, useEffect } from "react";
import { Filter, X, Search, Calendar, MapPin, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, parseISO, isToday, isYesterday } from "date-fns";
import { formatSymptom } from "@/lib/formatters";

interface HealthReport {
  id: string;
  user_id: string;
  symptoms: string[];
  temperature: number | null;
  location: string;
  created_at: string;
  profile?: {
    full_name: string;
    email: string;
  };
}

interface HealthReportsFilterProps {
  title?: string;
  showUserInfo?: boolean;
}

const LOCATION_OPTIONS = [
  { value: "all", label: "All Locations" },
  { value: "Hostel A", label: "Hostel A" },
  { value: "Hostel B", label: "Hostel B" },
  { value: "Hostel C", label: "Hostel C" },
  { value: "Hostel D", label: "Hostel D" },
  { value: "Day Scholar", label: "Day Scholar" },
  { value: "Other", label: "Other" },
];

const DATE_RANGE_OPTIONS = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7days", label: "Last 7 Days" },
  { value: "30days", label: "Last 30 Days" },
];

const SEVERITY_OPTIONS = [
  { value: "all", label: "All Severities" },
  { value: "severe", label: "Severe (Fever ≥39°C)" },
  { value: "moderate", label: "Moderate (3+ symptoms)" },
  { value: "mild", label: "Mild Symptoms" },
  { value: "healthy", label: "Healthy (No symptoms)" },
];

const calculateSeverity = (symptoms: string[], temperature: number | null): string => {
  if (symptoms.length === 0) return "healthy";
  if (temperature && temperature >= 39.0) return "severe";
  if (temperature && temperature >= 38.0) return "moderate";
  if (symptoms.length >= 3) return "moderate";
  return "mild";
};

const severityColors: Record<string, string> = {
  healthy: "bg-success/10 text-success",
  mild: "bg-warning/10 text-warning",
  moderate: "bg-orange-500/10 text-orange-500",
  severe: "bg-destructive/10 text-destructive",
};

const formatReportDate = (dateString: string) => {
  const date = parseISO(dateString);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d, yyyy");
};

const HealthReportsFilter = ({
  title = "Health Reports",
  showUserInfo = true,
}: HealthReportsFilterProps) => {
  const [reports, setReports] = useState<HealthReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<HealthReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationFilter, setLocationFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("7days");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(true);

  // Fetch reports
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);

        let query = supabase
          .from("health_reports")
          .select(`
            *,
            profiles:user_id (
              full_name,
              email
            )
          `)
          .order("created_at", { ascending: false })
          .limit(100);

        const { data, error } = await query;

        if (error) throw error;

        // Transform the data to match our interface
        const transformedData = (data || []).map((report: any) => ({
          ...report,
          profile: report.profiles ? {
            full_name: report.profiles.full_name,
            email: report.profiles.email,
          } : undefined,
        }));

        setReports(transformedData);
        setFilteredReports(transformedData);
      } catch (error) {
        console.error("Error fetching reports:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();

    // Real-time subscription
    const channel = supabase
      .channel("health-reports-filter")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "health_reports",
        },
        () => {
          fetchReports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...reports];

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      let cutoffDate: Date;

      switch (dateFilter) {
        case "today":
          cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case "yesterday":
          cutoffDate = subDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()), 1);
          break;
        case "7days":
          cutoffDate = subDays(now, 7);
          break;
        case "30days":
          cutoffDate = subDays(now, 30);
          break;
        default:
          cutoffDate = new Date(0);
      }

      filtered = filtered.filter(report => {
        const reportDate = new Date(report.created_at);
        if (dateFilter === "yesterday") {
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          return reportDate >= cutoffDate && reportDate < todayStart;
        }
        return reportDate >= cutoffDate;
      });
    }

    // Location filter
    if (locationFilter !== "all") {
      filtered = filtered.filter(report => report.location === locationFilter);
    }

    // Severity filter
    if (severityFilter !== "all") {
      filtered = filtered.filter(report => {
        const severity = calculateSeverity(report.symptoms, report.temperature);
        return severity === severityFilter;
      });
    }

    // Search filter (search by name or email)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(report => {
        const name = report.profile?.full_name?.toLowerCase() || "";
        const email = report.profile?.email?.toLowerCase() || "";
        const symptoms = report.symptoms.join(" ").toLowerCase();
        return name.includes(query) || email.includes(query) || symptoms.includes(query);
      });
    }

    setFilteredReports(filtered);
  }, [reports, dateFilter, locationFilter, severityFilter, searchQuery]);

  const clearFilters = () => {
    setDateFilter("7days");
    setLocationFilter("all");
    setSeverityFilter("all");
    setSearchQuery("");
  };

  const hasActiveFilters = dateFilter !== "7days" || locationFilter !== "all" || severityFilter !== "all" || searchQuery.trim() !== "";

  // Stats
  const severeCount = filteredReports.filter(r => calculateSeverity(r.symptoms, r.temperature) === "severe").length;
  const moderateCount = filteredReports.filter(r => calculateSeverity(r.symptoms, r.temperature) === "moderate").length;

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {filteredReports.length} reports
            </Badge>
            <Button
              variant={showFilters ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="h-8"
            >
              <Filter className="h-4 w-4 mr-1" />
              Filters
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        {/* Filter Panel */}
        {showFilters && (
          <div className="mb-4 p-3 bg-muted/50 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Filter Reports</span>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-7 text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear All
                </Button>
              )}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or symptom..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>

            {/* Filter Selects */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="h-9 text-sm">
                  <Calendar className="h-3 w-3 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  {DATE_RANGE_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="h-9 text-sm">
                  <MapPin className="h-3 w-3 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  {LOCATION_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="h-9 text-sm">
                  <AlertTriangle className="h-3 w-3 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITY_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Stats */}
            <div className="flex gap-3 text-xs">
              {severeCount > 0 && (
                <span className="text-destructive">
                  {severeCount} severe
                </span>
              )}
              {moderateCount > 0 && (
                <span className="text-orange-500">
                  {moderateCount} moderate
                </span>
              )}
            </div>
          </div>
        )}

        {/* Reports List */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground text-sm">No reports match your filters</p>
            {hasActiveFilters && (
              <Button variant="link" size="sm" onClick={clearFilters} className="mt-1">
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {filteredReports.slice(0, 20).map((report) => {
              const severity = calculateSeverity(report.symptoms, report.temperature);
              return (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    {showUserInfo && report.profile && (
                      <p className="font-medium text-foreground text-sm truncate">
                        {report.profile.full_name || "Unknown"}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>{formatReportDate(report.created_at)}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {report.location}
                      </span>
                      {report.temperature && (
                        <>
                          <span>•</span>
                          <span>{report.temperature}°C</span>
                        </>
                      )}
                    </div>
                    {report.symptoms.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {report.symptoms.slice(0, 3).map(s => formatSymptom(s)).join(", ")}
                        {report.symptoms.length > 3 && ` +${report.symptoms.length - 3}`}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${severityColors[severity]}`}>
                      {severity === "healthy" ? "Healthy" : severity}
                    </span>
                  </div>
                </div>
              );
            })}
            {filteredReports.length > 20 && (
              <p className="text-center text-xs text-muted-foreground py-2">
                Showing 20 of {filteredReports.length} reports
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HealthReportsFilter;
