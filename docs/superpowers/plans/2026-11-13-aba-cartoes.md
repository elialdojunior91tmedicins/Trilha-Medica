# Aba Cartões: plano de execução

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** tirar os cartões do Caderno e dar a eles uma aba própria (Hoje · Todos · Números): criar rápido, lista com filtros e editor,
suspender, ações em vários, histórico de cada revisão e estatísticas.

**Architecture:** o app é um script global único, montado de `src/app/js/**` em ordem de caminho. `100-cartoes.js` vira a pasta
`100-cartoes/` com três arquivos:
- `010-base.js`: o arquivo atual, movido sem mudar a ordem;
- `020-dados.js`: funções puras novas;
- `030-aba.js`: as telas novas.

A aba é a view `cartoes`, com a seção `#viewCards`, a aba `#tabC` e as partes `cSeg`. O resto do app chega nela por uma função só, `cdOpen(seg,o)`.

**Tech Stack:**
- JS do navegador sem biblioteca;
- testes unitários com `node:test` (`tests/unit/load.js`);
- testes de tela com Playwright (`tests/tNN.js`, `mockdb.js`, `preview.html`);
- build com `python3 src/build_site.py`.

**Spec:** `docs/superpowers/specs/2026-11-13-aba-cartoes-design.md`

## Global Constraints

- **Onde mexer:** edite só `src/app/`, nunca `index.html`. Depois de cada mudança, `python3 src/build_site.py`.
- **Dados:**
  - Firestore não aceita `undefined` nem listas dentro de listas, então `rv` é uma lista de objetos `{d,g,i}`;
  - no máximo **30** revisões por cartão (`CD_RV_MAX=30`).
- **Aparelhos:** nada de rolagem lateral a 390 px. Teste no celular 390 (toque), tablet 820/1180, iPad dentro do Claude 578 (tela 1180×820), notebook 1366 e monitor 1920.
- **Cores:** só pelas variáveis (`--accent`, `--gold`, `--ink`, …), nos temas claro e escuro.
- **Palavras da tela**, exatas:
  - aba "Cartões";
  - partes "Hoje", "Todos", "Números";
  - botões "+ Novo cartão", "Salvar e criar outro", "Criar N cartões", "Suspender", "Reativar", "Trocar de tema", "Selecionar", "Ver os N cartões";
  - títulos "Cartões que você mais esquece" e "Quanto você lembra";
  - aviso de poucos dados: "Poucas revisões registradas ainda (o histórico começou em DD/MM/AAAA)."
- **Números fixos:**
  - "lembrou" = resposta 2, 3 ou 4, contando só os cartões que estavam em revisão (`f.st===2` antes de responder);
  - maduro = intervalo de 21 dias ou mais (`CD_MAT=21`);
  - meta 90% (`CD_GOAL=.9`);
  - "mais esquecido" = `f.lapses>=4` (`CD_LEECH=4`);
  - repetido = 80% ou mais de palavras em comum (`CD_DUP=.8`);
  - poucos dados = menos de 20 revisões no período;
  - calendário de 6 meses;
  - lista de 50 em 50.
- **Treino extra** (`cdRun.extra`) não grava histórico.
- **Suspenso** (`x.su=1`) fica fora de:
  - `cdDue`, `cdForecast`, `cdReady`, `cdGenIds`, `cdSliceIds`;
  - a contagem da árvore;
  - `eByCard` (o erro volta à revisão de erros);
  - a contagem de cartões vencidos do Início (`120-inicio.js:53`) e as "Cartões da SP" da grade (`060-faculdade/030-grade.js:99`).

## Review Focus

- **Dados antigos:** cartão sem `rv`/`su` vindo da conta, do backup ou de outro aparelho com a versão antiga. Deve carregar igual, e salvar não pode
  apagar o `rv` que o outro aparelho gravou. O cartão vai inteiro, então o mais novo vence, como hoje. Teste em `cartoes.test.js` (`cdClean` mantém
  `rv` e `su` e descarta lixo).
- **Exportar para o Anki** com cartões novos selecionados: no .apkg eles têm de ir como novos (`type 0`, `queue 0`), não como revisão com intervalo 0.
  Teste unitário do `apkgCardRow`.
