/* ===================== ESTATÍSTICAS (Lote 10) =====================
   view "stats" (≡ Menu e barra lateral): seletor Residência · Faculdade (stSide, localStorage resid-stside), período 7/30/90 dias (stPer, resid-stper),
   4 veredictos (.stv ok|warn|bad|na) e 4 blocos. Tempo = sessões do Foco: tema da faculdade ligado à residência conta nos dois lados (stSideOf "b"),
   e o total nunca soma duas vezes. Tempo por tema = mediana do Foco nos temas estudados (stPerTopic; 2 h até haver 3 temas). */
let stSide=lsGet("resid-stside","res")==="fac"?"fac":"res",stPer=[7,30,90].includes(+lsGet("resid-stper","30"))?+lsGet("resid-stper","30"):30;
const ST_TIP_DEF=7200,ST_LOW_DAYS=21;
function stHist(a,b){const r={q:0,c:0,e:0,r:0,days:0};for(let n=a;n<=b;n++){const d=fromNum(n),h=hist[d];if(h){r.q+=h.q||0;r.c+=h.c||0;r.e+=h.e||0;r.r+=h.r||0}if(heroActive(d))r.days++}return r}
function stQ(keys,a,b){let q=0,c=0;keys.forEach(k=>{const Q=get(k).qd||{};for(const d in Q){const v=Q[d];if(!Array.isArray(v))continue;const n=dnum(d);if(n>=a&&n<=b){q+=v[0]||0;c+=v[1]||0}}});return {q,c}}
function stFacKeys(){const act=new Set(activeSems()),K=new Set();fac.discs.filter(d=>act.has(d.semId)).forEach(d=>topicKeysOf(discRefs(d)).forEach(k=>K.add(k)));return K}
function stSideOf(x,FK){const r=x.ref||"";if(r.startsWith("D:"))return "f";if(r.startsWith("T:")){const k=r.slice(2),it=BYKEY[k];if(!it)return "";return it.own?"f":FK.has(k)?"b":"r"}return ""}
function stTime(a,b,FK){const o={r:0,f:0,b:0,n:0,tot:0};foSess.forEach(x=>{const n=dnum(x.d);if(n<a||n>b)return;o[stSideOf(x,FK)||"n"]+=x.sec;o.tot+=x.sec});return o}
function stPerTopic(){const by={};foSess.forEach(x=>{const r=x.ref||"";if(!r.startsWith("T:"))return;const k=r.slice(2);if(!BYKEY[k]||BYKEY[k].own)return;by[k]=(by[k]||0)+x.sec});
  const L=Object.keys(by).filter(k=>get(k).last&&by[k]>=600).map(k=>by[k]).sort((a,b)=>a-b);return L.length<3?{sec:ST_TIP_DEF,n:L.length,est:true}:{sec:L[Math.floor(L.length/2)],n:L.length,est:false}}
