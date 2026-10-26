// capturas do Lote 18 › Faculdade (não é teste). Uso: node shots18f.js <pasta>
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const seed=fs.readFileSync(__dirname+'/seed10.js','utf8');
const OUT=process.argv[2]||'.';fs.mkdirSync(OUT,{recursive:true});
const DEV={fone:[390,844,true],note:[1366,900,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];
 const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1.5,hasTouch:mob,isMobile:mob});
 await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
 await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
 await p.evaluate(src=>{const module={exports:{}};eval(src);module.exports();ui.profile.name="Elialdo";const t=dnum(today()),F=n=>fromNum(t+n),TB=Object.keys(BYKEY).find(k=>/Tuberculose/i.test(BYKEY[k].t)&&!BYKEY[k].own);window.__TB=TB;
   fac={sems:[{id:"s",name:"6º período",archived:false,ucs:[{id:"u",name:"NCS"}]}],discs:[{id:"d",semId:"s",ucId:"u",name:"Tutoria",div:"sp",items:[],sps:[
     {id:"sp1",name:"SP 3.1 – HIV",items:["T:CM-30"],objs:["Descrever a transmissão do HIV","Explicar a TARV"],fech:F(-1)},{id:"sp2",name:"SP 3.2 – Tuberculose",items:["T:"+TB],objs:["Diagnóstico da TB pulmonar"],fech:F(9)},{id:"sp3",name:"SP 3.3 – Idoso frágil",items:["T:CM-57"],objs:[],fech:F(23)}]},
     {id:"d2",semId:"s",ucId:"u",name:"TBL",items:["T:CM-60","T:CM-14"],sps:[]}],
     provas:[{id:"p1",discId:"d",name:"Prova da UC 3",date:F(11),items:["T:CM-30","T:"+TB],done:[]},{id:"p2",discId:"d2",name:"TBL 3",date:F(25),items:["T:CM-60"],done:[]}],own:{},
     aulas:[{id:"a1",semId:"s",wd:wdOf(t+1),ini:"14:00",fim:"18:00",t:"Tutoria",discId:"d"},{id:"a2",semId:"s",wd:wdOf(t+3),ini:"08:00",fim:"10:00",t:"TBL",discId:"d2"}],
     ents:[{id:"e1",discId:"d2",t:"Relatório de TBL",date:F(2)},{id:"e2",discId:"d",t:"Apresentação do caso",date:F(10)}]};facNormalize();saveFac();
   ui.prefs.wday=[180,180,180,180,180,180,180];ui.prefs.wplans={};saveUI();commit();dayPlan=makeDayPlan();savePlan();backStack=[];setView("fac");facOpenSem.add("s");facCalOpen.add("s");render()},seed);
 await p.waitForTimeout(400);
 const shot=async(tag,fn,sel)=>{await p.evaluate(fn);await p.waitForTimeout(400);await p.evaluate(s=>{const c=document.querySelector(s);if(c){c.scrollIntoView({block:"start"});scrollBy(0,-90)}},sel);await p.waitForTimeout(150);await p.screenshot({path:`${OUT}/${tag}-${name}.png`})};
 await shot("1-calendario",()=>{render()},"#fcal-s");
 await shot("2-editar",()=>{calEd={id:"p1"};render()},"#fce-p-p1");
 await shot("3-aula-cancelar",()=>{calEd={aula:"a1"};render()},"#fgr-s");
 await shot("4-estudar-hoje",()=>{calEd=null;setView("inicio");render()},"#pFac");
 await shot("5-planejar",()=>{const t=dnum(today());wpTab=wpMon(t+1)===wpMon(t)?"cur":"next";goSub("config");render()},".wpaula");
 await shot("6-sp-peso-foto",()=>{goBack();setView("fac");facOpenDisc.add("d");facOpenSP.add("sp2");objF.sp2={st:"rev",tipo:"questoes",list:[{t:"Descrever o diagnóstico da tuberculose pulmonar",on:true,k:window.__TB,lk:true},{t:"Explicar o esquema RIPE e seus efeitos adversos",on:true,k:window.__TB,lk:false},{t:"Discutir a busca ativa de contactantes",on:true,k:null,lk:false}]};render()},"#sp-sp1");
 await p.evaluate(()=>{const c=document.querySelector("#fofOk-sp2");if(c){c.scrollIntoView({block:"end"});scrollBy(0,90)}});await p.waitForTimeout(150);await p.screenshot({path:`${OUT}/7-foto-${name}.png`});
 await ctx.close()}
console.log(errs.length?"ERROS: "+errs.join(" | "):"ok");await b.close()})();
