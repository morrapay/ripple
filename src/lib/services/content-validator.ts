interface ContentFields {
  subject?: string;
  headline?: string;
  body?: string;
  ctaText?: string;
  ctaLink?: string;
}

interface ValidationWarning {
  field: string;
  message: string;
  severity: "warning" | "error";
}

const PLACEHOLDER_PATTERNS = [
  /\[NAME\]/i,
  /\[FIRST_?NAME\]/i,
  /lorem ipsum/i,
  /\{insert/i,
  /TODO/i,
  /PLACEHOLDER/i,
];

export function validateContent(
  content: ContentFields | null | undefined,
  channel?: string | null
): { warnings: ValidationWarning[] } {
  if (!content) return { warnings: [] };

  const warnings: ValidationWarning[] = [];
  const ch = channel?.toLowerCase();

  if (ch === "email") {
    if (content.subject && content.subject.length > 80) {
      warnings.push({ field: "subject", message: `Email subject is ${content.subject.length} chars (max 80)`, severity: "warning" });
    }
    if (content.body && content.body.length > 2000) {
      warnings.push({ field: "body", message: `Email body is ${content.body.length} chars (max 2000)`, severity: "warning" });
    }
  }

  if (ch === "sms") {
    if (content.body && content.body.length > 160) {
      warnings.push({ field: "body", message: `SMS body is ${content.body.length} chars (max 160)`, severity: "error" });
    }
    if (content.body && /<[a-z][\s\S]*>/i.test(content.body)) {
      warnings.push({ field: "body", message: "SMS body should not contain HTML", severity: "error" });
    }
  }

  if (ch === "push") {
    if (content.headline && content.headline.length > 50) {
      warnings.push({ field: "headline", message: `Push headline is ${content.headline.length} chars (max 50)`, severity: "warning" });
    }
    if (content.body && content.body.length > 178) {
      warnings.push({ field: "body", message: `Push body is ${content.body.length} chars (max 178)`, severity: "warning" });
    }
  }

  if (content.ctaLink && !/^https?:\/\//.test(content.ctaLink)) {
    warnings.push({ field: "ctaLink", message: "CTA link must start with http:// or https://", severity: "error" });
  }

  if (content.headline && !content.body) {
    warnings.push({ field: "body", message: "Body should not be empty when headline is set", severity: "warning" });
  }

  for (const field of ["subject", "headline", "body", "ctaText"] as const) {
    const val = content[field];
    if (val) {
      for (const pat of PLACEHOLDER_PATTERNS) {
        if (pat.test(val)) {
          warnings.push({ field, message: `Possible placeholder text detected: "${val.match(pat)?.[0]}"`, severity: "warning" });
          break;
        }
      }
    }
  }

  return { warnings };
}
