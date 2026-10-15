// t96: Residência recolhida (área › especialidades › temas) e o cartão "Encontrar temas" (busca, Filtros, filtros ativos, Ordem)
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],ipad578:[578,820,true],ipad820:[820,1180,true],tabDeitado:[1180,820,true],note:[1366,768,false],full:[1920,1080,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];const ipad=name.startsWith("ipad")||name.startsWith("tab");
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,screen:name==="ipad578"?{width:1180,height:820}:undefined,userAgent:ipad?"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)":undefined});
 await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
 await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
 const click=async s=>{await p.evaluate(s=>{const x=document.querySelector(s);if(x)x.scrollIntoView({block:"center"})},s);await (mob?p.tap(s):p.click(s));await p.waitForTimeout(200)};
 const vis=s=>p.evaluate(s=>[...document.querySelectorAll(s)].filter(x=>x.checkVisibility()).length,s);
 await p.evaluate(()=>{const D=n=>fromNum(dnum(today())+n);state["CM-1"]={l:1,last:D(-3),step:0,sd:[0],sv:2,qt:10,qc:4};commit();localStorage.setItem("resid-tseg","lista");tSeg="lista";backStack=[];setView("temas")});await p.waitForTimeout(250);
 /* 1. tudo recolhido */
 ok(await vis('details.area[open]')===0&&await vis('#areas li.t')===0&&await vis('#areas .sphead')===0,name+": ao abrir, as grandes áreas vêm recolhidas");
 /* 2. área › especialidades */
 await click('#areas details.area:first-of-type > summary');
 const r2={sp:await vis('#areas .sphead'),t:await vis('#areas li.t')};ok(r2.sp>=5&&r2.t===0,name+": tocar na área mostra só as especialidades "+JSON.stringify(r2));
 /* 3. especialidade › temas */
 await p.evaluate(()=>{document.querySelector('#areas .sphead button').id="__sp1"});await click('#__sp1');
 const r3=await p.evaluate(()=>[...document.querySelectorAll('#areas li.t')].filter(x=>x.checkVisibility()).map(x=>x.id));ok(r3.includes("t-CM-1")&&r3.every(id=>/^t-CM-/.test(id))&&r3.length<15,name+": tocar na especialidade mostra os temas dela ("+r3.length+")");
 /* 4. tema › detalhe */
 await click('#t-CM-1 > .item');ok(await p.evaluate(()=>openKey==="CM-1"&&document.querySelector('#t-CM-1').classList.contains("open")),name+": tocar no tema abre o tema");
 await click('#t-CM-1 > .item');
 /* 5. busca abre o que achou e, ao limpar, volta como estava */
 await p.fill('#q','sepse');await p.waitForTimeout(500);
 const r5=await p.evaluate(()=>({t:[...document.querySelectorAll('#areas li.t')].filter(x=>x.checkVisibility()).length,cnt:document.querySelector('#tfCount').textContent}));
 ok(r5.t>=1&&/de 185 temas/.test(r5.cnt),name+": a busca abre as áreas e mostra os temas achados "+JSON.stringify(r5));
 await p.fill('#q','');await p.waitForTimeout(500);
 ok(await p.evaluate(()=>[...document.querySelectorAll('details.area[open]')].length===1&&[...document.querySelectorAll('#areas li.t')].filter(x=>x.checkVisibility()).every(x=>/^t-CM-/.test(x.id))),name+": ao limpar a busca, volta só o que você tinha aberto");
 /* 6. Filtros: painel fechado; abre, lembra; chips com contagem */
 ok(await p.evaluate(()=>!document.querySelector('#tfPanel')&&document.querySelector('#tfTog').getAttribute("aria-expanded")==="false"),name+": painel de filtros começa fechado");
 await click('#tfTog');ok(await p.evaluate(()=>!!document.querySelector('#tfPanel #tfl1')&&!!document.querySelector('#tfPanel #tfdue')&&!!document.querySelector('#tfPanel #tfArea')&&localStorage.getItem("resid-tfpanel")==="1"),name+": Filtros abre o painel (Situação, Mostrar só, Onde) e o app lembra");
 await click('#tfl1');await click('#tfweak');
 const r6=await p.evaluate(()=>({n:(document.querySelector('#tfTog .tfn')||{}).textContent,pills:[...document.querySelectorAll('.tfact .tfpill span')].map(x=>x.textContent),t:[...document.querySelectorAll('#areas li.t')].filter(x=>x.checkVisibility()).map(x=>x.id)}));
 ok(r6.n==="2"&&r6.pills.join()==="Estudados,Pontos fracos"&&r6.t.join()==="t-CM-1",name+": filtros ativos com número e pílulas; lista abre no resultado "+JSON.stringify(r6));
 /* 7. fechar o painel: pílulas continuam; × tira um */
 await click('#tfTog');ok(await p.evaluate(()=>!document.querySelector('#tfPanel')&&document.querySelectorAll('.tfact .tfpill').length===2),name+": com o painel fechado, os filtros ativos continuam à vista");
 await p.evaluate(()=>{[...document.querySelectorAll('.tfpill')].find(x=>/Pontos fracos/.test(x.textContent)).id="__x"});await click('#__x');
 ok(await p.evaluate(()=>!tf.weak&&tf.lv.has(1)&&document.querySelectorAll('.tfact .tfpill').length===1),name+": × tira só aquele filtro");
 await click('#tfClear');ok(await p.evaluate(()=>!tfOn()&&!document.querySelector('.tfact')),name+": Limpar tudo");
 /* 8. Onde: área abre só ela, especialidade abre a especialidade */
 await click('#tfTog');await p.selectOption('#tfArea','PED');await p.waitForTimeout(200);
 ok(await p.evaluate(()=>{const A=[...document.querySelectorAll('details.area')];return A.length===1&&A[0].open&&[...document.querySelectorAll('#areas li.t')].filter(x=>x.checkVisibility()).length===0}),name+": área escolhida aparece aberta, com as especialidades recolhidas");
 const sp=await p.evaluate(()=>AREAS.find(a=>a.code==="PED").specs[0].name);await p.selectOption('#tfSp',sp);await p.waitForTimeout(200);
 ok(await p.evaluate(()=>{const T=[...document.querySelectorAll('#areas li.t')].filter(x=>x.checkVisibility()).map(x=>x.id);return T.length>0&&T.every(id=>/^t-PED-/.test(id))}),name+": especialidade escolhida abre os temas dela");
 await click('#tfClear');await click('#tfTog');
 /* 9. Ordem */
 await p.selectOption('#sortSel','inc');await p.waitForTimeout(150);ok(await p.evaluate(()=>sortBy==="inc"&&localStorage.getItem("resid-sort")==="inc"&&document.querySelector('#sortSel').value==="inc"),name+": Ordem: mais cobrados primeiro");
 await p.selectOption('#sortSel','num');await p.waitForTimeout(150);
 /* 10. openTopic de fora abre área e especialidade do tema */
 await p.evaluate(()=>{openAreas.clear();openSpecs.clear();openTopic("PED-1")});await p.waitForTimeout(300);
 ok(await p.evaluate(()=>!!document.querySelector('#t-PED-1').offsetParent&&document.querySelector('#t-PED-1').classList.contains("open")),name+": abrir um tema de outra aba abre a área e a especialidade dele");
 ok(await p.evaluate(()=>{const c=document.querySelector('#tFind');return c&&document.documentElement.scrollWidth<=innerWidth&&c.getBoundingClientRect().right<=innerWidth}),name+": sem rolagem lateral");
 await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
