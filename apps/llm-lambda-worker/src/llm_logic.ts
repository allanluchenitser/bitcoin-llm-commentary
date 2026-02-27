import { OpenAI } from "openai";
import { PostgresClient } from "@blc/postgres-client";
import { OHLCV } from "@blc/contracts";
import { SseClients} from "@blc/sse-client";

function buildPrompt(type: "regular" | "spike", candles: OHLCV[]): string {
  const interval = `${candles[0].ts} to ${candles[candles.length - 1].ts}`;
  const jsonData = JSON.stringify(candles, null, 2);
  return `
Summarize the price and volume movement for BTC/USD from ${interval}.
Here is the full OHLCV data for this interval:
${jsonData}
${type === "spike" ? "Note: There was a dramatic move in price or volume. Focus on explaining the spike." : ""}
Please provide a concise, insightful summary.
  `;
}

type GenerateSummaryParams = {
  type: "regular" | "spike",
  candles: OHLCV[],
  openaiClient: OpenAI,
  pgClient: PostgresClient,
  sseClients: SseClients
}

/* ------ generates, saves, and broadcasts summary via sse ------ */

export async function launchSummary({
  type,
  candles,
  openaiClient,
  pgClient,
  sseClients
}: GenerateSummaryParams) {
  const prompt = buildPrompt(type, candles);
  const response = await openaiClient.responses.create({
    model: process.env.LLM_MODEL_NAME || "gpt-5-nano",
    instructions: "Summarize price and volume movement concisely.",
    input: [{ role: "user", content: prompt }]
  });

  const commentaryObject = {
    summaryType: type,
    exchange: candles[0].exchange,
    symbol: candles[0].symbol,
    ts: candles[candles.length - 1].ts,
    commentary: response.output_text
  }

  try {
    await pgClient.insertLLMCommentary({
      ...commentaryObject,
      llmUsed: process.env.LLM_MODEL_NAME || "gpt-5-nano"
    });
  } catch (err) {
    console.error("Error inserting LLM commentary into Postgres:", err);
    return;
  }

  try {
    sseClients.messageAll("summary", {
      ...commentaryObject
    });
  } catch (err) {
    console.error("Error sending SSE summary message:", err);
  }
}