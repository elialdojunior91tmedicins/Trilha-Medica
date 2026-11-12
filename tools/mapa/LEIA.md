# Mapa do código

Um índice do app inteiro, gerado a partir do código: cada função e constante do topo de `src/app/js/` (arquivo, linhas, parâmetros,
comentário, o que usa, quem usa), cada id e classe (onde é criado, onde o CSS o estiliza, que teste o toca), as chaves do
localStorage, as preferências `ui.prefs`, os caminhos da conta, as seções e variáveis do CSS, o `bridge.js`, o backup do Drive e os testes.
Nada aqui roda no site. Usa o `acorn` e o `eslint-scope` de `tools/divisao/` (`cd tools/divisao && npm i`, uma vez).

O mapa fica em `mapa/`, **fora do repositório** (`.gitignore`): é saída, como o `src/checklist-residencia.html`. Gera em ~2 s e nunca fica
velho, porque o `onde.js` gera de novo sozinho quando algum arquivo mudou.

- `node tools/mapa/gerar.js` — gera `mapa/` (`--se-preciso` só se mudou; `--check` só confere).
- `node tools/mapa/onde.js <nome | #id | .classe | resid-chave | prefs.x | texto>` — onde está e quem usa.
- `node tools/mapa/onde.js --codigo <nome>` — o código exato daquele nome (os arquivos têm linhas longas: é mais barato que abrir o arquivo).
- `node tools/mapa/onde.js --quem <nome> -n 2` — quem chama, em N níveis.
- `node tools/mapa/onde.js --testes <nome…>` — os testes que citam esses nomes (e quem os chama), com o comando pronto.
- `node tools/mapa/onde.js --diff [base]` — nomes mexidos desde a base (padrão `main`) e os testes a rodar.
- `node tools/mapa/onde.js --arquivo <trecho do caminho>` — o resumo de um módulo.

Arquivos gerados: `INDICE.md` (comece aqui: módulos na ordem de carga, funções mais usadas, maiores, sem uso), `modulos/*.md` (um por
arquivo JS), `css.md`, `chaves.md`, `testes.md`, `fora-do-app.md`, `simbolos.tsv`, `ids.tsv`, `classes.tsv` e `mapa.json` (tudo, para scripts).

## Limites (o que o mapa NÃO vê)
- Só nomes do **topo** dos arquivos. Função declarada dentro de outra aparece no código da de fora (`--codigo`).
- "Usado por" vem das referências pelo nome. Chamada montada como texto (`onclick="x()"` dentro de HTML) não é vista: confira com `grep`.
- Ids e classes vêm de textos reconhecíveis (`id="…"`, `.id=`, `class="…"`, `classList`, seletores). Id montado em pedaços aparece como `prefixo*`.
- Teste "toca" um nome quando a palavra aparece no arquivo do teste; nomes que aparecem em mais da metade dos testes ficam de fora.
- `--diff` é por linha: num arquivo com várias declarações na mesma linha, todas aparecem como mexidas.
- O formato dos dados salvos (campos de `state[k]`, `fac`, erros, cartões…) não sai do código: está no `CLAUDE.md`.
