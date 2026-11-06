/* ---------- panorama de estudos em PDF ---------- */
let pdfOpt={open:false,res:true,fac:true,err:true,period:"30",custom:"",mats:new Set(),matOpen:false,msg:"",busy:false};
const specId=it=>"sp:"+it.area.code+"|"+it.sp;
/* matérias: especialidades da residência (por área) e disciplinas dos semestres ativos */
function matCatalog(){const out=[];AREAS.forEach(a=>{const m={};[...a.items,...FAC_ITEMS.filter(i=>i.area===a)].forEach(i=>{const id=specId(i);(m[id]=m[id]||{id,label:i.sp,keys:[]}).keys.push(i.key)});out.push({g:a.name,code:a.code,items:Object.values(m)})});
  const act=fac.sems.filter(s=>!s.archived),ds=[];act.forEach(s=>semDiscs(s.id).forEach(d=>ds.push({id:"d:"+d.id,label:d.name+(act.length>1?" · "+s.name:""),keys:topicKeysOf(discRefs(d))})));
  out.push({g:"Faculdade",code:"FAC",items:ds});return out}
function matSel(o){const sel=[],ms=o.mats||new Set();matCatalog().forEach(g=>g.items.forEach(m=>{if(ms.has(m.id)&&((o.res&&m.id.startsWith("sp:"))||(o.fac&&m.id.startsWith("d:"))))sel.push({...m,g:g.g,code:g.code})}));return sel}
const ETORD={conhecimento:0,confusao:1,interpretacao:2};
function reportData(o){const t=dnum(today()),from=o.period==="all"?null:fromNum(t-(+o.period)+1),inP=d=>!from||d>=from,sel=matSel(o),mk=sel.length?new Set(sel.flatMap(m=>m.keys)):null;
  const S={e:0,r:0,q:0,c:0,act:0};Object.keys(hist).filter(inP).forEach(d=>{const h=hist[d]||{};S.e+=h.e||0;S.r+=h.r||0;S.q+=h.q||0;S.c+=h.c||0;if(h.e||h.r||h.q)S.act++});
  const sems=fac.sems.filter(s=>!s.archived),facKeys=new Set();sems.forEach(s=>semDiscs(s.id).forEach(d=>topicKeysOf(discRefs(d)).forEach(k=>facKeys.add(k))));
  const inScope=k=>!!BYKEY[k]&&(!mk||mk.has(k))&&((o.res&&!BYKEY[k].own)||(o.fac&&facKeys.has(k))||(mk&&mk.has(k)));
  const errs=errors.filter(e=>inScope(e.k)&&inP(e.d)),groups={};errs.forEach(e=>{(groups[e.k]=groups[e.k]||[]).push(e)});
  const topics=Object.keys(groups).map(k=>{const s=get(k),pq=qPeriod([k],from);return {k,it:BYKEY[k],s,pq,acc:s.qt?s.qc/s.qt:null,list:groups[k].sort((a,b)=>(ETORD[a.t]??3)-(ETORD[b.t]??3)||(a.d<b.d?1:-1))}})
    .sort((a,b)=>(a.acc===null)-(b.acc===null)||(a.acc??0)-(b.acc??0)||b.list.length-a.list.length);
  const tc={conhecimento:0,interpretacao:0,confusao:0};errs.forEach(e=>tc[e.t]=(tc[e.t]||0)+1);
  const qs=keys=>{let q=0,c=0;keys.forEach(k=>{const s=get(k);q+=s.qt||0;c+=s.qc||0});return {q,c}};
  let F=null;if(mk){const keys=[...mk].filter(k=>BYKEY[k]),c=lvlCounts(keys),q=qPeriod(keys,from);F={n:keys.length,c,seen:keys.length-c[0],q:q.q,qc:q.c,und:q.und,est:q.est,stP:keys.filter(k=>{const st=get(k);return (st.ed||[]).some(inP)||(st.last&&inP(st.last))}).length,due:keys.filter(k=>isDue(get(k))).length}}
  // tempo de foco no período e nas matérias
  const foIn=x=>{const t=(x.ref||"")[0],id=(x.ref||"").slice(2);if(mk){if(t==="T")return mk.has(id);if(t==="D")return sel.some(m=>m.id==="d:"+id);return false}
    if(t==="T"&&BYKEY[id])return BYKEY[id].own?o.fac:o.res;if(t==="D")return o.fac;return true};
  const fl=foSess.filter(x=>inP(x.d)&&foIn(x)),fby={};fl.forEach(x=>{const m=foMat(x),r=fby[m.id]||(fby[m.id]={lab:m.lab,sec:0,n:0});r.sec+=x.sec;r.n++});
  const fdm={};fl.forEach(x=>{fdm[x.d]=(fdm[x.d]||0)+x.sec});const fFirst=fl.length?fl.map(x=>x.d).sort()[0]:null;
  const Fo={n:fl.length,sec:foSum(fl),days:Object.keys(fdm).length,span:from?t-dnum(from)+1:(fFirst?t-dnum(fFirst)+1:0),goalDays:foDG()?Object.values(fdm).filter(v=>v>=foDG()*60).length:0,by:Object.values(fby).sort((a,b)=>b.sec-a.sec)};
  return {from,S,first:Object.keys(hist).sort()[0],errs,topics,tc,qRes:qs(ALL.map(i=>i.key)),qFac:qs([...facKeys]),sems,sel,mk,F,Fo}}
function topicTips(it,list,s){const tips=[],n=t=>list.filter(x=>x.t===t).length,subs=[...new Set(list.map(x=>x.s).filter(Boolean))].slice(0,3),sl=subs.join(", ");
  if(n("conhecimento"))tips.push(`Volte à teoria ${sl?"de "+sl:"do tema"} antes de fazer novas questões. Estude pelos subtópicos e marque-os: eles entram nas revisões espaçadas.`);
  if(n("confusao"))tips.push(`Monte um quadro comparativo com o que você confundiu${sl?" ("+sl+")":""}, lado a lado, e releia o caderno de erros a cada revisão deste tema.`);
  if(n("interpretacao"))tips.push("Antes de olhar as alternativas, sublinhe o que o enunciado pede (conduta, diagnóstico, exceto, mais provável) e os dados que mudam a resposta.");
  const a=s.qt?Math.round(s.qc/s.qt*100):null;
  if(a===null)tips.push("Ainda não há questões registradas neste tema: faça 10 para medir o seu acerto.");
  else if(s.qt>=WEAK_MIN&&a<WEAK_PCT*100)tips.push(`Acerto de ${a}%: gere 10 questões deste tema com foco nos seus erros e repita até passar de ${Math.round(WEAK_PCT*100)}%.`);
  else if(a<80)tips.push(`Acerto de ${a}%: mantenha 5 questões deste tema por semana até chegar a 80%.`);
  const nr=list.filter(x=>!x.rev).length;if(nr)tips.push(`${nr} erro${nr>1?"s":""} ainda não revisado${nr>1?"s":""}: releia e marque "Revisei este erro" no caderno.`);
  if(isDue(s))tips.push("A revisão espaçada deste tema está pendente: faça hoje.");
  return tips}
