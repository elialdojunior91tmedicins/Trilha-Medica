// t110: Lote 8–9 — aba Caderno (Livre · Temas · Revisar · Pegadinhas, Livre primeiro) e, em toda questão respondida, Levar para a anotação
// (pontos marcáveis → "## Conceitos das questões" com selo) e Criar cartão (padrão Osler, sem ligar a erro).
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const SHOT=process.env.SHOT||"";
(async()=>{const b=await chromium.launch();const errs=[];
for(const [name,w,h,mob] of [["fone",390,844,true],["ipad578",578,820,true],["note",1366,900,false]]){
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,deviceScaleFactor:SHOT?2:1,screen:name==="ipad578"?{width:1180,height:820}:undefined,userAgent:name==="ipad578"?"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)":undefined});
  await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);localStorage.removeItem("resid-nseg2");`);const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));
  await p.goto('http://localhost:8765/tests/preview.html');await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
  /* 1. aba Caderno */
  const T=await p.evaluate(()=>({tab:document.querySelector('#tabN .tl').textContent,seg:[...document.querySelectorAll('#nSegBar button')].map(b=>b.dataset.n+":"+b.textContent.replace(/\d+$/,"")).join(),nseg:nSeg}));
  ok(T.tab==="Caderno"&&T.seg==="livre:Livre,todas:Temas,revisar:Revisar,pegadinhas:Pegadinhas"&&T.nseg==="livre",name+": aba Caderno com Livre primeiro "+JSON.stringify(T));
  await p.evaluate(()=>{notes["CM-12"]="## Resumo\nTexto.";saveNotesLocal();backStack=[];setView("notas")});await p.waitForTimeout(200);
  const V=await p.evaluate(()=>{const vis=s=>{const x=document.querySelector(s);return !!x&&x.getClientRects().length>0};return {free:vis('.nfree'),list:vis('#nlist'),rev:vis('#nRevBox'),order:[...document.querySelectorAll('#viewNotas > *')].map(x=>x.id||x.className).slice(0,3).join("|")}});
  if(name==="note")ok(V.free&&V.list&&V.rev&&/nFreeBox/.test(V.order),name+": no computador tudo numa página, caderno livre no topo "+JSON.stringify(V));
  else ok(V.free&&!V.list&&!V.rev,name+": Livre mostra só o caderno livre "+JSON.stringify(V));
  if(SHOT&&name==="fone")await p.screenshot({path:SHOT+'/l8-caderno-fone.png'});
  if(name!=="note"){await p.evaluate(()=>document.querySelector('#nSegBar button[data-n="todas"]').click());await p.waitForTimeout(150);
    ok(await p.evaluate(()=>!document.querySelector('.nfree').getClientRects().length&&document.querySelector('#nlist').getClientRects().length>0),name+": Temas mostra as anotações dos temas sem o caderno livre")}
  /* 2. prova na íntegra: Levar para a anotação com pontos marcáveis */
  await p.evaluate(()=>{const alts=[{letra:"A",texto:"Síndrome de Bernard-Soulier",porque:"Bernard-Soulier tem plaquetas gigantes e ristocetina ausente."},{letra:"B",texto:"Trombastenia de Glanzmann",porque:""},{letra:"C",texto:"Doença de von Willebrand tipo 3",porque:"Na DvW o TTPA costuma estar alargado."}];
    const ex=exClean({id:"exg",name:"Simulado-Coagulopatias",banca:"",ano:"",at:new Date().toISOString(),qs:[{n:5,p:1,pe:1,k:"CM-12",q:{enunciado:"Criança de 4 anos, filha de pais primos, com epistaxe recorrente. Plaquetas 280.000/mm³. Na agregometria, não há agregação com ADP, e a ristocetina é normal. Qual o diagnóstico?",alternativas:alts,correta:"B",comentario:"Na trombastenia de Glanzmann falta a GP IIb/IIIa. A herança é autossômica recessiva.",conceito:"",pc:"Agregação ausente com ADP e ristocetina normal = Glanzmann.",th:"Plaquetas normais sem agregação: pense em Glanzmann."},g:"b",an:false,im:false,ck:"B"}]});
    exams=[ex];exSaveLocal();const P=exPg("exg");P.mode="e";P.a={0:{l:"B",d:today(),s:40}};exRun={id:"exg",view:"q",i:0,shown:Date.now(),cad:{}};backStack=[];setView("quest");if(typeof setQSeg==="function")setQSeg("praticar");render()});
  await p.waitForTimeout(200);
  const A=await p.evaluate(()=>{const c=document.querySelector('.exqc');return {n:!!c.querySelector('[id^="qan-"]'),c:!!c.querySelector('[id^="qac-"]'),cad:/caderno de erros/.test(c.textContent)}});
  ok(A.n&&A.c&&!A.cad,name+": questão certa tem Levar para a anotação e Criar cartão (sem caderno de erros) "+JSON.stringify(A));
  await p.evaluate(()=>document.querySelector('.exqc [id^="qan-"]').click());await p.waitForTimeout(120);
  const K=await p.evaluate(()=>[...document.querySelectorAll('.qpick .qpl input')].map(i=>i.id.split("-").pop()+":"+i.checked));
  ok(K.join()==="pc:true,th:false,why:false,nA:false,nC:false,pi:false",name+": pontos para marcar, Ponto-chave marcado "+K.join());
  if(SHOT&&name==="fone"){await p.evaluate(()=>{const x=document.querySelector('.qpick');x.scrollIntoView({block:"center"})});await p.waitForTimeout(100);await (await p.$('.qacts')).screenshot({path:SHOT+'/l9-anotacao-fone.png'})}
  await p.evaluate(()=>{const i=[...document.querySelectorAll('.qpick .qpl input')].find(x=>/-th$/.test(x.id));i.click()});await p.waitForTimeout(80);
  await p.evaluate(()=>document.querySelector('[id^="qpgo-"]').click());await p.waitForTimeout(120);
  const N=await p.evaluate(()=>notes["CM-12"]);
  ok(/## Conceitos das questões\n- \*\*Trombastenia de Glanzmann\*\* \{\{q:exg:0\}\}\n  - Ponto-chave: Agregação ausente.*\n  - Take home: Plaquetas normais/.test(N)&&/^## Resumo\nTexto\./.test(N),name+": vai para Conceitos das questões com o selo da questão "+JSON.stringify(N));
  ok(await p.evaluate(()=>/Na anotação ✓/.test(document.querySelector('.exqc [id^="qan-"]').textContent)),name+": botão vira Na anotação ✓");
  /* 3. Criar cartão */
  await p.evaluate(()=>document.querySelector('.exqc [id^="qac-"]').click());await p.waitForTimeout(120);
  const C=await p.evaluate(()=>({n:document.querySelectorAll('.cderr .cdit').length,t:(document.querySelector('.cderr .dhead b')||{}).textContent,q:(document.querySelector('.cderr .osq')||{}).textContent,a:(document.querySelector('.cderr .osa')||{}).textContent}));
  ok(C.n===1&&C.t==="Cartões desta questão"&&/qual o diagnóstico\?/i.test(C.q)&&/Trombastenia de Glanzmann/.test(C.a)&&/Glanzmann\./.test(C.a),name+": cartão da questão certa (discriminador com o ponto-chave) "+JSON.stringify(C));
  if(SHOT&&name==="fone"){await p.evaluate(()=>document.querySelector('.cderr').scrollIntoView({block:"center"}));await p.waitForTimeout(100);await (await p.$('.qacts')).screenshot({path:SHOT+'/l9-cartao-fone.png'})}
  const n0=await p.evaluate(()=>cards.length);await p.evaluate(()=>document.querySelector('.cderr [id^="cdSave-"]').click());await p.waitForTimeout(120);
  const S=await p.evaluate(n0=>({n:cards.length-n0,eid:cards[cards.length-1].eid,k:cards[cards.length-1].k,btn:document.querySelector('.exqc [id^="qac-"]').textContent}),n0);
  ok(S.n===1&&!S.eid&&S.k==="CM-12"&&S.btn==="1 cartão ✓",name+": cartão guardado no tema, sem ligar a erro "+JSON.stringify(S));
  /* 4. errada: dois cartões e "por que não" marcado por padrão */
  await p.evaluate(()=>{const P=exPg("exg");P.a={0:{l:"A",d:today(),s:40}};exams[0].qs[0].q=JSON.parse(JSON.stringify(exams[0].qs[0].q));render()});await p.waitForTimeout(120);
  await p.evaluate(()=>document.querySelector('.exqc [id^="qan-"]').click());await p.waitForTimeout(80);
  const K2=await p.evaluate(()=>[...document.querySelectorAll('.qpick .qpl input')].filter(i=>i.checked).map(i=>i.id.split("-").pop()).join());
  ok(K2==="pc,nA",name+": errada marca também o porquê da sua "+K2);
  await p.evaluate(()=>document.querySelector('.exqc [id^="qac-"]').click());await p.waitForTimeout(80);
  ok(await p.evaluate(()=>document.querySelectorAll('.cderr .cdit').length===2&&/Por que não/.test(document.querySelectorAll('.cderr .osq')[1].textContent)),name+": errada tem também o cartão por que não a sua");
  /* 5. sem tema: botões desligados */
  ok(await p.evaluate(()=>{const q={enunciado:"x?",alternativas:[{letra:"A",texto:"a",porque:""},{letra:"B",texto:"b",porque:""}],correta:"A",comentario:"c",conceito:"k"};const w=qActsEl(q,"A",{k:"",src:"x"});return [...w.querySelectorAll("button.btn")].every(b=>b.disabled)}),name+": sem tema, os botões ficam desligados");
  await ctx.close()}
ok(!errs.length,"sem erros de JavaScript "+errs.join(" | "));await b.close()})();
