// capturas do Lote 19 › interface (não é teste). Uso: node shots19.js <pasta> [antes|depois|ambos] [aparelhos separados por vírgula]
// "antes" usa tests/preview_antes.html (montado da main antes do lote)
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const seed=fs.readFileSync(__dirname+'/seed10.js','utf8');
const OUT=process.argv[2]||'.';fs.mkdirSync(OUT,{recursive:true});
const VERS=(process.argv[3]||'depois')==='ambos'?['antes','depois']:[process.argv[3]||'depois'];
const ALLDEV={fone:[390,844,true,'light'],escuro:[390,844,true,'dark'],ipad:[820,1180,true,'light'],note:[1366,900,false,'light'],monitor:[1920,1080,false,'light']};
const DEV=process.argv[4]?Object.fromEntries(process.argv[4].split(',').map(k=>[k,ALLDEV[k]])):ALLDEV;
const VIEWS=(process.env.VIEWS||'inicio,temas,tema,quest,erros,notas,foco').split(',');
(async()=>{const b=await chromium.launch();const errs=[];
for(const ver of VERS)for(const name of Object.keys(DEV)){const [w,h,mob,scheme]=DEV[name];
 const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,hasTouch:mob,isMobile:mob,colorScheme:scheme});
 await ctx.route(/googleapis|gstatic|jsdelivr|cdnjs/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(ver+name+":"+e.message));
 await p.goto('http://localhost:8765/tests/'+(ver==="antes"?"preview_antes.html":"preview.html"));
 await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
 await p.evaluate(([src,scheme])=>{const module={exports:{}};eval(src);module.exports();const t=dnum(today()),D=n=>fromNum(t-n);
   ui.profile.name="Elialdo";ui.prefs.theme=scheme==="dark"?"dark":"light";if(typeof wpSetDay==="function")wpSetDay(null,wdOf(t),120);saveUI();applyUI();
   const ks=ALL.map(i=>i.key).filter(k=>isDue(get(k))).slice(0,8);
   ks.slice(0,6).forEach((k,i)=>errors.push({id:"es"+i,k,w:"Marquei C; a certa era A",r:"Conceito certo número "+i,t:"conceito",s:"Simulado",d:D(12+i),due:D(1),box:1,rev:1}));saveErrsLocal();
   ks.slice(0,4).forEach((k,i)=>{for(let j=0;j<4;j++)cards.push(cdClean({id:"cs"+i+j,k,q:"Pergunta "+i+j,a:"Resposta",src:"eu",due:D(1),n:2,ok:1,box:2,f:{st:2,s:5,d:5,last:D(6),reps:2,lapses:0,first:D(20)}}))});cdSaveLocal();
   notes[ks[0]]="## Definição\nAnemia por falta de ferro.\n\n## Pegadinhas\n> Ferritina normal não exclui na inflamação.";
   commit();dayPlan=makeDayPlan();savePlan();window.__hour=10;setView("inicio");render()},[seed,scheme]);
 await p.waitForTimeout(400);
 const shot=async(tag,fn,arg)=>{await p.evaluate(fn,arg);await p.waitForTimeout(500);await p.evaluate(()=>scrollTo(0,0));await p.waitForTimeout(150);await p.screenshot({path:`${OUT}/${ver}-${tag}-${name}.png`,fullPage:true})};
 for(const v of VIEWS){
  if(v==="tema")await shot("tema",()=>{const k=ALL.map(i=>i.key).filter(k=>isDue(get(k)))[0];detTab[k]="estudo";setView("temas");openTopic(k)});
  else if(v==="revs")await shot("revs",()=>{setView("temas");goRevs()});
  else await shot(v,v=>{setView(v);render()},v);
 }
 await ctx.close()}
console.log(errs.length?"ERROS: "+errs.join(" | "):"ok");await b.close()})();
