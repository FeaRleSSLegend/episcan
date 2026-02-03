import { useState, useEffect } from "react";
import { History, ArrowRight, Search, Filter, CalendarIcon, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AuditLogEntry {
  id: string;
  user_email: string;
  previous_role: string | null;
  new_role: string;
  changed_by_email: string | null;
  action: string;
  created_at: string;
}

const RoleAuditLog = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  useEffect(() => {
    fetchLogs();
  }, [searchEmail, actionFilter, roleFilter, startDate, endDate]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("role_audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (searchEmail.trim()) {
        query = query.ilike("user_email", `%${searchEmail.trim()}%`);
      }

      if (actionFilter !== "all") {
        query = query.eq("action", actionFilter);
      }

      if (roleFilter !== "all") {
        query = query.or(`previous_role.eq.${roleFilter},new_role.eq.${roleFilter}`);
      }

      if (startDate) {
        query = query.gte("created_at", startDate.toISOString());
      }

      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte("created_at", endOfDay.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchEmail("");
    setActionFilter("all");
    setRoleFilter("all");
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const hasActiveFilters = searchEmail || actionFilter !== "all" || roleFilter !== "all" || startDate || endDate;

  const getRoleBadgeColor = (role: string | null) => {
    if (!role) return "bg-muted text-muted-foreground";
    switch (role) {
      case "admin": return "bg-destructive/10 text-destructive";
      case "health_officer": return "bg-primary/10 text-primary";
      case "parent": return "bg-warning/10 text-warning";
      default: return "bg-success/10 text-success";
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case "assign": return "bg-success/10 text-success";
      case "change": return "bg-primary/10 text-primary";
      case "remove": return "bg-destructive/10 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const formatRole = (role: string | null) => {
    if (!role) return "None";
    return role.replace("_", " ");
  };


  return (
    <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className="p-2 rounded-lg bg-muted">
          <History className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-heading text-base sm:text-lg font-semibold text-foreground">
            Role Change History
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Recent role assignments and changes
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          {/* Search by email */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by user email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          {/* Action filter */}
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-full sm:w-[130px] h-9 text-sm">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="assign">Assign</SelectItem>
              <SelectItem value="change">Change</SelectItem>
              <SelectItem value="remove">Remove</SelectItem>
            </SelectContent>
          </Select>

          {/* Role filter */}
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-[150px] h-9 text-sm">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="parent">Parent</SelectItem>
              <SelectItem value="health_officer">Health Officer</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          {/* Start date */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full sm:w-[160px] h-9 justify-start text-left text-sm font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "MMM d, yyyy") : "From date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          {/* End date */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full sm:w-[160px] h-9 justify-start text-left text-sm font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "MMM d, yyyy") : "To date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          {/* Clear filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9 px-3 text-sm text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          {hasActiveFilters ? "No role changes match your filters." : "No role changes recorded yet."}
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-[600px] px-4 sm:px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">User</TableHead>
                  <TableHead className="text-xs sm:text-sm">Action</TableHead>
                  <TableHead className="text-xs sm:text-sm">Role Change</TableHead>
                  <TableHead className="text-xs sm:text-sm">Changed By</TableHead>
                  <TableHead className="text-xs sm:text-sm">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs sm:text-sm py-2 sm:py-4 max-w-[120px] truncate">
                      {log.user_email}
                    </TableCell>
                    <TableCell className="py-2 sm:py-4">
                      <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium capitalize ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell className="py-2 sm:py-4">
                      <div className="flex items-center gap-1 sm:gap-2 text-xs">
                        <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium capitalize ${getRoleBadgeColor(log.previous_role)}`}>
                          {formatRole(log.previous_role)}
                        </span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium capitalize ${getRoleBadgeColor(log.new_role)}`}>
                          {formatRole(log.new_role)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm py-2 sm:py-4 max-w-[100px] truncate text-muted-foreground">
                      {log.changed_by_email || "System"}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm py-2 sm:py-4 text-muted-foreground whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleAuditLog;