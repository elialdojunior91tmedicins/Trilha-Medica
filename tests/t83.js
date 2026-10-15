// t83: importar prova em PDF (texto lido no aparelho, página escaneada como imagem, gabarito achado no PDF), conferir, fazer a prova e recalcular com gabarito colado depois
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const {PDFDocument,StandardFonts}=require('pdf-lib');const sharp=require('sharp');
const PDFJS_DIR=path.join(path.dirname(require.resolve('pdfjs-dist/package.json')),'legacy','build');
const DEV={fone:[390,844,true],ipad578:[578,820,true],note:[1366,768,false],monitor:[1920,1080,false]};
const Q={1:["Homem de 60 anos com dor torácica há 1 hora e supradesnivelamento de ST em V1-V4. Qual a conduta?",["Angioplastia primária","Teste ergométrico","Alta com AAS","Ecocardiograma eletivo"]],
  2:["Mulher de 25 anos com disúria e polaciúria, sem febre. Qual o tratamento?",["Ceftriaxona IV","Nitrofurantoína","Internação","Observação"]],
  3:["Criança de 2 anos com febre e exantema após 3 dias de febre alta. Qual o diagnóstico?",["Sarampo","Exantema súbito","Escarlatina","Rubéola"]],
  4:["Paciente com sepse e lactato de 5 mmol/L. Qual a primeira medida?",["Antibiótico em 6 horas","Cristaloide 30 mL/kg","Corticoide","Aguardar culturas"]],
  5:["Analise o eletrocardiograma abaixo. Qual o ritmo?",["Fibrilação atrial","Flutter","Sinusal","Taquicardia ventricular"]]};
const TEMA={1:"CM-7",2:"CM-",3:"",4:"",5:"CM-8"};
async function makePdf(file){const doc=await PDFDocument.create(),font=await doc.embedFont(StandardFonts.Helvetica);const W=595,H=842;
  const page=lines=>{const p=doc.addPage([W,H]);let y=H-60;lines.forEach(l=>{p.drawText(l,{x:50,y,size:11,font});y-=16});return p};
  page(["PROCESSO SELETIVO ENARE 2024 - RESIDENCIA MEDICA","Acesso direto","Instrucoes: esta prova tem 5 questoes. Marque uma alternativa por questao.","Leia com atencao e transcreva suas respostas para o cartao. Boa prova a todos os candidatos.","Duracao: 4 horas. Nao e permitido consultar material."]);
  const qLines=n=>{const [e,a]=Q[n];return [`QUESTAO ${n}`,e,...a.map((t,i)=>`${"ABCD"[i]}) ${t}`),""]};
  page([...qLines(1),...qLines(2)]);page([...qLines(3),...qLines(4)]);
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600"><rect width="100%" height="100%" fill="#fff"/><text x="80" y="140" font-size="40" font-family="sans-serif">QUESTAO 5</text><text x="80" y="220" font-size="32" font-family="sans-serif">Analise o eletrocardiograma abaixo.</text><path d="M80 500 l60 0 l20 -120 l20 220 l20 -100 l60 0" stroke="#000" fill="none" stroke-width="4"/></svg>`;
  const png=await sharp(Buffer.from(svg)).png().toBuffer(),img=await doc.embedPng(png),p4=doc.addPage([W,H]);p4.drawImage(img,{x:0,y:0,width:W,height:H});
  page(["GABARITO OFICIAL - ENARE 2024","01 - A   02 - C   03 - B   04 - B   05 - ANULADA","Questao 6 sem prova: 06 - A","07 - D 08 - C"]);
  fs.writeFileSync(file,await doc.save())}
