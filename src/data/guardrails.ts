// Ruteo de evidencias y validación de kits generados por el LLM.
// Módulo sin dependencias para poder probarlo con `node --test`.

export interface EvidenceDomain {
  id: string;
  label: string;
  // Las industrias pesan más que el stack: un rol KMP en health tech se rutea a health tech
  weight: number;
  keywords: string[];
  // Al menos una debe aparecer en la cover letter
  primary: string[];
  support: string[];
  // Dominios donde Wells Fargo puede ser la evidencia central
  allowsWellsFargoFocus?: boolean;
}

export const EVIDENCE_DOMAINS: EvidenceDomain[] = [
  {
    id: 'health',
    label: 'Health tech / medtech',
    weight: 2,
    keywords: ['health', 'healthcare', 'healthtech', 'medical', 'medtech', 'patient', 'patients', 'clinical', 'clinician', 'diabetes', 'hipaa', 'fda', 'hospital', 'telehealth', 'biotech', 'pharma', 'wellness', 'wearable', 'wearables', 'sleep', 'glucose', 'salud', 'pacientes', 'paciente', 'médico', 'médicos', 'clínico', 'hospitalario'],
    primary: ['Insulet', 'Dexcom'],
    support: []
  },
  {
    id: 'fintech',
    label: 'Fintech / banca / pagos',
    weight: 2,
    keywords: ['fintech', 'bank', 'banking', 'payments', 'payment', 'financial', 'crypto', 'trading', 'lending', 'credit card', 'neobank', 'wallet', 'brokerage'],
    primary: ['Wells Fargo', 'Bitso'],
    support: [],
    allowsWellsFargoFocus: true
  },
  {
    id: 'hardware',
    label: 'Hardware / IoT / automotriz',
    weight: 2,
    keywords: ['iot', 'hardware', 'bluetooth', 'ble', 'sensor', 'sensors', 'telematics', 'automotive', 'vehicle', 'vehicles', 'embedded', 'connected devices', 'peripheral', 'peripherals'],
    primary: ['Insulet', 'arkusnexus'],
    support: ['Zora Community']
  },
  {
    id: 'edtech',
    label: 'Edtech / educación',
    weight: 2,
    keywords: ['edtech', 'education', 'learning platform', 'students', 'teachers', 'e-learning', 'courses'],
    primary: ['Academia Desde0'],
    support: []
  },
  {
    id: 'kmp',
    label: 'Kotlin Multiplatform / cross-platform',
    weight: 1,
    keywords: ['kotlin multiplatform', 'kmp', 'kmm', 'compose multiplatform', 'cross-platform', 'multiplatform', 'skie', 'shared code'],
    primary: ['Bitso', 'Insulet'],
    support: ['json-to-compose', 'KMP CLI']
  },
  {
    id: 'startup',
    label: 'Startup / 0→1 / React Native',
    weight: 1,
    keywords: ['startup', 'founding', 'seed', 'series a', '0 to 1', '0-to-1', 'zero to one', 'mvp', 'react native', 'early-stage', 'early stage'],
    primary: ['arkusnexus', 'Academia Desde0'],
    support: ['json-to-compose']
  },
  {
    id: 'platform',
    label: 'Plataforma Android a gran escala',
    weight: 1,
    keywords: ['platform team', 'client platform', 'large-scale', 'at scale', 'millions of users', 'sdk', 'modularization', 'design system'],
    primary: ['Wells Fargo'],
    support: [],
    allowsWellsFargoFocus: true
  }
];

export const BANNED_PHRASES = [
  'I hope this email finds you well',
  'I am writing to express my',
  'as advertised',
  'My resume, detailing my contributions and technical stack, is attached for your review',
  'I am available for a quick discussion to explore how my skills can benefit your team',
  'attached for your review',
  'at your earliest convenience'
];

export const LINKEDIN_NOTE_MAX_CHARS = 200;

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function countMatches(text: string, term: string): number {
  const re = new RegExp(`(^|[^a-z0-9])${escapeRegex(term.toLowerCase())}(?=$|[^a-z0-9])`, 'g');
  return (text.toLowerCase().match(re) || []).length;
}

function scoreDomains(text: string): { domain: EvidenceDomain; score: number } | null {
  let best: { domain: EvidenceDomain; score: number } | null = null;
  for (const domain of EVIDENCE_DOMAINS) {
    const hits = domain.keywords.reduce((acc, kw) => acc + (countMatches(text, kw) > 0 ? 1 : 0), 0);
    const score = hits * domain.weight;
    if (score > 0 && (!best || score > best.score)) {
      best = { domain, score };
    }
  }
  return best;
}

