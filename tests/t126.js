// t126: Lote 18 › Faculdade (seção 4) — grade fixa (menos tempo no dia, cancelar um dia), calendário do semestre (semanas, pesadas, mudar data, adiada),
// entregas, preparo na véspera da aula, aviso depois do fechamento da SP, objetivos da SP por foto, peso na residência, sincronização e backup
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],ipad578:[578,820,true],note:[1366,900,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,screen:name==="ipad578"?{width:1180,height:820}:undefined,userAgent:name==="ipad578"?"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)":undefined});
  await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
  await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
  const tap=async sel=>{await p.evaluate(s=>document.querySelector(s).scrollIntoView({block:"center"}),sel);await (mob?p.tap(sel):p.click(sel));await p.waitForTimeout(150)};
  await p.evaluate(()=>{const t=dnum(today());
    fac={sems:[{id:"s",name:"6º período",archived:false}],discs:[{id:"d",semId:"s",name:"NCS – Tutoria",items:[],div:"sp",sps:[{id:"sp1",name:"SP 3.1 – HIV",items:["T:CM-30"],objs:["Descrever a transmissão do HIV"],fech:fromNum(t-1)},{id:"sp2",name:"SP 3.2 – Tuberculose",items:["T:PED-21"],objs:[],fech:fromNum(t+9)}]}],
      provas:[{id:"p1",discId:"d",name:"Prova da UC",date:fromNum(t+10),items:["T:CM-30"],done:[]}],own:{}};facNormalize();saveFac();
    ui.prefs.wday=[180,180,180,180,180,180,180];ui.prefs.wplans={};saveUI();dayPlan=makeDayPlan();savePlan();backStack=[];setView("fac");facOpenSem.add("s");facCalOpen.add("s");render()});
  await p.waitForTimeout(150);
  /* 1. calendário dentro do semestre */
  let r=await p.evaluate(()=>{const c=document.getElementById("fcal-s");return c&&{open:c.open,sum:c.querySelector(".fcalc").textContent,w:c.querySelectorAll(".fcw").length,ev:[...c.querySelectorAll(".fce")].map(x=>x.id),heavy:c.querySelectorAll(".fcw.heavy").length}});
  ok(r&&r.open&&r.w>=8&&r.ev.includes("fce-p-p1")&&r.ev.includes("fce-f-sp2")&&!r.ev.includes("fce-f-sp1"),name+": calendário do semestre com as semanas, prova e fechamento futuros ("+(r&&r.sum)+")");
  ok(r.heavy===1,name+": semana com prova e fechamento = semana pesada");
  /* 2. aula fixa amanhã: menos tempo no dia; na véspera (hoje) lembra de revisar os objetivos da SP aberta */
  await tap('#fcaa-s');
  await p.evaluate(()=>{const t=dnum(today());$("#fcaw-s").value=String(wdOf(t+1));$("#fcai-s").value="14:00";$("#fcaf-s").value="18:00";$("#fcat-s").value="Tutoria";$("#fcad-s").value="d"});
  await tap('#fcalb-dummy').catch(()=>{});await p.evaluate(()=>document.querySelector('#fcal-s .fcalform').requestSubmit());await p.waitForTimeout(200);
  r=await p.evaluate(()=>{const t=dnum(today());return {aul:(fac.aulas||[]).length,dm:dayMin(t+1),dm0:dayMin(t+2),grade:($("#fgr-s")||{}).textContent||""}});
  ok(r.aul===1&&r.dm===60&&r.dm0===180,name+": aula de 4 h no dia: 3 h+ vira 1 h (outros dias iguais) "+JSON.stringify(r));
  ok(/Tutoria · NCS – Tutoria/.test(r.grade),name+": a aula aparece em Toda semana");
  r=await p.evaluate(()=>{const t=dnum(today()),A=fac.aulas[0];calEd={aula:A.id};render();const id=`fgx-${A.id}-${fromNum(t+1)}`,b=document.getElementById(id);b.click();const a=dayMin(t+1),c=(fac.canc||{})[fromNum(t+1)];document.getElementById(id).click();return {a,c:!!c,back:dayMin(t+1)}});
  ok(r.a===180&&r.c&&r.back===60,name+": cancelar a aula de um dia devolve o tempo só nesse dia "+JSON.stringify(r));
  r=await p.evaluate(()=>{const t=dnum(today());wpTab=wpMon(t+1)===wpMon(t)?"cur":"next";goSub("config");render();const n=document.querySelector('.wpaula');const v=n&&n.textContent;
    wpSetDay(wpMon(t+1),wdOf(t+1),180);const ov=dayMin(t+1);wpReset(wpMon(t+1));goBack();return {v,ov,after:dayMin(t+1)}});
  ok(/aula: Tutoria 14h–18h/.test(r.v||"")&&r.ov===180&&r.after===60,name+": Planejar a semana mostra a aula; se você escolher o tempo do dia, vale a sua escolha "+JSON.stringify(r));
  /* 3. Estudar hoje: preparo da aula de amanhã e aviso depois da SP */
  r=await p.evaluate(()=>{setView("inicio");render();const L=[...document.querySelectorAll('#pFac li')].map(li=>li.textContent);return L});
  ok(r.some(x=>/^Amanhã tem Tutoria \(14h\): revise os objetivos da SP 3\.2/.test(x)),name+": véspera da tutoria: revisar os objetivos da SP aberta ("+(r[0]||"")+")");
  ok(r.some(x=>/SP 3\.1.*fechou ontem: faça questões/.test(x)),name+": SP que fechou ontem: questões enquanto está fresco");
  await p.evaluate(()=>{[...document.querySelectorAll('#pf-pos-sp1 button')].find(b=>b.textContent==="Dispensar").click()});await p.waitForTimeout(100);
  ok(await p.evaluate(()=>!document.getElementById("pf-pos-sp1")&&fac.discs[0].sps[0].pos===fac.discs[0].sps[0].fech),name+": Dispensar tira o aviso da SP");
  /* 4. entrega: no calendário e no Estudar hoje perto da data */
  await p.evaluate(()=>{backStack=[];setView("fac");render()});await tap('#fcae-s');
  await p.evaluate(()=>{const t=dnum(today());$("#fcen-s").value="Relatório da prática";$("#fced0-s").value=fromNum(t+2);document.querySelectorAll('#fcal-s .fcalform')[0].requestSubmit()});await p.waitForTimeout(150);
  r=await p.evaluate(()=>{const e=fac.ents&&fac.ents[0];const chip=e&&document.getElementById("fce-e-"+e.id);setView("inicio");render();const n=document.getElementById("pf-ent-"+(e&&e.id));return {e:!!e,chip:chip&&chip.textContent,n:n&&n.textContent}});
  ok(r.e&&/Entrega/.test(r.chip||"")&&/Relatório da prática/.test(r.chip),name+": entrega aparece no calendário ("+r.chip+")");
  ok(/^Entrega em 2 dias: Relatório da prática \(NCS – Tutoria\)/.test(r.n||""),name+": entrega perto aparece no Estudar hoje");
  await p.evaluate(()=>{[...document.querySelectorAll('#pFac li[id^="pf-ent"] button')][0].click()});await p.waitForTimeout(100);
  ok(await p.evaluate(()=>fac.ents[0].done===1&&!document.querySelector('#pFac li[id^="pf-ent"]')),name+": Já entreguei marca a entrega como feita");
  /* 5. mudar a data da prova e marcar adiada */
  await p.evaluate(()=>{backStack=[];setView("fac");render()});await tap('#fce-p-p1');
  r=await p.evaluate(()=>{const t=dnum(today()),i=document.getElementById("fced-p1");i.value=fromNum(t+20);document.getElementById("fcedOk-p1").click();return fac.provas[0].date===fromNum(t+20)});
  ok(r,name+": tocar na prova e mudar a data");
  await tap('#fce-p-p1');await p.evaluate(()=>document.getElementById("fcedAdi-p1").click());await p.waitForTimeout(100);
  r=await p.evaluate(()=>({adi:fac.provas[0].adi,up:upcomingProvas().length,later:!!document.querySelector('#fcal-s .fcallater #fce-p-p1')}));
  ok(r.adi===1&&r.up===0&&r.later,name+": prova adiada sai das próximas provas e vai para Adiados, sem data nova "+JSON.stringify(r));
  await tap('#fce-p-p1');r=await p.evaluate(()=>{const t=dnum(today());document.getElementById("fced-p1").value=fromNum(t+15);document.getElementById("fcedOk-p1").click();return {adi:fac.provas[0].adi,up:upcomingProvas().length}});
  ok(!r.adi&&r.up===1,name+": pôr a data nova volta a prova ao plano");
  await tap('#fce-f-sp2');await p.evaluate(()=>document.getElementById("fcedAdi-sp2").click());await p.waitForTimeout(100);
  ok(await p.evaluate(()=>fac.discs[0].sps[1].fadi===1&&!spFechas(30).length),name+": fechamento adiado sai do plano");
  /* 6. peso na residência nos conteúdos */
  r=await p.evaluate(()=>{facOpenDisc.add("d");render();return [...document.querySelectorAll('#sp-sp1 .fresw, #sp-sp2 .fresw')].map(x=>x.textContent)});
  ok(r.length===2&&r.every(x=>/^vale para a residência · peso [123]$/.test(x)),name+": SPs mostram o peso na residência ("+r.join(" · ")+")");
  /* 7. objetivos por foto */
  r=await p.evaluate(async()=>{sampleFn=Object.assign(async()=>({text:'Aqui está: {"tipo":"questoes","itens":["1. Descrever o diagnóstico da tuberculose pulmonar","Explicar o tratamento da tuberculose","Descrever a transmissão do HIV"]}'}),{json:async()=>({})});sampleOff=false;
    facOpenSP.add("sp2");render();await objFRun("sp2",new Blob(["x"],{type:"image/png"}));await new Promise(r=>setTimeout(r,50));const S=objF.sp2;
    return {st:S&&S.st,n:S&&S.list.length,t0:S&&S.list[0].t,k:S&&S.list.map(x=>x.k),ui:!!document.getElementById("fofOk-sp2")}});
  ok(r.st==="rev"&&r.n===3&&r.t0==="Descrever o diagnóstico da tuberculose pulmonar"&&r.ui,name+": foto lida: lista para conferir, sem a numeração "+JSON.stringify(r));
  const tbk=await p.evaluate(()=>Object.keys(BYKEY).find(k=>/Tuberculose/i.test(BYKEY[k].t)&&!BYKEY[k].own));
  ok(r.k[0]===tbk,name+": sugere ligar ao tema da residência mais próximo ("+r.k[0]+" = "+tbk+")");
  r=await p.evaluate(()=>{document.getElementById("fofk-sp2-0").click();document.getElementById("fofi-sp2-2").click();document.getElementById("fofOk-sp2").click();const s=fac.discs[0].sps[1];return {objs:s.objs,items:s.items}});
  ok(r.objs.length===2&&r.objs.includes("Explicar o tratamento da tuberculose")&&r.items.includes("T:"+tbk),name+": Adicionar põe os marcados como objetivos e liga o tema escolhido "+JSON.stringify(r.objs));
  /* 8. outro aparelho e backup levam a grade e as entregas */
  r=await p.evaluate(()=>{const B=buildBackup().data.fac;return {a:(B.aulas||[]).length,e:(B.ents||[]).length}});ok(r.a===1&&r.e===1,name+": backup leva aulas fixas e entregas");
  await p.waitForTimeout(1000);r=await p.evaluate(async()=>{const d=JSON.parse(JSON.stringify(fac));d.aulas.push({id:"a2",semId:"s",wd:2,ini:"08:00",fim:"12:00",t:"TBL"});window.__remote("data/users/u1/faculdade",d);liveAct=0;await new Promise(r=>setTimeout(r,300));return (fac.aulas||[]).length});
  ok(r===2,name+": aula criada em outro aparelho chega aqui");
  ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral");
  await p.screenshot({path:`t126-${name}.png`});
  await ctx.close()}
ok(errs.length===0,"sem erros de JavaScript"+(errs.length?": "+errs.slice(0,3).join(" | "):""));
await b.close()})();
