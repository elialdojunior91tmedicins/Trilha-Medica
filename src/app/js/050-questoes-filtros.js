/* Lote 20: a barra de filtros fica no topo da aba (vale para resumo, gráficos, simulado, Refazer e lista); o cartão "Seus temas nas questões" fica só com a lista e a ordem */
function renderQFilters(){const bar=$("#qFBar"),box=$("#qFilters");qListKeep=qListKeep||$("#qlistT");if(qListKeep&&qListKeep.parentNode)qListKeep.remove();box.innerHTML="";bar.innerHTML="";
  bar.appendChild(el(`<div class="tfsearch">${FC_ICO}<input class="search" id="qq" type="search" placeholder="Buscar tema ou assunto nas questões" aria-label="Buscar tema ou assunto" autocomplete="off"></div>`));
  bar.appendChild(el(`<div class="tfilters"></div>`));const qi=bar.querySelector("#qq");qi.value=qQuery;qi.oninput=debounced(()=>{qQuery=qi.value;render()});
  const pool=[...ALL,...FAC_ITEMS],withQ=it=>get(it.key).qt,U=qUniverse(),nU=U.filter(withQ).length,nAll=pool.filter(withQ).length;
  const ds=fac.discs.filter(d=>{const x=semOf(d.semId);return x&&!x.archived});
  const A=[];if(qArea!=="all")A.push([fcAreaName(qArea),()=>{qArea="all";qSpec="all"}]);if(qArea!=="all"&&qSpec!=="all")A.push([qSpec,()=>{qSpec="all"}]);
  if(qDisc!=="all"){const d=discOf(qDisc);A.push([d?d.name:"Disciplina",()=>{qDisc="all"}])}if(qPer!=="all")A.push([`Últimos ${qPer} dias`,()=>{qPer="all"}]);
  if(qAcc!=="all")A.push([{bad:"Pontos fracos (<60%)",mid:"Acerto regular",good:"Acerto bom"}[qAcc],()=>{qAcc="all";qWeak=false}]);
  if(qInc)A.push(["Incidência muito alta",()=>{qInc=false}]);if(qErrF)A.push(["Com erros no caderno",()=>{qErrF=false}]);if(qDueF)A.push(["Revisão pendente",()=>{qDueF=false}]);if(qWorse)A.push(["Piorando",()=>{qWorse=false}]);
  /* contagem de cada atalho: temas com questões que passam nos outros filtros + este */
  const errK=new Set(errors.filter(e=>!e.arch).map(e=>e.k)),base=pool.filter(withQ),cq=f=>base.filter(f).length,ac=i=>{const s=get(i.key);return s.qt?s.qc/s.qt:null};
  const G=[["Mostrar só","atalhos, combinam com o resto",fcChips([["qWeak","Pontos fracos",qAcc==="bad",()=>{qAcc=qAcc==="bad"?"all":"bad";qWeak=qAcc==="bad"},"Acerto abaixo de 60%",i=>ac(i)<WEAK_PCT],["qIncB","Incidência muito alta",qInc,()=>{qInc=!qInc},"Os que mais caem nas provas",i=>!i.own&&wOf(i)===3],["qErrB","Com erros no caderno",qErrF,()=>{qErrF=!qErrF},"",i=>errK.has(i.key)],["qDueB","Revisão pendente",qDueF,()=>{qDueF=!qDueF},"",i=>isDue(get(i.key))],["qWorseB","Piorando",qWorse,()=>{qWorse=!qWorse},"Acerto dos últimos 30 dias abaixo dos 90 anteriores",i=>{const tr=qTrend(i.key);return tr&&tr.d<=-5}]].map(([id,l,on,fn,tip,f])=>fcChip(`${l} · ${cq(f)}`,on,fn,id,null,tip)))]];
  G.push(["Período","conta só as questões do período",fcPer("qPer",qPer,v=>{qPer=v})]);
  G.push(["Acerto","no período escolhido",fcChips([["bad","Fraco (<60%)"],["mid","Regular (60–79%)"],["good","Bom (80%+)"]].map(([v,l])=>{const fr=qFrom(),n=base.filter(i=>{const [cc,tt]=qOf(i.key,fr);return tt&&accBand(cc,tt)===v}).length;return fcChip(`${l} · ${n}`,qAcc===v,()=>{qAcc=qAcc===v?"all":v;qWeak=qAcc==="bad"},"qAcc-"+v)}))]);
  if(ds.length)G.push(["Disciplina da faculdade","temas ligados a ela",fcSel("qDiscSel","Disciplina",[["all","Todas"],...ds.map(d=>[d.id,`${d.name} (${base.filter(i=>topicKeysOf(discRefs(d)).includes(i.key)).length})`])],ds.some(d=>d.id===qDisc)?qDisc:"all",v=>{qDisc=v})]);
  G.push(["Onde","grande área e especialidade",fcWhere("q",qArea,qSpec,(a,sp)=>pool.filter(i=>withQ(i)&&(a==="all"||i.area.code===a)&&(sp==="all"||i.sp===sp)).length,v=>{qArea=v;qSpec="all"},v=>{qSpec=v})]);
  fcBody(bar.querySelector(".tfilters"),{tog:"qFBtn",panelId:"qFPanel",open:qFOpen,onToggle:()=>{qFOpen=!qFOpen;lsSet("resid-qfpanel",qFOpen?"1":null)},
    act:A,clearId:"qClear",onClear:qClearAll,groups:G,foot:A.length||qQuery?(nU?`${nU} ${nU===1?"tema com questões":"temas com questões"} nesses filtros · vale para a aba toda`:"Nenhum tema com questões nesses filtros"):"",
    onDone:()=>{qFOpen=false;lsSet("resid-qfpanel",null);render()}});
  const c=el(`<div class="card tfind qlistc" id="qFind" aria-labelledby="qfh"><div class="tfhead"><h2 id="qfh">Seus temas nas questões</h2><span class="tfcount"></span></div><div class="tfbar qlbar"></div></div>`);box.appendChild(c);
  c.querySelector(".tfcount").textContent=nU===nAll?`${nAll} ${nAll===1?"tema":"temas"} com questões`:`${nU} de ${nAll} temas`;
  {const l=el(`<label class="tfsort"><span>Ordem</span><select id="qSort"></select></label>`),x=l.querySelector("select");[["num","Por especialidade"],["low","Menor acerto primeiro"],["most","Mais questões primeiro"]].forEach(([v,t])=>{const o=document.createElement("option");o.value=v;o.textContent=t;x.appendChild(o)});x.value=qSort;x.onchange=()=>{qSort=x.value;render()};c.querySelector(".qlbar").appendChild(l)}
  c.appendChild(el(`<p class="how qfall hx">Os filtros do topo da aba valem também para esta lista. Toque num tema para ver os detalhes dele aqui.</p>`));
  if(qListKeep)c.appendChild(qListKeep)}
