
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

const connectionString = "postgresql://neondb_owner:npg_NcbmRdPE1l2k@ep-curly-flower-a4sxras7.us-east-1.aws.neon.tech/neondb?sslmode=require";

export const pool = new Pool({ connectionString });
export const db = drizzle({ client: pool, schema });
