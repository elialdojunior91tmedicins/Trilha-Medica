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
  const T=today(),ne=eDueList().length,nc=cards.filter(x=>BYKEY[x.k]&&x.f&&x.f.st&&x.due<=T).length,L=[];
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
function iNoticeEl(){const box=el(`<div class="inotices"></div>`);
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
const HERO_FRASES=["Constância vence intensidade.","Cada questão errada hoje é um ponto a mais na prova.","Não precisa ser um dia perfeito. Precisa ser um dia de estudo.","Disciplina é fazer o combinado mesmo sem vontade.",
"A aprovação é feita de dias comuns bem usados.","Revisar é o que transforma estudo em memória.","Um tema por vez. Uma revisão por vez.","Quem revisa no dia certo não estuda duas vezes.",
"O cansaço passa. O que você aprendeu hoje fica.","Pequenos avanços diários somam uma especialidade inteira.","O erro de hoje é o acerto da prova.","Comece pelo mais difícil enquanto a cabeça está fresca.",
"Vitória é a soma de manhãs em que você sentou para estudar.","Você não precisa de motivação para abrir o caderno. Precisa abrir.","Uma hora focada vale mais que três distraídas.","A prova premia quem viu o assunto muitas vezes, não uma vez só.",
"Hoje conta. Mesmo que seja pouco.","Faça o simples bem feito: revisar, questionar, corrigir.","Seu futuro paciente agradece cada revisão de hoje.","Ritmo sustentável ganha da maratona de véspera.",
"Errar na questão é barato. Errar no plantão não é.","Domine o básico: é ele que cai mais.","A dúvida de hoje é a pegadinha que você não vai cair.","Quem anota o próprio erro não repete o mesmo erro.",
"Estudar cansado ainda é estudar. Parar de vez é que não.","Celebre o dia cumprido, não só a nota final.","Um passo hoje vale mais que um plano perfeito para amanhã.","Foque no que depende de você: as próximas horas.",
"Cada tema dominado é um a menos para temer.","Respeite o descanso: ele também faz parte do plano.","A disciplina de hoje é a tranquilidade da véspera.","Questão feita com atenção ensina mais que dez feitas com pressa.",
"Não compare o seu capítulo 3 com o capítulo 20 de ninguém.","O que é revisado no tempo certo não precisa ser reaprendido.","Persistência é voltar ao plano depois de um dia ruim.","Um dia de cada vez, um tema de cada vez.",
"Vencer a preguiça nos primeiros cinco minutos é metade do trabalho.","Leia o enunciado inteiro. A resposta costuma estar nele.","Quem entende o porquê não precisa decorar tudo.","Organização hoje poupa desespero amanhã.",
"Seu esforço de hoje é invisível agora e evidente na prova.","Aprender devagar ainda é aprender.","A constância transforma o difícil em rotina.","Toda especialidade parece enorme até você dividir em temas.",
"Melhor feito do que perfeito: termine o bloco de hoje.","Cada acerto novo é prova de que o método funciona.","Desligue o celular por uma sessão e veja a diferença.","Revisão atrasada se resolve com uma por vez, não com culpa.",
"Disciplina é escolher o que você quer mais em vez do que você quer agora.","O ritmo de hoje decide a calma de amanhã.","Estude para entender o paciente, não só para marcar a alternativa.","A cada revisão, o esquecimento perde força.",
"Hoje é um bom dia para fechar uma lacuna antiga.","Quem mede o progresso enxerga o quanto já andou.","Dias difíceis também contam como dias de estudo.","A prova é longa; o preparo também. Vá no seu passo.",
"Faça a parte de hoje e deixe o resto para amanhã.","Seu melhor método é o que você consegue repetir todo dia.","O hábito leva você onde a motivação não alcança.","Cada sessão concluída é uma pequena vitória. Some todas."];
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
/* ----- 3. busca em tudo ----- */
let gsQ="",gsOpen=false,gsType="";
function gsSnip(t,n){const T=String(t||"").replace(/^\s*(#{1,6}\s+|[-*>]\s+|\d+\.\s+)/gm,"").replace(/==|\*\*|`/g,"").replace(/\s+/g," "),N=norm(T),i=N.indexOf(n);if(i<0)return T.slice(0,110);const a=Math.max(0,i-40);return (a?"…":"")+T.slice(a,a+120)+(T.length>a+120?"…":"")}
function gsResults(q){const n=norm(q.trim());if(n.length<2)return [];const R=[],add=(g,t,s,go)=>R.push({g,t,s,go});
  [...ALL,...FAC_ITEMS].forEach(it=>{const subs=subList(it).map(x=>x.t).join(" · ");if(norm(it.t).includes(n)||norm(subs).includes(n))add("Temas",it.t,norm(it.t).includes(n)?`${it.own?"FAC":it.area.code} · ${it.sp||it.area.name}`:gsSnip(subs,n),()=>openTopic(it.key))});
  Object.keys(notes).forEach(k=>{if(BYKEY[k]&&norm(notes[k]).includes(n))add("Anotações",BYKEY[k].t,gsSnip(notes[k],n),()=>{detTab[k]="notas";openTopic(k)})});
  freeN.forEach(f=>{if(norm(f.t+" "+f.b+" "+f.tags.join(" ")).includes(n))add("Caderno livre",f.t||"Sem título",gsSnip(f.b,n),()=>{freeOpen.add(f.id);backStack=[];setView("notas");if(typeof setNSeg==="function")setNSeg("todas");setTimeout(()=>{const x=document.getElementById("fr-"+f.id);if(x)x.scrollIntoView({block:"center"})},80)})});
  errors.forEach(e=>{if(BYKEY[e.k]&&norm(e.w+" "+e.r+" "+(e.s||"")).includes(n))add("Erros",BYKEY[e.k].t,gsSnip(e.w+" → "+e.r,n),()=>{eGoTopic(e.k);if(e.arch)eFlags.add("arch");backStack=[];setView("erros")})});
  cards.forEach(x=>{if(BYKEY[x.k]&&norm(x.q+" "+x.a).includes(n))add("Cartões",x.q.slice(0,90),BYKEY[x.k].t,()=>{detTab[x.k]="notas";openTopic(x.k)})});
  fac.discs.forEach(d=>{if(norm(d.name).includes(n))add("Faculdade",d.name,"disciplina",()=>goDisc(d));
    (d.sps||[]).forEach(s=>{if(norm(s.name+" "+s.objs.join(" ")).includes(n))add("Faculdade",s.name,d.name,()=>{facOpenSem.add(d.semId);facOpenDisc.add(d.id);facOpenSP.add(s.id);backStack=[];setView("fac");setTimeout(()=>scrollToId("sp-"+s.id),60)})});
    [d,...(d.sps||[])].forEach(o=>(o.links||[]).forEach(l=>{if(norm((l.t||"")+" "+l.u).includes(n))add("Materiais",l.t||hostOf(l.u),`${d.name} · ${hostOf(l.u)}`,()=>window.open(l.u,"_blank","noopener"))}))});
  return R}
function renderGSearch(){let ov=$("#gsearch");if(!gsOpen){if(ov)ov.remove();return}
  if(!ov){ov=el(`<div class="gsearch" id="gsearch" role="dialog" aria-modal="true" aria-label="Buscar em tudo"><div class="gsbox"><div class="gshead"><input class="search" id="gsq" type="search" placeholder="Buscar em temas, anotações, erros, cartões, faculdade…" autocomplete="off"><button class="link" type="button">Fechar</button></div><div class="gsres" id="gsres"></div></div></div>`);
    document.body.appendChild(ov);const i=ov.querySelector("#gsq");i.value=gsQ;i.oninput=debounced(()=>{gsQ=i.value;fillGS()},120);ov.querySelector(".gshead .link").onclick=gsClose;
    ov.addEventListener("click",e=>{if(e.target===ov)gsClose()});setTimeout(()=>i.focus(),30)}
  fillGS()}
function fillGS(){const box=$("#gsres");if(!box)return;box.innerHTML="";const R=gsResults(gsQ);
  if(norm(gsQ.trim()).length<2){box.appendChild(el(`<p class="how">Digite pelo menos 2 letras. A busca olha temas e subtópicos, anotações, caderno livre, erros, cartões, disciplinas, SPs e materiais.</p>`));return}
  if(!R.length){box.appendChild(el(`<p class="cempty">Nada encontrado com “${esc(gsQ.trim())}”.</p>`));return}
  const groups={};R.forEach(r=>(groups[r.g]=groups[r.g]||[]).push(r));
  /* Lote 20: etiquetas por tipo com a contagem; tocar de novo volta a mostrar tudo */
  if(!groups[gsType])gsType="";const G=Object.keys(groups);
  if(G.length>1){const ch=el(`<div class="chips gstypes" role="group" aria-label="Tipo de resultado"></div>`);
    [["","Tudo",R.length],...G.map(g=>[g,g,groups[g].length])].forEach(([v,l,n],i)=>{const b=el(`<button class="chip" type="button"></button>`);b.id="gsT-"+i;b.textContent=`${l} · ${n}`;b.setAttribute("aria-pressed",gsType===v);
      b.onclick=()=>{gsType=gsType===v?"":v;fillGS()};ch.appendChild(b)});box.appendChild(ch)}
  Object.entries(groups).filter(([g])=>!gsType||g===gsType).forEach(([g,L])=>{const LIM=gsType?40:8;const s=el(`<div class="gsg"><span class="glabel"></span><ul></ul></div>`);s.querySelector(".glabel").textContent=`${g} · ${L.length}`;
    L.slice(0,LIM).forEach(r=>{const li=el(`<li><button type="button"><b></b><span></span></button></li>`);li.querySelector("b").textContent=r.t;li.querySelector("span").textContent=r.s;li.querySelector("button").onclick=()=>{gsClose();r.go()};s.querySelector("ul").appendChild(li)});
    if(L.length>LIM)s.appendChild(el(`<p class="how">+ ${L.length-LIM} resultados. ${gsType?"Refine a busca.":"Toque no tipo acima para ver todos."}</p>`));box.appendChild(s)})}
function gsClose(){gsOpen=false;renderGSearch()}
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&gsOpen){gsClose();return}
  if((e.key==="k"&&(e.ctrlKey||e.metaKey))||(e.key==="/"&&!/^(INPUT|TEXTAREA|SELECT)$/.test((e.target||{}).tagName||""))){e.preventDefault();gsOpen=true;renderGSearch()}});
/* ----- 2. primeiros passos ----- */
let onb=null;
function needOnb(){return !!window.claude&&synced&&!ui.prefs.onb&&!hasData()&&!fac.sems.length&&!foSess.length}
function renderOnb(){let ov=$("#onb");if(!onb){if(ov)ov.remove();return}
  if(!ov){ov=el(`<div class="gsearch onbov" id="onb" role="dialog" aria-modal="true" aria-labelledby="onbh"><div class="gsbox onbbox"></div></div>`);document.body.appendChild(ov)}
  const b=ov.querySelector(".onbbox");b.innerHTML="";const O=onb,dots=el(`<p class="onbdots"></p>`);for(let i=0;i<3;i++)dots.appendChild(el(`<i class="${i<=O.step?"on":""}"></i>`));b.appendChild(dots);
  const fin=(go)=>{ui.prefs.onb=1;if(O.date){ui.profile.exams=[{id:"ex"+Date.now().toString(36),name:"Prova de residência",date:O.date}];ui.profile.mainEx=ui.profile.exams[0].id}ui.prefs.hgoal=O.fgoal;ui.prefs.planN=O.planN;saveUI();applyUI();onb=null;renderOnb();
    if(go==="bulk"){backStack=[];setView("temas");setTSeg("lista");bulk={sel:new Set(),lv:1};bulkUndo=null;tf.lv=new Set([0,"i"]);openKey=null;render()}else{redoPlan();render()}};
  const skip=el(`<button class="link onbskip" type="button">Pular</button>`);skip.onclick=()=>{ui.prefs.onb=1;saveUI();onb=null;renderOnb()};
  if(O.step===0){b.append(el(`<h2 id="onbh">Bem-vindo ao Nexus</h2>`),el(`<p class="gtext">Três perguntas rápidas para o app montar o seu plano. Dá para mudar tudo depois em Perfil e Configurações.</p>`),
      el(`<label class="qfsel onbf"><span>Quando é a sua prova de residência?</span><input type="date" class="etext" id="onbDate"></label>`));
    const i=b.querySelector("#onbDate");i.value=O.date||"";i.min=today();i.oninput=()=>O.date=i.value;
    const a=el(`<div class="btns"><button class="btn primary" type="button">Continuar</button><button class="btn" type="button">Ainda não sei</button></div>`),[c1,c2]=a.querySelectorAll("button");
    c1.onclick=()=>{if(O.date&&!/^\d{4}-\d{2}-\d{2}$/.test(O.date))return;O.step=1;renderOnb()};c2.onclick=()=>{O.date="";O.step=1;renderOnb()};b.append(a,skip)}
  else if(O.step===1){b.append(el(`<h2 id="onbh">Você já estudou para a residência?</h2>`),el(`<p class="gtext">Se já estudou alguns temas, marque quais: eles entram nas revisões em vez de aparecerem como novos.</p>`));
    const a=el(`<div class="onbopts"><button class="btn" type="button">Estou começando agora</button><button class="btn" type="button">Já estudei alguns temas</button></div>`),[x,y]=a.querySelectorAll("button");
    x.onclick=()=>{O.prev=false;O.step=2;renderOnb()};y.onclick=()=>{O.prev=true;O.step=2;renderOnb()};b.append(a,skip)}
  else{b.append(el(`<h2 id="onbh">Quanto tempo por semana?</h2>`),el(`<p class="gtext">A meta da semana aparece no Início, no Foco e nas Estatísticas (a do dia é ela dividida pelos dias de estudo). Os temas por dia definem o tamanho do plano.</p>`));
    const g=el(`<div class="onbgrid"><label class="qfsel"><span>Meta por semana</span><select id="onbF"></select></label><label class="qfsel"><span>Temas novos por dia</span><select id="onbN"></select></label></div>`);
    const sf=g.querySelector("#onbF"),sn=g.querySelector("#onbN");[[300,"5 h"],[420,"7 h"],[600,"10 h"],[720,"12 h"],[900,"15 h"],[1200,"20 h"]].forEach(([v,t])=>{const o=document.createElement("option");o.value=v;o.textContent=t;sf.appendChild(o)});
    [2,3,4,5].forEach(v=>{const o=document.createElement("option");o.value=v;o.textContent=`${v} temas${v===3?" (sugerido)":""}`;sn.appendChild(o)});sf.value=String(O.fgoal);sn.value=String(O.planN);sf.onchange=()=>O.fgoal=+sf.value;sn.onchange=()=>O.planN=+sn.value;b.appendChild(g);
    const a=el(`<div class="btns"><button class="btn primary" type="button" id="onbFin"></button><button class="btn" type="button">Voltar</button></div>`),[f,bk]=a.querySelectorAll("button");f.textContent=O.prev?"Concluir e marcar o que já estudei":"Concluir";f.onclick=()=>fin(O.prev?"bulk":"");bk.onclick=()=>{O.step=1;renderOnb()};b.append(a,skip)}}
let onbTried=false;const ONB_SEEN0=lsGet("resid-onb-seen","")==="1";
function maybeOnb(){if(onbTried||onb||!synced)return;onbTried=true;if(needOnb()&&!ONB_SEEN0){lsSet("resid-onb-seen","1");onb={step:0,date:"",prev:false,fgoal:ui.prefs.hgoal||600,planN:ui.prefs.planN||3};renderOnb()}}
/* ----- 5. calendário (.ics) ----- */
function icsEsc(s){return String(s).replace(/\\/g,"\\\\").replace(/;/g,"\\;").replace(/,/g,"\\,").replace(/\n/g,"\\n")}
function icsBuild(){const ev=[],stamp=new Date().toISOString().replace(/[-:]/g,"").replace(/\.\d+Z$/,"Z");
  upcomingProvas().forEach(p=>{const d=discOf(p.discId);ev.push({uid:"prova-"+p.id,date:p.date,t:`Prova: ${p.name}`,desc:`${d?provaDiscName(p)+". ":""}Nexus - Trilha Médica`})});
  spFechas(365).forEach(f=>ev.push({uid:"sp-"+f.s.id,date:f.s.fech,t:`Fechamento: ${f.s.name}`,desc:`${f.d.name}. Nexus - Trilha Médica`}));
  exList().forEach(x=>{if(x.date&&x.date>=today())ev.push({uid:"residencia-"+x.id,date:x.date,t:`Prova de residência: ${x.name||"sem nome"}`,desc:"Nexus - Trilha Médica"})});
  const L=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Nexus Trilha Medica//PT-BR","CALSCALE:GREGORIAN","METHOD:PUBLISH","X-WR-CALNAME:Nexus - Trilha Médica"];
  ev.forEach(e=>{const d=e.date.replace(/-/g,""),d2=fromNum(dnum(e.date)+1).replace(/-/g,"");L.push("BEGIN:VEVENT",`UID:${e.uid}@trilha-medica`,`DTSTAMP:${stamp}`,`DTSTART;VALUE=DATE:${d}`,`DTEND;VALUE=DATE:${d2}`,`SUMMARY:${icsEsc(e.t)}`,`DESCRIPTION:${icsEsc(e.desc)}`,
    "BEGIN:VALARM","ACTION:DISPLAY",`DESCRIPTION:${icsEsc(e.t)}`,"TRIGGER:-P1D","END:VALARM","END:VEVENT")});L.push("END:VCALENDAR");return {text:L.join("\r\n"),n:ev.length}}
let icsMsg="";
async function icsSave(){if(!downloadsFn)return;const r=icsBuild();if(!r.n){icsMsg="Nenhuma prova ou fechamento futuro para exportar.";render();return}
  try{await downloadsFn.save({filename:"trilha-medica-provas.ics",data:new Blob([r.text],{type:"text/calendar"})});icsMsg=`Arquivo com ${r.n} ${r.n===1?"data":"datas"} salvo. Abra-o para adicionar ao Google Agenda ou ao Calendário (lembrete 1 dia antes).`}
  catch(e){icsMsg=e&&(e.code==="declined"||e.code==="cancelled")?"Download cancelado.":"Não foi possível gerar o arquivo agora."}render()}
/* ----- 14. ajuda: abrir uma seção ----- */
function goHelp(title){helpQ="";const i=$("#hq");if(i)i.value="";goSub("help");setTimeout(()=>{const idx=HELP.findIndex(h=>h[0]===title);const d=document.querySelector(`#helpList details[data-i="${idx}"]`);if(d){d.open=true;d.scrollIntoView({block:"start"})}},40)}
function helpBtn(title){const b=el(`<button class="hlpb" type="button" aria-label="Ajuda">?</button>`);b.title="Como funciona";b.dataset.help=title;b.onclick=e=>{e.stopPropagation();goHelp(title)};return b}

/* Lote 19: Caderno em duas colunas no computador — coluna da direita (#nSide) com Cartões, Pegadinhas, PDF e o sumário; no celular é display:contents */
(()=>{const V=document.getElementById("viewNotas");if(!V||document.getElementById("nSide"))return;const S=document.createElement("div");S.id="nSide";S.className="nside";
  ["nRevBox","nPegBox"].forEach(id=>{const n=document.getElementById(id);if(n)S.appendChild(n)});const ex=V.querySelector(".nexport");if(ex)S.appendChild(ex);
  const t=document.getElementById("nToc");if(t)S.appendChild(t);V.appendChild(S)})();
/* Lote 19 (10/2026): explicações fixas dos cartões (.hx) ficam recolhidas atrás do "?" do cabeçalho do cartão.
   O "?" mostra a explicação ali mesmo; se o cartão tinha o "?" da Ajuda, o mesmo botão abre a explicação com "Mais na Ajuda". */
const hxOpen=new Set();
function hxKey(card,head){return card.id||card.getAttribute("aria-labelledby")||(head?head.textContent.replace(/\?/g,"").trim().slice(0,40):"")}
function hxScan(root){(root||document).querySelectorAll(".hx:not([data-hx])").forEach(p=>{p.dataset.hx="1";
  const card=p.closest(".card,.imeta,section,details")||p.parentElement;if(!card)return;
  if(card.dataset.hxc){hxShow(card);return}card.dataset.hxc="1";
  const head=[...card.children].find(c=>c.matches(".dhead,.todayhead,.cdhead,.fhead,header"))||null;
  const key=hxKey(card,head);let b=head&&head.querySelector(".hlpb");const help=b&&b.dataset.help;
  if(!b){b=el(`<button class="hlpb hxb hxnew" type="button" aria-label="Como funciona">?</button>`);b.title="Como funciona";
    if(head){const h=head.querySelector("h2,h3");h&&h.parentElement===head?h.after(b):head.appendChild(b)}else{const w=el(`<div class="hxrow"></div>`);w.appendChild(b);w.appendChild(el(`<span>Como funciona</span>`));p.before(w);w.onclick=e=>{if(e.target!==b)b.click()}}}
  else b.classList.add("hxb");
  if(help&&!card.querySelector(".hxmore")){const m=el(`<p class="hx hxmore" data-hx="1"><button class="link" type="button">Mais na Ajuda →</button></p>`);m.querySelector("button").onclick=()=>goHelp(help);const last=[...card.querySelectorAll(".hx:not(.hxmore)")].filter(x=>x.closest(".card,.imeta,section,details")===card).pop()||p;last.after(m)}
  b.onclick=e=>{e.stopPropagation();e.preventDefault();hxOpen.has(key)?hxOpen.delete(key):hxOpen.add(key);hxShow(card)};card.dataset.hxk=key;hxShow(card)})}
function hxShow(card){const on=hxOpen.has(card.dataset.hxk);card.querySelectorAll(".hx").forEach(x=>{if(x.closest(".card,.imeta,section,details")===card)x.classList.toggle("hxshow",on)});
  card.querySelectorAll(".hxb").forEach(b=>{b.setAttribute("aria-expanded",on?"true":"false");b.classList.toggle("on",on)})}
(()=>{let q=0;const go=()=>{q=0;hxScan()};new MutationObserver(()=>{if(!q)q=requestAnimationFrame(go)}).observe(document.documentElement,{childList:true,subtree:true})})();
function render(){
  if(qAutoRev())persist();rdExpire();
  const ae=document.activeElement,keep=ae&&ae.id&&/^(TEXTAREA|INPUT|SELECT)$/.test(ae.tagName)?{id:ae.id,s:ae.selectionStart,e:ae.selectionEnd,st:ae.scrollTop}:null;
  renderAll();applyFull();if(typeof bkFullApply==="function")bkFullApply();sbApply();if(view==="notas"&&nTocRender.last)nTocRender(...nTocRender.last);foNoiseSync();renderQBar();maybeOnb();
  if(keep){const n=document.getElementById(keep.id);if(n&&n!==document.activeElement){n.focus({preventScroll:true});try{n.setSelectionRange(keep.s,keep.e)}catch(e){}n.scrollTop=keep.st}}
}
/* revisões pendentes (sem as pausadas pelo modo provas) */
function dueCount(){const CR=examCrunch();return [...ALL,...FAC_ITEMS].filter(i=>isDue(get(i.key))&&!(CR.active&&!i.own)).length}
/* ---------- Perfil e Configurações (preferências salvas na conta) ---------- */
const LSUI="resid-ui-v1";
const UI_DEF={prefs:{wnew:[0,1,2,3,4,5,6],wsim:[],woff:[],wday:[180,180,180,180,180,180,180],hgoal:600,wplans:{},layout:"classic",theme:"auto",font:"n",planN:3,subN:3,ints:"padrao",facWin:21,resWeek:2,fw:25,fb:5,fsnd:true,fgoal:0,fwake:true,flong:15,fevery:4,fnoise:"",fvol:40,fwgoal:0,qgoal:0,qpace:180,adapt:true},profile:{name:"",goal:"",goalDate:"",exams:[]}};
const INT_SETS={padrao:[1,3,7,15,30,60,90],intensivo:[1,2,4,7,15,30,60],espacado:[1,4,10,21,45,90,120]};
const INT_LAB={padrao:"Padrão",intensivo:"Intensivo",espacado:"Espaçado"};
let ui=JSON.parse(JSON.stringify(UI_DEF)),uiDoc=null,uiTimer=null,uiTouched=false,uiNote="",backStack=[],acctEmail=null;
function uiSanitize(x){const D=UI_DEF,o={prefs:{...D.prefs},profile:{...D.profile}},p=(x&&x.prefs)||{},f=(x&&x.profile)||{};
  if(["classic","compact","focus"].includes(p.layout))o.prefs.layout=p.layout;
  if(p.hnd&&typeof p.hnd==="object"&&!Array.isArray(p.hnd)){const H={};Object.entries(p.hnd).forEach(([k,v])=>{if(/^\d{4}-\d\d-\d\d$/.test(k)&&v&&typeof v.d==="string")H[k]={d:v.d,prev:Number.isInteger(v.prev)?v.prev:60}});if(Object.keys(H).length)o.prefs.hnd=H}
  if(Array.isArray(p.fotps)){const T=p.fotps.filter(t=>typeof t==="string"&&t.trim()).map(t=>t.trim().slice(0,40)).slice(-12);if(T.length)o.prefs.fotps=T}// Lote 21: tipos do Registrar tempo
  /* Lote 20E: plano alinhado ao eixo */if(typeof p.align==="boolean")o.prefs.align=p.align;if(["111","021","120"].includes(p.amix))o.prefs.amix=p.amix;if(typeof p.anear==="boolean")o.prefs.anear=p.anear;
  if(p.eixo&&typeof p.eixo==="object"&&typeof p.eixo.a==="string"&&typeof p.eixo.sp==="string")o.prefs.eixo={a:p.eixo.a.slice(0,6),sp:p.eixo.sp.slice(0,80),...(typeof p.eixo.until==="string"&&/^\d{4}-\d\d-\d\d$/.test(p.eixo.until)?{until:p.eixo.until}:{})};
  if(p.pgm&&typeof p.pgm==="object"&&!Array.isArray(p.pgm)){const m={};Object.entries(p.pgm).slice(-400).forEach(([k,v])=>{if(/^p[a-z0-9]{1,12}$/.test(k)&&Number.isInteger(v)&&v>0&&v<1000)m[k]=v});if(Object.keys(m).length)o.prefs.pgm=m}// Lote 20C: pegadinhas "não sabia"
  if(Array.isArray(p.bkps)){const L=p.bkps.filter(x=>x&&/^u[a-z0-9]{1,14}$/.test(x.id)&&typeof x.n==="string"&&x.n.trim()).slice(-12).map(x=>({id:x.id,n:x.n.trim().slice(0,40),f:bkFClean(x.f)}));if(L.length)o.prefs.bkps=L}// B2: filtros salvos do banco
  if(["auto","light","dark"].includes(p.theme))o.prefs.theme=p.theme;
  if(["n","g"].includes(p.font))o.prefs.font=p.font;
  if([2,3,4,5].includes(p.planN))o.prefs.planN=p.planN;
  if([2,3,4].includes(p.subN))o.prefs.subN=p.subN;
  if(INT_SETS[p.ints])o.prefs.ints=p.ints;
  if([14,21,28].includes(p.facWin))o.prefs.facWin=p.facWin;
  if([0,1,2,3].includes(p.resWeek))o.prefs.resWeek=p.resWeek;
  {const D=v=>Array.isArray(v)?[...new Set(v.filter(x=>Number.isInteger(x)&&x>=0&&x<=6))].sort():null,off=D(p.woff)||[],nw=(D(p.wnew)||[0,1,2,3,4,5,6]).filter(d=>!off.includes(d)),sm=(D(p.wsim)||[]).filter(d=>!off.includes(d));
    if(nw.length&&off.length<=5){o.prefs.wnew=nw;o.prefs.woff=off;o.prefs.wsim=sm}}
  /* planejamento semanal: minutos por dia (0 domingo … 6 sábado) na semana padrão, meta em minutos e as semanas planejadas (segunda → {m,ok}) */
  {const okM=a=>Array.isArray(a)&&a.length===7&&a.every(v=>WP_MIN.includes(v));
    o.prefs.wday=okM(p.wday)?[...p.wday]:[0,1,2,3,4,5,6].map(d=>o.prefs.woff.includes(d)?0:o.prefs.wnew.includes(d)?180:30);
    o.prefs.hgoal=Number.isInteger(p.hgoal)&&p.hgoal>=0&&p.hgoal<=3000?p.hgoal:Number.isInteger(p.fwgoal)&&p.fwgoal>0&&p.fwgoal<=3000?p.fwgoal:600;// Lote 17: quem só tinha a meta semanal de foco fica com ela
    const W={};if(p.wplans&&typeof p.wplans==="object")Object.keys(p.wplans).filter(k=>/^\d{4}-\d{2}-\d{2}$/.test(k)&&p.wplans[k]&&okM(p.wplans[k].m)).sort().slice(-3).forEach(k=>{W[k]={m:[...p.wplans[k].m],ok:p.wplans[k].ok?1:0};const ov=p.wplans[k].o;if(Array.isArray(ov)){const a=[...new Set(ov.filter(x=>Number.isInteger(x)&&x>=0&&x<=6))].sort();if(a.length)W[k].o=a}});o.prefs.wplans=W;
    if(okM(p.wday)){const w=o.prefs.wday,Dz=v=>Array.isArray(v)?v.filter(x=>Number.isInteger(x)&&x>=0&&x<=6):[];let nw=[0,1,2,3,4,5,6].filter(d=>w[d]>=60);if(!nw.length)nw=[0,1,2,3,4,5,6].filter(d=>w[d]>0);
      o.prefs.wnew=nw.length?nw:[1];o.prefs.woff=[0,1,2,3,4,5,6].filter(d=>w[d]===0);o.prefs.wsim=[...new Set(Dz(p.wsim))].sort()}
    o.prefs.wsim=o.prefs.wsim.filter(d=>o.prefs.wday[d]>0)}
  if(Number.isInteger(p.fw)&&p.fw>=5&&p.fw<=180)o.prefs.fw=p.fw;
  if(Number.isInteger(p.fb)&&p.fb>=0&&p.fb<=60)o.prefs.fb=p.fb;
  if(Number.isInteger(p.flong)&&p.flong>=0&&p.flong<=60)o.prefs.flong=p.flong;
  if(p.onb===1)o.prefs.onb=1;
  if(Array.isArray(p.ihide))o.prefs.ihide=p.ihide.filter(x=>typeof x==="string").slice(0,20);
  if(Array.isArray(p.iorder))o.prefs.iorder=p.iorder.filter(x=>typeof x==="string").slice(0,20);
  /* Lote 18: a fila do dia sobe para logo depois da saudação também em quem já tinha uma ordem salva (uma vez) */
  if(o.prefs.iorder&&!p.iq18){const a=o.prefs.iorder.filter(x=>x!=="iQueue"),h=a.indexOf("iHero");a.splice(h+1,0,"iQueue");o.prefs.iorder=a}if(o.prefs.iorder||p.iq18)o.prefs.iq18=1;
  if(Number.isInteger(p.fevery)&&p.fevery>=2&&p.fevery<=8)o.prefs.fevery=p.fevery;
  if(["","w","b","r","s","f"].includes(p.fnoise))o.prefs.fnoise=p.fnoise;
  if(typeof p.calm==="boolean")o.prefs.calm=p.calm;
  if(Number.isInteger(p.fvol)&&p.fvol>=0&&p.fvol<=100)o.prefs.fvol=p.fvol;
  if(Number.isInteger(p.fwgoal)&&p.fwgoal>=0&&p.fwgoal<=6000)o.prefs.fwgoal=p.fwgoal;
  if(typeof p.fsnd==="boolean")o.prefs.fsnd=p.fsnd;
  if(typeof p.fwake==="boolean")o.prefs.fwake=p.fwake;
  if(Number.isInteger(p.fgoal)&&p.fgoal>=0&&p.fgoal<=720)o.prefs.fgoal=p.fgoal;
  if(Number.isInteger(p.qgoal)&&p.qgoal>=0&&p.qgoal<=5000)o.prefs.qgoal=p.qgoal;
  if(typeof p.adapt==="boolean")o.prefs.adapt=p.adapt;
  if([120,150,180,210,240].includes(p.qpace))o.prefs.qpace=p.qpace;
  if(typeof f.name==="string")o.profile.name=f.name.trim().slice(0,40);
  if(["clinico","internato","reta"].includes(f.phase))o.profile.phase=f.phase;
  if(typeof f.goal==="string")o.profile.goal=f.goal.trim().slice(0,60);
  if(typeof f.goalDate==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(f.goalDate))o.profile.goalDate=f.goalDate;
  /* provas de residência: lista + principal; goal/goalDate passam a espelhar a principal (o resto do app lê esses dois) */
  let ex=Array.isArray(f.exams)?f.exams.filter(e=>e&&typeof e==="object").slice(0,12).map((e,i)=>{const y={id:typeof e.id==="string"&&e.id?e.id.slice(0,24):"ex"+i,name:typeof e.name==="string"?e.name.trim().slice(0,60):""};
    if(typeof e.date==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(e.date)){y.date=e.date;if(e.est)y.est=1}return y}):null;
  if(!ex||(!ex.length&&(o.profile.goal||o.profile.goalDate)&&!f.exOk)){ex=(o.profile.goal||o.profile.goalDate)?[{id:"ex0",name:o.profile.goal||"Prova de residência",...(o.profile.goalDate?{date:o.profile.goalDate}:{})}]:[]}
  o.profile.exams=ex;o.profile.exOk=true;const mn=ex.find(e=>e.id===f.mainEx)||ex[0];if(mn){o.profile.mainEx=mn.id;o.profile.goal=mn.name;o.profile.goalDate=mn.date||""}else{o.profile.goal="";o.profile.goalDate=""}
  return o}
function applyUI(){const P=ui.prefs,R=document.documentElement;R.dataset.skin=P.layout;R.dataset.font=P.font;R.dataset.calm=P.calm?"1":"0";
  if(P.theme==="auto"){if(R.dataset.themeOwn){R.removeAttribute("data-theme");delete R.dataset.themeOwn}}else{R.setAttribute("data-theme",P.theme);R.dataset.themeOwn="1"}
  PLAN_N=P.planN;SUBS_PER_DAY=P.subN;WK_NEW=new Set([0,1,2,3,4,5,6].filter(d=>P.wday[d]>=60));WK_SIM=new Set(P.wsim);WK_OFF=new Set([0,1,2,3,4,5,6].filter(d=>P.wday[d]===0));
  HAS_OFF=WK_OFF.size>0||Object.values(P.wplans||{}).some(w=>w.m.includes(0));INT.splice(0,INT.length,...INT_SETS[P.ints]);FAC_WIN=P.facWin;RES_MIN_WEEK=P.resWeek;
  if(window.__decideLayout)window.__decideLayout()}
function saveUI(){uiTouched=true;ui=uiSanitize(ui);try{localStorage.setItem(LSUI,JSON.stringify(ui))}catch(e){}applyUI();
  if(!uiDoc)return;clearTimeout(uiTimer);uiTimer=setTimeout(async()=>{uiTimer=0;try{liveW.ui=stab(ui);await uiDoc.set({...ui,updatedAt:new Date().toISOString()})}catch(e){}},600)}
function setPref(k,v){ui.prefs[k]=v;saveUI();render()}
const initials=n=>{const w=String(n||"").trim().split(/\s+/).filter(x=>x&&!STOP.has(norm(x)));return w.length?(w[0][0]+(w.length>1?w[w.length-1][0]:"")).toUpperCase():""};
function goSub(v){if(view!==v){if(!["perfil","config","help","instr"].includes(view))backStack=[];backStack.push(view);if(backStack.length>6)backStack.shift()}setView(v)}
function goBack(){setView(backStack.pop()||"inicio")}
/* barra lateral de altura inteira (computador e iPad deitado): a marca, a busca, o perfil e as configurações mudam de lugar (os mesmos nós, mesmos ids) */
const sideFull=()=>{const R=document.documentElement.dataset;return R.layout==="desktop"||R.layout==="tablet"&&R.cols==="2"};
function placeSide(){const full=sideFull(),h=document.querySelector("body>.wrap>header"),br=document.querySelector("h1.brand"),acts=$("#hacts"),sr=$("#srchBtn"),pf=$("#profBtn"),cf=$("#cfgBtn");if(!h||!br||!acts)return;
  if(!sr.querySelector(".sstx"))sr.insertAdjacentHTML("beforeend",`<span class="sstx">Buscar</span><kbd class="sskbd">Ctrl K</kbd>`);
  if(full){if(br.parentNode!==$("#sBrand"))$("#sBrand").appendChild(br);if(sr.parentNode!==$("#sSearch"))$("#sSearch").appendChild(sr);if(pf.parentNode!==$("#sfProf"))$("#sfProf").appendChild(pf);if(cf.parentNode!==$("#sfCfg"))$("#sfCfg").appendChild(cf)}
  else{if(br.parentNode!==h)h.insertBefore(br,acts.nextSibling);if(sr.parentNode!==acts||pf.parentNode!==acts||cf.parentNode!==acts)acts.append(sr,pf,cf)}
  const n=$("#sfName");if(n)n.textContent=(ui.profile.name||"").trim()||"Seu perfil"}
new MutationObserver(()=>placeSide()).observe(document.documentElement,{attributes:true,attributeFilter:["data-layout","data-cols"]});
/* ===== Lote 2: barra lateral recolhível (computador e iPad deitado) e menu ≡ (celular e iPad em pé) ===== */
const LSSB="resid-sbpin";let sbPin=(()=>{try{const v=localStorage.getItem(LSSB);return v==="open"||v==="rail"?v:""}catch(e){return ""}})(),sbTouch=false,sbT=0;
const sbHover=()=>matchMedia("(hover:hover) and (pointer:fine)").matches;
function sbMode(){if(!sideFull())return "";if(document.querySelector(".vfull")||(document.querySelector("#viewErros.erfull:not([hidden])")))return "rail";if(sbPin)return sbPin;return view==="inicio"?"open":"rail"}
function sbPeek(on,touch){const n=document.querySelector(".appnav");if(!n)return;const R=document.documentElement;on=!!on&&R.dataset.sb==="rail";n.classList.toggle("peek",on);sbTouch=on&&!!touch;$("#sbBack").hidden=!sbTouch;$("#sbMenu").setAttribute("aria-expanded",on)}
function sbApply(){const R=document.documentElement,m=sbMode();if(m){if(R.dataset.sb!==m)R.dataset.sb=m}else if(R.dataset.sb)delete R.dataset.sb;if(m!=="rail")sbPeek(false);
  const po=$("#sbPinOpen"),pr=$("#sbPinRail");if(po){po.setAttribute("aria-pressed",sbPin==="open");po.title=sbPin==="open"?"Fixada aberta. Toque para voltar ao automático (aberta no Início, recolhida nas outras abas)":"Fixar a barra sempre aberta";po.querySelector("span").textContent=sbPin==="open"?"Fixada":"Fixar"}
  if(pr){pr.setAttribute("aria-pressed",sbPin==="rail");pr.title=sbPin==="rail"?"Sempre recolhida. Toque para voltar ao automático":"Deixar a barra sempre recolhida (abre ao passar o mouse)";pr.querySelector("span").textContent=sbPin==="rail"?"Recolhida":"Recolher"}}
function sbSetPin(v){sbPin=v;try{v?localStorage.setItem(LSSB,v):localStorage.removeItem(LSSB)}catch(e){}sbPeek(false);sbApply();if(view==="config")render()}
new MutationObserver(()=>sbApply()).observe(document.documentElement,{attributes:true,attributeFilter:["data-layout","data-cols"]});
{const n=document.querySelector(".appnav");
  n.addEventListener("mouseenter",()=>{if(!sbHover()||document.documentElement.dataset.sb!=="rail")return;clearTimeout(sbT);sbT=setTimeout(()=>sbPeek(true),120)});
  n.addEventListener("mouseleave",()=>{clearTimeout(sbT);if(!sbTouch)sbPeek(false)});
  n.addEventListener("focusin",e=>{if(document.documentElement.dataset.sb==="rail"&&e.target.matches(":focus-visible"))sbPeek(true)});
  n.addEventListener("focusout",()=>setTimeout(()=>{if(!n.contains(document.activeElement)&&!sbTouch&&!n.matches(":hover"))sbPeek(false)},0));
  n.addEventListener("click",e=>{if(e.target.closest(".tab,.navextra button,#srchBtn,#sfWho,#profBtn,#cfgBtn"))sbPeek(false)});
  $("#sbMenu").onclick=()=>{const on=!n.classList.contains("peek");sbPeek(on,true)};
  $("#sbBack").onclick=()=>sbPeek(false);
  $("#sbPinOpen").onclick=()=>sbSetPin(sbPin==="open"?"":"open");
  $("#sbPinRail").onclick=()=>sbSetPin(sbPin==="rail"?"":"rail")}
/* menu ≡: lista de todas as seções com um resumo de cada */
const NM_SUB={inicio:"Painel do dia",temas:"198 temas e revisões",fac:"Semestres, disciplinas e provas",quest:"Banco de questões, simulados e provas",notas:"Caderno livre e anotações dos temas",foco:"Pomodoro e cronômetro",erros:"Caderno de erros",stats:"Como estou indo e se chego a tempo"};
function nmInfo(v){try{
  if(v==="inicio"){const P=ensurePlan();if(P.items.length){const d=P.items.filter(itemDone).length;return [`Estudar hoje: ${d} de ${P.items.length} temas`,""]}}
  if(v==="temas"){const n=dueCount();return [n?`${n} ${n===1?"revisão pendente":"revisões pendentes"}`:"Revisões em dia",n?"late":"",n]}
  if(v==="fac"){const up=upcomingProvas()[0];if(up){const dd=daysTo(up.date);return [`${up.name} · ${inLabel(dd)}`,dd<=7?"late":""]}}
  if(v==="quest"){const h=hist[today()];if(h&&h.q)return [`Hoje: ${h.q} ${h.q===1?"questão":"questões"}, ${pct(h.c||0,h.q)}% de acerto`,""]}
  if(v==="notas"){const nk=Object.keys(notes).filter(k=>BYKEY[k]&&notes[k].trim()).length,nf=freeN.length;if(nk||nf)return [[nf?`${nf} no caderno livre`:"",nk?`${nk} ${nk===1?"tema":"temas"} com anotações`:""].filter(Boolean).join(" · "),""]}
  if(v==="foco"){const td=foSum(foSess.filter(x=>x.d===today()));return [foRun?`${foRun.ph==="b"?"Pausa":"Sessão"} em andamento · ${foShown().txt}`:`Hoje: ${fmtMin(td)}${foDG()?` de ${fmtMin(foDG()*60)}`:""}`,"",foRun?"●":0]}
  if(v==="erros"){const n=eDueList().length;return [n?`${n} para revisar hoje`:"Nada para revisar hoje",n?"late":"",n]}
  if(v==="stats"){const V=stVerdRes(stRes(30)),a=V[0],b=V[1];if(a[1]==="na"&&b[1]==="na")return [NM_SUB.stats,""];return [[a[1]!=="na"?a[2]:"",b[1]!=="na"?`chegar a tempo: ${b[2].toLowerCase()}`:""].filter(Boolean).join(" · "),b[1]==="bad"||b[1]==="warn"?"late":""]}}catch(e){}return [NM_SUB[v]||"",""]}
function navListEl(onGo){const ul=el(`<ul class="nmlist"></ul>`),cur=["mais"].includes(view)?"":view;
  document.querySelectorAll(".appnav .tabs .tab").forEach(t=>{const v=t.dataset.v;if(!v||v==="mais"||v==="help")return;
    const [sub,cls,badge]=nmInfo(v),li=el(`<li><button class="nmit" type="button"><span class="nmic"></span><span class="nmt"></span><span class="nms"></span></button></li>`),b=li.querySelector("button");
    b.id="go-"+v;const ic=t.querySelector(".ti");if(ic)b.querySelector(".nmic").appendChild(ic.cloneNode(true));b.querySelector(".nmt").textContent=t.querySelector(".tl").textContent;
    const sp=b.querySelector(".nms");sp.textContent=sub;if(cls)sp.classList.add(cls);if(v==="foco")sp.id="maisFoco";if(v==="notas")sp.id="maisNotas";
    if(badge){const x=el(`<span class="nmb"></span>`);x.textContent=String(badge);if(v==="foco")x.classList.add("soft");b.appendChild(x)}
    if(v===cur)b.setAttribute("aria-current","page");b.onclick=()=>{onGo&&onGo();backStack=[];setView(v)};ul.appendChild(li)});
  return ul}
function navMenuOpen(){const M=$("#navMenu"),P=$("#nmPanel");P.innerHTML="";
  P.appendChild(el(`<span class="nmgrab" aria-hidden="true"></span>`));
  const hd=el(`<div class="nmhead"><h2>Menu</h2><button class="sbb" id="nmClose" type="button" aria-label="Fechar o menu"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>`);hd.querySelector("button").onclick=navMenuClose;P.appendChild(hd);
  const sr=el(`<button class="nmsearch" id="nmSearch" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/></svg>Buscar em temas, anotações e erros</button>`);sr.onclick=()=>{navMenuClose();gsOpen=true;renderGSearch()};P.appendChild(sr);
  P.appendChild(navListEl(navMenuClose));P.appendChild(el(`<div class="nmsep"></div>`));
  const sec=el(`<div class="nmsec"></div>`);[["nmProf","Perfil",`<circle cx="12" cy="8.5" r="3.6"/><path d="M4.8 20c.9-3.6 3.8-5.6 7.2-5.6s6.3 2 7.2 5.6"/>`,()=>goSub("perfil")],["nmCfg","Configurações",`<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/>`,()=>goSub("config")],["nmHelp","Ajuda",`<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.4c-.6.3-1 .8-1 1.5v.4M12 17.2v.1"/>`,()=>goSub("help")]].forEach(([id,t,ic,fn])=>{
    const b=el(`<button type="button"><svg viewBox="0 0 24 24" aria-hidden="true">${ic}</svg><span></span></button>`);b.id=id;b.querySelector("span").textContent=t;b.onclick=()=>{navMenuClose();fn()};sec.appendChild(b)});P.appendChild(sec);
  clearTimeout(nmTimer);cancelAnimationFrame(nmRaf);M.classList.remove("nmclosing","nmin");M.hidden=false;void P.offsetHeight;nmRaf=requestAnimationFrame(()=>{nmRaf=requestAnimationFrame(()=>M.classList.add("nmin"))});document.body.classList.add("nmopen");$("#tabM").setAttribute("aria-expanded","true");$("#navMenuBtn").setAttribute("aria-expanded","true");setTimeout(()=>{const c=$("#nmClose");if(c)c.focus({preventScroll:true})},30)}
let nmTimer=0,nmRaf=0;
function navMenuClose(){const M=$("#navMenu");if(M.hidden||M.classList.contains("nmclosing"))return;
  cancelAnimationFrame(nmRaf);M.classList.remove("nmin");M.classList.add("nmclosing");clearTimeout(nmTimer);nmTimer=setTimeout(()=>{M.classList.remove("nmclosing");M.hidden=true},260);document.body.classList.remove("nmopen");$("#tabM").setAttribute("aria-expanded","false");$("#navMenuBtn").setAttribute("aria-expanded","false")}
$("#navMenu").addEventListener("click",e=>{if(e.target.id==="navMenu")navMenuClose()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(!$("#navMenu").hidden){navMenuClose();e.stopPropagation()}else if(document.querySelector(".appnav.peek"))sbPeek(false)}},true);
$("#navMenuBtn").onclick=()=>(($("#navMenu").hidden||$("#navMenu").classList.contains("nmclosing"))?navMenuOpen():navMenuClose());

