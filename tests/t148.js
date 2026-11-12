// t148 (Banco de questões, B3): uma agenda só com o Refazer, sorteio inteligente, Simulado misto › Do banco, Fixar com questões do banco,
// questão irmã, "Diretriz mudou" e a tela inteira do celular (em pé e deitado) no Simulado misto, Refazer e Provas na íntegra.
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const SEED=`(async()=>{await bankBootP;const Q=(e,a,c,co)=>({enunciado:e,alternativas:a.map((t,i)=>({letra:"ABCD"[i],texto:t})),correta:c,comentario:co||"",conceito:co||""});
  const add=(k,i,co)=>bankAdd(Q("Tema "+k+" questão "+i+": qual a conduta neste caso clínico de número "+i+"?",["Conduta A"+k+i,"Conduta B"+k+i,"Conduta C"+k+i,"Conduta D"+k+i],"B",co),"gerada",k);
  for(let i=1;i<=4;i++)add("CM-1",i,i<=3?"Hipertensão resistente exige espironolactona como quarta droga":"Diurético tiazídico em idoso hipertenso");
  for(let i=1;i<=4;i++)add("PED-1",i);for(let i=1;i<=4;i++)add("GO-1",i);
  await new Promise(r=>setTimeout(r,40));await bankFlush();render()})()`;
