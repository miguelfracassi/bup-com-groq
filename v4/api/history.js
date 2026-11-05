// GET = conversa + estado do Bup | POST = salva mensagens/estado | DELETE = limpa a conversa
const { sql, init, uid, body } = require('./_lib');
const MOODS = ['feliz', 'bravo', 'dormindo', 'triste', 'amando', 'surpreso', 'rindo', 'pensando', 'six'];
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const id = uid(req);
  if (!id) return res.status(401).json({ error: 'login' });
  try {
    await init();
    const [bu] = await sql`SELECT banned FROM users WHERE id = ${id}`;
    if (!bu || bu.banned) return res.status(403).json({ error: 'banido' });
    const pb = await require('./_parental')(id); if (pb) return res.status(423).json({ error: 'parental', until: pb });
    if (req.method === 'GET') {
      const rows = await sql`SELECT role, content, mood FROM messages WHERE user_id = ${id} ORDER BY id DESC LIMIT 40`;
      const [pet] = await sql`SELECT mood, pats, anger FROM pets WHERE user_id = ${id}`;
      return res.status(200).json({ messages: rows.reverse(), pet: pet || {} });
    }
    if (req.method === 'DELETE') {
      await sql`DELETE FROM messages WHERE user_id = ${id}`;
      await sql`UPDATE pets SET mood = 'feliz', anger = 0 WHERE user_id = ${id}`;
      return res.status(200).json({ ok: true });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
    const b = body(req);
    const mood = ['feliz', 'bravo', 'dormindo'].includes(b.mood) ? b.mood : 'feliz';
    const num = (n) => Math.max(0, Math.min(1e6, parseInt(n) || 0));
    await sql`INSERT INTO pets(user_id, mood, pats, anger) VALUES (${id}, ${mood}, ${num(b.pats)}, ${num(b.anger)})
              ON CONFLICT (user_id) DO UPDATE SET mood = EXCLUDED.mood, pats = EXCLUDED.pats, anger = EXCLUDED.anger`;
    for (const m of (Array.isArray(b.msgs) ? b.msgs : []).slice(0, 10)) {
      const role = m && m.role === 'assistant' ? 'assistant' : 'user';
      await sql`INSERT INTO messages(user_id, role, content, mood) VALUES (${id}, ${role}, ${String(m.content || '').slice(0, 300)}, ${MOODS.includes(m.mood) ? m.mood : null})`;
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'erro' });
  }
};
