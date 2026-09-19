# Dokumentasi Sumber Data & Integritas Datasource (Datasource Provenance)

Dokumen ini berisi daftar lengkap seluruh sumber data (*datasources*), parameter referensi, serta metode pengolahan data yang digunakan di dalam aplikasi **AI Stock Orchestrator & Trading Dashboard**.

---

## 1. Pasar Saham Domestik (Bursa Efek Indonesia / BEI - IDX)

* **Institusi Acuan**: Bursa Efek Indonesia (Indonesia Stock Exchange / IDX)
* **Kategori Data**:
  * **Running Trade & Market Depth**: Harga Saham (*Last Price*), Perubahan (*Change & Change %*), Harga Tertinggi/Terendah (*High/Low*), Harga Pembukaan (*Open*), Penutupan Sebelumnya (*Previous Close*), dan Total Volume (*Lot & Value Miliar IDR*).
  * **Klasifikasi Sektoral (IDX Sektor)**: 11 Sektor Resmi BEI (`IDXFIN`, `IDXBASIC`, `IDXENERGY`, `IDXINFRA`, `IDXTECH`, `IDXPROPERT`, `IDXNCYCL`, `IDXHEALTH`, dll.).
  * **Top Movers & Anomali**: *Top Gainers*, *Top Losers*, *Volume Spikes (RVOL)*, dan *Top Foreign Net Inflow/Outflow*.
* **Jadwal Sesi Perdagangan BEI**:
  * **Sesi I**: Senin – Kamis (09:00 – 12:00 WIB) | Jumat (09:00 – 11:30 WIB)
  * **Sesi II**: Senin – Kamis (13:30 – 15:50 WIB) | Jumat (14:00 – 15:50 WIB)
  * **Pre-Opening / Pre-Closing**: 08:45 – 08:55 WIB & 15:50 – 16:00 WIB

---

## 2. Analisa Bandarmology & Flow Pasar Modal (Broker Summary)

* **Metode Acuan**: Broker Summary & Top Buyer/Seller Concentration Analysis
* **Kategori Data**:
  * **Akumulasi vs Distribusi**: Persentase kepemilikan & transaksi oleh Top 1, Top 3, dan Top 5 Broker (Top Buyer vs Top Seller).
  * **Foreign Flow Tracking**: Transaksi *Net Foreign Buy / Sell* harian dan 5-Hari akumulasi dalam Satuan Miliar IDR.
  * **Kategori Broker**:
    * **Asing (F)**: Broker dengan kode asing terkemuka (misal: `ZP`, `BK`, `AK`, `CS`, `KZ`).
    * **Domestik Institusi (D)**: Broker institusi lokal (misal: `OD`, `NI`, `PD`).
    * **Ritel Domestik (R)**: Broker ritel populer (misal: `YP`, `CC`, `XL`).
  * **Status Sintesis Bandarmology**: *Big Accumulation*, *Normal Accumulation*, *Neutral*, *Normal Distribution*, dan *Big Distribution*.

---

## 3. Pemantauan Volume Periodik (Periodic Volume Monitoring)

* **Metode & Indikator**: Volume Spike Engine & Relative Volume Ratio (RVOL)
* **Kategori Timeframe**:
  * **Intraday (Sesi / Menit)**: Distribusi volume berdasarkan waktu perdagangan jam bursa Sesi 1 & Sesi 2, dilengkapi *Time & Sales Live Stream* pencatatan HAKA (Hit Right) vs HAKI (Hit Left).
  * **Harian (Daily)**: Komparasi Volume harian terhadap **20-Day Moving Average Volume (MA20)**.
  * **Mingguan (Weekly)**: Aggregasi volume per-minggu untuk pemantauan tren swing/medium-term.
  * **Bulanan (Monthly)**: Aggregasi volume 6-bulan untuk pemantauan alokasi modal makro/posisi jangka panjang.
* **Deteksi Spike**:
  * **Normal**: RVOL < 1.3x MA20 Volume
  * **Sedang**: RVOL 1.3x – 1.8x MA20 Volume
  * **Volume Spike Tinggi (Anomali)**: RVOL ≥ 2.0x MA20 Volume (Ditandai warna emas/amber & simbol 🔥)

---

## 4. Indikator Makro Ekonomi Domestik & Global

* **Institusi Resmi**: Bank Indonesia (BI), Badan Pusat Statistik (BPS), & Federal Reserve (US Fed)
* **Parameter Data**:
  * **BI-Rate (Suku Bunga Acuan BI)**: **6.00% p.a.** (Hasil RDG Bank Indonesia)
    * *Deposit Facility*: **5.25%** | *Lending Facility*: **6.75%**
  * **JISDOR USD/IDR (Jakarta Interbank Spot Dollar Rate)**: **Rp 17.745 / USD** (Dapat disimulasikan & diubah pengguna)
  * **Fed Funds Rate (FFR)**: **4.75% – 5.00%** (FOMC Rate Cut Cycle)
  * **Inflasi Indeks Harga Konsumen (IHK BPS)**: **2.12% YoY** (Terkendali dalam sasaran 2.5% ± 1%)
  * **Surplus Neraca Perdagangan (BPS)**: **+$2.91 Miliar USD**
  * **Imbal Hasil (Yield) SUN 10 Tahun**: **6.62%**

