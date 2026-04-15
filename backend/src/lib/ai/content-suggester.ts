import type { CommType } from "@/lib/communication-constants";

export interface SuggestedContent {
  subject: string;
  headline: string;
  body: string;
  ctaText: string;
  ctaLink: string;
  footer?: string;
}

interface SuggestInput {
  channel: string;
  communicationType: CommType | null;
  category: string | null;
  triggerEvent: string | null;
  commName: string;
  domainName: string;
}

const TONE: Record<CommType, string> = {
  PROMOTIONAL: "engaging and benefit-focused",
  TRANSACTIONAL: "clear, factual, and action-oriented",
  OPERATIONAL: "direct, urgent, and authoritative",
};

const CHANNEL_CTA: Record<string, { ctaText: string; ctaLink: string }> = {
  email: { ctaText: "View Details", ctaLink: "https://app.payoneer.com/{{deep_link}}" },
  sms: { ctaText: "Open App", ctaLink: "https://app.payoneer.com/{{deep_link}}" },
  push: { ctaText: "Open", ctaLink: "payoneer://{{deep_link}}" },
  whatsapp: { ctaText: "View in App", ctaLink: "https://app.payoneer.com/{{deep_link}}" },
  jumbotron: { ctaText: "Learn More", ctaLink: "/{{feature_page}}" },
  banner: { ctaText: "See Details", ctaLink: "/{{feature_page}}" },
  in_product_alert: { ctaText: "Take Action", ctaLink: "/{{action_page}}" },
  notification_center: { ctaText: "View", ctaLink: "/{{detail_page}}" },
};

const CATEGORY_SUBJECTS: Record<string, string[]> = {
  account_compliance: [
    "Action required: Verify your account details",
    "Your account status has been updated",
    "Important: Compliance review needed",
  ],
  payments: [
    "Payment of {{amount}} has been processed",
    "Your withdrawal is on its way",
    "Payment received — here's your receipt",
  ],
  product_updates: [
    "New feature: {{feature_name}} is now available",
    "We've improved {{feature_name}} for you",
    "Introducing {{feature_name}} — simplify your workflow",
  ],
  education_tips: [
    "Pro tip: Get more from {{feature_name}}",
    "5 ways to optimize your {{domain}} workflow",
    "Did you know? {{feature_name}} best practices",
  ],
  promotions: [
    "Special offer: Save on {{feature_name}}",
    "Limited time: Upgrade your plan today",
    "Exclusive: Early access to {{feature_name}}",
  ],
  pricing_packaging: [
    "Important update to your pricing plan",
    "Your plan details have changed",
    "New pricing options available for you",
  ],
  system_notifications: [
    "Scheduled maintenance: {{date}}",
    "System update completed successfully",
    "Security alert: Action required",
  ],
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function humanize(s: string): string {
  return s
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
}

export function suggestContent(input: SuggestInput): SuggestedContent {
  const { channel, communicationType, category, triggerEvent, commName, domainName } = input;
  const type = communicationType ?? "TRANSACTIONAL";
  const tone = TONE[type];
  const channelCta = CHANNEL_CTA[channel] ?? CHANNEL_CTA.email;

  const subjects = CATEGORY_SUBJECTS[category ?? "system_notifications"] ?? CATEGORY_SUBJECTS.system_notifications;
  const subject = pickRandom(subjects)
    .replace("{{amount}}", "$1,250.00")
    .replace("{{feature_name}}", humanize(commName))
    .replace("{{domain}}", domainName)
    .replace("{{date}}", "March 15, 2026");

  const eventLabel = triggerEvent ? humanize(triggerEvent) : "this event";

  let body: string;
  if (type === "PROMOTIONAL") {
    body = `We're excited to let you know about ${humanize(commName).toLowerCase()}. ` +
      `This ${tone} message highlights key benefits and next steps for ${domainName} users.\n\n` +
      `Key highlights:\n• Benefit one — describe the value\n• Benefit two — describe the impact\n• Benefit three — what to expect next`;
  } else if (type === "OPERATIONAL") {
    body = `This is an important notification regarding ${humanize(commName).toLowerCase()}. ` +
      `Triggered by: ${eventLabel}.\n\n` +
      `What you need to know:\n• What happened\n• What action is required\n• Deadline or urgency`;
  } else {
    body = `This confirms that ${eventLabel.toLowerCase()} has been processed for your account. ` +
      `Here's a summary of what happened and any next steps.\n\n` +
      `Details:\n• Transaction/action summary\n• Status: Completed\n• Reference: #{{ref_id}}`;
  }

  const footer = type === "PROMOTIONAL"
    ? "You're receiving this because you opted in to product announcements. Manage preferences."
    : type === "OPERATIONAL"
      ? "This is a mandatory notification. You cannot unsubscribe from operational messages."
      : "This is a transactional message related to your account activity.";

  return {
    subject,
    headline: humanize(commName),
    body,
    ctaText: channelCta.ctaText,
    ctaLink: channelCta.ctaLink,
    footer,
  };
}
