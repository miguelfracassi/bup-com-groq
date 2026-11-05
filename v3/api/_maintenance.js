// Modo manutenção + popups do site + telefones enviados durante a manutenção.
// Estado em `settings` (maint_on, maint_id, maint_dev, maint_reason, maint_since); popups em `popups`; envios em `maint_phones`.
const { sql } = require('./_lib');
const settings = require('./_settings');
let ready;
const init = () => (ready ||= (async () => {
  await sql`CREATE TABLE IF NOT EXISTS settings(k TEXT PRIMARY KEY, v TEXT)`;
  await sql`CREATE TABLE IF NOT EXISTS popups(id SERIAL PRIMARY KEY, title TEXT, body TEXT, image TEXT, btn_label TEXT, btn_url TEXT, created_at TIMESTAMPTZ DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS maint_phones(id SERIAL PRIMARY KEY, maint_id TEXT NOT NULL, phone TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now(), UNIQUE(maint_id, phone))`;
})().catch((e) => { ready = null; throw e; }));

const state = async () => {
  await init();
  const rows = await sql`SELECT k, v FROM settings WHERE k LIKE 'maint\\_%'`;
  const m = {}; for (const r of rows) m[r.k] = r.v;
  return { on: m.maint_on === '1', id: m.maint_id || '', dev: m.maint_dev || '', reason: m.maint_reason || '', since: m.maint_since || null };
};
const save = async (o) => { for (const [k, v] of Object.entries(o)) await settings.set('maint_' + k, v); };

// Imagem do popup: se foi enviada como arquivo (data:), vira /api/manutencao?img=ID; se é link https, vai direto.
const popups = async () => {
  await init();
  return sql`SELECT id, title, body, btn_label, btn_url, created_at,
    CASE WHEN image LIKE 'data:%' THEN '/api/manutencao?img=' || id WHEN image <> '' THEN image ELSE NULL END AS image
    FROM popups ORDER BY id DESC`;
};

// Cookie de prévia do admin (o mesmo do /admin): quem tem deixa de ser redirecionado para a manutenção.
const c = require('crypto');
const bypass = (req) => {
  const m = String(req.headers.cookie || '').match(/(?:^|;\s*)bup_preview=([^;]*)/);
  if (!m || !process.env.ADMIN_KEY) return false;
  const a = Buffer.from(m[1]), b = Buffer.from(c.createHmac('sha256', process.env.ADMIN_KEY).update('bup-preview').digest('base64url'));
  return a.length === b.length && c.timingSafeEqual(a, b);
};

// Telefone brasileiro (DDD + número) -> '55' + dígitos, ou null
const phone = (v) => {
  let d = String(v || '').replace(/\D/g, '');
  if (d.startsWith('55') && d.length > 11) d = d.slice(2);
  if (!(d.length === 10 || (d.length === 11 && d[2] === '9')) || d[0] === '0') return null;
  return '55' + d;
};
module.exports = { init, state, save, popups, bypass, phone };
