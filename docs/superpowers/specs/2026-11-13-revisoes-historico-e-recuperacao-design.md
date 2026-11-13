# Revisões: histórico e recuperação do atraso — desenho

Conversa com o usuário em 12–13/11/2026 (sugestões 2 e 3 de `claude/sugestoes-12-11.md`); desenho aprovado na conversa em 13/11, 07h35
("aprovo tudo que falou"). Este documento põe o combinado no papel antes de programar.

## Por quê

- **Histórico:** hoje cada tema guarda só a última resposta da revisão (`s.rg`). Sem o histórico, o app não sabe se as revisões funcionam:
  quanto o usuário lembra quando revisa no prazo e quanto quando atrasa. Primeiro passo para, mais tarde, ajustar os intervalos aos dados dele.
- **Recuperação:** o usuário atrasa pouco e, com poucos dias de atraso, dá conta de tudo. Quer uma **rede de segurança**: se um dia acumular algo
  como um mês de revisões, o app dilui o acúmulo e vai encaixando na rotina, sozinho. Hoje, nesse caso, a fila mostra só uma parte, as outras ficam
  marcadas "atrasada N d" com o número crescendo, e acima de 40 atrasadas o freio zera os temas novos.

## Metas

1. Guardar cada revisão de cada tema (Residência e Faculdade) com o dia, a resposta e o atraso verdadeiro.
2. Mostrar a retenção (quanto lembrou) nas Estatísticas e no tema aberto, separando no prazo × atrasada.
3. Quando o atraso passar do que cabe em ~3 dias, redistribuir as atrasadas sozinho em até 14 dias, mais esquecidas primeiro, com aviso e Desfazer.
4. Durante a recuperação, continuar avançando devagar: 1 tema novo por dia.

## Fora do escopo

- Ajustar os intervalos pela retenção (fica para quando houver ~2 meses de histórico; decisão de 12/11).
- Revisar com questões do banco (guardado para quando o banco tiver 5.000 questões).
- Mudar a ordem das revisões no dia a dia fora da recuperação (`revScore` continua como está).
- Mudar o "Equilibrar" manual (continua como está).

## Não pode acontecer (anti-metas)

- Esconder o atraso: a data original fica guardada e aparece; a retenção usa o atraso verdadeiro, não o da data remanejada.
- Mexer em atraso pequeno: com poucos dias de atraso nada muda (o usuário dá conta sozinho).
- Perder dado: nada salvo é apagado; Desfazer volta exatamente ao que era.
- Contar duas vezes: a revisão automática pelas questões (`qAutoRev`) entra no histórico uma vez, marcada como automática.

## Abordagens consideradas

- **A. Reagendar sozinho (ESCOLHIDA, 13/11, 07h33).** O app dá data nova a cada revisão atrasada e espalha pelos próximos dias, com aviso e Desfazer.
  A favor: é o que o usuário descreveu ("diluir e ir encaixando"), com fim visível. Contra (reduzido pelas defesas abaixo): muda datas; uma revisão
  muito atrasada pode esperar mais alguns dias.
- **B. Modo recuperação sem mexer nas datas.** Só a contagem e o freio mudam ("recuperação: dia 3 de 10"). Recusada: a lista continua cheia de
  selos de atraso e o "encaixar" fica só na aparência.
- **C. Melhorar só o botão "Equilibrar".** Não serve: o usuário quer que aconteça sozinho (e nunca usou o botão).

## Desenho

### 1. Histórico das revisões

- Campo novo no tema: `s.rv = [{d, g, l, i, a?}]`, as **40 mais recentes** (a mais nova no fim).
  - `d` dia da revisão (AAAA-MM-DD); `g` resposta 0 Esqueci · 1 Difícil · 2 Lembrei; `l` dias de atraso **em relação à data original**
    (negativo = adiantada; sem descontar ajuste manual nem recuperação); `i` intervalo previsto naquela revisão (dias); `a:1` = automática pelas questões.
  - Gravado dentro do `reviewTopic` (o único lugar que registra revisão), antes de mudar `last/step`.
  - Atraso verdadeiro: `dnum(hoje) − (dnum(s.last) + interval(s sem adj))`. Função pura `revLate(s, hoje)` com teste unitário.
- Formato: o tema é guardado inteiro (o `migrate()` copia todos os campos), então sincronização, backup e o backup do Drive levam `rv` sem mudança.
  Conferir com `tests/unit/mapa.test.js` (campo aparece em `--dados topics`) e t87.
- Revisões antigas: não existem (só a última resposta). O histórico começa no dia da publicação; a tela diz isso enquanto houver poucos dados.

### 2. Retenção na tela

- Função pura `revStats(lista de rv, de, até)` → `{n, lembrou, noPrazo:{n,lembrou}, atrasada:{n,lembrou}}`. "No prazo" = `l ≤ 1` (1 dia de tolerância).
  "Lembrou" = `g === 2`; Difícil conta como não lembrou bem (mostrado à parte: "lembrou · com dificuldade · esqueceu").
