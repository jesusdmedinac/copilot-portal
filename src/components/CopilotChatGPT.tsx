import React, { useState, useRef, useEffect } from 'react';
import { analyzeAndGeneratePackage } from '../data/applicationPackageGenerator';
import type { ApplicationPackage } from '../data/applicationPackageGenerator';
import { callGeminiApi, parseGeminiResponseToPackage, GEMINI_STORAGE_KEY } from '../data/geminiClient';
import { STORAGE_KEY } from './PinGate';

interface ThreadSession {
  id: string;
  title: string;
  timestamp: string;
  messages: {
    sender: 'user' | 'assistant';
    text: string;
    pkg?: ApplicationPackage;
    timestamp: string;
  }[];
}

const STORAGE_SESSIONS_KEY = 'karla_chat_sessions_v1';

export default function CopilotChatGPT() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sessions, setSessions] = useState<ThreadSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('new');
  const [input, setInput] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [tempApiKey, setTempApiKey] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cargar sesiones y API Key desde localStorage
  useEffect(() => {
    try {
      const savedSessions = localStorage.getItem(STORAGE_SESSIONS_KEY);
      if (savedSessions) {
        setSessions(JSON.parse(savedSessions));
      }
      const savedKey = localStorage.getItem(GEMINI_STORAGE_KEY);
      if (savedKey) {
        setApiKey(savedKey);
        setTempApiKey(savedKey);
      }
    } catch (e) {
      console.error('Error al inicializar datos:', e);
    }
  }, []);

  // Guardar sesiones en localStorage
  const saveSessions = (updated: ThreadSession[]) => {
    setSessions(updated);
    try {
      localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error al guardar sesiones:', e);
    }
  };

  const handleSaveApiKey = () => {
    const trimmed = tempApiKey.trim();
    setApiKey(trimmed);
    localStorage.setItem(GEMINI_STORAGE_KEY, trimmed);
    setShowSettingsModal(false);
  };

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const activeMessages = currentSession ? currentSession.messages : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages, isThinking]);

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  const handleDownloadTex = (texContent: string, filename: string) => {
    const blob = new Blob([texContent], { type: 'text/x-tex;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleNewChat = () => {
    setCurrentSessionId('new');
    setInput('');
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = sessions.filter(s => s.id !== id);
    saveSessions(filtered);
    if (currentSessionId === id) {
      setCurrentSessionId('new');
    }
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setInput('');
    setIsThinking(true);

    let pkg: ApplicationPackage;

    try {
      if (apiKey) {
        // Conexión real con Gemini 2.0 Flash
        const rawOutput = await callGeminiApi(query, apiKey);
        pkg = parseGeminiResponseToPackage(rawOutput, query);
      } else {
        // Motor determinista local
        pkg = analyzeAndGeneratePackage(query);
      }
    } catch (err: any) {
      console.error('Error llamando a Gemini API:', err);
      pkg = {
        type: 'general',
        summaryNote: `⚠️ Error al conectar con el LLM: ${err.message || err}. Usando motor local de respaldo:`,
        atsAnswers: [{
          question: query,
          answer: 'Por favor verifica la API Key de Gemini en Ajustes.',
          tag: 'Error API'
        }]
      };
    } finally {
      setIsThinking(false);
    }

    // Determinar título de la sesión
    let title = pkg.companyName ? `${pkg.companyName} (${pkg.roleTitle || 'Postulación'})` : query.slice(0, 28) + '...';

    if (currentSessionId === 'new') {
      const newId = Date.now().toString();
      const newSession: ThreadSession = {
        id: newId,
        title,
        timestamp,
        messages: [
          { sender: 'user', text: query, timestamp },
          { sender: 'assistant', text: pkg.summaryNote, pkg, timestamp }
        ]
      };
      saveSessions([newSession, ...sessions]);
      setCurrentSessionId(newId);
    } else {
      const updated = sessions.map(s => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            messages: [
              ...s.messages,
              { sender: 'user' as const, text: query, timestamp },
              { sender: 'assistant' as const, text: pkg.summaryNote, pkg, timestamp }
            ]
          };
        }
        return s;
      });
      saveSessions(updated);
    }
  };

  const handleLock = () => {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event('lock-portal'));
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] min-h-[640px] bg-zinc-950 text-zinc-100 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl relative font-sans">
      
      {/* ========================================================= */}
      {/* BARRA LATERAL ESTILO CHATGPT */}
      {/* ========================================================= */}
      <aside className={`${
        sidebarOpen ? 'w-72 sm:w-80' : 'w-0 -translate-x-full sm:translate-x-0 sm:w-0'
      } bg-zinc-900/90 border-r border-zinc-800 transition-all duration-300 flex flex-col justify-between shrink-0 overflow-hidden z-20`}>
        
        {/* Cabecera Sidebar */}
        <div className="p-3.5 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs font-mono">
              AI
            </div>
            <span className="font-bold text-sm tracking-tight text-zinc-100">Copilot Karla</span>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            type="button"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Ocultar barra lateral"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Botón Chat Nuevo y Navegación Principal */}
        <div className="p-3 space-y-2">
          <button
            onClick={handleNewChat}
            type="button"
            className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700/80 text-zinc-100 font-medium text-xs border border-zinc-700/60 transition-all cursor-pointer shadow-sm group"
          >
            <span className="text-indigo-400 group-hover:rotate-90 transition-transform">＋</span>
            <span>Nueva Postulación</span>
          </button>

          <nav className="pt-2 space-y-1 text-xs font-mono">
            <a 
              href="/perfil" 
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-colors"
            >
              <span>👤</span>
              <span>Perfil y Trayectoria</span>
            </a>
            <a 
              href="/guias" 
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-colors"
            >
              <span>📖</span>
              <span>Guías y Respuestas</span>
            </a>
            <a 
              href="https://notion.so" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3 py-2 rounded-lg text-zinc-400 hover:text-indigo-300 hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span>📋</span>
                <span>Abrir Notion</span>
              </div>
              <span className="text-[10px] text-zinc-500">↗</span>
            </a>
            <button
              onClick={() => setShowSettingsModal(true)}
              type="button"
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span>⚙️</span>
                <span>Modelo LLM</span>
              </div>
              <span className={`text-[9px] px-1.5 py-0.2 rounded border font-mono ${
                apiKey ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
              }`}>
                {apiKey ? 'Gemini 2.0' : 'Local'}
              </span>
            </button>
          </nav>
        </div>

        {/* Lista de Sesiones Recientes */}
        <div className="flex-1 px-3 py-2 overflow-y-auto space-y-1">
          <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider px-2 py-1">
            Postulaciones Recientes
          </div>

          {sessions.length === 0 ? (
            <p className="text-xs text-zinc-500 px-2 py-4 italic text-center">
              No hay sesiones guardadas todavía.
            </p>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => setCurrentSessionId(s.id)}
                className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                  currentSessionId === s.id
                    ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
              >
                <div className="truncate flex-1 pr-2">
                  <p className="truncate font-medium">{s.title}</p>
                  <span className="text-[10px] text-zinc-500 font-mono">{s.timestamp}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteSession(s.id, e)}
                  type="button"
                  className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 transition-opacity"
                  title="Eliminar sesión"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer del Usuario */}
        <div className="p-3 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center font-bold text-xs text-indigo-300 font-mono">
              KM
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-200">Karla Medina</p>
              <p className="text-[10px] text-zinc-500 font-mono">Coordinadora • Tablet</p>
            </div>
          </div>
          <button
            onClick={handleLock}
            type="button"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors text-xs font-mono cursor-pointer"
            title="Bloquear portal"
          >
            🔒
          </button>
        </div>

      </aside>

      {/* ========================================================= */}
      {/* ÁREA CENTRAL PRINCIPAL (STAGE CHATGPT) */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col bg-zinc-950 relative overflow-hidden">
        
        {/* Barra superior de control */}
        <header className="px-4 py-3 border-b border-zinc-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                type="button"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-zinc-800 transition-colors cursor-pointer"
                title="Mostrar barra lateral"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            <h2 className="text-xs font-bold text-zinc-200 truncate max-w-xs sm:max-w-md">
              {currentSession ? currentSession.title : 'Nueva Postulación'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono border ${
              apiKey ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${apiKey ? 'bg-indigo-400 animate-pulse' : 'bg-zinc-500'}`}></span>
              {apiKey ? 'LLM Conectado (Gemini 2.0)' : 'Motor Local'}
            </span>
          </div>
        </header>

        {/* ========================================================= */}
        {/* ESTADO 1: HERO VACÍO (ESTILO CHATGPT "¿Qué tienes en mente?") */}
        {/* ========================================================= */}
        {activeMessages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
            
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto text-2xl font-mono mb-4">
                ✨
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
                ¿En qué postulación trabajamos hoy, Karla?
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
                Pega el texto de un post de LinkedIn, el Job Description de un formulario ATS o formula cualquier pregunta.
              </p>
            </div>

            {/* Input Cápsula Grande Central */}
            <div className="w-full max-w-xl">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="relative bg-zinc-900/90 border border-zinc-700/80 rounded-3xl p-3 shadow-xl focus-within:border-indigo-500 transition-all flex flex-col gap-2"
              >
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Pega aquí el post de LinkedIn, el Job Description de la vacante o tu consulta..."
                  rows={3}
                  className="w-full bg-transparent text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none px-2 py-1 leading-relaxed"
                />

                <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
                    <span>💡 Pega texto largo o corto</span>
                  </div>

                  <button
                    type="submit"
                    disabled={!input.trim() || isThinking}
                    className="w-9 h-9 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
                    title="Enviar"
                  >
                    {isThinking ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Tarjetas de Acceso Rápido Inferiores */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl text-left">
              <button
                onClick={() => setInput('We are hiring a Staff Android Software Engineer at Cash App! Reach out to careers@block.xyz with your resume.')}
                type="button"
                className="p-3.5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-800/60 hover:border-indigo-500/40 transition-all cursor-pointer group"
              >
                <span className="text-base mb-1 block">✉️</span>
                <h4 className="text-xs font-bold text-zinc-200 group-hover:text-indigo-300">Post de LinkedIn</h4>
                <p className="text-[11px] text-zinc-400 mt-1">Genera el borrador de email directo al recruiter.</p>
              </button>

              <button
                onClick={() => setInput('Job Description: Senior Mobile Platform Engineer at DoorDash. Requirements: 8+ years Android SDK, Kotlin Multiplatform, modular architecture, Compose.')}
                type="button"
                className="p-3.5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-800/60 hover:border-indigo-500/40 transition-all cursor-pointer group"
              >
                <span className="text-base mb-1 block">📄</span>
                <h4 className="text-xs font-bold text-zinc-200 group-hover:text-indigo-300">Job Description ATS</h4>
                <p className="text-[11px] text-zinc-400 mt-1">Genera CV en LaTeX, Cover Letter y respuestas.</p>
              </button>

              <button
                onClick={() => setInput('¿Qué respondemos si el formulario pregunta por patrocinio de Visa o estatus legal en EE.UU.?')}
                type="button"
                className="p-3.5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-800/60 hover:border-indigo-500/40 transition-all cursor-pointer group"
              >
                <span className="text-base mb-1 block">⚖️</span>
                <h4 className="text-xs font-bold text-zinc-200 group-hover:text-indigo-300">Preguntas Filtro</h4>
                <p className="text-[11px] text-zinc-400 mt-1">Respuestas autorizadas sobre Visa TN, KMP o TDD.</p>
              </button>
            </div>

          </div>
        ) : (
          /* ========================================================= */
          /* ESTADO 2: HILO DE MENSAJES ACTIVO */
          /* ========================================================= */
          <div className="flex-1 flex flex-col overflow-hidden">
            
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
              {activeMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 max-w-4xl mx-auto ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.sender === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs font-mono shrink-0 mt-1">
                      AI
                    </div>
                  )}

                  <div className={`p-4 sm:p-5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-zinc-900 text-zinc-100 border border-zinc-800 max-w-[85%] sm:max-w-[75%]'
                      : 'bg-zinc-900/70 text-zinc-200 border border-zinc-800/80 flex-1 space-y-4'
                  }`}>
                    
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* RENDERIZADO DEL PAQUETE SI APLICA */}
                    {msg.pkg && (
                      <div className="space-y-4 pt-2">
                        
                        {/* CASO: BORRADOR DE EMAIL (LinkedIn Post) */}
                        {msg.pkg.emailDraft && (
                          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                              <span className="font-mono text-xs text-indigo-400 font-bold uppercase tracking-wider">
                                ✉️ Borrador de Email Listo para Enviar
                              </span>
                              <button
                                onClick={() => handleCopy(msg.pkg!.emailDraft!, `email-${idx}`)}
                                type="button"
                                className="px-3 py-1 rounded-lg text-xs font-mono bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 transition-all flex items-center gap-1 active:scale-95 cursor-pointer font-semibold"
                              >
                                {copiedKey === `email-${idx}` ? '✓ Copiado' : '📋 Copiar Email'}
                              </button>
                            </div>

                            {msg.pkg.emailSubject && (
                              <div className="text-xs font-mono text-zinc-400">
                                <span className="font-bold text-zinc-300">Asunto: </span>
                                {msg.pkg.emailSubject}
                              </div>
                            )}

                            <pre className="text-xs text-zinc-200 whitespace-pre-wrap font-sans leading-relaxed bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/60 select-all">
{msg.pkg.emailDraft}
                            </pre>
                          </div>
                        )}

                        {/* CASO: CV EN LATEX & COVER LETTER (ATS Package) */}
                        {msg.pkg.latexCv && (
                          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800/80">
                              <div>
                                <span className="font-mono text-xs text-indigo-400 font-bold uppercase tracking-wider">
                                  📜 CV Adaptado en LaTeX (ModernCV)
                                </span>
                                <p className="text-[11px] text-zinc-500">Formato vectorial 100% compatible ATS para {msg.pkg.companyName || 'esta vacante'}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleCopy(msg.pkg!.latexCv!, `latex-${idx}`)}
                                  type="button"
                                  className="px-2.5 py-1 rounded-lg text-xs font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-all cursor-pointer font-semibold"
                                >
                                  {copiedKey === `latex-${idx}` ? '✓ Copiado' : '📋 Copiar .tex'}
                                </button>
                                <button
                                  onClick={() => handleDownloadTex(msg.pkg!.latexCv!, `cv-jesus-medina-${(msg.pkg!.companyName || 'tailored').toLowerCase()}.tex`)}
                                  type="button"
                                  className="px-2.5 py-1 rounded-lg text-xs font-mono bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 transition-all cursor-pointer font-semibold"
                                >
                                  ⬇ Descargar .tex
                                </button>
                              </div>
                            </div>

                            <details className="text-xs font-mono text-zinc-400 bg-zinc-900/50 rounded-lg p-2.5 border border-zinc-800/60 cursor-pointer">
                              <summary className="font-semibold text-zinc-300 hover:text-indigo-400 transition-colors">
                                Ver código LaTeX generado
                              </summary>
                              <pre className="mt-2 p-2 bg-zinc-950 rounded text-[11px] text-zinc-300 overflow-x-auto max-h-48 leading-relaxed">
{msg.pkg.latexCv}
                              </pre>
                            </details>
                          </div>
                        )}

                        {/* CASO: COVER LETTER */}
                        {msg.pkg.coverLetter && (
                          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                              <span className="font-mono text-xs text-indigo-400 font-bold uppercase tracking-wider">
                                📄 Cover Letter Personalizado
                              </span>
                              <button
                                onClick={() => handleCopy(msg.pkg!.coverLetter!, `cover-${idx}`)}
                                type="button"
                                className="px-3 py-1 rounded-lg text-xs font-mono bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 transition-all flex items-center gap-1 active:scale-95 cursor-pointer font-semibold"
                              >
                                {copiedKey === `cover-${idx}` ? '✓ Copiado' : '📋 Copiar Carta'}
                              </button>
                            </div>
                            <pre className="text-xs text-zinc-200 whitespace-pre-wrap font-sans leading-relaxed bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/60 select-all">
{msg.pkg.coverLetter}
                            </pre>
                          </div>
                        )}

                        {/* CASO: RESPUESTAS PARA EL FORMULARIO ATS */}
                        {msg.pkg.atsAnswers && msg.pkg.atsAnswers.length > 0 && (
                          <div className="space-y-3 pt-2">
                            <div className="font-mono text-xs text-zinc-400 uppercase tracking-wider font-semibold">
                              📝 Respuestas Específicas para el Formulario:
                            </div>
                            {msg.pkg.atsAnswers.map((ans, aIdx) => (
                              <div key={aIdx} className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-xs text-zinc-100">{ans.question}</span>
                                  <button
                                    onClick={() => handleCopy(ans.answer, `ans-${idx}-${aIdx}`)}
                                    type="button"
                                    className="px-2.5 py-1 rounded text-xs font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-all cursor-pointer"
                                  >
                                    {copiedKey === `ans-${idx}-${aIdx}` ? '✓ Copiado' : '📋 Copiar'}
                                  </button>
                                </div>
                                <p className="text-xs text-zinc-300 leading-relaxed font-sans bg-zinc-900/50 p-2.5 rounded border border-zinc-800/60">
                                  "{ans.answer}"
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* ========================================================= */}
                        {/* PERSISTENCIA PARA NOTION: BLOQUE DE PREGUNTA NUEVA */}
                        {/* ========================================================= */}
                        {msg.pkg.notionSyncSnippet && (
                          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-base">💡</span>
                                <span className="font-mono text-xs font-bold text-amber-300 uppercase tracking-wider">
                                  Pregunta Nueva para Notion
                                </span>
                              </div>
                              <button
                                onClick={() => handleCopy(msg.pkg!.notionSyncSnippet!, `notion-${idx}`)}
                                type="button"
                                className="px-3 py-1.5 rounded-lg text-xs font-mono bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 transition-all flex items-center gap-1 font-bold cursor-pointer"
                              >
                                {copiedKey === `notion-${idx}` ? '✓ Copiado para Notion' : '📋 Copiar para Notion'}
                              </button>
                            </div>
                            <p className="text-[11px] text-amber-400/90 leading-relaxed">
                              Karla: Toca el botón de arriba, ve a tu tablero de Notion y pega este bloque en las notas de la vacante. Así Jesús podrá incorporarlo a la base de datos oficial.
                            </p>
                            <pre className="text-xs font-mono text-zinc-300 bg-zinc-950 p-2.5 rounded border border-zinc-800 select-all whitespace-pre-wrap">
{msg.pkg.notionSyncSnippet}
                            </pre>
                          </div>
                        )}

                      </div>
                    )}

                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-xs text-zinc-300 font-mono shrink-0 mt-1">
                      KM
                    </div>
                  )}
                </div>
              ))}

              {/* Indicador de pensamiento de IA */}
              {isThinking && (
                <div className="flex gap-3 max-w-4xl mx-auto items-center">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs font-mono animate-pulse">
                    AI
                  </div>
                  <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-xs font-mono text-zinc-400">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
                    <span>Analizando con Gemini 2.0 Flash y redactando paquete...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Inferior en el Hilo Activo */}
            <footer className="p-4 bg-zinc-900/90 border-t border-zinc-800 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="max-w-4xl mx-auto flex items-center gap-2 bg-zinc-950 border border-zinc-700/80 rounded-2xl px-3 py-2 focus-within:border-indigo-500 transition-colors"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribe tu consulta o pega más texto de la vacante..."
                  className="flex-1 bg-transparent text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none px-2 py-1"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isThinking}
                  className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </button>
              </form>
            </footer>

          </div>
        )}

      </main>

      {/* ========================================================= */}
      {/* MODAL DE CONFIGURACIÓN DE API KEY (GEMINI) */}
      {/* ========================================================= */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚙️</span>
                <h3 className="font-bold text-sm text-zinc-100">Configuración de Inteligencia Artificial</h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                type="button"
                className="text-zinc-500 hover:text-zinc-300 text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-zinc-400 leading-relaxed">
                Conecta **Google Gemini 2.0 Flash** para activar el análisis contextual profundo de vacantes y la redacción de CVs personalizados en LaTeX desde la tablet de Karla.
              </p>

              <div>
                <label className="block text-xs font-mono text-zinc-300 mb-1.5">
                  Gemini API Key (Google AI Studio)
                </label>
                <input
                  type="password"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 font-mono placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-zinc-500 mt-1.5">
                  La clave se guarda localmente en esta tablet (<code className="text-zinc-400 font-mono">localStorage</code>). Es 100% gratuita y tiene capa ilimitada de prueba en aistudio.google.com.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800/80">
              <button
                onClick={() => setShowSettingsModal(false)}
                type="button"
                className="px-4 py-2 rounded-xl text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveApiKey}
                type="button"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs font-mono transition-colors shadow-md shadow-indigo-600/30"
              >
                Guardar y Conectar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
