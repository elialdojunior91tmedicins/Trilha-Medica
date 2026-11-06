/* ---------- figuras das provas (Lote 15): uma imagem por questão, recortada do PDF ----------
   exFigs = {"<prova>_<índice>": {id,ex,i,img}} (img = JPEG em data URL). Guardadas no aparelho (IndexedDB "nexus-figs") e na conta (progress/exfig/{id}),
   fora do documento da prova (que tem limite de tamanho). A prova marca a questão com fg:1; a imagem é buscada quando a questão aparece. */
const EXF_MAX=260000;let exFigs={},exFigStore=null,exFigWait={};
let idbP=null;function idb(){if(!idbP)idbP=new Promise((res,rej)=>{try{const r=indexedDB.open("nexus-figs",1);r.onupgradeneeded=()=>{r.result.createObjectStore("f",{keyPath:"id"})};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}catch(e){rej(e)}});return idbP}
async function idbDo(mode,fn){try{const d=await idb();return await new Promise((res,rej)=>{const t=d.transaction("f",mode),st=t.objectStore("f"),q=fn(st);t.oncomplete=()=>res(q&&q.result);t.onerror=()=>rej(t.error)})}catch(e){return null}}
const exfOk=x=>!!x&&typeof x==="object"&&typeof x.id==="string"&&typeof x.ex==="string"&&typeof x.img==="string"&&/^data:image\/jpeg;base64,/.test(x.img)&&x.img.length<=EXF_MAX;
const exfClean=x=>({id:x.id,ex:x.ex,i:+x.i||0,img:x.img});
async function exfPut(x){exFigs[x.id]=x;await idbDo("readwrite",st=>st.put(x));const k="exf:"+x.id;if(exFigStore)try{await exFigStore.doc(x.id).set({...x});saveOk(k)}catch(e){if(exFigs[x.id])saveFail(k,"figura de prova",e,()=>exfPut(x))}}
async function exfDel(id){delete exFigs[id];await idbDo("readwrite",st=>st.delete(id));if(exFigStore)try{await exFigStore.doc(id).delete()}catch(e){}}
idbDo("readonly",st=>st.getAll()).then(L=>{(L||[]).filter(exfOk).forEach(x=>{if(!exFigs[x.id])exFigs[x.id]=exfClean(x)})});
/* a imagem de uma questão: da memória, do aparelho ou da conta (e redesenha quando chega) */
function exFig(ex,i){const id=ex.id+"_"+i;if(exFigs[id])return exFigs[id].img;if(!exFigWait[id]){exFigWait[id]=1;(async()=>{let x=await idbDo("readonly",st=>st.get(id));
    if(!exfOk(x)&&exFigStore)try{const d=await exFigStore.doc(id).get();const v=d&&(typeof d.data==="function"?d.data():d.data);if(exfOk(v)){x=exfClean(v);idbDo("readwrite",st=>st.put(x))}}catch(e){}
    if(exfOk(x)){exFigs[id]=exfClean(x);render()}else exFigWait[id]=2})()}return ""}
/* figuras órfãs (prova apagada e fora da lixeira) saem */
function exfPurge(){const keep=new Set([...exams.map(e=>e.id),...trash.filter(t=>t.kind==="exam").map(t=>{try{return JSON.parse(t.j).ex.id}catch(e){return ""}})]);Object.values(exFigs).forEach(x=>{if(x.ex!=="bank"&&!keep.has(x.ex))exfDel(x.id)})}
/* na importação: em que questão fica cada figura. Página com uma questão só: nela. Com várias: a questão cujo título está logo acima da imagem
   (posição do texto "Questão N" na página); imagem no alto da página, antes de qualquer título: a questão que vinha da página anterior. */
async function pdfQHeads(doc,n){try{const pg=await doc.getPage(n),tc=await pg.getTextContent(),out=[];tc.items.forEach(it=>{const m=String(it.str||"").match(/^\s*(?:quest[aã]o\s*(?:n[ºo°.]\s*)?)?(\d{1,3})\s*(?:[—–\-:.)]|$)/i);if(m&&(/quest/i.test(it.str)||/^\s*\d{1,3}\s*[.)]/.test(it.str)))out.push({n:+m[1],y:it.transform[5]})});return out}catch(e){return []}}
async function impFigAssign(R,qs){if(!R.doc||!R.figs||!R.figs.length)return [];const out=[];
  for(const f of R.figs){const C=qs.map((r,j)=>({r,j})).filter(({r})=>r.p&&r.p<=f.n&&(r.pe||r.p)>=f.n);if(!C.length)continue;let pick=C.length===1?C[0]:null;
    if(!pick){const H=await pdfQHeads(R.doc,f.n),top=Math.max(...f.rs.map(r=>r[3])),above=C.map(c=>({c,h:H.find(h=>h.n===c.r.n)})).filter(x=>x.h&&x.h.y>=top-6).sort((a,b)=>a.h.y-b.h.y);
      pick=above.length?above[0].c:C.find(c=>c.r.p<f.n)||C.find(c=>c.r.im)||null}
    if(pick&&!out.some(o=>o.j===pick.j))out.push({j:pick.j,f})}
  return out}
async function exDel(id){const ex=exams.find(x=>x.id===id);if(!ex)return;const P=exProg.find(x=>x.id===id);
  toTrash("exam",ex.name,`${ex.qs.length} ${ex.qs.length===1?"questão":"questões"}${ex.banca?" · "+ex.banca:""}`,{ex,pg:P||null});
  exams=exams.filter(x=>x!==ex);exProg=exProg.filter(x=>x.id!==id);clearTimeout(exATimer[id]);delete exATimer[id];exSaveLocal();
  if(exRun&&exRun.id===id)exRun=null;if(exEdit&&exEdit.id===id)exEdit=null;render();
  if(exStore)try{await exStore.doc(id).delete()}catch(e){}if(exPStore)try{await exPStore.doc(id).delete()}catch(e){}}
/* contagem no acerto dos temas: cada resposta válida (tema, gabarito, não anulada) vale 1 questão no dia em que foi respondida */
const exSrc=ex=>ex.banca||"Prova importada";
function exContrib(ex,i){const r=ex.qs[i];if(!r||r.an||!r.q.correta)return [];const P=exPg(ex.id),A=[...(P.h[i]||[]),...(P.a[i]?[P.a[i]]:[])],main=r.k&&BYKEY[r.k]?r.k:"";
  const extra=[...new Set([...(main?exKs(r):[]),...(ex.links||[]).filter(x=>x.startsWith("O:")).map(exRefKey)].filter(k=>k&&k!==main))];
  return A.flatMap(a=>{const c=a.l===r.q.correta?1:0;return [...(main?[{k:main,d:a.d,c}]:[]),...extra.map(k=>({k,d:a.d,c,x:1}))]})}
function exCount(L,sign,src){L.forEach(c=>{upd(c.k,x=>addQ(x,sign,sign*c.c,c.d,src));if(c.x)return;const h=hist[c.d]||(hist[c.d]={});h.q=Math.max(0,(h.q||0)+sign);if(c.c)h.c=Math.max(0,(h.c||0)+sign*c.c)});
  if(L.length)try{localStorage.setItem(LSH,JSON.stringify(hist))}catch(e){}}
function exChange(ex,i,fn){const b=exContrib(ex,i);fn(ex.qs[i],exPg(ex.id));const a=exContrib(ex,i),left=[...b],add=[];
  a.forEach(c=>{const j=left.findIndex(x=>x.k===c.k&&x.d===c.d&&x.c===c.c&&!!x.x===!!c.x);if(j>=0)left.splice(j,1);else add.push(c)});
  exCount(left,-1,exSrc(ex));exCount(add,1,exSrc(ex));return left.length+add.length>0}
/* provas ligadas a temas da residência e a conteúdos da faculdade: ex.links=["T:<chave>","O:<id>"].
   O tema de cada questão continua contando como sempre; ligar a um conteúdo da faculdade (O:) faz cada resposta contar TAMBÉM nele
   (contribuição extra x:1, que não entra no histórico do dia), sem contar duas vezes quando ele já é ligado ao mesmo tema da questão. */
let exLinkEd=null;
function exRefKey(r){const x=refTopic(r);return x&&BYKEY[x.k]?x.k:""}
function exRefOf(k){const it=BYKEY[k];return it&&it.own&&/^F-/.test(k)?"O:"+k.slice(2):"T:"+k}
function exLinkKeys(ex){return [...new Set((ex.links||[]).map(exRefKey).filter(Boolean))]}
function exForTopic(k){return exams.map(ex=>{const qi=ex.qs.map((r,i)=>r.k===k||(r.ks||[]).includes(k)?i:-1).filter(i=>i>=0),linked=exLinkKeys(ex).includes(k);return qi.length||linked?{ex,qi,linked}:null}).filter(Boolean)}
function exRelink(ex,links){const B=ex.qs.map((_,i)=>exContrib(ex,i));ex.links=[...new Set(links)].slice(0,12);const A=ex.qs.map((_,i)=>exContrib(ex,i)),left=[],add=[];
  B.forEach((b,i)=>{const l=[...b];A[i].forEach(c=>{const j=l.findIndex(x=>x.k===c.k&&x.d===c.d&&x.c===c.c&&!!x.x===!!c.x);if(j>=0)l.splice(j,1);else add.push(c)});left.push(...l)});
  exCount(left,-1,exSrc(ex));exCount(add,1,exSrc(ex));exPut(ex);commit();render()}
