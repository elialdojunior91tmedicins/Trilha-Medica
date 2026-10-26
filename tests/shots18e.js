// capturas do Lote 18 › Erros (não é teste). Uso: node shots18e.js <pasta>
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');
const OUT=process.argv[2]||'.';fs.mkdirSync(OUT,{recursive:true});
const DEV={fone:[390,844,true],note:[1366,900,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];
 const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1.5,hasTouch:mob,isMobile:mob});
 await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
 await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
 await p.evaluate(()=>{const t=dnum(today()),D=n=>fromNum(t-n);
   fac={sems:[{id:"s",name:"6º",archived:false}],discs:[{id:"d",semId:"s",name:"NCS",items:["T:CM-12","T:CM-30"],sps:[]}],provas:[{id:"p",discId:"d",name:"P2 NCS",date:fromNum(t+3),items:["T:CM-12"],done:[]}],own:{}};saveFac();
   const C=[["CM-12",3,"Não vi o EXCETO / INCORRETA"],["CM-12",4,"Pulei um dado do caso"],["CM-30",5,"Não vi o EXCETO / INCORRETA"],["CM-40",6,"Estudei, mas esqueci"],["CM-7",8,"Não vi o EXCETO / INCORRETA"],["CM-6",12,"Confundi com doença parecida"],["PED-21",20,"Estudei, mas esqueci"],
     ["CM-50",40,"Estudei, mas esqueci"],["CM-50",45,"Estudei, mas esqueci"],["CM-51",50,"Pulei um dado do caso"],["CM-52",55,"Lembrei pela metade"],["GO-4",58,"Lembrei pela metade"]];
   C.forEach(([k,d,c],i)=>errors.push({id:"x"+i,k,w:"Marquei C; a certa era A",r:"Conceito certo número "+i,t:/EXCETO|dado/.test(c)?"interpretacao":/Confundi|metade/.test(c)?"confusao":"conhecimento",s:"",d:D(d),due:D(-3),box:2,c}));saveErrsLocal();
   eFOpen=false;backStack=[];setView("erros");render()});
 await p.waitForTimeout(400);
 const shot=async(tag,fn,sel)=>{await p.evaluate(fn);await p.waitForTimeout(400);await p.evaluate(s=>{const c=document.querySelector(s);if(c){c.scrollIntoView({block:"start"});scrollBy(0,-90)}},sel);await p.waitForTimeout(150);await p.screenshot({path:`${OUT}/${tag}-${name}.png`})};
 await shot("1-por-que",()=>{render()},"#eWhy");
 await shot("2-filtro",()=>{render()},'[data-es="all"]');
 await shot("3-semana-prova",()=>{eSide="pw";render()},'[data-es="all"]');
 await ctx.close()}
console.log(errs.length?"ERROS: "+errs.join(" | "):"ok");await b.close()})();
