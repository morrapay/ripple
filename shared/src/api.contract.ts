// ═══════════════════════════════════════════════════════════════
// api.contract.ts — Typed API endpoint contracts
//
// This file defines the request/response shape for every API
// endpoint that the frontend (Lovable) calls and the backend
// (Cursor) implements.
//
// RULES:
//   - Every endpoint is an exported interface
//   - Lovable imports these types; it does NOT invent its own
//   - Cursor implements handlers that conform to these types
//   - If a shape needs to change, change it HERE first, then
//     update both sides
//
// BREAKING CHANGES:
//   - Removing or renaming an endpoint type
//   - Changing a response field from required to removed
//   - Changing a request field from optional to required
//   - Changing pagination shape (page/pageSize/total)
//
// NON-BREAKING:
//   - Adding a new endpoint type
//   - Adding optional fields to a request or response
//   - Adding new query filter options
// ═══════════════════════════════════════════════════════════════

import type { ApiResponse, ApiError } from "./errors";
import type { Event } from "./events.schema";
import type {
  Journey,
  JourneySummary,
  JourneyStatus,
  StepInput,
} from "./journey.schema";

// ─── Pagination ───────────────────────────────────────────────

/**
 * Pagination parameters sent by the frontend as query params.
 *
 * Lovable can assume:
 *   - `page` is 1-based (first page is 1, not 0)
 *   - `pageSize` defaults to 20 if omitted
 *   - Backend will clamp pageSize to [1, 100]
 */
export interface PaginationParams {
  /** 1-based page number. Defaults to 1. */
  page?: number;

  /** Items per page. Defaults to 20. Max 100. */
  pageSize?: number;
}

/**
 * Pagination metadata returned in every paginated response.
 *
 * Lovable can assume:
 *   - `total` is the total count BEFORE pagination
 *   - `page` and `pageSize` echo back what was requested
 *     (after clamping / defaulting)
 *   - `totalPages` = Math.ceil(total / pageSize)
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Generic paginated response wrapper.
 * List endpoints return this shape.
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// ═══════════════════════════════════════════════════════════════
// GET /api/journeys
// ═══════════════════════════════════════════════════════════════
//
// Lists all journeys for the current context (domain scoped
// server-side via auth). Returns summaries without steps.
//
// PURPOSE:
//   Used by the journey list/dashboard page. Lovable renders
//   cards or table rows from these summaries.
//
// LOVABLE CAN ASSUME:
//   - Response is always paginated, even if there's only one page
//   - Items are sorted by updatedAt descending by default
//   - `steps` is NOT included (use GET /api/journeys/:id for that)
//   - Filters are optional; omitting all returns everything
//
// BREAKING CHANGE:
//   Removing `status` or `name` from JourneySummary,
//   changing pagination shape.
// ═══════════════════════════════════════════════════════════════

export interface ListJourneysRequest {
  query: PaginationParams & {
    /** Filter by journey status */
    status?: JourneyStatus;

    /** Free-text search across name and description */
    search?: string;
  };
}

export type ListJourneysResponse = PaginatedResponse<JourneySummary>;

// ═══════════════════════════════════════════════════════════════
// GET /api/journeys/:id
// ═══════════════════════════════════════════════════════════════
//
// Fetches a single journey with all its steps.
//
// PURPOSE:
//   Used by the journey detail/canvas page. Lovable gets the
//   full journey including ordered steps to render the flow.
//
// LOVABLE CAN ASSUME:
//   - `steps` is always an array (empty for a new journey)
//   - Steps are sorted by `order` ascending
//   - Step `config` shape matches the step's `type`
//     (use the discriminated union to narrow)
//   - Returns 404 ApiError if the journey doesn't exist
//
// BREAKING CHANGE:
//   Removing `steps` from the response, changing step union shape.
// ═══════════════════════════════════════════════════════════════

export interface GetJourneyRequest {
  params: {
    id: string;
  };
}

export type GetJourneyResponse = ApiResponse<Journey>;