function exLinkLabel(r){const k=exRefKey(r),it=BYKEY[k];if(!it)return "";return r.startsWith("O:")?(fac.own[r.slice(2)]||{}).t||it.t:it.t}
function exLinksEl(ex){const E=exLinkEd,w=el(`<div class="exlinks"><span class="glabel">Ligar esta prova a temas</span><p class="how hx">Ligada a um tema da residência ou a um conteúdo da faculdade (SP, conteúdo FAC), a prova aparece dentro dele. Num conteúdo da faculdade, o acerto da prova conta também nele (sem contar duas vezes se ele já for ligado ao mesmo tema da questão).</p><div class="exlchips"></div></div>`);
  const ch=w.querySelector(".exlchips");(ex.links||[]).forEach((r,i)=>{const lab=exLinkLabel(r);if(!lab)return;const b=el(`<button class="fchip" type="button"></button>`);b.id=`exlx-${ex.id}-${i}`;b.textContent=`${r.startsWith("O:")?"FAC · ":""}${lab} ×`;b.title="Tirar a ligação";b.onclick=()=>exRelink(ex,ex.links.filter(x=>x!==r));ch.appendChild(b)});
  if(!ch.children.length)ch.appendChild(el(`<span class="how">Ainda não ligada.</span>`));
  const cnt={};ex.qs.forEach(r=>{if(r.k&&BYKEY[r.k])cnt[r.k]=(cnt[r.k]||0)+1});const have=new Set(exLinkKeys(ex)),sug=Object.entries(cnt).filter(([k])=>!have.has(k)).sort((a,b)=>b[1]-a[1]).slice(0,4);
  if(sug.length){const s=el(`<div class="exlsug"><span class="how">Sugestões (temas das questões):</span></div>`);sug.forEach(([k,n],i)=>{const b=el(`<button class="chip" type="button"></button>`);b.id=`exls-${ex.id}-${i}`;b.textContent=`+ ${BYKEY[k].t} · ${n}`;b.onclick=()=>exRelink(ex,[...(ex.links||[]),exRefOf(k)]);s.appendChild(b)});w.appendChild(s)}
  const sr=el(`<input class="search" type="search" autocomplete="off" placeholder="Buscar tema da residência ou conteúdo da faculdade">`);sr.id="exlq-"+ex.id;sr.value=E.q||"";sr.oninput=debounced(()=>{if(exLinkEd!==E)return;E.q=sr.value;render()});w.appendChild(sr);
  const n=norm((E.q||"").trim());if(n.length>=2){const ul=el(`<ul class="qrres"></ul>`);[...ALL,...FAC_ITEMS].filter(x=>!have.has(x.key)&&norm(x.t+" "+(x.sp||"")).includes(n)).slice(0,7).forEach((x,i)=>{const li=el(`<li><button type="button" class="qrpick"><b></b><span></span></button></li>`),b=li.querySelector("button");b.id=`exlr-${ex.id}-${i}`;
    li.querySelector("b").textContent=x.t;li.querySelector("span").textContent=x.own?`Faculdade · ${x.sp||""}`:`${x.area.code} · ${x.sp||""}`;b.onclick=()=>{E.q="";exRelink(ex,[...(ex.links||[]),exRefOf(x.key)])};ul.appendChild(li)});
    if(!ul.children.length)ul.appendChild(el(`<li class="how">Nada encontrado.</li>`));w.appendChild(ul)}
  const f=el(`<button class="link" type="button">Fechar</button>`);f.onclick=()=>{exLinkEd=null;render()};w.appendChild(f);return w}
/* dentro do tema (aba Questões): provas na íntegra com questões dele ou ligadas a ele */
function exTopicEl(it){const L=exForTopic(it.key);if(!L.length)return null;const w=el(`<div class="grp extopic"><span class="glabel">Provas na íntegra · ${L.length}</span><ul class="extl"></ul></div>`),ul=w.querySelector("ul");
  L.forEach(({ex,qi,linked})=>{const P=exPg(ex.id);let a=0,c=0;qi.forEach(i=>{const x=P.a[i];if(x&&!ex.qs[i].an&&ex.qs[i].q.correta){a++;if(x.l===ex.qs[i].q.correta)c++}});
    const li=el(`<li><div class="extn"><b></b><span class="ks"></span></div><button class="mini" type="button">Ver a prova</button></li>`);li.querySelector("b").textContent=ex.name;
    li.querySelector(".ks").textContent=[ex.banca&&ex.ano?ex.banca+" "+ex.ano:ex.banca||ex.ano,qi.length?`${qi.length} ${qi.length===1?"questão deste tema":"questões deste tema"}`:"",a?`acerto ${pct(c,a)}% (${c} de ${a})`:"",linked?"ligada":""].filter(Boolean).join(" · ");
    li.querySelector("button").onclick=()=>{backStack=[];exLinkEd=null;setView("quest");if(typeof setQSeg==="function")setQSeg("praticar","provas");setTimeout(()=>{const x=document.getElementById("exr-"+ex.id);if(x){x.scrollIntoView({block:"center"});x.classList.add("eflash");setTimeout(()=>x.classList.remove("eflash"),1600)}},80)};ul.appendChild(li)});
  return w}

/* depois da prova: especialidades em queda (3+ questões, acerto abaixo de 60%), com os temas e as questões erradas */
const EX_DROP=.6,EX_DROP_MIN=3;
function exLost(ex){const P=exPg(ex.id),sp={};
  ex.qs.forEach((r,i)=>{const a=P.a[i],it=r.k&&BYKEY[r.k];if(!a||r.an||!r.q.correta||!it)return;const id=specId(it),x=sp[id]||(sp[id]={id,lab:`${it.area.code} · ${it.sp||it.area.name}`,c:0,q:0,tops:{}});
    x.q++;if(a.l===r.q.correta){x.c++;return}const tp=x.tops[it.key]||(x.tops[it.key]={k:it.key,qs:[]});tp.qs.push(i)});
  return Object.values(sp).filter(x=>x.q>=EX_DROP_MIN&&x.c/x.q<EX_DROP).map(x=>({...x,tops:Object.values(x.tops).sort((a,b)=>b.qs.length-a.qs.length)})).sort((a,b)=>a.c/a.q-b.c/b.q||b.q-a.q)}
function exLostEl(ex,R){const L=exLost(ex);if(!L.length)return null;
  const g=el(`<section class="exlost" aria-labelledby="exlh"><h3 id="exlh">Onde você perdeu pontos</h3><p class="how hx">Especialidades com 3 ou mais questões e acerto abaixo de 60% nesta prova. Abra o tema para estudar ou gere questões; toque numa questão para ver o comentário e, se quiser, levá-la ao caderno de erros.</p></section>`);
  L.forEach((x,n)=>{const s=el(`<div class="exlsp"><div class="exlh"><b></b><span class="ks"></span></div><ul class="exltops"></ul></div>`);s.querySelector("b").textContent=x.lab;
    s.querySelector(".ks").textContent=`${pct(x.c,x.q)}% · ${x.c} de ${x.q}`;const ul=s.querySelector("ul");
    x.tops.forEach(tp=>{const it=BYKEY[tp.k],li=el(`<li><div class="exltt"><button class="link exlopen" type="button"></button><span class="ks"></span></div><div class="exlacts"><span class="exlqs"></span></div></li>`);
      const ob=li.querySelector(".exlopen");ob.textContent=it.t;ob.onclick=()=>{detTab[tp.k]="estudo";openTopic(tp.k)};
      li.querySelector(".ks").textContent=`${tp.qs.length} ${tp.qs.length===1?"errada":"erradas"}`;
      const qs=li.querySelector(".exlqs");tp.qs.forEach(i=>{const r=ex.qs[i],saved=R.cad&&R.cad[i]&&R.cad[i].saved,b=el(`<button class="chip" type="button"></button>`);b.id=`exlq-${i}`;
        b.textContent=`Q${r.n||i+1}${saved?" ✓":""}`;b.title=saved?"Já está no caderno de erros":"Ver o comentário e levar ao caderno de erros";b.onclick=()=>{exRun={id:ex.id,view:"rev",i,cad:R.cad||{}};render();const h=$("#exh");if(h)h.scrollIntoView({block:"start"})};qs.appendChild(b)});
      if(!sampleOff){const gq=el(`<button class="link" type="button">gerar questões</button>`);gq.id=`exlg-${n}-${tp.k}`;gq.onclick=()=>{detTab[tp.k]="questoes";openTopic(tp.k)};li.querySelector(".exlacts").appendChild(gq)}
      ul.appendChild(li)});
    g.appendChild(s)});
  return g}
function exScore(ex){const P=exPg(ex.id);let hit=0,n=0,ans=0,s=0;ex.qs.forEach((r,i)=>{if(r.an||!r.q.correta)return;n++;const a=P.a[i];if(a){ans++;s+=a.s||0;if(a.l===r.q.correta)hit++}});return {hit,n,ans,s}}
function exAnswer(ex,i,l){const R=exRun,P=exPg(ex.id),old=P.a[i];if(old&&old.l===l)return;
  const sec=R&&R.shown?Math.min(1800,Math.max(1,(Date.now()-R.shown)/1000)):0;
  exChange(ex,i,(r,P)=>{P.a[i]={l,d:old?old.d:today(),s:old?old.s:Math.round(sec)}});
  if(!old&&sec)logPace(today(),1,sec);
  const r=ex.qs[i];if(P.mode==="e"&&r.k&&r.q.correta&&!r.an&&l!==r.q.correta&&rdStudied(r.k))rdAdd(r.k,r.q,"exam");
  P.i=i;exPSave(ex.id);commit()}
function exFinish(ex){const P=exPg(ex.id),S=exScore(ex);
  if(!P.fin){P.fin=today();P.tries.push({d:today(),hit:S.hit,n:S.ans,s:Math.round(S.s)});
    if(P.mode==="p")ex.qs.forEach((r,i)=>{const a=P.a[i];if(a&&r.k&&r.q.correta&&!r.an&&a.l!==r.q.correta&&rdStudied(r.k))rdAdd(r.k,r.q,"exam")})}
  exPSave(ex.id);exRun={id:ex.id,view:"res",i:0,cad:{}};commit()}
