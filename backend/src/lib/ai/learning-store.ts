/* ─── Learning Store ─────────────────────────────────────────────────────
   Persistence layer for the EventToJourneyMapper's adaptive learning.
   Stores, retrieves, and manages learned rules and drift signals using
   the Prisma-backed LearnedRule and DriftSignal models.
   ──────────────────────────────────────────────────────────────────────── */

import { prisma } from "@/lib/prisma";
import type {
  LearnedRule,
  ConfidenceLevel,
  RuleType,
  JourneyDiff,
} from "./journey-mapper-types";

/* ─── Rule CRUD ─── */

export async function getActiveRules(domainId: string): Promise<LearnedRule[]> {
  const rules = await prisma.learnedRule.findMany({
    where: { domainId, active: true },
    orderBy: [
      { confidence: "desc" },
      { correctionCount: "desc" },
    ],
  });

  return rules.map(toLearnedRule);
}

export async function getAllRules(domainId: string): Promise<LearnedRule[]> {
  const rules = await prisma.learnedRule.findMany({
    where: { domainId },
    orderBy: { updatedAt: "desc" },
  });
  return rules.map(toLearnedRule);
}

export async function createRule(
  domainId: string,
  input: {
    pattern: string;
    appliesTo: string;
    type: RuleType;
    confidence: ConfidenceLevel;
    sourceType: "USER_CORRECTION" | "REPEATED_PATTERN" | "LOGICAL_SIGNAL";
  }
): Promise<LearnedRule> {
  const existing = await prisma.learnedRule.findFirst({
    where: {
      domainId,
      pattern: input.pattern,
      type: input.type as never,
    },
  });

  if (existing) {
    const updated = await prisma.learnedRule.update({
      where: { id: existing.id },
      data: {
        correctionCount: { increment: 1 },
        confidence: upgradeConfidence(
          existing.confidence as ConfidenceLevel,
          input.confidence
        ) as never,
        active: true,
      },
    });
    return toLearnedRule(updated);
  }

  const rule = await prisma.learnedRule.create({
    data: {
      domainId,
      pattern: input.pattern,
      appliesTo: input.appliesTo,
      type: input.type as never,
      confidence: input.confidence as never,
      sourceType: input.sourceType as never,
    },
  });
  return toLearnedRule(rule);
}

export async function deactivateRule(ruleId: string): Promise<void> {
  await prisma.learnedRule.update({
    where: { id: ruleId },
    data: { active: false },
  });
}

export async function lowerRuleConfidence(ruleId: string): Promise<void> {
  const rule = await prisma.learnedRule.findUnique({ where: { id: ruleId } });
  if (!rule) return;
  const current = rule.confidence as ConfidenceLevel;
  const lowered: ConfidenceLevel =
    current === "HIGH" ? "MEDIUM" : current === "MEDIUM" ? "LOW" : "LOW";
  await prisma.learnedRule.update({
    where: { id: ruleId },
    data: { confidence: lowered as never },
  });
}

/* ─── Drift Signals ─── */

export async function recordDriftSignal(
  domainId: string,
  pattern: string,
  description: string
): Promise<void> {
  const existing = await prisma.driftSignal.findFirst({
    where: { domainId, pattern, resolved: false },
  });

  if (existing) {
    await prisma.driftSignal.update({
      where: { id: existing.id },
      data: { occurrences: { increment: 1 } },
    });
  } else {
    await prisma.driftSignal.create({
      data: { domainId, pattern, description },
    });
  }
}

export async function getActiveDriftSignals(domainId: string) {
  return prisma.driftSignal.findMany({
    where: { domainId, resolved: false },
    orderBy: { occurrences: "desc" },
  });
}

export async function resolveDriftSignal(signalId: string): Promise<void> {
  await prisma.driftSignal.update({
    where: { id: signalId },
    data: { resolved: true },
  });
}

/* ─── Pattern Extraction from Diffs ─── */

export async function extractAndStorePatterns(
  domainId: string,
  diffs: JourneyDiff[]
): Promise<string[]> {
  const newLearnings: string[] = [];

  for (const diff of diffs) {
    const pattern = diffToPattern(diff);
    if (!pattern) continue;

    await createRule(domainId, {
      pattern: pattern.pattern,
      appliesTo: pattern.appliesTo,
      type: pattern.type,
      confidence: diff.significance === "HIGH" ? "MEDIUM" : "LOW",
      sourceType: "USER_CORRECTION",
    });

    newLearnings.push(pattern.pattern);
  }

  // Detect drift: if the same correction type happens repeatedly
  const reorderDiffs = diffs.filter((d) => d.type === "REORDERED");
  if (reorderDiffs.length >= 2) {
    await recordDriftSignal(
      domainId,
      "repeated_reordering",
      `User reordered ${reorderDiffs.length} steps — default ordering logic may need updating`
    );
  }

  const kindChangeDiffs = diffs.filter((d) => d.type === "CHANGED_KIND");
  if (kindChangeDiffs.length >= 2) {
    await recordDriftSignal(
      domainId,
      "repeated_kind_change",
      `User changed kind on ${kindChangeDiffs.length} steps — classification logic may need updating`
    );
  }

  return newLearnings;
}

/* ─── Helpers ─── */

function diffToPattern(diff: JourneyDiff): {
  pattern: string;
  appliesTo: string;
  type: RuleType;
} | null {
  switch (diff.type) {
    case "REORDERED":
      return {
        pattern: `"${diff.stepName}" should be ordered: ${diff.after} (was ${diff.before})`,
        appliesTo: diff.stepName,
        type: "ORDERING",
      };
    case "REMAPPED_EVENT":
      return {
        pattern: `"${diff.stepName}" maps to ${diff.after} (not ${diff.before})`,
        appliesTo: diff.stepName,
        type: "MAPPING",
      };
    case "CHANGED_KIND":
      return {
        pattern: `"${diff.stepName}" should be classified as ${diff.after} (not ${diff.before})`,
        appliesTo: diff.stepName,
        type: "CLASSIFICATION",
      };
    case "REMOVED_STEP":
      return {
        pattern: `"${diff.stepName}" should be excluded from journeys`,
        appliesTo: diff.stepName,
        type: "EXCLUSION",
      };
    case "CHANGED_PARENT":
      return {
        pattern: `"${diff.stepName}" belongs to ${diff.after} (not ${diff.before})`,
        appliesTo: diff.stepName,
        type: "PARENT_CHILD",
      };
    default:
      return null;
  }
}

function upgradeConfidence(
  current: ConfidenceLevel,
  incoming: ConfidenceLevel
): ConfidenceLevel {
  const rank: Record<ConfidenceLevel, number> = { LOW: 0, MEDIUM: 1, HIGH: 2 };
  return rank[incoming] > rank[current] ? incoming : current;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toLearnedRule(row: any): LearnedRule {
  return {
    id: row.id,
    domainId: row.domainId,
    pattern: row.pattern,
    appliesTo: row.appliesTo,
    type: row.type,
    confidence: row.confidence,
    sourceType: row.sourceType,
    correctionCount: row.correctionCount,
    active: row.active,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
