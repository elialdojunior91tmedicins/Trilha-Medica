/* ===== Lote 18 › Faculdade: grade fixa (aulas), entregas, calendário do semestre, preparo da aula, depois da SP, objetivos por foto, peso na residência =====
   fac.aulas=[{id,semId,wd(0=domingo),ini,fim,t,discId?}] · fac.canc={"AAAA-MM-DD":[id da aula]} (cancelada naquele dia) · fac.ents=[{id,discId,t,date|adi,done?}]
   prova adiada p.adi=1 e fechamento adiado s.fadi=1 (sem data valendo: saem do plano até ganhar data nova) · s.pos = fechamento já "dispensado" no aviso pós-SP */
const HM_RE=/^([01]\d|2[0-3]):[0-5]\d$/,hmMin=t=>+t.slice(0,2)*60+ +t.slice(3),hm2=t=>t.slice(3)==="00"?String(+t.slice(0,2))+"h":String(+t.slice(0,2))+"h"+t.slice(3);
const aulaOk=a=>!!(a&&typeof a==="object"&&typeof a.id==="string"&&typeof a.semId==="string"&&Number.isInteger(a.wd)&&a.wd>=0&&a.wd<=6&&HM_RE.test(a.ini||"")&&HM_RE.test(a.fim||"")&&hmMin(a.fim)>hmMin(a.ini));
const entOk=e=>!!(e&&typeof e==="object"&&typeof e.id==="string"&&typeof e.discId==="string"&&typeof e.t==="string"&&e.t.trim()&&(e.adi||DATE_RE.test(e.date||"")));
function facXNorm(){
  if(Array.isArray(fac.aulas)){fac.aulas=fac.aulas.filter(aulaOk).map(a=>({id:a.id,semId:a.semId,wd:a.wd,ini:a.ini,fim:a.fim,t:String(a.t||"Aula").slice(0,40),...(typeof a.discId==="string"&&a.discId?{discId:a.discId}:{})}));if(!fac.aulas.length)delete fac.aulas}else delete fac.aulas;
  if(Array.isArray(fac.ents)){fac.ents=fac.ents.filter(entOk).map(e=>({id:e.id,discId:e.discId,t:e.t.trim().slice(0,80),...(e.adi?{adi:1}:{date:e.date}),...(e.done?{done:1}:{})}));if(!fac.ents.length)delete fac.ents}else delete fac.ents;
  if(fac.canc&&typeof fac.canc==="object"&&!Array.isArray(fac.canc)){const lim=fromNum(dnum(today())-30),o={};for(const d in fac.canc)if(DATE_RE.test(d)&&d>=lim&&Array.isArray(fac.canc[d])){const a=[...new Set(fac.canc[d].filter(x=>typeof x==="string"))];if(a.length)o[d]=a}
    if(Object.keys(o).length)fac.canc=o;else delete fac.canc}else delete fac.canc}
function facXCopy(src,dst){if(!src)return;if(Array.isArray(src.aulas)&&src.aulas.length)dst.aulas=src.aulas;if(Array.isArray(src.ents)&&src.ents.length)dst.ents=src.ents;if(src.canc&&typeof src.canc==="object"&&Object.keys(src.canc).length)dst.canc=src.canc}
/* aulas que valem no dia n (semestres ativos, sem as canceladas naquele dia) */
function aulasOn(n){try{const d=fromNum(n),c=new Set((fac.canc||{})[d]||[]),act=new Set(activeSems());return (fac.aulas||[]).filter(a=>act.has(a.semId)&&a.wd===wdOf(n)&&!c.has(a.id)).sort((a,b)=>a.ini<b.ini?-1:1)}catch(e){return []}}
function gradeAdj(m,n){if(!(m>30))return m;const mins=aulasOn(n).reduce((t,a)=>t+hmMin(a.fim)-hmMin(a.ini),0),st=Math.floor(mins/120);if(!st)return m;let i=WP_MIN.indexOf(m);if(i<0)i=WP_MIN.length-1;return WP_MIN[Math.max(1,i-st)]}
const WD_SHORT=["dom","seg","ter","qua","qui","sex","sáb"];
/* o que acontece no semestre, com data ou adiado */
function semEvents(sem){const ds=semDiscs(sem.id),ids=new Set(ds.map(d=>d.id)),E=[];
  semProvas(sem).forEach(p=>E.push({k:"p",id:p.id,t:p.name,sub:provaDiscName(p),date:p.adi?null:p.date,o:p}));
  ds.forEach(d=>(d.sps||[]).forEach(x=>{if(x.fech||x.fadi)E.push({k:"f",id:x.id,t:spShort(x.name),sub:d.name,date:x.fadi?null:x.fech,o:x,d})}));
  (fac.ents||[]).filter(e=>ids.has(e.discId)).forEach(e=>E.push({k:"e",id:e.id,t:e.t,sub:(discOf(e.discId)||{}).name||"",date:e.adi?null:e.date,o:e}));return E}
const CAL_K={p:"Prova",f:"Fechamento",e:"Entrega"};
let calEd=null,calAdd=null;// evento aberto para editar ({k,id}); formulário aberto ("ent"|"aula") de um semestre
function calSetDate(ev,v){const near=x=>x&&daysTo(x)>=0&&daysTo(x)<=FAC_WIN;const was=ev.k==="p"?!ev.o.adi&&ev.o.date:ev.k==="f"?!ev.o.fadi&&ev.o.fech:null;
  if(ev.k==="p"){if(v){ev.o.date=v;delete ev.o.adi}else ev.o.adi=1}
  else if(ev.k==="f"){if(v){ev.o.fech=v;delete ev.o.fadi}else ev.o.fadi=1}
  else{if(v){ev.o.date=v;delete ev.o.adi}else{ev.o.adi=1;delete ev.o.date}}
  calEd=null;saveFac();
  if(ev.k!=="e"&&(near(was)||near(v)))redoPlan(v?`Plano de hoje atualizado: ${CAL_K[ev.k].toLowerCase()} “${ev.t}” agora em ${br(v)}. O que você já tinha começado foi mantido.`:`“${ev.t}” marcada como adiada: saiu do plano até ganhar data nova.`);else render()}
function calEventBtn(ev,sem){const b=el(`<button type="button" class="fce k-${ev.k}"></button>`),on=calEd&&calEd.id===ev.id;b.id=`fce-${ev.k}-${ev.id}`;b.setAttribute("aria-expanded",on);
  b.innerHTML=`<b></b><span></span>`;b.querySelector("b").textContent=`${CAL_K[ev.k]}${ev.date?" · "+WD_SHORT[wdOf(dnum(ev.date))]+" "+ddmm(dnum(ev.date)):" · adiada"}`;b.querySelector("span").textContent=ev.t+(ev.sub?" · "+ev.sub:"");
  if(ev.k==="e"&&ev.o.done)b.classList.add("done");b.onclick=()=>{calEd=on?null:{id:ev.id};render()};return b}
