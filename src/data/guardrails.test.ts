import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectDomain, detectContactVariant, validatePackage } from './guardrails.ts';

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
