const {chromium}=require('playwright');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:400,height:1000}});await ctx.route(/googleapis|gstatic/,r=>r.abort());
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const boot=async(fac,st)=>{await p.goto('file://'+__dirname+'/../src/checklist-residencia.html');await p.waitForFunction(()=>typeof saveFac==='function',null,{timeout:6000}).catch(async e=>{console.log('TRAVOU-goto',await p.evaluate(()=>document.readyState+' len='+document.documentElement.outerHTML.length).catch(x=>'eval:'+x.message));throw e});
  await p.evaluate(([f,s])=>{localStorage.clear();localStorage.setItem("resid-fac-v1",JSON.stringify(f));if(s)localStorage.setItem("resid-checklist-v2",JSON.stringify(s))},[fac,st]);
  await p.reload();await p.waitForFunction(()=>typeof saveFac==='function',null,{timeout:6000}).catch(async e=>{console.log('TRAVOU',await p.evaluate(()=>document.readyState+' scripts='+document.scripts.length+' len='+document.documentElement.outerHTML.length+' typeof='+typeof saveFac).catch(x=>'eval:'+x.message),errs.join('|'));throw e});await p.waitForTimeout(250)};
const plan=()=>p.evaluate(()=>dayPlan.items.map(x=>x.k+":"+x.cls));
const F=()=>({sems:[{id:"s",name:"S",archived:false}],discs:[{id:"d",semId:"s",name:"Cardio",items:["T:CM-12","T:CM-6","T:CM-9"]}],provas:[],own:{}});
const add=(n,dd)=>p.evaluate(([n,dd])=>{const d=fac.discs[0],pr={id:fuid(),discId:d.id,name:n,date:fromNum(dnum(today())+dd),items:[...d.items],done:[]};fac.provas.push(pr);saveFac();provaChanged(pr,"nova prova")},[n,dd]);

// 1) desfazer troca depois de refazer o plano não pode duplicar tema
await boot(F());
await p.evaluate(()=>{const it=BYKEY["GO-1"];toggleSub(it,subList(it)[0])});// inicia tema fora do plano -> troca
const sw=await plan();console.log("após troca",sw);
await add("P1",3);console.log("após prova",await plan());
await p.evaluate(()=>{const x=dayPlan.items.find(i=>i.cls==="r-own");if(x&&x.prev)undoSwap(x.k)});
const ks=(await plan()).map(x=>x.split(":")[0]);ok(new Set(ks).size===ks.length&&ks.includes("GO-1"),"tema iniciado continua e sem duplicata ("+ks.join(", ")+")");ok(await p.evaluate(()=>!dayPlan.items.some(x=>x.prev)),"sem \"Desfazer troca\" antigo depois de refazer");

// 2) três provas em 7 dias: a 3ª liga o modo provas e o plano vira só faculdade
await boot(F());await add("P1",2);await add("P2",4);
ok(!(await p.evaluate(()=>examCrunch().active)),"2 provas: modo provas ainda desligado");
await add("P3",6);
ok(await p.evaluate(()=>examCrunch().active),"3ª prova liga o modo provas");
ok((await plan()).every(x=>x.endsWith("r-fac")),"plano só da faculdade: "+(await plan()).join(", "));

// 3) três temas já iniciados + prova nova = 4 temas, nada perdido
await boot(F());
await p.evaluate(()=>dayPlan.items.forEach(x=>{const it=BYKEY[x.k];toggleSub(it,subList(it).find(s=>s.t===x.subs[0]))}));
const st=await plan();await add("P1",3);const af=await plan();
ok(st.every(x=>af.some(y=>y.split(":")[0]===x.split(":")[0]))&&af.length===4,"3 iniciados mantidos + 1 da prova ("+af.length+" temas)");

// 4) prova excluída: o tema da prova não iniciado sai do plano
await boot(F());await add("P1",3);const pid=await p.evaluate(()=>fac.provas[0].id);
await p.evaluate(pid=>{const pr=fac.provas.find(x=>x.id===pid);fac.provas=fac.provas.filter(x=>x.id!==pid);saveFac();provaChanged(pr,"prova excluída")},pid);
ok((await plan()).every(x=>!x.endsWith("r-fac")),"prova excluída: vagas voltam para a residência");

// 5) prova passada ou desmarcar conteúdo de prova passada não mexe no plano
await boot(F());const b5=await plan();await add("Antiga",-2);ok(JSON.stringify(await plan())===JSON.stringify(b5),"prova no passado não mexe no plano");

// 6) semestre arquivado não aciona
await boot({...F(),sems:[{id:"s",name:"S",archived:true}]});const b6=await plan();await add("Arq",3);
ok(JSON.stringify(await plan())===JSON.stringify(b6)&&!(await p.evaluate(()=>planNote)),"semestre arquivado: nada muda e sem aviso");

// 7) clicar várias vezes no mesmo conteúdo não embaralha temas já iniciados
await boot(F());await add("P1",3);
await p.evaluate(()=>{const x=dayPlan.items.find(i=>i.cls==="r-fac");const it=BYKEY[x.k];toggleSub(it,subList(it).find(s=>s.t===x.subs[0]))});
const s7=(await plan()).filter(x=>x.endsWith("r-fac"))[0];
for(let i=0;i<4;i++)await p.evaluate(()=>{const pr=fac.provas[0],r="T:CM-9";pr.items.includes(r)?pr.items=pr.items.filter(x=>x!==r):pr.items.push(r);saveFac();provaChanged(pr,"conteúdo alterado em")});
ok((await plan()).includes(s7),"tema da prova já iniciado continua após vários cliques");
ok(!errs.length,"sem erros JS "+errs.join("|"));await b.close()})();
