const {chromium}=require('playwright');const fs=require('fs');const {execSync}=require('child_process');const mock=fs.readFileSync('mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
(async()=>{const b=await chromium.launch();const errs=[];const ctx=await b.newContext({viewport:{width:1366,height:900}});await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},5);`);
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('file://'+__dirname+'/preview.html');await p.waitForFunction(()=>typeof saveFac==='function'&&synced,null,{polling:100});
// registrar pelo campo do tema
await p.evaluate(()=>{localStorage.clear();state={};hist={};errors=[];commit();detTab["CM-37"]="questoes";openTopic("CM-37")});await p.waitForTimeout(200);
await p.fill('#qt-CM-37','10');await p.fill('#qc-CM-37','6');await p.click('#t-CM-37 .qform button');await p.waitForTimeout(150);
const s1=await p.evaluate(()=>({...get("CM-37"),td:today()}));ok(s1.qt===10&&s1.qc===6&&JSON.stringify(s1.qd)===JSON.stringify({[s1.td]:[10,6]}),"registro manual guarda o dia: "+JSON.stringify(s1.qd));
// dados com datas antigas e sem data
const r=await p.evaluate(()=>{const D=n=>fromNum(dnum(today())+n);
  state["CM-37"]={l:1,last:D(-2),qt:30,qc:15,qd:{[D(-2)]:[8,6],[D(-20)]:[12,4]}};// 10 sem data
  state["CM-34"]={l:1,last:D(-1),qt:5,qc:5,qd:{[D(-1)]:[5,5]}};
  state["CM-6"]={l:1,last:D(-1),qt:40,qc:30,qd:{[D(-1)]:[40,30]}};
  const hemato=new Set(["sp:CM|Hematologia e oncologia"]);
  const d7=reportData({res:true,fac:true,err:true,period:"7",mats:hemato}),dAll=reportData({res:true,fac:true,err:true,period:"all",mats:hemato});
  return {q7:d7.F.q,c7:d7.F.qc,und:d7.F.und,qa:dAll.F.q,ca:dAll.F.qc}});
ok(r.q7===13&&r.c7===11,"7 dias em Hematologia: 13 questões, 11 acertos ("+r.q7+"/"+r.c7+")");
ok(r.und===10,"10 questões sem data avisadas ("+r.und+")");
ok(r.qa===35&&r.ca===20,"Tudo em Hematologia: 35 questões, 20 acertos ("+r.qa+"/"+r.ca+")");
// PDF
const t=await p.evaluate(()=>{pdfOpt.mats=new Set(["sp:CM|Hematologia e oncologia"]);const u=buildReport({res:true,fac:true,err:true,period:"7",mats:pdfOpt.mats});return btoa(String.fromCharCode.apply(null,Array.from(u)))});
fs.writeFileSync('f48.pdf',Buffer.from(t,'base64'));const tx=execSync('pdftotext -layout f48.pdf -').toString().replace(/\s+/g," ");
ok(/QUESTÕES .*13 .*85% de acerto no período/.test(tx),"resumo das matérias com questões do período");
ok(/10 questões antigas/.test(tx),"aviso das questões sem data");
ok(/CM · Hematologia e oncologia 2\/5 0 13 85%/.test(tx),"tabela da especialidade com o período");
// questões geradas pelo app também guardam o dia
const g=await p.evaluate(()=>{const it=BYKEY["PED-3"];upd(it.key,x=>addQ(x,1,1));upd(it.key,x=>addQ(x,1,0));return get("PED-3").qd[today()]});ok(g[0]===2&&g[1]===1,"questões respondidas uma a uma somam no dia");
ok(!errs.length,"sem erros JS "+errs.join("|"));await b.close()})();
