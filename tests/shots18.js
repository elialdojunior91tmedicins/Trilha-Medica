// capturas do Lote 18 › Início (não é teste). Uso: node shots18.js <pasta>  (antes = tests/preview_antes.html, montado da main)
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const seed=fs.readFileSync(__dirname+'/seed10.js','utf8');
const OUT=process.argv[2]||'.';fs.mkdirSync(OUT,{recursive:true});
const DEV={fone:[390,844,true],note:[1366,900,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const ver of ["antes","depois"])for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];
 const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1.5,hasTouch:mob,isMobile:mob});
 await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(ver+name+":"+e.message));await p.goto('http://localhost:8765/tests/'+(ver==="antes"?"preview_antes.html":"preview.html"));
 await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
 await p.evaluate(src=>{const module={exports:{}};eval(src);module.exports();const t=dnum(today()),D=n=>fromNum(t-n);
   ui.profile.name="Elialdo";if(typeof wpSetDay==="function")wpSetDay(null,wdOf(t),120);saveUI();
   const ks=ALL.map(i=>i.key).filter(k=>isDue(get(k))).slice(0,8);
   ks.slice(0,6).forEach((k,i)=>errors.push({id:"es"+i,k,w:"Marquei C; a certa era A",r:"Conceito certo número "+i,t:"conceito",s:"Simulado",d:D(12+i),due:D(1),box:1,rev:1}));saveErrsLocal();
   ks.slice(0,4).forEach((k,i)=>{for(let j=0;j<4;j++)cards.push(cdClean({id:"cs"+i+j,k,q:"Pergunta "+i+j,a:"Resposta",src:"eu",due:D(1),n:2,ok:1,box:2,f:{st:2,s:5,d:5,last:D(6),reps:2,lapses:0,first:D(20)}}))});cdSaveLocal();
   commit();dayPlan=makeDayPlan();savePlan();setView("inicio");render()},seed);
 await p.waitForTimeout(400);
 const shot=async(tag,fn,full)=>{await p.evaluate(fn);await p.waitForTimeout(500);await p.evaluate(()=>scrollTo(0,0));await p.waitForTimeout(150);await p.screenshot({path:`${OUT}/${ver}-${tag}-${name}.png`,fullPage:full!==false})};
 await shot("1-manha",()=>{window.__hour=10;render()});
 if(ver==="depois"){
  await shot("2-noite",()=>{const T=today();hist[T]={...(hist[T]||{}),r:3,q:14,c:10,e:1};window.__hour=21;render()});
  await shot("3-semana-prova",()=>{window.__hour=10;const t=dnum(today()),k=errors[0].k;fac={sems:[{id:"s",name:"6º período",archived:false}],discs:[{id:"d",semId:"s",name:"NCS – Tutoria",items:["T:"+k],sps:[]}],provas:[{id:"p",discId:"d",name:"Prova da UC 3",date:fromNum(t+4),items:["T:"+k],done:[]}],own:{}};saveFac();dayPlan=makeDayPlan();savePlan();render()});
  await shot("4-planejar",()=>{fac={sems:[],discs:[],provas:[],own:{}};saveFac();wpTab="cur";goSub("config");render();setTimeout(()=>{const c=$("#wpCard");if(c)c.scrollIntoView({block:"start"})},10)},false);
  await p.evaluate(()=>{const c=$("#wpCard");if(c)c.scrollIntoView({block:"start"})});await p.waitForTimeout(200);await p.screenshot({path:`${OUT}/depois-4-planejar-${name}.png`});
 }
 await ctx.close()}
console.log(errs.length?"ERROS: "+errs.join(" | "):"ok");await b.close()})();
