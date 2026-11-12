/* ---------- Perfil e Configurações (preferências salvas na conta) ---------- */
const LSUI="resid-ui-v1";
const UI_DEF={prefs:{wnew:[0,1,2,3,4,5,6],wsim:[],woff:[],wday:[180,180,180,180,180,180,180],hgoal:600,wplans:{},layout:"classic",theme:"auto",font:"n",planN:3,subN:3,ints:"padrao",facWin:21,resWeek:2,fw:25,fb:5,fsnd:true,fgoal:0,fwake:true,flong:15,fevery:4,fnoise:"",fvol:40,fwgoal:0,qgoal:0,qpace:180,adapt:true},profile:{name:"",goal:"",goalDate:"",exams:[]}};
const INT_SETS={padrao:[1,3,7,15,30,60,90],intensivo:[1,2,4,7,15,30,60],espacado:[1,4,10,21,45,90,120]};
const INT_LAB={padrao:"Padrão",intensivo:"Intensivo",espacado:"Espaçado"};
let ui=JSON.parse(JSON.stringify(UI_DEF)),uiDoc=null,uiTimer=null,uiTouched=false,uiNote="",backStack=[],acctEmail=null;
function uiSanitize(x){const D=UI_DEF,o={prefs:{...D.prefs},profile:{...D.profile}},p=(x&&x.prefs)||{},f=(x&&x.profile)||{};
  if(["classic","compact","focus"].includes(p.layout))o.prefs.layout=p.layout;
  if(p.hnd&&typeof p.hnd==="object"&&!Array.isArray(p.hnd)){const H={};Object.entries(p.hnd).forEach(([k,v])=>{if(/^\d{4}-\d\d-\d\d$/.test(k)&&v&&typeof v.d==="string")H[k]={d:v.d,prev:Number.isInteger(v.prev)?v.prev:60}});if(Object.keys(H).length)o.prefs.hnd=H}
  if(Array.isArray(p.fotps)){const T=p.fotps.filter(t=>typeof t==="string"&&t.trim()).map(t=>t.trim().slice(0,40)).slice(-12);if(T.length)o.prefs.fotps=T}// Lote 21: tipos do Registrar tempo
  /* Lote 20E: plano alinhado ao eixo */if(typeof p.align==="boolean")o.prefs.align=p.align;if(["111","021","120"].includes(p.amix))o.prefs.amix=p.amix;if(typeof p.anear==="boolean")o.prefs.anear=p.anear;
  if(p.eixo&&typeof p.eixo==="object"&&typeof p.eixo.a==="string"&&typeof p.eixo.sp==="string")o.prefs.eixo={a:p.eixo.a.slice(0,6),sp:p.eixo.sp.slice(0,80),...(typeof p.eixo.until==="string"&&/^\d{4}-\d\d-\d\d$/.test(p.eixo.until)?{until:p.eixo.until}:{})};
  if(p.pgm&&typeof p.pgm==="object"&&!Array.isArray(p.pgm)){const m={};Object.entries(p.pgm).slice(-400).forEach(([k,v])=>{if(/^p[a-z0-9]{1,12}$/.test(k)&&Number.isInteger(v)&&v>0&&v<1000)m[k]=v});if(Object.keys(m).length)o.prefs.pgm=m}// Lote 20C: pegadinhas "não sabia"
  if(Array.isArray(p.bkps)){const L=p.bkps.filter(x=>x&&/^u[a-z0-9]{1,14}$/.test(x.id)&&typeof x.n==="string"&&x.n.trim()).slice(-12).map(x=>({id:x.id,n:x.n.trim().slice(0,40),f:bkFClean(x.f)}));if(L.length)o.prefs.bkps=L}// B2: filtros salvos do banco
  if(["auto","light","dark"].includes(p.theme))o.prefs.theme=p.theme;
  if(["n","g"].includes(p.font))o.prefs.font=p.font;
  if([2,3,4,5].includes(p.planN))o.prefs.planN=p.planN;
  if([2,3,4].includes(p.subN))o.prefs.subN=p.subN;
  if(INT_SETS[p.ints])o.prefs.ints=p.ints;
  if([14,21,28].includes(p.facWin))o.prefs.facWin=p.facWin;
  if([0,1,2,3].includes(p.resWeek))o.prefs.resWeek=p.resWeek;
  {const D=v=>Array.isArray(v)?[...new Set(v.filter(x=>Number.isInteger(x)&&x>=0&&x<=6))].sort():null,off=D(p.woff)||[],nw=(D(p.wnew)||[0,1,2,3,4,5,6]).filter(d=>!off.includes(d)),sm=(D(p.wsim)||[]).filter(d=>!off.includes(d));
    if(nw.length&&off.length<=5){o.prefs.wnew=nw;o.prefs.woff=off;o.prefs.wsim=sm}}
  /* planejamento semanal: minutos por dia (0 domingo … 6 sábado) na semana padrão, meta em minutos e as semanas planejadas (segunda → {m,ok}) */
  {const okM=a=>Array.isArray(a)&&a.length===7&&a.every(v=>WP_MIN.includes(v));
    o.prefs.wday=okM(p.wday)?[...p.wday]:[0,1,2,3,4,5,6].map(d=>o.prefs.woff.includes(d)?0:o.prefs.wnew.includes(d)?180:30);
    o.prefs.hgoal=Number.isInteger(p.hgoal)&&p.hgoal>=0&&p.hgoal<=3000?p.hgoal:Number.isInteger(p.fwgoal)&&p.fwgoal>0&&p.fwgoal<=3000?p.fwgoal:600;// Lote 17: quem só tinha a meta semanal de foco fica com ela
    const W={};if(p.wplans&&typeof p.wplans==="object")Object.keys(p.wplans).filter(k=>/^\d{4}-\d{2}-\d{2}$/.test(k)&&p.wplans[k]&&okM(p.wplans[k].m)).sort().slice(-3).forEach(k=>{W[k]={m:[...p.wplans[k].m],ok:p.wplans[k].ok?1:0};const ov=p.wplans[k].o;if(Array.isArray(ov)){const a=[...new Set(ov.filter(x=>Number.isInteger(x)&&x>=0&&x<=6))].sort();if(a.length)W[k].o=a}});o.prefs.wplans=W;
    if(okM(p.wday)){const w=o.prefs.wday,Dz=v=>Array.isArray(v)?v.filter(x=>Number.isInteger(x)&&x>=0&&x<=6):[];let nw=[0,1,2,3,4,5,6].filter(d=>w[d]>=60);if(!nw.length)nw=[0,1,2,3,4,5,6].filter(d=>w[d]>0);
      o.prefs.wnew=nw.length?nw:[1];o.prefs.woff=[0,1,2,3,4,5,6].filter(d=>w[d]===0);o.prefs.wsim=[...new Set(Dz(p.wsim))].sort()}
    o.prefs.wsim=o.prefs.wsim.filter(d=>o.prefs.wday[d]>0)}
  if(Number.isInteger(p.fw)&&p.fw>=5&&p.fw<=180)o.prefs.fw=p.fw;
  if(Number.isInteger(p.fb)&&p.fb>=0&&p.fb<=60)o.prefs.fb=p.fb;
  if(Number.isInteger(p.flong)&&p.flong>=0&&p.flong<=60)o.prefs.flong=p.flong;
  if(p.onb===1)o.prefs.onb=1;
  if(Array.isArray(p.ihide))o.prefs.ihide=p.ihide.filter(x=>typeof x==="string").slice(0,20);
  if(Array.isArray(p.iorder))o.prefs.iorder=p.iorder.filter(x=>typeof x==="string").slice(0,20);
  /* Lote 18: a fila do dia sobe para logo depois da saudação também em quem já tinha uma ordem salva (uma vez) */
  if(o.prefs.iorder&&!p.iq18){const a=o.prefs.iorder.filter(x=>x!=="iQueue"),h=a.indexOf("iHero");a.splice(h+1,0,"iQueue");o.prefs.iorder=a}if(o.prefs.iorder||p.iq18)o.prefs.iq18=1;
  if(Number.isInteger(p.fevery)&&p.fevery>=2&&p.fevery<=8)o.prefs.fevery=p.fevery;
  if(["","w","b","r","s","f"].includes(p.fnoise))o.prefs.fnoise=p.fnoise;
  if(typeof p.calm==="boolean")o.prefs.calm=p.calm;
  if(Number.isInteger(p.fvol)&&p.fvol>=0&&p.fvol<=100)o.prefs.fvol=p.fvol;
  if(Number.isInteger(p.fwgoal)&&p.fwgoal>=0&&p.fwgoal<=6000)o.prefs.fwgoal=p.fwgoal;
  if(typeof p.fsnd==="boolean")o.prefs.fsnd=p.fsnd;
  if(typeof p.fwake==="boolean")o.prefs.fwake=p.fwake;
  if(Number.isInteger(p.fgoal)&&p.fgoal>=0&&p.fgoal<=720)o.prefs.fgoal=p.fgoal;
  if(Number.isInteger(p.qgoal)&&p.qgoal>=0&&p.qgoal<=5000)o.prefs.qgoal=p.qgoal;
  if(typeof p.adapt==="boolean")o.prefs.adapt=p.adapt;
  if([120,150,180,210,240].includes(p.qpace))o.prefs.qpace=p.qpace;
  if(typeof f.name==="string")o.profile.name=f.name.trim().slice(0,40);
  if(["clinico","internato","reta"].includes(f.phase))o.profile.phase=f.phase;
  if(typeof f.goal==="string")o.profile.goal=f.goal.trim().slice(0,60);
  if(typeof f.goalDate==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(f.goalDate))o.profile.goalDate=f.goalDate;
  /* provas de residência: lista + principal; goal/goalDate passam a espelhar a principal (o resto do app lê esses dois) */
  let ex=Array.isArray(f.exams)?f.exams.filter(e=>e&&typeof e==="object").slice(0,12).map((e,i)=>{const y={id:typeof e.id==="string"&&e.id?e.id.slice(0,24):"ex"+i,name:typeof e.name==="string"?e.name.trim().slice(0,60):""};
    if(typeof e.date==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(e.date)){y.date=e.date;if(e.est)y.est=1}return y}):null;
  if(!ex||(!ex.length&&(o.profile.goal||o.profile.goalDate)&&!f.exOk)){ex=(o.profile.goal||o.profile.goalDate)?[{id:"ex0",name:o.profile.goal||"Prova de residência",...(o.profile.goalDate?{date:o.profile.goalDate}:{})}]:[]}
  o.profile.exams=ex;o.profile.exOk=true;const mn=ex.find(e=>e.id===f.mainEx)||ex[0];if(mn){o.profile.mainEx=mn.id;o.profile.goal=mn.name;o.profile.goalDate=mn.date||""}else{o.profile.goal="";o.profile.goalDate=""}
  return o}
