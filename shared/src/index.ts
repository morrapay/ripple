// ═══════════════════════════════════════════════════════════════
// @ripple/shared — Barrel export
//
// This is the single import point for all shared contracts.
// Both Cursor and Lovable import from "@ripple/shared".
//
// Usage:
//   import type { Journey, Event, ApiError } from "@ripple/shared";
//   import type { ListJourneysResponse } from "@ripple/shared";
// ═══════════════════════════════════════════════════════════════

export * from "./errors";
export * from "./events.schema";
export * from "./journey.schema";
export * from "./api.contract";
