import type { SessionUser } from "@/lib/auth-types";

const GUEST_USER: SessionUser = {
  id: "local",
  name: "Local User",
  email: "user@payoneer.com",
  role: "ADMIN",
};

export async function getSessionUser(): Promise<SessionUser | null> {
  return GUEST_USER;
}
