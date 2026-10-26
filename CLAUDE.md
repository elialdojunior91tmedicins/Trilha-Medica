# Nexus - Trilha Médica — Checklist Residência Médica

Marca (desde 10/2026): nome **Nexus - Trilha Médica**; símbolo dourado (fita + ponto) em SVG inline no `h1.brand` (`.blogo`, dourado por tema em `--lg1/2/3`)
e ícones em `icons/`. Paleta: claro = off-white `#f3f0e9`, azul-marinho `#16264a` (`--accent`), dourado `--gold`; escuro = `#0a1121` com dourado `#cfab63`
como `--accent`. Fontes: Cormorant Garamond (`--display`, títulos) e Manrope (`--body` e `--mono`). Teste da marca: `tests/t79.js`.

Checklist de estudos para residência médica (198 temas, plano do dia, revisões espaçadas,
faculdade, questões, anotações, caderno de erros, foco). Abas: Início (view `inicio`, padrão), Residência (view `temas`),
Faculdade, Questões, Caderno (view `notas`, antes "Anotações"), Estatísticas (view `stats`), Foco, Erros; no celular Caderno, Estatísticas e Foco ficam no ≡ Menu (`#tabM` abre `#navMenu`; a view `mais` mostra a mesma lista). Existe em duas versões com o MESMO código:

- **Site** (este repositório, GitHub Pages): https://elialdojunior91tmedicins.github.io/Trilha-Medica/
- **Artefato no Claude**: https://claude.ai/artifact/4jniuB68sNVjGFhfT2n4jQ
- **Manual (Claude Docs)**: https://claude.ai/code/artifact/fcdd47d2-4612-4cba-a14c-bba04148ecc8

O usuário fala português (Brasil), é estudante de medicina, gosta de crítica sincera e de ser
consultado quando há dúvida. Responda em português.

## Como atualizar

1. Edite **`src/checklist-residencia.html`** (fonte única do app; é o arquivo publicado como artefato).
   Não edite `index.html` à mão: ele é gerado.
2. Gere o site: `python3 src/build_site.py` (monta `index.html` e muda a versão do `sw.js`).
3. Rode os testes: `tests/run.sh` (todos; veja `tests/README.md`) e escreva um teste novo `tests/tNN.js` para cada recurso novo
   (inclua-o em `tests/list.txt`). Teste no celular (390px, toque), tablet (820/1180, toque, inclusive 578px com tela 1180×820 =
   iPad dentro do app do Claude) e computador (1366, 1920). Modos de layout ficam em
   `html[data-layout=phone|tablet|desktop|compact][data-cols]`, decididos pelo tamanho da TELA.
4. Commit e push na `main` (o GitHub Pages publica a raiz).
5. Republique o artefato: Artifact tool com `url` = link do artefato acima e `file_path` =
   `src/checklist-residencia.html` (leia o artefato antes, como o tool exige).
6. Se a mudança afetar o uso, atualize a aba Ajuda (constante `HELP` no fonte) e o manual.

## Arquitetura

- `src/checklist-residencia.html`: app inteiro (HTML/CSS/JS). No Claude usa `window.claude.use(...)`
  (db, user, sample, downloads).
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
- Backup: JSON `{app:"checklist-residencia", format:1, exportedAt, data:{topics,hist,plan,notes,noteAt,errors,fac,prompt,sort}}`.

- Início: o cartão "Estudar hoje" (`.card.today`) é o mesmo nó da aba Residência; `placeShared()` o move para `#iToday` com a aba Início
  aberta e de volta ao abrir a Residência. As revisões dos temas (`.card.revs`) ficam SÓ na Residência (10/2026): a fila "Revisar hoje", o placar,
  o atalho da barra e "Revisar agora" usam `goRevs(k?)` (Residência, parte `rev` no celular, rola até o tema). Teste: `tests/t95.js`.
  Placar do dia `#iBoard` (`renderInicioBoard`), próximo passo `nextSteps()`/`startStep()` (liga o Foco no tema). A meta e a projeção
  (`#iMeta`, `renderInicioMeta`, `projEl()`: temas não vistos × `hist[d].e` das últimas 4 semanas) ficam na Residência, na `.side` antes do `.dash`
  (no celular, parte Progresso). Cartões do plano (`planOpen`) e das revisões (`revOpen`)
  ficam recolhidos e abrem sozinhos quando começados.
- Residência: lista em camadas, tudo recolhido ao abrir (`openAreas`/`openSpecs` começam vazios): área › especialidades › temas › tema;
  busca ou filtro de situação/atalho (`tfNarrow()`) abre o que achou sem mexer no que o usuário abriu; `tf.area`/`tf.sp` abrem só a área/especialidade;
  o tema aberto (`openKey`) sempre abre a área e a especialidade dele. Cartão "Encontrar temas" `#tFind` (busca `#q`, `#tfCount`, painel `#tfPanel`
  aberto/fechado por `#tfTog` e lembrado em `resid-tfpanel`, grupos Situação `TF_LV` / Mostrar só `TF_SHORT` / Onde, pílulas dos ativos `tfActive()`
  com ×, `#tfClear` "Limpar tudo", Ordem `#sortSel` dentro da barra, "Como ler a lista" em `details.tfhow`). Teste: `tests/t96.js`.
  O mesmo cartão em Questões (`#qFind`, `renderQFilters`), Erros (`#eFind`, `renderEMore` em `#eMore`) e Anotações (`#nFind`, `renderNFlags(keys,vis)` em `#nFBody`):
  peças comuns `fcBody(box,o)` (barra Filtros + Ordem, etiquetas, painel com grupos, "Ver resultados" `.tfdone` só no celular, rodapé), `fcSel`, `fcChip`, `fcChips`,
  `fcWhere(pre,...)` (selects `#<pre>Area`/`#<pre>Sp` com contagem), `fcAreaName`. Ids: `#qFBtn/#eFBtn/#nFBtn`, painéis `#qFPanel/#eFPanel/#nFPanel` (lembrados em
  `resid-qfpanel/efpanel/nfpanel`), limpar `#qClear/#eClear/#nClear`, ordem `#qSort/#eOrder/#nSortSel`; chips com `data-ef`/`data-et`/`data-nf`. Teste: `tests/t98.js`.
  Filtros `tf` (`renderTFilters`, `matches`; situação `tf.lv` por `tfLevel`, atalhos, área/especialidade), tema em abas
  (`renderDetail` marca `data-tab` = estudo|questoes|notas|erros; `detTab[k]`; `detGet(pre,k)` abre a aba antes de focar um campo),
  agenda `#revAgenda` (`renderAgenda`, `agBalance`) e marcação em lote `bulk` ("Já estudei antes"). Ajuste de data da revisão:
  `s.adj` (dias) vale só enquanto `s.adjFrom===s.last` (`dueIn`); `upd` apaga o ajuste quando `last`/`step` mudam.
  Mapa `#resMap` (`renderResMap`), sugestões de nível `#lvSug` (`lvSuggestions`: `lvMeets` sobe, `lvDrop` desce; `s.lvDis` = dispensado
  por 14 dias), linha do tema com acerto colorido e foco (`foTot`), barra fina de subtópicos no gráfico por área.
  Prévia da semana `weekPreview()` (simula 6 dias com `dayOff`, que desloca `today()`; clona e restaura `state`) em `#weekBox`;
  temas fixados `s.pin` (`togglePin`, `#pinBox`, filtro `tf.pin`).
- Faculdade em pastas: semestre (`facOpenSem`, + Disciplina em `facNewDiscFor`) › UC (cabeçalho `.fuch`, opcional) › disciplina (`facOpenDisc`;
  `contentAdder` em `facAddC`, tipo em `facNew["ckind"+d]` = "sp"|"c": + SP (`addSP(d,name,{area,links,pid})`) ou + Conteúdo (direto ou
  dentro de uma SP), chips de ligação em `facNew["clk"+d]`; "Detalhes e ajustes" = `infoPanel` + `discSettings` (UC, Divisões, renomear,
  `delDisc`)) › SP (`spRow`/`spDetail`) e "Outros conteúdos". Ações do conteúdo aberto: `rowActs` (Mover para… `moveEl`/`moveRef`,
  Transformar em SP `toSP`, renomear, tirar); SP: `moveSP`. Conteúdos com nome de SP (`SP_RE`) ganham o aviso "Transformar em SPs".
  "Colar ementa" e "Provas do semestre" (`facOpenProv`) ficam dentro de cada semestre.
  Provas de várias disciplinas: `p.discId` = principal e `p.discIds` (só com 2+) = todas; use `provaDids`/`provaHas`/`provaDiscs`/`provaDiscName`
  (nunca `p.discId===d.id`). SPs ligadas `p.sps` (`provaSetSp`; `facLinkSync` em `facNormalize` puxa o conteúdo novo delas). Prova nova começa com
  `unassigned(d,p)` (o que não está em outra prova); no card, o que está em outra prova (`refElse`/`spElse`) fica oculto (`facProvaAll` mostra).
  Nova prova: `provaFormEl(key,hostSem)` = Semestre (`#fpsem-<key>`) › disciplinas (chips `#fpdisc-<key>-<disc>`) › nome/data; `key` = id do semestre (em `semProvasBlock`)
  ou `"g"` (botão `#fpgNew` no painel Próximas provas, `facProvNew`). Estado em `facNew["prov"+key]={s,ds,n,dt}`.
  "Cai na prova": `spProvaEl` na SP e `#fcpv-<disc>` no + Conteúdo (`provaPut`). Nome de nível com número é recusado e avisado (`#flvfix-<sem>`).
  Painel `#facProvas` (`renderFacProvas`: `provaStats`/`provaRitmo`/`provaNext`, `provaStudyNext` → Foco + `facGoRef`, `provaSimGo` →
  `simCfg={src:"prova",pid}`; `simProva()`, `simSrcList()`, item `ctx` no `simPrompt`). Depois da prova: `provasToClose()` (até 30 dias,
  sem `p.res`) → `provaResEl` (`facRes`; `p.res={d,e,n?,of?,skip?}`; erros via `errFormEl` com `s`=nome da prova).
  Fechamento da SP `s.fech` (`spAsProva` = mini prova com objetivos `S:<chave>:<obj>` e `win`=antecedência+3; `itemStudied` usa `p.win`), antecedência `s.lead` (`spLead`, padrão `SP_LEAD`=7, opções `SP_LEADS`), `spFechas`,
  `spPlanPicks` (vagas no `buildPlan` antes das provas), `spFechaBlock` no painel, `spFechEl` na SP, selo "fecha em N dias" no `spRow`.
  Materiais `d.links`/`s.links` = [{id,u,t}] (`linksBlock`, `normUrl`). Foco por disciplina `discFocusSec(d,from)`, cartão `#facWeek`
  (só em 2 colunas). Layout: `.fside` (provas, foco, modo provas) é `display:contents` com `order` no celular e coluna da direita em 2 colunas.

