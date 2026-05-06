export interface ApiError {
  error: string;
  fieldErrors?: Record<string, string[]>;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  type: "communication" | "journey" | "step" | "behavioral_event" | "application_event";
  id: string;
  name: string;
  description?: string;
  domainId: string;
  parentId?: string;
}