(async()=>{const b=await chromium.launch();const errs=[];
 const ctx=await b.newContext({viewport:{width:1366,height:900}});
 await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__qLegacy=false;window.__mock({},2);`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('http://localhost:8765/tests/preview.html');
 await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn&&bankBootP,null,{polling:100,timeout:15000});await p.evaluate(()=>bankBootP);
 await p.evaluate(()=>{qPart="banco";setView("quest")});await p.evaluate(SEED);await p.waitForTimeout(200);
 /* 1. uma agenda só */
 const R1=await p.evaluate(()=>{const x=bank.find(y=>y.q.enunciado.startsWith("Tema CM-1 questão 1:"));rdAdd("CM-1",JSON.parse(JSON.stringify(x.q)),"gen");const r=redo[redo.length-1];
   const n0=r.n,due0=r.due;bkAnswer(x,"B",30);const a={ok:r.ok||0,n:r.n,due:r.due===due0};bkAnswer(x,"A",30);const b2={n:r.n,wr:r.wr};
   r.due=today();bkAnswer(x,"B",30);const c={ok:r.ok,okd:r.okd===today(),still:redo.includes(r)};return {n0,a,b2,c,linked:bkRdOf(x.id)===r}});
 ok(R1.linked&&R1.a.ok===0&&R1.a.n===R1.n0&&R1.a.due,"questão que está no Refazer, feita no banco antes de vencer: o acerto não mexe no espaçamento "+JSON.stringify(R1));
 ok(R1.b2.n===R1.n0+1&&R1.b2.wr===1,"errou no banco: conta como erro no Refazer (volta amanhã)");
 ok(R1.c.ok===1&&R1.c.okd&&R1.c.still,"vencida: o acerto no banco conta como a revisão do Refazer");
 const R2=await p.evaluate(()=>{const x=bank.find(y=>y.q.enunciado.startsWith("Tema PED-1 questão 1:"));const n0=redo.length;bkAnswer(x,"B",20);const a=redo.length===n0;bkAnswer(x,"C",20);
   const it=redo.find(r=>bkIdOfQ(r.q)===x.id);
   const pv=bqFrom({enunciado:"Prova: tema não estudado ainda, qual a resposta?",alternativas:[{letra:"A",texto:"um"},{letra:"B",texto:"dois"}],correta:"A"},"oficial",["CIR-36"],{ban:"ENARE",ano:"2025"});const xp=bankPut(pv);const n1=redo.length;bkAnswer(xp,"B",20);
   return {a,added:!!it&&it.k==="PED-1",prova:redo.length===n1}});
 ok(R2.a&&R2.added,"errou no banco (já feita antes, fora do Refazer): entra no Refazer");
 ok(R2.prova,"questão de prova de tema ainda não estudado não vai para o Refazer (mesma regra do Refazer)");
 /* 2. sorteio inteligente */
 const S1=await p.evaluate(()=>{const L=bkLive();const x=bank.find(y=>y.q.enunciado.startsWith("Tema GO-1 questão 4:"));x.dz=1;const an=bank.find(y=>y.q.enunciado.startsWith("Tema GO-1 questão 3:"));an.an=1;
   const R=[];for(let t=0;t<20;t++){const S=bkSmart(bkLive(),6);R.push(S)}
   const noOld=R.every(S=>!S.some(y=>y.dz||y.an)),cap=R.every(S=>{const c={};S.forEach(y=>{c[y.ks[0]]=(c[y.ks[0]]||0)+1});return Object.values(c).every(v=>v<=2)});
   const ined=R.every(S=>S.every(y=>!bkH(y).length));delete x.dz;delete an.an;return {noOld,cap,ined,n:R[0].length}});
 ok(S1.n===6&&S1.ined,"sorteio inteligente: inéditas primeiro "+JSON.stringify(S1));
 ok(S1.cap,"no máximo um quarto do simulado (mín. 2) do mesmo tema");
 ok(S1.noOld,"anuladas e desatualizadas ficam fora do sorteio");
 const S2=await p.evaluate(()=>{const cnt=()=>{let go=0;for(let t=0;t<40;t++)go+=bkSmart(bkLive(),2).filter(y=>y.ks[0]==="GO-1").length;return go};const a=cnt();ui.prefs.eixo={a:"GO",sp:BYKEY["GO-1"].sp};const b2=cnt();delete ui.prefs.eixo;return {sem:a,com:b2}});
 ok(S2.com>=S2.sem+10,"o eixo atual da faculdade sobe no sorteio (de "+S2.sem+" para "+S2.com+" de 80 vagas; os pontos fracos também pesam)");
 /* 3. Simulado misto › Do banco */
 await p.click("#qp-sim");await p.click("#simM-banco");await p.waitForTimeout(80);
 const SM=await p.evaluate(()=>({how:$(".simbank").textContent,go:$("#simGo").textContent,dis:$("#simGo").disabled,dif:!!$("#simD-mista")}));
 ok(SM.how.includes("sorteio inteligente")&&SM.go.startsWith("Começar simulado do banco · 10 questões")&&!SM.dis&&!SM.dif,"Simulado misto ganha a origem \"Do banco\" (sem gerar nada, sem dificuldade/estilo) "+JSON.stringify(SM));
 await p.click("#simN-5");await p.click("#simGo");await p.waitForTimeout(80);
 const SQ=await p.evaluate(()=>({n:sim.qs.length,bk:sim.qs.every(q=>q.bk&&bankById.has(q.bk)),st:sim.status}));ok(SQ.n===5&&SQ.bk&&SQ.st==="run","sim do banco com 5 questões do banco "+JSON.stringify(SQ));
 const SA=await p.evaluate(()=>{const q=sim.qs[0],x=bankById.get(q.bk),h0=bkH(x).length,qd0=JSON.stringify(get(q.k).qd||{});simAnswer(q.correta);render();
   const y=bkH(x).slice(-1)[0];return {h:bkH(x).length-h0,src:y.src,c:!!y.c,qd:JSON.stringify(get(q.k).qd||{})!==qd0,shown:!!document.querySelector(".qsim .verdict")}});
 ok(SA.h===1&&SA.src==="bank"&&SA.c&&SA.qd&&SA.shown,"responder no simulado do banco grava como no banco (1ª vez conta no tema, uma vez só) "+JSON.stringify(SA));
 await p.click("#simEnd");await p.waitForTimeout(60);ok(await p.evaluate(()=>sims[0]&&sims[0].lab==="Do banco de questões"&&sims[0].mode==="banco"),"fica em Meus simulados como \"Do banco de questões\"");
 await p.evaluate(()=>{sim=null;simCfg.mode="temas";render()});
 /* 4. Fixar com questões do banco */
 await p.evaluate(()=>{detTab["GO-1"]="questoes";openTopic("GO-1")});await p.waitForTimeout(150);
 const FX=await p.evaluate(()=>{const b=$("#bkFix-GO-1");return b&&b.closest(".bkfix").textContent});
 ok(FX&&/No banco: \d questões deste tema \(\d inéditas\)/.test(FX),"no tema: \"No banco: N questões deste tema\" com Fixar com questões do banco ("+FX+")");
 await p.click("#bkFix-GO-1");await p.waitForTimeout(100);
 const FR=await p.evaluate(()=>({v:view,part:qPart,run:!!bkRun,ks:bkRun.ids.every(id=>bankById.get(id).ks.includes("GO-1")),first:!bkH(bankById.get(bkRun.ids[0])).length}));
 ok(FR.v==="quest"&&FR.part==="banco"&&FR.run&&FR.ks&&FR.first,"Fixar abre o banco resolvendo só as do tema, inéditas primeiro "+JSON.stringify(FR));
 await p.evaluate(()=>{bkRun=null;render();setLevel(BYKEY["GO-1"],1)});await p.waitForTimeout(150);
 ok(await p.evaluate(()=>{const t=$("#trToast");return !!t&&t.textContent.includes("Tema concluído")&&!!$("#toastGo")}),"ao concluir um tema com questões no banco, o aviso oferece Fixar agora");
 /* 5. questão irmã */
 const sis=await p.evaluate(()=>{const x=bank.find(y=>y.q.enunciado.startsWith("Tema CM-1 questão 2:"));bkStart([x.id],"e");return x.id});await p.waitForTimeout(250);
 await p.click("#bka-A");await p.waitForTimeout(250);
 const SI=await p.evaluate(()=>!!$("#bkSis"));ok(SI,"errou: aparece \"Fazer uma questão irmã\"");
 await p.click("#bkSis");await p.waitForTimeout(250);
 const S3=await p.evaluate(()=>{const y=bankById.get(bkRun.ids[bkRun.i]);return {i:bkRun.i,ks:y.ks[0],ined:!bkH(y).length,txt:y.q.enunciado.slice(0,30),like:bqT(y.q.conceito).includes("espironolactona")}});
 ok(S3.i===1&&S3.ks==="CM-1"&&S3.ined&&S3.like,"a irmã é outra inédita do mesmo tema, a mais parecida no conceito "+JSON.stringify(S3));
 await p.evaluate(()=>{bkRun=null;render()});
 /* 6. Diretriz mudou */
 const dz=await p.evaluate(()=>{bkF=bkFDef();const x=bank.find(y=>y.q.enunciado.startsWith("Tema PED-1 questão 3:"));bkOpen=x.id;render();return x.id});
 await p.click("#bkDz-"+dz);await p.waitForTimeout(60);
 const DZ=await p.evaluate(id=>{const x=bankById.get(id),badge=[...document.querySelectorAll(".bkrow")].some(r=>r.dataset.id===id&&r.textContent.includes("Diretriz mudou"));const n0=document.querySelectorAll(".bklist .bkrow").length;
   bkF.old=true;render();const n1=document.querySelectorAll(".bklist .bkrow").length;bkF.old=false;render();return {dz:x.dz,badge,hid:n0-n1,lab:$("#bkM-old")?$("#bkM-old").textContent:""}},dz);
 ok(DZ.dz===1&&DZ.badge&&DZ.hid===1&&DZ.lab.includes("desatualizadas"),"Diretriz mudou: selo na lista e some com \"Esconder anuladas e desatualizadas\" "+JSON.stringify(DZ));
 ok(await p.evaluate(()=>{exams=[exClean({id:"exZ",name:"ENARE 2024",banca:"ENARE",ano:"2024",at:"2026-10-01T10:00:00.000Z",qs:[{n:1,k:"CM-1",g:"b",q:{enunciado:"Prova Z: questão da prova sobre diretriz antiga?",alternativas:[{letra:"A",texto:"a"},{letra:"B",texto:"b"}],correta:"A"}}]})];bankFeedAll();
   return new Promise(r=>setTimeout(()=>{const x=bank.find(y=>y.ex==="exZ");x.dz=1;r(buildBackup().data.bank.some(y=>y.id===x.id&&y.dz))},1700))}),"backup leva a marca \"Diretriz mudou\" também nas questões das provas");
 await ctx.close();
 /* 7. tela inteira do celular no Simulado, Refazer e Provas */
 const c2=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await c2.route(/googleapis|gstatic/,r=>r.abort());
 await c2.addInitScript(mock+`;window.__qLegacy=false;window.__mock({},2);`);const p2=await c2.newPage();p2.on('pageerror',e=>errs.push("cel:"+e.message));
 await p2.goto('http://localhost:8765/tests/preview.html');await p2.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn&&bankBootP,null,{timeout:15000});
 await p2.evaluate(()=>{qPart="sim";setView("quest")});await p2.evaluate(SEED);await p2.evaluate(()=>{simCfg.mode="banco";simCfg.n=5;simStartBank()});await p2.waitForTimeout(100);
 ok(await p2.evaluate(()=>!!$("#simFullB")),"Simulado misto no celular tem ⛶ Tela inteira");
 await p2.tap("#simFullB");await p2.waitForTimeout(120);
 const PF=await p2.evaluate(()=>{const c=document.querySelector(".qsim").getBoundingClientRect();return {pf:document.documentElement.dataset.pfull,top:Math.round(c.top),h:Math.round(c.height),vh:innerHeight,nav:getComputedStyle(document.querySelector(".appnav")).visibility,menu:!!$("#pfMenu"),exit:!!$("#pfExit"),t:$(".pfbar h2").textContent}});
 ok(PF.pf==="sim"&&PF.top===0&&PF.h===PF.vh&&PF.nav==="hidden"&&PF.menu&&PF.exit&&PF.t==="Simulado misto","Simulado misto em tela inteira no celular, com ≡ Menu e Sair "+JSON.stringify(PF));
 await p2.tap("#pfMenu");await p2.waitForTimeout(350);ok(await p2.evaluate(()=>!$("#navMenu").hidden),"≡ Menu abre o menu do app por cima");await p2.evaluate(()=>navMenuClose());await p2.waitForTimeout(350);
 await p2.setViewportSize({width:844,height:390});await p2.waitForTimeout(250);
 const LS=await p2.evaluate(()=>{const q=document.querySelector(".pfullc .qcard"),st=q.querySelector(".qstem").getBoundingClientRect(),al=q.querySelector(".alts").getBoundingClientRect();return {lay:document.documentElement.dataset.layout,side:al.left>st.right-2,sw:document.documentElement.scrollWidth<=innerWidth+1}});
 ok(LS.lay==="phone"&&LS.side&&LS.sw,"deitado: enunciado à esquerda e alternativas à direita "+JSON.stringify(LS));
 await p2.setViewportSize({width:390,height:844});await p2.waitForTimeout(150);
 await p2.tap("#pfExit");await p2.waitForTimeout(100);ok(await p2.evaluate(()=>!document.documentElement.dataset.pfull&&!document.querySelector(".pfullc")&&!fullOn.sim),"Sair volta ao normal");
 await p2.evaluate(()=>{sim=null;const L=bkLive().slice(0,2);L.forEach(x=>rdAdd(x.ks[0],JSON.parse(JSON.stringify(x.q)),"gen"));redo.forEach(r=>r.due=today());qGo("redo")});await p2.waitForTimeout(80);
 await p2.evaluate(()=>{const b=$("#rdGo");if(b)b.click()});await p2.waitForTimeout(100);
 ok(await p2.evaluate(()=>!!rdRun&&!!$("#rdFullB")),"Refazer no celular tem ⛶ Tela inteira");
 await p2.tap("#rdFullB");await p2.waitForTimeout(120);ok(await p2.evaluate(()=>document.documentElement.dataset.pfull==="rd"&&!!document.querySelector(".qredo.pfullc .pfbar")),"Refazer em tela inteira no celular");
 await p2.tap("#pfExit");await p2.waitForTimeout(80);await p2.evaluate(()=>{rdRun=null;render()});
 await p2.evaluate(()=>{const q=i=>({enunciado:"Prova Y questão "+i+": qual?",alternativas:[{letra:"A",texto:"a"+i},{letra:"B",texto:"b"+i}],correta:"A"});exams=[exClean({id:"exY",name:"ENARE 2023",banca:"ENARE",ano:"2023",at:"2026-10-01T10:00:00.000Z",qs:[{n:1,k:"CM-1",g:"b",q:q(1)},{n:2,k:"CM-1",g:"b",q:q(2)}]})];exRun={id:"exY",view:"play",i:0};qGo("provas")});await p2.waitForTimeout(120);
 ok(await p2.evaluate(()=>!!$("#exFullB")),"Prova na íntegra no celular tem ⛶ Tela inteira");
 await p2.tap("#exFullB");await p2.waitForTimeout(120);ok(await p2.evaluate(()=>document.documentElement.dataset.pfull==="ex"&&!!document.querySelector(".qexam.pfullc .pfbar")&&document.documentElement.scrollWidth<=innerWidth+1),"Prova na íntegra em tela inteira no celular");
 await p2.tap("#pfExit");await p2.waitForTimeout(80);
 await c2.close();
 ok(!errs.length,"sem erros de JavaScript "+errs.join(" | "));await b.close()})();
