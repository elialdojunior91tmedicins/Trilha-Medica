/* aba Questões */
const QCH_FEW=10;let qChSort=(()=>{try{return localStorage.getItem("resid-qchsort")==="gain"?"gain":"acc"}catch(e){return "acc"}})();
let qWorse=false,qFOpen=(()=>{try{return (document.documentElement.dataset.layout!=="phone"||window.__noSheet)&&localStorage.getItem("resid-qfpanel")==="1"}catch(e){return false}})(), qArea="all", qSort="num", qWeak=false, qSpec="all", qDisc="all", qQuery="", qPer="all", qAcc="all", qInc=false, qErrF=false, qDueF=false, qChartBy="spec", qMore=false;
function aggr(items){let c=0,t=0;items.forEach(i=>{const s=get(i.key);c+=s.qc||0;t+=s.qt||0});return [c,t]}
/* questões de um tema no período escolhido na aba Questões */
const qFrom=()=>qPer==="all"?null:fromNum(dnum(today())-(+qPer)+1);
function qOf(k,from){if(!from){const s=get(k);return [s.qc||0,s.qt||0]}const r=qPeriod([k],from);return [r.c,r.q]}
function qUniverse(){// temas da residência + conteúdos da faculdade, com os filtros (menos período e acerto)
  const n=norm(qQuery.trim()),errK=new Set(errors.map(e=>e.k));
  let pool=[...ALL,...FAC_ITEMS];
  if(qArea!=="all")pool=pool.filter(i=>i.area.code===qArea);
  if(qSpec!=="all")pool=pool.filter(i=>i.sp===qSpec);
  if(qDisc!=="all"){const d=discOf(qDisc),ks=new Set(d?topicKeysOf(discRefs(d)):[]);pool=pool.filter(i=>ks.has(i.key))}
  if(n)pool=pool.filter(i=>norm(i.t+" "+(i.sp||"")+" "+i.area.name+" "+subList(i).map(x=>x.t).join(" ")).includes(n));
  if(qInc)pool=pool.filter(i=>!i.own&&wOf(i)===3);
  if(qErrF)pool=pool.filter(i=>errK.has(i.key));
  if(qDueF)pool=pool.filter(i=>isDue(get(i.key)));
  if(qWorse)pool=pool.filter(i=>{const tr=qTrend(i.key);return tr&&tr.d<=-5});
  return pool}
