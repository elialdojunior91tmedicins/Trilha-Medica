// t135: Lote 20A — cartões dos erros com as alternativas inteiras (e.q), cartões guardados cortados refeitos sem perder o agendamento,
// Foco › "O que você estudou?" com Esqueci/Difícil/Lembrei e aviso quando a gravação na conta falha (com Tentar de novo).
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');
const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],note:[1366,900,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const [name,[w,h,mob]] of Object.entries(DEV)){
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob});
 await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:8765/tests/preview.html');await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
 /* 1. erro com questão inteira: alternativas longas, porquê e comentário */
 const LONG="Vírus T-linfotrópico Humano tipo 1 (HTLV-1); dosagem sérica de anticorpos por ensaio imunoenzimático com confirmação por Western blot";
 const R1=await p.evaluate(LONG=>{const k=ALL[0].key,q={enunciado:"Homem de 34 anos com placas brancas na borda lateral da língua que não saem na raspagem. Qual o agente?",
     alternativas:[{letra:"A",texto:"Candida albicans",porque:"A candidíase sai na raspagem com espátula, deixando base eritematosa."},{letra:"B",texto:"Vírus Epstein-Barr; leucoplasia pilosa oral, sinal de imunodeficiência progressiva",porque:""},
       {letra:"C",texto:LONG,porque:"O HTLV-1 causa leucemia/linfoma de células T do adulto e paraparesia espástica tropical, não lesão oral em placa: aqui a pista é a placa que não sai na raspagem, típica do EBV."},{letra:"D",texto:"HPV",porque:"Causa papilomas."}],
     correta:"B",comentario:"A leucoplasia pilosa oral é causada pela reativação do EBV. Caracteriza-se por placas brancas corrugadas na borda lateral da língua que não são removíveis por raspagem. Sinaliza imunodeficiência.",conceito:"Placa branca na borda lateral da língua que não sai na raspagem = leucoplasia pilosa por EBV."};
   const D=qDraft(q,"C","Simulado");const e=eNew(k,D.w,D.r,D.t,D.s,"",D.p,{pc:D.pc,dd:D.dd,qf:D.qf});window.__e=e;
   const dr=cdErrDrafts(e),nao=dr.find(x=>x.kind==="nao"),disc=dr.find(x=>x.kind==="disc");
   return {wCut:/…/.test(e.w),hasP:!!(e.q.a.find(a=>a.l==="C")||{}).p,hasCm:!!e.q.cm,naoQ:cdPlain(nao.q),naoA:cdPlain(nao.a),discA:cdPlain(disc.a),prompt:cdErrPrompt(e)}},LONG);
 ok(R1.wCut&&R1.hasP&&R1.hasCm,name+": o erro guarda a questão inteira (porquê e comentário) mesmo com o resumo cortado");
 ok(R1.naoQ.includes(LONG)&&!/…/.test(R1.naoQ)&&/esta alternativa/.test(R1.naoQ),name+": cartão 'por que não' com a alternativa inteira em linha própria: "+R1.naoQ.slice(0,120));
 ok(/paraparesia espástica tropical/.test(R1.naoA)&&/leucoplasia pilosa oral, sinal de imunodeficiência progressiva/.test(R1.naoA),name+": resposta do cartão com o porquê inteiro e a certa inteira");
 ok(/Epstein-Barr; leucoplasia pilosa oral, sinal de imunodeficiência progressiva/.test(R1.discA)&&!/…/.test(R1.discA),name+": discriminador com a resposta inteira");
 ok(R1.prompt.includes(LONG)&&/Enunciado da questão/.test(R1.prompt)&&/Comentário da questão/.test(R1.prompt),name+": pedido ao Claude leva as alternativas inteiras, o enunciado e o comentário");
 /* 2. cartão guardado cortado é refeito, sem perder o agendamento */
 const R2=await p.evaluate(()=>{const e=window.__e,old=cdAdd(e.k,"<b>T.</b> Por que <u>não</u> Vírus T-linfotrópico Humano tipo 1 (HTLV-1); dosagem sérica de anticorpos por… neste caso?","<b>O HTLV-1 causa…</b>","eu",{h:1,kind:"nao",eid:e.id,ref:""});
   old.f={st:2,s:12,d:5,last:"2026-10-20",reps:3,lapses:0,first:"2026-10-01"};old.due="2026-11-01";
   const cl=cdAdd(e.k,"<b>T.</b> Pergunta do Claude…","<b>Resp…</b>","claude",{h:1,kind:"nao",eid:e.id});
   const n=cdFixCut(),x=cards.find(c=>c.id===old.id),y=cards.find(c=>c.id===cl.id);
   return {n,q:cdPlain(x.q),due:x.due,s:x.f.s,reps:x.f.reps,cl:cdPlain(y.q),again:cdFixCut()}});
 ok(R2.n===1&&!/…/.test(R2.q)&&/ensaio imunoenzimático/.test(R2.q),name+": cartão cortado refeito com a alternativa inteira ("+R2.q.slice(0,80)+")");
 ok(R2.due==="2026-11-01"&&R2.s===12&&R2.reps===3,name+": o agendamento do cartão continua o mesmo");
 ok(/Pergunta do Claude…/.test(R2.cl)&&R2.again===0,name+": cartão do Claude fica como está; rodar de novo não muda nada");
 /* 3. Foco › O que você estudou? com as 3 respostas */
 await p.evaluate(()=>{const k=ALL[1].key;upd(k,x=>{x.last=fromNum(dnum(today())-5);x.step=1;x.l=1});foAfterSet({id:"fx",d:today(),sec:1500,ref:"T:"+k,lab:""});window.__fk=k;setView("foco");render()});await p.waitForTimeout(300);
 const R3=await p.evaluate(()=>{const c=document.querySelector(".foafter"),k=__fk;return {g:[0,1,2].every(g=>!!c.querySelector(`.foarev #rg${g}-${k}`)),old:/lembrei bem|tive dificuldade/i.test(c.textContent),step:get(k).step}});
 ok(R3.g&&!R3.old,name+": 'O que você estudou?' mostra Esqueci, Difícil e Lembrei (sem os botões antigos)");
 await p.evaluate(()=>document.querySelector(`#rg1-${__fk}`).click());await p.waitForTimeout(200);
 const R3b=await p.evaluate(()=>{const s=get(__fk);return {last:s.last===today(),step:s.step,rg:s.rg}});
 ok(R3b.last&&R3b.step===1&&R3b.rg===1,name+": Difícil repete o intervalo (não volta a 1 dia) "+JSON.stringify(R3b));
 /* 4. gravação recusada: aviso com o motivo e Tentar de novo */
 await p.evaluate(()=>{window.__failSet=/\/exams\//;const ex=exClean({id:"exbig",name:"Prova grande",banca:"",ano:"",qs:[{n:1,q:{enunciado:"x",alternativas:[{letra:"A",texto:"a"},{letra:"B",texto:"b"}],correta:"A"}}]});exams.unshift(ex);exPut(ex);setView("inicio");render()});await p.waitForTimeout(300);
 const R4=await p.evaluate(()=>{const t=document.getElementById("svFail");return t?{vis:t.offsetHeight>0,tx:t.textContent}:null});
 ok(R4&&R4.vis&&/Prova grande/.test(R4.tx)&&/1 MB/.test(R4.tx)&&/neste aparelho/.test(R4.tx),name+": aviso de gravação recusada com o motivo "+(R4?R4.tx.slice(0,140):""));
 await p.evaluate(()=>{window.__failSet=null;document.getElementById("svRetry").click()});await p.waitForTimeout(300);
 const R5=await p.evaluate(()=>({gone:!document.getElementById("svFail"),saved:!!window.__store[Object.keys(window.__store).find(k=>/\/exams\/exbig$/.test(k))]}));
 ok(R5.gone&&R5.saved,name+": Tentar de novo grava e o aviso some "+JSON.stringify(R5));
 await ctx.close()}
ok(!errs.length,"sem erros de JavaScript "+errs.join(" | "));await b.close()})();
