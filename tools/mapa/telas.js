// Mapa por tela: aba › cartões (títulos) › botões (texto e id) › a função que desenha cada um. Liga o que o usuário fala ("o botão
// Resolver estas do Banco") ao código. Usado por gerar.js (mapa/telas.md) e pelo onde.js (procura pelo texto do botão).
const path = require("path");
const L = require("./lib.js");
const dep = n => require(path.join(L.ROOT, "tools/divisao/node_modules", n));

const VIEW_NAME = { inicio: "Início", temas: "Residência", fac: "Faculdade", quest: "Questões (Banco de questões)", notas: "Caderno", stats: "Estatísticas",
  foco: "Foco", erros: "Erros", perfil: "Perfil", config: "Configurações", help: "Ajuda", instr: "Instruções do gerador", mais: "Menu (celular)" };
// tira os ${…} (com chaves e textos dentro) e põe no lugar os textos fixos de dentro ("esta questão/estas … questões") ou "…"
function untpl(s) { let out = "", i = 0; s = String(s);
  while (i < s.length) { if (s[i] === "$" && s[i + 1] === "{") { let d = 1, j = i + 2; while (j < s.length && d) { if (s[j] === "{") d++; else if (s[j] === "}") d--; j++; }
      const inner = s.slice(i + 2, j - 1), lits = []; for (const re = /"([^"]{1,40})"|'([^']{1,40})'|`([^`]{1,60})`/g; ;) { const m = re.exec(inner); if (!m) break; const t = untpl(m[1] || m[2] || m[3]).trim(); if (t && /[A-Za-zÀ-ú]/.test(t)) lits.push(t); }
      out += lits.length ? lits.slice(0, 3).join("/") : "…"; i = j; } else out += s[i++]; }
  return out; }
const clean = s => L.one(untpl(s).replace(/&nbsp;/g, " ").replace(/&[a-z]+;/g, ""));

