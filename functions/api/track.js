/**
 * Cloudflare Pages Function — POST /api/track
 *
 * Registra um acesso (page view) na collection `page_views` do Directus.
 * Recebe um beacon do cliente (navigator.sendBeacon no BaseLayout) com
 * { path, referrer, lang, screen } e enriquece com dados de geo/rede que a
 * Cloudflare adiciona à requisição (país, região, cidade, IP).
 *
 * Env vars (Cloudflare Pages → Settings → Variables):
 *   DIRECTUS_URL   — ex.: https://directus-production-f831.up.railway.app
 *   DIRECTUS_TOKEN — token estático com escrita em `page_views`
 *
 * Schema: criar com `node --env-file=.env scripts/setup-pageviews-directus.mjs`.
 */

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
};

function deviceFromUA(ua = '') {
  if (/bot|crawler|spider|crawling|preview|facebookexternalhit|slurp/i.test(ua)) return 'bot';
  if (/mobile|iphone|ipod|android.*mobile|windows phone/i.test(ua)) return 'mobile';
  if (/ipad|tablet|android(?!.*mobile)/i.test(ua)) return 'tablet';
  return 'desktop';
}

export async function onRequestPost({ request, env }) {
  if (!env.DIRECTUS_URL || !env.DIRECTUS_TOKEN) {
    // Sem CMS configurado: não quebra a navegação do visitante.
    return new Response(JSON.stringify({ ok: false, skipped: 'no-cms' }), { status: 200, headers: cors });
  }

  // sendBeacon manda como text/plain; aceitamos JSON mesmo assim.
  let body = {};
  try {
    body = JSON.parse(await request.text());
  } catch {
    body = {};
  }

  const cf = request.cf || {};
  const ua = request.headers.get('user-agent') || '';
  const device = deviceFromUA(ua);

  // Não registra bots/crawlers (incluindo o fetch dos cards sociais).
  if (device === 'bot') {
    return new Response(JSON.stringify({ ok: true, skipped: 'bot' }), { status: 200, headers: cors });
  }

  const record = {
    path:       (body.path || '/').toString().slice(0, 500),
    referrer:   body.referrer ? body.referrer.toString().slice(0, 500) : null,
    lang:       body.lang ? body.lang.toString().slice(0, 16) : null,
    screen:     body.screen ? body.screen.toString().slice(0, 32) : null,
    country:    request.headers.get('cf-ipcountry') || cf.country || null,
    region:     cf.region || null,
    city:       cf.city || null,
    ip:         request.headers.get('cf-connecting-ip') || null,
    device,
    user_agent: ua.slice(0, 500) || null,
  };

  try {
    const res = await fetch(`${env.DIRECTUS_URL}/items/page_views`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.DIRECTUS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(record),
    });
    if (!res.ok) {
      console.error('[track] Directus error:', await res.text());
      return new Response(JSON.stringify({ ok: false }), { status: 502, headers: cors });
    }
  } catch (e) {
    console.error('[track] Directus fetch failed:', e);
    return new Response(JSON.stringify({ ok: false }), { status: 502, headers: cors });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: cors });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
