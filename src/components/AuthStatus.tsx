import React, { useState, useEffect } from 'react';
import { STORAGE_KEY } from './PinGate';

export default function AuthStatus() {
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    const update = () => {
      setIsUnlocked(localStorage.getItem(STORAGE_KEY) === 'true');
    };

    update();
    window.addEventListener('storage', update);
    window.addEventListener('auth-changed', update);

    return () => {
      window.removeEventListener('storage', update);
      window.removeEventListener('auth-changed', update);
    };
  }, []);

  const handleLock = () => {
    localStorage.removeItem(STORAGE_KEY);
    setIsUnlocked(false);
    window.dispatchEvent(new Event('lock-portal'));
  };

  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="hidden xs:inline">Célula Activa</span>
      </span>

      {isUnlocked && (
        <button
          onClick={handleLock}
          type="button"
          title="Bloquear portal"
          aria-label="Bloquear portal con PIN"
          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border border-zinc-700/60 transition-colors text-xs font-mono flex items-center gap-1 cursor-pointer"
        >
          <span>🔒</span>
          <span className="hidden sm:inline text-[11px]">Bloquear</span>
        </button>
      )}
    </div>
  );
}
