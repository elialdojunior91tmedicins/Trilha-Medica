// t121: Lote 17 — enxugamento. Revisões com 3 respostas, atraso bem-sucedido, questões contam como revisão, pilha por peso × atraso, freio de carga
// e tempo estimado; uma agenda por questão (Refazer → caderno sai do Refazer; erro com cartão é revisado pelo cartão); reler dentro da revisão;
// Início sem números repetidos, barra lateral só navegação, "Seu progresso" fora do Início, um cartão de domingo/segunda; uma meta de horas;
// "Próximos dias"; uma conta de "onde focar"; selo "repetiu" no lugar de "Erros que se repetem"; Questões com os 10 que mais pedem atenção.
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
(async()=>{const b=await chromium.launch();const errs=[];
for(const [name,w,h,mob] of [["note",1366,900,false],["fone",390,844,true]]){
const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob});
await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+": "+e.message));
await p.goto('http://localhost:8765/tests/preview.html');await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
if(name==="note"){
const R=await p.evaluate(()=>{const t=dnum(today()),D=n=>fromNum(t-n),o={};
  /* 3 respostas */
  upd("CM-1",x=>{x.last=D(7);x.step=2;x.l=1});o.lem=revNext(get("CM-1"),2);o.dif=revNext(get("CM-1"),1);o.esq=revNext(get("CM-1"),0);
  upd("CM-1",x=>{x.step=0});o.esq0=revNext(get("CM-1"),0);
  /* atraso bem-sucedido: previsto 7 dias, passaram 20 → próximo intervalo ≥ 20 */
  upd("CM-1",x=>{x.last=D(20);x.step=2});o.late=INT[revNext(get("CM-1"),2)];
  reviewTopic("CM-1",0);o.after=get("CM-1").step;o.rg=get("CM-1").rg;
  /* questões contam como revisão */
  upd("CM-2",x=>{x.last=D(4);x.step=1;x.l=1;addQ(x,6,5,today())});o.auto0=isDue(get("CM-2"));render();const s2=get("CM-2");o.auto={last:s2.last===today(),step:s2.step,ar:s2.ar};
  upd("CM-3",x=>{x.last=D(4);x.step=1;x.l=1;addQ(x,4,4,today())});render();o.auto4=get("CM-3").last===today();
  /* pilha por importância: peso 3 atrasado 10 vem antes de peso 1 atrasado 20 */
  const hi=ALL.find(i=>wOf(i)===3&&!["CM-1","CM-2","CM-3"].includes(i.key)),lo=ALL.find(i=>wOf(i)===1);
  upd(hi.key,x=>{x.last=D(13);x.step=1;x.l=1});upd(lo.key,x=>{x.last=D(23);x.step=1;x.l=1});o.pri=[hi.key,lo.key].sort(revPri)[0]===hi.key;
  return o});
ok(R.lem===3&&R.dif===2&&R.esq===0&&R.esq0===0,"Lembrei sobe 1, Difícil repete, Esqueci volta 2 (mín. 0) "+JSON.stringify([R.lem,R.dif,R.esq,R.esq0]));
ok(R.late>=20,"lembrou com atraso: o próximo intervalo é pelo menos o tempo que passou ("+R.late+" dias)");
ok(R.after===0&&R.rg===0,"Esqueci gravado");
ok(R.auto0&&R.auto.last&&R.auto.step===2&&R.auto.ar&&R.auto.ar.a===83,"5+ questões no dia da revisão marcam a revisão sozinhas (83% = Lembrei) "+JSON.stringify(R.auto));
ok(!R.auto4,"com menos de 5 questões não marca");
ok(R.pri,"pilha: peso × atraso (peso 3 atrasado 10 d antes de peso 1 atrasado 20 d)");
/* botões e reler dentro da revisão */
await p.evaluate(()=>{notes["CM-1"]="## Resumo\n- ponto **um**";upd("CM-1",x=>{x.last=fromNum(dnum(today())-5);x.step=1});goRevs("CM-1")});await p.waitForTimeout(500);
const V=await p.evaluate(()=>{const c=[...document.querySelectorAll(".rcard")].find(r=>r.dataset.k==="CM-1");return {btn:[...c.querySelectorAll(".revg button span")].map(x=>x.textContent),days:c.querySelector("#rg2-CM-1 small").textContent,rr:!!c.querySelector(".reread .rrhead"),all:/Ver todas as anotações do tema/.test(c.textContent),old:/Lembrei bem|Tive dificuldade/.test(c.textContent)}});
ok(V.btn.join()==="Lembrei,Difícil,Esqueci"&&/dias?/.test(V.days)&&!V.old,"cartão da revisão com Lembrei · Difícil · Esqueci e os dias em cada botão "+JSON.stringify(V));
ok(V.rr&&V.all,"reler a anotação dentro da revisão, com Ver todas as anotações do tema");
await p.click('.rcard[data-k="CM-1"] .rrhead');await p.waitForTimeout(250);ok(await p.evaluate(()=>/ponto um/.test(document.querySelector('.rcard[data-k="CM-1"] .reread .mdview').textContent)),"abrir mostra a página do tema");
ok(await p.evaluate(()=>!QSTEPS.some(x=>x[0]==="notes")&&qCounts().notes===0),"a fila do dia não tem mais o passo Anotações para reler");
ok(await p.evaluate(()=>/Próximos dias/.test($("#revAgenda").textContent)&&!!$("#agWeek")&&!$("#weekBox").children.length),"Próximos dias: agenda + plano dos próximos 6 dias num cartão só");
/* freio de carga */
const B=await p.evaluate(()=>{const t=dnum(today()),ks=ALL.map(i=>i.key).filter(k=>!get(k).last).slice(0,45);ks.forEach((k,i)=>upd(k,x=>{x.last=fromNum(t-10);x.step=0;x.l=1}));
  const a=revBrake(),p1=buildPlan().filter(x=>x.cls==="r-new"||x.cls==="r-cont").length;ks.slice(0,20).forEach(k=>upd(k,x=>{x.last=today()}));const b2=revBrake(),p2=buildPlan().filter(x=>x.cls==="r-new"||x.cls==="r-cont").length;
  redoPlan();setView("inicio");return {a,p1,b2,p2,note:($("#pBrake")||{}).textContent||"",est:($("#pEst")||{}).textContent||""}});
ok(B.a.cap===0&&B.p1===0,"mais de 40 revisões atrasadas: nenhum tema novo "+JSON.stringify([B.a,B.p1]));
ok(B.b2.cap===1&&B.p2<=1,"mais de 20: no máximo 1 tema novo "+JSON.stringify([B.b2,B.p2]));
ok(await p.evaluate(()=>{const C=qCounts();return C.revAll>C.revs&&C.revs===Math.max(0,C.revCap-((hist[today()]||{}).r||0))&&qMinutes(C)<=Math.max(QUEUE_MIN,Math.min(dayMin(dnum(today())),240)*QUEUE_SHARE)+MIN_EST.revs*REV_DAY_MIN}),"a fila do dia cabe no tempo: só as revisões mais importantes que cabem; as outras ficam para os próximos dias");
ok(/revisões atrasadas/.test(B.note)&&/Tempo estimado: fila ≈/.test(B.est),"Estudar hoje avisa o freio e mostra o tempo estimado: "+B.est);
/* uma agenda por questão */
const A=await p.evaluate(()=>{const q={enunciado:"Caso X do refazer",alternativas:["A","B"].map(l=>({letra:l,texto:"Alt "+l})),correta:"B",comentario:"c"};rdAdd("CM-5",q,"gen");const n0=redo.length;const n=rdForget("CM-5",q);
  const e={id:"ecd1",k:"CM-5",w:"Marquei A",r:"Correto B",t:"conceito",s:"x",d:today(),due:today()};errors.push(e);const d0=eDueList().some(x=>x.id==="ecd1");
  cards.push({id:"cdx",k:"CM-5",q:"Q",a:"A",eid:"ecd1",src:"eu",due:today(),n:0,ok:0,box:0,f:{st:0}});const d1=eDueList().some(x=>x.id==="ecd1");cards.pop();errors.pop();
  return {n0,n,left:redo.filter(x=>x.q.enunciado==="Caso X do refazer").length,d0,d1}});
ok(A.n===1&&A.left===0,"levar ao caderno de erros tira a questão do Refazer");
ok(A.d0&&!A.d1,"erro que virou cartão sai da revisão de erros (revisado pelo cartão)");
/* auditoria 26/10: Refazer expira, orçamento com revisões primeiro, erro formado, acerto baixo não encurta */
const AU=await p.evaluate(()=>{const q={enunciado:"Velha",alternativas:[{letra:"A",texto:"a"},{letra:"B",texto:"b"}],correta:"B",comentario:"c"};rdAdd("CM-6",q,"gen");const x=redo.find(y=>y.q.enunciado==="Velha");x.due=fromNum(dnum(today())-30);
  const n=rdExpire(),gone=!redo.some(y=>y.q.enunciado==="Velha");
  const C=qCounts(),bud=qBudget(),usedRev=Math.min(C.revAll+((hist[today()]||{}).r||0),C.revCap)*MIN_EST.revs;
  const e={id:"efm",k:"CM-8",w:"w",r:"r",t:"conceito",s:"s",d:today(),box:E_INT.length-1,due:today(),rev:4};errors.push(e);eAnswer(e,true);const fm=!!e.fm&&!eDueList().includes(e);
  eNew("CM-8","outro","certo","conceito","s");const back=!e.fm;
  const s0={step:2,last:today(),qt:20,qc:4,qd:{[today()]:[20,4]}};const lo=adaptF(s0);
  return {n,gone,rev70:usedRev<=bud*QUEUE_REV+MIN_EST.revs*REV_DAY_MIN,fm,back,lo}});
ok(AU.n>=1&&AU.gone,"questão 21+ dias vencida sem ser feita sai do Refazer");
ok(AU.rev70,"orçamento: revisões de temas com até 70% do tempo da fila");
ok(AU.fm&&AU.back,"erro acertado no degrau de 30 dias se forma (sai da revisão) e volta com um erro novo no tema");
ok(AU.lo===1,"acerto baixo não encurta mais o intervalo da revisão");
/* Início */
await p.evaluate(()=>{setView("inicio")});await p.waitForTimeout(300);
const I=await p.evaluate(()=>({tiles:[...document.querySelectorAll("#iBoard .itile .kl")].map(x=>x.textContent),stats:$("#iStats").classList.contains("ihid"),nav:$("#navExtra").textContent.trim(),
  hero:$("#iHero").textContent,q:$("#iQueue .todaydate").textContent,iw:!!$("#iNotice #wpNotice"),dow:new Date().getDay(),wk:!!$("#iWeek #wpNotice")}));
ok(!I.tiles.includes("Revisões")&&I.tiles.includes("Foco na semana"),"placar sem o número das revisões (fica só na fila) e com Foco na semana "+I.tiles.join(","));
ok(I.stats,"Seu progresso fica fora do Início por padrão");
ok(I.nav==="","barra lateral só com navegação e selos");
ok(!/\d+ revisões/.test(I.hero)&&/≈/.test(I.q),"saudação sem repetir as contagens; a fila mostra o tempo estimado "+I.q);
ok(!I.iw&&(I.dow===0||I.dow===1?I.wk:true),"domingo/segunda: um cartão só (Sua semana + Planejar a semana)");
/* uma meta de horas */
const G=await p.evaluate(()=>{ui.prefs.hgoal=600;ui.prefs.wday=[0,120,120,120,120,120,0];ui.prefs.wplans={};saveUI();setView("foco");render();return {dg:foDG(),sel:!!$("#foWGoal"),sel2:!!document.querySelector("select#foGoal"),txt:($("#foGoal")||{}).textContent||""}});
ok(G.dg===120&&!G.sel&&!G.sel2&&/10h00 por semana/.test(G.txt),"meta do dia = semanal ÷ dias de estudo, sem os seletores do Foco "+JSON.stringify(G));
ok(await p.evaluate(()=>{const p0={...ui.prefs};delete p0.hgoal;p0.fwgoal=900;return uiSanitize({prefs:p0,profile:{}}).prefs.hgoal===900}),"quem tinha meta semanal de foco fica com ela");
/* onde focar + erros repetidos + Questões */
const F=await p.evaluate(()=>({src:SIM_SRC.map(x=>x[0]),gain:!!document.querySelector(".qgain")}));
ok(!F.src.includes("weak")&&F.src.includes("gain"),"simulado: Pontos fracos e Onde ganhar pontos viram uma fonte só (Onde focar)");
const E=await p.evaluate(()=>{const t=today();["e1","e2","e3"].forEach((id,i)=>errors.push({id,k:"CM-7",w:"w",r:"r",t:"conceito",s:"s",d:t,due:t}));setView("erros");render();
  return {rep:/Erros que se repetem/.test($("#viewErros").textContent),selo:[...document.querySelectorAll(".erepb")].length}});
ok(!E.rep&&E.selo>=1,"Erros: sem o cartão Erros que se repetem; selo repetiu nos últimos 30 dias em Onde melhorar");
const Q=await p.evaluate(()=>{ALL.slice(0,30).forEach((it,i)=>upd(it.key,x=>addQ(x,10,3+(i%6),today())));setView("quest");setQSeg("temas");render();
  return {rows:document.querySelectorAll("#qlistT>.qrow").length,more:!!$("#qAllT"),cols:getComputedStyle($("#qlistT")).gridTemplateColumns.split(" ").length}});
ok(Q.rows===10&&Q.more&&Q.cols===2,"Questões: os 10 que mais pedem atenção + Ver todos, em duas colunas no computador "+JSON.stringify(Q));
await p.click("#qAllT");await p.waitForTimeout(200);ok(await p.evaluate(()=>document.querySelectorAll("#qlistT .qrow").length>10),"Ver todos mostra a lista inteira");
const W=await p.evaluate(()=>{const k="CM-7";upd(k,x=>{x.last=fromNum(dnum(today())-3);x.step=1;x.l=1;x.qt=0;x.qc=0;delete x.qd;delete x.wkd});upd(k,x=>addQ(x,10,3,today()));
  if(dayPlan)delete dayPlan.wk;redoPlan();const P=ensurePlan(),w=weakToday(),c0=qCounts().weak;
  upd(w.k,x=>addQ(x,5,3));const c1=qCounts().weak,rest=get(w.k).wkd===today();setView("inicio");render();
  return {noPlan:!P.items.some(x=>x.cls==="r-weak"),k:!!w&&isWeak(get(w.k))===true||!!w,c0,c1,rest,q:/Ponto fraco/.test(($("#iQueue")||{}).textContent||"")}});
ok(W.noPlan&&W.k&&W.c0===5&&W.c1===0&&W.rest,"Ponto fraco: fora do plano, na fila com 5 questões; feitas, descansa 7 dias "+JSON.stringify(W));
}else{
await p.evaluate(()=>{notes["CM-1"]="## a\n- b";upd("CM-1",x=>{x.last=fromNum(dnum(today())-5);x.step=1;x.l=1});setView("notas");setNSeg("revisar")});await p.waitForTimeout(300);
ok(await p.evaluate(()=>!document.querySelector("#viewNotas .ntoday")),name+": Caderno › Revisar sem o Para reler hoje");
await p.evaluate(()=>goRevs("CM-1"));await p.waitForTimeout(400);
ok(await p.evaluate(()=>{const g=document.querySelector('.rcard[data-k="CM-1"] .revg');return !!g&&g.scrollWidth<=g.clientWidth+2}),name+": os 3 botões cabem no celular");
await p.evaluate(()=>setView("inicio"));await p.waitForTimeout(200);
ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral no Início");
}
await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
