/**
 * Parser for event mapping documents (CSV/TSV) in the format:
 * Business Critical | Event Type | Trigger + Event Description | Event Name | Event Property Name | Figma Link | Comments
 */

const VALID_EVENT_TYPES = [
  "page_view",
  "click",
  "submit",
  "field_change",
  "error_message_view",
  "error_message",
  "error",
  "tooltip_view",
  "tooltip",
  "popup_view",
  "popup",
  "toast",
  "experiment_trigger",
] as const;

function inferEventType(eventName: string): (typeof VALID_EVENT_TYPES)[number] {
  const lower = eventName.toLowerCase();
  if (lower.endsWith("_page_view")) return "page_view";
  if (lower.endsWith("_click")) return "click";
  if (lower.endsWith("_submit")) return "submit";
  if (lower.endsWith("_field_change")) return "field_change";
  if (lower === "error") return "error";
  if (lower.endsWith("_error_message") || lower.includes("error_message")) return "error_message_view";
  if (lower === "tooltip" || lower.endsWith("_tooltip")) return "tooltip";
  if (lower.endsWith("_tooltip")) return "tooltip_view";
  if (lower.endsWith("_popup")) return "popup_view";
  if (lower.endsWith("_toast")) return "toast";
  return "click";
}

/** Extract property names from Event Property Name block (event_name: x, event_time, etc.) */
function parseEventProperties(block: string): string[] {
  const props = new Set<string>();
  const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    const colonIdx = line.indexOf(":");
    const propName = colonIdx >= 0 ? line.slice(0, colonIdx).trim() : line;
    const clean = propName.replace(/[^a-zA-Z0-9_]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
    if (clean.length > 0) props.add(clean);
  }
  const base = ["event_name", "event_time", "hosted_application", "module_name"];
  for (const p of base) props.add(p);
  return Array.from(props);
}

export interface ParsedEventMappingRow {
  businessCritical: boolean;
  eventType: string;
  description: string;
  eventName: string;
  eventProperties: string[];
  figmaLink: string | null;
  comments: string | null;
}

export interface ParsedEventMapping {
  events: ParsedEventMappingRow[];
  errors: string[];
}

function parseRow(
  cells: string[],
  colMap: { businessCritical: number; eventType: number; description: number; eventName: number; eventProperties: number; figmaLink: number; comments: number }
): ParsedEventMappingRow | null {
  const eventName = (cells[colMap.eventName] ?? "").trim();
  if (!eventName) return null;

  const description = (cells[colMap.description] ?? "").trim();
  const propsBlock = (cells[colMap.eventProperties] ?? "").trim();
  const eventProperties = propsBlock ? parseEventProperties(propsBlock) : ["event_name", "event_time", "hosted_application", "module_name", "element_name", "element_type"];

  const businessCritical = /yes|true|1|✓|x/i.test((cells[colMap.businessCritical] ?? "").trim());
  const figmaLink = (cells[colMap.figmaLink] ?? "").trim() || null;
  const comments = (cells[colMap.comments] ?? "").trim() || null;

  return {
    businessCritical,
    eventType: "Behavioral",
    description: description || `Event: ${eventName}`,
    eventName,
    eventProperties,
    figmaLink,
    comments,
  };
}

/** Parse CSV/TSV with flexible column detection */
export function parseEventMappingDocument(text: string): ParsedEventMapping {
  const errors: string[] = [];
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return { events: [], errors: ["Document must have a header row and at least one data row."] };
  }

  const sep = lines[0].includes("\t") ? "\t" : lines[0].includes(";") ? ";" : ",";

  const parseCells = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') inQuotes = !inQuotes;
      else if (c === sep && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else current += c;
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseCells(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""));
  const findCol = (patterns: string[]): number => {
    for (const p of patterns) {
      const i = headers.findIndex((h) => p.split("|").some((alt) => h.includes(alt)));
      if (i >= 0) return i;
    }
    return -1;
  };

  const colMap = {
    businessCritical: findCol(["business_critical", "critical", "bc"]),
    eventType: findCol(["event_type", "type"]),
    description: findCol(["trigger", "description", "event_description"]),
    eventName: findCol(["event_name", "eventname", "event"]),
    eventProperties: findCol(["event_propert", "property", "properties", "props"]),
    figmaLink: findCol(["figma", "link"]),
    comments: findCol(["comments", "comment"]),
  };

  if (colMap.eventName < 0) {
    return { events: [], errors: ["Could not find 'Event Name' column. Expected columns: Business Critical, Event Type, Trigger + Event Description, Event Name, Event Property Name, Figma Link, Comments."] };
  }

  if (colMap.description < 0) colMap.description = colMap.eventName;
  if (colMap.eventProperties < 0) colMap.eventProperties = colMap.eventName + 1;
  if (colMap.businessCritical < 0) colMap.businessCritical = 0;
  if (colMap.eventType < 0) colMap.eventType = 1;
  if (colMap.figmaLink < 0) colMap.figmaLink = headers.length - 2;
  if (colMap.comments < 0) colMap.comments = headers.length - 1;

  const events: ParsedEventMappingRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCells(lines[i]);
    const row = parseRow(cells, colMap);
    if (row) events.push(row);
  }

  return { events, errors };
}

/** Convert parsed rows to CreateBehavioralEventInput format for API */
export function toBehavioralEventInputs(
  parsed: ParsedEventMappingRow[]
): Array<{ eventName: string; eventType: string; description?: string; eventProperties: string[]; figmaLink?: string | null; businessCritical?: boolean }> {
  return parsed.map((row) => ({
    eventName: row.eventName,
    eventType: inferEventType(row.eventName),
    description: row.description,
    eventProperties: row.eventProperties,
    figmaLink: row.figmaLink,
    businessCritical: row.businessCritical,
  }));
}
