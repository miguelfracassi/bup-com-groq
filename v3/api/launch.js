// Público: GET -> { launch_at, open, now }. Usado pela /join para mostrar a contagem e entrar no site quando abrir.
const { status } = require('./_launch');
const settings = require('./_settings');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'method' });
  if (!process.env.DATABASE_URL) return res.status(200).json({ launch_at: null, open: false, loader: true, now: new Date().toISOString() });
  try {
    const s = await status();
    let loader = true; try { loader = await settings.loader(); } catch (e) {}
    return res.status(200).json({ launch_at: s.open ? null : s.launch_at, open: s.open, loader, now: s.now });
  } catch (e) {
    return res.status(200).json({ launch_at: null, open: false, loader: true, now: new Date().toISOString() });
  }
};