function applyUI(){const P=ui.prefs,R=document.documentElement;R.dataset.skin=P.layout;R.dataset.font=P.font;R.dataset.calm=P.calm?"1":"0";
  if(P.theme==="auto"){if(R.dataset.themeOwn){R.removeAttribute("data-theme");delete R.dataset.themeOwn}}else{R.setAttribute("data-theme",P.theme);R.dataset.themeOwn="1"}
  PLAN_N=P.planN;SUBS_PER_DAY=P.subN;WK_NEW=new Set([0,1,2,3,4,5,6].filter(d=>P.wday[d]>=60));WK_SIM=new Set(P.wsim);WK_OFF=new Set([0,1,2,3,4,5,6].filter(d=>P.wday[d]===0));
  HAS_OFF=WK_OFF.size>0||Object.values(P.wplans||{}).some(w=>w.m.includes(0));INT.splice(0,INT.length,...INT_SETS[P.ints]);FAC_WIN=P.facWin;RES_MIN_WEEK=P.resWeek;
  if(window.__decideLayout)window.__decideLayout()}
function saveUI(){uiTouched=true;ui=uiSanitize(ui);try{localStorage.setItem(LSUI,JSON.stringify(ui))}catch(e){}applyUI();
  if(!uiDoc)return;clearTimeout(uiTimer);uiTimer=setTimeout(async()=>{uiTimer=0;try{liveW.ui=stab(ui);await uiDoc.set({...ui,updatedAt:new Date().toISOString()})}catch(e){}},600)}
