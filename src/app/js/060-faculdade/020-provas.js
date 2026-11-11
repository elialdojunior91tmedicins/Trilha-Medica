/* dentro do tema da residência: os conteúdos da faculdade ligados a ele, com os subtópicos ligados para marcar e Desligar */
function linkInfoEl(it){const ids=ownLinksTo(it.key);if(!ids.length)return null;const g=el(`<div class="grp flinkinfo"><span class="glabel">Na faculdade</span></div>`);
  ids.forEach(id=>{const o=fac.own[id],all=ownLinks(id),L=all.find(y=>y.k===it.key),others=all.filter(y=>y.k!==it.key),d=discOf(o.discId),sp=o.spId&&spOf(o.spId),row=el(`<div class="flkrow"><p class="gtext"><b></b> <span class="ks"></span></p></div>`);
    row.querySelector("b").textContent=o.t;row.querySelector(".ks").textContent=[d&&d.name,sp&&sp.s.id!==id&&sp.s.name].filter(Boolean).join(" · ")+(L.subs.length?"":" · tema inteiro");
    if(others.length){const p=el(`<p class="ks flkalso">Também ligado a </p>`);others.forEach((y,i)=>{const b=el(`<button class="link" type="button"></button>`);b.textContent=BYKEY[y.k].t;b.onclick=()=>openTopic(y.k);if(i)p.append(", ");p.appendChild(b)});
      p.append(`. Na faculdade, conta como estudado quando os ${all.length} estiverem estudados.`);row.appendChild(p)}
    if(L.subs.length){const ul=el(`<ul class="psubs"></ul>`),SL=subList(it);L.subs.forEach((t,n)=>{const x=SL.find(y=>y.t===t);const cid=`lki-${id}-${n}`,li=el(`<li><input type="checkbox" id="${cid}"${x&&x.done?" checked":""}${x?"":" disabled"}><label for="${cid}"></label></li>`);
      li.querySelector("label").textContent=x?t:t+" (subtópico não existe mais)";if(x)li.querySelector("input").onchange=()=>toggleSub(it,x);ul.appendChild(li)});row.appendChild(ul)}
    const acts=el(`<div class="btns"></div>`),ch=el(`<button class="link" type="button">Trocar ligação</button>`);ch.onclick=()=>{facLinkSt={id,k:it.key,from:it.key,all:!L.subs.length,subs:[...L.subs]};render()};
    acts.append(ch,armBtn("unl"+id,"Desligar",others.length?"Toque de novo: o conteúdo deixa de contar este tema (continua ligado aos outros)":"Toque de novo para desligar: o conteúdo volta a ser só da faculdade e começa do zero (este tema fica com todo o progresso)",()=>unlinkOwn(id,it.key)));row.appendChild(acts);
    if(facLinkSt&&facLinkSt.id===id)row.appendChild(linkPickEl(id));g.appendChild(row)});
  return g}
/* ---------- Faculdade: pastas (Semestre › Disciplina › Eixo › SP) ---------- */
const plural=w=>/s$/i.test(w)?w:w+"s";
const byDate=(a,b)=>a.date<b.date?-1:a.date>b.date?1:0;
const semDiscs=id=>fac.discs.filter(d=>d.semId===id);
function semProvas(cur){return fac.provas.filter(p=>{const d=discOf(p.discId);return d&&d.semId===cur.id}).sort(byDate)}
const topicKeysOf=refs=>[...new Set(refs.filter(refOk).flatMap(r=>refTopics(r).filter(x=>BYKEY[x.k]).map(x=>x.k)))];
const lvlOf=k=>{const s=get(k);return s.l||(s.last?1:0)};
function lvlCounts(keys){const c=[0,0,0,0,0];keys.forEach(k=>{const l=lvlOf(k);c[l]++;if(!l&&isIng(get(k)))c[4]++});return c}
function objStats(s){const pr=primaryRef(s),pit=pr&&BYKEY[refTopic(pr).k];if(!pit)return [0,s.objs.length];const L0=subList(pit);return [s.objs.filter(o=>(L0.find(x=>x.t===o)||{}).done).length,s.objs.length]}
function spStatus(keys){if(!keys.length)return {l:"x",t:"Sem conteúdo"};const c=lvlCounts(keys),n=keys.length;
  if(c[3]===n)return {l:3,t:"Dominada"};if(!c[0])return {l:2,t:"Estudada"};if(c[0]<n)return {l:1,t:"Em estudo"};return {l:0,t:"Não iniciada"}}
