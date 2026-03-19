
export type GenerateSummaryOptions = {
  useFakeResponse: boolean;
  saveSummaryToDb: boolean;
  saveLLMResponse: boolean;
  displayTokenUsageEstimates: boolean;
  displayTokenUsageActual: boolean;
  modelName: string;
};

export const DEFAULT_GENERATE_SUMMARY_OPTIONS: GenerateSummaryOptions = {
  useFakeResponse: true,
  saveSummaryToDb: false,
  saveLLMResponse: false,
  displayTokenUsageEstimates: false,
  displayTokenUsageActual: false,
  modelName: "gpt-5-mini",
};

export const DEFAULT_INTERVAL_OPTIONS = {
  summaryIntervalMinutes: 30,
  spikeIntervalMinutes: 10,
  priceSpikeThreshold: 0.03, // 3%
  volumeSpikeMultiplier: 3,  // 3x average
};

