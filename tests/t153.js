// t153 (Revisões, 13/11/2026): histórico das revisões e recuperação do atraso.
// Parte 1: revisar grava s.rv; retenção nas Estatísticas (linha da tabela + "No prazo · Atrasadas") e no tema aberto; poucos dados = aviso.
// Parte 2: recuperação (aviso no Início e nas Revisões, "era para", Próximos dias, 1 tema novo, Revisar mais 3, Desfazer, celular).
// Desenho: docs/superpowers/specs/2026-11-13-revisoes-historico-e-recuperacao-design.md
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const RV=`(()=>{const T=today(),ago=n=>fromNum(dnum(T)-n),mk=(n,g,l)=>({d:ago(n),g,l,i:7});
  /* 12 no prazo (8 lembrou) e 6 atrasadas (2 lembrou), espalhadas em 3 temas, nos últimos 20 dias */
  const A=[],B=[];for(let i=0;i<12;i++)A.push(mk(1+i,i<8?2:i<10?1:0,i%2));for(let i=0;i<6;i++)B.push(mk(2+i,i<2?2:0,5+i));
  upd("CM-1",x=>{x.last=ago(3);x.step=2;x.l=2;x.rv=A.slice(0,6)});upd("CM-2",x=>{x.last=ago(3);x.step=2;x.l=2;x.rv=A.slice(6)});upd("CM-3",x=>{x.last=ago(3);x.step=2;x.l=2;x.rv=B});upd("CM-5",x=>{delete x.rv});
  commit()})()`;
