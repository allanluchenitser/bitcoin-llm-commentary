import { findUpSync } from "find-up";
import dotenv from "dotenv";
import path from "node:path";

/*  ------ grabs environment variables from monorepo root then infra/.env.local ------ */

const monorepoRoot = findUpSync(".monorepo-root", { cwd: import.meta.url });

if (!monorepoRoot) {
    throw new Error("Could not find the monorepo root (.monorepo-root). All you need is for the file to exist.");
}

const envPath = path.resolve(path.dirname(monorepoRoot), "infra/.env.local");

console.log(`Loading environment variables from ${envPath}`);
dotenv.config({ path: envPath });

