// B5: High Yield pelo banco (sugestões de peso e ★), conceito recorrente, ★ HY na anotação.
const test = require("node:test"), assert = require("node:assert/strict");
const load = require("./load");
const novo = () => load({ now: "2026-11-12T12:00:00" });
const Q = (txt, extra = {}) => ({ enunciado: "Caso " + txt, alternativas: [{ letra: "A", texto: "a " + txt }, { letra: "B", texto: "b " + txt }], correta: "A", ...extra });
let seq = 0;
const bq = (A, o) => A.bqClean({ id: "b" + (++seq).toString(36), h: "h", o: "oficial", ks: ["CM-1"], q: Q("q" + seq, o.q || {}), ...o, ...(o.q ? { q: Q("q" + seq, o.q) } : {}) });
const setBank = (A, L) => { A.bank = L; A.bankH = []; A.bqIdx(); A.crReset(); };

test("provas da base de 12 não contam de novo no peso (ENARE 2020–2024, Enamed 2025, Revalida 2021–2026)", () => {
  const A = novo();
  assert.ok(A.hyBase("ENARE", "2024")); assert.ok(A.hyBase("Revalida INEP", "2026")); assert.ok(A.hyBase("ENAMED", "2025"));
  assert.ok(!A.hyBase("ENARE", "2025")); assert.ok(!A.hyBase("USP", "2024")); assert.ok(!A.hyBase("ENAMED", "2026"));
});

test("provas-alvo do Perfil: sem alvo vale ENARE/ENAMED; com alvo, as palavras do nome (sem as genéricas)", () => {
  const A = novo();
  assert.deepEqual([...A.hyTargets()].sort(), ["enamed", "enare"]);
  A.ui.profile.exams = [{ id: "e1", name: "SUS-SP 2027 (prova de residência)" }];
  assert.deepEqual([...A.hyTargets()].sort(), ["enamed", "enare"], "nome só com palavras curtas ou genéricas: volta ao padrão");
  A.ui.profile.exams = [{ id: "e1", name: "Unifesp" }];
  assert.deepEqual([...A.hyTargets()], ["unifesp"]);
});

test("sem provas novas suficientes o banco não sugere peso, mas conta o que viu", () => {
  const A = novo();
  setBank(A, [bq(A, { ban: "ENARE", ano: "2025", ex: "e25", ks: ["CM-1"] }), bq(A, { ban: "ENARE", ano: "2024", ex: "e24", ks: ["CM-1"] })]);
  const C = A.hyCount();
  assert.equal(C.E.length, 2); assert.equal(C.newN, 1, "o ENARE 2024 já está na base");
  assert.equal(C.ready, false); assert.deepEqual([...A.hyWeightSugs(C)], []);
  assert.equal(C.t["CM-1"].n, 2); assert.equal(C.t["CM-1"].pv.size, 2);
});

test("com provas novas, um tema muito cobrado sobe de peso (só sugestão; a escolha do usuário nunca recebe sugestão)", () => {
  const A = novo();
  const low = A.ALL.find(it => it.w0 === 1 && !it.own);
  const L = [];
  ["p1", "p2", "p3"].forEach((ex, j) => { for (let i = 0; i < 60; i++) L.push(bq(A, { ban: "USP", ano: String(2015 + j), ex, ks: [low.key] })); });
  setBank(A, L);
  const S = A.hyWeightSugs();
  const s = S.find(x => x.k === low.key);
  assert.ok(s, "sugere mudar o tema pouco cobrado na base e muito no banco");
  assert.equal(s.from, 1); assert.equal(s.to, 3);
  A.upd(low.key, x => { x.w = 2 });
  assert.ok(!A.hyWeightSugs().some(x => x.k === low.key), "peso escolhido pelo usuário vence");
});

test("★ dos subtópicos: sugere os que mais caem e tira a ★ da estimativa que não caiu; marca do usuário não é tocada", () => {
  const A = novo();
  const it = A.BYKEY["CM-1"], Ls = A.subList(it), est = Ls.filter(x => x.hyc);
  const target = Ls.find(x => !x.hy), sk = A.sbKey(target);
  const L = [];
  for (let i = 0; i < 9; i++) L.push(bq(A, { ban: "ENARE", ano: "2025", ex: "e25", ks: ["CM-1"], sb: sk }));
  setBank(A, L);
  const G9 = A.hySubSug("CM-1");
  assert.ok(G9.on.some(x => A.sbKey(x) === sk) && G9.off.length === 0, "com 9 questões já sugere ligar, mas ainda não tira (precisa de 2 por subtópico)");
  for (let i = 0; i < 40; i++) L.push(bq(A, { ban: "ENARE", ano: "2025", ex: "e25", ks: ["CM-1"], sb: sk }));
  setBank(A, L);
  const G = A.hySubSug("CM-1");
  assert.ok(G, "tem sugestão");
  assert.ok(G.on.some(x => A.sbKey(x) === sk), "liga ★ no que caiu 9 vezes");
  assert.equal(G.off.length, est.length, "a estimativa que não caiu nenhuma vez pode sair");
  A.upd("CM-1", s => { s.hy = { [target.i]: "n" } });
  const G2 = A.hySubSug("CM-1");
  assert.ok(!G2 || !G2.on.some(x => A.sbKey(x) === sk), "o usuário tirou a ★: sem sugestão para ligar de novo");
});

