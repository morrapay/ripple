export type ChannelCategory = "in-app" | "external";
export type ChannelStatus = "production" | "planned" | "frozen";

export interface AlertSeverity {
  level: string;
  messagesAllowed: string;
  messagesNotAllowed: string;
  cta: string;
  coolOff: string;
  canDismiss: boolean;
  canCoexistWith: string[];
  guidelines: string[];
}

export interface PolicyChannel {
  id: string;
  name: string;
  category: ChannelCategory;
  status: ChannelStatus;
  brazeAvailable: boolean;
  brazeNote?: string;
  devices: string[];
  context: string;
  intent: string;
  techOwner: string;
  opsOwner: string;
  description: string;
  messaging: {
    allowed: string[];
    notAllowed: string[];
    category: string;
  };
  audience: {
    whoCanDefine: string;
    whoSignsOff: string;
    restrictions: string[];
  };
  cta: {
    required: boolean;
    rules: string[];
  };
  timing: {
    coolOff: string;
    reminders: string;
    delivery: string;
  };
  ecosystem: string[];
  designHighlights: string[];
  alertSeverities?: AlertSeverity[];
  figmaLink?: string;
}

export const POLICY_CHANNELS: PolicyChannel[] = [
  {
    id: "jumbotron",
    name: "Jumbotron",
    category: "in-app",
    status: "production",
    brazeAvailable: true,
    devices: ["Web"],
    context: "Homepage",
    intent: "Info / Multi-purpose",
    techOwner: "OneX",
    opsOwner: "LCM (Marketing) via Acoustic",
    description:
      "A promotional banner on the homepage for upsell, new features, and alerts. One jumbotron per session.",
    messaging: {
      allowed: ["Upsell", "New features", "Alerts"],
      notAllowed: ["Education (FAQ / external links)", "Events", "Social"],
      category: "Marketing",
    },
    audience: {
      whoCanDefine: "Marketing",
      whoSignsOff: "Mor Rahimi (Product) — early life alignment",
      restrictions: [
        "Only show to eligible population (region/feature availability is a legal requirement)",
      ],
    },
    cta: {
      required: true,
      rules: [
        "Must always be an internal link inside the platform",
        "External links not acceptable",
        "Every Jumbo must have a definition of success with exact target (~12% CTR)",
      ],
    },
    timing: {
      coolOff: "1 Jumbo per session (existing behavior). Future cool-off TBD.",
      reminders: "Up to 2 reminders of the same Jumbo",
      delivery: "View 1 jumbo in the same session",
    },
    ecosystem: [
      "Will not appear while Welcome Banner is visible",
      "Will not appear while Critical alert is displayed",
    ],
    designHighlights: [
      "Title (mandatory): up to 100 chars, one line",
      "Sub-title (optional): up to 260 chars, two lines",
      "Bullets (optional): max 4, one line each",
      "CTA mandatory — internal link only",
      "Icon image: LVL 3 (100×100), left aligned, 24px spacing",
      "Font: Avenir. Color: Grey 700. Left aligned.",
      "No legal T&Cs or disclaimers unless major eligibility issues",
    ],
  },
  {
    id: "welcome-banner",
    name: "Welcome Banner",
    category: "in-app",
    status: "production",
    brazeAvailable: false,
    devices: ["TBD"],
    context: "Homepage",
    intent: "Activation / Multi-purpose",
    techOwner: "FEF",
    opsOwner: "Account / PLG (Platform)",
    description:
      "Early life banner showcasing 3 early life money-in & mobile products to onboard users after account approval. Disappears after FFT.",
    messaging: {
      allowed: ["Early life product promotion (money-in & mobile)"],
      notAllowed: ["All other types"],
      category: "Product Marketing",
    },
    audience: {
      whoCanDefine: "Raz Ariel (Communication Product) + Marketing for content",
      whoSignsOff: "Raz Ariel (Communication Product)",
      restrictions: [
        "Only eligible population (auto-configured by product logic)",
        "Prioritization based on country",
      ],
    },
    cta: {
      required: true,
      rules: [
        "Must be internal link (exception: mobile → QR code)",
        "Track success: click → begin opt-in → complete opt-in → FFT",
      ],
    },
    timing: {
      coolOff: "Not implemented in MVP. Future: cool-off between views.",
      reminders: "Leaning towards 2 views before disappearing",
      delivery:
        "Visible until: user presses X, <3 eligible products remain, or FFT occurs",
    },
    ecosystem: [
      "While visible, only Alerts can appear on top homepage real-estate",
      "Jumbotron cannot appear while Welcome Banner is visible",
    ],
    designHighlights: [
      "Title (mandatory): up to 100 chars",
      "Card title (mandatory): up to 80 chars, two lines",
      "Card sub-title (mandatory): up to 90 chars, two lines",
      "Card CTA: internal link (exception: mobile QR)",
      "Card visuals: JSON animation, corner radius 16",
      "Always 3 product cards — banner disappears if fewer than 3",
      "Marketplace always last in the banner",
    ],
  },
  {
    id: "alerts",
    name: "Alerts",
    category: "in-app",
    status: "frozen",
    brazeAvailable: false,
    devices: ["Web", "Mobile"],
    context: "Homepage",
    intent: "Multi-purpose (account administration)",
    techOwner: "OneX",
    opsOwner: "LCM (Marketing)",
    description:
      "Account alerts with 4 severity levels (Critical → Success → Warning → Informational). Max 3 alerts visible at once. Clear prioritization rules.",
    messaging: {
      allowed: ["Account administration", "Action-required notifications"],
      notAllowed: ["Marketing", "Promotional content"],
      category: "Account Administration",
    },
    audience: {
      whoCanDefine: "Marketing OPS",
      whoSignsOff: "Communication (1-month release period)",
      restrictions: [],
    },
    cta: {
      required: false,
      rules: [
        "Critical: no CTA",
        "Warning: CTA to verification center (mandatory)",
        "Success: no CTA",
        "Informational: CTA optional",
      ],
    },
    timing: {
      coolOff: "Varies by severity — see severity details",
      reminders: "N/A — persistent until resolved or dismissed",
      delivery: "Max 3 alerts visible at any given time",
    },
    ecosystem: [
      "Critical alert: no jumbotrons, no other alerts",
      "Warning: can appear with Informational only",
      "Success: can appear with Informational only",
      "Informational: can appear with Warning or Success",
    ],
    designHighlights: [
      "Desktop — Icon: Fontawesome 24px",
      "Title: Avenir Demi 16, left aligned, max 130 chars",
      "Description: Avenir Medium 16, max 260 chars",
      "CTA: outlined button 36px height, max 20 chars",
      "Mobile — same structure but 14px fonts, 28px button height",
    ],
    figmaLink:
      "https://www.figma.com/design/GDdFBQMo8auMUPPIYUi1LT/Communication-channels?node-id=428-14772",
    alertSeverities: [
      {
        level: "Critical",
        messagesAllowed: "Account restricted only",
        messagesNotAllowed: "All other messages",
        cta: "None",
        coolOff:
          "Appears as long as account is restricted. No other alerts simultaneously.",
        canDismiss: false,
        canCoexistWith: [],
        guidelines: [
          "No X option",
          "No title allowed",
          "Content predefined by Communication team",
          "Disappears only when account is unblocked",
          "Only one critical alert at a time",
        ],
      },
      {
        level: "Warning",
        messagesAllowed:
          "Actions that may block account or stop payment capabilities",
        messagesNotAllowed: "All other messages",
        cta: "CTA to verification center (mandatory)",
        coolOff: "Appears as long as FDC requirements are open",
        canDismiss: false,
        canCoexistWith: ["Informational"],
        guidelines: [
          "No X option",
          "Title allowed",
          "Multiple requirements aggregated into one warning alert",
          "Disappears when user completes submission",
          "Cannot appear with Critical or Success",
        ],
      },
      {
        level: "Success",
        messagesAllowed:
          "Account approved (future: account upgrade). Must be relevant to entire account status.",
        messagesNotAllowed: "All other messages",
        cta: "No CTA allowed",
        coolOff: "Appears in first two logins",
        canDismiss: true,
        canCoexistWith: ["Informational"],
        guidelines: [
          "X mandatory",
          "Can add title",
          "Disappears when user presses X",
          "One per page based on trigger order",
          "Cannot appear with Warning or Critical",
        ],
      },
      {
        level: "Informational",
        messagesAllowed:
          "Info that affects the account but doesn't require verification action",
        messagesNotAllowed: "Marketing, all other messages",
        cta: "Optional",
        coolOff: "One informational at a time by priority",
        canDismiss: true,
        canCoexistWith: ["Warning", "Success"],
        guidelines: [
          "X mandatory",
          "Title allowed",
          "Must have expiration date",
          "Disappears via X, CTA click, or expiration",
          "Cannot appear with Critical",
          "Can set one 'High priority informational' to trump all others",
        ],
      },
    ],
  },
  {
    id: "whats-new",
    name: "What's New",
    category: "in-app",
    status: "planned",
    brazeAvailable: false,
    devices: ["Web"],
    context: "Floater panel (bell icon)",
    intent: "Cross-sale / Expansion / Adoption",
    techOwner: "FEF",
    opsOwner: "Account / PLG (Platform)",
    description:
      "In-app channel for product announcements. Carousel/story format. Opens from bell icon. No historical record — replaced each quarter.",
    messaging: {
      allowed: ["New features/products", "Product enhancements"],
      notAllowed: [
        "Education (FAQ)",
        "Events",
        "Upselling (future consideration)",
      ],
      category: "Marketing",
    },
    audience: {
      whoCanDefine:
        "Product Marketing (aligned as part of QPR, quarterly updates)",
      whoSignsOff: "Marketing Team",
      restrictions: [
        "Phase 1: ALL audience only (no segmentation/eligibility)",
        "Future: customizable per user segment",
      ],
    },
    cta: {
      required: true,
      rules: [
        "Must direct to action within the account",
        "No external links",
      ],
    },
    timing: {
      coolOff: "N/A",
      reminders: "Badge on bell icon until panel opened",
      delivery: "Updated quarterly (beginning of each quarter)",
    },
    ecosystem: [
      "Can coexist with all existing channels on HP",
    ],
    designHighlights: [
      "Category text: max 36 chars (H5), starts with 'What's new in…'",
      "Title (H2): max 80 chars, can wrap 2–3 lines",
      "Text (Lead paragraph): max 100 chars",
      "CTA aligned left. 8px title↔text spacing. 24px text↔CTA.",
      "Background image covers entire panel",
      "Carousel navigation with arrows, loops seamlessly",
      "Panel closes on click outside or X. Page remains interactive.",
    ],
  },
  {
    id: "notifications",
    name: "Notification Center",
    category: "in-app",
    status: "frozen",
    brazeAvailable: false,
    devices: ["Web", "Mobile"],
    context: "Floater panel / Page",
    intent: "Operational",
    techOwner: "OneX",
    opsOwner: "LCM (Marketing)",
    description:
      "In-app notifications for account updates, security alerts, and transaction changes. No promotional content. Includes business action notifications (payment requests, approvals, card activations).",
    messaging: {
      allowed: ["Operations", "Transactional"],
      notAllowed: ["Marketing", "Promotional"],
      category: "Operations & Transactional",
    },
    audience: {
      whoCanDefine: "Any product manager (no governance currently)",
      whoSignsOff: "Avi Castro (Operations)",
      restrictions: ["All users"],
    },
    cta: {
      required: false,
      rules: [
        "No requirement to include CTA",
        "No mandatory format — some lead to/off platform",
      ],
    },
    timing: {
      coolOff: "No limit on messages for same topic",
      reminders: "N/A",
      delivery: "N/A",
    },
    ecosystem: [
      "Most notifications also sent by email (content copy)",
      "Future: unified with What's New panel",
    ],
    designHighlights: [
      "Preview — Title: up to 35 chars. Description: max 2 lines (120 chars).",
      "Full notification — Title: 60 chars max. Text: no limit.",
      "CTA: primary button XS, max 20 chars. Only one CTA allowed.",
      "Links: blue with underline (design system)",
      "Unread: blue dot + bold title. Read on click.",
      "Filters: All / Unread. Sticky header while scrolling.",
      "Business actions: removed once read. Aggregate pending counts.",
    ],
  },
  {
    id: "tour-guide",
    name: "Tour Guide / Tooltip",
    category: "in-app",
    status: "production",
    brazeAvailable: false,
    brazeNote: "Standalone reusable component — not governed via Braze. Future integration planned with A/B testing, queuing, and expiration.",
    devices: ["Web"],
    context: "Flow-oriented (page elements)",
    intent: "Adoption / Activation",
    techOwner: "FEF",
    opsOwner: "Account / PLG (Platform)",
    description:
      "Reusable in-app component for contextual step-by-step tours tied to page elements. Currently standalone (not governed). Future plans include A/B testing, queuing, and expiration via an integrated tour management tool.",
    messaging: {
      allowed: [
        "Upsell / Cross-sell new capabilities",
        "UI/UX change updates",
      ],
      notAllowed: [
        "FDC requirements",
        "Critical messages",
        "Account/payment warnings",
        "Transactional",
      ],
      category: "Marketing & UX",
    },
    audience: {
      whoCanDefine: "Product originates → Marketing implements",
      whoSignsOff: "Product & QA of originating domain",
      restrictions: [
        "Advanced segmentation via UserPilot (location, device, account attributes)",
      ],
    },
    cta: {
      required: false,
      rules: [
        "CTA allowed, not mandatory",
        "Content limited to: NEXT / GOT IT / X",
        "X (dismiss) mandatory",
      ],
    },
    timing: {
      coolOff: "Single use — disappears after viewed or closed once",
      reminders: "None — tours cannot trigger multiple times",
      delivery: "Must have expiration date",
    },
    ecosystem: [
      "Can appear simultaneously with other channels",
      "Cannot appear upon/over another channel (banner, jumbotron, etc.)",
      "Cannot target items that already have an upsell/cross-sell banner",
    ],
    designHighlights: [
      "Max 4 tours per account, 1 per page",
      "1–5 steps per tour. Multi-step requires 'Next' CTA.",
      "Two templates: with or without illustration",
      "Illustration: Level 3 Light (120×120px, do not resize)",
      "Title (must): 80 chars max. Text (must): 150 chars max.",
      "CTA: 'Next' (multi-step) / 'Got it' (single/final step)",
      "Cannot appear on: login, wizards, selection pages",
    ],
  },
  {
    id: "banners",
    name: "Banners (Internal Pages)",
    category: "in-app",
    status: "planned",
    brazeAvailable: false,
    devices: ["Web"],
    context: "Internal pages (not HP)",
    intent: "Cross-sell / Upsell / New capabilities",
    techOwner: "FEF",
    opsOwner: "Account / PLG (Platform)",
    description:
      "Page-level banners for cross-sell and upsell within the platform. One banner per page, must include CTA. Auto-disappears after 3 logins without engagement.",
    messaging: {
      allowed: [
        "Cross-sell / Upsell",
        "New capabilities the user is eligible for",
      ],
      notAllowed: [
        "UI/UX change updates",
        "FDC requirements",
        "Critical/warning messages",
      ],
      category: "Marketing",
    },
    audience: {
      whoCanDefine: "Product originates → Marketing implements",
      whoSignsOff: "Product & QA of originating domain",
      restrictions: [
        "User must be eligible for the promoted capability",
        "Advanced segmentation via UserPilot",
      ],
    },
    cta: {
      required: true,
      rules: [
        "CTA mandatory and measured",
        "User must be able to adopt immediately (not future)",
        "Can navigate between pages but not outside the platform",
        "X (dismiss) mandatory",
      ],
    },
    timing: {
      coolOff: "Disappears after: X click, CTA click, or 3 logins without engagement",
      reminders: "Reappears up to 2 more times on login if not interacted with",
      delivery: "Expiration date required",
    },
    ecosystem: [
      "Cannot appear on same page as Jumbotron",
      "Cannot appear on items that have a tour/tooltip",
      "Can appear with other channels (alerts, etc.)",
      "Not allowed on: login, HP, selection pages, gate offering, wizards (except success page)",
    ],
    designHighlights: [
      "One banner per page at a time",
      "Multiple banners can be active across different pages in an account",
    ],
  },
  {
    id: "first-use-states",
    name: "First-Use States",
    category: "in-app",
    status: "production",
    brazeAvailable: false,
    devices: ["Web"],
    context: "Product pages (empty states)",
    intent: "Activation / Adoption",
    techOwner: "FEF",
    opsOwner: "Account / PLG (Platform)",
    description:
      "Guide users through upgrade, setup, and initial product introduction. Three lifecycle stages: Upgrade → Requirements → Introduction. Adapts content based on customer lifecycle.",
    messaging: {
      allowed: ["Marketing of specific products the state applies to"],
      notAllowed: ["All other communication types"],
      category: "Marketing",
    },
    audience: {
      whoCanDefine: "Product Marketing",
      whoSignsOff: "Product + Product Marketing",
      restrictions: [
        "Appears only for eligible products",
        "Content adapts to lifecycle stage (upgrade/requirements/introduction)",
      ],
    },
    cta: {
      required: true,
      rules: [
        "CTA mandatory and measured",
        "User must be able to adopt immediately",
      ],
    },
    timing: {
      coolOff: "N/A — persistent until resolved",
      reminders: "N/A",
      delivery:
        "Upgrade: until user upgrades. Requirements: until submitted. Introduction: disappears after first CTA click.",
    },
    ecosystem: [],
    designHighlights: [
      "Three stages: Upgrade → Requirements → Introduction",
      "Upgrade: title + subtitle + disclaimer + requirements link + CTA + image + 3 benefits",
      "Requirements: title + subtitle + image + requirements component + 3 how-to steps",
      "Introduction: title + subtitle + CTA + image + 3 how-to steps",
      "Benefit/step: icon (Level 1 Light) + title (32 chars max) + text (120 chars max)",
    ],
    figmaLink:
      "https://www.figma.com/design/NM1XUYz4PGmfXNT6yGrWId/Empty-states?node-id=5797-41735",
  },
  {
    id: "push-notification",
    name: "Push Notification",
    category: "external",
    status: "planned",
    brazeAvailable: false,
    devices: ["Mobile"],
    context: "External (device notification)",
    intent: "Multi-hierarchy messaging",
    techOwner: "FEF",
    opsOwner: "LCM (Marketing) via Braze",
    description:
      "Mobile push notifications delivered via Braze. Text + CTA format.",
    messaging: {
      allowed: ["Multi-purpose (operational + marketing)"],
      notAllowed: [],
      category: "Mixed",
    },
    audience: {
      whoCanDefine: "Marketing via Braze",
      whoSignsOff: "Marketing",
      restrictions: ["Mobile app users with push enabled"],
    },
    cta: { required: false, rules: ["Text + CTA format"] },
    timing: { coolOff: "Managed via Braze", reminders: "Via Braze journeys", delivery: "Real-time via Braze" },
    ecosystem: [],
    designHighlights: ["Standard mobile push format", "Text + CTA"],
  },
  {
    id: "email",
    name: "Email",
    category: "external",
    status: "production",
    brazeAvailable: true,
    brazeNote: "Pending application event creation",
    devices: [],
    context: "External",
    intent: "Multi-purpose",
    techOwner: "OneX",
    opsOwner: "LCM (Marketing) via Braze",
    description:
      "External email channel delivered via Braze. Supports templates. Primary external communication channel.",
    messaging: {
      allowed: ["Transactional", "Marketing", "Operational"],
      notAllowed: [],
      category: "Mixed",
    },
    audience: {
      whoCanDefine: "Marketing via Braze",
      whoSignsOff: "Marketing",
      restrictions: [],
    },
    cta: { required: false, rules: ["Email template system"] },
    timing: { coolOff: "Managed via Braze fatigue rules", reminders: "Via Braze journeys", delivery: "Via Braze" },
    ecosystem: ["Often duplicates notification center content"],
    designHighlights: ["Email templates via Braze"],
  },
  {
    id: "sms",
    name: "SMS",
    category: "external",
    status: "production",
    brazeAvailable: true,
    devices: [],
    context: "External",
    intent: "Multi-purpose",
    techOwner: "OneX",
    opsOwner: "LCM (Marketing) via Braze",
    description: "SMS channel delivered via Braze. Text + CTA format.",
    messaging: {
      allowed: ["Transactional", "Marketing"],
      notAllowed: [],
      category: "Mixed",
    },
    audience: {
      whoCanDefine: "Marketing via Braze",
      whoSignsOff: "Marketing",
      restrictions: ["Users with valid phone number"],
    },
    cta: { required: false, rules: ["Text + CTA"] },
    timing: { coolOff: "Managed via Braze", reminders: "Via Braze", delivery: "Via Braze" },
    ecosystem: [],
    designHighlights: ["Text + CTA format"],
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    category: "external",
    status: "production",
    brazeAvailable: true,
    devices: [],
    context: "External",
    intent: "Multi-purpose",
    techOwner: "OneX",
    opsOwner: "LCM (Marketing)",
    description:
      "WhatsApp messaging channel. Text + CTA format. Growing channel for engagement.",
    messaging: {
      allowed: ["Transactional", "Marketing"],
      notAllowed: [],
      category: "Mixed",
    },
    audience: {
      whoCanDefine: "Marketing",
      whoSignsOff: "Marketing",
      restrictions: ["Users with WhatsApp opt-in"],
    },
    cta: { required: false, rules: ["Text + CTA"] },
    timing: { coolOff: "TBD", reminders: "TBD", delivery: "Via messaging platform" },
    ecosystem: [],
    designHighlights: ["Text + CTA format"],
  },
];

