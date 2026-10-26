import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../data/copilotEngine';
import { 
  INITIAL_COPILOT_MESSAGES, 
  COPILOT_CATEGORIES, 
  generateCopilotAnswer 
} from '../data/copilotEngine';

export default function CopilotWorkbench() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_COPILOT_MESSAGES);
  const [input, setInput] = useState('');
  const [isCopied, setIsCopied] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    }, 100);
  };

  const handleClear = () => {
    setMessages(INITIAL_COPILOT_MESSAGES);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] min-h-[580px] rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl">
      
      {/* Barra Superior del Workbench */}
      <header className="px-5 py-3.5 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-mono font-bold text-sm">
            AI
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-zinc-100 tracking-tight">Copilot Operativo • Pantalla Completa</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hidden sm:inline-block">
                Citas Oficiales Activas
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono">Espacio de trabajo inmersivo para postulaciones y formularios</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClear}
            type="button"
            className="px-2.5 py-1.5 rounded-lg text-xs font-mono text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors border border-zinc-700/40 cursor-pointer"
            title="Reiniciar chat"
          >
            Limpiar Chat
          </button>
          <a
            href="/perfil"
            className="hidden md:inline-flex px-2.5 py-1.5 rounded-lg text-xs font-mono text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors border border-indigo-500/30"
          >
            Ver Perfil ↗
          </a>
        </div>
      </header>

      {/* Contenedor Principal: 2 Columnas en Tablet/Desktop */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Panel Lateral Izquierdo: Atajos Temáticos */}
        <aside className="w-full md:w-80 p-4 bg-zinc-900/40 border-b md:border-b-0 md:border-r border-zinc-800/80 overflow-y-auto shrink-0 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider font-semibold">
                Consultas Rápidas
              </span>
              <span className="text-[10px] font-mono text-indigo-400">1-Toque</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
              {COPILOT_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleSend(cat.query)}
                  type="button"
                  className="group p-2.5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 hover:bg-zinc-800 hover:border-indigo-500/40 transition-all text-left flex flex-col justify-between cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-zinc-200 group-hover:text-indigo-300 transition-colors">
                      {cat.label}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                      {cat.badge}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500 line-clamp-1 font-mono">
                    {cat.query}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Nota de Soporte */}
          <div className="mt-4 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 text-[11px] text-zinc-400 leading-relaxed hidden md:block">
            <span className="font-bold text-zinc-300 font-mono">💡 Modo Operativo:</span> Copia respuestas exactas directamente con el botón sin reformular ni añadir información no autorizada.
          </div>
        </aside>

        {/* Panel Central: Hilo de Conversación Completo */}
        <main className="flex-1 flex flex-col overflow-hidden bg-zinc-950/60">
          
          {/* Scroll de Mensajes */}
          <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-5 text-sm">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-4 rounded-2xl max-w-[90%] md:max-w-[80%] leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/10'
                      : 'bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  {/* Etiqueta de Categoría si aplica */}
                  {m.category && (
                    <div className="mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {m.category}
                      </span>
                    </div>
                  )}

                  <p className="whitespace-pre-wrap text-xs md:text-sm">{m.text}</p>

                  {/* Caja de Snippet Copiable Directamente */}
                  {m.copySnippet && (
                    <div className="mt-3.5 pt-3 border-t border-zinc-800/80 flex flex-col gap-2">
                      <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-semibold">
                        Texto listo para pegar en formulario:
                      </span>
                      <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300 select-all max-h-36 overflow-y-auto leading-relaxed">
                        {m.copySnippet}
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleCopy(m.copySnippet!, m.id)}
                          type="button"
                          className="px-3 py-1.5 rounded-lg text-xs font-mono bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 transition-colors flex items-center gap-1.5 active:scale-95 cursor-pointer font-semibold"
                        >
                          {isCopied === m.id ? '✓ Copiado al portapapeles' : '📋 Copiar texto autorizado'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Enlaces de Citas Exactas dentro del Portal */}
                  {m.links && m.links.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-zinc-800/60 flex flex-wrap gap-2">
                      {m.links.map((link, idx) => (
                        <a
                          key={idx}
                          href={link.url}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-zinc-950/60 text-indigo-400 hover:text-indigo-300 border border-zinc-800 hover:border-indigo-500/40 transition-colors"
                        >
                          <span>🔗</span>
                          <span>{link.label}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <span className="text-[10px] font-mono text-zinc-500 mt-1 px-1">
                  {m.timestamp}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input de Texto y Botón Enviar */}
          <footer className="p-4 bg-zinc-900/90 border-t border-zinc-800 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2.5"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu consulta o copia la pregunta del formulario aquí..."
                className="flex-1 bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-3 text-xs md:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 font-sans"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-semibold text-xs md:text-sm transition-colors shrink-0 font-mono cursor-pointer"
              >
                Enviar
              </button>
            </form>
          </footer>

        </main>
      </div>

    </div>
  );
}