function setPref(k,v){ui.prefs[k]=v;saveUI();render()}
const initials=n=>{const w=String(n||"").trim().split(/\s+/).filter(x=>x&&!STOP.has(norm(x)));return w.length?(w[0][0]+(w.length>1?w[w.length-1][0]:"")).toUpperCase():""};
function goSub(v){if(view!==v){if(!["perfil","config","help","instr"].includes(view))backStack=[];backStack.push(view);if(backStack.length>6)backStack.shift()}setView(v)}
function goBack(){setView(backStack.pop()||"inicio")}
/* ---------- Perfil ---------- */
function renderPerfil(){const v=$("#viewPerfil"),slot=$("#acctSlot");v.appendChild(slot);const box=$("#pfBody");box.innerHTML="";const P=ui.profile;
  const back=el(`<button class="link fback" type="button">← Voltar</button>`);back.onclick=goBack;box.appendChild(back);
  // cabeçalho
  const hd=el(`<section class="card pfhead"><div class="pfav" aria-hidden="true"></div><div class="pfid"><label class="ffield"><span>Seu nome</span><input class="etext" id="pfName" maxlength="40" placeholder="Como você quer ser chamado"></label><p class="gtext how">Aparece nas iniciais do ícone de perfil, no topo.</p></div></section>`);
  const av=hd.querySelector(".pfav"),ini=initials(P.name);if(ini)av.textContent=ini;else av.innerHTML=`<svg viewBox="0 0 24 24"><circle cx="12" cy="8.5" r="3.6"/><path d="M4.8 20c.9-3.6 3.8-5.6 7.2-5.6s6.3 2 7.2 5.6"/></svg>`;
  const ni=hd.querySelector("input");ni.value=P.name;ni.onchange=()=>{ui.profile.name=ni.value;saveUI();render()};box.appendChild(hd);
  if(!window.__site){const n=el(`<section class="card inote"><p><b>Use o site como principal.</b> Os dados deste artefato ficam separados do site. Para levar o progresso: <b>Configurações › Backup › Exportar</b> aqui e <b>Importar backup</b> no site.</p><div class="btns"><a class="btn" target="_blank" rel="noopener">Abrir o site</a></div></section>`);n.querySelector("a").href=SITE_URL;box.appendChild(n)}
  box.appendChild(phaseEl());
  // provas de residência
  const mt=exEditorEl();
  box.appendChild(mt);
  // conta
  const ac=el(`<section class="card"><div class="dhead"><h2>Conta</h2></div><p class="gtext pfacct"></p><div class="pfslot"></div></section>`),at=ac.querySelector(".pfacct");
  if(window.__site){at.textContent=!window.__site.configured?"A sincronização não está configurada neste site: os dados ficam só neste aparelho.":acctEmail?`Conectado como ${acctEmail}. Tudo sincroniza entre os aparelhos com essa conta.`:"Você não entrou: os dados ficam só neste aparelho. Entre para sincronizar com os outros aparelhos.";
    ac.querySelector(".pfslot").appendChild(slot);slot.hidden=false}
  else{at.textContent="No Claude, seu progresso fica salvo na sua conta do Claude, sem precisar de login. O site tem uma conta separada.";slot.hidden=true}
  box.appendChild(ac);
  // estatísticas
  const days=Object.keys(hist).sort(),act=days.filter(d=>{const h=hist[d];return h&&(h.e||h.r||h.q)});let rv=0,qq=0,qc=0;days.forEach(d=>{const h=hist[d]||{};rv+=h.r||0});
  ALL.forEach(i=>{const s=get(i.key);qq+=s.qt||0;qc+=s.qc||0});
  const studied=ALL.filter(i=>{const s=get(i.key);return s.last||(s.l||0)>0}).length,dom=ALL.filter(i=>(get(i.key).l||0)===3).length,first=act[0];
  const st=el(`<section class="card dash"><div class="dhead"><h2>Minhas estatísticas</h2></div><div class="kpis pfstats"></div></section>`),k=st.querySelector(".kpis");
  {const sb=el(`<button class="mini" type="button" id="pfStats">Ver Estatísticas</button>`);sb.onclick=()=>{backStack=[];setView("stats")};st.querySelector(".dhead").appendChild(sb);
    const xb=el(`<button class="mini" type="button" aria-expanded="${pdfOpt.open}">Exportar PDF</button>`);xb.onclick=()=>{pdfOpt.open=!pdfOpt.open;pdfOpt.msg="";render()};st.querySelector(".dhead").appendChild(xb)}
  [["Sequência atual",`${streak()}`,streak()===1?"dia seguido":"dias seguidos"],["Dias com estudo",`${act.length}`,first?`desde ${br(first)}/${first.slice(0,4)}`:"comece hoje"],
   ["Temas estudados",`${studied}`,`de ${TOTAL} · ${dom} dominados`],["Revisões feitas",`${rv}`,"no total"],
   ["Questões",qq.toLocaleString("pt-BR"),qq?`${pct(qc,qq)}% de acerto`:"nenhuma ainda"],["Faculdade",`${FAC_ITEMS.length}`,`conteúdos próprios · ${fac.discs.length} disciplina${fac.discs.length===1?"":"s"}`]]
   .forEach(([a,b2,c])=>{const x=el(`<div class="kpi"><span class="kl"></span><b></b><span class="ks"></span></div>`);x.querySelector(".kl").textContent=a;x.querySelector("b").textContent=b2;x.querySelector(".ks").textContent=c;k.appendChild(x)});
  if(pdfOpt.open)st.appendChild(pdfPanel());
  box.appendChild(st)}
