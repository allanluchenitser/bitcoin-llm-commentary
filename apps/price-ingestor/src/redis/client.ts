import { createClient } from "redis";

function requiredNumber(name: string, value: string | undefined): number {
  if (!value) throw new Error(`Missing env var: ${name}`);
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`Env var ${name} must be a number`);
  return n;
}

export function createRedisClient() {
  const host = process.env.REDIS_HOST ?? "127.0.0.1";
  const port = process.env.REDIS_PORT
    ? requiredNumber("REDIS_PORT", process.env.REDIS_PORT)
    : 6379;

  // node-redis uses a URL form
  const url = `redis://${host}:${port}`;

  const client = createClient({ url });

  client.on("error", (err) => {
    // keep this noisy during early dev; you can route to your logger
    console.error("[redis] client error:", err);
  });

  return client;
}