- Perfil e Configurações: páginas `perfil`/`config` abertas pelos ícones do topo (`#profBtn`, `#cfgBtn`; `goSub`/`goBack`).
  Preferências em `ui = {prefs:{layout,theme,font,planN,subN,ints,facWin,resWeek}, profile:{name,goal,goalDate}}`,
  salvas em localStorage `resid-ui-v1` e no Firestore `data/users/{uid}/prefs`; `applyUI()` aplica (layouts via
  `html[data-skin=classic|compact|focus]`, letra via `html[data-font]`). No site, o botão de conta do bridge vai para `#acctSlot` (Perfil).

- PDF "Panorama de estudos" (Perfil › Exportar PDF): gerador próprio `MiniPDF` (Helvetica WinAnsi, larguras em `HW`), sem bibliotecas;
  `buildReport(opt)` monta e `downloads.save` entrega (no site, `bridge.js` aceita `.pdf`).

- Questões por dia: `state[k].qd={"AAAA-MM-DD":[q,c]}` (gravado por `addQ`); `qPeriod(keys,from)` → `{q,c,und,est}`.
  Questões antigas sem dia são estimadas em `migrate()` no dia `s.last` (marca `s.qe={d,q}`, roda uma vez).
  Dias de estudo/revisão: `state[k].ed=[datas]` (gravado em `upd`; usado em "Estudados no período" do PDF).
- Aba Questões: filtros em `renderQFilters()` (busca `#qq`, área/especialidade, `#qPer`, `#qAccSel`, `#qDiscSel`, `#qSort`,
  atalhos `#qWeak/#qIncB/#qErrB/#qDueB`, `#qClear`); `qUniverse()` aplica os filtros; gráfico por especialidade com
  alternância `.qchtog` para áreas (`qChartBy`).
  Também: registro rápido (`qReg`, `qRegPanel`; `addQ(x,t,c,dia)`/`logAct(f,n,c,dia)` aceitam o dia), evolução semanal
  (`qEvoSvg`), "Refazer as que errei" (`redo` = [{id,k,d,n,q}], `resid-redo-v1` + Firestore `progress/redo/{id}`, `rdAdd` em `answer`,
  `rdRun` = sessão de refazer, não conta no acerto) e "Onde ganhar pontos" (`qGainCard`: incidência² × distância de 80%).
  Meta semanal `ui.prefs.qgoal` (`qGoalEl`, conta `hist[d].q`), tendência `qTrend(k)` (30 dias × 90 antes; filtro `qWorse`),
  linha extra por tema `qRowExtra` (erros do caderno, + erro, + registrar), banca/fonte por tema em `state[k].qb={fonte:{dia:[q,c]}}`
  (`addQ(...,src)`; geradas = "Claude"; `qSrcCard`; juntar/renomear fontes `qSrcFixEl`/`qSrcMerge(de,para)`/`qSrcUndoNow`, sugestão `qSrcSuggest` por nome parecido, troca também `ex.banca` e `resid-qsrc`; "Claude" não é renomeado; teste t100).
  Partes no celular/tablet em pé: `qSeg` = resumo|praticar|temas (`#viewQuest[data-qseg]`, classes `.qs-res/.qs-prac/.qs-tem`, `setQSeg`).
  Simulado misto `sim` (`qSimCard`, `simStart` com `simPrompt` multi-tema, `simAnswer`); ritmo em `hist[d].ts/tq` (`logPace`, `qPaceEl`,
  meta `ui.prefs.qpace` em segundos).
- Anotações (view `notas`): partes `nSeg` = revisar|pegadinhas|todas (`#viewNotas[data-nseg]`, classes `.ns-rev/.ns-peg/.ns-all/.ns-ctl`).
  "Para reler hoje" (`nTodayCard`, `s.nread`), pegadinhas `pegOf(k)` (linhas "> ", ==destaque==, seção "Pegadinhas"), cobertura
  `noNoteKeys()`/`nNoNote`, cartões `cards` = [{id,k,q,a,box,due,n,ok,src}] (`resid-cards-v1` + Firestore `progress/cards/{id}`,
  `cardsBlock` no tema, `cdGenerate` via `sample.json`, revisão Leitner `CD_INT` em `nCardsCard`; backup `data.cards`).
  Cartões (Lote 5, 10/2026; módulo que começa em `const LSCD`): cada cartão `{id,k,q,a,ref?,h?,kind?,eid?,src,due,n,ok,box,at?,f:{st,s,d,last,reps,lapses,first}}`
  (`h`=1 = campos em HTML simples do padrão Osler, mostrados por `cdSafe`; `st` 0 novo, 1 aprendendo, 2 revisão, 3 reaprendendo). FSRS-4.5 em dias (`FW`, `fsNext(x,g)` → `{f,days}`,
  `days`=0 = volta na mesma sessão; `fsPreview`, `fsLab`); `cdClean` migra os antigos pelo `box` (revisão com `s`=`CD_INT[box]`). `cdDue()` = vencidos + novos até `cdNewLimit()`
  (`ui.prefs.cdNew`, padrão 14; `cdNewToday` pelo `f.first`). Tela `nCardsCard0` (título "Cartões"): resumo `.cdsum`, previsão `.cdfc` (`cdForecast`, 7 dias), `#cdGo` → `cdRunStart`,
  cartão `.oscard` (`.osq`, `.osa`, `.osref`), botões `#cdR1..4` (`cdRate`; teclas 1–4), `cdCfgEl`. Do erro: `eCardBtn` (`#ecd-<id>`) abre `cdErrEl(e)` (`cdErr[id]`, rascunho do app
  `cdErrDrafts`: discriminador + por que não a sua; `cdErrClaude` com `cdErrPrompt` = regras do Osler, 4 tipos, `CD_TIPO`/`CDK`), `cdErrSave(e)` guarda com `eid`/`kind`.
  Anki: `cdReady()` (revisão a ≥ `CD_ANKI`=40 dias) → `cdAnkiEl` → `apkgBuild(L)` (banco SQLite escrito à mão em `sqliteBuild`: tabelas col/notes/cards/revlog/graves do esquema 11,
  páginas internas e transbordo; `zipStore` sem compressão + `crc32`; tipo de nota fixo "Osler Flashcard (Nexus)" `APKG_MID`, baralho "Nexus::Cartões dos erros" `APKG_DID`, `guid`="nx"+id,
  tags `apkgTags`) → `cdExp` (localStorage `resid-cdexp`) → `#cdAnkiDone` `cdAnkiDone()` = lixeira `kind:"cards"` (um item com todos) + `e.ak` no erro. Anki só por .apkg (10/2026: o usuário testou e preferiu; o .txt `ankiSave` e o link de teste foram retirados). Armazenamento continua 1 documento por
  cartão (`progress/cards/{id}`): os pacotes + IndexedDB ficaram para quando o volume pedir. Teste: `tests/t105.js` (confere o .apkg com o sqlite3 e o zipfile do Python).
  Filtros extras `nFlags` (week|peg|tab|cards, `nFlagOk`) e ordem `nSort`; erros junto `noteErrsEl(k)` (linha "N erros neste tema · M ainda pedem atenção · ver no caderno" + até 3 vivos `eAlive` = vence hoje ou `miss`≥1, sem `e.nt` nem arquivados; `eConcept(e)` = 1ª linha do correto sem "Correta:"; `eOpenOne` abre o erro no caderno, `.ecard[data-eid]`); PDF `notesPDF(keys,free)`;
  caderno livre `freeN` = [{id,t,b,tags,ks,at}] (`resid-free-v1` + Firestore `progress/free/{id}`, `freeCard`/`freeEditor`,
  `freeLinkedEl(k)` dentro do tema; backup `data.free`).
  Markdown: links `[t](url)` e URLs soltas em `inl`; bloco ```fluxo → `flowHTML` (etapas, "? decisão", caminhos recuados "Rótulo: a → b").
  Lote 3 (10/2026): `inl` guarda tokens em marcadores `\u0000N\u0000` antes de escapar: `[[Nome]]`/`[[Nome|texto]]` → `wkHTML` (`wkFind` = nome exato normalizado ou prefixo único,
  `wkIndex` com temas da residência/FAC e páginas do caderno livre; limpa `mdCache` quando muda), clique delegado → `wkGo("t:<chave>"|"f:<id>")`; `{{e:<id>}}`/`{{q:<prova>:<i>}}` → `nbHTML`/`nbGo`
  (erro → `eOpenOne`; questão → `exRun` view "rev"). `md(src,{fold:chave})` marca títulos com `\u0001N` e `mdFold` monta `details.mdsec[data-fk][data-fi]` (fechados em `foldSt`,
  localStorage `resid-fold-v1`, evento `toggle` em captura); listas com `sub2`/`sub3` e `li.haskids` + `button.lfold`. Usado no tema (modo Ler, `#nfold-<chave>` Abrir/Fechar tudo),
  nos cartões abertos de Anotações (com `wkBackEl`), em "Para reler hoje" aberto e no caderno livre aberto. `edit(ta,k,…)` aceita `k` = função (o caderno livre usa `v=>freeEdit.b=v`): o `freeEditor` tem a barra `.frtools` (H, B, ==, •, >, [[ ]], Selo), `.wkpop` e Tab; `nbPickEl(ta,k,close,keys)` + `nbChoices([chaves])` usam os temas ligados (`E.ks`). Editor: `wkPopUpdate`/`wkPopKey`/`wkPick` (lista `.wkpop` ao digitar `[[`), `indentLines` (Tab/Shift+Tab em item de lista
  ou seleção de várias linhas), botões `[[ ]]` e `Selo` (`nbPickEl` com `nbChoices(k)`). `wkBackEl(ref)`: "Mencionado em" (`wkBack`, `wkLinksIn`) e "Citado sem link" (`wkPlainAt`,
  nome ≥5 letras com limite de palavra, fora de `[[…]]`; `wkLinkify` usa `replaceNote`). `eToNote` acrescenta `{{e:<id>}}` à linha.
  PDF: `notesPDF(keys,free,{scope,title,raw})` = capa (nome do Perfil, data) + sumário (área › especialidade › tema, páginas) + conteúdo (área em página nova, especialidade, tema em azul)
  com texto rico (`runsOf`: negrito, ==destaque== com fundo, `[[link]]` + "(p. N)", selos como texto); páginas em até 3 passadas (`content(pmap)`). Escolha em `nPdfOpt`
  (`#nPdfBox`: `#nPdfScope` = screen|all|<área>, `#nPdfFree`). Sumário lateral `#nToc` (`nTocRender(shown,more)`, fixo à direita só com `twoCols()` e espaço ≥1190px ao lado da barra;
  `#viewNotas.hastoc`; cartões `#nc-<chave>`; `IntersectionObserver` marca o atual). Teste: `tests/t103.js`.
  Ler imagem: `imgR`/`imgPanel`/`imgRun` (`sample(prompt,{images:[blob]})`, imagem reduzida em `imgShrink`; não é salva) → `imgSave`
  na anotação do tema ou no caderno livre. O artefato declara `sample:{images:true}`; no site, `bridge.js` pede para anexar a imagem.
