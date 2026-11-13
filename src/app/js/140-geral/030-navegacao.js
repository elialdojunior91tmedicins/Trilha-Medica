function showView(v){view=v;$("#viewInicio").hidden=v!=="inicio";$("#viewPerfil").hidden=v!=="perfil";$("#viewConfig").hidden=v!=="config";document.querySelectorAll(".tab").forEach(t=>t.setAttribute("aria-selected",t.dataset.v===v));
  $("#viewTemas").hidden=v!=="temas";$("#viewNotas").hidden=v!=="notas";$("#viewQuest").hidden=v!=="quest";$("#viewFac").hidden=v!=="fac";document.querySelectorAll(".tab").forEach(t=>t.setAttribute("aria-selected",t.dataset.v===v||(v==="instr"&&t.dataset.v==="quest")));$("#viewErros").hidden=v!=="erros";$("#viewInstr").hidden=v!=="instr";$("#viewHelp").hidden=v!=="help";$("#viewFoco").hidden=v!=="foco";$("#viewStats").hidden=v!=="stats";$("#viewMais").hidden=v!=="mais";$("#viewCards").hidden=v!=="cartoes";$("#tabM").setAttribute("aria-selected",["mais","foco","notas","stats","erros"].includes(v)&&document.documentElement.dataset.layout==="phone"||v==="mais")}
function setView(v){showView(v);render();window.scrollTo({top:0})}

/* Lote 19 (10/2026): explicações fixas dos cartões (.hx) ficam recolhidas atrás do "?" do cabeçalho do cartão.
   O "?" mostra a explicação ali mesmo; se o cartão tinha o "?" da Ajuda, o mesmo botão abre a explicação com "Mais na Ajuda". */
const hxOpen=new Set();
function hxKey(card,head){return card.id||card.getAttribute("aria-labelledby")||(head?head.textContent.replace(/\?/g,"").trim().slice(0,40):"")}
function hxScan(root){(root||document).querySelectorAll(".hx:not([data-hx])").forEach(p=>{p.dataset.hx="1";
  const card=p.closest(".card,.imeta,section,details")||p.parentElement;if(!card)return;
  if(card.dataset.hxc){hxShow(card);return}card.dataset.hxc="1";
  const head=[...card.children].find(c=>c.matches(".dhead,.todayhead,.cdhead,.fhead,header"))||null;
  const key=hxKey(card,head);let b=head&&head.querySelector(".hlpb");const help=b&&b.dataset.help;
  if(!b){b=el(`<button class="hlpb hxb hxnew" type="button" aria-label="Como funciona">?</button>`);b.title="Como funciona";
    if(head){const h=head.querySelector("h2,h3");h&&h.parentElement===head?h.after(b):head.appendChild(b)}else{const w=el(`<div class="hxrow"></div>`);w.appendChild(b);w.appendChild(el(`<span>Como funciona</span>`));p.before(w);w.onclick=e=>{if(e.target!==b)b.click()}}}
  else b.classList.add("hxb");
  if(help&&!card.querySelector(".hxmore")){const m=el(`<p class="hx hxmore" data-hx="1"><button class="link" type="button">Mais na Ajuda →</button></p>`);m.querySelector("button").onclick=()=>goHelp(help);const last=[...card.querySelectorAll(".hx:not(.hxmore)")].filter(x=>x.closest(".card,.imeta,section,details")===card).pop()||p;last.after(m)}
  b.onclick=e=>{e.stopPropagation();e.preventDefault();hxOpen.has(key)?hxOpen.delete(key):hxOpen.add(key);hxShow(card)};card.dataset.hxk=key;hxShow(card)})}
function hxShow(card){const on=hxOpen.has(card.dataset.hxk);card.querySelectorAll(".hx").forEach(x=>{if(x.closest(".card,.imeta,section,details")===card)x.classList.toggle("hxshow",on)});
  card.querySelectorAll(".hxb").forEach(b=>{b.setAttribute("aria-expanded",on?"true":"false");b.classList.toggle("on",on)})}
