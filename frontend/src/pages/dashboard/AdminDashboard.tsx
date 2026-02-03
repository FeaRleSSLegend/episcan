import { useState, useEffect } from "react";
import { Activity, Users, Shield, Settings, UserPlus, Trash2, CheckCircle2, AlertTriangle, MessageSquare, FileText } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import OutbreakAlerts from "@/components/OutbreakAlerts";
import HealthReportsFilter from "@/components/dashboard/HealthReportsFilter";

interface UserWithRole {
  user_id: string;
  full_name: string;
  email: string;
  role: "student" | "parent" | "health_officer" | "admin";
  created_at: string;
}

const AdminDashboard = () => {
  const { profile, user } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignEmail, setAssignEmail] = useState("");
  const [assignRole, setAssignRole] = useState<"health_officer" | "admin">("health_officer");
  const [isAssigning, setIsAssigning] = useState(false);

  // ✅ ADDED: State for health reports and messages
  const [totalHealthReports, setTotalHealthReports] = useState(0);
  const [highRiskReports, setHighRiskReports] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    fetchUsers();
    fetchHealthReportsStats();  // ✅ ADDED
    fetchMessagesStats();       // ✅ ADDED
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, created_at");

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const usersWithRoles: UserWithRole[] = (profiles || []).map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.user_id);
        return {
          ...profile,
          role: userRole?.role || "student",
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ ADDED: Fetch health reports statistics
  const fetchHealthReportsStats = async () => {
    try {
      // Total health reports (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: reports, error: reportsError } = await supabase
        .from("health_reports")
        .select("id, temperature, symptoms")
        .gte("created_at", thirtyDaysAgo.toISOString());

      if (reportsError) throw reportsError;

      setTotalHealthReports(reports?.length || 0);

      // High-risk reports (fever >= 38.5 or 3+ symptoms)
      const highRisk = reports?.filter(report =>
        (report.temperature && report.temperature >= 38.5) ||
        (report.symptoms && report.symptoms.length >= 3)
      );

      setHighRiskReports(highRisk?.length || 0);
    } catch (error) {
      console.error("Error fetching health reports stats:", error);
    }
  };

  // ✅ ADDED: Fetch anonymous messages statistics
  const fetchMessagesStats = async () => {
    try {
      const { data: messages, error: messagesError } = await supabase
        .from("anonymous_messages")
        .select("id, is_read");

      if (messagesError) throw messagesError;

      setTotalMessages(messages?.length || 0);
      setUnreadMessages(messages?.filter(m => !m.is_read).length || 0);
    } catch (error) {
      console.error("Error fetching messages stats:", error);
    }
  };

  const handleAssignRole = async () => {
    if (!assignEmail.trim() || !user) return;

    setIsAssigning(true);
    try {
      // Find the user by email
      const { data: targetProfile, error: profileError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", assignEmail.trim())
        .maybeSingle();

      if (profileError || !targetProfile) {
        toast({
          title: "User not found",
          description: "No user found with that email address.",
          variant: "destructive",
        });
        return;
      }

      // Check if user already has this role
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", targetProfile.user_id)
        .eq("role", assignRole)
        .maybeSingle();

      if (existingRole) {
        toast({
          title: "Role already assigned",
          description: `This user already has the ${assignRole.replace("_", " ")} role.`,
          variant: "destructive",
        });
        return;
      }

      // Remove existing roles and assign new one
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", targetProfile.user_id);

      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({
          user_id: targetProfile.user_id,
          role: assignRole,
          assigned_by: user.id,
        });

      if (insertError) throw insertError;

      toast({
        title: "Role assigned successfully!",
        description: `User has been assigned the ${assignRole.replace("_", " ")} role.`,
      });

      setAssignEmail("");
      fetchUsers();
    } catch (error) {
      console.error("Error assigning role:", error);
      toast({
        title: "Error",
        description: "Failed to assign role. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-destructive/10 text-destructive";
      case "health_officer": return "bg-primary/10 text-primary";
      case "parent": return "bg-warning/10 text-warning";
      default: return "bg-success/10 text-success";
    }
  };

  // ✅ UPDATED: Stats now include health_reports and anonymous_messages data
  const userStats = [
    {
      title: "Total Users",
      value: users.length.toString(),
      change: "Active accounts",
      changeType: "neutral" as const,
      icon: <Users className="h-6 w-6" />,
      iconColor: "bg-primary/10 text-primary",
    },
    {
      title: "Students",
      value: users.filter(u => u.role === "student").length.toString(),
      change: "Enrolled",
      changeType: "positive" as const,
      icon: <CheckCircle2 className="h-6 w-6" />,
      iconColor: "bg-success/10 text-success",
    },
    {
      title: "Health Officers",
      value: users.filter(u => u.role === "health_officer").length.toString(),
      change: "Active",
      changeType: "neutral" as const,
      icon: <Activity className="h-6 w-6" />,
      iconColor: "bg-warning/10 text-warning",
    },
    {
      title: "Administrators",
      value: users.filter(u => u.role === "admin").length.toString(),
      change: "System admins",
      changeType: "neutral" as const,
      icon: <Shield className="h-6 w-6" />,
      iconColor: "bg-destructive/10 text-destructive",
    },
  ];

  // ✅ ADDED: Health & Messages Stats
  const healthStats = [
    {
      title: "Health Reports",
      value: totalHealthReports.toString(),
      change: "Last 30 days",
      changeType: "neutral" as const,
      icon: <FileText className="h-6 w-6" />,
      iconColor: "bg-blue-500/10 text-blue-500",
    },
    {
      title: "High-Risk Reports",
      value: highRiskReports.toString(),
      change: highRiskReports > 0 ? "Needs attention" : "All clear",
      changeType: highRiskReports > 0 ? "negative" as const : "positive" as const,
      icon: <AlertTriangle className="h-6 w-6" />,
      iconColor: highRiskReports > 0 ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success",
    },
    {
      title: "Anonymous Messages",
      value: totalMessages.toString(),
      change: `${unreadMessages} unread`,
      changeType: unreadMessages > 0 ? "negative" as const : "neutral" as const,
      icon: <MessageSquare className="h-6 w-6" />,
      iconColor: "bg-purple-500/10 text-purple-500",
    },
  ];

  return (
    <DashboardLayout userRole="admin">
      <DashboardHeader 
        title="Admin Dashboard"
        subtitle={`Welcome, ${profile?.full_name || "Admin"}`}
      />
      
      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        {/* User Stats Grid */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">User Management</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            {userStats.map((stat) => (
              <StatsCard key={stat.title} {...stat} />
            ))}
          </div>
        </div>

        {/* ✅ ADDED: Health & Messages Stats Grid */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">System Activity</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
            {healthStats.map((stat) => (
              <StatsCard key={stat.title} {...stat} />
            ))}
          </div>
        </div>

        {/* ✅ ADDED: AI Outbreak Detection */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">AI Outbreak Detection</h2>
          <OutbreakAlerts />
        </div>

        {/* Health Reports with Filtering */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">Health Reports</h2>
          <HealthReportsFilter title="All Health Reports" showUserInfo={true} />
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Assign Role */}
          <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="font-heading text-base sm:text-lg font-semibold text-foreground">Assign Role</h3>
              <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              <p className="text-muted-foreground text-xs sm:text-sm">
                Assign Health Officer or Admin roles to existing users by their email.
              </p>
              
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="email" className="text-xs sm:text-sm">User Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@school.edu"
                  value={assignEmail}
                  onChange={(e) => setAssignEmail(e.target.value)}
                  className="text-sm"
                />
              </div>
              
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Role</Label>
                <Select value={assignRole} onValueChange={(v) => setAssignRole(v as "health_officer" | "admin")}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="health_officer">Health Officer</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={handleAssignRole} 
                disabled={!assignEmail.trim() || isAssigning}
                className="w-full text-sm"
                size="default"
              >
                {isAssigning ? "Assigning..." : "Assign Role"}
              </Button>
            </div>
          </div>

          {/* User Management Table */}
          <div className="lg:col-span-2 bg-card rounded-xl border border-border p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="font-heading text-base sm:text-lg font-semibold text-foreground">User Management</h3>
              <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            </div>
            
            {loading ? (
              <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm">Loading users...</div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="min-w-[500px] px-4 sm:px-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">Name</TableHead>
                        <TableHead className="text-xs sm:text-sm">Email</TableHead>
                        <TableHead className="text-xs sm:text-sm">Role</TableHead>
                        <TableHead className="text-xs sm:text-sm">Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.slice(0, 10).map((userItem) => (
                        <TableRow key={userItem.user_id}>
                          <TableCell className="font-medium text-xs sm:text-sm py-2 sm:py-4">{userItem.full_name || "—"}</TableCell>
                          <TableCell className="text-xs sm:text-sm py-2 sm:py-4 max-w-[120px] sm:max-w-none truncate">{userItem.email}</TableCell>
                          <TableCell className="py-2 sm:py-4">
                            <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap ${getRoleBadgeColor(userItem.role)}`}>
                              {userItem.role.replace("_", " ")}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs sm:text-sm py-2 sm:py-4">
                            {new Date(userItem.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