- **Celular com a revisão aberta e a barra trocada:** o atalho da fila do dia, "Revisar cartões", abre a aba e começa a revisão. A tela inteira (`fullOn.cd`)
  funciona na view nova. Teste em t154.
- **Teclas 1–4 com o editor aberto:** digitar "3" na pergunta não pode responder o cartão. Teste em t154.
- **Caderno salvo em "revisar"** (`resid-nseg2`): ao abrir, cai em "livre" sem erro. Teste em t154.

---

### Task 1: Pasta `100-cartoes/`, histórico e suspenso

**Files:**
- Move: `src/app/js/100-cartoes.js` → `src/app/js/100-cartoes/010-base.js` (`git mv`, sem mudar linhas antes de compilar)
- Create: `src/app/js/100-cartoes/020-dados.js`
- Modify: `010-base.js` (`cdClean`, `cdAnswer`, `cdDue`, `cdForecast`, `cdReady`, `cdGenIds`, `cdSliceIds`, `cdCounts`, `apkgBuild`), `110-erros/010-dados.js:43` (`eByCard`), `120-inicio.js:53`, `060-faculdade/030-grade.js:99`
- Test: `tests/unit/cartoes.test.js` (novo)

**Interfaces:**
- Produces:
  - `CD_RV_MAX=30`, `CD_MAT=21`, `CD_GOAL=.9`, `CD_LEECH=4`, `CD_DUP=.8`;
  - `cdLive(x)→bool` = `!!BYKEY[x.k]&&!x.dr&&!x.su`;
  - `cdLog(x,g,days,wasRev)`: põe `{d:today(),g,i:days}` em `x.rv` (`r:1` quando `wasRev`) e corta para 30;
  - `cdAnswer` chama `cdLog` antes de `cdPut`;
  - `apkgCardRow(x,cid,nid,sec,crt,pos)→array` (a linha da tabela `cards`): novo `[…,type 0,queue 0,due pos,ivl 0,factor 0…]`, em revisão como hoje.
- `rv` item: `{d,g,i,r?}` (`r:1` = estava em revisão; é o que entra no "quanto lembra").

- [ ] **Passo 1:** `git mv` e build. `python3 src/build_site.py && tests/run.sh --rapido` passa (a ordem não mudou).
- [ ] **Passo 2:** testes que falham em `tests/unit/cartoes.test.js`:
  - `cdClean` mantém `rv` (corta para 30 e descarta item sem data ou com `g` fora de 1–4) e `su`;
  - `cdAnswer` grava `rv` com `r:1` só se `f.st===2` antes;
  - 31 respostas → 30 guardadas, a mais nova no fim;
  - `cdRate` em treino extra (`cdRun.extra`) não mexe em `rv`;
  - cartão `su` fora de `cdDue()`, `cdForecast()[0].n` e `cdReady()`; `eByCard` falso com o único cartão suspenso;
  - `apkgCardRow` de cartão novo tem `type=0,queue=0`.
- [ ] **Passo 3:** rodar `node --test tests/unit/cartoes.test.js`. Esperado: FALHA (`cdLog`, `apkgCardRow` e `cdLive` não existem).
- [ ] **Passo 4:** implementar.
  - `cdClean`: `if(Array.isArray(x.rv))o.rv=…; if(x.su)o.su=1`.
  - Trocar `BYKEY[x.k]&&!x.dr` por `cdLive(x)` em: `cdDue`, `cdForecast` (também tira `dr` de lá), `cdReady`, `cdGenIds`, `cdSliceIds`, `cdTreeEl`/`cdCounts`, `eByCard`, `120-inicio.js:53`, `030-grade.js:99`.
  - `apkgBuild` usa `apkgCardRow`.
- [ ] **Passo 5:** `tests/run.sh --rapido`. Esperado: tudo passa.
- [ ] **Passo 6:** commit "Cartões: pasta própria, histórico de cada revisão e suspenso".

### Task 2: Funções puras da aba

**Files:**
- Modify: `src/app/js/100-cartoes/020-dados.js`
- Test: `tests/unit/cartoes.test.js`

