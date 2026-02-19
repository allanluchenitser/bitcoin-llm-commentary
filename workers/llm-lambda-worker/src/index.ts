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

// console.log(process.env)

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error("OPENAI_API_KEY is not set in environment variables.");
  process.exit(1);
}

const client = new OpenAI({
  apiKey
});

// const models = await client.models.list();
// for (const model of models.data) {
//   console.log(`Model: ${model.id}`);
// }

try {
  const response = await client.responses.create({
      model: process.env.LLM_MODEL_NAME || "gpt-5-nano",
      // reasoning: { effort: "low"},
      instructions: "Answer the question as concisely as possible.",
      input: "Please explain the concept of Bitcoin in simple terms.",
  });

  console.log(response.output_text);
}
catch (error) {
    console.error("Error creating response:", error);
    process.exit(0);
}

// console.log(response);


