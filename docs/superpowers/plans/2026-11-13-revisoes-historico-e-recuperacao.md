# Histórico das revisões e recuperação do atraso — plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** guardar cada revisão de cada tema e mostrar a retenção; quando o atraso passar do que cabe em ~3 dias, redistribuí-lo sozinho em até 14 dias.

**Architecture:** tudo no módulo do plano (`src/app/js/040-plano.js`, ao lado de `reviewTopic`/`revBrake`), com funções puras testadas no Node
(`tests/unit/`) e as telas nos lugares que já existem (Estatísticas, tema aberto, Início, Revisões, Próximos dias). As datas mudam pelo ajuste
que já existe (`s.adj`/`s.adjFrom`, o mesmo do `agBalance`); o estado da recuperação vai em `ui.prefs.rec` (sincroniza com as preferências).

**Tech Stack:** JS puro do app (sem bibliotecas), `node:test` (`tests/unit/load.js`), Playwright (`tests/tNN.js` com `mockdb.js`).

**Spec:** `docs/superpowers/specs/2026-11-13-revisoes-historico-e-recuperacao-design.md`

## Global Constraints

- Editar só `src/app/` (+ testes e docs); depois `python3 src/build_site.py`. Nunca editar `index.html` à mão.
- Textos da tela em português do Brasil, sem jargão; cores só por variáveis do CSS; funcionar nos 6 aparelhos (390, 578 em 1180×820, 820, 1180, 1366, 1920), claro e escuro.
- Histórico: `s.rv` com as **40** mais recentes; "no prazo" = atraso **≤ 1** dia; atraso medido contra a **data original** (sem `adj`).
- Gatilho: atrasadas (`dueIn < 0`, Residência + Faculdade) **> 3 × limite**; limite = `max(3, ⌈revisões dos próximos 14 dias sem as atrasadas ÷ 14 × 1,25⌉)`.
- Distribuição: até **14 dias**, pulando folgas (`dayMin(n)===0`); limite pode subir até **+2 por dia**; ordem = peso × (atraso ÷ intervalo), empate = mais atrasada.
- Recuperação ativa → `revBrake` permite **1** tema novo por dia. Não dispara com `examCrunch().active` nem com `provaWeek().length`, nem com recuperação já ativa.
- Firestore: nada de `undefined` nem arrays dentro de arrays (`rv` é lista de objetos; `rc.o` é `[adj, adjFrom]` — um array simples, ok).

## Review Focus

1. **Tema sem `last`** (nunca estudado) ou da Faculdade: `revLate`/recuperação ignoram sem erro; FAC entra igual à Residência.
2. **Ajuste manual anterior** (`adj` do Equilibrar ou "ajustar data"): Desfazer devolve exatamente o `adj/adjFrom` de antes.
3. **Dois aparelhos / abrir duas vezes no mesmo dia**: não remaneja de novo (guarda por dia + `ui.prefs.rec` sincronizado).
4. **Atraso enorme** (ex.: 200 atrasadas): limite +2 não basta → o resto no 14º dia, aviso diz "N ficaram para 26/11", nada se perde.
5. **Dia de folga e "Hoje não deu"** no meio dos 14 dias: nenhuma revisão marcada para folga; no próprio dia de folga não dispara.

Cada item tem teste nas Tasks 1 e 3.

---

### Task 1: Histórico das revisões (dados)

**Files:**
- Modify: `src/app/js/040-plano.js` (perto de `reviewTopic`, L56)
- Test: `tests/unit/revisoes.test.js` (novo)

**Interfaces:**
- Produces: `REV_HIST_MAX = 40`; `revLate(s, T) -> number|null` (null sem `s.last`); `revStats(L, from?, to?) -> {n, g2, g1, g0, ok:{n,g2}, late:{n,g2}}` (L = lista de `{d,g,l}`; filtra `from ≤ d ≤ to` quando dados);
  `topicRevs() -> [{k,d,g,l,i,a?}]` (todos os temas de `ALL` + `FAC_ITEMS`).
- `reviewTopic` grava `{d:T, g, l:revLate(s,T), i:interval(s sem adj), ...(o.auto?{a:1}:{})}` no fim de `s.rv` ANTES de mudar `last/step`, corta para 40, e apaga `s.rc`.

- [ ] **Step 1: testes que falham** — em `tests/unit/revisoes.test.js` (padrão de `hy.test.js`, `load({ now: "2026-11-13T12:00:00" })`):
  - `revLate`: tema `{last:"2026-11-01", step:1}` (INT[1]) com e sem `adj/adjFrom` dá o MESMO atraso (a data original manda); sem `last` → null.
  - `reviewTopic(k, 2)` acrescenta `{d:"2026-11-13", g:2, l, i}`; 45 revisões seguidas deixam 40 e a mais nova no fim; `o.auto` grava `a:1`; `s.rc` some.
  - `revStats([{d,g:2,l:0},{g:0,l:5},{g:2,l:1},{g:1,l:9}])` → `n:4, g2:2, ok:{n:2,g2:2}, late:{n:2,g2:0}`.
  - Tema da Faculdade (`FAC_ITEMS`) entra em `topicRevs`.