function buildReport(o){const R=reportData(o),P=new MiniPDF("Panorama de estudos"),M=46,CW=P.W-2*M;let y=M;
  const C={ink:[20,27,45],mut:[92,99,117],acc:[22,38,74],soft:[229,232,239],line:[225,218,203],due:[179,64,43],l1:[176,122,14],l2:[47,111,176],l3:[15,122,76],bg:[243,240,233],trk:[232,226,213]};
  const need=h=>{if(y+h>P.H-M-14){P.add();y=M}};
  const para=(t,q={})=>{const s=q.size||9.6,lh=s*1.42,ind=q.indent||0;pdfWrap(t,s,q.bold,CW-ind).forEach(l=>{need(lh);P.text(M+ind,y+s,l,{size:s,bold:q.bold,color:q.color});y+=lh});y+=q.after??3};
  const h2=t=>{need(96);y+=12;P.text(M,y+15,t,{size:15,bold:true,color:C.acc});y+=22;P.line(M,y,M+CW,y,C.line);y+=10};
  const h3=t=>{need(34);y+=6;para(t,{size:11.5,bold:true,after:1})};
  const bar=(x,yy,w,h,parts)=>{P.rect(x,yy,w,h,C.trk);let o2=0;parts.forEach(([v,c])=>{if(v>0){P.rect(x+o2,yy,Math.min(w-o2,w*v),h,c);o2+=w*v}})};
  const kpis=items=>{const g=8,bw=(CW-g*(items.length-1))/items.length,bh=54;need(bh+8);items.forEach(([lab,val,sub],i)=>{const x=M+i*(bw+g);P.rect(x,y,bw,bh,C.bg);
      P.text(x+9,y+14,lab.toUpperCase(),{size:6.8,bold:true,color:C.mut});P.text(x+9,y+33,val,{size:16,bold:true});pdfWrap(sub,7.4,false,bw-16).slice(0,1).forEach(l=>P.text(x+9,y+46,l,{size:7.4,color:C.mut}))});y+=bh+10};
  const table=(cols,rows)=>{const hh=16;need(hh+18);cols.forEach((c,i)=>{c.pad=i&&cols[i-1].al==="r"?14:4});let x=M;cols.forEach(c=>{P.text(c.al==="r"?x+c.w-pdfW(c.t,7.6,true)-4:x+c.pad,y+11,c.t.toUpperCase(),{size:7.6,bold:true,color:C.mut});x+=c.w});y+=hh;P.line(M,y,M+CW,y,C.line);
    rows.forEach(r=>{const rh=18;need(rh);let x2=M;r.forEach((v,i)=>{const c=cols[i];if(v&&v.bar){bar(x2+c.pad,y+6,c.w-c.pad-6,6,v.bar)}else{const s=String(v??"");let tx=s;while(tx.length>3&&pdfW(tx,8.6,i===0)>c.w-8)tx=tx.slice(0,-2)+"…";
        P.text(c.al==="r"?x2+c.w-pdfW(tx,8.6,false)-4:x2+c.pad,y+12,tx,{size:8.6,bold:i===0})}x2+=c.w});y+=rh;P.line(M,y,M+CW,y,C.line,0.3)});y+=8};
  const pctS=(a,b)=>b?Math.round(a/b*100)+"%":"–";
  const periodLabel=R.from?`${br(R.from)}/${R.from.slice(0,4)} a ${br(today())}/${today().slice(0,4)} (últimos ${o.period} dia${o.period==="1"?"":"s"})`:`desde o início${R.first?` (${br(R.first)}/${R.first.slice(0,4)})`:""}`;
  const scope=o.res&&o.fac?"Residência e Faculdade":o.res?"Residência":"Faculdade";
  // capa
  P.rect(0,0,P.W,8,C.acc);
  P.text(M,y+22,"Panorama de estudos",{size:24,bold:true});y+=34;
  P.text(M,y+12,[ui.profile.name,scope].filter(Boolean).join(" · "),{size:11,bold:true,color:C.acc});y+=18;
  P.text(M,y+10,`Período: ${periodLabel} · gerado em ${new Date().toLocaleDateString("pt-BR")}`,{size:9,color:C.mut});y+=16;
  if(R.sel.length){const names=R.sel.map(m=>m.label);pdfWrap(`Matérias: ${names.join(", ")}`,9,true,CW).slice(0,3).forEach(l=>{P.text(M,y+10,l,{size:9,bold:true,color:C.ink});y+=13});y+=3}
  if(ui.profile.goalDate){const dd=daysTo(ui.profile.goalDate);P.text(M,y+10,`Meta: ${ui.profile.goal||"prova de residência"}${dd>=0?` · faltam ${dd} dias`:""}`,{size:9,color:C.mut});y+=16}
  y+=6;
  h2(R.F?"Resumo das matérias escolhidas":"Resumo do período");
  if(R.F){const F=R.F;kpis([["Temas vistos",`${F.seen}/${F.n}`,`${F.c[3]} dominado${F.c[3]===1?"":"s"}`],["Estudados no período",String(F.stP),"temas estudados ou revisados"],["Questões",String(F.q),F.q?`${pctS(F.qc,F.q)} de acerto${R.from?" no período":""}`:(R.from?"nenhuma no período":"nenhuma registrada")],["Erros no período",String(R.errs.length),F.due?`${F.due} revis${F.due===1?"ão pendente":"ões pendentes"}`:"no caderno de erros"]]);
    para(`Questões, acerto, estudos e erros contam só o período e as matérias escolhidas.${F.est?` ${F.est} questões foram registradas antes de 08/10/2026, quando o app ainda não guardava a data por tema: a data delas foi estimada pelo último estudo do tema.`:""}${R.from&&F.und?` ${F.und} questões antigas de temas nunca estudados não têm data e só entram em "Tudo".`:""}`,{size:8,color:C.mut,after:4})}
  else kpis([["Dias com estudo",String(R.S.act),`sequência atual: ${streak()} dia${streak()===1?"":"s"}`],["Temas estudados",String(R.S.e),"temas começados"],["Revisões",String(R.S.r),"revisões espaçadas feitas"],["Questões",String(R.S.q),R.S.q?`${pctS(R.S.c,R.S.q)} de acerto`:"nenhuma no período"]]);
  // tempo de foco
  if(R.Fo.n){const Fo=R.Fo,g=foDG();h2("Tempo de estudo (Foco)");
    kpis([["Tempo total",fmtMin(Fo.sec),`${Fo.n} ${Fo.n===1?"sessão":"sessões"}`],["Dias com foco",String(Fo.days),Fo.span?`de ${Fo.span} dia${Fo.span===1?"":"s"} no período`:""],["Média por dia",fmtMin(Fo.span?Fo.sec/Fo.span:0),`${fmtMin(Fo.days?Fo.sec/Fo.days:0)} nos dias com foco`],g?["Dias na meta",String(Fo.goalDays),`meta de ${fmtMin(g*60)} por dia`]:["Sessão média",fmtMin(Fo.sec/Fo.n),"pomodoro, cronômetro e manual"]]);
    const w=CW,mx=Fo.by[0].sec;table([{t:"Matéria",w:w*.44},{t:"Tempo",w:w*.14,al:"r"},{t:"Sessões",w:w*.13,al:"r"},{t:"Parte do tempo",w:w*.29}],Fo.by.slice(0,15).map(r=>[r.lab,fmtMin(r.sec),String(r.n),{bar:[[r.sec/mx,C.acc]]}]));
    if(Fo.by.length>15)para(`+ ${Fo.by.length-15} matérias com menos tempo.`,{size:7.6,color:C.mut});
    para(`Tempo registrado na aba Foco${R.mk?", só das matérias escolhidas":""}. Temas contam na especialidade; disciplinas da faculdade, pelo nome.`,{size:7.6,color:C.mut})}
  // residência
  const selSp=R.sel.filter(m=>m.id.startsWith("sp:")),selD=R.sel.filter(m=>m.id.startsWith("d:"));
  if(o.res&&R.mk&&selSp.length){h2("Residência");const w=CW;
    table([{t:"Especialidade",w:w*.37},{t:"Vistos",w:w*.10,al:"r"},{t:"Progresso",w:w*.21},{t:"Domin.",w:w*.10,al:"r"},{t:"Questões",w:w*.11,al:"r"},{t:"Acerto",w:w*.11,al:"r"}],
      selSp.map(m=>{const ks=m.keys.filter(k=>BYKEY[k]),k=lvlCounts(ks),n=ks.length||1,pq=qPeriod(ks,R.from),q=pq.q,cc=pq.c;
        return [`${m.code} · ${m.label}`,`${ks.length-k[0]}/${ks.length}`,{bar:[[k[3]/n,C.l3],[k[2]/n,C.l2],[k[1]/n,C.l1]]},String(k[3]),String(q),pctS(cc,q)]}));
    if(R.from)para("Questões e acerto: só as respondidas no período.",{size:7.6,color:C.mut})}
  else if(o.res&&!R.mk){h2("Residência");const c=counts(ALL),seen=c[1]+c[2]+c[3];
    para(`${TOTAL} temas: ${c[3]} dominado${c[3]===1?"":"s"}, ${c[2]} revisado${c[2]===1?"":"s"}, ${c[1]} estudado${c[1]===1?"":"s"}${c[4]?`, ${c[4]} em estudo`:""} e ${c[0]-c[4]} não iniciado${c[0]-c[4]===1?"":"s"}. ${pctS(seen,TOTAL)} dos temas já foram vistos; ${weighted()}% do peso das provas já foi estudado.`,{after:6});
    need(16);bar(M,y,CW,9,[[c[3]/TOTAL,C.l3],[c[2]/TOTAL,C.l2],[c[1]/TOTAL,C.l1]]);y+=14;
    para("Verde: dominados · azul: revisados · amarelo: estudados · cinza: não iniciados.",{size:7.6,color:C.mut,after:8});
    const w=CW;table([{t:"Área",w:w*.37},{t:"Vistos",w:w*.10,al:"r"},{t:"Progresso",w:w*.21},{t:"Domin.",w:w*.10,al:"r"},{t:"Questões",w:w*.11,al:"r"},{t:"Acerto",w:w*.11,al:"r"}],
      AREAS.map(a=>{const k=counts(a.items),n=a.items.length,pq=qPeriod(a.items.map(i=>i.key),R.from),q=pq.q,cc=pq.c;
        return [a.name,`${k[1]+k[2]+k[3]}/${n}`,{bar:[[k[3]/n,C.l3],[k[2]/n,C.l2],[k[1]/n,C.l1]]},String(k[3]),String(q),pctS(cc,q)]}));
    if(R.from){const u=qPeriod(ALL.map(i=>i.key),R.from);para(`Questões e acerto: só as respondidas no período.${u.est?` Inclui ${u.est} com data estimada (registradas antes de 08/10/2026).`:""}${u.und?` ${u.und} antigas, de temas nunca estudados, só entram em "Tudo".`:""}`,{size:7.6,color:C.mut})}
    const due=ALL.filter(i=>isDue(get(i.key))).length;if(due)para(`${due} revis${due===1?"ão pendente":"ões pendentes"} da residência hoje.`,{color:C.due,bold:true})}
  // faculdade
  if(o.fac&&(!R.mk||selD.length)){h2("Faculdade");
    if(!R.sems.length)para("Nenhum semestre ativo cadastrado.",{color:C.mut});
    R.sems.forEach(s=>{const L=lv(s),ds=semDiscs(s.id).filter(d=>!R.mk||selD.some(m=>m.id==="d:"+d.id));if(R.mk&&!ds.length)return;const keys=topicKeysOf(ds.flatMap(discRefs)),k=lvlCounts(keys),n=keys.length;
      h3(`${s.name} · ${ds.length} ${(ds.length===1?L.disc:plural(L.disc)).toLowerCase()} · ${n?pctS(n-k[0],n)+" do conteúdo estudado":"sem conteúdos ainda"}`);
      if(ds.length){const w=CW;table([{t:L.disc,w:w*.34},{t:"Estudados",w:w*.14,al:"r"},{t:"Progresso",w:w*.22},{t:"Próxima prova",w:w*.30}],
        ds.map(d=>{const ks=topicKeysOf(discRefs(d)),kk=lvlCounts(ks),nn=ks.length,np=fac.provas.filter(p=>provaHas(p,d.id)&&p.date>=today()).sort(byDate)[0];
          return [d.name,nn?`${nn-kk[0]}/${nn}`:"0",{bar:nn?[[kk[3]/nn,C.l3],[kk[2]/nn,C.l2],[kk[1]/nn,C.l1]]:[]},np?`${np.name} · ${br(np.date)} · ${provaPending(np).length} pend.`:"–"]}))}})}
  // questões e erros
  if(o.err){h2("Questões e erros");
    if(R.F)para(`Questões nas matérias escolhidas${R.from?" no período":""}: ${R.F.q}${R.F.q?` (${pctS(R.F.qc,R.F.q)} de acerto)`:""}.`,{bold:true,after:8});
    else{para(`Questões respondidas no período: ${R.S.q}${R.S.q?` (${pctS(R.S.c,R.S.q)} de acerto)`:""}.`,{bold:true,after:2});
    const acc=[];if(o.res)acc.push(`residência: ${R.qRes.q} questões, ${pctS(R.qRes.c,R.qRes.q)} de acerto`);if(o.fac)acc.push(`faculdade: ${R.qFac.q} questões, ${pctS(R.qFac.c,R.qFac.q)} de acerto`);
    para(`Acumulado desde o início: ${acc.join("; ")}.`,{color:C.mut,after:8})}
    if(!R.errs.length)para(errors.length?"Nenhum erro registrado no caderno neste período e nesta parte.":"O caderno de erros está vazio. Depois de errar uma questão, registre o erro no tema (o que você marcou, o correto e o porquê) para ele aparecer aqui com dicas de como melhorar.",{color:C.mut});
    else{const tot=R.errs.length;h3(`Por que você errou (${tot} erro${tot>1?"s":""} no caderno)`);
      Object.keys(ETYPES).forEach(t=>{const v=R.tc[t]||0;need(18);P.text(M,y+10,ETYPES[t],{size:9});P.text(M+CW-40,y+10,`${v} · ${pctS(v,tot)}`,{size:9,bold:true});bar(M+190,y+4,CW-240,7,[[v/tot,t==="conhecimento"?C.due:t==="interpretacao"?C.l1:C.l2]]);y+=17});
      const top=Object.keys(R.tc).sort((a,b)=>R.tc[b]-R.tc[a])[0];if(ETIPS[top])para(ETIPS[top],{color:C.acc,after:6});
      h3("Principais erros por tema");para("Ordem: temas com menor acerto primeiro. Dentro de cada tema: primeiro o que você não sabia, depois o que confundiu, por último o que leu errado.",{size:8.4,color:C.mut,after:6});
      R.topics.slice(0,25).forEach((T,i)=>{const it=T.it,s=T.s;need(60);y+=4;
        para(`${i+1}. ${it.t}`,{size:11,bold:true,after:0});
        para(`${it.own?"Faculdade":it.area.code}${it.sp?" · "+it.sp:""} · ${R.from&&T.pq.q?`no período: ${Math.round(T.pq.c/T.pq.q*100)}% em ${T.pq.q} questões · `:""}${s.qt?`acumulado: ${Math.round(s.qc/s.qt*100)}% em ${s.qt}`:"sem questões registradas"} · ${T.list.length} erro${T.list.length>1?"s":""} no período`,{size:8.4,color:C.mut,after:4});
        T.list.slice(0,8).forEach(e=>{need(40);para(`• ${ETYPES[e.t]||"Erro"}${e.s?" · "+e.s:""} · ${br(e.d)}`,{size:9,bold:true,indent:8,after:0});
          para(`Errei: ${e.w}`,{size:9,indent:18,after:0});para(`Correto: ${e.r}`,{size:9,indent:18,color:C.l3,after:4})});
        if(T.list.length>8)para(`+ ${T.list.length-8} outros erros neste tema no caderno.`,{size:8.4,color:C.mut,indent:8});
        const tips=topicTips(it,T.list,s);if(tips.length){need(30);para("Como melhorar",{size:9,bold:true,color:C.acc,indent:8,after:1});tips.forEach(tp=>para(`– ${tp}`,{size:9,indent:16,after:1}))}
        y+=6;need(4);P.line(M,y,M+CW,y,C.line,0.3);y+=4});
      if(R.topics.length>25)para(`+ ${R.topics.length-25} temas com erros não listados. Veja todos no Caderno de erros do app.`,{color:C.mut})}}
  // rodapé
  const n=P.pages.length;P.pages.forEach((pg,i)=>{P.cur=pg;P.line(M,P.H-M+4,M+CW,P.H-M+4,C.line,0.4);P.text(M,P.H-M+16,"Nexus - Trilha Médica · Panorama de estudos",{size:7.6,color:C.mut});const t=`página ${i+1} de ${n}`;P.text(M+CW-pdfW(t,7.6,false),P.H-M+16,t,{size:7.6,color:C.mut})});
  return P.output()}
