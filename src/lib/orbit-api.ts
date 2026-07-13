// Backend data layer for Orbit. Uses the browser Supabase client (RLS applies)
// and maps rows into the display shapes the UI already consumes.
import { supabase } from "@/integrations/supabase/client";
import type { Group, GroupMember, Person, PaymentStatus, Role } from "@/lib/demo-data";

export function currentCycle(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function cycleLabel(cycle: string): string {
  const [y, m] = cycle.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

async function uid(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
}

function deriveApprovedMonths(amount: number, monthlyShare: number): number {
  if (monthlyShare <= 0) return 1;
  return Math.max(1, Math.floor(amount / monthlyShare));
}

const FALLBACK_GRADIENT = "from-cyan to-violet";

function personFrom(
  id: string,
  profile?: {
    display_name?: string | null;
    email?: string | null;
    avatar_gradient?: string | null;
  },
): Person {
  return {
    id,
    name: profile?.display_name || "Orbit Member",
    email: profile?.email || "",
    avatarGradient: profile?.avatar_gradient || FALLBACK_GRADIENT,
  };
}

interface MemberRow {
  id: string;
  group_id: string;
  user_id: string;
  role: Role;
  status: GroupMember["status"];
  monthly_share: number;
  months_paid: number;
  streak: number;
  orbit_points: number;
}

interface PaymentRow {
  id: string;
  group_id: string;
  user_id: string;
  cycle_month: string;
  amount: number;
  method: string | null;
  transaction_id: string | null;
  note: string | null;
  status: "submitted" | "approved" | "rejected";
  submitted_at: string;
  review_note: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

const PAYMENT_STATUSES = ["submitted", "approved", "rejected"] as const;
type DbPaymentStatus = (typeof PAYMENT_STATUSES)[number];

// Coerce any partial/nullable DB row into a fully-populated PaymentRow so
// downstream mappers can never read `undefined` from a missing column.
function normalizePaymentRow(row: Partial<PaymentRow> | null | undefined): PaymentRow {
  const status = PAYMENT_STATUSES.includes(row?.status as DbPaymentStatus)
    ? (row?.status as DbPaymentStatus)
    : "submitted";
  return {
    id: row?.id ?? "",
    group_id: row?.group_id ?? "",
    user_id: row?.user_id ?? "",
    cycle_month: row?.cycle_month ?? "",
    amount: Number(row?.amount ?? 0),
    method: row?.method ?? null,
    transaction_id: row?.transaction_id ?? null,
    note: row?.note ?? null,
    status,
    submitted_at: row?.submitted_at ?? new Date().toISOString(),
    review_note: row?.review_note ?? null,
    reviewed_at: row?.reviewed_at ?? null,
    reviewed_by: row?.reviewed_by ?? null,
  };
}

interface GroupRow {
  id: string;
  name: string;
  category: string;
  icon: string;
  gradient: string;
  monthly_total: number;
  currency: string;
  renewal_date: string | null;
  due_date: string | null;
  max_seats: number;
  split_method: string;
  status: string;
  payment_instructions: string | null;
  bkash: string | null;
  nagad: string | null;
  owner_id: string;
  invite_code: string;
}

function statusFor(
  member: MemberRow,
  payments: PaymentRow[],
  dueDate: string | null,
): PaymentStatus {
  if (payments.some((payment) => payment.status === "approved")) return "approved";
  const latestPayment = payments.reduce<PaymentRow | undefined>((latest, payment) => {
    if (!latest || new Date(payment.submitted_at) > new Date(latest.submitted_at)) return payment;
    return latest;
  }, undefined);
  if (latestPayment?.status === "submitted") return "submitted";
  if (latestPayment?.status === "rejected") return "rejected";
  if (dueDate && new Date(dueDate) < new Date(new Date().toDateString())) return "overdue";
  return "due_soon";
}

function assembleGroup(
  g: GroupRow,
  members: MemberRow[],
  payments: PaymentRow[],
  profiles: Map<
    string,
    { display_name?: string | null; email?: string | null; avatar_gradient?: string | null }
  >,
  me: string,
): Group {
  const cycle = currentCycle();
  const cyclePaymentsByUser = new Map<string, PaymentRow[]>();
  const latestByUser = new Map<string, PaymentRow>();
  for (const p of payments.filter((p) => p.group_id === g.id && p.cycle_month === cycle)) {
    const userPayments = cyclePaymentsByUser.get(p.user_id) ?? [];
    userPayments.push(p);
    cyclePaymentsByUser.set(p.user_id, userPayments);

    const prev = latestByUser.get(p.user_id);
    if (!prev || new Date(p.submitted_at) > new Date(prev.submitted_at)) {
      latestByUser.set(p.user_id, p);
    }
  }

  const gm = members.filter((m) => m.group_id === g.id);
  const mapped: GroupMember[] = gm.map((m) => {
    const userPayments = cyclePaymentsByUser.get(m.user_id) ?? [];
    return {
      person: personFrom(m.user_id, profiles.get(m.user_id)),
      role: m.role,
      status: m.status,
      monthlyShare: Number(m.monthly_share),
      monthsPaid: m.months_paid,
      streak: m.streak,
      orbitPoints: m.orbit_points,
      paymentStatus: statusFor(m, userPayments, g.due_date),
    };
  });

  const collected = Array.from(latestByUser.values())
    .filter((p) => p.status === "approved")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const pendingApprovals = Array.from(latestByUser.values()).filter(
    (p) => p.status === "submitted",
  ).length;
  const myRole = gm.find((m) => m.user_id === me)?.role ?? "member";

  return {
    id: g.id,
    name: g.name,
    category: g.category as Group["category"],
    icon: g.icon,
    gradient: g.gradient,
    monthlyTotal: Number(g.monthly_total),
    currency: g.currency,
    renewalDate: g.renewal_date || "",
    dueDate: g.due_date || "",
    maxSeats: g.max_seats,
    splitMethod: g.split_method,
    status: (g.status as Group["status"]) || "Active",
    collected,
    pendingApprovals,
    paymentInstructions: g.payment_instructions || "",
    bkash: g.bkash || undefined,
    nagad: g.nagad || undefined,
    members: mapped,
    myRole,
    inviteCode: g.invite_code,
  };
}

async function loadProfiles(userIds: string[]) {
  const map = new Map<
    string,
    { display_name?: string | null; email?: string | null; avatar_gradient?: string | null }
  >();
  if (userIds.length === 0) return map;
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, email, avatar_gradient")
    .in("id", userIds);
  for (const p of data ?? []) map.set(p.id, p);
  return map;
}

function profileName(
  profiles: Map<
    string,
    { display_name?: string | null; email?: string | null; avatar_gradient?: string | null }
  >,
  id: string,
  fallback = "Orbit Member",
): string {
  return profiles.get(id)?.display_name || profiles.get(id)?.email || fallback;
}

export async function fetchMyGroups(): Promise<Group[]> {
  const me = await uid();
  const { data: myMemberships, error } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", me)
    .eq("status", "active");
  if (error) throw error;
  const groupIds = (myMemberships ?? []).map((m) => m.group_id);
  if (groupIds.length === 0) return [];

  const [{ data: groupsData }, { data: membersData }, { data: paymentsData }] = await Promise.all([
    supabase.from("groups").select("*").in("id", groupIds),
    supabase.from("group_members").select("*").in("group_id", groupIds),
    supabase
      .from("payments")
      .select("*")
      .in("group_id", groupIds)
      .eq("cycle_month", currentCycle()),
  ]);

  const members = (membersData ?? []) as MemberRow[];
  const profiles = await loadProfiles([...new Set(members.map((m) => m.user_id))]);
  return (groupsData ?? []).map((g) =>
    assembleGroup(
      g as GroupRow,
      members,
      ((paymentsData ?? []) as Partial<PaymentRow>[]).map(normalizePaymentRow),
      profiles,
      me,
    ),
  );
}

export async function fetchGroup(groupId: string): Promise<Group | null> {
  const me = await uid();
  const [{ data: g }, { data: membersData }, { data: paymentsData }] = await Promise.all([
    supabase.from("groups").select("*").eq("id", groupId).maybeSingle(),
    supabase.from("group_members").select("*").eq("group_id", groupId),
    supabase.from("payments").select("*").eq("group_id", groupId),
  ]);
  if (!g) return null;
  const members = (membersData ?? []) as MemberRow[];
  const profiles = await loadProfiles([...new Set(members.map((m) => m.user_id))]);
  return assembleGroup(
    g as GroupRow,
    members,
    ((paymentsData ?? []) as Partial<PaymentRow>[]).map(normalizePaymentRow),
    profiles,
    me,
  );
}

export interface CreateGroupInput {
  name: string;
  category: string;
  gradient: string;
  icon?: string;
  price: number;
  seats: number;
  renewal: string;
  deadline: string;
  currency: string;
  split: string;
  bkash?: string;
  nagad?: string;
  note?: string;
}

export async function createGroup(input: CreateGroupInput): Promise<string> {
  const me = await uid();
  const { data, error } = await supabase
    .from("groups")
    .insert({
      name: input.name,
      category: input.category,
      gradient: input.gradient,
      icon: input.icon ?? "Boxes",
      monthly_total: input.price,
      max_seats: input.seats,
      renewal_date: input.renewal || null,
      due_date: input.deadline || null,
      currency: input.currency,
      split_method: input.split,
      payment_instructions: input.note || null,
      bkash: input.bkash || null,
      nagad: input.nagad || null,
      owner_id: me,
    })
    .select("id")
    .single();
  if (error) throw error;

  const share = Math.round(input.price / Math.max(input.seats, 1));
  await supabase
    .from("group_members")
    .update({ monthly_share: share })
    .eq("group_id", data.id)
    .eq("user_id", me);
  const profiles = await loadProfiles([me]);
  const actorName = profileName(profiles, me, "A manager");
  await supabase.from("activity").insert({
    group_id: data.id,
    user_id: me,
    type: "member_joined",
    text: `${actorName} created the group`,
  });
  return data.id;
}

export interface SubmitPaymentInput {
  groupId: string;
  amount: number;
  method: string;
  transactionId: string;
  note?: string;
  months?: number;
}

export async function submitPayment(input: SubmitPaymentInput): Promise<void> {
  const me = await uid();
  const months = Math.max(1, input.months ?? 1);
  const { data: membership } = await supabase
    .from("group_members")
    .select("monthly_share")
    .eq("group_id", input.groupId)
    .eq("user_id", me)
    .maybeSingle();
  const share = Number(membership?.monthly_share ?? 0);
  const amount = Number(input.amount) > 0 ? Number(input.amount) : share * months;
  const paymentNote = [input.note?.trim(), months > 1 ? `Covers ${months} months` : null]
    .filter(Boolean)
    .join(" • ");
  const { error } = await supabase.from("payments").insert({
    group_id: input.groupId,
    user_id: me,
    cycle_month: currentCycle(),
    amount,
    method: input.method,
    transaction_id: input.transactionId,
    note: paymentNote || null,
    status: "submitted",
  });
  if (error) throw error;
  const profiles = await loadProfiles([me]);
  const memberName = profileName(profiles, me);
  await supabase.from("activity").insert({
    group_id: input.groupId,
    user_id: me,
    type: "payment_submitted",
    text: `${memberName} submitted payment of ৳${amount} for ${cycleLabel(currentCycle())}`,
  });
}

export interface MyLatestPayment {
  id: string;
  status: DbPaymentStatus;
  amount: number;
  method: string | null;
  transactionId: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  submittedAt: string;
}

// The current user's most recent payment for this group + cycle, including any
// manager rejection note so the member can see exactly what to fix.
export async function fetchMyLatestPayment(groupId: string): Promise<MyLatestPayment | null> {
  const me = await uid();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("group_id", groupId)
    .eq("user_id", me)
    .eq("cycle_month", currentCycle())
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = normalizePaymentRow(data);
  return {
    id: row.id,
    status: row.status,
    amount: row.amount,
    method: row.method,
    transactionId: row.transaction_id,
    reviewNote: row.review_note,
    reviewedAt: row.reviewed_at,
    submittedAt: row.submitted_at,
  };
}

export interface MyPaymentHistoryItem {
  id: string;
  cycleMonth: string;
  cycleLabel: string;
  status: DbPaymentStatus;
  amount: number;
  method: string | null;
  transactionId: string | null;
  note: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  submittedAt: string;
}

// The current user's full payment history for a group across all cycles and
// attempts, newest first — including each manager rejection reason so members
// can review prior attempts and outcomes.
export async function fetchMyPaymentHistory(groupId: string): Promise<MyPaymentHistoryItem[]> {
  const me = await uid();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("group_id", groupId)
    .eq("user_id", me)
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as Partial<PaymentRow>[]).map(normalizePaymentRow).map((row) => ({
    id: row.id,
    cycleMonth: row.cycle_month,
    cycleLabel: cycleLabel(row.cycle_month),
    status: row.status,
    amount: row.amount,
    method: row.method,
    transactionId: row.transaction_id,
    note: row.note,
    reviewNote: row.review_note,
    reviewedAt: row.reviewed_at,
    submittedAt: row.submitted_at,
  }));
}

export async function reviewPayment(
  paymentId: string,
  decision: "approved" | "rejected",
  reviewNote?: string,
): Promise<void> {
  const me = await uid();
  const { data: pay } = await supabase.from("payments").select("*").eq("id", paymentId).single();
  const { error } = await supabase
    .from("payments")
    .update({
      status: decision,
      reviewed_by: me,
      reviewed_at: new Date().toISOString(),
      review_note: reviewNote?.trim() || null,
    })
    .eq("id", paymentId);
  if (error) throw error;

  if (pay && decision === "approved") {
    const { data: member } = await supabase
      .from("group_members")
      .select("months_paid, orbit_points, streak, monthly_share")
      .eq("group_id", pay.group_id)
      .eq("user_id", pay.user_id)
      .maybeSingle();
    if (member) {
      const coveredMonths = deriveApprovedMonths(pay.amount, Number(member.monthly_share ?? 0));
      await supabase
        .from("group_members")
        .update({
          months_paid: member.months_paid + coveredMonths,
          orbit_points: member.orbit_points + 10 * coveredMonths,
          streak: member.streak + coveredMonths,
        })
        .eq("group_id", pay.group_id)
        .eq("user_id", pay.user_id);
    }
  }
  if (pay) {
    const reason = reviewNote?.trim() ? ` — "${reviewNote.trim()}"` : "";
    const profiles = await loadProfiles([me, pay.user_id]);
    const actorName = profileName(profiles, me, "A manager");
    const memberName = profileName(profiles, pay.user_id);
    const verb = decision === "approved" ? "approved" : "rejected";
    await supabase.from("activity").insert({
      group_id: pay.group_id,
      user_id: me,
      type: decision === "approved" ? "payment_approved" : "payment_rejected",
      text: `${actorName} ${verb} payment of ${memberName}${reason}`,
    });

    // Detect whether this was a resubmission (more than one submission this cycle).
    const { count } = await supabase
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("group_id", pay.group_id)
      .eq("user_id", pay.user_id)
      .eq("cycle_month", pay.cycle_month);
    const isResubmission = (count ?? 0) > 1;

    const { data: group } = await supabase
      .from("groups")
      .select("name")
      .eq("id", pay.group_id)
      .maybeSingle();
    const groupName = group?.name ?? "your group";
    const cycle = cycleLabel(pay.cycle_month);
    const note = reviewNote?.trim();

    const title =
      decision === "approved"
        ? isResubmission
          ? "Resubmitted payment approved"
          : "Payment approved"
        : isResubmission
          ? "Resubmitted payment rejected again"
          : "Payment rejected";
    const body =
      decision === "approved"
        ? `Your ${cycle} payment for ${groupName} is confirmed. +10 OP earned.`
        : `Your ${cycle} payment for ${groupName} was rejected.${
            note ? ` Reason: "${note}". Please fix and resubmit.` : " Please fix and resubmit."
          }`;

    // Best-effort in-app notification for the member.
    await supabase.from("notifications").insert({
      user_id: pay.user_id,
      group_id: pay.group_id,
      kind: decision === "approved" ? "approved" : "rejected",
      title,
      body,
    });

    // Optional email — fire-and-forget, only sends if email is configured.
    void sendPaymentReviewEmail({
      userId: pay.user_id,
      subject: title,
      body,
    }).catch(() => {});
  }
}

// Review several payments at once with a single shared note. Runs each review
// sequentially so per-payment side effects (OP, notifications, activity) stay
// intact, and reports how many succeeded/failed.
export async function reviewPayments(
  paymentIds: string[],
  decision: "approved" | "rejected",
  reviewNote?: string,
): Promise<{ succeeded: number; failed: number }> {
  // Snapshot the affected payments up-front so the audit log can record who
  // was included even if a row's status changes during processing.
  const { data: paysBefore } = await supabase
    .from("payments")
    .select("id, group_id, user_id")
    .in("id", paymentIds);
  const snapshot = (paysBefore ?? []) as {
    id: string;
    group_id: string;
    user_id: string;
  }[];

  let succeeded = 0;
  let failed = 0;
  const succeededIds: string[] = [];
  for (const id of paymentIds) {
    try {
      await reviewPayment(id, decision, reviewNote);
      succeeded += 1;
      succeededIds.push(id);
    } catch {
      failed += 1;
    }
  }

  // Write a single audit-log entry per group summarizing the bulk action:
  // who acted, which members' payments were included, and the shared reason.
  if (succeededIds.length > 0) {
    await logBulkReviewAudit(
      snapshot.filter((p) => succeededIds.includes(p.id)),
      decision,
      reviewNote,
    );
  }

  return { succeeded, failed };
}

// Records one audit-log activity entry per group for a bulk approve/reject,
// capturing who acted, which members' payments were included, and the reason.
async function logBulkReviewAudit(
  payments: { id: string; group_id: string; user_id: string }[],
  decision: "approved" | "rejected",
  reviewNote?: string,
): Promise<void> {
  if (payments.length === 0) return;
  const me = await uid();

  // Resolve the actor's display name and the included members' names.
  const memberIds = [...new Set(payments.map((p) => p.user_id))];
  const profiles = await loadProfiles([...new Set([me, ...memberIds])]);
  const actorName = profiles.get(me)?.display_name || "A manager";

  const verb = decision === "approved" ? "approved" : "rejected";
  const reason = reviewNote?.trim() ? ` — "${reviewNote.trim()}"` : "";

  // Group the payments by their group so each group's feed gets its own summary.
  const byGroup = new Map<string, { id: string; user_id: string }[]>();
  for (const p of payments) {
    const list = byGroup.get(p.group_id) ?? [];
    list.push({ id: p.id, user_id: p.user_id });
    byGroup.set(p.group_id, list);
  }

  const nameOf = (id: string) => profiles.get(id)?.display_name || "a member";
  const rows = [...byGroup.entries()].map(([group_id, items]) => {
    const names = [...new Set(items.map((i) => nameOf(i.user_id)))];
    const namesText =
      names.length <= 3
        ? names.join(", ")
        : `${names.slice(0, 3).join(", ")} +${names.length - 3} more`;
    const count = items.length;
    return {
      group_id,
      user_id: me,
      type: "bulk_review",
      text: `${actorName} ${verb} ${count} payment${count === 1 ? "" : "s"} (${namesText})${reason}`,
    };
  });

  await supabase.from("activity").insert(rows);
}

// ---------------- Notifications ----------------

export interface AppNotification {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  read: boolean;
  createdAt: string;
  groupId: string | null;
}

export async function fetchNotifications(limit = 50): Promise<AppNotification[]> {
  const me = await uid();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", me)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((n) => ({
    id: n.id,
    kind: n.kind,
    title: n.title,
    body: n.body,
    read: n.read,
    createdAt: n.created_at,
    groupId: n.group_id,
  }));
}

