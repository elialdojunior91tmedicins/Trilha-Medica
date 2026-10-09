const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync('mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
(async()=>{const b=await chromium.launch();const errs=[];
for(const [vw,vh,mob] of [[390,844,true],[1366,900,false]]){
const ctx=await b.newContext({viewport:{width:vw,height:vh},hasTouch:mob,isMobile:mob});await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},5);`);
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('file://'+__dirname+'/preview.html');await p.waitForFunction(()=>typeof saveFac==='function'&&synced,null,{polling:100});
const click=s=>mob?p.tap(s):p.click(s);const tag=mob?"celular":"computador";
await p.evaluate(()=>{const D=n=>fromNum(dnum(today())+n);
  state["CM-1"]={l:1,last:D(-3),step:0,qt:0};// revisão atrasada (intervalo 1)
  state["CM-2"]={l:1,last:D(-1),step:0};// revisão de hoje
  hist={};for(let i=1;i<=20;i+=2)hist[D(-i)]={e:1};hist[today()]={r:1,q:30};
  foSess=[{id:"x",d:today(),s:"",sec:1800,m:"p",ref:"",lab:""}];ui.prefs.qgoal=100;ui.prefs.fgoal=60;
  ui.profile.exams=[{id:"e1",name:"ENARE",date:D(140)}];ui.profile.mainEx="e1";saveUI();commit();setView("inicio")});await p.waitForTimeout(300);
const tiles=await p.$$eval('#iBoard .itile',a=>a.map(x=>x.querySelector('.kl').textContent+"="+x.querySelector('b').textContent));
ok(tiles.length===4&&tiles[0]==="Plano de hoje=0/3"&&tiles[1]==="Revisões=1/3"&&/30\/100/.test(tiles[2])&&/30 min/.test(tiles[3]),tag+": placar "+tiles.join(" | "));
const now=await p.$eval('#iBoard .inowtx',x=>x.textContent);ok(/atrasada há 2 dias/.test(now)&&now.includes(await p.evaluate(()=>BYKEY["CM-1"].t)),tag+": primeiro passo é a revisão atrasada: "+now);
await click('#nowSkip');await p.waitForTimeout(150);ok(/Revisão de hoje/.test(await p.$eval('#iBoard .inowtx',x=>x.textContent)),tag+": outra sugestão: revisão de hoje");
await click('#nowSkip');await p.waitForTimeout(150);ok(/plano de hoje/i.test(await p.$eval('#iBoard .inowtx',x=>x.textContent)),tag+": depois, tema do plano");
await click('#nowSkip');await p.waitForTimeout(150);await click('#nowSkip');await p.waitForTimeout(150);await click('#nowSkip');await p.waitForTimeout(150);
const s6=await p.$eval('#iBoard .inowtx',x=>x.textContent);ok(/Simulado|plano|Revisão/.test(s6),tag+": continua sugerindo: "+s6.slice(0,60));
await p.evaluate(()=>{nowSkip=0;render()});await click('#nowGo');await p.waitForTimeout(400);
ok(await p.evaluate(()=>foRun&&foRun.ref==="T:CM-1"),tag+": Começar liga o Foco no tema");
ok(await p.evaluate(()=>{const c=document.querySelector('#viewInicio .rcard[data-k="CM-1"]');return c&&!c.classList.contains('pmini')}),tag+": cartão da revisão abre");
// revisões recolhidas
ok(await p.evaluate(()=>document.querySelector('#viewInicio .rcard[data-k="CM-2"]').classList.contains('pmini')),tag+": outras revisões recolhidas");
await click('#viewInicio .rcard[data-k="CM-2"] .psum');await p.waitForTimeout(150);ok(await p.evaluate(()=>!document.querySelector('#viewInicio .rcard[data-k="CM-2"]').classList.contains('pmini')),tag+": revisão abre ao toque");
// projeção
const pj=await p.$eval('#iMeta .iproj',x=>x.textContent);ok(/Faltam 18\d temas/.test(pj)&&/2,5 por semana/.test(pj),tag+": projeção: "+pj.slice(0,160));
// atalhos do placar
await click('#iBoard .itile:nth-child(3)');await p.waitForTimeout(150);ok(await p.evaluate(()=>view==="quest"),tag+": questões leva à aba Questões");
await p.evaluate(()=>{foRun=null;foSaveRun();setView("inicio");scrollTo(0,0)});await p.waitForTimeout(200);
ok(await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=0,tag+": sem rolagem horizontal");
await p.screenshot({path:`in2-${mob?"fone":"desk"}.png`,fullPage:true});
// dia tranquilo
await p.evaluate(()=>{state={};dayPlan={d:today(),items:[]};redo=[];ui.prefs.qgoal=0;ui.profile.exams=[];saveUI();commit();render()});await p.waitForTimeout(150);
ok(/Tudo feito por hoje/.test(await p.$eval('#iBoard',x=>x.textContent)),tag+": dia sem pendências");
await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
