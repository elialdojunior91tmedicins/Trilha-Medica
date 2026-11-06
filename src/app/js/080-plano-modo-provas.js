/* modo provas e regras do plano */
function renderFacCrunch(target){const fc=target||$("#facCrunch");fc.innerHTML="";const ov=crunchOverride(),auto=examCrunchAuto(),mode=ov?ov.mode:"auto";
  fc.appendChild(el(`<div class="dhead"><h2>Modo provas</h2></div>`));
  const sg=el(`<div class="seg" role="group" aria-label="Modo provas"></div>`);
  [["auto","Automático"],["on","Ligado"],["off","Desligado"]].forEach(([v,lab])=>{const b=el(`<button type="button" aria-pressed="${mode===v}">${lab}</button>`);
    b.onclick=()=>{if(v==="auto")delete fac.crunch;else{const def=v==="on"?fromNum(dnum(today())+6):(auto.active?auto.until:fromNum(dnum(today())+6));fac.crunch={mode:v,until:(ov&&ov.mode===v&&ov.until)||def}}saveFac();redoPlan()};sg.appendChild(b)});
  fc.appendChild(sg);const pEl=el(`<p class="gtext how"></p>`);fc.appendChild(pEl);
  if(mode==="auto")pEl.textContent=auto.active?`Ligado automaticamente: ${auto.provas.length} provas entre ${br(auto.from)} e ${br(auto.until)}. A residência pausa até lá.`:"Liga sozinho quando houver 3 ou mais provas num intervalo de 7 dias (a partir de 7 dias antes da primeira).";
  else{pEl.textContent=mode==="on"?"Plano só com a faculdade e revisões da residência pausadas até a data abaixo. Depois volta ao automático.":"Residência segue normal mesmo com provas acumuladas, até a data abaixo. Depois volta ao automático.";
    const f=el(`<label class="fcru">Até <input type="date" class="etext" id="fcru-date"></label>`);const inp=f.querySelector("input");inp.value=ov.until;inp.min=today();
    inp.onchange=()=>{if(/^\d{4}-\d{2}-\d{2}$/.test(inp.value)&&inp.value>=today()){fac.crunch={mode,until:inp.value};saveFac();redoPlan()}};fc.appendChild(f)}
  fc.appendChild(el(`<details class="plain"><summary>Como as provas entram no plano do dia</summary><ul class="frules">
    <li><b>21 dias</b> antes: 1 dos 3 temas do dia é da prova. <b>14 dias</b>: 2. <b>7 dias</b>: os 3.</li>
    <li>Nos <b>7 dias</b> finais, o conteúdo que você já estudou volta como <b>Revisar para a prova</b> (até 2 vezes cada, o de menor acerto primeiro). Nessa semana não entram temas novos da residência: as vagas que sobram ficam para as revisões dela.</li>
    <li>Se o conteúdo também cai muito na residência, a prova ganha +1 vaga.</li>
    <li>Pelo menos 2 dias por semana mantêm 1 tema da residência, exceto na semana da prova.</li>
    <li>Nos 3 últimos dias, o conteúdo que você já estudou volta como revisão de véspera, na seção Revisões. O que ainda não foi estudado continua no Estudar hoje.</li>
    <li><b>Modo provas:</b> com 3 ou mais provas num intervalo de 7 dias, a residência pausa de 7 dias antes da primeira até a última.</li>
    <li>Antes dos 7 dias finais, uma prova só ocupa vagas enquanto tiver conteúdo pendente.</li></ul></details>`));
  if(planNote){const n=el(`<p class="pnote" role="status"></p>`);n.textContent=planNote;fc.appendChild(n)}}

function provaCard(p,L){const d=discOf(p.discId),po=facProvaOpen.has(p.id),dd=daysTo(p.date),tot=p.items.filter(refOk).length,pend=provaPending(p).length;
  const li=el(`<li class="fprova${dd<0?" past":""}${po?" open":""}" id="fp-${p.id}"><button class="fph" type="button" aria-expanded="${po}"><span class="fphl"><b></b><span></span></span><span class="fcount${dd>=0&&dd<=7?" soon":""}"></span><span class="meter"><i style="width:${tot?(tot-pend)/tot*100:0}%"></i></span><span class="fsub"></span></button></li>`);
  li.querySelector(".fphl b").textContent=p.name;li.querySelector(".fphl span").textContent=`${d?provaDiscName(p)+" · ":""}${dayLabel(p.date)}`;
  li.querySelector(".fcount").textContent=dd<0?(p.res&&typeof p.res.n==="number"?`nota ${fmtN(p.res.n)} de ${fmtN(p.res.of)}`:"realizada"):inLabel(dd);
  li.querySelector(".fsub").textContent=tot?`${tot-pend} de ${tot} conteúdos estudados${dd>=0&&dd<=FAC_WIN&&pend?" · entra no plano do dia":""}`:"Nenhum conteúdo marcado para esta prova";
  li.querySelector(".fph").onclick=()=>{po?facProvaOpen.delete(p.id):facProvaOpen.add(p.id);render()};
  if(!po||!d)return li;
  const body=el(`<div class="fpb"></div>`);
  // nome e data
  const ed=el(`<div class="fpedit"></div>`);
  if(facEdit==="p"+p.id)ed.appendChild(nameEdit("p"+p.id,p.name,v=>{p.name=v.slice(0,60)}));
  else{const rn=el(`<button class="link" type="button">renomear</button>`);rn.onclick=()=>{openEdit("p"+p.id);render()};
    const dl=el(`<label class="fcru">Data <input type="date" class="etext"></label>`),di=dl.querySelector("input");di.id="fpdt-"+p.id;di.value=p.date;
    di.onchange=()=>{if(/^\d{4}-\d{2}-\d{2}$/.test(di.value)&&di.value!==p.date){const old={...p};p.date=di.value;saveFac();provaChanged(daysTo(p.date)<=daysTo(old.date)?p:old,"data alterada em")}};
    ed.append(dl,rn,armBtn("p"+p.id,"excluir prova","Toque de novo para excluir a prova",()=>{toTrash("prova",p.name,provaDiscName(p),JSON.parse(JSON.stringify(p)));fac.provas=fac.provas.filter(x=>x.id!==p.id);saveFac();provaChanged(p,"prova excluída")}))}
  body.appendChild(ed);
  // disciplinas da prova (prova conjunta)
  const sd=semDiscs(d.semId),ids=provaDids(p).filter(discOf);
  if(sd.length>1){const fs=el(`<div class="fpdiscs"><span class="glabel"></span><div class="chips"></div></div>`);fs.querySelector(".glabel").textContent=`${plural(L.disc)} desta prova`;
    sd.forEach(x=>{const on=ids.includes(x.id),b=el(`<button class="chip" type="button" aria-pressed="${on}"></button>`);b.id=`fpdd-${p.id}-${x.id}`;b.textContent=x.name;
      if(on&&ids.length===1){b.disabled=true;b.title="A prova precisa de pelo menos uma disciplina"}
      b.onclick=()=>{if(on){const rest=ids.filter(y=>y!==x.id).map(discOf),keep=new Set(rest.flatMap(discRefs)),xr=discRefs(x),xs=x.sps.map(y=>y.id);
          provaSetDids(p,rest.map(y=>y.id));p.items=p.items.filter(r=>!xr.includes(r)||keep.has(r));if(p.sps){p.sps=p.sps.filter(y=>!xs.includes(y));if(!p.sps.length)delete p.sps}}
        else{provaSetDids(p,[...ids,x.id]);const u=unassigned(x,p);u.refs.forEach(r=>{if(!p.items.includes(r))p.items.push(r)});if(u.sps.length)p.sps=[...provaSps(p),...u.sps]}
        saveFac();provaChanged(p,"disciplinas alteradas em")};fs.querySelector(".chips").appendChild(b)});
    body.appendChild(fs)}
  body.appendChild(el(`<p class="gtext how">Marque o que cai nesta prova (por ${esc(L.sp)} inteira ou tema a tema). ${esc(L.sp)} marcada leva junto o que você adicionar nela depois. Um conteúdo conta como estudado quando você o estuda ou revisa nas 3 semanas antes da prova.</p>`));
  const ds=provaDiscs(p),multi=ds.length>1,showAll=facProvaAll.has(p.id),gw=el(`<div class="fpgroups"></div>`);let n=0,hid=0,any=false;
  const elseTag=(lab,list)=>{if(!list.length)return;const t=el(`<span class="fst else"></span>`);t.textContent=`também em ${list.map(x=>x.name).join(", ")}`;lab.appendChild(t)};
  ds.forEach(dx=>{const groups=[...dx.sps.map(s=>({s,t:s.name,refs:s.items.filter(refOk)})),{s:null,t:dx.sps.length?`Outros conteúdos (sem ${L.sp})`:"Conteúdos",refs:dx.items.filter(refOk)}];
    const vis=[];groups.forEach(g=>{if(g.s){const inP=spInProva(p,g.s)||g.refs.some(r=>p.items.includes(r)),el2=spElse(p,g.s);if(!inP&&el2.length&&!showAll){hid++;return}vis.push({...g,el2})}
      else{const refs=g.refs.filter(r=>{const ok=p.items.includes(r)||!refElse(p,r).length||showAll;if(!ok)hid++;return ok});if(refs.length)vis.push({...g,refs,el2:[]})}});
    if(multi){const h=el(`<p class="fpdh2"></p>`);h.textContent=dx.name;gw.appendChild(h)}
    if(!vis.length){const e=el(`<p class="empty" style="padding:0"></p>`);e.textContent=dx.sps.length||dx.items.length?"Tudo desta disciplina já está em outra prova.":`Nenhum conteúdo em ${dx.name} ainda. Adicione na disciplina (+ ${L.sp} ou + Conteúdo).`;gw.appendChild(e);return}
    any=true;
    vis.forEach((g,gi)=>{const gid=`fpg-${p.id}-${dx.id}-${gi}`,linked=g.s&&provaSps(p).includes(g.s.id),all=g.s?spInProva(p,g.s):g.refs.every(r=>p.items.includes(r)),some=g.refs.some(r=>p.items.includes(r));
      const gh=el(`<div class="fpgh"><input type="checkbox" id="${gid}"${all?" checked":""}><label for="${gid}"></label></div>`),lab=gh.querySelector("label");lab.textContent=g.t;
      if(showAll)elseTag(lab,g.el2);
      const cb=gh.querySelector("input");cb.indeterminate=some&&!all;
      cb.onchange=()=>{if(g.s)provaSetSp(p,g.s,!all);else if(all)p.items=p.items.filter(r=>!g.refs.includes(r));else g.refs.forEach(r=>{if(!p.items.includes(r))p.items.push(r)});saveFac();provaChanged(p,"conteúdo alterado em")};
      gw.appendChild(gh);
      if(g.s&&g.refs.length===1&&isSelf(g.s,g.refs[0])){if(all){const st1=itemStudied(p,g.refs[0]),tg=el(`<span class="fst ${st1?"ok":""}">${st1?"estudado":"pendente"}</span>`);lab.appendChild(tg)}return}
      if(g.s&&!g.refs.length){const e=el(`<p class="gtext how fpnone"></p>`);e.textContent=linked?`Sem conteúdo ainda. O que você adicionar nesta ${L.sp} entra na prova.`:`Sem conteúdo ainda. Marque para que o que você adicionar nesta ${L.sp} entre na prova.`;gw.appendChild(e);return}
      const cl=el(`<ul class="psubs"></ul>`);
      g.refs.forEach(r=>{const on=p.items.includes(r),id=`fpi-${p.id}-${n++}`,st=on&&itemStudied(p,r);
        const row=el(`<li><input type="checkbox" id="${id}"${on?" checked":""}><label for="${id}"></label></li>`);row.querySelector("label").textContent=refLabel(r);
        if(on){const tg=el(`<span class="fst ${st?"ok":""}">${st?"estudado":"pendente"}</span>`);row.querySelector("label").appendChild(tg);if(!st&&refTopics(r).length>1){const ms=refMissing(p,r);if(ms.length){const f2=el(`<span class="fst else"></span>`);f2.textContent="falta: "+ms.map(y=>BYKEY[y.k].t).join(", ");row.querySelector("label").appendChild(f2)}}}
        if(showAll&&!g.s)elseTag(row.querySelector("label"),refElse(p,r));
        row.querySelector("input").onchange=()=>{if(on){if(g.s&&linked){provaSetSp(p,g.s,false);g.refs.forEach(y=>{if(y!==r&&!p.items.includes(y))p.items.push(y)})}p.items=p.items.filter(x=>x!==r)}else p.items.push(r);saveFac();provaChanged(p,"conteúdo alterado em")};
        if(on&&!st){const mk=el(`<button class="link" type="button">já estudei</button>`);mk.onclick=()=>{p.done=[...(p.done||[]),r];saveFac();render()};row.appendChild(mk)}
        cl.appendChild(row)});gw.appendChild(cl)})});
  if(hid||showAll){const t=el(`<button class="link fpall" type="button"></button>`);t.id="fpall-"+p.id;t.textContent=showAll?"Esconder o que já está em outras provas":`Mostrar também o que já está em outras provas (${hid})`;
    t.onclick=()=>{showAll?facProvaAll.delete(p.id):facProvaAll.add(p.id);render()};gw.appendChild(t)}
  body.appendChild(gw);li.appendChild(body);return li}

