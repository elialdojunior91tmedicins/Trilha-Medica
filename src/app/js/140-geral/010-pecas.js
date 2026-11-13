/* tooltip compartilhado */
const tip=document.createElement("div");tip.className="tip";tip.setAttribute("role","tooltip");tip.hidden=true;document.body.appendChild(tip);
function placeTip(e){const t=e.target.closest&&e.target.closest("[data-tip]");
  if(!t){tip.hidden=true;return}tip.textContent=t.dataset.tip;tip.hidden=false;
  const r=tip.getBoundingClientRect(),x=Math.min(Math.max(8,e.clientX-r.width/2),innerWidth-r.width-8),y=e.clientY-r.height-14;
  tip.style.left=x+"px";tip.style.top=(y<8?e.clientY+18:y)+"px"}
document.addEventListener("pointermove",e=>{if(e.pointerType==="mouse")placeTip(e)});
/* toque (tablet/celular): tocar no gráfico mostra o detalhe; tocar fora ou rolar esconde */
document.addEventListener("pointerdown",e=>{if(e.pointerType!=="mouse")placeTip(e)});
addEventListener("scroll",()=>{tip.hidden=true},{passive:true});
document.addEventListener("pointerleave",e=>{if(e.pointerType==="mouse")tip.hidden=true});

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

/* tela inteira também nos cartões (Anotações) e no simulado (Questões); cada um lembra a própria escolha */
const FULLK={cd:"resid-cdfull",sim:"resid-simfull",fo:"resid-fofull",ex:"resid-exfull",rd:"resid-rdfull"},fullOn={cd:false,sim:false,fo:false,ex:false,rd:false};
try{for(const k in FULLK)fullOn[k]=localStorage.getItem(FULLK[k])==="1"}catch(x){}
const twoCols=()=>{const R=document.documentElement.dataset;return R.cols==="2"&&(R.layout==="desktop"||R.layout==="tablet")};
function fullSet(k,v){fullOn[k]=v;try{localStorage.setItem(FULLK[k],v?"1":"0")}catch(x){}render();const h=$(k==="cd"?"#nch":k==="sim"?"#simh":k==="ex"?"#exh":k==="rd"?"#qrdh":"#foh");if(h)h.scrollIntoView({block:"start"})}
function fullBtn(k){const on=fullOn[k],b=el(`<button class="mini erfullb" type="button"></button>`);b.id=k+"FullB";b.textContent=on?"Sair da tela inteira":"⛶ Tela inteira";b.setAttribute("aria-pressed",on);
  b.title=on?"Volta a mostrar o resto da aba (Esc)":"Esconde o resto da aba e mostra só isto";b.onclick=()=>fullSet(k,!on);return b}
/* esconde tudo da aba menos o cartão (marca os irmãos de cada nível até a aba) */
function applyFull(){document.querySelectorAll(".fullhide,.fullpath,.vfull").forEach(x=>x.classList.remove("fullhide","fullpath","vfull"));
  document.querySelectorAll(".pfullc").forEach(x=>x.classList.remove("pfullc"));document.querySelectorAll(".pfbar").forEach(x=>x.remove());delete document.documentElement.dataset.pfull;
  const ph=isPhoneL();if(!twoCols()&&!ph)return;let v=null,card=null;
  if(view==="cartoes"&&cdRun&&fullOn.cd){v=$("#viewCards");card=v&&v.querySelector(".ncards")}
  else if(view==="quest"&&sim&&sim.status!=="error"&&fullOn.sim){v=$("#viewQuest");card=v&&v.querySelector(".qsim")}
  else if(view==="foco"&&foRun&&fullOn.fo){v=$("#viewFoco");card=v&&v.querySelector(".fotimer")}
  else if(view==="quest"&&exRun&&fullOn.ex){v=$("#viewQuest");card=v&&v.querySelector(".qexam")}
  else if(view==="quest"&&rdRun&&fullOn.rd){v=$("#viewQuest");card=v&&v.querySelector(".qredo")}
  if(!v||!card)return;
  /* celular (B3): o cartão ocupa a tela inteira, em pé ou deitado, com ≡ Menu e Sair no topo */
  if(ph){const k=view==="cartoes"?"cd":view==="foco"?"fo":card.classList.contains("qsim")?"sim":card.classList.contains("qexam")?"ex":"rd";card.classList.add("pfullc");document.documentElement.dataset.pfull=k;
    const h=card.querySelector("h2"),bar=el(`<div class="bkfbar pfbar"><button class="bkfb" type="button" id="pfMenu" aria-label="Abrir o menu do app"><span aria-hidden="true">≡</span> Menu</button><div class="bkft"><h2></h2></div><button class="bkfb" type="button" id="pfExit" aria-label="Sair da tela inteira">Sair <span aria-hidden="true">✕</span></button></div>`);
    bar.querySelector("h2").textContent=h?h.textContent:"";bar.querySelector("#pfMenu").onclick=()=>navMenuOpen();bar.querySelector("#pfExit").onclick=()=>fullSet(k,false);card.insertBefore(bar,card.firstChild);return}
  v.classList.add("vfull");let n=card;
  while(n&&n!==v){[...n.parentElement.children].forEach(x=>{if(x!==n)x.classList.add("fullhide")});if(n.parentElement!==v)n.parentElement.classList.add("fullpath");n=n.parentElement}}
