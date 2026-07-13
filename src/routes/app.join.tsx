import { useState, useEffect } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Icons from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { taka } from "@/lib/format";
import { previewGroupByCode, joinGroupByCode, type GroupPreview } from "@/lib/orbit-api";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/app/join")({
  validateSearch: (search: Record<string, unknown>) => ({
    code: typeof search.code === "string" ? search.code : "",
  }),
  component: JoinPage,
});

function JoinPage() {
  const { code: initialCode } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [code, setCode] = useState(initialCode ?? "");
  const [preview, setPreview] = useState<GroupPreview | null>(null);
  const [checking, setChecking] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [autoJoined, setAutoJoined] = useState(false);

  const join = useMutation({
    mutationFn: () => joinGroupByCode(code),
    onSuccess: (groupId) => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast.success("You're in orbit", {
        description: `Welcome to ${preview?.name ?? "the group"}.`,
      });
      navigate({ to: "/app/groups/$groupId", params: { groupId } });
    },
    onError: (err) =>
      toast.error("Couldn't join", {
        description: err instanceof Error ? err.message : "Check the code and try again.",
      }),
  });

  async function lookup(value: string) {
    const clean = value.trim();
    if (clean.length < 4) {
      setPreview(null);
      setNotFound(false);
      return;
    }
    setChecking(true);
    setNotFound(false);
    try {
      const p = await previewGroupByCode(clean);
      setPreview(p);
      setNotFound(!p);
    } catch {
      setPreview(null);
      setNotFound(true);
    } finally {
      setChecking(false);
    }
  }

  // Auto-lookup when arriving via an invite link.
  useEffect(() => {
    if (initialCode) lookup(initialCode);
  }, [initialCode]);

  useEffect(() => {
    if (!initialCode || !preview || !user || autoJoined) return;
    setAutoJoined(true);
    join.mutate();
  }, [autoJoined, initialCode, join, preview, user]);

  const iconName = (preview?.icon ?? "Boxes") as keyof typeof Icons;
  const Icon = (Icons[iconName] ?? Icons.Boxes) as unknown as React.ComponentType<{
    className?: string;
  }>;
  const full = preview ? preview.memberCount >= preview.maxSeats : false;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link
        to="/app/groups"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <Icons.ChevronLeft className="h-4 w-4" /> Back to groups
      </Link>

      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Join a group</h1>
        <p className="mt-1 text-muted-foreground">
          Enter the invite code a manager shared with you.
        </p>
      </div>

      <Card className="glass rounded-3xl border-border p-6">
        <div className="grid gap-2">
          <Label>Invite code</Label>
          <div className="flex gap-2">
            <Input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
              }}
              onBlur={(e) => lookup(e.target.value)}
              placeholder="e.g. 8N7A2K9Q"
              className="rounded-xl bg-secondary/50 font-mono tracking-widest uppercase"
              maxLength={12}
            />
            <Button
              variant="secondary"
              className="rounded-xl"
              onClick={() => lookup(code)}
              disabled={checking}
            >
              {checking ? <Icons.Loader2 className="h-4 w-4 animate-spin" /> : "Find"}
            </Button>
          </div>
        </div>

        {notFound && (
          <p className="mt-4 flex items-center gap-2 text-sm text-danger">
            <Icons.AlertCircle className="h-4 w-4" /> No group matches that code.
          </p>
        )}

        {preview && (
          <div className="mt-6 rounded-2xl bg-secondary/40 p-5">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-primary-foreground",
                  preview.gradient,
                )}
              >
                <Icon className="h-7 w-7" />
              </div>
              <div className="min-w-0">
                <p className="font-display text-lg font-bold">{preview.name}</p>
                <p className="text-sm text-muted-foreground">
                  {preview.category} · {taka(preview.monthlyTotal)}/mo · {preview.memberCount}/
                  {preview.maxSeats} seats
                </p>
              </div>
            </div>
            <Button
              variant="hero"
              className="mt-5 w-full rounded-xl"
              disabled={join.isPending || full}
              onClick={() => join.mutate()}
            >
              {full ? "Group is full" : join.isPending ? "Joining…" : "Join this group"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
