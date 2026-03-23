# Portfolio

Personal portfolio site built with Astro, React, and Tailwind CSS. Content is managed via a self-hosted Directus CMS instance — no redeploy needed to update projects or experience.

## Stack

| Layer | Technology |
|---|---|
| Framework | Astro (SSR + static hybrid) |
| Styling | Tailwind CSS v4 |
| CMS | Directus (self-hosted) |
| Deploy | Cloudflare Pages + Workers |
| Analytics | Umami |

## Pages

| Route | Description |
|---|---|
| `/` | Landing page with featured projects and tech stack |
| `/projects` | Full project gallery |
| `/projects/[slug]` | Case study detail page |
| `/about` | Bio, career timeline, and contact |

## Local Development

**Prerequisites:** Docker (for Directus) and Node.js 20+.

**1. Clone and install dependencies**

```sh
git clone https://github.com/thalesantana/my-portifolio.git
cd my-portifolio
pnpm install
```

**2. Configure environment**

```sh
cp .env.example .env
# Edit .env — set DIRECTUS_URL and DIRECTUS_TOKEN
```

**3. Start Directus**

```sh
docker compose up -d
```

Directus will be available at `http://localhost:8055`. Default credentials: `admin@portfolio.local` / `admin123`.

**4. Create a static token**

In Directus: Settings → Users → Admin → Token → Generate and save to `.env` as `DIRECTUS_TOKEN`.

**5. Start the dev server**

```sh
pnpm dev
```

Site runs at `http://localhost:4321`.

## Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start dev server at `localhost:4321` |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build locally |
| `docker compose up -d` | Start Directus + PostgreSQL |
| `docker compose down` | Stop and remove containers |

## Content Management

All dynamic content lives in Directus:

- **`projects`** — title, slug, description, tech stack, links, cover image, featured flag
- **`experiences`** — company, role, period, description
- **`site_settings`** (singleton) — name, role, bio, email, location, social links

Changes in Directus reflect immediately on the site (SSR) or on next build (prerendered pages).

## Deployment

The site deploys to Cloudflare Pages via `@astrojs/cloudflare`. Static pages (`/`, `/about`) are prerendered at build time. Dynamic pages (`/projects`, `/projects/[slug]`) run as Cloudflare Workers.

Set the following environment variables in Cloudflare Pages settings:

```
DIRECTUS_URL=https://your-directus.up.railway.app
DIRECTUS_TOKEN=your-static-token
```
