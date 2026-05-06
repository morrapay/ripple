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
export {};
//# sourceMappingURL=events.schema.js.map