document.addEventListener("keydown",ev=>{const t=ev.target;if(t&&/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)||ev.metaKey||ev.ctrlKey||ev.altKey)return;
  const b=sel=>{const x=$(sel);if(x&&!x.disabled&&x.offsetParent!==null){ev.preventDefault();x.click();return true}return false};
  if(view==="cartoes"&&cdRun){if(cdEd&&(ev.key===" "||ev.key==="Enter"||/^[1-4]$/.test(ev.key)))return;if(ev.key===" "||ev.key==="Enter"){if(b("#cdShow"))return}if(/^[1-4]$/.test(ev.key)){b("#cdR"+ev.key);return}
    if(ev.key==="Escape"&&fullOn.cd&&twoCols()){ev.preventDefault();fullSet("cd",false)}return}
  if(view==="foco"&&foRun){if(ev.key===" "){b("#foPauseB");return}if(ev.key==="d"||ev.key==="D"){b("#foDist");return}
    if(ev.key==="Escape"&&fullOn.fo&&twoCols()){ev.preventDefault();fullSet("fo",false)}return}
  if(view==="quest"&&sim&&sim.status==="run"){const L=ev.key.length===1?ev.key.toUpperCase():"";
    if(/^[A-E]$/.test(L)){const alt=[...document.querySelectorAll(".qsim .alt")].find(x=>!x.disabled&&(x.querySelector("b")||{}).textContent===L+")");if(alt){ev.preventDefault();alt.click()}return}
    if(ev.key===" "||ev.key==="Enter"){b("#simNext");return}
    if(ev.key==="Escape"&&fullOn.sim&&twoCols()){ev.preventDefault();fullSet("sim",false)}return}
  if(view==="quest"&&rdRun&&!sim){const L=ev.key.length===1?ev.key.toUpperCase():"";
    if(/^[A-E]$/.test(L)){const alt=[...document.querySelectorAll(".qredo .alt")].find(x=>!x.disabled&&(x.querySelector("b")||{}).textContent===L+")");if(alt){ev.preventDefault();alt.click()}return}
    if(ev.key===" "||ev.key==="Enter"){b("#rdNext");return}
    if(ev.key==="Escape"&&fullOn.rd&&twoCols()){ev.preventDefault();fullSet("rd",false)}}});
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

function segRow(lab,how,opts,cur,on){const g=el(`<div class="cfrow"><div class="cfl"><b></b><span class="gtext how"></span></div><div class="seg" role="group"></div></div>`);
  g.querySelector("b").textContent=lab;const h=g.querySelector(".how");if(how)h.textContent=how;else h.remove();g.querySelector(".seg").setAttribute("aria-label",lab);
  opts.forEach(([v,t])=>{const b=el(`<button type="button"></button>`);b.textContent=t;b.setAttribute("aria-pressed",cur===v);b.onclick=()=>on(v);g.querySelector(".seg").appendChild(b)});return g}
