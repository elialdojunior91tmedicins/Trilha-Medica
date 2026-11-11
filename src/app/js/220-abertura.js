try{const lu=JSON.parse(localStorage.getItem(LSUI)||"null");if(lu)ui=uiSanitize(lu)}catch(e){}applyUI();
try{const lf=JSON.parse(localStorage.getItem(LSF)||"null");if(facValid(lf))fac=lf}catch(e){}
registerOwn();
try{const v2=localStorage.getItem(LS2);state=migrate(JSON.parse(v2||localStorage.getItem(LS1)||"{}"));if(estChanged)localStorage.setItem(LS2,JSON.stringify(state))}catch(e){state={}}
try{const le=JSON.parse(localStorage.getItem(LSE)||"[]");errors=Array.isArray(le)?le.filter(errOk):[]}catch(e){errors=[]}
try{const h=JSON.parse(localStorage.getItem(LSH)||"{}");if(h&&typeof h==="object")hist=h}catch(e){hist={}}
try{const ln=JSON.parse(localStorage.getItem(LSN)||"{}");for(const k in ln)if(BYKEY[k]&&typeof ln[k]==="string"&&ln[k].trim())notes[k]=ln[k];noteAt=JSON.parse(localStorage.getItem(LSN+"-at")||"{}")||{}}catch(e){notes={}}
try{const qc=Number(localStorage.getItem("resid-qcount"));if(qc>=1&&qc<=100)qCount=Math.round(qc)}catch(e){}
try{const lp=localStorage.getItem(LSP);if(lp&&lp.trim())promptText=promptUp(lp)}catch(e){}
$("#promptBox").value=promptText;$("#fixedFmt").textContent=`Tarefa\nCrie N questões inéditas sobre o tema "<tema>" (área: <área>).\n[Se houver erros seus neste tema, o app lista os conceitos e pede uma questão sobre eles.]\n[Se você escolher um material seu, o app manda o texto dele e pede que as questões saiam dele, citando a página ou o slide.]\n\n`+fixedFormat("N");
$("#promptBox").addEventListener("input",()=>{promptEdited=true;setPromptStatus("Alterações ainda não salvas.")});
$("#promptSave").onclick=savePrompt;bindPromptReset();
try{const dp=JSON.parse(localStorage.getItem(LSDP)||"null");if(dp&&dp.d===today())dayPlan=renamePlanLabels(dp)}catch(e){}
render();
document.querySelectorAll(".tab").forEach(t=>t.onclick=()=>{backStack=[];setView(t.dataset.v)});$("#tabM").onclick=()=>(($("#navMenu").hidden||$("#navMenu").classList.contains("nmclosing"))?navMenuOpen():navMenuClose());
$("#foPill").onclick=()=>{backStack=[];setView("foco")};
if(window.__site&&window.__site.authReady)window.__site.authReady.then(u=>{acctEmail=u&&u.email||null;if(view==="perfil")render()});
(async()=>{try{const s=await window.claude?.use?.("sample");if(s){sampleFn=s}else{sampleOff=true}}catch(e){sampleOff=true}render()})();
/* a busca do caderno agora fica no cartão Caderno (#frq) */
(async()=>{try{downloadsFn=await window.claude?.use?.("downloads")||null}catch(e){downloadsFn=null}render()})();
$("#planRedo").onclick=redoPlan;
document.querySelectorAll("#tSeg button").forEach(b=>b.onclick=()=>setTSeg(b.dataset.s));
/* celular: esconde a barra de baixo enquanto o teclado está aberto */
const isTypingEl=e=>e&&(e.tagName==="TEXTAREA"||(e.tagName==="INPUT"&&!/^(checkbox|radio|button|submit|range|color|file)$/.test(e.type)));
document.addEventListener("focusin",e=>{if(isTypingEl(e.target))document.body.classList.add("typing")});
document.addEventListener("focusout",()=>setTimeout(()=>{if(!isTypingEl(document.activeElement)){const was=document.body.classList.contains("typing");document.body.classList.remove("typing");if(was&&document.documentElement.dataset.layout==="phone")vvSettle()}},50));
/* iOS: ao fechar o teclado, a página fica fora do lugar até a próxima rolagem; vvSettle força o realinhamento e vvFix calcula quanto
   a área visível (visualViewport) está acima do fundo da janela, para os elementos fixos embaixo ficarem colados no que se vê */
