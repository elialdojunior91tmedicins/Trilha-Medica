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