export const ALERT_COMBINATIONS = [
  { alert: "Critical", shownAlongside: "None — shown alone only" },
  { alert: "Warning", shownAlongside: "Informational" },
  { alert: "Informational", shownAlongside: "Warning or Success" },
  { alert: "Success", shownAlongside: "Informational" },
];

export interface GovernanceRule {
  title: string;
  content: string;
}

export const GOVERNANCE_RULES: GovernanceRule[] = [
  { title: "One Jumbotron per session", content: "Only one Jumbotron banner is displayed per user session. Jumbotrons are strictly promotional — not for alerts or operational messages. Priority is set by Marketing." },
  { title: "Alert severity hierarchy", content: "Alerts follow a severity hierarchy: Critical > Warning > Informational > Success. Critical alerts are shown alone; Warning can coexist with Informational; Informational can coexist with Warning or Success." },
  { title: "No promotional content in alerts", content: "Alert channels (In-Product Alert, Notification Center) must never be used for promotional messaging, upsell, or marketing. They are reserved for operational, compliance, and transactional messages." },
  { title: "Cool-off periods", content: "Each alert severity has a cool-off period: Critical = 0 (immediate), Warning = 24h, Informational = 48h, Success = 72h. Users cannot receive the same alert type within the cool-off window." },
  { title: "Email frequency", content: "Marketing emails: max 2 per week per user. Transactional/operational emails have no cap but must be event-driven, not batch-sent." },
  { title: "SMS & WhatsApp opt-in required", content: "SMS and WhatsApp require explicit user opt-in. Messages must include opt-out instructions. No promotional SMS/WhatsApp without consent." },
  { title: "Frozen channels", content: "Notification Center & In-Product Alerts are currently frozen until migration to Braze is complete. No new implementations on these channels." },
  { title: "Tour Guide standalone", content: "Tour Guide is in production as a reusable standalone UI component. It currently lacks queueing, expiration, and A/B testing. Future plans include integration with a more robust tour management tool that adds these capabilities." },
  { title: "Cross-channel coordination", content: "When a communication spans multiple channels (e.g., email + in-app alert), ensure consistent messaging and avoid duplicate notifications within the same session." },
  { title: "Content ownership", content: "Promotional content is owned by Marketing. Operational/transactional content is owned by Product. Alert content must be approved by both Product and Compliance." },
];

export const USE_CASES = [
  "Activation",
  "Product Education",
  "Cross-sale / Upsell — Expansion & Adoption",
  "Need (Action / Intent context)",
  "Opportunity (Account Threshold / Maturity context)",
  "Product Retention",
  "User Retention / Churn",
  "Operational messages (Warning / Critical)",
  "Contact Us / Contact AH",
  "Decline",
  "Churned / Dormant",
];
