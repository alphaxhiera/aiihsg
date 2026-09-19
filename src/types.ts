export type AgentId = 'technical_agent' | 'big_volume_agent' | 'orchestrator';

export interface BrokerActivity {
  code: string;
  name: string;
  type: 'Asing (F)' | 'Domestik (D)';
  netLot: number;
  avgPrice: number;
  netValueMiliar: number;
}

export interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  foreignNetBuyMiliar: number;
  ma20?: number;
  ma50?: number;
  formattedDate?: string;
  isLatestClose?: boolean;
}

export type BandarmologyStatus =
  | 'Big Accumulation'
  | 'Normal Accumulation'
  | 'Neutral'
  | 'Normal Distribution'
  | 'Big Distribution';

export interface StockData {
  symbol: string;
  name: string;
  sector: 'Banking' | 'Energy' | 'Tech' | 'Consumer' | 'Infrastructure' | 'Materials';
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  volumeLot: number;
  avgVolumeLot20D: number;
  volumeSpikeRatio: number; // e.g. 2.4x
  valueBillion: number; // in Miliar Rupiah
  marketCapTrillion: number; // in Triliun Rupiah
  
  // Technical Indicators
  rsi14: number;
  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
  };
  ma20: number;
  ma50: number;
  ma200: number;
  trend: 'Strong Uptrend' | 'Uptrend' | 'Sideways / Consolidation' | 'Downtrend' | 'Strong Downtrend';
  supportLevels: [number, number]; // [S1, S2]
  resistanceLevels: [number, number]; // [R1, R2]
  
  // Big Volume & Bandarmology
  bandarStatus: BandarmologyStatus;
  bandarScore: number; // -100 to +100
  top3BuyerPercent?: number; // % Porsi Top 3 = (Total Net Buy Top 3 / Total Volume Beli) * 100
  top3SellerPercent?: number; // % Porsi Top 3 = (Total Net Sell Top 3 / Total Volume Jual) * 100
  foreignFlowTodayMiliar: number; // + is net buy, - is net sell
  foreignFlow5DMiliar: number;
  retailFlowEstimateMiliar: number;
  topBuyers: BrokerActivity[];
  topSellers: BrokerActivity[];
  
  // Historical Candles (recent 30-60 trading days)
  candles: CandleData[];
  latestTradingDate?: string;
  latestTradingDateIso?: string;
}

export interface IHSGMarketData {
  index: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  totalTurnoverTrillion: number;
  netForeignTrillion: number;
  advancingStocks: number;
  decliningStocks: number;
  unchangedStocks: number;
  marketStatus: string;
  isMarketOpen?: boolean;
  latestTradingDateText?: string;
  lastCloseTimeText?: string;
  topGainers: { symbol: string; changePercent: number; price: number }[];
  topVolAnomaly: { symbol: string; ratio: number; bandar: BandarmologyStatus; changePercent: number }[];
}

export interface AgentPrompt {
  id: AgentId;
  name: string;
  title: string;
  badge: string;
  avatar: string;
  color: 'blue' | 'amber' | 'emerald';
  focus: string;
  systemPrompt: string;
  defaultQuestions: string[];
}

export interface AgentPromptsFile {
  version: string;
  lastUpdated: string;
  market: string;
  agents: {
    technical_agent: AgentPrompt;
    big_volume_agent: AgentPrompt;
    orchestrator: AgentPrompt;
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  agentId: AgentId;
  text: string;
  timestamp: string;
  stockSymbol?: string;
  tradeSetup?: {
    action: 'BUY ON WEAKNESS' | 'BUY ON BREAKOUT' | 'WAIT AND SEE' | 'TAKE PROFIT / SOS';
    entryZone: string;
    targetPrice1: number;
    targetPrice2?: number;
    stopLoss: number;
    riskRewardRatio: string;
    bandarNote?: string;
  };
}
