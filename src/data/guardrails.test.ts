import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectDomain, detectContactVariant, detectIntent, validatePackage } from './guardrails.ts';
import { parseGeminiResponseToPackage } from './geminiClient.ts';

const CANON = [
  'https://cv-ats-eyd.pages.dev/cv-android-platform/',
  'https://cv-ats-eyd.pages.dev/cv-android-platform-us/'
];

const HEALTH_POST = 'Senior Android Engineer at a digital health startup. You will build patient-facing apps that integrate with medical devices under FDA and HIPAA requirements. Kotlin Multiplatform is a plus.';
const FINTECH_POST = 'Senior Android Engineer, Payments. Join our fintech team building banking experiences for millions of customers.';
const STARTUP_POST = 'Founding Mobile Engineer at a seed-stage startup. Ship our MVP in React Native and own the app 0-to-1.';

test('detecta el dominio por industria', () => {
  assert.equal(detectDomain([HEALTH_POST])?.id, 'health');
  assert.equal(detectDomain([FINTECH_POST])?.id, 'fintech');
  assert.equal(detectDomain([STARTUP_POST])?.id, 'startup');
});

test('la industria pesa más que el stack (KMP en health tech)', () => {
  assert.equal(detectDomain([HEALTH_POST])?.id, 'health');
});

test('un refinamiento hereda el dominio de la vacante anterior', () => {
  assert.equal(detectDomain(['Hazlo más breve', HEALTH_POST])?.id, 'health');
});

test('sin señales no hay dominio', () => {
  assert.equal(detectDomain(['Hazlo más breve']), null);
});

test('health tech: rechaza una carta que solo cita Wells Fargo', () => {
  const domain = detectDomain([HEALTH_POST]);
  const violations = validatePackage({
    coverLetter: 'At Wells Fargo I led the navigation redesign. Wells Fargo serves tens of millions of customers.'
  }, domain);
  assert.ok(violations.some(v => v.includes('Insulet o Dexcom')));
  assert.ok(violations.some(v => v.includes('centra el argumento en Wells Fargo')));
});

test('health tech: acepta una carta que abre con Insulet', () => {
  const domain = detectDomain([HEALTH_POST]);
  const violations = validatePackage({
    coverLetter: 'At Insulet I built the VIEW app for remote diabetes monitoring. Currently Senior UI Engineer at Wells Fargo.'
  }, domain);
  assert.deepEqual(violations, []);
});

test('fintech: Wells Fargo puede ser la evidencia central', () => {
  const domain = detectDomain([FINTECH_POST]);
  const violations = validatePackage({
    coverLetter: 'At Wells Fargo I architected navigation for one of the largest US banking apps. Wells Fargo serves tens of millions of customers.'
  }, domain);
  assert.deepEqual(violations, []);
});

test('reglas globales: HansellApp, frases prohibidas y longitud de LinkedIn', () => {
  const violations = validatePackage({
    emailDraft: 'I hope this email finds you well. I worked at HansellApp.',
    linkedinNote: 'x'.repeat(200)
  }, null);
  assert.equal(violations.length, 3);
});

test('variante de contacto: EE. UU. → US; México/LATAM o sin señales → MX', () => {
  assert.equal(detectContactVariant('Senior Android Engineer, hybrid in San Francisco, CA. Must be authorized to work in the US.'), 'US');
  assert.equal(detectContactVariant('Remote (LATAM). Nearshore team, Mexico time zones.'), 'MX');
  assert.equal(detectContactVariant('Ingeniero Android en Guadalajara. Usar Kotlin es requisito; causa impacto.'), 'MX');
  assert.equal(detectContactVariant('Senior Android Engineer. Kotlin, Compose.'), 'MX');
});

test('CV: rechaza links fuera de los arquetipos canónicos y variante equivocada', () => {
  assert.ok(validatePackage({ cvLink: 'https://cv-ats-eyd.pages.dev/cv-acme/' }, null, { canonicalCvUrls: CANON })
    .some(v => v.includes('no es uno de los 3 arquetipos')));
  assert.ok(validatePackage({ cvLink: CANON[0] }, null, { canonicalCvUrls: CANON, expectedVariant: 'US' })
    .some(v => v.includes('variante US')));
  assert.deepEqual(validatePackage({ cvLink: CANON[1] }, null, { canonicalCvUrls: CANON, expectedVariant: 'US' }), []);
});

