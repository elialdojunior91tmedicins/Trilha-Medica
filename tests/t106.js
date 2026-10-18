// t106: semana da prova da faculdade — o conteúdo já estudado volta ao plano como "Revisar para a prova" (até 2 vezes, 2 dias entre elas,
// menor acerto primeiro), sem temas novos da residência; vagas livres apontam para as revisões da residência; véspera também conta.
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],ipad578:[578,820,true],note:[1366,768,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,screen:name==="ipad578"?{width:1180,height:820}:undefined,userAgent:name==="ipad578"?"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)":undefined});
  await ctx.route(/googleapis|gstatic/,r=>r.abort());
  await ctx.addInitScript(mock+`;window.__mock({},2);`);
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
  await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
  const setup=async dias=>p.evaluate(dias=>{const t=dnum(today());
    ["CM-12","CM-6","CM-1"].forEach(k=>upd(k,x=>{x.last=fromNum(t-5);x.step=0;x.l=1;x.sd=subList(BYKEY[k]).map((y,i)=>i).filter(i=>i<BYKEY[k].subs.length)}));
    upd("CM-6",x=>{x.qc=2;x.qt=10});upd("CM-1",x=>{x.qc=9;x.qt=10});
    upd("CM-30",x=>{x.last=fromNum(t-10);x.step=0;x.l=1});// revisão da residência vencida
    fac={sems:[{id:"s",name:"S",archived:false}],discs:[{id:"d",semId:"s",name:"NCS",items:["T:CM-12","T:CM-6","T:CM-1","T:CM-20"],sps:[]}],provas:[{id:"p",discId:"d",name:"D2",date:fromNum(t+dias),items:["T:CM-12","T:CM-6","T:CM-1","T:CM-20"],done:[]}],own:{}};
    saveFac();dayPlan=makeDayPlan();savePlan();setView("inicio");render()},dias);
  const plan=()=>p.evaluate(()=>dayPlan.items.map(x=>x.k+":"+x.cls));
  /* 1. prova em 4 dias: pendente primeiro, depois revisões do estudado (menor acerto primeiro), nada novo da residência */
  await setup(4);let pl=await plan();
  ok(pl.join()==="CM-20:r-fac,CM-6:r-pfr,CM-12:r-pfr",name+": em 4 dias = pendente + 2 revisões para a prova, menor acerto primeiro ("+pl.join()+")");
  await p.evaluate(()=>setView("temas"));await p.waitForTimeout(150);
  const card=await p.evaluate(()=>{const c=document.querySelector('#plan .pcard[data-k="CM-6"]');return c&&{t:c.querySelector(".ptitle").textContent,r:c.querySelector(".reason").textContent,s:(c.querySelector(".psp")||{}).textContent}});
  ok(card&&card.t===BYKEY_T(card)&&/^Revisar · prova em 4 dias$/.test(card.r)&&card.s==="Revisão 1 de 2 · D2",name+": cartão mostra Revisar para a prova e Revisão 1 de 2 "+JSON.stringify(card));
  await p.evaluate(()=>{planOpen["CM-6"]={v:true,done:false};render()});await p.waitForTimeout(100);
  await p.evaluate(()=>document.querySelector('#plan .pcard[data-k="CM-6"] .pfrdone').scrollIntoView({block:"center"}));
  await (mob?p.tap('#plan .pcard[data-k="CM-6"] .pfrdone'):p.click('#plan .pcard[data-k="CM-6"] .pfrdone'));await p.waitForTimeout(200);
  const st=await p.evaluate(()=>({rv:fac.provas[0].rv,done:itemDone(dayPlan.items.find(x=>x.k==="CM-6")),last:get("CM-6").last,meta:$("#planmeta").textContent}));
  ok(st.rv&&st.rv["T:CM-6"]&&st.rv["T:CM-6"][0]===await p.evaluate(()=>today())&&st.done&&st.last!==await p.evaluate(()=>today()),name+": Revisei para a prova registra a revisão sem mexer na revisão espaçada "+JSON.stringify(st));
  ok(/semana de prova/.test(st.meta),name+": contador avisa semana de prova ("+st.meta+")");
  /* 2. espaçamento: ontem não volta; anteontem volta como 2ª; duas feitas, sai */
  const picks=await p.evaluate(()=>{const P=fac.provas[0],t=dnum(today()),R=[];
    P.rv={"T:CM-6":[fromNum(t-1)]};R.push(provaRvPicks().map(o=>o.it.key+o.n).join());
    P.rv={"T:CM-6":[fromNum(t-2)]};R.push(provaRvPicks().map(o=>o.it.key+o.n).join());
    P.rv={"T:CM-6":[fromNum(t-4),fromNum(t-2)]};R.push(provaRvPicks().map(o=>o.it.key+o.n).join());delete P.rv;saveFac();return R});
  ok(picks[0]==="CM-121,CM-11"&&picks[1]==="CM-62,CM-121,CM-11"&&picks[2]==="CM-121,CM-11",name+": até 2 revisões, com 2 dias entre elas "+JSON.stringify(picks));
  /* 3. tudo revisado: sem tema novo; aviso aponta para as revisões da residência */
  await p.evaluate(()=>{const P=fac.provas[0],t=dnum(today());P.rv={};["T:CM-12","T:CM-6","T:CM-1"].forEach(r=>P.rv[r]=[fromNum(t-4),fromNum(t-2)]);upd("CM-20",x=>{x.last=fromNum(t-1);x.step=0;x.l=1});saveFac();dayPlan=makeDayPlan();savePlan();render()});
  await p.waitForTimeout(150);
  const empty=await p.evaluate(()=>({items:dayPlan.items.length,txt:(document.querySelector("#plan .empty")||{}).textContent||"",go:!!document.querySelector("#plan .pweek button")||/revisões/.test((document.querySelector("#plan .empty")||{}).textContent||"")}));
  pl=await plan();
  ok(!pl.some(x=>/r-new|r-cont|r-weak/.test(x)),name+": semana de prova sem tema novo, em andamento ou ponto fraco ("+pl.join()+")");
  ok(empty.items===1&&empty.go,name+": vaga livre aponta para as revisões da residência "+JSON.stringify(empty));
  /* 4. prova em 10 dias: estudado não volta; plano da residência normal */
  await p.evaluate(()=>{fac.provas[0].date=fromNum(dnum(today())+10);delete fac.provas[0].rv;saveFac();redoPlan()});await p.waitForTimeout(100);
  pl=await plan();const nd=await p.evaluate(()=>isNewDay());
  ok(!pl.some(x=>/r-pfr/.test(x))&&(!nd||pl.some(x=>/r-new|r-cont/.test(x))),name+": fora da semana da prova, nada de revisão para a prova ("+pl.join()+")");
  /* 5. véspera (2 dias): marcar na véspera conta como revisão para a prova */
  await p.evaluate(()=>{fac.provas[0].date=fromNum(dnum(today())+2);saveFac();redoPlan();setView("temas");render()});await p.waitForTimeout(150);
  const vid=await p.evaluate(()=>{const i=[...document.querySelectorAll('#revVesp input')].find(x=>x.nextElementSibling.textContent===BYKEY["CM-1"].t);return i&&i.id});
  ok(!!vid,name+": cartão de véspera lista o conteúdo estudado");
  if(vid){await p.evaluate(id=>document.getElementById(id).click(),vid);await p.waitForTimeout(150);
    const v=await p.evaluate(()=>({rv:(fac.provas[0].rv||{})["T:CM-1"]||[],chk:(dayPlan.vesp.p||[]).includes("T:CM-1"),pick:provaRvPicks().some(o=>o.r==="T:CM-1")}));
    ok(v.rv.length===1&&v.chk&&!v.pick,name+": véspera marcada vira revisão e não volta ao plano hoje "+JSON.stringify(v))}
  await ctx.close()}
ok(!errs.length,"sem erros de JavaScript "+errs.join(" | "));
await b.close()})();
function BYKEY_T(c){return c.t}
