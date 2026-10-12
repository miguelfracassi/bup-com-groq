// Estado do lançamento (tabela launch, linha única id=1).
// launch_at = data/hora em que o site abre sozinho | open_now = liberado manualmente.
const { sql } = require('./_lib');
let ready;
const init = () => (ready ||= sql`CREATE TABLE IF NOT EXISTS launch(id INT PRIMARY KEY, launch_at TIMESTAMPTZ, open_now BOOLEAN NOT NULL DEFAULT false)`.catch((e) => { ready = null; throw e; }));
const status = async () => {
  await init();
  const r = await sql`SELECT launch_at, open_now, now() AS now FROM launch WHERE id = 1`;
  const row = r[0] || {}, now = r[0] ? new Date(row.now) : new Date((await sql`SELECT now() AS now`)[0].now);
  const at = row.launch_at ? new Date(row.launch_at) : null;
  return { launch_at: at ? at.toISOString() : null, open_now: !!row.open_now, open: !!row.open_now || (!!at && at <= now), now: now.toISOString() };
};
const save = async (at, openNow) => {
  await init();
  await sql`INSERT INTO launch(id, launch_at, open_now) VALUES (1, ${at}, ${openNow}) ON CONFLICT (id) DO UPDATE SET launch_at = EXCLUDED.launch_at, open_now = EXCLUDED.open_now`;
};
module.exports = { status, save };
