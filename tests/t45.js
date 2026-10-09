const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync('mockdb.js','utf8');
(async()=>{const b=await chromium.launch();const errs=[];const ctx=await b.newContext({viewport:{width:1366,height:900}});await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},5);`);
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('file://'+__dirname+'/preview.html');await p.waitForFunction(()=>typeof saveFac==='function'&&synced,null,{polling:100});
const r=await p.evaluate(()=>{const D=n=>fromNum(dnum(today())+n);errors=[];const T=["conhecimento","interpretacao","confusao"];
 for(let i=0;i<60;i++){const k=ALL[i%22].key;state[k]={l:1,last:D(-3),step:0,qt:10+i,qc:i%10};errors.push({id:"x"+i,k,d:D(-(i%20)),t:T[i%3],w:"Texto longo com (parênteses), \\barra, “aspas”, emoji 😀, seta → e símbolo ≥ "+"palavra ".repeat(i%7*6)+"fim",r:"Correto: Supercalifragilisticexpialidocious_sem_espacos_".repeat(3),s:i%2?"Subtópico":""})}
 const u=buildReport({res:true,fac:true,err:true,period:"all"});return {n:u.length,b64:btoa(String.fromCharCode.apply(null,Array.from(u)))}});
fs.writeFileSync('stress.pdf',Buffer.from(r.b64,'base64'));console.log("bytes",r.n,errs.join("|")||"sem erros JS");await b.close()})();
