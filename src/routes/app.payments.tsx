import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Icons from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatCard } from "@/components/orbit/StatCard";
import { StatusBadge } from "@/components/orbit/StatusBadge";
import { GradientAvatar } from "@/components/orbit/GradientAvatar";
import { taka, relativeDue } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchMyGroups,
  fetchApprovalQueue,
  reviewPayment,
  reviewPayments,
  cycleLabel,
  type ApprovalItem,
} from "@/lib/orbit-api";

export const Route = createFileRoute("/app/payments")({
  component: PaymentsPage,
});

function PaymentsPage() {
  const { user } = useAuth();
  const { data: groups = [] } = useQuery({
    queryKey: ["groups"],
    queryFn: fetchMyGroups,
  });

  const dueRows = useMemo(
    () =>
      groups
        .map((g) => ({ g, me: g.members.find((m) => m.person.id === user?.id) }))
        .filter((r) => r.me),
    [groups, user?.id],
  );
  const totalDue = dueRows.reduce(
    (s, r) => s + (r.me!.paymentStatus !== "approved" ? r.me!.monthlyShare : 0),
    0,
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Payments</h1>
        <p className="mt-1 text-muted-foreground">Track your dues and clear the approval queue.</p>
      </div>

      <Tabs defaultValue="approvals">
        <TabsList className="rounded-xl bg-secondary/50">
          <TabsTrigger value="approvals" className="rounded-lg">
            Approval queue
          </TabsTrigger>
          <TabsTrigger value="mine" className="rounded-lg">
            My dues
          </TabsTrigger>
        </TabsList>

        <TabsContent value="approvals" className="mt-6">
          <ApprovalQueue />
        </TabsContent>

        <TabsContent value="mine" className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatCard
              label="Due this month"
              value={taka(totalDue)}
              icon="Wallet"
              accent="warning"
            />
            <StatCard label="Groups" value={`${groups.length}`} icon="Boxes" accent="cyan" />
            <StatCard
              label="Settled"
              value={`${dueRows.filter((r) => r.me!.paymentStatus === "approved").length}`}
              icon="CircleCheck"
              accent="success"
            />
          </div>
          <div className="space-y-3">
            {dueRows.length === 0 ? (
              <EmptyCard
                icon="Wallet"
                title="No dues yet"
                text="Join or create a group to start tracking payments."
              />
            ) : (
              dueRows.map(({ g, me }) => (
                <Card
                  key={g.id}
                  className="glass flex flex-wrap items-center gap-4 rounded-2xl border-border p-4"
                >
                  <GradientAvatar name={g.name} gradient={g.gradient} size={40} />
                  <div className="min-w-0">
                    <p className="font-medium">{g.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {taka(me!.monthlyShare)}
                      {g.dueDate ? ` · ${relativeDue(g.dueDate)}` : ""}
                    </p>
                  </div>
                  <div className="ml-auto flex items-center gap-3">
                    <StatusBadge status={me!.paymentStatus} />
                    <Button
                      asChild
                      size="sm"
                      variant={me!.paymentStatus === "approved" ? "secondary" : "cyan"}
                      className="rounded-lg"
                    >
                      <Link to="/app/groups/$groupId" params={{ groupId: g.id }}>
                        {me!.paymentStatus === "approved" ? "View" : "Pay now"}
                      </Link>
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

const APPROVAL_STATUS_KEY = "orbit:approval-queue:status";
const APPROVAL_SORT_KEY = "orbit:approval-queue:sort";

function approvalStatusKey(groupId: string) {
  return `${APPROVAL_STATUS_KEY}:${groupId}`;
}

function approvalSortKey(groupId: string) {
  return `${APPROVAL_SORT_KEY}:${groupId}`;
}

function loadSavedApprovalStatus(groupId: string): "submitted" | "approved" | "rejected" | null {
  if (typeof window === "undefined") return null;
  const saved = window.localStorage.getItem(approvalStatusKey(groupId));
  if (saved === "submitted" || saved === "approved" || saved === "rejected") return saved;
  return null;
}

function loadSavedApprovalSort(groupId: string): "newest" | "oldest" | null {
  if (typeof window === "undefined") return null;
  const saved = window.localStorage.getItem(approvalSortKey(groupId));
  if (saved === "newest" || saved === "oldest") return saved;
  return null;
}

function ApprovalQueue() {
  const queryClient = useQueryClient();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["approval-queue"],
    queryFn: fetchApprovalQueue,
  });

  const [groupFilter, setGroupFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"submitted" | "approved" | "rejected">(
    () => loadSavedApprovalStatus("all") ?? "submitted",
  );
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">(
    () => loadSavedApprovalSort("all") ?? "newest",
  );
  const [poppingId, setPoppingId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ApprovalItem | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkReject, setBulkReject] = useState(false);

  const isFiltered = groupFilter !== "all" || sortOrder !== "newest";

  const resetFilters = () => {
    setGroupFilter("all");
    setSortOrder("newest");
  };

  useEffect(() => {
    setStatusFilter(loadSavedApprovalStatus(groupFilter) ?? "submitted");
    setSortOrder(loadSavedApprovalSort(groupFilter) ?? "newest");
  }, [groupFilter]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(approvalStatusKey(groupFilter), statusFilter);
  }, [groupFilter, statusFilter]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(approvalSortKey(groupFilter), sortOrder);
  }, [groupFilter, sortOrder]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["approval-queue"] });
    queryClient.invalidateQueries({ queryKey: ["groups"] });
  };

  const review = useMutation({
    mutationFn: ({
      id,
      decision,
      note,
    }: {
      id: string;
      decision: "approved" | "rejected";
      note?: string;
    }) => reviewPayment(id, decision, note),
    onSuccess: (_d, vars) => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["group"] });
      if (vars.decision === "approved") {
        toast.success("Payment approved", { description: "+5 OP to you · member notified." });
      } else {
        toast("Payment rejected", { description: "The member was notified with your reason." });
      }
    },
    onError: (err) =>
      toast.error("Action failed", {
        description: err instanceof Error ? err.message : "Please try again.",
      }),
  });

  function approve(item: ApprovalItem) {
    setPoppingId(item.id);
    review.mutate({ id: item.id, decision: "approved" });
    setTimeout(() => setPoppingId(null), 1400);
  }

  const bulkReview = useMutation({
    mutationFn: ({
      ids,
      decision,
      note,
    }: {
      ids: string[];
      decision: "approved" | "rejected";
      note?: string;
    }) => reviewPayments(ids, decision, note),
    onSuccess: (res, vars) => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["group"] });
      setSelected(new Set());
      setBulkReject(false);
      const verb = vars.decision === "approved" ? "approved" : "rejected";
      if (res.failed === 0) {
        toast.success(`${res.succeeded} payment${res.succeeded === 1 ? "" : "s"} ${verb}`, {
          description: "Members were notified.",
        });
      } else {
        toast.warning(`${res.succeeded} ${verb}, ${res.failed} failed`, {
          description: "Some payments couldn't be processed. Please retry.",
        });
      }
    },
    onError: (err) =>
      toast.error("Bulk action failed", {
        description: err instanceof Error ? err.message : "Please try again.",
      }),
  });

  const groupOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const i of items) map.set(i.groupId, i.groupName);
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [items]);

  // Narrow by group first, then compute per-status counts from that subset.
  const byGroup = useMemo(
    () => (groupFilter === "all" ? items : items.filter((i) => i.groupId === groupFilter)),
    [items, groupFilter],
  );

  const counts = useMemo(
    () => ({
      submitted: byGroup.filter((i) => i.status === "submitted").length,
      approved: byGroup.filter((i) => i.status === "approved").length,
      rejected: byGroup.filter((i) => i.status === "rejected").length,
    }),
    [byGroup],
  );

  const statusFilters = [
    { value: "submitted" as const, label: "Pending", icon: Icons.Clock },
    { value: "approved" as const, label: "Approved", icon: Icons.CheckCircle2 },
    { value: "rejected" as const, label: "Rejected", icon: Icons.XCircle },
  ];

  const filtered = useMemo(() => {
    const list = byGroup.filter((i) => i.status === statusFilter);
    return [...list].sort((a, b) => {
      const aTime = new Date(a.submittedAt).getTime();
      const bTime = new Date(b.submittedAt).getTime();
      return sortOrder === "newest" ? bTime - aTime : aTime - bTime;
    });
  }, [byGroup, statusFilter, sortOrder]);
  const totalAmount = filtered.reduce((s, i) => s + i.amount, 0);

  // Bulk selection only applies to pending items. Keep the selection in sync
  // with what's actually visible so hidden rows can never be acted on.
  const selectable = statusFilter === "submitted";
  const visibleIds = useMemo(() => filtered.map((i) => i.id), [filtered]);

  useEffect(() => {
    setSelected((prev) => {
      if (prev.size === 0) return prev;
      const next = new Set<string>();
      for (const id of visibleIds) if (prev.has(id)) next.add(id);
      return next.size === prev.size ? prev : next;
    });
  }, [visibleIds]);

  useEffect(() => {
    if (!selectable) setSelected(new Set());
  }, [selectable]);

  const selectedItems = useMemo(
    () => filtered.filter((i) => selected.has(i.id)),
    [filtered, selected],
  );
  const selectedTotal = selectedItems.reduce((s, i) => s + i.amount, 0);
  const allVisibleSelected = selectable && filtered.length > 0 && selected.size === filtered.length;

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () => setSelected(allVisibleSelected ? new Set() : new Set(visibleIds));

  const bulkApprove = () => bulkReview.mutate({ ids: Array.from(selected), decision: "approved" });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard
          label="Awaiting review"
          value={`${counts.submitted}`}
          icon="ClipboardCheck"
          accent="cyan"
        />
        <StatCard
          label="Groups affected"
          value={`${groupOptions.length}`}
          icon="Boxes"
          accent="violet"
        />
        <StatCard
          label={
            filtered.length === byGroup.length
              ? "Total value"
              : `${statusFilters.find((s) => s.value === statusFilter)?.label} value`
          }
          value={taka(totalAmount)}
          icon="Wallet"
          accent="warning"
        />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <ToggleGroup
          type="single"
          value={statusFilter}
          onValueChange={(v) => v && setStatusFilter(v as typeof statusFilter)}
          variant="outline"
          size="sm"
          className="flex-wrap justify-start"
        >
          {statusFilters.map((f) => {
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
                    statusFilter === f.value
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
          {groupOptions.length > 1 && (
            <div className="flex items-center gap-3">
              <Icons.Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={groupFilter} onValueChange={setGroupFilter}>
                <SelectTrigger className="w-full max-w-xs rounded-xl bg-secondary/50 lg:w-[220px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All groups</SelectItem>
                  {groupOptions.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Icons.ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as typeof sortOrder)}>
              <SelectTrigger className="w-full max-w-xs rounded-xl bg-secondary/50 sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            disabled={!isFiltered}
            className="gap-2 text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            <Icons.RotateCcw className="h-4 w-4" />
            Reset filters
          </Button>
        </div>
      </div>

      {selectable && filtered.length > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-secondary/40 p-3 sm:flex-row sm:items-center">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <Checkbox
              checked={allVisibleSelected ? true : selected.size > 0 ? "indeterminate" : false}
              onCheckedChange={toggleAll}
              aria-label="Select all pending payments"
            />
            <span className="text-muted-foreground">
              {selected.size > 0
                ? `${selected.size} selected · ${taka(selectedTotal)}`
                : "Select all"}
            </span>
          </label>
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            <Button
              size="sm"
              variant="success"
              className="rounded-lg"
              disabled={selected.size === 0 || bulkReview.isPending}
              onClick={bulkApprove}
            >
              <Icons.CheckCheck className="h-4 w-4" />
              Approve {selected.size > 0 ? selected.size : ""}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-lg text-danger"
              disabled={selected.size === 0 || bulkReview.isPending}
              onClick={() => setBulkReject(true)}
            >
              <Icons.X className="h-4 w-4" />
              Reject {selected.size > 0 ? selected.size : ""}
            </Button>
            {selected.size > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="rounded-lg text-muted-foreground"
                disabled={bulkReview.isPending}
                onClick={() => setSelected(new Set())}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Icons.Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyCard
          icon={statusFilter === "submitted" ? "CheckCheck" : "Inbox"}
          title={statusFilter === "submitted" ? "All caught up" : `No ${statusFilter} payments`}
          text={
            statusFilter === "submitted"
              ? "No payments are waiting for your review right now."
              : `Nothing ${statusFilter} in this view yet.`
          }
          tone={statusFilter === "submitted" ? "success" : "muted"}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const Icon = (Icons[item.groupIcon as keyof typeof Icons] ??
              Icons.Boxes) as React.ComponentType<{ className?: string }>;
            const mismatch = item.expectedShare > 0 && item.amount !== item.expectedShare;
            return (
              <Card
                key={item.id}
                className={cn(
                  "glass relative overflow-hidden rounded-2xl border-border p-4",
                  selectable && selected.has(item.id) && "border-cyan/50 ring-1 ring-cyan/30",
                )}
              >
                {poppingId === item.id && (
                  <span className="absolute right-6 top-3 animate-op-pop font-display text-sm font-bold text-success">
                    +5 OP
                  </span>
                )}
                <div className="flex flex-wrap items-start gap-4">
                  {selectable && (
                    <Checkbox
                      checked={selected.has(item.id)}
                      onCheckedChange={() => toggleOne(item.id)}
                      aria-label={`Select payment from ${item.name}`}
                      className="mt-1"
                    />
                  )}
                  <GradientAvatar name={item.name} gradient={item.gradient} size={44} />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{item.name}</p>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground",
                        )}
                      >
                        <Icon className="h-3 w-3" /> {item.groupName}
                      </span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="font-display text-sm font-bold text-foreground">
                        {taka(item.amount)}
                      </span>
                      {item.method && <span className="capitalize">via {item.method}</span>}
                      {item.transactionId && <span>TXN {item.transactionId}</span>}
                      <span>{cycleLabel(item.cycleMonth)}</span>
                      <span>· {relativeSubmitted(item.submittedAt)}</span>
                    </div>
                    {mismatch && (
                      <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-warning/10 px-2 py-1 text-xs font-medium text-warning">
                        <Icons.AlertTriangle className="h-3.5 w-3.5" />
                        Expected {taka(item.expectedShare)} — amount differs by{" "}
                        {taka(Math.abs(item.amount - item.expectedShare))}
                      </p>
                    )}
                    {item.note && (
                      <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                        <Icons.MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span className="italic">“{item.note}”</span>
                      </p>
                    )}
                    {item.status === "rejected" && item.reviewNote && (
                      <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-danger/10 px-2 py-1 text-xs font-medium text-danger">
                        <Icons.Undo2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>Your reason: {item.reviewNote}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex w-full flex-col items-start gap-2 sm:w-auto sm:items-end">
                    {item.status === "submitted" ? (
                      <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:flex-col sm:items-stretch">
                        <Button
                          size="sm"
                          variant="success"
                          className={cn(
                            "flex-1 rounded-lg sm:flex-none",
                            poppingId === item.id && "animate-success-pulse",
                          )}
                          disabled={review.isPending}
                          onClick={() => approve(item)}
                        >
                          <Icons.Check className="h-4 w-4" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="flex-1 rounded-lg text-danger sm:flex-none"
                          disabled={review.isPending}
                          onClick={() => setRejectTarget(item)}
                        >
                          <Icons.X className="h-4 w-4" /> Reject
                        </Button>
                      </div>
                    ) : (
                      <>
                        <StatusBadge status={item.status} />
                        {item.reviewedAt && (
                          <span className="text-xs text-muted-foreground">
                            {relativeSubmitted(item.reviewedAt)}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <RejectDialog
        item={rejectTarget}
        onClose={() => setRejectTarget(null)}
        pending={review.isPending}
        onConfirm={(note) => {
          if (!rejectTarget) return;
          review.mutate(
            { id: rejectTarget.id, decision: "rejected", note },
            { onSuccess: () => setRejectTarget(null) },
          );
        }}
      />

      <BulkRejectDialog
        open={bulkReject}
        count={selected.size}
        total={selectedTotal}
        pending={bulkReview.isPending}
        onClose={() => setBulkReject(false)}
        onConfirm={(note) =>
          bulkReview.mutate({ ids: Array.from(selected), decision: "rejected", note })
        }
      />
    </div>
  );
}

const REJECT_REASONS = [
  "Amount doesn't match your share",
  "No matching transaction found",
  "Wrong payment method / account",
  "Duplicate submission",
];

function RejectDialog({
  item,
  onClose,
  onConfirm,
  pending,
}: {
  item: ApprovalItem | null;
  onClose: () => void;
  onConfirm: (note: string) => void;
  pending: boolean;
}) {
  const [note, setNote] = useState("");

  return (
    <Dialog
      open={!!item}
      onOpenChange={(o) => {
        if (!o) {
          setNote("");
          onClose();
        }
      }}
    >
      <DialogContent className="rounded-3xl border-border">
        <DialogHeader>
          <DialogTitle className="font-display">Reject payment</DialogTitle>
          <DialogDescription>
            {item ? `Let ${item.name} know why so they can fix it and resubmit.` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {REJECT_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setNote(r)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  note === r
                    ? "border-cyan/50 bg-cyan/10 text-cyan"
                    : "border-border bg-secondary/40 text-muted-foreground hover:bg-secondary/60",
                )}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="grid gap-2">
            <Label>Explanation (shared with the member)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a short reason…"
              className="rounded-xl bg-secondary/50"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            className="rounded-xl"
            onClick={() => {
              setNote("");
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="rounded-xl"
            disabled={pending || !note.trim()}
            onClick={() => onConfirm(note)}
          >
            {pending ? "Rejecting…" : "Reject & notify"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BulkRejectDialog({
  open,
  count,
  total,
  pending,
  onClose,
  onConfirm,
}: {
  open: boolean;
  count: number;
  total: number;
  pending: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
}) {
  const [note, setNote] = useState("");

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setNote("");
          onClose();
        }
      }}
    >
      <DialogContent className="rounded-3xl border-border">
        <DialogHeader>
          <DialogTitle className="font-display">
            Reject {count} payment{count === 1 ? "" : "s"}
          </DialogTitle>
          <DialogDescription>
            The same reason is shared with every selected member ({taka(total)} total) so they can
            fix and resubmit.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {REJECT_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setNote(r)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  note === r
                    ? "border-cyan/50 bg-cyan/10 text-cyan"
                    : "border-border bg-secondary/40 text-muted-foreground hover:bg-secondary/60",
                )}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="grid gap-2">
            <Label>Explanation (shared with all selected members)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a short reason…"
              className="rounded-xl bg-secondary/50"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            className="rounded-xl"
            onClick={() => {
              setNote("");
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="rounded-xl"
            disabled={pending || !note.trim()}
            onClick={() => onConfirm(note)}
          >
            {pending ? "Rejecting…" : `Reject ${count} & notify`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EmptyCard({
  icon,
  title,
  text,
  tone = "muted",
}: {
  icon: keyof typeof Icons;
  title: string;
  text: string;
  tone?: "muted" | "success";
}) {
  const Icon = Icons[icon] as React.ComponentType<{ className?: string }>;
  return (
    <Card className="glass grid place-items-center rounded-3xl border-dashed border-border py-14 text-center">
      <Icon
        className={cn("h-8 w-8", tone === "success" ? "text-success" : "text-muted-foreground")}
      />
      <p className="mt-3 font-display text-lg font-bold">{title}</p>
      <p className="text-sm text-muted-foreground">{text}</p>
    </Card>
  );
}

function relativeSubmitted(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const hrs = Math.floor(diff / 3_600_000);
  if (hrs < 1) return "just now";
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
