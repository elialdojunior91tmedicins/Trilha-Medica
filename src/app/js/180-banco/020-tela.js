/* ---------- Banco de questões, B2 (11/2026): a tela ----------
   A aba Questões vira o Banco: partes no topo (qPart = banco|sim|redo|provas|resumo; no celular, seletor "Banco ▾" que abre uma folha de baixo).
   Banco = filtros bkF (situação, Onde = Grande área › Especialidade › Tema, origem, banca, ano, nível, mais), presets (fixos BK_PRE + os salvos em
   ui.prefs.bkps), 4 contadores que também filtram, lista com o histórico (bkRowEl) e o jogador bkRun: "Resolver estas" (modo estudo, gabarito na hora)
   e "Simulado com estas" (modo prova: relógio, mapa, resultado no fim). Tempo de cada questão vai para o histórico (s).
   Na questão do banco: fav = favorita; del = tirada do banco (fica marcada, some nos outros aparelhos e não volta pela carga); fm = figura do material
   guardada (exFigs, id "bk_<id>", ex "bank"; nf = tinha figura e ela não foi guardada).
   Teimosa (bkTeim): 3 erros no total; sai com 2 acertos seguidos em dias diferentes; errou de novo, volta.
   Contagem: só a 1ª resposta (questão sem histórico) conta no acerto do tema (e, errada, vai para o Refazer); questão de prova na íntegra guardada conta
   na própria prova; as outras respostas contam só na meta semanal (hist.rq), como o Refazer. */
const QPARTS=[["banco","Banco","Todas as questões guardadas, com filtros","▤"],["sim","Simulado misto","Questões novas do Claude sobre os seus temas","✦"],["redo","Refazer","As que você errou, de volta no dia certo","↻"],["provas","Provas na íntegra","Importar e fazer provas inteiras","▣"],["resumo","Resumo","Gráficos, meta da semana e os seus temas","▦"]];
let qPart=(()=>{const v=lsGet("resid-qpart","banco");return QPARTS.some(p=>p[0]===v)?v:"banco"})(),qpSheet=false;
const qLegacy=()=>!!window.__qLegacy;// testes antigos: a aba como era (tudo junto), sem as partes do banco
function qGo(p){qPart=p;lsSet("resid-qpart",p);qpSheet=false;render();window.scrollTo({top:0})}
function qPartBarEl(){const w=el(`<div class="qparts"></div>`),rd=rdDueList().length,cur=QPARTS.find(p=>p[0]===qPart)||QPARTS[0];
  const badge=v=>v==="redo"&&rd?`<b class="qpn">${rd}</b>`:"";
  if(isPhoneL()){const b=el(`<button class="qpbtn" type="button" id="qpBtn" aria-haspopup="true" aria-expanded="${qpSheet}"><span class="qpi" aria-hidden="true"></span><span class="qpl"></span>${qPart!=="redo"?badge("redo"):""}<span class="pchev" aria-hidden="true"></span></button>`);
    b.querySelector(".qpi").textContent=cur[3];b.querySelector(".qpl").textContent=cur[1];b.onclick=()=>{qpSheet=!qpSheet;render()};w.appendChild(b);
    if(qpSheet){const bk=el(`<div class="tfback" aria-hidden="true"></div>`);bk.onclick=()=>{qpSheet=false;render()};w.appendChild(bk);
      const sh=el(`<div class="qpsheet" role="menu" aria-label="Partes do banco"><div class="tfsh"><span class="tfsgrab" aria-hidden="true"></span><b>Banco de questões</b><span class="sp"></span><button class="tfsx" type="button" aria-label="Fechar">×</button></div></div>`);
      sh.querySelector(".tfsx").onclick=()=>{qpSheet=false;render()};
      QPARTS.forEach(([v,l,h,ic])=>{const o=el(`<button class="qpopt" type="button" role="menuitem"><span class="qpi" aria-hidden="true"></span><span class="qpt"><b></b><span></span></span>${badge(v)}</button>`);o.id="qpo-"+v;o.setAttribute("aria-current",v===qPart);
        o.querySelector(".qpi").textContent=ic;o.querySelector("b").textContent=l;o.querySelector(".qpt>span").textContent=v==="redo"&&rd?`${rd} para hoje · `+h.toLowerCase():h;o.onclick=()=>qGo(v);sh.appendChild(o)});w.appendChild(sh)}
    return w}
  const nav=el(`<nav class="qpnav" aria-label="Partes do banco de questões"></nav>`);
  QPARTS.forEach(([v,l,h])=>{const b=el(`<button type="button"><span></span>${badge(v)}</button>`);b.id="qp-"+v;b.title=h;b.querySelector("span").textContent=l;b.setAttribute("aria-pressed",v===qPart);b.onclick=()=>qGo(v);nav.appendChild(b)});
  w.appendChild(nav);return w}
/* ---- dados do banco para a tela ---- */
const BK_O=[["prova","Provas na íntegra"],["oficial","Provas oficiais"],["simulado","Simulados"],["gerada","Geradas pelo Claude"],["mat","Do seu material"]];
const BK_ST=[["nr","Não resolvidas"],["r","Resolvidas"],["ok","Acertadas"],["no","Erradas"]];
const BK_SORT=[["new","Mais recentes"],["err","Mais erradas"],["old","Feitas há mais tempo"],["ban","Banca e ano"]];
const BK_PAGE=40,BK_RUN_MAX=100;
function bkFDef(){return {q:"",st:"all",area:"all",sp:"all",k:"all",sb:"",ban:[],ano:[],niv:[],o:[],fav:false,img:false,old:false,nf:false,teim:false,dyn:"",pre:""}}
function bkFClean(f){const o=bkFDef();if(!f||typeof f!=="object")return o;const s=(v,m)=>typeof v==="string"?v.slice(0,m):"";
  o.q=s(f.q,80);if(["all","nr","r","ok","no"].includes(f.st))o.st=f.st;for(const k of ["area","sp","k"])if(s(f[k],80))o[k]=s(f[k],80);if(o.k!=="all"&&s(f.sb,70))o.sb=s(f.sb,70);
  for(const k of ["ban","ano","niv","o"])if(Array.isArray(f[k]))o[k]=f[k].filter(v=>typeof v==="string").map(v=>v.slice(0,140)).slice(0,20);
  for(const k of ["fav","img","old","nf","teim"])o[k]=!!f[k];if(["eixo","prova"].includes(f.dyn))o.dyn=f.dyn;return o}
let bkF=bkFDef(),bkSort=(()=>{const v=lsGet("resid-bksort","new");return BK_SORT.some(x=>x[0]===v)?v:"new"})(),bkOpen=null,bkShown=BK_PAGE,bkRun=null,bkFPanel=false,bkSimOpen=false,bkSimN=10,bkSaveOn=false,bkArm=null,bkQT=null;
const bkStxt=new Map();
const bkLive=()=>bank.filter(x=>!x.del);
const bkH=x=>{const H=bankHById.get(x.id);return H?H.a:[]};
function bkTeim(A){let e=0,inT=false,st=0,ld="";for(const y of A){if(!y.ok){e++;if(e>=3)inT=true;st=0;ld=""}else if(inT&&y.d!==ld){st++;ld=y.d;if(st>=2){inT=false;st=0}}}return inT}
function bkInfo(x){const A=bkH(x),last=A.length?A[A.length-1]:null,no=A.filter(y=>!y.ok).length;return {A,n:A.length,ok:A.length-no,no,last,st:!last?"nr":last.ok?"ok":"no",teim:bkTeim(A)}}
function bkTxt(x){let c=bkStxt.get(x.id);if(!c||c.u!==x.u){c={u:x.u,t:" "+bqT([x.q.enunciado,x.q.comentario||"",...x.q.alternativas.map(a=>a.texto)].join(" "))+" "};bkStxt.set(x.id,c)}return c.t}
function bkAxKeys(){const AX=axNow(),S=new Set();AX.list.forEach(e=>{ALL.forEach(it=>{if(it.area.code===e.area&&(!e.spec||it.sp===e.spec))S.add(it.key)});(e.sps||[]).forEach(f=>topicKeysOf(spAsProva(f.d,f.s).items).forEach(k=>S.add(k)))});
  AX.noArea.forEach(f=>topicKeysOf(spAsProva(f.d,f.s).items).forEach(k=>S.add(k)));return {lab:AX.list.map(e=>e.lab).join(", "),keys:S}}
