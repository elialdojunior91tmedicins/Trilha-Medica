// Junta tests/cobertura/saida/*.json (um por teste, gravados pelo gancho.js) e escreve tests/cobertura/saida/RELATORIO.md:
// quanto das funções do topo do app rodou em pelo menos um teste de navegador e, dentro delas, quanto de cada trecho (if, else, laço)
// rodou; por módulo, e as funções com mais código que nunca rodou.
// "Rodou" = foi chamada; não quer dizer que o resultado foi conferido. Funções citadas nos testes do Node (tests/unit/) aparecem
// marcadas à parte: esses testes rodam fora do navegador e não entram na medição.
const fs = require("fs"), path = require("path");
const acorn = require("../unit/vendor/acorn.js");
const ROOT = path.join(__dirname, "../.."), OUT = path.join(__dirname, "saida"), JS = path.join(ROOT, "src/app/js");

const arquivos = d => fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : 1)
  .flatMap(e => e.isDirectory() ? arquivos(path.join(d, e.name)) : e.name.endsWith(".js") ? [path.join(d, e.name)] : []);
const F = {}; // nome -> {f, tam, src}
for (const f of arquivos(JS)) {
  const txt = fs.readFileSync(f, "utf8"), ast = acorn.parse(txt, { ecmaVersion: 2022, sourceType: "script" }), rel = path.relative(JS, f);
  for (const s of ast.body) {
    if (s.type === "FunctionDeclaration") F[s.id.name] = { f: rel, tam: s.end - s.start, src: txt.slice(s.start, s.end) };
    else if (s.type === "VariableDeclaration") for (const d of s.declarations)
      if (d.id.type === "Identifier" && d.init && /^(ArrowFunctionExpression|FunctionExpression)$/.test(d.init.type)) F[d.id.name] = { f: rel, tam: d.init.end - d.init.start, src: txt.slice(d.init.start, d.init.end) };
  }
}
const saidas = fs.existsSync(OUT) ? fs.readdirSync(OUT).filter(f => f.endsWith(".json")) : [];
if (!saidas.length) { console.error("Nada medido ainda: rode tests/run.sh --cobertura"); process.exit(1); }
const rodou = new Map(), bridge = new Set(), bridgeAll = new Set(), falta = {}; // nome -> testes; falta: nome -> trechos que não rodaram em teste nenhum
const inter = (A, B) => { const r = []; let i = 0, j = 0; while (i < A.length && j < B.length) { const a = Math.max(A[i][0], B[j][0]), b = Math.min(A[i][1], B[j][1]); if (a < b) r.push([a, b]); A[i][1] < B[j][1] ? i++ : j++; } return r; };
for (const s of saidas) { const o = JSON.parse(fs.readFileSync(path.join(OUT, s), "utf8"));
  o.app.forEach(n => { if (!rodou.has(n)) rodou.set(n, []); rodou.get(n).push(o.teste); }); o.bridge.forEach(n => bridge.add(n)); (o.bridgeAll || []).forEach(n => bridgeAll.add(n));
  for (const [n, x] of Object.entries(o.falta || {})) { if (!F[n] || x.len !== F[n].tam) continue; falta[n] = falta[n] ? inter(falta[n], x.iv) : x.iv; } }
const letras = t => t.replace(/\s/g, "").length;
for (const n of Object.keys(F)) { F[n].le = letras(F[n].src); const iv = falta[n] || [[0, F[n].tam]]; F[n].nr = iv.reduce((a, [x, y]) => a + letras(F[n].src.slice(x, y)), 0);
  F[n].maior = iv.length ? iv.reduce((m, v) => v[1] - v[0] > m[1] - m[0] ? v : m) : null; }
const unitTxt = fs.readdirSync(path.join(ROOT, "tests/unit")).filter(f => f.endsWith(".test.js")).map(f => fs.readFileSync(path.join(ROOT, "tests/unit", f), "utf8")).join("\n");
const noNode = n => new RegExp("\\b" + n.replace(/\$/g, "\\$") + "\\b").test(unitTxt);

