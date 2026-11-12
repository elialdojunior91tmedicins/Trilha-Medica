// Mapa do código do Nexus: lê src/app/ (JS, CSS, HTML), bridge.js, sw.js, tools/backup-drive.gs, os testes e o CLAUDE.md
// e devolve um objeto só (veja tools/mapa/LEIA.md). Nada aqui roda no site.
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const ROOT = path.resolve(__dirname, "../..");
const dep = n => { try { return require(path.join(ROOT, "tools/divisao/node_modules", n)); } catch (e) { throw new Error("Falta instalar as ferramentas: cd tools/divisao && npm i"); } };
const lsjs = require(path.join(ROOT, "tools/divisao/lsjs.js"));
const rd = f => fs.readFileSync(path.join(ROOT, f), "utf8");
const has = f => fs.existsSync(path.join(ROOT, f));
const one = s => String(s || "").replace(/\s+/g, " ").trim();
const cut = (s, n) => { s = one(s); return s.length > n ? s.slice(0, n - 1) + "…" : s; };
const uniq = a => [...new Set(a)];
const liner = t => { const st = [0]; for (let i = 0; i < t.length; i++) if (t.charCodeAt(i) === 10) st.push(i + 1); return p => { let lo = 0, hi = st.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (st[m] <= p) lo = m; else hi = m - 1; } return lo + 1; }; };

/* arquivos que entram no mapa (e na impressão que diz se o mapa está em dia) */
function inputs() {
  const js = lsjs(path.join(ROOT, "src/app/js")).map(f => "src/app/js/" + f);
  const tests = fs.readdirSync(path.join(ROOT, "tests")).filter(f => /^(t\d+|monkey8|mockdb|fakefb|seed10|sim17|perf\w*|shots\w+)\.js$/.test(f)).sort((a, b) => a.localeCompare(b, "en", { numeric: true })).map(f => "tests/" + f);
  const unit = has("tests/unit") ? fs.readdirSync(path.join(ROOT, "tests/unit")).filter(f => f.endsWith(".js")).sort().map(f => "tests/unit/" + f) : [];
  const extra = ["bridge.js", "sw.js", "config.js", "tools/backup-drive.gs", "src/build_site.py", "firestore.rules", "manifest.webmanifest", "site.css"].filter(has);
  const html = ["src/app/topo.html", "src/app/corpo.html", "src/app/fim.html"], css = ["src/app/css/app.css"];
  return { js, tests, unit, extra, html, css, doc: ["CLAUDE.md", "docs/recursos.md"].filter(has), list: has("tests/list.txt") ? ["tests/list.txt"] : [] };
}
function stamp() {
  const I = inputs(), h = crypto.createHash("sha1");
  for (const f of [].concat(I.js, I.tests, I.unit, I.extra, I.html, I.css, I.doc, I.list)) { const s = fs.statSync(path.join(ROOT, f)); h.update(f + ":" + s.size + ":" + Math.floor(s.mtimeMs) + ";"); }
  for (const f of ["tools/mapa/lib.js", "tools/mapa/gerar.js", "tools/mapa/dados.js"]) h.update(rd(f));
  return h.digest("hex").slice(0, 16);
}

