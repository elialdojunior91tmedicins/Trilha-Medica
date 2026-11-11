/* ----- erros que se repetem (últimos 30 dias) ----- */
function eRepeat(){const t=dnum(today()),by={};errors.forEach(e=>{if(BYKEY[e.k]&&!e.arch&&t-dnum(e.d)<=30)(by[e.k]=by[e.k]||[]).push(e)});
  return {tem:Object.entries(by).filter(([,l])=>l.length>=2).sort((a,b)=>b[1].length-a[1].length),stub:errors.filter(e=>BYKEY[e.k]&&!e.arch&&(e.miss||0)>=2).sort((a,b)=>b.miss-a.miss)}}
function eRepCard(){const {tem,stub}=eRepeat();if(!tem.length&&!stub.length)return null;
  const c=el(`<section class="card erep" aria-labelledby="eph"><div class="dhead"><h2 id="eph">Erros que se repetem</h2><span class="todaydate">últimos 30 dias</span></div></section>`);
  if(tem.length){c.appendChild(el(`<p class="gtext">Errar várias vezes no mesmo tema é sinal de que a base não firmou. Antes de mais questões, volte à teoria ou à sua anotação desses temas.</p>`));
    const ul=el(`<ul class="ereplist"></ul>`);tem.slice(0,6).forEach(([k,l])=>{const it=BYKEY[k],tc={};l.forEach(e=>tc[e.t]=(tc[e.t]||0)+1);const main=Object.keys(tc).sort((a,b)=>tc[b]-tc[a])[0];
      const li=el(`<li><button class="link" type="button"></button><span class="ks"></span><button class="mini" type="button">Ver erros</button><button class="mini" type="button">Estudar de novo</button></li>`);
      li.querySelector(".link").textContent=it.t;li.querySelector(".link").onclick=()=>openTopic(k);
      li.querySelector(".ks").textContent=`${l.length} erros · mais: ${(ETYPES[main]||"").toLowerCase()}`;
      const [v,s]=li.querySelectorAll(".mini");v.onclick=()=>{eGoTopic(k);render();$("#elist").scrollIntoView({behavior:"smooth",block:"start"})};
      s.onclick=()=>{detTab[k]=(notes[k]||"").trim()?"notas":"estudo";openTopic(k)};ul.appendChild(li)});
    if(tem.length>6)ul.appendChild(el(`<li class="how">+ ${tem.length-6} temas.</li>`));c.appendChild(ul)}
  if(stub.length){c.appendChild(el(`<span class="glabel">Ainda não firmaram na revisão</span>`));
    const ul=el(`<ul class="ereplist"></ul>`);stub.slice(0,5).forEach(e=>{const it=BYKEY[e.k],li=el(`<li><span class="ew"><b></b><span></span></span><span class="ks"></span></li>`);
      li.querySelector("b").textContent=it.t+": ";li.querySelector(".ew span").textContent=eOneLine(e.w).slice(0,140)+(eOneLine(e.w).length>140?"…":"");li.querySelector(".ks").textContent=`"ainda erraria" ${e.miss}×`;
      li.appendChild(eCardBtn(e));if(cdErr[e.id])li.appendChild(cdErrEl(e));ul.appendChild(li)});c.appendChild(ul);
    c.appendChild(el(`<p class="how">Para estes, um cartão de memorização ajuda: ele volta mais vezes que a revisão do erro.</p>`))}
  return c}
/* ----- erros por semana, por tipo ----- */
const ECOL={conhecimento:"var(--due)",interpretacao:"var(--l1)",confusao:"var(--l2)"};
function eWeeksEl(){const N=8,t=dnum(today()),ws=t-(new Date().getDay()+6)%7,start=ws-7*(N-1),W=[...Array(N)].map((_,i)=>({s:start+7*i,n:0,t:{conhecimento:0,interpretacao:0,confusao:0}}));
  errors.forEach(e=>{const n=dnum(e.d);if(n<start||n>t)return;const w=W[Math.floor((n-start)/7)];if(w){w.n++;const ty=ETYPES[e.t]?e.t:"conhecimento";w.t[ty]++}});
  const tot=W.reduce((a,w)=>a+w.n,0);if(!tot)return null;
  const mx=Math.max(...W.map(w=>w.n)),box=el(`<div class="grp ewks" style="margin-top:14px"><span class="glabel">Erros registrados por semana</span><div class="ewk" role="img"></div><div class="elegend"></div></div>`),g=box.querySelector(".ewk");
  g.setAttribute("aria-label","Erros por semana nas últimas 8 semanas: "+W.map(w=>`${br(fromNum(w.s))} ${w.n}`).join(", "));
  W.forEach((w,i)=>{const col=el(`<div class="ewcol${i===N-1?" now":""}"><span class="ewb"><span class="ewn">${w.n||""}</span><span class="ews"></span></span><span class="ewl">${i===N-1?"esta":br(fromNum(w.s))}</span></div>`),s=col.querySelector(".ews");
    s.style.height=`${Math.round(w.n/mx*80)}px`;Object.keys(ETYPES).forEach(ty=>{if(!w.t[ty])return;const i2=document.createElement("i");i2.style.flexGrow=String(w.t[ty]);i2.style.background=ECOL[ty];s.appendChild(i2)});
    col.title=`Semana de ${br(fromNum(w.s))}: ${w.n} ${w.n===1?"erro":"erros"}`+Object.keys(ETYPES).filter(ty=>w.t[ty]).map(ty=>` · ${w.t[ty]} ${ETYPES[ty].toLowerCase()}`).join("");g.appendChild(col)});
  const lg=box.querySelector(".elegend");Object.keys(ETYPES).forEach(ty=>{const s=el(`<span><i style="background:${ECOL[ty]}"></i></span>`);s.appendChild(document.createTextNode(ETYPES[ty]));lg.appendChild(s)});
  {const wks=W.filter(w=>w.n).length;if(tot<8||wks<3)box.appendChild(el(`<p class="how ewlow">Poucos dados (${tot} ${tot===1?"erro":"erros"} em ${wks} ${wks===1?"semana":"semanas"}): a tendência por tipo fica confiável com uns 8 erros em 3 semanas ou mais.</p>`))}
  // tendência: últimas 4 semanas × 4 anteriores, no tipo que mais mudou
  const sum=(a,b,ty)=>W.slice(a,b).reduce((x,w)=>x+(ty?w.t[ty]:w.n),0),ch=Object.keys(ETYPES).map(ty=>({ty,a:sum(0,4,ty),b:sum(4,8,ty)})).sort((x,y)=>Math.abs(y.b-y.a)-Math.abs(x.b-x.a))[0];
  if(tot>=8&&ch&&ch.a+ch.b>=3&&ch.a!==ch.b){const p=el(`<p class="how"></p>`);p.textContent=`${ETYPES[ch.ty]}: ${ch.b<ch.a?"caiu":"subiu"} de ${ch.a} para ${ch.b} nas últimas 4 semanas (contra as 4 anteriores).`;box.appendChild(p)}
  return box}
