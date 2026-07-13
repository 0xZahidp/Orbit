import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Icons from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { GradientAvatar } from "@/components/orbit/GradientAvatar";
import { fetchMyProfile, updateMyProfile } from "@/lib/orbit-api";

export const Route = createFileRoute("/app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn: fetchMyProfile,
  });

  const [name, setName] = useState("");
  const [bkash, setBkash] = useState("");
  const [nagad, setNagad] = useState("");
  const [bank, setBank] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.displayName);
      setBkash(profile.bkash);
      setNagad(profile.nagad);
      setBank(profile.bank);
    }
  }, [profile]);

  const save = useMutation({
    mutationFn: () => updateMyProfile({ displayName: name, bkash, nagad, bank }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast.success("Settings saved");
    },
    onError: (err) =>
      toast.error("Couldn't save", {
        description: err instanceof Error ? err.message : "Please try again.",
      }),
  });

  if (isLoading || !profile) {
    return (
      <div className="grid place-items-center py-24 text-muted-foreground">
        <Icons.Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">Profile & settings</h1>

      {/* Orbit profile card */}
      <Card className="glass overflow-hidden rounded-3xl border-border p-6">
        <div className="flex flex-wrap items-center gap-5">
          <GradientAvatar name={profile.displayName} gradient={profile.avatarGradient} size={72} />
          <div className="min-w-0">
            <h2 className="font-display text-xl font-bold">{profile.displayName}</h2>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Chip icon="Sparkles" text={`${profile.orbitPoints} OP`} />
              <Chip icon="Flame" text={`${profile.bestStreak}-mo streak`} />
              <Chip icon="ShieldCheck" text={`${profile.reliability}% reliable`} />
              <Chip icon="Boxes" text={`${profile.groupsCount} groups`} />
            </div>
          </div>
        </div>
      </Card>

      <Card className="glass rounded-3xl border-border p-6">
        <h3 className="mb-4 font-display text-lg font-bold">Profile</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Full name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl bg-secondary/50"
            />
          </div>
          <div className="grid gap-2">
            <Label>Email</Label>
            <Input value={profile.email} disabled className="rounded-xl bg-secondary/50" />
          </div>
        </div>
      </Card>

      <Card className="glass rounded-3xl border-border p-6">
        <h3 className="mb-1 font-display text-lg font-bold">Payment handles</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Managers can see these so they know where your share came from.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-2">
            <Label>bKash</Label>
            <Input
              value={bkash}
              onChange={(e) => setBkash(e.target.value)}
              placeholder="01XXX-XXXXXX"
              className="rounded-xl bg-secondary/50"
            />
          </div>
          <div className="grid gap-2">
            <Label>Nagad</Label>
            <Input
              value={nagad}
              onChange={(e) => setNagad(e.target.value)}
              placeholder="01XXX-XXXXXX"
              className="rounded-xl bg-secondary/50"
            />
          </div>
          <div className="grid gap-2">
            <Label>Bank</Label>
            <Input
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              placeholder="Account number"
              className="rounded-xl bg-secondary/50"
            />
          </div>
        </div>
      </Card>

      <Card className="glass rounded-3xl border-border p-6">
        <h3 className="mb-4 font-display text-lg font-bold">Notification preferences</h3>
        <div className="space-y-3">
          {[
            "Payment reminders",
            "Approval updates",
            "Renewal alerts",
            "New badges & Orbit Points",
          ].map((p) => (
            <div
              key={p}
              className="flex items-center justify-between rounded-xl bg-secondary/40 px-4 py-3"
            >
              <span className="text-sm">{p}</span>
              <Switch defaultChecked />
            </div>
          ))}
        </div>
      </Card>

      <Button
        variant="cyan"
        className="rounded-xl"
        onClick={() => save.mutate()}
        disabled={save.isPending}
      >
        {save.isPending ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}

function Chip({ icon, text }: { icon: keyof typeof Icons; text: string }) {
  const Icon = Icons[icon] as React.ComponentType<{ className?: string }>;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/60 px-3 py-1 text-xs font-medium">
      <Icon className="h-3.5 w-3.5 text-cyan" /> {text}
    </span>
  );
}
