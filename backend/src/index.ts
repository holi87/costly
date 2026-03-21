import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "./config.js";
import prisma from "./db.js";

const app = Fastify({
  logger: true,
});

await app.register(cors, {
  origin: true,
});

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
