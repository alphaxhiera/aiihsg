import { StockData, IHSGMarketData, CandleData } from '../types';
import { getMarketInfo, generateTradingDayDates, formatIndoDate } from '../utils/marketTime';

// Current market info based on Jakarta / WIB timezone
export const currentMarketInfo = getMarketInfo();

// Helper to generate realistic candles aligned to latest trading day
function generateCandles(
  basePrice: number,
  trendBias: number,
  volatility: number,
  days = 35,
  avgVolume = 350000,
  targetClosePrice?: number
): CandleData[] {
  const candles: CandleData[] = [];
  const tradingDates = generateTradingDayDates(currentMarketInfo.latestTradingDate, days);
  let currentPrice = basePrice * (1 - trendBias * days * 0.005);

  for (let i = 0; i < tradingDates.length; i++) {
    const isLast = i === tradingDates.length - 1;
    const dateStr = tradingDates[i];
    const parts = dateStr.split('-');
    const candleDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));

    const changeFactor = (Math.random() - 0.48 + trendBias) * volatility;
    const open = Math.round(currentPrice / 25) * 25;
    let close = Math.round((open * (1 + changeFactor)) / 25) * 25;
    
    // For the latest candle, match the stock's active price
    if (isLast && targetClosePrice) {
      close = targetClosePrice;
    }

    const high = Math.max(open, close, Math.round((Math.max(open, close) * (1 + Math.random() * 0.015)) / 25) * 25);
    const low = Math.min(open, close, Math.round((Math.min(open, close) * (1 - Math.random() * 0.015)) / 25) * 25);
    
    // Volume calculation
    const isSpike = i > days - 3 && Math.random() > 0.4;
    const volume = Math.round(avgVolume * (isSpike ? 2.2 + Math.random() : 0.7 + Math.random() * 0.6));
    const foreignBuyPct = close > open ? 0.55 + Math.random() * 0.25 : 0.35 + Math.random() * 0.25;
    const foreignNetVal = Math.round((volume * close * 100 * (foreignBuyPct - 0.5) * 2) / 1_000_000_000);

    candles.push({
      time: dateStr,
      open,
      high,
      low,
      close,
      volume,
      foreignNetBuyMiliar: foreignNetVal,
      formattedDate: formatIndoDate(candleDate),
      isLatestClose: isLast && !currentMarketInfo.isMarketOpen,
    });

    currentPrice = close;
  }

  // Calculate MA20 and MA50
  for (let i = 0; i < candles.length; i++) {
    if (i >= 19) {
      const slice20 = candles.slice(i - 19, i + 1);
      candles[i].ma20 = Math.round(slice20.reduce((acc, c) => acc + c.close, 0) / 20);
    }
    if (i >= 34) {
      const slice35 = candles.slice(i - 34, i + 1);
      candles[i].ma50 = Math.round(slice35.reduce((acc, c) => acc + c.close, 0) / 35);
    }
  }

  return candles;
}

export const IHSG_SUMMARY: IHSGMarketData = {
  index: 7384.25,
  change: 48.60,
  changePercent: 0.66,
  high: 7412.10,
  low: 7352.40,
  open: 7365.10,
  totalTurnoverTrillion: 12.84,
  netForeignTrillion: 0.785, // Net Foreign Buy 785 Miliar
  advancingStocks: 284,
  decliningStocks: 198,
  unchangedStocks: 172,
  marketStatus: currentMarketInfo.statusText,
  isMarketOpen: currentMarketInfo.isMarketOpen,
  latestTradingDateText: currentMarketInfo.latestTradingDateFormatted,
  lastCloseTimeText: currentMarketInfo.lastCloseSession,
  topGainers: [
    { symbol: 'AMMN', changePercent: 5.82, price: 9550 },
    { symbol: 'BREN', changePercent: 4.65, price: 6750 },
    { symbol: 'BBRI', changePercent: 2.15, price: 4750 },
    { symbol: 'ADRO', changePercent: 3.12, price: 3960 }
  ],
  topVolAnomaly: [
    { symbol: 'BBRI', ratio: 2.45, bandar: 'Big Accumulation', changePercent: 2.15 },
    { symbol: 'AMMN', ratio: 3.10, bandar: 'Big Accumulation', changePercent: 5.82 },
    { symbol: 'TLKM', ratio: 1.88, bandar: 'Normal Accumulation', changePercent: 1.35 },
    { symbol: 'GOTO', ratio: 2.15, bandar: 'Normal Distribution', changePercent: -1.75 }
  ]
};