export async function unreadNotificationCount(): Promise<number> {
  const me = await uid();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", me)
    .eq("read", false);
  return count ?? 0;
}

export async function markNotificationRead(id: string): Promise<void> {
  await supabase.from("notifications").update({ read: true }).eq("id", id);
}

export async function markAllNotificationsRead(): Promise<void> {
  const me = await uid();
  await supabase.from("notifications").update({ read: true }).eq("user_id", me).eq("read", false);
}

// Optional email delivery. Sends only when app email infrastructure is
// configured; otherwise it silently no-ops so reviews never fail.
async function sendPaymentReviewEmail(_input: {
  userId: string;
  subject: string;
  body: string;
}): Promise<void> {
  // Email requires a verified sending domain + transactional email setup.
  // Until that is enabled, in-app notifications carry the message.
  return;
}

export async function fetchGroupActivity(groupId: string) {
  const { data } = await supabase
    .from("activity")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .limit(20);
  return data ?? [];
}

export interface PendingPayment {
  id: string;
  userId: string;
  name: string;
  gradient: string;
  amount: number;
  method: string | null;
  transactionId: string | null;
  note: string | null;
}

export async function fetchPendingPayments(groupId: string): Promise<PendingPayment[]> {
  const { data } = await supabase
    .from("payments")
    .select("*")
    .eq("group_id", groupId)
    .eq("cycle_month", currentCycle())
    .eq("status", "submitted");
  const rows = ((data ?? []) as Partial<PaymentRow>[]).map(normalizePaymentRow);
  const profiles = await loadProfiles([...new Set(rows.map((r) => r.user_id))]);
  return rows.map((r) => {
    const p = profiles.get(r.user_id);
    return {
      id: r.id,
      userId: r.user_id,
      name: p?.display_name || "Orbit Member",
      gradient: p?.avatar_gradient || FALLBACK_GRADIENT,
      amount: Number(r.amount),
      method: r.method,
      transactionId: r.transaction_id,
      note: r.note,
    };
  });
}

