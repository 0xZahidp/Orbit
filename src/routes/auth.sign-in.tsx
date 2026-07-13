import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { joinGroupByCode } from "@/lib/orbit-api";

export const Route = createFileRoute("/auth/sign-in")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : "",
    code: typeof search.code === "string" ? search.code : "",
  }),
  component: SignIn,
});

function SignIn() {
  const navigate = useNavigate();
  const { redirect, code } = Route.useSearch();
  const [loading, setLoading] = useState(false);
  const [google, setGoogle] = useState(false);

  async function navigateAfterAuth() {
    if (code) {
      try {
        const groupId = await joinGroupByCode(code);
        window.location.assign(`/app/groups/${groupId}`);
        return;
      } catch {
        // Fall back to the invite page if the join fails.
      }
    }
    const target = redirect || (code ? `/app/join?code=${encodeURIComponent(code)}` : "/app");
    window.location.assign(target);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    setLoading(false);
    if (error) {
      toast.error("Couldn't sign in", { description: error.message });
      return;
    }
    toast.success("Welcome back");
    await navigateAfterAuth();
  }

  async function handleGoogle() {
    setGoogle(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/sign-in?redirect=${encodeURIComponent(redirect || (code ? `/app/join?code=${encodeURIComponent(code)}` : "/app"))}`,
      },
    });
    if (error) {
      setGoogle(false);
      toast.error("Google sign-in failed", { description: error.message });
      return;
    }
  }

  return (
    <Card className="glass rounded-3xl border-border p-8">
      <h1 className="font-display text-2xl font-bold">Welcome back</h1>
      <p className="mt-1 text-sm text-muted-foreground">Sign in to keep your plans in orbit.</p>
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
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label>Password</Label>
            <Link to="/auth/forgot-password" className="text-xs text-cyan hover:underline">
              Forgot?
            </Link>
          </div>
          <Input
            name="password"
            type="password"
            required
            placeholder="••••••••"
            className="rounded-xl bg-secondary/50"
          />
        </div>
        <Button type="submit" variant="hero" className="w-full rounded-xl" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <Button
        variant="secondary"
        className="mt-3 w-full rounded-xl"
        onClick={handleGoogle}
        disabled={google}
      >
        {google ? "Connecting…" : "Continue with Google"}
      </Button>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to Orbit?{" "}
        <Link to="/auth/sign-up" className="font-semibold text-cyan hover:underline">
          Create account
        </Link>
      </p>
    </Card>
  );
}
