import { createFileRoute, Link } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { OrbitLogo } from "@/components/orbit/OrbitLogo";
import { AmbientBackground } from "@/components/orbit/AmbientBackground";
import { ProgressRing } from "@/components/orbit/ProgressRing";
import { RoleBadge, StatusBadge } from "@/components/orbit/StatusBadge";
import { taka } from "@/lib/format";

export const Route = createFileRoute("/")({
  component: Landing,
});

const providers = [
  { name: "YouTube Premium", icon: "Play", gradient: "from-danger to-violet" },
  { name: "Spotify", icon: "Music", gradient: "from-success to-cyan" },
  { name: "Flat Wi-Fi", icon: "Wifi", gradient: "from-cyan to-violet" },
  { name: "Canva", icon: "Palette", gradient: "from-violet to-cyan" },
  { name: "Google One", icon: "Cloud", gradient: "from-warning to-danger" },
];

const features = [
  {
    icon: "Wallet",
    title: "Track every payment",
    text: "Submissions, approvals, receipts and history — always reconciled.",
  },
  {
    icon: "Users",
    title: "Run groups without confusion",
    text: "Roles, shares and cycles are crystal clear for everyone.",
  },
  {
    icon: "Trophy",
    title: "Reward reliable members",
    text: "Orbit Points and badges celebrate on-time payers, privately.",
  },
  {
    icon: "CalendarClock",
    title: "Keep renewals on time",
    text: "Smart reminders for dues, approvals and renewal dates.",
  },
];

function Landing() {
  return (
    <div className="relative min-h-screen">
      <AmbientBackground />

      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
          <OrbitLogo />
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">
              Features
            </a>
            <a href="#roles" className="hover:text-foreground">
              Roles
            </a>
            <a href="#providers" className="hover:text-foreground">
              Plans
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="rounded-xl">
              <Link to="/auth/sign-in">Sign in</Link>
            </Button>
            <Button asChild variant="hero" className="rounded-xl">
              <Link to="/auth/sign-up">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 pt-16 lg:px-8 lg:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 text-xs font-semibold text-cyan">
              <Icons.Sparkles className="h-3.5 w-3.5" /> Shared plans, clearly managed
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Keep every shared plan <span className="text-gradient">in orbit.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              Manage memberships, recurring dues, payment approvals, reminders, and group history in
              one place.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="hero" size="lg" className="rounded-xl">
                <Link to="/auth/sign-up">
                  <Icons.Plus className="h-4 w-4" /> Create a Group
                </Link>
              </Button>
              <Button asChild variant="outlineGlow" size="lg" className="rounded-xl">
                <Link to="/app">
                  Explore Demo <Icons.ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div id="providers" className="mt-10 flex flex-wrap gap-2">
              {providers.map((p) => {
                const Icon = Icons[p.icon as keyof typeof Icons] as React.ComponentType<{
                  className?: string;
                }>;
                return (
                  <span
                    key={p.name}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs font-medium"
                  >
                    <span
                      className={cn(
                        "grid h-5 w-5 place-items-center rounded-md bg-gradient-to-br text-primary-foreground",
                        p.gradient,
                      )}
                    >
                      <Icon className="h-3 w-3" />
                    </span>
                    {p.name}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Dashboard preview */}
          <div className="animate-float">
            <DashboardPreview />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Everything a shared plan needs
          </h2>
          <p className="mt-3 text-muted-foreground">
            From first invite to final renewal, Orbit keeps the money and the people in sync.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => {
            const Icon = Icons[f.icon as keyof typeof Icons] as React.ComponentType<{
              className?: string;
            }>;
            return (
              <Card
                key={f.title}
                className="glass rounded-3xl border-border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card)]"
              >
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan to-violet text-primary-foreground">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Roles are group-specific */}
      <section id="roles" className="mx-auto max-w-7xl px-4 pb-24 lg:px-8">
        <Card className="glass overflow-hidden rounded-4xl border-border p-8 lg:p-12">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight">
                One person, many roles
              </h2>
              <p className="mt-3 text-muted-foreground">
                Roles are group-specific. Be the manager of one plan and a member of another — Orbit
                keeps them separate and clear.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "Manage YouTube Premium Family with 6 seats",
                  "Be a trusted member in someone's Spotify Family",
                  "Co-manage a Canva Pro Team",
                ].map((t) => (
                  <li key={t} className="flex items-center gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-success/15 text-success">
                      <Icons.Check className="h-3.5 w-3.5" />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid gap-4">
              <Card className="rounded-3xl border-border bg-card/70 p-5">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-danger to-violet text-primary-foreground">
                    <Icons.Play className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-display font-bold">YouTube Premium Family</p>
                    <p className="text-xs text-muted-foreground">You're the manager</p>
                  </div>
                  <RoleBadge role="owner" />
                </div>
              </Card>
              <Card className="rounded-3xl border-border bg-card/70 p-5">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-success to-cyan text-primary-foreground">
                    <Icons.Music className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-display font-bold">Spotify Family</p>
                    <p className="text-xs text-muted-foreground">You're a member</p>
                  </div>
                  <RoleBadge role="member" />
                </div>
              </Card>
            </div>
          </div>
        </Card>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-24 lg:px-8">
        <Card className="glass relative overflow-hidden rounded-4xl border-border p-10 text-center lg:p-16">
          <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Bring your shared plans into orbit
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Free to start. Set up your first group in under two minutes.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild variant="hero" size="lg" className="rounded-xl">
              <Link to="/auth/sign-up">Create a Group</Link>
            </Button>
            <Button asChild variant="outlineGlow" size="lg" className="rounded-xl">
              <Link to="/app">Explore Demo</Link>
            </Button>
          </div>
        </Card>
      </section>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row lg:px-8">
          <OrbitLogo />
          <p>Orbit manages shared costs and records, not provider accounts or credentials.</p>
        </div>
      </footer>
    </div>
  );
}

function DashboardPreview() {
  return (
    <Card className="glass rounded-4xl border-border p-5 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="font-display text-lg font-bold">Good evening, Zahid</p>
          <p className="text-xs text-muted-foreground">Your circles are running smoothly.</p>
        </div>
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <MiniCard label="Orbit Points" value="940" tone="text-cyan" />
        <MiniCard label="Streak" value="11 mo" tone="text-warning" />
        <MiniCard label="Groups" value="4" tone="text-violet" />
      </div>

      <Card className="mt-3 rounded-2xl border-border bg-card/70 p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-danger to-violet text-primary-foreground">
            <Icons.Play className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">YouTube Premium Family</p>
            <p className="text-xs text-muted-foreground">
              Seats 6/6 · {taka(580)} / {taka(695)}
            </p>
          </div>
          <ProgressRing value={580 / 695} size={48} strokeWidth={6}>
            <span className="text-[10px] font-bold">83%</span>
          </ProgressRing>
        </div>
      </Card>

      <Card className="mt-3 rounded-2xl border-border bg-card/70 p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-success to-cyan text-primary-foreground">
            <Icons.Music className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">Spotify Family</p>
            <p className="text-xs text-muted-foreground">{taka(85)}/mo · 8 months paid</p>
          </div>
          <StatusBadge status="approved" />
        </div>
      </Card>
    </Card>
  );
}

function MiniCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/70 p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={cn("font-display text-lg font-bold", tone)}>{value}</p>
    </div>
  );
}