**Interfaces:**
- Produces:
  - `cdState(x)→"rascunho"|"suspenso"|"novo"|"aprendendo"|"revisao"`. Ordem: `dr`, `su`, `!f.st`, `f.st!==2`.
  - `cdOrigin(x)→"erro"|"questao"|"trecho"|"manual"|"claude"`:
    - `src==="claude"` → claude;
    - `eid` com erro `trecho` → trecho;
    - `eid` → erro;
    - `kind` "q"/`ref` com "Questão" → questao;
    - senão manual.
    - Confira os valores reais de `kind` com `node tools/mapa/onde.js --codigo cdAdd` e os chamadores; registre a regra final como Ruling.
  - `cdParsePaste(txt)→{ok:[{q,a,line}],bad:[line]}`:
    - divide cada linha no primeiro `::` ou TAB;
    - os dois lados não vazios;
    - linhas em branco são ignoradas.
  - `cdWords(s)→Set`: sem acento (`norm`), sem palavras de até 2 letras.
  - `cdDupOf(k,q,exceptId)→card|null`, entre os cartões do tema `k`: igual normalizado, ou `|A∩B|/max(|A|,|B|)>=CD_DUP`.
  - `cdFilter(L,F)→array`, com `F={q,area,k,st,org,leech,sort}`:
    - `sort` = "due" (padrão; novos e suspensos no fim) | "lapses" | "new" (`at||id` desc);
    - `leech` = `f.lapses>=CD_LEECH`.
  - `cdLeeches(n)→array`: `cdLive`, `lapses>=4`, ordenados por `lapses` desc e depois `due`.
  - `cdStats(L,a,b)→{n,pass,young:{n,pass},mat:{n,pass},byDay:{[d]:n},first}`:
    - `a`, `b` = `dnum`;
    - `n`/`pass` só com `r:1`;
    - jovem/maduro pelo `i` daquele registro (≥ `CD_MAT` = maduro);
    - `byDay` conta todos os registros;
    - `first` = a data mais antiga de qualquer `rv`.
  - `cdStreak(byDay,T)→int`: dias seguidos com revisão terminando hoje, ou ontem se hoje ainda não teve.
  - `cdMix(L)→{novo,aprendendo,jovem,maduro,suspenso}`. Jovem ou maduro pelo intervalo atual: `dnum(due)-dnum(f.last)`.

- [ ] **Passo 1:** testes que falham, com estes valores:
  - `cdParsePaste("a :: b\n\nc\td\nsem separador\n x ::  ")` → `ok` 2 (`a/b`, `c/d`) e `bad` [4,5];
  - `cdDupOf` acha "Qual o agente da leucoplasia pilosa?" × "qual é o agente da leucoplasia pilosa" no mesmo tema e não acha em outro tema;
  - `cdStats` com 10 registros `r:1` (8 lembrou, 3 deles com `i≥21`) dá pass 8/10, com jovem e maduro separados corretamente;
  - `cdStreak` com hoje e ontem = 2; só com ontem e anteontem = 2; com buraco = 1;
  - `cdFilter` por busca sem acento, por situação "suspenso" e com ordem "lapses";
  - `cdOrigin`/`cdState` em um cartão de cada.
- [ ] **Passo 2:** rodar. Esperado: FALHA (as funções não existem).
- [ ] **Passo 3:** implementar em `020-dados.js`.
- [ ] **Passo 4:** `node --test tests/unit/cartoes.test.js` passa; `tests/run.sh --rapido` passa.
- [ ] **Passo 5:** commit "Cartões: contas da aba (lista, repetido, colar vários, estatísticas)".

### Task 3: A aba, a barra e a mudança do Caderno

