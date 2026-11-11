/* ---------- Banco de questões, B1 (11/2026): a fundação, ainda sem tela própria ----------
   Toda questão que passa pelo app fica guardada uma vez só: provas na íntegra, Meus simulados, Refazer, erros com a questão inteira e,
   daqui em diante, TODAS as geradas (gerador do tema e simulado misto), inclusive as acertadas, que antes sumiam.
   bank  = [{id,h,o,ks,at,u,q,ban?,ano?,niv?,pv?,pn?,ex?,ei?,fg?,nf?,mat?,an?}]  o = gerada|simulado|prova|oficial; q = a questão no formato de sempre
           ({enunciado,alternativas:[{letra,texto,porque?}],correta,comentario?,conceito?,alerta?,pc?,th?,fonte?,link?}); id = "b"+h, sendo h a impressão
           digital do enunciado + alternativas (sem acento, sem pontuação, alternativas em qualquer ordem): a mesma questão vinda de dois lugares, ou
           trazida em dois aparelhos, vira uma só. ex/ei = prova na íntegra e posição; fg = figura da prova (exFigs); nf = tinha figura do material, não guardada.
   bankH = [{id:<id da questão>,a:[{d,l,ok,s,src,c?,m?}]}]  cada resposta: l = letra na ordem guardada no banco; src = gen|sim|rerun|redo|exam|erro|bank;
           c = contou no acerto do tema quando foi respondida; m = trazida de outra parte do app (o que já existia antes do banco e as provas na íntegra).
   O banco só REGISTRA: o acerto dos temas continua sendo contado pelos caminhos de sempre (gerador, simulado, prova), então nada é somado duas vezes.
   No aparelho: IndexedDB "nexus-bank" (lojas q e h). Na conta: pacotes progress/bankpk e progress/bankhpk (no artefato, um documento por item).
   Sincronização por união: questão = vale a de u mais novo; histórico = soma das respostas dos dois lados. Nada é apagado no B1 (vem com a tela, no B2).
   Backup: o histórico inteiro + as questões que não dá para refazer a partir das provas na íntegra guardadas (as da prova voltam pela própria prova). */
const BQ_O=["gerada","simulado","prova","oficial"],BQ_RANK={gerada:0,simulado:1,prova:2,oficial:3},BH_SRC=["gen","sim","rerun","redo","exam","erro","bank"],BH_MAX=60;
let bank=[],bankH=[],bankById=new Map(),bankHById=new Map(),bankOn=false,bankQ=[],bankStore=null,bankHStore=null,bankSynced=false,bankBootP=null;
const bankDirty=new Set(),bankHDirty=new Set();let bankT=null,bankFeedT=null;
const bqT=s=>normRaw(String(s||"")).replace(/[^a-z0-9]+/g," ").trim();
function bqHash(q){const src=bqT(q.enunciado)+"|"+(q.alternativas||[]).map(a=>bqT(a.texto)).sort().join("|");
  let h1=0xdeadbeef,h2=0x41c6ce57;for(let i=0;i<src.length;i++){const c=src.charCodeAt(i);h1=Math.imul(h1^c,2654435761);h2=Math.imul(h2^c,1597334677)}
  h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);
  return (h2>>>0).toString(36).padStart(7,"0")+(h1>>>0).toString(36).padStart(7,"0")}
function bqQ(q){const s=(v,m)=>typeof v==="string"?v.slice(0,m):"";q=q&&typeof q==="object"?q:{};
  const A=(Array.isArray(q.alternativas)?q.alternativas:[]).filter(a=>a&&typeof a.texto==="string"&&a.texto.trim()).slice(0,8).map(a=>{const o={letra:s(a.letra,3).trim().toUpperCase(),texto:a.texto.slice(0,2000)};if(s(a.porque,1200).trim())o.porque=s(a.porque,1200);return o});
  const o={enunciado:s(q.enunciado,8000),alternativas:A,correta:s(q.correta,3).trim().toUpperCase()};
  const pc=s(q.pc,1200)||s(q.pontoChave,1200),th=s(q.th,800)||s(q.takeHome,800);
  for(const [f,v] of [["comentario",s(q.comentario,4000)],["conceito",s(q.conceito,600)],["alerta",s(q.alerta,600)],["pc",pc],["th",th],["fonte",s(q.fonte,400)]])if(v.trim())o[f]=v;
  if(linkOk(q.link))o.link=q.link.trim();return o}
