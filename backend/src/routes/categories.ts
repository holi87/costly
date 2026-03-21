import type { FastifyInstance } from "fastify";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../schemas/category.js";
import * as categoryService from "../services/category.service.js";

export default async function categoriesRoutes(app: FastifyInstance) {
  app.get("/api/categories", async () => {
    return categoryService.getCategories();
  });

  app.post("/api/categories", async (request, reply) => {
    const parsed = createCategorySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "Validation error",
        statusCode: 400,
        details: parsed.error.issues,
      });
    }
    const category = await categoryService.createCategory(parsed.data);
    return reply.status(201).send(category);
  });

  app.put<{ Params: { id: string } }>(
    "/api/categories/:id",
    async (request, reply) => {
      const id = parseInt(request.params.id, 10);
      const parsed = updateCategorySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "Validation error",
          statusCode: 400,
          details: parsed.error.issues,
        });
      }
      try {
        const category = await categoryService.updateCategory(id, parsed.data);
        return category;
      } catch {
        return reply
          .status(404)
          .send({ error: "Category not found", statusCode: 404 });
      }
    },
  );

  app.delete<{ Params: { id: string } }>(
    "/api/categories/:id",
    async (request, reply) => {
      const id = parseInt(request.params.id, 10);
      try {
        await categoryService.deleteCategory(id);
        return { message: "Category deleted" };
      } catch (err: unknown) {
        const error = err as { statusCode?: number; message?: string };
        if (error.statusCode === 409) {
          return reply.status(409).send({
            error: error.message,
            statusCode: 409,
          });
        }
        return reply
          .status(404)
          .send({ error: "Category not found", statusCode: 404 });
      }
    },
  );
}