**Files:**
- Modify:
  - `src/app/corpo.html`: `#tabC` depois de `#tabQ`, com ícone de dois cartões sobrepostos e `<span class="ecount" id="ccount">`; `<div id="viewCards" class="wrap" data-cseg="hoje" hidden>` com `#cSegBar` (Hoje/Todos/Números) e `#cdBody`;
  - `140-geral/030-navegacao.js`: `showView` (`#viewCards`) e o despacho do `render` (`view==="cartoes"` → `renderCards()`); `navListEl` com Cartões e com Erros (e a contagem dele); o `#tabM` aceso também com `erros` no celular;
  - `css/app.css`: no celular `#tabE{display:none}`; a barra continua com 6 itens;
  - `140-geral/010-pecas.js:36` e `:50`: tela inteira e teclas na view `cartoes`; teclas ignoradas com foco em `input`/`textarea`/`[contenteditable]`;
  - `120-inicio.js:31,55`, `010-base.js` (`cdGenGo`, `cdGoCards`, o toast "Ver nos cartões"), `060-faculdade/030-grade.js:101`: trocar `setView("notas");setNSeg("revisar")` por `cdOpen(...)`;
  - `090-caderno/010-pagina.js:250-253`: sem "Revisar" na barra; `#nRevBox` só com o `#nNoLine` e a classe `ns-free` (aparece na parte Caderno);
  - `090-caderno/020-pegadinhas.js:2`: "revisar" → "livre";
  - `corpo.html:65`: tirar o botão `data-n="revisar"`;
  - `010-dados/040-textos.js`: `HELP` com a seção "Cartões" própria; tirar os cartões da seção do Caderno;
  - `050-residencia.js`/`010-base.js` `cardsBlock`: "Ver os N cartões" → `cdOpen("todos",{k})`.
- Create: `src/app/js/100-cartoes/030-aba.js`
- Test: `tests/t154.js` (novo, em `tests/list.txt`). Ajustar os testes que entram pelo Caderno: t61, t70, t74, t85, t105, t121, t124, t142 (e os `shots*`, se ainda rodarem).

**Interfaces:**
- Produces:
  - `cSeg` (localStorage `resid-cseg`, padrão "hoje"), `setCSeg(v)`;
  - `cdOpen(seg,o)`: `backStack=[]`, `cSeg=seg`, `cdF.k=o&&o.k` (filtro de tema), `setView("cartoes")`; `o.run` = ids → `cdRunStart(o.run,o.gen)`; `o.go` = começa a revisão do dia;
  - `renderCards()`: monta a parte atual em `#cdBody`;
  - `cdHojeEl()`: o `nCardsCard0` atual sem o `<section>` do Caderno, mais a linha "N para revisar · M novos · ~X min" (`#cdLine`), `#cdNew` "+ Novo cartão" e `cdLeechEl()` ("Cartões que você mais esquece", `#cdLeech`, até 5, Editar · Juntar ao lote · Ver todos).
- Consumes: `cdLive`, `cdLeeches` (Tasks 1 e 2).

- [ ] **Passo 1:** escrever `tests/t154.js`, parte A (no modelo do t153: `mockdb`, `ok()`, "sem erros de JavaScript"), em celular 390 e notebook 1366:
  - celular: `#tabC` visível, `#tabE` escondido, Erros no Menu (`#nmPanel` contém "Erros");
  - computador: `#tabC` e `#tabE` visíveis;
  - `cdOpen("hoje")` mostra `#cdLine` e `#cdGo`;
  - a fila do dia (`qGoStep("cards")`) abre a aba com a revisão em andamento (`#cdShow`);
  - teclas: espaço mostra a resposta e "3" responde;
  - com foco num `textarea` do editor, "3" não responde;
  - Caderno sem botão "Revisar"; `localStorage resid-nseg2="revisar"` abre em "livre";
  - "Cartões que você mais esquece" com um cartão de `lapses:5`;
  - "Ver os N cartões" no tema leva a Todos com o filtro do tema;
  - `scrollWidth<=390`.
- [ ] **Passo 2:** `node tests/t154.js` (servidor em 8765 já de pé). Esperado: FALHAs.
- [ ] **Passo 3:** implementar. As partes Todos e Números mostram por enquanto só um título; o conteúdo vem nas Tasks 4–6.
- [ ] **Passo 4:** `node tests/t154.js` com a parte A OK. Ajustar os testes antigos para entrar por `cdOpen`; rodar `tests/run.sh t61 t70 t74 t85 t105 t121 t124 t142 t148 t99`. Esperado: todos OK.
- [ ] **Passo 5:** commit "Cartões: aba própria (Hoje), Erros no Menu do celular, Caderno sem Revisar".

### Task 4: Criar (um, colar vários, com o Claude) e o aviso de repetido