(()=>{let q=0;const go=()=>{q=0;hxScan()};new MutationObserver(()=>{if(!q)q=requestAnimationFrame(go)}).observe(document.documentElement,{childList:true,subtree:true})})();
function render(){
  if(qAutoRev())persist();if(recCheck())persist();rdExpire();
  const ae=document.activeElement,keep=ae&&ae.id&&/^(TEXTAREA|INPUT|SELECT)$/.test(ae.tagName)?{id:ae.id,s:ae.selectionStart,e:ae.selectionEnd,st:ae.scrollTop}:null;
  renderAll();applyFull();if(typeof bkFullApply==="function")bkFullApply();sbApply();if(view==="notas"&&nTocRender.last)nTocRender(...nTocRender.last);foNoiseSync();renderQBar();maybeOnb();
  if(keep){const n=document.getElementById(keep.id);if(n&&n!==document.activeElement){n.focus({preventScroll:true});try{n.setSelectionRange(keep.s,keep.e)}catch(e){}n.scrollTop=keep.st}}
}
/* barra lateral de altura inteira (computador e iPad deitado): a marca, a busca, o perfil e as configurações mudam de lugar (os mesmos nós, mesmos ids) */
const sideFull=()=>{const R=document.documentElement.dataset;return R.layout==="desktop"||R.layout==="tablet"&&R.cols==="2"};
function placeSide(){const full=sideFull(),h=document.querySelector("body>.wrap>header"),br=document.querySelector("h1.brand"),acts=$("#hacts"),sr=$("#srchBtn"),pf=$("#profBtn"),cf=$("#cfgBtn");if(!h||!br||!acts)return;
  if(!sr.querySelector(".sstx"))sr.insertAdjacentHTML("beforeend",`<span class="sstx">Buscar</span><kbd class="sskbd">Ctrl K</kbd>`);
  if(full){if(br.parentNode!==$("#sBrand"))$("#sBrand").appendChild(br);if(sr.parentNode!==$("#sSearch"))$("#sSearch").appendChild(sr);if(pf.parentNode!==$("#sfProf"))$("#sfProf").appendChild(pf);if(cf.parentNode!==$("#sfCfg"))$("#sfCfg").appendChild(cf)}
  else{if(br.parentNode!==h)h.insertBefore(br,acts.nextSibling);if(sr.parentNode!==acts||pf.parentNode!==acts||cf.parentNode!==acts)acts.append(sr,pf,cf)}
  const n=$("#sfName");if(n)n.textContent=(ui.profile.name||"").trim()||"Seu perfil"}
new MutationObserver(()=>placeSide()).observe(document.documentElement,{attributes:true,attributeFilter:["data-layout","data-cols"]});
/* ===== Lote 2: barra lateral recolhível (computador e iPad deitado) e menu ≡ (celular e iPad em pé) ===== */
const LSSB="resid-sbpin";let sbPin=(()=>{try{const v=localStorage.getItem(LSSB);return v==="open"||v==="rail"?v:""}catch(e){return ""}})(),sbTouch=false,sbT=0;
const sbHover=()=>matchMedia("(hover:hover) and (pointer:fine)").matches;
function sbMode(){if(!sideFull())return "";if(document.querySelector(".vfull")||(document.querySelector("#viewErros.erfull:not([hidden])")))return "rail";if(sbPin)return sbPin;return view==="inicio"?"open":"rail"}
function sbPeek(on,touch){const n=document.querySelector(".appnav");if(!n)return;const R=document.documentElement;on=!!on&&R.dataset.sb==="rail";n.classList.toggle("peek",on);sbTouch=on&&!!touch;$("#sbBack").hidden=!sbTouch;$("#sbMenu").setAttribute("aria-expanded",on)}
function sbApply(){const R=document.documentElement,m=sbMode();if(m){if(R.dataset.sb!==m)R.dataset.sb=m}else if(R.dataset.sb)delete R.dataset.sb;if(m!=="rail")sbPeek(false);
  const po=$("#sbPinOpen"),pr=$("#sbPinRail");if(po){po.setAttribute("aria-pressed",sbPin==="open");po.title=sbPin==="open"?"Fixada aberta. Toque para voltar ao automático (aberta no Início, recolhida nas outras abas)":"Fixar a barra sempre aberta";po.querySelector("span").textContent=sbPin==="open"?"Fixada":"Fixar"}
  if(pr){pr.setAttribute("aria-pressed",sbPin==="rail");pr.title=sbPin==="rail"?"Sempre recolhida. Toque para voltar ao automático":"Deixar a barra sempre recolhida (abre ao passar o mouse)";pr.querySelector("span").textContent=sbPin==="rail"?"Recolhida":"Recolher"}}
