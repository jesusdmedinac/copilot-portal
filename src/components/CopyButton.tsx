import React, { useState } from 'react';

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
}

export default function CopyButton({ text, label = 'Copiar', className = '' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      type="button"
      className={`inline-flex items-center justify-center gap-2 px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-mono transition-all duration-150 active:scale-95 min-h-[40px] cursor-pointer ${
        copied
          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 font-medium'
      } ${className}`}
    >
      {copied ? (
        <>
          <span>✓</span>
          <span>Copiado</span>
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
