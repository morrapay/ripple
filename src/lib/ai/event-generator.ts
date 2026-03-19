import type { GenerateEventsInput } from "./types";

/* ── EventGenerator Sub-Agent ─────────────────────────────────────────────
   Encapsulates the "Figma → Behavioral Events Mapping" agent prompt and
   applies its naming conventions, standard-property taxonomy, and
   classification rules to the inputs provided by the DataLayerInput form.
   ──────────────────────────────────────────────────────────────────────── */

export const EVENT_GENERATOR_SYSTEM_PROMPT = `
You are the EventGenerator agent. Your task is to analyze product screens 
and business questions to produce a structured event mapping.

## Naming Rules
- Event format: module_name_event_type  (all lowercase, underscores)
- Property names: lowercase with underscores
- Property values: Title Case with spaces

## Main Event Types
| Suffix           | When                                     |
|------------------|------------------------------------------|
| page_view        | User views any page / screen             |
| click            | Button clicks, link taps                 |
| submit           | Form submissions                         |
| field_change     | Dropdowns, radio-button selections       |
| popup            | Popup / modal appears                    |
| toast            | Success / error toast appears            |
| tooltip          | Tooltip is displayed                     |
| error_message    | Error message is shown                   |
| experiment_trigger | A/B experiment trigger point            |

## Standard Properties (include for every behavioral event)
event_name, event_time, hosted_application, module_name, module_state,
element_name, element_type, element_sub_name, sub_element_type,
element_value, element_previous_value, is_success, error_message

## Classification
- **Behavioral** → front-end user interactions for analytics
- **Application** → back-end / API-triggered events for Braze journeys, 
  segmentation, and business-logic measurement

## Desktop / Mobile
- Same behaviour → single row marked "(desktop + mobile)"
- Different behaviour → separate rows

## Quality Rules
- Only map what is explicitly described in the inputs
- Mark business-critical events
- Include trigger descriptions
`.trim();

/* ── Standard property catalogue ──────────────────────────────────────── */

export interface StandardProperty {
  name: string;
  value: string;
}

function standardPropsForBehavioral(
  eventName: string,
  moduleName: string,
  elementName: string,
  elementType: string,
  extra?: Record<string, string>
): StandardProperty[] {
  const props: StandardProperty[] = [
    { name: "event_name", value: eventName },
    { name: "event_time", value: "" },
    { name: "hosted_application", value: "My Account" },
    { name: "module_name", value: moduleName },
    { name: "module_state", value: "Stand Alone" },
    { name: "element_name", value: elementName },
    { name: "element_type", value: elementType },
  ];
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      props.push({ name: k, value: v });
    }
  }
  return props;
}

/* ── Helpers ──────────────────────────────────────────────────────────── */

function toSlug(text: string): string {
  return text
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .toLowerCase();
}

