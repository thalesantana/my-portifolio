# Claude Context — My Portfolio

Este documento serve como guia de contexto para assistentes de IA (como Claude/Antigravity) que trabalham neste repositório. Ele resume a arquitetura, as convenções e as decisões de design tomadas até agora.

## 🚀 Arquitetura e Stack

- **Framework**: Astro (output `static` — site 100% pré-renderizado).
- **Styling**: Tailwind CSS v4 (@theme no CSS).
- **CMS**: Directus — Docker local em dev; **Railway (plano free) em prod**: `https://directus-production-f831.up.railway.app` (admin em `/admin`). ⚠️ O free **dorme** e retorna **500 nas primeiras chamadas** (cold start) — por isso `src/lib/directus.ts` tem retry.
- **Deploy**: Cloudflare Pages (integração nativa Pages ↔ GitHub — push em `master` dispara build + deploy automático).
- **Gerenciador de Pacotes**: `pnpm`.

> ⚠️ **Conteúdo do Directus é resolvido em BUILD TIME**, não em runtime. Alterar dados no CMS exige um novo build para refletir em produção. Todas as chamadas `getProjects`, `getSiteSettings`, etc. rodam durante `astro build`.

> 🔁 **Auto-rebuild on publish**: um **Flow no Directus** ("Rebuild site on publish") dispara um **Cloudflare Deploy Hook** em create/update/delete de `projects`/`experiences`/`site_settings`/`directus_files` (uploads de imagem) e das collections de tradução `projects_translations`/`experiences_translations`/`site_settings_translations`/`languages` → o site rebuilda sozinho (~2-3 min). Logo, editar (ou traduzir) no admin **já reflete** em prod sem `git push` manual.

## 🌐 i18n (pt-BR / en)

Site bilíngue **one-page** na raiz (`/` com seções `#sobre`/`#experiencias`/`#projetos`/`#hackathons`/`#contato`) + páginas de detalhe `/projects/<slug>`; **EN sob `/en/`**. Config em `astro.config.mjs` (`i18n` com `defaultLocale: 'pt-BR'`, `prefixDefaultLocale: false`).

> 🚫 **Não existe rota de lista `/projects` nem `/about`** (são âncoras na home). Links pra "todos os projetos" vão pra **`${localizedPath("/", lang)}#projetos`**. O breadcrumb e o "todos os projetos" do `ProjectDetail` já usam isso — **nunca** linkar `/projects`/`/about` direto.

- **Páginas compartilhadas**: o corpo de cada página vive em `src/components/pages/*` (`HomePage`/`AboutPage`/`ProjectsPage`/`ProjectDetail`) e recebe a prop `lang`. Os arquivos em `src/pages/` (e `src/pages/en/`) são só "casquinhas" que chamam o componente com o `lang` certo. **Ao mexer no conteúdo de uma página, edite o componente em `pages/`, não a casquinha.**
- **Strings de UI**: dicionário em `src/i18n/ui.ts` (`t(lang, key)`). Termos técnicos (linguagens/frameworks, GitHub, LinkedIn) **não** são traduzidos. "Tech Stack" → "Tecnologias" no PT.
- **Roteamento**: helpers em `src/i18n/routing.ts` (`localizedPath`, `alternatePath`, `localeFromPath`, mapa locale→código Directus). **Todo link interno deve passar por `localizedPath(path, lang)`** pra preservar o idioma.
- **Datas**: `formatDate`/`formatPeriod` em `utils.ts` recebem `lang` (meses + "Presente"/"Present").
- **Detecção**: script inline no `<head>` do `BaseLayout`, roda no cliente (a detecção é por **idioma do navegador `navigator.language`, não por país/IP**). Regra do auto-redirect pra `/en/`: dispara **só** quando (1) não há preferência manual em `localStorage.lang` **e** (2) é a 1ª visita (sem a flag `localStorage['i18n.detected']`) **e** (3) `navigator.language` **não** começa com `pt` (logo `pt-PT` também fica no PT) **e** está numa rota PT. Preferência manual (`lang`) **sempre manda** e desliga o auto-redirect. O `LangSwitcher` (bandeiras 🇧🇷 / 🇬🇧 Union Jack) grava `lang` ao clicar. `<html lang>` + `hreflang` por idioma.
  - **Testar o auto-redirect**: limpar `localStorage.removeItem('lang'); localStorage.removeItem('i18n.detected')`, pôr o idioma do navegador em inglês (ou abrir com `chrome --lang=en-US`) e acessar `/` → deve ir pra `/en`. Sem limpar as duas chaves, não redireciona de novo. Funciona igual em `pnpm preview` e em prod.