function calEditEl(ev){const w=el(`<div class="fcaled"><label class="ffield"><span>Data</span><input type="date" class="etext"></label><div class="btns"></div></div>`),i=w.querySelector("input");i.id="fced-"+ev.id;i.value=ev.date||"";
  const a=w.querySelector(".btns"),bt=(t,fn,cls)=>{const b=el(`<button type="button"></button>`);b.className=cls||"btn";b.textContent=t;b.onclick=fn;a.appendChild(b);return b};
  bt("Salvar a data",()=>{if(DATE_RE.test(i.value))calSetDate(ev,i.value)},"btn primary").id="fcedOk-"+ev.id;
  if(ev.date)bt(ev.k==="p"?"Adiada, sem data nova":"Adiado, sem data nova",()=>calSetDate(ev,null)).id="fcedAdi-"+ev.id;
  if(ev.k==="e"){bt(ev.o.done?"Ainda não entreguei":"Já entreguei",()=>{if(ev.o.done)delete ev.o.done;else ev.o.done=1;calEd=null;saveFac();render()}).id="fcedDone-"+ev.id;
    bt("Excluir",()=>{fac.ents=(fac.ents||[]).filter(x=>x!==ev.o);calEd=null;saveFac();render()},"link")}
  else bt(ev.k==="p"?"Abrir a prova":"Abrir a SP",()=>{calEd=null;if(ev.k==="p")goProva(ev.o);else{facOpenSem.add(ev.d.semId);facOpenDisc.add(ev.d.id);facOpenSP.add(ev.o.id);render();scrollToId("sp-"+ev.o.id)}},"link");
  w.appendChild(el(`<p class="how hx">Mudou a data? O plano se reorganiza sozinho. Sem data nova ainda? Marque como adiada: sai do plano até você pôr a data.</p>`));return w}
