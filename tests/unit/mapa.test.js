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