const INFO_F=[["tipo","Tipo","Tutoria, Habilidades, IESC, Morfofuncional…"],["ch","Carga horária","ex.: 120 h"],["prof","Professor(es)",""],["tutor","Tutor",""],["horario","Dias e horários","ex.: seg e qua, 8h–12h"],["local","Local / sala",""]];
function infoPanel(d,L,edit){const w=el(`<div class="finfo"></div>`);
  if(edit){const g=el(`<div class="fgrid"></div>`),gw=el(`<div class="fgridw"></div>`);
    INFO_F.forEach(([k,lab,ph])=>{const f=el(`<label class="ffield"><span></span><input class="etext" maxlength="160"></label>`);f.querySelector("span").textContent=lab;const i=f.querySelector("input");i.id=`fi-${d.id}-${k}`;i.placeholder=ph;i.value=d.info[k]||"";
      i.onchange=()=>{d.info[k]=i.value.trim();saveFac()};g.appendChild(f)});
    [["ementa","Ementa"],["objetivos","Objetivos gerais"]].forEach(([k,lab])=>{const f=el(`<label class="ffield"><span></span><textarea class="etext" rows="4" maxlength="6000"></textarea></label>`);f.querySelector("span").textContent=lab;
      const t=f.querySelector("textarea");t.id=`fi-${d.id}-${k}`;t.value=d.info[k]||"";t.onchange=()=>{d.info[k]=t.value.trim();saveFac()};gw.appendChild(f)});
    w.append(g,gw);return w}
  const filled=INFO_F.filter(([k])=>d.info[k]);
  if(!filled.length&&!d.info.ementa&&!d.info.objetivos){w.appendChild(el(`<p class="gtext how">Nada preenchido ainda. Toque em <b>Editar</b> para registrar ementa, professor, tutor e horários.</p>`));return w}
  if(filled.length){const dl=el(`<dl class="fdl"></dl>`);filled.forEach(([k,lab])=>{const a=document.createElement("dt"),b=document.createElement("dd");a.textContent=lab;b.textContent=d.info[k];dl.append(a,b)});w.appendChild(dl)}
  [["ementa","Ementa"],["objetivos","Objetivos gerais"]].forEach(([k,lab])=>{if(!d.info[k])return;const x=el(`<div class="ftxt"><span class="glabel"></span><p></p></div>`);x.querySelector(".glabel").textContent=lab;x.querySelector("p").textContent=d.info[k];w.appendChild(x)});
  return w}

function discCard(d,L){const open=facOpenDisc.has(d.id),keys=topicKeysOf(discRefs(d)),c=lvlCounts(keys),n=keys.length,isSP=d.div==="sp";
  const nextP=fac.provas.filter(p=>provaHas(p,d.id)&&p.date>=today()).sort(byDate)[0];
  const card=el(`<section class="area fdc${open?" open":""}" id="fd-${d.id}"><button class="fdsum" type="button" aria-expanded="${open}"><span class="chev" aria-hidden="true"></span>${FOLDER_SVG}<span class="aname"></span><span class="acount"></span><span class="fdmeta"></span>${n?`<div class="bar"><i class="d3"></i><i class="d2"></i><i class="d1"></i></div>`:""}</button></section>`);
  card.querySelector(".aname").textContent=d.name;card.querySelector(".acount").textContent=n?`${n-c[0]}/${n}`:"";
  const meta=card.querySelector(".fdmeta");
  [d.info.tipo,d.sps.length?`${d.sps.length} ${d.sps.length===1?L.sp:plural(L.sp)}`:"",n?`${n} conteúdo${n>1?"s":""}`:"sem conteúdos"].filter(Boolean).forEach(t=>{const s=document.createElement("span");s.textContent=t;meta.appendChild(s)});
  if(nextP){const dd=daysTo(nextP.date),s=el(`<span class="fbadge${dd<=7?" soon":""}"></span>`);s.textContent=`${nextP.name} · ${inLabel(dd)}`;meta.appendChild(s)}
  {const fs=discFocusSec(d,foWeekStart());if(fs>=60){const s=el(`<span class="ffoco"></span>`);s.textContent=`⏱ ${fmtMin(fs)} na semana`;s.title="Tempo de foco nesta semana na disciplina e nos conteúdos dela";meta.appendChild(s)}}
  if(n)bar(card.querySelector(".bar"),c,n);
  card.querySelector(".fdsum").onclick=()=>{if(open){facOpenDisc.delete(d.id);if(facAddC===d.id)facAddC=null}else facOpenDisc.add(d.id);closeEdit();render()};
  if(!open)return card;
  const body=el(`<div class="fdbody"></div>`);
  // ações da disciplina
  const tb=el(`<div class="fdtools"></div>`),infoOpen=facDetOpen.has(d.id),adding=facAddC===d.id,kind=facNew["ckind"+d.id]==="sp"?"sp":"c";
  const addB=(lab,k,prim)=>{const on=adding&&kind===k,b=el(`<button class="btn${prim?" primary":""}" type="button" aria-expanded="${on}"></button>`);b.textContent=lab;b.id=`fadd${k}-${d.id}`;
    b.onclick=()=>{if(on)facAddC=null;else{facAddC=d.id;facNew["ckind"+d.id]=k}render();if(!on)setTimeout(()=>{const x=document.getElementById("fq-c"+d.id);if(x)x.focus()},40)};tb.appendChild(b)};
  if(isSP)addB(`+ ${L.sp}`,"sp",true);addB("+ Conteúdo","c",!isSP);
  const pb=el(`<button class="mini" type="button">+ Prova</button>`);pb.onclick=()=>{facNew["prov"+d.semId]={s:d.semId,d:d.id};facOpenProv.add(d.semId);render();const x=document.getElementById("fpn-"+d.semId);if(x){x.scrollIntoView({behavior:"smooth",block:"center"});x.focus({preventScroll:true})}};
  const mb=el(`<button class="mini" type="button">+ Material</button>`);mb.onclick=()=>{facNew["lkd"+d.id]=facNew["lkd"+d.id]||{t:"",u:""};render();setTimeout(()=>{const x=document.getElementById("flu-d"+d.id);if(x)x.focus()},40)};
  const ib=el(`<button class="mini" type="button" aria-expanded="${infoOpen}">Detalhes e ajustes</button>`);ib.id="fdet-"+d.id;ib.onclick=()=>{facDetOpen.has(d.id)?facDetOpen.delete(d.id):facDetOpen.add(d.id);closeEdit();render()};
  tb.append(pb,mb,ib);body.appendChild(tb);
  {const lb=linksBlock(d,"d"+d.id,false);if(lb)body.appendChild(lb)}
  if(adding)body.appendChild(contentAdder(d,L));
  if(infoOpen){body.appendChild(infoPanel(d,L,true));body.appendChild(discSettings(d,L))}
  const direct=d.items.filter(refOk);
  if(!d.sps.length&&!direct.length&&!adding){const g=el(`<div class="fguide"><b>Como montar esta disciplina</b><ol></ol></div>`);
    g.querySelector("ol").innerHTML=(isSP?`<li><b>+ ${esc(L.sp)}</b>: crie cada ${esc(L.sp)} do seu curso (ex.: ${esc(L.sp)} 3.1 – HIV). Ela é um conteúdo de estudo, com objetivos, fechamento e prova, e pode ser ligada a temas da residência.</li>`:"")+
      `<li><b>+ Conteúdo</b>: adicione cada assunto que você precisa estudar (ex.: Hemostasia, ICC, Anatomia do coração).</li><li><b>+ Prova</b>: cadastre a data da prova; o plano do dia reserva espaço para ela.</li>`;body.appendChild(g)}
  // conteúdos com cara de SP (criados antes das SPs virarem conteúdo)
  {const cand=direct.filter(r=>r.startsWith("O:")&&fac.own[r.slice(2)]&&SP_RE.test(fac.own[r.slice(2)].t));
    if(cand.length){const b=el(`<div class="pnote fspconv"><span></span> <button class="link" type="button"></button></div>`);b.querySelector("span").textContent=`${cand.length===1?"Um conteúdo parece":cand.length+" conteúdos parecem"} ${cand.length===1?L.sp:plural(L.sp)} (${cand.slice(0,3).map(r=>spShort(fac.own[r.slice(2)].t)).join(", ")}${cand.length>3?"…":""}).`;
      const x=b.querySelector("button");x.id="fspconv-"+d.id;x.textContent=`Transformar em ${cand.length===1?L.sp:plural(L.sp)}`;x.onclick=()=>{cand.forEach(r=>toSP(d,r))};body.appendChild(b)}}
  // conteúdos: SPs e os diretos
  const ol=el(`<ol class="flist"></ol>`);
  if(d.sps.length){if(direct.length)ol.appendChild(el(`<li class="flsub"><span class="glabel">${esc(plural(L.sp))}</span></li>`));d.sps.forEach((s,i)=>ol.appendChild(spRow(d,s,L,false,i)))}
  if(direct.length){if(d.sps.length)ol.appendChild(el(`<li class="flsub"><span class="glabel">Outros conteúdos</span></li>`));
    const pseudo={id:"d"+d.id,items:d.items,objs:[],pseudo:true};direct.forEach(r=>{const x=refTopic(r);ol.appendChild(facTopicRow(BYKEY[x.k],r,x,d,pseudo,L,false,()=>removeFromDisc(d,r)))})}
  if(ol.children.length)body.appendChild(ol);
  // provas da disciplina
  const dp=fac.provas.filter(p=>provaHas(p,d.id)).sort(byDate);
  if(dp.length){const pr=el(`<div class="fdprov"><span class="glabel">Provas</span><div class="chips"></div></div>`),pc=pr.querySelector(".chips");
    dp.forEach(p=>{const dd=daysTo(p.date),b=el(`<button class="chip fpchip${dd<0?" past":dd<=7?" soon":""}" type="button"></button>`);b.textContent=`${p.name} · ${dd<0?br(p.date):inLabel(dd)}`;b.onclick=()=>goProva(p);pc.appendChild(b)});
    body.appendChild(pr)}
  card.appendChild(body);return card}
