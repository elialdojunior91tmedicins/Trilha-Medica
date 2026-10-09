const {chromium}=require('playwright');const fs=require('fs');const {execSync}=require('child_process');const mock=fs.readFileSync('mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
(async()=>{const b=await chromium.launch();const errs=[];
const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},5);`);
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('file://'+__dirname+'/preview.html');await p.waitForFunction(()=>typeof saveFac==='function'&&synced,null,{polling:100});
await p.evaluate(()=>{localStorage.clear();const D=n=>fromNum(dnum(today())+n);
 state={"CM-37":{l:2,last:D(-9),step:1,qt:20,qc:9},"CM-6":{l:1,last:D(-1),step:0,qt:10,qc:7},"PED-3":{l:3,last:D(-3),step:4,qt:30,qc:27},"CIR-1":{l:1,last:D(-40),step:0,qt:12,qc:5}};
 hist={};hist[D(-1)]={e:2,q:10,c:7};hist[D(-3)]={r:3,q:20,c:15};hist[D(-50)]={e:1,q:12,c:5};
 errors=[{id:"e1",k:"CM-37",d:D(-2),t:"conhecimento",w:"PTT com coagulograma alterado",r:"Na PTT o coagulograma é normal",s:"PTT e SHU"},{id:"e2",k:"CM-37",d:D(-12),t:"confusao",w:"PTI x PTT",r:"PTI isolada",s:"PTI"},{id:"e3",k:"CM-6",d:D(-1),t:"interpretacao",w:"Não vi o exceto",r:"Pedia o que NÃO fazer",s:""},{id:"e4",k:"CIR-1",d:D(-45),t:"conhecimento",w:"XABCDE",r:"X antes de A",s:""}];
 fac={sems:[{id:"s",name:"6° Semestre",archived:false}],discs:[{id:"d",semId:"s",name:"NCS 6",items:["T:CM-37","T:CM-34"],info:{},eixos:[],sps:[]}],provas:[],own:{}};saveFac();commit();
 downloadsFn={save:async({filename,data})=>{const ab=await data.arrayBuffer();window.__saved={filename,b64:btoa(String.fromCharCode(...new Uint8Array(ab)))}}};setView("perfil")});
await p.waitForTimeout(150);await p.tap('#pfBody button:has-text("Exportar PDF")');
const per=await p.$$eval('.pdfpan .cfrow:has-text("Período") .seg button',x=>x.map(e=>e.textContent));ok(per.join(",")==="7 dias,14 dias,21 dias,30 dias,60 dias,90 dias,Tudo","períodos: "+per.join(","));
const gen=async(f)=>{await p.evaluate(()=>{window.__saved=null});await p.tap('.pdfpan button:has-text("Gerar PDF")');await p.waitForFunction(()=>window.__saved,null,{timeout:5000});const v=await p.evaluate(()=>window.__saved);fs.writeFileSync(f,Buffer.from(v.b64,'base64'));return execSync(`pdftotext -layout ${f} -`).toString()};
// 7 dias: só e1 e e3
await p.tap('.pdfpan button:has-text("7 dias")');let t=await gen('f7.pdf');ok(/últimos 7 dias/.test(t)&&/PTT com coagulograma/.test(t)&&/Não vi o exceto/.test(t)&&!/PTI x PTT/.test(t)&&!/XABCDE/.test(t),"7 dias filtra os erros do período");
// quantidade específica
await p.fill('#pdf-dias','45');await p.dispatchEvent('#pdf-dias','change');t=await gen('f45.pdf');ok(/últimos 45 dias/.test(t)&&/PTI x PTT/.test(t)&&!/XABCDE/.test(t),"45 dias digitados (erro de 45 dias atrás fica fora)");
// matérias
await p.tap('.pdfmat summary');await p.fill('#pdf-matq','hemato');await p.waitForTimeout(150);
const shown=await p.$$eval('.pdfm span',x=>x.map(e=>e.textContent));ok(shown.some(s=>/Hematologia/.test(s))&&!shown.some(s=>/Cardiologia/.test(s)),"busca de matérias: "+shown.join(","));
await p.tap('.pdfm:has-text("Hematologia")');await p.fill('#pdf-matq','');await p.waitForTimeout(100);
await p.tap('.pdfpan button:has-text("Tudo")');t=await gen('fm.pdf');
ok(/Matérias: Hematologia/.test(t)&&/Resumo das matérias escolhidas/.test(t)&&/PTT com coagulograma/.test(t)&&!/Não vi o exceto/.test(t)&&!/XABCDE/.test(t),"filtro Hematologia: só erros do tema");
ok(/Especialidade/i.test(t)&&/CM · Hematologia/.test(t)&&!/Clínica Médica/.test(t),"tabela por especialidade escolhida");
ok(!/NCS 6/.test(t),"faculdade sai quando nenhuma disciplina é escolhida");
await p.tap('.pdfm:has-text("NCS 6")');t=await gen('fm2.pdf');ok(/NCS 6/.test(t)&&/Matérias: .*NCS 6/.test(t.replace(/\n/g," ")),"disciplina NCS 6 no filtro");
await p.screenshot({path:'t47.png',fullPage:true});
await p.tap('.pdfpan button:has-text("Limpar")');ok(await p.evaluate(()=>pdfOpt.mats.size===0),"limpar volta a todas");
ok(!errs.length,"sem erros JS "+errs.join("|"));await b.close()})();
