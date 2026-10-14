# Nexus - Trilha Médica — Checklist Residência Médica

Marca (desde 10/2026): nome **Nexus - Trilha Médica**; símbolo dourado (fita + ponto) em SVG inline no `h1.brand` (`.blogo`, dourado por tema em `--lg1/2/3`)
e ícones em `icons/`. Paleta: claro = off-white `#f3f0e9`, azul-marinho `#16264a` (`--accent`), dourado `--gold`; escuro = `#0a1121` com dourado `#cfab63`
como `--accent`. Fontes: Cormorant Garamond (`--display`, títulos) e Manrope (`--body` e `--mono`). Teste da marca: `tests/t79.js`.

Checklist de estudos para residência médica (185 temas, plano do dia, revisões espaçadas,
faculdade, questões, anotações, caderno de erros, foco). Abas: Início (view `inicio`, padrão), Residência (view `temas`),
Faculdade, Questões, Anotações, Foco, Erros; no celular Anotações e Foco ficam em Mais (view `mais`, `#tabM`). Existe em duas versões com o MESMO código:

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
- Faculdade: `fac.discs[]` = {name, info:{tipo,ch,prof,tutor,horario,local,ementa,objetivos}, items (conteúdo avulso antigo),
  eixos:[{id,name,area,spec}], sps:[{id,name,eixoId,items:[ref],objs:[texto]}]}; `sem.lv` renomeia os níveis.
  Refs: `T:<chave>` tema da residência, `S:<chave>:<subtópico>`, `O:<id>` tema da faculdade (progresso em `F-<id>`).
  O eixo define área/especialidade dos temas FAC (`ownPlace`), que aparecem na aba Temas com selo FAC e não contam no % dominado.
  Objetivos da SP viram subtópicos (`cs` com `fac:<id da SP>`) do primeiro tema ligado (`syncObjs`).
  "Colar ementa": `ementaPrompt` → `sample.json` → `ementaParse` (revisão) → `ementaApply` (junta por nome, sem duplicar).
- Backup: JSON `{app:"checklist-residencia", format:1, exportedAt, data:{topics,hist,plan,notes,noteAt,errors,fac,prompt,sort}}`.

- Início: os cartões "Estudar hoje" (`.card.today`) e "Revisões" (`.card.revs`) são os mesmos nós da aba Residência;
  `placeShared()` os move para `#iToday`/`#iRevs` quando a aba Início está aberta e de volta ao abrir a Residência.
  Placar do dia `#iBoard` (`renderInicioBoard`), próximo passo `nextSteps()`/`startStep()` (liga o Foco no tema), projeção `projEl()`
  dentro de `#iMeta` (temas não vistos × `hist[d].e` das últimas 4 semanas). Cartões do plano (`planOpen`) e das revisões (`revOpen`)
  ficam recolhidos e abrem sozinhos quando começados.
- Residência: filtros `tf` (`renderTFilters`, `matches`; situação `tf.lv` por `tfLevel`, atalhos, área/especialidade), tema em abas
  (`renderDetail` marca `data-tab` = estudo|questoes|notas|erros; `detTab[k]`; `detGet(pre,k)` abre a aba antes de focar um campo),
  agenda `#revAgenda` (`renderAgenda`, `agBalance`) e marcação em lote `bulk` ("Já estudei antes"). Ajuste de data da revisão:
  `s.adj` (dias) vale só enquanto `s.adjFrom===s.last` (`dueIn`); `upd` apaga o ajuste quando `last`/`step` mudam.
  Mapa `#resMap` (`renderResMap`), sugestões de nível `#lvSug` (`lvSuggestions`: `lvMeets` sobe, `lvDrop` desce; `s.lvDis` = dispensado
  por 14 dias), linha do tema com acerto colorido e foco (`foTot`), barra fina de subtópicos no gráfico por área.
  Prévia da semana `weekPreview()` (simula 6 dias com `dayOff`, que desloca `today()`; clona e restaura `state`) em `#weekBox`;
  temas fixados `s.pin` (`togglePin`, `#pinBox`, filtro `tf.pin`).
