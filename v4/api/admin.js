// Uma única função serverless para todo o admin (o plano Hobby da Vercel aceita no máximo 12 funções).
// Os endereços antigos continuam funcionando: /api/admin-launch, /api/admin-users etc. são reescritos
// para /api/admin?r=launch, /api/admin?r=users (veja vercel.json). A lógica de cada rota fica em api/_rotas/.
const rotas = {
  appeals: require('./_rotas/appeals'),
  launch: require('./_rotas/launch'),
  maintenance: require('./_rotas/maintenance'),
  preview: require('./_rotas/preview'),
  users: require('./_rotas/users'),
  waitlist: require('./_rotas/waitlist'),
};
module.exports = (req, res) => {
  const r = String((req.query && req.query.r) || '');
  const h = Object.prototype.hasOwnProperty.call(rotas, r) ? rotas[r] : null;
  if (!h) { res.setHeader('Cache-Control', 'no-store'); return res.status(404).json({ error: 'rota' }); }
  return h(req, res);
};
