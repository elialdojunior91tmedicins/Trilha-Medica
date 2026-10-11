// t85: semana de estudos — dias de temas novos, de simulado e de folga (Configurações › Plano) e o efeito no plano, revisões, fila, saudação e prévia
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],ipad578:[578,820,true],tabEmPe:[820,1180,true],note:[1366,768,false],monitor:[1920,1080,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];const ipad=name==="ipad578"||name.startsWith("tab");
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,screen:name==="ipad578"?{width:1180,height:820}:undefined,userAgent:ipad?"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)":undefined});
  await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('file://'+__dirname+'/preview.html');
  await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
  const click=async s=>{await p.evaluate(s=>{const x=document.querySelector(s);if(x)x.scrollIntoView({block:"center"})},s);await (mob?p.tap(s):p.click(s));await p.waitForTimeout(120)};
  const T=await p.evaluate(()=>{const D=n=>fromNum(dnum(today())+n);
    state["CM-1"]={l:1,last:D(-1),step:0};// vence hoje (intervalo 1)
    state["CM-2"]={l:1,last:D(-1),step:1};// vence em 2 dias (intervalo 3)
    state["CM-3"]={l:1,last:D(-10),step:1,qt:20,qc:8,qd:{[D(-10)]:[20,8]}};// ponto fraco, atrasada
    commit();return {wd:wdOf(dnum(today())),wd2:wdOf(dnum(today())+2),js:new Date().getDay()}});
  ok(T.wd===T.js,name+": dia da semana calculado igual ao do relógio ("+T.wd+")");
  /* 1. tela de configuração */
  await p.evaluate(()=>{backStack=[];goSub("config")});await p.waitForTimeout(150);
  ok(await p.isVisible('#wkCfg')&&await p.evaluate(()=>document.querySelectorAll('#wkCfg .wkd').length===21),name+": Configurações › Plano tem a semana de estudos (3 linhas × 7 dias)");
  ok(await p.evaluate(()=>[...document.querySelectorAll('#wkCfg .wkd.wnew')].every(b=>b.getAttribute('aria-pressed')==="true")),name+": padrão: temas novos todos os dias (como antes)");
  await click(`#wk-woff-${T.wd}`);
  const r1=await p.evaluate(wd=>({off:ui.prefs.woff.includes(wd),nw:ui.prefs.wnew.includes(wd),saved:(__store["data/users/u1/prefs"]||{}).prefs}),T.wd);
  ok(r1.off&&!r1.nw,name+": marcar folga tira o dia dos temas novos");
  for(let d=0;d<7;d++)if(d!==T.wd)await p.evaluate(d=>{if(ui.prefs.wnew.includes(d))document.getElementById(`wk-wnew-${d}`).click()},d);await p.waitForTimeout(100);
  ok(await p.evaluate(()=>ui.prefs.wnew.length===1&&/pelo menos um dia de temas novos/.test(document.querySelector('#wkCfg').textContent)),name+": não deixa ficar sem nenhum dia de temas novos");
  ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": configuração sem rolagem lateral");
  if(name==="fone"||name==="note"){await p.evaluate(()=>document.querySelector('#wkCfg').scrollIntoView({block:"center"}));await p.screenshot({path:`t85-${name}.png`})}
  await p.waitForTimeout(1200);
  ok(await p.evaluate(()=>{const v=(__store["data/users/u1/prefs"]||{}).prefs;return v&&Array.isArray(v.woff)&&v.woff.length===1&&v.wnew.length===1}),name+": a semana fica salva na conta");
  /* 2. hoje é folga */
  await p.evaluate(()=>{redoPlan();backStack=[];setView("inicio")});await p.waitForTimeout(150);
  const r2=await p.evaluate(()=>{const s1=get("CM-1"),s3=get("CM-3");return {plan:ensurePlan().items.length,q:qCounts(),d1:dueIn(s1),d3:dueIn(s3),hero:document.querySelector('#iHero .hsum').textContent,btn:!!document.querySelector('#heroGo'),steps:nextSteps().length,
    plTxt:document.querySelector('#plan').textContent,rq:document.querySelector('#iQueue').textContent}});
  ok(r2.plan===0&&r2.steps===0&&Object.values(r2.q).every(v=>v===0),name+": na folga não há plano, fila nem próximo passo");
  ok(r2.d1>=1&&r2.d3>=1,name+": revisões de hoje e atrasadas passam para o próximo dia de estudo "+JSON.stringify([r2.d1,r2.d3]));
  ok(/dia de folga/.test(r2.hero)&&/as revisões voltam (amanhã|n[ao] )/.test(r2.hero)&&!r2.btn,name+": a saudação avisa a folga, sem botão: "+r2.hero);
  ok(/folga/.test(r2.plTxt)&&/folga/.test(r2.rq),name+": Estudar hoje e Revisar hoje explicam a folga");
  /* 3. revisão que cairia numa folga futura vai para o dia seguinte */
  const r3=await p.evaluate(wd2=>{ui.prefs.woff=[wd2];ui.prefs.wnew=[0,1,2,3,4,5,6].filter(d=>d!==wd2);ui.prefs.wsim=[];saveUI();return dueIn(get("CM-2"))},T.wd2);
  ok(r3===3,name+": revisão que venceria em 2 dias, numa folga, vence em 3 "+r3);
  /* 4. hoje sem temas novos (não é folga) */
  const r4=await p.evaluate(wd=>{ui.prefs.woff=[];ui.prefs.wnew=[0,1,2,3,4,5,6].filter(d=>d!==wd);saveUI();redoPlan();const P=ensurePlan();render();
    return {cls:P.items.map(x=>x.cls),meta:document.querySelector('#planmeta').textContent,due:dueIn(get("CM-1"))}},T.wd);
  ok(r4.cls.length>0&&!r4.cls.includes("r-new")&&r4.cls.includes("r-weak")&&/hoje sem temas novos/.test(r4.meta),name+": sem temas novos hoje: o plano traz só ponto fraco/faculdade "+JSON.stringify(r4.cls));
  ok(r4.due===0,name+": sem folga, as revisões vencem normalmente");
  /* 5. dia de simulado */
  const r5=await p.evaluate(wd=>{ui.prefs.wnew=[0,1,2,3,4,5,6];ui.prefs.wsim=[wd];saveUI();redoPlan();render();const S=nextSteps(),i=S.findIndex(x=>x.kind==="sim");
    return {i,s:S[i],ex:document.querySelector('#iHero .hexam')?document.querySelector('#iHero .hexam').textContent:""}},T.wd);
  ok(r5.i>=0&&r5.i<=1&&r5.s.n===20&&/dia de simulado/.test(r5.s.why),name+": no dia de simulado, o próximo passo sugere um simulado de 20 questões "+JSON.stringify(r5.s));
  ok(/Hoje é dia de simulado e provas/.test(r5.ex),name+": a saudação lembra que é dia de simulado");
  const r6=await p.evaluate(()=>{exams=[exClean({id:"exA",name:"ENARE 2024",banca:"ENARE",ano:"2024",at:new Date().toISOString(),qs:[{n:1,q:{enunciado:"x",alternativas:[{letra:"A",texto:"a"},{letra:"B",texto:"b"}],correta:"A"},g:"b"}]})];
    const s=nextSteps().find(x=>x.kind==="exam");if(s)startStep(s);return {s,view}});
  ok(r6.s&&r6.s.id==="exA"&&r6.view==="quest",name+": com prova na íntegra por fazer, o dia de simulado sugere a prova e abre a aba Questões");
  ok(await p.evaluate(()=>{exams=[];const s=nextSteps().find(x=>x.kind==="sim");startStep(s);return simCfg.n===20&&view==="quest"}),name+": tocar no simulado abre o simulado com 20 questões");
  /* 6. prévia da semana e projeção */
  const r7=await p.evaluate(wd2=>{ui.prefs.woff=[wd2];ui.prefs.wnew=[0,1,2,3,4,5,6].filter(d=>d!==wd2);ui.prefs.wsim=[];saveUI();const W=weekPreview(),d2=W[1];
    weekOpen=true;backStack=[];setView("temas");render();const li=[...document.querySelectorAll('.pwlist li')][1];return {n:d2.items.length,txt:li&&li.textContent,cls:li&&li.classList.contains("pwoff"),cap:projModel().cap,nd:newDaysWeek(),pn:PLAN_N}},T.wd2);
  ok(r7.n===0&&r7.cls&&/folga/.test(r7.txt),name+": a prévia da semana mostra a folga, sem temas: "+r7.txt);
  ok(r7.nd===6&&r7.cap===r7.pn*6&&(()=>true)(),name+": a projeção usa os dias de temas novos ("+r7.cap+")");
  await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
