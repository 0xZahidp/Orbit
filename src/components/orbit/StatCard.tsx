import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import * as Icons from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: keyof typeof Icons;
  accent?: "cyan" | "violet" | "success" | "warning";
  className?: string;
}

const accentMap = {
  cyan: "text-cyan bg-cyan/12",
  violet: "text-violet bg-violet/12",
  success: "text-success bg-success/12",
  warning: "text-warning bg-warning/12",
};

export function StatCard({ label, value, hint, icon, accent = "cyan", className }: StatCardProps) {
  const Icon = Icons[icon] as React.ComponentType<{ className?: string }>;
  return (
    <Card
      className={cn(
        "glass group relative overflow-hidden rounded-2xl border-border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-3xl font-bold tracking-tight">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div
          className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl", accentMap[accent])}
        >
          {Icon && <Icon className="h-5 w-5" />}
        </div>
      </div>
    </Card>
  );
}