/* ---------- textos dentro de um trecho de código: ids, classes, chaves, caminhos da conta ---------- */
const ID_OK = /^[A-Za-z][\w-]*$/;
function scanText(src) {
  const R = { idDef: [], idUse: [], cls: [], ls: [], prefs: [], prefsW: [], fs: [], help: [], ev: [] };
  let m;
  const push = (a, v) => { if (v && !a.includes(v)) a.push(v); };
  // ids criados: id="x" · id="pre-${…}" · .id="x" · .id="pre-"+k
  for (const re = /\bid=\\?["']([\w-]*)(\$\{)?/g; (m = re.exec(src));) { if (m[2]) push(R.idDef, m[1] + "*"); else if (ID_OK.test(m[1])) push(R.idDef, m[1]); }
  for (const re = /\.id\s*=\s*(["'`])([\w-]*)(\$\{|\1\s*\+)?/g; (m = re.exec(src));) { if (!m[2]) continue; push(R.idDef, m[3] ? m[2] + "*" : m[2]); }
  // ids procurados: "#x" em seletores, $("#x"), getElementById("x"), "#pre-"+k
  for (const re = /(["'`(\s,>+~])#([A-Za-z][\w-]*)(\$\{|["'`]\s*\+)?/g; (m = re.exec(src));) push(R.idUse, m[3] ? m[2] + "*" : m[2]);
  for (const re = /getElementById\(\s*(["'`])([\w-]+)(\$\{|\1\s*\+)?/g; (m = re.exec(src));) push(R.idUse, m[3] ? m[2] + "*" : m[2]);
  // classes: class="a b" em HTML, classList.x("a"), className="a", e ".a" dentro de seletores
  for (const re = /\bclass=\\?["']([^"'\\<>]*)/g; (m = re.exec(src));) m[1].replace(/\$\{[^}]*\}/g, " ").split(/\s+/).forEach(c => /^[A-Za-z][\w-]*$/.test(c) && push(R.cls, c));
  for (const re = /classList\.(?:add|remove|toggle|contains)\(([^)]*)\)/g; (m = re.exec(src));) for (const re2 = /["'`]([A-Za-z][\w-]*)["'`]/g, s = m[1]; (m = re2.exec(s));) push(R.cls, m[1]);
  for (const re = /className\s*=\s*["'`]([^"'`]*)/g; (m = re.exec(src));) m[1].replace(/\$\{[^}]*\}/g, " ").split(/\s+/).forEach(c => /^[A-Za-z][\w-]*$/.test(c) && push(R.cls, c));
  for (const re = /(?:querySelector(?:All)?|closest|matches|\$\$?)\(\s*(["'`])((?:(?!\1).)*)\1/g; (m = re.exec(src));) for (const re2 = /\.([A-Za-z][\w-]*)/g, s = m[2]; (m = re2.exec(s));) push(R.cls, m[1]);
  // localStorage, preferências, conta, ajuda
  for (const re = /["'`](resid-[\w-]+)/g; (m = re.exec(src));) push(R.ls, m[1]);
  for (const re = /\bui\.prefs\.([A-Za-z_]\w*)(\s*=(?!=))?/g; (m = re.exec(src));) { push(R.prefs, m[1]); if (m[2]) push(R.prefsW, m[1]); }
  for (const re = /(collection|packStore|doc)\(\s*(?:\w+\s*[,+]\s*)?["'`]([\w/-]+)["'`]/g; (m = re.exec(src));) push(R.fs, (m[1] === "packStore" ? "pk:" : m[1] === "doc" ? "doc:" : "col:") + m[2]);
  for (const re = /(?:helpBtn|goHelp)\("([^"]+)"\)/g; (m = re.exec(src));) push(R.help, m[1]);
  for (const re = /addEventListener\(\s*["'`](\w+)/g; (m = re.exec(src));) push(R.ev, m[1]);
  return R;
}

/* ---------- JS: instruções do topo, nomes, comentários ---------- */
function topOutline(t, file) {
  const acorn = dep("acorn"), lineAt = liner(t), comments = [];
  const ast = acorn.parse(t, { ecmaVersion: 2023, sourceType: "script", ranges: true, onComment: (blk, txt, s, e) => comments.push({ s, e, txt }) });
  const sig = (n) => { const f = n.type === "FunctionDeclaration" ? n : n; return "(" + f.params.map(p => t.slice(p.start, p.end)).join(",") + ")"; };
  const valHint = v => { if (!v) return ""; const s = t.slice(v.start, v.end);
    if (v.type === "ArrayExpression") return `lista de ${v.elements.length}`; if (v.type === "ObjectExpression") return `objeto com ${v.properties.length} campos`;
    if (v.type === "NewExpression") return "new " + (v.callee.name || "") ; if (v.type === "TemplateLiteral" || (v.type === "Literal" && typeof v.value === "string")) return s.length > 70 ? `texto de ${s.length} letras` : s;
    return s.length > 70 ? cut(s, 70) : s; };
  const out = [], body = ast.body;
  const topComments = comments.filter(c => !body.some(n => c.s > n.start && c.s < n.end));
  let ci = 0;
  body.forEach((n, bi) => {
    let doc = ""; const prevEnd = bi ? body[bi - 1].end : 0;
    while (ci < topComments.length && topComments[ci].s < n.start) { if (topComments[ci].s >= prevEnd) doc += (doc ? " " : "") + one(topComments[ci].txt); ci++; }
    const base = { f: file, l: lineAt(n.start), e: lineAt(n.end - 1), a: n.start, b: n.end, sz: n.end - n.start, doc: cut(doc.replace(/^[=\s*]+|[=\s*]+$/g, ""), 260) };
    if (n.type === "FunctionDeclaration") out.push({ ...base, n: n.id.name, k: "fn", sig: (n.async ? "async " : "") + sig(n) });
    else if (n.type === "ClassDeclaration") out.push({ ...base, n: n.id.name, k: "class", sig: "" });
    else if (n.type === "VariableDeclaration") {
      n.declarations.forEach((d, di) => {
        const names = []; (function ids(p) { if (!p) return; if (p.type === "Identifier") names.push(p.name); else if (p.type === "ObjectPattern") p.properties.forEach(q => ids(q.value || q.argument)); else if (p.type === "ArrayPattern") p.elements.forEach(ids); else if (p.type === "AssignmentPattern") ids(p.left); else if (p.type === "RestElement") ids(p.argument); })(d.id);
        const v = d.init, isFn = v && /^(ArrowFunctionExpression|FunctionExpression)$/.test(v.type);
        const one1 = n.declarations.length === 1;
        const b1 = one1 ? base : { ...base, l: lineAt(d.start), e: lineAt(d.end - 1), a: d.start, b: d.end, sz: d.end - d.start, doc: di ? "" : base.doc };
        names.forEach(nm => out.push({ ...b1, n: nm, k: isFn ? "fn" : n.kind, sig: isFn ? (v.async ? "async " : "") + sig(v) : "", val: isFn ? "" : valHint(v) }));
      });
    } else out.push({ ...base, n: "", k: "stmt", sig: "", val: cut(t.slice(n.start, n.end), 110) });
  });
  return { ast, out, sections: topComments.filter(c => /^[\s*]*={3,}|^\s*-{3,}/.test(c.txt) || c.txt.length > 60).map(c => ({ l: lineAt(c.s), t: cut(c.txt.replace(/^[=\s*-]+|[=\s*-]+$/g, ""), 200) })) };
}

/* ---------- CSS: regras, seções, variáveis ---------- */
function cssMap(t) {
  const lineAt = liner(t), rules = [], sections = [], vars = {}, ctx = [];
  let i = 0, pre = 0;
  while (i < t.length) {
    const c = t[i];
    if (c === "/" && t[i + 1] === "*") { const e = t.indexOf("*/", i + 2), end = e < 0 ? t.length : e + 2; if (!one(t.slice(pre, i))) { sections.push({ l: lineAt(i), t: cut(t.slice(i + 2, end - 2).replace(/^[=\s*-]+|[=\s*-]+$/g, ""), 200) }); pre = end; } i = end; continue; }
    if (c === '"' || c === "'") { i++; while (i < t.length && t[i] !== c) { if (t[i] === "\\") i++; i++; } i++; continue; }
    if (c === "{") {
      const sel = one(t.slice(pre, i).replace(/\/\*[\s\S]*?\*\//g, "")), l = lineAt(pre + (t.slice(pre, i).match(/^\s*/) || [""])[0].length);
      if (/^@(media|container|supports|layer|keyframes|-webkit-keyframes)/.test(sel)) { ctx.push(sel); i++; pre = i; continue; }
      let d = 1, j = i + 1; while (j < t.length && d) { if (t[j] === "{") d++; else if (t[j] === "}") d--; j++; }
      const body = t.slice(i + 1, j - 1);
      if (!ctx.some(x => /keyframes/.test(x))) { rules.push({ l, sel, ctx: ctx.join(" › "), sz: body.length }); for (const re = /(?:^|[;{\s])(--[\w-]+)\s*:/g; ;) { const m = re.exec(body); if (!m) break; (vars[m[1]] = vars[m[1]] || { def: [], n: 0 }).def.push(l); } }
      i = j; pre = i; continue;
    }
    if (c === "}") { ctx.pop(); i++; pre = i; continue; }
    if (c === ";" && !ctx.length && /^\s*@/.test(t.slice(pre, i))) { pre = i + 1; }
    i++;
  }
  for (const re = /var\((--[\w-]+)/g; ;) { const m = re.exec(t); if (!m) break; if (vars[m[1]]) vars[m[1]].n++; else vars[m[1]] = { def: [], n: 1 }; }
  const cls = {}, ids = {}, attrs = {};
  for (const r of rules) {
    for (const re = /\.([A-Za-z][\w-]*)/g; ;) { const m = re.exec(r.sel.replace(/\[[^\]]*\]/g, "")); if (!m) break; (cls[m[1]] = cls[m[1]] || []).push(r.l); }
    for (const re = /#([A-Za-z][\w-]*)/g; ;) { const m = re.exec(r.sel.replace(/\[[^\]]*\]/g, "")); if (!m) break; (ids[m[1]] = ids[m[1]] || []).push(r.l); }
    for (const re = /\[(data-[\w-]+)/g; ;) { const m = re.exec(r.sel); if (!m) break; (attrs[m[1]] = attrs[m[1]] || []).push(r.l); }
  }
  const medias = {}; rules.forEach(r => { if (r.ctx) (medias[r.ctx] = medias[r.ctx] || []).push(r.l); });
  for (const o of [cls, ids, attrs, medias]) for (const k in o) o[k] = uniq(o[k]);
  return { rules, sections, vars, cls, ids, attrs, medias };
}

/* ---------- HTML: ids e classes com a linha ---------- */
function htmlMap(t, file) {
  const lineAt = liner(t), ids = {}, cls = {};
  for (const re = /\bid="([\w-]+)"/g; ;) { const m = re.exec(t); if (!m) break; (ids[m[1]] = ids[m[1]] || []).push(file + ":" + lineAt(m.index)); }
  for (const re = /\bclass="([^"]*)"/g; ;) { const m = re.exec(t); if (!m) break; m[1].split(/\s+/).forEach(c => { if (c) (cls[c] = cls[c] || []).push(file + ":" + lineAt(m.index)); }); }
  return { ids, cls };
}

/* ---------- o mapa inteiro ---------- */
function build() {
  const acorn = dep("acorn"), escope = dep("eslint-scope"), I = inputs();
  const M = { v: 1, stamp: stamp(), at: new Date().toISOString(), files: [], sym: {}, anon: [], ids: {}, cls: {}, ls: {}, prefs: {}, fs: {}, help: {}, css: null, html: null, tests: {}, extra: {}, common: [] };
  /* 1. JS do app: um programa só, na ordem do build */
  let code = ""; const spans = [];
  for (const f of I.js) { const t = rd(f); spans.push({ f, a: code.length, b: code.length + t.length, t }); code += t; }
  const all = [];
  for (const s of spans) {
    const O = topOutline(s.t, s.f), short = s.f.replace("src/app/js/", "");
    const head = O.sections.length && O.sections[0].l <= 3 ? O.sections[0].t : "Sem cabeçalho. Seções: " + O.sections.slice(0, 5).map(x => cut(x.t, 60)).join(" · ");
    M.files.push({ f: s.f, short, lines: s.t.split("\n").length - (s.t.endsWith("\n") ? 1 : 0), kb: +(s.t.length / 1024).toFixed(1), head: cut(head, 240), sections: O.sections, n: O.out.filter(x => x.n).length });
    for (const x of O.out) { const src = s.t.slice(x.a, x.b), T = scanText(src); all.push({ ...x, ga: s.a + x.a, gb: s.a + x.b, short, T }); }
  }
  let anonN = 0;
  for (const x of all) {
    const rec = { f: x.short, l: x.l, e: x.e, k: x.k, sig: x.sig || "", val: x.val || "", doc: x.doc, sz: x.sz, uses: [], writes: [], by: [], idDef: x.T.idDef, idUse: x.T.idUse, cls: x.T.cls, ls: x.T.ls, prefs: x.T.prefs, prefsW: x.T.prefsW, fs: x.T.fs, help: x.T.help, ev: x.T.ev, tests: [], cm: [] };
    if (x.n) { if (M.sym[x.n]) rec.dup = M.sym[x.n].f + ":" + M.sym[x.n].l; M.sym[x.n] = rec; x.key = x.n; }
    else { x.key = "@" + x.short + ":" + x.l + (all.filter(y => !y.n && y.short === x.short && y.l === x.l).indexOf(x) || ""); M.anon.push({ key: x.key, ...rec }); anonN++; }
  }
  const anonBy = new Map(M.anon.map(a => [a.key, a]));
  const recOf = k => M.sym[k] || anonBy.get(k);
  /* quem usa quem: referências globais de cada instrução do topo */
  const ast = acorn.parse(code, { ecmaVersion: 2023, sourceType: "script", ranges: true });
  const sm = escope.analyze(ast, { ecmaVersion: 2022, sourceType: "script" }), G = sm.globalScope;
  const sorted = all.slice().sort((p, q) => p.ga - q.ga);
  const owner = pos => { let lo = 0, hi = sorted.length - 1, hit = null; while (lo <= hi) { const m = (lo + hi) >> 1; if (sorted[m].gb <= pos) lo = m + 1; else if (sorted[m].ga > pos) hi = m - 1; else { hit = m; break; } } if (hit == null) return null;
    return sorted[hit]; };
  const seen = new Set();
  for (const sc of sm.scopes) for (const r of sc.references) {
    if (seen.has(r)) continue; seen.add(r);
    if (r.resolved && r.resolved.scope !== G) continue;
    const nm = r.identifier.name; if (!M.sym[nm]) continue;
    const o = owner(r.identifier.range[0]); if (!o || o.key === nm) continue;
    const R = recOf(o.key); if (!R) continue;
    if (r.isWrite() && !r.init) { if (!R.writes.includes(nm)) R.writes.push(nm); }
    if (!R.uses.includes(nm)) R.uses.push(nm);
  }
  for (const x of sorted) { const R = recOf(x.key); for (const u of R.uses) { const t = M.sym[u]; if (t && !t.by.includes(x.key)) t.by.push(x.key); } }
  /* 2. índices por id, classe, chave, preferência, conta, ajuda */
  const add = (o, k, field, v) => { const e = o[k] = o[k] || {}; (e[field] = e[field] || []).includes(v) || e[field].push(v); };
  for (const x of sorted) { const R = recOf(x.key), k = x.key;
    R.idDef.forEach(v => add(M.ids, v, "def", k)); R.idUse.forEach(v => add(M.ids, v, "use", k)); R.cls.forEach(v => add(M.cls, v, "js", k));
    R.ls.forEach(v => add(M.ls, v, "js", k)); R.prefs.forEach(v => add(M.prefs, v, R.prefsW.includes(v) ? "w" : "r", k)); R.fs.forEach(v => add(M.fs, v, "js", k)); R.help.forEach(v => add(M.help, v, "js", k)); }
  /* 3. HTML e CSS */
  M.html = {}; for (const f of I.html) { const H = htmlMap(rd(f), f.replace("src/app/", "")); for (const k in H.ids) H.ids[k].forEach(v => add(M.ids, k, "html", v)); for (const k in H.cls) add(M.cls, k, "html", H.cls[k][0]); M.html[f] = { lines: rd(f).split("\n").length, ids: Object.keys(H.ids).length }; }
  const C = cssMap(rd(I.css[0])); M.css = { file: I.css[0], lines: rd(I.css[0]).split("\n").length, rules: C.rules.length, sections: C.sections, vars: C.vars, attrs: C.attrs, medias: C.medias };
  for (const k in C.cls) (M.cls[k] = M.cls[k] || {}).css = C.cls[k];
  for (const k in C.ids) (M.ids[k] = M.ids[k] || {}).css = C.ids[k];
  /* 4. arquivos fora de src/app (site, backup, build) */
  for (const f of I.extra) { const t = rd(f), E = { lines: t.split("\n").length, kb: +(t.length / 1024).toFixed(1), items: [], ls: [], fs: [] };
    if (/\.(js|gs)$/.test(f)) { try { const O = topOutline(t, f); E.items = O.out.filter(x => x.n).map(x => ({ n: x.n, l: x.l, e: x.e, k: x.k, sig: x.sig, doc: x.doc })); E.sections = O.sections;
        // funções de dentro de um bloco só (o bridge.js é uma função que se chama): um nível abaixo
        if (E.items.length < 5) { const inner = []; const lineAt = liner(t); (function walk(n, d) { if (!n || typeof n.type !== "string") return; if (d > 0 && d < 6 && n.type === "FunctionDeclaration") inner.push({ n: n.id.name, l: lineAt(n.start), e: lineAt(n.end - 1), k: "fn", sig: "(" + n.params.map(p => t.slice(p.start, p.end)).join(",") + ")", doc: "" });
            if (d > 0 && d < 6 && n.type === "VariableDeclarator" && n.init && /Function/.test(n.init.type) && n.id.name) inner.push({ n: n.id.name, l: lineAt(n.start), e: lineAt(n.end - 1), k: "fn", sig: "(" + n.init.params.map(p => t.slice(p.start, p.end)).join(",") + ")", doc: "" });
            const dd = /Function/.test(n.type) ? d + 1 : d; for (const k in n) { if (k === "range") continue; const v = n[k]; if (Array.isArray(v)) v.forEach(c => walk(c, dd)); else if (v && typeof v.type === "string") walk(v, dd); } })(O.ast, 0);
          const names = new Set(E.items.map(i => i.n)); inner.forEach(i => { if (!names.has(i.n)) { names.add(i.n); E.items.push(i); } }); E.items.sort((a, b) => a.l - b.l); } } catch (e) { E.err = String(e.message); } }
    const T = scanText(t); E.ls = T.ls; E.fs = T.fs; E.idDef = T.idDef; E.idUse = T.idUse;
    T.ls.forEach(v => add(M.ls, v, "extra", f)); T.idDef.forEach(v => add(M.ids, v, "extra", f)); T.idUse.forEach(v => add(M.ids, v, "extra", f));
    M.extra[f] = E; }
  /* 5. testes: o que cada um toca */
  const inList = new Set(I.list.length ? rd(I.list[0]).split("\n").map(s => s.trim()).filter(Boolean) : []);
  const symNames = Object.keys(M.sym), idExact = new Set(Object.keys(M.ids).filter(k => !k.endsWith("*"))), idPre = Object.keys(M.ids).filter(k => k.endsWith("*")).map(k => k.slice(0, -1)).filter(p => p.length >= 3).sort((a, b) => b.length - a.length);
  const testFiles = [].concat(I.tests, I.unit);
  const hit = {};
  for (const f of testFiles) { const t = rd(f), name = path.basename(f).replace(/\.js$/, "");
    const hm = t.match(/^(?:\s*\/\/[^\n]*\n)+/), desc = hm ? cut(hm[0].replace(/^\s*\/\/\s?/gm, ""), 420) : "";
    const body = hm ? t.slice(hm[0].length) : t, words = new Set(body.match(/[A-Za-z_$][\w$]*/g) || []);
    const syms = symNames.filter(n => n.length > 2 && words.has(n));
    const ids = new Set(); for (const re = /#([A-Za-z][\w-]*)/g; ;) { const m = re.exec(body); if (!m) break; const v = m[1]; if (idExact.has(v)) ids.add(v); else { const p = idPre.find(p => v.startsWith(p)); if (p) ids.add(p + "*"); } }
    M.tests[name] = { f, kind: /mapa\.test/.test(f) ? "apoio" : /unit\//.test(f) ? "unit" : /^t\d+$/.test(name) ? "tela" : "apoio", inList: inList.has(name) || inList.has(name + ".js"), desc, checks: (body.match(/\bok\(|\bassert\.|\btest\(/g) || []).length, syms, ids: [...ids] };
    syms.forEach(n => (hit[n] = hit[n] || []).push(name)); }
  const real = Object.values(M.tests).filter(t => t.kind !== "apoio").length || 1;
  for (const n in hit) { const L = hit[n].filter(t => M.tests[t].kind !== "apoio"); if (L.length > real * 0.5) { M.common.push(n); M.sym[n].tests = ["(em mais da metade dos testes)"]; } else M.sym[n].tests = L; }
  for (const name in M.tests) M.tests[name].ids.forEach(id => add(M.ids, id, "tests", name));
  /* 6. CLAUDE.md: em que linha cada nome é citado */
  for (const f of I.doc) { const L = rd(f).split("\n"); L.forEach((ln, i) => { const seenL = new Set(); for (const re = /`([^`]+)`/g; ;) { const m = re.exec(ln); if (!m) break; (m[1].match(/[A-Za-z_$][\w$]*/g) || []).forEach(w => { if (M.sym[w] && w.length > 2 && !seenL.has(w)) { seenL.add(w); if (M.sym[w].cm.length < 5) M.sym[w].cm.push(f + ":" + (i + 1)); } }); } }); }
  M.data = require("./dados.js").build(M);
  M.count = { files: M.files.length, lines: M.files.reduce((a, f) => a + f.lines, 0), sym: symNames.length, fn: symNames.filter(n => M.sym[n].k === "fn").length, anon: anonN, ids: Object.keys(M.ids).length, cls: Object.keys(M.cls).length, ls: Object.keys(M.ls).length, prefs: Object.keys(M.prefs).length, tests: Object.keys(M.tests).length, css: C.rules.length };
  return M;
}
module.exports = { ROOT, build, stamp, inputs, cut, one, uniq, rd, has, scanText, cssMap, topOutline };
