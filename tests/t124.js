// t124: Lote 18 › Início (seção 2) — fila do dia logo abaixo da saudação, um botão "Começar" que percorre revisões → erros → … → cartões → plano,
// tempo de cada parte e se cabe no tempo de hoje, semana da prova (cartões, erros e Refazer dela primeiro), fechamento do dia à noite,
// resumo da semana dentro do Planejar a semana
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],ipad578:[578,820,true],note:[1366,900,false],monitor:[1920,1080,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,screen:name==="ipad578"?{width:1180,height:820}:undefined,userAgent:name==="ipad578"?"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)":undefined});
  await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
  await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
  await p.evaluate(()=>{const t=dnum(today());
    ["CM-1","CM-2","CM-3","CM-4"].forEach((k,i)=>upd(k,x=>{x.last=fromNum(t-9-i);x.step=0;x.l=1}));
    const E=(id,k)=>({id,k,w:"Errei "+id,r:"Certo",t:"conhecimento",s:"",d:fromNum(t-3),due:fromNum(t-1),box:1});errors.push(E("e1","CM-30"),E("e2","CM-12"),E("e3","CM-30"));saveErrsLocal();
    ["CM-30","CM-12","CM-30","CM-40"].forEach((k,i)=>cards.push(cdClean({id:"c"+i,k,q:"P"+i,a:"R",src:"eu",due:fromNum(t-1),n:2,ok:1,box:2,f:{st:2,s:5,d:5,last:fromNum(t-6),reps:2,lapses:0,first:fromNum(t-20)}})));cdSaveLocal();
    dayPlan=makeDayPlan();savePlan();setView("inicio");render()});
  await p.waitForTimeout(150);
  /* 1. ordem: fila logo abaixo da saudação */
  const pos=await p.evaluate(()=>{const H=$("#iHero").getBoundingClientRect(),Q=$("#iQueue").getBoundingClientRect(),B=$("#iBoard").getBoundingClientRect(),two=document.documentElement.dataset.cols==="2";
    return {two,ok:H.bottom<=Q.top+1&&(two?Q.left<B.left&&Math.abs(Q.top-B.top)<40:Q.top<B.top),scroll:document.documentElement.scrollWidth<=innerWidth}});
  ok(pos.ok&&pos.scroll,name+": a fila do dia vem logo abaixo da saudação"+(pos.two?" (coluna da esquerda; placar à direita)":" (antes do placar)"));
  /* 2. tempo em cada parte e cabe no dia */
  let r=await p.evaluate(()=>{const L=[...document.querySelectorAll('#iQueue .iqlist li')].map(li=>({s:li.dataset.step,t:li.querySelector('.iqt').textContent,n:li.querySelector('.iqn').textContent}));
    return {L,h:$("#iQueue h2").textContent,fit:($("#iQueue .iqfit")||{}).textContent||"",hd:$("#iQueue .todaydate").textContent}});
  ok(r.h==="Fila do dia"&&r.L.map(x=>x.s).join()==="errs,revs,redo,cards,plan",name+": fila na ordem erros, revisões, refazer, cartões e plano ("+r.L.map(x=>x.s).join()+")");
  ok(r.L.filter(x=>x.n!=="✓").every(x=>/^≈ /.test(x.t))&&/≈ 20 min/.test(r.L[1].t),name+": cada parte com o tempo estimado ("+r.L.map(x=>x.s+" "+x.t).join(" · ")+")");
  ok(/Cabe no seu tempo de hoje|Passa ≈/.test(r.fit)&&/itens · ≈/.test(r.hd),name+": diz se cabe no tempo de hoje: "+r.fit);
  r=await p.evaluate(()=>{wpSetDay(null,wdOf(dnum(today())),60);render();return $("#iQueue .iqfit").textContent});
  ok(/^Passa ≈ .* do seu tempo de hoje \(1 ?h\)/.test(r),name+": com 1 h hoje, avisa que passa do tempo: "+r);
  await p.evaluate(()=>{wpSetDay(null,wdOf(dnum(today())),180);render()});
  /* 3. Começar percorre tudo: revisões primeiro, plano no fim */
  ok(await p.evaluate(()=>$("#heroGo").textContent==="Começar →"&&!$("#iqGo")),name+": um botão Começar (na saudação)");
  await p.evaluate(()=>$("#heroGo").scrollIntoView({block:"center"}));await (mob?p.tap('#heroGo'):p.click('#heroGo'));await p.waitForTimeout(250);
  r=await p.evaluate(()=>({ids:dayQ&&dayQ.ids.join(),v:view}));
  ok(r.ids==="errs,revs,cards,plan"&&r.v==="erros",name+": Começar abre os erros e a fila vai até o plano ("+r.ids+")");
  await p.evaluate(()=>{while(dayQ&&dayQ.ids[dayQ.i]!=="plan")qNext()});await p.waitForTimeout(300);
  r=await p.evaluate(()=>({v:view,on:document.querySelector('#qBar .qbt b').textContent,open:Object.keys(planOpen).some(k=>planOpen[k].v),fo:!!foRun}));
  ok(r.v==="inicio"&&r.open&&/4 de 4/.test(r.on),name+": o último passo abre o plano do dia (tema novo) "+JSON.stringify(r));
  await p.evaluate(()=>{qStop();erRun=null;cdRun=null;if(foRun){foRun=null;foSaveRun()}render()});
  /* 4. semana da prova: cartões, erros e Refazer dos conteúdos dela primeiro */
  r=await p.evaluate(()=>{const t=dnum(today());fac={sems:[{id:"s",name:"S",archived:false}],discs:[{id:"d",semId:"s",name:"NCS",items:["T:CM-30"],sps:[]}],provas:[{id:"p",discId:"d",name:"D2",date:fromNum(t+3),items:["T:CM-30"],done:[]}],own:{}};
    saveFac();render();const pw=($("#iQueue .iqpw")||{}).textContent||"",cd=cdDue().map(x=>x.k),m=[...document.querySelectorAll('#iQueue .iqlist li')].filter(li=>/da prova/.test(li.textContent)).map(li=>li.dataset.step);
    $("#erGo")||setView("erros");render();const g=$("#erGo");g.click();const er=erRun.ids.map(id=>errors.find(e=>e.id===id).k);erRun=null;setView("inicio");return {pw,cd,er,m}});
  ok(/Semana da prova D2 \(em 3 dias\)/.test(r.pw),name+": a fila avisa a semana da prova: "+r.pw);
  ok(r.cd[0]==="CM-30"&&r.cd[1]==="CM-30"&&r.er[0]==="CM-30"&&r.er[1]==="CM-30",name+": cartões e erros da prova vêm primeiro (cartões "+r.cd.join()+"; erros "+r.er.join()+")");
  ok(r.m.includes("errs")&&r.m.includes("cards"),name+": as partes mostram quantos são da prova ("+r.m.join()+")");
  await p.evaluate(()=>{fac={sems:[],discs:[],provas:[],own:{}};saveFac();render()});
  /* 5. à noite: o que foi feito e o que pode ficar para amanhã */
  r=await p.evaluate(()=>{const T=today();hist[T]={...(hist[T]||{}),r:2,q:10,c:7};window.__hour=21;render();const q=$("#iQueue").textContent,hs=$("#iHero .hsum").textContent;window.__hour=10;render();return {q,hs}});
  ok(/Feito hoje/.test(r.q)&&/2revisões de temas/.test(r.q)&&/10questões \(70%\)/.test(r.q)&&/Pode ficar para amanhã/.test(r.q),name+": à noite, a fila mostra o feito hoje e o que pode ficar para amanhã");
  ok(/^Hoje você fez 2 revisões de temas, 10 questões \(70%\)/.test(r.hs)&&/pode ficar para amanhã/.test(r.hs),name+": a saudação da noite resume o dia: "+r.hs);
  ok(await p.evaluate(()=>!/Feito hoje/.test($("#iQueue").textContent)),name+": de manhã, só o que fazer");
  /* 6. Planejar a semana mostra antes como foi a semana anterior */
  r=await p.evaluate(()=>{const t=dnum(today()),ws=foWeekStart()-7;hist[fromNum(ws+1)]={q:20,c:15,r:3,e:1};foSess.push({id:"fz",d:fromNum(ws+2),s:fromNum(ws+2)+"T10:00:00.000Z",sec:3600,m:"p",ref:"",lab:""});
    wpTab="cur";goSub("config");render();const d=$("#wpPrev");return d&&{s:d.querySelector("summary").textContent,t:d.textContent,open:d.open}});
  ok(r&&/Antes de planejar: como foi a semana passada/.test(r.s)&&/Foco: 1h/.test(r.t)&&/Questões: 20/.test(r.t),name+": Planejar a semana mostra como foi a semana passada antes de planejar "+JSON.stringify(r&&r.s));
  await p.evaluate(()=>{goBack&&goBack();setView("inicio")});
  await p.screenshot({path:`t124-${name}.png`,fullPage:false});
  await ctx.close()}
