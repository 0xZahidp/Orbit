import { Link, useRouterState } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import { OrbitLogo } from "./OrbitLogo";
import { GradientAvatar } from "./GradientAvatar";
import { currentUser, userStats } from "@/lib/demo-data";

type NavItem = {
  label: string;
  to:
    | "/app"
    | "/app/groups"
    | "/app/payments"
    | "/app/activity"
    | "/app/achievements"
    | "/app/notifications"
    | "/app/settings";
  icon: keyof typeof Icons;
  exact?: boolean;
};

const nav: NavItem[] = [
  { label: "Overview", to: "/app", icon: "LayoutDashboard", exact: true },
  { label: "My Groups", to: "/app/groups", icon: "Boxes" },
  { label: "Payments", to: "/app/payments", icon: "Wallet" },
  { label: "Activity", to: "/app/activity", icon: "Activity" },
  { label: "Achievements", to: "/app/achievements", icon: "Trophy" },
  { label: "Notifications", to: "/app/notifications", icon: "Bell" },
  { label: "Settings", to: "/app/settings", icon: "Settings" },
];

const mobileNav: NavItem[] = [
  { label: "Overview", to: "/app", icon: "LayoutDashboard", exact: true },
  { label: "Groups", to: "/app/groups", icon: "Boxes" },
  { label: "Payments", to: "/app/payments", icon: "Wallet" },
  { label: "Activity", to: "/app/activity", icon: "Activity" },
  { label: "Profile", to: "/app/settings", icon: "User" },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl lg:flex">
      <div className="px-5 py-5">
        <Link to="/">
          <OrbitLogo />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {nav.map((item) => {
          const Icon = Icons[item.icon] as React.ComponentType<{ className?: string }>;
          const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[var(--glow-cyan)]"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground",
              )}
            >
              <Icon className={cn("h-4.5 w-4.5", active && "text-cyan")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="m-3 rounded-2xl glass p-4">
        <div className="flex items-center gap-3">
          <GradientAvatar name={currentUser.name} gradient={currentUser.avatarGradient} size={40} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{currentUser.name}</p>
            <p className="text-xs text-cyan">{userStats.orbitPoints} OP</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border bg-background/90 px-2 py-2 backdrop-blur-xl lg:hidden">
      {mobileNav.map((item) => {
        const Icon = Icons[item.icon] as React.ComponentType<{ className?: string }>;
        const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-medium",
              active ? "text-cyan" : "text-muted-foreground",
            )}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
