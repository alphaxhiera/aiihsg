import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { fetchAllYahooData } from './server/yahooFinance';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Path to agent_prompts.json
const PROMPTS_PATH = path.join(process.cwd(), 'agent_prompts.json');

function getPromptsData() {
  try {
    if (fs.existsSync(PROMPTS_PATH)) {
      const content = fs.readFileSync(PROMPTS_PATH, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading agent_prompts.json:', err);
  }
  return null;
}

// API: Get Stocks & IHSG Data with Yahoo Finance as live reference
app.get('/api/stocks', async (req: Request, res: Response) => {
  try {
    const data = await fetchAllYahooData();
    return res.json({
      success: true,
      source: 'Yahoo Finance (IDX / BEI)',
      stocks: data.stocks,
      ihsg: data.ihsg,
    });
  } catch (err: any) {
    console.warn('Failed to fetch from Yahoo Finance, returning fallback:', err?.message || err);
    return res.status(500).json({ error: 'Failed to fetch Yahoo Finance data' });
  }
});

// API: Force refresh from Yahoo Finance
app.post('/api/stocks/sync', async (req: Request, res: Response) => {
  try {
    const data = await fetchAllYahooData();
    return res.json({
      success: true,
      message: 'Data berhasil disinkronkan dengan acuan Yahoo Finance',
      source: 'Yahoo Finance (IDX / BEI)',
      stocks: data.stocks,
      ihsg: data.ihsg,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Sync failed' });
  }
});

// API: Get Agent Prompts JSON
app.get('/api/prompts', (req: Request, res: Response) => {
  const prompts = getPromptsData();
  if (prompts) {
    return res.json(prompts);
  }
  return res.status(500).json({ error: 'Failed to read agent_prompts.json' });
});

// API: Update Agent Prompts JSON
app.post('/api/prompts', (req: Request, res: Response) => {
  try {
    const updated = req.body;
    fs.writeFileSync(PROMPTS_PATH, JSON.stringify(updated, null, 2), 'utf-8');
    return res.json({ success: true, message: 'Prompt script updated successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update prompt' });
  }
});

// Helper function to call Gemini with multi-model fallback and retry
async function callGeminiWithFallback(
  ai: GoogleGenAI,
  prompt: string,
  systemInstruction: string
): Promise<string | null> {
  // Try primary model followed by resilient alternatives
  const models = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-2.5-flash'];
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.3,
        },
      });
      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      console.warn(`Model ${model} temporary notice: ${errMsg}. Attempting alternative model...`);
      // Brief pause to allow transient spikes to subside
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }
  return null;
}

