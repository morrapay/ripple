// ═══════════════════════════════════════════════════════════════
// events.schema.ts — Application event contracts
//
// Events are the atoms of the Ripple domain. They represent things
// that happen in the product (user clicks, API calls, system triggers)
// and are referenced by journey steps as triggers.
//
// This file is BACKEND-AGNOSTIC: no DB column types, no ORM imports.
// IDs are opaque strings. Timestamps are ISO 8601 strings.
//
// BREAKING CHANGES:
//   - Removing a field from Event
//   - Changing EventCategory or EventStatus values
//   - Changing id from string to number
//
// NON-BREAKING:
//   - Adding new EventCategory values
//   - Adding optional fields to Event
//   - Adding new EventStatus values
// ═══════════════════════════════════════════════════════════════

/**
 * High-level event category.
 *
 * "behavioral" — Triggered by user interaction in the product
 *   (page views, clicks, form submissions, tooltip views, etc.)
 *
 * "system" — Triggered by backend processes
 *   (API responses, scheduled jobs, state transitions, webhooks)
 *
 * Lovable can assume: every event has exactly one of these categories.
 */
export type EventCategory = "behavioral" | "system";

/**
 * Lifecycle status of an event definition.
 *
 * "draft"    — Event is being defined, not yet usable in journeys
 * "active"   — Event is approved and can be used as a journey trigger
 * "archived" — Event is deprecated; existing references still work,
 *              but it cannot be selected for new steps
 *
 * Lovable can assume:
 *   - Only "active" events appear in the step trigger dropdown
 *   - "archived" events still render correctly if already in a journey
 */
export type EventStatus = "draft" | "active" | "archived";

/**
 * A single event definition.
 *
 * This is NOT a fired event instance — it's the schema/template
 * that describes what the event looks like. Think of it as the
 * event in a tracking plan.
 *
 * Lovable can assume:
 *   - `id` is globally unique and stable (never changes)
 *   - `name` is the machine-readable event name (e.g. "checkout_started")
 *   - `displayName` is the human-readable label (e.g. "Checkout Started")
 *   - `properties` lists the payload keys the event carries
 *   - `createdAt` / `updatedAt` are ISO 8601 strings
 */
export interface Event {
  id: string;

  /** Machine-readable event name — used in code and as trigger references */
  name: string;

  /** Human-friendly label for UI display */
  displayName: string;

  category: EventCategory;
  status: EventStatus;

  /** Optional longer description explaining when this event fires */
  description: string | null;

  /**
   * List of property names this event carries in its payload.
   * Example: ["product_id", "currency", "amount"]
   *
   * Lovable can assume: this is always an array (possibly empty).
   * These are display-only — the frontend does not need to validate payloads.
   */
  properties: string[];

  /** ISO 8601 */
  createdAt: string;

  /** ISO 8601 */
  updatedAt: string;
}

/**
 * Filter condition used in event-type journey steps.
 * Allows a step to only trigger when the event payload matches
 * certain criteria (e.g. "currency equals USD").
 *
 * Lovable can assume:
 *   - `property` is one of the event's `properties`
 *   - `operator` / `value` are always present together
 */
export interface EventFilterCondition {
  /** Name of the event property to filter on */
  property: string;

  operator: "equals" | "not_equals" | "contains" | "gt" | "lt" | "gte" | "lte";

  /** The comparison value — always serialized as a string */
  value: string;
}
