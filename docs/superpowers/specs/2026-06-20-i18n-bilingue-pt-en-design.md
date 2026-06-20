# Design — Sistema bilíngue (pt-BR / en)

Data: 2026-06-20
Status: aprovado para planejamento

## Objetivo

Tornar o portfólio bilíngue (português do Brasil e inglês). A interface **e** o conteúdo
do CMS (Directus) devem mudar de idioma. Detecção automática pelo navegador na primeira
visita (qualquer idioma ≠ português → inglês), com um seletor de bandeiras no canto
superior direito que permite trocar manualmente — e a escolha manual sempre prevalece
sobre a detecção.

Termos técnicos (nomes de linguagens/frameworks, "GitHub", "LinkedIn") **não** são
traduzidos. "Tech Stack" é traduzido para "Tecnologias" no PT.

## Decisões (do brainstorming)

1. **Conteúdo do CMS**: i18n nativo do Directus (collections de tradução). A interface
   também muda de idioma, não só o conteúdo.
2. **URLs**: PT na raiz (`/`, `/projects`, `/about`, `/projects/<slug>`); EN sob `/en/`
   (`/en`, `/en/projects`, …). Cada idioma é HTML pré-renderizado (SEO + velocidade).
3. **Detecção/memória**: detecta 1× na primeira visita; clique numa bandeira salva a
   preferência (localStorage) e desativa o auto-redirect dali em diante.
4. **Tech Stack** → "Tecnologias" no PT.
5. **Bandeira do inglês**: Reino Unido (Union Jack).
6. **Schema Directus**: aplicado por nós via API REST (token do `.env`).

## Arquitetura

### 1. Roteamento (Astro i18n)

`astro.config.mjs`:

```js
i18n: {
  defaultLocale: 'pt-BR',
  locales: ['pt-BR', 'en'],
  routing: { prefixDefaultLocale: false },
}
```

Resultado: PT na raiz, EN sob `/en/`.

Para evitar duplicação de markup, o corpo real de cada página vira um **componente
compartilhado** que recebe a prop `lang`:

- `src/components/pages/HomePage.astro`
- `src/components/pages/AboutPage.astro`
- `src/components/pages/ProjectsPage.astro`
- `src/components/pages/ProjectDetail.astro`

Os arquivos em `src/pages/` ficam como "casquinhas":

| Arquivo | Conteúdo |
| --- | --- |
| `src/pages/index.astro` | `<HomePage lang="pt-BR" />` |
| `src/pages/en/index.astro` | `<HomePage lang="en" />` |
| `src/pages/about.astro` | `<AboutPage lang="pt-BR" />` |
| `src/pages/en/about.astro` | `<AboutPage lang="en" />` |
| `src/pages/projects/index.astro` | `<ProjectsPage lang="pt-BR" />` |
| `src/pages/en/projects/index.astro` | `<ProjectsPage lang="en" />` |
| `src/pages/projects/[slug].astro` | `getStaticPaths` + `<ProjectDetail lang="pt-BR" .../>` |
| `src/pages/en/projects/[slug].astro` | `getStaticPaths` + `<ProjectDetail lang="en" .../>` |

`getStaticPaths` retorna os **mesmos slugs** nos dois idiomas (slug é compartilhado,
não traduzido). A busca de dados acontece dentro de cada casquinha/`getStaticPaths`
passando o `locale` para os helpers do Directus.

### 2. Strings de UI (dicionário)

Novo `src/i18n/ui.ts`:

```ts
export const LOCALES = ['pt-BR', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const ui = {
  'pt-BR': { 'nav.projects': 'Projetos', /* ... */ },
  'en':    { 'nav.projects': 'Projects', /* ... */ },
} satisfies Record<Locale, Record<string, string>>;

export function t(lang: Locale, key: string): string { /* lookup com fallback */ }
```