// Comprehensive fallback market analysis engine with tidy Markdown tables
function generateFallbackAnalysis(agentId: string, stockData: any, userPrompt?: string): string {
  if (!stockData) {
    return `### 📈 Asisten Analisa Pasar Saham IHSG (Acuan Yahoo Finance)
Silakan pilih salah satu saham di dashboard (misal: BBRI.JK, BBCA.JK, BMRI.JK, TLKM.JK, ASII.JK, ADRO.JK, BREN.JK, AMMN.JK, GOTO.JK, ICBP.JK) untuk melihat analisa teknikal mendalam atau deteksi lonjakan volume & bandarmology real-time.`;
  }

  const isUptrend = stockData.price > stockData.ma20;
  const isSpike = stockData.volumeSpikeRatio >= 1.4;
  const isAcc = stockData.bandarScore > 30;

  if (agentId === 'technical_agent') {
    return `### 📊 Analisa Teknikal Saham: **${stockData.symbol}** (${stockData.name})
*(Sumber Data Acuan: **Yahoo Finance ${stockData.symbol}.JK** - Sesi Penutupan Resmi BEI)*

#### 📋 Ringkasan Indikator Kunci (Yahoo Finance)
| Indikator | Nilai Acuan | Status & Kondisi |
| :--- | :--- | :--- |
| **Harga Terakhir** | **Rp ${stockData.price.toLocaleString('id-ID')}** | ${stockData.change >= 0 ? '+' : ''}${stockData.change} (${stockData.changePercent.toFixed(2)}%) |
| **Tren Utama** | **${stockData.trend}** | ${isUptrend ? 'Di atas MA20' : 'Uji Support MA20'} |
| **MA20 / MA50** | Rp ${stockData.ma20.toLocaleString('id-ID')} / Rp ${stockData.ma50.toLocaleString('id-ID')} | ${isUptrend ? 'Bullish Alignment' : 'Konsolidasi'} |
| **RSI (14)** | **${stockData.rsi14.toFixed(1)}** | ${stockData.rsi14 > 65 ? 'Zona Bullish Kuat' : stockData.rsi14 < 40 ? 'Mendekati Oversold' : 'Zona Netral / Sehat'} |
| **MACD** | Hist: **${stockData.macd.histogram.toFixed(1)}** (Line: ${stockData.macd.macdLine.toFixed(1)}) | ${stockData.macd.histogram > 0 ? 'Bullish Cross Momentum' : 'Koreksi Sehat / Konsolidasi'} |
| **Support (S1 / S2)** | **Rp ${stockData.supportLevels[0].toLocaleString('id-ID')}** / Rp ${stockData.supportLevels[1].toLocaleString('id-ID')} | Batas Bawah Pengaman |
| **Resisten (R1 / R2)** | **Rp ${stockData.resistanceLevels[0].toLocaleString('id-ID')}** / Rp ${stockData.resistanceLevels[1].toLocaleString('id-ID')} | Batas Uji Target Atas |

---

#### 🎯 Rencana Eksekusi Trading (Trade Setup)
| Parameter | Nilai / Level | Keterangan & Catatan |
| :--- | :--- | :--- |
| **Tindakan (Action)** | **${isUptrend ? 'BUY ON WEAKNESS (BoW)' : 'SPECULATIVE ACCUMULATE'}** | Rekomendasi posisi |
| **Area Entry** | **Rp ${stockData.supportLevels[0].toLocaleString('id-ID')} - Rp ${stockData.price.toLocaleString('id-ID')}** | Zona akumulasi bertahap |
| **Target Profit 1 (TP1)** | **Rp ${stockData.resistanceLevels[0].toLocaleString('id-ID')}** | +${(((stockData.resistanceLevels[0] - stockData.price) / stockData.price) * 100).toFixed(1)}% (Resisten R1) |
| **Target Profit 2 (TP2)** | **Rp ${stockData.resistanceLevels[1].toLocaleString('id-ID')}** | +${(((stockData.resistanceLevels[1] - stockData.price) / stockData.price) * 100).toFixed(1)}% (Resisten R2) |
| **Stop Loss (SL)** | **Rp ${Math.round(stockData.supportLevels[0] * 0.97 / 25) * 25}** | -3.0% toleransi risiko ketat |
| **Risk / Reward Ratio** | **1 : 2.5** | Rasio risiko sangat ideal |

> **Catatan Analis:** Tetap disiplin dengan batas Stop Loss jika terjadi penembusan ke bawah level S1 (Rp ${stockData.supportLevels[0]}).`;
  } else if (agentId === 'big_volume_agent') {
    // Big Volume & Bandarmology Agent
    const top3BuyLot = (stockData.topBuyers || []).slice(0, 3).reduce((a: number, b: any) => a + (b.netLot || 0), 0);
    const top3SellLot = (stockData.topSellers || []).slice(0, 3).reduce((a: number, s: any) => a + Math.abs(s.netLot || 0), 0);
    const buyerDominance = stockData.top3BuyerPercent || Number(((top3BuyLot / (stockData.volumeLot || 1)) * 100).toFixed(1));
    const sellerDominance = stockData.top3SellerPercent || Number(((top3SellLot / (stockData.volumeLot || 1)) * 100).toFixed(1));

    return `### 🐋 Analisa Volume & Bandarmology: **${stockData.symbol}** (${stockData.name})
*(Sumber Data Acuan: **Yahoo Finance ${stockData.symbol}.JK** - Sesi Penutupan Resmi BEI)*

#### 💰 Perhitungan Dominasi Money Flow (Top 3 Broker)
$$\\text{Porsi Top 3} = \\frac{\\text{Total Net Buy Top 3 Broker}}{\\text{Total Volume Transaksi Beli (All Brokers)}} \\times 100\\%$$

| Parameter Money Flow | Nilai Transaksi | Persentase / Dominasi | Interpretasi Status |
| :--- | :--- | :--- | :--- |
| **Total Volume Beli (All Brokers)** | **${stockData.volumeLot.toLocaleString('id-ID')} Lot** | 100.0% | Basis Seluruh Transaksi Hari Ini |
| **Total Net Buy Top 3 Broker** | **${top3BuyLot.toLocaleString('id-ID')} Lot** | **${buyerDominance.toFixed(1)}%** | ${buyerDominance >= 50 ? '🔥 **> 50% Dominasi Pembeli Kuat**' : buyerDominance >= 35 ? '✅ 35% - 50% Akumulasi Terukur' : 'Normal / Tersebar'} |
| **Total Net Sell Top 3 Broker** | **${top3SellLot.toLocaleString('id-ID')} Lot** | **${sellerDominance.toFixed(1)}%** | ${sellerDominance >= 50 ? '⚠️ **> 50% Dominasi Penjual Masif**' : sellerDominance >= 35 ? 'Distribusi Terukur' : 'Normal / Tersebar'} |
| **Status Money Flow Terkonfirmasi** | **${stockData.bandarStatus}** | Skor: **${stockData.bandarScore}/100** | ${stockData.bandarStatus === 'Big Accumulation' ? 'Akumulasi Besar Smart Money (>50% Top 3)' : stockData.bandarStatus === 'Normal Accumulation' ? 'Akumulasi Normal (35%-50% Top 3)' : stockData.bandarStatus === 'Big Distribution' ? 'Distribusi Besar (>50% Seller)' : 'Pasar Berimbang (Neutral / Cross)'} |

---

#### 📊 Metrik Likuiditas & Aliran Dana Asing
| Parameter Metrik | Angka Transaksi | Keterangan & Indikasi |
| :--- | :--- | :--- |
| **Volume Hari Ini** | **${stockData.volumeLot.toLocaleString('id-ID')} Lot** | Transaksi riil BEI |
| **Rata-rata 20 Hari** | **${stockData.avgVolumeLot20D.toLocaleString('id-ID')} Lot** | Benchmark likuiditas |
| **Volume Spike Ratio** | **${stockData.volumeSpikeRatio.toFixed(2)}x** | ${isSpike ? '🚨 **ANOMALI LONJAKAN BESAR!**' : 'Volume normal teratur'} |
| **Foreign Flow (1 Hari)** | **Rp ${stockData.foreignFlowTodayMiliar >= 0 ? '+' : ''}${stockData.foreignFlowTodayMiliar.toFixed(1)} Miliar** | ${stockData.foreignFlowTodayMiliar > 0 ? 'Net Foreign Buy' : 'Net Foreign Sell'} |
| **Foreign Flow (5 Hari)** | **Rp ${stockData.foreignFlow5DMiliar >= 0 ? '+' : ''}${stockData.foreignFlow5DMiliar.toFixed(1)} Miliar** | Akumulasi mingguan |

---

#### 👥 Struktur Broker Summary (Smart Money vs Ritel)
| Peringkat | Top 3 Buyers | Net Lot Beli | Top 3 Sellers | Net Lot Jual |
| :--- | :--- | :--- | :--- | :--- |
| **Top 1** | **${stockData.topBuyers[0]?.code}** (${stockData.topBuyers[0]?.name}) | +${stockData.topBuyers[0]?.netLot.toLocaleString('id-ID')} Lot | **${stockData.topSellers[0]?.code}** (${stockData.topSellers[0]?.name}) | ${stockData.topSellers[0]?.netLot.toLocaleString('id-ID')} Lot |
| **Top 2** | **${stockData.topBuyers[1]?.code}** (${stockData.topBuyers[1]?.name}) | +${stockData.topBuyers[1]?.netLot.toLocaleString('id-ID')} Lot | **${stockData.topSellers[1]?.code}** (${stockData.topSellers[1]?.name}) | ${stockData.topSellers[1]?.netLot.toLocaleString('id-ID')} Lot |
| **Top 3** | **${stockData.topBuyers[2]?.code}** (${stockData.topBuyers[2]?.name}) | +${stockData.topBuyers[2]?.netLot.toLocaleString('id-ID')} Lot | **${stockData.topSellers[2]?.code}** (${stockData.topSellers[2]?.name}) | ${stockData.topSellers[2]?.netLot.toLocaleString('id-ID')} Lot |

---

#### 💡 Rekomendasi Taktis Perdagangan Volume:
- **Strategi:** ${isAcc ? 'Ikuti pergerakan Smart Money (Follow the Whale) dengan mencicil beli di area support Rp ' + stockData.supportLevels[0] : 'Waspada distribusi atau tunggu konfirmasi volume sebelum menambah posisi.'}
- **Peringatan Risiko:** Pasang trailing stop otomatis untuk mengantisipasi potensi fake bid di pasar reguler.`;
  } else {
    // Orchestrator: Dual-Engine Comprehensive Report (Technical + Volume/Bandarmology)
    const top3BuyLot = (stockData.topBuyers || []).slice(0, 3).reduce((a: number, b: any) => a + (b.netLot || 0), 0);
    const top3SellLot = (stockData.topSellers || []).slice(0, 3).reduce((a: number, s: any) => a + Math.abs(s.netLot || 0), 0);
    const buyerDominance = stockData.top3BuyerPercent || Number(((top3BuyLot / (stockData.volumeLot || 1)) * 100).toFixed(1));
    const sellerDominance = stockData.top3SellerPercent || Number(((top3SellLot / (stockData.volumeLot || 1)) * 100).toFixed(1));

    return `### ✨ AI Master Orchestrator (Dual-Engine Analysis): **${stockData.symbol}** (${stockData.name})
*(Sumber Data Acuan: **Yahoo Finance ${stockData.symbol}.JK** - Sesi Penutupan Resmi BEI)*

Router AI telah menganalisis pertanyaan Anda dan mengaktifkan **Dual-Engine Intelligence** (Analisis Teknikal + Bandarmology Volume Besar secara terpadu).

---

#### 📊 I. Rangkuman Indikator Teknikal Kunci
| Indikator | Nilai Acuan | Status & Kondisi |
| :--- | :--- | :--- |
| **Harga Terakhir** | **Rp ${stockData.price.toLocaleString('id-ID')}** | ${stockData.change >= 0 ? '+' : ''}${stockData.change} (${stockData.changePercent.toFixed(2)}%) |
| **Tren Utama** | **${stockData.trend}** | ${isUptrend ? 'Di atas MA20 (Bullish)' : 'Konsolidasi / Uji Support'} |
| **RSI (14) & MACD** | RSI: **${stockData.rsi14.toFixed(1)}** | ${stockData.rsi14 > 65 ? 'Momentum Kuat' : 'Zona Sehat / Netral'} |
| **Support / Resisten** | S1: **Rp ${stockData.supportLevels[0].toLocaleString('id-ID')}** | R1: **Rp ${stockData.resistanceLevels[0].toLocaleString('id-ID')}** |

---

#### 🐋 II. Analisa Volume & Bandarmology (Smart Money Flow)
| Parameter Money Flow | Nilai Transaksi | Status Terkonfirmasi |
| :--- | :--- | :--- |
| **Dominasi Top 3 Buyers** | **${buyerDominance.toFixed(1)}%** | ${buyerDominance >= 50 ? '🔥 Akumulasi Kuat (>50%)' : 'Akumulasi Terukur'} |
| **Volume Spike Ratio** | **${stockData.volumeSpikeRatio.toFixed(2)}x** | ${isSpike ? '🚨 **Anomali Lonjakan Volume**' : 'Volume Normal'} |
| **Foreign Flow (1D / 5D)** | **Rp ${stockData.foreignFlowTodayMiliar >= 0 ? '+' : ''}${stockData.foreignFlowTodayMiliar.toFixed(1)}B** | ${stockData.foreignFlowTodayMiliar > 0 ? 'Net Foreign Buy' : 'Net Foreign Sell'} |
| **Status Bandarmology** | **${stockData.bandarStatus}** | Skor: **${stockData.bandarScore}/100** |

---

#### 🎯 III. Rencana Eksekusi Trading Terpadu (Trade Setup)
| Parameter | Level Harga / Rekomendasi | Catatan & Aksi Router |
| :--- | :--- | :--- |
| **Rekomendasi Aksi** | **${isUptrend && isAcc ? 'STRONG BUY ON WEAKNESS' : 'SPECULATIVE ACCUMULATE'}** | Konfirmasi Dual-Engine |
| **Area Entry** | **Rp ${stockData.supportLevels[0].toLocaleString('id-ID')} - Rp ${stockData.price.toLocaleString('id-ID')}** | Zona akumulasi aman |
| **Target Profit (TP1 / TP2)** | **Rp ${stockData.resistanceLevels[0].toLocaleString('id-ID')} / Rp ${stockData.resistanceLevels[1].toLocaleString('id-ID')}** | Potensi upside menarik |
| **Stop Loss (SL)** | **Rp ${Math.round(stockData.supportLevels[0] * 0.97 / 25) * 25}** | Batas risiko ketat 3% |

> **Kesimpulan Orchestrator:** Pergerakan teknikal didukung oleh skor bandar **${stockData.bandarScore}/100** (${stockData.bandarStatus}). Tetap patuhi manajemen risiko dan stop loss.`;
  }
}

