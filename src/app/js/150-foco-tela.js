/* ----- tela ----- */
/* Lote 21: o mesmo seletor no relógio ("Vincular a") e no Registrar tempo. o = {ref,dc,cr,set(ref,dc,cr),pre,kindId,refId,labId} */
let foContAll={};
function foRefPick(o){const ref=o.ref||"",kind=o.dc?"D":ref[0]||"",ds=foActiveDiscs(),pre=o.pre;
  const w=el(`<div class="folink"><label class="qfsel"><span>${o.kindLab||"Vincular a"}</span><select></select></label><label class="qfsel"><span></span><select></select></label></div>`);
  const [kl,rl]=w.querySelectorAll("label"),ks=kl.querySelector("select"),rs=rl.querySelector("select");ks.id=o.kindId;rs.id=o.refId;rl.id=o.labId;
  const KS=[["","Sem vínculo"],["T","Tema"],...(ds.length?[["D",o.seg?"Disciplina":"Disciplina da faculdade"]]:[])],kv=kind==="D"&&!ds.length?"":kind;
  const kgo=v=>{v==="T"?o.set("T:"+(((ensurePlan().items[0]||{}).k)||ALL[0].key)):v==="D"?o.set("D:"+ds[0].id):o.set("")};
  KS.forEach(([v,t])=>{const x=document.createElement("option");x.value=v;x.textContent=t;ks.appendChild(x)});ks.value=kv;ks.onchange=()=>kgo(ks.value);
  if(o.seg){const g=el(`<div class="seg foseg" role="group"></div>`);g.setAttribute("aria-label",o.kindLab||"Vincular a");KS.forEach(([v,t])=>{const b=el(`<button type="button"></button>`);b.id=`${o.kindId}-${v||"0"}`;b.textContent=t;b.setAttribute("aria-pressed",kv===v);b.onclick=()=>{if(kv!==v)kgo(v)};g.appendChild(b)});kl.replaceWith(g);w.classList.add("folinkseg")}
  const opt=(p,v,t)=>{const x=document.createElement("option");x.value=v;x.textContent=t;p.appendChild(x)};
  if(kind==="T"){rl.querySelector("span").textContent="Tema";
    const grp=(lab,items)=>{if(!items.length)return;const g=document.createElement("optgroup");g.label=lab;items.forEach(it=>opt(g,"T:"+it.key,it.t));rs.appendChild(g)};
    grp("Plano de hoje",ensurePlan().items.map(p=>BYKEY[p.k]).filter(Boolean));
    const due=[...ALL,...FAC_ITEMS].filter(i=>isDue(get(i.key)));grp("Revisões de hoje",due.slice(0,15));
    const by={};[...ALL,...FAC_ITEMS].forEach(it=>{const k=`${it.area.code} · ${it.sp||it.area.name}`;(by[k]=by[k]||[]).push(it)});Object.keys(by).forEach(k=>grp(k,by[k]));
    if(!BYKEY[ref.slice(2)])opt(rs,ref,foRefLabel(ref)||"Tema excluído");rs.value=ref;rs.onchange=()=>o.set(rs.value)}
  else if(kind==="D"&&ds.length){rl.querySelector("span").textContent="Disciplina";const many=new Set(ds.map(d=>d.semId)).size>1,did=o.dc||ref.slice(2);
    ds.forEach(d=>opt(rs,"D:"+d.id,d.name+(many?" · "+(semOf(d.semId)||{}).name:"")+(discRefs(d).some(refOk)?"":" (sem conteúdo)")));if(!discOf(did))opt(rs,"D:"+did,"Disciplina excluída");rs.value="D:"+did;
    rs.onchange=()=>o.set(rs.value);
    /* item 2: os conteúdos da disciplina para tocar, mais "disciplina em geral" */
    const d=discOf(did),C=d?foDiscContents(d):[];
    if(C.length){const cw=el(`<div class="focont"><span class="glabel">O que você está estudando nela</span><div class="chips"></div></div>`),ch=cw.querySelector(".chips");
      const chip=(id,lab,on,fn,title)=>{const b=el(`<button class="chip" type="button"></button>`);b.id=id;b.textContent=lab.length>40?lab.slice(0,38)+"…":lab;b.title=title||lab;b.setAttribute("aria-pressed",on);b.onclick=fn;ch.appendChild(b);return b};
      chip(`${pre}c-g`,"Disciplina em geral",!o.cr,()=>o.set("D:"+did),"O tempo conta só para a disciplina");
      const full=foContAll[pre+did],cur=C.findIndex(x=>x.ref===o.cr),show=full||C.length<=10?C:C.slice(0,8).concat(cur>=8?[C[cur]]:[]);let g0=null;
      show.forEach(x=>{const i=C.indexOf(x);if(C.some(y=>y.g!==C[0].g)&&x.g!==g0){g0=x.g;const h=el(`<span class="focg"></span>`);h.textContent=x.g;ch.appendChild(h)}
        const lk=BYKEY[x.k]&&!BYKEY[x.k].own,self=x.lab===x.g,b=chip(`${pre}c-${i}`,self?"SP inteira":x.lab,o.cr===x.ref,()=>o.set("T:"+x.k,did,x.ref),lk?`${x.lab}: conta também no tema da residência`:x.lab);if(lk)b.classList.add("folk");if(self)b.classList.add("foself")});
      if(C.length>show.length||full){const m=el(`<button class="link" type="button"></button>`);m.id=pre+"cMore";m.textContent=full?"Mostrar menos":`Ver todos os ${C.length} conteúdos`;m.onclick=()=>{foContAll[pre+did]=!full;render()};ch.appendChild(m)}
      if(o.cr&&BYKEY[ref.slice(2)]&&!BYKEY[ref.slice(2)].own){const n=el(`<p class="foclk2"><span aria-hidden="true">↔</span><span></span></p>`);n.lastChild.textContent=`Conta também em ${BYKEY[ref.slice(2)].t}, da residência (uma vez só).`;cw.appendChild(n)}
      w.appendChild(cw)}}
  else rl.hidden=true;
  return w}
