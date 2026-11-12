// Análise do topo para a fase 2 da divisão (ADR 001).
// Uso: node topo.js <pasta js> [--deps]   -> confere a ordem atual dos arquivos da pasta (ordem de nome)
// Uma ordem é segura quando nenhuma instrução executada na carga (topo, IIFE, callback síncrono e as funções que eles chamam,
// de forma transitiva) usa um const/let/class/var declarado numa instrução que vem DEPOIS, e quando a ordem relativa entre
// quem muda um objeto global no topo e quem o lê no topo é mantida (comparada com uma ordem de referência, --ref <pasta>).
const fs = require("fs"), path = require("path");
const acorn = require("acorn"), escope = require("eslint-scope");

const DEFER = new Set(["addEventListener", "setTimeout", "setInterval", "requestAnimationFrame", "requestIdleCallback", "then", "catch", "finally",
  "onSnapshot", "observe", "queueMicrotask", "removeEventListener", "use"]);
const MUT = new Set(["push", "unshift", "splice", "pop", "shift", "sort", "reverse", "set", "add", "delete", "clear", "fill"]);

function load(dir) {
  const files = require("./lsjs.js")(dir);
  let code = "", spans = [];
  for (const f of files) { const t = fs.readFileSync(path.join(dir, f), "utf8"); spans.push({ f, a: code.length, b: code.length + t.length, t }); code += t; }
  return { files, code, spans };
}

