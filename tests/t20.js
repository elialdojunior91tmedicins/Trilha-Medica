const {chromium}=require('playwright');
const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
async function run(b,{date,days,items,label,expect,studied}){
  const ctx=await b.newContext({viewport:{width:400,height:1000}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  if(date)await p.clock.setFixedTime(new Date(date+"T10:00:00-03:00"));
  await p.goto('file://'+__dirname+'/../src/checklist-residencia.html');
  await p.evaluate(({days,items,studied})=>{localStorage.clear();const D=n=>fromNum(dnum(today())+n);
    localStorage.setItem("resid-fac-v1",JSON.stringify({sems:[{id:"s",name:"2026.2",archived:false}],discs:[{id:"d",semId:"s",name:"Cardio",items}],provas:[{id:"p",discId:"d",name:"P1",date:D(days),items,done:[]}],own:{a:{t:"Anatomia",discId:"d"}}}));
    if(studied){const st={};items.forEach(r=>{if(r.startsWith("T:"))st[r.slice(2)]={l:1,last:D(-1),step:0}});localStorage.setItem("resid-checklist-v2",JSON.stringify(st))}},{days,items,studied});
  await p.reload();await p.waitForTimeout(300);
  const reasons=await p.$$eval('#plan .reason',x=>x.map(e=>e.textContent));
  const n=reasons.filter(r=>r.startsWith("P1")).length;
  if(expect!==undefined)ok(n===expect,`${label}: ${n} vaga(s) da prova (${reasons.join(" | ")})`);
  const v=await p.$$eval('#revVesp .vcard',x=>x.map(e=>e.innerText.replace(/\n/g,' ')));
  await ctx.close();if(errs.length)console.log('ERR',errs);return v}
(async()=>{const b=await chromium.launch();
const low=["T:CM-12","O:a","T:CM-11"], high=["T:CM-6","T:CM-12","O:a"];
await run(b,{date:"2026-10-07",days:25,items:low,label:"25 dias",expect:0});
await run(b,{date:"2026-10-07",days:20,items:low,label:"20 dias, sem alta incidência",expect:1});
await run(b,{date:"2026-10-07",days:20,items:high,label:"20 dias, com alta incidência",expect:2});
await run(b,{date:"2026-10-07",days:12,items:low,label:"12 dias, sem alta incidência",expect:2});
await run(b,{date:"2026-10-07",days:12,items:high,label:"12 dias, com alta (quarta-feira, sem proteção)",expect:3});
await run(b,{date:"2026-10-10",days:12,items:high,label:"12 dias, com alta, sábado sem dia de residência na semana (proteção)",expect:2});
await run(b,{date:"2026-10-10",days:5,items:high,label:"5 dias, sábado (semana da prova: sem proteção)",expect:3});
const v=await run(b,{date:"2026-10-07",days:2,items:["T:CM-6","T:CM-12"],studied:true,label:"véspera"});
ok(v.length===1&&v[0].includes("Véspera: P1"),"revisão de véspera aparece: "+v[0]);
await b.close()})();
