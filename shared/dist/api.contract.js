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
export {};
//# sourceMappingURL=api.contract.js.map