- Foco (view `foco`, `renderFoco`): pomodoro/cronômetro. Sessões em `foSess` = [{id,d,s,sec,m:"p"|"c"|"x",ref:"T:<tema>"|"D:<disc>"|"",lab}],
  localStorage `resid-focus-v1` e Firestore `progress/focus/{id}` (`focStore`, mescla por id como os erros). Relógio em andamento
  `foRun` só no aparelho (`resid-focus-run`, conta por horário de início). Preferências `ui.prefs.fw/fb/fsnd/fgoal/fwake`.
  `foMat` agrupa por especialidade/disciplina; entra no PDF (`R.Fo`) e no backup (`data.focus`). Pílula `#foPill` fora da aba.
  Depois da sessão: `foAfter` ({k,sec,d,id}, localStorage `resid-focus-after`, `foAfterSet` em `foTick`/`foFinish`) → `foAfterCard` (subtópicos via
  `toggleSub`, Estudei/Revisei, questões). Vínculo rápido `foQuickEl` (plano, revisões e disciplinas ativas ainda sem conteúdo `#foqd-<id>`, ref `D:`; teste t90). Ciclos `foSeries` (`resid-focus-series`, zera após 1 h) e pausa longa
  `ui.prefs.flong/fevery` (`foRun.lb`), bolinhas `foDotsEl`. Distrações `foRun.dist` → sessão `dz`. Ruído `ui.prefs.fnoise` w|b|r e `fvol`
  (`foNoiseSync` no fim de `render()`, WebAudio). Tela inteira `fullOn.fo`. Mapa `foHeatCard` ("Nas últimas 12 semanas", no fim da aba e com `grid-column:1/-1` em 2 colunas; `container-type` no cartão: a partir de 640px
  escreve os minutos em cada dia (`foHM`), nome do dia e data da semana, total da semana em barras; a partir de 900px o resumo `.fohstats` e o melhor
  horário vão para a direita; legenda com minutos por terços da meta; "Esta semana" compara com a anterior até o mesmo dia; teste t97), `foWeekExtra`
  (meta semanal `ui.prefs.fwgoal` em minutos, recorde, distrações). Layout: `.focol` (esquerda: depois, relógio, sessões; direita: semana, mapa, matéria).

- Erros (view `erros`): objeto do erro `{id,k,w,r,p?,t,s,d,rev,lastRev,box,due,miss,lastMiss,cd,nt}` (`p` = Pista do caso, mostrada no `.ecard` e na revisão antes da resposta). Revisão ativa `eRevCard`/`erRun`
  (`E_INT=[1,3,7,15,30]`, `eAnswer`; `eDue(e)` calcula a data para erros antigos sem `due`), registro `eRegPanel`/`eReg` e
  `errFormEl(D,pre,onSave)` + `eNew` (também usados por `eCadEl` no simulado e no Refazer, com `qDraft`), `eRepCard`/`eRepeat`
  (mesmo tema ≥2 em 30 dias; `miss`≥2), `eWeeksEl` (8 semanas por tipo), `eCardBtn` (→ `cdAdd`, guarda `cd`) e `eToNote`
  (seção "## Meus erros" da anotação, marca `nt`). Próximo passo do Início: `kind:"errs"`.
  Também: causa `e.c` (`ECAUSES` por tipo, dicas `ECTIPS`, "Por que você erra"), arquivar `e.arch` (`eArchive`; arquivados saem de
  `eDueList`/`eRepeat`), filtros `#eMore` (`renderEMore`: `eFlags` due|rep|nocard|arch, `ePer`, `eSrc`, `eCause`; `eExtraOk`), ordem
  `eOrder` sp|new|due|miss, PDF `errosPDF(eVis)`/`ePdfSave`, simulado `simCfg.src="errs"` (`eSimItems`, questão com `err` → `eAnswer`).
  O selo `#ecount` mostra os erros para revisar hoje. Ir para os erros de um tema: sempre `eGoTopic(k)` (limpa filtros com `eClearAll`; tema só com arquivados liga `eFlags` arch); "Onde melhorar" (tipos, causas, temas, especialidades) conta só ativos; lista vazia com tema só arquivado mostra `#eSeeArch`; no tema da Residência os arquivados ficam à parte. Teste t100.
  Em duas colunas (`data-cols=2`, tablet/desktop): `.eside` (eTop + Onde melhorar) à direita, filtros e lista à esquerda; no celular `.side` é `display:contents`.
  Revisão em tela inteira: `erFull` (localStorage `resid-erfull`, `erFullSet`), classe `#viewErros.erfull` só com `erRun`; atalhos espaço/1/2/Esc.
  Igual nos cartões, no simulado e nas provas na íntegra (`#exFullB` no `qExamCard` com `exRun`, Modo prova e estudo; teste t99): `fullOn.cd/sim/ex` (localStorage `resid-cdfull`/`resid-simfull`/`resid-exfull`, `fullSet`, `fullBtn`), `applyFull()` no fim de `render()`
  marca `.vfull` na aba e `.fullhide`/`.fullpath` nos irmãos/ancestrais do cartão; só vale com `twoCols()`.

- Saudação do Início `#iHero` (`heroCard`, primeiro de `ICARDS`; `iOrder` põe no topo quem tinha ordem salva): `heroHi` (hora), `heroSummary(qCounts())`,
  `heroExam` (prova principal + prova da faculdade em até 7 dias), `heroLine` = feito real (`heroFeats`: sequência `heroActive`, questões de ontem, especialidade
  que subiu ≥10 pontos, ≥5 h de foco na semana) ou `HERO_FRASES[dnum % 60]`. Botão `#heroGo` (fila: `qStart`/`qGoStep`; sem pendência: `startStep`);
  com a saudação visível, `iQueueCard` não mostra `#iqGo`. Em duas colunas `.icol{order:50}` deixa saudação e placar no topo. Classes `.herobtn` (`.hbtn` já é do cabeçalho). Teste: `tests/t84.js`.
- Planejar a semana (Lote 10, substitui a "Semana de estudos"): `ui.prefs.wday` = minutos por dia (0=domingo … 6) em `WP_MIN` [0,30,60,120,180] (`WP_LAB`), semana padrão;
  `ui.prefs.wplans={"<segunda AAAA-MM-DD>":{m:[7],ok:0|1}}` (as 3 mais recentes) = semana planejada; `ui.prefs.hgoal` = meta semanal em minutos (600). `uiSanitize` deriva `wday` de
  `wnew/woff` antigos e mantém `wnew/woff` coerentes com `wday` (só para quem ainda lê); `wsim` continua (dias de simulado). `dayMin(n)` (plano da semana ou padrão, `wpMon`), `dayCap(n)`
  (folga 0 · 30 min 1 só faculdade · 1 h 1 · 2 h 2 · 3 h+ `PLAN_N`), `weekCap()` (projeção), `HAS_OFF`. `isOffDay/isNewDay/offShift/dueIn` usam `dayMin`. `buildPlan` sombreia `PLAN_N` com `dayCap`
  e, com 30 min, só deixa faculdade ou, sem ela, 1 ponto fraco (fora da semana da prova). Cartão `wpCardEl` em Configurações › Plano (`#wpCard`, abas `#wpT-cur|next|pad` em `wpTab`, botões `#wp-<dia>-<min>`, `.chg` = diferente da padrão,
  `#wpOk`/`#wpReset`, meta, linha `#wkCfg` de simulados `#wk-wsim-<d>`); `wpSetDay(mon|null,d,m)` refaz o plano se mexer em hoje; `wpConfirm`/`wpReset`/`wpLegacy`. Início: `wpNoticeEl`
  (`#wpNotice`, `#wpGo`) no domingo (próxima) e na segunda (esta), some com `ok` ou `resid-wpdis`. Estudar hoje: `planDayEl` em `#planDay` (`#pTime`, `#pTimeChg`, `#tdm-<min>` → `setTodayMin`,
  caixa do leve `#pLight`/`#pLightGo` = `qStart` no dia de 30 min, com a revisão geral `#pLightGenBox`/`#pLightGen` → `cdGenGo`: `cdGenScope()` = temas da prova da faculdade em até 7 dias ou os estudados na semana (`ed`), `cdGenIds` = até `CD_GEN_MAX`=20 cartões já estudados, `cdRunStart(ids,gen)` com aviso `#cdGenNote`). `wdOf(dnum)`, `isSimDay`, `nextStudyLabel`, `newDaysWeek`. Folga zera `qCounts`/`nextSteps`; dia de simulado põe passo `sim`
  (n=20) ou `exam` no topo. Testes: `tests/t85.js` (planejar) e `tests/t111.js`.
