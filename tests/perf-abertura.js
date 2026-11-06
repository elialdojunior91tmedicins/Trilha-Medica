// Mede a abertura do app num "celular comum" (não é teste; não entra na list.txt).
// CPU 4× mais lenta (Chrome DevTools, perfil de celular intermediário) e rede 4G (9 Mbps, 170 ms).
// Uso: node tests/perf-abertura.js [rodadas]   (precisa do servidor em http://localhost:8765/, como no run.sh)
const { chromium } = require("playwright"); const fs = require("fs");
const mock = fs.readFileSync(__dirname + "/mockdb.js", "utf8");
const N = Number(process.argv[2] || 5);
(async () => {
  const b = await chromium.launch(); const R = [];
  for (let i = 0; i < N; i++) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await ctx.route(/googleapis|gstatic|jsdelivr|cdnjs/, r => r.abort());
    await ctx.addInitScript(mock + ";window.__mock({},2);");
    const p = await ctx.newPage(); const cdp = await ctx.newCDPSession(p);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await cdp.send("Network.enable");
    if (process.env.NET !== "0") await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 170, downloadThroughput: 9e6 / 8, uploadThroughput: 1.5e6 / 8 });
    const t0 = Date.now();
    await p.goto("http://localhost:8765/tests/preview.html", { waitUntil: "load" });
    const load = Date.now() - t0;
    await p.waitForFunction(() => { const v = document.querySelector("#viewInicio,#iHero"); return v && v.offsetHeight > 0; }, null, { timeout: 60000 });
    const ready = Date.now() - t0;
    const m = await p.evaluate(() => { const n = performance.getEntriesByType("navigation")[0]; const fcp = performance.getEntriesByName("first-contentful-paint")[0];
      const lt = performance.getEntriesByType("longtask"); return { fcp: fcp ? Math.round(fcp.startTime) : null, dcl: Math.round(n.domContentLoadedEventEnd), bytes: n.transferSize }; });
    R.push({ load, ready, ...m }); await ctx.close();
  }
  const med = k => { const v = R.map(r => r[k]).filter(x => x != null).sort((a, b) => a - b); return v[Math.floor(v.length / 2)]; };
  console.log(JSON.stringify(R));
  console.log(`mediana de ${N}: 1ª pintura ${med("fcp")} ms · HTML interpretado ${med("dcl")} ms · Início na tela ${med("ready")} ms`);
  await b.close();
})();
