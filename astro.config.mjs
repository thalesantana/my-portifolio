// @ts-check
import { defineConfig } from 'astro/config';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

/** Lê uma var do process.env (build do Cloudflare) ou do .env local (dev). */
async function readEnvVar(key) {
  if (process.env[key]) return process.env[key];
  try {
    const txt = await readFile(join(process.cwd(), '.env'), 'utf8');
    for (const line of txt.split('\n')) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && m[1] === key) return m[2].replace(/^["']|["']$/g, '').trim();
    }
  } catch {}
  return undefined;
}

/**
 * Integração que "assa" as capas dos projetos: ao fim do build, baixa cada
 * cover_image do Directus para `dist/cms-assets/<filename_disk>`. Assim as
 * imagens são servidas pela CDN da Cloudflare (como o resto do site estático)
 * e não dependem do Directus estar acordado em runtime. Ver `assetUrl()`.
 */
function bakeCmsAssets() {
  return {
    name: 'bake-cms-assets',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const URL_ = await readEnvVar('DIRECTUS_URL');
        const TOKEN = await readEnvVar('DIRECTUS_TOKEN');
        if (!URL_) {
          logger.warn('[bake-cms-assets] DIRECTUS_URL ausente — pulando bake de imagens');
          return;
        }
        const headers = TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {};

        // Lista as capas (id do arquivo) — com retry pro cold start do Railway free.
        let projects = [];
        for (let i = 1; i <= 8; i++) {
          try {
            const r = await fetch(
              `${URL_}/items/projects?fields=id,cover_image,images.directus_files_id&filter[status][_eq]=published&limit=-1`,
              { headers }
            );
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            projects = (await r.json()).data ?? [];
            break;
          } catch (e) {
            logger.warn(`[bake-cms-assets] listar capas tentativa ${i}/8 falhou: ${e}`);
            if (i < 8) await new Promise((s) => setTimeout(s, 8000));
          }
        }

        // Avatar do site_settings (foto de perfil) — também "assado" no build.
        let avatarId = null;
        try {
          const r = await fetch(`${URL_}/items/site_settings?fields=avatar`, { headers });
          if (r.ok) avatarId = (await r.json())?.data?.avatar ?? null;
        } catch (e) {
          logger.warn(`[bake-cms-assets] ler avatar falhou: ${e}`);
        }

        const outDir = fileURLToPath(new URL('cms-assets/', dir));
        await mkdir(outDir, { recursive: true });

        // Ids de arquivo a baixar: capas + imagens extras + avatar (sem duplicar).
        const extraIds = projects.flatMap((p) => (p.images ?? []).map((img) => img.directus_files_id));
        const fileIds = [...new Set([...projects.map((p) => p.cover_image), ...extraIds, avatarId].filter(Boolean))];

        let n = 0;
        const headerRules = [];
        for (const id of fileIds) {
          try {
            const r = await fetch(`${URL_}/assets/${id}`, { headers });
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const type = r.headers.get('content-type') || 'application/octet-stream';
            await writeFile(join(outDir, id), Buffer.from(await r.arrayBuffer()));
            headerRules.push(`/cms-assets/${id}\n  Content-Type: ${type.split(';')[0]}\n  Cache-Control: public, max-age=3600`);
            n++;
          } catch (e) {
            logger.warn(`[bake-cms-assets] download ${id} falhou: ${e}`);
          }
        }

        // Gera/append no _headers do Pages com o content-type correto dos assets
        // (arquivos sem extensão precisam disso pra serem servidos como imagem).
        if (headerRules.length) {
          const headersPath = fileURLToPath(new URL('_headers', dir));
          let existing = '';
          try { existing = await readFile(headersPath, 'utf8'); } catch {}
          const block = headerRules.join('\n\n');
          await writeFile(headersPath, existing ? `${existing.trimEnd()}\n\n${block}\n` : `${block}\n`);
        }
        logger.info(`[bake-cms-assets] ${n} asset(s) assado(s) em /cms-assets/ (capas + avatar)`);
      },
    },
  };
}

// https://astro.build/config
export default defineConfig({
  site: 'https://thalessantana.dev',
  output: 'static',
  i18n: {
    defaultLocale: 'pt-BR',
    locales: ['pt-BR', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [react(), bakeCmsAssets()],

  vite: {
    plugins: [tailwindcss()],
  },
});
