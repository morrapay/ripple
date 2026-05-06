// ═══════════════════════════════════════════════════════════════
// journey.schema.ts — Journey and step contracts
//
// A Journey is an ordered sequence of Steps. Each step has a `type`
// that determines its `config` shape (discriminated union).
//
// This file is BACKEND-AGNOSTIC: no DB column types, no ORM imports.
// IDs are opaque strings. Timestamps are ISO 8601 strings.
//
// BREAKING CHANGES:
//   - Removing a field from Journey or JourneyStep
//   - Renaming a StepType value
//   - Changing the config shape for an existing StepType
//   - Removing a JourneyStatus value
//
// NON-BREAKING:
//   - Adding new StepType values (with a new config interface)
//   - Adding new JourneyStatus values
//   - Adding optional fields to Journey, JourneyStep, or any config
// ═══════════════════════════════════════════════════════════════

import type { EventFilterCondition } from "./events.schema";

// ─── Journey ──────────────────────────────────────────────────

/**
 * Lifecycle status of a journey.
 *
 * "draft"     — Under construction, not executing
 * "active"    — Live and processing users
 * "paused"    — Temporarily halted; can be resumed
 * "archived"  — Permanently stopped; read-only
 *
 * Lovable can assume:
 *   - Only "draft" journeys are editable (steps can be added/removed)
 *   - "active" journeys show a read-only view with live stats (future)
 *   - Status transitions are enforced server-side; the frontend
 *     does not need to validate transitions
 */
export type JourneyStatus = "draft" | "active" | "paused" | "archived";

/**
 * The communication channel a CommunicationStep sends through.
 *
 * Lovable can assume:
 *   - This list is exhaustive for MVP
 *   - New channels may be added in future (non-breaking)
 */
export type CommunicationChannel =
  | "email"
  | "sms"
  | "push"
  | "in_app"
  | "whatsapp"
  | "webhook";

/**
 * A Journey is the top-level orchestration object.
 *
 * Lovable can assume:
 *   - `id` is globally unique and stable
 *   - `steps` is ordered by `order` (ascending); the backend
 *     guarantees this ordering in responses
 *   - `steps` may be an empty array for a newly created journey
 *   - `createdAt` / `updatedAt` are ISO 8601 strings
 */
export interface Journey {
  id: string;
  name: string;
  description: string | null;

  /** Who enters this journey (free-text for MVP, structured later) */
  audience: string | null;

  /** Business goal for this journey */
  objective: string | null;

  status: JourneyStatus;

  /**
   * Ordered list of steps. Always sorted by `order` ascending.
   * Included in GET /api/journeys/:id responses.
   * Omitted in list responses (GET /api/journeys) to keep payloads small.
   */
  steps: JourneyStep[];

  /** ISO 8601 */
  createdAt: string;

  /** ISO 8601 */
  updatedAt: string;
}

/**
 * Summary shape returned in list endpoints.
 * Intentionally excludes `steps` to keep list payloads lightweight.
 *
 * Lovable can assume: this is the shape returned by GET /api/journeys.
 * To get steps, fetch the individual journey.
 */
export type JourneySummary = Omit<Journey, "steps">;

// ─── Steps ────────────────────────────────────────────────────

/**
 * Discriminant for the step union.
 * Determines which config shape is attached.
 *
 * "event"          — Waits for / is triggered by an application event
 * "delay"          — Pauses the journey for a fixed duration
 * "communication"  — Sends a message through a channel
 */
export type StepType = "event" | "delay" | "communication";

/** Base fields shared by every step regardless of type */
interface StepBase {
  id: string;

  /** Display name for the step in the canvas */
  name: string;

  description: string | null;

  /**
   * Position in the journey sequence (0-based, ascending).
   * The backend guarantees no gaps and no duplicates within a journey.
   */
  order: number;

  /** ISO 8601 */
  createdAt: string;

  /** ISO 8601 */
  updatedAt: string;
}

// ─── Step configs (discriminated by `type`) ───────────────────

/**
 * Config for an event-triggered step.
 *
 * Lovable can assume:
 *   - `triggerEventName` references an Event.name from GET /api/events
 *   - `filters` is always an array (possibly empty)
 *   - If filters is non-empty, ALL conditions must match (AND logic)
 */
export interface EventStepConfig {
  /** The event name that triggers this step (matches Event.name) */
  triggerEventName: string;

  /**
   * Optional conditions that further restrict when this step fires.
   * Evaluated as AND — all conditions must be true.
   */
  filters: EventFilterCondition[];
}

/**
 * Config for a delay step.
 *
 * Lovable can assume:
 *   - `durationMinutes` is always a positive integer
 *   - The backend enforces min=1, max=525600 (1 year)
 */
export interface DelayStepConfig {
  /** How many minutes to wait before proceeding to the next step */
  durationMinutes: number;
}

/**
 * Config for a communication step.
 *
 * Lovable can assume:
 *   - `channel` is always one of CommunicationChannel
 *   - `templateId` references a template managed elsewhere
 *   - `parameters` is an open key-value map for template variables;
 *     the frontend renders this as a simple key/value editor
 */
export interface CommunicationStepConfig {
  channel: CommunicationChannel;

  /** ID of the message template to use */
  templateId: string;

  /**
   * Template variable overrides.
   * Keys are variable names, values are strings.
   * Example: { "first_name": "{{user.firstName}}", "offer_code": "SPRING25" }
   */
  parameters: Record<string, string>;
}

/**
 * Discriminated union for journey steps.
 *
 * Switch on `type` to narrow the config:
 *   if (step.type === "event")          → step.config is EventStepConfig
 *   if (step.type === "delay")          → step.config is DelayStepConfig
 *   if (step.type === "communication")  → step.config is CommunicationStepConfig
 *
 * BREAKING CHANGE: Changing the config shape for an existing type.
 * NON-BREAKING: Adding a new StepType with a new config interface.
 */
export type JourneyStep =
  | (StepBase & { type: "event";         config: EventStepConfig })
  | (StepBase & { type: "delay";         config: DelayStepConfig })
  | (StepBase & { type: "communication"; config: CommunicationStepConfig });

// ─── Step creation payloads (what the frontend sends) ─────────

/**
 * Payload to create or update a step.
 * The frontend sends this; the backend validates and persists.
 *
 * Same discriminated union pattern as JourneyStep but without
 * server-generated fields (id, order, createdAt, updatedAt).
 *
 * Lovable can assume:
 *   - `order` is managed server-side; the frontend does NOT send it
 *   - `id` is generated server-side on create
 *   - On update, send only the fields that changed (all fields optional
 *     except `type` which is always required to resolve the config)
 */
export type StepInput =
  | { type: "event";         name: string; description?: string | null; config: EventStepConfig }
  | { type: "delay";         name: string; description?: string | null; config: DelayStepConfig }
  | { type: "communication"; name: string; description?: string | null; config: CommunicationStepConfig };