function spNum(s,i){const m=String(s.name||"").match(/\d+(?:[.,]\d+)*/);return m?m[0]:String(i+1)}
function semStats(cur){const ds=semDiscs(cur.id),keys=topicKeysOf(ds.flatMap(discRefs));let od=0,ot=0,nsp=0;
  ds.forEach(d=>d.sps.forEach(s=>{nsp++;const [a,b]=objStats(s);od+=a;ot+=b}));
  const c=lvlCounts(keys);return {ds,keys,c,seen:keys.length-c[0],od,ot,nsp,own:keys.filter(k=>k.startsWith("F-")).length}}
const semNum=s=>{const m=String(s&&s.name||"").match(/\d+/);return m?m[0]:""};
const ucLabel=(u,s)=>/\d\s*$/.test(u.name)||!semNum(s)?u.name:u.name+" "+semNum(s);
const curSem=()=>{const a=fac.sems.filter(s=>!s.archived);return a[a.length-1]||null};
function scrollToId(id){const x=document.getElementById(id);if(x)x.scrollIntoView({behavior:"smooth",block:"start"})}
function goProva(p){const d=discOf(p.discId);if(d){facOpenSem.add(d.semId);facOpenProv.add(d.semId);const s=semOf(d.semId);if(s&&s.archived)facShowArch=true}facProvaOpen.add(p.id);
  if(view!=="fac")showView("fac");render();scrollToId("fp-"+p.id)}
function goDisc(d){facOpenSem.add(d.semId);facOpenDisc.add(d.id);if(view!=="fac")showView("fac");render();scrollToId("fd-"+d.id)}
const dayLabel=s=>new Date(s+"T12:00:00").toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit",month:"2-digit"});
let facShown=new Set(),facSemInit=false;
const FOLDER_SVG=`<svg class="ffold" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4.2l2 2.2h8.8A1.5 1.5 0 0 1 21 8.7v9.8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z"/></svg>`;

/* ---------- Faculdade: painel de provas, simulado da prova, depois da prova, materiais e foco por disciplina ---------- */
let facProvAll=false,facRes=null,facLinkMsg="",facProvNew=false;
/* prontidão de uma prova: o que já está estudado e o ritmo para o resto (a véspera fica para revisar) */
function provaStats(p){const refs=p.items.filter(refOk),pend=provaPending(p),dd=daysTo(p.date),tot=refs.length,done=tot-pend.length,avail=Math.max(1,dd-1),rate=pend.length/avail;
  const lvl=!tot||!pend.length?"ok":dd<=1||rate>1.5?"bad":rate>0.5?"warn":"ok";return {refs,pend,tot,done,dd,rate,lvl}}
function provaRitmo(st){if(!st.tot)return "Nenhum conteúdo marcado para esta prova.";
  if(!st.pend.length)return "Tudo estudado. Agora é revisar e treinar com o simulado.";
  const n=st.pend.length,f=`Faltam ${n} ${n===1?"conteúdo":"conteúdos"}`;
  if(st.dd<=1)return `${f}: foque nos de maior peso.`;
  if(st.rate>=1){const k=Math.ceil(st.rate);return `${f} · ritmo: ${k} por dia (deixando a véspera para revisar).`}
  const e=Math.floor(1/st.rate);return `${f} · ritmo: 1 a cada ${e} ${e===1?"dia":"dias"} (deixando a véspera para revisar).`}
/* o próximo a estudar: primeiro os nunca estudados, depois os de maior peso na residência */
function provaNext(p){const st=provaStats(p);if(!st.pend.length)return null;
  return [...st.pend].sort((a,b)=>{const ka=refTopic(a).k,kb=refTopic(b).k;return (get(ka).last?1:0)-(get(kb).last?1:0)||wOf(BYKEY[kb])-wOf(BYKEY[ka])})[0]}
