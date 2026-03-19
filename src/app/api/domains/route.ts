import { NextRequest, NextResponse } from "next/server";
import { listDomains, createDomain } from "@/lib/services/domain";
import { createDomainSchema } from "@/lib/validations/domain";

export async function GET() {
  try {
    const domains = await listDomains();
    return NextResponse.json({ domains });
  } catch (err) {
    console.error(err);
    const errMsg = err instanceof Error ? err.message : String(err);
    const errName = err instanceof Error ? err.name : "";
    const isDbConfigError =
      errName === "PrismaClientInitializationError" ||
      errMsg.includes("DATABASE_URL") ||
      errMsg.includes("Environment variable not found");
    const userMessage = isDbConfigError
      ? "Database connection is not configured. Ensure DATABASE_URL is set in .env in the project root and restart the dev server."
      : "Failed to list domains";
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createDomainSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const domain = await createDomain(parsed.data);
    return NextResponse.json({ domain });
  } catch (err) {
    console.error(err);
    const errMsg = err instanceof Error ? err.message : String(err);
    const errName = err instanceof Error ? err.name : "";
    const isDbConfigError =
      errName === "PrismaClientInitializationError" ||
      errMsg.includes("DATABASE_URL") ||
      errMsg.includes("Environment variable not found");
    const userMessage = isDbConfigError
      ? "Database connection is not configured. Ensure DATABASE_URL is set in .env in the project root and restart the dev server." 
      : process.env.NODE_ENV === "development" ? errMsg : "Failed to create domain";
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
