import { checkPin, pinFailure } from '../../src/data/pinAuth';

interface Env {
  PORTAL_PIN?: string;
}

const headers = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store'
};

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  let pin: string | null = request.headers.get('x-portal-pin');
  if (!pin) {
    try {
      const body: { pin?: string } = await request.json();
      pin = body.pin || null;
    } catch (_) {
      pin = null;
    }
  }
  const failure = pinFailure(checkPin(env.PORTAL_PIN, pin));
  if (failure) {
    return new Response(JSON.stringify({ success: false, error: failure.error }), { status: failure.status, headers });
  }
  return new Response(JSON.stringify({ success: true }), { status: 200, headers });
};
