import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/get-session";
import type { SessionUser } from "@/lib/auth-types";

export async function requireAuth(): Promise<
  | { user: SessionUser; error?: never }
  | { user?: never; error: NextResponse }
> {
  const user = await getSessionUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }
  return { user };
}

export async function requireRole(
  ...roles: SessionUser["role"][]
): Promise<
  | { user: SessionUser; error?: never }
  | { user?: never; error: NextResponse }
> {
  const result = await requireAuth();
  if (result.error) return result;
  if (!roles.includes(result.user.role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return result;
}
