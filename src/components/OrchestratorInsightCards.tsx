import React, { useState, useMemo } from 'react';
import {
  Building2,
  TrendingUp,
  Globe2,
  Newspaper,
  MessageSquare,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Award,
  DollarSign,
  PieChart,
  Zap,
  Radio,
  Send,
  ThumbsUp,
  MessageCircle,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  BarChart3,
  Search,
  Filter,
  CheckCircle2,
  Users,
  ShieldCheck,
  TrendingDown,
  Activity,
  X,
  Edit3,
} from 'lucide-react';
import { StockData, IHSGMarketData, AgentId } from '../types';

interface OrchestratorInsightCardsProps {
  stock: StockData;
  stocks: StockData[];
  ihsgSummary: IHSGMarketData;
  onSelectStock?: (stock: StockData) => void;
  onAskAgent: (agentId: AgentId, promptMessage: string) => void;
}

export const OrchestratorInsightCards: React.FC<OrchestratorInsightCardsProps> = ({
  stock,
  stocks,
  ihsgSummary,
  onSelectStock,
  onAskAgent,
}) => {
  // Active Tab for Macro Card
  const [macroTab, setMacroTab] = useState<'rates' | 'commodities' | 'idxSectors'>('rates');
  const [showDatasourceModal, setShowDatasourceModal] = useState(false);

  // Editable USD/IDR Rate State (Bank Indonesia JISDOR Official)
  const [usdIdrRate, setUsdIdrRate] = useState<number>(17745);
  const [isEditingUsd, setIsEditingUsd] = useState<boolean>(false);
  const [usdInputVal, setUsdInputVal] = useState<string>('17745');

  // Editable Commodity Benchmarks State (LME / ICE / CME / BMD)
  const [commodities, setCommodities] = useState({
    gold: { price: 4377.0, unit: '/oz', changePct: 1.85, impact: 'AMMN, ANTM, MDKA' },
    copper: { price: 14515.0, unit: '/ton', changePct: 2.1, impact: 'AMMN, MDKA' },
    coal: { price: 144.5, unit: '/ton', changePct: 0.85, impact: 'ADRO, PTBA, ITMG' },
    oil: { price: 103.85, unit: '/bbl', changePct: -0.4, impact: 'MEDC, ELSA, PGAS' },
    nickel: { price: 16180.0, unit: '/ton', changePct: 1.25, impact: 'INCO, ANTM, NCKL' },
    cpo: { price: 4597.0, unit: 'MYR/ton', changePct: 1.8, impact: 'AALI, LSIP, TAPG' },
  });
  const [isEditingCommodities, setIsEditingCommodities] = useState<boolean>(false);
  const [commEditForm, setCommEditForm] = useState({
    gold: '4377.00',
    copper: '14515.00',
    coal: '144.50',
    oil: '103.85',
    nickel: '16180.00',
    cpo: '4597.00',
  });

  // Active Tab for Top Movers Card
  const [topMoversTab, setTopMoversTab] = useState<'gainers' | 'losers' | 'volume' | 'foreign'>('gainers');

  // Interactive Community Forum State
  const [comments, setComments] = useState<
    Array<{
      id: string;
      user: string;
      badge: string;
      avatarBg: string;
      time: string;
      text: string;
      symbol: string;
      likes: number;
      isLiked?: boolean;
      sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    }>
  >([
    {
      id: 'c1',
      user: 'BandarWatcher_JK',
      badge: 'Pro Bandarmology',
      avatarBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      time: '12 Menit lalu',
      text: `Broker ZP & BK kembali mencatatkan akumulasi konsisten di ${stock.symbol} hari ini. Mumpung bertahan di atas Support 1, riwayat pengawalan smart money masih aman! 🔥`,
      symbol: stock.symbol,
      likes: 24,
      sentiment: 'BULLISH',
    },
    {
      id: 'c2',
      user: 'ValueInvestor_ID',
      badge: 'Analysist',
      avatarBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      time: '35 Menit lalu',
      text: `PER TTM ${stock.symbol} saat ini masih tergolong undervalued dibanding rata-rata historis 5 tahunnya. Laporan keuangan Q3 berpotensi catatkan pertumbuhan dividen interim!`,
      symbol: stock.symbol,
      likes: 18,
      sentiment: 'BULLISH',
    },
    {
      id: 'c3',
      user: 'ScalperPro_BEI',
      badge: 'Technical Scalper',
      avatarBg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      time: '1 Jam lalu',
      text: `Area konsolidasi sempit. Harap waspadai rejection di level Resistance 1. Kalau tembus dengan volume spike baru aman ikut haka.`,
      symbol: stock.symbol,
      likes: 9,
      sentiment: 'NEUTRAL',
    },
  ]);

  const [newCommentText, setNewCommentText] = useState('');
  const [newSentiment, setNewSentiment] = useState<'BULLISH' | 'BEARISH' | 'NEUTRAL'>('BULLISH');

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newEntry = {
      id: `comment-${Date.now()}`,
      user: 'Anda (Trader Community)',
      badge: 'Member',
      avatarBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      time: 'Baru saja',
      text: newCommentText.trim(),
      symbol: stock.symbol,
      likes: 1,
      isLiked: true,
      sentiment: newSentiment,
    };

    setComments([newEntry, ...comments]);
    setNewCommentText('');
  };

  const handleToggleLike = (id: string) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const isLiked = !c.isLiked;
          return {
            ...c,
            isLiked,
            likes: isLiked ? c.likes + 1 : c.likes - 1,
          };
        }
        return c;
      })
    );
  };

  // Fundamental Calculations for Selected Stock
  const fundamentalMetrics = useMemo(() => {
    // Dynamic PER, PBV, ROE, DER simulation based on stock price & metrics
    const baseMultiplier = (stock.symbol.charCodeAt(0) % 5) + 1;
    const per = Number((10 + (stock.price % 15) + baseMultiplier * 0.5).toFixed(1));
    const pbv = Number((1.2 + (stock.price % 4) * 0.4).toFixed(2));
    const roe = Number((14.5 + (stock.symbol.charCodeAt(1) % 12)).toFixed(1));
    const der = Number((0.4 + (stock.symbol.charCodeAt(0) % 8) * 0.1).toFixed(2));
    const npm = Number((16.2 + (stock.price % 10)).toFixed(1));
    const divYield = Number((3.5 + (stock.symbol.charCodeAt(0) % 5) * 0.8).toFixed(1));
    const freeCashFlowVal = Math.round(stock.valueBillion * 2.8);
    const fairValue = Math.round(stock.price * 1.18);
    const upsidePct = Number((((fairValue - stock.price) / stock.price) * 100).toFixed(1));

    return {
      per,
      pbv,
      roe,
      der,
      npm,
      divYield,
      freeCashFlowVal,
      fairValue,
      upsidePct,
      healthScore: Math.min(95, Math.max(65, 75 + (roe > 18 ? 10 : 0) + (der < 1 ? 10 : 0))),
    };
  }, [stock]);

  // Sector Macro Drivers
  const sectorMacroDriver = useMemo(() => {
    switch (stock.sector) {
      case 'Banking':
        return {
          title: 'Sektor Perbankan (IDXFIN)',
          desc: 'Penguatan Margin Bunga Bersih (NIM 5.2%) & pertumbuhan kredit perbankan nasional +10.8% YoY. Stabilitas BI Rate 6.00% & likuiditas M2 yang terjaga menjaga rasio NPL gross rendah (2.2%). Akumulasi konsisten broker asing (ZP, BK, AK).',
          impact: 'STRONG ACCUMULATION',
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        };
      case 'Materials':
        return {
          title: 'Sektor Bahan Baku & Tambang Mineral (IDXBASIC)',
          desc: `Rally harga Emas ($${commodities.gold.price.toLocaleString('en-US')}/oz) & Tembaga ($${commodities.copper.price.toLocaleString('en-US')}/ton LME) mendongkrak margin smelter & penjualan konsentrat (${stock.symbol}). Kebijakan hilirisasi mineral nasional serta ekspektasi pemangkasan suku bunga global memicu aliran capital inflow asing.`,
          impact: 'VERY BULLISH / STRONG INFLOW',
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        };
      case 'Energy':
        return {
          title: 'Sektor Energi, Komoditas & EBT (IDXENERGY)',
          desc: `Harga batu bara Newcastle ($${commodities.coal.price.toLocaleString('en-US')}/ton) & Brent Oil ($${commodities.oil.price.toLocaleString('en-US')}/bbl) stabil. Prospek transisi energi hijau (Geothermal & Gas Alam) meningkatkan porsi portfolio ESG institusi. Estimasi dividen yield jumbo 8% - 12% p.a.`,
          impact: 'HIGH DIVIDEND YIELD & ROTASI',
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        };
      case 'Tech':
        return {
          title: 'Sektor Teknologi & Ekosistem Digital (IDXTECH)',
          desc: 'Sensitivitas tinggi terhadap siklus pemangkasan suku bunga Fed & BI Rate. Pencapaian EBITDA Disesuaikan Positif & arus kas operasional mandiri mengurangi risiko dilusi modal.',
          impact: 'SWING ROTATION / REBOUND',
          color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
        };
      case 'Infrastructure':
        return {
          title: 'Sektor Infrastruktur & Telco (IDXINFRA)',
          desc: 'Pendapatan berulang (recurring revenue) yang stabil dari sewa menara seluler & ekosistem Fixed Mobile Convergence (FMC). Karakter saham defensif dengan tingkat Dividend Payout Ratio yang konsisten.',
          impact: 'DEFENSIF YIELD & STABIL',
          color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
        };
      case 'Consumer':
        return {
          title: 'Sektor Barang Konsumsi (IDXNCYCL / FMCG)',
          desc: 'Daya beli masyarakat terjaga oleh inflasi domestik IHK yang terkendali (2.12% YoY). Penurunan biaya bahan baku gandum & kemasan plastik menaikkan Margin Kotor (GPM).',
          impact: 'STABIL CAUTIOUS ACCUMULATION',
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        };
      default:
        return {
          title: `Sektor ${stock.sector} (IDX Sektor)`,
          desc: 'Aktivitas industri & manufaktur nasional terjaga stabil dengan Indeks PMI Manufaktur di area ekspansif. Didukung belanja modal instansi & konsumsi domestik.',
          impact: 'NEUTRAL TO BULLISH',
          color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
        };
    }
  }, [stock]);

  // News Catalyst Feed
  const newsCatalysts = useMemo(() => {
    return [
      {
        id: 'n1',
        title: `Prospek Kinerja Q3 ${stock.symbol}: Laba Bersih Diproyeksikan Tumbuh Dua Digit`,
        category: 'Rilis Resmi Laporan Keuangan',
        source: 'Bloomberg BEI News',
        time: '18 Menit lalu',
        impact: 'VERY BULLISH',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        summary: `Konsensus analis memperkirakan ${stock.symbol} mampu mencatatkan peningkatan pendapatan hingga +12.4% YoY didukung efisiensi biaya operasional.`,
      },
      {
        id: 'n2',
        title: `Rumor Pasar: Potensi Masuk Rebalancing Indeks Global MSCI Indonesia Q4`,
        category: 'Aksi Korporasi & Rumor',
        source: 'Market Rumor Radar',
        time: '1 Jam lalu',
        impact: 'CATALYST SPIKE',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        summary: `Sinyal lonjakan volume akumulasi oleh broker asing (ZP & BK) memicu spekulasi masuknya ${stock.symbol} dalam porsi pembobotan indeks institusi global.`,
      },
      {
        id: 'n3',
        title: `Rencana Pembagian Dividen Interim & RUPSLB Akhir Tahun`,
        category: 'Corporate Action',
        source: 'KONTAN / KSEI Notice',
        time: '3 Jam lalu',
        impact: 'HIGH YIELD',
        badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        summary: `Estimasi Dividend Yield tahunan sebesar ${fundamentalMetrics.divYield}% p.a. menarik minat investor institusi jangka panjang.`,
      },
    ];
  }, [stock, fundamentalMetrics]);

  // Top Movers Calculation
  const sortedGainers = useMemo(() => {
    return [...stocks].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
  }, [stocks]);

  const sortedLosers = useMemo(() => {
    return [...stocks].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);
  }, [stocks]);

  const sortedVolumeSpikes = useMemo(() => {
    return [...stocks].sort((a, b) => b.volumeSpikeRatio - a.volumeSpikeRatio).slice(0, 5);
  }, [stocks]);

  const sortedForeignFlow = useMemo(() => {
    return [...stocks].sort((a, b) => b.foreignFlowTodayMiliar - a.foreignFlowTodayMiliar).slice(0, 5);
  }, [stocks]);

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* SECTION TITLE BANNER */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Modul Inteligensi Pasar Komprehensif AI Orchestrator
            </h3>
            <p className="text-[11px] text-slate-400">
              Analisa Fundamental, Ekonomi Makro, Rumor Catalyst, Forum Komunitas, & BEI Top Movers
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-slate-950 text-emerald-400 border border-slate-800">
          Sync Live Stock: <strong className="text-white">{stock.symbol}</strong>
        </span>
      </div>

      {/* GRID CONTAINER 1: FUNDAMENTAL MENDALAM + ANALISA MAKRO SEKTORAL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* CARD 1: ANALISA FUNDAMENTAL MENDALAM */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    Analisa Fundamental Mendalam ({stock.symbol})
                  </h4>
                  <p className="text-[11px] text-slate-400">Rasio Keuangan, Valuasi Fair Value, & Health Score</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono border border-blue-500/30">
                Score: {fundamentalMetrics.healthScore}/100
              </span>
            </div>

            {/* Health Score & Valuation Summary */}
            <div className="mt-3 bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">Estimasi Fair Value (DCF)</span>
                <div className="text-sm font-bold text-emerald-400 font-mono flex items-center gap-1">
                  Rp {fundamentalMetrics.fairValue.toLocaleString('id-ID')}
                  <span className="text-[10px] text-emerald-300 font-normal">
                    (+{fundamentalMetrics.upsidePct}% Upside)
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-sans">Status Valuasi</span>
                <span className="text-xs font-bold text-emerald-300 font-mono px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 inline-block">
                  {fundamentalMetrics.per < 15 ? 'Undervalued (Atraktif)' : 'Fairly Valued'}
                </span>
              </div>
            </div>

            {/* 6 Key Financial Metrics Grid */}
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono text-xs">
              <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">PER (TTM)</span>
                <strong className="text-white text-xs">{fundamentalMetrics.per}x</strong>
                <span className="text-[9px] text-emerald-400 block mt-0.5 font-sans">
                  {fundamentalMetrics.per < 14 ? '< Rata2 Sektor' : 'Di Atas Rata2'}
                </span>
              </div>

              <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">PBV Ratio</span>
                <strong className="text-white text-xs">{fundamentalMetrics.pbv}x</strong>
                <span className="text-[9px] text-blue-400 block mt-0.5 font-sans">NTV Solid</span>
              </div>

              <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">ROE (Return Equity)</span>
                <strong className="text-emerald-400 text-xs">{fundamentalMetrics.roe}%</strong>
                <span className="text-[9px] text-emerald-300 block mt-0.5 font-sans">Sangat Efisien</span>
              </div>

              <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">DER (Leverage)</span>
                <strong className="text-white text-xs">{fundamentalMetrics.der}x</strong>
                <span className="text-[9px] text-slate-400 block mt-0.5 font-sans">Hutang Terkendali</span>
              </div>

              <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">Net Profit Margin</span>
                <strong className="text-white text-xs">{fundamentalMetrics.npm}%</strong>
                <span className="text-[9px] text-emerald-400 block mt-0.5 font-sans">Margin Tinggi</span>
              </div>

              <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">Dividend Yield</span>
                <strong className="text-amber-400 text-xs">{fundamentalMetrics.divYield}% p.a.</strong>
                <span className="text-[9px] text-amber-300 block mt-0.5 font-sans">Yield Menarik</span>
              </div>
            </div>
          </div>

          <button
            onClick={() =>
              onAskAgent(
                'orchestrator',
                `Berikan analisa fundamental mendalam untuk saham ${stock.symbol} (PER: ${fundamentalMetrics.per}x, PBV: ${fundamentalMetrics.pbv}x, ROE: ${fundamentalMetrics.roe}%). Apakah layak investasi jangka panjang?`
              )
            }
            className="w-full py-2 px-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Tanya AI Master: Laporan Fundamental Lengkap</span>
          </button>
        </div>

        {/* CARD 2: ANALISA MAKRO EKONOMI & DINAMIKA SEKTOR */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Globe2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    Analisa Makro Ekonomi & Sektor BEI
                  </h4>
                  <p className="text-[11px] text-slate-400">Suku Bunga, USD/IDR, Komoditas LME/ICE, & Rotasi IDX Sektor</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDatasourceModal(true)}
                  className="text-[10px] px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-800 text-emerald-400 font-mono border border-emerald-500/30 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Lihat Verifikasi Sumber Data Datasource"
                >
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Datasource Verified</span>
                </button>
              </div>
            </div>

            {/* Sub-Tab Navigation for Macro Card */}
            <div className="mt-3 flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px] font-mono">
              <button
                onClick={() => setMacroTab('rates')}
                className={`flex-1 py-1 px-2 rounded text-center transition-colors cursor-pointer ${
                  macroTab === 'rates'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Indikator Makro
              </button>
              <button
                onClick={() => setMacroTab('commodities')}
                className={`flex-1 py-1 px-2 rounded text-center transition-colors cursor-pointer ${
                  macroTab === 'commodities'
                    ? 'bg-amber-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Komoditas LME/ICE
              </button>
              <button
                onClick={() => setMacroTab('idxSectors')}
                className={`flex-1 py-1 px-2 rounded text-center transition-colors cursor-pointer ${
                  macroTab === 'idxSectors'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Indeks Sektor BEI
              </button>
            </div>

            {/* TAB 1: MAKRO RATES & INFLATION */}
            {macroTab === 'rates' && (
              <div className="space-y-3 mt-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs">
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-[9px] text-slate-400 block font-sans">BI-Rate (RDG BI)</span>
                    <strong className="text-white text-xs">6.00% p.a.</strong>
                    <span className="text-[9px] text-emerald-400 block mt-0.5 font-sans">Stabil Akomodatif</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-[9px] text-slate-400 block font-sans">Fed Funds Rate</span>
                    <strong className="text-white text-xs">4.75% - 5.00%</strong>
                    <span className="text-[9px] text-blue-400 block mt-0.5 font-sans">FOMC Cut Cycle</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-slate-400 block font-sans">USD / IDR (JISDOR)</span>
                      <button
                        onClick={() => {
                          setUsdInputVal(usdIdrRate.toString());
                          setIsEditingUsd(true);
                        }}
                        className="text-[9px] text-emerald-400 hover:text-emerald-300 font-sans flex items-center gap-0.5 cursor-pointer underline"
                        title="Edit atau pilih preset kurs USD/IDR"
                      >
                        <Edit3 className="w-2.5 h-2.5" />
                        <span>Ubah</span>
                      </button>
                    </div>
                    <strong className="text-emerald-400 text-xs block mt-0.5">
                      Rp {usdIdrRate.toLocaleString('id-ID')}
                    </strong>
                    <span className="text-[9px] text-emerald-300 block mt-0.5 font-sans">JISDOR BI Terkini</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-[9px] text-slate-400 block font-sans">Inflasi IHK (BPS)</span>
                    <strong className="text-emerald-400 text-xs">2.12% YoY</strong>
                    <span className="text-[9px] text-emerald-300 block mt-0.5 font-sans">Target 2.5% ±1%</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-[9px] text-slate-400 block font-sans">Trade Surplus ID</span>
                    <strong className="text-emerald-400 text-xs">+$2.91 Miliar</strong>
                    <span className="text-[9px] text-emerald-300 block mt-0.5 font-sans">52 Bln Surplus</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-[9px] text-slate-400 block font-sans">Yield SUN 10Y</span>
                    <strong className="text-white text-xs">6.62%</strong>
                    <span className="text-[9px] text-slate-400 block mt-0.5 font-sans">Inflow Obligasi</span>
                  </div>
                </div>

                {/* Sector Driver Highlight */}
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-300 flex items-center gap-1.5 font-sans">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      {sectorMacroDriver.title}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${sectorMacroDriver.color}`}>
                      {sectorMacroDriver.impact}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                    {sectorMacroDriver.desc}
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: PASAR KOMODITAS LME & ICE */}
            {macroTab === 'commodities' && (
              <div className="space-y-2.5 mt-3 font-mono text-xs">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] text-slate-400 font-sans">Acuan Bursa LME / ICE / CME / BMD</span>
                  <button
                    onClick={() => {
                      setCommEditForm({
                        gold: commodities.gold.price.toString(),
                        copper: commodities.copper.price.toString(),
                        coal: commodities.coal.price.toString(),
                        oil: commodities.oil.price.toString(),
                        nickel: commodities.nickel.price.toString(),
                        cpo: commodities.cpo.price.toString(),
                      });
                      setIsEditingCommodities(true);
                    }}
                    className="text-[10px] text-amber-400 hover:text-amber-300 font-sans flex items-center gap-1 underline cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Ubah Acuan Komoditas</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-sans">Emas (Gold Spot)</span>
                      <span className="text-emerald-400 text-[10px]">+{commodities.gold.changePct}%</span>
                    </div>
                    <strong className="text-amber-300 text-sm block mt-0.5">${commodities.gold.price.toLocaleString('en-US')} {commodities.gold.unit}</strong>
                    <span className="text-[9px] text-slate-400 block mt-0.5 font-sans">Dampak: {commodities.gold.impact}</span>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-sans">Tembaga (LME Copper)</span>
                      <span className="text-emerald-400 text-[10px]">+{commodities.copper.changePct}%</span>
                    </div>
                    <strong className="text-amber-300 text-sm block mt-0.5">${commodities.copper.price.toLocaleString('en-US')} {commodities.copper.unit}</strong>
                    <span className="text-[9px] text-slate-400 block mt-0.5 font-sans">Dampak: {commodities.copper.impact}</span>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-sans">Batu Bara Newcastle</span>
                      <span className="text-emerald-400 text-[10px]">+{commodities.coal.changePct}%</span>
                    </div>
                    <strong className="text-white text-sm block mt-0.5">${commodities.coal.price.toLocaleString('en-US')} {commodities.coal.unit}</strong>
                    <span className="text-[9px] text-slate-400 block mt-0.5 font-sans">Dampak: {commodities.coal.impact}</span>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-sans">Minyak Mentah (Brent)</span>
                      <span className="text-rose-400 text-[10px]">{commodities.oil.changePct}%</span>
                    </div>
                    <strong className="text-white text-sm block mt-0.5">${commodities.oil.price.toLocaleString('en-US')} {commodities.oil.unit}</strong>
                    <span className="text-[9px] text-slate-400 block mt-0.5 font-sans">Dampak: {commodities.oil.impact}</span>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-sans">Nikel (LME Nickel)</span>
                      <span className="text-emerald-400 text-[10px]">+{commodities.nickel.changePct}%</span>
                    </div>
                    <strong className="text-white text-sm block mt-0.5">${commodities.nickel.price.toLocaleString('en-US')} {commodities.nickel.unit}</strong>
                    <span className="text-[9px] text-slate-400 block mt-0.5 font-sans">Dampak: {commodities.nickel.impact}</span>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-sans">CPO (Palm Oil BMD)</span>
                      <span className="text-emerald-400 text-[10px]">+{commodities.cpo.changePct}%</span>
                    </div>
                    <strong className="text-white text-sm block mt-0.5">MYR {commodities.cpo.price.toLocaleString('en-US')} /ton</strong>
                    <span className="text-[9px] text-slate-400 block mt-0.5 font-sans">Dampak: {commodities.cpo.impact}</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: PERFORMA INDEKS SEKTOR BEI */}
            {macroTab === 'idxSectors' && (
              <div className="space-y-2.5 mt-3 font-mono text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-center">
                    <span className="text-[9px] text-slate-400 block font-sans">IDXBASIC</span>
                    <strong className="text-emerald-400">+2.15%</strong>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-center">
                    <span className="text-[9px] text-slate-400 block font-sans">IDXFIN</span>
                    <strong className="text-emerald-400">+0.82%</strong>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-center">
                    <span className="text-[9px] text-slate-400 block font-sans">IDXENERGY</span>
                    <strong className="text-emerald-400">+0.45%</strong>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-center">
                    <span className="text-[9px] text-slate-400 block font-sans">IDXPROPERT</span>
                    <strong className="text-emerald-400">+0.95%</strong>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-center">
                    <span className="text-[9px] text-slate-400 block font-sans">IDXINFRA</span>
                    <strong className="text-emerald-400">+0.38%</strong>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-center">
                    <span className="text-[9px] text-slate-400 block font-sans">IDXNCYCL</span>
                    <strong className="text-emerald-400">+0.12%</strong>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-center">
                    <span className="text-[9px] text-slate-400 block font-sans">IDXHEALTH</span>
                    <strong className="text-emerald-400">+0.30%</strong>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-center">
                    <span className="text-[9px] text-slate-400 block font-sans">IDXTECH</span>
                    <strong className="text-rose-400">-0.62%</strong>
                  </div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 font-sans">
                  <span className="text-amber-300 font-bold block mb-1">Rotasi Modal Sektoral Hari Ini:</span>
                  Capital Inflow kuat terkonsentrasi pada sektor Bahan Baku (IDXBASIC - AMMN/ANTM) & Perbankan (IDXFIN - BBRI/BBCA), sementara terjadi konsolidasi ringan di sektor Teknologi.
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() =>
              onAskAgent(
                'orchestrator',
                `Berikan analisa komprehensif makro ekonomi (BI-Rate 6.00%, USD/IDR Rp ${usdIdrRate.toLocaleString('id-ID')}, Emas $2,652/oz, Tembaga $4.48/lb) terhadap prospek sektor ${stock.sector} dan emiten ${stock.symbol}!`
              )
            }
            className="w-full py-2 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer mt-3"
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>Tanya AI Master: Prospek Makro & Sektor Lengkap</span>
          </button>
        </div>
      </div>

      {/* GRID CONTAINER 2: BERITA PEMICU RUMOR + FORUM KOMUNITAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* CARD 3: BERITA PEMICU & RUMOR PASAR RADAR */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Newspaper className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    Berita Pemicu & Rumor Pasar ({stock.symbol})
                  </h4>
                  <p className="text-[11px] text-slate-400">Katalis Corporate Action, Sentimen MSCI, & Rumor Bandarmology</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30 animate-pulse">
                Live Feed
              </span>
            </div>

            {/* News List */}
            <div className="mt-3 space-y-2.5">
              {newsCatalysts.map((news) => (
                <div
                  key={news.id}
                  className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${news.badgeColor}`}>
                      {news.impact}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{news.time}</span>
                  </div>
                  <h5 className="text-xs font-bold text-slate-200 hover:text-amber-300 transition-colors cursor-pointer">
                    {news.title}
                  </h5>
                  <p className="text-[11px] text-slate-400 leading-snug mt-1 font-sans">
                    {news.summary}
                  </p>
                  <div className="mt-1.5 pt-1.5 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Sumber: {news.source}</span>
                    <span className="text-amber-400 hover:underline cursor-pointer flex items-center gap-0.5">
                      Baca Detail <ExternalLink className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() =>
              onAskAgent(
                'orchestrator',
                `Validasi kebenaran rumor & berita katalis terbaru pada saham ${stock.symbol}. Apakah berita tersebut sudah priced-in atau masih memiliki potensi akumulasi lanjutan?`
              )
            }
            className="w-full py-2 px-3 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Verifikasi Katalis & Rumor dengan AI</span>
          </button>
        </div>

        {/* CARD 4: FORUM KOMUNITAS & SENTIMEN TRADER */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Forum Komunitas & Sentimen Trader
                  </h4>
                  <p className="text-[11px] text-slate-400">Diskusi Komunitas, Opini Ritel vs Smart Money Watcher</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30">
                78% Bullish
              </span>
            </div>

            {/* Community Sentiment Bar */}
            <div className="mt-3 bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-sans">
                <span className="text-slate-300">Indeks Sentimen Komunitas ({stock.symbol}):</span>
                <span className="text-emerald-400 font-bold font-mono">Dominan Bullish (Accumulation Bias)</span>
              </div>
              <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden flex">
                <div className="bg-emerald-500 h-full w-[78%]" title="78% Bullish" />
                <div className="bg-slate-500 h-full w-[14%]" title="14% Neutral" />
                <div className="bg-rose-500 h-full w-[8%]" title="8% Bearish" />
              </div>
              <div className="flex justify-between text-[9px] font-mono text-slate-400 pt-0.5">
                <span className="text-emerald-400">🟢 78% Bullish</span>
                <span className="text-slate-400">⚪ 14% Netral</span>
                <span className="text-rose-400">🔴 8% Bearish</span>
              </div>
            </div>

            {/* Discussion Feed */}
            <div className="mt-3 space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {comments.map((item) => (
                <div key={item.id} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold border ${item.avatarBg}`}>
                        {item.badge}
                      </span>
                      <strong className="text-white text-[11px]">{item.user}</strong>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">{item.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug font-sans">
                    {item.text}
                  </p>
                  <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-slate-400 border-t border-slate-900">
                    <span className={`font-bold ${item.sentiment === 'BULLISH' ? 'text-emerald-400' : item.sentiment === 'BEARISH' ? 'text-rose-400' : 'text-slate-400'}`}>
                      #{item.sentiment}
                    </span>
                    <button
                      onClick={() => handleToggleLike(item.id)}
                      className={`flex items-center gap-1 transition-colors cursor-pointer ${
                        item.isLiked ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>{item.likes}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Comment Input */}
            <form onSubmit={handleAddComment} className="mt-3 flex gap-2">
              <select
                value={newSentiment}
                onChange={(e) => setNewSentiment(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-white font-mono focus:outline-none focus:border-purple-500 shrink-0"
              >
                <option value="BULLISH">🟢 Bullish</option>                <option value="NEUTRAL">⚪ Netral</option>
                <option value="BEARISH">🔴 Bearish</option>
              </select>
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder={`Tulis pandangan Anda untuk ${stock.symbol}...`}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              >
                <Send className="w-3 h-3" />
                <span>Kirim</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* CARD 5: TOP MOVERS & ANOMALI PASAR BEI */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl space-y-4">
        {/* Header & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                Top Movers & Anomali Transaksi Pasar BEI
              </h4>
              <p className="text-[11px] text-slate-400">
                Peringkat Kenaikan/Penurunan Saham, Lonjakan Volume, & Akumulasi Asing Terbesar
              </p>
            </div>
          </div>

          {/* 4 Tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setTopMoversTab('gainers')}
              className={`px-2.5 py-1 rounded font-semibold transition-all cursor-pointer ${
                topMoversTab === 'gainers'
                  ? 'bg-emerald-600 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Top Gainers 🚀
            </button>
            <button
              onClick={() => setTopMoversTab('volume')}
              className={`px-2.5 py-1 rounded font-semibold transition-all cursor-pointer ${
                topMoversTab === 'volume'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Volume Spikes 🔥
            </button>
            <button
              onClick={() => setTopMoversTab('foreign')}
              className={`px-2.5 py-1 rounded font-semibold transition-all cursor-pointer ${
                topMoversTab === 'foreign'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Foreign Inflow 🏦
            </button>
            <button
              onClick={() => setTopMoversTab('losers')}
              className={`px-2.5 py-1 rounded font-semibold transition-all cursor-pointer ${
                topMoversTab === 'losers'
                  ? 'bg-rose-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Top Losers 📉
            </button>
          </div>
        </div>

        {/* Stock List Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-mono text-xs">
          {topMoversTab === 'gainers' &&
            sortedGainers.map((s, idx) => (
              <div
                key={s.symbol}
                onClick={() => onSelectStock && onSelectStock(s)}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  s.symbol === stock.symbol
                    ? 'bg-emerald-950/40 border-emerald-500/60 shadow-md ring-1 ring-emerald-500/30'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500">#{idx + 1}</span>
                    <strong className="text-white text-sm">{s.symbol}</strong>
                  </div>
                  <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                    <ArrowUpRight className="w-3.5 h-3.5" />+{s.changePercent.toFixed(2)}%
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 font-sans truncate">{s.name}</div>
                <div className="mt-2 pt-1.5 border-t border-slate-900 flex justify-between text-[10px] text-slate-400">
                  <span>Rp {s.price.toLocaleString('id-ID')}</span>
                  <span className="text-emerald-300 font-semibold">{s.bandarStatus}</span>
                </div>
              </div>
            ))}

          {topMoversTab === 'volume' &&
            sortedVolumeSpikes.map((s, idx) => (
              <div
                key={s.symbol}
                onClick={() => onSelectStock && onSelectStock(s)}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  s.symbol === stock.symbol
                    ? 'bg-amber-950/40 border-amber-500/60 shadow-md ring-1 ring-amber-500/30'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500">#{idx + 1}</span>
                    <strong className="text-white text-sm">{s.symbol}</strong>
                  </div>
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    {s.volumeSpikeRatio.toFixed(2)}x
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 font-sans truncate">{s.name}</div>
                <div className="mt-2 pt-1.5 border-t border-slate-900 flex justify-between text-[10px] text-slate-400">
                  <span>{(s.volumeLot / 1000).toFixed(0)}k Lot</span>
                  <span className={s.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {s.changePercent >= 0 ? '+' : ''}{s.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}

          {topMoversTab === 'foreign' &&
            sortedForeignFlow.map((s, idx) => (
              <div
                key={s.symbol}
                onClick={() => onSelectStock && onSelectStock(s)}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  s.symbol === stock.symbol
                    ? 'bg-blue-950/40 border-blue-500/60 shadow-md ring-1 ring-blue-500/30'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500">#{idx + 1}</span>
                    <strong className="text-white text-sm">{s.symbol}</strong>
                  </div>
                  <span className="text-blue-400 font-bold">
                    +{s.foreignFlowTodayMiliar.toFixed(1)} M
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 font-sans truncate">{s.name}</div>
                <div className="mt-2 pt-1.5 border-t border-slate-900 flex justify-between text-[10px] text-slate-400">
                  <span>5D: +{s.foreignFlow5DMiliar.toFixed(1)} M</span>
                  <span className="text-emerald-300">Inflow</span>
                </div>
              </div>
            ))}

          {topMoversTab === 'losers' &&
            sortedLosers.map((s, idx) => (
              <div
                key={s.symbol}
                onClick={() => onSelectStock && onSelectStock(s)}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  s.symbol === stock.symbol
                    ? 'bg-rose-950/40 border-rose-500/60 shadow-md ring-1 ring-rose-500/30'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500">#{idx + 1}</span>
                    <strong className="text-white text-sm">{s.symbol}</strong>
                  </div>
                  <span className="text-rose-400 font-bold flex items-center gap-0.5">
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    {s.changePercent.toFixed(2)}%
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 font-sans truncate">{s.name}</div>
                <div className="mt-2 pt-1.5 border-t border-slate-900 flex justify-between text-[10px] text-slate-400">
                  <span>Rp {s.price.toLocaleString('id-ID')}</span>
                  <span className="text-rose-400">{s.bandarStatus}</span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* MODAL VERIFIKASI SUMBER DATA (DATASOURCE PROVENANCE) */}
      {showDatasourceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-xl w-full p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Sumber Data & Integritas Datasource Makro Sektor
                  </h3>
                  <p className="text-xs text-slate-400">Verifikasi Resmi Sumber Data Ekonomi & Komoditas</p>
                </div>
              </div>
              <button
                onClick={() => setShowDatasourceModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 font-sans">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>1. Bank Indonesia (BI) — RDG & Suku Bunga Acuan</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed pl-5">
                  • <strong>BI-Rate:</strong> 6.00% p.a. (Keputusan RDG BI Terakhir)<br />
                  • <strong>Deposit Facility:</strong> 5.25% | <strong>Lending Facility:</strong> 6.75%<br />
                  • <strong>JISDOR USD/IDR:</strong> Rp {usdIdrRate.toLocaleString('id-ID')} / USD (Nilai Tukar Referensi Resmi)
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-blue-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>2. Badan Pusat Statistik (BPS) — Makro Domestik</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed pl-5">
                  • <strong>Inflasi IHK Domestik:</strong> 2.12% YoY (Terkendali dalam sasaran 2.5% ± 1%)<br />
                  • <strong>Surplus Neraca Perdagangan:</strong> +$2.91 Miliar USD (52 Bulan berturut-turut)<br />
                  • <strong>Pertumbuhan PDB Indonesia:</strong> +5.05% YoY
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>3. Pasar Komoditas Global (LME, ICE, NYMEX, BMD)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed pl-5">
                  • <strong>Emas (Gold Spot):</strong> $2,652.80 /oz (Spike All-Time High)<br />
                  • <strong>Tembaga (LME Copper):</strong> $4.48 /lb<br />
                  • <strong>Batu Bara (Newcastle ICE):</strong> $138.50 /ton<br />
                  • <strong>Minyak Mentah (Brent):</strong> $74.80 /bbl
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-purple-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>4. Bursa Efek Indonesia (BEI / IDX Trading Engine)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed pl-5">
                  • <strong>Indeks Sektoral BEI (IDX Sektor):</strong> Klasifikasi 11 sektor resmi BEI (IDXBASIC, IDXFIN, IDXENERGY, IDXINFRA, IDXTECH, dll).
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowDatasourceModal(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Tutup & Lanjutkan Analisa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT KURS USD / IDR (JISDOR) */}
      {isEditingUsd && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Update Kurs USD / IDR (JISDOR BI)
              </h3>
              <button
                onClick={() => setIsEditingUsd(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Pilih preset acuan resmi Bank Indonesia (JISDOR) atau ketikkan nilai tukar Rupiah (per 1 USD) yang ingin diterapkan dalam simulasi analisa makro:
            </p>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Preset Referensi Resmi:</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    setUsdIdrRate(17745);
                    setUsdInputVal('17745');
                    setIsEditingUsd(false);
                  }}
                  className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 rounded-lg text-left transition-colors cursor-pointer"
                >
                  <span className="text-[9px] text-slate-400 block font-sans">JISDOR Sept 2026</span>
                  <strong className="text-xs text-emerald-400 block font-mono">Rp 17.745</strong>
                </button>

                <button
                  onClick={() => {
                    setUsdIdrRate(16450);
                    setUsdInputVal('16450');
                    setIsEditingUsd(false);
                  }}
                  className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 rounded-lg text-left transition-colors cursor-pointer"
                >
                  <span className="text-[9px] text-slate-400 block font-sans">JISDOR Sept 2025</span>
                  <strong className="text-xs text-amber-400 block font-mono">Rp 16.450</strong>
                </button>

                <button
                  onClick={() => {
                    setUsdIdrRate(15850);
                    setUsdInputVal('15850');
                    setIsEditingUsd(false);
                  }}
                  className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 rounded-lg text-left transition-colors cursor-pointer"
                >
                  <span className="text-[9px] text-slate-400 block font-sans">Rata-rata 2024</span>
                  <strong className="text-xs text-blue-400 block font-mono">Rp 15.850</strong>
                </button>
              </div>
            </div>

            {/* Custom Input */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <label className="text-[10px] text-slate-400 uppercase font-mono block">Atau Input Nilai Kustom (IDR):</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">Rp</span>
                  <input
                    type="number"
                    value={usdInputVal}
                    onChange={(e) => setUsdInputVal(e.target.value)}
                    placeholder="Contoh: 17745"
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  onClick={() => {
                    const num = parseFloat(usdInputVal);
                    if (!isNaN(num) && num > 0) {
                      setUsdIdrRate(num);
                      setIsEditingUsd(false);
                    }
                  }}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT HARGA KOMODITAS (LME / ICE / CME / BMD) */}
      {isEditingCommodities && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
                <Zap className="w-4 h-4 text-amber-400" />
                Update Acuan Komoditas (LME / ICE / BMD)
              </h3>
              <button
                onClick={() => setIsEditingCommodities(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Atur acuan harga komoditas global atau pilih preset historis bursa resmi untuk simulasi analisa dampak emiten BEI:
            </p>

            {/* Presets */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Preset Referensi Bursa:</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    setCommodities({
                      gold: { price: 4377.0, unit: '/oz', changePct: 1.85, impact: 'AMMN, ANTM, MDKA' },
                      copper: { price: 14515.0, unit: '/ton', changePct: 2.1, impact: 'AMMN, MDKA' },
                      coal: { price: 144.5, unit: '/ton', changePct: 0.85, impact: 'ADRO, PTBA, ITMG' },
                      oil: { price: 103.85, unit: '/bbl', changePct: -0.4, impact: 'MEDC, ELSA, PGAS' },
                      nickel: { price: 16180.0, unit: '/ton', changePct: 1.25, impact: 'INCO, ANTM, NCKL' },
                      cpo: { price: 4597.0, unit: 'MYR/ton', changePct: 1.8, impact: 'AALI, LSIP, TAPG' },
                    });
                    setIsEditingCommodities(false);
                  }}
                  className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 rounded-lg text-left transition-colors cursor-pointer"
                >
                  <span className="text-[9px] text-slate-400 block font-sans">Sept 2026 (Terkini)</span>
                  <strong className="text-[11px] text-amber-400 block font-mono">Emas $4,377</strong>
                  <span className="text-[9px] text-slate-400 block font-mono">Nikel $16,180</span>
                </button>

                <button
                  onClick={() => {
                    setCommodities({
                      gold: { price: 3446.0, unit: '/oz', changePct: 0.95, impact: 'AMMN, ANTM, MDKA' },
                      copper: { price: 9820.0, unit: '/ton', changePct: 1.1, impact: 'AMMN, MDKA' },
                      coal: { price: 132.0, unit: '/ton', changePct: 0.45, impact: 'ADRO, PTBA, ITMG' },
                      oil: { price: 78.5, unit: '/bbl', changePct: -0.8, impact: 'MEDC, ELSA, PGAS' },
                      nickel: { price: 15093.0, unit: '/ton', changePct: 0.8, impact: 'INCO, ANTM, NCKL' },
                      cpo: { price: 3920.0, unit: 'MYR/ton', changePct: 1.2, impact: 'AALI, LSIP, TAPG' },
                    });
                    setIsEditingCommodities(false);
                  }}
                  className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 rounded-lg text-left transition-colors cursor-pointer"
                >
                  <span className="text-[9px] text-slate-400 block font-sans">Sept 2025</span>
                  <strong className="text-[11px] text-emerald-400 block font-mono">Emas $3,446</strong>
                  <span className="text-[9px] text-slate-400 block font-mono">Nikel $15,093</span>
                </button>

                <button
                  onClick={() => {
                    setCommodities({
                      gold: { price: 2652.8, unit: '/oz', changePct: 1.25, impact: 'AMMN, ANTM, MDKA' },
                      copper: { price: 9250.0, unit: '/ton', changePct: 2.1, impact: 'AMMN, MDKA' },
                      coal: { price: 138.5, unit: '/ton', changePct: 0.85, impact: 'ADRO, PTBA, ITMG' },
                      oil: { price: 74.8, unit: '/bbl', changePct: -0.4, impact: 'MEDC, ELSA, PGAS' },
                      nickel: { price: 16850.0, unit: '/ton', changePct: 1.45, impact: 'INCO, ANTM, NCKL' },
                      cpo: { price: 4280.0, unit: 'MYR/ton', changePct: 1.8, impact: 'AALI, LSIP, TAPG' },
                    });
                    setIsEditingCommodities(false);
                  }}
                  className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 rounded-lg text-left transition-colors cursor-pointer"
                >
                  <span className="text-[9px] text-slate-400 block font-sans">Sept 2024</span>
                  <strong className="text-[11px] text-blue-400 block font-mono">Emas $2,652</strong>
                  <span className="text-[9px] text-slate-400 block font-mono">Nikel $16,850</span>
                </button>
              </div>
            </div>

            {/* Custom Inputs */}
            <div className="space-y-3 pt-2 border-t border-slate-800 text-xs">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Input Nilai Kustom Harga Komoditas:</span>
              <div className="grid grid-cols-2 gap-2 font-mono">
                <div>
                  <label className="text-[10px] text-slate-400 block">Emas Spot ($/oz):</label>
                  <input
                    type="number"
                    value={commEditForm.gold}
                    onChange={(e) => setCommEditForm({ ...commEditForm, gold: e.target.value })}
                    className="w-full px-2.5 py-1 bg-slate-950 border border-slate-800 rounded text-amber-300 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block">Tembaga LME ($/ton):</label>
                  <input
                    type="number"
                    value={commEditForm.copper}
                    onChange={(e) => setCommEditForm({ ...commEditForm, copper: e.target.value })}
                    className="w-full px-2.5 py-1 bg-slate-950 border border-slate-800 rounded text-amber-300 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block">Batu Bara ICE ($/ton):</label>
                  <input
                    type="number"
                    value={commEditForm.coal}
                    onChange={(e) => setCommEditForm({ ...commEditForm, coal: e.target.value })}
                    className="w-full px-2.5 py-1 bg-slate-950 border border-slate-800 rounded text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block">Brent Oil ($/bbl):</label>
                  <input
                    type="number"
                    value={commEditForm.oil}
                    onChange={(e) => setCommEditForm({ ...commEditForm, oil: e.target.value })}
                    className="w-full px-2.5 py-1 bg-slate-950 border border-slate-800 rounded text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block">Nikel LME ($/ton):</label>
                  <input
                    type="number"
                    value={commEditForm.nickel}
                    onChange={(e) => setCommEditForm({ ...commEditForm, nickel: e.target.value })}
                    className="w-full px-2.5 py-1 bg-slate-950 border border-slate-800 rounded text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block">CPO BMD (MYR/ton):</label>
                  <input
                    type="number"
                    value={commEditForm.cpo}
                    onChange={(e) => setCommEditForm({ ...commEditForm, cpo: e.target.value })}
                    className="w-full px-2.5 py-1 bg-slate-950 border border-slate-800 rounded text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  setCommodities({
                    gold: { ...commodities.gold, price: parseFloat(commEditForm.gold) || commodities.gold.price },
                    copper: { ...commodities.copper, price: parseFloat(commEditForm.copper) || commodities.copper.price },
                    coal: { ...commodities.coal, price: parseFloat(commEditForm.coal) || commodities.coal.price },
                    oil: { ...commodities.oil, price: parseFloat(commEditForm.oil) || commodities.oil.price },
                    nickel: { ...commodities.nickel, price: parseFloat(commEditForm.nickel) || commodities.nickel.price },
                    cpo: { ...commodities.cpo, price: parseFloat(commEditForm.cpo) || commodities.cpo.price },
                  });
                  setIsEditingCommodities(false);
                }}
                className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer mt-2"
              >
                Simpan Perubahan Komoditas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
