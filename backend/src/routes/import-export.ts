import type { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "../db.js";

const APP_NAME = "Koszty Budowy";
const APP_VERSION = "1.3.0";

// Accept the decimal strings we emit (e.amount.toFixed(2)), e.g. "1234.56".
// Bounded to Decimal(12,2): max 10 integer digits, 2 fractional — so an
// out-of-range amount is rejected by Zod up front instead of overflowing
// mid-transaction (which would abort the whole import).
const decimalString = z
  .string()
  .regex(/^\d{1,10}([.,]\d{1,2})?$/, "Invalid decimal amount");

const importCategorySchema = z.object({
  id: z.number().int(),
  name: z.string().min(1),
  icon: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  createdAt: z.string().optional(),
});

const importExpenseSchema = z.object({
  id: z.number().int().optional(),
  name: z.string().min(1),
  amount: decimalString,
  supportAmount: decimalString.nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  notes: z.string().nullable().optional(),
  goal: z.string().nullable().optional(),
  isPaid: z.boolean().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  categoryIds: z.array(z.number().int()),
});

const importSchema = z.object({
  mode: z.enum(["replace", "merge"]),
  payload: z.object({
    version: z.literal(1, {
      errorMap: () => ({ message: "Unsupported backup version (expected 1)" }),
    }),
    app: z.string().optional(),
    appVersion: z.string().optional(),
    exportedAt: z.string().optional(),
    categories: z.array(importCategorySchema),
    expenses: z.array(importExpenseSchema),
  }),
});

export default async function importExportRoutes(app: FastifyInstance) {
  app.get("/api/export/json", async (_request, reply) => {
    const [categories, expenses] = await Promise.all([
      prisma.category.findMany({ orderBy: { id: "asc" } }),
      prisma.expense.findMany({
        include: { categories: { select: { categoryId: true } } },
        orderBy: { id: "asc" },
      }),
    ]);

    const envelope = {
      version: 1,
      app: APP_NAME,
      appVersion: APP_VERSION,
      exportedAt: new Date().toISOString(),
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        color: c.color,
        createdAt: c.createdAt.toISOString(),
      })),
      expenses: expenses.map((e) => ({
        id: e.id,
        name: e.name,
        // toFixed(2) keeps monetary values at 2 dp ("500.00", not "500")
        // so amounts are string-stable across export round-trips.
        amount: e.amount.toFixed(2),
        supportAmount: e.supportAmount ? e.supportAmount.toFixed(2) : null,
        date: e.date.toISOString().split("T")[0],
        notes: e.notes,
        goal: e.goal,
        isPaid: e.isPaid,
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
        categoryIds: e.categories.map((ec) => ec.categoryId),
      })),
    };

    const filename = `koszty-budowy-backup-${new Date().toISOString().split("T")[0]}.json`;

    return reply
      .header("Content-Type", "application/json")
      .header("Content-Disposition", `attachment; filename="${filename}"`)
      .send(envelope);
  });

  app.post("/api/import/json", async (request, reply) => {
    // Validate the whole envelope BEFORE any DB write.
    const parsed = importSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: parsed.error.issues.map((i) => i.message).join("; "),
        statusCode: 400,
      });
    }

    const { mode, payload } = parsed.data;

    let imported = 0;
    let categoriesImported = 0;
    let skipped = 0;
    const errors: string[] = [];

    await prisma.$transaction(
      async (tx) => {
        if (mode === "replace") {
          await tx.expenseCategory.deleteMany();
          await tx.expense.deleteMany();
          await tx.category.deleteMany();
        }

        // Build a resolver: file category id -> db category id.
        // Match existing categories by name (case-insensitive), reuse or create.
        const existing = await tx.category.findMany();
        const dbIdByName = new Map(
          existing.map((c) => [c.name.toLowerCase(), c.id]),
        );
        const fileIdToDbId = new Map<number, number>();

        for (const cat of payload.categories) {
          const key = cat.name.toLowerCase();
          let dbId = dbIdByName.get(key);
          if (dbId === undefined) {
            const created = await tx.category.create({
              data: {
                name: cat.name,
                icon: cat.icon ?? null,
                color: cat.color ?? null,
              },
            });
            dbId = created.id;
            dbIdByName.set(key, dbId);
            categoriesImported++;
          }
          fileIdToDbId.set(cat.id, dbId);
        }

        for (let i = 0; i < payload.expenses.length; i++) {
          const exp = payload.expenses[i];
          try {
            // Resolve every category id BEFORE touching the DB so a bad id
            // never poisons the transaction (Postgres aborts on stmt error).
            const resolved: number[] = [];
            const unknown: number[] = [];
            for (const fid of exp.categoryIds) {
              const dbId = fileIdToDbId.get(fid);
              if (dbId === undefined) {
                unknown.push(fid);
              } else {
                resolved.push(dbId);
              }
            }

            if (resolved.length === 0) {
              skipped++;
              errors.push(
                `Expense "${exp.name}" (#${i + 1}): no resolvable category (unknown ids: ${unknown.join(", ") || "none"})`,
              );
              continue;
            }
            if (unknown.length > 0) {
              errors.push(
                `Expense "${exp.name}" (#${i + 1}): skipped unknown category ids: ${unknown.join(", ")}`,
              );
            }

            // De-duplicate resolved ids (file ids can collapse to one db id).
            const uniqueResolved = [...new Set(resolved)];

            await tx.expense.create({
              data: {
                name: exp.name,
                amount: new Prisma.Decimal(exp.amount.replace(",", ".")),
                supportAmount:
                  exp.supportAmount != null
                    ? new Prisma.Decimal(exp.supportAmount.replace(",", "."))
                    : null,
                // Parse the YYYY-MM-DD string as UTC midnight (matches the
                // export side, which uses toISOString()) so dates never shift.
                date: new Date(`${exp.date}T00:00:00Z`),
                notes: exp.notes ?? null,
                goal: exp.goal ?? null,
                isPaid: exp.isPaid ?? true,
                categories: {
                  create: uniqueResolved.map((categoryId) => ({ categoryId })),
                },
              },
            });
            imported++;
          } catch (err) {
            // Should only ever catch JS-level throws; DB errors are
            // pre-empted by the resolve-before-create checks above.
            skipped++;
            errors.push(
              `Expense "${exp.name}" (#${i + 1}): ${(err as Error).message}`,
            );
          }
        }
      },
      { timeout: 30000 },
    );

    return { imported, categoriesImported, skipped, errors };
  });
}