function renderQuest(){
  renderQFilters();
  {const rb=$("#qRegB");rb.textContent=qReg?"Fechar registro":"+ Registrar questões";rb.onclick=()=>{qReg=qReg?null:{d:today(),query:""};render();if(qReg)setTimeout(()=>{const q=$("#qrq");if(q)q.focus()},30)};
   const box=$("#qRegBox");box.innerHTML="";if(qReg)box.appendChild(qRegPanel());
   const U0=qUniverse();const qe=$("#qEvo");qe.innerHTML=qEvoSvg(U0,qe.clientWidth||qe.parentNode.clientWidth).html;
   const ex=$("#qExtra");ex.innerHTML="";ex.append(qSimCard(U0),qRedoCard(U0));{const eb=$("#qExamBox");eb.innerHTML="";eb.appendChild(qExamCard())}const sb=$("#qSrcBox");sb.innerHTML="";sb.appendChild(qSrcCard(U0,qFrom()));
   const gb=$("#qGoal");gb.innerHTML="";gb.appendChild(qGoalEl());const pb=$("#qPace");pb.innerHTML="";pb.appendChild(qPaceEl());
   // partes (celular e tablet em pé)
   const vq=$("#viewQuest");vq.dataset.qseg=qLegacy()?qSeg:"";vq.dataset.qpart=qLegacy()?"all":qPart;
   {const pb=$("#qPartBar");pb.innerHTML="";if(!qLegacy())pb.appendChild(qPartBarEl());const bb=$("#bkBox");bb.innerHTML="";if(qLegacy()||qPart==="banco")bb.appendChild(bkCard())}const rdN=redo.filter(x=>BYKEY[x.k]&&U0.some(i=>i.key===x.k)).length,tN=U0.filter(i=>get(i.key).qt).length;
   $("#qSegBar").querySelectorAll("button").forEach(b=>{b.setAttribute("aria-pressed",b.dataset.q===qSeg);b.innerHTML={resumo:"Resumo",praticar:"Praticar"+(rdN?`<b>${rdN}</b>`:""),temas:"Temas"+(tN?`<b>${tN}</b>`:"")}[b.dataset.q];b.onclick=()=>setQSeg(b.dataset.q)});
   /* Lote 20: os filtros ligados aparecem na barra do topo da aba (etiquetas com ×) */}
  const from=qFrom(),U=qUniverse(),st=U.map(it=>{const [c,t]=qOf(it.key,from);return {it,c,t}});
  const withQ=st.filter(x=>x.t),vis=withQ.filter(x=>qAcc==="all"||accBand(x.c,x.t)===qAcc);
  let C=0,T=0;vis.forEach(x=>{C+=x.c;T+=x.t});const p=pct(C,T),[bk,bl]=band(p),weakN=withQ.filter(x=>x.t>=WEAK_MIN&&x.c/x.t<WEAK_PCT).length;
  const perL=from?`nos últimos ${qPer} dias`:"desde o início";
  $("#qkpis").innerHTML=`
    <div class="kpi"><span class="kl">Questões feitas</span><b>${T.toLocaleString("pt-BR")}</b><span class="ks">${C.toLocaleString("pt-BR")} acertos · ${(T-C).toLocaleString("pt-BR")} erros ${perL}</span></div>
    <div class="kpi"><span class="kl">Acerto</span><b>${T?p+"%":"–"}</b><span class="ks">${T?`<span class="st ${bk}">${bl}</span>`:"sem questões neste filtro"}</span></div>
    <div class="kpi"><span class="kl">Temas praticados</span><b>${vis.length}</b><span class="ks">de ${U.length} no filtro</span></div>
    <div class="kpi${weakN?" alert":""}"><span class="kl">Pontos fracos</span><b>${weakN}</b><span class="ks">abaixo de 60% (5+ questões)</span></div>`;
  // gráfico: especialidades (padrão) ou áreas
  /* Lote 10: tendência ▲▼ (30 dias × 90 antes), poucas questões esmaecidas, ordem "onde ganhar mais pontos" (incidência² × distância de 80%), toque filtra */
  const groups={};vis.forEach(x=>{const key=qChartBy==="area"?x.it.area.code:x.it.area.code+"|"+x.it.sp;const g=groups[key]||(groups[key]={key,code:x.it.area.code,sp:qChartBy==="area"?"":x.it.sp,lab:qChartBy==="area"?x.it.area.name:`${x.it.sp} · ${x.it.area.code}`,c:0,t:0,ks:[],w:0});g.c+=x.c;g.t+=x.t;g.ks.push(x.it.key);g.w+=wOf(x.it)});
  const t0=dnum(today()),G=Object.values(groups).map(g=>{const a=stQ(g.ks,t0-29,t0),b=stQ(g.ks,t0-119,t0-30),tr=a.q>=5&&b.q>=5?Math.round((a.c/a.q-b.c/b.q)*100):null,w=g.w/g.ks.length;return {...g,tr,gain:g.ks.reduce((a,k)=>a+(BYKEY[k]?focusScore(BYKEY[k]):0),0)}});
  const rows=G.sort(qChSort==="gain"?(a,b)=>b.gain-a.gain||a.c/a.t-b.c/b.t:(a,b)=>a.c/a.t-b.c/b.t||b.t-a.t);
  $("#qChartTitle").textContent=qChartBy==="area"?"Acerto por área":"Acerto por especialidade";
  const tog=`<div class="qchctl"><div class="seg qchtog" role="group" aria-label="Agrupar gráfico"><button type="button" data-by="spec" aria-pressed="${qChartBy==="spec"}">Especialidades</button><button type="button" data-by="area" aria-pressed="${qChartBy==="area"}">Áreas</button></div><div class="seg qchsort" role="group" aria-label="Ordem"><button type="button" id="qchS-acc" data-s="acc" aria-pressed="${qChSort!=="gain"}">Menor acerto</button><button type="button" id="qchS-gain" data-s="gain" aria-pressed="${qChSort==="gain"}">Onde focar</button></div></div>`;
  const qchRows=L=>L.map(g=>{const p=pct(g.c,g.t),[bk,bl]=band(p),few=g.t<QCH_FEW,tr=g.tr===null||Math.abs(g.tr)<5?"":`<span class="qtr ${g.tr>0?"up":"down"}" title="últimos 30 dias × os 90 anteriores">${g.tr>0?"▲":"▼"} ${Math.abs(g.tr)}</span>`;
    return `<button type="button" class="vrow qchrow${few?" few":""}" data-code="${esc(g.code)}" data-sp="${esc(g.sp)}"><div class="vtop"><span class="vl">${esc(g.lab)}</span>${tr}<span class="hv hv-${bk}">${p}%</span><span class="hn">${few?"poucas questões · ":""}${g.c}/${g.t}</span></div><div class="hbar track1"><i class="pbar ${bk}" style="width:${Math.max(p,1)}%" data-tip="${esc(g.lab)}: ${g.c} de ${g.t} (${p}%) · ${bl}${few?" · poucas questões, ainda pouco confiável":""}"></i><span class="ref" style="left:60%" aria-hidden="true"></span></div></button>`}).join("");
  $("#qChart").innerHTML=tog+(T?qchRows(rows.slice(0,qMore?rows.length:12))+(rows.length>12?`<button class="link qmore" type="button">${qMore?"Mostrar menos":`Mostrar todas as ${rows.length}`}</button>`:"")+`<div class="clegend"><span><i class="sw" style="background:var(--good)"></i>Bom (80%+)</span><span><i class="sw" style="background:var(--warn)"></i>Regular (60–79%)</span><span><i class="sw" style="background:var(--bad)"></i>Fraco (&lt;60%)</span><span><i class="refk"></i>linha de 60%</span><span>▲▼ = últimos 30 dias × os 90 anteriores · toque para filtrar</span></div>`:
    `<p class="cempty">${[...ALL,...FAC_ITEMS].some(i=>get(i.key).qt)?"Nenhuma questão com esses filtros.":"Ainda não há questões registradas. Responda questões geradas pelo Claude ou registre acertos dentro de cada tema."}</p>`);
  $("#qChart").querySelectorAll(".qchtog button").forEach(b=>b.onclick=()=>{qChartBy=b.dataset.by;render()});
  $("#qChart").querySelectorAll(".qchsort button").forEach(b=>b.onclick=()=>{qChSort=b.dataset.s;lsSet("resid-qchsort",qChSort);render()});
  $("#qChart").querySelectorAll(".qchrow").forEach(b=>b.onclick=()=>{qArea=b.dataset.code;qSpec=b.dataset.sp||"all";render()});
  const mb=$("#qChart").querySelector(".qmore");if(mb)mb.onclick=()=>{qMore=!qMore;render()};
  // lista por tema
  const list=$("#qlistT");list.innerHTML="";
  if(!withQ.length&&![...ALL,...FAC_ITEMS].some(i=>get(i.key).qt)){list.appendChild(el(`<li class="tips">Quando você fizer questões, cada tema aparece aqui com o número de questões e a porcentagem de acerto, agrupado por especialidade.</li>`));return}
  if(!vis.length){list.appendChild(el(`<li class="empty" style="padding:0">Nenhum tema com esses filtros.</li>`));return}
  const S=new Map(vis.map(x=>[x.it.key,x]));
  const row=it=>{const x=S.get(it.key),pp=pct(x.c,x.t),[k,l]=band(pp);
    const li=el(`<li class="qrow"><button type="button" class="qt"><span class="qname"></span><span class="qmeta">${it.own?"FAC":it.area.code+(it.sp?" · "+esc(it.sp):"")}</span></button><div class="qbar"><div class="hbar track1"><i class="pbar ${k}" style="width:${Math.max(pp,1)}%"></i><span class="ref" style="left:60%" aria-hidden="true"></span></div></div><div class="qnums"><b class="hv-${k}">${pp}%</b><span>${x.c}/${x.t}</span><span class="st ${k}">${l}</span></div></li>`);
    li.querySelector(".qname").textContent=it.t;const qt=li.querySelector(".qt"),open=qOpenK===it.key;qt.setAttribute("aria-expanded",open);qt.onclick=()=>{qOpenK=open?null:it.key;render()};if(open)li.classList.add("qopen");
    li.querySelector(".hbar").setAttribute("data-tip",`${it.t}: ${x.c} acertos em ${x.t} questões (${pp}%) ${perL}`);li.appendChild(open?qTopicPanel(it):qRowExtra(it));return li};
  const items=vis.map(x=>x.it);list.classList.remove("q2c");
  /* Lote 17: sem filtro, a lista mostra os 10 que mais pedem atenção (a conta do "onde focar"; depois o menor acerto) e "Ver todos" */
  if(!qListAll&&!qFiltOn()&&items.length>QLIST_TOP){const fr=new Map(focusRank(items).map((it,i)=>[it.key,i])),ac=it=>S.get(it.key).c/S.get(it.key).t;
    const top=[...items].sort((a,b)=>(fr.has(a.key)?fr.get(a.key):1e3)-(fr.has(b.key)?fr.get(b.key):1e3)||ac(a)-ac(b)).slice(0,QLIST_TOP);
    list.appendChild(el(`<li class="qtophead how">Os ${QLIST_TOP} temas que mais pedem atenção (mais cobrados e com acerto mais longe de 80%).</li>`));list.classList.add("q2c");
    top.forEach(it=>list.appendChild(row(it)));const m=el(`<li class="qtopmore"><button class="btn" type="button" id="qAllT"></button></li>`);m.querySelector("button").textContent=`Ver todos os ${items.length} temas`;m.querySelector("button").onclick=()=>{qListAll=true;render()};list.appendChild(m);return}
  if(qListAll&&items.length>QLIST_TOP){const m=el(`<li class="qtophead"><button class="link" type="button" id="qTopT">Mostrar só os ${QLIST_TOP} que mais pedem atenção</button></li>`);m.querySelector("button").onclick=()=>{qListAll=false;render()};list.appendChild(m)}
  if(qSort==="num"){const ai=it=>{const i=AREAS.indexOf(it.area);return i<0?99:i},si=it=>{const i=(it.area.specs||[]).findIndex(z=>z.name===it.sp);return i<0?99:i};items.sort((a,b)=>ai(a)-ai(b)||si(a)-si(b)||(a.sp||"").localeCompare(b.sp||"","pt")||(a.own-b.own)||a.num-b.num);appendGrouped(list,items,x=>x,row,["tema","temas"])}
  else{items.sort(qSort==="low"?(a,b)=>S.get(a.key).c/S.get(a.key).t-S.get(b.key).c/S.get(b.key).t||S.get(b.key).t-S.get(a.key).t:(a,b)=>S.get(b.key).t-S.get(a.key).t);items.forEach(it=>list.appendChild(row(it)))}
}

