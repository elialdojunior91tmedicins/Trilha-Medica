// t127: Lote 18 › Questões (seção 5) — bloco rápido de 5 no Simulado misto (temas da semana) e provas da faculdade como modelo de estilo
// (gerador do tema da faculdade e simulado "Da minha faculdade")
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],note:[1366,900,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob});
  await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
  await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
  const tap=async sel=>{await p.evaluate(s=>document.querySelector(s).scrollIntoView({block:"center"}),sel);await (mob?p.tap(sel):p.click(sel));await p.waitForTimeout(200)};
  await p.evaluate(()=>{const t=dnum(today());["CM-1","CM-7"].forEach(k=>upd(k,x=>{x.last=today();x.step=0;x.l=1;x.ed=[today()]}));upd("CM-12",x=>{x.last=fromNum(t-30);x.step=1;x.l=1;x.ed=[fromNum(t-30)]});commit();
    window.__P=[];let c=0;sampleFn.json=async(i,o)=>{window.__P.push(i);const n=+((i.match(/Crie (\d+)/)||i.match(/com (\d+) quest/)||[0,3])[1]);return Array.from({length:n},()=>({enunciado:"Caso "+(++c),alternativas:["A","B","C","D"].map(l=>({letra:l,texto:"Alt "+l})),correta:"B",comentario:"c",conceito:"Conceito "+c,alerta:""}))};backStack=[];setView("quest");setQSeg("praticar");render()});
  /* 1. bloco rápido */
  let r=await p.evaluate(()=>{const q=document.querySelector(".simquick");return q&&{t:q.textContent,btn:!!document.getElementById("simQuick")}});
  ok(r&&r.btn&&/Misturando 2 dos 2 temas que você estudou ou revisou nesta semana/.test(r.t),name+": bloco rápido no topo do Simulado misto: "+(r&&r.t));
  await tap('#simQuick');await p.waitForFunction(()=>sim&&sim.status==="run",null,{timeout:8000}).catch(()=>{});
  r=await p.evaluate(()=>({n:sim&&sim.items.length,ks:[...new Set(sim.items.map(x=>x.k))].sort().join(),src:sim.src,cfg:simCfg.n}));
  ok(r.n===5&&r.ks==="CM-1,CM-7"&&r.src==="week",name+": um toque: 5 questões misturando os temas da semana "+JSON.stringify(r));
  await p.evaluate(()=>{sim.stopped=true;sim=null;simCfg.n=10;render()});
  /* 2. prova da faculdade como modelo */
  await p.evaluate(()=>{const A=(t)=>["A","B","C","D"].map(l=>({letra:l,texto:t+" "+l}));exams=[exClean({id:"exf",name:"P1 NCS 5",qs:[
      {n:1,k:"CM-1",g:"b",q:{enunciado:"Mulher de 45 anos procura a UBS com cefaleia há 3 meses, pior pela manhã, PA 168/104 mmHg em duas medidas. Qual a conduta inicial mais adequada?",alternativas:A("Conduta"),correta:"B"}},
      {n:2,k:"CM-7",g:"b",q:{enunciado:"Homem de 60 anos, tabagista, refere dor torácica em aperto há 40 minutos. ECG com supradesnível de ST em DII, DIII e aVF. Todas as condutas abaixo são adequadas, EXCETO:",alternativas:A("Opção"),correta:"C"}},
      {n:3,k:"CM-1",g:"b",q:{enunciado:"Paciente de 30 anos comparece para consulta de rotina com pressão arterial limítrofe. Qual o próximo passo?",alternativas:A("Passo"),correta:"A"}}]})];exSaveLocal();render()});
  r=await p.evaluate(()=>({b:!!document.getElementById("exmod-exf"),sty:[...document.querySelectorAll('[id^="simE-"]')].map(x=>x.id).join()}));
  ok(r.b&&!/simE-fac/.test(r.sty),name+": prova importada tem o botão Usar como modelo; sem modelo, o simulado não oferece o estilo da faculdade");
  await tap('#exmod-exf');
  r=await p.evaluate(()=>({mod:exams[0].mod,lab:document.getElementById("exmod-exf").textContent,fac:!!document.getElementById("simE-fac"),txt:facStyleTxt()}));
  ok(r.mod===1&&r.lab==="✓ Modelo da faculdade"&&r.fac,name+": marcar como modelo liga o estilo Da minha faculdade no simulado");
  ok(/Exatamente 4 alternativas \(A, B, C, D\)/.test(r.txt)&&/maioria em forma de caso clínico/.test(r.txt)&&/comando negativo/.test(r.txt)&&/Exemplo 1: Mulher de 45 anos/.test(r.txt),name+": o estilo vem da prova: 4 alternativas, caso clínico, comando negativo e exemplos de formato");
  await tap('#simE-fac');await tap('#simS-week');await tap('#simGo');await p.waitForFunction(()=>sim&&sim.status==="run",null,{timeout:8000}).catch(()=>{});
  r=await p.evaluate(()=>({p:window.__P[window.__P.length-1]||"",est:sim&&sim.cfg.est}));
  ok(/Estilo da faculdade do estudante/.test(r.p)&&r.est==="fac",name+": o simulado no estilo da faculdade leva o modelo no pedido ao Claude");
  await p.evaluate(()=>{sim.stopped=true;sim=null;render()});
  /* 3. gerador do tema ligado à faculdade: estilo da faculdade por padrão */
  r=await p.evaluate(async()=>{fac={sems:[{id:"s",name:"6º",archived:false}],discs:[{id:"d",semId:"s",name:"NCS",items:["T:CM-1"],sps:[]}],provas:[],own:{}};saveFac();
    detTab["CM-1"]="questoes";detTab["CM-12"]="questoes";openTopic("CM-1");render();const a=document.getElementById("qsty-CM-1-fac");const on=a&&a.getAttribute("aria-pressed");
    window.__P=[];await generate(BYKEY["CM-1"]).catch(()=>{});const pr=window.__P[0]||"";openTopic("CM-12");render();const b2=document.getElementById("qsty-CM-12-res");return {on,pr:/Estilo da faculdade do estudante/.test(pr),res:b2&&b2.getAttribute("aria-pressed")}});
  ok(r.on==="true"&&r.res==="true",name+": gerador: tema da faculdade começa no estilo da faculdade; os outros, no da residência");
  ok(r.pr,name+": o pedido do gerador leva o estilo da faculdade");
  ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral");
  await ctx.close()}
ok(errs.length===0,"sem erros de JavaScript"+(errs.length?": "+errs.slice(0,3).join(" | "):""));
await b.close()})();
