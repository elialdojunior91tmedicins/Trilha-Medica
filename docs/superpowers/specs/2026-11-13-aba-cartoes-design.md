# Aba Cartões: design

Conversa com o usuário em 13/11/2026 (pedido de 12/11, 14h53, em `claude/sugestoes-12-11.md`). Escolhas do usuário:
- lugar da aba no celular (08:54);
- lista de sugestões (09:06: "Só não entra a 6. Pode fazer todas as outras").

Abordagem A, escolhida pelo Claude porque o usuário deixou o "como" com ele.

## Por quê

Nas palavras do usuário (08:42): "O que me incomodo é o local que estão, é um espaço pequeno, sem protagonismo e devida importância. Numa aba própria
quero tornar ele mais independente e de melhor uso, mais facilidade para criação de novos cards, melhor organização, melhor edição, melhor visão dos
cards, ver estatísticas dos cards".

Hoje os cartões ficam no Caderno, em "Revisar" (`nCardsCard0`), com:
- resumo e previsão de 7 dias;
- árvore área › especialidade › tema;
- lote de melhorias, editor de um cartão por vez, Anki e ajustes.

Hoje não há:
- lista para navegar e buscar;
- jeito rápido de criar sem abrir um tema ("+ Cartão manual" fica dentro de cada tema);
- histórico das revisões, e por isso nenhuma estatística além do dia.

## Metas

1. A aba **Cartões** (view `cartoes`) é o lugar dos cartões. No celular ela fica na barra de baixo, **no lugar de Erros**, que vai para o ≡ Menu.
   No computador e no tablet entra logo depois de Questões.
2. Criar é rápido: "+ Novo cartão" sempre à vista, criar vários colando texto, "Criar com o Claude" escolhendo temas.
3. Uma lista de todos os cartões com busca, filtros, ordem e ações em vários de uma vez. Dá para suspender sem apagar.
4. Editar direto da lista: no computador, o editor fica ao lado; no celular, em tela própria.
5. Cada revisão de cartão passa a ser guardada. Com isso a aba mostra quanto o usuário lembra, jovens × maduros, revisões por dia, previsão,
   por área, os mais esquecidos e o calendário.

## Fora do escopo

- Cartão de lacuna (sugestão 6, recusada em 13/11, 09:06).
- Mudar o método de revisão (FSRS, 4 botões, limite de novos por dia) ou os intervalos.
- Mudar onde os cartões nascem (erro, questão, trecho) e o formato da exportação .apkg.
- Mexer nos cartões que já estão no Anki.

## Não pode acontecer

- **Perder cartão ou agenda:** a mudança de tela não mexe em `due`/`f`, e o que já existe continua igual.
- **Suspenso aparecendo:** cartão suspenso não volta para a revisão, a previsão, a fila do dia ou "Prontos para o Anki" sem o usuário reativar.
- **Rolagem lateral** no celular (390 px) e barra de baixo ilegível.
- **Quebrar o que manda para os cartões:** fila do dia, plano (`cdGenGo`), erro → "Criar cartão", tema aberto e tela inteira.
- **Contar duas vezes:** treino extra (`cdRun.extra`, que não muda a agenda) não entra nas estatísticas.

## Abordagens consideradas

- **A. Partes, como em Questões e Caderno (ESCOLHIDA).** Hoje · Todos · Números. É o vocabulário de sempre do app, cada parte cabe numa tela
  e no computador a lista e o editor ficam lado a lado.
- **B. Uma tela só, tudo empilhado.** No celular vira rolagem longa, e a lista empurra as estatísticas para o fim.
- **C. A lista como tela principal, com "Hoje" numa faixa.** Tira o destaque da revisão, que é o uso diário.

## Design

### 1. Lugar e navegação

- **Aba e partes:**
  - aba nova `#tabC` (`data-v="cartoes"`, rótulo "Cartões", contagem do dia `#ccount` como `#ecount`), seção `#viewCards`;
  - partes `cSeg` = `hoje` | `todos` | `numeros` (localStorage `resid-cseg`), na barra de partes como `#nSegBar`, com contagem em "Hoje".
- **Celular:**
  - barra: Início · Residência · Faculdade · Questões · Cartões · Menu;
  - `#tabE` some da barra só no celular;
  - Erros entra no ≡ Menu (`#navMenu` e a view `mais`), com a contagem do dia.
- **Computador e tablet:** todas as abas visíveis, Cartões depois de Questões.
- **Caderno:**
  - a parte "Revisar" sai, e ficam Caderno · Pegadinhas;
  - o aviso "N temas estudados sem anotação · ver" (`#nNoLine`) vai para o topo da parte Caderno;
  - `nSeg` salvo como "revisar" passa a "livre".
