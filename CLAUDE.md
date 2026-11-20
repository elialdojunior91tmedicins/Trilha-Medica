# Nexus - Trilha Médica — Checklist Residência Médica

Marca (desde 10/2026): nome **Nexus - Trilha Médica**; símbolo dourado "Trilha N" (trilha em N + ponto da meta, desde 19/11/2026; antes fita + laço) em SVG inline no `h1.brand` (`.blogo`, dourado por tema em `--lg1/2/3`)
e ícones em `icons/`. Paleta: claro = off-white `#f3f0e9`, azul-marinho `#16264a` (`--accent`), dourado `--gold`; escuro = `#0a1121` com dourado `#cfab63`
como `--accent`. Fontes: Cormorant Garamond (`--display`, títulos) e Manrope (`--body` e `--mono`). Teste da marca: `tests/t79.js`.

Checklist de estudos para residência médica (198 temas, plano do dia, revisões espaçadas,
faculdade, questões, anotações, caderno de erros, foco). Abas: Início (view `inicio`, padrão), Residência (view `temas`),
Faculdade, Questões, Cartões (view `cartoes`), Caderno (view `notas`), Estatísticas (view `stats`), Foco, Erros; no celular Caderno, Estatísticas, Foco e Erros ficam no ≡ Menu (`#tabM` abre `#navMenu`; a view `mais` mostra a mesma lista).

- **Site** (este repositório, GitHub Pages): https://elialdojunior91tmedicins.github.io/Trilha-Medica/
- **Manual (Claude Docs)**: https://claude.ai/code/artifact/fcdd47d2-4612-4cba-a14c-bba04148ecc8
- Artefato antigo no Claude: congelado desde 05/11/2026 ("Ficar só com o site"); não republicar.

O usuário fala português (Brasil), é estudante de medicina, gosta de crítica sincera e de ser
consultado quando há dúvida. Responda em português.

## Como atualizar

1. Edite só **`src/app/`**: `topo.html`, `css/app.css`, `corpo.html`, `js/` (módulos numerados por assunto, juntados em ordem de caminho) e `fim.html`.
   Recurso novo vai no módulo do assunto dele, nunca no fim; arquivo novo numa pasta de módulo: `NNN-nome.js`, de 10 em 10.
   Lista dos módulos: `docs/arquitetura.md`. Mover código de lugar: só com `tools/divisao/` (LEIA.md de lá).
   **Para achar qualquer coisa, use o mapa do código** (`tools/mapa/LEIA.md`; uma vez por ambiente: `cd tools/divisao && npm i`):
   `node tools/mapa/onde.js <nome|#id|.classe|resid-chave|prefs.x|texto>` diz onde está, quem usa, que testes o citam e em que linha deste arquivo,
   de `docs/arquitetura.md` ou de `docs/recursos.md` ele é explicado; `--codigo <nome>` mostra o código; `--diff [base]` diz que testes rodar;
   `--dados [tipo]` = dados salvos e backup. Grep fica para texto dentro de uma função.
   **Não edite `index.html` nem `src/checklist-residencia.html` à mão: os dois são gerados** (o segundo fica fora do repositório).
2. Gere o site: `python3 src/build_site.py` (`--check` só confere se `index.html` e `sw.js` batem com `src/app/`).
3. Teste: `tests/run.sh --rapido` a cada mudança (~30 s) e `tests/run.sh` (todos; `tests/README.md`) antes de publicar.
   Lógica sem tela ganha teste em `tests/unit/`; recurso novo ganha `tests/tNN.js` (incluído em `tests/list.txt`).
   Renomeou algo que o `bridge.js` usa → ajuste o `bridge.js` junto (`tests/unit/contrato.test.js`).
   Seis aparelhos: celular 390 (toque), iPad no Claude 578 (tela 1180×820), tablet 820 e 1180 (toque), computador 1366 e 1920.
   Layout em `html[data-layout=phone|tablet|desktop|compact][data-cols]`, decidido pelo tamanho da TELA.