Cobre todas as strings hoje hardcoded em: `Header`, `Footer`, `HomePage`, `AboutPage`,
`ProjectsPage`, `ProjectDetail` (ex.: "Selected Work" → "Trabalhos selecionados",
"Featured Projects" → "Projetos em destaque", "View Projects" → "Ver projetos",
"About Me" → "Sobre mim", "Get In Touch" → "Entre em contato", "Overview" → "Visão geral",
"Como acessar" / "How to access", "Repositório privado" / "Private repository",
"Tech Stack" → "Tecnologias" / "Technologies", "Available for work" → "Disponível para
trabalho", labels do bloco de stats do About, estado vazio, contagem de projetos, etc.).

Termos não traduzidos: nomes de tecnologias em `config.ts`, "GitHub", "LinkedIn".

`utils.ts`: `formatDate(dateStr, lang)` e `formatPeriod(start, end, current, lang)` passam
a receber o idioma (meses PT vs EN; "Presente" vs "Present").

### 3. Conteúdo do CMS — i18n nativo do Directus

Schema novo (aplicado via API REST):

- Collection `languages` com itens `pt-BR` e `en-US` (campo `code`, PK string).
- Collections de tradução (uma por collection de conteúdo), cada uma como junction O2M:
  - `projects_translations` → campos: `id`, `projects_id` (M2O), `languages_code` (M2O
    para `languages`), `title`, `description`, `long_description`, `access_note`.
  - `experiences_translations` → `experiences_id`, `languages_code`, `role`, `description`.
  - `site_settings_translations` → `site_settings_id`, `languages_code`, `bio`, `role`,
    `location`.
- Em cada collection base, um campo `translations` (O2M / alias `translations`,
  interface `translations`) ligando à junction.

**Campos compartilhados (não traduzidos)**: `slug`, `tech_stack`, datas, `repo_url`,
`live_url`, `cover_image`, `featured`, `sort`, `status`, `email`, `phone`, `github`,
`linkedin`, `avatar`.

**Migração de dados**: o conteúdo PT atual hoje vive nos campos base. A migração copia
os valores atuais para a tradução `pt-BR` (os campos base passam a servir de fallback).
EN começa vazio (cai no fallback até ser preenchido no admin).

`directus.ts`:

- Tipos: `Translation`-aware. Helpers passam a aceitar `locale: Locale`.
- Cada query pede `fields: ['*', { translations: ['*'] }]` com
  `deep: { translations: { _filter: { languages_code: { _eq: <code> } } } }`.
- Helper `flattenTranslation(item, locale)`: mescla os campos da tradução do idioma
  pedido sobre o objeto base; se faltar, usa a tradução PT; se faltar essa, usa o campo
  base. Garante que páginas EN nunca fiquem vazias.
- Mapa de locale → código Directus: `'pt-BR' → 'pt-BR'`, `'en' → 'en-US'`.

### 4. Detecção de navegador + seletor de bandeiras

- **Switcher** no `Header`, canto superior direito: bandeira do Brasil (PT) e Union Jack
  (EN) em SVG inline. Clicar navega para a URL equivalente no outro idioma e grava
  `localStorage.lang` = `'pt-BR' | 'en'`.
- Helper de mapeamento de rota (em `src/i18n/routing.ts`):
  - para EN: prefixa `/en` no pathname (se já não tiver).
  - para PT: remove o prefixo `/en`.
- **Script inline no `<head>` do `BaseLayout`** (roda antes do render, evita flash):
  1. Lê `localStorage.lang`. Se existe e não bate com o locale da URL atual → redireciona
     para a URL equivalente. (escolha manual manda)
  2. Se não existe preferência **e** não há flag `i18n.detected`: se
     `navigator.language` não começa com `pt` e a URL atual é PT → redireciona para
     `/en/…`. Em seguida grava `i18n.detected = '1'` para não repetir.
- `<html lang>` dinâmico por locale.
- `<head>`: tags `<link rel="alternate" hreflang="pt-BR" …>` e `hreflang="en"` +
  `x-default`, e `og:locale` por idioma.

`BaseLayout` passa a receber `lang` como prop (default `'pt-BR'`).

### 5. Follow-ups

- Incluir as collections `*_translations` no trigger do Flow "Rebuild site on publish"
  no Directus, para que editar traduções dispare o rebuild.
- Atualizar `CLAUDE.md` documentando: estrutura i18n, rotas por idioma, dicionário,
  schema de tradução do Directus e a regra de fallback.

## Componentes e responsabilidades

| Unidade | Responsabilidade | Depende de |
| --- | --- | --- |
| `src/i18n/ui.ts` | Strings de UI + `t()` | — |
| `src/i18n/routing.ts` | Locale atual a partir da URL, troca de rota PT↔EN | — |
| `src/components/pages/*` | Markup das páginas, recebe `lang` | ui, routing, directus |
| `src/components/layout/Header.astro` | Nav + switcher de bandeiras | ui, routing |
| `src/components/layout/LangSwitcher.astro` | Bandeiras + lógica de clique | routing |
| `src/layouts/BaseLayout.astro` | `<html lang>`, hreflang, script de detecção | routing |
| `src/lib/directus.ts` | Queries com tradução + fallback | i18n (códigos) |
| `src/lib/utils.ts` | Datas/períodos localizados | — |
| `astro.config.mjs` | Config `i18n` | — |

## Tratamento de erros / edge cases

- Directus offline no build: mantém os `.catch()` atuais (fallback `null`/`[]`).
- Tradução ausente: fallback PT → campo base (nunca renderiza vazio).
- Slug compartilhado: `getStaticPaths` idêntico nos dois idiomas; 404 natural se slug
  inexistente.
- JS desativado: sem auto-redirect e sem troca por clique via JS; PT (raiz) e `/en/`
  continuam acessíveis por URL direta e por links normais (`<a href>`), então o site
  permanece navegável.

## Estratégia de verificação

- `pnpm build` gera rotas PT (raiz) e EN (`/en/…`) sem erro.
- Inspeção do `dist/`: existência de `/en/index.html`, `/en/projects/index.html`,
  `/en/about/index.html` e `/en/projects/<slug>/index.html`.
- `pnpm preview`: trocar bandeira navega entre idiomas; recarregar respeita a escolha;
  primeira visita com navegador não-PT cai em `/en/`.
- Conteúdo do CMS aparece traduzido quando há tradução e cai no fallback quando não há.
```