const accBand=(c,t)=>!t?null:c/t<WEAK_PCT?"bad":c/t<0.8?"mid":"good";
function qClearAll(){qArea="all";qSpec="all";qDisc="all";qQuery="";qPer="all";qAcc="all";qWeak=false;qInc=false;qErrF=false;qDueF=false;qWorse=false}
let qListKeep=null,qListAll=false;const QLIST_TOP=10;
const qFiltOn=()=>!!(qArea!=="all"||qDisc!=="all"||qQuery||qPer!=="all"||qAcc!=="all"||qInc||qErrF||qDueF||qWorse||qOpenK&&false);
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
/* ----- registro rápido de questões feitas fora (bancos, provas antigas) ----- */
function qRegPanel(){const R=qReg,w=el(`<div class="qreg" id="qReg"><div class="dhead"><b>Registrar questões</b><button class="link" type="button">Fechar</button></div></div>`);
  w.querySelector(".dhead .link").onclick=()=>{qReg=null;render()};
  if(R.saved){const S=R.saved,it=BYKEY[S.k],m=el(`<p class="pnote" role="status"><span></span> <button class="link" type="button">Desfazer</button></p>`);
    m.querySelector("span").textContent=`Registrado: ${S.t} questões, ${S.c} acertos (${pct(S.c,S.t)}%) em ${it?it.t:""}${S.d!==today()?` · ${br(S.d)}`:""}${S.src?` · ${S.src}`:""}${S.mn?` · ${fmtPace(S.mn*60/S.t)} por questão`:""}.`;
    m.querySelector("button").onclick=()=>{upd(S.k,x=>addQ(x,-S.t,-S.c,S.d,S.src));if(S.mn)logPace(S.d,-S.t,-S.mn*60);logAct("q",-S.t,-S.c,S.d);commit();R.saved=null;R.msg="Registro desfeito.";render()};w.appendChild(m);
    if(S.t>S.c){const e=el(`<button class="btn" type="button">Registrar um erro deste tema no caderno</button>`);e.onclick=()=>{const k=S.k;qReg=null;openTopic(k);setTimeout(()=>{const f=detGet("ew-",k);if(f){f.scrollIntoView({behavior:"smooth",block:"center"});f.focus({preventScroll:true})}},350)};w.appendChild(e)}}
  const it=R.k&&BYKEY[R.k];
  if(!it){const s=el(`<label class="qfsel"><span>Tema</span><input class="search" id="qrq" type="search" placeholder="Digite o tema (ex.: sepse, IAM, pré-eclâmpsia)" autocomplete="off"></label>`),i=s.querySelector("input");i.value=R.query||"";
    i.oninput=debounced(()=>{if(qReg!==R||R.k)return;R.query=i.value;render()});w.appendChild(s);
    const n=norm((R.query||"").trim());if(n.length>=2){const res=[...ALL,...FAC_ITEMS].map(x=>{const t=norm(x.t),sub=norm(subList(x).map(y=>y.t).join(" ")+" "+(x.sp||""));return {x,sc:t.startsWith(n)?3:t.includes(n)?2:sub.includes(n)?1:0}}).filter(r=>r.sc).sort((a,b)=>b.sc-a.sc||a.x.num-b.x.num).slice(0,7);
      const ul=el(`<ul class="qrres"></ul>`);if(!res.length)ul.appendChild(el(`<li class="how">Nenhum tema com esse nome.</li>`));
      res.forEach(({x})=>{const li=el(`<li><button type="button" class="qrpick"><b></b><span></span></button></li>`);li.querySelector("b").textContent=x.t;li.querySelector("span").textContent=`${x.own?"FAC":x.area.code} · ${x.sp||x.area.name}`;li.querySelector("button").onclick=()=>{R.k=x.key;R.msg="";render();setTimeout(()=>{const f=$("#qrt");if(f)f.focus()},30)};ul.appendChild(li)});w.appendChild(ul)}
    else w.appendChild(el(`<p class="how hx">Para questões de bancos (Medcel, Estratégia, MedCof…) ou provas antigas: escolha o tema e digite quantas fez e acertou.</p>`))}
  else{const ch=el(`<p class="qrsel"><b></b><span></span><button class="link" type="button">trocar tema</button></p>`);ch.querySelector("b").textContent=it.t;ch.querySelector("span").textContent=` · ${it.own?"FAC":it.area.code} · ${it.sp||it.area.name}`;
    ch.querySelector("button").onclick=()=>{R.k=null;render()};w.appendChild(ch);
    const f=el(`<div class="focus-form qrform"><label class="qfsel"><span>Feitas</span><input type="number" id="qrt" min="1" max="500" inputmode="numeric"></label><label class="qfsel"><span>Acertos</span><input type="number" id="qrc" min="0" max="500" inputmode="numeric"></label><label class="qfsel"><span>Dia</span><input type="date" id="qrd"></label><label class="qfsel"><span>Tempo (min)</span><input type="number" id="qrm" min="1" max="600" inputmode="numeric" placeholder="opcional"></label><label class="qfsel qrsrc"><span>Banca ou fonte</span><input type="text" id="qrb" list="qrbl" maxlength="30" placeholder="opcional (ex.: ENARE)" autocomplete="off"><datalist id="qrbl"></datalist></label><button class="btn primary" type="button" id="qrSave">Salvar</button></div>`);
    {const bi=f.querySelector("#qrb"),dl=f.querySelector("#qrbl");[...new Set([...qSrcAll(),...QSRC_SUG])].filter(x=>x!=="Claude").forEach(v=>{const o=document.createElement("option");o.value=v;dl.appendChild(o)});
      let last="";try{last=localStorage.getItem("resid-qsrc")||""}catch(e){}bi.value=R.b!==undefined?R.b:last;bi.oninput=()=>{R.b=bi.value}}
    const ti=f.querySelector("#qrt"),ci=f.querySelector("#qrc"),di=f.querySelector("#qrd");ti.value=R.t||"";ci.value=R.c||"";di.value=R.d||today();di.max=today();
    ti.oninput=()=>{R.t=ti.value};ci.oninput=()=>{R.c=ci.value};di.oninput=()=>{R.d=di.value};
    f.querySelector("#qrSave").onclick=()=>{const t=Math.round(+ti.value),c=Math.round(+ci.value),d=di.value||today();
      if(!(t>=1&&t<=500)){R.msg="Digite quantas questões fez (1 a 500).";render();return}if(!(c>=0&&c<=t)||ci.value===""){R.msg="Os acertos vão de 0 até o número de questões feitas.";render();return}
      if(!/^\d{4}-\d{2}-\d{2}$/.test(d)||d>today()){R.msg="Escolha um dia até hoje.";render();return}
      const src=qSrcKey(f.querySelector("#qrb").value);try{localStorage.setItem("resid-qsrc",src)}catch(e){}
      const mn=Math.round(+f.querySelector("#qrm").value)||0;if(f.querySelector("#qrm").value&&!(mn>=1&&mn<=600)){R.msg="Tempo de 1 a 600 minutos (ou deixe vazio).";render();return}
      upd(it.key,x=>addQ(x,t,c,d,src));logAct("q",t,c,d);if(mn)logPace(d,t,mn*60);commit();qReg={saved:{k:it.key,t,c,d,src,mn},d,query:""};render();setTimeout(()=>{const q=$("#qrq");if(q)q.focus()},30)};
    w.appendChild(f)}
  if(R.msg){const m=el(`<p class="err" role="alert"></p>`);m.textContent=R.msg;w.appendChild(m)}
  return w}
/* ----- onde ganhar pontos: incidência na prova × o quanto falta para 80% de acerto ----- */
/* "onde focar" (Lote 17): uma conta só para o simulado, o gráfico por especialidade e as Estatísticas.
   Peso² × distância de 80% no acerto estimado ((acertos+3)/(questões+5): poucos dados puxam para ~60%). Tema estudado sem questões conta como 60%; tema nunca visto não entra. */
