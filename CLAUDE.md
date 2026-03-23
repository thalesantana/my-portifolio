# Claude Context — My Portfolio

Este documento serve como guia de contexto para assistentes de IA (como Claude/Antigravity) que trabalham neste repositório. Ele resume a arquitetura, as convenções e as decisões de design tomadas até agora.

## 🚀 Arquitetura e Stack

- **Framework**: Astro (Hybrid SSR/Prerender).
- **Styling**: Tailwind CSS v4 (@theme no CSS).
- **CMS**: Directus (Self-hosted via Docker).
- **Deploy**: Cloudflare Pages.
- **Gerenciador de Pacotes**: `pnpm`.

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

1.  **Directus Null Safety**: Ao buscar `site_settings`, sempre forneça um objeto de fallback com valores padrão para evitar erros de lint/runtime caso o CMS esteja offline.
2.  **Responsabilidade Única**: Crie componentes focados e reutilize funções de `lib/utils` e `lib/config`.
3.  **Classes Tailwind**: Priorize legibilidade e o uso de tokens. Ex: `text-primary` em vez de `text-[#45dfa4]`.
4.  **Prerender**: Páginas estáticas como `/` e `/about` usam `export const prerender = true;`.

## 📄 Gerenciamento de Conteúdo

O conteúdo é dinâmico e vem das coleções:
- `projects`: Portfólio de projetos.
- `experiences`: Experiência profissional.
- `site_settings`: Dados gerais (Bio, Redes Sociais, Contato).

## 🛠 Comandos Frequentes

- `pnpm dev`: Inicia o ambiente de desenvolvimento.
- `docker compose up -d`: Sobe o banco e o Directus local.
- `node --env-file=.env scripts/setup-directus.mjs`: Popula o CMS local com dados iniciais.
