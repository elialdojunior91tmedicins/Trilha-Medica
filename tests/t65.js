const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync('mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
(async()=>{const b=await chromium.launch();const errs=[];
for(const [vw,vh,mob] of [[390,844,true],[1366,900,false]]){
const ctx=await b.newContext({viewport:{width:vw,height:vh},hasTouch:mob,isMobile:mob});await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},5);`);
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('file://'+__dirname+'/preview.html');await p.waitForFunction(()=>typeof saveFac==='function'&&synced,null,{polling:100});
const click=s=>mob?p.tap(s):p.click(s);const tag=mob?"celular":"computador";
await p.evaluate(()=>{const D=n=>fromNum(dnum(today())+n);
  errors=[{id:"a1",k:"CM-1",t:"conhecimento",w:"marquei 130/80",r:"é 140/90",s:"ENARE",d:D(-3)},
    {id:"a2",k:"CM-1",t:"confusao",w:"confundi MAPA",r:"MAPA confirma",s:"",d:D(-10),rev:1,lastRev:D(-5)},
    {id:"a3",k:"CM-4",t:"interpretacao",w:"li errado",r:"era EXCETO",s:"",d:D(-20),box:2,due:D(5)},
    {id:"a4",k:"CM-6",t:"conhecimento",w:"não sabia",r:"dose X",s:"",d:D(-40),miss:3,box:0,due:D(0)}];commit();setView("erros")});await p.waitForTimeout(200);
// 1. revisão ativa
const dueN=await p.evaluate(()=>eDueList().length);ok(dueN===3,tag+": 3 erros para hoje (antigos migram pela data) "+dueN);
ok(/3 para hoje/.test(await p.$eval('.erev .todaydate',x=>x.textContent)),tag+": contador no cartão");
ok(/Revisar 3 erros/.test(await p.$eval('#erGo',x=>x.textContent)),tag+": botão revisar");
await click('#erGo');await p.waitForTimeout(150);
ok(await p.evaluate(()=>!document.querySelector('.erfc .fca').offsetParent),tag+": correto escondido");
await click('#erShow');await p.waitForTimeout(100);ok(await p.evaluate(()=>!!document.querySelector('.erfc .fca').offsetParent),tag+": mostra o correto");
const id1=await p.evaluate(()=>erRun.ids[0]);await click('#erGood');await p.waitForTimeout(100);
const e1=await p.evaluate(id=>{const e=errors.find(x=>x.id===id);return {box:e.box,due:e.due,rev:e.rev,dd:dnum(e.due)-dnum(today())}},id1);ok(e1.dd>=3&&e1.rev>=1,tag+": Agora sei adia "+JSON.stringify(e1));
await click('#erShow');await click('#erBad');await p.waitForTimeout(100);
const id2=await p.evaluate(()=>erRun.ids[1]);const e2=await p.evaluate(id=>{const e=errors.find(x=>x.id===id);return {box:e.box,dd:dnum(e.due)-dnum(today()),miss:e.miss}},id2);ok(e2.box===0&&e2.dd===1&&e2.miss>=1,tag+": Ainda erraria volta amanhã "+JSON.stringify(e2));
await click('#erShow');await click('#erGood');await p.waitForTimeout(100);ok(/Fim: você já sabe 2 de 3/.test(await p.$eval('.erev',x=>x.textContent)),tag+": fim da sessão");
await click('.erev .btn.primary');await p.waitForTimeout(100);ok(/Nenhum erro para revisar hoje/.test(await p.$eval('.erev',x=>x.textContent)),tag+": nada mais hoje");
ok(await p.evaluate(()=>Object.keys(__store).filter(k=>/progress\/errors\//.test(k)).length>=3),tag+": salvo na conta");
// 2. registrar na aba
await click('#eRegB');await p.waitForTimeout(100);await p.fill('#erq','hipertens');await p.waitForTimeout(450);
const picks=await p.$$eval('#eReg .qrpick b',a=>a.map(x=>x.textContent));ok(picks.length>0,tag+": busca de tema "+picks[0]);
await click('#eReg .qrpick');await p.waitForTimeout(100);await p.fill('#erg-w','errei X');await p.fill('#erg-r','certo Y');await p.selectOption('#erg-t','confusao');await click('#eReg button[type=submit]');await p.waitForTimeout(150);
const ne=await p.evaluate(()=>{const e=errors[errors.length-1];return {...e,dd:dnum(e.due)-dnum(today())}});ok(ne.w==="errei X"&&ne.t==="confusao"&&ne.box===0&&ne.dd===1,tag+": erro registrado com revisão amanhã");
ok(/Salvo no caderno/.test(await p.$eval('#eReg',x=>x.textContent)),tag+": confirmação e segue no mesmo tema");
await click('#eReg .dhead .link');
// 3. repetidos + gráfico
ok(await p.evaluate(()=>!!document.querySelector('.erep')),tag+": cartão erros que se repetem");
const rep=await p.$eval('.erep',x=>x.textContent);ok(/2 erros/.test(rep)||/3 erros/.test(rep),tag+": tema repetido");ok(/ainda erraria" 3×/.test(rep)||/ainda erraria" 4×/.test(rep),tag+": erro teimoso");
ok(await p.$$eval('.ewk .ewcol',a=>a.length)===8,tag+": gráfico 8 semanas");
// 4. cartão e anotação
await p.evaluate(()=>{eOrder="new";render()});
const before=await p.evaluate(()=>cards.length);await p.evaluate(()=>{document.querySelector('#elist .ecard .emenu').click()});await p.evaluate(()=>{[...document.querySelectorAll('#elist .ecard .mini')].find(b=>b.textContent==="Virar cartão").click()});await p.waitForTimeout(100);
ok(await p.evaluate(()=>cards.length)===before+1,tag+": virou cartão");ok(await p.evaluate(()=>[...document.querySelectorAll('#elist .mini')].some(b=>b.textContent==="Cartão criado ✓")),tag+": marca cartão criado");
await p.evaluate(()=>{notes["CM-4"]="## Resumo\n- a\n\n## Meus erros\n- antigo\n\n## Outra\n- b";const e=errors.find(x=>x.id==="a3");eToNote(e);eToNote(errors.find(x=>x.id==="a1"))});
const n4=await p.evaluate(()=>notes["CM-4"]),n1=await p.evaluate(()=>notes["CM-1"]);
ok(/## Meus erros\n- antigo\n- era EXCETO \(errei: li errado\)\n\n## Outra/.test(n4),tag+": insere na seção existente "+JSON.stringify(n4));
ok(/## Meus erros\n- é 140\/90/.test(n1),tag+": cria a seção");
// próximo passo no Início
await p.evaluate(()=>{const e=errors.find(x=>x.id==="a3");e.due=today();state={};commit();setView("inicio")});await p.waitForTimeout(150);
ok(await p.evaluate(()=>nextSteps().some(s=>s.kind==="errs")),tag+": Início sugere revisar erros");
await p.screenshot({path:`er-${mob?"fone":"desk"}-ini.png`});
await p.evaluate(()=>setView("erros"));await p.waitForTimeout(150);await p.screenshot({path:`er-${mob?"fone":"desk"}.png`,fullPage:true});
ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),tag+": sem rolagem lateral");
await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join("|"));await b.close()})();
