// Cartões: FSRS-4.5 (fsNext, fsPreview) e a fila do dia (cdDue). Rode: node --test tests/unit/
const test = require("node:test"), assert = require("node:assert/strict");
const load = require("./load");
const HOJE = "2026-11-06";
const A = load({ now: HOJE + "T12:00:00" });
const novo = () => ({ f: { st: 0 } });
const dias = (x, n) => A.fromNum(A.dnum(HOJE) - n);

test("cartão novo: os 4 botões (foto do comportamento atual)", () => {
  const r = [1, 2, 3, 4].map(g => A.fsNext(novo(), g));
  assert.deepEqual(r.map(x => x.days), [0, 1, 4, 14]);
  assert.deepEqual(r.map(x => x.f.st), [1, 2, 2, 2]);       // Errei = aprendendo; os outros vão para revisão
  for (const x of r) { assert.equal(x.f.reps, 1); assert.equal(x.f.last, HOJE); assert.equal(x.f.first, HOJE); }
});

test("cartão em revisão: quanto melhor a resposta, mais longe a próxima", () => {
  const x = { f: { st: 2, s: 10, d: 5, last: dias(0, 10), reps: 3, lapses: 0, first: dias(0, 40) } };
  const d = [2, 3, 4].map(g => A.fsNext(x, g).days);
  assert.ok(d[0] < d[1] && d[1] < d[2], "Difícil < Bom < Fácil: " + d);
  assert.ok(d[1] > 10, "Bom depois de lembrar com 10 dias de estabilidade passa de 10 dias: " + d[1]);
});

test("Errei num cartão em revisão: volta hoje, conta um lapso, guarda a 1ª data", () => {
  const x = { f: { st: 2, s: 20, d: 5, last: dias(0, 20), reps: 5, lapses: 1, first: "2026-08-01" } };
  const r = A.fsNext(x, 1);
  assert.equal(r.days, 0); assert.equal(r.f.st, 3); assert.equal(r.f.lapses, 2); assert.equal(r.f.reps, 6);
  assert.equal(r.f.first, "2026-08-01");
  assert.ok(r.f.s < 20, "a estabilidade cai");
});

test("sequência Bom, Bom, Bom: intervalos crescem (foto do comportamento atual)", () => {
  // cada resposta é dada no dia em que o cartão vence
  let x = novo(), seq = [];
  const B = load({ now: HOJE + "T12:00:00" });
  for (let i = 0; i < 4; i++) {
    const r = B.fsNext(x, 3); seq.push(r.days);
    x = { f: { ...r.f, last: B.fromNum(B.dnum(HOJE) - r.days) } }; // finge que se passaram r.days dias até hoje
  }
  assert.deepEqual(seq, [4, 23, 109, 437]);
});

test("fsPreview: os botões nunca mostram Difícil > Bom nem Fácil ≤ Bom", () => {
  for (const s of [0.5, 2, 8, 30, 120]) for (const el of [0, 3, 30]) {
    const P = A.fsPreview({ f: { st: 2, s, d: 6, last: dias(0, el), reps: 2 } });
    assert.ok(P[1] <= P[2] && P[3] > P[2], `s=${s} el=${el}: ${P}`);
  }
});

test("cdDue: vencidos primeiro e novos até o limite do dia", () => {
  const B = load({ now: HOJE + "T12:00:00" });
  const k = B.ALL[0].key, mk = (id, due, st, extra = {}) => ({ id, k, q: "p", a: "r", due, src: "eu", box: 0, n: 0, ok: 0, f: { st, s: st ? 5 : 0, d: 5, last: "", reps: 0, lapses: 0, first: "" }, ...extra });
  B.cards = [mk("v1", "2026-11-01", 2), mk("v2", HOJE, 2), mk("fut", "2026-11-20", 2), mk("rasc", "2026-11-01", 2, { dr: 1 }),
    ...Array.from({ length: 20 }, (_, i) => mk("n" + i, HOJE, 0))];
  B.ui.prefs.cdNew = 5;
  const ids = B.cdDue().map(x => x.id);
  assert.deepEqual([...ids.slice(0, 2)], ["v1", "v2"], "vencidos primeiro, o mais antigo antes");
  assert.ok(!ids.includes("fut") && !ids.includes("rasc"), "futuro e rascunho ficam fora");
  assert.equal(ids.filter(i => i.startsWith("n")).length, 5, "novos até o limite");
});
