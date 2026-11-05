// Capturas do Banco de questões (B2): computador (lista e modo prova) e celular, claro e escuro. Uso: node shotsB2.js [pasta]
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const out=process.argv[2]||'/tmp/shotsB2';fs.mkdirSync(out,{recursive:true});
const SEED=`(async()=>{await bankBootP;const Q=(e,a,c)=>({enunciado:e,alternativas:a.map((t,i)=>({letra:"ABCDE"[i],texto:t,porque:i?"Não é a conduta indicada neste cenário.":""})),correta:c,comentario:"O achado decisivo define a conduta; as outras alternativas não se aplicam a este quadro.",conceito:"Conceito-chave"});
  const P=[["CM-1","Mulher de 52 anos, hipertensa, com PA 168x102 mmHg em três consultas e creatinina normal. Qual o tratamento inicial mais adequado?",["Monoterapia com diurético tiazídico","Associação de IECA e bloqueador de canal de cálcio","Betabloqueador isolado","Apenas mudança de estilo de vida por 6 meses"],"B"],
   ["CM-7","Homem de 64 anos com dor torácica há 2 horas e supradesnivelamento de ST em DII, DIII e aVF. Qual artéria está mais provavelmente acometida?",["Descendente anterior","Coronária direita","Circunflexa","Tronco da coronária esquerda"],"B"],
   ["PED-1","Lactente de 8 meses com febre alta por 3 dias e exantema maculopapular que surge após a queda da febre. Qual o agente?",["Herpesvírus humano 6","Vírus do sarampo","Parvovírus B19","Vírus da rubéola"],"A"],
   ["GO-1","Gestante de 34 semanas com PA 164x112 mmHg, cefaleia e escotomas. Além do anti-hipertensivo, qual a conduta imediata?",["Sulfato de magnésio","Observação por 24 horas","Corticoide e alta","Diurético de alça"],"A"],
   ["CIR-1","Homem de 25 anos vítima de colisão, com dor abdominal, PA 80x50 e FAST positivo. Qual a conduta?",["Tomografia de abdome","Laparotomia exploradora","Observação seriada","Lavado peritoneal"],"B"],
   ["PREV-1","Em um teste diagnóstico, a probabilidade de o exame ser positivo nos doentes é chamada de:",["Especificidade","Valor preditivo positivo","Sensibilidade","Acurácia"],"C"]];
  const mk=(n,b,a,qs)=>exClean({id:"ex"+n,name:b+" "+a,banca:b,ano:a,at:a+"-10-01T10:00:00.000Z",qs:qs.map(([k,e,al,c],i)=>({n:i+1,k,g:"b",q:Q(e,al,c)}))});
  exams=[mk(1,"ENARE","2024",P.slice(0,4)),mk(2,"SUS-SP","2023",P.slice(2,6)),mk(3,"USP","2025",P.slice(0,3))];
  exProg=[exPClean({id:"ex1",a:{0:{l:"A",d:"2026-10-20",s:140},1:{l:"B",d:"2026-10-20",s:95},2:{l:"A",d:"2026-10-20",s:60}}}),exPClean({id:"ex2",a:{0:{l:"C",d:"2026-10-28",s:110}}})];
  bankFeedAll();for(let i=1;i<=9;i++)bankAdd(Q("Gerada "+i+": paciente com diabetes tipo 2, HbA1c de "+(7+i/10).toFixed(1)+"% em uso de metformina e doença cardiovascular estabelecida. Qual a melhor associação?",["Sulfonilureia","Inibidor de SGLT2 ou análogo de GLP-1","Insulina NPH","Acarbose"],"B"),"gerada","CM-1");
  await new Promise(r=>setTimeout(r,60));await bankFlush();const t=bank.find(x=>x.q.enunciado.startsWith("Homem de 64"));["2026-10-02","2026-10-12","2026-10-22"].forEach(d=>bhAdd(t.id,{d,l:"A",ok:0,s:80,src:"exam"}));
  const f=bank.find(x=>x.q.enunciado.startsWith("Lactente"));f.fav=1;await bankFlush();render()})()`;
(async()=>{const b=await chromium.launch();
 const shot=async(name,vp,opt,fn)=>{const ctx=await b.newContext({viewport:vp,isMobile:!!opt.mob,hasTouch:!!opt.mob,colorScheme:opt.dark?'dark':'light'});await ctx.route(/googleapis|gstatic/,r=>r.abort());
   await ctx.addInitScript(mock+`;window.__qLegacy=false;window.__noSheet=false;window.__mock({},1);`);const p=await ctx.newPage();await p.goto('http://localhost:8765/tests/preview.html');
   await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn&&bankBootP,null,{timeout:15000});await p.evaluate(()=>{qPart="banco";setView("quest")});await p.evaluate(SEED);await p.waitForTimeout(300);
   if(fn)await fn(p);await p.waitForTimeout(250);await p.screenshot({path:`${out}/${name}.png`,fullPage:!!opt.full});await ctx.close()};
 await shot('1-computador-banco',{width:1366,height:900},{});
 await shot('2-computador-questao-aberta',{width:1366,height:900},{},async p=>{const id=await p.evaluate(()=>bank.find(x=>x.q.enunciado.startsWith("Homem de 64")).id);await p.click("#bkr-"+id);await p.evaluate(id=>document.getElementById("bkr-"+id).scrollIntoView({block:"start"}),id)});
 await shot('3-computador-modo-prova',{width:1366,height:900},{},async p=>{await p.click("#bkSimB");await p.click("#bkSimN-10");await p.click("#bkSimGo");await p.click("#bka-B");await p.click("#bkNextP")});
 await shot('4-computador-estudo-escuro',{width:1366,height:900},{dark:true},async p=>{await p.click("#bkC-nr");await p.click("#bkGo");await p.click("#bka-A")});
 await shot('5-celular-banco',{width:390,height:844},{mob:true});
 await shot('6-celular-partes',{width:390,height:844},{mob:true},async p=>{await p.tap("#qpBtn")});
 await shot('7-celular-filtros-escuro',{width:390,height:844},{mob:true,dark:true},async p=>{await p.tap("#bkFBtn")});
 await shot('8-celular-tela-inteira',{width:390,height:844},{mob:true},async p=>{await p.tap("#bkGo");await p.tap("#bkFullB");await p.tap("#bka-A")});
 await shot('9-celular-deitado',{width:844,height:390},{mob:true},async p=>{await p.evaluate(()=>{lsSet("resid-bkfull","1");bkFull=true});await p.tap("#bkGo");await p.waitForTimeout(150)});
 await shot('10-celular-menu-na-tela-inteira',{width:390,height:844},{mob:true,dark:true},async p=>{await p.evaluate(()=>{lsSet("resid-bkfull","1");bkFull=true});await p.tap("#bkSimB");await p.tap("#bkSimGo");await p.tap("#bkFMenu");await p.waitForTimeout(400)});
 await b.close();console.log("ok",out)})();
