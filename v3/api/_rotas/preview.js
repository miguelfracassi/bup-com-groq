// Admin: POST -> cookie que deixa o admin ver o site mesmo travado (sem cair na /join) | DELETE -> remove o cookie.
const c = require('crypto');
const auth = require('../_admin');
module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!auth(req, res)) return;
  const sec = process.env.VERCEL ? '; Secure' : '';
  if (req.method === 'POST') {
    const v = c.createHmac('sha256', process.env.ADMIN_KEY).update('bup-preview').digest('base64url');
    res.setHeader('Set-Cookie', `bup_preview=${v}; HttpOnly; Path=/; SameSite=Lax; Max-Age=7200${sec}`);
    return res.status(200).json({ ok: true });
  }
  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', `bup_preview=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${sec}`);
    return res.status(200).json({ ok: true });
  }
  return res.status(405).json({ error: 'method' });
};
