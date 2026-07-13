import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  timeAgo,
  type AppNotification,
} from "@/lib/orbit-api";

export const Route = createFileRoute("/app/notifications")({
  component: NotificationsPage,
});

const kindIcon: Record<string, { icon: keyof typeof Icons; tone: string }> = {
  invite: { icon: "Mail", tone: "text-cyan bg-cyan/12" },
  due: { icon: "CalendarClock", tone: "text-warning bg-warning/12" },
  approved: { icon: "CircleCheck", tone: "text-success bg-success/12" },
  rejected: { icon: "CircleX", tone: "text-danger bg-danger/12" },
  renewal: { icon: "RefreshCw", tone: "text-violet bg-violet/12" },
  badge: { icon: "Award", tone: "text-cyan bg-cyan/12" },
  member: { icon: "UserPlus", tone: "text-violet bg-violet/12" },
};

function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchNotifications(50),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["notifications"] });

  const markAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: invalidate,
  });
  const markOne = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: invalidate,
  });

  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="mt-1 text-muted-foreground">Stay on top of dues, approvals and renewals.</p>
        </div>
        <Button
          variant="secondary"
          className="rounded-xl"
          disabled={unread === 0 || markAll.isPending}
          onClick={() => markAll.mutate()}
        >
          Mark all read
        </Button>
      </div>

      <Card className="glass overflow-hidden rounded-3xl border-border">
        {isLoading && <p className="p-8 text-center text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && items.length === 0 && (
          <div className="flex flex-col items-center gap-2 p-12 text-center">
            <Icons.BellOff className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">You're all caught up</p>
            <p className="text-sm text-muted-foreground">
              Approvals, rejections and reminders will appear here.
            </p>
          </div>
        )}
        {items.map((n: AppNotification) => {
          const meta = kindIcon[n.kind] ?? kindIcon.member;
          const Icon = Icons[meta.icon] as React.ComponentType<{ className?: string }>;
          return (
            <button
              key={n.id}
              onClick={() => !n.read && markOne.mutate(n.id)}
              className={cn(
                "flex w-full items-start gap-4 border-b border-border/60 p-4 text-left last:border-0 transition-colors hover:bg-secondary/40",
                !n.read && "bg-secondary/30",
              )}
            >
              <div
                className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", meta.tone)}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{n.title}</p>
                {n.body && <p className="text-sm text-muted-foreground">{n.body}</p>}
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(n.createdAt)}</span>
              {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cyan" />}
            </button>
          );
        })}
      </Card>
    </div>
  );
}