4. Commit e push na `main` (o GitHub Pages publica a raiz). Publicar = site + manual.
5. Documente: recurso novo ganha um bloco em `docs/recursos.md` (estilo denso: funções, ids, formato, decisões, teste); mudança de arquitetura,
   sincronização ou formato dos dados fica aqui ou em `docs/arquitetura.md`. Afetou o uso → aba Ajuda (`HELP` em `js/010-dados/040-textos.js`) e manual.

## Arquitetura

- `src/app/`: o código do app em trechos; no Claude usa `window.claude.use(...)` (db, user, sample, downloads). Detalhes: `docs/arquitetura.md` › Módulos.
- `bridge.js`: no site, implementa o mesmo `window.claude.use` com Firebase (Auth e-mail/senha + Firestore, persistência offline),
  download/compartilhamento e IA por **copiar e colar** (janela com o pedido; o usuário cola a resposta). Também: importar/desfazer backup, conta, avisos.
- `config.js`: `window.FIREBASE_CONFIG` (com `COLE_AQUI` o site funciona só no aparelho).
- `sw.js` + `manifest.webmanifest` + `icons/`: app instalável e offline.
- `firestore.rules`: cada usuário só acessa `data/users/{uid}/**`.
- Dados no Firestore: `data/users/{uid}/progress` (hist, plan; temas em `progress/topics/{chave}`), `/faculdade`, `/settings`,
  `progress/errors/{id}`, `progress/notes/{key}`.
- Faculdade: `fac.sems[]` = {id,name,archived,lv,ucs?:[{id,name}]} (UC opcional, só o nome: `ucLabel` mostra "NCS 6" pelo número do semestre);
  `fac.discs[]` = {name, ucId?, div:"sp"|"" (com SPs ou só lista), info:{tipo,ch,prof,tutor,horario,local,ementa,objetivos}, items (conteúdos diretos),
  sps:[{id,name,items:[ref],objs:[texto]}]}; `sem.lv` renomeia os níveis (disc, sp). A estrutura não tem mais eixo (o "eixo atual" do plano, Lote 20E, é outra coisa: a área das SPs da semana, `ui.prefs.eixo`).
  SP = conteúdo: cada SP tem `fac.own[s.id]={t:s.name,discId,spId:s.id}` e `"O:"+s.id` sempre como 1º item (`isSelf`); os outros itens são
  conteúdos dentro dela. Renomear a SP muda `own.t` junto. `facMigrateSP` (em `facNormalize`) converte o formato antigo: cria o próprio da SP,
  copia a área do eixo para a SP (e para conteúdos FAC aninhados sem área), apaga `eixos`/`eixoId`/`lv.eixo` e define `div`.
  Refs: `T:<chave>` tema da residência, `S:<chave>:<subtópico>`, `O:<id>` tema da faculdade (progresso em `F-<id>`).
  A área dos temas FAC (`ownPlace`) é a do próprio conteúdo ou a da SP dele; que aparecem na aba Temas com selo FAC e não contam no % dominado.
  Objetivos da SP viram subtópicos (`cs` com `fac:<id da SP>`) do tema principal da SP (`primaryRef`: o primeiro ligado, ou o `F-<sid>`; `syncObjs`
  limpa dos outros e devolve se mudou; `facSyncAll` roda ao carregar).
  "Colar ementa": `ementaPrompt` → `sample.json` → `ementaParse` (revisão) → `ementaApply` (junta por nome, sem duplicar).
- Backup: JSON `{app:"checklist-residencia", format:1, exportedAt, counts, data:{…}}` (`buildBackup`, `js/200-backup.js`). As chaves de `data`, onde cada lista
  vive (aparelho, conta), quem a limpa ao carregar e os campos de cada tipo: `node tools/mapa/onde.js --dados` (tirado do código; `tests/unit/mapa.test.js`
  falha se uma lista da conta ficar fora do backup sem motivo, ou se o site ou o Drive deixarem de ler uma chave).
