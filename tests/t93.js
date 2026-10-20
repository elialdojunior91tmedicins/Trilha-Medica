// t93: ler a prova aqui no aparelho, sem o Claude; com dificuldades, avisa para passar pelo Claude
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const {PDFDocument,StandardFonts}=require('pdf-lib');
const PDFJS_DIR=path.join(path.dirname(require.resolve('pdfjs-dist/package.json')),'legacy','build');
const DEV={fone:[390,844,true],ipad578:[578,820,true],note:[1366,768,false]};
const KEY={1:"B",2:"C",3:"A",4:"D"};
const QT={1:["Contracepção em Migrânea","Mulher de 28 anos com enxaqueca com aura pede contraceptivo oral combinado. Qual a conduta?"],
  2:["Cefaleia por Abuso de Analgésicos","Homem de 42 anos com cefaleia tensional diária usa analgésicos quase todo dia. Qual a conduta?"],
  3:["Crise Grave de Migrânea","Mulher de 30 anos com crise forte de enxaqueca sem resposta a analgésicos simples. Qual o tratamento?"],
  4:["Cefaleia em Salvas","Homem de 38 anos com dor orbitária unilateral, lacrimejamento e congestão nasal. Qual o diagnóstico?"]};
const Q=n=>[`Questão ${n} — ${QT[n][0]}`,"[Clínica]",...QT[n][1].match(/.{1,70}(\s|$)/g).map(s=>s.trim()),"A) Primeira conduta possível para o caso.","B) Segunda conduta possível","para o caso, em duas linhas.","C) Terceira conduta possível.","D) Quarta conduta possível.",""];
const R=n=>[`RESPOSTA ${n}`,"",`Correta: ${KEY[n]}`,"",...["A","B","C","D"].map(l=>l===KEY[n]?`Justificativa ${l} (CORRETA): é a conduta certa na questão ${n}.`:`Justificativa ${l}: a alternativa ${l} está errada na questão ${n}.`),`Ponto-chave: regra da questão ${n}.`,`Take home message: guarde a regra ${n}.`,""];
async function makePdf(file,pages){const doc=await PDFDocument.create(),font=await doc.embedFont(StandardFonts.Helvetica);
  pages.forEach((lines,i)=>{const p=doc.addPage([595,842]);let y=800;["Simulado de Cefaleias - APS",...lines,"",`Página ${i+1} de ${pages.length}`].forEach(l=>{p.drawText(l,{x:40,y,size:10,font});y-=14})});fs.writeFileSync(file,await doc.save())}
