// t94: gerar questões com um material do estudante (opcional) e com fonte confiável citada em cada questão
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const {PDFDocument,StandardFonts}=require('pdf-lib');const sharp=require('sharp');
const PDFJS_DIR=path.join(path.dirname(require.resolve('pdfjs-dist/package.json')),'legacy','build');
const DEV={fone:[390,844,true],ipad578:[578,820,true],note:[1366,768,false]};
const Q=(n,fonte)=>({enunciado:"Caso "+n,alternativas:"ABCD".split("").map(l=>({letra:l,texto:"Alt "+l,porque:l==="A"?"":"Errada."})),correta:"A",comentario:"Comentário "+n,conceito:"Conceito "+n,alerta:"",fonte});
(async()=>{const pdf=path.join(__dirname,"t94-aula.pdf"),png=path.join(__dirname,"t94-slide.png"),txt=path.join(__dirname,"t94-nada.txt");
  {const doc=await PDFDocument.create(),font=await doc.embedFont(StandardFonts.Helvetica);[["Aula de Anemias - Prof. Silva","Anemia ferropriva: ferritina baixa e RDW alto."],["Anemia megaloblástica","Deficiência de B12: VCM alto e neuropatia.","Folato baixo também causa VCM alto, sem neuropatia."]].forEach(L=>{const p=doc.addPage([595,842]);let y=780;L.forEach(l=>{p.drawText(l,{x:40,y,size:12,font});y-=18})});fs.writeFileSync(pdf,await doc.save())}
  fs.writeFileSync(png,await sharp({create:{width:400,height:300,channels:3,background:"#fff"}}).png().toBuffer());fs.writeFileSync(txt,"oi");
  const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,screen:name==="ipad578"?{width:1180,height:820}:undefined});
  await ctx.route(/googleapis|gstatic/,r=>r.abort());
  await ctx.route(/cdn\.jsdelivr\.net\/npm\/pdfjs-dist@4\.10\.38\/legacy\/build\/(.+)$/,r=>{const f=r.request().url().split("/").pop();r.fulfill({contentType:"text/javascript",headers:{"Access-Control-Allow-Origin":"*"},body:fs.readFileSync(path.join(PDFJS_DIR,f))})});
  await ctx.addInitScript(mock+`;window.__mock({},2);`);
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
  await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn&&sampleFn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
  const click=async s=>{await p.evaluate(s=>{const x=document.querySelector(s);if(x)x.scrollIntoView({block:"center"})},s);await (mob?p.tap(s):p.click(s));await p.waitForTimeout(150)};
  await p.evaluate(([Q1,Q2])=>{window.__P=[];window.__O=[];sampleFn.limits=async()=>({images:{maxCount:5}});
    sampleFn.json=async(input,o)=>{__P.push(input);__O.push(o||{});const mat=/Material do estudante/.test(input);return [mat?Q2:Q1]};qCount=1;detTab["CM-34"]="questoes";openTopic("CM-34")},
    [Q(1,"Diretriz brasileira de anemias, ABHH"),Q(2,"Material do estudante, página 1")]);await p.waitForTimeout(250);
  /* 1. instruções: fontes confiáveis, nada inventado, campo fonte */
  ok(await p.evaluate(()=>/Conteúdo e fontes/.test(DEFAULT_PROMPT)&&/Nada inventado/.test(DEFAULT_PROMPT)&&/PCDTs/.test(DEFAULT_PROMPT)&&promptUp(OLD_PROMPTS[0])===DEFAULT_PROMPT&&/"fonte"/.test(fixedFormat(2))&&/Nada inventado/.test(fixedFormat(2))),name+": instruções pedem fontes confiáveis e a fonte de cada questão (o padrão anterior migra)");
  /* 2. sem material: gera normalmente e mostra a fonte */
  ok(await p.evaluate(()=>!!document.getElementById('gmf-CM-34')&&/opcional/i.test(document.querySelector('.gmat summary').textContent)),name+": a opção de material aparece, marcada como opcional");
  await p.evaluate(()=>generate(BYKEY["CM-34"]));await p.waitForFunction(()=>gen["CM-34"]&&gen["CM-34"].status==="done",null,{timeout:10000});
  ok(await p.evaluate(()=>!/Material do estudante/.test(__P[0])&&!__O[0].images&&!gen["CM-34"].qs[0].mat),name+": sem material, o pedido é o de sempre");
  await p.evaluate(()=>answer(BYKEY["CM-34"],0,"B"));await p.evaluate(()=>render());await p.waitForTimeout(150);
  ok(await p.evaluate(()=>{const f=document.querySelector('#t-CM-34 .qfonte, .qcard .qfonte');return !!f&&/Diretriz brasileira de anemias/.test(f.textContent)}),name+": a fonte aparece depois de responder");
  ok(await p.evaluate(()=>redo.some(r=>r.k==="CM-34"&&r.q.fonte==="Diretriz brasileira de anemias, ABHH")),name+": a fonte vai junto para Refazer as que errei");
  /* 3. com um PDF de aula */
  await p.setInputFiles('#gmf-CM-34',pdf);await p.waitForFunction(()=>genMat["CM-34"]&&!genMat["CM-34"].busy,null,{timeout:20000});await p.waitForTimeout(150);
  const m1=await p.evaluate(()=>({st:(document.querySelector('.gmok')||{}).textContent,btn:[...document.querySelectorAll('.qgen ~ .btn.primary, .grp .btn.primary')].map(x=>x.textContent).join("|")}));
  ok(/^2 de 2 páginas lidas/.test(m1.st||"")&&/questões do material/.test(m1.btn),name+": PDF lido no aparelho; o botão vira Gerar questões do material "+JSON.stringify(m1));
  await p.evaluate(()=>{__P=[];__O=[];generate(BYKEY["CM-34"])});await p.waitForFunction(()=>gen["CM-34"]&&gen["CM-34"].status==="done",null,{timeout:10000});await p.waitForTimeout(150);
  const r3=await p.evaluate(()=>({p:__P[0],q:gen["CM-34"].qs[0],badge:!!document.querySelector('.qmat')}));
  ok(/Material do estudante/.test(r3.p)&&/TEXTO DO MATERIAL/.test(r3.p)&&/ferritina baixa e RDW alto/.test(r3.p)&&/=== Página 2 ===/.test(r3.p)&&!/Uma questão para cada um destes subtópicos/.test(r3.p),name+": o pedido leva o texto do material e pede as questões a partir dele");
  ok(r3.q.mat&&r3.badge,name+": a questão vem marcada 'do seu material'");
  if(name==="fone"||name==="note"){await p.evaluate(()=>{answer(BYKEY["CM-34"],0,"A");render();document.querySelector('.gmat').scrollIntoView({block:"start"});scrollBy(0,-80)});await p.waitForTimeout(200);await p.screenshot({path:`t94-mat-${name}.png`});
    await p.evaluate(()=>{const f=document.querySelector('.qcard .qfonte');f&&f.scrollIntoView({block:"center"})});await p.waitForTimeout(150);await p.screenshot({path:`t94-fonte-${name}.png`})}
  /* 4. foto de slide: vai como imagem */
  await p.evaluate(()=>{delete genMat["CM-34"];render()});await p.setInputFiles('#gmf-CM-34',png);await p.waitForFunction(()=>genMat["CM-34"]&&!genMat["CM-34"].busy,null,{timeout:20000});
  await p.evaluate(()=>{__P=[];__O=[];generate(BYKEY["CM-34"])});await p.waitForFunction(()=>gen["CM-34"]&&gen["CM-34"].status==="done",null,{timeout:10000});
  ok(await p.evaluate(()=>__O[0].images&&__O[0].images.length===1&&__O[0].images[0].type==="image/jpeg"&&/As imagens anexadas são páginas do material/.test(__P[0])),name+": foto do slide vai como imagem junto com o pedido");
  /* 5. arquivo que não dá para ler: avisa, mas não impede */
  await p.evaluate(()=>{delete genMat["CM-34"];render()});await p.setInputFiles('#gmf-CM-34',txt);await p.waitForFunction(()=>genMat["CM-34"]&&!genMat["CM-34"].busy,null,{timeout:20000});await p.waitForTimeout(100);
  ok(await p.evaluate(()=>/fica de fora/.test((document.querySelector('.gmat .err')||{}).textContent||"")&&!/do material/.test([...document.querySelectorAll('.grp .btn.primary')].map(x=>x.textContent).join())),name+": arquivo ilegível avisa e o botão continua gerando sem material");
  await p.evaluate(()=>{__P=[];generate(BYKEY["CM-34"])});await p.waitForFunction(()=>gen["CM-34"]&&gen["CM-34"].status==="done",null,{timeout:10000});
  ok(await p.evaluate(()=>!/Material do estudante/.test(__P[0])),name+": gera normalmente sem o material");
  await click('#gmx-CM-34');ok(await p.evaluate(()=>!genMat["CM-34"]),name+": Tirar o material");
  ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral");
  await ctx.close()}
