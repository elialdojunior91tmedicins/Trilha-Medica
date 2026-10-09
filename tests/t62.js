const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync('mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
(async()=>{const b=await chromium.launch();const errs=[];
for(const [vw,vh,mob] of [[390,844,true],[1366,900,false]]){
const ctx=await b.newContext({viewport:{width:vw,height:vh},hasTouch:mob,isMobile:mob});await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},5);`);
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('file://'+__dirname+'/preview.html');await p.waitForFunction(()=>typeof saveFac==='function'&&synced,null,{polling:100});
const click=s=>mob?p.tap(s):p.click(s);const tag=mob?"celular":"computador";
await p.evaluate(()=>{const D=n=>fromNum(dnum(today())+n);state={"CM-1":{l:1,last:D(-1),step:0}};
  notes={"CM-1":"## Resumo\n- PA ≥ 140/90\n> MAPA confirma\n| A | B |\n|---|---|\n| 1 | 2 |","CM-4":"Curto","CM-6":"Texto médio com várias palavras para ficar maior que os outros dois textos aqui"};
  noteAt={"CM-1":new Date().toISOString(),"CM-4":"2026-01-01T10:00:00.000Z","CM-6":new Date(Date.now()-86400000).toISOString()};
  errors=[{id:"e1",k:"CM-1",t:"conhecimento",w:"marquei 130/80",r:"é 140/90",s:"",d:today()}];commit();setView("notas");setNSeg("todas")});await p.waitForTimeout(200);
const names=()=>p.$$eval('#nlist .ncard .etopic',a=>a.map(x=>x.textContent));
// 6. filtros e ordem
await click('#nFlags [data-nf="week"]');await p.waitForTimeout(120);ok((await names()).length===2,tag+": editadas nesta semana");
await click('#nFlags [data-nf="week"]');await click('#nFlags [data-nf="tab"]');await p.waitForTimeout(120);ok((await names()).length===1,tag+": com tabela");
await click('#nFlags [data-nf="tab"]');await click('#nFlags [data-nf="peg"]');await p.waitForTimeout(120);ok((await names()).length===1,tag+": com pegadinhas");
await click('#nFlags [data-nf="peg"]');await p.selectOption('#nSortSel','big');await p.waitForTimeout(120);const n1=await names();ok(n1[0]===await p.evaluate(()=>BYKEY["CM-1"].t)||n1[0]===await p.evaluate(()=>BYKEY["CM-6"].t),tag+": maiores primeiro: "+n1[0]);
await p.selectOption('#nSortSel','recent');await p.waitForTimeout(120);ok((await names())[0]===await p.evaluate(()=>BYKEY["CM-1"].t),tag+": mais recentes");await p.selectOption('#nSortSel','sp');
// 7. erros junto
ok(/1 erro no caderno deste tema/.test(await p.$eval('#nlist',x=>x.textContent)),tag+": erros junto da anotação");
// 8. caderno livre
await click('#frNew');await p.fill('#frT','Aula de cardio');await p.fill('#frB','# IAM\n> troponina em 3 h');await p.fill('#frTags','aula, cardio');
await p.fill('#frQ','hipertens');await p.waitForTimeout(500);await click('.frres .qrpick');await p.waitForTimeout(120);await click('#frSave');await p.waitForTimeout(200);
const f=await p.evaluate(()=>freeN[0]);ok(f&&f.t==="Aula de cardio"&&f.tags.join()==="aula,cardio"&&f.ks.includes("CM-1"),tag+": anotação livre salva: "+JSON.stringify(f&&{t:f.t,tags:f.tags,ks:f.ks}));
ok(await p.isVisible('.nfree .chip:has-text("#aula")'),tag+": etiquetas viram filtro");
await p.waitForTimeout(800);ok(await p.evaluate(()=>Object.keys(window.__store).some(k=>k.includes("/progress/free/"))),tag+": gravada na conta");
await p.evaluate(()=>{detTab["CM-1"]="notas";openTopic("CM-1")});await p.waitForTimeout(250);ok(/Do caderno livre · 1/.test(await p.$eval('#t-CM-1',x=>x.textContent)),tag+": aparece dentro do tema ligado");
await p.evaluate(()=>{setView("notas");setNSeg("todas")});await p.waitForTimeout(150);
await click('#fr-'+f.id+' .efoot .mini:nth-child(2)');await p.fill('#frT','Aula de cardiologia');await click('#frSave');await p.waitForTimeout(150);ok(await p.evaluate(()=>freeN.length===1&&freeN[0].t==="Aula de cardiologia"),tag+": editar");
await p.fill('#nq','troponina');await p.waitForTimeout(500);ok(await p.$$eval('.nfree .ncard',a=>a.length)===1,tag+": busca inclui o caderno livre");await p.fill('#nq','');await p.waitForTimeout(400);
// 5. PDF
const pdf=await p.evaluate(()=>{const s=new TextDecoder("latin1").decode(notesPDF(["CM-1","CM-6"],freeN));return {ok:s.startsWith("%PDF"),cad:s.includes("Caderno livre"),tema:s.includes("Hipertens")}});ok(pdf.ok&&pdf.cad&&pdf.tema,tag+": PDF das anotações "+JSON.stringify(pdf));
ok(await p.isVisible('#nPdf'),tag+": botão Baixar PDF");
await click('#fr-'+f.id+' .efoot .mini:last-child');await click('#fr-'+f.id+' .efoot .mini:last-child');await p.waitForTimeout(200);ok(await p.evaluate(()=>freeN.length===0),tag+": excluir em dois toques");
ok(await p.evaluate(()=>buildBackup().data.free!==undefined),tag+": backup tem o caderno livre");
ok(await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=0,tag+": sem rolagem horizontal");
await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
