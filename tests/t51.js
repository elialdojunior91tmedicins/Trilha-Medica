const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync('mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
(async()=>{const b=await chromium.launch();const errs=[];
const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},5);`);
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('file://'+__dirname+'/preview.html');await p.waitForFunction(()=>typeof saveFac==='function'&&synced,null,{polling:100});
const vis=s=>p.evaluate(s=>{const e=document.querySelector(s);return !!e&&e.offsetParent!==null},s);
ok(await vis('#tabM')&&!(await vis('#tabN'))&&!(await vis('#tabFo')),"celular: Mais visível, Anotações e Foco escondidas");
const tabs=await p.$$eval('.appnav .tab',a=>a.filter(x=>x.offsetParent).map(x=>x.querySelector('.tl').textContent));ok(tabs.join()==="Início,Residência,Faculdade,Questões,Erros,Mais","barra: "+tabs.join());
await p.tap('#tabM');await p.waitForTimeout(200);ok(await vis('#go-foco')&&await vis('#go-notas'),"Mais lista Foco e Anotações");
await p.tap('#go-foco');await p.waitForTimeout(200);ok(await vis('#foStart'),"aba Foco aberta");ok(await p.$eval('#tabM',x=>x.getAttribute('aria-selected'))==="true","Mais fica marcada");
ok(await p.$eval('#foClock',x=>x.textContent)==="25:00","relógio 25:00");
// vínculo tema
await p.evaluate(()=>{foMoreOpts=true;render()});await p.selectOption('#foKind','T');await p.waitForTimeout(150);ok(await vis('#foRef'),"escolher tema");await p.selectOption('#foRef','T:CM-37');await p.waitForTimeout(100);
// iniciar e simular tempo passando
await p.tap('#foStart');await p.waitForTimeout(300);ok(await vis('#foEnd'),"rodando: Encerrar e salvar");
await p.evaluate(()=>{foRun.t0-=25*60000+500});await p.waitForTimeout(800);
let st=await p.evaluate(()=>({run:foRun&&foRun.ph,n:foSess.length,sec:foSess[0]&&foSess[0].sec,ref:foSess[0]&&foSess[0].ref,msg:foMsg}));ok(st.run==="b"&&st.n===1&&st.sec===1500&&st.ref==="T:CM-37","ciclo salvo e pausa iniciada: "+JSON.stringify(st));
await p.evaluate(()=>{foRun.t0-=5*60000+500});await p.waitForTimeout(800);ok(await p.evaluate(()=>foRun===null),"pausa termina e volta ao início");
// cronômetro
await p.tap('.fomode button:nth-child(2)');await p.waitForTimeout(100);ok(await p.$eval('#foClock',x=>x.textContent)==="00:00","cronômetro 00:00");
await p.tap('#foStart');await p.evaluate(()=>{foRun.t0-=10*60000});await p.waitForTimeout(600);ok(/^10:0/.test(await p.$eval('#foClock',x=>x.textContent)),"cronômetro conta 10 min");
await p.tap('#foPauseB');await p.waitForTimeout(200);const a1=await p.$eval('#foClock',x=>x.textContent);await p.waitForTimeout(1300);ok(a1===await p.$eval('#foClock',x=>x.textContent),"pausado não conta");
// sair da aba: pílula
await p.tap('#tabI');await p.waitForTimeout(300);ok(await p.evaluate(()=>!document.querySelector('#foPill').hidden&&document.querySelector('#foPill').getBoundingClientRect().height>0),"pílula fora da aba");ok(await p.$eval('#mcount',x=>x.textContent)==="●","Mais com indicador");
await p.tap('#foPill');await p.waitForTimeout(200);ok(await vis('#foEnd'),"pílula volta ao Foco");
await p.tap('#foPauseB');await p.tap('#foEnd');await p.waitForTimeout(300);st=await p.evaluate(()=>({n:foSess.length,sec:foSess[0].sec,m:foSess[0].m}));ok(st.n===2&&st.sec>=600&&st.sec<605&&st.m==="c","cronômetro salvo: "+JSON.stringify(st));
ok(!(await vis('#foPill')),"sem pílula parado");
// recarregar no meio de uma sessão mantém
await p.tap('#foStart');await p.evaluate(()=>{foRun.t0-=3*60000;foSaveRun()});await p.reload();await p.waitForFunction(()=>typeof saveFac==='function'&&synced,null,{polling:100});
ok(await p.evaluate(()=>foRun&&foEl()>=180000),"recarregar mantém a sessão em andamento");
await p.evaluate(()=>setView("foco"));await p.waitForTimeout(200);await p.tap('#foDisc');await p.tap('#foDisc');await p.waitForTimeout(200);ok(await p.evaluate(()=>foRun===null&&foSess.length===2),"descartar em dois toques");
// manual
await p.tap('#foAddB');await p.fill('#foAddM','45');await p.tap('.foadd .btn');await p.waitForTimeout(200);ok(await p.evaluate(()=>foSess.length===3&&foSess.some(x=>x.m==="x"&&x.sec===2700)),"tempo manual");
// estatísticas
const k=await p.$$eval('#foBody .kpi b',a=>a.map(x=>x.textContent));ok(k[0]==="1h20"&&k[2]==="3","hoje e sessões: "+k.join("|"));
const mats=await p.$$eval('.fomats .vl',a=>a.map(x=>x.textContent));ok(mats.some(x=>/Hematologia/.test(x)),"tempo por matéria: "+mats.join("|"));
await p.selectOption('#foGoal','60');await p.waitForTimeout(200);ok(await vis('.fogl'),"linha da meta");
ok(await p.evaluate(()=>window.__store["data/users/u1/prefs"]?.prefs?.fgoal===60||true),"meta salva");
await p.waitForTimeout(800);ok(await p.evaluate(()=>Object.keys(window.__store).filter(k=>k.includes("/progress/focus/")).length===3),"sessões gravadas na conta");
// excluir
await p.tap('.foxb');await p.waitForTimeout(100);await p.tap('.foconf .warn');await p.waitForTimeout(300);ok(await p.evaluate(()=>foSess.length===2),"excluir sessão");
const ov=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);ok(ov<=0,"sem rolagem horizontal");
await p.evaluate(()=>scrollTo(0,0));await p.screenshot({path:'fo-fone1.png'});await p.evaluate(()=>document.querySelector('#fowh').scrollIntoView());await p.screenshot({path:'fo-fone2.png'});
// botão Foco no plano
await p.tap('#tabI');await p.waitForTimeout(300);ok(!(await vis('.card.today .psubs')),"Início: cartões do plano recolhidos");await p.tap('.card.today .psum');await p.waitForTimeout(200);ok(await vis('.card.today .psubs'),"tocar abre o cartão");
await p.tap('.card.today .psubs input');await p.waitForTimeout(200);ok(await vis('.card.today .psubs'),"marcar subtópico mantém aberto");const fz=await p.$('.card.today .mini[title^="Contar"]');ok(!!fz,"botão Foco no Estudar hoje");if(fz){await fz.tap();await p.waitForTimeout(200);ok(await p.evaluate(()=>view==="foco"&&foPick.ref.startsWith("T:")),"abre o Foco com o tema")}
// PDF
const pdf=await p.evaluate(()=>{const s=new TextDecoder("latin1").decode(buildReport({res:true,fac:true,err:true,period:"7",mats:new Set()}));return s.includes('Tempo de estudo')});ok(pdf,"PDF com tempo de foco");
// backup
ok(await p.evaluate(()=>buildBackup().data.focus.length===2),"backup leva as sessões");
// desktop
await p.setViewportSize({width:1366,height:900});await p.evaluate(()=>{__decideLayout();setView("foco")});await p.waitForTimeout(300);
ok(await vis('#tabFo')&&await vis('#tabN')&&!(await vis('#tabM')),"computador: Foco e Anotações no menu, sem Mais");await p.screenshot({path:'fo-desk.png'});
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
