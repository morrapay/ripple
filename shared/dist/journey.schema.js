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
export {};
//# sourceMappingURL=journey.schema.js.map