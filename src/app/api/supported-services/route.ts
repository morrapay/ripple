import { NextRequest, NextResponse } from "next/server";
import {
  listSupportedServices,
  createSupportedServicesBulk,
} from "@/lib/services/supported-service";

export async function GET() {
  try {
    const services = await listSupportedServices();
    return NextResponse.json({ services });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch supported services" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items = Array.isArray(body.services)
      ? body.services
      : body.items ?? [body];
    const valid = items.filter(
      (x: unknown): x is { name: string; code: string } =>
        typeof x === "object" &&
        x !== null &&
        typeof (x as { name?: unknown }).name === "string" &&
        typeof (x as { code?: unknown }).code === "string"
    );
    if (valid.length === 0) {
      return NextResponse.json(
        { error: "Provide services array with { name, code }" },
        { status: 400 }
      );
    }
    await createSupportedServicesBulk(valid);
    const services = await listSupportedServices();
    return NextResponse.json({ services });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create supported services" },
      { status: 500 }
    );
  }
}
