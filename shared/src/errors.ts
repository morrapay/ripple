// ═══════════════════════════════════════════════════════════════
// errors.ts — Standard error shapes for the Ripple API
//
// BOTH Cursor (backend) and Lovable (frontend) MUST use these
// types when producing or consuming error responses.
//
// BREAKING CHANGES:
//   - Removing a field from ApiError
//   - Changing `code` from a string union to something else
//   - Renaming `message` or `fieldErrors`
//
// NON-BREAKING:
//   - Adding new values to ErrorCode
//   - Adding optional fields to ApiError
// ═══════════════════════════════════════════════════════════════

/**
 * Machine-readable error codes.
 * Frontend may switch on these to decide how to render errors.
 * Backend MUST return one of these — never a free-form string.
 */
export type ErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CONFLICT"
  | "INTERNAL_ERROR";

/**
 * Standard error body returned by every failing API response.
 *
 * Lovable can assume:
 *   - `code` is always present and is one of ErrorCode
 *   - `message` is always a human-readable string (safe to display)
 *   - `fieldErrors` is only present when code === "VALIDATION_ERROR"
 */
export interface ApiError {
  /** Machine-readable error code — use this for branching logic */
  code: ErrorCode;

  /** Human-readable description — safe to show in a toast/banner */
  message: string;

  /**
   * Per-field validation errors, keyed by field name.
   * Only present when code === "VALIDATION_ERROR".
   * Each key maps to one or more error strings for that field.
   *
   * Example: { "name": ["Required"], "steps": ["At least one step is required"] }
   */
  fieldErrors?: Record<string, string[]>;
}

/**
 * Generic wrapper that every successful API response uses.
 *
 * Lovable can assume:
 *   - If HTTP status is 2xx, the body matches ApiResponse<T>
 *   - If HTTP status is 4xx/5xx, the body matches ApiError
 *   - `data` is always the shape described by the endpoint contract
 *
 * BREAKING CHANGE: Removing `data` or renaming it.
 * NON-BREAKING: Adding optional metadata fields alongside `data`.
 */
export interface ApiResponse<T> {
  data: T;
}
