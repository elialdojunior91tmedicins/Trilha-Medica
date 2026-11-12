#!/usr/bin/env node
// Consulta o mapa do código (gera de novo sozinho se algum arquivo mudou). Uso, na raiz do repositório:
//   node tools/mapa/onde.js crSuggest            nome exato: onde está, o que usa, quem usa, testes, CLAUDE.md
//   node tools/mapa/onde.js '#bkGo' .crcard resid-bkbc prefs.hgoal col:exams     id, classe, chave, preferência, conta
//   node tools/mapa/onde.js sugest               sem nome exato: procura no nome, no comentário, nos ids e nas classes
//   node tools/mapa/onde.js --codigo crSuggest   o código do nome (--tudo tira o limite de 6000 letras)
//   node tools/mapa/onde.js --quem render -n 2   quem chama, em N níveis (padrão 1)
//   node tools/mapa/onde.js --testes a b         testes que tocam nesses nomes ou em quem os chama (comando pronto)
//   node tools/mapa/onde.js --diff [base]        nomes mexidos desde a base (padrão: main) e os testes a rodar
//   node tools/mapa/onde.js --arquivo 180-banco/040   o resumo de um módulo
const fs = require("fs"), path = require("path"), cp = require("child_process");
const L = require("./lib.js"), MAP = path.join(L.ROOT, "mapa/mapa.json");
let M; try { M = JSON.parse(fs.readFileSync(MAP, "utf8")); } catch (e) { M = null; }
if (!M || M.stamp !== L.stamp()) { cp.execFileSync("node", [path.join(__dirname, "gerar.js"), "--quieto"], { stdio: "inherit" }); M = JSON.parse(fs.readFileSync(MAP, "utf8")); }
const args = process.argv.slice(2), flag = n => { const i = args.indexOf(n); if (i < 0) return false; args.splice(i, 1); return true; };
const opt = (n, d) => { const i = args.indexOf(n); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
const anon = new Map(M.anon.map(a => [a.key, a])), rec = k => M.sym[k] || anon.get(k);
const at = k => { const r = rec(k); return r ? `${k.startsWith("@") ? "(topo)" : k}  src/app/js/${r.f}:${r.l}` : k; };
const some = (a, n) => a.length > n ? a.slice(0, n).join(", ") + ` +${a.length - n}` : a.join(", ");
const src = r => { const t = fs.readFileSync(path.join(L.ROOT, "src/app/js", r.f), "utf8"); return t.split("\n").slice(r.l - 1, r.e).join("\n"); };
const body = (k) => { const r = rec(k), t = fs.readFileSync(path.join(L.ROOT, "src/app/js", r.f), "utf8"); const O = L.topOutline(t, r.f).out.find(x => x.n === k && x.l === r.l); return O ? t.slice(O.a, O.b) : src(r); };

function card(k) { const r = rec(k), o = [];
  o.push(`${r.k === "fn" && r.sig.startsWith("async ") ? "async " : ""}${k}${r.k === "fn" ? r.sig.replace(/^async /, "") : ""}  [${r.k}]  src/app/js/${r.f}:${r.l}${r.e > r.l ? "–" + r.e : ""}  (${r.sz} letras)`);
  if (r.val) o.push("  valor: " + r.val); if (r.doc) o.push("  " + r.doc);
  if (r.uses.length) o.push("  usa: " + some(r.uses, 40)); if (r.writes.length) o.push("  muda: " + r.writes.join(", "));
  if (r.by.length) o.push(`  usado por (${r.by.length}): ` + some(r.by.map(x => { const q = rec(x); return (x.startsWith("@") ? "topo" : x) + "·" + q.f.replace(/\.js$/, ""); }), 30));
  if (r.idDef.length) o.push("  cria #" + r.idDef.join(", #")); if (r.idUse.length) o.push("  procura #" + some(r.idUse, 30));
  if (r.cls.length) o.push("  classes: " + some(r.cls, 30)); if (r.ls.length) o.push("  localStorage: " + r.ls.join(", "));
  if (r.prefs.length) o.push("  ui.prefs: " + r.prefs.map(p => p + (r.prefsW.includes(p) ? "✎" : "")).join(", ")); if (r.fs.length) o.push("  conta: " + r.fs.join(", "));
  if (r.tests && r.tests.length) o.push("  testes: " + some(r.tests, 30)); if (r.cm && r.cm.length) o.push("  CLAUDE.md: L" + r.cm.join(", L"));
  return o.join("\n"); }
const callers = (names, depth) => { const seen = new Set(names); let cur = names; for (let d = 0; d < depth; d++) { const nx = []; for (const n of cur) for (const b of (rec(n) || { by: [] }).by) if (!seen.has(b)) { seen.add(b); nx.push(b); } cur = nx; } return [...seen]; };
function testsFor(names) { const direct = new Map(), near = new Map();
  for (const n of names) for (const t of (M.sym[n] && M.sym[n].tests) || []) if (!t.startsWith("(")) direct.set(t, (direct.get(t) || 0) + 1);
  for (const n of callers(names, 1)) if (!names.includes(n)) for (const t of (M.sym[n] && M.sym[n].tests) || []) if (!t.startsWith("(") && !direct.has(t)) near.set(t, (near.get(t) || 0) + 1);
  // ids criados por esses nomes também apontam testes
  for (const n of names) for (const id of (rec(n) || { idDef: [] }).idDef) for (const t of (M.ids[id] && M.ids[id].tests) || []) direct.set(t, (direct.get(t) || 0) + 1);
  const ord = m => [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "en", { numeric: true })).map(e => e[0]);
  return { direct: ord(direct), near: ord(near) }; }
