/* ---------- Planejar a semana (Lote 10): Esta semana · Próxima · Semana padrão; tempo de cada dia em WP_MIN; meta ui.prefs.hgoal ---------- */
let wpTab=null,wpMsg="";const WP_ORDER=[1,2,3,4,5,6,0],WD3=["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const hm=m=>{m=Math.round(m);const h=Math.floor(m/60),r=m%60;return h?(r?`${h} h ${String(r).padStart(2,"0")}`:`${h} h`):`${r} min`};
const ddmm=n=>{const d=fromNum(n);return d.slice(8,10)+"/"+d.slice(5,7)};
function wpPlanned(mon){return ui.prefs.wplans[fromNum(mon)]||null}
function wpArr(mon){const W=wpPlanned(mon),b=W?W.m:ui.prefs.wday;return b.map((m,d)=>W&&Array.isArray(W.o)&&W.o.includes(d)?m:gradeAdj(m,mon+((d+6)%7)))}
/* muda um dia; mon=null = semana padrão. Mexer no dia de hoje refaz o plano de hoje (mantém o começado) */
function wpSetDay(mon,d,m){const P=ui.prefs,t=dnum(today());
  if(mon===null){const w=[...P.wday];w[d]=m;if(w.filter(x=>x===0).length>5){wpMsg="No máximo 5 dias de folga na semana padrão.";render();return}wpMsg="";P.wday=w;wpLegacy()}
  else{const k=fromNum(mon),W=P.wplans[k]?{...P.wplans[k],m:[...P.wplans[k].m]}:{m:[...P.wday],ok:0};W.m[d]=m;W.o=[...new Set([...(W.o||[]),d])].sort();P.wplans={...P.wplans,[k]:W}}
  saveUI();const todayHit=(mon===null&&!wpPlanned(wpMon(t))&&wdOf(t)===d)||(mon===wpMon(t)&&wdOf(t)===d);
  if(todayHit)redoPlan(`Plano de hoje ajustado para ${WP_LAB[m].toLowerCase()}. O que você já tinha começado foi mantido.`);else render()}
/* mantém os campos antigos (wnew/woff) coerentes para quem ainda lê */
function wpLegacy(){const P=ui.prefs,w=P.wday;let nw=[0,1,2,3,4,5,6].filter(d=>w[d]>=60);if(!nw.length)nw=[0,1,2,3,4,5,6].filter(d=>w[d]>0);P.wnew=nw.length?nw:[1];P.woff=[0,1,2,3,4,5,6].filter(d=>w[d]===0);P.wsim=P.wsim.filter(d=>w[d]>0)}
function wpConfirm(mon){const k=fromNum(mon),P=ui.prefs,W=P.wplans[k]||{m:[...P.wday],ok:0};P.wplans={...P.wplans,[k]:{m:[...W.m],...(W.o?{o:[...W.o]}:{}),ok:1}};saveUI();render()}
function wpReset(mon){const k=fromNum(mon),P=ui.prefs,o={...P.wplans};delete o[k];P.wplans=o;saveUI();const t=dnum(today());if(mon===wpMon(t))redoPlan("Esta semana voltou à semana padrão.");else render()}
/* o tempo de hoje, pelo link do Estudar hoje */
function setTodayMin(m){const t=dnum(today());wpSetDay(wpMon(t),wdOf(t),m)}
function wpCardEl(){const P=ui.prefs,t=dnum(today()),cur=wpMon(t);if(!wpTab)wpTab=wdOf(t)===0?"next":"cur";
  const c=el(`<div class="wpcard" id="wpCard"><div class="wph"><b>Planejar a semana</b><span class="gtext how hx">O tempo que você tem em cada dia decide o tamanho do Estudar hoje: 30 min = só cartões, erros e revisões; 1 h ≈ 1 tema; 2 h ≈ 2 temas; 3 h+ = o plano inteiro.</span></div><div class="seg wptabs" role="group" aria-label="Qual semana"></div><div class="wpbody"></div></div>`);
  const tg=c.querySelector(".wptabs");[["cur","Esta semana"],["next","Próxima semana"],["pad","Semana padrão"]].forEach(([v,lab])=>{const b=el(`<button type="button"></button>`);b.id="wpT-"+v;b.textContent=lab;b.setAttribute("aria-pressed",wpTab===v);b.onclick=()=>{wpTab=v;wpMsg="";render()};tg.appendChild(b)});
  const body=c.querySelector(".wpbody"),pad=wpTab==="pad",mon=pad?null:wpTab==="next"?cur+7:cur,W=pad?null:wpPlanned(mon),arr=pad?P.wday:wpArr(mon);
  if(pad)body.appendChild(el(`<p class="how hx">O tempo que você costuma ter em cada dia. Vale para toda semana que você não planejar.</p>`));
  else{const h=el(`<p class="wpst"><b></b> <span></span></p>`);h.querySelector("b").textContent=`${ddmm(mon)} a ${ddmm(mon+6)}`;
    h.querySelector("span").textContent=W&&W.ok?"· confirmada":W?"· alterada, ainda não confirmada":"· veio da semana padrão";body.appendChild(h);
    /* Lote 18: antes de planejar, a semana anterior a esta (o que cumpriu, o que atrasou, onde melhorou) */
    if(mon-7<=cur){const S=wpSumEl(mon-7);if(S){const d=el(`<details class="wpprev" id="wpPrev"><summary></summary></details>`);d.open=!(W&&W.ok);
      d.querySelector("summary").textContent=mon-7===cur?(wdOf(t)===0?"Antes de planejar: como foi esta semana":"Antes de planejar: esta semana até agora"):"Antes de planejar: como foi a semana passada";d.appendChild(S);body.appendChild(d)}}}
  const days=el(`<div class="wpdays"></div>`);
  WP_ORDER.forEach(d=>{const n=pad?null:mon+((d+6)%7),past=!pad&&n<t,r=el(`<div class="wpday${past?" past":""}${!pad&&n===t?" wpnow":""}"><span class="wpdn"><b></b><small></small></span><div class="wpopts" role="group"></div></div>`);
    r.querySelector("b").textContent=WD3[d];r.querySelector("small").textContent=pad?"":n===t?"hoje":ddmm(n);
    if(!pad){const A=aulasOn(n),W0=wpPlanned(mon),base=(W0?W0.m:P.wday)[d];if(A.length&&!(W0&&W0.o&&W0.o.includes(d))&&arr[d]!==base){const x=el(`<small class="wpaula"></small>`);x.textContent=`aula: ${A.map(a=>`${a.t} ${hm2(a.ini)}–${hm2(a.fim)}`).join(", ")} · menos tempo`;r.querySelector(".wpdn").appendChild(x)}}const g=r.querySelector(".wpopts");g.setAttribute("aria-label",WD_FULL[d]);
    WP_MIN.forEach(m=>{const on=arr[d]===m,b=el(`<button type="button" class="wpo${m===0?" off":""}${!pad&&on&&W&&P.wday[d]!==m?" chg":""}" aria-pressed="${on}"></button>`);b.id=`wp-${d}-${m}`;b.textContent=WP_LAB[m];b.disabled=past;
      b.onclick=()=>{if(!on)wpSetDay(mon,d,m)};g.appendChild(b)});days.appendChild(r)});
  body.appendChild(days);
  if(wpMsg&&pad){const m=el(`<p class="err" role="alert"></p>`);m.textContent=wpMsg;body.appendChild(m)}
  const tot=arr.reduce((a,m)=>a+m,0),goal=P.hgoal,tb=el(`<div class="wptot"><div class="meter"><i></i></div><b></b></div>`);tb.querySelector("i").style.width=Math.min(100,goal?tot/goal*100:100)+"%";
  tb.querySelector("b").textContent=goal?`${hm(tot)} de ${hm(goal)}`:`${hm(tot)} por semana`;body.appendChild(tb);
  if(goal&&tot<goal){const free=WP_ORDER.filter(d=>(pad||mon+((d+6)%7)>=t)&&arr[d]>0&&arr[d]<180),nt=el(`<p class="wpnote"></p>`);
    nt.textContent=`Faltam ${hm(goal-tot)} para a meta.${free.length?` Que tal um pouco mais ${free.slice(0,2).map(d=>(d===0||d===6?"no ":"na ")+WD_FULL[d]).join(" ou ")}?`:""} Se a meta parece longe, suba aos poucos: 1 h a mais por semana já conta.`;body.appendChild(nt)}
  if(!pad){const bt=el(`<div class="btns"></div>`);
    if(!(W&&W.ok)){const ok=el(`<button class="btn primary" type="button" id="wpOk">Confirmar a semana</button>`);ok.onclick=()=>wpConfirm(mon);bt.appendChild(ok)}
    if(W){const rs=el(`<button class="btn" type="button" id="wpReset">Voltar à semana padrão</button>`);rs.onclick=()=>wpReset(mon);bt.appendChild(rs)}
    if(bt.children.length)body.appendChild(bt);
    body.appendChild(el(`<p class="how hx">Contorno dourado = diferente da semana padrão. Semana que você não planejar segue a padrão.</p>`))}
  else{body.appendChild(segRow("Meta por semana","Quanto você quer estudar por semana (residência e faculdade juntas). Aparece aqui e em Estatísticas.",[[300,"5 h"],[420,"7 h"],[480,"8 h"],[540,"9 h"],[600,"10 h"],[720,"12 h"]],P.hgoal,v=>{ui.prefs.hgoal=v;saveUI();render()}));
    const L="DSTQQSS",r=el(`<div class="wkrow" id="wkCfg"><div class="wkl"><b>Simulados e provas</b><span class="how hx">Nesses dias o Início sugere um simulado ou uma prova na íntegra.</span></div><div class="wkdays" role="group" aria-label="Simulados e provas"></div></div>`),g=r.querySelector(".wkdays");
    for(let d=0;d<7;d++){const on=P.wsim.includes(d),b=el(`<button type="button" class="wkd wsim" aria-pressed="${on}"></button>`);b.id=`wk-wsim-${d}`;b.textContent=L[d];b.title=WD_FULL[d];b.disabled=P.wday[d]===0;
      b.onclick=()=>{const cur=new Set(ui.prefs.wsim);if(cur.has(d))cur.delete(d);else cur.add(d);ui.prefs.wsim=[...cur];saveUI();render()};g.appendChild(b)}
    body.appendChild(r)}
  return c}
/* resumo da semana que começa em ws (o que cumpriu, o que atrasou, onde melhorou): no cartão do Início e dentro do Planejar a semana */
function wpSumEl(ws){const A=weekStats(ws),B=weekStats(ws-7);if(!(A.fo||A.q||A.e||A.rv))return null;
  const ul=el(`<ul class="wpsum"></ul>`),g=(ui.prefs.hgoal||0)*60,add=(cls,t)=>{const li=el(`<li></li>`);li.className=cls;li.textContent=t;ul.appendChild(li)};
  const cmp=(a,b,f)=>b?(a>b?` (▲ ${f(a-b)} vs. anterior)`:a<b?` (▼ ${f(b-a)} vs. anterior)`:" (igual à anterior)"):"";
  add(g&&A.fo>=g?"ok":"",`Foco: ${fmtMin(A.fo)}${g?` de ${fmtMin(g)} da meta${A.fo>=g?" ✓":""}`:""}${cmp(A.fo,B.fo,fmtMin)}`);
  add("",`Questões: ${A.q}${A.q?` · ${pct(A.c,A.q)}% de acerto`:""}${cmp(A.q,B.q,String)} · temas estudados: ${A.e} · revisões: ${A.rv}`);
  const late=[...ALL,...FAC_ITEMS].filter(i=>{const d=dueIn(get(i.key));return d!==null&&d<0}).length;if(late)add("late",`Atrasou: ${late} ${late===1?"revisão de tema":"revisões de temas"} (as mais importantes vêm primeiro na fila).`);
  const best=heroFeats().find(f=>/subiu/.test(f));if(best)add("ok","Melhorou: "+best.replace(/^Seu acerto em /,""));return ul}
/* Início: cartão pequeno no domingo (próxima semana) e na segunda (esta), até confirmar ou dispensar */
function wpNoticeEl(){const t=dnum(today()),w=wdOf(t);if(w!==0&&w!==1)return null;const mon=w===0?t+1:t,W=wpPlanned(mon);if(W&&W.ok)return null;if(lsGet("resid-wpdis","")===fromNum(mon))return null;
  /* Lote 17: um cartão só no domingo/segunda — o resumo da semana (o que cumpriu, o que atrasou, onde melhorou) e, embaixo, planejar a próxima */
  const arr=wpArr(mon),tot=arr.reduce((a,m)=>a+m,0),n=el(`<section class="card iweek wpnotice" id="wpNotice" aria-labelledby="wpnh"><div class="dhead"><h2 id="wpnh"></h2></div><ul class="wpsum"></ul><p class="wpplan"><b></b> <span></span></p><div class="btns"><button class="btn primary" type="button" id="wpGo">Planejar a semana</button><button class="link" type="button">Agora não</button></div></section>`);
  n.querySelector("h2").textContent=w===0?"Sua semana":"Semana passada";
  {const ul=n.querySelector(".wpsum"),x=wpSumEl(mon-7);if(x)ul.replaceWith(x);else ul.remove()}
  n.querySelector(".wpplan b").textContent=w===0?"Planeje a próxima semana.":"Planeje esta semana.";
  n.querySelector(".wpplan span").textContent=`Pela sua semana padrão: ${hm(tot)}${ui.prefs.hgoal?` (meta ${hm(ui.prefs.hgoal)})`:""}. Leva 1 minuto e o plano de cada dia se ajusta ao tempo que você tem.`;
  const [go,no]=n.querySelectorAll("button");go.onclick=()=>{wpTab=w===0?"next":"cur";goSub("config");setTimeout(()=>{const b=$("#wpCard");if(b)b.scrollIntoView({block:"center",behavior:"smooth"})},80)};
  no.onclick=()=>{lsSet("resid-wpdis",fromNum(mon));render()};return n}
function segRow(lab,how,opts,cur,on){const g=el(`<div class="cfrow"><div class="cfl"><b></b><span class="gtext how"></span></div><div class="seg" role="group"></div></div>`);
  g.querySelector("b").textContent=lab;const h=g.querySelector(".how");if(how)h.textContent=how;else h.remove();g.querySelector(".seg").setAttribute("aria-label",lab);
  opts.forEach(([v,t])=>{const b=el(`<button type="button"></button>`);b.textContent=t;b.setAttribute("aria-pressed",cur===v);b.onclick=()=>on(v);g.querySelector(".seg").appendChild(b)});return g}
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

