import React, { useEffect, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Icons from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ProgressRing } from "@/components/orbit/ProgressRing";
import { GradientAvatar } from "@/components/orbit/GradientAvatar";
import { RoleBadge, StatusBadge } from "@/components/orbit/StatusBadge";
import type { Group, GroupMember } from "@/lib/demo-data";
import { taka, relativeDue } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchGroup,
  fetchGroupActivity,
  fetchPendingPayments,
  fetchMyLatestPayment,
  fetchMyPaymentHistory,
  submitPayment,
  submitPaymentForMember,
  reviewPayment,
  updateGroupSettings,
  updateMemberRole,
  removeMember,
  setGroupStatus,
  sendReminderNotification,
  cycleLabel,
  currentCycle,
  type PendingPayment,
} from "@/lib/orbit-api";

export const Route = createFileRoute("/app/groups/$groupId")({
  component: GroupDetail,
});

function NotFound() {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <h1 className="font-display text-2xl font-bold">Group not found</h1>
      <Button asChild variant="cyan" className="mt-4 rounded-xl">
        <Link to="/app/groups">Back to groups</Link>
      </Button>
    </div>
  );
}

function GroupDetail() {
  const { groupId } = useParams({ from: "/app/groups/$groupId" });
  const { user } = useAuth();
  const { data: group, isLoading } = useQuery({
    queryKey: ["group", groupId],
    queryFn: () => fetchGroup(groupId),
  });

  if (isLoading) {
    return (
      <div className="grid place-items-center py-24 text-muted-foreground">
        <Icons.Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  if (!group) return <NotFound />;

  const Icon = (Icons[group.icon as keyof typeof Icons] ?? Icons.Boxes) as React.ComponentType<{
    className?: string;
  }>;
  const isManager = group.myRole === "owner" || group.myRole === "co_manager";
  const activeMembers = group.members.filter((m) => m.status === "active");
  const paid = activeMembers.filter((m) => m.paymentStatus === "approved").length;
  const pending = activeMembers.filter((m) => m.paymentStatus === "submitted").length;
  const overdue = activeMembers.filter((m) => m.paymentStatus === "overdue").length;
  const ratio = group.monthlyTotal > 0 ? group.collected / group.monthlyTotal : 0;
  const me = group.members.find((m) => m.person.id === user?.id);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Link
        to="/app/groups"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <Icons.ChevronLeft className="h-4 w-4" /> Back to groups
      </Link>

      <Card className="glass relative overflow-hidden rounded-3xl border-border p-6">
        <div
          className={cn(
            "absolute inset-x-0 top-0 h-24 bg-gradient-to-br opacity-25",
            group.gradient,
          )}
        />
        <div className="relative flex flex-wrap items-start gap-4">
          <div
            className={cn(
              "grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-primary-foreground shadow-[var(--glow-cyan)]",
              group.gradient,
            )}
          >
            <Icon className="h-8 w-8" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-bold">{group.name}</h1>
              <RoleBadge role={group.myRole} />
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {group.category}
              </span>
              <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">
                {group.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {group.renewalDate ? `Renews ${relativeDue(group.renewalDate)} · ` : ""}Seats{" "}
              {activeMembers.length}/{group.maxSeats} · Collected {taka(group.collected)} /{" "}
              {taka(group.monthlyTotal)}
            </p>
          </div>
          {isManager && group.inviteCode && <InviteDialog group={group} />}
        </div>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList className="flex w-full flex-wrap justify-start rounded-xl bg-secondary/50">
          {["overview", "members", "payments", "activity", "achievements", "settings"].map((t) => (
            <TabsTrigger key={t} value={t} className="rounded-lg capitalize">
              {t}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="glass flex flex-col items-center justify-center rounded-3xl border-border p-6">
              <ProgressRing
                value={ratio}
                size={150}
                strokeWidth={12}
                variant={ratio >= 1 ? "success" : "cyan"}
              >
                <div>
                  <p className="font-display text-3xl font-bold">{Math.round(ratio * 100)}%</p>
                  <p className="text-xs text-muted-foreground">collected</p>
                </div>
              </ProgressRing>
              <p className="mt-4 text-center text-sm text-muted-foreground">
                {taka(group.collected)} of {taka(group.monthlyTotal)}
              </p>
            </Card>

            <Card className="glass rounded-3xl border-border p-6 lg:col-span-2">
              <h3 className="mb-4 font-display text-lg font-bold">
                Monthly Cycle · {cycleLabel(currentCycle())}
              </h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <MiniStat label="Total due" value={taka(group.monthlyTotal)} tone="cyan" />
                <MiniStat label="Paid" value={`${paid} members`} tone="success" />
                <MiniStat label="Pending approval" value={`${pending}`} tone="warning" />
                <MiniStat label="Overdue" value={`${overdue}`} tone="danger" />
                <MiniStat
                  label="Remaining"
                  value={taka(Math.max(group.monthlyTotal - group.collected, 0))}
                  tone="violet"
                />
                <MiniStat
                  label="Renewal"
                  value={group.renewalDate ? relativeDue(group.renewalDate) : "—"}
                  tone="cyan"
                />
              </div>
            </Card>
          </div>

          {me && <MyStatusCard group={group} me={me} />}

          <Card className="glass rounded-2xl border-border p-5">
            <div className="flex gap-3">
              <Icons.ShieldAlert className="h-5 w-5 shrink-0 text-warning" />
              <p className="text-sm text-muted-foreground">
                Orbit manages shared costs and records. Members are responsible for following each
                provider's terms, eligibility rules, and household requirements. Orbit never stores
                provider passwords or account credentials.
              </p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <MembersTab
            group={group}
            members={activeMembers}
            isManager={isManager}
            isOwner={group.myRole === "owner"}
          />
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          {isManager ? (
            <div className="space-y-6">
              {me && <MemberPayments group={group} me={me} />}
              <ManagerPayments group={group} />
            </div>
          ) : (
            me && <MemberPayments group={group} me={me} />
          )}
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          {isManager ? (
            <GroupActivity groupId={group.id} groupName={group.name} />
          ) : (
            <EmptyState
              icon="Lock"
              title="Managers only"
              text="Only the group owner and co-managers can view this audit activity."
            />
          )}
        </TabsContent>

        <TabsContent value="achievements" className="mt-6">
          <GroupAchievements />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <GroupSettings group={group} isManager={isManager} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

const toneMap: Record<string, string> = {
  cyan: "text-cyan",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  violet: "text-violet",
};

function displayMethod(method: string) {
  switch (method.toLowerCase()) {
    case "bkash":
      return "bKash";
    case "nagad":
      return "Nagad";
    case "bank":
      return "Bank transfer";
    default:
      return method.charAt(0).toUpperCase() + method.slice(1);
  }
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-2xl bg-secondary/40 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-1 font-display text-lg font-bold", toneMap[tone])}>{value}</p>
    </div>
  );
}

function MyStatusCard({ group, me }: { group: Group; me: GroupMember }) {
  const { data: latest } = useQuery({
    queryKey: ["my-payment", group.id],
    queryFn: () => fetchMyLatestPayment(group.id),
  });
  const rejected = latest?.status === "rejected";
  const canSubmitPayment = me.paymentStatus !== "submitted";
  const canPayAhead = canSubmitPayment && !rejected;
  const copy =
    me.paymentStatus === "approved"
      ? "You're all set for this cycle."
      : me.paymentStatus === "submitted"
        ? "Your payment is waiting for approval."
        : rejected
          ? "Your payment was rejected — fix it and resubmit."
          : me.paymentStatus === "overdue"
            ? "Your payment is overdue."
            : group.dueDate
              ? `${relativeDue(group.dueDate)}.`
              : "Submit your share when ready.";
  return (
    <Card className="glass rounded-3xl border-border p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <StatusBadge status={me.paymentStatus} />
          <p className="mt-2 font-display text-xl font-bold">{copy}</p>
          <p className="text-sm text-muted-foreground">
            You have paid for {me.monthsPaid} months · {taka(me.monthlyShare)}/mo · {me.streak}
            -month streak
          </p>
        </div>
        {canSubmitPayment && (
          <div className="flex flex-wrap gap-2">
            {me.paymentStatus !== "approved" && (
              <SubmitPaymentDialog
                key={`${latest?.id ?? "new"}-default`}
                amount={me.monthlyShare}
                group={group}
                resubmit={rejected}
                defaultMethod={latest?.method ?? undefined}
                defaultTxn={latest?.transactionId ?? undefined}
              />
            )}
            {canPayAhead && (
              <SubmitPaymentDialog
                key={`${latest?.id ?? "new"}-advance`}
                amount={me.monthlyShare}
                group={group}
                defaultMethod={latest?.method ?? undefined}
                buttonLabel={me.paymentStatus === "approved" ? "Pay future months" : "Pay ahead"}
                defaultMonths={2}
                advance
              />
            )}
          </div>
        )}
      </div>

      {rejected && (
        <div className="mt-4 rounded-2xl border border-danger/40 bg-danger/10 p-4">
          <div className="flex items-start gap-3">
            <Icons.CircleX className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
            <div className="min-w-0 space-y-1">
              <p className="font-display font-bold text-danger">Payment rejected by your manager</p>
              <p className="text-sm text-foreground">
                {latest?.reviewNote?.trim()
                  ? `Reason: “${latest.reviewNote.trim()}”`
                  : "No reason was provided. Please double-check your amount and transaction details, then resubmit."}
              </p>
              <p className="text-xs text-muted-foreground">
                You submitted {taka(latest!.amount)}
                {latest?.method ? ` via ${latest.method}` : ""}
                {latest?.transactionId ? ` · TXN ${latest.transactionId}` : ""}
                {latest?.reviewedAt
                  ? ` · reviewed ${new Date(latest.reviewedAt).toLocaleDateString()}`
                  : ""}
              </p>
              <p className="pt-1 text-xs text-muted-foreground">
                Correct the issue above and submit again — your manager will get the new submission.
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function SubmitPaymentDialog({
  amount,
  group,
  resubmit = false,
  defaultMethod,
  defaultTxn,
  buttonLabel,
  defaultMonths = 1,
  advance = false,
}: {
  amount: number;
  group: Group;
  resubmit?: boolean;
  defaultMethod?: string;
  defaultTxn?: string;
  buttonLabel?: string;
  defaultMonths?: number;
  advance?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [amountVal, setAmountVal] = useState(String(amount || ""));
  const [amountEdited, setAmountEdited] = useState(false);
  const [months, setMonths] = useState(String(defaultMonths));
  const [method, setMethod] = useState(defaultMethod || "bkash");
  const [txn, setTxn] = useState(defaultTxn || "");
  const [note, setNote] = useState("");
  const queryClient = useQueryClient();
  const monthCount = Math.max(1, Number(months) || 1);
  const suggestedAmount = Math.max(amount * monthCount, amount || 0);

  useEffect(() => {
    if (!amountEdited) {
      setAmountVal(String(suggestedAmount));
    }
  }, [amountEdited, suggestedAmount]);

  const mutation = useMutation({
    mutationFn: () =>
      submitPayment({
        groupId: group.id,
        amount: Number(amountVal) > 0 ? Number(amountVal) : suggestedAmount,
        method,
        transactionId: txn,
        note,
        months: monthCount,
      }),
    onSuccess: () => {
      setConfirmOpen(false);
      setOpen(false);
      setTxn("");
      setNote("");
      queryClient.invalidateQueries({ queryKey: ["group", group.id] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["my-payment", group.id] });
      toast.success(advance ? "Future payment submitted" : "Payment submitted", {
        description: "Your manager will review it shortly.",
      });
    },
    onError: (err) =>
      toast.error("Couldn't submit payment", {
        description: err instanceof Error ? err.message : "Please try again.",
      }),
  });

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="cyan" className="rounded-xl">
            {advance ? (
              <Icons.CalendarPlus className="h-4 w-4" />
            ) : (
              <Icons.Upload className="h-4 w-4" />
            )}
            {buttonLabel ?? (resubmit ? "Fix & resubmit" : "Submit payment")}
          </Button>
        </DialogTrigger>
        <DialogContent className="rounded-3xl border-border">
          <DialogHeader>
            <DialogTitle className="font-display">
              {advance
                ? "Pay future months"
                : resubmit
                  ? "Fix & resubmit payment"
                  : "Submit payment"}
            </DialogTitle>
            <DialogDescription>
              {advance
                ? "Submit an advance payment for upcoming months. Your current month stays settled while this waits for manager approval."
                : group.paymentInstructions || "Send your share and record the details below."}
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!txn.trim()) {
                toast.error("Add the transaction ID");
                return;
              }
              if (resubmit) {
                setConfirmOpen(true);
                return;
              }
              mutation.mutate();
            }}
          >
            <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
              <div className="grid gap-2">
                <Label>Amount paid</Label>
                <Input
                  value={amountVal}
                  onChange={(e) => {
                    setAmountEdited(true);
                    setAmountVal(e.target.value);
                  }}
                  type="number"
                  required
                  className="rounded-xl bg-secondary/50"
                />
              </div>
              <div className="grid gap-2">
                <Label>Months</Label>
                <Select value={months} onValueChange={setMonths}>
                  <SelectTrigger className="rounded-xl bg-secondary/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((value) => (
                      <SelectItem key={value} value={String(value)}>
                        {value} {value === 1 ? "month" : "months"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {advance ? "Advance payment" : "This payment"} will cover {monthCount} month
              {monthCount > 1 ? "s" : ""}. Suggested amount: {taka(suggestedAmount)}.
            </p>
            <div className="grid gap-2">
              <Label>Payment method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="rounded-xl bg-secondary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bkash">bKash</SelectItem>
                  <SelectItem value="nagad">Nagad</SelectItem>
                  <SelectItem value="bank">Bank transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Transaction ID</Label>
              <Input
                value={txn}
                onChange={(e) => setTxn(e.target.value)}
                placeholder="e.g. 8N7A2K9Q12"
                required
                className="rounded-xl bg-secondary/50"
              />
            </div>
            <div className="grid gap-2">
              <Label>Note (optional)</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Anything the manager should know?"
                className="rounded-xl bg-secondary/50"
              />
            </div>
            <DialogFooter>
              <Button
                type="submit"
                variant="cyan"
                className="w-full rounded-xl"
                disabled={mutation.isPending}
              >
                {resubmit
                  ? "Review & resubmit"
                  : mutation.isPending
                    ? "Submitting…"
                    : advance
                      ? "Submit future payment"
                      : "Submit payment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-3xl border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Resubmit this payment?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You already have a rejected payment for this cycle. Submitting again will create a
                new payment record and keep the old one in your history.
              </p>
              <p>Make sure you corrected the issue your manager noted before resubmitting.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" disabled={mutation.isPending}>
              Go back & edit
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-cyan text-primary-foreground hover:brightness-110"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? "Submitting…" : "Yes, resubmit payment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ManagerPaymentDialog({ member, group }: { member: GroupMember; group: Group }) {
  const [open, setOpen] = useState(false);
  const [amountVal, setAmountVal] = useState(String(member.monthlyShare));
  const [months, setMonths] = useState("1");
  const [method, setMethod] = useState("bkash");
  const [txn, setTxn] = useState("");
  const [note, setNote] = useState("");
  const queryClient = useQueryClient();
  const monthCount = Math.max(1, Number(months) || 1);

  const mutation = useMutation({
    mutationFn: () =>
      submitPaymentForMember({
        groupId: group.id,
        userId: member.person.id,
        amount: Number(amountVal) || member.monthlyShare,
        method,
        transactionId: txn,
        note,
        months: monthCount,
        approve: true,
      }),
    onSuccess: () => {
      setOpen(false);
      setTxn("");
      setNote("");
      queryClient.invalidateQueries({ queryKey: ["group", group.id] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast.success("Payment recorded", {
        description: `${member.person.name} has been credited.`,
      });
    },
    onError: (err) =>
      toast.error("Couldn't record payment", {
        description: err instanceof Error ? err.message : "Please try again.",
      }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <Icons.Wallet className="h-4 w-4" /> Pay ahead
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl border-border">
        <DialogHeader>
          <DialogTitle className="font-display">
            Record payment for {member.person.name}
          </DialogTitle>
          <DialogDescription>
            Mark a payment on behalf of a member and credit their months.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!txn.trim()) {
              toast.error("Add the transaction ID");
              return;
            }
            mutation.mutate();
          }}
        >
          <div className="grid gap-2">
            <Label>Amount</Label>
            <Input
              value={amountVal}
              onChange={(e) => setAmountVal(e.target.value)}
              type="number"
              className="rounded-xl bg-secondary/50"
            />
          </div>
          <div className="grid gap-2">
            <Label>Months</Label>
            <Select value={months} onValueChange={setMonths}>
              <SelectTrigger className="rounded-xl bg-secondary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6].map((v) => (
                  <SelectItem key={v} value={String(v)}>
                    {v} {v === 1 ? "month" : "months"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Payment method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="rounded-xl bg-secondary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bkash">bKash</SelectItem>
                <SelectItem value="nagad">Nagad</SelectItem>
                <SelectItem value="bank">Bank transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Transaction ID</Label>
            <Input
              value={txn}
              onChange={(e) => setTxn(e.target.value)}
              required
              className="rounded-xl bg-secondary/50"
            />
          </div>
          <div className="grid gap-2">
            <Label>Note (optional)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="rounded-xl bg-secondary/50"
            />
          </div>
          <DialogFooter>
            <Button
              type="submit"
              variant="cyan"
              className="w-full rounded-xl"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Recording…" : "Record & approve"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MembersTab({
  group,
  members,
  isManager,
  isOwner,
}: {
  group: Group;
  members: GroupMember[];
  isManager: boolean;
  isOwner: boolean;
}) {
  return (
    <Card className="glass overflow-hidden rounded-3xl border-border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-medium">Member</th>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium">Share</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Streak</th>
              <th className="px-5 py-3 font-medium">Paid</th>
              <th className="px-5 py-3 font-medium">OP</th>
              {isManager && <th className="px-5 py-3 font-medium text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr
                key={m.person.id}
                className="border-b border-border/60 last:border-0 hover:bg-secondary/30"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <GradientAvatar
                      name={m.person.name}
                      gradient={m.person.avatarGradient}
                      size={34}
                    />
                    <span className="font-medium">{m.person.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <RoleBadge role={m.role} />
                </td>
                <td className="px-5 py-3">{taka(m.monthlyShare)}</td>
                <td className="px-5 py-3">
                  <StatusBadge status={m.paymentStatus} />
                </td>
                <td className="px-5 py-3">{m.streak} mo</td>
                <td className="px-5 py-3">{m.monthsPaid}</td>
                <td className="px-5 py-3 text-cyan">{m.orbitPoints}</td>
                {isManager && (
                  <td className="px-5 py-3 text-right">
                    <MemberActions group={group} member={m} isOwner={isOwner} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function MemberActions({
  group,
  member,
  isOwner,
}: {
  group: Group;
  member: GroupMember;
  isOwner: boolean;
}) {
  const queryClient = useQueryClient();
  const [confirmRemove, setConfirmRemove] = useState(false);

  const reminderMutation = useMutation({
    mutationFn: () =>
      sendReminderNotification({
        groupId: group.id,
        userId: member.person.id,
        memberName: member.person.name,
        groupName: group.name,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Reminder sent", {
        description: `${member.person.name} will see it in their notifications.`,
      });
    },
    onError: (err) =>
      toast.error("Couldn't send reminder", {
        description: err instanceof Error ? err.message : "Please try again.",
      }),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["group", group.id] });
    queryClient.invalidateQueries({ queryKey: ["groups"] });
  }

  const roleMutation = useMutation({
    mutationFn: (role: "co_manager" | "member") =>
      updateMemberRole(group.id, member.person.id, role),
    onSuccess: (_d, role) => {
      invalidate();
      toast.success(role === "co_manager" ? "Promoted to co-manager" : "Changed to member");
    },
    onError: (err) =>
      toast.error("Couldn't update role", {
        description: err instanceof Error ? err.message : "Please try again.",
      }),
  });

  const removeMutation = useMutation({
    mutationFn: () => removeMember(group.id, member.person.id),
    onSuccess: () => {
      setConfirmRemove(false);
      invalidate();
      toast.success(`${member.person.name} removed`);
    },
    onError: (err) =>
      toast.error("Couldn't remove member", {
        description: err instanceof Error ? err.message : "Please try again.",
      }),
  });

  // The owner is protected: no role change or removal from the UI.
  const canManage = isOwner && member.role !== "owner";
  const canPayAhead =
    (group.myRole === "owner" || group.myRole === "co_manager") && member.role !== "owner";

  return (
    <div className="flex items-center justify-end gap-1">
      {canPayAhead && <ManagerPaymentDialog member={member} group={group} />}
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        onClick={() => reminderMutation.mutate()}
        disabled={reminderMutation.isPending}
      >
        <Icons.BellRing className="h-4 w-4" /> Remind
      </Button>
      {canManage && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Icons.MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl">
            {member.role === "member" ? (
              <DropdownMenuItem onClick={() => roleMutation.mutate("co_manager")}>
                <Icons.ShieldCheck className="h-4 w-4" /> Make co-manager
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => roleMutation.mutate("member")}>
                <Icons.ShieldMinus className="h-4 w-4" /> Revoke co-manager
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-danger focus:text-danger"
              onSelect={(e) => {
                e.preventDefault();
                setConfirmRemove(true);
              }}
            >
              <Icons.UserMinus className="h-4 w-4" /> Remove from group
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <AlertDialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <AlertDialogContent className="rounded-3xl border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Remove {member.person.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              They will lose access to this group and its payment records. This frees up a seat.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-danger text-primary-foreground hover:brightness-110"
              disabled={removeMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                removeMutation.mutate();
              }}
            >
              {removeMutation.isPending ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ManagerPayments({ group }: { group: Group }) {
  const queryClient = useQueryClient();
  const { data: pending = [], isLoading } = useQuery({
    queryKey: ["pending-payments", group.id],
    queryFn: () => fetchPendingPayments(group.id),
  });
  const [poppingId, setPoppingId] = useState<string | null>(null);

  const review = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: "approved" | "rejected" }) =>
      reviewPayment(id, decision),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["pending-payments", group.id] });
      queryClient.invalidateQueries({ queryKey: ["group", group.id] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      if (vars.decision === "approved")
        toast.success("Payment approved", { description: "+5 OP to you." });
      else toast("Payment rejected");
    },
    onError: (err) =>
      toast.error("Action failed", {
        description: err instanceof Error ? err.message : "Please try again.",
      }),
  });

  function approve(p: PendingPayment) {
    setPoppingId(p.id);
    review.mutate({ id: p.id, decision: "approved" });
    setTimeout(() => setPoppingId(null), 1400);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MiniStat label="Expected" value={taka(group.monthlyTotal)} tone="cyan" />
        <MiniStat label="Collected" value={taka(group.collected)} tone="success" />
        <MiniStat label="Pending" value={`${pending.length}`} tone="warning" />
        <MiniStat
          label="Remaining"
          value={taka(Math.max(group.monthlyTotal - group.collected, 0))}
          tone="violet"
        />
      </div>

      <Card className="glass rounded-3xl border-border p-6">
        <h3 className="mb-4 font-display text-lg font-bold">Pending approvals</h3>
        {isLoading ? (
          <div className="grid place-items-center py-8 text-muted-foreground">
            <Icons.Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : pending.length === 0 ? (
          <EmptyState
            icon="CheckCheck"
            title="All caught up"
            text="No payments waiting for your review."
          />
        ) : (
          <div className="space-y-3">
            {pending.map((p) => (
              <div
                key={p.id}
                className="relative flex flex-wrap items-center gap-3 rounded-2xl bg-secondary/40 p-4"
              >
                {poppingId === p.id && (
                  <span className="absolute -top-2 right-4 animate-op-pop font-display text-sm font-bold text-success">
                    +5 OP
                  </span>
                )}
                <GradientAvatar name={p.name} gradient={p.gradient} size={40} />
                <div className="min-w-0">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {taka(p.amount)} · {p.method ?? "—"}
                    {p.transactionId ? ` · TXN ${p.transactionId}` : ""}
                  </p>
                </div>
                <div className="ml-auto flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-danger"
                    disabled={review.isPending}
                    onClick={() => review.mutate({ id: p.id, decision: "rejected" })}
                  >
                    <Icons.X className="h-4 w-4" /> Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="success"
                    className={cn("rounded-lg", poppingId === p.id && "animate-success-pulse")}
                    disabled={review.isPending}
                    onClick={() => approve(p)}
                  >
                    <Icons.Check className="h-4 w-4" /> Clear
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function MemberPayments({ group, me }: { group: Group; me: GroupMember }) {
  return (
    <div className="space-y-6">
      <MyStatusCard group={group} me={me} />
      <Card className="glass rounded-3xl border-border p-6">
        <h3 className="mb-4 font-display text-lg font-bold">Your record</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MiniStat label="Months paid" value={`${me.monthsPaid}`} tone="cyan" />
          <MiniStat label="Streak" value={`${me.streak} mo`} tone="success" />
          <MiniStat label="Orbit points" value={`${me.orbitPoints}`} tone="violet" />
          <MiniStat label="Monthly share" value={taka(me.monthlyShare)} tone="warning" />
        </div>
      </Card>
      <PaymentHistory groupId={group.id} />
    </div>
  );
}

const historyToneMap: Record<string, { dot: string; ring: string; label: string }> = {
  approved: {
    dot: "bg-success text-success-foreground",
    ring: "ring-success/30",
    label: "Approved",
  },
  rejected: { dot: "bg-danger text-danger-foreground", ring: "ring-danger/30", label: "Rejected" },
  submitted: {
    dot: "bg-warning text-warning-foreground",
    ring: "ring-warning/30",
    label: "Awaiting approval",
  },
};

type DateRangePreset = "all" | "last30days" | "thisMonth" | "lastMonth";

function dateRangeMatches(preset: DateRangePreset, submittedAt: string): boolean {
  if (preset === "all") return true;
  const submitted = new Date(submittedAt);
  const now = new Date();
  const submittedStart = new Date(
    submitted.getFullYear(),
    submitted.getMonth(),
    submitted.getDate(),
  );
  if (preset === "last30days") {
    const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
    return submittedStart >= cutoff;
  }
  if (preset === "thisMonth") {
    return submitted.getFullYear() === now.getFullYear() && submitted.getMonth() === now.getMonth();
  }
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  if (preset === "lastMonth") {
    return (
      submitted.getFullYear() === lastMonth.getFullYear() &&
      submitted.getMonth() === lastMonth.getMonth()
    );
  }
  return true;
}

const dateRangeLabel: Record<DateRangePreset, string> = {
  all: "",
  last30days: " in the last 30 days",
  thisMonth: " this month",
  lastMonth: " last month",
};

const sortStorageKey = (groupId: string) => `orbit:payment-history:sort:${groupId}`;

function loadSavedSortOrder(groupId: string): "newest" | "oldest" {
  if (typeof window === "undefined") return "newest";
  const saved = window.localStorage.getItem(sortStorageKey(groupId));
  if (saved === "oldest") return "oldest";
  return "newest";
}

function PaymentHistory({ groupId }: { groupId: string }) {
  const [filter, setFilter] = useState<"all" | "submitted" | "approved" | "rejected">("all");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRangePreset>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">(() =>
    loadSavedSortOrder(groupId),
  );
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["my-payment-history", groupId],
    queryFn: () => fetchMyPaymentHistory(groupId),
  });

  const searchLower = search.trim().toLowerCase();
  const filteredByDate = items.filter((p) => dateRangeMatches(dateRange, p.submittedAt));
  const filtered = filteredByDate
    .filter((p) => {
      const statusMatch = filter === "all" || p.status === filter;
      if (!searchLower) return statusMatch;
      const methodDisplay = p.method ? displayMethod(p.method).toLowerCase() : "";
      const txnMatch = p.transactionId?.toLowerCase().includes(searchLower) ?? false;
      const methodMatch = methodDisplay.includes(searchLower);
      return statusMatch && (txnMatch || methodMatch);
    })
    .sort((a, b) => {
      const diff = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
      return sortOrder === "newest" ? -diff : diff;
    });

  const counts = {
    all: filteredByDate.length,
    submitted: filteredByDate.filter((p) => p.status === "submitted").length,
    approved: filteredByDate.filter((p) => p.status === "approved").length,
    rejected: filteredByDate.filter((p) => p.status === "rejected").length,
  };

  const isFiltered =
    filter !== "all" || search !== "" || dateRange !== "all" || sortOrder !== "newest";
  const resetFilters = () => {
    setFilter("all");
    setSearch("");
    setDateRange("all");
    setSortOrder("newest");
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(sortStorageKey(groupId), sortOrder);
  }, [sortOrder, groupId]);

  const filters: { value: typeof filter; label: string; icon: React.ElementType }[] = [
    { value: "all", label: "All", icon: Icons.List },
    { value: "submitted", label: "Pending", icon: Icons.Clock },
    { value: "approved", label: "Approved", icon: Icons.CheckCircle2 },
    { value: "rejected", label: "Rejected", icon: Icons.XCircle },
  ];

  return (
    <Card className="glass rounded-3xl border-border p-6">
      <div className="mb-1 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-display text-lg font-bold">Payment history</h3>
          <p className="text-sm text-muted-foreground">
            Every submission and its outcome, including manager feedback on rejected attempts.
          </p>
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <ToggleGroup
          type="single"
          value={filter}
          onValueChange={(v) => v && setFilter(v as typeof filter)}
          variant="outline"
          size="sm"
          className="flex-wrap justify-start"
        >
          {filters.map((f) => {
            const Icon = f.icon;
            return (
              <ToggleGroupItem
                key={f.value}
                value={f.value}
                aria-label={`Filter by ${f.label}`}
                className="data-[state=on]:bg-cyan data-[state=on]:text-cyan-foreground data-[state=on]:border-cyan/50 gap-2 rounded-xl"
              >
                <Icon className="h-4 w-4" />
                <span>{f.label}</span>
                <span
                  className={cn(
                    "ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums",
                    filter === f.value
                      ? "bg-cyan-foreground/20 text-cyan-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {counts[f.value]}
                </span>
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as typeof sortOrder)}>
            <SelectTrigger
              className="w-full rounded-xl bg-secondary/50 sm:w-[170px]"
              aria-label="Sort payment history"
            >
              <Icons.ArrowUpDown className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRangePreset)}>
            <SelectTrigger
              className="w-full rounded-xl bg-secondary/50 sm:w-[180px]"
              aria-label="Filter by date range"
            >
              <Icons.Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="last30days">Last 30 days</SelectItem>
              <SelectItem value="thisMonth">This month</SelectItem>
              <SelectItem value="lastMonth">Last month</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative w-full lg:max-w-xs">
            <Icons.Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by TXN or method (bKash, Nagad)"
              className="rounded-xl bg-secondary/50 pl-9"
              aria-label="Search payment history by transaction ID or method"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <Icons.X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={resetFilters}
            disabled={!isFiltered}
            className="rounded-xl border-border bg-secondary/50 hover:bg-secondary disabled:opacity-50"
            aria-label="Reset all filters"
          >
            <Icons.RotateCcw className="mr-2 h-4 w-4" />
            Reset filters
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-8 text-muted-foreground">
          <Icons.Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="Receipt"
          title={
            search
              ? "No matches found"
              : filter === "all"
                ? `No payments yet${dateRangeLabel[dateRange]}`
                : `No ${filter.toLowerCase()} payments${dateRangeLabel[dateRange]}`
          }
          text={
            search
              ? "Try a different transaction ID or method name."
              : filter === "all" && dateRange === "all"
                ? "Your submitted payments will appear here."
                : "Try a different filter or date range to see other attempts."
          }
        />
      ) : (
        <div className="relative space-y-5 pl-6">
          <div className="absolute left-2 top-1 bottom-1 w-px bg-border" />
          {filtered.map((p) => {
            const tone = historyToneMap[p.status] ?? historyToneMap.submitted;
            return (
              <div key={p.id} className="relative">
                <div
                  className={cn(
                    "absolute -left-6 grid h-4 w-4 place-items-center rounded-full ring-4 ring-background",
                    tone.dot,
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                </div>
                <div className="rounded-2xl border border-border bg-secondary/40 p-4">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-display font-bold">{p.cycleLabel}</span>
                    <StatusBadge status={p.status === "submitted" ? "submitted" : p.status} />
                    <span className="ml-auto text-xs text-muted-foreground">
                      {new Date(p.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {taka(p.amount)}
                    {p.method ? ` · ${p.method}` : ""}
                    {p.transactionId ? ` · TXN ${p.transactionId}` : ""}
                  </p>
                  {p.status === "rejected" && (
                    <div className="mt-3 rounded-xl border border-danger/40 bg-danger/10 p-3">
                      <div className="flex items-start gap-2">
                        <Icons.CircleX className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                        <div className="min-w-0 space-y-0.5">
                          <p className="text-sm font-semibold text-danger">Rejected by manager</p>
                          <p className="text-sm text-foreground">
                            {p.reviewNote?.trim()
                              ? `Reason: “${p.reviewNote.trim()}”`
                              : "No reason was provided."}
                          </p>
                          {p.reviewedAt && (
                            <p className="text-xs text-muted-foreground">
                              Reviewed {new Date(p.reviewedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  {p.status === "approved" && p.reviewNote?.trim() && (
                    <p className="mt-3 text-sm text-success">
                      Manager note: “{p.reviewNote.trim()}”
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

const activityIcons: Record<string, keyof typeof Icons> = {
  payment_submitted: "Upload",
  payment_approved: "CircleCheck",
  payment_rejected: "CircleX",
  badge: "Award",
  renewal: "RefreshCw",
  member_joined: "UserPlus",
  reminder: "BellRing",
  cycle_closed: "CalendarCheck",
  bulk_review: "ListChecks",
};

function GroupActivity({ groupId, groupName }: { groupId: string; groupName: string }) {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["activity", groupId],
    queryFn: () => fetchGroupActivity(groupId),
  });

  return (
    <Card className="glass rounded-3xl border-border p-6">
      <h3 className="mb-5 font-display text-lg font-bold">{groupName} activity</h3>
      {isLoading ? (
        <div className="grid place-items-center py-8 text-muted-foreground">
          <Icons.Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon="Clock"
          title="No activity yet"
          text="Payments and approvals will appear here."
        />
      ) : (
        <div className="relative space-y-6 pl-6">
          <div className="absolute left-2 top-1 bottom-1 w-px bg-border" />
          {items.map((t) => {
            const ActIcon = (Icons[(activityIcons[t.type] ?? "Circle") as keyof typeof Icons] ??
              Icons.Circle) as React.ComponentType<{ className?: string }>;
            return (
              <div key={t.id} className="relative">
                <div className="absolute -left-6 grid h-4 w-4 place-items-center rounded-full bg-cyan text-cyan-foreground ring-4 ring-background">
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                </div>
                <div className="flex items-center gap-3">
                  <ActIcon className="h-4 w-4 text-cyan" />
                  <p className="text-sm">{t.text}</p>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(t.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function GroupAchievements() {
  const items = [
    { name: "Full Collection Month", icon: "CircleCheck", earned: true },
    { name: "Zero Late Payments", icon: "Clock", earned: false },
    { name: "3 Months Active", icon: "CalendarCheck", earned: true },
    { name: "Fully Occupied Group", icon: "Users", earned: true },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((a) => {
        const Icon = Icons[a.icon as keyof typeof Icons] as React.ComponentType<{
          className?: string;
        }>;
        return (
          <Card
            key={a.name}
            className={cn(
              "glass rounded-3xl border-border p-6 text-center",
              !a.earned && "opacity-50",
            )}
          >
            <div
              className={cn(
                "mx-auto grid h-14 w-14 place-items-center rounded-2xl",
                a.earned
                  ? "bg-gradient-to-br from-cyan to-violet text-primary-foreground"
                  : "bg-secondary text-muted-foreground",
              )}
            >
              <Icon className="h-7 w-7" />
            </div>
            <p className="mt-3 font-display font-bold">{a.name}</p>
            <p className="text-xs text-muted-foreground">{a.earned ? "Unlocked" : "Locked"}</p>
          </Card>
        );
      })}
    </div>
  );
}

function InviteDialog({ group }: { group: Group }) {
  const [open, setOpen] = useState(false);
  const code = group.inviteCode ?? "";
  const link =
    typeof window !== "undefined"
      ? `${window.location.origin}/app/join?code=${code}`
      : `/app/join?code=${code}`;

  function copy(value: string, label: string) {
    navigator.clipboard?.writeText(value).then(
      () => toast.success(`${label} copied`),
      () => toast.error("Couldn't copy"),
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="cyan" className="ml-auto rounded-xl">
          <Icons.UserPlus className="h-4 w-4" /> Invite
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl border-border">
        <DialogHeader>
          <DialogTitle className="font-display">Invite members</DialogTitle>
          <DialogDescription>
            Share this code or link. Anyone with an Orbit account can join if seats are open.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>Invite code</Label>
            <div className="flex gap-2">
              <div className="flex-1 rounded-xl bg-secondary/50 px-4 py-2.5 font-mono text-lg font-bold tracking-[0.3em]">
                {code}
              </div>
              <Button variant="secondary" className="rounded-xl" onClick={() => copy(code, "Code")}>
                <Icons.Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Invite link</Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={link}
                className="rounded-xl bg-secondary/50 text-xs"
                onFocus={(e) => e.currentTarget.select()}
              />
              <Button variant="secondary" className="rounded-xl" onClick={() => copy(link, "Link")}>
                <Icons.Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GroupSettings({ group, isManager }: { group: Group; isManager: boolean }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(group.name);
  const [monthlyTotal, setMonthlyTotal] = useState(String(group.monthlyTotal));
  const [maxSeats, setMaxSeats] = useState(String(group.maxSeats));
  const [renewalDate, setRenewalDate] = useState(group.renewalDate ?? "");
  const [dueDate, setDueDate] = useState(group.dueDate ?? "");
  const [gradient, setGradient] = useState(group.gradient);
  const [icon, setIcon] = useState(group.icon);
  const [bkash, setBkash] = useState(group.bkash ?? "");
  const [nagad, setNagad] = useState(group.nagad ?? "");
  const [note, setNote] = useState(group.paymentInstructions ?? "");

  useEffect(() => {
    setName(group.name);
    setMaxSeats(String(group.maxSeats));
    setRenewalDate(group.renewalDate ?? "");
    setDueDate(group.dueDate ?? "");
    setBkash(group.bkash ?? "");
    setNagad(group.nagad ?? "");
    setNote(group.paymentInstructions ?? "");
  }, [
    group.id,
    group.name,
    group.maxSeats,
    group.renewalDate,
    group.dueDate,
    group.bkash,
    group.nagad,
    group.paymentInstructions,
  ]);

  const save = useMutation({
    mutationFn: () =>
      updateGroupSettings({
        groupId: group.id,
        name,
        monthlyTotal: Number(monthlyTotal) || group.monthlyTotal,
        maxSeats: Number(maxSeats) || group.maxSeats,
        renewalDate,
        dueDate,
        gradient,
        icon,
        bkash,
        nagad,
        paymentInstructions: note,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group", group.id] });
      toast.success("Settings saved");
    },
    onError: (err) =>
      toast.error("Couldn't save", {
        description: err instanceof Error ? err.message : "Please try again.",
      }),
  });

  if (!isManager) {
    return (
      <EmptyState
        icon="Lock"
        title="Managers only"
        text="Only the group owner and co-managers can edit settings."
      />
    );
  }
  return (
    <div className="space-y-6">
      {group.inviteCode && (
        <Card className="glass rounded-3xl border-border p-6">
          <h3 className="mb-1 font-display text-lg font-bold">Invite members</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Share your invite code to fill open seats.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-xl bg-secondary/50 px-4 py-2 font-mono text-lg font-bold tracking-[0.3em]">
              {group.inviteCode}
            </span>
            <InviteDialog group={group} />
          </div>
        </Card>
      )}

      <Card className="glass rounded-3xl border-border p-6">
        <h3 className="mb-1 font-display text-lg font-bold">Group details</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Update the core setup for this group, including its amount and visual theme.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2 sm:col-span-2">
            <Label>Group name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl bg-secondary/50"
            />
          </div>
          <div className="grid gap-2">
            <Label>Monthly amount</Label>
            <Input
              type="number"
              min="0"
              value={monthlyTotal}
              onChange={(e) => setMonthlyTotal(e.target.value)}
              className="rounded-xl bg-secondary/50"
            />
          </div>
          <div className="grid gap-2">
            <Label>Max seats</Label>
            <Input
              type="number"
              min="1"
              value={maxSeats}
              onChange={(e) => setMaxSeats(e.target.value)}
              className="rounded-xl bg-secondary/50"
            />
          </div>
          <div className="grid gap-2">
            <Label>Renewal date</Label>
            <Input
              type="date"
              value={renewalDate}
              onChange={(e) => setRenewalDate(e.target.value)}
              className="rounded-xl bg-secondary/50"
            />
          </div>
          <div className="grid gap-2">
            <Label>Payment deadline</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded-xl bg-secondary/50"
            />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label>Theme</Label>
            <div className="flex flex-wrap gap-3">
              {[
                "from-cyan to-violet",
                "from-danger to-violet",
                "from-success to-cyan",
                "from-warning to-danger",
                "from-violet to-success",
              ].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setGradient(value)}
                  className={cn(
                    "h-10 w-10 rounded-xl bg-gradient-to-br transition-all",
                    value,
                    gradient === value && "ring-2 ring-cyan ring-offset-2 ring-offset-background",
                  )}
                />
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Icon</Label>
            <Select value={icon} onValueChange={setIcon}>
              <SelectTrigger className="rounded-xl bg-secondary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[
                  { value: "Boxes", label: "Boxes" },
                  { value: "Play", label: "Play" },
                  { value: "Sparkles", label: "Sparkles" },
                  { value: "Music4", label: "Music" },
                  { value: "Monitor", label: "Monitor" },
                  { value: "Wifi", label: "Wi-Fi" },
                  { value: "Home", label: "Home" },
                  { value: "Wallet", label: "Wallet" },
                ].map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          variant="cyan"
          className="mt-4 rounded-xl"
          onClick={() => save.mutate()}
          disabled={save.isPending}
        >
          {save.isPending ? "Saving…" : "Save changes"}
        </Button>
      </Card>

      <Card className="glass rounded-3xl border-border p-6">
        <h3 className="mb-4 font-display text-lg font-bold">Payment instructions</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>bKash number</Label>
            <Input
              value={bkash}
              onChange={(e) => setBkash(e.target.value)}
              className="rounded-xl bg-secondary/50"
            />
          </div>
          <div className="grid gap-2">
            <Label>Nagad number</Label>
            <Input
              value={nagad}
              onChange={(e) => setNagad(e.target.value)}
              className="rounded-xl bg-secondary/50"
            />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label>Note to members</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="rounded-xl bg-secondary/50"
            />
          </div>
        </div>
      </Card>

      {group.myRole === "owner" && <GroupStatusCard group={group} />}
    </div>
  );
}

function GroupStatusCard({ group }: { group: Group }) {
  const queryClient = useQueryClient();
  const current = group.status || "Active";

  const statusMutation = useMutation({
    mutationFn: (status: "Active" | "Paused" | "Archived") => setGroupStatus(group.id, status),
    onSuccess: (_d, status) => {
      queryClient.invalidateQueries({ queryKey: ["group", group.id] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast.success(`Group ${status.toLowerCase()}`);
    },
    onError: (err) =>
      toast.error("Couldn't update group", {
        description: err instanceof Error ? err.message : "Please try again.",
      }),
  });

  const options: {
    value: "Active" | "Paused" | "Archived";
    label: string;
    desc: string;
    icon: keyof typeof Icons;
  }[] = [
    { value: "Active", label: "Active", desc: "Collecting payments normally.", icon: "Play" },
    {
      value: "Paused",
      label: "Paused",
      desc: "Hide reminders and pause dues temporarily.",
      icon: "Pause",
    },
    {
      value: "Archived",
      label: "Archived",
      desc: "Close the group and stop all activity.",
      icon: "Archive",
    },
  ];

  return (
    <Card className="glass rounded-3xl border-border p-6">
      <h3 className="mb-1 font-display text-lg font-bold">Group status</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        Owners can pause or archive the whole group.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {options.map((o) => {
          const Icon = Icons[o.icon] as React.ComponentType<{ className?: string }>;
          const active = current === o.value;
          const control = (
            <div
              className={cn(
                "flex h-full flex-col gap-2 rounded-2xl border p-4 text-left transition-colors",
                active
                  ? "border-cyan/50 bg-cyan/5"
                  : "border-border bg-secondary/40 hover:bg-secondary/60",
                statusMutation.isPending && "opacity-60",
              )}
            >
              <div className="flex items-center gap-2">
                <Icon className={cn("h-4 w-4", active ? "text-cyan" : "text-muted-foreground")} />
                <span className="font-display font-bold">{o.label}</span>
                {active && <Icons.Check className="ml-auto h-4 w-4 text-cyan" />}
              </div>
              <p className="text-xs text-muted-foreground">{o.desc}</p>
            </div>
          );
          if (active) return <div key={o.value}>{control}</div>;
          if (o.value === "Archived") {
            return (
              <AlertDialog key={o.value}>
                <AlertDialogTrigger asChild disabled={statusMutation.isPending}>
                  <button type="button" className="text-left">
                    {control}
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-3xl border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-display">
                      Archive this group?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Archiving stops all dues and activity. You can set it back to Active later.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="rounded-xl bg-danger text-primary-foreground hover:brightness-110"
                      onClick={() => statusMutation.mutate("Archived")}
                    >
                      Archive
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            );
          }
          return (
            <button
              key={o.value}
              type="button"
              className="text-left"
              disabled={statusMutation.isPending}
              onClick={() => statusMutation.mutate(o.value)}
            >
              {control}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function EmptyState({
  icon,
  title,
  text,
}: {
  icon: keyof typeof Icons;
  title: string;
  text: string;
}) {
  const Icon = Icons[icon] as React.ComponentType<{ className?: string }>;
  return (
    <div className="grid place-items-center rounded-3xl border border-dashed border-border py-14 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-muted-foreground">
        <Icon className="h-7 w-7" />
      </div>
      <p className="mt-3 font-display text-lg font-bold">{title}</p>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
