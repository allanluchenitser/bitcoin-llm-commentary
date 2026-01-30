import dotenv from "dotenv";
import path from "node:path";

// assumes apps are launched from repo root. (workspaces)
dotenv.config({ path: path.resolve(process.cwd(), "infra/.env.local") });

