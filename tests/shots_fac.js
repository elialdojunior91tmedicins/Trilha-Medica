// capturas para aprovação: Faculdade com UC, SP como conteúdo, ligação a vários temas (não é teste)
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');
const OUT=process.argv[2]||'.';
const DEV={fone:[390,844,true],ipad578:[578,820,true],tabEmPe:[820,1180,true],tabDeitado:[1180,820,true],note:[1366,768,false],monitor:[1920,1080,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV).filter(n=>!process.env.DEVS||process.env.DEVS.split(",").includes(n))){const [w,h,mob]=DEV[name];const ipad=name==="ipad578"||name.startsWith("tab");
 const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:2,hasTouch:mob,isMobile:mob,screen:name==="ipad578"?{width:1180,height:820}:undefined,userAgent:ipad?"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)":undefined});
 await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
 await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
 const shot=async(tag,sel,off=70)=>{await p.evaluate(([s,o])=>{const x=document.querySelector(s);if(x){x.scrollIntoView({block:"start"});scrollBy(0,-o)}},[sel,off]);await p.waitForTimeout(250);await p.screenshot({path:`${OUT}/${tag}-${name}.png`})};
 await p.evaluate(()=>{const D=n=>fromNum(dnum(today())+n);
   fac={sems:[{id:"s6",name:"6º semestre",archived:false,ucs:[{id:"u1",name:"NCS"},{id:"u2",name:"PMSUS"},{id:"u3",name:"HMEC"}]}],discs:[
     {id:"d1",semId:"s6",ucId:"u1",name:"Tutoria",div:"sp",items:["O:x"],info:{},links:[],sps:[
       {id:"sp1",name:"SP 2.1 Hemostasia e Distúrbios da Coagulação",items:["O:sp1","O:a"],objs:["Descrever a cascata da coagulação","Diferenciar PTI de PTT"]},
       {id:"sp2",name:"SP 2.2 Anemias",items:["O:sp2"],objs:[]},{id:"sp3",name:"SP 2.3 Leucemias e linfomas",items:["O:sp3"],objs:[]}]},
     {id:"d4",semId:"s6",ucId:"u1",name:"TBL",div:"",items:["O:t1"],info:{},links:[],sps:[]},
     {id:"d2",semId:"s6",ucId:"u2",name:"Saúde coletiva",div:"",items:["O:c","O:c2"],info:{},links:[],sps:[]},
     {id:"d3",semId:"s6",ucId:"u3",name:"Habilidades Médicas",div:"",items:["O:h"],info:{},links:[],sps:[]}],
     provas:[{id:"p1",discId:"d1",name:"D2",date:D(10),items:["O:sp1","O:a","O:sp2","O:sp3"],done:[],sps:["sp1","sp2","sp3"]}],
     own:{sp1:{t:"SP 2.1 Hemostasia e Distúrbios da Coagulação",discId:"d1",spId:"sp1",links:[{k:"CM-37",subs:[]}]},
       sp2:{t:"SP 2.2 Anemias",discId:"d1",spId:"sp2",links:[{k:"CM-34",subs:[]}]},
       sp3:{t:"SP 2.3 Leucemias e linfomas",discId:"d1",spId:"sp3",links:[{k:"CM-35",subs:[]},{k:"CM-36",subs:[]}]},
       a:{t:"Cascata da coagulação",discId:"d1",spId:"sp1"},x:{t:"SP 2.4 Mieloma múltiplo",discId:"d1"},t1:{t:"Farmacologia dos anticoagulantes",discId:"d4"},
       c:{t:"Vigilância epidemiológica",discId:"d2"},c2:{t:"Indicadores de saúde",discId:"d2"},h:{t:"Exame do abdome",discId:"d3"}}};
   registerOwn();facSyncAll();state["CM-35"]={l:2,last:D(-3),step:1};notes["CM-35"]="LMA x LLA: bastonetes de Auer, CD34.";notes["CM-36"]="Hodgkin: Reed-Sternberg.";
   saveFac();commit();facOpenSem.add("s6");facOpenDisc.add("d1");facOpenDisc.add("d2");backStack=[];setView("fac")});
 await p.waitForTimeout(200);
 await shot("1-semestre-uc",'#fs-s6 .fdiscs');
 await shot("2-tutoria",'#fd-d1');
 await p.evaluate(()=>{facOpenSP.add("sp1");render()});await shot("3-sp-aberta",'#sp-sp1');
 await p.evaluate(()=>{const x=document.querySelector('#sp-sp1 .flink');x&&x.scrollIntoView({block:"start"});scrollBy(0,-80)});await p.waitForTimeout(200);await p.screenshot({path:`${OUT}/4-sp-ligacao-${name}.png`});
 await p.evaluate(()=>{facOpenSP.clear();facOpenSP.add("sp3");render()});await shot("5-sp-dois-temas",'#sp-sp3');
 await p.evaluate(()=>{facOpenSP.clear();facAddC="d1";facNew.ckindd1="sp";facQuery.cd1="SP 2.5 Anemia falciforme";render()});await shot("6-mais-sp",'#fd-d1 .fadder',90);
 await p.evaluate(()=>{facAddC=null;facQuery.cd1="";openKey="F-c";render()});await shot("7-conteudo-mover",'#fd-d2 li.t.open',90);
 await p.evaluate(()=>{openKey=null;facDetOpen.add("d2");render()});await shot("8-detalhes",'#fd-d2 .fdset',200);
 await p.evaluate(()=>{facDetOpen.clear();detTab["CM-36"]="estudo";openTopic("CM-36")});await p.waitForTimeout(300);await shot("9-residencia-na-faculdade",'.flinkinfo',120);
 await ctx.close()}
console.log(errs.length?"ERROS "+errs.join(" | "):"sem erros JS");await b.close()})();