export type ApprovalStatus = "submitted" | "approved" | "rejected";

export interface ApprovalItem {
  id: string;
  groupId: string;
  groupName: string;
  groupGradient: string;
  groupIcon: string;
  userId: string;
  name: string;
  gradient: string;
  amount: number;
  expectedShare: number;
  method: string | null;
  transactionId: string | null;
  note: string | null;
  submittedAt: string;
  cycleMonth: string;
  status: ApprovalStatus;
  reviewNote: string | null;
  reviewedAt: string | null;
}

// Global queue of every payment across the groups I manage (any status).
export async function fetchApprovalQueue(): Promise<ApprovalItem[]> {
  const me = await uid();
  const { data: managed } = await supabase
    .from("group_members")
    .select("group_id, role")
    .eq("user_id", me)
    .eq("status", "active")
    .in("role", ["owner", "co_manager"]);
  const groupIds = (managed ?? []).map((m) => m.group_id);
  if (groupIds.length === 0) return [];

  const [{ data: payData }, { data: groupData }, { data: memberData }] = await Promise.all([
    supabase
      .from("payments")
      .select("*")
      .in("group_id", groupIds)
      .in("status", ["submitted", "approved", "rejected"])
      .order("submitted_at", { ascending: false }),
    supabase.from("groups").select("id, name, gradient, icon").in("id", groupIds),
    supabase
      .from("group_members")
      .select("group_id, user_id, monthly_share")
      .in("group_id", groupIds),
  ]);

  const rows = ((payData ?? []) as Partial<PaymentRow>[]).map(normalizePaymentRow);
  const gmap = new Map((groupData ?? []).map((g) => [g.id, g]));
  const shareMap = new Map(
    (memberData ?? []).map((m) => [`${m.group_id}:${m.user_id}`, Number(m.monthly_share)]),
  );
  const profiles = await loadProfiles([...new Set(rows.map((r) => r.user_id))]);

  return rows.map((r) => {
    const g = gmap.get(r.group_id);
    const p = profiles.get(r.user_id);
    return {
      id: r.id,
      groupId: r.group_id,
      groupName: g?.name ?? "Group",
      groupGradient: g?.gradient ?? FALLBACK_GRADIENT,
      groupIcon: g?.icon ?? "Boxes",
      userId: r.user_id,
      name: p?.display_name || "Orbit Member",
      gradient: p?.avatar_gradient || FALLBACK_GRADIENT,
      amount: Number(r.amount),
      expectedShare: shareMap.get(`${r.group_id}:${r.user_id}`) ?? 0,
      method: r.method,
      transactionId: r.transaction_id,
      note: r.note,
      submittedAt: r.submitted_at,
      cycleMonth: r.cycle_month,
      status: (r.status as ApprovalStatus) ?? "submitted",
      reviewNote: r.review_note,
      reviewedAt: r.reviewed_at,
    };
  });
}

