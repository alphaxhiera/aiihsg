import React from 'react';
import {
  TrendingUp,
  Activity,
  Sparkles,
  FileCode,
  CircleDot,
  Clock,
  HardDrive,
  X
} from 'lucide-react';
import { AgentId, IHSGMarketData, StockData } from '../types';

interface SidebarMenuProps {
  isOpen?: boolean;
  onClose?: () => void;
  activeAgent: AgentId;
  onSelectAgent: (agent: AgentId) => void;
  selectedStock?: StockData;
  onSelectStock?: (stock: StockData) => void;
  stocks?: StockData[];
  ihsgSummary: IHSGMarketData;
  onOpenPromptModal: () => void;
  onOpenDriveModal?: () => void;
}

export const SidebarMenu: React.FC<SidebarMenuProps> = ({
  isOpen = false,
  onClose,
  activeAgent,
  onSelectAgent,
  ihsgSummary,
  onOpenPromptModal,
  onOpenDriveModal,
}) => {
  const handleSelectAgent = (agent: AgentId) => {
    onSelectAgent(agent);
    if (window.innerWidth < 1024 && onClose) {
      onClose();
    }
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-72 sm:w-80 max-w-[85vw] h-screen bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between shrink-0 select-none transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
        isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      <div className="flex-1 overflow-y-auto">
        {/* Brand & App Title */}
        <div className="p-4 border-b border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                  IHSG AI RADAR
                  <span className="text-[10px] px-1.5 py-0.2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full font-mono">
                    IDX
                  </span>
                </h1>
                <p className="text-[11px] text-slate-400">Agentic Market Intelligence</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <CircleDot className="w-2.5 h-2.5 animate-pulse" />
                <span>LIVE</span>
              </div>

              {/* Close Button on Mobile */}
              {onClose && (
                <button
                  onClick={onClose}
                  className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Tutup Menu"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Mini IHSG Index Ticker */}
          <div className="mt-3 bg-slate-900/90 rounded-lg p-2.5 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-medium text-slate-400">IHSG (Composite)</div>
                <div className="text-sm font-bold text-white font-mono">
                  {ihsgSummary.index.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-emerald-400 font-mono">
                  +{ihsgSummary.change.toFixed(2)} (+{ihsgSummary.changePercent.toFixed(2)}%)
                </div>
                <div className="text-[10px] text-slate-400">
                  Foreign: <span className="text-emerald-400 font-medium">+{ihsgSummary.netForeignTrillion}T</span>
                </div>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    ihsgSummary.isMarketOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                  }`}
                />
                <span
                  className={
                    ihsgSummary.isMarketOpen
                      ? 'text-emerald-400 font-medium'
                      : 'text-rose-300 font-medium'
                  }
                >
                  {ihsgSummary.marketStatus || (ihsgSummary.isMarketOpen ? 'Buka' : 'Tutup')}
                </span>
              </div>
              <div className="text-slate-400 font-mono text-[9px] truncate max-w-[130px]" title={ihsgSummary.latestTradingDateText}>
                {ihsgSummary.latestTradingDateText ? `Data: ${ihsgSummary.latestTradingDateText}` : 'Data Penutupan'}
              </div>
            </div>
          </div>
        </div>

        {/* Agent Selector Section */}
        <div className="p-3 bg-slate-900/30">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Pilih Mode AI (Agent)
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">Gemini 3.8</span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {/* AI Master Orchestrator (Auto-Router) */}
            <button
              onClick={() => handleSelectAgent('orchestrator')}
              className={`flex items-start gap-2.5 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                activeAgent === 'orchestrator'
                  ? 'bg-emerald-500/15 border-emerald-500/60 shadow-xs ring-1 ring-emerald-500/30'
                  : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700'
              }`}
            >
              <div
                className={`p-2 rounded-md shrink-0 mt-0.5 ${
                  activeAgent === 'orchestrator'
                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                    : 'bg-slate-800 text-emerald-400'
                }`}
              >
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div
                    className={`text-xs font-bold truncate ${
                      activeAgent === 'orchestrator' ? 'text-emerald-300' : 'text-slate-200'
                    }`}
                  >
                    AI Orchestrator (Auto-Router)
                  </div>
                  {activeAgent === 'orchestrator' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Kombinasi Teknikal & Bandarmology Otomatis
                </p>
              </div>
            </button>

            {/* Technical Agent */}
            <button
              onClick={() => handleSelectAgent('technical_agent')}
              className={`flex items-start gap-2.5 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                activeAgent === 'technical_agent'
                  ? 'bg-blue-600/15 border-blue-500/60 shadow-xs ring-1 ring-blue-500/30'
                  : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700'
              }`}
            >
              <div
                className={`p-2 rounded-md shrink-0 mt-0.5 ${
                  activeAgent === 'technical_agent'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-800 text-blue-400'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div
                    className={`text-xs font-bold truncate ${
                      activeAgent === 'technical_agent' ? 'text-blue-300' : 'text-slate-200'
                    }`}
                  >
                    Technical Analisis Saham
                  </div>
                  {activeAgent === 'technical_agent' && (
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Support, Resistance, RSI, MACD
                </p>
              </div>
            </button>

            {/* Big Volume / Bandarmology Agent */}
            <button
              onClick={() => handleSelectAgent('big_volume_agent')}
              className={`flex items-start gap-2.5 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                activeAgent === 'big_volume_agent'
                  ? 'bg-amber-500/15 border-amber-500/60 shadow-xs ring-1 ring-amber-500/30'
                  : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700'
              }`}
            >
              <div
                className={`p-2 rounded-md shrink-0 mt-0.5 ${
                  activeAgent === 'big_volume_agent'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'bg-slate-800 text-amber-400'
                }`}
              >
                <Activity className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div
                    className={`text-xs font-bold truncate ${
                      activeAgent === 'big_volume_agent' ? 'text-amber-300' : 'text-slate-200'
                    }`}
                  >
                    Perdagangan Volume Besar
                  </div>
                  {activeAgent === 'big_volume_agent' && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Bandarmology & Lonjakan Volume
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Script Prompt & Google Drive Triggers */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/30 shrink-0 space-y-2">
        {onOpenDriveModal && (
          <button
            onClick={onOpenDriveModal}
            className="w-full flex items-center justify-between px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/70 rounded-lg text-xs font-medium text-slate-200 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>Google Drive Sync</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 font-mono">
              DRIVE
            </span>
          </button>
        )}

        <button
          onClick={onOpenPromptModal}
          className="w-full flex items-center justify-between px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/70 rounded-lg text-xs font-medium text-slate-200 transition-colors group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-emerald-400 group-hover:rotate-6 transition-transform" />
            <span>Script Prompt JSON</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-mono">
            JSON
          </span>
        </button>

        <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between px-1">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> BEI Sesi II (13:30 - 15:45)
          </span>
          <span>v1.0.0</span>
        </div>
      </div>
    </aside>
  );
};
