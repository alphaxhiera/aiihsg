import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from 'recharts';
import { Activity, Clock, Calendar, Flame, Layers, ArrowUpRight, ArrowDownRight, Info, Zap } from 'lucide-react';
import { StockData, AgentId, CandleData } from '../types';
import { MarketInfo, formatShortDate, formatIndoDate } from '../utils/marketTime';

export type VolumePeriod = 'intraday' | 'daily' | 'weekly' | 'monthly';

interface VolumeMonitoringChartProps {
  stock: StockData;
  marketInfo: MarketInfo;
  onAskAgent: (agentId: AgentId, promptMessage: string) => void;
}

interface ChartItem {
  label: string;
  subLabel?: string;
  volumeLot: number;
  avgVolumeLot: number;
  spikeRatio: number;
  isSpike: boolean;
  price: number;
  priceChangePct: number;
  foreignNetBuyMiliar: number;
  bandarAction: 'Big Accumulation' | 'Accumulation' | 'Neutral' | 'Distribution' | 'Big Distribution';
  sessionInfo?: string;
  fullDateText?: string;
}

export const VolumeMonitoringChart: React.FC<VolumeMonitoringChartProps> = ({
  stock,
  marketInfo,
  onAskAgent,
}) => {
  const [period, setPeriod] = useState<VolumePeriod>('daily');
  const [activeTab, setActiveTab] = useState<'volume' | 'foreign'>('volume');

  // Compute dataset based on selected period
  const periodData = useMemo(() => {
    if (period === 'intraday') {
      // 12 Intraday time slots for Sesi 1 and Sesi 2
      const timeSlots = [
        { time: '09:00', session: 'Sesi 1 (Opening)', baseMult: 1.8, change: +0.8 },
        { time: '09:30', session: 'Sesi 1', baseMult: 1.2, change: +0.4 },
        { time: '10:00', session: 'Sesi 1', baseMult: 0.9, change: +0.2 },
        { time: '10:30', session: 'Sesi 1', baseMult: 0.7, change: 0 },
        { time: '11:00', session: 'Sesi 1', baseMult: 0.8, change: -0.2 },
        { time: '11:30', session: 'Sesi 1 (Pre-Closing 1)', baseMult: 1.4, change: +0.5 },
        { time: '13:30', session: 'Sesi 2 (Opening 2)', baseMult: 1.1, change: +0.3 },
        { time: '14:00', session: 'Sesi 2', baseMult: 0.8, change: +0.1 },
        { time: '14:30', session: 'Sesi 2', baseMult: 1.0, change: +0.6 },
        { time: '15:00', session: 'Sesi 2', baseMult: 1.6, change: +1.2 },
        { time: '15:30', session: 'Sesi 2 (Pre-Closing 2)', baseMult: 2.2, change: +1.5 },
        { time: '15:50', session: 'Sesi 2 (Closing)', baseMult: 2.5, change: +1.8 },
      ];

      const avgSlotVol = Math.round((stock.volumeLot || 1200000) / 12);

      return timeSlots.map((slot) => {
        const slotVol = Math.round(avgSlotVol * slot.baseMult * (0.8 + (stock.symbol.charCodeAt(0) % 5) * 0.1));
        const spikeRatio = Number((slotVol / (avgSlotVol * 1.1)).toFixed(2));
        const isSpike = spikeRatio >= 1.5;
        const price = Math.round(stock.price * (1 + slot.change / 100));

        let bandarAction: ChartItem['bandarAction'] = 'Neutral';
        if (spikeRatio >= 1.8 && slot.change > 0) bandarAction = 'Big Accumulation';
        else if (spikeRatio >= 1.3 && slot.change > 0) bandarAction = 'Accumulation';
        else if (spikeRatio >= 1.5 && slot.change < 0) bandarAction = 'Distribution';

        return {
          label: slot.time,
          subLabel: slot.session,
          volumeLot: slotVol,
          avgVolumeLot: avgSlotVol,
          spikeRatio,
          isSpike,
          price,
          priceChangePct: slot.change,
          foreignNetBuyMiliar: Number(((slotVol / 20000) * (slot.change >= 0 ? 1.2 : -1.0)).toFixed(1)),
          bandarAction,
          sessionInfo: slot.session,
          fullDateText: `Hari Ini (${marketInfo.latestTradingDateFormatted}) • Jam ${slot.time} WIB`,
        };
      });
    }

    if (period === 'weekly') {
      // 6 Weekly Aggregated bars
      const weeks = [
        { label: 'W-5', name: '5 Mgg Lalu', volMult: 0.85, priceChg: -1.2 },
        { label: 'W-4', name: '4 Mgg Lalu', volMult: 0.95, priceChg: +0.5 },
        { label: 'W-3', name: '3 Mgg Lalu', volMult: 1.15, priceChg: +2.1 },
        { label: 'W-2', name: '2 Mgg Lalu', volMult: 1.45, priceChg: +3.8 },
        { label: 'W-1', name: 'Minggu Lalu', volMult: 1.85, priceChg: +4.2 },
        { label: 'Current', name: 'Minggu Ini', volMult: 2.30, priceChg: stock.changePercent },
      ];

      const avgWeeklyVol = Math.round((stock.avgVolumeLot20D || 1000000) * 5);

      return weeks.map((w) => {
        const weeklyVol = Math.round(avgWeeklyVol * w.volMult);
        const spikeRatio = Number((weeklyVol / avgWeeklyVol).toFixed(2));
        const isSpike = spikeRatio >= 1.4;

        let bandarAction: ChartItem['bandarAction'] = 'Neutral';
        if (spikeRatio >= 1.6 && w.priceChg > 0) bandarAction = 'Big Accumulation';
        else if (spikeRatio >= 1.2 && w.priceChg > 0) bandarAction = 'Accumulation';
        else if (w.priceChg < -2) bandarAction = 'Distribution';

        return {
          label: w.label,
          subLabel: w.name,
          volumeLot: weeklyVol,
          avgVolumeLot: avgWeeklyVol,
          spikeRatio,
          isSpike,
          price: Math.round(stock.price * (1 + w.priceChg / 100)),
          priceChangePct: w.priceChg,
          foreignNetBuyMiliar: Number((stock.foreignFlow5DMiliar * w.volMult * 0.8).toFixed(1)),
          bandarAction,
          fullDateText: `Periode Mingguan: ${w.name}`,
        };
      });
    }

    if (period === 'monthly') {
      // 6 Monthly Aggregated bars
      const months = [
        { label: 'Apr', name: 'April 2026', volMult: 0.9, priceChg: +1.5 },
        { label: 'Mei', name: 'Mei 2026', volMult: 1.0, priceChg: -0.8 },
        { label: 'Jun', name: 'Juni 2026', volMult: 0.8, priceChg: -2.1 },
        { label: 'Jul', name: 'Juli 2026', volMult: 1.3, priceChg: +3.4 },
        { label: 'Agu', name: 'Agustus 2026', volMult: 1.7, priceChg: +5.2 },
        { label: 'Sep', name: 'September 2026 (MTD)', volMult: 2.1, priceChg: stock.changePercent + 4.5 },
      ];

      const avgMonthlyVol = Math.round((stock.avgVolumeLot20D || 1000000) * 20);

      return months.map((m) => {
        const monthlyVol = Math.round(avgMonthlyVol * m.volMult);
        const spikeRatio = Number((monthlyVol / avgMonthlyVol).toFixed(2));
        const isSpike = spikeRatio >= 1.3;

        let bandarAction: ChartItem['bandarAction'] = 'Neutral';
        if (m.priceChg > 3 && spikeRatio >= 1.5) bandarAction = 'Big Accumulation';
        else if (m.priceChg > 0) bandarAction = 'Accumulation';
        else bandarAction = 'Distribution';

        return {
          label: m.label,
          subLabel: m.name,
          volumeLot: monthlyVol,
          avgVolumeLot: avgMonthlyVol,
          spikeRatio,
          isSpike,
          price: Math.round(stock.price * (1 + m.priceChg / 100)),
          priceChangePct: m.priceChg,
          foreignNetBuyMiliar: Number((m.volMult * 45.0 * (m.priceChg >= 0 ? 1 : -0.8)).toFixed(1)),
          bandarAction,
          fullDateText: `Periode Makro Bulanan: ${m.name}`,
        };
      });
    }

    // Default: 'daily'
    const avgVol20D = stock.avgVolumeLot20D || 1000000;
    return (stock.candles || []).map((c) => {
      const spikeRatio = Number((c.volume / avgVol20D).toFixed(2));
      const isSpike = spikeRatio >= 1.5;
      const priceChg = Number((((c.close - c.open) / c.open) * 100).toFixed(2));

      let bandarAction: ChartItem['bandarAction'] = 'Neutral';
      if (isSpike && priceChg >= 0) bandarAction = 'Big Accumulation';
      else if (priceChg > 0 && spikeRatio >= 1.1) bandarAction = 'Accumulation';
      else if (priceChg < 0 && isSpike) bandarAction = 'Big Distribution';
      else if (priceChg < 0) bandarAction = 'Distribution';

      return {
        label: formatShortDate(c.time),
        subLabel: c.formattedDate || formatIndoDate(new Date(c.time)),
        volumeLot: c.volume,
        avgVolumeLot: avgVol20D,
        spikeRatio,
        isSpike,
        price: c.close,
        priceChangePct: priceChg,
        foreignNetBuyMiliar: c.foreignNetBuyMiliar || Number(((c.close - c.open) * (c.volume / 100000)).toFixed(1)),
        bandarAction,
        fullDateText: c.formattedDate || formatIndoDate(new Date(c.time)),
      };
    });
  }, [period, stock, marketInfo]);

  // Overall metrics summary for the selected period
  const periodSummary = useMemo(() => {
    const totalVol = periodData.reduce((acc, d) => acc + d.volumeLot, 0);
    const avgVol = Math.round(totalVol / (periodData.length || 1));
    const maxSpike = Math.max(...periodData.map((d) => d.spikeRatio), 1);
    const totalForeignMiliar = periodData.reduce((acc, d) => acc + d.foreignNetBuyMiliar, 0);
    const accumCount = periodData.filter((d) => d.bandarAction.includes('Accumulation')).length;

    let verdict = 'Netral / Konsolidasi';
    if (accumCount >= periodData.length * 0.5) verdict = 'Dominated by Smart Money (Accumulation)';
    else if (accumCount <= periodData.length * 0.2) verdict = 'Distribution Pressure';

    return { totalVol, avgVol, maxSpike, totalForeignMiliar, verdict };
  }, [periodData]);

  // Sample Intraday Time & Sales tick log
  const intradayTickLogs = useMemo(() => {
    return [
      { time: '15:48:12', lot: 18500, price: stock.price, type: 'HAKA (Big Buy)', broker: 'ZP (Maybank)', style: 'bg-emerald-500/20 text-emerald-300' },
      { time: '15:35:40', lot: 12000, price: stock.price - 10, type: 'HAKA (Buy)', broker: 'BK (JP Morgan)', style: 'bg-emerald-500/20 text-emerald-300' },
      { time: '15:12:05', lot: 8400, price: stock.price - 20, type: 'HAKI (Sell)', broker: 'YP (Ritel)', style: 'bg-rose-500/20 text-rose-300' },
      { time: '14:45:22', lot: 24000, price: stock.price - 10, type: 'HAKA (Volume Spike!)', broker: 'AK (UBS)', style: 'bg-amber-500/20 text-amber-300' },
      { time: '11:28:10', lot: 15200, price: stock.price - 30, type: 'HAKA (Buy)', broker: 'CS (Credit Suisse)', style: 'bg-emerald-500/20 text-emerald-300' },
    ];
  }, [stock]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl space-y-4">
      {/* Header & Period Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                Pemantauan Volume Transaksi Periodik ({stock.symbol})
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-normal">
                  Recharts Visualizer
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Deteksi anomali lonjakan volume, akumulasi bandar, dan arus asing per skala waktu
              </p>
            </div>
          </div>
        </div>

        {/* 4 Period Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setPeriod('intraday')}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              period === 'intraday'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Intraday (Sesi 1 & 2 / Per Menit)"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Intraday (Sesi)</span>
          </button>

          <button
            onClick={() => setPeriod('daily')}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              period === 'daily'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Harian (Daily MA20 & RVOL)"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Harian (Daily)</span>
          </button>

          <button
            onClick={() => setPeriod('weekly')}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              period === 'weekly'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Mingguan (Weekly Swing Accumulation)"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Mingguan</span>
          </button>

          <button
            onClick={() => setPeriod('monthly')}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              period === 'monthly'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Bulanan (Monthly Macro Sector Rotation)"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Bulanan</span>
          </button>
        </div>
      </div>

      {/* Period Description Card */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-2 max-w-2xl">
          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-slate-300 leading-relaxed text-[11px]">
            {period === 'intraday' && (
              <>
                <strong className="text-amber-400">Fokus Intraday (Sesi 1 & 2):</strong> Memantau lonjakan volume (*volume spike*) per interval waktu bursa. Berguna untuk mendeteksi aksi akumulasi atau distribusi mendadak oleh *smart money* pada hari ini.
              </>
            )}
            {period === 'daily' && (
              <>
                <strong className="text-amber-400">Fokus Harian (Daily):</strong> Membandingkan volume hari ini dengan rata-rata 20 hari (MA20 / Relative Volume). Lonjakan di atas 1.5x rata-rata menjadi indikator awal *breakout* atau masuknya institusi.
              </>
            )}
            {period === 'weekly' && (
              <>
                <strong className="text-amber-400">Fokus Mingguan (Weekly):</strong> Digunakan oleh *swing/position trader* untuk mengonfirmasi tren akumulasi jangka menengah dalam 5-6 minggu terakhir.
              </>
            )}
            {period === 'monthly' && (
              <>
                <strong className="text-amber-400">Fokus Bulanan (Monthly):</strong> Digunakan oleh investor jangka panjang untuk melihat rotasi sektor makro dan *Big Money Flow* antar bulan.
              </>
            )}
          </div>
        </div>

        {/* Action Button for AI Query */}
        <button
          onClick={() =>
            onAskAgent(
              'big_volume_agent',
              `Analisa tren volume transaksi ${stock.symbol} pada skala periode ${period.toUpperCase()}. Apakah terdapat indikasi akumulasi yang konsisten?`
            )
          }
          className="px-3 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/40 border border-blue-500/40 text-blue-300 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <span>Tanya AI Volume Agent ({period.toUpperCase()})</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Metric Highlights Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 block font-sans">Total Volume Periode</span>
          <strong className="text-white text-sm">
            {(periodSummary.totalVol / 1000).toLocaleString('id-ID', { maximumFractionDigits: 0 })}k Lot
          </strong>
        </div>

        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 block font-sans">Peak Volume Spike</span>
          <strong className="text-amber-400 text-sm flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            {periodSummary.maxSpike.toFixed(2)}x
          </strong>
        </div>

        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 block font-sans">Foreign Flow (Periode)</span>
          <strong
            className={`text-sm ${
              periodSummary.totalForeignMiliar >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {periodSummary.totalForeignMiliar >= 0 ? '+' : ''}
            {periodSummary.totalForeignMiliar.toFixed(1)} M
          </strong>
        </div>

        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 block font-sans">Status Money Flow</span>
          <span className="text-emerald-300 font-bold text-xs truncate block" title={periodSummary.verdict}>
            {periodSummary.verdict}
          </span>
        </div>
      </div>

      {/* Subchart View Switcher */}
      <div className="flex items-center justify-between pt-1 text-xs">
        <span className="text-slate-300 font-semibold flex items-center gap-1.5">
          <span>Visualisasi Grafik Recharts:</span>
          <span className="text-amber-400 font-mono text-[11px] uppercase">[{period}]</span>
        </span>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('volume')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'volume'
                ? 'bg-amber-600 text-white font-bold'
                : 'bg-slate-800/60 text-slate-400 hover:text-white'
            }`}
          >
            Volume Bar & Spike
          </button>
          <button
            onClick={() => setActiveTab('foreign')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'foreign'
                ? 'bg-amber-600 text-white font-bold'
                : 'bg-slate-800/60 text-slate-400 hover:text-white'
            }`}
          >
            Net Foreign Flow
          </button>
        </div>
      </div>

      {/* Recharts Chart Container */}
      <div className="h-64 sm:h-72 w-full bg-slate-950/80 rounded-xl p-3 border border-slate-800 relative font-mono">
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === 'volume' ? (
            <ComposedChart data={periodData} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as ChartItem;
                    return (
                      <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs space-y-1 z-50">
                        <div className="font-bold text-amber-300 border-b border-slate-800 pb-1 flex justify-between gap-3">
                          <span>{data.fullDateText || data.label}</span>
                          <span className="text-slate-400 font-normal">{data.subLabel}</span>
                        </div>
                        <div className="flex justify-between gap-4 text-slate-300">
                          <span>Volume:</span>
                          <strong className="text-white">{(data.volumeLot / 1000).toFixed(0)}k Lot</strong>
                        </div>
                        <div className="flex justify-between gap-4 text-slate-300">
                          <span>Rasio Spike:</span>
                          <strong className={data.isSpike ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                            {data.spikeRatio.toFixed(2)}x {data.isSpike ? '🔥 Spike!' : ''}
                          </strong>
                        </div>
                        <div className="flex justify-between gap-4 text-slate-300">
                          <span>Harga:</span>
                          <strong className="text-white">Rp {data.price.toLocaleString('id-ID')} ({data.priceChangePct >= 0 ? '+' : ''}{data.priceChangePct.toFixed(2)}%)</strong>
                        </div>
                        <div className="flex justify-between gap-4 text-slate-300 pt-1 border-t border-slate-800">
                          <span>Aksi Bandar:</span>
                          <span className={`font-semibold ${data.bandarAction.includes('Accumulation') ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {data.bandarAction}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={periodData[0]?.avgVolumeLot || 100000} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Avg Vol', fill: '#f59e0b', fontSize: 10 }} />
              <Bar dataKey="volumeLot" radius={[3, 3, 0, 0]}>
                {periodData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.isSpike
                        ? '#f59e0b' // Amber for volume spike
                        : entry.priceChangePct >= 0
                        ? '#10b981' // Green for bullish close
                        : '#f43f5e' // Red for bearish close
                    }
                  />
                ))}
              </Bar>
            </ComposedChart>
          ) : (
            <ComposedChart data={periodData} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(val) => `${val}M`} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as ChartItem;
                    return (
                      <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs space-y-1 z-50">
                        <div className="font-bold text-blue-300 border-b border-slate-800 pb-1">
                          {data.fullDateText || data.label}
                        </div>
                        <div className="flex justify-between gap-4 text-slate-300">
                          <span>Net Foreign:</span>
                          <strong className={data.foreignNetBuyMiliar >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {data.foreignNetBuyMiliar >= 0 ? '+' : ''}{data.foreignNetBuyMiliar.toFixed(1)} Miliar
                          </strong>
                        </div>
                        <div className="flex justify-between gap-4 text-slate-300">
                          <span>Estimasi Aksi:</span>
                          <span className="text-white font-medium">{data.foreignNetBuyMiliar >= 0 ? 'Foreign Inflow' : 'Foreign Outflow'}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={0} stroke="#475569" />
              <Bar dataKey="foreignNetBuyMiliar" radius={[2, 2, 0, 0]}>
                {periodData.map((entry, index) => (
                  <Cell
                    key={`foreign-cell-${index}`}
                    fill={entry.foreignNetBuyMiliar >= 0 ? '#10b981' : '#f43f5e'}
                  />
                ))}
              </Bar>
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Intraday Time & Sales Live Stream Panel (Show when period is Intraday) */}
      {period === 'intraday' && (
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
            <span className="font-bold text-amber-300 flex items-center gap-1.5 font-mono">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Time & Sales Intraday Stream (Volume Spikes)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Sensitivitas High-Frequency</span>
          </div>

          <div className="space-y-1.5 font-mono text-xs">
            {intradayTickLogs.map((log, idx) => (
              <div key={idx} className="flex items-center justify-between bg-slate-900/60 p-2 rounded border border-slate-800/80 hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px]">{log.time}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${log.style}`}>
                    {log.type}
                  </span>
                  <span className="text-white font-bold">{log.lot.toLocaleString('id-ID')} Lot</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-300">@ Rp {log.price}</span>
                  <span className="text-slate-400 text-[10px]">{log.broker}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
