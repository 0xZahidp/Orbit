import { cn } from "@/lib/utils";
import type { PaymentStatus } from "@/lib/demo-data";

const map: Record<PaymentStatus, { label: string; className: string }> = {
  not_due: { label: "Not due", className: "bg-muted text-muted-foreground" },
  due_soon: { label: "Due soon", className: "bg-warning/15 text-warning border border-warning/30" },
  submitted: {
    label: "Awaiting approval",
    className: "bg-cyan/15 text-cyan border border-cyan/30",
  },
  approved: { label: "Approved", className: "bg-success/15 text-success border border-success/30" },
  rejected: { label: "Rejected", className: "bg-danger/15 text-danger border border-danger/30" },
  overdue: { label: "Overdue", className: "bg-danger/15 text-danger border border-danger/30" },
  waived: { label: "Waived", className: "bg-muted text-muted-foreground" },
  credited: { label: "Credited", className: "bg-violet/15 text-violet border border-violet/30" },
};

export function StatusBadge({ status, className }: { status: PaymentStatus; className?: string }) {
  const s = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        s.className,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {s.label}
    </span>
  );
}

const roleMap = {
  owner: { label: "Owner", className: "bg-violet/15 text-violet border border-violet/30" },
  co_manager: { label: "Co-manager", className: "bg-cyan/15 text-cyan border border-cyan/30" },
  member: { label: "Member", className: "bg-muted text-muted-foreground border border-border" },
} as const;

export function RoleBadge({ role, className }: { role: keyof typeof roleMap; className?: string }) {
  const r = roleMap[role];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        r.className,
        className,
      )}
    >
      {r.label}
    </span>
  );
}
