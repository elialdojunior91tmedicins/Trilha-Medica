# Nexus - Trilha Médica — Checklist Residência Médica

Marca (desde 10/2026): nome **Nexus - Trilha Médica**; símbolo dourado (fita + ponto) em SVG inline no `h1.brand` (`.blogo`, dourado por tema em `--lg1/2/3`)
e ícones em `icons/`. Paleta: claro = off-white `#f3f0e9`, azul-marinho `#16264a` (`--accent`), dourado `--gold`; escuro = `#0a1121` com dourado `#cfab63`
como `--accent`. Fontes: Cormorant Garamond (`--display`, títulos) e Manrope (`--body` e `--mono`). Teste da marca: `tests/t79.js`.

Checklist de estudos para residência médica (198 temas, plano do dia, revisões espaçadas,
faculdade, questões, anotações, caderno de erros, foco). Abas: Início (view `inicio`, padrão), Residência (view `temas`),
Faculdade, Questões, Caderno (view `notas`, antes "Anotações"), Estatísticas (view `stats`), Foco, Erros; no celular Caderno, Estatísticas e Foco ficam no ≡ Menu (`#tabM` abre `#navMenu`; a view `mais` mostra a mesma lista). Existe em duas versões com o MESMO código:

- **Site** (este repositório, GitHub Pages): https://elialdojunior91tmedicins.github.io/Trilha-Medica/
- **Artefato no Claude** (congelado na versão de 30/10/2026 por decisão do usuário em 05/11/2026: "Ficar só com o site"; não republicar): https://claude.ai/artifact/4jniuB68sNVjGFhfT2n4jQ
- **Manual (Claude Docs)**: https://claude.ai/code/artifact/fcdd47d2-4612-4cba-a14c-bba04148ecc8

O usuário fala português (Brasil), é estudante de medicina, gosta de crítica sincera e de ser
consultado quando há dúvida. Responda em português.

## Como atualizar

1. Edite os arquivos em **`src/app/`** (fonte do app desde 11/2026; `docs/adr/001-divisao-em-modulos.md`):
   `topo.html`, `css/app.css`, `corpo.html`, `js/` (módulos por assunto, juntados em ordem de caminho) e `fim.html`.
   Módulos (fase 2, 11/11/2026; fase 3, 12/11/2026): `010-dados/` (só literais: `010-temas` = áreas, temas, subtópicos, incidência; `020-curadoria` = `HY_DEF`,
   `DN_DEF`, `AX_NEAR`; `030-catalogos` = `EX_CAT`, `OF_CAT`; `040-textos` = instruções do gerador, `HERO_FRASES`, `HELP`; conferidos em `tests/unit/dados.test.js`) · `020-nucleo` (estado, datas, subtópicos, níveis, `lsGet`) · `030-texto`
   (markdown, `[[links]]`, selos, editor, fluxograma) · `040-plano` (plano do dia, revisões, semana, eixo, modo provas) · `050-residencia`
   (lista, filtros, tema aberto, agenda, mapa) · `060-faculdade/` (estrutura, provas, grade, telas) · `070-arquivos` (Word/PowerPoint,
   materiais, figuras) · `080-questoes/` (gerador, ações da questão, aba, Refazer, simulado) · `090-caderno/` (página, pegadinhas, livre e PDF,
   ler arquivo) · `100-cartoes` · `110-erros/` (dados, revisar, aba) · `120-inicio` (fila, saudação, placar, projeção) · `130-foco` ·
   `140-geral/` (peças comuns: dica, filtros `fc*`, tela inteira, avisos, lixeira; busca, primeiros passos, .ics, Ajuda; navegação, `render`,
   `renderAll`) · `150-perfil` (preferências `ui`, Perfil, Configurações, catálogo de provas) · `160-pdf` · `170-estatisticas` ·
   `180-banco/` (dados, tela, provas oficiais) · `190-provas/` (dados, importar, fazer a prova) · `200-backup` · `210-conta` (gravação,
   sincronização) · `220-abertura` (carga, por último). Arquivo novo numa pasta de módulo: `NNN-nome.js`, de 10 em 10.
   Recurso novo vai no módulo do assunto dele, nunca no fim.
   Mover código de lugar: `tools/divisao/` (`check.js` confere a ordem nova antes; veja o LEIA.md de lá).
   **Para achar qualquer coisa, use o mapa do código** (12/11/2026, `tools/mapa/`, LEIA.md lá; uma vez por ambiente: `cd tools/divisao && npm i`):
   `node tools/mapa/onde.js <nome|#id|.classe|resid-chave|prefs.x|texto>` diz onde está, quem usa, que testes o citam e em que linha deste arquivo ou de
   `docs/recursos.md` ele é explicado; `--codigo <nome>` mostra o código exato; `--testes <nomes>` e `--diff [base]` dizem que testes rodar; `--arquivo <módulo>`
   resume um arquivo; `--dados [tipo]` = dados salvos e backup. O mapa (`mapa/`, fora do repositório) é gerado do código em ~2 s e se refaz sozinho quando algo
   muda; `mapa/INDICE.md` é o começo. Teste: `tests/unit/mapa.test.js`. Grep fica para texto dentro de uma função.
   **Não edite `index.html` nem `src/checklist-residencia.html` à mão: os dois são gerados.** O segundo (o app sem a conta) é só saída
   do build desde 12/11/2026: fica fora do repositório (`.gitignore`) e o `tests/run.sh` o gera quando falta ou quando `src/app/` mudou.