/* texto dos botões e títulos de cartão escritos no código de uma função */
function uiText(src) {
  const btn = [], tit = [], v2l = {};
  for (const re = /<button([^>]*)>([^<]{1,70})</g; ;) { const m = re.exec(src); if (!m) break; const t = clean(m[2]); if (!t || t === "…" || /^[×✕✓+−⋯▾›‹←→?…\s]+$/.test(t)) continue;
    const idm = m[1].match(/\bid=\\?["']([\w-]*)(\$\{)?/); btn.push({ t, id: idm ? idm[1] + (idm[2] ? "*" : "") : "" }); }
  // const b = el(`<button …>Texto</button>`); … b.id = "x"
  // a atribuição mais próxima ANTES do ".id =" (a mesma variável é reaproveitada em vários botões)
  const asg = []; for (const re = /(\w+)\s*=\s*el\(`<button([^>]*)>([^<]{0,70})</g; ;) { const m = re.exec(src); if (!m) break; asg.push({ v: m[1], at: m.index, t: clean(m[3]), hasId: /\bid=/.test(m[2]), raw: m[2] }); }
  for (const re = /\b(\w+)\.id\s*=\s*(["'`])([\w-]*)(\$\{|\2\s*\+)?/g; ;) { const m = re.exec(src); if (!m) break;
    let a = null; for (const x of asg) if (x.v === m[1] && x.at < m.index) a = x; if (!a || a.hasId || !a.t || a.t === "…") continue;
    const id = m[3] + (m[4] ? "*" : ""); const b = btn.find(x => x.t === a.t && !x.id); if (b) b.id = id; else btn.push({ t: a.t, id }); }
  // botão com id e sem texto no HTML: o texto vem depois, em "v.textContent = …" (até a próxima atribuição da mesma variável)
  for (const [ai, a] of asg.entries()) { if (!a.hasId || (a.t && a.t !== "…")) continue; const nx = asg.slice(ai + 1).find(x => x.v === a.v), rest = src.slice(a.at, nx ? nx.at : undefined);
    const m = new RegExp("\\b" + a.v + "\\.textContent\\s*=\\s*`((?:[^`$]|\\$\\{(?:[^{}]|\\{[^{}]*\\})*\\})*)`|\\b" + a.v + "\\.textContent\\s*=\\s*([\"'])([^\"']*)\\2").exec(rest); if (!m) continue;
    const idm = a.raw.match(/\bid=\\?["']([\w-]*)(\$\{)?/); const t = clean(m[1] != null ? m[1] : m[3]); if (t && t !== "…") btn.push({ t, id: idm ? idm[1] + (idm[2] ? "*" : "") : "" }); }
  for (const re = /<h[23][^>]*>([^<]{2,80})</g; ;) { const m = re.exec(src); if (!m) break; const t = clean(m[1]); if (t && t !== "…" && !tit.includes(t)) tit.push(t); }
  const seen = new Set(); return { btn: btn.filter(b => { const k = b.t + "|" + b.id; return !seen.has(k) && seen.add(k); }), tit };
}

function build(M) {
  const acorn = dep("acorn"), I = L.inputs();
  const code = I.js.map(L.rd).join("");
  /* 1. o texto de cada função do topo */
  for (const n in M.sym) { const r = M.sym[n]; if (r.k !== "fn") continue; const t = L.rd("src/app/js/" + r.f).split("\n").slice(r.l - 1, r.e).join("\n"); const U = uiText(t); if (U.btn.length) r.btn = U.btn; if (U.tit.length) r.tit = U.tit; }
  /* 2. que funções cada aba chama: o renderAll escolhe pela variável view */
  const ast = acorn.parse(code, { ecmaVersion: 2023, sourceType: "script" });
  let ra = null; for (const n of ast.body) if (n.type === "FunctionDeclaration" && n.id.name === "renderAll") ra = n;
  const roots = {}, add = (v, n) => { (roots[v] = roots[v] || new Set()).add(n); };
  const calls = node => { const out = []; (function w(n) { if (!n || typeof n.type !== "string") return; if (n.type === "CallExpression" && n.callee.type === "Identifier" && M.sym[n.callee.name]) out.push(n.callee.name);
      if (/Function/.test(n.type)) return; for (const k in n) { const v = n[k]; if (Array.isArray(v)) v.forEach(w); else if (v && typeof v.type === "string") w(v); } })(node); return out; };
  const viewOf = t => t && t.type === "BinaryExpression" && t.left.name === "view" && t.right.type === "Literal" ? { op: t.operator, v: t.right.value } : null;
  let after = null; // depois de "if (view !== 'temas') return;", o resto é da aba temas
  for (const st of ra ? ra.body.body : []) {
    if (st.type === "IfStatement") { let s = st; while (s && s.type === "IfStatement") { const V = viewOf(s.test);
        if (V && V.op === "===") calls(s.consequent).forEach(c => add(V.v, c));
        else if (V && V.op === "!==" && s.consequent.type === "ReturnStatement") { after = V.v; }
        else if (V && V.op === "!==") { /* limpeza das outras abas */ }
        else if (after) calls(s).forEach(c => add(after, c));
        s = s.alternate; } continue; }
    if (after) calls(st).forEach(c => add(after, c));
  }
  /* 3. a partir das raízes de cada aba, as funções que desenham (com botão, título ou id), até 5 níveis; sem as peças comuns */
  const HUB = new Set(Object.keys(M.sym).filter(n => M.sym[n].by.length > 25));
  const draws = n => { const r = M.sym[n]; return r && r.k === "fn" && (r.btn || r.tit || r.idDef.length); };
  const views = {};
  if (roots.temas && draws("renderAll")) roots.temas.add("renderAll"); // a lista das áreas e dos temas é desenhada dentro do próprio renderAll
  for (const v in roots) { const seen = new Map(), q = [...roots[v]].map(n => [n, 0]); for (const [n] of q) seen.set(n, 0);
    const other = new Set(Object.keys(roots).filter(w => w !== v).flatMap(w => [...roots[w]]).filter(n => !roots[v].has(n)));
    while (q.length) { const [n, d] = q.shift(); if (d >= 5) continue; for (const u of (M.sym[n] || { uses: [] }).uses) { const r = M.sym[u]; if (!r || r.k !== "fn" || seen.has(u) || other.has(u) || (HUB.has(u) && !roots[v].has(u))) continue; seen.set(u, d + 1); q.push([u, d + 1]); } }
    views[v] = { name: VIEW_NAME[v] || v, roots: [...roots[v]].filter(n => !HUB.has(n)), fns: [...seen.keys()].filter(draws).sort((a, b) => M.sym[a].f.localeCompare(M.sym[b].f) || M.sym[a].l - M.sym[b].l) }; }
  // função que desenha e não aparece em nenhuma aba (ex.: só abre por toque, painéis soltos): "Em várias telas / fora das abas"
  const inView = new Set(Object.values(views).flatMap(x => x.fns));
  const loose = Object.keys(M.sym).filter(n => draws(n) && !inView.has(n)).sort((a, b) => M.sym[a].f.localeCompare(M.sym[b].f) || M.sym[a].l - M.sym[b].l);
  // em quais abas cada função aparece
  for (const v in views) for (const n of views[v].fns) (M.sym[n].views = M.sym[n].views || []).push(v);
  // texto do botão → onde
  const labels = {}; for (const n in M.sym) for (const b of M.sym[n].btn || []) (labels[b.t] = labels[b.t] || []).push({ fn: n, id: b.id });
  return { views, loose, labels };
}
module.exports = { build, VIEW_NAME, uiText };