function bkProvaKeys(){const up=upcomingProvas()[0];return up?{lab:up.name,d:up.date?daysTo(up.date):null,keys:new Set(topicKeysOf(up.items))}:null}
const bkOrig=x=>x.mat?"mat":x.o;
const bkIts=x=>x.ks.map(k=>BYKEY[k]).filter(Boolean);
/* filtro; skip = dimensões ignoradas (para as contagens de cada grupo) */
function bkMatch(R,F,K,skip){const x=R.x,I=R.I;skip=skip||"";
  if(F.q){const W=bqT(F.q).split(" ").filter(Boolean),t=bkTxt(x);if(!W.every(w=>t.includes(w)))return false}
  if(!skip.includes("st")&&F.st!=="all"&&(F.st==="r"?I.st==="nr":I.st!==F.st))return false;
  if(!skip.includes("w")){if(F.k!=="all"){if(!x.ks.includes(F.k))return false;if(F.sb&&!skip.includes("sb")&&(F.sb==="-"?x.ks[0]===F.k&&x.sb:x.ks[0]!==F.k||x.sb!==F.sb))return false}
    else if(F.area!=="all"&&!bkIts(x).some(it=>it.area.code===F.area&&(F.sp==="all"||it.sp===F.sp)))return false}
  if(!skip.includes("o")&&F.o.length&&!F.o.includes(bkOrig(x)))return false;
  if(!skip.includes("ban")&&F.ban.length&&!F.ban.includes(x.ban||""))return false;
  if(!skip.includes("ano")&&F.ano.length&&!F.ano.includes(x.ano||""))return false;
  if(!skip.includes("niv")&&F.niv.length&&!F.niv.includes(x.niv||""))return false;
  if(!skip.includes("m")){if(F.fav&&!x.fav)return false;if(F.img&&!(x.fg||x.fm))return false;if(F.old&&(x.an||x.dz))return false;if(F.nf&&!(x.nf&&!x.fm))return false;if(F.teim&&!I.teim)return false}
  if(F.dyn&&!skip.includes("dyn")&&!(K&&x.ks.some(k=>K.has(k))))return false;
  return true}
function bkSorted(L){const t=x=>x.I.last?x.I.last.d:"";const S={new:(a,b)=>a.x.at<b.x.at?1:a.x.at>b.x.at?-1:0,
    err:(a,b)=>b.I.no-a.I.no||(t(a)<t(b)?1:-1),old:(a,b)=>(!a.I.last)-(!b.I.last)||(t(a)<t(b)?-1:t(a)>t(b)?1:0),
    ban:(a,b)=>(a.x.ban||"~").localeCompare(b.x.ban||"~")||(b.x.ano||"").localeCompare(a.x.ano||"")||(a.x.pv||"").localeCompare(b.x.pv||"")||(a.x.pn||0)-(b.x.pn||0)};
  return [...L].sort(S[bkSort]||S.new)}
function bkDyn(F){return F.dyn==="eixo"?bkAxKeys():F.dyn==="prova"?bkProvaKeys():null}
function bkCompute(){const F=bkF,D=bkDyn(F),K=D?D.keys:null,R=bkLive().map(x=>({x,I:bkInfo(x)}));return {F,D,K,R,vis:bkSorted(R.filter(r=>bkMatch(r,F,K)))}}
const bkAgo=d=>{const n=-daysTo(d);return n<=0?"hoje":n===1?"ontem":`há ${n} dias`};
const bkHistTxt=I=>!I.n?"inédita":[I.no?`errou ${I.no}`:"",I.ok?`acertou ${I.ok}`:""].filter(Boolean).join(" · ");
/* ---- mudanças na questão ---- */
function bkTouch(x){x.u=new Date().toISOString();bankDirty.add(x.id);bankSoon()}
function bkFav(x){if(x.fav)delete x.fav;else x.fav=1;bkTouch(x)}
function bkDel(x){x.del=1;delete x.fav;bkTouch(x);if(bkOpen===x.id)bkOpen=null;exfDel("bk_"+x.id);
  infoToast("Questão tirada do banco.","Desfazer",()=>{delete x.del;bkTouch(x);render()})}
/* figura do material: guardada como as das provas (comprimida, à parte, baixada só ao abrir a questão) */
function bkFigSet(bq,img){if(!img||bq.fm)return;exfPut({id:"bk_"+bq.id,ex:"bank",i:0,img});bq.fm=1;delete bq.nf;bkTouch(bq)}
function bkFigFrom(bq,q,P){if(!bq||bq.fm||!q.fg||!P||!P.figs)return;const f=P.figs.find(y=>y.no===q.fg.no);if(f&&f.blob)exfData(f.blob).then(img=>{if(img&&bankById.get(bq.id)===bq){bkFigSet(bq,img);render()}})}
function bkFigImg(x){return x.fm?exFig({id:"bk"},x.id):x.fg&&x.ex?exFig({id:x.ex},x.ei):""}
function bkFigEl(x){if(!(x.fm||x.fg||x.nf))return null;const img=bkFigImg(x);if(x.q.fg)return figEl(x.q,null,img);
  const w=el(`<figure class="qfig"></figure>`);if(img){const i=el(`<img alt="Figura da questão">`);i.src=img;i.onclick=()=>{try{window.open(img,"_blank")}catch(e){}};w.appendChild(i)}
  else w.appendChild(el(`<figcaption>${x.nf&&!x.fm?"Esta questão tinha uma figura que não foi guardada.":"Carregando a figura…"}</figcaption>`));return w}
/* ---- uma resposta no banco ---- */
function bkCounts(x){const k=x.ks[0];return !!(k&&BYKEY[k]&&!bkH(x).length&&!((x.o==="prova"||x.o==="oficial")&&x.ex&&exams.some(e=>e.id===x.ex)))}
function bkAnswer(x,l,sec){const ok=l===x.q.correta,cnt=bkCounts(x),k=x.ks[0],d=today();sec=Math.min(1800,Math.max(1,sec||1));
  bhAdd(x.id,{d,l,ok:ok?1:0,s:Math.round(sec),src:"bank",...(cnt?{c:1}:{})});
  if(cnt){upd(k,y=>addQ(y,1,ok?1:0,null,x.ban||"Claude"));logAct("q",1,ok?1:0);logPace(d,1,sec)}
  else{const h=hist[d]||(hist[d]={});h.rq=(h.rq||0)+1}
  bkRdLink(x,ok);commit();return cnt}
/* ---------- Banco de questões, B3 (11/2026): ligações com o resto do app ----------
   Uma agenda só (bkAnswer → bkRdOf): questão do banco que está no Refazer conta como a revisão dela quando venceu (rdHit/rdMiss); antes de vencer, só o
   erro conta (rdMiss); errada fora do Refazer entra nele (de prova/oficial, só tema já estudado, como no Refazer). Sorteio inteligente bkSmart(L,n):
   inéditas primeiro; Onde focar (focusRank), peso do tema (wOf), eixo atual (bkAxKeys) e prova da faculdade em até 21 dias sobem; até ~1/4 do mesmo
   tema; anuladas e desatualizadas (dz) ficam de fora. Usado no "Simulado com estas" e no Simulado misto › Do banco (simStartBank; a questão leva bk = id).
   Fixar com questões do banco (bkFixEl no gerador do tema, bkFixNote ao concluir o tema, bkFixGo). Questão irmã (bkSister): outra inédita do mesmo
   tema, a mais parecida pelo conceito. dz = "Diretriz mudou", marcado à mão. */
const bkIdQ=new WeakMap();
function bkIdOfQ(q){let v=bkIdQ.get(q);if(!v){v="b"+bqHash(bqQ(q));bkIdQ.set(q,v)}return v}
function bkRdOf(id){return redo.find(r=>r&&r.q&&bkIdOfQ(r.q)===id)||null}
function bkRdLink(x,ok){const r=bkRdOf(x.id),k=x.ks[0];
  if(r){if(rdDue(r)<=today()){if(ok)rdHit(r);else rdMiss(r);return ok?"hit":"miss"}if(!ok){rdMiss(r);return "miss"}return ""}
  if(!ok&&k&&BYKEY[k]&&!((x.o==="prova"||x.o==="oficial")&&!rdStudied(k))){rdAdd(k,JSON.parse(JSON.stringify(x.q)),x.o==="simulado"?"sim":"gen");return "add"}return ""}
