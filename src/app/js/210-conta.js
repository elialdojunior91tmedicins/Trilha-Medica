function commit(){clearArm=null;render();persist()}
function setSave(t){$("#save").textContent=t}
/* na conta, cada tema é um documento próprio em progress/topics/{chave} (o documento principal guarda só histórico e plano);
   assim nenhum documento passa do limite de 1 MB do Firestore, mesmo com anos de questões registradas */
let topicStore=null,tSaved={};
const tNewer=(a,b)=>{const la=(a&&a.last)||"",lb=(b&&b.last)||"";if(la!==lb)return la>lb;const qa=(a&&a.qt)||0,qb=(b&&b.qt)||0;if(qa!==qb)return qa>qb;return JSON.stringify(a||{}).length>JSON.stringify(b||{}).length};
async function inChunks(list,fn,n=20){for(let i=0;i<list.length;i+=n)await Promise.all(list.slice(i,i+n).map(fn))}
async function saveTopics(){const ch=[],del=[];for(const k in state){const j=JSON.stringify(state[k]);if(tSaved[k]!==j)ch.push([k,j])}for(const k in tSaved)if(!(k in state))del.push(k);
  await inChunks(ch,async([k,j])=>{await topicStore.doc(k).set(JSON.parse(j));tSaved[k]=j});
  await inChunks(del,async k=>{await topicStore.doc(k).delete();delete tSaved[k]})}
function persist(){
  try{localStorage.setItem(LS2,JSON.stringify(state))}catch(e){}
  if(!store){setSave("Progresso salvo neste navegador");return}
  setSave("Salvando…"); clearTimeout(saveTimer);
  if(!synced)return;// antes de ler a conta, só no aparelho; ao sincronizar, o que mudou é enviado
  saveTimer=setTimeout(async()=>{saveTimer=0;try{if(topicStore){await saveTopics();liveW.prog=stab({version:3,split:true,hist,plan:dayPlan});await store.set({version:3,split:true,hist,plan:dayPlan,updatedAt:new Date().toISOString()})}
      else await store.set({version:2,topics:state,hist,plan:dayPlan,updatedAt:new Date().toISOString()});setSave("Progresso salvo na sua conta");saveOk("prog")}
    catch(e){if(!(e&&e.code==="unavailable"))saveFail("prog","o progresso dos temas",e,()=>persist());setSave(e&&e.code==="unavailable"?"Sem conexão no momento. Sua próxima marcação salva tudo de novo.":"Não foi possível salvar na conta; salvo neste navegador")}},700);
}

/* ---------- aparelhos ao mesmo tempo: sincronização ao vivo ----------
   Depois de carregar a conta, o app ouve cada documento e coleção (onSnapshot). O que outro aparelho grava chega aqui e entra na tela
   sem esperar recarregar. Nunca passa por cima do que este aparelho ainda vai enviar (gravação pendente: saveTimer, facTimer, uiTimer,
   noteTimers; tema com mudança não enviada: state[k] diferente de tSaved[k]) nem redesenha a tela enquanto você usa o app (liveFlush). Itens apagados em outro aparelho só somem daqui se este aparelho já os tinha visto na conta (liveSeen). */
const stab=v=>JSON.stringify(v,(k,x)=>x&&typeof x==="object"&&!Array.isArray(x)?Object.keys(x).sort().reduce((o,kk)=>(o[kk]=x[kk],o),{}):x);
const liveClone=x=>x==null?x:JSON.parse(JSON.stringify(x));
const noUpd=d=>{const c={...(d||{})};delete c.updatedAt;return c};
let liveW={},liveOn=false,liveRefs=[],liveSeen={},liveDirty=false,liveCount=0,liveRefAt=0;
function liveEditing(){const a=document.activeElement;if(!a||a===document.body)return false;
  return a.tagName==="TEXTAREA"||a.tagName==="SELECT"||a.isContentEditable||(a.tagName==="INPUT"&&!/^(button|checkbox|radio|range|submit|reset|file|color|image)$/i.test(a.type||""))}