function bqOk(x){return !!x&&typeof x==="object"&&typeof x.id==="string"&&!!x.q&&typeof x.q.enunciado==="string"&&Array.isArray(x.q.alternativas)}
function bqClean(x){const s=(v,m)=>typeof v==="string"?v.slice(0,m):"",now=new Date().toISOString();
  const ks=[...new Set((Array.isArray(x.ks)?x.ks:[]).filter(k=>typeof k==="string"&&/^[A-Za-z0-9_-]{1,40}$/.test(k)))].slice(0,3);
  const o={id:x.id,h:s(x.h,20),o:BQ_O.includes(x.o)?x.o:"gerada",ks,at:s(x.at,40)||now,u:s(x.u,40)||s(x.at,40)||now,q:bqQ(x.q)};
  for(const f of ["ban","niv","pv"])if(s(x[f],140).trim())o[f]=s(x[f],140);if(/^\d{4}$/.test(String(x.ano||"")))o.ano=String(x.ano);
  if(Number.isInteger(x.pn)&&x.pn>0)o.pn=x.pn;if(s(x.sb,80))o.sb=s(x.sb,80);if(typeof x.ex==="string"&&x.ex)o.ex=x.ex.slice(0,60);if(Number.isInteger(x.ei)&&x.ei>=0)o.ei=x.ei;
  for(const f of ["fg","nf","mat","an","fm","fav","del","dz"])if(x[f])o[f]=1;return o}
function bhClean(x){const D=/^\d{4}-\d{2}-\d{2}$/;
  const L=(Array.isArray(x.a)?x.a:[]).filter(y=>y&&D.test(y.d)).map(y=>{const o={d:y.d,l:typeof y.l==="string"?y.l.slice(0,3):"",ok:y.ok?1:0,s:Math.max(0,Math.min(1800,Math.round(+y.s||0))),src:BH_SRC.includes(y.src)?y.src:"gen"};if(y.c)o.c=1;if(y.m)o.m=1;return o});
  L.sort((a,b)=>a.d<b.d?-1:a.d>b.d?1:0);return {id:x.id,a:L.slice(-BH_MAX)}}
const bhKey=y=>y.d+"|"+y.src+"|"+y.l;
function bqIdx(){bankById=new Map(bank.map(x=>[x.id,x]));bankHById=new Map(bankH.map(x=>[x.id,x]))}
/* IndexedDB próprio (o espaço comum do navegador já está quase cheio com as provas) */
let bkDbP=null;
function bkDb(){if(bkDbP)return bkDbP;bkDbP=new Promise(res=>{try{if(!window.indexedDB)return res(null);const r=indexedDB.open("nexus-bank",1);
  r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains("q"))d.createObjectStore("q",{keyPath:"id"});if(!d.objectStoreNames.contains("h"))d.createObjectStore("h",{keyPath:"id"})};
  r.onsuccess=()=>res(r.result);r.onerror=()=>res(null);r.onblocked=()=>res(null)}catch(e){res(null)}});return bkDbP}
async function bkAll(st){const d=await bkDb();if(!d)return [];return new Promise(res=>{try{const r=d.transaction(st,"readonly").objectStore(st).getAll();r.onsuccess=()=>res(r.result||[]);r.onerror=()=>res([])}catch(e){res([])}})}
async function bkPut(st,list,clear){const d=await bkDb();if(!d||(!list.length&&!clear))return false;
  return new Promise(res=>{try{const t=d.transaction(st,"readwrite"),o=t.objectStore(st);if(clear)o.clear();list.forEach(x=>o.put(JSON.parse(JSON.stringify(x))));t.oncomplete=()=>res(true);t.onerror=t.onabort=()=>res(false)}catch(e){res(false)}})}
/* carga do aparelho: começa junto com o app; o que for pedido antes de terminar espera na fila (bankDo) */
const bankReady=(async()=>{try{const [Q,H]=await Promise.all([bkAll("q"),bkAll("h")]);bank=Q.filter(bqOk).map(bqClean);bankH=H.filter(x=>x&&typeof x.id==="string").map(bhClean)}catch(e){}
  bqIdx();bankOn=true;const L=bankQ;bankQ=[];L.forEach(f=>{try{f()}catch(e){console.error(e)}})})();