function focusScore(it){const s=get(it.key);if(it.own||!(s.qt||s.last||s.l>0))return 0;// tema nunca estudado nem praticado é assunto do plano (tema novo), não de "onde focar"
  const w=wOf(it),est=((s.qc||0)+3)/((s.qt||0)+5);return w*w*Math.max(0,0.8-est)}
function focusRank(U){return (U||ALL).filter(i=>!i.own).map(it=>({it,sc:focusScore(it)})).filter(r=>r.sc>0).sort((a,b)=>b.sc-a.sc||wOf(b.it)-wOf(a.it)||a.it.num-b.it.num).map(r=>r.it)}
function qGainCard(U){const rows=U.filter(i=>!i.own).map(it=>{const s=get(it.key),w=wOf(it),qt=s.qt||0,qc=s.qc||0,est=(qc+3)/(qt+5);return {it,w,qt,qc,est,sc:w*w*Math.max(0,0.8-est)}}).filter(r=>r.sc>0).sort((a,b)=>b.sc-a.sc||b.w-a.w||a.it.num-b.it.num);
  const c=el(`<section class="card qgain" aria-labelledby="qgh"><div class="dhead"><h2 id="qgh">Onde ganhar pontos</h2></div></section>`);
  if(!rows.length){c.appendChild(el(`<p class="cempty">${U.some(i=>!i.own)?"Todos os temas deste filtro estão com 80% ou mais de acerto. Mantenha as revisões.":"Escolha temas da residência nos filtros para ver as prioridades."}</p>`));return c}
  c.appendChild(el(`<p class="how hx">Temas que mais caem na prova e onde o seu acerto está mais longe de 80%. Temas sem questões contam como 60% até você fazer algumas.</p>`));
  const ol=el(`<ol class="qglist"></ol>`),sh=rows.slice(0,qGainMore?20:6);
  sh.forEach((r,i)=>{const it=r.it,p=r.qt?pct(r.qc,r.qt):null,[bk]=p===null?["warn"]:band(p);
    const li=el(`<li><span class="qgn">${i+1}</span><span class="qgm"><button class="qgt" type="button"></button><span class="qgs"></span></span><span class="qga"></span></li>`);
    const tb=li.querySelector(".qgt");tb.textContent=it.t;tb.onclick=()=>openTopic(it.key);
    const sm=li.querySelector(".qgs");sm.textContent=`${it.area.code} · ${it.sp} · `;sm.appendChild(incEl(r.w,true));
    li.querySelector(".qga").innerHTML=p===null?`<b class="qgp none">sem questões</b>`:`<b class="qgp"><span class="st ${bk}">${p}%</span></b><span>${r.qc}/${r.qt}</span>`;
    const acts=el(`<span class="qgb"></span>`);
    const rg=el(`<button class="mini" type="button">Registrar</button>`);rg.onclick=()=>{qReg={k:it.key,d:today()};render();const f=$("#qReg");if(f)f.scrollIntoView({behavior:"smooth",block:"center"})};acts.appendChild(rg);
    if(!sampleOff){const g=el(`<button class="mini" type="button">Gerar questões</button>`);g.onclick=()=>{openTopic(it.key);setTimeout(()=>{const x=detGet("qf-",it.key);if(x)x.scrollIntoView({behavior:"smooth",block:"center"})},350)};acts.appendChild(g)}
    li.appendChild(acts);ol.appendChild(li)});
  c.appendChild(ol);
  if(rows.length>6){const m=el(`<button class="link" type="button">${qGainMore?"Mostrar menos":`Mostrar mais ${Math.min(rows.length,20)-6}`}</button>`);m.onclick=()=>{qGainMore=!qGainMore;render()};c.appendChild(m)}
  return c}