const goalSpan=dd=>dd>=60?`${Math.round(dd/30.4)} meses`:dd>=14?`${Math.round(dd/7)} semanas`:`${dd} dias`;

/* ---------- Configurações ---------- */
let wkMsg="";
/* Lote 18: "Mais opções" dentro de cada cartão de Configurações (lembrado neste aparelho) */
let cfOpen=new Set((()=>{try{return JSON.parse(localStorage.getItem("resid-cfmore")||"[]")}catch(e){return []}})());
function cfLayer(card,key,labels,nodes){const rows=[...card.querySelectorAll(":scope>.cfrow")].filter(r=>labels.includes((r.querySelector(".cfl b")||{}).textContent)),N=[...nodes.filter(Boolean),...rows];if(!N.length)return;
  const d=el(`<details class="cfmore"><summary>Mais opções</summary><div class="cfmb"></div></details>`);d.id="cfm-"+key;d.open=cfOpen.has(key);d.addEventListener("toggle",()=>{d.open?cfOpen.add(key):cfOpen.delete(key);try{localStorage.setItem("resid-cfmore",JSON.stringify([...cfOpen]))}catch(e){}});
  N.forEach(n=>d.querySelector(".cfmb").appendChild(n));card.appendChild(d)}
function cfGo(id){goSub("config");setTimeout(()=>{const x=document.getElementById(id);if(x){x.scrollIntoView({behavior:"smooth",block:"start"});x.classList.add("cfhl");setTimeout(()=>x.classList.remove("cfhl"),1600)}},80)}
/* Lote 18: perfil por fase do curso — uma escolha ajusta várias opções (cada uma continua editável) */
const PHASES={clinico:{lab:"Ciclo clínico",how:"A faculdade vem primeiro no plano; a residência funciona como mapa do que importa. Meta e projeção discretas, sem marcar atraso.",set:{facWin:28,resWeek:1,qgoal:100,calm:true}},
  internato:{lab:"Internato",how:"Faculdade e residência equilibradas; mais questões por semana e um dia de simulado.",set:{facWin:21,resWeek:2,qgoal:200,calm:false,wsim:[6]}},
  reta:{lab:"Reta final",how:"A residência é a principal; meta e projeção ativas, e o plano cobra ritmo para chegar a tempo na prova.",set:{facWin:14,resWeek:3,qgoal:300,calm:false,wsim:[6]}}};