function hbarRows(rows){// rows: [label, c, t, onclick?]
  return rows.map(([lab,c,t])=>{const p=pct(c,t),[bk,bl]=band(p);
    return `<div class="vrow"><div class="vtop"><span class="vl">${esc(lab)}</span><span class="hv">${t?p+"%":"–"}</span><span class="hn">${t?`${c}/${t}`:"sem questões"}</span></div><div class="hbar track1">${t?`<i class="pbar ${bk}" style="width:${Math.max(p,1)}%" data-tip="${esc(lab)}: ${c} de ${t} (${p}%) · ${bl}"></i>`:""}<span class="ref" style="left:60%" aria-hidden="true"></span></div></div>`}).join("")}
/* plano do dia: fica fixo até virar o dia (ou até "Refazer plano") */
const LSDP="resid-plano-v1";let SUBS_PER_DAY=3;
let dayPlan=null, planEdit=null;
function pickSubs(it,kind){const L=subList(it),s=get(it.key);if(!L.length)return [];
  const open=L.filter(x=>!x.done),done=L.filter(x=>x.done);
  let pool;
  if(kind==="r-rev"&&done.length){const sv=s.sv||{};
    /* revisão: os subtópicos revisados há mais tempo primeiro (nunca revisado = mais antigo; empate pela ordem da lista);
       quantidade cresce com o tamanho do tema (≈ 1/4 dos estudados, no mínimo o "Subtópicos por tema") para cobrir o tema em 3–4 revisões */
    const age=y=>(y.d?dnum(y.d):0)-(y.x.hy?14:0);/* Lote 21: ★ HY volta mais vezes no rodízio */
    pool=done.map((x,o)=>({x,o,d:sv[subKey(x)]||""})).sort((a,b)=>age(a)-age(b)||a.o-b.o).map(y=>y.x);
    return pool.slice(0,revSubN(done.length)).map(x=>x.t)}
  else pool=open.length?open:L;
  return pool.slice(0,SUBS_PER_DAY).map(x=>x.t)}
/* subtópico revisado: s.sv = {"i3": data} (da lista padrão, pelo índice) ou {"c:texto": data} (subtópico seu) */
const subKey=x=>x.j!=null?"c:"+x.t:"i"+x.i;
const revSubN=n=>Math.min(n,Math.max(SUBS_PER_DAY,Math.ceil(n/4)));
function itemByKey(k){return BYKEY[k]||FAC_ITEMS.find(i=>i.key===k)||null}
function markSubsReviewed(x,it){const L=subList(it),subs=new Set(pickSubs(it,"r-rev"));if(!subs.size)return;const sv={},t=today();
  L.forEach(y=>{if(!y.done)return;const k=subKey(y),v=(x.sv||{})[k];if(subs.has(y.t))sv[k]=t;else if(v)sv[k]=v});x.sv=sv}
const WEAK_DAY_Q=5;
function markResDay(P){const has=P.items.some(x=>x.cls!=="r-fac"&&x.cls!=="r-pfr"&&!(BYKEY[x.k]||{}).own);const d=today(),h=hist[d]||(hist[d]={});if(has)h.res=1;else{delete h.res;if(!Object.keys(h).length)delete hist[d]}try{localStorage.setItem(LSH,JSON.stringify(hist))}catch(e){}}
function makeDayPlan(){return {d:today(),items:buildPlan().map(({it,cls,txt,sub,pid,ref,n})=>{if(cls==="r-pfr")return {k:it.key,cls,txt,subs:[],pid,ref,n};const x={k:it.key,cls,txt,subs:cls==="r-fac"&&sub?[sub]:pickSubs(it,cls==="r-fac"?"r-new":cls)};if(cls==="r-weak")x.q0=get(it.key).qt||0;
    if(cls==="r-new"||cls==="r-cont"||cls==="r-eixo"){const P=partSubs(it);x.subs=P.subs;if(P.pt){x.pt=P.pt;x.txt=(cls==="r-new"?"Tema novo":cls==="r-eixo"?txt:"Continuar")+` · Parte ${P.pt[0]} de ${P.pt[1]}`}}return x})}}
function ensurePlan(){if(!dayPlan||dayPlan.d!==today()||!Array.isArray(dayPlan.items)){dayPlan=makeDayPlan();markResDay(dayPlan);savePlan(false)}
  else if(dayPlan.items.some(x=>x.cls==="r-rev")){// planos antigos: revisões agora ficam na seção Revisões
    dayPlan.items=dayPlan.items.filter(x=>x.cls!=="r-rev");const f=makeDayPlan().items.filter(x=>!dayPlan.items.some(y=>y.k===x.k));
    while(dayPlan.items.length<dayCap(dnum(today()))&&f.length)dayPlan.items.push(f.shift());savePlan(false)}
  dayPlan.items=dayPlan.items.filter(x=>BYKEY[x.k]);return dayPlan}
let planTouched=false;
function savePlan(touch=true){if(touch)planTouched=true;if(dayPlan&&dayPlan.d===today()&&Array.isArray(dayPlan.items))markResDay(dayPlan);try{localStorage.setItem(LSDP,JSON.stringify(dayPlan))}catch(e){}if(store)persist()}
function planSubs(it){const p=dayPlan&&dayPlan.d===today()&&dayPlan.items.find(x=>x.k===it.key);return p?p.subs:[]}
function itemDone(p){const it=BYKEY[p.k],L=subList(it),s=get(p.k);
  if(p.cls==="r-pfr"){const P=fac.provas.find(x=>x.id===p.pid);return !!P&&provaRv(P,p.ref).includes(today())}
  if(p.cls==="r-rev")return s.last===today();
  if(p.cls==="r-weak")return weakDone(p)>=WEAK_DAY_Q;
  if(!p.subs.length&&s.last===today())return true;
  return !!(p.subs.length&&p.subs.every(t=>{const x=L.find(y=>y.t===t);return !x||x.done}));}
function weakDone(p){if(p.q0===undefined)p.q0=get(p.k).qt||0;return Math.max(0,(get(p.k).qt||0)-p.q0)}
/* "Não estudei": tira das revisões e volta para não iniciado (mantém questões, anotações e erros) */
function resetStudy(k){upd(k,x=>{delete x.last;delete x.step;delete x.pre;delete x.ed;delete x.ing;x.l=0;delete x.sd;if(Array.isArray(x.cs))x.cs=x.cs.map(c=>({...c,d:false}))});
  if(dayPlan){if(dayPlan.rchk)delete dayPlan.rchk[k];if(Array.isArray(dayPlan.revd))dayPlan.revd=dayPlan.revd.filter(y=>y!==k);savePlan()}revArm=null;commit()}
let revArm=null;
/* revisão do tema (Lote 17): 0 = Esqueci (volta 2 degraus), 1 = Difícil (repete o intervalo), 2 = Lembrei (sobe 1 degrau; lembrou depois do previsto → o próximo
   intervalo é pelo menos o tempo que de fato passou). true/false antigos = Lembrei/Difícil. o.auto = marcada pelas questões do dia (s.ar = {d,a} acerto) */
const REV_G=[["Esqueci","volta 2 degraus"],["Difícil","repete o intervalo"],["Lembrei","sobe 1 degrau"]];
function revNext(s,g){const st=s.step||0,mx=INT.length-1;if(g===1)return st;if(g!==2)return Math.max(0,st-2);let n=Math.min(st+1,mx);
  if(s.last){const gone=dnum(today())-dnum(s.last),pl=interval(s);if(gone>pl)while(n<mx&&INT[n]<gone)n++}return n}
function revPreview(s,g){const n=revNext(s,g),x={...s,step:n,last:today()};delete x.adj;delete x.adjFrom;return interval(x)}
function reviewTopic(k,good,o){const g=good===true?2:good===false?1:good,it=itemByKey(k);o=o||{};
  upd(k,x=>{if(it)markSubsReviewed(x,it);const n=revNext(x,g);x.last=today();x.step=n;x.rg=g;if(o.auto)x.ar={d:today(),a:o.acc};else delete x.ar;if(g===2)x.l=Math.max(x.l||0,2)});
  logAct("r");markReviewed(k);if(!o.quiet)commit()}
