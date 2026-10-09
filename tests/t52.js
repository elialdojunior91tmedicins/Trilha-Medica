const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync('mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
(async()=>{const b=await chromium.launch();const errs=[];
const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},5);`);
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('file://'+__dirname+'/preview.html');await p.waitForFunction(()=>typeof saveFac==='function'&&synced,null,{polling:100});
const openN=()=>p.$$eval('.card.today .pcard',a=>a.filter(x=>!x.classList.contains('pmini')).length);
ok(await openN()===0,"tudo fechado no início do dia");
await p.tap('.card.today .pcard:nth-child(1) .psum');await p.waitForTimeout(150);await p.tap('.card.today .pcard:nth-child(1) .psubs li:nth-child(1) input');await p.waitForTimeout(150);
ok(await openN()===1,"tema começado fica aberto");
// simula outro aparelho/recarregar: começado continua aberto sozinho
await p.evaluate(()=>{planOpen={};render()});ok(await openN()===1,"começado abre sozinho (sem toque)");
// residência também
await p.tap('#tabT');await p.waitForTimeout(250);ok(await openN()===1,"Residência: mesmo comportamento");
await p.tap('.card.today .pcard:nth-child(1) .psum');await p.waitForTimeout(150);ok(await openN()===0,"dá para fechar à mão");
await p.tap('.card.today .pcard:nth-child(1) .psum');await p.waitForTimeout(150);
for(const n of [2,3]){await p.tap(`.card.today .pcard:nth-child(1) .psubs li:nth-child(${n}) input`);await p.waitForTimeout(150)}
ok(await p.evaluate(()=>document.querySelector('.card.today .pcard:nth-child(1)').classList.contains('pdone')),"tema concluído");
const st=await p.$eval('.card.today .pcard:nth-child(1)',x=>x.classList.contains('pmini'));ok(st,"concluído fecha sozinho");
ok(!errs.length,"sem erros JS "+errs.join("|"));await b.close()})();
