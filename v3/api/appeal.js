// Apelação de quem foi banido (exige a sessão da própria pessoa).
// GET -> { name, email, appeal } | POST { name, email, phone } envia a apelação para a equipe (página /apelacoes).
const { sql, init, uid, body } = require('./_lib');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const id = uid(req);
  if (!id) return res.status(401).json({ error: 'login' });
  try {
    await init();
    const [u] = await sql`SELECT name, email, banned, banned_at, ban_reason, ban_msg FROM users WHERE id = ${id}`;
    if (!u) return res.status(401).json({ error: 'login' });
    if (!u.banned) return res.status(409).json({ error: 'Sua conta não está banida.' });
    const [ap] = await sql`SELECT status, created_at FROM appeals WHERE user_id = ${id} ORDER BY id DESC LIMIT 1`;
    const atual = ap && (!u.banned_at || new Date(ap.created_at) >= new Date(u.banned_at)) ? ap : null; // só vale a apelação feita depois do banimento atual
    if (req.method === 'GET') return res.status(200).json({ name: u.name, email: u.email, appeal: atual });
    if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
    if (atual) return res.status(409).json({ error: atual.status === 'pending' ? 'Você já enviou uma apelação. Aguarde a análise da equipe.' : 'Sua apelação já foi analisada pela equipe.' });
    const b = body(req);
    const name = String(b.name || '').trim().slice(0, 60), email = String(b.email || '').trim().toLowerCase().slice(0, 120), phone = String(b.phone || '').trim().slice(0, 30);
    if (name.length < 2) return res.status(400).json({ error: 'Informe seu nome.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'E-mail inválido.' });
    const dig = phone.replace(/\D/g, '');
    if (dig.length < 8 || dig.length > 15) return res.status(400).json({ error: 'Informe um telefone válido, com DDD.' });
    await sql`INSERT INTO appeals(user_id, name, email, phone, ban_reason, ban_msg) VALUES (${id}, ${name}, ${email}, ${phone}, ${u.ban_reason}, ${u.ban_msg})`;
    return res.status(200).json({ ok: true, appeal: { status: 'pending' } });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro no servidor. Tente de novo.' });
  }
};