const RAW_STOCKS: StockData[] = [
  {
    symbol: 'BBRI',
    name: 'Bank Rakyat Indonesia (Persero) Tbk',
    sector: 'Banking',
    price: 4750,
    change: 100,
    changePercent: 2.15,
    open: 4680,
    high: 4780,
    low: 4660,
    prevClose: 4650,
    volumeLot: 1850400,
    avgVolumeLot20D: 755000,
    volumeSpikeRatio: 2.45, // 245% dari volume rata-rata
    valueBillion: 878.9, // 878 Miliar Rupiah
    marketCapTrillion: 719.8,
    rsi14: 62.4,
    macd: {
      macdLine: 24.5,
      signalLine: 12.0,
      histogram: 12.5
    },
    ma20: 4610,
    ma50: 4540,
    ma200: 4890,
    trend: 'Uptrend',
    supportLevels: [4620, 4500],
    resistanceLevels: [4800, 4920],
    bandarStatus: 'Big Accumulation',
    bandarScore: 82,
    foreignFlowTodayMiliar: 342.6,
    foreignFlow5DMiliar: 915.2,
    retailFlowEstimateMiliar: -180.4,
    topBuyers: [
      { code: 'ZP', name: 'Maybank Sekuritas', type: 'Asing (F)', netLot: 420000, avgPrice: 4725, netValueMiliar: 198.4 },
      { code: 'AK', name: 'UBS Sekuritas', type: 'Asing (F)', netLot: 310000, avgPrice: 4740, netValueMiliar: 146.9 },
      { code: 'BK', name: 'J.P. Morgan Sekuritas', type: 'Asing (F)', netLot: 195000, avgPrice: 4735, netValueMiliar: 92.3 }
    ],
    topSellers: [
      { code: 'YP', name: 'Mirae Asset Sekuritas (Ritel)', type: 'Domestik (D)', netLot: -350000, avgPrice: 4710, netValueMiliar: -164.8 },
      { code: 'PD', name: 'Indo Premier Sekuritas', type: 'Domestik (D)', netLot: -240000, avgPrice: 4730, netValueMiliar: -113.5 },
      { code: 'CC', name: 'Mandiri Sekuritas', type: 'Domestik (D)', netLot: -180000, avgPrice: 4720, netValueMiliar: -84.9 }
    ],
    candles: generateCandles(4750, 0.04, 0.02, 35, 755000, 4750)
  },
  {
    symbol: 'BBCA',
    name: 'Bank Central Asia Tbk',
    sector: 'Banking',
    price: 10250,
    change: 125,
    changePercent: 1.23,
    open: 10175,
    high: 10300,
    low: 10150,
    prevClose: 10125,
    volumeLot: 890500,
    avgVolumeLot20D: 620000,
    volumeSpikeRatio: 1.44,
    valueBillion: 912.7,
    marketCapTrillion: 1263.5,
    rsi14: 68.2,
    macd: {
      macdLine: 78.0,
      signalLine: 45.0,
      histogram: 33.0
    },
    ma20: 10050,
    ma50: 9850,
    ma200: 9400,
    trend: 'Strong Uptrend',
    supportLevels: [10100, 9950],
    resistanceLevels: [10400, 10600],
    bandarStatus: 'Normal Accumulation',
    bandarScore: 65,
    foreignFlowTodayMiliar: 218.4,
    foreignFlow5DMiliar: 1240.5,
    retailFlowEstimateMiliar: -95.2,
    topBuyers: [
      { code: 'CS', name: 'Credit Suisse / Nomura', type: 'Asing (F)', netLot: 180000, avgPrice: 10225, netValueMiliar: 184.0 },
      { code: 'RX', name: 'Macquarie Capital', type: 'Asing (F)', netLot: 110000, avgPrice: 10240, netValueMiliar: 112.6 },
      { code: 'BK', name: 'J.P. Morgan Sekuritas', type: 'Asing (F)', netLot: 85000, avgPrice: 10210, netValueMiliar: 86.7 }
    ],
    topSellers: [
      { code: 'YP', name: 'Mirae Asset Sekuritas', type: 'Domestik (D)', netLot: -120000, avgPrice: 10230, netValueMiliar: -122.7 },
      { code: 'XC', name: 'Ajaib Sekuritas (Ritel)', type: 'Domestik (D)', netLot: -95000, avgPrice: 10215, netValueMiliar: -97.0 },
      { code: 'PD', name: 'Indo Premier Sekuritas', type: 'Domestik (D)', netLot: -70000, avgPrice: 10220, netValueMiliar: -71.5 }
    ],
    candles: generateCandles(10250, 0.05, 0.015, 35, 620000, 10250)
  },
  {
    symbol: 'AMMN',
    name: 'Amman Mineral Internasional Tbk',
    sector: 'Materials',
    price: 9550,
    change: 525,
    changePercent: 5.82,
    open: 9100,
    high: 9650,
    low: 9075,
    prevClose: 9025,
    volumeLot: 1450000,
    avgVolumeLot20D: 468000,
    volumeSpikeRatio: 3.10, // Extreme Volume Spike!
    valueBillion: 1384.7,
    marketCapTrillion: 692.6,
    rsi14: 73.5,
    macd: {
      macdLine: 112.0,
      signalLine: 42.0,
      histogram: 70.0
    },
    ma20: 8950,
    ma50: 8600,
    ma200: 7800,
    trend: 'Strong Uptrend',
    supportLevels: [9200, 8950],
    resistanceLevels: [9800, 10200],
    bandarStatus: 'Big Accumulation',
    bandarScore: 94,
    foreignFlowTodayMiliar: 485.3,
    foreignFlow5DMiliar: 1120.0,
    retailFlowEstimateMiliar: -320.0,
    topBuyers: [
      { code: 'AK', name: 'UBS Sekuritas', type: 'Asing (F)', netLot: 480000, avgPrice: 9480, netValueMiliar: 455.0 },
      { code: 'KZ', name: 'CLSA Sekuritas', type: 'Asing (F)', netLot: 260000, avgPrice: 9510, netValueMiliar: 247.2 },
      { code: 'BK', name: 'J.P. Morgan Sekuritas', type: 'Asing (F)', netLot: 190000, avgPrice: 9460, netValueMiliar: 179.7 }
    ],
    topSellers: [
      { code: 'YP', name: 'Mirae Asset Sekuritas', type: 'Domestik (D)', netLot: -310000, avgPrice: 9380, netValueMiliar: -290.7 },
      { code: 'XL', name: 'Stockbit Sekuritas', type: 'Domestik (D)', netLot: -240000, avgPrice: 9420, netValueMiliar: -226.0 },
      { code: 'SQ', name: 'BCA Sekuritas', type: 'Domestik (D)', netLot: -190000, avgPrice: 9400, netValueMiliar: -178.6 }
    ],
    candles: generateCandles(9550, 0.08, 0.035, 35, 468000, 9550)
  },
  {
    symbol: 'TLKM',
    name: 'Telkom Indonesia (Persero) Tbk',
    sector: 'Infrastructure',
    price: 3010,
    change: 40,
    changePercent: 1.35,
    open: 2980,
    high: 3040,
    low: 2970,
    prevClose: 2970,
    volumeLot: 1220000,
    avgVolumeLot20D: 650000,
    volumeSpikeRatio: 1.88,
    valueBillion: 367.2,
    marketCapTrillion: 298.2,
    rsi14: 48.9,
    macd: {
      macdLine: -8.5,
      signalLine: -14.2,
      histogram: 5.7
    },
    ma20: 2960,
    ma50: 3080,
    ma200: 3450,
    trend: 'Sideways / Consolidation',
    supportLevels: [2950, 2880],
    resistanceLevels: [3080, 3160],
    bandarStatus: 'Normal Accumulation',
    bandarScore: 58,
    foreignFlowTodayMiliar: 74.8,
    foreignFlow5DMiliar: 186.2,
    retailFlowEstimateMiliar: -42.0,
    topBuyers: [
      { code: 'ZP', name: 'Maybank Sekuritas', type: 'Asing (F)', netLot: 320000, avgPrice: 3005, netValueMiliar: 96.1 },
      { code: 'CC', name: 'Mandiri Sekuritas', type: 'Domestik (D)', netLot: 210000, avgPrice: 2995, netValueMiliar: 62.8 },
      { code: 'CG', name: 'Citigroup Sekuritas', type: 'Asing (F)', netLot: 140000, avgPrice: 3010, netValueMiliar: 42.1 }
    ],
    topSellers: [
      { code: 'PD', name: 'Indo Premier Sekuritas', type: 'Domestik (D)', netLot: -280000, avgPrice: 3000, netValueMiliar: -84.0 },
      { code: 'YP', name: 'Mirae Asset Sekuritas', type: 'Domestik (D)', netLot: -190000, avgPrice: 2990, netValueMiliar: -56.8 },
      { code: 'NI', name: 'BNI Sekuritas', type: 'Domestik (D)', netLot: -120000, avgPrice: 3005, netValueMiliar: -36.0 }
    ],
    candles: generateCandles(3010, -0.01, 0.02, 35, 650000, 3010)
  },
  {
    symbol: 'BREN',
    name: 'Barito Renewables Energy Tbk',
    sector: 'Energy',
    price: 6750,
    change: 300,
    changePercent: 4.65,
    open: 6475,
    high: 6850,
    low: 6450,
    prevClose: 6450,
    volumeLot: 940000,
    avgVolumeLot20D: 490000,
    volumeSpikeRatio: 1.92,
    valueBillion: 634.5,
    marketCapTrillion: 903.0,
    rsi14: 64.8,
    macd: {
      macdLine: 45.0,
      signalLine: 18.0,
      histogram: 27.0
    },
    ma20: 6420,
    ma50: 6200,
    ma200: 5900,
    trend: 'Uptrend',
    supportLevels: [6450, 6150],
    resistanceLevels: [7000, 7400],
    bandarStatus: 'Big Accumulation',
    bandarScore: 88,
    foreignFlowTodayMiliar: 198.5,
    foreignFlow5DMiliar: 560.2,
    retailFlowEstimateMiliar: -140.0,
    topBuyers: [
      { code: 'BK', name: 'J.P. Morgan Sekuritas', type: 'Asing (F)', netLot: 280000, avgPrice: 6710, netValueMiliar: 187.8 },
      { code: 'AK', name: 'UBS Sekuritas', type: 'Asing (F)', netLot: 190000, avgPrice: 6740, netValueMiliar: 128.0 },
      { code: 'LG', name: 'Trimegah Sekuritas', type: 'Domestik (D)', netLot: 120000, avgPrice: 6680, netValueMiliar: 80.1 }
    ],
    topSellers: [
      { code: 'YP', name: 'Mirae Asset Sekuritas', type: 'Domestik (D)', netLot: -240000, avgPrice: 6650, netValueMiliar: -159.6 },
      { code: 'PD', name: 'Indo Premier Sekuritas', type: 'Domestik (D)', netLot: -180000, avgPrice: 6690, netValueMiliar: -120.4 },
      { code: 'XC', name: 'Ajaib Sekuritas', type: 'Domestik (D)', netLot: -110000, avgPrice: 6680, netValueMiliar: -73.4 }
    ],
    candles: generateCandles(6750, 0.05, 0.03, 35, 490000, 6750)
  },
  {
    symbol: 'BMRI',
    name: 'Bank Mandiri (Persero) Tbk',
    sector: 'Banking',
    price: 6850,
    change: 125,
    changePercent: 1.86,
    open: 6750,
    high: 6900,
    low: 6725,
    prevClose: 6725,
    volumeLot: 980000,
    avgVolumeLot20D: 710000,
    volumeSpikeRatio: 1.38,
    valueBillion: 671.3,
    marketCapTrillion: 639.3,
    rsi14: 63.1,
    macd: {
      macdLine: 42.0,
      signalLine: 25.0,
      histogram: 17.0
    },
    ma20: 6710,
    ma50: 6580,
    ma200: 6250,
    trend: 'Uptrend',
    supportLevels: [6700, 6550],
    resistanceLevels: [7000, 7150],
    bandarStatus: 'Normal Accumulation',
    bandarScore: 71,
    foreignFlowTodayMiliar: 154.2,
    foreignFlow5DMiliar: 680.4,
    retailFlowEstimateMiliar: -88.0,
    topBuyers: [
      { code: 'ZP', name: 'Maybank Sekuritas', type: 'Asing (F)', netLot: 210000, avgPrice: 6825, netValueMiliar: 143.3 },
      { code: 'CS', name: 'Credit Suisse', type: 'Asing (F)', netLot: 160000, avgPrice: 6840, netValueMiliar: 109.4 },
      { code: 'RX', name: 'Macquarie Capital', type: 'Asing (F)', netLot: 95000, avgPrice: 6830, netValueMiliar: 64.8 }
    ],
    topSellers: [
      { code: 'YP', name: 'Mirae Asset Sekuritas', type: 'Domestik (D)', netLot: -170000, avgPrice: 6810, netValueMiliar: -115.7 },
      { code: 'CC', name: 'Mandiri Sekuritas (Ritel)', type: 'Domestik (D)', netLot: -140000, avgPrice: 6825, netValueMiliar: -95.5 },
      { code: 'PD', name: 'Indo Premier Sekuritas', type: 'Domestik (D)', netLot: -85000, avgPrice: 6815, netValueMiliar: -57.9 }
    ],
    candles: generateCandles(6850, 0.03, 0.018, 35, 710000, 6850)
  },
  {
    symbol: 'ADRO',
    name: 'Adaro Energy Indonesia Tbk',
    sector: 'Energy',
    price: 3960,
    change: 120,
    changePercent: 3.12,
    open: 3860,
    high: 3990,
    low: 3840,
    prevClose: 3840,
    volumeLot: 1120000,
    avgVolumeLot20D: 640000,
    volumeSpikeRatio: 1.75,
    valueBillion: 443.5,
    marketCapTrillion: 126.6,
    rsi14: 66.4,
    macd: {
      macdLine: 38.0,
      signalLine: 16.0,
      histogram: 22.0
    },
    ma20: 3820,
    ma50: 3680,
    ma200: 3200,
    trend: 'Uptrend',
    supportLevels: [3840, 3720],
    resistanceLevels: [4050, 4200],
    bandarStatus: 'Normal Accumulation',
    bandarScore: 68,
    foreignFlowTodayMiliar: 89.2,
    foreignFlow5DMiliar: 340.0,
    retailFlowEstimateMiliar: -52.0,
    topBuyers: [
      { code: 'BK', name: 'J.P. Morgan Sekuritas', type: 'Asing (F)', netLot: 240000, avgPrice: 3940, netValueMiliar: 94.5 },
      { code: 'AK', name: 'UBS Sekuritas', type: 'Asing (F)', netLot: 180000, avgPrice: 3950, netValueMiliar: 71.1 },
      { code: 'KZ', name: 'CLSA Sekuritas', type: 'Asing (F)', netLot: 130000, avgPrice: 3930, netValueMiliar: 51.0 }
    ],
    topSellers: [
      { code: 'YP', name: 'Mirae Asset Sekuritas', type: 'Domestik (D)', netLot: -210000, avgPrice: 3920, netValueMiliar: -82.3 },
      { code: 'PD', name: 'Indo Premier Sekuritas', type: 'Domestik (D)', netLot: -160000, avgPrice: 3945, netValueMiliar: -63.1 },
      { code: 'XL', name: 'Stockbit Sekuritas', type: 'Domestik (D)', netLot: -105000, avgPrice: 3935, netValueMiliar: -41.3 }
    ],
    candles: generateCandles(3960, 0.04, 0.025, 35, 640000, 3960)
  },
  {
    symbol: 'GOTO',
    name: 'GoTo Gojek Tokopedia Tbk',
    sector: 'Tech',
    price: 56,
    change: -1,
    changePercent: -1.75,
    open: 57,
    high: 58,
    low: 55,
    prevClose: 57,
    volumeLot: 8520000,
    avgVolumeLot20D: 3950000,
    volumeSpikeRatio: 2.15, // Volume tinggi tapi harga turun -> Distribusi!
    valueBillion: 477.1,
    marketCapTrillion: 67.2,
    rsi14: 38.2,
    macd: {
      macdLine: -1.2,
      signalLine: -0.4,
      histogram: -0.8
    },
    ma20: 59,
    ma50: 64,
    ma200: 72,
    trend: 'Downtrend',
    supportLevels: [54, 50],
    resistanceLevels: [60, 65],
    bandarStatus: 'Normal Distribution',
    bandarScore: -55,
    foreignFlowTodayMiliar: -92.4,
    foreignFlow5DMiliar: -312.0,
    retailFlowEstimateMiliar: 85.0, // Ritel menampung buangan bandar
    topBuyers: [
      { code: 'YP', name: 'Mirae Asset Sekuritas (Ritel)', type: 'Domestik (D)', netLot: 2400000, avgPrice: 56, netValueMiliar: 134.4 },
      { code: 'XC', name: 'Ajaib Sekuritas (Ritel)', type: 'Domestik (D)', netLot: 1800000, avgPrice: 56, netValueMiliar: 100.8 },
      { code: 'PD', name: 'Indo Premier Sekuritas', type: 'Domestik (D)', netLot: 1200000, avgPrice: 57, netValueMiliar: 68.4 }
    ],
    topSellers: [
      { code: 'BK', name: 'J.P. Morgan Sekuritas', type: 'Asing (F)', netLot: -3100000, avgPrice: 56, netValueMiliar: -173.6 },
      { code: 'AK', name: 'UBS Sekuritas', type: 'Asing (F)', netLot: -2200000, avgPrice: 56, netValueMiliar: -123.2 },
      { code: 'ZP', name: 'Maybank Sekuritas', type: 'Asing (F)', netLot: -1500000, avgPrice: 57, netValueMiliar: -85.5 }
    ],
    candles: generateCandles(56, -0.06, 0.03, 35, 3950000, 56)
  },
  {
    symbol: 'ASII',
    name: 'Astra International Tbk',
    sector: 'Consumer',
    price: 4980,
    change: 60,
    changePercent: 1.22,
    open: 4940,
    high: 5020,
    low: 4920,
    prevClose: 4920,
    volumeLot: 680000,
    avgVolumeLot20D: 590000,
    volumeSpikeRatio: 1.15,
    valueBillion: 338.6,
    marketCapTrillion: 201.6,
    rsi14: 51.5,
    macd: {
      macdLine: 4.5,
      signalLine: 1.2,
      histogram: 3.3
    },
    ma20: 4950,
    ma50: 4910,
    ma200: 5120,
    trend: 'Sideways / Consolidation',
    supportLevels: [4880, 4750],
    resistanceLevels: [5050, 5200],
    bandarStatus: 'Neutral',
    bandarScore: 12,
    foreignFlowTodayMiliar: 18.5,
    foreignFlow5DMiliar: -45.0,
    retailFlowEstimateMiliar: -12.0,
    topBuyers: [
      { code: 'CC', name: 'Mandiri Sekuritas', type: 'Domestik (D)', netLot: 140000, avgPrice: 4970, netValueMiliar: 69.5 },
      { code: 'ZP', name: 'Maybank Sekuritas', type: 'Asing (F)', netLot: 110000, avgPrice: 4980, netValueMiliar: 54.7 },
      { code: 'KZ', name: 'CLSA Sekuritas', type: 'Asing (F)', netLot: 85000, avgPrice: 4965, netValueMiliar: 42.2 }
    ],
    topSellers: [
      { code: 'YP', name: 'Mirae Asset Sekuritas', type: 'Domestik (D)', netLot: -130000, avgPrice: 4960, netValueMiliar: -64.4 },
      { code: 'PD', name: 'Indo Premier Sekuritas', type: 'Domestik (D)', netLot: -95000, avgPrice: 4975, netValueMiliar: -47.2 },
      { code: 'BK', name: 'J.P. Morgan Sekuritas', type: 'Asing (F)', netLot: -70000, avgPrice: 4985, netValueMiliar: -34.8 }
    ],
    candles: generateCandles(4980, 0.01, 0.02, 35, 590000, 4980)
  }
];

export const INITIAL_STOCKS: StockData[] = RAW_STOCKS.map((stock) => {
  const top3BuyLot = stock.topBuyers.slice(0, 3).reduce((acc, b) => acc + b.netLot, 0);
  const top3SellLot = stock.topSellers.slice(0, 3).reduce((acc, s) => acc + Math.abs(s.netLot), 0);
  const top3BuyerPercent = Number(((top3BuyLot / stock.volumeLot) * 100).toFixed(1));
  const top3SellerPercent = Number(((top3SellLot / stock.volumeLot) * 100).toFixed(1));

  return {
    ...stock,
    top3BuyerPercent,
    top3SellerPercent,
    latestTradingDate: currentMarketInfo.latestTradingDateFormatted,
    latestTradingDateIso: currentMarketInfo.latestTradingDateIso,
  };
});