- **Tudo que hoje abre os cartões no Caderno passa a abrir a aba:**
  - `qGoStep "cards"`, `cdGoCards`, `cdGenGo`;
  - a prévia depois do erro ("Ver nos cartões");
  - a tela inteira `fullOn.cd`: em `140-geral/010-pecas.js`, a view `cartoes` no lugar de `notas`;
  - a busca;
  - a Ajuda (nova seção "Cartões", que sai do Caderno).
- **No tema aberto:** o bloco de cartões (`cardsBlock`) ganha "Ver os N cartões" → aba Cartões › Todos, filtrada naquele tema.

### 2. Hoje

- **Topo:**
  - "N para revisar · M novos · ~X min" (0,25 min por cartão, o `MIN_EST` de hoje);
  - botão grande **Revisar** (`cdRunStart`);
  - previsão de 7 dias (`cdForecast`).
- **Revisão:** a mesma de hoje (`cdRun`).
  - No computador: tecla **espaço** mostra a resposta, e **1–4** respondem Esqueci · Difícil · Bom · Fácil.
  - Isso só vale com a revisão aberta e sem campo de texto em foco.
- **+ Novo cartão** (`#cdNew`): abre o criador (seção 4).
- **Também em Hoje (o que já existe, que sai do Caderno):**
  - lote de melhorias (`cdLotEl`), quando houver rascunhos;
  - árvore por área (`cdTreeEl`), com "Estudar este grupo";
  - "Prontos para o Anki" (`cdAnkiEl`);
  - ajustes (`cdCfgEl`).
- **"Cartões que você mais esquece"** (`f.lapses ≥ 4`, não suspensos, até 5, o mais esquecido primeiro):
  - cada um tem **Editar** e **Juntar ao lote de melhorias** (o lote com o Claude que já existe);
  - "Ver todos" abre Todos com o filtro "Mais esquecidos".

### 3. Todos

- **Busca** (pergunta e resposta, sem acento).
- **Filtros** no padrão de chips e listas do app (Lote 20B):
  - área › tema;
  - situação: novo, aprendendo, revisão, suspenso, rascunho;
  - origem: erro, questão, trecho, manual, Claude;
  - mais esquecidos.
- **Ordem:** próxima revisão (padrão) · mais esquecidos · mais recentes.
- **Item:** pergunta (texto simples, 2 linhas), tema, situação e "próxima: 18/11" (ou "suspenso").
- **Lista longa:** aparecem 50, e "Mostrar mais 50" traz o resto.
- **Tocar num item:**
  - no computador (duas colunas), abre o editor (`cdEditEl`, o mesmo de hoje) ao lado, com a prévia;
  - no celular e no tablet em pé, abre o editor em tela própria, com "Voltar à lista";
  - o editor ganha **Suspender/Reativar**, **Trocar de tema** e **Apagar** (vai para a lixeira, como hoje).
- **Selecionar** (botão "Selecionar" liga caixinhas; "Selecionar todos os N" respeita os filtros). Ações:
  - Trocar de tema;
  - Suspender / Reativar;
  - Apagar (lixeira, um item só com os N cartões, como o `toTrash("cards",…)` do Anki);
  - Exportar para o Anki (.apkg): o mesmo `apkgBuild` e o mesmo "Já importei no Anki" que tira do app;
    - cartões novos vão como novos no Anki;
    - os que já têm agenda vão com ela.

### 4. Criar

