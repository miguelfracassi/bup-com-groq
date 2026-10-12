// Configurações simples do site (tabela settings: chave/valor). Hoje: loader = tela de carregamento entre páginas.
const { sql } = require('./_lib');
let ready;
const init = () => (ready ||= sql`CREATE TABLE IF NOT EXISTS settings(k TEXT PRIMARY KEY, v TEXT)`.catch((e) => { ready = null; throw e; }));
const get = async (k, def) => { await init(); const r = await sql`SELECT v FROM settings WHERE k = ${k}`; return r[0] ? r[0].v : def; };
const set = async (k, v) => { await init(); await sql`INSERT INTO settings(k, v) VALUES (${k}, ${String(v)}) ON CONFLICT (k) DO UPDATE SET v = EXCLUDED.v`; };
const loader = async () => (await get('loader', '1')) !== '0'; // ligada por padrão
// Plano beta: open = resgate liberado na conta; slots = limite de vagas (0 = sem limite); used = quantas contas já têm beta
const beta = async () => {
  const [open, slots] = [await get('beta_open', '0'), await get('beta_slots', '0')];
  const [r] = await sql`SELECT COUNT(*)::int AS n FROM users WHERE beta = true`;
  return { open: open === '1', slots: parseInt(slots, 10) || 0, used: r ? r.n : 0 };
};
module.exports = { get, set, loader, beta };
