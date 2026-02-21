import PostgresClient from "@blc/postgres-client";

const pgConfig = {
  host: process.env.POSTGRES_HOST || "localhost",
  port: Number(process.env.POSTGRES_PORT) || 5432,
  user: process.env.POSTGRES_USER || "blc",
  password: process.env.POSTGRES_PASSWORD || "blc",
  database: process.env.POSTGRES_DB || "blc",
};

export const pgClient = new PostgresClient(pgConfig);