(async()=>{const f1=path.join(__dirname,"t93-cefaleias.pdf"),f2=path.join(__dirname,"t93-semgab.pdf"),f3=path.join(__dirname,"t93-quebrada.pdf");
  await makePdf(f1,[[...Q(1),...Q(2)],[...Q(3),...Q(4)],["PARTE 2 — GABARITO E FEEDBACK DETALHADO",...R(1),...R(2)],[...R(3),...R(4)]]);
  await makePdf(f2,[[...Q(1),...Q(2)],[...Q(3),...Q(4)]]);
  /* questão 2 sem as alternativas C e D, questão 3 sumiu */
  await makePdf(f3,[[...Q(1),...Q(2).slice(0,-3)],[...Q(4)],["GABARITO OFICIAL DO SIMULADO DE CEFALEIAS","Confira suas respostas com o gabarito abaixo.","1-B 2-C 3-A 4-D"]]);
  const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,screen:name==="ipad578"?{width:1180,height:820}:undefined});
  await ctx.route(/googleapis|gstatic/,r=>r.abort());
  await ctx.route(/cdn\.jsdelivr\.net\/npm\/pdfjs-dist@4\.10\.38\/legacy\/build\/(.+)$/,r=>{const f=r.request().url().split("/").pop();r.fulfill({contentType:"text/javascript",headers:{"Access-Control-Allow-Origin":"*"},body:fs.readFileSync(path.join(PDFJS_DIR,f))})});
  await ctx.addInitScript(mock+`;window.__mock({},2);`);
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
  await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn&&sampleFn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
  const click=async s=>{await p.evaluate(s=>{const x=document.querySelector(s);if(x)x.scrollIntoView({block:"center"})},s);await (mob?p.tap(s):p.click(s));await p.waitForTimeout(150)};
  await p.evaluate(()=>{window.__N=0;sampleFn.json=async()=>{window.__N++;return []};backStack=[];setView("quest");setQSeg("praticar")});await p.waitForTimeout(150);
  const shot=async tag=>{if(name!=="fone"&&name!=="note")return;await p.evaluate(()=>{const x=document.querySelector('#impPanel');x.scrollIntoView({block:"start"});scrollBy(0,-70)});await p.waitForTimeout(150);await p.screenshot({path:`t93-${tag}-${name}.png`})};
  /* 1. prova bem organizada, com gabarito comentado */
  await click('#impNew');await p.setInputFiles('#impFile',f1);await p.waitForFunction(()=>imp&&imp.st==="ready",null,{polling:100,timeout:20000});
  const r0=await p.evaluate(()=>({loc:document.querySelector('.imploc').textContent,prim:document.querySelector('#impLocal').classList.contains("primary"),go:document.querySelector('#impGo').textContent,goPrim:document.querySelector('#impGo').classList.contains("primary")}));
  ok(/4 questões lidas/.test(r0.loc)&&/com o comentário da própria prova/.test(r0.loc)&&r0.prim&&!r0.goPrim&&/mesmo assim/.test(r0.go),name+": lê aqui no aparelho e oferece Conferir e salvar (Claude fica opcional) "+JSON.stringify(r0));
  await shot("ok");
  await click('#impLocal');
  const r1=await p.evaluate(()=>({st:imp.st,src:imp.src,qs:imp.qs.map(r=>({n:r.n,c:r.q.correta,g:r.g,na:r.q.alternativas.length,b:r.q.alternativas[1].texto,pq:r.q.alternativas.map(a=>a.porque),com:r.q.comentario,con:r.q.conceito,pc:r.q.pc||"",th:r.q.th||"",fo:r.q.fonte||"",k:r.k,kg:r.kg,en:r.q.enunciado})),
    note:document.querySelector('#impPanel').textContent,badge:[...document.querySelectorAll('#impPanel .exb')].some(x=>/Tema sugerido/.test(x.textContent)),N:__N}));
  const q2=r1.qs[1]||{};
  ok(r1.st==="review"&&r1.src==="local"&&r1.qs.map(q=>q.n+q.c+q.g).join()==="1Bb,2Cb,3Ab,4Db"&&r1.N===0,name+": 4 questões com o gabarito da prova, sem chamar o Claude "+r1.qs.map(q=>q.n+q.c+q.g).join());
  ok(q2.na===4&&q2.b==="Segunda conduta possível para o caso, em duas linhas."&&/^Homem de 42 anos/.test(q2.en)&&!/Clínica|Simulado|Página/.test(q2.en),name+": enunciado e alternativas limpos (linhas juntadas; cabeçalho, rodapé e [Clínica] fora) "+JSON.stringify([q2.b,q2.en]));
  ok(q2.pq[0]==="a alternativa A está errada na questão 2."&&q2.pq[2]===""&&/é a conduta certa na questão 2/.test(q2.com)&&!/regra da questão 2/.test(q2.com)&&/^regra da questão 2/.test(q2.pc)&&q2.th==="guarde a regra 2."&&q2.con==="",name+": justificativas viram o porquê de cada alternativa; comentário, Ponto-chave e Take home separados "+JSON.stringify([q2.pq,q2.com,q2.pc,q2.th,q2.fo]));
  ok(r1.qs.filter(q=>q.k==="CM-22").length>=3&&r1.qs.every(q=>!q.k||q.kg)&&r1.badge&&/tema foi sugerido pelo nome/.test(r1.note),name+": tema sugerido pelo nome (Cefaleias) com o selo para conferir "+r1.qs.map(q=>q.k).join());
  await shot("rev");
  await click('#impSave');ok(await p.evaluate(()=>exams.length===1&&exams[0].qs.length===4&&exams[0].qs[1].q.alternativas[0].porque==="a alternativa A está errada na questão 2."&&!("kg" in exams[0].qs[0])),name+": a prova lida no aparelho é salva com os comentários");
  /* 2. sem gabarito: avisa para passar pelo Claude */
  await click('#impNew');await p.setInputFiles('#impFile',f2);await p.waitForFunction(()=>imp&&imp.st==="ready",null,{polling:100,timeout:20000});
  const r2=await p.evaluate(()=>({t:document.querySelector('.imploc').textContent,goPrim:document.querySelector('#impGo').classList.contains("primary"),loc:(document.querySelector('#impLocal')||{}).textContent}));
  ok(/com dificuldades/.test(r2.t)&&/sem gabarito/.test(r2.t)&&/Passe a prova pelo Claude/.test(r2.t)&&r2.goPrim&&/mesmo assim/.test(r2.loc||""),name+": sem gabarito, avisa e põe o Claude em destaque "+JSON.stringify(r2));
  await p.evaluate(()=>{document.querySelector('#impPaste').closest('details').open=true});await p.fill('#impPaste','1-B 2-C 3-A 4-D');await p.waitForTimeout(600);
  ok(await p.evaluate(()=>!document.querySelector('.implocw')&&/4 questões lidas/.test(document.querySelector('.imploc').textContent)),name+": colando o gabarito, o aviso some e a leitura no aparelho fica pronta");
  await p.evaluate(()=>{imp=null;render()});
  /* 3. prova que o aparelho não lê direito */
  await click('#impNew');await p.setInputFiles('#impFile',f3);await p.waitForFunction(()=>imp&&imp.st==="ready",null,{polling:100,timeout:20000});
  const r3=await p.evaluate(()=>document.querySelector('.imploc').textContent);
  ok(/não achei a questão 3/i.test(r3)&&/a questão 2 saiu com menos de 4 alternativas/i.test(r3)&&!/misturada/.test(r3)&&/Passe a prova pelo Claude/.test(r3),name+": falta questão e alternativa: lista o problema e pede o Claude "+r3.slice(0,200));
  await shot("warn");
  await click('#impLocal');
  ok(await p.evaluate(()=>imp.st==="review"&&!!document.querySelector('#impToClaude')&&/com dificuldades/.test(document.querySelector('#impPanel').textContent)),name+": conferindo mesmo assim, o aviso continua com o botão Passar pelo Claude");
  await click('#impToClaude');await p.waitForFunction(()=>imp&&imp.st==="review"&&!imp.src,null,{polling:100,timeout:20000});
  ok(await p.evaluate(()=>__N>0),name+": Passar pelo Claude lê a prova com o Claude");
  ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral");
  /* 4. sem o Claude disponível, a leitura no aparelho continua */
  await p.evaluate(()=>{imp=null;sampleOff=true;render()});await click('#impNew');await p.setInputFiles('#impFile',f1);await p.waitForFunction(()=>imp&&imp.st==="ready",null,{polling:100,timeout:20000});
  ok(await p.evaluate(()=>!!document.querySelector('#impLocal')&&document.querySelector('#impGo').disabled&&/não está disponível/.test(document.querySelector('#impPanel').textContent)),name+": sem o Claude, ainda dá para ler no aparelho");
  await ctx.close()}
[f1,f2,f3].forEach(f=>{try{fs.unlinkSync(f)}catch(e){}});
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