/* a tela só é redesenhada com dados de outro aparelho quando este está parado (LIVE_IDLE sem toque/tecla) e sem campo em edição:
   o aparelho esquecido aberto se atualiza; o que está nas suas mãos não muda de repente nem perde o que você digitou num formulário */
const LIVE_IDLE=5000;let liveAct=0,liveT=null;
function liveRender(){liveDirty=true;liveCount++;liveFlush()}
function liveFlush(){if(!liveDirty)return;const idle=Date.now()-liveAct;
  if(liveEditing()||idle<LIVE_IDLE){clearTimeout(liveT);liveT=setTimeout(liveFlush,Math.max(600,LIVE_IDLE-idle));return}
  liveDirty=false;render();
  setSave("Atualizado com seus outros aparelhos às "+new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}))}
const pend=d=>!!(d&&d.metadata&&d.metadata.hasPendingWrites);
/* documento inteiro: a volta da própria gravação (pendente, ou igual ao que este aparelho gravou por último) nunca é aplicada; senão desfaria o que mudou aqui depois */
const echo=(snap,w)=>pend(snap)||(!!w&&stab(noUpd(snap.data()))===w);
function liveProgress(snap){if(!snap||!snap.exists||echo(snap,liveW.prog))return;const d=snap.data()||{};let ch=false;
  if(d.hist&&typeof d.hist==="object"){for(const k in d.hist){const r=d.hist[k]||{},l=hist[k]||{},n={};
      for(const f of ["e","r","q","c","res","tq","ts"]){const v=Math.max(r[f]||0,l[f]||0);if(v)n[f]=v}
      if(stab(n)!==stab(l)){hist[k]=n;ch=true}}
    if(ch)try{localStorage.setItem(LSH,JSON.stringify(hist))}catch(e){}}
  if(!saveTimer&&d.plan&&d.plan.d===today()&&Array.isArray(d.plan.items)&&stab(d.plan)!==stab(dayPlan)){
    dayPlan=renamePlanLabels(liveClone(d.plan));try{localStorage.setItem(LSDP,JSON.stringify(dayPlan))}catch(e){}ch=true}
  if(ch)liveRender()}
function liveTopics(snap){if(!snap)return;let ch=false;const ids=new Set();
  for(const d of snap.docs){const k=d.id;ids.add(k);if(pend(d)||!BYKEY[k])continue;
    const v=d.data();if(!v||typeof v!=="object")continue;
    if(state[k]&&stab(state[k])===stab(v))continue;
    const dirty=state[k]?JSON.stringify(state[k])!==tSaved[k]:(k in tSaved);if(dirty)continue;// este aparelho tem mudança ainda não enviada
    const m=migrate({[k]:liveClone(v)})[k];if(!m)continue;state[k]=m;tSaved[k]=JSON.stringify(m);ch=true}
  const seen=liveSeen.topics;if(seen)for(const k of seen)if(!ids.has(k)&&(k in state)&&JSON.stringify(state[k])===tSaved[k]){delete state[k];delete tSaved[k];ch=true}
  liveSeen.topics=ids;
  if(ch){try{localStorage.setItem(LS2,JSON.stringify(state))}catch(e){}liveRender()}}
function liveFac(snap){if(!snap||!snap.exists||facTimer||echo(snap,liveW.fac))return;const d=noUpd(snap.data());if(!facValid(d)||stab(d)===stab(fac))return;
  const n={sems:d.sems,discs:d.discs,provas:d.provas,own:d.own};if(d.crunch&&typeof d.crunch==="object")n.crunch={mode:d.crunch.mode,until:d.crunch.until};facXCopy(d,n);
  if(stab(n)===stab(fac))return;fac=liveClone(n);registerOwn();try{localStorage.setItem(LSF,JSON.stringify(fac))}catch(e){}liveRender()}
