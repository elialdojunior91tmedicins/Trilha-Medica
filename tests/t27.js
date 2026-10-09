const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync('mockdb.js','utf8');
const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
(async()=>{const b=await chromium.launch();
const dev=async(seed)=>{const ctx=await b.newContext();await ctx.route(/googleapis|gstatic/,r=>r.abort());
  await ctx.addInitScript(mock+`;localStorage.clear();window.__mock(${JSON.stringify(seed)},20);`);
  const p=await ctx.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));
  await p.goto('file://'+__dirname+'/../src/checklist-residencia.html');await p.waitForFunction(()=>typeof saveFac==='function');
  await p.waitForFunction(()=>/conta/.test(document.body.innerText),null,{timeout:8000}).catch(()=>{});await p.waitForTimeout(600);return p};
const plan=p=>p.evaluate(()=>dayPlan.items.map(x=>x.k+":"+x.cls));
for(const withTopics of [true,false]){
  console.log(withTopics?"— conta com progresso":"— conta nova (só faculdade)");
  const A=await dev({});
  if(withTopics)await A.evaluate(()=>{const it=BYKEY["CM-1"];toggleSub(it,subList(it)[0])});
  await A.evaluate(()=>{fac={sems:[{id:"s",name:"S",archived:false}],discs:[{id:"d",semId:"s",name:"Cardio",items:["T:CM-12","T:CM-6"]}],provas:[],own:{}};saveFac();
    const pr={id:"p",discId:"d",name:"P1",date:fromNum(dnum(today())+3),items:["T:CM-12","T:CM-6"],done:[]};fac.provas.push(pr);saveFac();provaChanged(pr,"nova prova")});
  await A.waitForTimeout(1500);const pa=await plan(A);const store=await A.evaluate(()=>window.__store);
  const B=await dev(store);const pb=await plan(B);
  console.log(" A:",pa.join(", "),"\n B:",pb.join(", "));
  ok(await B.evaluate(()=>fac.provas.length===1),"aparelho B recebe a prova");
  ok(JSON.stringify(pa)===JSON.stringify(pb),"aparelho B abre com o mesmo plano do dia");
  ok(!A.errs.length&&!B.errs.length,"sem erros JS "+[...A.errs,...B.errs].join("|"));
  // B aberto sem plano salvo de hoje (ex.: A nunca salvou o plano): deve incluir a prova
  const st2={...store};for(const k in st2)if(k.endsWith("/progress")&&st2[k].plan)delete st2[k].plan;
  const C=await dev(st2);ok((await plan(C)).some(x=>x.endsWith("r-fac")),"aparelho sem plano salvo monta o plano já com a prova ("+(await plan(C)).join(", ")+")");
}
await b.close()})();