// Recorre los textos del más reciente al más antiguo; los comandos de refinamiento
// ("hazlo más breve") heredan el dominio de la vacante pegada antes.
export function detectDomain(textsNewestFirst: string[]): EvidenceDomain | null {
  for (const text of textsNewestFirst) {
    const match = scoreDomains(text || '');
    if (match) return match.domain;
  }
  return null;
}

// Contact variant (JobSearch AGENTS.md §3): US roles -> US contact (-us route);
// Mexico, LATAM or remote-from-Mexico -> MX contact (default route).
export type ContactVariant = 'MX' | 'US';

const US_SIGNALS = [
  'united states', 'usa', 'u.s.', 'us-based', 'us based', 'us remote', 'remote us', 'remote (us)',
  'san francisco', 'bay area', 'new york', 'nyc', 'seattle', 'austin', 'los angeles', 'boston', 'chicago',
  'atlanta', 'denver', 'san jose', 'palo alto', 'mountain view', 'menlo park', 'oakland', 'california',
  'work authorization', 'authorized to work in the us', 'visa sponsorship', 'h-1b', 'h1b', 'tn visa'
];
const MX_SIGNALS = [
  'méxico', 'mexico', 'latam', 'latin america', 'latinoamérica', 'nearshore', 'tijuana', 'baja california',
  'guadalajara', 'monterrey', 'cdmx', 'ciudad de méxico', 'remote from mexico', 'remoto desde méxico'
];

export function detectContactVariant(text: string): ContactVariant {
  const count = (signals: string[]) => signals.filter(s => countMatches(text, s) > 0).length;
  return count(US_SIGNALS) > count(MX_SIGNALS) ? 'US' : 'MX';
}

// Clasificación de intención: distingue entre preguntas/consultas, refinamientos y vacantes completas
export type UserIntent = 'posting' | 'question' | 'refinement';

const QUESTION_SIGNALS = [
  '?', '¿',
  'por qué', 'por que', 'cómo responder', 'que responder', 'qué responder',
  'cómo contestar', 'que contestar', 'qué contestar', 'me preguntan',
  'pregunta:', 'pregunta de', 'formulario pregunta', 'qué ponemos', 'que ponemos',
  'qué respondemos', 'que respondemos', 'cuéntanos', 'cuentanos', 'describe',
  'cuál es tu', 'cual es tu', 'cuáles son tus', 'cuales son tus', 'experiencia con',
  'why us', 'why do you', 'why are you', 'tell us about', 'describe a time',
  'describe your', 'what is your', 'what are your', 'how do you', 'how would you',
  'do you require', 'are you authorized', 'what excited you', 'what experience do you have',
  'share an example', 'salary expectations', 'expected salary'
];

const POSTING_SIGNALS = [
  'requirements', 'responsibilities', 'qualifications', 'requisitos', 'responsabilidades',
  'about the role', 'about the job', 'years of experience', 'bachelor', 'we are looking for',
  'join our team', 'full-time', 'full time', 'part-time', 'hiring for', 'apply now',
  'job description', 'perfil del puesto', 'funciones:', 'beneficios:'
];

export function detectIntent(text: string): UserIntent {
  const trimmed = (text || '').trim();
  const lower = trimmed.toLowerCase();

  // 1. Refinamientos: comandos cortos que piden modificar la respuesta previa
  if (trimmed.length < 120) {
    if (
      lower.startsWith('hazlo') ||
      lower.startsWith('acórtalo') || lower.startsWith('acortalo') ||
      lower.startsWith('hazla') ||
      lower.startsWith('más corto') || lower.startsWith('mas corto') ||
      lower.startsWith('más breve') || lower.startsWith('mas breve') ||
      lower.startsWith('enfócate') || lower.startsWith('enfocate') ||
      lower.startsWith('ponlo en') ||
      lower.startsWith('traduce') ||
      lower.startsWith('cambia') ||
      lower.includes('otra opción') || lower.includes('otra opcion') ||
      lower.includes('otra alternativa')
    ) {
      return 'refinement';
    }
  }

  // 2. Preguntas de formulario o dudas operativas
  const hasQuestionMark = trimmed.includes('?') || trimmed.includes('¿');
  const questionHits = QUESTION_SIGNALS.filter(q => lower.includes(q)).length;
  const postingHits = POSTING_SIGNALS.filter(p => lower.includes(p)).length;

  if (hasQuestionMark || questionHits > 0) {
    // Si contiene estructura formal de job posting con múltiples señales y longitud sustancial, es un posting
    if (postingHits >= 2 && trimmed.length > 300) {
      return 'posting';
    }
    return 'question';
  }

  // 3. Por defecto, tratar como vacante / publicación de empleo
  return 'posting';
}