/* calendário do semestre: da semana atual até o último evento (mín. 8, máx. 26 semanas); semana pesada = prova + outra coisa, ou 3+ itens */
function semCalEl(sem){if(sem.archived)return null;const E=semEvents(sem),t=dnum(today()),m0=wpMon(t),dated=E.filter(e=>e.date&&dnum(e.date)>=m0),later=E.filter(e=>!e.date),ds=semDiscs(sem.id);
  const last=dated.reduce((a,e)=>Math.max(a,dnum(e.date)),m0),nw=Math.min(26,Math.max(8,Math.floor((last-m0)/7)+1));
  const aulas=(fac.aulas||[]).filter(a=>a.semId===sem.id).sort((a,b)=>(a.wd+6)%7-(b.wd+6)%7||(a.ini<b.ini?-1:1));
  const heavyN=[...Array(nw)].map((_,i)=>dated.filter(e=>{const n=dnum(e.date);return n>=m0+7*i&&n<m0+7*i+7})).filter(L=>L.some(e=>e.k==="p")&&L.length>=2||L.length>=3).length;
  const w=el(`<details class="fscal" id="fcal-${sem.id}"><summary><span class="fcalh">Calendário do semestre</span><span class="fcalc"></span></summary><div class="fcalb"></div></details>`);
  w.open=facCalOpen.has(sem.id);w.addEventListener("toggle",()=>{w.open?facCalOpen.add(sem.id):facCalOpen.delete(sem.id)});
  w.querySelector(".fcalc").textContent=[dated.length?`${dated.length} ${dated.length===1?"data":"datas"}`:"",heavyN?`${heavyN} ${heavyN===1?"semana pesada":"semanas pesadas"}`:"",aulas.length?`${aulas.length} ${aulas.length===1?"aula fixa":"aulas fixas"}`:""].filter(Boolean).join(" · ")||"vazio";
  const b=w.querySelector(".fcalb");
  /* grade fixa */
  {const g=el(`<div class="fgrade" id="fgr-${sem.id}"><span class="glabel">Toda semana</span><ul class="fgl"></ul></div>`),ul=g.querySelector("ul");
    if(!aulas.length)ul.appendChild(el(`<li class="how">Nenhuma aula fixa. Cadastre as que se repetem toda semana (ex.: tutoria na quinta à tarde): nesses dias o Planejar a semana já vem com menos tempo de estudo, e na véspera o plano lembra de revisar os objetivos da SP.</li>`));
    aulas.forEach(a=>{const li=el(`<li><span class="fgd"></span><span class="fgt"></span><button class="link" type="button">cancelar um dia</button><button class="link" type="button">remover</button></li>`);
      li.querySelector(".fgd").textContent=`${WD_FULL[a.wd][0].toUpperCase()+WD_FULL[a.wd].slice(1)} · ${hm2(a.ini)}–${hm2(a.fim)}`;{const dn=a.discId&&discOf(a.discId)?discOf(a.discId).name:"";li.querySelector(".fgt").textContent=a.t+(dn&&norm(dn)!==norm(a.t)?` · ${dn}`:"")}
      const [cb,rb]=li.querySelectorAll("button");cb.id="fgc-"+a.id;cb.setAttribute("aria-expanded",calEd&&calEd.aula===a.id);cb.onclick=()=>{calEd=calEd&&calEd.aula===a.id?null:{aula:a.id};render()};
      rb.onclick=()=>{fac.aulas=fac.aulas.filter(x=>x!==a);saveFac();redoPlan("Aula fixa removida: o tempo de estudo do dia voltou ao da sua semana.")};
      ul.appendChild(li);
      if(calEd&&calEd.aula===a.id){const c=el(`<li class="fgcanc"><span class="how hx">Imprevisto? Marque o dia em que a aula não vai acontecer: o tempo volta para o plano desse dia, sem mexer na grade.</span><div class="fgdays"></div></li>`),dd=c.querySelector(".fgdays");
        for(let n=t,k=0;k<4&&n<t+35;n++){if(wdOf(n)!==a.wd)continue;k++;const d=fromNum(n),on=((fac.canc||{})[d]||[]).includes(a.id),x=el(`<button type="button" class="wpo"></button>`);x.id=`fgx-${a.id}-${d}`;x.setAttribute("aria-pressed",on);x.textContent=`${on?"✕ ":""}${WD_SHORT[a.wd]} ${ddmm(n)}`;
          x.onclick=()=>{const C={...(fac.canc||{})},L=new Set(C[d]||[]);on?L.delete(a.id):L.add(a.id);if(L.size)C[d]=[...L];else delete C[d];fac.canc=C;saveFac();if(n===t)redoPlan(on?"A aula de hoje voltou: o tempo de estudo foi ajustado.":"Aula de hoje cancelada: o tempo voltou para o plano.");else render()};dd.appendChild(x)}
        ul.appendChild(c)}});
    b.appendChild(g)}
  /* semanas */
  const ol=el(`<ol class="fcalw"></ol>`);
  for(let i=0;i<nw;i++){const a=m0+7*i,L=dated.filter(e=>{const n=dnum(e.date);return n>=a&&n<a+7}).sort((x,y)=>x.date<y.date?-1:1),heavy=L.some(e=>e.k==="p")&&L.length>=2||L.length>=3;
    const li=el(`<li class="fcw${heavy?" heavy":""}${i===0?" now":""}${L.length?"":" free"}"><span class="fcwd"><b></b><small></small></span><div class="fcwe"></div></li>`);
    li.querySelector("b").textContent=`${ddmm(a)}–${ddmm(a+6)}`;li.querySelector("small").textContent=i===0?"esta semana":heavy?"semana pesada":i===1?"próxima":"";
    const ev=li.querySelector(".fcwe");if(!L.length)ev.appendChild(el(`<span class="how">livre</span>`));L.forEach(e=>ev.appendChild(calEventBtn(e,sem)));ol.appendChild(li);
    L.filter(e=>calEd&&calEd.id===e.id).forEach(e=>{const x=el(`<li class="fcwed"></li>`);x.appendChild(calEditEl(e));ol.appendChild(x)})}
  b.appendChild(ol);
  if(later.length){const g=el(`<div class="fcallater"><span class="glabel">Adiados, sem data nova</span><div class="fcwe"></div></div>`);later.forEach(e=>{g.querySelector(".fcwe").appendChild(calEventBtn(e,sem));if(calEd&&calEd.id===e.id)g.appendChild(calEditEl(e))});b.appendChild(g)}
  /* adicionar entrega ou aula fixa */
  const tb=el(`<div class="btns fcaladd"></div>`),mk=(k,lab)=>{const x=el(`<button class="btn" type="button"></button>`);x.id=`fca${k}-${sem.id}`;x.textContent=lab;x.setAttribute("aria-expanded",calAdd===k+sem.id);x.onclick=()=>{calAdd=calAdd===k+sem.id?null:k+sem.id;render()};tb.appendChild(x)};
  if(ds.length)mk("e","+ Entrega");mk("a","+ Aula fixa");b.appendChild(tb);
  const dsel=(withNone)=>{const se=document.createElement("select");se.className="etext";if(withNone){const o=document.createElement("option");o.value="";o.textContent="Nenhuma";se.appendChild(o)}ds.forEach(d=>{const o=document.createElement("option");o.value=d.id;o.textContent=d.name;se.appendChild(o)});return se};
  if(calAdd==="e"+sem.id){const f=el(`<form class="fcalform"><label class="ffield"><span>Entrega</span><input class="etext" maxlength="80" placeholder="Ex.: Relatório da prática, apresentação"></label><label class="ffield"><span>Data</span><input type="date" class="etext"></label><label class="ffield"><span>Disciplina</span></label><div class="btns"><button class="btn primary" type="submit">Adicionar entrega</button></div></form>`);
    const [ni,di]=f.querySelectorAll("input"),se=dsel(false);f.querySelectorAll("label")[2].appendChild(se);ni.id="fcen-"+sem.id;di.id="fced0-"+sem.id;se.id="fces-"+sem.id;
    f.onsubmit=ev=>{ev.preventDefault();const tx=ni.value.trim();if(!tx){ni.focus();return}if(!DATE_RE.test(di.value)){di.focus();return}fac.ents=[...(fac.ents||[]),{id:fuid(),discId:se.value,t:tx.slice(0,80),date:di.value}];calAdd=null;saveFac();render()};b.appendChild(f)}
  if(calAdd==="a"+sem.id){const f=el(`<form class="fcalform"><label class="ffield"><span>Dia</span><select class="etext"></select></label><label class="ffield"><span>Começa</span><input type="time" class="etext" value="14:00"></label><label class="ffield"><span>Termina</span><input type="time" class="etext" value="18:00"></label><label class="ffield"><span>Nome</span><input class="etext" maxlength="40" placeholder="Ex.: Tutoria"></label><label class="ffield"><span>Disciplina (opcional)</span></label><div class="btns"><button class="btn primary" type="submit">Adicionar aula</button></div></form>`);
    const wd=f.querySelector("select");[1,2,3,4,5,6,0].forEach(d=>{const o=document.createElement("option");o.value=d;o.textContent=WD_FULL[d];wd.appendChild(o)});wd.value="4";wd.id="fcaw-"+sem.id;
    const [ii,fi,ti]=f.querySelectorAll("input");ii.id="fcai-"+sem.id;fi.id="fcaf-"+sem.id;ti.id="fcat-"+sem.id;const se=dsel(true);se.id="fcad-"+sem.id;f.querySelectorAll("label")[4].appendChild(se);
    const er=el(`<p class="err" hidden></p>`);f.insertBefore(er,f.querySelector(".btns"));
    f.onsubmit=ev=>{ev.preventDefault();const a={id:fuid(),semId:sem.id,wd:+wd.value,ini:ii.value,fim:fi.value,t:(ti.value.trim()||"Aula").slice(0,40),...(se.value?{discId:se.value}:{})};
      if(!aulaOk(a)){er.hidden=false;er.textContent="Confira os horários: o fim tem que ser depois do começo.";return}fac.aulas=[...(fac.aulas||[]),a];calAdd=null;saveFac();redoPlan(`Aula fixa adicionada: ${WD_FULL[a.wd]} ${hm2(a.ini)}–${hm2(a.fim)}. O tempo de estudo desse dia foi ajustado.`)};b.appendChild(f)}
  b.appendChild(el(`<p class="how hx">Toque numa data para mudar ou marcar como adiada. Nas 3 semanas antes de cada prova o plano do dia já reserva espaço para ela; semanas pesadas aparecem em dourado para você se adiantar.</p>`));
  return w}
