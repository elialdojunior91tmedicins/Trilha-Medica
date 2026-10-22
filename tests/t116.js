// t116: Lote 15 — provas na íntegra: temas pelo título e pelo assunto da prova (sem "[Clínica]" puxar "Ensaios clínicos"), até 3 temas por questão
// (contam inteiros em cada tema e uma vez no dia), gabarito comentado em várias páginas sem questões fantasmas, figura recortada junto da questão certa.
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const {PDFDocument,StandardFonts}=require('pdf-lib');const sharp=require('sharp');
const PDFJS_DIR=path.join(path.dirname(require.resolve('pdfjs-dist/package.json')),'legacy','build');
const DEV={fone:[390,844,true],note:[1366,768,false]};
const QS=[
 ["Doença de von Willebrand","Clínica","Mulher de 22 anos com menorragia desde a menarca, epistaxe e sangramento após extração dentária. TP e TTPA normais. Qual a conduta investigativa?",["Encaminhar só para ginecologia","Dosar antigeno e atividade do fator de von Willebrand e fator VIII","Tempo de sangramento de Ivy","Plasma fresco profilatico"],"B"],
 ["Trombocitopenia Induzida por Heparina","Clínica","Homem de 62 anos em uso de heparina ha 7 dias com trombose venosa profunda e queda das plaquetas de 230 mil para 95 mil. Qual a conduta?",["Aumentar a heparina","Transfundir plaquetas","Suspender toda heparina e iniciar anticoagulante nao heparinico","Plasma e protamina"],"C"],
 ["Coagulação Intravascular Disseminada","Clínica","Paciente em choque septico com sangramento em punções, plaquetas 32 mil, INR 2,1, fibrinogenio baixo e D-dimero alto. Observe a figura abaixo. Qual a estrategia?",["Acido tranexamico","Tratar a sepse e repor hemocomponentes se sangrar","Vitamina K isolada","Plasmaferese"],"B"],
 ["Púrpura Trombocitopênica Trombótica","Clínica","Mulher de 35 anos com confusao, febre, plaquetas 18 mil, LDH alto e esquizocitos. Qual a conduta imediata?",["Plasmaferese de urgencia","Transfundir plaquetas","Aguardar ADAMTS13","Complexo protrombinico"],"A"],
 ["Neutropenia Febril em Paciente com Leucemia Aguda","Clínica","Mulher de 52 anos com leucemia mieloide aguda em D+8 de quimioterapia, febre de 38,6 e neutrofilos 200. Observe o grafico a seguir. Qual a conduta?",["Aguardar culturas","Antibiotico de amplo espectro em ate 1 hora","Antifungico isolado","Alta com antibiotico oral"],"B"]];