/* ----- causa do erro (mais fina que o tipo) ----- */
const ECAUSES={conhecimento:["Nunca estudei isso","Estudei, mas esqueci","Detalhe: dose, valor ou critério","Conteúdo novo ou atualizado"],
  interpretacao:["Não vi o EXCETO / INCORRETA","Pulei um dado do caso","Pressa ou cansaço","Mudei da certa para a errada","Não entendi o que a pergunta pedia"],
  confusao:["Confundi com doença parecida","Troquei condutas ou drogas","Troquei critério ou classificação","Lembrei pela metade"]};
const ECTIPS={"Nunca estudei isso":"Esses temas precisam de teoria antes de questão: coloque-os no plano de estudo.",
  "Estudei, mas esqueci":"A revisão está espaçada demais para você: revise os erros em dia e transforme os teimosos em cartão.",
  "Detalhe: dose, valor ou critério":"Números e critérios se fixam com cartão de memorização e tabela na anotação.",
  "Conteúdo novo ou atualizado":"Confira a diretriz mais recente e atualize a anotação do tema.",
  "Não vi o EXCETO / INCORRETA":"Antes de ler as alternativas, sublinhe o que o enunciado pede (EXCETO, INCORRETA, mais provável).",
  "Pulei um dado do caso":"Leia o caso inteiro e anote mentalmente idade, tempo de evolução e o dado que muda a conduta.",
  "Pressa ou cansaço":"Treine blocos menores com tempo (simulado de 10) e faça pausas no Foco.",
  "Mudei da certa para a errada":"Só troque a resposta se encontrar um dado concreto que você não tinha visto.",
  "Não entendi o que a pergunta pedia":"Reformule a pergunta com as suas palavras antes de olhar as alternativas.",
  "Confundi com doença parecida":"Monte um quadro comparativo das duas doenças na anotação do tema.",
  "Troquei condutas ou drogas":"Faça uma tabela de conduta por situação e transforme em cartões.",
  "Troquei critério ou classificação":"Escreva os critérios lado a lado e revise pelos cartões.",
  "Lembrei pela metade":"Revise o conceito inteiro, não só a resposta: reescreva o 'Correto' com as suas palavras."};
/* ----- arquivar erros resolvidos ----- */
const eAct=e=>!e.arch;
function eArchive(e,on){eMenu=null;if(on)e.arch=today();else delete e.arch;putErr(e);render()}
/* ----- filtros extras ----- */
let eFlags=new Set(),ePer="all",eSrc="all",eCause="all",eVis=[],eMsg="",eSide="all";
/* Lote 18: erro da faculdade = tema só da faculdade, tema da residência usado nos semestres ativos, ou registrado numa prova da faculdade */
function eIsFac(e,FL){const it=BYKEY[e.k];if(!it)return false;if(it.own||it.area===FAC_AREA)return true;if((FL||facLinkMap())[e.k])return true;
  const src=(e.s||"").trim().toLowerCase();return !!src&&fac.provas.some(p=>p.name.trim().toLowerCase()===src)}
