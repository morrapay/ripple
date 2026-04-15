import { NextResponse } from "next/server";
import { listQuestionBankItems, listCategories } from "@/lib/services/question-bank";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") ?? undefined;

    const [questions, categories] = await Promise.all([
      listQuestionBankItems(category),
      listCategories(),
    ]);

    return NextResponse.json({ questions, categories });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch question bank" },
      { status: 500 }
    );
  }
}