export interface ValidatablePackage {
  coverLetter?: string;
  emailDraft?: string;
  linkedinNote?: string;
  commentDraft?: string;
  cvLink?: string;
}

export interface ValidationContext {
  // Canonical CV routes (3 archetypes x MX/US); any other link is a one-off CV
  canonicalCvUrls?: string[];
  expectedVariant?: ContactVariant;
  intent?: UserIntent;
}

export function validatePackage(pkg: ValidatablePackage, domain: EvidenceDomain | null, ctx: ValidationContext = {}): string[] {
  const violations: string[] = [];
  const fields = [pkg.coverLetter, pkg.emailDraft, pkg.linkedinNote, pkg.commentDraft].filter(Boolean) as string[];

  // 1. Reglas globales inviolables (aplican siempre)
  if (fields.some(f => /hansell/i.test(f))) {
    violations.push('Se mencionó HansellApp, que está prohibido.');
  }

  if (fields.some(f => /zora[^.\n]{0,80}\bweb\b/i.test(f))) {
    violations.push('Se atribuyó "Web" a Zora Community; solo tiene targets Android/iOS/Desktop.');
  }

  for (const phrase of BANNED_PHRASES) {
    if (fields.some(f => f.toLowerCase().includes(phrase.toLowerCase()))) {
      violations.push(`Se usó la frase prohibida: "${phrase}".`);
    }
  }

  // 2. Reglas del Kit 4-en-1 (SOLO aplican si la intención es postulación, no en preguntas de formulario)
  if (ctx.intent !== 'question') {
    if (ctx.canonicalCvUrls) {
      if (!pkg.cvLink) {
        violations.push('Falta el link al CV canónico.');
      } else if (!ctx.canonicalCvUrls.includes(pkg.cvLink)) {
        violations.push(`El link de CV (${pkg.cvLink}) no es uno de los 3 arquetipos canónicos.`);
      }
    }

    if (ctx.expectedVariant && pkg.cvLink) {
      const linkVariant: ContactVariant = /-us\/?$/.test(pkg.cvLink) ? 'US' : 'MX';
      if (linkVariant !== ctx.expectedVariant) {
        violations.push(`La vacante pide la variante ${ctx.expectedVariant} del CV, pero el link es de la variante ${linkVariant}.`);
      }
    }

    if (ctx.expectedVariant === 'MX' && fields.some(f => /\bTN\b/.test(f))) {
      violations.push('Rol de México/LATAM: no menciones la visa TN.');
    }

    if (pkg.linkedinNote && pkg.linkedinNote.length >= LINKEDIN_NOTE_MAX_CHARS) {
      violations.push(`La nota de LinkedIn tiene ${pkg.linkedinNote.length} caracteres (debe ser menor a ${LINKEDIN_NOTE_MAX_CHARS}).`);
    }

    if (pkg.coverLetter && domain) {
      const citesPrimary = domain.primary.some(name => countMatches(pkg.coverLetter!, name) > 0);
      if (!citesPrimary) {
        violations.push(`La cover letter no cita la evidencia principal para ${domain.label} (esperado: ${domain.primary.join(' o ')}).`);
      }
      if (!domain.allowsWellsFargoFocus && countMatches(pkg.coverLetter, 'Wells Fargo') > 1) {
        violations.push(`La cover letter centra el argumento en Wells Fargo; para ${domain.label} solo debe aparecer una vez como rol actual.`);
      }
    }
  }

  return violations;
}

export function buildCorrectionPrompt(violations: string[], domain: EvidenceDomain | null, intent: UserIntent = 'posting'): string {
  if (intent === 'question') {
    return `Tu respuesta anterior violó estas reglas:\n${violations.map(v => `- ${v}`).join('\n')}\nRegenera tu respuesta corrigiendo únicamente estos puntos sin generar el kit de postulación (CV, correo ni carta).`;
  }
  const routing = domain
    ? `\nDominio detectado: ${domain.label}. Evidencia principal obligatoria: ${domain.primary.join(', ')}.`
    : '';
  return `Tu respuesta anterior violó estas reglas:\n${violations.map(v => `- ${v}`).join('\n')}${routing}\nRegenera el kit completo con todas las etiquetas obligatorias, corrigiendo únicamente estos puntos.`;
}
