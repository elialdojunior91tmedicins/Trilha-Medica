// t103: Lote 3 — Anotações: [[links]] entre temas com "Mencionado em"/"Citado sem link", tópicos que recolhem e Tab/Shift+Tab,
// selos de erro/questão na linha, PDF novo (capa, sumário com páginas, três níveis) com escolha de área, sumário lateral no computador
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],ipad578:[578,820,true],ipad820:[820,1180,true],tabDeitado:[1180,820,true],note:[1366,768,false],full:[1920,1080,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];const ipad=name.startsWith("ipad")||name.startsWith("tab");
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,screen:name==="ipad578"?{width:1180,height:820}:undefined,userAgent:ipad?"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)":undefined});
 await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
 await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
 const click=async s=>{await p.evaluate(s=>{const x=document.querySelector(s);if(x)x.scrollIntoView({block:"center"})},s);await (mob?p.tap(s):p.click(s));await p.waitForTimeout(220)};
 const eid=await p.evaluate(()=>{localStorage.removeItem("resid-fold-v1");foldSt={};ui.profile.name="Elialdo Júnior";const e=eNew("CM-34","Marquei A","Ferritina baixa confirma ferropenia","conhecimento","");
   const alt=["A","B","C","D"].map(l=>({letra:l,texto:"Alt "+l}));const ex=exClean({id:"exN",name:"Prova N",banca:"ENARE",ano:"2024",at:new Date().toISOString(),qs:[{n:12,k:"CM-34",g:"b",q:{enunciado:"Mulher com anemia microcítica",alternativas:alt,correta:"A",comentario:""}}]});exams.unshift(ex);exPut(ex);
   notes["CM-34"]="## Conceito\nAnemia ferropriva é a ==mais comum==. Ver [[Hipertensão arterial sistêmica]] e [[Tema que não existe]].\n- Causas\n  - Sangramento {{e:"+e.id+"}}\n  - Dieta {{q:exN:0}}\n- Diagnóstico\n## Conduta\n1. Ferro oral";
   notes["CM-1"]="## HAS\nPode coexistir com [[Anemias|anemia]] na doença renal.";notes["CM-4"]="Na cetoacidose, lembrar das anemias? Não: texto citando Anemias sem link.";commit();
   detTab["CM-34"]="notas";noteMode["CM-34"]="ler";openTopic("CM-34");return e.id});await p.waitForTimeout(350);
 /* 1. links [[ ]] */
 const L=await p.evaluate(()=>{const v=document.querySelector('#t-CM-34 .notes .mdview');return {wk:[...v.querySelectorAll('a.wk')].map(a=>a.textContent+"|"+a.dataset.wk),miss:[...v.querySelectorAll('.wk.miss')].map(x=>x.textContent)}});
 ok(L.wk.join()==="Hipertensão arterial sistêmica|t:CM-1"&&L.miss.join()==="Tema que não existe",name+": [[Tema]] vira link; nome desconhecido fica tracejado "+JSON.stringify(L));
 /* 2. Mencionado em / Citado sem link */
 const B=await p.evaluate(()=>{const w=document.querySelector('#t-CM-34 .wkback');return {men:[...w.querySelectorAll('.wkrow:first-child .wkchip')].map(x=>x.textContent),unl:[...w.querySelectorAll('.wkunl li')].map(x=>x.querySelector('.wkchip').textContent)}});
 ok(B.men.join()==="Hipertensão arterial sistêmica"&&B.unl.join()==="Cetoacidose diabética e estado hiperosmolar",name+": Mencionado em e Citado sem link "+JSON.stringify(B));
 await click('#wkl-0');
 ok(await p.evaluate(()=>/\[\[Anemias\|anemias\]\]/.test(notes["CM-4"])||/\[\[Anemias\]\]/.test(notes["CM-4"])),name+": Transformar em link escreve [[Anemias]] na outra anotação "+JSON.stringify(await p.evaluate(()=>notes["CM-4"])));
 ok(await p.evaluate(()=>[...document.querySelectorAll('#t-CM-34 .wkback .wkrow:first-child .wkchip')].length===2&&!document.querySelector('#t-CM-34 .wkunl')),name+": depois disso ele aparece em Mencionado em");
 /* 3. selos */
 const S=await p.evaluate(()=>[...document.querySelectorAll('#t-CM-34 .mdview .nbadge')].map(x=>x.textContent.trim()));
 ok(S.length===2&&/^⚠ Erro · \d\d\/\d\d$/.test(S[0])&&S[1]==="? ENARE · 2024 · Q12",name+": selos de erro e de questão na linha "+JSON.stringify(S));
 /* 4. tópicos que recolhem (lembrado) e lista com subitens */
 const F=await p.evaluate(()=>{const v=document.querySelector('#t-CM-34 .notes .mdview');return {secs:v.querySelectorAll('details.mdsec').length,open:v.querySelectorAll('details.mdsec[open]').length,kids:v.querySelectorAll('li.haskids').length,all:!!document.querySelector('#nfold-CM-34')}});
 ok(F.secs===2&&F.open===2&&F.kids===1&&F.all,name+": títulos viram seções que recolhem; item com subitens tem seta "+JSON.stringify(F));
 await p.evaluate(()=>{document.querySelector('#t-CM-34 .notes details.mdsec:nth-of-type(2)>summary').id="__s2"});await click('#__s2');
 ok(await p.evaluate(()=>JSON.stringify(foldSt["CM-34"])==="[1]"&&localStorage.getItem("resid-fold-v1").includes("CM-34")),name+": seção fechada é lembrada");
 await p.evaluate(()=>{render()});await p.waitForTimeout(150);
 ok(await p.evaluate(()=>document.querySelectorAll('#t-CM-34 .notes details.mdsec[open]').length===1&&document.querySelector('#nfold-CM-34').textContent==="Abrir tudo"),name+": continua fechada depois de redesenhar; botão vira Abrir tudo");
 await click('#nfold-CM-34');ok(await p.evaluate(()=>document.querySelectorAll('#t-CM-34 .notes details.mdsec:not([open])').length===0&&!foldSt["CM-34"]),name+": Abrir tudo");
 await p.evaluate(()=>{document.querySelector('#t-CM-34 .notes li.haskids .lfold').id="__lf"});await click('#__lf');
 ok(await p.evaluate(()=>[...document.querySelectorAll('#t-CM-34 .notes li.sub2')].every(x=>x.hidden)),name+": seta do item recolhe os subitens");await p.evaluate(()=>document.querySelector('#__lf').click());
 if(name==="note"||name==="fone"){await p.evaluate(()=>{document.querySelector('#t-CM-34 .notes').scrollIntoView({block:"start"})});await p.waitForTimeout(150);await p.screenshot({path:`t103-tema-${name}.png`})}
 /* 5. clicar no selo de erro abre o erro; no link abre o tema */
 await p.evaluate(()=>{document.querySelector('#t-CM-34 .mdview .nbadge.ne').id="__nb"});await click('#__nb');
 ok(await p.evaluate(id=>view==="erros"&&!!document.querySelector(`#elist .ecard[data-eid="${id}"]`),eid),name+": selo de erro abre o erro no caderno");
 await p.evaluate(()=>{detTab["CM-34"]="notas";noteMode["CM-34"]="ler";openTopic("CM-34")});await p.waitForTimeout(300);
 await p.evaluate(()=>{document.querySelector('#t-CM-34 .mdview .nbadge.nq').id="__nq"});await click('#__nq');
 ok(await p.evaluate(()=>view==="quest"&&exRun&&exRun.id==="exN"&&exRun.view==="rev"),name+": selo de questão abre a questão da prova");
 await p.evaluate(()=>{exRun=null;detTab["CM-34"]="notas";noteMode["CM-34"]="ler";openTopic("CM-34")});await p.waitForTimeout(300);
 await p.evaluate(()=>{document.querySelector('#t-CM-34 .mdview a.wk').id="__wk"});await click('#__wk');
 ok(await p.evaluate(()=>openKey==="CM-1"&&detTab["CM-1"]==="notas"),name+": link [[ ]] abre o outro tema nas anotações");
 /* 6. editor: [[ autocompleta, Tab/Shift+Tab, Selo */
 await p.evaluate(()=>{notes["CM-34"]="- item\n- outro";commit();detTab["CM-34"]="notas";noteMode["CM-34"]="editar";openTopic("CM-34")});await p.waitForTimeout(300);
 const ta='#nt-CM-34';await p.evaluate(()=>{const t=document.querySelector('#nt-CM-34');t.focus();t.setSelectionRange(t.value.length,t.value.length)});
 await p.keyboard.type(' [[hiperten');await p.waitForTimeout(150);
 const pop=await p.evaluate(()=>{const x=document.querySelector('#t-CM-34 .wkpop');return {vis:!x.hidden,opts:[...x.querySelectorAll('.wkopt b')].map(b=>b.textContent)}});
 ok(pop.vis&&pop.opts[0]==="Hipertensão arterial sistêmica",name+": digitar [[ abre a lista de temas "+JSON.stringify(pop));
 await p.keyboard.press('Enter');await p.waitForTimeout(150);
 ok(await p.evaluate(()=>notes["CM-34"]==="- item\n- outro [[Hipertensão arterial sistêmica]]"&&document.querySelector('#t-CM-34 .wkpop').hidden),name+": Enter escolhe e fecha "+JSON.stringify(await p.evaluate(()=>notes["CM-34"])));
 await p.keyboard.press('Tab');await p.waitForTimeout(80);ok(await p.evaluate(()=>notes["CM-34"].split("\n")[1].startsWith("  - outro")),name+": Tab recua a linha do item");
 await p.keyboard.press('Shift+Tab');await p.waitForTimeout(80);ok(await p.evaluate(()=>notes["CM-34"].split("\n")[1].startsWith("- outro")),name+": Shift+Tab volta");
 await p.evaluate(()=>{const b=[...document.querySelectorAll('#t-CM-34 .ntools .tool')].find(x=>x.textContent==="Selo");b.id="__selo"});await click('#__selo');
 const P=await p.evaluate(()=>[...document.querySelectorAll('#t-CM-34 .nbpick .nbopts button b')].map(x=>x.textContent));
 ok(P.length===2&&/^Erro/.test(P[0])&&P[1]==="ENARE · 2024 · Q12",name+": Selo lista os erros e as questões do tema "+JSON.stringify(P));
 await p.evaluate(()=>{const t=document.querySelector('#nt-CM-34');t.focus();t.setSelectionRange(6,6);document.querySelectorAll('#t-CM-34 .nbpick .nbopts button')[1].id="__nq2"});await click('#__nq2');
 ok(await p.evaluate(()=>notes["CM-34"].split("\n")[0]==="- item {{q:exN:0}}"&&!document.querySelector('#t-CM-34 .nbpick')),name+": escolher insere o selo na linha "+JSON.stringify(await p.evaluate(()=>notes["CM-34"].split("\n")[0])));
 /* 7. Levar para a anotação põe o selo do erro */
 await p.evaluate(()=>{const e=errors[errors.length-1];eToNote(e)});ok(await p.evaluate(id=>notes["CM-34"].includes(`{{e:${id}}}`),eid),name+": Levar para a anotação deixa o selo do erro na linha");
 /* 8. PDF: capa, sumário com páginas, três níveis */
 const D=await p.evaluate(()=>{notes["CM-1"]="## HAS\nVer [[Anemias]].";notes["PED-1"]="Texto";commit();const d=notesPDF(["CM-34","CM-1","PED-1"],[],{raw:true,scope:"Todas as áreas"});const u=d.output();let s="";for(let i=0;i<u.length;i++)s+=String.fromCharCode(u[i]);
   return {pages:d.pages.length,pm:d.__pm,toc:d.__toc.map(r=>r.lv+":"+r.t),hasName:s.includes("Elialdo J"),hasSum:s.includes("(Sum"),link:/\(Anemias\) Tj[\s\S]{0,300}\(\\\(p\.\) Tj/.test(s)}});
 ok(D.pages>=4&&D.toc.join("|")==="1:Clínica Médica|2:Cardiologia|3:Hipertensão arterial sistêmica|2:Hematologia e oncologia|3:Anemias|1:Pediatria|2:Puericultura|3:Crescimento",name+": sumário em três níveis "+JSON.stringify(D.toc));
 ok(D.pm["CM-1"]===3&&D.pm["PED-1"]>D.pm["CM-34"]&&D.hasName&&D.hasSum&&D.link,name+": capa com o nome, páginas certas e link com (p. N) "+JSON.stringify({pm:D.pm,n:D.hasName,s:D.hasSum,l:D.link}));
 /* 9. Anotações: Baixar PDF com escolha de área; sumário lateral só no computador com espaço */
 await p.evaluate(()=>{backStack=[];nSeg="todas";setView("notas")});await p.waitForTimeout(300);
 if(await p.evaluate(()=>!document.querySelector('#nPdf').hidden)){await click('#nPdf');
   const O=await p.evaluate(()=>[...document.querySelectorAll('#nPdfScope option')].map(o=>o.textContent));
   ok(O[0].startsWith("Caderno todo")&&O.some(x=>/^Clínica Médica \(\d+\)$/.test(x))&&O.some(x=>/^Pediatria \(1\)$/.test(x)),name+": PDF permite escolher o caderno todo ou uma área "+JSON.stringify(O))}
 const toc=await p.evaluate(()=>({on:!document.querySelector('#nToc').hidden,items:[...document.querySelectorAll('#nToc .ntt button')].map(x=>x.textContent)}));
 const want=["note","full"].includes(name);ok(want?toc.on&&toc.items.length===4:!toc.on,name+(want?": sumário lateral com os temas da página ":": sem sumário lateral nesta tela ")+JSON.stringify(toc));
 if(want){await p.evaluate(()=>{document.querySelector('#nToc .ntt button').id="__t1"});await click("#__t1");await p.waitForTimeout(1500);
   {const tp=await p.evaluate(()=>Math.round(document.getElementById("nc-"+document.querySelector("#__t1").dataset.k).getBoundingClientRect().top));ok(tp>=-5&&tp<h/2,name+": tocar no sumário rola até o tema "+tp)}
   if(name==="note")await p.screenshot({path:`t103-notas-${name}.png`})}
 ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral");
 await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