function exRestart(ex){const P=exPg(ex.id);for(const i in P.a){P.h[i]=[...(P.h[i]||[]),{l:P.a[i].l,d:P.a[i].d}].slice(-10)}P.a={};P.fin="";P.i=0;exPSave(ex.id)}
/* gabarito: "1-A 2-C", "01. B", "Questão 3: D", "4 ANULADA" ou tabela (linha de números + linha de letras) → {número: letra | "X" (anulada)} */
/* gabarito comentado: "RESPOSTA 1 … Correta: B", "Questão 2 – Gabarito: C", "Q3 Resposta correta: letra D" */
function parseKeyStrong(t){const k={};if(!t)return k;const s=String(t).replace(/\r/g,"");let m;
  const r=/(?:resposta|quest[aã]o|q\.?)\s*(\d{1,3})\b((?:(?!resposta\s*\d|quest[aã]o\s*\d)[\s\S]){0,140}?)(?<![A-Za-zÀ-ÿ])(?:alternativa\s+correta|resposta\s+correta|gabarito|correta)\s*[:=\-–—][ \t]*(?:letra\s+|alternativa\s+)?\(?([A-Ea-e]|anulad[ao])\b(?![ \t]+[a-zà-ÿ])/gi;
  while((m=r.exec(s))){const n=+m[1];if(n<1||n>300||k[n])continue;const v=m[3].toUpperCase();k[n]=/^[A-E]$/.test(v)?v:"X";r.lastIndex=m.index+m[0].length}
  /* sem "Correta: X": a justificativa marcada "(correta)" diz a letra ("Justificativa D (correta): …") */
  const r2=/(?:resposta|quest[aã]o)\s*(\d{1,3})\b(?:(?!resposta\s*\d|quest[aã]o\s*\d)[\s\S]){0,1500}?(?:justificativa|alternativa|letra)\s+([A-E])\s*[(\[]\s*correta\s*[)\]]/gi;
  while((m=r2.exec(s))){const n=+m[1];if(n>=1&&n<=300&&!k[n])k[n]=m[2].toUpperCase();r2.lastIndex=m.index+m[0].length}
  return k}
function parseKey(t){const k={};if(!t)return k;const s=String(t).replace(/\r/g,"");let m;{const st=parseKeyStrong(s);if(Object.keys(st).length>=3)return st}
  const r1=/(?:^|[^\d])(\d{1,3})\s*(?:[-–—.:)=]\s*([A-Ea-e])|\s+([A-E]))(?![A-Za-zÀ-ÿ0-9])(?![ \t]+[a-zà-ÿ])/g;
  while((m=r1.exec(s))){const n=+m[1];if(n>=1&&n<=300&&!k[n])k[n]=(m[2]||m[3]).toUpperCase();r1.lastIndex=m.index+m[0].length-1}
  const r2=/(?:^|[^\d])(\d{1,3})\s*[-–—.:)=]?\s*(anulad[ao]|nula\b|\*)/gi;while((m=r2.exec(s))){const n=+m[1];if(n>=1&&n<=300)k[n]="X"}
  const L=s.split("\n").map(x=>x.trim().split(/\s+/).filter(Boolean));
  for(let i=0;i+1<L.length;i++){const a=L[i],b=L[i+1];if(a.length>=3&&a.length===b.length&&a.every(x=>/^\d{1,3}$/.test(x))&&b.every(x=>/^([A-E]|X|\*|ANULADA)$/i.test(x)))a.forEach((x,j)=>{const v=b[j].toUpperCase();k[+x]=/^[A-E]$/.test(v)?v:"X"})}
  Object.assign(k,parseKeyStrong(s));return k}
const keyText=k=>Object.keys(k).map(Number).sort((a,b)=>a-b).map(n=>`${n}-${k[n]==="X"?"ANULADA":k[n]}`).join(", ");
/* página só de gabarito (não vai para o Claude como questões). Gabarito comentado conta com 1 resposta, desde que a página não tenha alternativas "A)" */
function keyPage(t){const n=Object.keys(parseKey(t)).length,alts=(String(t).match(/(?:^|\n)\s*\(?[A-E]\)\s/g)||[]).length;
  return /gabarito/i.test(t)&&n>=3||n>=25&&t.length<n*40||Object.keys(parseKeyStrong(t)).length>=1&&alts<2}
/* leitor de PDF (pdf.js, carregado só quando usado; roda na própria página, sem worker) */
let pdfjsP=null;
const PDFJS2="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/";// reserva: versão moderna no cdnjs
function pdfLib(){return pdfjsP||(pdfjsP=(async()=>{let b=window.__pdfjsBase||PDFJS,lib;try{lib=await import(b+"pdf.min.mjs")}catch(e){b=PDFJS2;lib=await import(b+"pdf.min.mjs")}
  if(!(globalThis.pdfjsWorker&&globalThis.pdfjsWorker.WorkerMessageHandler)){const w=await import(b+"pdf.worker.min.mjs");if(!(globalThis.pdfjsWorker&&globalThis.pdfjsWorker.WorkerMessageHandler))globalThis.pdfjsWorker={WorkerMessageHandler:w.WorkerMessageHandler}}
  lib.GlobalWorkerOptions.workerSrc=b+"pdf.worker.min.mjs";return lib})().catch(e=>{pdfjsP=null;throw e}))}
async function pdfPageText(pg){const tc=await pg.getTextContent();let s="",y0=null,x1=null;
  for(const it of tc.items){if(typeof it.str!=="string")continue;const x=it.transform[4],y=it.transform[5];
    if(y0!==null&&Math.abs(y-y0)>Math.max(2,(it.height||0)*0.5)){if(!s.endsWith("\n"))s+="\n"}
    else if(x1!==null&&x-x1>1.5&&s&&!/\s$/.test(s)&&!/^\s/.test(it.str))s+=" ";
    s+=it.str;if(it.hasEOL)s+="\n";if(it.str)y0=y;x1=x+(it.width||0)}
  return s.replace(/[ \t]+\n/g,"\n").replace(/\n{3,}/g,"\n\n").trim().split("\n").map(mwLine).join("\n")}// B4: texto desenhado em dobro (Medway) vira uma vez só
/* páginas com figura: imagem de pelo menos 150×150 px que não aparece em boa parte das páginas (logo/fundo do slide ficam de fora) */
async function pdfFigPages(doc,ns){const lib=await pdfLib(),O=lib.OPS,ops=[O.paintImageXObject,O.paintInlineImageXObject,O.paintImageXObjectRepeat].filter(x=>x!==undefined),per={},cnt={};
  const mul=(m,n)=>[m[0]*n[0]+m[2]*n[1],m[1]*n[0]+m[3]*n[1],m[0]*n[2]+m[2]*n[3],m[1]*n[2]+m[3]*n[3],m[0]*n[4]+m[2]*n[5]+m[4],m[1]*n[4]+m[3]*n[5]+m[5]];
  for(const n of ns){const pg=await doc.getPage(n),L=await pg.getOperatorList(),ims=[];let ctm=[1,0,0,1,0,0];const st=[];
    L.fnArray.forEach((f,i)=>{const a=L.argsArray[i]||[];
      if(f===O.save)st.push(ctm);else if(f===O.restore)ctm=st.pop()||[1,0,0,1,0,0];else if(f===O.transform)ctm=mul(ctm,a);
      else if(f===O.paintFormXObjectBegin){st.push(ctm);if(Array.isArray(a[0])&&a[0].length===6)ctm=mul(ctm,a[0])}else if(f===O.paintFormXObjectEnd)ctm=st.pop()||[1,0,0,1,0,0];
      else if(ops.includes(f)){const w=+a[1]||0,h=+a[2]||0;if(w<150||h<150)return;/* a imagem ocupa o quadrado 0..1 transformado pela matriz atual */
        const P=[[0,0],[1,0],[0,1],[1,1]].map(([x,y])=>[ctm[0]*x+ctm[2]*y+ctm[4],ctm[1]*x+ctm[3]*y+ctm[5]]);
        ims.push({key:w+"x"+h,r:[Math.min(...P.map(p=>p[0])),Math.min(...P.map(p=>p[1])),Math.max(...P.map(p=>p[0])),Math.max(...P.map(p=>p[1]))]})}});
    per[n]=ims;new Set(ims.map(x=>x.key)).forEach(k=>{cnt[k]=(cnt[k]||0)+1})}/* o pdf.js dá nomes diferentes por página à mesma imagem: compara pelo tamanho */
  const lim=Math.max(3,Math.ceil(ns.length*.6));
  return ns.map(n=>({n,rs:per[n].filter(x=>cnt[x.key]<lim||ns.length<=2).map(x=>x.r)})).filter(x=>x.rs.length)}
/* figura recortada: a área das imagens da página (com uma margem); se o recorte não fizer sentido, a página inteira */
async function pdfFigImg(pg,rs){const v0=pg.getViewport({scale:1}),sc=Math.min(3,1400/v0.width),vp=pg.getViewport({scale:sc}),cv=document.createElement("canvas");
  cv.width=Math.round(vp.width);cv.height=Math.round(vp.height);const ctx=cv.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,cv.width,cv.height);await pg.render({canvasContext:ctx,canvas:cv,viewport:vp}).promise;
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;const T=vp.transform;rs.forEach(r=>[[r[0],r[1]],[r[2],r[3]],[r[0],r[3]],[r[2],r[1]]].forEach(([x,y])=>{const X=T[0]*x+T[2]*y+T[4],Y=T[1]*x+T[3]*y+T[5];x0=Math.min(x0,X);x1=Math.max(x1,X);y0=Math.min(y0,Y);y1=Math.max(y1,Y)}));
  const m=Math.round(3*sc);x0=Math.max(0,Math.floor(x0-m));y0=Math.max(0,Math.floor(y0-m));x1=Math.min(cv.width,Math.ceil(x1+m));y1=Math.min(cv.height,Math.ceil(y1+m));
  const w=x1-x0,h=y1-y0;let out=cv;if(w>=60&&h>=60&&w*h<cv.width*cv.height*.92){out=document.createElement("canvas");const k=Math.min(1,1100/w);out.width=Math.round(w*k);out.height=Math.round(h*k);
    const c2=out.getContext("2d");c2.fillStyle="#fff";c2.fillRect(0,0,out.width,out.height);c2.drawImage(cv,x0,y0,w,h,0,0,out.width,out.height)}
  else if(cv.width>1100){out=document.createElement("canvas");out.width=1100;out.height=Math.round(cv.height*1100/cv.width);out.getContext("2d").drawImage(cv,0,0,out.width,out.height)}
  return await new Promise(r=>out.toBlob(b=>r(b),"image/jpeg",.82))}
async function pdfPageImg(pg,W=1500,Q=.82){const v0=pg.getViewport({scale:1}),sc=Math.min(2.2,W/v0.width),vp=pg.getViewport({scale:sc}),cv=document.createElement("canvas");
  cv.width=Math.round(vp.width);cv.height=Math.round(vp.height);const ctx=cv.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,cv.width,cv.height);
  await pg.render({canvasContext:ctx,canvas:cv,viewport:vp}).promise;return await new Promise(r=>cv.toBlob(b=>r(b),"image/jpeg",Q))}
