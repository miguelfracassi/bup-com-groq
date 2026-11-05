# Bup
1. Suba a pasta num repositório e importe na Vercel.
2. Vercel > Storage > Neon (Postgres): conecte ao projeto. Isso cria `DATABASE_URL`.
3. Em Settings > Environment Variables adicione `GROQ_API_KEY` (crie a chave em console.groq.com/keys) e `AUTH_SECRET` (qualquer texto longo e aleatório, ex.: `openssl rand -hex 32`). Opcional: `GROQ_MODEL` para trocar o modelo (padrão `openai/gpt-oss-20b`, com `openai/gpt-oss-120b` de reserva; veja os modelos em console.groq.com/docs/models). A chave fica só no servidor (`api/bup.js`) e nunca vai para o navegador.
4. Deploy. As tabelas (users, pets, messages) são criadas sozinhas no primeiro acesso.

Páginas: `/` (início), `/expressoes`, `/como-funciona`, `/faq`, `/privacidade`, `/termos`, `/conta`, `/configuracoes`, `/conversar` (login + chat). Menu e rodapé ficam em `site.js`; estilos em `site.css`.

## Pré-lançamento (/join) e contagem regressiva
- Enquanto o site estiver **travado**, quem abre qualquer página (`/`, `/expressoes`, `/faq`...) é redirecionado (307) para `/join`. Quem decide é o `middleware.js`, que consulta a tabela `launch` no Neon (cache de 10 s). Seguem livres: `/join`, `/admin`, `/api/*`, `/assets/*`, `/niverdamel`, `site.css`, `site.js`, `favicon.svg`.
- **Sem nenhuma data configurada o site fica travado** (modo pré-lançamento).
- **Para inaugurar:** em `/admin` (card "Lançamento do site") escolha **data e hora** e clique em **Agendar lançamento**. Quando a contagem chegar a zero o site abre sozinho, sem novo deploy. Também dá para **Liberar agora** ou **Travar e apagar data**.
- No `/admin`, o botão **Ver o site (sem a /join)** grava um cookie assinado (2 h, só nesse navegador; é encerrado ao travar/agendar ou em "Sair da prévia") que deixa o admin entrar no site mesmo travado (`api/admin-preview.js`).
- A `/join` mostra a contagem regressiva ao público (`/api/launch`) e, ao zerar, leva a pessoa para o site. Se o site já estiver liberado, `/join` redireciona para `/`.
- Na `/join` o menu mostra só a marca e o rodapé só tem o copyright. O formulário "Me avise quando inaugurar!" grava em `waitlist` (name, phone, created_at) via `/api/waitlist`.

## Administração
- `/admin` tem o card de lançamento e a lista de inscrições da `/join` (busca, WhatsApp, remover e baixar CSV).
- Protegida por chave: em Settings > Environment Variables da Vercel crie `ADMIN_KEY` (texto longo e aleatório) e faça o deploy. A página pede essa chave ao abrir; `/api/admin-waitlist` e `/api/admin-launch` recusam qualquer requisição sem ela.
- Arquivos do lançamento: `middleware.js`, `api/_launch.js`, `api/launch.js` (público), `api/admin-launch.js`, `api/_admin.js` (checagem da chave).

## Login
- O site liberado abre normalmente em `/` (index). O login só aparece em `/conversar` (botão "Conversar"/"Entrar"); lá a pessoa entra ou cria a conta.
- O login ignora maiúsculas no e-mail, aceita senha com espaço sobrando no fim e diz se faltou o e-mail ("Não achei nenhuma conta...") ou se a senha está errada.

## Gestão de contas (/gestao)
- `/gestao` (mesma `ADMIN_KEY` do /admin) lista nome, e-mail, status e data de cadastro de quem criou conta. A senha nunca aparece (no banco só existe o hash). Dá para **banir/desbanir**, **mudar senha** (digitada ou gerada) e **excluir conta** (apaga também as conversas). Há filtro Todos/Ativos/Banidos e busca.
- Conta banida é desconectada, não consegue entrar e é barrada no chat e no histórico (coluna `users.banned`, criada sozinha no primeiro acesso).
- Arquivos: `gestao.html`, `api/admin-users.js`.

