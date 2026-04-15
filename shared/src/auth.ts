import type { UserRole } from "./enums";

export interface SessionUser {
  id: string;
  name?: string | null;
  email: string;
  role: UserRole;
}

export const ROLE_PAGE_ACCESS: Record<UserRole, string[]> = {
  ADMIN: ["dashboard", "data-layer", "mapping", "communications", "preferences", "channels", "archive", "users"],
  MANAGER: ["dashboard", "data-layer", "mapping", "communications", "preferences", "channels", "archive", "users"],
  PRODUCT_MANAGER: ["dashboard", "data-layer", "mapping", "communications", "preferences", "channels", "archive"],
  ANALYST: ["dashboard", "data-layer", "mapping", "channels"],
  CONTENT_WRITER: ["dashboard", "communications", "preferences", "channels"],
};

export const ROLE_DEFAULT_PAGE: Record<UserRole, string> = {
  ADMIN: "dashboard",
  MANAGER: "dashboard",
  PRODUCT_MANAGER: "dashboard",
  ANALYST: "data-layer",
  CONTENT_WRITER: "communications",
};

export function canAccessPage(role: UserRole, page: string): boolean {
  return ROLE_PAGE_ACCESS[role]?.includes(page) ?? false;
}

export function canEditEvents(role: UserRole): boolean {
  return ["ADMIN", "MANAGER", "PRODUCT_MANAGER"].includes(role);
}

export function canManageUsers(role: UserRole): boolean {
  return ["ADMIN", "MANAGER"].includes(role);
}

export const ALL_ROLES: UserRole[] = ["ADMIN", "MANAGER", "PRODUCT_MANAGER", "ANALYST", "CONTENT_WRITER"];

export const ROLE_DISPLAY_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  PRODUCT_MANAGER: "Product Manager",
  ANALYST: "Analyst",
  CONTENT_WRITER: "Content Writer",
};

export const VIEW_AS_COOKIE = "viewAsRole";
export const VIEW_AS_STORAGE_KEY = "viewAsRole";
