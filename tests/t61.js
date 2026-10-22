const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync('mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
(async()=>{const b=await chromium.launch();const errs=[];
for(const [vw,vh,mob] of [[390,844,true],[1366,900,false]]){
const ctx=await b.newContext({viewport:{width:vw,height:vh},hasTouch:mob,isMobile:mob});await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},5);`);
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('http://localhost:8765/tests/preview.html');await p.waitForFunction(()=>typeof saveFac==='function'&&synced&&sampleFn,null,{polling:100});
const click=s=>mob?p.tap(s):p.click(s);const tag=mob?"celular":"computador";const seg=async s=>{await p.evaluate(s=>setNSeg(s),s);await p.waitForTimeout(120)};
await p.evaluate(()=>{const D=n=>fromNum(dnum(today())+n);state={"CM-1":{l:1,last:D(-1),step:0},"CM-2":{l:1,last:D(-1),step:0},"CM-3":{l:1,last:D(-9),step:2}};
  notes={"CM-1":"## Resumo\n- PA ≥ 140/90 em duas medidas\n> MAPA confirma HAS do avental branco\n- Meta ==< 130/80== em alto risco\n## Pegadinhas de prova\n- Não usar IECA na gestação","CM-9":"Texto simples sem marcações"};
  sampleFn.json=async()=>[{pergunta:"Qual o critério de HAS no consultório?",resposta:"PA ≥ 140/90 em duas medidas."},{pergunta:"IECA na gestação?",resposta:"Contraindicado."},{pergunta:"",resposta:"x"}];
  commit();setView("notas")});await seg("revisar");
// 1. reler hoje
const tt=await p.$$eval('.ntoday .ncard .etopic',a=>a.map(x=>x.textContent));ok(tt.length===1&&tt[0]===await p.evaluate(()=>BYKEY["CM-1"].t),tag+": reler hoje mostra a revisão com anotação");
ok(/Sem anotação:/.test(await p.$eval('.ntoday',x=>x.textContent)),tag+": lista os temas de hoje sem anotação");
await click('.ntoday .nreadb');await p.waitForTimeout(150);ok(await p.evaluate(()=>get("CM-1").nread===today())&&/1 de 1 relidas/.test(await p.$eval('.ntoday .todaydate',x=>x.textContent)),tag+": marcar como relida");
// 2. pegadinhas
await seg("pegadinhas");const pg=await p.$$eval('.npeg .pglist li',a=>a.map(x=>x.className+":"+x.textContent));
ok(pg.length===3&&pg.some(x=>/peg:MAPA/.test(x))&&pg.some(x=>/dest:< 130\/80/.test(x))&&pg.some(x=>/peg:Não usar IECA/.test(x)),tag+": pegadinhas e destaques: "+pg.join(" | "));
// 4. cobertura
await seg("todas");if(!(await p.$('#nNoNoteB'))){await click('#nFBtn');await p.waitForTimeout(150)}ok(/sem anotação · 2/.test(await p.$eval('#nNoNoteB',x=>x.textContent)),tag+": cobertura (agora filtro do caderno)");
await click('#nNoNoteB');await p.waitForTimeout(150);ok((await p.$$eval('#nlist .nnone',a=>a.length))===2,tag+": lista temas sem anotação");
await click('#nlist .nnone .efoot .mini');await p.waitForTimeout(300);ok(await p.evaluate(()=>view==="temas"&&openKey&&detTab[openKey]==="notas"),tag+": escrever resumo abre o tema na aba Anotações");
// 3. cartões
await p.evaluate(()=>{nNoNote=false;detTab["CM-1"]="notas";openTopic("CM-1")});await p.waitForTimeout(250);
await click('#t-CM-1 .cardsblk .btn');await p.waitForTimeout(300);ok((await p.$$eval('#t-CM-1 .cdrev li',a=>a.length))===2,tag+": Claude cria cartões (só os válidos)");
await click('#t-CM-1 .cdrev li:nth-child(2) input');await click('#t-CM-1 .cardsblk .btn.primary');await p.waitForTimeout(200);ok(await p.evaluate(()=>cards.length===1),tag+": salvar só os marcados");
await click('#t-CM-1 .cardsblk .link');await p.fill('#cdq-CM-1','Pergunta manual?');await p.fill('#cda-CM-1','Resposta manual.');await click('#t-CM-1 .cdform .btn');await p.waitForTimeout(150);ok(await p.evaluate(()=>cards.length===2&&cards[1].src==="eu"),tag+": cartão manual");
await p.waitForTimeout(800);ok(await p.evaluate(()=>Object.keys(window.__store).filter(k=>k.includes("/progress/cards/")).length===2),tag+": cartões gravados na conta");
await p.evaluate(()=>setView("notas"));await seg("revisar");ok(/Revisar 2 cartões/.test(await p.$eval('#cdGo',x=>x.textContent)),tag+": cartões de hoje");
await click('#cdGo');await p.waitForTimeout(100);ok(!(await p.isVisible('.oscard .osa')),tag+": resposta escondida");await click('#cdShow');await p.waitForTimeout(100);ok(await p.isVisible('.oscard .osa'),tag+": mostrar resposta");
await click('#cdR3');await p.waitForTimeout(100);await click('#cdShow');await click('#cdR1');await p.waitForTimeout(150);await click('#cdShow');await click('#cdR3');await p.waitForTimeout(150);
const st=await p.evaluate(()=>cards.map(x=>x.f.st+":"+x.f.lapses+":"+(dnum(x.due)-dnum(today()))).sort());ok(st.length===2&&st.every(x=>/^2:0:[1-9]\d*$/.test(x)),tag+": Bom agenda; Errei volta na sessão e depois Bom "+st);
ok(/Fim por hoje: 3 respostas \(Errei 1 · Difícil 0 · Bom 2 · Fácil 0\)/.test(await p.$eval('.ncards',x=>x.textContent)),tag+": resultado");await click('.ncards .btn.primary');
ok(await p.evaluate(()=>buildBackup().data.cards.length===2),tag+": backup leva os cartões");
ok(await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=0,tag+": sem rolagem horizontal");
await p.evaluate(()=>{scrollTo(0,0)});await p.screenshot({path:`nt-${mob?"fone":"desk"}.png`,fullPage:!mob});
await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