function revBtns(k,cls){const s=get(k),w=el(`<div class="pacts revg${cls?" "+cls:""}"></div>`);[2,1,0].forEach(g=>{const d=revPreview(s,g),b=el(`<button class="btn${g===2?" primary":""}" type="button"><span></span><small></small></button>`);
    b.id=`rg${g}-${k}`;b.querySelector("span").textContent=REV_G[g][0];b.querySelector("small").textContent=d===1?"1 dia":d+" dias";b.title=`${REV_G[g][0]}: ${REV_G[g][1]} (próxima em ${d===1?"1 dia":d+" dias"})`;b.onclick=()=>reviewTopic(k,g);w.appendChild(b)});return w}
/* questões contam como revisão: no dia em que o tema vence, ${QREV_MIN}+ questões dele marcam a revisão sozinhas, com a resposta pelo acerto */
const QREV_MIN=5;
function qAutoRev(){if(isOffDay()||(store&&!synced))return false;const T=today();let ch=false;
  [...ALL,...FAC_ITEMS].forEach(it=>{const s=get(it.key);if(!isDue(s)||s.last===T)return;const v=(s.qd||{})[T];if(!Array.isArray(v)||(v[0]||0)<QREV_MIN)return;
    const a=(v[1]||0)/v[0],g=a>=.75?2:a>=.5?1:0;reviewTopic(it.key,g,{auto:true,quiet:true,acc:Math.round(a*100)});ch=true});return ch}
/* pilha por importância: peso × (dias de atraso + 1); empate = mais atrasada */
const revScore=it=>(wOf(it)||2)*(1+Math.max(0,-(dueIn(get(it.key))||0)));
const revPri=(a,b)=>revScore(b)-revScore(a)||dueIn(get(a.key))-dueIn(get(b.key));
/* freio de carga: muitas revisões atrasadas → menos (ou nenhum) tema novo */
const REV_BRAKE1=20,REV_BRAKE2=40;
function revBrake(){const n=examCrunch().active?0:[...ALL,...FAC_ITEMS].filter(i=>isDue(get(i.key))&&dueIn(get(i.key))<0).length;return {n,cap:n>REV_BRAKE2?0:n>REV_BRAKE1?1:99}}
/* minutos estimados: fila do dia e plano */
const MIN_EST={revs:5,errs:1.5,redo:2,cards:.25,"r-new":40,"r-cont":40,"r-eixo":40,"r-own":40,"r-fac":40,"r-weak":10,"r-pfr":15};
function qMinutes(C){return Math.round(["revs","errs","redo","cards"].reduce((a,id)=>a+(C[id]||0)*MIN_EST[id],0)+(C.weak||0)*MIN_EST.redo)}
function planMinutes(P){return P.items.filter(x=>!itemDone(x)).reduce((a,x)=>a+(MIN_EST[x.cls]||30),0)}

/* cartões do plano: recolhidos por padrão; abertos sozinhos enquanto o tema está sendo estudado (começado e não concluído).
   planOpen guarda o que você abriu ou fechou à mão hoje */
let planOpen={};
/* tempo de hoje no Estudar hoje: selo, "Tenho mais/menos tempo hoje" e, no dia de 30 min, o leve */
let tdOpen=false;
function planDayEl(CR,PW){const t=dnum(today()),m=dayMin(t),w=el(`<div class="pday"><div class="pdrow"><span class="ptime" id="pTime"></span><button class="link" type="button" id="pTimeChg"></button></div></div>`);
  w.querySelector("#pTime").textContent=`${WD_FULL[wdOf(t)][0].toUpperCase()+WD_FULL[wdOf(t)].slice(1)} · ${WP_LAB[m]}`;
  const cb=w.querySelector("#pTimeChg");cb.textContent=tdOpen?"Fechar":m>=180?"Tenho menos tempo hoje":m===0?"Vou estudar hoje":"Tenho mais ou menos tempo hoje";cb.setAttribute("aria-expanded",tdOpen);cb.onclick=()=>{tdOpen=!tdOpen;render()};
  {const W=hndWeek();if(W&&W.d===today()&&m===0){const x=el(`<p class="phnd" id="pHndOn">Hoje não deu: hoje virou folga e a sequência fica congelada. <button class="link" type="button" id="pHndUndo">Desfazer</button></p>`);x.querySelector("button").onclick=hndUndo;w.appendChild(x)}
    else if(m>0&&!W){const b=el(`<button class="link phndb" type="button" id="pHnd"></button>`);b.textContent=hndArm?"Toque de novo: hoje vira folga (1 por semana)":"Hoje não deu";if(hndArm)b.classList.add("warn");
      b.title="Doença ou imprevisto: transforma hoje em folga, empurra as revisões para o próximo dia de estudo e não quebra a sequência";b.onclick=()=>{if(hndArm){hndArm=false;hojeNaoDeu()}else{hndArm=true;render();setTimeout(()=>{if(hndArm){hndArm=false;render()}},6000)}};w.querySelector(".pdrow").appendChild(b)}
    else if(m>0&&W&&W.d!==today()){const s=el(`<span class="phndu"></span>`);s.textContent=`“Hoje não deu” já usado nesta semana (${br(W.d).slice(0,5)}).`;w.querySelector(".pdrow").appendChild(s)}}
  if(tdOpen){const g=el(`<div class="seg pdseg" role="group" aria-label="Tempo de hoje"></div>`);WP_MIN.forEach(v=>{const b=el(`<button type="button"></button>`);b.id="tdm-"+v;b.textContent=WP_LAB[v];b.setAttribute("aria-pressed",v===m);b.onclick=()=>{tdOpen=false;if(v!==m)setTodayMin(v)};g.appendChild(b)});
    w.appendChild(g);w.appendChild(el(`<p class="how">Muda só hoje (fica no plano desta semana). O que você já começou continua no plano.</p>`))}
  if(m>0){const qm=qMinutes(qCounts()),pm=dayPlan&&dayPlan.d===today()?planMinutes(dayPlan):0,tot=qm+pm,e=el(`<p class="pest" id="pEst"></p>`);
    e.textContent=`Tempo estimado: fila ≈ ${fmtMin(qm*60)} + plano ≈ ${fmtMin(pm*60)} = ${fmtMin(tot*60)}${m<180?` · você tem ${WP_LAB[m]}`:""}`;if(m<180&&tot>m)e.classList.add("over");w.appendChild(e)}
  {const BR=revBrake();if(BR.cap<99&&!CR.active&&!PW.length&&m>=60){const b=el(`<p class="pbrake" id="pBrake"></p>`);
    b.textContent=BR.cap?`${BR.n} revisões atrasadas: hoje só 1 tema novo. As revisões vêm primeiro (as mais importantes no topo).`:`${BR.n} revisões atrasadas: dia de pôr em dia, sem tema novo. Comece pelas revisões mais importantes.`;
    if(dayPlan&&dayPlan.d===today()&&dayPlan.items.filter(x=>(x.cls==="r-new"||x.cls==="r-cont"||x.cls==="r-eixo")&&!itemStarted(x)).length>BR.cap)b.textContent+=" O plano de hoje foi montado antes: toque em Refazer plano para aplicar.";w.appendChild(b)}}
  if(m>0){const fn=facDayNotesEl();if(fn)w.appendChild(fn)}
  if(m>=60&&!CR.active&&!PW.length){const ax=axLineEl();if(ax)w.appendChild(ax)}
  if(m===30&&!CR.active&&!PW.length){const C=qCounts(),L=[["cards","Cartões",C.cards,"para hoje"],["errs","Erros",C.errs,"para revisar"],["redo","Questões para refazer",C.redo||0,"para hoje"],["revs","Revisões de temas",C.revs,C.revs>3?"comece pelas mais atrasadas":"para hoje"],...(()=>{const W=C.weak&&weakToday();return W&&BYKEY[W.k]?[["weak","Ponto fraco · "+BYKEY[W.k].t,C.weak,"questões"]]:[]})()].filter(x=>x[2]);
    const b=el(`<div class="plight" id="pLight"><p class="how">Dia curto: só o que é leve e não pode acumular. Nada de tema novo hoje.</p><ul></ul></div>`),ul=b.querySelector("ul");
    if(!L.length)ul.appendChild(el(`<li class="how">Nada vencendo hoje. Se sobrar tempo, faça algumas questões.</li>`));
    {const S=cdGenScope(),n=cdGenIds(S).length;if(n){const g=el(`<div class="plgen" id="pLightGenBox"><span><b></b> <span class="how"></span></span><button class="btn" type="button" id="pLightGen">Revisão geral</button></div>`);
      g.querySelector("b").textContent=`Revisão geral com cartões: ${n}`;g.querySelector(".how").textContent=S.prova?`dos temas da ${S.lab}`:"dos temas que você estudou nesta semana";g.querySelector("button").onclick=cdGenGo;b._gen=g}}
    L.forEach(([id,lab,n,tm])=>{const li=el(`<li><b></b><span class="pltag"></span></li>`);li.querySelector(".pltag").textContent=tm;li.querySelector("b").textContent=`${lab}: ${n}`;ul.appendChild(li)});
    if(L.length){const go=el(`<button class="btn primary" type="button" id="pLightGo">Começar</button>`);go.onclick=qStart;b.appendChild(go)}if(b._gen)b.appendChild(b._gen);w.appendChild(b)}
  return w}
