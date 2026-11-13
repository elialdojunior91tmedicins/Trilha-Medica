/* "Hoje não deu": 1 por semana, transforma hoje em folga (empurra as revisões e zera o plano); desfaz no mesmo dia. ui.prefs.hnd = {segunda:{d,prev}} */
const hndWeek=()=>{const H=ui.prefs.hnd||{};return H[fromNum(wpMon(dnum(today())))]||null};
function hojeNaoDeu(){if(hndWeek())return;const t=dnum(today()),mon=fromNum(wpMon(t)),prev=dayMin(t),H={...(ui.prefs.hnd||{})};H[mon]={d:today(),prev};
  const ks=Object.keys(H).sort();if(ks.length>6)ks.slice(0,ks.length-6).forEach(k=>delete H[k]);ui.prefs.hnd=H;setTodayMin(0);planNote="Hoje não deu: hoje virou folga. As revisões passam para o próximo dia de estudo e a sequência fica congelada.";render()}
function hndUndo(){const W=hndWeek();if(!W||W.d!==today())return;const H={...(ui.prefs.hnd||{})};delete H[fromNum(wpMon(dnum(today())))];ui.prefs.hnd=H;setTodayMin(WP_MIN.includes(W.prev)&&W.prev?W.prev:60);planNote="Hoje voltou a ser dia de estudo.";render()}
let hndArm=false;
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
  upd(k,x=>{if(it)markSubsReviewed(x,it);revLog(x,g,o);const n=revNext(x,g);x.last=today();x.step=n;x.rg=g;if(o.auto)x.ar={d:today(),a:o.acc};else delete x.ar;if(g===2)x.l=Math.max(x.l||0,2)});
  logAct("r");markReviewed(k);if(!o.quiet)commit()}
/* Histórico das revisões (13/11/2026; docs/superpowers/specs/2026-11-13-revisoes-historico-e-recuperacao-design.md):
   s.rv = [{d,g,l,i,a?}] (as REV_HIST_MAX mais novas, a última no fim): dia, resposta (0 Esqueci · 1 Difícil · 2 Lembrei), dias de atraso contra a
   data ORIGINAL (sem o ajuste da recuperação ou do Equilibrar), intervalo previsto e a:1 = revisada sozinha pelas questões. Retenção: revStats. */
const REV_HIST_MAX=40;
function revIv(s){const x={...s};delete x.adj;delete x.adjFrom;return interval(x)}
function revLate(s,T){if(!s||!s.last)return null;return dnum(T||today())-(dnum(s.last)+revIv(s))}
function revLog(x,g,o){if(!x.last)return;const T=today(),L=Array.isArray(x.rv)?x.rv.slice():[],u=L[L.length-1];
  if(u&&u.d===T){const e={...u,g};if(o&&o.auto)e.a=1;else delete e.a;L[L.length-1]=e;x.rv=L;delete x.rc;return}// revisou de novo no mesmo dia: vale a última resposta
  const e={d:T,g,l:revLate(x,T),i:revIv(x)};if(o&&o.auto)e.a=1;x.rv=[...L,e].slice(-REV_HIST_MAX);delete x.rc}
function revStats(L,from,to){const R={n:0,g2:0,g1:0,g0:0,ok:{n:0,g2:0},late:{n:0,g2:0}};
  (L||[]).forEach(e=>{if(!e||(from&&e.d<from)||(to&&e.d>to))return;R.n++;R["g"+(e.g===2?2:e.g===1?1:0)]++;const b=(e.l||0)<=1?R.ok:R.late;b.n++;if(e.g===2)b.g2++});return R}
/* Recuperação do atraso (13/11/2026): quando as atrasadas passam do que cabe em ~3 dias (REC_TRIG × limite diário), o app dá data nova a cada
   uma e espalha em até REC_DAYS dias (sem folgas), as mais esquecidas primeiro (peso × atraso ÷ intervalo); o limite pode subir até +REC_EXTRA.
   A data muda pelo mesmo ajuste do Equilibrar (adj/adjFrom, vale até a próxima revisão); s.rc={d,o} guarda o ajuste anterior para o Desfazer;
   ui.prefs.rec={d,n,until,ov} = a recuperação em curso (sincroniza). Durante ela, 1 tema novo por dia (revBrake). */
const REC_DAYS=14,REC_EXTRA=2,REC_TRIG=3,LSREC="resid-recchk";
function recBase(){const n=[...ALL,...FAC_ITEMS].filter(it=>{const d=dueIn(get(it.key));return d!==null&&d>=0&&d<REC_DAYS}).length;return Math.max(3,Math.ceil(n/REC_DAYS*1.25))}
function recPlan(items,D,cap,offs){const L=items.slice().sort((a,b)=>b.w*(b.late/Math.max(1,b.iv))-a.w*(a.late/Math.max(1,a.iv))||b.late-a.late);
  let days=[...Array(REC_DAYS).keys()].filter(d=>!offs.has(d));if(!days.length)days=[REC_DAYS-1];const lastDay=days[days.length-1];
  for(let c=cap;c<=cap+REC_EXTRA;c++){const used=D.slice(),asg={};let rest=[];
    L.forEach(x=>{const d=days.find(d=>used[d]<c);if(d===undefined){rest.push(x);return}used[d]++;asg[x.k]=d});
    if(!rest.length)return {asg,cap:c,last:Math.max(0,...Object.values(asg)),over:0};
    if(c===cap+REC_EXTRA){rest.forEach(x=>asg[x.k]=lastDay);return {asg,cap:c,last:lastDay,over:rest.length}}}}
