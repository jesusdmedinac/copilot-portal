// Canonical facts synced from cv-ats and JobSearch (see scripts/sync-sources.mjs).
// Everything the copilot says about CVs, contact data and verified facts comes from here.
import sources from './sources.generated.json';
import pkg from '../../package.json';

export const APP_VERSION: string = pkg.version;

import type { ContactVariant, UserIntent } from './guardrails.ts';
export type { ContactVariant, UserIntent };

export interface Archetype {
  slug: string;
  number: number;
  title: string;
  pdf: string;
  label: string;
  scope: string;
  urlMx: string;
  urlUs: string;
}

export const ARCHETYPES: Archetype[] = sources.archetypes;
export const CONTACT = sources.contact;
export const WORK = sources.work;
export const PROJECTS = sources.projects;
export const VERIFIED_FACTS: string[] = sources.verifiedFacts;
export const CV_BASE_URL = sources.cvBaseUrl;

export function archetypeUrl(archetype: Archetype, variant: ContactVariant): string {
  return variant === 'US' ? archetype.urlUs : archetype.urlMx;
}

export const CANONICAL_CV_URLS: string[] = ARCHETYPES.flatMap(a => [a.urlMx, a.urlUs]);

export { detectContactVariant, detectIntent } from './guardrails.ts';

// Resolves the archetype and variant named in a free-text recommendation.
export function resolveCv(text: string): { archetype: Archetype; variant: ContactVariant; url: string } | null {
  const urlMatch = text.match(/https:\/\/cv-ats-eyd\.pages\.dev\/(cv-[a-z-]+?)(-us)?\/?(?=[\s|),.]|$)/i);
  let archetype: Archetype | undefined;
  let variant: ContactVariant | undefined;
  if (urlMatch) {
    archetype = ARCHETYPES.find(a => a.slug === urlMatch[1].toLowerCase());
    variant = urlMatch[2] ? 'US' : 'MX';
  }
  if (!archetype) {
    if (/arquetipo 2|kmp|multiplatform/i.test(text)) archetype = ARCHETYPES[1];
    else if (/arquetipo 3|founding/i.test(text)) archetype = ARCHETYPES[2];
    else if (/arquetipo 1|android/i.test(text)) archetype = ARCHETYPES[0];
  }
  if (!archetype) return null;
  const named = text.match(/variante:\s*(MX|US)/i);
  if (named) variant = named[1].toUpperCase() as ContactVariant;
  variant = variant || 'MX';
  return { archetype, variant, url: archetypeUrl(archetype, variant) };
}

export function contactLine(variant: ContactVariant): string {
  const c = variant === 'US' ? CONTACT.us : CONTACT.mx;
  return `${c.city}, ${c.region} | ${c.phone}`;
}