export interface DashboardStats {
  orbitPoints: number;
  streak: number;
  activeGroups: number;
  upcomingDues: number;
  groupsManaged: number;
  groupsJoined: number;
}

export function deriveStats(groups: Group[], meId: string): DashboardStats {
  let orbitPoints = 0;
  let streak = 0;
  let upcomingDues = 0;
  let managed = 0;
  for (const g of groups) {
    const me = g.members.find((m) => m.person.id === meId);
    if (me) {
      orbitPoints += me.orbitPoints;
      streak = Math.max(streak, me.streak);
      if (me.paymentStatus === "due_soon" || me.paymentStatus === "overdue") upcomingDues += 1;
    }
    if (g.myRole === "owner" || g.myRole === "co_manager") managed += 1;
  }
  return {
    orbitPoints,
    streak,
    activeGroups: groups.length,
    upcomingDues,
    groupsManaged: managed,
    groupsJoined: groups.length - managed,
  };
}

// ---------------- Invites ----------------

export interface GroupPreview {
  id: string;
  name: string;
  category: string;
  icon: string;
  gradient: string;
  monthlyTotal: number;
  currency: string;
  maxSeats: number;
  memberCount: number;
}

export async function previewGroupByCode(code: string): Promise<GroupPreview | null> {
  const clean = code.trim().toUpperCase();
  if (!clean) return null;
  const { data, error } = await supabase.rpc("group_preview_by_code", { _code: clean });
  if (error) throw error;
  const row = (data ?? [])[0];
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    icon: row.icon,
    gradient: row.gradient,
    monthlyTotal: Number(row.monthly_total),
    currency: row.currency,
    maxSeats: row.max_seats,
    memberCount: Number(row.member_count),
  };
}

