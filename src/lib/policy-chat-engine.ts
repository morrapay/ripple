import { POLICY_CHANNELS, GOVERNANCE_RULES, type PolicyChannel, type ChannelStatus } from "./policy-data";

enum Intent {
  CHANNEL_RECOMMENDATION = "CHANNEL_RECOMMENDATION",
  CHANNEL_INFO = "CHANNEL_INFO",
  GOVERNANCE_RULE = "GOVERNANCE_RULE",
  GENERAL = "GENERAL",
}

enum CommType {
  PROMOTIONAL = "PROMOTIONAL",
  ALERT = "ALERT",
  AWARENESS = "AWARENESS",
  EDUCATIONAL = "EDUCATIONAL",
  TRANSACTIONAL = "TRANSACTIONAL",
  UNKNOWN = "UNKNOWN",
}

const INTENT_KEYWORDS: Record<Intent, string[]> = {
  [Intent.CHANNEL_RECOMMENDATION]: [
    "where", "which channel", "how should", "recommend", "best channel", "suggest",
    "what channel", "how do i", "how can i", "what's the best", "where should",
  ],
  [Intent.CHANNEL_INFO]: [
    "tell me about", "what is", "describe", "explain", "info about", "details on",
    "how does", "what does", "capabilities of",
  ],
  [Intent.GOVERNANCE_RULE]: [
    "rule", "policy", "governance", "guideline", "regulation", "allowed", "not allowed",
    "can i", "am i allowed", "restriction", "limit", "frequency", "cooldown", "cool-off",
  ],
  [Intent.GENERAL]: [],
};

const COMM_TYPE_KEYWORDS: Record<CommType, string[]> = {
  [CommType.PROMOTIONAL]: [
    "promote", "promotional", "upsell", "new feature", "announcement", "marketing",
    "awareness", "launch", "campaign", "advertise", "highlight",
  ],
  [CommType.ALERT]: [
    "alert", "warn", "urgent", "critical", "notify", "debt", "overdue", "compliance",
    "action required", "important", "mandatory", "risk", "security",
  ],
  [CommType.AWARENESS]: [
    "aware", "awareness", "inform", "educate", "onboarding", "tour", "guide", "walkthrough",
    "feature discovery", "new capability", "stablecoin",
  ],
  [CommType.EDUCATIONAL]: [
    "education", "faq", "learn", "tutorial", "help", "documentation", "how-to",
  ],
  [CommType.TRANSACTIONAL]: [
    "transaction", "receipt", "confirmation", "payment", "transfer", "invoice",
    "settlement", "payout",
  ],
  [CommType.UNKNOWN]: [],
};

const CHANNEL_ALIASES: Record<string, string> = {
  jumbo: "jumbotron", jumbotron: "jumbotron", banner: "jumbotron",
  email: "email", mail: "email",
  sms: "sms", "text message": "sms",
  whatsapp: "whatsapp", wa: "whatsapp",
  push: "push-notification", "push notification": "push-notification",
  toast: "toast", "toast message": "toast",
  "notification center": "notification-center", "notif center": "notification-center",
  "in-product alert": "in-product-alert", "in product alert": "in-product-alert", alert: "in-product-alert",
  "tour guide": "tour-guide", tour: "tour-guide", walkthrough: "tour-guide",
  "first use": "first-use-popup", "welcome banner": "welcome-banner",
};

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[?!.,;:'"]/g, " ").split(/\s+/).filter(Boolean);
}

function detectIntent(text: string): Intent {
  const lower = text.toLowerCase();
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    if (intent === Intent.GENERAL) continue;
    if (keywords.some((kw) => lower.includes(kw))) return intent as Intent;
  }
  return Intent.GENERAL;
}

function detectCommType(text: string): CommType {
  const lower = text.toLowerCase();
  let best: CommType = CommType.UNKNOWN;
  let bestCount = 0;
  for (const [type, keywords] of Object.entries(COMM_TYPE_KEYWORDS)) {
    if (type === CommType.UNKNOWN) continue;
    const count = keywords.filter((kw) => lower.includes(kw)).length;
    if (count > bestCount) { best = type as CommType; bestCount = count; }
  }
  return best;
}

function findChannelByName(text: string): PolicyChannel | null {
  const lower = text.toLowerCase();
  for (const [alias, id] of Object.entries(CHANNEL_ALIASES)) {
    if (lower.includes(alias)) {
      return POLICY_CHANNELS.find((ch) => ch.id === id) ?? null;
    }
  }
  return null;
}

function statusEmoji(s: ChannelStatus): string {
  if (s === "production") return "🟢";
  if (s === "planned") return "🔵";
  return "🔶";
}

function brazeLabel(ch: PolicyChannel): string {
  return ch.brazeAvailable ? "✅ Yes" : "❌ No";
}

function formatChannel(ch: PolicyChannel): string {
  const cat = ch.category === "in-app" ? "In-App" : "External";
  const lines = [
    `**${ch.name}** (${cat})`,
    `Status: ${statusEmoji(ch.status)} ${ch.status.charAt(0).toUpperCase() + ch.status.slice(1)} · Braze: ${brazeLabel(ch)}`,
    ch.description,
    "",
    `**Allowed:** ${ch.messaging.allowed.join(", ")}`,
    `**Not allowed:** ${ch.messaging.notAllowed.join(", ")}`,
    "",
    `**Devices:** ${ch.devices.join(", ")}`,
    `**Audience:** ${ch.audience.whoCanDefine}`,
    `**Intent:** ${ch.intent}`,
    `**Category:** ${ch.messaging.category}`,
  ];
  if (ch.timing) {
    lines.push("");
    lines.push(`**Cool-off:** ${ch.timing.coolOff}`);
    if (ch.timing.delivery !== "N/A") lines.push(`**Delivery:** ${ch.timing.delivery}`);
  }
  if (ch.cta.required) {
    lines.push(`**CTA:** Required — ${ch.cta.rules[0] ?? ""}`);
  }
  return lines.join("\n");
}

