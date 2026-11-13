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
 await ctx.close()}
ok(!errs.length,"sem erros de JavaScript "+errs.join(" | "));await b.close()})();
