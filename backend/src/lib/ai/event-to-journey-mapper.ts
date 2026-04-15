/* ─── EventToJourneyMapper ───────────────────────────────────────────────
   Senior Product Analytics, Event Taxonomy, and User Journey Mapping agent.

   Constructs accurate user journeys from mixed event data by:
   1. Classifying events (behavioral / application / hybrid)
   2. Building a behavioral backbone (deterministic layer)
   3. Mapping application events (probabilistic layer)
   4. Scoring confidence on every decision
   5. Learning from user corrections (change detection → patterns → rules)

   Reasoning Principles:
   - Behavioral events = intent (anchor the journey)
   - Application events = system state (contextual layer)
   - Prefer causality over sequence
   - Multiple valid journeys may exist
   - Never present uncertain logic as fact
   ──────────────────────────────────────────────────────────────────────── */

import type {
  JourneyMapperInput,
  JourneyMapperOutput,
  ClassifiedEvent,
  EventClassification,
  JourneyStep,
  MappedApplicationEvent,
  ApplicationEventRole,
  MappedJourney,
  InstrumentationGap,
  ConfidenceLevel,
  ConfidenceScore,
  UserEditedJourney,
  JourneyDiff,
  DiffType,
  LearnedRule,
} from "./journey-mapper-types";

import {
  getActiveRules,
  extractAndStorePatterns,
  getActiveDriftSignals,
  recordDriftSignal,
} from "./learning-store";

/* ─── System Prompt (for future LLM integration) ─── */

export const EVENT_TO_JOURNEY_MAPPER_SYSTEM_PROMPT = `
You are a Senior Product Analytics, Event Taxonomy, and User Journey Mapping expert.

Your task is to:
- Construct accurate user journeys from mixed event data
- Intelligently map behavioral + application events
- Continuously learn from user corrections and improve future mappings

You must think like an analyst who balances:
- Deterministic logic (behavioral flows)
- Probabilistic inference (application/system events)
- Adaptive learning (from human feedback)

Reasoning Principles:
- Behavioral events = intent (anchor the journey)
- Application events = system state (contextual layer)
- Do not rely solely on timestamps
- Prefer causality over sequence
- Avoid overfitting to a single interpretation
- Multiple valid journeys may exist
`.trim();

/* ─── Event type knowledge base ─── */

const BEHAVIORAL_EVENT_TYPES = new Set([
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
]);

const APPLICATION_EVENT_TYPES = new Set([
  "API_TRIGGERED",
  "OFFLINE_PROCESS",
]);

/** Natural interaction order within a screen */
const BEHAVIORAL_ORDER: string[] = [
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
];

/** Keywords that signal hybrid events (user-triggered but system-completed) */
const HYBRID_INDICATORS = [
  "submit", "confirm", "approve", "verify", "activate",
  "register", "subscribe", "purchase", "order", "pay",
];

/** Causal keywords for application event role inference */
const ROLE_SIGNALS: Record<ApplicationEventRole, string[]> = {
  STATE_CHANGE: ["created", "updated", "changed", "issued", "activated", "completed", "migrated"],
  VALIDATION: ["validated", "verified", "checked", "approved", "rejected", "denied"],
  ASYNC_PROCESS: ["processing", "pending", "queued", "scheduled", "generating", "syncing"],
  OUTCOME: ["success", "failed", "error", "result", "outcome", "settled", "finalized"],
};

/* ─── Flow type patterns ─── */

const FLOW_TYPE_PATTERNS: Record<string, string[]> = {
  ONBOARDING: ["onboard", "welcome", "signup", "register", "first_use", "setup"],
  TRANSACTION: ["transaction", "payment", "transfer", "deposit", "withdraw", "payout"],
  APPROVAL: ["kyc", "verification", "approve", "review", "compliance", "identity"],
  ACTIVATION: ["activate", "enable", "unlock", "start", "launch", "card_order"],
};

/* ─── Utility functions ─── */

function toSlug(text: string): string {
  return text.replace(/[^a-zA-Z0-9\s]/g, "").trim().replace(/\s+/g, "_").toLowerCase();
}

function normalizeForMatch(text: string): string {
  return text.toLowerCase().replace(/[-_\s]+/g, "").replace(/[^a-z0-9]/g, "");
}

function eventBelongsToFlow(eventName: string, flowSlug: string): boolean {
  const normalized = normalizeForMatch(eventName);
  const flowNorm = normalizeForMatch(flowSlug);
  return normalized.startsWith(flowNorm) || normalized.includes(flowNorm);
}

