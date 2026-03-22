import { dedent } from "./gen/gen_help.js"

export type GenerateSummaryOptions = {
  useFakeResponse: boolean;
  saveSummaryToDb: boolean;
  saveLLMResponse: boolean;
  displayTokenUsageEstimates: boolean;
  displayTokenUsageActual: boolean;
  developerPrompt: string;
  modelName: string;
};

export const DEFAULT_GENERATE_SUMMARY_OPTIONS: GenerateSummaryOptions = {
  useFakeResponse: true,
  saveSummaryToDb: false,
  saveLLMResponse: false,
  displayTokenUsageEstimates: false,
  displayTokenUsageActual: false,

  modelName: "gpt-5-mini",
  developerPrompt: dedent(`
    Write a concise BTC/USD price action summary.
    3-5 sentences. No predictions. No advice. Use only provided values.
  `),
};

export const DEFAULT_INTERVAL_OPTIONS = {
  summaryIntervalSeconds: 30, // 30 seconds
  spikeIntervalSeconds: 12, // 12 seconds
  priceSpikeThreshold: 0.03, // 3%
  volumeSpikeMultiplier: 3,  // 3x average
};

export const REGULAR_INTERVAL_CANDLES = 30;