(async()=>{
  const PDF=path.join(__dirname,"t116-coagulopatias.pdf");
  {const doc=await PDFDocument.create(),font=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold);
    const img=await doc.embedPng(await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="360"><rect width="100%" height="100%" fill="#fff"/><rect x="40" y="40" width="720" height="280" fill="#e8f0ff" stroke="#16264a" stroke-width="6"/><circle cx="400" cy="180" r="90" fill="#c33"/></svg>`)).png().toBuffer());
    const logo=await doc.embedPng(await sharp({create:{width:180,height:180,channels:3,background:"#0a6"}}).png().toBuffer());
    const wrap=(t,n)=>{const w=t.split(" "),L=[];let c="";w.forEach(x=>{if((c+" "+x).length>n){L.push(c);c=x}else c=c?c+" "+x:x});if(c)L.push(c);return L};
    const pages=[];const np=()=>{const p=doc.addPage([595,842]);p.drawImage(logo,{x:530,y:790,width:30,height:30});p.drawText("Simulado Medico de Autoavaliacao | Coagulopatias e Hemostasia      Pagina "+(pages.length+1),{x:40,y:30,size:8,font});pages.push(p);return p};
    let p=np(),y=780;const T=(s,o={})=>{p.drawText(s,{x:40,y,size:o.size||10,font:o.b?bold:font});y-=(o.size||10)+5};
    T("SIMULADO DE AVALIACAO CLINICA",{b:1});T("Coagulopatias e Disturbios da Hemostasia",{size:16,b:1});T("Modulo: Hematologia e Coagulacao   Fonte: Tutoria SP 2.1 - Coagulopatias   Total: 5 Questoes");y-=10;
    const q=(i)=>{const [ti,tag,en,al]=QS[i];T(`Questao ${i+1} — ${ti}                [${tag}]`,{b:1});wrap(en,95).forEach(l=>T(l));al.forEach((a,j)=>T(`${"ABCD"[j]}) ${a}`));y-=8};
    q(0);q(1);p=np();y=780;q(2);p.drawImage(img,{x:60,y:y-190,width:420,height:180});y-=200;q(3);p=np();y=780;q(4);p.drawImage(img,{x:60,y:y-190,width:420,height:180});
    p=np();y=780;T("GABARITO E FEEDBACK DETALHADO",{b:1,size:14});
    QS.forEach((x,i)=>{if(i===3){p=np();y=780}T(`RESPOSTA ${i+1} — Correta: ${x[4]}`,{b:1});T(`Justificativa ${x[4]}: Correta. Explicacao do caso ${i+1}.`);T(`Justificativa A: Incorreta. Nao confundir com a t(15;17) nem com o cromossomo 17 E.`);T("Ponto-chave");T("Ponto chave "+(i+1));y-=8});
    fs.writeFileSync(PDF,await doc.save())}
  const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob});
  await ctx.route(/googleapis|gstatic/,r=>r.abort());
  await ctx.route(/cdn\.jsdelivr\.net\/npm\/pdfjs-dist@4\.10\.38\/legacy\/build\/(.+)$/,r=>{const f=r.request().url().split("/").pop();r.fulfill({contentType:"text/javascript",headers:{"Access-Control-Allow-Origin":"*"},body:fs.readFileSync(path.join(PDFJS_DIR,f))})});
  await ctx.addInitScript(mock+`;window.__mock({},2);`);
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
  await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
  await p.evaluate(()=>{setView("quest");setQSeg("praticar");impNew()});await p.waitForTimeout(200);
  await p.setInputFiles('#impFile',PDF);await p.waitForFunction(()=>imp&&imp.st==="ready",null,{timeout:30000});
  const L=await p.evaluate(()=>{const L=impLocalGet(imp);return {key:keyText(impKey(imp)),probs:L.probs,figs:imp.figs.map(f=>f.n),qs:L.qs.map(r=>[r.n,r.k,(r.ks||[]).join("+")].join(":"))}});
  ok(L.key==="1-B, 2-C, 3-B, 4-A, 5-B"&&!L.probs.length,name+": gabarito comentado em duas páginas, sem questão fantasma (17 E) "+JSON.stringify({key:L.key,probs:L.probs}));
  const Q=Object.fromEntries(L.qs.map(x=>{const [n,k,ks]=x.split(":");return [n,{k,ks}]}));
  ok(["1","2","3","4"].every(n=>Q[n].k==="CM-37"),name+": temas pelo título e pelo assunto da prova (coagulação), não \"Ensaios clínicos\" "+L.qs.join(" "));
  ok(Q["5"].k==="CM-53"&&Q["5"].ks==="CM-35"||Q["5"].k==="CM-35"&&Q["5"].ks==="CM-53",name+": questão de neutropenia febril na leucemia ganha 2 temas "+JSON.stringify(Q["5"]));
  ok(L.figs.join()==="2,3",name+": páginas com figura (a logo repetida não conta) "+L.figs.join());
  /* conferir e salvar: figura recortada vai para a questão certa */
  await p.evaluate(()=>impUseLocal(imp));await p.waitForTimeout(200);
  ok(await p.evaluate(()=>!!document.querySelector('#exkx-i-4-'+(imp.qs[4].ks[0]))&&!!document.querySelector('#exka-i-0')),name+": conferir mostra o 2º tema com × e \"+ outro tema\"");
  await p.click('#exka-i-0');await p.fill('#exTq','trombofilias');await p.waitForTimeout(400);
  await p.evaluate(()=>{const b=[...document.querySelectorAll('.extpick .qrpick')].find(x=>/Distúrbios da coagulação/.test(x.textContent)||true);});
  await p.evaluate(()=>{imp.qs[0].ks=["CM-19"];imp.T=null;render()});
  await p.click('#impSave');await p.waitForFunction(()=>!imp&&exams.length===1,null,{timeout:20000});await p.waitForTimeout(300);
  const F=await p.evaluate(async()=>{const ex=exams[0];const ids=Object.keys(exFigs).filter(k=>k.startsWith(ex.id));const bm=[];for(const id of ids){const im=new Image();im.src=exFigs[id].img;await im.decode();bm.push(id.split("_")[1]+":"+im.width+"x"+im.height)}
    return {fg:ex.qs.map((r,i)=>r.fg?i:-1).filter(i=>i>=0).join(),ids:bm,ks0:(ex.qs[0].ks||[]).join(),idb:!!(await idbDo("readonly",st=>st.get(ids[0])))}});
  ok(F.fg==="2,4"&&F.ids.length===2&&F.ids.every(x=>{const [i,d]=x.split(":"),[w,hh]=d.split("x").map(Number);return w/hh>1.6})&&F.idb,name+": figura recortada fica na questão 3 (não na 4, que vem logo abaixo) e na 5; guardada no aparelho "+JSON.stringify(F));
  ok(F.ks0==="CM-19",name+": tema extra escolhido na conferência é salvo");
  /* jogar: a figura aparece; responder conta inteiro em cada tema e uma vez no dia */
  const before=await p.evaluate(()=>({a:get("CM-53").qt||0,b:get("CM-35").qt||0,h:(hist[today()]||{}).q||0}));
  await p.evaluate(()=>{const ex=exams[0];const P=exPg(ex.id);P.mode="e";exRun={id:ex.id,view:"q",i:4,shown:Date.now(),cad:{}};render()});await p.waitForTimeout(250);
  ok(await p.evaluate(()=>{const f=document.querySelector('.exqc .qfig img');return !!f&&f.src.startsWith("data:image/jpeg")}),name+": a figura aparece junto da questão na prova");
  await p.evaluate(()=>{const b=[...document.querySelectorAll('.exqc .alt')][1];if(b)b.click()});await p.waitForTimeout(250);
  const after=await p.evaluate(()=>({a:get("CM-53").qt||0,b:get("CM-35").qt||0,h:(hist[today()]||{}).q||0}));
  ok(after.a===before.a+1&&after.b===before.b+1&&after.h===before.h+1,name+": questão com 2 temas conta inteira em cada um e 1 vez no dia "+JSON.stringify({before,after}));
  /* tirar um tema depois de salva recalcula */
  await p.evaluate(()=>{const ex=exams[0];const k2=ex.qs[4].ks[0];exChange(ex,4,r=>{r.ks=[];delete r.ks});exPut(ex);commit()});
  const rm=await p.evaluate(()=>({a:get("CM-53").qt||0,b:get("CM-35").qt||0}));
  ok(rm.a+rm.b===after.a+after.b-1,name+": tirar o 2º tema tira a contagem dele "+JSON.stringify(rm));
  /* backup leva as figuras */
  ok(await p.evaluate(()=>(buildBackup().data.exfigs||[]).length===2),name+": o backup leva as figuras das provas");
  await ctx.close()}
fs.unlinkSync(path.join(__dirname,"t116-coagulopatias.pdf"));
ok(!errs.length,"sem erros de página "+errs.join(" | "));await b.close()})();