(async()=>{const pdf=path.join(__dirname,"ENARE_2024_R1.pdf");await makePdf(pdf);const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,screen:name==="ipad578"?{width:1180,height:820}:undefined});
  await ctx.route(/googleapis|gstatic/,r=>r.abort());
  await ctx.route(/cdn\.jsdelivr\.net\/npm\/pdfjs-dist@4\.10\.38\/legacy\/build\/(.+)$/,r=>{const f=r.request().url().split("/").pop();r.fulfill({contentType:"text/javascript",headers:{"Access-Control-Allow-Origin":"*"},body:fs.readFileSync(path.join(PDFJS_DIR,f))})});
  await ctx.addInitScript(mock+`;window.__mock({},2);`);
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
  await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn&&sampleFn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
  const click=async s=>{await p.evaluate(s=>{const x=document.querySelector(s);if(x)x.scrollIntoView({block:"center"})},s);await (mob?p.tap(s):p.click(s));await p.waitForTimeout(120)};
  /* Claude de mentira: devolve as questões das páginas pedidas; na 1ª leitura "esquece" a questão 3 */
  await p.evaluate(([Q,TEMA])=>{window.__P=[];window.__imgs=[];let first=true;
    sampleFn.limits=async()=>({images:{maxCount:5}});
    sampleFn.json=async(input,o)=>{window.__P.push(input);if(o&&o.images)window.__imgs.push(o.images.map(x=>x&&x.type));await new Promise(r=>setTimeout(r,30));
      const pages=[...input.matchAll(/=== Página (\d+) ===/g)].map(m=>+m[1]);const im=input.match(/A imagem anexada é a página (\d+)/);if(im)pages.push(+im[1]);
      const nums=[];pages.forEach(pg=>{if(pg===2)nums.push(1,2);if(pg===3)nums.push(...(first?[4]:[3,4]));if(pg===4)nums.push(5)});if(pages.includes(3))first=false;
      return nums.map(n=>({numero:n,enunciado:Q[n][0],alternativas:Q[n][1].map((t,i)=>({letra:"ABCD"[i],texto:t,porque:i?"Errada por isto.":""})),correta:n===2?"B":n===4?"B":"A",anulada:n===5,gabarito:"banca",imagem:n===5,
        tema:{1:"cm-7",2:"CM-30",3:"XYZ-1",4:"",5:"CM-8"}[n],comentario:"Comentário da questão "+n,conceito:"Conceito "+n}))}},[Q,TEMA]);
  await p.evaluate(()=>{backStack=[];setView("quest");setQSeg("praticar")});await p.waitForTimeout(150);
  /* 1. escolher o PDF */
  await click('#impNew');ok(await p.isVisible('#impPanel'),name+": + Importar prova abre o painel");
  await p.setInputFiles('#impFile',pdf);await p.waitForFunction(()=>imp&&imp.st==="ready",null,{polling:100,timeout:20000});
  const r0=await p.evaluate(()=>({pages:imp.pages.length,img:imp.pages.filter(x=>x.img).map(x=>x.n),key:imp.keyPg,banca:imp.banca,ano:imp.ano,name:imp.name,t2:imp.pages[1].t,info:document.querySelector('.exinfo').textContent,kst:document.querySelector('.exkst').textContent}));
  ok(r0.pages===5&&r0.img.join()==="4"&&r0.key.join()==="5",name+": lê o PDF no aparelho: 5 páginas, a 4 sem texto (escaneada), gabarito na 5 "+JSON.stringify({img:r0.img,key:r0.key}));
  ok(/QUESTAO 1/.test(r0.t2)&&/Angioplastia primária/.test(r0.t2)&&/B\) Teste ergométrico/.test(r0.t2),name+": o texto da página sai legível, com acentos e alternativas");
  ok(r0.banca==="ENARE"&&r0.ano==="2024"&&r0.name==="ENARE 2024 R1",name+": banca, ano e nome vêm do arquivo "+JSON.stringify([r0.banca,r0.ano,r0.name]));
  ok(/8 respostas encontradas \(1 anulada\)/.test(r0.kst),name+": conta as respostas do gabarito e as anuladas: "+r0.kst);
  /* 2. ler com o Claude */
  await click('#impGo');await p.waitForFunction(()=>imp&&imp.st==="review",null,{polling:100,timeout:20000});
  const r1=await p.evaluate(()=>({n:__P.length,img:__imgs,keyIn:__P.every(x=>/GABARITO OFICIAL\n1-A, 2-C, 3-B, 4-B, 5-ANULADA/.test(x)),topics:/CM-34 · /.test(__P[0]),noKeyPage:!__P.some(x=>/=== Página 5 ===/.test(x)),qs:imp.qs.map(r=>r.n).join(),gap:!!document.querySelector('#impGap')}));
  ok(r1.keyIn&&r1.topics&&r1.noKeyPage,name+": o pedido leva o gabarito oficial em ordem e a lista de temas; a página do gabarito não vai como questão");
  ok(r1.img.length===1&&r1.img[0].join()==="image/jpeg",name+": a página escaneada vai como imagem JPEG "+JSON.stringify(r1.img));
  ok(r1.qs==="1,2,4,5"&&r1.gap,name+": falta a questão 3 e o app avisa, com Procurar de novo "+r1.qs);
  await click('#impGap');await p.waitForFunction(()=>imp&&imp.st==="review"&&imp.qs.length===4+1,null,{polling:100,timeout:20000});
  const r2=await p.evaluate(()=>{const Q=n=>imp.qs.find(r=>r.n===n);return {n:imp.qs.map(r=>r.n).join(),q2:[Q(2).q.correta,Q(2).ck,Q(2).g],q4:[Q(4).q.correta,Q(4).k],q5:[Q(5).an,Q(5).im],k1:Q(1).k,k3:Q(3).k,
    warn:[...document.querySelectorAll('#impPanel .exq')].some(li=>/escrito pelo Claude considerando a alternativa B; o gabarito oficial é C/.test(li.textContent))}});
  ok(r2.n==="1,2,3,4,5",name+": procurar de novo acha a questão 3 sem duplicar");
  ok(r2.q2.join()==="C,B,b"&&r2.q4[0]==="B"&&r2.q5.join()==="true,true"&&r2.warn,name+": o gabarito da banca vale sobre o do Claude e avisa quando o comentário foi escrito para outra letra "+JSON.stringify(r2));
  ok(r2.k1==="CM-7"&&r2.q4[1]===""&&r2.k3==="",name+": tema válido é aceito (mesmo minúsculo); chave inexistente fica sem tema");
  /* 3. conferir: dar tema à questão 4 e descartar nada */
  await p.evaluate(()=>{imp.flt="tema";render()});await p.waitForTimeout(100);
  const i4=await p.evaluate(()=>imp.qs.findIndex(r=>r.n===4));await click(`#ext-i-${i4}`);await p.fill('#exTq','sepse');await p.waitForTimeout(350);
  await p.evaluate(()=>[...document.querySelectorAll('.extpick .qrpick')][0].click());await p.waitForTimeout(120);
  const k4=await p.evaluate(()=>{const k=imp.qs.find(r=>r.n===4).k;return k&&BYKEY[k].t});ok(!!k4&&/sepse/i.test(k4),name+": escolher o tema pela busca "+k4);
  ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": conferir sem rolagem lateral");
  if(name==="fone"||name==="note"){await p.evaluate(()=>{imp.flt="all";render();document.querySelector('#impPanel').scrollIntoView()});await p.screenshot({path:`t83-rev-${name}.png`})}
  await p.evaluate(()=>{const i=imp.qs.findIndex(r=>r.n===3);imp.qs[i].k="PED-1"});
  await click('#impSave');
  const ex=await p.evaluate(()=>{const e=exams[0];return e&&{id:e.id,n:e.qs.length,banca:e.banca,store:!!__store["data/users/u1/progress/exams/"+e.id],nox:e.qs.every(r=>!("x" in r))}});
  ok(ex&&ex.n===5&&ex.banca==="ENARE"&&ex.store&&ex.nox,name+": a prova é salva no aparelho e na conta");
  /* 4. fazer no modo prova */
  const st0=await p.evaluate(()=>{const e=exams[0];const ks=[...new Set(e.qs.map(r=>r.k).filter(Boolean))];return {ks,qt:Object.fromEntries(ks.map(k=>[k,[get(k).qt||0,get(k).qc||0]])),hq:(hist[today()]||{}).q||0}});
  await click(`#exgo-${ex.id}`);ok(await p.isVisible('.explay .qcard'),name+": Começar abre a primeira questão");
  await click('#exa-0-A');ok(await p.evaluate(()=>!document.querySelector('.explay .verdict')&&document.querySelector('#exa-0-A').classList.contains('pick')),name+": modo prova não mostra a correção na hora");
  await click('#exNext');await click('#exa-1-B');await click('#exNext');await click('#exa-2-B');await click('#exNext');await click('#exNext');await click('#exa-4-A');
  ok(await p.evaluate(()=>/anulada/i.test(document.querySelector('.explay').textContent)&&/página 4/.test(document.querySelector('.explay').textContent)),name+": questão anulada e com imagem avisam (veja a página 4)");
  await click('#exNext');
  const res=await p.evaluate(([st0])=>{const e=exams[0],S=exScore(e);const d=st0.ks.map(k=>[(get(k).qt||0)-st0.qt[k][0],(get(k).qc||0)-st0.qt[k][1]]);
    return {S,dq:d.reduce((a,x)=>a+x[0],0),dc:d.reduce((a,x)=>a+x[1],0),hq:((hist[today()]||{}).q||0)-st0.hq,qb:Object.keys(get(e.qs[1].k).qb||{}).includes(qSrcKey("ENARE")),redo:redo.some(x=>x.q.enunciado===e.qs[1].q.enunciado),txt:document.querySelector('.explay').textContent}},[st0]);
  ok(res.S.hit===2&&res.S.ans===3&&/67%/.test(res.txt),name+": resultado: 2 de 3 válidas (anulada e em branco não contam) "+JSON.stringify(res.S));
  ok(res.dq===3&&res.dc===2&&res.hq===3&&res.qb&&res.redo,name+": as respostas entram no acerto dos temas, no dia, na banca ENARE e a errada vai para Refazer "+JSON.stringify({dq:res.dq,dc:res.dc,hq:res.hq}));
  await p.evaluate(()=>[...document.querySelectorAll('.exres .link')][1].click());await p.waitForTimeout(120);
  ok(await p.evaluate(()=>/Incorreta\. A resposta é C/.test(document.querySelector('.explay').textContent)&&/Comentário da questão 2/.test(document.querySelector('.explay').textContent)&&document.querySelectorAll('.explay .altwhy').length>=1),name+": no resultado, cada questão abre com a correção, o comentário e o porquê");
  if(name==="fone"||name==="note")await p.screenshot({path:`t83-play-${name}.png`});
  /* 5. gabarito colado depois: a 2 passa a ser B → acerto recalculado */
  await p.evaluate(()=>{exRun=null;render()});await click(`#exkb-${ex.id}`);await p.fill('#exKeyTa','01-A 02-B 03-B 04-B 05-ANULADA');await p.waitForTimeout(400);await click('#exKeyGo');
  const r5=await p.evaluate(([st0])=>{const e=exams[0],S=exScore(e);const d=st0.ks.map(k=>[(get(k).qt||0)-st0.qt[k][0],(get(k).qc||0)-st0.qt[k][1]]);
    return {S,dq:d.reduce((a,x)=>a+x[0],0),dc:d.reduce((a,x)=>a+x[1],0),msg:document.querySelector('.exrow .exkey').textContent,tries:exPg(e.id).tries[0].hit}},[st0]);
  ok(r5.S.hit===3&&r5.dq===3&&r5.dc===3&&r5.tries===3&&/1 mudou/.test(r5.msg),name+": colar o gabarito corrige a resposta e recalcula o acerto (sem contar de novo) "+JSON.stringify(r5));
  /* 6. trocar o tema de uma questão já respondida move a contagem */
  await p.evaluate(()=>{exKey=null;render()});await click(`#exed-${ex.id}`);
  const mv=await p.evaluate(()=>{const e=exams[0],k0=e.qs[0].k,a0=[get(k0).qt,get(k0).qc],k1="CM-1",b0=[get(k1).qt||0,get(k1).qc||0];exEdit.flt="all";
    exChange(e,0,r=>{r.k=k1});exPut(e);commit();return {a:[get(k0).qt-a0[0],get(k0).qc-a0[1]],b:[get(k1).qt-b0[0],get(k1).qc-b0[1]]}});
  ok(mv.a.join()==="-1,-1"&&mv.b.join()==="1,1",name+": trocar o tema tira do tema antigo e põe no novo "+JSON.stringify(mv));
  ok(await p.evaluate(()=>document.querySelectorAll('.exedit .exq').length===5&&document.documentElement.scrollWidth<=innerWidth),name+": Revisar questões lista a prova salva, sem rolagem lateral");
  /* 7. dados válidos para a conta (sem undefined, sem array dentro de array) e sobrevive a recarregar */
  ok(await p.evaluate(id=>{const bad=v=>Array.isArray(v)?v.some(x=>Array.isArray(x)||bad(x)):v&&typeof v==="object"?Object.values(v).some(bad):v===undefined;
    const a=__store["data/users/u1/progress/exams/"+id];return JSON.stringify(exams).indexOf("undefined")<0&&!bad(a)},ex.id),name+": dados da prova válidos para o Firestore");
  await p.evaluate(()=>exFlush());await p.waitForTimeout(100);
  ok(await p.evaluate(id=>!!__store["data/users/u1/progress/exprog/"+id]&&__store["data/users/u1/progress/exprog/"+id].fin===today(),ex.id),name+": as respostas ficam num documento separado e pequeno");
  ok(await p.evaluate(()=>buildBackup().data.exams.length===1&&buildBackup().data.examProg.length===1),name+": a prova vai no backup");
  /* 8. excluir vai para a lixeira e volta */
  await p.evaluate(id=>{exDel(id)},ex.id);await p.waitForTimeout(100);
  const tr=await p.evaluate(()=>{const t=trash.find(x=>x.kind==="exam");if(!t)return null;trRestore(t.id);return {back:exams.length===1&&exams[0].qs.length===5,fin:!!exPg(exams[0].id).fin}});
  ok(tr&&tr.back&&tr.fin,name+": excluir manda para a lixeira e restaurar devolve a prova com as respostas");
  /* 9. modo estudo: correção a cada questão */
  const e2=await p.evaluate(()=>exams[0].id);await p.evaluate(id=>{const e=exams[0];exRestart(e);exPg(id).mode="e";render()},e2);await click(`#exgo-${e2}`);await click('#exa-0-B');
  ok(await p.evaluate(()=>/Incorreta/.test(document.querySelector('.explay .verdict').textContent)),name+": modo estudo corrige na hora");
  await ctx.close()}
