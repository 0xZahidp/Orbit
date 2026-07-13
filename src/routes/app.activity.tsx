import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import * as Icons from "lucide-react";
import { Card } from "@/components/ui/card";
import { GradientAvatar } from "@/components/orbit/GradientAvatar";
import { fetchGlobalActivity } from "@/lib/orbit-api";

export const Route = createFileRoute("/app/activity")({
  component: ActivityPage,
});

const icons: Record<string, keyof typeof Icons> = {
  payment_submitted: "Upload",
  payment_approved: "CircleCheck",
  badge: "Award",
  renewal: "RefreshCw",
  member_joined: "UserPlus",
  reminder: "BellRing",
  cycle_closed: "CalendarCheck",
  bulk_review: "ListChecks",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function ActivityPage() {
  const { data: feed = [], isLoading } = useQuery({
    queryKey: ["global-activity"],
    queryFn: fetchGlobalActivity,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Activity</h1>
        <p className="mt-1 text-muted-foreground">Everything happening across your circles.</p>
      </div>

      <Card className="glass rounded-3xl border-border p-6">
        {isLoading ? (
          <div className="grid place-items-center py-10 text-muted-foreground">
            <Icons.Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : feed.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-dashed border-border py-14 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-muted-foreground">
              <Icons.Clock className="h-7 w-7" />
            </div>
            <p className="mt-3 font-display text-lg font-bold">Nothing yet</p>
            <p className="text-sm text-muted-foreground">
              Payments, approvals and new members show up here.
            </p>
          </div>
        ) : (
          <div className="relative space-y-6 pl-6">
            <div className="absolute left-2 top-1 bottom-1 w-px bg-border" />
            {feed.map((a) => {
              const Icon = Icons[icons[a.type] ?? "Circle"] as React.ComponentType<{
                className?: string;
              }>;
              return (
                <div key={a.id} className="relative">
                  <div className="absolute -left-6 grid h-4 w-4 place-items-center rounded-full bg-cyan text-cyan-foreground ring-4 ring-background">
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <GradientAvatar name={a.groupName} gradient={a.gradient} size={26} />
                    <Icon className="h-4 w-4 text-cyan" />
                    <p className="text-sm">{a.text}</p>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                      {a.groupName}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {timeAgo(a.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
