// Capturas (não é teste): histórico das revisões e recuperação do atraso, celular 390 e computador 1366, claro e escuro.
// Uso: node tests/shotsRev.js <pasta>
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const OUT=process.argv[2]||__dirname;
const SEED=`(()=>{const T=today(),ago=n=>fromNum(dnum(T)-n);
  ALL.filter(it=>!it.own).slice(0,60).forEach((it,i)=>upd(it.key,x=>{x.l=2;x.step=1+(i%3);x.last=ago(30+(i%7));
    x.rv=Array.from({length:4+(i%4)},(_,j)=>({d:ago(2+j*3),g:(i+j)%5===0?0:(i+j)%4===0?1:2,l:(i+j)%3===0?6:0,i:7}))}));
  ALL.filter(it=>!it.own).slice(60,90).forEach((it,i)=>upd(it.key,x=>{x.l=2;x.step=2;x.last=ago(3+(i%4))}));
  try{localStorage.removeItem("resid-recchk");localStorage.removeItem("resid-recdis")}catch(e){};commit()})()`;
(async()=>{const b=await chromium.launch();
 for(const [nm,vp,touch] of [["fone",{width:390,height:844},true],["pc",{width:1366,height:900},false]])for(const th of ["light","dark"]){
  const ctx=await b.newContext({viewport:vp,screen:vp,deviceScaleFactor:2,hasTouch:touch,isMobile:touch,colorScheme:th});
  await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__qLegacy=false;window.__mock({},2);`);
  const p=await ctx.newPage();await p.goto('http://localhost:8765/tests/preview.html');
  await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});
  await p.evaluate(SEED);await p.evaluate(()=>{setView("inicio");render()});await p.waitForTimeout(500);
  const shot=async(n,sel)=>{if(sel){await p.evaluate(s=>{const e=document.querySelector(s);if(e)e.scrollIntoView({block:"start"});window.scrollBy(0,-12)},sel);await p.waitForTimeout(250)}await p.screenshot({path:`${OUT}/rev-${nm}-${th}-${n}.png`})};
  await shot("1-inicio","#recNote");
  await p.evaluate(()=>{goRevs();render()});await p.waitForTimeout(400);await shot("2-revisoes","#recNoteR");await shot("3-proximos","#revAgenda");
  await p.evaluate(()=>{const k=recActive()[5];setView("temas");detTab[k]="estudo";openTopic(k);render();document.querySelector("#t-"+k).scrollIntoView()});await p.waitForTimeout(400);await shot("4-tema",".detail .drev");
  await p.evaluate(()=>{setView("stats");render()});await p.waitForTimeout(500);await shot("5-estatisticas","#stB1");
  await ctx.close()}
 await b.close()})();
