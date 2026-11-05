// Gestão de contas (exige x-admin-key). Nunca devolve a senha (só existe o hash, e ele não sai do banco).
// GET -> lista | POST {action: ban | unban | delete | set_password, id, password?}
const auth = require('../_admin');
const { sql, init, hash, body } = require('../_lib');
const settings = require('../_settings');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  if (!auth(req, res)) return;
  try {
    await init();
    if (req.method === 'GET') {
      const cid = parseInt(req.query && req.query.chat, 10);
      if (cid) {
        const [u] = await sql`SELECT id, name, email, banned FROM users WHERE id = ${cid}`;
        if (!u) return res.status(404).json({ error: 'Conta não encontrada.' });
        const msgs = await sql`SELECT role, content, mood, created_at FROM messages WHERE user_id = ${cid} ORDER BY id DESC LIMIT 400`;
        return res.status(200).json({ user: u, messages: msgs.reverse() });
      }
      const rows = await sql`SELECT u.id, u.name, u.email, u.banned, u.verified, u.beta, u.created_at, u.last_country, u.last_region, u.last_city, u.last_seen, (SELECT COUNT(*)::int FROM messages m WHERE m.user_id = u.id AND m.role = 'user') AS msgs FROM users u ORDER BY u.created_at DESC`;
      let loader = true; try { loader = await settings.loader(); } catch (e) {}
      const [pp] = await sql`SELECT COUNT(*)::int AS n FROM appeals WHERE status = 'pending'`;
      let beta = { open: false, slots: 0, used: 0 }; try { beta = await settings.beta(); } catch (e) {}
      return res.status(200).json({ rows, loader, beta, appeals: pp ? pp.n : 0 });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
    const b = body(req);
    if (b.action === 'set_loader') { await settings.set('loader', b.on ? '1' : '0'); return res.status(200).json({ ok: true, loader: !!b.on }); }
    if (b.action === 'set_beta') {
      const slots = Math.max(0, Math.min(100000, parseInt(b.slots, 10) || 0));
      await settings.set('beta_open', b.open ? '1' : '0'); await settings.set('beta_slots', slots);
      return res.status(200).json({ ok: true, beta: await settings.beta() });
    }
    const id = parseInt(b.id, 10);
    if (!id) return res.status(400).json({ error: 'id inválido' });
    let r;
    if (b.action === 'ban') r = await sql`UPDATE users SET banned = true, banned_at = now(), ban_reason = 'manual', ban_msg = NULL WHERE id = ${id} RETURNING id`;
    else if (b.action === 'unban') {
      r = await sql`UPDATE users SET banned = false, ban_reason = NULL, ban_msg = NULL WHERE id = ${id} RETURNING id`;
      if (r.length) { await sql`UPDATE pets SET mood = 'feliz', anger = 0 WHERE user_id = ${id}`; await sql`UPDATE appeals SET status = 'approved' WHERE user_id = ${id} AND status = 'pending'`; }
    }
    else if (b.action === 'verify' || b.action === 'unverify') r = await sql`UPDATE users SET verified = ${b.action === 'verify'} WHERE id = ${id} RETURNING id`;
    else if (b.action === 'grant_beta') r = await sql`UPDATE users SET beta = true, beta_at = COALESCE(beta_at, now()) WHERE id = ${id} RETURNING id`;
    else if (b.action === 'revoke_beta') r = await sql`UPDATE users SET beta = false, beta_at = NULL WHERE id = ${id} RETURNING id`;
    else if (b.action === 'delete') r = await sql`DELETE FROM users WHERE id = ${id} RETURNING id`;
    else if (b.action === 'set_password') {
      const pw = String(b.password || '');
      if (pw.length < 8 || pw.length > 100) return res.status(400).json({ error: 'A senha precisa ter entre 8 e 100 caracteres.' });
      r = await sql`UPDATE users SET pass = ${hash(pw)} WHERE id = ${id} RETURNING id`;
    } else return res.status(400).json({ error: 'Ação inválida.' });
    if (!r.length) return res.status(404).json({ error: 'Conta não encontrada (talvez já tenha sido excluída).' });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Erro ao acessar o banco.' });
  }
};
