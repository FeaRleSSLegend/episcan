import { useEffect, useState } from "react";
import { Calendar, AlertCircle, CheckCircle2, MapPin, Filter, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, isToday, isYesterday, parseISO, subDays } from "date-fns";
import { formatSymptom } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Updated interface to match health_reports table schema
interface HealthReport {
  id: string;
  user_id: string;
  symptoms: string[];
  temperature: number | null;
  location: string;
  created_at: string;
}

// ✅ REMOVED: No longer needed - using formatSymptom() instead
// This automatically formats: "sore_throat" → "Sore Throat"

// Helper function to determine severity based on symptoms and temperature
const calculateSeverity = (symptoms: string[], temperature: number | null): string => {
  if (symptoms.length === 0) return "none";
  if (temperature && temperature >= 39.0) return "severe";
  if (temperature && temperature >= 38.0) return "moderate";
  if (symptoms.length >= 3) return "moderate";
  return "mild";
};

const severityColors: Record<string, string> = {
  none: "bg-success/10 text-success",
  mild: "bg-warning/10 text-warning",
  moderate: "bg-orange-500/10 text-orange-500",
  severe: "bg-destructive/10 text-destructive",
};

const formatReportDate = (dateString: string) => {
  const date = parseISO(dateString);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d");
};

interface RecentCheckinsProps {
  userId?: string;
  limit?: number;
  showFilters?: boolean;
}

// Common symptoms for filtering
const SYMPTOM_OPTIONS = [
  { value: "all", label: "All Symptoms" },
  { value: "fever", label: "Fever" },
  { value: "cough", label: "Cough" },
  { value: "headache", label: "Headache" },
  { value: "fatigue", label: "Fatigue" },
  { value: "sore_throat", label: "Sore Throat" },
  { value: "runny_nose", label: "Runny Nose" },
  { value: "body_aches", label: "Body Aches" },
  { value: "nausea", label: "Nausea" },
  { value: "diarrhea", label: "Diarrhea" },
  { value: "breathing", label: "Breathing Issues" },
];

const DATE_RANGE_OPTIONS = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "7days", label: "Last 7 Days" },
  { value: "30days", label: "Last 30 Days" },
];

const RecentCheckins = ({ userId, limit = 5, showFilters = true }: RecentCheckinsProps) => {
  const { user } = useAuth();
  const [reports, setReports] = useState<HealthReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<HealthReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("all");
  const [symptomFilter, setSymptomFilter] = useState("all");
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const targetUserId = userId || user?.id;

  // Apply filters when reports, dateFilter, or symptomFilter change
  useEffect(() => {
    let filtered = [...reports];

    // Apply date filter
    if (dateFilter !== "all") {
      const now = new Date();
      let cutoffDate: Date;

      switch (dateFilter) {
        case "today":
          cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
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

      filtered = filtered.filter(report =>
        new Date(report.created_at) >= cutoffDate
      );
    }

    // Apply symptom filter
    if (symptomFilter !== "all") {
      filtered = filtered.filter(report =>
        report.symptoms.includes(symptomFilter)
      );
    }

    setFilteredReports(filtered);
  }, [reports, dateFilter, symptomFilter]);

  const clearFilters = () => {
    setDateFilter("all");
    setSymptomFilter("all");
  };

  const hasActiveFilters = dateFilter !== "all" || symptomFilter !== "all";

  useEffect(() => {
    const fetchReports = async () => {
      if (!targetUserId) return;

      try {
        // Fetch more reports to allow for filtering
        const { data, error } = await supabase
          .from("health_reports")
          .select("*")
          .eq("user_id", targetUserId)
          .order("created_at", { ascending: false })
          .limit(50); // Fetch more for filtering, display will be limited

        if (error) throw error;
        setReports(data || []);
        setFilteredReports(data || []);
      } catch (error) {
        console.error("Error fetching reports:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [targetUserId]);

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="font-heading text-base sm:text-lg font-semibold text-foreground">Recent Check-ins</h3>
          <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
        </div>
        <div className="space-y-2 sm:space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse p-3 bg-muted/50 rounded-lg h-16" />
          ))}
        </div>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="font-heading text-base sm:text-lg font-semibold text-foreground">Recent Check-ins</h3>
          <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
        </div>
        <div className="text-center py-6 sm:py-8">
          <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground text-sm sm:text-base">No check-ins yet</p>
          <p className="text-xs sm:text-sm text-muted-foreground/70 mt-1">Submit your first health report</p>
        </div>
      </div>
    );
  }

  // Get the reports to display (apply limit after filtering)
  const displayReports = filteredReports.slice(0, limit);

  return (
    <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="font-heading text-base sm:text-lg font-semibold text-foreground">Recent Check-ins</h3>
        <div className="flex items-center gap-2">
          {showFilters && (
            <Button
              variant={showFilterPanel ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className="h-8 w-8 p-0"
            >
              <Filter className="h-4 w-4" />
            </Button>
          )}
          <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && showFilterPanel && (
        <div className="mb-4 p-3 bg-muted/50 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Filters</span>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                {DATE_RANGE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value} className="text-xs">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={symptomFilter} onValueChange={setSymptomFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Symptom" />
              </SelectTrigger>
              <SelectContent>
                {SYMPTOM_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value} className="text-xs">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {hasActiveFilters && (
            <p className="text-xs text-muted-foreground">
              Showing {filteredReports.length} of {reports.length} check-ins
            </p>
          )}
        </div>
      )}

      {/* No results after filtering */}
      {displayReports.length === 0 && hasActiveFilters && (
        <div className="text-center py-6">
          <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-muted-foreground text-sm">No check-ins match your filters</p>
          <Button variant="link" size="sm" onClick={clearFilters} className="mt-1">
            Clear filters
          </Button>
        </div>
      )}

      <div className="space-y-2 sm:space-y-3">
        {displayReports.map((report) => {
          const severity = calculateSeverity(report.symptoms, report.temperature);
          return (
            <div key={report.id} className="flex items-center justify-between p-2.5 sm:p-3 bg-muted/50 rounded-lg gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-foreground text-sm sm:text-base">
                    {formatReportDate(report.created_at)}
                  </p>
                  {report.temperature && (
                    <span className="text-xs text-muted-foreground">
                      {report.temperature}°C
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {report.symptoms.length === 0
                    ? "No symptoms"
                    : report.symptoms.slice(0, 2).map(s => formatSymptom(s)).join(", ")  // ✅ FIXED: Format symptoms
                  }
                  {report.symptoms.length > 2 && ` +${report.symptoms.length - 2}`}
                </p>
                {report.location && (
                  <p className="text-xs text-muted-foreground/70 flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" />
                    {report.location}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {report.symptoms.length === 0 ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium bg-success/10 text-success whitespace-nowrap">
                    <CheckCircle2 className="h-3 w-3" />
                    Healthy
                  </span>
                ) : (
                  <span className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium capitalize whitespace-nowrap ${severityColors[severity] || severityColors.mild}`}>
                    {severity}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentCheckins;