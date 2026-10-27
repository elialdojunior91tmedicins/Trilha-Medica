// capturas do Lote 18 › Residência (não é teste). Uso: node shots18r.js <pasta>
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const seed=fs.readFileSync(__dirname+'/seed10.js','utf8');
const OUT=process.argv[2]||'.';fs.mkdirSync(OUT,{recursive:true});
const DEV={fone:[390,844,true],note:[1366,900,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const ver of ["antes","depois"])for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];
 const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1.5,hasTouch:mob,isMobile:mob});
 await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(ver+name+":"+e.message));await p.goto('http://localhost:8765/tests/'+(ver==="antes"?"preview_antes.html":"preview.html"));
 await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
 await p.evaluate(src=>{const module={exports:{}};eval(src);module.exports();ui.profile.name="Elialdo";saveUI();
   ["CM-6","CM-8"].forEach(k=>upd(k,x=>{x.sd=[0,1,2];x.ing={d:today(),m:"a"}}));
   fac={sems:[{id:"s",name:"6º período",archived:false}],discs:[{id:"d",semId:"s",name:"NCS – Tutoria",items:["T:CM-5","T:CM-6","T:CM-7","T:CM-8","T:CM-30","T:PED-21","T:GO-4"],sps:[]}],provas:[],own:{}};saveFac();
   commit();tSeg="lista";try{localStorage.setItem("resid-tseg","lista")}catch(e){}setView("temas");openAreas.add("CM");openSpecs.add(spKey(BYKEY["CM-6"]));render()},seed);
 await p.waitForTimeout(400);
 const shot=async(tag,fn)=>{await p.evaluate(fn);await p.waitForTimeout(400);await p.evaluate(()=>{const c=document.querySelector('#t-CM-5')||document.querySelector('#areas');c.scrollIntoView({block:"start"});scrollBy(0,-120)});await p.waitForTimeout(150);await p.screenshot({path:`${OUT}/${ver}-${tag}-${name}.png`})};
 await shot("1-lista",()=>{render()});
 if(ver==="depois"){await shot("2-marcar",()=>{subQ="CM-7";render()});await shot("3-semestre",()=>{subQ=null;tf.sem=true;render()})}
 await ctx.close()}
console.log(errs.length?"ERROS: "+errs.join(" | "):"ok");await b.close()})();
