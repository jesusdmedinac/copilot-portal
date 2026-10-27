import { buildSystemPrompt, parseGeminiResponseToPackage } from '../../src/data/geminiClient';
import type { ChatMessageContext } from '../../src/data/geminiClient';

interface Env {
  GEMINI_API_KEY?: string;
  PORTAL_PIN?: string;
}

interface RequestBody {
  prompt?: string;
  apiKey?: string;
  pin?: string;
  history?: ChatMessageContext[];
}

export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key, x-portal-pin',
    },
  });
};

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key, x-portal-pin',
  };

  try {
    const body: RequestBody = await request.json();
    const prompt = body.prompt?.trim();

    if (!prompt) {
      return new Response(JSON.stringify({
        success: false,
        error: 'El campo "prompt" es obligatorio.'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Validación opcional de PIN si está configurado en el entorno
    const expectedPin = env.PORTAL_PIN;
    const providedPin = body.pin || request.headers.get('x-portal-pin');
    if (expectedPin && providedPin && providedPin !== expectedPin) {
      return new Response(JSON.stringify({
        success: false,
        error: 'PIN de acceso no válido.'
      }), {
        status: 401,
        headers: corsHeaders
      });
    }

    // Resolución de la API Key de Gemini: 1) enviada en el body/header, 2) env de Cloudflare/Vite, 3) fallback local a .env
    const headerApiKey = request.headers.get('x-api-key') || 
                         request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');

    let fallbackKey: string | undefined;
    if (typeof process !== 'undefined') {
      fallbackKey = process.env?.GEMINI_API_KEY;
      if (!fallbackKey) {
        try {
          const fs = await import('node:fs');
          const path = await import('node:path');
          const envPath = path.resolve(process.cwd(), '.env');
          if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8');
            const match = content.match(/GEMINI_API_KEY=(.*)/);
            if (match) fallbackKey = match[1].trim();
          }
        } catch (_) {}
      }
    }

    const apiKey = body.apiKey || headerApiKey || env.GEMINI_API_KEY || fallbackKey;

    if (!apiKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Falta la API Key de Gemini. Configura GEMINI_API_KEY en Cloudflare o envíala en el body/headers.'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // 1. Construir System Prompt Canónico
    const systemPrompt = buildSystemPrompt();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    // 2. Sanitizar historial
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
    let lastRole: 'user' | 'model' | null = null;

    if (body.history && Array.isArray(body.history)) {
      for (const item of body.history) {
        if (!item.text || !item.text.trim()) continue;
        const role = item.role === 'model' ? 'model' : 'user';

        if (contents.length === 0 && role !== 'user') continue;

        if (role === lastRole) {
          contents[contents.length - 1].parts[0].text += `\n\n${item.text}`;
        } else {
          contents.push({
            role,
            parts: [{ text: item.text }]
          });
          lastRole = role;
        }
      }
    }

    // Agregar el prompt actual como último turno del usuario
    if (lastRole === 'user') {
      contents[contents.length - 1].parts[0].text += `\n\n${prompt}`;
    } else {
      contents.push({
        role: 'user',
        parts: [{ text: prompt }]
      });
    }

    const payload = {
      contents,
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 4096
      }
    };

    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return new Response(JSON.stringify({
        success: false,
        error: `Error al invocar Gemini API (${geminiRes.status}): ${errText}`
      }), {
        status: geminiRes.status,
        headers: corsHeaders
      });
    }

    const data: any = await geminiRes.json();
    const outputText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!outputText) {
      return new Response(JSON.stringify({
        success: false,
        error: 'La respuesta del modelo vino vacía o fue bloqueada por filtros de seguridad.'
      }), {
        status: 502,
        headers: corsHeaders
      });
    }

    // 3. Parsear la respuesta con el motor oficial
    const pkg = parseGeminiResponseToPackage(outputText, prompt);

    return new Response(JSON.stringify({
      success: true,
      data: {
        type: pkg.type,
        cvRecommendation: pkg.cvRecommendation || null,
        cvLink: pkg.cvLink || null,
        emailSubject: pkg.emailSubject || null,
        emailDraft: pkg.emailDraft || null,
        linkedinNote: pkg.linkedinNote || null,
        coverLetter: pkg.coverLetter || null,
        commentDraft: pkg.commentDraft || null,
        latexCv: pkg.latexCv || null,
        summaryNote: pkg.summaryNote || null,
        notionSyncSnippet: pkg.notionSyncSnippet || null,
        rawLlmOutput: outputText
      }
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Error interno del servidor en endpoint /api/generate'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
};
