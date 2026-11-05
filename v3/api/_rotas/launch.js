// Admin do lançamento (exige x-admin-key). GET -> estado | POST {action}:
//  schedule {at: ISO} agenda a abertura automática | open_now libera já | lock trava e apaga a data
const auth = require('../_admin');
const { body } = require('../_lib');
const { status, save } = require('../_launch');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  if (!auth(req, res)) return;
  try {
    if (req.method === 'POST') {
      const b = body(req), a = b.action;
      // travar/agendar encerra a prévia do admin (cookie bup_preview), senão o admin continuaria vendo o site aberto
      const endPreview = () => res.setHeader('Set-Cookie', `bup_preview=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${process.env.VERCEL ? '; Secure' : ''}`);
      if (a === 'schedule') {
        const d = new Date(b.at);
        if (isNaN(d)) return res.status(400).json({ error: 'Data ou hora inválida.' });
        if (d.getTime() <= Date.now() + 5e3) return res.status(400).json({ error: 'Escolha uma data e hora no futuro (ou use "Liberar agora").' });
        if (d.getFullYear() > 2100) return res.status(400).json({ error: 'Data longe demais.' });
        await save(d.toISOString(), false); endPreview();
      } else if (a === 'open_now') await save(null, true);
      else if (a === 'lock') { await save(null, false); endPreview(); }
      else return res.status(400).json({ error: 'Ação inválida.' });
    } else if (req.method !== 'GET') return res.status(405).json({ error: 'method' });
    return res.status(200).json(await status());
  } catch (e) {
    return res.status(500).json({ error: 'Erro ao acessar o banco.' });
  }
};
