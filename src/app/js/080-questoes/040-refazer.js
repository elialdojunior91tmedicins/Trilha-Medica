/* ---------- Questões: refazer erradas, registro rápido, onde ganhar pontos, evolução ---------- */
/* questões geradas que você errou: {id, k, d, n (vezes errada), q:{enunciado, alternativas:[{letra,texto}], correta, comentario, conceito, alerta}} */
const LSRD="resid-redo-v1",RD_MAX=600;
let redo=[],redoStore=null,rdRun=null,rdList=false,rdArm=null,qReg=null,qGainMore=false;
function rdOk(x){return !!x&&typeof x==="object"&&typeof x.id==="string"&&typeof x.k==="string"&&x.q&&typeof x.q.enunciado==="string"&&Array.isArray(x.q.alternativas)&&x.q.alternativas.length>=2&&typeof x.q.correta==="string"}
/* Lote 12: due = quando volta; ok = acertos em dias diferentes (sai com RD_NEED); okd = dia do último acerto; wr = erros no próprio Refazer; src = gen|sim|exam */
const RD_INT=[1,3],RD_NEED=2,RD_DAY=10,DATE_RE=/^\d{4}-\d{2}-\d{2}$/,RD_IMG_MAX=180000;
const fgClean=f=>f&&typeof f==="object"&&+f.no>0?{no:+f.no,name:String(f.name||"").slice(0,140),page:+f.page||0}:null;
function rdClean(x){const q=x.q,s=v=>typeof v==="string"?v:"";return {id:x.id,k:x.k,d:/^\d{4}-\d{2}-\d{2}$/.test(x.d)?x.d:today(),n:Number.isInteger(x.n)&&x.n>0?x.n:1,
  ...(DATE_RE.test(x.due||"")?{due:x.due}:{}),...(Number.isInteger(x.ok)&&x.ok>0?{ok:x.ok}:{}),...(DATE_RE.test(x.okd||"")?{okd:x.okd}:{}),...(Number.isInteger(x.wr)&&x.wr>0?{wr:x.wr}:{}),...(["gen","sim","exam"].includes(x.src)?{src:x.src}:{}),
  q:{enunciado:s(q.enunciado),alternativas:q.alternativas.filter(a=>a&&typeof a==="object").map(a=>a.porque?{letra:s(a.letra),texto:s(a.texto),porque:s(a.porque)}:{letra:s(a.letra),texto:s(a.texto)}),correta:s(q.correta),comentario:s(q.comentario),conceito:s(q.conceito),alerta:s(q.alerta),...(q.fonte?{fonte:s(q.fonte)}:{}),...(linkOk(q.link)?{link:q.link.trim()}:{}),...(q.mat?{mat:true}:{}),...(fgClean(q.fg)?{fg:fgClean(q.fg)}:{}),...(/^[A-H]$/.test(q.fx||"")?{fx:q.fx}:{})},...(DATE_RE.test(x.fd||"")?{fd:x.fd}:{}),
  ...(typeof x.img==="string"&&/^data:image\/jpeg;base64,/.test(x.img)&&x.img.length<=RD_IMG_MAX?{img:x.img}:{})}}
