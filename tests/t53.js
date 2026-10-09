const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync('mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
(async()=>{const b=await chromium.launch();const errs=[];
for(const [vw,vh,mob] of [[390,844,true],[1366,900,false]]){
const ctx=await b.newContext({viewport:{width:vw,height:vh},hasTouch:mob,isMobile:mob});await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},5);`);
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('file://'+__dirname+'/preview.html');await p.waitForFunction(()=>typeof saveFac==='function'&&synced,null,{polling:100});
const click=s=>mob?p.tap(s):p.click(s);const tag=mob?"celular":"computador";
await p.evaluate(()=>setView("quest"));await p.waitForTimeout(200);
// registro rápido
await click('#qRegB');await p.waitForTimeout(150);await p.fill('#qrq','sepse');await p.waitForTimeout(500);
const nres=await p.$$eval('.qrpick',a=>a.length);ok(nres>=1,tag+": busca de tema ("+nres+")");
const k=await p.evaluate(()=>{const t=document.querySelector('.qrpick b').textContent;return [...ALL,...FAC_ITEMS].find(i=>i.t===t).key});
await click('.qrpick');await p.waitForTimeout(150);await p.fill('#qrt','20');await p.fill('#qrc','15');await click('#qrSave');await p.waitForTimeout(200);
let s=await p.evaluate(k=>({qt:get(k).qt,qc:get(k).qc,qd:get(k).qd[today()],h:hist[today()]}),k);ok(s.qt===20&&s.qc===15&&s.qd[0]===20&&s.h.q===20,tag+": registro salvo "+JSON.stringify(s));
ok(await p.evaluate(()=>document.activeElement&&document.activeElement.id==="qrq"),tag+": volta para a busca");
await click('#qReg .pnote .link');await p.waitForTimeout(150);s=await p.evaluate(k=>({qt:get(k).qt||0,h:hist[today()].q||0}),k);ok(s.qt===0&&s.h===0,tag+": desfazer");
// registro com dia anterior e validação
await p.fill('#qrq','sepse');await p.waitForTimeout(500);await click('.qrpick');await p.waitForTimeout(100);await p.fill('#qrt','10');await p.fill('#qrc','12');await click('#qrSave');await p.waitForTimeout(150);
ok(await p.$eval('#qReg .err',x=>/acertos/.test(x.textContent)),tag+": acertos maior que feitas é recusado");
const ont=await p.evaluate(()=>fromNum(dnum(today())-1));await p.fill('#qrc','6');await p.fill('#qrd',ont);await click('#qrSave');await p.waitForTimeout(200);
ok(await p.evaluate(([k,o])=>JSON.stringify(get(k).qd[o])==="[10,6]",[k,ont]),tag+": registro em outro dia");
// refazer: errar uma questão gerada
await p.evaluate(k=>{gen[k]={status:"done",n:2,qs:[{enunciado:"Caso A",alternativas:[{letra:"A",texto:"x"},{letra:"B",texto:"y"}],correta:"B",comentario:"c",conceito:"k",alerta:""},{enunciado:"Caso B",alternativas:[{letra:"A",texto:"x"},{letra:"B",texto:"y"}],correta:"A",comentario:"",conceito:"",alerta:""}],ans:{}};answer(BYKEY[k],0,"A");answer(BYKEY[k],1,"A");render()},k);
ok(await p.evaluate(()=>redo.length===1&&redo[0].q.enunciado==="Caso A"),tag+": errada vai para refazer, certa não");
await p.waitForTimeout(400);ok(await p.evaluate(()=>Object.keys(window.__store).some(x=>x.includes("/progress/redo/"))),tag+": gravada na conta");
await p.evaluate(()=>{setView("quest")});await p.waitForTimeout(200);await p.evaluate(()=>setQSeg("praticar"));await p.waitForTimeout(100);ok(/1/.test(await p.$eval('#rdGo',x=>x.textContent)),tag+": botão refazer");
const qt0=await p.evaluate(k=>get(k).qt,k);
await click('#rdGo');await p.waitForTimeout(150);await click('.rdplay .alt:nth-child(1)');await p.waitForTimeout(150);
ok(await p.evaluate(()=>redo[0].n===2),tag+": errou de novo, continua (2×)");ok(await p.evaluate(k=>get(k).qt,k)===qt0,tag+": refazer não muda o acerto do tema");
await click('#rdNext');await p.waitForTimeout(150);await click('.rdplay .btn.primary');await p.waitForTimeout(150);
await click('#rdGo');await p.waitForTimeout(150);await click('.rdplay .alt:nth-child(2)');await p.waitForTimeout(200);ok(await p.evaluate(()=>redo.length===0),tag+": acertou, saiu da lista");
await click('#rdNext');await p.waitForTimeout(150);ok(/1 de 1/.test(await p.$eval('.rdplay .verdict',x=>x.textContent)),tag+": resultado final");await click('.rdplay .btn.primary');
// onde ganhar pontos
const g=await p.$$eval('.qglist li',a=>a.length);ok(g===6,tag+": onde ganhar pontos lista 6 ("+g+")");
const first=await p.$eval('.qglist li .qgt',x=>x.textContent);ok(await p.evaluate(t=>{const it=ALL.find(i=>i.t===t);return wOf(it)===3},first),tag+": primeiro é de incidência muito alta: "+first);
await p.evaluate(()=>{qArea="CM";qSpec="Cardiologia";render()});await p.waitForTimeout(150);ok(await p.$$eval('.qglist .qgs',a=>a.every(x=>x.textContent.includes("Cardiologia"))),tag+": segue os filtros");
await p.evaluate(()=>{qArea="all";qSpec="all";render()});
await click('.qglist li:first-child .mini');await p.waitForTimeout(200);ok(await p.evaluate(()=>!!qReg&&!!qReg.k),tag+": Registrar a partir da prioridade");
// evolução
await p.evaluate(()=>setQSeg("resumo"));await p.waitForTimeout(100);
ok(await p.$$eval('#qEvo .qebar',a=>a.length)>=1,tag+": gráfico de evolução");
ok(await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=0,tag+": sem rolagem horizontal");
await p.evaluate(()=>{qReg=null;scrollTo(0,0);render()});await p.screenshot({path:`q3-${mob?"fone":"desk"}.png`,fullPage:true});
await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
