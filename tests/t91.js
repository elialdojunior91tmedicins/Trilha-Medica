// t91: resultado da prova na íntegra mostra "Onde você perdeu pontos" (3+ questões e acerto < 60% na especialidade), só como sugestão
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],ipad578:[578,820,true],tabDeitado:[1180,820,true],note:[1366,768,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];const ipad=name==="ipad578"||name.startsWith("tab");
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,screen:name==="ipad578"?{width:1180,height:820}:undefined,userAgent:ipad?"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)":undefined});
 await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
 await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
 const click=async s=>{await p.evaluate(s=>{const x=document.querySelector(s);if(x)x.scrollIntoView({block:"center"})},s);await (mob?p.tap(s):p.click(s));await p.waitForTimeout(150)};
 /* hemato (CM-34, CM-35, CM-37): 1 de 4 (queda); cardio (CM-4): 1 de 2 (poucas questões); CM-1: 3 de 3 */
 const info=await p.evaluate(()=>{const alt=["A","B","C","D"].map(l=>({letra:l,texto:"Alternativa "+l}));const Q=(n,k)=>({n,k,q:{enunciado:"Questão "+n,alternativas:alt,correta:"A",comentario:"c"}});
   const ks=["CM-34","CM-34","CM-35","CM-37","CM-4","CM-4","CM-1","CM-1","CM-1"];
   const ex=exClean({id:"exT",name:"ENARE 2024",banca:"ENARE",ano:"2024",at:new Date().toISOString(),qs:ks.map((k,i)=>Q(i+1,k))});exams.unshift(ex);exPut(ex);
   const P=exPg("exT"),ans=["B","C","A","B","A","B","A","A","A"];ans.forEach((l,i)=>{P.a[i]={l,d:today(),s:60}});P.fin=today();
   const plan0=JSON.stringify(ensurePlan().items.map(x=>x.k));exRun={id:"exT",view:"res",i:0,cad:{}};backStack=[];qSeg="praticar";setView("quest");return {plan0,sp:[BYKEY["CM-34"].sp,BYKEY["CM-4"].sp]}});
 await p.waitForTimeout(250);
 const r=await p.evaluate(()=>{const g=document.querySelector('.exlost');if(!g)return null;return {heads:[...g.querySelectorAll('.exlh b')].map(x=>x.textContent),ks:[...g.querySelectorAll('.exlh .ks')].map(x=>x.textContent),
   tops:[...g.querySelectorAll('.exlopen')].map(x=>x.textContent),qs:[...g.querySelectorAll('.exlqs .chip')].map(x=>x.textContent)}});
 ok(r&&r.heads.length===1&&r.heads[0]==="CM · "+info.sp[0]&&/25% · 1 de 4/.test(r.ks[0]),name+": só a especialidade com 3+ questões e acerto abaixo de 60% aparece "+JSON.stringify(r&&{h:r.heads,k:r.ks}));
 ok(r&&r.tops[0]==="Anemias"&&r.tops.length===2&&r.qs.join()==="Q1,Q2,Q4",name+": lista os temas errados (o que mais errou primeiro) e as questões "+JSON.stringify(r&&{t:r.tops,q:r.qs}));
 ok(await p.evaluate(p0=>JSON.stringify(ensurePlan().items.map(x=>x.k))===p0,info.plan0),name+": não mexe no plano do dia (só sugere)");
 if(name==="fone"||name==="note")await p.evaluate(()=>{const g=document.querySelector('.exlost');g.scrollIntoView({block:"start"});scrollBy(0,-70)}),await p.waitForTimeout(150),await p.screenshot({path:`t91-${name}.png`});
 /* questão: abre o comentário com Levar para o caderno; volta marcada */
 await click('#exlq-1');
 ok(await p.evaluate(()=>exRun.view==="rev"&&exRun.i===1&&[...document.querySelectorAll('.ecad button')].some(b=>/caderno de erros/.test(b.textContent))),name+": tocar na questão abre o comentário com Levar para o caderno de erros");
 await p.evaluate(()=>{exRun.cad[1]={saved:true};exRun={id:"exT",view:"res",i:0,cad:exRun.cad};render()});await p.waitForTimeout(100);
 ok(await p.evaluate(()=>document.querySelector('#exlq-1').textContent==="Q2 ✓"),name+": questão levada ao caderno aparece marcada");
 /* abrir o tema */
 await p.evaluate(()=>{const b=[...document.querySelectorAll('.exlopen')].find(x=>x.textContent==="Anemias");b.scrollIntoView({block:"center"});b.click()});await p.waitForTimeout(250);
 ok(await p.evaluate(()=>openKey==="CM-34"),name+": tocar no tema abre o tema");
 /* prova sem queda: sem o bloco */
 await p.evaluate(()=>{const P=exPg("exT");[0,1,2,3].forEach(i=>P.a[i].l="A");exRun={id:"exT",view:"res",i:0,cad:{}};qSeg="praticar";setView("quest")});await p.waitForTimeout(150);
 ok(await p.evaluate(()=>!document.querySelector('.exlost')),name+": sem especialidade em queda, o bloco não aparece");
 ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral");
 await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
