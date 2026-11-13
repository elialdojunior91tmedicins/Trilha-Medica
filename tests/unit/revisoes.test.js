// Revisões: histórico de cada revisão (s.rv), retenção e recuperação do atraso.
// Desenho: docs/superpowers/specs/2026-11-13-revisoes-historico-e-recuperacao-design.md
const test = require("node:test"), assert = require("node:assert/strict");
const load = require("./load");
const HOJE = "2026-11-13";
// a abertura simulada pelo load já roda um render (e marca "conferido hoje" com os temas ainda vazios): o teste começa sem a marca
const novo = () => { const A = load({ now: HOJE + "T12:00:00" }); A.commit = () => {}; A.render = () => {}; A.persist = () => {}; A.localStorage.removeItem("resid-recchk"); A.synced = true; A.uiLoaded = true; return A; };
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
  // 44 revisões antigas, em dias diferentes, + a de hoje: ficam as 40 mais novas, a de hoje no fim
  A.state[k] = { ...A.get(k), last: daysAgo(A, 3), rv: Array.from({ length: 44 }, (_, i) => ({ d: daysAgo(A, 100 - i), g: 1, l: 0, i: 3 })) };
  A.reviewTopic(k, 0);
  assert.equal(A.get(k).rv.length, A.REV_HIST_MAX); assert.equal(A.REV_HIST_MAX, 40);
  assert.equal(A.get(k).rv[39].d, HOJE); assert.equal(A.get(k).rv[39].g, 0, "a mais nova fica no fim");
  assert.equal(A.get(k).rv[0].d, daysAgo(A, 100 - 5), "as mais antigas saem");
  A.state[k] = { ...A.get(k), last: daysAgo(A, 3), rv: [] }; A.reviewTopic(k, 2, { auto: true, quiet: true, acc: 80 });
  assert.equal(A.get(k).rv[0].a, 1);
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

/* ---------- recuperação do atraso ---------- */
const atrasar = (A, n, o = {}) => { const ks = A.ALL.filter(it => !it.own).slice(0, n).map(it => it.key);
  ks.forEach((k, i) => { A.state[k] = { l: 1, last: daysAgo(A, (o.ago || 40) + (i % 5)), step: o.step == null ? 1 : o.step }; }); return ks; };

test("recPlan: até o limite por dia, sem folga, o mais esquecido (peso × atraso ÷ intervalo) primeiro", () => {
  const A = novo(), D = Array(14).fill(0), offs = new Set([2]);
  const items = Array.from({ length: 20 }, (_, i) => ({ k: "k" + i, w: 2, late: 10, iv: 30 }));
  items[7] = { k: "k7", w: 3, late: 40, iv: 3 };
  const P = A.recPlan(items, D, 3, offs);
  assert.equal(Object.keys(P.asg).length, 20); assert.equal(P.over, 0); assert.equal(P.cap, 3);
  const per = Array(14).fill(0); Object.values(P.asg).forEach(d => per[d]++);
  assert.ok(per.every(n => n <= 3)); assert.equal(per[2], 0, "nada no dia de folga");
  assert.equal(P.asg.k7, 0, "o mais esquecido vai para hoje");
});

test("recPlan: sobe o limite até +2; se nem assim couber, o resto vai para o último dia (over)", () => {
  const A = novo(), D = Array(14).fill(0), mk = n => Array.from({ length: n }, (_, i) => ({ k: "k" + i, w: 2, late: 5 + i, iv: 7 }));
  const P = A.recPlan(mk(60), D, 3, new Set());
  assert.equal(P.cap, 5); assert.equal(P.over, 0); assert.equal(Object.keys(P.asg).length, 60);
  const Q = A.recPlan(mk(200), D, 3, new Set());
  assert.equal(Q.cap, 5); assert.ok(Q.over > 0); assert.equal(Q.last, 13);
  assert.equal(Object.values(Q.asg).filter(d => d === 13).length, 5 + Q.over);
});

test("recApply: cada tema vence no dia marcado, guarda o ajuste anterior; o atraso verdadeiro não muda", () => {
  const A = novo(), ks = atrasar(A, 30), T = HOJE;
  const k0 = ks[0]; A.state[k0] = { ...A.state[k0], adj: 2, adjFrom: A.state[k0].last };
  const late0 = A.revLate(A.get(k0), T);
  const R = A.recApply(T);
  assert.equal(R.n, 30);
  ks.forEach(k => { const s = A.get(k); assert.ok(s.rc && s.rc.d === T, k); assert.ok(A.dueIn(s) >= 0 && A.dueIn(s) <= 13, k + " dueIn " + A.dueIn(s)); });
  assert.deepEqual([...A.get(k0).rc.o], [2, A.get(k0).last]);
  assert.equal(A.revLate(A.get(k0), T), late0);
  assert.equal(A.ui.prefs.rec.n, 30); assert.equal(A.ui.prefs.rec.d, T);
  assert.equal(A.recActive().length, 30);
  assert.ok(A.recOrig(A.get(ks[1])) < T, "data original no passado");
});

