// t95: revisões dos temas saem do Início (ficam só na Residência); a fila "Revisar hoje" e o placar levam até elas
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],ipad578:[578,820,true],ipad820:[820,1180,true],tabDeitado:[1180,820,true],note:[1366,768,false],full:[1920,1080,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];const ipad=name.startsWith("ipad")||name.startsWith("tab");
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,screen:name==="ipad578"?{width:1180,height:820}:undefined,userAgent:ipad?"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)":undefined});
 await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
 await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
 const click=async s=>{await p.evaluate(s=>{const x=document.querySelector(s);if(x)x.scrollIntoView({block:"center"})},s);await (mob?p.tap(s):p.click(s));await p.waitForTimeout(250)};
 /* duas revisões vencidas (CM-1 atrasada) e uma conta antiga que tinha escondido/reordenado o cartão Revisões */
 await p.evaluate(()=>{const D=n=>fromNum(dnum(today())+n);state["CM-1"]={l:1,last:D(-3),step:0,sd:[0],sv:2};state["CM-2"]={l:1,last:D(-1),step:0,sd:[0],sv:2};
   ui.prefs.iorder=["iHero","iRevs","iQueue","iBoard"];ui.prefs.ihide=["iRevs"];saveUI();commit();localStorage.setItem("resid-tseg","lista");tSeg="lista";backStack=[];setView("inicio")});await p.waitForTimeout(250);
 const r0=await p.evaluate(()=>({revs:!!document.querySelector('#viewInicio .card.revs'),slot:!!document.getElementById("iRevs"),today:!!document.querySelector('#viewInicio .card.today'),
   q:[...document.querySelectorAll('#iQueue .iqlist li')].map(li=>li.querySelector('.iql').textContent+"="+li.querySelector('.iqn').textContent).join(),order:getComputedStyle(document.getElementById("iQueue")).order}));
 ok(!r0.revs&&!r0.slot&&r0.today,name+": Início sem o cartão Revisões (Estudar hoje continua) "+JSON.stringify(r0));
 ok(/Temas para revisar=2/.test(r0.q),name+": a fila Revisar hoje conta os temas para revisar "+r0.q);
 if(name==="fone"||name==="ipad578"||name==="note"||name==="tabDeitado"){await p.evaluate(()=>{const c=document.getElementById("iQueue");c.scrollIntoView({block:"start"});scrollBy(0,-70)});await p.waitForTimeout(150);await p.screenshot({path:`t95-inicio-${name}.png`})}
 /* personalizar: o cartão Revisões não aparece mais */
 ok(await p.evaluate(()=>!ICARDS.some(c=>c[0]==="iRevs")&&iOrder().indexOf("iQueue")===1),name+": Personalizar o Início sem Revisões; ordem antiga continua valendo");
 /* Temas para revisar › abrir */
 await p.evaluate(()=>{const li=[...document.querySelectorAll('#iQueue .iqlist li')].find(l=>/Temas para revisar/.test(l.textContent));li.querySelector('button').id="__open";});
 await click('#__open');await p.waitForTimeout(300);
 const r1=await p.evaluate(()=>{const c=document.querySelector('#viewTemas .card.revs');const r=c&&c.getBoundingClientRect();return {view,tSeg,vis:!!(c&&c.offsetParent),top:r?Math.round(r.top):null,h:innerHeight,n:c?c.querySelectorAll('.rcard').length:0}});
 ok(r1.view==="temas"&&r1.vis&&r1.n===2&&r1.top<r1.h&&(name!=="fone"||r1.tSeg==="rev"),name+": abrir leva às revisões na Residência "+JSON.stringify(r1));
 if(name==="fone"||name==="note")await p.screenshot({path:`t95-res-${name}.png`});
 /* placar: Revisões */
 await p.evaluate(()=>{backStack=[];setView("inicio")});await p.waitForTimeout(150);
 await p.evaluate(()=>{const t=[...document.querySelectorAll('#iBoard .itile')].find(x=>/Revisões/.test(x.querySelector('.kl').textContent));t.id="__tile"});await click('#__tile');await p.waitForTimeout(250);
 ok(await p.evaluate(()=>view==="temas"&&!!document.querySelector('#viewTemas .card.revs').offsetParent),name+": o placar Revisões também leva à Residência");
 /* O que fazer agora: revisão atrasada abre o cartão do tema */
 await p.evaluate(()=>{backStack=[];nowSkip=0;setView("inicio")});await p.waitForTimeout(150);
 await p.evaluate(()=>{startStep(nextSteps()[0])});await p.waitForTimeout(350);
 ok(await p.evaluate(()=>{const c=document.querySelector('#viewTemas .rcard[data-k="CM-1"]');return view==="temas"&&c&&!c.classList.contains("pmini")&&foRun&&foRun.ref==="T:CM-1"}),name+": Revisar agora abre o tema na Residência e liga o Foco");
 /* voltar ao Início não leva o cartão junto */
 await p.evaluate(()=>{if(foRun){foRun=null;try{localStorage.removeItem("resid-focus-run")}catch(e){}}setView("inicio")});await p.waitForTimeout(150);
 ok(await p.evaluate(()=>!document.querySelector('#viewInicio .card.revs')&&!!document.querySelector('#viewTemas .card.revs')),name+": de volta ao Início, o cartão continua só na Residência");
 ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral");
 await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
