// Dados e textos (src/app/js/010-dados/, fase 3 do ADR 001): conferem que os literais batem com os temas e com quem os usa.
const test = require("node:test"), assert = require("node:assert/strict");
const fs = require("fs"), path = require("path");
const load = require("./load");
const A = load({ now: "2026-11-12T12:00:00" });
const KEYS = new Set(A.ALL.map(it => it.key));
const SPS = new Set(A.ALL.map(it => it.sp));
const nSubs = k => A.BYKEY[k].subs.length;

test("temas: 198, chaves únicas, cada um com área, especialidade e subtópicos", () => {
  assert.equal(A.ALL.length, 198);
  assert.equal(KEYS.size, 198, "chave repetida");
  for (const it of A.ALL) {
    assert.ok(it.subs.length > 0, it.key + " sem subtópicos");
    assert.ok(it.key.startsWith(it.area.code + "-"), it.key + " fora da área " + it.area.code);
    assert.ok(it.sp, it.key + " sem especialidade");
  }
});

test("incidência: INC_DATA só com temas que existem", () => {
  for (const k of Object.keys(A.INC_DATA)) assert.ok(KEYS.has(k), "INC_DATA: tema inexistente " + k);
});

test("★ HY (HY_DEF): tema existe, índices válidos e sem repetir, dentro do teto (≤3 subtópicos: 1 · 4 a 6: 2 · 7+: um terço)", () => {
  for (const [k, L] of Object.entries(A.HY_DEF)) {
    assert.ok(KEYS.has(k), "HY_DEF: tema inexistente " + k);
    const n = nSubs(k);
    assert.equal(new Set(L).size, L.length, k + ": índice repetido");
    for (const i of L) assert.ok(Number.isInteger(i) && i >= 0 && i < n, `${k}: índice ${i} fora de 0..${n - 1}`);
    const teto = n <= 3 ? 1 : n <= 6 ? 2 : Math.ceil(n / 3);
    assert.ok(L.length <= teto, `${k}: ${L.length} ★ para ${n} subtópicos (teto ${teto})`);
  }
});

test("subtópicos densos (DN_DEF): tema existe e índices válidos", () => {
  for (const [k, L] of Object.entries(A.DN_DEF)) {
    assert.ok(KEYS.has(k), "DN_DEF: tema inexistente " + k);
    for (const i of L) assert.ok(Number.isInteger(i) && i >= 0 && i < nSubs(k), `${k}: índice ${i} fora`);
  }
});

test("eixo (AX_NEAR): só especialidades que existem, e nenhuma é vizinha de si mesma", () => {
  for (const [sp, L] of Object.entries(A.AX_NEAR)) {
    assert.ok(SPS.has(sp), "AX_NEAR: especialidade inexistente " + sp);
    for (const v of L) { assert.ok(SPS.has(v), `AX_NEAR[${sp}]: ${v} não existe`); assert.notEqual(v, sp); }
  }
});

test("catálogo do Perfil (EX_CAT): região conhecida, mês 0–12, nomes únicos", () => {
  const REG = new Set(A.EXC_REG.map(r => r[0]));
  const names = new Set();
  for (const c of A.EX_CAT) {
    assert.ok(REG.has(c.r), c.n + ": região " + c.r);
    assert.ok(Number.isInteger(c.m) && c.m >= 0 && c.m <= 12, c.n + ": mês " + c.m);
    assert.ok(c.n && !names.has(c.n), "nome vazio ou repetido: " + c.n); names.add(c.n);
  }
});

test("provas oficiais (OF_CAT): nível conhecido e nomes únicos", () => {
  const names = new Set();
  for (const [grupo, L] of A.OF_CAT) for (const [banca, ano, nome, niv] of L) {
    assert.ok(banca && /^\d{4}$/.test(ano), `${grupo}: ${nome} sem banca/ano`);
    assert.ok(A.OF_NIV.includes(niv), nome + ": nível " + niv);
    assert.ok(!names.has(nome), "repetida: " + nome); names.add(nome);
  }
});

test("Ajuda (HELP): 19 assuntos (Cartões desde 13/11/2026), títulos únicos, e todo helpBtn/goHelp do código aponta para um que existe", () => {
  const T = A.HELP.map(h => h[0]);
  assert.equal(T.length, 19);
  assert.equal(new Set(T).size, T.length, "título repetido");
  const ls = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? ls(path.join(d, e.name)) : e.name.endsWith(".js") ? [path.join(d, e.name)] : []);
  const used = new Set();
  for (const f of ls(path.join(__dirname, "../../src/app/js"))) for (const m of fs.readFileSync(f, "utf8").matchAll(/(?:helpBtn|goHelp)\("([^"]+)"\)/g)) used.add(m[1]);
  assert.ok(used.size >= 4, "achou poucos helpBtn: " + [...used]);
  for (const t of used) assert.ok(T.includes(t), "helpBtn/goHelp sem assunto na Ajuda: " + t);
});

test("instruções do gerador: as antigas viram a padrão; texto do usuário fica", () => {
  assert.equal(A.promptUp(A.DEFAULT_PROMPT), A.DEFAULT_PROMPT);
  assert.equal(A.promptUp(A.DEFAULT_PROMPT_1026A), A.DEFAULT_PROMPT, "a versão anterior (10/2026) troca pela nova");
  for (const o of A.OLD_PROMPTS) assert.equal(A.promptUp(o), A.DEFAULT_PROMPT);
  assert.ok(!A.OLD_PROMPTS.includes(A.DEFAULT_PROMPT), "a padrão atual não pode estar entre as antigas");
  assert.equal(A.promptUp("meu texto"), "meu texto");
});

test("frases da saudação: 60, sem repetir (HERO_FRASES[dnum % 60])", () => {
  assert.equal(A.HERO_FRASES.length, 60);
  assert.equal(new Set(A.HERO_FRASES).size, 60);
});