const nomes = Object.keys(F), sim = nomes.filter(n => rodou.has(n)), nao = nomes.filter(n => !rodou.has(n));
const pct = (a, b) => b ? Math.round(100 * a / b) + "%" : "–";
const leTot = nomes.reduce((a, n) => a + F[n].le, 0), leNao = nomes.reduce((a, n) => a + F[n].nr, 0);
const mod = {}; for (const n of nomes) { const m = F[n].f.split("/")[0].replace(/\.js$/, ""); const x = mod[m] || (mod[m] = { n: 0, s: 0, t: 0, nr: 0 }); x.n++; x.t += F[n].le; x.nr += F[n].nr; if (rodou.has(n)) x.s++; }
const L = [];
L.push("# Cobertura real dos testes", "", `Gerado em ${new Date().toISOString().slice(0, 16).replace("T", " ")} com ${saidas.length} testes de navegador (tests/run.sh --cobertura).`, "",
  `- Funções do topo do app que rodaram em algum teste: **${sim.length} de ${nomes.length} (${pct(sim.length, nomes.length)})**.`,
  `- Trechos (cada if, else, ternário, laço): **${pct(leTot - leNao, leTot)} das letras do código rodaram**; ${leNao.toLocaleString("pt-BR")} letras nunca rodaram em teste nenhum.`,
  `- Das que nunca rodaram, ${nao.filter(noNode).length} aparecem nos testes do Node (tests/unit/), que não entram nesta medição.`,
  `- bridge.js (site): ${bridge.size} de ${bridgeAll.size} funções com nome rodaram${bridgeAll.size > bridge.size ? " (nunca: " + [...bridgeAll].filter(n => !bridge.has(n)).sort().join(", ") + ")" : ""}.`, "",
  "\"Rodou\" quer dizer que a função foi chamada; não garante que o resultado foi conferido. O que roda logo antes de uma recarga feita pelo",
  "próprio app (ex.: Importar backup no site, que recarrega a página) se perde e aparece como \"nunca rodou\": os números são um piso.", "",
  "## Por módulo (do menos coberto para o mais, pelos trechos)", "", "| Módulo | Funções que rodaram | Trechos que rodaram | Letras que nunca rodaram |", "| --- | --- | --- | --- |");
Object.entries(mod).sort((a, b) => a[1].nr / a[1].t < b[1].nr / b[1].t ? 1 : -1).forEach(([m, x]) => L.push(`| ${m} | ${x.s} de ${x.n} (${pct(x.s, x.n)}) | ${pct(x.t - x.nr, x.t)} | ${x.nr.toLocaleString("pt-BR")} |`));
L.push("", "## As 40 funções com mais código que nunca rodou", "", "| Função | Módulo | Nunca rodou | Maior trecho sem teste (começo) |", "| --- | --- | --- | --- |");
const cell = t => t.replace(/\s+/g, " ").replace(/\|/g, "\\|").replace(/`/g, "'").slice(0, 90);
nomes.filter(n => F[n].nr).sort((a, b) => F[b].nr - F[a].nr).slice(0, 40).forEach(n => L.push(`| ${n}${rodou.has(n) ? "" : " (nunca chamada)"} | ${F[n].f} | ${F[n].nr} de ${F[n].le} letras (${pct(F[n].nr, F[n].le)}) | \`${cell(F[n].maior ? F[n].src.slice(F[n].maior[0], F[n].maior[1]) : "")}\` |`));
L.push("", "## Funções que nunca foram chamadas", "", "| Função | Módulo | Letras | Nos testes do Node? |", "| --- | --- | --- | --- |");
nao.sort((a, b) => F[b].le - F[a].le).forEach(n => L.push(`| ${n} | ${F[n].f} | ${F[n].le} | ${noNode(n) ? "sim" : ""} |`));
fs.writeFileSync(path.join(OUT, "RELATORIO.md"), L.join("\n") + "\n");
console.log(L.slice(4, 8).join("\n")); console.log("Relatório: tests/cobertura/saida/RELATORIO.md");