/* Detalhes e ajustes: UC, divisões, renomear e excluir */
function discSettings(d,L){const sem=semOf(d.semId),w=el(`<div class="fdset"></div>`),ucs=(sem&&sem.ucs)||[];
  if(ucs.length){const l=el(`<label class="fcru">Unidade curricular <select class="etext"></select></label>`),se=l.querySelector("select");se.id="fduc-"+d.id;
    [["","Nenhuma"],...ucs.map(u=>[u.id,ucLabel(u,sem)])].forEach(([v,tx])=>{const o=document.createElement("option");o.value=v;o.textContent=tx;se.appendChild(o)});se.value=d.ucId||"";se.onchange=()=>{if(se.value)d.ucId=se.value;else delete d.ucId;saveFac();render()};w.appendChild(l)}
  w.appendChild(segRow("Divisões",`Com ${plural(L.sp)}, cada ${L.sp} é um conteúdo com objetivos, fechamento e prova. Sem divisões, a ${L.disc.toLowerCase()} é só uma lista de conteúdos.`,[["sp",plural(L.sp)],["","Nenhuma"]],d.div==="sp"?"sp":"",v=>{d.div=v;saveFac();render()}));
  const ft=el(`<div class="fdfoot"></div>`);
  if(facEdit==="d"+d.id)ft.appendChild(nameEdit("d"+d.id,d.name,v=>{d.name=v.slice(0,60)}));
  else{const rn=el(`<button class="link" type="button"></button>`);rn.textContent=`Renomear ${L.disc.toLowerCase()}`;rn.onclick=()=>{openEdit("d"+d.id);render()};
    ft.append(rn,armBtn("d"+d.id,`Excluir ${L.disc.toLowerCase()}`,`Toque de novo: apaga a ${L.disc.toLowerCase()}, suas provas e os conteúdos da faculdade só dela`,()=>delDisc(d)))}
  w.appendChild(ft);return w}
function delDisc(d){const mine=fac.provas.filter(p=>provaHas(p,d.id)&&provaDids(p).filter(discOf).length===1),shared=fac.provas.filter(p=>provaHas(p,d.id)&&!mine.includes(p)),dr=discRefs(d),dsp=d.sps.map(s=>s.id);
  toTrash("disc",d.name,"com provas e conteúdos",{d:JSON.parse(JSON.stringify(d)),provas:JSON.parse(JSON.stringify(mine)),os:ownSnap(dr),
    shared:shared.map(p=>({id:p.id,at:provaDids(p).indexOf(d.id),items:p.items.filter(r=>dr.includes(r)),sps:provaSps(p).filter(id=>dsp.includes(id))}))});trSkip=true;try{
  shared.forEach(p=>{const rest=provaDiscs(p).filter(x=>x!==d),keep=new Set(rest.flatMap(discRefs));provaSetDids(p,rest.map(x=>x.id));p.items=p.items.filter(r=>!dr.includes(r)||keep.has(r));if(p.sps){p.sps=p.sps.filter(id=>!dsp.includes(id));if(!p.sps.length)delete p.sps}});
  discRefs(d).filter(r=>r.startsWith("O:")).forEach(r=>{if(!fac.discs.some(x=>x!==d&&discRefs(x).includes(r)))purgeOwn(r.slice(2))});
  d.sps.forEach(s=>s.items.forEach(r=>{const x=refTopic(r);if(x)dropObjs(s,x.k)}));
  fac.provas=fac.provas.filter(p=>!mine.includes(p));fac.discs=fac.discs.filter(x=>x!==d);facDetOpen.delete(d.id)}finally{trSkip=false}saveErrsLocal();saveNotesLocal();saveFac();commit()}
/* mover um conteúdo direto para uma SP */
/* + Conteúdo: buscar na residência ou criar conteúdo da faculdade */
/* área provável de um conteúdo novo: a do tema da residência mais parecido; senão pelo nome; senão a dos outros conteúdos da disciplina */
function guessArea(q,d,res){const top=(res||facSearch(q)).find(r=>r.ref.startsWith("T:"));if(top){const it=BYKEY[top.ref.slice(2)];if(it)return {area:it.area.code,spec:it.sp}}
  const g=suggestMap(q);if(g.area)return g;
  const ks=topicKeysOf(discRefs(d)).map(k=>BYKEY[k]).filter(it=>it&&it.area!==FAC_AREA);if(ks.length){const c={};ks.forEach(it=>{const k=it.area.code+"|"+it.sp;c[k]=(c[k]||0)+1});const [a,sp]=Object.keys(c).sort((x,y)=>c[y]-c[x])[0].split("|");return {area:a,spec:sp}}
  const g2=suggestMap(d.name);return g2.area?g2:{area:"",spec:""}}
function createOwnDirect(d,t,m,pid,links){t=t.trim().slice(0,120);if(!t)return;const dup=exactDup(t);if(dup){addToDisc(d,refOfItem(dup),pid);return}
  const id=fuid(),o={t,discId:d.id};if(m&&m.area&&!(links&&links.length)){o.area=m.area;o.spec=m.spec||""}fac.own[id]=o;d.items.push("O:"+id);provaPut(pid,"O:"+id);facQuery["c"+d.id]="";
  (links||[]).forEach(k=>linkOwnRaw(id,k,[]));saveFac();commit();return id}
