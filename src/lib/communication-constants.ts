export type CommType = "PROMOTIONAL" | "TRANSACTIONAL" | "OPERATIONAL";

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
