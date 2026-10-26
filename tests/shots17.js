// capturas do Lote 17 (antes/depois; não é teste). Uso: node shots17.js <pasta> [prefixo]
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const seed=fs.readFileSync(__dirname+'/seed10.js','utf8');
const OUT=process.argv[2]||'.',PRE=process.argv[3]||'';fs.mkdirSync(OUT,{recursive:true});
const DEV={fone:[390,844,true],note:[1366,768,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV).filter(n=>!process.env.DEVS||process.env.DEVS.split(",").includes(n))){const [w,h,mob]=DEV[name];
 const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1.5,hasTouch:mob,isMobile:mob});
 await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
 await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
 await p.evaluate(src=>{const module={exports:{}};eval(src);module.exports();const t=dnum(today()),D=n=>fromNum(t-n);
   ui.profile.name="Elialdo";saveUI();
   const ks=ALL.map(i=>i.key).filter(k=>isDue(get(k))).slice(0,8);ks.forEach((k,i)=>{notes[k]="## "+BYKEY[k].t+"\n- Conceito principal "+i+"\n- ==Pegadinha== da prova\n> cuidado com o detalhe";});
   ks.slice(0,6).forEach((k,i)=>errors.push({id:"es"+i,k,w:"Marquei C; a certa era A",r:"Conceito certo número "+i,t:"conceito",s:"Simulado",d:D(12+i),due:D(1),box:1,rev:1}));
   commit()},seed);
 await p.waitForTimeout(400);
 const go=async(tag,fn)=>{await p.evaluate(fn);await p.waitForTimeout(500);await p.evaluate(()=>scrollTo(0,0));await p.waitForTimeout(150);await p.screenshot({path:`${OUT}/${PRE}${tag}-${name}.png`,fullPage:true})};
 await go("inicio",()=>{setView("inicio")});
 await go("revisoes",()=>{goRevs()});
 await go("questoes",()=>{setView("quest");if(typeof setQSeg==="function")setQSeg("temas")});
 await go("erros",()=>{setView("erros")});
 await go("foco",()=>{setView("foco")});
 await ctx.close()}
console.log(errs.length?"ERROS: "+errs.join(" | "):"ok");await b.close()})();
