// Central demo dataset for Orbit. Frontend-only for now; shaped so it can be
// swapped for Supabase reads later without touching component code much.

export type Role = "owner" | "co_manager" | "member";
export type MemberStatus = "pending" | "active" | "removed" | "left";
export type PaymentStatus =
  | "not_due"
  | "due_soon"
  | "submitted"
  | "approved"
  | "rejected"
  | "overdue"
  | "waived"
  | "credited";

export type GroupCategory =
  | "Video & Entertainment"
  | "Music"
  | "Productivity"
  | "Cloud Storage"
  | "Internet & Utilities"
  | "Gaming"
  | "Household"
  | "Other";

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide name
  earned: boolean;
}

export interface Person {
  id: string;
  name: string;
  email: string;
  avatarGradient: string;
}

export interface GroupMember {
  person: Person;
  role: Role;
  status: MemberStatus;
  monthlyShare: number;
  monthsPaid: number;
  streak: number;
  orbitPoints: number;
  paymentStatus: PaymentStatus;
}

export interface Group {
  id: string;
  name: string;
  category: GroupCategory;
  icon: string; // emoji-free: lucide name
  gradient: string;
  monthlyTotal: number;
  currency: string;
  renewalDate: string;
  dueDate: string;
  maxSeats: number;
  splitMethod: string;
  status: "Active" | "Paused" | "Archived";
  collected: number;
  pendingApprovals: number;
  paymentInstructions: string;
  bkash?: string;
  nagad?: string;
  members: GroupMember[];
  myRole: Role;
  inviteCode?: string;
}

export const currentUser: Person = {
  id: "u-zahid",
  name: "Zahid Hasan",
  email: "zahid@orbit.app",
  avatarGradient: "from-cyan to-violet",
};

const people: Record<string, Person> = {
  zahid: currentUser,
  rafi: {
    id: "u-rafi",
    name: "Rafi Ahmed",
    email: "rafi@mail.com",
    avatarGradient: "from-violet to-cyan",
  },
  nusrat: {
    id: "u-nusrat",
    name: "Nusrat Jahan",
    email: "nusrat@mail.com",
    avatarGradient: "from-success to-cyan",
  },
  tanvir: {
    id: "u-tanvir",
    name: "Tanvir Islam",
    email: "tanvir@mail.com",
    avatarGradient: "from-warning to-danger",
  },
  sadia: {
    id: "u-sadia",
    name: "Sadia Rahman",
    email: "sadia@mail.com",
    avatarGradient: "from-violet to-success",
  },
  arif: {
    id: "u-arif",
    name: "Arif Chowdhury",
    email: "arif@mail.com",
    avatarGradient: "from-cyan to-success",
  },
  mim: {
    id: "u-mim",
    name: "Maisha Mim",
    email: "mim@mail.com",
    avatarGradient: "from-danger to-violet",
  },
};

