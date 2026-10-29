// capturas do Lote 20E › eixo e folga (não é teste). Uso: node shots20e.js <pasta> [antes|depois|ambos] [fone,note]
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');
const OUT=process.argv[2]||'.';fs.mkdirSync(OUT,{recursive:true});
const VERS=(process.argv[3]||'depois')==='ambos'?['antes','depois']:[process.argv[3]||'depois'];
const ALLDEV={fone:[390,844,true],note:[1366,900,false]};
const DEV=process.argv[4]?Object.fromEntries(process.argv[4].split(',').map(k=>[k,ALLDEV[k]])):ALLDEV;
(async()=>{const b=await chromium.launch();const errs=[];
for(const ver of VERS)for(const [name,[w,h,mob]] of Object.entries(DEV)){
 const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,hasTouch:mob,isMobile:mob});
 await ctx.route(/googleapis|gstatic|jsdelivr|cdnjs/,r=>r.abort());await ctx.addInitScript(mock+`;window.__noSheet=false;window.__mock({},2);`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(ver+name+":"+e.message));
 await p.goto('http://localhost:8765/tests/'+(ver==="antes"?"preview_antes.html":"preview.html"));
 await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
 await p.evaluate(()=>{const D=n=>fromNum(dnum(today())+n);fac.sems=[{id:"s6",name:"6º período",archived:false,lv:{}}];
   const mkSp=(id,name,fech,objs)=>({id,name,items:["O:"+id],objs,fech});
   fac.discs=[{id:"d1",semId:"s6",name:"NCS 6 – Tutoria",div:"sp",info:{},items:[],sps:[mkSp("spA","SP 3.1 – Anemias",D(9),["Diferenciar anemia ferropriva de talassemia"]),mkSp("spB","SP 3.2 – Cefaleia",D(12),["Reconhecer sinais de alarme"])]}];
   fac.own={spA:{t:"SP 3.1 – Anemias",discId:"d1",spId:"spA",area:"CM",spec:"Hematologia e oncologia"},spB:{t:"SP 3.2 – Cefaleia",discId:"d1",spId:"spB",area:"CM",spec:"Neurologia"}};
   if(typeof facNormalize==="function")facNormalize();saveFac();ui.profile.phase="clinico";ui.prefs.wday=[180,180,180,180,180,180,180];saveUI();
   const t=dnum(today());for(let i=1;i<40;i++)if(i%7!==3)foSess.push({id:"fz"+i,d:fromNum(t-i),s:Date.now(),sec:3600+i*60,m:"p",ref:"",lab:""});commit();dayPlan=null;backStack=[];setView("inicio");render()});
 await p.waitForTimeout(300);
 const shot=async(tag,fn,sel)=>{await p.evaluate(fn);await p.waitForTimeout(500);const el=sel?await p.$(sel):null;const f=`${OUT}/${ver}-${tag}-${name}.png`;if(el){await el.scrollIntoViewIfNeeded().catch(()=>{});await el.screenshot({path:f}).catch(()=>p.screenshot({path:f}))}else await p.screenshot({path:f})};
 await shot("plano",()=>{dayPlan=null;backStack=[];setView("temas");if(typeof setTSeg==="function")setTSeg("hoje");render();const x=document.querySelector(".card.today");if(x)x.scrollIntoView()},".card.today");
 await shot("config",()=>{goSub("config");render();const x=document.getElementById("axCard")||document.getElementById("wpCard");if(x)x.scrollIntoView()},"#axCard");
 await shot("folga",()=>{goBack&&goBack();const t=dnum(today());ui.prefs.wday[wdOf(t)]=0;ui.prefs.wday[wdOf(t-3)]=0;saveUI();errors.push({id:"ef1",k:"CM-1",w:"x",r:"y",t:"conhecimento",s:"S",d:fromNum(t-3),due:fromNum(t-1),box:1});saveErrsLocal();dayPlan=null;backStack=[];setView("inicio");render();const x=document.getElementById("iQueue");if(x)x.scrollIntoView()},"#iQueue");
 await shot("mapa",()=>{backStack=[];setView("foco");render();const x=document.querySelector(".foheat");if(x)x.scrollIntoView()},".foheat");
 await ctx.close()}
console.log(errs.length?"ERROS: "+errs.join(" | "):"ok");await b.close()})();