## Moderação, banimento e apelações
- Regras públicas em `/diretrizes-de-ia`. O chat avisa em vermelho no topo.
- `api/_moderacao.js` tem as listas de palavras (SEXUAL e XINGA). Edite lá para ajustar. A própria IA (Groq) também sinaliza violação grave (`violation` no schema do `api/bup.js`).
- Violação: o servidor bane a conta na hora (`users.banned`, `ban_reason`, `ban_msg`, `banned_at`), a mensagem é apagada do chat, o Bup dá bronca, o chat trava, o Bup bate com o martelo e aparece "Sua conta foi banida do Bup". O chat fica gravado.
- Quem foi banido continua com a sessão só para ver a tela de banimento e pedir apelação (`api/appeal.js`: nome, e-mail e telefone).
- `/apelacoes` (também `/apelações`, mesma `ADMIN_KEY`) lista as apelações, mostra o chat e permite **Desbanir** ou **Descartar** (`api/admin-appeals.js`).
- `/gestao` tem o interruptor **Tela de carregamento** (tabela `settings`, lido por `site.js` via `/api/launch`; vale em até 1 min para os visitantes).

## Plano Beta e verificado
- `/gestao` → cartão **Plano Beta**: liberar/fechar o resgate e definir vagas (0 = sem limite). Guardado em `settings` (`beta_open`, `beta_slots`).
- Por conta, a Gestão tem **Verificar / Tirar verificado** e **Dar beta / Tirar beta** (colunas `users.verified`, `users.beta`, `users.beta_at`, criadas sozinhas).
- Com o resgate liberado, quem está logado vê **Resgatar plano Beta** em `/conta` e no `/conversar` (`POST /api/auth {action:'redeem_beta'}`, vagas conferidas no próprio UPDATE).
- Selo azul de verificado e etiqueta BETA aparecem no menu, em `/conta` e no chat.

## Portal de Desenvolvedores (/developers-portal) e modo manutenção
- `/developers-portal` pede a mesma `ADMIN_KEY` do /admin (a sessão do navegador é compartilhada). Tem três blocos: **Modo manutenção**, **Popups do site** e **Envios da manutenção**.
- **Manutenção:** informe *Programador responsável* e *Motivo* e clique em **Deixar em manutenção**. Quem abrir qualquer página do site (middleware) ou trocar de página (`site.js`) cai em `/manutencao`. **Tirar da manutenção** reabre o site; a página de manutenção confere o estado a cada 10 s e leva a pessoa para `/` sozinha. Dá para editar programador/motivo com a manutenção ligada (**Salvar alterações**).
- **Prévia do desenvolvedor:** "Ver o site mesmo em manutenção" usa o mesmo cookie `bup_preview` do /admin (2 h, só neste navegador; "Sair da prévia" encerra). "Ver a página de manutenção" abre `/manutencao?preview=1`, que mostra a página mesmo com a manutenção desligada (nada é enviado ao banco nesse modo).
- **Página `/manutencao`:** Bup de capacete olhando pros lados, esteiras de ferramentas e carinhas do Bup, texto, programador, motivo e, com animação, o Bup pede o telefone. No fim, "From Ticord" com a mesma logo da tela de carregamento. Os envios ficam em `maint_phones` (agrupados por manutenção) e aparecem em **Envios da manutenção** (filtro, busca, CSV, remover; atualiza a cada 15 s).
- **Popups:** título (opcional), texto, imagem (arquivo, reduzido no navegador para ~600 KB, ou link https), botão com texto + link (https://... ou caminho como `/faq`). Até 10. Cada popup aparece uma vez por aba do navegador, um de cada vez, só com o site no ar. Remover o popup para de mostrá-lo.
- Arquivos: `developers-portal.html`, `manutencao.html`, `api/manutencao.js` (público: estado, imagem do popup, envio do telefone), `api/_maintenance.js`, `api/_rotas/maintenance.js` (admin, via `/api/admin-maintenance`), `middleware.js`, `site.js`/`site.css` (redirecionamento e popups), `vercel.json`.
- Tabelas criadas sozinhas: `popups`, `maint_phones` e as chaves `maint_*` em `settings`. A pasta `api/` passa de 9 para 10 funções (o plano Hobby aceita 12).
