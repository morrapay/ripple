export type BehavioralEventType =
  | "page_view"
  | "click"
  | "submit"
  | "field_change"
  | "error_message_view"
  | "tooltip_view"
  | "popup_view"
  | "experiment_trigger";

export interface BehavioralEventSuggestion {
  eventName: string;
  eventType: BehavioralEventType;
  description: string;
  userProperties: string[];
  eventProperties: string[];
}

export interface ApplicationEventSuggestion {
  eventName: string;
  eventType: "API_TRIGGERED" | "OFFLINE_PROCESS";
  description: string;
  handshakeContext?: Record<string, unknown>;
  businessRationale?: Record<string, unknown>;
}

export interface GenerateEventsInput {
  screens: { name: string; figmaLink?: string }[];
  businessQuestions: string[];
  communicationIntents: {
    what: string;
    when: string;
    where: string;
  }[];
}

export interface GenerateEventsResult {
  behavioral: BehavioralEventSuggestion[];
  application: ApplicationEventSuggestion[];
}

export interface AIProvider {
  generateBehavioralEventsFromAssets(
    flowNames: string[],
    flowTypes: ("HAPPY_FLOW" | "UNHAPPY_FLOW")[]
  ): Promise<BehavioralEventSuggestion[]>;

  generateApplicationEventsFromQuestions?(
    businessQuestions: string[]
  ): Promise<ApplicationEventSuggestion[]>;

  generateEventsUnified(
    input: GenerateEventsInput
  ): Promise<GenerateEventsResult>;
}

/* ── Re-export enriched types from EventGenerator ──────────────────────── */
export type {
  EnrichedBehavioralEvent,
  EnrichedApplicationEvent,
  EventGeneratorResult,
  StandardProperty,
} from "./event-generator";