function printTests(names) { const T = testsFor(names), common = names.filter(n => M.common.includes(n));
  const unit = T.direct.filter(t => M.tests[t].kind === "unit"), tela = T.direct.filter(t => M.tests[t].kind === "tela");
  console.log(`\nTestes que citam ${names.length === 1 ? "esse nome" : "esses nomes"} (${T.direct.length}):`);
  if (unit.length) console.log("  unitários: " + unit.join(" ") + "   → tests/run.sh --unit");
  if (tela.length) console.log("  de tela:   tests/run.sh " + tela.slice(0, 25).join(" ") + (tela.length > 25 ? `   (+${tela.length - 25}: melhor a suíte inteira)` : ""));
  const nt = T.near.filter(t => M.tests[t].kind === "tela"); if (nt.length) console.log(`  por quem chama (${nt.length}): ` + some(nt, 20));
  if (common.length) console.log("  ⚠ usados em mais da metade dos testes (rode a suíte inteira): " + common.join(", "));
  if (!T.direct.length && !nt.length) console.log("  nenhum: recurso sem teste que o cite pelo nome. Escreva um, ou confira pelos ids em mapa/testes.md"); }

if (flag("--arquivo")) { const q = args[0] || "", F = M.files.filter(f => f.short.includes(q)); if (F.length !== 1) { console.log(F.length ? "Mais de um:\n  " + F.map(f => f.short).join("\n  ") : "Nenhum arquivo com esse trecho."); process.exit(F.length ? 0 : 1); }
  process.stdout.write(fs.readFileSync(path.join(L.ROOT, "mapa/modulos", F[0].short.replace(/\//g, "__").replace(/\.js$/, ".md")), "utf8")); process.exit(0); }
if (flag("--codigo")) { const all = flag("--tudo"); for (const k of args) { if (!rec(k)) { console.log(`${k}: não é um nome do topo. Tente: node tools/mapa/onde.js ${k}`); continue; } const r = rec(k), s = body(k); console.log(`// ${k} · src/app/js/${r.f}:${r.l}${r.e > r.l ? "–" + r.e : ""}\n` + (all || s.length <= 6000 ? s : s.slice(0, 6000) + `\n… (+${s.length - 6000} letras; --tudo mostra o resto)`) + "\n"); } process.exit(0); }
if (flag("--quem")) { const n = +opt("-n", 1); for (const k of args) { if (!rec(k)) { console.log(k + ": não achei"); continue; } const C = callers([k], n).filter(x => x !== k); console.log(`${k}: ${C.length} em ${n} nível(is)\n` + C.map(x => "  " + at(x)).join("\n")); } process.exit(0); }
if (flag("--testes")) { const ok = args.filter(k => M.sym[k]); args.filter(k => !M.sym[k]).forEach(k => console.log(k + ": não é um nome do topo")); if (ok.length) printTests(ok); process.exit(0); }
if (flag("--diff")) { const base = args[0] || "main"; let d = "";
  try { d = cp.execFileSync("git", ["diff", "-U0", base, "--", "src/app", "bridge.js", "tools/backup-drive.gs"], { cwd: L.ROOT, encoding: "utf8", maxBuffer: 1 << 28 }); } catch (e) { console.log("git diff falhou: " + e.message); process.exit(1); }
  const hit = new Set(), other = new Set(); let f = "";
  for (const ln of d.split("\n")) { let m; if ((m = /^\+\+\+ b\/(.*)/.exec(ln))) { f = m[1]; continue; } if (!(m = /^@@ -\S+ \+(\d+)(?:,(\d+))?/.exec(ln))) continue;
    const a = +m[1], b = a + Math.max(1, m[2] == null ? 1 : +m[2]) - 1;
    if (!f.startsWith("src/app/js/")) { other.add(f); continue; } const short = f.replace("src/app/js/", "");
    for (const n in M.sym) { const r = M.sym[n]; if (r.f === short && r.l <= b && r.e >= a) hit.add(n); } for (const x of M.anon) if (x.f === short && x.l <= b && x.e >= a) hit.add(x.key); }
  const names = [...hit].filter(k => M.sym[k]);
  console.log(`Mexido desde ${base}: ${names.length} nomes` + (other.size ? ` · outros arquivos: ${[...other].join(", ")}` : ""));
  names.forEach(n => console.log("  " + at(n) + `  · usado por ${M.sym[n].by.length}`));
  [...hit].filter(k => !M.sym[k]).forEach(k => console.log("  instrução do topo em " + k.slice(1) + " (roda na carga: confira t150/t151)"));
  if ([...other].some(x => /app\.css|\.html$/.test(x))) console.log("  CSS/HTML mexido: confira nos 6 aparelhos (t151, --monkey) e os testes da tela mexida");
  if ([...other].some(x => /backup-drive|bridge/.test(x))) console.log("  backup/site mexido: t87 e os testes do site (fakefb)");
  if (names.length) printTests(names); process.exit(0); }

/* consulta livre */
if (!args.length) { console.log(fs.readFileSync(__filename, "utf8").split("\n").slice(1, 11).map(l => l.replace(/^\/\/ ?/, "")).join("\n")); process.exit(0); }
const norm = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
for (const q0 of args) { let q = q0, done = false; console.log(args.length > 1 ? `\n===== ${q0} =====` : "");
  const idCard = k => { const e = M.ids[k]; console.log(`#${k}` + (e.def ? "\n  criado em: " + e.def.map(at).join("; ") : "") + (e.html ? "\n  no HTML fixo: " + e.html.join("; ") : "") + (e.use ? "\n  procurado em: " + some(e.use.map(at), 20) : "") + (e.css ? "\n  CSS: src/app/css/app.css L" + e.css.join(", L") : "") + (e.extra ? "\n  fora do app: " + e.extra.join(", ") : "") + (e.tests ? "\n  testes: " + some(e.tests, 30) : "")); };
  const clsCard = k => { const e = M.cls[k]; console.log(`.${k}` + (e.css ? "\n  CSS: src/app/css/app.css L" + some(e.css.map(String), 40).replace(/, /g, ", L") : "\n  sem regra no CSS") + (e.js ? "\n  no JS: " + some(e.js.map(at), 20) : "") + (e.html ? "\n  no HTML fixo: " + e.html.join("; ") : "")); };
  if (M.sym[q]) { console.log(card(q)); done = true; }
  if (q.startsWith("#")) { const k = q.slice(1); const hits = M.ids[k] ? [k] : Object.keys(M.ids).filter(i => i.endsWith("*") && k.startsWith(i.slice(0, -1))); hits.forEach(idCard); done = done || hits.length > 0; if (!hits.length) q = k; }
  else if (M.ids[q] && !done) { idCard(q); done = true; }
  if (q.startsWith(".") && M.cls[q.slice(1)]) { clsCard(q.slice(1)); done = true; } else if (q.startsWith(".")) q = q.slice(1);
  if (M.ls[q]) { console.log(`localStorage ${q}\n  ` + (M.ls[q].js || []).map(at).join("\n  ") + (M.ls[q].extra ? "\n  fora do app: " + M.ls[q].extra.join(", ") : "")); done = true; }
  const pk = q.replace(/^(ui\.)?prefs\./, ""); if (M.prefs[pk] && (pk !== q || !done)) { console.log(`ui.prefs.${pk}\n  grava: ${(M.prefs[pk].w || []).map(at).join("; ") || "—"}\n  lê: ${some((M.prefs[pk].r || []).map(at), 30) || "—"}`); done = true; }
  const fk = Object.keys(M.fs).filter(k => k === q || k.split(":")[1] === q); fk.forEach(k => { console.log(`conta ${k}\n  ` + M.fs[k].js.map(at).join("\n  ")); done = true; });
  if (M.tests[q]) { const t = M.tests[q]; console.log(`${q} (${t.kind}) ${t.f}\n  ${t.desc}\n  toca: ${some(t.syms.filter(s => !M.common.includes(s)), 60)}` + (t.ids.length ? "\n  ids: #" + some(t.ids, 40) : "")); done = true; }
  if (M.css.vars[q]) { const v = M.css.vars[q]; console.log(`${q}  definida em app.css L${L.uniq(v.def).join(", L") || "—"} · usada ${v.n}×`); done = true; }
  if (done) continue;
  const n = norm(q), S = Object.keys(M.sym).filter(k => norm(k).includes(n)), D = Object.keys(M.sym).filter(k => !S.includes(k) && norm(M.sym[k].doc).includes(n)), I = Object.keys(M.ids).filter(k => norm(k).includes(n)), C = Object.keys(M.cls).filter(k => norm(k).includes(n)), T = Object.keys(M.tests).filter(k => norm(M.tests[k].desc).includes(n)), F = M.files.filter(f => norm(f.short + " " + f.head).includes(n));
  if (S.length === 1) { console.log(card(S[0])); continue; }
  if (S.length) console.log(`Nomes (${S.length}):\n` + S.slice(0, 40).map(k => "  " + at(k) + (M.sym[k].doc ? "  — " + L.cut(M.sym[k].doc, 70) : "")).join("\n") + (S.length > 40 ? `\n  … +${S.length - 40}` : ""));
  if (D.length) console.log(`No comentário (${D.length}):\n` + D.slice(0, 15).map(k => "  " + at(k) + "  — " + L.cut(M.sym[k].doc, 90)).join("\n"));
  if (F.length) console.log("Arquivos: " + F.map(f => f.short).join(", "));
  if (I.length) console.log(`Ids (${I.length}): ` + some(I.map(i => "#" + i), 30));
  if (C.length) console.log(`Classes (${C.length}): ` + some(C.map(i => "." + i), 30));
  if (T.length) console.log(`Testes que falam disso (${T.length}): ` + some(T, 30));
  if (!S.length && !D.length && !I.length && !C.length && !T.length && !F.length) console.log(`Nada no mapa com "${q0}". É texto dentro de uma função? Use: grep -rn "${q0}" src/app/`);
}
