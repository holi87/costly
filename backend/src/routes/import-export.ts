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
        ).trim();
        const notes = row["Uwagi"] ?? row["notes"];
        const goal = row["Cel"] ?? row["goal"];
        const supportRaw = row["Wsparcie"] ?? row["support"];

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

        const supportAmount = supportRaw
          ? parseFloat(String(supportRaw).replace(",", "."))
          : null;

        let date: Date;
        if (dateRaw instanceof Date) {
          date = dateRaw;
        } else if (typeof dateRaw === "number") {
          date = new Date((dateRaw - 25569) * 86400 * 1000);
        } else if (typeof dateRaw === "string" && dateRaw.match(/^\d{4}-\d{2}-\d{2}$/)) {
          date = new Date(dateRaw);
        } else {
          date = new Date();
        }

        // Support multiple categories separated by "|" or ";"
        const catNames = categoryRaw
          .split(/[|;]/)
          .map((s) => s.trim())
          .filter(Boolean);

        if (catNames.length === 0) {
          skipped++;
          errors.push(`Row ${i + 2}: no category`);
          continue;
        }

        const categoryIds: number[] = [];
        for (const cn of catNames) {
          let catId = catByName.get(cn.toLowerCase());
          if (!catId) {
            const cat = await prisma.category.create({ data: { name: cn } });
            catByName.set(cn.toLowerCase(), cat.id);
            catId = cat.id;
          }
          categoryIds.push(catId);
        }

        await prisma.expense.create({
          data: {
            name,
            amount: new Prisma.Decimal(amount.toFixed(2)),
            supportAmount:
              supportAmount != null && !isNaN(supportAmount)
                ? new Prisma.Decimal(supportAmount.toFixed(2))
                : null,
            date,
            notes: notes ? String(notes) : undefined,
            goal: goal ? String(goal) : undefined,
            categories: {
              create: categoryIds.map((categoryId) => ({ categoryId })),
            },
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
        categories: {
          include: { category: { select: { name: true, icon: true } } },
        },
      },
      orderBy: { date: "asc" },
    });

    const data = expenses.map((e, i) => ({
      Lp: i + 1,
      Nazwa: e.name,
      Kwota: parseFloat(e.amount.toString()),
      Wsparcie: e.supportAmount ? parseFloat(e.supportAmount.toString()) : "",
      Data: e.date.toISOString().split("T")[0],
      Kategoria: e.categories.map((ec) => ec.category.name).join(" | "),
      Status: e.isPaid ? "Zapłacone" : "Planowane",
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
