import React, { useState, useEffect } from 'react';
import { APP_VERSION } from '../data/canon';

export const STORAGE_KEY = 'ops_portal_pin_unlocked';
// El PIN que el servidor aceptó; viaja en cada llamada a /api/generate
export const PIN_KEY = 'ops_portal_pin';

const MIN_PIN_LENGTH = 4;
const MAX_PIN_LENGTH = 8;

export function lockPortal() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(PIN_KEY);
  window.dispatchEvent(new Event('lock-portal'));
}

export default function PinGate() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      // Sesiones anteriores sin PIN guardado deben volver a ingresarlo
      const isUnlocked = localStorage.getItem(STORAGE_KEY) === 'true' && !!localStorage.getItem(PIN_KEY);
      setIsAuthenticated(isUnlocked);
    };
    const onLock = () => {
      setEnteredPin('');
      setIsAuthenticated(false);
    };

    checkAuth();
    window.addEventListener('storage', checkAuth);
    window.addEventListener('lock-portal', onLock);

    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('lock-portal', onLock);
    };
  }, []);

  const handleDigit = (digit: string) => {
    if (isChecking) return;
    setEnteredPin(prev => (prev.length >= MAX_PIN_LENGTH ? prev : prev + digit));
    setError(null);
  };

  const handleDelete = () => {
    if (isChecking) return;
    setEnteredPin(prev => prev.slice(0, -1));
    setError(null);
  };

  // El servidor es el único que conoce el PIN
  const handleSubmit = async () => {
    if (isChecking || enteredPin.length < MIN_PIN_LENGTH) return;
    setIsChecking(true);
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-portal-pin': enteredPin },
        body: '{}'
      });
      if (response.ok) {
        localStorage.setItem(PIN_KEY, enteredPin);
        localStorage.setItem(STORAGE_KEY, 'true');
        setEnteredPin('');
        setIsAuthenticated(true);
        window.dispatchEvent(new Event('auth-changed'));
      } else if (response.status === 401) {
        setError('PIN incorrecto. Intenta de nuevo.');
        setEnteredPin('');
      } else {
        setError('El servidor no pudo validar el PIN. Avísale a Jesús.');
      }
    } catch (_) {
      setError('Sin conexión con el servidor. Intenta de nuevo.');
    } finally {
      setIsChecking(false);
    }
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
          Ingresa el PIN de seguridad y toca Entrar para acceder al portal de Karla.
        </p>

        {/* Indicadores de PIN dinámicos según targetLength */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {Array.from({ length: Math.max(MIN_PIN_LENGTH, enteredPin.length) }).map((_, idx) => {
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
            {error}
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
          <button
            onClick={handleSubmit}
            type="button"
            disabled={isChecking || enteredPin.length < MIN_PIN_LENGTH}
            className="h-12 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white font-mono font-bold text-xs border border-indigo-500/60 transition-all flex items-center justify-center cursor-pointer"
            aria-label="Entrar"
          >
            {isChecking ? '…' : 'Entrar'}
          </button>
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
          Coordinación Confidencial • JobSearch • v{APP_VERSION}
        </div>
      </div>
    </div>
  );
}
