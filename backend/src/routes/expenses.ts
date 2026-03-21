import type { FastifyInstance } from "fastify";
import {
  createExpenseSchema,
  updateExpenseSchema,
  expenseQuerySchema,
  statsQuerySchema,
} from "../schemas/expense.js";
import * as expenseService from "../services/expense.service.js";
import { getStats } from "../services/stats.service.js";

export default async function expensesRoutes(app: FastifyInstance) {
  // Stats must be registered before :id to avoid conflict
  app.get("/api/expenses/stats", async (request, reply) => {
    const parsed = statsQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "Validation error",
        statusCode: 400,
        details: parsed.error.issues,
      });
    }
    return getStats(parsed.data);
  });

  app.get("/api/expenses", async (request, reply) => {
    const parsed = expenseQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "Validation error",
        statusCode: 400,
        details: parsed.error.issues,
      });
    }
    return expenseService.getExpenses(parsed.data);
  });

  app.get<{ Params: { id: string } }>(
    "/api/expenses/:id",
    async (request, reply) => {
      const id = parseInt(request.params.id, 10);
      const expense = await expenseService.getExpenseById(id);
      if (!expense) {
        return reply
          .status(404)
          .send({ error: "Expense not found", statusCode: 404 });
      }
      return expense;
    },
  );

  app.post("/api/expenses", async (request, reply) => {
    const parsed = createExpenseSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "Validation error",
        statusCode: 400,
        details: parsed.error.issues,
      });
    }
    try {
      const expense = await expenseService.createExpense(parsed.data);
      return reply.status(201).send(expense);
    } catch {
      return reply.status(400).send({
        error: "Invalid categoryId",
        statusCode: 400,
      });
    }
  });

  app.put<{ Params: { id: string } }>(
    "/api/expenses/:id",
    async (request, reply) => {
      const id = parseInt(request.params.id, 10);
      const parsed = updateExpenseSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "Validation error",
          statusCode: 400,
          details: parsed.error.issues,
        });
      }
      try {
        const expense = await expenseService.updateExpense(id, parsed.data);
        return expense;
      } catch {
        return reply
          .status(404)
          .send({ error: "Expense not found", statusCode: 404 });
      }
    },
  );

  app.delete<{ Params: { id: string } }>(
    "/api/expenses/:id",
    async (request, reply) => {
      const id = parseInt(request.params.id, 10);
      try {
        await expenseService.deleteExpense(id);
        return { message: "Expense deleted" };
      } catch {
        return reply
          .status(404)
          .send({ error: "Expense not found", statusCode: 404 });
      }
    },
  );
}
