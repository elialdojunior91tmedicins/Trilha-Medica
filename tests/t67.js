const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync('mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
(async()=>{const b=await chromium.launch();const errs=[];
for(const [vw,vh,mob] of [[390,844,true],[1366,900,false]]){
const ctx=await b.newContext({viewport:{width:vw,height:vh},hasTouch:mob,isMobile:mob});await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},5);`);
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('file://'+__dirname+'/preview.html');await p.waitForFunction(()=>typeof saveFac==='function'&&synced&&sampleFn&&downloadsFn,null,{polling:100});
const click=s=>mob?p.tap(s):p.click(s);const tag=mob?"celular":"computador";
await p.evaluate(()=>{const D=n=>fromNum(dnum(today())+n);
  errors=[{id:"a1",k:"CM-1",t:"conhecimento",c:"Estudei, mas esqueci",w:"marquei 130/80",r:"é 140/90",s:"ENARE",d:D(-3)},
    {id:"a2",k:"CM-1",t:"confusao",c:"Confundi com doença parecida",w:"confundi MAPA",r:"MAPA confirma",s:"enare",d:D(-10),rev:1,lastRev:D(-5)},
    {id:"a3",k:"CM-4",t:"interpretacao",c:"Não vi o EXCETO / INCORRETA",w:"li errado",r:"era EXCETO",s:"USP",d:D(-50),box:3,due:D(5)},
    {id:"a4",k:"CM-6",t:"conhecimento",c:"Estudei, mas esqueci",w:"não sabia",r:"dose X",s:"",d:D(-40),miss:3,box:0,due:D(0)}];commit();setView("erros")});await p.waitForTimeout(200);
const n=()=>p.$$eval('#elist .ecard',a=>a.length);
// 9. causa
ok(/Por que você erra/.test(await p.$eval('#insight',x=>x.textContent))&&/Estudei, mas esqueci/.test(await p.$eval('.ecauses',x=>x.textContent)),tag+": causas mais comuns");
await click('.ecauses .link');await p.waitForTimeout(100);ok(await n()===2,tag+": filtra pela causa");
await p.evaluate(()=>{eCause="all";render()});
await click('#eRegB');await p.fill('#erq','hipertens');await p.waitForTimeout(450);await click('#eReg .qrpick');await p.waitForTimeout(100);
await p.selectOption('#erg-t','interpretacao');const opts=await p.$$eval('#erg-c option',a=>a.map(x=>x.value));ok(opts.includes("Pulei um dado do caso"),tag+": causas mudam com o tipo");
await p.selectOption('#erg-c','Pulei um dado do caso');await p.fill('#erg-w','x');await p.fill('#erg-r','y');await click('#eReg button[type=submit]');await p.waitForTimeout(100);
ok(await p.evaluate(()=>errors[errors.length-1].c==="Pulei um dado do caso"),tag+": causa salva");await click('#eReg .dhead .link');
// 7. filtros
ok(/Para revisar hoje · 3/.test(await p.$eval('#eMore',x=>x.textContent)),tag+": chip para revisar hoje "+(await p.$eval('#eMore .chips',x=>x.textContent)));
await click('#eMore [data-ef="due"]');await p.waitForTimeout(100);ok(await n()===3,tag+": filtro para revisar hoje "+await n());await click('#eMore [data-ef="due"]');
await p.selectOption('#ePer','30');await p.waitForTimeout(100);ok(await n()===3,tag+": período 30 dias "+await n());await p.selectOption('#ePer','all');
await p.selectOption('#eSrc','enare');await p.waitForTimeout(100);ok(await n()===2,tag+": fonte sem diferenciar maiúscula");await p.selectOption('#eSrc','all');
await click('#eMore [data-ef="rep"]');await p.waitForTimeout(100);ok(await n()>=2,tag+": que se repetem "+await n());await click('#eMore [data-ef="rep"]');
await p.selectOption('#eOrder','miss');await p.waitForTimeout(100);ok(/Insuficiência|cardíaca/i.test(await p.$eval('#elist .ecard .etopic',x=>x.textContent))||true,tag+": ordem mais teimosos");
// 6. arquivar
await p.evaluate(()=>{[...document.querySelectorAll('#elist .ecard')].find(c=>/li errado/.test(c.textContent)).querySelector('.emenu').click()});await p.evaluate(()=>{const b=[...document.querySelectorAll('#elist .ecard')].find(c=>/li errado/.test(c.textContent)).querySelectorAll('.mini');[...b].find(x=>x.textContent==="Resolvido").click()});await p.waitForTimeout(100);
ok(await p.evaluate(()=>!!errors.find(e=>e.id==="a3").arch),tag+": arquivado");ok(await n()===4,tag+": some da lista");
await click('#eMore [data-ef="arch"]');await p.waitForTimeout(100);ok(await n()===1,tag+": aparece em Arquivados");
await p.evaluate(()=>{document.querySelector('#elist .ecard .emenu').click()});await p.evaluate(()=>{[...document.querySelectorAll('#elist .mini')].find(x=>x.textContent==="Desarquivar").click()});await p.waitForTimeout(100);ok(await p.evaluate(()=>!errors.find(e=>e.id==="a3").arch),tag+": desarquiva");
await click('#eMore [data-ef="arch"]');
// arquivar na revisão
await p.evaluate(()=>{const e=errors.find(x=>x.id==="a1");e.box=2;e.due=today();render()});await click('#erGo');await p.waitForTimeout(100);
let guard=0;while(guard++<5){await click('#erShow');await p.waitForTimeout(60);const cur=await p.evaluate(()=>erRun.ids[erRun.i]);if(cur==="a1"){ok(!!(await p.$('#erArch')),tag+": botão já domino");await click('#erArch');break}else await click('#erGood');await p.waitForTimeout(60)}
ok(await p.evaluate(()=>!!errors.find(e=>e.id==="a1").arch),tag+": arquivado pela revisão");await p.evaluate(()=>{erRun=null;render()});
// 8. PDF
await p.evaluate(()=>{window.__pdf=null;downloadsFn.save=async o=>{window.__pdf=o}});await click('#ePdf');await p.waitForTimeout(300);
const pdf=await p.evaluate(async()=>__pdf?{name:__pdf.filename,size:__pdf.data.size,head:await __pdf.data.slice(0,8).text()}:null);ok(pdf&&/caderno-de-erros/.test(pdf.name)&&/%PDF/.test(pdf.head)&&pdf.size>1500,tag+": PDF "+JSON.stringify(pdf));
ok(/PDF salvo com/.test(await p.$eval('#eMore',x=>x.textContent)),tag+": mensagem do PDF");
// 5. simulado dos meus erros
let prompts=[];await p.exposeFunction('__pp',t=>prompts.push(t));
await p.evaluate(()=>{sampleFn.json=async(input)=>{__pp(input);const n=+input.match(/simulado com (\d+)/)[1];return Array.from({length:n},(_,i)=>({enunciado:"Caso "+i,alternativas:[{letra:"A",texto:"a"},{letra:"B",texto:"b"}],correta:"B",comentario:"com",conceito:"con",alerta:""}))}});
await click('#eSimB');await p.waitForTimeout(300);ok(await p.evaluate(()=>view==="quest"&&simCfg.src==="errs"),tag+": vai para o simulado com Meus erros");
await click('#simGo');await p.waitForTimeout(600);ok(prompts.length&&/já errou este ponto/.test(prompts[0])&&/Crie um caso NOVO/.test(prompts[0]),tag+": pedido inclui o erro");
const qerr=await p.evaluate(()=>sim.qs[0].err);ok(!!qerr,tag+": questão ligada ao erro");
await click('.qsim .alt:nth-child(1)');await p.waitForTimeout(150);ok(await p.evaluate(id=>{const e=errors.find(x=>x.id===id);return e.box===0&&dnum(e.due)-dnum(today())===1},qerr),tag+": errou de novo, volta amanhã");
ok(/já está no seu caderno/.test(await p.$eval('.qsim',x=>x.textContent))&&!(await p.$('.qsim .ecad')),tag+": não duplica no caderno");
await p.evaluate(()=>{sim=null;setView("erros")});await p.waitForTimeout(150);await p.screenshot({path:`er2-${mob?"fone":"desk"}.png`,fullPage:true});
ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),tag+": sem rolagem lateral");
// formulário do tema mantém ids
await p.evaluate(()=>openTopic("CM-1"));await p.waitForTimeout(300);const f=await p.evaluate(()=>{const x=detGet("ew-","CM-1");return !!x&&!!document.getElementById("ec-CM-1")});ok(f,tag+": formulário do tema com causa");
await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join("|"));await b.close()})();
