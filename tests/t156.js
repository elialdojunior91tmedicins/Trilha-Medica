// t156: segurança do que é colado ou importado (17/11/2026). Põe texto com HTML que tentaria rodar código (<img onerror>, <svg onload>,
// link javascript:) em todo tipo de dado (erros, cartões, caderno livre, provas importadas, banco, refazer, foco, perfil, faculdade, etiquetas,
// anotações) e passa por todas as abas e partes. Falha se algum trecho rodar, se houver erro de página ou se poucos textos aparecerem na tela
// (a sonda deixou de cobrir as telas). Celular 390 e computador 1366.
const T = __dirname + '/';
const { chromium } = require('playwright');
const fs = require('fs');
const mock = fs.readFileSync(T + 'mockdb.js', 'utf8');
const S = require(T + 'seed10.js');
const ok = (c, m) => console.log((c ? "OK   " : "FALHA") + " " + m);
(async () => {
  const b = await chromium.launch();
  for (const [w, h, mob] of [[390, 844, true], [1366, 768, false]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: mob, isMobile: mob });
    await ctx.route(/googleapis|gstatic|jsdelivr|cdnjs/, r => r.abort());
    await ctx.addInitScript(mock + ";window.__mock({},2);window.__qLegacy=false;window.__hits=new Set();window.__x=t=>window.__hits.add(t);");
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8765/tests/preview.html');
    await p.waitForFunction(() => typeof render === "function" && document.querySelector('#iHero') && document.querySelector('#iHero').firstChild, null, { timeout: 15000 });
    await p.evaluate(`(${S.toString()})()`); await p.evaluate(`(${S.fac.toString()})()`);
    const n = await p.evaluate(() => {
      let c = 0;
      const pay = tag => `<img src=x onerror="__x('${tag}')"><svg onload="__x('${tag}s')">"'>`;
      const skip = /^(\d{4}-\d\d-\d\d|[A-Za-z]{1,4}[-:]?[\w-]{0,12}|\d+|#[0-9a-f]+|https?:.*)$/;
      const walk = (o, path, depth) => {
        if (!o || typeof o !== "object" || depth > 8) return;
        for (const k of Object.keys(o)) {
          const v = o[k];
          if (typeof v === "string" && v.length > 2 && !skip.test(v) && /[\sà-úA-Z]/.test(v) && !/^(id|key|ref|d|s|m|kind|type|tp|area|sid|did)$/.test(k)) { o[k] = v + pay(path + "." + k); c++ }
          else if (typeof v === "object") walk(v, path + "." + k, depth + 1)
        }
      };
      const P = t => `Texto ${t} <img src=x onerror="__x('${t}')"><svg onload="__x('${t}s')">"'><a href="javascript:__x('${t}j')">l</a>`;
      const K = ALL[0].key, K2 = ALL[3].key;
      const alt = ["A", "B", "C", "D"].map(l => ({ letra: l, texto: P("alt" + l) }));
      const Q = tag => ({ enunciado: P(tag + "-enun"), alternativas: alt, correta: "A", comentario: P(tag + "-com"), conceito: P(tag + "-conc"), alerta: P(tag + "-alerta"), fonte: P(tag + "-fonte"), link: "javascript:__x('" + tag + "-link')" });
      const tryi = (n, f) => { try { f() } catch (e) { (window.__seedErr = window.__seedErr || []).push("criar " + n + ": " + e.message) } };
      tryi("erro", () => { const e = eNew(K, P("err-w"), P("err-r"), "conhecimento", P("err-s"), "", P("err-p"), { pc: P("err-pc"), dd: P("err-dd"), qf: { e: P("err-qe"), a: [{ l: "A", t: P("err-qa") }], c: "A", m: P("err-qm") } }); e.ra = { regra: P("ra-regra"), dados: [P("ra-dados")], passos: [P("ra-passos")], naoSua: P("ra-nao"), src: "app", at: new Date().toISOString() }; e.due = today() });
      tryi("cartao", () => { cdAdd(K, P("card-q"), P("card-a"), "manual") });
      tryi("livre", () => { freeN.push(frClean({ id: "fr1", t: P("free-t"), b: P("free-b") + "\n\n[x](javascript:__x('freejs'))", tags: [P("free-tag")], ks: [K], at: new Date().toISOString() })) });
      tryi("prova", () => { const ex = exClean({ id: "ex1", name: P("exam-name"), banca: P("exam-banca"), ano: "2024", at: new Date().toISOString(), links: [], qs: [{ n: 1, k: K, g: "b", q: Q("examq") }] }); exams.push(ex) });
      tryi("banco", () => { const x = bqFrom(Q("bank"), "manual", [K]); if (x) bank.push(x); bqIdx() });
      tryi("refazer", () => { redo.push(rdClean({ id: "rd1", k: K, d: today(), n: 1, due: today(), q: Q("redo") })) });
      tryi("foco", () => { foSess.push({ id: "fx", d: today(), s: "10:00", sec: 1800, m: "p", ref: "", lab: P("focus-lab") }) });
      tryi("perfil", () => { ui.profile.name = P("prof-name"); ui.profile.exams.push({ id: "x2", name: P("prof-exam"), date: "2027-10-10" }) });
      tryi("fac", () => { fac.sems[0].name = P("fac-sem"); fac.discs[0].name = P("fac-disc"); fac.discs[0].info = { tipo: P("fac-tipo"), prof: P("fac-prof"), ementa: P("fac-ementa") }; for (const o of Object.values(fac.own)) o.t = P("fac-own") });
      tryi("tema", () => { upd(K2, s => { s.tg = [P("tag")]; return s }) });
      try { notes[ALL[0].key] = "# Título\n\nTexto **forte** [link](https://a.com/\"onmouseover=__x('mdlink')) <b onmouseover=x>\n- item" } catch (e) { }
      const G = { state, errors, notes, fac, foSess, hist, ui };
      for (const v of ["cards", "freeN", "redo", "exams", "sims", "bank"]) try { G[v] = eval(v) } catch (e) { }
      for (const [nm, o] of Object.entries(G)) walk(o, nm, 0);
      for (const k of Object.keys(notes)) if (typeof notes[k] === "string") { notes[k] += `\n\n<img src=x onerror="__x('note')"> [x](javascript:__x('jslink'))`; c++ }
      try { commit() } catch (e) { } try { render() } catch (e) { }
      return c
    });
    const seen = new Set(); const visit = async (fn, arg) => { try { await p.evaluate(fn, arg); await p.waitForTimeout(80); (await p.evaluate(() => [...document.body.innerText.matchAll(/Texto ([\w-]+) <img/g)].map(m => m[1]))).forEach(t => seen.add(t)) } catch (e) { errs.push(e.message) } };
    for (const v of ["inicio", "temas", "fac", "quest", "cartoes", "notas", "stats", "foco", "erros", "mais"]) await visit(v => setView(v), v);
    for (const q of ["banco", "sim", "redo", "provas", "resumo"]) await visit(q => { setView("quest"); qGo(q) }, q);
    for (const s of ["livre", "revisar", "pegadinhas"]) await visit(s => { setView("notas"); typeof setNSeg === "function" ? setNSeg(s) : (nSeg = s, render()) }, s);
    for (const s of ["perfil", "config"]) await visit(s => goSub(s), s);
    for (let i = 0; i < 8; i++) await visit(i => { setView("temas"); openKey = Object.keys(state)[i] || ALL[i].key; render() }, i);
    await visit(() => { setView("temas"); openKey = ALL[0].key; render() });
    await p.evaluate(() => document.querySelectorAll('[onmouseover]').forEach(e => e.dispatchEvent(new MouseEvent('mouseover'))));
    await p.evaluate(() => document.querySelectorAll('a[href^="javascript"]').forEach(a => __x('JSHREF')));
    const hits = await p.evaluate(() => [...__hits]); errs.push(...await p.evaluate(() => window.__seedErr || [])); 
    const lab = w + "px";
    ok(hits.length === 0, `${lab}: nenhum dos ${n} textos com HTML rodou código${hits.length ? " → rodou: " + hits.join(" | ") : ""}`);
    ok(errs.length === 0, `${lab}: sem erro de página${errs.length ? " → " + [...new Set(errs)].slice(0, 3).join(" | ") : ""}`);
    ok(seen.size >= 14, `${lab}: ${seen.size} tipos de texto apareceram na tela como texto (mínimo 14)`);
    await ctx.close()
  }
  await b.close()
})();
