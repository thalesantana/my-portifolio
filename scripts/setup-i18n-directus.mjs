// ──────────────────────────────────────────────────────────────────────────
// Setup i18n no Directus (idempotente).
//
// Cria a collection `languages` (pt-BR, en-US), as junctions de tradução
// (projects_translations, experiences_translations, site_settings_translations)
// com suas M2O/relations e o campo alias `translations` em cada collection base.
// Depois migra o conteúdo atual (que está nos campos base) para a tradução pt-BR.
//
// Uso: node scripts/setup-i18n-directus.mjs
// Lê DIRECTUS_URL / DIRECTUS_TOKEN do .env (ou do ambiente).
// ──────────────────────────────────────────────────────────────────────────

import { readFile } from 'node:fs/promises';

async function readEnv(key) {
  if (process.env[key]) return process.env[key];
  try {
    const txt = await readFile(new URL('../.env', import.meta.url), 'utf8');
    for (const line of txt.split('\n')) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && m[1] === key) return m[2].replace(/^["']|["']$/g, '').trim();
    }
  } catch {}
  return undefined;
}

const URL_ = await readEnv('DIRECTUS_URL');
const TOKEN = await readEnv('DIRECTUS_TOKEN');
if (!URL_ || !TOKEN) {
  console.error('DIRECTUS_URL / DIRECTUS_TOKEN ausentes');
  process.exit(1);
}

const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