function contentAdder(d,L){const key="c"+d.id,q=facQuery[key]||"",dk="cdst"+d.id,kind=facNew["ckind"+d.id]==="sp"?"sp":"c";if(facNew[dk]&&!d.sps.some(s=>s.id===facNew[dk]))facNew[dk]="";const dst=kind==="c"?(facNew[dk]||""):"";
  const w=el(`<div class="fadder"><div class="fadh"><b></b><button class="link" type="button">Fechar</button></div><p class="gtext how"></p></div>`);
  w.querySelector(".fadh b").textContent=kind==="sp"?`Nova ${L.sp}`:"Adicionar conteúdo";
  w.querySelector(".how").innerHTML=kind==="sp"?`Escreva o nome como no seu curso (ex.: ${esc(L.sp)} 3.1 – HIV). Ela vira um conteúdo para estudar, com objetivos, fechamento e prova. Se corresponde a temas da residência, ligue abaixo: o progresso passa a ser o deles.`:`Digite o assunto que você precisa estudar. Se ele já existe na residência, toque em <b>Usar este</b> (o progresso é o mesmo nas duas abas). Se não existe, crie como conteúdo da faculdade e, se quiser, ligue a temas da residência.`;
  w.querySelector(".fadh button").onclick=()=>{facAddC=null;render()};
  if(d.div==="sp"||kind==="sp"){const sg=el(`<div class="seg fckind" role="group" aria-label="O que é"></div>`);[["sp",L.sp],["c","Outro conteúdo"]].forEach(([v,tx])=>{const b=el(`<button type="button" aria-pressed="${kind===v}"></button>`);b.id=`fck-${d.id}-${v}`;b.textContent=tx;b.onclick=()=>{facNew["ckind"+d.id]=v;render();setTimeout(()=>{const x=document.getElementById("fq-"+key);if(x)x.focus()},30)};sg.appendChild(b)});w.appendChild(sg)}
  if(kind==="c"&&d.sps.length){const l=el(`<label class="fmove">Dentro de <select class="fmapsel"></select></label>`),se=l.querySelector("select");se.id="fdst-"+d.id;
    const o0=document.createElement("option");o0.value="";o0.textContent=`Direto na ${L.disc.toLowerCase()}`;se.appendChild(o0);
    d.sps.forEach(s=>{const o=document.createElement("option");o.value=s.id;o.textContent=s.name;se.appendChild(o)});se.value=dst;se.onchange=()=>{facNew[dk]=se.value;render()};w.appendChild(l)}
  const dps=discProvas(d),pk="cpv"+d.id;if(facNew[pk]&&!dps.some(p=>p.id===facNew[pk]))delete facNew[pk];
  const pid=dst?"":(facNew[pk]!==undefined?facNew[pk]:(dps[0]?dps[0].id:""));
  if(dst){const sp=d.sps.find(x=>x.id===dst),pe=sp&&spProvaEl(d,sp,L);if(pe)w.appendChild(pe)}
  else if(dps.length){const l=el(`<label class="fmove">Cai na prova <select class="fmapsel"></select></label>`),se=l.querySelector("select");se.id="fcpv-"+d.id;
    [["","Nenhuma prova"],...dps.map(p=>[p.id,`${p.name} · ${br(p.date)}`])].forEach(([v,tx])=>{const o=document.createElement("option");o.value=v;o.textContent=tx;se.appendChild(o)});
    se.value=pid;se.onchange=()=>{facNew[pk]=se.value;render()};w.appendChild(l)}
  const box=el(`<div class="fsearch"><input class="etext" type="search" aria-label="Nome do conteúdo"><ul class="fres"></ul></div>`),inp=box.querySelector("input");
  inp.id="fq-"+key;inp.placeholder=kind==="sp"?`Ex.: ${L.sp} 3.1 – HIV`:"Ex.: Hemostasia, ICC, Anatomia do coração";inp.value=q;inp.oninput=()=>{facQuery[key]=inp.value;render()};
  inp.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();const b=box.querySelector(".fcreate button:not(:disabled)")||box.querySelector(".fres li:not(.fcreate):not(.fclink):not(.fcarea) button:not(:disabled)");if(b)b.click()}};
  const ul=box.querySelector("ul"),s=d.sps.find(x=>x.id===dst),has=r=>s?s.items.includes(r):discRefs(d).includes(r);
  const use=r=>{if(s)spAdd(d,s,r);else addToDisc(d,r,pid);facQuery[key]="";render();setTimeout(()=>{const x=document.getElementById("fq-"+key);if(x)x.focus()},30)};
  if(q.trim().length>=2){const res=facSearch(kind==="sp"?spClean(q):q).filter(r=>!r.ref.startsWith("S:")).slice(0,6);
    if(kind==="c")res.forEach(r=>{const h=has(r.ref),li=el(`<li><div class="frl"><b></b><span></span></div><button class="mini" type="button"></button></li>`);li.querySelector("b").textContent=r.label;li.querySelector("span").textContent=r.kind+" · "+r.ctx;
      const b=li.querySelector("button");b.textContent=h?"Já está aqui":"Usar este";b.disabled=h;b.onclick=()=>use(r.ref);ul.appendChild(li)});
    const lk=facNew["clk"+d.id]||(facNew["clk"+d.id]={keys:[]}),links=lk.keys.filter(k=>RESKEY(k)),dup=kind==="c"&&exactDup(q);
    const li=el(`<li class="fcreate"><div class="frl"><b></b><span></span></div><button class="mini" type="button"></button></li>`);
    li.querySelector("b").textContent=kind==="sp"?`Criar ${L.sp}: “${q.trim()}”`:`Criar conteúdo da faculdade: “${q.trim()}”`;
    const m=s||links.length?null:(facNew["carea"+d.id]&&facNew["carea"+d.id].q===q?facNew["carea"+d.id]:guessArea(q,d,res)),so=s&&fac.own[s.id];
    li.querySelector("span").textContent=dup?"Já existe com esse nome: use o resultado acima.":links.length?`Ligado a ${links.length===1?BYKEY[links[0]].t:links.length+" temas da residência"}`:`Aparece na aba Residência em ${s?(so&&so.area?`${so.area} · ${so.spec}`:"Faculdade · sem área"):(m&&m.area?`${m.area} · ${m.spec}`:"Faculdade · sem área")}${kind==="c"&&res.length?" · há parecidos acima, confira antes":""}`;
    const b=li.querySelector("button");b.textContent=kind==="sp"?`Criar ${L.sp}`:res.length&&!links.length?"Criar mesmo assim":"Criar";b.disabled=!!dup;
    b.onclick=()=>{if(kind==="sp")addSP(d,q,{area:m,links,pid});else if(s)spCreateOwn(d,s,q,links);else createOwnDirect(d,q,m,pid,links);facQuery[key]="";lk.keys=[];render();setTimeout(()=>{const x=document.getElementById("fq-"+key);if(x)x.focus()},30)};ul.appendChild(li);
    if(!dup){const T=res.filter(r=>r.ref.startsWith("T:")&&RESKEY(r.ref.slice(2))).map(r=>r.ref.slice(2));links.forEach(k=>{if(!T.includes(k))T.unshift(k)});
      const lw=el(`<li class="fclink"><span class="glabel">Ligar à residência (opcional)</span><div class="chips"></div><span class="how"></span></li>`),ch=lw.querySelector(".chips");
      T.slice(0,6).forEach((k,i)=>{const on=links.includes(k),c=el(`<button class="chip" type="button" aria-pressed="${on}"></button>`);c.id=`fcl-${d.id}-${i}`;c.textContent=(on?"✓ ":"+ ")+BYKEY[k].t;c.onclick=()=>{lk.keys=on?lk.keys.filter(x=>x!==k):[...lk.keys,k];render()};ch.appendChild(c)});
      lw.querySelector(".how").textContent=T.length?"Ligado, o progresso é o do tema da residência; com mais de um tema, conta como estudado quando todos estiverem. Para ligar só a alguns subtópicos, abra o conteúdo depois de criar.":"Nenhum tema parecido na residência. Dá para ligar depois, dentro do conteúdo.";ul.appendChild(lw)}
    if(!s&&!dup&&!links.length){const pk2=el(`<li class="fcarea"><span class="fexlab">Área na aba Residência:</span></li>`);pk2.appendChild(mapPicker(m||{area:"",spec:""},x=>{facNew["carea"+d.id]={...x,q};render()},"c"+d.id));ul.appendChild(pk2)}}
  w.appendChild(box);return w}
/* SP › Cai na prova: liga a SP inteira (o que entrar nela depois vai junto) */
function spProvaEl(d,s,L){const ps=fac.provas.filter(p=>provaHas(p,d.id)&&(p.date>=today()||spInProva(p,s))).sort(byDate);if(!ps.length)return null;
  const w=el(`<div class="fsppv"><span class="glabel">Cai na prova</span><div class="chips"></div></div>`),c=w.querySelector(".chips");
  ps.forEach(p=>{const on=spInProva(p,s),b=el(`<button class="chip" type="button" aria-pressed="${on}"></button>`);b.id=`spv-${s.id}-${p.id}`;b.textContent=`${p.name} · ${br(p.date)}`;
    b.onclick=()=>{provaSetSp(p,s,!on);saveFac();provaChanged(p,"conteúdo alterado em")};c.appendChild(b)});
  if(!ps.some(p=>spInProva(p,s))){const h=el(`<p class="gtext how"></p>`);h.textContent=`Ainda não está em nenhuma prova. Toque na prova em que esta ${L.sp} cai.`;w.appendChild(h)}
  return w}
function spRow(d,s,L,edit,i){const open=facOpenSP.has(s.id),keys=topicKeysOf(s.items),st=spStatus(keys),[od,ot]=objStats(s),due=keys.filter(k=>isDue(get(k))).length,sx=refTopic("O:"+s.id),nest=s.items.filter(r=>!isSelf(s,r)&&refOk(r)).length;
  const li=el(`<li class="t fspr${open?" open":""}" id="sp-${s.id}"><button class="item" type="button" aria-expanded="${open}"><span class="num"></span><span class="topic"></span><span class="lvl" data-l="${st.l}"></span><span class="meta"></span></button></li>`);
  li.querySelector(".num").textContent=spNum(s,i);li.querySelector(".topic").textContent=spClean(s.name);li.querySelector(".lvl").textContent=st.t;
  const m=li.querySelector(".meta"),add=(t,c)=>{const x=document.createElement("span");x.textContent=t;if(c)x.className=c;m.appendChild(x)};
  {const rw=resWeightEl(Math.max(0,...s.items.map(resWeight)));if(rw)m.appendChild(rw)}
  if(sx&&sx.links){m.appendChild(el(`<span class="facchip lnk">FAC ↔ RES</span>`));add(sx.links.length>1?`ligada a ${sx.links.length} temas · ${sx.links.filter(linkDone).length} de ${sx.links.length} estudados`:`ligada a ${BYKEY[sx.k].t}`)}
  if(nest)add(`+ ${nest} conteúdo${nest>1?"s":""}`);
  if(ot)add(`${od}/${ot} objetivos`);if(due)add(due>1?`${due} revisões pendentes`:"revisão pendente","late");
  if(typeof s.fech==="string"){const fd=daysTo(s.fech);if(fd>=0)add(`fecha ${inLabel(fd)}`,"fbadge"+(fd<=3?" soon":""));else if(fd>=-7)add("fechada")}
  if(!m.children.length)m.remove();
  li.querySelector(".item").onclick=()=>{open?facOpenSP.delete(s.id):facOpenSP.add(s.id);render()};
  if(open)li.appendChild(spDetail(d,s,L));return li}