function recLateItems(){return [...ALL,...FAC_ITEMS].filter(it=>{const d=dueIn(get(it.key));return d!==null&&d<0})}
function recApply(T){T=T||today();const late=recLateItems();if(!late.length)return {n:0};const t=dnum(T),D=Array(REC_DAYS).fill(0),offs=new Set();
  [...ALL,...FAC_ITEMS].forEach(it=>{const d=dueIn(get(it.key));if(d!==null&&d>=0&&d<REC_DAYS)D[d]++});
  for(let d=0;d<REC_DAYS;d++)if(dayMin(t+d)===0)offs.add(d);
  const items=late.map(it=>{const s=get(it.key);return {k:it.key,w:wOf(it)||2,late:Math.max(1,revLate(s,T)||0),iv:interval(s)}});
  const P=recPlan(items,D,recBase(),offs);
  Object.entries(P.asg).forEach(([k,d])=>{const s={...get(k)},had=s.adjFrom===s.last&&"adj" in s,base=dnum(s.last)+INT[Math.min(s.step||0,INT.length-1)];
    s.rc={d:T,o:had?[s.adj,s.adjFrom]:null};s.adj=t+d-base;s.adjFrom=s.last;state[k]=s});
  const until=fromNum(t+P.last);ui.prefs.rec={d:T,n:late.length,until,ov:P.over};saveUI();return {n:late.length,until,over:P.over}}
function recActive(){return [...ALL,...FAC_ITEMS].filter(it=>{const s=get(it.key);return s.rc&&s.adjFrom===s.last}).map(it=>it.key)}
function recUndo(){recActive().forEach(k=>{const s={...get(k)},o=s.rc.o;if(o){s.adj=o[0];s.adjFrom=o[1]}else{delete s.adj;delete s.adjFrom}delete s.rc;state[k]=s});
  delete ui.prefs.rec;ui.prefs.recNo=today();saveUI();try{localStorage.setItem(LSREC,today())}catch(e){}commit()}
function recCheck(){const T=today();if(!synced||!uiLoaded)return false;// antes das preferências da conta chegarem, gravar aqui passaria por cima delas
  if(ui.prefs.rec&&!recActive().length){delete ui.prefs.rec;saveUI()}
  if(ui.prefs.recNo===T||lsGet(LSREC,"")===T||isOffDay()||examCrunch().active||provaWeek().length||recActive().length)return false;
  try{localStorage.setItem(LSREC,T)}catch(e){}
  if(recLateItems().length<=REC_TRIG*recBase())return false;return recApply(T).n>0}
function recPull(n){const t=dnum(today());recActive().map(k=>({k,d:dueIn(get(k))})).filter(x=>x.d>0).sort((a,b)=>a.d-b.d).slice(0,n||3).forEach(({k})=>{
    const s={...get(k)};s.adj=t-(dnum(s.last)+INT[Math.min(s.step||0,INT.length-1)]);state[k]=s});goRevs();commit()}
function recOrig(s){if(!s||!s.rc)return null;const o=s.rc.o;return fromNum(o&&o[1]===s.last?dnum(s.last)+INT[Math.min(s.step||0,INT.length-1)]+o[0]:dnum(s.last)+revIv(s))}
/* aviso da recuperação (Início e topo das revisões); sfx separa os ids das duas telas */
function recNoteEl(sfx){const R=ui.prefs.rec;sfx=sfx||"";if(!R||!recActive().length||lsGet("resid-recdis","")===R.d)return null;
  const n=el(`<div class="inote recnote" role="status"><p></p><div class="btns"><button class="btn" type="button">Ver nos próximos dias</button><button class="btn" type="button">Desfazer</button><button class="link" type="button">Fechar</button></div></div>`);
  n.id="recNote"+sfx;n.querySelector("p").textContent=`${R.n} ${R.n===1?"revisão atrasada foi distribuída":"revisões atrasadas foram distribuídas"} até ${br(R.until)}, as mais esquecidas primeiro.${R.ov?` ${R.ov} não couberam e ficaram para ${br(R.until)}.`:""} Enquanto isso, 1 tema novo por dia.`;
  const [see,und,x]=n.querySelectorAll("button");see.id="recSee"+sfx;und.id="recUndo"+sfx;x.id="recX"+sfx;
  see.onclick=()=>{goRevs();setTimeout(()=>{const a=$("#revAgenda");if(a)a.scrollIntoView({block:"center",behavior:"smooth"})},120)};und.onclick=recUndo;x.onclick=()=>{lsSet("resid-recdis",R.d);render()};return n}