**Files:**
- Modify: `src/app/js/100-cartoes/030-aba.js`, `css/app.css`
- Test: `tests/t154.js` (parte B)

**Interfaces:**
- Produces:
  - `cdNewEl()` (`#cdNewBox`, três abas `#cdnM-um|varios|claude`);
  - tema por `nbPickEl` ou equivalente com busca; `resid-cdlastk` lembra o último tema;
  - um cartão: `#cdnQ`, `#cdnA`, `#cdnMore` "Salvar e criar outro", `#cdnSave` "Salvar"; salva com `cdAdd(k,cdT2H(q),cdT2H(a),"eu",{h:1,kind:"man"})` (confira a assinatura de `cdAdd` com `onde.js --codigo cdAdd`);
  - colar vários: `#cdnPaste` → prévia `#cdnPrev` com caixinha por linha (a repetida vem desmarcada, com "Parecido com: …"), linhas ruins listadas, `#cdnMany` "Criar N cartões";
  - com o Claude: escolher de 1 a 5 temas (`#cdnK-<i>`), e para cada um o bloco que já existe no tema (`cardsBlock(it)` › "Criar cartões com o Claude"), em sequência;
  - repetido no "um": `#cdnDup` "Parecido com: … · Criar mesmo assim (`#cdnDupGo`) · Ver o outro (`#cdnDupSee`)".
- Consumes: `cdParsePaste`, `cdDupOf` (Task 2).

- [ ] **Passo 1:** t154 parte B:
  - "Salvar e criar outro" cria 1, mantém o tema e esvazia os campos;
  - colar 3 linhas (1 ruim, 1 repetida) → prévia com 1 marcada, 1 desmarcada e 1 ruim listada → "Criar 1 cartão";
  - repetido no "um" mostra `#cdnDup` e "Criar mesmo assim" cria;
  - aba Claude com 2 temas mostra 2 blocos.
- [ ] **Passo 2:** rodar. Esperado: FALHA.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** `node tests/t154.js` OK.
- [ ] **Passo 5:** commit "Cartões: criar um, colar vários, criar com o Claude, aviso de repetido".

### Task 5: Todos (lista, filtros, editor, selecionar)

**Files:**
- Modify: `030-aba.js`; `010-base.js` (o editor `cdEditEl` ganha Suspender/Reativar `#cdeSu`, Trocar de tema `#cdeK` e Apagar `#cdeDel`); `css/app.css` (duas colunas `.cdall` no computador)
- Test: `tests/t154.js` (parte C)

**Interfaces:**
- Produces:
  - `cdF={q,area,k,st,org,leech,sort}` (sort em `resid-cdsort`);
  - `cdAllEl()`: `#cdQ` busca, filtros `fcSel`/`fcChips` (padrão 20B);
  - lista `#cdList` com itens `.cdrow[data-id]` (pergunta em 2 linhas, tema, situação e "próxima DD/MM" ou "suspenso");
  - `#cdMore` "Mostrar mais 50";
  - `cdPick` = id aberto. Com `twoCols()`, o editor fica na coluna ao lado (`#cdSide`); sem, em tela própria com `#cdBackList` "Voltar à lista";
  - seleção `cdSel=Set`, `#cdSelOn` "Selecionar", `#cdSelAll` "Selecionar todos os N", barra `#cdBulk` com:
    - `#cdbK` Trocar de tema;
    - `#cdbSu` Suspender e `#cdbRe` Reativar;
    - `#cdbDel` Apagar: `toTrash("cards",…)` e `cardStore.delMany`;
    - `#cdbAnki` Exportar para o Anki: `apkgBuild` + `cdExp`, o mesmo fluxo "Já importei no Anki".
  - Trocar de tema muda `x.k` e salva com `cdPut`.
- Consumes: `cdFilter`, `cdState`, `cdOrigin`, `cdLive`.

- [ ] **Passo 1:** t154 parte C:
  - busca "leucoplasia" filtra;
  - filtro "suspenso" vazio, depois suspender pelo editor e o filtro mostra 1;
  - o suspenso sai de `cdDue()`;
  - no notebook, tocar num item abre `#cdEdit` dentro de `#cdSide` com a lista ainda visível; no celular, abre sozinho com `#cdBackList`;
  - selecionar 2 → Suspender → os 2 com `su`;
  - Trocar de tema de 1 → `x.k` novo;
  - Apagar 1 → vai para a lixeira;
  - 120 cartões mostram 50, e `#cdMore` mostra 100;
  - sem rolagem lateral a 390.
