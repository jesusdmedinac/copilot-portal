import { buildSystemPrompt, parseGeminiResponseToPackage } from '../../src/data/geminiClient';
import type { ChatMessageContext } from '../../src/data/geminiClient';
import { detectDomain, detectContactVariant, detectIntent, validatePackage, buildCorrectionPrompt } from '../../src/data/guardrails';
import { CANONICAL_CV_URLS } from '../../src/data/canon';
import { checkPin, pinFailure } from '../../src/data/pinAuth';

interface Env {
  GEMINI_API_KEY?: string;
  PORTAL_PIN?: string;
}

interface RequestBody {
  prompt?: string;
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

    // El PIN es obligatorio y se valida antes de cualquier otra cosa
    const pinError = pinFailure(checkPin(env.PORTAL_PIN, request.headers.get('x-portal-pin') || body.pin));
    if (pinError) {
      return new Response(JSON.stringify({
        success: false,
        error: pinError.error
      }), {
        status: pinError.status,
        headers: corsHeaders
      });
    }

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

    // Resolución de la API Key en el servidor (Cloudflare Pages Secret o .env local)
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

    const apiKey = env.GEMINI_API_KEY || fallbackKey;

    if (!apiKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Servicio de IA no disponible temporalmente. Por favor intenta más tarde.'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }

    // 1. Detectar intención y contexto de la vacante / pregunta
    const intent = detectIntent(prompt);
    const priorUserTexts = (body.history || [])
      .filter(item => item.role !== 'model')
      .map(item => item.text)
      .reverse();
    // Solo los mensajes cortos de refinamiento heredan el dominio de la vacante anterior
    const isRefinement = intent === 'refinement';
    const domain = detectDomain(isRefinement ? [prompt, ...priorUserTexts] : [prompt]);
    // La variante MX/US se decide con la vacante original, no con el refinamiento
    const postingText = isRefinement ? (priorUserTexts.find(t => t.length >= 200) || prompt) : prompt;
    const variant = detectContactVariant(postingText);
    const validationCtx = intent === 'question'
      ? { intent }
      : { canonicalCvUrls: CANONICAL_CV_URLS, expectedVariant: variant, intent };
    const systemPrompt = buildSystemPrompt(domain, variant, intent);
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

    const callGemini = async (turns: typeof contents) => {
      const geminiRes = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: turns,
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4096
          }
        })
      });

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        return { error: `Error al invocar Gemini API (${geminiRes.status}): ${errText}`, status: geminiRes.status };
      }

      const data: any = await geminiRes.json();
      const text: string | undefined = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        return { error: 'La respuesta del modelo vino vacía o fue bloqueada por filtros de seguridad.', status: 502 };
      }
      return { text };
    };

    const first = await callGemini(contents);
    if (!first.text) {
      return new Response(JSON.stringify({
        success: false,
        error: first.error
      }), {
        status: first.status,
        headers: corsHeaders
      });
    }

    // 3. Validar el kit y reintentar una vez con un mensaje correctivo
    let outputText = first.text;
    let pkg = parseGeminiResponseToPackage(outputText, prompt);
    let violations = validatePackage(pkg, domain, validationCtx);

    if (violations.length > 0) {
      const retry = await callGemini([
        ...contents,
        { role: 'model', parts: [{ text: outputText }] },
        { role: 'user', parts: [{ text: buildCorrectionPrompt(violations, domain, intent) }] }
      ]);
      if (retry.text) {
        const retryPkg = parseGeminiResponseToPackage(retry.text, prompt);
        const retryViolations = validatePackage(retryPkg, domain, validationCtx);
        if (retryViolations.length < violations.length) {
          outputText = retry.text;
          pkg = retryPkg;
          violations = retryViolations;
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        type: pkg.type,
        cvRecommendation: pkg.cvRecommendation || null,
        cvLink: pkg.cvLink || null,
        cvVariant: pkg.cvVariant || (intent === 'question' ? null : variant),
        atsAnswers: pkg.atsAnswers || null,
        emailSubject: pkg.emailSubject || null,
        emailDraft: pkg.emailDraft || null,
        linkedinNote: pkg.linkedinNote || null,
        coverLetter: pkg.coverLetter || null,
        evidenceSelection: pkg.evidenceSelection || null,
        detectedDomain: domain?.label || null,
        validationWarnings: violations,
        commentDraft: pkg.commentDraft || null,
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
