// Admin do /developers-portal (exige x-admin-key).
//  GET -> { maint, popups, phones }
//  POST {action}:
//    on {dev, reason}      liga a manutenção (se já estava ligada, só atualiza programador/motivo)
//    save {dev, reason}    atualiza programador/motivo com a manutenção ligada
//    off                   tira o site da manutenção
//    popup_add {title, body, image, btn_label, btn_url}   cria um popup (image = data:image/... ou link https)
//    popup_del {id} | phone_del {id}
const auth = require('../_admin');
const { sql, body } = require('../_lib');
const M = require('../_maintenance');
const clean = (v, n) => String(v == null ? '' : v).replace(/\r/g, '').trim().slice(0, n);
const full = async () => {
  const [maint, popups, phones] = await Promise.all([
    M.state(), M.popups(),
    sql`SELECT id, maint_id, phone, created_at FROM maint_phones ORDER BY created_at DESC LIMIT 2000`,
  ]);
  return { maint, popups, phones };
};
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  if (!auth(req, res)) return;
  try {
    await M.init();
    if (req.method === 'POST') {
      const b = body(req), a = b.action, bad = (m) => res.status(400).json({ error: m });
      if (a === 'on' || a === 'save') {
        const dev = clean(b.dev, 60), reason = clean(b.reason, 400);
        if (!dev) return bad('Informe o programador responsável.');
        if (!reason) return bad('Informe o motivo da manutenção.');
        const cur = await M.state();
        if (a === 'save' && !cur.on) return bad('O site não está em manutenção.');
        if (!cur.on) await M.save({ id: String(Date.now()), since: new Date().toISOString() });
        await M.save({ dev, reason });
        if (!cur.on) await M.save({ on: '1' });
      } else if (a === 'off') {
        await M.save({ on: '0' });
      } else if (a === 'popup_add') {
        const title = clean(b.title, 80), text = clean(b.body, 600), label = clean(b.btn_label, 40), url = clean(b.btn_url, 500);
        let img = String(b.image || '').trim();
        if (img && !(/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(img) && img.length <= 800000) && !/^https:\/\/[^\s]{3,480}$/i.test(img)) return bad('Imagem inválida. Envie um arquivo (até ~600 KB) ou um link https.');
        if (!title && !text && !img) return bad('O popup precisa de pelo menos título, texto ou imagem.');
        if ((label || url) && !(label && url)) return bad('Para o botão, preencha o texto e o link.');
        if (url && !/^(https?:\/\/[^\s]+|\/(?!\/)[^\s]*)$/i.test(url)) return bad('Link do botão inválido. Use https://... ou um caminho como /faq.');
        const [n] = await sql`SELECT COUNT(*)::int AS n FROM popups`;
        if (n && n.n >= 10) return bad('Limite de 10 popups. Remova algum antes de criar outro.');
        await sql`INSERT INTO popups(title, body, image, btn_label, btn_url) VALUES (${title}, ${text}, ${img}, ${label}, ${url})`;
      } else if (a === 'popup_del') {
        const id = parseInt(b.id, 10); if (!id) return bad('id inválido');
        await sql`DELETE FROM popups WHERE id = ${id}`;
      } else if (a === 'phone_del') {
        const id = parseInt(b.id, 10); if (!id) return bad('id inválido');
        await sql`DELETE FROM maint_phones WHERE id = ${id}`;
      } else return bad('Ação inválida.');
    } else if (req.method !== 'GET') return res.status(405).json({ error: 'method' });
    return res.status(200).json(await full());
  } catch (e) {
    return res.status(500).json({ error: 'Erro ao acessar o banco.' });
  }
};
