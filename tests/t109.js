// t109: Lote 6–7 — Ponto-chave/Take home/Fonte em blocos no gabarito; erro com pista em negrito, dados decisivos, ponto-chave, questão completa
// e tipo "Confundi"; erros fora das anotações (migração das seções "Meus erros"); "Para reler hoje" com o erro inteiro em subitens.
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const SHOT=process.env.SHOT||"";
(async()=>{const b=await chromium.launch();const errs=[];
for(const [name,w,h,mob] of [["fone",390,844,true],["note",1366,900,false]]){
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob});await ctx.route(/googleapis|gstatic/,r=>r.abort());
  await ctx.addInitScript(mock+`;window.__mock({},2);localStorage.removeItem("resid-enm");`);const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));
  await p.goto('http://localhost:8765/tests/preview.html');await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
  /* 1. leitura do gabarito comentado: campos separados */
  const kc=await p.evaluate(()=>impKCParse("RESPOSTA 2 Correta: B Justificativa A: Incorreta. Exames normais não excluem DvW. Justificativa B: Correta. A DvW é o distúrbio hereditário mais comum. Justificativa C: Incorreta. Tempo de sangramento é ruim. Ponto-chave: Coagulograma normal NÃO descarta DvW. Take home message: Sangramento mucocutâneo com TP e TTPA normais, investigue DvW. Fonte: Tutoria_SP_2_1_Coagulopatias.pdf, Seções 1.3.1 e 8.3","B"));
  ok(/^Correta\. A DvW é o distúrbio/.test(kc.com)&&!/Ponto/.test(kc.com)&&/^Coagulograma normal NÃO descarta DvW\.?$/.test(kc.pc)&&/^Sangramento mucocutâneo/.test(kc.th)&&/^Tutoria_SP_2_1/.test(kc.fonte)&&kc.con==="",name+": Ponto-chave, Take home e Fonte separados do comentário "+JSON.stringify(kc));
  /* 2. prova com os campos → blocos no gabarito */
  await p.evaluate(kc=>{const alts=[{letra:"A",texto:"Coagulograma normal exclui DvW",porque:"Incorreta. Exames normais não excluem DvW."},{letra:"B",texto:"Dosar FvW:Ag, atividade do FvW e FVIII",porque:""},{letra:"C",texto:"Tempo de sangramento",porque:"Incorreta. Tempo de sangramento é ruim."}];
    const ex=exClean({id:"exc",name:"Simulado-Coagulopatias",banca:"",ano:"",at:new Date().toISOString(),qs:[{n:2,p:9,pe:9,k:"CM-12",q:{enunciado:"Mulher de 24 anos com epistaxe e menorragia desde a adolescência. TP, TTPA e plaquetas normais. Qual a conduta?",alternativas:alts,correta:"B",comentario:kc.com,conceito:"",pc:kc.pc,th:kc.th,fonte:kc.fonte},g:"b",an:false,im:false,ck:"B"}]});
    exams=[ex];exSaveLocal();const P=exPg("exc");P.mode="e";P.a={0:{l:"A",d:today(),s:40}};exRun={id:"exc",view:"q",i:0,shown:Date.now(),cad:{}};backStack=[];setView("quest");if(typeof setQSeg==="function")setQSeg("praticar");render()},kc);
  await p.waitForTimeout(250);
  const G=await p.evaluate(()=>{const c=document.querySelector('.exqc');return {why:(c.querySelector('.qwhy span')||{}).textContent,pc:(c.querySelector('.qpc span')||{}).textContent,th:(c.querySelector('.qth b')||{}).textContent,fo:(c.querySelector('.qfonte span')||{}).textContent}});
  ok(/^A DvW é o distúrbio/.test(G.why)&&/NÃO descarta/.test(G.pc)&&G.th==="Take home message"&&/Tutoria/.test(G.fo),name+": gabarito com Por que (sem \"Correta.\"), Ponto-chave, Take home e Fonte "+JSON.stringify(G));
  if(SHOT&&name==="note"){const c=await p.$('.exqc .qexpl');await c.scrollIntoViewIfNeeded();await p.screenshot({path:SHOT+'/l6-gabarito.png',clip:await (async()=>{const bb=await (await p.$('.exqc')).boundingBox();return {x:bb.x,y:Math.max(0,bb.y+bb.height-640),width:bb.width,height:Math.min(640,bb.height)}})()})}
  /* 3. levar para o caderno: rascunho novo */
  const D=await p.evaluate(()=>{const ex=exams[0],r=ex.qs[0];return qDraft(r.q,"A","Simulado-Coagulopatias")});
  ok(/\*\*/.test(D.p)&&D.dd&&/NÃO descarta/.test(D.pc)&&D.qf&&D.qf.a.length===3&&D.qf.c==="B"&&D.qf.m==="A",name+": rascunho com pista em negrito, dados decisivos, ponto-chave e questão "+JSON.stringify({p:D.p,dd:D.dd,pc:D.pc}));
  ok(await p.evaluate(()=>{const q={enunciado:"Homem de 60 anos com linfonodos. Qual a afirmação correta?",alternativas:[{letra:"A",texto:"O linfoma difuso de grandes células B costuma ser agressivo",porque:""},{letra:"B",texto:"O linfoma difuso de grandes células B nunca é curável",porque:""}],correta:"A",comentario:"x",conceito:""};return qDraft(q,"B","x").t==="confusao"}),name+": alternativa parecida com a certa sugere Confundi");
  const D2=await p.evaluate(()=>{const q={enunciado:"Paciente com dor. Qual a conduta?",alternativas:[{letra:"A",texto:"Analgesia simples",porque:""},{letra:"B",texto:"Cirurgia imediata",porque:""}],correta:"B",comentario:"x",conceito:""};return qDraft(q,"A","x").t});
  ok(D2==="conhecimento",name+": alternativas diferentes ficam em Não sabia");
  /* salvar pelo formulário */
  await p.evaluate(()=>{exRun.cad={0:{...qDraft(exams[0].qs[0].q,"A","Simulado-Coagulopatias"),k:"CM-12"}};render()});await p.waitForTimeout(150);
  const F=await p.evaluate(()=>({dd:($("#ecq-d")||{}).value,pc:($("#ecq-k")||{}).value,t:($("#ecq-t")||{}).value}));
  ok(F.dd&&/NÃO descarta/.test(F.pc)&&F.t==="conhecimento",name+": formulário com Dados decisivos e Ponto-chave "+JSON.stringify(F));
  await p.evaluate(()=>document.querySelector('.ecad form button[type=submit]').click());await p.waitForTimeout(150);
  const E=await p.evaluate(()=>{const e=errors[errors.length-1];return {pc:e.pc,dd:e.dd,q:!!(e.q&&e.q.a.length===3),t:e.t,p:e.p}});
  ok(E.pc&&E.dd&&E.q&&/\*\*/.test(E.p),name+": erro salvo com os campos novos "+JSON.stringify(E));
  /* 4. aba Erros: blocos e questão completa */
  await p.evaluate(()=>{exRun=null;backStack=[];setView("erros");render()});await p.waitForTimeout(150);
  const L=await p.evaluate(()=>{const e=errors[errors.length-1],c=document.querySelector(`.ecard[data-eid="${e.id}"]`);return {strong:c.querySelectorAll('.epista strong').length,dd:!!c.querySelector('.edd'),pc:!!c.querySelector('.epc'),btn:!!c.querySelector('#eqf-'+e.id),id:e.id}});
  ok(L.strong>0&&L.dd&&L.pc&&L.btn,name+": cartão do erro com negrito na pista, dados decisivos, ponto-chave e Ver a questão completa "+JSON.stringify(L));
  await p.evaluate(id=>document.getElementById("eqf-"+id).click(),L.id);await p.waitForTimeout(120);
  const Q=await p.evaluate(id=>{const c=document.querySelector(`.ecard[data-eid="${id}"]`);return {n:c.querySelectorAll('.eqalts li').length,r:(c.querySelector('.eqalts li.right')||{}).textContent,m:(c.querySelector('.eqalts li.mine')||{}).textContent}},L.id);
  ok(Q.n===3&&/^B\)/.test(Q.r)&&/^A\)/.test(Q.m),name+": questão completa com a certa e a marcada "+JSON.stringify(Q));
  ok(await p.evaluate(()=>{eMenu=errors[errors.length-1].id;render();return ![...document.querySelectorAll('.ecard .efoot button')].some(b=>/Levar para a anotação/.test(b.textContent))}),name+": sem \"Levar para a anotação\" no erro");
  /* revisão: dados antes, ponto-chave depois */
  await p.evaluate(()=>{eMenu=null;errors.forEach(e=>e.due=today());render();document.getElementById("erGo").click()});await p.waitForTimeout(150);
  const R1=await p.evaluate(()=>{const c=document.querySelector('.erfc');return {dd:!!c.querySelector('.edd'),pc:!!c.querySelector('.epc')}});
  await p.evaluate(()=>document.getElementById("erShow").click());await p.waitForTimeout(150);
  const R2=await p.evaluate(()=>{const c=document.querySelector('.erfc');return {pc:!!c.querySelector('.epc'),q:!!c.querySelector('.eqfull button')}});
  ok(R1.dd&&!R1.pc&&R2.pc&&R2.q,name+": revisão mostra dados decisivos antes e ponto-chave/questão depois "+JSON.stringify([R1,R2]));
  if(SHOT&&name==="note"){await p.evaluate(()=>{eQOpen.add(errors[errors.length-1].id);render()});await p.waitForTimeout(120);const c=await p.$('.erfc');await c.screenshot({path:SHOT+'/l7-revisao.png'})}
  /* 5. migração: "Meus erros" sai da anotação */
  const M=await p.evaluate(()=>{const old=eNew("CM-12","Marquei X; a certa era Y","Conceito já no caderno","conhecimento","");old.nt=today();putErr(old);
    notes["CM-12"]=`## Resumo\nTexto meu.\n\n## Meus erros\n- Conceito já no caderno (errei: Marquei X) {{e:${old.id}}}\n- Trombastenia de Glanzmann: falta GP IIb/IIIa (errei: confundi com Bernard-Soulier)\n\n## Pegadinhas\n> cuidado`;saveNotesLocal();
    const n0=errors.length;localStorage.removeItem("resid-enm");const r=errNoteMig();const e2=errors[errors.length-1];
    return {r,n:errors.length-n0,note:notes["CM-12"],w:e2.w,rr:e2.r,s:e2.s,nt:errors.some(e=>e.nt),flag:localStorage.getItem("resid-enm"),again:errNoteMig()}});
  ok(M.r===2&&M.n===1&&!/Meus erros/.test(M.note)&&/## Resumo\nTexto meu\./.test(M.note)&&/## Pegadinhas/.test(M.note)&&M.w==="confundi com Bernard-Soulier"&&/^Trombastenia de Glanzmann/.test(M.rr)&&M.s==="Anotação"&&!M.nt&&M.flag==="1"&&M.again===0,name+": seção Meus erros vai para o caderno (com selo = já estava; sem selo = erro novo) "+JSON.stringify(M));
  /* 6. Para reler hoje: erro inteiro em subitens */
  await p.evaluate(()=>{errors.length=0;const e=eNew("CM-12","Marquei Síndrome de Bernard-Soulier; a certa era Trombastenia de Glanzmann","Na trombastenia falta a GP IIb/IIIa: adesão preservada (ristocetina normal), sem agregação com os agonistas fisiológicos. Herança autossômica recessiva.\nPor que não a minha: Bernard-Soulier tem plaquetas gigantes e ristocetina ausente.","confusao","","",
    "Filha de **pais primos** com **plaquetas normais** e sem agregação",{pc:"Agregação ausente com ADP e ristocetina normal = Glanzmann",dd:"pais primos · plaquetas 280 mil · sem agregação com ADP"});e.due=today();putErr(e);
    notes["CM-12"]="## Resumo\nTexto.";saveNotesLocal();ensurePlan();nSeg="revisar";backStack=[];setView("notas");render()});await p.waitForTimeout(200);
  const T=await p.evaluate(()=>{const it=[...document.querySelectorAll('.nerrs li.nei')][0];return it&&{txt:it.textContent,subs:it.querySelectorAll(':scope>ul>li').length,strong:it.querySelectorAll('strong').length}});
  ok(T&&T.subs>=4&&/Trombastenia de Glanzmann:/.test(T.txt)&&/Errei: marquei Síndrome de Bernard-Soulier; a certa era Trombastenia de Glanzmann/.test(T.txt)&&/Ponto-chave: Agregação ausente/.test(T.txt)&&/Por que não a sua: Bernard-Soulier/.test(T.txt)&&!/…/.test(T.txt),name+": Para reler hoje com o erro inteiro em subitens "+JSON.stringify(T));
  if(SHOT&&name==="note"){const c=await p.$('.nerrs');if(c){await c.scrollIntoViewIfNeeded();await c.screenshot({path:SHOT+'/l7-reler.png'})}}
  await ctx.close()}
ok(!errs.length,"sem erros de JavaScript "+errs.join(" | "));await b.close()})();
