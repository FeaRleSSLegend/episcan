import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Activity, 
  Bell, 
  Map, 
  FileText, 
  Users, 
  Settings, 
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Lightbulb,
  Menu,
  MessageSquare,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useNotificationBadge } from "@/hooks/useNotificationBadge";
import { Badge } from "@/components/ui/badge";

interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole?: "student" | "parent" | "teacher" | "health_officer" | "admin";
}

const getNavItems = (role: string) => {
  const baseItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  ];

  const roleItems = {
    student: [
      { icon: Activity, label: "Health Check-in", href: "/dashboard/checkin" },
      { icon: Bell, label: "Alerts", href: "/dashboard/alerts" },
      { icon: Lightbulb, label: "Health Tips", href: "/dashboard/tips" },
    ],
    parent: [
      { icon: Bell, label: "Alerts", href: "/dashboard/alerts" },
      { icon: Map, label: "School Heatmap", href: "/dashboard/heatmap" },
    ],
    teacher: [
      { icon: Bell, label: "Alerts", href: "/dashboard/alerts" },
    ],
    health_officer: [
      { icon: Activity, label: "Health Monitor", href: "/dashboard/overview" },
      { icon: FileText, label: "Messages", href: "/dashboard/officer-messages" },
      { icon: Bell, label: "Alerts", href: "/dashboard/alerts" },
      { icon: FileText, label: "Reports", href: "/dashboard/reports" },
    ],
    admin: [
      { icon: Activity, label: "Health Overview", href: "/dashboard/overview" },
      { icon: Users, label: "User Management", href: "/dashboard/admin/users" },
      { icon: MessageSquare, label: "Message Insights", href: "/dashboard/officer-messages" }, // ✅ Admins see summary stats
      { icon: Bell, label: "Notifications", href: "/dashboard/notifications" },
      { icon: FileText, label: "Reports", href: "/dashboard/reports" },
    ],
  };

  const bottomItems = [
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
    { icon: HelpCircle, label: "Help & Support", href: "/dashboard/help" },
  ];

  return {
    main: [...baseItems, ...(roleItems[role as keyof typeof roleItems] || [])],
    bottom: bottomItems,
  };
};

const DashboardLayout = ({ children, userRole = "student" }: DashboardLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { signOut, role } = useAuth();
  const navItems = getNavItems(role || userRole);
  const badges = useNotificationBadge(); // ✅ ADDED: Real-time notification badges

  const isActive = (href: string) => location.pathname === href;

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    await signOut();
  };

  // ✅ Helper function to get badge count for a nav item based on role
  const getBadgeCount = (href: string): number => {
    const currentRole = role || userRole;

    // Messages badge (for health officers/admins)
    if (href.includes('officer-messages') || href.includes('messages')) {
      return badges.messages;
    }

    // Notifications badge (admin notification management page)
    if (href.includes('notifications')) {
      return badges.notifications;
    }

    // Alerts badge - different meaning based on role:
    // - Students/Parents: unread system notifications (badges.notifications)
    // - Health Officers/Admins: high-risk health reports (badges.alerts)
    if (href.includes('alerts')) {
      if (currentRole === 'student' || currentRole === 'parent') {
        return badges.notifications; // Students see system notification count
      }
      return badges.alerts; // Officers/Admins see high-risk report count
    }

    return 0;
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="h-14 lg:h-16 flex items-center justify-center px-3 lg:px-4 border-b border-border">
        <Link to="/" className="flex items-center gap-2">
          <div className={cn(
            "flex items-center justify-center rounded-xl transition-all",
            collapsed && !mobileOpen ? "bg-primary p-2" : ""
          )}>
            <img src={logo} alt="EPISCAN" className={cn(
              "flex-shrink-0 transition-all",
              collapsed && !mobileOpen ? "h-6 w-6" : "h-7 w-7 lg:h-8 lg:w-8"
            )} />
          </div>
          {(!collapsed || mobileOpen) && (
            <span className="font-heading font-bold text-base lg:text-lg text-foreground">EPISCAN</span>
          )}
        </Link>
        {/* Desktop collapse button */}
        {(!collapsed || mobileOpen) && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 hidden lg:flex ml-auto"
          >
            <ChevronLeft size={16} />
          </Button>
        )}
        {/* Mobile close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(false)}
          className="h-8 w-8 lg:hidden ml-auto"
        >
          <X size={18} />
        </Button>
      </div>

      {/* Expand button when collapsed */}
      {collapsed && !mobileOpen && (
        <div className="hidden lg:flex justify-center py-2 border-b border-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(false)}
            className="h-8 w-8"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-2 lg:p-3 space-y-1 overflow-y-auto">
        {navItems.main.map((item) => {
          const badgeCount = getBadgeCount(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              title={collapsed && !mobileOpen ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg transition-all relative",
                collapsed && !mobileOpen
                  ? "justify-center p-2.5"
                  : "px-3 py-2 lg:py-2.5",
                isActive(item.href)
                  ? collapsed && !mobileOpen
                    ? "bg-primary text-primary-foreground rounded-xl"
                    : "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon size={collapsed && !mobileOpen ? 20 : 18} className="flex-shrink-0 lg:w-5 lg:h-5" />
              {(!collapsed || mobileOpen) && (
                <span className="font-medium text-sm flex-1">{item.label}</span>
              )}
              {/* ✅ ADDED: Real-time notification badge */}
              {badgeCount > 0 && (
                <Badge
                  variant="destructive"
                  className={cn(
                    "h-5 min-w-5 flex items-center justify-center text-xs px-1.5",
                    collapsed && !mobileOpen && "absolute -top-1 -right-1"
                  )}
                >
                  {badgeCount > 99 ? '99+' : badgeCount}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="p-2 lg:p-3 border-t border-border space-y-1">
        {navItems.bottom.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            title={collapsed && !mobileOpen ? item.label : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg transition-all",
              collapsed && !mobileOpen 
                ? "justify-center p-2.5" 
                : "px-3 py-2 lg:py-2.5",
              isActive(item.href)
                ? collapsed && !mobileOpen
                  ? "bg-primary text-primary-foreground rounded-xl"
                  : "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon size={collapsed && !mobileOpen ? 20 : 18} className="flex-shrink-0 lg:w-5 lg:h-5" />
            {(!collapsed || mobileOpen) && (
              <span className="font-medium text-sm">{item.label}</span>
            )}
          </Link>
        ))}
        <button
          onClick={handleLogout}
          title={collapsed && !mobileOpen ? "Log out" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-lg text-destructive hover:bg-destructive/10 transition-all w-full",
            collapsed && !mobileOpen 
              ? "justify-center p-2.5" 
              : "px-3 py-2 lg:py-2.5"
          )}
        >
          <LogOut size={collapsed && !mobileOpen ? 20 : 18} className="flex-shrink-0 lg:w-5 lg:h-5" />
          {(!collapsed || mobileOpen) && (
            <span className="font-medium text-sm">Log out</span>
          )}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b border-border z-50 flex items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="EPISCAN" className="h-7 w-7" />
          <span className="font-heading font-bold text-base text-foreground">EPISCAN</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
          className="h-9 w-9"
        >
          <Menu size={20} />
        </Button>
      </header>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "lg:hidden fixed left-0 top-0 h-full w-64 bg-card border-r border-border z-50 flex flex-col transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex fixed left-0 top-0 h-full bg-card border-r border-border z-40 flex-col transition-all duration-300",
          collapsed ? "w-16" : "w-60"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 transition-all duration-300 pt-14 lg:pt-0",
          collapsed ? "lg:ml-16" : "lg:ml-60"
        )}
      >
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;