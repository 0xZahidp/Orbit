import { Link } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { ProgressRing } from "./ProgressRing";
import { RoleBadge, StatusBadge } from "./StatusBadge";
import { taka, relativeDue } from "@/lib/format";
import type { Group } from "@/lib/demo-data";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function ManagedGroupCard({ group }: { group: Group }) {
  const Icon = (Icons[group.icon as keyof typeof Icons] ?? Icons.Boxes) as React.ComponentType<{
    className?: string;
  }>;
  const seats = group.members.filter((m) => m.status === "active").length;
  const ratio = group.collected / group.monthlyTotal;

  return (
    <Card className="glass group relative overflow-hidden rounded-3xl border-border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card)]">
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-primary-foreground",
            group.gradient,
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-display text-lg font-bold">{group.name}</h3>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <RoleBadge role={group.myRole} />
            <span className="truncate text-xs text-muted-foreground">
              Seats {seats}/{group.maxSeats} · Renews {relativeDue(group.renewalDate)}
            </span>
          </div>
        </div>
        <ProgressRing
          value={ratio}
          size={56}
          strokeWidth={6}
          variant={ratio >= 1 ? "success" : "cyan"}
        >
          <span className="text-[11px] font-bold">{Math.round(ratio * 100)}%</span>
        </ProgressRing>
      </div>

      <div className="mt-5 flex items-end justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Collection</p>
          <p className="font-display text-xl font-bold">
            {taka(group.collected)}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              / {taka(group.monthlyTotal)}
            </span>
          </p>
        </div>
        {group.pendingApprovals > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-2.5 py-1 text-xs font-semibold text-warning">
            <Icons.Clock className="h-3.5 w-3.5" /> {group.pendingApprovals} pending
          </span>
        )}
      </div>

      <Button asChild variant="secondary" className="mt-5 w-full rounded-xl">
        <Link to="/app/groups/$groupId" params={{ groupId: group.id }}>
          Manage group
        </Link>
      </Button>
    </Card>
  );
}

export function MemberGroupCard({ group }: { group: Group }) {
  const { user } = useAuth();
  const Icon = (Icons[group.icon as keyof typeof Icons] ?? Icons.Boxes) as React.ComponentType<{
    className?: string;
  }>;
  const me = group.members.find((m) => m.person.id === user?.id) ?? group.members[0];
  if (!me) return null;

  return (
    <Card className="glass group relative overflow-hidden rounded-3xl border-border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card)]">
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-primary-foreground",
            group.gradient,
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-lg font-bold">{group.name}</h3>
          <p className="text-sm text-muted-foreground">
            {taka(me.monthlyShare)}/mo · {relativeDue(group.dueDate)}
          </p>
        </div>
        <StatusBadge status={me.paymentStatus} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-secondary/50 p-3">
          <p className="text-xs text-muted-foreground">Months paid</p>
          <p className="font-display text-lg font-bold">{me.monthsPaid}</p>
        </div>
        <div className="rounded-xl bg-secondary/50 p-3">
          <p className="text-xs text-muted-foreground">Streak</p>
          <p className="font-display text-lg font-bold">{me.streak} mo</p>
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <Button
          asChild
          className="flex-1 rounded-xl"
          variant={me.paymentStatus === "approved" ? "secondary" : "cyan"}
        >
          <Link to="/app/groups/$groupId" params={{ groupId: group.id }}>
            {me.paymentStatus === "approved" ? "View group" : "Submit payment"}
          </Link>
        </Button>
      </div>
    </Card>
  );
}