function recLine(){const R=ui.prefs.rec,act=recActive().length;if(!R||!act)return "";return `Recuperação: ${Math.max(0,R.n-act)} de ${R.n} feitas · termina em ${br(R.until)}`}
function topicRevs(){const out=[];[...ALL,...FAC_ITEMS].forEach(it=>{const L=get(it.key).rv;if(Array.isArray(L))L.forEach(e=>out.push({k:it.key,...e}))});return out}
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
function revBrake(){const n=examCrunch().active?0:[...ALL,...FAC_ITEMS].filter(i=>isDue(get(i.key))&&dueIn(get(i.key))<0).length;return {n,cap:recActive().length?1:n>REV_BRAKE2?0:n>REV_BRAKE1?1:99}}
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
    b.textContent=recActive().length?`Recuperação do atraso até ${br((ui.prefs.rec||{}).until||today())}: hoje só 1 tema novo. As revisões remanejadas vêm primeiro.`:BR.cap?`${BR.n} revisões atrasadas: hoje só 1 tema novo. As revisões vêm primeiro (as mais importantes no topo).`:`${BR.n} revisões atrasadas: dia de pôr em dia, sem tema novo. Comece pelas revisões mais importantes.`;
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
  {const o=$("#recNoteR");if(o)o.remove();const rn=recNoteEl("R");if(rn)list.before(rn)}
  if(!due.length)list.appendChild(el(`<li class="empty" style="padding:0">${ALL.some(i=>get(i.key).last)?"Nenhuma revisão pendente hoje.":"Quando você marcar \"Estudei hoje\" em um tema, a primeira revisão é agendada para o dia seguinte e aparece aqui."}</li>`));
  const shown=revMore?due:due.slice(0,4);
  shown.forEach(it=>{const s=get(it.key),d=dueIn(s),subs=pickSubs(it,"r-rev"),chk=rchk(it.key),L=subList(it);
    const li=el(`<li class="pcard rcard" data-k="${it.key}"><div class="ptop"><button class="ptitle" type="button"></button><span class="reason r-rev"></span></div><div class="pa"></div><div class="pbody"></div></li>`);
    const tb=li.querySelector(".ptitle");tb.textContent=it.t;tb.onclick=()=>openTopic(it.key);
    li.querySelector(".reason").textContent=dueLabel(d);
    const pa=li.querySelector(".pa");pa.textContent=`${it.area===FAC_AREA?"Faculdade":it.area.code}${it.sp?" · "+it.sp:""} · último estudo ${br(s.last)} · intervalo ${interval(s)} ${interval(s)===1?"dia":"dias"} · `;if(it.own){pa.prepend(el(`<span class="facchip">FAC</span>`))}else{pa.appendChild(incEl(wOf(it),false));const L0=FL[it.key];if(L0){const x=el(`<span class="fbadge"></span>`);x.textContent=`FAC · ${L0.s?spShort(L0.s.name):L0.d.name}`;x.title=L0.d.name+(L0.s?" · "+L0.s.name:"");pa.appendChild(x)}}
    if(s.rc){const o=el(`<span class="recorig"></span>`);o.textContent="era para "+br(recOrig(s));o.title="Data remanejada pela recuperação do atraso";li.querySelector(".pa").prepend(o)}
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

/* ===== Lote 20E: plano alinhado ao eixo da faculdade =====
   Eixo = área/especialidade das SPs da semana (fechamento nesta semana ou na próxima; sem nenhuma, a próxima a fechar). Vários eixos: a vaga reveza por dia.
   Também dá para fixar à mão (ui.prefs.eixo={a,sp,until}). Composição padrão 1·1·1 = 1 da faculdade (próximo conteúdo da SP) · 1 da residência do eixo · 1 livre.
   Prova e fechamento continuam tomando vagas como antes; semana da prova, modo provas, dia de 30 min e freio de revisões ficam por cima. */
const AX_MIX={"111":[1,1,1],"021":[0,2,1],"120":[1,2,0]},AX_MIX_LAB={"111":"1 faculdade · 1 do eixo · 1 livre","021":"2 do eixo · 1 livre","120":"1 faculdade · 2 do eixo"};
const axOn=()=>{const v=ui.prefs.align;return v===true||v===false?v:(ui.profile.phase||phaseSuggest())==="clinico"};
const axMix=()=>AX_MIX[ui.prefs.amix]||AX_MIX["111"];
function axNow(){const t=today(),fx=ui.prefs.eixo;
  if(fx&&fx.a&&fx.sp&&(!fx.until||fx.until>=t)&&AREAS.some(a=>a.code===fx.a))return {list:[{area:fx.a,spec:fx.sp,lab:fx.sp,fixed:true}],noArea:[],fixed:true};
  const act=new Set(activeSems()),S=[];fac.discs.forEach(d=>{if(!act.has(d.semId))return;(d.sps||[]).forEach(s=>{if(typeof s.fech==="string"&&s.fech>=t&&!s.fadi)S.push({d,s,dd:daysTo(s.fech)})})});
  S.sort((a,b)=>a.dd-b.dd);const wk=S.filter(x=>x.dd<=13),use=wk.length?wk:S.slice(0,1),out=[],noArea=[],seen=new Set();
  use.forEach(x=>{const o=fac.own[x.s.id]||{discId:x.d.id,spId:x.s.id},P=ownPlace(o);if(!P.A){noArea.push(x);return}const sp=P.spec&&P.spec!=="Faculdade"?P.spec:"",key=P.A.code+"|"+sp;
    if(seen.has(key)){const e=out.find(y=>y.key===key);if(e&&!e.sps.includes(x))e.sps.push(x);return}seen.add(key);out.push({key,area:P.A.code,spec:sp,lab:sp||P.A.name,sps:[x],s:x.s,d:x.d,dd:x.dd})});
  return {list:out,noArea,fixed:false}}
const axToday=AX=>AX.list.length?AX.list[dnum(today())%AX.list.length]:null;
/* conteúdo da SP da semana (mesmo sem prova perto) */
function axFacPick(AX,used){const L=[...AX.list.flatMap(e=>e.sps||[]),...AX.noArea];for(const f of L){const p=spAsProva(f.d,f.s);
    for(const r of provaPending(p)){const x=refTopics(r).find(y=>BYKEY[y.k]&&!used.has(y.k)&&!topicStudied(p,y));if(x)return {it:BYKEY[x.k],x,lab:spShort(f.s.name),dd:f.dd}}}return null}
/* tema da residência do eixo: continuar o que está em andamento; depois não estudado, ligado à SP, parecido com os objetivos, mais cobrado; sem nenhum, área vizinha */
function axCands(E,used,skip){const sps=E.sps||[],link=new Set(),objw=new Set();
  sps.forEach(f=>{topicKeysOf(spAsProva(f.d,f.s).items).forEach(k=>link.add(k));(f.s.objs||[]).forEach(o=>clWords(o).forEach(w=>objw.add(w)))});
  const PK=new Set();upcomingProvas().forEach(p=>{if(daysTo(p.date)<=FAC_WIN)topicKeysOf(p.items).forEach(k=>PK.add(k))});
  const ok=it=>!it.own&&!used.has(it.key)&&!(skip||[]).includes(it.key)&&(isNew(get(it.key))||isIng(get(it.key)));
  const sc=it=>{const s=get(it.key);let v=wOf(it)*10;if(isIng(s))v+=100;if(link.has(it.key))v+=60;if(PK.has(it.key))v+=40;let o=0;clWords(it.t+" "+it.subs.join(" ")).forEach(w=>{if(objw.has(w))o++});v+=Math.min(o,6)*4;return v};
  const pool=sp=>ALL.filter(it=>it.area.code===E.area&&(!sp||it.sp===sp)&&ok(it)).sort((a,b)=>sc(b)-sc(a)||a.num-b.num);
  let L=pool(E.spec);if(!L.length&&E.spec&&ui.prefs.anear!==false)(AX_NEAR[E.spec]||[]).forEach(n=>{ALL.filter(it=>it.sp===n&&ok(it)).sort((a,b)=>sc(b)-sc(a)).forEach(it=>{if(!L.includes(it))L.push(it)})});
  if(!L.length&&E.spec)L=pool("");return L}
function axResPick(E,used,skip){const it=axCands(E,used,skip)[0];if(!it)return null;const s=get(it.key),near=E.spec&&it.sp!==E.spec;
  return {it,cls:isIng(s)?"r-cont":"r-eixo",txt:`Eixo · ${near?it.sp+" (vizinha de "+E.lab+")":E.lab}`}}
/* trocar o tema do eixo por outro do mesmo eixo */
function axSwap(pi){const P=ensurePlan(),x=P.items[pi];if(!x||x.cls!=="r-eixo")return;const AX=axNow(),E=axToday(AX);if(!E)return;
  P.axSkip=[...new Set([...(P.axSkip||[]),x.k])];const used=new Set(P.items.map(y=>y.k)),r=axResPick(E,used,P.axSkip);if(!r){planNote="Não há outro tema do eixo para trocar.";render();return}
  const pt=partSubs(r.it);P.items[pi]={k:r.it.key,cls:"r-eixo",txt:r.txt+(pt.pt?` · Parte ${pt.pt[0]} de ${pt.pt[1]}`:""),subs:pt.subs,...(pt.pt?{pt:pt.pt}:{})};savePlan();render()}
/* linha do eixo no Estudar hoje e cartão em Configurações › Plano */
function axLineEl(){if(!axOn())return null;const AX=axNow(),E=axToday(AX);if(!E&&!AX.noArea.length)return null;const w=el(`<p class="paxis" id="pAxis"></p>`);
  if(E){w.append("Eixo da faculdade: ");const b=el(`<b></b>`);b.textContent=E.lab;w.appendChild(b);
    const ex=AX.fixed?` (fixado${ui.prefs.eixo.until?" até "+br(ui.prefs.eixo.until):""})`:E.sps&&E.sps[0]?` (${spShort(E.sps[0].s.name)}, fecha ${inLabel(E.sps[0].dd)})`:"";w.append(ex);
    if(AX.list.length>1)w.append(` · reveza com ${AX.list.filter(x=>x!==E).map(x=>x.lab).join(", ")}`)}
  if(AX.noArea.length){const n=el(`<span class="paxwarn"></span>`);n.textContent=`${E?" · ":""}${AX.noArea.map(x=>spShort(x.s.name)).join(", ")} sem área: defina a área da SP para alinhar o plano.`;w.appendChild(n)}
  const c=el(`<button class="link" type="button" id="pAxisCfg">ajustar</button>`);c.onclick=()=>{goSub("config");setTimeout(()=>{const x=$("#axCard");if(x)x.scrollIntoView({block:"center"})},80)};w.append(" ",c);return w}
let axFixOpen=false;
function axCardEl(){const P=ui.prefs,on=axOn(),AX=axNow(),E=axToday(AX),c=el(`<div class="grp" id="axCard"><span class="glabel">Plano alinhado ao eixo da faculdade</span><p class="gtext how hx">O eixo é a área das SPs desta semana e da próxima (pelo fechamento). Com mais de um eixo, a vaga reveza por dia. Prova da faculdade, fechamento de SP, semana da prova, modo provas e o freio de revisões continuam valendo por cima.</p></div>`);
  c.appendChild(segRow("Alinhar o plano ao eixo",on&&P.align===undefined?"Ligado pela fase do curso (Ciclo clínico).":"",[[true,"Ligado"],[false,"Desligado"]],on,v=>{ui.prefs.align=v;saveUI();redoPlan(v?"Plano alinhado ao eixo da faculdade.":"Plano sem o eixo da faculdade.");render()}));
  if(on){c.appendChild(segRow("Vagas do dia","Com menos tempo, a ordem é essa: faculdade, eixo, livre.",Object.entries(AX_MIX_LAB),P.amix&&AX_MIX[P.amix]?P.amix:"111",v=>{ui.prefs.amix=v;saveUI();redoPlan("Vagas do plano trocadas.");render()}));
    c.appendChild(segRow("Áreas vizinhas","Quando a especialidade do eixo não tem tema novo, usa uma vizinha (ex.: Neurologia ↔ Psiquiatria).",[[true,"Usar"],[false,"Não usar"]],P.anear!==false,v=>{ui.prefs.anear=v;saveUI();render()}));
    const st=el(`<p class="axnow"></p>`);st.textContent=E?`Agora: ${AX.list.map(x=>x.lab).join(" · ")}${AX.fixed?" (fixado à mão)":" (pelas SPs da semana)"}.`:AX.noArea.length?`As SPs da semana estão sem área: ${AX.noArea.map(x=>spShort(x.s.name)).join(", ")}.`:"Nenhuma SP com fechamento marcado: marque o fechamento das SPs ou fixe o eixo à mão.";c.appendChild(st);
    const fb=el(`<button class="btn" type="button" id="axFix"></button>`);fb.textContent=AX.fixed?"Voltar ao automático":axFixOpen?"Fechar":"Fixar o eixo à mão";fb.onclick=()=>{if(AX.fixed){delete ui.prefs.eixo;saveUI();redoPlan("Eixo automático pelas SPs.");render();return}axFixOpen=!axFixOpen;render()};c.appendChild(fb);
    if(axFixOpen&&!AX.fixed){const f=el(`<div class="axfix"><label class="qfsel"><span>Especialidade</span><select id="axSp"></select></label><label class="qfsel"><span>Até</span><input type="date" id="axUntil"></label><button class="btn primary" type="button" id="axFixGo">Fixar</button></div>`),s=f.querySelector("select");
      AREAS.forEach(a=>{const g=document.createElement("optgroup");g.label=a.name;[...new Set(a.items.map(i=>i.sp))].forEach(sp=>{const o=document.createElement("option");o.value=a.code+"|"+sp;o.textContent=sp;g.appendChild(o)});s.appendChild(g)});
      if(E)s.value=E.area+"|"+E.spec;const u=f.querySelector("input");u.value=fromNum(dnum(today())+27);
      f.querySelector("#axFixGo").onclick=()=>{const [a,sp]=s.value.split("|");ui.prefs.eixo={a,sp,until:u.value||fromNum(dnum(today())+27)};axFixOpen=false;saveUI();redoPlan(`Eixo fixado: ${sp}.`);render()};c.appendChild(f)}}
  return c}
/* vagas da faculdade no plano do dia */
function facPlanPicks(){const out=[],seen=new Set();
  for(const p of upcomingProvas()){const d=daysTo(p.date);if(d>FAC_WIN)continue;
    for(const r of provaPending(p)){const x=refTopics(r).find(y=>BYKEY[y.k]&&!seen.has(y.k)&&!topicStudied(p,y));if(!x)continue;seen.add(x.k);out.push({x,p,d,it:BYKEY[x.k]})}}
  out.sort((a,b)=>a.d-b.d||wOf(b.it)-wOf(a.it));
  if(!out.length)return {picks:[],slots:0};
  const near=out[0].d;
  let slots=near<=FAC_WIN/3?PLAN_N:near<=FAC_WIN*2/3?Math.max(1,Math.round(PLAN_N*2/3)):Math.max(1,Math.round(PLAN_N/3)); // padrão (21 dias, 3 temas): 1 · 2 · 3
  if(out.some(o=>!o.it.own&&wOf(o.it)===3))slots++;       // conteúdo que também cai muito na residência: +1 vaga
  slots=Math.min(slots,PLAN_N);
  // proteção da residência: pelo menos RES_MIN_WEEK dias por semana com 1 tema da residência (exceto nos 7 dias finais de uma prova)
  if(near>7&&slots>=PLAN_N&&resDaysNeeded())slots=PLAN_N-1;
  return {picks:out,slots}}
/* revisar para a prova: nos dias finais (os mesmos em que a prova ocupa as 3 vagas), o conteúdo já estudado volta ao plano,
   até FAC_RV_MAX vezes cada, com pelo menos FAC_RV_GAP dias entre elas, o de menor acerto primeiro. p.rv = {ref:[datas]}.
   Nessa semana o plano não abre tema novo da residência. Não mexe nas revisões espaçadas. Marcar na véspera também conta. */
const FAC_RV_MAX=2, FAC_RV_GAP=2;
const rvDays=()=>Math.round(FAC_WIN/3);
const provaRv=(p,r)=>p.rv&&Array.isArray(p.rv[r])?p.rv[r]:[];
function provaRvMark(p,r,on){const t=today(),L=provaRv(p,r).filter(d=>d!==t);if(on)L.push(t);if(!p.rv||typeof p.rv!=="object")p.rv={};
  if(L.length)p.rv[r]=L.sort();else delete p.rv[r];if(!Object.keys(p.rv).length)delete p.rv;
  ensurePlan();const V=dayPlan.vesp||(dayPlan.vesp={}),S=new Set(V[p.id]||[]);on?S.add(r):S.delete(r);V[p.id]=[...S];savePlan();saveFac()}
function refAcc(r){let c=0,n=0;refTopics(r).forEach(x=>{if(!BYKEY[x.k])return;const s=get(x.k);c+=s.qc||0;n+=s.qt||0});return n?c/n:null}
const provaWeek=()=>upcomingProvas().filter(p=>daysTo(p.date)<=rvDays()&&p.items.some(refOk));
function provaRvPicks(){const out=[],seen=new Set(),t=dnum(today());
  for(const p of provaWeek()){const d=daysTo(p.date);
    for(const r of p.items){if(!refOk(r)||!itemStudied(p,r))continue;const L=provaRv(p,r);if(L.length>=FAC_RV_MAX)continue;
      if(L.length&&t-dnum(L[L.length-1])<FAC_RV_GAP)continue;const x=refTopic(r);if(seen.has(x.k))continue;seen.add(x.k);
      const a=refAcc(r);out.push({p,d,r,n:L.length+1,it:BYKEY[x.k],a:a===null?0.55:a})}}
  return out.sort((x,y)=>x.a-y.a||x.n-y.n||x.d-y.d)}
/* modo provas: 3+ provas num intervalo de 7 dias -> residência pausada de 7 dias antes da 1ª até o dia da última */
const CRUNCH_N=3, CRUNCH_SPAN=7, CRUNCH_LEAD=7;
function crunchOverride(){const o=fac.crunch;if(!o||!o.until||o.until<today())return null;return o}
function examCrunch(){const ov=crunchOverride();
  if(ov&&ov.mode==="off")return {active:false,manual:true,until:ov.until};
  const auto=examCrunchAuto();
  if(ov&&ov.mode==="on")return {active:true,manual:true,from:today(),until:ov.until,provas:upcomingProvas().filter(p=>p.date<=ov.until)};
  return auto}
function examCrunchAuto(){const act=new Set(activeSems()),t=dnum(today());
  const ps=fac.provas.filter(p=>{const d=discOf(p.discId);return d&&!p.adi&&act.has(d.semId)&&dnum(p.date)>=t-CRUNCH_SPAN}).sort((a,b)=>a.date<b.date?-1:1);
  let best=null;
  for(let i=0;i<ps.length;i++){const grp=ps.filter(p=>dnum(p.date)>=dnum(ps[i].date)&&dnum(p.date)<=dnum(ps[i].date)+CRUNCH_SPAN-1);
    if(grp.length<CRUNCH_N)continue;const first=dnum(grp[0].date),last=dnum(grp[grp.length-1].date);
    if(t>=first-CRUNCH_LEAD&&t<=last){if(!best||last>best.last)best={first,last,provas:grp}}}
  return best?{active:true,from:fromNum(best.first),until:fromNum(best.last),provas:best.provas}:{active:false}}
function weekStart(){const t=dnum(today()),wd=(new Date().getDay()+6)%7;return t-wd}// segunda-feira
function resDaysNeeded(){const ws=weekStart(),t=dnum(today());let done=0;
  for(let x=ws;x<t;x++){const h=hist[fromNum(x)];if(h&&h.res)done++}
  const left=ws+7-t;return Math.max(0,RES_MIN_WEEK-done)>=left}

/* revisões pendentes (sem as pausadas pelo modo provas) */
function dueCount(){const CR=examCrunch();return [...ALL,...FAC_ITEMS].filter(i=>isDue(get(i.key))&&!(CR.active&&!i.own)).length}
/* ---------- Planejar a semana (Lote 10): Esta semana · Próxima · Semana padrão; tempo de cada dia em WP_MIN; meta ui.prefs.hgoal ---------- */
let wpTab=null,wpMsg="";const WP_ORDER=[1,2,3,4,5,6,0],WD3=["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const hm=m=>{m=Math.round(m);const h=Math.floor(m/60),r=m%60;return h?(r?`${h} h ${String(r).padStart(2,"0")}`:`${h} h`):`${r} min`};
const ddmm=n=>{const d=fromNum(n);return d.slice(8,10)+"/"+d.slice(5,7)};
function wpPlanned(mon){return ui.prefs.wplans[fromNum(mon)]||null}
function wpArr(mon){const W=wpPlanned(mon),b=W?W.m:ui.prefs.wday;return b.map((m,d)=>W&&Array.isArray(W.o)&&W.o.includes(d)?m:gradeAdj(m,mon+((d+6)%7)))}
/* muda um dia; mon=null = semana padrão. Mexer no dia de hoje refaz o plano de hoje (mantém o começado) */
function wpSetDay(mon,d,m){const P=ui.prefs,t=dnum(today());
  if(mon===null){const w=[...P.wday];w[d]=m;if(w.filter(x=>x===0).length>5){wpMsg="No máximo 5 dias de folga na semana padrão.";render();return}wpMsg="";P.wday=w;wpLegacy()}
  else{const k=fromNum(mon),W=P.wplans[k]?{...P.wplans[k],m:[...P.wplans[k].m]}:{m:[...P.wday],ok:0};W.m[d]=m;W.o=[...new Set([...(W.o||[]),d])].sort();P.wplans={...P.wplans,[k]:W}}
  saveUI();const todayHit=(mon===null&&!wpPlanned(wpMon(t))&&wdOf(t)===d)||(mon===wpMon(t)&&wdOf(t)===d);
  if(todayHit)redoPlan(`Plano de hoje ajustado para ${WP_LAB[m].toLowerCase()}. O que você já tinha começado foi mantido.`);else render()}
/* mantém os campos antigos (wnew/woff) coerentes para quem ainda lê */
function wpLegacy(){const P=ui.prefs,w=P.wday;let nw=[0,1,2,3,4,5,6].filter(d=>w[d]>=60);if(!nw.length)nw=[0,1,2,3,4,5,6].filter(d=>w[d]>0);P.wnew=nw.length?nw:[1];P.woff=[0,1,2,3,4,5,6].filter(d=>w[d]===0);P.wsim=P.wsim.filter(d=>w[d]>0)}
function wpConfirm(mon){const k=fromNum(mon),P=ui.prefs,W=P.wplans[k]||{m:[...P.wday],ok:0};P.wplans={...P.wplans,[k]:{m:[...W.m],...(W.o?{o:[...W.o]}:{}),ok:1}};saveUI();render()}
function wpReset(mon){const k=fromNum(mon),P=ui.prefs,o={...P.wplans};delete o[k];P.wplans=o;saveUI();const t=dnum(today());if(mon===wpMon(t))redoPlan("Esta semana voltou à semana padrão.");else render()}
/* o tempo de hoje, pelo link do Estudar hoje */
function setTodayMin(m){const t=dnum(today());wpSetDay(wpMon(t),wdOf(t),m)}
function wpCardEl(){const P=ui.prefs,t=dnum(today()),cur=wpMon(t);if(!wpTab)wpTab=wdOf(t)===0?"next":"cur";
  const c=el(`<div class="wpcard" id="wpCard"><div class="wph"><b>Planejar a semana</b><span class="gtext how hx">O tempo que você tem em cada dia decide o tamanho do Estudar hoje: 30 min = só cartões, erros e revisões; 1 h ≈ 1 tema; 2 h ≈ 2 temas; 3 h+ = o plano inteiro.</span></div><div class="seg wptabs" role="group" aria-label="Qual semana"></div><div class="wpbody"></div></div>`);
  const tg=c.querySelector(".wptabs");[["cur","Esta semana"],["next","Próxima semana"],["pad","Semana padrão"]].forEach(([v,lab])=>{const b=el(`<button type="button"></button>`);b.id="wpT-"+v;b.textContent=lab;b.setAttribute("aria-pressed",wpTab===v);b.onclick=()=>{wpTab=v;wpMsg="";render()};tg.appendChild(b)});
  const body=c.querySelector(".wpbody"),pad=wpTab==="pad",mon=pad?null:wpTab==="next"?cur+7:cur,W=pad?null:wpPlanned(mon),arr=pad?P.wday:wpArr(mon);
  if(pad)body.appendChild(el(`<p class="how hx">O tempo que você costuma ter em cada dia. Vale para toda semana que você não planejar.</p>`));
  else{const h=el(`<p class="wpst"><b></b> <span></span></p>`);h.querySelector("b").textContent=`${ddmm(mon)} a ${ddmm(mon+6)}`;
    h.querySelector("span").textContent=W&&W.ok?"· confirmada":W?"· alterada, ainda não confirmada":"· veio da semana padrão";body.appendChild(h);
    /* Lote 18: antes de planejar, a semana anterior a esta (o que cumpriu, o que atrasou, onde melhorou) */
    if(mon-7<=cur){const S=wpSumEl(mon-7);if(S){const d=el(`<details class="wpprev" id="wpPrev"><summary></summary></details>`);d.open=!(W&&W.ok);
      d.querySelector("summary").textContent=mon-7===cur?(wdOf(t)===0?"Antes de planejar: como foi esta semana":"Antes de planejar: esta semana até agora"):"Antes de planejar: como foi a semana passada";d.appendChild(S);body.appendChild(d)}}}
  const days=el(`<div class="wpdays"></div>`);
  WP_ORDER.forEach(d=>{const n=pad?null:mon+((d+6)%7),past=!pad&&n<t,r=el(`<div class="wpday${past?" past":""}${!pad&&n===t?" wpnow":""}"><span class="wpdn"><b></b><small></small></span><div class="wpopts" role="group"></div></div>`);
    r.querySelector("b").textContent=WD3[d];r.querySelector("small").textContent=pad?"":n===t?"hoje":ddmm(n);
    if(!pad){const A=aulasOn(n),W0=wpPlanned(mon),base=(W0?W0.m:P.wday)[d];if(A.length&&!(W0&&W0.o&&W0.o.includes(d))&&arr[d]!==base){const x=el(`<small class="wpaula"></small>`);x.textContent=`aula: ${A.map(a=>`${a.t} ${hm2(a.ini)}–${hm2(a.fim)}`).join(", ")} · menos tempo`;r.querySelector(".wpdn").appendChild(x)}}const g=r.querySelector(".wpopts");g.setAttribute("aria-label",WD_FULL[d]);
    WP_MIN.forEach(m=>{const on=arr[d]===m,b=el(`<button type="button" class="wpo${m===0?" off":""}${!pad&&on&&W&&P.wday[d]!==m?" chg":""}" aria-pressed="${on}"></button>`);b.id=`wp-${d}-${m}`;b.textContent=WP_LAB[m];b.disabled=past;
      b.onclick=()=>{if(!on)wpSetDay(mon,d,m)};g.appendChild(b)});days.appendChild(r)});
  body.appendChild(days);
  if(wpMsg&&pad){const m=el(`<p class="err" role="alert"></p>`);m.textContent=wpMsg;body.appendChild(m)}
  const tot=arr.reduce((a,m)=>a+m,0),goal=P.hgoal,tb=el(`<div class="wptot"><div class="meter"><i></i></div><b></b></div>`);tb.querySelector("i").style.width=Math.min(100,goal?tot/goal*100:100)+"%";
  tb.querySelector("b").textContent=goal?`${hm(tot)} de ${hm(goal)}`:`${hm(tot)} por semana`;body.appendChild(tb);
  if(goal&&tot<goal){const free=WP_ORDER.filter(d=>(pad||mon+((d+6)%7)>=t)&&arr[d]>0&&arr[d]<180),nt=el(`<p class="wpnote"></p>`);
    nt.textContent=`Faltam ${hm(goal-tot)} para a meta.${free.length?` Que tal um pouco mais ${free.slice(0,2).map(d=>(d===0||d===6?"no ":"na ")+WD_FULL[d]).join(" ou ")}?`:""} Se a meta parece longe, suba aos poucos: 1 h a mais por semana já conta.`;body.appendChild(nt)}
  if(!pad){const bt=el(`<div class="btns"></div>`);
    if(!(W&&W.ok)){const ok=el(`<button class="btn primary" type="button" id="wpOk">Confirmar a semana</button>`);ok.onclick=()=>wpConfirm(mon);bt.appendChild(ok)}
    if(W){const rs=el(`<button class="btn" type="button" id="wpReset">Voltar à semana padrão</button>`);rs.onclick=()=>wpReset(mon);bt.appendChild(rs)}
    if(bt.children.length)body.appendChild(bt);
    body.appendChild(el(`<p class="how hx">Contorno dourado = diferente da semana padrão. Semana que você não planejar segue a padrão.</p>`))}
  else{body.appendChild(segRow("Meta por semana","Quanto você quer estudar por semana (residência e faculdade juntas). Aparece aqui e em Estatísticas.",[[300,"5 h"],[420,"7 h"],[480,"8 h"],[540,"9 h"],[600,"10 h"],[720,"12 h"]],P.hgoal,v=>{ui.prefs.hgoal=v;saveUI();render()}));
    const L="DSTQQSS",r=el(`<div class="wkrow" id="wkCfg"><div class="wkl"><b>Simulados e provas</b><span class="how hx">Nesses dias o Início sugere um simulado ou uma prova na íntegra.</span></div><div class="wkdays" role="group" aria-label="Simulados e provas"></div></div>`),g=r.querySelector(".wkdays");
    for(let d=0;d<7;d++){const on=P.wsim.includes(d),b=el(`<button type="button" class="wkd wsim" aria-pressed="${on}"></button>`);b.id=`wk-wsim-${d}`;b.textContent=L[d];b.title=WD_FULL[d];b.disabled=P.wday[d]===0;
      b.onclick=()=>{const cur=new Set(ui.prefs.wsim);if(cur.has(d))cur.delete(d);else cur.add(d);ui.prefs.wsim=[...cur];saveUI();render()};g.appendChild(b)}
    body.appendChild(r)}
  return c}
/* resumo da semana que começa em ws (o que cumpriu, o que atrasou, onde melhorou): no cartão do Início e dentro do Planejar a semana */
function wpSumEl(ws){const A=weekStats(ws),B=weekStats(ws-7);if(!(A.fo||A.q||A.e||A.rv))return null;
  const ul=el(`<ul class="wpsum"></ul>`),g=(ui.prefs.hgoal||0)*60,add=(cls,t)=>{const li=el(`<li></li>`);li.className=cls;li.textContent=t;ul.appendChild(li)};
  const cmp=(a,b,f)=>b?(a>b?` (▲ ${f(a-b)} vs. anterior)`:a<b?` (▼ ${f(b-a)} vs. anterior)`:" (igual à anterior)"):"";
  add(g&&A.fo>=g?"ok":"",`Foco: ${fmtMin(A.fo)}${g?` de ${fmtMin(g)} da meta${A.fo>=g?" ✓":""}`:""}${cmp(A.fo,B.fo,fmtMin)}`);
  add("",`Questões: ${A.q}${A.q?` · ${pct(A.c,A.q)}% de acerto`:""}${cmp(A.q,B.q,String)} · temas estudados: ${A.e} · revisões: ${A.rv}`);
  const late=[...ALL,...FAC_ITEMS].filter(i=>{const d=dueIn(get(i.key));return d!==null&&d<0}).length;if(late)add("late",`Atrasou: ${late} ${late===1?"revisão de tema":"revisões de temas"} (as mais importantes vêm primeiro na fila).`);
  const best=heroFeats().find(f=>/subiu/.test(f));if(best)add("ok","Melhorou: "+best.replace(/^Seu acerto em /,""));return ul}
/* Início: cartão pequeno no domingo (próxima semana) e na segunda (esta), até confirmar ou dispensar */
function wpNoticeEl(){const t=dnum(today()),w=wdOf(t);if(w!==0&&w!==1)return null;const mon=w===0?t+1:t,W=wpPlanned(mon);if(W&&W.ok)return null;if(lsGet("resid-wpdis","")===fromNum(mon))return null;
  /* Lote 17: um cartão só no domingo/segunda — o resumo da semana (o que cumpriu, o que atrasou, onde melhorou) e, embaixo, planejar a próxima */
  const arr=wpArr(mon),tot=arr.reduce((a,m)=>a+m,0),n=el(`<section class="card iweek wpnotice" id="wpNotice" aria-labelledby="wpnh"><div class="dhead"><h2 id="wpnh"></h2></div><ul class="wpsum"></ul><p class="wpplan"><b></b> <span></span></p><div class="btns"><button class="btn primary" type="button" id="wpGo">Planejar a semana</button><button class="link" type="button">Agora não</button></div></section>`);
  n.querySelector("h2").textContent=w===0?"Sua semana":"Semana passada";
  {const ul=n.querySelector(".wpsum"),x=wpSumEl(mon-7);if(x)ul.replaceWith(x);else ul.remove()}
  n.querySelector(".wpplan b").textContent=w===0?"Planeje a próxima semana.":"Planeje esta semana.";
  n.querySelector(".wpplan span").textContent=`Pela sua semana padrão: ${hm(tot)}${ui.prefs.hgoal?` (meta ${hm(ui.prefs.hgoal)})`:""}. Leva 1 minuto e o plano de cada dia se ajusta ao tempo que você tem.`;
  const [go,no]=n.querySelectorAll("button");go.onclick=()=>{wpTab=w===0?"next":"cur";goSub("config");setTimeout(()=>{const b=$("#wpCard");if(b)b.scrollIntoView({block:"center",behavior:"smooth"})},80)};
  no.onclick=()=>{lsSet("resid-wpdis",fromNum(mon));render()};return n}
