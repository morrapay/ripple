import type { ApiResponse } from "./errors";
import type { Event } from "./events.schema";
import type { Journey, JourneySummary, JourneyStatus, StepInput } from "./journey.schema";
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
export interface ListJourneysRequest {
    query: PaginationParams & {
        /** Filter by journey status */
        status?: JourneyStatus;
        /** Free-text search across name and description */
        search?: string;
    };
}
export type ListJourneysResponse = PaginatedResponse<JourneySummary>;
export interface GetJourneyRequest {
    params: {
        id: string;
    };
}
export type GetJourneyResponse = ApiResponse<Journey>;
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
export interface DeleteJourneyRequest {
    params: {
        id: string;
    };
}
export type DeleteJourneyResponse = ApiResponse<{
    deleted: true;
}>;
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
//# sourceMappingURL=api.contract.d.ts.map