// t138: Lote 20D — provas na íntegra: partes de até 20 questões (ou 20 páginas) no site, sem partir questão; numeração que recomeça volta para
// páginas; resposta cortada pede só as que faltaram; gabarito comentado maior; página real de cada questão; o bridge aproveita JSON cortado;
// visual (passos da importação, busca/filtros/grupos, acerto por área no cartão, mapa e relógio ao lado, "onde perdeu pontos" em destaque, conferir).
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');
const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
/* 1. bridge: aproveita os objetos completos de um JSON cortado */
{const src=fs.readFileSync(__dirname+'/../bridge.js','utf8'),m=src.match(/function salvage\(t\) \{[\s\S]*?\n  \}/);let salvage=null;try{eval(m[0].replace("function salvage","salvage=function"))}catch(e){}
 const cut='Aqui está:\n[{"numero":1,"enunciado":"a {chave} \\"x\\"","alternativas":[]},{"numero":2,"enunciado":"b","alternativas":[]},{"numero":3,"enunciado":"c com o texto cort';
 const r=salvage&&salvage(cut);ok(r&&r.length===2&&r[1].numero===2&&/\{chave\}/.test(r[0].enunciado),"bridge: resposta cortada aproveita as questões completas ("+(r?r.length:0)+")")}
const DEV={fone:[390,844,true],note:[1366,900,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const [name,[w,h,mob]] of Object.entries(DEV)){
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob});
 await ctx.route(/googleapis|gstatic|jsdelivr|cdnjs/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:8765/tests/preview.html');await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
 /* prova falsa: 60 questões, 2 por página (a 21 começa na mesma página em que a 20 termina), gabarito comentado da própria prova */
 const R0=await p.evaluate(()=>{window.__site=true;const pages=[];let n=1;for(let pg=1;pg<=30;pg++){let t="";for(let k=0;k<2;k++){t+=`Questão ${n}\nCaso clínico ${n} com texto longo de enunciado. ${"Paciente com achados. ".repeat(20)}\nA) alfa\nB) beta\nC) gama\nD) delta\n`;n++}pages.push({n:pg,t,img:false})}
   const kp="GABARITO COMENTADO\n"+Array.from({length:60},(_,i)=>`RESPOSTA ${i+1} — Correta: B\nJustificativa B: ${"explicação da banca ".repeat(60)}`).join("\n");pages.push({n:31,t:kp,img:false});
   imp={st:"ready",pages,keyPg:[31],name:"Prova grande",banca:"",ano:"",qs:[],done:new Set(),fail:[],paste:"",keyTxt:"",figs:[],flt:"all",show:12};
   const B=impBlocks(imp);return {B:B.map(x=>({qa:x.qa,qz:x.qz,a:x.pages[0],z:x.pages[x.pages.length-1]})),pr:impPrompt(imp,B[0],impKey(imp)),qs:imp.qStart&&imp.qStart[21]}});
 ok(R0.B.length===3&&R0.B[0].qa===1&&R0.B[0].qz===20&&R0.B[1].qa===21&&R0.B[2].qz===60,name+": site: partes de 20 questões "+JSON.stringify(R0.B));
 ok(R0.B[0].z===R0.B[1].a,name+": a página com o fim da 20 e o começo da 21 vai nas duas partes");
 ok(/SOMENTE as questões de número 1 a 20/.test(R0.pr)&&!/CONTINUAÇÃO \(página/.test(R0.pr),name+": pedido diz quais questões transcrever (sem o trecho CONTINUAÇÃO)");
 ok((R0.pr.match(/RESPOSTA \d+ — Correta/g)||[]).length===20,name+": o gabarito comentado das 20 questões vai inteiro na parte");
 /* artefato: partes menores */
 ok(await p.evaluate(()=>{window.__site=false;const B=impBlocks(imp);window.__site=true;return B.every(x=>x.pages.length<=5)&&B.length>3}),name+": artefato continua com partes menores (até 5 páginas)");
 /* numeração que recomeça (por área) → partes por páginas */
 ok(await p.evaluate(()=>{const pages=[];for(let pg=1;pg<=12;pg++){const n=((pg-1)%6)+1;pages.push({n:pg,t:`Questão ${n}\nTexto\nA) a\nB) b`,img:false})}const R={pages,keyPg:[],qs:[]};const B=impBlocks(R);return !R.qStart&&B.every(x=>!x.qa)}),name+": numeração que recomeça por área: partes por páginas");
 /* leitura: resposta cortada pede só as que faltaram; página real de cada questão */
 const R1=await p.evaluate(async()=>{window.__calls=[];sampleFn.json=async(input,o)=>{const m=input.match(/SOMENTE as questões de número (\d+) a (\d+)/),a=+m[1],z=+m[2];window.__calls.push([a,z]);
     const zz=__calls.length===1?a+11:z;/* a 1ª resposta vem cortada na 12ª */return Array.from({length:zz-a+1},(_,i)=>({numero:a+i,enunciado:"Caso "+(a+i),alternativas:[{letra:"A",texto:"alfa"},{letra:"B",texto:"beta"},{letra:"C",texto:"gama"},{letra:"D",texto:"delta"}],correta:"B",gabarito:"banca",temas:["CM-1"],comentario:"c",conceito:"k"}))};
   await impRead();return {n:imp.qs.length,calls:__calls,st:imp.st,p21:imp.qs.find(r=>r.n===21).p,p22:imp.qs.find(r=>r.n===22).p,pe1:imp.qs.find(r=>r.n===1).pe}});
 ok(R1.n===60&&R1.st==="review",name+": a prova inteira chega mesmo com uma resposta cortada ("+R1.n+")");
 ok(JSON.stringify(R1.calls[1])==="[13,20]",name+": depois da resposta cortada, pede só as que faltaram "+JSON.stringify(R1.calls));
 ok(R1.p21===11&&R1.p22===11&&R1.pe1===1,name+": cada questão fica com a página real (para a figura) "+JSON.stringify([R1.p21,R1.p22,R1.pe1]));
 /* visual: passos e conferir */
 await p.evaluate(()=>{imp.qs[3].g="c";imp.qs[4].k="";backStack=[];setView("quest");setQSeg("praticar");render()});await p.waitForTimeout(200);
 const V1=await p.evaluate(()=>({steps:[...document.querySelectorAll(".impsteps li")].map(l=>l.className+":"+l.textContent).join("|"),prob:[...document.querySelectorAll("#impPanel li.exq.chk .exprob")].map(x=>x.textContent)}));
 ok(/done:✓Arquivo/.test(V1.steps)&&/cur:4Conferir/.test(V1.steps),name+": passos da importação com o atual marcado "+V1.steps);
 ok(V1.prob.some(t=>/gabarito é do Claude/.test(t))&&V1.prob.some(t=>/escolha o tema/.test(t)),name+": conferir mostra o problema no topo da questão");
 await p.evaluate(()=>{imp.qs.forEach(r=>{r.g="b";r.k="CM-1"});impSave()});await p.waitForFunction(()=>!imp,null,{timeout:8000});
 /* lista: busca, filtros e grupos */
 await p.evaluate(()=>{const mk=(id,name,banca,ano,mod)=>exClean({id,name,banca,ano,mod,qs:Array.from({length:6},(_,i)=>({n:i+1,k:i<3?"CM-1":"PED-3",g:"b",q:{enunciado:"x",alternativas:[{letra:"A",texto:"a"},{letra:"B",texto:"b"}],correta:"A",comentario:""}}))});
   exams.push(mk("exa","ENARE 2023","ENARE","2023"),mk("exb","USP 2024","USP","2024"),mk("exc","Prova do módulo","","2026",1));const P=exPg("exa");exams.find(e=>e.id==="exa").qs.forEach((r,i)=>{P.a[i]={l:i%2?"B":"A",d:today(),s:60}});P.fin=today();P.tries=[{d:today(),hit:3,n:6}];exSaveLocal();render()});await p.waitForTimeout(200);
 const V2=await p.evaluate(()=>({q:!!document.querySelector("#exQ"),st:[...document.querySelectorAll('[id^="exSt-"]')].map(b=>b.textContent).join("|"),grp:[...document.querySelectorAll(".exgrp span")].map(x=>x.textContent),mini:(document.querySelector("#exr-exa .exmini")||{}).textContent||"",fac:!!document.querySelector("#exFac")}));
 ok(V2.q&&/Feitas · 1/.test(V2.st)&&V2.fac,name+": busca, situação com contagem e filtro Da faculdade "+V2.st);
 ok(V2.grp.includes("ENARE")&&V2.grp.includes("USP")&&V2.grp[V2.grp.length-1]==="Sem banca",name+": provas agrupadas por banca "+V2.grp.join(","));
 ok(/CM/.test(V2.mini)&&/%/.test(V2.mini),name+": prova feita mostra o acerto por área em miniatura "+V2.mini);
 await p.evaluate(()=>document.querySelector('[id^="exB-"]').click());await p.waitForTimeout(150);
 ok(await p.evaluate(()=>document.querySelectorAll(".excard").length===1),name+": filtro por banca");
 await p.evaluate(()=>{exF={q:"",st:"all",b:"",fac:false};exFSave();render()});
 /* jogador: mapa e relógio ao lado no computador */
 await p.evaluate(()=>{exStart(exams.find(e=>e.id==="exb"),"p")});await p.waitForTimeout(1300);
 const V3=await p.evaluate(()=>({side:!!document.querySelector(".explay.exside .exaside .exmap"),clock:(document.getElementById("exClock")||{}).textContent||"",det:!!document.querySelector(".exmapd")}));
 if(name==="note")ok(V3.side&&/^\d+:\d\d$/.test(V3.clock)&&!V3.det,name+": no computador o mapa fica ao lado, com o relógio "+V3.clock);
 else ok(!V3.side&&V3.det,name+": no celular o mapa continua recolhido embaixo");
 /* resultado: onde perdeu pontos primeiro */
 await p.evaluate(()=>{const ex=exams.find(e=>e.id==="exb"),P=exPg("exb");ex.qs.forEach((r,i)=>{P.a[i]={l:"B",d:today(),s:50}});exFinish(ex)});await p.waitForTimeout(200);
 const V4=await p.evaluate(()=>{const l=document.querySelector(".exlostbox"),a=document.querySelector(".exareas");return {l:!!l,order:l&&a?!!(l.compareDocumentPosition(a)&Node.DOCUMENT_POSITION_FOLLOWING):!!l}});
 ok(V4.l&&V4.order,name+": resultado com 'Onde você perdeu pontos' em destaque, antes do gráfico por área");
 ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral");
 await ctx.close()}
ok(!errs.length,"sem erros de JavaScript "+errs.join(" | "));await b.close()})();
