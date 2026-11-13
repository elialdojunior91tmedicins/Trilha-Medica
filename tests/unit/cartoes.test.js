// Aba Cartões: histórico de cada revisão (x.rv), suspenso (x.su), contas da lista e dos Números.
// Desenho: docs/superpowers/specs/2026-11-13-aba-cartoes-design.md
const test = require("node:test"), assert = require("node:assert/strict");
const load = require("./load");
const HOJE = "2026-11-13";
const novo = () => { const A = load({ now: HOJE + "T12:00:00" }); A.render = () => {}; A.cdPut = () => {}; A.cards.length = 0; return A; };
const ago = (A, n) => A.fromNum(A.dnum(HOJE) - n);
const K = A => A.ALL[0].key;
const mk = (A, o = {}) => { const x = A.cdClean({ id: "c" + Math.random().toString(36).slice(2, 8), k: K(A), q: "Pergunta", a: "Resposta", src: "eu", ...o }); A.cards.push(x); return x; };
const rev = (A, o = {}) => mk(A, { due: ago(A, 1), f: { st: 2, s: 10, d: 5, last: ago(A, 11), reps: 3, lapses: 0, first: ago(A, 40) }, ...o });

test("cdClean mantém rv (até 30, só itens válidos) e su; cartão antigo sem os campos fica igual", () => {
  const A = novo();
  const rv = [...Array.from({ length: 33 }, (_, i) => ({ d: ago(A, 40 - i), g: 3, i: 4, r: 1 })), { d: "x", g: 3, i: 1 }, { d: HOJE, g: 7, i: 1 }];
  const x = A.cdClean({ id: "a", k: K(A), q: "q", a: "a", src: "eu", rv, su: 1 });
  assert.equal(x.su, 1);
  assert.equal(x.rv.length, 30);
  assert.equal(x.rv[29].d, ago(A, 8), "fica a mais nova no fim");
  assert.ok(x.rv.every(r => r.g >= 1 && r.g <= 4));
  const y = A.cdClean({ id: "b", k: K(A), q: "q", a: "a", src: "eu" });
  assert.equal(y.rv, undefined); assert.equal(y.su, undefined);
});

test("cdAnswer grava a revisão; r:1 só quando o cartão já estava em revisão; guarda 30", () => {
  const A = novo(), n = mk(A), r = rev(A);
  A.cdAnswer(n, 3);
  assert.equal(n.rv.length, 1); assert.equal(n.rv[0].d, HOJE); assert.equal(n.rv[0].g, 3); assert.equal(n.rv[0].r, undefined);
  A.cdAnswer(r, 2);
  assert.equal(r.rv[0].r, 1); assert.equal(typeof r.rv[0].i, "number");
  r.rv = Array.from({ length: 30 }, (_, i) => ({ d: ago(A, 60 - i), g: 3, i: 2 }));
  A.cdAnswer(r, 1);
  assert.equal(r.rv.length, 30); assert.equal(r.rv[29].g, 1);
});

test("treino extra não grava histórico", () => {
  const A = novo(), r = rev(A);
  A.cdRun = { ids: [r.id], i: 0, show: true, done: 0, g: { 1: 0, 2: 0, 3: 0, 4: 0 }, again: {}, extra: [r.id] };
  A.cdRate(r, 3);
  assert.equal(r.rv, undefined);
});

test("suspenso fica fora da revisão, da previsão, do Anki e não segura o erro", () => {
  const A = novo(), r = rev(A, { su: 1, eid: "e1" }), firm = rev(A, { su: 1, due: ago(A, -60) });
  assert.equal(A.cdDue().length, 0);
  assert.equal(A.cdForecast()[0].n, 0);
  assert.equal(A.cdReady().length, 0);
  assert.equal(A.eByCard({ id: "e1" }), false);
  assert.equal(A.cdLive(r), false);
  delete r.su; delete firm.su;
  assert.equal(A.cdDue().length, 1); assert.equal(A.cdReady().length, 1); assert.equal(A.eByCard({ id: "e1" }), true);
});

test("apkgCardRow: cartão novo vai como novo no Anki; em revisão, com intervalo", () => {
  const A = novo(), n = mk(A), r = rev(A, { due: ago(A, -50) });
  const sec = 1763000000, crt = 1762990000;
  const N = A.apkgCardRow(n, 1, 2, sec, crt, 7), R = A.apkgCardRow(r, 3, 4, sec, crt, 8);
  assert.equal(N[6], 0); assert.equal(N[7], 0); assert.equal(N[8], 7); assert.equal(N[9], 0);
  assert.equal(R[6], 2); assert.equal(R[7], 2); assert.ok(R[9] > 0);
});