function renderPlan(){
  {const wb=$("#weekBox");if(wb)wb.innerHTML=""}// Lote 17: a prévia dos próximos dias foi para o cartão "Próximos dias" (renderAgenda)
  const P=ensurePlan(),pl=$("#plan");pl.innerHTML="";const compact=true;if(planOpen.d!==P.d)planOpen={d:P.d};
  const CR=examCrunch(),cb=$("#crunchBar");cb.hidden=!CR.active;{const pn=$("#planNote");pn.hidden=!planNote;pn.textContent=planNote}
  if(CR.active)cb.textContent=(CR.manual?`Modo provas ligado manualmente até ${br(CR.until)}${CR.provas.length?` (${CR.provas.map(p=>p.name).join(", ")})`:""}. Residência pausada; o plano é só da faculdade.`:`Modo provas: ${CR.provas.length} provas entre ${br(CR.from)} e ${br(CR.until)} (${CR.provas.map(p=>p.name).join(", ")}). Residência pausada até ${br(CR.until)}; o plano é só da faculdade.`)+`${P.items.some(x=>x.cls!=="r-fac"&&x.cls!=="r-pfr"&&x.cls!=="r-own"&&!(BYKEY[x.k]||{}).own)?" Toque em Refazer plano para aplicar hoje.":""}`;
  const doneN=P.items.filter(itemDone).length,PW=provaWeek();{const pd=$("#planDay");if(pd){pd.innerHTML="";const x=planDayEl(CR,PW);if(x)pd.appendChild(x)}}
  $("#planmeta").textContent=P.items.length?`${doneN} de ${P.items.length} ${P.items.length===1?"tema concluído":"temas concluídos"}${PW.length&&!CR.active?" · semana de prova":!isNewDay()&&!CR.active?(dayMin(dnum(today()))===30?" · dia curto":" · hoje sem temas novos"):""}`:"";
  $("#planbar").hidden=!P.items.length;$("#planbar").firstElementChild.style.width=(P.items.length?doneN/P.items.length*100:0)+"%";
  if(!P.items.length){pl.appendChild(el(`<li class="empty" style="padding:0">${PW.length&&!isOffDay()&&!CR.active?`Semana de prova (${PW.map(p=>p.name).join(", ")}): o conteúdo já foi estudado e revisado. Não entram temas novos da residência; use o tempo nas revisões dela e em questões.`:isOffDay()?`Hoje é seu dia de folga. O plano volta ${nextStudyLabel()}.`:!isNewDay()&&!CR.active&&dayMin(dnum(today()))===30?"Nenhum tema no plano hoje (dia curto).":!isNewDay()&&!CR.active?"Hoje não é dia de temas novos e não há pontos fracos nem conteúdo da faculdade para o plano. Aproveite para revisões e questões.":CR.active?"Todo o conteúdo das provas já foi estudado. Use as revisões de véspera e questões dos temas das provas.":"Tudo em dia. Nenhuma revisão vencida, nenhum ponto fraco e nenhum tema novo pendente."}</li>`));return}
  P.items.forEach((p,pi)=>{const it=BYKEY[p.k],L=subList(it),done=itemDone(p),editing=planEdit===p.k;
    const li=el(`<li class="pcard${done?" pdone":""}" data-k="${p.k}"><div class="ptop"><button class="ptitle" type="button"></button><span class="reason ${p.cls}"></span></div>
      <div class="pa"></div><div class="pbody"></div><div class="pacts"></div></li>`);
    const tb=li.querySelector(".ptitle"),pfr=p.cls==="r-pfr";tb.textContent=pfr?refLabel(p.ref)||it.t:it.t;tb.onclick=()=>openTopic(it.key);
    li.querySelector(".reason").textContent=done?(pfr?"Revisado":isIng(get(p.k))?"Parte concluída":"Concluído"):(p.cls==="r-new"&&!p.pt?"Tema novo":p.txt);if(done)li.querySelector(".reason").className="reason r-done";
    const pa=li.querySelector(".pa");pa.textContent=`${it.area.code}${it.sp?" · "+it.sp:""} · `;pa.appendChild(incEl(wOf(it),false));
    if(compact&&!editing){const rev=p.cls==="r-rev";let prog,started=false;
      if(p.cls==="r-weak"){const n=weakDone(p);started=n>0;prog=`${Math.min(n,WEAK_DAY_Q)} de ${WEAK_DAY_Q} questões`}
      else if(pfr){const PV=fac.provas.find(x=>x.id===p.pid);prog=`Revisão ${p.n||1} de ${FAC_RV_MAX}${PV?" · "+PV.name:""}`}
      else if(p.subs.length){const L2=subList(it),dn=p.subs.filter(t=>rev?(p.chk||[]).includes(t):(L2.find(y=>y.t===t)||{}).done).length;started=dn>0;prog=`${dn} de ${p.subs.length} subtópicos`}
      else prog=done?"feito":"tema inteiro";
      const ov=planOpen[p.k],open=ov&&ov.done===done?ov.v:(started&&!done);// ao concluir, volta ao automático (fecha)
      const sm=el(`<button class="psum" type="button" aria-expanded="${open}"><span class="psp"></span><span class="pst"></span><span class="pchev" aria-hidden="true"></span></button>`);
      sm.querySelector(".psp").textContent=prog;sm.querySelector(".pst").textContent=open?"":pfr?"anotação · erros · questões":p.subs.join(" · ");
      sm.onclick=()=>{planOpen[p.k]={v:!open,done};render()};if(!open)li.classList.add("pmini");li.querySelector(".pa").after(sm)}
    const body=li.querySelector(".pbody");
    if(p.prev&&BYKEY[p.prev.k]){const sw=el(`<p class="pswap"><span></span> <button class="link" type="button">Desfazer troca</button></p>`);
      sw.querySelector("span").textContent=`Entrou no lugar de “${BYKEY[p.prev.k].t}”, que volta a ser sugerido nos próximos dias.`;sw.querySelector("button").onclick=()=>undoSwap(p.k);body.appendChild(sw)}
    if(editing){
      body.appendChild(el(`<p class="plabel">Escolha os subtópicos de hoje (até 6):</p>`));
      const wrap=el(`<div class="pchoose"></div>`);
      L.forEach(x=>{const on=p.subs.includes(x.t);const b=el(`<button type="button" class="pick" aria-pressed="${on}"></button>`);b.textContent=(x.done?"✓ ":"")+x.t;
        b.onclick=()=>{if(on)p.subs=p.subs.filter(t=>t!==x.t);else if(p.subs.length<6)p.subs=[...p.subs,x.t];savePlan();render()};wrap.appendChild(b)});
      body.appendChild(wrap);
    }else if(pfr){const PV=fac.provas.find(x=>x.id===p.pid),a=refAcc(p.ref),T=refTopics(p.ref).filter(x=>BYKEY[x.k]);
      body.appendChild(el(`<p class="phint">Você já estudou este conteúdo. Releia a anotação, refaça os erros do caderno e faça algumas questões.</p>`));
      body.appendChild(el(`<p class="phint pfrnote">${a!==null?`Acerto até aqui: ${Math.round(a*100)}%. `:""}Não altera as revisões espaçadas.</p>`));
      if(T.length>1||(T.length&&T[0].own)){const w=el(`<p class="phint pfrt">Temas: </p>`);T.forEach((x,j)=>{const b=el(`<button class="link" type="button"></button>`);b.textContent=BYKEY[x.k].t;b.onclick=()=>openTopic(x.k);if(j)w.appendChild(document.createTextNode(" · "));w.appendChild(b)});body.appendChild(w)}
      if(PV){const rb=el(`<div class="pacts"></div>`);
        if(done){const u=el(`<button class="link" type="button">Desfazer “revisei”</button>`);u.onclick=()=>{provaRvMark(PV,p.ref,false);render()};rb.appendChild(u)}
        else{const g=el(`<button class="btn primary pfrdone" type="button">Revisei para a prova</button>`);g.onclick=()=>{provaRvMark(PV,p.ref,true);render()};rb.appendChild(g)}
        body.appendChild(rb)}
    }else if(p.cls==="r-weak"){
      const n=weakDone(p),[c0,t0]=[get(p.k).qc||0,get(p.k).qt||0];
      body.appendChild(el(`<p class="phint">Seu acerto neste tema está em ${pct(c0,t0)}% (${c0}/${t0}). Hoje: faça pelo menos ${WEAK_DAY_Q} questões${p.subs.length?", com foco em:":"."}</p>`));
      if(p.subs.length){const ul=el(`<ul class="wsubs"></ul>`);p.subs.forEach(t=>{const li=document.createElement("li");li.textContent=t;ul.appendChild(li)});body.appendChild(ul)}
      body.appendChild(el(`<div class="wprog"><div class="meter"><i style="width:${Math.min(100,n/WEAK_DAY_Q*100)}%"></i></div><span>${Math.min(n,WEAK_DAY_Q)} de ${WEAK_DAY_Q} questões hoje</span></div>`));
    }else if(p.subs.length){
      if(p.cls==="r-cont"&&(notes[p.k]||"").trim())body.appendChild(rereadEl(p.k));
      body.appendChild(el(`<p class="plabel">${p.cls==="r-rev"?"Revisar hoje":p.cls==="r-fac"?"Estudar para a prova":"Estudar hoje"}:</p>`));
      const ul=el(`<ul class="psubs"></ul>`);
      p.subs.forEach((t,n)=>{const x=L.find(y=>y.t===t);if(!x)return;const id=`ps-${p.k}-${n}`;
        const rev=p.cls==="r-rev",on=rev?(p.chk||[]).includes(t):x.done;
        const r=el(`<li><input type="checkbox" id="${id}"${on?" checked":""}><label for="${id}"></label></li>`);r.querySelector("label").textContent=t;
        r.querySelector("input").onchange=()=>{if(rev){const c=new Set(p.chk||[]);c.has(t)?c.delete(t):c.add(t);p.chk=[...c];savePlan();render()}
          else{const cur=subList(it).find(y=>y.t===t);if(cur)toggleSub(it,cur)}};ul.appendChild(r)});
      body.appendChild(ul);
      if(p.cls==="r-rev"&&!done){const allc=p.subs.every(t=>(p.chk||[]).includes(t));
        body.appendChild(el(`<p class="phint">${allc?"Subtópicos revisados. Como foi?":"Marque cada subtópico ao revisar e depois confirme como foi a revisão."}</p>`));
        body.appendChild(revBtns(p.k))}
    }else{body.appendChild(el(`<p class="phint">Este tema não tem subtópicos. Estude o tema inteiro${it.own?" ou crie subtópicos ao abrir o tema":""}.</p>`));
      if(!done){const sb=el(`<button class="btn primary" type="button" style="align-self:flex-start">Estudei hoje</button>`);
        sb.onclick=()=>{const first=!get(p.k).last;upd(p.k,x=>{x.last=today();if(first)x.step=0;x.l=Math.max(x.l||0,1)});logAct("e");p.subs=[];savePlan();commit()};body.appendChild(sb)}}
    const acts=li.querySelector(".pacts");
    if(!pfr){const ed=el(`<button class="mini" type="button">${editing?"Pronto":"Trocar subtópicos"}</button>`);ed.onclick=()=>{planEdit=editing?null:p.k;render()};acts.appendChild(ed)}
    if(!editing){
      if(pfr&&!sampleOff){const q=el(`<button class="mini" type="button">Gerar questões</button>`);q.onclick=()=>{openTopic(p.k);setTimeout(()=>{const g=detGet("qf-",p.k);if(g)g.scrollIntoView({behavior:"smooth",block:"center"})},350)};acts.appendChild(q)}
      if(p.subs.length&&!sampleOff){const q=el(`<button class="mini" type="button">Gerar questões</button>`);q.onclick=()=>{genFocus[p.k]="__hoje";openTopic(p.k);setTimeout(()=>{const g=detGet("qf-",p.k);if(g)g.scrollIntoView({behavior:"smooth",block:"center"})},350)};acts.appendChild(q)}
      if(p.cls==="r-eixo"&&!itemStarted(p)){const sw=el(`<button class="mini" type="button">Outro do eixo</button>`);sw.id="axSw-"+pi;sw.title="Trocar por outro tema da residência do mesmo eixo";sw.onclick=()=>axSwap(pi);acts.appendChild(sw)}
      const o=el(`<button class="mini" type="button">Abrir tema</button>`);o.onclick=()=>openTopic(p.k);acts.appendChild(o);
      const fz=el(`<button class="mini" type="button" title="Contar o tempo de estudo deste tema">⏱ Foco</button>`);fz.onclick=()=>foGo(p.k);acts.appendChild(fz)}
    pl.appendChild(li)});
  if(PW.length&&!CR.active&&P.items.length<dayCap(dnum(today()))){const due=ALL.filter(i=>isDue(get(i.key))).length;
    const n=el(`<li class="pweek"><p class="phint"></p></li>`);n.querySelector("p").textContent=`Semana de prova: não entram temas novos da residência.${due?` Use as vagas livres nas ${due} ${due===1?"revisão":"revisões"} da residência.`:""}`;
    if(due){const b=el(`<button class="link" type="button">Ir para as revisões</button>`);b.onclick=()=>goRevs();n.querySelector("p").appendChild(document.createTextNode(" "));n.querySelector("p").appendChild(b)}
    pl.appendChild(n)}
}
/* quando você começa um tema fora do plano, ele substitui um tema proposto ainda não iniciado */
function itemStarted(p){if(itemDone(p))return true;if(p.cls==="r-weak")return weakDone(p)>0;if(p.cls==="r-rev")return !!(p.chk&&p.chk.length)||get(p.k).last===today();
  const L=subList(BYKEY[p.k]);return p.cls==="r-own"||p.subs.some(t=>{const x=L.find(y=>y.t===t);return x&&x.done})}
