# Trilha Médica — Checklist Residência Médica

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
3. Teste no celular (390px, toque), tablet (820/1180, toque, inclusive 578px com tela 1180×820 =
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
- Dados no Firestore: `data/users/{uid}/progress` (topics, hist, plan), `/faculdade`, `/settings`,
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

- Erros (view `erros`): objeto do erro `{id,k,w,r,t,s,d,rev,lastRev,box,due,miss,lastMiss,cd,nt}`. Revisão ativa `eRevCard`/`erRun`
  (`E_INT=[1,3,7,15,30]`, `eAnswer`; `eDue(e)` calcula a data para erros antigos sem `due`), registro `eRegPanel`/`eReg` e
  `errFormEl(D,pre,onSave)` + `eNew` (também usados por `eCadEl` no simulado e no Refazer, com `qDraft`), `eRepCard`/`eRepeat`
  (mesmo tema ≥2 em 30 dias; `miss`≥2), `eWeeksEl` (8 semanas por tipo), `eCardBtn` (→ `cdAdd`, guarda `cd`) e `eToNote`
  (seção "## Meus erros" da anotação, marca `nt`). Próximo passo do Início: `kind:"errs"`.

## Cuidados

- Mudança no formato dos dados → migração automática (veja `migrate()` e `SUB_PERM`).
- Firestore não aceita `undefined` nem arrays dentro de arrays.
- Login: Google (popup, só fora do app instalado) e e-mail/senha. No iPhone/iPad instalado na tela inicial o popup falha;
  contas Google criam uma senha em Conta › Criar senha (linkWithCredential) e usam e-mail/senha no app instalado.
