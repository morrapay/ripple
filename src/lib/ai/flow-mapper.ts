/**
 * FlowMapper — maps flows (screens) + events → ordered journey steps.
 *
 * Screens are treated as a sequential journey in insertion order (left → right).
 * For each screen, its behavioral events are emitted in event-type order
 * (page_view → click → submit → error_message → ...), building a proper
 * step-by-step journey.
 *
 * Application events (system triggers) are appended after the screen-based
 * steps, representing backend reactions to the user journey.
 */

function toSlug(text: string): string {
  return text
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .toLowerCase();
}

function humanizeName(eventName: string, eventType: string): string {
  const typeLabels: Record<string, string> = {
    page_view: "Page View",
    click: "Click",
    submit: "Submit",
    field_change: "Field Change",
    error_message_view: "Error Displayed",
    error_message: "Error",
    error: "Error",
    tooltip_view: "Tooltip Shown",
    tooltip: "Tooltip",
    popup_view: "Popup Shown",
    popup: "Popup",
    toast: "Toast",
    experiment_trigger: "Experiment",
    api_response: "API Response",
    state_change: "State Change",
    navigation: "Navigation",
    webhook: "Webhook",
    scheduler: "Scheduled",
  };
  const label = typeLabels[eventType] ?? eventType.replace(/_/g, " ");

  let context = eventName;
  const suffixes = [
    `_${eventType}`, "_page_view", "_click", "_submit", "_error_message_view",
    "_error_message", "_error", "_tooltip_view", "_popup_view", "_toast",
    "_field_change", "_experiment_trigger", "_api_response", "_state_change",
    "_navigation", "_webhook", "_scheduler",
  ];
  for (const s of suffixes) {
    if (context.endsWith(s)) {
      context = context.slice(0, -s.length);
      break;
    }
  }
  context = context.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).trim();

  return context ? `${context} — ${label}` : label;
}

function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[-_\s]+/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function eventMatchesFlow(eventName: string, flowSlug: string): boolean {
  if (eventName.startsWith(`${flowSlug}_`) || eventName.startsWith(`${flowSlug.replace(/-/g, "_")}_`))
    return true;
  const lastUnderscore = eventName.lastIndexOf("_");
  if (lastUnderscore <= 0) return false;
  const eventPrefix = eventName.substring(0, lastUnderscore);
  return normalizeForMatch(eventPrefix) === normalizeForMatch(flowSlug);
}

/** Event types in the order they naturally occur within a single screen */
const BEHAVIORAL_ORDER = [
  "page_view",
  "click",
  "submit",
  "field_change",
  "error_message_view",
  "error_message",
  "error",
  "tooltip_view",
  "tooltip",
  "popup_view",
  "popup",
  "toast",
  "experiment_trigger",
] as const;

export interface Flow {
  id: string;
  name: string;
  flowType: string;
}

export interface DomainBehavioralEvent {
  id: string;
  eventName: string;
  eventType: string;
  description: string | null;
}

export interface DomainApplicationEvent {
  id: string;
  eventName: string;
  eventType: string;
  description: string | null;
}

export type MappedStepKind = "ACTION" | "SYSTEM_TRIGGER" | "COMMUNICATION" | "STATE";

export interface MappedStep {
  kind: MappedStepKind;
  name: string;
  description?: string;
  order: number;
  screenIndex?: number;
  behavioralEventId?: string;
  applicationEventId?: string;
  communicationPointName?: string;
  triggerEvent?: string;
}

export interface FlowMappingInput {
  flows: Flow[];
  behavioralEvents: DomainBehavioralEvent[];
  applicationEvents: DomainApplicationEvent[];
}

export interface FlowMappingResult {
  steps: MappedStep[];
  summary: {
    actionCount: number;
    systemTriggerCount: number;
    flowCount: number;
  };
}

/**
 * Maps flows and events to an ordered journey step sequence.
 *
 * Flows are processed in their **insertion order** (the order the user added
 * them), which represents the left-to-right journey sequence.
 *
 * For each screen/flow:
 *   1. Find all behavioral events whose name matches the screen slug
 *   2. Emit them in event-type order (page_view → click → submit → error)
 *
 * After all screens, append application events as system triggers.
 */
export function mapFlowToJourneySteps(
  input: FlowMappingInput
): FlowMappingResult {
  const steps: MappedStep[] = [];
  let order = 0;

  // Flows arrive in insertion order (createdAt asc) — this IS the journey sequence
  const flowSlugs = input.flows.map((f, idx) => ({
    flow: f,
    slug: toSlug(f.name),
    screenIndex: idx,
  }));

  const addedBehavioralIds = new Set<string>();

  // Phase 1: For each screen in sequence, add its behavioral events in event-type order
  for (const { slug, screenIndex } of flowSlugs) {
    const flowEvents = input.behavioralEvents.filter(
      (e) => eventMatchesFlow(e.eventName, slug) && !addedBehavioralIds.has(e.id)
    );

    for (const eventType of BEHAVIORAL_ORDER) {
      const ev = flowEvents.find(
        (e) =>
          e.eventType === eventType ||
          e.eventType === eventType.replace("_view", "")
      );
      if (ev) {
        addedBehavioralIds.add(ev.id);
        steps.push({
          kind: "ACTION",
          name: humanizeName(ev.eventName, ev.eventType),
          description: ev.description ?? undefined,
          order: order++,
          screenIndex,
          behavioralEventId: ev.id,
          triggerEvent: ev.eventName,
        });
      }
    }

    for (const ev of flowEvents) {
      if (!addedBehavioralIds.has(ev.id)) {
        addedBehavioralIds.add(ev.id);
        steps.push({
          kind: "ACTION",
          name: humanizeName(ev.eventName, ev.eventType),
          description: ev.description ?? undefined,
          order: order++,
          screenIndex,
          behavioralEventId: ev.id,
          triggerEvent: ev.eventName,
        });
      }
    }
  }

  for (const ev of input.behavioralEvents) {
    if (!addedBehavioralIds.has(ev.id)) {
      addedBehavioralIds.add(ev.id);
      steps.push({
        kind: "ACTION",
        name: humanizeName(ev.eventName, ev.eventType),
        description: ev.description ?? undefined,
        order: order++,
        behavioralEventId: ev.id,
        triggerEvent: ev.eventName,
      });
    }
  }

  for (const ev of input.applicationEvents) {
    steps.push({
      kind: "SYSTEM_TRIGGER",
      name: humanizeName(ev.eventName, ev.eventType),
      description: ev.description ?? undefined,
      order: order++,
      applicationEventId: ev.id,
      triggerEvent: ev.eventName,
    });
  }

  return {
    steps,
    summary: {
      actionCount: steps.filter((s) => s.kind === "ACTION").length,
      systemTriggerCount: steps.filter((s) => s.kind === "SYSTEM_TRIGGER").length,
      flowCount: input.flows.length,
    },
  };
}
