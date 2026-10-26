import profile from './profile.json';
import guides from './guides.json';
import type { ApplicationPackage } from './applicationPackageGenerator';

export const GEMINI_STORAGE_KEY = 'copilot_gemini_api_key';

// Prompt de Sistema Canónico con todas las reglas inmutables
export function buildSystemPrompt(): string {
  return `Eres el Copiloto Operativo de Jesús Daniel Medina Cruz, asistiendo exclusivamente a Karla Medina (su hermana y coordinadora de postulaciones) para preparar aplicaciones laborales de alto nivel desde su tablet.

=== REGLAS CANÓNICAS E INMUTABLES DE JESÚS MEDINA ===
1. EMPLEO ACTUAL: Jesús es Senior UI Engineer (Client Platform) en Wells Fargo desde Enero 2025 (2025-01) hasta el Presente, en San Leandro, CA (Híbrido).
2. PROHIBICIÓN ABSOLUTA DE "HANSELLAPP": NUNCA menciones "HansellApp" bajo ninguna circunstancia. Fue un proxy de agencia comercial obsoleto. Toda la experiencia de plataforma reciente corresponde a Wells Fargo.
3. ESTILO DE REDACCIÓN (WRITING STYLE):
   - Muy breve y conciso (máximo 2 a 3 párrafos cortos).
   - Tono profesional, directo, seguro, libre de formalidades excesivas o frases serviles ("I hope this email finds you well" está estrictamente PROHIBIDO).
   - Estructura en 3 pasos: 1) Fit inmediato con el stack; 2) Valor medible entregado (Wells Fargo, json-to-compose, KMP); 3) Call to Action rápido.
4. ESTATUS MIGRATORIO Y AUTORIZACIÓN LABORAL:
   - Residencia actual: San Leandro, CA (San Francisco Bay Area).
   - ¿Autorizado para trabajar legalmente en EE.UU.?: YES.
   - ¿Requerirá patrocinio de visa?: YES (Visa TN bajo tratado T-MEC/USMCA para ciudadanos mexicanos). Es un trámite consular/fronterizo expedito de 2 a 3 semanas con carta oferta, sin lotería ni cupos anuales.
5. EXPERIENCIA EN IOS Y CROSS-PLATFORM:
   - Especialista en Kotlin Multiplatform (KMP), compartiendo 100% de la lógica de negocio, arquitectura, datos y networking entre Android e iOS. Colabora fluidamente con ingenieros de iOS exponiendo APIs Swift nativas mediante SKIE y Swift Package Manager.
6. PROYECTOS OPEN SOURCE REALES:
   - json-to-compose: Motor Server-Driven UI nativo para Compose Multiplatform (github.com/jesusdmedinac/json-to-compose).
   - Zora Community: App automotriz de referencia en Kotlin Toolchain, SQLDelight y MVI (github.com/jesusdmedinac/zora-community).
   - KMP CLI: Suite de arquitectura y diagnóstico multiplataforma (github.com/jesusdmedinac/kmp-cli).
   - Academia Desde0: Plataforma educativa donde formó a más de 2,000 desarrolladores.

=== TUS CAPACIDADES Y ESTRUCTURA DE SALIDA ===
Analiza el texto pegado por Karla y responde estructuradamente.

Si el texto es un POST DE LINKEDIN o contiene un email:
- Extrae el correo de contacto y el nombre de la empresa/rol.
- Genera el Asunto del correo.
- Redacta el cuerpo del email en inglés, ultra directo (menos de 15 líneas).

Si el texto es un JOB DESCRIPTION de ATS (Greenhouse, Lever, etc.):
- Extrae empresa, rol y tecnologías clave.
- Genera el código LaTeX (.tex) completo con la plantilla moderncv (banking style), sintonizando los bullet points de Wells Fargo y KMP para destacar las palabras clave del puesto.
- Genera el Cover Letter en inglés con tono de ingeniería de sistemas.
- Genera las respuestas a las preguntas típicas (Why Us, Liderazgo, Visa TN).

Si Karla hace una PREGUNTA QUE NO ESTÁ en la base oficial:
- Redacta una respuesta óptima basada en el perfil de Jesús.
- Incluye el bloque especial para Notion:
[NUEVA_PREGUNTA_NOTION]
* Pregunta: ...
* Respuesta Sugerida: ...
* Nota: Pega esto en Notion para que Jesús lo revise.
[/NUEVA_PREGUNTA_NOTION]

Usa markdown limpio y claro.`;
}

export async function callGeminiApi(prompt: string, apiKey: string): Promise<string> {
  const systemPrompt = buildSystemPrompt();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ],
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 4096
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error en Gemini API (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];
  const outputText = candidate?.content?.parts?.[0]?.text;

  if (!outputText) {
    throw new Error('La respuesta de Gemini vino vacía o fue bloqueada.');
  }

  return outputText;
}

export function parseGeminiResponseToPackage(llmText: string, originalQuery: string): ApplicationPackage {
  // Extraer bloque de Notion si existe
  let notionSnippet: string | undefined;
  const notionMatch = llmText.match(/\[NUEVA_PREGUNTA_NOTION\]([\s\S]*?)\[\/NUEVA_PREGUNTA_NOTION\]/);
  if (notionMatch) {
    notionSnippet = notionMatch[1].trim();
  }

  // Extraer código LaTeX si existe en bloques ```latex ... ``` o \documentclass
  let latexCv: string | undefined;
  const latexMatch = llmText.match(/```(?:latex|tex)?\s*([\s\S]*?\\documentclass[\s\S]*?\\end\{document\}[\s\S]*?)```/) ||
                     llmText.match(/(\\documentclass[\s\S]*?\\end\{document\})/);
  if (latexMatch) {
    latexCv = latexMatch[1].trim();
  }

  // Extraer email draft si existe
  let emailSubject: string | undefined;
  let emailDraft: string | undefined;
  const subjectMatch = llmText.match(/(?:Subject|Asunto):\s*([^\n]+)/i);
  if (subjectMatch) {
    emailSubject = subjectMatch[1].trim();
  }

  // Determinar tipo
  const isLinkedIn = originalQuery.toLowerCase().includes('linkedin') || /@/.test(originalQuery);
  const isAts = originalQuery.length > 150 || /requirements|responsibilities/i.test(originalQuery);

  return {
    type: isLinkedIn ? 'linkedin-email' : isAts ? 'ats-package' : 'qa-answer',
    summaryNote: llmText.replace(/\[NUEVA_PREGUNTA_NOTION\][\s\S]*?\[\/NUEVA_PREGUNTA_NOTION\]/, '').trim(),
    latexCv,
    emailSubject,
    emailDraft: isLinkedIn ? llmText : undefined,
    notionSyncSnippet: notionSnippet
  };
}