try{const v=JSON.parse(localStorage.getItem(LSRD)||"[]");if(Array.isArray(v))redo=v.filter(rdOk).map(rdClean)}catch(e){}
function rdSaveLocal(){try{localStorage.setItem(LSRD,JSON.stringify(redo))}catch(e){}}
async function rdPut(x){rdSaveLocal();if(!redoStore)return;const k="rd:"+x.id;try{await redoStore.doc(x.id).set({...x});saveOk(k)}catch(e){if(redo.includes(x))saveFail(k,"questão para refazer",e,()=>rdPut(x))}}
/* levou a questão para o caderno de erros: sai do Refazer (uma agenda por questão) */
function rdForget(k,q){const stem=((q&&q.enunciado)||"").trim();if(!stem)return 0;const L=redo.filter(x=>x.k===k&&x.q.enunciado.trim()===stem);L.forEach(x=>rdDel(x.id));return L.length}
async function rdDel(id){redo=redo.filter(x=>x.id!==id);rdSaveLocal();if(redoStore)try{await redoStore.doc(id).delete()}catch(e){}}
/* chamada quando você erra uma questão gerada */
function rdAdd(k,q,src,P){const stem=q.enunciado.trim(),ex=redo.find(x=>x.k===k&&x.q.enunciado.trim()===stem),t=dnum(today());
  if(ex){ex.n++;ex.d=today();ex.due=fromNum(t+RD_INT[0]);delete ex.ok;delete ex.okd;rdPut(ex);return}
  const x=rdClean({id:"rd"+Date.now().toString(36)+Math.random().toString(36).slice(2,6),k,d:today(),fd:today(),n:1,q,due:fromNum(t+RD_INT[0]),src});redo.push(x);
  if(redo.length>RD_MAX){const old=redo.sort((a,b)=>a.d<b.d?-1:1).slice(0,redo.length-RD_MAX);old.forEach(o=>rdDel(o.id))}rdPut(x);
  /* figura: só a errada guarda uma versão pequena (some com o item quando ele sai do Refazer) */
  const f=q.fg&&P&&P.figs?P.figs.find(y=>y.no===q.fg.no):null;if(f&&f.blob)figSmall(f.blob).then(u=>{if(u&&redo.includes(x)){x.img=u;rdPut(x);render()}})}
/* quando volta (antigos sem due: no dia seguinte ao erro) e o que acontece ao responder no Refazer */
const rdDue=x=>x.due||fromNum(dnum(x.d)+RD_INT[0]);
const rdDueList=()=>redo.filter(x=>BYKEY[x.k]&&rdDue(x)<=today());
/* auditoria 26/10: questão que fica RD_EXP dias vencida sem ser feita sai sozinha (o Refazer não cresce sem fim); o aviso fica no cartão até ser visto */
const RD_EXP=21;
function rdExpire(){if(store&&!synced)return 0;const lim=fromNum(dnum(today())-RD_EXP),old=redo.filter(x=>rdDue(x)<lim);if(!old.length)return 0;old.forEach(x=>rdDel(x.id));
  const n=(+lsGet("resid-rdexp","0")||0)+old.length;lsSet("resid-rdexp",String(n));return old.length}
const rdStudied=k=>{const s=get(k);return !!(s.last||s.l>0||isIng(s))};
function rdHit(x){const t=today();if(x.okd!==t){x.ok=(x.ok||0)+1;x.okd=t}if(x.ok>=RD_NEED){rdDel(x.id);return true}x.due=fromNum(dnum(t)+RD_INT[Math.min(x.ok,RD_INT.length-1)]);rdPut(x);return false}
function rdMiss(x){x.n++;x.wr=(x.wr||0)+1;x.d=today();delete x.ok;delete x.okd;x.due=fromNum(dnum(today())+RD_INT[0]);rdPut(x)}
let rdF={due:true,src:"all",rep:false};
/* Corrigir gabarito (10/2026): vl = letra escolhida na tela (alternativas podem estar embaralhadas). Troca a correta do item (q.fx = a antiga);
   prova na íntegra: corrige também a prova (exChange recalcula o tema); gerador/simulado: se a sua resposta era a certa, o erro vira acerto no tema
   (dia do erro = x.fd ou o último dia com erro em qd) e o item sai do Refazer. */
