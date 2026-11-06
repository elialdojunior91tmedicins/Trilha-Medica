// t150: tempo de abertura — o topo grava cada abertura (resid-perf) e Configurações mostra, copia e apaga
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],note:[1366,768,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob});await ctx.route(/googleapis|gstatic/,r=>r.abort());
  await ctx.addInitScript(mock+";window.__mock({},2);");const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));
  await p.goto('http://localhost:8765/tests/preview.html');await p.waitForFunction(()=>(JSON.parse(localStorage.getItem("resid-perf")||"[]")).length>=1,null,{timeout:15000});
  await p.reload();await p.waitForFunction(()=>(JSON.parse(localStorage.getItem("resid-perf")||"[]")).length>=2,null,{timeout:15000});
  const L=await p.evaluate(()=>JSON.parse(localStorage.getItem("resid-perf")));
  ok(L.length===2&&L.every(r=>r.ok>0&&r.ok<30000&&"sw" in r&&"app" in r),name+": cada abertura é gravada com o tempo até o Início ("+L.map(r=>r.ok).join(", ")+" ms)");
  await p.evaluate(()=>{const L=[];for(let i=0;i<15;i++)L.push({at:Date.now()-i*1e5,ok:900,fcp:300,dcl:700,sw:i%2,app:0,kb:0});localStorage.setItem("resid-perf",JSON.stringify(L.slice(0,12)));goSub("config")});
  await p.waitForTimeout(300);
  ok(await p.evaluate(()=>!!document.querySelector('#perfCard')),name+": cartão Tempo de abertura em Configurações");
  await p.evaluate(()=>document.querySelector('#perfCard').open=true);
  ok(await p.evaluate(()=>document.querySelectorAll('#perfCard .perflist li').length===12&&/do aparelho/.test(document.querySelector('#perfCard').textContent)&&/da internet/.test(document.querySelector('#perfCard').textContent)),name+": lista as 12 últimas, separando aparelho × internet");
  await p.click('#perfClear');await p.waitForTimeout(200);
  ok(await p.evaluate(()=>!localStorage.getItem("resid-perf")&&/Ainda sem medidas/.test(document.querySelector('#perfCard').textContent)),name+": Apagar limpa as medidas");
  await ctx.close()}
ok(errs.length===0,"sem erros na página "+errs.join(" | "));await b.close()})();
