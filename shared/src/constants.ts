// ─── Communication Constants ────────────────────────

import type { CommunicationType } from "./types";

export type CommType = CommunicationType;

export const COMMUNICATION_TYPES: { value: CommType; label: string; description: string; color: string }[] = [
  {
    value: "PROMOTIONAL",
    label: "Promotional",
    description: "Marketing, upsell, feature announcements — user can opt out",
    color: "text-purple-400 bg-purple-500/15 border-purple-500/30",
  },
  {
    value: "TRANSACTIONAL",
    label: "Transactional",
    description: "Triggered by user actions — receipts, confirmations, status updates",
    color: "text-blue-400 bg-blue-500/15 border-blue-500/30",
  },
  {
    value: "OPERATIONAL",
    label: "Operational",
    description: "System-critical — security alerts, compliance, service changes",
    color: "text-amber-400 bg-amber-500/15 border-amber-500/30",
  },
];

export const COMMUNICATION_CATEGORIES = [
  { value: "account_compliance", label: "Account Status & Compliance", types: ["TRANSACTIONAL", "OPERATIONAL"] as CommType[] },
  { value: "payments", label: "Payments", types: ["TRANSACTIONAL"] as CommType[] },
  { value: "product_updates", label: "Product Updates", types: ["PROMOTIONAL", "TRANSACTIONAL"] as CommType[] },
  { value: "education_tips", label: "Education & Tips", types: ["PROMOTIONAL"] as CommType[] },
  { value: "promotions", label: "Promotions", types: ["PROMOTIONAL"] as CommType[] },
  { value: "pricing_packaging", label: "Pricing & Packaging", types: ["TRANSACTIONAL", "OPERATIONAL"] as CommType[] },
  { value: "system_notifications", label: "System Notifications", types: ["OPERATIONAL"] as CommType[] },
];

export const PREFERENCE_GROUPS = [
  { value: "product_announcements", label: "Product Announcements", description: "New features, improvements, and platform updates", canOptOut: true },
  { value: "account_alerts", label: "Account Alerts", description: "Account status changes, verification, compliance", canOptOut: false },
  { value: "payment_notifications", label: "Payment Notifications", description: "Transaction receipts, payment status, settlements", canOptOut: false },
  { value: "marketing_offers", label: "Marketing & Offers", description: "Promotions, special offers, partner deals", canOptOut: true },
  { value: "tips_education", label: "Tips & Education", description: "Best practices, guides, optimization tips", canOptOut: true },
  { value: "system_security", label: "System & Security", description: "Security alerts, maintenance, critical updates", canOptOut: false },
];