function facTopicRow(it,r,x,d,s,L,edit,onRemove){const s0=get(it.key),lsv=s0,dd=dueIn(s0),open=openKey===it.key&&!facShown.has(it.key);if(open)facShown.add(it.key);
  const li=el(`<li class="t${open?" open":""}${it.own?" own":""}"><button class="item" type="button" aria-expanded="${open}"><span class="num"></span><span class="topic"></span><span class="lvl" data-l="${lvKey(lsv)}">${lvName(lsv)}</span><span class="meta"></span></button></li>`);
  li.querySelector(".num").textContent=it.own||x.own?"FAC":it.area.code;li.querySelector(".topic").textContent=x.own?fac.own[x.own].t:x.sub||it.t;
  const m=li.querySelector(".meta"),multi=!!(x.links&&x.links.length>1);
  if(it.own)m.appendChild(el(`<span class="facchip">FAC</span>`));else if(x.own){m.appendChild(el(`<span class="facchip lnk">FAC ↔ RES</span>`));const rw=resWeightEl(resWeight(r));if(rw)m.appendChild(rw)}else{const rw=resWeightEl(wOf(it));if(rw)m.appendChild(rw)}
  const sp=document.createElement("span");sp.textContent=multi?`ligado a ${x.links.length} temas`:x.own?`ligado a ${it.t}${x.subs.length?"":" (tema inteiro)"}`:x.sub?`subtópico de ${it.t}`:it.area===FAC_AREA?"só na Faculdade":it.sp;m.appendChild(sp);
  if(multi)m.appendChild(el(`<span>${x.links.filter(linkDone).length} de ${x.links.length} ligados estudados</span>`));
  else if(x.own&&x.subs.length){const SL=subList(it),n=x.subs.filter(t=>(SL.find(y=>y.t===t)||{}).done).length;m.appendChild(el(`<span>${n}/${x.subs.length} subtópicos ligados</span>`))}
  if(dd!==null)m.appendChild(el(`<span class="${dd<=0?"late":""}">${dueLabel(dd)}</span>`));
  const [sd,stt]=subCount(it);if(sd&&!(x.own&&x.subs.length)&&!multi)m.appendChild(el(`<span>${sd}/${stt} subtópicos</span>`));
  li.querySelector(".item").onclick=()=>{openKey=open?null:it.key;formErr="";subErr="";clearArm=null;render()};
  if(open){li.appendChild(rowActs(d,s,r,L,onRemove));const det=renderDetail(it,{fac:true});if(multi)det.prepend(linkedAllEl(x));if(it.own)det.appendChild(dupBox(it));else if(x.own)det.appendChild(linkPickEl(x.own));li.appendChild(det)}
  else if(it.own){const w=el(`<div class="frmrow"></div>`),b=el(`<button class="link" type="button">Ligar à residência</button>`);b.id="flq-"+it.key.slice(2);b.onclick=()=>{openKey=it.key;facLinkSt={id:it.key.slice(2),k:null,subs:[],all:true};render()};w.appendChild(b);li.appendChild(w)}
  return li}
function spDetail(d,s,L){const box=el(`<div class="detail fspd"></div>`),self="O:"+s.id,sx=refTopic(self),sit=sx&&BYKEY[sx.k],nested=s.items.filter(r=>!isSelf(s,r)&&refOk(r)),pr=primaryRef(s),pit=pr&&BYKEY[refTopic(pr).k];
  if(facEdit==="s"+s.id)box.appendChild(nameEdit("s"+s.id,s.name,v=>{s.name=v.slice(0,120);if(fac.own[s.id])fac.own[s.id].t=s.name}));
  {const pe=spProvaEl(d,s,L);if(pe)box.appendChild(pe)}
  // objetivos
  const objSubs=pit?subList(pit):[];
  const og=el(`<div class="grp fobj"><span class="glabel">Objetivos de aprendizagem</span><ul class="psubs"></ul></div>`),oul=og.querySelector("ul");
  if(!s.objs.length){const p=el(`<li class="empty" style="padding:0"></li>`);p.textContent=`Opcional. Cada objetivo vira um subtópico desta ${L.sp} e pode ser o foco das questões.`;oul.appendChild(p)}
  s.objs.forEach((o,n)=>{const sub=objSubs.find(x=>x.t===o),id=`ob-${s.id}-${n}`;
    const r=el(`<li><input type="checkbox" id="${id}"${sub&&sub.done?" checked":""}${pit?"":" disabled"}><label for="${id}"></label></li>`);r.querySelector("label").textContent=o;
    r.querySelector("input").onchange=()=>{const c2=subList(pit).find(y=>y.t===o);if(c2)toggleSub(pit,c2)};
    if(pit&&!sampleOff){const q=el(`<button class="link" type="button">gerar questões</button>`);q.onclick=()=>{genFocus[pit.key]=o;openTopic(pit.key);setTimeout(()=>{const gq=detGet("qf-",pit.key);if(gq)gq.scrollIntoView({behavior:"smooth",block:"center"})},350)};r.appendChild(q)}
    const xb=el(`<button class="link" type="button" aria-label="Remover objetivo">remover</button>`);xb.onclick=()=>{s.objs=s.objs.filter(y=>y!==o);saveFac();syncObjs(s);commit()};r.appendChild(xb);
    oul.appendChild(r)});
  {const of=el(`<details class="plain fobjd"${facNew["o"+s.id]||!s.objs.length?" open":""}><summary>+ Objetivos</summary><form class="addsub fobjadd"><textarea class="etext" rows="2" maxlength="2000"></textarea><button class="btn" type="submit">Adicionar objetivos</button></form></details>`);
    const ta=of.querySelector("textarea");ta.id="fo-"+s.id;ta.placeholder="Um objetivo por linha (pode colar vários)";ta.setAttribute("aria-label","Novos objetivos");ta.value=facNew["o"+s.id]||"";ta.oninput=()=>facNew["o"+s.id]=ta.value;
    of.querySelector("form").onsubmit=ev=>{ev.preventDefault();const lines=ta.value.split(/\n+/).map(t=>t.replace(/^\s*([-*•]|\d+[.)])\s*/,"").trim()).filter(Boolean);if(!lines.length)return;
      lines.forEach(t=>{t=t.slice(0,200);if(!s.objs.includes(t))s.objs.push(t)});facNew["o"+s.id]="";saveFac();syncObjs(s);commit()};og.appendChild(of);
    if(!sampleOff)og.appendChild(objFEl(d,s,L))}
  box.appendChild(og);
  // estudar a própria SP (o progresso dela, ou o do tema da residência ligado)
  if(sit){const g=el(`<div class="grp fspstudy"><span class="glabel"></span></div>`);g.querySelector(".glabel").textContent=sx.links?`Estudar esta ${L.sp} · ${sx.links.length>1?"tema principal: "+sit.t:"pelo tema ligado"}`:`Estudar esta ${L.sp}`;
    const det=renderDetail(sit,{fac:true});if(sx.links&&sx.links.length>1)det.prepend(linkedAllEl(sx));g.appendChild(det);box.insertBefore(g,og)}
  box.appendChild(linkPickEl(s.id));
  // outros conteúdos dentro da SP (anatomia, fisiologia…)
  if(nested.length){const g=el(`<div class="grp"><span class="glabel"></span><ol class="fsptl"></ol></div>`);g.querySelector(".glabel").textContent=`Outros conteúdos desta ${L.sp}`;
    nested.forEach(r=>{const x=refTopic(r);g.querySelector("ol").appendChild(facTopicRow(BYKEY[x.k],r,x,d,s,L))});box.appendChild(g)}
  box.appendChild(spFechEl(d,s,L));
  const ak="spadd"+s.id;if(facNew[ak]){box.appendChild(spSearch(d,s,L));const c=el(`<button class="link" type="button">Fechar</button>`);c.onclick=()=>{delete facNew[ak];render()};box.appendChild(c)}
  else{const b=el(`<button class="link" type="button"></button>`);b.id="fspadd-"+s.id;b.textContent=`+ Outro conteúdo dentro desta ${L.sp} (ex.: anatomia, fisiologia)`;b.onclick=()=>{facNew[ak]=1;render();setTimeout(()=>{const x=document.getElementById("fq-sp"+s.id);if(x)x.focus()},40)};box.appendChild(b)}
  {const lb=linksBlock(s,"s"+s.id,true);if(lb)box.appendChild(lb)}
  // ações
  const act=el(`<div class="fspact"></div>`);act.appendChild(moveEl(d,s,null,L));if(fac.own[s.id]&&!ownLinks(s.id).length)act.appendChild(areaEl(s.id));
  const rn=el(`<button class="link" type="button"></button>`);rn.textContent=`renomear ${L.sp}`;rn.onclick=()=>{openEdit("s"+s.id);render()};
  act.append(rn,armBtn("s"+s.id,`excluir ${L.sp}`,`Toque de novo: apaga a ${L.sp} (conteúdos da faculdade só dela também)`,()=>delSP(d,s)));box.appendChild(act);return box}