let facCalOpen=new Set();
/* SP "aberta" da disciplina: a que fecha primeiro a partir de amanhã; sem data, a última da lista */
function openSPOf(d,n){const S=(d.sps||[]).filter(x=>!x.fadi);const f=S.filter(x=>x.fech&&dnum(x.fech)>=n).sort((a,b)=>a.fech<b.fech?-1:1)[0];return f||S[S.length-1]||null}
/* avisos da Faculdade no Estudar hoje: preparo para a aula de amanhã, entregas perto, SP que acabou de fechar */
function facDayNotes(){const t=dnum(today()),out=[];
  aulasOn(t+1).forEach(a=>{const d=a.discId&&discOf(a.discId),sp=d&&openSPOf(d,t+1);if(!sp)return;const [od,ot]=objStats(sp);
    out.push({id:"prep-"+a.id,t:`Amanhã tem ${a.t} (${hm2(a.ini)}): revise os objetivos da ${spShort(sp.name)}${ot?` (${od} de ${ot} marcados)`:""}.`,acts:[["Ver objetivos",()=>{facOpenSem.add(d.semId);facOpenDisc.add(d.id);facOpenSP.add(sp.id);backStack=[];setView("fac");setTimeout(()=>scrollToId("sp-"+sp.id),60)}]]})});
  (fac.ents||[]).forEach(e=>{if(e.done||e.adi||!DATE_RE.test(e.date||""))return;const n=daysTo(e.date),d=discOf(e.discId);if(n<0||n>3||!d||!activeSems().includes(d.semId))return;
    out.push({id:"ent-"+e.id,t:`Entrega ${n===0?"hoje":n===1?"amanhã":`em ${n} dias`}: ${e.t} (${d.name}).`,acts:[["Já entreguei",()=>{e.done=1;saveFac();render()}]]})});
  provaWeek().forEach(p=>{const K=provaReadKeys(p);if(!K.length)return;const n=daysTo(p.date);
    out.push({id:"rd-"+p.id,t:`Revisar para a prova ${p.name} (${n===0?"hoje":n===1?"amanhã":`em ${n} dias`}): leia as ${K.length} ${K.length===1?"página":"páginas"} dos conteúdos dela numa leitura só.`,acts:[["Ler as anotações da prova",()=>provaReadGo(p)]]})});
  fac.discs.forEach(d=>{if(!activeSems().includes(d.semId))return;(d.sps||[]).forEach(sp=>{if(!sp.fech||sp.fadi||sp.pos===sp.fech)return;const n=t-dnum(sp.fech);if(n<0||n>3)return;
    const keys=topicKeysOf(sp.items),pr=primaryRef(sp),pk=pr&&refTopic(pr).k,cs=cards.filter(c=>cdLive(c)&&keys.includes(c.k)&&c.f&&c.f.st&&c.due<=fromNum(t+3));
    const acts=[];if(pk&&BYKEY[pk]&&!sampleOff)acts.push(["Gerar questões",()=>{detTab[pk]="questoes";openTopic(pk);setTimeout(()=>{const g=detGet("qf-",pk);if(g)g.scrollIntoView({behavior:"smooth",block:"center"})},350)}]);
    if(cs.length)acts.push([`Cartões da SP (${cs.length})`,()=>{backStack=[];setView("notas");if(typeof setNSeg==="function")setNSeg("revisar");cdRunStart(cs.map(c=>c.id))}]);
    acts.push(["Dispensar",()=>{sp.pos=sp.fech;saveFac();render()}]);
    out.push({id:"pos-"+sp.id,t:`${spShort(sp.name)} fechou ${n===0?"hoje":n===1?"ontem":`há ${n} dias`}: faça questões${cs.length?" e os cartões":""} dela enquanto está fresco.`,acts})})});
  return out}
function facDayNotesEl(){const L=facDayNotes();if(!L.length)return null;const w=el(`<ul class="pfac" id="pFac"></ul>`);
  L.forEach(x=>{const li=el(`<li><span></span><span class="pfacb"></span></li>`);li.id="pf-"+x.id;li.querySelector("span").textContent=x.t;x.acts.forEach(([lab,fn],i)=>{const b=el(`<button type="button"></button>`);b.className=i===x.acts.length-1&&lab==="Dispensar"?"link":"btn";b.textContent=lab;b.onclick=fn;li.querySelector(".pfacb").appendChild(b)});w.appendChild(li)});return w}
