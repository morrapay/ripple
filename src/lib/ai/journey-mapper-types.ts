/* ─── EventToJourneyMapper — Type Definitions ───────────────────────────
   Types for the intelligent journey mapping agent that constructs user
   journeys from mixed event data with classification, confidence scoring,
   and adaptive learning from user corrections.
   ──────────────────────────────────────────────────────────────────────── */

/* ─── Learning Mode ─── */

export type LearningMode = "OFF" | "PASSIVE" | "ACTIVE";

/* ─── Event Classification ─── */

export type EventClassification = "BEHAVIORAL" | "APPLICATION" | "HYBRID";

export interface ClassifiedEvent {
  eventId: string;
  eventName: string;
  eventType: string;
  description: string | null;
  classification: EventClassification;
  justification: string;
  properties?: Record<string, unknown>;
}

/* ─── Confidence ─── */

export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

export interface ConfidenceScore {
  level: ConfidenceLevel;
  reasoning: string;
}

/* ─── Application Event Role ─── */

export type ApplicationEventRole =
  | "STATE_CHANGE"
  | "VALIDATION"
  | "ASYNC_PROCESS"
  | "OUTCOME";

/* ─── Journey Step ─── */

export interface MappedApplicationEvent {
  eventId: string;
  eventName: string;
  role: ApplicationEventRole;
  confidence: ConfidenceScore;
  source: "LEARNED" | "INFERRED";
}

export interface JourneyStep {
  order: number;
  name: string;
  description: string;
  kind: "ACTION" | "SYSTEM_TRIGGER" | "COMMUNICATION" | "STATE";
  behavioralEventId?: string;
  applicationEvents: MappedApplicationEvent[];
  communicationPointName?: string;
  triggerEvent?: string;
  confidence: ConfidenceScore;
  source: "LEARNED" | "INFERRED";
}

/* ─── Journey Output ─── */

export interface MappedJourney {
  name: string;
  description: string;
  steps: JourneyStep[];
  flowType?: string;
}

export interface InstrumentationGap {
  type: "MISSING_EVENT" | "AMBIGUOUS_TRACKING" | "SUGGESTED_IMPROVEMENT";
  description: string;
  suggestion?: string;
}

export interface JourneyMapperOutput {
  primaryJourney: MappedJourney;
  alternativeJourneys: MappedJourney[];
  classifiedEvents: ClassifiedEvent[];
  gaps: InstrumentationGap[];
  learnedInsightsApplied: string[];
  newLearnings: string[];
  conflictsDetected: string[];
  driftSignals: string[];
}

/* ─── Input ─── */

export interface JourneyMapperInput {
  flows: {
    id: string;
    name: string;
    flowType: string;
  }[];
  behavioralEvents: {
    id: string;
    eventName: string;
    eventType: string;
    description: string | null;
  }[];
  applicationEvents: {
    id: string;
    eventName: string;
    eventType: string;
    description: string | null;
  }[];
  productContext?: string;
  knownFlows?: string[];
  learningMode: LearningMode;
}

/* ─── User-Edited Journey (for learning) ─── */

export interface UserEditedStep {
  id: string;
  order: number;
  name: string;
  kind: "ACTION" | "SYSTEM_TRIGGER" | "COMMUNICATION" | "STATE";
  behavioralEventId?: string | null;
  applicationEventId?: string | null;
  communicationPointName?: string | null;
}

export interface UserEditedJourney {
  journeyId: string;
  domainId: string;
  steps: UserEditedStep[];
}

/* ─── Learning Rules ─── */

export type RuleType =
  | "ORDERING"
  | "MAPPING"
  | "EXCLUSION"
  | "PARENT_CHILD"
  | "CLASSIFICATION"
  | "FLOW_TYPE";

export interface LearnedRule {
  id: string;
  domainId: string;
  pattern: string;
  appliesTo: string;
  type: RuleType;
  confidence: ConfidenceLevel;
  sourceType: "USER_CORRECTION" | "REPEATED_PATTERN" | "LOGICAL_SIGNAL";
  createdAt: Date;
  updatedAt: Date;
  correctionCount: number;
  active: boolean;
}

/* ─── Diff (generated vs. corrected) ─── */

export type DiffType =
  | "REORDERED"
  | "REMAPPED_EVENT"
  | "ADDED_STEP"
  | "REMOVED_STEP"
  | "CHANGED_KIND"
  | "CHANGED_PARENT";

export interface JourneyDiff {
  type: DiffType;
  stepName: string;
  before: string;
  after: string;
  significance: "HIGH" | "MEDIUM" | "LOW";
}