function sbSetPin(v){sbPin=v;try{v?localStorage.setItem(LSSB,v):localStorage.removeItem(LSSB)}catch(e){}sbPeek(false);sbApply();if(view==="config")render()}
new MutationObserver(()=>sbApply()).observe(document.documentElement,{attributes:true,attributeFilter:["data-layout","data-cols"]});
{const n=document.querySelector(".appnav");
  n.addEventListener("mouseenter",()=>{if(!sbHover()||document.documentElement.dataset.sb!=="rail")return;clearTimeout(sbT);sbT=setTimeout(()=>sbPeek(true),120)});
  n.addEventListener("mouseleave",()=>{clearTimeout(sbT);if(!sbTouch)sbPeek(false)});
  n.addEventListener("focusin",e=>{if(document.documentElement.dataset.sb==="rail"&&e.target.matches(":focus-visible"))sbPeek(true)});
  n.addEventListener("focusout",()=>setTimeout(()=>{if(!n.contains(document.activeElement)&&!sbTouch&&!n.matches(":hover"))sbPeek(false)},0));
  n.addEventListener("click",e=>{if(e.target.closest(".tab,.navextra button,#srchBtn,#sfWho,#profBtn,#cfgBtn"))sbPeek(false)});
  $("#sbMenu").onclick=()=>{const on=!n.classList.contains("peek");sbPeek(on,true)};
  $("#sbBack").onclick=()=>sbPeek(false);
  $("#sbPinOpen").onclick=()=>sbSetPin(sbPin==="open"?"":"open");
  $("#sbPinRail").onclick=()=>sbSetPin(sbPin==="rail"?"":"rail")}
/* menu ≡: lista de todas as seções com um resumo de cada */
const NM_SUB={inicio:"Painel do dia",temas:"198 temas e revisões",fac:"Semestres, disciplinas e provas",quest:"Banco de questões, simulados e provas",notas:"Caderno livre e anotações dos temas",foco:"Pomodoro e cronômetro",erros:"Caderno de erros",cartoes:"Revisar, criar e acompanhar os cartões",stats:"Como estou indo e se chego a tempo"};
function nmInfo(v){try{
  if(v==="inicio"){const P=ensurePlan();if(P.items.length){const d=P.items.filter(itemDone).length;return [`Estudar hoje: ${d} de ${P.items.length} temas`,""]}}
  if(v==="temas"){const n=dueCount();return [n?`${n} ${n===1?"revisão pendente":"revisões pendentes"}`:"Revisões em dia",n?"late":"",n]}
  if(v==="fac"){const up=upcomingProvas()[0];if(up){const dd=daysTo(up.date);return [`${up.name} · ${inLabel(dd)}`,dd<=7?"late":""]}}
  if(v==="quest"){const h=hist[today()];if(h&&h.q)return [`Hoje: ${h.q} ${h.q===1?"questão":"questões"}, ${pct(h.c||0,h.q)}% de acerto`,""]}
  if(v==="notas"){const nk=Object.keys(notes).filter(k=>BYKEY[k]&&notes[k].trim()).length,nf=freeN.length;if(nk||nf)return [[nf?`${nf} no caderno livre`:"",nk?`${nk} ${nk===1?"tema":"temas"} com anotações`:""].filter(Boolean).join(" · "),""]}
  if(v==="foco"){const td=foSum(foSess.filter(x=>x.d===today()));return [foRun?`${foRun.ph==="b"?"Pausa":"Sessão"} em andamento · ${foShown().txt}`:`Hoje: ${fmtMin(td)}${foDG()?` de ${fmtMin(foDG()*60)}`:""}`,"",foRun?"●":0]}
  if(v==="erros"){const n=eDueList().length;return [n?`${n} para revisar hoje`:"Nada para revisar hoje",n?"late":"",n]}
  if(v==="cartoes"){const n=cdDue().length;return [n?`${n} para revisar hoje`:"Nada para revisar hoje","",n]}
  if(v==="stats"){const V=stVerdRes(stRes(30)),a=V[0],b=V[1];if(a[1]==="na"&&b[1]==="na")return [NM_SUB.stats,""];return [[a[1]!=="na"?a[2]:"",b[1]!=="na"?`chegar a tempo: ${b[2].toLowerCase()}`:""].filter(Boolean).join(" · "),b[1]==="bad"||b[1]==="warn"?"late":""]}}catch(e){}return [NM_SUB[v]||"",""]}
