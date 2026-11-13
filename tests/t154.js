// t154 (13/11/2026): aba Cartões. A = a aba, a barra, Hoje, o caminho até ela e o Caderno sem "Revisar"; B = criar; C = Todos; D = Números.
// Desenho: docs/superpowers/specs/2026-11-13-aba-cartoes-design.md
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const PART=(process.argv[2]||"ABCD").toUpperCase();
const SEED=`(()=>{cards.length=0;const T=today(),ago=n=>fromNum(dnum(T)-n),k0=ALL[0].key,k1=ALL[1].key;
  const R=(q,o)=>{const x=cdClean({id:"cd"+Math.random().toString(36).slice(2,9),k:k0,q,a:"Resposta de "+q,src:"eu",due:ago(1),f:{st:2,s:10,d:5,last:ago(11),reps:3,lapses:0,first:ago(40)},...(o||{})});cards.push(x);return x};
  R("Qual o agente da leucoplasia pilosa?");R("Sífilis latente tardia: tratamento?");R("Critério de Light?",{k:k1});
  R("Pergunta que você esquece",{f:{st:2,s:3,d:8,last:ago(4),reps:12,lapses:5,first:ago(90)},due:ago(1)});
  cards.push(cdClean({id:"cdnovo1",k:k0,q:"Cartão novo de hoje",a:"Resposta nova",src:"eu"}));cdSaveLocal();render();return {k0,k1}})()`;