function rdFix(R,x,vl){const v=R.view[x.id],va=v&&v.alternativas.find(a=>a.letra===vl);if(!va)return;
  const oa=x.q.alternativas.find(a=>a.texto===va.texto);if(!oa||oa.letra===x.q.correta)return;
  const old=x.q.correta,right=R.ans===vl;if(!x.q.fx)x.q.fx=old;x.q.correta=oa.letra;delete oa.porque;
  v.correta=vl;delete va.porque;let exOk=false;
  if(x.src==="exam"){const st=x.q.enunciado.trim();for(const ex of exams){const i=ex.qs.findIndex(r=>r.k===x.k&&r.q.enunciado.trim()===st);if(i<0)continue;
      exChange(ex,i,r=>{if(!r.ck)r.ck=r.q.correta;r.an=false;r.q.correta=oa.letra;r.g="b"});exPut(ex);exOk=true;break}}
  else if(right){const s=get(x.k),cand=Object.keys(s.qd||{}).filter(d=>Array.isArray(s.qd[d])&&s.qd[d][0]>s.qd[d][1]).sort(),
      D=cand.includes(x.fd)?x.fd:cand.filter(d=>d<=x.d).pop()||cand.pop();
    if(D){upd(x.k,y=>addQ(y,0,1,D,"Claude"));const h=hist[D];if(h&&(h.q||0)>(h.c||0))h.c=(h.c||0)+1}}
  if(right){R.okc=(R.okc||0)+1;R.hit++;const r=R.res[R.res.length-1];if(r&&r.k===x.k)r.ok=true;rdDel(x.id)}else rdPut(x);
  R.fx={id:x.id,right,exam:exOk,vl};R.fixOpen=false;commit();render()}
