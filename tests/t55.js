const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync('mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
(async()=>{const b=await chromium.launch();const errs=[];
for(const [vw,vh,mob] of [[390,844,true],[1366,900,false]]){
const ctx=await b.newContext({viewport:{width:vw,height:vh},hasTouch:mob,isMobile:mob});await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},5);`);
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('file://'+__dirname+'/preview.html');await p.waitForFunction(()=>typeof saveFac==='function'&&synced&&sampleFn,null,{polling:100});
const click=s=>mob?p.tap(s):p.click(s);const tag=mob?"celular":"computador";
await p.evaluate(()=>{let c=0;window.__prompts=[];sampleFn.json=async(input)=>{__prompts.push(input);await new Promise(r=>setTimeout(r,50));const n=+input.match(/simulado com (\d+)/)[1];return Array.from({length:n},()=>({enunciado:"Caso "+(++c),alternativas:[{letra:"A",texto:"a"},{letra:"B",texto:"b"}],correta:"B",comentario:"com",conceito:"con",alerta:""}))};
  const D=n=>fromNum(dnum(today())+n);state={"CM-37":{l:1,last:D(-3),qt:10,qc:3,qd:{[D(-3)]:[10,3]}},"CM-34":{l:1,last:D(-3),qt:8,qc:2,qd:{[D(-3)]:[8,2]}}};commit();setView("quest");setQSeg("praticar")});await p.waitForTimeout(200);
// partes
if(mob){ok(await p.evaluate(()=>!document.querySelector('#qkpis').offsetParent&&!!document.querySelector('#simGo').offsetParent),tag+": Praticar mostra só a prática");
  await click('#qSegBar button[data-q="temas"]');await p.waitForTimeout(150);ok(await p.evaluate(()=>!!document.querySelector('#qlistT').offsetParent&&!document.querySelector('#simGo')?.offsetParent),tag+": Temas mostra a lista");
  await click('#qSegBar button[data-q="praticar"]');await p.waitForTimeout(150)}
else ok(await p.evaluate(()=>!!document.querySelector('#qkpis').offsetParent&&!!document.querySelector('#simGo').offsetParent&&!!document.querySelector('#qlistT').offsetParent),tag+": computador mostra tudo");
ok(/Pontos fracos · 2/.test(await p.$eval('.qsim .chips',x=>x.textContent)),tag+": fontes com contagem");
await click('.qsim .seg button:nth-child(1)');await click('#simGo');await p.waitForTimeout(500);
ok(await p.evaluate(()=>sim&&sim.status==="run"&&sim.qs.length===5),tag+": simulado gerado (5)");
ok(await p.evaluate(()=>/Distúrbios da coagulação|Anemias/.test(__prompts[0])&&/1\. Tema/.test(__prompts[0])),tag+": pedido com temas numerados");
await p.evaluate(()=>{sim.shown=Date.now()-90000});
await click('.qsim .alt:nth-child(1)');await p.waitForTimeout(150);const k0=await p.evaluate(()=>sim.qs[0].k);
ok(await p.evaluate(k=>redo.some(x=>x.k===k)&&get(k).qt===(k==="CM-37"?11:9),k0),tag+": errada conta no tema e vai para refazer");
ok(await p.evaluate(()=>Math.round(hist[today()].ts)>=89&&hist[today()].tq===1),tag+": tempo registrado");
for(let i=1;i<5;i++){await click('#simNext');await p.waitForTimeout(80);await p.evaluate(()=>{sim.shown=Date.now()-60000});await click('.qsim .alt:nth-child(2)');await p.waitForTimeout(80)}
await click('#simNext');await p.waitForTimeout(150);
const res=await p.$$eval('.simres .kpi b',a=>a.map(x=>x.textContent));ok(res[0]==="80%"&&/min/.test(res[2]),tag+": resultado "+res.join("|"));
ok(await p.$$eval('.simlist li',a=>a.length)===5,tag+": lista do simulado");
// ritmo
await click('.qsim .btn.primary');await p.evaluate(()=>setQSeg("resumo"));await p.waitForTimeout(150);
const pace=await p.$eval('#qPace',x=>x.textContent);ok(/1min\d\ds/.test(pace)&&/5 cronometradas/.test(pace),tag+": ritmo: "+pace.slice(0,80));
// registro com tempo
await click('#qRegB');await p.fill('#qrq','sepse');await p.waitForTimeout(500);await click('.qrpick');await p.waitForTimeout(120);await p.fill('#qrt','10');await p.fill('#qrc','8');await p.fill('#qrm','30');await click('#qrSave');await p.waitForTimeout(150);
ok(await p.evaluate(()=>hist[today()].tq===15),tag+": registro com tempo");ok(/3min por questão/.test(await p.$eval('#qReg .pnote',x=>x.textContent)),tag+": mostra o ritmo do registro");
await click('#qReg .pnote .link');await p.waitForTimeout(150);ok(await p.evaluate(()=>hist[today()].tq===5),tag+": desfazer tira o tempo");
// encerrar no meio
await p.evaluate(()=>{qReg=null;setQSeg("praticar")});await click('#simGo');await p.waitForTimeout(400);await click('.qsim .alt:nth-child(2)');await p.waitForTimeout(100);await click('.qsim .btn:not(.primary)');await p.waitForTimeout(150);
ok(await p.evaluate(()=>sim.status==="done"&&sim.qs.length===1),tag+": encerrar no meio mostra o resultado das respondidas");
ok(await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=0,tag+": sem rolagem horizontal");
await p.evaluate(()=>{sim=null;render()});await click('#simGo');await p.waitForTimeout(400);await p.screenshot({path:`q5-${mob?"fone":"desk"}.png`});
await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