- **Conteúdo do CMS**: i18n nativo do Directus. Cada collection tem `translations` (O2M) ligada a `<base>_translations` (junction com `languages_code` → `languages`). **Campos traduzíveis**: projects (`title`, `description`, `long_description`, `access_note`), experiences (`role`, `description`), site_settings (`role`, `bio`, `location`). O resto (slug, tech_stack, datas, URLs, cover_image…) é compartilhado.
  - As queries em `directus.ts` recebem `locale`, pedem `fields: ['*', { translations: ['*'] }]` e `applyTranslation()` achata a tradução sobre o objeto base com **fallback**: idioma pedido → pt-BR → campo base (EN nunca fica vazio enquanto não for traduzido).
  - Códigos de idioma no Directus: `pt-BR` e `en-US` (≠ do locale de rota `en`). Ver `DIRECTUS_LANG_CODE`.
  - Setup do schema é reaplicável (idempotente) via `node scripts/setup-i18n-directus.mjs`. As traduções `en-US` iniciais foram semeadas por `node scripts/translate-en-directus.mjs` (upsert idempotente — re-rodar atualiza). Edições finas de tradução são feitas direto no admin do Directus (aba de tradução de cada item).

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
- `src/i18n/`: `ui.ts` (dicionário + `t()`), `routing.ts` (helpers de rota por idioma).
- `src/components/pages/`: corpo das páginas (recebem `lang`); as rotas em `src/pages/` são casquinhas.
- `src/components/ui/`: Componentes reutilizáveis (TechChip, ProjectCard, `TechOrb`).
- `src/components/layout/`: Header, Footer, LangSwitcher.
- `scripts/setup-i18n-directus.mjs`: cria/reaplica o schema de traduções no Directus (idempotente).

### 🎬 Hero & animações

- **Hero + Sobre unificados** numa só seção `id="sobre"` (a landing). A arte animada é `src/components/ui/TechOrb.astro` (núcleo "respirando" + chips flutuantes), reusada no desktop (direita) e **atrás do texto no mobile** (`opacity` baixa). Tem typing no nome + foto que dá *pop* depois do typing + glow verde que segue o cursor.
- **Reveal/parallax on scroll** é utilitário **global na `BaseLayout`**: `data-reveal` (+ `="left"`/`="right"`, var `--d` p/ stagger) e `data-parallax="<speed>"` (IntersectionObserver + rAF, respeita `prefers-reduced-motion`). Qualquer página usa só pondo o atributo.
- **Timeline** (Experiência) é genérica por classe (`.tl-root`/`.tl-track`/`.tl-fill`/`.tl-dot`/`.tl-node`) — o mesmo script anima desktop **e** mobile; nós são círculos vazados que preenchem conforme o scroll passa.
- **Cards de projeto** (`ProjectCardHorizontal`, hoje vertical): glass translúcido (`bg-white/[0.06]` + `backdrop-blur`), grid responsivo, e **tilt 3D** seguindo o mouse (script `.tilt-card` no HomePage).

## ⚙️ Convenções de Código

1.  **Directus Null Safety**: Ao buscar dados no CMS, sempre use `.catch()` com fallback (`null` para singletons, `[]` para coleções). Se o build rodar com o Directus offline, o site ainda compila — apenas fica sem o conteúdo dinâmico.
2.  **Responsabilidade Única**: Crie componentes focados e reutilize funções de `lib/utils` e `lib/config`.
3.  **Classes Tailwind**: Priorize legibilidade e o uso de tokens. Ex: `text-primary` em vez de `text-[#45dfa4]`.
4.  **Rotas dinâmicas**: Páginas como `/projects/[slug]` **exigem `getStaticPaths`** — retorne a lista completa de slugs a partir do Directus para que cada rota seja pré-renderizada em HTML no build.
5.  **Sem diretiva `prerender`**: Como `output: 'static'` é o padrão, **não** use `export const prerender = true;` nas páginas — é redundante.
6.  **Env vars do `directus.ts`**: use `readEnv()` (lê `import.meta.env` **e** `process.env`). No build do Pages as vars vêm pelo `process.env` — `import.meta.env.DIRECTUS_URL` volta vazio lá.
7.  **Retry de build**: `runRequest` reexecuta as queries (cold start do Railway). Não remover — sem isso o build pega o CMS dormindo e sai vazio.
8.  **Markdown** (`long_description`, `access_note`): renderizado com `marked` + `set:html`. Não há plugin `typography` — estilize os elementos com arbitrary variants (`[&_h2]:...`, `[&_a]:...`).
9.  **Assets/capas**: são **"assadas" no build** pela integração `bake-cms-assets` (`astro.config.mjs`) → baixadas pra `dist/cms-assets/<id>` (sem extensão; content-type vai num `_headers` gerado) e servidas pela **CDN da Cloudflare**. `assetUrl()` retorna o caminho local. **Não dependem do Directus acordado em runtime.** Trocar a capa no admin reflete via auto-rebuild. O bake usa o **id** do arquivo (a query do build pega `cover_image` como id, sem expandir).
10. **`assetUrl()` em dev vs build**: em `import.meta.env.DEV` o `assetUrl()` aponta **direto pro Directus** (`{DIRECTUS_URL}/assets/<id>?access_token=`) porque o bake só roda no build. Em build/prod usa `/cms-assets/<id>`. Se a imagem der 404 em `pnpm dev`, confira `DIRECTUS_URL`/`DIRECTUS_TOKEN` no `.env`.

