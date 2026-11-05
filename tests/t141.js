// t141 (Lote 21, itens 1 e 2): Foco › Registrar tempo (minutos, dia, tipo, vínculo opcional, editar) e conteúdo dentro da disciplina
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],ipad578:[578,820,true],note:[1366,768,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];const ipad=name==="ipad578";
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,screen:ipad?{width:1180,height:820}:undefined,userAgent:ipad?"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)":undefined});
 await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
 await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
 const click=async s=>{await p.evaluate(s=>{const x=document.querySelector(s);if(x)x.scrollIntoView({block:"center"})},s);await (mob?p.tap(s):p.click(s));await p.waitForTimeout(150)};
 await p.evaluate(()=>{fac={sems:[{id:"s6",name:"6º semestre",archived:false}],discs:[
     {id:"d1",semId:"s6",name:"Habilidades Médicas 6",items:["O:o3"],info:{},links:[],div:"sp",sps:[{id:"sp1",name:"Pediatria",items:["O:sp1","O:o1","O:o2"],objs:[]}]}],provas:[],
     own:{sp1:{t:"Pediatria",discId:"d1",spId:"sp1"},o1:{t:"Hidratação na criança",discId:"d1",spId:"sp1",links:[{k:"CM-1",subs:[]}]},o2:{t:"Avaliação dermatológica na criança",discId:"d1",spId:"sp1"},o3:{t:"Prescrição na pediatria",discId:"d1"}}};
   registerOwn();saveFac();foSess=[];foPick={ref:"",mode:"p"};foMoreOpts=true;commit();backStack=[];setView("foco")});await p.waitForTimeout(200);
 /* item 2: disciplina › conteúdos para tocar */
 await p.evaluate(()=>{const x=document.querySelector('#foKind');x.scrollIntoView({block:"center"})});await p.selectOption('#foKind','D');await p.waitForTimeout(150);
 const ch=await p.evaluate(()=>[...document.querySelectorAll('.focont .chip')].map(b=>b.textContent));
 ok(ch[0]==="Disciplina em geral"&&ch.some(t=>/Hidratação/.test(t))&&ch.some(t=>/dermatológica/.test(t))&&ch.some(t=>/Prescrição/.test(t)),name+": ao escolher a disciplina aparecem os conteúdos e 'Disciplina em geral' "+JSON.stringify(ch));
 const hi=await p.evaluate(()=>[...document.querySelectorAll('.focont .chip')].findIndex(b=>/Hidratação/.test(b.textContent)));
 await click(`#foc-${hi-1}`);
 ok(await p.evaluate(()=>foPick.dc==="d1"&&foPick.cr==="O:o1"&&foPick.ref==="T:CM-1"),name+": tocar no conteúdo ligado vincula ao conteúdo e ao tema da residência");
 ok(await p.evaluate(()=>/Conta também em/.test((document.querySelector(".foclk2")||{}).textContent||"")),name+": aviso de que conta também no tema (uma vez só)");
 await p.evaluate(()=>{foStart();foRun.s=Date.now()-30*60000;foRun.t0=Date.now()-30*60000;foFinish()});await p.waitForTimeout(150);
 ok(await p.evaluate(()=>{const x=foSess[0];return x&&x.dc==="d1"&&x.cr==="O:o1"&&x.ref==="T:CM-1"&&x.lab==="Hidratação na criança"}),name+": a sessão do cronômetro guarda disciplina e conteúdo");
 ok(await p.evaluate(()=>discFocusSec(discOf("d1"),foWeekStart())>=1790&&foMat(foSess[0]).lab==="Habilidades Médicas 6"&&foSess.filter(x=>x.ref==="T:CM-1").length===1),name+": conta na disciplina e no tema, uma vez só");
 ok(await p.evaluate(()=>{const g=foGroups(foSess,"mat")[0];return g.lab==="Habilidades Médicas 6"&&g.sub["Hidratação na criança"]>0}),name+": Tempo por matéria mostra o conteúdo dentro da disciplina");
 ok(await p.evaluate(()=>/Hidratação na criança/.test((document.querySelector('.fosubs')||{}).textContent||"")),name+": linha do conteúdo aparece no cartão");
 await click('#foc-g');
 ok(await p.evaluate(()=>foPick.ref==="D:d1"&&!foPick.dc),name+": 'Disciplina em geral' volta para a disciplina");
 /* item 1: Registrar tempo */
 await p.evaluate(()=>{foSetRef("")});await click('#foRegB');
 ok(await p.evaluate(()=>!!document.querySelector('#foAddBox')),name+": 'Registrar tempo' abre o formulário");
 await click('#foAm-30');await click('#foAd-1');await click('#foAt-0');await click('#foAddOk');
 const y=await p.evaluate(()=>fromNum(dnum(today())-1));
 ok(await p.evaluate(y=>{const x=foSess.find(x=>x.m==="x");return x&&x.sec===1800&&x.d===y&&x.tp==="Anki"&&!x.ref},y),name+": 30 min de Anki ontem, sem vínculo");
 ok(await p.evaluate(y=>heroActive(y)&&foDayTotals()[y]===1800,y),name+": o registro conta para a sequência e no total do dia");
 /* tipo próprio fica guardado */
 await click('#foRegB');await click('#foAm-15');await click('#foAtO');await p.fill('#foAtIn','Aula gravada');
 await click('#foaKind-D');
 const di=await p.evaluate(()=>[...document.querySelectorAll('#foAddBox .focont .chip')].findIndex(b=>/dermatológica/.test(b.textContent)));
 await click(`#fac-${di-1}`);await click('#foAddOk');
 ok(await p.evaluate(()=>{const x=foSess.find(x=>x.tp==="Aula gravada");return x&&x.sec===900&&x.dc==="d1"&&x.cr==="O:o2"&&ui.prefs.fotps.includes("Aula gravada")}),name+": tipo escrito à mão guardado e registro ligado ao conteúdo da disciplina");
 await click('#foRegB');
 ok(await p.evaluate(()=>[...document.querySelectorAll('#foAddTs .chip')].some(b=>b.textContent==="Aula gravada")),name+": o tipo novo é oferecido da próxima vez");
 ok(await p.evaluate(()=>{foAdd.min="30";foAdd.tp="Anki";render();return document.querySelector('#foAddOk').textContent==="Registrar 30 min de Anki"}),name+": o botão resume o que vai ser registrado");
 await click('#foAddX');
 /* editar */
 const id=await p.evaluate(()=>foSess.find(x=>x.tp==="Anki").id);await click('#foed-'+id);
 await p.fill('#foAddM','45');await click('#foAddOk');
 ok(await p.evaluate(id=>{const L=foSess.filter(x=>x.id===id);return L.length===1&&L[0].sec===2700&&L[0].tp==="Anki"},id),name+": editar o registro troca os minutos sem duplicar");
 ok(await p.evaluate(()=>{const c=foClean({...foSess.find(x=>x.tp==="Aula gravada")});return c.tp==="Aula gravada"&&c.dc==="d1"&&c.cr==="O:o2"}),name+": tipo, disciplina e conteúdo passam pela limpeza (conta e backup)");
 ok(await p.evaluate(()=>uiSanitize(JSON.parse(JSON.stringify(ui))).prefs.fotps.includes("Aula gravada")),name+": tipos guardados nas preferências");
 /* tempo por tipo no Foco e nas Estatísticas */
 await click('#foBy-tp');
 ok(await p.evaluate(()=>/Tempo por tipo/.test(document.querySelector('#fomh').textContent)&&/Anki/.test(document.querySelector('.fomats').textContent)&&/Cronômetro do Foco/.test(document.querySelector('.fomats').textContent)),name+": Tempo por tipo no Foco");
 await click('#foBy-mat');
 await p.evaluate(()=>{backStack=[];setView("stats")});await p.waitForTimeout(250);
 ok(await p.evaluate(()=>{const x=document.querySelector('#stTp');return !!x&&/Anki/.test(x.textContent)&&/Aula gravada/.test(x.textContent)}),name+": Estatísticas mostram o tempo por tipo");
 await p.evaluate(()=>{backStack=[];setView("foco")});await p.waitForTimeout(150);
 ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral");
 await ctx.close()}
ok(!errs.length,"sem erros de JavaScript "+errs.join(" | "));await b.close()})();