export async function joinGroupByCode(code: string): Promise<string> {
  const clean = code.trim().toUpperCase();
  const { data, error } = await supabase.rpc("join_group_by_code", { _code: clean });
  if (error) throw error;
  return data as string;
}

export interface UpdateGroupInput {
  groupId: string;
  name?: string;
  maxSeats?: number;
  renewalDate?: string;
  dueDate?: string;
  monthlyTotal?: number;
  gradient?: string;
  icon?: string;
  bkash: string;
  nagad: string;
  paymentInstructions: string;
}

export async function updateGroupSettings(input: UpdateGroupInput): Promise<void> {
  const payload: Record<string, string | number | null> = {
    bkash: input.bkash || null,
    nagad: input.nagad || null,
    payment_instructions: input.paymentInstructions || null,
  };
  if (input.name !== undefined) payload.name = input.name.trim();
  if (typeof input.maxSeats === "number") payload.max_seats = input.maxSeats;
  if (input.renewalDate !== undefined) payload.renewal_date = input.renewalDate || null;
  if (input.dueDate !== undefined) payload.due_date = input.dueDate || null;
  if (input.monthlyTotal !== undefined) payload.monthly_total = input.monthlyTotal;
  if (input.gradient !== undefined) payload.gradient = input.gradient || null;
  if (input.icon !== undefined) payload.icon = input.icon || null;
  const { error } = await supabase.from("groups").update(payload).eq("id", input.groupId);
  if (error) throw error;
}