function foLinkEl(){const R=foRun||foPick;return foRefPick({ref:R.ref||"",dc:R.dc,cr:R.cr,pre:"fo",kindId:"foKind",refId:"foRef",labId:"foRefL",set:(r,dc,cr)=>foSetRef(r,dc,cr)})}
function foTimerCard(){const P=ui.prefs,R=foRun,mode=R?R.mode:foPick.mode,S=foShown();
  const c=el(`<section class="card fotimer" aria-labelledby="foh"><div class="seg fomode" role="group" aria-label="Tipo de contagem"></div><p class="fophase" id="foh"></p>
    <div class="foring"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" class="fotrk"/><circle cx="50" cy="50" r="46" class="foarc" id="foArc" style="stroke-dasharray:${FO_C};stroke-dashoffset:${FO_C*(1-S.frac)}"/></svg>
    <div class="foclk"><b id="foClock" role="timer" aria-live="off"></b><span class="fost"></span></div></div><div class="foacts"></div><div class="foopts"></div><p class="gstatus fomsg" role="status"></p></section>`);
  const seg=c.querySelector(".fomode");[["p","Pomodoro"],["c","Cronômetro"]].forEach(([v,t])=>{const b=el(`<button type="button" aria-pressed="${mode===v}"></button>`);b.textContent=t;b.disabled=!!R&&mode!==v;b.onclick=()=>{if(R)return;foPick.mode=v;foSavePick();render()};seg.appendChild(b)});
  c.querySelector(".fophase").textContent=R&&R.ph==="b"?(R.lb?"Pausa longa":"Pausa"):mode==="p"?"Sessão de foco":"Cronômetro livre";
  if(R){const fr=el(`<div class="fofull"></div>`);fr.appendChild(fullBtn("fo"));c.prepend(fr)}
  if(mode==="p")c.querySelector(".foring").after(foDotsEl());
  c.querySelector("#foClock").textContent=S.txt;
  c.querySelector(".fost").textContent=!R?"Pronto para começar":R.ph==="b"?(R.t0?"Pausa em andamento":"Pausa parada"):R.t0?"Foco em andamento":"Pausado";
  c.classList.toggle("onbreak",!!R&&R.ph==="b");c.classList.toggle("running",!!R&&!!R.t0);
  const a=c.querySelector(".foacts"),btn=(t,cls,fn)=>{const b=el(`<button class="btn ${cls}" type="button"></button>`);b.textContent=t;b.onclick=fn;a.appendChild(b);return b};
  if(!R)btn(mode==="p"?`▶ Iniciar foco · ${P.fw} min`:"▶ Iniciar cronômetro","primary fogo",foStart).id="foStart";
  else if(R.ph==="b"){btn(R.t0?"Ⅱ Pausar":"▶ Retomar","",R.t0?foPause:foResume).id="foPauseB";btn("Pular pausa","",foFinish).id="foSkip"}
  else{btn(R.t0?"Ⅱ Pausar":"▶ Retomar","fopause",R.t0?foPause:foResume).id="foPauseB";btn("✓ Encerrar e salvar","primary",foFinish).id="foEnd";
    if(R.t0){const dz=el(`<button class="chip fodist" type="button" id="foDist"></button>`);dz.textContent=`Me distraí${R.dist?` · ${R.dist}`:""}`;dz.title="Conte cada vez que perder o foco (celular, conversa, pensamento solto)";dz.onclick=()=>{foRun.dist=(foRun.dist||0)+1;foSaveRun();render()};a.after(dz)}
    const d=el(`<button class="link" type="button" id="foDisc"></button>`);d.textContent=foArm?"Toque de novo para descartar (não salva)":"Descartar";if(foArm)d.classList.add("warn");d.onclick=()=>{if(foArm)foDiscard();else{foArm=true;render()}};a.appendChild(d)}
  const o=c.querySelector(".foopts");
  const snd=el(`<button class="chip" type="button" id="foSnd" aria-pressed="${!!P.fsnd}"></button>`);snd.textContent=`Som ao finalizar: ${P.fsnd?"ligado":"desligado"}`;snd.onclick=()=>{ui.prefs.fsnd=!P.fsnd;saveUI();render()};o.appendChild(snd);
  const tst=el(`<button class="link" type="button">Testar alarme</button>`);tst.onclick=()=>foAlarm(true);o.appendChild(tst);
  if("wakeLock" in navigator){const wk=el(`<button class="chip" type="button" id="foWk" aria-pressed="${!!P.fwake}"></button>`);wk.textContent=`Tela acesa: ${P.fwake?"sim":"não"}`;wk.title="Mantém a tela ligada enquanto o foco corre";wk.onclick=()=>{ui.prefs.fwake=!P.fwake;saveUI();foWakeSync();render()};o.appendChild(wk)}
  if(mode==="p"){const pr=el(`<div class="chips fopre" role="group" aria-label="Duração do pomodoro"></div>`);
    [[25,5],[50,10]].forEach(([w,b])=>{const x=el(`<button class="chip" type="button" aria-pressed="${P.fw===w&&P.fb===b&&!foCustom}">${w} + ${b}</button>`);x.onclick=()=>{ui.prefs.fw=w;ui.prefs.fb=b;foCustom=null;saveUI();render()};pr.appendChild(x)});
    const cu=!(P.fw===25&&P.fb===5)&&!(P.fw===50&&P.fb===10),cb=el(`<button class="chip" type="button" id="foCus" aria-pressed="${cu||!!foCustom}"></button>`);cb.textContent=cu?`${P.fw} + ${P.fb}`:"Personalizar";
    cb.onclick=()=>{foCustom=foCustom?null:{w:P.fw,b:P.fb};render()};pr.appendChild(cb);c.appendChild(pr);
    if(foCustom){if(foCustom.l===undefined){foCustom.l=P.flong;foCustom.e=P.fevery}
      const f=el(`<div class="focus-form"><label class="qfsel"><span>Foco (min)</span><input type="number" id="foW" min="5" max="180" inputmode="numeric"></label><label class="qfsel"><span>Pausa (min)</span><input type="number" id="foB" min="0" max="60" inputmode="numeric"></label><label class="qfsel"><span>Pausa longa (min)</span><input type="number" id="foL" min="0" max="60" inputmode="numeric"></label><label class="qfsel"><span>A cada (ciclos)</span><input type="number" id="foE" min="2" max="8" inputmode="numeric"></label><button class="btn" type="button">Salvar</button></div>`);
      const iw=f.querySelector("#foW"),ib=f.querySelector("#foB"),il=f.querySelector("#foL"),ie=f.querySelector("#foE");iw.value=foCustom.w;ib.value=foCustom.b;il.value=foCustom.l;ie.value=foCustom.e;
      iw.oninput=()=>{foCustom.w=iw.value};ib.oninput=()=>{foCustom.b=ib.value};il.oninput=()=>{foCustom.l=il.value};ie.oninput=()=>{foCustom.e=ie.value};
      f.querySelector("button").onclick=()=>{const w=Math.round(+iw.value),b=Math.round(+ib.value),lo=Math.round(+il.value),ev=Math.round(+ie.value);
        if(!(w>=5&&w<=180)||!(b>=0&&b<=60)||!(lo>=0&&lo<=60)||!(ev>=2&&ev<=8)){foMsg="Foco de 5 a 180 minutos, pausas de 0 a 60 e pausa longa a cada 2 a 8 ciclos.";render();return}
        ui.prefs.fw=w;ui.prefs.fb=b;ui.prefs.flong=lo;ui.prefs.fevery=ev;foCustom=null;foMsg=`Pomodoro: ${w} min de foco, ${b?b+" min de pausa":"sem pausa"}${lo?` e pausa longa de ${lo} min a cada ${ev} ciclos`:" e sem pausa longa"}.${foRun?" Vale a partir do próximo ciclo.":""}`;saveUI();render()};c.appendChild(f)}}
  {const q=foQuickEl();if(q)c.appendChild(q)}
  {const mo=el(`<details class="fomore"><summary></summary></details>`),P2=ui.prefs,rf=(foRun?foRun.ref:foPick.ref)||"";if(foMoreOpts)mo.open=true;mo.addEventListener("toggle",()=>{foMoreOpts=mo.open});
    const RR=foRun||foPick;mo.querySelector("summary").textContent=`Mais opções${rf?" · "+(RR.cr&&refLabel(RR.cr)||foRefLabel(rf)||"vínculo"):""}${P2.fnoise?" · som de fundo":""}`;
    mo.append(foLinkEl(),foNoiseEl(),c.querySelector(".foopts"));c.appendChild(mo)}
  if(!R&&!foAdd){const rg=el(`<p class="foreg"><button class="link" type="button" id="foRegB">Estudou sem o cronômetro? Registrar tempo</button></p>`);rg.querySelector("button").onclick=()=>foAddOpen();c.appendChild(rg)}
  c.appendChild(el(`<p class="how fohow hx">${mode==="p"?"Ao terminar um ciclo, o app salva o tempo e começa a pausa sozinho.":"Conta o tempo até você encerrar. Sessões com menos de 1 minuto não são salvas."} A contagem continua certa com a tela bloqueada; o alarme toca quando você volta ao app, se ele estiver em segundo plano.</p>`));
  const m=c.querySelector(".fomsg");m.textContent=foMsg;m.hidden=!foMsg;return c}