/* 7. quem tinha ordem salva no Início: a fila sobe para logo depois da saudação (uma vez) */
{const ctx=await b.newContext();await ctx.route(/googleapis|gstatic/,r=>r.abort());
  await ctx.addInitScript(mock+`;if(!localStorage.getItem("x")){localStorage.setItem("x","1");localStorage.setItem("resid-ui-v1",JSON.stringify({prefs:{iorder:["iHero","iBoard","iWeek","iQueue","iToday","iProva","iStats"]},profile:{}}))};window.__mock({},2);`);
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push("ordem:"+e.message));await p.goto('http://localhost:8765/tests/preview.html');await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});
  let o=await p.evaluate(()=>iOrder().join());ok(o.startsWith("iHero,iQueue,iBoard,iWeek"),"ordem salva antiga: a fila sobe para logo depois da saudação ("+o+")");
  o=await p.evaluate(()=>{ui.prefs.iorder=["iHero","iBoard","iQueue"];saveUI();ui=uiSanitize(JSON.parse(JSON.stringify(ui)));return iOrder().slice(0,3).join()});
  ok(o==="iHero,iBoard,iQueue","depois disso, a ordem que você escolher fica ("+o+")");await ctx.close()}
ok(errs.length===0,"sem erros de JavaScript"+(errs.length?": "+errs.slice(0,3).join(" | "):""));
await b.close()})();