function navListEl(onGo){const ul=el(`<ul class="nmlist"></ul>`),cur=["mais"].includes(view)?"":view;
  document.querySelectorAll(".appnav .tabs .tab").forEach(t=>{const v=t.dataset.v;if(!v||v==="mais"||v==="help")return;
    const [sub,cls,badge]=nmInfo(v),li=el(`<li><button class="nmit" type="button"><span class="nmic"></span><span class="nmt"></span><span class="nms"></span></button></li>`),b=li.querySelector("button");
    b.id="go-"+v;const ic=t.querySelector(".ti");if(ic)b.querySelector(".nmic").appendChild(ic.cloneNode(true));b.querySelector(".nmt").textContent=t.querySelector(".tl").textContent;
    const sp=b.querySelector(".nms");sp.textContent=sub;if(cls)sp.classList.add(cls);if(v==="foco")sp.id="maisFoco";if(v==="notas")sp.id="maisNotas";
    if(badge){const x=el(`<span class="nmb"></span>`);x.textContent=String(badge);if(v==="foco")x.classList.add("soft");b.appendChild(x)}
    if(v===cur)b.setAttribute("aria-current","page");b.onclick=()=>{onGo&&onGo();backStack=[];setView(v)};ul.appendChild(li)});
  return ul}
function navMenuOpen(){const M=$("#navMenu"),P=$("#nmPanel");P.innerHTML="";
  P.appendChild(el(`<span class="nmgrab" aria-hidden="true"></span>`));
  const hd=el(`<div class="nmhead"><h2>Menu</h2><button class="sbb" id="nmClose" type="button" aria-label="Fechar o menu"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>`);hd.querySelector("button").onclick=navMenuClose;P.appendChild(hd);
  const sr=el(`<button class="nmsearch" id="nmSearch" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/></svg>Buscar em temas, anotações e erros</button>`);sr.onclick=()=>{navMenuClose();gsOpen=true;renderGSearch()};P.appendChild(sr);
  P.appendChild(navListEl(navMenuClose));P.appendChild(el(`<div class="nmsep"></div>`));
  const sec=el(`<div class="nmsec"></div>`);[["nmProf","Perfil",`<circle cx="12" cy="8.5" r="3.6"/><path d="M4.8 20c.9-3.6 3.8-5.6 7.2-5.6s6.3 2 7.2 5.6"/>`,()=>goSub("perfil")],["nmCfg","Configurações",`<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/>`,()=>goSub("config")],["nmHelp","Ajuda",`<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.4c-.6.3-1 .8-1 1.5v.4M12 17.2v.1"/>`,()=>goSub("help")]].forEach(([id,t,ic,fn])=>{
    const b=el(`<button type="button"><svg viewBox="0 0 24 24" aria-hidden="true">${ic}</svg><span></span></button>`);b.id=id;b.querySelector("span").textContent=t;b.onclick=()=>{navMenuClose();fn()};sec.appendChild(b)});P.appendChild(sec);
  clearTimeout(nmTimer);cancelAnimationFrame(nmRaf);M.classList.remove("nmclosing","nmin");M.hidden=false;void P.offsetHeight;nmRaf=requestAnimationFrame(()=>{nmRaf=requestAnimationFrame(()=>M.classList.add("nmin"))});document.body.classList.add("nmopen");$("#tabM").setAttribute("aria-expanded","true");$("#navMenuBtn").setAttribute("aria-expanded","true");setTimeout(()=>{const c=$("#nmClose");if(c)c.focus({preventScroll:true})},30)}