function bkScore(x,C){const its=bkIts(x),I=C.info.get(x.id);let s=!I.n?100:I.st==="no"?40:Math.min(30,(I.last?-daysTo(I.last.d):0)/3),w=0,f=0,ax=0,pv=0;
  its.forEach(it=>{w=Math.max(w,wOf(it)||1);const fi=C.focus.get(it.key);if(fi!=null)f=Math.max(f,30*(1-fi/C.focusN));if(C.ax.has(it.key))ax=25;if(C.pv&&C.pv.has(it.key))pv=25});
  return s+w*7+f+ax+pv+Math.random()*12}
function bkSmart(L,n){const ok=L.filter(x=>!x.del&&!x.an&&!x.dz&&bkIts(x).length);if(!ok.length)return [];
  const fr=focusRank().slice(0,20),pk=bkProvaKeys(),C={info:new Map(ok.map(x=>[x.id,bkInfo(x)])),focus:new Map(fr.map((it,i)=>[it.key,i])),focusN:Math.max(1,fr.length),ax:bkAxKeys().keys,pv:pk&&pk.d!=null&&pk.d<=21?pk.keys:null};
  const S=ok.map(x=>({x,s:bkScore(x,C)})).sort((a,b)=>b.s-a.s),cap=Math.max(2,Math.ceil(n/4)),per={},out=[],rest=[];
  for(const r of S){if(out.length>=n){rest.push(r.x);continue}const k=r.x.ks[0];if((per[k]||0)<cap){per[k]=(per[k]||0)+1;out.push(r.x)}else rest.push(r.x)}
  if(out.length<n)out.push(...rest.slice(0,n-out.length));return shuffle(out)}
function simStartBank(){const L=bkSmart(bkLive(),simCfg.n);if(!L.length)return;const qs=L.map(x=>({...JSON.parse(JSON.stringify(x.q)),k:x.ks.find(k=>BYKEY[k]),bk:x.id}));
  sim={status:"run",items:qs.map(q=>({k:q.k})),qs,i:0,ans:{},t:{},msg:"",src:"banco",cfg:simCfgSnap(),gen:true,start:Date.now(),shown:Date.now()};render();const h=$("#simh");if(h)h.scrollIntoView({block:"start"})}
const bkForTopic=k=>bkLive().filter(x=>x.ks.includes(k)&&!x.an&&!x.dz);
function bkFixIds(k,n){const L=bkForTopic(k).map(x=>({x,I:bkInfo(x)})),t=r=>r.I.last?r.I.last.d:"";
  return [...shuffle(L.filter(r=>!r.I.n)),...L.filter(r=>r.I.n&&r.I.st==="no"),...L.filter(r=>r.I.n&&r.I.st==="ok").sort((a,b)=>t(a)<t(b)?-1:1)].slice(0,n||10).map(r=>r.x.id)}
function bkFixGo(k){const ids=bkFixIds(k,10);if(!ids.length)return;backStack=[];qPart="banco";lsSet("resid-qpart","banco");bkRun=null;setView("quest");bkStart(ids,"e")}
function bkFixEl(it){if(!bankOn)return null;const L=bkForTopic(it.key);if(!L.length)return null;const ni=L.filter(x=>!bkH(x).length).length;
  const w=el(`<div class="bkfix"><span></span><button class="btn" type="button">Fixar com questões do banco</button></div>`);w.querySelector("span").textContent=`No banco: ${L.length} ${L.length===1?"questão":"questões"} deste tema${ni?` (${ni} ${ni===1?"inédita":"inéditas"})`:" (todas já feitas)"}.`;
  const b=w.querySelector("button");b.id="bkFix-"+it.key;b.onclick=()=>bkFixGo(it.key);return w}
function bkFixNote(k){if(!bankOn||!BYKEY[k])return;const n=bkForTopic(k).length;if(!n)return;setTimeout(()=>infoToast(`Tema concluído. Há ${n} ${n===1?"questão":"questões"} dele no banco.`,"Fixar agora",()=>bkFixGo(k)),60)}
function bkWords(x){return new Set(bqT([x.q.conceito||"",x.q.comentario||"",x.q.enunciado].join(" ")).split(" ").filter(w=>w.length>4))}
function bkSister(x,used){const W=bkWords(x),L=bkLive().filter(y=>!used.has(y.id)&&!y.an&&!y.dz&&y.ks.some(k=>x.ks.includes(k))&&!bkH(y).length);if(!L.length)return null;
  let best=null,bs=-1;L.forEach(y=>{let s=0;bkWords(y).forEach(w=>{if(W.has(w))s++});if(s>bs){bs=s;best=y}});return best}
function bkDz(x){if(x.dz)delete x.dz;else x.dz=1;bkTouch(x)}
/* ---- o jogador: estudo (gabarito na hora) ou prova (relógio, resultado no fim) ---- */
function bkStart(ids,mode){const L=ids.map(id=>bankById.get(id)).filter(x=>x&&!x.del).slice(0,BK_RUN_MAX);if(!L.length)return;
  bkRun={ids:L.map(x=>x.id),i:0,mode,ans:{},t:{},cnt:{},shown:Date.now(),start:Date.now(),done:false,cad:{},rev:null};bkOpen=null;render();bkTop()}
/* tela inteira do banco (celular em pé e deitado, e também no computador): esconde as barras do app; barra própria com ≡ Menu e Sair */
let bkFull=lsGet("resid-bkfull","")==="1",bkNative=false;
const bkFullOn=()=>bkFull&&!!bkRun&&view==="quest"&&qPart==="banco"&&!qLegacy();
function bkFullSet(v){bkFull=v;lsSet("resid-bkfull",v?"1":null);
  try{if(v&&isPhoneL()&&document.documentElement.requestFullscreen&&!document.fullscreenElement){bkNative=true;document.documentElement.requestFullscreen().catch(()=>{bkNative=false})}}catch(e){bkNative=false}
  render();bkTop()}