function recommendChannels(commType: CommType): string {
  const matching: PolicyChannel[] = [];
  const typeLabel = commType.toLowerCase().replace("_", " ");

  for (const ch of POLICY_CHANNELS) {
    if (ch.status === "frozen") continue;
    const allowed = ch.messaging.allowed.map((a) => a.toLowerCase());
    const notAllowed = ch.messaging.notAllowed.map((a) => a.toLowerCase());

    let matches = false;
    switch (commType) {
      case CommType.PROMOTIONAL:
        matches = allowed.some((a) => a.includes("upsell") || a.includes("new feature") || a.includes("promot"));
        break;
      case CommType.ALERT:
        matches = allowed.some((a) => a.includes("alert") || a.includes("urgent") || a.includes("debt") || a.includes("compliance"));
        if (notAllowed.some((a) => a.includes("alert"))) matches = false;
        break;
      case CommType.AWARENESS:
        matches = allowed.some((a) => a.includes("awareness") || a.includes("new feature") || a.includes("onboarding"));
        break;
      case CommType.EDUCATIONAL:
        matches = allowed.some((a) => a.includes("education") || a.includes("faq") || a.includes("help"));
        break;
      case CommType.TRANSACTIONAL:
        matches = allowed.some((a) => a.includes("transaction") || a.includes("payment") || a.includes("receipt"));
        break;
    }
    if (matches) matching.push(ch);
  }

  if (matching.length === 0) {
    return `I couldn't find a specific channel for **${typeLabel}** content. Could you describe the use case in more detail?`;
  }

  const inApp = matching.filter((ch) => ch.category === "in-app");
  const external = matching.filter((ch) => ch.category === "external");

  const lines = [`For **${typeLabel}** communication, here are the recommended channels:\n`];

  if (inApp.length > 0) {
    lines.push(`📱 **In-App Channels**\n`);
    for (const ch of inApp) {
      lines.push(`**${ch.name}** (In-App)`);
      lines.push(`Status: ${statusEmoji(ch.status)} ${ch.status.charAt(0).toUpperCase() + ch.status.slice(1)} · Braze: ${brazeLabel(ch)}`);
      lines.push(ch.description);
      lines.push("");
    }
  }

  if (external.length > 0) {
    lines.push(`📨 **External Channels**\n`);
    for (const ch of external) {
      lines.push(`**${ch.name}** (External)`);
      lines.push(`Status: ${statusEmoji(ch.status)} ${ch.status.charAt(0).toUpperCase() + ch.status.slice(1)} · Braze: ${brazeLabel(ch)}`);
      lines.push(ch.description);
      lines.push("");
    }
  }

  return lines.join("\n");
}

export function answerPolicyQuestion(question: string): string {
  const intent = detectIntent(question);
  const commType = detectCommType(question);
  const specificChannel = findChannelByName(question);

  if (specificChannel && (intent === Intent.CHANNEL_INFO || intent === Intent.GENERAL)) {
    return formatChannel(specificChannel);
  }

  if (intent === Intent.GOVERNANCE_RULE) {
    const lower = question.toLowerCase();
    const matchingRules = GOVERNANCE_RULES.filter((r) =>
      r.title.toLowerCase().includes(lower) ||
      r.content.toLowerCase().split(" ").some((w) => lower.includes(w) && w.length > 4)
    );
    if (matchingRules.length > 0) {
      return "📋 **Governance Rules**\n\n" +
        matchingRules.map((r) => `**${r.title}**\n${r.content}`).join("\n\n---\n\n");
    }
    if (specificChannel) {
      const cat = specificChannel.category === "in-app" ? "In-App" : "External";
      const lines = [
        `📋 **Rules for ${specificChannel.name}** (${cat})\n`,
        `**Allowed:** ${specificChannel.messaging.allowed.join(", ")}`,
        `**Not allowed:** ${specificChannel.messaging.notAllowed.join(", ")}`,
      ];
      if (specificChannel.timing) {
        lines.push(`**Cool-off:** ${specificChannel.timing.coolOff}`);
      }
      const allGuidelines = specificChannel.alertSeverities?.flatMap((s) => s.guidelines) ?? [];
      if (allGuidelines.length > 0) {
        lines.push(`\n**Guidelines:**`);
        allGuidelines.forEach((g) => lines.push(`• ${g}`));
      }
      if (specificChannel.cta.rules.length > 0) {
        lines.push(`\n**CTA Rules:**`);
        specificChannel.cta.rules.forEach((r) => lines.push(`• ${r}`));
      }
      return lines.join("\n");
    }
    return "📋 I found several governance rules. Could you be more specific about which channel or topic you're asking about?";
  }

  if (intent === Intent.CHANNEL_RECOMMENDATION || commType !== CommType.UNKNOWN) {
    return recommendChannels(commType !== CommType.UNKNOWN ? commType : CommType.PROMOTIONAL);
  }

  return "I can help you find the right communication channel based on our policy. Try asking something like:\n\n" +
    "- \"Where should I promote a new feature?\"\n" +
    "- \"What channels can I use for alerts?\"\n" +
    "- \"Tell me about the Jumbotron\"\n" +
    "- \"What are the rules for email?\"\n\n" +
    "What would you like to know?";
}

export const SUGGESTED_QUESTIONS = [
  "Where should I announce a new feature?",
  "What channels can I use for debt alerts?",
  "Tell me about the Jumbotron",
  "What are the email guidelines?",
  "Which channels are available in Braze?",
];
