import {
  createDirectus,
  rest,
  staticToken,
  readItems,
  readSingleton,
} from '@directus/sdk';
import { DIRECTUS_LANG_CODE } from '../i18n/routing';
import type { Locale } from '../i18n/ui';

// ──────────────────────────────────────────────
// Type definitions matching Directus collections
// ──────────────────────────────────────────────

export interface ProjectTranslation {
  languages_code: string;
  title: string | null;
  description: string | null;
  long_description: string | null;
  access_note: string | null;
}

export interface Project {
  id: number;
  slug: string;
  title: string;
  description: string;
  long_description: string | null;
  cover_image: string | null;
  tech_stack: string[];
  repo_url: string | null;
  live_url: string | null;
  access_note: string | null;
  featured: boolean;
  sort: number | null;
  status: 'published' | 'draft';
  date_created: string;
  start_date: string | null;
  end_date: string | null;
  translations?: ProjectTranslation[];
}

export interface ExperienceTranslation {
  languages_code: string;
  role: string | null;
  description: string | null;
}

export interface Experience {
  id: number;
  company: string;
  role: string;
  start_date: string;
  end_date: string | null;
  current: boolean;
  description: string;
  sort: number | null;
  translations?: ExperienceTranslation[];
}

export interface SiteSettingsTranslation {
  languages_code: string;
  role: string | null;
  bio: string | null;
  location: string | null;
}

export interface SiteSettings {
  name: string;
  role: string;
  bio: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  avatar: string | null;
  translations?: SiteSettingsTranslation[];
}

interface Schema {
  projects: Project[];
  experiences: Experience[];
  site_settings: SiteSettings;
}

// ──────────────────────────────────────────────
// i18n: aplica a tradução do idioma pedido sobre o objeto base.
//
// Buscamos TODAS as traduções (sem deep filter) e escolhemos em JS pra ter
// fallback: idioma pedido → pt-BR → campo base. Assim páginas EN nunca ficam
// vazias enquanto a tradução ainda não foi preenchida no admin.
// ──────────────────────────────────────────────

const PT_CODE = DIRECTUS_LANG_CODE['pt-BR'];

/** Considera string vazia/espaços como "ausente" (cai no fallback). */
function present<T>(v: T | null | undefined): v is T {
  return v != null && String(v).trim() !== '';
}

function applyTranslation<
  Item extends { translations?: Array<{ languages_code: string } & Record<string, unknown>> },
>(item: Item, fields: string[], locale: Locale): Item {
  const code = DIRECTUS_LANG_CODE[locale];
  const translations = item.translations ?? [];
  const wanted = translations.find((t) => t.languages_code === code);
  const ptbr = translations.find((t) => t.languages_code === PT_CODE);

  const merged: Record<string, unknown> = { ...item };
  for (const field of fields) {
    const value = wanted && present(wanted[field]) ? wanted[field]
      : ptbr && present(ptbr[field]) ? ptbr[field]
      : (item as Record<string, unknown>)[field];
    if (present(value)) merged[field] = value;
  }
  delete merged.translations;
  return merged as Item;
}

const PROJECT_T_FIELDS = ['title', 'description', 'long_description', 'access_note'];
const EXPERIENCE_T_FIELDS = ['role', 'description'];
const SITE_SETTINGS_T_FIELDS = ['role', 'bio', 'location'];

// ──────────────────────────────────────────────
// Client
// ──────────────────────────────────────────────

let envLogged = false;

/**
 * Lê uma variável de ambiente tanto do `import.meta.env` (arquivos `.env`,
 * usado em dev/local) quanto do `process.env` (build do Cloudflare Pages, onde
 * as variáveis Plaintext do projeto chegam por aí — NÃO pelo import.meta.env).
 */
function readEnv(key: string): string | undefined {
  const fromVite = (import.meta.env as Record<string, string | undefined>)[key];
  if (fromVite) return fromVite;
  if (typeof process !== 'undefined' && process.env) return process.env[key];
  return undefined;
}

function getClient() {
  const url = readEnv('DIRECTUS_URL');
  const token = readEnv('DIRECTUS_TOKEN');

  if (!envLogged) {
    console.log('[directus] DIRECTUS_URL:', url ? `set (${url})` : 'UNSET');
    console.log('[directus] DIRECTUS_TOKEN:', token ? `set (${String(token).length} chars)` : 'UNSET');
    envLogged = true;
  }

  if (!url) throw new Error('DIRECTUS_URL env var is not set');

  if (token) {
    return createDirectus<Schema>(url).with(staticToken(token)).with(rest());
  }

  return createDirectus<Schema>(url).with(rest());
}