/* abre o conteúdo dentro da pasta da faculdade (semestre › disciplina › SP) */
function facGoRef(d,r){const x=refTopic(r);if(!x||!BYKEY[x.k])return;if(!d||!discRefs(d).includes(r)){openTopic(x.k);return}
  facOpenSem.add(d.semId);facOpenDisc.add(d.id);const s=d.sps.find(y=>y.items.includes(r));
  if(s)facOpenSP.add(s.id);
  openKey=x.k;if(view!=="fac")showView("fac");render();setTimeout(()=>{const li=document.querySelector("#viewFac li.t.open");if(li)li.scrollIntoView({behavior:"smooth",block:"start"})},40)}
function provaStudyNext(p){const r=provaNext(p);if(!r)return;const d=provaDiscs(p).find(x=>discRefs(x).includes(r))||discOf(p.discId);const k=refTopic(r).k;
  foPick.ref="T:"+k;foSavePick();if(foRun){foRun.ref=foPick.ref;foSaveRun()}else{foPick.mode="p";foStart()}facGoRef(d,r)}
function provaSimGo(p){simCfg={src:"prova",pid:p.id,n:10};sim=null;backStack=[];setView("quest");if(typeof setQSeg==="function")setQSeg("praticar");setTimeout(()=>{const h=$("#simh");if(h)h.scrollIntoView({block:"start"})},60)}
/* provas já feitas (até 30 dias) sem resultado registrado */
function provasToClose(){const t=dnum(today()),act=new Set(activeSems());
  return fac.provas.filter(p=>{const d=discOf(p.discId);return d&&!p.adi&&act.has(d.semId)&&!p.res&&dnum(p.date)<t&&t-dnum(p.date)<=30}).sort(byDate)}
const fmtN=n=>String(Math.round(n*100)/100).replace(".",",");
function parseNota(v){const s=String(v||"").trim().replace(",",".");if(!s)return null;const n=Number(s);return isFinite(n)&&n>=0&&n<=1000?n:NaN}
function provaResEl(p){const d=discOf(p.discId),R=facRes&&facRes.pid===p.id?facRes:(facRes={pid:p.id,n:"",of:"10",errs:0,open:null,D:null,msg:""});
  const w=el(`<div class="fpd fpres" id="fpr-${p.id}"><div class="fpdh"><b></b><span class="fcount">realizada</span></div><span class="ks"></span>
    <p class="gtext">Como foi? Registre a nota e leve para o caderno de erros o que caiu e você não sabia.</p>
    <div class="fpnota"><label class="qfsel"><span>Nota</span><input class="etext" type="text" inputmode="decimal" maxlength="6"></label><span class="fpde">de</span><label class="qfsel"><span>Vale</span><input class="etext" type="text" inputmode="decimal" maxlength="6"></label></div></div>`);
  w.querySelector("b").textContent=p.name;w.querySelector(".ks").textContent=`${d?provaDiscName(p)+" · ":""}${dayLabel(p.date)}`;
  const [ni,oi]=w.querySelectorAll(".fpnota input");ni.id="fpn-r-"+p.id;oi.id="fpo-r-"+p.id;ni.value=R.n;oi.value=R.of;ni.oninput=()=>R.n=ni.value;oi.oninput=()=>R.of=oi.value;
  const refs=[...new Set(p.items.filter(refOk))];
  if(refs.length){const g=el(`<div class="fpwhat"><span class="glabel">O que caiu e você não sabia?</span><div class="chips"></div></div>`),ch=g.querySelector(".chips");
    refs.forEach(r=>{const b=el(`<button class="chip" type="button"></button>`);b.textContent=refLabel(r);b.setAttribute("aria-pressed",R.open===r);
      b.onclick=()=>{R.open=R.open===r?null:r;const x=refTopic(r);R.D=R.open?{k:x.k,w:"Caiu na prova: ",r:"",t:"conhecimento",s:p.name}:null;render();setTimeout(()=>{const f=$("#fpe-w");if(f){f.focus();f.setSelectionRange(f.value.length,f.value.length)}},40)};ch.appendChild(b)});
    w.appendChild(g);
    if(R.open&&R.D){const f=el(`<div class="ecad"></div>`);f.appendChild(errFormEl(R.D,"fpe-",()=>{R.errs++;R.open=null;R.D=null;R.msg=`${R.errs} ${R.errs===1?"erro levado":"erros levados"} para o caderno. Eles voltam para revisão amanhã.`;render()}));w.appendChild(f)}}
  if(R.msg){const m=el(`<p class="pnote" role="status"></p>`);m.textContent=R.msg;w.appendChild(m)}
  const er=el(`<p class="err" hidden></p>`);w.appendChild(er);
  const a=el(`<div class="btns"><button class="btn primary" type="button">Concluir</button><button class="link" type="button">Não quero registrar</button></div>`),[ok,sk]=a.querySelectorAll("button");
  ok.onclick=()=>{const n=parseNota(R.n),of=parseNota(R.of);if(Number.isNaN(n)||Number.isNaN(of)||(n!==null&&of!==null&&n>of)){er.hidden=false;er.textContent="Confira a nota: use números, como 7,5 de 10.";return}
    const res={d:today(),e:R.errs};if(n!==null){res.n=n;res.of=of===null?10:of}p.res=res;facRes=null;saveFac();render()};
  sk.onclick=()=>{p.res={d:today(),e:R.errs,skip:true};facRes=null;saveFac();render()};w.appendChild(a);return w}