/* site (copiar e colar): o pedido abre com título e instrução próprios */
{const fake=fs.readFileSync(__dirname+'/fakefb.js','utf8');const ctx=await b.newContext({serviceWorkers:'block',viewport:{width:390,height:844},hasTouch:true,isMobile:true,permissions:['clipboard-read','clipboard-write']});
  await ctx.addInitScript(()=>{try{localStorage.setItem('resid-onb-seen','1')}catch(e){}});await ctx.route(/fonts\.(googleapis|gstatic)/,r=>r.abort());
  await ctx.route(/www\.gstatic\.com\/firebasejs\//,r=>r.fulfill({contentType:'text/javascript',body:'/* ok */'}));
  await ctx.route(/config\.js/,r=>r.fulfill({contentType:'text/javascript',body:'window.FIREBASE_CONFIG={apiKey:"COLE_AQUI"};'}));
  await ctx.route(/cdn\.jsdelivr\.net\/npm\/pdfjs-dist@4\.10\.38\/legacy\/build\/(.+)$/,r=>{const f=r.request().url().split("/").pop();r.fulfill({contentType:"text/javascript",headers:{"Access-Control-Allow-Origin":"*"},body:fs.readFileSync(path.join(PDFJS_DIR,f))})});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push("site:"+e.message));await p.goto('http://localhost:8765/');
  await p.waitForFunction(()=>typeof saveFac==='function'&&window.__site&&synced&&sampleFn,null,{polling:100,timeout:15000});
  await p.evaluate(()=>{backStack=[];setView("quest");setQSeg("praticar")});await p.waitForTimeout(150);await p.tap('#impNew');
  await p.setInputFiles('#impFile',pdf);await p.waitForFunction(()=>imp&&imp.st==="ready",null,{polling:100,timeout:20000});
  ok(await p.evaluate(()=>/em \d+ partes?: em cada uma, você copia o pedido/.test(document.querySelector('#impPanel').textContent)),"site: avisa que cada parte é um copiar e colar");
  await p.tap('#impGo');await p.waitForSelector('.smodal',{timeout:5000});
  const m=await p.evaluate(()=>({t:document.querySelector('.smodal').textContent,pr:document.querySelector('.smodal .sprompt').textContent}));
  ok(/Ler a prova com o Claude · parte 1 de 2/.test(m.t)&&/O texto da prova já vai junto/.test(m.t)&&/=== Página 2 ===/.test(m.pr)&&/QUESTAO 1/.test(m.pr),"site: o pedido tem título da parte, instrução e o texto das páginas");
  const ans=JSON.stringify([{numero:1,enunciado:"Caso 1",alternativas:[{letra:"A",texto:"x",porque:""},{letra:"B",texto:"y",porque:"não"}],correta:"A",gabarito:"banca",tema:"CM-7",comentario:"c",conceito:"k"}]);
  await p.fill('.smodal textarea',ans);await p.evaluate(()=>[...document.querySelectorAll('.smodal button')].find(b=>/Usar esta resposta/.test(b.textContent)).click());
  await p.waitForSelector('.smodal',{timeout:5000});ok(await p.evaluate(()=>/parte 2 de 2/.test(document.querySelector('.smodal').textContent)&&/anexe o PDF da prova/.test(document.querySelector('.smodal').textContent)),"site: a parte escaneada pede para anexar o PDF");
  await p.evaluate(()=>document.querySelector('.smodal-head button').click());await p.waitForFunction(()=>imp&&imp.st==="review",null,{polling:100,timeout:5000});
  const cz=await p.evaluate(()=>({n:imp.qs.length,t:document.querySelector('#impPanel').textContent.slice(0,600)}));
  ok(cz.n===1&&/A página 4 ainda não foi lida/.test(cz.t),"site: cancelar uma parte guarda o que veio e oferece ler o resto "+JSON.stringify(cz));
  await ctx.close()}
/* reserva: se o jsdelivr falhar, o leitor vem do cdnjs */
{const ctx=await b.newContext();await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.route(/cdn\.jsdelivr\.net/,r=>r.abort());
  await ctx.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/pdf\.js\/4\.10\.38\/(.+)$/,r=>{const f=r.request().url().split("/").pop();r.fulfill({contentType:"text/javascript",headers:{"Access-Control-Allow-Origin":"*"},body:fs.readFileSync(path.join(PDFJS_DIR,"..","..","build",f))})});
  await ctx.addInitScript(mock+`;window.__mock({},2);`);const p=await ctx.newPage();p.on('pageerror',e=>errs.push("cdnjs:"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
  await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});
  const n=await p.evaluate(async b64=>{const bin=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));const f=new File([bin],"x.pdf",{type:"application/pdf"});const o=await pdfOpenTxt(f);return o.pages.length},fs.readFileSync(pdf).toString("base64"));
  ok(n===5,"leitor de PDF de reserva (cdnjs) abre a prova quando o jsdelivr falha");await ctx.close()}
fs.unlinkSync(pdf);ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
