// Helpers compartilhados: banco Neon, senha (scrypt) e sessão por cookie assinado.
const { neon } = require('@neondatabase/serverless');
const c = require('crypto');
let db, ready;
const sql = (...a) => (db ||= neon(process.env.DATABASE_URL))(...a);
const init = () => (ready ||= (async () => {
  await sql`CREATE TABLE IF NOT EXISTS users(id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, pass TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now())`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS banned BOOLEAN NOT NULL DEFAULT false`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT false`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS beta BOOLEAN NOT NULL DEFAULT false`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS beta_at TIMESTAMPTZ`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_reason TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_msg TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_country TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_region TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_city TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ`;
  await sql`CREATE TABLE IF NOT EXISTS appeals(id SERIAL PRIMARY KEY, user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE, name TEXT, email TEXT, phone TEXT, status TEXT NOT NULL DEFAULT 'pending', ban_reason TEXT, ban_msg TEXT, created_at TIMESTAMPTZ DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS pets(user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, mood TEXT DEFAULT 'feliz', pats INT DEFAULT 0, anger INT DEFAULT 0)`;
  await sql`CREATE TABLE IF NOT EXISTS messages(id BIGSERIAL PRIMARY KEY, user_id INT REFERENCES users(id) ON DELETE CASCADE, role TEXT, content TEXT, mood TEXT, created_at TIMESTAMPTZ DEFAULT now())`;
})().catch((e) => { ready = null; throw e; }));
const sign = (v) => c.createHmac('sha256', process.env.AUTH_SECRET || '').update(v).digest('base64url');
const DAYS = 180;
const setCookie = (res, id) => {
  const v = id + '.' + (Date.now() + DAYS * 864e5);
  res.setHeader('Set-Cookie', `bup_session=${v}.${sign(v)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${DAYS * 86400}${process.env.VERCEL ? '; Secure' : ''}`);
};
const clear = (res) => res.setHeader('Set-Cookie', 'bup_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0');
const uid = (req) => {
  const m = (req.headers.cookie || '').match(/bup_session=(\d+)\.(\d+)\.([\w-]+)/);
  if (!m || !process.env.AUTH_SECRET) return null;
  const a = Buffer.from(sign(m[1] + '.' + m[2])), b = Buffer.from(m[3]);
  return a.length === b.length && c.timingSafeEqual(a, b) && +m[2] > Date.now() ? +m[1] : null;
};
const hash = (p) => { const s = c.randomBytes(16).toString('hex'); return s + ':' + c.scryptSync(p, s, 64).toString('hex'); };
const check = (p, h) => { const [s, k] = String(h).split(':'); return c.timingSafeEqual(c.scryptSync(p, s, 64), Buffer.from(k, 'hex')); };
const body = (req) => { let b = req.body; try { if (typeof b === 'string') b = JSON.parse(b || '{}'); } catch { b = {}; } return b || {}; };
// Guarda o local aproximado (país, estado, cidade vindos dos cabeçalhos da Vercel) da conta, no máximo a cada 10 min.
const dec = (v) => { try { return decodeURIComponent(String(v || '')).slice(0, 60); } catch { return ''; } };
const touch = (req, id) => {
  const h = req.headers, c = dec(h['x-vercel-ip-country']), r = dec(h['x-vercel-ip-country-region']), t = dec(h['x-vercel-ip-city']);
  if (!c && !r && !t) return Promise.resolve();
  return sql`UPDATE users SET last_country = ${c}, last_region = ${r}, last_city = ${t}, last_seen = now() WHERE id = ${id} AND (last_seen IS NULL OR last_seen < now() - interval '10 minutes')`.catch(() => {});
};
module.exports = { touch, sql, init, uid, setCookie, clear, hash, check, body };
