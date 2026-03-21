import prisma from "../db.js";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../schemas/category.js";

export async function getCategories() {
  return prisma.category.findMany({
    include: { _count: { select: { expenses: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getCategoryById(id: number) {
  return prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { expenses: true } } },
  });
}

export async function createCategory(data: CreateCategoryInput) {
  return prisma.category.create({ data });
}

export async function updateCategory(id: number, data: UpdateCategoryInput) {
  return prisma.category.update({ where: { id }, data });
}

export async function deleteCategory(id: number) {
  const count = await prisma.expense.count({ where: { categoryId: id } });
  if (count > 0) {
    throw Object.assign(
      new Error("Cannot delete category with expenses"),
      { statusCode: 409 },
    );
  }
  return prisma.category.delete({ where: { id } });
}
