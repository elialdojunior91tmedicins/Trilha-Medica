// Mapa do código (tools/mapa/): confere que o gerador lê o app inteiro e acha o que se sabe que existe.
const test = require("node:test"), assert = require("node:assert/strict");
const fs = require("fs"), path = require("path");
const semDeps = !fs.existsSync(path.join(__dirname, "../../tools/divisao/node_modules/acorn"));

test("mapa: todos os arquivos, nomes sem repetição, ligações entre funções, ids, chaves e testes", { skip: semDeps && "falta cd tools/divisao && npm i" }, () => {
  const L = require("../../tools/mapa/lib.js"), M = L.build();
  assert.equal(M.files.length, L.inputs().js.length);
  assert.equal(M.files.reduce((a, f) => a + f.n, 0), Object.keys(M.sym).length, "nome repetido no topo de dois arquivos");
  const r = M.sym.render; assert.ok(r && r.k === "fn" && r.f === "140-geral/030-navegacao.js" && r.by.length > 100);
  for (const n of ["today", "migrate", "buildBackup", "uiSanitize", "bankPut", "crSuggest"]) assert.ok(M.sym[n] && M.sym[n].l > 0, n);
  assert.ok(M.sym.crSuggest.uses.includes("crProva") && M.sym.crProva.by.includes("crSuggest"));
  // as linhas batem com o arquivo
  for (const n of ["crSuggest", "render", "migrate"]) { const s = M.sym[n], t = fs.readFileSync(path.join(L.ROOT, "src/app/js", s.f), "utf8").split("\n")[s.l - 1]; assert.ok(t.includes("function " + n), n + " na linha " + s.l); }
  assert.ok(M.ids.crSee.def.includes("crCardEl")); assert.ok(M.ids["crOk-*"]);
  assert.ok(M.ls["resid-ui-v1"]); assert.ok(M.prefs.hgoal.w.length); assert.ok(M.fs["col:exams"] && M.fs["pk:bank"]);
  assert.ok(M.cls.card.css.length > 5 && M.css.vars["--accent"].def.length);
  assert.ok(M.tests.t152.syms.includes("crSuggest") || M.tests["hy.test"].syms.includes("crSuggest"));
  assert.ok(M.extra["bridge.js"].items.some(i => i.n === "applyBackup"));
});

test("dados salvos: toda lista da conta está no backup (ou explicada), e o site e o Drive leem cada chave", { skip: semDeps && "falta cd tools/divisao && npm i" }, () => {
  const L = require("../../tools/mapa/lib.js"), D = require("../../tools/mapa/dados.js");
  const M = L.build();
  assert.deepEqual(M.data.warn, [], "veja mapa/dados.md (node tools/mapa/gerar.js)");
  const row = k => M.data.rows.find(r => r.key === k);
  assert.ok(row("cards").ls.includes("resid-cards-v1") && row("cards").acct.includes("pk:cards") && row("cards").clean === "cdClean");
  assert.equal(row("examProg").clean, "exPClean");
  const ty = k => M.data.types.find(t => t.key === k).fields.map(f => f.k.replace("?", ""));
  assert.ok(ty("cards").includes("hy") && ty("bank").includes("fav") && ty("bank").includes("crs"));
  assert.ok(ty("topics (state[chave])").includes("qd") && ty("topics (state[chave])").includes("qb") && ty("errors").includes("ra"));
  assert.ok(!ty("errors").includes("textContent"), "elemento da tela não é campo do erro");
  // o aviso aparece de verdade: lista nova na conta sem backup, chave que o Drive esqueceu
  const rd = L.rd;
  try {
    L.rd = f => f === "tools/backup-drive.gs" ? rd(f).replace(/\bsims\b/g, "simsX") : f.endsWith("220-abertura.js") ? rd(f).replace('notes:prog.collection("notes")', 'notes:prog.collection("notes"),novaLista:prog.collection("novaLista")') : rd(f);
    const W = D.build(M).warn.join("\n");
    assert.match(W, /sims: .*Drive/); assert.match(W, /col:novaLista: está na conta e não entra no backup/);
  } finally { L.rd = rd; }
});
