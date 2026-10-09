const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync('mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
(async()=>{const b=await chromium.launch();const errs=[];
for(const [vw,vh,mob] of [[390,844,true],[1366,900,false]]){
const ctx=await b.newContext({viewport:{width:vw,height:vh},hasTouch:mob,isMobile:mob});await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},5);`);
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('file://'+__dirname+'/preview.html');await p.waitForFunction(()=>typeof saveFac==='function'&&synced,null,{polling:100});
const click=s=>mob?p.tap(s):p.click(s);const tag=mob?"celular":"computador";
// dados: CM-37 piorando, CM-34 melhorando, erros em CM-37
await p.evaluate(()=>{const D=n=>fromNum(dnum(today())+n);state={};
  state["CM-37"]={l:1,last:D(-2),qt:30,qc:17,qd:{[D(-2)]:[10,3],[D(-50)]:[20,14]}};
  state["CM-34"]={l:1,last:D(-1),qt:20,qc:15,qd:{[D(-1)]:[10,9],[D(-60)]:[10,6]}};
  errors=[{id:"e1",k:"CM-37",t:"conhecimento",w:"a",r:"b",s:"",d:today()},{id:"e2",k:"CM-37",t:"confusao",w:"a",r:"b",s:"",d:today()}];
  hist={};hist[today()]={q:40,c:30};commit();setView("quest");setQSeg("temas")});await p.waitForTimeout(250);
const ex=await p.$$eval('#qlistT .qrow',a=>a.map(r=>({n:r.querySelector('.qname').textContent,tr:(r.querySelector('.qtr')||{}).textContent||"",er:(r.querySelector('.qer')||{}).textContent||""})));
const r37=ex.find(x=>/coagula/.test(x.n)),r34=ex.find(x=>/Anemias/.test(x.n));
ok(r37&&/▼ 40 pts/.test(r37.tr),tag+": tendência piorando: "+(r37&&r37.tr));ok(r34&&/▲ 30 pts/.test(r34.tr),tag+": tendência melhorando: "+(r34&&r34.tr));
ok(r37&&/2 erros no caderno: 1 não sabia · 1 confundi/.test(r37.er),tag+": erros no tema: "+(r37&&r37.er));
if(mob)await click('#qFBtn');await p.waitForTimeout(100);await click('#qWorseB');await p.waitForTimeout(150);
const n1=await p.$$eval('#qlistT .qname',a=>a.map(x=>x.textContent));ok(n1.length===1&&/coagula/.test(n1[0]),tag+": filtro Piorando");
await click('#qClear');await p.waitForTimeout(150);
await click('#qlistT .qrow .qer');await p.waitForTimeout(200);ok(await p.evaluate(()=>view==="erros"&&eTopicKey==="CM-37"),tag+": erros abre o caderno do tema");
await p.evaluate(()=>setView("quest"));await p.waitForTimeout(150);
// meta semanal
await p.evaluate(()=>setQSeg("resumo"));await p.waitForTimeout(100);
ok(/Defina uma meta/.test(await p.$eval('#qGoal',x=>x.textContent)),tag+": sem meta");
await p.selectOption('#qGoalSel','100');await p.waitForTimeout(150);const gt=await p.$eval('#qGoal',x=>x.textContent);ok(/40de 100|40\s*de 100/.test(gt.replace(/\s+/g," "))||/40/.test(gt)&&/Faltam 60/.test(gt),tag+": meta 100: "+gt.replace(/\s+/g," ").slice(0,120));
// banca no registro
await click('#qRegB');await p.fill('#qrq','anemias');await p.waitForTimeout(500);await click('.qrpick');await p.waitForTimeout(100);
await p.fill('#qrt','20');await p.fill('#qrc','10');await p.fill('#qrb','ENARE');await click('#qrSave');await p.waitForTimeout(200);
ok(await p.evaluate(()=>JSON.stringify(get("CM-34").qb)===JSON.stringify({ENARE:{[today()]:[20,10]}})),tag+": banca gravada");
await p.evaluate(()=>{gen["CM-34"]={status:"done",n:1,qs:[{enunciado:"X",alternativas:[{letra:"A",texto:"a"},{letra:"B",texto:"b"}],correta:"A",comentario:"",conceito:"",alerta:""}],ans:{}};answer(BYKEY["CM-34"],0,"A");render()});await p.waitForTimeout(150);
const src=await p.$$eval('.qsrc .vl',a=>a.map(x=>x.textContent));ok(src.includes("ENARE")&&src.includes("Claude")&&src.includes("Não informado"),tag+": acerto por banca: "+src.join("|"));
await click('#qReg .pnote .link');await p.waitForTimeout(150);ok(await p.evaluate(()=>!(get("CM-34").qb.ENARE||{})[today()]||get("CM-34").qb.ENARE[today()][0]===0),tag+": desfazer tira da banca");
await click('#qRegB');await p.waitForTimeout(100);await click('#qRegB');await p.fill('#qrq','anemias');await p.waitForTimeout(500);await click('.qrpick');await p.waitForTimeout(100);
ok(await p.$eval('#qrb',x=>x.value)==="ENARE",tag+": lembra a última banca");
ok(await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=0,tag+": sem rolagem horizontal");
await p.evaluate(()=>{qReg=null;scrollTo(0,0);render()});await p.screenshot({path:`q4-${mob?"fone":"desk"}.png`,fullPage:true});
await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