- Faculdade em pastas: semestre (`facOpenSem`, + Disciplina em `facNewDiscFor`) › disciplina (`facOpenDisc`; + Conteúdo em `facAddC`
  guarda em `d.items` ou numa SP; "Organizar" = `facEditDisc`) › eixo › SP;
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
  (`addQ(...,src)`; geradas = "Claude"; `qSrcCard`).
  Partes no celular/tablet em pé: `qSeg` = resumo|praticar|temas (`#viewQuest[data-qseg]`, classes `.qs-res/.qs-prac/.qs-tem`, `setQSeg`).
  Simulado misto `sim` (`qSimCard`, `simStart` com `simPrompt` multi-tema, `simAnswer`); ritmo em `hist[d].ts/tq` (`logPace`, `qPaceEl`,
  meta `ui.prefs.qpace` em segundos).
- Anotações (view `notas`): partes `nSeg` = revisar|pegadinhas|todas (`#viewNotas[data-nseg]`, classes `.ns-rev/.ns-peg/.ns-all/.ns-ctl`).
  "Para reler hoje" (`nTodayCard`, `s.nread`), pegadinhas `pegOf(k)` (linhas "> ", ==destaque==, seção "Pegadinhas"), cobertura
  `noNoteKeys()`/`nNoNote`, cartões `cards` = [{id,k,q,a,box,due,n,ok,src}] (`resid-cards-v1` + Firestore `progress/cards/{id}`,
  `cardsBlock` no tema, `cdGenerate` via `sample.json`, revisão Leitner `CD_INT` em `nCardsCard`; backup `data.cards`).
  Filtros extras `nFlags` (week|peg|tab|cards, `nFlagOk`) e ordem `nSort`; erros junto `noteErrsEl(k)`; PDF `notesPDF(keys,free)`;
  caderno livre `freeN` = [{id,t,b,tags,ks,at}] (`resid-free-v1` + Firestore `progress/free/{id}`, `freeCard`/`freeEditor`,
  `freeLinkedEl(k)` dentro do tema; backup `data.free`).
  Markdown: links `[t](url)` e URLs soltas em `inl`; bloco ```fluxo → `flowHTML` (etapas, "? decisão", caminhos recuados "Rótulo: a → b").
  Ler imagem: `imgR`/`imgPanel`/`imgRun` (`sample(prompt,{images:[blob]})`, imagem reduzida em `imgShrink`; não é salva) → `imgSave`
  na anotação do tema ou no caderno livre. O artefato declara `sample:{images:true}`; no site, `bridge.js` pede para anexar a imagem.
- Foco (view `foco`, `renderFoco`): pomodoro/cronômetro. Sessões em `foSess` = [{id,d,s,sec,m:"p"|"c"|"x",ref:"T:<tema>"|"D:<disc>"|"",lab}],
  localStorage `resid-focus-v1` e Firestore `progress/focus/{id}` (`focStore`, mescla por id como os erros). Relógio em andamento
  `foRun` só no aparelho (`resid-focus-run`, conta por horário de início). Preferências `ui.prefs.fw/fb/fsnd/fgoal/fwake`.
  `foMat` agrupa por especialidade/disciplina; entra no PDF (`R.Fo`) e no backup (`data.focus`). Pílula `#foPill` fora da aba.
  Depois da sessão: `foAfter` ({k,sec,d,id}, localStorage `resid-focus-after`, `foAfterSet` em `foTick`/`foFinish`) → `foAfterCard` (subtópicos via
  `toggleSub`, Estudei/Revisei, questões). Vínculo rápido `foQuickEl`. Ciclos `foSeries` (`resid-focus-series`, zera após 1 h) e pausa longa
  `ui.prefs.flong/fevery` (`foRun.lb`), bolinhas `foDotsEl`. Distrações `foRun.dist` → sessão `dz`. Ruído `ui.prefs.fnoise` w|b|r e `fvol`
  (`foNoiseSync` no fim de `render()`, WebAudio). Tela inteira `fullOn.fo`. Mapa `foHeatCard` (12 semanas + melhor horário), `foWeekExtra`
  (meta semanal `ui.prefs.fwgoal` em minutos, recorde, distrações). Layout: `.focol` (esquerda: depois, relógio, sessões; direita: semana, mapa, matéria).