- **Criador** (`#cdNewBox`, painel na parte Hoje e em Todos). Tem três abas pequenas.
- **Um cartão:**
  - tema com busca, igual ao `nbPickEl`; o último tema usado fica lembrado (`resid-cdlastk`);
  - pergunta e resposta, com **negrito**/*itálico* como no editor;
  - **Salvar e criar outro** (mantém o tema, limpa os campos, foco na pergunta) e **Salvar**.
- **Colar vários:**
  - um cartão por linha, `pergunta :: resposta` (aceita também tabulação, o .txt do Anki e de planilha);
  - um tema para todos;
  - prévia com uma caixinha por linha e o aviso das linhas que não entenderam;
  - **Criar N cartões**.
- **Criar com o Claude:**
  - escolher 1 a 5 temas e usar o pedido que já existe (`cardsPrompt`), um tema por vez, por copiar e colar como hoje;
  - o retorno passa pela mesma revisão de antes de salvar.
- **Aviso de repetido:**
  - ao salvar (nos três modos), se o mesmo tema já tem um cartão com a pergunta igual ou quase igual, aparece "Parecido com: … · Criar mesmo assim · Ver o outro";
  - "quase igual" = as mesmas palavras, sem acento e sem palavras curtas, com 80% ou mais em comum;
  - no "Colar vários", a linha repetida vem desmarcada, com o aviso.
- Cartão criado aqui: `src:"eu"`, `kind:"man"` (manual). O Claude: `src:"claude"`, como hoje.

### 5. Histórico e Números

- **Formato:**
  - campo novo no cartão `x.rv = [{d, g, i}]`, as **30 mais recentes** (a mais nova no fim);
  - `d` dia; `g` resposta 1–4; `i` intervalo que saiu (dias, 0 = mesmo dia);
  - gravado em `cdAnswer`, só na revisão que muda a agenda (o treino extra não grava).
- **Suspenso:** `x.su = 1`.
  - Fica fora de `cdDue`, `cdForecast`, `cdReady`, `cdGenIds`, `cdSliceIds`, da contagem da árvore e da fila do dia.
  - Aparece em Todos.
- **Os dois campos vão inteiros** com o cartão: `cdClean` passa a aceitar `rv` (lista limpa, até 30) e `su`, e o resto segue sozinho:
  - os pacotes da conta;
  - o backup;
  - o backup do Drive, que copia o item, confere t87 e `mapa.test.js`.
- **Números** (período 7 · 30 · 90 · Tudo, como nos outros filtros; padrão 30):
  - **Quanto você lembra:**
    - revisões com Difícil, Bom ou Fácil ÷ todas, contando só cartões que já estavam em revisão (`f.st===2` antes de responder), como a "retenção verdadeira" do Anki;
    - comparado com a meta do método, 90%;
    - separado em **jovens** (intervalo < 21 dias) × **maduros** (≥ 21).
  - **Revisões por dia:** barras do período.
  - **Previsão de 30 dias:** barras, vencidos de cada dia.
  - **Situação dos cartões:** novos · aprendendo · jovens · maduros · suspensos.
  - **Por área:** número de cartões e quanto lembra (com poucos dados, só o número).
  - **Os mais esquecidos:** os 10 com mais `lapses`, com Editar.
  - **Calendário:** últimos 6 meses, um quadrado por dia com cor pela quantidade de revisões, e a sequência de dias seguidos.
- **Poucos dados** (menos de 20 revisões guardadas no período): "Poucas revisões registradas ainda (o histórico começou em <data da publicação>)". O resto da tela continua aparecendo.
- **Gráficos** no estilo dos gráficos de Estatísticas (mesmas peças).

## Testes

- **Unitários** (`tests/unit/cartoes.test.js`):
  - o histórico guarda até 30 e não grava no treino extra;
  - `cdClean` com `rv`/`su`;
  - suspenso fora de `cdDue`/`cdForecast`/`cdReady`;
  - leitura do "colar vários" (`::`, tabulação, linha ruim);
  - o repetido (igual, quase igual, outro tema);
  - as contas dos Números (quanto lembra, jovens × maduros, por dia, sequência);
  - filtros e ordem da lista.
- **Tela** (`tests/t154.js`):
  - a aba na barra do celular (sem Erros, com Erros no Menu) e no computador;
  - Hoje: revisar e as teclas 1–4;
  - criar um, "Salvar e criar outro", colar vários, aviso de repetido;
  - Todos: busca, filtro, editar ao lado no computador, selecionar e suspender;
  - Números com e sem dados;
  - "Ver os N cartões" no tema;
  - fila do dia → aba;
  - Caderno sem "Revisar";
  - sem rolagem lateral a 390 px.
- **Continuam passando** os testes que citam cartões (t142, t99/t148 tela inteira, t121 fila), t87, t151, a suíte inteira e os toques aleatórios.
  Os testes antigos que entram nos cartões pelo Caderno são ajustados para a aba nova.

## Decisões do usuário

- 12/11/2026, 14h53: tirar os cartões do Caderno e criar uma aba própria.
- 13/11/2026, 08h42: o porquê (protagonismo, criar, organizar, editar, ver, estatísticas).
- 13/11/2026, 08h54: no celular, Cartões no lugar de Erros (Erros vai para o Menu).
- 13/11/2026, 09h06: todas as sugestões de 1 a 18, menos a 6 (lacuna).

## Escolhas do Claude (o usuário pode corrigir)

- **Desenho da tela:** três partes (Hoje · Todos · Números); a parte "Revisar" do Caderno some.
- **Histórico:** 30 revisões por cartão. Com muitos cartões, cada um ocupa ~0,6 KB a mais; cabe nos pacotes.
- **Estatísticas:**
  - "Lembrou" = Difícil, Bom ou Fácil (como no Anki);
  - maduro = intervalo ≥ 21 dias;
  - meta 90%;
  - "mais esquecido" = esqueceu 4 vezes ou mais.
- **Exportar para o Anki:** os selecionados seguem o mesmo fluxo de hoje e saem do app depois de "Já importei no Anki".
- **Uma entrega só** (um ramo), mostrada em prints antes de publicar.