/* ----- evolução semanal: questões por semana (barras) e acerto (linha) ----- */
function qEvoSvg(U,width){const N=12,t=dnum(today()),ws=t-(new Date().getDay()+6)%7,start=ws-7*(N-1),W=[...Array(N)].map((_,i)=>({s:start+7*i,q:0,c:0}));
  let est=0;U.forEach(it=>{const s=get(it.key);if(s.qe&&dnum(s.qe.d)>=start)est+=s.qe.q||0;for(const d in s.qd||{}){const v=s.qd[d];if(!Array.isArray(v))continue;const n=dnum(d);if(n<start||n>t)continue;const w=W[Math.floor((n-start)/7)];if(w){w.q+=v[0]||0;w.c+=v[1]||0}}});
  const tot=W.reduce((a,w)=>a+w.q,0);if(!tot)return {html:`<p class="cempty">Sem questões nas últimas ${N} semanas${U.length<ALL.length+FAC_ITEMS.length?" neste filtro":""}.</p>`,tot};
  /* Lote 10: eixo do acerto ajustado aos dados, semana atual mais clara ("até hoje"), linha da meta semanal de questões */
  const QG=ui.prefs.qgoal||0,AC=W.filter(w=>w.q).map(w=>w.c/w.q),lo=Math.max(0,Math.floor((Math.min(...AC)-.08)*10)/10),hi=Math.min(1,Math.ceil((Math.max(...AC)+.04)*10)/10),A0=Math.min(lo,hi-.2),A1=Math.max(hi,A0+.2);
  const VW=Math.max(300,Math.round(width||600)),VH=VW<500?170:200,L=30,R=36,T=12,B=24,lstep=VW<420?3:2,cw=(VW-L-R)/N,mq=Math.max(...W.map(w=>w.q),QG),yq=v=>T+(VH-T-B)*(1-v/mq),ya=a=>T+(VH-T-B)*(1-(a-A0)/(A1-A0));
  const nice=mq<=10?mq:Math.ceil(mq/5)*5;
  let g=`<svg class="qevo" viewBox="0 0 ${VW} ${VH}" role="img" aria-label="Questões e acerto por semana nas últimas ${N} semanas">`;
  [...new Set([A0,A1,...(A0<.6&&A1>.6?[.6]:[])])].forEach(a=>{g+=`<line x1="${L}" x2="${VW-R}" y1="${ya(a)}" y2="${ya(a)}" class="${a===0.6?"qeref":"qegrid"}"/><text x="${VW-R+4}" y="${ya(a)+3.5}" class="qeax">${Math.round(a*100)}%</text>`});
  g+=`<text x="${L-4}" y="${yq(mq)+3.5}" class="qeax" text-anchor="end">${mq}</text><text x="${L-4}" y="${yq(0)+3.5}" class="qeax" text-anchor="end">0</text>`;
  W.forEach((w,i)=>{const x=L+i*cw+cw*0.18,bw=cw*0.64,ws2=fromNum(w.s),we=fromNum(Math.min(w.s+6,t)),tip=`Semana de ${br(ws2)} a ${br(we)}: ${w.q} questões${w.q?`, ${pct(w.c,w.q)}% de acerto`:""}`;
    const cur=i===N-1;
    if(w.q)g+=`<rect x="${x}" y="${yq(w.q)}" width="${bw}" height="${yq(0)-yq(w.q)}" rx="3" class="qebar${cur?" cur":""}" data-tip="${esc(tip+(cur?" (semana em andamento)":""))}"/>`;
    else g+=`<rect x="${x}" y="${T}" width="${bw}" height="${VH-T-B}" fill="transparent" data-tip="${esc(tip)}"/>`;
    if((N-1-i)%lstep===0)g+=`<text x="${x+bw/2}" y="${VH-8}" text-anchor="middle" class="qeax">${cur?"até hoje":br(ws2)}</text>`});
  if(QG)g+=`<line x1="${L}" x2="${VW-R}" y1="${yq(QG)}" y2="${yq(QG)}" class="qegoal"/><text x="${L+2}" y="${yq(QG)-4}" class="qegoalt">meta ${QG}</text>`;
  const all=W.map((w,i)=>w.q?[L+i*cw+cw/2,ya(w.c/w.q),w]:null),pts=all.filter(Boolean);
  // a linha só liga semanas seguidas com questões; semana vazia interrompe a linha
  let seg=[];const flush=()=>{if(seg.length>1)g+=`<polyline points="${seg.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" ")}" class="qeline"/>`;seg=[]};
  all.forEach(p=>{if(p)seg.push(p);else flush()});flush();
  pts.forEach(([x,y,w])=>{const p=pct(w.c,w.q),[bk]=band(p);g+=`<circle cx="${x}" cy="${y}" r="4.5" class="qedot ${bk}" data-tip="${p}% de acerto em ${w.q} questões"/>`});
  g+=`</svg>`;
  const last=W[N-1],prev=W.slice(N-5,N-1).filter(w=>w.q),pa=prev.length?prev.reduce((a,w)=>a+w.c,0)/prev.reduce((a,w)=>a+w.q,0):null;
  let note=`${tot.toLocaleString("pt-BR")} questões em ${N} semanas.`;
  if(last.q&&pa!==null){const d=Math.round(last.c/last.q*100-pa*100);note+=` Esta semana: ${pct(last.c,last.q)}% de acerto, ${d===0?"igual à":d>0?`${d} pontos acima da`:`${-d} pontos abaixo da`} média das 4 anteriores.`}
  if(est)note+=` Inclui ${est} questões antigas com data estimada.`;
  return {html:g+`<div class="clegend"><span><i class="sw" style="background:var(--accent);opacity:.35"></i>questões na semana</span><span><i class="sw" style="background:var(--ink)"></i>acerto</span><span><i class="refk"></i>60%</span><span class="qedk"><i class="qedot1 good"></i><i class="qedot1 warn"></i><i class="qedot1 bad"></i>ponto: verde ≥ 80%, amarelo 60–79%, vermelho &lt; 60%</span></div><p class="cnote">${note}</p>`,tot}}