## 📄 Gerenciamento de Conteúdo

O conteúdo é dinâmico e vem das coleções:
- `projects`: Portfólio de projetos.
- `experiences`: Experiência profissional. Se a **empresa ficar vazia**, a timeline do About mostra **"Freelancer"** automaticamente (`exp.company || t(lang, 'about.career.freelancer')`) — vale pros dois idiomas.
- `site_settings`: Dados gerais (Bio, Redes Sociais, Contato, Avatar). A foto do About vem de `site_settings.avatar` (via `assetUrl`, com fallback pra um SVG genérico). `avatarFocal` (se existir) vira `object-position` pra ajustar o enquadramento.

> 📝 **`site_settings.bio` é renderizado como Markdown** no hero (HomePage usa `marked` + `set:html`; `[&_strong]:text-primary` deixa trechos em `**negrito**` verdes). Guardado com `**...**` e linhas em branco entre parágrafos — editável no admin.

> ⚠️ **Traduções sobrescrevem o campo base**: a bio (e demais campos traduzíveis) exibida vem de `site_settings.translations` (pt-BR `id:1`, en-US `id:34`), **não** do campo base. Editar só o base **não reflete** — atualize a tradução do idioma.

> 🖼️ **Campo `projects.cover_image`**: é uma **relação M2O com `directus_files`** (`special: ['file']` + relation). Se um dia o admin mostrar **"No Image Selected"** mesmo com capa setada, é sinal de que a relação se perdeu (ex.: re-import de schema) — sem ela, o admin não resolve o arquivo e **salvar apaga a capa**. Recriar: `PATCH /fields/projects/cover_image {"meta":{"special":["file"]}}` + `POST /relations {"collection":"projects","field":"cover_image","related_collection":"directus_files"}`.

## 🛠 Comandos Frequentes

- `pnpm dev`: Inicia o ambiente de desenvolvimento em `localhost:4321`.
- `pnpm build`: Build estático de produção → gera `dist/`.
- `pnpm preview`: Serve `dist/` localmente para verificar o output antes do push.
- `docker compose up -d` / `down`: Sobe/derruba o Directus + Postgres locais.
- **Editar conteúdo do Directus por script**: `node --env-file=.env script.mjs` (lê `DIRECTUS_URL`/`DIRECTUS_TOKEN` do `.env`). **Sempre** com retry-loop (~8x, 2s) — Railway free responde **500 no cold start**. `site_settings` é singleton (`/items/site_settings`).

## ☁️ Deploy (Cloudflare Pages)

- Projeto: `my-portifolio` (dashboard Cloudflare → Workers & Pages). Account ID: `29f2af93a8e9e9c8e7bf15fce7e131ff`.
- Domínios: `my-portifolio-9y6.pages.dev` (padrão) e `thalessantana.dev` (custom).
- Build command (`npm run build`) e output dir (`dist`) ficam no **dashboard** (Settings → Builds).
- 🚨 **NUNCA criar `wrangler.jsonc`/`wrangler.toml` no repo.** Se existir, o Pages lê as env vars **do arquivo** e **ignora as do dashboard** → `DIRECTUS_URL: UNSET` → build sai **vazio** ("No projects"). Foi a causa-raiz de builds via git saírem sem conteúdo (removido no commit `6a7e407`).
- Variáveis obrigatórias no dashboard (Settings → Variables and secrets, ambiente **Production**): `DIRECTUS_URL`, `DIRECTUS_TOKEN`. Opcionais: `UMAMI_WEBSITE_ID`, `UMAMI_SRC`.
- Não há GitHub Actions — deploy pela integração nativa Pages ↔ GitHub.
- **Deploy manual de emergência** (usa o `.env` local; útil se o build via git falhar): `pnpm build && CLOUDFLARE_ACCOUNT_ID=29f2af93a8e9e9c8e7bf15fce7e131ff pnpm exec wrangler pages deploy dist --project-name my-portifolio --branch master`.