function bankDo(f){if(bankOn)f();else bankQ.push(f)}
/* gravação: no aparelho sempre; na conta só depois da 1ª resposta do servidor (antes disso a comparação da carga envia o que faltar) */
function bankSoon(){clearTimeout(bankT);bankT=setTimeout(bankFlush,600)}
async function bankFlush(){clearTimeout(bankT);const Q=[...bankDirty].map(id=>bankById.get(id)).filter(Boolean),H=[...bankHDirty].map(id=>bankHById.get(id)).filter(Boolean);
  bankDirty.clear();bankHDirty.clear();await Promise.all([bkPut("q",Q),bkPut("h",H)]);
  if(bankSynced)await Promise.all([bankSend(bankStore,Q,"q"),bankSend(bankHStore,H,"h")])}
async function bankSend(ref,list,k){if(!ref||!list.length)return;const L=list.map(x=>JSON.parse(JSON.stringify(x))),key="bank:"+k;
  try{if(typeof ref.putMany==="function")await ref.putMany(L);else await Promise.all(L.map(x=>ref.doc(x.id).set(x)));saveOk(key)}
  catch(e){saveFail(key,"o banco de questões",e,()=>bankSend(ref,list,k))}}
/* junta uma questão ao banco (ou completa a que já existe); devolve a do banco */
function bqFill(cq,nq){for(const f of ["comentario","conceito","alerta","pc","th","fonte","link"])if(!cq[f]&&nq[f])cq[f]=nq[f];
  cq.alternativas.forEach(a=>{if(a.porque)return;const b=nq.alternativas.find(y=>bqT(y.texto)===bqT(a.texto));if(b&&b.porque)a.porque=b.porque});
  if(!cq.correta&&nq.correta){const b=nq.alternativas.find(y=>y.letra===nq.correta),a=b&&cq.alternativas.find(y=>bqT(y.texto)===bqT(b.texto));if(a)cq.correta=a.letra}}
function bankPut(n){let cur=bankById.get(n.id);
  if(!cur&&n.ex&&n.ei!=null)cur=bank.find(x=>x.ex===n.ex&&x.ei===n.ei);// questão da prova corrigida no Conferir: continua a mesma
  if(!cur){bank.push(n);bankById.set(n.id,n);bankDirty.add(n.id);bankSoon();return n}
  const before=stab(cur);
  if((n.o==="prova"||n.o==="oficial")&&n.ex&&(cur.o!=="oficial"||cur.ex===n.ex)&&(!cur.ex||cur.ex===n.ex)){// a prova na íntegra manda no texto dela (gabarito colado, tema trocado…)
    const old=cur.q;cur.q=n.q;bqFill(cur.q,old);bhRemap(cur.id,old,cur.q);cur.h=n.h;cur.o=n.o;cur.ks=n.ks.length?n.ks:cur.ks;
    for(const f of ["ban","ano","pv","pn","ex","ei"])if(n[f]!=null)cur[f]=n[f];for(const f of ["niv","sb"])if(n[f])cur[f]=n[f];else delete cur[f];for(const f of ["fg","an"])if(n[f])cur[f]=1;else delete cur[f]}
  else{bqFill(cur.q,n.q);if(BQ_RANK[n.o]>BQ_RANK[cur.o]){cur.o=n.o;for(const f of ["ban","ano","niv","pv","pn","ex","ei"])if(n[f]!=null)cur[f]=n[f];if(n.fg)cur.fg=1}
    cur.ks=[...new Set([...cur.ks,...n.ks])].slice(0,3);if(n.mat)cur.mat=1;if(n.nf&&!cur.fm)cur.nf=1;if(n.at<cur.at)cur.at=n.at}
  if(stab(cur)!==before){cur.u=new Date().toISOString();bankDirty.add(cur.id);bankSoon()}return cur}