- Estatísticas (Lote 10, view `stats`, `#tabS` na barra lateral e no ≡ Menu, escondida na barra de baixo do celular; `#viewStats`/`#stBody`; módulo antes de `function renderAll`):
  `renderStats` com seletor `#stSide-res|fac` (`stSide`, `resid-stside`), período `#stPer-7|30|90` (`stPer`, `resid-stper`), aviso `#stLow` (< `ST_LOW_DAYS`=21 dias de uso, `stFirst`),
  veredictos `#stVerd .stv ok|warn|bad|na` (`stVerdRes`/`stVerdFac`), blocos `#stB1..4` (`stResBlocks`: tabela `stTable`/`stDelta`, nota das provas na íntegra `stExamLine` pelos `tries`,
  projeção de `projModel`, barras `stBars` com meta e "até hoje", `stPerTopic` = mediana do Foco por tema estudado (2 h até 3 temas), quadrante `stQuad` + lista por quadrante, focos `.stfi`
  com `stGoSpec`/`goRevs`, `#stAdj` → `stAdjWeek`) e `#stF1..4` (`stFacBlocks`: notas `p.res`, `provaStats`, `discFocusSec`, divisão `stsplit`). Dados: `stRes(D)`/`stFac(D)`, `stHist`, `stQ(keys,a,b)`
  (por `qd`), `stTime` + `stSideOf` (r = só residência, f = só faculdade/`D:`/`F-`, b = tema da residência usado na faculdade, `stFacKeys`; o total nunca soma duas vezes), `stTopicAct` (por `ed`).
  `#stPdf` abre o PDF no Perfil; Perfil tem `#pfStats`. `nmInfo("stats")` resume. Dados de exemplo para testes/prints: `tests/seed10.js`.
  Largura (10/2026): em 2 colunas `#viewStats{max-width:none}` (usa a tela toda); gráficos SVG (`stBars`, `stQuad`, `stExamLine`) têm largura `stW()` = metade da aba
  (ou a aba inteira em 1 coluna), entre 320 e 760, para o texto não ficar gigante. Teste em t111.
- Gráficos (Lote 10): `qEvoSvg` com eixo do acerto ajustado, `.qebar.cur` "até hoje", `.qegoal` (meta `qgoal`) e legenda das cores; acerto por especialidade em `.qchrow` (botão que filtra
  `qArea/qSpec`), tendência `.qtr` (30 dias × 90 antes), `.few` com menos de `QCH_FEW`=10, ordem `qChSort` acc|gain (`resid-qchsort`, `#qchS-acc|gain`); Progresso por área = `button.arow`
  (nome inteiro, "N de M temas", subtópicos na dica, toque filtra a área); sem "Atividade nos últimos 14 dias"; Foco › Esta semana com `.fogh` (semana passada) e `.foglt`; `eWeeksEl` com `.ewlow`.
- Barra lateral de altura inteira (computador e tablet com `data-cols=2`): `.appnav` fixa à esquerda (`--sbw` 248px; `body` com recuo), slots `#sBrand`/`#sSearch`/`#sfProf`/`#sfCfg`;
  `placeSide()` (em `renderHead` e num `MutationObserver` de `data-layout/data-cols`) move os MESMOS nós (`h1.brand`, `#srchBtn`, `#profBtn`, `#cfgBtn`) e devolve ao `header`
  nas outras telas; o `header` fica escondido. Rodapé `#sFoot` com `#sfWho` (nome, abre Perfil). Teste: `tests/t86.js`.
- Navegação (10/2026, Lote 2; módulo logo depois de `placeSide`): barra lateral recolhível em `html[data-sb=open|rail]` (`sbMode()`: tela inteira `.vfull`/`erfull` = rail;
  fixada `sbPin` em localStorage `resid-sbpin` = "open"|"rail"|""; automático = aberta só no Início), `sbApply()` no fim de `render()` e no observer de layout;
  trilho `--sbw:76px`, `.appnav.peek` abre por cima (mouse com `sbHover()`, ou `#sbMenu` ≡ no toque com `#sbBack`); `#sbPins` (`#sbPinOpen` Fixar, `#sbPinRail` Recolher;
  tocar de novo = automático) e `segRow` "Barra lateral" em Configurações › Aparência (só com `sideFull()`). Menu ≡ `#navMenu`/`#nmPanel` (`navMenuOpen/Close`,
  `navListEl` com `nmInfo(v)` = resumo e selo de cada seção, ids `#go-<view>`, `#nmSearch`, `#nmProf/#nmCfg/#nmHelp`): folha de baixo no celular (`#tabM` "Menu"),
  gaveta à esquerda no iPad em pé (`#navMenuBtn` no header; a `.appnav` some em `tablet` + `cols=1`). Animação por transição: o painel começa fora da tela (translate) e `.nmin`, posta dois quadros
  depois (`nmRaf`, duplo requestAnimationFrame, para o iPhone pintar o início), faz subir/deslizar; fechar tira `.nmin`, põe `.nmclosing` e esconde depois de 260 ms (`nmTimer`), por isso os toggles tratam "fechando" como fechado e os testes esperam ~300 ms. Teste: `tests/t102.js`.
- Geral (módulo antes de `function render(){`): fila do dia `dayQ` (`resid-dayq`; `QSTEPS` erros→cartões→anotações→temas, `qStart`/`qNext`/`qStop`,
  cartão `#iQueue`, barra fixa `#qBar` classe `.dqbar` — `.qbar` já é a barrinha das linhas de Questões), avisos `iNoticeEl` (artefato: `resid-artnote-v1`;
  backup: `resid-lastbk` gravado por `markBackup()` no Exportar, `resid-bksnooze`), resumo da semana `iWeekCard` (domingo/segunda, `resid-wkdis`),
  Início personalizável `ICARDS`/`applyICustom` (`ui.prefs.ihide`/`iorder`), busca `gsResults`/`renderGSearch` (`#srchBtn`, Ctrl+K, "/"),
  primeiros passos `renderOnb`/`maybeOnb` (só conta vazia, uma vez: `ui.prefs.onb` + `resid-onb-seen`; testes ligam com `window.__wantOnb`),
  calendário `icsBuild`/`icsSave` (.ics), ajuda `goHelp(título)`/`helpBtn(título)` (botão "?").
  Botões menos usados: erro com "⋯ Ações" (`eMenu`), Foco com "Mais opções" (`.fomore`); Anotações paginadas (`N_PAGE`, `#nMore`).
- Meta e projeção (Início `#iMeta`): provas de residência em `ui.profile.exams=[{id,name,date?}]` + `mainEx` (lista no Perfil, `exEditorEl`;
  `exList`/`exMain`). `uiSanitize` migra o campo único antigo e faz `goal`/`goalDate` espelharem a principal (o resto do app lê esses dois; `exOk`
  impede recriar a antiga). `projModel()` = semanas de segunda a domingo até a prova principal (sem data: pelo ritmo, até 52): temas novos
  distribuídos com peso menor em semana de prova da faculdade (0,4; semana anterior 0,6), fechamento de SP (0,75) e outra prova de residência (0,2);
  revisões = cadeias `INT` das já agendadas + dos novos previstos; cartões pelo `due`; `out` = temas que não cabem no ritmo atual. `projEl` mostra o
  resumo e "Ver semanas" (`projOpen`, localStorage `resid-projopen`; `projWeeksEl`, 8 semanas e `projAll`). O .ics leva todas as provas com data.
- Lixeira (módulo antes do GERAL): `trash` = [{id,kind,lab,sub,at,j}] (`j` = JSON do item; localStorage `resid-trash-v1` + Firestore
  `progress/trash/{id}`), 30 dias (`TR_DAYS`, `trPurgeOld`). `toTrash(kind,...)` é chamado em `delErr`, `cdDel`, `frDel`, `saveNote` (texto
  apagado inteiro, ≥20 caracteres), exclusão de prova, `delSP` e exclusão de disciplina (um item só, com provas e temas próprios via `ownSnap`;
  `trSkip` evita itens duplicados durante a exclusão). `trRestore` devolve por tipo; aviso `#trToast` com Desfazer; lista em Configurações (`trashCardEl`).
- Rodízio dos subtópicos na revisão (10/2026): `pickSubs(it,"r-rev")` ordena os estudados pela data da última revisão `s.sv` (`{"i<índice>"|"c:<texto>": data}`, `subKey`), nunca revisado primeiro; quantidade `revSubN(n)` = máx(`SUBS_PER_DAY`, ⌈n/4⌉); `reviewTopic` grava `sv` dos mostrados (`markSubsReviewed`, `itemByKey`). Antes era pelo degrau (`step`) e repetia os mesmos no último degrau. Teste: `tests/t119.js`.
- Intervalo ajustado pelo acerto: `interval(s)` = `INT[step]` × `adaptF(s)` (a partir de step 1; acerto das questões do tema nos últimos 90 dias,
  mín. 5, `adaptAcc`): ≥85% (mín. 8) ×1,4 · ≥75% ×1,2 · <65% ×0,75 · <50% ×0,5. Não vale com ajuste manual ativo (`adj`). Pref `ui.prefs.adapt`.
