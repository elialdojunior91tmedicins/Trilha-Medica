// Mapa dos dados salvos: para cada lista que vai no backup, onde ela vive (aparelho, conta), quem a limpa ao carregar, se o site a
// importa e se o backup do Drive a leva; e os campos de cada tipo, tirados do código. Usado por gerar.js (mapa/dados.md) e pelo teste.
const path = require("path");
const L = require("./lib.js");
const dep = n => require(path.join(L.ROOT, "tools/divisao/node_modules", n));

/* Conta sem lugar no backup, de propósito. Cada item precisa de um motivo; qualquer outro que apareça é aviso (e o teste falha). */
const FORA = {
  "col:trash": "Lixeira (30 dias). Fica fora do backup: pendente de decisão do usuário (achado em 12/11/2026).",
  "doc:p0": "Nome do pacote, não é lista (aparece no código de packStore).",
  "col:pk": "Coleção interna dos pacotes (packStore).",
};
/* Nome na conta → chave no backup, quando não são iguais */
const ALIAS = { err: "errors", errors: "errors", exprog: "examProg", exfig: "exfigs", settings: "prompt", ui: "ui", prefs: "ui", faculdade: "fac", fac: "fac", progress: "hist plan", prog: "hist plan" };

function objKeys(n, src) { // chaves de um objeto literal (com as dos "...(c ? {a} : {})" marcadas como opcionais) e um nível dentro
  const out = [];
  for (const p of n.properties) {
    if (p.type === "SpreadElement") { const a = p.argument;
      const objs = a.type === "ConditionalExpression" ? [a.consequent, a.alternate] : a.type === "LogicalExpression" ? [a.right] : [a];
      for (const o of objs) if (o && o.type === "ObjectExpression") objKeys(o, src).forEach(k => out.push({ ...k, opt: true }));
      continue; }
    const k = p.key && (p.key.name || p.key.value); if (k == null) continue;
    const v = p.value; let sub = null;
    if (v && v.type === "ObjectExpression") sub = objKeys(v, src).map(x => x.k + (x.opt ? "?" : ""));
    out.push({ k: String(k), sub });
  }
  return out;
}
function walk(n, f, par) { if (!n || typeof n.type !== "string") return; f(n, par); for (const k in n) { if (k === "range" || k === "loc") continue; const v = n[k]; if (Array.isArray(v)) v.forEach(c => walk(c, f, n)); else if (v && typeof v.type === "string") walk(v, f, n); } }