function renderHead(){placeSide();const ini=initials(ui.profile.name),b=$("#profBtn");if(!b)return;b.classList.toggle("hasini",!!ini);$("#profIni").textContent=ini;
  b.setAttribute("aria-pressed",view==="perfil");$("#cfgBtn").setAttribute("aria-pressed",["config","help","instr"].includes(view))}

/* ---------- Perfil ---------- */
function renderPerfil(){const v=$("#viewPerfil"),slot=$("#acctSlot");v.appendChild(slot);const box=$("#pfBody");box.innerHTML="";const P=ui.profile;
  const back=el(`<button class="link fback" type="button">← Voltar</button>`);back.onclick=goBack;box.appendChild(back);
  // cabeçalho
  const hd=el(`<section class="card pfhead"><div class="pfav" aria-hidden="true"></div><div class="pfid"><label class="ffield"><span>Seu nome</span><input class="etext" id="pfName" maxlength="40" placeholder="Como você quer ser chamado"></label><p class="gtext how">Aparece nas iniciais do ícone de perfil, no topo.</p></div></section>`);
  const av=hd.querySelector(".pfav"),ini=initials(P.name);if(ini)av.textContent=ini;else av.innerHTML=`<svg viewBox="0 0 24 24"><circle cx="12" cy="8.5" r="3.6"/><path d="M4.8 20c.9-3.6 3.8-5.6 7.2-5.6s6.3 2 7.2 5.6"/></svg>`;
  const ni=hd.querySelector("input");ni.value=P.name;ni.onchange=()=>{ui.profile.name=ni.value;saveUI();render()};box.appendChild(hd);
  if(!window.__site){const n=el(`<section class="card inote"><p><b>Use o site como principal.</b> Os dados deste artefato ficam separados do site. Para levar o progresso: <b>Configurações › Backup › Exportar</b> aqui e <b>Importar backup</b> no site.</p><div class="btns"><a class="btn" target="_blank" rel="noopener">Abrir o site</a></div></section>`);n.querySelector("a").href=SITE_URL;box.appendChild(n)}
  box.appendChild(phaseEl());
  // provas de residência
  const mt=exEditorEl();
  box.appendChild(mt);
  // conta
  const ac=el(`<section class="card"><div class="dhead"><h2>Conta</h2></div><p class="gtext pfacct"></p><div class="pfslot"></div></section>`),at=ac.querySelector(".pfacct");
  if(window.__site){at.textContent=!window.__site.configured?"A sincronização não está configurada neste site: os dados ficam só neste aparelho.":acctEmail?`Conectado como ${acctEmail}. Tudo sincroniza entre os aparelhos com essa conta.`:"Você não entrou: os dados ficam só neste aparelho. Entre para sincronizar com os outros aparelhos.";
    ac.querySelector(".pfslot").appendChild(slot);slot.hidden=false}
  else{at.textContent="No Claude, seu progresso fica salvo na sua conta do Claude, sem precisar de login. O site tem uma conta separada.";slot.hidden=true}
  box.appendChild(ac);
  // estatísticas
  const days=Object.keys(hist).sort(),act=days.filter(d=>{const h=hist[d];return h&&(h.e||h.r||h.q)});let rv=0,qq=0,qc=0;days.forEach(d=>{const h=hist[d]||{};rv+=h.r||0});
  ALL.forEach(i=>{const s=get(i.key);qq+=s.qt||0;qc+=s.qc||0});
  const studied=ALL.filter(i=>{const s=get(i.key);return s.last||(s.l||0)>0}).length,dom=ALL.filter(i=>(get(i.key).l||0)===3).length,first=act[0];
  const st=el(`<section class="card dash"><div class="dhead"><h2>Minhas estatísticas</h2></div><div class="kpis pfstats"></div></section>`),k=st.querySelector(".kpis");
  {const sb=el(`<button class="mini" type="button" id="pfStats">Ver Estatísticas</button>`);sb.onclick=()=>{backStack=[];setView("stats")};st.querySelector(".dhead").appendChild(sb);
    const xb=el(`<button class="mini" type="button" aria-expanded="${pdfOpt.open}">Exportar PDF</button>`);xb.onclick=()=>{pdfOpt.open=!pdfOpt.open;pdfOpt.msg="";render()};st.querySelector(".dhead").appendChild(xb)}
  [["Sequência atual",`${streak()}`,streak()===1?"dia seguido":"dias seguidos"],["Dias com estudo",`${act.length}`,first?`desde ${br(first)}/${first.slice(0,4)}`:"comece hoje"],
   ["Temas estudados",`${studied}`,`de ${TOTAL} · ${dom} dominados`],["Revisões feitas",`${rv}`,"no total"],
   ["Questões",qq.toLocaleString("pt-BR"),qq?`${pct(qc,qq)}% de acerto`:"nenhuma ainda"],["Faculdade",`${FAC_ITEMS.length}`,`conteúdos próprios · ${fac.discs.length} disciplina${fac.discs.length===1?"":"s"}`]]
   .forEach(([a,b2,c])=>{const x=el(`<div class="kpi"><span class="kl"></span><b></b><span class="ks"></span></div>`);x.querySelector(".kl").textContent=a;x.querySelector("b").textContent=b2;x.querySelector(".ks").textContent=c;k.appendChild(x)});
  if(pdfOpt.open)st.appendChild(pdfPanel());
  box.appendChild(st)}
const goalSpan=dd=>dd>=60?`${Math.round(dd/30.4)} meses`:dd>=14?`${Math.round(dd/7)} semanas`:`${dd} dias`;

/* ---------- Configurações ---------- */
let wkMsg="";
