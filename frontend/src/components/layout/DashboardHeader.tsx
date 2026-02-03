import { Bell, Search, LogOut, Settings, ChevronDown, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BackButton from "@/components/ui/back-button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import ProfileAvatar from "@/components/ui/profile-avatar";
import { useNotifications } from "@/hooks/useNotifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
}

const DashboardHeader = ({ title, subtitle, showBackButton = true }: DashboardHeaderProps) => {
  const { profile, signOut, role } = useAuth();
  const navigate = useNavigate();

  // ✅ FIXED: Use real notifications hook instead of mock data
  const { notifications, unreadCount, loading } = useNotifications();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="h-auto min-h-14 sm:min-h-16 bg-card border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between px-3 sm:px-6 py-2 sm:py-0 gap-2 sm:gap-0">
      {/* Left Section - Back Button and Title */}
      <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
        {showBackButton && <BackButton fallbackPath="/dashboard" />}
        <div className="min-w-0 flex-1 sm:flex-initial">
          <h1 className="font-heading text-base sm:text-xl font-bold text-foreground truncate">{title}</h1>
          {subtitle && <p className="text-xs sm:text-sm text-muted-foreground truncate">{subtitle}</p>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 sm:gap-4 self-end sm:self-auto">
        {/* Search - Hidden on mobile */}
        <div className="hidden lg:flex relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-9 w-48 xl:w-64 h-9"
          />
        </div>

        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-8 w-8 sm:h-10 sm:w-10">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-2 h-2 bg-destructive rounded-full" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 sm:w-80 p-0" align="end">
            <div className="p-3 sm:p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm sm:text-base">Notifications</h4>
                {unreadCount > 0 && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
            </div>
            <ScrollArea className="h-64 sm:h-72">
              {loading ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No notifications
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 sm:p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                        !notification.read ? "bg-primary/5" : ""
                      }`}
                      onClick={() => notification.link && navigate(notification.link)}
                    >
                      <div className="flex items-start gap-2 sm:gap-3">
                        {notification.type === 'alert' && (
                          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                        )}
                        {!notification.read && notification.type !== 'alert' && (
                          <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                        )}
                        <div className={(!notification.read && notification.type !== 'alert') ? "" : "ml-4 sm:ml-5"}>
                          <p className="text-xs sm:text-sm font-medium">{notification.title}</p>
                          {notification.message && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-0.5">{notification.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            <div className="p-2 border-t border-border">
              <Button variant="ghost" size="sm" className="w-full text-xs sm:text-sm">
                View all notifications
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-1 sm:gap-2 p-1 sm:p-2 h-auto">
              {/* ✅ FIXED: Dynamic avatar with user initials */}
              <ProfileAvatar
                fullName={profile?.full_name}
                avatarUrl={profile?.avatar_url}
                size="sm"
              />
              <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 sm:w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium truncate">{profile?.full_name || "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
                {role && (
                  <span className="text-xs text-primary capitalize">{role.replace("_", " ")}</span>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/dashboard/settings")} className="text-sm">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive text-sm">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default DashboardHeader;
