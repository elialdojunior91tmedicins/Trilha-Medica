// t92: prova com gabarito comentado no mesmo PDF ("RESPOSTA 1 … Correta: B" + justificativas) e gabarito comentado em PDF separado
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const {PDFDocument,StandardFonts}=require('pdf-lib');
const PDFJS_DIR=path.join(path.dirname(require.resolve('pdfjs-dist/package.json')),'legacy','build');
const DEV={fone:[390,844,true],ipad578:[578,820,true],note:[1366,768,false]};
const KEY={1:"B",2:"C",3:"A",4:"D",5:"B"};
const Q=n=>[`Questão ${n} — Cefaleia caso ${n}`,"[Clínica]",`Paciente de ${20+n} anos com cefaleia. Qual a conduta adequada na APS?`,"A) Conduta um.","B) Conduta dois.","C) Conduta três.","D) Conduta quatro.",""];
const R=n=>[`RESPOSTA ${n}`,"",`Correta: ${KEY[n]}`,"",`Justificativa A: texto da justificativa A da questão ${n}.`,`Justificativa ${KEY[n]} (CORRETA): explicação oficial da questão ${n}.`,`Ponto-chave: regra da questão ${n}.`,""];
async function makePdf(file,pages){const doc=await PDFDocument.create(),font=await doc.embedFont(StandardFonts.Helvetica);
  pages.forEach(lines=>{const p=doc.addPage([595,842]);let y=780;lines.forEach(l=>{p.drawText(l,{x:40,y,size:10,font});y-=14})});fs.writeFileSync(file,await doc.save())}
