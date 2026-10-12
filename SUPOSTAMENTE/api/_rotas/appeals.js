// Apelações (exige x-admin-key). GET -> lista | GET ?id=N -> detalhe com o chat | POST {action: unban | discard, id}
const auth = require('../_admin');
const { sql, init, body } = require('../_lib');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  if (!auth(req, res)) return;
  try {
    await init();
    if (req.method === 'GET') {
      const id = parseInt(req.query && req.query.id, 10);
      if (!id) {
        const rows = await sql`SELECT a.id, a.status, a.created_at, a.name, a.email, a.phone, a.ban_reason, u.id AS user_id, u.name AS acc_name, u.email AS acc_email, u.banned
          FROM appeals a JOIN users u ON u.id = a.user_id ORDER BY (a.status = 'pending') DESC, a.created_at DESC LIMIT 300`;
        return res.status(200).json({ rows });
      }
      const [a] = await sql`SELECT a.id, a.status, a.created_at, a.name, a.email, a.phone, a.ban_reason, a.ban_msg, u.id AS user_id, u.name AS acc_name, u.email AS acc_email, u.banned, u.banned_at, u.created_at AS acc_created
        FROM appeals a JOIN users u ON u.id = a.user_id WHERE a.id = ${id}`;
      if (!a) return res.status(404).json({ error: 'Apelação não encontrada.' });
      const msgs = await sql`SELECT role, content, mood, created_at FROM messages WHERE user_id = ${a.user_id} ORDER BY id DESC LIMIT 400`;
      return res.status(200).json({ appeal: a, messages: msgs.reverse() });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
    const b = body(req), id = parseInt(b.id, 10);
    if (!id) return res.status(400).json({ error: 'id inválido' });
    const [a] = await sql`SELECT id, user_id FROM appeals WHERE id = ${id}`;
    if (!a) return res.status(404).json({ error: 'Apelação não encontrada.' });
    if (b.action === 'unban') {
      await sql`UPDATE users SET banned = false, ban_reason = NULL, ban_msg = NULL WHERE id = ${a.user_id}`;
      await sql`UPDATE pets SET mood = 'feliz', anger = 0 WHERE user_id = ${a.user_id}`;
      await sql`UPDATE appeals SET status = 'approved' WHERE id = ${id}`;
    } else if (b.action === 'discard') await sql`UPDATE appeals SET status = 'discarded' WHERE id = ${id}`;
    else return res.status(400).json({ error: 'Ação inválida.' });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro ao acessar o banco.' });
  }
};