function provaDashItem(p){const st=provaStats(p),d=discOf(p.discId),nx=provaNext(p);
  const w=el(`<div class="fpd lv-${st.lvl}" id="fpd-${p.id}"><div class="fpdh"><b></b><span class="fcount${st.dd<=7?" soon":""}"></span></div><span class="ks"></span>
    <div class="meter"><i style="width:${st.tot?st.done/st.tot*100:0}%"></i></div><p class="fpdtx"></p></div>`);
  w.querySelector("b").textContent=p.name;w.querySelector(".fcount").textContent=inLabel(st.dd);w.querySelector(".ks").textContent=`${d?provaDiscName(p)+" · ":""}${dayLabel(p.date)}`;
  w.querySelector(".fpdtx").textContent=`${st.done} de ${st.tot} ${st.tot===1?"conteúdo pronto":"conteúdos prontos"}. ${provaRitmo(st)}`;
  if(nx){const n=el(`<p class="fpdnext">Próximo: <b></b></p>`);n.querySelector("b").textContent=refLabel(nx);w.appendChild(n)}
  const a=el(`<div class="btns"></div>`);
  if(nx){const b=el(`<button class="btn primary" type="button">Estudar o próximo</button>`);b.title="Abre o conteúdo e liga o Foco";b.onclick=()=>provaStudyNext(p);a.appendChild(b)}
  if(!sampleOff&&st.tot){const s=el(`<button class="btn${nx?"":" primary"}" type="button">Simulado da prova</button>`);s.disabled=!sampleFn;s.onclick=()=>provaSimGo(p);a.appendChild(s)}
  const v=el(`<button class="link" type="button">Ver conteúdo</button>`);v.onclick=()=>goProva(p);a.appendChild(v);w.appendChild(a);return w}
function renderFacProvas(){const box=$("#facProvas");if(!box)return;box.innerHTML="";
  const up=upcomingProvas(),cl=provasToClose();box.hidden=!fac.sems.length;if(box.hidden)return;
  box.appendChild(el(`<div class="dhead"><h2 id="fph">Próximas provas</h2><span class="todaydate"></span></div>`));
  box.querySelector(".todaydate").textContent=up.length?`${up.length} ${up.length===1?"prova":"provas"}`:"";box.querySelector(".dhead").appendChild(helpBtn("Faculdade e provas"));
  {const tl=el(`<div class="ftools fptools"></div>`),nb=el(`<button class="btn" type="button" id="fpgNew" aria-expanded="${facProvNew}">+ Nova prova</button>`);
    nb.onclick=()=>{facProvNew=!facProvNew;render();if(facProvNew)setTimeout(()=>{const x=document.getElementById("fpn-g")||document.getElementById("fpsem-g");if(x)x.scrollIntoView({block:"center",behavior:"smooth"})},60)};tl.appendChild(nb);
    if(downloadsFn&&(up.length||spFechas(365).length)){const cb=el(`<button class="link fcal" type="button" id="icsB">Adicionar ao calendário</button>`);cb.title="Gera um arquivo com provas e fechamentos para o Google Agenda ou o Calendário do celular";cb.onclick=icsSave;tl.appendChild(cb)}
    box.appendChild(tl);
    if(facProvNew){const ad=el(`<div class="fpadd fpgform"><span class="glabel">Nova prova</span></div>`);ad.appendChild(provaFormEl("g"));box.appendChild(ad)}}
  if(icsMsg){const m=el(`<p class="pnote" role="status"></p>`);m.textContent=icsMsg;box.appendChild(m);icsMsg=""}
  cl.forEach(p=>box.appendChild(provaResEl(p)));
  const sb=spFechaBlock();
  if(!up.length&&!sb){box.appendChild(el(`<p class="cempty">Nenhuma prova futura. Cadastre em <b>+ Nova prova</b> (acima) ou em <b>+ Prova</b>, dentro da disciplina: aqui aparece quanto falta e o ritmo para chegar pronto.</p>`));return}
  const L=facProvAll?up:up.slice(0,3);L.forEach(p=>box.appendChild(provaDashItem(p)));
  if(up.length>3){const t=el(`<button class="link" type="button"></button>`);t.textContent=facProvAll?"Mostrar só as 3 próximas":`Ver todas as ${up.length} provas`;t.onclick=()=>{facProvAll=!facProvAll;render()};box.appendChild(t)}
  if(sb)box.appendChild(sb)}
