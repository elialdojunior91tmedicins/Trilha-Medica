// t115: Lote 14 — simulado misto completo: Escolher temas (busca, filtros, subtópicos), dificuldade, estilo ENAMED/INEP, resumo antes de começar,
// material em partes (até 100 mil) com figuras numeradas (questão com figura; a imagem só fica, menor, no Refazer), Meus simulados (rever, refazer sem contar, mesmos temas).
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const {PDFDocument,StandardFonts}=require('pdf-lib');const sharp=require('sharp');
const PDFJS_DIR=path.join(path.dirname(require.resolve('pdfjs-dist/package.json')),'legacy','build');
const DEV={fone:[390,844,true],ipad578:[578,820,true],note:[1366,768,false]};
const Q=(n,extra)=>({enunciado:"Caso "+n+" de hipertensão com dado decisivo",alternativas:"ABCD".split("").map(l=>({letra:l,texto:"Alternativa "+l+" do caso "+n,porque:l==="A"?"":"Errada."})),correta:"A",comentario:"Comentário "+n,conceito:"Conceito "+n,alerta:"",fonte:"Diretriz Brasileira de Hipertensão, SBC, 2020",...(extra||{})});
(async()=>{
  /* PDF: logo pequena em todas as páginas (não é figura), página 2 com um ECG grande (figura), texto longo (passa de 30 mil → partes) */
  const PDF=path.join(__dirname,"t115-aula.pdf");
  {const doc=await PDFDocument.create(),font=await doc.embedFont(StandardFonts.Helvetica);
    const logo=await doc.embedPng(await sharp({create:{width:200,height:200,channels:3,background:"#16264a"}}).png().toBuffer());
    const ecg=await doc.embedPng(await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="500"><rect width="100%" height="100%" fill="#fff"/><path d="M20 250 l80 0 l20 -150 l20 260 l20 -110 l80 0 l20 -150 l20 260 l20 -110 l80 0" stroke="#c00" fill="none" stroke-width="4"/></svg>`)).png().toBuffer());
    const line="Texto da aula de hipertensao arterial com criterios, metas e condutas para o estudo da residencia medica, linha ";
    for(let pg=1;pg<=8;pg++){const p=doc.addPage([595,842]);p.drawImage(logo,{x:520,y:780,width:40,height:40});let y=770;
      p.drawText(`Aula de hipertensao - pagina ${pg}`,{x:40,y,size:12,font});y-=16;
      if(pg===2){p.drawImage(ecg,{x:40,y:420,width:500,height:280});p.drawText("Figura: ECG com sobrecarga ventricular esquerda",{x:40,y:400,size:10,font});}
      else for(let i=0;i<48;i++){p.drawText(line+i,{x:40,y,size:8,font});y-=15}}
    fs.writeFileSync(PDF,await doc.save())}
  const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,screen:name==="ipad578"?{width:1180,height:820}:undefined,userAgent:name==="ipad578"?"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)":undefined});
  await ctx.route(/googleapis|gstatic/,r=>r.abort());
  await ctx.route(/cdn\.jsdelivr\.net\/npm\/pdfjs-dist@4\.10\.38\/legacy\/build\/(.+)$/,r=>{const f=r.request().url().split("/").pop();r.fulfill({contentType:"text/javascript",headers:{"Access-Control-Allow-Origin":"*"},body:fs.readFileSync(path.join(PDFJS_DIR,f))})});
  await ctx.addInitScript(mock+`;window.__mock({},2);`);
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
  await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn&&sampleFn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
  const click=async s=>{await p.evaluate(s=>{const x=document.querySelector(s);if(x)x.scrollIntoView({block:"center"})},s);await (mob?p.tap(s):p.click(s));await p.waitForTimeout(150)};
  await p.evaluate(([q1])=>{window.__P=[];window.__O=[];sampleFn.limits=async()=>({images:{maxCount:5}});
    sampleFn.json=async(input,o)=>{__P.push(input);__O.push(o||{});const n=+((input.match(/(?:simulado com|Crie) (\d+)/)||[])[1]||1),fig=/- Figura 1:/.test(input);
      return Array.from({length:n},(_,i)=>({...q1,enunciado:q1.enunciado+" #"+(__P.length*10+i),...(fig&&i===0?{figura:1}:{figura:0}),...(/"tema"/.test(input)?{tema:"CM-1"}:{})}))};
    sim=null;simCfg={src:"weak",n:5,dif:"mista",est:"res"};simPick=new Set();simSubs={};backStack=[];setView("quest");setQSeg("praticar")},[Q(1)]);await p.waitForTimeout(250);
  /* 1. Escolher temas: busca, filtro, subtópicos, resumo */
  await click('#simS-pick');
  ok(await p.evaluate(()=>!!document.querySelector('#simPq')&&document.querySelector('#simGo').disabled&&/Marque pelo menos um tema/.test(document.querySelector('.qsim').textContent)),name+": Escolher temas abre a busca e pede um tema");
  await p.fill('#simPq','hipertensão arterial sist');await p.waitForTimeout(450);
  ok(await p.evaluate(()=>!!document.querySelector('#spk-CM-1')),name+": a busca acha o tema");
  await click('#spk-CM-1');await p.waitForTimeout(150);
  await p.evaluate(()=>{const d=document.querySelector('.spsubs');if(d)d.open=true});await click('#sps-CM-1-1');await p.waitForTimeout(150);
  const P1=await p.evaluate(()=>({pick:[...simPick].join(),subs:(simSubs["CM-1"]||[]).length,chip:!!document.querySelector('#spx-CM-1'),sum:document.querySelector('.simsum').textContent}));
  ok(P1.pick==="CM-1"&&P1.subs===1&&P1.chip&&/Temas · 1/.test(P1.sum)&&/1 subtópico/.test(P1.sum),name+": tema e 1 subtópico escolhidos, resumo mostra "+JSON.stringify(P1));
  await p.fill('#simPq','');await p.waitForTimeout(400);await click('#simPi-3');
  ok(await p.evaluate(()=>[...document.querySelectorAll('.spk>label input')].every(i=>{const k=i.id.slice(4);return BYKEY[k]&&!BYKEY[k].own&&wOf(BYKEY[k])>=3})),name+": filtro Muito alta incidência");
  await click('#simPi-3');
  /* 2. dificuldade e estilo entram no pedido */
  await click('#simD-dificil');await click('#simE-inep');await click('#simN-5');
  const S2=await p.evaluate(()=>document.querySelector('.simsum').textContent);ok(/Difícil/.test(S2)&&/ENAMED/.test(S2)&&/5 ·/.test(S2),name+": resumo com dificuldade e estilo "+S2.slice(0,120));
  await p.evaluate(()=>{__P=[]});await click('#simGo');await p.waitForFunction(()=>sim&&sim.status==="run"&&sim.gen,null,{timeout:10000});
  const PR=await p.evaluate(()=>({p:__P[0],sub:subList(BYKEY["CM-1"])[1].t}));
  ok(/Nível difícil/.test(PR.p)&&/exatamente 4 alternativas \(A a D\)/.test(PR.p)&&PR.p.includes(`foco no subtópico "${PR.sub}"`),name+": pedido com nível, estilo ENAMED e o subtópico escolhido");
  /* 3. terminar → Meus simulados */
  for(let i=0;i<5;i++){await p.evaluate(i=>{simAnswer(i%2?"B":"A");render()},i);await p.evaluate(()=>simNext())}
  const H=await p.evaluate(()=>({n:sims.length,hit:sims[0]&&sims[0].hit,ans:sims[0]&&sims[0].ans,lab:sims[0]&&sims[0].lab,row:!!document.querySelector('.smrow'),dif:sims[0]&&sims[0].dif}));
  ok(H.n===1&&H.hit===3&&H.ans===5&&/Escolher temas/.test(H.lab)&&H.dif==="dificil",name+": simulado guardado em Meus simulados "+JSON.stringify(H));
  await p.evaluate(()=>{sim=null;render()});await p.waitForTimeout(150);
  ok(await p.evaluate(()=>!!document.querySelector('.smrow')),name+": lista Meus simulados aparece na configuração");
  const id=await p.evaluate(()=>sims[0].id);
  await click('#smv-'+id);await click(`#smq-${id}-1`);
  ok(await p.evaluate(id=>{const r=document.querySelector('#sm-'+id+' .smq');return !!r&&/Caso 1/.test(r.querySelector('.qstem').textContent)&&/Você marcou B/.test(r.textContent)},id),name+": Rever abre a questão com a sua resposta");
  /* refazer: não conta no acerto */
  const qt0=await p.evaluate(()=>get("CM-1").qt||0);await click('#smr-'+id);
  ok(await p.evaluate(()=>sim&&sim.rerun&&/REFAZENDO/.test(document.querySelector('.qsim .qn').textContent)),name+": Refazer estas abre as mesmas questões");
  for(let i=0;i<5;i++){await p.evaluate(()=>{simAnswer(sim.qs[sim.i].correta);render()});await p.evaluate(()=>simNext())}
  const R=await p.evaluate(([id,qt0])=>({qt:get("CM-1").qt||0,qt0,tries:sims.find(x=>x.id===id).tries,n:sims.length}),[id,qt0]);
  ok(R.qt===R.qt0&&R.tries.length===1&&R.tries[0].hit===5&&R.n===1,name+": refazer não conta no acerto e anota a tentativa "+JSON.stringify(R));
  ok(await p.evaluate(()=>{const W=qWeekQ(dnum(today())-(new Date().getDay()+6)%7);return (hist[today()].rq||0)===5&&W.g===W.q+5}),name+": as refeitas contam na meta semanal (não no acerto)");
  /* mesmos temas, questões novas */
  await p.evaluate(()=>{sim=null;simPick=new Set();simSubs={};simCfg={src:"weak",n:10,dif:"mista",est:"res"};__P=[];render()});await click('#sma-'+id);
  await p.waitForFunction(()=>sim&&sim.status==="run",null,{timeout:10000});
  ok(await p.evaluate(()=>simCfg.src==="pick"&&simPick.has("CM-1")&&simCfg.dif==="dificil"&&simCfg.est==="inep"&&/Nível difícil/.test(__P[0])),name+": Mesmos temas repete fonte, temas e ajustes com questões novas");
  await p.evaluate(()=>{sim.stopped=true;sim=null;render()});
  /* 4. material em partes com figura */
  await p.evaluate(()=>{simCfg.mode="mat";simCfg.n=5;simCfg.est="res";simCfg.dif="mista";render()});await p.waitForTimeout(150);
  await p.setInputFiles('#smf',PDF);await p.waitForFunction(()=>simMat&&!simMat.busy&&simMat.items.length===1,null,{timeout:30000});await p.waitForTimeout(200);
  const M=await p.evaluate(async()=>{const m=simMat.items[0],P=msPack(simMat),bm=m.figs[0]?await createImageBitmap(m.figs[0].blob):null;return {ratio:bm?+(bm.width/bm.height).toFixed(2):0,figs:(m.figs||[]).map(f=>f.page),ch:P.chunks.length,max:Math.max(...P.chunks.map(c=>c.txt.length)),use:document.querySelector('.qsim .mst').textContent,figtxt:!!document.querySelector('.qsim .msfig'),sum:document.querySelector('.simsum').textContent}});
  ok(M.ratio>1.4,name+": a figura é recortada na imagem (ECG largo), não a página inteira "+M.ratio);
  ok(M.figs.join()==="2"&&M.ch>=2&&M.max<=30000&&/vai em \d+ partes/.test(M.use)&&/1 figura/.test(M.use)&&M.figtxt&&/partes/.test(M.sum),name+": só a página do ECG vira figura (a logo repetida não); material em partes "+JSON.stringify(M));
  await p.evaluate(()=>{__P=[];__O=[]});await click('#simGo');await p.waitForFunction(()=>sim&&sim.status==="run"&&sim.gen,null,{timeout:10000});
  const F=await p.evaluate(()=>({p:__P[0],imgs:(__O[0].images||[]).length,fg:sim.qs[0].fg,img:!!document.querySelector('.qsim .qfig img'),cap:(document.querySelector('.qsim .qfig figcaption')||{}).textContent||""}));
  ok(/parte 1 de \d/.test(F.p)&&/- Figura 1: t115-aula\.pdf, página 2/.test(F.p)&&/"figura"/.test(F.p)&&F.imgs===1&&F.fg&&F.fg.no===1&&F.img&&/Figura 1 · t115-aula\.pdf, página 2/.test(F.cap),name+": 1º pedido leva a parte 1 e a figura; a questão mostra a figura "+JSON.stringify({imgs:F.imgs,fg:F.fg,cap:F.cap}));
  /* errar a questão com figura: só ela guarda a imagem pequena no Refazer */
  await p.evaluate(()=>{simAnswer("B");render()});await p.waitForFunction(()=>redo.some(x=>x.q.fg&&x.img),null,{timeout:8000}).catch(()=>{});
  const RD=await p.evaluate(()=>{const x=redo.find(y=>y.q.fg);return x?{img:(x.img||"").slice(0,23),len:(x.img||"").length,fg:x.q.fg.no}:null});
  ok(RD&&RD.img==="data:image/jpeg;base64,"&&RD.len<=180000&&RD.fg===1,name+": a errada com figura guarda a imagem pequena no Refazer "+JSON.stringify(RD&&{len:RD.len}));
  await p.evaluate(()=>{if(sim&&sim.status==="run"){while(sim.status==="run"){if(!sim.ans[sim.i])simAnswer("A");simNext()}}});await p.waitForTimeout(150);
  const SM=await p.evaluate(()=>{const x=sims[0];return {src:x.src,img:JSON.stringify(x).includes("data:image"),fg:x.qs[0].q.fg&&x.qs[0].q.fg.no,lab:x.lab}});
  ok(SM.src==="mat"&&!SM.img&&SM.fg===1&&/Do material: t115-aula\.pdf/.test(SM.lab),name+": Meus simulados guarda só o texto (sem a imagem) "+JSON.stringify(SM));
  /* sair do Refazer apaga a imagem junto */
  await p.evaluate(async()=>{const x=redo.find(y=>y.q.fg);await rdDel(x.id)});ok(await p.evaluate(()=>!redo.some(y=>y.img)&&!localStorage.getItem("resid-redo-v1").includes("data:image")),name+": saiu do Refazer, a imagem some");
  await ctx.close()}
ok(!errs.length,"sem erros de página "+errs.join(" | "));await b.close()})();
