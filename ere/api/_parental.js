// Devolve até quando o Bup está bloqueado por algum responsável (ou null). Se a tabela ainda não existir, não bloqueia.
const { sql } = require('./_lib');
module.exports = async (userId) => {
  try {
    const [r] = await sql`SELECT MAX(blocked_until) AS until FROM parental_links WHERE user_id = ${userId} AND status = 'active' AND blocked_until > now()`;
    return r && r.until ? r.until : null;
  } catch (e) { return null; }
};