function stFirst(){const d=[...Object.keys(hist).filter(heroActive),...foSess.map(x=>x.d)].sort()[0];return d?dnum(d):null}
function stTopicAct(keys,a,b){let nw=0,rv=0;keys.forEach(k=>{const ed=(get(k).ed||[]).slice().sort();ed.forEach((d,i)=>{const n=dnum(d);if(n<a||n>b)return;if(i===0)nw++;else rv++})});return {nw,rv}}
const stH=s=>s>=3600?(s/3600).toLocaleString("pt-BR",{maximumFractionDigits:1})+" h":Math.round(s/60)+" min";
const stHn=s=>(s/3600).toLocaleString("pt-BR",{maximumFractionDigits:1});
const stPct=x=>x===null||x===undefined?"—":Math.round(x*100)+"%";
const stMon=d=>{const M=["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];return M[+d.slice(5,7)-1]+" de "+d.slice(0,4)};
function stDelta(n,p,o={}){if(n===null||p===null||n===undefined||p===undefined)return ["","—"];const d=o.pts?Math.round((n-p)*100):n-p;if(!d)return ["eq","="];
  const good=o.lowGood?d<0:d>0;return [good?"up":"dn",(d>0?"▲ ":"▼ ")+Math.abs(d).toLocaleString("pt-BR")+(o.pts?(Math.abs(d)===1?" ponto":" pontos"):"")]}
function stTile(q,lvl,big,sub){const v=el(`<div class="stv ${lvl}"><span class="stq"></span><b></b><span class="sts"></span></div>`);v.querySelector(".stq").textContent=q;v.querySelector("b").textContent=big;v.querySelector(".sts").textContent=sub;return v}
function stCard(n,title,id){const c=el(`<section class="card stcard" id="${id}"><h2><span class="stn">${n}</span><span></span></h2><p class="stlead"></p></section>`);c.querySelector("h2 span:last-child").textContent=title;return c}
function stLead(c,html){c.querySelector(".stlead").innerHTML=html}
function stKpis(L){const k=el(`<div class="kpis stkpis"></div>`);L.forEach(([a,b,c])=>{const x=el(`<div class="kpi"><span class="kl"></span><b></b><span class="ks"></span></div>`);x.querySelector(".kl").textContent=a;x.querySelector("b").textContent=b;x.querySelector(".ks").textContent=c;k.appendChild(x)});return k}
function stRow(l,r){const x=el(`<div class="strow"><b></b><span class="how"></span></div>`);x.querySelector("b").textContent=l;x.querySelector("span").textContent=r||"";return x}
const svgEsc=t=>String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;");
/* barras por semana: vals [{v,lab,cur,tip}], meta (linha tracejada com rótulo), semana atual mais clara com "até hoje" */
/* largura do desenho = largura real do cartão (no computador, os gráficos ficam largos sem crescer o texto) */
function stW(){const v=document.getElementById("viewStats"),w=v&&v.clientWidth||0;if(!w)return 320;const c=twoCols()?w/2-56:w-40;return Math.max(320,Math.min(760,Math.round(c)))}
function stBars(vals,o={}){const W=stW(),H=128,P={l:26,r:6,t:14,b:22},n=vals.length,mx=Math.max(o.goal||0,...vals.map(x=>x.v),o.min||1)*1.12,bw=(W-P.l-P.r)/n,y=v=>P.t+(H-P.t-P.b)*(1-v/mx);
  let s=`<svg class="stsvg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${svgEsc(o.aria||"")}">`;
  [0,.5,1].forEach(f=>{const v=mx/1.12*f,yy=y(v);s+=`<line class="gl" x1="${P.l}" x2="${W-P.r}" y1="${yy}" y2="${yy}"/><text class="ax" x="${P.l-4}" y="${yy+3}" text-anchor="end">${svgEsc(o.fmt?o.fmt(v):Math.round(v))}</text>`});
  vals.forEach((x,i)=>{const h=Math.max(0,H-P.b-y(x.v)),xx=P.l+i*bw+bw*.18,w=bw*.64;s+=`<g class="stb${x.cur?" cur":""}"><title>${svgEsc(x.tip||"")}</title><rect x="${xx}" y="${H-P.b-h}" width="${w}" height="${h}" rx="2"/>`;
    if(o.split&&x.v2){const h2=Math.max(0,H-P.b-y(x.v2));s+=`<rect class="b2" x="${xx}" y="${H-P.b-h2}" width="${w}" height="${h2}" rx="2"/>`}
    s+=`<text class="ax" x="${xx+w/2}" y="${H-P.b+12}" text-anchor="middle">${svgEsc(x.cur?"até hoje":x.lab)}</text></g>`});
  if(o.goal){const yy=y(o.goal);s+=`<line class="goal" x1="${P.l}" x2="${W-P.r}" y1="${yy}" y2="${yy}"/><text class="goalt" x="${W-P.r}" y="${yy-4}" text-anchor="end">${svgEsc(o.goalLab||"meta")}</text>`}
  return el(s+`</svg>`)}
/* tempo × acerto por especialidade: x = horas, y = acerto, raio = questões */
function stQuad(pts,xm){const W=stW(),H=190,P={l:30,r:8,t:16,b:26},mx=Math.max(xm*2,...pts.map(p=>p.x),1)*1.1,y0=Math.min(.5,Math.floor((Math.min(...pts.map(p=>p.y))-.05)*10)/10),x=v=>P.l+(W-P.l-P.r)*v/mx,y=v=>P.t+(H-P.t-P.b)*(1-(v-y0)/(1-y0));
  let s=`<svg class="stsvg stquad" viewBox="0 0 ${W} ${H}" role="img" aria-label="Tempo e acerto por especialidade">`;
  const X=x(xm),Y=y(.7);s+=`<rect class="q1" x="${X}" y="${P.t}" width="${W-P.r-X}" height="${Y-P.t}"/><rect class="q2" x="${P.l}" y="${P.t}" width="${X-P.l}" height="${Y-P.t}"/><rect class="q3" x="${P.l}" y="${Y}" width="${X-P.l}" height="${H-P.b-Y}"/><rect class="q4" x="${X}" y="${Y}" width="${W-P.r-X}" height="${H-P.b-Y}"/>`;
  s+=`<text class="ql" x="${W-P.r-2}" y="${P.t-5}" text-anchor="end">funcionando</text><text class="ql" x="${P.l+2}" y="${P.t-5}">dá para manter</text><text class="ql" x="${P.l+4}" y="${H-P.b-5}">falta estudar</text><text class="ql bad" x="${W-P.r-4}" y="${H-P.b-5}" text-anchor="end">mudar o método</text>`;
  [...new Set([y0,.7,1])].forEach(v=>{s+=`<text class="ax" x="${P.l-4}" y="${y(v)+3}" text-anchor="end">${Math.round(v*100)}%</text>`});
  s+=`<text class="ax" x="${(W+P.l)/2}" y="${H-6}" text-anchor="middle">horas de foco no período →</text>`;
  pts.forEach(p=>{const r=Math.max(4,Math.min(12,3+Math.sqrt(p.q)));s+=`<g class="stpt ${p.cls}"><title>${svgEsc(p.tip)}</title><circle cx="${x(p.x)}" cy="${y(p.y)}" r="${r}"/></g>`});
  /* nomes numa lista por quadrante (rótulos no gráfico se sobrepõem) */
  const w=el(`<div class="stquadw"></div>`);w.appendChild(el(s+`</svg>`));const L=el(`<div class="stql"></div>`);
  [["q4","Mudar o método"],["q3","Falta estudar"],["q2","Dá para manter"],["q1","Funcionando"]].forEach(([k,lab])=>{const g=pts.filter(p=>p.cls===k).sort((a,b)=>b.x-a.x);if(!g.length)return;
    const r=el(`<p class="stqg ${k}"><i></i><b></b> <span></span></p>`);r.querySelector("b").textContent=lab+":";r.querySelector("span").textContent=g.map(p=>`${p.full} (${Math.round(p.y*100)}%, ${stH(p.x*3600)})`).join(" · ");L.appendChild(r)});
  w.appendChild(L);return w}
/* nota nas provas na íntegra ao longo do tempo, uma cor por banca */
function stExamLine(series){const W=stW(),H=130,P={l:30,r:8,t:10,b:22},all=series.flatMap(s=>s.pts),d0=Math.min(...all.map(p=>p.n)),d1=Math.max(...all.map(p=>p.n),d0+1),x=n=>P.l+(W-P.l-P.r)*(n-d0)/(d1-d0),y=v=>P.t+(H-P.t-P.b)*(1-v);
  let s=`<svg class="stsvg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Nota nas provas na íntegra">`;[.25,.5,.75,1].forEach(v=>{s+=`<line class="gl" x1="${P.l}" x2="${W-P.r}" y1="${y(v)}" y2="${y(v)}"/><text class="ax" x="${P.l-4}" y="${y(v)+3}" text-anchor="end">${v*100}%</text>`});
  series.forEach((S,i)=>{const L=S.pts.sort((a,b)=>a.n-b.n);s+=`<g class="stser c${i%4}"><polyline points="${L.map(p=>x(p.n)+","+y(p.v)).join(" ")}"/>${L.map(p=>`<circle cx="${x(p.n)}" cy="${y(p.v)}" r="3.5"><title>${svgEsc(S.name+" · "+p.t+": "+Math.round(p.v*100)+"%")}</title></circle>`).join("")}</g>`});
  s+=`<text class="ax" x="${P.l}" y="${H-6}">${svgEsc(br(fromNum(d0)))}</text><text class="ax" x="${W-P.r}" y="${H-6}" text-anchor="end">${svgEsc(br(fromNum(d1)))}</text>`;
  const sv=el(s+`</svg>`),w=el(`<div class="stexam"></div>`);w.appendChild(sv);const lg=el(`<div class="stleg"></div>`);series.forEach((S,i)=>{const b=el(`<span class="c${i%4}"><i></i></span>`);b.append(S.name);lg.appendChild(b)});w.appendChild(lg);return w}
function stGoSpec(code,sp){tf.area=code;tf.sp=sp;openAreas.add(code);openSpecs.add(code+":"+sp);tSeg="lista";try{localStorage.setItem("resid-tseg","lista")}catch(e){}backStack=[];setView("temas")}
function stAdjWeek(){wpTab="cur";goSub("config");setTimeout(()=>{const b=$("#wpCard");if(b)b.scrollIntoView({block:"center",behavior:"smooth"})},80)}
/* modelo de cada lado (usado pela página e pelo resumo do menu) */
function stRes(D){const t=dnum(today()),a=t-D+1,pa=a-D,pb=a-1,FK=stFacKeys(),keys=ALL.map(i=>i.key);
  const H=stHist(a,t),HP=stHist(pa,pb),Q=stQ(keys,a,t),QP=stQ(keys,pa,pb),acc=Q.q>=10?Q.c/Q.q:null,accP=QP.q>=10?QP.c/QP.q:null;
  const still=errors.filter(e=>BYKEY[e.k]&&!BYKEY[e.k].own&&e.lastMiss&&dnum(e.lastMiss)>=a).length,stillP=errors.filter(e=>BYKEY[e.k]&&!BYKEY[e.k].own&&e.lastMiss&&dnum(e.lastMiss)>=pa&&dnum(e.lastMiss)<=pb).length;
  const M=projModel(),PT=stPerTopic(),wk=stWeeks(8,FK);
  const per=D/7,T=stTime(a,t,FK),hW=T.tot/per,goal=(ui.prefs.hgoal||600)*60;
  /* direção: tempo nos temas da residência de incidência alta ou muito alta */
  let tTop=0,tHi=0;const bySp={};foSess.forEach(x=>{const n=dnum(x.d);if(n<a||n>t)return;const r=x.ref||"";if(!r.startsWith("T:"))return;const it=BYKEY[r.slice(2)];if(!it||it.own)return;tTop+=x.sec;if(wOf(it)>=2)tHi+=x.sec;const sk=spKey(it);bySp[sk]=(bySp[sk]||0)+x.sec});
  const sps=[];AREAS.forEach(A=>A.specs.forEach(S=>{const k=A.code+":"+S.name,ks=S.items.map(i=>i.key),q=stQ(ks,a,t),left=S.items.filter(i=>!get(i.key).last&&!isIng(get(i.key))),inc=left.reduce((s,i)=>s+wOf(i),0);
    sps.push({A,S,k,sec:bySp[k]||0,q:q.q,c:q.c,acc:q.q>=5?q.c/q.q:null,left:left.length,inc})}));
  /* retenção nas revisões (histórico s.rv, desde 13/11/2026): só temas da residência */
  const RV=topicRevs().filter(e=>BYKEY[e.k]&&!BYKEY[e.k].own),RT=revStats(RV,fromNum(a),fromNum(t)),RTP=revStats(RV,fromNum(pa),fromNum(pb));
  return {t,a,pa,pb,D,H,HP,Q,QP,acc,accP,still,stillP,M,PT,wk,T,hW,goal,tTop,tHi,sps,FK,RT,RTP}}
function stWeeks(n,FK){const ws=foWeekStart(),t=dnum(today()),out=[];for(let i=n-1;i>=0;i--){const s=ws-7*i,e=Math.min(s+6,t);out.push({s,e,cur:i===0,H:stHist(s,e),T:stTime(s,e,FK),plan:wpArr(s).reduce((x,m)=>x+m,0)*60})}return out}
function stVerdRes(R){const out=[];
  if(R.acc===null)out.push(["Como estou indo","na","Poucos dados",`Faça pelo menos 10 questões em ${R.D} dias`]);
  else if(R.accP===null)out.push(["Como estou indo","na",`${stPct(R.acc)} de acerto`,"Sem o período anterior para comparar"]);
  else{const d=Math.round((R.acc-R.accP)*100);out.push(["Como estou indo",d>=3?"ok":d<=-3?"bad":"ok",d>=3?"Melhorando":d<=-3?"Piorando":"Estável",`Acerto ${stPct(R.accP)} → ${stPct(R.acc)}`])}
  const M=R.M;if(M.end===null)out.push(["Chego a tempo?","na","Sem data de prova",M.endPace?`No ritmo atual: ${stMon(M.endPace)}`:"Cadastre a prova no Perfil"]);
  else if(!M.left)out.push(["Chego a tempo?","ok","Todos vistos","Agora é revisar e treinar"]);
  else{const r=M.need?M.pace/M.need:1,f=Math.max(0,M.need-M.pace);out.push(["Chego a tempo?",r>=1?"ok":r>=.8?"warn":"bad",r>=1?"No ritmo":r>=.8?"Apertado":"Atrasado",r>=1?`${M.pace.toLocaleString("pt-BR",{maximumFractionDigits:1})} temas/semana`:`Faltam ${f.toLocaleString("pt-BR",{maximumFractionDigits:1})} tema/semana`])}
  {const r=R.goal?R.hW/R.goal:0;out.push(["Estudo suficiente?",!R.T.tot?"na":r>=.9?"ok":r>=.6?"warn":"bad",!R.T.tot?"Sem Foco":r>=.9?"Sim":r>=.6?"Quase":"Abaixo",!R.T.tot?"Use o Foco para medir o tempo":`${stH(R.hW)} por semana de ${stH(R.goal)}`])}
  {const r=R.tTop?R.tHi/R.tTop:0;out.push(["Tenho direção?",R.tTop<7200?"na":r>=.6?"ok":r>=.4?"warn":"bad",R.tTop<7200?"Poucos dados":r>=.6?"Boa":r>=.4?"Dá para melhorar":"Dispersa",R.tTop<7200?"Ligue as sessões do Foco aos temas":`${stPct(r)} do tempo no que mais cai`])}
  return out}
function stFac(D){const t=dnum(today()),a=t-D+1,pa=a-D,pb=a-1,FK=stFacKeys(),keys=[...FK],act=new Set(activeSems()),ds=fac.discs.filter(d=>act.has(d.semId));
  const Q=stQ(keys,a,t),QP=stQ(keys,pa,pb),acc=Q.q>=10?Q.c/Q.q:null,accP=QP.q>=10?QP.c/QP.q:null,TA=stTopicAct(keys,a,t),TP=stTopicAct(keys,pa,pb);
  const notas=fac.provas.filter(p=>p.res&&!p.res.skip&&typeof p.res.n==="number").map(p=>({p,v:p.res.n/(p.res.of||10),d:p.res.d||p.date})).sort((x,y)=>x.d<y.d?-1:1);
  const up=upcomingProvas().filter(p=>daysTo(p.date)<=30).map(p=>({p,st:provaStats(p)})),fe=spFechas(30);
  const PT=stPerTopic(),pend=up.reduce((s,x)=>s+x.st.pend.length,0),needSec=pend*PT.sec;
  const T=stTime(a,t,FK),per=D/7,facSec=T.f+T.b,wk=stWeeks(8,FK),discT=ds.map(d=>({d,s:discFocusSec(d,a)})).sort((x,y)=>y.s-x.s);
  /* direção: tempo da faculdade nos conteúdos das provas dos próximos 30 dias */
  const upK=new Set(up.flatMap(x=>topicKeysOf(x.p.items)));let tUp=0;foSess.forEach(x=>{const n=dnum(x.d);if(n<a||n>t)return;const r=x.ref||"";if(r.startsWith("T:")&&upK.has(r.slice(2)))tUp+=x.sec;else if(r.startsWith("D:")&&up.some(u=>provaDids(u.p).includes(r.slice(2))))tUp+=x.sec});
  /* Lote 18: o semestre inteiro (desde o 1º foco ou a 1ª prova dele, no máximo 6 meses): tempo × nota por disciplina e quanto da faculdade avançou a residência */
  const semA=(()=>{const ids=new Set(ds.map(d=>d.id)),dk=new Set(keys);let m=t;fac.provas.forEach(p=>{if(provaDids(p).some(id=>ids.has(id)))m=Math.min(m,dnum(p.date)-30)});
    foSess.forEach(x=>{const r=x.ref||"";if(r.startsWith("D:")&&ids.has(r.slice(2))||r.startsWith("T:")&&dk.has(r.slice(2)))m=Math.min(m,dnum(x.d))});return Math.max(m,t-182)})();
  const semT=stTime(semA,t,FK),sem=ds.map(d=>{const N=fac.provas.filter(p=>provaDids(p).includes(d.id)&&p.res&&!p.res.skip&&typeof p.res.n==="number").map(p=>p.res.n/(p.res.of||10));
    return {d,s:discFocusSec(d,semA),n:N.length,v:N.length?N.reduce((a,b)=>a+b,0)/N.length:null}}).filter(x=>x.s||x.n).sort((x,y)=>(y.v??-1)-(x.v??-1)||y.s-x.s);
  return {t,a,D,Q,QP,acc,accP,TA,TP,notas,up,fe,PT,pend,needSec,T,per,facSec,wk,discT,tUp,ds,semA,semT,sem}}
function stVerdFac(F){const out=[],last=F.notas.slice(-3);
  if(!last.length)out.push(["Como estou indo","na","Sem notas",F.acc!==null?`${stPct(F.acc)} de acerto nas questões`:"Registre a nota depois da prova"]);
  else{const m=last.reduce((s,x)=>s+x.v,0)/last.length;out.push(["Como estou indo",m>=.7?"ok":m>=.5?"warn":"bad",`Média ${(m*10).toLocaleString("pt-BR",{maximumFractionDigits:1})}`,`nas últimas ${last.length===1?"prova":last.length+" provas"}`])}
  const nx=F.up[0];if(!nx)out.push(["Chego a tempo?","na","Sem provas",`Nada nos próximos 30 dias`]);
  else out.push(["Chego a tempo?",nx.st.lvl,nx.st.lvl==="ok"?"No ritmo":nx.st.lvl==="warn"?"Apertado":"Atrasado",`${nx.p.name}: ${nx.st.done} de ${nx.st.tot} prontos · ${inLabel(nx.st.dd)}`]);
  {const wkSec=F.facSec/F.per,dd=nx?Math.max(1,nx.st.dd):0,needW=nx?F.needSec/Math.max(1,dd/7):0;
    out.push(["Estudo suficiente?",!F.pend?"na":!F.facSec?"bad":wkSec>=needW*.9?"ok":wkSec>=needW*.6?"warn":"bad",!F.pend?"Nada pendente":!F.facSec?"Sem Foco":wkSec>=needW*.9?"Sim":wkSec>=needW*.6?"Quase":"Abaixo",!F.pend?"Para as provas dos próximos 30 dias":`${stH(wkSec)}/semana de ~${stH(needW)} necessárias`])}
  {const r=F.facSec?F.tUp/F.facSec:0;out.push(["Tenho direção?",!F.up.length||F.facSec<3600?"na":r>=.6?"ok":r>=.35?"warn":"bad",!F.up.length?"Sem provas":F.facSec<3600?"Poucos dados":r>=.6?"Boa":r>=.35?"Dá para melhorar":"Dispersa",!F.up.length?"Nada nos próximos 30 dias":F.facSec<3600?"Ligue o Foco às disciplinas":`${stPct(r)} do tempo no que vai cair`])}
  return out}
function renderStats(){const box=$("#stBody");if(!box)return;box.innerHTML="";
  const top=el(`<div class="sttop"><div><h2 class="sttitle">Estatísticas</h2><p class="how stsub">Como você está indo, se chega a tempo, se o estudo é suficiente e se tem direção.</p></div><div class="stctl"><div class="seg" role="group" aria-label="Lado"></div><div class="seg stper" role="group" aria-label="Período"></div></div></div>`);
  const [sg,pg]=top.querySelectorAll(".seg");[["res","Residência"],["fac","Faculdade"]].forEach(([v,l])=>{const b=el(`<button type="button"></button>`);b.id="stSide-"+v;b.textContent=l;b.setAttribute("aria-pressed",stSide===v);b.onclick=()=>{stSide=v;lsSet("resid-stside",v);render()};sg.appendChild(b)});
  [7,30,90].forEach(v=>{const b=el(`<button type="button"></button>`);b.id="stPer-"+v;b.textContent=v+" dias";b.setAttribute("aria-pressed",stPer===v);b.onclick=()=>{stPer=v;lsSet("resid-stper",String(v));render()};pg.appendChild(b)});
  box.appendChild(top);
  const f0=stFirst(),age=f0===null?0:dnum(today())-f0;if(age<ST_LOW_DAYS)box.appendChild(el(`<p class="stlow" id="stLow">Ainda poucos dados${f0===null?"":` (${age+1} ${age?"dias":"dia"} de uso)`}: as comparações e tendências ficam confiáveis depois de 3 a 4 semanas usando o app e o Foco.</p>`));
  const v=el(`<div class="stverd" id="stVerd"></div>`),g=el(`<div class="stgrid"></div>`);box.appendChild(v);box.appendChild(g);
  if(stSide==="res"){const R=stRes(stPer);stVerdRes(R).forEach(x=>v.appendChild(stTile(...x)));stResBlocks(R).forEach(c=>g.appendChild(c))}
  else{const F=stFac(stPer);stVerdFac(F).forEach(x=>v.appendChild(stTile(...x)));stFacBlocks(F).forEach(c=>g.appendChild(c))}
  const ft=el(`<div class="stfoot"><button class="btn" type="button" id="stPdf">Exportar PDF</button><span class="how hx">O tempo vem das sessões do Foco. Estudo sem o Foco não entra nas horas.</span></div>`);
  ft.querySelector("button").onclick=()=>{pdfOpt.open=true;pdfOpt.msg="";goSub("perfil");setTimeout(()=>{const b=$(".pdfpan");if(b)b.scrollIntoView({block:"center",behavior:"smooth"})},80)};box.appendChild(ft)}
function stTable(rows){const t=el(`<table class="sttab"><tbody></tbody></table>`),tb=t.querySelector("tbody");rows.forEach(([l,v,dl])=>{const r=el(`<tr><td></td><td class="stv1"></td><td class="std"></td></tr>`);r.children[0].textContent=l;r.children[1].textContent=v;r.children[2].textContent=dl[1];if(dl[0])r.children[2].classList.add(dl[0]);tb.appendChild(r)});return t}
function stResBlocks(R){const out=[],per=`${R.D} dias`;
  /* 1. como estou indo */
  {const c=stCard(1,"Como estou indo","stB1"),dA=stDelta(R.acc,R.accP,{pts:true}),dQ=stDelta(R.Q.q,R.QP.q),dE=stDelta(R.H.e,R.HP.e),dR=stDelta(R.H.r,R.HP.r),dS=stDelta(R.still,R.stillP,{lowGood:true});
    const parts=[];if(dA[0]==="up")parts.push("<strong>acertou mais</strong>");else if(dA[0]==="dn")parts.push("<strong>acertou menos</strong>");if(dQ[0])parts.push(dQ[0]==="up"?"fez mais questões":"fez menos questões");if(dE[0])parts.push(dE[0]==="up"?"estudou <strong>mais temas novos</strong>":"estudou <strong>menos temas novos</strong>");
    stLead(c,parts.length?`Nos últimos ${per}, comparado aos ${per} anteriores, você ${parts.join(", ").replace(/, ([^,]*)$/," e $1")}.`:`Nos últimos ${per}: ${R.Q.q} questões e ${R.H.e} temas novos.`);
    c.appendChild(stTable([["Acerto nas questões",stPct(R.acc),dA],["Questões feitas",R.Q.q.toLocaleString("pt-BR"),dQ],["Temas novos estudados",String(R.H.e),dE],["Revisões feitas",String(R.H.r),dR],["Retenção nas revisões",R.RT.n>=10?stPct(R.RT.g2/R.RT.n):"—",stDelta(R.RT.n>=10?R.RT.g2/R.RT.n:null,R.RTP.n>=10?R.RTP.g2/R.RTP.n:null,{pts:true})],["Erros que você ainda erraria",String(R.still),dS]]));
    {const ret=el(`<p class="how" id="stRet"></p>`),rt=R.RT,pc=(x)=>Math.round(x.g2/x.n*100)+"%";
      ret.textContent=rt.n<10?"Poucas revisões registradas ainda (o histórico começou em 13/11/2026).":`Retenção = revisões em que você tocou Lembrei. ${rt.ok.n>=5?"No prazo: "+pc(rt.ok):""}${rt.ok.n>=5&&rt.late.n>=5?" · ":""}${rt.late.n>=5?"Atrasadas: "+pc(rt.late):""}${rt.ok.n<5&&rt.late.n<5?"Ainda poucas para separar no prazo e atrasadas.":""}`;c.appendChild(ret)}
    c.appendChild(el(`<p class="how stnote hx">"Errei" = erros do caderno que você errou de novo na revisão no período. Menos é melhor.</p>`));
    const ser={};exams.forEach(ex=>{const P=exProg.find(x=>x.id===ex.id);if(!P)return;(P.tries||[]).forEach(tr=>{if(!tr.n)return;const b=ex.banca||"Outras";(ser[b]=ser[b]||[]).push({n:dnum(tr.d),v:tr.hit/tr.n,t:ex.name})})});
    const S=Object.keys(ser).map(name=>({name,pts:ser[name]}));c.appendChild(stRow("Nota nas provas na íntegra","cada ponto é uma prova terminada"));
    if(S.reduce((s,x)=>s+x.pts.length,0)>=2)c.appendChild(stExamLine(S));else c.appendChild(el(`<p class="how stempty">Termine pelo menos duas provas na íntegra (Questões › Provas na íntegra) para ver a nota ao longo do tempo.</p>`));
    out.push(c)}
  /* 2. vou chegar a tempo */
  {const c=stCard(2,"Vou chegar a tempo?","stB2"),M=R.M,seen=TOTAL-M.left,fmt=x=>x.toLocaleString("pt-BR",{maximumFractionDigits:1});
    stLead(c,M.end!==null?(M.endPace?`No ritmo atual você termina de ver os ${TOTAL} temas em <strong>${stMon(M.endPace)}</strong>. A prova principal${M.main&&M.main.name?` (${svgEsc(M.main.name)})`:""} é em <strong>${stMon(M.main.date)}</strong>.`:`Nas últimas 4 semanas nenhum tema novo foi estudado. A prova principal é em <strong>${stMon(M.main.date)}</strong>.`)
      :M.endPace?`Sem data de prova: no ritmo atual você vê todos os temas por volta de <strong>${stMon(M.endPace)}</strong>. Cadastre a prova no Perfil para saber o ritmo necessário.`:"Cadastre a prova principal no Perfil e estude alguns temas para ver a projeção.");
    const sb=el(`<div class="stseen"><div class="strow"><span>Temas já vistos</span><b></b></div><div class="meter"><i></i></div></div>`);sb.querySelector("b").textContent=`${seen} de ${TOTAL}`;sb.querySelector("i").style.width=seen/TOTAL*100+"%";c.appendChild(sb);
    c.appendChild(stKpis([["Seu ritmo",fmt(M.pace),"temas/semana (4 sem.)"],["Necessário",M.need!==null?fmt(M.need):"—",M.need!==null?"temas/semana":"sem data de prova"],["Ficam de fora",M.end!==null?String(M.out):"—",M.end!==null?"temas, se nada mudar":"sem data de prova"]]));
    c.appendChild(stRow("Temas novos por semana",M.need?"linha = o necessário":""));
    c.appendChild(stBars(R.wk.map(w=>({v:w.H.e,lab:br(fromNum(w.s)),cur:w.cur,tip:`Semana de ${br(fromNum(w.s))}: ${w.H.e} temas novos`})),{goal:M.need||0,goalLab:M.need?`necessário ${fmt(M.need)}`:"",aria:"Temas novos por semana nas últimas 8 semanas",min:3}));
    const nx=upcomingProvas()[0];if(nx){const st=provaStats(nx),r=el(`<div class="strow stfacnx"><span></span><span class="stpill"></span></div>`);r.children[0].innerHTML=`<b>Faculdade:</b> ${svgEsc(nx.name)} ${svgEsc(inLabel(st.dd))}`;r.children[1].textContent=st.tot?`${st.done} de ${st.tot} conteúdos prontos`:"sem conteúdo marcado";r.children[1].classList.add("p-"+st.lvl);c.appendChild(r)}
    out.push(c)}
  /* 3. estou estudando o suficiente */
  {const c=stCard(3,"Estou estudando o suficiente?","stB3"),M=R.M,rate=M.need!==null?M.need:M.pace||M.cap,needW=rate*R.PT.sec,cw=R.wk[R.wk.length-1],t=dnum(today());
    let planSoFar=0;for(let n=cw.s;n<=t;n++)planSoFar+=dayMin(n)*60;
    stLead(c,`Para ${M.need!==null?"chegar a tempo":"manter o ritmo"}, você precisa de cerca de <strong>${stH(needW)} por semana</strong> só para temas novos (${rate.toLocaleString("pt-BR",{maximumFractionDigits:1})} temas × ${stH(R.PT.sec)} por tema${R.PT.est?", estimativa padrão até o Foco medir 3 temas":", medido no seu Foco"}). Sua meta: <strong>${stH(R.goal)}</strong>. Nesta semana: planejou ${stH(cw.plan)}, fez <strong>${stH(cw.T.tot)}</strong>.`);
    c.appendChild(stRow("Horas de estudo por semana","escuro = residência · claro = só faculdade"));
    c.appendChild(stBars(R.wk.map(w=>({v:w.T.tot/3600,v2:w.T.f/3600,lab:br(fromNum(w.s)),cur:w.cur,tip:`Semana de ${br(fromNum(w.s))}: ${stH(w.T.tot)} (planejado ${stH(w.plan)})`})),{goal:R.goal/3600,goalLab:`meta ${stH(R.goal)}`,fmt:v=>Math.round(v)+"h",split:true,aria:"Horas de estudo por semana",min:2}));
    const qg=ui.prefs.qgoal||0,days=R.H.days;
    c.appendChild(stKpis([["Horas nesta semana",stH(cw.T.tot),`de ${stH(planSoFar)} planejadas até hoje`],["Questões na semana",String(cw.H.q),qg?`meta ${qg}`:"sem meta"],["Dias estudados",`${days} de ${R.D}`,`sequência: ${streak()}`]]));
    {const a0=t-R.D+1,L=foSess.filter(x=>dnum(x.d)>=a0&&dnum(x.d)<=t);if(L.some(x=>x.m==="x")){const G=foGroups(L,"tp"),T=foSum(L);/* Lote 21: para onde foi o tempo, pelo tipo */
      c.appendChild(stRow("Tempo por tipo",`últimos ${R.D} dias`));const w=el(`<div class="sttp" id="stTp"></div>`);w.innerHTML=G.slice(0,8).map(g=>`<div class="vrow"><div class="vtop"><span class="vl">${esc(g.lab)}</span><span class="hv">${stH(g.sec)}</span><span class="hn">${Math.round(g.sec/T*100)}%</span></div><div class="hbar track1"><i style="width:${Math.max(g.sec/G[0].sec*100,1)}%;background:var(--accent)"></i></div></div>`).join("");c.appendChild(w)}}
    const adj=el(`<div class="btns"><button class="btn" type="button" id="stAdj">Ajustar a semana</button></div>`);adj.querySelector("button").onclick=stAdjWeek;c.appendChild(adj);
    out.push(c)}
  /* 4. tenho direção */
  {const c=stCard(4,"Tenho direção?","stB4"),r=R.tTop?R.tHi/R.tTop:null,pts=R.sps.filter(s=>s.sec>=1800&&s.acc!==null),xm=pts.length?pts.map(p=>p.sec/3600).sort((a,b)=>a-b)[Math.floor(pts.length/2)]:1;
    const cls=s=>{const hiT=s.sec/3600>=xm,hiA=s.acc>=.7;return hiT&&hiA?"q1":!hiT&&hiA?"q2":!hiT?"q3":"q4"};
    const bad=pts.filter(s=>cls(s)==="q4").sort((a,b)=>b.sec-a.sec)[0];
    stLead(c,r===null?"Ligue as sessões do Foco aos temas (escolha o tema ao começar) para ver para onde vai o seu tempo.":`<strong>${stPct(r)}</strong> do seu tempo nos temas foi para os de incidência alta ou muito alta.${bad?` Onde agir: <strong>${svgEsc(bad.S.name)}</strong> (muito tempo, acerto baixo).`:""}`);
    c.appendChild(stRow("Tempo × acerto por especialidade","só com 30 min de foco e 5 questões no período · tamanho = questões"));
    if(pts.length>=2)c.appendChild(stQuad(pts.map(s=>({x:s.sec/3600,y:s.acc,q:s.q,cls:cls(s),full:s.S.name,tip:`${s.S.name}: ${stH(s.sec)} de foco, ${stPct(s.acc)} em ${s.q} questões`})),xm));
    else c.appendChild(el(`<p class="how stempty">Ainda poucos dados: precisa de pelo menos 2 especialidades com 30 min de foco e 5 questões no período.</p>`));
    const fx=el(`<div class="stfocus"><b>Foco sugerido para esta semana</b></div>`),add=(t,s,lab,fn,ghost)=>{const x=el(`<div class="stfi"><div class="stft"><b></b><small></small></div><button class="btn${ghost?"":" primary"}" type="button"></button></div>`);x.querySelector("b").textContent=t;x.querySelector("small").textContent=s;x.querySelector("button").textContent=lab;x.querySelector("button").onclick=fn;fx.appendChild(x)};
    if(bad)add(`${bad.S.name}: mudar o método`,`${stH(bad.sec)} de foco, ${stPct(bad.acc)} em ${bad.q} questões · tente questões antes de reler`,"Ver temas",()=>stGoSpec(bad.A.code,bad.S.name));
    const miss=R.sps.filter(s=>s.left&&s.sec<3600&&!(bad&&s.k===bad.k)).sort((a,b)=>b.inc-a.inc)[0];
    if(miss)add(`${miss.S.name}: falta estudar`,`${miss.left} ${miss.left===1?"tema":"temas"} por ver${miss.sec?`, só ${stH(miss.sec)} no período`:", nada no período"}`,"Ver temas",()=>stGoSpec(miss.A.code,miss.S.name));
    const due=dueCount();if(due)add(`${due} ${due===1?"revisão pendente":"revisões pendentes"}`,"revisão em dia segura o que você já estudou","Revisar agora",()=>goRevs(),true);
    else{const wk=focusRank()[0];if(wk)add(`Onde focar: ${wk.t}`,`${pct(get(wk.key).qc||0,get(wk.key).qt||0)}% em ${get(wk.key).qt} questões`,"Abrir tema",()=>openTopic(wk.key),true)}
    if(fx.children.length>1)c.appendChild(fx);
    out.push(c)}
  return out}
function stFacBlocks(F){const out=[],per=`${F.D} dias`;
  /* 1. notas */
  {const c=stCard(1,"Como estou indo","stF1"),dA=stDelta(F.acc,F.accP,{pts:true});
    stLead(c,F.notas.length?`Suas notas nas provas da faculdade e o acerto nas questões dos conteúdos da faculdade nos últimos ${per}.`:"Depois de cada prova, registre a nota no painel Próximas provas (Faculdade) para acompanhar aqui.");
    c.appendChild(stTable([["Acerto nas questões (conteúdos FAC)",stPct(F.acc),dA],["Questões feitas",String(F.Q.q),stDelta(F.Q.q,F.QP.q)],["Conteúdos estudados",String(F.TA.nw),stDelta(F.TA.nw,F.TP.nw)],["Revisões feitas",String(F.TA.rv),stDelta(F.TA.rv,F.TP.rv)]]));
    if(F.notas.length){const L=el(`<div class="stnotas"></div>`);F.notas.slice(-8).reverse().forEach(x=>{const r=el(`<div class="stnr"><span class="stnn"></span><div class="meter"><i></i></div><b></b></div>`);r.querySelector(".stnn").textContent=`${x.p.name} · ${provaDiscName(x.p)}`;
      r.querySelector("i").style.width=Math.min(100,x.v*100)+"%";r.querySelector("i").className=x.v>=.7?"ok":x.v>=.5?"warn":"bad";r.querySelector("b").textContent=`${(+x.p.res.n).toLocaleString("pt-BR")} / ${x.p.res.of||10}`;L.appendChild(r)});c.appendChild(stRow("Notas das provas","as mais recentes primeiro"));c.appendChild(L)}
    c.appendChild(el(`<p class="how stnote hx">Conteúdo da faculdade ligado a um tema da residência tem um progresso só e conta nos dois lados.</p>`));out.push(c)}
  /* 2. provas e fechamentos */
  {const c=stCard(2,"Vou chegar a tempo?","stF2");stLead(c,F.up.length||F.fe.length?"Quanto de cada prova e fechamento dos próximos 30 dias já está pronto, comparado aos dias que faltam.":"Nenhuma prova nem fechamento de SP nos próximos 30 dias.");
    const L=el(`<div class="stprov"></div>`);F.up.forEach(({p,st})=>{const r=el(`<div class="stpr"><div class="strow"><b></b><span class="stpill"></span></div><div class="meter"><i></i></div><span class="how"></span></div>`);r.querySelector("b").textContent=p.name;
      const pl=r.querySelector(".stpill");pl.textContent=inLabel(st.dd);pl.classList.add("p-"+st.lvl);r.querySelector("i").style.width=(st.tot?st.done/st.tot*100:0)+"%";r.querySelector(".how").textContent=`${st.done} de ${st.tot} prontos · ${provaRitmo(st)}`;L.appendChild(r)});
    F.fe.forEach(f=>{const r=el(`<div class="stpr"><div class="strow"><b></b><span class="stpill"></span></div><span class="how"></span></div>`);r.querySelector("b").textContent=`Fechamento: ${spShort(f.s.name)}`;r.querySelector(".stpill").textContent=inLabel(daysTo(f.s.fech));r.querySelector(".how").textContent=f.d.name;L.appendChild(r)});
    if(L.children.length)c.appendChild(L);out.push(c)}
  /* 3. tempo por disciplina */
  {const c=stCard(3,"Estou estudando o suficiente?","stF3"),wkSec=F.facSec/F.per;
    stLead(c,F.pend?`Faltam <strong>${F.pend}</strong> ${F.pend===1?"conteúdo":"conteúdos"} das provas dos próximos 30 dias: cerca de <strong>${stH(F.needSec)}</strong> (${stH(F.PT.sec)} por conteúdo${F.PT.est?", estimativa padrão":", medido no seu Foco"}). Você está fazendo ${stH(wkSec)} por semana na faculdade.`:`Você está fazendo ${stH(wkSec)} por semana na faculdade.`);
    if(F.discT.length){const mx=Math.max(1,...F.discT.map(x=>x.s));const L=el(`<div class="stdisc"></div>`);F.discT.forEach(x=>{const r=el(`<div class="stnr"><span class="stnn"></span><div class="meter"><i></i></div><b></b></div>`);r.querySelector(".stnn").textContent=x.d.name;r.querySelector("i").style.width=x.s/mx*100+"%";r.querySelector("b").textContent=stH(x.s);L.appendChild(r)});
      c.appendChild(stRow("Foco por disciplina",`últimos ${per}`));c.appendChild(L)}else c.appendChild(el(`<p class="how stempty">Nenhuma disciplina ativa.</p>`));
    /* resumo do semestre: tempo × nota em cada disciplina */
    if(F.sem.length){c.appendChild(stRow("Resumo do semestre",`tempo de foco × nota, desde ${br(fromNum(F.semA))}`));const L=el(`<div class="stsem" id="stSem"></div>`),wn=F.sem.filter(x=>x.n&&x.s>=3*3600);
      const best=wn.length>1?wn.reduce((a,b)=>a.v/a.s>=b.v/b.s?a:b):null,heavy=F.sem.filter(x=>x.n&&x.v<.6).sort((a,b)=>b.s-a.s)[0];
      const smx=Math.max(1,...F.sem.map(x=>x.s));L.appendChild(el(`<div class="stsh" aria-hidden="true"><span>Disciplina</span><span>Foco</span><span>Nota média</span></div>`));
      F.sem.forEach(x=>{const r=el(`<div class="stsr"><div class="stsn"><b></b><span class="stsb"></span></div><div class="stst"><b></b><span class="stsm"><i></i></span></div><div class="stsv"><b></b><small></small><span class="stsm"><i></i></span></div></div>`);
        r.querySelector(".stsn b").textContent=x.d.name;r.querySelector(".stst b").textContent=x.s?stH(x.s):"–";r.querySelector(".stst i").style.width=Math.round(x.s/smx*100)+"%";
        const v=r.querySelector(".stsv");if(x.n){v.querySelector("b").textContent=`${Math.round(x.v*100)}%`;v.querySelector("small").textContent=x.n>1?`${x.n} provas`:"1 prova";v.classList.add(x.v>=.7?"ok":x.v>=.5?"warn":"bad");v.querySelector("i").style.width=Math.round(x.v*100)+"%"}
        else{v.querySelector("b").textContent="–";v.querySelector("small").textContent="sem nota";v.querySelector(".stsm").remove()}
        const bd=r.querySelector(".stsb");if(best&&x===best){bd.textContent="mais resultado por hora";bd.classList.add("good")}else if(heavy&&x===heavy){bd.textContent="nota baixa: rever o jeito de estudar";bd.classList.add("bad")}else bd.remove();L.appendChild(r)});
      c.appendChild(L);if(!F.sem.some(x=>x.n))c.appendChild(el(`<p class="how stnote">Registre as notas das provas (Faculdade › Próximas provas, depois da prova) para comparar o tempo com o resultado.</p>`))}
    const adj=el(`<div class="btns"><button class="btn" type="button" id="stAdjF">Ajustar a semana</button></div>`);adj.querySelector("button").onclick=stAdjWeek;c.appendChild(adj);out.push(c)}
  /* 4. divisão do tempo */
  {const c=stCard(4,"Tenho direção?","stF4"),T=F.T,tot=T.r+T.f+T.b+T.n;
    stLead(c,tot?`Nos últimos ${per}: ${stH(tot)} de foco. O que é das duas (conteúdo da faculdade ligado à residência) <strong>vale duas vezes</strong>: avança a prova e a residência ao mesmo tempo.`:"Use o Foco ligado a temas e disciplinas para ver a divisão do tempo.");
    if(tot){const bar=el(`<div class="stsplit" role="img"></div>`),L=[["r","Só residência",T.r],["b","As duas",T.b],["f","Só faculdade",T.f],["n","Sem tema",T.n]].filter(x=>x[2]);bar.setAttribute("aria-label",L.map(x=>`${x[1]} ${stH(x[2])}`).join(", "));
      L.forEach(([k,l,s])=>{const i=el(`<i class="sp-${k}"></i>`);i.style.width=s/tot*100+"%";i.title=`${l}: ${stH(s)}`;bar.appendChild(i)});c.appendChild(bar);
      const lg=el(`<div class="stleg"></div>`);L.forEach(([k,l,s])=>{const x=el(`<span class="sp-${k}"><i></i></span>`);x.append(`${l} · ${stH(s)} (${Math.round(s/tot*100)}%)`);lg.appendChild(x)});c.appendChild(lg)}
    /* quanto da faculdade já conta para a residência, no semestre */
    {const S=F.semT,fs=S.f+S.b;if(fs){const pc=Math.round(S.b/fs*100),x=el(`<div class="stfr" id="stFacRes"><b></b><span></span><div class="meter"><i></i></div></div>`);x.querySelector("b").textContent=`${pc}%`;
      x.querySelector("span").textContent=`No semestre, ${pc}% do que você estudou na faculdade (${stH(S.b)} de ${stH(fs)}) também avançou temas da residência.${pc<30?" Ligar mais conteúdos da faculdade aos temas da residência faz esse tempo valer duas vezes.":""}`;x.querySelector("i").style.width=pc+"%";c.appendChild(x)}}
    out.push(c)}
  return out}
