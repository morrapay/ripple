import { NextRequest, NextResponse } from "next/server";
import { getDomainById, updateDomain, deleteDomain } from "@/lib/services/domain";
import { updateDomainSchema } from "@/lib/validations/domain";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const domain = await getDomainById(id);
    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }
    return NextResponse.json({ domain });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch domain" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateDomainSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const domain = await updateDomain(id, parsed.data);
    return NextResponse.json({ domain });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update domain" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteDomain(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete domain" },
      { status: 500 }
    );
  }
}
