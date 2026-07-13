import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categories, splitMethods } from "@/lib/demo-data";
import { taka } from "@/lib/format";
import { createGroup } from "@/lib/orbit-api";

export const Route = createFileRoute("/app/create")({
  component: CreateGroup,
});

const steps = ["Basics", "Pricing", "Payments", "Invites", "Review"];
const gradients = [
  "from-cyan to-violet",
  "from-danger to-violet",
  "from-success to-cyan",
  "from-warning to-danger",
  "from-violet to-success",
];

function CreateGroup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "",
    category: categories[0],
    gradient: gradients[0],
    description: "",
    price: 695,
    renewal: "2026-08-12",
    deadline: "2026-08-09",
    seats: 6,
    currency: "BDT",
    split: splitMethods[0],
    bkash: "",
    nagad: "",
    bank: "",
    note: "",
    invites: "",
    approval: true,
  });

  const [launching, setLaunching] = useState(false);
  const set = (k: keyof typeof form, v: string | number | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));
  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  async function launch() {
    if (!form.name.trim()) {
      toast.error("Add a group name first");
      setStep(0);
      return;
    }
    setLaunching(true);
    try {
      const id = await createGroup({
        name: form.name.trim(),
        category: form.category,
        gradient: form.gradient,
        price: form.price,
        seats: form.seats,
        renewal: form.renewal,
        deadline: form.deadline,
        currency: form.currency,
        split: form.split,
        bkash: form.bkash,
        nagad: form.nagad,
        note: form.note,
      });
      toast.success("Group launched!", { description: "+10 OP for creating a group." });
      navigate({ to: "/app/groups/$groupId", params: { groupId: id } });
    } catch (err) {
      setLaunching(false);
      toast.error("Couldn't create group", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Create a group</h1>
        <p className="mt-1 text-muted-foreground">Set up a shared plan in a few quick steps.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold transition-colors",
                i <= step ? "bg-cyan text-cyan-foreground" : "bg-secondary text-muted-foreground",
              )}
            >
              {i < step ? <Icons.Check className="h-4 w-4" /> : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={cn("h-0.5 flex-1 rounded", i < step ? "bg-cyan" : "bg-border")} />
            )}
          </div>
        ))}
      </div>

      <Card className="glass rounded-3xl border-border p-6">
        {step === 0 && (
          <div className="space-y-4 animate-fade-up">
            <div className="grid gap-2">
              <Label>Group name</Label>
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="YouTube Premium Family"
                className="rounded-xl bg-secondary/50"
              />
            </div>
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger className="rounded-xl bg-secondary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Cover gradient</Label>
              <div className="flex gap-3">
                {gradients.map((g) => (
                  <button
                    key={g}
                    onClick={() => set("gradient", g)}
                    className={cn(
                      "h-11 w-11 rounded-xl bg-gradient-to-br transition-all",
                      g,
                      form.gradient === g
                        ? "ring-2 ring-cyan ring-offset-2 ring-offset-background"
                        : "opacity-70",
                    )}
                  />
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Short description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="A shared plan for close friends."
                className="rounded-xl bg-secondary/50"
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-4 sm:grid-cols-2 animate-fade-up">
            <div className="grid gap-2">
              <Label>Monthly price (৳)</Label>
              <Input
                type="number"
                value={form.price}
                onChange={(e) => set("price", Number(e.target.value))}
                className="rounded-xl bg-secondary/50"
              />
            </div>
            <div className="grid gap-2">
              <Label>Max seats</Label>
              <Input
                type="number"
                value={form.seats}
                onChange={(e) => set("seats", Number(e.target.value))}
                className="rounded-xl bg-secondary/50"
              />
            </div>
            <div className="grid gap-2">
              <Label>Renewal date</Label>
              <Input
                type="date"
                value={form.renewal}
                onChange={(e) => set("renewal", e.target.value)}
                className="rounded-xl bg-secondary/50"
              />
            </div>
            <div className="grid gap-2">
              <Label>Payment deadline</Label>
              <Input
                type="date"
                value={form.deadline}
                onChange={(e) => set("deadline", e.target.value)}
                className="rounded-xl bg-secondary/50"
              />
            </div>
            <div className="grid gap-2">
              <Label>Currency</Label>
              <Select value={form.currency} onValueChange={(v) => set("currency", v)}>
                <SelectTrigger className="rounded-xl bg-secondary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BDT">BDT (৳)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label>Split method</Label>
              <Select value={form.split} onValueChange={(v) => set("split", v)}>
                <SelectTrigger className="rounded-xl bg-secondary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {splitMethods.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Each member pays about {taka(Math.round(form.price / Math.max(form.seats, 1)))} per
                month.
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-fade-up">
            <div className="grid gap-2">
              <Label>bKash number</Label>
              <Input
                value={form.bkash}
                onChange={(e) => set("bkash", e.target.value)}
                placeholder="01XXX-XXXXXX"
                className="rounded-xl bg-secondary/50"
              />
            </div>
            <div className="grid gap-2">
              <Label>Nagad number</Label>
              <Input
                value={form.nagad}
                onChange={(e) => set("nagad", e.target.value)}
                placeholder="01XXX-XXXXXX"
                className="rounded-xl bg-secondary/50"
              />
            </div>
            <div className="grid gap-2">
              <Label>Bank information</Label>
              <Input
                value={form.bank}
                onChange={(e) => set("bank", e.target.value)}
                placeholder="Bank · Account name · Number"
                className="rounded-xl bg-secondary/50"
              />
            </div>
            <div className="grid gap-2">
              <Label>Custom note</Label>
              <Textarea
                value={form.note}
                onChange={(e) => set("note", e.target.value)}
                placeholder="Please send money, not payment."
                className="rounded-xl bg-secondary/50"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-fade-up">
            <div className="grid gap-2">
              <Label>Invite by email</Label>
              <Textarea
                value={form.invites}
                onChange={(e) => set("invites", e.target.value)}
                placeholder="rafi@mail.com, nusrat@mail.com"
                className="rounded-xl bg-secondary/50"
              />
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-secondary/40 p-4">
              <div className="min-w-0">
                <p className="font-medium">Shareable invite link</p>
                <p className="truncate text-xs text-muted-foreground">
                  https://orbit.app/join/abcd-1234
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="rounded-xl"
                onClick={() => toast.success("Invite link copied")}
              >
                <Icons.Copy className="h-4 w-4" /> Copy
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-secondary/40 p-4">
              <div>
                <p className="font-medium">Require approval to join</p>
                <p className="text-xs text-muted-foreground">
                  Review each request before adding members.
                </p>
              </div>
              <Switch checked={form.approval} onCheckedChange={(v) => set("approval", v)} />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 animate-fade-up">
            <h3 className="font-display text-lg font-bold">{form.name || "Untitled group"}</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Review label="Category" value={form.category} />
              <Review label="Monthly price" value={taka(form.price)} />
              <Review label="Seats" value={`${form.seats}`} />
              <Review label="Split" value={form.split} />
              <Review label="Renewal" value={form.renewal} />
              <Review label="Deadline" value={form.deadline} />
            </div>
            <div className="flex gap-3 rounded-2xl bg-secondary/40 p-4 text-sm text-muted-foreground">
              <Icons.ShieldCheck className="h-5 w-5 shrink-0 text-cyan" />
              Orbit manages shared costs and records. Members are responsible for following each
              provider's terms, eligibility rules, and household requirements.
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <Button variant="ghost" onClick={back} disabled={step === 0} className="rounded-xl">
            <Icons.ChevronLeft className="h-4 w-4" /> Back
          </Button>
          {step < steps.length - 1 ? (
            <Button variant="cyan" onClick={next} className="rounded-xl">
              Continue <Icons.ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="hero" className="rounded-xl" disabled={launching} onClick={launch}>
              <Icons.Rocket className="h-4 w-4" /> {launching ? "Launching…" : "Launch group"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

function Review({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary/40 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
