// capturas do Lote 20D › provas na íntegra (não é teste). Uso: node shots20d.js <pasta> [antes|depois|ambos] [fone,note]
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');
const OUT=process.argv[2]||'.';fs.mkdirSync(OUT,{recursive:true});
const VERS=(process.argv[3]||'depois')==='ambos'?['antes','depois']:[process.argv[3]||'depois'];
const ALLDEV={fone:[390,844,true],note:[1366,900,false]};
const DEV=process.argv[4]?Object.fromEntries(process.argv[4].split(',').map(k=>[k,ALLDEV[k]])):ALLDEV;
(async()=>{const b=await chromium.launch();const errs=[];
for(const ver of VERS)for(const [name,[w,h,mob]] of Object.entries(DEV)){
 const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,hasTouch:mob,isMobile:mob});
 await ctx.route(/googleapis|gstatic|jsdelivr|cdnjs/,r=>r.abort());await ctx.addInitScript(mock+`;window.__noSheet=false;window.__mock({},2);`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(ver+name+":"+e.message));
 await p.goto('http://localhost:8765/tests/'+(ver==="antes"?"preview_antes.html":"preview.html"));
 await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
 await p.evaluate(()=>{const ks=["CM-1","CM-6","CM-34","PED-3","PED-5","GO-2","CIR-7","PREV-3"];
   const mk=(id,name,banca,ano,n,mod)=>exClean({id,name,banca,ano,mod,qs:Array.from({length:n},(_,i)=>({n:i+1,k:ks[i%ks.length],g:"b",q:{enunciado:"Paciente de "+(20+i)+" anos com quadro clínico típico. Qual a conduta?",alternativas:[{letra:"A",texto:"Conduta A"},{letra:"B",texto:"Conduta B"},{letra:"C",texto:"Conduta C"},{letra:"D",texto:"Conduta D"}],correta:"A",comentario:"Comentário da questão."}}))});
   exams=[mk("e1","ENARE 2024 — Clínica","ENARE","2024",40),mk("e2","ENARE 2023","ENARE","2023",30),mk("e3","USP-SP 2024","USP","2024",30),mk("e4","Simulado de Coagulopatias","","2026",15,1)];
   const P=exPg("e1");exams[0].qs.forEach((r,i)=>{P.a[i]={l:i%3?"A":"B",d:today(),s:80}});P.fin=today();P.tries=[{d:today(),hit:27,n:40}];
   const P2=exPg("e3");for(let i=0;i<12;i++)P2.a[i]={l:"A",d:today(),s:70};exSaveLocal();commit();backStack=[];setView("quest");if(typeof setQSeg==="function")setQSeg("praticar");render()});
 await p.waitForTimeout(300);
 const shot=async(tag,fn,sel)=>{await p.evaluate(fn);await p.waitForTimeout(500);const el=sel?await p.$(sel):null;const f=`${OUT}/${ver}-${tag}-${name}.png`;if(el){await el.scrollIntoViewIfNeeded().catch(()=>{});await el.screenshot({path:f}).catch(()=>p.screenshot({path:f}))}else await p.screenshot({path:f})};
 await shot("lista",()=>{document.querySelector(".qexam").scrollIntoView()},".qexam");
 await shot("importar",()=>{const pages=[];for(let pg=1;pg<=8;pg++)pages.push({n:pg,t:`Questão ${pg}\nTexto\nA) a\nB) b\nC) c\nD) d`,img:false});
   imp={st:"review",pages,keyPg:[],name:"Simulado de Leucemias",banca:"",ano:"2026",qs:[],done:new Set([1,2,3,4,5,6,7,8]),fail:[],paste:"",keyTxt:"",figs:[],flt:"all",show:4,src:""};
   imp.qs=Array.from({length:8},(_,i)=>exQClean?exQClean({n:i+1,p:i+1,pe:i+1,k:i===2?"":"CM-36",kg:i===1,g:i===3?"c":"b",an:false,im:i===5,ck:"A",q:{enunciado:"Criança de 4 anos com palidez, petéquias e dor óssea. Hemograma com blastos. Qual o próximo passo?",alternativas:[{letra:"A",texto:"Mielograma"},{letra:"B",texto:"Biópsia de linfonodo"},{letra:"C",texto:"Tomografia"},{letra:"D",texto:"Observar"}],correta:"A",comentario:"c"}}):null);render();document.getElementById("impPanel").scrollIntoView()},"#impPanel");
 await shot("jogar",()=>{imp=null;exStart(exams[1],"p");render();document.querySelector(".qexam").scrollIntoView()},".qexam");
 await shot("resultado",()=>{const ex=exams[1],P=exPg(ex.id);ex.qs.forEach((r,i)=>{P.a[i]={l:i%4&&!/^CM-6$/.test(r.k)?"A":"C",d:today(),s:65}});exFinish(ex);render();document.querySelector(".qexam").scrollIntoView()},".qexam");
 await ctx.close()}
console.log(errs.length?"ERROS: "+errs.join(" | "):"ok");await b.close()})();