2. Gere o site: `python3 src/build_site.py` (junta `src/app/`, monta `index.html`, muda a versão do `sw.js` e grava `src/checklist-residencia.html`).
   `python3 src/build_site.py --check` só confere se `index.html` e `sw.js` batem com `src/app/`.
3. Rode os testes: `tests/run.sh --rapido` a cada mudança (unitários no Node + t151, a abertura nos 6 aparelhos; ~30 s) e
   `tests/run.sh` (todos; veja `tests/README.md`) antes de publicar. Lógica nova sem tela (cálculo, datas, limpeza de dados) ganha teste em `tests/unit/` e escreva um teste novo `tests/tNN.js` para cada recurso novo
   (inclua-o em `tests/list.txt`). Teste no celular (390px, toque), tablet (820/1180, toque, inclusive 578px com tela 1180×820 =
   iPad dentro do app do Claude) e computador (1366, 1920). Modos de layout ficam em
   `html[data-layout=phone|tablet|desktop|compact][data-cols]`, decididos pelo tamanho da TELA.
4. Commit e push na `main` (o GitHub Pages publica a raiz).
5. ~~Republique o artefato~~: desde 05/11/2026 o artefato do Claude fica congelado (a ferramenta exige ler a cópia publicada inteira,
   1,4 MB, o que não cabe numa conversa). Publicar = site + manual.
6. Documente: recurso novo ganha um bloco em `docs/recursos.md` (no estilo denso dos outros: funções, ids, formato, decisões, teste) e o título no índice
   abaixo; mudança no núcleo (arquitetura, sincronização, decisões) fica aqui. Se a mudança afetar o uso, atualize a aba Ajuda (constante `HELP` em `js/010-dados/040-textos.js`) e o manual.

## Arquitetura

- `src/app/`: o código do app em trechos (HTML/CSS/JS); `src/checklist-residencia.html` = os trechos juntados (saída do build, fora do
  repositório; o preview `tests/mkprev.py` e 20 testes antigos abrem esse arquivo, que é o app sem o `bridge.js`). No Claude usa `window.claude.use(...)` (db, user, sample, downloads).
  Divisão em módulos: fase 1 (cortar) e 1.5 (testes de proteção: `tests/unit/`, `tests/t151.js`) em 06/11/2026; fase 2 (agrupar
  por assunto, sem mudar linha) em 11/11/2026 e o gerado fora do repositório em 12/11/2026; fase 3 (dados e textos em `js/010-dados/`) em 12/11/2026; detalhes em `docs/adr/001-divisao-em-modulos.md`. Tempo de abertura: Configurações › Tempo de abertura
  (`perfCardEl`; o script do `topo.html` grava as últimas 12 em `resid-perf`; teste t150).
- `bridge.js`: no site, implementa o mesmo `window.claude.use` com Firebase (Auth e-mail/senha +
  Firestore, persistência offline), download/compartilhamento de arquivos e IA por **copiar e colar**
  (janela com o pedido; o usuário cola a resposta). Também: importar/desfazer backup, conta, avisos.
- `config.js`: `window.FIREBASE_CONFIG` (com `COLE_AQUI` o site funciona só no aparelho).
- `sw.js` + `manifest.webmanifest` + `icons/`: app instalável e offline.
- `firestore.rules`: cada usuário só acessa `data/users/{uid}/**`.
- Dados no Firestore: `data/users/{uid}/progress` (hist, plan; temas em `progress/topics/{chave}`), `/faculdade`, `/settings`,
  `progress/errors/{id}`, `progress/notes/{key}`.