export interface ReminderInput {
  groupId: string;
  userId: string;
  memberName: string;
  groupName: string;
}

export async function sendReminderNotification(input: ReminderInput): Promise<void> {
  const me = await uid();
  const title = `Reminder: ${input.memberName}`;
  const body = `${input.memberName}, ${input.groupName} is waiting on your payment.`;

  const { error } = await supabase.from("notifications").insert({
    user_id: input.userId,
    group_id: input.groupId,
    kind: "reminder",
    title,
    body,
  });
  if (error) throw error;

  const profiles = await loadProfiles([me]);
  const actorName = profileName(profiles, me, "A manager");
  await supabase.from("activity").insert({
    group_id: input.groupId,
    user_id: me,
    type: "reminder_sent",
    text: `${actorName} sent a payment reminder to ${input.memberName}`,
  });
}

export interface SubmitPaymentForMemberInput {
  groupId: string;
  userId: string;
  amount: number;
  method: string;
  transactionId: string;
  note?: string;
  months?: number;
  approve?: boolean;
}

// Allows managers to record a payment on behalf of a member. When `approve` is
// true the payment is inserted as `approved` and the member's months_paid and
// orbit points are credited immediately.
export async function submitPaymentForMember(input: SubmitPaymentForMemberInput): Promise<void> {
  const me = await uid();
  const months = Math.max(1, input.months ?? 1);
  const paymentNote = [input.note?.trim(), months > 1 ? `Covers ${months} months` : null]
    .filter(Boolean)
    .join(" • ");

  const { error: insertErr, data } = await supabase.from("payments").insert({
    group_id: input.groupId,
    user_id: input.userId,
    cycle_month: currentCycle(),
    amount: input.amount,
    method: input.method,
    transaction_id: input.transactionId,
    note: paymentNote || null,
    status: input.approve ? "approved" : "submitted",
    reviewed_by: input.approve ? me : null,
    reviewed_at: input.approve ? new Date().toISOString() : null,
  });
  if (insertErr) throw insertErr;

  const profiles = await loadProfiles([me, input.userId]);
  const actorName = profileName(profiles, me, "A manager");
  const memberName = profileName(profiles, input.userId);

  if (input.approve) {
    // Credit months and orbit points immediately.
    const { data: member } = await supabase
      .from("group_members")
      .select("months_paid, orbit_points, streak, monthly_share")
      .eq("group_id", input.groupId)
      .eq("user_id", input.userId)
      .maybeSingle();
    if (member) {
      const coveredMonths = deriveApprovedMonths(input.amount, Number(member.monthly_share ?? 0));
      await supabase
        .from("group_members")
        .update({
          months_paid: member.months_paid + coveredMonths,
          orbit_points: member.orbit_points + 10 * coveredMonths,
          streak: member.streak + coveredMonths,
        })
        .eq("group_id", input.groupId)
        .eq("user_id", input.userId);
    }

    await supabase.from("activity").insert({
      group_id: input.groupId,
      user_id: me,
      type: "payment_approved",
      text: `${actorName} recorded and approved payment of ${memberName}`,
    });

    await supabase.from("notifications").insert({
      user_id: input.userId,
      group_id: input.groupId,
      kind: "approved",
      title: "Manager recorded a payment",
      body: `A manager recorded a payment for ${cycleLabel(currentCycle())}`,
    });
  } else {
    await supabase.from("activity").insert({
      group_id: input.groupId,
      user_id: me,
      type: "payment_submitted",
      text: `${actorName} recorded payment of ${memberName} for review`,
    });
  }
}

