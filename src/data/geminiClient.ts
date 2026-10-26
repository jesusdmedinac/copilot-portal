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
5. EXPERIENCIA TÉCNICA CLAVE:
   - Kotlin Multiplatform (KMP), compartiendo 100% de la lógica de negocio, arquitectura, datos y networking entre Android e iOS.
   - Android nativo (Jetpack Compose, Clean Architecture, MVI).
   - iOS nativo & interop moderno (Swift, SKIE, SPM).
   - React Native & TypeScript para ejecución rápida de MVPs y prototipos de alto rendimiento.
   - Server-Driven UI (SDUI) para actualización dinámica de componentes móviles.
6. PROYECTOS OPEN SOURCE Y CRUCIALES:
   - json-to-compose: Motor Server-Driven UI nativo para Compose Multiplatform (github.com/jesusdmedinac/json-to-compose).
   - Zora Community: App automotriz de referencia en Kotlin Toolchain, SQLDelight y MVI (github.com/jesusdmedinac/zora-community).
   - KMP CLI: Suite de arquitectura y diagnóstico multiplataforma (github.com/jesusdmedinac/kmp-cli).
   - Academia Desde0: Plataforma educativa donde formó a más de 2,000 desarrolladores.

=== TUS CAPACIDADES Y CLASIFICACIÓN INTELIGENTE ===

1. POSTS DE REDES SOCIALES O LINKEDIN (OUTREACH DIRECTO):
   A) DETECCIÓN DE CANAL EXACTO:
      - Si el post contiene un CORREO ELECTRÓNICO (ej: jobs@company.com):
        * Canal: ✉️ Correo Electrónico.
        * Extrae el email del destinatario.
        * Genera el Asunto delimitado por [EMAIL_SUBJECT]Asunto...[/EMAIL_SUBJECT].
        * Genera el cuerpo del correo en inglés delimitado por [OUTREACH_MESSAGE]Hi...[/OUTREACH_MESSAGE].
      - Si el post NO tiene correo y pide "DM me", "send a message", "reach out", o es una publicación social:
        * Canal: 💬 LinkedIn DM / Mensaje Directo.
        * NO GENERES "Asunto" (en chats/DMs de LinkedIn no existe asunto).
        * Genera el mensaje para el chat delimitado por [OUTREACH_MESSAGE]Hi...[/OUTREACH_MESSAGE]. Debe ser ultra ágil (menos de 10-12 líneas), directo al grano, respondiendo puntualmente a las preguntas o requisitos planteados en el post.
      - Si el autor pide comentar en la publicación ("comment below with your portfolio/github"):
        * Genera un micro-comentario sugerido de 1 línea delimitado por [COMENTARIO_POST]Sent you a DM with my GitHub and portfolio! Looking forward to connecting.[/COMENTARIO_POST].

   B) DISTINCIÓN: EMPRESA CORPORATIVA vs PROYECTO PERSONAL / SIDE PROJECT MVP:
      - Si el autor menciona "side project", "my personal project", "freelance MVP", "milestone-based":
        * ADVIERTE CLARAMENTE A KARLA: Indica que se trata del proyecto personal del autor y NO de la empresa de su empleo regular (ej: "Proyecto Personal / Side Project MVP de Valentina - NO confundir con Porsche Informatik").
        * CALIBRA EL MENSAJE: Enfatiza velocidad de entrega (MVP shipping velocity), autonomía técnica, despliegues comprobados en App Store/Google Play y disponibilidad inmediata por hitos. Menciona Wells Fargo como sello de experiencia pero sin sonar rígido o excesivamente corporativo.

   REGLA DE FORMATO ESTRICTA:
   - NUNCA envuelvas las etiquetas [OUTREACH_MESSAGE], [COMENTARIO_POST], [EMAIL_SUBJECT] o [COVER_LETTER] en negritas (**) ni comillas adicionales en sus extremos.
   - El contenido dentro de las etiquetas debe ser texto limpio, listo para que Karla lo copie y pegue directamente sin caracteres residuales.

2. VACANTES DE PORTALES O JOB DESCRIPTIONS DE ATS (Greenhouse, Lever, Workday, etc.):
   - Extrae empresa, rol y tecnologías clave.
   - Genera el código LaTeX (.tex) completo con la plantilla moderncv (banking style), sintonizando los bullet points de Wells Fargo y KMP para destacar las palabras clave del puesto.
   - Genera el Cover Letter en inglés con tono sobrio de ingeniería de software delimitado por [COVER_LETTER]...[/COVER_LETTER].
   - Genera respuestas a las preguntas típicas (Why Us, Liderazgo, Visa TN).

3. PREGUNTAS INDIVIDUALES O DUDAS DE FORMULARIO:
   - Responde directamente con base en el perfil verificado de Jesús.
   - Si la pregunta no está registrada en la base oficial de preguntas, incluye el bloque especial:
   [NUEVA_PREGUNTA_NOTION]
   * Pregunta: ...
   * Respuesta Sugerida: ...
   * Nota: Karla: Pega este bloque en las notas de la vacante en Notion.
   [/NUEVA_PREGUNTA_NOTION]

