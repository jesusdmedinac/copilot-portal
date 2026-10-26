import React, { useState, useEffect } from 'react';

export const STORAGE_KEY = 'ops_portal_pin_unlocked';

interface PinGateProps {
  pin?: string;
}

export default function PinGate({ pin }: PinGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [error, setError] = useState(false);

  // Leer PIN desde prop o variable de entorno (.env) con fallback a '2026'
  const envPin = typeof import.meta !== 'undefined' 
    ? (import.meta.env?.PUBLIC_PORTAL_PIN || import.meta.env?.PORTAL_PIN)
    : undefined;
  const targetPin = (pin || envPin || '2026').toString().trim();
  const targetLength = targetPin.length || 4;

  useEffect(() => {
    const checkAuth = () => {
      const isUnlocked = localStorage.getItem(STORAGE_KEY) === 'true';
      setIsAuthenticated(isUnlocked);
    };

    checkAuth();
    window.addEventListener('storage', checkAuth);
    window.addEventListener('lock-portal', () => setIsAuthenticated(false));

    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('lock-portal', () => setIsAuthenticated(false));
    };
  }, []);

  const handleDigit = (digit: string) => {
    if (enteredPin.length < targetLength) {
      const next = enteredPin + digit;
      setEnteredPin(next);
      setError(false);

      if (next.length === targetLength) {
        if (next === targetPin) {
          localStorage.setItem(STORAGE_KEY, 'true');
          setIsAuthenticated(true);
          window.dispatchEvent(new Event('auth-changed'));
        } else {
          setError(true);
          setTimeout(() => {
            setEnteredPin('');
            setError(false);
          }, 800);
        }
      }
    }
  };

  const handleDelete = () => {
    setEnteredPin(prev => prev.slice(0, -1));
    setError(false);
  };

  if (isAuthenticated === null || isAuthenticated === true) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] bg-zinc-950/98 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="w-full max-w-sm p-6 sm:p-8 rounded-2xl border border-zinc-800 bg-zinc-900/90 shadow-2xl flex flex-col items-center text-center">
        
        <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 text-xl font-mono">
          🔒
        </div>

        <h2 className="text-lg font-bold text-zinc-100 tracking-tight">
          Portal Privado de Operaciones
        </h2>
        <p className="text-xs text-zinc-400 mt-1 mb-6 leading-relaxed">
          Ingresa el PIN de seguridad de {targetLength} dígitos configurado para acceder al portal de Karla.
        </p>

        {/* Indicadores de PIN dinámicos según targetLength */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {Array.from({ length: targetLength }).map((_, idx) => {
            const filled = enteredPin.length > idx;
            return (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full border transition-all duration-150 ${
                  error
                    ? 'bg-rose-500 border-rose-400 animate-pulse'
                    : filled
                    ? 'bg-indigo-500 border-indigo-400 scale-110'
                    : 'bg-zinc-800 border-zinc-700'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <p className="text-xs font-mono text-rose-400 mb-4 animate-bounce">
            PIN incorrecto. Intenta de nuevo.
          </p>
        )}

        {/* Teclado numérico táctil (Tablet-Friendly) */}
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-[260px] mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleDigit(num)}
              type="button"
              className="h-12 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 active:scale-95 text-zinc-100 font-mono font-bold text-base border border-zinc-700/60 transition-all flex items-center justify-center cursor-pointer"
            >
              {num}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleDigit('0')}
            type="button"
            className="h-12 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 active:scale-95 text-zinc-100 font-mono font-bold text-base border border-zinc-700/60 transition-all flex items-center justify-center cursor-pointer"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            type="button"
            className="h-12 rounded-xl bg-zinc-800/50 hover:bg-zinc-700/50 active:scale-95 text-zinc-400 hover:text-zinc-200 font-mono text-xs border border-zinc-700/40 transition-all flex items-center justify-center cursor-pointer"
            aria-label="Borrar dígito"
          >
            ⌫
          </button>
        </div>

        <div className="text-[10px] font-mono text-zinc-500">
          Coordinación Confidencial • JobSearch
        </div>
      </div>
    </div>
  );
}
