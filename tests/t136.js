// t136: Lote 20B — filtros no mesmo padrão: período 7 · 15 · 30 · 60 · 90 dias · Tudo, contagem em toda etiqueta (zero apagado),
// barra de filtros no topo de Questões, folha de baixo no celular, Caderno com Tipo e Etiquetas no painel, Refazer, Simulado,
// Foco, Erros, PDF, busca geral por tipo e catálogo com contagem por região.
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');
const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],note:[1366,900,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const [name,[w,h,mob]] of Object.entries(DEV)){
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob});
 await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__noSheet=false;window.__mock({},2);`);const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:8765/tests/preview.html');await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
 await p.evaluate(()=>{const D=n=>fromNum(dnum(today())+n);
   ["CM-1","CM-4","CM-34","PED-3","GO-2"].forEach((k,i)=>{state[k]={l:1,last:D(-3-i),step:0,qt:10+i,qc:3+i*2,qd:{[D(-2-i*20)]:[10+i,3+i*2]}};notes[k]="## Resumo\n> pegadinha\ntexto "+k});
   errors.push({id:"e1",k:"CM-1",w:"x",r:"y",t:"conhecimento",s:"ENARE",d:D(-2)},{id:"e2",k:"PED-3",w:"x",r:"y",t:"confusao",s:"USP",d:D(-50)});saveErrsLocal();
   freeN.push(frClean({id:"f1",t:"Aula de cardio",b:"Texto",tags:["cardio"],ks:[]}));
   ["CM-1","CM-4","PED-3"].forEach((k,i)=>redo.push(rdClean({id:"r"+i,k,d:D(-i),n:1+i,src:["gen","sim","exam"][i],due:D(i?-1:3),q:{enunciado:"Caso",alternativas:[{letra:"A",texto:"a"},{letra:"B",texto:"b"}],correta:"A",comentario:"",conceito:"",alerta:""}})));rdSaveLocal();
   foSess.push({id:"fs1",d:D(-1),s:Date.now(),sec:1800,m:"p",ref:"T:CM-1",lab:""},{id:"fs2",d:D(-40),s:Date.now(),sec:3600,m:"p",ref:"T:PED-3",lab:""});commit()});
 const vis=s=>p.evaluate(s=>{const x=document.querySelector(s);return !!x&&x.checkVisibility()},s);
 const jsc=s=>p.evaluate(s=>document.querySelector(s).click(),s).then(()=>p.waitForTimeout(200));
 /* 1. Questões: barra no topo da aba */
 await p.evaluate(()=>{backStack=[];qFOpen=false;lsSet("resid-qfpanel",null);setView("quest");setQSeg("resumo")});await p.waitForTimeout(250);
 const Q1=await p.evaluate(()=>{const v=document.querySelector('#viewQuest'),bar=document.querySelector('#qFBar'),kids=[...v.children].filter(x=>x.checkVisibility());return {bar:!!bar&&bar.checkVisibility(),first:kids.slice(0,3).some(x=>x===bar||x.contains(bar)),q:!!bar.querySelector('#qq'),old:!!document.querySelector('#qFNote')}});
 ok(Q1.bar&&Q1.first&&Q1.q&&!Q1.old,name+": Questões com a barra de filtros no topo, também no Resumo "+JSON.stringify(Q1));
 await jsc('#qFBtn');
 const Q2=await p.evaluate(()=>({per:[...document.querySelectorAll('[id^="qPer-"]')].map(b=>b.textContent).join("|"),acc:[...document.querySelectorAll('[id^="qAcc-"]')].map(b=>b.textContent).join("|"),sel:!!document.querySelector('select#qPer,#qAccSel')}));
 ok(Q2.per==="7 dias|15 dias|30 dias|60 dias|90 dias|Tudo"&&/· \d/.test(Q2.acc)&&!Q2.sel,name+": período 7 · 15 · 30 · 60 · 90 · Tudo e Acerto em etiquetas com contagem "+JSON.stringify(Q2));
 const Z=await p.evaluate(()=>[...document.querySelectorAll('#qFPanel .chip')].every(c=>/· 0$/.test(c.textContent)&&c.getAttribute("aria-pressed")!=="true"?c.classList.contains("z"):!c.classList.contains("z")));
 ok(Z,name+": etiqueta com zero fica apagada (classe z), as outras não");
 if(mob){const S=await p.evaluate(()=>{const s=document.querySelector('.tfsheet'),bk=document.querySelector('.tfback'),d=s&&s.querySelector('.tfdone');return {s:!!s&&s.checkVisibility(),bk:!!bk,head:!!(s&&s.querySelector('.tfsh .tfsx')),done:d?d.textContent:""}});
   ok(S.s&&S.bk&&S.head&&/^Ver /.test(S.done),name+": no celular o painel abre como folha de baixo, com fechar e "+S.done);
   await jsc('.tfback');ok(!(await p.$('#qFPanel'))&&!(await p.$('.tfback')),name+": tocar fora fecha a folha")}
 else{ok(!(await p.$('.tfsheet'))&&!(await p.$('.tfback')),name+": no computador o painel fica no lugar (sem folha)");await jsc('#qFBtn')}
 await p.evaluate(()=>{qPer="7";render()});await p.waitForTimeout(150);
 ok(await p.evaluate(()=>[...document.querySelectorAll('#qFBar .tfpill span')].some(x=>/7 dias/.test(x.textContent))),name+": filtro ativo aparece como etiqueta com × na barra");
 await p.evaluate(()=>{qClearAll();render()});
 /* 2. Caderno: Tipo e Etiquetas dentro do painel */
 await p.evaluate(()=>{backStack=[];nFOpen=false;setView("notas");setNSeg("livre")});await p.waitForTimeout(250);
 ok(!(await p.$('.ntype'))&&!(await p.$('.ntagbar')),name+": Caderno sem Tipo e Etiquetas soltos (só busca e Filtros)");
 await p.evaluate(()=>{nFOpen=true;render()});await p.waitForTimeout(150);
 const N=await p.evaluate(()=>({ty:[...document.querySelectorAll('#nFPanel [id^="nTy-"]')].map(b=>b.textContent).join("|"),tag:(document.querySelector('#nFPanel [data-tag="cardio"]')||{}).textContent||""}));
 ok(/^Todas · \d+\|Livres? · 1\|Temas · \d+$/i.test(N.ty)||(/Todas · \d/.test(N.ty)&&/· 1/.test(N.ty)),name+": Tipo no painel com contagem "+N.ty);
 ok(/cardio · 1/.test(N.tag),name+": Etiquetas no painel com contagem "+N.tag);
 await p.evaluate(()=>document.querySelector('#nFPanel [data-tag="cardio"]').click());await p.waitForTimeout(150);
 ok(await p.evaluate(()=>[...document.querySelectorAll('#nFind .tfpill span')].some(x=>/cardio/.test(x.textContent))),name+": etiqueta escolhida vira pílula com ×");
 await p.evaluate(()=>{freeTag="all";nType="all";nFOpen=false;render()});
 /* 3. Refazer */
 await p.evaluate(()=>{backStack=[];setView("quest");setQSeg("praticar");rdList=true;render()});await p.waitForTimeout(250);
 const RD=await p.evaluate(()=>({per:[...document.querySelectorAll('.qredo [id^="rdF-"]')].map(b=>b.textContent).join("|"),src:[...document.querySelectorAll('.qredo [id^="rdFSrc-"]')].map(b=>b.textContent).join("|"),rep:(document.querySelector('#rdFRep')||{}).textContent||"",sel:!!document.querySelector('select#rdFSrc')}));
 ok(/Para hoje · 2\|Todas · 3/.test(RD.per)&&/· \d/.test(RD.src)&&/Erradas 2\+ vezes · \d/.test(RD.rep)&&!RD.sel,name+": Refazer com o mesmo cartão: Quais, De onde e 2+ vezes com contagem "+JSON.stringify(RD));
 await jsc('#rdF-all');await jsc('#rdFSrc-gen');ok(await p.evaluate(()=>rdF.src==="gen"),name+": etiqueta de origem liga");await jsc('#rdFSrc-gen');ok(await p.evaluate(()=>rdF.src==="all"),name+": tocar de novo desliga");
 /* 4. Simulado › Escolher temas */
 await p.evaluate(()=>{simCfg.src="pick";simCfg.mode="temas";simPF.lv="all";simPF.inc=0;render()});await p.waitForTimeout(200);
 const SP=await p.evaluate(()=>({est:(document.querySelector('#simPl-est')||{}).textContent||"",all:!!document.querySelector('#simPl-all'),inc:(document.querySelector('#simPi-3')||{}).textContent||""}));
 ok(/Já estudados · 5/.test(SP.est)&&!SP.all&&/Muito alta incidência · \d/.test(SP.inc),name+": Simulado com contagem na situação e na incidência "+JSON.stringify(SP));
 await jsc('#simPl-est');ok(await p.evaluate(()=>simPF.lv==="est"),name+": situação liga");await jsc('#simPl-est');ok(await p.evaluate(()=>simPF.lv==="all"),name+": tocar de novo volta a todos");
 /* 5. Erros › Quando */
 await p.evaluate(()=>{backStack=[];eFOpen=true;setView("erros")});await p.waitForTimeout(250);
 const EP=await p.evaluate(()=>[...document.querySelectorAll('[id^="ePer-"]')].map(b=>b.textContent).join("|"));
 ok(/^7 dias · 1\|15 dias · 1\|30 dias · 1\|60 dias · 2\|90 dias · 2\|Tudo · 2$/.test(EP),name+": Erros › Quando no padrão, com contagem "+EP);
 await p.evaluate(()=>{eFOpen=false;eClearAll();render()});
 /* 6. Foco › Tempo por matéria */
 await p.evaluate(()=>{backStack=[];setView("foco")});await p.waitForTimeout(250);
 const FO=await p.evaluate(()=>[...document.querySelectorAll('[id^="foPer-"]')].map(b=>b.textContent+(b.getAttribute("aria-pressed")==="true"?"*":"")).join("|"));
 ok(FO==="7 dias*|15 dias|30 dias|60 dias|90 dias|Tudo",name+": Foco com 7 · 15 · 30 · 60 · 90 · Tudo (7 dias de início) "+FO);
 await jsc('#foPer-90');ok(await p.evaluate(()=>localStorage.getItem("resid-foper")==="90"&&/PED|Pediatria|Fraturas|Asma|[a-z]/i.test(document.querySelector('.fomats').textContent)),name+": o período escolhido fica lembrado");
 /* 7. PDF */
 await p.evaluate(()=>{pdfOpt.open=true;goSub("perfil");render()});await p.waitForTimeout(250);
 const PD=await p.evaluate(()=>{const r=[...document.querySelectorAll('.pdfpan .seg')].find(s=>/90 dias/.test(s.textContent));return r?[...r.querySelectorAll('button')].map(b=>b.textContent).join("|"):""});
 ok(/^7 dias\|15 dias\|30 dias\|60 dias\|90 dias\|Tudo/.test(PD)&&!/14 dias|21 dias/.test(PD),name+": PDF com 7 · 15 · 30 · 60 · 90 · Tudo + Outro "+PD);
 /* 8. Catálogo */
 await p.evaluate(()=>{pdfOpt.open=false;excOpen=true;render()});await p.waitForTimeout(200);
 const CT=await p.evaluate(()=>[...document.querySelectorAll('#excPanel [id^="excR-"]')].map(b=>b.textContent).join("|"));
 ok(/Nordeste · \d+/.test(CT)&&CT.split("|").every(x=>/· \d+$/.test(x)),name+": catálogo com contagem por região "+CT);
 await p.evaluate(()=>{excOpen=false;goBack()});
 /* 9. Busca geral */
 await p.evaluate(()=>{gsOpen=true;gsQ="cardio";renderGSearch()});await p.waitForTimeout(300);
 const G1=await p.evaluate(()=>({ch:[...document.querySelectorAll('.gstypes .chip')].map(b=>b.textContent),g:document.querySelectorAll('#gsres .gsg').length}));
 ok(G1.ch.length>=2&&/^Tudo · \d+$/.test(G1.ch[0]),name+": busca geral com etiquetas por tipo "+G1.ch.join(" | "));
 await jsc('#gsT-1');const G2=await p.evaluate(()=>document.querySelectorAll('#gsres .gsg').length);
 ok(G2===1,name+": tocar num tipo mostra só ele");await jsc('#gsT-1');ok(await p.evaluate(()=>document.querySelectorAll('#gsres .gsg').length)===G1.g,name+": tocar de novo volta a tudo");
 await p.evaluate(()=>{gsOpen=false;renderGSearch()});
 ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral");
 await ctx.close()}
ok(!errs.length,"sem erros de JavaScript "+errs.join(" | "));await b.close()})();