export const groups: Group[] = [
  {
    id: "youtube-premium",
    name: "YouTube Premium Family",
    category: "Video & Entertainment",
    icon: "Play",
    gradient: "from-danger to-violet",
    monthlyTotal: 695,
    currency: "BDT",
    renewalDate: "2026-07-12",
    dueDate: "2026-07-09",
    maxSeats: 6,
    splitMethod: "Equal split among all members",
    status: "Active",
    collected: 580,
    pendingApprovals: 1,
    paymentInstructions:
      "Send your share via bKash (send money) and submit the transaction ID here.",
    bkash: "01712-345678",
    nagad: "01812-345678",
    myRole: "owner",
    members: [
      {
        person: people.zahid,
        role: "owner",
        status: "active",
        monthlyShare: 116,
        monthsPaid: 11,
        streak: 11,
        orbitPoints: 340,
        paymentStatus: "approved",
      },
      {
        person: people.rafi,
        role: "member",
        status: "active",
        monthlyShare: 116,
        monthsPaid: 9,
        streak: 5,
        orbitPoints: 180,
        paymentStatus: "submitted",
      },
      {
        person: people.nusrat,
        role: "co_manager",
        status: "active",
        monthlyShare: 116,
        monthsPaid: 10,
        streak: 8,
        orbitPoints: 260,
        paymentStatus: "approved",
      },
      {
        person: people.tanvir,
        role: "member",
        status: "active",
        monthlyShare: 116,
        monthsPaid: 6,
        streak: 3,
        orbitPoints: 120,
        paymentStatus: "approved",
      },
      {
        person: people.sadia,
        role: "member",
        status: "active",
        monthlyShare: 116,
        monthsPaid: 8,
        streak: 4,
        orbitPoints: 150,
        paymentStatus: "approved",
      },
      {
        person: people.arif,
        role: "member",
        status: "active",
        monthlyShare: 115,
        monthsPaid: 2,
        streak: 1,
        orbitPoints: 40,
        paymentStatus: "overdue",
      },
    ],
  },
  {
    id: "canva-pro",
    name: "Canva Pro Team",
    category: "Productivity",
    icon: "Palette",
    gradient: "from-cyan to-violet",
    monthlyTotal: 1200,
    currency: "BDT",
    renewalDate: "2026-07-20",
    dueDate: "2026-07-17",
    maxSeats: 4,
    splitMethod: "Equal split among all members",
    status: "Active",
    collected: 900,
    pendingApprovals: 0,
    paymentInstructions: "Nagad send money preferred. Add the transaction ID after paying.",
    bkash: "01712-345678",
    nagad: "01812-345678",
    myRole: "owner",
    members: [
      {
        person: people.zahid,
        role: "owner",
        status: "active",
        monthlyShare: 300,
        monthsPaid: 6,
        streak: 6,
        orbitPoints: 210,
        paymentStatus: "approved",
      },
      {
        person: people.mim,
        role: "member",
        status: "active",
        monthlyShare: 300,
        monthsPaid: 5,
        streak: 5,
        orbitPoints: 160,
        paymentStatus: "approved",
      },
      {
        person: people.sadia,
        role: "member",
        status: "active",
        monthlyShare: 300,
        monthsPaid: 4,
        streak: 3,
        orbitPoints: 110,
        paymentStatus: "approved",
      },
      {
        person: people.arif,
        role: "member",
        status: "active",
        monthlyShare: 300,
        monthsPaid: 3,
        streak: 0,
        orbitPoints: 60,
        paymentStatus: "due_soon",
      },
    ],
  },
  {
    id: "flat-wifi",
    name: "Flat Wi-Fi",
    category: "Internet & Utilities",
    icon: "Wifi",
    gradient: "from-success to-cyan",
    monthlyTotal: 2000,
    currency: "BDT",
    renewalDate: "2026-07-08",
    dueDate: "2026-07-08",
    maxSeats: 4,
    splitMethod: "Equal split among all members",
    status: "Active",
    collected: 1500,
    pendingApprovals: 2,
    paymentInstructions: "Pay the caretaker via bKash before the 8th.",
    bkash: "01911-222333",
    myRole: "member",
    members: [
      {
        person: people.tanvir,
        role: "owner",
        status: "active",
        monthlyShare: 500,
        monthsPaid: 12,
        streak: 12,
        orbitPoints: 380,
        paymentStatus: "approved",
      },
      {
        person: people.zahid,
        role: "member",
        status: "active",
        monthlyShare: 500,
        monthsPaid: 4,
        streak: 4,
        orbitPoints: 120,
        paymentStatus: "due_soon",
      },
      {
        person: people.rafi,
        role: "member",
        status: "active",
        monthlyShare: 500,
        monthsPaid: 6,
        streak: 2,
        orbitPoints: 90,
        paymentStatus: "approved",
      },
      {
        person: people.mim,
        role: "member",
        status: "active",
        monthlyShare: 500,
        monthsPaid: 5,
        streak: 3,
        orbitPoints: 100,
        paymentStatus: "submitted",
      },
    ],
  },
  {
    id: "spotify-family",
    name: "Spotify Family",
    category: "Music",
    icon: "Music",
    gradient: "from-success to-violet",
    monthlyTotal: 510,
    currency: "BDT",
    renewalDate: "2026-07-25",
    dueDate: "2026-07-22",
    maxSeats: 6,
    splitMethod: "Equal split among all members",
    status: "Active",
    collected: 425,
    pendingApprovals: 0,
    paymentInstructions: "Send ৳85 via bKash to the group owner.",
    bkash: "01611-444555",
    myRole: "member",
    members: [
      {
        person: people.sadia,
        role: "owner",
        status: "active",
        monthlyShare: 85,
        monthsPaid: 14,
        streak: 14,
        orbitPoints: 420,
        paymentStatus: "approved",
      },
      {
        person: people.zahid,
        role: "member",
        status: "active",
        monthlyShare: 85,
        monthsPaid: 8,
        streak: 6,
        orbitPoints: 190,
        paymentStatus: "approved",
      },
      {
        person: people.rafi,
        role: "member",
        status: "active",
        monthlyShare: 85,
        monthsPaid: 7,
        streak: 3,
        orbitPoints: 130,
        paymentStatus: "approved",
      },
      {
        person: people.nusrat,
        role: "member",
        status: "active",
        monthlyShare: 85,
        monthsPaid: 9,
        streak: 5,
        orbitPoints: 170,
        paymentStatus: "approved",
      },
      {
        person: people.arif,
        role: "member",
        status: "active",
        monthlyShare: 85,
        monthsPaid: 4,
        streak: 4,
        orbitPoints: 110,
        paymentStatus: "approved",
      },
    ],
  },
];

