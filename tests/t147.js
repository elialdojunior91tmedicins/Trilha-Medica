// t147 (Banco de questões, B2): a aba Questões vira o banco (partes no topo), filtros, presets, contadores, lista com histórico,
// Resolver estas (modo estudo) e Simulado com estas (modo prova), favoritas, Teimosas, tirar do banco, filtros salvos, figuras do material e o celular.
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const SEED=`(async()=>{await bankBootP;const Q=(e,a,c,extra)=>({enunciado:e,alternativas:a.map((t,i)=>({letra:"ABCD"[i],texto:t,porque:i?"":""})),correta:c,comentario:"Comentário: "+e.slice(0,20),conceito:"",...(extra||{})});
  const q1=Q("Mulher de 30 anos com TSH baixo e T4 livre alto. Qual o diagnóstico?",["Hipotireoidismo","Hipertireoidismo","Eutireoidismo","Tireoidite subaguda"],"B");
  const q2=Q("Criança com febre alta por 3 dias e exantema depois que a febre some. Agente?",["HHV-6","Sarampo","Rubéola","Parvovírus"],"A");
  exams=[exClean({id:"exA",name:"ENARE 2024",banca:"ENARE",ano:"2024",at:"2026-10-01T10:00:00.000Z",qs:[{n:1,k:"CM-1",g:"b",q:q1},{n:2,k:"PED-1",g:"b",q:q2}]})];
  exProg=[exPClean({id:"exA",a:{0:{l:"B",d:"2026-10-20",s:50}}})];
  bankFeedAll();
  const G=i=>Q("Gerada "+i+": hipertenso com PA 150x95 sem lesão de órgão-alvo. Conduta?",["Conduta A "+i,"Conduta B "+i,"Conduta C "+i,"Conduta D "+i],"B");
  for(let i=1;i<=4;i++)bankAdd(G(i),"gerada","CM-1");
  const T=Q("Teimosa: dor torácica com supra em DII, DIII e aVF. Artéria?",["Descendente anterior","Coronária direita","Circunflexa","Tronco"],"B");
  bankAdd(T,"simulado","CM-1");await new Promise(r=>setTimeout(r,30));await bankFlush();
  const bt=bank.find(x=>x.q.enunciado.startsWith("Teimosa"));["2026-10-01","2026-10-05","2026-10-09"].forEach(d=>bhAdd(bt.id,{d,l:"A",ok:0,s:20,src:"sim"}));await bankFlush();render()})()`;
