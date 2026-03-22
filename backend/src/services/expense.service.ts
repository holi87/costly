import { Prisma } from "@prisma/client";
import prisma from "../db.js";
import type {
  CreateExpenseInput,
  UpdateExpenseInput,
  ExpenseQuery,
} from "../schemas/expense.js";

const includeCategory = {
  category: { select: { id: true, name: true, icon: true, color: true } },
} as const;

export async function getExpenses(query: ExpenseQuery) {
  const where: Prisma.ExpenseWhereInput = {};

  if (query.category) {
    const ids = query.category.split(",").map(Number).filter(Number.isFinite);
    if (ids.length === 1) where.categoryId = ids[0];
    else if (ids.length > 1) where.categoryId = { in: ids };
  }
  if (query.isPaid !== undefined) {
    where.isPaid = query.isPaid === "true";
  }
  if (query.from || query.to) {
    where.date = {};
    if (query.from) where.date.gte = new Date(query.from);
    if (query.to) where.date.lte = new Date(query.to);
  }
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { notes: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: includeCategory,
      orderBy: { [query.sort]: query.order },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.expense.count({ where }),
  ]);

  return {
    data: data.map(formatExpense),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function getExpenseById(id: number) {
  const expense = await prisma.expense.findUnique({
    where: { id },
    include: includeCategory,
  });
  return expense ? formatExpense(expense) : null;
}

export async function createExpense(data: CreateExpenseInput) {
  const expense = await prisma.expense.create({
    data: {
      name: data.name,
      amount: new Prisma.Decimal(data.amount),
      date: new Date(data.date),
      categoryId: data.categoryId,
      goal: data.goal,
      notes: data.notes,
      isPaid: data.isPaid ?? true,
    },
    include: includeCategory,
  });
  return formatExpense(expense);
}

export async function updateExpense(id: number, data: UpdateExpenseInput) {
  const updateData: Prisma.ExpenseUpdateInput = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.amount !== undefined)
    updateData.amount = new Prisma.Decimal(data.amount);
  if (data.date !== undefined) updateData.date = new Date(data.date);
  if (data.categoryId !== undefined)
    updateData.category = { connect: { id: data.categoryId } };
  if (data.goal !== undefined) updateData.goal = data.goal;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.isPaid !== undefined) updateData.isPaid = data.isPaid;

  const expense = await prisma.expense.update({
    where: { id },
    data: updateData,
    include: includeCategory,
  });
  return formatExpense(expense);
}

export async function deleteExpense(id: number) {
  return prisma.expense.delete({ where: { id } });
}

function formatExpense(expense: {
  id: number;
  name: string;
  amount: Prisma.Decimal;
  date: Date;
  notes: string | null;
  goal: string | null;
  isPaid: boolean;
  categoryId: number;
  category: { id: number; name: string; icon: string | null; color: string | null };
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...expense,
    amount: expense.amount.toFixed(2),
    date: expense.date.toISOString().split("T")[0],
  };
}
