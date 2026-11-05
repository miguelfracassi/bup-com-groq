// POST {name, phone} -> guarda na lista de espera "Me avise quando inaugurar".
const { sql, body } = require('./_lib');
const tries = new Map();
let ready;
const init = () => (ready ||= sql`CREATE TABLE IF NOT EXISTS waitlist(id SERIAL PRIMARY KEY, name TEXT NOT NULL, phone TEXT UNIQUE NOT NULL, created_at TIMESTAMPTZ DEFAULT now())`.catch((e) => { ready = null; throw e; }));
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  if (!process.env.DATABASE_URL) return res.status(500).json({ error: 'Configure DATABASE_URL na Vercel.' });
  const b = body(req);
  if (b.site) return res.status(200).json({ ok: true }); // isca anti-robô
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0] || 'x', now = Date.now();
  const t = (tries.get(ip) || []).filter((x) => now - x < 6e5);
  if (t.length >= 8) return res.status(429).json({ error: 'Muitas tentativas. Tente de novo em alguns minutos.' });
  tries.set(ip, [...t, now]);
  const name = String(b.name || '').trim().split(/\s+/)[0].slice(0, 30);
  if (name.length < 2) return res.status(400).json({ error: 'Digite seu primeiro nome.' });
  let d = String(b.phone || '').replace(/\D/g, '');
  if (d.startsWith('55') && d.length > 11) d = d.slice(2);
  if (!(d.length === 10 || (d.length === 11 && d[2] === '9')) || d[0] === '0') return res.status(400).json({ error: 'Telefone inválido. Use DDD + número.' });
  try {
    await init();
    await sql`INSERT INTO waitlist(name, phone) VALUES (${name}, ${'55' + d}) ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name`;
    return res.status(200).json({ ok: true, name });
  } catch (e) {
    return res.status(500).json({ error: 'Não deu pra salvar agora. Tente de novo.' });
  }
};