const RD_SRC={gen:"Gerador do tema",sim:"Simulado",exam:"Provas na íntegra"};
function rdStart(ids){rdRun={ids,i:0,ans:null,hit:0,okc:0,done:0,res:[],view:{}};render();setTimeout(()=>{const h=$("#qrdh");if(h)h.scrollIntoView({block:"start",behavior:"smooth"})},40)}
/* alternativas embaralhadas no Refazer (não decorar a letra); comentário que cita letras (provas) fica na ordem original */
function rdView(x){const v=qSplit(x.q);if(/\b(?:letra|alternativa|op[çc][ãa]o)\s*\(?[A-H]\)?(?![A-Za-zÀ-ú])/i.test(v.comentario||""))return v;return altShuffle(JSON.parse(JSON.stringify(v)))}
function qRedoCard(U){const ks=new Set(U.map(i=>i.key)),T=today(),base=redo.filter(x=>BYKEY[x.k]&&ks.has(x.k)),
    list=base.filter(x=>(!rdF.due||rdDue(x)<=T)&&(rdF.src==="all"||x.src===rdF.src)&&(!rdF.rep||x.n>=2)).sort((a,b)=>(rdDue(a)<rdDue(b)?-1:rdDue(a)>rdDue(b)?1:0)||b.n-a.n||(a.d<b.d?-1:1)),dueN=base.filter(x=>rdDue(x)<=T).length;
  const c=el(`<section class="card qredo" aria-labelledby="qrdh"><div class="dhead"><h2 id="qrdh">Refazer as que errei</h2><span class="todaydate"></span></div></section>`);
  c.querySelector(".todaydate").textContent=redo.length?`${dueN} para hoje · ${base.length} no total`:"";
  if(rdRun){if(twoCols()||isPhoneL())c.querySelector(".dhead").appendChild(fullBtn("rd"));c.appendChild(rdPlayer());
    if(twoCols())c.appendChild(el(`<p class="how erkeys">Teclado: A a E escolhem a alternativa · espaço vai para a próxima${fullOn.rd?" · Esc sai da tela inteira":""}</p>`));return c}
  {const n=+lsGet("resid-rdexp","0")||0;if(n){const m=el(`<p class="pnote" id="rdExpNote"><span></span> <button class="link" type="button">Entendi</button></p>`);
    m.querySelector("span").textContent=`${n} ${n===1?"questão saiu":"questões saíram"} do Refazer por ficar${n===1?"":"em"} ${RD_EXP} dias vencida${n===1?"":"s"} sem ser feita${n===1?"":"s"} (o ponto, se importante, continua no caderno de erros ou volta quando você errar de novo).`;m.querySelector("button").onclick=()=>{lsSet("resid-rdexp",null);render()};c.appendChild(m)}}
  if(!redo.length){c.appendChild(el(`<p class="cempty">Toda questão gerada pelo Claude que você errar fica guardada aqui, com o comentário, para refazer depois. Acertou ao refazer, ela sai da lista.</p>`));return c}
  /* Lote 20: filtros no padrão novo: Quais (segmento) e De onde / Erradas 2+ (etiquetas com contagem) */
  {const f=el(`<div class="rdfil"></div>`),inQ=x=>!rdF.due||rdDue(x)<=T;
    f.appendChild(fcPer("rdF",rdF.due?"due":"all",v=>{rdF.due=v==="due"},[["due",`Para hoje · ${dueN}`],["all",`Todas · ${base.length}`]],"Quais"));
    const ch=fcChips([...Object.entries(RD_SRC).map(([v,l])=>fcChip(`${l} · ${base.filter(x=>inQ(x)&&x.src===v).length}`,rdF.src===v,()=>{rdF.src=rdF.src===v?"all":v},"rdFSrc-"+v)),
      fcChip(`Erradas 2+ vezes · ${base.filter(x=>inQ(x)&&x.n>=2).length}`,rdF.rep,()=>{rdF.rep=!rdF.rep},"rdFRep")]);f.appendChild(ch);c.appendChild(f)}
  if(!list.length){c.appendChild(el(`<p class="cempty">${rdF.due&&base.length&&!(rdF.src!=="all"||rdF.rep)?"Nada para refazer hoje. As próximas voltam nos dias marcados (toque em Todas para ver).":"Nenhuma questão para refazer com esses filtros."}</p>`));return c}
  const by={};list.forEach(x=>{const it=BYKEY[x.k],g=`${it.area.code} · ${it.sp||it.area.name}`;by[g]=(by[g]||0)+1});
  const top=Object.entries(by).sort((a,b)=>b[1]-a[1]);
  c.appendChild(el(`<p class="gtext qrdsum">${top.slice(0,4).map(([g,n])=>`<span><b>${n}</b> ${esc(g)}</span>`).join("")}${top.length>4?`<span>+ ${top.length-4} especialidades</span>`:""}</p>`));
  const acts=el(`<div class="btns"></div>`);
  const go=el(`<button class="btn primary" type="button" id="rdGo"></button>`);go.textContent=`Refazer ${Math.min(list.length,10)} ${Math.min(list.length,10)===1?"questão":"questões"}`;
  go.onclick=()=>rdStart(list.slice(0,10).map(x=>x.id));acts.appendChild(go);
  if(list.length>10){const all=el(`<button class="btn" type="button">Todas (${list.length})</button>`);all.onclick=()=>rdStart(list.map(x=>x.id));acts.appendChild(all)}
  const vl=el(`<button class="link" type="button">${rdList?"Esconder lista":"Ver lista"}</button>`);vl.onclick=()=>{rdList=!rdList;render()};acts.appendChild(vl);c.appendChild(acts);
  c.appendChild(el(`<p class="how hx">A questão errada volta no dia seguinte; acertou, volta em 3 dias; <b>sai da lista depois de 2 acertos em dias diferentes</b> (um acerto logo depois de ver a resposta pode ser só memória). Errou de novo, recomeça. As alternativas vêm embaralhadas. Refazer não muda o seu acerto nos temas.</p>`));
  if(rdList){const ul=el(`<ul class="rdlist"></ul>`);list.slice(0,80).forEach(x=>{const it=BYKEY[x.k];const li=el(`<li><span class="rdl"><b></b><span></span></span><button class="foxb" type="button" aria-label="Remover da lista">×</button></li>`);
      li.querySelector("b").textContent=x.q.enunciado.replace(/\s+/g," ").slice(0,110)+(x.q.enunciado.length>110?"…":"");const dd=rdDue(x);li.querySelector(".rdl span").textContent=`${it.t} · errada ${x.n}×${x.ok?` · acertou ${x.ok} de ${RD_NEED}`:""} · ${dd<=T?"para hoje":"volta em "+br(dd)}${x.src?` · ${RD_SRC[x.src]}`:""}`;if((x.wr||0)>=2)li.querySelector(".rdl b").insertAdjacentHTML("beforeend",' <span class="rdteim">teimosa</span>');
      const xb=li.querySelector("button");if(rdArm===x.id){xb.textContent="Remover?";xb.classList.add("warn");xb.onclick=()=>{rdArm=null;rdDel(x.id).then(render);render()}}else xb.onclick=()=>{rdArm=x.id;render()};ul.appendChild(li)});
    if(list.length>80)ul.appendChild(el(`<li class="how">+ ${list.length-80} questões.</li>`));c.appendChild(ul)}
  return c}