function analyze(dir) {
  const { code, spans } = load(dir);
  const ast = acorn.parse(code, { ecmaVersion: 2023, sourceType: "script", ranges: true, locations: true });
  const sm = escope.analyze(ast, { ecmaVersion: 2022, sourceType: "script" });
  const G = sm.globalScope, body = ast.body;
  const where = pos => { const s = spans.find(s => pos >= s.a && pos < s.b); const line = s.t.slice(0, pos - s.a).split("\n").length; return s.f + ":" + line; };
  const stmtOf = pos => { let lo = 0, hi = body.length - 1; while (lo <= hi) { const m = (lo + hi) >> 1; if (body[m].range[1] <= pos) lo = m + 1; else if (body[m].range[0] > pos) hi = m - 1; else return m; } return -1; };
  // pais
  const parent = new Map();
  (function walk(n, p) { if (!n || typeof n.type !== "string") return; parent.set(n, p); for (const k in n) { if (k === "range" || k === "loc") continue; const v = n[k]; if (Array.isArray(v)) v.forEach(c => c && typeof c.type === "string" && walk(c, n)); else if (v && typeof v.type === "string") walk(v, n); } })(ast, null);
  const isFn = n => n && /Function|Arrow/.test(n.type);
  // função adiada? (não roda quando o código em volta roda)
  function deferred(fn) {
    const p = parent.get(fn);
    if (!p) return true;
    if (p.type === "CallExpression" && p.callee === fn) return false; // IIFE
    if ((p.type === "CallExpression" || p.type === "NewExpression") && p.arguments.includes(fn)) {
      const c = p.callee, nm = c.type === "MemberExpression" ? (c.property.name || c.property.value) : c.name;
      if (p.type === "NewExpression" && /Observer$/.test(nm || "")) return true;
      if (DEFER.has(nm)) return true;
      return false; // forEach, map, Promise executor... rodam já
    }
    return true; // declarada, atribuída, propriedade, retorno: só roda se chamada
  }
  // globais
  const gv = new Map(); // nome -> {kind, stmt, fnNode}
  for (const v of G.variables) {
    const d = v.defs[0]; if (!d) continue;
    let kind = d.type === "FunctionName" ? "function" : d.type === "ClassName" ? "class" : d.type === "Variable" ? d.parent.kind : d.type;
    let fnNode = d.type === "FunctionName" ? d.node : (d.type === "Variable" && d.node.init && isFn(d.node.init) ? d.node.init : null);
    gv.set(v.name, { kind, stmt: stmtOf(d.name.range[0]), fnNode, defs: v.defs.length, v });
  }
  // referências a globais, por função dona (null = topo)
  const ownerFn = sc => { while (sc && sc.type !== "global") { if (sc.type === "function") return sc.block; sc = sc.upper; } return null; };
  // cadeia de funções do ponto da referência até a instrução do topo: eager se todas não são adiadas
  const refsByFn = new Map(), topRefs = new Map(); // fn -> [{name, eager, mut, pos}]
  function mutOf(id) { const p = parent.get(id); if (!p || p.type !== "MemberExpression" || p.object !== id) return false; const pp = parent.get(p);
    if (pp && pp.type === "AssignmentExpression" && pp.left === p) return true; if (pp && pp.type === "UpdateExpression") return true;
    if (pp && pp.type === "CallExpression" && pp.callee === p && MUT.has(p.property.name)) return true;
    if (pp && pp.type === "MemberExpression" && pp.object === p) { const q = parent.get(pp); if (q && q.type === "AssignmentExpression" && q.left === pp) return true; }
    return false; }
  for (const sc of sm.scopes) for (const r of sc.references) {
    const name = r.identifier.name; const g = gv.get(name); if (!g || (r.resolved && r.resolved.scope !== G)) continue; // no modo script, function/var do topo ficam sem "resolved"
    // sobe pelas funções: a primeira adiada corta; a dona registrada é a função adiada mais interna que ainda roda junto com a dona
    let s = sc, fnChain = [];
    while (s && s.type !== "global") { if (s.type === "function" && s.block.type !== "Program") fnChain.push(s.block); s = s.upper; }
    // anda de dentro para fora: enquanto as funções forem "rodam já", a referência roda junto da de fora
    let owner = null, ok = true;
    for (const fn of fnChain) { if (deferred(fn)) { owner = fn; break; } }
    const rec = { name, pos: r.identifier.range[0], write: r.isWrite(), mut: (r.isWrite() && !r.init) || mutOf(r.identifier) };
    if (owner === null) { const st = stmtOf(rec.pos); if (!topRefs.has(st)) topRefs.set(st, []); topRefs.get(st).push(rec); }
    else { if (!refsByFn.has(owner)) refsByFn.set(owner, []); refsByFn.get(owner).push(rec); }
  }
  // fecho: o que cada instrução do topo usa na carga, chamando funções
  // por instrução: busca em largura pelas funções chamadas; cada nome entra uma vez, com o caminho mais curto
  const eager = new Map(); // stmt -> refs
  for (const [st, rs] of topRefs) {
    const out = [], seenName = new Map(), seenFn = new Set(), Q = [];
    const add = (r, via) => { const key = r.name + (r.mut ? "!" : ""); if (seenName.has(key)) return; seenName.set(key, 1); out.push({ ...r, via });
      const g = gv.get(r.name); if (g && g.fnNode && !r.write && !seenFn.has(g.fnNode)) { seenFn.add(g.fnNode); Q.push([g.fnNode, [...via, r.name]]); } };
    for (const r of rs) add(r, []);
    while (Q.length) { const [fn, via] = Q.shift(); for (const r of refsByFn.get(fn) || []) add(r, via); }
    eager.set(st, out);
  }
  return { ast, body, gv, eager, where, stmtOf, spans, code };
}

function report(A, refOrder) {
  const { body, gv, eager, where } = A; let bad = 0;
  // 1. TDZ / var antes do valor
  for (const [st, rs] of eager) for (const r of rs) {
    const g = gv.get(r.name); if (!g || g.kind === "function") continue;
    if (g.stmt > st || (g.stmt === st && r.via.length && g.kind !== "var")) {
      if (g.stmt === st) continue;
      bad++; console.log(`ANTES ${where(body[st].range[0])} usa ${r.name}${r.via.length ? " (via " + r.via.join(" > ") + ")" : ""} declarado em ${where(body[g.stmt].range[0])}`);
    }
  }
  // 2. nomes declarados duas vezes
  for (const [n, g] of gv) if (g.defs > 1) { bad++; console.log(`DUPLICADO ${n} (${g.defs}x)`); }
  return bad;
}

module.exports = { analyze, report };
if (require.main === module) {
  const dir = process.argv[2]; const A = analyze(dir); const b = report(A);
  console.log(b ? `${b} problema(s)` : "ok: nenhum uso antes da declaração na carga");
}
