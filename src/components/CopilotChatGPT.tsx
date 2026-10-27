import React, { useState, useRef, useEffect } from 'react';
import { marked } from 'marked';
import { analyzeAndGeneratePackage } from '../data/applicationPackageGenerator';
import type { ApplicationPackage } from '../data/applicationPackageGenerator';
import { callGeminiApi, parseGeminiResponseToPackage, GEMINI_STORAGE_KEY } from '../data/geminiClient';
import type { ChatMessageContext } from '../data/geminiClient';
import { STORAGE_KEY } from './PinGate';
import ProfileView from './views/ProfileView';
import GuidesView from './views/GuidesView';

// Configurar marked para Markdown con soporte GFM y saltos de línea suaves
marked.setOptions({
  gfm: true,
  breaks: true,
});

function renderMarkdown(content: string): string {
  if (!content) return '';
  try {
    return marked.parse(content) as string;
  } catch (err) {
    console.error('Error rendering markdown:', err);
    return content;
  }
}

interface ThreadSession {
  id: string;
  title: string;
  timestamp: string;
  messages: {
    sender: 'user' | 'assistant';
    text: string;
    rawLlmOutput?: string;
    pkg?: ApplicationPackage;
    timestamp: string;
  }[];
}

const STORAGE_SESSIONS_KEY = 'karla_chat_sessions_v1';

interface CopilotChatGPTProps {
  initialApiKey?: string;
  initialTab?: 'copilot' | 'perfil' | 'guias';
}

