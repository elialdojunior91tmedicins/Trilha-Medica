const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync('mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
(async()=>{const b=await chromium.launch();const errs=[];
const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},5);`);
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));const go=async()=>{await p.goto('file://'+__dirname+'/preview.html');await p.waitForFunction(()=>typeof saveFac==='function'&&synced,null,{polling:100});await p.waitForTimeout(200)};
await go();await p.evaluate(()=>{localStorage.clear();state={};dayPlan=null;commit()});await go();
ok(await p.isVisible('#profBtn')&&await p.isVisible('#cfgBtn')&&!(await p.$('#helpBtn'))&&!(await p.$('#tabH')),"topo com Perfil e engrenagem; sem ? e sem aba Ajuda");
// perfil
await p.tap('#profBtn');await p.waitForTimeout(150);ok(await p.evaluate(()=>view==="perfil"),"perfil abre como página");
await p.fill('#pfName','Elialdo Júnior');await p.dispatchEvent('#pfName','change');await p.tap('#pfExAdd');await p.waitForTimeout(150);const xid=await p.evaluate(()=>exList()[0].id);await p.fill('#pfExName-'+xid,'ENARE 2027');await p.dispatchEvent('#pfExName-'+xid,'change');
const gd=await p.evaluate(()=>fromNum(dnum(today())+100));await p.fill('#pfExDate-'+xid,gd);await p.dispatchEvent('#pfExDate-'+xid,'change');await p.waitForTimeout(150);
ok(await p.textContent('#profIni')==="EJ","iniciais no ícone: "+await p.textContent('#profIni'));
await p.tap('#viewPerfil .fback');await p.waitForTimeout(150);ok(await p.evaluate(()=>view==="inicio"),"Voltar retorna ao Início");
ok(/ENARE 2027/.test(await p.textContent('#iMeta'))&&/faltam 100 dias/.test(await p.textContent('#iMeta')),"meta no Início com contagem");
// config
await p.tap('#cfgBtn');await p.waitForTimeout(150);
await p.tap('#cfBody button.lay:has-text("Compacto")');ok(await p.evaluate(()=>document.documentElement.dataset.skin==="compact"),"layout Compacto aplicado");
await p.tap('#cfBody .cfrow:has-text("Tema") button:has-text("Escuro")');ok(await p.evaluate(()=>document.documentElement.getAttribute("data-theme")==="dark"),"tema escuro");
await p.tap('#cfBody .cfrow:has-text("Tema") button:has-text("Automático")');ok(await p.evaluate(()=>!document.documentElement.hasAttribute("data-theme")),"tema automático solta o atributo");
await p.tap('#cfBody .cfrow:has-text("Tamanho da letra") button:has-text("Grande")');ok(await p.evaluate(()=>getComputedStyle(document.documentElement).fontSize==="18px"),"letra grande");
await p.tap('#cfBody .cfrow:has-text("Temas por dia") button:has-text("5")');await p.tap('#cfBody .cfrow:has-text("Subtópicos por tema") button:has-text("2")');
await p.tap('#cfBody button:has-text("Refazer o plano de hoje")');await p.waitForTimeout(150);
const pl=await p.evaluate(()=>({n:dayPlan.items.length,subs:dayPlan.items.filter(x=>x.subs.length).map(x=>x.subs.length)}));
ok(pl.n===5&&pl.subs.every(x=>x<=2),"plano com 5 temas e 2 subtópicos: "+JSON.stringify(pl));
await p.tap('#cfBody .cfrow:has-text("Intervalos") button:has-text("Intensivo")');ok(await p.evaluate(()=>INT.join(",")==="1,2,4,7,15,30,60"),"intervalos intensivos");
await p.tap('#cfBody .cfrow:has-text("Antecedência") button:has-text("28 dias")');ok(await p.evaluate(()=>FAC_WIN===28),"antecedência 28 dias");
ok(await p.isVisible('#cfBody .cfcrunch .seg'),"modo provas nas configurações");
// links
await p.tap('#cfBody .cflink:has-text("Ajuda")');await p.waitForTimeout(150);ok(await p.evaluate(()=>view==="help"),"Ajuda pela engrenagem");
await p.tap('#backHelp');await p.waitForTimeout(100);ok(await p.evaluate(()=>view==="config"),"Voltar da Ajuda volta às Configurações");
await p.tap('#cfBody .cflink:has-text("Instruções")');await p.waitForTimeout(100);ok(await p.evaluate(()=>view==="instr"),"Instruções pela engrenagem");
await p.tap('#backQuest');await p.waitForTimeout(100);ok(await p.evaluate(()=>view==="config"),"Voltar das Instruções volta às Configurações");
ok(!(await p.$('#openInstr')),"botão antigo saiu de Questões");
// persistência e backup
await go();ok(await p.evaluate(()=>ui.prefs.layout==="compact"&&ui.prefs.planN===5&&ui.profile.name==="Elialdo Júnior"&&document.documentElement.dataset.skin==="compact"&&PLAN_N===5),"preferências mantidas ao reabrir");
ok(await p.evaluate(()=>{const B=buildBackup();return B.data.ui&&B.data.ui.prefs.layout==="compact"}),"backup leva perfil e preferências");
await p.evaluate(()=>{ui.prefs.layout="focus";saveUI();setView("inicio")});await p.waitForTimeout(150);
ok(await p.evaluate(()=>!document.querySelector('#iStats').offsetParent&&!!document.querySelector('#viewInicio .card.today').offsetParent),"Foco: Início sem gráficos, com Estudar hoje");
await p.evaluate(()=>{ui=uiSanitize({});saveUI()});
ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),"sem rolagem horizontal");
ok(!errs.length,"sem erros JS "+errs.join("|"));await b.close()})();