async function exportPDF(){const o=pdfOpt;if(!o.res&&!o.fac){o.msg="Escolha Residência, Faculdade ou as duas.";render();return}
  if(!downloadsFn){o.msg="Não foi possível salvar arquivos nesta visualização.";render();return}
  o.busy=true;o.msg="Gerando o PDF…";render();
  try{const bytes=buildReport(o),blob=new Blob([bytes],{type:"application/pdf"});
    await downloadsFn.save({filename:`panorama-estudos-${today()}.pdf`,data:blob});o.msg="PDF salvo. No iPhone/iPad ele fica no app Arquivos (ou escolha onde salvar na janela de compartilhar)."}
  catch(e){o.msg=e&&(e.code==="declined"||e.code==="cancelled")?"Salvamento cancelado.":"Não foi possível gerar o PDF. Tente de novo."}
  o.busy=false;render()}
function pdfPanel(){const o=pdfOpt,w=el(`<div class="pdfpan"><span class="glabel">Exportar panorama em PDF</span><div class="pdfck"></div></div>`),ck=w.querySelector(".pdfck");
  [["res","Residência","temas, áreas e progresso"],["fac","Faculdade","semestres, disciplinas e provas"],["err","Questões e erros","acerto, principais erros por tema e como melhorar"]].forEach(([k,t,d])=>{
    const l=el(`<label class="pdfopt"><input type="checkbox"><span><b></b><em></em></span></label>`),i=l.querySelector("input");i.id="pdf-"+k;i.checked=o[k];i.onchange=()=>{o[k]=i.checked;o.msg="";render()};
    l.querySelector("b").textContent=t;l.querySelector("em").textContent=d;ck.appendChild(l)});
  const PER=["7","15","30","60","90"],pr=segRow("Período","",[...PER.map(v=>[v,v+" dias"]),["all","Tudo"]],PER.includes(o.period)||o.period==="all"?o.period:"",v=>{o.period=v;o.custom="";render()});
  const cu=el(`<label class="pdfcus">Outro: <input class="etext" type="number" min="1" max="730" inputmode="numeric" id="pdf-dias" placeholder="ex.: 45"> dias</label>`),ci=cu.querySelector("input");ci.value=o.custom;
  ci.oninput=()=>{o.custom=ci.value;const n=Math.round(+ci.value);if(n>=1&&n<=730){o.period=String(n)}};ci.onchange=()=>render();pr.querySelector(".seg").appendChild(cu);w.appendChild(pr);
  // matérias
  const cat=matCatalog().filter(g=>g.code==="FAC"?o.fac:o.res),selN=matSel(o).length;
  const md=el(`<details class="pdfmat"${o.matOpen?" open":""}><summary></summary><div class="pdfmatb"><input class="etext" type="search" id="pdf-matq" placeholder="Buscar matéria (ex.: cardio, NCS)"><div class="pdfmatl"></div></div></details>`);
  md.querySelector("summary").innerHTML=`<b>Matérias</b> <span>${selN?`${selN} escolhida${selN>1?"s":""}`:"todas"}</span>`;
  md.querySelector("summary").onclick=e=>{e.preventDefault();o.matOpen=!o.matOpen;render()};
  const ml=md.querySelector(".pdfmatl"),mq=md.querySelector("input");mq.value=o.matQ||"";mq.oninput=()=>{o.matQ=mq.value;render()};
  const nq=norm(o.matQ||"");
  if(selN){const cl=el(`<button class="link" type="button">Limpar (usar todas)</button>`);cl.onclick=()=>{o.mats.clear();render()};ml.appendChild(cl)}
  cat.forEach(g=>{const items=g.items.filter(m=>!nq||norm(m.label+" "+g.g).includes(nq));if(!items.length)return;
    ml.appendChild(el(`<span class="glabel">${esc(g.g)}</span>`));const gw=el(`<div class="pdfmatg"></div>`);
    items.forEach(m=>{const id="pm-"+m.id.replace(/[^a-z0-9]/gi,"_"),l=el(`<label class="pdfm"><input type="checkbox"><span></span><em></em></label>`),i=l.querySelector("input");i.id=id;i.checked=o.mats.has(m.id);
      i.onchange=()=>{i.checked?o.mats.add(m.id):o.mats.delete(m.id);o.msg="";render()};l.querySelector("span").textContent=m.label;l.querySelector("em").textContent=`${m.keys.length} tema${m.keys.length===1?"":"s"}`;gw.appendChild(l)});
    ml.appendChild(gw)});
  if(!ml.children.length)ml.appendChild(el(`<p class="gtext how">Nenhuma matéria encontrada.</p>`));
  w.appendChild(md);
  const b=el(`<button class="btn primary" type="button">Gerar PDF</button>`);b.disabled=o.busy||(!o.res&&!o.fac);b.onclick=exportPDF;w.appendChild(b);
  if(o.msg){const m=el(`<p class="gstatus" role="status"></p>`);m.textContent=o.msg;w.appendChild(m)}
  return w}

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
/* Perfil: lista de provas de residência */
/* ---------- catálogo de provas (Lote 16, pesquisa de 10/2026: calendários Medway, MedCof, BIP, Estratégia MED; bancas conferidas só onde a fonte diz) ----------
   r = região (NAC, NE, N, CO, SE, S), m = mês habitual da 1ª fase (1–12; 0 = não informado), b = banca ("" = não informada), v = entra pelo ENARE, o = "outras" (fora do top 10) */
