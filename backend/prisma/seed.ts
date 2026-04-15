import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const taxonomyTypes = [
    { code: "page_view", name: "Page View", description: "Page or screen view" },
    { code: "click", name: "Click", description: "Click or tap interaction" },
    { code: "submit", name: "Submit", description: "Form or action submit" },
    { code: "field_change", name: "Field Change", description: "Focus, change, or validation" },
    { code: "error_message_view", name: "Error Message View", description: "Error UI display" },
    { code: "tooltip_view", name: "Tooltip View", description: "Tooltip display" },
    { code: "popup_view", name: "Popup View", description: "Modal or popup display" },
    { code: "experiment_trigger", name: "Experiment Trigger", description: "A/B test trigger point" },
  ];

  for (const t of taxonomyTypes) {
    await prisma.behavioralTaxonomyType.upsert({
      where: { code: t.code },
      create: t,
      update: t,
    });
  }

  const templates = [
    { channel: "email", category: "transactional", name: "Transaction Confirmation", description: "Confirm user action" },
    { channel: "email", category: "marketing", name: "Promotional", description: "Marketing campaign" },
    { channel: "in_app", category: "notification", name: "In-App Banner", description: "Banner notification" },
    { channel: "in_app", category: "modal", name: "Modal Dialog", description: "Modal communication" },
    { channel: "push", category: "notification", name: "Push Notification", description: "Mobile push" },
    { channel: "sms", category: "transactional", name: "SMS Alert", description: "SMS notification" },
  ];

  for (const t of templates) {
    await prisma.communicationTemplate.create({ data: t });
  }

  /* ── Question Bank: AnalyticsAdvisor categories ─────────────────────── */
  await prisma.questionBankItem.deleteMany();

  const questions = [
    // ── Core Funnel Performance ──────────────────────────────────────────
    { question: "What is the overall conversion rate from flow start to completion?", category: "Core Funnel Performance", dimension: "conversion_rate" },
    { question: "How many users start the flow per day/week?", category: "Core Funnel Performance", dimension: "flow_volume" },
    { question: "What is the step-by-step conversion rate across the flow?", category: "Core Funnel Performance", dimension: "step_conversion" },
    { question: "What percentage of users complete the flow successfully?", category: "Core Funnel Performance", dimension: "completion_rate" },
    { question: "What is the average time to complete the entire flow?", category: "Core Funnel Performance", dimension: "time_to_complete" },
    { question: "How does conversion change over time (daily/weekly trends)?", category: "Core Funnel Performance", dimension: "conversion_trend" },
    { question: "What is the success vs failure ratio at the final step?", category: "Core Funnel Performance", dimension: "success_ratio" },

    // ── Drop-off & Friction ──────────────────────────────────────────────
    { question: "Which step has the highest drop-off rate?", category: "Drop-off & Friction", dimension: "drop_off_step" },
    { question: "What percentage of users abandon the flow at each step?", category: "Drop-off & Friction", dimension: "abandonment_rate" },
    { question: "What are the most common errors users encounter?", category: "Drop-off & Friction", dimension: "error_frequency" },
    { question: "Which validation failures cause users to leave?", category: "Drop-off & Friction", dimension: "validation_failure" },
    { question: "Do users who encounter errors retry or abandon?", category: "Drop-off & Friction", dimension: "retry_vs_abandon" },
    { question: "Is there a specific step where users get stuck (long dwell time)?", category: "Drop-off & Friction", dimension: "dwell_time" },
    { question: "What is the correlation between number of errors and drop-off?", category: "Drop-off & Friction", dimension: "error_correlation" },

    // ── Behavioral Interaction ───────────────────────────────────────────
    { question: "How long do users spend on each step?", category: "Behavioral Interaction", dimension: "step_duration" },
    { question: "How many retry attempts do users make before succeeding or abandoning?", category: "Behavioral Interaction", dimension: "retry_count" },
    { question: "Do users navigate back to previous steps? Which ones?", category: "Behavioral Interaction", dimension: "back_navigation" },
    { question: "What is the distribution of session durations for the flow?", category: "Behavioral Interaction", dimension: "session_duration" },
    { question: "Do users interact with help/tooltip elements? Which ones?", category: "Behavioral Interaction", dimension: "help_interaction" },
    { question: "How many form fields trigger validation errors on first attempt?", category: "Behavioral Interaction", dimension: "field_errors" },
    { question: "Do users change selections after initially choosing (e.g., dropdowns)?", category: "Behavioral Interaction", dimension: "selection_changes" },

    // ── Segment Performance ──────────────────────────────────────────────
    { question: "How does conversion differ by country or region?", category: "Segment Performance", dimension: "geo_conversion" },
    { question: "How does conversion differ by device type (desktop vs mobile)?", category: "Segment Performance", dimension: "device_conversion" },
    { question: "How does performance vary by acquisition source or channel?", category: "Segment Performance", dimension: "source_conversion" },
    { question: "Is there a difference in completion rate between user types (individual vs business)?", category: "Segment Performance", dimension: "user_type_conversion" },
    { question: "Do new users convert differently than returning users?", category: "Segment Performance", dimension: "new_vs_returning" },
    { question: "Which user segments have the highest drop-off?", category: "Segment Performance", dimension: "segment_drop_off" },
    { question: "How does language or locale affect completion rates?", category: "Segment Performance", dimension: "locale_conversion" },

    // ── Quality / Risk / Compliance ──────────────────────────────────────
    { question: "How many users fail identity or document verification?", category: "Quality / Risk / Compliance", dimension: "verification_failure" },
    { question: "What is the fraud detection rate within the flow?", category: "Quality / Risk / Compliance", dimension: "fraud_rate" },
    { question: "How many accounts are flagged or blocked during the flow?", category: "Quality / Risk / Compliance", dimension: "blocked_accounts" },
    { question: "What percentage of users pass compliance checks on the first attempt?", category: "Quality / Risk / Compliance", dimension: "compliance_first_pass" },
    { question: "Which verification method has the highest failure rate?", category: "Quality / Risk / Compliance", dimension: "verification_method" },
    { question: "Are there geographic patterns in verification failures?", category: "Quality / Risk / Compliance", dimension: "geo_verification" },
    { question: "How long does the verification/review step take to resolve?", category: "Quality / Risk / Compliance", dimension: "review_duration" },

    // ── Lifecycle & Re-engagement ────────────────────────────────────────
    { question: "How many users return to complete an abandoned flow?", category: "Lifecycle & Re-engagement", dimension: "return_rate" },
    { question: "What is the average time between abandonment and return?", category: "Lifecycle & Re-engagement", dimension: "return_delay" },
    { question: "Do reminder emails/notifications improve completion rates?", category: "Lifecycle & Re-engagement", dimension: "reminder_effectiveness" },
    { question: "Which communication channel is most effective for re-engagement?", category: "Lifecycle & Re-engagement", dimension: "channel_effectiveness" },
    { question: "What percentage of abandoned flows are eventually completed?", category: "Lifecycle & Re-engagement", dimension: "recovery_rate" },
    { question: "At which step do most returning users resume?", category: "Lifecycle & Re-engagement", dimension: "resume_step" },
    { question: "How many touchpoints does it take to re-engage an abandoned user?", category: "Lifecycle & Re-engagement", dimension: "touchpoint_count" },
  ];

  for (const q of questions) {
    await prisma.questionBankItem.create({ data: q });
  }

  console.log("Seed completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
