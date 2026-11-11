# Ferramentas da divisão em módulos

Servem para MOVER código entre arquivos de `src/app/js/` sem quebrar a carga do app (ADR 001). Nada aqui roda no site.
Instalar uma vez: `cd tools/divisao && npm i`.

- `node outline.js <pasta js> <arquivo> [de] [até]` — uma linha por instrução do topo (linha, tamanho, nomes).
- `node compact.js <pasta js> <arquivo>` — o mesmo, agrupado pelos comentários do topo (bom para planejar).
- `node topo.js <pasta js>` — lista o que a carga usa antes de declarar (instruções do topo, IIFE, callbacks síncronos
  e as funções que eles chamam, de forma transitiva). Avisos aqui podem ser caminhos que não rodam na carga.
- `node check.js <pasta de referência> <pasta candidata>` — a conferência de cada movimento. Compara com a ordem que funciona:
  nenhum aviso NOVO de uso antes de declarar; quem muda um objeto global no topo continua antes/depois de quem o lê;
  ouvintes do mesmo evento no mesmo alvo (e o mesmo `.onX`) na mesma ordem.
- `node mover.js <plano.txt> <pasta js>` — aplica um plano (`> destino.js` e linhas `origem.js:de-até`); confere que cada
  corte cai entre instruções do topo e que nenhuma linha some ou repete.
- `node regroup.js <marcações.txt> <pasta js>` — monta o plano a partir de marcações "arquivo linha módulo".
  `fase2-marcacoes.txt` é o registro da fase 2 (linhas dos arquivos ANTIGOS, de 06/11/2026); não serve para os atuais.

Roteiro de um movimento: copiar `src/app/js` para uma pasta temporária, aplicar o plano na cópia, `check.js` (original × cópia),
aplicar no repositório, `python3 src/build_site.py`, `tests/run.sh --rapido` e, por módulo, `tests/run.sh`.
