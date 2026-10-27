import React, { useState, useMemo } from 'react';
import guides from '../../data/guides.json';
import CopyButton from '../CopyButton';

export default function GuidesView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'form' | 'rules' | 'outreach'>('all');

  const filteredAnswers = useMemo(() => {
    let list = guides.formAnswers;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a => 
        a.title.toLowerCase().includes(q) ||
        a.promptEn.toLowerCase().includes(q) ||
        a.promptEs.toLowerCase().includes(q) ||
        a.answer.toLowerCase().includes(q) ||
        a.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [searchQuery]);

  const filteredRules = useMemo(() => {
    let list = guides.writingRules;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(r => 
        r.rule.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.badge.toLowerCase().includes(q)
      );
    }
    return list;
  }, [searchQuery]);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-8 max-w-5xl mx-auto w-full font-sans">
      
      {/* Header de la sección */}
      <section className="p-5 sm:p-7 rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900/90 to-zinc-950 shadow-xl space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <span>Base de Redacción y Respuestas Oficiales</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
          Guías de Postulación y Respuestas Oficiales
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
          Respuestas autorizadas con botón de copiado rápido para completar formularios en Greenhouse, Lever, Ashby, Workday y notas de conexión en LinkedIn.
        </p>

        {/* Barra de Filtros Rápidos */}
        <div className="pt-2 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory('all')}
            type="button"
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            Ver Todo
          </button>
          <button
            onClick={() => setActiveCategory('form')}
            type="button"
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
              activeCategory === 'form'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            📝 Preguntas de Formularios ({guides.formAnswers.length})
          </button>
          <button
            onClick={() => setActiveCategory('rules')}
            type="button"
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
              activeCategory === 'rules'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            ⚖️ Reglas de Redacción ({guides.writingRules.length})
          </button>
          <button
            onClick={() => setActiveCategory('outreach')}
            type="button"
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
              activeCategory === 'outreach'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            ✉️ Outreach & Plantillas
          </button>
        </div>
      </section>

      {/* Buscador Rápido de Preguntas */}
      <div className="flex items-center gap-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl px-4 py-3">
        <span className="text-base">🔍</span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar pregunta (Visa TN, KMP, Por qué la empresa, Salario, Relocación, Liderazgo)..."
          className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            type="button"
            className="text-xs font-mono text-zinc-400 hover:text-zinc-200 px-2 py-1 rounded hover:bg-zinc-800 cursor-pointer"
          >
            ✕ Limpiar
          </button>
        )}
      </div>

      {/* Sección: Respuestas Oficiales para Formularios */}
      {(activeCategory === 'all' || activeCategory === 'form') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <div>
              <h2 className="text-lg font-bold text-zinc-100 tracking-tight">Respuestas Oficiales para Formularios</h2>
              <p className="text-xs text-zinc-400">Listas para copiar y pegar en formularios de empleo</p>
            </div>
            <span className="text-xs font-mono text-zinc-500">{filteredAnswers.length} preguntas</span>
          </div>

          <div className="space-y-4">
            {filteredAnswers.map((item, idx) => (
              <div 
                key={idx}
                className="p-5 sm:p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-4 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-base text-zinc-100">{item.title}</h3>
                    <p className="text-xs font-mono text-indigo-400 mt-0.5">{item.promptEn}</p>
                    <p className="text-[11px] text-zinc-400 italic mt-0.5">({item.promptEs})</p>
                  </div>
                  <CopyButton text={item.answer} label="Copiar Respuesta" className="shrink-0" />
                </div>

                {/* Caja con la respuesta oficial */}
                <div className="p-4 rounded-xl bg-zinc-950/90 border border-zinc-800 text-xs sm:text-sm text-zinc-200 leading-relaxed font-sans select-all">
                  "{item.answer}"
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 text-xs border-t border-zinc-800/60">
                  <div className="text-[11px] text-amber-300/90 flex items-center gap-1.5">
                    <span className="font-bold font-mono">💡 Tip para Karla:</span>
                    <span>{item.guidance}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 self-end sm:self-auto">
                    {item.tags.map((t, tIdx) => (
                      <span key={tIdx} className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Sección: Reglas Maestras de Redacción */}
      {(activeCategory === 'all' || activeCategory === 'rules') && (
        <section className="space-y-4 pt-4 border-t border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-zinc-100 tracking-tight">Reglas Maestras de Redacción (Writing Style)</h2>
            <p className="text-xs text-zinc-400">Directrices para mantener el tono profesional, sobrio y sin frases de relleno</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRules.map((rule, idx) => (
              <div key={idx} className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/30 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-zinc-100">{rule.rule}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {rule.badge}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {rule.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Sección: Outreach & Plantillas Rápidas */}
      {(activeCategory === 'all' || activeCategory === 'outreach') && (
        <section className="space-y-4 pt-4 border-t border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-zinc-100 tracking-tight">Plantillas de Outreach y Contacto Rápido</h2>
            <p className="text-xs text-zinc-400">Plantillas probadas para enviar por correo o mensaje directo en LinkedIn</p>
          </div>

          <div className="space-y-4">
            {guides.outreachTemplates.map((tmpl, idx) => (
              <div key={idx} className="p-5 sm:p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800/80">
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-zinc-100">{tmpl.type}</h3>
                    <p className="text-xs font-mono text-zinc-400">Asunto: {tmpl.subject}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CopyButton text={tmpl.subject} label="Copiar Asunto" />
                    <CopyButton text={tmpl.body} label="Copiar Cuerpo" />
                  </div>
                </div>
                <pre className="text-xs sm:text-sm text-zinc-200 whitespace-pre-wrap font-sans leading-relaxed bg-zinc-950 p-4 rounded-xl border border-zinc-800 select-all">
                  {tmpl.body}
                </pre>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
