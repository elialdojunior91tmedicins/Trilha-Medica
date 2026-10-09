const {chromium,devices}=require('playwright');const fs=require('fs');const mock=fs.readFileSync('mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
(async()=>{const b=await chromium.launch();const errs=[];
const ctx=await b.newContext({...devices['iPhone 13'],viewport:{width:390,height:844}});await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},5);`);
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('file://'+__dirname+'/preview.html');await p.waitForFunction(()=>typeof saveFac==='function'&&synced,null,{polling:100});
await p.evaluate(()=>{localStorage.clear();fac={sems:[],discs:[],provas:[],own:{}};saveFac();render()});
await p.tap('#tabF');await p.waitForTimeout(200);
await p.tap('#facNewSem');await p.keyboard.type('6° Semestre');await p.tap('#facHead form button');await p.waitForTimeout(300);
const sid=await p.evaluate(()=>fac.sems[0].id);
ok(await p.isVisible('#facNewDisc-'+sid),"semestre vazio já mostra o campo da 1ª disciplina");
await p.tap('#facNewDisc-'+sid);await p.keyboard.type('NCS 6');await p.tap('#fs-'+sid+' .fnewdisc button[type=submit]');await p.waitForTimeout(400);
const did=await p.evaluate(()=>fac.discs[0].id);
ok(await p.isVisible('#fq-c'+did),"disciplina nova abre direto no + Conteúdo");
// conteúdo da residência
await p.tap('#fq-c'+did);await p.keyboard.type('coagulação');await p.waitForTimeout(250);
await p.tap(`#fd-${did} .fadder .fres li:has-text("Distúrbios da coagulação") button`);await p.waitForTimeout(250);
ok(await p.evaluate(d=>discOf(d).items.includes("T:CM-37"),did),"ligou tema da residência como conteúdo");
// conteúdo novo da faculdade
await p.tap('#fq-c'+did);await p.keyboard.type('Cascata da coagulação');await p.waitForTimeout(250);
const area=await p.textContent(`#fd-${did} .fadder .fcreate span`);
await p.tap(`#fd-${did} .fadder .fcreate button`);await p.waitForTimeout(250);
const own=await p.evaluate(()=>{const it=FAC_ITEMS.find(x=>x.t==="Cascata da coagulação");return it&&it.area.code+" · "+it.sp});
ok(!!own,"criou conteúdo da faculdade · "+own+" · aviso: "+area);
await p.tap('#fq-c'+did);await p.keyboard.type('Anatomia do coração');await p.waitForTimeout(250);await p.keyboard.press('Enter');await p.waitForTimeout(250);
ok(await p.evaluate(()=>FAC_ITEMS.some(x=>x.t==="Anatomia do coração")),"Enter cria o conteúdo");
ok(await p.evaluate(d=>discOf(d).items.length===3&&document.querySelectorAll(`#fd-${d} .flist li.t`).length===3,did),"3 conteúdos aparecem na disciplina");
// 2ª disciplina
await p.tap(`#fs-${sid} .fstools button:has-text("+ Disciplina")`);await p.waitForTimeout(150);
await p.tap('#facNewDisc-'+sid);await p.keyboard.type('Habilidades Médicas 6');await p.tap('#fs-'+sid+' .fnewdisc button[type=submit]');await p.waitForTimeout(400);
ok(await p.evaluate(()=>fac.discs.length===2),"2ª disciplina criada pelo + Disciplina");
// estudar conteúdo dentro da disciplina
await p.tap(`#fd-${did} .fadder .fadh button`).catch(()=>{});await p.waitForTimeout(100);
await p.evaluate(d=>{facOpenDisc.add(d);facAddC=null;render()},did);
await p.tap(`#fd-${did} .flist li.t:has-text("Cascata") > .item`);await p.waitForTimeout(200);
ok(await p.isVisible(`#fd-${did} .flist li.t.open .detail`),"conteúdo abre para estudar dentro da disciplina");
// organizar: criar SP e mover
await p.tap(`#fd-${did} .fdtools button:has-text("Organizar")`);await p.waitForTimeout(150);
await p.tap('#fn-sp-'+did);await p.keyboard.type('SP 2.1 Hemostasia');await p.keyboard.press('Enter');await p.waitForTimeout(250);
const spid=await p.evaluate(d=>discOf(d).sps[0]&&discOf(d).sps[0].id,did);ok(!!spid,"criou SP em Organizar");
await p.selectOption(`#fd-${did} .flist li.t:has-text("Cascata") .frmrow select`,spid);await p.waitForTimeout(250);
ok(await p.evaluate(([d,s])=>{const x=discOf(d),sp=x.sps[0];const it=FAC_ITEMS.find(y=>y.t==="Cascata da coagulação");return sp.items.some(r=>r==="O:"+it.key.slice(2))&&!x.items.includes("O:"+it.key.slice(2))},[did,spid]),"moveu conteúdo para a SP");
await p.evaluate(()=>window.scrollTo(0,0));await p.screenshot({path:'t41.png',fullPage:true});
ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),"sem rolagem horizontal");
console.log(errs.join("\n")||"sem erros JS");await b.close()})();
