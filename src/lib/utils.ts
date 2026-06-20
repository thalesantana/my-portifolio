import type { Experience } from './directus';
import { t, type Locale } from '../i18n/ui';

// ── Date formatting ───────────────────────────────────────────────────────────

const MONTHS: Record<Locale, string[]> = {
  'pt-BR': ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

export function formatDate(dateStr: string, lang: Locale = 'pt-BR'): string {
  const d = new Date(dateStr);
  return `${MONTHS[lang][d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function formatPeriod(
  start: string,
  end: string | null,
  current: boolean,
  lang: Locale = 'pt-BR'
): string {
  const endLabel = current || !end ? t(lang, 'date.present') : formatDate(end, lang);
  return `${formatDate(start, lang)} — ${endLabel}`;
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
