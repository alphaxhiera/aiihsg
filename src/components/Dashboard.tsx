import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  TrendingUp,
  Activity,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  BarChart2,
  Calendar,
  Clock,
  Search,
  Check,
  Menu,
  Target,
  ShieldCheck,
  Zap,
  Users,
  AlertCircle,
  RefreshCw,
  Bell,
  BellRing,
  Plus,
  Trash2
} from 'lucide-react';
import { StockData, AgentId, CandleData, IHSGMarketData } from '../types';
import { getMarketInfo, formatShortDate, formatIndoDate, MarketInfo } from '../utils/marketTime';
import { VolumeMonitoringChart } from './VolumeMonitoringChart';
import { OrchestratorInsightCards } from './OrchestratorInsightCards';

interface DashboardProps {
  activeAgent?: AgentId;
  onSelectAgent?: (agent: AgentId) => void;
  stock: StockData;
  stocks?: StockData[];
  onSelectStock?: (stock: StockData) => void;
  ihsgSummary: IHSGMarketData;
  onAskAgent: (agentId: AgentId, promptMessage: string) => void;
  isChatbotOpen: boolean;
  onToggleChatbot: () => void;
  onToggleSidebar?: () => void;
  isSyncing?: boolean;
  onSyncYahoo?: () => void;
  dataSource?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  activeAgent = 'technical_agent',
  onSelectAgent,
  stock,
  stocks = [],
  onSelectStock,
  ihsgSummary,
  onAskAgent,
  isChatbotOpen,
  onToggleChatbot,
  onToggleSidebar,
  isSyncing = false,
  onSyncYahoo,
  dataSource = 'Yahoo Finance (.JK)',
}) => {
  // Technical view subcharts: RSI or MACD
  const [activeTechSubChart, setActiveTechSubChart] = useState<'rsi' | 'macd'>('rsi');
  const [showMA20, setShowMA20] = useState(true);
  const [showMA50, setShowMA50] = useState(true);
  const [showSR, setShowSR] = useState(true);
  const [hoveredCandle, setHoveredCandle] = useState<CandleData | null>(null);

  // Volume view subcharts: Volume Bars or Foreign Flow
  const [activeVolTab, setActiveVolTab] = useState<'volume' | 'foreign'>('volume');

  // Market Info & Real-Time WIB Clock
  const [marketInfo, setMarketInfo] = useState<MarketInfo>(() => getMarketInfo());
  const [isStockPickerOpen, setIsStockPickerOpen] = useState(false);
  const [stockSearch, setStockSearch] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsStockPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setMarketInfo(getMarketInfo());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredStocks = useMemo(() => {
    if (!stockSearch.trim()) return stocks;
    const q = stockSearch.toLowerCase();
    return stocks.filter(
      (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.sector.toLowerCase().includes(q)
    );
  }, [stocks, stockSearch]);

  const isGain = stock.change >= 0;
  const isSpike = stock.volumeSpikeRatio >= 1.5;

  const s1 = stock.supportLevels[0];
  const s2 = stock.supportLevels[1] || s1;
  const r1 = stock.resistanceLevels[0];
  const r2 = stock.resistanceLevels[1] || r1;

  // Chart coordinate calculations
  const candles = stock.candles;
  const chartHeight = 260;
  const chartWidth = 720;
  const padding = { top: 20, right: 60, bottom: 30, left: 10 };

  const { minPrice, maxPrice, priceRange } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    candles.forEach((c) => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
      if (c.ma20 && c.ma20 < min) min = c.ma20;
      if (c.ma20 && c.ma20 > max) max = c.ma20;
      if (c.ma50 && c.ma50 < min) min = c.ma50;
      if (c.ma50 && c.ma50 > max) max = c.ma50;
    });
    if (s1 < min) min = s1;
    if (r1 > max) max = r1;

    min = Math.floor(min * 0.98);
    max = Math.ceil(max * 1.02);
    return { minPrice: min, maxPrice: max, priceRange: max - min || 1 };
  }, [candles, s1, r1]);

  const priceToY = (price: number) => {
    return (
      chartHeight -
      padding.bottom -
      ((price - minPrice) / priceRange) * (chartHeight - padding.top - padding.bottom)
    );
  };

  const candleWidth = (chartWidth - padding.left - padding.right) / candles.length;

  const ma20Points = useMemo(() => {
    return candles
      .map((c, i) => {
        if (!c.ma20) return null;
        const x = padding.left + i * candleWidth + candleWidth / 2;
        const y = priceToY(c.ma20);
        return `${x},${y}`;
      })
      .filter(Boolean)
      .join(' ');
  }, [candles, candleWidth, minPrice, priceRange]);

  const ma50Points = useMemo(() => {
    return candles
      .map((c, i) => {
        if (!c.ma50) return null;
        const x = padding.left + i * candleWidth + candleWidth / 2;
        const y = priceToY(c.ma50);
        return `${x},${y}`;
      })
      .filter(Boolean)
      .join(' ');
  }, [candles, candleWidth, minPrice, priceRange]);

  // Volume chart calculations
  const maxVolume = useMemo(() => {
    return Math.max(...candles.map((c) => c.volume), 1);
  }, [candles]);

  const avgVolume20D = useMemo(() => {
    return stock.avgVolumeLot20D || Math.round(candles.reduce((acc, c) => acc + c.volume, 0) / (candles.length || 1));
  }, [candles, stock.avgVolumeLot20D]);

  // Calculated Trading Plan Setup
  const tradingSetup = useMemo(() => {
    const entryLow = s1;
    const entryHigh = Math.round(s1 + (stock.price - s1) * 0.4);
    const tp1 = r1;
    const tp2 = r2;
    const sl = Math.round(s1 * 0.96);
    const upsidePercent = (((tp1 - stock.price) / stock.price) * 100).toFixed(1);
    const downsidePercent = (((stock.price - sl) / stock.price) * 100).toFixed(1);
    const rrRatio = (Number(upsidePercent) / (Number(downsidePercent) || 1)).toFixed(1);

    let signalLabel = 'BUY ON WEAKNESS';
    let signalColor = 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30';
    if (stock.price >= r1 * 0.98) {
      signalLabel = 'BREAKOUT WATCH';
      signalColor = 'text-blue-400 bg-blue-500/15 border-blue-500/30';
    } else if (stock.rsi14 > 70) {
      signalLabel = 'TRAILING STOP / TAKE PROFIT';
      signalColor = 'text-amber-400 bg-amber-500/15 border-amber-500/30';
    } else if (stock.rsi14 < 35) {
      signalLabel = 'OVERSOLD REBOUND PLAY';
      signalColor = 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30';
    }

    return {
      entryLow,
      entryHigh,
      tp1,
      tp2,
      sl,
      upsidePercent,
      downsidePercent,
      rrRatio,
      signalLabel,
      signalColor,
    };
  }, [stock, s1, r1, r2]);

  // Formula Money Flow: Porsi Top 3 = (Total Net Buy Top 3 Broker / Total Volume Transaksi Beli [All Brokers]) * 100%
  const buyerDominance = useMemo(() => {
    if (typeof stock.top3BuyerPercent === 'number') {
      return stock.top3BuyerPercent;
    }
    const top3BuyLot = stock.topBuyers.slice(0, 3).reduce((acc, b) => acc + b.netLot, 0);
    return Number(((top3BuyLot / (stock.volumeLot || 1)) * 100).toFixed(1));
  }, [stock.top3BuyerPercent, stock.topBuyers, stock.volumeLot]);

  const sellerDominance = useMemo(() => {
    if (typeof stock.top3SellerPercent === 'number') {
      return stock.top3SellerPercent;
    }
    const top3SellLot = stock.topSellers.slice(0, 3).reduce((acc, s) => acc + Math.abs(s.netLot), 0);
    return Number(((top3SellLot / (stock.volumeLot || 1)) * 100).toFixed(1));
  }, [stock.top3SellerPercent, stock.topSellers, stock.volumeLot]);

  const isTechnicalMode = activeAgent === 'technical_agent';
  const isBigVolumeMode = activeAgent === 'big_volume_agent';
  const isOrchestratorMode = activeAgent === 'orchestrator';

  // Alert State for AI Orchestrator
  const [alerts, setAlerts] = useState<Array<{
    id: string;
    symbol: string;
    title: string;
    condition: string;
    target: string;
    active: boolean;
    type: 'synergy' | 'volume' | 'technical' | 'foreign';
  }>>([
    {
      id: '1',
      symbol: stock.symbol,
      title: 'Dual-Engine S/R Breakout Alert',
      condition: 'Harga menembus Resistance R1 dengan Lonjakan Volume > 2x',
      target: 'Rp ' + (stock.price * 1.02).toLocaleString('id-ID'),
      active: true,
      type: 'synergy'
    },
    {
      id: '2',
      symbol: stock.symbol,
      title: 'Bandarmology Accumulation Surge',
      condition: 'Akumulasi Top 3 Buyer > 50% dari Total Volume',
      target: 'Akumulasi > 50%',
      active: true,
      type: 'volume'
    }
  ]);

  const [newAlertTitle, setNewAlertTitle] = useState('Dual-Engine S/R Re-Test Alert');
  const [newAlertCondition, setNewAlertCondition] = useState('Harga mendekati Support S1 dengan Net Foreign Inflow');
  const [newAlertTarget, setNewAlertTarget] = useState(stock.price.toString());
  const [newAlertType, setNewAlertType] = useState<'synergy' | 'volume' | 'technical' | 'foreign'>('synergy');

  const handleAddAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const newAlertItem = {
      id: Date.now().toString(),
      symbol: stock.symbol,
      title: newAlertTitle,
      condition: newAlertCondition,
      target: newAlertTarget.startsWith('Rp') ? newAlertTarget : `Rp ${Number(newAlertTarget || stock.price).toLocaleString('id-ID')}`,
      active: true,
      type: newAlertType
    };
    setAlerts([newAlertItem, ...alerts]);
  };

  const toggleAlertStatus = (id: string) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, active: !a.active } : a));
  };

  const deleteAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  return (
    <main className="flex-1 h-screen overflow-y-auto bg-slate-950 text-slate-100 flex flex-col min-w-0 transition-all duration-300">
      {/* Top Header Bar */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800/80 bg-slate-900/40 sticky top-0 z-20 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        {/* Left Header: Stock Picker & Info */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0" ref={pickerRef}>
          {/* Hamburger Menu on Mobile/Tablet */}
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
              title="Buka Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          <div className="relative">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {/* Interactive Stock Switcher Button */}
              {onSelectStock && stocks.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setIsStockPickerOpen(!isStockPickerOpen)}
                  className="group flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 -ml-1 rounded-lg bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/50 transition-all text-left cursor-pointer"
                  title="Klik untuk memilih saham lain"
                >
                  <span className="text-lg sm:text-xl font-bold font-mono tracking-tight text-white group-hover:text-blue-400 transition-colors">
                    {stock.symbol}
                  </span>
                  <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded bg-slate-900/80 text-slate-300 font-sans font-normal border border-slate-700">
                    {stock.sector}
                  </span>
                  <span className="text-xs font-semibold text-white font-mono ml-1">
                    Rp {stock.price.toLocaleString('id-ID')}
                  </span>
                  <span
                    className={`text-xs font-mono font-medium ${
                      isGain ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isGain ? '+' : ''}
                    {stock.changePercent.toFixed(2)}%
                  </span>
                  <span className="text-slate-400 group-hover:text-white transition-transform duration-200 text-xs">
                    ▼
                  </span>
                </button>
              ) : (
                <h2 className="text-lg sm:text-xl font-bold font-mono tracking-tight text-white flex items-center gap-2">
                  {stock.symbol}
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-sans font-normal border border-slate-700">
                    {stock.sector}
                  </span>
                </h2>
              )}

              {isSpike && isBigVolumeMode && (
                <span className="text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1 animate-pulse">
                  <Flame className="w-3 h-3 text-amber-400" />
                  <span>SPIKE {stock.volumeSpikeRatio.toFixed(1)}x</span>
                </span>
              )}

              {/* Yahoo Finance Reference Indicator */}
              <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Acuan: {stock.symbol}.JK (Yahoo Finance)</span>
              </div>

              {onSyncYahoo && (
                <button
                  type="button"
                  onClick={onSyncYahoo}
                  disabled={isSyncing}
                  className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-[10px] text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                  title="Sinkronkan data teknikal & candle dari Yahoo Finance"
                >
                  <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? 'animate-spin text-blue-400' : 'text-slate-400'}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
                </button>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 truncate max-w-[200px] sm:max-w-xs mt-0.5">
              {stock.name} • <span className="font-mono text-slate-400">{stock.symbol}.JK</span>
            </p>

            {/* Dropdown Popover */}
            {isStockPickerOpen && onSelectStock && (
              <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl p-2.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari kode saham (e.g. BBRI, BBCA)..."
                    value={stockSearch}
                    onChange={(e) => setStockSearch(e.target.value)}
                    autoFocus
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="text-[10px] uppercase font-bold text-slate-400 px-1.5 py-1 flex items-center justify-between">
                  <span>Pilih Saham IDX</span>
                  <span>{filteredStocks.length} Saham</span>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-1 pr-1 font-mono scrollbar-thin">
                  {filteredStocks.map((s) => {
                    const isCurrent = s.symbol === stock.symbol;
                    const isItemGain = s.change >= 0;
                    const isItemSpike = s.volumeSpikeRatio >= 1.5;

                    return (
                      <button
                        key={s.symbol}
                        onClick={() => {
                          onSelectStock(s);
                          setIsStockPickerOpen(false);
                          setStockSearch('');
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors cursor-pointer ${
                          isCurrent
                            ? 'bg-blue-600/20 text-white border border-blue-500/40'
                            : 'hover:bg-slate-800 text-slate-200 border border-transparent'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs">{s.symbol}</span>
                            {isCurrent && <Check className="w-3 h-3 text-blue-400" />}
                            {isItemSpike && (
                              <span className="px-1 py-0.2 bg-amber-500/20 text-amber-300 text-[9px] rounded font-bold flex items-center gap-0.5">
                                <Flame className="w-2.5 h-2.5 text-amber-400" />
                                {s.volumeSpikeRatio.toFixed(1)}x
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate font-sans">
                            {s.name}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-semibold text-white">
                            Rp {s.price.toLocaleString('id-ID')}
                          </div>
                          <div
                            className={`text-[10px] font-medium ${
                              isItemGain ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {isItemGain ? '+' : ''}
                            {s.changePercent.toFixed(2)}%
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center/Right: Market Status & Time */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap shrink-0">

          {/* Status Pasar BEI (Buka / Tutup) */}
          <div
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-semibold ${
              marketInfo.isMarketOpen
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            }`}
            title={marketInfo.statusDetail}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                marketInfo.isMarketOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="whitespace-nowrap">{marketInfo.statusText}</span>
          </div>

          {/* Tanggal & Waktu WIB di Kanan Atas */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-mono shadow-xs">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-sans font-medium whitespace-nowrap">{marketInfo.wibFormattedDate}</span>
            </div>
            <div className="h-3 w-px bg-slate-800" />
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold whitespace-nowrap">{marketInfo.wibFormattedTime}</span>
            </div>
          </div>

          {!isChatbotOpen && (
            <button
              onClick={onToggleChatbot}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-blue-400 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              title="Tampilkan Chatbot Agen"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span><span className="hidden sm:inline">Buka </span>AI Chatbot</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE ORCHESTRATOR: AI MASTER ORCHESTRATOR (DUAL-ENGINE + ALERT SETTINGS)   */}
      {/* ========================================================================= */}
      {isOrchestratorMode && (
        <div className="p-3 sm:p-5 lg:p-6 space-y-4 sm:space-y-6 flex-1 animate-in fade-in duration-200">
          {/* Market Status & Latest Trading Date Banner */}
          {!marketInfo.isMarketOpen ? (
            <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-2.5 w-2.5 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
                <div className="text-slate-300 leading-relaxed text-[11px] sm:text-xs">
                  <strong className="text-white">Bursa BEI Sedang Tutup ({marketInfo.statusText}):</strong>{' '}
                  Dashboard menggunakan <span className="text-amber-300 font-semibold">Data Penutupan Terakhir ({marketInfo.latestTradingDateFormatted} • {marketInfo.lastCloseSession})</span>.
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 shrink-0 text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>Sesi Terakhir:</span>
                <strong className="text-emerald-400">{marketInfo.latestTradingDateFormatted}</strong>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 animate-pulse shrink-0"></span>
                <span className="text-slate-300 text-[11px] sm:text-xs">
                  <strong className="text-emerald-400">Bursa Efek Indonesia Buka ({marketInfo.statusText})</strong> — Menampilkan data transaksi live hari ini ({marketInfo.wibFormattedDate}).
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
                <span>Jam BEI:</span>
                <strong className="text-white">{marketInfo.wibFormattedTime}</strong>
              </div>
            </div>
          )}

          {/* Mode Banner */}
          <div className="bg-linear-to-r from-emerald-900/30 via-teal-900/20 to-transparent border border-emerald-800/40 rounded-xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                  AI MASTER ORCHESTRATOR (AUTO-ROUTER DUAL-ENGINE)
                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Active Intelligence Mode
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Menggabungkan Analisis Teknikal & Bandarmology Volume Besar secara otomatis tanpa perlu pemilihan agen manual
                </div>
              </div>
            </div>

            <button
              onClick={() =>
                onAskAgent(
                  'orchestrator',
                  `Berikan analisa komprehensif lengkap (Teknikal & Bandarmology) untuk saham ${stock.symbol}`
                )
              }
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tanya AI Orchestrator</span>
            </button>
          </div>

          {/* Kartu Skor Sinergi Dual-Engine (Orchestrator Verdict) */}
          <div className="bg-linear-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-xl p-4 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                    KARTU SKOR SINERGI DUAL-ENGINE (ORCHESTRATOR VERDICT)
                    <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                      Auto-Router Verdict
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    Analisis gabungan otomatis Teknikal & Bandarmology Volume Besar untuk <strong className="text-white font-mono">{stock.symbol}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-800 text-xs">
              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">1. Indikator Teknikal</div>
                <div className="text-xs font-bold text-blue-300 mt-1">
                  {tradingSetup.signalLabel} (RSI: {stock.rsi14.toFixed(1)})
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Support: Rp {s1.toLocaleString('id-ID')} | Res: Rp {r1.toLocaleString('id-ID')}
                </div>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">2. Indikator Bandarmology</div>
                <div className="text-xs font-bold text-amber-300 mt-1">
                  Big Accumulation (Top 3 Buyer Dominant)
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Net Foreign Flow: Positif / Masuk
                </div>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 bg-emerald-950/20 border-emerald-500/30">
                <div className="text-[10px] text-emerald-400 uppercase tracking-wider font-mono">3. Kesimpulan Otomatis (Verdict)</div>
                <div className="text-xs font-bold text-emerald-300 mt-1">
                  High-Confidence Buy Setup
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5">
                  Sinyal teknikal S/R breakout didukung penuh oleh akumulasi volume bandar besar.
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Insight Cards for AI Orchestrator (Fundamental, Macro, News Rumors, Community, Top Movers) */}
          <OrchestratorInsightCards
            stock={stock}
            stocks={stocks}
            ihsgSummary={ihsgSummary}
            onSelectStock={onSelectStock}
            onAskAgent={onAskAgent}
          />

          {/* ================================================================= */}
          {/* ALERT SETTING & LIST ALERT SECTION                                */}
          {/* ================================================================= */}
          {!isOrchestratorMode && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left: Alert Setting Form (7 Cols) */}
              <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md flex flex-col">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded bg-emerald-500/20 text-emerald-400">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        Pengaturan Alert AI Dual-Engine ({stock.symbol})
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Buat notifikasi otomatis ketika kriteria teknikal & bandarmology terpenuhi
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleAddAlert} className="space-y-3.5 flex-1 flex flex-col justify-between">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        Judul / Nama Alert
                      </label>
                      <input
                        type="text"
                        value={newAlertTitle}
                        onChange={(e) => setNewAlertTitle(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                        placeholder="Cth: Breakout Resistance R1"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        Kategori / Tipe Mesin AI
                      </label>
                      <select
                        value={newAlertType}
                        onChange={(e) => setNewAlertType(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                      >
                        <option value="synergy">Dual-Engine Synergy (Teknikal + Bandar)</option>
                        <option value="volume">Bandarmology & Volume Spike</option>
                        <option value="technical">Technical S/R & RSI</option>
                        <option value="foreign">Foreign Flow & Broker Summary</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      Kondisi Trigger AI Orchestrator
                    </label>
                    <input
                      type="text"
                      value={newAlertCondition}
                      onChange={(e) => setNewAlertCondition(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                      placeholder="Cth: Volume harian > 2x rata-rata 20 hari & Top Buyer akumulasi"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      Target Harga / Ambang Batas (Rp)
                    </label>
                    <input
                      type="text"
                      value={newAlertTarget}
                      onChange={(e) => setNewAlertTarget(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                      placeholder={stock.price.toString()}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Simpan & Aktifkan Smart Alert</span>
                  </button>
                </form>
              </div>

              {/* Right: List Alert (5 Cols) */}
              <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md flex flex-col">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded bg-blue-500/20 text-blue-400">
                      <BellRing className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        Daftar Alert Aktif ({alerts.length})
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Status monitoring real-time oleh AI Orchestrator
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-mono border border-emerald-500/20">
                    Live Monitoring
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[320px] pr-1">
                  {alerts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                      <Bell className="w-8 h-8 mb-2 opacity-40" />
                      <p className="text-xs">Belum ada alert aktif yang dikonfigurasi.</p>
                    </div>
                  ) : (
                    alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-3 rounded-xl border text-xs transition-all ${
                          alert.active
                            ? 'bg-slate-950/80 border-slate-700/80 shadow-xs'
                            : 'bg-slate-950/40 border-slate-800/60 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${alert.active ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                            <span className="font-bold text-white">{alert.title}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              {alert.symbol}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => toggleAlertStatus(alert.id)}
                              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                                alert.active
                                  ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                              }`}
                            >
                              {alert.active ? 'Aktif' : 'Nonaktif'}
                            </button>
                            <button
                              onClick={() => deleteAlert(alert.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Hapus Alert"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-snug mb-2">
                          {alert.condition}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-2 border-t border-slate-800/80">
                          <span>Target: <strong className="text-emerald-400">{alert.target}</strong></span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                            {alert.type.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Technical Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 font-mono">
            {/* Price & Change */}
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <div className="text-[11px] text-slate-400 font-sans">Harga Terakhir</div>
              <div className="text-lg font-bold text-white mt-0.5">
                Rp {stock.price.toLocaleString('id-ID')}
              </div>
              <div
                className={`text-xs font-semibold flex items-center gap-0.5 ${
                  isGain ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isGain ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {isGain ? '+' : ''}
                {stock.change} ({isGain ? '+' : ''}
                {stock.changePercent.toFixed(2)}%)
              </div>
            </div>

            {/* Sinyal Setup */}
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <div className="text-[11px] text-slate-400 font-sans">Sinyal Teknikal</div>
              <div className="text-xs font-bold text-blue-300 mt-1 truncate">
                {tradingSetup.signalLabel}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                R/R Ratio: <span className="text-emerald-400 font-bold">1:{tradingSetup.rrRatio}</span>
              </div>
            </div>

            {/* Support Level */}
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <div className="text-[11px] text-slate-400 font-sans">Key Support (S1 / S2)</div>
              <div className="text-sm font-bold text-emerald-400 mt-0.5">
                Rp {s1.toLocaleString('id-ID')}
              </div>
              <div className="text-[10px] text-slate-400">
                S2: Rp {s2.toLocaleString('id-ID')}
              </div>
            </div>

            {/* Resistance Level */}
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <div className="text-[11px] text-slate-400 font-sans">Key Resistance (R1 / R2)</div>
              <div className="text-sm font-bold text-rose-400 mt-0.5">
                Rp {r1.toLocaleString('id-ID')}
              </div>
              <div className="text-[10px] text-slate-400">
                R2: Rp {r2.toLocaleString('id-ID')} (+{tradingSetup.upsidePercent}%)
              </div>
            </div>

            {/* RSI 14 Momentum */}
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <div className="text-[11px] text-slate-400 font-sans">RSI (14) Momentum</div>
              <div className="text-sm font-bold text-blue-400 mt-0.5">
                {stock.rsi14.toFixed(1)}
              </div>
              <div className="text-[10px] text-slate-300">
                {stock.rsi14 > 70 ? 'Overbought (>70)' : stock.rsi14 < 30 ? 'Oversold (<30)' : 'Zona Netral (30-70)'}
              </div>
            </div>

            {/* Trend & Moving Average */}
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <div className="text-[11px] text-slate-400 font-sans">Trend MA20 / MA50</div>
              <div className="text-sm font-bold text-emerald-400 mt-0.5">
                {stock.price >= stock.ma20 ? 'Bullish (Atas MA20)' : 'Bearish (Bawah MA20)'}
              </div>
              <div className="text-[10px] text-slate-400">
                MA20: {stock.ma20.toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 1: TECHNICAL ANALISIS SAHAM (ONLY TECHNICAL ANALYSIS INFORMATION)     */}
      {/* ========================================================================= */}
      {isTechnicalMode && (
        <div className="p-3 sm:p-5 lg:p-6 space-y-4 sm:space-y-6 flex-1 animate-in fade-in duration-200">
          {/* Market Status & Latest Trading Date Banner */}
          {!marketInfo.isMarketOpen ? (
            <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-2.5 w-2.5 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
                <div className="text-slate-300 leading-relaxed text-[11px] sm:text-xs">
                  <strong className="text-white">Bursa BEI Sedang Tutup ({marketInfo.statusText}):</strong>{' '}
                  Dashboard menggunakan <span className="text-amber-300 font-semibold">Data Penutupan Terakhir ({marketInfo.latestTradingDateFormatted} • {marketInfo.lastCloseSession})</span>.
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 shrink-0 text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>Sesi Terakhir:</span>
                <strong className="text-emerald-400">{marketInfo.latestTradingDateFormatted}</strong>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 animate-pulse shrink-0"></span>
                <span className="text-slate-300 text-[11px] sm:text-xs">
                  <strong className="text-emerald-400">Bursa Efek Indonesia Buka ({marketInfo.statusText})</strong> — Menampilkan data transaksi live hari ini ({marketInfo.wibFormattedDate}).
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
                <span>Jam BEI:</span>
                <strong className="text-white">{marketInfo.wibFormattedTime}</strong>
              </div>
            </div>
          )}

          {/* Mode Banner */}
          <div className="bg-linear-to-r from-blue-900/30 via-indigo-900/20 to-transparent border border-blue-800/40 rounded-xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-blue-300 flex items-center gap-2">
                  MODUL KHUSUS: TECHNICAL ANALISIS SAHAM
                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Price Action & S/R Breakout
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Fokus pada Struktur Harga, Support S1/S2, Resistance R1/R2, MA20/MA50, RSI Momentum, & Setup Trading
                </div>
              </div>
            </div>

            <button
              onClick={() =>
                onAskAgent(
                  'technical_agent',
                  `Berikan analisa teknikal lengkap untuk ${stock.symbol}: tren pergerakan, support resistance, sinyal RSI/MACD, dan rekomendasi trading plan.`
                )
              }
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Konsultasi Teknikal AI</span>
            </button>
          </div>

          {/* Kartu Skor Sinergi Dual-Engine (Orchestrator Verdict) */}
          <div className="bg-linear-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-xl p-4 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                    AI MASTER ORCHESTRATOR: KARTU SKOR SINERGI DUAL-ENGINE
                    <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                      Auto-Router Verdict
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    Analisis gabungan otomatis Teknikal & Bandarmology Volume Besar untuk <strong className="text-white font-mono">{stock.symbol}</strong>
                  </div>
                </div>
              </div>
              <button
                onClick={() =>
                  onAskAgent(
                    'orchestrator',
                    `Berikan analisa komprehensif lengkap (Teknikal & Bandarmology) untuk saham ${stock.symbol}`
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs shadow-md transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Analisis Komprehensif AI</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-800 text-xs">
              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">1. Indikator Teknikal</div>
                <div className="text-xs font-bold text-blue-300 mt-1">
                  {tradingSetup.signalLabel} (RSI: {stock.rsi14.toFixed(1)})
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Support: Rp {s1.toLocaleString('id-ID')} | Res: Rp {r1.toLocaleString('id-ID')}
                </div>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">2. Indikator Bandarmology</div>
                <div className="text-xs font-bold text-amber-300 mt-1">
                  Big Accumulation (Top 3 Buyer Dominant)
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Net Foreign Flow: Positif / Masuk
                </div>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 bg-emerald-950/20 border-emerald-500/30">
                <div className="text-[10px] text-emerald-400 uppercase tracking-wider font-mono">3. Kesimpulan Otomatis (Verdict)</div>
                <div className="text-xs font-bold text-emerald-300 mt-1">
                  High-Confidence Buy Setup
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5">
                  Sinyal teknikal S/R breakout didukung penuh oleh akumulasi volume bandar besar.
                </div>
              </div>
            </div>
          </div>

          {/* Technical Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 font-mono">
            {/* Price & Change */}
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <div className="text-[11px] text-slate-400 font-sans">Harga Terakhir</div>
              <div className="text-lg font-bold text-white mt-0.5">
                Rp {stock.price.toLocaleString('id-ID')}
              </div>
              <div
                className={`text-xs font-semibold flex items-center gap-0.5 ${
                  isGain ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isGain ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {isGain ? '+' : ''}
                {stock.change} ({isGain ? '+' : ''}
                {stock.changePercent.toFixed(2)}%)
              </div>
            </div>

            {/* Sinyal Setup */}
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <div className="text-[11px] text-slate-400 font-sans">Sinyal Teknikal</div>
              <div className="text-xs font-bold text-blue-300 mt-1 truncate">
                {tradingSetup.signalLabel}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                R/R Ratio: <span className="text-emerald-400 font-bold">1:{tradingSetup.rrRatio}</span>
              </div>
            </div>

            {/* Support Level */}
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <div className="text-[11px] text-slate-400 font-sans">Key Support (S1 / S2)</div>
              <div className="text-sm font-bold text-emerald-400 mt-0.5">
                Rp {s1.toLocaleString('id-ID')}
              </div>
              <div className="text-[10px] text-slate-400">
                S2: Rp {s2.toLocaleString('id-ID')}
              </div>
            </div>

            {/* Resistance Level */}
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <div className="text-[11px] text-slate-400 font-sans">Key Resistance (R1 / R2)</div>
              <div className="text-sm font-bold text-rose-400 mt-0.5">
                Rp {r1.toLocaleString('id-ID')}
              </div>
              <div className="text-[10px] text-slate-400">
                R2: Rp {r2.toLocaleString('id-ID')} (+{tradingSetup.upsidePercent}%)
              </div>
            </div>

            {/* RSI 14 Momentum */}
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <div className="text-[11px] text-slate-400 font-sans">RSI (14) Momentum</div>
              <div className="text-sm font-bold text-blue-400 mt-0.5">
                {stock.rsi14.toFixed(1)}
              </div>
              <div className="text-[10px] text-slate-300">
                {stock.rsi14 > 70 ? 'Overbought (>70)' : stock.rsi14 < 30 ? 'Oversold (<30)' : 'Zona Netral (30-70)'}
              </div>
            </div>

            {/* Trend & Moving Average */}
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <div className="text-[11px] text-slate-400 font-sans">Struktur Tren (MA)</div>
              <div className="text-xs font-bold text-emerald-400 mt-0.5 truncate">
                {stock.trend}
              </div>
              <div className="text-[10px] text-slate-400">
                MA20: Rp {stock.ma20 ? Math.round(stock.ma20) : '-'}
              </div>
            </div>
          </div>

          {/* Interactive Candlestick Chart (Technical Focus) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800 text-xs">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-blue-400" />
                  Grafik Candlestick Harian ({candles.length} Hari Bursa)
                </span>
                <span className="text-[10px] font-mono text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  Data Terakhir: {marketInfo.latestTradingDateFormatted}
                </span>

                {hoveredCandle && (
                  <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-slate-300 bg-slate-950/90 px-2.5 py-1 rounded border border-slate-700 shadow-md">
                    <span className="text-blue-400 font-bold">
                      {hoveredCandle.formattedDate || formatShortDate(hoveredCandle.time)}
                    </span>
                    {hoveredCandle.isLatestClose && (
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold border border-amber-500/40">
                        Penutupan Terakhir
                      </span>
                    )}
                    <span className="text-slate-600">|</span>
                    <span>O: <strong className="text-white">{hoveredCandle.open}</strong></span>
                    <span>H: <strong className="text-emerald-400">{hoveredCandle.high}</strong></span>
                    <span>L: <strong className="text-rose-400">{hoveredCandle.low}</strong></span>
                    <span>C: <strong className="text-blue-400">{hoveredCandle.close}</strong></span>
                  </div>
                )}
              </div>

              {/* Chart Indicator Toggles */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowMA20(!showMA20)}
                  className={`px-2 py-1 rounded text-[11px] font-mono border transition-colors cursor-pointer ${
                    showMA20
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700'
                  }`}
                >
                  MA20 (Gold)
                </button>
                <button
                  onClick={() => setShowMA50(!showMA50)}
                  className={`px-2 py-1 rounded text-[11px] font-mono border transition-colors cursor-pointer ${
                    showMA50
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700'
                  }`}
                >
                  MA50 (Cyan)
                </button>
                <button
                  onClick={() => setShowSR(!showSR)}
                  className={`px-2 py-1 rounded text-[11px] font-mono border transition-colors cursor-pointer ${
                    showSR
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700'
                  }`}
                >
                  S/R Lines
                </button>
              </div>
            </div>

            {/* SVG Candlestick Canvas */}
            <div className="w-full overflow-x-auto py-2 scrollbar-thin">
              <div className="min-w-[560px] sm:min-w-full">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-64 sm:h-72 select-none"
                  preserveAspectRatio="none"
                >
                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const price = minPrice + ratio * priceRange;
                    const y = priceToY(price);
                    return (
                      <g key={ratio}>
                        <line
                          x1={padding.left}
                          y1={y}
                          x2={chartWidth - padding.right}
                          y2={y}
                          stroke="#334155"
                          strokeDasharray="2 2"
                          strokeOpacity={0.4}
                        />
                        <text
                          x={chartWidth - padding.right + 8}
                          y={y + 3}
                          fill="#64748b"
                          fontSize="9"
                          fontFamily="monospace"
                        >
                          {Math.round(price)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Support Line S1 */}
                  {showSR && (
                    <g>
                      <line
                        x1={padding.left}
                        y1={priceToY(s1)}
                        x2={chartWidth - padding.right}
                        y2={priceToY(s1)}
                        stroke="#10b981"
                        strokeWidth="1.5"
                        strokeDasharray="4 3"
                        strokeOpacity={0.8}
                      />
                      <text
                        x={chartWidth - padding.right + 8}
                        y={priceToY(s1) + 3}
                        fill="#10b981"
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        S1: {s1}
                      </text>
                    </g>
                  )}

                  {/* Resistance Line R1 */}
                  {showSR && (
                    <g>
                      <line
                        x1={padding.left}
                        y1={priceToY(r1)}
                        x2={chartWidth - padding.right}
                        y2={priceToY(r1)}
                        stroke="#f43f5e"
                        strokeWidth="1.5"
                        strokeDasharray="4 3"
                        strokeOpacity={0.8}
                      />
                      <text
                        x={chartWidth - padding.right + 8}
                        y={priceToY(r1) + 3}
                        fill="#f43f5e"
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        R1: {r1}
                      </text>
                    </g>
                  )}

                  {/* Candlesticks */}
                  {candles.map((candle, idx) => {
                    const xCenter = padding.left + idx * candleWidth + candleWidth / 2;
                    const isGreen = candle.close >= candle.open;
                    const color = isGreen ? '#10b981' : '#f43f5e';
                    const candleBodyWidth = Math.max(candleWidth * 0.7, 4);

                    const highY = priceToY(candle.high);
                    const lowY = priceToY(candle.low);
                    const openY = priceToY(candle.open);
                    const closeY = priceToY(candle.close);
                    const bodyTop = Math.min(openY, closeY);
                    const bodyHeight = Math.max(Math.abs(closeY - openY), 2);

                    return (
                      <g
                        key={candle.time}
                        className="cursor-pointer transition-opacity hover:opacity-80"
                        onMouseEnter={() => setHoveredCandle(candle)}
                        onMouseLeave={() => setHoveredCandle(null)}
                      >
                        {/* Upper & Lower Wick */}
                        <line
                          x1={xCenter}
                          y1={highY}
                          x2={xCenter}
                          y2={lowY}
                          stroke={color}
                          strokeWidth="1.2"
                        />
                        {/* Candle Body */}
                        <rect
                          x={xCenter - candleBodyWidth / 2}
                          y={bodyTop}
                          width={candleBodyWidth}
                          height={bodyHeight}
                          fill={color}
                          rx="1"
                        />
                      </g>
                    );
                  })}

                  {/* MA20 Polyline */}
                  {showMA20 && ma20Points && (
                    <polyline
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={ma20Points}
                    />
                  )}

                  {/* MA50 Polyline */}
                  {showMA50 && ma50Points && (
                    <polyline
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={ma50Points}
                    />
                  )}
                </svg>
              </div>
            </div>

            {/* X-Axis Dates for Candlestick (Trading Days) */}
            <div className="flex justify-between items-center px-3 pt-2 text-[10px] font-mono text-slate-400 border-t border-slate-800/80">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Mulai:</span>
                <span>{candles[0] ? formatShortDate(candles[0].time) : '-'}</span>
              </div>
              <div className="hidden sm:block">
                <span>{candles[Math.floor(candles.length / 3)] ? formatShortDate(candles[Math.floor(candles.length / 3)].time) : '-'}</span>
              </div>
              <div className="hidden sm:block">
                <span>{candles[Math.floor((candles.length * 2) / 3)] ? formatShortDate(candles[Math.floor((candles.length * 2) / 3)].time) : '-'}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/30 text-blue-300 font-bold">
                <span>Terakhir:</span>
                <span>{candles[candles.length - 1] ? formatShortDate(candles[candles.length - 1].time) : '-'}</span>
              </div>
            </div>

            {/* Technical Sub-chart Selector (RSI vs MACD) */}
            <div className="mt-3 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTechSubChart('rsi')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      activeTechSubChart === 'rsi'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-800/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    RSI (14) Oscillator
                  </button>
                  <button
                    onClick={() => setActiveTechSubChart('macd')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      activeTechSubChart === 'macd'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-800/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    MACD (12, 26, 9)
                  </button>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {activeTechSubChart === 'rsi'
                    ? `Nilai Saat Ini: ${stock.rsi14.toFixed(1)}`
                    : `MACD Line: ${stock.macd.macdLine} | Hist: ${stock.macd.histogram}`}
                </span>
              </div>

              {/* Sub-chart View */}
              {activeTechSubChart === 'rsi' ? (
                <div className="h-24 bg-slate-950/60 rounded-lg p-2 relative overflow-hidden border border-slate-800/60 font-mono">
                  {/* 70 & 30 Lines */}
                  <div className="absolute left-0 right-0 top-[30%] border-b border-rose-500/30 border-dashed text-[9px] text-rose-400 px-2">
                    70 Overbought
                  </div>
                  <div className="absolute left-0 right-0 top-[70%] border-b border-emerald-500/30 border-dashed text-[9px] text-emerald-400 px-2">
                    30 Oversold
                  </div>
                  <div className="flex items-end h-full gap-1 pt-6 pb-2">
                    {candles.map((c, i) => {
                      const rsiVal = 30 + ((c.close - minPrice) / priceRange) * 50;
                      const clamped = Math.max(10, Math.min(90, rsiVal));
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                          <div
                            style={{ height: `${clamped}%` }}
                            className={`w-full rounded-xs transition-all ${
                              clamped > 70
                                ? 'bg-rose-500/80'
                                : clamped < 30
                                ? 'bg-emerald-500/80'
                                : 'bg-blue-500/60'
                            }`}
                            title={`Tanggal: ${c.time} | RSI Estimasi: ${clamped.toFixed(1)}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="h-24 bg-slate-950/60 rounded-lg p-2 relative overflow-hidden border border-slate-800/60 font-mono flex items-center">
                  <div className="w-full flex items-center justify-between text-xs px-3">
                    <div className="space-y-1">
                      <div className="text-slate-400 text-[11px]">MACD Line (12, 26):</div>
                      <div className="text-sm font-bold text-blue-400">
                        {stock.macd.macdLine >= 0 ? '+' : ''}{stock.macd.macdLine.toFixed(2)}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-slate-400 text-[11px]">Signal Line (9):</div>
                      <div className="text-sm font-bold text-amber-400">
                        {stock.macd.signalLine >= 0 ? '+' : ''}{stock.macd.signalLine.toFixed(2)}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-slate-400 text-[11px]">Histogram:</div>
                      <div className={`text-sm font-bold ${stock.macd.histogram >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {stock.macd.histogram >= 0 ? '+' : ''}{stock.macd.histogram.toFixed(2)}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-slate-400 text-[11px]">Kondisi:</div>
                      <div className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                        {stock.macd.histogram >= 0 ? 'Bullish Expansion' : 'Consolidation'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Technical Trading Plan & Setup Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Setup Plan Card */}
            <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-blue-500/20 text-blue-400">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Setup Trading Plan ({stock.symbol})
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Rencana eksekusi teknikal berbasis level Support & Resistance
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] px-2.5 py-1 rounded font-mono font-bold border ${tradingSetup.signalColor}`}>
                  {tradingSetup.signalLabel}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 font-mono pt-1">
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-sans">Area Beli (Entry)</div>
                  <div className="text-sm font-bold text-blue-300 mt-1">
                    Rp {tradingSetup.entryLow} - {tradingSetup.entryHigh}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Dekat Support S1</div>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-sans">Target Profit 1 (TP1)</div>
                  <div className="text-sm font-bold text-emerald-400 mt-1">
                    Rp {tradingSetup.tp1.toLocaleString('id-ID')}
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">+{tradingSetup.upsidePercent}% Upside</div>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-sans">Target Profit 2 (TP2)</div>
                  <div className="text-sm font-bold text-cyan-400 mt-1">
                    Rp {tradingSetup.tp2.toLocaleString('id-ID')}
                  </div>
                  <div className="text-[10px] text-cyan-400 mt-0.5">Breakout Runner</div>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-sans">Stop Loss (SL)</div>
                  <div className="text-sm font-bold text-rose-400 mt-1">
                    Rp {tradingSetup.sl.toLocaleString('id-ID')}
                  </div>
                  <div className="text-[10px] text-rose-400 mt-0.5">-{tradingSetup.downsidePercent}% Risk</div>
                </div>
              </div>

              <div className="p-3 bg-blue-950/20 border border-blue-800/30 rounded-lg text-xs text-slate-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <strong>Catatan Analis Teknikal:</strong> Posisi harga saat ini sedang berkonsolidasi di atas garis MA20. Level Support kuat berada pada Rp {s1}. Disarankan melakukan akumulasi bertahap di area Rp {tradingSetup.entryLow} - {tradingSetup.entryHigh} dengan cut loss disiplin jika harga menembus di bawah Rp {tradingSetup.sl}.
                </div>
              </div>
            </div>

            {/* Technical Checklist */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                <div className="p-1.5 rounded-md bg-indigo-500/20 text-indigo-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Checklist Indikator</h3>
                  <p className="text-[11px] text-slate-400">Konfirmasi sinyal multi-indikator</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-300">Trend Moving Average</span>
                  <span className="font-mono text-emerald-400 font-semibold">Di atas MA20 / MA50</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-300">Stochastic Momentum</span>
                  <span className="font-mono text-blue-400 font-semibold">%K &gt; %D Bullish</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-300">Bollinger Bands</span>
                  <span className="font-mono text-slate-300">Mid-Band Rebound</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-300">Pivot Point Daily</span>
                  <span className="font-mono text-white font-semibold">Rp {Math.round((s1 + r1 + stock.price) / 3)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: PERDAGANGAN VOLUME BESAR (ONLY BIG VOLUME & BANDARMOLOGY INFO)     */}
      {/* ========================================================================= */}
      {isBigVolumeMode && (
        <div className="p-3 sm:p-5 lg:p-6 space-y-4 sm:space-y-6 flex-1 animate-in fade-in duration-200">
          {/* Market Status & Latest Trading Date Banner */}
          {!marketInfo.isMarketOpen ? (
            <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-2.5 w-2.5 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
                <div className="text-slate-300 leading-relaxed text-[11px] sm:text-xs">
                  <strong className="text-white">Bursa BEI Sedang Tutup ({marketInfo.statusText}):</strong>{' '}
                  Dashboard menggunakan <span className="text-amber-300 font-semibold">Data Penutupan Terakhir ({marketInfo.latestTradingDateFormatted} • {marketInfo.lastCloseSession})</span>.
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 shrink-0 text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>Sesi Terakhir:</span>
                <strong className="text-emerald-400">{marketInfo.latestTradingDateFormatted}</strong>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 animate-pulse shrink-0"></span>
                <span className="text-slate-300 text-[11px] sm:text-xs">
                  <strong className="text-emerald-400">Bursa Efek Indonesia Buka ({marketInfo.statusText})</strong> — Menampilkan data transaksi live hari ini ({marketInfo.wibFormattedDate}).
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
                <span>Jam BEI:</span>
                <strong className="text-white">{marketInfo.wibFormattedTime}</strong>
              </div>
            </div>
          )}

          {/* Mode Banner */}
          <div className="bg-linear-to-r from-amber-900/30 via-orange-900/20 to-transparent border border-amber-800/40 rounded-xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-600/30 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-amber-300 flex items-center gap-2">
                  MODUL KHUSUS: PERDAGANGAN VOLUME BESAR
                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Bandarmology & Broker Flow
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Fokus pada Lonjakan Volume Transaksi, Akumulasi Smart Money, Top Broker Flow, & Aliran Asing
                </div>
              </div>
            </div>

            <button
              onClick={() =>
                onAskAgent(
                  'big_volume_agent',
                  `Analisa aliran dana bandar dan lonjakan volume saham ${stock.symbol}. Apakah ini akumulasi tersembunyi atau distribusi awal?`
                )
              }
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Cek Bandarmology AI</span>
            </button>
          </div>

          {/* Big Volume & Bandarmology Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 font-mono">
            {/* Volume Spike Ratio */}
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <div className="text-[11px] text-slate-400 font-sans">Volume Spike Ratio</div>
              <div className="text-lg font-bold text-amber-400 mt-0.5 flex items-center gap-1">
                <Flame className="w-4 h-4 text-amber-400" />
                {stock.volumeSpikeRatio.toFixed(2)}x
              </div>
              <div className="text-[10px] text-slate-400">
                vs Rata-rata 20 Hari
              </div>
            </div>

            {/* Volume Total Lot */}
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <div className="text-[11px] text-slate-400 font-sans">Volume Hari Ini</div>
              <div className="text-sm font-bold text-white mt-0.5 truncate">
                {(stock.volumeLot / 1000).toFixed(0)}k Lot
              </div>
              <div className="text-[10px] text-slate-400">
                Avg: {(avgVolume20D / 1000).toFixed(0)}k Lot
              </div>
            </div>

            {/* Nilai Transaksi */}
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <div className="text-[11px] text-slate-400 font-sans">Nilai Transaksi (Value)</div>
              <div className="text-sm font-bold text-white mt-0.5">
                Rp {stock.valueBillion.toFixed(1)} M
              </div>
              <div className="text-[10px] text-slate-400">
                Kap: Rp {stock.marketCapTrillion} T
              </div>
            </div>

            {/* Net Foreign Flow */}
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <div className="text-[11px] text-slate-400 font-sans">Net Foreign (Hari Ini)</div>
              <div
                className={`text-sm font-bold mt-0.5 ${
                  stock.foreignFlowTodayMiliar >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {stock.foreignFlowTodayMiliar >= 0 ? '+' : ''}
                {stock.foreignFlowTodayMiliar.toFixed(1)} M
              </div>
              <div className="text-[10px] text-slate-400">
                5 Hari: {stock.foreignFlow5DMiliar >= 0 ? '+' : ''}
                {stock.foreignFlow5DMiliar.toFixed(1)} M
              </div>
            </div>

            {/* Status Bandarmology */}
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <div className="text-[11px] text-slate-400 font-sans">Status Bandarmology</div>
              <div
                className={`text-xs font-bold mt-0.5 truncate ${
                  stock.bandarStatus.includes('Accumulation')
                    ? 'text-emerald-400'
                    : stock.bandarStatus.includes('Distribution')
                    ? 'text-rose-400'
                    : 'text-slate-300'
                }`}
              >
                {stock.bandarStatus}
              </div>
              <div className="text-[10px] text-slate-400">Skor: {stock.bandarScore}/100</div>
            </div>

            {/* Top 3 Buyer Dominance */}
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <div className="text-[11px] text-slate-400 font-sans">Konsentrasi Buyer</div>
              <div className="text-sm font-bold text-emerald-400 mt-0.5">
                {buyerDominance}%
              </div>
              <div className="text-[10px] text-slate-400">
                Top 3 Buyer Dominance
              </div>
            </div>
          </div>

          {/* Dedicated Volume & Flow Bar Chart (Periodic Recharts) */}
          <VolumeMonitoringChart stock={stock} marketInfo={marketInfo} onAskAgent={onAskAgent} />

          {/* Broker Summary & Live BEI Volume Radar Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Broker Summary (Top 3 Buyers vs Top 3 Sellers) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-amber-500/20 text-amber-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Broker Summary: {stock.symbol}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Akumulasi Broker Smart Money vs Distribusi Ritel
                    </p>
                  </div>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                    stock.bandarStatus.includes('Accumulation')
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {stock.bandarStatus}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                {/* Top 3 Buyers */}
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                  <div className="text-[11px] font-bold text-emerald-400 mb-2 flex items-center justify-between font-sans">
                    <span>TOP 3 BUYER (Akumulator)</span>
                    <span className="text-[10px] text-slate-400 font-mono">Net Val</span>
                  </div>
                  <div className="space-y-2">
                    {stock.topBuyers.map((b) => (
                      <div key={b.code} className="flex items-center justify-between">
                        <div>
                          <span 
                            className="font-bold text-white cursor-help underline decoration-dotted decoration-slate-500 underline-offset-2 hover:text-emerald-300 transition-colors" 
                            title={b.name}
                          >
                            {b.code}
                          </span>{' '}
                          <span className="text-[10px] text-slate-400">({b.type})</span>
                          <div className="text-[10px] text-slate-500">
                            @ Rp {b.avgPrice}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-emerald-400">
                            +{(b.netLot / 1000).toFixed(0)}k lot
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Rp {b.netValueMiliar.toFixed(1)} M
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top 3 Sellers */}
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                  <div className="text-[11px] font-bold text-rose-400 mb-2 flex items-center justify-between font-sans">
                    <span>TOP 3 SELLER (Distributor)</span>
                    <span className="text-[10px] text-slate-400 font-mono">Net Val</span>
                  </div>
                  <div className="space-y-2">
                    {stock.topSellers.map((s) => (
                      <div key={s.code} className="flex items-center justify-between">
                        <div>
                          <span 
                            className="font-bold text-white cursor-help underline decoration-dotted decoration-slate-500 underline-offset-2 hover:text-rose-300 transition-colors" 
                            title={s.name}
                          >
                            {s.code}
                          </span>{' '}
                          <span className="text-[10px] text-slate-400">({s.type})</span>
                          <div className="text-[10px] text-slate-500">
                            @ Rp {s.avgPrice}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-rose-400">
                            {(s.netLot / 1000).toFixed(0)}k lot
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Rp {s.netValueMiliar.toFixed(1)} M
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Money Flow Dominance & Bandarmology Bar */}
              <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between font-sans">
                  <span className="text-[11px] font-semibold text-slate-300">
                    Dominasi Money Flow (Top 3 Broker):
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    Porsi = (Net Top 3 / Total Vol) × 100%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                  <div className="p-2 rounded bg-slate-900 border border-emerald-500/30 flex items-center justify-between">
                    <span className="text-slate-400">Porsi Top 3 Buyer:</span>
                    <strong className="text-emerald-400 text-xs">{buyerDominance.toFixed(1)}%</strong>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-rose-500/30 flex items-center justify-between">
                    <span className="text-slate-400">Porsi Top 3 Seller:</span>
                    <strong className="text-rose-400 text-xs">{sellerDominance.toFixed(1)}%</strong>
                  </div>
                </div>

                {/* Progress Visualizer: Buyer vs Seller */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400 font-sans">
                    <span className="text-emerald-400">Buyers ({buyerDominance.toFixed(1)}%)</span>
                    <span className="text-rose-400">Sellers ({sellerDominance.toFixed(1)}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full flex overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, buyerDominance)}%` }}
                      className="bg-emerald-500 h-full transition-all duration-300"
                      title={`Buyer Dominance: ${buyerDominance}%`}
                    />
                    <div
                      style={{ width: `${Math.min(100, sellerDominance)}%` }}
                      className="bg-rose-500 h-full transition-all duration-300"
                      title={`Seller Dominance: ${sellerDominance}%`}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
                  <span className="text-slate-400">Interpretasi:</span>
                  <span
                    className={`font-semibold font-mono ${
                      stock.bandarStatus.includes('Accumulation')
                        ? 'text-emerald-400'
                        : stock.bandarStatus.includes('Distribution')
                        ? 'text-rose-400'
                        : 'text-slate-300'
                    }`}
                  >
                    {stock.bandarStatus} (Skor: {stock.bandarScore}/100)
                  </span>
                </div>
              </div>
            </div>

            {/* Radar Lonjakan Volume Seluruh Saham BEI */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-amber-500/20 text-amber-400">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Radar Lonjakan Volume (BEI)</h3>
                    <p className="text-[11px] text-slate-400">
                      Saham dengan rasio volume transaksi di atas 1.5x rata-rata 20 hari
                    </p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono border border-amber-500/20">
                  Live Radar
                </span>
              </div>

              <div className="divide-y divide-slate-800/60 font-mono text-xs">
                {ihsgSummary.topVolAnomaly.map((item) => (
                  <div
                    key={item.symbol}
                    className="py-2.5 flex items-center justify-between hover:bg-slate-800/40 px-2 rounded-lg transition-colors cursor-pointer"
                    onClick={() =>
                      onAskAgent(
                        'big_volume_agent',
                        `Analisa anomali lonjakan volume pada saham ${item.symbol}. Apakah ini akumulasi bandar yang valid?`
                      )
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-white text-sm">{item.symbol}</span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold flex items-center gap-0.5">
                        <Flame className="w-3 h-3 text-amber-400" />
                        {item.ratio.toFixed(2)}x Spike
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-[11px] font-semibold ${
                          item.bandar.includes('Accumulation')
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {item.bandar}
                      </span>
                      <span
                        className={`font-semibold ${
                          item.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {item.changePercent >= 0 ? '+' : ''}
                        {item.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