- Temas na conta: um documento por tema em `progress/topics/{chave}` (`topicStore`, `saveTopics` grava só o que mudou via `tSaved`);
  `progress` guarda `{version:3,split:true,hist,plan}`. Conta antiga (v2, `topics` no documento) migra sozinha; se uma versão antiga do app
  regravar v2, a carga junta os dois ficando com o registro mais novo (`tNewer`).
- **Vários aparelhos ao mesmo tempo** (`js/210-conta.js`, carga em `js/220-abertura.js`): assinaturas com `onSnapshot`, nunca aplicar a volta da própria
  gravação nem passar por cima do que ainda vai ser enviado, apagados em outro aparelho, pacotes das listas. **Antes de mexer, leia `docs/arquitetura.md`**
  (seções "Vários aparelhos" e "Leituras da conta"). Testes: `tests/t80.js`, `t122`, `t123`, `t133`.
- **Backup automático no Google Drive** (`tools/backup-drive.gs`, instalação em `tools/backup-drive-LEIA.md`, detalhes em `docs/arquitetura.md`).
  **Mudou o formato dos dados ou um campo novo no `buildBackup` → atualizar o script** (teste `tests/t87.js` compara os dois).

## Onde fica cada registro

- **Este `CLAUDE.md`:** o que cada coisa é, o resumo da arquitetura e o formato dos dados.
- **`docs/arquitetura.md`:** módulos, sincronização, pacotes, backup do Drive em detalhe.
- **`docs/recursos.md`:** um bloco por recurso e por lote (funções, ids, decisões, teste). Blocos antigos citam nomes que já saíram (veja "Limpeza 16/11/2026").
  Antes de mexer num recurso, leia o bloco dele: `grep -n "^## " docs/recursos.md` lista os títulos; leia do título até o próximo `##`.
- **`docs/decisoes.md`:** o que o usuário decidiu e o que **recusou**.
- **Pendências (tudo o que está aberto): só em `claude/pendencias.md` do Projeto "Trilha Médica" no Claude.** Não há `pendencias/` nem `ESTADO.md` no repositório.
- **Skill `nexus-dev`** (na conta do Claude): o jeito de trabalhar. **`tests/README.md`:** os testes. **`tools/mapa/LEIA.md`:** o mapa do código.
- `docs/adr/` (decisões técnicas) e `docs/superpowers/` (desenhos e planos de lotes) são histórico.

## Decisões que valem sempre

- Artefato do Claude congelado (05/11/2026): publicar = site + manual. IA no site por **copiar e colar** (sem chave de API no app).
- Sem lembretes/notificações e sem Notion. Provas e PDFs nunca entram no repositório.
- Banco de questões: "assinale a incorreta" SEM selo, de propósito; só a 1ª tentativa conta no acerto do tema; uma agenda só (errou → Refazer);
  nada copiado de banco de cursinho (fontes externas = provas oficiais). O resto em `docs/recursos.md` › "Banco de questões: as decisões do plano".
- **Registro completo em `docs/decisoes.md`**: o que o usuário decidiu e o que ele **recusou** (não propor de novo).
  Antes de sugerir uma ideia nova, procure lá (`node tools/mapa/onde.js <palavra>` também procura). Decisão nova ou mudança: escreva lá, com a data.

## Cuidados

- Mudança no formato dos dados → migração automática (veja `migrate()` e `SUB_PERM`).
- Firestore não aceita `undefined` nem arrays dentro de arrays.
- Login: Google (popup, só fora do app instalado) e e-mail/senha. No iPhone/iPad instalado na tela inicial o popup falha;
  contas Google criam uma senha em Conta › Criar senha (linkWithCredential) e usam e-mail/senha no app instalado.