function liveUI(snap){if(!snap||!snap.exists||uiTimer||echo(snap,liveW.ui))return;const n=uiSanitize(liveClone(noUpd(snap.data())));if(stab(n)===stab(ui))return;
  ui=n;try{localStorage.setItem(LSUI,JSON.stringify(ui))}catch(e){}applyUI();liveRender()}
function liveSettings(snap){if(!snap||!snap.exists||promptEdited||pend(snap))return;const sp=(snap.data()||{}).prompt;
  if(typeof sp==="string"&&sp.trim()&&promptUp(sp)!==promptText){promptText=promptUp(sp);try{localStorage.setItem(LSP,promptText)}catch(e){}$("#promptBox").value=promptText}}
function liveNotes(snap){if(!snap)return;let ch=false;const ids=new Set(),ae=document.activeElement,edit=k=>!!ae&&(ae.id==="nt-"+k||ae.id==="fnt-"+k);
  for(const d of snap.docs){const k=d.id;ids.add(k);if(pend(d)||!BYKEY[k]||noteTimers[k]||edit(k))continue;
    const v=d.data();if(!v||typeof v.t!=="string"||!v.t.trim()||notes[k]===v.t)continue;notes[k]=v.t;if(v.updatedAt)noteAt[k]=v.updatedAt;ch=true}
  const seen=liveSeen.notes;if(seen)for(const k of seen)if(!ids.has(k)&&notes[k]!=null&&!noteTimers[k]&&!edit(k)){delete notes[k];delete noteAt[k];ch=true}
  liveSeen.notes=ids;if(ch){saveNotesLocal();liveRender()}}
/* pacotes (Lote 18, 1.2 2º passo): no site, erros, cartões, foco e Refazer ficam em poucos documentos
   (progress/<lista>pk/p0…pN; campo i = {id: item em JSON}) em vez de um documento por item: cada abertura lê umas 30 páginas em vez de milhares.
   Gravar um item muda só o campo dele (patch = set com merge), então dois aparelhos mexendo no mesmo pacote não apagam o que o outro fez.
   Item grande (> PK_BIG, ex.: Refazer com figura) fica no documento próprio da coleção antiga (progress/<lista>/{id}). O que estiver na coleção antiga
   e couber num pacote vai para o pacote quando a lista chega do servidor (migração; também pega o que uma versão antiga do app gravar lá).
   A interface é a mesma de uma coleção (doc(id).set/delete, get, onSnapshot): o resto do app não sabe a diferença. No artefato (sem patch) nada muda. */
