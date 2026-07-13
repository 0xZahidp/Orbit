import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/forgot-password")({
  component: ForgotPassword,
});

function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email"));
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error("Couldn't send reset link", { description: error.message });
      return;
    }
    setSent(true);
  }

  return (
    <Card className="glass rounded-3xl border-border p-8">
      {sent ? (
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-success/15 text-success">
            <MailCheck className="h-7 w-7" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold">Check your inbox</h1>
          <p className="mt-1 text-sm text-muted-foreground">We sent a reset link to your email.</p>
          <Button asChild variant="secondary" className="mt-6 w-full rounded-xl">
            <Link to="/auth/sign-in">Back to sign in</Link>
          </Button>
        </div>
      ) : (
        <>
          <h1 className="font-display text-2xl font-bold">Reset password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your email and we'll send a reset link.
          </p>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input
                name="email"
                type="email"
                required
                placeholder="you@mail.com"
                className="rounded-xl bg-secondary/50"
              />
            </div>
            <Button type="submit" variant="hero" className="w-full rounded-xl" disabled={loading}>
              {loading ? "Sending…" : "Send reset link"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link to="/auth/sign-in" className="font-semibold text-cyan hover:underline">
              Back to sign in
            </Link>
          </p>
        </>
      )}
    </Card>
  );
}
