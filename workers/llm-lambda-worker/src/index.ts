import "@blc/env";
import OpenAI from "openai";

import { createRedisClient, type RedisClient } from "@blc/redis-client";
import { subscribeTickers } from "./subscribe.js";

console.log('LLM Lambda Worker starting...');

// console.log('LLM Lambda Worker connecting to redis...');
// const redis: RedisClient = createRedisClient();
// await redis.connect();

// console.log('LLM Lambda Worker connected to Redis.');
// subscribeTickers(redis)

console.log(process.env)

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error("OPENAI_API_KEY is not set in environment variables.");
  process.exit(1);
}

const client = new OpenAI({
  apiKey
});

const response = await client.responses.create({
    model: process.env.LLM_MODEL_NAME || "GPT-5 nano",
    input: "Write a one-sentence bedtime story about a unicorn."
});

console.log(response.output_text);