/* semana da prova: temas da prova da faculdade e dos fechamentos de SP dos próximos 7 dias */
function ePwKeys(){const K=new Set(pwKeys()||[]);spFechas(rvDays()).forEach(f=>topicKeysOf(f.p.items).forEach(k=>K.add(k)));return K.size?K:null}
function ePwLabel(){const P=provaWeek(),F=spFechas(rvDays());return [...P.map(p=>p.name),...F.map(f=>spShort(f.s.name))].slice(0,2).join(" e ")}
const EFLAG={due:"Para revisar hoje",rep:"Que se repetem",nocard:"Sem cartão",arch:"Arquivados"};
function eRepKeys(){const r=eRepeat();return {tem:new Set(r.tem.map(([k])=>k)),stub:new Set(r.stub.map(e=>e.id)),FL:facLinkMap(),PW:ePwKeys()}}
function eExtraOk(e,R){
  if(eFlags.has("arch")?!e.arch:e.arch)return false;
  if(eFlags.has("due")&&!eDueNow(e))return false;
  if(eFlags.has("rep")&&!(R.tem.has(e.k)&&dnum(today())-dnum(e.d)<=30||R.stub.has(e.id)))return false;
  if(eFlags.has("nocard")&&e.cd&&cards.some(x=>x.id===e.cd))return false;
  if(ePer!=="all"&&dnum(today())-dnum(e.d)>+ePer)return false;
  if(eSrc!=="all"&&(e.s||"").trim().toLowerCase()!==eSrc)return false;
  if(eCause!=="all"&&(e.c||"")!==eCause)return false;
  if(eSide==="fac"&&!eIsFac(e,R.FL))return false;if(eSide==="res"&&eIsFac(e,R.FL))return false;
  if(eSide==="pw"&&!(R.PW&&R.PW.has(e.k)))return false;return true}
const eExtraOn=()=>eFlags.size||ePer!=="all"||eSrc!=="all"||eCause!=="all"||eSide!=="all";
let eFOpen=(()=>{try{return (document.documentElement.dataset.layout!=="phone"||window.__noSheet)&&localStorage.getItem("resid-efpanel")==="1"}catch(e){return false}})();
function eClearAll(){eFlags.clear();eSide="all";ePer="all";eSrc="all";eCause="all";eArea="all";eSp="all";eType="all";eQuery="";eTopicKey=null;const q=$("#eq");if(q)q.value=""}
/* mostrar os erros de um tema: limpa os outros filtros (senão podia não sobrar nada) e, se o tema só tem arquivados, abre os arquivados */
function eGoTopic(k){eClearAll();eTopicKey=k;eLimit=E_PAGE;if(!errors.some(e=>e.k===k&&!e.arch)&&errors.some(e=>e.k===k&&e.arch))eFlags.add("arch")}
function renderEMore(){const box=$("#eMore");if(!box)return;
  const R=eRepKeys(),act=errors.filter(e=>BYKEY[e.k]),EA=act.filter(e=>eFlags.has("arch")?e.arch:!e.arch);
  {const c=$("#eFCount");if(c)c.textContent=`${EA.length} ${EA.length===1?"erro":"erros"}${eFlags.has("arch")?" arquivados":""}`}
  const A=[];if(eType!=="all")A.push([ETYPES[eType],()=>{eType="all"}]);Object.entries(EFLAG).forEach(([v,l])=>{if(eFlags.has(v))A.push([l,()=>eFlags.delete(v)])});
  if(eSide!=="all")A.push([eSide==="fac"?"Só da faculdade":eSide==="res"?"Só da residência":`Semana da prova: ${ePwLabel()}`,()=>{eSide="all"}]);
  if(ePer!=="all")A.push([`Últimos ${ePer} dias`,()=>{ePer="all"}]);if(eSrc!=="all")A.push([`Fonte: ${eSrc}`,()=>{eSrc="all"}]);if(eCause!=="all")A.push([`Causa: ${eCause}`,()=>{eCause="all"}]);
  if(eArea!=="all")A.push([fcAreaName(eArea),()=>{eArea="all";eSp="all"}]);if(eArea!=="all"&&eSp!=="all")A.push([eSp,()=>{eSp="all"}]);
  /* Lote 18: painel reorganizado — Situação, Origem (residência, faculdade, semana da prova, fonte), Por que errou (tipo e causa), Onde, Quando */
  const G=[],set=f=>v=>{f(v);eLimit=E_PAGE};
  G.push(["Situação","combinam entre si",fcChips(Object.entries(EFLAG).map(([v,l])=>{const n=v==="arch"?act.filter(e=>e.arch).length:act.filter(e=>!e.arch&&(v==="due"?eDueNow(e):v==="rep"?(R.tem.has(e.k)&&dnum(today())-dnum(e.d)<=30||R.stub.has(e.id)):!(e.cd&&cards.some(x=>x.id===e.cd)))).length;
    return fcChip(`${l} · ${n}`,eFlags.has(v),()=>{eFlags.has(v)?eFlags.delete(v):eFlags.add(v);eLimit=E_PAGE},null,null,null,{ef:v})}))]);
  {if(eSide==="pw"&&!R.PW)eSide="all";const nF=EA.filter(e=>eIsFac(e,R.FL)).length,L=[["all",`Todos · ${EA.length}`],["res",`Residência · ${EA.length-nF}`],["fac",`Faculdade · ${nF}`]];
    if(R.PW)L.push(["pw",`Semana da prova: ${ePwLabel()} · ${EA.filter(e=>R.PW.has(e.k)).length}`]);
    const w=el(`<div class="fcgrpb"></div>`);w.appendChild(fcChips(L.map(([v,l])=>fcChip(l,eSide===v,()=>{eSide=eSide===v&&v!=="all"?"all":v;eLimit=E_PAGE},null,null,v==="fac"?"Conteúdo dos semestres ativos ou erro registrado numa prova da faculdade":null,{es:v}))));
    const srcs={};act.forEach(e=>{const x=(e.s||"").trim();if(x){const k=x.toLowerCase();srcs[k]=srcs[k]||x}});
    if(Object.keys(srcs).length){const row=el(`<div class="qfrow tfsels"></div>`);row.appendChild(fcSel("eSrc","Banca, prova ou fonte",[["all","Todas"],...Object.entries(srcs).sort((a,b)=>a[1].localeCompare(b[1])).map(([k,x])=>[k,x])],srcs[eSrc]?eSrc:"all",set(v=>eSrc=v)));w.appendChild(row)}else eSrc="all";
    G.push(["Origem","residência, faculdade ou a prova da semana",w])}
  {const w=el(`<div class="fcgrpb"></div>`);w.appendChild(fcChips(Object.entries(ETYPES).map(([v,l])=>fcChip(`${l} · ${EA.filter(e=>e.t===v).length}`,eType===v,()=>{eType=eType===v?"all":v;eLimit=E_PAGE},null,null,null,{et:v}))));
    const used=new Set(act.map(e=>e.c).filter(Boolean));
    if(used.size){const row=el(`<div class="qfrow tfsels"></div>`);row.appendChild(fcSel("eCause","Causa",[["all","Todas"],...Object.values(ECAUSES).flat().filter(c=>used.has(c)).map(c=>[c,c])],used.has(eCause)?eCause:"all",set(v=>eCause=v)));w.appendChild(row)}else eCause="all";
    G.push(["Por que errou","tipo e causa marcados no registro",w])}
  G.push(["Onde","grande área e especialidade",fcWhere("e",eArea,eSp,(a,sp)=>EA.filter(e=>{const it=BYKEY[e.k];return (a==="all"||it.area.code===a)&&(sp==="all"||it.sp===sp)}).length,v=>{eArea=v;eSp="all";eLimit=E_PAGE},v=>{eSp=v;eLimit=E_PAGE})]);
  {const t0=dnum(today()),pn=v=>v==="all"?EA.length:EA.filter(e=>t0-dnum(e.d)<=+v).length;
    G.push(["Quando","data do registro",fcPer("ePer",ePer,v=>{ePer=v;eLimit=E_PAGE},FC_PER.map(([v,l])=>[v,`${l} · ${pn(v)}`]),"Registrados")])}
  const links=[];
  if(downloadsFn){const p=el(`<button class="link" type="button" id="ePdf">Exportar PDF destes erros</button>`);p.onclick=ePdfSave;links.push(p)}
  fcBody(box,{tog:"eFBtn",panelId:"eFPanel",open:eFOpen,onToggle:()=>{eFOpen=!eFOpen;lsSet("resid-efpanel",eFOpen?"1":null)},
    sort:["eOrder",[["sp","Por especialidade"],["new","Mais recentes primeiro"],["due","Próxima revisão primeiro"],["miss","Mais teimosos primeiro"]],eOrder,v=>{eOrder=v}],
    act:A,clearId:"eClear",onClear:eClearAll,groups:G,foot:"",footId:"eRes",links,onDone:()=>{eFOpen=false;lsSet("resid-efpanel",null);render();const l=$("#elist");if(l)l.scrollIntoView({block:"start"})}});
  if(eMsg){const m=el(`<p class="pnote" role="status" id="eMsg"></p>`);m.textContent=eMsg;box.appendChild(m)}}