function adoptTopic(k,sub){
  const P=ensurePlan();if(P.items.some(x=>x.k===k))return;
  const it=BYKEY[k],L=subList(it);
  const ps=get(k).last?pickSubs(it,"r-new"):partSubs(it).subs;
  const subs=sub?[sub,...ps.filter(t=>t!==sub)].slice(0,Math.max(ps.length,1)):ps;
  const item={k,cls:"r-own",txt:"Você iniciou",subs};
  let idx=-1;for(const cls of ["r-new","r-eixo","r-weak"]){for(let i=P.items.length-1;i>=0;i--){const x=P.items[i];if(x.cls===cls&&!itemStarted(x)){idx=i;break}}if(idx>=0)break}
  if(idx>=0){const old={...P.items[idx]};delete old.prev;item.prev=old;P.items[idx]=item}else P.items.push(item);
  savePlan();
}
function undoSwap(k){const P=ensurePlan(),i=P.items.findIndex(x=>x.k===k);if(i<0||!P.items[i].prev)return;P.items[i]=P.items[i].prev;savePlan();render()}
/* seção Revisões: tudo o que já foi estudado e está com revisão vencida, independente do plano do dia */
let revMore=false, revUpOpen=false;
function todaySubs(it){const ps=planSubs(it);if(ps.length)return ps;return isDue(get(it.key))?pickSubs(it,"r-rev"):[]}
function rchk(k){ensurePlan();const r=dayPlan.rchk||(dayPlan.rchk={});return r[k]||(r[k]=[])}
let revOpen={},revOpenD="";
function renderRevs(){
  if(revOpenD!==today()){revOpen={};revOpenD=today()}
  renderVesp();
  const CRv=examCrunch(),allDue=[...ALL,...FAC_ITEMS].filter(i=>isDue(get(i.key))),paused=CRv.active?allDue.filter(i=>!i.own):[],POOL=[...ALL,...FAC_ITEMS],due=allDue.filter(i=>!paused.includes(i)).sort(revPri);
  const late=due.filter(i=>dueIn(get(i.key))<0).length;
  const t=dnum(today()),up=POOL.filter(i=>{const d=dueIn(get(i.key));return d!==null&&d>0&&d<=7}).sort((a,b)=>dueIn(get(a.key))-dueIn(get(b.key)));
  const QC=qCounts();$("#revmeta").textContent=due.length?`${due.length} ${due.length===1?"pendente":"pendentes"}${QC.revs<due.length?` · cabem hoje ${QC.revs}`:late?` · ${late} ${late===1?"atrasada":"atrasadas"}`:""}`:"em dia";
  $("#revmeta").className="revmeta"+(late?" late":"");
  const list=$("#revlist");list.innerHTML="";const FL=facLinkMap();
  if(!due.length)list.appendChild(el(`<li class="empty" style="padding:0">${ALL.some(i=>get(i.key).last)?"Nenhuma revisão pendente hoje.":"Quando você marcar \"Estudei hoje\" em um tema, a primeira revisão é agendada para o dia seguinte e aparece aqui."}</li>`));
  const shown=revMore?due:due.slice(0,4);
  shown.forEach(it=>{const s=get(it.key),d=dueIn(s),subs=pickSubs(it,"r-rev"),chk=rchk(it.key),L=subList(it);
    const li=el(`<li class="pcard rcard" data-k="${it.key}"><div class="ptop"><button class="ptitle" type="button"></button><span class="reason r-rev"></span></div><div class="pa"></div><div class="pbody"></div></li>`);
    const tb=li.querySelector(".ptitle");tb.textContent=it.t;tb.onclick=()=>openTopic(it.key);
    li.querySelector(".reason").textContent=dueLabel(d);
    const pa=li.querySelector(".pa");pa.textContent=`${it.area===FAC_AREA?"Faculdade":it.area.code}${it.sp?" · "+it.sp:""} · último estudo ${br(s.last)} · intervalo ${interval(s)} ${interval(s)===1?"dia":"dias"} · `;if(it.own){pa.prepend(el(`<span class="facchip">FAC</span>`))}else{pa.appendChild(incEl(wOf(it),false));const L0=FL[it.key];if(L0){const x=el(`<span class="fbadge"></span>`);x.textContent=`FAC · ${L0.s?spShort(L0.s.name):L0.d.name}`;x.title=L0.d.name+(L0.s?" · "+L0.s.name:"");pa.appendChild(x)}}
    {const started=chk.length>0,ov=revOpen[it.key],open=ov?ov.v:started;
      const sm=el(`<button class="psum" type="button" aria-expanded="${open}"><span class="psp"></span><span class="pst"></span><span class="pchev" aria-hidden="true"></span></button>`);
      sm.querySelector(".psp").textContent=subs.length?`${chk.filter(t=>subs.includes(t)).length} de ${subs.length} subtópicos`:"tema inteiro";sm.querySelector(".pst").textContent=open?"":subs.join(" · ");
      sm.onclick=()=>{revOpen[it.key]={v:!open};render()};if(!open)li.classList.add("pmini");li.querySelector(".pa").after(sm)}
    const body=li.querySelector(".pbody");
    if(subs.length){body.appendChild(el(`<p class="plabel">Revisar:</p>`));const ul=el(`<ul class="psubs"></ul>`);
      subs.forEach((t,n)=>{const id=`rv-${it.key}-${n}`,on=chk.includes(t);const r=el(`<li><input type="checkbox" id="${id}"${on?" checked":""}><label for="${id}"></label></li>`);r.querySelector("label").textContent=t;
        r.querySelector("input").onchange=()=>{const c=new Set(rchk(it.key));c.has(t)?c.delete(t):c.add(t);dayPlan.rchk[it.key]=[...c];savePlan();render()};ul.appendChild(r)});
      body.appendChild(ul);
      const rest=L.filter(x=>x.done).length-subs.length;if(rest>0)body.appendChild(el(`<p class="phint">Os outros ${rest} subtópicos já estudados entram nas próximas revisões, em rodízio.</p>`))}
    else body.appendChild(el(`<p class="phint">Nenhum subtópico marcado neste tema: revise o tema como um todo.</p>`));
    body.appendChild(rereadEl(it.key));
    body.appendChild(el(`<p class="phint">Como foi? Cada botão mostra quando a revisão volta.</p>`));
    body.appendChild(revBtns(it.key));const acts=el(`<div class="pacts"></div>`);
    if(!sampleOff){const q=el(`<button class="mini" type="button">Gerar questões</button>`);q.onclick=()=>{genFocus[it.key]="__hoje";openTopic(it.key);setTimeout(()=>{const x=detGet("qf-",it.key);if(x)x.scrollIntoView({behavior:"smooth",block:"center"})},350)};acts.appendChild(q)}
    {const fz=el(`<button class="mini" type="button" title="Contar o tempo de revisão deste tema">⏱ Foco</button>`);fz.onclick=()=>foGo(it.key);acts.appendChild(fz)}
    body.appendChild(acts);
    const ne=el(`<button class="link" type="button"></button>`),armed=revArm===it.key;ne.textContent=armed?"Toque de novo: tira das revisões e volta para não iniciado (questões e anotações ficam)":"Não estudei este tema";if(armed)ne.classList.add("warn");
    ne.onclick=()=>{if(armed)resetStudy(it.key);else{revArm=it.key;render()}};body.appendChild(ne);
    list.appendChild(li)});
  if(due.length>4){const m=el(`<li><button class="link" type="button">${revMore?"Mostrar menos":`Mostrar todas as ${due.length} revisões`}</button></li>`);m.querySelector("button").onclick=()=>{revMore=!revMore;render()};list.appendChild(m)}
  if(paused.length){paused.sort((a,b)=>dueIn(get(a.key))-dueIn(get(b.key)));
    const det=el(`<li><details class="plain"><summary>Revisões da residência pausadas até ${br(CRv.until)} · ${paused.length}</summary><ul class="uplist"></ul></details></li>`);
    paused.forEach(it=>{const li=el(`<li><span class="ud"></span><button class="link" type="button"></button></li>`);li.querySelector(".ud").textContent=dueLabel(dueIn(get(it.key)));
      const b=li.querySelector("button");b.textContent=it.t;b.onclick=()=>openTopic(it.key);det.querySelector("ul").appendChild(li)});
    list.appendChild(det)}
  // revisadas hoje
  const rt=(ensurePlan().revd||[]).filter(k=>BYKEY[k]);
  $("#revdone").hidden=!rt.length;
  if(rt.length){$("#revdone").innerHTML="";$("#revdone").appendChild(el(`<span class="plabel">Revisadas hoje · ${rt.length}</span>`));
    const w=el(`<div class="rtags"></div>`);rt.forEach(k=>{const b=el(`<button class="rtag" type="button"></button>`),ar=get(k).ar;b.textContent="✓ "+BYKEY[k].t+(ar&&ar.d===today()?` · questões ${ar.a}%`:"");b.onclick=()=>openTopic(k);w.appendChild(b)});$("#revdone").appendChild(w)}
  // próximas
  const ub=$("#revup");ub.innerHTML="";
  if(up.length){const det=el(`<details class="plain revup"${revUpOpen?" open":""}><summary>Próximas revisões nos próximos 7 dias · ${up.length}</summary><ul class="uplist"></ul></details>`);
    det.addEventListener("toggle",()=>revUpOpen=det.open);
    const byDay={};up.forEach(it=>{const d=fromNum(dnum(get(it.key).last)+interval(get(it.key)));(byDay[d]||(byDay[d]=[])).push(it)});
    Object.keys(byDay).sort().forEach(d=>{const dt=new Date(d+"T12:00:00");const li=el(`<li><span class="ud"></span><span class="un"></span></li>`);
      li.querySelector(".ud").textContent=dt.toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit",month:"2-digit"});
      li.querySelector(".un").textContent=byDay[d].map(i=>i.t).join(" · ");det.querySelector("ul").appendChild(li)});
    ub.appendChild(det)}
}
/* revisão de véspera: nos últimos dias antes da prova, o conteúdo já estudado volta para uma passada rápida */
function renderVesp(){const box=$("#revVesp");box.innerHTML="";
  const ps=upcomingProvas().filter(p=>daysTo(p.date)<=FAC_VESP);if(!ps.length)return;
  ensurePlan();const V=dayPlan.vesp||(dayPlan.vesp={});
  ps.forEach(p=>{const d=discOf(p.discId),all=p.items.filter(refOk),items=all.filter(r=>itemStudied(p,r)),pend=all.length-items.length;if(!all.length)return;const chk=V[p.id]||[];
    const c=el(`<div class="pcard vcard"><div class="ptop"><span class="ptitle"></span><span class="reason r-fac"></span></div><p class="phint"></p><ul class="psubs"></ul></div>`);
    c.querySelector(".ptitle").textContent=`Véspera: ${p.name}`;c.querySelector(".reason").textContent=inLabel(daysTo(p.date));
    c.querySelector(".phint").textContent=items.length?`${provaDiscName(p)} · ${chk.filter(r=>items.includes(r)).length} de ${items.length} revisados hoje. Passada rápida no que você já estudou: anotações, erros do caderno e algumas questões. Não altera o agendamento das revisões espaçadas.`:`${provaDiscName(p)} · você ainda não estudou nenhum conteúdo desta prova.`;
    if(pend){const pn=el(`<p class="phint"></p>`);pn.textContent=`${pend} conteúdo${pend>1?"s":""} ainda não estudado${pend>1?"s":""}: ${pend>1?"ficam":"fica"} no Estudar hoje, não aqui.`;c.insertBefore(pn,c.querySelector("ul"))}
    items.forEach((r,n)=>{const id=`vp-${p.id}-${n}`,on=chk.includes(r)||provaRv(p,r).includes(today()),x=refTopic(r);
      const li=el(`<li><input type="checkbox" id="${id}"${on?" checked":""}><label for="${id}"></label><button class="link" type="button">abrir</button></li>`);
      li.querySelector("label").textContent=refLabel(r);
      li.querySelector("input").onchange=e=>{provaRvMark(p,r,e.target.checked);render()};
      li.querySelector("button").onclick=()=>openTopic(x.k);c.querySelector("ul").appendChild(li)});
    box.appendChild(c)})}
