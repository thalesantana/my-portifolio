import {
  createDirectus,
  rest,
  staticToken,
  readItems,
  readSingleton,
} from '@directus/sdk';

// ──────────────────────────────────────────────
// Type definitions matching Directus collections
// ──────────────────────────────────────────────

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
}

interface Schema {
  projects: Project[];
  experiences: Experience[];
  site_settings: SiteSettings;
}

// ──────────────────────────────────────────────
// Client
// ──────────────────────────────────────────────

let envLogged = false;

function getClient() {
  const url = import.meta.env.DIRECTUS_URL;
  const token = import.meta.env.DIRECTUS_TOKEN;

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

export async function getProjects(): Promise<Project[]> {
  const client = getClient();
  return runRequest('getProjects', () =>
    client.request(
      readItems('projects', {
        filter: { status: { _eq: 'published' } },
        sort: ['sort'],
      })
    ) as Promise<Project[]>
  );
}

export async function getFeaturedProjects(): Promise<Project[]> {
  const client = getClient();
  return runRequest('getFeaturedProjects', () =>
    client.request(
      readItems('projects', {
        filter: {
          status: { _eq: 'published' },
          featured: { _eq: true },
        },
        sort: ['sort'],
        limit: 3,
      })
    ) as Promise<Project[]>
  );
}

export async function getProject(slug: string): Promise<Project | null> {
  const client = getClient();
  const results = await runRequest(`getProject(${slug})`, () =>
    client.request(
      readItems('projects', {
        filter: {
          slug: { _eq: slug },
          status: { _eq: 'published' },
        },
        limit: 1,
      })
    ) as Promise<Project[]>
  );
  return results[0] ?? null;
}

export async function getExperiences(): Promise<Experience[]> {
  const client = getClient();
  return runRequest('getExperiences', () =>
    client.request(
      readItems('experiences', {
        sort: ['-start_date'],
      })
    ) as Promise<Experience[]>
  );
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const client = getClient();
  return runRequest('getSiteSettings', () =>
    client.request(readSingleton('site_settings')) as Promise<SiteSettings>
  );
}

// ──────────────────────────────────────────────
// Asset URL helper
// ──────────────────────────────────────────────

export function assetUrl(fileId: string | null | undefined): string | null {
  if (!fileId) return null;
  const base = import.meta.env.DIRECTUS_URL ?? '';
  return `${base}/assets/${fileId}`;
}
