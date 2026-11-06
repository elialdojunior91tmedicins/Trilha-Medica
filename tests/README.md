# Testes da Trilha Médica

Testes de ponta a ponta com Playwright (Chromium), um arquivo por recurso. Cada teste abre o app
como o Claude publica o artefato (`preview.html`, montado de `src/checklist-residencia.html`) ou como
o site (`http://localhost:8765/`, a raiz do repositório), nos 6 aparelhos de referência: celular 390,
iPad dentro do Claude (578 com tela 1180×820), tablet em pé 820, tablet deitado 1180, notebook 1366 e
monitor 1920. Cada linha impressa começa com `OK` ou `FALHA`.

## Como rodar

```
python3 src/build_site.py   # o site precisa do index.html atualizado
tests/run.sh                # todos (uns 10 minutos), 3 em paralelo
tests/run.sh t74 t76        # só alguns
tests/run.sh --monkey       # toques aleatórios nos 6 aparelhos, procura erros de JavaScript
tests/run.sh --unit         # lógica no Node, sem navegador (~2 s)
tests/run.sh --rapido       # unitários + t151 (abertura nos 6 aparelhos, todas as abas; ~30 s)
```

## Testes unitários (`tests/unit/`, desde 11/2026)

`tests/unit/load.js` carrega a lógica do app no Node, sem navegador: lê `src/app/js/` na ordem, declara todas as
funções e roda cada instrução de topo protegida (as que mexem na tela falham sem efeito; a carga da conta não roda;
temporizadores desligados). `load({now:"2026-11-06T12:00:00"})` fixa o relógio. Objetos criados lá dentro vêm de
outro "mundo" do JavaScript: para comparar com `deepEqual`, copie antes (`[...v]` ou `JSON.parse(JSON.stringify(v))`).
Usa só o `node:test` do próprio Node e o acorn guardado em `tests/unit/vendor/` (licença MIT ao lado).

- `fsrs.test.js`: FSRS dos cartões (`fsNext`, `fsPreview`) e a fila `cdDue`.
- `revisoes.test.js`: `INT`, `interval` com o acerto, `dueIn`, ajuste `s.adj`, botões `revNext`, folga.
- `markdown.test.js`: `md`/`inl`/`flowHTML`; 24 textos de ataque não podem virar HTML ativo.
- `backup.test.js`: `backup-sample.json` passa pela carga (`registerOwn` → `migrate`, `errOk`, `facNormalize`) e volta igual.

Vários testes são "fotos" do comportamento atual (ex.: a sequência Bom, Bom, Bom do FSRS = 4, 23, 109, 437 dias): se uma
mudança alterar o número de propósito, atualize o teste junto e diga no commit.

Precisa de Node com o pacote `playwright` (1.56) e do Chromium (`PLAYWRIGHT_BROWSERS_PATH`). Em outro
ambiente: `npm i playwright@1.56 && npx playwright install chromium`.

## Peças

- `mockdb.js`: imita `window.claude.use` (db, user, sample, downloads) do artefato; `window.__store` é o
  banco em memória. Marca os Primeiros passos como vistos, a não ser que o teste defina `window.__wantOnb`.
- `fakefb.js`: imita o Firebase para os testes do site (dados em `localStorage.__fbdb`).
- `mkprev.py`: monta `preview.html`.
- `list.txt`: os testes da rodada completa.

## O que cada teste cobre (resumo)

| Testes | Parte do app |
| --- | --- |
| t20–t29 | Residência, plano, revisões, celular e tablet |
| t30–t33, t38, t46, t56, t64, t68 | Site: conta, backup, Firebase, ajuda |
| t35–t37, t47–t49, t72, t73 | Faculdade (pastas, ementa, provas, SP, materiais) |
| t39–t45, t50–t55 | Questões, anotações, Perfil, Configurações, Foco |
| t57–t63 | Início, PDF, notas, cartões, imagem |
| t65–t71 | Caderno de erros e tela inteira |
| t74 | Fila do dia, busca, primeiros passos, Anki, calendário, temas divididos na conta |
| t75 | Provas de residência e projeção semanal |
| t80 | Vários aparelhos ao mesmo tempo: atualização ao vivo entre aparelhos |
| t81 | Gerador de questões: instruções novas, porquê de cada alternativa, alternativas embaralhadas |
| t82 | Faculdade: ligar conteúdo a um tema da residência sem substituir (tema inteiro ou subtópicos) |
| t76 | Lixeira e intervalos ajustados pelo acerto |
| t85 | Planejar a semana: semana padrão, esta semana, tempo de hoje (30 min a 3 h+), cartão de domingo/segunda, simulado e folga |
| t111 | Estatísticas (Residência · Faculdade, veredictos, 4 blocos) e melhorias dos gráficos (Lote 10); dados de exemplo em `seed10.js` |
| t112 | Lote 11: 198 temas, pesos revistos e psiquiatria dividida em 4 (migração do progresso e das ligações da faculdade) |
| t113 | Lote 12: referências nas questões, Refazer espaçado (fila do dia, filtros, teimosas, simulado) e "Seus temas nas questões" |
| t114 | Lote 13: caderno único (busca única, tipo, sem anotação como filtro, 1ª página ligada vira a página do tema, + Nova página ligada) e tema repaginado |
| t115 | Lote 14: simulado misto completo (Escolher temas, dificuldade, estilo ENAMED, resumo), material em partes com figuras, imagem só no Refazer, Meus simulados |
| t116 | Lote 15: provas na íntegra — temas pelo título e assunto da prova, até 3 temas por questão (inteiros em cada tema, 1 vez no dia), gabarito comentado sem fantasmas, figura recortada na questão certa |
| t117 | Lote 16: catálogo de provas no Perfil (sugestões ao digitar, data estimada pelo mês habitual, lista por região, nome livre) |
| t118 | Corrigir gabarito no Refazer (era a sua → sai e vira acerto no tema; outra letra → continua; prova na íntegra corrigida junto) |
| t119 | Rodízio dos subtópicos na revisão (revisados há mais tempo primeiro, ≈1/4 do tema, sem repetir no último degrau, "Tive dificuldade" não recomeça) |

## Falhas conhecidas do ambiente

Recarregar a página em `file://` pode perder o `localStorage` no Playwright: t28 ("seção lembrada ao
reabrir") e t70 ("escolha lembrada") às vezes falham por isso, não por erro do app. Rode de novo isolado.