let nmTimer=0,nmRaf=0;
function navMenuClose(){const M=$("#navMenu");if(M.hidden||M.classList.contains("nmclosing"))return;
  cancelAnimationFrame(nmRaf);M.classList.remove("nmin");M.classList.add("nmclosing");clearTimeout(nmTimer);nmTimer=setTimeout(()=>{M.classList.remove("nmclosing");M.hidden=true},260);document.body.classList.remove("nmopen");$("#tabM").setAttribute("aria-expanded","false");$("#navMenuBtn").setAttribute("aria-expanded","false")}
$("#navMenu").addEventListener("click",e=>{if(e.target.id==="navMenu")navMenuClose()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(!$("#navMenu").hidden){navMenuClose();e.stopPropagation()}else if(document.querySelector(".appnav.peek"))sbPeek(false)}},true);
$("#navMenuBtn").onclick=()=>(($("#navMenu").hidden||$("#navMenu").classList.contains("nmclosing"))?navMenuOpen():navMenuClose());

function renderHead(){placeSide();const ini=initials(ui.profile.name),b=$("#profBtn");if(!b)return;b.classList.toggle("hasini",!!ini);$("#profIni").textContent=ini;
  b.setAttribute("aria-pressed",view==="perfil");$("#cfgBtn").setAttribute("aria-pressed",["config","help","instr"].includes(view))}

/* computador: atalhos no menu lateral */
function renderNavExtra(P,dueN){const box=$("#navExtra");box.innerHTML="";
  const add=(k,v,cls,fn)=>{const b=el(`<button type="button"><span class="nk"></span><span class="nv${cls?" "+cls:""}"></span></button>`);b.querySelector(".nk").textContent=k;b.querySelector(".nv").textContent=v;b.onclick=fn;box.appendChild(b)};
  /* Lote 17: a barra lateral fica só com a navegação e os selos (os números do dia moram no Início); só o modo provas, que muda o app inteiro, aparece aqui */
  const CR=examCrunch();if(CR.active)add("Modo provas",`ligado até ${br(CR.until)}`,"late",()=>setView("fac"));box.hidden=!box.children.length}
