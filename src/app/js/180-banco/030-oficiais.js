/* ---------- Banco de questões, B4 (11/2026): provas oficiais ----------
   Leitor das reimpressões da Medway (impMwPages, usado no impLocal): texto desenhado em dobro (mwUndouble, também no pdfPageText), letras A–E em
   bolinhas à parte e, em cada página, os enunciados primeiro e as alternativas depois, em ordem (impMedway; mwSplit corta as alternativas pelo ";",
   ponto final e linha curta; sobra de uma página passa para a próxima). A prova importada pode ser marcada como oficial (ex.of, ex.niv) e o gabarito como
   preliminar ou definitivo (ex.kst p|d; o definitivo marca r.kd nas que mudaram). Comentário do Claude (cmGo: partes de CM_PART por copiar e colar, guardado
   na prova e no banco, r.cm). Subtópico sugerido pelo app (sbGuess → r.sb, r.sbd = conferir; Conferir subtópicos no cartão da prova; filtro no banco).
   Lista OF_CAT "Provas oficiais: lidas e faltando" (ofCardEl) em Provas na íntegra. */
/* linha do PDF da Medway: "AA texto;texto;" (letra e 1ª linha da alternativa desenhadas em dobro) vira "A) texto;" */
function mwLine(l){const m=/^([A-E])\1\s+(.+)$/.exec(String(l).trim());if(m){const u=mwUndouble(m[2]);if(u!==m[2].trim())return m[1]+") "+u}return mwUndouble(l)}
function mwUndouble(line){let t=String(line).trim();if(!t)return t;const n=t.length;
  if(n%2===1){const h=(n-1)/2;if(t[h]===" "&&t.slice(0,h)===t.slice(h+1))return t.slice(0,h)}
  if(n%2===0&&n>=2){const h=n/2;if(t.slice(0,h)===t.slice(h))return t.slice(0,h)}
  const w=t.split(" ");if(w.length>=6){let d=0;for(let i=0;i+1<w.length;i+=2)if(w[i]===w[i+1])d++;if(d>=Math.floor(w.length/2)*0.8){const o=[];for(let i=0;i<w.length;i++){if(i+1<w.length&&w[i]===w[i+1])i++;o.push(w[i])}t=o.join(" ")}}
  return t.replace(/^[Ѐ-ӿ](\s[Ѐ-ӿ])*\s+/,"")}