function bkFullApply(){const R=document.documentElement,on=bkFullOn();if(on)R.dataset.bkfull="1";else delete R.dataset.bkfull;
  if(!on&&bkNative){bkNative=false;try{if(document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen().catch(()=>{})}catch(e){}}}
document.addEventListener("keydown",ev=>{if(ev.key==="Escape"&&bkFullOn()&&$("#navMenu").hidden){bkFullSet(false)}});
function bkTop(){setTimeout(()=>{if(document.documentElement.dataset.bkfull){const c=document.querySelector(".bkcard.bkrun");if(c)c.scrollTop=0;return}const h=$("#bkh");if(h)h.scrollIntoView({block:"start"})},30)}
function bkStay(){const R=bkRun;if(R&&R.mode==="p"&&!R.done){R.t[R.i]=(R.t[R.i]||0)+(Date.now()-R.shown)/1000;R.shown=Date.now()}}
function bkGoQ(j){const R=bkRun;if(!R||j<0||j>=R.ids.length)return;bkStay();R.i=j;R.shown=Date.now();render();bkTop()}
function bkPick(l){const R=bkRun;if(!R||R.done)return;const x=bankById.get(R.ids[R.i]);if(!x)return;
  if(R.mode==="p"){R.ans[R.i]=R.ans[R.i]===l?"":l;render();return}
  if(R.ans[R.i])return;const sec=(Date.now()-R.shown)/1000;R.ans[R.i]=l;R.t[R.i]=sec;R.cnt[R.i]=bkAnswer(x,l,sec);render()}
function bkNext(){const R=bkRun;if(R.i+1>=R.ids.length){R.done=true;R.rev=null;render();bkTop();return}R.i++;R.shown=Date.now();render();bkTop()}
function bkFinish(){const R=bkRun;bkStay();R.ids.forEach((id,i)=>{const x=bankById.get(id),l=R.ans[i];if(x&&l)R.cnt[i]=bkAnswer(x,l,R.t[i]||1)});R.done=true;R.rev=null;render();bkTop()}
function bkTick(){const c=$("#bkClock");if(!c||!bkRun||bkRun.done)return;const R=bkRun;c.textContent=R.mode==="p"?`⏱ ${fmtClock((Date.now()-R.start)/1000)}`:R.ans[R.i]?"":`${fmtPace(Math.floor((Date.now()-R.shown)/1000))} nesta questão`}
setInterval(bkTick,1000);
function bkQEl(x,mine,onPick,reveal){const card=el(`<div class="qcard bkq"><span class="qn"></span><div class="bkql"><p class="qstem"></p></div></div>`),its=bkIts(x);
  card.querySelector(".qstem").textContent=x.q.enunciado;{const f=bkFigEl(x);if(f)card.querySelector(".bkql").appendChild(f)}
  if(reveal){card.appendChild(altsEl(qSplit(x.q),mine||"_",mine?()=>{}:onPick))}
  else{const box=el(`<div class="alts"></div>`);x.q.alternativas.forEach(a=>{const b=el(`<button class="alt" type="button"><b>${esc(a.letra)})</b><span></span></button>`);b.id="bka-"+a.letra;b.querySelector("span").textContent=a.texto;if(mine===a.letra)b.classList.add("pick");b.onclick=()=>onPick(a.letra);box.appendChild(b)});card.appendChild(box)}
  return {card,its}}
function bkPlayEl(){const R=bkRun,w=el(`<div class="bkplay"></div>`),N=R.ids.length;
  const title=R.mode==="p"?"Simulado do banco":"Resolvendo do banco";
  if(bkFullOn()){const bar=el(`<div class="bkfbar"><button class="bkfb" type="button" id="bkFMenu" aria-label="Abrir o menu do app"><span aria-hidden="true">≡</span> Menu</button><div class="bkft"><h2 id="bkh"></h2><span class="bkfp"></span></div><span class="todaydate" id="bkClock"></span><button class="bkfb" type="button" id="bkFExit" aria-label="Sair da tela inteira">Sair <span aria-hidden="true">✕</span></button></div>`);
    bar.querySelector("h2").textContent=title;bar.querySelector(".bkfp").textContent=R.done?"Resultado":`Questão ${R.i+1} de ${N}`;bar.querySelector("#bkFMenu").onclick=()=>navMenuOpen();bar.querySelector("#bkFExit").onclick=()=>bkFullSet(false);w.appendChild(bar)}
  else{const head=el(`<div class="dhead"><h2 id="bkh"></h2><span class="bkhr"><span class="todaydate" id="bkClock"></span><button class="btn bkfullb" type="button" id="bkFullB"><span aria-hidden="true">⛶</span> Tela inteira</button></span></div>`);head.querySelector("h2").textContent=title;head.querySelector("#bkFullB").onclick=()=>bkFullSet(true);w.appendChild(head)}
  if(R.done){const ix=R.ids.map((id,i)=>i),ans=ix.filter(i=>R.ans[i]),hit=ans.filter(i=>{const x=bankById.get(R.ids[i]);return x&&R.ans[i]===x.q.correta}).length,tt=ans.reduce((s,i)=>s+(R.t[i]||0),0);
    w.appendChild(el(`<div class="kpis simres"><div class="kpi"><span class="kl">Acerto</span><b>${pct(hit,ans.length)}%</b><span class="ks">${hit} de ${ans.length}${ans.length<N?` · ${N-ans.length} em branco`:""}</span></div><div class="kpi"><span class="kl">Tempo total</span><b>${fmtPace(tt)}</b><span class="ks">${N} questões</span></div><div class="kpi${ans.length&&tt/ans.length>ui.prefs.qpace?" alert":""}"><span class="kl">Por questão</span><b>${ans.length?fmtPace(tt/ans.length):"–"}</b><span class="ks">prova: ${fmtPace(ui.prefs.qpace)}</span></div></div>`));
    const ol=el(`<ol class="simlist bkres"></ol>`);R.ids.forEach((id,i)=>{const x=bankById.get(id);if(!x)return;const it=bkIts(x)[0],l=R.ans[i],ok=l===x.q.correta,li=el(`<li><span class="simok ${l?ok?"ok":"no":""}">${l?ok?"✓":"✗":"–"}</span><button class="link" type="button"></button><span class="simt">${R.t[i]?fmtPace(R.t[i]):""}</span></li>`),b=li.querySelector("button");
      b.id="bkrv-"+i;b.textContent=`${i+1}. ${it?it.t:"Sem tema"}`;b.onclick=()=>{R.rev=R.rev===i?null:i;render()};ol.appendChild(li);
      if(R.rev===i){const {card}=bkQEl(x,l,null,true);card.appendChild(el(`<p class="verdict ${ok?"ok":"no"}">${!l?"Em branco. A resposta é "+esc(x.q.correta)+".":ok?"Você acertou.":"Você marcou "+esc(l)+"; a resposta é "+esc(x.q.correta)+"."}</p>`));
        card.appendChild(qExplEl(qSplit(x.q)));{const f=qFonteEl(x.q);if(f)card.appendChild(f)}{const b=bkCmBtn(x,"bkcm-"+i);if(b)card.appendChild(b)}if(l&&!ok&&it)card.appendChild(eCadEl(R.cad,i,it.key,x.q,l,"Banco de questões"));if(l&&it)card.appendChild(qActsEl(x.q,l,{k:it.key,src:"Banco de questões"}));li.appendChild(card)}});
    w.appendChild(ol);const nc=Object.values(R.cnt).filter(Boolean).length;
    w.appendChild(el(`<p class="how">${nc?`${nc} ${nc===1?"questão inédita contou":"questões inéditas contaram"} no acerto dos temas (as erradas foram para o Refazer). `:""}${ans.length-nc>0?`${ans.length-nc} já ${ans.length-nc===1?"feita antes conta":"feitas antes contam"} só na meta semanal de questões. `:""}Tudo ficou no histórico de cada questão.</p>`));
    const bt=el(`<div class="btns"></div>`),wr=R.ids.filter((id,i)=>{const x=bankById.get(id);return x&&R.ans[i]&&R.ans[i]!==x.q.correta});
    const b1=el(`<button class="btn primary" type="button" id="bkBack">Voltar ao banco</button>`);b1.onclick=()=>{bkRun=null;render();bkTop()};bt.appendChild(b1);
    if(wr.length){const b2=el(`<button class="btn" type="button" id="bkAgainWr"></button>`);b2.textContent=`Refazer as ${wr.length} erradas`;b2.onclick=()=>bkStart(wr,"e");bt.appendChild(b2)}
    w.appendChild(bt);return w}
  const x=bankById.get(R.ids[R.i]);if(!x){bkRun=null;return w}
  const mine=R.ans[R.i]||"",reveal=R.mode==="e"&&!!mine,{card,its}=bkQEl(x,mine,l=>bkPick(l),reveal),it=its[0];
  card.querySelector(".qn").textContent=`QUESTÃO ${R.i+1} DE ${N}${x.ban?` · ${x.ban}${x.ano?" "+x.ano:""}`:""}`;
  if(R.mode==="p"){const sp=el(`<div class="explay exside bkside2"><div class="expmain"></div><aside class="exaside"><div class="exmap" role="group" aria-label="Mapa das questões"></div><p class="exmapl"><span class="done">respondida</span><span class="an">em branco</span></p></aside></div>`);
    sp.querySelector(".expmain").appendChild(card);const mp=sp.querySelector(".exmap");R.ids.forEach((id,i)=>{const b=el(`<button type="button">${i+1}</button>`);b.id="bkm-"+i;if(R.ans[i])b.classList.add("done");if(i===R.i)b.setAttribute("aria-current","true");b.onclick=()=>bkGoQ(i);mp.appendChild(b)});
    if(!twoCols())sp.classList.add("exnarrow");w.appendChild(sp);
    const acts=el(`<div class="btns"></div>`),pv=el(`<button class="btn" type="button" id="bkPrev">Anterior</button>`),nx=el(`<button class="btn" type="button" id="bkNextP">Próxima</button>`),fin=el(`<button class="btn primary" type="button" id="bkFinish">Entregar</button>`);
    pv.disabled=R.i===0;pv.onclick=()=>bkGoQ(R.i-1);nx.disabled=R.i+1>=N;nx.onclick=()=>bkGoQ(R.i+1);fin.onclick=bkFinish;acts.append(pv,nx,fin);w.appendChild(acts);
    w.appendChild(el(`<p class="how">Modo prova: o gabarito aparece só no fim. Toque de novo numa alternativa para deixar em branco. ${Object.values(R.ans).filter(Boolean).length} de ${N} respondidas.</p>`));return w}
  /* estudo */
  if(mine){const ok=mine===x.q.correta,I=bkInfo(x);card.appendChild(el(`<p class="verdict ${ok?"ok":"no"}">${ok?"Correta.":"Incorreta. A resposta é "+esc(x.q.correta)+"."} <span class="simt">${fmtPace(R.t[R.i]||0)}</span></p>`));
    if(I.n>1){const p=el(`<p class="bkhline"></p>`);p.textContent=`Você já fez esta questão ${I.n} vezes: ${[I.no?`errou ${I.no}`:"",I.ok?`acertou ${I.ok}`:""].filter(Boolean).join(", ")}.${R.cnt[R.i]?"":" Esta vez conta só na meta semanal."}`;card.appendChild(p)}
    if(it){const t=el(`<p class="simtopic"></p>`);t.textContent=`${it.t} · ${it.area.code}${it.sp?" · "+it.sp:""}`;card.appendChild(t)}
    card.appendChild(qExplEl(qSplit(x.q)));{const f=qFonteEl(x.q);if(f)card.appendChild(f)}{const b=bkCmBtn(x,"bkcm-"+R.i);if(b)card.appendChild(b)}if(x.q.alerta&&x.q.alerta.trim()){const p=el(`<p class="alerta"></p>`);p.textContent="Atenção: "+x.q.alerta;card.appendChild(p)}
    if(!ok&&!(R.sis||{})[R.i]){const y=bkSister(x,new Set(R.ids));if(y){const sb=el(`<div class="bksis"><button class="btn" type="button" id="bkSis">Fazer uma questão irmã</button><span class="how">Outra inédita do mesmo tema, parecida no conceito: mostra se você aprendeu ou só decorou esta.</span></div>`);
      sb.querySelector("button").onclick=()=>{R.sis=R.sis||{};R.sis[R.i]=1;R.ids.splice(R.i+1,0,y.id);bkNext()};card.appendChild(sb)}}
    if(!ok&&it)card.appendChild(eCadEl(R.cad,R.i,it.key,x.q,mine,"Banco de questões"));if(it)card.appendChild(qActsEl(x.q,mine,{k:it.key,src:"Banco de questões"}))}
  else card.appendChild(el(`<p class="simtopic">Tema revelado depois de responder</p>`));
  w.appendChild(card);const acts=el(`<div class="btns"></div>`);
  if(mine){const nx=el(`<button class="btn primary" type="button" id="bkNext"></button>`);nx.textContent=R.i+1>=N?"Ver resultado":"Próxima";nx.onclick=bkNext;acts.appendChild(nx)}
  const st=el(`<button class="btn" type="button" id="bkEnd">Encerrar</button>`);st.onclick=()=>{if(!Object.keys(R.ans).length){bkRun=null;render();return}R.ids=R.ids.slice(0,Object.keys(R.ans).length);R.done=true;render();bkTop()};acts.appendChild(st);
  w.appendChild(acts);w.appendChild(el(`<p class="how erkeys">Teclado: A a E escolhem a alternativa · espaço vai para a próxima</p>`));return w}
document.addEventListener("keydown",ev=>{if(view!=="quest"||!bkRun||bkRun.done||qPart!=="banco")return;const t=ev.target;if(t&&/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)||ev.metaKey||ev.ctrlKey||ev.altKey)return;
  const R=bkRun,x=bankById.get(R.ids[R.i]);if(!x)return;const k=ev.key.toUpperCase();
  if(/^[A-H]$/.test(k)&&x.q.alternativas.some(a=>a.letra===k)){ev.preventDefault();bkPick(k);return}
  if(ev.key===" "){if(R.mode==="e"&&R.ans[R.i]){ev.preventDefault();bkNext()}else if(R.mode==="p"&&R.i+1<R.ids.length){ev.preventDefault();bkGoQ(R.i+1)}}});
