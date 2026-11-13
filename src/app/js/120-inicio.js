/* ----- 1. fila única do dia: erros, cartões, anotações para reler e temas ----- */
/* Lote 18: a fila começa pelos erros (rápidos, para aquecer; escolha do usuário), depois as revisões dos temas, e termina no plano do dia (tema novo, continuar, faculdade):
   "Começar" percorre tudo em sequência */
const QSTEPS=[["errs","Erros","erro","erros"],["revs","Temas para revisar","tema","temas"],["weak","Ponto fraco","questão","questões"],["redo","Questões para refazer","questão","questões"],["cards","Cartões","cartão","cartões"],["plan","Estudar hoje (plano)","tema","temas"]];
/* minutos estimados de cada parte da fila (mesma conta do freio de carga) */
function qStepMin(id,C){if(id==="plan"){const P=ensurePlan();return planMinutes(P)}return Math.round((C[id]||0)*(id==="weak"?MIN_EST.redo:MIN_EST[id]||0))}
const qTot=C=>C.errs+(C.weak||0)+(C.redo||0)+C.cards+C.notes+C.revs;
/* semana da prova da faculdade: cartões, erros e Refazer dos conteúdos dela vêm primeiro */
function pwKeys(){const P=provaWeek();return P.length?new Set(topicKeysOf(P.flatMap(p=>p.items))):null}
const pwFirst=(K,kOf)=>K?(a,b)=>(K.has(kOf(a))?0:1)-(K.has(kOf(b))?0:1):()=>0;
/* Lote 17: a fila do dia cabe no tempo do dia. Ela usa até metade do tempo marcado (mín. 20 min); as revisões de temas entram até onde couber
   (as mais importantes, pela ordem peso × atraso); as outras continuam pendentes e voltam nos próximos dias (e o freio segura os temas novos) */
const QUEUE_SHARE=.5,QUEUE_MIN=20,REV_DAY_MIN=3;
/* ordem do orçamento (auditoria 26/10): revisões de temas primeiro (até 70% do tempo da fila), depois erros, cartões e, com o que sobrar, o Refazer */
const QUEUE_REV=.7;
function qBudget(){const m=dayMin(dnum(today()));return m<=0?0:Math.max(QUEUE_MIN,Math.round(Math.min(m,240)*QUEUE_SHARE))}
function revCapToday(){const b=qBudget();return b?Math.max(REV_DAY_MIN,Math.floor(b*QUEUE_REV/MIN_EST.revs)):0}
function qCounts(){if(isOffDay())return {errs:0,weak:0,redo:0,cards:0,notes:0,revs:0,revAll:0,plan:0};const all=dueCount(),cap=revCapToday(),done=(hist[today()]||{}).r||0,o={notes:0};
  o.revAll=all;o.revCap=cap;o.revs=Math.min(all,Math.max(0,cap-done));
  let rest=qBudget()-Math.min(all+done,cap)*MIN_EST.revs;const take=(n,per)=>{const k=Math.max(0,Math.min(n,Math.floor(rest/per)));rest-=k*per;return k};
  const E=eDueList().length,C=cdDue().length,D=Math.min(RD_DAY,rdDueList().length),W=weakLeft();
  o.errs=Math.max(Math.min(E,3),take(E,MIN_EST.errs));o.weak=W?Math.max(W,0):0;rest-=o.weak*MIN_EST.redo;o.cards=Math.max(Math.min(C,10),take(C,MIN_EST.cards));o.redo=take(D,MIN_EST.redo);
  o.errAll=E;o.cardAll=C;o.redoAll=rdDueList().length;{const P=ensurePlan();o.plan=P.items.filter(x=>!itemDone(x)).length}return o}
let dayQ=null;try{const v=JSON.parse(lsGet("resid-dayq","null"));if(v&&v.d===today()&&Array.isArray(v.ids))dayQ=v}catch(e){}
function dayQSave(){lsSet("resid-dayq",dayQ?JSON.stringify(dayQ):null)}
function qGoStep(id){backStack=[];
  if(id==="errs"){setView("erros");setTimeout(()=>{const b=$("#erGo");if(b)b.click()},60)}
  else if(id==="weak"){const W=weakToday();if(W){detTab[W.k]="questoes";openTopic(W.k);setTimeout(()=>{const g=detGet("qf-",W.k);if(g)g.scrollIntoView({behavior:"smooth",block:"center"})},350)}}
  else if(id==="redo"){setView("quest");if(typeof setQSeg==="function")setQSeg("praticar","redo");const K=pwKeys(),ids=rdDueList().sort((a,b)=>pwFirst(K,x=>x.k)(a,b)||(rdDue(a)<rdDue(b)?-1:1)||b.n-a.n).slice(0,RD_DAY).map(x=>x.id);if(ids.length)rdStart(ids)}
  else if(id==="plan"){const P=ensurePlan(),x=P.items.find(p=>BYKEY[p.k]&&!itemDone(p));setView("inicio");if(x)startStep({k:x.k,kind:"plan"});else setTimeout(()=>{const c=$("#viewInicio .card.today");if(c)c.scrollIntoView({behavior:"smooth",block:"start"})},60)}
  else if(id==="cards"){setView("notas");if(typeof setNSeg==="function")setNSeg("revisar");setTimeout(()=>{const b=$("#cdGo");if(b)b.click()},60)}
  else if(id==="notes"){setView("notas");if(typeof setNSeg==="function")setNSeg("revisar");setTimeout(()=>{const h=document.querySelector("#viewNotas .ntoday");if(h)h.scrollIntoView({block:"start",behavior:"smooth"})},60)}
  else goRevs()}
/* revisões dos temas: ficam só na Residência (cartão .card.revs); k = rola até o tema */
function goRevs(k){backStack=[];tSeg="rev";try{localStorage.setItem("resid-tseg","rev")}catch(e){}if(k)revOpen[k]={v:true};setView("temas");
  setTimeout(()=>{const c=$("#viewTemas .card.revs"),x=k&&c?[...c.querySelectorAll(".rcard")].find(r=>r.dataset.k===k):null;if(x)x.scrollIntoView({behavior:"smooth",block:"center"});else if(c)c.scrollIntoView({behavior:"smooth",block:"start"})},60)}
function qStart(){const C=qCounts(),ids=QSTEPS.map(s=>s[0]).filter(id=>C[id]);if(!ids.length)return;dayQ={d:today(),ids,i:0};dayQSave();qGoStep(ids[0])}
function qNext(){if(!dayQ)return;const C=qCounts();let i=dayQ.i+1;while(i<dayQ.ids.length&&!C[dayQ.ids[i]])i++;
  if(i>=dayQ.ids.length){dayQ=null;dayQSave();qMsg="Fila do dia concluída. Bom trabalho!";setView("inicio");return}dayQ.i=i;dayQSave();qGoStep(dayQ.ids[i])}
function qStop(){dayQ=null;dayQSave();render()}
let qMsg="";
/* o que já foi feito hoje (fechamento do dia) */
function dayDone(){const T=today(),h=hist[T]||{},P=ensurePlan(),o=[];
  const cd=cards.filter(x=>x.f&&x.f.last===T).length,er=errors.filter(e=>e.lastRev===T).length,fo=foSum(foSess.filter(x=>x.d===T)),pd=P.items.filter(itemDone).length;
  if(h.r)o.push([h.r,h.r===1?"revisão de tema":"revisões de temas"]);if(h.e)o.push([h.e,h.e===1?"tema estudado":"temas estudados"]);
  if(h.q)o.push([h.q,`${h.q===1?"questão":"questões"} (${pct(h.c||0,h.q)}%)`]);if(cd)o.push([cd,cd===1?"cartão":"cartões"]);if(er)o.push([er,er===1?"erro revisado":"erros revisados"]);
  if(fo)o.push([fmtMin(fo),"de foco"]);if(P.items.length)o.push([`${pd}/${P.items.length}`,"do plano"]);return o}