/* a ordem das alternativas mudou (a prova passou a mandar no texto): as letras do histórico acompanham, pelo texto */
function bhRemap(id,oq,nq){const H=bankHById.get(id);if(!H)return;let ch=false;
  H.a.forEach(y=>{if(!y.l)return;const a=oq.alternativas.find(z=>z.letra===y.l),b=a&&nq.alternativas.find(z=>bqT(z.texto)===bqT(a.texto));if(b&&b.letra!==y.l){y.l=b.letra;ch=true}});
  if(ch){bankHDirty.add(id);bankSoon()}}
function bqFrom(q,o,ks,extra){const Q=bqQ(q);if(!Q.enunciado.trim()||Q.alternativas.length<2)return null;const h=bqHash(Q);
  return bqClean({...(extra||{}),id:"b"+h,h,o,ks:(ks||[]).filter(k=>k&&BYKEY[k]&&!BYKEY[k].own),q:Q})}
/* letra na tela (alternativas embaralhadas) → letra na ordem guardada no banco, pelo texto */
function bqLetter(bq,q,l){if(!l)return "";const a=(q.alternativas||[]).find(y=>y.letra===l);if(!a)return l;const b=bq.q.alternativas.find(y=>bqT(y.texto)===bqT(a.texto));return b?b.letra:l}
function bhAdd(id,y){const y2=bhClean({id,a:[y]}).a[0];if(!y2)return false;let H=bankHById.get(id);if(!H){H={id,a:[]};bankH.push(H);bankHById.set(id,H)}
  const K=bhKey(y2),cur=H.a.find(z=>bhKey(z)===K);
  if(cur){if(cur.ok===y2.ok)return false;cur.ok=y2.ok}// gabarito corrigido depois: a mesma resposta muda de certa para errada (ou o contrário)
  else{H.a.push(y2);H.a.sort((a,b)=>a.d<b.d?-1:a.d>b.d?1:0);if(H.a.length>BH_MAX)H.a.splice(0,H.a.length-BH_MAX)}
  bankHDirty.add(id);bankSoon();return true}
const bqExtra=(q,o)=>({...(q&&q.mat?{mat:1}:{}),...(q&&q.fg&&o!=="prova"?{nf:1}:{})});
/* ganchos: questão gerada (gerador do tema, simulado) e cada resposta */
function bankAdd(q,o,k,P){if(!q)return;const c=JSON.parse(JSON.stringify(q));bankDo(()=>{const n=bqFrom(c,o,[k],bqExtra(c,o));if(n)bkFigFrom(bankPut(n),c,P)})}
function bankAns(q,o,k,l,sec,src,counted){if(!q||!l)return;const c=JSON.parse(JSON.stringify(q)),d=today();
  bankDo(()=>{const n=bqFrom(c,o,[k],bqExtra(c,o));if(!n)return;const bq=bankPut(n);bhAdd(bq.id,{d,l:bqLetter(bq,c,l),ok:l===c.correta?1:0,s:sec,src,...(counted?{c:1}:{})})})}
