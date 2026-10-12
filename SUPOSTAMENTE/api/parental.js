// GET = o Bup desta conta está bloqueado pelo responsável?
const { uid } = require('./_lib');
const blocked = require('./_parental');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const id = uid(req); if (!id) return res.status(401).json({ error: 'login' });
  const until = await blocked(id);
  return res.status(200).json({ blocked: !!until, until });
};
