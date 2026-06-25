/**
 * Cloudflare Pages Function — POST /api/contact
 *
 * Receives contact form data, saves to Directus `leads`, and sends
 * a notification email via Resend.
 *
 * Required env vars (Cloudflare Pages dashboard → Settings → Variables):
 *   DIRECTUS_URL   — e.g. https://directus-production-f831.up.railway.app
 *   DIRECTUS_TOKEN — Directus static token with write access to `leads`
 *   RESEND_API_KEY — Resend API key (sending_access, thalessantana.dev domain)
 */

const NOTIFY_TO = 'contato@thalessantana.dev';
const FROM      = 'Portfolio <contato@thalessantana.dev>';

export async function onRequestPost({ request, env }) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: cors });
  }

  const { name, email, phone, company, message, lang } = body ?? {};

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return new Response(
      JSON.stringify({ error: 'name, email and message are required' }),
      { status: 422, headers: cors }
    );
  }

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(email)) {
    return new Response(JSON.stringify({ error: 'Invalid email' }), { status: 422, headers: cors });
  }

  const errors = [];

  // ── 1. Save lead to Directus ─────────────────────────────────
  try {
    const res = await fetch(`${env.DIRECTUS_URL}/items/leads`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.DIRECTUS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name:        name.trim(),
        email:       email.trim().toLowerCase(),
        phone:       phone?.trim() || null,
        company:     company?.trim() || null,
        message:     message.trim(),
        source_lang: lang || 'pt-BR',
        status:      'new',
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('[contact] Directus error:', err);
      errors.push('directus');
    }
  } catch (e) {
    console.error('[contact] Directus fetch failed:', e);
    errors.push('directus');
  }

  // ── 2. Send notification email via Resend ────────────────────
  try {
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:monospace;background:#070e1d;color:#dce2f7;padding:32px;max-width:600px;margin:0 auto;">
  <p style="font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:#45dfa4;margin-bottom:8px;">Novo lead — Portfolio</p>
  <h2 style="margin:0 0 24px;font-size:24px;color:#dce2f7;">${name}</h2>
  <table style="width:100%;border-collapse:collapse;font-size:14px;">
    <tr><td style="padding:8px 0;color:#89938d;width:120px;">Email</td><td><a href="mailto:${email}" style="color:#45dfa4;">${email}</a></td></tr>
    ${phone ? `<tr><td style="padding:8px 0;color:#89938d;">Telefone</td><td>${phone}</td></tr>` : ''}
    ${company ? `<tr><td style="padding:8px 0;color:#89938d;">Empresa</td><td>${company}</td></tr>` : ''}
    <tr><td style="padding:8px 0;color:#89938d;vertical-align:top;">Idioma</td><td>${lang === 'en' ? '🇬🇧 English' : '🇧🇷 Português'}</td></tr>
  </table>
  <div style="margin-top:24px;padding:20px;background:#0c1322;border-left:3px solid #45dfa4;">
    <p style="margin:0;color:#89938d;font-size:11px;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px;">Mensagem</p>
    <p style="margin:0;line-height:1.6;white-space:pre-wrap;">${message.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>
  </div>
  <p style="margin-top:32px;font-size:11px;color:#3f4944;">Enviado de thalessantana.dev/portfolio</p>
</body>
</html>`;

    const text = `Novo lead — ${name}\nEmail: ${email}${phone ? `\nTelefone: ${phone}` : ''}${company ? `\nEmpresa: ${company}` : ''}\n\n${message}`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:     FROM,
        to:       [NOTIFY_TO],
        reply_to: email,
        subject:  `Novo lead: ${name}${company ? ` — ${company}` : ''}`,
        html,
        text,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('[contact] Resend error:', err);
      errors.push('email');
    }
  } catch (e) {
    console.error('[contact] Resend fetch failed:', e);
    errors.push('email');
  }

  // Lead salvo = sucesso (email failing is non-critical)
  if (errors.includes('directus') && errors.includes('email')) {
    return new Response(JSON.stringify({ error: 'Failed to save lead' }), { status: 500, headers: cors });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: cors });
}

// Handle CORS preflight
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
