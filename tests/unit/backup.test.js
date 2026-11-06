// Backup e migração: um backup antigo (tests/backup-sample.json) passa pelas mesmas limpezas da carga do app
// (registerOwn → migrate, errOk, facNormalize, uiSanitize, cdClean) e volta igual no buildBackup.
const test = require("node:test"), assert = require("node:assert/strict");
const load = require("./load");
const SAMPLE = require("../backup-sample.json");
const plain = x => JSON.parse(JSON.stringify(x));
const novo = () => load({ now: "2026-11-06T12:00:00" });

function restaura(A, D) { // a mesma ordem da carga: faculdade antes dos temas (F-<id> só existe depois do registerOwn)
  const d = plain(D);
  if (A.facValid(d.fac)) { A.fac = d.fac; A.facNormalize(); }
  A.registerOwn();
  A.state = A.migrate(d.topics);
  A.errors = (d.errors || []).filter(A.errOk);
  A.hist = d.hist || {}; A.notes = d.notes || {}; A.noteAt = d.noteAt || {};
  if (typeof d.prompt === "string") A.promptText = A.promptUp(d.prompt);
  return d;
}

test("backup de exemplo: formato reconhecido", () => {
  const A = novo();
  assert.equal(SAMPLE.app, A.BACKUP_APP);
  assert.equal(SAMPLE.format, A.BACKUP_FORMAT);
});

test("backup de exemplo: temas, faculdade, erros e anotações sobrevivem à carga", () => {
  const A = novo(); restaura(A, SAMPLE.data);
  assert.deepEqual(Object.keys(A.state).sort(), ["CM-1", "F-a"], "tema da residência e tema próprio da faculdade");
  const s = A.state["CM-1"];
  assert.equal(s.l, 2); assert.equal(s.last, "2026-10-05"); assert.equal(s.step, 1);
  assert.deepEqual(plain(s.cs), [{ t: "Meu sub", d: true }], "subtópico próprio mantido");
  assert.deepEqual(plain(s.qd), { "2026-10-05": [10, 7] }, "questões antigas sem dia são estimadas no dia do estudo");
  assert.equal(A.errors.length, 1);
  assert.equal(A.fac.discs[0].name, "Cardio");
  assert.ok(Array.isArray(A.fac.discs[0].sps), "disciplina antiga ganha a lista de SPs");
});

test("ordem importa: sem a faculdade carregada antes, o progresso do tema próprio (F-a) se perderia", () => {
  const A = novo();
  assert.equal(A.migrate(plain(SAMPLE.data.topics))["F-a"], undefined);
});

test("ida e volta: o que foi carregado sai igual no backup novo", () => {
  const A = novo(); restaura(A, SAMPLE.data);
  const B = plain(A.buildBackup());
  assert.equal(B.app, A.BACKUP_APP); assert.equal(B.format, A.BACKUP_FORMAT);
  assert.deepEqual(B.data.topics, plain(A.state));
  assert.deepEqual(B.data.errors.map(e => e.id), ["e1"]);
  assert.deepEqual(B.data.fac.discs.map(d => d.name), ["Cardio"]);
  // e um segundo ciclo não muda mais nada (a migração é estável)
  const C = novo(); restaura(C, B.data);
  assert.deepEqual(plain(C.state), plain(A.state));
});

test("migrate: formatos antigos e lixo", () => {
  const A = novo();
  const r = plain(A.migrate({ "CM-1": 3, "XX-999": { l: 1 }, "CM-2": { l: 1, last: "2026-10-01", step: 0 } }));
  assert.equal(r["CM-1"].l, 3, "nível como número (formato v1) vira objeto");
  assert.equal(r["XX-999"], undefined, "tema que não existe é descartado");
  assert.equal(r["CM-2"].last, "2026-10-01");
});

test("errOk: erro sem tema ou sem id sai; campos de texto viram texto", () => {
  const A = novo();
  assert.equal(A.errOk({ id: "x", k: "NAO-EXISTE", w: "a", r: "b" }), false);
  assert.equal(A.errOk({ k: "CM-1", w: "a", r: "b" }), false);
  const e = { id: "e2", k: "CM-1", w: 12, r: null, s: undefined };
  assert.equal(A.errOk(e), true);
  assert.equal(typeof e.w, "string"); assert.equal(e.r, ""); assert.equal(e.s, "");
});

test("uiSanitize: preferências estragadas voltam ao padrão; meta antiga vira lista de provas", () => {
  const A = novo();
  const u = plain(A.uiSanitize({ prefs: { planN: "muitos", theme: 7, ints: "nada" }, profile: { goal: "ENARE", goalDate: "2027-09-10" } }));
  assert.equal(u.prefs.planN, A.UI_DEF.prefs.planN);
  assert.equal(u.prefs.theme, A.UI_DEF.prefs.theme);
  assert.equal(u.prefs.ints, A.UI_DEF.prefs.ints);
  assert.deepEqual(u.profile.exams, [{ id: "ex0", name: "ENARE", date: "2027-09-10" }]);
  assert.equal(u.profile.mainEx, "ex0");
  assert.deepEqual(plain(A.uiSanitize(null)).prefs, plain(A.UI_DEF.prefs), "sem preferências = padrão");
});

test("cdClean: cartão antigo (caixas de Leitner) entra no FSRS sem perder a data", () => {
  const A = novo();
  const c = plain(A.cdClean({ id: "c1", k: "CM-1", q: "p", a: "r", box: 2, n: 3, due: "2026-11-10" }));
  assert.equal(c.due, "2026-11-10");
  assert.deepEqual(c.f, { st: 2, s: A.CD_INT[2], d: 5, last: A.fromNum(A.dnum("2026-11-10") - A.CD_INT[2]), reps: 3, lapses: 0, first: "" });
  const z = plain(A.cdClean({ id: "c2", k: "CM-1", q: "p", a: "r" }));
  assert.equal(z.f.st, 0, "sem histórico = cartão novo");
  assert.equal(plain(A.cdClean({ id: "c3", k: "CM-1", q: "x".repeat(5000), a: "r" })).q.length, 1500, "pergunta longa é cortada");
});