async function pdfOpenTxt(file,onPage){const lib=await pdfLib();const doc=await lib.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false,disableFontFace:true}).promise;
  const pages=[];for(let n=1;n<=doc.numPages;n++){const t=await pdfPageText(await doc.getPage(n));pages.push({n,t,img:t.replace(/\s/g,"").length<60});if(onPage)onPage(n,doc.numPages)}return {doc,pages}}
const BANCAS=["ENARE","UNIFESP","UNICAMP","SUS-SP","SES-DF","AMRIGS","PSU-MG","PSU-GO","SURCE","UFRJ","UERJ","HCPA","UFPR","UNESP","SANTA CASA","EINSTEIN","IAMSPE","UFMG","UFBA","UFPE","SES-PE","HCFMRP","UFSC","AREMG","USP-RP","USP"];
function impGuess(R){const s=(R.name+" "+(R.pages[0]?R.pages[0].t.slice(0,1500):"")).toUpperCase();
  if(!R.banca){const b=BANCAS.find(x=>new RegExp("(^|[^A-Z])"+x.replace(/-/g,"[- ]?")+"([^A-Z]|$)").test(s));if(b)R.banca=b}
  if(!R.ano){const m=s.match(/(?:^|\D)(20[0-4]\d|199\d)(?!\d)/);if(m)R.ano=m[1]}}
/* importação: escolher → (ler o PDF aqui) → pronto → ler com o Claude em partes → conferir → salvar */
function impNew(){imp={st:"pick",name:"",banca:"",ano:"",pages:[],doc:null,blobs:{},keyPg:[],keyTxt:"",keyFile:"",paste:"",qs:[],done:new Set(),fail:[],msg:"",err:"",flt:"all",show:12,T:null};exRun=null;exEdit=null;render();
  setTimeout(()=>{const p=$("#impPanel");if(p)p.scrollIntoView({behavior:"smooth",block:"center"})},60)}
