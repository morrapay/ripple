import type { AIProvider } from "./types";
import type {
  BehavioralEventSuggestion,
  ApplicationEventSuggestion,
  GenerateEventsInput,
  GenerateEventsResult,
} from "./types";

const MANDATORY_EVENT_PROPERTIES = [
  "client_event_time",
  "system_name",
  "page_url",
  "previous_page_url",
  "page_title",
  "page_path",
  "page_location",
  "page_domain",
];

export const mockAIProvider: AIProvider = {
  async generateBehavioralEventsFromAssets(
    flowNames: string[],
    flowTypes: ("HAPPY_FLOW" | "UNHAPPY_FLOW")[]
  ): Promise<BehavioralEventSuggestion[]> {
    const area = flowNames[0]?.toLowerCase().replace(/\s+/g, "_") ?? "flow";
    const suggestions: BehavioralEventSuggestion[] = [];

    if (flowTypes.includes("HAPPY_FLOW")) {
      suggestions.push(
        {
          eventName: `${area}_landing_page_view`,
          eventType: "page_view",
          description: "User views the landing page",
          userProperties: ["user_id", "platform", "geo_country"],
          eventProperties: [...MANDATORY_EVENT_PROPERTIES, "step_number", "step_name"],
        },
        {
          eventName: `${area}_primary_cta_click`,
          eventType: "click",
          description: "User clicks primary CTA",
          userProperties: ["user_id", "platform", "geo_country"],
          eventProperties: [...MANDATORY_EVENT_PROPERTIES, "step_number", "cta_label"],
        },
        {
          eventName: `${area}_form_submit`,
          eventType: "submit",
          description: "User submits the form",
          userProperties: ["user_id", "platform", "geo_country"],
          eventProperties: [...MANDATORY_EVENT_PROPERTIES, "step_number", "form_name"],
        }
      );
    }

    if (flowTypes.includes("UNHAPPY_FLOW")) {
      suggestions.push(
        {
          eventName: `${area}_error_message_view`,
          eventType: "error_message_view",
          description: "User sees an error message",
          userProperties: ["user_id", "platform", "geo_country"],
          eventProperties: [
            ...MANDATORY_EVENT_PROPERTIES,
            "step_number",
            "error_message",
            "error_type",
            "error_code",
          ],
        },
        {
          eventName: `${area}_validation_field_change`,
          eventType: "field_change",
          description: "User triggers field validation",
          userProperties: ["user_id", "platform", "geo_country"],
          eventProperties: [
            ...MANDATORY_EVENT_PROPERTIES,
            "step_number",
            "field_name",
            "validation_result",
          ],
        }
      );
    }

    return suggestions;
  },

  async generateApplicationEventsFromQuestions(
    businessQuestions: string[]
  ): Promise<ApplicationEventSuggestion[]> {
    if (businessQuestions.length === 0) return [];
    return businessQuestions.map((q, i) => {
      const sanitized = q.slice(0, 50).replace(/\s+/g, "_").toLowerCase();
      return {
        eventName: `business_question_${i + 1}_${sanitized}`,
        eventType: "API_TRIGGERED",
        description: q,
        handshakeContext: { source: "business_question" },
        businessRationale: { question: q },
      };
    });
  },

  async generateEventsUnified(
    input: GenerateEventsInput
  ): Promise<GenerateEventsResult> {
    const area =
      input.screens[0]?.name.toLowerCase().replace(/\s+/g, "_") ?? "domain";

    const behavioral: BehavioralEventSuggestion[] = [];
    const application: ApplicationEventSuggestion[] = [];

    for (const screen of input.screens) {
      const screenSlug = screen.name.toLowerCase().replace(/\s+/g, "_");
      behavioral.push(
        {
          eventName: `${screenSlug}_page_view`,
          eventType: "page_view",
          description: `User views the ${screen.name} screen`,
          userProperties: ["user_id", "platform", "geo_country"],
          eventProperties: [...MANDATORY_EVENT_PROPERTIES, "step_number", "step_name"],
        },
        {
          eventName: `${screenSlug}_primary_cta_click`,
          eventType: "click",
          description: `User clicks primary CTA on ${screen.name}`,
          userProperties: ["user_id", "platform", "geo_country"],
          eventProperties: [...MANDATORY_EVENT_PROPERTIES, "step_number", "cta_label"],
        }
      );
    }

    behavioral.push({
      eventName: `${area}_error_message_view`,
      eventType: "error_message_view",
      description: "User encounters an error in the flow",
      userProperties: ["user_id", "platform", "geo_country"],
      eventProperties: [
        ...MANDATORY_EVENT_PROPERTIES,
        "step_number",
        "error_message",
        "error_type",
        "error_code",
      ],
    });

    for (const q of input.businessQuestions) {
      const slug = q
        .slice(0, 40)
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .trim()
        .replace(/\s+/g, "_")
        .toLowerCase();
      application.push({
        eventName: `${area}_${slug}`,
        eventType: "API_TRIGGERED",
        description: q,
        handshakeContext: { source: "business_question", domain: area },
        businessRationale: { question: q },
      });
    }

    for (const intent of input.communicationIntents) {
      const slug = intent.what
        .slice(0, 40)
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .trim()
        .replace(/\s+/g, "_")
        .toLowerCase();
      const existing = application.find(
        (e) => e.eventName === `${area}_${slug}`
      );
      if (!existing) {
        application.push({
          eventName: `${area}_${slug}`,
          eventType: "API_TRIGGERED",
          description: `Trigger: ${intent.what} — When: ${intent.when} — Where: ${intent.where}`,
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
