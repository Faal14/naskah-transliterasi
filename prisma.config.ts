import "dotenv/config";
import { defineConfig } from "prisma/config";

// CLI Prisma (migrate, db seed) memakai koneksi langsung bila ada; aplikasi tetap
// membaca DATABASE_URL (pooler) lewat schema.prisma.
const datasourceUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!datasourceUrl) {
  throw new Error("Set DIRECT_URL atau DATABASE_URL");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts",
  },
  engine: "classic",
  datasource: {
    url: datasourceUrl,
  },
});