import { Prisma } from "@prisma/client";
import prisma from "../db.js";
import type {
  CreateExpenseInput,
  UpdateExpenseInput,
  ExpenseQuery,
} from "../schemas/expense.js";

const includeCategories = {
  categories: {
    include: {
      category: { select: { id: true, name: true, icon: true, color: true } },
    },
  },
} as const;

export async function getExpenses(query: ExpenseQuery) {
  const where: Prisma.ExpenseWhereInput = {};

  if (query.category) {
    const ids = query.category.split(",").map(Number).filter(Number.isFinite);
    if (ids.length > 0) {
      where.categories = { some: { categoryId: { in: ids } } };
    }
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
      include: includeCategories,
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
    include: includeCategories,
  });
  return expense ? formatExpense(expense) : null;
}

export async function createExpense(data: CreateExpenseInput) {
  const expense = await prisma.expense.create({
    data: {
      name: data.name,
      amount: new Prisma.Decimal(data.amount),
      supportAmount: data.supportAmount
        ? new Prisma.Decimal(data.supportAmount)
        : null,
      date: new Date(data.date),
      goal: data.goal,
      notes: data.notes,
      isPaid: data.isPaid ?? true,
      categories: {
        create: data.categoryIds.map((categoryId) => ({ categoryId })),
      },
    },
    include: includeCategories,
  });
  return formatExpense(expense);
}

export async function updateExpense(id: number, data: UpdateExpenseInput) {
  const updateData: Prisma.ExpenseUpdateInput = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.amount !== undefined)
    updateData.amount = new Prisma.Decimal(data.amount);
  if (data.supportAmount !== undefined)
    updateData.supportAmount = data.supportAmount
      ? new Prisma.Decimal(data.supportAmount)
      : null;
  if (data.date !== undefined) updateData.date = new Date(data.date);
  if (data.goal !== undefined) updateData.goal = data.goal;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.isPaid !== undefined) updateData.isPaid = data.isPaid;

  // Update categories: delete old, create new
  if (data.categoryIds !== undefined) {
    await prisma.expenseCategory.deleteMany({ where: { expenseId: id } });
    updateData.categories = {
      create: data.categoryIds.map((categoryId) => ({ categoryId })),
    };
  }

  const expense = await prisma.expense.update({
    where: { id },
    data: updateData,
    include: includeCategories,
  });
  return formatExpense(expense);
}

export async function deleteExpense(id: number) {
  return prisma.expense.delete({ where: { id } });
}

type ExpenseWithCategories = {
  id: number;
  name: string;
  amount: Prisma.Decimal;
  supportAmount: Prisma.Decimal | null;
  date: Date;
  notes: string | null;
  goal: string | null;
  isPaid: boolean;
  categories: Array<{
    category: { id: number; name: string; icon: string | null; color: string | null };
  }>;
  createdAt: Date;
  updatedAt: Date;
};

function formatExpense(expense: ExpenseWithCategories) {
  return {
    id: expense.id,
    name: expense.name,
    amount: expense.amount.toFixed(2),
    supportAmount: expense.supportAmount?.toFixed(2) ?? null,
    date: expense.date.toISOString().split("T")[0],
    notes: expense.notes,
    goal: expense.goal,
    isPaid: expense.isPaid,
    categories: expense.categories.map((ec) => ec.category),
    createdAt: expense.createdAt.toISOString(),
    updatedAt: expense.updatedAt.toISOString(),
  };
}
