import type { Experience } from './directus';

// ── Date formatting ───────────────────────────────────────────────────────────

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function formatPeriod(start: string, end: string | null, current: boolean): string {
  return `${formatDate(start)} — ${(current || !end) ? 'Presente' : formatDate(end)}`;
}

// ── Sorting ───────────────────────────────────────────────────────────────────

/** Encerradas primeiro (end_date asc), emprego atual por último */
export function sortExperiences(experiences: Experience[]): Experience[] {
  return [...experiences].sort((a, b) => {
    if (a.current && !b.current) return 1;
    if (!a.current && b.current) return -1;
    const aEnd = a.end_date ? new Date(a.end_date).getTime() : 0;
    const bEnd = b.end_date ? new Date(b.end_date).getTime() : 0;
    return aEnd - bEnd;
  });
}
