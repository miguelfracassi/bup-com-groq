// POST = registra uma entrada no site (público, chamado pelo site.js) | GET = estatísticas para /dados (exige x-admin-key)
const os = require('os');
const { sql, init, body } = require('./_lib');
const adm = require('./_admin');
let ready;
const ensure = () => (ready ||= (async () => {
  await init();
  await sql`CREATE TABLE IF NOT EXISTS visits(id BIGSERIAL PRIMARY KEY, at TIMESTAMPTZ DEFAULT now(), path TEXT, sid TEXT, country TEXT, region TEXT, city TEXT)`;
  await sql`CREATE INDEX IF NOT EXISTS visits_at ON visits(at)`;
})().catch((e) => { ready = null; throw e; }));
const dec = (v) => { try { return decodeURIComponent(String(v || '')).slice(0, 60); } catch { return ''; } };
const safe = (p) => p.catch(() => []);

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method === 'POST') {
      const h = req.headers;
      if (!process.env.DATABASE_URL || /bot|crawl|spider|vercel|preview/i.test(h['user-agent'] || '')) return res.status(204).end();
      await ensure();
      const b = body(req);
      const path = String(b.path || '/').slice(0, 80), sid = String(b.sid || '').replace(/[^\w-]/g, '').slice(0, 40);
      await sql`INSERT INTO visits(path, sid, country, region, city) VALUES (${path}, ${sid}, ${dec(h['x-vercel-ip-country'])}, ${dec(h['x-vercel-ip-country-region'])}, ${dec(h['x-vercel-ip-city'])})`;
      return res.status(204).end();
    }
    if (req.method !== 'GET') return res.status(405).json({ error: 'method' });
    if (!adm(req, res)) return;
    await ensure();
    const t0 = Date.now();
    await sql`SELECT 1`;
    const db_ms = Date.now() - t0;
    const [tot, hours, days, countries, regions, cities, pages, users, signups, extra, msgs, dbs, tables] = await Promise.all([
      safe(sql`SELECT count(*)::int total, count(DISTINCT sid)::int uniq, count(*) FILTER (WHERE at > now() - interval '24 hours')::int d1, count(DISTINCT sid) FILTER (WHERE at > now() - interval '5 minutes')::int online FROM visits`),
      safe(sql`SELECT date_trunc('hour', at) h, count(*)::int n FROM visits WHERE at > now() - interval '25 hours' GROUP BY 1 ORDER BY 1`),
      safe(sql`SELECT to_char(at AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') d, count(*)::int n FROM visits WHERE at > now() - interval '15 days' GROUP BY 1 ORDER BY 1`),
      safe(sql`SELECT country k, count(*)::int n FROM visits WHERE country <> '' GROUP BY 1 ORDER BY 2 DESC LIMIT 10`),
      safe(sql`SELECT region k, country c, count(*)::int n FROM visits WHERE region <> '' GROUP BY 1, 2 ORDER BY 3 DESC LIMIT 10`),
      safe(sql`SELECT city k, country c, count(*)::int n FROM visits WHERE city <> '' GROUP BY 1, 2 ORDER BY 3 DESC LIMIT 10`),
      safe(sql`SELECT path k, count(*)::int n FROM visits GROUP BY 1 ORDER BY 2 DESC LIMIT 8`),
      safe(sql`SELECT count(*)::int total, count(*) FILTER (WHERE banned)::int banned, count(*) FILTER (WHERE verified)::int verified, count(*) FILTER (WHERE beta)::int beta FROM users`),
      safe(sql`SELECT to_char(created_at AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') d, count(*)::int n FROM users WHERE created_at > now() - interval '15 days' GROUP BY 1 ORDER BY 1`),
      safe(sql`SELECT (SELECT count(*) FROM waitlist)::int waitlist, (SELECT count(*) FROM appeals WHERE status = 'pending')::int appeals`),
      safe(sql`SELECT count(*)::int total, count(*) FILTER (WHERE created_at > now() - interval '24 hours')::int d1 FROM messages`),
      safe(sql`SELECT pg_database_size(current_database())::float8 s`),
      safe(sql`SELECT relname k, pg_total_relation_size(relid)::float8 s FROM pg_catalog.pg_statio_user_tables ORDER BY 2 DESC LIMIT 6`),
    ]);
    const m = process.memoryUsage();
    return res.status(200).json({
      at: Date.now(), tot: tot[0] || {}, hours, days, countries, regions, cities, pages,
      users: users[0] || {}, signups, extra: { ...(extra[0] || {}), msgs: msgs[0] || {} },
      disk: { db: (dbs[0] || {}).s || 0, limit: (+process.env.DB_LIMIT_MB || 512) * 1048576, tables },
      srv: { db_ms, rss: m.rss, heap: m.heapUsed, mem: os.totalmem(), cpus: os.cpus().length },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro ao ler os dados.' });
  }
};