- **Estatísticas › 1. Como estou indo:** linha nova na tabela "Retenção nas revisões" (este período × o anterior) e, abaixo, "No prazo: 82% ·
  Atrasadas: 61%" quando houver ao menos 5 de cada. Com menos de 10 revisões no período: "Poucas revisões registradas ainda (começou em 13/11)."
- **Tema aberto › Revisão espaçada:** linha pequena "6 revisões · lembrou 5 · última: Lembrei (há 12 dias)" quando o tema tiver histórico.
- Ajuda (`HELP` › Revisões) e o manual ganham um parágrafo.

### 3. Recuperação do atraso

- **Quando:** uma vez por dia, na abertura/primeiro `render` do dia (como o `qAutoRev`), fora de folga e com a conta sincronizada. Dispara se o número
  de revisões atrasadas (`dueIn < 0`, Residência + Faculdade) for **maior que 3 × o limite diário**. Limite diário = o "ritmo confortável" da agenda
  calculado **sem as atrasadas** (`max(3, ⌈revisões dos próximos 14 dias / 14 × 1,25⌉)`, a mesma conta do `agCap`).
- **Ordem (o mais esquecido primeiro):** pontuação = peso do tema × (dias de atraso ÷ intervalo). Empate: mais atrasada primeiro.
- **Distribuição:** hoje recebe até o limite (contando as que já vencem hoje); os dias seguintes recebem o que falta para o limite, pulando dias de
  folga (`dayMin(n) === 0`). Prazo máximo **14 dias**: se não couber, o limite sobe até **+2 por dia**. Se mesmo assim não couber (atraso enorme),
  o que sobra vai para o 14º dia e o aviso diz isso.
- **Como a data muda:** pelo ajuste que já existe (`s.adj`/`s.adjFrom`, o mesmo do Equilibrar), que vale só até a próxima revisão. Campo novo
  `s.rc = {d, o}`: `d` = dia em que a recuperação remanejou; `o` = o ajuste anterior (`[adj, adjFrom]` ou `null`), para o Desfazer.
  Ao revisar, `upd` já apaga o ajuste (muda `last`); `rc` sai junto.
- **Aviso** (Início, como os outros avisos, e no topo do cartão de revisões da Residência): "30 revisões atrasadas foram distribuídas até 25/11 ·
  Ver nos próximos dias · Desfazer". Some quando a recuperação acaba ou o usuário fecha. Desfazer = devolve o `o` de cada tema com `rc` do mesmo dia
  ainda não revisado e marca o dia para não disparar de novo hoje.
- **Data original visível:** no cartão da revisão e no tema aberto, em letra pequena: "era para 12/10".
- **Adiantar quando sobra tempo:** com a fila do dia concluída e recuperação ativa, a fila mostra "Revisar mais 3 do atraso"; o toque traz para hoje as
  3 próximas da recuperação (ajuste para hoje) e abre as revisões.
- **Temas novos:** enquanto houver revisão com `rc` não feita, o freio (`revBrake`) permite **1 tema novo por dia**; depois, o normal.
- **Próximos dias:** os dias com revisões da recuperação ganham uma marca; a linha de baixo diz "Recuperação: 12 de 30 feitas · termina em 25/11".
- Não dispara de novo enquanto uma recuperação estiver ativa; atrasadas novas que aparecerem nesse tempo seguem o fluxo normal.

## Testes

- Unitários (`tests/unit/revisoes.test.js`): `revLate` (com e sem ajuste), `revStats`, ordem por risco, distribuição (limite, +2, 14 dias, folgas),
  Desfazer devolve o ajuste anterior.
- Tela (`tests/t153.js`): revisar grava `rv`; retenção nas Estatísticas e no tema; 40 atrasadas disparam a recuperação com aviso; "era para";
  Desfazer; 1 tema novo no plano durante a recuperação; "Revisar mais 3 do atraso"; nada dispara com atraso pequeno.
- Continuam passando: t87 (backup do Drive), t119/t121 (revisões e fila), t139 (folga), a suíte inteira e os toques aleatórios.

## Decisões do usuário

- 12/11/2026, 14h53: histórico e recuperação aprovados como ideia.
- 13/11/2026, 07h26: "atraso pouco"; com poucos dias revisa tudo; num atraso de ~1 mês, quer que o app dilua e encaixe na rotina. Aprovou a proposta do histórico.
- 13/11/2026, 07h33–07h35: abordagem A, com as defesas (mais esquecido primeiro, até 14 dias com +2 por dia, adiantar, data original guardada, Desfazer)
  e 1 tema novo por dia durante a recuperação.

## Escolhas do Claude (o usuário pode corrigir)

- Tolerância de 1 dia para "no prazo"; 40 revisões guardadas por tema; gatilho em "mais que 3 × o limite diário".
- A ordem por risco vale só na recuperação; o dia a dia continua com a ordem atual.
- Histórico começa na publicação (não há como reconstruir as respostas antigas).
- Não dispara com o modo provas ligado nem na semana de prova da faculdade (o plano já é só faculdade); dispara no primeiro dia depois.
- Dois aparelhos no mesmo dia: o segundo vê o `rc` já sincronizado e não remaneja de novo.