// ═══════════════════════════════════════════════════════════════
// POST /api/journeys
// ═══════════════════════════════════════════════════════════════
//
// Creates a new journey. Steps can be included in the initial
// payload or added later via PUT.
//
// PURPOSE:
//   Called when the user clicks "Create Journey" and submits
//   the creation form (name, audience, objective).
//
// LOVABLE CAN ASSUME:
//   - Response includes the created journey with its generated `id`
//   - `status` defaults to "draft" server-side
//   - `steps` defaults to [] if omitted
//   - `name` is the only required field
//   - Returns VALIDATION_ERROR if name is empty
//
// BREAKING CHANGE:
//   Making `audience` or `objective` required,
//   changing the response shape.
// ═══════════════════════════════════════════════════════════════

export interface CreateJourneyRequest {
  body: {
    /** Required. Display name for the journey. */
    name: string;

    description?: string | null;
    audience?: string | null;
    objective?: string | null;

    /**
     * Optional initial steps. If omitted, journey starts empty.
     * Order is inferred from array position (0-based).
     */
    steps?: StepInput[];
  };
}

export type CreateJourneyResponse = ApiResponse<Journey>;

// ═══════════════════════════════════════════════════════════════
// PUT /api/journeys/:id
// ═══════════════════════════════════════════════════════════════
//
// Full replacement update of a journey and its steps.
//
// PURPOSE:
//   Called when the user saves changes on the journey canvas.
//   The frontend sends the COMPLETE current state — the backend
//   replaces everything. This is intentionally PUT (not PATCH)
//   to avoid merge ambiguity with ordered step arrays.
//
// LOVABLE CAN ASSUME:
//   - The full step array replaces what's on the server
//     (steps not in the array are deleted)
//   - Step `order` is inferred from array position
//   - Existing step IDs are preserved; new steps (without id)
//     get server-generated IDs in the response
//   - Returns 404 if the journey doesn't exist
//   - Returns VALIDATION_ERROR for invalid step configs
//   - Only "draft" journeys can be fully updated;
//     "active" journeys return FORBIDDEN
//
// BREAKING CHANGE:
//   Switching to PATCH semantics, changing step identity rules.
// ═══════════════════════════════════════════════════════════════

export interface UpdateJourneyRequest {
  params: {
    id: string;
  };
  body: {
    name?: string;
    description?: string | null;
    audience?: string | null;
    objective?: string | null;
    status?: JourneyStatus;

    /**
     * The complete ordered list of steps.
     * Replaces the server-side step list entirely.
     * Array position determines step order.
     */
    steps?: StepInput[];
  };
}

export type UpdateJourneyResponse = ApiResponse<Journey>;

// ═══════════════════════════════════════════════════════════════
// DELETE /api/journeys/:id
// ═══════════════════════════════════════════════════════════════
//
// Permanently deletes a journey and all its steps.
//
// PURPOSE:
//   Called from the journey list or detail page when the user
//   confirms deletion.
//
// LOVABLE CAN ASSUME:
//   - Returns 204-equivalent (success with no data) on success
//   - Returns 404 if the journey doesn't exist
//   - Deletion is permanent and cascades to steps
//   - Active journeys CAN be deleted (the backend handles cleanup)
//
// BREAKING CHANGE:
//   Returning a body where none was expected, requiring
//   extra confirmation params.
// ═══════════════════════════════════════════════════════════════

export interface DeleteJourneyRequest {
  params: {
    id: string;
  };
}

export type DeleteJourneyResponse = ApiResponse<{ deleted: true }>;

// ═══════════════════════════════════════════════════════════════
// GET /api/events
// ═══════════════════════════════════════════════════════════════
//
// Lists all known event definitions. These are the events that
// can be used as triggers in journey steps.
//
// PURPOSE:
//   Used to populate the event picker dropdown when creating
//   or editing an event-type journey step.
//
// LOVABLE CAN ASSUME:
//   - Response is paginated
//   - Only "active" events are returned by default
//     (pass status=draft to include drafts, e.g. for admin views)
//   - Events are sorted by displayName ascending by default
//   - `properties` is always an array (used to show available
//     filter conditions in the step editor)
//
// BREAKING CHANGE:
//   Removing `name` or `properties` from Event,
//   changing pagination shape.
// ═══════════════════════════════════════════════════════════════

export interface ListEventsRequest {
  query: PaginationParams & {
    /** Filter by event category */
    category?: "behavioral" | "system";

    /** Filter by event status. Defaults to "active" if omitted. */
    status?: "draft" | "active" | "archived";

    /** Free-text search across name and displayName */
    search?: string;
  };
}

export type ListEventsResponse = PaginatedResponse<Event>;