function foWeekCard(){const P=ui.prefs,m=foDayTotals(),t=dnum(today()),ws=foWeekStart(),g=foDG()*60;
  const wk=foSess.filter(x=>dnum(x.d)>=ws&&dnum(x.d)<=t),tot=foSum(wk),td=m[today()]||0,act=new Set(wk.map(x=>x.d)).size,st=foGoalStreak(m);
  const c=el(`<section class="card dash" aria-labelledby="fowh"><div class="dhead"><h2 id="fowh">Esta semana</h2><span class="todaydate">tempo de estudo efetivamente salvo</span></div><div class="kpis"></div><div class="fowk" role="img"></div><div class="fogoal"></div></section>`);
  c.querySelector(".kpis").innerHTML=`<div class="kpi"><span class="kl">Hoje</span><b>${fmtMin(td)}</b><span class="ks">${g?`${Math.min(100,Math.round(td/g*100))}% da meta de ${fmtMin(g)}`:"sem meta diária"}</span>${g?`<div class="meter"><i style="width:${Math.min(100,td/g*100)}%"></i></div>`:""}</div>
    <div class="kpi"><span class="kl">Total na semana</span><b>${fmtMin(tot)}</b><span class="ks">${act} dia${act===1?"":"s"} com foco</span></div>
    <div class="kpi"><span class="kl">Sessões</span><b>${wk.length}</b><span class="ks">${wk.length?`média de ${fmtMin(tot/wk.length)}`:"nenhuma ainda"}</span></div>
    <div class="kpi"><span class="kl">${g?"Sequência na meta":"Média por dia"}</span><b>${g?st:fmtMin(act?tot/act:0)}</b><span class="ks">${g?`dia${st===1?"":"s"} seguido${st===1?"":"s"}`:"nos dias com foco"}</span></div>`;
  const days=["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"],vals=days.map((_,i)=>m[fromNum(ws+i)]||0),pv=days.map((_,i)=>m[fromNum(ws-7+i)]||0),mx=Math.max(g,...vals,...pv,1);
  const box=c.querySelector(".fowk");box.setAttribute("aria-label","Minutos de foco por dia da semana: "+days.map((d,i)=>`${d} ${Math.round(vals[i]/60)} min`).join(", "));
  box.innerHTML=days.map((d,i)=>{const n=ws+i,v=vals[i],fut=n>t;return `<div class="fod${n===t?" now":""}${fut?" fut":""}"><span class="fov">${v?fmtMin(v).replace(" min","m"):""}</span><div class="fob">${pv[i]?`<b class="fogh" style="height:${pv[i]/mx*100}%" aria-hidden="true"></b>`:""}<i style="height:${v/mx*100}%" data-tip="${d} ${br(fromNum(n))}: ${fmtMin(v)}${g?` (meta ${fmtMin(g)})`:""} · semana passada: ${fmtMin(pv[i])}" class="${g&&v>=g?"ok":""}"></i></div><span class="fox">${d}</span></div>`}).join("")+(g?`<span class="fogl" style="bottom:calc(1.3rem + ${g/mx}*(100% - 2.6rem))" aria-hidden="true"><span class="foglt">meta ${fmtMin(g)}</span></span>`:"");
  const gl=c.querySelector(".fogoal"),gt=el(`<p class="how fogtxt" id="foGoal"></p>`);
  gt.textContent=g?`Meta do dia: ${fmtMin(g)} (a meta de ${fmtMin(P.hgoal*60)} por semana dividida pelos ${foStudyDays()} dias de estudo). `:"Sem meta semanal. ";gt.appendChild(foGoalLink());gl.appendChild(gt);
  gl.appendChild(el(`<span class="how hx">${g?"A linha tracejada marca a meta; barras verdes bateram a meta. ":""}O contorno claro atrás de cada barra é o mesmo dia da semana passada.</span>`));
  c.appendChild(foWeekExtra());return c}
/* agrupa as sessões por matéria (com os conteúdos da disciplina) ou pelo tipo da atividade (Lote 21) */
let foMatBy=lsGet("resid-fomatby")==="tp"?"tp":"mat";
function foGroups(list,by){const g={};list.forEach(x=>{const m=by==="tp"?{id:"t:"+foType(x),lab:foType(x)}:foMat(x),r=g[m.id]||(g[m.id]={lab:m.lab,sec:0,n:0,sub:{}});r.sec+=x.sec;r.n++;
    if(by!=="tp"&&m.id.startsWith("d:")){const sl=x.cr?(refLabel(x.cr)||x.lab||"Conteúdo excluído"):x.dc||x.ref.startsWith("D:")?"Disciplina em geral":foRefLabel(x.ref)||x.lab||"";if(sl)r.sub[sl]=(r.sub[sl]||0)+x.sec}});
  return Object.values(g).sort((a,b)=>b.sec-a.sec)}
function foMatCard(){const t=dnum(today()),from=foPer==="all"?-Infinity:t-(+foPer||7)+1;
  const list=foSess.filter(x=>dnum(x.d)>=from),tot=foSum(list),rows=foGroups(list,foMatBy),mx=rows.length?rows[0].sec:1;
  const c=el(`<section class="card" aria-labelledby="fomh"><div class="dhead"><h2 id="fomh">Tempo por ${foMatBy==="tp"?"tipo":"matéria"}</h2><div class="seg fomby" role="group" aria-label="Agrupar por"></div></div><div class="foper"></div><div class="fomats"></div></section>`);
  const sg=c.querySelector(".fomby");[["mat","Matéria"],["tp","Tipo"]].forEach(([v,l])=>{const b=el(`<button type="button"></button>`);b.id="foBy-"+v;b.textContent=l;b.setAttribute("aria-pressed",foMatBy===v);b.onclick=()=>{foMatBy=v;lsSet("resid-fomatby",v);render()};sg.appendChild(b)});
  c.querySelector(".foper").appendChild(fcPer("foPer",foPer,v=>{foPer=v;lsSet("resid-foper",v)}));
  const box=c.querySelector(".fomats");
  if(!rows.length)box.innerHTML=`<p class="cempty">${foSess.length?"Nenhuma sessão neste período.":"Vincule as sessões a um tema ou a uma disciplina para ver aqui quanto tempo foi para cada matéria."}</p>`;
  else{box.innerHTML=rows.slice(0,15).map(r=>{const sub=Object.entries(r.sub||{}).sort((a,b)=>b[1]-a[1]),sh=sub.length>1||sub.length===1&&sub[0][0]!=="Disciplina em geral";
      return `<div class="vrow"><div class="vtop"><span class="vl">${esc(r.lab)}</span><span class="hv">${fmtMin(r.sec)}</span><span class="hn">${Math.round(r.sec/tot*100)}%</span></div><div class="hbar track1"><i style="width:${Math.max(r.sec/mx*100,1)}%;background:var(--accent)" data-tip="${esc(r.lab)}: ${fmtMin(r.sec)} em ${r.n} sess${r.n===1?"ão":"ões"}"></i></div>${sh?`<p class="fosubs">${sub.slice(0,6).map(([l,v])=>`<span>${esc(l)} <b>${fmtMin(v)}</b></span>`).join("")}${sub.length>6?`<span>+ ${sub.length-6}</span>`:""}</p>`:""}</div>`}).join("")+(rows.length>15?`<p class="how">+ ${rows.length-15} ${foMatBy==="tp"?"tipos":"matérias"} com menos tempo.</p>`:"")+`<p class="how">Total: ${fmtMin(tot)} em ${list.length} sess${list.length===1?"ão":"ões"}. ${foMatBy==="tp"?"O tipo vem do Registrar tempo; o resto é o cronômetro do Foco.":"Temas contam na especialidade; disciplinas da faculdade, pelo nome, com os conteúdos embaixo."}</p>`}
  return c}
