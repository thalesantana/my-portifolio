// Setup M2M images em projects (idempotente).
// Cria projects_files junction + relações + campo images em projects.
// Uso: node scripts/setup-project-images.mjs

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
if (!URL_ || !TOKEN) { console.error('DIRECTUS_URL / DIRECTUS_TOKEN ausentes'); process.exit(1); }

const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

async function api(method, path, body) {
  const r = await fetch(`${URL_}${path}`, {
    method, headers: H, body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let json; try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
  return { ok: r.ok, status: r.status, json };
}

async function exists(path) {
  const r = await fetch(`${URL_}${path}`, { headers: H });
  return r.ok;
}

async function ensureField(collection, payload) {
  if (await exists(`/fields/${collection}/${payload.field}`)) {
    console.log(`  field ${collection}.${payload.field} já existe`);
    return;
  }
  const r = await api('POST', `/fields/${collection}`, payload);
  console.log(`  + field ${collection}.${payload.field}: ${r.ok ? 'ok' : 'FAIL ' + JSON.stringify(r.json?.errors ?? r.json)}`);
}

async function ensureRelation(payload) {
  const r = await fetch(`${URL_}/relations/${payload.collection}/${payload.field}`, { headers: H });
  if (r.ok) { console.log(`  relation ${payload.collection}.${payload.field} já existe`); return; }
  const res = await api('POST', '/relations', payload);
  console.log(`  + relation ${payload.collection}.${payload.field}: ${res.ok ? 'ok' : 'FAIL ' + JSON.stringify(res.json?.errors ?? res.json)}`);
}

// ── 1. Limpar collection vazia anterior (sem tabela no banco) ─────────────
console.log('[1] Limpando collection projects_files sem schema...');
const existing = await api('GET', '/collections/projects_files');
if (existing.ok) {
  // Verificar se tem campos (se não tem id, a tabela não existe)
  const fields = await api('GET', '/fields/projects_files');
  const hasIdField = fields.json?.data?.some(f => f.field === 'id');
  if (!hasIdField) {
    console.log('  projects_files existe mas sem tabela — removendo para recriar...');
    const del = await api('DELETE', '/collections/projects_files');
    console.log(`  DELETE: ${del.ok ? 'ok' : del.status + ' ' + JSON.stringify(del.json?.errors)}`);
    await new Promise(r => setTimeout(r, 1000));
  } else {
    console.log('  projects_files já existe com tabela — pulando criação');
  }
}

// ── 2. Criar junction collection projects_files com todos os campos ───────
console.log('[2] Criando junction collection projects_files...');
if (!(await exists('/collections/projects_files'))) {
  const r = await api('POST', '/collections', {
    collection: 'projects_files',
    schema: {},
    meta: { hidden: true, icon: 'import_export' },
    fields: [
      {
        field: 'id', type: 'integer',
        schema: { is_primary_key: true, has_auto_increment: true },
        meta: { hidden: true },
      },
      {
        field: 'projects_id', type: 'integer',
        schema: {},
        meta: { hidden: true },
      },
      {
        field: 'directus_files_id', type: 'uuid',
        schema: {},
        meta: { hidden: true },
      },
      {
        field: 'sort', type: 'integer',
        schema: {},
        meta: { hidden: true },
      },
    ],
  });
  console.log(`  + projects_files: ${r.ok ? 'ok' : 'FAIL ' + JSON.stringify(r.json?.errors ?? r.json)}`);
  await new Promise(r => setTimeout(r, 1000));
} else {
  console.log('  projects_files já existe');
}

// ── 3. Relações ───────────────────────────────────────────────────────────
console.log('[3] Criando relações...');

await ensureRelation({
  collection: 'projects_files',
  field: 'projects_id',
  related_collection: 'projects',
  meta: {
    many_collection: 'projects_files',
    many_field: 'projects_id',
    one_collection: 'projects',
    one_field: 'images',
    sort_field: 'sort',
    one_deselect_action: 'nullify',
  },
  schema: {
    table: 'projects_files',
    column: 'projects_id',
    foreign_key_table: 'projects',
    foreign_key_column: 'id',
    on_delete: 'CASCADE',
  },
});

await ensureRelation({
  collection: 'projects_files',
  field: 'directus_files_id',
  related_collection: 'directus_files',
  meta: {
    many_collection: 'projects_files',
    many_field: 'directus_files_id',
    one_collection: 'directus_files',
    one_field: null,
    junction_field: 'projects_id',
  },
  schema: {
    table: 'projects_files',
    column: 'directus_files_id',
    foreign_key_table: 'directus_files',
    foreign_key_column: 'id',
    on_delete: 'SET NULL',
  },
});

// ── 4. Campo alias images em projects ─────────────────────────────────────
console.log('[4] Campo images em projects...');

// Remover campo images criado anteriormente sem relação
const imgField = await api('GET', '/fields/projects/images');
if (imgField.ok) {
  const special = imgField.json?.data?.meta?.special ?? [];
  if (!special.includes('m2m') && !special.includes('files')) {
    console.log('  Campo images sem relação M2M — removendo para recriar...');
    const del = await api('DELETE', '/fields/projects/images');
    console.log(`  DELETE images: ${del.ok ? 'ok' : del.status}`);
    await new Promise(r => setTimeout(r, 500));
  }
}

await ensureField('projects', {
  field: 'images',
  type: 'alias',
  meta: {
    special: ['m2m'],
    interface: 'list-m2m',
    display: 'related-values',
    options: {
      fields: ['directus_files_id.$thumbnail'],
      enableCreate: false,
      enableSelect: true,
      limit: 5,
    },
    note: 'Imagens extras do projeto (máx. 5). A primeira aparece no carousel junto com cover_image.',
  },
  schema: null,
});

console.log('\nConcluído!');
