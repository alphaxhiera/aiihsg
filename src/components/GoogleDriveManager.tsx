import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  listDriveFiles,
  createDriveFile,
  deleteDriveFile,
  DriveFile,
} from '../lib/driveService';
import { HardDrive, FileText, Download, Trash2, ExternalLink, RefreshCw, LogOut, CheckCircle2, AlertTriangle, X } from 'lucide-react';

interface GoogleDriveManagerProps {
  currentStockSymbol?: string;
  reportContent?: string;
}

export const GoogleDriveManager: React.FC<GoogleDriveManagerProps> = ({
  currentStockSymbol = 'BBCA',
  reportContent,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [fetchingFiles, setFetchingFiles] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // File Deletion Confirmation State
  const [deletingFile, setDeletingFile] = useState<DriveFile | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        fetchFiles(accessToken);
      },
      () => {
        setUser(null);
        setToken(null);
        setFiles([]);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        setSuccessMsg('Berhasil terhubung dengan Google Drive');
        fetchFiles(res.accessToken);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal melakukan otentikasi Google Drive');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
    setFiles([]);
    setSuccessMsg('Terputus dari Google Drive');
  };

  const fetchFiles = async (accessToken: string) => {
    setFetchingFiles(true);
    setErrorMsg(null);
    try {
      const driveFiles = await listDriveFiles(accessToken);
      setFiles(driveFiles);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal memuat file dari Google Drive');
    } finally {
      setFetchingFiles(false);
    }
  };

  const handleExportReport = async () => {
    if (!token) {
      setErrorMsg('Silakan login dengan akun Google terlebih dahulu');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const now = new Date().toISOString().split('T')[0];
    const filename = `Laporan_Analisa_BEI_${currentStockSymbol}_${now}.md`;
    const defaultContent = `# Laporan Analisa Pasar Saham BEI - ${currentStockSymbol}
Tanggal: ${new Date().toLocaleDateString('id-ID')}
Diunggah via: BEI Market Analytics Orchestrator App

## Ringkasan Eksekutif
- **Kode Saham**: ${currentStockSymbol}
- **Pasar Acuan**: Bursa Efek Indonesia (BEI)
- **Status Makro**: Suku Bunga BI-Rate 6.00%, JISDOR IDR / USD & Komoditas LME/ICE Terbaca
- **Rekomendasi Swarm AI**: Accumulation Target Area

## Catatan Analisis
${reportContent || 'Analisa Bandarmology & RVOL mengindikasikan akumulasi broker institusi asing pada area support kritis.'}
`;

    try {
      const created = await createDriveFile(token, filename, defaultContent);
      setSuccessMsg(`File "${created.name}" berhasil disimpan ke Google Drive!`);
      fetchFiles(token);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal mengunggah file ke Google Drive');
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteFile = async () => {
    if (!deletingFile || !token) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await deleteDriveFile(token, deletingFile.id);
      setSuccessMsg(`File "${deletingFile.name}" berhasil dihapus dari Google Drive.`);
      setDeletingFile(null);
      fetchFiles(token);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal menghapus file dari Google Drive');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4 font-sans text-slate-200">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-sm text-white font-mono uppercase tracking-wider">
            Integrasi Google Drive
          </h3>
        </div>
        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Terhubung: {user.email}
            </span>
            <button
              onClick={handleLogout}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-xs transition-colors flex items-center gap-1 cursor-pointer font-mono"
              title="Keluar dari Google Drive"
            >
              <LogOut className="w-3 h-3" />
              Keluar
            </button>
          </div>
        ) : (
          <span className="text-xs text-slate-400 font-mono">Belum Terhubung</span>
        )}
      </div>

      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-2.5 text-rose-300 text-xs flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2.5 text-emerald-300 text-xs flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {!user ? (
        <div className="space-y-3 py-2 text-center">
          <p className="text-xs text-slate-300 leading-relaxed">
            Hubungkan akun Google Anda untuk menyimpan laporan riset saham BEI, hasil analisa Bandarmology, dan portofolio langsung ke akun Google Drive Anda secara aman.
          </p>

          {/* Official Google Sign In Button Styling */}
          <div className="flex justify-center pt-2">
            <button
              onClick={handleLogin}
              disabled={loading}
              className="inline-flex items-center gap-3 px-4 py-2.5 bg-white text-slate-800 hover:bg-slate-100 font-medium text-xs rounded-lg shadow transition-colors cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>{loading ? 'Menghubungkan...' : 'Sign in with Google'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div>
              <span className="text-xs font-bold text-white block">Ekspor Laporan Saham {currentStockSymbol}</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Simpan hasil analisis riset ke Google Drive sebagai dokumen Markdown (.md)</span>
            </div>
            <button
              onClick={handleExportReport}
              disabled={loading}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{loading ? 'Mengunggah...' : 'Ekspor ke Google Drive'}</span>
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-slate-400">File Laporan di Google Drive:</span>
              <button
                onClick={() => token && fetchFiles(token)}
                disabled={fetchingFiles}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 font-mono cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${fetchingFiles ? 'animate-spin' : ''}`} />
                <span>Muat Ulang</span>
              </button>
            </div>

            {fetchingFiles ? (
              <div className="py-6 text-center text-xs text-slate-400 font-mono">Memuat file Google Drive...</div>
            ) : files.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-lg">
                Belum ada file laporan tersimpan di Google Drive. Klik tombol ekspor di atas untuk membuat laporan pertama.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors text-xs font-mono"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-slate-200 truncate">{file.name}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 text-slate-400 hover:text-emerald-400 rounded transition-colors"
                          title="Buka di Google Drive"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => setDeletingFile(file)}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors cursor-pointer"
                        title="Hapus file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* DIALOG KONFIRMASI HAPUS FILE GOOGLE DRIVE (MANDATORY SAFEGUARD) */}
      {deletingFile && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-mono font-bold text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Konfirmasi Hapus File Google Drive</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Apakah Anda yakin ingin menghapus file <strong className="text-white font-mono">{deletingFile.name}</strong> secara permanen dari akun Google Drive Anda? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setDeletingFile(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors cursor-pointer font-mono"
              >
                Batal
              </button>
              <button
                onClick={confirmDeleteFile}
                disabled={loading}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer font-mono disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{loading ? 'Menghapus...' : 'Ya, Hapus File'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