- [ ] **Step 2:** `tests/run.sh --unit` → falha (funções não existem).
- [ ] **Step 3:** implementar em `040-plano.js`.
- [ ] **Step 4:** `tests/run.sh --unit` → passa; `node tools/mapa/onde.js --dados topics` mostra `rv` e `rc`.
- [ ] **Step 5:** commit "Revisões: histórico de cada revisão (rv) e retenção calculada".

### Task 2: Retenção na tela

**Files:**
- Modify: `src/app/js/170-estatisticas.js` (`stResBlocks`, bloco 1, tabela `stTable`), `src/app/js/050-residencia.js` (`renderDetail`, bloco `.drev` L93),
  `src/app/js/010-dados/040-textos.js` (`HELP` › "Revisões": um parágrafo), `src/app/css/app.css` (só se precisar)
- Test: `tests/t153.js` (novo; parte 1) + `tests/list.txt`

**Interfaces:**
- Consumes: `topicRevs`, `revStats` (Task 1).
- Produces: linha da tabela "Retenção nas revisões" (este período × anterior, mesmo `stDelta` das outras linhas); parágrafo `#stRet`
  "No prazo: X% · Atrasadas: Y%" só com ≥5 de cada; com < 10 revisões no período, `#stRet` = "Poucas revisões registradas ainda (o histórico começou em 13/11/2026).";
  no tema, `p.drevh` "N revisões · lembrou M · última: Lembrei (há D dias)" quando houver `rv`.

- [ ] **Step 1: teste de tela que falha** (`tests/t153.js`, no padrão de `t152.js`): semeia `rv` em 3 temas (12 revisões no prazo, 8 lembrou; 6 atrasadas, 2 lembrou);
  Estatísticas mostra a linha "Retenção nas revisões" e `#stRet` contém "No prazo: 67%" e "Atrasadas: 33%"; tema aberto mostra `.drevh` com "revisões · lembrou";
  sem `rv`: `#stRet` com "Poucas revisões"; sem erros de JavaScript. Incluir `t153` em `tests/list.txt`.
- [ ] **Step 2:** `python3 src/build_site.py && tests/run.sh t153` → falha.
- [ ] **Step 3:** implementar as três telas e o parágrafo da Ajuda (o que mudou no uso: "o app guarda cada revisão; a retenção aparece nas Estatísticas").
- [ ] **Step 4:** `tests/run.sh t153 t111 t131 t114 t32` → passam (t111/t131 = Estatísticas, t114 = tema aberto, t32 = Ajuda).
- [ ] **Step 5:** commit "Revisões: retenção nas Estatísticas e no tema".

### Task 3: Recuperação do atraso (lógica)

**Files:**
- Modify: `src/app/js/040-plano.js` (novas funções perto de `revBrake`, L71; `revBrake`), `src/app/js/140-geral/030-navegacao.js:23` (chamar `recCheck()` ao lado de `qAutoRev()`),
  `src/app/js/150-perfil.js` (`uiSanitize`: guardar `prefs.rec = {d, n, until, ov}` válido, senão tirar)
- Test: `tests/unit/revisoes.test.js`

**Interfaces:**
- Produces:
  - `REC_DAYS = 14`, `REC_EXTRA = 2`, `REC_TRIG = 3`.
  - `recBase() -> number` — o limite diário (Global Constraints).
  - `recPlan(items, D, cap, offs) -> {asg:{[k]:dia}, cap:number, last:number, over:number}` — **pura**. `items = [{k, w, late, iv}]`; `D` = 14 contagens já marcadas por dia
    (dia 0 = hoje, sem as atrasadas); `offs` = `Set` de índices de folga. Ordena por `w*(late/iv)` desc, empate `late` desc; tenta `cap`, `cap+1`, `cap+2`
    (para no primeiro que coube tudo); com `cap+2` sem caber, o resto vai para o último dia não-folga (`over` = quantos).
  - `recApply(T) -> {n, until, over}` — monta `items` das atrasadas, chama `recPlan`, grava em cada tema `adj/adjFrom` (para `dueIn` dar exatamente o dia) e
    `rc = {d:T, o:[adj,adjFrom] | null}`; grava `ui.prefs.rec = {d:T, n, until, ov:over}`; `commit()`.
  - `recActive() -> string[]` — chaves com `rc` ainda não revisadas (`s.adjFrom === s.last`).
  - `recUndo()` — devolve `o` (ou apaga `adj/adjFrom`) e `rc` de quem ainda está ativo; apaga `ui.prefs.rec`; marca o dia em `resid-recchk`.
  - `recCheck() -> boolean` — uma vez por dia (`localStorage resid-recchk` = hoje), fora de folga, com conta sincronizada (`store && !synced` → não), sem `examCrunch().active`,
    sem `provaWeek().length`, sem recuperação ativa; se atrasadas > `REC_TRIG × recBase()` → `recApply`. Quando `recActive()` fica vazio, apaga `ui.prefs.rec`.
  - `recPull(n=3)` — traz para hoje as `n` ativas de data mais próxima (ajuste para hoje, `rc.o` fica) e chama `goRevs()`.
  - `recOrig(s) -> "AAAA-MM-DD"|null` — data original de quem tem `rc` (com o `o` devolvido).
  - `revBrake()` → com `recActive().length`, `cap: 1`.

