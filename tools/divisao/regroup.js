// node regroup.js <tags.txt> <pasta js> > plano.txt : monta o plano do mover a partir das marcações por módulo
// Cada módulo vira um arquivo NNN-modulo.js (de 10 em 10, na ordem de "modulos:"); dentro dele, os trechos ficam na ordem original.
const fs = require("fs"), path = require("path");
const [tagF, dir] = process.argv.slice(2);
const files = fs.readdirSync(dir).filter(f => f.endsWith(".js")).sort();
const byPre = Object.fromEntries(files.map(f => [f.slice(0, 3), f]));
let mods = null; const tags = {};
for (const raw of fs.readFileSync(tagF, "utf8").split("\n")) {
  const l = raw.replace(/#.*$/, "").trim(); if (!l) continue;
  if (l.startsWith("modulos:")) { mods = l.slice(8).trim().split(/\s+/); continue; }
  const [p, line, m] = l.split(/\s+/); if (!byPre[p]) throw new Error("arquivo? " + p); if (!mods.includes(m)) throw new Error("módulo? " + m);
  (tags[byPre[p]] = tags[byPre[p]] || []).push({ a: +line, m });
}
const groups = [...new Set(mods.map(m => m.split("/")[0]))];
const num = i => String((i + 1) * 10).padStart(3, "0");
const name = m => { const [g, s] = m.split("/"); const gi = num(groups.indexOf(g)) + "-" + g; if (!s) return gi + ".js";
  const subs = mods.filter(x => x.startsWith(g + "/")); return gi + "/" + num(subs.indexOf(m)) + "-" + s + ".js"; };
const segs = {}; mods.forEach(m => segs[m] = []);
for (const f of files) {
  const T = (tags[f] || []).sort((x, y) => x.a - y.a); if (!T.length || T[0].a !== 1) throw new Error("sem marcação na linha 1: " + f);
  const n = fs.readFileSync(path.join(dir, f), "utf8").split("\n").length - 1;
  T.forEach((t, i) => { const b = i + 1 < T.length ? T[i + 1].a - 1 : n; if (b >= t.a) segs[t.m].push(`${f}:${t.a}-${b}`); });
}
// os nomes novos não podem coincidir com arquivos atuais fora do plano (todos entram no plano)
for (const m of mods) { if (!segs[m].length) continue; console.log("> " + name(m)); segs[m].forEach(s => console.log(s)); }
