// t143 (Lote 21, itens 4 e 5): Provas na íntegra em largura inteira (grupos recolhíveis) e Pegadinhas com resumo na coluna da direita
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],note:[1366,900,false],monitor:[1920,1080,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name],two=!mob;
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob});
 await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
 await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
 const click=async s=>{await p.evaluate(s=>{const x=document.querySelector(s);if(x)x.scrollIntoView({block:"center"})},s);await (mob?p.tap(s):p.click(s));await p.waitForTimeout(150)};
 /* item 4: provas */
 await p.evaluate(()=>{const mk=(id,name,banca,ano)=>exClean({id,name,banca,ano,qs:Array.from({length:4},(_,i)=>({n:i+1,k:"CM-1",g:"b",q:{enunciado:"x",alternativas:[{letra:"A",texto:"a"},{letra:"B",texto:"b"}],correta:"A",comentario:""}}))});
   for(let i=0;i<12;i++)exams.push(mk("ex"+i,`${["ENARE","USP","SUS-SP"][i%3]} ${2015+i}`,["ENARE","USP","SUS-SP"][i%3],String(2015+i)));exSaveLocal();backStack=[];setView("quest");if(typeof setQSeg==="function")setQSeg("praticar");render()});await p.waitForTimeout(300);
 const Q=await p.evaluate(()=>{const v=$("#viewQuest"),eb=$("#qExamBox"),ex=$("#qExtra"),c=eb.querySelector(".qexam"),cards=[...eb.querySelectorAll(".excard")];const r=eb.getBoundingClientRect(),rv=v.getBoundingClientRect();
   const tops=cards.slice(0,6).map(x=>Math.round(x.getBoundingClientRect().top)),perRow=tops.filter(t=>t===tops[0]).length;
   return {inBox:!!c,notInExtra:!ex.querySelector(".qexam"),wide:r.width/rv.width,below:r.top>=ex.getBoundingClientRect().bottom-2,perRow,sim:!!ex.querySelector(".qsim,#simQuick,[aria-labelledby]")}});
 ok(Q.inBox&&Q.notInExtra,name+": Provas na íntegra fora da coluna da direita "+JSON.stringify(Q));
 if(two){ok(Q.wide>0.95&&Q.below,name+": em largura inteira, abaixo das duas colunas");ok(Q.perRow>=3&&Q.perRow<=6,name+": 3 ou mais provas por linha ("+Q.perRow+")")}
 else ok(Q.perRow===1,name+": no celular, uma prova por linha");
 await click('#exG-0');
 ok(await p.evaluate(()=>exGrpShut.size===1&&document.querySelector('#exG-0').getAttribute("aria-expanded")==="false"&&JSON.parse(localStorage.getItem("resid-exgrp")).length===1),name+": grupo da banca recolhe e é lembrado");
 const n0=await p.evaluate(()=>document.querySelectorAll('#qExamBox .excard').length);ok(n0===8,name+": o grupo recolhido esconde as provas dele ("+n0+")");
 await click('#exG-0');ok(await p.evaluate(()=>!exGrpShut.size),name+": tocar de novo abre");
 /* item 5: pegadinhas */
 await p.evaluate(()=>{const k=ALL.find(i=>/HIV/.test(i.t)).key,k2=ALL[0].key;let t="## Pegadinhas\n";for(let i=0;i<9;i++)t+=`> Pegadinha: item ${i} da HIV — Por quê: motivo ${i}\n`;notes[k]=t;notes[k2]="Texto com ==destaque um== e ==destaque dois==.";
   window.__k=k;backStack=[];setView("notas");setNSeg("pegadinhas");render()});await p.waitForTimeout(300);
 if(two){
   const S=await p.evaluate(()=>{const c=document.querySelector('#nSide .npeg');return {side:!!c&&c.classList.contains("npegside"),items:c.querySelectorAll('.pgi').length,topics:c.querySelectorAll('.pgtb').length,all:!!c.querySelector('#pgAll'),go:!!c.querySelector('#pgGo'),full:$("#nPegFull").hidden,ov:getComputedStyle(c).overflowY}});
   ok(S.side&&S.items===0&&S.all&&S.go&&S.full&&S.ov==="auto",name+": coluna da direita só com o resumo (filtros, revisar, ver todas), sem a lista "+JSON.stringify(S));
   await p.evaluate(()=>{document.querySelectorAll('#nSide .npeg details.pgsec').forEach(d=>{d.open=true})});await p.waitForTimeout(100);
   const tid=await p.evaluate(()=>[...document.querySelectorAll('#nSide .pgtb')].find(b=>/HIV/.test(b.textContent)).id);await click('#'+tid);
   ok(await p.evaluate(()=>{const c=document.querySelector('#nSide .npeg');return c.querySelectorAll('.pgi').length===5&&/ver mais 4/.test(c.querySelector('.pgmore').textContent)}),name+": abrir o tema mostra 5 itens e 'ver mais 4'");
   await click('#nSide .pgmore');
   ok(await p.evaluate(()=>document.querySelectorAll('#nSide .npeg .pgi').length===0&&!pgTopOpen.size),name+": ao abrir a lista inteira, o tema da direita fecha sozinho");
   ok(await p.evaluate(()=>{const f=$("#nPegFull");return !f.hidden&&f.querySelectorAll('.pgi').length===11&&!!f.querySelector(`[data-pgt="${window.__k}"]`)&&!f.querySelector('#pgGo')}),name+": 'ver mais' abre a lista inteira na coluna principal");
   ok(await p.evaluate(()=>{const f=$("#nPegFull").getBoundingClientRect(),s=$("#nSide").getBoundingClientRect();return f.right<=s.left+2&&f.width>s.width}),name+": a lista inteira fica na coluna principal, mais larga");
   await click('#pgFullX');ok(await p.evaluate(()=>$("#nPegFull").hidden&&!pgFull),name+": Fechar esconde a lista inteira");
   await click('#pgAll');ok(await p.evaluate(()=>!$("#nPegFull").hidden),name+": 'Ver todas' abre a lista inteira")}
 else{ok(await p.evaluate(()=>{const c=document.querySelector('#nPegBox .npeg');return !c.classList.contains("npegside")&&c.querySelectorAll('.pgi').length===11&&$("#nPegFull").hidden}),name+": no celular a parte Pegadinhas continua com a lista inteira")}
 ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral");
 await ctx.close()}
ok(!errs.length,"sem erros de JavaScript "+errs.join(" | "));await b.close()})();