export const CHANNEL_OPTIONS = [
  { value: "email", label: "Email", icon: "M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" },
  { value: "sms", label: "SMS", icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
  { value: "push", label: "Push Notification", icon: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" },
  { value: "whatsapp", label: "WhatsApp", icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
  { value: "jumbotron", label: "Jumbotron", icon: "M4 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5zM4 13a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6z" },
  { value: "banner", label: "Banner", icon: "M3 3h18v4H3zM3 11h18v2H3z" },
  { value: "in_product_alert", label: "In-Product Alert", icon: "M12 9v2m0 4h.01M10.29 3.86l-8.6 14.86A1 1 0 0 0 2.54 20h18.92a1 1 0 0 0 .85-1.28l-8.6-14.86a1 1 0 0 0-1.42 0z" },
  { value: "notification_center", label: "Notification Center", icon: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" },
];

export function getCommTypeConfig(type: CommType | null | undefined) {
  return COMMUNICATION_TYPES.find((t) => t.value === type) ?? null;
}

export function getCategoryLabel(value: string | null | undefined) {
  return COMMUNICATION_CATEGORIES.find((c) => c.value === value)?.label ?? value ?? "";
}

export function getPreferenceLabel(value: string | null | undefined) {
  return PREFERENCE_GROUPS.find((p) => p.value === value)?.label ?? value ?? "";
}

export function getChannelConfig(value: string | null | undefined) {
  return CHANNEL_OPTIONS.find((c) => c.value === value) ?? null;
}

// ─── Journey Constants ──────────────────────────────

import type { StepKind } from "./types";

export const STEP_KINDS: StepKind[] = ["ACTION", "SYSTEM_TRIGGER", "COMMUNICATION", "STATE", "DECISION", "WAIT_DELAY", "AB_SPLIT"];

export const KIND_LABELS: Record<StepKind, string> = {
  ACTION: "Action",
  SYSTEM_TRIGGER: "System Trigger",
  COMMUNICATION: "Communication",
  STATE: "State",
  DECISION: "Decision",
  WAIT_DELAY: "Wait / Delay",
  AB_SPLIT: "A/B Split",
};

export const KIND_COLORS: Record<StepKind, {
  bg: string;
  border: string;
  text: string;
  dot: string;
  badge: string;
}> = {
  ACTION: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-300",
    dot: "bg-amber-400",
    badge: "bg-amber-500/20 text-amber-400",
  },
  SYSTEM_TRIGGER: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-300",
    dot: "bg-blue-400",
    badge: "bg-blue-500/20 text-blue-400",
  },
  COMMUNICATION: {
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
    text: "text-violet-300",
    dot: "bg-violet-400",
    badge: "bg-violet-500/20 text-violet-400",
  },
  STATE: {
    bg: "bg-zinc-500/10",
    border: "border-zinc-500/30",
    text: "text-zinc-400",
    dot: "bg-zinc-400",
    badge: "bg-zinc-500/20 text-zinc-400",
  },
  DECISION: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-300",
    dot: "bg-emerald-400",
    badge: "bg-emerald-500/20 text-emerald-400",
  },
  WAIT_DELAY: {
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    text: "text-orange-300",
    dot: "bg-orange-400",
    badge: "bg-orange-500/20 text-orange-400",
  },
  AB_SPLIT: {
    bg: "bg-pink-500/10",
    border: "border-pink-500/30",
    text: "text-pink-300",
    dot: "bg-pink-400",
    badge: "bg-pink-500/20 text-pink-400",
  },
};

export const KIND_NODE_STYLES: Record<StepKind, {
  bg: string;
  border: string;
  text: string;
  badge: string;
  label: string;
  icon: string;
}> = {
  ACTION: {
    bg: "bg-amber-950/60",
    border: "border-amber-500/40",
    text: "text-amber-200",
    badge: "bg-amber-500/20 text-amber-400",
    label: "Action",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
  },
  SYSTEM_TRIGGER: {
    bg: "bg-blue-950/60",
    border: "border-blue-500/40",
    text: "text-blue-200",
    badge: "bg-blue-500/20 text-blue-400",
    label: "System Trigger",
    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
  },
  COMMUNICATION: {
    bg: "bg-violet-950/60",
    border: "border-violet-500/40",
    text: "text-violet-200",
    badge: "bg-violet-500/20 text-violet-400",
    label: "Communication",
    icon: "M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z",
  },
  STATE: {
    bg: "bg-zinc-800/80",
    border: "border-zinc-500/40",
    text: "text-zinc-300",
    badge: "bg-zinc-500/20 text-zinc-400",
    label: "State",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  },
  DECISION: {
    bg: "bg-emerald-950/60",
    border: "border-emerald-500/40",
    text: "text-emerald-200",
    badge: "bg-emerald-500/20 text-emerald-400",
    label: "Decision",
    icon: "M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0 0 21 18.382V7.618a1 1 0 0 0-.553-.894L15 4m0 13V4m0 0L9 7",
  },
  WAIT_DELAY: {
    bg: "bg-orange-950/60",
    border: "border-orange-500/40",
    text: "text-orange-200",
    badge: "bg-orange-500/20 text-orange-400",
    label: "Wait / Delay",
    icon: "M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  },
  AB_SPLIT: {
    bg: "bg-pink-950/60",
    border: "border-pink-500/40",
    text: "text-pink-200",
    badge: "bg-pink-500/20 text-pink-400",
    label: "A/B Split",
    icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0 1-15.357-2m15.357 2H15",
  },
};