/* ----- simulado dos meus erros ----- */
function eSimItems(n){const act=errors.filter(e=>BYKEY[e.k]&&!e.arch);
  // primeiro os teimosos e os que vencem hoje; depois os mais recentes
  const pri=e=>(e.miss||0)*3+(eDue(e)<=today()?2:0)+Math.max(0,1-(dnum(today())-dnum(e.d))/60);
  const L=shuffle(act).sort((a,b)=>pri(b)-pri(a)).slice(0,n);return L.map(e=>({k:e.k,sub:"",err:e.id}))}
function eSimGo(){simCfg={src:"errs",n:Math.min(10,Math.max(5,errors.filter(e=>BYKEY[e.k]&&!e.arch).length))};if(![5,10,20,30].includes(simCfg.n))simCfg.n=simCfg.n<10?5:10;
  backStack=[];setView("quest");setQSeg("praticar");setTimeout(()=>{const h=$("#simh");if(h)h.scrollIntoView({block:"start"})},60)}
/* ----- PDF do caderno ----- */
function errosPDF(list){const P=new MiniPDF("Caderno de erros"),M=46,CW=P.W-2*M;let y=M;
  const C={ink:[20,27,45],mut:[92,99,117],acc:[22,38,74],due:[179,64,43],l1:[176,122,14],l2:[47,111,176],line:[225,218,203]},TC={conhecimento:C.due,interpretacao:C.l1,confusao:C.l2};
  const need=h=>{if(y+h>P.H-M-14){P.add();y=M}};
  const para=(t,o={})=>{const s=o.size||9.6,lh=s*1.42,ind=o.indent||0;pdfWrap(String(t),s,o.bold,CW-ind).forEach(l=>{need(lh);if(o.bar)P.rect(M+ind-8,y+1,2.4,lh,o.bar);P.text(M+ind,y+s,l,{size:s,bold:o.bold,color:o.color});y+=lh});y+=o.after??2};
  P.rect(0,0,P.W,8,C.acc);P.text(M,y+22,"Caderno de erros",{size:22,bold:true});y+=32;
  const tc={};list.forEach(e=>tc[e.t]=(tc[e.t]||0)+1);
  para(`${list.length} ${list.length===1?"erro":"erros"} · ${Object.keys(ETYPES).filter(t=>tc[t]).map(t=>`${tc[t]} ${ETYPES[t].toLowerCase()}`).join(" · ")} · gerado em ${new Date().toLocaleDateString("pt-BR")}`,{size:9,color:C.mut,after:12});
  const cs={};list.forEach(e=>{if(e.c)cs[e.c]=(cs[e.c]||0)+1});const top=Object.entries(cs).sort((a,b)=>b[1]-a[1]).slice(0,3);
  if(top.length){para("Causas mais comuns",{size:11,bold:true,color:C.acc,after:3});top.forEach(([c,n])=>{para(`• ${c} (${n}): ${ECTIPS[c]||""}`,{size:9.2,indent:6})});y+=8}
  let lastG="",lastK="";[...list].sort((a,b)=>BYKEY[a.k].num-BYKEY[b.k].num||byNewest(a,b)).forEach(e=>{const it=BYKEY[e.k],g=`${it.area.name}${it.sp?" · "+it.sp:""}`;
    if(g!==lastG){need(70);y+=8;P.text(M,y+13,g,{size:13,bold:true,color:C.acc});y+=19;P.line(M,y,M+CW,y,C.line);y+=8;lastG=g;lastK=""}
    if(e.k!==lastK){need(56);para(it.t,{size:11.5,bold:true,after:3});lastK=e.k}
    need(48);para([ETYPES[e.t]||"",e.c,br(e.d),e.s].filter(Boolean).join(" · "),{size:8.2,color:TC[e.t]||C.mut,indent:10,after:1});
    para("Errei: "+eOneLine(e.w),{size:9.4,indent:10,color:C.mut,after:1});if(e.p)para("Pista: "+eOneLine(e.p),{size:9.2,indent:10,color:C.mut,after:1});para("Correto: "+eOneLine(e.r),{size:9.6,indent:10,bold:true,bar:TC[e.t]||C.acc,after:9})});
  const n=P.pages.length;P.pages.forEach((pg,i)=>{P.cur=pg;P.line(M,P.H-M+4,M+CW,P.H-M+4,C.line,0.4);P.text(M,P.H-M+16,"Nexus - Trilha Médica · Caderno de erros",{size:7.6,color:C.mut});const t=`página ${i+1} de ${n}`;P.text(M+CW-pdfW(t,7.6,false),P.H-M+16,t,{size:7.6,color:C.mut})});
  return P.output()}
