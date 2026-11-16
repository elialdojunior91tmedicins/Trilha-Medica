# Arquitetura em detalhe

Movido do `CLAUDE.md` em 16/11/2026, sem mudar o texto. O `CLAUDE.md` guarda o resumo e aponta para cá; leia a seção antes de mexer no assunto dela.
Onde um nome está no código agora: `node tools/mapa/onde.js <nome>` (também diz em que linha deste arquivo ele é citado).

## Módulos de `src/app/js/`

   Módulos (fase 2, 11/11/2026; fase 3, 12/11/2026): `010-dados/` (só literais: `010-temas` = áreas, temas, subtópicos, incidência; `020-curadoria` = `HY_DEF`,
   `DN_DEF`, `AX_NEAR`; `030-catalogos` = `EX_CAT`, `OF_CAT`; `040-textos` = instruções do gerador, `HERO_FRASES`, `HELP`; conferidos em `tests/unit/dados.test.js`) · `020-nucleo` (estado, datas, subtópicos, níveis, `lsGet`) · `030-texto`
   (markdown, `[[links]]`, selos, editor, fluxograma) · `040-plano` (plano do dia, revisões, semana, eixo, modo provas) · `050-residencia`
   (lista, filtros, tema aberto, agenda, mapa) · `060-faculdade/` (estrutura, provas, grade, telas) · `070-arquivos` (Word/PowerPoint,
   materiais, figuras) · `080-questoes/` (gerador, ações da questão, aba, Refazer, simulado) · `090-caderno/` (página, pegadinhas, livre e PDF,
   ler arquivo) · `100-cartoes/` (base: FSRS, erro → cartão, lote, editor, Anki; dados: contas da aba; aba: Hoje, Todos, Números) · `110-erros/` (dados, revisar, aba) · `120-inicio` (fila, saudação, placar, projeção) · `130-foco` ·
   `140-geral/` (peças comuns: dica, filtros `fc*`, tela inteira, avisos, lixeira; busca, primeiros passos, .ics, Ajuda; navegação, `render`,
   `renderAll`) · `150-perfil` (preferências `ui`, Perfil, Configurações, catálogo de provas) · `160-pdf` · `170-estatisticas` ·
   `180-banco/` (dados, tela, provas oficiais) · `190-provas/` (dados, importar, fazer a prova) · `200-backup` · `210-conta` (gravação,
   sincronização) · `220-abertura` (carga, por último). Arquivo novo numa pasta de módulo: `NNN-nome.js`, de 10 em 10.
   Recurso novo vai no módulo do assunto dele, nunca no fim.
   Mover código de lugar: `tools/divisao/` (`check.js` confere a ordem nova antes; veja o LEIA.md de lá).

## Testes nos aparelhos e preview

   renomeou algo e ele falhou → ajuste o `bridge.js` junto. Para ver o que os testes não alcançam: `tests/run.sh --cobertura` (`tests/README.md`). Teste no celular (390px, toque), tablet (820/1180, toque, inclusive 578px com tela 1180×820 =
   iPad dentro do app do Claude) e computador (1366, 1920). Modos de layout ficam em
   `html[data-layout=phone|tablet|desktop|compact][data-cols]`, decididos pelo tamanho da TELA.

- `src/app/`: o código do app em trechos (HTML/CSS/JS); `src/checklist-residencia.html` = os trechos juntados (saída do build, fora do
  repositório; o preview `tests/mkprev.py` e 20 testes antigos abrem esse arquivo, que é o app sem o `bridge.js`). No Claude usa `window.claude.use(...)` (db, user, sample, downloads).
  Divisão em módulos: fase 1 (cortar) e 1.5 (testes de proteção: `tests/unit/`, `tests/t151.js`) em 06/11/2026; fase 2 (agrupar
  por assunto, sem mudar linha) em 11/11/2026 e o gerado fora do repositório em 12/11/2026; fase 3 (dados e textos em `js/010-dados/`) em 12/11/2026; detalhes em `docs/adr/001-divisao-em-modulos.md`. Tempo de abertura: Configurações › Tempo de abertura
  (`perfCardEl`; o script do `topo.html` grava as últimas 12 em `resid-perf`; teste t150).

## Vários aparelhos ao mesmo tempo (sincronização)

- Vários aparelhos ao mesmo tempo (`js/210-conta.js`; a carga fica em `js/220-abertura.js`): depois de carregar a conta, `liveStart()` ouve com `onSnapshot`
  o `progress`, `progress/topics`, `faculdade`, `prefs`, `settings`, `notes` e as listas (errors, free, trash, cards, redo, focus) — 12 assinaturas;
  `bridge.js` repassa o `onSnapshot` do Firestore com `metadata`. Regras: nunca aplica a volta da própria gravação (`pend`/`echo`, `liveW` guarda o
  que este aparelho gravou por último) nem passa por cima do que ainda vai ser enviado (`saveTimer`/`facTimer`/`uiTimer`/`noteTimers[k]` voltam a 0
  ao disparar; tema com `JSON(state[k])!==tSaved[k]`); `hist` junta pelo maior valor; listas atualizam o objeto no lugar e só apagam ids já vistos
  (`liveSeen`). A tela só é redesenhada (`liveFlush`) sem campo em edição e após `LIVE_IDLE` (5 s) sem toque/tecla; `#save` mostra
  "Atualizado com seus outros aparelhos". Ao voltar ao app após 30 min em segundo plano (`liveHidAt`, Lote 18; antes eram 5 min) ou com `online`, `liveRefresh` confere tudo com `get()`. Teste: `tests/t80.js`
  (`mockdb.js` tem `window.__remote(caminho,dados)`; no `fakefb.js` duas páginas do mesmo contexto são dois aparelhos).

## Leituras da conta, apagados em outro aparelho e pacotes (Lote 18)

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

## Backup automático no Google Drive

- Backup automático no Google Drive: `tools/backup-drive.gs` + `tools/appsscript.json` (Apps Script na conta do usuário, gatilho diário às 3h;
  lê o Firestore por REST com o token do dono do projeto e `X-Goog-User-Project`, só leitura; monta o MESMO objeto do `buildBackup()`, tira `updatedAt`
  das prefs; pasta "Nexus - Trilha Médica (backups)" com escopo `drive.file`, guarda 30). Restaurar = Importar backup do site. Instalação em
  `tools/backup-drive-LEIA.md`. **Mudou o formato dos dados ou um campo novo no `buildBackup` → atualizar o script** (teste `tests/t87.js` compara os dois).