/* Lote 20E: dia de folga: descanso, com sugestões curtas e opcionais (sem atraso, sem cobrança). Estudar na folga soma +1 na sequência. */
function offDayEl(){const w=el(`<div class="ioff" id="iOff"></div>`),rest=lsGet("resid-offrest","")===today(),W=hndWeek(),hnd=W&&W.d===today();
  w.appendChild(el(`<p class="ioffh"><b>${hnd?"Hoje não deu":"Dia de folga"}</b> · as revisões voltam ${nextStudyLabel()} e a sequência fica congelada.</p>`));
  if(hnd){const u=el(`<button class="link" type="button" id="iHndUndo">Desfazer “Hoje não deu”</button>`);u.onclick=hndUndo;w.appendChild(u)}
  if(rest){const p=el(`<p class="how">Bom descanso. <button class="link" type="button" id="iOffShow">Mostrar sugestões leves</button></p>`);p.querySelector("button").onclick=()=>{lsSet("resid-offrest",null);render()};w.appendChild(p);return w}
  const T=today(),ne=eDueList().length,nc=cards.filter(x=>cdLive(x)&&x.f&&x.f.st&&x.due<=T).length,L=[];
  if(ne)L.push(["errs",`Erros que vencem: ${ne}`,ne*1.5,()=>{backStack=[];setView("erros")}]);
  if(nc)L.push(["cards",`Cartões vencidos: ${nc}`,nc*.25,()=>{backStack=[];setView("notas");if(typeof setNSeg==="function")setNSeg("revisar")}]);
  if(sampleFn&&!sampleOff)L.push(["sim","Bloco rápido de 5 questões",10,()=>{const U=qUniverse(),wk=simTopics("week",U);simCfg={...simCfg,mode:"temas",src:wk.length?"week":"gain",n:5};backStack=[];setView("quest");if(typeof setQSeg==="function")setQSeg("praticar");simStart(U)}]);
  if(L.length){const mn=Math.round(L.reduce((a,x)=>a+x[2],0));w.appendChild(el(`<p class="how">Se quiser, algo leve (≈ ${mn} min). Estudar hoje soma +1 na sequência.</p>`));
    const ul=el(`<ul class="iofflist"></ul>`);L.forEach(([id,lab,,go])=>{const li=el(`<li><span></span><button class="link" type="button"></button></li>`);li.querySelector("span").textContent=lab;const b=li.querySelector("button");b.id="iOff-"+id;b.textContent="abrir";b.onclick=go;ul.appendChild(li)});w.appendChild(ul)}
  const r=el(`<button class="btn" type="button" id="iOffRest">Hoje é só descanso</button>`);r.onclick=()=>{lsSet("resid-offrest",today());render()};w.appendChild(r);return w}
function iQueueCard(){const C=qCounts(),tot=qTot(C),all=tot+(C.plan||0),eve=isEve(),c=el(`<section class="card iqueue" id="iQueue" aria-labelledby="iqh"><div class="dhead"><h2 id="iqh">Fila do dia</h2><span class="todaydate"></span></div></section>`);
  const mins={};QSTEPS.forEach(([id])=>{mins[id]=C[id]?qStepMin(id,C):0});const totMin=Object.values(mins).reduce((a,b)=>a+b,0);
  c.querySelector(".todaydate").textContent=all?`${all} ${all===1?"item":"itens"} · ≈ ${fmtMin(totMin*60)}`:"";
  if(qMsg){const m=el(`<p class="pnote" role="status"></p>`);m.textContent=qMsg;c.appendChild(m);qMsg=""}
  const K=pwKeys();
  if(K&&all){const P=provaWeek()[0],n=daysTo(P.date),pe=el(`<p class="iqpw"></p>`);pe.textContent=`Semana da prova ${P.name} (${n===0?"hoje":n===1?"amanhã":`em ${n} dias`}): cartões, erros e questões para refazer dos conteúdos dela vêm primeiro.`;c.appendChild(pe)}
  if(!all&&isOffDay()){c.appendChild(offDayEl())}
  else if(!all){c.appendChild(el(`<p class="cempty">Fila e plano em dia: temas, cartões, erros e o plano de hoje estão feitos.</p>`))}
  else{const ul=el(`<ul class="iqlist"></ul>`);QSTEPS.forEach(([id,lab])=>{const n=C[id]||0,on=dayQ&&dayQ.ids[dayQ.i]===id;if(id==="plan"&&!ensurePlan().items.length)return;
      const li=el(`<li class="${n?"":"done"}${on?" on":""}${id==="plan"?" plan":""}"><span class="iqn"></span><span class="iql"></span><span class="iqt"></span><button class="link" type="button">abrir</button></li>`);li.dataset.step=id;
      li.querySelector(".iqn").textContent=n?String(n):"✓";li.querySelector(".iql").textContent=lab;li.querySelector(".iqt").textContent=n&&mins[id]?`≈ ${fmtMin(mins[id]*60)}`:"";
      const more=t=>{const x=el(`<span class="iqmore"></span>`);x.textContent=t;li.querySelector(".iql").appendChild(x)};
      if(id==="weak"){const W=weakToday();if(!W){li.remove();return}const r=accRecent(get(W.k))||{a:acc(get(W.k))||0};li.querySelector(".iql").textContent=`Ponto fraco: ${BYKEY[W.k].t}`;more(`${Math.round(r.a*100)}% de acerto · ${WEAK_DAY_Q} questões hoje; o tema descansa ${WEAK_REST} dias depois`)}
      if(id==="plan"&&n){const P=ensurePlan(),L=P.items.filter(x=>!itemDone(x)).map(x=>BYKEY[x.k]&&BYKEY[x.k].t).filter(Boolean);more(L.slice(0,2).join(" · ")+(L.length>2?` e mais ${L.length-2}`:""))}
      if(id==="revs"&&!n&&C.revAll)more(`as de hoje já foram feitas; ${C.revAll} ${C.revAll===1?"fica":"ficam"} para os próximos dias`);
      {const al=C[{revs:"revAll",errs:"errAll",cards:"cardAll",redo:"redoAll"}[id]];if(n&&al>n)more(id==="revs"?`as ${n} mais importantes de ${al}; as outras ficam para os próximos dias`:`${n} de ${al} (o que cabe no tempo de hoje)`)}
      if(K&&n){const L=id==="errs"?eDueList():id==="cards"?cdDue():id==="redo"?rdDueList():null;if(L){const m=Math.min(n,L.filter(x=>K.has(x.k)).length);if(m)more(`${m} da prova`)}}
      li.querySelector("button").onclick=()=>qGoStep(id);if(!n)li.querySelector("button").remove();ul.appendChild(li)});c.appendChild(ul);
    /* cabe no tempo de hoje? */
    const dm=dayMin(dnum(today()));if(dm>0&&totMin){const f=el(`<p class="iqfit"></p>`),over=totMin-dm;
      if(over>0){f.classList.add("over");f.innerHTML=`<b>Passa ≈ ${fmtMin(over*60)} do seu tempo de hoje (${hm(dm)}).</b> Comece pela fila; o que não der do plano volta amanhã.`}
      else f.innerHTML=`<b>Cabe no seu tempo de hoje (${hm(dm)}).</b>${dm-totMin>=20?` Sobra ≈ ${fmtMin((dm-totMin)*60)}.`:""}`;c.appendChild(f)}}
  /* fechamento do dia: à noite, ou quando tudo foi feito */
  if(eve||!all){const D=dayDone();if(D.length||eve){const box=el(`<div class="iqday"><p class="iqdh">Feito hoje</p></div>`);
      if(D.length){const u=el(`<ul class="iqdone"></ul>`);D.forEach(([v,t])=>{const li=el(`<li><b></b><span></span></li>`);li.querySelector("b").textContent=String(v);li.querySelector("span").textContent=t;u.appendChild(li)});box.appendChild(u)}
      else box.appendChild(el(`<p class="how">Nada registrado ainda hoje.</p>`));
      if(!all&&recActive().some(k=>dueIn(get(k))>0)){const m=el(`<button class="btn" type="button" id="recMore">Revisar mais 3 do atraso</button>`);m.onclick=()=>recPull(3);box.appendChild(m)}
      if(eve&&all){box.appendChild(el(`<p class="iqdh">Pode ficar para amanhã</p>`));const u=el(`<ul class="iqlater"></ul>`),add=t=>{const li=el(`<li></li>`);li.textContent=t;u.appendChild(li)};
        if(C.revs)add(`${C.revs} ${C.revs===1?"revisão de tema":"revisões de temas"}: amanhã voltam primeiro, pelas mais importantes.`);
        const sm=(C.errs||0)+(C.cards||0)+(C.redo||0);if(sm)add(`Erros, cartões e questões para refazer (${sm}): continuam na fila de amanhã.`);
        if(C.plan)add(`${C.plan} ${C.plan===1?"tema do plano":"temas do plano"}: o que você começou continua amanhã, de onde parou.`);
        add("Se der, faça só a primeira parte hoje: as revisões são as que mais pesam.");box.appendChild(u)}
      c.appendChild(box)}}
  const a=el(`<div class="btns"></div>`);
  if(dayQ){const cur=QSTEPS.find(s=>s[0]===dayQ.ids[dayQ.i]),b=el(`<button class="btn primary" type="button" id="iqGo"></button>`);b.textContent=`Continuar: ${cur?cur[1].toLowerCase():"próximo"}`;b.onclick=()=>qGoStep(dayQ.ids[dayQ.i]);
    const x=el(`<button class="link" type="button">Sair da fila</button>`);x.onclick=qStop;if(heroOn())a.append(x);else a.append(b,x)}
  else if(all&&!heroOn()){const b=el(`<button class="btn primary" type="button" id="iqGo">Começar</button>`);b.onclick=qStart;a.appendChild(b)}
  if(a.children.length)c.appendChild(a);
  if(all)c.appendChild(el(`<p class="how hx">Começar percorre tudo na ordem: erros, revisões dos temas (reler a anotação faz parte), ponto fraco, questões para refazer, cartões e o plano. Termine cada parte e toque em <b>Próximo</b>, na barra de baixo.</p>`));return c}