const EXC_REG=[["NAC","Nacionais"],["NE","Nordeste"],["N","Norte"],["CO","Centro-Oeste"],["SE","Sudeste"],["S","Sul"]];
const EX_CAT=[
 {n:"ENARE / ENAMED",r:"NAC",uf:"BR",b:"FGV · Ebserh/INEP",m:9,x:"enare enamed nacional"},
 {n:"HUOL / UFRN (pelo ENARE)",r:"NE",uf:"RN",b:"FGV (ENARE)",m:9,v:1,x:"huol onofre lopes ufrn natal mejc huab"},
 {n:"SESAP-RN",r:"NE",uf:"RN",b:"SESAP-RN",m:1,x:"sesap walfredo gurgel natal"},
 {n:"UERN",r:"NE",uf:"RN",b:"Funcitern",m:0,x:"mossoro pau dos ferros"},
 {n:"SURCE / SESA-CE (pelo ENARE)",r:"NE",uf:"CE",b:"FGV (ENARE)",m:9,v:1,x:"surce ceara fortaleza hgf ijf hgwa huwc ufc sobral esp"},
 {n:"SUS-BA",r:"NE",uf:"BA",b:"Strix",m:11,x:"bahia salvador"},
 {n:"SES-PE",r:"NE",uf:"PE",b:"IAUPE",m:12,x:"pernambuco recife petrolina"},
 {n:"PSU-AL (CEREM-AL)",r:"NE",uf:"AL",b:"",m:0,x:"alagoas maceio"},
 {n:"UEMA",r:"NE",uf:"MA",b:"",m:11,x:"maranhao"},
 {n:"Santa Casa de Maceió",r:"NE",uf:"AL",b:"",m:12,x:"scm maceio"},
 {n:"SMS João Pessoa",r:"NE",uf:"PB",b:"",m:11,x:"sms-jp paraiba"},
 {n:"FAMENE",r:"NE",uf:"PB",b:"",m:11,x:"paraiba"},
 {n:"FBHC",r:"NE",uf:"SE",b:"",m:11,x:"sergipe aracaju"},
 {n:"Hospital Infantil Varela Santiago (HIVS)",r:"NE",uf:"RN",b:"",m:10,o:1,x:"hivs natal pediatria"},
 {n:"Liga Norte-Rio-Grandense Contra o Câncer",r:"NE",uf:"RN",b:"",m:0,o:1,x:"lnrcc liga natal oncologia"},
 {n:"CERMAM",r:"N",uf:"AM",b:"",m:0,x:"amazonas manaus"},
 {n:"UEPA",r:"N",uf:"PA",b:"",m:0,x:"para belem"},
 {n:"SES-RO",r:"N",uf:"RO",b:"IESPRO",m:12,x:"rondonia porto velho"},
 {n:"FUNDHACRE",r:"N",uf:"AC",b:"",m:12,x:"acre rio branco"},
 {n:"Hospital Yano",r:"N",uf:"TO",b:"",m:1,x:"tocantins palmas"},
 {n:"PSU-GO",r:"CO",uf:"GO",b:"",m:11,x:"goias goiania"},
 {n:"SES-GO",r:"CO",uf:"GO",b:"Instituto Verbena/UFG",m:12,x:"goias goiania"},
 {n:"SES-DF",r:"CO",uf:"DF",b:"",m:12,x:"brasilia distrito federal"},
 {n:"FUBOG",r:"CO",uf:"GO",b:"",m:10,x:"goias"},
 {n:"HCMS",r:"CO",uf:"MS",b:"",m:12,x:"mato grosso do sul campo grande"},
 {n:"Hospital Geral de Cuiabá (UNIC)",r:"CO",uf:"MT",b:"",m:12,x:"mato grosso cuiaba"},
 {n:"Complexo Hospitalar Jardim Cuiabá",r:"CO",uf:"MT",b:"",m:12,x:"mato grosso cuiaba chjc"},
 {n:"Santa Casa de Campo Grande",r:"CO",uf:"MS",b:"Consesp",m:8,x:"mato grosso do sul"},
 {n:"USP-SP (FMUSP)",r:"SE",uf:"SP",b:"FUVEST",m:12,x:"usp sao paulo hcfmusp"},
 {n:"UNIFESP",r:"SE",uf:"SP",b:"VUNESP",m:11,x:"sao paulo epm"},
 {n:"UNICAMP",r:"SE",uf:"SP",b:"Comvest",m:11,x:"campinas"},
 {n:"USP-RP (HCFMRP)",r:"SE",uf:"SP",b:"",m:11,x:"ribeirao preto"},
 {n:"SUS-SP",r:"SE",uf:"SP",b:"VUNESP",m:12,x:"sao paulo"},
 {n:"Santa Casa de São Paulo",r:"SE",uf:"SP",b:"FCC",m:12,x:"scmsp iscmsp"},
 {n:"Einstein (HIAE)",r:"SE",uf:"SP",b:"VUNESP",m:11,x:"albert einstein"},
 {n:"UNESP Botucatu",r:"SE",uf:"SP",b:"VUNESP",m:12,x:"unesp fmb"},
 {n:"UERJ",r:"SE",uf:"RJ",b:"",m:11,x:"rio de janeiro"},
 {n:"PSU-MG",r:"SE",uf:"MG",b:"",m:11,x:"minas gerais belo horizonte"},
 {n:"Sírio-Libanês",r:"SE",uf:"SP",b:"VUNESP",m:9,o:1,x:"sirio libanes hsl"},
 {n:"SES-RJ",r:"SE",uf:"RJ",b:"",m:12,o:1,x:"rio de janeiro"},
 {n:"IAMSPE",r:"SE",uf:"SP",b:"Instituto Avança São Paulo",m:11,o:1,x:"iamspe servidor"},
 {n:"FAMERP",r:"SE",uf:"SP",b:"FAMERP (comissão própria)",m:11,o:1,x:"sao jose do rio preto"},
 {n:"FMABC",r:"SE",uf:"SP",b:"Instituto Avalia",m:11,o:1,x:"abc santo andre"},
 {n:"EMESCAM",r:"SE",uf:"ES",b:"",m:11,o:1,x:"espirito santo vitoria"},
 {n:"PSU-ES",r:"SE",uf:"ES",b:"",m:11,o:1,x:"espirito santo"},
 {n:"Santa Casa de BH (SCM-BH)",r:"SE",uf:"MG",b:"",m:11,o:1,x:"belo horizonte scmbh"},
 {n:"IPSEMG",r:"SE",uf:"MG",b:"",m:12,o:1,x:"belo horizonte"},
 {n:"AMRIGS",r:"S",uf:"RS",b:"",m:11,x:"rio grande do sul porto alegre"},
 {n:"HCPA",r:"S",uf:"RS",b:"",m:10,x:"hospital de clinicas porto alegre"},
 {n:"UFCSPA / Moinhos de Vento",r:"S",uf:"RS",b:"",m:11,x:"porto alegre hmv"},
 {n:"PUC-PR",r:"S",uf:"PR",b:"",m:10,x:"curitiba parana"},
 {n:"AMP-PR",r:"S",uf:"PR",b:"",m:11,x:"curitiba parana"},
 {n:"UEL",r:"S",uf:"PR",b:"",m:11,x:"londrina"},
 {n:"Hospital do Trabalhador",r:"S",uf:"PR",b:"",m:10,x:"curitiba"},
 {n:"Hospital Pequeno Príncipe",r:"S",uf:"PR",b:"",m:11,x:"curitiba hpp pediatria"},
 {n:"UEM",r:"S",uf:"PR",b:"",m:12,x:"maringa"},
 {n:"Hospital Angelina Caron",r:"S",uf:"PR",b:"",m:12,x:"curitiba"}];