- [ ] **Step 1: testes que falham:**
  - `recPlan`: 20 itens, `cap 3`, D vazio → todos colocados, nenhum dia > 3, ninguém em `offs`; o de maior `w*late/iv` no dia 0.
  - `recPlan` com 60 itens e `cap 3` em 14 dias → usa `cap 5` (3+2); com 200 → `over > 0` no último dia não-folga.
  - `recApply` com 30 temas atrasados (step 1, `last` há 40 dias): depois, `dueIn` de cada um = dia do `asg`; `rc.o` guardado; `revLate` NÃO muda (atraso original).
  - `recUndo` depois de um `adj` manual anterior → `adj/adjFrom` voltam iguais ao que eram.
  - `recCheck`: 5 atrasadas → não dispara; 30 → dispara; segunda chamada no mesmo dia → não dispara; com `examCrunch` forçado → não dispara; em dia de folga → não dispara.
  - `revBrake().cap === 1` com recuperação ativa.
- [ ] **Step 2:** `tests/run.sh --unit` → falha.
- [ ] **Step 3:** implementar (e `uiSanitize` para `rec`).
- [ ] **Step 4:** `tests/run.sh --unit` e `tests/run.sh t119 t121 t139 t85` → passam (revisões, fila, folga, planejar).
- [ ] **Step 5:** commit "Revisões: recuperação do atraso (redistribui em até 14 dias, desfazer)".

### Task 4: Recuperação na tela

**Files:**
- Modify: `src/app/js/120-inicio.js` (`iNoticeEl` L108; `iQueueCard` L60 com a fila concluída), `src/app/js/040-plano.js` (`renderRevs` L201: aviso no topo e "era para"),
  `src/app/js/050-residencia.js` (`renderDetail` `.drev`: "era para"; `renderAgenda0` L279: marca `.rec` nos dias e a linha da recuperação), `src/app/css/app.css`,
  `src/app/js/010-dados/040-textos.js` (`HELP` › "Revisões")
- Test: `tests/t153.js` (parte 2)

**Interfaces:**
- Consumes: `recActive`, `recUndo`, `recPull`, `recOrig`, `ui.prefs.rec` (Task 3).
- Produces: `recNoteEl() -> Element|null` = aviso `#recNote` "N revisões atrasadas foram distribuídas até DD/MM" (+ " · M ficaram para DD/MM" com `ov`)
  com `#recSee` "Ver nos próximos dias" (`goRevs` + rola até `#revAgenda`) e `#recUndo` "Desfazer"; fechar `#recX` grava `resid-recdis = rec.d`.
  Botão `#recMore` "Revisar mais 3 do atraso" no `iQueueCard` quando `dayDone()` e `recActive().length`. Selo pequeno `.recorig` "era para DD/MM".
  Linha `#agRec` "Recuperação: X de N feitas · termina em DD/MM".

- [ ] **Step 1: teste de tela que falha** (`t153` parte 2): semeia 30 temas atrasados e abre o app → `#recNote` no Início e nas Revisões com "30 revisões atrasadas foram distribuídas";
  cartões das revisões com `.recorig`; `#agRec` em Próximos dias; plano do dia com no máximo 1 tema novo; marcar a fila como concluída → `#recMore`; tocar → 3 revisões a mais hoje;
  `#recUndo` → atrasadas de volta (contagem 30) e o aviso some; 5 atrasadas → nada aparece; sem erros de JavaScript. Celular 390 e computador 1366.
- [ ] **Step 2:** `tests/run.sh t153` → falha.
- [ ] **Step 3:** implementar telas, CSS (variáveis do tema) e o parágrafo da Ajuda.
- [ ] **Step 4:** `tests/run.sh t153 t124 t95 t102 t151` → passam.
- [ ] **Step 5:** commit "Revisões: aviso da recuperação, data original, adiantar e desfazer".

### Task 5: Documentos, prints e suíte

**Files:**
- Modify: `docs/recursos.md` (bloco "Revisões: histórico e recuperação do atraso"), `CLAUDE.md` (título no índice), `docs/decisoes.md` (mover do "Aprovado e ainda não feito" quando publicado)
- Create: `tests/shotsRev.js` (capturas; não é teste)

- [ ] **Step 1:** bloco em `docs/recursos.md` no estilo denso (funções, ids, `rv`/`rc`/`ui.prefs.rec`, teste t153) + linha no índice do `CLAUDE.md`.
- [ ] **Step 2:** `tests/shotsRev.js`: Estatísticas com retenção, tema aberto, aviso no Início, Revisões com "era para", Próximos dias — celular 390 e computador 1366, claro e escuro.
- [ ] **Step 3:** `tests/run.sh` (suíte inteira) e `tests/run.sh --monkey` → sem `FALHA` (instáveis passam sozinhos).
- [ ] **Step 4:** commit "Revisões: documentação e capturas"; push do ramo `revisoes-recuperacao`. Mostrar os prints e pedir "pode publicar".