function markReviewed(k){ensurePlan();const r=new Set(dayPlan.revd||[]);r.add(k);dayPlan.revd=[...r];if(dayPlan.rchk)delete dayPlan.rchk[k];savePlan()}

let planNote="";
/* prova cadastrada/alterada para os próximos 7 dias: o plano de hoje se refaz sozinho (mantém o que já foi iniciado) */
const AUTO_REDO_DAYS=7;
function provaChanged(p,what){const d=daysTo(p.date);if(d<0||d>AUTO_REDO_DAYS){render();return}
  const before=dayPlan&&dayPlan.d===today()?dayPlan.items.map(x=>x.k).join():"";redoPlan();
  const after=dayPlan.items.map(x=>x.k).join();
  planNote=before!==after?`Plano de hoje atualizado: ${what} “${p.name}” (${inLabel(d)}). O que você já tinha começado foi mantido.`:"";render()}
function redoPlan(note){planNote=typeof note==="string"?note:"";const keep=(dayPlan&&dayPlan.d===today()?dayPlan.items:[]).filter(x=>BYKEY[x.k]&&itemStarted(x)).map(x=>{const y={...x};delete y.prev;return y});const fresh=makeDayPlan();
  const old=dayPlan&&dayPlan.d===today()?dayPlan:{};
  dayPlan={d:today(),items:[...keep,...fresh.items.filter(x=>!keep.some(k=>k.k===x.k))].slice(0,Math.max(dayCap(dnum(today())),keep.length+1)),revd:old.revd||[],rchk:old.rchk||{},vesp:old.vesp||{}};planTouched=true;planEdit=null;savePlan();render()}