- Erros (view `erros`): objeto do erro `{id,k,w,r,t,s,d,rev,lastRev,box,due,miss,lastMiss,cd,nt}`. Revisão ativa `eRevCard`/`erRun`
  (`E_INT=[1,3,7,15,30]`, `eAnswer`; `eDue(e)` calcula a data para erros antigos sem `due`), registro `eRegPanel`/`eReg` e
  `errFormEl(D,pre,onSave)` + `eNew` (também usados por `eCadEl` no simulado e no Refazer, com `qDraft`), `eRepCard`/`eRepeat`
  (mesmo tema ≥2 em 30 dias; `miss`≥2), `eWeeksEl` (8 semanas por tipo), `eCardBtn` (→ `cdAdd`, guarda `cd`) e `eToNote`
  (seção "## Meus erros" da anotação, marca `nt`). Próximo passo do Início: `kind:"errs"`.
  Também: causa `e.c` (`ECAUSES` por tipo, dicas `ECTIPS`, "Por que você erra"), arquivar `e.arch` (`eArchive`; arquivados saem de
  `eDueList`/`eRepeat`), filtros `#eMore` (`renderEMore`: `eFlags` due|rep|nocard|arch, `ePer`, `eSrc`, `eCause`; `eExtraOk`), ordem
  `eOrder` sp|new|due|miss, PDF `errosPDF(eVis)`/`ePdfSave`, simulado `simCfg.src="errs"` (`eSimItems`, questão com `err` → `eAnswer`).
  O selo `#ecount` mostra os erros para revisar hoje.
  Em duas colunas (`data-cols=2`, tablet/desktop): `.eside` (eTop + Onde melhorar) à direita, filtros e lista à esquerda; no celular `.side` é `display:contents`.
  Revisão em tela inteira: `erFull` (localStorage `resid-erfull`, `erFullSet`), classe `#viewErros.erfull` só com `erRun`; atalhos espaço/1/2/Esc.
  Igual nos cartões e no simulado: `fullOn.cd/sim` (localStorage `resid-cdfull`/`resid-simfull`, `fullSet`, `fullBtn`), `applyFull()` no fim de `render()`
  marca `.vfull` na aba e `.fullhide`/`.fullpath` nos irmãos/ancestrais do cartão; só vale com `twoCols()`.

- Saudação do Início `#iHero` (`heroCard`, primeiro de `ICARDS`; `iOrder` põe no topo quem tinha ordem salva): `heroHi` (hora), `heroSummary(qCounts())`,
  `heroExam` (prova principal + prova da faculdade em até 7 dias), `heroLine` = feito real (`heroFeats`: sequência `heroActive`, questões de ontem, especialidade
  que subiu ≥10 pontos, ≥5 h de foco na semana) ou `HERO_FRASES[dnum % 60]`. Botão `#heroGo` (fila: `qStart`/`qGoStep`; sem pendência: `startStep`);
  com a saudação visível, `iQueueCard` não mostra `#iqGo`. Em duas colunas `.icol{order:50}` deixa saudação e placar no topo. Classes `.herobtn` (`.hbtn` já é do cabeçalho). Teste: `tests/t84.js`.
