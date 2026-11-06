// Capturas do B4 (provas oficiais): lista das provas, cartão da prova oficial, gabarito preliminar × definitivo, conferir subtópicos,
// comentário do Claude na questão do banco, filtro por subtópico. Uso: node shotsB4.js [pasta]
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const out=process.argv[2]||'/tmp/shotsB4';fs.mkdirSync(out,{recursive:true});
const SEED=`(async()=>{await bankBootP;const Q=(e,a,c,co)=>({enunciado:e,alternativas:a.map((t,i)=>({letra:"ABCDE"[i],texto:t})),correta:c,comentario:co||""});
  const s0=subList(BYKEY["CM-1"])[0].t;
  const qs=[["CM-1","Mulher de 52 anos, hipertensa, retorna para "+s0.toLowerCase()+". A PA foi medida logo após subir escadas. Qual a conduta?",["Repetir a medida após 5 minutos de repouso","Iniciar dois anti-hipertensivos","Solicitar MAPA de imediato","Encaminhar à emergência","Aumentar a dose do diurético"],"A"],
   ["CM-7","Homem de 64 anos com dor torácica há 2 horas e supradesnivelamento de ST em DII, DIII e aVF. Qual artéria está mais provavelmente acometida?",["Descendente anterior","Coronária direita","Circunflexa","Tronco da coronária esquerda","Ramo diagonal"],"B"],
   ["PED-1","Lactente de 8 meses com febre alta por 3 dias e exantema maculopapular que surge após a queda da febre. Qual o agente?",["Herpesvírus humano 6","Vírus do sarampo","Parvovírus B19","Vírus da rubéola","Enterovírus"],"A"],
   ["GO-1","Gestante de 34 semanas com PA 164x112 mmHg, cefaleia e escotomas. Além do anti-hipertensivo, qual a conduta imediata?",["Sulfato de magnésio","Observação por 24 horas","Corticoide e alta","Diurético de alça","Parto cesáreo imediato"],"A"]];
  const mk=(id,name,b,a,niv,kst,n)=>exClean({id,name,banca:b,ano:a,of:1,niv,kst,at:a+"-10-01T10:00:00.000Z",qs:qs.slice(0,n).map(([k,e,al,c],i)=>({n:i+1,k,g:"b",q:Q(e,al,c)}))});
  exams=[mk("exA","ENARE 2025 (prova própria, R1)","ENARE","2025","R1","p",4),mk("exB","Revalida 2024.1","REVALIDA","2024","Revalida","d",3)];exams.forEach(e=>exPut(e));
  bankFeedAll();await new Promise(r=>setTimeout(r,900));await bankFlush();exams.forEach(e=>{e.qs.forEach(r=>{delete r.sbg});if(sbFill(e))exPut(e)});ofOpen=true;render()})()`;
(async()=>{const b=await chromium.launch();
 const shot=async(name,vp,opt,fn)=>{const ctx=await b.newContext({viewport:vp,isMobile:!!opt.mob,hasTouch:!!opt.mob,colorScheme:opt.dark?'dark':'light'});await ctx.route(/googleapis|gstatic/,r=>r.abort());
   await ctx.addInitScript(mock+`;window.__qLegacy=false;window.__noSheet=false;window.__mock({},1);`);const p=await ctx.newPage();await p.goto('http://localhost:8765/tests/preview.html');
   await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn&&bankBootP,null,{timeout:15000});await p.evaluate(()=>{qPart="provas";setView("quest")});await p.evaluate(SEED);await p.waitForTimeout(300);
   if(fn)await fn(p);await p.waitForTimeout(250);await p.screenshot({path:`${out}/${name}.png`,fullPage:!!opt.full});await ctx.close()};
 const top=s=>async p=>{await p.evaluate(s=>{const e=document.querySelector(s);if(e)e.scrollIntoView({block:"start"});window.scrollBy(0,-12)},s)};
 await shot('1-computador-provas-oficiais',{width:1366,height:900},{},top(".ofcat"));
 await shot('2-computador-cartao-e-gabarito',{width:1366,height:900},{},async p=>{await p.click("#exkb-exA");await p.click("#exKs-d");await p.fill("#exKeyTa","1-A 2-C 3-A 4-ANULADA");await p.waitForTimeout(400);await top("#exr-exA")(p)});
 await shot('3-computador-gabarito-aplicado',{width:1366,height:900},{},async p=>{await p.click("#exkb-exA");await p.click("#exKs-d");await p.fill("#exKeyTa","1-A 2-C 3-A 4-ANULADA");await p.waitForTimeout(400);await p.click("#exKeyGo");await p.waitForTimeout(200);await top("#exr-exA")(p)});
 await shot('4-computador-conferir-subtopicos',{width:1366,height:900},{},async p=>{await p.click("#exsbd-exA");await top("#exr-exA")(p)});
 await shot('5-computador-banco-comentar',{width:1366,height:900},{},async p=>{await p.evaluate(()=>{qPart="banco";const x=bank.find(y=>y.ex==="exA"&&y.ei===1);bkStart([x.id],"e");render()});await p.click("#bka-A");await p.evaluate(()=>document.querySelector("#bkcm-0").scrollIntoView({block:"center"}))});
 await shot('6-computador-filtro-subtopico',{width:1366,height:900},{},async p=>{await p.evaluate(()=>{qPart="banco";bkF=bkFClean({area:"CM",k:"CM-1"});render()})});
 await shot('7-celular-provas-oficiais',{width:390,height:844},{mob:true},top(".ofcat"));
 await shot('8-celular-cartao-escuro',{width:390,height:844},{mob:true,dark:true},top("#exr-exA"));
 await shot('9-computador-importar-oficial',{width:1366,height:900},{},async p=>{await p.evaluate(()=>{ofImport(OF_CAT[0][1][1]);Object.assign(imp,{st:"ready",pages:[{n:1,t:"Questão 1\nEnunciado\nA) a\nB) b"}],keyPg:[]});render()});await top("#impPanel")(p)});
 await b.close();console.log("ok",out)})();