export default function CopilotChatGPT({ initialApiKey = '', initialTab = 'copilot' }: CopilotChatGPTProps) {
  const [activeTab, setActiveTab] = useState<'copilot' | 'perfil' | 'guias'>(initialTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isNarrowScreen, setIsNarrowScreen] = useState(false);
  const [sessions, setSessions] = useState<ThreadSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('new');
  const [input, setInput] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>(initialApiKey);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [tempApiKey, setTempApiKey] = useState<string>(initialApiKey);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sincronización de pestaña activa con URL y detección en carga inicial
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'perfil' || tabParam === 'guias' || tabParam === 'copilot') {
        setActiveTab(tabParam);
      } else if (window.location.pathname.includes('/perfil')) {
        setActiveTab('perfil');
      } else if (window.location.pathname.includes('/guias')) {
        setActiveTab('guias');
      }
    }
  }, []);

  const handleTabChange = (tab: 'copilot' | 'perfil' | 'guias') => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url.toString());
    }
    if (isNarrowScreen) {
      setSidebarOpen(false);
    }
  };

  // Detectar ancho de pantalla para comportamiento tablet/móvil
  useEffect(() => {
    const handleResize = () => {
      const isNarrow = window.innerWidth < 1024;
      setIsNarrowScreen(isNarrow);
      // En pantalla ancha (>=1024px, tablet landscape o desktop), abrir por defecto
      if (!isNarrow) {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Función de ayuda táctil: pegar directamente desde el portapapeles en 1 toque
  const handlePasteClipboard = async () => {
    try {
      if (navigator?.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setInput(prev => prev ? `${prev}\n\n${text}` : text);
        }
      }
    } catch (e) {
      console.warn('Acceso al portapapeles denegado o no soportado:', e);
    }
  };

  // Cargar sesiones y API Key desde localStorage o .env
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
      } else if (initialApiKey) {
        setApiKey(initialApiKey);
        setTempApiKey(initialApiKey);
      }
    } catch (e) {
      console.error('Error al inicializar datos:', e);
    }
  }, [initialApiKey]);

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
    let rawOutput = '';

    // Recuperar historial si estamos en una sesión activa existente
    const activeSession = currentSessionId !== 'new'
      ? sessions.find(s => s.id === currentSessionId)
      : null;

    const history: ChatMessageContext[] = (activeSession?.messages || [])
      .slice(-10)
      .map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.rawLlmOutput || m.text
      }));

    try {
      let packageResolved = false;

      // 1. Intentar primero a través de la API del servidor (/api/generate)
      // Soporta local dev y Cloudflare Pages Functions sin requerir que Karla introduzca manualmente la key
      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { 'x-api-key': apiKey } : {})
          },
          body: JSON.stringify({
            prompt: query,
            apiKey: apiKey || undefined,
            history
          })
        });

        if (response.ok) {
          const resJson = await response.json();
          if (resJson.success && resJson.data) {
            pkg = resJson.data;
            rawOutput = resJson.rawOutput || '';
            packageResolved = true;
          }
        }
      } catch (apiErr) {
        console.warn('Endpoint /api/generate no disponible o falló:', apiErr);
      }

      // 2. Fallback: Conexión directa del cliente con Gemini si hay API key en el navegador
      if (!packageResolved && apiKey) {
        rawOutput = await callGeminiApi(query, apiKey, history);
        pkg = parseGeminiResponseToPackage(rawOutput, query);
        packageResolved = true;
      }

      // 3. Fallback: Motor local determinista estructurado
      if (!packageResolved) {
        pkg = analyzeAndGeneratePackage(query);
      }
    } catch (err: any) {
      console.error('Error generando paquete de postulación:', err);
      pkg = {
        type: 'general',
        summaryNote: `⚠️ Error al conectar con el motor de IA: ${err.message || err}. Usando motor de respaldo:`,
        atsAnswers: [{
          question: query,
          answer: 'Por favor verifica la conexión o la API Key de Gemini en Ajustes.',
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
          { sender: 'assistant', text: pkg.summaryNote, rawLlmOutput: rawOutput, pkg, timestamp }
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
              { sender: 'assistant' as const, text: pkg.summaryNote, rawLlmOutput: rawOutput, pkg, timestamp }
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
    <div className="flex h-full w-full bg-zinc-950 text-zinc-100 rounded-none sm:rounded-2xl border-0 sm:border border-zinc-800 overflow-hidden shadow-2xl relative font-sans">
      
      {/* ========================================================= */}
      {/* TELÓN DE FONDO (BACKDROP) PARA TABLET PORTRAIT / MÓVIL    */}
      {/* ========================================================= */}
      {isNarrowScreen && sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 transition-opacity"
          aria-label="Cerrar panel lateral"
        />
      )}

      {/* ========================================================= */}
      {/* BARRA LATERAL (DRAWER EN TABLET PORTRAIT, SPLIT EN LANDSCAPE) */}
      {/* ========================================================= */}
      <aside className={`${
        isNarrowScreen
          ? `fixed inset-y-0 left-0 z-40 w-80 max-w-[85vw] h-full bg-zinc-900 border-r border-zinc-800 shadow-2xl transition-transform duration-300 ease-in-out ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`
          : `${sidebarOpen ? 'w-72 lg:w-80' : 'w-0 -translate-x-full lg:w-0'} bg-zinc-900/90 border-r border-zinc-800 transition-all duration-300 shrink-0`
      } flex flex-col justify-between overflow-hidden`}>
        
        {/* Cabecera Sidebar */}
        <div className="p-3.5 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs font-mono">
              AI
            </div>
            <span className="font-bold text-sm tracking-tight text-zinc-100">Copilot Karla</span>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            type="button"
            className="w-8 h-8 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 active:scale-95 flex items-center justify-center transition-colors cursor-pointer"
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
            onClick={() => {
              handleNewChat();
              setActiveTab('copilot');
              if (isNarrowScreen) setSidebarOpen(false);
            }}
            type="button"
            className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700/80 active:scale-98 text-zinc-100 font-semibold text-xs sm:text-sm border border-zinc-700/60 transition-all cursor-pointer shadow-sm group min-h-[44px]"
          >
            <span className="text-indigo-400 group-hover:rotate-90 transition-transform text-base font-bold">＋</span>
            <span>Nueva Postulación</span>
          </button>

          <nav className="pt-2 space-y-1 text-xs font-mono">
            <button 
              onClick={() => handleTabChange('copilot')}
              type="button"
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all cursor-pointer font-medium min-h-[40px] text-left ${
                activeTab === 'copilot'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
              }`}
            >
              <span>💬</span>
              <span>Copilot Chat</span>
            </button>
            <button 
              onClick={() => handleTabChange('perfil')}
              type="button"
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all cursor-pointer font-medium min-h-[40px] text-left ${
                activeTab === 'perfil'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
              }`}
            >
              <span>👤</span>
              <span>Perfil y Trayectoria</span>
            </button>
            <button 
              onClick={() => handleTabChange('guias')}
              type="button"
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all cursor-pointer font-medium min-h-[40px] text-left ${
                activeTab === 'guias'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
              }`}
            >
              <span>📖</span>
              <span>Guías y Respuestas</span>
            </button>
            <a 
              href="https://notion.so" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-zinc-400 hover:text-indigo-300 hover:bg-zinc-800/50 transition-colors min-h-[40px]"
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
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors text-left cursor-pointer min-h-[40px]"
            >
              <div className="flex items-center gap-2">
                <span>⚙️</span>
                <span>Modelo LLM</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded border font-mono ${
                apiKey ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
              }`}>
                {apiKey ? 'Gemini 2.5' : 'Local'}
              </span>
            </button>
          </nav>
        </div>

        {/* Lista de Sesiones Recientes con Touch Targets Generosos */}
        <div className="flex-1 px-3 py-2 overflow-y-auto space-y-1.5">
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
                onClick={() => {
                  setCurrentSessionId(s.id);
                  setActiveTab('copilot');
                  if (isNarrowScreen) setSidebarOpen(false);
                }}
                className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer min-h-[44px] ${
                  currentSessionId === s.id && activeTab === 'copilot'
                    ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm'
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
                  className="opacity-60 group-hover:opacity-100 p-1.5 text-zinc-500 hover:text-rose-400 transition-opacity min-w-[28px] min-h-[28px] flex items-center justify-center cursor-pointer"
                  title="Eliminar sesión"
                  aria-label="Eliminar sesión"
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
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors text-xs font-mono cursor-pointer"
            title="Bloquear portal"
          >
            🔒
          </button>
        </div>

      </aside>

      {/* ========================================================= */}
      {/* ÁREA CENTRAL PRINCIPAL (STAGE CHATGPT) */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col bg-zinc-950 relative overflow-hidden min-h-0">
        
        {/* Cabecera Única Unificada (Top Bar) */}
        <header className="px-3 sm:px-4 h-14 border-b border-zinc-800/80 flex items-center justify-between shrink-0 bg-zinc-950/90 backdrop-blur-md z-20">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              type="button"
              className="w-10 h-10 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 active:scale-95 border border-zinc-800 flex items-center justify-center transition-all cursor-pointer shrink-0"
              title={sidebarOpen ? "Ocultar panel lateral" : "Mostrar panel de postulaciones"}
              aria-label="Alternar panel lateral"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Acceso rápido / Logo JM */}
            <button 
              onClick={() => handleTabChange('copilot')} 
              type="button"
              className="hidden xs:flex items-center gap-2 group py-1 shrink-0 text-left cursor-pointer" 
              title="Ir al Copilot"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-mono font-bold text-xs group-hover:border-indigo-400 transition-colors">
                JM
              </div>
              <span className="font-semibold text-xs tracking-tight text-zinc-200 hidden md:inline">Jesús Medina</span>
            </button>

            <div className="h-4 w-px bg-zinc-800 hidden xs:block shrink-0" />

            {/* Selector de Vistas SPA (Copilot, Perfil, Guías) */}
            <div className="flex items-center bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 shrink-0">
              <button
                onClick={() => handleTabChange('copilot')}
                type="button"
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 min-h-[32px] ${
                  activeTab === 'copilot'
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 font-medium'
                }`}
                title="Copilot de Postulaciones"
              >
                <span>💬</span>
                <span className="hidden sm:inline">Copilot</span>
              </button>

              <button
                onClick={() => handleTabChange('perfil')}
                type="button"
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 min-h-[32px] ${
                  activeTab === 'perfil'
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 font-medium'
                }`}
                title="Perfil Técnico y Trayectoria"
              >
                <span>👤</span>
                <span className="hidden sm:inline">Perfil</span>
              </button>

              <button
                onClick={() => handleTabChange('guias')}
                type="button"
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 min-h-[32px] ${
                  activeTab === 'guias'
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 font-medium'
                }`}
                title="Guías de Redacción y Respuestas Oficiales"
              >
                <span>📖</span>
                <span className="hidden sm:inline">Guías</span>
              </button>
            </div>

            {/* Controles contextuales cuando está activa la pestaña Copilot */}
            {activeTab === 'copilot' && (
              <div className="hidden md:flex items-center gap-2 min-w-0">
                <button
                  onClick={() => {
                    handleNewChat();
                    if (isNarrowScreen) setSidebarOpen(false);
                  }}
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 border border-zinc-700 transition-all font-semibold cursor-pointer shrink-0 min-h-[36px]"
                  title="Iniciar nueva postulación"
                >
                  <span className="text-indigo-400 font-bold">＋</span>
                  <span>Nueva</span>
                </button>

                <h2 className="text-xs sm:text-sm font-bold text-zinc-300 truncate max-w-[130px] lg:max-w-[200px] ml-1">
                  {currentSession ? currentSession.title : 'Nueva Postulación'}
                </h2>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <a 
              href="https://notion.so" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono text-zinc-300 hover:text-indigo-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors"
              title="Abrir Notion en pestaña nueva"
            >
              <span>📋 Notion</span>
              <span className="text-[10px] text-zinc-500">↗</span>
            </a>

            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border ${
              apiKey ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${apiKey ? 'bg-indigo-400 animate-pulse' : 'bg-zinc-500'}`}></span>
              <span className="hidden sm:inline">{apiKey ? 'Gemini 2.5' : 'Local'}</span>
            </span>

            <button
              onClick={() => setShowSettingsModal(true)}
              type="button"
              className="w-9 h-9 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 active:scale-95 text-zinc-400 hover:text-zinc-200 border border-zinc-700/60 flex items-center justify-center transition-all cursor-pointer text-xs"
              title="Ajustes de IA"
              aria-label="Ajustes de IA"
            >
              ⚙️
            </button>

            <button
              onClick={handleLock}
              type="button"
              className="w-9 h-9 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 active:scale-95 text-zinc-400 hover:text-zinc-200 border border-zinc-700/60 flex items-center justify-center transition-all cursor-pointer text-xs"
              title="Bloquear portal"
              aria-label="Bloquear portal"
            >
              🔒
            </button>
          </div>
        </header>

        {/* ========================================================= */}
        {/* VISTA 1: COPILOT CHAT (HERO O HILO ACTIVO) */}
        {/* ========================================================= */}
        {activeTab === 'copilot' && (
          activeMessages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 text-center max-w-2xl sm:max-w-3xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-300 overflow-y-auto w-full">
            
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto text-2xl font-mono mb-3">
                ✨
              </div>
              <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-zinc-100">
                ¿En qué postulación trabajamos hoy, Karla?
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed">
                Pega el texto de un post de LinkedIn, el Job Description de un formulario ATS o formula cualquier pregunta.
              </p>
            </div>

            {/* Input Cápsula Grande Central (Tablet Friendly) */}
            <div className="w-full max-w-2xl">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="relative bg-zinc-900/90 border border-zinc-700/80 rounded-3xl p-3.5 sm:p-4 shadow-xl focus-within:border-indigo-500 transition-all flex flex-col gap-2.5 text-left"
              >
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Pega aquí el post de LinkedIn, el Job Description de la vacante o tu consulta..."
                  rows={4}
                  className="w-full bg-transparent text-base sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none px-2 py-1 leading-relaxed"
                />

                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePasteClipboard}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 border border-zinc-700 transition-all cursor-pointer font-medium text-xs min-h-[36px]"
                      title="Pegar directamente del portapapeles"
                    >
                      <span>📋</span>
                      <span>Pegar</span>
                    </button>
                    <span className="hidden sm:inline text-zinc-500 text-[11px] font-mono">💡 Pega texto largo o corto</span>
                  </div>

                  <button
                    type="submit"
                    disabled={!input.trim() || isThinking}
                    className="w-11 h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-md shadow-indigo-600/30"
                    title="Enviar a Copilot"
                    aria-label="Enviar"
                  >
                    {isThinking ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Tarjetas de Acceso Rápido Inferiores (Touch Friendly) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full max-w-2xl text-left">
              <button
                onClick={() => setInput('We are hiring a Staff Android Software Engineer at Cash App! Reach out to careers@block.xyz with your resume.')}
                type="button"
                className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-800/60 active:scale-98 hover:border-indigo-500/40 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <span className="text-xl mb-1.5 block">✉️</span>
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-200 group-hover:text-indigo-300">Post de LinkedIn</h4>
                  <p className="text-[11px] sm:text-xs text-zinc-400 mt-1 leading-relaxed">Genera el kit 4-en-1 con correo directo al recruiter.</p>
                </div>
              </button>

              <button
                onClick={() => setInput('Job Description: Senior Mobile Platform Engineer at DoorDash. Requirements: 8+ years Android SDK, Kotlin Multiplatform, modular architecture, Compose.')}
                type="button"
                className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-800/60 active:scale-98 hover:border-indigo-500/40 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <span className="text-xl mb-1.5 block">📄</span>
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-200 group-hover:text-indigo-300">Job Description ATS</h4>
                  <p className="text-[11px] sm:text-xs text-zinc-400 mt-1 leading-relaxed">Recomienda CV canónico, Cover Letter y respuestas.</p>
                </div>
              </button>

              <button
                onClick={() => setInput('¿Qué respondemos si el formulario pregunta por patrocinio de Visa o estatus legal en EE.UU.?')}
                type="button"
                className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-800/60 active:scale-98 hover:border-indigo-500/40 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <span className="text-xl mb-1.5 block">⚖️</span>
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-200 group-hover:text-indigo-300">Preguntas Filtro</h4>
                  <p className="text-[11px] sm:text-xs text-zinc-400 mt-1 leading-relaxed">Respuestas autorizadas sobre Visa TN, KMP o TDD.</p>
                </div>
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
                    
                    {msg.sender === 'assistant' ? (
                      <div 
                        className="copilot-markdown text-xs sm:text-sm text-zinc-200 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}
                      />
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    )}

                    {/* RENDERIZADO DEL PAQUETE SI APLICA */}
                    {msg.pkg && (
                      <div className="space-y-4 pt-2">
                        
                        {/* CASO: RECOMENDACIÓN DE CV DE LOS 3 ARQUETIPOS */}
                        {msg.pkg.cvRecommendation && (
                          <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-amber-500/20">
                              <span className="font-mono text-xs sm:text-sm text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                📄 CV Oficial a Adjuntar
                              </span>
                              {msg.pkg.cvLink && (
                                <a
                                  href={msg.pkg.cvLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-mono bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 text-amber-300 border border-amber-500/40 transition-all font-bold cursor-pointer w-full sm:w-auto min-h-[42px]"
                                >
                                  <span>Abrir y Descargar PDF</span>
                                  <span className="text-xs">↗</span>
                                </a>
                              )}
                            </div>
                            <div className="text-xs sm:text-sm text-amber-100/90 leading-relaxed font-sans">
                              {msg.pkg.cvRecommendation}
                            </div>
                          </div>
                        )}

                        {/* CASO: MENSAJE DE OUTREACH (Email) */}
                        {msg.pkg.emailDraft && (
                          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3.5 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-zinc-800/80">
                              <span className="font-mono text-xs sm:text-sm text-indigo-400 font-bold uppercase tracking-wider">
                                {msg.pkg.emailSubject ? '✉️ Correo de Postulación' : '💬 Mensaje de Postulación'}
                              </span>
                              <button
                                onClick={() => handleCopy(msg.pkg!.emailDraft!, `email-${idx}`)}
                                type="button"
                                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-mono bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer font-bold min-h-[42px]"
                              >
                                {copiedKey === `email-${idx}` ? '✓ Copiado' : '📋 Copiar Correo'}
                              </button>
                            </div>

                            {msg.pkg.emailSubject && (
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm font-mono text-zinc-300 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/60">
                                <div className="truncate flex-1">
                                  <span className="font-bold text-zinc-400">Asunto: </span>
                                  <span className="text-zinc-200">{msg.pkg.emailSubject}</span>
                                </div>
                                <button
                                  onClick={() => handleCopy(msg.pkg!.emailSubject!, `sub-${idx}`)}
                                  type="button"
                                  className="text-xs font-mono text-zinc-300 hover:text-indigo-300 px-3 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 active:scale-95 transition-all self-end sm:self-auto cursor-pointer font-medium min-h-[36px]"
                                >
                                  {copiedKey === `sub-${idx}` ? '✓' : 'Copiar'}
                                </button>
                              </div>
                            )}

                            <pre className="text-xs sm:text-sm text-zinc-200 whitespace-pre-wrap font-sans leading-relaxed bg-zinc-900/50 p-3.5 sm:p-4 rounded-xl border border-zinc-800/60 select-all">
{msg.pkg.emailDraft}
                            </pre>
                          </div>
                        )}

                        {/* CASO: NOTA DE CONEXIÓN DE LINKEDIN (< 200 caracteres) */}
                        {msg.pkg.linkedinNote && (
                          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950 border border-blue-900/40 space-y-3.5 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-zinc-800/80">
                              <div className="flex items-center gap-2.5">
                                <span className="font-mono text-xs sm:text-sm text-blue-400 font-bold uppercase tracking-wider">
                                  💬 Nota de Conexión LinkedIn
                                </span>
                                <span className={`text-[11px] font-mono px-2 py-0.5 rounded-md font-semibold ${
                                  msg.pkg.linkedinNote.length <= 200 
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                }`}>
                                  {msg.pkg.linkedinNote.length}/200 chars
                                </span>
                              </div>
                              <button
                                onClick={() => handleCopy(msg.pkg!.linkedinNote!, `linkedin-${idx}`)}
                                type="button"
                                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-mono bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer font-bold min-h-[42px]"
                              >
                                {copiedKey === `linkedin-${idx}` ? '✓ Copiado' : '📋 Copiar Nota'}
                              </button>
                            </div>
                            <pre className="text-xs sm:text-sm text-zinc-200 whitespace-pre-wrap font-sans leading-relaxed bg-zinc-900/50 p-3.5 sm:p-4 rounded-xl border border-zinc-800/60 select-all">
{msg.pkg.linkedinNote}
                            </pre>
                          </div>
                        )}

                        {/* CASO: MICRO-COMENTARIO PARA EL POST PÚBLICO */}
                        {msg.pkg.commentDraft && (
                          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs text-indigo-400 font-bold uppercase tracking-wider">
                                💬 Comentario Sugerido para la Publicación
                              </span>
                              <button
                                onClick={() => handleCopy(msg.pkg!.commentDraft!, `comment-${idx}`)}
                                type="button"
                                className="px-2.5 py-1 rounded-lg text-xs font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-all flex items-center gap-1 cursor-pointer font-semibold"
                              >
                                {copiedKey === `comment-${idx}` ? '✓ Copiado' : '📋 Copiar Comentario'}
                              </button>
                            </div>
                            <p className="text-xs text-zinc-300 leading-relaxed font-sans bg-zinc-900/50 p-2.5 rounded border border-zinc-800/60">
                              "{msg.pkg.commentDraft}"
                            </p>
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
                          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950 border border-zinc-800/90 space-y-3.5 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-zinc-800/80">
                              <span className="font-mono text-xs sm:text-sm text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                📄 Cover Letter Personalizado
                              </span>
                              <button
                                onClick={() => handleCopy(msg.pkg!.coverLetter!, `cover-${idx}`)}
                                type="button"
                                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-mono bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer font-bold min-h-[42px]"
                              >
                                {copiedKey === `cover-${idx}` ? '✓ Copiado' : '📋 Copiar Carta'}
                              </button>
                            </div>
                            <div 
                              className="copilot-markdown text-xs sm:text-sm text-zinc-200 leading-relaxed bg-zinc-900/50 p-3.5 sm:p-4 rounded-xl border border-zinc-800/60 font-sans"
                              dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.pkg.coverLetter) }}
                            />
                          </div>
                        )}

                        {/* CASO: RESPUESTAS PARA EL FORMULARIO ATS */}
                        {msg.pkg.atsAnswers && msg.pkg.atsAnswers.length > 0 && (
                          <div className="space-y-3 pt-2">
                            <div className="font-mono text-xs sm:text-sm text-zinc-400 uppercase tracking-wider font-semibold">
                              📝 Respuestas Específicas para el Formulario:
                            </div>
                            {msg.pkg.atsAnswers.map((ans, aIdx) => (
                              <div key={aIdx} className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2.5 shadow-sm">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="font-bold text-xs sm:text-sm text-zinc-100">{ans.question}</span>
                                  <button
                                    onClick={() => handleCopy(ans.answer, `ans-${idx}-${aIdx}`)}
                                    type="button"
                                    className="px-3 py-1.5 rounded-xl text-xs font-mono bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 border border-zinc-700 transition-all cursor-pointer font-medium min-h-[38px] flex items-center gap-1"
                                  >
                                    {copiedKey === `ans-${idx}-${aIdx}` ? '✓ Copiado' : '📋 Copiar'}
                                  </button>
                                </div>
                                <div 
                                  className="copilot-markdown text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/60"
                                  dangerouslySetInnerHTML={{ __html: renderMarkdown(ans.answer) }}
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* ========================================================= */}
                        {/* PERSISTENCIA PARA NOTION: BLOQUE DE PREGUNTA NUEVA */}
                        {/* ========================================================= */}
                        {msg.pkg.notionSyncSnippet && (
                          <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-amber-500/20">
                              <div className="flex items-center gap-2">
                                <span className="text-base">💡</span>
                                <span className="font-mono text-xs sm:text-sm font-bold text-amber-300 uppercase tracking-wider">
                                  Pregunta Nueva para Notion
                                </span>
                              </div>
                              <button
                                onClick={() => handleCopy(msg.pkg!.notionSyncSnippet!, `notion-${idx}`)}
                                type="button"
                                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-mono bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 text-amber-200 border border-amber-500/40 transition-all flex items-center gap-1.5 font-bold cursor-pointer min-h-[42px]"
                              >
                                {copiedKey === `notion-${idx}` ? '✓ Copiado para Notion' : '📋 Copiar para Notion'}
                              </button>
                            </div>
                            <p className="text-xs text-amber-300/90 leading-relaxed">
                              Karla: Toca el botón de arriba, ve a tu tablero de Notion y pega este bloque en las notas de la vacante. Así Jesús podrá incorporarlo a la base de datos oficial.
                            </p>
                            <pre className="text-xs font-mono text-zinc-300 bg-zinc-950 p-3 rounded-xl border border-zinc-800 select-all whitespace-pre-wrap leading-relaxed">
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
                    <span>Analizando con Gemini 2.5 Flash y redactando paquete 4-en-1...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Inferior en el Hilo Activo (Tablet Friendly con Multilínea) */}
            <footer className="p-2.5 sm:p-4 bg-zinc-900/90 border-t border-zinc-800 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="max-w-4xl mx-auto flex items-end gap-2 bg-zinc-950 border border-zinc-700/80 rounded-2xl p-1.5 sm:px-3 sm:py-2 focus-within:border-indigo-500 transition-colors shadow-lg"
              >
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  className="w-10 h-10 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 active:scale-95 flex items-center justify-center transition-all cursor-pointer shrink-0"
                  title="Pegar texto del portapapeles"
                  aria-label="Pegar texto del portapapeles"
                >
                  📋
                </button>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Escribe tu consulta o pega más texto..."
                  rows={Math.min(4, Math.max(1, input.split('\n').length))}
                  className="flex-1 bg-transparent text-base sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none px-2 py-2 resize-none leading-relaxed max-h-32"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isThinking}
                  className="w-11 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 active:scale-95 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-md shadow-indigo-600/30"
                  title="Enviar mensaje"
                  aria-label="Enviar mensaje"
                >
                  {isThinking ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  )}
                </button>
              </form>
            </footer>

          </div>
        )
      )}

        {/* ========================================================= */}
        {/* VISTA 2: PERFIL TÉCNICO Y TRAYECTORIA */}
        {/* ========================================================= */}
        {activeTab === 'perfil' && (
          <ProfileView />
        )}

        {/* ========================================================= */}
        {/* VISTA 3: GUÍAS Y RESPUESTAS OFICIALES */}
        {/* ========================================================= */}
        {activeTab === 'guias' && (
          <GuidesView />
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
                className="w-9 h-9 rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 flex items-center justify-center transition-colors cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-zinc-400 leading-relaxed">
                Conecta **Google Gemini 2.5 Flash** para activar el análisis contextual profundo de vacantes y la redacción del kit de postulación 4-en-1 desde la tablet de Karla.
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
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-3 text-base sm:text-xs text-zinc-100 font-mono placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-zinc-500 mt-1.5 leading-relaxed">
                  La clave se guarda localmente en esta tablet (<code className="text-zinc-400 font-mono">localStorage</code>). El portal en producción ya cuenta con backend integrado por defecto.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800/80">
              <button
                onClick={() => setShowSettingsModal(false)}
                type="button"
                className="px-4 py-2.5 rounded-xl text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors min-h-[42px] font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveApiKey}
                type="button"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold text-xs font-mono transition-all shadow-md shadow-indigo-600/30 min-h-[42px] cursor-pointer"
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
