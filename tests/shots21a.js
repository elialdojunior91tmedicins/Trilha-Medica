// capturas do Lote 21, itens 1 e 2 (Foco): node tests/shots21a.js <pasta>
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const OUT=process.argv[2]||'.';
const DEV={fone:[390,844,true],note:[1366,900,false]};
(async()=>{const b=await chromium.launch();
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,deviceScaleFactor:2});
 await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
 const p=await ctx.newPage();await p.goto('http://localhost:8765/tests/preview.html');
 await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
 await p.evaluate(()=>{fac={sems:[{id:"s6",name:"6º semestre",archived:false}],discs:[
     {id:"d1",semId:"s6",name:"Habilidades Médicas 6",items:["O:o3"],info:{},links:[],div:"sp",sps:[{id:"sp1",name:"Pediatria",items:["O:sp1","O:o1","O:o2"],objs:[]}]}],provas:[],
     own:{sp1:{t:"Pediatria",discId:"d1",spId:"sp1"},o1:{t:"Hidratação na criança",discId:"d1",spId:"sp1",links:[{k:"CM-1",subs:[]}]},o2:{t:"Avaliação dermatológica na criança",discId:"d1",spId:"sp1"},o3:{t:"Prescrição na pediatria",discId:"d1"}}};
   registerOwn();saveFac();const t=today(),y=fromNum(dnum(t)-1),mk=(id,d,sec,m,o)=>({id,d,s:d+"T13:00:00.000Z",sec,m,ref:"",lab:"",...o});
   foSess=[mk("a1",t,1500,"p",{ref:"T:CM-1",dc:"d1",cr:"O:o1",lab:"Hidratação na criança"}),mk("a2",t,2700,"x",{tp:"Anki"}),mk("a3",y,1800,"x",{tp:"Leitura",ref:"D:d1",dc:"d1",cr:"O:o2",lab:"Avaliação dermatológica na criança"}),
     mk("a4",y,3000,"c",{ref:"T:CM-5",lab:""}),mk("a5",y,900,"x",{tp:"Questões",ref:"D:d1"})];
   foPick={ref:"T:CM-1",mode:"p",dc:"d1",cr:"O:o1"};foMoreOpts=true;commit();backStack=[];setView("foco")});await p.waitForTimeout(300);
 await p.evaluate(()=>document.querySelector('.fomore').scrollIntoView({block:"start"}));await p.waitForTimeout(150);
 await p.screenshot({path:`${OUT}/1-vincular-${name}.png`});
 await p.evaluate(()=>{foAddOpen();foAdd.min="30";foAdd.tp="Anki";foAdd.ref="T:CM-1";foAdd.dc="d1";foAdd.cr="O:o1"});await p.evaluate(()=>render());await p.waitForTimeout(200);
 await p.evaluate(()=>window.scrollTo(0,document.querySelector('#foAddBox').getBoundingClientRect().top+scrollY-12));await p.waitForTimeout(150);
 await p.locator('#foAddBox').screenshot({path:`${OUT}/2-registrar-${name}.png`});
 await p.evaluate(()=>{foAdd=null;render();document.querySelector('#fomh').scrollIntoView({block:"start"})});await p.waitForTimeout(200);
 await p.screenshot({path:`${OUT}/3-materia-${name}.png`});
 await p.evaluate(()=>{foMatBy="tp";render();document.querySelector('#fomh').scrollIntoView({block:"start"})});await p.waitForTimeout(200);
 await p.screenshot({path:`${OUT}/4-tipo-${name}.png`});
 await ctx.close()}
await b.close()})();
