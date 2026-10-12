// GET = quem sou eu | POST {action: signup | login | logout}
const { touch, sql, init, uid, setCookie, clear, hash, check, body } = require('./_lib');
const settings = require('./_settings');
const tries = new Map();
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!process.env.DATABASE_URL || !process.env.AUTH_SECRET) return res.status(500).json({ error: 'Configure DATABASE_URL e AUTH_SECRET na Vercel.' });
  try {
    await init();
    if (req.method === 'GET') {
      const id = uid(req); if (!id) return res.status(401).json({ error: 'off' });
      const [u] = await sql`SELECT u.id, u.name, u.email, u.banned, u.verified, u.beta, u.created_at, COALESCE(p.pats,0) AS pats, COALESCE(p.mood,'feliz') AS mood, (SELECT COUNT(*)::int FROM messages m WHERE m.user_id = u.id AND m.role = 'user') AS msgs FROM users u LEFT JOIN pets p ON p.user_id = u.id WHERE u.id = ${id}`;
      if (!u) { clear(res); return res.status(401).json({ error: 'off' }); }
      await touch(req, u.id);
      if (u.banned) return res.status(403).json({ error: 'banned', banned: true, user: { name: u.name, email: u.email } }); // mantém o cookie: a pessoa ainda precisa ver a tela de banimento e poder apelar
      setCookie(res, u.id); // renova a sessão: quem volta continua conectado
      // Oferta do plano beta: só aparece se o resgate estiver liberado na Gestão, ainda houver vagas e a pessoa ainda não tiver beta
      u.beta_offer = null;
      if (!u.beta) { try { const t = await settings.beta(); if (t.open && (!t.slots || t.used < t.slots)) u.beta_offer = { left: t.slots ? t.slots - t.used : null }; } catch (e) {} }
      return res.status(200).json({ user: u });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
    const b = body(req);
    if (b.action === 'logout') { clear(res); return res.status(200).json({ ok: true }); }
    if (b.action === 'redeem_beta') {
      const id = uid(req); if (!id) return res.status(401).json({ error: 'Sessão expirada. Entre de novo.' });
      const [me] = await sql`SELECT banned, beta FROM users WHERE id = ${id}`;
      if (!me) { clear(res); return res.status(401).json({ error: 'Sessão expirada.' }); }
      if (me.banned) return res.status(403).json({ error: 'Conta banida.' });
      if (me.beta) return res.status(200).json({ ok: true, already: true });
      const t = await settings.beta();
      if (!t.open) return res.status(409).json({ error: 'O plano beta não está disponível no momento.' });
      // a checagem de vagas e a concessão acontecem na mesma instrução, para duas pessoas não passarem da última vaga
      const r = await sql`UPDATE users SET beta = true, beta_at = now() WHERE id = ${id} AND beta = false AND (${t.slots} = 0 OR (SELECT COUNT(*) FROM users WHERE beta = true) < ${t.slots}) RETURNING id`;
      if (!r.length) return res.status(409).json({ error: 'As vagas do plano beta acabaram.' });
      return res.status(200).json({ ok: true });
    }

    if (['update_name', 'update_password', 'delete'].includes(b.action)) {
      const id = uid(req); if (!id) return res.status(401).json({ error: 'Sessão expirada. Entre de novo.' });
      const [u] = await sql`SELECT id, name, email, pass, banned FROM users WHERE id = ${id}`;
      if (!u) { clear(res); return res.status(401).json({ error: 'Sessão expirada.' }); }
      if (u.banned) { clear(res); return res.status(403).json({ error: 'Essa conta foi banida.' }); }
      const cur = String(b.password || '');
      if (b.action === 'update_name') {
        const name = String(b.name || '').trim().slice(0, 30);
        if (name.length < 2) return res.status(400).json({ error: 'O nome precisa ter pelo menos 2 letras.' });
        await sql`UPDATE users SET name = ${name} WHERE id = ${id}`;
        return res.status(200).json({ user: { id, name, email: u.email } });
      }
      let ok = false; try { ok = check(cur, u.pass); } catch { ok = false; }
      if (!ok) return res.status(403).json({ error: 'Senha atual incorreta.' });
      if (b.action === 'delete') { await sql`DELETE FROM users WHERE id = ${id}`; clear(res); return res.status(200).json({ ok: true }); }
      const np = String(b.newPassword || '');
      if (np.length < 8 || np.length > 100) return res.status(400).json({ error: 'A nova senha precisa ter entre 8 e 100 caracteres.' });
      await sql`UPDATE users SET pass = ${hash(np)} WHERE id = ${id}`;
      return res.status(200).json({ ok: true });
    }

    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0] || 'x', now = Date.now();
    const recent = (tries.get(ip) || []).filter((t) => now - t < 600000);
    if (recent.length >= 15) return res.status(429).json({ error: 'Muitas tentativas. Espere alguns minutos.' });
    recent.push(now); tries.set(ip, recent);

    const email = String(b.email || '').trim().toLowerCase().slice(0, 120), pass = String(b.password || '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'E-mail inválido.' });
    if (pass.length < 8 || pass.length > 100) return res.status(400).json({ error: 'A senha precisa ter entre 8 e 100 caracteres.' });

    if (b.action === 'signup') {
      const name = String(b.name || '').trim().slice(0, 30);
      if (name.length < 2) return res.status(400).json({ error: 'Diga seu nome pro Bup (mínimo 2 letras).' });
      const [dup] = await sql`SELECT 1 FROM users WHERE email = ${email}`;
      if (dup) return res.status(409).json({ error: 'Esse e-mail já tem conta. Tente entrar.' });
      const [u] = await sql`INSERT INTO users(name, email, pass) VALUES (${name}, ${email}, ${hash(pass)}) RETURNING id, name, email`;
      await sql`INSERT INTO pets(user_id) VALUES (${u.id})`;
      setCookie(res, u.id); await touch(req, u.id);
      return res.status(200).json({ user: u });
    }
    if (b.action === 'login') {
      // busca sem diferenciar maiúsculas (contas antigas) e aceita a senha com ou sem espaço sobrando no fim
      const [u] = await sql`SELECT id, name, email, pass, banned FROM users WHERE lower(trim(email)) = ${email} ORDER BY id LIMIT 1`;
      if (!u) return res.status(401).json({ error: 'Não achei nenhuma conta com esse e-mail. Confira o e-mail ou crie uma conta.' });
      const ok = [pass, pass.trim()].some((p) => { try { return check(p, u.pass); } catch { return false; } });
      if (!ok) return res.status(401).json({ error: 'Senha incorreta. Tente de novo.' });
      await touch(req, u.id);
      if (u.banned) { setCookie(res, u.id); return res.status(403).json({ error: 'Essa conta foi banida.', banned: true }); }
      setCookie(res, u.id);
      return res.status(200).json({ user: { id: u.id, name: u.name, email: u.email } });
    }
    return res.status(400).json({ error: 'ação inválida' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro no servidor. Tente de novo.' });
  }
};
