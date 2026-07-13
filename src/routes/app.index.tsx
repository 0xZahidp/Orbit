import { createFileRoute, Link } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/orbit/StatCard";
import { ProgressRing } from "@/components/orbit/ProgressRing";
import { ManagedGroupCard, MemberGroupCard } from "@/components/orbit/GroupCard";
import { relativeDue } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { fetchMyGroups, deriveStats } from "@/lib/orbit-api";

export const Route = createFileRoute("/app/")({
  component: Overview,
});

const timelineTone: Record<string, string> = {
  due: "text-warning bg-warning/12",
  renewal: "text-violet bg-violet/12",
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function Overview() {
  const { user, profile } = useAuth();
  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: fetchMyGroups,
  });

  const stats = deriveStats(groups, user?.id ?? "");
  const managed = groups.filter((g) => g.myRole === "owner" || g.myRole === "co_manager");
  const joined = groups.filter((g) => g.myRole === "member");
  const firstName = (profile?.display_name || user?.email?.split("@")[0] || "there").split(" ")[0];
  const reliability = groups.length
    ? Math.round(
        (groups.filter((g) => {
          const me = g.members.find((m) => m.person.id === user?.id);
          return me?.paymentStatus === "approved";
        }).length /
          groups.length) *
          100,
      )
    : 100;

  type UpcomingItem = {
    id: string;
    label: string;
    date: string;
    group: string;
    kind: "due" | "renewal";
  };
  const upcoming: UpcomingItem[] = [
    ...groups
      .filter((g) => g.renewalDate)
      .map((g): UpcomingItem => ({
        id: g.id,
        label: `${g.name} renewal`,
        date: g.renewalDate,
        group: g.name,
        kind: "renewal",
      })),
    ...groups
      .filter((g) => g.dueDate)
      .map((g): UpcomingItem => ({
        id: g.id + "-due",
        label: `${g.name} payment`,
        date: g.dueDate,
        group: g.name,
        kind: "due",
      })),
  ]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="animate-fade-up">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {greeting()}, {firstName}
        </h1>
        <p className="mt-1 text-muted-foreground">Your circles are running smoothly.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Orbit Points"
          value={`${stats.orbitPoints}`}
          hint="Across all groups"
          icon="Sparkles"
          accent="cyan"
        />
        <StatCard
          label="Current streak"
          value={`${stats.streak} mo`}
          hint="Personal best"
          icon="Flame"
          accent="warning"
        />
        <StatCard
          label="Active groups"
          value={`${stats.activeGroups}`}
          hint={`${stats.groupsManaged} managed`}
          icon="Boxes"
          accent="violet"
        />
        <StatCard
          label="Upcoming dues"
          value={`${stats.upcomingDues}`}
          hint="Awaiting payment"
          icon="CalendarClock"
          accent="success"
        />
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-24 text-muted-foreground">
          <Icons.Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : groups.length === 0 ? (
        <Card className="glass grid place-items-center rounded-3xl border border-dashed border-border py-16 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-muted-foreground">
            <Icons.Boxes className="h-7 w-7" />
          </div>
          <p className="mt-3 font-display text-lg font-bold">Start your first orbit</p>
          <p className="text-sm text-muted-foreground">
            Create a shared plan and invite your circle.
          </p>
          <Button asChild variant="hero" className="mt-4 rounded-xl">
            <Link to="/app/create">
              <Icons.Plus className="h-4 w-4" /> Create Group
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-8 xl:grid-cols-3">
          <div className="space-y-8 xl:col-span-2">
            {managed.length > 0 && (
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-display text-xl font-bold">Managed by You</h2>
                  <Button asChild variant="ghost" size="sm" className="text-cyan">
                    <Link to="/app/groups">View all</Link>
                  </Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {managed.map((g) => (
                    <ManagedGroupCard key={g.id} group={g} />
                  ))}
                </div>
              </section>
            )}

            {joined.length > 0 && (
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-display text-xl font-bold">You're a Member</h2>
                  <Button asChild variant="ghost" size="sm" className="text-cyan">
                    <Link to="/app/groups">View all</Link>
                  </Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {joined.map((g) => (
                    <MemberGroupCard key={g.id} group={g} />
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="space-y-6">
            <Card className="glass overflow-hidden rounded-3xl border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Reliability</p>
                  <p className="font-display text-3xl font-bold text-success">{reliability}%</p>
                  <p className="mt-1 text-xs text-muted-foreground">Private to you</p>
                </div>
                <ProgressRing value={reliability / 100} size={92} variant="success">
                  <div>
                    <p className="font-display text-lg font-bold">{stats.streak}</p>
                    <p className="text-[10px] text-muted-foreground">streak</p>
                  </div>
                </ProgressRing>
              </div>
              <Button asChild variant="outlineGlow" className="mt-5 w-full rounded-xl">
                <Link to="/app/achievements">View achievements</Link>
              </Button>
            </Card>

            <Card className="glass rounded-3xl border-border p-6">
              <h3 className="mb-4 font-display text-lg font-bold">Upcoming</h3>
              {upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing scheduled yet.</p>
              ) : (
                <div className="space-y-4">
                  {upcoming.map((t) => {
                    const Icon = t.kind === "renewal" ? Icons.RefreshCw : Icons.Wallet;
                    return (
                      <div key={t.id} className="flex items-center gap-3">
                        <div
                          className={cn(
                            "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                            timelineTone[t.kind],
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{t.label}</p>
                          <p className="text-xs text-muted-foreground">{t.group}</p>
                        </div>
                        <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                          {relativeDue(t.date)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