- Temas na conta: um documento por tema em `progress/topics/{chave}` (`topicStore`, `saveTopics` grava só o que mudou via `tSaved`);
  `progress` guarda `{version:3,split:true,hist,plan}`. Conta antiga (v2, `topics` no documento) migra sozinha; se uma versão antiga do app
  regravar v2, a carga junta os dois ficando com o registro mais novo (`tNewer`).

- Barra de baixo no iPhone instalado: depois do teclado, o iOS deixa o `visualViewport` deslocado e a barra fixa "flutuava". `vvFix()` mede a diferença
  (`innerHeight - (vv.height + vv.offsetTop)`, ignorada com teclado aberto ou zoom) e aplica `--vvy` como `translate` em `.appnav/.bulkbar/.dqbar/.trtoast/.fopill`
  no celular; `vvSettle()` roda no `focusout`. Só dá para confirmar no aparelho.
- Vários aparelhos ao mesmo tempo (módulo antes do `(async()=>{` de carga): depois de carregar a conta, `liveStart()` ouve com `onSnapshot`
  o `progress`, `progress/topics`, `faculdade`, `prefs`, `settings`, `notes` e as listas (errors, free, trash, cards, redo, focus) — 12 assinaturas;
  `bridge.js` repassa o `onSnapshot` do Firestore com `metadata`. Regras: nunca aplica a volta da própria gravação (`pend`/`echo`, `liveW` guarda o
  que este aparelho gravou por último) nem passa por cima do que ainda vai ser enviado (`saveTimer`/`facTimer`/`uiTimer`/`noteTimers[k]` voltam a 0
  ao disparar; tema com `JSON(state[k])!==tSaved[k]`); `hist` junta pelo maior valor; listas atualizam o objeto no lugar e só apagam ids já vistos
  (`liveSeen`). A tela só é redesenhada (`liveFlush`) sem campo em edição e após `LIVE_IDLE` (5 s) sem toque/tecla; `#save` mostra
  "Atualizado com seus outros aparelhos". Ao voltar ao app após 5 min em segundo plano (`liveHidAt`) ou com `online`, `liveRefresh` confere tudo com `get()`. Teste: `tests/t80.js`
  (`mockdb.js` tem `window.__remote(caminho,dados)`; no `fakefb.js` duas páginas do mesmo contexto são dois aparelhos).

- Gerador de questões: instruções padrão `DEFAULT_PROMPT` (versão de 10/2026, juntando as regras de qualidade de distratores, pegadinhas e
  comentário); `OLD_PROMPTS` + `promptUp()` trocam pelo padrão novo quem ainda tinha o texto padrão antigo salvo (localStorage, conta e backup).
  `fixedFormat` pede `alternativas[].porque` (por que a errada está errada; vazio na correta) e proíbe citar letras no comentário, porque
  `validQs` passa cada questão por `altShuffle` (sorteia a ordem e renomeia A, B, C…; testes antigos desligam com `window.__noShuffle`, ligado
  por padrão em `mockdb.js`/`fakefb.js`). `altsEl(q,mine,onPick)` desenha as alternativas nos três lugares (tema, Refazer, simulado) e, depois
  de responder, o `.altwhy` sob cada errada (`.mine` = a marcada). `rdClean` guarda o `porque`; `qDraft` leva o da marcada ao caderno de erros. Teste: `tests/t81.js`.
  Comentário organizado (10/2026): `qExplEl(q,{note})` = Gabarito (alternativa certa) › "Por que X está certa" › Conceito-chave, nos quatro lugares (gerador,
  Refazer, simulado, prova). `qSplit(q)` (só na exibição; nada é regravado) usa `cmParse`/`CM_MARK` para separar "Alternativa X — …", "Letra X:", "X)" do
  comentário (exige 2+ letras diferentes) e põe o texto no `porque` das erradas (`cmClean` tira "Incorreta."/"porque"). `altsEl` rotula a marcada
  "Por que a sua não serve". O `impPrompt` pede o porquê só no `porque` de cada alternativa.
  Caderno a partir da questão: `qDraft(q,mine,src)` → `{w:"Marquei X; a certa era Y", p:qClue(q), r:conceito + 1–2 frases do comentário + "Por que não…", q:{…}}`
  (`qClue` pontua as frases do enunciado pelas palavras da certa/comentário, números e exames; ignora a pergunta). `errFormEl` tem o campo Pista (`<pre>p`).
  `cmTidy(t)` tira marcas de comentário de prova ("— Gabarito: A) …", "Por que está correta:", "Correta." no começo da linha): usado em `qSplit` (comentário e porquês), `cmClean`, `eOneLine`,
  `cdErrParse` e na tela do erro (`eRFill` = "Correto" com "Por que não a sua" em `b.ewhy`; `ePista` esconde pista que é só a pergunta). `qClue` devolve "" se o enunciado é só a pergunta. Nada salvo é regravado. Teste t108.
  "✦ Resumir com o Claude" no `eCadEl`: `eSumRun(D)`/`eSumPrompt(D)` (JSON {errei,pista,conceito}; `D.sum.prev` = Voltar ao do app). Teste: `tests/t101.js`.
  Vários materiais (Lote 4, 10/2026): conjunto `{items:[{id,name,txt,imgs,pages,ntext,scan,busy,err,note}],attach,busy}` em `genMat[chave]` (gerador) e `simMat` (simulado);
  `msAdd(get,set,files)` lê cada arquivo (`msReadOne`), `msPack(S)` junta no limite (`GM_MAX`/`GM_IMG`; divide o espaço por igual, os pequenos ficam inteiros, `parts[].pct`;
  imagens revezando) e devolve o objeto que `genMatPrompt` usa (`n`, `names`, `txt` com "##### Material: nome"); `genMatOn(S)`; quadro `msEl(S,{id,get,set,open,title,how})` (lista `.mslist`
  com `.msx` ×, `.msuse`/`.msbar`, `.mscut`; ids do tema `#gmf-/#gmx-/#gma-<chave>`, `#gmr-<chave>-<i>`; simulado `#smf/#smx/#sma/#smr-<i>`).
  Simulado misto em passos: `simCfg.mode` = "temas"|"mat" (`.simmode`, `#simM-temas/#simM-mat`), fontes em cartões `.simsrcb` com `SIM_DESC`, tempo `.simeta`; material → `simStartMat()`
  (`simMatPrompt(n,P,avoid)` com a lista `impTopics()` e o campo "tema"; `validQs` guarda `q.tema`; tema inválido → `simGuessK` por `impTemaScores`), questões com `mat` (selo "do seu material").
  Fontes (10/2026): `DEFAULT_PROMPT` › "Conteúdo e fontes" (só fontes confiáveis, nada inventado; o padrão anterior está em `OLD_PROMPTS[0]`) e campo `fonte`
  no `fixedFormat` → `validQs` → `.qfonte` (gerador, Refazer, simulado; `rdClean` guarda). Material do estudante opcional `genMat[k]` = {name,txt,imgs,attach,scan,cut}
  (`genMatEl` no gerador, `genMatPick`: PDF lido por `pdfOpenTxt` até `GM_MAX` caracteres, páginas sem texto/fotos como imagem até `GM_IMG` no artefato;
  no site, anexar na conversa) → `genMatPrompt` no `buildPrompt` (sem a ordem de subtópicos), `q.mat` = selo "do seu material". Teste: `tests/t94.js`.

- Faculdade ligada à Residência sem substituir: `fac.own[id].links=[{k,subs}]` (1º = principal; `subs` vazio = tema inteiro; o antigo `link`
  é migrado em `facNormalize`). `ownLinks(id)`/`ownLink(id)` (= o 1º)/`RESKEY`/`ownLinksTo(k)`/`linkDone(L)`; `facNormalize` descarta ligação inválida; `registerOwn` não registra o `F-<id>` de quem está ligado (o progresso é o do tema, um registro só).
  `refTopic("O:id")` ligado devolve `{k:<principal>,own:id,subs,links}`; `refTopics(r)` lista todos: `itemStudied` exige todos estudados
  (`topicStudied`, com os `subs` marcados), `refMissing` diz o que falta (painel da prova), plano/badges/`topicKeysOf` usam todos.
  `refLabel` mostra o nome da faculdade,
  `facTopicRow` mostra selo "FAC ↔ RES". Ligar: `linkPickEl` (dentro de `dupBox`; busca `searchBox(null,{link:id})`, depois Tema inteiro ou
  subtópicos; "Ligar a mais um tema") → `linkOwn(id,k,subs,from)` / `linkOwnRaw` (só na 1ª ligação usa `ownMergeInto`, o mesmo de `replaceOwn`:
  notas sem ir à lixeira, erros, cartões, refazer, foco, progresso, tudo para o principal; `from` = trocar). Cada tema guarda os seus;
  aberto na Faculdade (`renderDetail(it,{fac:true})`), `linkedAllEl` mostra junto (só leitura) anotações/erros/cartões de todos.
  No tema: `linkInfoEl` ("Na faculdade", "também ligado a", marcar subtópicos, Trocar ligação, `unlinkOwn(id,k)`; sem k desliga todos).
  Atalho "Ligar à residência" (`#flq-<id>`) no conteúdo FAC fechado. Testes: `tests/t82.js` (ligação, vários temas) e `tests/t89.js`
  (UC, SP como conteúdo, + SP/+ Conteúdo com ligação, Mover para, migração dos eixos).

