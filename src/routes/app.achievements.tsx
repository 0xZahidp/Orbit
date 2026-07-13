import { createFileRoute } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { ProgressRing } from "@/components/orbit/ProgressRing";
import { badges, groupAchievements, userStats } from "@/lib/demo-data";

export const Route = createFileRoute("/app/achievements")({
  component: AchievementsPage,
});

function AchievementsPage() {
  const earned = badges.filter((b) => b.earned).length;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Achievements</h1>
        <p className="mt-1 text-muted-foreground">
          Orbit Points reward reliability — never money, never public shame.
        </p>
      </div>

      <Card className="glass flex flex-wrap items-center gap-8 rounded-3xl border-border p-6">
        <ProgressRing value={earned / badges.length} size={130} strokeWidth={11} variant="violet">
          <div>
            <p className="font-display text-3xl font-bold text-cyan">{userStats.orbitPoints}</p>
            <p className="text-xs text-muted-foreground">Orbit Points</p>
          </div>
        </ProgressRing>
        <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4">
          <Metric label="Current streak" value={`${userStats.streak} mo`} />
          <Metric label="Badges" value={`${earned}/${badges.length}`} />
          <Metric label="Groups managed" value={`${userStats.groupsManaged}`} />
          <Metric label="Reliability" value={`${userStats.reliability}%`} />
        </div>
      </Card>

      <section>
        <h2 className="mb-4 font-display text-xl font-bold">Personal badges</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {badges.map((b) => {
            const Icon = Icons[b.icon as keyof typeof Icons] as React.ComponentType<{
              className?: string;
            }>;
            return (
              <Card
                key={b.id}
                className={cn(
                  "glass flex items-center gap-4 rounded-3xl border-border p-5",
                  !b.earned && "opacity-50",
                )}
              >
                <div
                  className={cn(
                    "grid h-14 w-14 shrink-0 place-items-center rounded-2xl",
                    b.earned
                      ? "bg-gradient-to-br from-cyan to-violet text-primary-foreground shadow-[var(--glow-cyan)]"
                      : "bg-secondary text-muted-foreground",
                  )}
                >
                  <Icon className="h-7 w-7" />
                </div>
                <div>
                  <p className="font-display font-bold">{b.name}</p>
                  <p className="text-xs text-muted-foreground">{b.description}</p>
                  <p
                    className={cn(
                      "mt-1 text-xs font-semibold",
                      b.earned ? "text-success" : "text-muted-foreground",
                    )}
                  >
                    {b.earned ? "Unlocked" : "Locked"}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl font-bold">Group achievements</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {groupAchievements.map((a) => {
            const Icon = Icons[a.icon as keyof typeof Icons] as React.ComponentType<{
              className?: string;
            }>;
            return (
              <Card
                key={a.id}
                className={cn(
                  "glass rounded-3xl border-border p-5 text-center",
                  !a.earned && "opacity-50",
                )}
              >
                <div
                  className={cn(
                    "mx-auto grid h-12 w-12 place-items-center rounded-2xl",
                    a.earned
                      ? "bg-gradient-to-br from-success to-cyan text-primary-foreground"
                      : "bg-secondary text-muted-foreground",
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <p className="mt-3 text-sm font-bold">{a.name}</p>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-secondary/40 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-xl font-bold">{value}</p>
    </div>
  );
}