/* ---- filtros ---- */
const BK_PRE=[["ined","Inéditas",F=>{F.st="nr"},"Nunca respondidas"],["teim","Teimosas",F=>{F.teim=true},"Erradas 3 vezes ou mais; saem com 2 acertos seguidos em dias diferentes"],["eixo","Eixo atual",F=>{F.dyn="eixo"},"Temas da área e das SPs que a faculdade está vendo agora"],["prova","Prova da faculdade",F=>{F.dyn="prova"},"Temas da sua próxima prova da faculdade"],["fav","Favoritas",F=>{F.fav=true},"As que você marcou com ☆"]];
function bkSet(fn){fn(bkF);bkF.pre="";bkShown=BK_PAGE;bkOpen=null}
function bkPreset(id){if(bkF.pre===id)bkF=bkFDef();else{const p=BK_PRE.find(x=>x[0]===id),c=(ui.prefs.bkps||[]).find(x=>x.id===id);bkF=bkFDef();if(p)p[2](bkF);else if(c)bkF=bkFClean(c.f);bkF.pre=id}bkShown=BK_PAGE;bkOpen=null}
const bkActive=F=>!!(F.q||F.st!=="all"||F.area!=="all"||F.k!=="all"||F.ban.length||F.ano.length||F.niv.length||F.o.length||F.fav||F.img||F.old||F.nf||F.teim||F.dyn);
function bkActs(F,D){const A=[],tog=(arr,v)=>()=>bkSet(f=>{f[arr]=f[arr].filter(y=>y!==v)});
  if(F.q)A.push([`“${F.q}”`,()=>bkSet(f=>{f.q=""})]);if(F.st!=="all")A.push([(BK_ST.find(s=>s[0]===F.st)||["",""])[1],()=>bkSet(f=>{f.st="all"})]);
  if(F.k!=="all")A.push([BYKEY[F.k]?BYKEY[F.k].t:"Tema",()=>bkSet(f=>{f.k="all";f.sb=""})]);else if(F.area!=="all")A.push([F.sp!=="all"?F.sp:fcAreaName(F.area),()=>bkSet(f=>{if(f.sp!=="all")f.sp="all";else f.area="all"})]);if(F.k!=="all"&&F.sb)A.push([F.sb==="-"?"Sem subtópico":sbLabel(F.k,F.sb)||"Subtópico",()=>bkSet(f=>{f.sb=""})]);
  F.o.forEach(v=>A.push([(BK_O.find(o=>o[0]===v)||["",v])[1],tog("o",v)]));F.ban.forEach(v=>A.push([v||"Sem banca",tog("ban",v)]));F.ano.forEach(v=>A.push([v||"Sem ano",tog("ano",v)]));F.niv.forEach(v=>A.push([v||"Sem nível",tog("niv",v)]));
  if(F.fav)A.push(["Favoritas",()=>bkSet(f=>{f.fav=false})]);if(F.img)A.push(["Com imagem",()=>bkSet(f=>{f.img=false})]);if(F.old)A.push(["Sem anuladas e desatualizadas",()=>bkSet(f=>{f.old=false})]);
  if(F.nf)A.push(["Figura não guardada",()=>bkSet(f=>{f.nf=false})]);if(F.teim)A.push(["Teimosas",()=>bkSet(f=>{f.teim=false})]);
  if(F.dyn)A.push([F.dyn==="eixo"?`Eixo atual${D&&D.lab?": "+D.lab:""}`:D?`Prova: ${D.lab}`:"Prova da faculdade (nenhuma marcada)",()=>bkSet(f=>{f.dyn=""})]);return A}
/* filtros em grupos recolhíveis (lembrados em resid-bkfg): Situação e Origem em linhas com bolinha e contagem, Banca/Ano/Nível em etiquetas,
   Mais em chaves liga/desliga; o título do grupo resume o que está ligado. Volta [[título,"",nó]] para o fcBody (celular) e a coluna da esquerda. */
let bkFgShut=new Set((lsGet("resid-bkfg","")||"").split(",").filter(Boolean));
function bkFg(key,title,sum,body,on){const s=el(`<section class="bkfg"><button type="button" class="bkfgh"><span class="bkfgt"></span><span class="bkfgs"></span><span class="bkchev" aria-hidden="true"></span></button><div class="bkfgb"></div></section>`),h=s.querySelector(".bkfgh"),shut=bkFgShut.has(key);
  s.dataset.g=key;h.id="bkFg-"+key;h.setAttribute("aria-expanded",!shut);s.querySelector(".bkfgt").textContent=title;const sm=s.querySelector(".bkfgs");sm.textContent=sum||"";if(on)sm.classList.add("on");
  h.onclick=()=>{bkFgShut.has(key)?bkFgShut.delete(key):bkFgShut.add(key);lsSet("resid-bkfg",[...bkFgShut].join(","));render()};if(!shut)s.querySelector(".bkfgb").appendChild(body);else s.classList.add("shut");return s}
