/* ---------- PDF: gerador próprio (Helvetica, A4, sem bibliotecas: funciona sem internet) ---------- */
const HW=[[278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584,761,556,0,222,556,333,1000,556,556,333,1000,667,333,1000,0,611,0,0,222,222,333,333,350,556,1000,333,1000,500,333,944,0,500,667,278,333,556,556,556,556,260,556,333,737,370,556,584,333,737,333,400,584,333,333,333,556,537,278,333,333,365,556,834,834,834,611,667,667,667,667,667,667,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,500,556,556,556,556,278,278,278,278,556,556,556,556,556,556,556,584,611,556,556,556,556,500,556,500],[278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584,761,556,0,278,556,500,1000,556,556,333,1000,667,333,1000,0,611,0,0,278,278,500,500,350,556,1000,333,1000,556,333,944,0,500,667,278,333,556,556,556,556,280,556,333,737,370,556,584,333,737,333,400,584,333,333,333,611,556,278,333,333,365,556,834,834,834,611,722,722,722,722,722,722,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,556,556,556,556,556,278,278,278,278,611,611,611,611,611,611,611,584,611,611,611,611,611,556,611,556]];
const CP1252={8364:128,8218:130,402:131,8222:132,8230:133,8224:134,8225:135,710:136,8240:137,352:138,8249:139,338:140,381:142,8216:145,8217:146,8220:147,8221:148,8226:149,8211:150,8212:151,732:152,8482:153,353:154,8250:155,339:156,382:158,376:159};
const PDF_MAP={"→":"->","←":"<-","≥":">=","≤":"<=","✓":"v","…":"..."};
function pdfBytes(str){const out=[];for(const ch of String(str==null?"":str).normalize("NFC")){const m=PDF_MAP[ch];if(m){for(const c of m)out.push(c.charCodeAt(0));continue}const c=ch.codePointAt(0);
  if((c>=32&&c<=126)||(c>=160&&c<=255))out.push(c);else if(CP1252[c])out.push(CP1252[c]);else if(c===10||c===9||c===13)out.push(32);else if((c>=0x300&&c<=0x36f)||c>=0x1F000||(c>=0x2600&&c<=0x27BF)||c===0xFE0F||c===0x200D){}else out.push(63)}return out}
function pdfW(str,size,bold){let w=0;for(const b of pdfBytes(str))w+=(HW[bold?1:0][b-32]||556);return w*size/1000}
function pdfWrap(str,size,bold,maxW){const words=String(str==null?"":str).replace(/\s+/g," ").trim().split(" ").filter(Boolean),lines=[];let cur="";
  for(const w of words){const t=cur?cur+" "+w:w;if(!cur||pdfW(t,size,bold)<=maxW)cur=t;else{lines.push(cur);cur=w}}if(cur)lines.push(cur);
  return lines.flatMap(l=>{if(pdfW(l,size,bold)<=maxW)return [l];const parts=[];let s="";for(const ch of l){if(s&&pdfW(s+ch,size,bold)>maxW){parts.push(s);s=ch}else s+=ch}if(s)parts.push(s);return parts})}
class MiniPDF{constructor(title){this.W=595.28;this.H=841.89;this.pages=[];this.title=title||"";this.add()}
  add(){this.cur=[];this.pages.push(this.cur)}
  rgb(c){return c.map(v=>(v/255).toFixed(3)).join(" ")}
  text(x,y,str,o={}){const s=o.size||10,b=pdfBytes(str).map(c=>c===40||c===41||c===92?"\\"+String.fromCharCode(c):String.fromCharCode(c)).join("");
    this.cur.push(`BT /${o.bold?"F2":"F1"} ${s} Tf ${this.rgb(o.color||[21,33,31])} rg ${x.toFixed(2)} ${(this.H-y).toFixed(2)} Td (${b}) Tj ET`)}
  rect(x,y,w,h,c){if(w<=0||h<=0)return;this.cur.push(`${this.rgb(c)} rg ${x.toFixed(2)} ${(this.H-y-h).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`)}
  line(x1,y1,x2,y2,c,lw=0.6){this.cur.push(`${this.rgb(c)} RG ${lw} w ${x1.toFixed(2)} ${(this.H-y1).toFixed(2)} m ${x2.toFixed(2)} ${(this.H-y2).toFixed(2)} l S`)}
  output(){const objs=[],add=s=>{objs.push(s);return objs.length};
    const f1=add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"),f2=add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
    const pagesId=add(""),kids=[];
    this.pages.forEach(ops=>{const c=ops.join("\n"),cid=add(`<< /Length ${c.length} >>\nstream\n${c}\nendstream`);kids.push(add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${this.W} ${this.H}] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >> /Contents ${cid} 0 R >>`))});
    objs[pagesId-1]=`<< /Type /Pages /Kids [${kids.map(k=>k+" 0 R").join(" ")}] /Count ${kids.length} >>`;
    const tb=pdfBytes(this.title).map(c=>c===40||c===41||c===92?"\\"+String.fromCharCode(c):String.fromCharCode(c)).join("");
    const info=add(`<< /Title (${tb}) /Producer (Nexus - Trilha Medica) >>`),cat=add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
    let out="%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";const offs=[];objs.forEach((o,i)=>{offs.push(out.length);out+=`${i+1} 0 obj\n${o}\nendobj\n`});
    const x=out.length;out+=`xref\n0 ${objs.length+1}\n0000000000 65535 f \n`+offs.map(o=>String(o).padStart(10,"0")+" 00000 n \n").join("")+`trailer\n<< /Size ${objs.length+1} /Root ${cat} 0 R /Info ${info} 0 R >>\nstartxref\n${x}\n%%EOF\n`;
    const u=new Uint8Array(out.length);for(let i=0;i<out.length;i++)u[i]=out.charCodeAt(i)&255;return u}}

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