function renderQBar(){let bar=$("#qBar");const on=!!dayQ&&!bulk;if(!on){if(bar)bar.remove();document.body.classList.remove("hasqbar");return}
  if(!bar){bar=el(`<div class="dqbar" id="qBar" role="region" aria-label="Fila do dia"></div>`);document.body.appendChild(bar)}bar.innerHTML="";document.body.classList.add("hasqbar");
  const C=qCounts(),cur=QSTEPS.find(s=>s[0]===dayQ.ids[dayQ.i]),nx=dayQ.ids.slice(dayQ.i+1).find(id=>C[id]),nxs=QSTEPS.find(s=>s[0]===nx);
  const t=el(`<span class="qbt"><b></b><span></span></span>`);t.querySelector("b").textContent=`Fila do dia · ${dayQ.i+1} de ${dayQ.ids.length}`;t.querySelector("span").textContent=cur?`${cur[1]}${C[cur[0]]?` · faltam ${C[cur[0]]}`:" · feito ✓"}`:"";bar.appendChild(t);
  const n=el(`<button class="btn primary" type="button" id="qNext"></button>`);n.textContent=nxs?`Próximo: ${nxs[1].toLowerCase()}`:"Concluir";n.onclick=qNext;
  const x=el(`<button class="link" type="button">Sair</button>`);x.onclick=qStop;bar.append(n,x)}
/* ----- 7 e 10. avisos: artefato × site e lembrete de backup ----- */
const lastBk=()=>lsGet("resid-lastbk","");
function markBackup(){lsSet("resid-lastbk",today())}
function hasData(){return Object.keys(state).length>0||errors.length>0||Object.keys(notes).length>0}
function iNoticeEl(){const box=el(`<div class="inotices"></div>`);{const rn=recNoteEl();if(rn)box.appendChild(rn)}
  if(!window.__site&&lsGet("resid-artnote-v1","")!=="1"){const n=el(`<div class="inote"><p><b>Você vai usar o site.</b> Os dados deste artefato ficam separados do site: o que você marcar aqui não aparece lá. Para levar o progresso, use <b>Perfil › Backup › Exportar</b> e, no site, <b>Importar</b>.</p><div class="btns"><a class="btn primary" target="_blank" rel="noopener">Abrir o site</a><button class="link" type="button">Entendi</button></div></div>`);
    n.querySelector("a").href=SITE_URL;n.querySelector(".link").onclick=()=>{lsSet("resid-artnote-v1","1");render()};box.appendChild(n)}
  const lb=lastBk(),days=lb?dnum(today())-dnum(lb):null,first=Object.keys(hist).sort()[0],age=first?dnum(today())-dnum(first):0,logged=!!(window.__site&&store);
  const snooze=lsGet("resid-bksnooze","");
  if(hasData()&&!logged&&(days===null?age>=30:days>=30)&&!(snooze&&snooze>=today())){const n=el(`<div class="inote warn"><p></p><div class="btns"><button class="btn" type="button">Fazer backup agora</button><button class="link" type="button">Lembrar em 7 dias</button></div></div>`);
    n.querySelector("p").textContent=days===null?"Você nunca fez um backup dos seus dados. Sem conta, eles ficam só neste aparelho: um backup evita perder tudo se o navegador for limpo.":`Seu último backup foi há ${days} dias. Exporte um novo para não perder o que estudou desde então.`;
    const [go,sn]=n.querySelectorAll("button");go.onclick=()=>{goSub("config");setTimeout(()=>{const b=$("#bkSave");if(b)b.scrollIntoView({block:"center",behavior:"smooth"})},80)};sn.onclick=()=>{lsSet("resid-bksnooze",fromNum(dnum(today())+7));render()};box.appendChild(n)}
  return box.children.length?box:null}
/* ----- 4. resumo da semana (domingo: esta semana; segunda: a que passou) ----- */
function weekStats(ws){const r={fo:0,q:0,c:0,e:0,rv:0,er:0};const we=ws+6;
  foSess.forEach(x=>{const n=dnum(x.d);if(n>=ws&&n<=we)r.fo+=x.sec});
  for(let n=ws;n<=we;n++){const h=hist[fromNum(n)];if(h){r.q+=h.q||0;r.c+=h.c||0;r.e+=h.e||0;r.rv+=h.r||0}}
  errors.forEach(e=>{if(!e.d)return;const n=dnum(e.d);if(n>=ws&&n<=we)r.er++});return r}
function iWeekCard(){const dow=new Date().getDay();if(dow!==0&&dow!==1)return null;const ws=dow===0?foWeekStart():foWeekStart()-7;if(lsGet("resid-wkdis","")===String(ws))return null;
  const A=weekStats(ws),B=weekStats(ws-7);if(!A.fo&&!A.q&&!A.e&&!A.rv)return null;
  const c=el(`<section class="card iweek" id="iWeek" aria-labelledby="iwh"><div class="dhead"><h2 id="iwh"></h2><button class="link" type="button">Fechar</button></div><div class="iwk"></div><p class="how"></p></section>`);
  c.querySelector("h2").textContent=dow===0?"Sua semana":"Semana passada";c.querySelector(".dhead .link").onclick=()=>{lsSet("resid-wkdis",String(ws));render()};
  const cmp=(a,b,fmt)=>{if(!b)return "";const d=a-b;return d===0?" · igual":` · ${d>0?"▲":"▼"} ${fmt(Math.abs(d))}`};
  const rows=[["Foco",fmtMin(A.fo),cmp(A.fo,B.fo,fmtMin)],["Questões",A.q?`${A.q} · ${pct(A.c,A.q)}%`:"0",cmp(A.q,B.q,String)],["Temas estudados",String(A.e),cmp(A.e,B.e,String)],["Revisões",String(A.rv),cmp(A.rv,B.rv,String)],["Erros registrados",String(A.er),cmp(A.er,B.er,String)]];
  const g=c.querySelector(".iwk");rows.forEach(([l,v,d])=>{const r=el(`<div class="kpi"><span class="kl"></span><b></b><span class="ks"></span></div>`);r.querySelector(".kl").textContent=l;r.querySelector("b").textContent=v;r.querySelector(".ks").textContent=d?`vs. anterior${d}`:"";g.appendChild(r)});
  const best=A.fo>B.fo&&B.fo?"Mais tempo de foco que na semana anterior.":A.q>B.q&&B.q?"Mais questões que na semana anterior.":"";
  c.querySelector("p.how").textContent=`${br(fromNum(ws))} a ${br(fromNum(ws+6))}.${best?" "+best:""}`;return c}