function bkFo(id,lab,n,on,dot,fn,radio){const b=el(`<button type="button" class="bkfo"><i class="bkdot" aria-hidden="true"></i><span class="bkfol"></span><small></small><span class="bkck" aria-hidden="true"></span></button>`);b.id=id;
  b.setAttribute(radio?"aria-checked":"aria-pressed",on);if(radio)b.setAttribute("role","radio");b.querySelector(".bkdot").classList.add(dot);b.querySelector(".bkfol").textContent=lab;b.querySelector("small").textContent=n;if(!on&&!n)b.classList.add("z");b.onclick=()=>{fn();render()};return b}
function bkFc(id,lab,n,on,fn){const b=el(`<button type="button" class="bkfc2"><span></span><small></small></button>`);b.id=id;b.setAttribute("aria-pressed",on);b.firstChild.textContent=lab;b.lastChild.textContent=n;if(!on&&!n)b.classList.add("z");b.onclick=()=>{fn();render()};return b}
function bkFs(id,lab,n,on,fn,tip){const b=el(`<button type="button" class="bkfs" role="switch"><span class="bkfsl"></span><small></small><span class="bksw" aria-hidden="true"><i></i></span></button>`);b.id=id;b.setAttribute("aria-checked",on);if(tip)b.title=tip;b.querySelector(".bkfsl").textContent=lab;b.querySelector("small").textContent=n;b.onclick=()=>{fn();render()};return b}
function bkGroups(C){const {F,R,K}=C,n=skip=>R.filter(x=>bkMatch(x,F,K,skip)),G=[],box=c=>el(`<div class="${c}"></div>`);
  {const L=n("st"),w=box("bkfrows");w.setAttribute("role","radiogroup");w.setAttribute("aria-label","Situação");
    w.appendChild(bkFo("bkS-all","Todas",L.length,F.st==="all","d-all",()=>bkSet(f=>{f.st="all"}),1));
    BK_ST.forEach(([v,l])=>w.appendChild(bkFo("bkS-"+v,l,L.filter(r=>v==="r"?r.I.st!=="nr":r.I.st===v).length,F.st===v,"d-"+v,()=>bkSet(f=>{f.st=f.st===v?"all":v}),1)));
    G.push(bkFg("st","Situação",F.st==="all"?"Todas":(BK_ST.find(s=>s[0]===F.st)||["",""])[1],w,F.st!=="all"))}
  {const L=n("w"),cnt=(a,sp,k)=>L.filter(r=>k?r.x.ks.includes(k):bkIts(r.x).some(it=>(a==="all"||it.area.code===a)&&(sp==="all"||it.sp===sp))).length,w=box("bkfsel");
    w.appendChild(fcSel("bkArea","Grande área",[["all",`Todas as áreas (${L.length})`],...AREAS.map(a=>[a.code,`${a.name} (${cnt(a.code,"all")})`]).filter(o=>!/\(0\)$/.test(o[1])||o[0]===F.area)],F.area,v=>bkSet(f=>{f.area=v;f.sp="all";f.k="all"})));
    if(F.area!=="all"){const A=AREAS.find(a=>a.code===F.area),names=A?(A.specs||[]).map(s=>s.name):[];w.appendChild(fcSel("bkSp","Especialidade",[["all","Todas"],...names.map(s=>[s,`${s} (${cnt(F.area,s)})`]).filter(o=>!/\(0\)$/.test(o[1])||o[0]===F.sp)],F.sp,v=>bkSet(f=>{f.sp=v;f.k="all"})));
      const T=ALL.filter(it=>it.area.code===F.area&&(F.sp==="all"||it.sp===F.sp)).map(it=>[it.key,`${it.t} (${cnt(null,null,it.key)})`]).filter(o=>!/\(0\)$/.test(o[1])||o[0]===F.k);
      w.appendChild(fcSel("bkTema","Tema",[["all","Todos"],...T],F.k,v=>bkSet(f=>{f.k=v;f.sb=""})));
      if(F.k!=="all"&&BYKEY[F.k]){const LS=n("sb").filter(r=>r.x.ks.includes(F.k)),cs=v=>LS.filter(r=>v==="-"?!(r.x.ks[0]===F.k&&r.x.sb):r.x.ks[0]===F.k&&r.x.sb===v).length,SB=subList(BYKEY[F.k]).map(y=>[sbKey(y),`${y.t} (${cs(sbKey(y))})`]).filter(o=>!/\(0\)$/.test(o[1])||o[0]===F.sb);
        if(SB.length)w.appendChild(fcSel("bkSub","Subtópico",[["",`Todos (${LS.length})`],...SB,["-",`Sem subtópico (${cs("-")})`]],F.sb,v=>bkSet(f=>{f.sb=v})))}}
    else{w.appendChild(fcSel("bkSp","Especialidade",[["all","Escolha a área antes"]],"all",null,true));w.appendChild(fcSel("bkTema","Tema",[["all","Escolha a área antes"]],"all",null,true))}
    const sum=F.k!=="all"&&BYKEY[F.k]?BYKEY[F.k].t:F.area!=="all"?(F.sp!=="all"?F.sp:fcAreaName(F.area)):"Todo o banco";G.push(bkFg("w","Onde",sum,w,F.area!=="all"||F.k!=="all"))}
  {const L=n("o"),c=v=>L.filter(r=>bkOrig(r.x)===v).length,O=BK_O.filter(([v])=>c(v)||F.o.includes(v));
    if(O.length){const w=box("bkfrows");O.forEach(([v,l])=>w.appendChild(bkFo("bkO-"+v,l,c(v),F.o.includes(v),"d-o-"+v,()=>bkSet(f=>{f.o=f.o.includes(v)?f.o.filter(y=>y!==v):[...f.o,v]}))));
      G.push(bkFg("o","Origem",F.o.length?F.o.map(v=>(BK_O.find(o=>o[0]===v)||["",v])[1]).join(", "):"Todas",w,!!F.o.length))}}
  for(const [key,lab,emp] of [["ban","Banca","Sem banca"],["ano","Ano","Sem ano"],["niv","Nível da prova","Sem nível"]]){const L=n(key),vals=[...new Set(L.map(r=>r.x[key]||""))].filter(Boolean).sort((a,b)=>key==="ano"?b.localeCompare(a):a.localeCompare(b));
    if(!vals.length&&!F[key].length)continue;const V=[...vals,...(L.some(r=>!r.x[key])?[""]:[])],w=box("bkfchips");
    V.forEach((v,i)=>w.appendChild(bkFc(`bk${key}-${i}`,v||emp,L.filter(r=>(r.x[key]||"")===v).length,F[key].includes(v),()=>bkSet(f=>{f[key]=f[key].includes(v)?f[key].filter(y=>y!==v):[...f[key],v]}))));
    G.push(bkFg(key,lab,F[key].length?F[key].map(v=>v||emp).join(", "):"Todas",w,!!F[key].length))}
  {const L=n("m"),M=[["fav","☆ Favoritas",r=>r.x.fav,""],["teim","Teimosas",r=>r.I.teim,"Erradas 3 vezes ou mais"],["img","Com imagem",r=>r.x.fg||r.x.fm,""],["old","Esconder anuladas e desatualizadas",r=>r.x.an||r.x.dz,"Anuladas pela banca e as que você marcou como \"Diretriz mudou\""],["nf","Figura não guardada",r=>r.x.nf&&!r.x.fm,"Tinham figura do seu material, que não ficou guardada"]]
      .filter(([v,,f])=>v==="old"?L.some(f)||F.old:v==="nf"?L.some(f)||F.nf:true),w=box("bkfrows"),on=M.filter(([v])=>F[v]);
    M.forEach(([v,l,f,tip])=>w.appendChild(bkFs("bkM-"+v,l,L.filter(f).length,F[v],()=>bkSet(g=>{g[v]=!g[v]}),tip)));
    G.push(bkFg("m","Mais",on.length?on.map(([,l])=>l.replace("☆ ","")).join(", "):"",w,!!on.length))}
  return G.map(s=>["","",s])}
