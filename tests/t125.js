// t125: Lote 18 › Residência (seção 3) — próximo passo em cada tema, marcar subtópicos sem abrir o tema, filtro "Neste semestre" com o peso na residência
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],ipad578:[578,820,true],note:[1366,900,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,screen:name==="ipad578"?{width:1180,height:820}:undefined,userAgent:name==="ipad578"?"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)":undefined});
  await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
  await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
  const K=await p.evaluate(()=>{const t=dnum(today()),big=ALL.filter(i=>i.area.code==="CM"&&!["CM-1","CM-2","CM-3"].includes(i.key)&&partSubs(i).pt).map(i=>i.key);
    const k1=big[0],k2=big[1];upd(k2,x=>{x.sd=[0,1,2,3];x.ing={d:today(),m:"a"}});// Estudando, parte 2
    upd("CM-1",x=>{x.last=fromNum(t-20);x.step=0;x.l=1});// atrasada
    upd("CM-2",x=>{x.last=fromNum(t-1);x.step=2;x.l=1;x.qt=10;x.qc=3;x.qd={[today()]:[10,3]}});// acerto baixo
    commit();tSeg="lista";setView("temas");openAreas.add("CM");BYKEY[k1].sp&&openSpecs.add(spKey(BYKEY[k1]));openSpecs.add(spKey(BYKEY[k2]));openSpecs.add(spKey(BYKEY["CM-1"]));openSpecs.add(spKey(BYKEY["CM-2"]));openSpecs.add(spKey(BYKEY["CM-3"]));render();return {k1,k2,pt1:partSubs(BYKEY[k1]).pt,pt2:partSubs(BYKEY[k2]).pt}});
  await p.waitForTimeout(150);
  const tx=k=>p.evaluate(k=>{const li=document.getElementById("t-"+k);return li?{n:(li.querySelector(".tnx")||{}).textContent||"",m:li.querySelector(".meta").textContent}:null},k);
  let a=await tx(K.k1);ok(a&&a.n===`→ Começar · parte 1 de ${K.pt1[1]}`,name+": tema grande não iniciado: "+(a&&a.n));
  a=await tx(K.k2);ok(a&&a.n===`→ Continuar · parte ${K.pt2[0]} de ${K.pt2[1]}`,name+": tema em estudo mostra a próxima parte: "+(a&&a.n));
  a=await tx("CM-1");ok(a&&/^→ Revisar · atrasada \d+ d$/.test(a.n)&&!/atrasada/.test(a.m),name+": revisão atrasada no próximo passo, sem repetir na linha: "+(a&&a.n));
  a=await tx("CM-2");ok(a&&a.n==="→ Acerto baixo: faça questões",name+": acerto baixo pede questões: "+(a&&a.n));
  /* marcar subtópicos sem abrir o tema */
  await p.evaluate(()=>{document.getElementById("tsq-CM-3").scrollIntoView({block:"center"})});await (mob?p.tap('#tsq-CM-3'):p.click('#tsq-CM-3'));await p.waitForTimeout(150);
  ok(await p.evaluate(()=>!!document.querySelector('#t-CM-3 .tsql')&&openKey===null),name+": ☑ abre a lista de subtópicos sem abrir o tema");
  await (mob?p.tap('#tsq-CM-3-0'):p.click('#tsq-CM-3-0'));await p.waitForTimeout(200);
  let r=await p.evaluate(()=>({sd:get("CM-3").sd,ing:isIng(get("CM-3")),still:!!document.querySelector('#t-CM-3 .tsql'),open:openKey,lvl:document.querySelector('#t-CM-3 .lvl').textContent,btn:document.getElementById("tsq-CM-3").textContent}));
  ok(r.sd&&r.sd[0]===0&&r.ing&&r.still&&r.open===null&&/1\//.test(r.btn),name+": marcar um subtópico na lista põe o tema em Estudando e a lista continua aberta "+JSON.stringify(r));
  await p.evaluate(()=>{[...document.querySelectorAll('#t-CM-3 .tsqf .link')][0].click()});await p.waitForTimeout(100);
  ok(await p.evaluate(()=>!document.querySelector('#t-CM-3 .tsql')),name+": Fechar recolhe a lista");
  /* filtro Neste semestre */
  r=await p.evaluate(()=>{fac={sems:[{id:"s",name:"6º período",archived:false},{id:"s0",name:"5º",archived:true}],discs:[{id:"d",semId:"s",name:"NCS",items:["T:CM-30","T:CM-7","T:PED-21"],sps:[]},{id:"d0",semId:"s0",name:"Velha",items:["T:CM-40"],sps:[]}],provas:[],own:{}};saveFac();
    tf.sem=true;render();const L=[...document.querySelectorAll('#areas li.t')].map(li=>li.id.slice(2));const w=[...document.querySelectorAll('#areas li.t .semw')].map(x=>x.textContent);
    const cm=[...document.querySelectorAll('#areas details.area')].find(d=>d.querySelector(".code").textContent==="CM");const ord=cm?[...cm.querySelectorAll('li.t')].map(li=>wOf(BYKEY[li.id.slice(2)])):[];
    const chip=tfActive().map(x=>x[0]);tf.sem=false;render();return {L,w,ord,chip}});
  ok(r.L.sort().join()==="CM-30,CM-7,PED-21",name+": Neste semestre mostra só os temas ligados ao semestre ativo ("+r.L.join()+")");
  ok(r.w.length===3&&r.w.every(x=>/^peso [123] na residência$/.test(x))&&r.ord.every((v,i,a)=>!i||a[i-1]>=v),name+": cada tema com o peso na residência, os que mais caem primeiro ("+r.w.join(" · ")+")");
  ok(r.chip.includes("Neste semestre"),name+": o filtro aparece nas etiquetas dos ativos");
  ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral");
  await ctx.close()}
ok(errs.length===0,"sem erros de JavaScript"+(errs.length?": "+errs.slice(0,3).join(" | "):""));
await b.close()})();
