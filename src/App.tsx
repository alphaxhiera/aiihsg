import React, { useState, useEffect } from 'react';
import { SidebarMenu } from './components/SidebarMenu';
import { Dashboard } from './components/Dashboard';
import { ChatbotPanel } from './components/ChatbotPanel';
import { PromptModal } from './components/PromptModal';
import { GoogleDriveManager } from './components/GoogleDriveManager';
import { INITIAL_STOCKS, IHSG_SUMMARY } from './data/mockStocks';
import { AgentId, StockData, ChatMessage, AgentPromptsFile, IHSGMarketData } from './types';
import { Sparkles, Bot, MessageSquare, X } from 'lucide-react';

export default function App() {
  const [stocks, setStocks] = useState<StockData[]>(INITIAL_STOCKS);
  const [selectedStock, setSelectedStock] = useState<StockData>(INITIAL_STOCKS[0]);
  const [ihsgSummary, setIhsgSummary] = useState<IHSGMarketData>(IHSG_SUMMARY);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dataSource, setDataSource] = useState<string>('Yahoo Finance (.JK)');
  const [activeAgent, setActiveAgent] = useState<AgentId>('orchestrator');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      return false;
    }
    return true;
  });
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [prompts, setPrompts] = useState<AgentPromptsFile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load live Yahoo Finance stock and market data on mount
  useEffect(() => {
    fetchLiveStocks();
  }, []);

  const fetchLiveStocks = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/stocks');
      if (res.ok) {
        const data = await res.json();
        if (data.stocks && Array.isArray(data.stocks) && data.stocks.length > 0) {
          setStocks(data.stocks);
          // Keep current selection updated with live Yahoo Finance data
          setSelectedStock((current) => {
            const updated = data.stocks.find((s: StockData) => s.symbol === current.symbol);
            return updated || data.stocks[0];
          });
        }
        if (data.ihsg) {
          setIhsgSummary(data.ihsg);
        }
        setDataSource(data.source || 'Yahoo Finance (.JK)');
      }
    } catch (err) {
      console.warn('Failed to load Yahoo Finance live data:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/stocks/sync', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.stocks && Array.isArray(data.stocks)) {
          setStocks(data.stocks);
          setSelectedStock((current) => {
            const updated = data.stocks.find((s: StockData) => s.symbol === current.symbol);
            return updated || data.stocks[0];
          });
        }
        if (data.ihsg) {
          setIhsgSummary(data.ihsg);
        }
      }
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Load prompts from agent_prompts.json on mount
  useEffect(() => {
    fetch('/api/prompts')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.agents) {
          setPrompts(data);
        }
      })
      .catch((err) => console.error('Failed to load prompts:', err));
  }, []);

  const handleSendMessage = async (text: string, agentOverride?: AgentId) => {
    const targetAgent = agentOverride || activeAgent;
    if (agentOverride && agentOverride !== activeAgent) {
      setActiveAgent(agentOverride);
    }

    // Ensure chatbot is open when a message is sent or requested
    if (!isChatbotOpen) {
      setIsChatbotOpen(true);
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      agentId: targetAgent,
      text,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      stockSymbol: selectedStock.symbol,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          agentId: targetAgent,
          stockData: selectedStock,
          conversationHistory: messages.slice(-4),
        }),
      });

      const data = await res.json();
      const reply = data.reply || 'Maaf, terjadi kendala teknis dalam memproses analisa.';

      const agentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        agentId: targetAgent,
        text: reply,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        stockSymbol: selectedStock.symbol,
      };

      setMessages((prev) => [...prev, agentMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        sender: 'agent',
        agentId: targetAgent,
        text: `Error saat menghubungi server: ${err.message || 'Koneksi gagal'}`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePrompts = async (newPrompts: AgentPromptsFile): Promise<boolean> => {
    try {
      const res = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrompts),
      });
      const data = await res.json();
      if (data.success) {
        setPrompts(newPrompts);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to save prompts:', err);
      return false;
    }
  };

  return (
    <div className="relative flex h-screen w-screen bg-slate-950 overflow-hidden font-sans">
      {/* Mobile Backdrop for Left Sidebar */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* 1. Left Section: Menu & Agent Selector (Drawer on mobile, docked on desktop) */}
      <SidebarMenu
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeAgent={activeAgent}
        onSelectAgent={setActiveAgent}
        selectedStock={selectedStock}
        onSelectStock={setSelectedStock}
        stocks={stocks}
        ihsgSummary={ihsgSummary}
        onOpenPromptModal={() => setIsPromptModalOpen(true)}
        onOpenDriveModal={() => setIsDriveModalOpen(true)}
      />

      {/* 2. Middle Section: Dynamic Dashboard (Expands when Chatbot is Hidden) */}
      <Dashboard
        activeAgent={activeAgent}
        onSelectAgent={setActiveAgent}
        stock={selectedStock}
        stocks={stocks}
        onSelectStock={setSelectedStock}
        ihsgSummary={ihsgSummary}
        onAskAgent={(agentId, prompt) => handleSendMessage(prompt, agentId)}
        isChatbotOpen={isChatbotOpen}
        onToggleChatbot={() => setIsChatbotOpen(!isChatbotOpen)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSyncing={isSyncing}
        onSyncYahoo={handleManualSync}
        dataSource={dataSource}
      />

      {/* Mobile Backdrop for Right Chatbot Panel */}
      {isChatbotOpen && (
        <div
          onClick={() => setIsChatbotOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* 3. Right Section: Chatbot Panel (Slide-over on mobile, docked on desktop) */}
      <ChatbotPanel
        isOpen={isChatbotOpen}
        onToggle={() => setIsChatbotOpen(false)}
        activeAgent={activeAgent}
        onSelectAgent={setActiveAgent}
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        selectedStock={selectedStock}
        prompts={prompts}
      />

      {/* Floating Button to open Chatbot when collapsed */}
      {!isChatbotOpen && (
        <button
          onClick={() => setIsChatbotOpen(true)}
          className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-30 flex items-center gap-2 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full shadow-2xl hover:shadow-blue-500/30 transition-all transform hover:scale-105 cursor-pointer text-xs font-bold"
        >
          <MessageSquare className="w-4 h-4" />
          <span><span className="hidden xs:inline">Buka </span>Chatbot AI</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </button>
      )}

      {/* Prompt JSON Modal */}
      <PromptModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        prompts={prompts}
        onSavePrompts={handleSavePrompts}
      />

      {/* Google Drive Sync Modal */}
      {isDriveModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-xl w-full relative">
            <button
              onClick={() => setIsDriveModalOpen(false)}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <GoogleDriveManager currentStockSymbol={selectedStock.symbol} />
          </div>
        </div>
      )}
    </div>
  );
}
