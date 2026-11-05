(()=>{
/* Tela de carregamento entre páginas (Bup olhando pro lado + From Ticord) */
const SVG=`<svg viewBox="-10 -10 140 140" aria-hidden="true"><defs><radialGradient id="ldg" cx=".35" cy=".3"><stop offset="0" stop-color="#ffe066"/><stop offset="1" stop-color="#ffa62b"/></radialGradient></defs><circle cx="60" cy="60" r="58" fill="#fff"/><circle cx="60" cy="60" r="52" fill="url(#ldg)"/><g class="lp"><circle cx="50" cy="56" r="10" fill="#fff" stroke="#3a2a1a" stroke-width="3"/><circle cx="86" cy="56" r="10" fill="#fff" stroke="#3a2a1a" stroke-width="3"/><circle cx="54" cy="56" r="5" fill="#3a2a1a"/><circle cx="90" cy="56" r="5" fill="#3a2a1a"/><path d="M60 82q12 6 26-2" fill="none" stroke="#3a2a1a" stroke-width="5" stroke-linecap="round"/></g></svg>`;
let el=null,go=0;
const on=()=>{try{return localStorage.getItem('bup_ldr')!=='0'}catch(e){return true}};
try{const t=+localStorage.getItem('bup_ldr_t')||0;if(Date.now()-t>6e4){localStorage.setItem('bup_ldr_t',Date.now());fetch('/api/launch',{cache:'no-store'}).then(r=>r.json()).then(d=>{if(d&&typeof d.loader==='boolean')localStorage.setItem('bup_ldr',d.loader?'1':'0')}).catch(()=>{})}}catch(e){}
const make=()=>{if(el)return el;el=document.createElement('div');el.className='ldr';el.setAttribute('aria-hidden','true');
 el.innerHTML=`<div class="lb">${SVG}</div><div class="lf"><span>From</span><img src="/assets/ticord-preto.png" alt="Ticord Grupo"></div>`;document.body.appendChild(el);return el};
const hide=()=>{if(!el)return;el.classList.remove('now');el.classList.add('out');el.classList.remove('on')};
/* chegou numa página vinda de um clique: mostra já e some rapidinho */
try{if(sessionStorage.getItem('bup_ld')){sessionStorage.removeItem('bup_ld');if(!on())throw 0;const e=make();e.classList.add('on','now');requestAnimationFrame(()=>setTimeout(hide,260))}}catch(e){}
/* clique num link interno: mostra o carregamento e navega logo em seguida */
document.addEventListener('click',ev=>{
 if(!on()||ev.defaultPrevented||ev.button||ev.metaKey||ev.ctrlKey||ev.shiftKey||ev.altKey)return;
 const a=ev.target.closest&&ev.target.closest('a[href]');if(!a||a.target&&a.target!=='_self'||a.hasAttribute('download'))return;
 let u;try{u=new URL(a.href,location.href)}catch(e){return}
 if(u.origin!==location.origin||!/^https?:$/.test(u.protocol))return;
 if(u.pathname===location.pathname&&u.search===location.search)return; /* âncora ou mesma página */
 if(go)return;ev.preventDefault();go=1;
 try{sessionStorage.setItem('bup_ld','1')}catch(e){}
 const e=make();e.classList.remove('out');e.classList.add('on');
 setTimeout(()=>{location.href=u.href},420);
});
/* voltar pelo botão do navegador (cache) não pode ficar preso no carregamento */
addEventListener('pageshow',e=>{if(e.persisted){go=0;hide()}});
})();
(()=>{
const J=/^\/join\/?(\.html)?$/.test(location.pathname),L=J?[]:[['/','Início'],['/expressoes','Expressões'],['/como-funciona','Como funciona'],['/faq','Dúvidas']],p=location.pathname.replace(/\.html$/,'').replace(/(.)\/$/,'$1');
const FACE=`<svg viewBox="-10 -10 140 140" aria-hidden="true"><defs><radialGradient id="nbg" cx=".35" cy=".3"><stop offset="0" style="stop-color:var(--c1)"/><stop offset="1" style="stop-color:var(--c2)"/></radialGradient><path id="nh" d="M10 18C2 12 0 8 0 5a5 5 0 0 1 10-2 5 5 0 0 1 10 2c0 3-2 7-10 13z" fill="#e5195f"/></defs><circle cx="60" cy="60" r="58" fill="#fff"/><circle cx="60" cy="60" r="52" fill="url(#nbg)"/><g fill="none" stroke="#3a2a1a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><g class="nx feliz"><path d="M34 54q7-10 15 0M71 54q7-10 15 0M38 72q22 20 44 0"/></g>
<g class="nx bravo"><path d="M30 42l22 9M90 42l-22 9M42 90q18-16 36 0"/><circle cx="42" cy="62" r="4.5" fill="#3a2a1a" stroke="none"/><circle cx="78" cy="62" r="4.5" fill="#3a2a1a" stroke="none"/><path d="M92 22q6 0 6-6M104 22q-6 0-6-6M92 10q6 0 6 6M104 10q-6 0-6 6" stroke="#d32f2f" stroke-width="3"/></g>
<g class="nx dormindo"><path d="M32 58q8 7 16 0M72 58q8 7 16 0M52 80q8 5 16 0"/><path class="z" d="M94 30h9l-9 11h9" stroke-width="3"/><path class="z z2" d="M104 14h7l-7 9h7" stroke-width="2.5"/></g>
<g class="nx triste"><path d="M31 52l22-8M89 52l-22-8M44 88q16-13 32 0"/><circle cx="42" cy="62" r="4.5" fill="#3a2a1a" stroke="none"/><circle cx="78" cy="62" r="4.5" fill="#3a2a1a" stroke="none"/><path class="tear" d="M84 68q6 9 0 13q-6-4 0-13z" fill="#7fb4ff" stroke="none"/></g>
<g class="nx amando"><use href="#nh" x="31" y="44"/><use href="#nh" x="69" y="44"/><path d="M44 76q16 16 32 0"/><g fill="#ff7ab8" stroke="none" opacity=".6"><ellipse cx="26" cy="74" rx="7" ry="4"/><ellipse cx="94" cy="74" rx="7" ry="4"/></g></g>
<g class="nx surpreso"><circle cx="42" cy="56" r="8" fill="#fff" stroke-width="3"/><circle cx="78" cy="56" r="8" fill="#fff" stroke-width="3"/><circle cx="42" cy="56" r="3.5" fill="#3a2a1a" stroke="none"/><circle cx="78" cy="56" r="3.5" fill="#3a2a1a" stroke="none"/><path d="M32 38q10-6 20 0M68 38q10-6 20 0"/><ellipse cx="60" cy="88" rx="6" ry="8" fill="#3a2a1a"/></g>
<g class="nx rindo"><path d="M34 48l14 6-14 6M86 48l-14 6 14 6"/><path d="M36 70q24 2 48 0q-3 26-24 26t-24-26z" fill="#3a2a1a"/><path d="M48 90q12-9 24 0q-12 7-24 0z" fill="#ff7a8a" stroke="none"/></g>
<g class="nx pensando"><path d="M31 46h20M69 38q10-6 20 0M46 86q10-5 26-2"/><circle cx="44" cy="54" r="4.5" fill="#3a2a1a" stroke="none"/><circle cx="80" cy="50" r="4.5" fill="#3a2a1a" stroke="none"/><g fill="#fff" stroke-width="2.5"><circle cx="98" cy="20" r="3"/><circle cx="107" cy="9" r="4.5"/><circle cx="118" cy="-3" r="6.5"/></g></g>
</g></svg>`;
const MO=['feliz','amando','rindo','surpreso','pensando','triste','bravo','dormindo'];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let cached=null;try{cached=JSON.parse(localStorage.getItem('bup_u')||'null')}catch(e){}
const VF='<svg class="vf" viewBox="0 0 24 24" role="img" aria-label="Verificado"><title>Verificado</title><path fill="#1d9bf0" d="M12 1l2.6 2 3.2-.2 1 3.1 2.7 1.8-.9 3.1.9 3.1-2.7 1.8-1 3.1-3.2-.2L12 23l-2.6-2-3.2.2-1-3.1L2.5 16.3l.9-3.1-.9-3.1 2.7-1.8 1-3.1 3.2.2z"/><path d="M7.5 12.3l3 3 6-6.3" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const badges=u=>(u&&u.verified?VF:'')+(u&&u.beta?'<i class="bb">BETA</i>':'');window.bupBadges=badges;
const userHtml=u=>J?'':u?`<div class="um"><button class="ub" type="button" aria-haspopup="true" aria-expanded="false"><b>${esc(u.name[0]||'?').toUpperCase()}</b><span>${esc(u.name.split(' ')[0])}</span>${badges(u)}</button><div class="dd" hidden><a href="/conta">Minha conta</a><a href="/configuracoes">Configurações</a><a href="/conversar">Conversar com o Bup</a><button type="button" id="sair">Sair</button></div></div>`:`<a class="btn sm" href="/conversar">Entrar</a>`;
const n=document.getElementById('nav');
if(n){n.outerHTML=`<header class="nav"><div class="nin"><a class="brand" href="/" aria-label="Bup, início"><span class="nbf" data-m="feliz">${FACE}</span><span class="logo">BUP</span></a><nav id="mn" aria-label="Principal">${L.map(([h,t])=>`<a href="${h}"${p===h?' aria-current="page"':''}>${t}</a>`).join('')}</nav><div class="nr" id="nr">${userHtml(cached)}</div><button class="burger" type="button" aria-label="Abrir menu" aria-expanded="false"><i></i><i></i></button></div></header>`;
 const f=document.querySelector('.nbf'),xs=[...f.querySelectorAll('.nx')];let i=0;
 const go=m=>{f.dataset.m=m;xs.forEach(g=>g.classList.toggle('on',g.classList.contains(m)))};go('feliz');
 if(!matchMedia('(prefers-reduced-motion:reduce)').matches)setInterval(()=>go(MO[++i%MO.length]),1900);
 const bg=document.querySelector('.burger'),mn=document.getElementById('mn');
 bg.onclick=()=>{const o=mn.classList.toggle('open');bg.setAttribute('aria-expanded',o)};
 const wire=()=>{const b=document.querySelector('.ub'),d=document.querySelector('.dd');if(!b)return;
  b.onclick=e=>{e.stopPropagation();d.hidden=!d.hidden;b.setAttribute('aria-expanded',!d.hidden)};
  document.getElementById('sair').onclick=async()=>{await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'logout'})});try{localStorage.removeItem('bup_u')}catch(e){}location.href='/'}};
 document.addEventListener('click',()=>{const d=document.querySelector('.dd');if(d)d.hidden=true});
 wire();
 window.bupUser=J?Promise.resolve(null):fetch('/api/auth',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(d=>{const u=d&&d.user||null;
  try{u?localStorage.setItem('bup_u',JSON.stringify({name:u.name,verified:!!u.verified,beta:!!u.beta})):localStorage.removeItem('bup_u')}catch(e){}
  document.getElementById('nr').innerHTML=userHtml(u);wire();document.documentElement.classList.toggle('logged',!!u);return u}).catch(()=>null);
}else window.bupUser=Promise.resolve(null);
const f=document.getElementById('foot');if(f&&J)f.outerHTML=`<footer class="lock"><div class="copy">© 2026 Todos os direitos reservados.</div></footer>`;else if(f)f.outerHTML=`<footer><div class="fin"><div><a href="https://ticord.website" target="_blank" rel="noopener"><img src="/assets/ticord.png" alt="Ticord Grupo"></a><p>Bots, sites e automações. Grupo Ticord.</p></div>
<div><h4>Bup</h4>${L.map(([h,t])=>`<a href="${h}">${t}</a>`).join('')}<a href="/conversar">Conversar com o Bup</a></div>
<div><h4>Conta</h4><a href="/conta">Minha conta</a><a href="/configuracoes">Configurações</a><a href="/termos">Termos de Serviço</a><a href="/diretrizes-de-ia">Diretrizes de IA</a><a href="/privacidade">Política de Privacidade</a></div>
<div><h4>Contato</h4><a href="https://ticord.website" target="_blank" rel="noopener">ticord.website</a><a href="tel:+5519999894031">(19) 99989-4031</a><a href="mailto:helpticord@gmail.com">helpticord@gmail.com</a></div></div><div class="copy">© 2026 Todos os direitos reservados. Bup é um projeto do Grupo Ticord.</div></footer>`;
})();

