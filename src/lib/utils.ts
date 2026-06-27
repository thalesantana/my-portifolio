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

/** Mais recente primeiro: emprego atual no topo, depois por end_date desc */
export function sortExperiences(experiences: Experience[]): Experience[] {
  return [...experiences].sort((a, b) => {
    if (a.current && !b.current) return -1;
    if (!a.current && b.current) return 1;
    // Sem end_date (em andamento) conta como o mais recente.
    const aEnd = a.end_date ? new Date(a.end_date).getTime() : Infinity;
    const bEnd = b.end_date ? new Date(b.end_date).getTime() : Infinity;
    if (aEnd !== bEnd) return bEnd - aEnd;
    // Empate: desempata por start_date desc.
    const aStart = a.start_date ? new Date(a.start_date).getTime() : 0;
    const bStart = b.start_date ? new Date(b.start_date).getTime() : 0;
    return bStart - aStart;
  });
}
