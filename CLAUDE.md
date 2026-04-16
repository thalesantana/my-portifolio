# Claude Context — My Portfolio

Este documento serve como guia de contexto para assistentes de IA (como Claude/Antigravity) que trabalham neste repositório. Ele resume a arquitetura, as convenções e as decisões de design tomadas até agora.

## 🚀 Arquitetura e Stack

- **Framework**: Astro (output `static` — site 100% pré-renderizado).
- **Styling**: Tailwind CSS v4 (@theme no CSS).
- **CMS**: Directus (self-hosted via Docker em dev; instância remota em prod).
- **Deploy**: Cloudflare Pages (integração nativa Pages ↔ GitHub — push em `master` dispara build + deploy automático).
- **Gerenciador de Pacotes**: `pnpm`.

> ⚠️ **Conteúdo do Directus é resolvido em BUILD TIME**, não em runtime. Alterar dados no CMS exige novo build/push para refletir em produção. Todas as chamadas `getProjects`, `getSiteSettings`, etc. rodam durante `astro build`.

## 🎨 Design System (Tailwind v4)

O projeto utiliza um sistema de cores customizado definido em `src/styles/global.css`. **Evite usar cores hexadecimais diretamente nas classes.** Use sempre os tokens do tema:

- **Surfaces**: `bg-surface`, `bg-surface-low`, `bg-surface-lowest`, `bg-surface-container`.
- **Primary**: `text-primary`, `bg-primary`, `text-on-primary`.
- **Outline**: `text-outline`, `border-outline-variant`.
- **Fonts**: `font-display` (Space Grotesk), `font-sans` (Inter), `font-mono` (JetBrains Mono).

## 📂 Estrutura de Pastas Importante

- `src/lib/directus.ts`: Cliente e tipos do CMS.
- `src/lib/utils.ts`: Funções utilitárias (formatação de data, ordenação).
- `src/lib/config.ts`: Configurações estáticas (categorias da stack).
- `src/components/ui/`: Componentes reutilizáveis (TechChip, ProjectCard).
- `src/components/layout/`: Header, Footer.

## ⚙️ Convenções de Código

1.  **Directus Null Safety**: Ao buscar dados no CMS, sempre use `.catch()` com fallback (`null` para singletons, `[]` para coleções). Se o build rodar com o Directus offline, o site ainda compila — apenas fica sem o conteúdo dinâmico.
2.  **Responsabilidade Única**: Crie componentes focados e reutilize funções de `lib/utils` e `lib/config`.
3.  **Classes Tailwind**: Priorize legibilidade e o uso de tokens. Ex: `text-primary` em vez de `text-[#45dfa4]`.
4.  **Rotas dinâmicas**: Páginas como `/projects/[slug]` **exigem `getStaticPaths`** — retorne a lista completa de slugs a partir do Directus para que cada rota seja pré-renderizada em HTML no build.
5.  **Sem diretiva `prerender`**: Como `output: 'static'` é o padrão, **não** use `export const prerender = true;` nas páginas — é redundante.

## 📄 Gerenciamento de Conteúdo

O conteúdo é dinâmico e vem das coleções:
- `projects`: Portfólio de projetos.
- `experiences`: Experiência profissional.
- `site_settings`: Dados gerais (Bio, Redes Sociais, Contato).

## 🛠 Comandos Frequentes

- `pnpm dev`: Inicia o ambiente de desenvolvimento em `localhost:4321`.
- `pnpm build`: Build estático de produção → gera `dist/`.
- `pnpm preview`: Serve `dist/` localmente para verificar o output antes do push.
- `docker compose up -d` / `down`: Sobe/derruba o Directus + Postgres locais.

## ☁️ Deploy (Cloudflare Pages)

- Projeto: `my-portifolio` (dashboard Cloudflare → Workers & Pages).
- Domínios: `my-portifolio-9y6.pages.dev` (padrão) e `thalessantana.dev` (custom).
- Build settings configurados via [wrangler.jsonc](wrangler.jsonc) (`pages_build_output_dir: "./dist"`).
- Variáveis de ambiente obrigatórias no dashboard do Pages (Settings → Environment variables): `DIRECTUS_URL`, `DIRECTUS_TOKEN`. Opcionais: `UMAMI_WEBSITE_ID`, `UMAMI_SRC`.
- Não há workflow GitHub Actions — o deploy é feito pela integração nativa Pages ↔ GitHub.
