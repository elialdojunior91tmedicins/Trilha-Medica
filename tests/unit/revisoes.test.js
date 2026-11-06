// Revisões dos temas: intervalo (INT × acerto), data da próxima (dueIn), ajuste manual (s.adj) e os 3 botões.
const test = require("node:test"), assert = require("node:assert/strict");
const load = require("./load");
const HOJE = "2026-11-06";
const novo = () => load({ now: HOJE + "T12:00:00" });
const antes = (A, n) => A.fromNum(A.dnum(HOJE) - n);

test("intervalos padrão: 1 · 3 · 7 · 15 · 30 · 60 · 90 dias por degrau", () => {
  const A = novo();
  assert.deepEqual([...A.INT], [1, 3, 7, 15, 30, 60, 90]);
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 9].map(step => A.interval({ step, last: HOJE })), [1, 3, 7, 15, 30, 60, 90, 90]);
});

test("dueIn: dias até a próxima revisão a partir da última", () => {
  const A = novo();
  assert.equal(A.dueIn({}), null, "tema sem estudo não tem revisão");
  assert.equal(A.dueIn({ last: antes(A, 5), step: 2 }), 2, "7 dias depois de 5 dias atrás = daqui a 2");
  assert.equal(A.dueIn({ last: antes(A, 10), step: 2 }), -3, "atrasada 3 dias");
});

test("ajuste manual (s.adj) só vale para a revisão em que foi feito", () => {
  const A = novo(), last = antes(A, 5);
  assert.equal(A.dueIn({ last, step: 2, adj: 3, adjFrom: last }), 5, "adiada 3 dias");
  assert.equal(A.dueIn({ last, step: 2, adj: 3, adjFrom: antes(A, 20) }), 2, "ajuste de uma revisão antiga é ignorado");
});

test("acerto alto nas questões alonga o intervalo; acerto baixo não encurta", () => {
  const A = novo(), d = antes(A, 3);
  const com = (q, c) => ({ step: 2, last: HOJE, qt: q, qc: c, qd: { [d]: [q, c] } });
  assert.equal(A.interval(com(10, 9)), Math.round(7 * 1.4), "≥85% com 8+ questões: ×1,4");
  assert.equal(A.interval(com(10, 8)), Math.round(7 * 1.2), "≥75%: ×1,2");
  assert.equal(A.interval(com(10, 3)), 7, "acerto baixo não encurta (vira ponto fraco)");
  assert.equal(A.interval({ ...com(10, 9), step: 0 }), 1, "no 1º degrau o acerto não mexe");
  // com 5+ questões nos últimos 90 dias, só elas contam; com menos, vale o total acumulado
  const rec = { step: 2, last: HOJE, qt: 20, qc: 13, qd: { [antes(A, 120)]: [10, 10], [d]: [10, 3] } };
  assert.equal(A.interval(rec), 7, "as antigas (10/10) não salvam o acerto recente baixo (3/10)");
  const pouco = { step: 2, last: HOJE, qt: 12, qc: 11, qd: { [antes(A, 120)]: [10, 9], [d]: [2, 2] } };
  assert.equal(A.interval(pouco), Math.round(7 * 1.4), "menos de 5 recentes: usa o total (11/12)");
  A.ui.prefs.adapt = false;
  assert.equal(A.interval(com(10, 9)), 7, "preferência desligada");
});

test("botões da revisão: Esqueci volta 2 degraus, Difícil fica, Lembrei sobe", () => {
  const A = novo(), s = { step: 3, last: antes(A, 15) };
  assert.equal(A.revNext(s, 0), 1);
  assert.equal(A.revNext({ step: 1 }, 0), 0, "nunca abaixo de zero");
  assert.equal(A.revNext(s, 1), 3);
  assert.equal(A.revNext(s, 2), 4);
  assert.equal(A.revNext({ step: 6, last: antes(A, 90) }, 2), 6, "último degrau não passa do fim");
  assert.equal(A.revPreview(s, 2), 30, "a prévia do Lembrei mostra o intervalo do degrau seguinte");
});

test("dia de folga: revisão que cairia na folga passa para o próximo dia de estudo", () => {
  const A = novo();
  const wd = new Date(HOJE + "T12:00:00").getDay(), amanha = (wd + 1) % 7;
  const m = [60, 60, 60, 60, 60, 60, 60]; m[amanha] = 0;
  A.ui.prefs.wday = m; A.HAS_OFF = true; // o applyUI() faria isso ao ler as preferências
  assert.equal(A.dueIn({ last: HOJE, step: 0 }), 2, "cairia amanhã (folga): vai para depois de amanhã");
  assert.equal(A.dueIn({ last: antes(A, 1), step: 1 }), 2, "dia sem folga no caminho não muda");
});
