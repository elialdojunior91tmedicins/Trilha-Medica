# ADR 001 — Dividir o app em módulos

Data: 06/11/2026 · Situação: fases 1 e 1.5 na `main` (06/11); fase 2 feita em 11/11/2026 na branch `fase-2-juntar`, aguardando aprovação

## Contexto

O app inteiro estava em `src/checklist-residencia.html`: 1,6 MB, sendo 1,3 MB de JavaScript com 1.108 funções.
Em 05/11/2026 o artefato do Claude foi congelado porque o arquivo não cabe numa conversa. O mesmo limite vale
para ler o código antes de mudá-lo.

## Decisão

O código-fonte passa a viver em `src/app/`: `topo.html`, `css/app.css`, `corpo.html`, `js/NNN-nome.js`
(numerados de 10 em 10, juntados em ordem de nome) e `fim.html`. O `build_site.py` junta tudo, sem mudar nenhum
byte, em `src/checklist-residencia.html` (gerado: não editar à mão), que o preview e 21 testes leem, e monta o
`index.html` como antes. O build para se o gerado for editado à mão (impressão em `src/app/.gerado.sha1`) e tem
`--check`. Site, modo offline e dados não mudam.

## Fases

1. **Cortar** em trechos, na ordem atual, sem mudar nenhuma linha. Feito em 06/11/2026: 31 trechos de JS
   (35 arquivos), cortados só em cabeçalhos de seção entre instruções de topo; cada trecho é JavaScript válido
   sozinho (acorn). Prova: `index.html`, `sw.js` e o gerado idênticos (mesmo SHA-1; versão `d0ed9902`).
2. **1.5 — Testes de proteção** em `tests/unit/` (Node, segundos): FSRS (`fsNext`, `cdDue`), revisões (`dueIn`,
   `s.adj`), markdown (`md`, `inl`: escape de HTML), importação e migração de backup. Mais um teste de abertura
   (Playwright: erro de página ao abrir e passar pelas abas). Feito em 06/11/2026: `tests/unit/` (27 testes, ~2 s,
   `tests/run.sh --unit`) e `tests/t151.js` (6 aparelhos × conta vazia e com dados; ~25 s); `tests/run.sh --rapido` roda os dois.
3. **Juntar** os trechos de cada módulo, das folhas ao núcleo. Antes de cada troca de ordem, uma análise automática
   (acorn) lista o que cada trecho declara com `const`/`let` e executa no topo; só se move o que for seguro.
   Unitários e abertura a cada movimento; 134 testes a cada módulo. No fim, os 21 testes leem o `index.html` e o
   arquivo gerado sai do repositório.
   **Feito em 11/11/2026, numa passada só** (o plano previa 2.0/2a/2b/2c em branches separadas; a ferramenta da branch
   `fase-2-analise`, que não chegou ao GitHub, foi refeita em `tools/divisao/`). Cada bloco entre comentários do topo foi marcado
   com um assunto (`tools/divisao/fase2-marcacoes.txt`) e os 31 trechos viraram 22 módulos, 8 deles pastas com 3–5 arquivos
   (todos ≤ 61 KB): dados, núcleo, texto, plano, residência, faculdade/, arquivos, questões/, caderno/, cartões, erros/, início,
   foco, geral/, perfil, pdf, estatísticas, banco/, provas/, backup, conta, abertura. Dentro de cada módulo os blocos ficam na ordem
   antiga; nenhuma linha mudou (o mover confere que o conjunto de linhas é o mesmo). O build e `tests/unit/load.js` leem as pastas
   (ordem de caminho). A conferência (`tools/divisao/check.js`, acorn + eslint-scope) compara com a ordem antiga: (a) nada usado
   antes de declarar na carga — instruções do topo, IIFE, callbacks que rodam na hora e, de forma transitiva, as funções que eles
   chamam; (b) quem muda um objeto global no topo continua antes/depois de quem o lê; (c) ouvintes do mesmo evento no mesmo alvo
   (os 8 `keydown` do `document`, `visibilitychange`, `online`, `focusout`) na mesma ordem, o que fixou a ordem caderno < erros <
   geral < banco < provas e foco < banco < abertura. Os 9 avisos que a ordem antiga tinha (caminhos que não rodam na carga) caíram
   para 1. Provas: unitários 27/27, abertura (t151) nos 6 aparelhos e a suíte completa.
   **Falta da fase 2:** os testes que abrem `src/checklist-residencia.html` passarem a abrir o `index.html`, e o gerado sair do
   repositório (vira saída do build).
4. **Dados e textos** (temas, incidência, Ajuda) em `.js` próprios ou embutidos pelo build, sem carga assíncrona;
   ampliar `tests/unit/`.

Antes da fase 2: medir a abertura no celular (pode pedir carga sob demanda de PDF, Anki e importação, o que muda
as fronteiras dos módulos). Simulação de 06/11 (CPU 4× mais lenta): ~0,8 s com o app guardado no aparelho, ~1,5 s
estimado na 1ª visita. Medida real (06/11/2026, iPhone do usuário, Configurações › Tempo de abertura): app instalado com
os arquivos do aparelho 116–125 ms (4 aberturas); 1ª abertura depois de uma versão nova 652 ms (510 KB); aba anônima, sem nada
guardado, 991 ms. **Decisão: sem carga sob demanda.** As fronteiras da fase 2 seguem só o assunto. Rever se a 1ª abertura passar
de 2 s ou se o app instalado passar de 1 s.

## Consequências

- (+) cada trecho cabe numa conversa (fase 1: o maior com 80 KB; fase 2: o maior com 61 KB); mudanças menores e revisáveis
- (+) base para testes unitários
- (−) o build junta vários arquivos; editar o gerado à mão é barrado pelo build
- (−) a fase 2 muda a ordem do código; a análise do topo e o teste de abertura reduzem o risco
- (+) depois da fase 2, cada assunto mora num lugar só; mapa dos módulos no CLAUDE.md (Como atualizar, item 1)
- O artefato do Claude continua congelado: ele exige o arquivo inteiro.