test("poucas questões com subtópico (< HY_SB_MIN): nada de sugestão de ★", () => {
  const A = novo();
  const sk = A.sbKey(A.subList(A.BYKEY["CM-1"])[0]);
  setBank(A, [bq(A, { ex: "e1", ban: "ENARE", ano: "2025", sb: sk }), bq(A, { ex: "e1", ban: "ENARE", ano: "2025", sb: sk })]);
  assert.equal(A.hySubSug("CM-1"), null);
});

test("conceito recorrente: mesma chave do Claude em 2 provas = recorrente; na mesma prova, não", () => {
  const A = novo();
  const a = bq(A, { ex: "e1", ban: "ENARE", ano: "2025", cr: "ieca primeira linha diabetico" });
  const b = bq(A, { ex: "e1", ban: "ENARE", ano: "2025", cr: "ieca primeira linha diabetico" });
  setBank(A, [a, b]);
  assert.equal(A.crRec(a), 0, "mesma prova não conta");
  const c = bq(A, { ex: "e2", ban: "USP", ano: "2024", cr: "ieca primeira linha diabetico" });
  setBank(A, [a, b, c]);
  assert.equal(A.crRec(a), 2); assert.equal(A.crRec(c), 2);
  assert.equal(a.crs, "c", "veio do Claude");
});

test("sugestão de par pelo app: palavras do conceito em comum, provas diferentes, mesmo tema; confirmar dá a mesma chave", () => {
  const A = novo();
  const con = "Inibidores enzima conversora angiotensina reduzem progressao nefropatia diabetica albuminuria";
  const a = bq(A, { ex: "e1", ban: "ENARE", ano: "2025", q: { conceito: con } });
  const b = bq(A, { ex: "e2", ban: "USP", ano: "2024", q: { conceito: con + " persistente" } });
  const c = bq(A, { ex: "e3", ban: "USP", ano: "2023", ks: ["CM-2"], q: { conceito: con } });
  setBank(A, [a, b, c]);
  const S = A.crSuggest();
  assert.equal(S.length, 1, "só o par do mesmo tema");
  A.render = () => {};
  A.crConfirm(S[0]);
  assert.ok(a.cr && a.cr === b.cr); assert.equal(a.crs, "u"); assert.equal(A.crRec(a), 2);
  assert.equal(A.crSuggest().length, 0, "par confirmado sai da lista");
});

test("bqClean guarda a chave e de onde veio; a prova não apaga a confirmação do usuário", () => {
  const A = novo();
  const x = A.bqClean({ id: "bz", o: "oficial", ks: ["CM-1"], q: Q("z"), cr: "chave x", crs: "u" });
  assert.equal(x.cr, "chave x"); assert.equal(x.crs, "u");
  assert.equal(A.bqClean({ id: "by", o: "oficial", ks: [], q: Q("y"), cr: "k" }).crs, "c");
  assert.equal(A.bqClean({ id: "bw", o: "oficial", ks: [], q: Q("w") }).cr, undefined);
});

test("★ HY na anotação: estrela na leitura, item \"hy\" nas pegadinhas, sem confundir com pegadinha e destaque", () => {
  const A = novo();
  const h = A.md("★ IECA é primeira linha\n- ★ Metformina contraindicada se TFG < 30\n- item comum\n> Pegadinha: x");
  assert.match(h, /<p class="hyl"><b class="hys"[^>]*>★<\/b> IECA é primeira linha<\/p>/);
  assert.match(h, /<li class="hyl"><b class="hys"[^>]*>★<\/b> Metformina/);
  assert.ok(!/<li class="hyl">[^<]*item comum/.test(h));
  const P = A.pegParse("★ IECA é primeira linha\n- ★ Metformina contraindicada\n> Pegadinha: cuidado — Por quê: y\n==destaque==");
  assert.deepEqual([...P.map(o => o.kind)], ["hy", "hy", "peg", "dest"]);
  assert.equal(P[0].x, "IECA é primeira linha");
});
