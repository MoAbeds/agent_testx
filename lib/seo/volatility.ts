export interface GscData {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  syncedAt: string;
}

export async function checkVolatility(siteId: string, currentData: GscData, previousData?: GscData | null) {
  if (!previousData) {
    return { 
      isVolatile: false, 
      dropPercentage: 0, 
      message: "Initial sync successful. Establishing baseline." 
    };
  }

  const clickDrop = previousData.clicks > 0 ? ((previousData.clicks - currentData.clicks) / previousData.clicks) * 100 : 0;
  const impressionDrop = previousData.impressions > 0 ? ((previousData.impressions - currentData.impressions) / previousData.impressions) * 100 : 0;

  // Use the max drop of the two main metrics
  const dropPercentage = Math.max(clickDrop, impressionDrop);

  // Simulated Public SEO Volatility (Mocking an external API like SEMrush Sensor)
  const publicVolatilityIndex = Math.random() * 10; // 0-10 scale
  const isMarketVolatile = publicVolatilityIndex > 7;

  const isVolatile = dropPercentage > 15 || (isMarketVolatile && dropPercentage > 5);

  let message = "Stability confirmed. Rankings are within normal variance.";
  if (isVolatile) {
    message = `ALGORITHM ALERT: ${dropPercentage.toFixed(2)}% drop detected. ${isMarketVolatile ? "Market-wide volatility detected." : "Possible site-specific penalty or glitch."}`;
  }

  return {
    isVolatile,
    dropPercentage,
    publicVolatilityIndex,
    isMarketVolatile,
    message
  };
}
