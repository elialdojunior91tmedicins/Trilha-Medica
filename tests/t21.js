const {chromium}=require('playwright');
const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
async function run(b,label,dates,expectCrunch){
  const ctx=await b.newContext({viewport:{width:400,height:1000}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+__dirname+'/../src/checklist-residencia.html');
  await p.evaluate(dates=>{localStorage.clear();const D=n=>fromNum(dnum(today())+n);
    const discs=[{id:"d1",semId:"s",name:"Cardio",items:["T:CM-12","O:a"]},{id:"d2",semId:"s",name:"Gineco",items:["T:GO-25"]},{id:"d3",semId:"s",name:"Pedia",items:["T:PED-31","T:PED-32"]}];
    const provas=dates.map((n,i)=>({id:"p"+i,discId:"d"+(i+1),name:"P"+(i+1)+" "+discs[i].name,date:D(n),items:discs[i].items,done:[]}));
    localStorage.setItem("resid-fac-v1",JSON.stringify({sems:[{id:"s",name:"2026.2",archived:false}],discs,provas,own:{a:{t:"Anatomia",discId:"d1"}}}));
    localStorage.setItem("resid-checklist-v2",JSON.stringify({"CM-7":{l:1,last:D(-10),step:0},"CM-1":{l:1,last:D(-5),step:0}}))},dates);
  await p.reload();await p.waitForTimeout(300);
  const cr=await p.evaluate(()=>examCrunch().active),reasons=await p.$$eval('#plan .reason',x=>x.map(e=>e.textContent));
  const resInPlan=await p.evaluate(()=>dayPlan.items.some(x=>x.cls!=="r-fac"));
  const revRes=await p.$$eval('#revlist .rcard .ptitle',x=>x.map(e=>e.textContent));
  const pausedTxt=await p.$$eval('#revlist summary',x=>x.map(e=>e.textContent));
  ok(cr===expectCrunch&&(expectCrunch?!resInPlan&&!revRes.length&&pausedTxt.length===1:true),`${label}: modo=${cr} plano=[${reasons.join(" | ")}] revisões visíveis=${revRes.length} pausadas=${pausedTxt}`);
  if(expectCrunch){await p.evaluate(()=>setView('temas'));await p.locator('#viewTemas section.today').screenshot({path:'crunch.png'})}
  if(errs.length)console.log('ERR',errs);await ctx.close()}
(async()=>{const b=await chromium.launch();
await run(b,"3 provas em 6 dias, a 4 dias",[4,6,9],true);
await run(b,"3 provas, a 1ª já passou ontem",[-1,1,3],true);
await run(b,"3 provas em 7 dias, mas a 10 dias",[10,13,16],false);
await run(b,"3 provas espalhadas (4, 12, 20)",[4,12,20],false);
await b.close()})();