/* ---------- Questões: meta semanal, tendência, erros na lista, acerto por banca ---------- */
const QSRC_SUG=["Claude","ENARE","USP","UNIFESP","SUS-SP","UNICAMP","AMRIGS","PSU-MG","SES-DF","UERJ","UFRJ","Revalida","Medcel","Estratégia MED","MedCof","Aristo","Sanar","Prova antiga"];
const ESHORT={conhecimento:"não sabia",interpretacao:"li errado",confusao:"confundi"};
/* meta semanal (segunda a domingo), contada no histórico de todas as questões */
function qWeekQ(ws){let q=0,c=0,r=0;for(let i=0;i<7;i++){const h=hist[fromNum(ws+i)];if(h){q+=h.q||0;c+=h.c||0;r+=h.rq||0}}return {q,c,rq:r,g:q+r}}/* g = para a meta (inclui as refeitas de Meus simulados, que não contam no acerto) */
function qGoalEl(){const g=ui.prefs.qgoal,t=dnum(today()),ws=t-(new Date().getDay()+6)%7,W0=qWeekQ(ws),W={q:W0.g,rq:W0.rq},w=el(`<div class="qgoal"></div>`);
  const sel=el(`<label class="qfsel qgsel"><span>Meta semanal</span><select id="qGoalSel"></select></label>`),s=sel.querySelector("select");
  [[0,"Sem meta"],[50,"50"],[100,"100"],[150,"150"],[200,"200"],[300,"300"],[400,"400"],[500,"500"],[700,"700"],[1000,"1.000"]].forEach(([v,lab])=>{const o=document.createElement("option");o.value=v;o.textContent=v?lab+" questões":lab;s.appendChild(o)});
  if(![0,50,100,150,200,300,400,500,700,1000].includes(g)){const o=document.createElement("option");o.value=g;o.textContent=g+" questões";s.appendChild(o)}
  s.value=String(g);s.onchange=()=>{ui.prefs.qgoal=+s.value;saveUI();render()};
  /* Lote 18: a meta é escolhida em Configurações; aqui só o valor, com um atalho */
  const ed=el(`<button class="link qgedit" type="button" id="qGoalEd"></button>`);ed.textContent=g?`meta ${g.toLocaleString("pt-BR")}/semana ✎`:"definir meta semanal ✎";ed.onclick=()=>cfGo("cfQ");
  if(!g){w.appendChild(el(`<p class="how qgtxt">Nesta semana: <b>${W.q}</b> ${W.q===1?"questão":"questões"}. Defina uma meta semanal para acompanhar o ritmo.</p>`));w.appendChild(ed);return w}
  let st=0,k=ws-7;while(qWeekQ(k).g>=g){st++;k-=7}if(W.q>=g)st++;
  const left=7-(t-ws),miss=Math.max(0,g-W.q),pc=Math.min(100,W.q/g*100);
  const box=el(`<div class="qgm"><div class="qgtop"><b>${W.q.toLocaleString("pt-BR")}</b><span>de ${g.toLocaleString("pt-BR")} questões nesta semana</span></div><div class="meter${W.q>=g?" ok":""}"><i style="width:${pc}%"></i></div><p class="how qgtxt"></p></div>`);
  box.querySelector(".qgtxt").textContent=W.q>=g?`Meta da semana batida${W.q>g?` (+${W.q-g})`:""}.${st>1?` ${st} semanas seguidas na meta.`:""}`:`Faltam ${miss}: cerca de ${Math.ceil(miss/left)} por dia até domingo.${st?` Sequência: ${st} ${st===1?"semana":"semanas"} na meta.`:""}`+(W.rq?` Inclui ${W.rq} ${W.rq===1?"refeita":"refeitas"} (Refazer e Meus simulados).`:"");
  w.append(box,ed);return w}
/* tendência: acerto dos últimos 30 dias contra os 90 dias antes deles (mínimo de 5 questões em cada) */
function qTrend(k){const s=get(k),t=dnum(today());let rq=0,rc=0,pq=0,pc=0;
  for(const d in s.qd||{}){const v=s.qd[d];if(!Array.isArray(v))continue;const n=t-dnum(d);if(n<0)continue;if(n<30){rq+=v[0]||0;rc+=v[1]||0}else if(n<120){pq+=v[0]||0;pc+=v[1]||0}}
  if(rq<5||pq<5)return null;const r=rc/rq*100,p=pc/pq*100;return {d:Math.round(r-p),r:Math.round(r),p:Math.round(p),rq,pq}}