test('rol MX: no menciona la visa TN; Zora no se describe como Web', () => {
  const violations = validatePackage({
    emailDraft: 'Authorized to work in the US (TN Visa status).',
    coverLetter: 'I built Zora Community for Android, iOS and Web.'
  }, null, { expectedVariant: 'MX' });
  assert.ok(violations.some(v => v.includes('visa TN')));
  assert.ok(violations.some(v => v.includes('Zora')));
});

test('detecta health tech en vacantes en español y frases de relleno', () => {
  assert.equal(detectDomain(['KMP Lead para una startup de salud digital, apps de pacientes con dispositivos médicos.'])?.id, 'health');
  const violations = validatePackage({
    coverLetter: 'I am writing to express my interest in the role. My resume is attached for your review.'
  }, null);
  assert.equal(violations.length, 2);
});

test('clasificación de intención (detectIntent): preguntas, vacantes y refinamientos', () => {
  // Preguntas de formulario y dudas
  assert.equal(detectIntent('¿Por qué quieres trabajar aquí?'), 'question');
  assert.equal(detectIntent('Me preguntan en el formulario de Lever si tengo experiencia con KMP'), 'question');
  assert.equal(detectIntent('Why us / What excites you about this role?'), 'question');
  assert.equal(detectIntent('Describe your experience scaling Android architecture'), 'question');
  assert.equal(detectIntent('¿Cuál es el empleo actual de Jesús?'), 'question');
  assert.equal(detectIntent('Qué respondemos si preguntan si requiere visa?'), 'question');

  // Refinamientos
  assert.equal(detectIntent('Hazlo más breve'), 'refinement');
  assert.equal(detectIntent('Acórtalo a un párrafo'), 'refinement');
  assert.equal(detectIntent('Enfócate en Insulet'), 'refinement');
  assert.equal(detectIntent('Ponlo en inglés'), 'refinement');

  // Vacantes completas
  assert.equal(detectIntent(HEALTH_POST), 'posting');
  assert.equal(detectIntent(FINTECH_POST), 'posting');
  assert.equal(detectIntent(STARTUP_POST), 'posting');
});

test('modo pregunta: validatePackage no exige CV canónico ni Cover Letter', () => {
  // Una respuesta directa a una pregunta sin cvLink ni coverLetter es 100% válida en modo pregunta
  const violations = validatePackage({
    emailDraft: undefined,
    coverLetter: undefined,
    cvLink: undefined
  }, null, { intent: 'question', canonicalCvUrls: CANON });
  assert.deepEqual(violations, []);

  // Pero aún aplica las reglas globales de prohibición (HansellApp, frases prohibidas)
  const invalidViolations = validatePackage({
    coverLetter: 'At HansellApp I built the UI. I hope this email finds you well.'
  }, null, { intent: 'question' });
  assert.ok(invalidViolations.some(v => v.includes('HansellApp')));
  assert.ok(invalidViolations.some(v => v.includes('I hope this email finds you well')));
});

test('parseGeminiResponseToPackage extrae [RESPUESTA_FORMULARIO] como qa-answer sin generar kit', () => {
  const llmText = `Aquí tienes una opción directa para el formulario:
[RESPUESTA_FORMULARIO]
With 10 years of mobile platform experience, I focus on Kotlin Multiplatform to share 100% of business logic between Android and iOS. At Wells Fargo and Insulet, this reduced duplicate regressions and accelerated team velocity.
[/RESPUESTA_FORMULARIO]
`;
  const pkg = parseGeminiResponseToPackage(llmText, 'Describe your experience with KMP');
  assert.equal(pkg.type, 'qa-answer');
  assert.equal(pkg.atsAnswers?.length, 1);
  assert.ok(pkg.atsAnswers![0].answer.includes('With 10 years of mobile platform experience'));
  assert.equal(pkg.cvLink, undefined);
  assert.equal(pkg.coverLetter, undefined);
  assert.equal(pkg.emailDraft, undefined);
});
