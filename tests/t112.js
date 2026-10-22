// t112: Lote 11 — incidência revista (pesos novos, 13 temas novos, 198 no total) e a psiquiatria dividida em 4 temas com migração do progresso
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],ipad578:[578,820,true],tabEmPe:[820,1180,true],tabDeitado:[1180,820,true],note:[1366,768,false],monitor:[1920,1080,false]};
const U="data/users/u1/";
(async()=>{const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];const ipad=name==="ipad578"||name.startsWith("tab");
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,screen:name==="ipad578"?{width:1180,height:820}:undefined,userAgent:ipad?"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)":undefined});
  await ctx.route(/googleapis|gstatic|jsdelivr|cdnjs/,r=>r.abort());
  const seed={[U+"progress"]:{version:3,split:true,hist:{},plan:null},
    [U+"progress/topics/CM-50"]:{l:1,last:"2026-10-10",step:1,sd:[0,2,9,13,15],sv:2,dn:{"14":"u","8":"n"},ed:["2026-10-01","2026-10-10"]},
    [U+"progress/topics/CM-1"]:{l:1,last:"2026-10-01",step:0},
    [U+"faculdade"]:{sems:[{id:"s",name:"6º",archived:false}],discs:[{id:"d",semId:"s",name:"Saúde mental",items:["O:o1","S:CM-50:Transtornos alimentares","S:CM-50:Transtorno bipolar"],sps:[]}],provas:[],
      own:{o1:{t:"Psicofármacos",discId:"d",links:[{k:"CM-50",subs:["Lítio: uso e toxicidade","Transtorno bipolar"]},{k:"CM-1",subs:[]}]}}}};
  await ctx.addInitScript(mock+`;window.__mock(${JSON.stringify(seed)},2);`);
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
  await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(1500);
  const r=await p.evaluate(()=>{const g=k=>JSON.parse(JSON.stringify(get(k)));return {T:TOTAL,c50:g("CM-50"),c60:g("CM-60"),c61:g("CM-61"),c62:g("CM-62"),
    sub50:BYKEY["CM-50"].subs,t50:BYKEY["CM-50"].t,store60:__store["data/users/u1/progress/topics/CM-60"],store50:__store["data/users/u1/progress/topics/CM-50"],
    fac:JSON.parse(JSON.stringify(fac)),psy:AREAS[0].specs.find(s=>s.name==="Psiquiatria").items.map(i=>i.key),derm:(AREAS[0].specs.find(s=>s.name==="Dermatologia")||{items:[]}).items.map(i=>i.key),
    oft:(AREAS[1].specs.find(s=>s.name==="Oftalmologia")||{items:[]}).items.map(i=>i.key)}});
  ok(r.T===198&&r.psy.join()==="CM-50,CM-60,CM-61,CM-62"&&r.derm.join()==="CM-63,CM-64"&&r.oft.join()==="CIR-36",name+": 198 temas; psiquiatria em 4, dermatologia e oftalmologia novas");
  ok(r.t50==="Transtornos do humor, ansiedade e psicoses"&&r.sub50.length===8&&r.sub50.includes("Depressão pós-parto × baby blues"),name+": CM-50 com o nome e os 8 subtópicos novos");
  ok(JSON.stringify(r.c50.sd)==="[0]"&&r.c50.p11===1&&r.c50.last==="2026-10-10"&&r.c50.dn&&r.c50.dn["6"]==="n",name+": CM-50 fica só com os subtópicos que continuam nele (e o denso tirado acompanha) "+JSON.stringify(r.c50));
  ok(JSON.stringify(r.c62.sd)==="[1,4]"&&r.c62.last==="2026-10-10"&&r.c62.step===1&&r.c62.l===1,name+": ISRS e lítio vão para Urgências psiquiátricas, que herda o estudo e a revisão "+JSON.stringify(r.c62));
  ok(JSON.stringify(r.c60.sd)==="[1]"&&r.c60.dn&&r.c60.dn["3"]==="u"&&JSON.stringify(r.c61.sd)==="[0]",name+": álcool → Dependência química (com o denso de cocaína), transtornos alimentares → Alimentares e infância");
  ok(r.store60&&r.store60.p11===1&&r.store50&&r.store50.p11===1,name+": os temas novos e o CM-50 migrado ficam salvos na conta");
  const d=r.fac.discs[0].items,o=r.fac.own.o1.links;
  ok(d.includes("S:CM-61:Transtornos alimentares")&&d.includes("S:CM-50:Transtorno bipolar"),name+": subtópico ligado na faculdade passa para o tema novo "+JSON.stringify(d));
  ok(JSON.stringify(o)===JSON.stringify([{k:"CM-50",subs:["Transtorno bipolar"]},{k:"CM-1",subs:[]},{k:"CM-62",subs:["Lítio: uso e toxicidade"]}]),name+": ligação FAC ↔ RES dividida entre os temas "+JSON.stringify(o));
  const W=await p.evaluate(()=>Object.fromEntries(["CM-7","CM-22","PED-17","GO-4","GO-17","PED-33","PED-21","CM-5","CM-26","CM-34","CIR-7","CM-51","PREV-11","CM-6","CM-18","CM-39","CM-41","GO-25","CM-60","CM-61","CM-55","CM-59","CIR-35"].map(k=>[k,BYKEY[k].w0])));
  ok(W["CM-7"]===3&&W["CM-22"]===3&&W["PED-17"]===3&&W["GO-4"]===3&&W["GO-17"]===3,name+": sobem para muito alta: SCA, cefaleias, diarreia, DMG, rastreamento do colo");
  ok(["PED-33","PED-21","CM-5","CM-26","CM-34","CIR-7","CM-51","PREV-11"].every(k=>W[k]===2),name+": peso médio (alta) para os de poucas questões que pesam no INEP");
  ok(W["CM-6"]===3&&W["CM-18"]===2&&W["CM-39"]===2&&W["CM-41"]===2&&W["GO-25"]===2,name+": IC fica em 3; asma no adulto, hepatites, DII e endometriose não sobem");
  ok(W["CM-60"]===3&&W["CM-61"]===3&&W["CM-55"]===2&&W["CM-59"]===1&&W["CIR-35"]===1,name+": pesos dos temas novos");
  ok(await p.evaluate(()=>[...INC_NEW].every(k=>DN_DEF[k]&&BYKEY[k].subs.length>=4)),name+": temas novos com subtópicos e revisão de densos");
  /* tema novo na tela */
  await p.evaluate(()=>{backStack=[];openTopic("CM-56")});await p.waitForTimeout(250);
  ok(await p.evaluate(()=>/Tema novo \(10\/2026\)/.test(document.body.textContent)&&/Raiva, tétano/.test(document.body.textContent)),name+": tema novo abre e explica que ainda não tem contagem própria");
  ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral");
  if(name==="fone"||name==="note"){await p.evaluate(()=>{openKey=null;tf.area="CM";tf.sp="Psiquiatria";openAreas.add("CM");openSpecs.add("CM:Psiquiatria");setView("temas");if(typeof setTSeg==="function")setTSeg("lista")});await p.waitForTimeout(300);
    await p.evaluate(()=>{const x=[...document.querySelectorAll('.lname,.spname')].find(e=>/Psiquiatria/.test(e.textContent));if(x)x.scrollIntoView({block:"start"})});await p.screenshot({path:`t112-${name}.png`})}
  /* recarregar não divide de novo */
  await p.reload();await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(800);
  const r2=await p.evaluate(()=>({c50:get("CM-50").sd,c62:get("CM-62").sd,o:fac.own.o1.links.length}));
  ok(JSON.stringify(r2.c50)==="[0]"&&JSON.stringify(r2.c62)==="[1,4]"&&r2.o===3,name+": ao reabrir, nada é dividido de novo "+JSON.stringify(r2));
  await ctx.close()}
/* conta sem estudo do CM-50: subtópico marcado vira "Estudando" no tema novo */
{const ctx=await b.newContext();const seed={[U+"progress"]:{version:3,split:true,hist:{},plan:null},[U+"progress/topics/CM-50"]:{l:0,sd:[13],sv:2}};
  await ctx.addInitScript(mock+`;window.__mock(${JSON.stringify(seed)},2);`);const p=await ctx.newPage();p.on('pageerror',e=>errs.push("ing:"+e.message));
  await p.goto('http://localhost:8765/tests/preview.html');await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(800);
  const r=await p.evaluate(()=>({c50:get("CM-50"),c60:get("CM-60"),i:isIng(get("CM-60")),c61:!!state["CM-61"]}));
  ok(!r.c50.sd&&r.i&&!r.c60.last&&JSON.stringify(r.c60.sd)==="[1]"&&!r.c61,"sem estudo: o subtópico marcado leva o tema novo para Estudando, e os outros não são criados "+JSON.stringify(r));
  await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
