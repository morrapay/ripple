import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/get-session";
import { canManageUsers } from "@/lib/auth-types";

export async function POST(req: Request) {
  const currentUser = await getSessionUser();
  if (!currentUser || !canManageUsers(currentUser.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email, name, role } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "User already exists" }, { status: 409 });

  const tempPassword = Math.random().toString(36).slice(-10);
  const hash = await bcrypt.hash(tempPassword, 12);

  const user = await prisma.user.create({
    data: { email, name: name || null, password: hash, role: role || "PRODUCT_MANAGER" },
    select: { id: true, email: true, role: true },
  });

  return NextResponse.json({ user, tempPassword });
}
