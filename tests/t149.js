// t149 (Banco de questões, B4): leitor das reimpressões da Medway (texto em dobro, bolinhas A–E à parte, alternativas depois dos enunciados),
// prova oficial (marca, nível, origem "oficial" no banco), gabarito preliminar × definitivo, comentário do Claude em lote e na questão,
// subtópico sugerido (com conferir e filtro no banco) e a lista "Provas oficiais: lidas e faltando". Texto sintético (sem prova real).
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
(async()=>{const b=await chromium.launch();const errs=[];
 const ctx=await b.newContext({viewport:{width:1366,height:900}});
 await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__qLegacy=false;window.__mock({},2);`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('http://localhost:8765/tests/preview.html');
 await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn&&bankBootP,null,{polling:100,timeout:15000});await p.evaluate(()=>bankBootP);
 /* 1. leitor */
 const R1=await p.evaluate(()=>{const dbl=s=>s+" "+s;
   const pg1=["ENARE 2025","QUESTÃO 1",dbl("Mulher de 52 anos, hipertensa, com PA de 168x102 mmHg em três consultas."),"Qual o tratamento inicial mais adequado?",
     "QUESTÃO 2","Homem de 64 anos com dor torácica há duas horas e supradesnivelamento de ST em DII, DIII e aVF.","Qual artéria está acometida?",
     "A","B","C","D","E",
     "Monoterapia com diurético tiazídico.","Associação de IECA e bloqueador de canal de cálcio.","Betabloqueador isolado.","Apenas mudança de estilo de vida.","Espironolactona isolada.",
     "Descendente anterior.","Coronária direita.","Circunflexa.","Tronco da coronária esquerda.","Ramo diagonal.","Medway"].join("\n");
   const pg2=["QUESTÃO 3","Lactente de 8 meses com febre alta por três dias e exantema que surge após a queda da febre.","Qual o agente?",
     "A","B","C","D","E","Herpesvírus humano 6.","Vírus do sarampo.","Parvovírus B19.","Vírus da rubéola.","Enterovírus."].join("\n");
   const M=impMwPages([{n:1,t:pg1},{n:2,t:pg2}]),T=M?M.pages.map(x=>x.t).join("\n"):"";
   return {und:mwUndouble("abc def abc def"),und2:mwUndouble("texto normal"),pages:M&&M.pages.length,q3:/Questão 3/.test(T),a:(T.match(/^[A-E]\) /gm)||[]).length,
     alt:/^B\) Coronária direita$/m.test(T),stem:/Mulher de 52 anos, hipertensa, com PA de 168x102 mmHg em três consultas\./.test(T)&&!/consultas\. Mulher/.test(T),
     plain:impMwPages([{n:1,t:"Questão 1\nEnunciado\nA) um\nB) dois\nQuestão 2\nE\nA) a\nB) b\nQuestão 3\nE\nA) a\nB) b"}])===null}});
 ok(R1.und==="abc def"&&R1.und2==="texto normal","texto desenhado em dobro vira uma vez só "+JSON.stringify([R1.und,R1.und2]));
 ok(R1.pages===2&&R1.q3&&R1.a===15&&R1.alt,"Medway: alternativas depois dos enunciados voltam para a questão certa, 3 questões × 5 alternativas "+JSON.stringify(R1));
 ok(R1.stem,"enunciado em dobro lido uma vez");ok(R1.plain,"prova no formato comum (A) …) não passa pelo leitor da Medway");
 /* 2. prova oficial, banco, subtópico */
 const R2=await p.evaluate(async()=>{const Q=(e,a,c)=>({enunciado:e,alternativas:a.map((t,i)=>({letra:"ABCDE"[i],texto:t})),correta:c,comentario:""});
   const it=BYKEY["CM-1"],S=subList(it),s0=S[0].t;
   const ex=exClean({id:"exof1",name:"ENARE 2025 (prova própria, R1)",banca:"ENARE",ano:"2025",at:"2025-10-01T10:00:00.000Z",of:1,niv:"R1",kst:"p",
     qs:[{n:1,k:"CM-1",g:"b",q:Q("Paciente com "+s0+" e achados típicos. Qual a conduta?",["um","dois","três","quatro","cinco"],"B")},
         {n:2,k:"CM-1",g:"b",q:Q("Caso sem relação com nada conhecido xyzw qwer. Qual a conduta?",["a1","a2","a3","a4","a5"],"A")},
         {n:3,k:"PED-1",g:"b",q:Q("Lactente com febre e exantema. Qual o agente?",["b1","b2","b3","b4","b5"],"C")}]});
   exams.push(ex);exPut(ex);bankFeedAll();await new Promise(r=>setTimeout(r,80));const x=bank.filter(y=>y.ex==="exof1");
   return {of:ex.of,niv:ex.niv,kst:ex.kst,n:x.length,o:x.every(y=>y.o==="oficial"),bn:x.every(y=>y.niv==="R1"),sb0:ex.qs[0].sb,sbLab:sbLabel("CM-1",ex.qs[0].sb),s0,dub1:!!ex.qs[1].sbd,bsb:(x.find(y=>y.ei===0)||{}).sb}});
 ok(R2.of===1&&R2.niv==="R1"&&R2.kst==="p","prova guarda a marca oficial, o nível e o gabarito preliminar "+JSON.stringify(R2));
 ok(R2.n===3&&R2.o&&R2.bn,"as questões entram no banco com origem oficial e nível");
 ok(R2.sbLab===R2.s0&&R2.bsb===R2.sb0,"subtópico sugerido pelas palavras do enunciado (e levado ao banco): "+R2.sbLab);
 ok(R2.dub1,"questão sem palavras do subtópico fica para conferir");
 await p.evaluate(()=>{qPart="provas";setView("quest")});await p.waitForTimeout(200);
 const meta=await p.textContent("#exr-exof1 .exmeta");ok(/prova oficial R1/.test(meta)&&/gabarito preliminar/.test(meta),"cartão mostra 'prova oficial R1 · gabarito preliminar': "+meta);
 ok(await p.isVisible("#exsbd-exof1"),"botão Conferir subtópicos");await p.click("#exsbd-exof1");await p.waitForTimeout(100);
 const sbs=await p.$$eval(".sbed select",L=>L.map(s=>s.id));ok(sbs.length>=1&&sbs.every(i=>/^sbs-exof1-\d+$/.test(i)),"lista das duvidosas com escolha do subtópico "+sbs.join(","));
 /* 3. preliminar → definitivo */
 await p.click("#exkb-exof1");await p.waitForTimeout(80);ok(await p.isVisible("#exKs-p")&&await p.isVisible("#exKs-d"),"Colar gabarito com Preliminar/Definitivo");
 await p.click("#exKs-d");await p.fill("#exKeyTa","1-B 2-C 3-ANULADA");await p.waitForTimeout(450);await p.click("#exKeyGo");await p.waitForTimeout(150);
 const R3=await p.evaluate(()=>{const ex=exams.find(e=>e.id==="exof1");return {kst:ex.kst,kd:ex.qs.map(r=>!!r.kd),c2:ex.qs[1].q.correta,an3:!!ex.qs[2].an}});
 ok(R3.kst==="d"&&R3.c2==="C"&&R3.an3,"definitivo aplicado: troca a resposta e anula "+JSON.stringify(R3));
 ok(!R3.kd[0]&&R3.kd[1]&&R3.kd[2],"só as que mudaram ganham o aviso 'Gabarito mudou'");
 /* 4. comentar em lote */
 const nc=await p.textContent("#excm-exof1");ok(/Comentar 2 sem comentário/.test(nc),"botão '✦ Comentar 2 sem comentário' (anulada fica de fora): "+nc);
 await p.evaluate(()=>{window.__cp=null;sampleFn.json=async pr=>{window.__cp=pr;return [{n:1,comentario:"Comentário da questão 1.",porque:{A:"Não serve aqui."},pontoChave:"PC 1",takeHome:"TH 1",conceito:"Conceito 1",fonte:"Diretriz X"},{n:2,comentario:"Comentário da questão 2.",porque:{},conceito:"Conceito 2"}]}});
 await p.click("#excm-exof1");await p.waitForTimeout(300);
 const R4=await p.evaluate(async()=>{const ex=exams.find(e=>e.id==="exof1");bankFeedAll();await new Promise(r=>setTimeout(r,60));const x=bank.find(y=>y.ex==="exof1"&&y.ei===0);
   return {c1:ex.qs[0].q.comentario,pq:ex.qs[0].q.alternativas[0].porque,pc:ex.qs[0].q.pc,cm:ex.qs[0].cm,c2:ex.qs[1].q.comentario,bank:x&&x.q.comentario,pr:/Gabarito oficial: B/.test(window.__cp||"")&&/### Questão 2/.test(window.__cp||""),line:(document.querySelector("#exr-exof1 .cmline")||{}).textContent||""}});
 ok(R4.c1==="Comentário da questão 1."&&R4.pq==="Não serve aqui."&&R4.pc==="PC 1"&&R4.cm===1&&R4.c2==="Comentário da questão 2.","comentário, porquês e ponto-chave guardados na prova "+JSON.stringify(R4));
 ok(R4.bank==="Comentário da questão 1.","comentário chega ao banco");ok(R4.pr,"o pedido leva o gabarito oficial de cada questão");ok(/2 questões comentadas/.test(R4.line),"aviso do fim: "+R4.line);
 ok(!(await p.$("#excm-exof1")),"sem pendentes, o botão some");
 /* 5. na questão aberta (banco, modo estudo) */
 const R5=await p.evaluate(async()=>{const Q=(e,a,c)=>({enunciado:e,alternativas:a.map((t,i)=>({letra:"ABCD"[i],texto:t})),correta:c,comentario:""});
   const ex=exClean({id:"exof2",name:"Revalida 2024.1",banca:"REVALIDA",ano:"2024",at:"2024-10-01T10:00:00.000Z",of:1,niv:"Revalida",kst:"d",qs:[{n:7,k:"GO-1",g:"b",q:Q("Gestante com PA 164x112 mmHg e cefaleia. Conduta imediata?",["Sulfato de magnésio","Observação","Corticoide e alta","Furosemida"],"A")}]});
   exams.push(ex);exPut(ex);bankFeedAll();await new Promise(r=>setTimeout(r,60));const x=bank.find(y=>y.ex==="exof2");qPart="banco";bkStart([x.id],"e");render();return x.id});
 await p.click("#bka-A");await p.waitForTimeout(100);ok(await p.isVisible("#bkcm-0"),"'✦ Comentar com o Claude' na questão do banco sem comentário");
 await p.evaluate(()=>{sampleFn.json=async()=>[{n:7,comentario:"Magnésio previne eclâmpsia.",porque:{B:"Atrasa."}}]});await p.click("#bkcm-0");await p.waitForTimeout(1900);
 const R5b=await p.evaluate(()=>({ex:exams.find(e=>e.id==="exof2").qs[0].q.comentario,bk:bank.find(y=>y.ex==="exof2").q.comentario,btn:!!document.querySelector("#bkcm-0")}));
 ok(R5b.ex==="Magnésio previne eclâmpsia."&&R5b.bk===R5b.ex&&!R5b.btn,"comentário guardado e mostrado no lugar do botão "+JSON.stringify(R5b));
 /* 6. filtro por subtópico no banco */
 const R6=await p.evaluate(()=>{bkRun=null;const ex=exams.find(e=>e.id==="exof1");bkF=bkFClean({k:"CM-1",area:"CM",sb:ex.qs[0].sb});render();const n1=document.querySelectorAll(".bklist .bkrow").length;
   const sel=!!document.querySelector("#bkSub");bkF=bkFClean({k:"CM-1",area:"CM",sb:"-"});render();const n2=document.querySelectorAll(".bklist .bkrow").length;
   const pill=[...document.querySelectorAll(".tfpills button, .fcpills button, .tfpill")].map(b=>b.textContent).join("|");bkF=bkFDef();render();return {n1,n2,sel,pill}});
 ok(R6.sel&&R6.n1===1&&R6.n2===1&&!/Clínica/.test(R6.pill)&&/Hipertensão[^|]*\|[^|]*/.test(R6.pill),"filtro Subtópico no banco (com o tema escolhido) "+JSON.stringify(R6));
 /* 7. lista das provas oficiais */
 await p.evaluate(()=>{qPart="provas";ofOpen=true;render()});await p.waitForTimeout(150);
 const R7=await p.evaluate(()=>{const d=document.querySelector(".ofcat");const it=[...document.querySelectorAll(".ofi")];const e25=it.find(l=>/ENARE 2025/.test(l.textContent));
   return {sum:d&&d.querySelector("summary").textContent,got:e25&&e25.classList.contains("got"),st:e25&&e25.querySelector(".ofn span").textContent,n:it.length,miss:it.filter(l=>/Falta/.test(l.textContent)).length}});
 ok(R7.sum&&/2 de \d+ no app/.test(R7.sum)&&R7.got,"lista 'Provas oficiais: lidas e faltando' marca as que já estão no app "+JSON.stringify(R7));
 ok(/3 questões no banco/.test(R7.st)&&/gabarito definitivo/.test(R7.st),"situação da prova lida: "+R7.st);
 await p.click("#of-enare2024objetiva");await p.waitForTimeout(150);
 const pre=await p.textContent("#impOfPre");ok(/Prova oficial: ENARE 2024 \(objetiva\) · R1/.test(pre),"aviso no 1º passo: "+pre);
 const R8=await p.evaluate(()=>{Object.assign(imp,{st:"ready",pages:[{n:1,t:"Questão 1\nEnunciado\nA) a\nB) b"}],keyPg:[]});render();return {name:imp&&imp.name,of:imp&&imp.of,niv:imp&&imp.niv,cb:(document.querySelector("#impOf")||{}).checked,nv:(document.querySelector("#impNiv")||{}).value,bn:(document.querySelector("#impBanca")||{}).value}});
 ok(R8.name==="ENARE 2024 (objetiva)"&&R8.bn==="ENARE"&&R8.of&&R8.cb&&R8.nv==="R1","Importar da lista já preenche nome, banca, ano, 'Prova oficial' e nível "+JSON.stringify(R8));
 const R9=await p.evaluate(()=>{const RD={st:"ready",pages:[{n:1,t:"Questão 1\nEnunciado\nA) a\nB) b"}],keyPg:[]};imp=null;impNew();Object.assign(imp,RD,{name:"Prova do cursinho",banca:"Medcof"});imp.of=null;render();const a=document.querySelector("#impOf").checked;
   imp=null;impNew();Object.assign(imp,RD,{pages:[{n:1,t:"Questão 1\nEnunciado\nA) a\nB) b"}],name:"x",banca:"USP"});imp.of=null;render();const b2=document.querySelector("#impOf").checked;imp=null;render();return [a,b2]});
 ok(!R9[0]&&R9[1],"'Prova oficial' vem marcado sozinho para bancas oficiais (USP sim, cursinho não) "+JSON.stringify(R9));
 ok(!errs.length,"sem erros na página "+errs.join(" | "));
 await b.close()})();
