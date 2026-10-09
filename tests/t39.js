const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync('mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
(async()=>{const b=await chromium.launch();const errs=[];
for(const [name,opt] of [["fone",{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2}],["desk",{viewport:{width:1366,height:1000}}]]){
const ctx=await b.newContext(opt);await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},5);`);
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('file://'+__dirname+'/preview.html');await p.waitForFunction(()=>typeof saveFac==='function'&&synced,null,{polling:100});
const setup=async provaDays=>p.evaluate(pd=>{localStorage.clear();state={};fac={sems:[{id:"s",name:"6° Semestre",archived:false}],discs:[
 {id:"a",semId:"s",name:"NCS 6",items:[],info:{},eixos:[],sps:[{id:"sa",name:"SP 1",eixoId:null,items:["T:CM-37","T:CM-34","T:CM-35"],objs:[]}]},
 {id:"b",semId:"s",name:"Habilidades Médicas 6",items:[],info:{},eixos:[],sps:[{id:"sb",name:"SP 1",eixoId:null,items:["T:CM-4"],objs:[]}]}],
 provas:pd===null?[]:[{id:"p",discId:"b",name:"OSCE",date:fromNum(dnum(today())+pd),items:["T:CM-4"],done:[]}],own:{}};saveFac();commit();setView("inicio")},provaDays);
const foco=()=>p.evaluate(()=>{const n=document.querySelector('#iStats .ifname');return n?n.textContent+" | "+document.querySelector('#iStats .ifwhy').textContent+" | "+document.querySelectorAll('#iStats .ringc b')[1].textContent:"-"});
await setup(null);let f=await foco();ok(/^NCS 6/.test(f),"sem prova nem estudo: disciplina com mais conteúdo · "+f);
await p.evaluate(()=>{upd("CM-4",s=>{s.l=1;s.last=fromNum(dnum(today())-2)});commit()});f=await foco();ok(/^Habilidades/.test(f)&&/7 dias/.test(f)&&/100%/.test(f),"estudo recente leva o foco · "+f);
await setup(10);await p.evaluate(()=>{upd("CM-37",s=>{s.l=1;s.last=today()});upd("CM-34",s=>{s.l=1;s.last=today()});commit()});f=await foco();ok(/^Habilidades/.test(f)&&/OSCE em 10 dias/.test(f),"prova em até 21 dias com pendência vence o estudo recente · "+f);
await setup(40);f=await foco();ok(/^NCS 6/.test(f),"prova distante não puxa o foco · "+f);
await setup(10);await p.evaluate(()=>{upd("CM-4",s=>{s.l=1;s.last=today()});commit()});f=await foco();ok(!/OSCE/.test(f),"prova sem pendência não puxa o foco · "+f);
await setup(5);await p.evaluate(()=>document.querySelector('#iStats').scrollIntoView());await p.screenshot({path:`t39-${name}.png`,fullPage:name==="fone"});
await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join("|"));await b.close()})();
