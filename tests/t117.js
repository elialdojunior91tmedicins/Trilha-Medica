// t117: Lote 16 — catálogo de provas no Perfil: sugestões ao digitar (nome, UF, banca, mês habitual), escolher preenche o nome e uma data estimada
// pelo mês habitual (marcada, some ao trocar a data), lista por região com Principais/Outras e "+ Adicionar", e continua aceitando qualquer nome.
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],ipad578:[578,820,true],note:[1366,768,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,screen:name==="ipad578"?{width:1180,height:820}:undefined,userAgent:name==="ipad578"?"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)":undefined});
  await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
  await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
  const click=async s=>{await p.evaluate(s=>{const x=document.querySelector(s);if(x)x.scrollIntoView({block:"center"})},s);await (mob?p.tap(s):p.click(s));await p.waitForTimeout(160)};
  await p.evaluate(()=>{ui.profile.exams=[];delete ui.profile.mainEx;saveUI();goSub("perfil")});await p.waitForTimeout(250);
  await click('#pfExAdd');const id=await p.evaluate(()=>exList()[0].id);
  await p.fill('#pfExName-'+id,'huol');await p.waitForTimeout(200);
  const S=await p.evaluate(id=>[...document.querySelectorAll(`[id^="exs-${id}-"]`)].map(b=>b.textContent),id);
  ok(S.length>=1&&/HUOL \/ UFRN \(pelo ENARE\)/.test(S[0])&&/RN · FGV \(ENARE\) · costuma ser em setembro · seleção pelo ENARE/.test(S[0]),name+": digitar 'huol' sugere HUOL/UFRN pelo ENARE "+JSON.stringify(S));
  await click(`#exs-${id}-0`);
  const E=await p.evaluate(()=>({n:exList()[0].name,d:exList()[0].date,est:exList()[0].est,main:ui.profile.mainEx===exList()[0].id,note:(document.querySelector('.exnote')||{}).textContent||""}));
  ok(E.n==="HUOL / UFRN (pelo ENARE)"&&/^\d{4}-09-15$/.test(E.d)&&E.est===1&&E.main&&/Data estimada/.test(E.note),name+": escolher preenche nome e data estimada no mês habitual "+JSON.stringify(E));
  await p.fill('#pfExDate-'+id,'2027-09-12');await p.dispatchEvent('#pfExDate-'+id,'change');await p.waitForTimeout(200);
  ok(await p.evaluate(()=>exList()[0].date==="2027-09-12"&&!exList()[0].est&&!/Data estimada/.test((document.querySelector('.exnote')||{}).textContent||"")),name+": trocar a data tira a marca de estimada");
  /* nome livre continua valendo */
  await click('#pfExAdd');const id2=await p.evaluate(()=>exList()[1].id);await p.fill('#pfExName-'+id2,'Hospital XYZ 2027');await p.dispatchEvent('#pfExName-'+id2,'change');await p.waitForTimeout(200);
  ok(await p.evaluate(()=>exList()[1].name==="Hospital XYZ 2027"&&!exList()[1].date),name+": dá para digitar uma prova que não está no catálogo");
  /* catálogo por região */
  await click('#pfExCat');
  const C=await p.evaluate(()=>({reg:[...document.querySelectorAll('#excPanel .seg button')].map(b=>b.textContent.replace(/ · \d+$/,"")).join(),on:document.querySelector('#excPanel .seg [aria-pressed="true"]').textContent.replace(/ · \d+$/,""),
    heads:[...document.querySelectorAll('#excPanel .exch2')].map(x=>x.textContent).join(),first:document.querySelector('#excPanel .excrow b').textContent,huol:[...document.querySelectorAll('#excPanel .excrow')].find(r=>/HUOL/.test(r.textContent)).querySelector('button').textContent}));
  ok(C.reg==="Nacionais,Nordeste,Norte,Centro-Oeste,Sudeste,Sul"&&C.on==="Nordeste"&&C.heads==="Principais,Outras"&&/HUOL/.test(C.first)&&C.huol==="Na sua lista",name+": catálogo abre no Nordeste, com HUOL no topo já marcado "+JSON.stringify(C));
  await click('#excR-SE');const iI=await p.evaluate(()=>EX_CAT.findIndex(c=>c.n==="IAMSPE"));
  ok(await p.evaluate(()=>[...document.querySelectorAll('#excPanel .excrow')].some(r=>/IAMSPE/.test(r.textContent)&&/Instituto Avança São Paulo/.test(r.textContent))),name+": Sudeste traz as 'Outras' (IAMSPE com a banca)");
  await click('#excA-'+iI);
  ok(await p.evaluate(()=>exList().length===3&&exList()[2].name==="IAMSPE"&&exList()[2].est===1&&/-11-15$/.test(exList()[2].date)),name+": + Adicionar põe a prova na lista com data estimada");
  await ctx.close()}
ok(!errs.length,"sem erros de página "+errs.join(" | "));await b.close()})();