function phaseSuggest(){const L=fac.sems.filter(x=>!x.archived).map(x=>+(String(x.name).match(/\d+/)||[0])[0]).filter(Boolean),n=L.length?Math.max(...L):0,m=exMain(),d=m&&m.date?daysTo(m.date):null;
  return d!==null&&d>=0&&d<=270||n>=11?"reta":n>=9?"internato":"clinico"}
function setPhase(ph){if(!PHASES[ph])return;ui.profile.phase=ph;const S=PHASES[ph].set;for(const k in S)ui.prefs[k]=Array.isArray(S[k])?[...S[k]]:S[k];saveUI();applyUI();redoPlan(`Fase do curso: ${PHASES[ph].lab}. O plano de hoje foi refeito com as opções dela.`);render()}
function phaseEl(){const ph=ui.profile.phase,sg=phaseSuggest(),c=el(`<section class="card" id="pfPhase"><div class="dhead"><h2>Fase do curso</h2></div><p class="gtext how hx"></p><div class="seg" role="group" aria-label="Fase do curso"></div><p class="phhow"></p><p class="how phnote">Escolher a fase muda: antecedência das provas, residência garantida na semana, meta de questões, marcação de atraso e dia de simulado. Cada uma continua editável em Configurações.</p></section>`);
  c.querySelector("p.how").textContent=ph?(ph!==sg?`Pelo seu semestre${exMain()&&exMain().date?" e a data da prova":""}, o app sugere ${PHASES[sg].lab}.`:"Você pode trocar quando quiser."):`Pelo seu semestre${exMain()&&exMain().date?" e a data da prova":""}, o app sugere ${PHASES[sg].lab}.`;
  Object.entries(PHASES).forEach(([v,x])=>{const b=el(`<button type="button"></button>`);b.id="ph-"+v;b.textContent=x.lab+(v===sg&&v!==ph?" · sugerida":"");b.setAttribute("aria-pressed",ph===v);b.onclick=()=>setPhase(v);c.querySelector(".seg").appendChild(b)});
  c.querySelector(".phhow").textContent=ph?PHASES[ph].how:"";if(!ph)c.querySelector(".phhow").remove();return c}