const PK_BIG=60000,PK_FULL=700000,PK_N={errors:8,cards:8,focus:4,redo:8,bank:100,bankh:16};
function pkHash(id){let h=7;for(let i=0;i<id.length;i++)h=(h*31+id.charCodeAt(i))|0;return Math.abs(h)}
function packStore(prog,name){const old=prog.collection(name),col=prog.collection(name+"pk"),N=PK_N[name]||8;
  if(typeof col.doc("p0").patch!=="function")return old;// artefato do Claude: um documento por item, como sempre
  const loc=new Map(),size={},moved=new Map(),dual=new Map();// dual: id na coleção antiga E num pacote → o pacote (para apagar dos dois)// loc: id → "pN" (pacote) | "L" (documento próprio)
  const patch=(b,m)=>col.doc(b).patch("i",m);
  const pick=(id,len)=>{const c=loc.get(id);if(c&&c!=="L"&&(size[c]||0)+len<PK_FULL)return c;const h="p"+(pkHash(id)%N);if((size[h]||0)+len<PK_FULL)return h;
    for(let j=0;j<64;j++){const b="p"+j;if((size[b]||0)+len<PK_FULL)return b}return h};
  /* agrupa as gravações por pacote: um pedido por pacote */
  async function putMany(list){const by={},w=[];
    for(const x0 of list){if(!x0||typeof x0.id!=="string")continue;const j=JSON.stringify(x0),id=x0.id,c=loc.get(id);
      if(j.length>PK_BIG){loc.set(id,"L");w.push(old.doc(id).set(JSON.parse(j)));if(c&&c!=="L")(by[c]=by[c]||{})[id]=null;continue}
      const b=pick(id,j.length);loc.set(id,b);size[b]=(size[b]||0)+j.length;(by[b]=by[b]||{})[id]=j;
      if(c&&c!==b){if(c==="L")w.push(old.doc(id).delete().catch(()=>{}));else if(!(by[c]&&typeof by[c][id]==="string"))(by[c]=by[c]||{})[id]=null}
      {const d2=dual.get(id);dual.delete(id);if(d2&&d2!==b&&!(by[d2]&&typeof by[d2][id]==="string"))(by[d2]=by[d2]||{})[id]=null}}
    for(const b in by)w.push(patch(b,by[b]));await Promise.all(w)}
  async function delMany(ids){const by={},w=[];
    for(const id of ids){const c=loc.get(id),d2=dual.get(id);loc.delete(id);dual.delete(id);if(c==="L"||!c)w.push(old.doc(id).delete().catch(()=>{}));if(c!=="L"){const b=c||"p"+(pkHash(id)%N);(by[b]=by[b]||{})[id]=null}
      if(d2)(by[d2]=by[d2]||{})[id]=null}// estava nos dois lugares: some dos dois (senão a cópia do pacote voltava)
    for(const b in by)w.push(patch(b,by[b]));await Promise.all(w)}
  /* junta pacotes + coleção antiga numa resposta igual à de uma coleção; a coleção antiga ganha se o item estiver nos dois (versão antiga gravou depois) */
  function combine(P,L){const docs=[],at=new Map();for(const k of Object.keys(size))delete size[k];
    for(const d of (P&&P.docs)||[]){const m=(d.data()||{}).i||{};let n=0;
      for(const id in m){const j=m[id];if(typeof j!=="string")continue;n+=j.length;if(at.has(id))continue;
        const doc={id,data:()=>{try{return JSON.parse(j)}catch(e){return null}},metadata:{fromCache:false,hasPendingWrites:false}};at.set(id,docs.length);docs.push(doc);loc.set(id,d.id)}
      size[d.id]=n}
    dual.clear();for(const d of (L&&L.docs)||[]){if(at.has(d.id)){docs[at.get(d.id)]=d;dual.set(d.id,loc.get(d.id))}else docs.push(d);loc.set(d.id,"L")}
    const fc=!!((P&&P.metadata&&P.metadata.fromCache)||(L&&L.metadata&&L.metadata.fromCache));
    return {docs,size:docs.length,empty:!docs.length,metadata:{fromCache:fc,hasPendingWrites:false},L}}
  /* migração: item pequeno na coleção antiga vai para o pacote (só com a resposta do servidor e sem gravação pendente) */
  let migT=null;
  function migrate(S){if(!S||S.metadata.fromCache||!S.L)return;const go=[];
    for(const d of S.L.docs){if(pend(d))continue;const v=d.data();if(!v||typeof v!=="object")continue;const j=JSON.stringify({...v,id:d.id});
      if(j.length>PK_BIG||moved.get(d.id)===j)continue;moved.set(d.id,j);go.push({...v,id:d.id})}
    if(!go.length)return;clearTimeout(migT);migT=setTimeout(async()=>{try{
      const by={};for(const x of go){const j=JSON.stringify(x),b=pick(x.id,j.length);size[b]=(size[b]||0)+j.length;(by[b]=by[b]||{})[x.id]=j}
      for(const b in by)await patch(b,by[b]);
      for(const x of go){loc.set(x.id,Object.keys(by).find(b=>x.id in by[b]));await old.doc(x.id).delete().catch(()=>{})}}catch(e){}},1500)}
  return {pack:true,name,
    doc:id=>({id,set:x=>putMany([{...x,id}]),delete:()=>delMany([id])}),
    putMany,delMany,
    async get(){const [P,L]=await Promise.all([col.get(),old.get()]);const S=combine(P,L);migrate(S);return S},
    onSnapshot(next,err,opts){let P=null,L=null;
      const emit=()=>{if(!P||!L)return;const S=combine(P,L);next(S);migrate(S)};
      const u1=col.onSnapshot(s=>{P=s;emit()},err,opts),u2=old.onSnapshot(s=>{L=s;emit()},err,opts);
      return ()=>{try{u1&&u1()}catch(e){}try{u2&&u2()}catch(e){}}}}}