- Semana de estudos: `ui.prefs.wnew/wsim/woff` (dias 0=domingo; `applyUI` → `WK_NEW/WK_SIM/WK_OFF`; editor `weekCfgEl` em Configurações › Plano, ids `#wk-<pref>-<dia>`).
  `wdOf(dnum)`, `isOffDay/isNewDay/isSimDay`, `offShift`, `nextStudyLabel`, `newDaysWeek`. `dueIn` empurra a data que cai na folga para o próximo dia de estudo e,
  no dia de folga, nada vence. `buildPlan`: folga = vazio; dia sem temas novos = sem `r-new`. Folga zera `qCounts`/`nextSteps`; dia de simulado põe passo `sim` (n=20)
  ou `exam` (prova na íntegra por fazer) no topo. Prévia (`weekEl`) marca folga; projeção usa `newDaysWeek`. Teste: `tests/t85.js`.
- Barra lateral de altura inteira (computador e tablet com `data-cols=2`): `.appnav` fixa à esquerda (`--sbw` 248px; `body` com recuo), slots `#sBrand`/`#sSearch`/`#sfProf`/`#sfCfg`;
  `placeSide()` (em `renderHead` e num `MutationObserver` de `data-layout/data-cols`) move os MESMOS nós (`h1.brand`, `#srchBtn`, `#profBtn`, `#cfgBtn`) e devolve ao `header`
  nas outras telas; o `header` fica escondido. Rodapé `#sFoot` com `#sfWho` (nome, abre Perfil). Teste: `tests/t86.js`.
- Geral (módulo antes de `function render(){`): fila do dia `dayQ` (`resid-dayq`; `QSTEPS` erros→cartões→anotações→temas, `qStart`/`qNext`/`qStop`,
  cartão `#iQueue`, barra fixa `#qBar` classe `.dqbar` — `.qbar` já é a barrinha das linhas de Questões), avisos `iNoticeEl` (artefato: `resid-artnote-v1`;
  backup: `resid-lastbk` gravado por `markBackup()` no Exportar, `resid-bksnooze`), resumo da semana `iWeekCard` (domingo/segunda, `resid-wkdis`),
  Início personalizável `ICARDS`/`applyICustom` (`ui.prefs.ihide`/`iorder`), busca `gsResults`/`renderGSearch` (`#srchBtn`, Ctrl+K, "/"),
  primeiros passos `renderOnb`/`maybeOnb` (só conta vazia, uma vez: `ui.prefs.onb` + `resid-onb-seen`; testes ligam com `window.__wantOnb`),
  calendário `icsBuild`/`icsSave` (.ics), Anki `ankiSave("cards"|"errs")` (.txt com tabulação), ajuda `goHelp(título)`/`helpBtn(título)` (botão "?").
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
- Intervalo ajustado pelo acerto: `interval(s)` = `INT[step]` × `adaptF(s)` (a partir de step 1; acerto das questões do tema nos últimos 90 dias,
  mín. 5, `adaptAcc`): ≥85% (mín. 8) ×1,4 · ≥75% ×1,2 · <65% ×0,75 · <50% ×0,5. Não vale com ajuste manual ativo (`adj`). Pref `ui.prefs.adapt`.
- Temas na conta: um documento por tema em `progress/topics/{chave}` (`topicStore`, `saveTopics` grava só o que mudou via `tSaved`);
  `progress` guarda `{version:3,split:true,hist,plan}`. Conta antiga (v2, `topics` no documento) migra sozinha; se uma versão antiga do app
  regravar v2, a carga junta os dois ficando com o registro mais novo (`tNewer`).

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