const MESES=["","janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
let excQ={},excOpen=false,excReg="NE";
const excLine=c=>[c.uf,c.b||"banca não informada",c.m?`costuma ser em ${MESES[c.m]}`:"mês não informado"].join(" · ")+(c.v?" · seleção pelo ENARE":"");
function excFind(q){const n=norm(q.trim());if(n.length<2)return [];return EX_CAT.filter(c=>norm(c.n+" "+c.uf+" "+c.x).includes(n)||n.split(/\s+/).every(w=>norm(c.n+" "+c.x).includes(w))).slice(0,6)}
/* data sugerida: dia 15 do mês habitual, na próxima vez que ele chegar */
function excDate(m){if(!m)return "";const t=today(),y=+t.slice(0,4);let d=`${y}-${String(m).padStart(2,"0")}-15`;if(d<t)d=`${y+1}-${String(m).padStart(2,"0")}-15`;return d}
let excJust=null;
function excPick(id,c){const y=exList().find(z=>z.id===id);if(!y)return;excJust=id;setTimeout(()=>{if(excJust===id)excJust=null},400);y.name=c.n;if(!y.date||y.est){const d=excDate(c.m);if(d){y.date=d;y.est=1}else{delete y.date;delete y.est}}excQ[id]="";saveUI();render()}
function excAdd(c){const id="ex"+Date.now().toString(36),L2=exList(),d=excDate(c.m);ui.profile.exams=[...L2,{id,name:c.n,...(d?{date:d,est:1}:{})}];if(!L2.length)ui.profile.mainEx=id;saveUI();render()}
function excPanelEl(){const w=el(`<div class="excat" id="excPanel"><div class="seg" role="group" aria-label="Região"></div><ul class="exclist"></ul><p class="how hx">Lista de 10/2026 (Medway, MedCof, BIP, Estratégia MED). Banca e mês podem mudar a cada edital: confira o edital. "Pelo ENARE" = a instituição seleciona pela prova nacional.</p></div>`),sg=w.querySelector(".seg");
  EXC_REG.forEach(([v,l])=>{const b=el(`<button type="button"></button>`);b.id="excR-"+v;b.textContent=`${l} · ${EX_CAT.filter(c=>c.r===v).length}`;b.setAttribute("aria-pressed",excReg===v);b.onclick=()=>{excReg=v;render()};sg.appendChild(b)});
  const ul=w.querySelector("ul"),has=new Set(exList().map(x=>norm(x.name||"")));
  [["Principais",EX_CAT.filter(c=>c.r===excReg&&!c.o)],["Outras",EX_CAT.filter(c=>c.r===excReg&&c.o)]].forEach(([h,L])=>{if(!L.length)return;ul.appendChild(el(`<li class="exch2">${h}</li>`));
    L.forEach(c=>{const li=el(`<li class="excrow"><div><b></b><span class="how"></span></div><button class="mini" type="button"></button></li>`);li.querySelector("b").textContent=c.n;li.querySelector(".how").textContent=excLine(c);
      const b=li.querySelector("button"),on=has.has(norm(c.n));b.id="excA-"+EX_CAT.indexOf(c);b.textContent=on?"Na sua lista":"+ Adicionar";b.disabled=on||exList().length>=12;b.onclick=()=>excAdd(c);ul.appendChild(li)})});
  return w}
function exEditorEl(){const P=ui.profile,L=exList(),main=exMain();
  const mt=el(`<section class="card pfex"><div class="dhead"><h2>Provas de residência</h2></div><p class="gtext how hx">Cadastre as provas que vai prestar e marque a principal: ela guia a projeção do Início. Sem data, o Início mostra só o seu ritmo; as outras aparecem marcadas na linha do tempo e no calendário.</p><ul class="exlist"></ul><div class="btns"><button class="btn" type="button" id="pfExAdd">+ Adicionar prova</button><button class="btn" type="button" id="pfExCat"></button></div><p class="pfcount"></p></section>`);
  {const cb=mt.querySelector("#pfExCat");cb.textContent=excOpen?"Fechar o catálogo":"Ver provas por região";cb.setAttribute("aria-expanded",excOpen);cb.onclick=()=>{excOpen=!excOpen;render()};if(excOpen)mt.insertBefore(excPanelEl(),mt.querySelector(".pfcount"))}
  const ul=mt.querySelector(".exlist");
  L.forEach(x=>{const li=el(`<li class="exrow"><label class="exmain"><input type="radio" name="pfMain"><span>Principal</span></label><label class="ffield"><span>Prova</span><input class="etext exn" maxlength="60" placeholder="Ex.: ENARE 2027, USP-SP, SUS-SP"></label><label class="ffield"><span>Data (se já souber)</span><input class="etext exd" type="date"></label><button class="link warn exdel" type="button">remover</button></li>`);
    const rb=li.querySelector("input[type=radio]"),n=li.querySelector(".exn"),d=li.querySelector(".exd");rb.checked=!!main&&main.id===x.id;rb.id="pfExMain-"+x.id;n.id="pfExName-"+x.id;d.id="pfExDate-"+x.id;n.value=x.name||"";d.value=x.date||"";
    rb.setAttribute("aria-label",`Marcar ${x.name||"esta prova"} como principal`);li.querySelector(".exdel").setAttribute("aria-label",`Remover ${x.name||"prova"}`);
    rb.onchange=()=>{ui.profile.mainEx=x.id;saveUI();render()};
    const cur=()=>exList().find(y=>y.id===x.id);/* o objeto muda a cada saveUI: procura pelo id */
    n.onchange=()=>{if(excJust===x.id||!n.isConnected)return;const y=cur();if(!y)return;y.name=n.value.trim();saveUI();renderHead()};
    /* sugestões do catálogo enquanto digita (continua dando para escrever qualquer prova) */
    const sug=el(`<ul class="exsug" role="listbox"></ul>`),fill=()=>{sug.innerHTML="";const R=excFind(n.value);R.filter(c=>norm(c.n)!==norm(n.value)).forEach((c,j)=>{const li=el(`<li><button type="button" class="qrpick"><b></b><span></span></button></li>`);li.querySelector("b").textContent=c.n;li.querySelector("span").textContent=excLine(c);
      const bb=li.querySelector("button");bb.id=`exs-${x.id}-${j}`;bb.onmousedown=e=>e.preventDefault();bb.onclick=()=>excPick(x.id,c);sug.appendChild(li)});sug.hidden=!sug.children.length};
    n.oninput=()=>{excQ[x.id]=n.value;fill()};n.onblur=()=>setTimeout(()=>{sug.hidden=true},200);li.appendChild(sug);if(excQ[x.id]){n.value=excQ[x.id];fill()}else sug.hidden=true;
    {const c=EX_CAT.find(c=>norm(c.n)===norm(x.name||""));if(c||x.est){const nt=el(`<p class="how exnote"></p>`);nt.textContent=(c?excLine(c):"")+(x.est?(c?". ":"")+"Data estimada pelo mês habitual: troque quando sair o edital.":"");li.appendChild(nt)}}
    d.onchange=()=>{const v=d.value,y=cur();if(!y||(v&&!/^\d{4}-\d{2}-\d{2}$/.test(v)))return;if(v)y.date=v;else delete y.date;delete y.est;saveUI();render()};
    li.querySelector(".exdel").onclick=()=>{ui.profile.exams=exList().filter(y=>y.id!==x.id);if(ui.profile.mainEx===x.id)delete ui.profile.mainEx;saveUI();render()};ul.appendChild(li)});
  if(!L.length)ul.appendChild(el(`<li class="cempty">Nenhuma prova cadastrada. Sem prova, a projeção usa só o seu ritmo.</li>`));
  const ad=mt.querySelector("#pfExAdd");if(L.length>=12)ad.remove();else ad.onclick=()=>{const id="ex"+Date.now().toString(36),L2=exList();ui.profile.exams=[...L2,{id,name:""}];if(!L2.length)ui.profile.mainEx=id;saveUI();render();setTimeout(()=>{const i=document.getElementById("pfExName-"+id);if(i)i.focus()},40)};
  const gc=mt.querySelector(".pfcount");if(main&&main.date){const dd=daysTo(main.date);gc.textContent=dd>=0?`${main.name||"Prova principal"}: faltam ${dd} dias (${goalSpan(dd)}). Você já estudou ${weighted()}% do peso das provas.`:`A data de ${main.name||"prova principal"} já passou. Atualize ou marque outra como principal.`}
  else if(main)gc.textContent=`${main.name||"Prova principal"}: sem data ainda. Quando sair o edital, coloque a data e o Início passa a mostrar o ritmo necessário.`;else gc.remove();
  return mt}

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
/* celular: aba Residência dividida em Hoje | Revisões | Lista | Progresso */
let tSeg="hoje";try{const v=localStorage.getItem("resid-tseg");if(["hoje","rev","lista","prog"].includes(v))tSeg=v}catch(e){}
function setTSeg(v){tSeg=v;try{localStorage.setItem("resid-tseg",v)}catch(e){}render();window.scrollTo({top:0})}
function renderTSeg(dueN){const vt=$("#viewTemas");vt.dataset.seg=tSeg;
  $("#tSeg").querySelectorAll("button").forEach(b=>{b.setAttribute("aria-pressed",b.dataset.s===tSeg);if(b.dataset.s==="rev")b.innerHTML="Revisões"+(dueN?`<b>${dueN}</b>`:"")})}
/* computador: atalhos no menu lateral */
function renderNavExtra(P,dueN){const box=$("#navExtra");box.innerHTML="";
  const add=(k,v,cls,fn)=>{const b=el(`<button type="button"><span class="nk"></span><span class="nv${cls?" "+cls:""}"></span></button>`);b.querySelector(".nk").textContent=k;b.querySelector(".nv").textContent=v;b.onclick=fn;box.appendChild(b)};
  /* Lote 17: a barra lateral fica só com a navegação e os selos (os números do dia moram no Início); só o modo provas, que muda o app inteiro, aparece aqui */
  const CR=examCrunch();if(CR.active)add("Modo provas",`ligado até ${br(CR.until)}`,"late",()=>setView("fac"));box.hidden=!box.children.length}
/* ---------- Foco: pomodoro e cronômetro que contam o tempo de estudo ---------- */
/* sessões: {id, d:"AAAA-MM-DD", s:ISO do início, sec, m:"p"|"c"|"x" (pomodoro, cronômetro, manual), ref:"T:<tema>"|"D:<disciplina>"|"", lab} */
const LSFO="resid-focus-v1",LSFR="resid-focus-run",LSFP="resid-focus-pick",FO_C=2*Math.PI*46;
let foSess=[],focStore=null,foRun=null,foPick={ref:"",mode:"p"},foTimer=null,foWake=null,foWaking=false,foActx=null,foMsg="",foPer=(()=>{const v=lsGet("resid-foper");return ["7","15","30","60","90","all"].includes(v)?v:"7"})(),foMore=false,foAdd=null,foDel=null,foCustom=null,foArm=false,foTitle0=null;
function foOk(x){return !!x&&typeof x==="object"&&typeof x.id==="string"&&typeof x.d==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(x.d)&&typeof x.sec==="number"&&x.sec>0&&x.sec<86400&&(typeof x.ref==="string"||x.ref===undefined)}
function foClean(x){return {id:x.id,d:x.d,s:typeof x.s==="string"?x.s:x.d+"T12:00:00.000Z",sec:Math.round(x.sec),m:["p","c","x"].includes(x.m)?x.m:"c",ref:typeof x.ref==="string"?x.ref:"",lab:typeof x.lab==="string"?x.lab.slice(0,120):"",...(Number.isInteger(x.dz)&&x.dz>0?{dz:Math.min(x.dz,99)}:{}),
  ...(typeof x.tp==="string"&&x.tp.trim()?{tp:x.tp.trim().slice(0,40)}:{}),...(typeof x.dc==="string"&&x.dc?{dc:x.dc.slice(0,40)}:{}),...(typeof x.cr==="string"&&x.cr?{cr:x.cr.slice(0,160)}:{})}}
/* Lote 21: tipo da atividade (registro manual) e conteúdo da disciplina */
const FO_TYPES=["Anki","Questões","Leitura","Resumo"];
function foTypes(){return [...FO_TYPES,...(ui.prefs.fotps||[]).filter(t=>!FO_TYPES.includes(t))]}
function foType(x){return x.tp||(x.m==="x"?"Registro sem tipo":"Cronômetro do Foco")}
function foKeepType(t){t=(t||"").trim().slice(0,40);if(!t||foTypes().some(x=>x.toLowerCase()===t.toLowerCase()))return;ui.prefs.fotps=[...(ui.prefs.fotps||[]),t].slice(-12);saveUI()}
/* conteúdos de uma disciplina para o Foco: SPs (com o que há dentro) e os conteúdos diretos */
function foDiscContents(d){const out=[],seen=new Set(),add=(r,g)=>{if(seen.has(r)||!refOk(r))return;const x=refTopic(r);if(!x||!BYKEY[x.k])return;const lab=refLabel(r);if(!lab)return;seen.add(r);out.push({ref:r,k:x.k,lab,g})};
  (d.sps||[]).forEach(s=>s.items.forEach(r=>add(r,s.name)));(d.items||[]).forEach(r=>add(r,"Outros conteúdos"));return out}
function foSessName(x){if(x.cr){const l=refLabel(x.cr);if(l)return l}return foRefLabel(x.ref)||x.lab||(x.ref?"Excluído":"Sem vínculo")}
try{const v=JSON.parse(localStorage.getItem(LSFO)||"[]");if(Array.isArray(v))foSess=v.filter(foOk).map(foClean)}catch(e){}
try{const r=JSON.parse(localStorage.getItem(LSFR)||"null");if(r&&typeof r==="object"&&(r.mode==="p"||r.mode==="c")&&typeof r.acc==="number")foRun=r}catch(e){}
try{const p=JSON.parse(localStorage.getItem(LSFP)||"null");if(p&&typeof p.ref==="string")foPick={ref:p.ref,mode:p.mode==="c"?"c":"p",...(typeof p.dc==="string"&&p.dc?{dc:p.dc,cr:typeof p.cr==="string"?p.cr:""}:{})}}catch(e){}
const ymd=t=>{const d=new Date(t);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
const fmtMin=sec=>{const m=Math.round(sec/60);return m<60?`${m} min`:`${Math.floor(m/60)}h${String(m%60).padStart(2,"0")}`};
const foSum=list=>list.reduce((a,x)=>a+x.sec,0);
const FO_MODE={p:"Pomodoro",c:"Cronômetro",x:"Manual"};
function foSaveRun(){try{foRun?localStorage.setItem(LSFR,JSON.stringify(foRun)):localStorage.removeItem(LSFR)}catch(e){}}
function foSaveLocal(){try{localStorage.setItem(LSFO,JSON.stringify(foSess))}catch(e){}}
function foSavePick(){try{localStorage.setItem(LSFP,JSON.stringify(foPick))}catch(e){}}
async function foPut(x){foSaveLocal();if(!focStore)return;const k="fo:"+x.id;try{await focStore.doc(x.id).set({...x});saveOk(k)}catch(e){setSave("Não foi possível salvar a sessão de foco na conta; ficou salva neste navegador");if(foSess.includes(x))saveFail(k,"sessão de foco",e,()=>foPut(x))}}
async function foDelete(id){foSess=foSess.filter(x=>x.id!==id);foDel=null;foSaveLocal();render();if(focStore)try{await focStore.doc(id).delete()}catch(e){}}
function foRefLabel(ref){const t=(ref||"")[0],id=(ref||"").slice(2);
  if(t==="T"){const it=BYKEY[id];return it?it.t:""}
  if(t==="D"){const d=discOf(id);return d?d.name:""}return ""}
/* matéria da sessão: especialidade do tema ou disciplina da faculdade */
function foMat(x){const t=(x.ref||"")[0],id=(x.ref||"").slice(2);
  if(x.dc){const d=discOf(x.dc);if(d)return {id:"d:"+x.dc,lab:d.name}}
  if(t==="T"&&BYKEY[id]){const it=BYKEY[id];return {id:specId(it),lab:`${it.area.code} · ${it.sp||it.area.name}`}}
  if(t==="D"){const d=discOf(id);return {id:"d:"+id,lab:d?d.name:(x.lab||"Disciplina excluída")}}
  if(t==="T")return {id:"x:"+id,lab:x.lab||"Tema excluído"};
  return {id:"none",lab:"Sem vínculo"}}
/* ----- relógio ----- */
const foEl=()=>foRun?foRun.acc+(foRun.t0?Date.now()-foRun.t0:0):0;
function foClockText(ms){const s=Math.max(0,Math.ceil(ms/1000)),h=Math.floor(s/3600),m=Math.floor(s%3600/60),ss=s%60;return (h?h+":"+String(m).padStart(2,"0"):String(m).padStart(2,"0"))+":"+String(ss).padStart(2,"0")}
function foShown(){if(!foRun)return {txt:foPick.mode==="c"?"00:00":foClockText(ui.prefs.fw*60000),frac:0};const el=foEl();
  if(foRun.mode==="c")return {txt:foClockText(Math.floor(el/1000)*1000),frac:(el%3600000)/3600000};
  return {txt:foClockText(foRun.plan-el),frac:Math.min(1,el/foRun.plan)}}
function foStart(){foUnlock();const P=ui.prefs,mode=foPick.mode;foRun={mode,ph:"w",t0:Date.now(),acc:0,plan:mode==="p"?P.fw*60000:0,s:Date.now(),ref:foPick.ref||"",...(foPick.dc?{dc:foPick.dc,cr:foPick.cr||""}:{}),dist:0};foMsg="";foArm=false;foSaveRun();foEnsureTick();render()}
function foPause(){if(!foRun||!foRun.t0)return;foRun.acc=foEl();foRun.t0=null;foSaveRun();render()}
function foResume(){if(!foRun||foRun.t0)return;foUnlock();foRun.t0=Date.now();foSaveRun();render()}
function foRecord(startMs,sec,mode,ref,dz,dc,cr){if(sec<60)return null;
  const x={id:"fo"+Date.now().toString(36)+Math.random().toString(36).slice(2,6),d:ymd(startMs),s:new Date(startMs).toISOString(),sec:Math.round(sec),m:mode,ref:ref||"",lab:foRefLabel(ref)};if(Number.isInteger(dz)&&dz>0)x.dz=Math.min(dz,99);
  if(dc&&discOf(dc)){x.dc=dc;if(cr){x.cr=cr;x.lab=refLabel(cr)||x.lab}}
  foSess.unshift(x);if(foSess.length>5000)foSess.length=5000;foPut(x);return x}
function foFinish(){if(!foRun)return;
  if(foRun.ph==="b"){foRun=null;foMsg="Pausa encerrada. Pronto para o próximo ciclo."}
  else{const x=foRecord(foRun.s,foEl()/1000,foRun.mode,foRun.ref,foRun.dist,foRun.dc,foRun.cr);foMsg=x?`Sessão salva: ${fmtMin(x.sec)}${x.lab?" · "+x.lab:""}${x.dz?` · ${x.dz} ${x.dz===1?"distração":"distrações"}`:""}.`:"Sessão com menos de 1 minuto: não foi salva.";foRun=null;foAfterSet(x)}
  foArm=false;foSaveRun();foWakeSync();render()}
function foDiscard(){foRun=null;foArm=false;foSaveRun();foMsg="Sessão descartada: nada foi salvo.";foWakeSync();render()}
function foEnsureTick(){if(foRun&&!foTimer)foTimer=setInterval(foTick,500);if(!foRun&&foTimer){clearInterval(foTimer);foTimer=null}}
/* a contagem usa a hora de início, então segue certa mesmo com a tela bloqueada ou o app em segundo plano */
function foTick(){if(!foRun){foEnsureTick();foPaint();return}
  if(foRun.mode==="p"&&foRun.t0){const el=foEl();
    if(el>=foRun.plan){const endAt=foRun.t0+(foRun.plan-foRun.acc),late=Date.now()-endAt;
      if(foRun.ph==="w"){const x=foRecord(foRun.s,foRun.plan/1000,"p",foRun.ref,foRun.dist,foRun.dc,foRun.cr),P=ui.prefs,n=foSeriesAdd(),lb=P.flong>0&&n%P.fevery===0,bl=lb?P.flong:P.fb;
        foRun=bl>0?{mode:"p",ph:"b",t0:endAt,acc:0,plan:bl*60000,s:endAt,ref:foRun.ref,dc:foRun.dc,cr:foRun.cr,lb}:null;foAfterSet(x);
        foMsg=x?`Ciclo concluído: ${fmtMin(x.sec)} salvos${x.lab?" · "+x.lab:""}${x.dz?` · ${x.dz} ${x.dz===1?"distração":"distrações"}`:""}.${foRun?(lb?` Pausa longa de ${bl} min: você fez ${P.fevery} ciclos.`:" Hora da pausa."):""}`:""}
      else{foRun=null;foMsg="Pausa terminada. Pronto para o próximo ciclo."}
      if(late<90000)foAlarm();foSaveRun();foWakeSync();render();foTick();return}}
  foPaint()}
function foPaint(){const S=foShown(),c=$("#foClock");if(c)c.textContent=S.txt;const r=$("#foArc");if(r)r.style.strokeDashoffset=String(FO_C*(1-S.frac));
  const pill=$("#foPill");if(pill){const on=!!foRun&&view!=="foco";pill.hidden=!on;document.body.classList.toggle("haspill",on);if(on){pill.querySelector("b").textContent=S.txt;pill.querySelector(".fpl").textContent=foRun.ph==="b"?"Pausa":foRun.t0?"Foco":"Pausado"}}
  for(const id of ["mcount","focount"]){const b=document.getElementById(id);if(b)b.textContent=foRun?"●":""}
  const ml=$("#maisFoco");if(ml&&foRun)ml.textContent=`${foRun.ph==="b"?"Pausa":"Sessão"} em andamento · ${S.txt}`;
  if(foRun){if(foTitle0===null)foTitle0=document.title;document.title=`${S.txt} · ${foRun.ph==="b"?"Pausa":"Foco"}`}else if(foTitle0!==null){document.title=foTitle0;foTitle0=null}}
/* som (gerado na hora, sem arquivo) e vibração */
function foUnlock(){try{if(!foActx){const A=window.AudioContext||window.webkitAudioContext;if(A)foActx=new A()}if(foActx&&foActx.state==="suspended")foActx.resume()}catch(e){}}
function foAlarm(force){if(!ui.prefs.fsnd&&!force)return;
  try{foUnlock();if(foActx){const t=foActx.currentTime+0.05;[0,0.4,0.8,1.6,2.0,2.4].forEach((d,i)=>{const o=foActx.createOscillator(),g=foActx.createGain();o.type="sine";o.frequency.value=i%3===2?1175:880;
    g.gain.setValueAtTime(0.0001,t+d);g.gain.exponentialRampToValueAtTime(0.4,t+d+0.02);g.gain.exponentialRampToValueAtTime(0.0001,t+d+0.32);o.connect(g);g.connect(foActx.destination);o.start(t+d);o.stop(t+d+0.35)})}}catch(e){}
  try{navigator.vibrate&&navigator.vibrate([250,120,250,120,250])}catch(e){}}
/* manter a tela acesa durante o foco (quando o aparelho permite) */
async function foWakeSync(){const want=!!(foRun&&foRun.t0&&ui.prefs.fwake&&document.visibilityState==="visible");
  if(want&&!foWake&&!foWaking&&navigator.wakeLock){foWaking=true;try{foWake=await navigator.wakeLock.request("screen");foWake.addEventListener("release",()=>{foWake=null})}catch(e){foWake=null}foWaking=false}
  else if(!want&&foWake){const w=foWake;foWake=null;try{await w.release()}catch(e){}}}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"){foTick();foWakeSync()}});
function foSetRef(r,dc,cr){foPick.ref=r;if(dc){foPick.dc=dc;foPick.cr=cr||""}else{delete foPick.dc;delete foPick.cr}foSavePick();
  if(foRun){foRun.ref=r;if(dc){foRun.dc=dc;foRun.cr=cr||""}else{delete foRun.dc;delete foRun.cr}foSaveRun()}render()}
function foGo(key){foSetRef("T:"+key);backStack=[];setView("foco")}
/* ----- estatísticas ----- */
function foDayTotals(){const m={};foSess.forEach(x=>{m[x.d]=(m[x.d]||0)+x.sec});return m}
/* uma meta só (Lote 17): a semanal do Planejar a semana (ui.prefs.hgoal, minutos). A do dia = semanal ÷ dias de estudo desta semana (múltiplo de 5 min) */
function foStudyDays(){const ws=wpMon(dnum(today()));let n=0;for(let i=0;i<7;i++)if(dayMin(ws+i)>0)n++;return Math.max(1,n)}
function foDG(){const h=ui.prefs.hgoal||0;return h?Math.max(5,Math.round(h/foStudyDays()/5)*5):0}
function foGoalLink(){const b=el(`<button class="link" type="button" id="foGoalChg">Mudar a meta</button>`);b.onclick=()=>{goSub("config");setTimeout(()=>{const c=$("#wpCard");if(c)c.scrollIntoView({block:"start",behavior:"smooth"})},80)};return b}
function foGoalStreak(m){const g=foDG()*60;if(!g)return 0;return runStreak(d=>(m[d]||0)>=g)}
const foWeekStart=()=>dnum(today())-(new Date().getDay()+6)%7;// segunda-feira
function foActiveDiscs(){return fac.discs.filter(d=>{const s=semOf(d.semId);return s&&!s.archived})}