/* Lote 21 item 1: Registrar tempo (estudo fora do cronômetro): minutos, dia, tipo e vínculo opcional; editável depois */
function foAddOpen(x){const R=foRun||foPick;foAdd=x?{id:x.id,d:x.d,min:String(Math.round(x.sec/60)),tp:x.tp||"",ref:x.ref||"",dc:x.dc,cr:x.cr,msg:""}:{d:today(),min:"",tp:"",ref:R.ref||"",dc:R.dc,cr:R.cr,msg:""};render();
  setTimeout(()=>{const b=$("#foAddBox");if(b)b.scrollIntoView({block:"nearest",behavior:"smooth"})},60)}
function foAddSave(){const A=foAdd,mn=Math.round(+A.min),d=A.d,tp=(A.other!==undefined?A.other:A.tp||"").trim().slice(0,40);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(d)||d>today()){A.msg="Escolha um dia até hoje.";render();return}
  if(!(mn>=1&&mn<=720)){A.msg="Digite de 1 a 720 minutos.";render();return}
  const ref=A.ref||"",old=A.id&&foSess.find(x=>x.id===A.id),x={id:old?old.id:"fo"+Date.now().toString(36)+Math.random().toString(36).slice(2,6),d,s:old&&old.d===d?old.s:d+"T12:00:00.000Z",sec:mn*60,m:"x",ref,lab:foRefLabel(ref)};
  if(A.dc&&discOf(A.dc)){x.dc=A.dc;if(A.cr){x.cr=A.cr;x.lab=refLabel(A.cr)||x.lab}}
  if(tp){x.tp=tp;foKeepType(tp)}
  if(old)foSess=foSess.filter(y=>y!==old);foSess.push(x);foSess.sort((a,b)=>a.s<b.s?1:-1);foPut(x);foAdd=null;
  foMsg=`${old?"Registro atualizado":fmtMin(x.sec)+" registrados"} em ${br(d)}${tp?" · "+tp:""}${x.dc||x.ref?" · "+foSessName(x):""}.`;render()}
function foAddEl(){const A=foAdd,t=today(),y=fromNum(dnum(t)-1),mn=Math.round(+A.min)||0,tp=A.other!==undefined?A.other.trim():A.tp;
  const f=el(`<div class="foadd" id="foAddBox"><div class="foaddtop"><h3 class="foaddh">${A.id?"Editar registro":"Registrar tempo"}</h3><button class="foaddx" type="button" id="foAddX" aria-label="Fechar">×</button></div>
    <p class="how hx">Para o que você estudou sem o cronômetro: Anki no celular, livro, aula, questões em outro site. Conta na meta da semana, nas Estatísticas e na sequência de dias.</p>
    <div class="fofld"><span class="fofl">Quanto tempo</span><div class="chips" id="foAddMs"></div></div>
    <div class="fofld"><span class="fofl">Quando</span><div class="chips" id="foAddDs"></div></div>
    <div class="fofld"><span class="fofl">O que você fez</span><div class="chips" id="foAddTs"></div></div>
    <div class="fofld" id="foAddLk"><span class="fofl">Ligar a <small>opcional</small></span></div>
    <p class="err" role="alert"></p>
    <div class="foaddgo"><button class="btn primary" type="button" id="foAddOk"></button></div></div>`);
  const ok=f.querySelector("#foAddOk");ok.textContent=A.id?"Salvar alteração":mn>=1?`Registrar ${fmtMin(mn*60)}${tp?" de "+tp:""}`:"Registrar";
  /* minutos: botões prontos + campo no mesmo grupo */
  const ms=f.querySelector("#foAddMs"),pre=[15,30,45,60,90];pre.forEach(v=>{const b=el(`<button class="chip" type="button" id="foAm-${v}">${v} min</button>`);b.setAttribute("aria-pressed",mn===v);b.onclick=()=>{A.min=String(v);render()};ms.appendChild(b)});
  const mw=el(`<label class="foinchip${mn&&!pre.includes(mn)?" on":""}"><input type="number" id="foAddM" min="1" max="720" inputmode="numeric" placeholder="outro" aria-label="Minutos"><span>min</span></label>`),im=mw.querySelector("input");im.value=mn&&!pre.includes(mn)?A.min:"";
  im.oninput=()=>{A.min=im.value;const v=Math.round(+im.value)||0;ms.querySelectorAll(".chip").forEach(b=>b.setAttribute("aria-pressed",false));mw.classList.toggle("on",v>0);ok.textContent=A.id?"Salvar alteração":v>=1?`Registrar ${fmtMin(v*60)}${tp?" de "+tp:""}`:"Registrar"};ms.appendChild(mw);
  /* dia: Hoje, Ontem ou outro */
  const dsx=f.querySelector("#foAddDs");[[t,"Hoje"],[y,"Ontem"]].forEach(([v,l],i)=>{const b=el(`<button class="chip" type="button" id="foAd-${i}">${l}</button>`);b.setAttribute("aria-pressed",A.d===v);b.onclick=()=>{A.d=v;render()};dsx.appendChild(b)});
  const dw=el(`<label class="foinchip fodate${A.d!==t&&A.d!==y?" on":""}"><span>${A.d!==t&&A.d!==y?br(A.d):"Outro dia"}</span><input type="date" id="foAddD" aria-label="Outro dia"></label>`),id=dw.querySelector("input");id.value=A.d;id.max=t;id.onchange=()=>{if(id.value){A.d=id.value;render()}};id.onclick=()=>{try{id.showPicker()}catch(e){}};dsx.appendChild(dw);
  /* tipo */
  const ts=f.querySelector("#foAddTs"),T=foTypes();if(A.tp&&!T.includes(A.tp))T.push(A.tp);
  T.forEach((v,i)=>{const b=el(`<button class="chip" type="button"></button>`);b.id="foAt-"+i;b.textContent=v;b.setAttribute("aria-pressed",A.other===undefined&&A.tp===v);b.onclick=()=>{A.tp=A.tp===v&&A.other===undefined?"":v;delete A.other;render()};ts.appendChild(b)});
  if(A.other===undefined){const ob=el(`<button class="chip foadd1" type="button" id="foAtO">+ Outro</button>`);ob.onclick=()=>{A.other="";render();setTimeout(()=>{const x=$("#foAtIn"),b=$("#foAddBox");if(x)x.focus()},40)};ts.appendChild(ob)}
  else{const iw=el(`<label class="foinchip on fotpin"><input type="text" id="foAtIn" maxlength="40" placeholder="ex.: Aula gravada"><button type="button" class="foinx" aria-label="Cancelar">×</button></label>`),inp=iw.querySelector("input");inp.value=A.other;
    inp.oninput=()=>{A.other=inp.value;const v=Math.round(+A.min)||0;ok.textContent=A.id?"Salvar alteração":v>=1?`Registrar ${fmtMin(v*60)}${inp.value.trim()?" de "+inp.value.trim():""}`:"Registrar"};iw.querySelector("button").onclick=()=>{delete A.other;render()};ts.appendChild(iw);
    f.querySelector("#foAddTs").after(el(`<p class="fonote">Fica guardado e aparece nas próximas vezes.</p>`))}
  f.querySelector("#foAddLk").appendChild(foRefPick({ref:A.ref,dc:A.dc,cr:A.cr,pre:"fa",seg:true,kindId:"foaKind",refId:"foaRef",labId:"foaRefL",kindLab:"Ligar a",set:(r,dc,cr)=>{A.ref=r;A.dc=dc;A.cr=dc?cr||"":"";render()}}));
  ok.onclick=foAddSave;f.querySelector("#foAddX").onclick=()=>{foAdd=null;render()};
  const er=f.querySelector(".err");er.textContent=A.msg||"";er.hidden=!A.msg;return f}