function vvFix(){const vv=window.visualViewport,R=document.documentElement;if(!vv){return}
  let gap=document.body.classList.contains("typing")||Math.abs((vv.scale||1)-1)>0.01?0:Math.round(window.innerHeight-(vv.height+vv.offsetTop));if(Math.abs(gap)<2||Math.abs(gap)>window.innerHeight*.6)gap=0;
  const v=gap?`${-gap}px`:"";if(R.style.getPropertyValue("--vvy")!==v){if(v)R.style.setProperty("--vvy",v);else R.style.removeProperty("--vvy")}}
function vvSettle(){if(!window.visualViewport)return;const y=window.scrollY;requestAnimationFrame(()=>{window.scrollTo(window.scrollX,y);vvFix();setTimeout(vvFix,250);setTimeout(vvFix,600)})}
if(window.visualViewport){visualViewport.addEventListener("resize",vvFix);visualViewport.addEventListener("scroll",vvFix);addEventListener("scroll",vvFix,{passive:true});addEventListener("orientationchange",()=>setTimeout(vvFix,300))}

$("#srchBtn").onclick=()=>{gsOpen=true;renderGSearch()};$("#sfWho").onclick=()=>{view==="perfil"?goBack():goSub("perfil")};$("#profBtn").onclick=()=>{view==="perfil"?goBack():goSub("perfil")};$("#cfgBtn").onclick=()=>{view==="config"?goBack():goSub("config")};$("#backHelp").onclick=goBack;
$("#hq").addEventListener("input",debounced(e=>{helpQ=e.target.value.trim();renderHelp()},150));
$("#bkSave").onclick=async()=>{const m=$("#bkMsg");if(!downloadsFn)return;
  try{await downloadsFn.save({filename:`checklist-backup-${today()}.json`,data:JSON.stringify(buildBackup(),null,1)});markBackup();m.textContent="Backup salvo. No iPad/iPhone ele fica no app Arquivos, em Downloads."}
  catch(e){m.textContent=e&&/cancel|denied|declin/i.test(String(e.code||e.message))?"Salvamento cancelado.":"Não foi possível salvar o arquivo. Use Copiar backup e cole num arquivo de texto."}};
$("#bkCopy").onclick=async()=>{const m=$("#bkMsg"),txt=JSON.stringify(buildBackup());
  try{await navigator.clipboard.writeText(txt);m.textContent="Backup copiado ("+Math.round(txt.length/1024)+" KB). Cole no site do checklist em Importar backup, ou num arquivo de texto para guardar."}
  catch(e){m.textContent="Seu navegador não deixou copiar. Use Exportar backup."}};$("#backQuest").onclick=goBack;


$("#eq").addEventListener("input",debounced(e=>{eQuery=norm(e.target.value.trim());render()}));

try{const sb=localStorage.getItem("resid-sort");if(sb==="inc")sortBy="inc"}catch(e){}

$("#q").addEventListener("input",debounced(e=>{query=norm(e.target.value.trim());render()}));

