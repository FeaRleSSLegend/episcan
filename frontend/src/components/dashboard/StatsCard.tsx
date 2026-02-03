import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: ReactNode;
  iconColor?: string;
}

const StatsCard = ({ 
  title, 
  value, 
  change, 
  changeType = "neutral", 
  icon,
  iconColor = "bg-primary/10 text-primary" 
}: StatsCardProps) => {
  return (
    <div className="bg-card rounded-lg sm:rounded-xl border border-border p-3 sm:p-4 lg:p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-muted-foreground mb-0.5 sm:mb-1 truncate">{title}</p>
          <p className="font-heading text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-foreground truncate">{value}</p>
          {change && (
            <p className={cn(
              "text-xs sm:text-sm mt-1 sm:mt-2 font-medium truncate",
              changeType === "positive" && "text-success",
              changeType === "negative" && "text-destructive",
              changeType === "neutral" && "text-muted-foreground"
            )}>
              {change}
            </p>
          )}
        </div>
        <div className={cn(
          "w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0",
          iconColor
        )}>
          <div className="[&>svg]:h-4 [&>svg]:w-4 sm:[&>svg]:h-5 sm:[&>svg]:w-5 lg:[&>svg]:h-6 lg:[&>svg]:w-6">
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;