(async()=>{const b=await chromium.launch();const errs=[];
 const ctx=await b.newContext({viewport:{width:1366,height:900}});
 await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__qLegacy=false;window.__mock({},2);`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('http://localhost:8765/tests/preview.html');
 await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});

 /* sem histórico: Estatísticas avisam que há poucas revisões */
 await p.evaluate(()=>{setView("stats");render()});await p.waitForTimeout(300);
 let r=await p.evaluate(()=>{const e=document.getElementById("stRet");return e&&e.textContent});
 ok(/Poucas revisões registradas ainda/.test(r||""),"Estatísticas sem histórico: aviso de poucas revisões "+JSON.stringify(r));

 /* revisar grava o histórico */
 await p.evaluate(()=>{upd("CM-5",x=>{x.last=fromNum(dnum(today())-10);x.step=1;x.l=1});reviewTopic("CM-5",2)});
 r=await p.evaluate(()=>({rv:get("CM-5").rv,T:today()}));ok(Array.isArray(r.rv)&&r.rv.length===1&&r.rv[0].g===2&&r.rv[0].d===r.T,"revisar grava a revisão no tema "+JSON.stringify(r.rv));

 /* com histórico: linha da tabela e retenção no prazo × atrasadas */
 await p.evaluate(RV);await p.evaluate(()=>{setView("stats");render()});await p.waitForTimeout(300);
 r=await p.evaluate(()=>{const row=[...document.querySelectorAll("#stB1 .sttab tr")].find(t=>/Retenção nas revisões/.test(t.textContent));const e=document.getElementById("stRet");return {row:row&&row.textContent,ret:e&&e.textContent}});
 ok(!!r.row&&/%/.test(r.row),"tabela de Como estou indo com a linha Retenção nas revisões "+JSON.stringify(r.row));
 ok(/No prazo: 67%/.test(r.ret||"")&&/Atrasadas: 33%/.test(r.ret||""),"retenção no prazo × atrasadas "+JSON.stringify(r.ret));

 /* tema aberto */
 await p.evaluate(()=>{setView("temas");detTab["CM-3"]="estudo";openTopic("CM-3");render()});await p.waitForTimeout(300);
 r=await p.evaluate(()=>{const e=document.querySelector("#t-CM-3 .drevh");return e&&e.textContent});
 ok(/6 revisões/.test(r||"")&&/lembrou 2/.test(r||""),"tema aberto: resumo das revisões "+JSON.stringify(r));

 /* Parte 2: recuperação do atraso */
 const LATE=n=>`(()=>{const ks=ALL.filter(it=>!it.own).slice(20,20+${n}).map(it=>it.key);ks.forEach((k,i)=>upd(k,x=>{x.last=fromNum(dnum(today())-40-(i%5));x.step=1;x.l=1;delete x.rv}));
   try{localStorage.removeItem("resid-recchk");localStorage.removeItem("resid-recdis")}catch(e){};return ks})()`;
 let ks=await p.evaluate(LATE(5));await p.evaluate(()=>{setView("inicio");render()});await p.waitForTimeout(300);
 r=await p.evaluate(()=>({note:!!document.getElementById("recNote"),act:recActive().length}));ok(!r.note&&r.act===0,"atraso pequeno: nada muda "+JSON.stringify(r));
 ks=await p.evaluate(LATE(30));await p.evaluate(()=>{setView("inicio");render()});await p.waitForTimeout(300);
 r=await p.evaluate(()=>{const n=document.getElementById("recNote");return {t:n&&n.textContent,act:recActive().length}});
 ok(/30 revisões atrasadas foram distribuídas até/.test(r.t||"")&&r.act>=30,"atraso grande: aviso no Início "+JSON.stringify(r));
 await p.evaluate(()=>{goRevs();render()});await p.waitForTimeout(300);
 r=await p.evaluate(()=>({n:!!document.getElementById("recNoteR"),orig:document.querySelectorAll("#revlist .recorig").length,ag:(document.getElementById("agRec")||{}).textContent,agd:document.querySelectorAll("#revAgenda .agday.rec").length}));
 ok(r.n,"aviso também no topo das revisões");ok(r.orig>0,"cartões da revisão com a data original (era para) "+r.orig);
 ok(/Recuperação: 0 de 30 feitas · termina em/.test(r.ag||"")&&r.agd>1,"Próximos dias: linha da recuperação e dias marcados "+JSON.stringify(r));
 r=await p.evaluate(()=>{dayPlan=null;ensurePlan();return (dayPlan.items||[]).filter(i=>i.cls==="r-new"||i.cls==="r-cont"||i.cls==="r-eixo").length});
 ok(r<=1,"plano do dia com no máximo 1 tema novo durante a recuperação ("+r+")");
 r=await p.evaluate(()=>{setView("temas");render();const b=document.getElementById("pBrake");return b&&b.textContent});
 ok(/Recuperação do atraso/.test(r||"")&&!/^0 revisões/.test(r||""),"aviso do plano explica que o limite vem da recuperação "+JSON.stringify(r));
 /* adiantar: com a fila concluída */
 r=await p.evaluate(()=>{const h0=recActive().filter(k=>dueIn(get(k))===0).length;qCounts=()=>({});setView("inicio");render();const b=document.getElementById("recMore");if(b)b.click();return {b:!!b,h0,h1:recActive().filter(k=>dueIn(get(k))===0).length}});
 ok(r.b&&r.h1===r.h0+3,"fila concluída: Revisar mais 3 do atraso traz 3 para hoje "+JSON.stringify(r));
 /* desfazer */
 await p.evaluate(()=>{setView("inicio");render()});await p.waitForTimeout(200);
 await p.evaluate(()=>{const b=document.getElementById("recUndo");if(b)b.click()});await p.waitForTimeout(200);
 r=await p.evaluate(ks=>({late:ks.filter(k=>dueIn(get(k))<0).length,note:!!document.getElementById("recNote"),rec:!!ui.prefs.rec}),ks);
 ok(r.late===30&&!r.note&&!r.rec,"Desfazer: as 30 voltam a ser atrasadas e o aviso some "+JSON.stringify(r));
 /* celular: sem rolagem lateral */
 await p.setViewportSize({width:390,height:844});await p.evaluate(()=>{localStorage.removeItem("resid-recchk");delete ui.prefs.rec;setView("inicio");render()});await p.waitForTimeout(300);
 r=await p.evaluate(()=>({note:!!document.getElementById("recNote"),w:document.documentElement.scrollWidth}));ok(r.note&&r.w<=390,"celular: aviso aparece sem rolagem lateral "+JSON.stringify(r));

 ok(!errs.length,"sem erros de JavaScript "+errs.join(" | "));await b.close()})();
