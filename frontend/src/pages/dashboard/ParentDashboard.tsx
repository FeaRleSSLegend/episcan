import { useState, useEffect } from "react";
import { Users, Heart, Bell, Shield, Link2, Copy, Check } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface LinkedChild {
  id: string;
  full_name: string;
  school_name: string | null;
  grade_class: string | null;
}

const ParentDashboard = () => {
  const { profile, user } = useAuth();
  const [linkedChildren, setLinkedChildren] = useState<LinkedChild[]>([]);
  const [inviteCode, setInviteCode] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      fetchLinkedChildren();
    }
  }, [user]);

  const fetchLinkedChildren = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("parent_child_links")
      .select(`
        child_user_id,
        profiles!parent_child_links_child_user_id_fkey(
          id,
          full_name,
          school_name,
          grade_class
        )
      `)
      .eq("parent_user_id", user.id);

    if (error) {
      console.error("Error fetching children:", error);
    } else if (data) {
      const children = data
        .filter(item => item.profiles)
        .map(item => ({
          id: (item.profiles as any).id,
          full_name: (item.profiles as any).full_name,
          school_name: (item.profiles as any).school_name,
          grade_class: (item.profiles as any).grade_class,
        }));
      setLinkedChildren(children);
    }
  };

  const handleLinkChild = async () => {
    if (!inviteCode.trim() || !user) return;

    setIsLinking(true);
    try {
      // Find the invite code
      const { data: codeData, error: codeError } = await supabase
        .from("invite_codes")
        .select("*")
        .eq("code", inviteCode.toUpperCase().trim())
        .is("used_by", null)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (codeError || !codeData) {
        toast({
          title: "Invalid code",
          description: "The invite code is invalid or has expired.",
          variant: "destructive",
        });
        return;
      }

      // Create the parent-child link
      const { error: linkError } = await supabase
        .from("parent_child_links")
        .insert({
          parent_user_id: user.id,
          child_user_id: codeData.student_user_id,
        });

      if (linkError) {
        if (linkError.code === "23505") {
          toast({
            title: "Already linked",
            description: "You are already linked to this student.",
            variant: "destructive",
          });
        } else {
          throw linkError;
        }
        return;
      }

      // Mark the invite code as used
      await supabase
        .from("invite_codes")
        .update({ used_by: user.id, used_at: new Date().toISOString() })
        .eq("id", codeData.id);

      toast({
        title: "Child linked successfully!",
        description: "You can now monitor your child's health status.",
      });

      setInviteCode("");
      fetchLinkedChildren();
    } catch (error) {
      console.error("Error linking child:", error);
      toast({
        title: "Error",
        description: "Failed to link child. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLinking(false);
    }
  };

  const stats = [
    {
      title: "Linked Children",
      value: linkedChildren.length.toString(),
      change: linkedChildren.length > 0 ? "Monitoring active" : "Link a child to start",
      changeType: linkedChildren.length > 0 ? "positive" as const : "neutral" as const,
      icon: <Users className="h-6 w-6" />,
      iconColor: "bg-primary/10 text-primary",
    },
    {
      title: "Overall Health",
      value: "Good",
      change: "All children healthy",
      changeType: "positive" as const,
      icon: <Heart className="h-6 w-6" />,
      iconColor: "bg-success/10 text-success",
    },
    {
      title: "Active Alerts",
      value: "0",
      change: "No alerts",
      changeType: "positive" as const,
      icon: <Bell className="h-6 w-6" />,
      iconColor: "bg-muted text-muted-foreground",
    },
    {
      title: "School Status",
      value: "Safe",
      change: "No outbreaks detected",
      changeType: "positive" as const,
      icon: <Shield className="h-6 w-6" />,
      iconColor: "bg-success/10 text-success",
    },
  ];

  return (
    <DashboardLayout userRole="parent">
      <DashboardHeader 
        title={`Welcome, ${profile?.full_name || "Parent"}!`}
        subtitle="Monitor your children's health" 
      />
      
      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {stats.map((stat) => (
            <StatsCard key={stat.title} {...stat} />
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Linked Children */}
          <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="font-heading text-base sm:text-lg font-semibold text-foreground">Your Children</h3>
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            </div>
            
            {linkedChildren.length > 0 ? (
              <div className="space-y-2 sm:space-y-4">
                {linkedChildren.map((child) => (
                  <div key={child.id} className="flex items-center justify-between p-3 sm:p-4 bg-muted/50 rounded-lg gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground text-sm sm:text-base truncate">{child.full_name}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {child.school_name || "School not set"} • {child.grade_class || "Grade not set"}
                      </p>
                    </div>
                    <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium bg-success/10 text-success whitespace-nowrap">
                      Healthy
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8 text-muted-foreground">
                <Users className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 opacity-50" />
                <p className="text-sm sm:text-base">No children linked yet.</p>
                <p className="text-xs sm:text-sm">Enter an invite code to link your child's account.</p>
              </div>
            )}
          </div>

          {/* Link Child */}
          <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="font-heading text-base sm:text-lg font-semibold text-foreground">Link a Child</h3>
              <Link2 className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              <p className="text-muted-foreground text-xs sm:text-sm">
                Ask your child to generate an invite code from their EPISCAN account, then enter it below.
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="inviteCode" className="text-sm">Invite Code</Label>
                <Input
                  id="inviteCode"
                  placeholder="Enter 8-character code"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  maxLength={8}
                  className="font-mono text-base sm:text-lg tracking-widest"
                />
              </div>
              
              <Button 
                onClick={handleLinkChild} 
                disabled={inviteCode.length !== 8 || isLinking}
                className="w-full"
                size="default"
              >
                {isLinking ? "Linking..." : "Link Child"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ParentDashboard;