import { createClient } from "redis";;

export function createRedisClient() {
  const host = process.env.REDIS_HOST || "127.0.0.1";
  const port = process.env.REDIS_PORT || 6379;

  const client = createClient({
    url: `redis://${host}:${port}`,
    name: "price-ingestor-client",
  });

  client.on("connect", () => {
      console.log("[redis] client connected");
  });

  client.on("ready", () => {
      console.log("[redis] client ready");
  });

  client.on("error", (err) => {
      console.error("[redis] client error:", err);
  });

  client.on("end", () => {
      console.log("[redis] client disconnected");
  });

  // Graceful shutdown
  async function handleShutdown(signal: string) {
      console.log(`[redis] ${signal} received, disconnecting client...`);
      try {
        await client.quit();
        console.log('[redis] client disconnected');
      }
      catch {
        console.log('[redis] error during shutdown')
      }
      finally {
        process.exit(0);
      }
  }

  process.on("SIGINT", handleShutdown);
  process.on("SIGTERM", handleShutdown);

  return client;
}

export type RedisClient = ReturnType<typeof createRedisClient>;