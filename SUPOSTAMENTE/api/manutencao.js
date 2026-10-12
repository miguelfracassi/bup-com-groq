// Público.
//  GET            -> { on, bypass, dev, reason, popups[] }   (usado pelo site.js e pela página /manutencao)
//  GET ?img=ID    -> imagem do popup (cache longo; popups nunca são editados, só criados/removidos)
//  POST {phone}   -> guarda o telefone enviado na página de manutenção (só com a manutenção ligada)
const { sql, body } = require('./_lib');
const M = require('./_maintenance');
const tries = new Map();
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!process.env.DATABASE_URL) return res.status(200).json({ on: false, bypass: false, popups: [] });
  try {
    if (req.method === 'GET' && req.query && req.query.img) {
      await M.init();
      const id = parseInt(req.query.img, 10);
      const [r] = id ? await sql`SELECT image FROM popups WHERE id = ${id}` : [];
      const m = r && /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(r.image || '');
      if (!m) return res.status(404).end();
      res.setHeader('Content-Type', m[1]);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
      return res.status(200).send(Buffer.from(m[2], 'base64'));
    }
    if (req.method === 'GET') {
      const [s, p] = await Promise.all([M.state(), M.popups()]);
      return res.status(200).json({
        on: s.on, bypass: M.bypass(req),
        dev: s.on ? s.dev : '', reason: s.on ? s.reason : '', id: s.on ? s.id : '',
        popups: s.on ? [] : p.map((x) => ({ id: x.id, title: x.title || '', body: x.body || '', image: x.image || '', btn_label: x.btn_label || '', btn_url: x.btn_url || '' })),
      });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
    const b = body(req);
    if (b.site) return res.status(200).json({ ok: true }); // isca anti-robô
    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0] || 'x', now = Date.now();
    const t = (tries.get(ip) || []).filter((x) => now - x < 6e5);
    if (t.length >= 8) return res.status(429).json({ error: 'Muitas tentativas. Tente de novo em alguns minutos.' });
    tries.set(ip, [...t, now]);
    const ph = M.phone(b.phone);
    if (!ph) return res.status(400).json({ error: 'Telefone inválido. Use DDD + número.' });
    const s = await M.state();
    if (!s.on) return res.status(409).json({ error: 'O Bup já voltou! Pode entrar no site.' });
    await sql`INSERT INTO maint_phones(maint_id, phone) VALUES (${s.id}, ${ph}) ON CONFLICT (maint_id, phone) DO NOTHING`;
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Não deu pra salvar agora. Tente de novo.' });
  }
};
