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

function showView(v){view=v;$("#viewInicio").hidden=v!=="inicio";$("#viewPerfil").hidden=v!=="perfil";$("#viewConfig").hidden=v!=="config";document.querySelectorAll(".tab").forEach(t=>t.setAttribute("aria-selected",t.dataset.v===v));
  $("#viewTemas").hidden=v!=="temas";$("#viewNotas").hidden=v!=="notas";$("#viewQuest").hidden=v!=="quest";$("#viewFac").hidden=v!=="fac";document.querySelectorAll(".tab").forEach(t=>t.setAttribute("aria-selected",t.dataset.v===v||(v==="instr"&&t.dataset.v==="quest")));$("#viewErros").hidden=v!=="erros";$("#viewInstr").hidden=v!=="instr";$("#viewHelp").hidden=v!=="help";$("#viewFoco").hidden=v!=="foco";$("#viewStats").hidden=v!=="stats";$("#viewMais").hidden=v!=="mais";$("#tabM").setAttribute("aria-selected",["mais","foco","notas","stats"].includes(v)&&document.documentElement.dataset.layout==="phone"||v==="mais")}
function setView(v){showView(v);render();window.scrollTo({top:0})}

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

/* ===================== Lote 20: aviso quando a gravação na conta falha ===================== */
/* Sem internet o Firestore guarda e envia depois (não falha). Falha de verdade = permissão, cota ou item grande demais (1 MB por documento).
   O item fica neste aparelho; o aviso diz o quê e o motivo, e "Tentar de novo" (também ao voltar a internet e a cada 2 min) refaz as gravações. */
const svQ=new Map();let svT=0;
const svBig=x=>/maximum|too large|exceed|size/i.test(String(x&&(x.message||x.code)||""));
function saveFail(key,what,err,retry){svQ.set(key,{what,big:svBig(err),quota:!!(err&&err.code==="quota_exceeded"),retry});svToast();clearInterval(svT);svT=setInterval(svRetry,120000)}
function saveOk(key){if(svQ.delete(key)){svToast();if(!svQ.size)clearInterval(svT)}}
async function svRetry(){const L=[...svQ.entries()];for(const [k,v] of L){try{if(v.retry)await v.retry()}catch(e){}}}
function svToast(){let t=$("#svFail");if(!svQ.size){if(t)t.remove();return}
  if(!t){t=el(`<div class="trtoast svfail" id="svFail" role="alert"><span></span><button class="link" type="button" id="svRetry">Tentar de novo</button><button class="link" type="button" id="svClose">Fechar</button></div>`);document.body.appendChild(t);
    t.querySelector("#svRetry").onclick=()=>svRetry();t.querySelector("#svClose").onclick=()=>t.remove()}
  const V=[...svQ.values()],w=[...new Set(V.map(v=>v.what))],big=V.some(v=>v.big),qt=V.some(v=>v.quota);
  t.querySelector("span").textContent=`Não foi possível salvar na sua conta: ${w.slice(0,3).join(", ")}${w.length>3?` e mais ${w.length-3}`:""}${big?" (grande demais para a conta: o limite é 1 MB por item)":qt?" (espaço da conta cheio)":""}. Ficou salvo neste aparelho; os outros aparelhos não veem até salvar.`}
addEventListener("online",()=>{if(svQ.size)svRetry()});

/* ===================== LIXEIRA: o que é apagado fica 30 dias e pode voltar ===================== */
const LSTR="resid-trash-v1",TR_DAYS=30,TR_MAX=300;
const TR_KIND={err:"Erro",card:"Cartão",free:"Caderno livre",exam:"Prova importada",note:"Anotação",prova:"Prova",sp:"SP",disc:"Disciplina"};
let trash=[],trashStore=null,trSkip=false,trArm=null,trMsg="";
function trOk(x){return !!x&&typeof x.id==="string"&&!!TR_KIND[x.kind]&&typeof x.j==="string"&&typeof x.at==="string"}
try{const v=JSON.parse(localStorage.getItem(LSTR)||"[]");if(Array.isArray(v))trash=v.filter(trOk)}catch(e){trash=[]}
function trSaveLocal(){try{localStorage.setItem(LSTR,JSON.stringify(trash))}catch(e){}}
async function trPut(x){trSaveLocal();if(!trashStore)return;const k="tr:"+x.id;try{await trashStore.doc(x.id).set({...x});saveOk(k)}catch(e){saveFail(k,"item da lixeira",e,()=>trPut(x))}}
async function trDrop(id){trash=trash.filter(x=>x.id!==id);trSaveLocal();if(trashStore)try{await trashStore.doc(id).delete()}catch(e){}}
function trLeft(x){return Math.max(0,TR_DAYS-Math.floor((Date.now()-Date.parse(x.at))/864e5))}
function trPurgeOld(){trash.filter(x=>trLeft(x)<=0).forEach(x=>trDrop(x.id))}
function toTrash(kind,lab,sub,data){if(trSkip)return null;const x={id:"tr"+Date.now().toString(36)+Math.random().toString(36).slice(2,6),kind,lab:String(lab||"").slice(0,140),sub:String(sub||"").slice(0,140),at:new Date().toISOString(),j:JSON.stringify(data)};
  trash.unshift(x);while(trash.length>TR_MAX){const o=trash.pop();if(trashStore)trashStore.doc(o.id).delete().catch(()=>{})}trPut(x);trToast(x);return x}