function bindReset(){$("#resetBtn").onclick=()=>{$("#resetBox").innerHTML=`<div class="confirm"><span>Apagar níveis, revisões, questões e marcações de subtópicos de todos os temas? Anotações, subtópicos próprios, pesos ajustados e caderno de erros são mantidos.</span><button class="danger" id="yes">Apagar tudo</button><button id="no">Cancelar</button></div>`;
  $("#yes").onclick=()=>{const keep={};for(const k in state){const cs=state[k].cs,w=state[k].w;if((cs&&cs.length)||w){keep[k]={l:0};if(cs&&cs.length)keep[k].cs=cs.map(c=>({t:c.t,d:false}));if(w)keep[k].w=w}}state=keep;openKey=null;dayPlan=null;planTouched=false;commit();restore()}; $("#no").onclick=restore}}
function restore(){$("#resetBox").innerHTML=`<button class="reset" id="resetBtn">Zerar todo o progresso</button>`;bindReset()}
bindReset();

/* recalcula o plano quando o dia vira com a página aberta */
let lastDay=today(); setInterval(()=>{if(today()!==lastDay){lastDay=today();planNote="";render()}},60000);

["pointerdown","keydown","input","wheel","touchstart"].forEach(t=>document.addEventListener(t,()=>{liveAct=Date.now()},{capture:true,passive:true}));
document.addEventListener("focusout",()=>setTimeout(liveFlush,450));
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")liveHidAt=Date.now();else if(liveHidAt&&Date.now()-liveHidAt>1800000)liveRefresh()});
window.addEventListener("online",()=>liveRefresh(true));

