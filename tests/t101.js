// t101: Lote 1 — lista de Provas na íntegra em cartões (celular sem letra por linha), comentário organizado
// (Gabarito no topo, porquê de cada errada sob a alternativa), rascunho do caderno de erros pelo app (Pista do caso) e "Resumir com o Claude"
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],ipad578:[578,820,true],ipad820:[820,1180,true],tabDeitado:[1180,820,true],note:[1366,768,false],full:[1920,1080,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];const ipad=name.startsWith("ipad")||name.startsWith("tab");
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,screen:name==="ipad578"?{width:1180,height:820}:undefined,userAgent:ipad?"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)":undefined});
 await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
 await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
 const click=async s=>{await p.evaluate(s=>{const x=document.querySelector(s);if(x)x.scrollIntoView({block:"center"})},s);await (mob?p.tap(s):p.click(s));await p.waitForTimeout(220)};
 /* ---------- lista de provas ---------- */
 await p.evaluate(()=>{const alt=["A","B","C","D"].map(l=>({letra:l,texto:"Alt "+l}));
   const mk=(id,name,n)=>{const ex=exClean({id,name,banca:"ENARE",ano:"2024",at:new Date().toISOString(),qs:Array.from({length:n},(_,i)=>({n:i+1,k:"CM-34",g:"b",q:{enunciado:"Q"+i,alternativas:alt,correta:"A",comentario:""}}))});exams.push(ex);exPut(ex)};
   mk("e1","Distúrbios da Hemostasia e Doenças Hematológicas — Prova Completa",40);mk("e2","SUS-SP Clínica Médica",20);mk("e3","USP R1",10);
   const P=exPg("e2");for(let i=0;i<7;i++)P.a[i]={l:"A",d:today(),s:1};const Q=exPg("e3");for(let i=0;i<10;i++)Q.a[i]={l:i%2?"A":"B",d:today(),s:1};Q.fin=today();
   backStack=[];qSeg="praticar";setView("quest")});await p.waitForTimeout(300);
 const L=await p.evaluate(()=>[...document.querySelectorAll('.excard')].map(c=>{const n=c.querySelector('.exname').getBoundingClientRect(),st=c.querySelector('.exstat').getBoundingClientRect(),cs=getComputedStyle(c.querySelector('.exname'));
   const btn=[...c.querySelectorAll('button')].map(x=>x.getBoundingClientRect());
   return {st:c.dataset.st,nameW:Math.round(n.width),lines:Math.round(n.height/parseFloat(cs.lineHeight)),pill:c.querySelector('.exstat').textContent,pillH:Math.round(st.height),overlap:btn.some(r=>r.width&&!(r.bottom<=st.top||r.top>=st.bottom||r.right<=st.left||r.left>=st.right)),go:c.querySelector('.exgo')&&c.querySelector('.exgo').textContent,mode:!!c.querySelector('.exmode'),how:(c.querySelector('.exmodeh')||{}).textContent||"",prog:!!c.querySelector('.exbar'),sec:[...c.querySelectorAll('.exsec button')].map(x=>x.textContent)}}));
 ok(L.length===3&&L.every(x=>x.nameW>=150&&x.lines<=4&&x.pillH<30&&!x.overlap),name+": nome da prova em linhas normais e selo sem sobrepor botões "+JSON.stringify(L.map(x=>[x.nameW,x.lines,x.pillH,x.overlap])));
 ok(L[0].st==="new"&&L[0].pill==="Não iniciada"&&L[0].mode&&/só no fim/.test(L[0].how)&&L[0].go==="Começar",name+": prova nova: modo com explicação e Começar em destaque");
 ok(L[1].st==="run"&&L[1].pill==="Em andamento"&&L[1].prog&&L[1].go==="Continuar"&&!L[1].mode,name+": em andamento: barra de progresso e Continuar");
 ok(L[2].st==="fin"&&/^Feita · 50%$/.test(L[2].pill)&&L[2].go==="Ver resultado"&&L[2].sec.join()==="Refazer,Revisar questões,Colar gabarito,Excluir",name+": feita: nota no selo, ações secundárias discretas "+JSON.stringify(L[2]));
 await click('#exm-e1-e');ok(await p.evaluate(()=>exPg("e1").mode==="e"&&/a cada questão|depois de cada questão/.test(document.querySelector('#exr-e1 .exmodeh').textContent)),name+": trocar o modo muda a explicação");
 await click('#exkb-e1');ok(await p.evaluate(()=>!!document.querySelector('#exr-e1 .exkey')&&document.querySelector('#exkb-e1').getAttribute("aria-expanded")==="true"),name+": Colar gabarito abre dentro do cartão");await click('#exkb-e1');
 if(name==="fone"||name==="note"){await p.evaluate(()=>document.querySelector('.qexam').scrollIntoView({block:"start"}));await p.waitForTimeout(120);await p.screenshot({path:`t101-lista-${name}.png`})}
 ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": lista sem rolagem lateral");
 /* ---------- comentário organizado ---------- */
 await p.evaluate(()=>{const A=[["A","Linfoma folicular"],["B","Leucemia linfoblástica aguda de linhagem T"],["C","Leucemia mieloide crônica"],["D","Linfoma de Hodgkin"]].map(([l,t])=>({letra:l,texto:t}));
   const ex=exClean({id:"eK",name:"Hemato",banca:"ENARE",ano:"2024",at:new Date().toISOString(),qs:[{n:7,k:"CM-34",g:"b",q:{enunciado:"Adolescente de 16 anos com dispneia há duas semanas. A radiografia de tórax mostra massa mediastinal anterior e o hemograma revela leucócitos de 180.000/mm³ com blastos. Qual o diagnóstico mais provável?",alternativas:A,correta:"B",
     comentario:"Massa mediastinal anterior com hiperleucocitose em adolescente é a apresentação típica da LLA-T. Alternativa A — linfoma folicular é indolente e de adultos mais velhos, sem blastos no sangue. Alternativa B — correta: o timo é a origem da linhagem T. Alternativa C — errada, porque a LMC cursa com esplenomegalia e células maduras. Alternativa D: incorreta. Não explica os blastos.",conceito:"Massa mediastinal + blastos em adolescente = LLA-T."}}]});
   exams.unshift(ex);exPut(ex);exPg("eK").mode="e";exRun={id:"eK",view:"q",i:0,cad:{}};render()});await p.waitForTimeout(250);
 await click('#exa-0-A');
 const C=await p.evaluate(()=>{const c=document.querySelector('.exqc');const x=c.querySelector('.qexpl');return {gab:x&&x.querySelector('.qgab').textContent,why:x&&x.querySelector('.qwhy').textContent,ck:x&&!!x.querySelector('.qck'),whys:[...c.querySelectorAll('.altwhy')].map(y=>[y.classList.contains("mine"),y.textContent]),order:x&&[...x.children].map(y=>y.className)}});
 ok(C.gab==="GabaritoB) Leucemia linfoblástica aguda de linhagem T"||/^Gabarito\s*B\) Leucemia linfoblástica/.test(C.gab),name+": Gabarito com a alternativa certa no topo "+JSON.stringify(C.gab));
 ok(/^Por que B está certa/.test(C.why)&&/apresentação típica da LLA-T/.test(C.why)&&/timo é a origem/.test(C.why)&&!/Alternativa A|folicular|esplenomegalia/.test(C.why),name+": “Por que B está certa” só com o texto da certa "+JSON.stringify(C.why));
 ok(C.whys.length===3&&C.whys[0][0]&&/^Por que a sua não serve/.test(C.whys[0][1])&&/indolente/.test(C.whys[0][1])&&/^A LMC cursa/.test(C.whys[1][1])&&/^Não explica os blastos/.test(C.whys[2][1]),name+": o porquê de cada errada fica sob a alternativa, a sua destacada "+JSON.stringify(C.whys));
 ok(await p.evaluate(()=>/Alternativa A — linfoma/.test(exams.find(x=>x.id==="eK").qs[0].q.comentario)),name+": o comentário salvo não é alterado (só a exibição)");
 if(name==="fone"||name==="note"){await p.evaluate(()=>document.querySelector('.exqc .alts').scrollIntoView({block:"start"}));await p.waitForTimeout(120);await p.screenshot({path:`t101-coment-${name}.png`})}
 /* ---------- caderno de erros montado pelo app ---------- */
 await p.evaluate(()=>{[...document.querySelectorAll('.exqc .ecad button')].find(x=>/Levar para o caderno/.test(x.textContent)).id="__lc"});await click('#__lc');
 const D=await p.evaluate(()=>({w:document.querySelector('#ecq-w').value,p:document.querySelector('#ecq-p').value,r:document.querySelector('#ecq-r').value,sum:!!document.querySelector('#ecqSum')}));
 ok(D.w==="Marquei Linfoma folicular; a certa era Leucemia linfoblástica aguda de linhagem T",name+": “O que eu errei” curto "+JSON.stringify(D.w));
 ok(/massa mediastinal anterior/.test(D.p)&&!/Qual o diagnóstico/.test(D.p)&&D.p.length<=221,name+": Pista do caso = frase-chave do enunciado "+JSON.stringify(D.p));
 ok(/^Massa mediastinal \+ blastos/.test(D.r)&&/Por que não a minha: Linfoma folicular é indolente/.test(D.r)&&!/Adolescente de 16 anos/.test(D.r),name+": Conceito correto vem do comentário, sem o enunciado inteiro "+JSON.stringify(D.r));
 ok(D.sum,name+": botão opcional Resumir com o Claude");
 if(name==="fone"||name==="note"){await p.evaluate(()=>document.querySelector('.exqc .ecad').scrollIntoView({block:"start"}));await p.waitForTimeout(120);await p.screenshot({path:`t101-caderno-${name}.png`})}
 /* resumir com o Claude (resposta simulada) e desfazer */
 await p.evaluate(()=>{window.__sp=null;sampleFn.json=async(pr)=>{window.__sp=pr;return {errei:"Marquei folicular; era LLA-T",pista:"massa mediastinal + blastos",conceito:"LLA-T: massa mediastinal anterior com hiperleucocitose."}}});
 await click('#ecqSum');await p.waitForTimeout(200);
 const S=await p.evaluate(()=>({w:document.querySelector('#ecq-w').value,p:document.querySelector('#ecq-p').value,r:document.querySelector('#ecq-r').value,pr:window.__sp,undo:!!document.querySelector('#ecqSumUndo')}));
 ok(S.w==="Marquei folicular; era LLA-T"&&S.p==="massa mediastinal + blastos"&&/^LLA-T/.test(S.r)&&S.undo&&/ENUNCIADO: Adolescente/.test(S.pr)&&/MARQUEI: Linfoma folicular/.test(S.pr),name+": Resumir com o Claude preenche e permite voltar");
 await click('#ecqSumUndo');ok(await p.evaluate(()=>/^Marquei Linfoma folicular/.test(document.querySelector('#ecq-w').value)),name+": Voltar ao do app");
 await p.fill('#ecq-p','Massa mediastinal anterior em adolescente');
 await p.evaluate(()=>{document.querySelector('.exqc .ecad form button[type=submit]').id="__sv"});await click('#__sv');
 const E=await p.evaluate(()=>{const e=errors[errors.length-1];return {p:e.p,w:e.w,k:e.k}});
 ok(E.p==="Massa mediastinal anterior em adolescente"&&E.k==="CM-34",name+": a pista é salva no erro "+JSON.stringify(E));
 await p.evaluate(()=>{eGoTopic("CM-34");backStack=[];setView("erros")});await p.waitForTimeout(250);
 ok(await p.evaluate(()=>{const c=[...document.querySelectorAll('#elist .ecard')].find(x=>x.querySelector('.epista')&&!x.querySelector('.epista').hidden);return c&&/Pista do caso/.test(c.textContent)}),name+": o cartão do erro mostra a Pista do caso");
 await p.evaluate(()=>{const e=errors[errors.length-1];erRun={ids:[e.id],i:0,show:false,ok:0,done:0};render()});await p.waitForTimeout(200);
 ok(await p.evaluate(()=>{const f=document.querySelector('.erfc .epista');return f&&!f.hidden&&/Massa mediastinal/.test(f.textContent)}),name+": na revisão, a pista aparece antes de abrir a resposta");
 ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral");
 await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
