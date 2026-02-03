import { useState, useEffect } from "react";
import { Bell, AlertTriangle, Info, CheckCircle, Shield, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface HealthAlert {
  id: string;
  type: "warning" | "info" | "success";
  title: string;
  message: string;
  date: string;
  priority: string;
  isRead: boolean;
}

const StudentAlerts = () => {
  const { user, role } = useAuth();
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [loading, setLoading] = useState(true);

  // Function to mark a notification as read
  const markAsRead = async (notificationId: string) => {
    if (!user?.id) return;

    try {
      // Insert into user_notification_reads (will fail silently if already exists due to UNIQUE constraint)
      await supabase
        .from("user_notification_reads")
        .upsert({
          notification_id: notificationId,
          user_id: user.id,
        }, { onConflict: 'notification_id,user_id' });

      // Update local state
      setAlerts(prev => prev.map(alert =>
        alert.id === notificationId ? { ...alert, isRead: true } : alert
      ));
    } catch (error) {
      console.warn("Error marking notification as read:", error);
    }
  };

  // Function to mark all visible notifications as read
  const markAllAsRead = async (notifications: any[]) => {
    if (!user?.id || notifications.length === 0) return;

    try {
      const readsToInsert = notifications.map(n => ({
        notification_id: n.id,
        user_id: user.id,
      }));

      await supabase
        .from("user_notification_reads")
        .upsert(readsToInsert, { onConflict: 'notification_id,user_id' });
    } catch (error) {
      console.warn("Error marking all notifications as read:", error);
    }
  };

  useEffect(() => {
    const fetchAlerts = async () => {
      if (!user?.id) return;

      try {
        // ✅ Fetch real system notifications from database with read status
        const { data: notifications, error: notifError } = await supabase
          .from("system_notifications")
          .select("*")
          .eq("status", "sent")
          .in("audience", ["all", role || "students"])
          .order("created_at", { ascending: false })
          .limit(20);

        if (notifError) throw notifError;

        // Fetch which notifications are already read by this user
        const { data: readData } = await supabase
          .from("user_notification_reads")
          .select("notification_id")
          .eq("user_id", user.id);

        const readIds = new Set((readData || []).map(r => r.notification_id));

        // ✅ Map system_notifications to HealthAlert format with read status
        const mappedAlerts: HealthAlert[] = (notifications || []).map((notification) => ({
          id: notification.id,
          type: mapPriorityToType(notification.priority),
          title: notification.title,
          message: notification.message,
          date: notification.sent_at || notification.created_at,
          priority: notification.priority,
          isRead: readIds.has(notification.id),
        }));

        setAlerts(mappedAlerts);

        // ✅ Mark all notifications as read when the page loads
        if (notifications && notifications.length > 0) {
          markAllAsRead(notifications);
        }
      } catch (error) {
        console.error("Error fetching alerts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();

    // ✅ Real-time subscription for new notifications
    const channel = supabase
      .channel("student-alerts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "system_notifications",
        },
        (payload) => {
          const newNotification = payload.new as any;
          // Only add if it's for this user's audience
          if (
            newNotification.audience === "all" ||
            newNotification.audience === role ||
            (newNotification.audience === "students" && role === "student")
          ) {
            const newAlert: HealthAlert = {
              id: newNotification.id,
              type: mapPriorityToType(newNotification.priority),
              title: newNotification.title,
              message: newNotification.message,
              date: newNotification.sent_at || newNotification.created_at,
              priority: newNotification.priority,
              isRead: false, // New notifications start as unread
            };
            setAlerts((prev) => [newAlert, ...prev]);
            // Mark as read immediately since user is on this page
            markAsRead(newNotification.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, role]);

  // ✅ Helper: Map notification priority to alert type
  const mapPriorityToType = (priority: string): "warning" | "info" | "success" => {
    switch (priority) {
      case "critical":
      case "high":
        return "warning";
      case "low":
        return "success";
      default:
        return "info";
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />;
      case "success":
        return <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />;
      default:
        return <Info className="h-4 w-4 sm:h-5 sm:w-5" />;
    }
  };

  const getAlertStyles = (type: string) => {
    switch (type) {
      case "warning":
        return {
          badge: "bg-warning/10 text-warning border-warning/20",
          icon: "bg-warning/10 text-warning",
        };
      case "success":
        return {
          badge: "bg-success/10 text-success border-success/20",
          icon: "bg-success/10 text-success",
        };
      default:
        return {
          badge: "bg-primary/10 text-primary border-primary/20",
          icon: "bg-primary/10 text-primary",
        };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <DashboardLayout userRole="student">
      <DashboardHeader
        title="Health Alerts"
        subtitle="Stay informed about school health updates"
      />

      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        {/* Alert Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Warnings</p>
                  <p className="text-lg sm:text-xl font-bold text-foreground">
                    {alerts.filter(a => a.type === "warning").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Info className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Announcements</p>
                  <p className="text-lg sm:text-xl font-bold text-foreground">
                    {alerts.filter(a => a.type === "info").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Positive</p>
                  <p className="text-lg sm:text-xl font-bold text-foreground">
                    {alerts.filter(a => a.type === "success").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Alerts</p>
                  <p className="text-lg sm:text-xl font-bold text-foreground">{alerts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts List */}
        <Card className="bg-card border-border">
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-2 sm:pt-0">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm sm:text-base">No alerts at this time</p>
                <p className="text-muted-foreground text-xs sm:text-sm mt-1">Check back later for updates</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => {
                  const styles = getAlertStyles(alert.type);
                  return (
                    <div
                      key={alert.id}
                      onClick={() => !alert.isRead && markAsRead(alert.id)}
                      className={`p-3 sm:p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer ${
                        alert.isRead ? 'bg-muted/20 opacity-75' : 'bg-muted/30'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg flex-shrink-0 ${styles.icon}`}>
                          {getAlertIcon(alert.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                            <h4 className={`font-medium text-sm sm:text-base truncate ${
                              alert.isRead ? 'text-muted-foreground' : 'text-foreground'
                            }`}>
                              {alert.title}
                            </h4>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={`text-xs w-fit ${styles.badge}`}>
                                {alert.type === "warning" ? "Warning" : alert.type === "success" ? "Update" : "Info"}
                              </Badge>
                              {!alert.isRead && (
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" title="Unread" />
                              )}
                            </div>
                          </div>
                          <p className="text-muted-foreground text-xs sm:text-sm line-clamp-2">
                            {alert.message}
                          </p>
                          <p className="text-muted-foreground/70 text-xs mt-2">
                            {formatDate(alert.date)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StudentAlerts;