function spSearch(d,s,L){const key="sp"+s.id,q=facQuery[key]||"";
  const box=el(`<div class="fsearch"><input class="etext" type="search" aria-label="Buscar tema para ligar"><ul class="fres"></ul></div>`);
  const inp=box.querySelector("input");inp.id="fq-"+key;inp.placeholder="Adicionar conteúdo (ex.: coagulação, PTI, anatomia do coração)";inp.value=q;inp.oninput=()=>{facQuery[key]=inp.value;render()};
  const ul=box.querySelector("ul");
  if(q.trim().length>=2){const res=facSearch(q).filter(r=>!r.ref.startsWith("S:"));
    res.forEach(r=>{const has=s.items.includes(r.ref);const li=el(`<li><div class="frl"><b></b><span></span></div><button class="mini" type="button"></button></li>`);
      li.querySelector("b").textContent=r.label;li.querySelector("span").textContent=r.kind+" · "+r.ctx;const b=li.querySelector("button");b.textContent=has?`Já está na ${L.sp}`:"Usar este";b.disabled=has;b.onclick=()=>spAdd(d,s,r.ref);ul.appendChild(li)});
    const dup=exactDup(q);
    const li=el(`<li class="fcreate"><div class="frl"><b></b><span></span></div><button class="mini" type="button"></button></li>`);
    li.querySelector("b").textContent=`Criar conteúdo da faculdade: “${q.trim()}”`;
    li.querySelector("span").textContent=dup?"Já existe com esse nome: use o resultado acima.":(pl=>`Fica dentro desta ${L.sp} · aparece na aba Residência em ${pl.A?pl.A.code+" · "+pl.spec:"Faculdade · sem área"}${res.length?" · há conteúdos parecidos acima, confira antes":""}`)(ownPlace({discId:d.id,spId:s.id}));
    const b=li.querySelector("button");b.textContent=res.length?"Criar mesmo assim":"Criar";b.disabled=!!dup;b.onclick=()=>spCreateOwn(d,s,q);ul.appendChild(li)}
  return box}

/* painel: colar a ementa ou o cronograma */
function ementaPanel(sem,L){const I=facImport;const w=el(`<section class="card fimp"></section>`);
  if(I.status==="closed"){const b=el(`<button class="btn" type="button">Colar ementa ou cronograma</button>`);b.onclick=()=>{I.status="edit";render();setTimeout(()=>{const t=document.getElementById("fimpText");if(t)t.focus()},50)};
    w.classList.add("slim");b.textContent="Colar ementa";b.classList.add("primary");w.append(el(`<div class="fimph"><div><b>Cadastro rápido</b><p class="gtext how">Cole a ementa ou o cronograma: o Claude monta ${esc(plural(L.disc).toLowerCase())}, ${esc(plural(L.eixo).toLowerCase())}, ${esc(plural(L.sp))} e objetivos e liga aos temas. Você revisa antes de salvar.</p></div></div>`));w.firstChild.appendChild(b);
    if(sampleOff)b.disabled=true;if(I.done){const p=el(`<p class="gstatus" role="status"></p>`);p.textContent=I.done;w.appendChild(p)}return w}
  w.appendChild(el(`<div class="fimph"><b>Cadastro rápido: colar a ementa</b></div>`));
  if(I.status==="edit"||I.status==="loading"||I.status==="error"){
    const t=el(`<textarea class="etext" rows="8" maxlength="20000" id="fimpText" placeholder="Cole aqui a ementa, o cronograma ou a lista de SPs do semestre. Pode ser texto corrido."></textarea>`);t.value=I.text;t.oninput=()=>I.text=t.value;t.disabled=I.status==="loading";
    const go=el(`<button class="btn primary" type="button">Organizar com o Claude</button>`);go.onclick=()=>ementaRun(sem);go.disabled=I.status==="loading"||!sampleFn;
    const cancel=el(`<button class="btn" type="button"></button>`);cancel.textContent=I.status==="loading"?"Parar":"Fechar";cancel.onclick=()=>{if(I.status==="loading"&&I.ctl)I.ctl.abort();else{I.status="closed";render()}};
    w.append(t,el(`<div class="btns"></div>`));w.lastChild.append(go,cancel);
    if(I.status==="loading")w.appendChild(el(`<p class="gstatus">Organizando… pode levar até um minuto.</p>`));
    if(I.msg){const p=el(`<p class="err"></p>`);p.textContent=I.msg;w.appendChild(p)}
    return w}
  // revisão
  const ds=I.prop||[];
  w.appendChild(el(`<p class="gtext">Confira antes de salvar. Desmarque o que não quiser, corrija a área de cada grupo (ela vai para as ${plural(L.sp)} dele) e tire ligações erradas: cada ${L.sp} fica ligada aos temas marcados. Itens com o mesmo nome do que já existe são juntados, sem duplicar.</p>`));
  const tree=el(`<div class="fimptree"></div>`);
  ds.forEach((pd,di)=>{const db=el(`<div class="fimpd"><label class="fimpc"><input type="checkbox"><b></b></label><span class="fimpi"></span></div>`);const c=db.querySelector("input");c.checked=pd.inc;c.onchange=()=>{pd.inc=c.checked;render()};
    db.querySelector("b").textContent=pd.nome||L.disc;db.querySelector(".fimpi").textContent=[pd.info.tipo,pd.info.ch,pd.info.prof,pd.info.horario].filter(Boolean).join(" · ");
    if(pd.inc)pd.eixos.forEach((pe,ei)=>{const eb=el(`<div class="fimpe"><label class="fimpc"><input type="checkbox"><b></b></label></div>`);const ec=eb.querySelector("input");ec.checked=pe.inc;ec.onchange=()=>{pe.inc=ec.checked;render()};
      eb.querySelector("b").textContent=pe.nome||"(sem grupo)";
      if(pe.nome&&pe.inc)eb.appendChild(mapPicker(pe,m=>{pe.area=m.area;pe.spec=m.spec;render()},`imp-${di}-${ei}`));
      if(pe.inc)pe.sps.forEach(ps=>{const sb=el(`<div class="fimps"><label class="fimpc"><input type="checkbox"><span></span></label><div class="fimpchips"></div></div>`);const sc=sb.querySelector("input");sc.checked=ps.inc;sc.onchange=()=>{ps.inc=sc.checked;render()};
        sb.querySelector("span").textContent=ps.nome+(ps.objs.length?` · ${ps.objs.length} objetivo${ps.objs.length>1?"s":""}`:"");
        const ch=sb.querySelector(".fimpchips");
        ps.temas.forEach(k=>{const c2=el(`<button type="button" class="fchip"></button>`);c2.textContent=BYKEY[k].t+" ×";c2.title="Tirar esta ligação";c2.onclick=()=>{ps.temas=ps.temas.filter(x=>x!==k);render()};ch.appendChild(c2)});
        ps.novos.forEach(t=>{const c2=el(`<button type="button" class="fchip fac"></button>`);c2.textContent="FAC · "+t+" ×";c2.title="Não criar este tema";c2.onclick=()=>{ps.novos=ps.novos.filter(x=>x!==t);render()};ch.appendChild(c2)});
        if(!ps.temas.length&&!ps.novos.length)ch.appendChild(el(`<span class="gtext how">sem tema ligado: ligue depois na ${L.sp}</span>`));
        eb.appendChild(sb)});
      db.appendChild(eb)});
    tree.appendChild(db)});
  w.appendChild(tree);
  const save=el(`<button class="btn primary" type="button">Salvar no semestre</button>`);save.disabled=!ds.some(x=>x.inc);
  save.onclick=()=>{const r=ementaApply(sem.id,ds);I.doneSem=sem.id;I.status="closed";I.prop=null;I.text="";I.done=`Salvo: ${r.nd} ${L.disc.toLowerCase()}${r.nd===1?"":"s"} nova${r.nd===1?"":"s"}, ${r.ns} ${L.sp}${r.ns===1?"":"s"} e ${r.nt} tema${r.nt===1?"":"s"} da faculdade criado${r.nt===1?"":"s"}.`;render()};
  const back=el(`<button class="btn" type="button">Voltar ao texto</button>`);back.onclick=()=>{I.status="edit";render()};
  const drop=el(`<button class="link" type="button">Descartar</button>`);drop.onclick=()=>{I.status="closed";I.prop=null;render()};
  w.append(el(`<div class="btns"></div>`));w.lastChild.append(save,back,drop);
  return w}

/* filtros e agrupamento por especialidade (anotações e caderno de erros) */
function spChips(box,area,sel,countOf,pick){box.innerHTML="";box.hidden=area==="all";if(area==="all")return;
  const a=AREAS.find(x=>x.code===area);if(!a){box.hidden=true;return}
  [["all","Todas as especialidades"],...a.specs.map(x=>[x.name,x.name])].forEach(([v,lab])=>{const c=countOf(v);if(v!=="all"&&!c)return;
    const b=el(`<button class="chip" aria-pressed="${sel===v}"></button>`);b.textContent=`${lab} · ${c}`;b.onclick=()=>pick(v);box.appendChild(b)})}
function groupHead(it,area,count,unit){const h=el(`<li class="lhead"><span class="code"></span><span class="lname"></span><span class="lcount"></span></li>`);
  h.querySelector(".code").textContent=it.area.code;h.querySelector(".lname").textContent=it.sp;
  h.querySelector(".lcount").textContent=`${count} ${count===1?unit[0]:unit[1]}`;return h}
function appendGrouped(list,items,keyOf,render1,unit){let cur=null;
  const cnt={};items.forEach(x=>{const g=spKey(keyOf(x));cnt[g]=(cnt[g]||0)+1});
  items.forEach(x=>{const it=keyOf(x),g=spKey(it);if(g!==cur){cur=g;list.appendChild(groupHead(it,null,cnt[g],unit))}list.appendChild(render1(x))})}