export function getGroup(id: string): Group | undefined {
  return groups.find((g) => g.id === id);
}

export const managedGroups = groups.filter(
  (g) => g.myRole === "owner" || g.myRole === "co_manager",
);
export const memberGroups = groups.filter((g) => g.myRole === "member");

export const userStats = {
  orbitPoints: 940,
  streak: 11,
  activeGroups: groups.length,
  upcomingDues: 2,
  reliability: 96,
  groupsManaged: managedGroups.length,
  groupsJoined: memberGroups.length,
};

export const badges: Badge[] = [
  {
    id: "early-bird",
    name: "Early Bird",
    description: "Pays before the deadline",
    icon: "Sunrise",
    earned: true,
  },
  {
    id: "reliable-member",
    name: "Reliable Member",
    description: "3 successful monthly payments",
    icon: "ShieldCheck",
    earned: true,
  },
  {
    id: "streak-pilot",
    name: "Streak Pilot",
    description: "6-month payment streak",
    icon: "Rocket",
    earned: true,
  },
  {
    id: "circle-keeper",
    name: "Circle Keeper",
    description: "Kept a group active for 3 months",
    icon: "Orbit",
    earned: true,
  },
  {
    id: "smooth-operator",
    name: "Smooth Operator",
    description: "Collected all dues before renewal",
    icon: "Sparkles",
    earned: false,
  },
  {
    id: "trusted-teammate",
    name: "Trusted Teammate",
    description: "Active in multiple groups",
    icon: "Users",
    earned: true,
  },
];

export const groupAchievements: Badge[] = [
  {
    id: "full-collection",
    name: "Full Collection Month",
    description: "Everyone paid this cycle",
    icon: "CircleCheck",
    earned: true,
  },
  {
    id: "zero-late",
    name: "Zero Late Payments",
    description: "No overdue payments this cycle",
    icon: "Clock",
    earned: false,
  },
  {
    id: "three-months",
    name: "3 Months Active",
    description: "Group ran smoothly for 3 months",
    icon: "CalendarCheck",
    earned: true,
  },
  {
    id: "fully-occupied",
    name: "Fully Occupied Group",
    description: "All seats filled",
    icon: "Users",
    earned: true,
  },
];

