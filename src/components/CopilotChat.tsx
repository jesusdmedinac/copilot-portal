import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../data/copilotEngine';
import { 
  INITIAL_COPILOT_MESSAGES, 
  COPILOT_CATEGORIES, 
  generateCopilotAnswer 
} from '../data/copilotEngine';

export default function CopilotChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCopilotPage, setIsCopilotPage] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_COPILOT_MESSAGES);
  const [input, setInput] = useState('');
  const [isCopied, setIsCopied] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsCopilotPage(window.location.pathname.startsWith('/copilot'));
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(id);
      setTimeout(() => setIsCopied(null), 2000);
    } catch (e) {
      console.error('Error al copiar:', e);
    }
  };

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');

    setTimeout(() => {
      const reply = generateCopilotAnswer(query);
      setMessages(prev => [...prev, reply]);
    }, 150);
  };

  // Si ya estamos en la página full screen de /copilot, ocultar el botón flotante
  if (isCopilotPage) {
    return null;
  }

  return (
    <>
      {/* Botón Flotante para Abrir Copilot (Diseño Táctil para Tablet) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        aria-label="Abrir Copilot Asistente"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all duration-150 active:scale-95 border border-indigo-400/30 cursor-pointer"
      >
        <span className="flex h-2.5 w-2.5 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
        </span>
        <span className="font-semibold text-xs tracking-wide">Copilot Karla</span>
      </button>

      {/* Panel / Drawer del Chat */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-20 sm:right-5 sm:w-[420px] sm:max-h-[640px] z-50 flex flex-col bg-zinc-950 sm:rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          
          {/* Header del Chat */}
          <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs font-mono">
                AI
              </div>
              <div>
                <h3 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                  Copilot Operativo
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Citas Exactas
                  </span>
                </h3>
                <p className="text-[11px] text-zinc-400">Base oficial Jesús Medina • Octubre 2026</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Acceso Directo a Pantalla Completa */}
              <a
                href="/copilot"
                className="px-2 py-1 rounded-md text-[11px] font-mono bg-zinc-800 hover:bg-zinc-700 text-indigo-400 border border-zinc-700 transition-colors"
                title="Abrir chat en pantalla completa"
              >
                ↗ Pantalla Completa
              </a>
              <button
                onClick={() => setIsOpen(false)}
                type="button"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors text-sm cursor-pointer"
                aria-label="Cerrar panel"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Sugerencias Rápidas Táctiles (Horizontales) */}
          <div className="px-3 py-2 bg-zinc-900/50 border-b border-zinc-800/60 overflow-x-auto flex gap-1.5 shrink-0">
            {COPILOT_CATEGORIES.slice(0, 5).map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleSend(cat.query)}
                type="button"
                className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/60 whitespace-nowrap transition-colors shrink-0 cursor-pointer"
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Área de Mensajes */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-3.5 rounded-xl max-w-[88%] leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>

                  {/* Snippet de texto copiable directamente en 1 toque */}
                  {m.copySnippet && (
                    <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex flex-col gap-1.5">
                      <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Texto listo para pegar:</span>
                      <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300 select-all max-h-28 overflow-y-auto">
                        {m.copySnippet}
                      </div>
                      <button
                        onClick={() => handleCopy(m.copySnippet!, m.id)}
                        type="button"
                        className="self-end mt-1 px-2.5 py-1 rounded text-[11px] font-mono bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 transition-colors flex items-center gap-1 active:scale-95 cursor-pointer"
                      >
                        {isCopied === m.id ? '✓ Copiado' : '📋 Copiar al portapapeles'}
                      </button>
                    </div>
                  )}

                  {/* Enlaces de citas exactas dentro del portal */}
                  {m.links && m.links.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-zinc-800/60 flex flex-wrap gap-1.5">
                      {m.links.map((link, idx) => (
                        <a
                          key={idx}
                          href={link.url}
                          className="inline-flex items-center gap-1 text-[11px] font-mono text-indigo-400 hover:text-indigo-300 hover:underline"
                        >
                          <span>🔗</span>
                          <span>{link.label}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <span className="text-[9px] font-mono text-zinc-400 mt-1 px-1">
                  {m.timestamp}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input táctil con botón Enviar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-zinc-900 border-t border-zinc-800 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregunta a Copilot..."
              className="flex-1 bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-semibold text-xs transition-colors shrink-0 font-mono cursor-pointer"
            >
              Enviar
            </button>
          </form>

        </div>
      )}
    </>
  );
}
