import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GradientAvatar } from "./GradientAvatar";
import { OrbitLogo } from "./OrbitLogo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { fetchNotifications, timeAgo } from "@/lib/orbit-api";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export function TopBar() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchNotifications(10),
    enabled: !!user,
    refetchInterval: 30000,
  });
  const unread = notifications.filter((n) => !n.read).length;

  const name = profile?.display_name || user?.email?.split("@")[0] || "Orbit Member";
  const email = user?.email || "";
  const gradient = profile?.avatar_gradient || "from-cyan to-violet";

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth/sign-in", replace: true });
  }

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/70 px-4 py-3 backdrop-blur-xl lg:px-8">
      <Link to="/" className="lg:hidden">
        <OrbitLogo showWord={false} />
      </Link>

      <div className="relative hidden max-w-md flex-1 md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search groups, members, payments…"
          className="rounded-xl border-border bg-secondary/50 pl-9"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button asChild variant="hero" size="sm" className="rounded-xl">
          <Link to="/app/create">
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Create Group</span>
          </Link>
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative rounded-xl">
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-cyan text-[10px] font-bold text-cyan-foreground">
                  {unread}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 rounded-2xl border-border bg-popover p-0">
            <div className="flex items-center justify-between px-4 py-3">
              <p className="font-display font-bold">Notifications</p>
              <Link to="/app/notifications" className="text-xs text-cyan hover:underline">
                View all
              </Link>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 && (
                <p className="border-t border-border px-4 py-6 text-center text-xs text-muted-foreground">
                  No notifications yet
                </p>
              )}
              {notifications.slice(0, 5).map((n) => (
                <div
                  key={n.id}
                  className="flex gap-3 border-t border-border px-4 py-3 hover:bg-secondary/40"
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${!n.read ? "bg-cyan" : "bg-muted"}`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{n.body}</p>
                  </div>
                  <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
                    {timeAgo(n.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full outline-none ring-cyan/40 focus-visible:ring-2">
              <GradientAvatar name={name} gradient={gradient} size={38} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl border-border bg-popover">
            <DropdownMenuLabel>
              <p className="font-semibold">{name}</p>
              <p className="text-xs font-normal text-muted-foreground">{email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/app/settings">Profile & settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/app/achievements">Achievements</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleSignOut}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
