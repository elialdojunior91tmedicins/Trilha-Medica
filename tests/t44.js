const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync('mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
(async()=>{const b=await chromium.launch();const errs=[];
const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},5);`);
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('file://'+__dirname+'/preview.html');await p.waitForFunction(()=>typeof saveFac==='function'&&synced,null,{polling:100});
await p.evaluate(()=>{localStorage.clear();const D=n=>fromNum(dnum(today())+n);
 state={"CM-37":{l:2,last:D(-9),step:1,qt:20,qc:9},"CM-6":{l:1,last:D(-1),step:0,qt:10,qc:7},"PED-3":{l:3,last:D(-3),step:4,qt:30,qc:27},"CIR-1":{l:1,last:D(-40),step:0,qt:12,qc:5}};
 hist={};hist[D(-1)]={e:2,q:10,c:7};hist[D(-3)]={r:3,q:20,c:15};hist[D(-50)]={e:1,q:12,c:5};hist[today()]={e:1};
 errors=[{id:"e1",k:"CM-37",d:D(-2),t:"conhecimento",w:"Marquei PTT como causa de plaquetopenia com coagulograma alterado",r:"Na PTT o coagulograma é normal; CIVD altera TP e TTPa",s:"PTT e SHU"},
  {id:"e2",k:"CM-37",d:D(-5),t:"confusao",w:"Confundi PTI com PTT",r:"PTI: plaquetopenia isolada; PTT: pêntade (anemia hemolítica microangiopática)",s:"PTI"},
  {id:"e3",k:"CM-6",d:D(-1),t:"interpretacao",w:"Não vi que pedia a conduta inicial (exceto)",r:"Pedia o que NÃO fazer: (ação) contraindicada",s:""},
  {id:"e4",k:"CIR-1",d:D(-45),t:"conhecimento",w:"Ordem do XABCDE",r:"X antes de A",s:""}];
 fac={sems:[{id:"s",name:"6° Semestre",archived:false}],discs:[{id:"d",semId:"s",name:"NCS 6",items:["T:CM-37","T:CM-34"],info:{},eixos:[],sps:[]}],provas:[{id:"p",discId:"d",name:"Prova 1",date:D(5),items:["T:CM-37","T:CM-34"],done:[]}],own:{}};saveFac();
 ui.profile={name:"Elialdo Júnior",goal:"ENARE 2027",goalDate:D(400)};saveUI();commit();
 downloadsFn={save:async({filename,data})=>{const ab=await data.arrayBuffer();window.__saved={filename,b64:btoa(String.fromCharCode(...new Uint8Array(ab))),type:data.type}}};});
await p.tap('#profBtn');await p.waitForTimeout(150);
await p.tap('#pfBody button:has-text("Exportar PDF")');await p.waitForTimeout(100);
ok(await p.isVisible('#pdf-res')&&await p.isVisible('#pdf-fac')&&await p.isVisible('#pdf-err'),"opções de panorama aparecem");
await p.screenshot({path:'t44-panel.png',fullPage:true});
await p.tap('.pdfpan button:has-text("Tudo")');await p.tap('.pdfpan button:has-text("Gerar PDF")');await p.waitForFunction(()=>window.__saved,null,{timeout:5000});
const sv=await p.evaluate(()=>window.__saved);fs.writeFileSync('panorama.pdf',Buffer.from(sv.b64,'base64'));
ok(/^panorama-estudos-\d{4}-\d{2}-\d{2}\.pdf$/.test(sv.filename)&&sv.type==="application/pdf","arquivo .pdf: "+sv.filename);
ok(/PDF salvo/.test(await p.textContent('.pdfpan')),"mensagem de sucesso");
// só faculdade, 30 dias
await p.evaluate(()=>{window.__saved=null});await p.tap('#pdf-res');await p.tap('.pdfpan button:has-text("30 dias")');await p.tap('.pdfpan button:has-text("Gerar PDF")');await p.waitForFunction(()=>window.__saved,null,{timeout:5000});
fs.writeFileSync('panorama-fac.pdf',Buffer.from((await p.evaluate(()=>window.__saved)).b64,'base64'));
await p.tap('#pdf-fac');ok(await p.evaluate(()=>document.querySelector('.pdfpan .btn.primary').disabled),"sem Residência e Faculdade, botão desativado");
ok(!errs.length,"sem erros JS "+errs.join("|"));await b.close()})();
