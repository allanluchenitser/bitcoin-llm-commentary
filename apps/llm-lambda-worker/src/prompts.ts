const summaryRules = `
- State net direction using price.change and price.changePct.
- Mention high/low and overall range.
- Comment on volume. If volume.spikeRatio >= 2 call it a “volume spike”; if >= 1.3 call it “elevated”; otherwise “steady”.
- Optionally reference candleCounts to describe buying vs selling pressure.`;

const spikeRules = `
- Focus on describing the spike characteristics and potential implications.
- Highlight the magnitude of the price change and volume spike.
- Avoid making predictions or giving advice.`;

export default {
  summaryRules,
  spikeRules
}