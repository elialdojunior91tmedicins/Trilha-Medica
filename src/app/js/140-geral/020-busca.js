/* ----- 3. busca em tudo ----- */
let gsQ="",gsOpen=false,gsType="";
function gsSnip(t,n){const T=String(t||"").replace(/^\s*(#{1,6}\s+|[-*>]\s+|\d+\.\s+)/gm,"").replace(/==|\*\*|`/g,"").replace(/\s+/g," "),N=norm(T),i=N.indexOf(n);if(i<0)return T.slice(0,110);const a=Math.max(0,i-40);return (a?"…":"")+T.slice(a,a+120)+(T.length>a+120?"…":"")}
function gsResults(q){const n=norm(q.trim());if(n.length<2)return [];const R=[],add=(g,t,s,go)=>R.push({g,t,s,go});
  [...ALL,...FAC_ITEMS].forEach(it=>{const subs=subList(it).map(x=>x.t).join(" · ");if(norm(it.t).includes(n)||norm(subs).includes(n))add("Temas",it.t,norm(it.t).includes(n)?`${it.own?"FAC":it.area.code} · ${it.sp||it.area.name}`:gsSnip(subs,n),()=>openTopic(it.key))});
  Object.keys(notes).forEach(k=>{if(BYKEY[k]&&norm(notes[k]).includes(n))add("Anotações",BYKEY[k].t,gsSnip(notes[k],n),()=>{detTab[k]="notas";openTopic(k)})});
  freeN.forEach(f=>{if(norm(f.t+" "+f.b+" "+f.tags.join(" ")).includes(n))add("Caderno livre",f.t||"Sem título",gsSnip(f.b,n),()=>{freeOpen.add(f.id);backStack=[];setView("notas");if(typeof setNSeg==="function")setNSeg("todas");setTimeout(()=>{const x=document.getElementById("fr-"+f.id);if(x)x.scrollIntoView({block:"center"})},80)})});
  errors.forEach(e=>{if(BYKEY[e.k]&&norm(e.w+" "+e.r+" "+(e.s||"")).includes(n))add("Erros",BYKEY[e.k].t,gsSnip(e.w+" → "+e.r,n),()=>{eGoTopic(e.k);if(e.arch)eFlags.add("arch");backStack=[];setView("erros")})});
  cards.forEach(x=>{if(BYKEY[x.k]&&norm(cdTxt(x.q)+" "+cdTxt(x.a)).includes(n))add("Cartões",cdTxt(x.q).slice(0,90),BYKEY[x.k].t,()=>cdOpen("todos",{pick:x.id}))});
  fac.discs.forEach(d=>{if(norm(d.name).includes(n))add("Faculdade",d.name,"disciplina",()=>goDisc(d));
    (d.sps||[]).forEach(s=>{if(norm(s.name+" "+s.objs.join(" ")).includes(n))add("Faculdade",s.name,d.name,()=>{facOpenSem.add(d.semId);facOpenDisc.add(d.id);facOpenSP.add(s.id);backStack=[];setView("fac");setTimeout(()=>scrollToId("sp-"+s.id),60)})});
    [d,...(d.sps||[])].forEach(o=>(o.links||[]).forEach(l=>{if(norm((l.t||"")+" "+l.u).includes(n))add("Materiais",l.t||hostOf(l.u),`${d.name} · ${hostOf(l.u)}`,()=>window.open(l.u,"_blank","noopener"))}))});
  return R}
function renderGSearch(){let ov=$("#gsearch");if(!gsOpen){if(ov)ov.remove();return}
  if(!ov){ov=el(`<div class="gsearch" id="gsearch" role="dialog" aria-modal="true" aria-label="Buscar em tudo"><div class="gsbox"><div class="gshead"><input class="search" id="gsq" type="search" placeholder="Buscar em temas, anotações, erros, cartões, faculdade…" autocomplete="off"><button class="link" type="button">Fechar</button></div><div class="gsres" id="gsres"></div></div></div>`);
    document.body.appendChild(ov);const i=ov.querySelector("#gsq");i.value=gsQ;i.oninput=debounced(()=>{gsQ=i.value;fillGS()},120);ov.querySelector(".gshead .link").onclick=gsClose;
    ov.addEventListener("click",e=>{if(e.target===ov)gsClose()});setTimeout(()=>i.focus(),30)}
  fillGS()}
function fillGS(){const box=$("#gsres");if(!box)return;box.innerHTML="";const R=gsResults(gsQ);
  if(norm(gsQ.trim()).length<2){box.appendChild(el(`<p class="how">Digite pelo menos 2 letras. A busca olha temas e subtópicos, anotações, caderno livre, erros, cartões, disciplinas, SPs e materiais.</p>`));return}
  if(!R.length){box.appendChild(el(`<p class="cempty">Nada encontrado com “${esc(gsQ.trim())}”.</p>`));return}
  const groups={};R.forEach(r=>(groups[r.g]=groups[r.g]||[]).push(r));
  /* Lote 20: etiquetas por tipo com a contagem; tocar de novo volta a mostrar tudo */
  if(!groups[gsType])gsType="";const G=Object.keys(groups);
  if(G.length>1){const ch=el(`<div class="chips gstypes" role="group" aria-label="Tipo de resultado"></div>`);
    [["","Tudo",R.length],...G.map(g=>[g,g,groups[g].length])].forEach(([v,l,n],i)=>{const b=el(`<button class="chip" type="button"></button>`);b.id="gsT-"+i;b.textContent=`${l} · ${n}`;b.setAttribute("aria-pressed",gsType===v);
      b.onclick=()=>{gsType=gsType===v?"":v;fillGS()};ch.appendChild(b)});box.appendChild(ch)}
  Object.entries(groups).filter(([g])=>!gsType||g===gsType).forEach(([g,L])=>{const LIM=gsType?40:8;const s=el(`<div class="gsg"><span class="glabel"></span><ul></ul></div>`);s.querySelector(".glabel").textContent=`${g} · ${L.length}`;
    L.slice(0,LIM).forEach(r=>{const li=el(`<li><button type="button"><b></b><span></span></button></li>`);li.querySelector("b").textContent=r.t;li.querySelector("span").textContent=r.s;li.querySelector("button").onclick=()=>{gsClose();r.go()};s.querySelector("ul").appendChild(li)});
    if(L.length>LIM)s.appendChild(el(`<p class="how">+ ${L.length-LIM} resultados. ${gsType?"Refine a busca.":"Toque no tipo acima para ver todos."}</p>`));box.appendChild(s)})}
function gsClose(){gsOpen=false;renderGSearch()}
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&gsOpen){gsClose();return}
  if((e.key==="k"&&(e.ctrlKey||e.metaKey))||(e.key==="/"&&!/^(INPUT|TEXTAREA|SELECT)$/.test((e.target||{}).tagName||""))){e.preventDefault();gsOpen=true;renderGSearch()}});
