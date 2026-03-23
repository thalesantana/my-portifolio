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
  featured: boolean;
  sort: number | null;
  status: 'published' | 'draft';
  date_created: string;
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

function getClient() {
  const url = import.meta.env.DIRECTUS_URL;
  const token = import.meta.env.DIRECTUS_TOKEN;

  if (!url) throw new Error('DIRECTUS_URL env var is not set');

  if (token) {
    return createDirectus<Schema>(url).with(staticToken(token)).with(rest());
  }

  return createDirectus<Schema>(url).with(rest());
}

// ──────────────────────────────────────────────
// Query helpers
// ──────────────────────────────────────────────

export async function getProjects(): Promise<Project[]> {
  const client = getClient();
  return client.request(
    readItems('projects', {
      filter: { status: { _eq: 'published' } },
      sort: ['sort'],
    })
  ) as Promise<Project[]>;
}

export async function getFeaturedProjects(): Promise<Project[]> {
  const client = getClient();
  return client.request(
    readItems('projects', {
      filter: {
        status: { _eq: 'published' },
        featured: { _eq: true },
      },
      sort: ['sort'],
      limit: 3,
    })
  ) as Promise<Project[]>;
}

export async function getProject(slug: string): Promise<Project | null> {
  const client = getClient();
  const results = await client.request(
    readItems('projects', {
      filter: {
        slug: { _eq: slug },
        status: { _eq: 'published' },
      },
      limit: 1,
    })
  ) as Project[];
  return results[0] ?? null;
}

export async function getExperiences(): Promise<Experience[]> {
  const client = getClient();
  return client.request(
    readItems('experiences', {
      sort: ['-start_date'],
    })
  ) as Promise<Experience[]>;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const client = getClient();
  return client.request(readSingleton('site_settings')) as Promise<SiteSettings>;
}

// ──────────────────────────────────────────────
// Asset URL helper
// ──────────────────────────────────────────────

export function assetUrl(fileId: string | null | undefined): string | null {
  if (!fileId) return null;
  const base = import.meta.env.DIRECTUS_URL ?? '';
  return `${base}/assets/${fileId}`;
}