/* linha extra de cada tema na lista: tendência, erros no caderno e atalhos */
/* painel do tema na aba Questões (Lote 12): acerto por semana, por banca/fonte, tendência, erros vivos, provas na íntegra e ações */
let qOpenK=null,simPick=new Set();
function qTopicPanel(it){const k=it.key,s=get(k),w=el(`<div class="qtp" id="qtp-${k}"></div>`),t0=dnum(today()),ws=t0-((new Date().getDay()+6)%7);
  const W=[...Array(8)].map((_,i)=>({s:ws-7*(7-i),q:0,c:0}));for(const d in s.qd||{}){const v=s.qd[d];if(!Array.isArray(v))continue;const n=dnum(d),i=Math.floor((n-W[0].s)/7);if(i>=0&&i<8){W[i].q+=v[0]||0;W[i].c+=v[1]||0}}
  const mx=Math.max(1,...W.map(x=>x.q));const ch=el(`<div class="qtpw" role="img"></div>`);ch.setAttribute("aria-label","Questões por semana: "+W.map(x=>`${br(fromNum(x.s))} ${x.q}`).join(", "));
  W.forEach((x,i)=>{const p=x.q?Math.round(x.c/x.q*100):null,[bk]=p===null?[""]:band(p),b=el(`<div class="qtpc${i===7?" cur":""}"><span class="qtpv"></span><div class="qtpb"><i class="${bk}" style="height:${x.q/mx*100}%"></i></div><span class="qtpx"></span></div>`);
    b.querySelector(".qtpv").textContent=p===null?"":p+"%";b.querySelector(".qtpx").textContent=i===7?"esta":br(fromNum(x.s));b.title=`Semana de ${br(fromNum(x.s))}: ${x.q} questões${p===null?"":`, ${p}% de acerto`}`;ch.appendChild(b)});
  const h1=el(`<p class="glabel">Acerto por semana <span class="how">(altura = questões; % = acerto)</span></p>`);w.append(h1,ch);
  const tr=qTrend(k);if(tr)w.appendChild(el(`<p class="how qtptr">${tr.rq?`Últimos 30 dias: ${tr.r}% em ${tr.rq} questões`:"Nada nos últimos 30 dias"}${tr.pq?` · 90 dias antes: ${tr.p}% em ${tr.pq}`:""}${Math.abs(tr.d)>=5?(tr.d>0?" · melhorando":" · piorando"):""}.</p>`));
  {const B=s.qb||{},L=Object.keys(B).map(f=>{let q=0,c=0;for(const d in B[f]){const v=B[f][d];if(Array.isArray(v)){q+=v[0]||0;c+=v[1]||0}}return {f,q,c}}).filter(x=>x.q).sort((a,b)=>b.q-a.q);
    if(L.length){w.appendChild(el(`<p class="glabel">Por banca ou fonte</p>`));const ul=el(`<ul class="qtpsrc"></ul>`);L.slice(0,6).forEach(x=>{const li=el(`<li><span></span><b></b></li>`);li.querySelector("span").textContent=x.f;li.querySelector("b").textContent=`${pct(x.c,x.q)}% · ${x.c}/${x.q}`;ul.appendChild(li)});w.appendChild(ul)}}
  {const E=errors.filter(e=>e.k===k&&eAlive(e)).sort((a,b)=>(b.miss||0)-(a.miss||0)).slice(0,3);if(E.length){w.appendChild(el(`<p class="glabel">Erros que ainda pedem atenção</p>`));const ul=el(`<ul class="qtperr"></ul>`);
    E.forEach(e=>{const li=el(`<li><button class="link" type="button"></button></li>`),b=li.querySelector("button");b.textContent=(eConcept(e)||eOneLine(e.w)).slice(0,140);b.onclick=()=>eOpenOne(e);ul.appendChild(li)});w.appendChild(ul)}}
  {const x=exTopicEl(it);if(x)w.appendChild(x)}
  const a=el(`<div class="btns qtpacts"></div>`),btn=(id,lab,fn,pri)=>{const b=el(`<button class="btn${pri?" primary":""}" type="button"></button>`);b.id=id+"-"+k;b.textContent=lab;b.onclick=fn;a.appendChild(b)};
  btn("qtpGo","Praticar este tema",()=>{detTab[k]="questoes";openTopic(k)},true);
  btn("qtpSim",simPick.has(k)?"Tirar do simulado":"Pôr no simulado misto",()=>{if(simPick.has(k))simPick.delete(k);else{simPick.add(k);simCfg.src="pick";sim=null}render()});
  btn("qtpReg","Registrar questões",()=>{qReg={k,d:today()};render();const f=$("#qReg");if(f)f.scrollIntoView({behavior:"smooth",block:"center"})});
  if(errors.some(e=>e.k===k))btn("qtpErr","Ver erros",()=>{eGoTopic(k);backStack=[];setView("erros")});
  btn("qtpRes","Abrir na Residência",()=>openTopic(k));w.appendChild(a);
  if(simPick.has(k))w.appendChild(el(`<p class="how">No simulado misto: fonte "Escolher temas" (${simPick.size} ${simPick.size===1?"tema":"temas"}).</p>`));
  return w}
