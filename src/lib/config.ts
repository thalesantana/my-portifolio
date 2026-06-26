import type { UIKey } from '../i18n/ui';

// ── Tech stack categories (home page) ────────────────────────────────────────
//
// `labelKey` aponta pra uma chave de UI traduzível; `stack` são termos técnicos
// (não traduzidos), iguais nos dois idiomas.

export const TECH_STACK_CATEGORIES: { labelKey: UIKey; stack: string[] }[] = [
  {
    labelKey: 'stack.languages',
    stack: ['TypeScript', 'JavaScript', 'C#', 'Solidity'],
  },
  {
    labelKey: 'stack.backend',
    stack: ['Node.js', 'NestJS', '.NET', 'Fastify'],
  },
  {
    labelKey: 'stack.frontend',
    stack: ['React', 'Next.js', 'Astro', 'Tailwind CSS'],
  },
  {
    labelKey: 'stack.databases',
    stack: ['PostgreSQL', 'MongoDB', 'Docker', 'Cloud'],
  },
];