- Provas na íntegra (aba Questões › Praticar, `qExamCard`, logo após o simulado): importar PDF/fotos (`impNew`/`impPick`/`impRead`/`impSave`, estado `imp`).
  pdf.js 4.10.38 carregado sob demanda por `import()` (`pdfLib`: jsdelivr legacy `PDFJS`, reserva cdnjs `PDFJS2`; roda sem worker via `globalThis.pdfjsWorker`);
  texto por página (`pdfPageText`), página com <60 caracteres = escaneada (`pdfPageImg` → JPEG em `sample` images; no site pede para anexar o PDF).
  Gabarito: `parseKey` ("1-A", "01. B", tabela, ANULADA → "X"; inclui `parseKeyStrong` = gabarito comentado "RESPOSTA 1 … Correta: B"),
  páginas achadas por `keyPage` (comentado: 1 resposta basta se a página não tiver alternativas "A)"; `impKey` também lê o comentado de páginas mistas),
  `parseKeyStrong` não lê "Incorreta" como "correta" (lookbehind) nem um artigo ("Correta: A deficiência…") como letra (letra seguida de palavra minúscula é ignorada, também no `r1` do `parseKey`);
  sem "Correta: X", usa "Justificativa X (correta)". `exClash(r)` = comentário contradiz o gabarito (outra alternativa com porquê "Correta…" ou comentário "Incorreta…") → selo, filtro "chk" e aviso no `exQuestionEl` (teste t107);
  justificativas por questão `keyComments` → bloco "GABARITO COMENTADO" no `impPrompt` (teste t92),
  leitura no aparelho sem o Claude `impLocal` (cabeçalho/rodapé repetidos e "Página x de y" saem; início "Questão N" ou "N." em sequência; alternativas A) em ordem;
  `impKCParse` = Justificativa X → porquê, correta + Ponto-chave → comentário, Take home → conceito; tema `impTemas` com IDF e o assunto da prova como desempate,
  `r.kg` = selo/filtro "Tema sugerido"; `probs` → aviso "Passe a prova pelo Claude" `impProbEl`; `impLocalGet` com cache; `impUseLocal` → conferir com `R.src="local"`; teste t93), PDF à parte (`impKeyFile`) ou colado; `impPrompt` leva gabarito,
  lista de temas e o texto; partes `impBlocks` (artefato 11 mil caracteres/5 págs, 2 em paralelo; site 24 mil/10 págs), falha divide a parte; `impGaps`/`impGapPages`
  = Procurar de novo. Questão `{n,p,pe,k,q,g:"b"|"c",an,im,ck}` (sem embaralhar; `ck` = letra para a qual o comentário foi escrito).
  Dados: `exams` (questões; `resid-exams-v1` + `progress/exams/{id}`) e `exProg` (respostas `{id,i,mode,fin,tries,a:{idx:{l,d,s}},h}`; `resid-exprog-v1` +
  `progress/exprog/{id}`, gravado com atraso `exPSave`/`exFlush`). Contagem no tema/banca/hist só por `exChange` (resposta, gabarito colado `exKeyEl`, anular, tema):
  tira o que contava antes e põe o novo. Jogador `exRun` (`exPlayEl`, modo prova "p" ou estudo "e", resultado `view:"res"`, com "Onde você perdeu pontos" `exLost`/`exLostEl`: especialidade com `EX_DROP_MIN`=3+ questões e acerto < `EX_DROP`=60%,
  temas errados e questões (abrem a revisão com `eCadEl`); só sugestão, não mexe no plano; teste t91). Lixeira `exam`, backup `data.exams/examProg`.
  `bridge.js`: `sample` aceita `opts.title`/`opts.hint`. Teste: `tests/t83.js` (gera um PDF de verdade com pdf-lib/sharp).
  Lista (10/2026): `exRowCard` desenha um cartão `.excard[data-st=new|run|fin]` (nome `.exname`, selo `.exstat`, `.exmeta`, barra `.exbar` em andamento,
  modo `.exmode` + `.exmodeh` só antes de começar, ação principal `.exgo`, secundárias `.exsb` no rodapé `.exsec`) dentro de `ol.excards` (grade).
  Não use `.exrow` aqui: é a linha das provas de residência no Perfil (`exEditorEl`). Teste: `tests/t101.js`.
  Ligações (Lote 4): `ex.links=["T:<chave>","O:<id>"]` (`exClean` guarda até 12). `exContrib` soma, para cada resposta, uma contribuição extra `x:1` em cada conteúdo FAC
  ligado (`exRefKey` = `refTopic(...).k`; pula se for o mesmo tema da questão), e `exCount` não põe `x` no `hist` do dia; `exRelink(ex,links)` tira e põe pela diferença.
  Painel `exLinksEl` (`exLinkEd={id,q}`; botão `#exlk-<id>`; chips `#exlx-`, sugestões `#exls-`, busca `#exlq-<id>`, resultados `#exlr-`), linha `.exlk` "Ligada a:". No tema (aba Questões)
  `exTopicEl(it)` = provas com questões dele ou ligadas (`exForTopic(k)`), com o acerto nelas e "Ver a prova". Teste: `tests/t104.js`.

- Lote 11 (10/2026, incidência revista com o Guia Estatístico ENAMED do INEP): **198 temas** (CM-55…CM-65, CIR-35/36; `INC_NEW` = sem contagem própria em `INC_DATA`, texto "Tema novo" no "Por que esse peso"); `INC_DEF` com os pesos novos; especialidades novas Dermatologia (CM-63/64) e Oftalmologia (CIR-36).
  Psiquiatria dividida: CM-50 "Transtornos do humor, ansiedade e psicoses" + CM-60 Dependência química, CM-61 Alimentares e infância, CM-62 Urgências e psicofarmacologia. Migração `psySplit(out)` no fim de `migrate()` (só com `CM-50` sem `p11`): `PSY_MAP` = índice antigo → [tema, índice novo] para `sd` e `dn`;
  os temas novos herdam `last/step/l/ed` se o CM-50 estava estudado, senão ganham `ing` automático quando recebem subtópico marcado; nunca sobrescreve um tema novo que já exista. FAC: `facPsyMig()` (em `facNormalize`) troca `S:CM-50:<subtópico>` pelo tema novo (`PSY_TXT`, `PSY_REN` para o TDAH) e divide `own.links`. Teste: `tests/t112.js`.
- Estudando e plano em partes (10/2026): `s.ing={d,m:"a"|"m"}` = tema começado (`isIng`, `lvKey` → "i", `lvName`); não tem revisão (`last` só ao concluir).
  `toggleSub` em tema sem `last`: 1º subtópico liga `ing` automático, o último conclui (`last`, `step` 0, `logAct("e")`, `s.pre.ing` permite desfazer no mesmo dia),
  desmarcar tudo tira o automático (o manual fica). Botões de nível `setLevel` (Não iniciado, Estudando, Estudado = começa revisões, Revisado, Dominado); `upd` apaga
  `ing` quando há `last`. `counts()` devolve `c[4]` = em estudo (dentro de `c[0]`); `lvLegend`, `donut`, mapa (`.rmc.li`), filtro `tf.lv` "i", PDF. Cores `--li`/`--mi`.
  Partes: `subParts(L)` (até 6 subtópicos e peso ≤6 = uma parte; senão partes de peso 3–4, `PART_CAP`), `partSubs(it)` → `{subs,pt:[parte,total]}` usado em
  `makeDayPlan` (r-new e `r-cont` "Continuar · Parte 2 de 4"), `adoptTopic` e `weekPreview` (`simStudy`). `buildPlan` põe os temas Estudando (`r-cont`, mais antigos primeiro)
  antes dos novos (que excluem `ing`). Projeção: `partsAvg()` divide a capacidade. `SUBS_PER_DAY`/`subN` agora só vale para revisões e pontos fracos.
- Semana da prova (10/2026): `provaWeek()` = provas da faculdade em até `rvDays()` (= `Math.round(FAC_WIN/3)`, 7 por padrão) com conteúdo válido. Nesses dias o
  `buildPlan` põe o pendente (`r-fac`) e depois `provaRvPicks()` (`r-pfr` "Revisar · prova em N dias"): conteúdo já estudado, até `FAC_RV_MAX`=2 vezes, com
  `FAC_RV_GAP`=2 dias entre elas, menor acerto primeiro (`refAcc`, sem questões = 0,55); e retorna sem `r-new`/`r-cont`/`r-weak`. Revisões feitas ficam em
  `p.rv={ref:[datas]}` na própria prova (vai com `fac`, backup e sync); `provaRvMark` grava (botão `.pfrdone` "Revisei para a prova" e o checkbox da véspera,
  que também conta). Não mexe na revisão espaçada. Vaga sobrando: `li.pweek` com "Ir para as revisões". `replaceOwn` leva `p.rv`. Teste: `tests/t106.js`.
- Cartões do plano (`.pcard`): título com line-height 1,3, `.phint` justificado com hifenização (`lang="pt-BR"` posto no início do script), `.pbody` em coluna
  com gap 8px; no celular (≤560px) o selo `.reason` fica acima do título (`column-reverse`).
  Densos: `s.dn={índice:"u"|"n"|"c"}` e `cs[j].dn` (u = usuário marcou, n = usuário tirou, c = Claude sugeriu e vale até mudar); `subW` = 2 se denso; `setDn`,
  revisão embutida `DN_DEF` = {chave:[índices]} dos 185 temas (vira "c" em `subList` quando não há `s.dn[i]`; `dnPending` ignora temas em `DN_DEF`; 91 temas em partes), `dnBoxEl` no tema (`dnEdit`, selos `.dnb`), `dnSuggest(it)`/`dnSuggestAll()` (lotes `DN_CHUNK`=45 em Configurações › Plano, `dnPending`, `s.dnAt`), `dnApply` nunca troca u/n. Teste: `tests/t88.js`.
