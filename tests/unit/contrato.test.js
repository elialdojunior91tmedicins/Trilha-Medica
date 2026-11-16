// Contrato entre o site (bridge.js) e o app (src/app/js/), desde 16/11/2026.
// O bridge.js usa ~78 nomes do app pelo nome (state, migrate, buildBackup, bankRestore…), sem import: se um deles for
// renomeado ou apagado no app, nada avisa no build e o site só quebra no uso (ex.: Importar backup). Alguns usos são
// protegidos por "typeof x === 'function'": aí a quebra é ainda pior, porque a função some em silêncio.
// Este teste lê os dois lados e exige que todo nome livre do bridge.js seja do app ou do navegador/JavaScript,
// que o que o bridge.js REESCREVE seja "let" no app, e que o que o app lê de window.__site exista no bridge.js.
const test = require("node:test"), assert = require("node:assert/strict");
const fs = require("fs"), path = require("path");
const acorn = require("./vendor/acorn.js");
const ROOT = path.join(__dirname, "../..");
const rd = f => fs.readFileSync(path.join(ROOT, f), "utf8");
const parse = t => acorn.parse(t, { ecmaVersion: 2022, sourceType: "script" });

// Nomes do navegador e do JavaScript que o bridge.js pode usar sem declarar. Nome novo do navegador: acrescente aqui.
const NAVEGADOR = new Set(("window document navigator location localStorage sessionStorage console firebase matchMedia " +
  "setTimeout clearTimeout setInterval clearInterval requestAnimationFrame alert confirm prompt fetch " +
  "Blob File FileReader URL Image Promise JSON Math Object Array String Number Boolean Date Set Map RegExp Error " +
  "isNaN parseInt parseFloat undefined NaN Infinity encodeURIComponent decodeURIComponent").split(" "));