function qRowExtra(it){const tr=qTrend(it.key),en=errors.filter(e=>e.k===it.key&&!e.arch),ex=el(`<div class="qrx"></div>`);
  if(tr&&Math.abs(tr.d)>=5){const b=el(`<span class="qtr ${tr.d>0?"up":"down"}"></span>`);b.textContent=`${tr.d>0?"▲":"▼"} ${Math.abs(tr.d)} pts`;b.dataset.tip=`Últimos 30 dias: ${tr.r}% em ${tr.rq} questões · antes: ${tr.p}% em ${tr.pq}`;b.title=b.dataset.tip;ex.appendChild(b)}
  if(en.length){const tc={};en.forEach(e=>tc[e.t]=(tc[e.t]||0)+1);const b=el(`<button class="qer" type="button"></button>`);
    b.textContent=`${en.length} ${en.length===1?"erro":"erros"} no caderno: ${Object.keys(ETYPES).filter(t=>tc[t]).map(t=>`${tc[t]} ${ESHORT[t]}`).join(" · ")}`;
    b.onclick=()=>{eGoTopic(it.key);backStack=[];setView("erros")};ex.appendChild(b)}
  const sp=el(`<span class="qrxsp"></span>`);ex.appendChild(sp);
  const ae=el(`<button class="link" type="button">+ erro</button>`);ae.onclick=()=>{openTopic(it.key);setTimeout(()=>{const f=detGet("ew-",it.key);if(f){f.scrollIntoView({behavior:"smooth",block:"center"});f.focus({preventScroll:true})}},350)};
  const ar=el(`<button class="link" type="button">+ registrar</button>`);ar.onclick=()=>{qReg={k:it.key,d:today()};render();const f=$("#qReg");if(f)f.scrollIntoView({behavior:"smooth",block:"center"})};
  ex.append(ae,ar);return ex}
