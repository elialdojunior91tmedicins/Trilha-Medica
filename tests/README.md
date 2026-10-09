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
```

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
| t76 | Lixeira e intervalos ajustados pelo acerto |

## Falhas conhecidas do ambiente

Recarregar a página em `file://` pode perder o `localStorage` no Playwright: t28 ("seção lembrada ao
reabrir") e t70 ("escolha lembrada") às vezes falham por isso, não por erro do app. Rode de novo isolado.
