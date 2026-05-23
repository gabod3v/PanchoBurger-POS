import * as React from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  className?: string;
}

function StatCard({ label, value, icon: Icon, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-card text-card-foreground rounded-lg border border-border/50 shadow-sm p-4 flex flex-col gap-1",
        className,
      )}
    >
      {Icon && (
        <div className="mb-1">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted">
            <Icon size={18} className="text-muted-foreground" />
          </div>
        </div>
      )}
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <span className="text-2xl font-bold font-display">{value}</span>
    </div>
  );
}

export { StatCard };