function foListCard(){const c=el(`<section class="card" aria-labelledby="folh"><div class="dhead"><h2 id="folh">Sessões recentes</h2><button class="link" type="button" id="foAddB"></button></div><div class="foaddbox"></div><ol class="folist"></ol></section>`);
  const ab=c.querySelector("#foAddB");ab.textContent=foAdd?"Fechar":"+ Registrar tempo";ab.onclick=()=>{if(foAdd){foAdd=null;render()}else foAddOpen()};
  if(foAdd)c.querySelector(".foaddbox").appendChild(foAddEl());
  const ol=c.querySelector(".folist"),all=[...foSess].sort((a,b)=>a.d===b.d?(a.s<b.s?1:-1):(a.d<b.d?1:-1)),sh=foMore?all.slice(0,60):all.slice(0,8);
  if(!all.length)ol.appendChild(el(`<li class="cempty">Nenhuma sessão ainda. Inicie um pomodoro ou o cronômetro acima, ou registre o tempo que estudou fora daqui.</li>`));
  sh.forEach(x=>{const li=el(`<li class="foitem"><span class="foic" aria-hidden="true">${x.m==="p"?"◎":x.m==="c"?"◷":"✎"}</span><span class="fon"><b></b><span></span></span><span class="fod2"></span><button class="foxb" type="button" aria-label="Excluir sessão">×</button></li>`);
    li.querySelector(".fon b").textContent=x.ref||x.dc?foSessName(x):(x.tp||"Sem vínculo");
    li.querySelector(".fon span").textContent=`${br(x.d)}/${x.d.slice(0,4)} · ${x.m==="x"?(x.tp&&(x.ref||x.dc)?x.tp:"Registrado à mão"):FO_MODE[x.m]||""}${x.dc||x.ref&&x.ref[0]==="D"?" · faculdade":""}`;
    li.querySelector(".fod2").textContent=fmtMin(x.sec);
    if(x.m==="x"&&foDel!==x.id){const eb=el(`<button class="foeb" type="button" aria-label="Editar registro">✎</button>`);eb.id="foed-"+x.id;eb.title="Editar o registro";eb.onclick=()=>foAddOpen(x);li.querySelector(".fod2").after(eb)}
    const xb=li.querySelector(".foxb");if(foDel===x.id){xb.remove();const cf=el(`<span class="foconf"><button class="mini warn" type="button">Excluir</button><button class="mini" type="button">Manter</button></span>`);const [y,n]=cf.querySelectorAll("button");y.onclick=()=>foDelete(x.id);n.onclick=()=>{foDel=null;render()};li.appendChild(cf)}
    else xb.onclick=()=>{foDel=x.id;render()};
    ol.appendChild(li)});
  if(all.length>8){const m=el(`<li><button class="link" type="button">${foMore?"Mostrar menos":`Mostrar mais (${Math.min(all.length,60)-8})`}</button></li>`);m.querySelector("button").onclick=()=>{foMore=!foMore;render()};ol.appendChild(m)}
  return c}
/* ---------- Foco: depois da sessão, vínculo rápido, ciclos, ruído, distrações, mapa e metas ---------- */
const LSFA="resid-focus-after",LSFS="resid-focus-series";
let foAfter=null,foSeries={n:0,t:0},foAfterQ=null,foAfterAll=false,foNoise=null,foMoreOpts=false;
try{const a=JSON.parse(localStorage.getItem(LSFA)||"null");if(a&&typeof a.k==="string"&&a.d===today())foAfter=a}catch(e){}
try{const s=JSON.parse(localStorage.getItem(LSFS)||"null");if(s&&Number.isInteger(s.n)&&typeof s.t==="number")foSeries=s}catch(e){}
function foAfterSet(x){foAfter=x&&x.ref&&x.ref[0]==="T"&&BYKEY[x.ref.slice(2)]?{k:x.ref.slice(2),sec:x.sec,d:x.d,id:x.id}:null;foAfterQ=null;foAfterAll=false;
  try{foAfter?localStorage.setItem(LSFA,JSON.stringify(foAfter)):localStorage.removeItem(LSFA)}catch(e){}}
/* ----- 1. ao terminar: registrar o que estudou ----- */
function foAfterCard(){const A=foAfter;if(!A||!BYKEY[A.k])return null;const it=BYKEY[A.k],s=get(A.k),L=subList(it);
  const c=el(`<section class="card foafter" aria-labelledby="foah"><div class="dhead"><h2 id="foah">O que você estudou?</h2><button class="link" type="button">Fechar</button></div><p class="gtext"></p></section>`);
  c.querySelector(".dhead .link").onclick=()=>{foAfterSet(null);render()};
  const p=c.querySelector("p");p.textContent=`${fmtMin(A.sec)} em `;const b=document.createElement("b");b.textContent=it.t;p.appendChild(b);p.append(". Registre agora para o tema avançar no checklist.");
  if(L.length){const g=el(`<div class="grp"><span class="glabel">Subtópicos que você viu</span><ul class="subs foasubs"></ul></div>`),ul=g.querySelector("ul");
    const pend=L.filter(x=>!x.done),show=foAfterAll?L:[...pend.slice(0,6),...(pend.length<6?L.filter(x=>x.done).slice(0,6-pend.length):[])];
    show.forEach((x,n)=>{const id=`foas-${n}`,li=el(`<li class="sub"><input type="checkbox" id="${id}"${x.done?" checked":""}><label for="${id}"></label></li>`);li.querySelector("label").textContent=x.t;li.querySelector("input").onchange=()=>toggleSub(it,x);ul.appendChild(li)});
    if(L.length>show.length||foAfterAll){const m=el(`<button class="link" type="button"></button>`);m.textContent=foAfterAll?"Mostrar menos":`Ver os ${L.length} subtópicos`;m.onclick=()=>{foAfterAll=!foAfterAll;render()};g.appendChild(m)}
    c.appendChild(g)}
  const a=el(`<div class="btns foabtns"></div>`);
  if(!s.last){const st=el(`<button class="btn primary" type="button" id="foaStudy">Estudei hoje</button>`);st.onclick=()=>{upd(A.k,x=>{x.last=today();x.step=0;x.l=Math.max(x.l||0,1)});logAct("e");adoptTopic(A.k);commit()};a.appendChild(st)}
  else if(s.last<today()&&isDue(s)){/* Lote 20: as mesmas 3 respostas das Revisões (Esqueci · Difícil · Lembrei) */
    const rv=el(`<div class="foarev"><span class="glabel">Revisei este tema</span></div>`);rv.appendChild(revBtns(A.k,"foarevb"));c.appendChild(rv)}
  else if(s.last===today())a.appendChild(el(`<span class="pnote foaok">Estudo de hoje já registrado neste tema.</span>`));
  const qb=el(`<button class="btn" type="button" id="foaQ">Registrar questões</button>`);qb.onclick=()=>{foAfterQ=foAfterQ?null:{t:"",c:""};render();setTimeout(()=>{const x=$("#foaQt");if(x)x.focus()},40)};a.appendChild(qb);
  const op=el(`<button class="link" type="button">Abrir o tema</button>`);op.onclick=()=>openTopic(A.k);a.appendChild(op);c.appendChild(a);
  if(foAfterQ){const Q=foAfterQ,f=el(`<div class="focus-form foaq"><label class="qfsel"><span>Feitas</span><input type="number" id="foaQt" min="1" max="500" inputmode="numeric"></label><label class="qfsel"><span>Acertos</span><input type="number" id="foaQc" min="0" max="500" inputmode="numeric"></label><button class="btn primary" type="button">Salvar</button></div>`);
    const [ti,ci]=f.querySelectorAll("input");ti.value=Q.t;ci.value=Q.c;ti.oninput=()=>Q.t=ti.value;ci.oninput=()=>Q.c=ci.value;
    f.querySelector("button").onclick=()=>{const t=Math.round(+ti.value),cc=Math.round(+ci.value);if(!(t>=1&&t<=500)||ci.value===""||!(cc>=0&&cc<=t)){Q.msg="Digite quantas fez (1 a 500) e quantas acertou.";render();return}
      upd(A.k,x=>addQ(x,t,cc));logAct("q",t,cc);foAfterQ=null;foMsg=`${t} questões registradas em ${it.t} (${pct(cc,t)}%).`;commit()};c.appendChild(f);
    if(Q.msg){const e=el(`<p class="err"></p>`);e.textContent=Q.msg;c.appendChild(e)}}
  return c}