/* caderno de erros */
const byNewest=(a,b)=>a.d<b.d?1:a.d>b.d?-1:(a.id<b.id?1:-1);
function ecardEl(e,withTopic){
  const it=BYKEY[e.k];
  const c=el(`<li class="ecard" data-eid="${e.id}" data-t="${ETYPES[e.t]?e.t:"conhecimento"}"><div class="ehead"></div><p class="ebody"><b>Errei</b><span class="w"></span></p><p class="ebody epista" hidden><b>Pista do caso</b><span class="p"></span></p><p class="ebody"><b>Correto</b><span class="r"></span></p><div class="efoot"><span class="rv"></span><span class="sp"></span></div></li>`);
  const h=c.querySelector(".ehead");
  if(withTopic&&it){const tb=el(`<button class="etopic" type="button"></button>`);tb.textContent=it.t;tb.onclick=()=>openTopic(e.k);h.appendChild(tb);h.appendChild(el(`<span>${it.area.code}</span>`))}
  h.appendChild(el(`<span class="etype">${ETYPES[e.t]||""}</span>`));h.appendChild(el(`<span>${br(e.d)}</span>`));
  if(e.s){const s=el(`<span></span>`);s.textContent=e.s;h.appendChild(s)}
  if(e.c){const s=el(`<span class="ecause"></span>`);s.textContent=e.c;h.appendChild(s)}
  if(e.arch)c.classList.add("arch");
  c.querySelector(".w").textContent=e.w;eRFill(c.querySelector(".r"),e.r);if(ePista(e)){boldFill(c.querySelector(".p"),ePista(e));c.querySelector(".epista").hidden=false}eExtraBlocks(c,e,true);
  if(e.arch)c.querySelector(".rv").textContent=`Arquivado em ${br(e.arch)}${e.rev?` · revisado ${e.rev}×`:""}`;else{const du=eDue(e),bc=eByCard(e);c.querySelector(".rv").textContent=`${e.fm?`Formado em ${br(e.fm)} (volta se você errar o tema de novo)`:bc?"Revisado pelos cartões":du<=today()?"Revisar hoje":"Próxima revisão "+br(du)}${e.rev?` · revisado ${e.rev}×`:""}${e.miss?` · ainda erraria ${e.miss}×`:""}`;if(du<=today())c.querySelector(".rv").classList.add("due")}
  const ft=c.querySelector(".efoot");
  const rb=eCardBtn(e);
  const db=el(`<button class="mini${delArm===e.id?" warn":""}" type="button">${delArm===e.id?"Confirmar exclusão":"Excluir"}</button>`);
  db.onclick=()=>{if(delArm===e.id){delArm=null;delErr(e.id)}else{delArm=e.id;render()}};
  const ab=el(`<button class="mini" type="button"></button>`);ab.textContent=e.arch?"Desarquivar":"Resolvido";ab.title=e.arch?"Volta para as revisões":"Arquiva: sai das revisões e da lista (fica em Arquivados)";ab.onclick=()=>eArchive(e,!e.arch);
  const mb=el(`<button class="mini emenu" type="button" aria-expanded="${eMenu===e.id}"></button>`);mb.textContent=eMenu===e.id?"Fechar ações":"⋯ Ações";mb.onclick=()=>{eMenu=eMenu===e.id?null:e.id;render()};
  const pb=el(`<button class="mini" type="button"></button>`);pb.id="epg-"+e.id;const pgD=ePegDraft(e),pgIn=pgD.x&&pegOf(e.k).some(o=>norm(o.x)===norm(pgD.x));pb.textContent=pgIn?"Na anotação ✓":"Virar pegadinha";pb.disabled=pgIn||!pgD.x;
  pb.title="Escreve na seção Pegadinhas da anotação do tema (aparece em Caderno › Pegadinhas)";pb.onclick=()=>{pegAdd(e.k,pgD.x,pgD.why);render()};
  if(eMenu===e.id){ft.append(rb);if(e.t==="interpretacao"||e.t==="confusao")ft.append(pb);ft.append(ab,db,mb)}else ft.append(mb);if(cdErr[e.id])c.appendChild(cdErrEl(e));
  return c;
}
function eRaClean(r){if(!r||typeof r!=="object")return null;const S=(v,n)=>typeof v==="string"?v.slice(0,n):"",L=(v,n,m)=>Array.isArray(v)?v.filter(x=>typeof x==="string"&&x.trim()).slice(0,n).map(x=>x.slice(0,m)):[];
  const o={regra:S(r.regra,600),dados:L(r.dados,6,160),passos:L(r.passos,5,500),naoSua:S(r.naoSua,800),src:["app","claude","eu"].includes(r.src)?r.src:"app",at:S(r.at,10)};
  if(r.contraste&&typeof r.contraste==="object"&&Array.isArray(r.contraste.h)&&Array.isArray(r.contraste.rows)){const rows=r.contraste.rows.filter(x=>x&&typeof x==="object").slice(0,6).map(x=>({l:S(x.l,80),a:S(x.a,200),b:S(x.b,200)})).filter(x=>x.a||x.b);if(rows.length)o.contraste={h:[S(r.contraste.h[0],80),S(r.contraste.h[1],80)],rows}}
  if(r.caso2&&typeof r.caso2==="object"&&typeof r.caso2.e==="string"&&r.caso2.e.trim())o.caso2={e:S(r.caso2.e,3000),ask:S(r.caso2.ask,400),ans:S(r.caso2.ans,600)};return o}
function errOk(e){if(!e||typeof e!=="object"||!BYKEY[e.k]||typeof e.id!=="string")return false;if(e.ra!==undefined){const r=eRaClean(e.ra);if(r)e.ra=r;else delete e.ra}for(const f of ["w","r","s"])if(typeof e[f]!=="string")e[f]=String(e[f]??"");if(typeof e.d!=="string")e.d=today();
  for(const f of ["pc","dd"])if(e[f]!=null&&typeof e[f]!=="string")delete e[f];
  if(e.q!=null&&!(e.q&&typeof e.q==="object"&&typeof e.q.e==="string"&&Array.isArray(e.q.a)))delete e.q;return true}
function saveErrsLocal(){try{localStorage.setItem(LSE,JSON.stringify(errors))}catch(x){}}
async function putErr(e){saveErrsLocal();if(!errStore)return;
  const k="er:"+e.id;try{await errStore.doc(e.id).set({...e});saveOk(k)}catch(x){setSave(x&&x.code==="quota_exceeded"?"Caderno cheio na conta: exclua erros antigos para salvar novos.":"Não foi possível salvar o erro na conta; ficou salvo neste navegador");if(errors.includes(e))saveFail(k,"erro do caderno",x,()=>putErr(e))}}
async function delErr(id){{const e=errors.find(x=>x.id===id);if(e)toTrash("err",topicName(e.k),e.w,e)}errors=errors.filter(e=>e.id!==id);saveErrsLocal();render();if(errStore)try{await errStore.doc(id).delete()}catch(x){}}
/* ---------- Caderno de erros: revisão ativa, registro rápido, erros repetidos, cartão e anotação ---------- */
const E_INT=[1,3,7,15,30];
let erRun=null,eReg=null,eMenu=null;
function eBox(e){return Number.isInteger(e.box)&&e.box>=0&&e.box<E_INT.length?e.box:Math.min(e.rev||0,E_INT.length-1)}
// erros antigos (sem data marcada) entram pela data do último "revisei" ou do registro
function eDue(e){if(typeof e.due==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(e.due))return e.due;const b=/^\d{4}-\d{2}-\d{2}$/.test(e.lastRev||"")?e.lastRev:/^\d{4}-\d{2}-\d{2}$/.test(e.d||"")?e.d:today();return fromNum(dnum(b)+E_INT[eBox(e)])}
/* uma agenda por questão (Lote 17): erro que virou cartão é revisado pelo cartão, não volta na revisão de erros */
const eByCard=e=>cards.some(x=>!x.dr&&(x.eid===e.id||(e.cd&&x.id===e.cd)));
const eDueNow=e=>eDue(e)<=today()&&!eByCard(e)&&!e.fm;
const eDueList=()=>errors.filter(e=>BYKEY[e.k]&&!e.arch&&eDueNow(e));
/* auditoria 26/10: acertou no degrau de 30 dias → o erro se forma (e.fm = data): sai da revisão, continua no caderno; volta se você errar o tema de novo (eNew) */
/* Lote 21: 3 notas — 0 Errei (volta amanhã, conta como erro) · 1 Em parte (mesmo degrau, volta na metade do que o Acertei daria, mín. 2 dias: 2, 3, 7, 15) · 2 Acertei (próximo degrau). true/false antigos = 2/0 */
const E_PART_MIN=2;
const eUp=e=>eBox(e)>=E_INT.length-1?E_INT[E_INT.length-1]:E_INT[Math.min(eBox(e)+1,E_INT.length-1)];
function eNext(e,g){return g===0?1:g===1?Math.max(E_PART_MIN,Math.floor(eUp(e)/2)):eUp(e)}
function eAnswer(e,good){if(good===1){e.rev=(e.rev||0)+1;e.lastRev=today();e.due=fromNum(dnum(today())+eNext(e,1));e.lp=today();putErr(e);return}if(good===2)good=true;else if(good===0)good=false;e.rev=(e.rev||0)+1;e.lastRev=today();
  if(good&&eBox(e)>=E_INT.length-1){e.fm=today();e.due=fromNum(dnum(today())+E_INT[E_INT.length-1])}
  else if(good){e.box=Math.min(eBox(e)+1,E_INT.length-1);e.due=fromNum(dnum(today())+E_INT[e.box])}
  else{e.box=0;e.due=fromNum(dnum(today())+1);e.miss=(e.miss||0)+1;e.lastMiss=today()}
  putErr(e)}
