// ──────────────────────────────────────────────────────────────────────────
// Helpers de roteamento por idioma.
//
// PT fica na raiz (`/`, `/projects`, …) e EN sob `/en/` (`/en`, `/en/projects`).
// Aqui centralizamos: detectar o locale a partir da URL, montar caminhos
// localizados e mapear locale → código de idioma do Directus.
// ──────────────────────────────────────────────────────────────────────────

import { DEFAULT_LOCALE, type Locale } from './ui';

/** Código do idioma na collection `languages` do Directus. */
export const DIRECTUS_LANG_CODE: Record<Locale, string> = {
  'pt-BR': 'pt-BR',
  en: 'en-US',
};

/** Atributo `lang` do <html> + valor de og:locale. */
export const HTML_LANG: Record<Locale, string> = {
  'pt-BR': 'pt-BR',
  en: 'en',
};

export const OG_LOCALE: Record<Locale, string> = {
  'pt-BR': 'pt_BR',
  en: 'en_US',
};

/** Locale a partir de um pathname (`/en/...` → 'en', resto → 'pt-BR'). */
export function localeFromPath(pathname: string): Locale {
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : DEFAULT_LOCALE;
}

/** Remove o prefixo `/en` de um pathname, normalizando pra rota PT. */
function stripLocale(pathname: string): string {
  if (pathname === '/en') return '/';
  if (pathname.startsWith('/en/')) return pathname.slice(3); // remove "/en"
  return pathname;
}

/**
 * Monta um caminho localizado. `path` é sempre a rota "canônica" PT
 * (ex.: '/', '/projects', '/projects/foo'). Para EN, prefixa '/en'.
 */
export function localizedPath(path: string, lang: Locale): string {
  const clean = stripLocale(path) || '/';
  if (lang === 'pt-BR') return clean;
  return clean === '/' ? '/en' : `/en${clean}`;
}

/** Equivalente da URL atual no outro idioma (usado pelo switcher). */
export function alternatePath(pathname: string, target: Locale): string {
  const canonical = stripLocale(pathname) || '/';
  return localizedPath(canonical, target);
}