- [ ] **Passo 2:** rodar. Esperado: FALHA.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** `node tests/t154.js` OK e `tests/run.sh t142` OK.
- [ ] **Passo 5:** commit "Cartões: lista Todos com filtros, editor ao lado, selecionar vários".

### Task 6: Números

**Files:**
- Modify: `030-aba.js`; `170-estatisticas.js` (`stW()` aceita a largura da view atual: troca `getElementById("viewStats")` pela view visível, ou o parâmetro `o.w` em `stBars`); `css/app.css` (calendário `.cdcal`)
- Test: `tests/t154.js` (parte D), `tests/unit/cartoes.test.js`

**Interfaces:**
- Produces:
  - `cdPer` (7|30|90|0=Tudo, `resid-cdper`, padrão 30);
  - `cdNumEl()` com os cartões `.stcard`:
    - `#cdnRet` "Quanto você lembra": % do período, meta 90%, jovens × maduros;
    - `#cdnDay` revisões por dia (`stBars`);
    - `#cdnFc` previsão de 30 dias (`stBars`, a partir de `due`);
    - `#cdnMix` situação (`cdMix`);
    - `#cdnArea` por área: número e % lembra, este só com 10 ou mais revisões na área;
    - `#cdnLeech` os 10 mais esquecidos, com Editar → abre em Todos;
    - `#cdnCal` calendário de 26 semanas (cor por faixa de quantidade, só com variáveis de cor) e "N dias seguidos".
  - Com menos de 20 revisões `r:1` no período: `#cdnFew` com o aviso exato, e o resto continua aparecendo.
- Consumes: `cdStats`, `cdStreak`, `cdMix`, `cdLeeches`.

- [ ] **Passo 1:** t154 parte D:
  - sem histórico, `#cdnFew` aparece;
  - com 30 registros montados (24 lembrou, 6 maduros), `#cdnRet` mostra "80%" e a meta;
  - `#cdnCal` tem 182 dias ou mais e a sequência certa;
  - `#cdnFc` tem 30 barras;
  - celular sem rolagem lateral.
- [ ] **Passo 2:** rodar. Esperado: FALHA.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** `node tests/t154.js` OK e `tests/run.sh t153` OK (as Estatísticas continuam com a largura certa).
- [ ] **Passo 5:** commit "Cartões: Números (quanto lembra, por dia, previsão, por área, calendário)".

### Task 7: Documentos, suíte, toques e prints

**Files:**
- Modify:
  - `docs/recursos.md`: bloco novo "Aba Cartões" no estilo denso, com funções, ids, `rv`/`su`, decisões e testes; o bloco antigo dos cartões no Caderno aponta para ele;
  - `CLAUDE.md`: índice; a lista de módulos (`100-cartoes/` com `010-base`, `020-dados`, `030-aba`); as abas (Cartões; no celular, Erros no Menu);
  - `docs/decisoes.md`: tirar a aba de "Aprovado e ainda não feito" e anotar as decisões com data;
  - `tests/README.md`, se citar a aba.
- Test: `tests/unit/mapa.test.js` (o mapa lê `rv`/`su`), t87, suíte inteira.

- [ ] **Passo 1:** `node tools/mapa/onde.js --dados cards` mostra `rv` e `su`; `tests/run.sh --unit` passa.
- [ ] **Passo 2:** `tests/run.sh` inteiro (servidor já de pé). Esperado: todos OK; falhas só se repetidas isoladas.
- [ ] **Passo 3:** `tests/run.sh --monkey`. Esperado: sem erro nos 6 aparelhos.
- [ ] **Passo 4:** prints (`tests/shotsCards.js`, não entra na lista), claro e escuro:
  - celular: barra, Hoje, criar, Todos, editor e Números;
  - notebook: Todos com o editor ao lado, e Números;
  - iPad 578.
- [ ] **Passo 5:** commit "Cartões: documentação" e push do ramo.
