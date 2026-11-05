// Admin da lista de espera. Exige a variável ADMIN_KEY (Vercel) enviada no cabeçalho x-admin-key.
// GET -> lista inscrições | DELETE ?id=N -> remove uma inscrição
const c = require('crypto');
const { sql } = require('../_lib');
const fails = new Map();
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  if (!process.env.ADMIN_KEY || !process.env.DATABASE_URL) return res.status(500).json({ error: 'Configure ADMIN_KEY e DATABASE_URL na Vercel.' });
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0] || 'x', now = Date.now();
  const f = (fails.get(ip) || []).filter((x) => now - x < 6e5);
  if (f.length >= 6) return res.status(429).json({ error: 'Muitas tentativas. Aguarde alguns minutos.' });
  const a = Buffer.from(c.createHash('sha256').update(String(req.headers['x-admin-key'] || '')).digest('hex'));
  const b = Buffer.from(c.createHash('sha256').update(process.env.ADMIN_KEY).digest('hex'));
  if (!c.timingSafeEqual(a, b)) { fails.set(ip, [...f, now]); return res.status(401).json({ error: 'Chave incorreta.' }); }
  try {
    await sql`CREATE TABLE IF NOT EXISTS waitlist(id SERIAL PRIMARY KEY, name TEXT NOT NULL, phone TEXT UNIQUE NOT NULL, created_at TIMESTAMPTZ DEFAULT now())`;
    if (req.method === 'DELETE') {
      const id = parseInt(req.query && req.query.id, 10);
      if (!id) return res.status(400).json({ error: 'id inválido' });
      await sql`DELETE FROM waitlist WHERE id = ${id}`;
      return res.status(200).json({ ok: true });
    }
    if (req.method !== 'GET') return res.status(405).json({ error: 'method' });
    const rows = await sql`SELECT id, name, phone, created_at FROM waitlist ORDER BY created_at DESC`;
    return res.status(200).json({ rows });
  } catch (e) {
    return res.status(500).json({ error: 'Erro ao ler o banco.' });
  }
};
