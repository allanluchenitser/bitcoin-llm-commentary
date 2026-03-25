import { dedent } from "./gen/gen_help.js"

export type GenerateSummaryOptions = {
  useFakeResponse: boolean;
  saveSummaryToDb: boolean;
  saveLLMResponse: boolean;
  displayTokenUsageEstimates: boolean;
  displayTokenUsageActual: boolean;
  maxSummaryCandles: number;
  developerPrompt: string;
  modelName: string;
};

export const DEFAULT_GENERATE_SUMMARY_OPTIONS: GenerateSummaryOptions = {
  useFakeResponse: true,
  saveSummaryToDb: false,
  saveLLMResponse: false,
  displayTokenUsageEstimates: false,
  displayTokenUsageActual: false,

  maxSummaryCandles: 30,

  modelName: "gpt-5-mini",
  developerPrompt: dedent(`
    Write a concise BTC/USD price action summary.
    3-5 sentences. No predictions. No advice. Use only provided values.
  `),
};

export const DEFAULT_INTERVAL_OPTIONS = {
  summaryEverySeconds: 30, // 30 seconds
  checkSpikeEverySeconds: 10, // 10 seconds
  summaryLookbackCandles: 30, // 30 candles (5 minutes of 10s candles)
  spikeLookbackCandles: 10, // 10 candles (1.5 minutes of 10s candles)
  priceSpikeThreshold: 0.03, // 3%
  volumeSpikeMultiplier: 3,  // 3x average
};

export const LLM_INTERVAL_CANDLES_SIZE = 30;
