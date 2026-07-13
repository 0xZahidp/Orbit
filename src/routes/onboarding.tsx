import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AmbientBackground } from "@/components/orbit/AmbientBackground";
import { OrbitLogo } from "@/components/orbit/OrbitLogo";

export const Route = createFileRoute("/onboarding")({
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [intent, setIntent] = useState<"create" | "join" | null>(null);

  return (
    <div className="relative grid min-h-screen place-items-center px-4 py-10">
      <AmbientBackground />
      <div className="w-full max-w-lg">
        <div className="mb-8 flex justify-center">
          <OrbitLogo />
        </div>
        <Card className="glass rounded-3xl border-border p-8">
          {step === 0 && (
            <div className="space-y-5 animate-fade-up">
              <div>
                <h1 className="font-display text-2xl font-bold">Welcome to Orbit</h1>
                <p className="mt-1 text-sm text-muted-foreground">Let's set up your profile.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-cyan to-violet text-primary-foreground">
                  <Icons.User className="h-7 w-7" />
                </div>
                <Button variant="secondary" className="rounded-xl">
                  <Icons.Upload className="h-4 w-4" /> Add photo
                </Button>
              </div>
              <div className="grid gap-2">
                <Label>Display name</Label>
                <Input defaultValue="Zahid Hasan" className="rounded-xl bg-secondary/50" />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5 animate-fade-up">
              <h1 className="font-display text-2xl font-bold">What brings you here?</h1>
              <div className="grid gap-3">
                <IntentCard
                  active={intent === "create"}
                  onClick={() => setIntent("create")}
                  icon="Rocket"
                  title="Create a group"
                  text="I manage a shared plan and collect from others."
                />
                <IntentCard
                  active={intent === "join"}
                  onClick={() => setIntent("join")}
                  icon="Users"
                  title="Join a group"
                  text="Someone invited me to their shared plan."
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-fade-up">
              <h1 className="font-display text-2xl font-bold">Payment methods</h1>
              <p className="text-sm text-muted-foreground">Optional — you can add these later.</p>
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label>bKash</Label>
                  <Input placeholder="01XXX-XXXXXX" className="rounded-xl bg-secondary/50" />
                </div>
                <div className="grid gap-2">
                  <Label>Nagad</Label>
                  <Input placeholder="01XXX-XXXXXX" className="rounded-xl bg-secondary/50" />
                </div>
                <div className="grid gap-2">
                  <Label>Bank transfer</Label>
                  <Input placeholder="Account details" className="rounded-xl bg-secondary/50" />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 animate-fade-up">
              <h1 className="font-display text-2xl font-bold">Notifications</h1>
              <div className="space-y-3">
                {["Payment reminders", "Approval updates", "Renewal alerts"].map((p) => (
                  <div
                    key={p}
                    className="flex items-center justify-between rounded-xl bg-secondary/40 px-4 py-3"
                  >
                    <span className="text-sm">{p}</span>
                    <Switch defaultChecked />
                  </div>
                ))}
              </div>
              <div className="rounded-2xl bg-gradient-to-r from-cyan/15 to-violet/15 p-4 text-center">
                <p className="font-display font-bold text-cyan">+10 OP</p>
                <p className="text-xs text-muted-foreground">for completing onboarding</p>
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="ghost"
              className="rounded-xl"
              disabled={step === 0}
              onClick={() => setStep((s) => s - 1)}
            >
              Back
            </Button>
            <Button
              variant="cyan"
              className="rounded-xl"
              disabled={step === 1 && !intent}
              onClick={() =>
                step < 3
                  ? setStep((s) => s + 1)
                  : navigate({ to: intent === "create" ? "/app/create" : "/app" })
              }
            >
              {step < 3 ? "Continue" : "Enter Orbit"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function IntentCard({
  active,
  onClick,
  icon,
  title,
  text,
}: {
  active: boolean;
  onClick: () => void;
  icon: keyof typeof Icons;
  title: string;
  text: string;
}) {
  const Icon = Icons[icon] as React.ComponentType<{ className?: string }>;
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 rounded-2xl border p-4 text-left transition-all",
        active
          ? "border-cyan bg-cyan/10 shadow-[var(--glow-cyan)]"
          : "border-border bg-secondary/40 hover:border-cyan/40",
      )}
    >
      <div
        className={cn(
          "grid h-11 w-11 shrink-0 place-items-center rounded-xl",
          active ? "bg-cyan text-cyan-foreground" : "bg-secondary text-muted-foreground",
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="font-display font-bold">{title}</p>
        <p className="text-xs text-muted-foreground">{text}</p>
      </div>
    </button>
  );
}