/* ----- 12. Início personalizável ----- */
/* ---------- Início: saudação do dia (#iHero) — data, "Bom dia, Nome.", o que espera hoje, prova perto, feito real ou frase do dia e o botão da fila ---------- */
const heroDate=()=>{const s=new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"});return s.charAt(0).toUpperCase()+s.slice(1)};
const nowHour=()=>typeof window.__hour==="number"?window.__hour:new Date().getHours();
/* Lote 18: depois das 19 h o Início vira o fechamento do dia (o que foi feito e o que pode ficar para amanhã) */
const DAY_EVE=19,isEve=()=>nowHour()>=DAY_EVE;
function heroHi(){const h=nowHour();return h>=5&&h<12?"Bom dia":h>=12&&h<18?"Boa tarde":"Boa noite"}
const heroOn=()=>!iHidden().has("iHero");
function heroActive(d){const h=hist[d];return !!(h&&((h.e||0)+(h.r||0)+(h.q||0)>0))||foSess.some(x=>x.d===d&&x.sec>=300)}
/* feitos reais: sequência de dias, questões de ontem, especialidade que melhorou, foco da semana */
function heroFeats(){const out=[],t=dnum(today());
  {const on=heroActive(today()),n=runStreak(heroActive);
    if(n>=3)out.push(on?`${n} dias seguidos estudando. Bela sequência.`:`${n} dias seguidos estudando. Estude hoje para manter a sequência.`)}
  {const h=hist[fromNum(t-1)];if(h&&(h.q||0)>=15)out.push(`Ontem você fez ${h.q} questões${h.c!=null?`, com ${pct(h.c||0,h.q)}% de acerto`:""}.`)}
  {const a={},r=fromNum(t-30),o=fromNum(t-120);ALL.forEach(it=>{const s=get(it.key),sp=it.sp||it.area.name,x=a[sp]||(a[sp]={q1:0,c1:0,q0:0,c0:0});
      for(const d in s.qd||{}){const v=s.qd[d];if(!Array.isArray(v)||d<o)continue;if(d>r){x.q1+=v[0]||0;x.c1+=v[1]||0}else{x.q0+=v[0]||0;x.c0+=v[1]||0}}});
    let best=null;for(const sp in a){const x=a[sp];if(x.q1<10||x.q0<10)continue;const p1=pct(x.c1,x.q1),p0=pct(x.c0,x.q0);if(p1-p0>=10&&(!best||p1-p0>best.g))best={sp,p0,p1,g:p1-p0}}
    if(best)out.push(`Seu acerto em ${best.sp} subiu de ${best.p0}% para ${best.p1}% no último mês.`)}
  {const ws=t-(new Date().getDay()+6)%7,s=foSum(foSess.filter(x=>dnum(x.d)>=ws&&dnum(x.d)<=t));if(s>=5*3600)out.push(`Esta semana você já soma ${fmtMin(s)} de estudo focado.`)}
  return out}
function heroLine(){const F=heroFeats(),n=dnum(today());return F.length?{feat:true,t:F[n%F.length]}:{feat:false,t:HERO_FRASES[((n%HERO_FRASES.length)+HERO_FRASES.length)%HERO_FRASES.length]}}
function heroSummary(C){const tot=qTot(C),all=tot+(C.plan||0);if(isOffDay())return `Hoje é seu dia de folga. Descanse: as revisões voltam ${nextStudyLabel()}.`;
  if(dayQ){const left=dayQ.ids.slice(dayQ.i).reduce((a,id)=>a+(C[id]||0),0);return left?`Fila do dia em andamento: ${left===1?"falta 1 item":`faltam ${left} itens`}.`:"Fila do dia quase no fim."}
  if(isEve()){const D=dayDone().filter(x=>!/do plano/.test(x[1])).slice(0,3).map(([v,t])=>`${v} ${t}`);const m=QSTEPS.reduce((a,[id])=>a+(C[id]?qStepMin(id,C):0),0);
    return (D.length?`Hoje você fez ${D.join(", ")}.`:"Hoje ainda não teve estudo registrado.")+(all?` Falta ≈ ${fmtMin(m*60)}; o que não der pode ficar para amanhã.`:" Fila e plano feitos. Bom descanso.")}
  if(tot){const m=qMinutes(C);return `Sua fila de hoje está pronta: cerca de ${fmtMin(m*60)}. Comece por ela; o plano vem depois.`}
  const s=nextSteps()[0];return s?`Revisões em dia. Próximo: ${s.t}.`:"Tudo feito por hoje. Bom trabalho."}
function heroExam(){const out=[],t=dnum(today()),m=exMain();if(isSimDay())out.push("Hoje é dia de simulado e provas.");
  if(m&&m.date){const n=dnum(m.date)-t;if(n===0)out.push(`Hoje é dia de ${m.name}. Boa prova!`);else if(n>0&&n<=365)out.push(`${n===1?"Falta 1 dia":`Faltam ${n} dias`} para ${m.name}.`)}
  const p=upcomingProvas().find(x=>x.date&&dnum(x.date)-t>=0&&dnum(x.date)-t<=7);if(p){const n=dnum(p.date)-t;out.push(`${/^prova\b/i.test(p.name)?"":"Prova "}${p.name} da faculdade ${n===0?"hoje":n===1?"amanhã":`em ${n} dias`}.`)}
  return out.join(" · ")}
function heroCard(){const C=qCounts(),tot=qTot(C)+(C.plan||0),nm=(ui.profile.name||"").trim().split(/\s+/)[0],L=heroLine(),ex=heroExam();
  const c=el(`<div class="iherob"><span class="hdate"></span><h2 class="hhi"></h2><p class="hsum"></p>${ex?`<p class="hexam"></p>`:""}<p class="hline"></p><div class="herobtns"></div></div>`);
  c.querySelector(".hdate").textContent=heroDate();c.querySelector(".hhi").textContent=`${heroHi()}${nm?", "+nm:""}.`;c.querySelector(".hsum").textContent=heroSummary(C);
  if(ex)c.querySelector(".hexam").textContent=ex;const hl=c.querySelector(".hline");hl.textContent=L.t;if(L.feat)hl.classList.add("feat");
  const B=c.querySelector(".herobtns"),btn=(t,fn)=>{const b=el(`<button class="herobtn" type="button" id="heroGo"></button>`);b.textContent=t+" →";b.onclick=fn;B.appendChild(b)};
  if(dayQ)btn("Continuar a fila",()=>qGoStep(dayQ.ids[dayQ.i]));
  else if(tot)btn("Começar",qStart);
  else if(!isOffDay()){const s=nextSteps()[0];if(s)btn(s.kind==="rev"?"Revisar agora":s.kind==="sim"||s.kind==="exam"?"Fazer agora":"Estudar agora",()=>startStep(s))}
  if(!B.children.length)B.remove();return c}
const ICARDS=[["iHero","Saudação e frase do dia"],["iQueue","Fila do dia"],["iBoard","Seu dia (placar e o que fazer agora)"],["iWeek","Sua semana e Planejar a semana (domingo e segunda)"],["iToday","Estudar hoje"],["iProva","Próxima prova"],["iStats","Seu progresso"]];
let iCustom=false;
/* Lote 17: "Seu progresso" sai do Início por padrão (continua na Residência e nas Estatísticas); quem personalizou mantém a escolha */
function iHidden(){return new Set(Array.isArray(ui.prefs.ihide)?ui.prefs.ihide:["iStats"])}
function iOrder(){const o=Array.isArray(ui.prefs.iorder)?ui.prefs.iorder.filter(id=>ICARDS.some(c=>c[0]===id)):[];if(o.length&&!o.includes("iHero"))o.unshift("iHero");ICARDS.forEach(c=>{if(!o.includes(c[0]))o.push(c[0])});return o}
function applyICustom(){const H=iHidden(),O=iOrder();ICARDS.forEach(([id])=>{const e=document.getElementById(id);if(!e)return;e.classList.toggle("ihid",H.has(id));e.style.order=String(O.indexOf(id)+1)})}
function iCustomEl(){const w=el(`<div class="icustom"></div>`);
  if(!iCustom){const b=el(`<button class="link" type="button" id="iCustB">Personalizar o Início</button>`);b.onclick=()=>{iCustom=true;render()};w.appendChild(b);return w}
  const H=iHidden(),O=iOrder(),c=el(`<section class="card icust"><div class="dhead"><h2>Personalizar o Início</h2><button class="link" type="button">Concluir</button></div><p class="how hx">Escolha o que aparece e a ordem. Nada é apagado: o que você esconder continua nas outras abas.</p><ul class="icl"></ul><button class="link" type="button">Voltar ao padrão</button></section>`);
  c.querySelector(".dhead .link").onclick=()=>{iCustom=false;render()};
  const ul=c.querySelector(".icl"),save=()=>{saveUI();render()};
  O.forEach((id,i)=>{const lab=ICARDS.find(x=>x[0]===id)[1],li=el(`<li><label><input type="checkbox"><span></span></label><button class="mini" type="button" aria-label="Subir">↑</button><button class="mini" type="button" aria-label="Descer">↓</button></li>`);
    const cb=li.querySelector("input");cb.checked=!H.has(id);cb.id="icb-"+id;li.querySelector("span").textContent=lab;
    cb.onchange=()=>{const h=iHidden();cb.checked?h.delete(id):h.add(id);ui.prefs.ihide=[...h];save()};
    const [up,dn]=li.querySelectorAll("button");up.disabled=i===0;dn.disabled=i===O.length-1;
    up.onclick=()=>{const o=iOrder();[o[i-1],o[i]]=[o[i],o[i-1]];ui.prefs.iorder=o;save()};dn.onclick=()=>{const o=iOrder();[o[i+1],o[i]]=[o[i],o[i+1]];ui.prefs.iorder=o;save()};ul.appendChild(li)});
  c.querySelector(".icust>.link:last-child").onclick=()=>{delete ui.prefs.ihide;delete ui.prefs.iorder;save()};w.appendChild(c);return w}
/* ---------- Meta e projeção: provas de residência (lista + principal) e linha do tempo semanal ---------- */
const exList=()=>Array.isArray(ui.profile.exams)?ui.profile.exams:[];
const exMain=()=>{const L=exList();return L.find(x=>x.id===ui.profile.mainEx)||L[0]||null};
let projOpen=lsGet("resid-projopen","")==="1",projAll=false;
const PJ_SHOW=8;
/* modelo: temas não vistos distribuídos pelas semanas (semanas de prova pesam menos), revisões já agendadas + as dos temas
   novos planejados, cartões vencendo, meta de questões e marcos (faculdade, SP, residência) */
/* média de dias (partes) por tema ainda não estudado: tema grande ocupa uma vaga do plano em vários dias */
function partsAvg(){let n=0,p=0;ALL.forEach(it=>{const s=get(it.key);if(s.last||s.l>0)return;n++;const L=subList(it),P=subParts(L);p+=Math.max(1,P.filter(q=>q.some(x=>!x.done)).length)});return n?p/n:1}
function projModel(){const t=dnum(today()),ws0=foWeekStart(),main=exMain(),end=main&&main.date&&main.date>=today()?dnum(main.date):null;
  const left=counts(ALL)[0];let e4=0;for(let i=0;i<28;i++){const h=hist[fromNum(t-i)];if(h)e4+=h.e||0}const pace=e4/4,cap=weekCap()/partsAvg();
  let done0=0;for(let n=ws0;n<=t;n++){const h=hist[fromNum(n)];if(h)done0+=h.e||0}
  let q0=0;for(let n=ws0;n<=t;n++){const h=hist[fromNum(n)];if(h)q0+=h.q||0}
  const rate=pace>0?pace:cap,total=left+done0;
  let nW=end!==null?Math.floor((end-ws0)/7)+1:Math.ceil(total/Math.max(rate,.5))+1;nW=Math.max(1,Math.min(nW,end!==null?104:52));
  const W=[];for(let i=0;i<nW;i++){const s=ws0+i*7;W.push({s,wt:1,ev:[],rv:0,cd:0,nw:0})}
  const wi=n=>{const i=Math.floor((n-ws0)/7);return i>=0&&i<nW?i:-1};
  upcomingProvas().forEach(p=>{const n=dnum(p.date),i=wi(n),d=discOf(p.discId);if(i>=0){W[i].ev.push({k:"fac",t:p.name,d:p.date,sub:d?provaDiscName(p):""});W[i].wt=Math.min(W[i].wt,.4)}
    const j=wi(n-7);if(j>=0&&j!==i)W[j].wt=Math.min(W[j].wt,.6)});
  spFechas(9999).forEach(f=>{const i=wi(dnum(f.s.fech));if(i>=0){W[i].ev.push({k:"sp",t:`Fechamento: ${spShort(f.s.name)}`,d:f.s.fech,sub:f.d.name});W[i].wt=Math.min(W[i].wt,.75)}});
  exList().forEach(x=>{if(!x.date||x.date<today())return;const i=wi(dnum(x.date));if(i>=0){W[i].ev.push({k:"res",t:x.name||"Prova de residência",d:x.date,main:!!main&&x.id===main.id});W[i].wt=Math.min(W[i].wt,.2)}});
  W.forEach(w=>w.ev.sort((a,b)=>a.d<b.d?-1:1));
  /* temas novos por semana */
  const sumW=W.reduce((a,w)=>a+w.wt,0),need=end!==null?total/Math.max(sumW,.01):null;
  let acc=0,given=0;W.forEach(w=>{const want=end!==null?need*w.wt:Math.min(rate*w.wt,total-acc);acc+=want;const n=Math.max(0,Math.round(acc)-given);w.nw=n;given+=n});
  if(end===null){let r=total-given;for(let i=W.length-1;r>0&&i>=0;i--){W[i].nw++;r--}}
  /* revisões: as já agendadas e as dos temas novos planejados (estudados no meio da semana) */
  const chain=(d,step,n)=>{for(let g=0;g<12;g++){const i=wi(d);if(i<0)break;W[i].rv+=n;step++;d+=INT[Math.min(step,INT.length-1)]}};
  ALL.forEach(it=>{const s=get(it.key);if(!s.last)return;const di=dueIn(s);if(di===null)return;chain(t+Math.max(di,0),s.step||0,1)});
  W.forEach((w,i)=>{const n=i===0?Math.max(0,w.nw-done0):w.nw;if(n)chain(Math.max(t,w.s+3)+INT[0],0,n)});
  W.forEach(w=>w.rv=Math.round(w.rv));
  cards.forEach(x=>{if(!BYKEY[x.k]||!x.due)return;const i=wi(Math.max(dnum(x.due),t));if(i>=0)W[i].cd++});
  const rvs=W.map(w=>w.rv).filter(Boolean).sort((a,b)=>a-b),med=rvs.length?rvs[Math.floor(rvs.length/2)]:0;W.forEach(w=>w.heavy=w.rv>=10&&w.rv>med*1.5);
  /* cabe até a prova? */
  let out=0;if(end!==null&&pace<need){const fit=pace*sumW;out=Math.max(0,Math.ceil(total-fit))}
  const endPace=pace>0?fromNum(t+Math.ceil(left/pace)*7):null;
  return {W,left,pace,cap,need,end,main,done0,q0,out,endPace,total}}
function projWeekLab(s,i){return i===0?"Esta semana":i===1?"Próxima semana":`${br(fromNum(s))} a ${br(fromNum(s+6))}`}
function projWeeksEl(M){const w=el(`<div class="pjw" id="projWeeks"></div>`),qg=ui.prefs.qgoal||0,L=projAll?M.W:M.W.slice(0,PJ_SHOW);
  const head=el(`<div class="pjrow pjhead" aria-hidden="true"><span>Semana</span><span>Temas novos</span><span>Revisões</span><span>Cartões</span>${qg?"<span>Questões</span>":""}</div>`);w.appendChild(head);
  if(!qg)w.classList.add("noq");
  L.forEach((x,i)=>{const r=el(`<div class="pjrow${i===0?" now":""}${x.ev.length?" hasev":""}"><span class="pjl"><b></b><i></i></span><span class="pjc pjn"><b></b><i>temas novos</i></span><span class="pjc pjr"><b></b><i>revisões</i></span><span class="pjc pjd"><b></b><i>cartões</i></span>${qg?`<span class="pjc pjq"><b></b><i>questões</i></span>`:""}</div>`);
    r.querySelector(".pjl b").textContent=projWeekLab(x.s,i);r.querySelector(".pjl i").textContent=i<2?`${br(fromNum(x.s))} a ${br(fromNum(x.s+6))}`:"";
    const nb=r.querySelector(".pjn b");nb.textContent=i===0?`${M.done0} de ${Math.max(x.nw,M.done0)}`:String(x.nw);if(x.wt<1&&x.ev.some(e=>e.k!=="sp"))r.querySelector(".pjn i").textContent="temas novos (semana de prova)";
    const rb=r.querySelector(".pjr b");rb.textContent=String(x.rv);if(x.heavy){rb.classList.add("heavy");rb.title="Semana pesada de revisões";r.querySelector(".pjr i").textContent="revisões · semana pesada"}
    r.querySelector(".pjd b").textContent=String(x.cd);
    if(qg)r.querySelector(".pjq b").textContent=i===0?`${M.q0} de ${qg}`:String(qg);
    if(x.ev.length){const ev=el(`<span class="pjev"></span>`);x.ev.forEach(e=>{const c=el(`<span class="pjchip ${e.k}${e.main?" main":""}"></span>`);c.textContent=`${e.k==="fac"?"Prova":e.k==="res"?"Residência":"Fechamento"} · ${e.k==="sp"?e.t.replace(/^Fechamento: /,""):e.t} (${br(e.d)})`;if(e.sub)c.title=e.sub;ev.appendChild(c)});r.appendChild(ev)}
    w.appendChild(r)});
  if(M.W.length>PJ_SHOW){const m=el(`<button class="link" type="button" id="projAll"></button>`);m.textContent=projAll?"Mostrar menos":`Ver todas as ${M.W.length} semanas`;m.onclick=()=>{projAll=!projAll;render()};w.appendChild(m)}
  w.appendChild(el(`<p class="how hx">Semanas com prova da faculdade ou de residência recebem menos temas novos; as outras compensam. As revisões contam as já agendadas e as dos temas novos previstos. Tudo se recalcula a cada dia, com o que você fez.</p>`));
  return w}
function projEl(){const M=projModel(),w=el(`<div class="iproj"></div>`),fmt=x=>x.toLocaleString("pt-BR",{maximumFractionDigits:1});
  if(!M.left){w.innerHTML=`<p class="ks"><b>Todos os ${TOTAL} temas já foram vistos.</b> Até a prova: revisões e questões, principalmente nos pontos fracos.</p>`}
  else if(M.end!==null){const ok=M.pace>=M.need;
    w.innerHTML=`<div class="iprow"><span>Faltam <b>${M.left}</b> ${M.left===1?"tema":"temas"} para ver</span><span>precisa de <b>${fmt(M.need)}</b> por semana</span><span class="${ok?"ok":"late"}">seu ritmo: <b>${fmt(M.pace)}</b> por semana</span></div>`;
    const msg=el(`<p class="ks"></p>`);
    msg.textContent=M.pace===0?"Nas últimas 4 semanas nenhum tema novo foi estudado. Comece pelo plano de hoje.":ok?`No ritmo atual, você termina de ver os temas por volta de ${br(M.endPace)}/${M.endPace.slice(0,4)}, antes da prova.`:`No ritmo atual, cerca de ${M.out} ${M.out===1?"tema ficaria":"temas ficariam"} sem ver até a prova (os de menor incidência ficam por último). Para ver todos, suba para ${Math.ceil(M.need)} por semana${Math.ceil(M.need)>M.cap?` (seu plano diário de ${PLAN_N} temas não chega lá: aumente em Configurações)`:""}.`;
    w.appendChild(msg)}
  else{w.innerHTML=`<div class="iprow"><span>Faltam <b>${M.left}</b> ${M.left===1?"tema":"temas"} para ver</span><span class="${M.pace>0?"ok":"late"}">seu ritmo: <b>${fmt(M.pace)}</b> por semana</span></div>`;
    const msg=el(`<p class="ks"></p>`);msg.textContent=M.pace>0?`Sem data de prova: no ritmo atual, você vê todos os temas por volta de ${br(M.endPace)}/${M.endPace.slice(0,4)}.`:`Sem data de prova e sem temas novos nas últimas 4 semanas. As semanas abaixo usam o seu plano diário (${PLAN_N} temas por dia, cerca de ${fmt(M.cap)} temas por semana, contando as partes).`;w.appendChild(msg)}
  if(M.left||M.W.some(x=>x.rv||x.ev.length)){const b=el(`<button class="link pjtog" type="button" id="projTog" aria-expanded="${projOpen}"></button>`);b.textContent=projOpen?"Esconder semanas":"Ver semanas";
    b.onclick=()=>{projOpen=!projOpen;lsSet("resid-projopen",projOpen?"1":null);render()};w.appendChild(b);if(projOpen)w.appendChild(projWeeksEl(M))}
  return w}
/* ---------- Início: meta ---------- */
function renderInicioMeta(){const box=$("#iMeta");if(!box)return;const main=exMain();box.innerHTML="";box.hidden=!main&&!hasData();if(box.hidden)return;
  const m=el(`<button class="imetab" type="button"><span class="ikl">Meta</span><b></b><span class="ims"></span></button>`);
  if(main){m.querySelector("b").textContent=main.name||"Prova de residência";const dd=main.date?daysTo(main.date):null,others=exList().filter(x=>x.id!==main.id&&x.date&&x.date>=today()).length;
    m.querySelector(".ims").textContent=(dd===null?"data ainda não definida":dd>=0?`faltam ${dd} dias (${goalSpan(dd)})`:"a data já passou: atualize no Perfil")+` · ${weighted()}% do peso estudado`+(others?` · +${others} ${others===1?"prova":"provas"} na lista`:"")}
  else{m.querySelector("b").textContent="Sem prova cadastrada";m.querySelector(".ims").textContent="Cadastre no Perfil as provas de residência que vai prestar"}
  m.onclick=()=>goSub("perfil");box.appendChild(m);box.appendChild(projEl())}

/* ---------- aba Início: próxima prova, estudar hoje, revisões e progresso ---------- */
/* "Estudar hoje" e "Revisões" são os mesmos cartões da aba Residência: mudam de lugar conforme a aba aberta */
function placeShared(){const t=$(".card.today"),r=$(".card.revs");if(!t||!r)return;
  if(view==="inicio"){if(t.parentNode!==$("#iToday"))$("#iToday").appendChild(t)}
  {const side=$("#viewTemas .side");if(side&&side.firstElementChild!==r)side.prepend(r)}
  if(view==="temas"){const slot=$("#todaySlot");if(slot.nextElementSibling!==t)slot.after(t);const side=$("#viewTemas .side");if(side.firstElementChild!==r)side.prepend(r)}}
function renderInicio(){{const h=$("#iHero");h.innerHTML="";h.appendChild(heroCard())}renderInicioBoard();renderInicioProva();renderInicioStats();
  {const n=$("#iNotice");n.innerHTML="";const x=iNoticeEl();if(x)n.appendChild(x)}
  {const q=$("#iQueue");q.innerHTML="";const c=iQueueCard();c.querySelector(".dhead").appendChild(helpBtn("Revisões"));q.appendChild(c)}
  {const w=$("#iWeek");w.innerHTML="";const x=wpNoticeEl();if(x)w.appendChild(x)}
  {const c=$("#iCust");c.innerHTML="";c.appendChild(iCustomEl())}applyICustom()}
function renderInicioProva(){const box=$("#iProva");box.innerHTML="";const ups=upcomingProvas(),CR=examCrunch();
  const hd=el(`<div class="dhead"><h2>Próxima prova</h2><span class="todaydate"></span></div>`);box.appendChild(hd);
  if(!ups.length){box.appendChild(el(`<p class="cempty">${fac.provas.length?"Nenhuma prova futura nos semestres ativos.":"Nenhuma prova cadastrada. Cadastre as provas dentro do semestre, na aba Faculdade: nas 3 semanas antes, o plano do dia reserva espaço para elas."}</p>`));
    const b=el(`<button class="btn" type="button" style="align-self:flex-start">Abrir Faculdade</button>`);b.onclick=()=>setView("fac");box.appendChild(b);return}
  const p=ups[0],d=discOf(p.discId),s=semOf(d.semId),dd=daysTo(p.date),tot=p.items.filter(refOk).length,pend=provaPending(p).length;
  hd.querySelector("span").textContent=dayLabel(p.date);
  const main=el(`<button class="ipmain" type="button"><span class="ipdays${dd<=7?" soon":""}"><b></b><span></span></span><span class="ipinfo"><b class="ipname"></b><span class="ipsub"></span><span class="meter"><i style="width:${tot?(tot-pend)/tot*100:0}%"></i></span><span class="ipst"></span></span></button>`);
  main.querySelector(".ipdays b").textContent=dd===0?"Hoje":dd===1?"1":String(dd);main.querySelector(".ipdays span").textContent=dd===0?"":dd===1?"dia":"dias";
  main.querySelector(".ipname").textContent=p.name;main.querySelector(".ipsub").textContent=`${provaDiscName(p)} · ${s.name}`;
  main.querySelector(".ipst").textContent=tot?(pend?`${tot-pend} de ${tot} conteúdos estudados · ${pend} pendente${pend>1?"s":""}`:`Todos os ${tot} conteúdos estudados`):"Nenhum conteúdo marcado para esta prova";
  main.onclick=()=>goProva(p);box.appendChild(main);
  if(CR.active){const c=el(`<p class="crunch"></p>`);c.textContent=`Modo provas ligado até ${br(CR.until)}: o plano do dia fica só com a faculdade.`;box.appendChild(c)}
  if(ups.length>1){const ul=el(`<ul class="uplist ipnext"></ul>`);ups.slice(1,4).forEach(x=>{const li=el(`<li><span class="ud"></span><button class="link" type="button"></button></li>`);li.querySelector(".ud").textContent=inLabel(daysTo(x.date));
      const bt=li.querySelector("button");bt.textContent=`${x.name} · ${provaDiscName(x)}`;bt.onclick=()=>goProva(x);ul.appendChild(li)});
    const g=el(`<div class="grp"><span class="glabel">Depois</span></div>`);g.appendChild(ul);box.appendChild(g)}}
/* disciplina em foco no semestre: prova próxima com conteúdo pendente > mais estudada nos últimos 7 dias > mais conteúdo */
function focusDisc(cur){const ds=semDiscs(cur.id).map(d=>({d,ks:topicKeysOf(discRefs(d))})).filter(x=>x.ks.length);if(!ds.length)return null;
  const t=dnum(today());
  const ps=semProvas(cur).filter(p=>{const dd=daysTo(p.date);return dd>=0&&dd<=FAC_WIN&&provaPending(p).length}).sort(byDate);
  for(const p of ps){const x=ds.find(y=>provaHas(p,y.d.id));if(x){const dd=daysTo(p.date);return {d:x.d,why:`${p.name} ${inLabel(dd)} · ${provaPending(p).length} conteúdo${provaPending(p).length>1?"s":""} pendente${provaPending(p).length>1?"s":""}`}}}
  const recent=k=>{const st=get(k);return st.last&&t-dnum(st.last)<=6?1:0};
  const sc=ds.map(x=>({...x,r:x.ks.reduce((a,k)=>a+recent(k),0)})).sort((a,b)=>b.r-a.r||b.ks.length-a.ks.length);
  if(sc[0].r)return {d:sc[0].d,why:`a mais estudada nos últimos 7 dias · ${sc[0].r} tema${sc[0].r>1?"s":""}`};
  if(ds.length===1)return {d:ds[0].d,why:"única com temas ligados"};
  return {d:sc[0].d,why:"a com mais conteúdo; o foco muda sozinho quando você estudar ou cadastrar uma prova"}}
function renderInicioStats(){const box=$("#iStats");box.innerHTML="";
  box.appendChild(el(`<div class="dhead"><h2>Seu progresso</h2></div>`));
  // residência
  const c=counts(ALL);let qc=0,qt=0,due=0;ALL.forEach(i=>{const st=get(i.key);qc+=st.qc||0;qt+=st.qt||0;if(isDue(st))due++});
  const r=el(`<div class="ipart"><div class="iph"><span class="glabel">Residência · ${TOTAL} temas</span><button class="link" type="button">Abrir</button></div><div class="dtop"><div class="ring"></div><ul class="glegend"></ul></div><div class="ikpis"></div></div>`);
  r.querySelector(".ring").innerHTML=donut(c)+`<div class="ringc"><b>${pct(c[3],TOTAL)}%</b><span>dominado</span></div>`;
  r.querySelector(".glegend").innerHTML=lvLegend(c).map(([t,lab,v])=>`<li><i class="sw" style="background:var(--${t})"></i><span>${lab}</span><b>${v}</b><em>${pct(v,TOTAL)}%</em></li>`).join("");
  r.querySelector(".ikpis").innerHTML=`<span><b>${due}</b> revis${due===1?"ão":"ões"} pendente${due===1?"":"s"}</span><span><b>${qt.toLocaleString("pt-BR")}</b> questões</span><span><b>${qt?pct(qc,qt)+"%":"–"}</b> de acerto</span><span><b>${weighted()}%</b> do peso da prova estudado</span>`;
  r.querySelector(".iph button").onclick=()=>{tSeg="prog";try{localStorage.setItem("resid-tseg","prog")}catch(e){}setView("temas")};
  box.appendChild(r);
  // faculdade
  const cur=curSem(),f=el(`<div class="ipart"><div class="iph"><span class="glabel"></span><button class="link" type="button">Abrir</button></div></div>`);
  f.querySelector(".iph button").onclick=()=>setView("fac");
  if(!cur){f.querySelector(".glabel").textContent="Faculdade";f.appendChild(el(`<p class="cempty">Crie o seu semestre na aba Faculdade para ver o progresso aqui.</p>`));box.appendChild(f);return}
  const S=semStats(cur),n=S.keys.length;f.querySelector(".glabel").textContent=`Faculdade · ${cur.name}`;
  if(!n){f.appendChild(el(`<p class="cempty">Adicione conteúdos às disciplinas do semestre (Faculdade › disciplina › + Conteúdo) para ver o progresso aqui.</p>`));box.appendChild(f);return}
  const F=focusDisc(cur),fk=F?topicKeysOf(discRefs(F.d)):S.keys,fc=F?lvlCounts(fk):S.c,fn=fk.length,fseen=fn-fc[0];
  if(F){const fh=el(`<div class="ifocus"><span class="ifk">Foco agora</span><button class="ifname" type="button"></button><span class="ifwhy"></span></div>`);
    fh.querySelector(".ifname").textContent=F.d.name;fh.querySelector(".ifname").onclick=()=>goDisc(F.d);fh.querySelector(".ifwhy").textContent=F.why;f.appendChild(fh)}
  const t=el(`<div class="dtop"><div class="ring"></div><ul class="glegend"></ul></div>`);
  t.querySelector(".ring").innerHTML=donut(fc,fn,F?`temas de ${esc(F.d.name)}`:"conteúdos do semestre")+`<div class="ringc"><b>${pct(fseen,fn)}%</b><span>estudado</span></div>`;
  t.querySelector(".glegend").innerHTML=lvLegend(fc).map(([k,lab,v])=>`<li><i class="sw" style="background:var(--${k})"></i><span>${lab}</span><b>${v}</b><em>${pct(v,fn)}%</em></li>`).join("");
  f.appendChild(t);
  const L=lv(cur),fb=el(`<div class="fbars"></div>`);
  if(F&&S.ds.length>1){const st=el(`<p class="cnote"></p>`);st.textContent=`Semestre inteiro: ${pct(S.seen,n)}% estudado (${S.seen} de ${n} temas).`;f.appendChild(st)}
  S.ds.forEach(d=>{const ks=topicKeysOf(discRefs(d)),k=lvlCounts(ks),nn=ks.length;
    const row=el(`<button class="vrow fbrow${F&&F.d===d?" focus":""}" type="button"><span class="vtop"><span class="vl"></span><span class="hv"></span></span><span class="hbar"></span></button>`);
    row.querySelector(".vl").textContent=d.name;row.querySelector(".hv").textContent=nn?`${nn-k[0]}/${nn}`:"sem temas";
    const hb=row.querySelector(".hbar");if(nn)[[3,"m3","dominados"],[2,"m2","revisados"],[1,"m1","estudados"]].forEach(([i,tk,lab])=>{if(k[i]){const x=document.createElement("i");x.style.width=k[i]/nn*100+"%";x.style.background=`var(--${tk})`;x.dataset.tip=`${d.name} · ${lab}: ${k[i]} de ${nn}`;hb.appendChild(x)}});
    row.onclick=()=>goDisc(d);fb.appendChild(row)});
  f.appendChild(fb);
  const ik=el(`<div class="ikpis"></div>`);ik.innerHTML=`<span><b>${S.ds.length}</b> ${esc((S.ds.length===1?L.disc:plural(L.disc)).toLowerCase())}</span><span><b>${S.nsp}</b> ${esc(S.nsp===1?L.sp:plural(L.sp))}</span><span><b>${S.ot?`${S.od}/${S.ot}`:"–"}</b> objetivos</span>`;f.appendChild(ik);
  box.appendChild(f)}
/* ---------- Início: placar do dia, "o que fazer agora" e projeção até a prova ---------- */
let nowSkip=0;// quantas sugestões o "Outra sugestão" já pulou hoje
/* candidatos ao próximo passo, do mais urgente para o menos */
function nextSteps(){const out=[],P=ensurePlan(),CR=examCrunch();if(isOffDay())return out;
  const due=[...ALL,...FAC_ITEMS].filter(i=>isDue(get(i.key))&&!(CR.active&&!i.own)).sort(revPri);
  due.filter(i=>dueIn(get(i.key))<0).forEach(it=>{const n=-dueIn(get(it.key));out.push({k:it.key,kind:"rev",t:it.t,why:`Revisão atrasada há ${n} ${n===1?"dia":"dias"}`})});
  if(isSimDay()){const ex=exams.find(e=>!exPg(e.id).fin);out.push(ex?{kind:"exam",id:ex.id,t:`Prova na íntegra: ${ex.name}`,why:"Hoje é dia de simulado e provas"}:{kind:"sim",n:20,t:"Simulado misto de 20 questões",why:"Hoje é dia de simulado e provas"})}
  const planItems=P.items.filter(p=>BYKEY[p.k]&&!itemDone(p));
  const started=p=>{const L=subList(BYKEY[p.k]);return p.cls==="r-weak"?weakDone(p)>0:p.subs.some(t=>p.cls==="r-rev"?(p.chk||[]).includes(t):(L.find(y=>y.t===t)||{}).done)};
  planItems.filter(started).forEach(p=>out.push({k:p.k,kind:"plan",t:BYKEY[p.k].t,why:"Continuar: você já começou este tema hoje"}));
  due.filter(i=>dueIn(get(i.key))>=0).forEach(it=>out.push({k:it.key,kind:"rev",t:it.t,why:"Revisão de hoje"}));
  planItems.filter(p=>!started(p)).forEach(p=>out.push({k:p.k,kind:"plan",t:BYKEY[p.k].t,why:p.cls==="r-weak"?"Ponto fraco do plano de hoje":p.cls==="r-fac"?"Conteúdo da prova da faculdade":p.cls==="r-pfr"?"Revisar para a prova da faculdade":"Tema do plano de hoje"}));
  const rd=redo.filter(x=>BYKEY[x.k]).length;if(rd)out.push({kind:"redo",t:`Refazer ${Math.min(rd,10)} ${Math.min(rd,10)===1?"questão errada":"questões erradas"}`,why:`${rd} na lista de Refazer as que errei`});
  const ed=eDueList().length;if(ed)out.push({kind:"errs",t:`Revisar ${Math.min(ed,15)} ${Math.min(ed,15)===1?"erro":"erros"} do caderno`,why:`${ed} ${ed===1?"erro volta":"erros voltam"} para revisão hoje`});
  const g=ui.prefs.qgoal,W=qWeekQ(dnum(today())-(new Date().getDay()+6)%7).g;if(g&&W<g&&!isSimDay())out.push({kind:"sim",t:"Simulado misto de 10 questões",why:`Faltam ${g-W} questões para a meta da semana`});
  return out}
function startStep(s){
  if(s.kind==="redo"){backStack=[];setView("quest");setQSeg("praticar","redo");setTimeout(()=>{const b=$("#rdGo");if(b)b.click()},60);return}
  if(s.kind==="errs"){backStack=[];setView("erros");setTimeout(()=>{const b=$("#erGo");if(b)b.click()},60);return}
  if(s.kind==="exam"){backStack=[];setView("quest");setQSeg("praticar","provas");setTimeout(()=>{const x=document.getElementById("exr-"+s.id);if(x)x.scrollIntoView({block:"center"})},60);return}
  if(s.kind==="sim"){simCfg={src:"gain",n:s.n||10};backStack=[];setView("quest");setQSeg("praticar");setTimeout(()=>{const h=$("#simh");if(h)h.scrollIntoView({block:"start"})},60);return}
  // tema: liga o Foco no tema e abre o cartão no Início
  foPick.ref="T:"+s.k;foSavePick();if(foRun){foRun.ref=foPick.ref;foSaveRun()}else{foPick.mode="p";foStart()}
  if(s.kind==="plan")planOpen[s.k]={v:true,done:false};else revOpen[s.k]={v:true};
  if(s.kind==="rev"){goRevs(s.k);return}
  render();setTimeout(()=>{const card=[...document.querySelectorAll("#viewInicio .card.today .pcard")].find(c=>c.dataset.k===s.k);if(card)card.scrollIntoView({behavior:"smooth",block:"center"})},60)}
function renderInicioBoard(){const box=$("#iBoard");if(!box)return;box.innerHTML="";
  const P=ensurePlan(),done=P.items.filter(itemDone).length,h=hist[today()]||{},revDone=h.r||0,revDue=dueCount(),t=dnum(today()),ws=t-(new Date().getDay()+6)%7,W=qWeekQ(ws),qg=ui.prefs.qgoal,
    fs=foSum(foSess.filter(x=>x.d===today())),fg=foDG()*60;
  const tile=(lab,val,sub,frac,cls,fn)=>{const b=el(`<button class="itile${cls?" "+cls:""}" type="button"><span class="kl"></span><b></b><span class="ks"></span><span class="meter"><i style="width:${Math.min(100,Math.max(0,frac*100))}%"></i></span></button>`);
    b.querySelector(".kl").textContent=lab;b.querySelector("b").textContent=val;b.querySelector(".ks").textContent=sub;b.onclick=fn;return b};
  const g=el(`<div class="itiles"></div>`);
  g.append(tile("Plano de hoje",`${done}/${P.items.length}`,P.items.length?(done===P.items.length?"concluído":`${P.items.length-done} ${P.items.length-done===1?"tema falta":"temas faltam"}`):"nada para hoje",P.items.length?done/P.items.length:1,done===P.items.length?"ok":"",()=>{const c=$("#viewInicio .card.today");if(c)c.scrollIntoView({behavior:"smooth",block:"start"})}),
    tile(qg?"Questões da semana":"Questões na semana",qg?`${W.q}/${qg}`:String(W.q),qg?(W.q>=qg?"meta batida":`faltam ${qg-W.q}`):"sem meta semanal",qg?W.q/qg:0,qg&&W.q>=qg?"ok":"",()=>{backStack=[];setView("quest");setQSeg("resumo")}),
    (()=>{const wg=(ui.prefs.hgoal||0)*60,wk=foSum(foSess.filter(x=>dnum(x.d)>=foWeekStart()&&dnum(x.d)<=t));return tile("Foco na semana",fmtMin(wk),foRun?"sessão em andamento":wg?(wk>=wg?"meta batida":`meta de ${fmtMin(wg)} · hoje ${fmtMin(fs)}`):"sem meta",wg?wk/wg:0,wg&&wk>=wg?"ok":"",()=>{backStack=[];setView("foco")})})());
  box.appendChild(g);
  // o que fazer agora
  const steps=nextSteps(),s=steps.length?steps[nowSkip%steps.length]:null,nw=el(`<div class="inow"></div>`);
  if(!s&&isOffDay()){nw.innerHTML=`<p class="inowdone"><b>Dia de folga.</b> Se quiser estudar mesmo assim, as abas continuam abertas; as revisões voltam ${nextStudyLabel()}.</p>`}
  else if(!s){nw.innerHTML=`<p class="inowdone"><b>Tudo feito por hoje.</b> Plano e revisões em dia. Se quiser ir além, faça um simulado ou adiante um tema.</p>`}
  else{const m=el(`<div class="inowtx"><span class="kl">O que fazer agora</span><b></b><span class="ks"></span></div>`);m.querySelector("b").textContent=s.t;m.querySelector(".ks").textContent=s.why;nw.appendChild(m);
    const a=el(`<div class="inowb"></div>`),go=el(`<button class="btn primary" type="button" id="nowGo"></button>`);
    go.textContent=s.kind==="redo"?"Refazer agora":s.kind==="errs"?"Revisar agora":s.kind==="sim"?"Começar simulado":foRun?"Abrir e continuar o foco":"Começar com o Foco";go.onclick=()=>startStep(s);a.appendChild(go);
    if(steps.length>1){const o=el(`<button class="link" type="button" id="nowSkip">Outra sugestão</button>`);o.onclick=()=>{nowSkip++;render()};a.appendChild(o)}
    nw.appendChild(a)}
  box.appendChild(nw);
  if(!exList().length){const h=el(`<p class="how igoalhint">Quer saber se chega a tempo na prova de residência? <button class="link" type="button">Cadastre as provas no Perfil</button> e a Residência mostra o ritmo necessário.</p>`);h.querySelector("button").onclick=()=>goSub("perfil");box.appendChild(h)}}