/* ----- 2. vincular em um toque: plano de hoje e revisões ----- */
function foQuickEl(){const ref=(foRun?foRun.ref:foPick.ref)||"",seen=new Set(),L=[];
  ensurePlan().items.forEach(p=>{if(BYKEY[p.k]&&!seen.has(p.k)){seen.add(p.k);L.push({k:p.k,tag:"plano"})}});
  [...ALL,...FAC_ITEMS].filter(i=>isDue(get(i.key))).sort(revPri).forEach(i=>{if(L.length<7&&!seen.has(i.key)){seen.add(i.key);L.push({k:i.key,tag:"revisão"})}});
  /* disciplinas da faculdade ainda sem conteúdo: as horas contam para a disciplina */
  const E=foActiveDiscs().filter(d=>!discRefs(d).some(refOk));
  if(!L.length&&!E.length)return null;
  const w=el(`<div class="foquick"><span class="glabel">Estudar agora</span><div class="chips"></div></div>`),ch=w.querySelector(".chips");
  const chip=(r,lab,tag,title)=>{const b=el(`<button class="chip" type="button"><span></span><small></small></button>`),on=ref===r;b.setAttribute("aria-pressed",on);
    b.querySelector("span").textContent=lab.length>34?lab.slice(0,32)+"…":lab;b.querySelector("small").textContent=tag;b.title=title||lab;b.onclick=()=>foSetRef(on?"":r);ch.appendChild(b);return b};
  L.forEach(x=>{const it=BYKEY[x.k];chip("T:"+x.k,it.t,x.tag,it.t)});
  E.forEach(d=>{const b=chip("D:"+d.id,d.name,"disciplina sem conteúdo",`${d.name}: as horas contam para a disciplina`);b.classList.add("fodisc");b.id="foqd-"+d.id});
  return w}
/* ----- 3. ciclos e pausa longa ----- */
function foSeriesNow(){if(!foSeries.t||Date.now()-foSeries.t>60*60000||ymd(foSeries.t)!==today())foSeries={n:0,t:0};return foSeries.n}
function foSeriesAdd(){foSeriesNow();foSeries={n:foSeries.n+1,t:Date.now()};try{localStorage.setItem(LSFS,JSON.stringify(foSeries))}catch(e){}return foSeries.n}
function foDotsEl(){const P=ui.prefs,ev=P.fevery,n=foSeriesNow(),inCycle=n%ev,onLong=foRun&&foRun.ph==="b"&&foRun.lb;
  const done=onLong?ev:(foRun&&foRun.ph==="b"?(inCycle||ev):inCycle);
  const w=el(`<p class="fodots" aria-label=""></p>`);w.setAttribute("aria-label",`Ciclo ${Math.min(done+(foRun&&foRun.ph==="w"?1:0),ev)} de ${ev} até a pausa longa`);
  for(let i=0;i<ev;i++)w.appendChild(el(`<i class="${i<done?"on":foRun&&foRun.ph==="w"&&i===done?"cur":""}"></i>`));
  w.appendChild(el(`<span>${onLong?`pausa longa de ${P.flong} min`:`pausa longa a cada ${ev} ciclos`}</span>`));return w}
/* ----- 5. som de fundo: gravações reais (Lote 18; arquivos em sounds/, baixados só quando tocam e guardados no aparelho) e ruídos gerados no app ----- */
const FO_NOISE={r:"Chuva",s:"Riacho",f:"Lareira",w:"Ruído branco",b:"Ruído marrom"};
const FO_REC={r:"sounds/chuva.mp3",s:"sounds/riacho.mp3",f:"sounds/lareira.mp3"};
const FO_CRED="Chuva: alex36917, editada por Porrumentzio (CC BY) · Riacho: gluckose (CC0) · Lareira: ezwa (domínio público). Gravações do app livre Blanket; fontes em freesound.org e soundbible.com.";
let foRecBuf={},foRecP={},foRecErr={};
/* baixa a gravação uma vez (Cache API quando houver) e decodifica; sem internet, cai no som gerado */
function foRecLoad(t){if(foRecBuf[t])return Promise.resolve(foRecBuf[t]);if(foRecP[t])return foRecP[t];
  foRecP[t]=(async()=>{const url=FO_REC[t];let res=null;try{if(window.caches){const c=await caches.open("nexus-sons");res=await c.match(url);if(!res){const r=await fetch(url);if(r.ok){try{await c.put(url,r.clone())}catch(e){}res=r}}}}catch(e){}
    if(!res){res=await fetch(url);if(!res.ok)throw new Error("http "+res.status)}const ab=await res.arrayBuffer();foUnlock();if(!foActx)throw new Error("sem áudio");
    const buf=await new Promise((ok,no)=>{try{const p=foActx.decodeAudioData(ab,ok,no);if(p&&p.then)p.then(ok,no)}catch(e){no(e)}});foRecBuf[t]=buf;delete foRecErr[t];return buf})()
    .catch(e=>{foRecErr[t]=1;delete foRecP[t];throw e});
  foRecP[t].then(()=>{delete foRecP[t];foNoiseSync();render()},()=>{foNoiseSync();render()});return foRecP[t]}