/* ===================== FACULDADE =====================
   fac = {sems:[{id,name,archived}], discs:[{id,semId,name,items:[ref]}], provas:[{id,discId,name,date,items:[ref],done:[ref]}], own:{id:{t,discId}}}
   ref: "T:CM-6" tema da residência · "S:CM-6:<subtópico>" subtópico · "O:<id>" tema próprio (chave de progresso "F-<id>") */
let FAC_WIN=21, RES_MIN_WEEK=2;const LSF="resid-fac-v1", FAC_VESP=3, FAC_AREA={code:"FAC",name:"Faculdade",specs:[]};
let fac={sems:[],discs:[],provas:[],own:{}}, facStore=null, facTimer=null, facSel=null, facShowArch=false, facOpenDisc=new Set(), facQuery={}, facProvaOpen=new Set(), facProvaAll=new Set(), facArm=null, facNew={}, facReplace=null, facLinkSt=null, facOpenSP=new Set(), facDetOpen=new Set(), facEdit=null, facEditDisc=new Set(), facClosedEixo=new Set(), facSemMenu=false, facShowPast=new Set(), facOpenSem=new Set(), facOpenProv=new Set(), facSemAdj=null, facAddC=null, facNewDiscFor=null, facDraft={}, facFocus=false, facMapCustom=null, facImport={status:"closed",text:"",prop:null,msg:"",done:""}, facSynced=false, facTouched=false;
const FAC_ITEMS=[];
const fuid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const discOf=id=>fac.discs.find(d=>d.id===id), semOf=id=>fac.sems.find(s=>s.id===id);
function registerOwn(){facNormalize();FAC_ITEMS.forEach(it=>delete BYKEY[it.key]);FAC_ITEMS.length=0;
  for(const id in fac.own){const o=fac.own[id];if(ownLinks(id).length)continue;const P=ownPlace(o);
    const it={key:"F-"+id,num:0,t:o.t,area:P.A||FAC_AREA,sp:P.spec,subs:[],w0:1,own:true,origin:P.origin,originFull:P.originFull};FAC_ITEMS.push(it);BYKEY[it.key]=it}}
function facValid(x){return x&&Array.isArray(x.sems)&&Array.isArray(x.discs)&&Array.isArray(x.provas)&&x.own&&typeof x.own==="object"}
function saveFac(){facTouched=true;registerOwn();try{localStorage.setItem(LSF,JSON.stringify(fac))}catch(e){}
  if(!facStore)return;clearTimeout(facTimer);facTimer=setTimeout(async()=>{facTimer=0;try{liveW.fac=stab(fac);await facStore.set({...fac,updatedAt:new Date().toISOString()})}catch(e){setSave("Não foi possível salvar a Faculdade na conta; ficou salva neste navegador")}},700)}
function refTopic(r){if(!r)return null;if(r.startsWith("T:"))return {k:r.slice(2)};if(r.startsWith("O:")){const id=r.slice(2),Ls=ownLinks(id);return Ls.length?{k:Ls[0].k,own:id,subs:Ls[0].subs,links:Ls}:{k:"F-"+id}}
  if(r.startsWith("S:")){const i=r.indexOf(":",2);return {k:r.slice(2,i),sub:r.slice(i+1)}}return null}
function refOk(r){const x=refTopic(r);return !!(x&&BYKEY[x.k])}
/* todos os temas de um conteúdo: o próprio, ou cada tema da residência ligado a ele (o 1º é o principal) */
function refTopics(r){const x=refTopic(r);if(!x)return [];return x.links?x.links.map(L=>({k:L.k,own:x.own,subs:L.subs})):[x]}
function refLabel(r){const x=refTopic(r),it=x&&BYKEY[x.k];if(!it)return "";return x.own?fac.own[x.own].t:x.sub?x.sub:it.t}
function refKind(r){return r.startsWith("O:")?"Próprio":r.startsWith("S:")?"Subtópico":"Residência"}
function activeSems(){return fac.sems.filter(s=>!s.archived).map(s=>s.id)}
function upcomingProvas(){const t=today(),act=new Set(activeSems());
  return fac.provas.filter(p=>{const d=discOf(p.discId);return d&&!p.adi&&act.has(d.semId)&&p.date>=t}).sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0)}
function itemStudied(p,r){if((p.done||[]).includes(r))return true;const T=refTopics(r);if(!T.length)return true;return T.every(x=>topicStudied(p,x))}
/* um tema (ou os subtópicos ligados dele) estudado na janela da prova */
function topicStudied(p,x){if(!BYKEY[x.k])return true;const s=get(x.k),start=fromNum(dnum(p.date)-(p.win||FAC_WIN));
  if(!(s.last&&s.last>=start))return false;const subs=x.subs&&x.subs.length?x.subs:x.sub?[x.sub]:[];
  if(subs.length){const L=subList(BYKEY[x.k]);return subs.every(t=>{const sb=L.find(y=>y.t===t);return !sb||sb.done})}return true}
/* ligado a vários temas: quais ainda faltam para esta prova */
const refMissing=(p,r)=>refTopics(r).filter(x=>!topicStudied(p,x));
function provaPending(p){return p.items.filter(r=>refOk(r)&&!itemStudied(p,r))}
/* prova de uma ou várias disciplinas (prova conjunta): discId = a principal; discIds = todas, só quando há mais de uma.
   sps = SPs ligadas à prova: o que entrar nelas depois entra na prova também (facLinkSync, em saveFac). */
function provaDids(p){const a=Array.isArray(p.discIds)?p.discIds.filter(id=>typeof id==="string"):[];if(p.discId&&!a.includes(p.discId))a.unshift(p.discId);return [...new Set(a)]}
const provaHas=(p,id)=>provaDids(p).includes(id);
const provaDiscs=p=>provaDids(p).map(discOf).filter(Boolean);
const provaDiscName=p=>provaDiscs(p).map(d=>d.name).join(" + ");
const provaSps=p=>Array.isArray(p.sps)?p.sps:[];
function provaSetDids(p,ids){ids=[...new Set(ids)];p.discId=ids[0];if(ids.length>1)p.discIds=ids;else delete p.discIds}
function facLinkSync(){fac.provas.forEach(p=>{if(!Array.isArray(p.items))p.items=[];if(p.discIds!==undefined)provaSetDids(p,provaDids(p));
  if(p.sps===undefined)return;const ds=provaDiscs(p),ok=[];
  provaSps(p).forEach(id=>{if(typeof id!=="string")return;for(const d of ds){const s=d.sps.find(x=>x.id===id);if(s){ok.push(id);s.items.forEach(r=>{if(!p.items.includes(r))p.items.push(r)});break}}});
  if(ok.length)p.sps=[...new Set(ok)];else delete p.sps})}
/* em outra prova? (para não repetir o conteúdo da D2 na D3) */
const refElse=(p,r)=>fac.provas.filter(x=>x.id!==p.id&&x.items.includes(r));
function spElse(p,s){const refs=s.items.filter(refOk);return fac.provas.filter(x=>x.id!==p.id&&(provaSps(x).includes(s.id)||(refs.length&&refs.every(r=>x.items.includes(r)))))}
function spInProva(p,s){const refs=s.items.filter(refOk);return provaSps(p).includes(s.id)||(!!refs.length&&refs.every(r=>p.items.includes(r)))}
function provaSetSp(p,s,on){const ids=new Set(provaSps(p));
  if(on){ids.add(s.id);s.items.forEach(r=>{if(!p.items.includes(r))p.items.push(r)})}
  else{ids.delete(s.id);const keep=new Set(provaDiscs(p).flatMap(d=>d.sps.filter(x=>x!==s&&ids.has(x.id)).flatMap(x=>x.items)));p.items=p.items.filter(r=>!s.items.includes(r)||keep.has(r))}
  if(ids.size)p.sps=[...ids];else delete p.sps}
/* conteúdo de uma disciplina que ainda não está em nenhuma prova (para começar uma prova nova) */
function unassigned(d,p){const refs=[],sps=[];d.sps.forEach(s=>{if(s.items.some(refOk)&&!spElse(p,s).length){sps.push(s.id);s.items.filter(refOk).forEach(r=>refs.push(r))}});
  d.items.filter(refOk).forEach(r=>{if(!refElse(p,r).length)refs.push(r)});return {refs:[...new Set(refs)],sps}}
/* provas em que um conteúdo novo pode entrar: as que incluem a disciplina e ainda não passaram */
const discProvas=d=>fac.provas.filter(p=>provaHas(p,d.id)&&p.date>=today()).sort(byDate);
function daysTo(date){return dnum(date)-dnum(today())}
function inLabel(d){return d===0?"hoje":d===1?"amanhã":`em ${d} dias`}