function toTitleCase(text: string): string {
  return text
    .split(/[\s_]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/* ── Enriched output types ────────────────────────────────────────────── */

export interface EnrichedBehavioralEvent {
  eventName: string;
  eventType: string;
  description: string;
  triggerDescription: string;
  businessCritical: boolean;
  platform: "desktop + mobile" | "desktop" | "mobile";
  figmaLink: string | null;
  comments: string | null;
  standardProperties: StandardProperty[];
  userProperties: string[];
  eventProperties: string[];
  screenIndex: number;
  stepNumber: number;
  stepName: string;
}

export interface EnrichedApplicationEvent {
  eventName: string;
  eventType: "API_TRIGGERED" | "OFFLINE_PROCESS";
  description: string;
  triggerDescription: string;
  businessCritical: boolean;
  platform: "desktop + mobile" | "desktop" | "mobile";
  comments: string | null;
  handshakeContext?: Record<string, unknown>;
  businessRationale?: Record<string, unknown>;
}

export interface EventGeneratorResult {
  behavioral: EnrichedBehavioralEvent[];
  application: EnrichedApplicationEvent[];
}

/* ── Agent names (used in UI) ─────────────────────────────────────────── */

/** Agent that maps screens/Figma flows → behavioral events */
export const SCREEN_EVENT_AGENT = "EventGenerator" as const;

/** Agent that maps business questions → application events */
export const BUSINESS_QUESTION_AGENT = "BusinessQuestionAgent" as const;

/* ── EventGenerator Agent ─────────────────────────────────────────────── */

export const EventGenerator = {
  name: SCREEN_EVENT_AGENT,
  systemPrompt: EVENT_GENERATOR_SYSTEM_PROMPT,

  async generate(input: GenerateEventsInput): Promise<EventGeneratorResult> {
    const behavioral: EnrichedBehavioralEvent[] = [];
    const application: EnrichedApplicationEvent[] = [];

    const MANDATORY_PROPS = [
      "client_event_time",
      "system_name",
      "page_url",
      "previous_page_url",
      "page_title",
      "page_path",
      "page_location",
      "page_domain",
    ];

    /* ── Behavioral events from screens (order = journey sequence) ───── */
    for (let i = 0; i < input.screens.length; i++) {
      const screen = input.screens[i];
      const slug = toSlug(screen.name);
      const moduleName = toTitleCase(screen.name);
      const stepNum = i + 1;

      behavioral.push({
        eventName: `${slug}_page_view`,
        eventType: "page_view",
        description: `Step ${stepNum}: User views the ${screen.name} screen`,
        triggerDescription: `Step ${stepNum} — User lands on ${screen.name} page (desktop + mobile)`,
        businessCritical: true,
        platform: "desktop + mobile",
        figmaLink: screen.figmaLink ?? null,
        comments: null,
        standardProperties: standardPropsForBehavioral(
          `${slug}_page_view`,
          moduleName,
          moduleName,
          "Page"
        ),
        userProperties: ["user_id", "platform", "geo_country"],
        eventProperties: [...MANDATORY_PROPS, "step_number", "step_name"],
        screenIndex: i,
        stepNumber: stepNum,
        stepName: screen.name,
      });

      behavioral.push({
        eventName: `${slug}_click`,
        eventType: "click",
        description: `Step ${stepNum}: User clicks primary CTA on ${screen.name}`,
        triggerDescription: `Step ${stepNum} — User clicks the main action button on ${screen.name} (desktop + mobile)`,
        businessCritical: false,
        platform: "desktop + mobile",
        figmaLink: screen.figmaLink ?? null,
        comments: null,
        standardProperties: standardPropsForBehavioral(
          `${slug}_click`,
          moduleName,
          "Primary CTA",
          "Button",
          { element_value: "Submit" }
        ),
        userProperties: ["user_id", "platform", "geo_country"],
        eventProperties: [...MANDATORY_PROPS, "step_number", "cta_label"],
        screenIndex: i,
        stepNumber: stepNum,
        stepName: screen.name,
      });

      behavioral.push({
        eventName: `${slug}_submit`,
        eventType: "submit",
        description: `Step ${stepNum}: User submits form on ${screen.name}`,
        triggerDescription: `Step ${stepNum} — User submits the form on ${screen.name} (desktop + mobile)`,
        businessCritical: true,
        platform: "desktop + mobile",
        figmaLink: screen.figmaLink ?? null,
        comments: null,
        standardProperties: standardPropsForBehavioral(
          `${slug}_submit`,
          moduleName,
          "Form",
          "Form",
          { is_success: "true" }
        ),
        userProperties: ["user_id", "platform", "geo_country"],
        eventProperties: [...MANDATORY_PROPS, "step_number", "form_name", "is_success"],
        screenIndex: i,
        stepNumber: stepNum,
        stepName: screen.name,
      });

      behavioral.push({
        eventName: `${slug}_error_message`,
        eventType: "error_message_view",
        description: `Step ${stepNum}: User encounters an error on ${screen.name}`,
        triggerDescription: `Step ${stepNum} — Error message is displayed on ${screen.name} (desktop + mobile)`,
        businessCritical: false,
        platform: "desktop + mobile",
        figmaLink: screen.figmaLink ?? null,
        comments: "Map only if error states are visible in the Figma",
        standardProperties: standardPropsForBehavioral(
          `${slug}_error_message`,
          moduleName,
          "Error Message",
          "Toast",
          { is_success: "false", error_message: "[Error Message]" }
        ),
        userProperties: ["user_id", "platform", "geo_country"],
        eventProperties: [
          ...MANDATORY_PROPS,
          "step_number",
          "error_message",
          "error_type",
          "error_code",
          "is_success",
        ],
        screenIndex: i,
        stepNumber: stepNum,
        stepName: screen.name,
      });
    }

    if (input.screens.length > 1) {
      const areaSlug = toSlug(input.screens[0].name);
      const areaName = toTitleCase(input.screens[0].name);

      behavioral.push({
        eventName: `${areaSlug}_tooltip`,
        eventType: "tooltip_view",
        description: "User hovers/taps a tooltip in the flow",
        triggerDescription: "User hovers over an info icon triggering a tooltip (desktop + mobile)",
        businessCritical: false,
        platform: "desktop + mobile",
        figmaLink: null,
        comments: "Only include if tooltips are visible in the mockups",
        standardProperties: standardPropsForBehavioral(
          `${areaSlug}_tooltip`,
          areaName,
          "Info Icon",
          "Tooltip"
        ),
        userProperties: ["user_id", "platform", "geo_country"],
        eventProperties: [...MANDATORY_PROPS, "tooltip_text"],
        screenIndex: -1,
        stepNumber: 0,
        stepName: "Flow-wide",
      });

      behavioral.push({
        eventName: `${areaSlug}_popup`,
        eventType: "popup_view",
        description: "A confirmation or info popup appears in the flow",
        triggerDescription: "Popup/modal is displayed to the user (desktop + mobile)",
        businessCritical: false,
        platform: "desktop + mobile",
        figmaLink: null,
        comments: "Only include if popups/modals are visible in the mockups",
        standardProperties: standardPropsForBehavioral(
          `${areaSlug}_popup`,
          areaName,
          "Popup",
          "Popup"
        ),
        userProperties: ["user_id", "platform", "geo_country"],
        eventProperties: [...MANDATORY_PROPS, "popup_title", "popup_action"],
        screenIndex: -1,
        stepNumber: 0,
        stepName: "Flow-wide",
      });
    }

    /* ── Application events from business questions ──────────────────── */
    for (const q of input.businessQuestions) {
      const slug = toSlug(q.slice(0, 50));
      const areaSlug =
        input.screens.length > 0
          ? toSlug(input.screens[0].name)
          : "domain";

      application.push({
        eventName: `${areaSlug}_${slug}`,
        eventType: "API_TRIGGERED",
        description: q,
        triggerDescription: `Backend event triggered when: ${q}`,
        businessCritical: true,
        platform: "desktop + mobile",
        comments: null,
        handshakeContext: { source: "business_question", domain: areaSlug },
        businessRationale: { question: q },
      });
    }

    /* ── Application events from communication intents ───────────────── */
    for (const intent of input.communicationIntents) {
      const slug = toSlug(intent.what.slice(0, 50));
      const areaSlug =
        input.screens.length > 0
          ? toSlug(input.screens[0].name)
          : "domain";

      const existing = application.find(
        (e) => e.eventName === `${areaSlug}_${slug}`
      );
      if (!existing) {
        application.push({
          eventName: `${areaSlug}_${slug}`,
          eventType: "API_TRIGGERED",
          description: `Trigger: ${intent.what} — When: ${intent.when} — Where: ${intent.where}`,
          triggerDescription: `Comm trigger: ${intent.what} fires when ${intent.when} via ${intent.where}`,
          businessCritical: true,
          platform: "desktop + mobile",
          comments: `Channel: ${intent.where}`,
          handshakeContext: {
            source: "communication_intent",
            channel: intent.where,
            timing: intent.when,
          },
          businessRationale: { communication: intent.what },
        });
      }
    }

    return { behavioral, application };
  },
};
