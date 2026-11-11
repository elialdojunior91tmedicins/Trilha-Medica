// node outline.js <pasta> <arquivo> [de] [até] : uma linha por instrução do topo (linha, tamanho, nomes) e os comentários soltos
const fs = require("fs"), path = require("path"), acorn = require("acorn");
const [dir, file, a = 1, b = 1e9] = process.argv.slice(2);
const t = fs.readFileSync(path.join(dir, file), "utf8");
const lineAt = p => t.slice(0, p).split("\n").length;
const items = [];
const ast = acorn.parse(t, { ecmaVersion: 2023, ranges: true, onComment: (blk, txt, s, e) => items.push({ s, c: txt.replace(/\s+/g, " ").slice(0, 110) }) });
const names = n => {
  if (n.type === "FunctionDeclaration") return "fn " + n.id.name;
  if (n.type === "VariableDeclaration") return n.kind + " " + n.declarations.map(d => d.id.name || "{…}").join(",").slice(0, 100);
  if (n.type === "ClassDeclaration") return "class " + n.id.name;
  return n.type.replace("Statement", "") + " " + t.slice(n.start, n.end).replace(/\s+/g, " ").slice(0, 70);
};
for (const n of ast.body) items.push({ s: n.start, n });
items.sort((x, y) => x.s - y.s);
let inside = null;
for (const it of items) {
  const L = lineAt(it.s); if (L < a || L > b) continue;
  if (it.c != null) { const top = !ast.body.some(n => it.s > n.start && it.s < n.end); if (top) console.log(`${L}\t#\t${it.c}`); continue; }
  console.log(`${L}\t${((it.n.end - it.n.start) / 1024).toFixed(1)}K\t${names(it.n)}`);
}