- Faculdade ligada à Residência sem substituir: `fac.own[id].link={k,subs}` (`subs` vazio = tema inteiro). `ownLink(id)`/`RESKEY`/`ownLinksTo(k)`;
  `facNormalize` descarta ligação inválida; `registerOwn` não registra o `F-<id>` de quem está ligado (o progresso é o do tema, um registro só).
  `refTopic("O:id")` ligado devolve `{k:<tema>,own:id,subs}`: `refLabel` mostra o nome da faculdade, `itemStudied` exige os `subs` marcados,
  `facTopicRow` mostra selo "FAC ↔ RES". Ligar: `linkPickEl` (dentro de `dupBox`; busca `searchBox(null,{link:id})`, depois Tema inteiro ou
  subtópicos) → `linkOwn` (usa `ownMergeInto`, o mesmo de `replaceOwn`: notas sem ir à lixeira, erros, cartões, refazer, foco, progresso).
  No tema: `linkInfoEl` ("Na faculdade", marcar subtópicos, Trocar ligação, `unlinkOwn`). Teste: `tests/t82.js`.

- Provas na íntegra (aba Questões › Praticar, `qExamCard`, logo após o simulado): importar PDF/fotos (`impNew`/`impPick`/`impRead`/`impSave`, estado `imp`).
  pdf.js 4.10.38 carregado sob demanda por `import()` (`pdfLib`: jsdelivr legacy `PDFJS`, reserva cdnjs `PDFJS2`; roda sem worker via `globalThis.pdfjsWorker`);
  texto por página (`pdfPageText`), página com <60 caracteres = escaneada (`pdfPageImg` → JPEG em `sample` images; no site pede para anexar o PDF).
  Gabarito: `parseKey` ("1-A", "01. B", tabela, ANULADA → "X"), páginas achadas por `keyPage`, PDF à parte (`impKeyFile`) ou colado; `impPrompt` leva gabarito,
  lista de temas e o texto; partes `impBlocks` (artefato 11 mil caracteres/5 págs, 2 em paralelo; site 24 mil/10 págs), falha divide a parte; `impGaps`/`impGapPages`
  = Procurar de novo. Questão `{n,p,pe,k,q,g:"b"|"c",an,im,ck}` (sem embaralhar; `ck` = letra para a qual o comentário foi escrito).
  Dados: `exams` (questões; `resid-exams-v1` + `progress/exams/{id}`) e `exProg` (respostas `{id,i,mode,fin,tries,a:{idx:{l,d,s}},h}`; `resid-exprog-v1` +
  `progress/exprog/{id}`, gravado com atraso `exPSave`/`exFlush`). Contagem no tema/banca/hist só por `exChange` (resposta, gabarito colado `exKeyEl`, anular, tema):
  tira o que contava antes e põe o novo. Jogador `exRun` (`exPlayEl`, modo prova "p" ou estudo "e", resultado `view:"res"`). Lixeira `exam`, backup `data.exams/examProg`.
  `bridge.js`: `sample` aceita `opts.title`/`opts.hint`. Teste: `tests/t83.js` (gera um PDF de verdade com pdf-lib/sharp).

- Backup automático no Google Drive: `tools/backup-drive.gs` + `tools/appsscript.json` (Apps Script na conta do usuário, gatilho diário às 3h;
  lê o Firestore por REST com o token do dono do projeto e `X-Goog-User-Project`, só leitura; monta o MESMO objeto do `buildBackup()`, tira `updatedAt`
  das prefs; pasta "Nexus - Trilha Médica (backups)" com escopo `drive.file`, guarda 30). Restaurar = Importar backup do site. Instalação em
  `tools/backup-drive-LEIA.md`. **Mudou o formato dos dados ou um campo novo no `buildBackup` → atualizar o script** (teste `tests/t87.js` compara os dois).

## Cuidados

- Mudança no formato dos dados → migração automática (veja `migrate()` e `SUB_PERM`).
- Firestore não aceita `undefined` nem arrays dentro de arrays.
- Login: Google (popup, só fora do app instalado) e e-mail/senha. No iPhone/iPad instalado na tela inicial o popup falha;
  contas Google criam uma senha em Conta › Criar senha (linkWithCredential) e usam e-mail/senha no app instalado.