function rdPlayer(){const R=rdRun,w=el(`<div class="rdplay"></div>`);if(!R.res)R.res=[];if(!R.view)R.view={};
  if(R.i>=R.ids.length){const okc=R.okc||0;w.appendChild(el(`<p class="verdict ${R.done&&okc/R.done>=.6?"ok":"no"}" id="rdEnd">Você acertou ${R.done?Math.round(okc/R.done*100):0}% ao refazer (${okc} de ${R.done}).</p>`));
    w.appendChild(el(`<p class="gtext">${R.hit?`${R.hit} ${R.hit===1?"saiu":"saíram"} da lista. `:""}${okc-R.hit>0?`${okc-R.hit} ${okc-R.hit===1?"volta":"voltam"} em 3 dias para confirmar. `:""}${R.done-okc?`${R.done-okc} ${R.done-okc===1?"volta":"voltam"} amanhã.`:""}</p>`));
    const by={};R.res.forEach(r=>{const b=by[r.k]=by[r.k]||[0,0];b[1]++;if(r.ok)b[0]++});const ks=Object.keys(by).filter(k=>BYKEY[k]);
    if(ks.length>1){const ul=el(`<ul class="rdbytema"></ul>`);ks.sort((a,b)=>by[a][0]/by[a][1]-by[b][0]/by[b][1]).forEach(k=>{const li=el(`<li><span></span><b></b></li>`);li.querySelector("span").textContent=BYKEY[k].t;li.querySelector("b").textContent=`${by[k][0]} de ${by[k][1]}`;ul.appendChild(li)});
      w.appendChild(el(`<p class="glabel">Por tema</p>`));w.appendChild(ul)}
    const b=el(`<button class="btn primary" type="button">Fechar</button>`);b.onclick=()=>{rdRun=null;render()};w.appendChild(b);return w}
  const x=redo.find(y=>y.id===R.ids[R.i])||R.snap;if(!x){R.i++;return rdPlayer()}
  R.snap=x;const it=BYKEY[x.k],q=R.view[x.id]||(R.view[x.id]=rdView(x));
  const c=el(`<div class="qcard"><span class="qn"></span><button class="link rdtopic" type="button"></button><p class="qstem"></p></div>`);
  c.querySelector(".qn").textContent=`QUESTÃO ${R.i+1} DE ${R.ids.length} · ERRADA ${x.n}×`;const tb=c.querySelector(".rdtopic");tb.textContent=it?it.t:"";tb.onclick=()=>openTopic(x.k);
  c.querySelector(".qstem").textContent=q.enunciado;{const fe=figEl(x.q,null,x.img);if(fe)c.appendChild(fe)}
  c.appendChild(altsEl(q,R.ans,l=>{R.ans=l;R.done++;const ok=l===q.correta;bankAns(q,RD_O[x.src]||"gerada",x.k,l,0,"redo",0);{const h=hist[today()]||(hist[today()]={});h.rq=(h.rq||0)+1}R.res.push({k:x.k,ok});if(ok){R.okc=(R.okc||0)+1;const sameDay=x.okd===today();R.left=rdHit(x);R.same=sameDay;if(R.left)R.hit++}else rdMiss(x);render()}));
  const F=R.fx&&R.fx.id===x.id?R.fx:null;
  if(R.ans&&F){c.appendChild(el(`<p class="verdict ${F.right?"ok":"no"}" id="rdFixed">Gabarito corrigido para ${esc(F.vl)}. ${F.right?"Você tinha acertado: saiu da lista"+(x.src==="exam"?"":" e contou como acerto no tema")+".":"A sua resposta continua errada; volta amanhã."}${F.exam?" A prova na íntegra também foi corrigida.":""}</p>`))}
  else if(R.ans){const ok=R.ans===q.correta;c.appendChild(el(`<p class="verdict ${ok?"ok":"no"}">${ok?(R.left?"Correta. Acertou 2 vezes em dias diferentes: saiu da lista.":R.same?"Correta. Você já tinha acertado hoje; volta em 3 dias para confirmar.":"Correta. Volta em 3 dias: acertando de novo, sai da lista."):"Incorreta de novo. A resposta é "+esc(q.correta.replace(/[^A-Z0-9]/g,""))+". Volta amanhã."}</p>`))}
  if(R.ans){const ok=R.ans===q.correta;
    if(!ok&&!F){const fb=el(`<div class="rdfix"><button class="link" type="button" id="rdFixB">O gabarito está errado?</button></div>`);fb.querySelector("button").onclick=()=>{R.fixOpen=!R.fixOpen;render()};
      if(R.fixOpen){const pn=el(`<div class="rdfixp"><p class="gtext">Qual é a alternativa certa? Se for a que você marcou, a questão sai do Refazer${x.src==="exam"?"":" e conta como acerto no tema"}.${x.src==="exam"?" A prova na íntegra é corrigida junto.":""}</p><div class="btns"></div></div>`);
        q.alternativas.filter(a=>a.letra!==q.correta).forEach(a=>{const b=el(`<button class="btn" type="button"></button>`);b.id="rdFix-"+a.letra;b.textContent=a.letra+(a.letra===R.ans?" (a sua)":"");b.onclick=()=>rdFix(R,x,a.letra);pn.querySelector(".btns").appendChild(b)});
        fb.appendChild(pn)}c.appendChild(fb)}
    if(x.q.fx)c.appendChild(el(`<p class="pnote" id="rdFxNote">Gabarito corrigido por você${(()=>{const o=x.q.alternativas.find(a=>a.letra===x.q.fx);if(!o)return "";const t=o.texto.replace(/\s+/g," ").trim();return ` (antes: “${esc(t.length>70?t.slice(0,70)+"…":t)}”)`})()}. O comentário pode ter sido escrito para o gabarito antigo.</p>`));
    c.appendChild(qExplEl(q));
    {const f=qFonteEl(q);if(f)c.appendChild(f)}if(q.alerta&&q.alerta.trim()){const p=el(`<p class="alerta"></p>`);p.textContent="Atenção: "+q.alerta;c.appendChild(p)}
    if(!ok&&(x.wr||0)>=2)c.appendChild(el(`<p class="pnote rdteimnote" id="rdTeim">Você já errou esta questão ${x.wr} vezes ao refazer. Vale levar o ponto para o caderno de erros: lá ele vira revisão com a pista, o conceito e cartões.</p>`));
    if(!ok)c.appendChild(eCadEl(R.cad||(R.cad={}),x.id,x.k,q,R.ans,"Refazer as que errei"));
    c.appendChild(qActsEl(q,R.ans,{k:x.k,src:"Refazer"}))}
  w.appendChild(c);
  const acts=el(`<div class="btns"></div>`);
  if(R.ans){const nx=el(`<button class="btn primary" type="button" id="rdNext">${R.i+1<R.ids.length?"Próxima":"Ver resultado"}</button>`);nx.onclick=()=>{R.i++;R.ans=null;R.snap=null;render()};acts.appendChild(nx)}
  const st=el(`<button class="btn" type="button">Encerrar</button>`);st.onclick=()=>{rdRun=null;render()};acts.appendChild(st);w.appendChild(acts);return w}
