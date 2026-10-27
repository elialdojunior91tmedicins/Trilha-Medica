// t102: Lote 2 — barra lateral recolhível (computador e iPad deitado), menu ≡ no celular (no lugar do Mais) e no iPad em pé (no topo)
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],ipad578:[578,820,true],ipad820:[820,1180,true],tabDeitado:[1180,820,true],note:[1366,768,false],full:[1920,1080,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];const ipad=name.startsWith("ipad")||name.startsWith("tab");
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,screen:name==="ipad578"?{width:1180,height:820}:undefined,userAgent:ipad?"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)":undefined});
 await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
 await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
 const click=async s=>{await p.evaluate(s=>{const x=document.querySelector(s);if(x)x.scrollIntoView({block:"center"})},s);await (mob?p.tap(s):p.click(s));await p.waitForTimeout(220)};
 const st=()=>p.evaluate(()=>{const n=document.querySelector('.appnav'),r=n.getBoundingClientRect();return {sb:document.documentElement.dataset.sb||"",w:Math.round(r.width),peek:n.classList.contains("peek"),pad:parseFloat(getComputedStyle(document.body).paddingLeft),view,labels:[...n.querySelectorAll('.tab .tl')].filter(x=>x.checkVisibility()).length,back:!document.querySelector('#sbBack').hidden,menu:!document.querySelector('#navMenu').hidden}});
 const side=["tabDeitado","note","full"].includes(name);
 if(side){
  /* automático: aberta no Início, trilho nas outras abas */
  let r=await st();ok(r.sb==="open"&&r.w===248&&r.labels===8,name+": no Início a barra fica aberta "+JSON.stringify(r));
  await p.evaluate(()=>{backStack=[];setView("quest")});await p.waitForTimeout(250);
  r=await st();ok(r.sb==="rail"&&r.w===76&&r.labels===0&&r.pad<130,name+": nas outras abas vira trilho de ícones e a página ganha largura "+JSON.stringify(r));
  ok(await p.evaluate(()=>!!document.querySelector('#sbMenu').checkVisibility()&&document.querySelector('#tabQ').getBoundingClientRect().width<70),name+": trilho mostra ≡ e só os ícones");
  /* abrir por cima: mouse (computador) ou ≡ (iPad) */
  if(mob){await click('#sbMenu')}else{await p.mouse.move(800,400);await p.mouse.move(30,300,{steps:6});await p.waitForTimeout(350)}
  r=await st();ok(r.peek&&r.w===248&&r.labels===8&&r.pad<130&&(mob?r.back:!r.back),name+": abre por cima sem empurrar a página "+JSON.stringify(r));
  if(name==="note"||name==="tabDeitado")await p.screenshot({path:`t102-peek-${name}.png`});
  if(mob){await p.tap('#sbBack',{position:{x:900,y:400}});await p.waitForTimeout(200);r=await st();ok(!r.peek&&!r.back,name+": tocar fora fecha")}
  else{await p.mouse.move(900,400);await p.waitForTimeout(250);r=await st();ok(!r.peek,name+": tirar o mouse recolhe")}
  /* tocar numa aba fecha a barra aberta por cima */
  if(mob){await click('#sbMenu');await p.tap('#tabE');await p.waitForTimeout(250);r=await st();ok(r.view==="erros"&&!r.peek&&!r.back&&r.sb==="rail",name+": tocar numa aba fecha o menu "+JSON.stringify(r))}
  /* fixar aberta (lembrado) */
  await p.evaluate(()=>{document.querySelector('.appnav').classList.add('peek')});await click('#sbPinOpen');
  r=await st();ok(r.sb==="open"&&r.w===248&&await p.evaluate(()=>localStorage.getItem("resid-sbpin")==="open"&&document.querySelector('#sbPinOpen').getAttribute("aria-pressed")==="true"),name+": Fixar deixa aberta em todas as abas e o app lembra "+JSON.stringify(r));
  /* tela inteira recolhe mesmo fixada */
  await p.evaluate(()=>{const alt=["A","B","C","D"].map(l=>({letra:l,texto:"Alt "+l}));const ex=exClean({id:"exS",name:"P",banca:"X",ano:"2024",at:new Date().toISOString(),qs:[{n:1,k:"CM-1",g:"b",q:{enunciado:"Q",alternativas:alt,correta:"A",comentario:""}}]});exams.unshift(ex);exPut(ex);
    fullOn.ex=true;exRun={id:"exS",view:"q",i:0,cad:{}};backStack=[];qSeg="praticar";setView("quest")});await p.waitForTimeout(250);
  r=await st();ok(r.sb==="rail",name+": em tela inteira a barra recolhe "+JSON.stringify(r));
  await p.evaluate(()=>{fullOn.ex=false;exRun=null;render()});await p.waitForTimeout(150);
  /* recolher sempre: até no Início */
  await p.evaluate(()=>{sbSetPin("rail");backStack=[];setView("inicio")});await p.waitForTimeout(200);r=await st();ok(r.sb==="rail",name+": Sempre recolhida vale até no Início");
  /* configurações */
  await p.evaluate(()=>goSub("config"));await p.waitForTimeout(250);
  ok(await p.evaluate(()=>{const r=[...document.querySelectorAll('.cfrow')].find(x=>/Barra lateral/.test(x.textContent));return r&&[...r.querySelectorAll('button')].map(b=>b.textContent).join()==="Automática,Sempre aberta,Sempre recolhida"&&r.querySelector('[aria-pressed="true"]').textContent==="Sempre recolhida"}),name+": Configurações › Aparência › Barra lateral");
  await p.evaluate(()=>{const m=document.getElementById("cfm-ap");if(m)m.open=true;[...[...document.querySelectorAll('.cfrow')].find(x=>/Barra lateral/.test(x.textContent)).querySelectorAll('button')][0].id="__auto"});await click('#__auto');
  ok(await p.evaluate(()=>sbPin===""&&localStorage.getItem("resid-sbpin")===null),name+": Automática volta ao padrão");
  ok(!(await p.$('#navMenuBtn').then(x=>x.isVisible())),name+": sem ≡ no topo");
 } else {
  /* celular e iPad em pé: sem faixa lateral; menu ≡ */
  const phone=name==="fone";
  ok(await p.evaluate(ph=>{const n=document.querySelector('.appnav');return ph?n.checkVisibility()&&document.querySelector('#tabM .tl').textContent==="Menu":!n.checkVisibility()&&document.querySelector('#navMenuBtn').checkVisibility()},phone),name+(phone?": barra de baixo com Menu ≡":": sem faixa lateral, ≡ no topo"));
  await p.evaluate(()=>{backStack=[];setView("quest")});await p.waitForTimeout(200);
  await click(phone?'#tabM':'#navMenuBtn');
  const m=await p.evaluate(()=>({open:!document.querySelector('#navMenu').hidden,items:[...document.querySelectorAll('#navMenu .nmit')].map(x=>x.id),cur:(document.querySelector('#navMenu .nmit[aria-current]')||{}).id,sec:[...document.querySelectorAll('#navMenu .nmsec button')].map(x=>x.textContent),search:!!document.querySelector('#nmSearch')}));
  ok(m.open&&m.items.join()==="go-inicio,go-temas,go-fac,go-quest,go-notas,go-stats,go-foco,go-erros"&&m.cur==="go-quest"&&m.sec.join()==="Perfil,Configurações,Ajuda"&&m.search,name+": menu com todas as seções, busca, Perfil, Configurações e Ajuda "+JSON.stringify(m));
  if(name==="fone"||name==="ipad820")await p.screenshot({path:`t102-menu-${name}.png`});
  await p.keyboard.press('Escape');await p.waitForTimeout(320);ok((await st()).menu===false,name+": Esc fecha");
  await click(phone?'#tabM':'#navMenuBtn');await click('#go-foco');await p.waitForTimeout(320);
  ok(await p.evaluate(ph=>view==="foco"&&document.querySelector('#navMenu').hidden&&(!ph||document.querySelector('#tabM').getAttribute("aria-selected")==="true"),phone),name+": escolher Foco abre a aba e fecha o menu");
  await click(phone?'#tabM':'#navMenuBtn');await p.evaluate(()=>{document.querySelector('#navMenu').click()});await p.waitForTimeout(320);
  ok((await st()).menu===false,name+": tocar fora fecha");
  await click(phone?'#tabM':'#navMenuBtn');await click('#nmCfg');ok(await p.evaluate(()=>view==="config"),name+": Configurações pelo menu");
  ok(await p.evaluate(()=>![...document.querySelectorAll('.cfrow')].some(x=>/Barra lateral/.test(x.textContent))),name+": sem opção de barra lateral onde não há barra");
 }
 ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral");
 await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
