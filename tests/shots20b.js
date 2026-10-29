// capturas do Lote 20B › filtros (não é teste). Uso: node shots20b.js <pasta> [antes|depois|ambos] [aparelhos]
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const seed=fs.readFileSync(__dirname+'/seed10.js','utf8');
const OUT=process.argv[2]||'.';fs.mkdirSync(OUT,{recursive:true});
const VERS=(process.argv[3]||'depois')==='ambos'?['antes','depois']:[process.argv[3]||'depois'];
const ALLDEV={fone:[390,844,true],note:[1366,900,false]};
const DEV=process.argv[4]?Object.fromEntries(process.argv[4].split(',').map(k=>[k,ALLDEV[k]])):ALLDEV;
const ONLY=(process.env.ONLY||'').split(',').filter(Boolean);
(async()=>{const b=await chromium.launch();const errs=[];
for(const ver of VERS)for(const [name,[w,h,mob]] of Object.entries(DEV)){
 const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,hasTouch:mob,isMobile:mob});
 await ctx.route(/googleapis|gstatic|jsdelivr|cdnjs/,r=>r.abort());await ctx.addInitScript(mock+`;window.__noSheet=false;window.__mock({},2);`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(ver+name+":"+e.message));
 await p.goto('http://localhost:8765/tests/'+(ver==="antes"?"preview_antes.html":"preview.html"));
 await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
 await p.evaluate(src=>{const module={exports:{}};eval(src);module.exports();const t=dnum(today()),D=n=>fromNum(t-n);
   const ks=ALL.map(i=>i.key).filter(k=>get(k).last).slice(0,12);
   ks.slice(0,8).forEach((k,i)=>errors.push({id:"es"+i,k,w:"Marquei C; a certa era A",r:"Conceito "+i,t:["conhecimento","confusao","interpretacao"][i%3],s:i%2?"Simulado":"ENARE",d:D(3+i*4),due:D(1),box:1,rev:1}));saveErrsLocal();
   ks.slice(0,6).forEach((k,i)=>redo.push(rdClean({id:"rq"+i,k,d:D(i),n:1+(i%3),src:["gen","sim","exam"][i%3],due:D(i%2),q:{enunciado:"Caso "+i,alternativas:[{letra:"A",texto:"a"},{letra:"B",texto:"b"}],correta:"A",comentario:"",conceito:"",alerta:""}})));rdSaveLocal();
   ks.slice(0,5).forEach((k,i)=>{notes[k]="## Definição\nTexto ==destaque== "+i+"\n\n> Pegadinha "+i})
   freeN.push(frClean({id:"f1",t:"Aula de cardio",b:"Texto",tags:["aula"],ks:[ks[0]]}),frClean({id:"f2",t:"Plantão",b:"x",tags:["plantão"],ks:[]}));
   exams.unshift(exClean({id:"exs",name:"ENARE 2024",banca:"ENARE",ano:"2024",qs:Array.from({length:8},(_,i)=>({n:i+1,k:i%3?ks[i]:"",g:i%4?"b":"c",im:i===2,q:{enunciado:"Enunciado "+(i+1),alternativas:[{letra:"A",texto:"a"},{letra:"B",texto:"b"}],correta:"A",comentario:""}}))}));
   commit();window.__hour=10;setView("inicio");render()},seed);
 await p.waitForTimeout(400);
 const shot=async(tag,fn,sel)=>{if(ONLY.length&&!ONLY.includes(tag))return;await p.evaluate(fn);await p.waitForTimeout(450);let el=null;try{el=sel?await p.$(sel):null}catch(e){}
   const f=`${OUT}/${ver}-${tag}-${name}.png`;const sheet=await p.$('.tfsheet');if(sheet){await p.screenshot({path:f})}else if(el){await el.scrollIntoViewIfNeeded().catch(()=>{});await el.screenshot({path:f}).catch(async()=>p.screenshot({path:f}))}else await p.screenshot({path:f,fullPage:false})};
 const sv=v=>{backStack=[];setView(v);render()};
 await shot("residencia",()=>{tfPanel=true;tf.lv=new Set([1]);tf.due=true;setView("temas");if(typeof setTSeg==="function")setTSeg("lista");render();document.querySelector("#tFind").scrollIntoView()},"#tFind");
 await shot("questoes-topo",()=>{qFOpen=false;qArea="CM";setView("quest");if(typeof setQSeg==="function")setQSeg("resumo");render();scrollTo(0,0)},null);
 await shot("questoes",()=>{qFOpen=true;setView("quest");if(typeof setQSeg==="function")setQSeg("temas");render();document.querySelector("#qFind").scrollIntoView()},"#qFind");
 await shot("erros",()=>{try{eFOpen=true}catch(e){}setView("erros");render();const x=document.querySelector("#eFind");if(x)x.scrollIntoView()},"#eFind");
 await shot("caderno",()=>{try{nFOpen=true}catch(e){}setView("notas");if(typeof setNSeg==="function")setNSeg("livre");render();scrollTo(0,0)},"#nFind");
 await shot("refazer",()=>{qArea="all";qFOpen=false;setView("quest");if(typeof setQSeg==="function")setQSeg("praticar");render();const x=document.querySelector(".qredo");if(x)x.scrollIntoView()},".qredo");
 await shot("simulado",()=>{simCfg.src="pick";simCfg.mode="temas";setView("quest");if(typeof setQSeg==="function")setQSeg("praticar");render();const x=document.querySelector(".simpick");if(x)x.scrollIntoView()},".simpick");
 await shot("conferir",()=>{exEdit={id:"exs",flt:"all",show:12,T:null};setView("quest");if(typeof setQSeg==="function")setQSeg("praticar");render();const x=document.querySelector(".exrev");if(x)x.scrollIntoView()},".exrev");
 await shot("estatisticas",()=>{exEdit=null;setView("stats");render();scrollTo(0,0)},".sttop");
 await shot("foco-materia",()=>{setView("foco");render();const x=document.querySelector(".fomatc");if(x)x.scrollIntoView()},".fomatc");
 await shot("pdf",()=>{pdfOpt.open=true;goSub("perfil");render();const x=document.querySelector(".pdfpan");if(x)x.scrollIntoView()},".pdfpan");
 await shot("catalogo",()=>{pdfOpt.open=false;excOpen=true;render();const x=document.querySelector("#excPanel");if(x)x.scrollIntoView()},"#excPanel");
 await shot("busca",()=>{excOpen=false;goBack();gsOpen=true;gsQ="an";renderGSearch()},null);
 await p.evaluate(()=>{gsOpen=false;renderGSearch()});
 await ctx.close()}
console.log(errs.length?"ERROS: "+errs.join(" | "):"ok");await b.close()})();