(async()=>{const head=["Simulado de Avaliação Clínica e Manejo das Cefaleias","PARTE 1 — CADERNO DE QUESTÕES"],foot=["Documento de Estudo - PMSUS"];
  const f1=path.join(__dirname,"t92-simulado.pdf"),f2=path.join(__dirname,"t92-questoes.pdf"),f3=path.join(__dirname,"t92-gabarito.pdf");
  /* página 3 é mista: questão 5 no começo e o gabarito começando no fim */
  await makePdf(f1,[[...head,...Q(1),...Q(2),...foot],[...Q(3),...Q(4),...foot],[...Q(5),"PARTE 2 — GABARITO E FEEDBACK DETALHADO",...R(1),...foot],[...R(2),...R(3),...foot],[...R(4),...R(5),...foot]]);
  await makePdf(f2,[[...head,...Q(1),...Q(2)],[...Q(3),...Q(4),...Q(5)]]);
  await makePdf(f3,[["PARTE 2 — GABARITO E FEEDBACK DETALHADO",...R(1),...R(2)],[...R(3),...R(4),...R(5)]]);
  const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,screen:name==="ipad578"?{width:1180,height:820}:undefined});
  await ctx.route(/googleapis|gstatic/,r=>r.abort());
  await ctx.route(/cdn\.jsdelivr\.net\/npm\/pdfjs-dist@4\.10\.38\/legacy\/build\/(.+)$/,r=>{const f=r.request().url().split("/").pop();r.fulfill({contentType:"text/javascript",headers:{"Access-Control-Allow-Origin":"*"},body:fs.readFileSync(path.join(PDFJS_DIR,f))})});
  await ctx.addInitScript(mock+`;window.__mock({},2);`);
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
  await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn&&sampleFn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
  const click=async s=>{await p.evaluate(s=>{const x=document.querySelector(s);if(x)x.scrollIntoView({block:"center"})},s);await (mob?p.tap(s):p.click(s));await p.waitForTimeout(120)};
  await p.evaluate(()=>{window.__P=[];sampleFn.limits=async()=>({images:{maxCount:5}});
    sampleFn.json=async input=>{window.__P.push(input);const nums=[...new Set([...input.matchAll(/=== Página \d+ ===\n([\s\S]*?)(?==== Página|\nCONTINUAÇÃO|$)/g)].flatMap(m=>[...m[1].matchAll(/Questão (\d+) —/g)].map(x=>+x[1])))];
      const key=Object.fromEntries([...((input.match(/GABARITO OFICIAL\n([^\n]*)/)||[])[1]||"").matchAll(/(\d+)-([A-E])/g)].map(m=>[+m[1],m[2]]));
      return nums.map(n=>({numero:n,enunciado:"Caso "+n,alternativas:"ABCD".split("").map(l=>({letra:l,texto:"Conduta "+l,porque:l===key[n]?"":"Errada."})),correta:key[n]||"A",anulada:false,gabarito:key[n]?"banca":"claude",imagem:false,tema:"",comentario:"Comentário "+n,conceito:"Conceito "+n}))}});
  await p.evaluate(()=>{backStack=[];setView("quest");setQSeg("praticar")});await p.waitForTimeout(150);
  /* 1. tudo no mesmo PDF */
  await click('#impNew');await p.setInputFiles('#impFile',f1);await p.waitForFunction(()=>imp&&imp.st==="ready",null,{polling:100,timeout:20000});
  const r0=await p.evaluate(()=>({key:imp.keyPg.join(),k:keyText(impKey(imp)),kst:document.querySelector('.exkst').textContent,blocks:impBlocks(imp).map(b=>b.pages.join("+"))}));
  ok(r0.key==="4,5"&&r0.k==="1-B, 2-C, 3-A, 4-D, 5-B",name+": acha o gabarito comentado (RESPOSTA N … Correta: X), inclusive na página mista "+JSON.stringify(r0));
  ok(/5 respostas encontradas/.test(r0.kst),name+": mostra as 5 respostas encontradas: "+r0.kst);
  ok(r0.blocks.join()==="1+2+3",name+": só as páginas com questões vão para o Claude (a mista vai, as de gabarito não) "+r0.blocks.join());
  await click('#impGo');await p.waitForFunction(()=>imp&&imp.st==="review",null,{polling:100,timeout:20000});
  const r1=await p.evaluate(()=>({n:__P.length,key:/GABARITO OFICIAL\n1-B, 2-C, 3-A, 4-D, 5-B/.test(__P[0]),kc:/GABARITO COMENTADO \(da própria prova\)/.test(__P[0])&&/explicação oficial da questão 4/.test(__P[0])&&/explicação oficial da questão 5/.test(__P[0]),
    qs:imp.qs.map(r=>r.n+":"+r.q.correta+":"+r.g).join()}));
  ok(r1.key&&r1.kc,name+": o pedido leva o gabarito e as justificativas da própria prova para o comentário");
  ok(r1.qs==="1:B:b,2:C:b,3:A:b,4:D:b,5:B:b",name+": 5 questões, todas com o gabarito da prova "+r1.qs);
  await p.evaluate(()=>{const b=[...document.querySelectorAll('#impPanel button')].find(x=>/^Salvar/.test(x.textContent));b.click()});await p.waitForTimeout(250);
  ok(await p.evaluate(()=>exams.length===1&&exams[0].qs.length===5&&!imp),name+": a prova salva e fica pronta para começar");
  ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral");
  /* 2. questões e gabarito em PDFs separados */
  await click('#impNew');await p.setInputFiles('#impFile',f2);await p.waitForFunction(()=>imp&&imp.st==="ready",null,{polling:100,timeout:20000});
  ok(await p.evaluate(()=>!imp.keyPg.length&&!Object.keys(impKey(imp)).length),name+": PDF só de questões: nenhuma página vira gabarito");
  await p.setInputFiles('#impKeyF',f3);await p.waitForFunction(()=>imp&&imp.keyFile,null,{polling:100,timeout:20000});await p.waitForTimeout(150);
  const r2=await p.evaluate(()=>({err:imp.err,k:keyText(impKey(imp)),kst:document.querySelector('.exkst').textContent}));
  ok(!r2.err&&r2.k==="1-B, 2-C, 3-A, 4-D, 5-B"&&/5 respostas/.test(r2.kst),name+": gabarito comentado em PDF separado é lido "+JSON.stringify(r2));
  await p.evaluate(()=>{__P=[]});await click('#impGo');await p.waitForFunction(()=>imp&&imp.st==="review",null,{polling:100,timeout:20000});
  ok(await p.evaluate(()=>/GABARITO COMENTADO/.test(__P[0])&&/explicação oficial da questão 2/.test(__P[0])&&imp.qs.every(r=>r.g==="b")),name+": as justificativas do PDF separado também vão para o comentário");
  await ctx.close()}
[f1,f2,f3].forEach(f=>{try{fs.unlinkSync(f)}catch(e){}});
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
