const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync('mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
(async()=>{const b=await chromium.launch();const errs=[];
for(const [vw,vh,mob] of [[390,844,true],[1366,900,false]]){
const ctx=await b.newContext({viewport:{width:vw,height:vh},hasTouch:mob,isMobile:mob});await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},5);`);
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('file://'+__dirname+'/preview.html');await p.waitForFunction(()=>typeof saveFac==='function'&&synced,null,{polling:100});
const click=s=>mob?p.tap(s):p.click(s);const tag=mob?"celular":"computador";const seg=async s=>{if(mob)await p.evaluate(s=>{tSeg=s;render()},s);await p.waitForTimeout(120)};
await p.evaluate(()=>{const D=n=>fromNum(dnum(today())+n);state={"CM-1":{l:1,last:D(-1),step:0}};commit();setView("temas")});await seg("hoje");
const before=await p.evaluate(()=>JSON.stringify(state)+today());
await click('#weekBox summary');await p.waitForTimeout(300);
const rows=await p.$$eval('.pwlist li',a=>a.map(x=>x.textContent));ok(rows.length===6,tag+": prévia com 6 dias");
const keys=await p.evaluate(()=>weekPreview().flatMap(d=>d.items.map(x=>x.k)));ok(new Set(keys).size===keys.length&&keys.length>=15,tag+": temas diferentes a cada dia ("+keys.length+")");
ok(await p.evaluate(()=>!weekPreview().flatMap(d=>d.items.map(x=>x.k)).some(k=>ensurePlan().items.some(p=>p.k===k))),tag+": não repete os temas de hoje");
ok(/revis/.test(rows.join(" ")),tag+": mostra revisões dos dias: "+rows[0].slice(0,80));
ok(await p.evaluate(()=>JSON.stringify(state)+today())===before,tag+": a prévia não altera nada");
ok(await p.evaluate(()=>!document.querySelector('#iToday .pweek')||!document.querySelector('#iToday .pweek').offsetParent),tag+": prévia só na Residência");
// fixados
await p.evaluate(()=>openTopic("CM-37"));await p.waitForTimeout(200);await click('#t-CM-37 .dpin');await p.waitForTimeout(150);
ok(await p.evaluate(()=>get("CM-37").pin===1),tag+": fixar pelo tema");ok(/★/.test(await p.$eval('#t-CM-37 .topic',x=>x.textContent)),tag+": estrela na linha");
await seg("lista");ok(await p.isVisible('#pinBox'),tag+": seção Fixados");ok((await p.$$eval('#pinBox li',a=>a.length))===1,tag+": 1 fixado");
await click('#tfpin');await p.waitForTimeout(150);ok(await p.evaluate(()=>[...ALL,...FAC_ITEMS].filter(matches).length===1),tag+": filtro Fixados");await click('#tfClear');
await click('#pinBox .pinx');await p.waitForTimeout(150);ok(await p.evaluate(()=>!get("CM-37").pin&&document.getElementById("pinBox").hidden),tag+": desafixar");
ok(await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=0,tag+": sem rolagem horizontal");
await p.evaluate(()=>{togglePin("CM-4");setView("temas")});await seg("hoje");await p.evaluate(()=>{weekOpen=true;render()});await p.waitForTimeout(200);await p.evaluate(()=>document.querySelector('#weekBox').scrollIntoView());await p.screenshot({path:`wk-${mob?"fone":"desk"}.png`});
await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