/* ----- 2. primeiros passos ----- */
let onb=null;
function needOnb(){return !!window.claude&&synced&&!ui.prefs.onb&&!hasData()&&!fac.sems.length&&!foSess.length}
function renderOnb(){let ov=$("#onb");if(!onb){if(ov)ov.remove();return}
  if(!ov){ov=el(`<div class="gsearch onbov" id="onb" role="dialog" aria-modal="true" aria-labelledby="onbh"><div class="gsbox onbbox"></div></div>`);document.body.appendChild(ov)}
  const b=ov.querySelector(".onbbox");b.innerHTML="";const O=onb,dots=el(`<p class="onbdots"></p>`);for(let i=0;i<3;i++)dots.appendChild(el(`<i class="${i<=O.step?"on":""}"></i>`));b.appendChild(dots);
  const fin=(go)=>{ui.prefs.onb=1;if(O.date){ui.profile.exams=[{id:"ex"+Date.now().toString(36),name:"Prova de residência",date:O.date}];ui.profile.mainEx=ui.profile.exams[0].id}ui.prefs.hgoal=O.fgoal;ui.prefs.planN=O.planN;saveUI();applyUI();onb=null;renderOnb();
    if(go==="bulk"){backStack=[];setView("temas");setTSeg("lista");bulk={sel:new Set(),lv:1};bulkUndo=null;tf.lv=new Set([0,"i"]);openKey=null;render()}else{redoPlan();render()}};
  const skip=el(`<button class="link onbskip" type="button">Pular</button>`);skip.onclick=()=>{ui.prefs.onb=1;saveUI();onb=null;renderOnb()};
  if(O.step===0){b.append(el(`<h2 id="onbh">Bem-vindo ao Nexus</h2>`),el(`<p class="gtext">Três perguntas rápidas para o app montar o seu plano. Dá para mudar tudo depois em Perfil e Configurações.</p>`),
      el(`<label class="qfsel onbf"><span>Quando é a sua prova de residência?</span><input type="date" class="etext" id="onbDate"></label>`));
    const i=b.querySelector("#onbDate");i.value=O.date||"";i.min=today();i.oninput=()=>O.date=i.value;
    const a=el(`<div class="btns"><button class="btn primary" type="button">Continuar</button><button class="btn" type="button">Ainda não sei</button></div>`),[c1,c2]=a.querySelectorAll("button");
    c1.onclick=()=>{if(O.date&&!/^\d{4}-\d{2}-\d{2}$/.test(O.date))return;O.step=1;renderOnb()};c2.onclick=()=>{O.date="";O.step=1;renderOnb()};b.append(a,skip)}
  else if(O.step===1){b.append(el(`<h2 id="onbh">Você já estudou para a residência?</h2>`),el(`<p class="gtext">Se já estudou alguns temas, marque quais: eles entram nas revisões em vez de aparecerem como novos.</p>`));
    const a=el(`<div class="onbopts"><button class="btn" type="button">Estou começando agora</button><button class="btn" type="button">Já estudei alguns temas</button></div>`),[x,y]=a.querySelectorAll("button");
    x.onclick=()=>{O.prev=false;O.step=2;renderOnb()};y.onclick=()=>{O.prev=true;O.step=2;renderOnb()};b.append(a,skip)}
  else{b.append(el(`<h2 id="onbh">Quanto tempo por semana?</h2>`),el(`<p class="gtext">A meta da semana aparece no Início, no Foco e nas Estatísticas (a do dia é ela dividida pelos dias de estudo). Os temas por dia definem o tamanho do plano.</p>`));
    const g=el(`<div class="onbgrid"><label class="qfsel"><span>Meta por semana</span><select id="onbF"></select></label><label class="qfsel"><span>Temas novos por dia</span><select id="onbN"></select></label></div>`);
    const sf=g.querySelector("#onbF"),sn=g.querySelector("#onbN");[[300,"5 h"],[420,"7 h"],[600,"10 h"],[720,"12 h"],[900,"15 h"],[1200,"20 h"]].forEach(([v,t])=>{const o=document.createElement("option");o.value=v;o.textContent=t;sf.appendChild(o)});
    [2,3,4,5].forEach(v=>{const o=document.createElement("option");o.value=v;o.textContent=`${v} temas${v===3?" (sugerido)":""}`;sn.appendChild(o)});sf.value=String(O.fgoal);sn.value=String(O.planN);sf.onchange=()=>O.fgoal=+sf.value;sn.onchange=()=>O.planN=+sn.value;b.appendChild(g);
    const a=el(`<div class="btns"><button class="btn primary" type="button" id="onbFin"></button><button class="btn" type="button">Voltar</button></div>`),[f,bk]=a.querySelectorAll("button");f.textContent=O.prev?"Concluir e marcar o que já estudei":"Concluir";f.onclick=()=>fin(O.prev?"bulk":"");bk.onclick=()=>{O.step=1;renderOnb()};b.append(a,skip)}}
