import { createClient } from "redis";;

export function createRedisClient() {
  const host = process.env.REDIS_HOST || "127.0.0.1";
  const port = process.env.REDIS_PORT || 6379;

  const client = createClient({
    url: `redis://${host}:${port}`
  });

  client.on("error", (err) => {
    console.error("[redis] client error:", err);
  });

  return client;
}

export type RedisClient = ReturnType<typeof createRedisClient>;