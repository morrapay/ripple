"use client";

import { useState, useCallback } from "react";

export interface AudienceRule {
  field: string;
  operator: "is" | "is not" | "in" | "not in";
  value: string | string[];
}

export interface AudienceCriteria {
  rules: AudienceRule[];
  custom: string;
}

const AUDIENCE_FIELDS: { value: string; label: string; multiValue: boolean; options?: string[] }[] = [
  {
    value: "userType",
    label: "User Type",
    multiValue: true,
    options: ["Individual", "Business", "Enterprise"],
  },
  {
    value: "country",
    label: "Country / Region",
    multiValue: true,
    options: [
      "United States", "United Kingdom", "Germany", "France", "Israel",
      "Canada", "Australia", "Philippines", "India", "Brazil", "Other",
    ],
  },
  {
    value: "accountStatus",
    label: "Account Status",
    multiValue: true,
    options: ["Active", "Verified", "Pending", "Suspended", "Closed"],
  },
  {
    value: "kycStatus",
    label: "KYC Status",
    multiValue: true,
    options: ["Approved", "Pending", "Not Started", "Rejected"],
  },
  {
    value: "registrationSegment",
    label: "Registration Segment",
    multiValue: true,
    options: ["Freelancer", "SMB", "Enterprise", "Marketplace", "Partner"],
  },
  {
    value: "productUsage",
    label: "Product / Feature",
    multiValue: true,
    options: ["Global Payment Service", "Mass Payout", "Billing Service", "Store", "Working Capital"],
  },
];

const SINGLE_OPERATORS: AudienceRule["operator"][] = ["is", "is not"];
const MULTI_OPERATORS: AudienceRule["operator"][] = ["in", "not in"];

function getFieldConfig(field: string) {
  return AUDIENCE_FIELDS.find((f) => f.value === field);
}

function emptyRule(): AudienceRule {
  return { field: AUDIENCE_FIELDS[0].value, operator: "is", value: "" };
}

interface RuleRowProps {
  rule: AudienceRule;
  onChange: (rule: AudienceRule) => void;
  onRemove: () => void;
}

