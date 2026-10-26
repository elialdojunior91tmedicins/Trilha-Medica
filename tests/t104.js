// t104: Lote 4 — vários materiais (gerador do tema e simulado), simulado redesenhado (origem, fontes com descrição, tamanho com tempo),
// simulado a partir do material (tema mais próximo em cada questão), provas ligadas a temas da residência e da faculdade (acerto também no FAC, sem dobrar)
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const {PDFDocument,StandardFonts}=require('pdf-lib');
const PDFJS_DIR=path.join(path.dirname(require.resolve('pdfjs-dist/package.json')),'legacy','build');
const DEV={fone:[390,844,true],ipad578:[578,820,true],ipad820:[820,1180,true],tabDeitado:[1180,820,true],note:[1366,768,false],full:[1920,1080,false]};
const Q=(n,tema)=>({enunciado:"Caso "+n+" de anemia ferropriva com ferritina baixa",alternativas:"ABCD".split("").map(l=>({letra:l,texto:"Alt "+l,porque:l==="A"?"":"Errada."})),correta:"A",comentario:"Comentário "+n,conceito:"Conceito "+n,alerta:"",fonte:"Material do estudante, p. 1",...(tema!==undefined?{tema}:{})});
(async()=>{const mk=async(f,pages)=>{const doc=await PDFDocument.create(),font=await doc.embedFont(StandardFonts.Helvetica);pages.forEach(L=>{const p=doc.addPage([595,842]);let y=780;L.forEach(l=>{p.drawText(l,{x:40,y,size:10,font});y-=14})});fs.writeFileSync(f,await doc.save())};
  const A=path.join(__dirname,"t104-a.pdf"),B=path.join(__dirname,"t104-b.pdf"),BIG=path.join(__dirname,"t104-big.pdf");
  await mk(A,[["Aula A: anemia ferropriva","Ferritina baixa, RDW alto e saturacao de transferrina baixa confirmam ferropenia."]]);await mk(B,[["Aula B: hipertensao","Meta de pressao arterial abaixo de 130/80 na maioria dos pacientes de alto risco."]]);
  {const lines=[];for(let i=0;i<50;i++)lines.push("Linha longa de texto do material grande para encher o espaco do pedido numero "+i+" com bastante conteudo repetido.");const pg=[];for(let j=0;j<10;j++)pg.push(lines);await mk(BIG,pg)}
  const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];const ipad=name.startsWith("ipad")||name.startsWith("tab");
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,screen:name==="ipad578"?{width:1180,height:820}:undefined,userAgent:ipad?"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)":undefined});
  await ctx.route(/googleapis|gstatic/,r=>r.abort());
  await ctx.route(/cdn\.jsdelivr\.net\/npm\/pdfjs-dist@4\.10\.38\/legacy\/build\/(.+)$/,r=>{const f=r.request().url().split("/").pop();r.fulfill({contentType:"text/javascript",headers:{"Access-Control-Allow-Origin":"*"},body:fs.readFileSync(path.join(PDFJS_DIR,f))})});
  await ctx.addInitScript(mock+`;window.__mock({},2);`);
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
  await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn&&sampleFn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
  const click=async s=>{await p.evaluate(s=>{const x=document.querySelector(s);if(x)x.scrollIntoView({block:"center"})},s);await (mob?p.tap(s):p.click(s));await p.waitForTimeout(180)};
  await p.evaluate(([q1,q2,q3])=>{window.__P=[];window.__O=[];sampleFn.limits=async()=>({images:{maxCount:5}});
    sampleFn.json=async(input,o)=>{__P.push(input);__O.push(o||{});const n=+((input.match(/simulado com (\d+)/)||[])[1]||1);return Array.from({length:n},(_,i)=>i%3===0?{...q1}:i%3===1?{...q2}:{...q3})};
    qCount=1;detTab["CM-34"]="questoes";openTopic("CM-34")},[Q(1,"CM-1"),Q(2,"XX-9"),Q(3)]);await p.waitForTimeout(250);
  /* 1. gerador do tema: vários materiais, × em cada um, barra de uso */
  await p.setInputFiles('#gmf-CM-34',[A,B]);await p.waitForFunction(()=>genMat["CM-34"]&&!genMat["CM-34"].busy&&genMat["CM-34"].items.length===2,null,{timeout:20000});await p.waitForTimeout(150);
  const m1=await p.evaluate(()=>({names:[...document.querySelectorAll('.gmat .mslist .msn')].map(x=>x.textContent),use:(document.querySelector('.gmat .mst')||{}).textContent,sum:document.querySelector('.gmat summary').textContent}));
  ok(m1.names.join()==="t104-a.pdf,t104-b.pdf"&&/Material: \d+ (mil|caracteres) de 100 mil/.test(m1.use||"")&&m1.sum==="Material: 2 arquivos",name+": dois materiais na lista, com a barra de uso "+JSON.stringify(m1));
  await p.setInputFiles('#gmf-CM-34',BIG);await p.waitForFunction(()=>genMat["CM-34"].items.length===3&&!genMat["CM-34"].busy,null,{timeout:20000});await p.waitForTimeout(150);
  const m2=await p.evaluate(()=>({cut:(document.querySelector('.gmat .mscut')||{}).textContent||"",over:!!document.querySelector('.gmat .msbar.over'),use:(document.querySelector('.gmat .mst')||{}).textContent||"",pack:(()=>{const P=msPack(genMat["CM-34"]);return {len:P.txt.length,parts:P.parts.map(x=>x.pct),ch:P.chunks.length,max:Math.max(...P.chunks.map(c=>c.txt.length))}})()}));
  ok(!m2.over&&!m2.cut&&m2.pack.parts.every(x=>x===100)&&m2.pack.ch>=2&&m2.pack.max<=30000&&/vai em \d+ partes/.test(m2.use),name+": até 100 mil: nada cortado, vai em partes de até 30 mil "+JSON.stringify(m2.pack));
  await p.evaluate(()=>{__P=[];generate(BYKEY["CM-34"])});await p.waitForFunction(()=>gen["CM-34"]&&gen["CM-34"].status==="done",null,{timeout:10000});
  ok(await p.evaluate(()=>/O estudante enviou 3 materiais de estudo \(t104-a\.pdf; t104-b\.pdf; t104-big\.pdf\)/.test(__P[0])&&/##### Material: t104-a\.pdf/.test(__P[0])&&/Aula B: hipertensao/.test(__P[0])&&/parte 1 de \d/.test(__P[0])&&__P[0].length<40000),name+": o pedido leva os três materiais, cada um com o nome");
  await click('#gmr-CM-34-2');ok(await p.evaluate(()=>genMat["CM-34"].items.length===2&&!document.querySelector('.gmat .mscut')),name+": × tira só aquele material");
  await click('#gmx-CM-34');ok(await p.evaluate(()=>!genMat["CM-34"]),name+": Tirar todos");
  /* 2. simulado redesenhado */
  await p.evaluate(()=>{const D=n=>fromNum(dnum(today())+n);state["CM-1"]={l:1,last:D(-3),step:0,sd:[0],sv:2,qt:10,qc:4};state["CM-4"]={l:1,last:D(-3),step:0,sd:[0],sv:2,qt:10,qc:3};commit();sim=null;simCfg={src:"weak",n:10};backStack=[];setView("quest");setQSeg("praticar")});await p.waitForTimeout(250);
  const S1=await p.evaluate(()=>{const c=document.querySelector('.qsim');return {steps:[...c.querySelectorAll('.simstep b')].map(x=>x.textContent),mode:[...c.querySelectorAll('.simmode button')].map(x=>x.textContent+":"+x.getAttribute("aria-pressed")),src:[...c.querySelectorAll('.simsrcb')].map(x=>x.querySelector('b').textContent+"|"+x.querySelector('span').textContent).slice(0,2),eta:(c.querySelector('.simsum')||{}).textContent,go:c.querySelector('#simGo').textContent}});
  ok(S1.steps.join()==="De onde vêm as questões,Como vai ser,Resumo"&&S1.mode.join()==="Dos meus temas:true,De um material meu:false"&&/^Onde focar · 2\|Os mais cobrados com acerto mais longe de 80%$/.test(S1.src[1])&&/≈ \d+ min no seu ritmo/.test(S1.eta)&&/Começar simulado · 10 questões de 2 temas/.test(S1.go),name+": simulado em passos, fontes com descrição e tempo estimado "+JSON.stringify(S1));
  if(name==="fone"||name==="note"){await p.evaluate(()=>document.querySelector('.qsim').scrollIntoView({block:"start"}));await p.waitForTimeout(120);await p.screenshot({path:`t104-sim-${name}.png`})}
  /* 3. simulado do material */
  await click('#simM-mat');
  ok(await p.evaluate(()=>{const g=document.querySelector('#simGo');return !document.querySelector('.qsim .simsrc')&&!!document.querySelector('.qsim .gmat')&&g.disabled&&/do material/.test(g.textContent)}),name+": De um material meu: escolhe os arquivos; sem arquivo, não começa");
  await p.setInputFiles('#smf',[A,B]);await p.waitForFunction(()=>simMat&&!simMat.busy&&simMat.items.length===2,null,{timeout:20000});await p.waitForTimeout(150);
  ok(await p.evaluate(()=>!document.querySelector('#simGo').disabled&&/Começar simulado do material · 10 questões/.test(document.querySelector('#simGo').textContent)),name+": com material, o botão libera");
  if(name==="fone"||name==="note"){await p.evaluate(()=>document.querySelector('.qsim').scrollIntoView({block:"start"}));await p.waitForTimeout(120);await p.screenshot({path:`t104-simmat-${name}.png`})}
  await p.evaluate(()=>{__P=[];simCfg.n=5;render()});await click('#simGo');await p.waitForFunction(()=>sim&&sim.status==="run"&&sim.gen,null,{timeout:10000});
  const S3=await p.evaluate(()=>({ks:sim.qs.map(q=>q.k),mat:sim.qs.every(q=>q.mat),pr:__P[0],badge:/do seu material/.test(document.querySelector('.qsim .qn').textContent)}));
  ok(S3.ks.length===5&&S3.ks[0]==="CM-1"&&S3.ks.every(k=>!!k&&k!=="XX-9")&&S3.mat&&S3.badge,name+": cada questão vai para o tema indicado (ou o mais próximo) e mostra 'do seu material' "+JSON.stringify(S3.ks));
  ok(/a partir do material do estudante/.test(S3.pr)&&/TEMAS \(chave · tema/.test(S3.pr)&&/"tema"/.test(S3.pr)&&/O estudante enviou 2 materiais/.test(S3.pr),name+": o pedido do simulado leva os materiais e a lista de temas");
  await p.evaluate(()=>{sim=null;simMat=null;simCfg={src:"weak",n:10};render()});
  /* 4. prova ligada a temas: aparece no tema; acerto também no conteúdo FAC, sem dobrar */
  const R=await p.evaluate(()=>{fac={sems:[{id:"s1",name:"S6",archived:false}],discs:[{id:"d1",semId:"s1",name:"Hemato",items:["O:own1","O:own2"]}],provas:[],own:{own1:{t:"Anemias da faculdade",discId:"d1"},own2:{t:"Hemostasia FAC",discId:"d1",links:[{k:"CM-34",subs:[]}]}}};saveFac();registerOwn();
    const alt=["A","B","C","D"].map(l=>({letra:l,texto:"Alt "+l}));const ex=exClean({id:"exL",name:"Prova Hemato",banca:"ENARE",ano:"2024",at:new Date().toISOString(),qs:[1,2,3].map(n=>({n,k:"CM-34",g:"b",q:{enunciado:"Q"+n,alternativas:alt,correta:"A",comentario:""}}))});exams.unshift(ex);exPut(ex);
    const P=exPg("exL");P.a[0]={l:"A",d:today(),s:30};P.a[1]={l:"B",d:today(),s:30};exChange(ex,0,()=>{});[0,1].forEach(i=>exCount(exContrib(ex,i),1,exSrc(ex)));commit();
    const s0=get("CM-34"),f0=get("F-own1"),h0=(hist[today()]||{}).q||0;return {t:[s0.qt||0,s0.qc||0],f:[f0.qt||0,f0.qc||0],h:h0}});
  await p.evaluate(()=>{backStack=[];setView("quest");setQSeg("praticar")});await p.waitForTimeout(200);await click('#exlk-exL');
  const sug=await p.evaluate(()=>[...document.querySelectorAll('#exr-exL .exlsug .chip')].map(x=>x.textContent));
  ok(sug.length===1&&/^\+ Anemias · 3$/.test(sug[0]),name+": sugere ligar aos temas das questões "+JSON.stringify(sug));
  await p.fill('#exlq-exL','anemias da fac');await p.waitForTimeout(400);
  ok(await p.evaluate(()=>/Anemias da faculdade/.test(document.querySelector('#exlr-exL-0').textContent)),name+": busca conteúdos da faculdade");
  await click('#exlr-exL-0');
  const R2=await p.evaluate(()=>{const s=get("CM-34"),f=get("F-own1");return {links:exams.find(x=>x.id==="exL").links,t:[s.qt||0,s.qc||0],f:[f.qt||0,f.qc||0],h:(hist[today()]||{}).q||0,lk:(document.querySelector('#exr-exL .exlk')||{}).textContent}});
  ok(JSON.stringify(R2.links)==='["O:own1"]'&&R2.f[0]===R.f[0]+2&&R2.f[1]===R.f[1]+1&&R2.t[0]===R.t[0]&&R2.h===R.h&&/Ligada a: Anemias da faculdade/.test(R2.lk||""),name+": ligar ao conteúdo FAC soma o acerto nele, sem mexer no tema nem no dia "+JSON.stringify({R,R2}));
  /* conteúdo FAC já ligado ao mesmo tema da questão: não conta duas vezes */
  await p.evaluate(()=>{const ex=exams.find(x=>x.id==="exL");exRelink(ex,[...ex.links,"O:own2"])});
  ok(await p.evaluate(qt=>(get("CM-34").qt||0)===qt,R2.t[0]),name+": conteúdo FAC ligado ao mesmo tema não conta em dobro");
  await p.evaluate(()=>{const ex=exams.find(x=>x.id==="exL");exRelink(ex,["T:CM-1"])});
  ok(await p.evaluate(f=>(get("F-own1").qt||0)===f,R.f[0]),name+": tirar a ligação tira o que tinha somado");
  if(name==="fone"||name==="note"){await p.evaluate(()=>{exLinkEd={id:"exL",q:""};render();document.querySelector('#exr-exL').scrollIntoView({block:"start"})});await p.waitForTimeout(150);await p.screenshot({path:`t104-links-${name}.png`});await p.evaluate(()=>{exLinkEd=null;render()})}
  /* no tema: Provas na íntegra */
  await p.evaluate(()=>{detTab["CM-1"]="questoes";openTopic("CM-1")});await p.waitForTimeout(300);
  ok(await p.evaluate(()=>{const g=document.querySelector('#t-CM-1 .extopic');return g&&/Prova Hemato/.test(g.textContent)&&/ligada/.test(g.textContent)}),name+": a prova ligada aparece no tema (aba Questões)");
  await p.evaluate(()=>{detTab["CM-34"]="questoes";openTopic("CM-34")});await p.waitForTimeout(300);
  ok(await p.evaluate(()=>{const g=document.querySelector('#t-CM-34 .extopic');return g&&/3 questões deste tema · acerto 50% \(1 de 2\)/.test(g.textContent)}),name+": tema com questões da prova mostra o acerto nelas");
  await p.evaluate(()=>{document.querySelector('#t-CM-34 .extopic button').id="__ver"});await click('#__ver');await p.waitForTimeout(250);
  ok(await p.evaluate(()=>view==="quest"&&!!document.querySelector('#exr-exL')),name+": Ver a prova abre a lista de provas");
  ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral");
  await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close();[A,B,BIG].forEach(f=>{try{fs.unlinkSync(f)}catch(e){}})})();