async function impPick(files){const R=imp;files=[...(files||[])];if(!R||!files.length)return;const f0=files[0],isPdf=f0.type==="application/pdf"||/\.pdf$/i.test(f0.name);
  R.st="scan";R.err="";R.msg="Abrindo o arquivo…";R.qs=[];R.done=new Set();R.fail=[];R.keyPg=[];render();
  try{if(isPdf){let lib=null;try{lib=await pdfLib()}catch(e){throw {code:"lib"}}
      const o=await pdfOpenTxt(f0,(n,t)=>{R.msg=`Lendo o PDF aqui no aparelho: página ${n} de ${t}…`;const s=$("#impSt");if(s)s.textContent=R.msg});R.doc=o.doc;R.pages=o.pages;
      {const sh=mwSheet(R.pages);if(sh){R.pages=R.pages.filter(p=>!sh.pg.includes(p.n));R.mwAn=sh.an}}}
    else{R.doc=null;R.pages=[];R.blobs={};let n=0;for(const f of files){if(!/^image\//.test(f.type))continue;n++;R.blobs[n]=await imgShrink(f);R.pages.push({n,t:"",img:true})}}
    if(imp!==R)return;if(!R.pages.length)throw {code:"empty"};
    if(!R.name)R.name=f0.name.replace(/\.[a-z0-9]+$/i,"").replace(/[_]+/g," ").replace(/\s+/g," ").trim().slice(0,100);
    impGuess(R);R.keyPg=R.pages.filter(p=>p.t&&keyPage(p.t)).map(p=>p.n);
    R.figs=[];if(R.doc)try{R.figs=await pdfFigPages(R.doc,R.pages.filter(p=>!R.keyPg.includes(p.n)&&!p.img).map(p=>p.n))}catch(e){R.figs=[]}
    R.st="ready";R.msg=""}
  catch(e){if(imp!==R)return;R.st="pick";R.msg="";R.err=e&&e.code==="lib"?"Não foi possível abrir o leitor de PDF. Confira a internet e tente de novo.":e&&e.code==="empty"?"Escolha um PDF ou fotos das páginas.":
    /password/i.test(String(e&&(e.name||e.message)))?"Este PDF tem senha. Abra-o, salve uma cópia sem senha e tente de novo.":"Não consegui ler este PDF. Ele pode estar corrompido; tente outro arquivo ou fotos das páginas."}
  render()}
async function impKeyFile(f){const R=imp;if(!R||!f)return;R.err="";
  if(!(f.type==="application/pdf"||/\.pdf$/i.test(f.name))){R.err="O gabarito em arquivo precisa ser PDF. Se for foto, digite as respostas em Colar o gabarito.";render();return}
  try{const o=await pdfOpenTxt(f);R.keyTxt=o.pages.map(p=>p.t).join("\n");R.keyFile=f.name;if(!Object.keys(parseKey(R.keyTxt)).length)R.err="Não reconheci respostas neste PDF (ele pode ser uma imagem). Digite o gabarito em Colar o gabarito."}
  catch(e){R.err="Não consegui ler o PDF do gabarito."}
  if(R.st==="review")impApplyKey(R,impKey(R));render()}
/* folha de rascunho do fim (Medway): "RESPOSTAS" e as linhas 01 A B C D E; as anuladas vêm escritas ("53 Anulada"). Sai das páginas e vira anulada no gabarito */
function mwSheet(pages){const pg=[],an=new Set();pages.forEach(p=>{const t=p.t||"",rows=(t.match(/\b(\d{2})\1?\s+(?:A{1,2}\s+B{1,2}\s+C{1,2}|(?:Anulada){1,2})/g)||[]).length;
    if(rows>=40||rows>=20&&/RESPOSTAS|GABARITO|RASCUNHO/i.test(t)){pg.push(p.n);let m;const re=/\b(\d{2})\1?\s+(?:Anulada){1,2}/g;while((m=re.exec(t)))an.add(+m[1])}});
  return pg.length?{pg,an:[...an].filter(n=>n>=1&&n<=300).sort((a,b)=>a-b)}:null}
function impKey(R){const k={};(R.mwAn||[]).forEach(n=>{k[n]="X"});R.pages.forEach(p=>{if(p.t&&!R.keyPg.includes(p.n))Object.assign(k,parseKeyStrong(p.t))});/* página mista: questões no começo, gabarito comentado no fim */
  /* gabarito comentado em várias páginas ("RESPOSTA N — Correta: X"): junta as páginas e usa só esse formato, que não confunde números do texto (t(15;17)…) com respostas */
  const kp=R.keyPg.map(n=>(R.pages.find(p=>p.n===n)||{}).t||"").join("\n");if(Object.keys(parseKeyStrong(kp)).length>=3)Object.assign(k,parseKeyStrong(kp));else Object.assign(k,parseKey(kp));
  [R.keyTxt,R.paste].forEach(t=>Object.assign(k,parseKey(t)));return k}
/* Lote 20D: onde começa cada questão (página), pelo texto do aparelho. Só vale numeração em sequência (1, 2, 3…); se recomeça (por área)
   ou pula demais, devolve null e as partes voltam a ser por páginas. */
function impQStarts(R){const QA=/^\s*(?:quest[aã]o|QUEST[AÃ]O)\s*(?:n[ºo°.]\s*)?(\d{1,3})\b/i,QB=/^\s*(\d{1,3})\s*[.)–—-]\s+\S/;
  const L=[];R.pages.forEach(p=>{if(p.img||!p.t||R.keyPg.includes(p.n))return;p.t.split("\n").forEach(x=>L.push({p:p.n,x}))});if(!L.length)return null;
  const run=re=>{const out=[];let prev=0,restart=false;L.forEach(l=>{const m=l.x.match(re);if(!m)return;const n=+m[1];if(!prev?n>=1&&n<=300:n===prev+1){out.push({n,p:l.p});prev=n}else if(re===QA&&prev>=3&&n===1)restart=true});return {out,restart}};
  let A=run(QA);if(A.out.length<5){const B=run(QB);if(B.out.length>A.out.length)A=B}
  if(A.restart||A.out.length<5)return null;const map={};A.out.forEach(x=>{if(!map[x.n])map[x.n]=x.p});return {map,list:A.out.map(x=>x.n)}}
const IMP_QCAP=20;
function impBlocks(R,only){const site=!!window.__site,LIM=site?48000:11000,MAXP=site?20:5,MAXI=site?8:Math.max(1,Math.min(4,R.maxImg||4)),out=[];let cur=null;
  /* site: partes de até IMP_QCAP questões (o que vier antes: 20 páginas ou ~20 questões), sem partir questão: a página dividida vai nas duas partes */
  const QS=impQStarts(R);R.qStart=QS?QS.map:null;
  if(QS&&!only){const qp=R.pages.filter(p=>!R.keyPg.includes(p.n)&&!p.img).map(p=>p.n),lastP=Math.max(...qp),list=QS.list,pg=n=>QS.map[n];let i=0;
    while(i<list.length){let j=i;while(j+1<list.length&&j+1-i<IMP_QCAP){const nxt=list[j+1],endP=list[j+2]!==undefined?pg(list[j+2]):lastP,span=endP-pg(list[i])+1;
        const txt=R.pages.filter(p=>p.n>=pg(list[i])&&p.n<=endP).reduce((a,p)=>a+(p.t||"").length,0);if(span>MAXP||txt>LIM)break;j++}
      const a=pg(list[i]),z=list[j+1]!==undefined?pg(list[j+1]):lastP,pages=R.pages.filter(p=>p.n>=a&&p.n<=z&&!R.keyPg.includes(p.n)&&!p.img).map(p=>p.n);
      out.push({img:false,pages,len:pages.reduce((s,n)=>s+((R.pages.find(p=>p.n===n)||{}).t||"").length,0),qa:list[i],qz:list[j]});i=j+1}
    /* páginas escaneadas continuam como imagem */
    R.pages.filter(p=>p.img&&!R.keyPg.includes(p.n)).forEach(p=>{const l=out[out.length-1];if(l&&l.img&&l.pages.length<MAXI&&p.n===l.pages[l.pages.length-1]+1)l.pages.push(p.n);else out.push({img:true,pages:[p.n],len:0})});
    return out}
  for(const p of R.pages){if(R.keyPg.includes(p.n)||(only&&!only.includes(p.n)))continue;
    const last=cur&&cur.pages[cur.pages.length-1];
    if(!cur||cur.img!==p.img||p.n!==last+1||cur.pages.length>=(p.img?MAXI:MAXP)||!p.img&&cur.len+p.t.length>LIM){cur={img:p.img,pages:[],len:0};out.push(cur)}
    cur.pages.push(p.n);cur.len+=p.t.length}
  return out}
const impTopics=()=>ALL.map(i=>`${i.key} · ${i.t} · ${i.area.code}${i.sp?" / "+i.sp:""}`).join("\n");
/* gabarito comentado: o trecho de cada resposta (justificativas da prova), para o Claude usar como base do comentário */
function keyComments(R){const txt=[...R.pages.map(p=>p.t||""),R.keyTxt||""].join("\n"),out={};
  const re=/(?:^|\n)[ \t]*(?:resposta|quest[aã]o)\s*(\d{1,3})\b/gi,cuts=[];let m;while((m=re.exec(txt)))cuts.push({n:+m[1],i:m.index});
  cuts.forEach((c,j)=>{const seg=txt.slice(c.i,j+1<cuts.length?cuts[j+1].i:txt.length).trim();if(!out[c.n]&&Object.keys(parseKeyStrong(seg)).length&&seg.length>40)out[c.n]=seg.slice(0,1600)});
  return out}
function impPrompt(R,b,key){const a=b.pages[0],z=b.pages[b.pages.length-1],one=a===z,pg=one?`a página ${a}`:`as páginas ${a} a ${z}`,site=!!window.__site,kn=Object.keys(key).length;
  const nxt=!b.img&&R.pages.find(p=>p.n===z+1&&!p.img&&!R.keyPg.includes(p.n)),rawKey=!kn&&(R.keyTxt||"").trim();
  const KC=keyComments(R),bt=b.pages.map(n=>(R.pages.find(p=>p.n===n)||{}).t||"").join("\n"),bn=[...new Set([...bt.matchAll(/quest[aã]o\s*(\d{1,3})\b/gi)].map(x=>+x[1]))];
  const KCL=site?40000:14000,rng=b.qa?Array.from({length:b.qz-b.qa+1},(_,i)=>b.qa+i):null;
  let kc="";(rng||(bn.length?bn:Object.keys(KC).map(Number))).forEach(n=>{if(KC[n]&&kc.length<KCL)kc+=KC[n]+"\n\n"});kc=kc.trim();
  const src=b.img?(site?`Leia ${pg} do PDF da prova que você vai anexar a esta conversa (se forem fotos, ${one?"a foto "+a:"as fotos "+a+" a "+z}).`:one?`A imagem anexada é a página ${a} da prova.`:`As imagens anexadas são as páginas ${a} a ${z} da prova, nesta ordem.`)
    :`Abaixo está o texto extraído ${one?"da página "+a:"das páginas "+a+" a "+z} do PDF. A extração pode ter quebras de linha fora do lugar, palavras partidas, cabeçalhos, rodapés e números de página: ignore esses restos.`;
  return `Você vai transcrever as questões de uma prova de residência médica para um app de estudos.
Prova: ${R.name||"sem nome"}${R.banca?` · banca ${R.banca}`:""}${R.ano?` · ${R.ano}`:""}.
${src}

O que fazer
1. ${b.qa?`Transcreva SOMENTE as questões de número ${b.qa} a ${b.qz} (${b.qz-b.qa+1} ${b.qz===b.qa?"questão":"questões"}), todas, na ordem, sem pular nenhuma. O texto pode trazer o fim da questão anterior ou o começo da seguinte: ignore o que estiver fora desse intervalo.`:`Transcreva TODAS as questões que começam ${one?"nesta página":"nestas páginas"}, na ordem, sem pular nenhuma.`} Copie enunciado e alternativas fielmente; só junte linhas quebradas e desfaça palavras partidas.${nxt&&!b.qa?" Se a última questão continua na página seguinte, use o trecho CONTINUAÇÃO só para completá-la; não transcreva questões que começam lá.":""}
2. "numero": o número da questão na prova.
3. ${kn?`Resposta: use o GABARITO OFICIAL abaixo e marque "gabarito":"banca". Questão anulada no gabarito: "anulada":true. Se o número não estiver no gabarito, resolva você mesmo e marque "gabarito":"claude".`:rawKey?`Resposta: use o GABARITO OFICIAL (texto extraído) abaixo e marque "gabarito":"banca". Questão anulada: "anulada":true. Se não achar o número no gabarito, resolva você mesmo e marque "gabarito":"claude".`:`A prova veio sem gabarito: resolva cada questão com cuidado, pelas diretrizes brasileiras atuais, e marque "gabarito":"claude". Se tiver dúvida, escolha a mais provável assim mesmo.`}
4. "imagem": true quando a questão depende de figura, gráfico, tabela ou exame de imagem que não dá para ler aqui (ECG, radiografia, foto de lesão). Não invente o que a imagem mostra.
5. "temas": as chaves (ex.: ["CM-34"]) dos temas da lista TEMAS que a questão cobre, o principal primeiro. Normalmente 1; use 2 (no máximo 3) só quando a questão cobre de verdade mais de um tema (ex.: neutropenia febril em paciente com leucemia). [] se nenhum servir.
6. Se a prova ou o gabarito comentado trouxer, para a questão, "Ponto-chave", "Take home message" ou "Fonte", copie-os fielmente em "pontoChave", "takeHome" e "fonte" (sem repetir no comentário); se não trouxer, deixe "".
7. Explicações para estudo, em português: "comentario" (3 a 6 frases: só por que a resposta está certa e o raciocínio para chegar nela, sem comentar as outras alternativas), "conceito" (1 frase com a regra para guardar) e, em cada alternativa errada, "porque" (1 ou 2 frases dizendo por que ela está errada ou em que caso ela seria a resposta; "" na correta). O porquê de cada alternativa vai SEMPRE no "porque" dela, nunca dentro do "comentario". Se a prova trouxer comentário da banca, aproveite.${kc?" Abaixo, em GABARITO COMENTADO, estão as justificativas da própria prova: use-as como base do comentário e do porquê de cada alternativa (reescreva com clareza, sem inventar o que não está lá).":""}
8. Se ${pg} não tiver nenhuma questão (capa, instruções, folha de respostas), responda [].

Responda somente com um array JSON, sem texto antes ou depois, neste formato:
[{"numero":12,"enunciado":"...","alternativas":[{"letra":"A","texto":"...","porque":"..."},{"letra":"B","texto":"...","porque":""}],"correta":"B","anulada":false,"gabarito":"banca","imagem":false,"temas":["CM-34"],"comentario":"...","conceito":"...","pontoChave":"","takeHome":"","fonte":""}]
${kn?`
GABARITO OFICIAL
${keyText(key)}
`:rawKey?`
GABARITO OFICIAL (texto extraído)
${rawKey.slice(0,6000)}
`:""}
TEMAS (chave · tema · área / especialidade)
${impTopics()}
${kc?`
GABARITO COMENTADO (da própria prova)
${kc}
`:""}${b.img?"":`
TEXTO ${one?"DA PÁGINA "+a:"DAS PÁGINAS "+a+" A "+z}
${b.pages.map(n=>`=== Página ${n} ===\n${(R.pages.find(p=>p.n===n)||{}).t||""}`).join("\n\n")}
${nxt&&!b.qa?`
CONTINUAÇÃO (página ${nxt.n}, só para completar a última questão)
${nxt.t.slice(0,1800)}`:""}`}`}
function impValid(data,b){const arr=Array.isArray(data)?data:data&&Array.isArray(data.questoes)?data.questoes:[],out=[];
  arr.forEach(x=>{if(!x||typeof x.enunciado!=="string"||!x.enunciado.trim()||!Array.isArray(x.alternativas))return;
    const L=x.alternativas.map((a,j)=>a&&typeof a==="object"?{letra:String(a.letra||"").toUpperCase().replace(/[^A-Z]/g,"").slice(0,1)||EX_AB[j],texto:String(a.texto||"").trim(),porque:typeof a.porque==="string"?a.porque.trim():""}
      :typeof a==="string"?{letra:EX_AB[j],texto:a.trim(),porque:""}:null).filter(a=>a&&a.texto);
    if(L.length<2||new Set(L.map(a=>a.letra)).size!==L.length)return;const cor=String(x.correta||"").toUpperCase().replace(/[^A-Z]/g,"").slice(0,1),num=parseInt(x.numero,10);
    out.push(exQClean({n:num>0?num:0,p:b.pages[0],pe:b.pages[b.pages.length-1],k:(()=>{const T=(Array.isArray(x.temas)?x.temas:[]).map(t=>String(t||"").trim().toUpperCase()).filter(t=>BYKEY[t]&&!BYKEY[t].own);return T[0]||(typeof x.tema==="string"?x.tema.trim().toUpperCase():"")})(),
      ks:(Array.isArray(x.temas)?x.temas:[]).map(t=>String(t||"").trim().toUpperCase()).filter(t=>BYKEY[t]&&!BYKEY[t].own).slice(1,3),
      q:{enunciado:x.enunciado.trim(),alternativas:L,correta:cor,comentario:typeof x.comentario==="string"?x.comentario.trim():"",conceito:typeof x.conceito==="string"?x.conceito.trim():"",pc:typeof x.pontoChave==="string"?x.pontoChave.trim():"",th:typeof x.takeHome==="string"?x.takeHome.trim():"",fonte:typeof x.fonte==="string"?x.fonte.trim():""},
      g:x.gabarito==="banca"?"b":"c",an:x.anulada===true,im:x.imagem===true,ck:cor}))});
  return out}
function impMerge(R,qs){const sz=r=>r.q.enunciado.length+r.q.alternativas.reduce((a,x)=>a+x.texto.length,0);
  /* Lote 20D: página real de cada questão (pelo texto do aparelho), para a figura ir para a questão certa */
  if(R.qStart)qs.forEach(q=>{const a=R.qStart[q.n];if(a){q.p=a;const nx=R.qStart[q.n+1];q.pe=nx?Math.max(a,nx):Math.max(a,q.pe||a)}});
  qs.forEach(q=>{if(!q.n)q.n=Math.max(0,...R.qs.map(r=>r.n))+1;const j=R.qs.findIndex(r=>r.n===q.n);if(j<0)R.qs.push(q);else if(sz(q)>sz(R.qs[j])*1.1)R.qs[j]=q});R.qs.sort((a,b)=>a.n-b.n)}
function impApplyKey(R,key){R.qs.forEach(r=>{const v=key[r.n];if(!v)return;if(v==="X"){r.an=true;r.g="b"}else if(r.q.alternativas.some(a=>a.letra===v)){r.an=false;r.q.correta=v;r.g="b"}})}
function impStatus(R){const s=$("#impSt");if(s)s.textContent=`Lendo com o Claude: parte ${Math.min(R.prog+1,R.nb)} de ${R.nb} · ${R.qs.length} ${R.qs.length===1?"questão":"questões"} até agora…`}
async function impRead(only){const R=imp;if(!R||!sampleFn)return;R.st="read";R.err="";R.stop=false;R.noImg=false;R.ctl=new AbortController();
  try{const lim=sampleFn.limits?await sampleFn.limits():null;R.canImg=!!(lim&&lim.images);R.maxImg=lim&&lim.images&&lim.images.maxCount||4}catch(e){R.canImg=false}
  const key=impKey(R),blocks=impBlocks(R,only);R.fail=R.fail.filter(n=>!blocks.some(b=>b.pages.includes(n)));R.nb=blocks.length;R.prog=0;render();
  let next=0;const work=async()=>{while(next<blocks.length&&!R.stop&&imp===R){const b=blocks[next++];await impBlock(R,b,key,0);R.prog++;impStatus(R)}};
  await Promise.all(Array.from({length:Math.min(window.__site?1:2,blocks.length)},work));
  if(imp!==R)return;impApplyKey(R,key);R.st="review";R.ctl=null;R.show=12;render();
  setTimeout(()=>{const p=$("#impPanel");if(p)p.scrollIntoView({block:"start"})},40)}
async function impBlock(R,b,key,depth){const site=!!window.__site;
  const opts={signal:R.ctl.signal,cache:false,modelTier:"default",title:`Ler a prova com o Claude · parte ${R.prog+1} de ${R.nb}`,
    hint:b.img?"Copie o pedido, abra uma conversa no app do Claude ou em claude.ai, anexe o PDF da prova (ou as fotos) e cole o pedido.":"Copie o pedido e cole numa conversa nova no app do Claude ou em claude.ai. O texto da prova já vai junto."};
  try{if(b.img&&!site){if(!R.canImg){R.noImg=true;b.pages.forEach(n=>R.fail.push(n));return}
      opts.images=[];for(const n of b.pages)opts.images.push(R.doc?await pdfPageImg(await R.doc.getPage(n)):R.blobs[n])}
    const data=await sampleFn.json(impPrompt(R,b,key),opts);if(imp!==R)return;const got=impValid(data,b);impMerge(R,got);
    /* Lote 20D: resposta cortada (ou o Claude parou antes): pede só as que faltaram, nas mesmas páginas */
    if(b.qa){const have=new Set(R.qs.map(r=>r.n)),miss=[];for(let n=b.qa;n<=b.qz;n++)if(!have.has(n))miss.push(n);
      if(miss.length&&got.length&&depth<3){R.more=(R.more||0)+1;await impBlock(R,{...b,qa:miss[0],qz:miss[miss.length-1]},key,depth+1);return}
      if(miss.length&&!got.length)throw {code:"empty_part"}}
    b.pages.forEach(n=>R.done.add(n))}
  catch(e){if(imp!==R)return;const code=e&&e.code;if(code==="cancelled"){R.stop=true;return}
    if(GEN_OFF.includes(code)||["rate_limited","session_expired","images_unavailable"].includes(code)){R.stop=true;R.err=GEN_OFF.includes(code)?"O Claude não está disponível nesta visualização.":(GEN_ERR[code]||"O Claude não pôde ler as imagens.");return}
    if(b.qa&&b.qz>b.qa&&depth<3&&R.qStart){const h=b.qa+Math.ceil((b.qz-b.qa+1)/2)-1,sub=(a,z)=>{const pa=R.qStart[a],pz=R.qStart[z+1]||Math.max(...b.pages);return {...b,qa:a,qz:z,pages:b.pages.filter(n=>n>=pa&&n<=pz)}};
      await impBlock(R,sub(b.qa,h),key,depth+1);if(!R.stop)await impBlock(R,sub(h+1,b.qz),key,depth+1);return}
    if(b.pages.length>1&&depth<3){const h=Math.ceil(b.pages.length/2);await impBlock(R,{...b,pages:b.pages.slice(0,h)},key,depth+1);if(!R.stop)await impBlock(R,{...b,pages:b.pages.slice(h)},key,depth+1)}
    else b.pages.forEach(n=>R.fail.push(n))}}
const impQPages=R=>R.pages.filter(p=>!R.keyPg.includes(p.n)).map(p=>p.n);
function impGaps(R,key){const have=new Set(R.qs.map(r=>r.n)),kk=Object.keys(key).map(Number),start=kk.length?Math.min(...kk):Math.min(...R.qs.map(r=>r.n)),end=Math.max(0,...kk,...R.qs.map(r=>r.n)),g=[];
  if(!R.qs.length)return g;for(let n=Math.max(1,start);n<=end;n++)if(!have.has(n))g.push(n);return g}
function impGapPages(R,g){const P=new Set();g.forEach(n=>{const a=R.qs.filter(r=>r.n<n).pop(),b=R.qs.find(r=>r.n>n),from=a?a.p:1,to=b?b.pe:R.pages.length;for(let p=from;p<=to;p++)if(!R.keyPg.includes(p))P.add(p)});return [...P].sort((x,y)=>x-y)}
const pgList=L=>{const out=[];L.forEach(n=>{const l=out[out.length-1];if(l&&n===l[1]+1)l[1]=n;else out.push([n,n])});return out.map(([a,b])=>a===b?`${a}`:`${a}–${b}`).join(", ")};
async function impSave(){const R=imp;if(!R||R.saving)return;const qs=R.qs.filter(r=>!r.x);if(!qs.length)return;
  const id="ex"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);let FA=[];
  if(R.doc&&R.figs&&R.figs.length){R.saving=true;R.msg="Recortando as figuras das questões…";render();try{FA=await impFigAssign(R,qs);for(const a of FA){const b=await pdfFigImg(await R.doc.getPage(a.f.n),a.f.rs),u=await exfData(b);if(u){qs[a.j].fg=1;await exfPut({id:id+"_"+a.j,ex:id,i:a.j,img:u})}}}catch(e){}R.saving=false;if(imp!==R)return}
  const ex=exClean({id,name:R.name.trim()||"Prova",banca:R.banca.trim(),ano:R.ano.trim(),at:new Date().toISOString(),qs,...(R.of?{of:1,...(R.niv?{niv:R.niv}:{})}:{}),...(qs.some(r=>r.g==="b"&&!r.an)?{kst:"d"}:{})});
  exams.unshift(ex);exPut(ex);imp=null;exArm=null;render();setTimeout(()=>{const x=document.getElementById("exr-"+ex.id);if(x)x.scrollIntoView({behavior:"smooth",block:"center"})},60)}
/* uma questão para conferir (na importação e depois de salva) */
/* o comentário contradiz o gabarito: outra alternativa diz "Correta" ou o comentário da certa começa com "Incorreta" (gabarito lido errado) */
function exClash(r){const q=r&&r.q;if(!q||r.an||!q.correta)return false;return q.alternativas.some(a=>a.letra!==q.correta&&/^\s*correta\b/i.test(a.porque||""))||/^\s*incorreta\b/i.test(q.comentario||"")||!!(q.alternativas.find(a=>a.letra===q.correta)||{}).porque&&/^\s*incorreta\b/i.test(q.alternativas.find(a=>a.letra===q.correta).porque)}
function exFilterOk(r,f){return f==="all"||f==="chk"&&!r.an&&(r.g!=="b"||!r.q.correta||r.ck&&r.ck!==r.q.correta||exClash(r))||f==="tema"&&!r.k||f==="kg"&&r.kg&&!!r.k||f==="img"&&r.im||f==="x"&&r.x}
function exTopicPick(T,onPick){const w=el(`<div class="extpick"></div>`),s=el(`<label class="ffield"><span class="glabel">${T.add?"Outro tema desta questão":"Tema desta questão"}</span><input class="etext" id="exTq" type="search" placeholder="Buscar tema (ex.: sepse, IAM)" autocomplete="off"></label>`),i=s.querySelector("input");
  i.value=T.q;i.oninput=debounced(()=>{T.q=i.value;render()});w.appendChild(s);const n=norm(T.q.trim());
  if(n.length>=2){const ul=el(`<ul class="qrres"></ul>`);ALL.map(x=>{const t=norm(x.t),sub=norm(subList(x).map(y=>y.t).join(" ")+" "+(x.sp||""));return {x,sc:t.startsWith(n)?3:t.includes(n)?2:sub.includes(n)?1:0}}).filter(r=>r.sc).sort((a,b)=>b.sc-a.sc||a.x.num-b.x.num).slice(0,6)
    .forEach(({x})=>{const li=el(`<li><button type="button" class="qrpick"><b></b><span></span></button></li>`);li.querySelector("b").textContent=x.t;li.querySelector("span").textContent=`${x.area.code} · ${x.sp||x.area.name}`;li.querySelector("button").onclick=()=>onPick(x.key);ul.appendChild(li)});
    if(!ul.children.length)ul.appendChild(el(`<li class="how">Nenhum tema com esse nome.</li>`));w.appendChild(ul)}
  const b=el(`<div class="btns"></div>`),no=el(`<button class="link" type="button">Deixar sem tema</button>`),cl=el(`<button class="link" type="button">Cancelar</button>`);no.onclick=()=>onPick("");cl.onclick=()=>onPick(null);b.append(no,cl);w.appendChild(b);
  setTimeout(()=>{const x=$("#exTq");if(x&&!T.q&&document.activeElement!==x)x.focus({preventScroll:true})},30);return w}
function exRowEl(r,i,C){const li=el(`<li class="exq${r.x?" off":""}"><div class="exqh"><b></b><span class="exbadges"></span></div><p class="exstem" tabindex="0"></p><ol class="exalts"></ol><div class="exctl"></div></li>`);
  li.querySelector("b").textContent=`Questão ${r.n||i+1}`;const bd=li.querySelector(".exbadges"),badge=(t,c)=>{const s=el(`<span class="exb ${c}"></span>`);s.textContent=t;bd.appendChild(s)};
  if(r.an)badge("Anulada","an");else if(!r.q.correta)badge("Sem resposta","warn");else if(r.g==="b")badge("Gabarito da banca","ok");else badge("Gabarito do Claude · conferir","warn");
  if(exClash(r))badge("Comentário contradiz o gabarito · conferir","warn");if(r.im)badge(`Com imagem · pág. ${r.p}`,"im");if(!r.k)badge("Sem tema","warn");else if(r.kg)badge("Tema sugerido · conferir","warn");if(r.x)badge("Descartada","an");
  /* Lote 20D: o que conferir, numa linha só, no topo da questão */
  {const P=[];if(!r.an){if(!r.q.correta)P.push("escolha a resposta");else if(r.g!=="b")P.push("o gabarito é do Claude: confira com o oficial");if(exClash(r))P.push("o comentário contradiz o gabarito");if(r.ck&&r.q.correta&&r.ck!==r.q.correta)P.push(`o comentário foi escrito para a ${r.ck}`)}
    if(!r.k)P.push("escolha o tema");else if(r.kg)P.push("confira o tema sugerido");if(r.im&&!r.fg)P.push(`a imagem está na pág. ${r.p}`);
    if(P.length&&!r.x){li.classList.add("chk");const pr=el(`<p class="exprob"><b>Conferir:</b> </p>`);pr.append(P.join(" · "));li.querySelector(".exqh").after(pr)}}
  const st=li.querySelector(".exstem");st.textContent=r.q.enunciado;st.onclick=()=>st.classList.toggle("open");
  const ol=li.querySelector(".exalts");r.q.alternativas.forEach(a=>{const x=el(`<li><b></b><span></span></li>`);x.querySelector("b").textContent=a.letra+")";x.querySelector("span").textContent=a.texto;if(!r.an&&a.letra===r.q.correta)x.classList.add("right");ol.appendChild(x)});
  if(!r.an&&r.q.correta&&r.ck&&r.ck!==r.q.correta)li.insertBefore(el(`<p class="pnote">O comentário foi escrito pelo Claude considerando a alternativa ${esc(r.ck)}; o gabarito oficial é ${esc(r.q.correta)}. Confira antes de estudar por ele.</p>`),li.querySelector(".exctl"));
  const ctl=li.querySelector(".exctl"),sel=el(`<label class="qfsel exsel"><span>Resposta</span><select></select></label>`),s=sel.querySelector("select");s.id=`exk-${C.pre}-${i}`;
  [["","—"],...r.q.alternativas.map(a=>[a.letra,a.letra]),["X","Anulada"]].forEach(([v,l])=>{const o=document.createElement("option");o.value=v;o.textContent=l;s.appendChild(o)});
  s.value=r.an?"X":r.q.correta;s.onchange=()=>C.setKey(i,s.value);ctl.appendChild(sel);
  const tb=el(`<button class="link extema" type="button"></button>`);tb.id=`ext-${C.pre}-${i}`;tb.textContent=r.k?`Tema: ${BYKEY[r.k].t}`:"Escolher o tema";tb.onclick=()=>C.setT({i,q:""});ctl.appendChild(tb);
  /* até 3 temas: o principal + 2; cada um conta inteiro no acerto do tema */
  if(r.k){(r.ks||[]).filter(k=>BYKEY[k]).forEach(k=>{const c=el(`<button class="chip exks" type="button"></button>`);c.id=`exkx-${C.pre}-${i}-${k}`;c.textContent=`+ ${BYKEY[k].t} ×`;c.title="Tirar este tema da questão";c.onclick=()=>C.delTopic(i,k);ctl.appendChild(c)});
    if((r.ks||[]).length<2&&C.delTopic){const a=el(`<button class="link exkadd" type="button"></button>`);a.id=`exka-${C.pre}-${i}`;a.textContent="+ outro tema";a.title="Para questão que cobre mais de um tema (até 3)";a.onclick=()=>C.setT({i,q:"",add:true});ctl.appendChild(a)}}
  if(C.toggleX){const x=el(`<button class="link" type="button"></button>`);x.id=`exx-${C.pre}-${i}`;x.textContent=r.x?"Incluir de volta":"Descartar";x.onclick=()=>C.toggleX(i);ctl.appendChild(x)}
  if(C.T&&C.T.i===i)li.appendChild(exTopicPick(C.T,k=>{if(k!==null&&!(C.T.add&&!k))C.setTopic(i,k,!!C.T.add);C.setT(null)}));
  return li}
function exListEl(rows,S,C){const w=el(`<div class="exrev"></div>`),cnt=f=>rows.filter(r=>exFilterOk(r,f)).length;
  const ch=el(`<div class="chips" role="group" aria-label="Mostrar"></div>`);[["all","Todas"],["chk","Conferir"],["tema","Sem tema"],["kg","Tema sugerido"],["img","Com imagem"],...(C.toggleX?[["x","Descartadas"]]:[])].forEach(([v,l])=>{const n=cnt(v);if(v!=="all"&&!n&&S.flt!==v)return;
    const b=el(`<button class="chip" type="button" aria-pressed="${S.flt===v}"></button>`);b.id=`exf-${C.pre}-${v}`;b.textContent=`${l} · ${n}`;b.onclick=()=>{S.flt=S.flt===v&&v!=="all"?"all":v;S.show=12;render()};ch.appendChild(b)});w.appendChild(ch);
  const L=rows.map((r,i)=>[r,i]).filter(([r])=>exFilterOk(r,S.flt)),ol=el(`<ol class="exqs"></ol>`);L.slice(0,S.show).forEach(([r,i])=>ol.appendChild(exRowEl(r,i,C)));w.appendChild(ol);
  if(!L.length)w.appendChild(el(`<p class="cempty">Nada aqui com este filtro.</p>`));
  if(L.length>S.show){const m=el(`<button class="btn" type="button"></button>`);m.id=`exmore-${C.pre}`;m.textContent=`Mostrar mais ${Math.min(24,L.length-S.show)} de ${L.length-S.show}`;m.onclick=()=>{S.show+=24;render()};w.appendChild(m)}
  return w}
/* Lote 20D: passos da importação (Arquivo › Gabarito › Leitura › Conferir › Salvar) */
function impStepsEl(R){const cur=R.saving?4:R.st==="review"?3:R.st==="read"?2:R.st==="ready"?1:0,L=["Arquivo","Gabarito","Leitura","Conferir","Salvar"],o=el(`<ol class="impsteps" aria-label="Passos da importação"></ol>`);
  L.forEach((t,i)=>{const li=el(`<li><span class="isn"></span><span class="ist"></span></li>`);li.querySelector(".isn").textContent=i<cur?"✓":i+1;li.querySelector(".ist").textContent=t;li.className=i<cur?"done":i===cur?"cur":"";if(i===cur)li.setAttribute("aria-current","step");o.appendChild(li)});return o}
function impPanel(){const R=imp,w=el(`<div class="imgpanel exiP" id="impPanel"><div class="dhead"><b>Importar prova</b><button class="link" type="button">Fechar</button></div></div>`);
  w.querySelector(".dhead .link").onclick=()=>{if(R.ctl)R.ctl.abort();imp=null;render()};w.appendChild(impStepsEl(R));
  const err=()=>{if(R.err){const p=el(`<p class="err" role="alert"></p>`);p.textContent=R.err;w.appendChild(p)}};
  if(R.st==="pick"||R.st==="scan"){
    w.appendChild(el(`<p class="how">Escolha o PDF da prova (ou fotos das páginas, na ordem). O app tenta ler as questões aqui mesmo, sem o Claude; se a prova for difícil de ler (duas colunas, páginas escaneadas, sem gabarito), ele avisa para passar pelo Claude, que transcreve com gabarito, tema e comentário. Depois você confere tudo antes de salvar. O arquivo não fica salvo, só as questões.</p>`));
    const pk=el(`<label class="btn primary imgpick"><input type="file" id="impFile" accept="application/pdf,.pdf,image/*" multiple hidden><span>Escolher o PDF ou as fotos</span></label>`);
    if(R.ofPre){const o=el(`<p class="ofpre" id="impOfPre"></p>`);o.textContent=`Prova oficial: ${R.ofPre.name}${R.niv?" · "+R.niv:""}. Nome, banca e ano já vêm preenchidos.`;w.appendChild(o)}
    pk.querySelector("input").onchange=e=>impPick(e.target.files);if(R.st==="scan")pk.classList.add("dis");w.appendChild(pk);
    if(R.st==="scan"){const s=el(`<p class="gstatus" id="impSt" aria-live="polite"></p>`);s.textContent=R.msg;w.appendChild(s)}
    err();return w}
  // dados da prova
  const pq=impQPages(R),nImg=R.pages.filter(p=>p.img&&!R.keyPg.includes(p.n)).length,key=impKey(R),kn=Object.keys(key).length,kx=Object.values(key).filter(v=>v==="X").length;
  const info=el(`<p class="how exinfo"></p>`);info.textContent=`${R.pages.length} ${R.pages.length===1?"página":"páginas"}${nImg?` · ${nImg} sem texto (${R.doc?"escaneadas":"fotos"}: o Claude lê como imagem)`:""}${R.keyPg.length?` · gabarito na pág. ${pgList(R.keyPg)}`:""}.`;
  if(R.keyPg.length&&R.st==="ready"){const nb=el(`<button class="link" type="button" id="impNoKey">Não é o gabarito</button>`);nb.onclick=()=>{R.keyPg=[];render()};info.append(" ",nb)}w.appendChild(info);
  const f=el(`<div class="exfields"><label class="ffield exname"><span class="glabel">Nome da prova</span><input class="etext" id="impName" maxlength="140"></label><label class="ffield"><span class="glabel">Banca</span><input class="etext" id="impBanca" maxlength="40" placeholder="ENARE, USP…"></label><label class="ffield exano"><span class="glabel">Ano</span><input class="etext" id="impAno" maxlength="4" inputmode="numeric"></label></div>`);
  [["#impName","name"],["#impBanca","banca"],["#impAno","ano"]].forEach(([s,k])=>{const i=f.querySelector(s);i.value=R[k];i.oninput=()=>{R[k]=i.value}});w.appendChild(f);
  {if(R.of==null)R.of=ofGuess(R);const o=el(`<div class="ofrow"><label class="ofchk"><input type="checkbox" id="impOf"> Prova oficial <span class="how">(de banca de residência, Revalida ou ENADE; não lista de cursinho)</span></label><label class="ffield"><span class="glabel">Nível</span><select id="impNiv"><option value="">—</option></select></label></div>`),cb=o.querySelector("#impOf"),sl=o.querySelector("#impNiv");
    OF_NIV.forEach(v=>{const x=document.createElement("option");x.value=v;x.textContent=v;sl.appendChild(x)});cb.checked=!!R.of;sl.value=R.niv||"";sl.disabled=!R.of;cb.onchange=()=>{R.of=cb.checked;render()};sl.onchange=()=>{R.niv=sl.value};w.appendChild(o)}
  // gabarito
  const g=el(`<div class="exkey"><span class="glabel">Gabarito</span><p class="exkst"></p></div>`);g.querySelector(".exkst").textContent=kn?`${kn} ${kn===1?"resposta encontrada":"respostas encontradas"}${kx?` (${kx} ${kx===1?"anulada":"anuladas"})`:""}: as questões usam o gabarito da banca.`
    :R.keyTxt.trim()?"O gabarito do arquivo vai como texto para o Claude, que confere número por número.":"Sem gabarito: o Claude resolve as questões e elas ficam marcadas para você conferir. Dá para colar o gabarito agora ou depois.";
  const kb=el(`<div class="btns"></div>`),kf=el(`<label class="btn imgpick"><input type="file" id="impKeyF" accept="application/pdf,.pdf" hidden><span></span></label>`);kf.querySelector("span").textContent=R.keyFile?`Gabarito: ${R.keyFile}`:"Gabarito em outro PDF";kf.querySelector("input").onchange=e=>impKeyFile(e.target.files&&e.target.files[0]);kb.appendChild(kf);g.appendChild(kb);
  const pd=el(`<details class="plain"${R.paste?" open":""}><summary>Colar ou digitar o gabarito</summary><textarea class="ntext exkta" id="impPaste" placeholder="Ex.: 1-A 2-C 3-D 4-ANULADA 5-B…"></textarea></details>`),ta=pd.querySelector("textarea");ta.value=R.paste;
  ta.oninput=debounced(()=>{R.paste=ta.value;if(R.st==="review")impApplyKey(R,impKey(R));render()},400);g.appendChild(pd);w.appendChild(g);
  if(R.st==="ready"){err();const L=impLocalGet(R),okL=L.qs.length&&!L.probs.length,go=el(`<button class="btn${okL?"":" primary"}" type="button" id="impGo"></button>`),nb=impBlocks(R).length;
    go.textContent=okL?"Ler com o Claude mesmo assim":`Ler ${pq.length} ${pq.length===1?"página":"páginas"} com o Claude`;go.disabled=sampleOff||!sampleFn||!pq.length;go.onclick=()=>impRead();
    const lw=el(`<div class="imploc"><span class="glabel">Leitura aqui no aparelho</span></div>`);
    if(okL){const p=el(`<p class="exsum"></p>`);const nk=L.qs.filter(r=>r.k).length;p.innerHTML=`<b>${L.qs.length} ${L.qs.length===1?"questão lida":"questões lidas"}</b>, todas com alternativas e gabarito${L.qs.some(r=>r.q.comentario)?", com o comentário da própria prova":""}. Tema sugerido pelo nome em ${nk} de ${L.qs.length}: confira antes de salvar.`;lw.appendChild(p)}
    else if(L.qs.length)lw.appendChild(impProbEl(L,`Li ${L.qs.length} ${L.qs.length===1?"questão":"questões"}, mas com dificuldades:`));
    else lw.appendChild(impProbEl(L,"Não consegui ler esta prova aqui no aparelho:"));
    const lb=el(`<div class="btns"></div>`);if(L.qs.length){const u=el(`<button class="btn${okL?" primary":""}" type="button" id="impLocal"></button>`);u.textContent=okL?`Conferir e salvar · ${L.qs.length} ${L.qs.length===1?"questão":"questões"}`:"Conferir o que foi lido mesmo assim";u.onclick=()=>impUseLocal(R);lb.appendChild(u)}
    if(okL)lb.appendChild(go);else lb.prepend(go);lw.appendChild(lb);w.appendChild(lw);
    if(sampleOff){w.appendChild(el(`<p class="how">O Claude não está disponível nesta visualização.</p>`));return w}
    if(!okL)w.appendChild(el(`<p class="how">${window.__site?`Vai em ${nb} ${nb===1?"parte":"partes"}: em cada uma, você copia o pedido, cola no Claude e traz a resposta de volta.`:`Vai em ${nb} ${nb===1?"parte":"partes"}; uma prova de 100 questões leva uns 10 a 15 minutos. Dá para usar o resto do app enquanto isso.`}</p>`));return w}
  if(R.st==="read"){const s=el(`<p class="gstatus" id="impSt" aria-live="polite"></p>`);s.textContent=`Lendo com o Claude: parte ${Math.min((R.prog||0)+1,R.nb)} de ${R.nb} · ${R.qs.length} ${R.qs.length===1?"questão":"questões"} até agora…`;w.appendChild(s);
    const c=el(`<button class="btn" type="button" id="impStop">Parar e conferir o que já veio</button>`);c.onclick=()=>{R.stop=true;if(R.ctl)R.ctl.abort()};w.appendChild(c);return w}
  // conferir
  err();const rows=R.qs,keep=rows.filter(r=>!r.x),nb=keep.filter(r=>r.g==="b"&&!r.an).length,nc=keep.filter(r=>r.g!=="b"&&!r.an).length,na=keep.filter(r=>r.an).length,nt=keep.filter(r=>!r.k).length;
  const sum=el(`<p class="exsum"></p>`);sum.innerHTML=`<b>${keep.length} ${keep.length===1?"questão":"questões"}</b> · ${nb} com gabarito da banca${nc?` · <span class="w">${nc} com gabarito do Claude</span>`:""}${na?` · ${na} ${na===1?"anulada":"anuladas"}`:""}${nt?` · <span class="w">${nt} sem tema</span>`:""}`;w.appendChild(sum);
  if(R.src==="local"){const L=impLocalGet(R);if(L.probs.length){const pw=impProbEl(L,"Lido aqui no aparelho, com dificuldades:");if(!sampleOff){const b=el(`<button class="btn primary" type="button" id="impToClaude">Passar pelo Claude</button>`);b.onclick=()=>{R.qs=[];R.done=new Set();R.fail=[];R.src="";impRead()};pw.appendChild(b)}w.appendChild(pw)}
    else w.appendChild(el(`<p class="how">Lido aqui no aparelho, sem o Claude. O gabarito e os comentários são os da prova; o tema foi sugerido pelo nome (selo “Tema sugerido”): confira.</p>`))}
  const unread=pq.filter(n=>!R.done.has(n)),gaps=R.src==="local"?[]:impGaps(R,key);
  if(R.noImg)w.appendChild(el(`<p class="pnote">Esta visualização não envia imagens ao Claude, então as páginas escaneadas não foram lidas. Use o site (copiar e colar) ou um PDF com texto.</p>`));
  if(unread.length&&!R.noImg){const p=el(`<p class="pnote"></p>`);p.textContent=`${unread.length===1?"A página":"As páginas"} ${pgList(unread)} ainda não ${unread.length===1?"foi lida":"foram lidas"}. `;const b=el(`<button class="link" type="button" id="impRest">Ler agora</button>`);b.onclick=()=>impRead(unread);p.appendChild(b);w.appendChild(p)}
  else if(gaps.length){const p=el(`<p class="pnote"></p>`);p.textContent=`Não encontrei ${gaps.length===1?"a questão":"as questões"} ${gaps.slice(0,12).join(", ")}${gaps.length>12?"…":""}. `;const gp=impGapPages(R,gaps),b=el(`<button class="link" type="button" id="impGap"></button>`);b.textContent=`Procurar de novo (págs. ${pgList(gp)})`;b.onclick=()=>impRead(gp);p.appendChild(b);p.append(" Se não existirem nesta prova, ignore.");w.appendChild(p)}
  if(nc)w.appendChild(el(`<p class="how">“Gabarito do Claude”: ele resolveu a questão. Confira com o gabarito oficial quando sair: cole-o acima (ou depois, na prova salva) e o app corrige tudo de uma vez.</p>`));
  if(!R.T||!rows[R.T.i])R.T=null;
  w.appendChild(exListEl(rows,R,{pre:"i",T:R.T,setT:v=>{R.T=v;render()},setTopic:(i,k,add)=>{const r=rows[i];if(add){if(k&&k!==r.k)r.ks=[...new Set([...(r.ks||[]),k])].slice(0,2)}else{r.k=k;r.kg=false;r.ks=(r.ks||[]).filter(x=>x!==k);if(!k)delete r.ks}},delTopic:(i,k)=>{const r=rows[i];r.ks=(r.ks||[]).filter(x=>x!==k);render()},setKey:(i,v)=>{const r=rows[i];if(v==="X"){r.an=true}else{r.an=false;r.q.correta=v;if(v)r.g="b"}render()},toggleX:i=>{rows[i].x=!rows[i].x;render()}}));
  const b=el(`<div class="btns"></div>`),sv=el(`<button class="btn primary" type="button" id="impSave"></button>`);sv.textContent=R.saving?"Recortando as figuras…":`Salvar prova · ${keep.length} ${keep.length===1?"questão":"questões"}`;sv.disabled=!keep.length||!!R.saving;sv.onclick=impSave;b.appendChild(sv);
  if(R.figs&&R.figs.length&&!R.saving)w.appendChild(el(`<p class="how impfigh">${R.figs.length} ${R.figs.length===1?"página tem figura":"páginas têm figura"} (exame, ECG, esquema): ao salvar, cada figura é recortada e fica junto da questão dela.</p>`));
  if(!sampleOff){const again=el(`<button class="btn" type="button">${R.src==="local"?"Ler com o Claude":"Ler tudo de novo"}</button>`);again.onclick=()=>{R.qs=[];R.done=new Set();R.fail=[];R.src="";impRead()};b.appendChild(again)}w.appendChild(b);
  return w}