let onbTried=false;const ONB_SEEN0=lsGet("resid-onb-seen","")==="1";
function maybeOnb(){if(onbTried||onb||!synced)return;onbTried=true;if(needOnb()&&!ONB_SEEN0){lsSet("resid-onb-seen","1");onb={step:0,date:"",prev:false,fgoal:ui.prefs.hgoal||600,planN:ui.prefs.planN||3};renderOnb()}}
/* ----- 5. calendário (.ics) ----- */
function icsEsc(s){return String(s).replace(/\\/g,"\\\\").replace(/;/g,"\\;").replace(/,/g,"\\,").replace(/\n/g,"\\n")}
function icsBuild(){const ev=[],stamp=new Date().toISOString().replace(/[-:]/g,"").replace(/\.\d+Z$/,"Z");
  upcomingProvas().forEach(p=>{const d=discOf(p.discId);ev.push({uid:"prova-"+p.id,date:p.date,t:`Prova: ${p.name}`,desc:`${d?provaDiscName(p)+". ":""}Nexus - Trilha Médica`})});
  spFechas(365).forEach(f=>ev.push({uid:"sp-"+f.s.id,date:f.s.fech,t:`Fechamento: ${f.s.name}`,desc:`${f.d.name}. Nexus - Trilha Médica`}));
  exList().forEach(x=>{if(x.date&&x.date>=today())ev.push({uid:"residencia-"+x.id,date:x.date,t:`Prova de residência: ${x.name||"sem nome"}`,desc:"Nexus - Trilha Médica"})});
  const L=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Nexus Trilha Medica//PT-BR","CALSCALE:GREGORIAN","METHOD:PUBLISH","X-WR-CALNAME:Nexus - Trilha Médica"];
  ev.forEach(e=>{const d=e.date.replace(/-/g,""),d2=fromNum(dnum(e.date)+1).replace(/-/g,"");L.push("BEGIN:VEVENT",`UID:${e.uid}@trilha-medica`,`DTSTAMP:${stamp}`,`DTSTART;VALUE=DATE:${d}`,`DTEND;VALUE=DATE:${d2}`,`SUMMARY:${icsEsc(e.t)}`,`DESCRIPTION:${icsEsc(e.desc)}`,
    "BEGIN:VALARM","ACTION:DISPLAY",`DESCRIPTION:${icsEsc(e.t)}`,"TRIGGER:-P1D","END:VALARM","END:VEVENT")});L.push("END:VCALENDAR");return {text:L.join("\r\n"),n:ev.length}}