/* ---- a parte Banco ---- */
function bkCard(){const c=el(`<section class="card bkcard" aria-labelledby="bkh"></section>`);
  if(bkRun){c.classList.add("bkrun");c.appendChild(bkPlayEl());return c}
  const C=bkCompute(),{F,D,R,vis}=C,live=R.length;
  const head=el(`<div class="dhead"><h2 id="bkh">Banco de questões</h2><span class="bksum"></span></div>`);
  {const B=new Set(R.map(r=>r.x.ban).filter(Boolean)),Y=R.map(r=>r.x.ano).filter(Boolean).sort();head.querySelector(".bksum").textContent=live?`${live} ${live===1?"questão":"questões"}${B.size?` · ${B.size} ${B.size===1?"banca":"bancas"}`:""}${Y.length?` · ${Y[0]===Y[Y.length-1]?Y[0]:Y[0]+"–"+Y[Y.length-1]}`:""}`:""}
  c.appendChild(head);
  if(!live){const e=el(`<div class="bkempty"><b>Seu banco começa aqui</b><p class="how">Toda questão que passa pelo app fica guardada: as das provas que você importa, as dos simulados e as que o Claude gera nos temas, também as que você acerta.</p><div class="btns"><button class="btn primary" type="button" id="bkImp">Importar prova em PDF</button><button class="btn" type="button" id="bkGen">Gerar questões de um tema</button></div></div>`);
    e.querySelector("#bkImp").onclick=()=>{impNew();qGo("provas")};e.querySelector("#bkGen").onclick=()=>{qGo("resumo");setTimeout(()=>{const f=$("#qFind");if(f)f.scrollIntoView({block:"start"})},60)};c.appendChild(e);return c}
  const G=bkGroups(C),act=bkActs(F,D),side=twoCols(),grid=el(`<div class="bkgrid${side?" bk2":""}"></div>`),main=el(`<div class="bkmain"></div>`);
  if(side){const as=el(`<aside class="bkside" aria-label="Filtros do banco"><div class="bksideh"><b>Filtros</b><span class="bksn"></span><button class="link" type="button" id="bkClearS">Limpar</button></div></aside>`),cl=as.querySelector("#bkClearS");
    as.querySelector(".bksn").textContent=act.length?String(act.length):"";if(!act.length)cl.hidden=true;cl.onclick=()=>{bkF=bkFDef();bkShown=BK_PAGE;render()};G.forEach(([, ,body])=>as.appendChild(body));grid.appendChild(as)}
  /* busca + filtros (celular) */
  {const s=el(`<div class="bksearch"><label class="tfsearch">${FC_ICO}<input type="search" class="search" id="bkQ" placeholder="Buscar no banco" autocomplete="off"></label></div>`),inp=s.querySelector("input");inp.value=F.q;
    inp.oninput=()=>{bkF.q=inp.value;bkF.pre="";bkShown=BK_PAGE;clearTimeout(bkQT);bkQT=setTimeout(()=>{render();const n=$("#bkQ");if(n){n.focus();try{n.setSelectionRange(n.value.length,n.value.length)}catch(e){}}},280)};
    main.appendChild(s);
    if(!side){const fb=el(`<div class="bkfc"></div>`);fcBody(fb,{tog:"bkFBtn",panelId:"bkFPanel",open:bkFPanel,onToggle:()=>{bkFPanel=!bkFPanel},act:[],onClear:()=>{bkF=bkFDef()},clearId:"bkClear2",groups:G,foot:`${vis.length} ${vis.length===1?"questão":"questões"}`});s.appendChild(fb)}}
  /* presets */
  {const P=el(`<div class="chips bkpre" role="group" aria-label="Atalhos de filtro"></div>`),cnt={teim:R.filter(r=>r.I.teim).length,fav:R.filter(r=>r.x.fav).length,ined:R.filter(r=>r.I.st==="nr").length};
    BK_PRE.forEach(([id,l,,tip])=>{const b=fcChip(cnt[id]!=null?`${l} · ${cnt[id]}`:l,bkF.pre===id,()=>bkPreset(id),"bkP-"+id,null,tip);P.appendChild(b)});
    (ui.prefs.bkps||[]).forEach(p=>{const b=fcChip(p.n,bkF.pre===p.id,()=>bkPreset(p.id),"bkP-"+p.id,null,"Filtro salvo");const x=el(`<button class="bkpx" type="button" aria-label="Apagar o filtro salvo">×</button>`);x.id="bkPx-"+p.id;
      x.onclick=()=>{ui.prefs.bkps=(ui.prefs.bkps||[]).filter(y=>y.id!==p.id);if(bkF.pre===p.id)bkF.pre="";saveUI();render()};const w=el(`<span class="bkpw"></span>`);w.append(b,x);P.appendChild(w)});
    if(bkActive(F)&&!bkF.pre){const sv=el(`<button class="chip bksave" type="button" id="bkSave">+ Salvar filtro</button>`);sv.onclick=()=>{bkSaveOn=!bkSaveOn;render();setTimeout(()=>{const n=$("#bkSaveN");if(n)n.focus()},30)};P.appendChild(sv)}
    main.appendChild(P);
    if(bkSaveOn&&bkActive(F)&&!bkF.pre){const f=el(`<div class="bksaverow"><input type="text" id="bkSaveN" maxlength="40" placeholder="Nome do filtro (ex.: Cardio ENARE)"><button class="btn primary" type="button" id="bkSaveOk">Salvar</button><button class="btn" type="button" id="bkSaveX">Cancelar</button></div>`),n=f.querySelector("input");
      const go=()=>{const t=n.value.trim();if(!t){n.focus();return}const id="u"+Date.now().toString(36);ui.prefs.bkps=[...(ui.prefs.bkps||[]),{id,n:t.slice(0,40),f:bkFClean(bkF)}].slice(-12);bkF.pre=id;bkSaveOn=false;saveUI();render()};
      f.querySelector("#bkSaveOk").onclick=go;n.onkeydown=e=>{if(e.key==="Enter")go()};f.querySelector("#bkSaveX").onclick=()=>{bkSaveOn=false;render()};main.appendChild(f)}}
  /* contadores */
  {const L=R.filter(r=>bkMatch(r,F,C.K,"st")),k={nr:0,r:0,ok:0,no:0};L.forEach(r=>{if(r.I.st==="nr")k.nr++;else{k.r++;k[r.I.st]++}});
    const w=el(`<div class="bkcnt" role="group" aria-label="Situação"></div>`);BK_ST.forEach(([v,l])=>{const b=el(`<button type="button" class="bkc bkc-${v}"><b></b><span></span></button>`);b.id="bkC-"+v;b.setAttribute("aria-pressed",F.st===v);
      b.querySelector("b").textContent=k[v]+(v==="ok"&&k.r?` · ${pct(k.ok,k.r)}%`:"");b.querySelector("span").textContent=l;b.onclick=()=>{bkSet(f=>{f.st=f.st===v?"all":v});render()};w.appendChild(b)});main.appendChild(w)}
  /* etiquetas dos filtros ligados */
  if(act.length){const w=el(`<div class="tfact" aria-label="Filtros ativos"></div>`);act.forEach(([t,fn])=>{const b=el(`<button class="tfpill" type="button"><span></span><b aria-hidden="true">×</b></button>`);b.querySelector("span").textContent=t;b.setAttribute("aria-label","Tirar o filtro "+t);b.onclick=()=>{fn();render()};w.appendChild(b)});
    const cl=el(`<button class="link" type="button" id="bkClear">Limpar tudo</button>`);cl.onclick=()=>{bkF=bkFDef();bkShown=BK_PAGE;render()};w.appendChild(cl);main.appendChild(w)}
  /* número, ordem e ações */
  {const r=el(`<div class="bkbar"><span class="bkn" id="bkN"></span><label class="tfsort"><span>Ordem</span><select id="bkSort"></select></label></div>`);r.querySelector(".bkn").textContent=`${vis.length} ${vis.length===1?"questão":"questões"}${bkActive(F)?" com esses filtros":""}`;
    const s=r.querySelector("select");BK_SORT.forEach(([v,t])=>{const o=document.createElement("option");o.value=v;o.textContent=t;s.appendChild(o)});s.value=bkSort;s.onchange=()=>{bkSort=s.value;lsSet("resid-bksort",bkSort);bkShown=BK_PAGE;render()};main.appendChild(r);
    if(vis.length){const a=el(`<div class="btns bkacts"></div>`),n=Math.min(vis.length,BK_RUN_MAX),go=el(`<button class="btn primary bkgo" type="button" id="bkGo"></button>`);go.textContent=`Resolver ${n===1?"esta questão":`estas ${n} questões`}`;
      go.onclick=()=>bkStart(vis.slice(0,n).map(r=>r.x.id),"e");const sm=el(`<button class="btn" type="button" id="bkSimB">Simulado com estas</button>`);sm.setAttribute("aria-expanded",bkSimOpen);sm.onclick=()=>{bkSimOpen=!bkSimOpen;render()};a.append(go,sm);main.appendChild(a);
      if(vis.length>BK_RUN_MAX)main.appendChild(el(`<p class="how bknote">Resolver leva as ${BK_RUN_MAX} primeiras, na ordem da lista.</p>`));
      if(bkSimOpen){const o=el(`<div class="bksim"><span class="simol">Questões</span><div class="seg" role="group" aria-label="Quantas questões"></div><button class="btn primary" type="button" id="bkSimGo"></button><p class="how">Sorteio inteligente entre as ${vis.length} da lista: inéditas primeiro, depois os seus pontos fracos, os temas que mais caem, o eixo da faculdade e a próxima prova; no máximo um quarto do mesmo tema. Modo prova: relógio correndo, gabarito só no fim.</p></div>`),sg=o.querySelector(".seg");
        const opts=[10,20,30,60].filter(v=>v<vis.length);if(!opts.includes(Math.min(vis.length,BK_RUN_MAX)))opts.push(Math.min(vis.length,BK_RUN_MAX));if(!opts.includes(bkSimN))bkSimN=opts.find(v=>v>=10)||opts[opts.length-1];
        opts.forEach(v=>{const b=el(`<button type="button"></button>`);b.id="bkSimN-"+v;b.textContent=v===Math.min(vis.length,BK_RUN_MAX)&&v===vis.length?`Todas (${v})`:String(v);b.setAttribute("aria-pressed",bkSimN===v);b.onclick=()=>{bkSimN=v;render()};sg.appendChild(b)});
        const g=o.querySelector("#bkSimGo");g.textContent=`Começar · ${bkSimN} questões · ≈ ${Math.max(1,Math.round(bkSimN*ui.prefs.qpace/60))} min`;
        g.onclick=()=>{let L=bkSmart(vis.map(r=>r.x),bkSimN);if(L.length<Math.min(bkSimN,vis.length))L=[...L,...shuffle(vis.map(r=>r.x).filter(x=>!L.includes(x)))].slice(0,bkSimN);bkSimOpen=false;bkStart(L.map(x=>x.id),"p")};main.appendChild(o)}}}
  /* lista */
  if(!vis.length){const e=el(`<div class="cempty bknone"><span>Nenhuma questão com esses filtros.</span> </div>`);const b=el(`<button class="link" type="button" id="bkNoneClear">Limpar os filtros</button>`);b.onclick=()=>{bkF=bkFDef();render()};e.appendChild(b);main.appendChild(e)}
  else{const ol=el(`<ol class="bklist"></ol>`);vis.slice(0,bkShown).forEach(r=>ol.appendChild(bkRowEl(r)));main.appendChild(ol);
    if(vis.length>bkShown){const m=el(`<button class="btn bkmore" type="button" id="bkMore"></button>`);m.textContent=`Ver mais ${Math.min(BK_PAGE,vis.length-bkShown)} (de ${vis.length-bkShown})`;m.onclick=()=>{bkShown+=BK_PAGE;render()};main.appendChild(m)}}
  grid.appendChild(main);c.appendChild(grid);return c}
