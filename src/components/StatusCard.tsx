import React, { useState } from 'react';

export default function StatusCard() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-zinc-400">Estado del Asistente React</span>
        <button 
          onClick={handleCopy}
          className="text-xs px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono transition-colors"
        >
          {copied ? '✓ Verificado' : 'Probar React Island'}
        </button>
      </div>
      <p className="mt-2 text-xs text-zinc-400">
        Isla interactiva montada en Astro 6 con React 19 y Tailwind CSS. Lista para conectar el Copilot Chat.
      </p>
    </div>
  );
}
