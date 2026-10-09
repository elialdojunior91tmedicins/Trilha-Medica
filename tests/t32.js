const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync('mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DV={celular:{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2},tablet:{viewport:{width:820,height:1180},isMobile:true,hasTouch:true},notebook:{viewport:{width:1366,height:800}},janela:{viewport:{width:900,height:800}}};
(async()=>{const b=await chromium.launch();
for(const [name,opt] of Object.entries(DV)){const ctx=await b.newContext(opt);await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},5);`);
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+__dirname+'/preview.html');await p.waitForFunction(()=>typeof saveFac==='function',null,{polling:100});await p.waitForTimeout(200);
 const phone=name==="celular";
 ok(await p.isVisible('#cfgBtn')&&!(await p.$('#tabH')),`${name}: ajuda dentro da engrenagem`);
 if(phone)await p.tap('#cfgBtn');else await p.click('#cfgBtn');await p.waitForTimeout(150);
 if(phone)await p.tap('#cfBody .cflink:has-text("Ajuda")');else await p.click('#cfBody .cflink:has-text("Ajuda")');await p.waitForTimeout(150);
 ok(await p.evaluate(()=>view==="help"&&!document.getElementById("viewHelp").hidden&&document.querySelectorAll(".hsec").length===17),`${name}: abre a Ajuda com 17 assuntos`);
 if(name==="celular"){
  await p.fill('#hq','senha');await p.waitForTimeout(350);
  const r=await p.evaluate(()=>[...document.querySelectorAll(".hsec")].map(d=>d.querySelector("summary").textContent+(d.open?"*":"")));
  ok(r.length>=2&&r.every(x=>x.endsWith("*")),"busca 'senha' filtra e abre: "+r.join(", "));
  await p.fill('#hq','xyzabc');await p.waitForTimeout(350);ok(await p.evaluate(()=>!!document.querySelector(".hempty")),"busca sem resultado avisa");
  await p.fill('#hq','');await p.waitForTimeout(350);
  await p.locator('.hsec summary').nth(8).click();await p.waitForTimeout(100);
  ok(await p.evaluate(()=>{const d=document.querySelectorAll(".hsec")[8];return d.open&&d.querySelector("table")&&/15 a 21/.test(d.textContent)}),"Faculdade mostra a tabela de vagas");
  ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),"sem rolagem lateral no celular");
  await p.screenshot({path:'help-fone.png'});
  await p.tap('.appnav #tabT');ok(await p.evaluate(()=>view==="temas"),"volta para Temas pela barra");
 }
 if(name==="notebook")await p.screenshot({path:'help-desk.png'});
 ok(!errs.length,`${name}: sem erros JS `+errs.join("|"));await ctx.close()}
await b.close()})();