// ---------------- Manager tools ----------------

export async function updateMemberRole(
  groupId: string,
  userId: string,
  role: "co_manager" | "member",
): Promise<void> {
  const me = await uid();
  const { error } = await supabase
    .from("group_members")
    .update({ role })
    .eq("group_id", groupId)
    .eq("user_id", userId);
  if (error) throw error;
  const profiles = await loadProfiles([me, userId]);
  const actorName = profileName(profiles, me, "A manager");
  const memberName = profileName(profiles, userId);
  await supabase.from("activity").insert({
    group_id: groupId,
    user_id: me,
    type: "member_role_changed",
    text:
      role === "co_manager"
        ? `${actorName} promoted ${memberName} to co-manager`
        : `${actorName} changed ${memberName} back to member`,
  });
}

export async function removeMember(groupId: string, userId: string): Promise<void> {
  const me = await uid();
  const { error } = await supabase
    .from("group_members")
    .update({ status: "removed" })
    .eq("group_id", groupId)
    .eq("user_id", userId);
  if (error) throw error;
  const profiles = await loadProfiles([me, userId]);
  const actorName = profileName(profiles, me, "A manager");
  const memberName = profileName(profiles, userId);
  await supabase.from("activity").insert({
    group_id: groupId,
    user_id: me,
    type: "member_removed",
    text: `${actorName} removed ${memberName} from the group`,
  });
}

