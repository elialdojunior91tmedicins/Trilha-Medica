const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync('mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
(async()=>{const b=await chromium.launch();const errs=[];
for(const [vw,vh,mob] of [[390,844,true],[1366,900,false]]){
const ctx=await b.newContext({viewport:{width:vw,height:vh},hasTouch:mob,isMobile:mob});await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},5);`);
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('file://'+__dirname+'/preview.html');await p.waitForFunction(()=>typeof saveFac==='function'&&synced&&sampleFn,null,{polling:100});
const click=s=>mob?p.tap(s):p.click(s);const tag=mob?"celular":"computador";
await p.evaluate(()=>{errors=[];const q={enunciado:"Paciente com PA 150/95",alternativas:[{letra:"A",texto:"Normal"},{letra:"B",texto:"HAS estágio 1"}],correta:"B",conceito:"HAS ≥140/90",comentario:"c",alerta:""};
  redo=[{id:"r1",k:"CM-1",d:today(),n:1,q}];rdSaveLocal&&rdSaveLocal();setView("quest");setQSeg("praticar")});await p.waitForTimeout(200);
await click('#rdGo');await p.waitForTimeout(150);await click('.rdplay .alt:nth-child(1)');await p.waitForTimeout(150);
await p.click('.rdplay .ecad .btn');await p.waitForTimeout(150);
ok(/Marquei A\) Normal/.test(await p.inputValue('#ecq-w'))&&/HAS ≥140\/90/.test(await p.inputValue('#ecq-r')),tag+": refazer pré-preenche");
await p.click('.rdplay .ecad button[type=submit]');await p.waitForTimeout(150);
ok(await p.evaluate(()=>errors.length===1&&errors[0].s==="Refazer as que errei"&&errors[0].k==="CM-1"),tag+": salvo do refazer");
ok(/No caderno de erros/.test(await p.$eval('.rdplay',x=>x.textContent)),tag+": confirmação no refazer");
await p.evaluate(()=>{rdRun=null;render()});
// simulado
await p.evaluate(()=>{sampleFn.json=async(input)=>{const n=+input.match(/simulado com (\d+)/)[1];return Array.from({length:n},(_,i)=>({enunciado:"Caso "+i,alternativas:[{letra:"A",texto:"a"},{letra:"B",texto:"b"}],correta:"B",comentario:"com",conceito:"con",alerta:""}))};
  state={"CM-1":{l:1,last:today(),step:0,qt:10,qc:3},"CM-4":{l:1,last:today(),step:0,qt:10,qc:3}};commit()});
await p.waitForTimeout(150);await click('.qsim .seg button:nth-child(1)');await click('#simGo');await p.waitForTimeout(600);
await click('.qsim .alt:nth-child(1)');await p.waitForTimeout(150);await p.click('.qsim .ecad .btn');await p.waitForTimeout(100);await p.click('.qsim .ecad button[type=submit]');await p.waitForTimeout(150);
ok(await p.evaluate(()=>errors.length===2&&errors[1].s==="Simulado misto"),tag+": salvo do simulado");
await click('#simNext');await p.waitForTimeout(150);ok(!(await p.$('.qsim .ecad')),tag+": próxima questão sem formulário");
await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join("|"));await b.close()})();
