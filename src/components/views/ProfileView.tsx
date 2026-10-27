import React, { useState, useMemo } from 'react';
import profile from '../../data/profile.json';
import CopyButton from '../CopyButton';

const elevatorPitch = "Senior Mobile Engineer with 10 years of experience architecting high-scale client platforms at Wells Fargo and cross-platform systems in Kotlin Multiplatform (KMP). Creator of json-to-compose and Zora Community, based in San Leandro, CA.";

export default function ProfileView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const filteredWork = useMemo(() => {
    let list = profile.work;
    if (selectedTag) {
      list = list.filter(j => 
        j.skills?.some(s => s.toLowerCase().includes(selectedTag.toLowerCase())) ||
        j.highlights?.some(h => h.toLowerCase().includes(selectedTag.toLowerCase())) ||
        j.name.toLowerCase().includes(selectedTag.toLowerCase())
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(j => 
        j.name.toLowerCase().includes(q) ||
        j.position.toLowerCase().includes(q) ||
        j.summary.toLowerCase().includes(q) ||
        j.highlights?.some(h => h.toLowerCase().includes(q)) ||
        j.skills?.some(s => s.toLowerCase().includes(q))
      );
    }
    return list;
  }, [searchQuery, selectedTag]);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-8 max-w-5xl mx-auto w-full font-sans">
      
      {/* Header del Perfil */}
      <section className="p-5 sm:p-7 rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900/90 to-zinc-950 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
                {profile.basics.name}
              </h1>
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                10 Años Exp.
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Visa TN (USMCA)
              </span>
            </div>

            <p className="text-sm sm:text-base font-medium text-indigo-400 font-mono">
              {profile.basics.label}
            </p>

            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-2xl">
              {profile.basics.summary}
            </p>
          </div>

          {/* Botones de Copiado Rápido para Karla */}
          <div className="flex flex-wrap lg:flex-col gap-2 shrink-0">
            <CopyButton 
              text={elevatorPitch} 
              label="Copiar Pitch de 2 líneas" 
              className="w-full sm:w-auto"
            />
            <CopyButton 
              text="https://linkedin.com/in/jesusdmedinac" 
              label="Copiar LinkedIn" 
              className="w-full sm:w-auto"
            />
            <CopyButton 
              text="jesus.daniel.medina.cruz@gmail.com" 
              label="Copiar Email" 
              className="w-full sm:w-auto"
            />
            <CopyButton 
              text="+1 (470) 406-1747" 
              label="Copiar Teléfono" 
              className="w-full sm:w-auto"
            />
          </div>
        </div>

        {/* Badges clave para filtrado rápido */}
        <div className="pt-4 border-t border-zinc-800/80 flex flex-wrap gap-2">
          {profile.keyBadges.map((badge, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedTag(selectedTag === badge ? null : badge)}
              type="button"
              className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                selectedTag === badge
                  ? 'bg-indigo-600 text-white border border-indigo-500'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              {badge}
            </button>
          ))}
        </div>
      </section>

      {/* Buscador de Trayectoria */}
      <div className="flex items-center gap-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl px-4 py-3">
        <span className="text-base">🔍</span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filtrar por empresa, rol, logros o tecnología (Compose, KMP, TDD, Wells Fargo)..."
          className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
        />
        {(searchQuery || selectedTag) && (
          <button
            onClick={() => { setSearchQuery(''); setSelectedTag(null); }}
            type="button"
            className="text-xs font-mono text-zinc-400 hover:text-zinc-200 px-2 py-1 rounded hover:bg-zinc-800 cursor-pointer"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Trayectoria Profesional */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-zinc-100 tracking-tight">Trayectoria Profesional Verificada</h2>
            <p className="text-xs text-zinc-400">Datos grounded: Wells Fargo como empleo activo (2025-01 a Presente)</p>
          </div>
          <span className="text-xs font-mono text-zinc-500">{filteredWork.length} empresas</span>
        </div>

        <div className="space-y-4">
          {filteredWork.map((job, idx) => {
            const isCurrent = job.endDate === null;
            return (
              <div 
                key={idx}
                className={`p-5 sm:p-6 rounded-2xl border transition-all ${
                  isCurrent 
                    ? 'border-indigo-500/40 bg-zinc-900/50 shadow-sm shadow-indigo-500/5' 
                    : 'border-zinc-800/80 bg-zinc-900/30'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-bold text-base sm:text-lg text-zinc-100">{job.name}</span>
                    <span className="text-xs text-indigo-400 font-mono font-medium">({job.position})</span>
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        EMPLEO ACTUAL
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-mono text-zinc-400">
                    {job.startDate} — {isCurrent ? 'Presente' : job.endDate} • {job.location}
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-zinc-300 mb-3 leading-relaxed">
                  {job.summary}
                </p>

                {job.highlights && job.highlights.length > 0 && (
                  <ul className="space-y-1.5 mb-4 pl-4 list-disc text-xs sm:text-sm text-zinc-400 leading-relaxed">
                    {job.highlights.map((h, hIdx) => (
                      <li key={hIdx}>{h}</li>
                    ))}
                  </ul>
                )}

                <div className="pt-3 border-t border-zinc-800/60 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {job.skills?.map((sk, sIdx) => (
                      <span key={sIdx} className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-800 text-zinc-300">
                        {sk}
                      </span>
                    ))}
                  </div>
                  <CopyButton
                    text={`${job.position} @ ${job.name} (${job.startDate} - ${isCurrent ? 'Presente' : job.endDate}): ${job.summary}`}
                    label="Copiar Rol"
                    className="text-xs"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Proyectos Open Source y Ecosistema */}
      <section className="space-y-4 pt-4 border-t border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-100 tracking-tight">Proyectos Open Source Clave</h2>
          <p className="text-xs text-zinc-400">Ecosistema público y autoría técnica de Jesús</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-base text-zinc-100">json-to-compose</span>
              <span className="text-xs font-mono text-indigo-400">KMP Engine</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Motor dinámico de Server-Driven UI (SDUI) para Compose Multiplatform. Permite renderizar layouts declarativos nativos en Android, iOS, Desktop y Web a partir de especificaciones JSON.
            </p>
            <div className="pt-2 flex items-center justify-between">
              <a 
                href="https://github.com/jesusdmedinac/json-to-compose" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs font-mono text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>GitHub Repo</span>
                <span>↗</span>
              </a>
              <CopyButton text="https://github.com/jesusdmedinac/json-to-compose" label="Copiar Link" />
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-base text-zinc-100">Academia Desde0</span>
              <span className="text-xs font-mono text-emerald-400">EdTech</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Plataforma de mentoría y educación técnica móvil fundada por Jesús para capacitar a más de 20 ingenieros en Kotlin Multiplatform, testing automatizado (TDD) y arquitectura Clean.
            </p>
            <div className="pt-2 flex items-center justify-between">
              <a 
                href="https://desde0.jesusdmedinac.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs font-mono text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>Plataforma</span>
                <span>↗</span>
              </a>
              <CopyButton text="https://desde0.jesusdmedinac.com" label="Copiar Link" />
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