/* temas próprios da faculdade apagados junto com uma SP ou disciplina: guarda tudo deles */
function ownSnap(refs){const o={own:{},st:{},nt:{},errs:[]};refs.filter(r=>typeof r==="string"&&r.startsWith("O:")).forEach(r=>{const id=r.slice(2),k="F-"+id;
  if(fac.own[id])o.own[id]=JSON.parse(JSON.stringify(fac.own[id]));if(state[k])o.st[k]=JSON.parse(JSON.stringify(state[k]));if(notes[k])o.nt[k]=notes[k];errors.filter(e=>e.k===k).forEach(e=>o.errs.push({...e}))});return o}
function ownRestore(o){if(!o)return;let ch=false;for(const id in o.own)if(!fac.own[id]){fac.own[id]=o.own[id];ch=true}if(ch)registerOwn();
  for(const k in o.st)if(!state[k])state[k]=o.st[k];for(const k in o.nt)if(!notes[k])saveNote(k,o.nt[k]);
  (o.errs||[]).forEach(e=>{if(!errors.some(x=>x.id===e.id)){errors.push(e);putErr(e)}})}
const topicName=k=>BYKEY[k]?BYKEY[k].t:"tema apagado";
/* devolver */
function trRestore(id){const x=trash.find(y=>y.id===id);if(!x)return;let d;try{d=JSON.parse(x.j)}catch(e){trMsg="Não foi possível ler este item.";render();return}
  let ok=true,why="";
  if(x.kind==="err"){if(!errors.some(e=>e.id===d.id)){errors.push(d);putErr(d)}}
  else if(x.kind==="card"){if(!cards.some(c=>c.id===d.id)){const c=cdClean(d);cards.push(c);cdPut(c)}}
  else if(x.kind==="cards"){(Array.isArray(d)?d:[]).filter(cdOk).forEach(y=>{if(!cards.some(c=>c.id===y.id)){const c=cdClean(y);cards.push(c);cdPut(c)}})}
  else if(x.kind==="free"){if(!freeN.some(f=>f.id===d.id)){const f=frClean(d);freeN.push(f);frPut(f)}}
  else if(x.kind==="exam"){if(d.ex&&exOk(d.ex)&&!exams.some(e=>e.id===d.ex.id)){const e=exClean(d.ex);exams.unshift(e);exPut(e);if(d.pg&&exPOk(d.pg)&&!exProg.some(y=>y.id===e.id)){exProg.push(exPClean(d.pg));exPSave(e.id)}}}
  else if(x.kind==="note"){const cur=notes[d.k]||"";saveNote(d.k,cur.trim()?cur+"\n\n---\n\n"+d.t:d.t)}
  else if(x.kind==="prova"){const ids=provaDids(d).filter(discOf);if(!ids.length){ok=false;why=`a disciplina desta prova não existe mais`}else if(!fac.provas.some(p=>p.id===d.id)){provaSetDids(d,ids);fac.provas.push(d);saveFac()}}
  else if(x.kind==="sp"){const dc=discOf(d.discId);if(!dc){ok=false;why="a disciplina desta SP não existe mais"}else{
      ownRestore(d.os);if(!dc.sps.some(s=>s.id===d.s.id)){const s=d.s;delete s.eixoId;dc.sps.push(s);if(dc.div!=="sp")dc.div="sp"}
      (d.pv||[]).forEach(v=>{const p=fac.provas.find(y=>y.id===v.id);if(p){p.items=[...new Set([...p.items,...v.items])];p.done=[...new Set([...(p.done||[]),...(v.done||[])])];if(v.sp)p.sps=[...new Set([...provaSps(p),d.s.id])]}});
      const s=dc.sps.find(y=>y.id===d.s.id);if(s)syncObjs(s);saveFac();persist()}}
  else if(x.kind==="disc"){const dc=d.d;if(fac.discs.some(y=>y.id===dc.id)){/* já voltou */}else{
      if(!fac.sems.some(s=>s.id===dc.semId)){const a=activeSems()[0]||(fac.sems[0]&&fac.sems[0].id);if(!a){ok=false;why="crie um semestre antes de devolver a disciplina"}else dc.semId=a}
      if(ok){ownRestore(d.os);fac.discs.push(dc);(d.provas||[]).forEach(p=>{if(!fac.provas.some(y=>y.id===p.id)){provaSetDids(p,provaDids(p).filter(discOf));fac.provas.push(p)}});
        (d.shared||[]).forEach(v=>{const p=fac.provas.find(y=>y.id===v.id);if(p){const ids=provaDids(p);ids.splice(Math.min(v.at||0,ids.length),0,dc.id);provaSetDids(p,ids);p.items=[...new Set([...p.items,...v.items])];if(v.sps&&v.sps.length)p.sps=[...new Set([...provaSps(p),...v.sps])]}});(dc.sps||[]).forEach(syncObjs);saveFac();commit()}}}
  if(!ok){trMsg=`Não deu para devolver: ${why}.`;render();return}
  trDrop(id);if(view==="config")trMsg=`${TR_KIND[x.kind]} devolvido${x.kind==="note"||x.kind==="prova"||x.kind==="sp"||x.kind==="disc"?"a":""}: ${x.lab}.`;hideToast();render()}
