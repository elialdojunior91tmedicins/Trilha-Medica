const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync('mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const png=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8z8DAwMDAxMDAwMDAAAANHQEDasKb6QAAAABJRU5ErkJggg==","base64");
(async()=>{const b=await chromium.launch();const errs=[];
for(const [vw,vh,mob] of [[390,844,true],[1366,900,false]]){
const ctx=await b.newContext({viewport:{width:vw,height:vh},hasTouch:mob,isMobile:mob});await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},5);`);
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('file://'+__dirname+'/preview.html');await p.waitForFunction(()=>typeof saveFac==='function'&&synced&&sampleFn,null,{polling:100});
const click=s=>mob?p.tap(s):p.click(s);const tag=mob?"celular":"computador";
const RESP="## O que a imagem mostra\n- Dor torácica típica\n## Fluxograma\n```fluxo\nDor torácica\nECG em 10 min\n? Supra de ST\n  Sim: Angioplastia → Dupla antiagregação\n  Não: Troponina seriada\nAlta ou internação\n```\n## Pegadinhas\n> Não esperar troponina para reperfundir";
await p.evaluate(R=>{window.__imgs=null;const f=async(input,o)=>{window.__imgs=o&&o.images;window.__prompt=input;if(o&&o.onText)o.onText({text:R.slice(0,20)});return {text:R,truncated:false}};f.json=sampleFn.json;f.limits=async()=>({images:true});sampleFn=f;
  notes={"CM-1":"Veja [esquema no Drive](https://drive.google.com/x) e https://exemplo.com/a\n```fluxo\nA\n? B\n  Sim: C\n  Não: D\n```"};commit();detTab["CM-1"]="notas";noteMode["CM-1"]="ler";openTopic("CM-1")},RESP);await p.waitForTimeout(300);
// links e fluxograma
const links=await p.$$eval('#t-CM-1 .mdview a',a=>a.map(x=>x.href+"|"+x.target));ok(links.length===2&&links[0].startsWith("https://drive.google.com/x|_blank"),tag+": links clicáveis "+links.join(" , "));
ok(await p.$$eval('#t-CM-1 .flow .fl-box',a=>a.length)===4&&await p.$$eval('#t-CM-1 .flow .fl-q',a=>a.length)===1,tag+": fluxograma desenhado em caixas");
// ler imagem a partir do tema
await click('#t-CM-1 .nai button:has-text("Ler imagem")');await p.waitForTimeout(200);ok(await p.isVisible('#imgPanel'),tag+": painel de leitura no tema");
ok(await p.evaluate(()=>imgR.dest==="tema"&&imgR.k==="CM-1"),tag+": destino padrão = este tema");
await p.setInputFiles('#imgPanel input[type=file]',{name:"slide.png",mimeType:"image/png",buffer:png});await p.waitForTimeout(400);
ok(await p.isVisible('#imgPanel .imgprev'),tag+": prévia da imagem");
await click('#imgPanel .chip:has-text("Esquema")');await click('#imgGo');await p.waitForTimeout(400);
ok(await p.evaluate(()=>Array.isArray(__imgs)&&__imgs[0] instanceof Blob&&/Fluxograma/.test(__prompt)&&/Esquema ou algoritmo/.test(__prompt)&&/Hipertens/.test(__prompt)),tag+": imagem e pedido enviados ao Claude");
ok(await p.$$eval('#imgOut .flow .fl-box',a=>a.length)>=5,tag+": prévia com fluxograma");
await click('#imgSave');await p.waitForTimeout(300);ok(await p.evaluate(()=>/Angioplastia/.test(notes["CM-1"])&&/Gerado pelo Claude a partir de uma imagem/.test(notes["CM-1"])&&imgR===null),tag+": inserido na anotação do tema");
// pelo caderno livre, a partir da aba Anotações
await p.evaluate(()=>{setView("notas");setNSeg("todas")});await p.waitForTimeout(150);await click('#nImg');await p.waitForTimeout(150);
ok(await p.evaluate(()=>imgR&&imgR.dest==="livre"),tag+": da aba Anotações, padrão = caderno livre");
await p.setInputFiles('#imgPanel input[type=file]',{name:"aula.png",mimeType:"image/png",buffer:png});await p.waitForTimeout(400);await p.fill('#imgT','Slide IAM');await click('#imgGo');await p.waitForTimeout(400);await click('#imgSave');await p.waitForTimeout(300);
ok(await p.evaluate(()=>freeN.length===1&&freeN[0].t==="Slide IAM"&&freeN[0].tags.includes("imagem")),tag+": salvo no caderno livre com etiqueta #imagem");
// clínica: aviso
await click('#nImg');await p.waitForTimeout(100);await click('#imgPanel .chip:has-text("Imagem clínica")');await p.waitForTimeout(100);ok(/não é laudo/.test(await p.$eval('#imgPanel',x=>x.textContent)),tag+": aviso para imagem clínica");await click('#imgPanel .dhead .link');
// PDF com links e fluxo
ok(await p.evaluate(()=>{const s=new TextDecoder("latin1").decode(notesPDF(["CM-1"],[]));return s.includes("Fluxograma:")&&s.includes("drive.google.com")}),tag+": PDF com fluxograma e endereço dos links");
ok(await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=0,tag+": sem rolagem horizontal");
await p.evaluate(()=>{detTab["CM-1"]="notas";noteMode["CM-1"]="ler";openTopic("CM-1")});await p.waitForTimeout(250);await p.evaluate(()=>document.querySelector('#t-CM-1 .flow').scrollIntoView({block:"center"}));await p.screenshot({path:`flow-${mob?"fone":"desk"}.png`});
await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