function inferApplicationRole(eventName: string, description: string | null): {
  role: ApplicationEventRole;
  confidence: ConfidenceLevel;
} {
  const searchText = `${eventName} ${description ?? ""}`.toLowerCase();

  for (const [role, keywords] of Object.entries(ROLE_SIGNALS)) {
    for (const kw of keywords) {
      if (searchText.includes(kw)) {
        return {
          role: role as ApplicationEventRole,
          confidence: searchText.includes(kw) && keywords.length > 1 ? "HIGH" : "MEDIUM",
        };
      }
    }
  }

  return { role: "STATE_CHANGE", confidence: "LOW" };
}

function inferFlowType(flows: { name: string }[], events: { eventName: string }[]): string | undefined {
  const allText = [
    ...flows.map((f) => f.name.toLowerCase()),
    ...events.map((e) => e.eventName.toLowerCase()),
  ].join(" ");

  for (const [flowType, patterns] of Object.entries(FLOW_TYPE_PATTERNS)) {
    if (patterns.some((p) => allText.includes(p))) {
      return flowType;
    }
  }
  return undefined;
}

function confidence(level: ConfidenceLevel, reasoning: string): ConfidenceScore {
  return { level, reasoning };
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN AGENT
   ═══════════════════════════════════════════════════════════════════════ */

export const EventToJourneyMapper = {
  name: "EventToJourneyMapper" as const,
  systemPrompt: EVENT_TO_JOURNEY_MAPPER_SYSTEM_PROMPT,

  /* ─── 1. Classify Events ─── */

  classifyEvents(
    input: JourneyMapperInput,
    rules: LearnedRule[]
  ): ClassifiedEvent[] {
    const classified: ClassifiedEvent[] = [];

    // Classification rules from learning
    const classificationRules = rules.filter((r) => r.type === "CLASSIFICATION");

    for (const ev of input.behavioralEvents) {
      // Check learned rules first
      const learnedOverride = classificationRules.find((r) =>
        normalizeForMatch(r.appliesTo) === normalizeForMatch(ev.eventName)
      );

      let classification: EventClassification = "BEHAVIORAL";
      let justification = `Event type "${ev.eventType}" is a front-end behavioral event (user interaction)`;

      if (learnedOverride) {
        const parsed = learnedOverride.pattern.match(/classified as (\w+)/i);
        if (parsed?.[1]) {
          classification = parsed[1].toUpperCase() as EventClassification;
          justification = `Learned rule: ${learnedOverride.pattern}`;
        }
      } else if (HYBRID_INDICATORS.some((h) => ev.eventName.includes(h))) {
        classification = "HYBRID";
        justification = `Event "${ev.eventName}" contains hybrid indicator — user-triggered but system-completed`;
      }

      classified.push({
        eventId: ev.id,
        eventName: ev.eventName,
        eventType: ev.eventType,
        description: ev.description,
        classification,
        justification,
      });
    }

    for (const ev of input.applicationEvents) {
      const learnedOverride = classificationRules.find((r) =>
        normalizeForMatch(r.appliesTo) === normalizeForMatch(ev.eventName)
      );

      let classification: EventClassification = "APPLICATION";
      let justification = `Event type "${ev.eventType}" is a back-end application event (system state)`;

      if (learnedOverride) {
        const parsed = learnedOverride.pattern.match(/classified as (\w+)/i);
        if (parsed?.[1]) {
          classification = parsed[1].toUpperCase() as EventClassification;
          justification = `Learned rule: ${learnedOverride.pattern}`;
        }
      }

      classified.push({
        eventId: ev.id,
        eventName: ev.eventName,
        eventType: ev.eventType,
        description: ev.description,
        classification,
        justification,
      });
    }

    return classified;
  },

  /* ─── 2. Build Behavioral Backbone (Deterministic Layer) ─── */

  buildBehavioralBackbone(
    input: JourneyMapperInput,
    classified: ClassifiedEvent[],
    rules: LearnedRule[]
  ): JourneyStep[] {
    const steps: JourneyStep[] = [];
    let order = 0;

    const behavioralClassified = classified.filter(
      (c) => c.classification === "BEHAVIORAL" || c.classification === "HYBRID"
    );

    const orderingRules = rules.filter((r) => r.type === "ORDERING");
    const exclusionRules = rules.filter((r) => r.type === "EXCLUSION");

    // Organize by flow/screen
    const flowSlugs = input.flows.map((f) => ({
      flow: f,
      slug: toSlug(f.name),
    }));

    const addedIds = new Set<string>();

    // Phase 1: Screen-by-screen behavioral events
    for (const { flow, slug } of flowSlugs) {
      const flowEvents = behavioralClassified.filter(
        (c) => eventBelongsToFlow(c.eventName, slug) && !addedIds.has(c.eventId)
      );

      // Check exclusion rules
      const filteredEvents = flowEvents.filter((c) =>
        !exclusionRules.some((r) =>
          normalizeForMatch(r.appliesTo) === normalizeForMatch(c.eventName)
        )
      );

      // Sort by natural interaction order
      const sorted = [...filteredEvents].sort((a, b) => {
        const aIdx = BEHAVIORAL_ORDER.indexOf(a.eventType);
        const bIdx = BEHAVIORAL_ORDER.indexOf(b.eventType);
        return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
      });

      // Apply ordering rules
      for (const rule of orderingRules) {
        const idx = sorted.findIndex(
          (s) => normalizeForMatch(s.eventName) === normalizeForMatch(rule.appliesTo)
        );
        if (idx >= 0) {
          const match = rule.pattern.match(/ordered: (\d+)/);
          if (match) {
            const targetOrder = parseInt(match[1], 10);
            const [item] = sorted.splice(idx, 1);
            sorted.splice(Math.min(targetOrder, sorted.length), 0, item);
          }
        }
      }

      for (const ev of sorted) {
        addedIds.add(ev.eventId);
        const isHybrid = ev.classification === "HYBRID";

        steps.push({
          order: order++,
          name: ev.eventName,
          description: ev.description ?? `User interaction on ${flow.name}`,
          kind: isHybrid ? "SYSTEM_TRIGGER" : "ACTION",
          behavioralEventId: ev.eventId,
          applicationEvents: [],
          confidence: confidence(
            isHybrid ? "MEDIUM" : "HIGH",
            isHybrid
              ? `Hybrid event — user-initiated but system-completed`
              : `Behavioral event matched to screen "${flow.name}" via naming convention`
          ),
          source: orderingRules.length > 0 ? "LEARNED" : "INFERRED",
        });
      }
    }

    // Phase 2: Unmatched behavioral events (flow-wide)
    for (const ev of behavioralClassified) {
      if (addedIds.has(ev.eventId)) continue;
      if (exclusionRules.some((r) =>
        normalizeForMatch(r.appliesTo) === normalizeForMatch(ev.eventName)
      )) continue;

      addedIds.add(ev.eventId);
      steps.push({
        order: order++,
        name: ev.eventName,
        description: ev.description ?? "Unmatched behavioral event",
        kind: "ACTION",
        behavioralEventId: ev.eventId,
        applicationEvents: [],
        confidence: confidence(
          "LOW",
          "Behavioral event could not be matched to a specific screen — placed at end of backbone"
        ),
        source: "INFERRED",
      });
    }

    return steps;
  },

  /* ─── 3. Map Application Events (Probabilistic Layer) ─── */

  mapApplicationEvents(
    input: JourneyMapperInput,
    backboneSteps: JourneyStep[],
    classified: ClassifiedEvent[],
    rules: LearnedRule[]
  ): JourneyStep[] {
    const steps = [...backboneSteps];
    const applicationClassified = classified.filter(
      (c) => c.classification === "APPLICATION"
    );

    const mappingRules = rules.filter((r) => r.type === "MAPPING");
    const parentChildRules = rules.filter((r) => r.type === "PARENT_CHILD");

    let nextOrder = steps.length > 0 ? steps[steps.length - 1].order + 1 : 0;

    for (const appEv of applicationClassified) {
      const { role, confidence: roleConf } = inferApplicationRole(
        appEv.eventName,
        appEv.description
      );

      // Check mapping rules: does a rule tell us where this event belongs?
      const mappingRule = mappingRules.find((r) =>
        normalizeForMatch(r.appliesTo) === normalizeForMatch(appEv.eventName)
      );

      const parentRule = parentChildRules.find((r) =>
        normalizeForMatch(r.appliesTo) === normalizeForMatch(appEv.eventName)
      );

      // Try to find the best parent step
      let parentStep: JourneyStep | undefined;
      let isLearned = false;

      if (mappingRule || parentRule) {
        const rule = mappingRule ?? parentRule!;
        const parentMatch = rule.pattern.match(/belongs to "?([^"]+)"?/i)
          ?? rule.pattern.match(/maps to "?([^"]+)"?/i);
        if (parentMatch) {
          parentStep = steps.find(
            (s) => normalizeForMatch(s.name) === normalizeForMatch(parentMatch[1])
          );
          isLearned = true;
        }
      }

      if (!parentStep) {
        // Probabilistic: match by naming convention
        parentStep = findBestParentByNaming(appEv.eventName, steps);
      }

      if (parentStep) {
        // Attach to existing step
        parentStep.applicationEvents.push({
          eventId: appEv.eventId,
          eventName: appEv.eventName,
          role,
          confidence: confidence(
            isLearned ? "HIGH" : roleConf,
            isLearned
              ? `Learned rule placed this event under "${parentStep.name}"`
              : `Matched to "${parentStep.name}" via naming convention; role inferred as ${role}`
          ),
          source: isLearned ? "LEARNED" : "INFERRED",
        });
      } else {
        // No parent found — create a standalone system trigger step
        steps.push({
          order: nextOrder++,
          name: appEv.eventName,
          description: appEv.description ?? "System-triggered event",
          kind: "SYSTEM_TRIGGER",
          applicationEvents: [{
            eventId: appEv.eventId,
            eventName: appEv.eventName,
            role,
            confidence: confidence(
              roleConf,
              `Standalone application event; role inferred as ${role}`
            ),
            source: "INFERRED",
          }],
          confidence: confidence(
            "MEDIUM",
            "Application event could not be mapped to a behavioral step — added as standalone system trigger"
          ),
          source: "INFERRED",
        });
      }
    }

    return steps;
  },

  /* ─── 4. Detect Gaps ─── */

  detectGaps(
    input: JourneyMapperInput,
    steps: JourneyStep[],
    classified: ClassifiedEvent[]
  ): InstrumentationGap[] {
    const gaps: InstrumentationGap[] = [];

    // Missing page_view for flows
    for (const flow of input.flows) {
      const slug = toSlug(flow.name);
      const hasPageView = classified.some(
        (c) =>
          c.eventName.includes(slug) &&
          c.eventName.includes("page_view")
      );
      if (!hasPageView) {
        gaps.push({
          type: "MISSING_EVENT",
          description: `No page_view event found for screen "${flow.name}"`,
          suggestion: `Add a "${slug}_page_view" behavioral event`,
        });
      }
    }

    // Steps with LOW confidence
    for (const step of steps) {
      if (step.confidence.level === "LOW") {
        gaps.push({
          type: "AMBIGUOUS_TRACKING",
          description: `Step "${step.name}" has low confidence: ${step.confidence.reasoning}`,
          suggestion: "Review event naming or add a mapping rule",
        });
      }
    }

    // Application events with no parent
    const unmapped = steps.filter(
      (s) =>
        s.kind === "SYSTEM_TRIGGER" &&
        !s.behavioralEventId &&
        s.applicationEvents.length > 0
    );
    if (unmapped.length > 0) {
      gaps.push({
        type: "SUGGESTED_IMPROVEMENT",
        description: `${unmapped.length} application event(s) are standalone — consider linking them to behavioral steps`,
        suggestion: "Add corresponding behavioral events or create mapping rules",
      });
    }

    // Anomaly: duplicate event names
    const nameCount = new Map<string, number>();
    for (const c of classified) {
      nameCount.set(c.eventName, (nameCount.get(c.eventName) ?? 0) + 1);
    }
    for (const [name, count] of nameCount) {
      if (count > 1) {
        gaps.push({
          type: "AMBIGUOUS_TRACKING",
          description: `Event "${name}" appears ${count} times — possible duplicate`,
        });
      }
    }

    return gaps;
  },

  /* ─── 5. Detect Alternative Journeys ─── */

  detectAlternativeJourneys(
    input: JourneyMapperInput,
    primarySteps: JourneyStep[]
  ): MappedJourney[] {
    const alternatives: MappedJourney[] = [];

    // Check if there are multiple flow types (e.g., web vs mobile)
    const flowsByType = new Map<string, typeof input.flows>();
    for (const flow of input.flows) {
      const type = flow.flowType || "DEFAULT";
      if (!flowsByType.has(type)) flowsByType.set(type, []);
      flowsByType.get(type)!.push(flow);
    }

    if (flowsByType.size > 1) {
      for (const [type, flows] of flowsByType) {
        const flowSlugs = new Set(flows.map((f) => toSlug(f.name)));
        const relevantSteps = primarySteps.filter((s) => {
          const name = normalizeForMatch(s.name);
          return Array.from(flowSlugs).some((slug) =>
            name.includes(normalizeForMatch(slug))
          );
        });

        if (relevantSteps.length > 0) {
          alternatives.push({
            name: `${type} Journey`,
            description: `Journey filtered to ${type} flows only`,
            steps: relevantSteps.map((s, i) => ({ ...s, order: i })),
            flowType: type,
          });
        }
      }
    }

    // Check for error/unhappy path
    const errorSteps = primarySteps.filter(
      (s) => s.name.includes("error") || s.name.includes("fail")
    );
    if (errorSteps.length >= 2) {
      const happySteps = primarySteps.filter(
        (s) => !s.name.includes("error") && !s.name.includes("fail")
      );
      alternatives.push({
        name: "Happy Path (no errors)",
        description: "Journey with error steps removed",
        steps: happySteps.map((s, i) => ({ ...s, order: i })),
      });
    }

    return alternatives;
  },

  /* ─── 6. Main Orchestrator ─── */

  async mapEventsToJourney(
    input: JourneyMapperInput,
    domainId: string
  ): Promise<JourneyMapperOutput> {
    // Load learned rules if learning is active
    let rules: LearnedRule[] = [];
    const learnedInsightsApplied: string[] = [];

    if (input.learningMode === "ACTIVE") {
      rules = await getActiveRules(domainId);
      for (const rule of rules) {
        learnedInsightsApplied.push(
          `[${rule.confidence}] ${rule.pattern}`
        );
      }
    }

    // Step 1: Classify
    const classifiedEvents = this.classifyEvents(input, rules);

    // Step 2: Behavioral backbone
    const backbone = this.buildBehavioralBackbone(input, classifiedEvents, rules);

    // Step 3: Map application events
    const fullSteps = this.mapApplicationEvents(input, backbone, classifiedEvents, rules);

    // Step 4: Detect gaps
    const gaps = this.detectGaps(input, fullSteps, classifiedEvents);

    // Step 5: Infer flow type
    const flowType = inferFlowType(input.flows, [
      ...input.behavioralEvents,
      ...input.applicationEvents,
    ]);

    // Step 6: Build primary journey
    const flowNames = input.flows.map((f) => f.name);
    const primaryJourney: MappedJourney = {
      name: flowNames.length > 0
        ? `${flowNames.slice(0, 3).join(" → ")}${flowNames.length > 3 ? " ..." : ""} Journey`
        : "Mapped Journey",
      description: `Auto-mapped from ${classifiedEvents.length} events across ${input.flows.length} screen(s). ${flowType ? `Detected flow type: ${flowType}.` : ""}`,
      steps: fullSteps,
      flowType,
    };

    // Step 7: Alternative journeys
    const alternativeJourneys = this.detectAlternativeJourneys(input, fullSteps);

    // Step 8: Drift check
    const driftSignals: string[] = [];
    if (input.learningMode !== "OFF") {
      const signals = await getActiveDriftSignals(domainId);
      for (const signal of signals) {
        driftSignals.push(
          `[${signal.occurrences} occurrences] ${signal.description}`
        );
      }
    }

    // Step 9: Conflicts detection
    const conflictsDetected: string[] = [];
    for (const rule of rules) {
      // Check if a high-confidence rule conflicts with current inference
      const matchingStep = fullSteps.find(
        (s) => normalizeForMatch(s.name) === normalizeForMatch(rule.appliesTo)
      );
      if (matchingStep && rule.type === "CLASSIFICATION") {
        const expectedKind = rule.pattern.match(/classified as (\w+)/i)?.[1]?.toUpperCase();
        if (expectedKind && expectedKind !== matchingStep.kind) {
          conflictsDetected.push(
            `Rule says "${rule.appliesTo}" should be ${expectedKind}, but current inference is ${matchingStep.kind}`
          );
        }
      }
    }

    return {
      primaryJourney,
      alternativeJourneys,
      classifiedEvents,
      gaps,
      learnedInsightsApplied,
      newLearnings: [],
      conflictsDetected,
      driftSignals,
    };
  },

  /* ─── 7. Learn from User Corrections ─── */

  async learnFromCorrections(
    domainId: string,
    generatedSteps: JourneyStep[],
    userEdited: UserEditedJourney,
    learningMode: "PASSIVE" | "ACTIVE"
  ): Promise<{ diffs: JourneyDiff[]; newLearnings: string[] }> {
    const diffs = detectJourneyDiffs(generatedSteps, userEdited);

    if (diffs.length === 0) {
      return { diffs: [], newLearnings: [] };
    }

    // Extract and store patterns
    const newLearnings = await extractAndStorePatterns(domainId, diffs);

    // Detect drift: repeated corrections to the same assumption
    const correctedNames = diffs.map((d) => d.stepName);
    const nameFrequency = new Map<string, number>();
    for (const name of correctedNames) {
      nameFrequency.set(name, (nameFrequency.get(name) ?? 0) + 1);
    }
    for (const [name, count] of nameFrequency) {
      if (count >= 2) {
        await recordDriftSignal(
          domainId,
          `repeated_correction_${normalizeForMatch(name)}`,
          `Step "${name}" was corrected ${count} times in a single edit — mapping logic for this event may be fundamentally wrong`
        );
      }
    }

    return { diffs, newLearnings };
  },
};