async function api(method, path, body) {
  const r = await fetch(`${URL_}${path}`, {
    method,
    headers: H,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let json;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
  return { ok: r.ok, status: r.status, json };
}

async function exists(path) {
  const r = await fetch(`${URL_}${path}`, { headers: H });
  return r.ok;
}

async function ensureCollection(payload) {
  if (await exists(`/collections/${payload.collection}`)) {
    console.log(`  collection ${payload.collection} já existe`);
    return;
  }
  const r = await api('POST', '/collections', payload);
  console.log(`  + collection ${payload.collection}: ${r.ok ? 'ok' : 'FAIL ' + r.status + ' ' + JSON.stringify(r.json?.errors ?? r.json)}`);
}

async function ensureField(collection, payload) {
  if (await exists(`/fields/${collection}/${payload.field}`)) {
    console.log(`  field ${collection}.${payload.field} já existe`);
    return;
  }
  const r = await api('POST', `/fields/${collection}`, payload);
  console.log(`  + field ${collection}.${payload.field}: ${r.ok ? 'ok' : 'FAIL ' + r.status + ' ' + JSON.stringify(r.json?.errors ?? r.json)}`);
}

async function relationExists(collection, field) {
  const r = await fetch(`${URL_}/relations/${collection}/${field}`, { headers: H });
  return r.ok;
}

async function ensureRelation(payload) {
  if (await relationExists(payload.collection, payload.field)) {
    console.log(`  relation ${payload.collection}.${payload.field} já existe`);
    return;
  }
  const r = await api('POST', '/relations', payload);
  console.log(`  + relation ${payload.collection}.${payload.field}: ${r.ok ? 'ok' : 'FAIL ' + r.status + ' ' + JSON.stringify(r.json?.errors ?? r.json)}`);
}

// ── 1. languages ──────────────────────────────────────────────────────────
console.log('[1] languages');
await ensureCollection({
  collection: 'languages',
  meta: { icon: 'translate', note: 'Idiomas disponíveis' },
  schema: {},
  fields: [
    {
      field: 'code',
      type: 'string',
      meta: { interface: 'input', width: 'half' },
      schema: { is_primary_key: true, length: 10 },
    },
    {
      field: 'name',
      type: 'string',
      meta: { interface: 'input', width: 'half' },
      schema: {},
    },
  ],
});

for (const lang of [
  { code: 'pt-BR', name: 'Português (Brasil)' },
  { code: 'en-US', name: 'English (US)' },
]) {
  if (await exists(`/items/languages/${encodeURIComponent(lang.code)}`)) {
    console.log(`  language ${lang.code} já existe`);
  } else {
    const r = await api('POST', '/items/languages', lang);
    console.log(`  + language ${lang.code}: ${r.ok ? 'ok' : 'FAIL ' + JSON.stringify(r.json?.errors ?? r.json)}`);
  }
}

// ── 2. junctions de tradução ──────────────────────────────────────────────
const TARGETS = [
  {
    base: 'projects',
    fields: [
      { field: 'title', type: 'string', meta: { interface: 'input', width: 'full' } },
      { field: 'description', type: 'text', meta: { interface: 'input-multiline', width: 'full' } },
      { field: 'long_description', type: 'text', meta: { interface: 'input-rich-text-md', width: 'full' } },
      { field: 'access_note', type: 'text', meta: { interface: 'input-multiline', width: 'full' } },
    ],
  },
  {
    base: 'experiences',
    fields: [
      { field: 'role', type: 'string', meta: { interface: 'input', width: 'full' } },
      { field: 'description', type: 'text', meta: { interface: 'input-multiline', width: 'full' } },
    ],
  },
  {
    base: 'site_settings',
    fields: [
      { field: 'role', type: 'string', meta: { interface: 'input', width: 'full' } },
      { field: 'bio', type: 'text', meta: { interface: 'input-multiline', width: 'full' } },
      { field: 'location', type: 'string', meta: { interface: 'input', width: 'half' } },
    ],
  },
];

for (const { base, fields } of TARGETS) {
  const jt = `${base}_translations`;
  const fk = `${base}_id`;
  console.log(`[2] ${jt}`);

  // collection com PK auto-increment
  await ensureCollection({
    collection: jt,
    meta: { hidden: true, icon: 'translate' },
    schema: {},
    fields: [
      {
        field: 'id',
        type: 'integer',
        meta: { hidden: true },
        schema: { is_primary_key: true, has_auto_increment: true },
      },
    ],
  });

  // FK pro pai + relation (translations no pai)
  await ensureField(jt, { field: fk, type: 'integer', meta: { hidden: true }, schema: {} });
  await ensureRelation({
    collection: jt,
    field: fk,
    related_collection: base,
    meta: { one_field: 'translations', sort_field: null, one_deselect_action: 'delete', junction_field: 'languages_code' },
    schema: { on_delete: 'CASCADE' },
  });

  // FK pro idioma + relation
  await ensureField(jt, { field: 'languages_code', type: 'string', meta: { hidden: true, width: 'half' }, schema: {} });
  await ensureRelation({
    collection: jt,
    field: 'languages_code',
    related_collection: 'languages',
    meta: { one_field: null, junction_field: fk },
    schema: { on_delete: 'SET NULL' },
  });

  // campos traduzíveis
  for (const f of fields) {
    await ensureField(jt, { ...f, schema: {} });
  }

  // campo alias `translations` no pai (interface de traduções)
  await ensureField(base, {
    field: 'translations',
    type: 'alias',
    meta: {
      interface: 'translations',
      special: ['translations'],
      options: { languageField: 'code' },
      width: 'full',
    },
  });
}

// ── 3. migração: copia conteúdo atual (base) → tradução pt-BR ──────────────
console.log('[3] migração de conteúdo → pt-BR');

for (const { base, fields } of TARGETS) {
  const jt = `${base}_translations`;
  const fk = `${base}_id`;
  const fieldNames = fields.map((f) => f.field);

  const itemsRes = await api('GET', `/items/${base}?limit=-1&fields=${['id', ...fieldNames].join(',')}`);
  let items = itemsRes.json?.data;
  // singleton retorna objeto, não array
  if (items && !Array.isArray(items)) items = [items];
  if (!Array.isArray(items)) { console.log(`  ${base}: sem dados (${itemsRes.status})`); continue; }

  for (const item of items) {
    // já tem tradução pt-BR?
    const existing = await api(
      'GET',
      `/items/${jt}?filter[${fk}][_eq]=${item.id}&filter[languages_code][_eq]=pt-BR&limit=1`
    );
    if (existing.json?.data?.length) {
      console.log(`  ${jt} #${item.id} pt-BR já existe`);
      continue;
    }
    const payload = { [fk]: item.id, languages_code: 'pt-BR' };
    for (const f of fieldNames) if (item[f] != null) payload[f] = item[f];
    const r = await api('POST', `/items/${jt}`, payload);
    console.log(`  + ${jt} #${item.id} pt-BR: ${r.ok ? 'ok' : 'FAIL ' + JSON.stringify(r.json?.errors ?? r.json)}`);
  }
}

console.log('done.');
