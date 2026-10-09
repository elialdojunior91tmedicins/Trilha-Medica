const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync('mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
(async()=>{const b=await chromium.launch();const errs=[];
for(const [vw,vh,mob] of [[390,844,true],[1366,900,false]]){
const ctx=await b.newContext({viewport:{width:vw,height:vh},hasTouch:mob,isMobile:mob});await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},5);`);
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('file://'+__dirname+'/preview.html');await p.waitForFunction(()=>typeof saveFac==='function'&&synced,null,{polling:100});
const click=s=>mob?p.tap(s):p.click(s);const tag=mob?"celular":"computador";
const seg=async s=>{if(mob)await p.evaluate(s=>{tSeg=s;render()},s);await p.waitForTimeout(120)};
await p.evaluate(()=>{const D=n=>fromNum(dnum(today())+n);state={};
  state["CM-1"]={l:1,last:D(-3),step:0,qt:10,qc:4};state["CM-2"]={l:2,last:D(-1),step:1,qt:12,qc:11};state["CM-6"]={l:3,last:D(-2),step:3};
  for(let i=10;i<22;i++)state["CM-"+i]={l:1,last:D(-1),step:1};// 12 revisões no mesmo dia (daqui a 2 dias)
  ui.prefs.adapt=false;commit();setView("temas")});await seg("lista");
// 1. filtros
const vis=async()=>p.evaluate(()=>[...ALL,...FAC_ITEMS].filter(matches).map(i=>i.key));
await click('#tfl1');await p.waitForTimeout(120);let v=await vis();ok(v.length===13&&v.includes("CM-1"),tag+": situação Estudados ("+v.length+")");
await click('#tfl3');await p.waitForTimeout(120);v=await vis();ok(v.length===14,tag+": Estudados ou Dominados ("+v.length+")");
await click('#tfweak');await p.waitForTimeout(120);v=await vis();ok(v.length===1&&v[0]==="CM-1",tag+": + pontos fracos = só CM-1");
await click('#tfClear');await p.waitForTimeout(120);await p.selectOption('#tfArea','PED');await p.waitForTimeout(150);
ok(await p.evaluate(()=>[...document.querySelectorAll('#areas details.area')].length===1),tag+": filtro de área mostra só Pediatria");
await p.selectOption('#tfSp',await p.evaluate(()=>AREAS.find(a=>a.code==="PED").specs[0].name));await p.waitForTimeout(150);v=await vis();ok(v.length>0&&v.every(k=>k.startsWith("PED")),tag+": especialidade ("+v.length+")");
await click('#tfl0');await click('#tfhigh');await p.waitForTimeout(150);ok(/temas? com esses filtros/.test(await p.$eval('.tfres',x=>x.textContent)),tag+": contagem de resultados");
await click('#tfClear');await p.waitForTimeout(120);
// 2. abas do tema
await p.evaluate(()=>openTopic("CM-1"));await p.waitForTimeout(250);
ok(await p.evaluate(()=>{const d=document.querySelector('#t-CM-1 .detail');return !!d.querySelector('.dsum')&&[...d.children].filter(c=>c.dataset.tab&&!c.hidden).every(c=>c.dataset.tab==="estudo")}),tag+": tema abre na aba Estudo com resumo");
const chips=await p.$$eval('#t-CM-1 .dchip',a=>a.map(x=>x.textContent));ok(chips.length===5&&/40% em 10/.test(chips.join("|")),tag+": resumo "+chips.join(" | "));
await click('#t-CM-1 .dtabs button[data-dt="questoes"]');await p.waitForTimeout(150);ok(await p.isVisible('#qt-CM-1')&&!(await p.isVisible('#t-CM-1 .subs')),tag+": aba Questões");
await click('#t-CM-1 .dtabs button[data-dt="erros"]');await p.waitForTimeout(150);ok(await p.isVisible('#ew-CM-1'),tag+": aba Erros");
await click('#t-CM-1 .dtabs button[data-dt="notas"]');await p.waitForTimeout(150);ok(await p.evaluate(()=>[...document.querySelectorAll('#t-CM-1 .detail>[data-tab="notas"]')].some(x=>!x.hidden)),tag+": aba Anotações");
await p.evaluate(()=>{detTab={};qRowExtra(BYKEY["CM-1"]).querySelector('.link').click()});await p.waitForTimeout(600);ok(await p.evaluate(()=>detTab["CM-1"]==="erros"&&!!document.getElementById("ew-CM-1").offsetParent),tag+": '+ erro' da aba Questões abre a aba Erros do tema");
// 3. agenda
await p.evaluate(()=>{openKey=null;setView("temas")});await seg("rev");await p.waitForTimeout(150);
const ag=await p.$$eval('#revAgenda .agday',a=>a.map(x=>x.querySelector('.agn').textContent));ok(ag.length===14&&ag[2]==="13",tag+": agenda com 13 revisões em 2 dias: "+ag.join(","));
ok(await p.isVisible('#agBal'),tag+": botão Equilibrar");
await click('#agBal');await p.waitForTimeout(200);const ag2=await p.$$eval('#revAgenda .agday',a=>a.map(x=>+x.querySelector('.agn').textContent||0));
const cap=await p.evaluate(()=>agCap(agDays()));ok(Math.max(...ag2)<=cap&&ag2.reduce((a,b)=>a+b,0)===ag.reduce((a,b)=>a+(+b||0),0),tag+": equilibrado (máx "+cap+"): "+ag2.join(","));
ok(await p.evaluate(()=>[...ALL].filter(i=>get(i.key).adj!==undefined).every(i=>Math.abs(get(i.key).adj)<=3)),tag+": ajustes de no máximo 3 dias");
await p.evaluate(()=>{const k=[...ALL].find(i=>get(i.key).adj!==undefined).key;reviewTopic(k,true);window.__k=k});ok(await p.evaluate(()=>get(__k).adj===undefined),tag+": revisar limpa o ajuste");
await click('#revAgenda .agday:nth-child(3)');await p.waitForTimeout(150);ok(await p.$$eval('#revAgenda .aglist li',a=>a.length)>=1,tag+": tocar no dia lista os temas");
// 4. já estudei antes
await seg("lista");await click('#bulkB');await p.waitForTimeout(150);ok(await p.evaluate(()=>!!bulk&&tf.lv.has(0)),tag+": modo de marcação liga o filtro de não iniciados");
await p.evaluate(()=>{openAreas.add("PED");render()});await p.waitForTimeout(100);
const bal=await p.$('#areas .bulkall button');if(!bal){await p.evaluate(()=>{const sp=AREAS.find(a=>a.code==="PED").specs[0];openSpecs.add("PED:"+sp.name);render()});await p.waitForTimeout(100)}
await click('#areas .bulkall button');await p.waitForTimeout(150);const n=await p.evaluate(()=>bulk.sel.size);ok(n>=3,tag+": selecionar a especialidade inteira ("+n+")");
await click('#bulkOk');await p.waitForTimeout(200);
const r=await p.evaluate(()=>{const ks=bulkUndo.keys;const due=ks.map(k=>dueIn(get(k)));return {n:ks.length,min:Math.min(...due),max:Math.max(...due),lv:ks.every(k=>get(k).l===1),e:(hist[today()]||{}).e||0}});
ok(r.n===n&&r.min===1&&r.lv&&r.e===0,tag+": marcados como estudados, 1ª revisão a partir de amanhã, sem contar como estudo de hoje: "+JSON.stringify(r));
ok(r.max===Math.ceil(n/(await p.evaluate(()=>bulkCap()))),tag+": revisões espalhadas em vários dias");
await click('#bulkBar .link');await p.waitForTimeout(150);ok(await p.evaluate(()=>bulkUndo===null&&ALL.filter(i=>i.key.startsWith("PED")&&get(i.key).last).length===0),tag+": desfazer");
ok(await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=0,tag+": sem rolagem horizontal");
await p.evaluate(()=>{openTopic("CM-1");});await p.waitForTimeout(250);await p.screenshot({path:`res-${mob?"fone":"desk"}.png`});
await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