- Lotes 6–7 (10/2026): questão com `q.pc` (Ponto-chave), `q.th` (Take home) e `q.fonte` (`exQClean`; `impKCParse` separa; `impPrompt` pede `pontoChave/takeHome/fonte`); `qExplEl` = Por que › `.qpc` › Conceito-chave › `.qth`; Fonte no `exQuestionEl`.
  Erro ganha `e.pc`, `e.dd` (dados decisivos) e `e.q={e,a:[{l,t}],c,m}` (questão completa) via `eNew(...,x)`; `qDraft` → `p:qClueRich` (frase com **negrito**), `dd:qData`, `pc`, `qf`, tipo `confusao` se `qLike`; formulário com `#<pre>d`/`#<pre>k`.
  Tela: `boldFill` (pista), `eExtraBlocks` (`.edd`, `.epc`, `.eqfull` com `eQOpen`); "Para reler hoje" usa `eItemEl` (subitens, `eNameLink` liga a tema/subtópico). Erros não vão mais para a anotação
  (sem `eNoteBtn` nem modelo "Meus erros"); `errNoteMig()` (uma vez por aparelho, `resid-enm`) move as seções "## Meus erros" para o caderno e limpa `e.nt`. Teste t109.
- Lote 12 (10/2026): **referências**: `REF_RULES()` no `fixedFormat` (site = pesquisar na web e trazer `link`; artefato = sem internet, troca questão sem fonte segura); `validQs` guarda `link` (`linkOk`) e, no artefato, descarta questão sem `fonte` (testes antigos: `window.__noRefCheck` ligado no `mockdb.js`); `qFonteEl(q)` = "Referência" + "Abrir a referência" nos quatro lugares; `DEFAULT_PROMPT` sem "conferir na diretriz" (o anterior em `DEFAULT_PROMPT_1026A`, empurrado para `OLD_PROMPTS`); alerta mostrado como "Atenção:".
  **Refazer**: item `{…,due,ok,okd,wr,src:gen|sim|exam}`; `rdAdd(k,q,src)` (due = amanhã), `rdDue`, `rdDueList`, `rdHit` (acerto em dia diferente soma `ok`; `RD_NEED`=2 sai; senão volta em `RD_INT`=[1,3] dias), `rdMiss` (zera, `wr`++), `rdView` (embaralha com `altShuffle`, menos comentário que cita letras), `rdStart(ids)`, filtros `rdF` (`#rdFDue/#rdFAll`, `#rdFSrc`, `#rdFRep`), selo `.rdteim`, aviso `#rdTeim` (wr≥2), fim `#rdEnd` com % e por tema; tela inteira `fullOn.rd` (`resid-rdfull`, `#rdFullB`, teclas A–E/espaço/Esc, só com `twoCols()`); fila do dia passo `redo` (`QSTEPS`, `qCounts().redo` até `RD_DAY`=10, `qGoStep("redo")`); simulado fonte `redo` (`rdSimItems`, item `rd`, `simAnswer` → `rdHit/rdMiss`) e `pick` ("Escolhidos", `simPick`).
  **Corrigir gabarito** (10/2026): depois de errar no Refazer, `#rdFixB` "O gabarito está errado?" → botões `#rdFix-<letra da tela>` → `rdFix(R,x,vl)` (acha a alternativa original pelo texto,
  `x.q.correta` nova, `x.q.fx` = antiga, `x.fd` = dia do 1º erro); era a sua → sai do Refazer e, no gerador/simulado, `addQ(y,0,1,D,"Claude")` + `hist[D].c` no dia do erro; prova na íntegra → `exChange` corrige a prova (`ck`). Aviso `#rdFixed`, nota `#rdFxNote`. Teste: `tests/t118.js`.
  **Seus temas nas questões**: `#qFind` com título novo e a lista `#qlistT` dentro (`qListKeep`); toque no tema (`qOpenK`) abre `qTopicPanel(it)` (`#qtp-<k>`: 8 semanas `.qtpw`, banca/fonte por `qb`, `qTrend`, erros `eAlive`, `exTopicEl`, ações `#qtpGo/#qtpSim/#qtpReg/#qtpErr/#qtpRes-<k>`). Teste: `tests/t113.js`.
- Lote 13 (10/2026): **caderno único**. `freeCard()` = cartão `#nFind` "Caderno" (`#nFCount` = páginas livres + dos temas; `#nImg`, `#frNew`, editor, `#frMsg`, `.ncadhow`), busca única `#frq` (`frQ`/`frQRaw`, também vira `nQuery`),
  tipo `.ntype` `#nTy-all|free|topic` (`nType`, `resid-ntype`), filtros em `#nFBody` (`renderNFlags`; "Temas estudados sem anotação" = chip `#nNoNoteB` `data-nf="nonote"`, sem `#nCover`/`#nFind` antigo), etiquetas `.ntagbar` (`freeTag`, `data-tag`)
  valem para livres e temas. Partes `nSeg` = livre|revisar|pegadinhas ("todas" vira "livre"); `#nTopicH` "Páginas dos temas · N" antes de `#nlist`. Página do tema = `notes[k]`; etiquetas dela em `state[k].tg`
  (`tgOf`/`tgAdd`/`tgDel`, `tgRowEl` no rodapé da página no tema, `#ntg-<chave>`). Página nova (sem id) ligada a 1 tema sem anotação vira a página do tema (`## título` se diferente do nome, etiquetas → `tg`).
  No tema: "Página do tema · também no Caderno"; `freeLinkedEl(k)` = "Outras páginas ligadas" (sempre, logo após `.nfoot`) com `#frlNew-<chave>` e "Editar no Caderno" → `frOpenFor(k,f)`.
  **Tema repaginado** (`renderDetail`): blocos `.dblk` (CSS em `.detail>.grp:not(.notes)`, `.detail` com `container-type`); Estudo = `.drev` (`data-st` late|today|ok|none, `.dpill`, `.dnext`/`.dsub`) › `.dsubs` (`.dpct`, 2 colunas a partir de 640px)
  › `.dduo` (nível `.dlv` + peso `.dinc`, explicações em `details.dhow`, lado a lado a partir de 900px); Questões = `.dperf` "Seu desempenho" (`.dbig` com `data-c`, `.dwk` = `dWeeks(s)` 8 semanas por `qd`, registro) › `.dgen` "Gerar questões com o Claude". Teste: `tests/t114.js`.
- Lote 14 (10/2026): **simulado misto completo**. `SIM_SRC` começa com `pick` "Escolher temas" (sempre visível; `simPickerEl`: busca `#simPq`, área `#simPa`, situação `#simPl-<v>`, incidência `#simPi-3|2`, `simPF`; temas `#spk-<chave>`, subtópicos `#sps-<chave>-<i>` em `simSubs[k]`, chips `#spx-`, `#spClear`, `#spAll`), `redo` = "Questões para refazer".
  "Como vai ser": `#simN-<n>`, dificuldade `simCfg.dif` (`SIM_DIF`, `#simD-`), estilo `simCfg.est` res|inep (`SIM_EST`, `#simE-`; `simStyleTxt(cfg)` entra no `simPrompt`/`simMatPrompt`; INEP = 4 alternativas), resumo `simSummaryEl` (`.simsum`). `sim.cfg = simCfgSnap()`.
  **Material em partes**: `GM_TOTAL`=100 mil no total, `GM_MAX`=30 mil por pedido; `msPack` monta `chunks` (cortados nas marcas "=== Página N ===", `pg` = "material:página") e `figs` numeradas; `msPart(P,j)` = parte do pedido j (texto, figuras das páginas dela até `GM_IMG`, escaneadas na vaga), usado em `generate` e `simStartMat` (`bi`).
  Figuras: `pdfFigPages` (operadores do pdf.js com matriz; imagem ≥150×150 cujo tamanho não se repete em ≥60% das páginas) → `pdfFigImg` (recorta a área das imagens) → `m.figs=[{page,blob}]` (até `FIG_MAX`); página sem texto com figura própria vira figura e vai com a parte da página anterior. Prompt lista "Figura N: arquivo, página X" e pede `"figura"`; `validQs` guarda, `figBind(q,M)` → `q.fg={no,name,page}`; `figEl(q,P,img)` mostra (`.qfig`).
  Erradas: `rdAdd(k,q,src,P)` guarda `x.img` (JPEG pequeno `figSmall`, ≤ `RD_IMG_MAX`) e `q.fg`; some com o item. **Meus simulados**: `sims` (`resid-sims-v1` + Firestore `progress/sims/{id}`, live, backup `data.sims`, `bridge.js` importa, Apps Script `arr("sims")`), `smClean`, `simSave(S)` no fim (`simNext`/Encerrar), `simHistEl` (`#sm-<id>`, `#smv-`/`#smr-`/`#sma-`/`#smd-`, `#smAll`), `simRevEl` (`#smq-<id>-<i>`), `simRerun(x)` (`sim.rerun`: não conta no acerto nem no Refazer; soma `hist[d].rq`, que `qWeekQ(...).g` usa na meta semanal), `simAgain(x,U)`. Teste: `tests/t115.js`.
