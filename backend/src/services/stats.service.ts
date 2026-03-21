import { Prisma } from "@prisma/client";
import prisma from "../db.js";
import type { StatsQuery } from "../schemas/expense.js";

export async function getStats(query: StatsQuery) {
  const where: Prisma.ExpenseWhereInput = {};
  if (query.from || query.to) {
    where.date = {};
    if (query.from) where.date.gte = new Date(query.from);
    if (query.to) where.date.lte = new Date(query.to);
  }

  const [aggregate, byCategory, byMonth] = await Promise.all([
    prisma.expense.aggregate({
      where,
      _sum: { amount: true },
      _count: true,
    }),
    prisma.expense.groupBy({
      by: ["categoryId"],
      where,
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: "desc" } },
    }),
    prisma.$queryRaw<Array<{ month: string; total: Prisma.Decimal; count: bigint }>>`
      SELECT
        to_char(date, 'YYYY-MM') AS month,
        SUM(amount) AS total,
        COUNT(*)::bigint AS count
      FROM "Expense"
      ${query.from ? Prisma.sql`WHERE date >= ${new Date(query.from)}` : Prisma.empty}
      ${query.from && query.to ? Prisma.sql`AND date <= ${new Date(query.to)}` : !query.from && query.to ? Prisma.sql`WHERE date <= ${new Date(query.to)}` : Prisma.empty}
      GROUP BY month
      ORDER BY month
    `,
  ]);

  const categories = await prisma.category.findMany({
    where: { id: { in: byCategory.map((c) => c.categoryId) } },
    select: { id: true, name: true, icon: true, color: true },
  });
  const catMap = new Map(categories.map((c) => [c.id, c]));

  return {
    total: aggregate._sum.amount?.toFixed(2) ?? "0.00",
    count: aggregate._count,
    byCategory: byCategory.map((c) => {
      const cat = catMap.get(c.categoryId);
      return {
        categoryId: c.categoryId,
        categoryName: cat?.name ?? "",
        categoryIcon: cat?.icon ?? null,
        categoryColor: cat?.color ?? null,
        total: c._sum.amount?.toFixed(2) ?? "0.00",
        count: c._count,
      };
    }),
    byMonth: byMonth.map((m) => ({
      month: m.month,
      total: Number(m.total).toFixed(2),
      count: Number(m.count),
    })),
  };
}
