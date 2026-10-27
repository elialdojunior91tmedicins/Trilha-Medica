// t132: Lote 18 › Configurações (seção 11) — configurações em camadas ("Mais opções" em cada cartão), meta e tempo da prova saem do cartão de Questões
// para Configurações (lá só o valor com ✎), perfil por fase do curso (sugestão pelo semestre, ajusta várias opções, "sem marcar atraso" no ciclo clínico)
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
(async()=>{const b=await chromium.launch();const errs=[];
for(const [name,w,h,mob] of [["note",1366,900,false],["fone",390,844,true]]){
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob});
  await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
  await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
  const tap=async sel=>{await p.evaluate(s=>document.querySelector(s).scrollIntoView({block:"center"}),sel);await (mob?p.tap(sel):p.click(sel));await p.waitForTimeout(200)};
  /* 1. camadas */
  let r=await p.evaluate(()=>{goSub("config");render();const vis=[...document.querySelectorAll("#cfBody .cfrow")].filter(x=>!x.closest("details.cfmore")).map(x=>x.querySelector(".cfl b").textContent);
    const more=[...document.querySelectorAll("#cfBody details.cfmore")].map(d=>d.id+":"+d.open+":"+[...d.querySelectorAll(".cfl b, .glabel")].map(x=>x.textContent).join("/"));return {vis,more}});
  ok(["Tema","Tamanho da letra","Temas por dia","Antecedência das provas","Pomodoro","Meta semanal de questões","Tempo da prova"].every(x=>r.vis.includes(x))&&!r.vis.includes("Intervalos das revisões")&&!r.vis.includes("Som ao finalizar"),name+": à vista só o que se usa sempre ("+r.vis.join(", ")+")");
  ok(r.more.length===4&&r.more.every(x=>/:false:/.test(x))&&/cfm-pl:false:.*Intervalos das revisões.*Marcar atraso/.test(r.more.join())&&/cfm-ap:false:Layout/.test(r.more.join()),name+": o resto em Mais opções, fechado ("+r.more.join(" | ")+")");
  await p.evaluate(()=>{const d=document.getElementById("cfm-fo");d.open=true});await p.waitForTimeout(100);
  ok(await p.evaluate(()=>{render();return document.getElementById("cfm-fo").open}),name+": Mais opções lembra se ficou aberto");
  /* 2. meta e tempo da prova: só o valor no cartão de Questões */
  r=await p.evaluate(()=>{goBack();backStack=[];setView("quest");setQSeg("resumo");render();return {sel:!!document.getElementById("qGoalSel")||!!document.getElementById("qPaceSel"),g:(document.getElementById("qGoalEd")||{}).textContent,pc:(document.getElementById("qPaceEd")||{}).textContent}});
  ok(!r.sel&&r.g==="definir meta semanal ✎"&&/^tempo da prova: .+ ✎$/.test(r.pc||""),name+": cartão de Questões sem os seletores; só o valor com ✎ ("+r.g+" · "+r.pc+")");
  await tap('#qGoalEd');r=await p.evaluate(()=>({v:view,cfq:!!document.getElementById("cfQ")}));ok(r.v==="config"&&r.cfq,name+": ✎ leva para Configurações › Questões");
  await p.evaluate(()=>{ui.prefs.qgoal=150;saveUI();backStack=[];setView("quest");setQSeg("resumo");render()});
  ok(await p.evaluate(()=>document.getElementById("qGoalEd").textContent==="meta 150/semana ✎"),name+": com meta, mostra o valor");
  /* 3. fase do curso */
  await p.evaluate(()=>{fac={sems:[{id:"s",name:"6º período",archived:false}],discs:[],provas:[],own:{}};saveFac();goSub("perfil");render()});
  r=await p.evaluate(()=>({sug:[...document.querySelectorAll("#pfPhase .seg button")].map(b=>b.id+":"+b.textContent).join(),txt:document.querySelector("#pfPhase p.how").textContent}));
  ok(/ph-clinico:Ciclo clínico · sugerida/.test(r.sug)&&/sugere Ciclo clínico/.test(r.txt),name+": 6º período: sugere Ciclo clínico");
  await tap('#ph-clinico');
  r=await p.evaluate(()=>{const t=dnum(today());upd("CM-1",x=>{x.last=fromNum(t-20);x.step=0;x.l=1});commit();return {ph:ui.profile.phase,f:ui.prefs.facWin,rw:ui.prefs.resWeek,q:ui.prefs.qgoal,calm:ui.prefs.calm,dc:document.documentElement.dataset.calm,lab:dueLabel(dueIn(get("CM-1"))),how:document.querySelector("#pfPhase .phhow").textContent}});
  ok(r.ph==="clinico"&&r.f===28&&r.rw===1&&r.q===100&&r.calm===true&&r.dc==="1",name+": Ciclo clínico ajusta antecedência, residência garantida, meta e tira o atraso "+JSON.stringify(r));
  ok(/^pendente há \d+ d$/.test(r.lab)&&/A faculdade vem primeiro/.test(r.how),name+": sem marcar atraso: \""+r.lab+"\"");
  r=await p.evaluate(()=>{goSub("config");render();const d=document.getElementById("cfm-pl");d.open=true;const row=[...d.querySelectorAll(".cfrow")].find(x=>/Marcar atraso/.test(x.textContent));[...row.querySelectorAll("button")][0].click();return {calm:ui.prefs.calm,ph:ui.profile.phase,top:document.querySelector(".cfphase").textContent}});
  ok(r.calm===false&&r.ph==="clinico",name+": cada opção continua editável em Configurações (Marcar atraso ligado de novo)");
  r=await p.evaluate(()=>{fac.sems[0].name="11º período";saveFac();setPhase("reta");return {f:ui.prefs.facWin,q:ui.prefs.qgoal,ws:ui.prefs.wsim.join(),sg:phaseSuggest()}});
  ok(r.f===14&&r.q===300&&r.ws==="6"&&r.sg==="reta",name+": Reta final: residência principal, meta maior, sábado de simulado; 11º período sugere Reta final");
  ok(await p.evaluate(()=>{fac.sems[0].name="9º";return phaseSuggest()==="internato"}),name+": 9º período sugere Internato");
  ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral");
  await ctx.close()}
ok(errs.length===0,"sem erros de JavaScript"+(errs.length?": "+errs.slice(0,3).join(" | "):""));
await b.close()})();
