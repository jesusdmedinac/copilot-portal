export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function onRequestGet() {
  return new Response(JSON.stringify({
    status: 'ok',
    service: 'copilot-portal-api',
    endpoints: [
      { method: 'GET', path: '/api/health', description: 'Health check y estado del servicio' },
      { method: 'POST', path: '/api/generate', description: 'Generación de paquetes de postulación con System Prompt canónico' }
    ],
    timestamp: new Date().toISOString()
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