/* carga sem leitura dupla (Lote 18): cada documento/lista é assinado UMA vez (liveOpen, todos juntos no começo da carga);
   a 1ª resposta do servidor serve de carga (liveFirst, no lugar do get()) e as seguintes viram a sincronização ao vivo.
   Antes, get() + onSnapshot liam tudo duas vezes a cada abertura. Resposta só do cache com internet: espera o servidor até LIVE_WAIT. */
const LIVE_WAIT=8000,liveSub=new Map();
function liveOpen(ref){if(!ref||typeof ref.onSnapshot!=="function"||liveSub.has(ref))return;
  const o={fn:null,first:null,later:null,cache:null,fail:null};o.p=new Promise(r=>{o.ok=r});let tm=null;
  const take=s=>{if(o.first)return;clearTimeout(tm);o.first=s;o.ok(s)};
  liveSub.set(ref,o);
  try{ref.onSnapshot(s=>{try{
      if(!o.first){if(s&&s.metadata&&s.metadata.fromCache&&navigator.onLine!==false){o.cache=s;if(!tm)tm=setTimeout(()=>take(o.cache),LIVE_WAIT);return}take(s);return}
      if(o.fn)o.fn(s);else o.later=s}catch(e){console.error(e)}},
    e=>{o.fail=e||1;if(!o.first){clearTimeout(tm);o.ok(null)}},{meta:true})}catch(e){o.fail=e||1;o.ok(null)}}
async function liveFirst(ref){const o=liveSub.get(ref);const s=o?await o.p:null;return s||ref.get()}
/* apagado em outro aparelho (27/10/2026): cada aparelho guarda os ids que já viu no servidor, por lista. Ao abrir, item que só existe aqui
   e que o servidor já teve foi apagado em outro aparelho (ex.: saiu do Refazer com 2 acertos) → sai daqui também, em vez de ser enviado de volta.
   Só o que nunca chegou ao servidor (criado sem conta ou antes do login) é enviado. Resposta só do cache não decide nada. */
const LSSEEN="resid-seen-v1";let seenAll=(()=>{try{const v=JSON.parse(localStorage.getItem(LSSEEN)||"{}");return v&&typeof v==="object"?v:{}}catch(e){return {}}})();
function seenSave(name,ids){seenAll[name]=[...ids];try{localStorage.setItem(LSSEEN,JSON.stringify(seenAll))}catch(e){}}
function loOnly(name,S,arr,ids,first){const lo=arr.filter(x=>!ids.has(x.id));if(S&&S.metadata&&S.metadata.fromCache)return {lo,gone:0};
  const prev=Array.isArray(seenAll[name])?new Set(seenAll[name]):null;seenSave(name,ids);
  /* 1ª abertura com esta versão (ainda sem a lista do que foi visto): no Refazer, conta já em uso = o que só existe aqui foi apagado em outro aparelho */
  if(!prev){if(first&&ids.size){return {lo:[],gone:lo.length}}return {lo,gone:0}}
  const keep=lo.filter(x=>!prev.has(x.id));return {lo:keep,gone:lo.length-keep.length}}