/* Tempo de abertura (11/2026): as últimas 12 aberturas deste aparelho, gravadas pelo script do topo (resid-perf) */
function perfCardEl(){let L=[];try{L=JSON.parse(localStorage.getItem("resid-perf")||"[]")}catch(e){}
  const c=el(`<details class="card perfcard" id="perfCard"><summary><b>Tempo de abertura</b> <span class="muted">· ${L.length} medida${L.length===1?"":"s"} neste aparelho</span></summary></details>`);
  const s=x=>(x/1000).toFixed(1).replace(".",",")+" s",lab=r=>(r.app?"App instalado":"Navegador")+(r.sw?" · do aparelho":" · da internet");
  if(!L.length){c.appendChild(el(`<p class="muted">Ainda sem medidas. Feche e abra o app algumas vezes.</p>`));return c}
  c.appendChild(el(`<p class="muted hx">“Pronto” = a saudação do Início na tela. “Do aparelho” = o modo offline entregou os arquivos; “da internet” = primeira abertura ou versão nova.</p>`));
  const ol=el(`<ol class="perflist"></ol>`);L.forEach(r=>{const li=el(`<li></li>`);const d=new Date(r.at);
    li.textContent=`${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")} · ${lab(r)} · pronto em ${s(r.ok)} (1ª pintura ${s(r.fcp)})${r.kb?` · ${r.kb} KB baixados`:""}`;ol.appendChild(li)});c.appendChild(ol);
  const row=el(`<div class="row"></div>`),cp=el(`<button class="btn" type="button" id="perfCopy">Copiar as medidas</button>`),cl=el(`<button class="link" type="button" id="perfClear">Apagar</button>`);
  cp.onclick=()=>{const txt=L.map(r=>[new Date(r.at).toISOString(),lab(r),"pronto "+r.ok+" ms","1ª pintura "+r.fcp+" ms","html "+r.dcl+" ms",r.kb+" KB",navigator.userAgent].join(" | ")).join("\n");
    try{navigator.clipboard.writeText(txt).then(()=>infoToast("Medidas copiadas."),()=>infoToast("Não deu para copiar."))}catch(e){infoToast("Não deu para copiar.")}};
  cl.onclick=()=>{try{localStorage.removeItem("resid-perf")}catch(e){}render()};row.appendChild(cp);row.appendChild(cl);c.appendChild(row);return c}