/* acerto por banca ou fonte (informada no registro rápido; as geradas entram como "Claude") */
const qSrcKey=s=>String(s||"").trim().replace(/[.\/~*\[\]`]/g,"-").replace(/\s+/g," ").slice(0,30);
function qSrcAll(){const set=new Set();ALL.concat(FAC_ITEMS).forEach(it=>{for(const k in get(it.key).qb||{})set.add(k)});return [...set]}
function qSrcCard(U,from){const by={};let tq=0,tc=0;
  U.forEach(it=>{const s=get(it.key),[c,t]=qOf(it.key,from);tq+=t;tc+=c;for(const src in s.qb||{}){const m=s.qb[src];for(const d in m){if(from&&d<from)continue;const v=m[d];if(!Array.isArray(v))continue;const r=by[src]||(by[src]={q:0,c:0});r.q+=v[0]||0;r.c+=v[1]||0}}});
  const c=el(`<section class="card qsrc" aria-labelledby="qsh"><div class="dhead"><h2 id="qsh">Acerto por banca ou fonte</h2></div></section>`);
  const rows=Object.entries(by).filter(([,r])=>r.q>0).sort((a,b)=>b[1].q-a[1].q).map(([k,r])=>[k,r.c,r.q]);
  if(!rows.length){c.appendChild(el(`<p class="cempty">Informe a banca ou a fonte em <b>+ Registrar questões</b> (ENARE, USP, Medcel…) para comparar o seu acerto entre elas. As questões geradas pelo Claude entram sozinhas como “Claude”.</p>`));return c}
  const nq=rows.reduce((a,r)=>a+r[2],0),nc=rows.reduce((a,r)=>a+r[1],0);if(tq-nq>0)rows.push(["Não informado",Math.max(0,tc-nc),tq-nq]);
  const box=el(`<div class="qsrows"></div>`);box.innerHTML=hbarRows(rows);c.appendChild(box);
  c.appendChild(el(`<p class="how">${from?`Nos últimos ${qPer} dias. `:""}“Não informado”: questões registradas sem banca ou antes deste campo existir. Compare a banca da sua prova com a média: se estiver bem abaixo, faça mais questões dela.</p>`));
  c.appendChild(qSrcFixEl());
  return c}
/* juntar ou renomear fontes (ex.: "Questões no Claude" e "Claude"): soma os dias de state[k].qb[de] em qb[para], em todos os temas,
   troca a banca das provas na íntegra que contavam com o nome antigo e a última fonte lembrada; Desfazer guarda o antes */
let qsrcOpen=false,qsrcUndo=null,qsrcPick={f:"",t:""};
const QSRC_FIXED="Claude";
function qSrcTotals(){const T={};[...ALL,...FAC_ITEMS].forEach(it=>{const qb=(state[it.key]||{}).qb||{};for(const k in qb){let n=0;for(const d in qb[k]){const v=qb[k][d];if(Array.isArray(v))n+=v[0]||0}T[k]=(T[k]||0)+n}});return T}
const qsrcNorm=x=>norm(String(x||"")).replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
function qSrcSuggest(T){const ks=Object.keys(T).filter(k=>T[k]>0),out=[],seen=new Set();
  for(let i=0;i<ks.length;i++)for(let j=i+1;j<ks.length;j++){const a=ks[i],b=ks[j],na=qsrcNorm(a),nb=qsrcNorm(b);if(!na||!nb)continue;
    const inside=(x,y)=>(" "+y+" ").includes(" "+x+" ");if(!(na===nb||inside(na,nb)||inside(nb,na)))continue;
    const to=a===QSRC_FIXED?a:b===QSRC_FIXED?b:T[a]>=T[b]?a:b,fr=to===a?b:a;if(seen.has(fr))continue;seen.add(fr);out.push([fr,to])}
  return out.slice(0,3)}
function qSrcMerge(fr,to){fr=qSrcKey(fr);to=qSrcKey(to);if(!fr||!to||fr===to)return;const snap={qb:{},ex:{},last:null};
  [...ALL,...FAC_ITEMS].forEach(it=>{const x=state[it.key];if(!x||!x.qb||!x.qb[fr])return;snap.qb[it.key]=JSON.stringify(x.qb);
    const b={...x.qb},m={...(b[to]||{})};for(const d in b[fr]){const v=b[fr][d],w=m[d]||[0,0];if(Array.isArray(v))m[d]=[w[0]+(v[0]||0),w[1]+(v[1]||0)]}b[to]=m;delete b[fr];x.qb=b});
  exams.forEach(ex=>{if(qSrcKey(exSrc(ex))===fr){snap.ex[ex.id]=ex.banca;ex.banca=to;exPut(ex)}});
  try{if(localStorage.getItem("resid-qsrc")===fr){snap.last=fr;localStorage.setItem("resid-qsrc",to)}}catch(e){}
  qsrcUndo={fr,to,snap};qsrcPick={f:"",t:""};commit()}
function qSrcUndoNow(){const u=qsrcUndo;if(!u)return;for(const k in u.snap.qb){if(state[k])state[k].qb=JSON.parse(u.snap.qb[k])}
  exams.forEach(ex=>{if(ex.id in u.snap.ex){ex.banca=u.snap.ex[ex.id];exPut(ex)}});try{if(u.snap.last)localStorage.setItem("resid-qsrc",u.snap.last)}catch(e){}
  qsrcUndo=null;commit()}
function qSrcFixEl(){const T=qSrcTotals(),w=el(`<div class="qsrcfix"></div>`);
  if(qsrcUndo){const m=el(`<p class="pnote" role="status"><span></span> <button class="link" type="button" id="qsrcUndo">Desfazer</button></p>`);m.querySelector("span").textContent=`“${qsrcUndo.fr}” agora conta como “${qsrcUndo.to}”${T[qsrcUndo.to]?` (${T[qsrcUndo.to]} questões)`:""}.`;m.querySelector("button").onclick=qSrcUndoNow;w.appendChild(m)}
  qSrcSuggest(T).forEach(([fr,to],i)=>{const p=el(`<p class="qsrcsug">Parece a mesma fonte: <b></b> (<span></span>) e <b></b> (<span></span>). <button class="mini" type="button"></button></p>`),B=p.querySelectorAll("b"),S=p.querySelectorAll("span");
    B[0].textContent=fr;S[0].textContent=T[fr];B[1].textContent=to;S[1].textContent=T[to];const b=p.querySelector("button");b.id="qsrcSug"+i;b.textContent=`Juntar em “${to}”`;b.onclick=()=>qSrcMerge(fr,to);w.appendChild(p)});
  const names=Object.keys(T).filter(k=>T[k]>0).sort((a,b)=>T[b]-T[a]);if(names.length<1)return w;
  const tg=el(`<button class="link" type="button" id="qsrcTog"></button>`);tg.textContent=qsrcOpen?"Fechar":"Juntar ou renomear fontes";tg.onclick=()=>{qsrcOpen=!qsrcOpen;render()};w.appendChild(tg);
  if(qsrcOpen){const f=el(`<div class="qsrcform"><label class="qfsel"><span>Fonte</span><select id="qsrcFrom"></select></label><label class="qfsel"><span>Passa a se chamar</span><input id="qsrcTo" list="qsrcList" autocomplete="off" maxlength="30" placeholder="Ex.: ENARE"></label><datalist id="qsrcList"></datalist><button class="btn primary" type="button" id="qsrcGo"></button><p class="how qsrcnote"></p></div>`);
    const sf=f.querySelector("#qsrcFrom"),ti=f.querySelector("#qsrcTo"),go=f.querySelector("#qsrcGo"),nt=f.querySelector(".qsrcnote");
    if(!names.includes(qsrcPick.f))qsrcPick.f=names.find(n=>n!==QSRC_FIXED)||names[0];
    names.forEach(n=>{const o=document.createElement("option");o.value=n;o.textContent=`${n} (${T[n]})`;sf.appendChild(o);const d=document.createElement("option");d.value=n;f.querySelector("datalist").appendChild(d)});
    sf.value=qsrcPick.f;ti.value=qsrcPick.t;
    const upd=()=>{const fr=sf.value,to=qSrcKey(ti.value),ex=to&&T[to]>0&&to!==fr;go.textContent=ex?`Juntar em “${to}”`:"Renomear";
      go.disabled=!to||to===fr||fr===QSRC_FIXED;
      nt.textContent=fr===QSRC_FIXED?"“Claude” é o nome das questões geradas pelo app: junte outras fontes nele, mas ele mesmo não muda de nome.":ex?`As ${T[fr]} questões de “${fr}” passam a contar em “${to}” (que já tem ${T[to]}). Vale para todos os temas e períodos.`:to&&to!==fr?`“${fr}” passa a se chamar “${to}”, em todos os temas e períodos.`:"Escolha a fonte e o novo nome (ou o nome de outra fonte, para juntar as duas)."};
    sf.onchange=()=>{qsrcPick.f=sf.value;upd()};ti.oninput=()=>{qsrcPick.t=ti.value;upd()};go.onclick=()=>{qsrcOpen=false;qSrcMerge(sf.value,ti.value)};upd();w.appendChild(f)}
  return w}
