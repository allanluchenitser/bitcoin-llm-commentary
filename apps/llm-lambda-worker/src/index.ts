import "@blc/env";
import OpenAI from "openai";

import { createRedisClient, type RedisClient } from "@blc/redis-client";
import { subscriberLLM } from "./subscribe/subscriberLLM.js";
import { OHLCV, OHLCVRow } from "@blc/contracts";

import { pgConfig } from "./db/config.js";
import { PostgresClient } from "@blc/postgres-client";

console.log('LLM Lambda Worker starting...');

const candleDataBuffer: OHLCV[] = [];
let pgClient: PostgresClient | null = null;
let redis: RedisClient | null = null;

try {
  redis = createRedisClient();
  await redis.connect();
  console.log('LLM Lambda Worker connected to Redis.');

  pgClient = new PostgresClient(pgConfig);
  console.log('LLM Lambda Worker initialized Postgres client.');

  await subscriberLLM(redis);
  console.log('LLM Lambda Worker subscribed to Redis channel for LLM tasks.');
}
catch (error) {
  console.error('Error initializing LLM Lambda Worker:', error);
  process.exit(1);
}

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
  /*
    roles:
    { role, content } // authority decreases in this order:

    - system: global premises

    // - developer: feature level premises. tool use rules.

    - user: the user's input
    - assistant: the assistant's response

    - tool: the tool's response

    { role, name, input }
    - function
  */
  const response = await client.responses.create({
      model: process.env.LLM_MODEL_NAME || "gpt-5-nano",
      // tools: [
      //     { type: "web_search" },
      // ],
      instructions: "Answer the question as concisely as possible.",

      // input: "Please explain the concept of Bitcoin in simple terms.",
      input: [
        {
          role: "user",
          content: "Please explain the concept of Bitcoin in simple terms."
        },
        {
          role: "developer",
          content: "The user is asking for a simple explanation of Bitcoin. Please provide a concise and easy-to-understand response."
        }
      ]
  });

  console.log(response.output_text);
}
catch (error) {
    console.error("Error creating response:", error);
    process.exit(1);
}