async function ePdfSave(){if(!downloadsFn||!eVis.length){eMsg=eVis.length?"":"Nenhum erro com esses filtros para exportar.";render();return}eMsg="Gerando o PDF…";render();
  try{const bytes=errosPDF(eVis);await downloadsFn.save({filename:`caderno-de-erros-${today()}.pdf`,data:new Blob([bytes],{type:"application/pdf"})});eMsg=`PDF salvo com ${eVis.length} ${eVis.length===1?"erro":"erros"}.`}
  catch(e){eMsg=e&&(e.code==="declined"||e.code==="cancelled")?"Download cancelado.":"Não foi possível gerar o PDF agora."}render()}
/* ----- virar cartão e levar para a anotação ----- */
function eCardBtn(e){const n=cards.filter(x=>x.eid===e.id||x.id===e.cd).length,b=el(`<button class="mini" type="button"></button>`);b.textContent=n?`${n} ${n===1?"cartão":"cartões"} ✓`:cdErr[e.id]?"Cartões ▾":"Criar cartões";b.disabled=!!n;
  b.title="Cria dois cartões do padrão Osler a partir do erro: o que separa a certa da sua e por que a sua não serve";b.id="ecd-"+e.id;
  b.onclick=()=>{if(cdErr[e.id])delete cdErr[e.id];else cdErr[e.id]={list:cdErrDrafts(e)};render();setTimeout(()=>{const x=document.querySelector(`.cderr[data-eid="${e.id}"]`);if(x)x.scrollIntoView({block:"nearest"})},40)};return b}
