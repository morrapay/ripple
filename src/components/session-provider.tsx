"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

const MOCK_SESSION: Session = {
  user: { id: "local", name: "Local User", email: "user@payoneer.com", role: "ADMIN" } as Session["user"] & { role: string },
  expires: "2099-01-01T00:00:00.000Z",
};

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider session={MOCK_SESSION}>
      {children}
    </NextAuthSessionProvider>
  );
}
