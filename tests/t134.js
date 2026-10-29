// t134: Lote 19 — interface. Explicações fixas atrás do "?" (abre no cartão, "Mais na Ajuda"), tema aberto sem quadrinhos e com 3 botões de revisão,
// sem códigos internos ("001"), selo da barra = revisões que cabem hoje, atraso em âmbar, rótulos legíveis, duas colunas em Questões e Caderno no computador,
// letra maior a partir de 1600px e saudação com contorno no modo escuro.
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const seed=fs.readFileSync(__dirname+'/seed10.js','utf8');
const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],note:[1366,900,false],monitor:[1920,1080,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const [name,[w,h,mob]] of Object.entries(DEV)){
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob});
 await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:8765/tests/preview.html');await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
 await p.evaluate(src=>{const module={exports:{}};eval(src);module.exports();commit();dayPlan=makeDayPlan();savePlan();setView("inicio");render()},seed);await p.waitForTimeout(300);
 const W=ms=>p.waitForTimeout(ms||150);
 /* 1. explicações fixas */
 await p.evaluate(()=>{setView("temas");render()});await W(250);
 const H=await p.evaluate(()=>{const c=document.querySelector(".card.today"),x=c.querySelector(".hx");const b=c.querySelector(".hxb");
   const r={has:!!x,hid:x&&x.offsetHeight===0,btn:!!b};if(b){b.click();r.open=x.offsetHeight>0;r.pressed=b.getAttribute("aria-expanded");b.click();r.closed=x.offsetHeight===0}return r});
 ok(H.has&&H.hid&&H.btn&&H.open&&H.pressed==="true"&&H.closed,name+": explicação do Estudar hoje escondida; o ? abre e fecha no cartão "+JSON.stringify(H));
 await p.evaluate(()=>{setView("inicio");render()});await W(250);
 const Q=await p.evaluate(()=>{const c=document.querySelector("#iQueue .card")||document.querySelector("#iQueue>*"),b=c&&c.querySelector(".hlpb");if(!b)return {};b.click();const m=c.querySelector(".hxmore.hxshow button");return {how:!!c.querySelector(".hx.hxshow:not(.hxmore)"),more:!!m,view}});
 ok(Q.how&&Q.more&&Q.view==="inicio",name+": ? da Fila do dia mostra a explicação e o Mais na Ajuda "+JSON.stringify(Q));
 await p.evaluate(()=>document.querySelector("#iQueue .hxmore.hxshow button").click());await W();ok(await p.evaluate(()=>view==="help"),name+": Mais na Ajuda abre a Ajuda");
 /* 2 e 5. tema aberto */
 await p.evaluate(()=>{const k=ALL.map(i=>i.key).find(k=>isDue(get(k)));window.__k=k;detTab[k]="estudo";setView("temas");openTopic(k)});await W(300);
 const T=await p.evaluate(()=>{const d=document.querySelector(`#t-${__k} .detail`),r=d.querySelector(".drev"),cs=getComputedStyle(r);
   return {dsum:!!d.querySelector(".dsum,.dchip"),btns:r.querySelectorAll(".revg button").length,old:/lembrei bem|tive dificuldade/i.test(r.textContent),border:cs.borderTopWidth+" "+cs.borderLeftWidth+" "+cs.backgroundColor,num:document.querySelector(`#t-${__k}>.item .num`).textContent}});
 ok(!T.dsum&&T.btns===3&&!T.old,name+": tema aberto sem quadrinhos e revisão com Esqueci/Difícil/Lembrei "+JSON.stringify(T));
 ok(/^(0px|1px) 0px rgba\(0, 0, 0, 0\)$/.test(T.border),name+": bloco Revisão sem caixa própria ("+T.border+")");
 /* 7. sem códigos */
 ok(T.num==="",name+": sem número do tema na lista");
 ok(await p.evaluate(()=>{setView("inicio");render();return ![...document.querySelectorAll(".pa,.qmeta,.nloc")].some(x=>/\b\d{3}\b/.test(x.textContent))}),name+": sem códigos internos no plano e nas listas");
 /* 4. menos vermelho */
 const C=await p.evaluate(()=>{const n=dueCount(),fit=Math.min(n,qCounts().revs),t=$("#rcount").textContent;const s=document.createElement("span");s.className="late";document.body.appendChild(s);const lc=getComputedStyle(s).color;s.remove();
   const v=getComputedStyle(document.documentElement).getPropertyValue("--late").trim();return {n,fit,t,lc,v}});
 ok(C.t===(C.fit?String(C.fit):"")&&C.fit<=C.n,name+": selo do Início = revisões que cabem hoje "+JSON.stringify(C));
 ok(/^rgb\(164, 109, 18\)$/.test(C.lc),name+": atraso em âmbar ("+C.lc+")");
 /* 3. rótulos */
 const L=await p.evaluate(()=>{const s=document.querySelector(".kl,.glabel,.plabel");if(!s)return null;const c=getComputedStyle(s);return {f:parseFloat(c.fontSize),ls:parseFloat(c.letterSpacing)/parseFloat(c.fontSize),col:c.color}});
 ok(L&&L.f>=12&&L.ls<=.03&&L.col!=="rgb(92, 99, 117)",name+": rótulos legíveis "+JSON.stringify(L));
 /* 6. telas grandes */
 if(!mob){await p.evaluate(()=>{setView("quest");render()});await W(300);
  const G=await p.evaluate(()=>{const v=$("#viewQuest"),a=v.querySelector(".dash.qs-res").getBoundingClientRect(),x=$("#qExtra").getBoundingClientRect();return {disp:getComputedStyle(v).display,w:v.getBoundingClientRect().width,side:x.left>a.right-1,top:Math.abs(x.top-a.top)<2}});
  ok(G.disp==="grid"&&G.side&&G.top&&G.w>1000,name+": Questões em duas colunas "+JSON.stringify(G));
  await p.evaluate(()=>{setView("notas");render()});await W(300);
  const N=await p.evaluate(()=>{const s=$("#nSide"),f=$("#nFreeBox").getBoundingClientRect(),r=s.getBoundingClientRect();return {in:!!s.querySelector("#nRevBox")&&!!s.querySelector("#nPegBox"),right:r.left>f.right-1}});
  ok(N.in&&N.right,name+": Caderno com coluna da direita (Cartões, Pegadinhas, PDF) "+JSON.stringify(N));
  const fs=await p.evaluate(()=>parseFloat(getComputedStyle(document.documentElement).fontSize));ok(name==="monitor"?fs>16:fs===16,name+": letra base "+fs+"px")}
 else{await p.evaluate(()=>{setView("notas");nSeg="revisar";render()});await W(200);ok(await p.evaluate(()=>getComputedStyle($("#nSide")).display==="contents"&&$("#nRevBox").offsetHeight>0),name+": no celular o Caderno continua em partes")}
 /* 8. saudação no escuro */
 await p.evaluate(()=>{ui.prefs.theme="dark";applyUI();setView("inicio");render()});await W(250);
 ok(await p.evaluate(()=>/inset/.test(getComputedStyle($("#iHero")).boxShadow)),name+": saudação com contorno dourado no modo escuro");
 await ctx.close()}
ok(!errs.length,"sem erros de JavaScript "+errs.join(" | "));await b.close()})();