/* ----- foco por disciplina ----- */
function discFocusSec(d,from){const keys=new Set(topicKeysOf(discRefs(d)));
  return foSum(foSess.filter(x=>dnum(x.d)>=from&&(x.ref==="D:"+d.id||(x.ref||"").startsWith("T:")&&keys.has(x.ref.slice(2)))))}
function renderFacWeek(){const box=$("#facWeek");if(!box)return;box.innerHTML="";const act=new Set(activeSems()),ds=fac.discs.filter(d=>act.has(d.semId));
  box.hidden=!ds.length;if(box.hidden)return;const from=foWeekStart(),rows=ds.map(d=>({d,s:discFocusSec(d,from)})).sort((a,b)=>b.s-a.s),mx=Math.max(1,...rows.map(r=>r.s)),tot=rows.reduce((a,r)=>a+r.s,0);
  box.appendChild(el(`<div class="dhead"><h2>Foco nesta semana</h2><span class="todaydate"></span></div>`));box.querySelector(".todaydate").textContent=tot?fmtMin(tot):"";
  if(!tot){box.appendChild(el(`<p class="cempty">Nenhum tempo de foco nas disciplinas desde segunda. Na aba Foco, vincule a sessão a uma disciplina ou a um conteúdo dela.</p>`));return}
  const ul=el(`<ul class="fwlist"></ul>`);rows.forEach(r=>{const li=el(`<li><button class="link" type="button"></button><span class="fwbar"><i style="width:${r.s/mx*100}%"></i></span><b></b></li>`);
    li.querySelector("button").textContent=r.d.name;li.querySelector("button").onclick=()=>goDisc(r.d);li.querySelector("b").textContent=r.s?fmtMin(r.s):"–";ul.appendChild(li)});box.appendChild(ul)}