// ---- leitor de nomes livres, com escopo (função, bloco, catch, for), sem biblioteca extra ----
function names(p, out) { // nomes declarados por um padrão (const {a, b:[c]} = …)
  if (!p) return out;
  if (p.type === "Identifier") out.push(p.name);
  else if (p.type === "ObjectPattern") p.properties.forEach(x => names(x.type === "RestElement" ? x.argument : x.value, out));
  else if (p.type === "ArrayPattern") p.elements.forEach(x => names(x, out));
  else if (p.type === "RestElement") names(p.argument, out);
  else if (p.type === "AssignmentPattern") names(p.left, out);
  return out;
}
const isFn = n => n && /^(FunctionDeclaration|FunctionExpression|ArrowFunctionExpression)$/.test(n.type);
function varsOf(n, out) { // "var" de uma função (sobem até ela; não entram em funções de dentro)
  if (!n || typeof n.type !== "string" || isFn(n)) return out;
  if (n.type === "VariableDeclaration" && n.kind === "var") n.declarations.forEach(d => names(d.id, out));
  for (const k of Object.keys(n)) { const v = n[k]; if (Array.isArray(v)) v.forEach(x => varsOf(x, out)); else if (v && typeof v.type === "string") varsOf(v, out); }
  return out;
}
function lexOf(list, out) { // let/const/class/function declarados direto num bloco
  for (const s of list) {
    if (s.type === "VariableDeclaration" && s.kind !== "var") s.declarations.forEach(d => names(d.id, out));
    else if ((s.type === "ClassDeclaration" || s.type === "FunctionDeclaration") && s.id) out.push(s.id.name);
  }
  return out;
}
// O que o arquivo usa sem declarar no escopo onde usa: Map nome -> {lidas, escritas}
function livres(src) {
  const uso = new Map(), ast = parse(src);
  const nova = (pai, nomes) => ({ pai, v: new Set(nomes) });
  const acha = (S, n) => { for (let s = S; s; s = s.pai) if (s.v.has(n)) return true; return false; };
  const ref = (n, S, escrita) => { if (acha(S, n)) return; const u = uso.get(n) || { lidas: 0, escritas: 0 }; uso.set(n, u); escrita ? u.escritas++ : u.lidas++; };
  function pat(p, S, modo) { // modo "decl": só as expressões de dentro (valor padrão, chave calculada); "escrita": os nomes são reescritos
    if (!p) return;
    if (p.type === "Identifier") { if (modo === "escrita") ref(p.name, S, true); }
    else if (p.type === "ObjectPattern") p.properties.forEach(x => { if (x.type === "RestElement") pat(x.argument, S, modo); else { if (x.computed) vis(x.key, S); pat(x.value, S, modo); } });
    else if (p.type === "ArrayPattern") p.elements.forEach(x => pat(x, S, modo));
    else if (p.type === "RestElement") pat(p.argument, S, modo);
    else if (p.type === "AssignmentPattern") { pat(p.left, S, modo); vis(p.right, S); }
    else vis(p, S); // a.b = … dentro de um padrão
  }
  function corpo(lista, S) { lista.forEach(x => vis(x, S)); }
  function vis(n, S) {
    if (!n || typeof n.type !== "string") return;
    switch (n.type) {
      case "Identifier": return ref(n.name, S, false);
      case "MemberExpression": vis(n.object, S); if (n.computed) vis(n.property, S); return;
      case "Property": case "MethodDefinition": case "PropertyDefinition": if (n.computed) vis(n.key, S); vis(n.value, S); return;
      case "LabeledStatement": return vis(n.body, S);
      case "BreakStatement": case "ContinueStatement": case "MetaProperty": return;
      case "FunctionDeclaration": case "FunctionExpression": case "ArrowFunctionExpression": {
        const F = nova(S, [...n.params.flatMap(p => names(p, [])), ...varsOf(n.body, [])]);
        if (n.type === "FunctionExpression" && n.id) F.v.add(n.id.name);
        n.params.forEach(p => pat(p, F, "decl"));
        if (n.body.type === "BlockStatement") { lexOf(n.body.body, []).forEach(x => F.v.add(x)); corpo(n.body.body, F); } else vis(n.body, F);
        return; }
      case "ClassDeclaration": case "ClassExpression": { vis(n.superClass, S); const C = nova(S, n.id ? [n.id.name] : []); corpo(n.body.body, C); return; }
      case "BlockStatement": { const B = nova(S, lexOf(n.body, [])); corpo(n.body, B); return; }
      case "SwitchStatement": { vis(n.discriminant, S); const B = nova(S, lexOf(n.cases.flatMap(c => c.consequent), [])); n.cases.forEach(c => { vis(c.test, B); corpo(c.consequent, B); }); return; }
      case "CatchClause": { const B = nova(S, names(n.param, [])); pat(n.param, B, "decl"); vis(n.body, B); return; }
      case "ForStatement": case "ForInStatement": case "ForOfStatement": {
        const ini = n.type === "ForStatement" ? n.init : n.left, B = nova(S, ini && ini.type === "VariableDeclaration" && ini.kind !== "var" ? ini.declarations.flatMap(d => names(d.id, [])) : []);
        if (ini && ini.type === "VariableDeclaration") vis(ini, B); else if (n.type === "ForStatement") vis(ini, B); else pat(ini, B, "escrita");
        ["test", "update", "right", "body"].forEach(k => vis(n[k], B)); return; }
      case "VariableDeclaration": n.declarations.forEach(d => { pat(d.id, S, "decl"); vis(d.init, S); }); return;
      case "AssignmentExpression": pat(n.left, S, "escrita"); vis(n.right, S); return;
      case "UpdateExpression": if (n.argument.type === "Identifier") ref(n.argument.name, S, true); else vis(n.argument, S); return;
    }
    for (const k of Object.keys(n)) { const v = n[k]; if (Array.isArray(v)) v.forEach(x => vis(x, S)); else if (v && typeof v.type === "string") vis(v, S); }
  }
  const G = nova(null, [...lexOf(ast.body, []), ...varsOf(ast, [])]);
  corpo(ast.body, G);
  return uso;
}

// Declarações de topo do app: {nome: "function" | "let" | "const" | "var" | "class"}
function doApp() {
  const out = Object.create(null), base = path.join(ROOT, "src/app/js");
  const arquivos = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? arquivos(path.join(d, e.name)) : e.name.endsWith(".js") ? [path.join(d, e.name)] : []);
  for (const f of arquivos(base)) for (const s of parse(fs.readFileSync(f, "utf8")).body) {
    if (s.type === "FunctionDeclaration") out[s.id.name] = "function";
    else if (s.type === "ClassDeclaration") out[s.id.name] = "class";
    else if (s.type === "VariableDeclaration") s.declarations.forEach(d => names(d.id, []).forEach(x => out[x] = s.kind));
  }
  return out;
}