const RD_O={gen:"gerada",sim:"simulado",exam:"prova"};
/* o que já existe no app entra no banco com o histórico (idempotente: roda a cada abertura e quando uma prova muda; só grava o que mudou) */
function bankFeedAll(){bankDo(()=>{
  const wrongOn=(id,d)=>{const H=bankHById.get(id);return !!H&&H.a.some(y=>y.d===d&&!y.ok)};
  /* erro do caderno ou 1º erro do Refazer: é o registro de uma resposta errada que já pode estar no histórico (prova, simulado), muitas vezes salva no dia seguinte */
  const wrongBy=(id,d)=>{const H=bankHById.get(id);return !!H&&H.a.some(y=>y.d<=d&&!y.ok)};
  exams.forEach(ex=>{if(sbFill(ex))setTimeout(()=>exPut(ex),0);const P=exProg.find(x=>x.id===ex.id);ex.qs.forEach((r,i)=>{if(!r||!r.q)return;
    const b=bqFrom(r.q,ex.of?"oficial":"prova",[r.k,...(r.ks||[])],{ban:ex.banca,ano:ex.ano,pv:ex.name,pn:r.n||i+1,ex:ex.id,ei:i,at:ex.at,...(r.fg?{fg:1}:{}),...(r.an?{an:1}:{}),...(ex.niv?{niv:ex.niv}:{}),...(r.sb?{sb:r.sb}:{})});if(!b)return;const bq=bankPut(b);
    if(!P)return;const cur=P.a&&P.a[i],L=[...((P.h&&P.h[i])||[]),...(cur?[cur]:[])];
    L.forEach(y=>{if(y.l)bhAdd(bq.id,{d:y.d,l:y.l,ok:y.l===bq.q.correta?1:0,s:y===cur?y.s||0:0,src:"exam",...(y===cur?{c:1}:{}),m:1})})})});
  sims.forEach(x=>x.qs.forEach(r=>{if(!BYKEY[r.k])return;const b=bqFrom(r.q,"simulado",[r.k],{...bqExtra(r.q,"simulado"),at:x.at||x.d+"T12:00:00.000Z"});if(!b)return;const bq=bankPut(b);
    if(r.a)bhAdd(bq.id,{d:x.d,l:bqLetter(bq,r.q,r.a),ok:r.a===r.q.correta?1:0,s:r.t||0,src:"sim",c:1,m:1})}));
  redo.forEach(x=>{if(!BYKEY[x.k])return;const o=RD_O[x.src]||"gerada",b=bqFrom(x.q,o,[x.k],{...bqExtra(x.q,o),at:(x.fd||x.d)+"T12:00:00.000Z"});if(!b)return;const bq=bankPut(b),f=x.fd||x.d;if(x.img&&bq.nf)bkFigSet(bq,x.img);
    if(!wrongBy(bq.id,f))bhAdd(bq.id,{d:f,l:"",ok:0,s:0,src:x.src==="sim"?"sim":x.src==="exam"?"exam":"gen",c:1,m:1});
    if(x.wr&&x.d!==f&&!wrongOn(bq.id,x.d))bhAdd(bq.id,{d:x.d,l:"",ok:0,s:0,src:"redo",m:1});
    if(x.ok&&x.okd)bhAdd(bq.id,{d:x.okd,l:bq.q.correta,ok:1,s:0,src:"redo",m:1})});
  errors.forEach(e=>{const Q=e.q;if(!Q||!Array.isArray(Q.a)||!BYKEY[e.k])return;const o=/simulado/i.test(e.s||"")?"simulado":"gerada";
    const q={enunciado:Q.e,alternativas:Q.a.map(a=>({letra:a.l,texto:a.t,...(a.p?{porque:a.p}:{})})),correta:Q.c,...(Q.cm?{comentario:Q.cm}:{}),...(Q.co?{conceito:Q.co}:{})};
    const b=bqFrom(q,o,[e.k],{at:(e.d||today())+"T12:00:00.000Z"});if(!b)return;const bq=bankPut(b),d=e.d||today();
    if(!wrongBy(bq.id,d))bhAdd(bq.id,{d,l:bqLetter(bq,q,Q.m||""),ok:0,s:0,src:"erro",c:1,m:1})})})}
function bankFeedSoon(){clearTimeout(bankFeedT);bankFeedT=setTimeout(bankFeedAll,1500)}
/* conta: assina as duas listas; a 1ª resposta do servidor decide o que enviar (o que só existe aqui ou está mais novo aqui) */
function bankRemoteQ(s){const add=[];for(const d of s.docs){if(pend(d))continue;const v=d.data();if(!bqOk(v))continue;const n=bqClean(v),cur=bankById.get(n.id);
    if(!cur){bank.push(n);bankById.set(n.id,n);add.push(n)}else if(n.u>cur.u){for(const f of Object.keys(cur))if(!(f in n))delete cur[f];Object.assign(cur,n);add.push(cur)}}
  if(add.length)bkPut("q",add)}
function bankRemoteH(s){const add=[];for(const d of s.docs){if(pend(d))continue;const v=d.data();if(!v||typeof v!=="object")continue;const n=bhClean({...v,id:d.id});
    let H=bankHById.get(n.id);if(!H){H={id:n.id,a:[]};bankH.push(H);bankHById.set(n.id,H)}const K=new Set(H.a.map(bhKey));let ch=false;
    n.a.forEach(y=>{if(!K.has(bhKey(y))){H.a.push(y);ch=true}});if(ch){H.a.sort((a,b)=>a.d<b.d?-1:a.d>b.d?1:0);if(H.a.length>BH_MAX)H.a.splice(0,H.a.length-BH_MAX);add.push(H)}
    if(H.a.length>n.a.length&&bankSynced){bankHDirty.add(H.id);bankSoon()}}// aqui tinha resposta que lá não tinha
  if(add.length)bkPut("h",add)}
