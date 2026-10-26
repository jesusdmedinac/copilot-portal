import React, { useState, useRef, useEffect } from 'react';
import profile from '../data/profile.json';
import guides from '../data/guides.json';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  links?: { label: string; url: string }[];
  copySnippet?: string;
  timestamp: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'welcome',
    sender: 'assistant',
    text: '¡Hola Karla! Soy tu copiloto operativo. Estoy anclado a la experiencia verificada de Jesús y sus plantillas autorizadas. Puedes tocar cualquiera de las consultas rápidas abajo o escribir cualquier duda que encuentres en un formulario.',
    links: [
      { label: 'Ver Perfil Oficial', url: '/perfil' },
      { label: 'Ver Guías de Redacción', url: '/guias' }
    ],
    timestamp: 'Ahora'
  }
];

const SUGGESTED_QUERIES = [
  '¿Qué respondemos si piden iOS?',
  '¿Cuál es el empleo actual y fechas?',
  '¿Qué contestar sobre la Visa TN?',
  '¿Qué plantilla usar para Why Us?',
  '¿Qué proyectos open source citar?',
  '¿Cómo contactar a un Recruiter?'
];

export default function CopilotChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isCopied, setIsCopied] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const generateAnswer = (query: string): Message => {
    const q = query.toLowerCase();
    const id = Date.now().toString();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. iOS / Cross-platform
    if (q.includes('ios') || q.includes('swift') || q.includes('multiplataforma') || q.includes('cross')) {
      const guide = guides.formAnswers.find(a => a.id === 'ios-cross-platform');
      return {
        id,
        sender: 'assistant',
        text: 'Jesús no se posiciona como programador Swift exclusivo, sino como **Especialista en Kotlin Multiplatform (KMP)**. Explica que comparte toda la lógica de negocio, arquitectura, datos y networking entre Android e iOS, colaborando directamente con ingenieros de iOS mediante SKIE y Swift.',
        copySnippet: guide?.answer,
        links: [{ label: 'Ver Sección en Guías: Experiencia en iOS', url: '/guias#ios-cross-platform' }],
        timestamp
      };
    }

    // 2. Empleo Actual / Wells Fargo / Fechas / HansellApp
    if (q.includes('actual') || q.includes('wells') || q.includes('empleo') || q.includes('trabajo') || q.includes('fechas') || q.includes('hansell')) {
      return {
        id,
        sender: 'assistant',
        text: '⚠️ **Regla Mandatoria:** NUNCA mencionar HansellApp. El rol oficial y activo de Jesús es **Senior UI Engineer (Client Platform) en Wells Fargo**, con fecha continua desde **Enero 2025 (2025-01) hasta el Presente** (ubicación híbrida en San Leandro, CA).',
        copySnippet: 'Wells Fargo — Senior UI Engineer (Client Platform) | 2025-01 to Present | San Leandro, CA',
        links: [{ label: 'Ver Perfil: Wells Fargo', url: '/perfil#wells-fargo' }],
        timestamp
      };
    }

    // 3. Visa TN / Autorización Laboral / Sponsorship
    if (q.includes('visa') || q.includes('tn') || q.includes('patrocinio') || q.includes('sponsor') || q.includes('autorizaci') || q.includes('legal')) {
      const guide = guides.formAnswers.find(a => a.id === 'work-authorization-tn');
      return {
        id,
        sender: 'assistant',
        text: 'En preguntas de autorización laboral en EE.UU.:\n• "¿Authorized to work lawfully?": **YES**\n• "¿Will you require sponsorship?": **YES (TN Visa)**.\n\nNota operativa: La Visa TN (bajo el tratado T-MEC/USMCA para profesionistas mexicanos) es un trámite expedito de solo 2 a 3 semanas sin lotería ni cupos anuales.',
        copySnippet: guide?.answer,
        links: [{ label: 'Ver Sección en Guías: Visa TN', url: '/guias#work-authorization-tn' }],
        timestamp
      };
    }

    // 4. Why Us / Motivación / Interés en el rol
    if (q.includes('why') || q.includes('motiva') || q.includes('interes') || q.includes('entusiasma') || q.includes('porque')) {
      const guide = guides.formAnswers.find(a => a.id === 'why-us');
      return {
        id,
        sender: 'assistant',
        text: 'Para la pregunta "¿Por qué quieres trabajar aquí?", usa la plantilla oficial para Staff Mobile Engineer, enfatizando sus 10 años en Android SDK, Kotlin Multiplatform y aceleración de desarrolladores.',
        copySnippet: guide?.answer,
        links: [{ label: 'Ver Sección en Guías: Why Us', url: '/guias#why-us' }],
        timestamp
      };
    }

    // 5. Proyectos Open Source / Portafolio / Código
    if (q.includes('proyecto') || q.includes('open source') || q.includes('codigo') || q.includes('repo') || q.includes('github') || q.includes('json')) {
      return {
        id,
        sender: 'assistant',
        text: 'Los proyectos técnicos reales y verificados de Jesús para citar son:\n1. **json-to-compose:** Motor de Server-Driven UI en Compose Multiplatform.\n2. **Zora Community:** App automotriz de referencia en Kotlin Toolchain + SQLDelight.\n3. **KMP CLI:** Suite de diagnóstico y arquitectura multiplataforma.\n4. **Academia Desde0:** Plataforma educativa con más de 2,000 alumnos.',
        copySnippet: 'json-to-compose: https://github.com/jesusdmedinac/json-to-compose\nZora Community: https://github.com/jesusdmedinac/zora-community',
        links: [{ label: 'Ver Perfil: Proyectos de Código Abierto', url: '/perfil#proyectos' }],
        timestamp
      };
    }

    // 6. Outreach / Recruiter / Hiring Manager / LinkedIn
    if (q.includes('recruiter') || q.includes('manager') || q.includes('outreach') || q.includes('mensaje') || q.includes('contact') || q.includes('linkedin')) {
      const template = guides.outreachTemplates[0];
      return {
        id,
        sender: 'assistant',
        text: 'Para enviar mensaje en LinkedIn tras postular, mantén el mensaje en menos de 5 líneas, mencionando 10 años en Android/KMP, Wells Fargo, residencia en San Leandro, CA y enlace directo a su web.',
        copySnippet: template?.text,
        links: [{ label: 'Ver Sección en Guías: Plantillas de Outreach', url: '/guias#outreach' }],
        timestamp
      };
    }

    // 7. Misión / Impacto / Valores
    if (q.includes('mision') || q.includes('misión') || q.includes('proposito') || q.includes('propósito') || q.includes('impacto')) {
      const guide = guides.formAnswers.find(a => a.id === 'mission-empowerment');
      return {
        id,
        sender: 'assistant',
        text: 'Para preguntas sobre impacto o misión, Jesús conecta la filosofía mobile-first con su experiencia real fundando Academia Desde0 para democratizar la tecnología.',
        copySnippet: guide?.answer,
        links: [{ label: 'Ver Sección en Guías: Misión e Impacto', url: '/guias#mission-empowerment' }],
        timestamp
      };
    }

    // 8. Liderazgo / Mentoría
    if (q.includes('lider') || q.includes('mentor') || q.includes('equipo') || q.includes('tdd') || q.includes('calidad')) {
      const guide = guides.formAnswers.find(a => a.id === 'leadership-mentorship');
      return {
        id,
        sender: 'assistant',
        text: 'Para liderazgo técnico, enfócate en la multiplicación del impacto de los demás: mentoría a más de 20 ingenieros, reducción de bugs con TDD y buenas prácticas de IA.',
        copySnippet: guide?.answer,
        links: [{ label: 'Ver Sección en Guías: Liderazgo y Mentoría', url: '/guias#leadership-mentorship' }],
        timestamp
      };
    }

    // Respuesta por defecto con enlaces sugeridos
    return {
      id,
      sender: 'assistant',
      text: `Entendido. Para "${query}", te recomiendo revisar la sección de perfil oficial o las guías de redacción. Si necesitas datos exactos, puedes tocar una de las sugerencias rápidas abajo.`,
      links: [
        { label: 'Consultar Perfil y Trayectoria', url: '/perfil' },
        { label: 'Consultar Guías y Respuestas', url: '/guias' }
      ],
      timestamp
    };
  };

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');

    setTimeout(() => {
      const reply = generateAnswer(query);
      setMessages(prev => [...prev, reply]);
    }, 150);
  };

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

            <button
              onClick={() => setIsOpen(false)}
              type="button"
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors text-sm cursor-pointer"
              aria-label="Cerrar panel"
            >
              ✕
            </button>
          </div>

          {/* Sugerencias Rápidas Táctiles (Horizontales) */}
          <div className="px-3 py-2 bg-zinc-900/50 border-b border-zinc-800/60 overflow-x-auto flex gap-1.5 shrink-0">
            {SUGGESTED_QUERIES.map((sq) => (
              <button
                key={sq}
                onClick={() => handleSend(sq)}
                type="button"
                className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/60 whitespace-nowrap transition-colors shrink-0 cursor-pointer"
              >
                {sq}
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
              placeholder="Pregunta a Copilot (ej: ¿qué responder en iOS?)..."
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