const MW_ABBR=/(?:\b[A-Z]|\bet al|\bvs|\bDr|\bDra|\bSr|\bn|\bp|\bart|\bobs|\bex|\bmín|\bmáx|\bmg|\bml)\.$/i;
function mwSplit(L,want){if(want<=1||L.length<2)return [L.join(" ")];const sc=[],SL=L.map(x=>x.length).sort((a,b)=>a-b),W=SL[Math.floor(SL.length*0.85)]||1;
  for(let i=0;i<L.length-1;i++){const a=L[i],b=L[i+1],up=/^[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9"“(]/.test(b),sh=a.length<0.72*W;let r=0;
    if(/;$/.test(a))r=3;else if(/[.?!]$/.test(a))r=MW_ABBR.test(a)?0.4:2+(up?0.3:0)+(sh?0.2:0);else if(/[)”"]$/.test(a))r=1.2+(sh?0.5:0);
    else if(/[,:\-–]$/.test(a))r=0;else r=sh?1.4+0.5*(1-a.length/W):(up?0.3:0);sc.push({i,r})}
  const pick=sc.filter(x=>x.r>=1).sort((x,y)=>y.r-x.r||x.i-y.i).slice(0,want-1).map(x=>x.i).sort((x,y)=>x-y),out=[];let s=0;
  for(const i of pick){out.push(L.slice(s,i+1).join(" "));s=i+1}out.push(L.slice(s).join(" "));return out}
function impMedway(txt,nAlt){nAlt=nAlt||5;const L=String(txt).replace(/\r/g,"").split("\n").map(mwUndouble).filter(x=>x!=="");
  const isQ=s=>/^QUEST[ÃA]O\s+(\d{1,3})\b/i.exec(s),isLet=s=>/^[A-E]$/.test(s),junk=s=>/^(ENARE|Medway|RESPOSTAS|Anulada)\b/i.test(s)||/^\d{2,6}$/.test(s);
  const out=[],pend=[];let i=0,cur=null,zone=null,carry=[];
  const close=()=>{if(!zone)return;const Z=zone;zone=null;if(!pend.length||!Z.length)return;const want=Math.max(1,nAlt*pend.length-carry.length),all=[...carry,...mwSplit(Z,want)];carry=[];
    while(pend.length&&all.length>=nAlt){const q=pend.shift();q.alts=all.splice(0,nAlt).map(x=>x.replace(/\s+/g," ").replace(/[;.]\s*$/,"").trim());out.push(q)}carry=all};
  while(i<L.length){const s=L[i],m=isQ(s);
    if(m){close();cur={n:+m[1],stem:[]};pend.push(cur);const rest=s.slice(m[0].length).trim();if(rest)cur.stem.push(rest);i++;continue}
    if(isLet(s)){let j=i,c=0;while(j<L.length&&isLet(L[j])){j++;c++}if(c>=3){close();cur=null;zone=[]}i=j;continue}
    if(junk(s)){i++;continue}
    if(zone){zone.push(s);i++;continue}
    if(cur)cur.stem.push(s);i++}
  close();const fin=q=>({n:q.n,enunciado:q.stem.join(" ").replace(/\s+/g," ").trim(),alts:q.alts||null});
  return {qs:out.map(fin).sort((a,b)=>a.n-b.n),left:pend.map(fin)}}
/* páginas no jeito da Medway viram páginas no formato que o leitor conhece ("Questão N", "A) …") */
function impMwPages(pages){const flat=pages.map(p=>p.t).join("\n"),qm=(flat.match(/^\s*QUEST[ÃA]O\s+\d{1,3}\b/gim)||[]).length,lets=(flat.match(/^\s*[A-E]\s*$/gm)||[]).length,ab=(flat.match(/^\s*\(?[A-E]\s*[).]\s+\S/gm)||[]).length;
  if(qm<3||lets<qm*3||ab>=qm)return null;
  const R=impMedway(flat),all=[...R.qs,...R.left],at=n=>{const re=new RegExp("^\\s*QUEST[ÃA]O\\s+0*"+n+"\\b","im"),p=pages.find(x=>re.test(x.t));return p?p.n:pages[0].n},by={};
  all.forEach(q=>{const p=at(q.n);(by[p]=by[p]||[]).push(q)});
  return {pages:pages.map(p=>({n:p.n,t:(by[p.n]||[]).sort((a,b)=>a.n-b.n).map(q=>`Questão ${q.n}\n${q.enunciado}${q.alts?"\n"+q.alts.map((a,i)=>EX_AB[i]+") "+a).join("\n"):""}`).join("\n")})).filter(p=>p.t),
    note:R.left.length?`no jeito das provas da Medway (letras separadas das alternativas), ${R.left.length===1?"a questão":"as questões"} ${R.left.slice(0,10).map(q=>q.n).join(", ")}${R.left.length>10?"…":""} ${R.left.length===1?"ficou":"ficaram"} sem alternativas: confira ou passe pelo Claude`:""}}
/* ---- subtópico sugerido pelo app ---- */
const SB_STOP=new Set("para como qual mais pelo pela pelos pelas entre sobre paciente pacientes anos quadro clinico clinica exame exames conduta diagnostico tratamento seguinte alternativa correta incorreta assinale sendo apresenta apresentou ainda caso dias".split(" "));
const sbStem=w=>w.length>6?w.slice(0,6):w;
function sbWords(t){return new Set(bqT(t).split(" ").filter(w=>w.length>3&&!SB_STOP.has(w)).map(sbStem))}
const sbKey=x=>x.i!==undefined?"i"+x.i:"c:"+String(x.t).slice(0,60);
function sbGuess(k,txt){const it=BYKEY[k];if(!it)return null;const L=subList(it);if(!L.length)return null;const W=sbWords(txt),S=L.map(x=>sbWords(x.t)),df={};
  S.forEach(s=>s.forEach(w=>{df[w]=(df[w]||0)+1}));const sc=S.map(s=>{let v=0;s.forEach(w=>{if(W.has(w))v+=1/df[w]});return v}),o=sc.map((v,i)=>[v,i]).sort((a,b)=>b[0]-a[0]);
  if(!o[0][0])return {sb:"",dub:true};return {sb:sbKey(L[o[0][1]]),dub:o[0][0]<1||(o.length>1&&o[1][0]>=o[0][0]*0.75)}}
function sbLabel(k,sb){const it=BYKEY[k];if(!it||!sb)return "";const x=subList(it).find(y=>sbKey(y)===sb);return x?x.t:""}
function sbFill(ex){let ch=false;ex.qs.forEach(r=>{if(!r.k||r.sbg||!BYKEY[r.k])return;const g=sbGuess(r.k,[r.q.enunciado,...r.q.alternativas.map(a=>a.texto),r.q.comentario||""].join(" "));r.sbg=1;ch=true;
  if(g){if(g.sb)r.sb=g.sb;if(g.dub)r.sbd=1}});return ch}
let sbEd=null;
function sbEditEl(ex){const L=ex.qs.map((r,i)=>i).filter(i=>ex.qs[i].sbd&&ex.qs[i].k&&BYKEY[ex.qs[i].k]),w=el(`<div class="exedit sbed"><p class="how">O app sugeriu o subtópico pelas palavras da questão. Estas ficaram em dúvida: escolha o certo (ou deixe "Sem subtópico").</p><ol class="sbl"></ol></div>`),ol=w.querySelector("ol");
  if(!L.length){w.querySelector(".how").textContent="Nenhum subtópico em dúvida nesta prova.";return w}
  L.slice(0,sbEd.show||10).forEach(i=>{const r=ex.qs[i],it=BYKEY[r.k],li=el(`<li class="sbi"><b></b><span class="sbs"></span><label class="qfsel"><span></span><select></select></label><button class="btn" type="button">Confirmar</button></li>`);
    li.querySelector("b").textContent=`Questão ${r.n||i+1} · ${it.t}`;li.querySelector(".sbs").textContent=r.q.enunciado.slice(0,180)+(r.q.enunciado.length>180?"…":"");li.querySelector("label span").textContent="Subtópico";
    const s=li.querySelector("select");s.id=`sbs-${ex.id}-${i}`;[["","Sem subtópico"],...subList(it).map(x=>[sbKey(x),x.t])].forEach(([v,t])=>{const o=document.createElement("option");o.value=v;o.textContent=t;s.appendChild(o)});s.value=r.sb||"";
    const b=li.querySelector("button");b.id=`sbok-${ex.id}-${i}`;b.onclick=()=>{if(s.value)r.sb=s.value;else delete r.sb;delete r.sbd;exPut(ex);render()};ol.appendChild(li)});
  if(L.length>(sbEd.show||10)){const m=el(`<button class="link" type="button">Ver mais</button>`);m.onclick=()=>{sbEd.show=(sbEd.show||10)+10;render()};w.appendChild(m)}
  return w}
/* ---- comentário do Claude nas questões sem comentário (provas oficiais vêm sem) ---- */
const CM_PART=10;let cmRun=null;
const cmNeed=ex=>ex.qs.map((r,i)=>i).filter(i=>{const r=ex.qs[i];return !!r.q.correta&&!r.an&&!(r.q.comentario||"").trim()});
function cmPrompt(ex,idx){return `Você é professor de residência médica. Comente as questões abaixo da prova ${ex.name}${ex.banca?` (${ex.banca}${ex.ano?" "+ex.ano:""})`:""}, como nos comentários dos cursinhos, com base nas diretrizes brasileiras atuais e em fontes confiáveis. O gabarito oficial já está indicado: não discuta se ele está certo, explique por que está. Não cite letras no comentário; o porquê de cada alternativa errada vai no campo "porque".

Devolva SOMENTE um JSON: uma lista com um objeto por questão, na mesma ordem:
[{"n":número da questão,"comentario":"por que a resposta certa está certa (2 a 5 frases)","porque":{"A":"por que esta alternativa está errada (vazio na correta)","B":"…"},"pontoChave":"a ideia que decide a questão (1 frase)","takeHome":"o que levar para a prova (1 frase)","conceito":"o conceito em poucas palavras","chave":"nome curto da ideia cobrada (3 a 8 palavras, sem o caso clínico), escrito sempre do mesmo jeito para questões que cobram a mesma ideia, mesmo em provas diferentes","fonte":"diretriz ou referência usada"}]

${idx.map(i=>{const r=ex.qs[i],q=r.q;return `### Questão ${r.n||i+1}\n${q.enunciado}\n${q.alternativas.map(a=>a.letra+") "+a.texto).join("\n")}\nGabarito oficial: ${q.correta}`}).join("\n\n")}`}
function cmApply(ex,arr,idx){let n=0;const t=v=>typeof v==="string"?v.trim():"",by={};(Array.isArray(arr)?arr:[]).forEach(o=>{if(o&&typeof o==="object"&&+o.n)by[+o.n]=o});
  idx.forEach((i,j)=>{const r=ex.qs[i],o=by[r.n||i+1]||(Array.isArray(arr)&&!Object.keys(by).length?arr[j]:null);if(!o||!t(o.comentario))return;const q=r.q;
    q.comentario=t(o.comentario).slice(0,4000);const P=o.porque&&typeof o.porque==="object"?o.porque:{};q.alternativas.forEach(a=>{if(a.letra!==q.correta&&t(P[a.letra]))a.porque=t(P[a.letra]).slice(0,1200)});
    if(t(o.pontoChave))q.pc=t(o.pontoChave).slice(0,1200);if(t(o.takeHome))q.th=t(o.takeHome).slice(0,800);if(t(o.conceito))q.conceito=t(o.conceito).slice(0,600);if(t(o.fonte))q.fonte=t(o.fonte).slice(0,400);if(crNorm(t(o.chave)))r.cr=crNorm(t(o.chave));
    if(!r.ck)r.ck=q.correta;r.cm=1;n++});
  if(n){exPut(ex);if(typeof bankFeedSoon==="function")bankFeedSoon()}return n}
async function cmGo(ex,idx){if(!sampleFn||!idx.length||cmRun&&cmRun.st==="run")return;const parts=[];for(let i=0;i<idx.length;i+=CM_PART)parts.push(idx.slice(i,i+CM_PART));
  const C=cmRun={id:ex.id,i:0,m:parts.length,done:0,st:"run",msg:"",ctl:new AbortController()};render();
  for(let p=0;p<parts.length;p++){if(cmRun!==C)return;C.i=p;render();
    try{const r=await sampleFn.json(cmPrompt(ex,parts[p]),{signal:C.ctl.signal,cache:false,title:parts.length>1?`Comentar questões (parte ${p+1} de ${parts.length})`:"Comentar questão",hint:"Cole aqui a resposta do Claude (a lista em JSON)."});
      const arr=Array.isArray(r)?r:r&&Array.isArray(r.questoes)?r.questoes:r&&typeof r==="object"?[r]:[];C.done+=cmApply(ex,arr,parts[p])}
    catch(e){if(cmRun!==C)return;C.st="error";C.msg=e&&e.name==="AbortError"?`Parado. ${C.done} ${C.done===1?"comentada":"comentadas"} até aqui ficaram guardadas.`:"Não deu para comentar esta parte. Tente de novo.";render();return}}
  C.st="done";C.msg=`${C.done} ${C.done===1?"questão comentada":"questões comentadas"}. Os comentários ficaram guardados na prova e no banco.`;render()}
function cmLineEl(ex){if(!cmRun||cmRun.id!==ex.id)return null;const C=cmRun,p=el(`<p class="exline cmline"></p>`);
  p.textContent=C.st==="run"?`✦ Comentando com o Claude${C.m>1?`: parte ${C.i+1} de ${C.m}`:""}…`:C.msg;if(C.st==="run"){const b=el(`<button class="link" type="button" id="cmStop">Parar</button>`);b.onclick=()=>{C.ctl.abort()};p.append(" ",b)}return p}
/* "Juntar gabarito e comentários" (arquivo .json preparado pelo Claude numa conversa): {app:"nexus-comentarios",v:1,prova,gab:"oficial"|"claude",kst?:"p"|"d",
   qs:[{n,ini,correta?,anulada?,comentario,porque:{A:…},pontoChave,takeHome,conceito,chave?,fonte}]} (chave = B5, conceito recorrente). Cada item só entra se o número existe e o começo do enunciado (ini) bate. */
const CJ_APP="nexus-comentarios";let cjMsg=null;
function cjApply(ex,o){const t=v=>typeof v==="string"?v.trim():"",R={ok:0,key:0,an:0,skip:[],kept:0};if(!o||o.app!==CJ_APP||!Array.isArray(o.qs))return null;
  const off=o.gab==="oficial";
  o.qs.forEach(it=>{if(!it||typeof it!=="object")return;const i=ex.qs.findIndex(r=>r.n===+it.n);if(i<0){R.skip.push(it.n);return}const r=ex.qs[i];
    const a=bqT(t(it.ini)).slice(0,40),b=bqT(r.q.enunciado).slice(0,a.length);if(a.length<12||a!==b){R.skip.push(it.n);return}
    const v=t(it.correta).toUpperCase();
    if(it.anulada&&off){if(!r.an){exChange(ex,i,y=>{y.an=true;y.g="b"});R.an++}}
    else if(/^[A-E]$/.test(v)&&r.q.alternativas.some(x=>x.letra===v)){
      if(off){if(r.q.correta!==v||r.g!=="b"||r.an){exChange(ex,i,y=>{if(!y.ck&&y.q.correta)y.ck=y.q.correta;y.an=false;y.q.correta=v;y.g="b"});R.key++}}
      else if(r.g!=="b"&&!r.an){if(r.q.correta!==v){exChange(ex,i,y=>{y.q.correta=v;y.g="c"});R.key++}}else if(r.q.correta!==v)R.kept++}
    if(t(it.comentario)&&(!r.an||it.anulada)){const q=r.q;if(r.q.correta&&v&&r.q.correta!==v&&!off&&r.g==="b"){/* o comentário foi escrito para outra letra: não junta */}
      else{q.comentario=t(it.comentario).slice(0,4000);const P=it.porque&&typeof it.porque==="object"?it.porque:{};q.alternativas.forEach(x=>{if(x.letra!==q.correta&&t(P[x.letra]))x.porque=t(P[x.letra]).slice(0,1200);else if(x.letra===q.correta)x.porque=""});
        if(t(it.pontoChave))q.pc=t(it.pontoChave).slice(0,1200);if(t(it.takeHome))q.th=t(it.takeHome).slice(0,800);if(t(it.conceito))q.conceito=t(it.conceito).slice(0,600);if(t(it.fonte))q.fonte=t(it.fonte).slice(0,400);
        r.ck=q.correta;r.cm=1;R.ok++}if(crNorm(t(it.chave)))r.cr=crNorm(t(it.chave))}});
  if(off&&(R.key||R.an))ex.kst=o.kst==="p"?"p":"d";
  const P=exPg(ex.id);if(P.fin&&P.tries.length){const S=exScore(ex),tt=P.tries[P.tries.length-1];tt.hit=S.hit;tt.n=S.ans}
  exPut(ex);exPSave(ex.id);if(typeof bankFeedSoon==="function")bankFeedSoon();return R}
function cjPick(ex){const inp=document.createElement("input");inp.type="file";inp.accept="application/json,.json";
  inp.onchange=async()=>{const f=inp.files&&inp.files[0];if(!f)return;let o=null;try{o=JSON.parse(await f.text())}catch(e){o=null}
    const R=o&&cjApply(ex,o);cjMsg={id:ex.id,t:!R?"Este arquivo não é de gabarito e comentários do Nexus.":
      `${R.ok} ${R.ok===1?"comentário juntado":"comentários juntados"}${R.key?` · ${R.key} ${R.key===1?"resposta":"respostas"} do gabarito ${o.gab==="oficial"?"oficial":"do Claude (conferir)"}`:""}${(()=>{const t=ex.qs.filter(r=>r.an).length;return t?` · ${t} ${t===1?"anulada":"anuladas"}`:""})()}${R.skip.length?` · ${R.skip.length} não ${R.skip.length===1?"bateu":"bateram"} com a prova (nº ${R.skip.slice(0,8).join(", ")}${R.skip.length>8?"…":""}) e ${R.skip.length===1?"ficou":"ficaram"} de fora`:""}${R.kept?` · ${R.kept} com gabarito da banca mantido`:""}.`};commit()};
  inp.click()}
function bkCmBtn(x,id){if(!x||!x.ex||x.ei==null)return null;const ex=exams.find(e=>e.id===x.ex);return ex?cmBtn(ex,x.ei,id):null}
function cmBtn(ex,i,id){if(!sampleFn||!ex)return null;const r=ex.qs[i];if(!r||!r.q.correta||r.an||(r.q.comentario||"").trim())return null;const b=el(`<button class="btn cmbtn" type="button">✦ Comentar com o Claude</button>`);b.id=id;
  b.disabled=!!(cmRun&&cmRun.st==="run");b.onclick=()=>cmGo(ex,[i]);return b}
/* ---- provas oficiais: lidas e faltando ---- */
const ofNorm=s=>bqT(s).replace(/\s+/g,"");
function ofFind(c){const [b,a,n,,,sub]=c,B=ofNorm(b),S=sub?ofNorm(sub):"";return exams.filter(e=>{const t=ofNorm([e.banca,e.name].join(" "));return t.includes(B)&&(e.ano===a||t.includes(a))&&(!S||t.includes(S)||t.includes(S.replace(/(\d{4})(\d)$/,"$1$2")))})}
function ofState(e){const N=e.qs.length,nb=e.qs.filter(r=>r.g==="b"||r.an).length,nc=cmNeed(e).length,sd=e.qs.filter(r=>r.sbd).length;
  return [`${N} ${N===1?"questão":"questões"} no banco`,!nb?"sem gabarito":e.kst==="p"?"gabarito preliminar":"gabarito definitivo",nc?`${nc} sem comentário`:"",sd?`${sd} subtópicos a conferir`:""].filter(Boolean).join(" · ")}
let ofOpen=lsGet("resid-ofopen","")==="1";
function ofImport(c){impNew();Object.assign(imp,{name:c[2],banca:c[0],ano:c[1],of:true,niv:c[3],ofPre:{name:c[2],banca:c[0],ano:c[1]}});render();setTimeout(()=>{const h=$("#exh");if(h)h.scrollIntoView({block:"start"})},40)}
function ofCardEl(){const flat=OF_CAT.flatMap(g=>g[1]),got=flat.filter(c=>ofFind(c).length).length,d=el(`<details class="ofcat"><summary><b>Provas oficiais: lidas e faltando</b><span></span></summary></details>`);
  d.open=ofOpen;d.querySelector("summary span").textContent=`${got} de ${flat.length} no app`;d.addEventListener("toggle",()=>{ofOpen=d.open;lsSet("resid-ofopen",ofOpen?"1":null)});
  d.appendChild(el(`<p class="how">As que estão na pasta PROVAS do seu Drive aparecem com "no Drive". Importe o PDF como sempre: a prova entra no banco como oficial. A Medway não põe o gabarito no PDF: cole o oficial depois em "Colar gabarito".</p>`));
  OF_CAT.forEach(([g,L])=>{const s=el(`<div class="ofg"><span class="glabel"></span><ul class="ofl"></ul></div>`);s.querySelector(".glabel").textContent=g;const ul=s.querySelector("ul");
    L.forEach((c,j)=>{const E=ofFind(c),li=el(`<li class="ofi"><span class="ofn"><b></b><span></span></span></li>`);li.querySelector("b").textContent=c[2];
      li.querySelector(".ofn span").textContent=E.length?ofState(E[0]):c[4]?"Falta · no Drive":"Falta · PDF ainda não conseguido";if(E.length)li.classList.add("got");
      const b=el(`<button class="btn" type="button"></button>`);b.id=`of-${ofNorm(c[2]).slice(0,30)}`;
      if(E.length){b.textContent="Abrir";b.onclick=()=>{const x=$("#exr-"+E[0].id);if(x){x.scrollIntoView({block:"center"});x.classList.add("pflash");setTimeout(()=>x.classList.remove("pflash"),1600)}}}
      else{b.textContent="Importar";b.onclick=()=>ofImport(c)}li.appendChild(b);ul.appendChild(li)});d.appendChild(s)});
  return d}
const ofGuess=R=>/\b(enare|enamed|revalida|enade|inep|usp|unifesp|unicamp|sus[- ]?sp|ses[- ]|amrigs|psu|einstein|s[ií]rio|iamspe|iscmsp|santa casa|fmj|puc|sesap|uepa|iff|fiocruz|ebserh|hcpa|ufrn|ufpe|ufmg|ufrj)\b/i.test([R.banca,R.name].join(" "));