function bankPushDiff(SQ,SH){const rq=new Map(SQ.docs.map(d=>{const v=d.data();return [d.id,v&&v.u||""]})),rh=new Map(SH.docs.map(d=>{const v=d.data();return [d.id,v&&Array.isArray(v.a)?v.a.length:0]}));
  bank.forEach(x=>{if(!rq.has(x.id)||x.u>rq.get(x.id))bankDirty.add(x.id)});bankH.forEach(x=>{if(!rh.has(x.id)||x.a.length>rh.get(x.id))bankHDirty.add(x.id)});bankSoon()}
function bankSyncStart(){return new Promise(res=>{let done=false,gq=null,gh=null;const fin=()=>{if(!done){done=true;res()}};setTimeout(fin,15000);
  const first=()=>{if(gq&&gh&&!bankSynced){bankSynced=true;bankPushDiff(gq,gh);fin()}},server=s=>!(s&&s.metadata&&s.metadata.fromCache);
  const sub=(ref,fn)=>{try{ref.onSnapshot(s=>{try{if(s)fn(s)}catch(e){console.error(e)}},()=>fin(),{meta:true})}catch(e){fin()}};
  sub(bankStore,s=>{bankRemoteQ(s);if(server(s)&&!gq){gq=s;first()}});sub(bankHStore,s=>{bankRemoteH(s);if(server(s)&&!gh){gh=s;first()}})})}
function bankBoot(prog){if(bankBootP)return bankBootP;bankBootP=(async()=>{await bankReady;
  if(prog){bankStore=packStore(prog,"bank");bankHStore=packStore(prog,"bankh");await bankSyncStart()}bankFeedAll()})();return bankBootP}
/* backup: histórico inteiro; questões que não voltam pela prova na íntegra guardada */
const bankById2=(a,b)=>a.id<b.id?-1:a.id>b.id?1:0;
function bankBackup(){const E=new Set(exams.map(x=>x.id));return {bank:bank.filter(x=>x.fav||x.del||x.dz||!((x.o==="prova"||x.o==="oficial")&&x.ex&&E.has(x.ex))).map(x=>JSON.parse(JSON.stringify(x))).sort(bankById2),bankh:bankH.filter(x=>x.a.length).map(x=>JSON.parse(JSON.stringify(x))).sort(bankById2)}}
/* importar backup: troca o banco pelo do arquivo (as questões das provas voltam pela própria prova) e regrava na conta */
async function bankRestore(Q,H){await bankReady;if(bankBootP)await bankBootP;
  bank=(Array.isArray(Q)?Q:[]).filter(bqOk).map(bqClean);bankH=(Array.isArray(H)?H:[]).filter(x=>x&&typeof x.id==="string").map(bhClean);bqIdx();
  await Promise.all([bkPut("q",bank,true),bkPut("h",bankH,true)]);bankFeedAll();
  {const now=new Date().toISOString();bank.forEach(x=>{x.u=now;bankDirty.add(x.id)})}// restaurado = a versão mais nova (vale sobre a cópia de outro aparelho)
  if(bankStore&&bankHStore){try{const [a,b]=await Promise.all([bankStore.get(),bankHStore.get()]),qi=new Set(bank.map(x=>x.id)),hi=new Set(bankH.map(x=>x.id));
      const del=async(ref,ids)=>{if(!ids.length)return;if(typeof ref.delMany==="function")await ref.delMany(ids);else await Promise.all(ids.map(id=>ref.doc(id).delete()))};
      await del(bankStore,a.docs.map(d=>d.id).filter(id=>!qi.has(id)));await del(bankHStore,b.docs.map(d=>d.id).filter(id=>!hi.has(id)))}catch(e){}
    bank.forEach(x=>bankDirty.add(x.id));bankH.forEach(x=>bankHDirty.add(x.id));bankSynced=true}
  await bankFlush()}