/* aviso rápido com Desfazer */
let toastT=null;
function hideToast(){const t=$("#trToast");if(t)t.remove();clearTimeout(toastT)}
function trToast(x){hideToast();const t=el(`<div class="trtoast" id="trToast" role="status"><span></span><button class="link" type="button">Desfazer</button></div>`);
  t.querySelector("span").textContent=`${TR_KIND[x.kind]} na lixeira`;t.querySelector("button").onclick=()=>trRestore(x.id);document.body.appendChild(t);toastT=setTimeout(hideToast,7000)}
/* aviso rápido com um atalho (Lote 21) */
function infoToast(msg,lab,go){hideToast();const t=el(`<div class="trtoast tinfo" id="trToast" role="status"><span></span></div>`);t.querySelector("span").textContent=msg;
  if(lab){const b=el(`<button class="link" type="button" id="toastGo"></button>`);b.textContent=lab;b.onclick=()=>{hideToast();go()};t.appendChild(b)}document.body.appendChild(t);toastT=setTimeout(hideToast,8000)}
/* Configurações › Lixeira */
function trashCardEl(){trPurgeOld();const c=el(`<section class="card trash" id="trashCard"><div class="dhead"><h2>Lixeira</h2><span class="todaydate"></span></div><p class="how">Erros, cartões, anotações, caderno livre, provas, SPs e disciplinas apagados ficam aqui por ${TR_DAYS} dias. Depois disso, somem de vez.</p></section>`);
  c.querySelector(".todaydate").textContent=trash.length?`${trash.length} ${trash.length===1?"item":"itens"}`:"";
  if(trMsg){const m=el(`<p class="pnote" role="status"></p>`);m.textContent=trMsg;c.appendChild(m);trMsg=""}
  if(!trash.length){c.appendChild(el(`<p class="cempty">A lixeira está vazia.</p>`));return c}
  const ul=el(`<ul class="trlist"></ul>`);trash.slice().sort((a,b)=>b.at.localeCompare(a.at)).forEach(x=>{const li=el(`<li><span class="trk"></span><span class="trt"><b></b><span></span></span><span class="trb"><button class="mini" type="button">Restaurar</button><button class="link warn" type="button"></button></span></li>`);
    li.querySelector(".trk").textContent=TR_KIND[x.kind];li.querySelector(".trt b").textContent=x.lab||"(sem título)";const lf=trLeft(x),ag=TR_DAYS-lf;
    li.querySelector(".trt span").textContent=`${x.sub?x.sub+" · ":""}apagado ${ag<=0?"hoje":ag===1?"ontem":`há ${ag} dias`} · some em ${lf} ${lf===1?"dia":"dias"}`;
    const [r,dl]=li.querySelectorAll("button");r.id="trR-"+x.id;r.onclick=()=>trRestore(x.id);const arm=trArm===x.id;dl.textContent=arm?"Toque de novo para apagar de vez":"apagar de vez";
    dl.onclick=()=>{if(trArm===x.id){trArm=null;trDrop(x.id);render()}else{trArm=x.id;render()}};ul.appendChild(li)});c.appendChild(ul);
  const all=el(`<button class="link warn" type="button" id="trEmpty"></button>`);all.textContent=trArm==="all"?"Toque de novo: apaga tudo da lixeira de vez":"Esvaziar a lixeira";
  all.onclick=()=>{if(trArm==="all"){trArm=null;[...trash].forEach(x=>trDrop(x.id));render()}else{trArm="all";render()}};c.appendChild(all);return c}

/* ===================== GERAL: fila do dia, avisos, busca, resumo da semana, primeiros passos, calendário, Anki ===================== */
const SITE_URL="https://elialdojunior91tmedicins.github.io/Trilha-Medica/";
const lsGet=(k,d)=>{try{const v=localStorage.getItem(k);return v===null?d:v}catch(e){return d}},lsSet=(k,v)=>{try{v===null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch(e){}};
