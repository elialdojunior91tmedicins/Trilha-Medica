# ADR 001 — Dividir o app em módulos

Data: 06/11/2026 · Situação: proposta (fase 1 feita na branch `fase-1-dividir-arquivo`, aguardando o teste do usuário)

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
4. **Dados e textos** (temas, incidência, Ajuda) em `.js` próprios ou embutidos pelo build, sem carga assíncrona;
   ampliar `tests/unit/`.

Antes da fase 2: medir a abertura no celular (pode pedir carga sob demanda de PDF, Anki e importação, o que muda
as fronteiras dos módulos). Simulação de 06/11 (CPU 4× mais lenta): ~0,8 s com o app guardado no aparelho, ~1,5 s
estimado na 1ª visita. Medida real (06/11/2026, iPhone do usuário, Configurações › Tempo de abertura): app instalado com
os arquivos do aparelho 116–125 ms (4 aberturas); 1ª abertura depois de uma versão nova 652 ms (510 KB); aba anônima, sem nada
guardado, 991 ms. **Decisão: sem carga sob demanda.** As fronteiras da fase 2 seguem só o assunto. Rever se a 1ª abertura passar
de 2 s ou se o app instalado passar de 1 s.

## Consequências

- (+) cada trecho cabe numa conversa (o maior tem 80 KB); mudanças menores e revisáveis
- (+) base para testes unitários
- (−) o build junta vários arquivos; editar o gerado à mão é barrado pelo build
- (−) a fase 2 muda a ordem do código; a análise do topo e o teste de abertura reduzem o risco
- O artefato do Claude continua congelado: ele exige o arquivo inteiro.