/* ----- materiais (links) na disciplina e na SP ----- */
function normUrl(u){u=String(u||"").trim();if(!u)return "";if(!/^https?:\/\//i.test(u))u="https://"+u;try{const x=new URL(u);return /\./.test(x.hostname)?x.href:""}catch(e){return ""}}
const hostOf=u=>{try{return new URL(u).hostname.replace(/^www\./,"")}catch(e){return ""}};
function linksBlock(o,key,always){const L=Array.isArray(o.links)?o.links:[],fk="lk"+key,F=facNew[fk];if(!L.length&&!F&&!always)return null;
  const w=el(`<div class="flinks"><div class="flh"><span class="glabel">Materiais${L.length?" · "+L.length:""}</span></div><ul></ul></div>`),ul=w.querySelector("ul");
  if(!F){const ad=el(`<button class="link" type="button">+ Material</button>`);ad.onclick=()=>{facNew[fk]={t:"",u:""};render();setTimeout(()=>{const x=document.getElementById("flu-"+key);if(x)x.focus()},40)};w.querySelector(".flh").appendChild(ad)}
  L.forEach(x=>{const li=el(`<li><a target="_blank" rel="noopener"></a><span class="flhost"></span></li>`),a=li.querySelector("a");a.href=x.u;a.textContent=x.t||hostOf(x.u);li.querySelector(".flhost").textContent=x.t?hostOf(x.u):"";
    li.appendChild(armBtn("lk"+x.id,"remover","Toque de novo para remover o link",()=>{o.links=L.filter(y=>y.id!==x.id);if(!o.links.length)delete o.links;saveFac();render()}));ul.appendChild(li)});
  if(!L.length&&!F)ul.appendChild(el(`<li class="how">Slides, pasta do Drive, artigos, vídeos: guarde os links aqui.</li>`));
  if(F){const f=el(`<form class="flform" novalidate><input class="etext" type="url" inputmode="url" autocapitalize="off" autocomplete="off" maxlength="600" placeholder="Link (ex.: drive.google.com/…)" aria-label="Link do material"><input class="etext" maxlength="80" placeholder="Nome (opcional, ex.: Slides da aula 3)" aria-label="Nome do material"><div class="btns"><button class="btn primary" type="submit">Salvar link</button><button class="btn" type="button">Cancelar</button></div></form>`);
    const [ui2,ti]=f.querySelectorAll("input");ui2.id="flu-"+key;ti.id="flt-"+key;ui2.value=F.u;ti.value=F.t;ui2.oninput=()=>F.u=ui2.value;ti.oninput=()=>F.t=ti.value;
    if(F.msg){const p=el(`<p class="err"></p>`);p.textContent=F.msg;f.appendChild(p)}
    f.onsubmit=e=>{e.preventDefault();const u=normUrl(ui2.value);if(!u){F.msg="Esse link não parece válido. Cole o endereço completo.";render();return}
      o.links=[...L,{id:fuid(),u:u.slice(0,600),t:ti.value.trim().slice(0,80)}];delete facNew[fk];saveFac();render()};
    f.querySelectorAll("button")[1].onclick=()=>{delete facNew[fk];render()};w.appendChild(f)}
  return w}

/* ---------- fechamento da SP (tutoria): objetivos e conteúdos entram no plano na semana antes ---------- */
const SP_LEAD=7,SP_SHOW=14,SP_LEADS=[2,3,4,5,6,7,10,14,21];
/* quantos dias antes do fechamento a SP entra no plano (escolha do estudante; sugestão 7) */
const spLead=s=>Number.isInteger(s.lead)&&s.lead>=1&&s.lead<=30?s.lead:SP_LEAD;
/* a SP vira uma "mini prova": conteúdos + objetivos ainda não marcados; vale o que foi estudado nos 10 dias antes */
function spAsProva(d,s){const pr=primaryRef(s),pk=pr&&refTopic(pr).k,obj=pk&&BYKEY[pk]?s.objs.map(o=>`S:${pk}:${o}`):[];
  return {id:"sp:"+s.id,discId:d.id,name:`${spShort(s.name)} (fechamento)`,date:s.fech,items:[...s.items,...obj],done:s.fdone||[],win:spLead(s)+3,sp:s}}
function spFechas(maxDays){const t=today(),act=new Set(activeSems()),out=[];
  fac.discs.forEach(d=>{if(!act.has(d.semId))return;(d.sps||[]).forEach(s=>{if(typeof s.fech!=="string"||s.fech<t||s.fadi)return;const dd=daysTo(s.fech);if(dd<=maxDays)out.push({d,s,dd,p:spAsProva(d,s)})})});
  return out.sort((a,b)=>a.dd-b.dd)}
/* vagas no plano do dia: 1 por SP (2 nos 2 últimos dias), no máximo 2 no total */
function spPlanPicks(){const out=[],seen=new Set();
  spFechas(30).filter(f=>f.dd<=spLead(f.s)).forEach(f=>{let n=f.dd<=2?2:1;for(const r of provaPending(f.p)){if(!n||out.length>=2)break;const x=refTopics(r).find(y=>BYKEY[y.k]&&!seen.has(y.k)&&!topicStudied(f.p,y));if(!x)continue;seen.add(x.k);out.push({x,it:BYKEY[x.k],d:f.dd,lab:spShort(f.s.name)});n--}});
  return out}
/* ir estudar: o objetivo abre o conteúdo principal da SP (é lá que os objetivos estão) */
function spGo(d,s,r){const x=refTopic(r);facGoRef(d,x&&x.sub?primaryRef(s):r)}
function spStudyNext(f){const r=provaNext(f.p);if(!r)return;const k=refTopic(r).k;
  foPick.ref="T:"+k;foSavePick();if(foRun){foRun.ref=foPick.ref;foSaveRun()}else{foPick.mode="p";foStart()}spGo(f.d,f.s,r)}
function spFechaBlock(){const L=spFechas(30).filter(f=>f.dd<=Math.max(SP_SHOW,spLead(f.s)));if(!L.length)return null;
  const w=el(`<div class="fspfech"><span class="glabel">Fechamentos de SP</span></div>`);
  L.forEach(f=>{const st=provaStats(f.p),nx=provaNext(f.p),[od,ot]=objStats(f.s);
    const r=el(`<div class="fpd fpsp lv-${st.lvl}" id="fpsp-${f.s.id}"><div class="fpdh"><b></b><span class="fcount${f.dd<=3?" soon":""}"></span></div><span class="ks"></span><div class="meter"><i style="width:${st.tot?st.done/st.tot*100:0}%"></i></div><p class="fpdtx"></p></div>`);
    r.querySelector("b").textContent=f.s.name;r.querySelector(".fcount").textContent=`fecha ${inLabel(f.dd)}`;r.querySelector(".ks").textContent=`${f.d.name} · ${dayLabel(f.s.fech)}`;
    r.querySelector(".fpdtx").textContent=st.tot?`${st.done} de ${st.tot} prontos${ot?` (${od} de ${ot} objetivos)`:""}.${st.pend.length?` Próximo: ${refLabel(nx)}.`:" Tudo pronto para o fechamento."}`:"Ligue conteúdos ou escreva os objetivos desta SP.";
    const a=el(`<div class="btns"></div>`);
    if(nx){const b=el(`<button class="btn" type="button">Estudar o próximo</button>`);b.title="Abre o conteúdo e liga o Foco";b.onclick=()=>spStudyNext(f);a.appendChild(b)}
    const v=el(`<button class="link" type="button">Ver a SP</button>`);v.onclick=()=>{facOpenSem.add(f.d.semId);facOpenDisc.add(f.d.id);facOpenSP.add(f.s.id);render();scrollToId("sp-"+f.s.id)};a.appendChild(v);
    r.appendChild(a);w.appendChild(r)});
  return w}
/* data de fechamento dentro da SP */
function spFechEl(d,s,L){const w=el(`<div class="fspfd"><label class="fcru">Fechamento <input type="date" class="etext"></label></div>`),i=w.querySelector("input");i.id="fech-"+s.id;i.value=s.fech||"";
  i.setAttribute("aria-label",`Data de fechamento da ${L.sp}`);
  i.onchange=()=>{const v=i.value;if(v&&!/^\d{4}-\d{2}-\d{2}$/.test(v))return;if(v)s.fech=v;else{delete s.fech;delete s.fdone}saveFac();
    const dd=v?daysTo(v):99;if(dd>=0&&dd<=spLead(s))provaChanged({date:v,name:spShort(s.name)},"fechamento da");else render()};
  if(s.fech){const c=el(`<button class="link" type="button">tirar a data</button>`);c.onclick=()=>{delete s.fech;delete s.fdone;saveFac();redoPlan()};w.appendChild(c)}
  const ld=spLead(s),sl=el(`<label class="fcru">Começar a estudar <select class="etext"></select></label>`),se=sl.querySelector("select");se.id="flead-"+s.id;
  SP_LEADS.forEach(n=>{const o=document.createElement("option");o.value=n;o.textContent=`${n} dias antes${n===SP_LEAD?" (sugerido)":""}`;se.appendChild(o)});
  if(!SP_LEADS.includes(ld)){const o=document.createElement("option");o.value=ld;o.textContent=`${ld} dias antes`;se.appendChild(o)}se.value=String(ld);
  se.onchange=()=>{const n=+se.value;if(n===SP_LEAD)delete s.lead;else s.lead=n;saveFac();if(s.fech)redoPlan();else render()};w.appendChild(sl);
  w.appendChild(el(`<p class="gtext how">Com a data, os objetivos e os conteúdos desta ${esc(L.sp)} entram no plano do dia nos ${ld} dias antes do fechamento (1 vaga; 2 nos últimos 2 dias) e aparecem em Próximas provas. Conta como pronto o que você estudar nesse período (e até 3 dias antes dele).</p>`));
  return w}