// Build-time resiliência: o Directus de produção (Railway free) dorme e leva
// vários segundos pra acordar (cold start), retornando 500 nas primeiras
// chamadas. Sem retry, o build "engole" o erro e gera o site vazio. Aqui a
// gente reexecuta a chamada até o CMS responder (ou desistir após o teto).
const REQUEST_RETRIES = 8;
const REQUEST_RETRY_DELAY_MS = 8000;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runRequest<T>(label: string, fn: () => Promise<T>): Promise<T> {
  let lastErr: any;
  for (let attempt = 1; attempt <= REQUEST_RETRIES; attempt++) {
    const started = Date.now();
    try {
      const result = await fn();
      const count = Array.isArray(result) ? result.length : result ? 1 : 0;
      console.log(`[directus] ${label} OK in ${Date.now() - started}ms (items=${count})`);
      return result;
    } catch (err: any) {
      lastErr = err;
      const status = err?.response?.status ?? err?.errors?.[0]?.extensions?.code ?? '';
      console.error(
        `[directus] ${label} attempt ${attempt}/${REQUEST_RETRIES} failed in ${Date.now() - started}ms: ${err?.message ?? err} ${status}`
      );
      if (attempt < REQUEST_RETRIES) await sleep(REQUEST_RETRY_DELAY_MS);
    }
  }
  console.error(`[directus] ${label} desistindo após ${REQUEST_RETRIES} tentativas`);
  throw lastErr;
}

// ──────────────────────────────────────────────
// Query helpers
// ──────────────────────────────────────────────

export async function getProjects(locale: Locale = 'pt-BR'): Promise<Project[]> {
  const client = getClient();
  const items = await runRequest('getProjects', () =>
    client.request(
      readItems('projects', {
        filter: { status: { _eq: 'published' } },
        sort: ['sort'],
        fields: ['*', { translations: ['*'] }],
      })
    ) as Promise<Project[]>
  );
  return items.map((p) => applyTranslation(p, PROJECT_T_FIELDS, locale));
}

export async function getFeaturedProjects(locale: Locale = 'pt-BR'): Promise<Project[]> {
  const client = getClient();
  const items = await runRequest('getFeaturedProjects', () =>
    client.request(
      readItems('projects', {
        filter: {
          status: { _eq: 'published' },
          featured: { _eq: true },
        },
        sort: ['sort'],
        limit: 3,
        fields: ['*', { translations: ['*'] }],
      })
    ) as Promise<Project[]>
  );
  return items.map((p) => applyTranslation(p, PROJECT_T_FIELDS, locale));
}

export async function getProject(slug: string, locale: Locale = 'pt-BR'): Promise<Project | null> {
  const client = getClient();
  const results = await runRequest(`getProject(${slug})`, () =>
    client.request(
      readItems('projects', {
        filter: {
          slug: { _eq: slug },
          status: { _eq: 'published' },
        },
        limit: 1,
        fields: ['*', { translations: ['*'] }],
      })
    ) as Promise<Project[]>
  );
  const project = results[0];
  return project ? applyTranslation(project, PROJECT_T_FIELDS, locale) : null;
}

export async function getExperiences(locale: Locale = 'pt-BR'): Promise<Experience[]> {
  const client = getClient();
  const items = await runRequest('getExperiences', () =>
    client.request(
      readItems('experiences', {
        sort: ['-start_date'],
        fields: ['*', { translations: ['*'] }],
      })
    ) as Promise<Experience[]>
  );
  return items.map((e) => applyTranslation(e, EXPERIENCE_T_FIELDS, locale));
}

export async function getSiteSettings(locale: Locale = 'pt-BR'): Promise<SiteSettings> {
  const client = getClient();
  const settings = await runRequest('getSiteSettings', () =>
    client.request(
      readSingleton('site_settings', {
        fields: ['*', { translations: ['*'] }],
      })
    ) as Promise<SiteSettings>
  );
  return applyTranslation(settings, SITE_SETTINGS_T_FIELDS, locale);
}

// ──────────────────────────────────────────────
// Asset URL helper
// ──────────────────────────────────────────────

/**
 * URL local da capa "assada" no build. O arquivo é baixado do Directus para
 * `dist/cms-assets/<id>` pela integração `bake-cms-assets` (astro.config.mjs)
 * e servido pela CDN da Cloudflare — sem depender do Directus estar acordado
 * em runtime. O content-type vai num `dist/_headers` gerado pelo mesmo hook.
 */
export function assetUrl(fileId: string | null | undefined): string | null {
  if (!fileId) return null;
  return `/cms-assets/${fileId}`;
}
