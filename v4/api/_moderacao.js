// Moderação do chat do Bup. Edite as listas abaixo para ajustar o que causa banimento.
// Tudo é comparado depois de tirar acentos/maiúsculas, juntar letras separadas ("p u t a") e reduzir letras repetidas ("putaaa").
const { sql } = require('./_lib');

const strip = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const clean = (s) => strip(s)
  .replace(/(^|[^a-z0-9])((?:[a-z][\s.\-_*]+){3,}[a-z])(?=$|[^a-z0-9])/g, (m, a, b) => a + b.replace(/[\s.\-_*]+/g, ''))
  .replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e').replace(/\$/g, 's').replace(/@/g, 'a')
  .replace(/([a-z])\1{2,}/g, '$1');

// Assuntos pornográficos ou sexuais
const SEXUAL = [
  'porn\\w*', 'sexo', 'sexual\\w*', 'sexys?', 'sex', 'transa(?:r|ndo|ram|mos|m)?', 'trepa(?:r|ndo|da|das)?',
  'punheta\\w*', 'masturb\\w*', 'siririca\\w*', 'boquete\\w*', 'bucet\\w*', 'xereca', 'xoxota', 'ppk', 'piroca\\w*',
  'penis', 'vagina', 'orgasm\\w*', 'tesao', 'nudes?', 'onlyfans', 'xvideos', 'xnxx', 'hentai', 'putaria', 'safadeza',
  'tarad[oa]s?', 'estupr\\w*', 'pedofil\\w*', 'bdsm', 'anal', 'prostitut\\w*', 'pau duro', '(?:tira|tirar|tire) (?:a |as |sua |suas )?roupas?',
];
// Xingamentos de verdade (apelidos de brincadeira como "chato", "bobo", "feio" NÃO entram aqui)
const XINGA = [
  'desgracad[oa]s?', 'vagabund[oa]s?', 'put[ao]s?', 'putinha', 'puta ?que ?(?:o )?pariu', 'pqp', 'fdp', 'filh[oa] ?d[ae] ?(?:uma )?put[ao]',
  'vsf', 'vtnc', 'vtmnc', 'tnc', 'vai (?:se )?(?:fod\\w*|tomar no cu|a merda)', 'cu', 'cuzao', 'cuzinho', 'caralh\\w*', 'krl', 'porr+a',
  'arrombad[oa]s?', 'viad[oa]s?', 'vadia\\w*', 'fod(?:a|as|er|e|eu|idos?)', 'foda-?se', 'fodase', 'crioul[oa]s?', 'retardad[oa]s?',
  'fuck\\w*', 'bitch', 'cunt', 'pussy', 'nigg\\w*', 'whore', 'slut',
];
const mk = (l) => new RegExp('\\b(?:' + l.join('|') + ')\\b');
const RS = mk(SEXUAL), RX = mk(XINGA);

// devolve { kind: 'sexual' | 'xingamento' } ou null
const scan = (text) => {
  const t = clean(text);
  if (!t.trim()) return null;
  if (RS.test(t)) return { kind: 'sexual' };
  if (RX.test(t)) return { kind: 'xingamento' };
  return null;
};

const SCOLD = {
  sexual: [
    'Ei! Assunto sexual ou pornográfico não é permitido aqui. Essa conversa vai ser encerrada.',
    'Opa, para por aí! Esse tipo de conversa é proibido no Bup. Vou ter que encerrar o chat.',
  ],
  xingamento: [
    'Ei! Eu avisei: xingamento de verdade não é permitido. Essa conversa vai ser encerrada.',
    'Chega! Palavrão pesado eu não aceito. Vou ter que encerrar o chat.',
  ],
};
const scold = (kind) => { const a = SCOLD[kind] || SCOLD.xingamento; return a[Math.random() * a.length | 0]; };

// Bane a conta e guarda a mensagem que causou o banimento (o chat inteiro continua salvo para a equipe revisar).
const ban = (id, kind, msg) => sql`UPDATE users SET banned = true, banned_at = now(), ban_reason = ${kind}, ban_msg = ${String(msg || '').slice(0, 300)} WHERE id = ${id}`;

module.exports = { scan, scold, ban };