function renderConfig(){const box=$("#cfBody");box.innerHTML="";const P=ui.prefs;
  const back=el(`<button class="link fback" type="button">← Voltar</button>`);back.onclick=goBack;box.appendChild(back);
  box.appendChild(el(`<h2 class="cftitle">Configurações</h2>`));
  {const ph=ui.profile.phase,r=el(`<p class="cfphase"><span></span> <button class="link" type="button">mudar no Perfil</button></p>`);r.querySelector("span").textContent=ph?`Fase do curso: ${PHASES[ph].lab}. Ela já ajustou as opções abaixo; você pode mudar cada uma.`:"Escolha a fase do curso no Perfil para o app ajustar as opções de uma vez.";r.querySelector("button").onclick=()=>{goSub("perfil");setTimeout(()=>{const x=$("#pfPhase");if(x)x.scrollIntoView({block:"center"})},60)};box.appendChild(r)}
  if(uiNote){const n=el(`<p class="pnote" role="status"></p>`);n.textContent=uiNote;box.appendChild(n)}
  // aparência
  const ap=el(`<section class="card"><div class="dhead"><h2>Aparência</h2></div><span class="glabel">Layout</span><div class="lays"></div></section>`),ly=ap.querySelector(".lays");
  [["classic","Clássico","Cartões arejados e gráficos completos. O padrão."],["compact","Compacto","Mais coisa por tela: letras e espaços menores, sem textos de explicação."],["focus","Essencial","Só o essencial do dia, letras maiores e sem gráficos no Início."]].forEach(([v,t,d])=>{
    const b=el(`<button class="lay" type="button" aria-pressed="${P.layout===v}"><span class="laypic lp-${v}" aria-hidden="true"><i></i><i></i><i></i></span><b></b><span></span></button>`);b.querySelector("b").textContent=t;b.querySelector("span:last-child").textContent=d;
    b.onclick=()=>setPref("layout",v);ly.appendChild(b)});
  ap.append(segRow("Tema","Automático segue o aparelho.",[["auto","Automático"],["light","Claro"],["dark","Escuro"]],P.theme,v=>setPref("theme",v)),
    segRow("Tamanho da letra","",[["n","Normal"],["g","Grande"]],P.font,v=>setPref("font",v)));
  if(sideFull())ap.appendChild(segRow("Barra lateral","Automática: aberta no Início e recolhida nas outras abas e na tela inteira; recolhida, abre ao passar o mouse (no iPad, toque em ≡). Vale para este aparelho.",[["","Automática"],["open","Sempre aberta"],["rail","Sempre recolhida"]],sbPin,v=>sbSetPin(v)));
  box.appendChild(ap);
  // plano e revisões
  const pl=el(`<section class="card"><div class="dhead"><h2>Plano do dia e revisões</h2></div></section>`);
  const planChange=(k,v)=>{ui.prefs[k]=v;saveUI();uiNote="O plano de hoje continua como estava. Toque em Refazer o plano de hoje para aplicar agora, ou espere até amanhã.";render()};
  pl.append(segRow("Temas por dia","Quantos temas o Estudar hoje propõe.",[[2,"2"],[3,"3"],[4,"4"],[5,"5"]],P.planN,v=>planChange("planN",v)),
    segRow("Subtópicos por tema","Quantos subtópicos entram nas revisões e nos pontos fracos. Tema novo vem inteiro até 6 subtópicos; maior que isso, em partes de 3 a 4 por dia (subtópico denso conta como dois).",[[2,"2"],[3,"3"],[4,"4"]],P.subN,v=>planChange("subN",v)));
  const ir=segRow("Intervalos das revisões",`${INT_SETS[P.ints].join(" · ")} dias. Muda as próximas revisões de todos os temas.`,Object.keys(INT_SETS).map(k=>[k,INT_LAB[k]]),P.ints,v=>{ui.prefs.ints=v;saveUI();uiNote="";render()});pl.appendChild(ir);
  pl.appendChild(segRow("Marcar atraso","Desligado: revisões passadas da data aparecem como “pendentes”, em âmbar, sem vermelho (bom no ciclo clínico, quando a faculdade vem primeiro).",[[true,"Ligado"],[false,"Desligado"]],!P.calm,v=>{ui.prefs.calm=!v;saveUI();applyUI();render()}));
  pl.appendChild(segRow("Ajustar pelo acerto","A partir da 2ª revisão: acerto de 85% ou mais nas questões do tema (mín. 8) alonga o intervalo em 40%, de 75% em 20%. Acerto baixo não encurta: ele vira ponto fraco (questões), não revisão mais cedo. Usa as questões dos últimos 90 dias (mín. 5).",[[true,"Ligado"],[false,"Desligado"]],P.adapt!==false,v=>{ui.prefs.adapt=v;saveUI();render()}));
  {const A=dnAsk.all,n=dnPending().length,g=el(`<div class="grp" id="dnAllBox"><span class="glabel">Subtópicos densos</span><p class="gtext how">Denso conta como dois na parte do dia. O Claude pode sugerir quais são, nos temas com 4 ou mais subtópicos (${n?`${n} ainda sem sugestão`:"todos já sugeridos"}). Você corrige em cada tema, e a sua escolha nunca é trocada.</p></div>`);
    if(sampleFn&&!sampleOff&&n){const b=el(`<button class="btn" type="button" id="dnAll">Pedir sugestões ao Claude</button>`);b.disabled=!!(A&&A.st==="loading");b.onclick=dnSuggestAll;g.appendChild(b)}
    if(A&&A.msg){const m=el(`<p class="gstatus" id="dnAllMsg"></p>`);m.textContent=A.msg;g.appendChild(m)}pl.appendChild(g)}
  pl.appendChild(wpCardEl());pl.appendChild(axCardEl());
  const rp=el(`<button class="btn" type="button">Refazer o plano de hoje</button>`);rp.onclick=()=>{redoPlan("Plano de hoje refeito com a nova configuração. O que você já tinha começado foi mantido.");uiNote="Plano de hoje refeito com a nova configuração.";render()};pl.appendChild(rp);
  box.appendChild(pl);
  // faculdade
  const fc=el(`<section class="card"><div class="dhead"><h2>Faculdade</h2></div></section>`);
  fc.append(segRow("Antecedência das provas","Quantos dias antes a prova começa a ocupar o plano do dia.",[[14,"14 dias"],[21,"21 dias"],[28,"28 dias"]],P.facWin,v=>{ui.prefs.facWin=v;saveUI();redoPlan();render()}),
    segRow("Residência garantida","Dias por semana com pelo menos 1 tema da residência, mesmo com provas (exceto na semana da prova).",[[0,"0"],[1,"1"],[2,"2"],[3,"3"]],P.resWeek,v=>{ui.prefs.resWeek=v;saveUI();redoPlan();render()}));
  const mc=el(`<div class="cfcrunch"></div>`);fc.appendChild(mc);box.appendChild(fc);renderFacCrunch(mc);
  // foco
  const fo=el(`<section class="card"><div class="dhead"><h2>Foco</h2></div></section>`);
  fo.append(segRow("Pomodoro","Minutos de foco + pausa. Em Personalizar, na aba Foco, você escolhe outros tempos.",[["25+5","25 + 5"],["50+10","50 + 10"],...(!(P.fw===25&&P.fb===5)&&!(P.fw===50&&P.fb===10)?[[`${P.fw}+${P.fb}`,`${P.fw} + ${P.fb}`]]:[])],`${P.fw}+${P.fb}`,v=>{const [w,b]=v.split("+").map(Number);ui.prefs.fw=w;ui.prefs.fb=b;saveUI();render()}),
    segRow("Som ao finalizar","Toca quando o ciclo ou a pausa terminam, com o app aberto.",[[true,"Ligado"],[false,"Desligado"]],!!P.fsnd,v=>{ui.prefs.fsnd=v;saveUI();render()}),
    segRow("Tela acesa durante o foco","Quando o aparelho permite.",[[true,"Sim"],[false,"Não"]],!!P.fwake,v=>{ui.prefs.fwake=v;saveUI();render()}));
  box.appendChild(fo);
  const qm=el(`<section class="card" id="cfQ"><div class="dhead"><h2>Questões</h2></div></section>`);
  qm.append(segRow("Meta semanal de questões","De segunda a domingo, contando todas as questões (geradas, registradas e as do tema).",[[0,"Sem meta"],[100,"100"],[150,"150"],[200,"200"],[300,"300"],[500,"500"],...(![0,100,150,200,300,500].includes(P.qgoal)?[[P.qgoal,String(P.qgoal)]]:[])],P.qgoal,v=>{ui.prefs.qgoal=v;saveUI();render()}),
    segRow("Tempo da prova","Quanto a prova dá por questão; o seu ritmo nos simulados é comparado com ele.",[[120,"2 min"],[150,"2min30"],[180,"3 min"],[210,"3min30"],[240,"4 min"]],P.qpace,v=>{ui.prefs.qpace=v;saveUI();render()}));box.appendChild(qm);box.appendChild(qm);
  // questões, backup e ajuda
  const qb=el(`<section class="card"><div class="dhead"><h2>Questões, backup e ajuda</h2></div><div class="cflinks"></div></section>`),ql=qb.querySelector(".cflinks");
  [["Instruções do gerador de questões","Estilo da banca, alternativas, dificuldade e comentário.",()=>goSub("instr")],["Backup","Exportar ou importar tudo num arquivo.",()=>{goSub("instr");setTimeout(()=>{const x=document.getElementById("bkh");if(x)x.scrollIntoView({behavior:"smooth",block:"start"})},60)}],["Ajuda","Como usar cada parte do app.",()=>goSub("help")]].forEach(([t,d,fn])=>{
    const b=el(`<button class="cflink" type="button"><b></b><span></span><i aria-hidden="true">›</i></button>`);b.querySelector("b").textContent=t;b.querySelector("span").textContent=d;b.onclick=fn;ql.appendChild(b)});
  box.appendChild(qb);box.appendChild(trashCardEl());box.appendChild(perfCardEl());
  /* Lote 18: configurações em camadas — o que se usa sempre fica à vista; o resto em "Mais opções" de cada cartão */
  cfLayer(ap,"ap",["Barra lateral"],[ap.querySelector(":scope>.glabel"),ap.querySelector(".lays")]);
  cfLayer(pl,"pl",["Subtópicos por tema","Intervalos das revisões","Ajustar pelo acerto","Marcar atraso"],[pl.querySelector("#dnAllBox")]);
  cfLayer(fc,"fc",["Residência garantida"],[fc.querySelector(".cfcrunch")]);
  cfLayer(fo,"fo",["Som ao finalizar","Tela acesa durante o foco"],[]);
  const rs=el(`<button class="link" type="button">Voltar tudo ao padrão</button>`);rs.onclick=()=>{ui.prefs={...UI_DEF.prefs};saveUI();uiNote="Configurações de volta ao padrão.";render()};box.appendChild(rs)}

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

