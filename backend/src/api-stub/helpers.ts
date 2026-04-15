import type { Response } from "express";
import type { ApiError, ApiResponse, PaginationMeta } from "@ripple/shared";

const STATUS_MAP: Record<ApiError["code"], number> = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
};

export function sendError(res: Response, error: ApiError): void {
  res.status(STATUS_MAP[error.code] ?? 500).json(error);
}

export function sendOk<T>(res: Response, data: T, status = 200): void {
  const body: ApiResponse<T> = { data };
  res.status(status).json(body);
}

export function paginate<T>(
  items: T[],
  page: number,
  pageSize: number,
): { data: T[]; pagination: PaginationMeta } {
  const p = Math.max(1, page);
  const ps = Math.min(100, Math.max(1, pageSize));
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / ps));
  const start = (p - 1) * ps;
  return {
    data: items.slice(start, start + ps),
    pagination: { page: p, pageSize: ps, total, totalPages },
  };
}