/* peças do cartão de busca e filtros (o mesmo visual em Residência, Questões, Erros e Anotações) */
const FC_ICO=`<svg class="tfsico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`;
function fcSel(id,lab,opts,val,on,dis){const l=el(`<label class="qfsel"><span></span><select></select></label>`);l.querySelector("span").textContent=lab;const x=l.querySelector("select");x.id=id;
  opts.forEach(([v,t])=>{const o=document.createElement("option");o.value=v;o.textContent=t;x.appendChild(o)});x.value=val;if(dis)x.disabled=true;else x.onchange=()=>{on(x.value);render()};return l}
function fcChip(t,on,fn,id,dot,tip,ds){const b=el(`<button class="chip tfchip" type="button" aria-pressed="${on}">${dot?`<i class="tfdot ${dot}" aria-hidden="true"></i>`:""}<span></span></button>`);b.querySelector("span").textContent=t;if(!on&&/·\s0$/.test(t))b.classList.add("z");if(id)b.id=id;if(tip)b.title=tip;if(ds)Object.assign(b.dataset,ds);b.onclick=()=>{fn();render()};return b}
/* Lote 20: período no padrão (7 · 30 · 90 dias · Tudo) em todo lugar; ids <pre>-<valor> */
const FC_PER=[["7","7 dias"],["15","15 dias"],["30","30 dias"],["60","60 dias"],["90","90 dias"],["all","Tudo"]];
function fcPer(pre,val,on,opts,lab){const g=el(`<div class="seg fcper" role="group"></div>`);g.setAttribute("aria-label",lab||"Período");(opts||FC_PER).forEach(([v,t])=>{const b=el(`<button type="button"></button>`);b.id=pre+"-"+v;b.textContent=t;b.setAttribute("aria-pressed",String(val)===String(v));b.onclick=()=>{on(v);render()};g.appendChild(b)});return g}
const FC_KEYS={tfPanel:"resid-tfpanel",qFPanel:"resid-qfpanel",eFPanel:"resid-efpanel",nFPanel:"resid-nfpanel"};
const isPhoneL=()=>document.documentElement.dataset.layout==="phone";
const fcSheet=()=>isPhoneL()&&!window.__noSheet;// testes antigos desligam a folha (window.__noSheet no mockdb.js)
function fcChips(L){const c=el(`<div class="chips"></div>`);L.forEach(x=>c.appendChild(x));return c}
/* Grande área e Especialidade com a contagem no nome; cnt(área,esp) */
function fcWhere(pre,area,sp,cnt,setA,setS){const r=el(`<div class="qfrow tfsels"></div>`),A=[...AREAS,FAC_AREA].filter(a=>a!==FAC_AREA||cnt("FAC","all"));
  r.appendChild(fcSel(pre+"Area","Grande área",[["all",`Todas as áreas (${cnt("all","all")})`],...A.map(a=>[a.code,`${a===FAC_AREA?"Faculdade (sem área)":a.name} (${cnt(a.code,"all")})`])],area,setA));
  if(area!=="all"){const AA=AREAS.find(a=>a.code===area)||FAC_AREA,names=[...new Set([...(AA.specs||[]).map(x=>x.name),...FAC_ITEMS.filter(i=>i.area===AA).map(i=>i.sp)])].filter(Boolean).filter(n=>cnt(area,n)||n===sp);
    r.appendChild(fcSel(pre+"Sp","Especialidade",[["all","Todas"],...names.map(n=>[n,`${n} (${cnt(area,n)})`])],sp,setS))}
  else r.appendChild(fcSel(pre+"Sp","Especialidade",[["all","Escolha a área antes"]],"all",null,true));
  return r}
const fcAreaName=c=>{const A=AREAS.find(a=>a.code===c);return A?A.name:"Faculdade (sem área)"};
/* o.tog = id do botão Filtros; o.open/o.onToggle; o.sort=[id,opts,val,on]; o.act=[[rótulo,tirar]]; o.onClear/o.clearId; o.groups=[[título,dica,nó]];
   o.foot = texto do rodapé; o.links = nós extras do rodapé; o.panelId; o.onDone = "Ver resultados" (só celular) */