const DEV={fone:[390,844,true],note:[1366,900,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob});
 await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);try{localStorage.setItem("resid-nseg2","revisar")}catch(e){}`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
 await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
 const tap=async s=>{await p.evaluate(s=>{const x=document.querySelector(s);if(x)x.scrollIntoView({block:"center"})},s);await (mob?p.tap(s):p.click(s));await p.waitForTimeout(150)};
 const vis=s=>p.evaluate(s=>{const x=document.querySelector(s);return !!x&&x.offsetParent!==null&&getComputedStyle(x).display!=="none"},s);
 const KS=await p.evaluate(SEED);
 const wide=()=>p.evaluate(()=>document.documentElement.scrollWidth);
 if(PART.includes("A")){
  /* barra */
  if(mob){ok(await vis("#tabC")&&!(await vis("#tabE")),name+": Cartões na barra, Erros fora dela");
    await tap("#tabM");ok(await p.evaluate(()=>!!document.querySelector("#nmPanel #go-erros")&&!!document.querySelector("#nmPanel #go-cartoes")),name+": Erros e Cartões no Menu");
    await p.evaluate(()=>navMenuClose());await p.waitForTimeout(300)}
  else ok(await vis("#tabC")&&await vis("#tabE"),name+": Cartões e Erros visíveis");
  /* Caderno salvo em "revisar" abre em livre, sem o botão Revisar */
  await p.evaluate(()=>setView("notas"));await p.waitForTimeout(150);
  let r=await p.evaluate(()=>({seg:nSeg,rev:!!document.querySelector('#nSegBar [data-n="revisar"]'),cards:!!document.querySelector("#viewNotas .ncards")}));
  ok(r.seg==="livre"&&!r.rev&&!r.cards,name+": Caderno sem Revisar e sem cartões "+JSON.stringify(r));
  /* Hoje */
  await tap("#tabC");
  r=await p.evaluate(()=>({v:view,seg:cSeg,line:(document.getElementById("cdLine")||{}).textContent,go:!!document.getElementById("cdGo"),nw:!!document.getElementById("cdNew"),lc:document.querySelectorAll("#cdLeech .cdlrow").length,cc:document.getElementById("ccount").textContent}));
  ok(r.v==="cartoes"&&r.seg==="hoje"&&/4 para revisar · 1 novo/.test(r.line||"")&&r.go&&r.nw,name+": Hoje com a linha do dia, Revisar e + Novo cartão "+JSON.stringify(r));
  ok(r.lc===1,name+": Cartões que você mais esquece ("+r.lc+")");ok(r.cc==="5",name+": contagem na aba "+r.cc);
  /* fila do dia abre a revisão na aba */
  await p.evaluate(()=>{setView("inicio");qGoStep("cards")});await p.waitForTimeout(300);
  r=await p.evaluate(()=>({v:view,show:!!document.getElementById("cdShow")}));ok(r.v==="cartoes"&&r.show,name+": fila do dia → revisão na aba "+JSON.stringify(r));
  if(!mob){await p.keyboard.press("Space");await p.waitForTimeout(150);ok(await p.evaluate(()=>cdRun&&cdRun.show),name+": espaço mostra a resposta");
    const n0=await p.evaluate(()=>cdRun.done);await p.evaluate(()=>{const b=document.getElementById("cdEdRun");if(b)b.click()});await p.waitForTimeout(150);
    await p.focus("#cde-q");await p.keyboard.press("3");await p.waitForTimeout(150);ok(await p.evaluate(n0=>cdRun.done===n0,n0),name+": '3' dentro do editor não responde");
    await p.evaluate(()=>{cdEd=null;render()});await p.waitForTimeout(100);await p.keyboard.press("3");await p.waitForTimeout(150);ok(await p.evaluate(n0=>cdRun.done===n0+1,n0),name+": tecla 3 responde")}
  await p.evaluate(()=>{cdRun=null;render()});
  /* tela inteira na aba (celular) */
  if(mob){await p.evaluate(()=>{cdRunStart();fullSet("cd",true)});await p.waitForTimeout(200);ok(await p.evaluate(()=>document.documentElement.dataset.pfull==="cd"),name+": tela inteira dos cartões na aba nova");
    await p.evaluate(()=>{fullSet("cd",false);cdRun=null;render()})}
  /* tema aberto → Todos filtrado */
  await p.evaluate(k=>{setView("temas");detTab[k]="notas";openTopic(k);render()},KS.k0);await p.waitForTimeout(300);
  await p.evaluate(()=>{const b=document.querySelector(".cardsblk .cdseeall");if(b){b.scrollIntoView();b.click()}});await p.waitForTimeout(250);
  r=await p.evaluate(()=>({v:view,seg:cSeg,k:cdF.k}));ok(r.v==="cartoes"&&r.seg==="todos"&&r.k===KS.k0,name+": Ver os N cartões → Todos com o tema "+JSON.stringify(r));
  await p.evaluate(()=>{cdF={};setCSeg("hoje")});
  ok(await wide()<=w,name+": sem rolagem lateral");
 }
 if(PART.includes("B")){
  await p.evaluate(()=>{cdNewOpen=false;cdNS={mode:"um",k:"",q:"",a:"",paste:"",prev:null,dup:"",ks:[],tq:"",msg:""};try{localStorage.removeItem("resid-cdlastk")}catch(e){};cdOpen("hoje")});await p.waitForTimeout(150);
  await tap("#cdNew");ok(await vis("#cdNewBox")&&await vis("#cdnT"),name+": + Novo cartão abre o criador com a busca de tema");
  await p.fill("#cdnT",await p.evaluate(()=>ALL[0].t.slice(0,6)));await p.waitForTimeout(100);
  const t0=await p.evaluate(()=>{const b=document.querySelector("#cdnT-0");return b&&b.textContent});await tap("#cdnT-0");
  ok(await p.evaluate(()=>!!document.querySelector("#cdNewBox .cdnkcur")),name+": tema escolhido "+t0);
  const n0=await p.evaluate(()=>cards.length);
  await p.fill("#cdnQ","Qual o **agente** da sífilis?");await p.fill("#cdnA","*Treponema pallidum*");await tap("#cdnMore");
  let r=await p.evaluate(()=>({n:cards.length,q:$("#cdnQ")&&$("#cdnQ").value,k:!!document.querySelector("#cdNewBox .cdnkcur"),x:cards[cards.length-1]}));
  ok(r.n===n0+1&&r.q===""&&r.k&&r.x.kind==="man"&&/<b>agente<\/b>/.test(r.x.q)&&/<i>Treponema/.test(r.x.a),name+": Salvar e criar outro cria, mantém o tema e limpa "+JSON.stringify({n:r.n,q:r.x.q}));
  ok(await p.evaluate(()=>cdOrigin(cards[cards.length-1])==="manual"),name+": origem manual");
  /* repetido */
  await p.fill("#cdnQ","qual é o agente da sífilis");await p.fill("#cdnA","Treponema");await tap("#cdnSave");
  ok(await vis("#cdnDup")&&await p.evaluate(n=>cards.length===n,n0+1),name+": quase igual no mesmo tema avisa e não cria");
  await tap("#cdnDupGo");ok(await p.evaluate(n=>cards.length===n,n0+2),name+": Criar mesmo assim cria");
  /* colar vários */
  await p.evaluate(()=>{cdNewOpen=true;render()});await tap("#cdnM-varios");
  await p.fill("#cdnPaste","Critério de Light :: Proteína e DHL do líquido pleural\nlinha sem separador\nQual o agente da sífilis? :: T. pallidum");await tap("#cdnRead");
  r=await p.evaluate(()=>({chk:[...document.querySelectorAll("#cdnPrev .cdnchk")].map(c=>c.checked),bad:($("#cdnBad")||{}).textContent,btn:$("#cdnMany").textContent}));
  ok(JSON.stringify(r.chk)==="[true,false]"&&/2/.test(r.bad||"")&&r.btn==="Criar 1 cartão",name+": prévia com o repetido desmarcado e a linha ruim listada "+JSON.stringify(r));
  await tap("#cdnMany");ok(await p.evaluate(n=>cards.length===n&&!cdNewOpen,n0+3),name+": Criar 1 cartão");
  /* com o Claude: 2 temas = 2 blocos */
  if(await p.evaluate(()=>!sampleOff)){await p.evaluate(()=>{cdNewOpen=true;cdNS.mode="claude";cdNS.ks=[ALL[0].key,ALL[1].key];render()});await p.waitForTimeout(150);
    ok(await p.evaluate(()=>document.querySelectorAll("#cdNewBox .cdnblk .cardsblk").length===2),name+": Com o Claude mostra um bloco por tema");await p.evaluate(()=>{cdNewOpen=false;cdNS.mode="um";cdNS.ks=[];render()})}
  ok(await wide()<=w,name+": criador sem rolagem lateral");
 }
 if(PART.includes("C")){
  await p.evaluate(SEED=>{eval(SEED);const k1=ALL[1].key;for(let i=0;i<120;i++)cards.push(cdClean({id:"cdx"+i,k:k1,q:"Cartão em massa "+i,a:"r",src:"eu",at:new Date(Date.now()-i*1000).toISOString()}));cdSaveLocal();cdPick=null;cdSel=null;cdF={sort:"due"};cdOpen("todos")},SEED);await p.waitForTimeout(200);
  let r=await p.evaluate(()=>({rows:document.querySelectorAll("#cdList .cdrow").length,more:!!$("#cdMore")}));ok(r.rows===50&&r.more,name+": lista mostra 50 e Mostrar mais "+JSON.stringify(r));
  await tap("#cdMore");ok(await p.evaluate(()=>document.querySelectorAll("#cdList .cdrow").length===100),name+": Mostrar mais traz 100");
  await p.fill("#cdQ","leucoplasia");await p.waitForTimeout(150);
  r=await p.evaluate(()=>[...document.querySelectorAll("#cdList .cdrow")].map(x=>x.textContent));ok(r.length===1&&/leucoplasia/i.test(r[0]),name+": busca filtra "+r.length);
  ok(await p.evaluate(()=>document.activeElement&&document.activeElement.id==="cdQ"),name+": a busca não perde o foco ao filtrar");
  await p.fill("#cdQ","");await p.waitForTimeout(100);
  await p.selectOption("#cdfSt","suspenso");await p.waitForTimeout(150);ok(await p.evaluate(()=>document.querySelectorAll("#cdList .cdrow").length===0&&!!$("#cdEmpty")),name+": filtro Suspensos vazio");
  await p.selectOption("#cdfSt","");await p.waitForTimeout(100);
  const id=await p.evaluate(()=>cards.find(x=>/leucoplasia/.test(x.q)).id);
  await tap(`.cdrow[data-id="${id}"] .cdrq`);
  r=await p.evaluate(()=>({ed:!!$("#cdEdit"),side:!!document.querySelector("#cdSide #cdEdit"),list:!!$("#cdList")&&$("#cdList").offsetParent!==null,back:!!$("#cdBackList")}));
  if(mob)ok(r.ed&&!r.list&&r.back,name+": no celular o editor abre sozinho com Voltar à lista "+JSON.stringify(r));
  else ok(r.ed&&r.side&&r.list,name+": no computador o editor fica ao lado da lista "+JSON.stringify(r));
  await tap("#cdeSu");ok(await p.evaluate(id=>cards.find(x=>x.id===id).su===1&&!cdDue().some(x=>x.id===id),id),name+": Suspender tira da revisão");
  ok(await p.evaluate(()=>/Reativar/.test(($("#cdeSu")||{}).textContent||"")),name+": botão vira Reativar");
  if(mob)await tap("#cdBackList");
  await p.selectOption("#cdfSt","suspenso");await p.waitForTimeout(150);ok(await p.evaluate(()=>document.querySelectorAll("#cdList .cdrow").length===1),name+": filtro Suspensos mostra 1");
  await p.selectOption("#cdfSt","");await p.waitForTimeout(100);
  /* selecionar vários */
  await p.evaluate(()=>{cdPick=null;cdEd=null;render()});await tap("#cdSelOn");
  const two=await p.evaluate(()=>[...document.querySelectorAll("#cdList .cdrow")].slice(0,2).map(x=>x.dataset.id));
  for(const t of two)await tap(`.cdrow[data-id="${t}"] .cdsel`);
  ok(await p.evaluate(()=>/2/.test(($("#cdBulk")||{}).textContent||"")),name+": barra com 2 selecionados");
  await tap("#cdbSu");ok(await p.evaluate(two=>two.every(i=>cards.find(x=>x.id===i).su===1),two),name+": Suspender os 2");
  await tap("#cdbRe");ok(await p.evaluate(two=>two.every(i=>!cards.find(x=>x.id===i).su),two),name+": Reativar os 2");
  await p.evaluate(()=>{cdSel=new Set();render()});await tap(`.cdrow[data-id="${two[0]}"] .cdsel`);await tap("#cdbK");
  await p.fill("#cdbKT",await p.evaluate(()=>ALL[5].t.slice(0,6)));await p.waitForTimeout(100);await tap("#cdbKT-0");
  ok(await p.evaluate(t=>cards.find(x=>x.id===t).k===ALL[5].key,two[0]),name+": Trocar de tema");
  const n0=await p.evaluate(()=>cards.length);await p.evaluate(()=>{cdSel=new Set();render()});await tap(`.cdrow[data-id="${two[1]}"] .cdsel`);await tap("#cdbDel");
  ok(await p.evaluate(n=>cards.length===n-1,n0),name+": Apagar tira o cartão (vai para a lixeira)");
  await p.evaluate(()=>{cdSel=null;render()});
  ok(await wide()<=w,name+": Todos sem rolagem lateral");
 }
 if(PART.includes("D")){
  await p.evaluate(SEED=>{eval(SEED);cards.forEach(x=>delete x.rv);cdPer=30;cdOpen("numeros")},SEED);await p.waitForTimeout(200);
  let r=await p.evaluate(()=>({few:($("#cdnFew")||{}).textContent,ret:!!$("#cdnRet"),fc:document.querySelectorAll("#cdnFc .stb").length}));
  ok(/Poucas revisões registradas ainda \(o histórico começou em \d\d\/\d\d\/\d{4}\)\./.test(r.few||"")&&r.ret,name+": sem histórico, aviso de poucas revisões e o resto aparece "+JSON.stringify(r.few));
  ok(r.fc===30,name+": previsão de 30 dias ("+r.fc+" barras)");
  await p.evaluate(()=>{const T=today(),ago=n=>fromNum(dnum(T)-n),x=cards[0],y=cards[1];
    x.rv=Array.from({length:15},(_,i)=>({d:ago(i),g:i<12?3:1,i:5,r:1,...(i<3?{m:1}:{})}));y.rv=Array.from({length:15},(_,i)=>({d:ago(i+1),g:i<12?2:1,i:9,r:1,...(i<3?{m:1}:{})}));render()});await p.waitForTimeout(150);
  r=await p.evaluate(()=>({few:!!$("#cdnFew"),ret:($("#cdnRet")||{}).textContent,cal:document.querySelectorAll("#cdnCal .cdcd").length,st:($("#cdnStreak")||{}).textContent,day:document.querySelectorAll("#cdnDay .stb").length,area:document.querySelectorAll("#cdnArea .strow").length,mix:($("#cdnMix")||{}).textContent}));
  ok(!r.few&&/80%/.test(r.ret)&&/90%/.test(r.ret)&&/Maduros/.test(r.ret),name+": quanto lembra 80%, com a meta e jovens × maduros "+JSON.stringify(r.ret));
  ok(r.cal>=182&&/16 dias seguidos/.test(r.st||""),name+": calendário de 6 meses e sequência "+JSON.stringify({cal:r.cal,st:r.st}));
  ok(r.day===30&&r.area>=1&&/Maduros/.test(r.mix||""),name+": revisões por dia, por área e situação "+JSON.stringify({day:r.day,area:r.area}));
  await p.evaluate(()=>{cdPer=7;render()});ok(await p.evaluate(()=>document.querySelectorAll("#cdnDay .stb").length===7),name+": período de 7 dias");
  ok(await wide()<=w,name+": Números sem rolagem lateral");
 }
 await ctx.close()}
ok(!errs.length,"sem erros de JavaScript "+errs.join(" | "));await b.close()})();
