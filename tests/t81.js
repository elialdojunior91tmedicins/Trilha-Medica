// t81: gerador de questões — instruções novas (padrão antigo migra), justificativa por alternativa e alternativas embaralhadas pelo app
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],ipad578:[578,820,true],note:[1366,768,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,screen:name==="ipad578"?{width:1180,height:820}:undefined});
 await ctx.route(/googleapis|gstatic/,r=>r.abort());
 /* instruções padrão ANTIGAS salvas no aparelho (quem nunca mudou o texto) */
 const OLD=await (async()=>{const src=fs.readFileSync(__dirname+'/../src/checklist-residencia.html','utf8');const i=src.indexOf("const OLD_PROMPTS=[`")+20;const e=[src.indexOf("`,`",i),src.indexOf("`]",i)].filter(x=>x>0);return src.slice(i,Math.min(...e))})();
 await ctx.addInitScript(([m,old])=>{if(!sessionStorage.__s){sessionStorage.__s=1;localStorage.setItem("resid-prompt-v1",old)}},[mock,OLD]);
 await ctx.addInitScript(mock+`;window.__mock({},2);window.__noShuffle=false;`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
 await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn&&sampleFn,null,{polling:100,timeout:15000});await p.waitForTimeout(300);
 const click=async s=>{await p.evaluate(s=>{const x=document.querySelector(s);if(x)x.scrollIntoView({block:"center"})},s);await (mob?p.tap(s):p.click(s));await p.waitForTimeout(150)};
 /* 1. instruções */
 ok(await p.evaluate(()=>promptText===DEFAULT_PROMPT&&/pegadinha justa/.test(promptText)&&/mesma categoria da correta/.test(promptText)),name+": quem usava o padrão antigo passa para as instruções novas");
 ok(await p.evaluate(()=>promptUp("Meu texto próprio")==="Meu texto próprio"),name+": instruções próprias não são trocadas");
 ok(await p.evaluate(()=>{const f=fixedFormat(3);return /"porque"/.test(f)&&/não cite letras/.test(f)}),name+": o formato pede o porquê de cada alternativa e nada de letras no comentário");
 ok(await p.evaluate(()=>{const t=buildPrompt(BYKEY["CM-1"],2,{});return t.indexOf("pegadinha justa")>=0&&t.indexOf('"porque"')>t.indexOf("pegadinha justa")}),name+": o pedido enviado leva as instruções e depois o formato");
 /* 2. embaralhamento: a correta continua a mesma alternativa, em letras variadas */
 const mix=await p.evaluate(()=>{const L=[],keep=[];for(let i=0;i<200;i++){const q=validQs([{enunciado:"x",alternativas:["A","B","C","D"].map(l=>({letra:l,texto:"T"+l,porque:l==="B"?"":"P"+l})),correta:"B",comentario:"c",conceito:"k",alerta:""}])[0];
   L.push(q.correta);const r=q.alternativas.find(a=>a.letra===q.correta);keep.push(r.texto==="TB"&&q.alternativas.map(a=>a.letra).join("")==="ABCD"&&q.alternativas.every(a=>a.porque===(a.texto==="TB"?"":"P"+a.texto.slice(1))))}
   const c={};L.forEach(x=>c[x]=(c[x]||0)+1);return {c,all:keep.every(Boolean)}});
 ok(mix.all,name+": depois de embaralhar, a correta e cada porquê continuam na alternativa certa e as letras ficam A–D");
 ok(Object.keys(mix.c).length===4&&Object.values(mix.c).every(v=>v>=25),name+": a correta cai nas 4 letras "+JSON.stringify(mix.c));
 ok(await p.evaluate(()=>{const q=validQs([{enunciado:"x",alternativas:[{letra:"A",texto:"a"},{letra:"A",texto:"b"}],correta:"A"}])[0];return q&&q.correta==="A"}),name+": letras repetidas não são embaralhadas (não perde a correta)");
 /* 3. no tema: gerar, errar, ver o porquê */
 await p.evaluate(()=>{sampleFn.json=async()=>[{enunciado:"Mulher de 30 anos com anemia microcítica.",alternativas:[{letra:"A",texto:"Ferritina",porque:""},{letra:"B",texto:"Eletroforese de hemoglobina",porque:"Investiga talassemia, que vem depois de excluir ferropenia."},{letra:"C",texto:"Mielograma",porque:"Invasivo; só se a investigação inicial não explicar."},{letra:"D",texto:"Coombs direto",porque:"Serve para hemólise, não para microcitose."}],correta:"A",comentario:"Ferropenia é a causa mais comum; a ferritina confirma.",conceito:"Microcitose: comece pela ferritina.",alerta:""}];
   qCount=1;detTab["CM-34"]="questoes";openTopic("CM-34");generate(BYKEY["CM-34"])});
 await p.waitForTimeout(500);
 const st=await p.evaluate(()=>{const q=gen["CM-34"].qs[0];return {n:document.querySelectorAll('.qcard .alt').length,why0:document.querySelectorAll('.qcard .altwhy').length,wrong:q.alternativas.find(a=>a.letra!==q.correta).letra,right:q.correta}});
 ok(st.n===4&&st.why0===0,name+": antes de responder, nenhuma explicação aparece");
 await p.evaluate(l=>answer(BYKEY["CM-34"],0,l),st.wrong);await p.waitForTimeout(250);
 const vis=await p.evaluate(()=>{const ws=[...document.querySelectorAll('.qcard .altwhy')];const mine=document.querySelector('.qcard .altwhy.mine');const prev=mine&&mine.previousElementSibling;
   const rightBtn=document.querySelector('.qcard .alt.right');const afterRight=rightBtn&&rightBtn.nextElementSibling;
   return {n:ws.length,mineOk:!!mine&&!!prev&&prev.classList.contains("wrong"),noRight:!(afterRight&&afterRight.classList.contains("altwhy")),com:/Ferropenia/.test(document.querySelector('.qcard').textContent)}});
 ok(vis.n===3&&vis.mineOk&&vis.noRight&&vis.com,name+": depois de errar, cada errada mostra o porquê (a marcada em destaque) e a correta mantém o comentário "+JSON.stringify(vis));
 ok(await p.evaluate(()=>{const r=redo.find(x=>x.k==="CM-34");return r&&r.q.alternativas.filter(a=>a.porque).length===3}),name+": a questão errada vai para Refazer com os porquês");
 await p.evaluate(()=>toCaderno(BYKEY["CM-34"],0));await p.waitForTimeout(200);
 ok(await p.evaluate(()=>/Por que não (a minha|.+?): /.test(drafts["CM-34"].r)),name+": levar ao caderno de erros inclui o porquê da alternativa marcada");
 ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral");
 if(name==="fone")await p.screenshot({path:`t81-${name}.png`,fullPage:false});
 /* 4. Refazer mostra os porquês; questão antiga sem porquê continua normal */
 await p.evaluate(()=>{const r=redo.find(x=>x.k==="CM-34");rdRun={ids:[r.id],i:0,hit:0,done:0};setView("quest");setQSeg("praticar");render()});await p.waitForTimeout(200);
 await p.evaluate(()=>{const q=redo.find(x=>x.k==="CM-34").q;const w=q.alternativas.find(a=>a.letra!==q.correta);[...document.querySelectorAll('.rdplay .alt')].find(b=>b.textContent.indexOf(w.texto)>=0).click()});await p.waitForTimeout(200);
 ok(await p.evaluate(()=>document.querySelectorAll('.rdplay .altwhy').length===3),name+": no Refazer, os porquês aparecem depois de responder");
 await p.evaluate(()=>{const id="old1";redo.push({id,k:"CM-1",d:today(),n:1,q:{enunciado:"Antiga",alternativas:[{letra:"A",texto:"a"},{letra:"B",texto:"b"}],correta:"B",comentario:"Comentário antigo",conceito:"",alerta:""}});rdRun={ids:[id],i:0,hit:0,done:0};render()});await p.waitForTimeout(150);
 await p.evaluate(()=>[...document.querySelectorAll('.rdplay .alt')][0].click());await p.waitForTimeout(150);
 ok(await p.evaluate(()=>document.querySelectorAll('.rdplay .altwhy').length===0&&/Comentário antigo/.test(document.querySelector('.rdplay').textContent)),name+": questão antiga (sem porquê) aparece como antes");
 await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
