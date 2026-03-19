
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

