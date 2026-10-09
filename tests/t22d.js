const {chromium}=require('playwright');
const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:400,height:1000}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+__dirname+'/../src/checklist-residencia.html');
await p.evaluate(()=>{localStorage.clear();const D=n=>fromNum(dnum(today())+n);
 localStorage.setItem("resid-fac-v1",JSON.stringify({sems:[{id:"s",name:"2026.2",archived:false}],discs:[{id:"d",semId:"s",name:"Cardio",items:["T:CM-12"]}],provas:[{id:"p",discId:"d",name:"P1",date:D(18),items:["T:CM-12"],done:[]}],own:{}}));
 localStorage.setItem("resid-checklist-v2",JSON.stringify({"CM-7":{l:1,last:D(-10),step:0}}))});
await p.reload();await p.waitForTimeout(300);
ok(!(await p.evaluate(()=>examCrunch().active)),"automático: desligado (1 prova)");
await p.click('#tabF');await p.click('#facCrunch .seg button:has-text("Ligado")');await p.waitForTimeout(100);
ok(await p.evaluate(()=>examCrunch().active&&examCrunch().manual&&fac.crunch.until===fromNum(dnum(today())+6)),"ligado manualmente por 7 dias");
ok(await p.evaluate(()=>dayPlan.items.every(x=>x.cls==="r-fac")),"plano só faculdade");
await p.click('#tabT');ok((await p.textContent('#crunchBar')).includes('manualmente'),"aviso de modo manual");
ok((await p.$$eval('#revlist summary',x=>x.length))===1,"revisões da residência pausadas");
// mudar data
await p.click('#tabF');const d10=await p.evaluate(()=>fromNum(dnum(today())+10));await p.fill('#facCrunch input[type=date]',d10);await p.dispatchEvent('#facCrunch input[type=date]','change');
ok(await p.evaluate(d=>fac.crunch.until===d,d10),"data alterada");
// desligar com cluster automático
await p.evaluate(()=>{const D=n=>fromNum(dnum(today())+n);fac.provas.push({id:"q",discId:"d",name:"P2",date:D(3),items:["T:CM-12"],done:[]},{id:"r",discId:"d",name:"P3",date:D(5),items:["T:CM-12"],done:[]});fac.provas[0].date=D(2);delete fac.crunch;saveFac();redoPlan()});
ok(await p.evaluate(()=>examCrunch().active&&!examCrunch().manual),"automático liga com 3 provas");
await p.click('#facCrunch .seg button:has-text("Desligado")');
ok(await p.evaluate(()=>!examCrunch().active&&fac.crunch.until===examCrunchAuto().until),"desligado até o fim do grupo de provas");
ok(await p.evaluate(()=>dayPlan.items.some(x=>x.cls!=="r-fac")),"plano volta a ter residência");
// expira
await p.evaluate(()=>{fac.crunch={mode:"off",until:fromNum(dnum(today())-1)};saveFac()});
ok(await p.evaluate(()=>examCrunch().active&&!examCrunch().manual),"override vencido volta ao automático");
console.log("DBG",await p.evaluate(()=>({view,layout:document.documentElement.dataset.layout,html:document.getElementById("facCrunch").innerHTML.slice(0,200),vis:!document.getElementById("viewFac").hidden})));
await p.click('#facCrunch .seg button:has-text("Automático")');ok(await p.evaluate(()=>!fac.crunch),"automático");
await p.locator('#viewFac section.card').first().screenshot({path:'fcrunch.png'});
console.log('errors',errs);await b.close()})();
