#!/usr/bin/env node
// Gera o mapa do código em mapa/ (fora do repositório). Uso, na raiz:  node tools/mapa/gerar.js
//   --se-preciso : só gera se algum arquivo mudou desde o último mapa   --check : só diz se o mapa está em dia (sai com 1 se não)
const fs = require("fs"), path = require("path");
const L = require("./lib.js"), OUT = path.join(L.ROOT, "mapa");
const arg = new Set(process.argv.slice(2));
const cur = () => { try { return JSON.parse(fs.readFileSync(path.join(OUT, "mapa.json"), "utf8")).stamp; } catch (e) { return ""; } };
if (arg.has("--check")) { const ok = cur() === L.stamp(); console.log(ok ? "mapa em dia" : "mapa desatualizado: node tools/mapa/gerar.js"); process.exit(ok ? 0 : 1); }
if (arg.has("--se-preciso") && cur() === L.stamp()) process.exit(0);

const M = L.build(), cut = L.cut;
fs.rmSync(path.join(OUT, "modulos"), { recursive: true, force: true }); fs.mkdirSync(path.join(OUT, "modulos"), { recursive: true });
const w = (f, s) => fs.writeFileSync(path.join(OUT, f), s);
const some = (a, n) => a.length > n ? a.slice(0, n).join(", ") + ` +${a.length - n}` : a.join(", ");
const loc = r => r.l === r.e ? `L${r.l}` : `L${r.l}–${r.e}`;
const sz = n => n >= 1024 ? (n / 1024).toFixed(1) + "K" : n + "b";
const where = k => { const r = M.sym[k]; return r ? `${k} (${r.f}:${r.l})` : k.replace(/^@/, "topo "); };
const modFile = short => short.replace(/\//g, "__").replace(/\.js$/, ".md");
const anonByFile = {}; M.anon.forEach(a => (anonByFile[a.f] = anonByFile[a.f] || []).push(a));
const symByFile = {}; for (const n in M.sym) (symByFile[M.sym[n].f] = symByFile[M.sym[n].f] || []).push(n);

/* ---- um arquivo por módulo ---- */
for (const F of M.files) {
  const items = (symByFile[F.short] || []).map(n => ({ n, ...M.sym[n] })).concat((anonByFile[F.short] || []).map(a => ({ n: "", ...a }))).sort((a, b) => a.l - b.l || a.e - b.e);
  let s = `# ${F.short}\n\n${F.lines} linhas · ${F.kb} KB · ${F.n} nomes no topo\n${F.head ? "\n> " + F.head + "\n" : ""}\n`;
  s += "Cada item: linhas · tipo nome(parâmetros) · tamanho — comentário do código. `usa` = nomes de outros lugares que ele lê ou chama; `muda` = globais que ele reatribui; `usado por` = quem o chama.\n\n";
  const secs = F.sections.slice(); let si = 0;
  for (const x of items) {
    while (si < secs.length && secs[si].l <= x.l) { s += `\n## L${secs[si].l} · ${cut(secs[si].t, 150)}\n\n`; si++; }
    const head = x.n ? `**${x.n}**${x.k === "fn" ? x.sig : ""}` : "(instrução do topo)";
    s += `- ${loc(x)} · ${x.k === "stmt" ? "topo" : x.k} ${head} · ${sz(x.sz)}${x.val ? " = `" + x.val.replace(/`/g, "'") + "`" : ""}${x.doc && !F.sections.some(q => q.t.slice(0, 40) === x.doc.slice(0, 40)) ? " — " + cut(x.doc, 200) : ""}\n`;
    const more = [];
    if (x.uses.length) more.push("usa: " + some(x.uses, 24));
    if (x.writes.length) more.push("muda: " + some(x.writes, 12));
    if (x.by && x.by.length) more.push("usado por: " + some(x.by.map(k => k.replace(/^@/, "topo ")), 14));
    if (x.idDef.length) more.push("cria #" + some(x.idDef, 14));
    if (x.idUse.length) more.push("procura #" + some(x.idUse, 14));
    if (x.ls.length) more.push("localStorage: " + x.ls.join(", "));
    if (x.prefs.length) more.push("ui.prefs: " + some(x.prefs.map(p => p + (x.prefsW.includes(p) ? "✎" : "")), 14));
    if (x.fs.length) more.push("conta: " + x.fs.join(", "));
    if (x.ev.length) more.push("eventos: " + x.ev.join(", "));
    if (x.help.length) more.push("Ajuda: " + x.help.join(", "));
    if (x.tests && x.tests.length) more.push("testes: " + some(x.tests, 12));
    if (x.cm && x.cm.length) more.push("CLAUDE.md L" + x.cm.join(", L"));
    if (x.dup) more.push("⚠ nome repetido, também em " + x.dup);
    if (more.length) s += "  " + more.join(" · ") + "\n";
  }
  w("modulos/" + modFile(F.short), s);
}

/* ---- índice ---- */
const top = F => (symByFile[F.short] || []).filter(n => M.sym[n].k === "fn").sort((a, b) => M.sym[b].by.length - M.sym[a].by.length).slice(0, 7);
let ix = `# Mapa do código — Nexus - Trilha Médica\n\nGerado por \`node tools/mapa/gerar.js\` em ${M.at.slice(0, 16).replace("T", " ")} UTC. **Não editar: é saída.** Os números de linha valem para os arquivos como estão agora.\n\n`;
ix += `${M.count.files} arquivos JS (${M.count.lines} linhas) · ${M.count.sym} nomes no topo (${M.count.fn} funções) · ${M.count.anon} instruções soltas · ${M.count.css} regras de CSS · ${M.count.ids} ids · ${M.count.cls} classes · ${M.count.ls} chaves do localStorage · ${M.count.prefs} preferências · ${M.count.tests} arquivos de teste.\n\n`;
ix += "## Como consultar\n\n- `node tools/mapa/onde.js <nome|#id|.classe|resid-chave|prefs.x|texto>` — onde está, quem usa, testes, linha do CLAUDE.md.\n- `node tools/mapa/onde.js --codigo <nome>` — o código exato daquele nome (sem abrir o arquivo inteiro).\n- `node tools/mapa/onde.js --testes <nome…>` e `--diff [base]` — que testes rodar depois de mexer.\n- `node tools/mapa/onde.js --arquivo <trecho do caminho>` — o resumo do módulo.\n- Arquivos: `modulos/*.md` (um por arquivo JS), `css.md`, `chaves.md`, `testes.md`, `fora-do-app.md`, `simbolos.tsv`, `ids.tsv`, `classes.tsv`, `mapa.json`.\n\n";
ix += "## Módulos, na ordem em que o app carrega\n\n| Arquivo | Linhas | KB | Nomes | O que tem | Mais usados |\n|---|--:|--:|--:|---|---|\n";
for (const F of M.files) ix += `| [${F.short}](modulos/${modFile(F.short)}) | ${F.lines} | ${F.kb} | ${F.n} | ${cut(F.head, 150).replace(/\|/g, "/")} | ${top(F).join(", ")} |\n`;
ix += `\n## Resto do app\n\n| Arquivo | Linhas | O que é |\n|---|--:|---|\n`;
for (const f in M.html) ix += `| ${f} | ${M.html[f].lines} | HTML fixo (${M.html[f].ids} ids) |\n`;
ix += `| ${M.css.file} | ${M.css.lines} | ${M.css.rules} regras; veja css.md |\n`;
for (const f in M.extra) ix += `| ${f} | ${M.extra[f].lines} | ${M.extra[f].items.length ? M.extra[f].items.length + " funções; veja fora-do-app.md" : "veja fora-do-app.md"} |\n`;
const hub = Object.keys(M.sym).filter(n => M.sym[n].k === "fn").sort((a, b) => M.sym[b].by.length - M.sym[a].by.length).slice(0, 40);
ix += `\n## As 40 funções mais usadas (mexer nelas afeta muita coisa)\n\n` + hub.map(n => `- ${n}${M.sym[n].sig} · ${M.sym[n].f}:${M.sym[n].l} · usada por ${M.sym[n].by.length}`).join("\n") + "\n";
const big = Object.keys(M.sym).filter(n => M.sym[n].k === "fn").sort((a, b) => M.sym[b].sz - M.sym[a].sz).slice(0, 25);
ix += `\n## As 25 funções maiores\n\n` + big.map(n => `- ${n} · ${M.sym[n].f}:${M.sym[n].l} · ${sz(M.sym[n].sz)}`).join("\n") + "\n";
const dead = Object.keys(M.sym).filter(n => M.sym[n].k === "fn" && !M.sym[n].by.length && !(M.sym[n].tests || []).length);
ix += `\n## Funções que ninguém chama pelo nome (${dead.length})\n\nPodem ser usadas só por texto (onclick em HTML montado) ou estar sem uso: conferir com \`grep\` antes de apagar.\n\n` + dead.map(n => `${n} (${M.sym[n].f}:${M.sym[n].l})`).join(", ") + "\n";
w("INDICE.md", ix);

/* ---- tabelas para grep ---- */
w("simbolos.tsv", "nome\ttipo\tarquivo\tlinha\tfim\tbytes\tusado_por\ttestes\n" + Object.keys(M.sym).sort().map(n => { const r = M.sym[n]; return [n, r.k, r.f, r.l, r.e, r.sz, r.by.length, (r.tests || []).length].join("\t"); }).join("\n") + "\n");
const idRow = k => { const e = M.ids[k]; return [k, (e.def || []).map(where).join("; "), (e.use || []).map(where).join("; "), (e.html || []).join("; "), (e.css || []).map(l => "L" + l).join(" "), (e.tests || []).join(" "), (e.extra || []).join(" ")].join("\t"); };
w("ids.tsv", "id\tcriado_em\tprocurado_em\thtml\tcss\ttestes\tfora_do_app\n" + Object.keys(M.ids).sort().map(idRow).join("\n") + "\n");
w("classes.tsv", "classe\tcss_linhas\tjs\thtml\n" + Object.keys(M.cls).sort().map(k => { const e = M.cls[k]; return [k, (e.css || []).map(l => "L" + l).join(" "), (e.js || []).map(where).join("; "), (e.html || []).join("; ")].join("\t"); }).join("\n") + "\n");

/* ---- chaves: localStorage, preferências, conta, ajuda ---- */
let ch = "# Chaves e dados guardados\n\n## localStorage\n\n";
for (const k of Object.keys(M.ls).sort()) ch += `- \`${k}\` — ${(M.ls[k].js || []).map(where).join("; ")}${M.ls[k].extra ? " · " + M.ls[k].extra.join(", ") : ""}\n`;
ch += "\n## Preferências (`ui.prefs.x`; ✎ = quem grava)\n\n";
for (const k of Object.keys(M.prefs).sort()) ch += `- \`${k}\` — ${(M.prefs[k].w || []).map(x => "✎ " + where(x)).concat((M.prefs[k].r || []).map(where)).join("; ")}\n`;
ch += "\n## Conta (Firestore): coleções (col), documentos (doc) e pacotes (pk)\n\n";
for (const k of Object.keys(M.fs).sort()) ch += `- \`${k}\` — ${(M.fs[k].js || []).map(where).join("; ")}\n`;
ch += "\n## Assuntos da Ajuda chamados pelo código\n\n";
for (const k of Object.keys(M.help).sort()) ch += `- "${k}" — ${(M.help[k].js || []).map(where).join("; ")}\n`;
w("chaves.md", ch);

/* ---- CSS ---- */
let cs = `# ${M.css.file}\n\n${M.css.lines} linhas · ${M.css.rules} regras. Classe → linhas: \`classes.tsv\` (ou \`onde.js .classe\`).\n\n## Seções (comentários do arquivo)\n\n`;
cs += M.css.sections.map(s => `- L${s.l} · ${s.t}`).join("\n") + "\n\n## Variáveis (onde são definidas · quantas vezes usadas)\n\n";
cs += Object.keys(M.css.vars).sort().map(v => `- \`${v}\` — ${M.css.vars[v].def.length ? "L" + L.uniq(M.css.vars[v].def).slice(0, 8).join(", L") : "definida fora do CSS (JS ou herdada)"} · ${M.css.vars[v].n}×`).join("\n");
cs += "\n\n## Atributos de layout usados nos seletores\n\n" + Object.keys(M.css.attrs).sort().map(a => `- \`[${a}]\` — ${M.css.attrs[a].length} regras, L${M.css.attrs[a].slice(0, 30).join(", L")}${M.css.attrs[a].length > 30 ? " …" : ""}`).join("\n");
cs += "\n\n## Regras dentro de @media / @container\n\n" + Object.keys(M.css.medias).sort().map(a => `- \`${cut(a, 120)}\` — L${M.css.medias[a].slice(0, 40).join(", L")}${M.css.medias[a].length > 40 ? " …" : ""}`).join("\n") + "\n";
w("css.md", cs);

/* ---- testes ---- */
let ts = "# Testes\n\n`tela` = abre o app no navegador (Playwright); `unit` = só a lógica, no Node; `apoio` = dados de exemplo, capturas, medições (não são testes).\n\n";
for (const kind of ["unit", "tela", "apoio"]) { ts += `\n## ${kind}\n\n`;
  for (const n of Object.keys(M.tests).filter(n => M.tests[n].kind === kind)) { const t = M.tests[n], rare = t.syms.filter(s => !M.common.includes(s));
    ts += `- **${n}**${kind === "tela" && !t.inList ? " (fora da list.txt)" : ""} · ${t.checks} conferências — ${cut(t.desc, 300) || "(sem descrição)"}\n  toca: ${some(rare, 40) || "—"}${t.ids.length ? " · ids: #" + some(t.ids, 25) : ""}\n`; } }
ts += `\n## Nomes que aparecem em mais da metade dos testes (não ajudam a escolher o teste)\n\n${M.common.join(", ")}\n`;
w("testes.md", ts);

/* ---- fora do app ---- */
let ex = "# Fora de src/app/\n\n";
for (const f in M.extra) { const E = M.extra[f]; ex += `\n## ${f} · ${E.lines} linhas · ${E.kb} KB\n\n`;
  if (E.sections && E.sections.length) ex += E.sections.slice(0, 12).map(s => `> L${s.l} · ${cut(s.t, 180)}`).join("\n") + "\n\n";
  ex += E.items.map(i => `- ${i.l === i.e ? "L" + i.l : "L" + i.l + "–" + i.e} · ${i.k} **${i.n}**${i.sig || ""}${i.doc ? " — " + cut(i.doc, 160) : ""}`).join("\n") + "\n";
  if (E.ls && E.ls.length) ex += `\nlocalStorage: ${E.ls.join(", ")}\n`; if (E.fs && E.fs.length) ex += `conta: ${E.fs.join(", ")}\n`; if (E.idDef && E.idDef.length) ex += `cria #${E.idDef.join(", #")}\n`; if (E.idUse && E.idUse.length) ex += `procura #${E.idUse.join(", #")}\n`; }
w("fora-do-app.md", ex);
w("mapa.json", JSON.stringify(M));
if (!arg.has("--quieto")) console.log(`mapa/ gerado: ${M.count.files} arquivos JS, ${M.count.sym} nomes, ${M.count.ids} ids, ${M.count.cls} classes, ${M.count.tests} arquivos de teste. Comece por mapa/INDICE.md`);
