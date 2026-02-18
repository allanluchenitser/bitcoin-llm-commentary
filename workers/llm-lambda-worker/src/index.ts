import { createRedisClient, type RedisClient } from "@blc/redis-client";

console.log('LLM Lambda Worker starting, connecting to Redis...');
const redis: RedisClient = createRedisClient();
await redis.connect();

console.log('LLM Lambda Worker connected to Redis.');

