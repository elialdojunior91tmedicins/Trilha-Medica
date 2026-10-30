// capturas de conferência do Lote 20 no modo escuro e no iPad (não é teste). Uso: node shots20x.js <pasta> [aparelhos]
// aparelhos: fone (escuro), ipad578 (claro, iPad dentro do app do Claude), ipad820 (escuro, em pé), tab (claro, deitado), note (escuro)
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');
const OUT=process.argv[2]||'.';fs.mkdirSync(OUT,{recursive:true});
const ALL={fone:[390,844,true,"dark"],ipad578:[578,820,true,"light"],ipad820:[820,1180,true,"dark"],tab:[1180,820,true,"light"],note:[1366,900,false,"dark"]};
const DEV=process.argv[3]?Object.fromEntries(process.argv[3].split(',').map(k=>[k,ALL[k]])):ALL;
(async()=>{const b=await chromium.launch();const errs=[];
for(const [name,[w,h,mob,theme]] of Object.entries(DEV)){const ipad=name.startsWith("ipad")||name==="tab";
 const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,hasTouch:mob,isMobile:mob,screen:name==="ipad578"?{width:1180,height:820}:undefined,userAgent:ipad?"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)":undefined,colorScheme:theme});
 await ctx.route(/googleapis|gstatic|jsdelivr|cdnjs/,r=>r.abort());await ctx.addInitScript(mock+`;window.__noSheet=false;window.__mock({},2);`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));
 await p.goto('http://localhost:8765/tests/preview.html');await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
 await p.evaluate(theme=>{ui.prefs.theme=theme;saveUI();applyUI();const D=n=>fromNum(dnum(today())+n),t=dnum(today());
   const k=ALL.find(i=>/HIV/i.test(i.t)).key;window.__k=k;upd(k,s=>{s.last=D(-4);s.step=1;s.l=1;s.qt=20;s.qc=12});
   notes[k]="## Diagnóstico\n- Teste rápido e ==carga viral==.\n\n| Exame | O que detecta |\n|---|---|\n| Teste rápido | Anticorpos |\n\n## Pegadinhas\n> Pegadinha: CD4 baixo não adia a TARV — Por quê: iniciar logo reduz mortalidade\n\n## Conceitos das questões\n- **Da questão:** Homem de **34** anos com placas brancas na **borda lateral** da língua _(Simulado · 29/10)_\n  - **Resposta:** Vírus Epstein-Barr (EBV); leucoplasia pilosa oral\n  - **Por quê:** A leucoplasia pilosa é causada pelo EBV e não sai na raspagem.";
   freeN.push(frClean({id:"fl1",t:"Aula de HIV",b:"> Pegadinha: dolutegravir na gestação é liberado",tags:["aula"],ks:[k]}));
   fac.sems=[{id:"s6",name:"6º período",archived:false,lv:{}}];fac.discs=[{id:"d1",semId:"s6",name:"NCS 6 – Tutoria",div:"sp",info:{},items:[],sps:[{id:"spA",name:"SP 3.1 – Anemias",items:["O:spA"],objs:["Diferenciar anemias"],fech:D(6)}]}];
   fac.own={spA:{t:"SP 3.1 – Anemias",discId:"d1",spId:"spA",area:"CM",spec:"Hematologia e oncologia"}};if(typeof facNormalize==="function")facNormalize();saveFac();ui.profile.phase="clinico";saveUI();
   for(let i=1;i<30;i++)if(i%7!==2)foSess.push({id:"fz"+i,d:D(-i),s:Date.now(),sec:3000+i*90,m:"p",ref:"",lab:""});
   exams=[exClean({id:"e1",name:"ENARE 2023",banca:"ENARE",ano:"2023",qs:Array.from({length:20},(_,i)=>({n:i+1,k:["CM-1","PED-3","GO-2"][i%3],g:"b",q:{enunciado:"Paciente de "+(20+i)+" anos. Qual a conduta?",alternativas:[{letra:"A",texto:"Conduta A"},{letra:"B",texto:"Conduta B"},{letra:"C",texto:"Conduta C"},{letra:"D",texto:"Conduta D"}],correta:"A",comentario:"c"}}))}),exClean({id:"e2",name:"USP 2024",banca:"USP",ano:"2024",qs:[{n:1,k:"CM-1",g:"b",q:{enunciado:"x",alternativas:[{letra:"A",texto:"a"},{letra:"B",texto:"b"}],correta:"A",comentario:""}}]}),exClean({id:"e3",name:"Simulado do módulo",banca:"",ano:"2026",mod:1,qs:[{n:1,k:"CM-1",g:"b",q:{enunciado:"x",alternativas:[{letra:"A",texto:"a"},{letra:"B",texto:"b"}],correta:"A",comentario:""}}]})];
   const P=exPg("e2");P.a={0:{l:"A",d:today(),s:60}};P.fin=today();P.tries=[{d:today(),hit:1,n:1}];exSaveLocal();commit();dayPlan=null;backStack=[];setView("inicio");render()},theme);
 await p.waitForTimeout(300);
 const shot=async(tag,fn,sel)=>{await p.evaluate(fn);await p.waitForTimeout(450);const f=`${OUT}/${name}-${tag}.png`;let el=null;try{el=sel?await p.$(sel):null}catch(e){}
   const sheet=await p.$('.tfsheet');if(sheet||!el)await p.screenshot({path:f});else{await el.scrollIntoViewIfNeeded().catch(()=>{});await el.screenshot({path:f}).catch(()=>p.screenshot({path:f}))}};
 await shot("1filtros",()=>{qFOpen=true;backStack=[];setView("quest");if(typeof setQSeg==="function")setQSeg("resumo");render();scrollTo(0,0)},"#qFBar");
 await shot("2anotacao",()=>{qFOpen=false;nOpen.add(__k);backStack=[];setView("notas");setNSeg("livre");render();const x=document.getElementById("nc-"+__k);if(x)x.scrollIntoView()},"#nc-"+"CM-15");
 await shot("3levar",()=>{let box=document.getElementById("__qb");if(box)box.remove();box=document.createElement("section");box.id="__qb";box.className="card";document.getElementById("viewNotas").prepend(box);
   const Q={enunciado:"Homem de 34 anos com placas brancas na borda lateral da língua que não saem na raspagem. Qual o agente?",alternativas:[{letra:"A",texto:"Candida",porque:"Sai na raspagem."},{letra:"B",texto:"EBV",porque:""},{letra:"C",texto:"HTLV-1",porque:"Causa paraparesia."}],correta:"B",comentario:"A leucoplasia pilosa é do EBV.",conceito:""};
   box.appendChild(qActsEl(Q,"C",{k:__k,src:"Simulado"}));box.querySelector('[id^="qan-"]').click();box.innerHTML="";box.appendChild(qActsEl(Q,"C",{k:__k,src:"Simulado"}));scrollTo(0,0)},"#__qb");
 await shot("4pegadinhas",()=>{const b2=document.getElementById("__qb");if(b2)b2.remove();setNSeg("pegadinhas");render();const x=document.querySelector(".npeg");if(x)x.scrollIntoView()},".npeg");
 await shot("5ler",()=>{setNSeg("livre");imgStart(null);imgR.files.push({name:"Aula.docx",kind:"docx",txt:"x".repeat(52000)},{name:"velho.doc",kind:"old",txt:"",err:"Arquivo .doc antigo: salve como .docx ou PDF."});imgR.status="ready";render();const x=document.getElementById("imgPanel");if(x)x.scrollIntoView()},"#imgPanel");
 await shot("6provas",()=>{imgR=null;backStack=[];setView("quest");if(typeof setQSeg==="function")setQSeg("praticar");render();const x=document.querySelector(".qexam");if(x)x.scrollIntoView()},".qexam");
 await shot("7jogar",()=>{exStart(exams[0],"e");exAnswer(exams[0],0,"B");render();const x=document.querySelector(".qexam");if(x)x.scrollIntoView()},".qexam");
 await shot("8conferir",()=>{exRun=null;const pages=[];for(let i=1;i<=4;i++)pages.push({n:i,t:"Questão "+i,img:false});imp={st:"review",pages,keyPg:[],name:"Simulado",banca:"",ano:"",qs:[1,2,3].map(n=>exQClean({n,p:n,pe:n,k:n===2?"":"CM-1",g:n===3?"c":"b",q:{enunciado:"Caso "+n,alternativas:[{letra:"A",texto:"a"},{letra:"B",texto:"b"}],correta:"A",comentario:"c"}})),done:new Set([1,2,3,4]),fail:[],paste:"",keyTxt:"",figs:[],flt:"all",show:12,src:""};render();const x=document.getElementById("impPanel");if(x)x.scrollIntoView()},"#impPanel");
 await shot("9plano",()=>{imp=null;dayPlan=null;backStack=[];setView("temas");if(typeof setTSeg==="function")setTSeg("hoje");render();const x=document.querySelector(".card.today");if(x)x.scrollIntoView()},".card.today");
 await shot("10folga",()=>{const t=dnum(today());ui.prefs.wday=[180,180,180,180,180,180,180];ui.prefs.wday[wdOf(t)]=0;ui.prefs.wday[wdOf(t-2)]=0;saveUI();applyUI();errors.push({id:"ef",k:__k,w:"x",r:"y",t:"conhecimento",s:"S",d:fromNum(t-3),due:fromNum(t-1),box:1});saveErrsLocal();dayPlan=null;backStack=[];setView("inicio");render();const x=document.getElementById("iQueue");if(x)x.scrollIntoView()},"#iQueue");
 await shot("11mapa",()=>{backStack=[];setView("foco");render();const x=document.querySelector(".foheat");if(x)x.scrollIntoView()},".foheat");
 await ctx.close()}
console.log(errs.length?"ERROS: "+errs.join(" | "):"ok");await b.close()})();
