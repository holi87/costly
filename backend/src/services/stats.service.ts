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

  // Build date filter SQL fragments
  const dateFilter = query.from || query.to
    ? Prisma.sql`${query.from ? Prisma.sql`AND e."date" >= ${new Date(query.from)}` : Prisma.empty}${query.to ? Prisma.sql` AND e."date" <= ${new Date(query.to)}` : Prisma.empty}`
    : Prisma.empty;

  const [aggregate, paidAggregate, plannedAggregate, supportAggregate, byCategory, byMonth] =
    await Promise.all([
      prisma.expense.aggregate({
        where,
        _sum: { amount: true },
        _count: true,
      }),
      prisma.expense.aggregate({
        where: { ...where, isPaid: true },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.expense.aggregate({
        where: { ...where, isPaid: false },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.expense.aggregate({
        where,
        _sum: { supportAmount: true },
      }),
      // Group by category through join table
      prisma.$queryRaw<
        Array<{ categoryId: number; total: Prisma.Decimal; count: bigint }>
      >`
        SELECT ec."categoryId", SUM(e."amount") AS total, COUNT(*)::bigint AS count
        FROM "ExpenseCategory" ec
        JOIN "Expense" e ON e."id" = ec."expenseId"
        WHERE 1=1 ${dateFilter}
        GROUP BY ec."categoryId"
        ORDER BY total DESC
      `,
      prisma.$queryRaw<
        Array<{ month: string; total: Prisma.Decimal; count: bigint }>
      >`
        SELECT
          to_char(date, 'YYYY-MM') AS month,
          SUM(amount) AS total,
          COUNT(*)::bigint AS count
        FROM "Expense" e
        WHERE 1=1 ${dateFilter}
        GROUP BY month
        ORDER BY month
      `,
    ]);

  const categoryIds = byCategory.map((c) => c.categoryId);
  const categories =
    categoryIds.length > 0
      ? await prisma.category.findMany({
          where: { id: { in: categoryIds } },
          select: { id: true, name: true, icon: true, color: true },
        })
      : [];
  const catMap = new Map(categories.map((c) => [c.id, c]));

  return {
    total: aggregate._sum.amount?.toFixed(2) ?? "0.00",
    count: aggregate._count,
    totalPaid: paidAggregate._sum.amount?.toFixed(2) ?? "0.00",
    countPaid: paidAggregate._count,
    totalPlanned: plannedAggregate._sum.amount?.toFixed(2) ?? "0.00",
    countPlanned: plannedAggregate._count,
    totalSupport: supportAggregate._sum.supportAmount?.toFixed(2) ?? "0.00",
    byCategory: byCategory.map((c) => {
      const cat = catMap.get(c.categoryId);
      return {
        categoryId: c.categoryId,
        categoryName: cat?.name ?? "",
        categoryIcon: cat?.icon ?? null,
        categoryColor: cat?.color ?? null,
        total: Number(c.total).toFixed(2),
        count: Number(c.count),
      };
    }),
    byMonth: byMonth.map((m) => ({
      month: m.month,
      total: Number(m.total).toFixed(2),
      count: Number(m.count),
    })),
  };
}
