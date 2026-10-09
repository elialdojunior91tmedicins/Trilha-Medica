const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync('mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],ipad578:[578,820,true],tabEmPe:[820,1180,true],tabDeitado:[1180,820,true],note:[1366,768,false],monitor:[1920,1080,false]};
const only=process.argv[2];
(async()=>{const b=await chromium.launch();const errs=[];
for(const [name,[w,h,mob]] of Object.entries(DEV)){if(only&&!only.split(",").includes(name))continue;const ipad=name==="ipad578"||name.startsWith("tab");const big=["tabDeitado","note","monitor"].includes(name);
const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,screen:name==="ipad578"?{width:1180,height:820}:undefined,userAgent:ipad?"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)":undefined});await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('file://'+__dirname+'/preview.html');await p.waitForFunction(()=>typeof saveFac==='function'&&synced&&sampleFn,null,{polling:100});
const click=s=>mob?p.tap(s):p.click(s);const txt=s=>p.$eval(s,x=>x.textContent);
await p.evaluate(()=>{const D=n=>fromNum(dnum(today())+n);
 fac={sems:[{id:"s",name:"6° Semestre",archived:false}],discs:[{id:"d",semId:"s",name:"NCS 6",items:[],info:{tipo:"Tutoria"},
 eixos:[{id:"e1",name:"Eixo de Hematologia",area:"CM",spec:"Hematologia e oncologia"},{id:"e2",name:"Eixo de Cardiologia",area:"CM",spec:"Cardiologia"}],
 sps:[{id:"sp1",name:"SP 2.1 Hemostasia",eixoId:"e1",items:["T:CM-37","O:c"],objs:["Descrever a cascata"]},{id:"sp2",name:"SP 2.2 Anemias",eixoId:"e1",items:["T:CM-34"],objs:[]},{id:"sp3",name:"SP 3.1 Insuficiência cardíaca",eixoId:"e2",items:["T:CM-4"],objs:[]}]},
 {id:"d2",semId:"s",name:"Habilidades Médicas VI",items:["T:CM-1","T:CM-6"],info:{}}],
 provas:[{id:"p1",discId:"d",name:"Prova do NCS 6",date:D(10),items:["T:CM-37","O:c","T:CM-34","T:CM-4"],done:[]},{id:"p0",discId:"d2",name:"OSCE 1",date:D(-2),items:["T:CM-1","T:CM-6"],done:[]}],
 own:{c:{t:"Cascata da coagulação",discId:"d",spId:"sp1"}}};saveFac();fac.discs[0].sps.forEach(syncObjs);
 state["CM-37"]={l:1,last:D(-3),step:1};state["CM-34"]={l:2,last:D(-8),step:2};
 foSess.unshift({id:"fx",d:today(),s:new Date().toISOString(),sec:3600,m:"p",ref:"T:CM-37",lab:"x"});
 facOpenSem.add("s");facOpenDisc.add("d");facOpenSP.add("sp1");commit();setView("fac")});await p.waitForTimeout(250);
// 1. painel
const pan=await txt('#facProvas');ok(/Prova do NCS 6/.test(pan)&&/2 de 4 conteúdos prontos/.test(pan)&&/1 a cada 4 dias/.test(pan),name+": painel com prontidão e ritmo");
ok(/Próximo: Cetoacidose diabética|Próximo: Cascata da coagulação/.test(pan),name+": próximo conteúdo "+(pan.match(/Próximo: [^E]+/)||[""])[0]);
ok(await p.evaluate(()=>{const a=document.getElementById("facProvas").getBoundingClientRect(),b=document.getElementById("facSems").getBoundingClientRect();return a.top<b.top||a.left>b.left}),name+": painel acima (ou ao lado) das pastas");
if(big)ok(await p.evaluate(()=>document.getElementById("facProvas").getBoundingClientRect().left>document.getElementById("facSems").getBoundingClientRect().right-5),name+": duas colunas");
// 8. limpeza
ok(!(await p.$('.fhowto')),name+": sem caixa de explicação");ok(!/Prova do NCS 6/.test(await txt('#sp-sp1 .meta')),name+": SP sem selo de prova");
// 7. foco
ok(/1h00 na semana/.test(await txt('#fd-d .fdmeta')),name+": foco da semana na disciplina");
ok(await p.evaluate(()=>!!document.getElementById("facWeek").offsetParent)===big,name+": cartão foco da semana "+(big?"visível":"oculto"));
// 6. materiais
await click('#fd-d .fdtools .mini:nth-child(3)');await p.waitForTimeout(100);await p.fill('#flu-dd','drive.google.com/pasta-ncs');await p.fill('#flt-dd','Slides do NCS');await click('#fd-d .flform button[type=submit]');await p.waitForTimeout(100);
const lk=await p.evaluate(()=>fac.discs[0].links);ok(lk&&lk[0].u==="https://drive.google.com/pasta-ncs"&&lk[0].t==="Slides do NCS",name+": material salvo");
ok(await p.evaluate(()=>{const a=document.querySelector('#fd-d .flinks a');return a&&a.target==="_blank"&&/Slides do NCS/.test(a.textContent)}),name+": link abre em nova aba");
await p.evaluate(()=>{facNew["lkssp1"]={t:"",u:"x"};render()});await p.fill('#flu-ssp1','nada');await click('#sp-sp1 .flform button[type=submit]');await p.waitForTimeout(80);ok(/não parece válido/.test(await txt('#sp-sp1 .flinks')),name+": link inválido avisa");
await p.fill('#flu-ssp1','https://pubmed.ncbi.nlm.nih.gov/123');await click('#sp-sp1 .flform button[type=submit]');await p.waitForTimeout(80);ok(await p.evaluate(()=>fac.discs[0].sps[0].links.length===1),name+": material na SP");
// 3. depois da prova
ok(/Como foi\?/.test(await txt('#fpr-p0')),name+": pergunta como foi a prova");
await p.fill('#fpn-r-p0','7,5');await p.evaluate(()=>{[...document.querySelectorAll('#fpr-p0 .chip')][0].click()});await p.waitForTimeout(100);
await p.fill('#fpe-w','Caiu na prova: manobra X');await p.fill('#fpe-r','é a manobra Y');await click('#fpr-p0 button[type=submit]');await p.waitForTimeout(120);
ok(await p.evaluate(()=>errors.some(e=>e.s==="OSCE 1"&&e.k==="CM-1")),name+": erro da prova no caderno");ok(/1 erro levado/.test(await txt('#fpr-p0')),name+": confirmação");
await click('#fpr-p0 .btn.primary');await p.waitForTimeout(100);const res=await p.evaluate(()=>fac.provas.find(x=>x.id==="p0").res);ok(res&&res.n===7.5&&res.of===10&&res.e===1,name+": nota salva "+JSON.stringify(res));
ok(!(await p.$('#fpr-p0')),name+": pergunta some depois");
// 1. estudar o próximo
await click('#fpd-p1 .btn.primary');await p.waitForTimeout(300);const st=await p.evaluate(()=>({run:!!foRun,ref:foRun&&foRun.ref,open:openKey,li:!!document.querySelector('#viewFac li.t.open'),v:view}));
ok(st.run&&st.v==="fac"&&st.li&&st.ref==="T:"+st.open,name+": estudar o próximo abre e liga o foco "+JSON.stringify(st));
await p.evaluate(()=>{foRun=null;try{localStorage.removeItem("resid-focus-run")}catch(e){}render()});
// 2. simulado da prova
let prompts=[];await p.exposeFunction('__pp2',t=>prompts.push(t));
await p.evaluate(()=>{sampleFn.json=async(input)=>{__pp2(input);const n=+input.match(/simulado com (\d+)/)[1];return Array.from({length:n},(_,i)=>({enunciado:"Caso "+i,alternativas:[{letra:"A",texto:"a"},{letra:"B",texto:"b"}],correta:"B",comentario:"c",conceito:"k",alerta:""}))}});
await p.evaluate(()=>{setView("fac")});await p.waitForTimeout(100);await p.evaluate(()=>{[...document.querySelectorAll('#fpd-p1 .btn')].find(b=>/Simulado/.test(b.textContent)).click()});await p.waitForTimeout(250);
ok(await p.evaluate(()=>view==="quest"&&simCfg.src==="prova"),name+": vai ao simulado com a prova escolhida");
ok(/Prova: Prova do NCS 6 · 4/.test(await txt('.qsim .chips')),name+": opção Prova no simulado");
await click('#simGo');await p.waitForTimeout(600);ok(prompts.length&&/para a prova "Prova do NCS 6" da disciplina NCS 6/.test(prompts[0]),name+": pedido com o contexto da prova");
ok(await p.evaluate(()=>sim&&sim.qs.every(q=>["CM-37","F-c","CM-34","CM-4"].includes(q.k))),name+": questões só do conteúdo da prova");
await p.evaluate(()=>{sim=null;setView("fac")});await p.waitForTimeout(150);await p.screenshot({path:`fac5-${name}.png`});
// nota na prova realizada
await p.evaluate(()=>{facOpenProv.add("s");facShowPast.add("s");render()});ok(/nota 7,5 de 10/.test(await txt('#fp-p0')),name+": nota aparece na prova realizada");
ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral");
await p.waitForTimeout(900);const saved=await p.evaluate(()=>JSON.stringify(Object.values(__store).find(v=>v&&v.discs)||{}));ok(/drive.google.com/.test(saved)&&/"res":/.test(saved),name+": salvo na conta");
await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join("|"));await b.close()})();