/* ─── Change Detection ─── */

function detectJourneyDiffs(
  generated: JourneyStep[],
  userEdited: UserEditedJourney
): JourneyDiff[] {
  const diffs: JourneyDiff[] = [];

  const genMap = new Map(generated.map((s) => [s.name, s]));
  const editedMap = new Map(userEdited.steps.map((s) => [s.name, s]));

  // Detect reorderings
  for (const editedStep of userEdited.steps) {
    const genStep = genMap.get(editedStep.name);
    if (genStep && genStep.order !== editedStep.order) {
      diffs.push({
        type: "REORDERED",
        stepName: editedStep.name,
        before: `order ${genStep.order}`,
        after: `order ${editedStep.order}`,
        significance: Math.abs(genStep.order - editedStep.order) > 2 ? "HIGH" : "MEDIUM",
      });
    }
  }

  // Detect kind changes
  for (const editedStep of userEdited.steps) {
    const genStep = genMap.get(editedStep.name);
    if (genStep && genStep.kind !== editedStep.kind) {
      diffs.push({
        type: "CHANGED_KIND",
        stepName: editedStep.name,
        before: genStep.kind,
        after: editedStep.kind,
        significance: "HIGH",
      });
    }
  }

  // Detect remapped events
  for (const editedStep of userEdited.steps) {
    const genStep = genMap.get(editedStep.name);
    if (!genStep) continue;

    if (genStep.behavioralEventId !== (editedStep.behavioralEventId ?? undefined)) {
      diffs.push({
        type: "REMAPPED_EVENT" as DiffType,
        stepName: editedStep.name,
        before: genStep.behavioralEventId ?? "none",
        after: editedStep.behavioralEventId ?? "none",
        significance: "HIGH",
      });
    }
  }

  // Detect removed steps
  for (const [name] of genMap) {
    if (!editedMap.has(name)) {
      diffs.push({
        type: "REMOVED_STEP",
        stepName: name,
        before: "present",
        after: "removed",
        significance: "MEDIUM",
      });
    }
  }

  // Detect added steps
  for (const [name] of editedMap) {
    if (!genMap.has(name)) {
      diffs.push({
        type: "ADDED_STEP",
        stepName: name,
        before: "absent",
        after: "added",
        significance: "MEDIUM",
      });
    }
  }

  return diffs;
}

/* ─── Helper: Find best parent step by naming ─── */

function findBestParentByNaming(
  appEventName: string,
  steps: JourneyStep[]
): JourneyStep | undefined {
  const norm = normalizeForMatch(appEventName);

  // Exact prefix match
  for (const step of steps) {
    const stepNorm = normalizeForMatch(step.name);
    if (norm.startsWith(stepNorm) || stepNorm.startsWith(norm)) {
      return step;
    }
  }

  // Partial overlap (shared prefix of significant length)
  let bestMatch: JourneyStep | undefined;
  let bestOverlap = 0;
  for (const step of steps) {
    const stepNorm = normalizeForMatch(step.name);
    const overlap = sharedPrefixLength(norm, stepNorm);
    if (overlap > bestOverlap && overlap >= 6) {
      bestOverlap = overlap;
      bestMatch = step;
    }
  }

  return bestMatch;
}

function sharedPrefixLength(a: string, b: string): number {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
}
