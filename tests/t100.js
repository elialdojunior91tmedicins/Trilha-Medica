// t100: (1) erros arquivados não somem mais ao tocar no tema; (6) juntar/renomear fontes; (7) erros vivos junto da anotação
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],ipad578:[578,820,true],tabDeitado:[1180,820,true],note:[1366,768,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];const ipad=name.startsWith("ipad")||name.startsWith("tab");
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,screen:name==="ipad578"?{width:1180,height:820}:undefined,userAgent:ipad?"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)":undefined});
 await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
 await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
 const click=async s=>{await p.evaluate(s=>{const x=document.querySelector(s);if(x)x.scrollIntoView({block:"center"})},s);await (mob?p.tap(s):p.click(s));await p.waitForTimeout(250)};
 /* ---------- 1. defeito: tema só com erros arquivados ---------- */
 await p.evaluate(()=>{const D=n=>fromNum(dnum(today())+n);errors.length=0;
   for(let i=0;i<5;i++){const e=eNew("CM-34","Marquei D "+i,"Conceito "+i,"conhecimento","Prova");e.arch=D(-1);putErr(e)}
   eNew("CM-1","Errei HAS","Conceito HAS","confusao","");eNew("CM-1","Errei HAS 2","Conceito HAS 2","confusao","");
   eArea="PED";eSp="Puericultura";backStack=[];setView("erros")});await p.waitForTimeout(250);
 const r1=await p.evaluate(()=>{const ols=[...document.querySelectorAll('#insight .toplist')];const tops=ols[0]?[...ols[0].querySelectorAll('li span')].map(x=>x.textContent):[];return {tops}});
 ok(!r1.tops.includes("Anemias")&&r1.tops.includes("Hipertensão arterial sistêmica"),name+": Temas com mais erros conta só os ativos "+JSON.stringify(r1));
 /* tocar no tema limpa o filtro de área que estava ligado */
 await p.evaluate(()=>{const b=[...document.querySelectorAll('#insight .toplist li button')].find(x=>/Hipertensão/.test(x.textContent));b.id="__t";});await click('#__t');
 ok(await p.evaluate(()=>eTopicKey==="CM-1"&&eArea==="all"&&document.querySelectorAll('#elist .ecard').length===2),name+": tocar no tema limpa os outros filtros e mostra os erros");
 /* tema só com arquivados: abre os arquivados */
 await p.evaluate(()=>{eGoTopic("CM-34");render()});await p.waitForTimeout(150);
 ok(await p.evaluate(()=>eFlags.has("arch")&&document.querySelectorAll('#elist .ecard').length===5),name+": tema só com arquivados abre os arquivados");
 await p.evaluate(()=>{eClearAll();eTopicKey="CM-34";render()});await p.waitForTimeout(150);
 ok(await p.evaluate(()=>!!document.querySelector('#eSeeArch')&&/só tem 5 erros arquivados/.test(document.querySelector('#elist').textContent)),name+": lista vazia avisa dos arquivados com Ver arquivados");
 await click('#eSeeArch');ok(await p.evaluate(()=>document.querySelectorAll('#elist .ecard').length===5),name+": Ver arquivados mostra os 5");
 /* Residência: o tema diz quantos arquivados e não mistura com os ativos */
 await p.evaluate(()=>{detTab["CM-34"]="erros";openTopic("CM-34")});await p.waitForTimeout(300);
 ok(await p.evaluate(()=>{const t=document.querySelector('#t-CM-34').textContent;return /5 arquivados \(resolvidos\) · ver/.test(t)&&!document.querySelector('#t-CM-34 .elist .ecard')}),name+": no tema, os arquivados aparecem só como contagem com link");
 /* ---------- 7. erros junto da anotação ---------- */
 await p.evaluate(()=>{const D=n=>fromNum(dnum(today())+n);errors.length=0;
   const a=eNew("CM-34","Marquei A","Na anemia ferropriva crônica e compensada, a transfusão depende da repercussão clínica e não de um valor de hemoglobina; o tratamento é repor ferro e tratar a causa do sangramento crônico\nCorreta: B) Repor ferro\nPor que a minha não serve: x","conhecimento","");// vence amanhã, sem teimosia → não vivo
   a.due=D(3);putErr(a);
   const b=eNew("CM-34","Marquei B","Plummer-Vinson: ferropenia + disfagia alta + membranas esofágicas","confusao","");b.due=D(0);putErr(b);// vence hoje
   const c=eNew("CM-34","Marquei C","Talassemia minor: microcitose com hemácias elevadas e ferritina normal","confusao","");c.due=D(5);c.miss=2;putErr(c);// teimoso
   const d=eNew("CM-34","Marquei D","Já na anotação","conhecimento","");d.due=D(0);d.nt=1;putErr(d);// vivo, mas já levado
   const e=eNew("CM-34","Marquei E","Arquivado","conhecimento","");e.arch=D(0);putErr(e);
   notes["CM-34"]="## Resumo\nTexto da anotação de anemias.";commit();nSeg="todas";backStack=[];setView("notas");nOpen.add("CM-34");render()});await p.waitForTimeout(300);
 const r7=await p.evaluate(()=>{const x=document.querySelector('#nlist .nerrs');return x&&{h:x.querySelector('.nerrh span').textContent,items:[...x.querySelectorAll('.nerr .ne-r')].map(y=>y.textContent),m:[...x.querySelectorAll('.ne-m')].map(y=>y.textContent),live:x.classList.contains("live")}});
 ok(r7&&r7.h==="4 erros neste tema · 3 ainda pedem atenção"&&r7.live,name+": linha de resumo (ativos e vivos) "+JSON.stringify(r7&&r7.h));
 ok(r7&&r7.items.length===2&&/^Talassemia minor/.test(r7.items[0])&&/^Plummer-Vinson/.test(r7.items[1])&&r7.m[0]==="errou de novo 2×"&&r7.m[1]==="revisar hoje",name+": só os vivos que não estão na anotação, teimosos primeiro "+JSON.stringify(r7&&r7.items));
 /* conceito longo: corta em palavra inteira; sem "Correta:" */
 ok(await p.evaluate(()=>{const e=errors.find(x=>x.w==="Marquei A"),t=eConcept(e);return t.length<=152&&/…$/.test(t)&&!/Correta/.test(t)&&!/ \S{1,2}…$/.test(t)}),name+": conceito longo é cortado sem quebrar palavra");
 if(name==="fone"||name==="note"){await p.evaluate(()=>{const x=document.querySelector('#nlist .nerrs');x.scrollIntoView({block:"center"})});await p.waitForTimeout(150);await p.screenshot({path:`t100-nota-${name}.png`})}
 /* tocar abre o erro no caderno */
 await p.evaluate(()=>{document.querySelector('#nlist .nerr').id="__ne"});await click('#__ne');await p.waitForTimeout(300);
 ok(await p.evaluate(()=>{const c=errors.find(x=>/^Talassemia/.test(x.r));return view==="erros"&&eTopicKey==="CM-34"&&!!document.querySelector(`#elist .ecard[data-eid="${c.id}"]`)}),name+": tocar no erro abre o caderno nele");
 /* sem nenhum vivo: só a linha */
 await p.evaluate(()=>{errors.forEach(e=>{if(e.k==="CM-34"&&!e.arch){e.due=fromNum(dnum(today())+9);e.miss=0;putErr(e)}});backStack=[];setView("notas");render()});await p.waitForTimeout(200);
 ok(await p.evaluate(()=>{const x=document.querySelector('#nlist .nerrs');return x&&!x.querySelector('ul')&&/nenhum pedindo atenção agora/.test(x.textContent)}),name+": sem erro vivo, fica só a linha de resumo");
 /* ---------- 6. juntar/renomear fontes ---------- */
 await p.evaluate(()=>{const d=today();state["CM-1"]={...get("CM-1"),qt:25,qc:18,qb:{"Questões no Claude":{[d]:[15,14]},"USP":{[d]:[10,4]}}};state["CM-4"]={...get("CM-4"),qt:10,qc:4,qb:{"Claude":{[d]:[10,4]}}};
   const ex=exClean({id:"exU",name:"USP 2024",banca:"USP",ano:"2024",at:new Date().toISOString(),qs:[{n:1,k:"CM-1",g:"b",q:{enunciado:"x",alternativas:["A","B","C","D"].map(l=>({letra:l,texto:l})),correta:"A",comentario:""}}]});exams.unshift(ex);exPut(ex);
   qsrcUndo=null;commit();backStack=[];setView("quest");setQSeg("resumo")});await p.waitForTimeout(250);
 const s1=await p.evaluate(()=>[...document.querySelectorAll('.qsrcsug')].map(x=>x.textContent));
 ok(s1.length===1&&/Questões no Claude/.test(s1[0])&&/Juntar em “Claude”/.test(s1[0]),name+": sugere juntar fontes parecidas "+JSON.stringify(s1));
 if(name==="note"){await p.evaluate(()=>document.querySelector('.qsrc').scrollIntoView({block:"start"}));await p.waitForTimeout(120);await p.screenshot({path:`t100-fontes-${name}.png`})}
 await click('#qsrcSug0');
 const s2=await p.evaluate(()=>({qb:state["CM-1"].qb,rows:document.querySelector('.qsrc .qsrows').textContent,undo:!!document.querySelector('#qsrcUndo')}));
 ok(!s2.qb["Questões no Claude"]&&JSON.stringify(Object.values(s2.qb.Claude))==="[[15,14]]"&&/Claude/.test(s2.rows)&&!/Questões no Claude/.test(s2.rows)&&s2.undo,name+": juntou em Claude, em todos os temas "+JSON.stringify(s2.qb));
 ok(await p.evaluate(()=>{const t=qSrcTotals();return t.Claude===25&&!t["Questões no Claude"]}),name+": Claude soma 25 questões");
 await click('#qsrcUndo');ok(await p.evaluate(()=>!!state["CM-1"].qb["Questões no Claude"]&&!state["CM-1"].qb.Claude&&qSrcTotals().Claude===10),name+": Desfazer volta como era");
 /* renomear pelo formulário: USP → USP-SP, inclusive a banca da prova importada */
 await click('#qsrcTog');await p.selectOption('#qsrcFrom','USP');await p.fill('#qsrcTo','USP-SP');await p.waitForTimeout(100);
 ok(await p.evaluate(()=>document.querySelector('#qsrcGo').textContent==="Renomear"&&!document.querySelector('#qsrcGo').disabled),name+": formulário mostra Renomear");
 await click('#qsrcGo');
 ok(await p.evaluate(()=>!state["CM-1"].qb.USP&&!!state["CM-1"].qb["USP-SP"]&&exams.find(x=>x.id==="exU").banca==="USP-SP"),name+": renomeia nos temas e na prova importada");
 /* Claude não muda de nome */
 await click('#qsrcTog');await p.selectOption('#qsrcFrom','Claude');await p.fill('#qsrcTo','Gerador');await p.waitForTimeout(100);
 ok(await p.evaluate(()=>document.querySelector('#qsrcGo').disabled&&/não muda de nome/.test(document.querySelector('.qsrcnote').textContent)),name+": “Claude” não pode ser renomeado");
 ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral");
 await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
