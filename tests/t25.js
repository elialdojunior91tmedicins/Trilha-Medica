const {chromium}=require('playwright');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:400,height:1000}});await ctx.route(/googleapis|gstatic/,r=>r.abort());
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+__dirname+'/../src/checklist-residencia.html');await p.waitForFunction(()=>typeof saveFac==='function');
await p.evaluate(()=>{localStorage.clear();localStorage.setItem("resid-fac-v1",JSON.stringify({sems:[{id:"s",name:"S",archived:false}],discs:[{id:"d",semId:"s",name:"Cardio",items:["T:CM-12","T:CM-6"]}],provas:[],own:{}}))});
await p.reload();await p.waitForFunction(()=>typeof saveFac==='function');await p.waitForTimeout(300);
const plan=()=>p.evaluate(()=>dayPlan.items.map(x=>x.k+":"+x.cls));
const p0=await plan();console.log("antes",p0);
// começa o 1º tema do plano (marca subtópico)
await p.evaluate(()=>{const it=BYKEY[dayPlan.items[0].k];toggleSub(it,subList(it).find(x=>x.t===dayPlan.items[0].subs[0]))});
const started=await p.evaluate(()=>dayPlan.items[0].k);
// prova distante: não muda
await p.evaluate(()=>{setView("fac");facOpenDisc.add("d");render()});
const addProva=async(n,dd)=>{await p.evaluate(()=>{setView('fac');facOpenSem.add('s');facOpenProv.add('s');render()});await p.fill('#fpn-s',n);await p.fill('#fpd-s',await p.evaluate(dd=>fromNum(dnum(today())+dd),dd));await p.click('#fsp-s .fpform button')};
await addProva("P longe",15);ok(JSON.stringify(await plan())===JSON.stringify(p0),"prova em 15 dias não mexe no plano de hoje");
ok(await p.evaluate(()=>document.getElementById("planNote").hidden),"sem aviso");
await addProva("P1",4);const p1=await plan();console.log("depois",p1);
ok(p1.some(x=>x.endsWith("r-fac")),"prova em 4 dias entra no plano na hora");
ok(p1.some(x=>x.startsWith(started+":")),"tema já iniciado foi mantido");
ok(await p.evaluate(()=>{setView("temas");const n=document.getElementById("planNote");return !n.hidden&&n.textContent.includes("P1")}),"aviso: "+await p.evaluate(()=>document.getElementById("planNote").textContent));
ok(await p.evaluate(()=>{setView('fac');return 1})&&await p.evaluate(()=>[...document.querySelectorAll('#viewFac .pnote')].some(n=>n.offsetParent&&n.textContent.includes('P1'))),'aviso visível na aba Faculdade');await p.evaluate(()=>setView('temas'));await p.click('#planRedo');ok(await p.evaluate(()=>document.getElementById("planNote").hidden),"aviso some ao refazer manualmente");
ok(!errs.length,"sem erros JS "+errs.join("|"));await b.close()})();