function eToNote(e){const k=e.k,cur=notes[k]||"",line=`- ${eOneLine(e.r)}${e.w?` (errei: ${eOneLine(e.w).slice(0,160)}${eOneLine(e.w).length>160?"…":""})`:""} {{e:${e.id}}}`,m=cur.match(/^#{1,3}\s*Meus erros\s*$/mi);let v;
  if(m){const at=m.index+m[0].length,nx=cur.slice(at).search(/\n#{1,3}\s/),end=nx<0?cur.length:at+nx;v=cur.slice(0,end).replace(/\s+$/,"")+"\n"+line+(end<cur.length?"\n"+cur.slice(end):"")}
  else v=(cur.trim()?cur.replace(/\s+$/,"")+"\n\n":"")+"## Meus erros\n"+line;
  replaceNote(k,v);e.nt=today();putErr(e);render()}
/* 10/2026: erros saem das anotações. Uma vez por aparelho (resid-enm), a seção "## Meus erros" de cada anotação vai para o caderno:
   linha com o selo de um erro que existe = já está no caderno (só sai da anotação); o resto vira erro novo do tema (fonte "Anotação"). */
function errNoteMig(){try{if(localStorage.getItem("resid-enm")==="1")return 0}catch(x){return 0}let moved=0,made=0;
  for(const k of Object.keys(notes)){if(!BYKEY[k])continue;const cur=notes[k]||"",m=cur.match(/^(#{1,3})\s*Meus erros(?: neste tema)?\s*$/mi);if(!m)continue;
    const at=m.index,body0=at+m[0].length,nx=cur.slice(body0).search(/\n#{1,3}\s/),end=nx<0?cur.length:body0+nx,body=cur.slice(body0,end);
    const items=[];body.split("\n").forEach(l=>{if(!l.trim())return;if(/^[-*•]\s+/.test(l)||!items.length)items.push(l.replace(/^[-*•]\s+/,"").trim());else items[items.length-1]+=" "+l.trim().replace(/^[-*•]\s+/,"")});
    items.forEach(t=>{const ids=[...t.matchAll(/\{\{e:([A-Za-z0-9_-]+)\}\}/g)].map(x=>x[1]);if(ids.some(id=>errors.some(e=>e.id===id))){moved++;return}
      const txt=t.replace(/\{\{[eq]:[^}]*\}\}/g,"").trim();if(!txt)return;const er=txt.match(/\(errei:\s*([\s\S]*?)\)\s*$/i),r=(er?txt.slice(0,er.index):txt).trim(),w=er?er[1].trim():"Anotado na seção Meus erros da anotação";
      if(r){eNew(k,w,r,"conhecimento","Anotação");made++}});
    const v=(cur.slice(0,at).replace(/\s+$/,"")+(end<cur.length?"\n\n"+cur.slice(end).replace(/^\s+/,""):"")).trim();saveNote(k,v)}
  errors.forEach(e=>{if(e.nt){delete e.nt;putErr(e)}});
  try{localStorage.setItem("resid-enm","1")}catch(x){}if(moved||made)render();return moved+made}
function eNoteBtn(e){const b=el(`<button class="mini" type="button"></button>`);b.textContent=e.nt?"Na anotação ✓":"Levar para a anotação";b.disabled=!!e.nt;
  b.title="Acrescenta o conceito correto na seção Meus erros da anotação do tema";b.onclick=()=>eToNote(e);return b}

function renderErros(){
  {const n=eDueList().length;$("#ecount").textContent=n?String(n):""}
  $("#viewErros").classList.toggle("erfull",!!(erRun&&erFull));
  {const top=$("#eTop");top.innerHTML="";
    if(eReg)top.appendChild(eRegPanel());else{const a=el(`<div class="btns etopacts"><button class="btn" type="button" id="eRegB">+ Registrar erro</button></div>`);a.querySelector("button").onclick=()=>{eReg={};render();setTimeout(()=>{const i=$("#erq");if(i)i.focus()},30)};
      if(!sampleOff&&errors.some(e=>BYKEY[e.k]&&!e.arch)){const sb=el(`<button class="btn" type="button" id="eSimB">Simulado dos meus erros</button>`);sb.disabled=!sampleFn;sb.title="O Claude cria questões novas sobre os pontos que você já errou";sb.onclick=eSimGo;a.appendChild(sb)}
      top.appendChild(a)}
    if(errors.some(e=>!e.arch))top.appendChild(eRevCard());}// Lote 17: "Erros que se repetem" virou o selo "repetiu" em Onde melhorar › Temas com mais erros
  const ins=$("#insight");ins.innerHTML="";
  if(!errors.length){ins.appendChild(el(`<p class="gtext">Seu caderno está vazio. Errou uma questão? Toque em <b>+ Registrar erro</b> (ou abra o tema, aba Erros) e anote o que errou e o conceito correto. Os erros voltam para você revisar em intervalos crescentes.</p>`))}
  else{
    const AE=errors.filter(e=>BYKEY[e.k]&&!e.arch),nA=Math.max(1,AE.length);
    const tc={conhecimento:0,interpretacao:0,confusao:0};AE.forEach(e=>tc[e.t]=(tc[e.t]||0)+1);
    const dist=el(`<div class="tdist"><span class="glabel">Tipo de erro</span></div>`);
    const colors={conhecimento:"var(--due)",interpretacao:"var(--l1)",confusao:"var(--l2)"};
    Object.keys(ETYPES).forEach(k=>{const r=el(`<div class="trow"><span>${ETYPES[k]}</span><div class="bar"><i style="width:${tc[k]/nA*100}%;background:${colors[k]}"></i></div><b>${tc[k]}</b></div>`);dist.appendChild(r)});
    ins.appendChild(dist);
    {const wk=eWeeksEl();if(wk)ins.appendChild(wk)}
    const dom=Object.keys(tc).sort((a,b)=>tc[b]-tc[a])[0];
    const tip=el(`<p class="tips" style="margin-top:12px"></p>`);tip.textContent=ETIPS[dom];ins.appendChild(tip);
    /* Lote 18: resumo do mês dentro do "Por que você erra" — causas que mais se repetiram nos últimos 30 dias, comparadas com os 30 anteriores */
    {const t=dnum(today()),ago=e=>t-dnum(e.d),M=errors.filter(e=>BYKEY[e.k]&&ago(e)<=30),M0=errors.filter(e=>BYKEY[e.k]&&ago(e)>30&&ago(e)<=60),cnt=L=>{const o={};L.forEach(e=>{if(e.c)o[e.c]=(o[e.c]||0)+1});return o};
      const cm=cnt(M),c0=cnt(M0),useM=Object.keys(cm).length>0,cs=useM?cm:(()=>{const o={};AE.forEach(e=>{if(e.c)o[e.c]=(o[e.c]||0)+1});return o})(),top=Object.entries(cs).sort((a,b)=>b[1]-a[1]).slice(0,3);
      if(top.length){const g=el(`<div class="grp ecauses" style="margin-top:16px" id="eWhy"><span class="glabel"></span></div>`);g.querySelector(".glabel").textContent=useM?"Por que você erra · último mês":"Por que você erra";
        if(useM){const tc={};M.forEach(e=>tc[e.t]=(tc[e.t]||0)+1);const dt=Object.keys(tc).sort((a,b)=>tc[b]-tc[a])[0],d=M.length-M0.length;
          const st=el(`<div class="emstat"><div class="emnum"><b></b><span></span></div><span class="emdelta"></span></div>`);st.querySelector("b").textContent=M.length;st.querySelector(".emnum span").textContent=M.length===1?"erro novo em 30 dias":"erros novos em 30 dias";
          const de=st.querySelector(".emdelta");if(M0.length){de.textContent=d>0?`▲ ${d} a mais que nos 30 dias anteriores (${M0.length})`:d<0?`▼ ${-d} a menos que nos 30 dias anteriores (${M0.length})`:`igual aos 30 dias anteriores`;de.classList.add(d>0?"up":d<0?"down":"eq")}else de.remove();g.appendChild(st);
          if(dt){const p=el(`<p class="emtype">Tipo mais comum: <span class="etag"></span></p>`);p.querySelector(".etag").textContent=ETYPES[dt];p.querySelector(".etag").dataset.t=dt;g.appendChild(p)}}
        const mx=Math.max(...top.map(x=>x[1])),ul=el(`<ol class="eclist"></ol>`);g.appendChild(ul);
        top.forEach(([c,n])=>{const d=useM&&c0[c]!==undefined?n-c0[c]:null,tr=!useM?"":d===null?"nova":d>0?`▲ ${d}`:d<0?`▼ ${-d}`:"igual",cls=!useM?"":d===null?"new":d>0?"up":d<0?"down":"eq";
          const li=el(`<li><button type="button" class="ecrow link"><span class="ech"><span class="ecn"></span><span class="ecm"><b class="ecc"></b><span class="ectr"></span></span></span><span class="ecbar"><i></i></span></button><p class="ectip"><span>Dica</span></p></li>`);
          li.querySelector(".ecn").textContent=c;li.querySelector(".ecc").textContent=`${n} ${n===1?"erro":"erros"}`;const T=li.querySelector(".ectr");if(tr){T.textContent=tr;T.classList.add(cls);T.title=d===null?"Não apareceu nos 30 dias anteriores":"Comparado com os 30 dias anteriores"}else T.remove();
          li.querySelector(".ecbar i").style.width=Math.round(n/mx*100)+"%";li.querySelector(".ectip").append(" "+(ECTIPS[c]||""));
          li.querySelector("button").onclick=()=>{eCause=c;render();$("#elist").scrollIntoView({behavior:"smooth",block:"start"})};ul.appendChild(li)});
        {const gone=useM?Object.keys(c0).filter(c=>!cm[c]):[];if(gone.length){const p=el(`<p class="emgone"><b>Melhorou</b> <span></span></p>`);p.querySelector("span").textContent=`No último mês você não errou mais por ${gone.slice(0,2).map(c=>`“${c}”`).join(" nem por ")}.`;g.appendChild(p)}}
        ins.appendChild(g)}
      else if(errors.length>=3)ins.appendChild(el(`<p class="how" style="margin-top:10px">Dica: ao registrar, marque <b>Por que errei</b>. Com isso o app mostra as causas mais comuns e o que fazer com cada uma.</p>`))}
    const per={};AE.forEach(e=>per[e.k]=(per[e.k]||0)+1);
    const RP0=new Set(eRepeat().tem.map(x=>x[0])),top=Object.entries(per).sort((a,b)=>b[1]-a[1]||RP0.has(b[0])-RP0.has(a[0])).slice(0,5);
    eRepeat().tem.forEach(([k])=>{if(per[k]&&!top.some(x=>x[0]===k)&&top.length<8)top.push([k,per[k]])});
    const tw=el(`<div class="grp" style="margin-top:16px"><span class="glabel">Temas com mais erros</span><ol class="toplist"></ol></div>`);
    const RP=new Set(eRepeat().tem.map(x=>x[0])),tmx=Math.max(1,...top.map(x=>x[1]));
    top.forEach(([k,c])=>{const it=BYKEY[k],li=el(`<li><button type="button"><span class="ttn"><span></span><small></small></span><b>${c}</b><span class="ttbar"><i style="width:${Math.round(c/tmx*100)}%"></i></span></button></li>`);li.querySelector(".ttn span").textContent=it.t;
      li.querySelector("small").textContent=it.sp||it.area.name;li.querySelector("b").title=c===1?"1 erro":`${c} erros`;
      if(RP.has(k))li.querySelector("small").after(el(`<em class="erepb" title="2 ou mais erros neste tema nos últimos 30 dias">repetiu nos últimos 30 dias</em>`));
      li.querySelector("button").onclick=()=>{eGoTopic(k);render();$("#elist").scrollIntoView({behavior:"smooth",block:"start"})};tw.querySelector("ol").appendChild(li)});
    if(top.length)ins.appendChild(tw);
    {const st=eRepeat().stub;if(st.length){const l=el(`<p class="how etmline" id="eTeim"><span></span> <button class="link" type="button">ver primeiro</button></p>`);
      l.querySelector("span").textContent=`${st.length} ${st.length===1?"erro teimoso":"erros teimosos"} (você marcou “Errei” 2 vezes ou mais): sinal para voltar à teoria.`;l.querySelector("button").onclick=()=>{eOrder="miss";render();const x=$("#elist");if(x)x.scrollIntoView({behavior:"smooth",block:"start"})};ins.appendChild(l)}}
    const ps={};AE.forEach(e=>{const it=BYKEY[e.k];if(it){const g=spKey(it);ps[g]=(ps[g]||0)+1}});
    const ts=el(`<div class="grp" style="margin-top:14px"><span class="glabel">Especialidades com mais erros</span><ol class="toplist"></ol></div>`);
    {const P5=Object.entries(ps).sort((a,b)=>b[1]-a[1]).slice(0,5),smx=Math.max(1,...P5.map(x=>x[1]));P5.forEach(([g,c])=>{const [ac,sp]=[g.slice(0,g.indexOf(":")),g.slice(g.indexOf(":")+1)];
      const li=el(`<li><button type="button"><span class="ttn"><span></span><small></small></span><b>${c}</b><span class="ttbar"><i style="width:${Math.round(c/smx*100)}%"></i></span></button></li>`);li.querySelector(".ttn span").textContent=sp;li.querySelector("small").textContent=(AREAS.find(x=>x.code===ac)||{name:ac}).name;li.querySelector("b").title=c===1?"1 erro":`${c} erros`;
      li.querySelector("button").onclick=()=>{eClearAll();eArea=ac;eSp=sp;render();$("#elist").scrollIntoView({behavior:"smooth",block:"start"})};ts.querySelector("ol").appendChild(li)});}
    if(Object.keys(ps).length)ins.appendChild(ts);
  }
  // lista
  const list=$("#elist");list.innerHTML="";
  if(eTopicKey){const bx=el(`<li class="tips" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center"><span>Mostrando só: <b></b></span><button class="mini" type="button">Ver todos os erros</button></li>`);
    bx.querySelector("b").textContent=BYKEY[eTopicKey].t;bx.querySelector("button").onclick=()=>{eTopicKey=null;render()};list.appendChild(bx)}
  renderEMore();const ER=eRepKeys();
  const vis=errors.filter(e=>{const it=BYKEY[e.k];if(!it)return false;if(!eExtraOk(e,ER))return false;
    if(eTopicKey&&e.k!==eTopicKey)return false;if(eArea!=="all"&&it.area.code!==eArea)return false;if(eArea!=="all"&&eSp!=="all"&&it.sp!==eSp)return false;if(eType!=="all"&&e.t!==eType)return false;
    return !eQuery||norm(it.t+" "+e.w+" "+(e.p||"")+" "+e.r+" "+(e.s||"")+" "+(e.c||"")).includes(eQuery)}).sort(byNewest);
  eVis=vis;{const r=$("#eRes");if(r)r.textContent=`${vis.length} ${vis.length===1?"erro":"erros"}${eFlags.has("arch")?" arquivados":""}`}
  if(errors.length&&!vis.length){const li=el(`<li class="empty" style="padding:0"></li>`);
    const nArch=!eFlags.has("arch")&&eTopicKey?errors.filter(e=>e.k===eTopicKey&&e.arch).length:0;
    if(nArch){li.append(`Este tema só tem ${nArch} ${nArch===1?"erro arquivado":"erros arquivados"} (marcados como resolvidos). `);const b=el(`<button class="link" type="button" id="eSeeArch">Ver arquivados</button>`);b.onclick=()=>{eFlags.add("arch");render()};li.appendChild(b)}
    else{li.append("Nenhum erro com esses filtros. ");const b=el(`<button class="link" type="button">Limpar filtros</button>`);b.onclick=()=>{eClearAll();render()};li.appendChild(b)}
    list.appendChild(li)}
  if(eOrder==="sp")vis.sort((a,b)=>BYKEY[a.k].num-BYKEY[b.k].num||byNewest(a,b));
  else if(eOrder==="due")vis.sort((a,b)=>eDue(a).localeCompare(eDue(b))||byNewest(a,b));
  else if(eOrder==="miss")vis.sort((a,b)=>(b.miss||0)-(a.miss||0)||byNewest(a,b));
  const shown=vis.slice(0,eLimit);// listas grandes: mostra em partes para não travar
  if(eOrder==="sp")appendGrouped(list,shown,e=>BYKEY[e.k],e=>ecardEl(e,true),["erro","erros"]);
  else shown.forEach(e=>list.appendChild(ecardEl(e,true)));
  if(vis.length>shown.length){const m=el(`<li><button class="btn" type="button">Mostrar mais ${Math.min(E_PAGE,vis.length-shown.length)} (de ${vis.length-shown.length} restantes)</button></li>`);m.querySelector("button").onclick=()=>{eLimit+=E_PAGE;render()};list.appendChild(m)}
}

