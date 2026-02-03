import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Send, Clock, Users, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Notification {
  id: string;
  title: string;
  message: string;
  audience: string;
  priority: string;
  status: "sent" | "scheduled" | "draft";
  sent_at?: string;
  scheduled_for?: string;
  created_at: string;
}

const Notifications = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState("all");
  const [priority, setPriority] = useState("normal");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // ✅ Fetch notifications from database
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from("system_notifications")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20);

        if (error) throw error;
        setNotifications(data || []);
      } catch (error) {
        console.error("Error fetching notifications:", error);
        toast.error("Failed to load notifications");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // ✅ Real-time subscription for new notifications
    const channel = supabase
      .channel("notifications-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "system_notifications",
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ✅ FIXED: Actually save notification to database
  const handleSendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!user?.id) {
      toast.error("You must be logged in to send notifications");
      return;
    }

    setSending(true);

    try {
      const { data, error } = await supabase
        .from("system_notifications")
        .insert({
          title: title.trim(),
          message: message.trim(),
          audience,
          priority,
          status: "sent",
          created_by: user.id,
          sent_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Notification sent successfully to " + audience);
      setTitle("");
      setMessage("");
      setAudience("all");
      setPriority("normal");

      // NOTE: Removed optimistic update - real-time subscription handles it
      // This prevents duplicate notifications appearing in the admin's view
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error("Failed to send notification. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle className="h-3 w-3" />
            Sent
          </span>
        );
      case "scheduled":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <Clock className="h-3 w-3" />
            Scheduled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
            Draft
          </span>
        );
    }
  };

  return (
    <DashboardLayout>
      <DashboardHeader
        title="Notifications"
        subtitle="Send and manage notifications to users"
      />

      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        {/* Send Notification Form */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Send className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Send Notification
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Create and send notifications to users</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-xs sm:text-sm font-medium">Title</label>
              <Input
                placeholder="Notification title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-xs sm:text-sm font-medium">Message</label>
              <Textarea
                placeholder="Enter your notification message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="text-sm min-h-[80px] sm:min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium">Audience</label>
                <Select value={audience} onValueChange={setAudience}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="students">Students Only</SelectItem>
                    <SelectItem value="parents">Parents Only</SelectItem>
                    <SelectItem value="health_officers">Health Officers</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium">Priority</label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={handleSendNotification} disabled={sending} className="text-sm" size="default">
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Now
                  </>
                )}
              </Button>
              <Button variant="outline" className="text-sm" size="default" disabled>
                <Clock className="h-4 w-4 mr-2" />
                Schedule (Coming Soon)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification History */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Notification History
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Previously sent notifications</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No notifications sent yet</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 p-3 sm:p-4 border border-border rounded-lg"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-medium text-sm sm:text-base">{notification.title}</h4>
                      {getStatusBadge(notification.status)}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">{notification.message}</p>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {notification.audience === "all" ? "All Users" : notification.audience}
                      </span>
                      {notification.sent_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(notification.sent_at).toLocaleDateString()} at{" "}
                          {new Date(notification.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Notifications;