export async function setGroupStatus(
  groupId: string,
  status: "Active" | "Paused" | "Archived",
): Promise<void> {
  const me = await uid();
  const { error } = await supabase.from("groups").update({ status }).eq("id", groupId);
  if (error) throw error;
  const profiles = await loadProfiles([me]);
  const actorName = profileName(profiles, me, "A manager");
  await supabase.from("activity").insert({
    group_id: groupId,
    user_id: me,
    type: "group_status_changed",
    text: `${actorName} set the group to ${status}`,
  });
}

// ---------------- Global activity feed ----------------

export interface FeedItem {
  id: string;
  type: string;
  text: string;
  groupName: string;
  gradient: string;
  createdAt: string;
}

export async function fetchGlobalActivity(): Promise<FeedItem[]> {
  const me = await uid();
  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", me)
    .eq("status", "active");
  const groupIds = (memberships ?? []).map((m) => m.group_id);
  if (groupIds.length === 0) return [];

  const [{ data: acts }, { data: groups }] = await Promise.all([
    supabase
      .from("activity")
      .select("*")
      .in("group_id", groupIds)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase.from("groups").select("id, name, gradient").in("id", groupIds),
  ]);

  const gmap = new Map((groups ?? []).map((g) => [g.id, g]));
  return (acts ?? []).map((a) => {
    const g = a.group_id ? gmap.get(a.group_id) : undefined;
    return {
      id: a.id,
      type: a.type,
      text: a.text,
      groupName: g?.name ?? "Group",
      gradient: g?.gradient ?? FALLBACK_GRADIENT,
      createdAt: a.created_at,
    };
  });
}

// ---------------- Profile ----------------

export interface MyProfile {
  id: string;
  displayName: string;
  email: string;
  avatarGradient: string;
  bkash: string;
  nagad: string;
  bank: string;
  orbitPoints: number;
  bestStreak: number;
  reliability: number;
  groupsCount: number;
}

export async function fetchMyProfile(): Promise<MyProfile> {
  const me = await uid();
  const [{ data: profile }, { data: members }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", me).maybeSingle(),
    supabase
      .from("group_members")
      .select("orbit_points, streak, months_paid, group_id")
      .eq("user_id", me)
      .eq("status", "active"),
  ]);

  const rows = members ?? [];
  const orbitPoints = rows.reduce((s, r) => s + (r.orbit_points ?? 0), 0);
  const bestStreak = rows.reduce((s, r) => Math.max(s, r.streak ?? 0), 0);
  const totalPaid = rows.reduce((s, r) => s + (r.months_paid ?? 0), 0);
  const reliability = rows.length > 0 ? Math.min(100, 70 + Math.round(totalPaid * 3)) : 100;

  return {
    id: me,
    displayName: profile?.display_name || "Orbit Member",
    email: profile?.email || "",
    avatarGradient: profile?.avatar_gradient || FALLBACK_GRADIENT,
    bkash: profile?.bkash || "",
    nagad: profile?.nagad || "",
    bank: profile?.bank || "",
    orbitPoints,
    bestStreak,
    reliability,
    groupsCount: rows.length,
  };
}

export interface UpdateProfileInput {
  displayName: string;
  bkash: string;
  nagad: string;
  bank: string;
}

export async function updateMyProfile(input: UpdateProfileInput): Promise<void> {
  const me = await uid();
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: input.displayName,
      bkash: input.bkash || null,
      nagad: input.nagad || null,
      bank: input.bank || null,
    })
    .eq("id", me);
  if (error) throw error;
}
