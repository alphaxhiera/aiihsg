import React, { useState } from 'react';
import { X, Save, RotateCcw, FileCode, CheckCircle2, AlertCircle } from 'lucide-react';
import { AgentPromptsFile } from '../types';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompts: AgentPromptsFile | null;
  onSavePrompts: (newPrompts: AgentPromptsFile) => Promise<boolean>;
}

export const PromptModal: React.FC<PromptModalProps> = ({
  isOpen,
  onClose,
  prompts,
  onSavePrompts,
}) => {
  const [jsonText, setJsonText] = useState<string>(
    prompts ? JSON.stringify(prompts, null, 2) : ''
  );
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (prompts) {
      setJsonText(JSON.stringify(prompts, null, 2));
    }
  }, [prompts]);

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      setStatusMessage(null);
      const parsed = JSON.parse(jsonText);
      if (!parsed.agents || !parsed.agents.technical_agent || !parsed.agents.big_volume_agent) {
        throw new Error('Format JSON harus memiliki agents.technical_agent dan agents.big_volume_agent');
      }
      setIsSaving(true);
      const success = await onSavePrompts(parsed);
      setIsSaving(false);
      if (success) {
        setStatusMessage({ type: 'success', text: 'Script prompt JSON berhasil disimpan ke server!' });
        setTimeout(() => {
          setStatusMessage(null);
        }, 3000);
      } else {
        setStatusMessage({ type: 'error', text: 'Gagal menyimpan perubahan ke server.' });
      }
    } catch (err: any) {
      setIsSaving(false);
      setStatusMessage({ type: 'error', text: `Format JSON tidak valid: ${err.message}` });
    }
  };

  const handleReset = () => {
    if (prompts) {
      setJsonText(JSON.stringify(prompts, null, 2));
      setStatusMessage(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20 shrink-0">
              <FileCode className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-semibold tracking-tight text-white flex items-center gap-2 flex-wrap">
                <span>Script Prompt JSON</span>
                <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-mono">
                  agent_prompts.json
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate max-w-xs sm:max-w-md">
                Konfigurasi prompt sistem & parameter agen teknikal & volume
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-2 border-b border-slate-800 bg-slate-900/80 text-xs gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                activeTab === 'editor'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Editor JSON
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Preview ({prompts?.agents ? Object.keys(prompts.agents).length : 2} Agen)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors cursor-pointer text-xs"
              title="Reset ke format saat ini"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-medium transition-colors disabled:opacity-50 shadow-xs cursor-pointer text-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan JSON'}</span>
            </button>
          </div>
        </div>

        {/* Status Alert Banner */}
        {statusMessage && (
          <div
            className={`px-6 py-2.5 flex items-center gap-2 text-xs border-b ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950 font-mono text-xs">
          {activeTab === 'editor' ? (
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="w-full h-[520px] bg-slate-900 border border-slate-700/80 rounded-lg p-4 text-emerald-400 font-mono text-xs leading-relaxed focus:outline-hidden focus:border-blue-500 resize-none selection:bg-blue-900 selection:text-white"
              spellCheck={false}
            />
          ) : (
            <div className="space-y-6 font-sans">
              {prompts?.agents && (
                <>
                  {/* Technical Agent Card */}
                  <div className="bg-slate-900 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div>
                        <h3 className="text-base font-semibold text-blue-400">
                          {prompts.agents.technical_agent.name}
                        </h3>
                        <p className="text-xs text-slate-400">
                          {prompts.agents.technical_agent.title} • {prompts.agents.technical_agent.focus}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 bg-blue-500/15 text-blue-300 text-xs rounded border border-blue-500/20 font-mono">
                        id: technical_agent
                      </span>
                    </div>
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-slate-300 mb-1">System Prompt Directive:</p>
                      <pre className="text-xs bg-slate-950 p-3 rounded border border-slate-800 text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {prompts.agents.technical_agent.systemPrompt}
                      </pre>
                    </div>
                  </div>

                  {/* Big Volume Agent Card */}
                  <div className="bg-slate-900 border border-amber-500/30 rounded-lg p-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div>
                        <h3 className="text-base font-semibold text-amber-400">
                          {prompts.agents.big_volume_agent.name}
                        </h3>
                        <p className="text-xs text-slate-400">
                          {prompts.agents.big_volume_agent.title} • {prompts.agents.big_volume_agent.focus}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 bg-amber-500/15 text-amber-300 text-xs rounded border border-amber-500/20 font-mono">
                        id: big_volume_agent
                      </span>
                    </div>
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-slate-300 mb-1">System Prompt Directive:</p>
                      <pre className="text-xs bg-slate-950 p-3 rounded border border-slate-800 text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {prompts.agents.big_volume_agent.systemPrompt}
                      </pre>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <div>
            Lokasi File: <code className="text-slate-300">/agent_prompts.json</code> (Tersinkronisasi dengan Server Express)
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