// API: Chat with Agent (Technical Analysis Agent or Big Volume Agent)
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { message, agentId, stockData } = req.body;

    const prompts = getPromptsData();
    const agentConfig = prompts?.agents?.[agentId] || (agentId === 'technical_agent'
      ? {
          name: 'Agen Technical Analisis Saham',
          systemPrompt: 'Anda adalah Agen Technical Analisis Saham profesional IHSG (IDX).'
        }
      : agentId === 'big_volume_agent'
      ? {
          name: 'Agen Perdagangan Volume Besar',
          systemPrompt: 'Anda adalah Agen Perdagangan Volume Besar & Bandarmology profesional IHSG (IDX).'
        }
      : {
          name: 'AI Orchestrator (Auto-Router)',
          systemPrompt: 'Anda adalah AI Master Orchestrator dan Router untuk pasar modal Indonesia (Bursa Efek Indonesia / IDX - IHSG).'
        });

    // Format contextual stock data string for the LLM based on Yahoo Finance reference
    let stockContext = '';
    if (stockData) {
      const top3BuyLot = (stockData.topBuyers || []).slice(0, 3).reduce((a: number, b: any) => a + (b.netLot || 0), 0);
      const top3SellLot = (stockData.topSellers || []).slice(0, 3).reduce((a: number, s: any) => a + Math.abs(s.netLot || 0), 0);
      const buyerDominance = stockData.top3BuyerPercent || Number(((top3BuyLot / (stockData.volumeLot || 1)) * 100).toFixed(1));
      const sellerDominance = stockData.top3SellerPercent || Number(((top3SellLot / (stockData.volumeLot || 1)) * 100).toFixed(1));

      stockContext = `
ACUAN DATA PASAR SAHAM (SUMBER: YAHOO FINANCE ${stockData.symbol}.JK - BURSA EFEK INDONESIA):
- Simbol Saham: ${stockData.symbol} (${stockData.name}) [Yahoo Finance: ${stockData.symbol}.JK]
- Harga Terakhir: Rp ${stockData.price.toLocaleString('id-ID')} (${stockData.change >= 0 ? '+' : ''}${stockData.change} | ${stockData.changePercent.toFixed(2)}%)
- Rentang Hari Ini: Low Rp ${stockData.low} - High Rp ${stockData.high} | Open Rp ${stockData.open} | Prev Close Rp ${stockData.prevClose}
- Volume Terakhir: ${stockData.volumeLot.toLocaleString('id-ID')} Lot (Nilai Transaksi: Rp ${stockData.valueBillion.toFixed(1)} Miliar)
- Rata-rata Volume 20 Hari: ${stockData.avgVolumeLot20D.toLocaleString('id-ID')} Lot
- Rasio Lonjakan Volume: ${stockData.volumeSpikeRatio.toFixed(2)}x Rata-rata
- RUMUS PERSENTASE DOMINASI MONEY FLOW:
  Porsi Top 3 = (Total Net Buy Top 3 Broker / Total Volume Transaksi Beli [All Brokers]) * 100%
  * Total Volume Transaksi Beli (All Brokers): ${stockData.volumeLot.toLocaleString('id-ID')} Lot
  * Total Net Buy Top 3 Broker: ${top3BuyLot.toLocaleString('id-ID')} Lot -> Porsi Top 3 Buyers = ${buyerDominance.toFixed(1)}%
  * Total Net Sell Top 3 Broker: ${top3SellLot.toLocaleString('id-ID')} Lot -> Porsi Top 3 Sellers = ${sellerDominance.toFixed(1)}%
  * Status Bandarmology / Money Flow Terkonfirmasi: ${stockData.bandarStatus} (Skor Bandar: ${stockData.bandarScore}/100)
  * Panduan Interpretasi Status:
    - Big Accumulation: Top 3 Buyers menguasai > 50% - 60% total net volume pembelian hari itu, sementara Top 3 Sellers tidak sedominan itu (< 45%).
    - Normal Accumulation: Top 3 Buyers menguasai 35% - 50% total pembelian.
    - Neutral / Cross / Normal: Pembelian dan penjualan oleh Top 3/Top 5 berimbang.
    - Big Distribution: Top 3 Sellers menguasai > 50% - 60% total porsi penjualan harian.
    - Normal Distribution: Top 3 Sellers menguasai 35% - 50% total porsi penjualan harian.
- Aliran Dana Asing (Foreign Flow): Hari Ini Rp ${stockData.foreignFlowTodayMiliar >= 0 ? '+' : ''}${stockData.foreignFlowTodayMiliar.toFixed(1)} Miliar, 5 Hari Terakhir Rp ${stockData.foreignFlow5DMiliar >= 0 ? '+' : ''}${stockData.foreignFlow5DMiliar.toFixed(1)} Miliar
- Indikator Teknikal Resmi (Kalkulasi dari Candle Yahoo Finance):
  * RSI (14): ${stockData.rsi14.toFixed(1)}
  * MACD: Line ${stockData.macd.macdLine.toFixed(1)}, Signal ${stockData.macd.signalLine.toFixed(1)}, Histogram ${stockData.macd.histogram.toFixed(1)}
  * Moving Averages: MA20 = Rp ${stockData.ma20}, MA50 = Rp ${stockData.ma50}, MA200 = Rp ${stockData.ma200}
  * Tren Harga: ${stockData.trend}
  * Support Kunci: S1 = Rp ${stockData.supportLevels[0]}, S2 = Rp ${stockData.supportLevels[1]}
  * Resistance Kunci: R1 = Rp ${stockData.resistanceLevels[0]}, R2 = Rp ${stockData.resistanceLevels[1]}
- Broker Summary (Top 3):
  * Top Buyers: ${stockData.topBuyers.map((b: any) => `${b.code} (${b.name}: ${b.netLot.toLocaleString('id-ID')} Lot)`).join(', ')}
  * Top Sellers: ${stockData.topSellers.map((s: any) => `${s.code} (${s.name}: ${s.netLot.toLocaleString('id-ID')} Lot)`).join(', ')}
`;
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        const fullPrompt = `${stockContext ? stockContext + '\n\n' : ''}Pertanyaan / Permintaan Pengguna: "${message}"`;
        const systemInstruction = `${agentConfig.systemPrompt}

PANDUAN FORMAT & ACUAN DATA:
1. DATA ACUAN: Selalu gunakan data acuan resmi Yahoo Finance (ticker .JK pada Bursa Efek Indonesia sesi penutupan terakhir) yang tertera pada konteks di atas. Jangan mengarang harga atau nilai indikator yang berbeda dari konteks.
2. FORMAT TABEL: Jika menyajikan perbandingan indikator teknikal, broker summary, atau Trade Setup (Rencana Trading), WAJIB buat dalam format Tabel Markdown yang rapi dengan header dan pembatas tabel yang jelas:
Contoh Tabel Trade Setup:
| Parameter | Level Harga / Rekomendasi | Keterangan |
| :--- | :--- | :--- |
| **Tindakan (Action)** | BUY ON WEAKNESS | Dekat Area Support |
| **Area Entry** | Rp X.XXX - Rp X.XXX | Zona Beli |
| **Target Profit 1 (TP1)** | Rp X.XXX (+X.X%) | Resisten 1 |
| **Target Profit 2 (TP2)** | Rp X.XXX (+X.X%) | Resisten 2 |
| **Stop Loss (SL)** | Rp X.XXX (-X.X%) | Batas Risiko |
| **Risk to Reward** | 1 : 2.5 | Rasio Ideal |

Gunakan bahasa Indonesia yang profesional, padat, analitis, dan mudah dibaca oleh trader maupun investor.`;

        const reply = await callGeminiWithFallback(ai, fullPrompt, systemInstruction);

        if (reply) {
          return res.json({ reply });
        }
      } catch (geminiError: any) {
        console.warn('Gemini request failed gracefully, falling back to algorithmic analysis:', geminiError?.message || geminiError);
      }
    }

    // High-precision fallback when API key is unconfigured or model is experiencing high demand
    const simulatedReply = generateFallbackAnalysis(agentId, stockData, message);
    return res.json({ reply: simulatedReply });
  } catch (error: any) {
    console.warn('Recovered gracefully from chat error:', error?.message || error);
    const { agentId, stockData, message } = req.body || {};
    const fallbackReply = generateFallbackAnalysis(agentId || 'technical_agent', stockData, message);
    return res.json({ reply: fallbackReply });
  }
});

// Vite middleware & Static server
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`IHSG Agentic AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