(async()=>{
  try{
    const [db,user]=await Promise.all([window.claude?.use?.("db"),window.claude?.use?.("user")]);
    const uid=user?await user.id():null;
    if(!db||!uid){synced=true;facSyncAll();setSave("Progresso salvo neste navegador");errNoteMig();cdFixCut();conFix();setTimeout(maybeOnb,0);bankBoot(null);return}
    const P="data/users/"+uid+"/",prog=db.doc(P+"progress"),R={prog,fac:db.doc(P+"faculdade"),topics:prog.collection("topics"),settings:db.doc(P+"settings"),ui:db.doc(P+"prefs"),
      err:packStore(prog,"errors"),free:prog.collection("free"),trash:prog.collection("trash"),cards:packStore(prog,"cards"),sims:prog.collection("sims"),redo:packStore(prog,"redo"),
      exams:prog.collection("exams"),exprog:prog.collection("exprog"),focus:packStore(prog,"focus"),notes:prog.collection("notes")};
    for(const r of Object.values(R))liveOpen(r);// todas as assinaturas de uma vez: as respostas chegam juntas
    store=prog;
    facStore=R.fac;
    try{const fs=await liveFirst(facStore);const fd=fs.exists?fs.data():null;
      if(facValid(fd)&&!facTouched){fac={sems:fd.sems,discs:fd.discs,provas:fd.provas,own:fd.own};if(fd.crunch&&typeof fd.crunch==="object")fac.crunch={mode:fd.crunch.mode,until:fd.crunch.until};facXCopy(fd,fac);registerOwn();try{localStorage.setItem(LSF,JSON.stringify(fac))}catch(e){}}
      else if(fac.sems.length||facTouched)saveFac()}catch(e){}
    const snap=await liveFirst(store);
    const data=snap.exists?snap.data():null;
    topicStore=R.topics;let remoteT=null;
    if(data&&data.split){try{const ts=await liveFirst(topicStore);remoteT={};ts.docs.forEach(d=>{remoteT[d.id]=d.data()})}catch(e){remoteT=null}}
    else if(data&&(data.topics||data.levels)){remoteT=data.topics||data.levels;
      /* conta já dividida, mas uma versão antiga do app voltou a gravar tudo junto: junta os dois, ficando com o registro mais recente de cada tema */
      try{const ts=await liveFirst(topicStore);if(ts.docs.length){remoteT={...remoteT};ts.docs.forEach(d=>{const a=d.data(),b=remoteT[d.id];if(!b||tNewer(a,b))remoteT[d.id]=a})}}catch(e){}}
    if(data&&data.split&&remoteT)for(const k in remoteT)tSaved[k]=JSON.stringify(remoteT[k]);
    if(data&&data.hist&&typeof data.hist==="object"){for(const k in data.hist){const r=data.hist[k],l=hist[k]||{};hist[k]={};for(const f of ["e","r","q","c","res","tq","ts"]){const v=Math.max(r[f]||0,l[f]||0);if(v)hist[k][f]=v}}try{localStorage.setItem(LSH,JSON.stringify(hist))}catch(e){}}
    if(data&&data.plan&&data.plan.d===today()&&Array.isArray(data.plan.items)){dayPlan=renamePlanLabels(data.plan);try{localStorage.setItem(LSDP,JSON.stringify(dayPlan))}catch(e){}}
    if(remoteT&&(data.split||Object.keys(remoteT).length||!Object.keys(state).length)){const local=state;state=migrate(remoteT);
      touchedEarly.forEach(k=>{if(local[k])state[k]=local[k];else delete state[k]});
      if(!(data.plan&&data.plan.d===today())&&!planTouched)dayPlan=null;// plano montado antes de carregar a conta: refaz com o progresso real
      synced=true;facSyncAll();render();if(estChanged||!data.split||touchedEarly.size||!dayPlan||!(data.plan&&data.plan.d===today())){estChanged=false;persist()}}
    else{synced=true;facSyncAll();if(Object.keys(state).length)persist()}
    settingsDoc=R.settings;
    try{const ss=await liveFirst(settingsDoc);const sp=ss.exists&&ss.data().prompt;
      if(typeof sp==="string"&&sp.trim()){promptText=promptUp(sp);try{localStorage.setItem(LSP,promptText)}catch(e){}if(!promptEdited)$("#promptBox").value=promptText}}catch(e){}
    uiDoc=R.ui;
    try{const us=await liveFirst(uiDoc);const ud=us.exists?us.data():null;if(ud&&!uiTouched){ui=uiSanitize(ud);try{localStorage.setItem(LSUI,JSON.stringify(ui))}catch(e){}applyUI();render()}else if(uiTouched)saveUI()}catch(e){}
    errStore=R.err;
    const es=await liveFirst(errStore);
    const remote=es.docs.map(d=>d.data()).filter(errOk);
    const rids=new Set(remote.map(e=>e.id)),{lo:localOnly,gone:eGone}=loOnly("err",es,errors,rids);
    if(remote.length||eGone){errors=[...remote.map(e=>({...e})),...localOnly];saveErrsLocal();render()}
    for(const e of localOnly)await putErr(e);
    freeStore=R.free;
    try{const fq=await liveFirst(freeStore),rem=fq.docs.map(d=>d.data()).filter(frOk).map(frClean),ids=new Set(rem.map(x=>x.id)),{lo,gone}=loOnly("free",fq,freeN,ids);
      if(rem.length||gone){freeN=[...rem,...lo];frSaveLocal();render()}for(const x of lo)await frPut(x)}catch(e){}
    trashStore=R.trash;
    try{const tq=await liveFirst(trashStore),rem=tq.docs.map(d=>d.data()).filter(trOk),ids=new Set(rem.map(x=>x.id)),{lo,gone}=loOnly("trash",tq,trash,ids);
      if(rem.length||gone){trash=[...rem,...lo];trSaveLocal()}for(const x of lo)await trPut(x);trPurgeOld()}catch(e){}
    cardStore=R.cards;
    try{const cq=await liveFirst(cardStore),rem=cq.docs.map(d=>d.data()).filter(cdOk).map(cdClean),ids=new Set(rem.map(x=>x.id)),{lo,gone}=loOnly("cards",cq,cards,ids);
      if(rem.length||gone){cards=[...rem,...lo];cdSaveLocal();render()}for(const x of lo)await cdPut(x)}catch(e){}
    simStore=R.sims;
    try{const sq=await liveFirst(simStore),rem=sq.docs.map(d=>d.data()).filter(smOk).map(smClean),ids=new Set(rem.map(x=>x.id)),{lo,gone}=loOnly("sims",sq,sims,ids);
      if(rem.length||gone){sims=[...rem,...lo].sort((a,b)=>a.at<b.at?1:-1);smSaveLocal();render()}for(const x of lo)await smPut(x)}catch(e){}
    redoStore=R.redo;
    try{const rq=await liveFirst(redoStore),rem=rq.docs.map(d=>d.data()).filter(rdOk).map(rdClean),ids=new Set(rem.map(x=>x.id)),{lo,gone}=loOnly("redo",rq,redo,ids,true);
      if(rem.length||gone){redo=[...rem,...lo];rdSaveLocal();render()}for(const x of lo)await rdPut(x)}catch(e){}
    exStore=R.exams;exPStore=R.exprog;
    exFigStore=store.collection("exfig");
    try{const q1=await liveFirst(exStore),rem=q1.docs.map(d=>d.data()).filter(exOk).map(exClean),ids=new Set(rem.map(x=>x.id)),{lo,gone}=loOnly("exams",q1,exams,ids);
      if(rem.length||gone){exams=[...rem,...lo].sort((a,b)=>a.at<b.at?1:-1);exSaveLocal();render()}for(const x of lo)await exPut(x)}catch(e){}
    try{const q2=await liveFirst(exPStore),rem=q2.docs.map(d=>d.data()).filter(exPOk).map(exPClean),ids=new Set(rem.map(x=>x.id)),{lo,gone}=loOnly("exprog",q2,exProg,ids);
      if(rem.length||gone){exProg=[...rem,...lo];exSaveLocal();render()}for(const x of lo)await exPWrite(x.id)}catch(e){}
    try{const q3=await exFigStore.get(),seen=new Set();q3.docs.forEach(d=>{const v=d.data();if(exfOk(v)){seen.add(v.id);if(!exFigs[v.id]){exFigs[v.id]=exfClean(v);idbDo("readwrite",st=>st.put(exFigs[v.id]))}}});
      for(const x of Object.values(exFigs))if(!seen.has(x.id))try{await exFigStore.doc(x.id).set({...x})}catch(e){}exfPurge()}catch(e){}
    focStore=R.focus;
    try{const fq=await liveFirst(focStore),rem=fq.docs.map(d=>d.data()).filter(foOk).map(foClean),ids=new Set(rem.map(x=>x.id)),{lo,gone}=loOnly("focus",fq,foSess,ids);
      if(rem.length||gone){foSess=[...rem,...lo].sort((a,b)=>a.s<b.s?1:-1);foSaveLocal();render()}for(const x of lo)await foPut(x)}catch(e){}
    notesStore=R.notes;
    try{const ns=await liveFirst(notesStore);let changed=false;
      ns.docs.forEach(d=>{const v=d.data();if(BYKEY[d.id]&&v&&typeof v.t==="string"&&v.t.trim()&&notes[d.id]!==v.t){
        const ae=document.activeElement;if(!(ae&&(ae.id==="nt-"+d.id||ae.id==="fnt-"+d.id))){notes[d.id]=v.t;if(v.updatedAt)noteAt[d.id]=v.updatedAt;changed=true}}});
      const remoteIds=new Set(ns.docs.map(d=>d.id));
      for(const k in notes)if(!remoteIds.has(k))await notesStore.doc(k).set({t:notes[k],updatedAt:noteAt[k]||new Date().toISOString()});
      if(changed){saveNotesLocal();render()}
    }catch(e){}
    setSave("Progresso salvo na sua conta");errNoteMig();cdFixCut();conFix();maybeOnb();liveStart();bankBoot(prog);
  }catch(e){store=null;synced=true;setSave("Progresso salvo neste navegador");errNoteMig();cdFixCut();conFix();setTimeout(maybeOnb,0);bankBoot(null)}
})();