/* 6. site (copiar e colar): "vou anexar na conversa" e a janela pede para anexar */
{const fake=fs.readFileSync(__dirname+'/fakefb.js','utf8');const ctx=await b.newContext({serviceWorkers:'block',viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  await ctx.addInitScript(()=>{try{localStorage.setItem('resid-onb-seen','1')}catch(e){}});await ctx.route(/fonts\.(googleapis|gstatic)/,r=>r.abort());
  await ctx.route(/www\.gstatic\.com\/firebasejs\//,r=>r.fulfill({contentType:'text/javascript',body:'/* ok */'}));
  await ctx.route(/config\.js/,r=>r.fulfill({contentType:'text/javascript',body:'window.FIREBASE_CONFIG={apiKey:"COLE_AQUI"};'}));
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push("site:"+e.message));await p.goto('http://localhost:8765/');
  await p.waitForFunction(()=>typeof saveFac==='function'&&window.__site&&synced&&sampleFn,null,{polling:100,timeout:15000});
  await p.evaluate(()=>{qCount=1;detTab["CM-34"]="questoes";openTopic("CM-34")});await p.waitForTimeout(250);
  await p.evaluate(()=>{const c=document.querySelector('#gma-CM-34');c.scrollIntoView({block:'center'});c.click()});await p.waitForTimeout(150);
  ok(await p.evaluate(()=>genMat["CM-34"]&&genMat["CM-34"].attach&&/anexado na conversa/.test(document.querySelector('.gmat summary').textContent)),"site: marcar 'vou anexar o material na conversa'");
  await p.evaluate(()=>{generate(BYKEY["CM-34"])});await p.waitForSelector('.smodal',{timeout:5000});
  const m=await p.evaluate(()=>({t:document.querySelector('.smodal').textContent,pr:document.querySelector('.smodal .sprompt').textContent}));
  ok(/Gerar questões do seu material/.test(m.t)&&/ANEXE o seu material/.test(m.t)&&/está anexado a esta conversa/.test(m.pr)&&/Se não houver nenhum anexo/.test(m.pr),"site: a janela pede para anexar o material e o pedido sabe lidar sem anexo");
  await ctx.close()}
[pdf,png,txt].forEach(f=>{try{fs.unlinkSync(f)}catch(e){}});
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