export interface ActivityItem {
  id: string;
  type:
    | "payment_submitted"
    | "payment_approved"
    | "badge"
    | "renewal"
    | "member_joined"
    | "reminder"
    | "cycle_closed";
  text: string;
  time: string;
  group?: string;
}

export const activityFeed: ActivityItem[] = [
  {
    id: "a1",
    type: "payment_submitted",
    text: "Rafi submitted payment for July",
    time: "12 min ago",
    group: "YouTube Premium Family",
  },
  {
    id: "a2",
    type: "payment_approved",
    text: "Your payment was approved",
    time: "1 hour ago",
    group: "Spotify Family",
  },
  { id: "a3", type: "badge", text: "You earned the Early Bird badge", time: "3 hours ago" },
  {
    id: "a4",
    type: "renewal",
    text: "YouTube Premium renews in 3 days",
    time: "5 hours ago",
    group: "YouTube Premium Family",
  },
  {
    id: "a5",
    type: "member_joined",
    text: "Maisha Mim joined Canva Pro Team",
    time: "Yesterday",
    group: "Canva Pro Team",
  },
  {
    id: "a6",
    type: "reminder",
    text: "Reminder sent to Arif Chowdhury",
    time: "Yesterday",
    group: "YouTube Premium Family",
  },
  {
    id: "a7",
    type: "cycle_closed",
    text: "June cycle closed for Flat Wi-Fi",
    time: "2 days ago",
    group: "Flat Wi-Fi",
  },
];

export interface Notification {
  id: string;
  title: string;
  body: string;
  time: string;
  kind: "invite" | "due" | "approved" | "rejected" | "renewal" | "badge" | "member";
  unread: boolean;
}

export const notifications: Notification[] = [
  {
    id: "n1",
    title: "Payment approved",
    body: "Your July payment for Spotify Family was approved.",
    time: "1h",
    kind: "approved",
    unread: true,
  },
  {
    id: "n2",
    title: "Payment due in 3 days",
    body: "Flat Wi-Fi — ৳500 is due on July 8.",
    time: "5h",
    kind: "due",
    unread: true,
  },
  {
    id: "n3",
    title: "New badge earned",
    body: "You unlocked the Early Bird badge.",
    time: "3h",
    kind: "badge",
    unread: true,
  },
  {
    id: "n4",
    title: "Renewal reminder",
    body: "YouTube Premium Family renews in 3 days.",
    time: "1d",
    kind: "renewal",
    unread: false,
  },
  {
    id: "n5",
    title: "New membership request",
    body: "Arif requested to join Canva Pro Team.",
    time: "1d",
    kind: "member",
    unread: false,
  },
];

export const upcomingTimeline = [
  {
    id: "t1",
    label: "Flat Wi-Fi payment",
    date: "2026-07-08",
    kind: "due" as const,
    group: "Flat Wi-Fi",
  },
  {
    id: "t2",
    label: "YouTube Premium approval deadline",
    date: "2026-07-09",
    kind: "approval" as const,
    group: "YouTube Premium Family",
  },
  {
    id: "t3",
    label: "YouTube Premium renewal",
    date: "2026-07-12",
    kind: "renewal" as const,
    group: "YouTube Premium Family",
  },
  {
    id: "t4",
    label: "Canva Pro renewal",
    date: "2026-07-20",
    kind: "renewal" as const,
    group: "Canva Pro Team",
  },
  {
    id: "t5",
    label: "Spotify Family payment",
    date: "2026-07-22",
    kind: "due" as const,
    group: "Spotify Family",
  },
];

export const categories: GroupCategory[] = [
  "Video & Entertainment",
  "Music",
  "Productivity",
  "Cloud Storage",
  "Internet & Utilities",
  "Gaming",
  "Household",
  "Other",
];

export const splitMethods = [
  "Equal split among all members",
  "Equal split excluding manager",
  "Custom amount per member",
  "Percentage split",
  "Manual amount per member",
];