let icsMsg="";
async function icsSave(){if(!downloadsFn)return;const r=icsBuild();if(!r.n){icsMsg="Nenhuma prova ou fechamento futuro para exportar.";render();return}
  try{await downloadsFn.save({filename:"trilha-medica-provas.ics",data:new Blob([r.text],{type:"text/calendar"})});icsMsg=`Arquivo com ${r.n} ${r.n===1?"data":"datas"} salvo. Abra-o para adicionar ao Google Agenda ou ao Calendário (lembrete 1 dia antes).`}
  catch(e){icsMsg=e&&(e.code==="declined"||e.code==="cancelled")?"Download cancelado.":"Não foi possível gerar o arquivo agora."}render()}
/* ----- 14. ajuda: abrir uma seção ----- */
function goHelp(title){helpQ="";const i=$("#hq");if(i)i.value="";goSub("help");setTimeout(()=>{const idx=HELP.findIndex(h=>h[0]===title);const d=document.querySelector(`#helpList details[data-i="${idx}"]`);if(d){d.open=true;d.scrollIntoView({block:"start"})}},40)}
function helpBtn(title){const b=el(`<button class="hlpb" type="button" aria-label="Ajuda">?</button>`);b.title="Como funciona";b.dataset.help=title;b.onclick=e=>{e.stopPropagation();goHelp(title)};return b}

let helpQ="";
function renderHelp(){const box=$("#helpList");const q=helpQ?norm(helpQ):"";const prev=new Set([...box.querySelectorAll("details[open]")].map(d=>d.dataset.i));box.innerHTML="";let n=0;
  HELP.forEach(([t,body],i)=>{if(q&&!norm(t+" "+body).includes(q))return;n++;
    const d=el(`<details class="hsec" data-i="${i}"${q||prev.has(String(i))?" open":""}><summary></summary><div class="mdview"></div></details>`);
    d.querySelector("summary").textContent=t;d.querySelector(".mdview").innerHTML=md(body);box.appendChild(d)});
  if(!n)box.appendChild(el(`<p class="hempty">Nada encontrado. Tente outra palavra, como "prova", "revisão" ou "senha".</p>`))}
