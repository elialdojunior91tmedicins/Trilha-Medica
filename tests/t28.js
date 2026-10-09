const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync('mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
(async()=>{const b=await chromium.launch();
// ===== celular =====
let ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},5);`);
let p=await ctx.newPage();let errs=[];p.on('pageerror',e=>errs.push(e.message));
const go=async()=>{await p.goto('file://'+__dirname+'/preview.html');await p.waitForFunction(()=>typeof saveFac==='function',null,{polling:100});await p.waitForTimeout(200)};
await go();await p.evaluate(()=>{localStorage.removeItem("resid-tseg");tSeg="hoje";const D=n=>fromNum(dnum(today())+n);state["CM-7"]={l:1,last:D(-4),step:0,sd:[0],sv:2};commit();setView("temas")});
ok(await p.evaluate(()=>{const r=document.querySelector(".appnav").getBoundingClientRect();return Math.round(r.bottom)===innerHeight}),"barra de abas presa embaixo");
ok(await p.evaluate(()=>!!document.querySelector(".today").offsetParent&&!document.querySelector(".revs").offsetParent&&!document.querySelector("#areas").offsetParent),"Hoje mostra só o plano");
// Abrir tema -> Lista e tema visível
const k=await p.evaluate(()=>dayPlan.items[0].k);
await p.locator('.today .pcard').first().locator('.psum').tap();await p.waitForTimeout(150);await p.locator('.today .pcard').first().locator('button:has-text("Abrir tema")').tap();await p.waitForTimeout(500);
ok(await p.evaluate(k=>tSeg==="lista"&&!!document.getElementById("t-"+k).offsetParent&&document.getElementById("t-"+k).classList.contains("open"),k),"Abrir tema leva à Lista com o tema aberto");
const vis=await p.evaluate(k=>{const r=document.getElementById("t-"+k).getBoundingClientRect();const sb=document.getElementById("tSeg").getBoundingClientRect().bottom;return r.top>=sb-1&&r.top<innerHeight-60},k);ok(vis,"tema aparece na tela (não atrás da barra)");
// revisões
await p.tap('#tSeg [data-s=rev]');ok(await p.evaluate(()=>!!document.querySelector(".revs").offsetParent&&!document.querySelector(".dash").offsetParent&&!document.querySelector(".today").offsetParent),"Revisões mostra só revisões");
await p.tap('#tSeg [data-s=prog]');ok(await p.evaluate(()=>!!document.querySelector("#viewTemas .dash").offsetParent&&!document.querySelector(".revs").offsetParent),"Progresso mostra só o progresso");
// fim da página acessível acima da barra
await p.tap('#tSeg [data-s=lista]');await p.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));await p.waitForTimeout(150);
ok(await p.evaluate(()=>{const r=document.getElementById("resetBtn").getBoundingClientRect(),n=document.querySelector(".appnav").getBoundingClientRect();return r.bottom<=n.top}),"último botão da página fica acima da barra");
// lembrar seção
await go();ok(await p.evaluate(()=>tSeg==="lista"&&document.getElementById("viewTemas").dataset.seg==="lista"),"seção escolhida é lembrada ao reabrir");
// teclado
await p.tap('#tabE');await p.tap('#eq');await p.waitForTimeout(120);ok(await p.evaluate(()=>getComputedStyle(document.querySelector(".appnav")).display==="none"),"barra some enquanto digita");
await p.evaluate(()=>document.activeElement.blur());await p.waitForTimeout(150);ok(await p.evaluate(()=>getComputedStyle(document.querySelector(".appnav")).display!=="none"),"barra volta ao sair do campo");
// sobreposição de anotações cobre a barra
await p.evaluate(()=>{noteMode["CM-4"]="editar";focusKey="CM-4";render()});await p.waitForTimeout(100);
ok(await p.evaluate(()=>{const n=document.querySelector(".appnav").getBoundingClientRect();const top=document.elementFromPoint(innerWidth/2,n.top+20);return !top.closest(".appnav")}),"modo foco das anotações fica por cima da barra");
await p.evaluate(()=>{focusKey=null;render()});
// contadores
ok(await p.evaluate(()=>document.getElementById("rcount").textContent===String(dueCount())),"contador de revisões na aba Temas");
ok(!errs.length,"celular sem erros JS "+errs.join("|"));await ctx.close();
// ===== computador =====
ctx=await b.newContext({viewport:{width:1366,height:768}});await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},5);`);
p=await ctx.newPage();errs=[];p.on('pageerror',e=>errs.push(e.message));await go();
await p.evaluate(()=>{const D=n=>fromNum(dnum(today())+n);fac={sems:[{id:"s",name:"S",archived:false}],discs:[{id:"d",semId:"s",name:"Cardio",items:["T:CM-4"]}],provas:[{id:"p",discId:"d",name:"P2",date:D(5),items:["T:CM-4"],done:[]}],own:{}};saveFac();setView("erros")});
await p.click('#navExtra button:has-text("Próxima prova")');await p.waitForTimeout(150);
ok(await p.evaluate(()=>view==="fac"&&facProvaOpen.has("p")&&!!document.getElementById("fp-p")),"atalho Próxima prova abre a prova na Faculdade");
await p.click('#navExtra button:has-text("Revisões")');ok(await p.evaluate(()=>view==="inicio"&&!!document.querySelector("#viewInicio .card.revs").offsetParent),"atalho Revisões vai para o Início");await p.evaluate(()=>setView("temas"));
ok(await p.evaluate(()=>getComputedStyle(document.getElementById("tSeg")).display==="none"&&!!document.querySelector(".revs").offsetParent&&!!document.querySelector("#areas").offsetParent),"computador mostra tudo (sem seções do celular)");
ok(!errs.length,"computador sem erros JS "+errs.join("|"));await ctx.close();
// ===== tablet =====
ctx=await b.newContext({viewport:{width:820,height:1180},isMobile:true,hasTouch:true});await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},5);`);
p=await ctx.newPage();errs=[];p.on('pageerror',e=>errs.push(e.message));await go();
await p.tap('#tabQ');ok(await p.evaluate(()=>view==="quest"),"tablet: toque na faixa lateral troca de aba");
const h=await p.locator('#tabQ').boundingBox();ok(h.height>=56,"tablet: botões da faixa com "+Math.round(h.height)+"px de altura");
ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),"tablet sem rolagem lateral");
ok(!errs.length,"tablet sem erros JS "+errs.join("|"));await b.close()})();
