// t85: planejar a semana — semana padrão, esta semana, tempo de hoje, simulado e folga (Configurações › Plano) e o efeito no plano, revisões, fila, saudação e prévia
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],ipad578:[578,820,true],tabEmPe:[820,1180,true],note:[1366,768,false],monitor:[1920,1080,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];const ipad=name==="ipad578"||name.startsWith("tab");
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,screen:name==="ipad578"?{width:1180,height:820}:undefined,userAgent:ipad?"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)":undefined});
  await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
  await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
  const click=async s=>{await p.evaluate(s=>{const x=document.querySelector(s);if(x)x.scrollIntoView({block:"center"})},s);await (mob?p.tap(s):p.click(s));await p.waitForTimeout(120)};
  const T=await p.evaluate(()=>{const D=n=>fromNum(dnum(today())+n);
    state["CM-1"]={l:1,last:D(-1),step:0};// vence hoje (intervalo 1)
    state["CM-2"]={l:1,last:D(-1),step:1};// vence em 2 dias (intervalo 3)
    state["CM-3"]={l:1,last:D(-10),step:1,qt:20,qc:8,qd:{[D(-10)]:[20,8]}};// ponto fraco, atrasada
    commit();return {wd:wdOf(dnum(today())),wd2:wdOf(dnum(today())+2),js:new Date().getDay()}});
  ok(T.wd===T.js,name+": dia da semana calculado igual ao do relógio ("+T.wd+")");
  /* 1. Configurações › Plano › Planejar a semana */
  await p.evaluate(()=>{backStack=[];wpTab="pad";goSub("config")});await p.waitForTimeout(150);
  ok(await p.isVisible('#wpCard')&&await p.evaluate(()=>document.querySelectorAll('#wpCard .wpday').length===7&&document.querySelectorAll('#wpCard .wpo').length===35&&document.querySelectorAll('#wkCfg .wkd.wsim').length===7),name+": Configurações › Plano tem a semana padrão (7 dias × 5 tempos) e a linha de simulados");
  ok(await p.evaluate(()=>ui.prefs.wday.every(m=>m===180)&&ui.prefs.hgoal===600),name+": padrão: 3 h+ todos os dias (como antes) e meta de 10 h");
  ok(await p.evaluate(()=>!document.querySelector('#wkCfg .wkd.wnew')&&!document.querySelector('.wkd.woff')),name+": a antiga \"Semana de estudos\" saiu");
  await click(`#wp-${T.wd}-0`);
  const r1=await p.evaluate(wd=>({w:ui.prefs.wday[wd],off:ui.prefs.woff.includes(wd),nw:ui.prefs.wnew.includes(wd)}),T.wd);
  ok(r1.w===0&&r1.off&&!r1.nw,name+": folga na semana padrão (e os campos antigos acompanham)");
  for(let d=0;d<7;d++)if(d!==T.wd)await p.evaluate(d=>{const b=document.getElementById(`wp-${d}-0`);if(b&&b.getAttribute('aria-pressed')!=="true")b.click()},d);await p.waitForTimeout(100);
  ok(await p.evaluate(()=>ui.prefs.wday.filter(m=>m===0).length===5&&/No máximo 5 dias de folga/.test(document.querySelector('#wpCard').textContent)),name+": no máximo 5 dias de folga");
  await p.evaluate(wd=>{ui.prefs.wday=[0,1,2,3,4,5,6].map(d=>d===wd?0:180);ui.prefs.wsim=[];wpLegacy();saveUI();wpMsg="";render()},T.wd);
  ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": configuração sem rolagem lateral");
  if(name==="fone"||name==="note"){await p.evaluate(()=>document.querySelector('#wpCard').scrollIntoView({block:"start"}));await p.screenshot({path:`t85-${name}.png`})}
  await p.waitForTimeout(1200);
  ok(await p.evaluate(wd=>{const v=(__store["data/users/u1/prefs"]||{}).prefs;return v&&Array.isArray(v.wday)&&v.wday[wd]===0&&v.hgoal===600},T.wd),name+": a semana fica salva na conta");
  /* 2. hoje é folga */
  await p.evaluate(()=>{redoPlan();backStack=[];setView("inicio")});await p.waitForTimeout(150);
  const r2=await p.evaluate(()=>{const s1=get("CM-1"),s3=get("CM-3");return {plan:ensurePlan().items.length,q:qCounts(),d1:dueIn(s1),d3:dueIn(s3),hero:document.querySelector('#iHero .hsum').textContent,btn:!!document.querySelector('#heroGo'),steps:nextSteps().length,
    plTxt:document.querySelector('#plan').textContent,rq:document.querySelector('#iQueue').textContent}});
  ok(r2.plan===0&&r2.steps===0&&Object.values(r2.q).every(v=>v===0),name+": na folga não há plano, fila nem próximo passo");
  ok(r2.d1>=1&&r2.d3>=1,name+": revisões de hoje e atrasadas passam para o próximo dia de estudo "+JSON.stringify([r2.d1,r2.d3]));
  ok(/dia de folga/.test(r2.hero)&&/as revisões voltam (amanhã|n[ao] )/.test(r2.hero)&&!r2.btn,name+": a saudação avisa a folga, sem botão: "+r2.hero);
  ok(/folga/.test(r2.plTxt)&&/folga/.test(r2.rq),name+": Estudar hoje e Revisar hoje explicam a folga");
  /* 3. revisão que cairia numa folga futura vai para o dia seguinte */
  const r3=await p.evaluate(wd2=>{ui.prefs.wday=[0,1,2,3,4,5,6].map(d=>d===wd2?0:180);saveUI();return dueIn(get("CM-2"))},T.wd2);
  ok(r3===3,name+": revisão que venceria em 2 dias, numa folga, vence em 3 "+r3);
  /* 4. tempo de hoje: 30 min = só o leve; 1 h = 1 tema; 2 h = 2; 3 h+ = o plano inteiro */
  const r4=await p.evaluate(wd=>{ui.prefs.wday=[0,1,2,3,4,5,6].map(d=>d===wd?30:180);saveUI();redoPlan();const P=ensurePlan();backStack=[];setView("temas");render();
    return {n:P.items.length,cls:P.items.map(x=>x.cls),meta:document.querySelector('#planmeta').textContent,due:dueIn(get("CM-1")),light:!!document.querySelector('#pLight'),lt:(document.querySelector('#pLight')||{}).textContent||"",tm:document.querySelector('#pTime').textContent}},T.wd);
  ok(r4.n===0&&r4.light&&/Revisões de temas/.test(r4.lt)&&/Ponto fraco/.test(r4.lt)&&/30 min/.test(r4.tm),name+": dia de 30 min: sem tema novo; o ponto fraco vai na fila, com o leve (cartões, erros, revisões) "+JSON.stringify(r4));
  /* revisão geral com cartões dos temas da semana (dia de 30 min) */
  const g0=await p.evaluate(()=>{const t=dnum(today()),k="CM-5",s=get(k);s.last=today();s.step=0;s.ed=[today()];state[k]=s;commit();
    for(let i=0;i<3;i++){const x=cdClean({id:"cg"+i,k,q:"Q"+i,a:"A"+i,box:0,due:fromNum(t+5),n:0,ok:0,src:"eu",f:{st:2,s:5,d:5,last:fromNum(t-2),reps:2,lapses:0,first:fromNum(t-9)}});cards.push(x)}
    cards.push(cdClean({id:"cgo",k:"PED-3",q:"fora",a:"x",box:0,due:fromNum(t+5),n:0,ok:0,src:"eu",f:{st:2,s:5,d:5,last:fromNum(t-2),reps:2,lapses:0,first:fromNum(t-9)}}));render();
    const b=document.querySelector('#pLightGenBox');return {box:!!b,txt:b?b.textContent:"",ids:cdGenIds(cdGenScope())}});
  ok(g0.box&&/: 3/.test(g0.txt)&&/semana/.test(g0.txt)&&g0.ids.length===3,name+": revisão geral com os cartões dos temas da semana "+JSON.stringify(g0));
  await click('#pLightGen');
  ok(await p.evaluate(()=>view==="notas"&&cdRun&&cdRun.ids.length===3&&/Revisão geral/.test(cdRun.gen)&&!!document.querySelector('#cdGenNote')),name+": Revisão geral abre os cartões no Caderno, com o aviso");
  const g1=await p.evaluate(()=>{cdRun=null;const t=dnum(today());fac={sems:[{id:"s",name:"S",archived:false}],discs:[{id:"d",semId:"s",name:"NCS",items:["T:PED-3"],sps:[]}],provas:[{id:"p",discId:"d",name:"P2",date:fromNum(t+4),items:["T:PED-3"],done:[]}],own:{}};saveFac();
    const S=cdGenScope(),r={prova:S.prova,lab:S.lab,ids:cdGenIds(S)};fac={sems:[],discs:[],provas:[],own:{}};saveFac();cards=cards.filter(x=>!/^cg/.test(x.id));backStack=[];setView("temas");return r});
  ok(g1.prova&&g1.lab==="P2"&&g1.ids.join()==="cgo",name+": com prova da faculdade em até 7 dias, a revisão geral usa os temas da prova "+JSON.stringify(g1));
  ok(r4.due===0,name+": sem folga, as revisões vencem normalmente");
  const caps=await p.evaluate(wd=>[60,120,180].map(m=>{ui.prefs.wday[wd]=m;saveUI();redoPlan();return ensurePlan().items.length}),T.wd);
  ok(caps[0]===1&&caps[1]===2&&caps[2]===3,name+": 1 h = 1 tema, 2 h = 2, 3 h+ = 3 "+caps);
  await click('#pTimeChg');await click('#tdm-60');
  const r4b=await p.evaluate(()=>{const t=dnum(today()),W=ui.prefs.wplans[fromNum(wpMon(t))];return {w:W&&W.m[wdOf(t)],pad:ui.prefs.wday[wdOf(t)],n:ensurePlan().items.length,note:document.querySelector('#planNote').textContent}});
  ok(r4b.w===60&&r4b.pad===180&&r4b.n>=1&&/1 h/.test(r4b.note),name+": \"Tenho menos tempo hoje\" muda só hoje (na semana) e refaz o plano "+JSON.stringify(r4b));
  /* 4b. esta semana: confirmar e voltar à padrão */
  await p.evaluate(()=>{backStack=[];wpTab="cur";goSub("config")});await p.waitForTimeout(150);
  const r4c=await p.evaluate(wd=>({chg:!!document.querySelector(`#wp-${wd}-60.chg`),st:document.querySelector('#wpCard .wpst').textContent}),T.wd);
  ok(r4c.chg&&/não confirmada/.test(r4c.st),name+": Esta semana marca o dia diferente da padrão "+r4c.st);
  await click('#wpOk');ok(await p.evaluate(()=>/confirmada/.test(document.querySelector('#wpCard .wpst').textContent)&&ui.prefs.wplans[fromNum(wpMon(dnum(today())))].ok===1),name+": Confirmar a semana");
  await click('#wpReset');ok(await p.evaluate(()=>!ui.prefs.wplans[fromNum(wpMon(dnum(today())))]&&dayMin(dnum(today()))===180),name+": Voltar à semana padrão");
  /* 4c. cartão do Início no domingo/segunda */
  const r4d=await p.evaluate(()=>{dayOff=0;const t=dnum(today());let off=0;while(wdOf(t+off)!==0)off++;dayOff=off;backStack=[];setView("inicio");render();
    const a=!!document.querySelector('#wpNotice'),txt=a?document.querySelector('#wpNotice').textContent:"";dayOff=off+2;render();const c=!!document.querySelector("#wpNotice");dayOff=off;render();return {a,txt,c,off}});
  ok(r4d.a&&/próxima semana/.test(r4d.txt)&&!r4d.c,name+": Início: cartão Planejar a semana no domingo, não na terça "+r4d.txt);
  await click('#wpGo');ok(await p.evaluate(()=>view==="config"&&wpTab==="next"),name+": o botão leva a Configurações › Próxima semana");
  await click('#wpOk');await p.evaluate(()=>{backStack=[];setView("inicio");render()});ok(!(await p.isVisible('#wpNotice')),name+": depois de confirmar, o cartão some");
  await p.evaluate(()=>{dayOff=0;render()});
  /* 5. dia de simulado */
  const r5=await p.evaluate(wd=>{ui.prefs.wday=[180,180,180,180,180,180,180];ui.prefs.wplans={};ui.prefs.wsim=[wd];saveUI();redoPlan();render();const S=nextSteps(),i=S.findIndex(x=>x.kind==="sim");
    return {i,s:S[i],ex:document.querySelector('#iHero .hexam')?document.querySelector('#iHero .hexam').textContent:""}},T.wd);
  ok(r5.i>=0&&r5.i<=1&&r5.s.n===20&&/dia de simulado/.test(r5.s.why),name+": no dia de simulado, o próximo passo sugere um simulado de 20 questões "+JSON.stringify(r5.s));
  ok(/Hoje é dia de simulado e provas/.test(r5.ex),name+": a saudação lembra que é dia de simulado");
  const r6=await p.evaluate(()=>{exams=[exClean({id:"exA",name:"ENARE 2024",banca:"ENARE",ano:"2024",at:new Date().toISOString(),qs:[{n:1,q:{enunciado:"x",alternativas:[{letra:"A",texto:"a"},{letra:"B",texto:"b"}],correta:"A"},g:"b"}]})];
    const s=nextSteps().find(x=>x.kind==="exam");if(s)startStep(s);return {s,view}});
  ok(r6.s&&r6.s.id==="exA"&&r6.view==="quest",name+": com prova na íntegra por fazer, o dia de simulado sugere a prova e abre a aba Questões");
  ok(await p.evaluate(()=>{exams=[];const s=nextSteps().find(x=>x.kind==="sim");startStep(s);return simCfg.n===20&&view==="quest"}),name+": tocar no simulado abre o simulado com 20 questões");
  /* 6. prévia da semana e projeção */
  const r7=await p.evaluate(wd2=>{ui.prefs.wday=[0,1,2,3,4,5,6].map(d=>d===wd2?0:180);ui.prefs.wsim=[];saveUI();const W=weekPreview(),d2=W[1];
    weekOpen=true;backStack=[];setView("temas");render();const li=[...document.querySelectorAll('.pwlist li')][1];return {n:d2.items.length,txt:li&&li.textContent,cls:li&&li.classList.contains("pwoff"),cap:projModel().cap,pa:partsAvg(),wc:weekCap(),pn:PLAN_N}},T.wd2);
  ok(r7.n===0&&r7.cls&&/folga/.test(r7.txt),name+": a prévia da semana mostra a folga, sem temas: "+r7.txt);
  ok(r7.wc===r7.pn*6&&Math.abs(r7.cap-r7.wc/r7.pa)<1e-9,name+": a projeção usa o tempo da semana ("+r7.cap+")");
  const r8=await p.evaluate(()=>{ui.prefs.wday=[0,120,120,120,60,60,180];saveUI();return weekCap()});
  ok(r8===2+2+2+1+1+3,name+": capacidade da semana pelos tempos (2 h = 2, 1 h = 1, 3 h+ = 3) "+r8);
  await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