// Problemas do contrato (lista vazia = tudo certo). Separado para o teste conseguir provar que acusa uma quebra.
function confere(bridgeSrc, app) {
  const P = [], uso = livres(bridgeSrc);
  for (const [n, u] of uso) {
    if (NAVEGADOR.has(n)) continue;
    if (!Object.hasOwn(app, n)) { P.push(`bridge.js usa "${n}", que não existe no app (renomeado ou apagado?)`); continue; }
    if (u.escritas && app[n] !== "let" && app[n] !== "var") P.push(`bridge.js reescreve "${n}", mas no app ele é ${app[n]} (precisa ser let)`);
  }
  return { P, usados: [...uso.keys()].filter(n => Object.hasOwn(app, n)) };
}

const BRIDGE = rd("bridge.js"), APP = doApp();

test("contrato: todo nome do app que o bridge.js usa existe, e o que ele reescreve é let", () => {
  const { P, usados } = confere(BRIDGE, APP);
  assert.deepEqual(P, []);
  assert.ok(usados.length >= 70, `esperava ~78 nomes do app no bridge.js, achei ${usados.length}`);
  for (const n of ["state", "migrate", "buildBackup", "bankRestore", "facValid", "uiSanitize", "saveTopics"]) assert.ok(usados.includes(n), n);
});

test("contrato: o teste acusa nome renomeado, função sumida e constante reescrita", () => {
  const semRestore = { ...APP }; delete semRestore.bankRestore; // usado só dentro de "typeof bankRestore === 'function'"
  assert.match(confere(BRIDGE, semRestore).P.join("\n"), /"bankRestore", que não existe no app/);
  const renomeado = { ...APP }; delete renomeado.migrate; renomeado.migrar = "function";
  assert.match(confere(BRIDGE, renomeado).P.join("\n"), /"migrate", que não existe/);
  assert.match(confere(BRIDGE, { ...APP, state: "const" }).P.join("\n"), /reescreve "state", mas no app ele é const/);
  // o leitor de nomes livres: propriedades e nomes locais ficam de fora; nome local de UMA função não esconde o uso livre em outra
  const L = src => Object.fromEntries([...livres(src)].map(([n, u]) => [n, u.escritas ? "w" : "r"]));
  assert.deepEqual(L("(function(){ const a = 1; let o = { x: a, y }; o.z = q.w; function f(b){ return b + a; } })();"), { y: "r", q: "r" });
  assert.deepEqual(L("(function(){ function a(){ const esc = 1; return esc } esc('x'); try{}catch(hasData){hasData()} hasData() })();"), { esc: "r", hasData: "r" });
  // reescrita por desestruturação, for…of e ++ conta como escrita
  assert.deepEqual(L("[state] = x; ({ errors } = d); for (hist of L) {} n++; for (const k of z) k;"), { state: "w", x: "r", errors: "w", d: "r", hist: "w", L: "r", n: "w", z: "r" });
  // classe, campo de classe, nomes do Object.prototype, laço com let, switch
  assert.deepEqual(L("class A { x = 1; m(){ return toString } } for (let i = 0; i < 2; i++) i; switch (v) { case 1: let w = 2; w; }"), { toString: "r", v: "r" });
});

test("contrato: o que o app lê de window.__site e window.SITE_BATCH vem do bridge.js", () => {
  const appTxt = fs.readdirSync(path.join(ROOT, "src/app"), { recursive: true }).filter(f => /\.(js|html)$/.test(f)).map(f => rd(path.join("src/app", f))).join("\n");
  const pedidos = [...new Set([...appTxt.matchAll(/__site\??\.([A-Za-z_$][\w$]*)/g)].map(m => m[1]))];
  let obj = null; // window.__site = { … } no bridge.js, pela árvore (não por texto: membro com corpo não quebra a leitura)
  (function ach(n) { if (!n || typeof n.type !== "string" || obj) return;
    if (n.type === "AssignmentExpression" && n.left.type === "MemberExpression" && !n.left.computed && n.left.property.name === "__site" && n.right.type === "ObjectExpression") { obj = n.right; return; }
    for (const k of Object.keys(n)) { const v = n[k]; if (Array.isArray(v)) v.forEach(ach); else if (v && typeof v.type === "string") ach(v); } })(parse(BRIDGE));
  assert.ok(obj, "bridge.js não define window.__site");
  const tem = obj.properties.filter(p => p.type === "Property" && !p.computed).map(p => p.key.name || p.key.value);
  for (const n of pedidos) assert.ok(tem.includes(n), `o app usa __site.${n}, que o bridge.js não oferece`);
  if (/\bSITE_BATCH\b/.test(appTxt)) assert.match(BRIDGE, /window\.SITE_BATCH\s*=/);
});