function build(M) {
  const acorn = dep("acorn"), I = L.inputs();
  const files = I.js.map(f => ({ f, t: L.rd(f) })), code = files.map(x => x.t).join("");
  const ast = acorn.parse(code, { ecmaVersion: 2023, sourceType: "script", ranges: true });
  const fnNode = {}; for (const n of ast.body) { if (n.type === "FunctionDeclaration") fnNode[n.id.name] = n; else if (n.type === "VariableDeclaration") n.declarations.forEach(d => { if (d.id.name && d.init && /Function/.test(d.init.type)) fnNode[d.id.name] = d.init; }); }
  const src = n => code.slice(n.start, n.end);
  const bridge = L.has("bridge.js") ? L.rd("bridge.js") : "", gs = L.has("tools/backup-drive.gs") ? L.rd("tools/backup-drive.gs") : "";
  const at = n => M.sym[n] ? `${M.sym[n].f}:${M.sym[n].l}` : "";

  /* 1. o que o backup leva: o objeto data do buildBackup (e o que bankBackup devolve) */
  const lists = [];
  walk(fnNode.buildBackup, n => { if (n.type === "Property" && (n.key.name || n.key.value) === "data" && n.value.type === "ObjectExpression") for (const p of n.value.properties) {
    if (p.type === "SpreadElement") { const fn = p.argument.callee && p.argument.callee.name; walk(fnNode[fn], m => { if (m.type === "ReturnStatement" && m.argument && m.argument.type === "ObjectExpression") m.argument.properties.forEach(q => lists.push({ key: q.key.name, expr: src(q.value), via: fn })); }); }
    else lists.push({ key: p.key.name || p.key.value, expr: p.shorthand ? p.key.name : src(p.value) }); } });
  /* 2. aparelho: localStorage.setItem(LSX, JSON.stringify(variável)) */
  const lsOf = {}; for (const re = /localStorage\.setItem\((\w+)\s*,\s*JSON\.stringify\((\w+)\)\)/g; ;) { const m = re.exec(code); if (!m) break; const c = M.sym[m[1]]; (lsOf[m[2]] = lsOf[m[2]] || new Set()).add(c && c.val ? c.val.replace(/^["'`]|["'`]$/g, "") : m[1]); }
  /* 3. conta: as assinaturas da carga (objeto R) e os packStore/collection soltos */
  const acct = []; const seenA = new Set();
  for (const re = /(\w+)\s*:\s*(?:db\.doc\(P\+"([\w/]+)"\)|(\w+)\.collection\("(\w+)"\)|packStore\(\w+,"(\w+)"\))/g; ;) { const m = re.exec(code); if (!m) break; const kind = m[2] ? "doc" : m[4] ? "col" : "pk", name = m[2] || m[4] || m[5]; const id = kind + ":" + name; if (!seenA.has(id)) { seenA.add(id); acct.push({ id, kind, name, prop: m[1] }); } }
  for (const k of Object.keys(M.fs)) if (!seenA.has(k)) { seenA.add(k); const [kind, name] = k.split(":"); acct.push({ id: k, kind, name, prop: name }); }
  /* 4. limpeza na carga e importação do site */
  const cleanerOf = {}, okOf = {};
  for (const re = /(\w+)\s*=\s*[\w.]*?(?:\.docs\.map\(d=>d\.data\(\)\)|d\.(\w+))\.filter\((\w+)\)\.map\((\w+)\)/g; ;) { const m = re.exec(code + "\n" + bridge); if (!m) break; okOf[m[1]] = m[3]; cleanerOf[m[1]] = m[4]; }
  const imp = {}; { const a = bridge.indexOf("async function applyBackup"), b = bridge.indexOf("\n  }\n", a); const body = a >= 0 ? bridge.slice(a, b) : ""; for (const re = /\bd\.(\w+)/g; ;) { const m = re.exec(body); if (!m) break; imp[m[1]] = true; } }
  const rows = lists.map(x => { const v = /^\w+$/.test(x.expr) ? x.expr : (x.expr.match(/^(\w+)/) || [])[1];
    const names = [x.key, v, ...Object.entries(ALIAS).filter(([a, b]) => b.split(" ").includes(x.key)).map(e => e[0])];
    const ac = acct.filter(a => names.includes(a.name) || names.includes(a.prop) || (ALIAS[a.name] || "").split(" ").includes(x.key));
    const ln = (bridge.split("\n").find(l => new RegExp("\\bd\\." + x.key + "\\b").test(l) && /Clean\b/.test(l)) || ""), lc = (ln.slice(ln.search(new RegExp("\\bd\\." + x.key + "\\b"))).match(/(\w+Clean)\b/) || [])[1];
    const cl = cleanerOf[v] || cleanerOf[x.key] || lc || (x.key === "errors" ? "errOk" : x.key === "ui" ? "uiSanitize" : x.key === "topics" ? "migrate" : x.key === "fac" ? "facNormalize" : x.key === "bank" ? "bqClean" : x.key === "bankh" ? "bhClean" : "");
    return { key: x.key, expr: x.expr, v, ls: [...(lsOf[v] || [])], acct: ac.map(a => a.id), clean: cl, cleanAt: at(cl), imp: !!imp[x.key], drive: new RegExp("\\b" + x.key + "\\b").test(gs), via: x.via || "" }; });
  /* 5. avisos */
  const warn = [];
  for (const r of rows) { if (!r.imp) warn.push(`${r.key}: o backup leva, mas o Importar backup do site (bridge.js › applyBackup) não lê d.${r.key}`);
    if (!r.drive) warn.push(`${r.key}: o backup leva, mas o backup do Drive (tools/backup-drive.gs) não monta ${r.key}`); }
  const covered = new Set(rows.flatMap(r => r.acct));
  const outside = acct.filter(a => !covered.has(a.id));
  for (const a of outside) if (!FORA[a.id]) warn.push(`${a.id}: está na conta e não entra no backup. Se for de propósito, explique em FORA (tools/mapa/dados.js)`);
  for (const k in FORA) if (!acct.some(a => a.id === k)) warn.push(`${k}: está em FORA (tools/mapa/dados.js) mas não existe mais na conta; tire de lá`);
  const lsList = Object.entries(lsOf).filter(([v]) => !rows.some(r => r.v === v)).map(([v, s]) => ({ v, ls: [...s] }));

  /* 6. campos de cada tipo */
  const types = [];
  const cleanFields = name => { const fn = fnNode[name]; if (!fn) return null; let ret = null; const ass = []; let oVar = null;
    walk(fn, (n, p) => { if (n.type === "ReturnStatement" && n.argument) { const a = n.argument; if (a.type === "ObjectExpression") ret = (ret || []).concat(objKeys(a, code)); else if (a.type === "Identifier") oVar = a.name; } });
    if (fn.type === "ArrowFunctionExpression" && fn.body.type === "ObjectExpression") ret = objKeys(fn.body, code);
    if (oVar) walk(fn, n => { if (n.type === "VariableDeclarator" && n.id.name === oVar && n.init && n.init.type === "ObjectExpression") ret = (ret || []).concat(objKeys(n.init, code));
      if (n.type === "AssignmentExpression" && n.left.type === "MemberExpression" && n.left.object.name === oVar && !n.left.computed) ass.push({ k: n.left.property.name, opt: true });
      // for (const f of ["a","b"]) if (x[f]) o[f] = …
      if (n.type === "ForOfStatement" && n.right.type === "ArrayExpression" && n.left.declarations) { const lv = n.left.declarations[0].id.name; let hit = false;
        walk(n.body, m => { if (m.type === "AssignmentExpression" && m.left.type === "MemberExpression" && m.left.computed && m.left.object.name === oVar && m.left.property.name === lv) hit = true; });
        if (hit) n.right.elements.forEach(e => e && typeof e.value === "string" && ass.push({ k: e.value, opt: true })); } });
    if (!ret) return null; const seen = new Set(); return ret.concat(ass).filter(x => !seen.has(x.k) && seen.add(x.k)); };
  for (const r of rows) { const fl = r.clean && /Clean$/.test(r.clean) ? cleanFields(r.clean) : null; if (fl) types.push({ key: r.key, how: `campos que ${r.clean} guarda (o resto some ao carregar)`, at: r.cleanAt, fields: fl.map(x => ({ k: x.k + (x.opt ? "?" : ""), sub: x.sub })) }); }
  for (const extra of ["exQClean", "eRaClean"]) { const fl = cleanFields(extra); if (fl) types.push({ key: extra === "exQClean" ? "exams › questão" : "errors › ra (erro organizado)", how: `campos que ${extra} guarda`, at: at(extra), fields: fl.map(x => ({ k: x.k + (x.opt ? "?" : ""), sub: x.sub })) }); }
  // tipos que a carga NÃO filtra campo a campo: campos achados onde o código os grava
  const writes = (test) => { const F = {}; walk(ast, (n, p) => {
      const add = (obj, prop, kind, pos) => { if (!test(obj, pos)) return; const own = M.files.length ? ownerName(pos) : ""; (F[prop] = F[prop] || new Set()).add(own); };
      if (n.type === "AssignmentExpression" && n.left.type === "MemberExpression" && !n.left.computed && n.left.object.type === "Identifier") add(n.left.object, n.left.property.name, "w", n.start);
      if (n.type === "UnaryExpression" && n.operator === "delete" && n.argument.type === "MemberExpression" && !n.argument.computed && n.argument.object.type === "Identifier") add(n.argument.object, n.argument.property.name, "d", n.start); });
    return Object.keys(F).sort().map(k => ({ k, by: [...F[k]].filter(Boolean).slice(0, 6) })); };
  const tops = ast.body.map(n => ({ a: n.start, b: n.end, name: n.type === "FunctionDeclaration" ? n.id.name : n.type === "VariableDeclaration" ? n.declarations.map(d => d.id.name).filter(Boolean).join(",") : "" }));
  function ownerName(pos) { const t = tops.find(x => pos >= x.a && pos < x.b); return t ? t.name || "(topo)" : ""; }
  // temas: o parâmetro da função passada ao upd(k, s => …) e as variáveis "s=get(…)"/"state[k]"
  const updParams = []; walk(ast, n => { if (n.type === "CallExpression" && n.callee.name === "upd" && n.arguments[1] && /Function/.test(n.arguments[1].type) && n.arguments[1].params[0] && n.arguments[1].params[0].type === "Identifier") updParams.push({ name: n.arguments[1].params[0].name, a: n.arguments[1].start, b: n.arguments[1].end }); });
  // funções chamadas com o tema como argumento (upd(k, s => addQ(s, …))): o parâmetro delas também é o tema
  const helpers = []; walk(ast, n => { if (n.type !== "CallExpression" || !n.callee.name || !fnNode[n.callee.name]) return; const u = updParams.find(u => n.start >= u.a && n.start < u.b); if (!u) return;
    n.arguments.forEach((a, i) => { const fn = fnNode[n.callee.name], pp = fn.params[i]; if (a.type === "Identifier" && a.name === u.name && pp && pp.type === "Identifier") helpers.push({ name: pp.name, a: fn.start, b: fn.end }); }); });
  const scopes = updParams.concat(helpers);
  const tf = writes((obj, pos) => scopes.some(u => u.name === obj.name && pos >= u.a && pos < u.b));
  walk(ast, n => { if (n.type === "AssignmentExpression" && n.left.type === "MemberExpression" && !n.left.computed && n.left.object.type === "MemberExpression" && n.left.object.computed && n.left.object.object.name === "state") {
    const k = n.left.property.name, o = ownerName(n.start), ex = tf.find(x => x.k === k); if (ex) { if (!ex.by.includes(o)) ex.by.push(o); } else tf.push({ k, by: [o] }); } });
  tf.sort((a, b) => a.k.localeCompare(b.k));
types.push({ key: "topics (state[chave])", how: "campos gravados dentro de upd(k, s => …), o único caminho para mudar um tema; a limpeza é o migrate()", at: at("upd"), fields: tf.map(x => ({ k: x.k, by: x.by })) });
  // erros: o objeto do eNew + toda gravação "e.campo = …" (e = erro por costume do código; eventos não recebem gravação)
  const eLit = []; walk(fnNode.eNew, n => { if (n.type === "VariableDeclarator" && n.id.name === "e" && n.init && n.init.type === "ObjectExpression") objKeys(n.init, code).forEach(x => eLit.push(x.k)); });
  const DOM = new Set(["onclick", "onchange", "oninput", "textContent", "innerHTML", "className", "hidden", "value", "checked", "disabled", "title", "id", "href", "download", "src", "open"]);
  const errFn = pos => { const o = ownerName(pos), r = M.sym[o]; return !!r && (r.f.startsWith("110-erros/") || r.uses.includes("errors") || r.uses.includes("putErr")); };
  const ew = writes((obj, pos) => obj.name === "e" && errFn(pos)).filter(x => !DOM.has(x.k)); const eAll = new Map(eLit.map(k => [k, ["eNew"]])); ew.forEach(x => eAll.set(x.k, [...new Set([...(eAll.get(x.k) || []), ...x.by])]));
  types.push({ key: "errors", how: "errOk confere poucos campos e deixa o resto passar: campos do eNew e de toda gravação \"e.campo = …\"", at: at("errOk"), fields: [...eAll.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([k, by]) => ({ k, by: by.slice(0, 6) })) });
  // preferências e perfil
  const prof = {}; for (const re = /\bui\.profile\.([A-Za-z_]\w*)/g; ;) { const m = re.exec(code); if (!m) break; prof[m[1]] = 1; }
  types.push({ key: "ui.prefs", how: "uiSanitize decide o que fica; quem lê e grava cada uma: mapa/chaves.md", at: at("uiSanitize"), fields: Object.keys(M.prefs).sort().map(k => ({ k, by: (M.prefs[k].w || []).slice(0, 4) })) });
  types.push({ key: "ui.profile", how: "uiSanitize", at: at("uiSanitize"), fields: Object.keys(prof).sort().map(k => ({ k })) });
  return { rows, outside: outside.map(a => ({ ...a, why: FORA[a.id] || "" })), lsList, types, warn };
}
module.exports = { build, FORA };
