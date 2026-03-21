import type { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";
import * as XLSX from "xlsx";
import prisma from "../db.js";

export default async function importExportRoutes(app: FastifyInstance) {
  app.post("/api/import/xlsx", async (request, reply) => {
    const file = await request.file();
    if (!file) {
      return reply
        .status(400)
        .send({ error: "No file uploaded", statusCode: 400 });
    }

    const buffer = await file.toBuffer();
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

    const categories = await prisma.category.findMany();
    const catByName = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const name = String(row["Nazwa"] ?? row["name"] ?? "").trim();
        const amountRaw = row["Koszt"] ?? row["amount"];
        const dateRaw = row["Data"] ?? row["date"];
        const categoryRaw = String(
          row["Kategoria"] ?? row["category"] ?? "",
        )
          .trim()
          .toLowerCase();
        const notes = row["Uwagi"] ?? row["notes"];
        const goal = row["Cel"] ?? row["goal"];

        if (!name || amountRaw === undefined) {
          skipped++;
          errors.push(`Row ${i + 2}: missing name or amount`);
          continue;
        }

        const amount = parseFloat(String(amountRaw).replace(",", "."));
        if (isNaN(amount) || amount <= 0) {
          skipped++;
          errors.push(`Row ${i + 2}: invalid amount`);
          continue;
        }

        let date: Date;
        if (dateRaw instanceof Date) {
          date = dateRaw;
        } else if (typeof dateRaw === "number") {
          // Excel serial date
          date = new Date((dateRaw - 25569) * 86400 * 1000);
        } else if (typeof dateRaw === "string" && dateRaw.match(/^\d{4}-\d{2}-\d{2}$/)) {
          date = new Date(dateRaw);
        } else {
          date = new Date();
        }

        let categoryId = catByName.get(categoryRaw);
        if (!categoryId && categoryRaw) {
          const cat = await prisma.category.create({
            data: { name: row["Kategoria"] as string ?? categoryRaw },
          });
          catByName.set(categoryRaw, cat.id);
          categoryId = cat.id;
        }
        if (!categoryId) {
          skipped++;
          errors.push(`Row ${i + 2}: no category`);
          continue;
        }

        await prisma.expense.create({
          data: {
            name,
            amount: new Prisma.Decimal(amount.toFixed(2)),
            date,
            categoryId,
            notes: notes ? String(notes) : undefined,
            goal: goal ? String(goal) : undefined,
          },
        });
        imported++;
      } catch (err) {
        skipped++;
        errors.push(`Row ${i + 2}: ${(err as Error).message}`);
      }
    }

    return { imported, skipped, errors };
  });

  app.get("/api/export/xlsx", async (_request, reply) => {
    const expenses = await prisma.expense.findMany({
      include: {
        category: { select: { name: true, icon: true } },
      },
      orderBy: { date: "asc" },
    });

    const data = expenses.map((e, i) => ({
      Lp: i + 1,
      Nazwa: e.name,
      Kwota: parseFloat(e.amount.toString()),
      Data: e.date.toISOString().split("T")[0],
      Kategoria: e.category.name,
      Cel: e.goal ?? "",
      Uwagi: e.notes ?? "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Wydatki");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return reply
      .header(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      )
      .header(
        "Content-Disposition",
        'attachment; filename="koszty-budowy.xlsx"',
      )
      .send(buffer);
  });
}
