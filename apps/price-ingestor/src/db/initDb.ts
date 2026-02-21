import PostgresClient from "@blc/postgres-client";

const pgConfig = {
  host: process.env.PG_HOST || "localhost",
  port: Number(process.env.PG_PORT) || 5432,
  user: process.env.PG_USER || "blc",
  password: process.env.PG_PASSWORD || "blc",
  database: process.env.PG_DATABASE || "blc",
};

export const pgClient = new PostgresClient(pgConfig);


