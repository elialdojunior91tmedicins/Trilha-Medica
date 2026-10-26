// medição de abertura (Lote 18, item 1.1; não é teste). Uso: node perf18.js
// CPU mais lenta simulada (celular ×6, iPad ×3, computador ×1), dados vazios e dados de 1 ano de uso.
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const seed=fs.readFileSync(__dirname+'/seed10.js','utf8');
const DEV=[["celular",390,844,true,6],["iPad",820,1180,true,3],["computador",1366,900,false,1]];
const BIG=`(()=>{const t=Math.floor(Date.now()/864e5),D=n=>new Date((t-n)*864e5).toISOString().slice(0,10),st={};
  for(let i=0;i<120;i++){const k=["CM","CIR","GO","PED","PREV"][i%5]+"-"+(1+Math.floor(i/5));const qd={};for(let d=0;d<365;d+=3)qd[D(d)]=[4,3];st[k]={l:1,last:D(i%30),step:2,qt:480,qc:360,qd,sd:[0,1,2]}}
  localStorage.setItem("resid-checklist-v2",JSON.stringify(st));
  const er=[];for(let i=0;i<400;i++)er.push({id:"e"+i,k:"CM-"+(1+i%40),w:"Marquei X; a certa era Y "+i,r:"Conceito correto número "+i+" com uma explicação de tamanho médio.",t:"conhecimento",s:"Simulado",d:D(i%300),rev:2,box:2,due:D(-3)});
  localStorage.setItem("resid-erros-v1",JSON.stringify(er));
  const cd=[];for(let i=0;i<2000;i++)cd.push({id:"c"+i,k:"CM-"+(1+i%40),q:"<b>Tema.</b> Pergunta "+i+"?",a:"<b>Resposta "+i+"</b><br><br><i>Explicação curta.</i>",h:1,box:2,due:D(-(i%60)),n:3,ok:2,src:"eu",f:{st:2,s:20,d:5,last:D(10),reps:3,lapses:0,first:D(60)}});
  localStorage.setItem("resid-cards-v1",JSON.stringify(cd));
  const h={};for(let d=0;d<365;d++)h[D(d)]={e:1,r:3,q:12,c:8};localStorage.setItem("resid-hist-v1",JSON.stringify(h));
  const fo=[];for(let i=0;i<700;i++)fo.push({id:"f"+i,d:D(i%365),s:D(i%365)+"T12:00:00.000Z",sec:1500,m:"p",ref:"T:CM-"+(1+i%40),lab:""});localStorage.setItem("resid-focus-v1",JSON.stringify(fo));
})();`;
(async()=>{const b=await chromium.launch();const out=[];
/* prepara a "conta" com 1 ano de uso: abre uma vez sem freio, deixa subir tudo e guarda o banco e o localStorage */
let SEED={},LS={};{const ctx=await b.newContext();await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},0);if(!localStorage.getItem("perfSeed")){${BIG};localStorage.setItem("perfSeed","1")}`);
  const p=await ctx.newPage();await p.goto('http://localhost:8765/tests/preview.html');await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:300000});await p.waitForTimeout(1500);
  SEED=await p.evaluate(()=>JSON.parse(JSON.stringify(window.__store)));LS=await p.evaluate(()=>{const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);o[k]=localStorage.getItem(k)}return o});await ctx.close()}
for(const data of ["vazio","1 ano de uso"])for(const [name,w,h,mob,cpu] of DEV){
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob});await ctx.route(/googleapis|gstatic/,r=>r.abort());
  await ctx.addInitScript(data==="vazio"?mock+`;window.__mock({},2);`:mock+`;if(!localStorage.getItem("perfSeed")){const L=${JSON.stringify(LS)};for(const k in L)localStorage.setItem(k,L[k])};window.__mock(${JSON.stringify(SEED)},2);`);
  const p=await ctx.newPage();const cdp=await ctx.newCDPSession(p);await cdp.send("Emulation.setCPUThrottlingRate",{rate:cpu});
  const run=async()=>{const t0=Date.now();await p.goto('http://localhost:8765/tests/preview.html',{waitUntil:"domcontentloaded"});const dcl=Date.now()-t0;
    await p.waitForFunction(()=>document.querySelector("#iHero")&&document.querySelector("#iHero").textContent.length>10,null,{polling:50,timeout:120000});const vis=Date.now()-t0;
    await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:50,timeout:120000});const ready=Date.now()-t0;
    const r=await p.evaluate(()=>{const t=performance.now();for(let i=0;i<5;i++)render();return (performance.now()-t)/5});
    const tabs={};for(const v of ["temas","quest","notas","erros","foco","stats"]){tabs[v]=await p.evaluate(v=>{const t=performance.now();setView(v);return Math.round(performance.now()-t)},v)}await p.evaluate(()=>setView("inicio"));
    return {dcl,vis,ready,render:Math.round(r),tabs}};
  const A=await run();const B=await run();
  out.push({data,name,cpu,primeira:A,segunda:B});await ctx.close()}
console.log(JSON.stringify(out,null,1));
const z=require('zlib').gzipSync(fs.readFileSync(__dirname+'/../index.html')).length;console.log("index.html: "+Math.round(fs.statSync(__dirname+'/../index.html').size/1024)+" KB, gzip "+Math.round(z/1024)+" KB");
await b.close()})();
