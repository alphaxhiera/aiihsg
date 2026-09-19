# Panduan Deployment ke Vercel — AI Stock Orchestrator Dashboard

Aplikasi ini **100% kompatibel dan siap di-deploy ke Vercel**! 

Dengan konfigurasi `vercel.json` yang telah disiapkan di root proyek, Vercel akan otomatis mendeteksi proyek Vite + React dan melakukan build file statis ke folder `dist`.

---

## Langkah 1: Ekspor atau Push Kode ke GitHub

### Opsi A: Ekspor ZIP / GitHub via Menu AI Studio
1. Klik **Settings / Export** di pojok kanan atas AI Studio Build.
2. Pilih **Export to GitHub** atau **Download ZIP**.
3. Jika mengunduh ZIP, ekstraksi dan upload/push repository ke akun GitHub Anda.

---

## Langkah 2: Import Proyek di Vercel

1. Buka dashboard **[Vercel](https://vercel.com/)** dan login dengan akun GitHub Anda.
2. Klik tombol **"Add New..."** ➔ **"Project"**.
3. Pilih repository GitHub aplikasi ini.
4. Pada halaman konfigurasi Vercel:
   - **Framework Preset**: Vite (otomatis terdeteksi)
   - **Build Command**: `vite build`
   - **Output Directory**: `dist`
5. (Opsional) Jika menggunakan Gemini API atau kunci rahasia lainnya, tambahkan pada bagian **Environment Variables**:
   - `GEMINI_API_KEY`: *(isi dengan kunci API Gemini Anda)*
6. Klik **"Deploy"**.

---

## Langkah 3: Menambahkan Domain Vercel ke Google OAuth (PENTING untuk Google Drive)

Jika Anda menggunakan fitur **Google Drive Sync / Google Auth**:
1. Setelah proyek selesai di-deploy, Anda akan mendapatkan URL Vercel (contoh: `https://stock-orchestrator.vercel.app`).
2. Buka **[Google Cloud Console](https://console.cloud.google.com/)** ➔ pilih project `gen-lang-client-0091761165`.
3. Buka menu **APIs & Services** ➔ **Credentials** ➔ klik pada OAuth 2.0 Client ID aplikasi.
4. Pada bagian **Authorized JavaScript origins**, tambahkan URL Vercel Anda:
   - `https://stock-orchestrator.vercel.app`
5. Pada bagian **Authorized redirect URIs**, tambahkan:
   - `https://stock-orchestrator.vercel.app`
   - `https://stock-orchestrator.firebaseapp.com/__/auth/handler`
6. Simpan perubahan.

---

## Catatan Teknis
- File `vercel.json` sudah menyertakan aturan `rewrites` agar routing Single Page Application (SPA) tetap lancar saat halaman di-refresh.
- Semua file dokumentasi (`/datasource.md` dan `/logic.html`) akan ikut terpublikasi di Vercel.