/* peso na residência de um conteúdo da faculdade (o maior entre os temas ligados) */
function resWeight(r){let w=0;refTopics(r).forEach(x=>{const it=BYKEY[x.k];if(it&&!it.own&&it.area!==FAC_AREA)w=Math.max(w,wOf(it))});return w}
function resWeightEl(w){if(!w)return null;const x=el(`<span class="fresw"></span>`);x.textContent=`vale para a residência · peso ${w}`;x.title=w===3?"Cai muito na residência: vale estudar a fundo":w===2?"Cai com frequência na residência":"Cai pouco na residência";if(w===3)x.classList.add("hi");return x}
/* objetivos da SP por foto: o Claude lê a página e cada objetivo (ou questão de aprendizagem) vira subtópico; sugere o tema da residência mais próximo */
let objF={};
function objFPrompt(){return `A imagem é a página de uma SP (sessão de tutoria) ou de uma disciplina de um curso de medicina.\nListe os objetivos de aprendizagem (ou, na tutoria, as questões de aprendizagem) exatamente como estão escritos, um por item, sem numeração e sem comentários. Ignore cabeçalho, datas, nomes de professores e bibliografia.\nResponda só com JSON: {"tipo":"objetivos" ou "questoes","itens":["...","..."]}`}
function jsonFromText(tx){const s=String(tx||""),i=s.search(/[\[{]/);if(i<0)return null;for(let j=s.length;j>i;j--){const c=s[j-1];if(c!=="}"&&c!=="]")continue;try{return JSON.parse(s.slice(i,j))}catch(e){}}return null}
async function objFRun(sid,file){const S=objF[sid]={st:"busy",list:[],msg:""};render();
  try{let r;/* Lote 20C: foto, PDF, Word, PowerPoint ou texto */
    if(docKind(file)==="img"){const blob=await imgShrink(file);r=await sampleFn(objFPrompt(),{images:[blob],cache:false,title:"Objetivos da SP por foto",hint:"Anexe a foto na conversa do Claude e cole aqui a resposta (JSON com os itens)."})}
    else{const m=await msReadOne(file,!window.__site,!!window.__site);if(m.err&&!m.txt)throw Object.assign(new Error(m.err),{code:"read",msg:m.err});
      r=await sampleFn(objFPrompt().replace(/^A imagem é/,"O texto abaixo é").replace(/na imagem|da imagem|na foto|da foto/gi,"no texto")+`\n\nTexto do arquivo "${file.name}":\n"""\n${m.txt.slice(0,GM_MAX)}\n"""`,{images:(m.imgs||[]).filter(x=>x instanceof Blob).slice(0,GM_IMG),cache:false,title:"Objetivos da SP por arquivo",hint:"Cole aqui a resposta (JSON com os itens)."})}
    if(objF[sid]!==S)return;const J=jsonFromText(r&&r.text),items=(J&&Array.isArray(J.itens)?J.itens:Array.isArray(J)?J:[]).map(x=>String(x||"").replace(/^\s*([-*•]|\d+[.)])\s*/,"").trim()).filter(Boolean).slice(0,40);
    if(!items.length){S.st="err";S.msg="Não achei objetivos na resposta. Tente uma foto mais nítida, só da parte dos objetivos.";render();return}
    S.tipo=J&&J.tipo==="questoes"?"questoes":"objetivos";S.list=items.map(t=>{const sc=impTemaScores(t,""),k=Object.keys(sc).sort((a,b)=>sc[b]-sc[a])[0];return {t:t.slice(0,200),on:true,k:k&&sc[k]>=3?k:null,lk:false}});S.st="rev";render()}
  catch(e){if(objF[sid]!==S)return;S.st="err";S.msg=e&&e.code==="cancelled"?"":e&&e.code==="read"?e.msg:"Não foi possível ler o arquivo agora. Tente de novo.";render()}}
function objFEl(d,sp,L){const S=objF[sp.id],w=el(`<div class="fobjf"></div>`);
  if(!S||S.st==="err"){const lb=el(`<label class="btn fobjfb"><input type="file" accept="${DOC_ACCEPT}" hidden>📄 Ler os objetivos de uma foto ou arquivo</label>`),fi=lb.querySelector("input");fi.id="fof-"+sp.id;
    fi.onchange=()=>{const f=fi.files&&fi.files[0];if(f)objFRun(sp.id,f)};w.appendChild(lb);if(S&&S.msg){const m=el(`<p class="err"></p>`);m.textContent=S.msg;w.appendChild(m)}return w}
  if(S.st==="busy"){w.appendChild(el(`<p class="gstatus" role="status">Lendo com o Claude…</p>`));return w}
  const h=el(`<p class="how"></p>`);h.textContent=`O Claude achou ${S.list.length} ${S.tipo==="questoes"?"questões de aprendizagem":"objetivos"}. Desmarque o que não quiser; cada um vira um objetivo (subtópico) desta ${L.sp}. Onde houver um tema da residência parecido, você pode ligar a ${L.sp} a ele.`;w.appendChild(h);
  const ul=el(`<ul class="fobjl"></ul>`);S.list.forEach((x,i)=>{const li=el(`<li><label><input type="checkbox"><span></span></label></li>`),cb=li.querySelector("input");cb.id=`fofi-${sp.id}-${i}`;cb.checked=x.on;cb.onchange=()=>{x.on=cb.checked};li.querySelector("span").textContent=x.t;
    if(x.k&&BYKEY[x.k]&&!sp.items.includes("T:"+x.k)){const l=el(`<label class="fobjlk"><input type="checkbox"><span></span></label>`),c2=l.querySelector("input");c2.id=`fofk-${sp.id}-${i}`;c2.checked=x.lk;c2.onchange=()=>{x.lk=c2.checked};l.querySelector("span").textContent=`ligar à residência: ${BYKEY[x.k].t}`;li.appendChild(l)}ul.appendChild(li)});w.appendChild(ul);
  const a=el(`<div class="btns"><button class="btn primary" type="button">Adicionar</button><button class="link" type="button">Cancelar</button></div>`),[ok,no]=a.querySelectorAll("button");ok.id="fofOk-"+sp.id;
  ok.onclick=()=>{let n=0;S.list.forEach(x=>{if(x.on&&!sp.objs.includes(x.t)){sp.objs.push(x.t);n++}if(x.lk&&x.k&&BYKEY[x.k]&&!sp.items.includes("T:"+x.k))sp.items.push("T:"+x.k)});delete objF[sp.id];saveFac();syncObjs(sp);commit()};
  no.onclick=()=>{delete objF[sp.id];render()};w.appendChild(a);return w}

function renderFac(){
  const v=$("#viewFac");if(!v)return;facShown=new Set();
  if(!facSemInit){facSemInit=true;const c=curSem();if(c)facOpenSem.add(c.id)}
  renderFacHead();renderFacProvas();renderFacWeek();
  const box=$("#facSems");box.innerHTML="";
  const act=fac.sems.filter(s=>!s.archived).reverse(),arch=fac.sems.filter(s=>s.archived).reverse();
  act.forEach(s=>box.appendChild(semFolder(s)));
  if(arch.length){const t=el(`<button class="link farchbtn" type="button"></button>`);t.textContent=facShowArch?`Ocultar semestres arquivados`:`Semestres arquivados (${arch.length})`;t.onclick=()=>{facShowArch=!facShowArch;render()};box.appendChild(t);
    if(facShowArch)arch.forEach(s=>box.appendChild(semFolder(s)))}
  const fc=$("#facCrunch");fc.hidden=!fac.sems.length;if(fac.sems.length)renderFacCrunch()}

function renderFacHead(){const c=$("#facHead");c.innerHTML="";
  const head=el(`<div class="dhead"><h2 id="fh">Faculdade</h2></div>`);c.appendChild(head);
  const newForm=primary=>{const ns=el(`<form class="addsub"><input class="etext" id="facNewSem" maxlength="40" aria-label="Nome do novo semestre"><button class="btn${primary?" primary":""}" type="submit">Criar semestre</button></form>`);
    const i=ns.querySelector("input");i.placeholder=fac.sems.length?"Ex.: 7° Semestre":"Ex.: 6° Semestre";i.value=facNew.sem||"";i.oninput=()=>facNew.sem=i.value;
    ns.onsubmit=e=>{e.preventDefault();const t=i.value.trim();if(!t)return;facNew.sem="";facSemMenu=false;addSem(t.slice(0,40))};return ns};
  if(!fac.sems.length){
    c.append(el(`<p class="gtext">Organize a faculdade em pastas, do jeito do seu curso: <b>Semestre › Disciplina (NCS) › Eixo › SP</b>. Cada SP é ligada aos temas da residência, então o que você estuda aqui conta lá também, nas revisões e no plano do dia.</p>`),
      el(`<ol class="fsteps"><li><b>Crie o semestre</b> logo abaixo. Ele vira uma pasta.</li><li><b>Dentro dele</b>, cole a ementa (o Claude monta disciplinas, eixos, SPs e objetivos) ou adicione as disciplinas à mão.</li><li><b>Cadastre as provas</b> do semestre com data: nas 3 semanas anteriores, o plano do dia reserva espaço para elas.</li></ol>`),newForm(true));return}
  const nb=el(`<button class="mini" type="button" aria-expanded="${facSemMenu}"></button>`);nb.textContent=facSemMenu?"Cancelar":"+ Semestre";nb.onclick=()=>{facSemMenu=!facSemMenu;render();if(facSemMenu)setTimeout(()=>{const x=document.getElementById("facNewSem");if(x)x.focus()},30)};head.appendChild(nb);
  if(facSemMenu)c.appendChild(newForm(false))}

function semFolder(s){const L=lv(s),open=facOpenSem.has(s.id),ds=semDiscs(s.id),keys=topicKeysOf(ds.flatMap(discRefs)),c=lvlCounts(keys),n=keys.length;
  const np=semProvas(s).filter(p=>p.date>=today())[0];
  const card=el(`<section class="fsemf${open?" open":""}${s.archived?" arch":""}" id="fs-${s.id}"><button class="fssum" type="button" aria-expanded="${open}"><span class="chev" aria-hidden="true"></span>${FOLDER_SVG}<span class="aname"></span><span class="acount"></span><span class="fdmeta"></span>${n?`<div class="bar"><i class="d3"></i><i class="d2"></i><i class="d1"></i></div>`:""}</button></section>`);
  card.querySelector(".aname").textContent=s.name;card.querySelector(".acount").textContent=n?`${pct(n-c[0],n)}%`:"";
  const meta=card.querySelector(".fdmeta"),add=(t,cls)=>{const x=document.createElement("span");x.textContent=t;if(cls)x.className=cls;meta.appendChild(x)};
  add(`${ds.length} ${(ds.length===1?L.disc:plural(L.disc)).toLowerCase()}`);if(n)add(`${n-c[0]} de ${n} conteúdos estudados`);
  if(np){const dd=daysTo(np.date);add(`${np.name} · ${inLabel(dd)}`,"fbadge"+(dd<=7?" soon":""))}if(s.archived)add("arquivado");
  if(n)bar(card.querySelector(".bar"),c,n);
  card.querySelector(".fssum").onclick=()=>{open?facOpenSem.delete(s.id):facOpenSem.add(s.id);if(facEdit&&/^(sem|lv):/.test(facEdit))closeEdit();render()};
  if(!open)return card;
  const body=el(`<div class="fsbody"></div>`);
  // ferramentas do semestre
  const tb=el(`<div class="fstools"></div>`);
  const I=facImport,impHere=I.status!=="closed"&&I.semId===s.id;
  const eb=el(`<button class="btn primary" type="button">Colar ementa</button>`);eb.disabled=sampleOff||impHere;
  eb.onclick=()=>{Object.assign(facImport,{status:"edit",semId:s.id,prop:null,msg:"",done:""});if(I.semId!==s.id)I.text="";render();setTimeout(()=>{const t=document.getElementById("fimpText");if(t)t.focus()},50)};
  const aj=el(`<button class="mini" type="button" aria-expanded="${facSemAdj===s.id}">⚙ Ajustes</button>`);aj.onclick=()=>{facSemAdj=facSemAdj===s.id?null:s.id;closeEdit();render()};
  const ndOpen=facNewDiscFor===s.id||!ds.length;
  const db=el(`<button class="btn primary" type="button" aria-expanded="${ndOpen}"></button>`);db.textContent=`+ ${L.disc}`;db.onclick=()=>{facNewDiscFor=facNewDiscFor===s.id?null:s.id;render();setTimeout(()=>{const x=document.getElementById("facNewDisc-"+s.id);if(x)x.focus()},40)};
  eb.classList.remove("primary");eb.textContent="Colar ementa";
  tb.append(db,eb,aj);body.appendChild(tb);
  if(ndOpen){const nd=el(`<form class="fnewdisc"><label class="ffield"><span></span><input class="etext" maxlength="60"></label><div class="btns"><button class="btn primary" type="submit">Criar</button></div></form>`),ndi=nd.querySelector("input");
    nd.querySelector("span").textContent=`Nome da nova ${L.disc.toLowerCase()}`;ndi.id="facNewDisc-"+s.id;ndi.placeholder=(s.ucs||[]).length?"Ex.: Tutoria, TBL, Morfofuncional":"Ex.: NCS – Tutoria, Habilidades Médicas";
    if((s.ucs||[]).length){const l=el(`<label class="ffield"><span>Unidade curricular</span><select class="etext"></select></label>`),se=l.querySelector("select");se.id="facNewDiscUc-"+s.id;[["","Nenhuma"],...s.ucs.map(u=>[u.id,ucLabel(u,s)])].forEach(([v,tx])=>{const o=document.createElement("option");o.value=v;o.textContent=tx;se.appendChild(o)});se.value=facNew["ducs"+s.id]||"";se.onchange=()=>facNew["ducs"+s.id]=se.value;nd.insertBefore(l,nd.querySelector(".btns"))}
    const nk="disc"+s.id;ndi.value=facNew[nk]||"";ndi.oninput=()=>facNew[nk]=ndi.value;
    if(ds.length){const c=el(`<button class="btn" type="button">Cancelar</button>`);c.onclick=()=>{facNewDiscFor=null;render()};nd.querySelector(".btns").appendChild(c)}
    nd.onsubmit=e=>{e.preventDefault();const t=ndi.value.trim();if(!t){ndi.focus();return}facNew[nk]="";addDisc(s.id,t.slice(0,60),facNew["ducs"+s.id]||"")};body.appendChild(nd)}
  if(s.lv&&Object.values(s.lv).some(v=>/\d/.test(v))){const wv=el(`<div class="pnote flvwarn" role="status"><span></span> <button class="link" type="button">Voltar aos nomes padrão</button></div>`);
    wv.querySelector("span").textContent=`O nome de um nível ficou com número (${Object.values(s.lv).filter(v=>/\d/.test(v)).map(v=>`“${v}”`).join(", ")}). Esse campo é o nome do nível para o semestre todo, por isso os textos aparecem estranhos.`;
    wv.querySelector("button").id="flvfix-"+s.id;wv.querySelector("button").onclick=()=>{const o={};for(const k in s.lv)if(!/\d/.test(s.lv[k]))o[k]=s.lv[k];if(Object.keys(o).length)s.lv=o;else delete s.lv;saveFac();render()};body.appendChild(wv)}
  if(facSemAdj===s.id)body.appendChild(semAdjust(s,L));
  {const cal=semCalEl(s);if(cal)body.appendChild(cal)}
  if(impHere)body.appendChild(ementaPanel(s,L));
  else if(I.done&&I.doneSem===s.id){const p=el(`<p class="gstatus" role="status"></p>`);p.textContent=I.done;body.appendChild(p)}
  // disciplinas
  const dh=el(`<div class="fshead"><span class="glabel"></span></div>`);dh.querySelector(".glabel").textContent=`${plural(L.disc)} (${ds.length})`;body.appendChild(dh);
  if(!ds.length){const p=el(`<p class="cempty"></p>`);p.textContent=`Nenhuma ${L.disc.toLowerCase()} ainda. Escreva o nome acima e toque em Criar, ou use Colar ementa para o Claude montar tudo de uma vez.`;body.appendChild(p)}
  const dl=el(`<div class="fdiscs"></div>`),ucs=s.ucs||[];
  if(ucs.length){const head=(t,c)=>{const h=el(`<div class="fuch"><span class="fucn"></span><span class="fucc"></span></div>`);h.querySelector(".fucn").textContent=t;h.querySelector(".fucc").textContent=c;dl.appendChild(h)};
    ucs.forEach(u=>{const g=ds.filter(d=>d.ucId===u.id);head(ucLabel(u,s),g.length?`${g.length} ${(g.length===1?L.disc:plural(L.disc)).toLowerCase()}`:`nenhuma ${L.disc.toLowerCase()} ainda`);g.forEach(d=>dl.appendChild(discCard(d,L)))});
    const rest=ds.filter(d=>!ucs.some(u=>u.id===d.ucId));if(rest.length){head("Sem UC","");rest.forEach(d=>dl.appendChild(discCard(d,L)))}}
  else ds.forEach(d=>dl.appendChild(discCard(d,L)));body.appendChild(dl);
  // provas
  body.appendChild(semProvasBlock(s,L));
  card.appendChild(body);return card}

function semAdjust(s,L){const m=el(`<div class="fsemmenu"><div class="fsemacts"></div><div class="fsemedit"></div></div>`),ac=m.querySelector(".fsemacts"),se=m.querySelector(".fsemedit");
  const ks="sem:"+s.id,kl="lv:"+s.id,ku="uc:"+s.id,tg=(lab,k)=>{const b=el(`<button class="mini" type="button" aria-pressed="${facEdit===k}"></button>`);b.textContent=lab;b.onclick=()=>{openEdit(facEdit===k?null:k);render()};return b};
  const a=el(`<button class="mini" type="button"></button>`);a.textContent=s.archived?"Desarquivar":"Arquivar";a.onclick=()=>{s.archived=!s.archived;if(s.archived){facShowArch=true}facSemAdj=null;closeEdit();saveFac();render()};
  const ub=tg("Unidades curriculares",ku);ub.id="fucb-"+s.id;ac.append(tg("Renomear",ks),ub,tg("Nomes dos níveis",kl),a);
  if(facEdit===ks){const ne=nameEdit(ks,s.name,v=>{s.name=v.slice(0,40)});const i=ne.querySelector("input");i.maxLength=40;i.id="fr-sem";i.setAttribute("aria-label","Novo nome do semestre");se.appendChild(ne)}
  if(facEdit===ku){const f=el(`<div class="fucedit"><p class="gtext how"></p><ul class="fuclist"></ul><form class="addsub"><input class="etext" maxlength="40" placeholder="Nova UC (ex.: NCS, PMSUS, HMEC)" aria-label="Nova unidade curricular"><button class="btn" type="submit">+ UC</button></form></div>`);
    f.querySelector("p").textContent=`As unidades curriculares agrupam as ${plural(L.disc).toLowerCase()} (ex.: NCS, PMSUS, HMEC). Use só o nome, sem o número do período: o app mostra “${ucLabel({name:"NCS"},s)}” sozinho. Em cada ${L.disc.toLowerCase()}, escolha a UC em Detalhes e ajustes.`;
    (s.ucs||[]).forEach(u=>{const li=el(`<li><input class="etext" maxlength="40"><span class="ks"></span></li>`),i=li.querySelector("input");i.value=u.name;i.id="fucn-"+u.id;i.setAttribute("aria-label","Nome da UC");
      i.onchange=()=>{const v=i.value.trim().replace(/\s*\d+\s*$/,"");if(v){u.name=v.slice(0,40);saveFac();render()}};const n=semDiscs(s.id).filter(d=>d.ucId===u.id).length;li.querySelector(".ks").textContent=`${n} ${(n===1?L.disc:plural(L.disc)).toLowerCase()}`;
      li.appendChild(armBtn("uc"+u.id,"remover","Toque de novo: as disciplinas ficam sem UC",()=>{s.ucs=s.ucs.filter(x=>x!==u);if(!s.ucs.length)delete s.ucs;semDiscs(s.id).forEach(d=>{if(d.ucId===u.id)delete d.ucId});saveFac();render()}));f.querySelector("ul").appendChild(li)});
    const fi=f.querySelector("form input");fi.id="fucnew-"+s.id;fi.value=facNew["uc"+s.id]||"";fi.oninput=()=>facNew["uc"+s.id]=fi.value;
    f.querySelector("form").onsubmit=e=>{e.preventDefault();const v=fi.value.trim().replace(/\s*\d+\s*$/,"");if(!v)return;s.ucs=[...(s.ucs||[]),{id:fuid(),name:v.slice(0,40)}];facNew["uc"+s.id]="";saveFac();render();setTimeout(()=>{const x=document.getElementById("fucnew-"+s.id);if(x)x.focus()},30)};
    se.appendChild(f)}
  if(facEdit===kl){const L0={...lv(s),...(facDraft.lv||{})};const f=el(`<form class="flv"><p class="gtext how"></p><div class="fgrid"></div><div class="btns"><button class="btn primary" type="submit">Salvar</button><button class="btn" type="button">Cancelar</button></div></form>`);
    f.querySelector("p").textContent=`Como o seu curso chama cada nível em ${s.name} (usado nos botões e no cadastro pela ementa). É o nome do nível, sem número: “SP”, não “SP 2.1 Hemostasia”. Para criar uma SP, use + SP dentro da disciplina.`;
    [["disc","Disciplina (ex.: Disciplina, Módulo)"],["sp","SP (ex.: SP, Problema, Aula)"]].forEach(([k,lab])=>{const l=el(`<label class="ffield"><span></span><input class="etext" maxlength="20"></label>`);l.querySelector("span").textContent=lab;const i=l.querySelector("input");i.name=k;i.id="flv-"+k;i.value=L0[k];i.oninput=()=>{(facDraft.lv=facDraft.lv||{})[k]=i.value};f.querySelector(".fgrid").appendChild(l)});
    const fer=el(`<p class="err" hidden></p>`);f.insertBefore(fer,f.querySelector(".btns"));
    f.onsubmit=e=>{e.preventDefault();const bad=[...f.querySelectorAll("input")].find(i=>/\d/.test(i.value));if(bad){fer.hidden=false;fer.textContent=`Use só o nome do nível, sem número (ex.: “${LV_DEF[bad.name]}”). Para criar uma ${LV_DEF[bad.name]}, use + ${LV_DEF.sp} dentro da disciplina.`;bad.focus();return}
      const o={};f.querySelectorAll("input").forEach(i=>{const v=i.value.trim();if(v&&v!==LV_DEF[i.name])o[i.name]=v.slice(0,20)});if(Object.keys(o).length)s.lv=o;else delete s.lv;closeEdit();saveFac();render()};
    f.querySelectorAll("button")[1].onclick=()=>{closeEdit();render()};se.appendChild(f)}
  if(!se.children.length)se.remove();
  m.appendChild(el(`<p class="gtext how">Arquivar tira o semestre do plano do dia e das provas, mas guarda tudo (temas, progresso e anotações).</p>`));
  return m}
function semProvasBlock(s,L){const all=semProvas(s),up=all.filter(p=>p.date>=today()),past=all.filter(p=>p.date<today()).reverse(),open=facOpenProv.has(s.id);
  const w=el(`<div class="fsprov${open?" open":""}" id="fsp-${s.id}"><button class="fsph" type="button" aria-expanded="${open}"><span class="chev" aria-hidden="true"></span><span class="fsphl"></span><span class="fsphc"></span></button></div>`);
  w.querySelector(".fsphl").textContent=`Provas do semestre`;w.querySelector(".fsphc").textContent=up.length?`${up.length} próxima${up.length>1?"s":""}`:all.length?"nenhuma futura":"nenhuma";
  w.querySelector(".fsph").onclick=()=>{open?facOpenProv.delete(s.id):facOpenProv.add(s.id);render()};
  if(!open)return w;
  const b=el(`<div class="fspbody"></div>`);
  if(!up.length)b.appendChild(el(`<p class="cempty">${all.length?"Nenhuma prova futura neste semestre.":"Nenhuma prova cadastrada. Nas 3 semanas antes de cada prova, o plano do dia reserva espaço para o conteúdo dela."}</p>`));
  else{const ol=el(`<ol class="fprovas"></ol>`);up.forEach(p=>ol.appendChild(provaCard(p,L)));b.appendChild(ol)}
  if(past.length){const t=el(`<button class="link" type="button"></button>`);const sh=facShowPast.has(s.id);t.textContent=sh?"Ocultar provas realizadas":`Ver provas realizadas (${past.length})`;t.onclick=()=>{sh?facShowPast.delete(s.id):facShowPast.add(s.id);render()};b.appendChild(t);
    if(sh){const ol=el(`<ol class="fprovas"></ol>`);past.forEach(p=>ol.appendChild(provaCard(p,L)));b.appendChild(ol)}}
  const ad=el(`<div class="fpadd"><span class="glabel">Nova prova</span></div>`);ad.appendChild(provaFormEl(s.id,s.id));b.appendChild(ad);w.appendChild(b);return w}

/* formulário de nova prova: Semestre › disciplina(s) desse semestre › nome e data.
   key = onde o formulário está (id do semestre, ou "g" no painel Próximas provas); hostSem = semestre que ele abre escolhido */
function provaFormEl(key,hostSem){const N=facNew["prov"+key]||(facNew["prov"+key]={});
  if(!semOf(N.s)){const dd=N.d&&discOf(N.d);N.s=dd?dd.semId:(semOf(hostSem)?hostSem:(activeSems()[0]||(fac.sems[0]||{}).id))}
  const sem=semOf(N.s),L=lv(sem),ds=semDiscs(N.s);
  let sel=(Array.isArray(N.ds)?N.ds:(N.d?[N.d]:[])).filter(id=>ds.some(d=>d.id===id));if(!sel.length&&ds.length)sel=[ds[0].id];N.ds=sel;N.d=sel[0];
  const box=el(`<div class="fpnewbox"></div>`),pf=el(`<form class="fpform"><label class="fcru fpsemsel">Semestre <select class="etext"></select></label></form>`),ss=pf.querySelector("select");ss.id="fpsem-"+key;
  fac.sems.forEach(x=>{const o=document.createElement("option");o.value=x.id;o.textContent=x.name+(x.archived?" (arquivado)":"");ss.appendChild(o)});ss.value=N.s;
  ss.onchange=()=>{N.s=ss.value;N.ds=[];delete N.d;render()};
  box.appendChild(pf);
  if(!ds.length){pf.appendChild(el(`<p class="gtext how fpnone2">Este semestre ainda não tem ${esc(L.disc.toLowerCase())}. Cadastre uma primeiro, dentro do semestre.</p>`));return box}
  const fs=el(`<fieldset class="fpdiscs"><legend></legend><div class="chips"></div></fieldset>`);fs.querySelector("legend").textContent=`${plural(L.disc)} da prova${ds.length>1?" (marque mais de uma se a prova for conjunta)":""}`;
  ds.forEach(d=>{const on=sel.includes(d.id),b=el(`<button class="chip" type="button" aria-pressed="${on}"></button>`);b.id=`fpdisc-${key}-${d.id}`;b.textContent=d.name;
    b.onclick=()=>{N.ds=on?sel.filter(x=>x!==d.id):[...sel,d.id];if(!N.ds.length)N.ds=[d.id];N.d=N.ds[0];render()};fs.querySelector(".chips").appendChild(b)});
  pf.appendChild(fs);
  const pn=el(`<input class="etext" maxlength="60" placeholder="Nome (ex.: D2 NCS 6)" aria-label="Nome da prova">`),pdt=el(`<input class="etext" type="date" aria-label="Data da prova">`);pn.id="fpn-"+key;pdt.id="fpd-"+key;
  pf.append(pn,pdt,el(`<button class="btn primary" type="submit">Adicionar prova</button>`));
  pn.value=N.n||"";pdt.value=N.dt||"";pn.oninput=()=>N.n=pn.value;pdt.oninput=()=>N.dt=pdt.value;
  const er=el(`<p class="err" hidden></p>`);
  pf.onsubmit=e=>{e.preventDefault();const n=pn.value.trim(),dt=pdt.value,pick=N.ds.map(discOf).filter(Boolean);
    if(!n||!/^\d{4}-\d{2}-\d{2}$/.test(dt)||!pick.length){er.hidden=false;er.textContent=!n?"Dê um nome à prova.":"Escolha a data da prova.";return}
    const p={id:fuid(),discId:pick[0].id,name:n.slice(0,60),date:dt,items:[],done:[]};provaSetDids(p,pick.map(d=>d.id));
    const sps=[];pick.forEach(d=>{const u=unassigned(d,p);u.refs.forEach(r=>{if(!p.items.includes(r))p.items.push(r)});sps.push(...u.sps)});if(sps.length)p.sps=sps;
    fac.provas.push(p);facOpenSem.add(N.s);facOpenProv.add(N.s);facProvaOpen.add(p.id);if(sem.archived)facShowArch=true;
    const away=key==="g"||N.s!==hostSem;facNew["prov"+key]={s:N.s,ds:[pick[0].id]};if(key==="g")facProvNew=false;
    saveFac();provaChanged(p,"nova prova");if(away)setTimeout(()=>scrollToId("fp-"+p.id),60)};
  box.append(er,el(`<p class="gtext how">A prova começa marcada com o conteúdo que ainda não está em outra prova. Abra a prova para ajustar.</p>`));return box}