function bkRowEl(r){const {x,I}=r,its=bkIts(x),open=bkOpen===x.id,li=el(`<li class="bkrow${open?" open":""}"></li>`);li.dataset.id=x.id;
  const b=el(`<button class="bkr" type="button" aria-expanded="${open}"><span class="bkst" aria-hidden="true"></span><span class="bkm"><span class="bkstem"></span><span class="bkmeta"></span><span class="bkbadges"></span></span><span class="bkhist"><b></b><span></span></span></button>`);b.id="bkr-"+x.id;
  const st=b.querySelector(".bkst");st.classList.add("st-"+I.st);st.textContent=I.st==="ok"?"✓":I.st==="no"?"✕":"";b.setAttribute("aria-label",`${I.st==="nr"?"Inédita":I.st==="ok"?"Acertou da última vez":"Errou da última vez"}: ${x.q.enunciado.slice(0,80)}`);
  b.querySelector(".bkstem").textContent=x.q.enunciado;
  b.querySelector(".bkmeta").textContent=[x.ban?`${x.ban}${x.ano?" "+x.ano:""}`:x.mat?"Do seu material":x.o==="simulado"?"Simulado":x.o==="gerada"?"Gerada pelo Claude":x.pv||"",its.map(it=>it.t).join(" · ")].filter(Boolean).join(" · ");
  const bd=b.querySelector(".bkbadges"),badge=(t,c)=>{const s=el(`<span class="bkb ${c}"></span>`);s.textContent=t;bd.appendChild(s)};
  if(x.fav)badge("☆ Favorita","fav");if(I.teim)badge("Teimosa","teim");if(x.fg||x.fm)badge("Imagem","img");if(x.nf&&!x.fm)badge("Figura não guardada","nf");if(x.an)badge("Anulada","an");if(x.dz)badge("Diretriz mudou","dz");if(!bd.children.length)bd.remove();
  b.querySelector(".bkhist b").textContent=bkHistTxt(I);b.querySelector(".bkhist span").textContent=I.last?bkAgo(I.last.d):"";
  b.onclick=()=>{bkOpen=open?null:x.id;render()};li.appendChild(b);
  if(open){const p=el(`<div class="bkopen"><p class="qstem"></p></div>`);p.querySelector(".qstem").textContent=x.q.enunciado;{const f=bkFigEl(x);if(f)p.appendChild(f)}
    const ul=el(`<ol class="bkalts"></ol>`);x.q.alternativas.forEach(a=>{const l=el(`<li><b></b> <span></span></li>`);l.querySelector("b").textContent=a.letra+")";l.querySelector("span").textContent=a.texto;ul.appendChild(l)});p.appendChild(ul);
    if(I.n){const h=el(`<div class="bkhl"><span class="glabel">Suas respostas</span><ol></ol></div>`),o=h.querySelector("ol"),SRC={gen:"gerador",sim:"simulado",rerun:"simulado refeito",redo:"Refazer",exam:"prova",erro:"caderno de erros",bank:"banco"};
      I.A.slice(-6).reverse().forEach(y=>{const l=el(`<li><span class="simok ${y.ok?"ok":"no"}">${y.ok?"✓":"✗"}</span><span></span></li>`);l.lastChild.textContent=`${br(y.d)} · ${SRC[y.src]||y.src}${y.l?" · marcou "+y.l:""}${y.s?" · "+fmtPace(y.s):""}`;o.appendChild(l)});p.appendChild(h)}
    const a=el(`<div class="btns bkoacts"></div>`),go=el(`<button class="btn primary" type="button">Resolver esta</button>`);go.id="bkGo1-"+x.id;go.onclick=()=>bkStart([x.id],"e");
    const fv=el(`<button class="btn" type="button"></button>`);fv.id="bkFav-"+x.id;fv.textContent=x.fav?"★ Favorita":"☆ Favoritar";fv.setAttribute("aria-pressed",!!x.fav);fv.onclick=()=>{bkFav(x);render()};a.append(go,fv);
    if(its[0]){const t=el(`<button class="btn" type="button">Ir para o tema</button>`);t.id="bkTp-"+x.id;t.onclick=()=>openTopic(its[0].key);a.appendChild(t)}
    {const z=el(`<button class="btn" type="button"></button>`);z.id="bkDz-"+x.id;z.textContent=x.dz?"Diretriz ainda vale":"Diretriz mudou";z.title=x.dz?"Tira o selo: a questão volta aos sorteios":"Marca como desatualizada: sai dos sorteios e some com Esconder anuladas e desatualizadas";z.setAttribute("aria-pressed",!!x.dz);z.onclick=()=>{bkDz(x);render()};a.appendChild(z)}
    const armed=bkArm===x.id,d=el(`<button class="btn bkdel" type="button"></button>`);d.id="bkDel-"+x.id;d.textContent=armed?"Toque de novo para tirar":"Tirar do banco";if(armed)d.classList.add("warn");d.onclick=()=>{if(armed){bkArm=null;bkDel(x)}else bkArm=x.id;render()};a.appendChild(d);
    p.appendChild(a);li.appendChild(p)}
  return li}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")exFlush()});
