import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Calendar, BarChart3, PieChart, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Reports = () => {
  const [reportType, setReportType] = useState("weekly");
  const [dateRange, setDateRange] = useState("last7days");

  const { data: reportStats } = useQuery({
    queryKey: ["report-stats"],
    queryFn: async () => {
      const { count: totalReports } = await supabase
        .from("symptom_reports")
        .select("*", { count: "exact", head: true });

      const { count: messagesCount } = await supabase
        .from("anonymous_messages")
        .select("*", { count: "exact", head: true });

      return {
        totalReports: totalReports || 0,
        totalMessages: messagesCount || 0,
      };
    },
  });

  const reportTemplates = [
    {
      title: "Health Summary Report",
      description: "Overview of all health check-ins and symptoms",
      icon: BarChart3,
      type: "summary",
    },
    {
      title: "Symptom Analysis Report",
      description: "Detailed breakdown of reported symptoms",
      icon: PieChart,
      type: "symptoms",
    },
    {
      title: "Trend Analysis Report",
      description: "Health trends over time",
      icon: TrendingUp,
      type: "trends",
    },
    {
      title: "User Activity Report",
      description: "User engagement and check-in compliance",
      icon: FileText,
      type: "activity",
    },
  ];

  const handleGenerateReport = (type: string) => {
    // Placeholder for report generation
    console.log("Generating report:", type, reportType, dateRange);
  };

  return (
    <DashboardLayout>
      <DashboardHeader
        title="Reports"
        subtitle="Generate and download health analytics reports"
      />

      <div className="p-4 lg:p-6 space-y-6">
        {/* Report Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Health Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportStats?.totalReports || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Anonymous Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportStats?.totalMessages || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Reports Generated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
            </CardContent>
          </Card>
        </div>

        {/* Report Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Report Configuration</CardTitle>
            <CardDescription>Configure report parameters</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Report Type</label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last7days">Last 7 Days</SelectItem>
                    <SelectItem value="last30days">Last 30 Days</SelectItem>
                    <SelectItem value="last90days">Last 90 Days</SelectItem>
                    <SelectItem value="thisYear">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Templates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reportTemplates.map((report) => (
            <Card key={report.type}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <report.icon className="h-5 w-5 text-primary" />
                  {report.title}
                </CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateReport(report.type)}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Generate
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
            <CardDescription>Previously generated reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No reports generated yet</p>
              <p className="text-sm">Generate your first report using the templates above</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
