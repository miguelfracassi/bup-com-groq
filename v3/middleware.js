// Porteiro do site (Vercel Routing Middleware): enquanto não for a hora, quem abre uma página do Bup vai para /join.
// Em manutenção (settings.maint_on = 1), quem abre uma página vai para /manutencao.
// Quando launch_at chega (ou o admin libera), o site abre sozinho, sem novo deploy.
// Sem nada configurado no /admin, o site continua travado (modo pré-lançamento).
import { neon } from '@neondatabase/serverless';

// O matcher precisa ser uma lista literal (a Vercel lê estaticamente; não aceita spread nem variáveis).
export const config = {
  matcher: [
    '/', '/index', '/expressoes', '/como-funciona', '/faq',
    '/privacidade', '/termos', '/diretrizes-de-ia', '/conta', '/configuracoes', '/conversar',
    '/index.html', '/expressoes.html', '/como-funciona.html', '/faq.html', '/privacidade.html',
    '/termos.html', '/diretrizes-de-ia.html', '/conta.html', '/configuracoes.html', '/conversar.html',
  ],
};

const TTL = 10000; // consulta o banco no máximo a cada 10 s por instância
let cache = null, sql;
const state = async () => {
  if (cache && Date.now() - cache.at < TTL) return cache;
  const prev = cache || { openNow: false, ms: null, maint: false };
  let openNow = prev.openNow, ms = prev.ms, maint = prev.maint, bad = false;
  try {
    sql ||= neon(process.env.DATABASE_URL);
    const r = await sql`SELECT launch_at, open_now FROM launch WHERE id = 1`;
    openNow = !!(r[0] && r[0].open_now); ms = r[0] && r[0].launch_at ? new Date(r[0].launch_at).getTime() : null;
  } catch (e) {
    // banco fora do ar ou tabela ainda não criada: mantém o último estado conhecido (ou travado)
    bad = true;
  }
  try {
    const m = await sql`SELECT v FROM settings WHERE k = 'maint_on'`;
    maint = !!(m[0] && m[0].v === '1');
  } catch (e) {
    // tabela settings ainda não existe = sem manutenção; outro erro (banco fora) mantém o último estado
    if (/does not exist/i.test(String(e && e.message))) maint = false; else bad = true;
  }
  cache = { at: bad ? Date.now() - TTL + 3000 : Date.now(), openNow, ms, maint };
  return cache;
};

// HMAC-SHA256 em base64url (igual ao createHmac(...).digest('base64url') do Node)
const enc = new TextEncoder();
const hmac = async (secret, msg) => {
  const k = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  let b = ''; for (const x of new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(msg)))) b += String.fromCharCode(x);
  return btoa(b).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const same = (a, b) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; };
const cookie = (req, name) => { const m = (req.headers.get('cookie') || '').match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)')); return m ? m[1] : ''; };
const isAdmin = async (req) => { const v = cookie(req, 'bup_preview'); return !!(v && process.env.ADMIN_KEY && same(v, await hmac(process.env.ADMIN_KEY, 'bup-preview'))); };
// Cabeçalho x-bup-gate (aba Network do navegador) mostra o que o porteiro decidiu: locked | maintenance | preview | open
export default async function middleware(request) {
  const s = await state();
  const open = s.openNow || (s.ms !== null && Date.now() >= s.ms);
  const adm = (!open || s.maint) && (await isAdmin(request));
  if (!open && !adm) {
    return new Response(null, { status: 307, headers: { Location: new URL('/join', request.url).toString(), 'x-bup-gate': 'locked' } });
  }
  // site liberado, mas em manutenção (ligada no /developers-portal): todo mundo vai para /manutencao, menos quem está na prévia do admin
  if (open && s.maint && !adm) {
    return new Response(null, { status: 307, headers: { Location: new URL('/manutencao', request.url).toString(), 'x-bup-gate': 'maintenance' } });
  }
  return new Response(null, { headers: { 'x-middleware-next': '1', 'x-bup-gate': adm ? 'preview' : 'open' } }); // equivale a next()
}