(async()=>{const b=await chromium.launch();const errs=[];
 const ctx=await b.newContext({viewport:{width:1366,height:900}});
 await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__qLegacy=false;window.__packs=1;window.__mock({},2);`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('http://localhost:8765/tests/preview.html');
 await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn&&bankBootP,null,{polling:100,timeout:15000});await p.evaluate(()=>bankBootP);
 /* banco vazio */
 await p.evaluate(()=>{localStorage.removeItem("resid-qpart");qPart="banco";setView("quest")});await p.waitForTimeout(150);
 ok(await p.$("#bkImp")&&await p.$("#bkGen")&&await p.isVisible("text=Seu banco começa aqui"),"banco vazio: cartão \"Seu banco começa aqui\" com importar e gerar");
 await p.evaluate(SEED);await p.waitForTimeout(250);
 /* partes */
 const P1=await p.evaluate(()=>({part:$("#viewQuest").dataset.qpart,nav:[...document.querySelectorAll(".qpnav button")].map(b=>b.textContent.trim()),bk:!!$("#bkBox .bkcard")&&$("#bkBox").offsetParent!==null,sim:$(".qsim").offsetParent!==null,dash:$(".dash.qs-res").offsetParent!==null,seg:$("#qSegBar").offsetParent!==null}));
 ok(P1.part==="banco"&&P1.nav.join("|")==="Banco|Simulado misto|Refazer|Provas na íntegra|Resumo"&&P1.bk&&!P1.sim&&!P1.dash&&!P1.seg,"a aba Questões abre no Banco, com as 5 partes no topo "+JSON.stringify(P1));
 await p.click("#qp-sim");await p.waitForTimeout(100);
 ok(await p.evaluate(()=>$(".qsim").offsetParent!==null&&$(".qredo").offsetParent===null&&$("#bkBox").offsetParent===null),"Simulado misto mostra só o simulado");
 await p.click("#qp-redo");await p.waitForTimeout(100);ok(await p.evaluate(()=>$(".qredo").offsetParent!==null&&$(".qsim").offsetParent===null),"Refazer mostra só o Refazer");
 await p.click("#qp-provas");await p.waitForTimeout(100);ok(await p.evaluate(()=>$(".qexam").offsetParent!==null&&$(".qredo").offsetParent===null),"Provas na íntegra");
 await p.click("#qp-resumo");await p.waitForTimeout(100);ok(await p.evaluate(()=>$(".dash.qs-res").offsetParent!==null&&$("#qFind")&&$("#qFind").offsetParent!==null&&$("#bkBox").offsetParent===null),"Resumo: gráficos, meta, registro e a lista dos temas (o que havia na aba)");
 ok(await p.evaluate(()=>{provaSimGo({id:"zz"});return qPart==="sim"}),"atalhos de outras abas abrem a parte certa (simulado)");
 await p.evaluate(()=>{setView("quest");qGo("banco")});await p.waitForTimeout(150);
 /* resumo, contadores, lista */
 const L1=await p.evaluate(()=>({sum:$(".bksum").textContent,c:["nr","r","ok","no"].map(v=>$("#bkC-"+v+" b").textContent),rows:document.querySelectorAll(".bklist .bkrow").length,side:!!$(".bkside"),
   tei:[...document.querySelectorAll(".bkrow")].some(r=>r.textContent.includes("Teimosa")&&r.textContent.includes("errou 3")),ined:document.querySelectorAll(".bkst.st-nr").length}));
 ok(L1.sum.startsWith("7 questões")&&L1.sum.includes("1 banca")&&L1.sum.includes("2024"),"resumo do banco: questões, bancas e anos ("+L1.sum+")");
 ok(L1.c.join()==="5,2,1 · 50%,1"&&L1.rows===7,"4 contadores (não resolvidas, resolvidas, acertadas com %, erradas) "+L1.c.join("|"));
 ok(L1.side,"no computador os filtros ficam numa coluna à esquerda");
 ok(L1.tei&&L1.ined===5,"lista: inédita tracejada, histórico à direita e selo Teimosa");
 await p.click("#bkC-nr");await p.waitForTimeout(80);ok(await p.evaluate(()=>document.querySelectorAll(".bklist .bkrow").length===5&&$("#bkN").textContent.startsWith("5 questões")),"contador filtra (Não resolvidas)");
 await p.click("#bkC-nr");await p.click("#bkP-teim");await p.waitForTimeout(80);
 ok(await p.evaluate(()=>document.querySelectorAll(".bklist .bkrow").length===1&&bkF.teim&&bkF.pre==="teim"),"preset Teimosas");
 await p.click("#bkP-teim");await p.waitForTimeout(60);
 /* busca no enunciado e no comentário, sem acento */
 await p.fill("#bkQ","tireoidite");await p.waitForTimeout(450);ok(await p.evaluate(()=>document.querySelectorAll(".bklist .bkrow").length===1&&document.activeElement.id==="bkQ"),"busca nas alternativas/enunciado sem perder o campo");
 await p.fill("#bkQ","Comentario: Crianca");await p.waitForTimeout(450);ok(await p.evaluate(()=>document.querySelectorAll(".bklist .bkrow").length===1),"busca no comentário, sem diferenciar acentos");
 await p.fill("#bkQ","");await p.waitForTimeout(450);
 /* Onde: área › especialidade › tema; origem; banca */
 await p.selectOption("#bkArea","CM");await p.waitForTimeout(60);
 const W=await p.evaluate(()=>({n:document.querySelectorAll(".bklist .bkrow").length,sp:!$("#bkSp").disabled,tema:[...$("#bkTema").options].map(o=>o.textContent).filter(t=>/\(\d+\)/.test(t)).length}));
 ok(W.n===6&&W.sp&&W.tema>=1,"Onde: grande área filtra e libera especialidade e tema "+JSON.stringify(W));
 await p.selectOption("#bkArea","all");await p.click("#bkO-gerada");await p.waitForTimeout(60);
 ok(await p.evaluate(()=>document.querySelectorAll(".bklist .bkrow").length===4&&document.querySelectorAll(".tfact .tfpill").length===1),"origem (geradas) e a etiqueta do filtro ligado com ×");
 await p.click(".tfact .tfpill");await p.click("#bkban-0");await p.waitForTimeout(60);ok(await p.evaluate(()=>document.querySelectorAll(".bklist .bkrow").length===2),"banca (ENARE)");
 /* salvar filtro */
 await p.click("#bkSave");await p.fill("#bkSaveN","Só ENARE");await p.click("#bkSaveOk");await p.waitForTimeout(80);
 const SV=await p.evaluate(()=>{const c=ui.prefs.bkps;const s=uiSanitize(JSON.parse(JSON.stringify(ui)));return {n:c&&c.length,f:c&&c[0].f.ban.join(),keep:s.prefs.bkps&&s.prefs.bkps[0].n,chip:!!$("#bkP-"+c[0].id)}});
 ok(SV.n===1&&SV.f==="ENARE"&&SV.keep==="Só ENARE"&&SV.chip,"+ Salvar filtro guarda o filtro (vale nos outros aparelhos pelas preferências) "+JSON.stringify(SV));
 await p.click("#bkClear");await p.evaluate(()=>{const id=ui.prefs.bkps[0].id;bkPreset(id);render()});ok(await p.evaluate(()=>document.querySelectorAll(".bklist .bkrow").length===2),"o filtro salvo vira um atalho");
 await p.evaluate(()=>{bkF=bkFDef();render()});
 /* abrir, favoritar, tirar do banco */
 const id1=await p.evaluate(()=>bank.find(x=>x.q.enunciado.startsWith("Gerada 1")).id);
 await p.click("#bkr-"+id1);await p.waitForTimeout(60);ok(await p.evaluate(id=>!!$("#bkGo1-"+id)&&!!$("#bkFav-"+id),id1),"tocar na linha abre a questão (sem o gabarito) com Resolver, Favoritar e Tirar");
 await p.click("#bkFav-"+id1);await p.waitForTimeout(60);
 ok(await p.evaluate(id=>bankById.get(id).fav===1&&bankDirty.has(id)||bankById.get(id).fav===1,id1)&&await p.evaluate(()=>$("#bkP-fav").textContent.includes("1")),"favoritar (e o atalho Favoritas conta)");
 await p.click("#bkDel-"+id1);await p.click("#bkDel-"+id1);await p.waitForTimeout(80);
 const DL=await p.evaluate(async id=>{await bankFlush();const x=bankById.get(id);const s=await bankStore.get();const r=s.docs.map(d=>d.data()).find(v=>v.id===id);return {del:x.del,rows:document.querySelectorAll(".bklist .bkrow").length,acc:r&&r.del,toast:!!$("#trToast")}},id1);
 ok(DL.del===1&&DL.rows===6&&DL.acc===1&&DL.toast,"tirar do banco (dois toques): some da lista, fica marcada na conta para os outros aparelhos, com Desfazer "+JSON.stringify(DL));
 ok(await p.evaluate(id=>{bankFeedAll();return new Promise(r=>setTimeout(()=>r(bankById.get(id).del===1),1700))},id1),"a carga não traz de volta uma questão tirada");
 /* resolver (modo estudo): a 1ª resposta conta no tema; a de novo só na meta semanal */
 const id2=await p.evaluate(()=>bank.find(x=>x.q.enunciado.startsWith("Gerada 2")).id);
 const st0=await p.evaluate(()=>({qd:JSON.stringify(get("CM-1").qd||{}),rq:(hist[today()]||{}).rq||0,rd:redo.length}));
 await p.evaluate(id=>bkStart([id],"e"),id2);await p.waitForTimeout(80);
 ok(await p.evaluate(()=>!!$("#bka-A")&&$(".bkq .qstem").textContent.startsWith("Gerada 2")&&!$(".bkq .verdict")),"Resolver: a questão sem o gabarito");
 await p.click("#bka-A");await p.waitForTimeout(80);
 const A1=await p.evaluate(id=>{const H=bankHById.get(id).a;return {v:$(".bkq .verdict").textContent,h:H.map(y=>y.src+y.l+y.ok+(y.c||0)).join(),s:H[0].s>=1,qd:JSON.stringify(get("CM-1").qd||{}),rd:redo.length,cad:!!document.querySelector(".bkq .ecad")}},id2);
 ok(A1.v.startsWith("Incorreta")&&A1.h==="bankA01"&&A1.s,"modo estudo: gabarito na hora, resposta e tempo no histórico "+JSON.stringify(A1));
 ok(A1.qd!==st0.qd&&A1.rd===st0.rd+1&&A1.cad,"inédita: conta no acerto do tema e a errada vai para o Refazer (e oferece o caderno de erros)");
 await p.click("#bkNext");await p.waitForTimeout(60);ok(await p.evaluate(()=>bkRun&&bkRun.done&&!!$("#bkBack")&&!!$("#bkAgainWr")),"resultado com Voltar ao banco e Refazer as erradas");
 await p.click("#bkAgainWr");await p.click("#bka-B");await p.waitForTimeout(60);
 const A2=await p.evaluate(id=>({h:bankHById.get(id).a.map(y=>y.src+y.l+y.ok+(y.c||0)).join(),rq:(hist[today()]||{}).rq||0,line:($(".bkhline")||{}).textContent||""}),id2);
 ok(A2.h==="bankA01,bankB10"&&A2.rq===st0.rq+1&&A2.line.includes("2 vezes"),"de novo: fica no histórico, conta só na meta semanal e mostra \"Você já fez esta questão 2 vezes\" "+JSON.stringify(A2));
 /* questão de prova na íntegra guardada: conta na própria prova, não no banco */
 const pv=await p.evaluate(()=>bank.find(x=>x.ex==="exA"&&x.ei===1).id);
 await p.evaluate(id=>bkStart([id],"e"),pv);await p.click("#bka-A");await p.waitForTimeout(60);
 ok(await p.evaluate(id=>{const y=bankHById.get(id).a.slice(-1)[0];return y.src==="bank"&&!y.c&&!bkRun.cnt[0]},pv),"questão de prova na íntegra guardada: fica no histórico mas não conta de novo no tema");
 await p.evaluate(()=>{bkRun=null;render()});
 /* simulado com estas (modo prova) */
 await p.click("#bkSimB");await p.waitForTimeout(60);
 const SO=await p.evaluate(()=>({opts:[...document.querySelectorAll(".bksim .seg button")].map(b=>b.textContent),go:$("#bkSimGo").textContent}));
 ok(SO.opts.length>=1&&/Começar · \d+ questões · ≈ \d+ min/.test(SO.go),"Simulado com estas: quantas questões e o tempo previsto "+JSON.stringify(SO));
 await p.click(".bksim .seg button:last-child");await p.click("#bkSimGo");await p.waitForTimeout(80);
 const PM=await p.evaluate(()=>({mode:bkRun.mode,n:bkRun.ids.length,map:document.querySelectorAll("#bkCard .exmap button, .bkcard .exmap button").length,clock:!!$("#bkClock"),first:bank.find(x=>x.id===bkRun.ids[0])}));
 ok(PM.mode==="p"&&PM.n===6&&PM.map===6&&PM.clock,"modo prova: mapa das questões e relógio "+JSON.stringify({...PM,first:0}));
 const hb=await p.evaluate(()=>bankH.reduce((s,h)=>s+h.a.length,0));
 await p.click("#bka-A");await p.waitForTimeout(40);ok(await p.evaluate(()=>!$(".bkq .verdict")&&$("#bka-A").classList.contains("pick")&&$("#bkm-0").classList.contains("done")),"modo prova: marca sem mostrar o gabarito");
 await p.click("#bkNextP");await p.waitForFunction(()=>bkRun.i===1&&document.querySelector(".bkq"));await p.click("#bka-C");await p.click("#bkm-0");await p.click("#bka-A");await p.waitForTimeout(40);
 ok(await p.evaluate(()=>bkRun.i===0&&!bkRun.ans[0]),"tocar de novo deixa em branco; dá para voltar pelo mapa");
 await p.click("#bka-B");await p.waitForTimeout(40);ok(await p.evaluate(h=>bankH.reduce((s,x)=>s+x.a.length,0)===h,hb),"nada é gravado antes de entregar");
 await p.click("#bkFinish");await p.waitForFunction(()=>bkRun&&bkRun.done,null,{timeout:5000}).catch(()=>{});await p.waitForTimeout(80);
 const FN=await p.evaluate(h=>({done:bkRun.done,add:bankH.reduce((s,x)=>s+x.a.length,0)-h,kpi:$(".bkplay .kpis").textContent,list:document.querySelectorAll(".bkres li").length,blank:$(".bkplay .kpis").textContent.includes("em branco")}),hb);
 ok(FN.done&&FN.add===2&&FN.list===6&&FN.blank,"entregar: resultado com acerto, tempo e as em branco; só as respondidas vão ao histórico "+JSON.stringify(FN));
 await p.click("#bkrv-0");await p.waitForTimeout(40);ok(await p.evaluate(()=>!!$(".bkres .bkq .verdict")),"rever cada questão depois de entregar");
 await p.click("#bkBack");await p.waitForTimeout(40);
 /* figuras do material */
 const FG=await p.evaluate(async()=>{const cv=document.createElement("canvas");cv.width=300;cv.height=200;const g=cv.getContext("2d");g.fillStyle="#c33";g.fillRect(0,0,300,200);const blob=await new Promise(r=>cv.toBlob(r,"image/png"));
   const q={enunciado:"Com figura: ECG mostrando ritmo irregular sem onda P. Diagnóstico?",alternativas:[{letra:"A",texto:"Fibrilação atrial"},{letra:"B",texto:"Flutter"}],correta:"A",mat:true,fg:{no:1,name:"aula.pdf",page:3}};
   bankAdd(q,"gerada","CM-1",{figs:[{no:1,blob}]});await new Promise(r=>setTimeout(r,800));const x=bank.find(y=>y.q.enunciado.startsWith("Com figura"));
   /* figura que só ficou no Refazer (cópia pequena) */
   const q2={enunciado:"Sem figura guardada: raio-X com hipertransparência. Diagnóstico?",alternativas:[{letra:"A",texto:"Pneumotórax"},{letra:"B",texto:"Derrame"}],correta:"A",mat:true,fg:{no:2,name:"aula.pdf",page:4}};
   bankAdd(q2,"gerada","CM-1");await new Promise(r=>setTimeout(r,50));const y0=bank.find(y=>y.q.enunciado.startsWith("Sem figura"));const nf0=y0.nf;
   redo.push(rdClean({id:"rdF",k:"CM-1",d:today(),fd:today(),n:1,q:q2,src:"gen",img:cv.toDataURL("image/jpeg",.5)}));bankFeedAll();await new Promise(r=>setTimeout(r,1700));
   exfPurge();await new Promise(r=>setTimeout(r,100));
   return {fm:x.fm,nf:x.nf,fig:!!exFigs["bk_"+x.id],nf0,rec:y0.fm===1&&!y0.nf&&!!exFigs["bk_"+y0.id],stay:!!exFigs["bk_"+x.id]}});
 ok(FG.fm===1&&!FG.nf&&FG.fig,"figura do material guardada com a questão (como as das provas) "+JSON.stringify(FG));
 ok(FG.nf0===1&&FG.rec,"figura antiga que ficou só no Refazer volta para a questão do banco");
 ok(FG.stay,"a limpeza das figuras das provas não apaga as do banco");
 await p.evaluate(()=>{bkF=bkFDef();bkF.q="Com figura";render()});await p.waitForTimeout(80);
 const fid=await p.evaluate(()=>bank.find(y=>y.q.enunciado.startsWith("Com figura")).id);await p.click("#bkr-"+fid);await p.waitForTimeout(80);
 ok(await p.evaluate(()=>!!document.querySelector(".bkopen .qfig img")&&document.querySelector(".bkrow .bkb.img")),"a figura aparece na questão (selo Imagem na lista)");
 /* backup: favorita e tirada das provas também vão */
 const BK=await p.evaluate(()=>{const x=bank.find(y=>y.ex==="exA"&&y.ei===0);x.fav=1;const B=buildBackup().data.bank;return {fav:B.some(y=>y.id===x.id&&y.fav),del:B.some(y=>y.del)}});
 ok(BK.fav&&BK.del,"backup leva as marcas de favorita e de tirada também nas questões das provas");
 /* partes guardadas */
 await p.evaluate(()=>qGo("redo"));await p.reload();await p.waitForFunction(()=>typeof bankOn!=="undefined"&&bankOn,null,{timeout:15000});
 ok(await p.evaluate(()=>qPart==="redo"),"a parte aberta fica lembrada");
 await ctx.close();
 /* celular */
 const c2=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await c2.route(/googleapis|gstatic/,r=>r.abort());
 await c2.addInitScript(mock+`;window.__qLegacy=false;window.__noSheet=false;window.__mock({},2);`);const p2=await c2.newPage();p2.on('pageerror',e=>errs.push("cel:"+e.message));
 await p2.goto('http://localhost:8765/tests/preview.html');await p2.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn&&bankBootP,null,{timeout:15000});
 await p2.evaluate(()=>{qPart="banco";setView("quest")});await p2.evaluate(SEED);await p2.waitForTimeout(250);
 const M1=await p2.evaluate(()=>({btn:$("#qpBtn").textContent.trim(),nav:!!$(".qpnav"),side:!!$(".bkside"),fb:!!$("#bkFBtn"),cnt:getComputedStyle($(".bkcnt")).gridTemplateColumns.split(" ").length}));
 ok(M1.btn.startsWith("▤")&&M1.btn.includes("Banco")&&!M1.nav&&!M1.side&&M1.fb&&M1.cnt===2,"celular: seletor \"Banco ▾\", botão Filtros e contadores 2×2 "+JSON.stringify(M1));
 await p2.tap("#qpBtn");await p2.waitForTimeout(60);
 ok(await p2.evaluate(()=>document.querySelectorAll(".qpsheet .qpopt").length===5&&$("#qpo-redo").textContent.includes("Refazer")),"a folha de baixo mostra as 5 partes com uma linha de explicação");
 await p2.tap("#qpo-redo");await p2.waitForTimeout(80);ok(await p2.evaluate(()=>qPart==="redo"&&!$(".qpsheet")&&$(".qredo").offsetParent!==null),"escolher Refazer fecha a folha e abre o Refazer");
 await p2.evaluate(()=>qGo("banco"));await p2.tap("#bkFBtn");await p2.waitForTimeout(60);
 ok(await p2.evaluate(()=>!!$("#bkFPanel.tfsheet")&&!!$("#bkArea")&&$("#bkFPanel .tfdone").textContent.includes("Ver 7")),"filtros na folha de baixo com \"Ver N questões\"");
 await p2.tap("#bkFPanel .tfdone");await p2.waitForTimeout(60);
 const ST=await p2.evaluate(()=>{const a=$(".bkacts"),r=a.getBoundingClientRect();return {pos:getComputedStyle(a).position,go:$("#bkGo").textContent}});
 ok(ST.pos==="sticky"&&ST.go==="Resolver estas 7 questões","\"Resolver estas N questões\" fica preso acima da barra de baixo "+JSON.stringify(ST));
 await p2.evaluate(()=>{window.scrollTo(0,0)});
 ok(await p2.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),"sem rolagem para o lado no celular");
 /* filtros em grupos recolhíveis */
 await p2.tap("#bkFBtn");await p2.waitForTimeout(60);
 const FGR=await p2.evaluate(()=>({g:[...document.querySelectorAll("#bkFPanel .bkfg .bkfgt")].map(x=>x.textContent),sw:document.querySelectorAll("#bkFPanel .bkfs[role=switch]").length,radio:document.querySelectorAll("#bkFPanel .bkfo[role=radio]").length}));
 ok(FGR.g.slice(0,3).join()==="Situação,Onde,Origem"&&FGR.sw>=2&&FGR.radio===5,"filtros em grupos: Situação em linhas, Onde, Origem, etiquetas e chaves em Mais "+JSON.stringify(FGR));
 await p2.tap("#bkFg-st");await p2.waitForTimeout(60);
 ok(await p2.evaluate(()=>$("#bkFg-st").getAttribute("aria-expanded")==="false"&&!$("#bkS-nr")&&localStorage.getItem("resid-bkfg")==="st"),"recolher um grupo (fica lembrado)");
 await p2.tap("#bkFg-st");await p2.tap("#bkS-no");await p2.waitForTimeout(60);
 ok(await p2.evaluate(()=>bkF.st==="no"&&$("#bkFg-st .bkfgs").textContent==="Erradas"&&$("#bkFg-st .bkfgs").classList.contains("on")),"o título do grupo resume o que está ligado");
 await p2.tap("#bkM-teim");await p2.waitForTimeout(60);ok(await p2.evaluate(()=>bkF.teim&&$("#bkM-teim").getAttribute("aria-checked")==="true"),"chave liga/desliga em Mais");
 await p2.evaluate(()=>{bkF=bkFDef();bkFPanel=false;render()});
 /* tela inteira no celular, em pé */
 await p2.tap("#bkGo");await p2.waitForTimeout(80);await p2.tap("#bkFullB");await p2.waitForTimeout(120);
 const FS=await p2.evaluate(()=>{const c=document.querySelector(".bkcard.bkrun").getBoundingClientRect(),nav=document.querySelector(".appnav");return {on:document.documentElement.dataset.bkfull,top:Math.round(c.top),h:Math.round(c.height),vh:innerHeight,nav:getComputedStyle(nav).visibility,menu:!!$("#bkFMenu"),exit:!!$("#bkFExit"),p:$(".bkfp").textContent}});
 ok(FS.on==="1"&&FS.top===0&&FS.h===FS.vh&&FS.nav==="hidden"&&FS.menu&&FS.exit&&FS.p==="Questão 1 de 7","tela inteira em pé: ocupa a tela, esconde a barra de baixo, com ≡ Menu e Sair "+JSON.stringify(FS));
 await p2.tap("#bka-A");await p2.waitForTimeout(60);
 ok(await p2.evaluate(()=>{const b=document.querySelector(".bkplay>.btns").getBoundingClientRect();return getComputedStyle(document.querySelector(".bkplay>.btns")).position==="sticky"&&b.bottom<=innerHeight+1}),"Próxima fica sempre ao alcance, embaixo");
 await p2.tap("#bkFMenu");await p2.waitForTimeout(350);
 ok(await p2.evaluate(()=>!$("#navMenu").hidden&&+getComputedStyle($("#navMenu")).zIndex>+getComputedStyle(document.querySelector(".bkcard.bkrun")).zIndex),"≡ Menu abre o menu do app por cima da tela inteira");
 await p2.evaluate(()=>navMenuClose());await p2.waitForTimeout(350);
 await p2.evaluate(()=>{setView("temas")});await p2.waitForTimeout(80);ok(await p2.evaluate(()=>!document.documentElement.dataset.bkfull&&$("#viewTemas").offsetParent!==null),"ir para outra aba pelo menu sai da tela inteira");
 await p2.evaluate(()=>{setView("quest")});await p2.waitForTimeout(80);ok(await p2.evaluate(()=>document.documentElement.dataset.bkfull==="1"&&bkRun&&bkRun.ans[0]),"voltar ao banco continua de onde parou, em tela inteira");
 /* deitado */
 await p2.setViewportSize({width:844,height:390});await p2.waitForTimeout(250);
 const LS=await p2.evaluate(()=>{const l=document.querySelector(".bkq .bkql").getBoundingClientRect(),a=document.querySelector(".bkq .alts").getBoundingClientRect();return {lay:document.documentElement.dataset.layout,full:document.documentElement.dataset.bkfull,side:a.left>l.right-2,lw:Math.round(l.width),sw:document.documentElement.scrollWidth<=innerWidth+1}});
 ok(LS.lay==="phone"&&LS.full==="1"&&LS.side&&LS.sw,"tela inteira deitado: enunciado à esquerda e alternativas à direita "+JSON.stringify(LS));
 await p2.tap("#bkFExit");await p2.waitForTimeout(80);ok(await p2.evaluate(()=>!document.documentElement.dataset.bkfull&&!!$("#bkFullB")&&localStorage.getItem("resid-bkfull")===null),"Sair volta para a tela normal (e lembra a escolha)");
 await p2.setViewportSize({width:390,height:844});await p2.evaluate(()=>{bkRun=null;render()});
 await c2.close();
 /* testes antigos: a aba como era */
 const c3=await b.newContext({viewport:{width:1366,height:900}});await c3.route(/googleapis|gstatic/,r=>r.abort());await c3.addInitScript(mock+`;window.__mock({},2);`);
 const p3=await c3.newPage();p3.on('pageerror',e=>errs.push("legado:"+e.message));await p3.goto('http://localhost:8765/tests/preview.html');await p3.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{timeout:15000});
 await p3.evaluate(()=>setView("quest"));await p3.waitForTimeout(100);
 ok(await p3.evaluate(()=>$("#viewQuest").dataset.qpart==="all"&&$(".qsim").offsetParent!==null&&$(".dash.qs-res").offsetParent!==null&&$("#qPartBar").offsetParent===null),"modo dos testes antigos: tudo junto, como antes");
 await c3.close();
 ok(!errs.length,"sem erros de JavaScript "+errs.join(" | "));await b.close()})();
