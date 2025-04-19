
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    connectionString: "postgresql://neondb_owner:npg_NcbmRdPE1l2k@ep-curly-flower-a4sxras7.us-east-1.aws.neon.tech/neondb?sslmode=require",
  },
});
