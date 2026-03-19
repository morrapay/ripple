import { prisma } from "@/lib/prisma";

export interface QuestionBankEntry {
  id: string;
  question: string;
  category: string | null;
  dimension: string | null;
}

export async function listQuestionBankItems(
  category?: string
): Promise<QuestionBankEntry[]> {
  const where = category ? { category } : {};
  return prisma.questionBankItem.findMany({
    where,
    orderBy: [{ category: "asc" }, { question: "asc" }],
  });
}

export async function listCategories(): Promise<string[]> {
  const results = await prisma.questionBankItem.findMany({
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });
  return results
    .map((r) => r.category)
    .filter((c): c is string => c !== null);
}
