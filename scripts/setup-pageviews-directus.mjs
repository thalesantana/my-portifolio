/**
 * Cria (idempotente) a collection `page_views` no Directus — log de acessos do site.
 *
 * Uso:  node --env-file=.env scripts/setup-pageviews-directus.mjs
 *
 * Lê DIRECTUS_URL / DIRECTUS_TOKEN do ambiente. Re-rodar é seguro: a collection
 * só é criada se não existir e cada campo é criado ignorando "já existe".
 * Tem retry-loop porque o Railway free responde 500 no cold start.
 */

const URL = process.env.DIRECTUS_URL;
const TOKEN = process.env.DIRECTUS_TOKEN;

if (!URL || !TOKEN) {
  console.error('Faltando DIRECTUS_URL ou DIRECTUS_TOKEN no ambiente (.env).');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** fetch com retry pro cold start do Railway (500 nas primeiras chamadas). */
async function req(method, path, body) {
  let lastErr;
  for (let i = 0; i < 8; i++) {
    try {
      const res = await fetch(`${URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      return res;
    } catch (e) {
      lastErr = e;
      console.error(`  tentativa ${i + 1} falhou: ${e.message}`);
      await sleep(2000);
    }
  }
  throw lastErr;
}

// Campos da collection (id e created_at são gerenciados pelo Directus).
const FIELDS = [
  { field: 'path',       type: 'string', meta: { interface: 'input', width: 'half' } },
  { field: 'referrer',   type: 'string', meta: { interface: 'input', width: 'half' } },
  { field: 'lang',       type: 'string', meta: { interface: 'input', width: 'half' } },
  { field: 'country',    type: 'string', meta: { interface: 'input', width: 'half' } },
  { field: 'region',     type: 'string', meta: { interface: 'input', width: 'half' } },
  { field: 'city',       type: 'string', meta: { interface: 'input', width: 'half' } },
  { field: 'ip',         type: 'string', meta: { interface: 'input', width: 'half' } },
  { field: 'device',     type: 'string', meta: { interface: 'input', width: 'half' } },
  { field: 'screen',     type: 'string', meta: { interface: 'input', width: 'half' } },
  { field: 'user_agent', type: 'text',   meta: { interface: 'input-multiline' } },
];

async function ensureField(field) {
  const res = await req('POST', '/fields/page_views', field);
  if (res.ok) {
    console.log(`  + campo ${field.field}`);
  } else {
    const txt = await res.text();
    if (/exists|duplicate|already/i.test(txt)) {
      console.log(`  = campo ${field.field} (já existe)`);
    } else {
      console.error(`  ! campo ${field.field}: ${res.status} ${txt}`);
    }
  }
}

async function main() {
  console.log('→ Verificando collection page_views...');
  const check = await req('GET', '/collections/page_views');

  if (check.status === 200) {
    console.log('= collection já existe; garantindo campos...');
    for (const f of FIELDS) await ensureField(f);
  } else {
    console.log('→ Criando collection page_views...');
    const res = await req('POST', '/collections', {
      collection: 'page_views',
      meta: {
        icon: 'visibility',
        note: 'Log de acessos do portfólio (gravado pela function /api/track).',
        hidden: false,
        singleton: false,
      },
      schema: { name: 'page_views' },
      fields: [
        {
          field: 'id',
          type: 'integer',
          meta: { hidden: true, interface: 'input', readonly: true },
          schema: { is_primary_key: true, has_auto_increment: true },
        },
        {
          field: 'created_at',
          type: 'timestamp',
          meta: { special: ['date-created'], interface: 'datetime', readonly: true, width: 'half' },
          schema: {},
        },
        ...FIELDS,
      ],
    });
    if (res.ok) {
      console.log('✓ collection page_views criada com todos os campos.');
    } else {
      const txt = await res.text();
      console.error(`! erro ao criar collection: ${res.status} ${txt}`);
      process.exit(1);
    }
  }

  console.log('✓ Pronto.');
}

main().catch((e) => {
  console.error('Falhou:', e);
  process.exit(1);
});