function fcBody(box,o){box.innerHTML="";
  const bar=el(`<div class="tfbar"><button class="tftog" type="button" aria-expanded="${!!o.open}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4"/></svg><span>Filtros</span></button></div>`),tg=bar.querySelector(".tftog");tg.id=o.tog;
  if(o.panelId)tg.setAttribute("aria-controls",o.panelId);if(o.act.length)tg.appendChild(el(`<b class="tfn">${o.act.length}</b>`));tg.onclick=()=>{o.onToggle();/* Lote 20: no celular o painel é uma folha por cima da tela e não fica lembrado aberto */if(fcSheet()&&FC_KEYS[o.panelId])lsSet(FC_KEYS[o.panelId],null);render()};
  if(o.sort){const [id,opts,val,on]=o.sort,l=el(`<label class="tfsort"><span>Ordem</span><select></select></label>`),x=l.querySelector("select");x.id=id;
    opts.forEach(([v,t])=>{const op=document.createElement("option");op.value=v;op.textContent=t;x.appendChild(op)});x.value=val;x.onchange=()=>{on(x.value);render()};bar.appendChild(l)}
  box.appendChild(bar);
  if(o.act.length){const w=el(`<div class="tfact" aria-label="Filtros ativos"></div>`);o.act.forEach(([t,fn])=>{const b=el(`<button class="tfpill" type="button"><span></span><b aria-hidden="true">×</b></button>`);b.querySelector("span").textContent=t;b.setAttribute("aria-label","Tirar o filtro "+t);b.onclick=()=>{fn();render()};w.appendChild(b)});
    const c=el(`<button class="link" type="button">Limpar tudo</button>`);if(!(o.open&&fcSheet()))c.id=o.clearId;c.onclick=()=>{o.onClear();render()};w.appendChild(c);box.appendChild(w)}
  /* Lote 20: no celular o painel abre por baixo (folha), com fundo escurecido; toque fora fecha */
  if(o.open){const sh=fcSheet(),pn=el(`<div class="tfpanel${sh?" tfsheet":""}"></div>`);if(o.panelId)pn.id=o.panelId;
    if(sh){const bk=el(`<div class="tfback" aria-hidden="true"></div>`);bk.onclick=()=>{o.onToggle();render()};box.appendChild(bk);
      const hd=el(`<div class="tfsh"><span class="tfsgrab" aria-hidden="true"></span><b>Filtros</b><span class="sp"></span><button class="tfsx" type="button" aria-label="Fechar os filtros">×</button></div>`);
      if(o.act.length){const cl=el(`<button class="link" type="button">Limpar tudo</button>`);cl.id=o.clearId;cl.onclick=()=>{o.onClear();render()};hd.insertBefore(cl,hd.querySelector(".tfsx"))}
      hd.querySelector(".tfsx").onclick=()=>{o.onToggle();render()};pn.appendChild(hd)}
    o.groups.forEach(([lab,hint,body])=>{if(!body)return;const g=el(`<div class="tfgrp"><div class="tfgh"><span class="glabel"></span><span class="tfhint"></span></div></div>`);g.querySelector(".glabel").textContent=lab;g.querySelector(".tfhint").textContent=hint||"";g.appendChild(body);pn.appendChild(g)});
    if(o.onDone||sh){const d=el(`<button class="btn primary tfdone" type="button"></button>`);d.textContent=o.foot&&/\d/.test(o.foot)?`Ver ${o.foot.replace(/ encontrad[oa]s?$/,"")}`:"Ver resultados";d.onclick=o.onDone||(()=>{o.onToggle();render()});pn.appendChild(d)}
    box.appendChild(pn)}
  if(!o.foot&&!o.footId&&!(o.links||[]).some(Boolean))return;
  const ft=el(`<p class="tfres"><span></span></p>`);ft.querySelector("span").textContent=o.foot||"";if(o.footId)ft.querySelector("span").id=o.footId;(o.links||[]).forEach(x=>x&&ft.appendChild(x));box.appendChild(ft)}