function renderMais(){const b=$("#maisBody");b.innerHTML="";b.appendChild(el(`<h2 class="cftitle">Menu</h2>`));b.appendChild(navListEl())}
function renderAll(){
  $("#tdate").textContent=new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"});
  // contadores das abas (sempre visíveis)
  {const n=eDueList().length;$("#ecount").textContent=n?String(n):"";$("#ecount").title=n?`${n} ${n===1?"erro para revisar":"erros para revisar"} hoje`:""}
  {const nk=Object.keys(notes).filter(k=>BYKEY[k]&&notes[k].trim()).length;$("#ncount").textContent=nk?String(nk):""}
  {const n=cdDue().length;$("#ccount").textContent=n?String(n):"";$("#ccount").title=n?`${n} ${n===1?"cartão":"cartões"} hoje`:""}
  const P0=ensurePlan(),dueN=dueCount();
  /* Lote 19: o selo mostra o que cabe fazer hoje (fila do dia), não a dívida inteira */
  {let fit=dueN;try{fit=Math.min(dueN,qCounts().revs)}catch(e){}$("#rcount").textContent=fit?String(fit):"";$("#rcount").title=fit?`${fit} ${fit===1?"revisão cabe":"revisões cabem"} hoje${dueN>fit?` (${dueN} pendentes)`:""}`:""}
  renderTSeg(dueN);renderNavExtra(P0,dueN);
  // só a aba aberta é redesenhada (as outras são montadas ao abrir)
  if(view!=="temas")$("#areas").innerHTML="";if(view!=="fac"){$("#facSems").innerHTML="";$("#facCrunch").innerHTML=""}if(view!=="config")$("#cfBody").innerHTML="";
  if(view==="erros")renderErros();
  else if(view==="notas")renderNotasView();
  else if(view==="quest")renderQuest();
  else if(view==="fac")renderFac();
  else if(view==="instr")renderBackup();
  else if(view==="help")renderHelp();
  else if(view==="perfil")renderPerfil();
  else if(view==="config")renderConfig();
  else if(view==="foco")renderFoco();
  else if(view==="stats")renderStats();
  else if(view==="mais")renderMais();
  else if(view==="cartoes")renderCards();
  if(view!=="cartoes")$("#cdBody").innerHTML="";
  if(view!=="foco")$("#foBody").innerHTML="";
  foEnsureTick();foPaint();
  renderHead();
  renderFocus();
  placeShared();
  if(view==="inicio"){renderPlan();renderRevs();renderInicio();return}
  if(view!=="temas")return;
  // plano
  renderPlan();
  renderRevs();renderAgenda();
  // resumo
  renderDash();renderInicioMeta();renderResMap();renderLvSug();renderPins();
  renderTFilters();
  // áreas
  semKS=null;
  const errN={};errors.forEach(e=>errN[e.k]=(errN[e.k]||0)+1);
  const foTot={};foSess.forEach(x=>{if(x.ref&&x.ref[0]==="T"){const k=x.ref.slice(2);foTot[k]=(foTot[k]||0)+x.sec}});
  const box=$("#areas"); box.innerHTML="";
  const facL=facLinkMap();
  /* tema aberto fica sempre à vista: abre a área e a especialidade dele */
  if(openKey&&BYKEY[openKey]){const it=BYKEY[openKey];openAreas.add(it.area.code);if(it.sp)openSpecs.add(spKey(it))}
  [...AREAS,FAC_AREA].forEach(a=>{if(tf.area!=="all"&&a.code!==tf.area)return;
    const isFac=a===FAC_AREA, facIn=FAC_ITEMS.filter(it=>it.area===a&&matches(it)).sort((x,y)=>x.t.localeCompare(y.t,"pt"));
    if(isFac&&!facIn.length)return;
    const ac=counts(isFac?[]:a.items), vis=isFac?[]:a.items.filter(matches);
    if(tf.sem&&!vis.length&&!facIn.length)return;// Neste semestre: só as áreas com temas do semestre
    if(sortBy==="inc"||tf.sem)vis.sort((x,y)=>wOf(y)-wOf(x)||x.num-y.num);
    const d=document.createElement("details"); d.className="area";
    d.open=openAreas.has(a.code)||!!query||tfNarrow()||tf.area===a.code;
    {const fo=!!query||tfNarrow()||tf.area===a.code;d.addEventListener("toggle",()=>{if(fo&&d.open)return;d.open?openAreas.add(a.code):openAreas.delete(a.code);if(!d.open&&openKey&&BYKEY[openKey]&&BYKEY[openKey].area===a){openKey=null;render()}if(!d.open&&tf.area===a.code){tf.area="all";tf.sp="all";render()}})}
    d.innerHTML=isFac?`<summary><span class="code">FAC</span><span class="aname">Faculdade · sem área definida</span><span class="acount">${facIn.length}<i class="achev" aria-hidden="true"></i></span></summary>`:
      `<summary><span class="code">${a.code}</span><span class="aname">${a.name}</span><span class="acount">${ac[3]}/${a.items.length}${facIn.length?` <span class="facchip">+${facIn.length} FAC</span>`:""}<i class="achev" aria-hidden="true"></i></span><div class="bar"><i class="d3"></i><i class="d2"></i><i class="d1"></i></div></summary>`;
    if(!isFac)bar(d.querySelector("summary .bar"),ac,a.items.length);
    const ol=document.createElement("ol");
    if(!vis.length&&!facIn.length)ol.appendChild(el(`<li class="empty">Nenhum tema desta área neste filtro.</li>`));
    const row=it=>{const s=get(it.key),l=s.l||0,lsv=s,dd=dueIn(s),open=openKey===it.key;
      const li=el(`<li class="t${open?" open":""}${it.own?" own":""}" id="t-${it.key}"><button class="item" aria-expanded="${open}"><span class="num">${it.own?"FAC":""}</span><span class="topic"></span><span class="lvl" data-l="${lvKey(lsv)}">${lvName(lsv)}</span><span class="meta"></span></button></li>`);
      li.querySelector(".topic").textContent=(s.pin?"★ ":"")+it.t;
      const m=li.querySelector(".meta");
      if(it.own){const x=el(`<span class="facchip"></span>`);x.textContent="FAC"+(it.origin?" · "+it.origin:"");if(it.originFull)x.title=it.originFull;m.appendChild(x)}else m.appendChild(incEl(wOf(it),wOf(it)===3));
      const fb=facBadge(it.key);if(fb){const x=el(`<span class="fbadge"></span>`);x.textContent=`Prova de ${fb.d.name} · ${br(fb.p.date)}`;m.appendChild(x)}
      else if(!it.own&&facL[it.key]){const L0=facL[it.key],x=el(`<span class="fbadge"></span>`);x.textContent=`Faculdade · ${L0.s?spShort(L0.s.name):L0.d.name}`;x.title=L0.d.name+(L0.s?" · "+L0.s.name:"");m.appendChild(x)}
      const nx=bulk?null:topicNext(it);
      if(dd!==null&&!(nx&&dd<=0))m.appendChild(el(`<span class="${dd<=0?"late":""}">${dueLabel(dd)}</span>`));
      if(s.qt){const pp=Math.round(acc(s)*100),[bk]=band(pp);m.appendChild(el(`<span class="st ${bk}">${pp}% em ${s.qt} questões</span>`))}
      {const fo=foTot[it.key];if(fo)m.appendChild(el(`<span>⏱ ${fmtMin(fo)}</span>`))}
      if(!nx){if(lvMeets(s))m.appendChild(el(`<span class="lvup">pronto para Dominado</span>`));else if(lvDrop(it.key))m.appendChild(el(`<span class="late">acerto caiu</span>`))}
      const [sd,st]=subCount(it);
      if(notes[it.key])m.appendChild(el(`<span>com anotações</span>`));
      const ne=errN[it.key]||0; if(ne)m.appendChild(el(`<span>${ne} ${ne===1?"erro":"erros"} no caderno</span>`));
      if(!m.children.length)m.remove();
      if(bulk){const can=tfLevel(s)===0,on=bulk.sel.has(it.key);li.classList.add("bulkrow");if(on)li.classList.add("bsel");const b=li.querySelector(".item");b.setAttribute("aria-pressed",on);b.removeAttribute("aria-expanded");
        b.querySelector(".num").innerHTML=can?`<span class="bchk" aria-hidden="true">${on?"✓":""}</span>`:"";if(!can){b.disabled=true;b.title="Já tem estudo registrado"}else b.onclick=()=>bulkToggle(it.key);return li}
      li.querySelector(".item").onclick=()=>{openKey=open?null:it.key;formErr="";subErr="";clearArm=null;render()};
      /* próximo passo + marcar subtópicos sem abrir o tema */
      if(!open&&(nx||st)){const L=el(`<div class="tnext"></div>`);if(nx){const x=el(`<span class="tnx"></span>`);x.textContent="→ "+nx[0];if(nx[1])x.classList.add(nx[1]);L.appendChild(x)}
        if(st){const qo=subQ===it.key,b=el(`<button type="button" class="tsq" aria-expanded="${qo}"></button>`);b.id="tsq-"+it.key;b.textContent=`☑ ${sd}/${st} subtópicos`;b.title="Marcar subtópicos sem abrir o tema";
          b.onclick=()=>{subQ=qo?null:it.key;render()};L.appendChild(b)}
        li.appendChild(L);
        if(st&&subQ===it.key){const u=el(`<ul class="tsql"></ul>`);subList(it).forEach((x,j)=>{const r=el(`<li><label><input type="checkbox"><span></span></label></li>`),cb=r.querySelector("input");cb.checked=x.done;cb.id=`tsq-${it.key}-${j}`;
            r.querySelector("span").textContent=x.t;cb.onchange=()=>toggleSub(it,x);u.appendChild(r)});
          const f=el(`<li class="tsqf"><button class="link" type="button">Fechar</button><span class="how">Marque o que você estudou fora do app; o tema segue as mesmas regras de quando você marca dentro dele.</span></li>`);f.querySelector("button").onclick=()=>{subQ=null;render()};u.appendChild(f);li.appendChild(u)}}
      if(open){const det=renderDetail(it);if(it.own)det.appendChild(dupBox(it));li.appendChild(det)}
      return li};
    const extraSpecs=[...new Set(facIn.map(it=>it.sp))].filter(n=>!(a.specs||[]).some(x=>x.name===n)).map(name=>({name,items:[],extra:true}));
    if(a.specs||isFac){[...(a.specs||[]),...extraSpecs].forEach(sp=>{const fs=facIn.filter(it=>it.sp===sp.name),sv=[...vis.filter(it=>it.sp===sp.name),...fs];if(!sv.length)return;
        const forced=!!query||tfNarrow(), op=forced||openSpecs.has(a.code+":"+sp.name)||tf.sp===sp.name, sc=counts(sp.items);
        const h=el(`<li class="sphead"><button type="button" aria-expanded="${op}"><span class="chev" aria-hidden="true"></span><span class="spname"></span><span class="spcount">${sp.items.length?`${sc[3]}/${sp.items.length}`:""}${fs.length?` <span class="facchip">${sp.items.length?"+":""}${fs.length} FAC</span>`:""}</span>${sp.items.length?`<div class="bar"><i class="d3"></i><i class="d2"></i><i class="d1"></i></div>`:""}</button></li>`);
        h.querySelector(".spname").textContent=sp.name;if(sp.items.length)bar(h.querySelector(".bar"),sc,sp.items.length);
        h.querySelector("button").onclick=()=>{if(forced)return;const sk=a.code+":"+sp.name;if(openSpecs.has(sk)){openSpecs.delete(sk);if(tf.sp===sp.name)tf.sp="all";if(openKey&&BYKEY[openKey]&&BYKEY[openKey].area===a&&BYKEY[openKey].sp===sp.name)openKey=null}else openSpecs.add(sk);render()};
        if(forced)h.querySelector("button").disabled=true;
        ol.appendChild(h);
        if(op&&bulk){const free=sv.filter(it=>tfLevel(get(it.key))===0);if(free.length){const all=free.every(it=>bulk.sel.has(it.key)),x=el(`<li class="bulkall"><button class="link" type="button"></button></li>`);x.querySelector("button").textContent=all?`Desmarcar os ${free.length} desta especialidade`:`Selecionar os ${free.length} não iniciados desta especialidade`;
          x.querySelector("button").onclick=()=>{free.forEach(it=>all?bulk.sel.delete(it.key):bulk.sel.add(it.key));render()};ol.appendChild(x)}}
        if(op)sv.forEach(it=>ol.appendChild(row(it)))})}
    else vis.forEach(it=>ol.appendChild(row(it)));
    d.appendChild(ol); box.appendChild(d);
    if(isFac)d.open=openAreas.has("FAC")||!!query||tfNarrow()||tf.area==="FAC";
  });
}