---

## 5. Pasar Komoditas Global (LME, ICE, CME, & BMD)

* **Bursa Komoditas Acuan**: London Metal Exchange (LME), Intercontinental Exchange (ICE), CME Group / NYMEX, & Bursa Malaysia Derivatives (BMD).
* **Fitur Interaktif**: Pengguna dapat mengubah atau memilih preset acuan bursa resmi (Sept 2026 Terkini, Sept 2025, Sept 2024, atau Nilai Kustom) via tombol modal *Ubah Acuan Komoditas*.
* **Komoditas Acuan & Dampak Emiten BEI**:
  * 🪙 **Emas (Gold Spot)**: **$4,377.00 /oz** ➔ Dampak: `AMMN`, `ANTM`, `MDKA`, `PSAB`
  * ⛏️ **Tembaga (LME Copper)**: **$14,515.00 /ton** ➔ Dampak: `AMMN`, `MDKA`
  * 🪨 **Batu Bara (Newcastle ICE)**: **$144.50 /ton** ➔ Dampak: `ADRO`, `PTBA`, `ITMG`, `HRUM`
  * 🛢️ **Minyak Mentah (Brent ICE)**: **$103.85 /bbl** ➔ Dampak: `MEDC`, `ELSA`, `PGAS`
  * 🔋 **Nikel (LME Nickel)**: **$16,180.00 /ton** ➔ Dampak: `INCO`, `ANTM`, `NCKL`, `MBMA`
  * 🌴 **Minyak Sawit / CPO (BMD)**: **MYR 4,597 /ton** ➔ Dampak: `AALI`, `LSIP`, `TAPG`, `DSNG`

---

## 6. Fundamental & Rasio Valuasi Emiten

* **Sumber Referensi**: Laporan Keuangan Audited/Interim Emiten BEI (KSEI / IDX Announcements)
* **Metode & Model Valuasi**:
  * **PER (Price to Earnings Ratio - TTM)**
  * **PBV (Price to Book Value)**
  * **ROE (Return on Equity)**
  * **DER (Debt to Equity Ratio)**
  * **NPM (Net Profit Margin)**
  * **Dividend Yield (% p.a.)**
  * **Discounted Cash Flow (DCF) Fair Value**: Estimasi harga wajar intrinsik emiten.

---

## 7. Berita Pemicu, Katalis & Rumor Pasar

* **Sumber Feed**: Media Finansial Resmi & Radar Korporasi (KONTAN, Bloomberg Technoz, Bisnis Indonesia, Notice KSEI)
* **Kategori Katalis**:
  * **Rilis Laporan Keuangan**: Kinerja Laba Bersih Q1/Q2/Q3/Q4.
  * **Aksi Korporasi**: Pembagian Dividen Interim/Final, Right Issue, Stock Split, Buyback.
  * **Rumor & Sentimen Index**: Potensi Rebalancing Indeks MSCI / FTSE Indonesia.

---

## 8. Forum Komunitas & Sentimen Trader

* **Metode Crowdsourcing & Sentimen Tagging**:
  * **Kategori Trader**: *Pro Bandarmology*, *Value Analyst*, *Technical Scalper*, & *Member Ritel*.
  * **Status Sentimen**: `BULLISH` (Hijau), `NEUTRAL` (Abu-abu), `BEARISH` (Merah).
  * **Indeks Sentimen Agregat**: Kalkulasi persentase rasio opini komunitas terhadap saham aktif.

---

## 9. Integrasi Google Workspace (Google Drive API)

* **OAuth Provider**: Google Identity Services (GSI) & Firebase Auth (`gen-lang-client-0091761165`)
* **Cakupan OAuth Scopes**:
  * `https://www.googleapis.com/auth/drive`
  * `https://www.googleapis.com/auth/drive.file`
* **Kegunaan Integrasi**:
  * **Ekspor Laporan Riset Saham**: Otomatis mengunggah dokumen analisis pasar, laporan Bandarmology, dan data teknikal saham BEI dalam format Markdown (`.md`) ke Google Drive pengguna.
  * **Manajemen File & Sinkronisasi**: Membaca file riset tersimpan dan mengizinkan penghapusan file dengan dialog konfirmasi keamanan (*user confirmation safeguard*).

---

*Dokumen ini diperbarui secara otomatis untuk memastikan transparansi dan keandalan data dalam sistem AI Orchestrator.*
