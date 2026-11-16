// Cobertura real (16/11/2026): carregado antes de um teste (node -r ./cobertura/gancho.js tNN.js) pelo tests/run.sh --cobertura.
// Liga a cobertura de JavaScript do Chromium em cada página que o teste abre e, ao fechar, grava quais funções do topo do app
// (e do bridge.js) rodaram pelo menos uma vez: tests/cobertura/saida/<teste>.json. O teste em si não muda.
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const acorn = require("../unit/vendor/acorn.js");
const pw = require("playwright");
const OUT = path.join(__dirname, "saida"), TESTE = path.basename(process.argv[1] || "x", ".js");
fs.mkdirSync(OUT, { recursive: true });

const parsed = new Map(); // hash da fonte -> {qual, fns:[{n,a,b}]}
function topo(src) { // funções do topo: function f(){} e const f = () => … / function(){}
  let ast; try { ast = acorn.parse(src, { ecmaVersion: 2022, sourceType: "script" }); } catch (e) { return null; }
  const fns = [];
  for (const s of ast.body) {
    if (s.type === "FunctionDeclaration") fns.push({ n: s.id.name, a: s.start, b: s.end });
    else if (s.type === "VariableDeclaration") for (const d of s.declarations)
      if (d.id.type === "Identifier" && d.init && /^(ArrowFunctionExpression|FunctionExpression)$/.test(d.init.type)) fns.push({ n: d.id.name, a: d.init.start, b: d.init.end });
  }
  return fns;
}
function qual(url, src) {
  if (/bridge\.js/.test(url)) return "bridge";
  if (/function render\(/.test(src) && /function migrate\(/.test(src)) return "app";
  return null;
}
const ran = { app: new Set(), bridge: new Set() }, all = { app: new Set(), bridge: new Set() };
const falta = {}; // função do app -> {len, iv:[[a,b]…]} trechos (relativos ao início da função) que não rodaram em nenhuma página deste teste
function junta(n, len, iv) { // interseção: o trecho só "não rodou" se não rodou em nenhuma página
  const o = falta[n]; if (!o) { falta[n] = { len, iv }; return; } if (o.len !== len) return;
  const r = []; let i = 0, j = 0; while (i < o.iv.length && j < iv.length) { const a = Math.max(o.iv[i][0], iv[j][0]), b = Math.min(o.iv[i][1], iv[j][1]); if (a < b) r.push([a, b]); o.iv[i][1] < iv[j][1] ? i++ : j++; }
  o.iv = r;
}
function absorve(entries) {
  for (const e of entries) {
    if (!e.source) continue;
    const q = qual(e.url, e.source); if (!q) continue;
    if (q === "bridge") { // funções dentro da função que embrulha o arquivo: pelo nome
      for (const f of e.functions) if (f.functionName) { all.bridge.add(f.functionName); if (f.ranges[0] && f.ranges[0].count) ran.bridge.add(f.functionName); }
      continue; }
    const h = crypto.createHash("sha1").update(e.source).digest("hex");
    if (!parsed.has(h)) parsed.set(h, topo(e.source) || []);
    const fns = parsed.get(h), byStart = new Map(fns.map(f => [f.a, f]));
    fns.forEach(f => all[q].add(f.n));
    for (const f of e.functions) { const r = f.ranges[0]; if (!r || !r.count) continue; const t = byStart.get(r.startOffset); if (t) ran[q].add(t.n); }
    // trechos: só com a faixa do script inteiro (sem ela, a medição é de um documento que já foi trocado por uma recarga: o V8 devolve
    // só pedaços, e o resto pareceria "rodou")
    if (!e.functions.some(f => f.ranges.some(r => r.startOffset === 0 && r.endOffset >= e.source.length))) continue;
    // trechos: o mais interno vale (ordem: começo crescente, fim decrescente; os de dentro sobrescrevem)
    const R = []; e.functions.forEach(f => f.ranges.forEach(r => R.push(r))); R.sort((x, y) => x.startOffset - y.startOffset || y.endOffset - x.endOffset);
    const cov = new Uint8Array(e.source.length); for (const r of R) cov.fill(r.count ? 2 : 1, r.startOffset, Math.min(r.endOffset, cov.length));
    for (const f of fns) { const iv = []; let st = -1;
      for (let i = f.a; i <= f.b; i++) { const z = i < f.b && cov[i] === 1; if (z && st < 0) st = i; else if (!z && st >= 0) { iv.push([st - f.a, i - f.a]); st = -1; } }
      junta(f.n, f.b - f.a, iv); }
  }
}
const vivas = new Map(); // página -> promessa do início da cobertura
async function para(p) { if (!vivas.has(p)) return; const ini = vivas.get(p); vivas.delete(p); try { await ini; absorve(await p.coverage.stopJSCoverage()); } catch (e) {} }
async function paraTodas() { await Promise.all([...vivas.keys()].map(para)); }
function grava() {
  const o = { teste: TESTE, app: [...ran.app].sort(), bridge: [...ran.bridge].sort(), bridgeAll: [...all.bridge].sort(), total: { app: all.app.size, bridge: all.bridge.size }, falta };
  try { fs.writeFileSync(path.join(OUT, TESTE + ".json"), JSON.stringify(o)); } catch (e) {}
}
function segue(p) { // começa a cobertura (uma vez por página) e para antes de a página fechar ou trocar de endereço
  if (!vivas.has(p)) vivas.set(p, p.coverage.startJSCoverage({ resetOnNavigation: false }).catch(() => vivas.delete(p)));
  if (!p.__cob) { p.__cob = 1;
    const c = p.close.bind(p); p.close = async (...a) => { await para(p); return c(...a); };
    // recarga e navegação: o V8 descarta o documento anterior; guarda a medição dele antes e recomeça
    for (const m of ["goto", "reload", "goBack", "goForward", "setContent"]) { const o = p[m].bind(p); p[m] = async (...a) => { await para(p); await segue(p); return o(...a); }; } }
  return vivas.get(p);
}
const ligados = new WeakSet();
function liga(ctx) {
  if (ligados.has(ctx)) return ctx; ligados.add(ctx);
  ctx.on("page", segue); // páginas abertas pelo próprio app (janelas)
  const nova = ctx.newPage.bind(ctx); ctx.newPage = async (...a) => { const p = await nova(...a); await segue(p); return p; };
  const fecha = ctx.close.bind(ctx); ctx.close = async (...a) => { await Promise.all(ctx.pages().map(para)); grava(); return fecha(...a); };
  return ctx;
}
const lanca = pw.chromium.launch.bind(pw.chromium);
pw.chromium.launch = async (...a) => {
  const b = await lanca(...a);
  const nc = b.newContext.bind(b); b.newContext = async (...x) => liga(await nc(...x));
  const np = b.newPage.bind(b); b.newPage = async (...x) => { const p = await np(...x); liga(p.context()); await segue(p); return p; };
  const fb = b.close.bind(b); b.close = async (...x) => { await paraTodas(); grava(); return fb(...x); };
  return b;
};
process.on("exit", grava);