function eNew(k,w,r,t,s,c,p,x){const e={id:Date.now().toString(36)+Math.random().toString(36).slice(2,7),k,w:w.trim(),r:r.trim(),t:ETYPES[t]?t:"conhecimento",s:(s||"").trim(),d:today(),rev:0,box:0,due:fromNum(dnum(today())+E_INT[0])};
  if(c&&(ECAUSES[e.t]||[]).includes(c))e.c=c;
  errors.forEach(o=>{if(o.k===k&&o.fm){delete o.fm;o.box=Math.max(0,eBox(o)-2);o.due=fromNum(dnum(today())+1);putErr(o)}});/* errou o tema de novo: os erros formados dele voltam */
  if(typeof p==="string"&&p.trim())e.p=p.trim().slice(0,600);
  x=x||{};if(typeof x.pc==="string"&&x.pc.trim())e.pc=x.pc.trim().slice(0,1200);if(typeof x.dd==="string"&&x.dd.trim())e.dd=x.dd.trim().slice(0,400);
  if(x.qf&&typeof x.qf.e==="string"&&Array.isArray(x.qf.a)){e.q={e:x.qf.e,a:x.qf.a.filter(a=>a&&typeof a.t==="string").map(a=>({l:String(a.l||""),t:a.t,...(typeof a.p==="string"&&a.p.trim()?{p:a.p.trim().slice(0,1200)}:{})})),c:String(x.qf.c||""),m:String(x.qf.m||"")};
    /* Lote 20: comentário e conceito inteiros, para os cartões não saírem cortados */
    if(typeof x.qf.cm==="string"&&x.qf.cm.trim())e.q.cm=x.qf.cm.trim().slice(0,4000);if(typeof x.qf.co==="string"&&x.qf.co.trim())e.q.co=x.qf.co.trim().slice(0,600)}
  if(e.q){const o=eOrg(e);if(o)e.ra=o}/* Lote 21: o app já organiza o erro ao salvar */
  errors.push(e);putErr(e);return e}
const eOneLine=s=>String(s||"").split("\n").map(cmTidy).filter(Boolean).join(" ").replace(/\s+/g," ").trim();
/* rascunho a partir de uma questão respondida (geradas, simulado, refazer) */
const CL_STOP=new Set("para pelo pela pelos pelas como mais menos sobre entre quando qual quais deve devem pode podem esta este essa esse isso isto está estão com sem que uma umas uns dos das nos nas aos foi era são ser ter tem tinha após antes desde paciente anos idade sexo masculino feminino feminina masculina apresenta apresentando refere queixa história quadro caso seguinte seguintes alternativa correta conduta diagnóstico provável mais adequada assinale".split(" "));
const clWords=t=>new Set(norm(String(t||"")).split(/[^a-z0-9]+/).filter(w=>w.length>=4&&!CL_STOP.has(w)));
const clCut=(t,n)=>{t=String(t||"").replace(/\s+/g," ").trim().replace(/[.;:]+$/,"");if(t.length<=n)return t;const c=t.slice(0,n),i=c.lastIndexOf(" ");return (i>n*.6?c.slice(0,i):c).replace(/[,;:]$/,"")+"…"};
const clSents=t=>String(t||"").replace(/\s+/g," ").trim().replace(/([.!?])\s+(?=[A-ZÀ-Ú0-9"(])/g,"$1\u0001").split("\u0001").map(x=>x.trim()).filter(Boolean);
/* "Correto" do erro na tela: tira as marcas da prova (cmTidy) e destaca "Por que não a sua" numa linha própria (nada é regravado) */
function eRFill(box,r){box.textContent="";String(r||"").split("\n").map(cmTidy).filter(Boolean).forEach((l,i)=>{const m=l.match(/^(Por que n[ãa]o[^:]{0,90}:)\s*(.*)$/);if(i&&!m)box.appendChild(document.createElement("br"));
  if(m){const b=document.createElement("b");b.className="ewhy";b.textContent="Por que não a sua";box.appendChild(b);box.append(cmTidy(m[2]))}else box.append(l)})}
/* texto com **negrito** (pista) → nós, sem HTML do usuário */
function boldFill(box,t){box.textContent="";String(t||"").split(/(\*\*[^*]+\*\*)/).forEach(x=>{if(!x)return;const m=x.match(/^\*\*([^*]+)\*\*$/);if(m){const b=document.createElement("strong");b.textContent=m[1];box.appendChild(b)}else box.append(x)})}
/* blocos extras do erro: dados decisivos (com a pista), ponto-chave (com o correto) e a questão completa */
let eQOpen=new Set();
function eExtraBlocks(card,e,show){const pi=card.querySelector(".epista");
  if(e.dd){const d=el(`<p class="ebody edd"><b>Dados decisivos</b><span></span></p>`);d.querySelector("span").textContent=e.dd;pi.after(d)}
  if(!show)return;const r=card.querySelector(".r").closest(".ebody");
  if(e.pc){const k=el(`<p class="ebody epc"><b>Ponto-chave</b><span></span></p>`);k.querySelector("span").textContent=cmTidy(e.pc);r.after(k)}
  if(e.q){const open=eQOpen.has(e.id),w=el(`<div class="eqfull"><button class="link" type="button"></button></div>`),b=w.querySelector("button");b.id="eqf-"+e.id;b.textContent=open?"Esconder a questão":"Ver a questão completa";b.setAttribute("aria-expanded",open);
    b.onclick=()=>{open?eQOpen.delete(e.id):eQOpen.add(e.id);render()};
    if(open){const st=el(`<p class="eqstem"></p>`);st.textContent=e.q.e;w.appendChild(st);const ol=el(`<ol class="eqalts"></ol>`);
      e.q.a.forEach(a=>{const li=el(`<li><b></b> <span></span></li>`);li.querySelector("b").textContent=a.l+")";li.querySelector("span").textContent=a.t;if(a.l===e.q.c)li.classList.add("right");else if(a.l===e.q.m)li.classList.add("mine");ol.appendChild(li)});w.appendChild(ol)}
    (card.querySelector(".epc")||r).after(w)}}
/* pista antiga que é só a pergunta da questão ("Qual…?") não ajuda: não aparece */
const ePista=e=>{const p=String(e.p||"").trim();return !p||/\?\s*$/.test(p)&&!/[.!]\s/.test(p)?"":p};
/* pista do caso: a frase do enunciado que mais aponta para a resposta certa (palavras da correta/comentário, números e exames) */
function qClue(q){const S=clSents(q.enunciado);if(!S.length)return "";const isAsk=x=>/\?$/.test(x)||/\b(assinale|marque|qual (?:[ée]|a|o|das|dos)|indique|aponte)\b/i.test(x);
  let C=S.filter(x=>!isAsk(x));if(!C.length)return "";/* só a pergunta, sem caso: não há pista */if(C.length===1)return clCut(C[0],220);
  const r=q.alternativas.find(a=>a.letra===q.correta),K=clWords([r&&r.texto,q.comentario,q.conceito,q.pc,q.th].join(" ")),W=[...q.alternativas.filter(a=>a.letra!==q.correta)].reduce((m,a)=>{clWords(a.texto).forEach(w=>m.add(w));return m},new Set());
  const sc=C.map((x,i)=>{const ws=clWords(x);let v=0;ws.forEach(w=>{if(K.has(w))v+=W.has(w)?0.5:2});
    if(/\d/.test(x))v+=0.8;if(/\b(exame|mostra|revela|evidencia|laborat|hemograma|tomografia|radiografia|ultrass|bi[óo]psia|ecg|eletrocardio|resson|sorologia|cultura|gasometria|achado|ausculta|palpa)/i.test(x))v+=1;
    if(i===0&&ws.size<5)v-=1;return {x,v,i}}).sort((a,b)=>b.v-a.v||a.i-b.i);
  return clCut(sc[0].x,220)}
/* pista em frase com **negrito** nas palavras que apontam para a certa (e números/achados de exame) */
const CL_EXAM=/\b(exame|mostra|revela|evidencia|laborat|hemograma|plaquetas?|leuc[oó]citos|hb|tomografia|radiografia|ultrass|bi[óo]psia|ecg|eletrocardio|resson|sorologia|cultura|gasometria|achado|ausculta|palpa|ttpa|tp|inr|ferritina|creatinina|pa\b|fc\b|febre|saturação)/i;
function qClueRich(q){const t=qClue(q);if(!t)return "";const r=q.alternativas.find(a=>a.letra===q.correta),K=clWords([r&&r.texto,q.comentario,q.conceito,q.pc].join(" ")),W=new Set();q.alternativas.filter(a=>a.letra!==q.correta).forEach(a=>clWords(a.texto).forEach(w=>W.add(w)));
  const out=t.split(/(\s+)/).map(w=>{if(/^\s+$/.test(w)||!w)return w;const m=w.match(/^([("“]*)(.*?)([),.;:!?”"]*)$/),core=m[2],n=norm(core).replace(/[^a-z0-9]/g,"");
    const pre=n.slice(0,5),inK=n.length>=4&&(K.has(n)||n.length>=5&&[...K].some(k=>k.length>=5&&k.slice(0,5)===pre)),inW=W.has(n)||n.length>=5&&[...W].some(k=>k.length>=5&&k.slice(0,5)===pre);
    const hit=core&&(/\d/.test(core)||inK&&!inW||CL_EXAM.test(core)&&core.length>=2);return hit?`${m[1]}**${core}**${m[3]}`:w}).join("");
  return out.replace(/\*\*(\s+)\*\*/g,"$1")}
/* dados decisivos: 2–3 trechos curtos do caso (números, achados de exame, palavras da certa) */
function qData(q){const S=clSents(q.enunciado).filter(x=>!(/\?$/.test(x)||/\b(assinale|marque|qual (?:[ée]|a|o|das|dos)|indique|aponte)\b/i.test(x)));if(!S.length)return "";
  const r=q.alternativas.find(a=>a.letra===q.correta),K=clWords([r&&r.texto,q.comentario,q.conceito,q.pc].join(" "));
  const C=[];S.forEach((x,i)=>x.split(/[;,]\s+|\.\s+|\s+e\s+(?=[a-zà-ú]+\s)/).forEach(c=>{c=c.trim().replace(/[.;:]+$/,"").replace(/^(?:e|mas|porém)\s+/i,"");if(c.length<6)return;const ws=clWords(c);let v=0;ws.forEach(w=>{if(K.has(w))v+=1.5});if(/\d/.test(c))v+=1.2;if(CL_EXAM.test(c))v+=1;if(i===0&&/\b(anos|homem|mulher|paciente|criança|lactente|gestante)\b/i.test(c)&&!/\d{2,}\s*(mg|g\/|mm|%)/.test(c))v-=.6;if(v>0)C.push({c,v,o:C.length})}));
  return C.sort((a,b)=>b.v-a.v||a.o-b.o).slice(0,3).sort((a,b)=>a.o-b.o).map(x=>clCut(x.c,80)).join(" · ")}
