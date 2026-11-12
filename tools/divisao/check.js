// node check.js <pasta de referência> <pasta candidata>
// Compara a ordem candidata com a de referência (que funciona):
//  1. nenhum aviso novo de "usado antes de declarar" na carga (avisos que já existiam na referência são caminhos que não rodam na carga);
//  2. quem muda um objeto global no topo continua antes/depois de quem o lê no topo, como na referência;
//  3. instruções do topo que não são declarações (efeitos: render(), addEventListener…) mantêm a ordem entre si.
const { analyze } = require("./topo.js");
const [refDir, candDir] = process.argv.slice(2);
const R = analyze(refDir), C = analyze(candDir);
const key = (A, i) => { const n = A.body[i]; return A.code.slice(n.range[0], n.range[1]); };
function antes(A) { const s = new Set(); for (const [st, rs] of A.eager) for (const r of rs) { const g = A.gv.get(r.name); if (!g || g.kind === "function" || g.stmt <= st) continue; s.add(key(A, st).slice(0, 200) + "→" + r.name); } return s; }
const ra = antes(R), ca = antes(C); let bad = 0;
for (const k of ca) if (!ra.has(k)) { bad++; console.log("NOVO uso antes de declarar:", k.slice(0, 160)); }
// posição de cada instrução por texto
const pos = A => { const m = new Map(); A.body.forEach((n, i) => m.set(key(A, i), i)); return m; };
const rp = pos(R), cp = pos(C);
if (rp.size !== cp.size) { bad++; console.log("número de instruções diferente", rp.size, cp.size); }
function touches(A) { const mut = new Map(), rd = new Map(); for (const [st, rs] of A.eager) for (const r of rs) { const m = r.mut ? mut : rd; if (!m.has(r.name)) m.set(r.name, new Set()); m.get(r.name).add(key(A, st)); } return { mut, rd }; }
const T = touches(R);
for (const [nm, W] of T.mut) { const all = new Set([...W, ...(T.rd.get(nm) || [])]); for (const w of W) for (const o of all) { if (o === w) continue;
  if ((rp.get(w) < rp.get(o)) !== (cp.get(w) < cp.get(o))) { bad++; console.log(`ORDEM de ${nm}: "${w.slice(0, 60)}" × "${o.slice(0, 60)}"`); } } }
// efeitos no mesmo "canal" (mesmo evento no mesmo alvo, mesmo .onX do mesmo elemento) mantêm a ordem entre si
const chans = k => { const out = []; let m; const re1 = /([\w$.#"'()\[\]-]*?)\.?addEventListener\("(\w+)"/g; while ((m = re1.exec(k))) out.push("ev:" + (m[1] || "window") + ":" + m[2]);
  const re2 = /(\$\("[^"]+"\)|document\.\w+)\.(on\w+)\s*=/g; while ((m = re2.exec(k))) out.push("on:" + m[1] + m[2]); return out; };
const eff = A => A.body.map((n, i) => [n, i]).filter(([n]) => !/Declaration$/.test(n.type)).map(([n, i]) => key(A, i));
const re = eff(R); let nch = 0;
const byCh = new Map(); for (const k of re) for (const c of chans(k)) { if (!byCh.has(c)) byCh.set(c, []); byCh.get(c).push(k); }
for (const [c, L] of byCh) { if (L.length < 2) continue; nch++; for (let i = 1; i < L.length; i++) if (cp.get(L[i - 1]) > cp.get(L[i])) { bad++; console.log(`EFEITO fora de ordem no canal ${c}:`, L[i].replace(/\s+/g, " ").slice(0, 80)); } }
console.log(bad ? `${bad} problema(s)` : `ok: ordem segura (${ca.size} aviso(s) já existentes; ${nch} canal(is) com mais de um efeito, na mesma ordem)`);
process.exit(bad ? 1 : 0);