- Faculdade: `fac.sems[]` = {id,name,archived,lv,ucs?:[{id,name}]} (UC opcional, só o nome: `ucLabel` mostra "NCS 6" pelo número do semestre);
  `fac.discs[]` = {name, ucId?, div:"sp"|"" (com SPs ou só lista), info:{tipo,ch,prof,tutor,horario,local,ementa,objetivos}, items (conteúdos diretos),
  sps:[{id,name,items:[ref],objs:[texto]}]}; `sem.lv` renomeia os níveis (disc, sp). Não há mais eixo.
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
- Vários aparelhos ao mesmo tempo (`js/210-conta.js`; a carga fica em `js/220-abertura.js`): depois de carregar a conta, `liveStart()` ouve com `onSnapshot`
  o `progress`, `progress/topics`, `faculdade`, `prefs`, `settings`, `notes` e as listas (errors, free, trash, cards, redo, focus) — 12 assinaturas;
  `bridge.js` repassa o `onSnapshot` do Firestore com `metadata`. Regras: nunca aplica a volta da própria gravação (`pend`/`echo`, `liveW` guarda o
  que este aparelho gravou por último) nem passa por cima do que ainda vai ser enviado (`saveTimer`/`facTimer`/`uiTimer`/`noteTimers[k]` voltam a 0
  ao disparar; tema com `JSON(state[k])!==tSaved[k]`); `hist` junta pelo maior valor; listas atualizam o objeto no lugar e só apagam ids já vistos
  (`liveSeen`). A tela só é redesenhada (`liveFlush`) sem campo em edição e após `LIVE_IDLE` (5 s) sem toque/tecla; `#save` mostra
  "Atualizado com seus outros aparelhos". Ao voltar ao app após 5 min em segundo plano (`liveHidAt`) ou com `online`, `liveRefresh` confere tudo com `get()`. Teste: `tests/t80.js`
  (`mockdb.js` tem `window.__remote(caminho,dados)`; no `fakefb.js` duas páginas do mesmo contexto são dois aparelhos).
- Leituras da conta (Lote 18, 10/2026): a carga não lê mais tudo duas vezes. `liveOpen(ref)` abre UMA assinatura por documento/lista (todas juntas no começo da carga, objeto `R`);
  `liveFirst(ref)` devolve a 1ª resposta do servidor (resposta só do cache com internet espera até `LIVE_WAIT`=8 s) no lugar do `get()`; `liveStart` reaproveita a assinatura
  (`liveSub`: marca `liveSeen` com a 1ª resposta e aplica só as seguintes). `bridge.js`: `onSnapshot(next,err,{meta:true})` ouve metadados até a 1ª resposta do servidor e depois
  ignora lista sem `docChanges`. `liveRefresh` só depois de 30 min em segundo plano.
  Apagado em outro aparelho (27/10/2026, defeito do Refazer que "voltava" depois de 2 acertos): na carga, item que só existe no aparelho era enviado de volta.
  Agora `loOnly(name,S,arr,ids,first)` usa os ids já vistos no servidor (`seenAll`, localStorage `resid-seen-v1`, gravado por `seenSave` na carga e no `liveList` com
  resposta do servidor): visto antes e ausente agora = apagado em outro aparelho → sai daqui; nunca visto → é enviado. Sem lista ainda (1ª abertura), só o Refazer
  (`first`) descarta o que só existe aqui quando a conta já tem itens. Pacotes: `dual` marca item na coleção antiga E num pacote; apagar tira dos dois. Teste: `tests/t133.js`. Pacotes: no site, erros, cartões, foco e Refazer ficam em `progress/<lista>pk/pN`
  (campo `i` = {id: item em JSON}; `packStore(prog,nome)`, `PK_N` pacotes, `pkHash`; grava só o campo do item com `doc.patch(campo,{id:json|null})` = set com merge, então
  dois aparelhos não se apagam; `putMany`/`delMany` agrupam por pacote; item > `PK_BIG`=60 mil caracteres fica no documento próprio da coleção antiga; o que estiver na coleção
  antiga e couber vai para o pacote ao chegar do servidor; se o item está nos dois, vale a coleção antiga). A interface é a de uma coleção (o resto do app não muda); no artefato
  (sem `patch`) continua um documento por item. Backup do Drive lê os pacotes (`packed()`). Testes: `tests/t122.js`, `tests/t123.js` (`mockdb.js` conta leituras em
  `window.__reads` e tem `patch` com `window.__packs`; `fakefb.js` tem set com merge, `FieldValue.delete` e `docChanges`). Medição: `tests/perf18.js` (não é teste).