function foNoiseBuf(type){const A=foActx,len=A.sampleRate*4,buf=A.createBuffer(1,len,A.sampleRate),d=buf.getChannelData(0);let last=0,b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
  for(let i=0;i<len;i++){const w=Math.random()*2-1;
    if(type==="w")d[i]=w*0.5;
    else if(type==="b"){last=(last+0.02*w)/1.02;d[i]=last*3.5}
    else{b0=0.99886*b0+w*0.0555179;b1=0.99332*b1+w*0.0750759;b2=0.969*b2+w*0.153852;b3=0.8665*b3+w*0.3104856;b4=0.55*b4+w*0.5329522;b5=-0.7616*b5-w*0.016898;d[i]=(b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.11;b6=w*0.115926}}
  return buf}
function foNoiseSync(){const P=ui.prefs,want=!!(foRun&&foRun.ph==="w"&&foRun.t0&&P.fnoise&&FO_NOISE[P.fnoise]);
  try{if(!want){if(foNoise){const N=foNoise;foNoise=null;N.g.gain.setTargetAtTime(0,foActx.currentTime,0.15);setTimeout(()=>{try{N.s.stop()}catch(e){}},600)}return}
    foUnlock();if(!foActx)return;const vol=Math.max(0,Math.min(100,P.fvol))/100*0.6;
    if(foNoise&&foNoise.type!==P.fnoise){try{foNoise.s.stop()}catch(e){}foNoise=null}
    if(!foNoise){const rec=FO_REC[P.fnoise];let buf=null;
      if(rec&&!foRecErr[P.fnoise]){buf=foRecBuf[P.fnoise];if(!buf){foRecLoad(P.fnoise).catch(()=>{});return}}
      const gen=!buf,gt=gen&&rec?(P.fnoise==="r"?"r":"b"):P.fnoise;// sem a gravação: chuva gerada, ou ruído marrom no lugar dos outros
      const s=foActx.createBufferSource(),g=foActx.createGain();s.buffer=buf||foNoiseBuf(gt);s.loop=true;let out=s;
      if(buf){s.loopStart=0.06;s.loopEnd=Math.max(1,buf.duration-0.06)}
      if(gen&&(gt==="r"||gt==="w")){const f=foActx.createBiquadFilter();f.type="lowpass";f.frequency.value=gt==="r"?2200:7000;s.connect(f);out=f}// ruído branco mais suave, menos "chiado"
      g.gain.value=0;out.connect(g);g.connect(foActx.destination);if(buf)s.start(0,0.06);else s.start();foNoise={s,g,type:P.fnoise,rec:!!buf}}
    foNoise.g.gain.setTargetAtTime(vol,foActx.currentTime,0.25)}catch(e){foNoise=null}}
function foNoiseEl(){const P=ui.prefs,w=el(`<div class="fonoise"><span class="glabel">Som de fundo</span><div class="chips" role="group" aria-label="Som de fundo"></div></div>`),ch=w.querySelector(".chips");
  [["","Desligado"],...Object.entries(FO_NOISE)].forEach(([v,t])=>{const b=el(`<button class="chip" type="button" aria-pressed="${(P.fnoise||"")===v}"></button>`);b.textContent=t;b.dataset.fn=v||"off";if(FO_REC[v])b.title="Gravação real";
    b.onclick=()=>{foUnlock();ui.prefs.fnoise=v;saveUI();if(FO_REC[v]&&!foRecBuf[v])foRecLoad(v).catch(()=>{});render()};ch.appendChild(b)});
  {const t=P.fnoise;if(FO_REC[t]){const st=el(`<p class="how fonst"></p>`);st.textContent=foRecErr[t]?"Não deu para baixar a gravação agora (sem internet?): tocando um som gerado no lugar.":foRecP[t]&&!foRecBuf[t]?"Baixando a gravação (uma vez só; depois fica no aparelho)…":"Gravação real.";w.appendChild(st)}}
  if(P.fnoise){const r=el(`<label class="fovol"><span>Volume</span><input type="range" min="5" max="100" step="5" id="foVol"></label>`),i=r.querySelector("input");i.value=P.fvol;
    i.oninput=()=>{ui.prefs.fvol=+i.value;foNoiseSync()};i.onchange=()=>saveUI();w.appendChild(r);
    w.appendChild(el(`<p class="how">Toca só durante o foco; para na pausa. Use fones para não incomodar ninguém.</p>`));
    if(FO_REC[P.fnoise]){const d=el(`<details class="focred"><summary>Créditos das gravações</summary><p class="how"></p></details>`);d.querySelector("p").textContent=FO_CRED;w.appendChild(d)}}
  return w}
/* ----- 7. mapa das 12 semanas e melhor horário ----- */
/* mapa das últimas 12 semanas: fica no fim da aba; em tela larga (computador, iPad deitado) ocupa as duas colunas,
   com os minutos dentro de cada dia, o total de cada semana e o melhor horário ao lado */
const foHM=v=>{const m=Math.round(v/60);return m<60?String(m):Math.floor(m/60)+"h"+(m%60?String(m%60).padStart(2,"0"):"")};
function foHeatCard(){const m=foDayTotals(),t=dnum(today()),ws=foWeekStart(),start=ws-7*11,g=foDG()*60;
  /* ❄ só a partir do primeiro dia de uso (antes disso não havia sequência para congelar) */const fd0=Math.min(...[...Object.keys(hist),...foSess.map(x=>x.d)].filter(d=>/^\d{4}-/.test(d)).map(dnum),t);
  const vals=[];for(let n=start;n<=ws+6;n++)vals.push(m[fromNum(n)]||0);const mx=Math.max(1,...vals),ref=g||mx;
  const r3=Math.max(60,Math.round(ref/3/300)*300),r6=Math.max(120,Math.round(ref*2/3/300)*300),lvl=v=>!v?0:v>=ref?4:v>=r6?3:v>=r3?2:1;
  const c=el(`<section class="card foheat" aria-labelledby="fohh"><div class="dhead"><h2 id="fohh">Nas últimas 12 semanas</h2><span class="todaydate"></span></div><div class="fohwrap"><div class="fohmain"><div class="fohm" role="img"></div><div class="fohleg"></div></div><div class="fohside"><div class="fohstats"></div><div class="fohour"></div></div></div></section>`);
  const days=vals.filter((v,i)=>start+i<=t),act=days.filter(Boolean).length,tot=days.reduce((a,b)=>a+b,0);
  c.querySelector(".todaydate").textContent=`${act} ${act===1?"dia":"dias"} com foco · ${fmtMin(tot)}`;
  const box=c.querySelector(".fohm");box.setAttribute("aria-label",`Foco por dia nas últimas 12 semanas: ${act} dias com foco, total ${fmtMin(tot)}`);
  const wd=[["S","seg"],["T","ter"],["Q","qua"],["Q","qui"],["S","sex"],["S","sáb"],["D","dom"]],MES=["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  let h=`<span class="fohl"></span>`;for(let w=0;w<12;w++){const d0=fromNum(start+7*w),dd=+d0.slice(8,10),mo=+d0.slice(5,7)-1,cur=start+7*w===ws;
    h+=`<span class="fohl${cur?" cur":""}"><span class="fohn">${w%2===0?br(d0).slice(0,5):""}</span><span class="fohw">${cur?"esta":dd+" "+MES[mo]}</span></span>`}
  for(let r=0;r<7;r++){h+=`<span class="fohd"><span class="fohn">${wd[r][0]}</span><span class="fohw">${wd[r][1]}</span></span>`;
    for(let w=0;w<12;w++){const n=start+7*w+r,v=m[fromNum(n)]||0;const of=!v&&n<=t&&n>=fd0&&offDay(fromNum(n));h+=n>t?`<i class="fut"></i>`:`<i class="l${lvl(v)}${n===t?" now":""}${of?" off":""}" data-tip="${dayLabel(fromNum(n))}: ${v?fmtMin(v):of?"folga (a sequência fica congelada)":"sem foco"}">${v?`<em>${foHM(v)}</em>`:of?`<em class="ofs" aria-hidden="true">❄</em>`:""}</i>`}}
  const wk=[];for(let w=0;w<12;w++){let s2=0;for(let r=0;r<7;r++)s2+=m[fromNum(start+7*w+r)]||0;wk.push(s2)}const wmx=Math.max(1,...wk);
  h+=`<span class="fohd fohtot"><span class="fohw">semana</span></span>`;wk.forEach((v,w)=>{h+=`<span class="fohwt" title="Semana de ${br(fromNum(start+7*w))}: ${v?fmtMin(v):"sem foco"}"><span class="fohwb"><i style="height:${Math.round(v/wmx*100)}%"></i></span><b>${v?foHM(v):"–"}</b></span>`});
  box.innerHTML=h;
  /* legenda com os minutos de cada tom */
  {const L=c.querySelector(".fohleg"),Lb=[`menos de ${fmtMin(r3)}`,`${fmtMin(r3)} a ${fmtMin(r6)}`,`${fmtMin(r6)} a ${fmtMin(ref)}`,g?`${fmtMin(ref)} ou mais (meta)`:`perto do seu maior dia`];
    L.innerHTML=`<span class="fohli"><i class="l0"></i>sem foco</span>`+Lb.map((x,i)=>`<span class="fohli"><i class="l${i+1}"></i>${x}</span>`).join("")}
  /* resumo */
  {const S=c.querySelector(".fohstats"),bw=wk.indexOf(Math.max(...wk)),avg=act?tot/act:0,now=wk[11];let prev=0;for(let n=ws-7;n<=t-7;n++)prev+=m[fromNum(n)]||0;
    const row=(k,v)=>{const x=el(`<div class="fohst"><span></span><b></b></div>`);x.querySelector("span").textContent=k;x.querySelector("b").textContent=v;S.appendChild(x)};
    row("Média nos dias com foco",act?fmtMin(avg):"–");row("Melhor semana",wk[bw]?`${fmtMin(wk[bw])} (${br(fromNum(start+7*bw)).slice(0,5)})`:"–");row("Esta semana",`${fmtMin(now)}${prev||now?` · ${now>=prev?"+":"−"}${fmtMin(Math.abs(now-prev))} que a anterior até ${["domingo","segunda","terça","quarta","quinta","sexta","sábado"][new Date(today()+"T12:00:00").getDay()]}`:""}`)}
  // melhor horário: minutos por hora do dia nos últimos 30 dias (sessões cronometradas)
  const H=new Array(24).fill(0);foSess.filter(x=>x.m!=="x"&&dnum(x.d)>=t-29).forEach(x=>{let a=Date.parse(x.s),left=x.sec*1000;if(!isFinite(a))return;
    while(left>0){const d=new Date(a),hr=d.getHours(),next=new Date(d.getFullYear(),d.getMonth(),d.getDate(),hr+1).getTime(),part=Math.min(left,next-a);H[hr]+=part/1000;left-=part;a=next}});
  const ht=H.reduce((a,b)=>a+b,0),hb=c.querySelector(".fohour");
  if(ht<1800){hb.appendChild(el(`<p class="how">Com mais algumas sessões cronometradas, aqui aparece o horário em que você mais estuda.</p>`));return c}
  let best=0;for(let i=0;i<24;i++)if(H[i]+H[(i+1)%24]>H[best]+H[(best+1)%24])best=i;
  const P4=[["Madrugada",0,6],["Manhã",6,12],["Tarde",12,18],["Noite",18,24]].map(([l,a,b])=>({l,v:H.slice(a,b).reduce((x,y)=>x+y,0)})),pm=Math.max(...P4.map(x=>x.v));
  const bx=el(`<div class="fohb"><p class="gtext">Seu melhor horário nos últimos 30 dias: <b></b></p><div class="fohp"></div></div>`);bx.querySelector("b").textContent=`${best}h às ${(best+2)%24}h`;
  P4.forEach(x=>{const r=el(`<div class="fohpr"><span></span><span class="fwbar"><i style="width:${x.v/pm*100}%"></i></span><b></b></div>`);r.querySelector("span").textContent=x.l;r.querySelector("b").textContent=`${Math.round(x.v/ht*100)}%`;bx.querySelector(".fohp").appendChild(r)});
  hb.appendChild(bx);return c}
/* ----- 8. meta semanal e recorde; 6. distrações na semana ----- */
function foWeekTotals(){const w={};foSess.forEach(x=>{const n=dnum(x.d),d=new Date(x.d+"T12:00:00").getDay(),ws=n-(d+6)%7;w[ws]=(w[ws]||0)+x.sec});return w}
function foWeekExtra(){const P=ui.prefs,W=foWeekTotals(),ws=foWeekStart(),cur=W[ws]||0,past=Object.entries(W).filter(([k])=>+k<ws),rec=past.length?past.reduce((a,b)=>b[1]>a[1]?b:a):null,wg=(P.hgoal||0)*60;
  const w=el(`<div class="foweekx"></div>`);
  if(wg){const r=el(`<div class="fowg"><div class="qgtop"><b></b><span></span></div><div class="meter"><i style="width:${Math.min(100,cur/wg*100)}%"></i></div></div>`);r.querySelector("b").textContent=fmtMin(cur);r.querySelector("span").textContent=`de ${fmtMin(wg)} na meta da semana${cur>=wg?" · meta batida":""}`;if(cur>=wg)r.classList.add("ok");w.appendChild(r)}
  const line=el(`<p class="how forec"></p>`);
  if(rec&&rec[1]>0)line.textContent=cur>rec[1]?`Novo recorde semanal: ${fmtMin(cur)} (o anterior era ${fmtMin(rec[1])}).`:`Recorde semanal: ${fmtMin(rec[1])} (semana de ${br(fromNum(+rec[0]))}). Faltam ${fmtMin(rec[1]-cur)} para bater.`;
  else line.textContent=cur?`Primeira semana registrada: ${fmtMin(cur)} até agora.`:"";
  if(line.textContent)w.appendChild(line);
  const t=dnum(today()),dz=x=>Number.isInteger(x.dz)?x.dz:0,cw=foSess.filter(x=>x.m!=="x"&&dnum(x.d)>=ws),pw=foSess.filter(x=>x.m!=="x"&&dnum(x.d)>=ws-7&&dnum(x.d)<ws),cd=cw.reduce((a,x)=>a+dz(x),0),pd=pw.reduce((a,x)=>a+dz(x),0);
  if(cd||pd){const p=el(`<p class="how fodz"></p>`);const avg=cw.length?cd/cw.length:0;p.textContent=`Distrações nesta semana: ${cd}${cw.length?` (${String(Math.round(avg*10)/10).replace(".",",")} por sessão)`:""} · semana passada: ${pd}.`;w.appendChild(p)}
  return w}

function renderFoco(){const b=$("#foBody");b.innerHTML="";const L=el(`<div class="focol foleft"></div>`),R=el(`<div class="focol foright"></div>`);
  const A=foAfterCard(),t=foTimerCard(),w=foWeekCard(),h=foHeatCard(),m=foMatCard(),l=foListCard();w.classList.add("foweekc");m.classList.add("fomatc");l.classList.add("folistc");
  if(A)L.appendChild(A);L.append(t,l);R.append(w,m);b.append(L,R,h);foPaint()}
function renderMais(){const b=$("#maisBody");b.innerHTML="";b.appendChild(el(`<h2 class="cftitle">Menu</h2>`));b.appendChild(navListEl())}
