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

    // Add events in the natural interaction order within this screen
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
          name: ev.eventName,
          description: ev.description ?? undefined,
          order: order++,
          screenIndex,
          behavioralEventId: ev.id,
        });
      }
    }

    // Any remaining events for this screen not caught by the standard order
    for (const ev of flowEvents) {
      if (!addedBehavioralIds.has(ev.id)) {
        addedBehavioralIds.add(ev.id);
        steps.push({
          kind: "ACTION",
          name: ev.eventName,
          description: ev.description ?? undefined,
          order: order++,
          screenIndex,
          behavioralEventId: ev.id,
        });
      }
    }
  }

  // Phase 2: Flow-wide behavioral events (tooltip, popup, etc. with screenIndex -1)
  // These don't belong to a specific screen — append after all screen steps
  for (const ev of input.behavioralEvents) {
    if (!addedBehavioralIds.has(ev.id)) {
      addedBehavioralIds.add(ev.id);
      steps.push({
        kind: "ACTION",
        name: ev.eventName,
        description: ev.description ?? undefined,
        order: order++,
        behavioralEventId: ev.id,
      });
    }
  }

  // Phase 3: Application events as SYSTEM_TRIGGER steps
  for (const ev of input.applicationEvents) {
    steps.push({
      kind: "SYSTEM_TRIGGER",
      name: ev.eventName,
      description: ev.description ?? undefined,
      order: order++,
      applicationEventId: ev.id,
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