Usa markdown limpio, profesional y perfectamente estructurado para que Karla pueda leer la orientación y accionar con 1 toque desde su tablet.`;
}

export async function callGeminiApi(prompt: string, apiKey: string): Promise<string> {
  const systemPrompt = buildSystemPrompt();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

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

// Limpieza rigurosa de asteriscos, comillas o backticks residuales en los extremos
function sanitizeExtractedText(text?: string): string | undefined {
  if (!text) return undefined;
  let cleaned = text.trim();
  let prev = '';
  // Eliminar envolturas repetidas de negritas (**), comillas o backticks
  while (cleaned !== prev) {
    prev = cleaned;
    cleaned = cleaned
      .replace(/^(\*{1,3}|_{1,3}|`{1,3}|"|'|“|”|«|»)\s*/, '')
      .replace(/\s*(\*{1,3}|_{1,3}|`{1,3}|"|'|“|”|«|»)$/, '')
      .trim();
  }
  return cleaned;
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

  // Extraer Cover Letter si viene delimitada por tag o encabezado
  let coverLetter: string | undefined;
  const coverTagMatch = llmText.match(/\[COVER_LETTER\]([\s\S]*?)\[\/COVER_LETTER\]/);
  if (coverTagMatch) {
    coverLetter = coverTagMatch[1].trim();
  } else {
    const coverMatch = llmText.match(/(?:##\s*(?:Cover Letter|Carta de Presentación)|Cover Letter:)\s*\n+([\s\S]*?)(?=\n##|\n\[|$)/i);
    if (coverMatch) {
      coverLetter = coverMatch[1].trim();
    }
  }

  // Extraer micro-comentario para el post
  let commentDraft: string | undefined;
  const commentTagMatch = llmText.match(/\[COMENTARIO_POST\]([\s\S]*?)\[\/COMENTARIO_POST\]/);
  if (commentTagMatch) {
    commentDraft = commentTagMatch[1].trim();
  }

  // Extraer Asunto (solo si viene explícito por tag o en correo)
  let emailSubject: string | undefined;
  const subjectTagMatch = llmText.match(/\[EMAIL_SUBJECT\]([\s\S]*?)\[\/EMAIL_SUBJECT\]/);
  if (subjectTagMatch) {
    emailSubject = subjectTagMatch[1].trim();
  } else if (/@/.test(originalQuery) || /\[CANAL:\s*EMAIL\]/i.test(llmText)) {
    const subjectMatch = llmText.match(/(?:Subject|Asunto):\s*([^\n]+)/i);
    if (subjectMatch) {
      emailSubject = subjectMatch[1].trim();
    }
  }

  // Extraer mensaje de outreach (correo o DM)
  let emailDraft: string | undefined;
  const outreachTagMatch = llmText.match(/\[OUTREACH_MESSAGE\]([\s\S]*?)\[\/OUTREACH_MESSAGE\]/);
  if (outreachTagMatch) {
    emailDraft = outreachTagMatch[1].trim();
  }

  // Determinar tipo
  const isLinkedIn = originalQuery.toLowerCase().includes('linkedin') || 
                     /@/.test(originalQuery) || 
                     /freelance|side project|mvp|wanted|hiring/i.test(originalQuery);
  const isAts = originalQuery.length > 250 || /requirements|responsibilities|job description/i.test(originalQuery);

  // Si no hubo tag pero es LinkedIn / email, fallback al texto
  if (!emailDraft && isLinkedIn && !isAts) {
    emailDraft = llmText;
  }

  // Limpiar summaryNote para que no muestre etiquetas internas ni duplique LaTeX
  let cleanSummary = llmText
    .replace(/\[NUEVA_PREGUNTA_NOTION\][\s\S]*?\[\/NUEVA_PREGUNTA_NOTION\]/g, '')
    .replace(/\[EMAIL_SUBJECT\][\s\S]*?\[\/EMAIL_SUBJECT\]/g, '')
    .replace(/\[OUTREACH_MESSAGE\][\s\S]*?\[\/OUTREACH_MESSAGE\]/g, '')
    .replace(/\[COMENTARIO_POST\][\s\S]*?\[\/COMENTARIO_POST\]/g, '')
    .replace(/\[COVER_LETTER\][\s\S]*?\[\/COVER_LETTER\]/g, '')
    .trim();

  if (latexCv) {
    cleanSummary = cleanSummary
      .replace(/```(?:latex|tex)?\s*[\s\S]*?\\documentclass[\s\S]*?\\end\{document\}[\s\S]*?```/g, '')
      .replace(/(\\documentclass[\s\S]*?\\end\{document\})/g, '')
      .trim();
  }

  // Si cleanSummary quedó vacío porque todo estaba en tags, darle un texto limpio de entrada
  if (!cleanSummary && emailDraft) {
    cleanSummary = emailSubject 
      ? `### ✉️ Borrador de Correo Preparado\nAquí tienes el correo listo para enviar.`
      : `### 💬 Mensaje Directo Preparado\nAquí tienes el mensaje directo listo para enviar por LinkedIn.`;
  }

  return {
    type: isLinkedIn ? 'linkedin-email' : isAts ? 'ats-package' : 'qa-answer',
    summaryNote: cleanSummary,
    latexCv,
    coverLetter: sanitizeExtractedText(coverLetter),
    emailSubject: sanitizeExtractedText(emailSubject),
    emailDraft: sanitizeExtractedText(emailDraft),
    commentDraft: sanitizeExtractedText(commentDraft),
    notionSyncSnippet: notionSnippet
  };
}
