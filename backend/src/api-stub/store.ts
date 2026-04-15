import type { Event } from "@ripple/shared";
import type { Journey } from "@ripple/shared";

// In-memory stores — reset on every server restart.

export const journeys = new Map<string, Journey>();
export const events = new Map<string, Event>();

let idCounter = 0;
export function nextId(): string {
  return `id_${++idCounter}_${Date.now().toString(36)}`;
}

export function now(): string {
  return new Date().toISOString();
}

// ─── Seed data so the frontend has something to render ────────

function seed() {
  const ts = now();

  const seedEvents: Event[] = [
    {
      id: nextId(), name: "checkout_started", displayName: "Checkout Started",
      category: "behavioral", status: "active",
      description: "Fires when the user initiates checkout",
      properties: ["cart_total", "currency", "item_count"],
      createdAt: ts, updatedAt: ts,
    },
    {
      id: nextId(), name: "payment_completed", displayName: "Payment Completed",
      category: "behavioral", status: "active",
      description: "Fires after a successful payment",
      properties: ["amount", "currency", "payment_method"],
      createdAt: ts, updatedAt: ts,
    },
    {
      id: nextId(), name: "account_verified", displayName: "Account Verified",
      category: "system", status: "active",
      description: "Fires when KYC verification passes",
      properties: ["verification_level"],
      createdAt: ts, updatedAt: ts,
    },
    {
      id: nextId(), name: "invoice_generated", displayName: "Invoice Generated",
      category: "system", status: "active",
      description: "Fires when a new invoice is created",
      properties: ["invoice_id", "amount", "due_date"],
      createdAt: ts, updatedAt: ts,
    },
    {
      id: nextId(), name: "profile_updated", displayName: "Profile Updated",
      category: "behavioral", status: "draft",
      description: "Fires when the user saves profile changes",
      properties: ["changed_fields"],
      createdAt: ts, updatedAt: ts,
    },
  ];

  for (const e of seedEvents) events.set(e.id, e);

  const sampleJourney: Journey = {
    id: nextId(),
    name: "Welcome Onboarding",
    description: "Guides new users through their first week",
    audience: "New sign-ups (< 7 days)",
    objective: "Activate users by completing profile and first transaction",
    status: "draft",
    steps: [
      {
        id: nextId(), name: "User signs up", description: null, order: 0,
        type: "event",
        config: { triggerEventName: "account_verified", filters: [] },
        createdAt: ts, updatedAt: ts,
      },
      {
        id: nextId(), name: "Wait 1 hour", description: "Give them time to explore", order: 1,
        type: "delay",
        config: { durationMinutes: 60 },
        createdAt: ts, updatedAt: ts,
      },
      {
        id: nextId(), name: "Send welcome email", description: null, order: 2,
        type: "communication",
        config: { channel: "email", templateId: "tmpl_welcome_v1", parameters: {} },
        createdAt: ts, updatedAt: ts,
      },
    ],
    createdAt: ts,
    updatedAt: ts,
  };
  journeys.set(sampleJourney.id, sampleJourney);
}

seed();