test("recUndo devolve exatamente o ajuste de antes e tira a recuperação", () => {
  const A = novo(), ks = atrasar(A, 30), k0 = ks[0], last = A.state[k0].last;
  A.state[k0] = { ...A.state[k0], adj: 2, adjFrom: last };
  A.recApply(HOJE); A.recUndo();
  assert.equal(A.get(k0).adj, 2); assert.equal(A.get(k0).adjFrom, last); assert.equal(A.get(k0).rc, undefined);
  assert.equal(A.get(ks[1]).adj, undefined); assert.ok(A.dueIn(A.get(ks[1])) < 0, "volta a ser atrasada");
  assert.equal(A.recActive().length, 0); assert.equal(A.ui.prefs.rec, undefined);
});

test("recCheck: atraso pequeno não dispara; grande dispara uma vez por dia; não em modo provas, folga ou com recuperação ativa", () => {
  let A = novo(); atrasar(A, 5); assert.equal(A.recCheck(), false);
  A = novo(); atrasar(A, 30); assert.equal(A.recCheck(), true); assert.equal(A.recActive().length, 30);
  assert.equal(A.recCheck(), false, "segunda vez no mesmo dia");
  A = novo(); atrasar(A, 30); A.examCrunch = () => ({ active: true }); assert.equal(A.recCheck(), false, "modo provas");
  A = novo(); atrasar(A, 30); A.ui.prefs.wday = [180, 180, 180, 180, 180, 0, 180]; assert.equal(A.recCheck(), false, "hoje (sexta) é folga");
});

test("revBrake: com recuperação ativa, 1 tema novo por dia", () => {
  const A = novo(); atrasar(A, 30); A.recApply(HOJE);
  assert.equal(A.revBrake().cap, 1);
});

test("recPull traz para hoje as próximas da recuperação", () => {
  const A = novo(); atrasar(A, 30); A.recApply(HOJE); A.goRevs = () => {};
  const hoje0 = A.recActive().filter(k => A.dueIn(A.get(k)) === 0).length;
  A.recPull(3);
  assert.equal(A.recActive().filter(k => A.dueIn(A.get(k)) === 0).length, hoje0 + 3);
});

test("uiSanitize guarda prefs.rec válido e descarta o inválido", () => {
  const A = novo();
  assert.deepEqual({ ...A.uiSanitize({ prefs: { rec: { d: HOJE, n: 30, until: "2026-11-25", ov: 0 } } }).prefs.rec }, { d: HOJE, n: 30, until: "2026-11-25", ov: 0 });
  assert.equal(A.uiSanitize({ prefs: { rec: { d: "x", n: "y" } } }).prefs.rec, undefined);
});

test("recCheck espera os dados carregados (synced) para não marcar o dia com os temas ainda vazios", () => {
  const A = novo(); atrasar(A, 30); A.synced = false;
  assert.equal(A.recCheck(), false); assert.equal(A.lsGet("resid-recchk", ""), "", "não marcou o dia");
  A.synced = true; assert.equal(A.recCheck(), true);
});

/* ---------- achados da revisão final (13/11/2026) ---------- */
test("recCheck espera as preferências da conta carregarem (uiLoaded) e não marca as preferências como mexidas antes disso", () => {
  const A = novo(); atrasar(A, 30); A.uiLoaded = false; A.uiTouched = false; A.ui.prefs.rec = { d: "2026-11-01", n: 3, until: "2026-11-10", ov: 0 };
  assert.equal(A.recCheck(), false); assert.equal(A.uiTouched, false, "não pode gravar por cima das preferências da conta");
  A.uiLoaded = true; assert.equal(A.recCheck(), true);
});

test("Desfazer vale para os outros aparelhos no mesmo dia (marca sincronizada nas preferências)", () => {
  const A = novo(); atrasar(A, 30); A.recApply(HOJE); A.recUndo();
  assert.equal(A.ui.prefs.recNo, HOJE);
  A.localStorage.removeItem("resid-recchk"); // outro aparelho: sem a marca local
  assert.equal(A.recCheck(), false);
  assert.equal(A.uiSanitize({ prefs: { recNo: HOJE } }).prefs.recNo, HOJE);
});

test("tema que mudou de data por outro caminho (subtópico, nível) perde a marca da recuperação", () => {
  const A = novo(), [k] = atrasar(A, 30); A.recApply(HOJE);
  assert.ok(A.get(k).rc);
  A.upd(k, x => { x.last = HOJE; x.step = 0; });
  assert.equal(A.get(k).rc, undefined);
});

test("duas revisões do mesmo tema no mesmo dia contam uma vez (vale a última)", () => {
  const A = novo(), k = "CM-1";
  A.state[k] = { l: 1, last: daysAgo(A, 20), step: 1 };
  A.reviewTopic(k, 0); A.reviewTopic(k, 2);
  assert.equal(A.get(k).rv.length, 1); assert.equal(A.get(k).rv[0].g, 2);
});
