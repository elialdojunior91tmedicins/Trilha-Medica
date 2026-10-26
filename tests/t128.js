// t128: Lote 18 › Erros (seção 6) — resumo do mês no "Por que você erra" (causas do último mês × mês anterior, o que melhorou)
// e erros da faculdade separados dos da residência, com o filtro rápido da semana da prova
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],note:[1366,900,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob});
  await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
  await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
  await p.evaluate(()=>{const t=dnum(today()),D=n=>fromNum(t-n);
    fac={sems:[{id:"s",name:"6º",archived:false}],discs:[{id:"d",semId:"s",name:"NCS",items:["T:CM-12"],sps:[]}],provas:[{id:"p",discId:"d",name:"P2 NCS",date:fromNum(t+3),items:["T:CM-12"],done:[]}],own:{}};saveFac();
    const E=(id,k,d,c,s)=>({id,k,w:"Errei "+id,r:"Certo",t:c&&/EXCETO|dado/.test(c)?"interpretacao":"conhecimento",s:s||"",d:D(d),due:D(-5),box:2,...(c?{c}:{})});
    errors.push(E("r1","CM-30",3,"Não vi o EXCETO / INCORRETA"),E("r2","CM-30",5,"Não vi o EXCETO / INCORRETA"),E("r3","CM-40",8,"Estudei, mas esqueci","p2 ncs"),E("f1","CM-12",10,"Pulei um dado do caso"),
      E("o1","CM-50",40,"Estudei, mas esqueci"),E("o2","CM-50",45,"Estudei, mas esqueci"),E("o3","CM-51",50,"Pulei um dado do caso"),E("o4","CM-51",50,"Pulei um dado do caso"),E("o5","CM-52",55,"Lembrei pela metade"));saveErrsLocal();
    backStack=[];setView("erros");render()});
  await p.waitForTimeout(150);
  /* 1. Por que você erra · último mês */
  let r=await p.evaluate(()=>{const g=document.getElementById("eWhy");return g&&{h:g.querySelector(".glabel").textContent,m:(g.querySelector(".emonth")||{}).textContent,L:[...g.querySelectorAll("li")].map(li=>li.querySelector("button").textContent+"|"+li.querySelector("b").textContent),gone:(g.querySelector(".emgone")||{}).textContent||""}});
  ok(r&&r.h==="Por que você erra · último mês"&&/^4 erros novos nos últimos 30 dias \(5 nos 30 anteriores\)/.test(r.m),name+": resumo do mês: "+(r&&r.m));
  ok(r.L[0]==="Não vi o EXCETO / INCORRETA|2 erros · nova"&&r.L.includes("Estudei, mas esqueci|1 erro · ▼ 1")&&r.L.includes("Pulei um dado do caso|1 erro · ▼ 1"),name+": causas do mês com a comparação ("+r.L.join(" ; ")+")");
  ok(/^Melhorou: no último mês você não errou mais por “Lembrei pela metade”\./.test(r.gone),name+": mostra a causa que sumiu: "+r.gone);
  await p.evaluate(()=>{document.querySelector("#eWhy li button").click()});await p.waitForTimeout(150);
  ok(await p.evaluate(()=>eCause==="Não vi o EXCETO / INCORRETA"&&eVis.length===2),name+": tocar na causa mostra os erros dela");
  /* 2. residência × faculdade × semana da prova */
  r=await p.evaluate(()=>{eClearAll();eFOpen=false;render();const ch=[...document.querySelectorAll('[data-es]')].map(b=>b.dataset.es+":"+b.textContent);return ch});
  ok(r.join()==="all:Todos · 9,res:Residência · 7,fac:Faculdade · 2,pw:Semana da prova: P2 NCS · 1",name+": filtro rápido Residência · Faculdade · Semana da prova, fora do painel de filtros ("+r.join(" | ")+")");
  const pick=v=>p.evaluate(v=>{document.querySelector(`[data-es="${v}"]`).click();return eVis.map(e=>e.id).sort().join()},v);
  ok(await pick("fac")==="f1,r3",name+": Faculdade = tema da faculdade e erro registrado na prova da faculdade");
  ok(await pick("res")==="o1,o2,o3,o4,o5,r1,r2",name+": Residência = o resto");
  ok(await pick("pw")==="f1",name+": Semana da prova = erros dos temas da prova dos próximos dias");
  ok(await p.evaluate(()=>[...document.querySelectorAll('#eMore .tfpill, #eMore .tfact button, #eMore .fcact button')].some(b=>/Semana da prova/.test(b.textContent))||/Semana da prova: P2 NCS/.test(document.getElementById("eMore").textContent)),name+": o filtro ativo aparece nas etiquetas");
  ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral");
  await ctx.close()}
ok(errs.length===0,"sem erros de JavaScript"+(errs.length?": "+errs.slice(0,3).join(" | "):""));
await b.close()})();