/* listas com id (erros, caderno livre, lixeira, cartões, refazer, foco): atualiza o objeto no lugar (sessões abertas continuam apontando para ele) */
function liveList(name,snap,get,set,ok,saveLocal,after){if(!snap)return;const ids=new Set();let arr=get(),ch=false;const byId=new Map(arr.map(x=>[x.id,x]));
  for(const d of snap.docs){ids.add(d.id);if(pend(d))continue;const v=ok(liveClone(d.data()));if(!v)continue;const cur=byId.get(v.id);
    if(cur){if(stab(cur)!==stab(v)){for(const f of Object.keys(cur))if(!(f in v))delete cur[f];Object.assign(cur,v);ch=true}}
    else{arr.push(v);byId.set(v.id,v);ch=true}}
  const seen=liveSeen[name];if(seen){const gone=[...seen].filter(id=>!ids.has(id)&&byId.has(id));if(gone.length){const g=new Set(gone);arr=arr.filter(x=>!g.has(x.id));ch=true}}
  liveSeen[name]=ids;if(!(snap.metadata&&snap.metadata.fromCache))seenSave(name,ids);
  if(ch){set(arr);saveLocal();if(after)after();liveRender()}}
function liveStart(){if(liveOn)return;liveOn=true;
  const L=(name,get,set,ok,saveLocal,after)=>s=>liveList(name,s,get,set,ok,saveLocal,after);
  liveRefs=[[store,liveProgress],[topicStore,liveTopics,"topics"],[facStore,liveFac],[uiDoc,liveUI],[settingsDoc,liveSettings],[notesStore,liveNotes,"notes"],
    [errStore,L("err",()=>errors,v=>{errors=v},x=>errOk(x)?x:null,saveErrsLocal),"err"],
    [freeStore,L("free",()=>freeN,v=>{freeN=v},x=>frOk(x)?frClean(x):null,frSaveLocal),"free"],
    [trashStore,L("trash",()=>trash,v=>{trash=v},x=>trOk(x)?x:null,trSaveLocal),"trash"],
    [cardStore,L("cards",()=>cards,v=>{cards=v},x=>cdOk(x)?cdClean(x):null,cdSaveLocal),"cards"],
    [redoStore,L("redo",()=>redo,v=>{redo=v},x=>rdOk(x)?rdClean(x):null,rdSaveLocal),"redo"],
    [simStore,L("sims",()=>sims,v=>{sims=v},x=>smOk(x)?smClean(x):null,smSaveLocal,()=>sims.sort((a,b)=>a.at<b.at?1:-1)),"sims"],
    [exStore,L("exams",()=>exams,v=>{exams=v},x=>exOk(x)?exClean(x):null,exSaveLocal),"exams"],
    [exPStore,L("exprog",()=>exProg,v=>{exProg=v},x=>exPOk(x)&&!exATimer[x.id]?exPClean(x):null,exSaveLocal),"exprog"],
    [focStore,L("focus",()=>foSess,v=>{foSess=v},x=>foOk(x)?foClean(x):null,foSaveLocal,()=>foSess.sort((a,b)=>a.s<b.s?1:-1)),"focus"]].filter(r=>r[0]);
  for(const [ref,fn,name] of liveRefs){const o=liveSub.get(ref);
    /* a assinatura aberta na carga continua: a 1ª resposta já foi usada (só marca o que foi visto); as seguintes vão para fn */
    if(o&&o.first&&!o.fail){if(name&&o.first.docs)liveSeen[name]=new Set(o.first.docs.map(d=>d.id));o.fn=fn;if(o.later){const l=o.later;o.later=null;try{fn(l)}catch(e){console.error(e)}}continue}
    if(typeof ref.onSnapshot==="function")try{ref.onSnapshot(s=>{try{fn(s)}catch(e){console.error(e)}},()=>{})}catch(e){}}}
/* ao voltar para o app depois de mais de 30 min em segundo plano (tela bloqueada) ou quando a internet volta, confere tudo de uma vez,
   caso alguma conexão tenha caído (a conexão ao vivo volta sozinha; isto é só garantia, e é raro para não gastar leituras do banco) */
let liveHidAt=0;
async function liveRefresh(force){if(!liveOn||(!force&&Date.now()-liveRefAt<60000))return;liveRefAt=Date.now();
  for(const [ref,fn] of liveRefs)try{fn(await ref.get())}catch(e){}}
