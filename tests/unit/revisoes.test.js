// Revisões: histórico de cada revisão (s.rv), retenção e recuperação do atraso.
// Desenho: docs/superpowers/specs/2026-11-13-revisoes-historico-e-recuperacao-design.md
const test = require("node:test"), assert = require("node:assert/strict");
const load = require("./load");
const HOJE = "2026-11-13";
const novo = () => { const A = load({ now: HOJE + "T12:00:00" }); A.commit = () => {}; A.render = () => {}; A.persist = () => {}; return A; };
const daysAgo = (A, n) => A.fromNum(A.dnum(HOJE) - n);

test("revLate: atraso contra a data original, mesmo com ajuste de data; sem estudo = null", () => {
  const A = novo(), k = "CM-1", I1 = A.INT[1];
  A.state[k] = { l: 1, last: daysAgo(A, I1 + 5), step: 1 };
  assert.equal(A.revLate(A.get(k), HOJE), 5);
  A.state[k] = { ...A.state[k], adj: 10, adjFrom: A.state[k].last };
  assert.equal(A.revLate(A.get(k), HOJE), 5, "o ajuste não esconde o atraso");
  assert.equal(A.revLate({}, HOJE), null);
});

test("reviewTopic grava cada revisão no fim de s.rv (40 no máximo), marca a automática e apaga s.rc", () => {
  const A = novo(), k = "CM-1";
  A.state[k] = { l: 1, last: daysAgo(A, 30), step: 1, rc: { d: daysAgo(A, 2), o: null } };
  A.reviewTopic(k, 2);
  const s = A.get(k);
  assert.equal(s.rv.length, 1);
  assert.deepEqual(Object.keys(s.rv[0]).sort(), ["d", "g", "i", "l"]);
  assert.equal(s.rv[0].d, HOJE); assert.equal(s.rv[0].g, 2); assert.equal(s.rv[0].l, 30 - A.INT[1]);
  assert.equal(s.rc, undefined, "a recuperação daquele tema acaba ao revisar");
  for (let i = 0; i < 44; i++) { A.state[k] = { ...A.get(k), last: daysAgo(A, 3) }; A.reviewTopic(k, i % 3); }
  assert.equal(A.get(k).rv.length, A.REV_HIST_MAX); assert.equal(A.REV_HIST_MAX, 40);
  assert.equal(A.get(k).rv[39].g, 43 % 3, "a mais nova fica no fim");
  A.state[k] = { ...A.get(k), last: daysAgo(A, 3) }; A.reviewTopic(k, 2, { auto: true, quiet: true, acc: 80 });
  assert.equal(A.get(k).rv[39].a, 1);
});

test("revStats: no prazo = até 1 dia de atraso; lembrou = Lembrei", () => {
  const A = novo();
  const r = A.revStats([{ d: HOJE, g: 2, l: 0 }, { d: HOJE, g: 0, l: 5 }, { d: HOJE, g: 2, l: 1 }, { d: HOJE, g: 1, l: 9 }]);
  assert.equal(r.n, 4); assert.equal(r.g2, 2); assert.equal(r.g1, 1); assert.equal(r.g0, 1);
  assert.deepEqual({ ...r.ok }, { n: 2, g2: 2 }); assert.deepEqual({ ...r.late }, { n: 2, g2: 0 });
  assert.equal(A.revStats([{ d: "2026-10-01", g: 2, l: 0 }, { d: HOJE, g: 2, l: 0 }], "2026-11-01", HOJE).n, 1, "filtra pelo período");
});

test("topicRevs junta as revisões da Residência e da Faculdade", () => {
  const A = novo();
  A.state["CM-1"] = { last: HOJE, rv: [{ d: HOJE, g: 2, l: 0, i: 3 }] };
  A.FAC_ITEMS.push({ key: "F-teste", t: "Conteúdo da faculdade" });
  A.state["F-teste"] = { last: HOJE, rv: [{ d: HOJE, g: 1, l: 2, i: 7 }] };
  const L = A.topicRevs();
  assert.ok(L.some(x => x.k === "CM-1" && x.g === 2) && L.some(x => x.k === "F-teste" && x.g === 1));
});