/* Conta a entrada no painel /dados (país e estado vêm dos cabeçalhos da Vercel, no servidor) */
(()=>{try{
 if(/^\/(admin|gestao|apelacoes|apela|dados|developers-portal|manutencao)/i.test(location.pathname))return;
 let s=sessionStorage.getItem('bup_sid');if(!s){s=Math.random().toString(36).slice(2)+Date.now().toString(36);sessionStorage.setItem('bup_sid',s)}
 fetch('/api/visit',{method:'POST',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify({path:location.pathname,sid:s})}).catch(()=>{});
}catch(e){}})();

/* Manutenção e popups (ligados no /developers-portal): com o site em manutenção a pessoa vai para /manutencao; senão aparecem os popups, um por vez */
(()=>{try{
 const P=location.pathname;
 if(/^\/(admin|gestao|apelacoes|apela|dados|developers-portal|manutencao|administracao)/i.test(P))return;
 const J=/^\/join\/?(\.html)?$/.test(P);
 const seen=()=>{try{return JSON.parse(sessionStorage.getItem('bup_pp')||'[]')}catch(e){return[]}};
 const mark=id=>{try{sessionStorage.setItem('bup_pp',JSON.stringify(seen().concat(id)))}catch(e){}};
 const okUrl=u=>/^(https?:\/\/|\/(?!\/))/i.test(u||'');
 const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};
 const show=q=>{const p=q.shift();if(!p)return;mark(p.id);
  const ov=el('div','pp'),card=el('div','ppc');ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');
  const x=el('button','ppx','\u2715');x.type='button';x.setAttribute('aria-label','Fechar');card.appendChild(x);
  if(p.image){const im=el('img');im.src=p.image;im.alt='';im.decoding='async';card.appendChild(im)}
  const b=el('div','ppb');if(p.title){const h=el('h3','',p.title);h.id='pp'+p.id;b.appendChild(h);ov.setAttribute('aria-labelledby',h.id)}
  if(p.body)b.appendChild(el('p','',p.body));
  if(p.btn_label&&okUrl(p.btn_url)){const a=el('a','btn',p.btn_label);a.href=p.btn_url;if(/^https?:/i.test(p.btn_url)&&new URL(p.btn_url).origin!==location.origin){a.target='_blank';a.rel='noopener'}b.appendChild(a)}
  card.appendChild(b);ov.appendChild(card);document.body.appendChild(ov);
  const close=()=>{document.removeEventListener('keydown',key);ov.classList.add('out');setTimeout(()=>{ov.remove();setTimeout(()=>show(q),150)},200)};
  const key=e=>{if(e.key==='Escape')close()};
  document.addEventListener('keydown',key);x.onclick=close;ov.addEventListener('click',e=>{if(e.target===ov)close()});x.focus()};
 fetch('/api/manutencao',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(d=>{if(!d)return;
  if(d.on){if(!d.bypass&&!J)location.replace('/manutencao');return}
  const s=seen(),q=(d.popups||[]).filter(p=>!s.includes(p.id));if(q.length)setTimeout(()=>show(q),600)}).catch(()=>{});
}catch(e){}})();
