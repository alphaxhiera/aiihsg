import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  TrendingUp,
  Activity,
  Send,
  X,
  Bot,
  User,
  Sparkles,
  RotateCcw,
  ShieldAlert,
  ChevronRight,
  Maximize2,
  Copy,
  Check,
  Calendar,
  Table
} from 'lucide-react';
import { AgentId, ChatMessage, StockData, AgentPromptsFile } from '../types';

interface ChatbotPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  activeAgent: AgentId;
  onSelectAgent: (agent: AgentId) => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  selectedStock: StockData;
  prompts: AgentPromptsFile | null;
}

export const ChatbotPanel: React.FC<ChatbotPanelProps> = ({
  isOpen,
  onToggle,
  activeAgent,
  onSelectAgent,
  messages,
  onSendMessage,
  isLoading,
  selectedStock,
  prompts,
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [panelWidth, setPanelWidth] = useState<number>(450);
  const isResizingRef = useRef(false);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    const startX = e.clientX;
    const startWidth = panelWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingRef.current) return;
      const delta = startX - moveEvent.clientX; // dragging left increases width
      const newWidth = Math.max(340, Math.min(window.innerWidth * 0.85, startWidth + delta));
      setPanelWidth(newWidth);
    };

    const onMouseUp = () => {
      isResizingRef.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const activeAgentConfig = prompts?.agents?.[activeAgent] || {
    name:
      activeAgent === 'technical_agent'
        ? 'Agen Technical Analisis Saham'
        : activeAgent === 'big_volume_agent'
        ? 'Agen Perdagangan Volume Besar'
        : 'AI Orchestrator (Auto-Router)',
    title:
      activeAgent === 'technical_agent'
        ? 'Senior Technical Analyst'
        : activeAgent === 'big_volume_agent'
        ? 'Whale Flow & Bandarmology'
        : 'Smart Router & Dual-Engine',
    color: activeAgent === 'technical_agent' ? 'blue' : activeAgent === 'big_volume_agent' ? 'amber' : 'emerald',
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickPrompts = [
    `Berikan analisa komprehensif lengkap (Teknikal & Bandarmology) untuk saham ${selectedStock.symbol}`,
    `Apakah setup trading teknikal didukung oleh akumulasi volume besar ${selectedStock.symbol}?`,
    `Evaluasi Support, Resistance, dan Dominasi Money Flow Top 3 Broker ${selectedStock.symbol}`,
    `Bagaimana ringkasan kesehatan pasar dan arah Smart Money ${selectedStock.symbol}?`
  ];

  if (!isOpen) {
    return null;
  }

  return (
    <aside
      style={{ width: typeof window !== 'undefined' && window.innerWidth >= 1024 ? `${panelWidth}px` : '100%' }}
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-[380px] md:w-[400px] lg:relative h-screen bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 select-none shadow-2xl transition-all duration-75"
    >
      {/* Drag Resize Handle on Left Edge (Desktop) */}
      <div
        onMouseDown={startResizing}
        className="hidden lg:flex absolute left-0 top-0 bottom-0 w-2.5 cursor-ew-resize hover:bg-blue-500/40 bg-transparent z-30 group items-center justify-center transition-colors"
        title="Geser untuk memperlebar / mempersempit chatbot"
      >
        <div className="w-0.5 h-8 bg-slate-700 rounded-full group-hover:bg-blue-400 transition-colors" />
      </div>
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`p-2 rounded-lg shrink-0 ${
              activeAgent === 'technical_agent'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : activeAgent === 'big_volume_agent'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {activeAgent === 'technical_agent' ? (
              <TrendingUp className="w-4 h-4" />
            ) : activeAgent === 'big_volume_agent' ? (
              <Activity className="w-4 h-4" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-white truncate">
                {activeAgentConfig.name}
              </h3>
              <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded font-mono">
                AI
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              Konteks: <span className="text-blue-400 font-mono font-semibold">{selectedStock.symbol}</span> (Rp {selectedStock.price})
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="hidden xl:flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono">
            <Calendar className="w-3 h-3 text-blue-400" />
            <span>
              {new Date().toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
          <button
            onClick={onToggle}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Tutup Chatbot"
          >
            <ChevronRight className="w-4 h-4 hidden lg:block" />
            <X className="w-4 h-4 lg:hidden" />
          </button>
        </div>
      </div>

      {/* AI Master Orchestrator Active Status Banner */}
      <div className="px-3 py-2 bg-emerald-950/40 border-b border-emerald-500/30 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-emerald-300 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>AI Orchestrator: Dual-Engine Active (Teknikal & Bandarmology)</span>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
          Auto-Route
        </span>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans select-text">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div
              className={`p-3 rounded-full mb-3 ${
                activeAgent === 'technical_agent'
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20'
                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
              }`}
            >
              <Bot className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">
              {activeAgentConfig.name}
            </h4>
            <p className="text-xs text-slate-400 max-w-xs mb-4">
              Siap menganalisa saham{' '}
              <strong className="text-white font-mono">{selectedStock.symbol}</strong>{' '}
              menggunakan parameter {activeAgent === 'technical_agent' ? 'Price Action, S/R, RSI, MACD' : 'Bandarmology & Lonjakan Volume'}.
            </p>

            <div className="w-full space-y-1.5 text-left">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Pertanyaan Rekomendasi:
              </div>
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(prompt)}
                  className="w-full p-2 text-xs text-slate-300 bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-lg text-left transition-colors flex items-center justify-between group"
                >
                  <span className="truncate pr-2">{prompt}</span>
                  <Sparkles className="w-3 h-3 text-blue-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isMsgTech = msg.agentId === 'technical_agent';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-slate-500 font-mono">
                  {isUser ? (
                    <>
                      <span>Anda (Trader)</span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                    </>
                  ) : (
                    <>
                      <span
                        className={`font-semibold ${
                          isMsgTech ? 'text-blue-400' : 'text-amber-400'
                        }`}
                      >
                        {isMsgTech ? 'Agen Teknikal' : 'Agen Volume'}
                      </span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                    </>
                  )}
                </div>

                <div
                  className={`relative rounded-xl p-3 text-xs leading-relaxed ${
                    isUser
                      ? 'max-w-[85%] bg-blue-600 text-white rounded-br-xs'
                      : 'w-full max-w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-bl-xs'
                  }`}
                >
                  {!isUser ? (
                    <div className="markdown-body space-y-2 text-xs text-slate-200">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          table: ({ ...props }) => (
                            <div className="overflow-x-auto my-3 w-full rounded-lg border border-slate-700/80 bg-slate-900/90 shadow-md">
                              <table className="w-full text-left text-xs border-collapse min-w-[320px]" {...props} />
                            </div>
                          ),
                          thead: ({ ...props }) => (
                            <thead className="bg-slate-800 text-slate-200 border-b border-slate-700 font-semibold text-[11px] font-mono tracking-wide" {...props} />
                          ),
                          th: ({ ...props }) => (
                            <th className="px-3 py-2 text-left text-slate-200 font-semibold border-r border-slate-700/70 last:border-r-0 whitespace-nowrap bg-slate-800/90" {...props} />
                          ),
                          tr: ({ ...props }) => (
                            <tr className="border-b border-slate-800/80 hover:bg-slate-800/50 transition-colors last:border-b-0 even:bg-slate-900/40" {...props} />
                          ),
                          td: ({ ...props }) => (
                            <td className="px-3 py-2 text-slate-300 border-r border-slate-800/50 last:border-r-0 leading-snug font-sans" {...props} />
                          ),
                          p: ({ ...props }) => (
                            <p className="mb-2 leading-relaxed text-slate-200 last:mb-0" {...props} />
                          ),
                          strong: ({ ...props }) => (
                            <strong className="font-semibold text-white" {...props} />
                          ),
                          ul: ({ ...props }) => (
                            <ul className="list-disc list-inside space-y-1 my-2 text-slate-200" {...props} />
                          ),
                          ol: ({ ...props }) => (
                            <ol className="list-decimal list-inside space-y-1 my-2 text-slate-200" {...props} />
                          ),
                          li: ({ ...props }) => (
                            <li className="text-slate-200 pl-1 leading-relaxed" {...props} />
                          ),
                          h1: ({ ...props }) => (
                            <h1 className="text-sm font-bold text-white mt-3 mb-1.5 pb-1 border-b border-slate-800" {...props} />
                          ),
                          h2: ({ ...props }) => (
                            <h2 className="text-xs font-bold text-white mt-3 mb-1.5" {...props} />
                          ),
                          h3: ({ ...props }) => (
                            <h3 className="text-xs font-semibold text-blue-300 mt-2.5 mb-1" {...props} />
                          ),
                          h4: ({ ...props }) => (
                            <h4 className="text-xs font-semibold text-amber-300 mt-2.5 mb-1" {...props} />
                          ),
                          code: ({ className, children, ...props }: any) => {
                            const isInline = !className;
                            return isInline ? (
                              <code className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded text-[11px] font-mono border border-slate-700" {...props}>
                                {children}
                              </code>
                            ) : (
                              <pre className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 overflow-x-auto text-[11px] font-mono text-slate-300 my-2">
                                <code {...props}>{children}</code>
                              </pre>
                            );
                          },
                          blockquote: ({ ...props }) => (
                            <blockquote className="border-l-2 border-blue-500 pl-3 py-1 my-2 bg-blue-500/10 text-slate-300 rounded-r text-xs italic" {...props} />
                          ),
                          hr: ({ ...props }) => (
                            <hr className="my-3 border-slate-800" {...props} />
                          ),
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p>{msg.text}</p>
                  )}

                  {!isUser && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-mono flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-blue-400" />
                        Gemini AI Intelligence
                      </span>
                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className="flex items-center gap-1 hover:text-white transition-colors"
                        title="Salin Analisa"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Salin</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="flex items-start gap-2 text-xs">
            <div
              className={`p-1.5 rounded-md shrink-0 ${
                activeAgent === 'technical_agent'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl rounded-bl-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
                <span>
                  {activeAgentConfig.name} sedang menganalisa data pasar {selectedStock.symbol}...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      {messages.length > 0 && (
        <div className="px-3 py-1.5 bg-slate-950/60 border-t border-slate-800/60 overflow-x-auto flex gap-1.5 scrollbar-none text-[11px]">
          {quickPrompts.slice(0, 2).map((chip, i) => (
            <button
              key={i}
              onClick={() => onSendMessage(chip)}
              className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white whitespace-nowrap transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Input Form Footer */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800 bg-slate-950">
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder={`Tanya ${activeAgentConfig.name} tentang ${selectedStock.symbol}...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className={`absolute right-1.5 p-1.5 rounded-lg text-white transition-colors disabled:opacity-40 ${
              activeAgent === 'technical_agent'
                ? 'bg-blue-600 hover:bg-blue-500'
                : 'bg-amber-600 hover:bg-amber-500'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500 px-1">
          <span>Tekan Enter untuk kirim</span>
          <span>Prompt tersinkronisasi JSON</span>
        </div>
      </form>
    </aside>
  );
};
