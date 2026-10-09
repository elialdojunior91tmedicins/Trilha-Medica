const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync('mockdb.js','utf8');
const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
(async()=>{const b=await chromium.launch();const ctx=await b.newContext();await ctx.addInitScript(mock+`;localStorage.clear();window.__mock(JSON.parse(sessionStorage.st||"{}"),5);addEventListener("beforeunload",()=>sessionStorage.st=JSON.stringify(window.__store))`);
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await ctx.route(/googleapis|gstatic/,r=>r.abort());
await p.goto('file://'+__dirname+'/../src/checklist-residencia.html');await p.waitForFunction(()=>typeof saveFac==='function');await p.waitForTimeout(500);
await p.evaluate(()=>{fac.sems=[{id:"s",name:"S",archived:false}];fac.crunch={mode:"on",until:fromNum(dnum(today())+5)};saveFac()});await p.waitForTimeout(1200);
await p.reload();await p.waitForFunction(()=>typeof saveFac==='function');await p.waitForTimeout(800);
ok(await p.evaluate(()=>fac.crunch&&fac.crunch.mode==="on"&&examCrunch().active),"modo provas manual sobrevive vindo da conta (outro aparelho)");
ok(!errs.length,"sem erros JS "+errs.join("|"));await b.close()})();
