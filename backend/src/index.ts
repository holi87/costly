import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { config } from "./config.js";
import prisma from "./db.js";
import categoriesRoutes from "./routes/categories.js";
import expensesRoutes from "./routes/expenses.js";
import importExportRoutes from "./routes/import-export.js";

const app = Fastify({
  logger: true,
});

await app.register(cors, { origin: true });
await app.register(multipart);

await app.register(categoriesRoutes);
await app.register(expensesRoutes);
await app.register(importExportRoutes);

app.addHook("onClose", async () => {
  await prisma.$disconnect();
});

app.get("/api/health", async () => {
  return { status: "ok" };
});

try {
  await app.listen({ port: config.PORT, host: "0.0.0.0" });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
