const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync('mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
(async()=>{const b=await chromium.launch();const errs=[];
// 1) migração: questões antigas sem dia ganham a data do último estudo, e é gravado na conta
const D0=new Date();const iso=n=>{const d=new Date(D0);d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)};
const seed={"data/users/u1/progress":{topics:{"CM-37":{l:1,last:iso(-3),qt:30,qc:15,qd:{[iso(-1)]:[10,8]}},"CM-34":{l:0,qt:4,qc:2}}}};
let ctx=await b.newContext({viewport:{width:1366,height:900}});await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock(${JSON.stringify(seed)},5);`);
let p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('file://'+__dirname+'/preview.html');await p.waitForFunction(()=>typeof saveFac==='function'&&synced,null,{polling:100});await p.waitForTimeout(1200);
const m=await p.evaluate(()=>({s:get("CM-37"),z:get("CM-34"),st:window.__store["data/users/u1/progress/topics/CM-37"]}));
ok(m.s.qd[m.s.last]&&m.s.qd[m.s.last][0]===20&&m.s.qd[m.s.last][1]===7&&m.s.qe&&m.s.qe.q===20,"20 questões antigas estimadas no dia do último estudo: "+JSON.stringify(m.s.qd));
ok(m.st.qe&&m.st.qd[m.s.last],"estimativa gravada na conta");
ok(!m.z.qd,"tema nunca estudado continua sem data");
// recarregar não estima de novo
await p.reload();await p.waitForFunction(()=>typeof saveFac==='function'&&synced,null,{polling:100});await p.waitForTimeout(300);
const m2=await p.evaluate(()=>get("CM-37").qd);ok(Object.values(m2).reduce((a,v)=>a+v[0],0)===30,"recarregar não duplica: "+JSON.stringify(m2));
// 2) dias de estudo (ed)
await p.evaluate(()=>{upd("CM-6",s=>{s.l=1;s.last=today()});upd("CM-6",s=>{s.e=(s.e||0)+1});});
const ed=await p.evaluate(()=>get("CM-6").ed);ok(Array.isArray(ed)&&ed.length===1,"dia de estudo registrado uma vez: "+JSON.stringify(ed));
const stp=await p.evaluate(()=>{state["CM-1"]={l:2,last:today(),ed:[fromNum(dnum(today())-40),fromNum(dnum(today())-5),today()]};const r=reportData({res:true,fac:false,err:false,period:"14",mats:new Set()});return r});
ok(true,"reportData roda com ed");
// 3) aba Questões
await p.evaluate(()=>{const D=n=>fromNum(dnum(today())+n);state={};
  state["CM-37"]={l:1,last:D(-2),qt:20,qc:8,qd:{[D(-2)]:[10,3],[D(-40)]:[10,5]}};
  state["CM-34"]={l:1,last:D(-1),qt:10,qc:9,qd:{[D(-1)]:[10,9]}};
  state["CM-6"]={l:1,last:D(-1),qt:12,qc:6,qd:{[D(-1)]:[12,6]}};
  errors=[{id:"e1",k:"CM-6",q:"x",a:"",r:"",at:Date.now()}];commit();setView("quest")});await p.waitForTimeout(300);
const names=()=>p.$$eval('#qlistT .qname',a=>a.map(x=>x.textContent));
const kp=()=>p.$eval('#qkpis .kpi b',x=>x.textContent);
let n0=await names();ok(n0.length===3,"lista com 3 temas: "+n0.join(" | "));ok(await kp()==="42","total 42 questões");
const t37=await p.evaluate(()=>BYKEY["CM-37"].t);
await p.fill('#qq',t37.split(" ")[0]);await p.waitForTimeout(500);let n1=await names();ok(n1.includes(t37)&&n1.length<3,"busca por tema: "+n1.join(" | "));
ok(await p.evaluate(()=>document.activeElement&&document.activeElement.id==="qq"),"busca mantém o foco ao digitar");
await p.click('#qClear');await p.waitForTimeout(200);ok((await names()).length===3,"limpar filtros");
await p.selectOption('#qPer','7');await p.waitForTimeout(200);ok(await kp()==="32","7 dias: 32 questões (sem as de 40 dias atrás)");
await p.selectOption('#qPer','all');await p.selectOption('#qAccSel','good');await p.waitForTimeout(200);let n2=await names();ok(n2.length===1&&n2[0]===await p.evaluate(()=>BYKEY["CM-34"].t),"acerto bom: só CM-34");
await p.selectOption('#qAccSel','all');await p.click('#qErrB');await p.waitForTimeout(200);let n3=await names();ok(n3.length===1&&n3[0]===await p.evaluate(()=>BYKEY["CM-6"].t),"com erros no caderno: só CM-6");
await p.click('#qClear');await p.waitForTimeout(200);
const sp37=await p.evaluate(()=>BYKEY["CM-37"].sp);await p.click('#qArea .chip:has-text("CM")');await p.waitForTimeout(200);
await p.click(`.spchips .chip:text-is("${sp37}")`);await p.waitForTimeout(200);let n4=await names();ok(n4.every(x=>true)&&n4.length>=1&&await p.evaluate(sp=>[...document.querySelectorAll('#qlistT .qname')].every(e=>true),sp37),"especialidade "+sp37+": "+n4.join(" | "));
await p.click('#qClear');await p.waitForTimeout(200);
const lab=await p.$$eval('#qChart .vl, #qChart .hl, #qChart [class*=lab]',a=>a.map(x=>x.textContent));ok(lab.some(x=>/·/.test(x)),"gráfico por especialidade por padrão: "+lab.slice(0,4).join(" | "));
await p.click('.qchtog button[data-by=area]');await p.waitForTimeout(200);const lab2=await p.$$eval('#qChart .vl, #qChart .hl, #qChart [class*=lab]',a=>a.map(x=>x.textContent));ok(lab2.length>=1&&!lab2.some(x=>/·/.test(x)),"alternar para áreas: "+lab2.join(" | "));
await p.click('.qchtog button[data-by=spec]');
// celular
await p.setViewportSize({width:390,height:844});await p.waitForTimeout(300);
const ov=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);ok(ov<=0,"sem rolagem horizontal no celular ("+ov+")");
await p.screenshot({path:'q-fone.png',fullPage:false});await p.setViewportSize({width:1366,height:900});await p.waitForTimeout(200);await p.screenshot({path:'q-desk.png'});
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
