// Server-side PIN check shared by the Pages Functions.
// The PIN lives only in the PORTAL_PIN secret; it is never sent to the browser.

export type PinCheck = 'ok' | 'invalid' | 'unconfigured';

function safeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

export function checkPin(expected: string | undefined | null, provided: string | undefined | null): PinCheck {
  const target = (expected || '').trim();
  if (!target) return 'unconfigured';
  const given = (provided || '').trim();
  if (!given) return 'invalid';
  return safeEqual(target, given) ? 'ok' : 'invalid';
}

export function pinFailure(check: PinCheck): { status: number; error: string } | null {
  if (check === 'ok') return null;
  if (check === 'unconfigured') {
    return { status: 503, error: 'El portal no tiene PIN configurado en el servidor (PORTAL_PIN).' };
  }
  return { status: 401, error: 'PIN de acceso no válido.' };
}
