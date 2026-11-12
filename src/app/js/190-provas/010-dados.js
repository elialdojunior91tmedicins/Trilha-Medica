/* ---------- Provas na íntegra: importar o PDF (ou fotos) de uma prova, conferir as questões e fazer no app ----------
   exams = [{id,name,banca,ano,at,qs:[{n,p,pe,k,q,g:"b"|"c",an,im,ck}]}]  (questões; muda pouco: importação, gabarito, tema)
   exProg = [{id,i,mode:"p"|"e",fin,tries:[{d,hit,n,s}],a:{idx:{l,d,s}},h:{idx:[{l,d}]}}]  (respostas; documento pequeno, gravado a cada resposta)
   Cada resposta conta no acerto do tema (addQ com a banca como fonte); mudar o gabarito, anular ou trocar o tema recalcula (exChange). */
const LSEX="resid-exams-v1",LSEXP="resid-exprog-v1",PDFJS="https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/legacy/build/",EX_AB="ABCDEFGH";
let exams=[],exProg=[],exStore=null,exPStore=null,imp=null,exRun=null,exEdit=null,exArm=null,exKey=null;const exATimer={};
function exQOk(r){return !!r&&typeof r==="object"&&!!r.q&&typeof r.q.enunciado==="string"&&Array.isArray(r.q.alternativas)&&r.q.alternativas.length>=2}
function exQClean(r){const s=(v,m)=>typeof v==="string"?v.slice(0,m):"",q=r.q;
  const L=q.alternativas.filter(a=>a&&typeof a.texto==="string").map(a=>({letra:String(a.letra||"").trim().toUpperCase().slice(0,3),texto:a.texto.slice(0,2000),porque:s(a.porque,1200)}));
  const cor=String(q.correta||"").trim().toUpperCase().slice(0,3),k=typeof r.k==="string"?r.k:"";
  return {n:Number.isInteger(r.n)&&r.n>0?r.n:0,p:Number.isInteger(r.p)?r.p:0,pe:Number.isInteger(r.pe)?r.pe:0,k:BYKEY[k]&&!BYKEY[k].own?k:"",
    q:{enunciado:q.enunciado.slice(0,8000),alternativas:L,correta:L.some(a=>a.letra===cor)?cor:"",comentario:s(q.comentario,4000),conceito:s(q.conceito,600),alerta:"",...(s(q.pc,1200)?{pc:s(q.pc,1200)}:{}),...(s(q.th,800)?{th:s(q.th,800)}:{}),...(s(q.fonte,400)?{fonte:s(q.fonte,400)}:{})},
    g:r.g==="b"?"b":"c",an:!!r.an,im:!!r.im,ck:typeof r.ck==="string"?r.ck.slice(0,3):"",...(r.x?{x:true}:{}),...(exKs(r).length?{ks:exKs(r)}:{}),...(r.fg?{fg:1}:{}),...(r.kd?{kd:1}:{}),...(s(r.sb,80)?{sb:s(r.sb,80)}:{}),...(r.sbd?{sbd:1}:{}),...(r.sbg?{sbg:1}:{}),...(r.cm?{cm:1}:{}),...(s(r.cr,80)?{cr:s(r.cr,80)}:{})}}
/* temas extras da questão (até 2 além do principal); contam inteiros em cada tema, mas uma vez só no dia/semana */
function exKs(r){const k=typeof r.k==="string"?r.k:"";return Array.isArray(r.ks)?[...new Set(r.ks.filter(x=>typeof x==="string"&&BYKEY[x]&&!BYKEY[x].own&&x!==k))].slice(0,2):[]}
function exOk(x){return !!x&&typeof x==="object"&&typeof x.id==="string"&&Array.isArray(x.qs)}
function exClean(x){const s=(v,m)=>typeof v==="string"?v.slice(0,m):"";
  return {id:x.id,...(x.mod?{mod:1}:{}),...(x.of?{of:1}:{}),...(s(x.niv,20).trim()?{niv:s(x.niv,20)}:{}),...(x.kst==="p"||x.kst==="d"?{kst:x.kst}:{}),name:s(x.name,140)||"Prova",banca:s(x.banca,40),ano:s(String(x.ano||""),4),at:s(x.at,40)||new Date().toISOString(),links:Array.isArray(x.links)?[...new Set(x.links.filter(r=>typeof r==="string"&&/^(T|O):[A-Za-z0-9_-]{1,60}$/.test(r)))].slice(0,12):[],qs:x.qs.filter(exQOk).map(r=>{const c=exQClean(r);delete c.x;return c})}}
function exPOk(x){return !!x&&typeof x==="object"&&typeof x.id==="string"}
function exPClean(x){const D=/^\d{4}-\d{2}-\d{2}$/,a={},h={},A=x.a&&typeof x.a==="object"?x.a:{},H=x.h&&typeof x.h==="object"?x.h:{};
  for(const i in A){const v=A[i];if(v&&typeof v.l==="string"&&D.test(v.d))a[i]={l:v.l.slice(0,3),d:v.d,s:Math.max(0,Math.min(1800,Math.round(+v.s||0)))}}
  for(const i in H){const v=H[i];if(Array.isArray(v)){const L=v.filter(y=>y&&typeof y.l==="string"&&D.test(y.d)).map(y=>({l:y.l.slice(0,3),d:y.d})).slice(-10);if(L.length)h[i]=L}}
  return {id:x.id,i:Number.isInteger(x.i)&&x.i>=0?x.i:0,mode:x.mode==="e"?"e":"p",fin:D.test(x.fin||"")?x.fin:"",
    tries:Array.isArray(x.tries)?x.tries.filter(t=>t&&D.test(t.d)).map(t=>({d:t.d,hit:+t.hit||0,n:+t.n||0,s:+t.s||0})).slice(-20):[],a,h}}
try{const v=JSON.parse(localStorage.getItem(LSEX)||"[]");if(Array.isArray(v))exams=v.filter(exOk).map(exClean)}catch(e){}
try{const v=JSON.parse(localStorage.getItem(LSEXP)||"[]");if(Array.isArray(v))exProg=v.filter(exPOk).map(exPClean)}catch(e){}
function exSaveLocal(){try{localStorage.setItem(LSEX,JSON.stringify(exams))}catch(e){}try{localStorage.setItem(LSEXP,JSON.stringify(exProg))}catch(e){}bankFeedSoon()}
async function exPut(ex){exSaveLocal();if(!exStore)return;const k="ex:"+ex.id;try{await exStore.doc(ex.id).set(JSON.parse(JSON.stringify(ex)));saveOk(k)}catch(e){if(exams.includes(ex))saveFail(k,`a prova “${ex.name}”`,e,()=>exPut(ex))}}
function exPg(id){let P=exProg.find(x=>x.id===id);if(!P){P=exPClean({id});exProg.push(P)}return P}
async function exPWrite(id){const P=exProg.find(x=>x.id===id),k="exp:"+id;if(P&&exPStore)try{await exPStore.doc(id).set(JSON.parse(JSON.stringify(P)));saveOk(k)}catch(e){saveFail(k,"respostas de uma prova",e,()=>exPWrite(id))}}
function exPSave(id){exSaveLocal();clearTimeout(exATimer[id]);const t=setTimeout(async()=>{await exPWrite(id);if(exATimer[id]===t)delete exATimer[id]},1500);exATimer[id]=t}
function exFlush(){for(const id of Object.keys(exATimer)){clearTimeout(exATimer[id]);delete exATimer[id];exPWrite(id)}}
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