- Lote 15 (10/2026): **provas na íntegra**. Temas: `impTemaScores` ignora palavras genéricas `IMP_GEN` ("clínica", "conduta"…), usa sinônimos `IMP_SYN2` (trombocitopenia→plaquetopenia, coagulopatia/hemostasia/TTPA→coagulação) e siglas (PTT, CIVD…), radical para palavras longas;
  `impTemas(list,ctx)` devolve até 3 chaves por questão (2º tema ≥55% do 1º dentro da especialidade da prova, ≥80% fora; 3º ≥75%), com o assunto da prova = cabeçalho antes da 1ª questão + nome do arquivo sem o código hex; título sem "[Clínica]"/"| Clínica".
  Questão com `ks` (temas extras, `exKs`, até 2): `exContrib` soma contribuições `x:1` (inteiras no tema, fora do `hist`), `exForTopic` inclui; Conferir: chips `#exkx-<pre>-<i>-<chave>` (×) e `#exka-<pre>-<i>` "+ outro tema" (`C.setTopic(i,k,add)`/`C.delTopic`); Claude devolve `"temas":[…]`.
  Gabarito: `parseKey` com 3+ "RESPOSTA N — Correta" usa só o comentado; `impKey` junta as páginas de gabarito antes de decidir (sem "17 E" fantasma de "t(15;17)").
  Figuras: `impPick` guarda `R.figs` (`pdfFigPages`); `impSave` (async, `R.saving`) → `impFigAssign` (página com 1 questão; com várias, `pdfQHeads` = posição do "Questão N" acima da imagem; imagem no alto = questão da página anterior) → `pdfFigImg` → `exfData` (≤ `EXF_MAX`) → `exfPut`;
  questão com `fg:1`; `exFigs` (`{id:"<prova>_<i>",ex,i,img}`) no IndexedDB "nexus-figs" (`idb`, `idbDo`) + Firestore `progress/exfig/{id}` (`exFigStore`, carregado no login; sem live), `exFig(ex,i)` busca e redesenha, `exfPurge` (prova fora de `exams` e da lixeira), backup `data.exfigs` (`bridge.js` importa; Apps Script `arr("exfig")`).
  Refazer e refazer de Meus simulados somam `hist[d].rq` (meta semanal). Teste: `tests/t116.js`.
- Lote 16 (10/2026): **catálogo de provas** no Perfil (`exEditorEl`). `EX_CAT` = [{n,r,uf,b,m,v?,o?,x}] (r em `EXC_REG` NAC|NE|N|CO|SE|S; m = mês habitual, 0 = não informado; b = banca, "" = não informada; v = seleção pelo ENARE; o = "Outras"; x = palavras de busca), pesquisa de 10/2026 (Medway, MedCof, BIP, Estratégia). O usuário mora em Natal: Nordeste abre primeiro e o HUOL/UFRN (pelo ENARE) é o 1º.
  Sugestões ao digitar `.exsug` (`excFind`, botões `#exs-<id>-<j>`, `excQ` guarda o texto; `excJust` evita o `change` do campo desfazer a escolha), `excPick(id,c)`/`excAdd(c)` põem o nome e a data estimada `excDate(m)` (dia 15 do próximo mês habitual) com `est:1` (`uiSanitize` guarda; trocar a data apaga), nota `.exnote`; painel `#pfExCat` → `excPanelEl` (`#excPanel`, região `#excR-<r>`, `excReg`, linhas `.excrow`, `#excA-<índice>`). Teste: `tests/t117.js`.
- Lotes 8–9 (10/2026): aba **Caderno** (rótulo; a view continua `notas`): partes `nSeg` = livre (padrão)|todas ("Temas")|revisar|pegadinhas (localStorage `resid-nseg2`), caderno livre em `#nFreeBox.ns-free`
  no topo (no computador tudo numa página), com "📷 Ler imagem" (`#nImg`, `#nImgBox`) e busca própria `#frq` (`frQ`). Em toda questão respondida (gerador, simulado, Refazer, prova): `qActsEl(q,mine,{k,src,tok})`
  (estado em `qActS` WeakMap) = "Levar para a anotação" (`qPoints` → lista marcável `.qpick`, `#qp-<id>-<ponto>`, `#qpgo-<id>`; `conNote` grava em "## Conceitos das questões" com o selo `{{q:…}}` só nas provas,
  nas outras a origem e a data) e "Criar cartão" (`qCardDrafts` → `cdErrEl` com erro virtual `virtual:true, okq`; `cdErrSave` não liga a erro). Simulado: "Encerrar" = `#simEnd`. Teste t110.
- Lote 17 (10/2026): **enxugamento**. Revisões: `reviewTopic(k,g,o)` com g 0 Esqueci (`revNext`: step−2, mín. 0) · 1 Difícil (mesmo step) · 2 Lembrei (step+1; lembrou depois do previsto → sobe até `INT[n]`≥ dias passados);
  `true/false` antigos = 2/1; `s.rg` = última resposta; botões `revBtns(k)` (`#rg<g>-<chave>`, dias por `revPreview`). `qAutoRev()` no início de `render()`: tema vencido com ≥`QREV_MIN`=5 questões hoje (`qd[hoje]`) é revisado sozinho
  pelo acerto (≥75% 2 · ≥50% 1 · senão 0; `s.ar={d,a}`; selo "questões N%" em Revisadas hoje). Ordem `revPri` = peso × (atraso+1) (`revScore`) em revisões, plano, `nextSteps`, Foco.
  Freio `revBrake()` (atrasadas `dueIn<0`: >`REV_BRAKE1`=20 → 1 tema novo/continuar; >`REV_BRAKE2`=40 → 0; `addN` no `buildPlan`), aviso `#pBrake` e tempo `#pEst` (`qMinutes`/`planMinutes`, `MIN_EST`) no `planDayEl`.
  Uma agenda por questão: `rdForget(k,q)` ao salvar no caderno pelo `eCadEl` (tira do Refazer); `eByCard(e)`/`eDueNow(e)`: erro com cartão (`eid`/`e.cd`) não entra em `eDueList` nem no filtro "due" ("Revisado pelos cartões").
  Reler = parte da revisão: `rereadEl(k)` (`.reread`, `rrOpen`, "Ver todas as anotações do tema") no `.rcard` e no plano `r-cont`; fila `QSTEPS` sem "notes" (`qCounts().notes`=0); `nTodayCard` não é mais usado (Caderno › Revisar = cartões + `#nNoLine`).
  Início: placar sem "Revisões" (tiles Plano · Questões na semana · Foco na semana), saudação com o tempo da fila, `#iQueue` com "N itens · ≈ tempo"; `iHidden()` padrão `["iStats"]`; `renderNavExtra` só com o modo provas;
  domingo/segunda um cartão só `wpNoticeEl` (`#wpNotice` no slot `#iWeek`: `.wpsum` cumpriu/atrasou/melhorou + planejar; `iWeekCard` sem uso). Meta única `ui.prefs.hgoal`: `foDG()` = semanal ÷ `foStudyDays()` (substitui `fgoal`;
  `fwgoal` migra para `hgoal` no `uiSanitize`), sem os seletores do Foco (`#foGoal` é texto + `foGoalLink`). "Próximos dias" = `renderAgenda` (`renderAgenda0` + `weekEl` `#agWeek`). "Onde focar": `focusScore`/`focusRank`
  (peso² × distância de 80%, sem questões = 60%) no simulado (fonte `gain` "Onde focar"; `weak` antigo vira `gain`), na ordem `qChSort` gain, nas Estatísticas e na lista de Questões (`qListAll`, `QLIST_TOP`=10, `#qAllT`/`#qTopT`, `.q2c` 2 colunas);
  Fila do dia no tempo do dia: `revCapToday` (até `QUEUE_SHARE`=½ do tempo, mín. `QUEUE_MIN`=20 min, mín. `REV_DAY_MIN`=3 revisões) → `qCounts().revs` = mín(vencidas, teto − revisadas hoje), `revAll`/`revCap`, "cabem hoje N" no `#revmeta`, `.iqmore` na fila; `MIN_EST` revisão 5, erro 1,5, refazer 2, cartão 0,25 min. Auditoria 26/10: orçamento `qBudget()` com revisões primeiro (`QUEUE_REV`=70%, `revCapToday()`), depois erros (mín. 3), cartões (mín. 10) e Refazer com o que sobra (`errAll/cardAll/redoAll` na fila); Refazer expira `rdExpire()` (vencida há `RD_EXP`=21 dias sem ser feita; aviso `#rdExpNote`, `resid-rdexp`) e da prova na íntegra só entram temas estudados (`rdStudied`); erro formado `e.fm` (acertou no degrau de 30 dias; `eDueNow` ignora; `eNew` no mesmo tema reativa); `adaptF` não encurta mais por acerto baixo. Falha 1 da auditoria: ponto fraco saiu do plano e foi para a fila (`QSTEPS` "weak", `weakToday()` guarda `dayPlan.wk={d,k,q0}`, 1 tema por dia pelo `focusRank`, 5 questões; `weakLeft()` marca `s.wkd` e o tema descansa `WEAK_REST`=7 dias; não entra em folga, modo provas nem semana de prova); `isWeak` usa o acerto dos últimos 30 dias (`accRecent`, mín. 5 questões), senão o acumulado; `buildPlan` não gera mais `r-weak` (o dia de 30 min mostra o ponto fraco em `#pLight`). Simulação de uso: `tests/sim17.js <normal|pausa|curto|intenso> [dias] [base]` (não é teste). `qGainCard` e `eRepCard` saíram (selo `.erep` em Onde melhorar). Teste: `tests/t121.js`.
- Backup automático no Google Drive: `tools/backup-drive.gs` + `tools/appsscript.json` (Apps Script na conta do usuário, gatilho diário às 3h;
  lê o Firestore por REST com o token do dono do projeto e `X-Goog-User-Project`, só leitura; monta o MESMO objeto do `buildBackup()`, tira `updatedAt`
  das prefs; pasta "Nexus - Trilha Médica (backups)" com escopo `drive.file`, guarda 30). Restaurar = Importar backup do site. Instalação em
  `tools/backup-drive-LEIA.md`. **Mudou o formato dos dados ou um campo novo no `buildBackup` → atualizar o script** (teste `tests/t87.js` compara os dois).

## Cuidados

- Mudança no formato dos dados → migração automática (veja `migrate()` e `SUB_PERM`).
- Firestore não aceita `undefined` nem arrays dentro de arrays.
- Login: Google (popup, só fora do app instalado) e e-mail/senha. No iPhone/iPad instalado na tela inicial o popup falha;
  contas Google criam uma senha em Conta › Criar senha (linkWithCredential) e usam e-mail/senha no app instalado.
