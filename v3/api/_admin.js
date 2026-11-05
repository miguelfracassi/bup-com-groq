// Autenticação do admin: compara o cabeçalho x-admin-key com ADMIN_KEY (Vercel), com limite de tentativas.
const c = require('crypto');
const fails = new Map();
module.exports = (req, res) => {
  if (!process.env.ADMIN_KEY || !process.env.DATABASE_URL) { res.status(500).json({ error: 'Configure ADMIN_KEY e DATABASE_URL na Vercel.' }); return false; }
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0] || 'x', now = Date.now();
  const f = (fails.get(ip) || []).filter((x) => now - x < 6e5);
  if (f.length >= 6) { res.status(429).json({ error: 'Muitas tentativas. Aguarde alguns minutos.' }); return false; }
  const a = Buffer.from(c.createHash('sha256').update(String(req.headers['x-admin-key'] || '')).digest('hex'));
  const b = Buffer.from(c.createHash('sha256').update(process.env.ADMIN_KEY).digest('hex'));
  if (!c.timingSafeEqual(a, b)) { fails.set(ip, [...f, now]); res.status(401).json({ error: 'Chave incorreta.' }); return false; }
  return true;
};
