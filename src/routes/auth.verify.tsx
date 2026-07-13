import { createFileRoute, Link } from "@tanstack/react-router";
import { MailCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth/verify")({
  component: Verify,
});

function Verify() {
  return (
    <Card className="glass rounded-3xl border-border p-8 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-cyan/15 text-cyan">
        <MailCheck className="h-7 w-7" />
      </div>
      <h1 className="mt-4 font-display text-2xl font-bold">Confirm your email</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We sent a confirmation link to your inbox. Click it to activate your account, then come back
        and sign in.
      </p>
      <Button asChild variant="hero" className="mt-6 w-full rounded-xl">
        <Link to="/auth/sign-in">Go to sign in</Link>
      </Button>
      <p className="mt-4 text-sm text-muted-foreground">
        Didn't get it? Check your spam folder or wait a moment and try again.
      </p>
    </Card>
  );
}
