import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth-types";

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.email) return null;
  const u = session.user as { id?: string; email?: string; name?: string; role?: string };
  return {
    id: u.id ?? "",
    name: u.name ?? null,
    email: u.email ?? "",
    role: (u.role as SessionUser["role"]) ?? "PRODUCT_MANAGER",
  };
}