- Backup automático no Google Drive: `tools/backup-drive.gs` + `tools/appsscript.json` (Apps Script na conta do usuário, gatilho diário às 3h;
  lê o Firestore por REST com o token do dono do projeto e `X-Goog-User-Project`, só leitura; monta o MESMO objeto do `buildBackup()`, tira `updatedAt`
  das prefs; pasta "Nexus - Trilha Médica (backups)" com escopo `drive.file`, guarda 30). Restaurar = Importar backup do site. Instalação em
  `tools/backup-drive-LEIA.md`. **Mudou o formato dos dados ou um campo novo no `buildBackup` → atualizar o script** (teste `tests/t87.js` compara os dois).

## Recursos (em `docs/recursos.md`)

Cada tela e cada lote tem um bloco lá, com funções, ids, formatos e as decisões do usuário. **Antes de mexer num recurso, leia o bloco dele**
(`grep -n "^## " docs/recursos.md` lista os títulos; leia do título até o próximo `##`). O `onde.js` diz em que linha um nome é citado.

- Início
- Residência
- Faculdade em pastas
- Perfil e Configurações
- PDF "Panorama de estudos"
- Questões por dia
- Aba Questões
- Anotações
- Foco
- Erros
- Saudação do Início (#iHero)
- Planejar a semana
- Estatísticas
- Gráficos
- Barra lateral de altura inteira
- Navegação
- Geral
- Meta e projeção
- Lixeira
- Rodízio dos subtópicos na revisão
- Intervalo ajustado pelo acerto
- Barra de baixo no iPhone instalado
- Gerador de questões
- Faculdade ligada à Residência sem substituir
- Provas na íntegra
- Lote 11 · 198 temas, incidência pelo ENAMED, psiquiatria dividida
- Estudando e plano em partes
- Semana da prova
- Cartões do plano
- Lotes 6–7 · Ponto-chave, Take home, Fonte; erro com a questão inteira
- Lote 12 · referências, Refazer, Corrigir gabarito, Seus temas nas questões
- Lote 13 · caderno único, Tema repaginado
- Lote 14 · simulado misto completo, Material em partes, Meus simulados
- Lote 15 · provas na íntegra: temas, vários temas por questão, gabarito, figuras
- Lote 16 · catálogo de provas
- Lotes 8–9 · aba Caderno, levar para a anotação, criar cartão
- Lote 17 · enxugamento
- Lote 18, seções 2–11 · Início, Residência, Faculdade (grade, entregas), Questões, Erros, Caderno, Foco, Estatísticas, Configurações
- Lote 19 · interface
- Lote 20A · correções e segurança
- Lote 20B · filtros no mesmo padrão
- Lote 20C · Caderno: levar para a anotação, PDF, pegadinhas, ler Word/PowerPoint
- Lote 20D · provas na íntegra: leitura em partes, filtros, tela da prova
- Lote 20E · plano alinhado ao eixo, Folga, Hoje não deu
- Limite do caderno
- Revisão 30/10/2026 · Ajuda enxugada
- Lote 21 · Foco, Cartões, Questões/Caderno no computador, Revisar erros, High Yield
- Banco de questões B1 · fundação: dados, sincronização, histórico trazido
- Banco de questões B2 · a tela: partes, filtros, presets, jogador, tela inteira
- Banco de questões B3 · ligações: uma agenda só, sorteio, Fixar, irmã, Diretriz mudou
- Banco de questões B4 · provas oficiais: leitor da Medway, gabarito, comentários, subtópico
- Banco de questões B5 · High Yield pelo banco, acerto por banca, conceito recorrente
- Banco de questões: as decisões do plano (30/10 a 12/11/2026)

## Decisões que valem sempre

- Artefato do Claude congelado (05/11/2026): publicar = site + manual. IA no site por **copiar e colar** (sem chave de API no app).
- Sem lembretes/notificações e sem Notion. Provas e PDFs nunca entram no repositório.
- Banco de questões: "assinale a incorreta" SEM selo, de propósito; só a 1ª tentativa conta no acerto do tema; uma agenda só (errou → Refazer);
  nada copiado de banco de cursinho (fontes externas = provas oficiais). O resto em `docs/recursos.md` › "Banco de questões: as decisões do plano".
- **Registro completo em `docs/decisoes.md`**: o que o usuário decidiu (com data e onde está anotado) e o que ele **recusou** (não propor de novo).
  Antes de sugerir uma ideia nova, procure lá (`node tools/mapa/onde.js <palavra>` também procura). Decisão nova ou mudança: escreva lá, com a data.

## Cuidados

- Mudança no formato dos dados → migração automática (veja `migrate()` e `SUB_PERM`).
- Firestore não aceita `undefined` nem arrays dentro de arrays.
- Login: Google (popup, só fora do app instalado) e e-mail/senha. No iPhone/iPad instalado na tela inicial o popup falha;
  contas Google criam uma senha em Conta › Criar senha (linkWithCredential) e usam e-mail/senha no app instalado.
