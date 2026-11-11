// Carrega a lógica do app no Node, sem navegador (fase 1.5, docs/adr/001-divisao-em-modulos.md).
// Lê os trechos de src/app/js/ (e das pastas de módulo) na ordem: declara todas as funções primeiro (como o navegador) e depois roda
// cada instrução de topo sozinha, protegida (constantes viram "var"). As que dependem da tela (desenhar,
// ouvir eventos) falham sem efeito e ficam listadas em __failed; dados montados no topo (ALL, BYKEY…) ficam prontos.
// Uso: const A = require("./load")();  A.fsNext(...), A.md("..."), A.state = {...}
const fs = require("fs"), path = require("path"), vm = require("vm");
const acorn = require("./vendor/acorn.js");
const JS = path.join(__dirname, "../../src/app/js");

function stubs(ctx) {
  const mem = new Map();
  ctx.localStorage = {
    getItem: k => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)),
    removeItem: k => mem.delete(k), clear: () => mem.clear(), key: i => [...mem.keys()][i] ?? null, get length() { return mem.size; },
  };
  ctx.sessionStorage = { getItem: () => null, setItem() {}, removeItem() {} };
  ctx.navigator = { userAgent: "node", maxTouchPoints: 0, onLine: true };
  ctx.matchMedia = () => ({ matches: false, addEventListener() {}, addListener() {} });
  ctx.addEventListener = () => {};
  ctx.requestAnimationFrame = () => 0; // sem tela: nada é redesenhado depois
  ctx.innerWidth = 1366; ctx.innerHeight = 768; ctx.screen = { width: 1366, height: 768 };
  ctx.location = { search: "", hash: "", href: "http://localhost/" };
  ctx.console = console; ctx.setTimeout = () => 0; ctx.clearTimeout = () => {}; // gravações com atraso não disparam
  ctx.setInterval = () => 0; ctx.clearInterval = () => {};
  ctx.TextEncoder = TextEncoder; ctx.TextDecoder = TextDecoder; ctx.URL = URL; ctx.crypto = globalThis.crypto;
  ctx.performance = { now: () => Date.now() };
  // "document" mínimo: o bastante para declarações que só consultam a página não quebrarem a carga
  const node = () => ({ style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    appendChild: x => x, append() {}, setAttribute() {}, getAttribute: () => null, addEventListener() {}, querySelector: () => null,
    querySelectorAll: () => [], children: [], textContent: "", innerHTML: "", value: "" });
  ctx.document = { documentElement: Object.assign(node(), { lang: "pt-BR" }), body: node(), head: node(),
    createElement: node, createTextNode: t => ({ textContent: t }), querySelector: () => null, querySelectorAll: () => [],
    getElementById: () => null, addEventListener() {}, visibilityState: "visible" };
  ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx;
}

const bootIIFE = n => n.type === "ExpressionStatement" && n.expression.type === "CallExpression" &&
  /^(ArrowFunctionExpression|FunctionExpression)$/.test(n.expression.callee.type) && n.expression.callee.async;

module.exports = function load(opts = {}) {
  const ctx = vm.createContext({});
  stubs(ctx);
  if (opts.now) { // relógio fixo: today() e new Date() sem argumentos devolvem este instante
    const NOW = new Date(opts.now).getTime();
    ctx.Date = class extends Date { constructor(...a) { if (a.length) super(...a); else super(NOW); } static now() { return NOW; } };
  }
  const ls = (rel = "") => fs.readdirSync(path.join(JS, rel), { withFileTypes: true }).flatMap(e => e.isDirectory() ? ls(rel + e.name + "/") : e.name.endsWith(".js") ? [rel + e.name] : []);
  const files = ls().sort(); // na ordem do build: arquivos soltos e pastas de módulo, por caminho
  const decls = [], steps = [];
  for (const f of files) {
    const src = fs.readFileSync(path.join(JS, f), "utf8");
    const ast = acorn.parse(src, { ecmaVersion: "latest", allowAwaitOutsideFunction: true, allowReturnOutsideFunction: true });
    for (const n of ast.body) {
      if (n.type === "FunctionDeclaration" || n.type === "ClassDeclaration") decls.push(src.slice(n.start, n.end));
      else if (n.type === "VariableDeclaration")
        for (const d of n.declarations) steps.push({ f, what: d.id.type === "Identifier" ? d.id.name : "(desestruturação)", code: "var " + src.slice(d.start, d.end) + ";" });
      else if (bootIIFE(n)) continue; // (async()=>{…})(): a carga da conta, que precisa do navegador
      else steps.push({ f, what: "instrução na linha " + (src.slice(0, n.start).split("\n").length), code: src.slice(n.start, n.end) });
    }
  }
  vm.runInContext(decls.join("\n"), ctx, { filename: "funcoes.js" });
  const failed = [];
  // instruções async (como a carga da conta) falham depois, fora do try: anotadas, não derrubam o teste
  const late = e => failed.push("(assíncrona) " + (e && e.message));
  process.on("unhandledRejection", late);
  for (const v of steps) {
    try { vm.runInContext(v.code, ctx, { filename: v.f }); }
    catch (e) { failed.push(v.what + " (" + v.f + "): " + e.message); }
  }
  ctx.__failed = failed;
  if (opts.verbose) console.log(`${decls.length} funções, ${steps.length} instruções de topo, ${failed.length} falharam`);
  return ctx;
};
