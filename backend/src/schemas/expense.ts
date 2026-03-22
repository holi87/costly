import { z } from "zod";

const amountSchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "Invalid amount format")
  .refine((v) => parseFloat(v) > 0, "Amount must be greater than 0");

export const createExpenseSchema = z.object({
  name: z.string().min(1).max(200),
  amount: amountSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  categoryId: z.number().int().positive(),
  goal: z.string().max(500).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  isPaid: z.boolean().default(true),
});

export const updateExpenseSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  amount: amountSchema.optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional(),
  categoryId: z.number().int().positive().optional(),
  goal: z.string().max(500).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  isPaid: z.boolean().optional(),
});

export const expenseQuerySchema = z.object({
  category: z
    .union([z.string(), z.array(z.string()).transform((a) => a.join(","))])
    .optional(),
  isPaid: z.enum(["true", "false"]).optional(),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  search: z.string().optional(),
  sort: z.enum(["date", "amount", "name", "createdAt"]).default("date"),
  order: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export const statsQuerySchema = z.object({
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ExpenseQuery = z.infer<typeof expenseQuerySchema>;
export type StatsQuery = z.infer<typeof statsQuerySchema>;
