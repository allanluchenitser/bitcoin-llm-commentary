const summaryRules = `
- State net direction using price.change and price.changePct.
- Mention high/low and overall range.
- Comment on volume.
- Optionally reference candleCounts to describe buying vs selling pressure.`;

const spikeRules = `
- Focus on describing the spike characteristics and potential implications.
- Highlight the magnitude of the price change and / or volume spike.
- Avoid making predictions or giving advice.`;

export default {
  summaryRules,
  spikeRules
}