function RuleRow({ rule, onChange, onRemove }: RuleRowProps) {
  const fieldConfig = getFieldConfig(rule.field);
  const isMulti = rule.operator === "in" || rule.operator === "not in";

  function handleFieldChange(field: string) {
    const config = getFieldConfig(field);
    const defaultOp: AudienceRule["operator"] = config?.multiValue ? "in" : "is";
    onChange({ field, operator: defaultOp, value: config?.multiValue ? [] : "" });
  }

  function handleOperatorChange(op: string) {
    const newOp = op as AudienceRule["operator"];
    const nowMulti = newOp === "in" || newOp === "not in";
    const wasMulti = Array.isArray(rule.value);
    let newValue: string | string[] = rule.value;
    if (nowMulti && !wasMulti) newValue = rule.value ? [rule.value as string] : [];
    if (!nowMulti && wasMulti) newValue = (rule.value as string[])[0] ?? "";
    onChange({ ...rule, operator: newOp, value: newValue });
  }

  function handleSingleValueChange(val: string) {
    onChange({ ...rule, value: val });
  }

  function handleMultiToggle(opt: string) {
    const current = Array.isArray(rule.value) ? rule.value : [];
    const next = current.includes(opt)
      ? current.filter((v) => v !== opt)
      : [...current, opt];
    onChange({ ...rule, value: next });
  }

  const selectedMulti = Array.isArray(rule.value) ? rule.value : [];
  const operators = fieldConfig?.multiValue
    ? [...MULTI_OPERATORS, ...SINGLE_OPERATORS]
    : [...SINGLE_OPERATORS, ...MULTI_OPERATORS];

  return (
    <div className="flex flex-col gap-2 p-3 rounded-lg bg-zinc-900 border border-zinc-800">
      <div className="flex items-center gap-2">
        <select
          value={rule.field}
          onChange={(e) => handleFieldChange(e.target.value)}
          className="input-field flex-1 text-xs"
        >
          {AUDIENCE_FIELDS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>

        <select
          value={rule.operator}
          onChange={(e) => handleOperatorChange(e.target.value)}
          className="input-field w-28 text-xs"
        >
          {operators.map((op) => (
            <option key={op} value={op}>{op}</option>
          ))}
        </select>

        <button
          onClick={onRemove}
          className="shrink-0 p-1.5 rounded hover:bg-zinc-800 text-zinc-600 hover:text-zinc-400 transition-colors"
          title="Remove rule"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Value input */}
      {!isMulti && fieldConfig?.options ? (
        <select
          value={rule.value as string}
          onChange={(e) => handleSingleValueChange(e.target.value)}
          className="input-field text-xs"
        >
          <option value="">Select value…</option>
          {fieldConfig.options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      ) : !isMulti ? (
        <input
          type="text"
          value={rule.value as string}
          onChange={(e) => handleSingleValueChange(e.target.value)}
          placeholder="Enter value…"
          className="input-field text-xs"
        />
      ) : fieldConfig?.options ? (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {fieldConfig.options.map((opt) => (
            <button
              key={opt}
              onClick={() => handleMultiToggle(opt)}
              className={`px-2 py-0.5 rounded-full border text-[11px] transition-all ${
                selectedMulti.includes(opt)
                  ? "bg-[var(--accent)]/20 border-[var(--accent)]/50 text-[var(--accent)]"
                  : "border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <input
          type="text"
          value={Array.isArray(rule.value) ? rule.value.join(", ") : ""}
          onChange={(e) =>
            onChange({
              ...rule,
              value: e.target.value.split(",").map((v) => v.trim()).filter(Boolean),
            })
          }
          placeholder="Comma-separated values…"
          className="input-field text-xs"
        />
      )}
    </div>
  );
}

interface AudienceCriteriaBuilderProps {
  value: AudienceCriteria;
  onChange: (value: AudienceCriteria) => void;
  compact?: boolean;
}

export function AudienceCriteriaBuilder({ value, onChange, compact = false }: AudienceCriteriaBuilderProps) {
  const updateRule = useCallback(
    (index: number, rule: AudienceRule) => {
      const rules = [...value.rules];
      rules[index] = rule;
      onChange({ ...value, rules });
    },
    [value, onChange]
  );

  const removeRule = useCallback(
    (index: number) => {
      const rules = value.rules.filter((_, i) => i !== index);
      onChange({ ...value, rules });
    },
    [value, onChange]
  );

  const addRule = useCallback(() => {
    onChange({ ...value, rules: [...value.rules, emptyRule()] });
  }, [value, onChange]);

  return (
    <div className={`space-y-3 ${compact ? "" : ""}`}>
      {value.rules.length === 0 && (
        <p className="text-xs text-zinc-600 italic py-1">No rules yet — add one below or describe the audience in the custom field.</p>
      )}

      {value.rules.map((rule, i) => (
        <div key={i}>
          {i > 0 && (
            <div className="flex items-center gap-2 my-2">
              <div className="flex-1 border-t border-zinc-800" />
              <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-wide">AND</span>
              <div className="flex-1 border-t border-zinc-800" />
            </div>
          )}
          <RuleRow
            rule={rule}
            onChange={(r) => updateRule(i, r)}
            onRemove={() => removeRule(i)}
          />
        </div>
      ))}

      <button
        onClick={addRule}
        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors py-1"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Add rule
      </button>

      <div className="pt-1 border-t border-zinc-800">
        <label className="block text-xs text-zinc-500 mb-1.5">Custom audience description</label>
        <textarea
          value={value.custom}
          onChange={(e) => onChange({ ...value, custom: e.target.value })}
          placeholder="Describe any additional targeting not captured by the rules above…"
          rows={compact ? 2 : 3}
          className="input-field text-xs resize-none w-full"
        />
      </div>
    </div>
  );
}

export function emptyAudienceCriteria(): AudienceCriteria {
  return { rules: [], custom: "" };
}

export function serializeAudience(criteria: AudienceCriteria) {
  return {
    audienceCriteria: criteria.rules.length > 0 ? criteria.rules : null,
    audienceCustom: criteria.custom.trim() || null,
  };
}

export function deserializeAudience(raw: {
  audienceCriteria?: unknown;
  audienceCustom?: string | null;
}): AudienceCriteria {
  return {
    rules: Array.isArray(raw.audienceCriteria) ? (raw.audienceCriteria as AudienceRule[]) : [],
    custom: raw.audienceCustom ?? "",
  };
}

/** Read-only summary pill list for compact views */
export function AudienceSummary({ criteria }: { criteria: AudienceCriteria }) {
  const hasCriteria = criteria.rules.length > 0 || criteria.custom.trim();
  if (!hasCriteria) {
    return <p className="text-xs text-zinc-600 italic">No audience defined</p>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {criteria.rules.map((rule, i) => {
        const fieldLabel = AUDIENCE_FIELDS.find((f) => f.value === rule.field)?.label ?? rule.field;
        const valLabel = Array.isArray(rule.value) ? rule.value.join(", ") : rule.value;
        return (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-[11px] text-zinc-300"
          >
            <span className="text-zinc-500">{fieldLabel}</span>
            <span className="text-zinc-600">{rule.operator}</span>
            <span>{valLabel}</span>
          </span>
        );
      })}
      {criteria.custom.trim() && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-[11px] text-zinc-400 italic">
          {criteria.custom.length > 40 ? criteria.custom.slice(0, 40) + "…" : criteria.custom}
        </span>
      )}
    </div>
  );
}
