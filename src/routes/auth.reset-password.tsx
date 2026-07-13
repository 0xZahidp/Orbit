import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/reset-password")({
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password"));
    const confirm = String(form.get("confirm"));
    if (password.length < 8) {
      toast.error("Password too short", { description: "Use at least 8 characters." });
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error("Couldn't update password", { description: error.message });
      return;
    }
    toast.success("Password updated");
    navigate({ to: "/app" });
  }

  return (
    <Card className="glass rounded-3xl border-border p-8">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-cyan/15 text-cyan">
        <KeyRound className="h-7 w-7" />
      </div>
      <h1 className="mt-4 text-center font-display text-2xl font-bold">Set a new password</h1>
      <p className="mt-1 text-center text-sm text-muted-foreground">
        Choose a strong password for your account.
      </p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-2">
          <Label>New password</Label>
          <Input
            name="password"
            type="password"
            required
            placeholder="At least 8 characters"
            className="rounded-xl bg-secondary/50"
          />
        </div>
        <div className="grid gap-2">
          <Label>Confirm password</Label>
          <Input
            name="confirm"
            type="password"
            required
            placeholder="Repeat password"
            className="rounded-xl bg-secondary/50"
          />
        </div>
        <Button type="submit" variant="hero" className="w-full rounded-xl" disabled={loading}>
          {loading ? "Updating…" : "Update password"}
        </Button>
      </form>
    </Card>
  );
}
