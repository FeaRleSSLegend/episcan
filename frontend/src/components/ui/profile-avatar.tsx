/**
 * ProfileAvatar Component
 * =======================
 *
 * Dynamic avatar that displays user initials based on full_name from profiles table.
 * Falls back to avatar_url if available.
 */

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, getAvatarColorClass } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface ProfileAvatarProps {
  fullName?: string | null;
  avatarUrl?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

export function ProfileAvatar({
  fullName,
  avatarUrl,
  className,
  size = "md",
}: ProfileAvatarProps) {
  const initials = getInitials(fullName);
  const colorClass = getAvatarColorClass(fullName);

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName || "User"} />}
      <AvatarFallback className={cn(colorClass, "text-white font-semibold")}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

export default ProfileAvatar;
