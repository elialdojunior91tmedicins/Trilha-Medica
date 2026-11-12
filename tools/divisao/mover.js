// node mover.js <plano.txt> <pasta js>
// plano: linhas "> destino.js" seguidas de "origem.js:de-até" (linhas da ORIGEM atual; "origem.js" sozinho = arquivo inteiro).
// Arquivos de origem que não aparecem no plano ficam como estão. Confere: cada linha usada uma vez só, cada corte cai entre
// instruções do topo, o conjunto de linhas é o mesmo; depois grava os destinos e apaga as origens esvaziadas.
const fs = require("fs"), path = require("path"), acorn = require("acorn");
const [planF, dir] = process.argv.slice(2);
const src = {}; for (const f of require("./lsjs.js")(dir)) src[f] = fs.readFileSync(path.join(dir, f), "utf8");
// fronteiras válidas: início de linha que não está dentro de uma instrução do topo
const bounds = {};
for (const f in src) {
  const t = src[f], ast = acorn.parse(t, { ecmaVersion: 2023 }), lines = t.split("\n"), ok = new Set();
  let off = 0; const starts = lines.map(l => { const s = off; off += l.length + 1; return s; });
  starts.forEach((s, i) => { if (!ast.body.some(n => s > n.start && s < n.end)) ok.add(i + 1); });
  ok.add(lines.length + 1); bounds[f] = { ok, lines };
}
const plan = []; let cur = null;
for (const raw of fs.readFileSync(planF, "utf8").split("\n")) {
  const l = raw.replace(/#.*$/, "").trim(); if (!l) continue;
  if (l.startsWith(">")) { cur = { to: l.slice(1).trim(), parts: [] }; plan.push(cur); continue; }
  const m = l.match(/^([\w.\/-]+)(?::(\d+)-(\d+|fim))?$/); if (!m || !cur) throw new Error("linha estranha no plano: " + l);
  const f = m[1]; if (!src[f]) throw new Error("não existe: " + f);
  const n = bounds[f].lines.length, a = m[2] ? +m[2] : 1, b = m[3] ? (m[3] === "fim" ? n : +m[3]) : n;
  if (!bounds[f].ok.has(a) || !bounds[f].ok.has(b + 1)) throw new Error(`corte no meio de uma instrução: ${l}`);
  cur.parts.push({ f, a, b });
}
const used = {};
for (const d of plan) for (const p of d.parts) for (let i = p.a; i <= p.b; i++) { const k = p.f + ":" + i; if (used[k]) throw new Error("linha usada duas vezes: " + k); used[k] = 1; }
const touched = new Set(plan.flatMap(d => d.parts.map(p => p.f)));
for (const f of touched) { const n = bounds[f].lines.length - 1; for (let i = 1; i <= n; i++) if (!used[f + ":" + i]) throw new Error("linha sem destino: " + f + ":" + i); }
// arquivos terminam em "\n": a última "linha" vazia depois do \n final não é copiada; cada parte vira linhas + \n
const body = p => { const L = bounds[p.f].lines.slice(p.a - 1, p.b); return L.join("\n") + "\n"; };
for (const f of touched) { const L = bounds[f].lines; if (L[L.length - 1] !== "") throw new Error("sem \\n no fim: " + f); }
const out = {};
for (const d of plan) out[d.to] = (out[d.to] || "") + d.parts.map(p => { const L = bounds[p.f].lines; const b = Math.min(p.b, L.length - 1); return L.slice(p.a - 1, b).join("\n") + (b >= p.a ? "\n" : ""); }).join("");
for (const f of touched) if (!(f in out)) { fs.unlinkSync(path.join(dir, f)); try { fs.rmdirSync(path.dirname(path.join(dir, f))); } catch (e) {} }
for (const f in out) { if (src[f] && !touched.has(f)) throw new Error("destino já existe e não está no plano: " + f); fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true }); fs.writeFileSync(path.join(dir, f), out[f]); acorn.parse(out[f], { ecmaVersion: 2023 }); }
const sortedLines = o => Object.values(o).join("").split("\n").filter(Boolean).sort().join("\n");
const before = {}, after = {}; for (const f of touched) before[f] = src[f]; for (const f in out) after[f] = out[f];
if (sortedLines(before) !== sortedLines(after)) throw new Error("o conjunto de linhas mudou");
console.log("ok:", Object.keys(out).length, "arquivo(s) gravado(s);", [...touched].filter(f => !(f in out)).length, "apagado(s)");
