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
/* ----- registro rápido de questões feitas fora (bancos, provas antigas) ----- */
function qRegPanel(){const R=qReg,w=el(`<div class="qreg" id="qReg"><div class="dhead"><b>Registrar questões</b><button class="link" type="button">Fechar</button></div></div>`);
  w.querySelector(".dhead .link").onclick=()=>{qReg=null;render()};
  if(R.saved){const S=R.saved,it=BYKEY[S.k],m=el(`<p class="pnote" role="status"><span></span> <button class="link" type="button">Desfazer</button></p>`);
    m.querySelector("span").textContent=`Registrado: ${S.t} questões, ${S.c} acertos (${pct(S.c,S.t)}%) em ${it?it.t:""}${S.d!==today()?` · ${br(S.d)}`:""}${S.src?` · ${S.src}`:""}${S.mn?` · ${fmtPace(S.mn*60/S.t)} por questão`:""}.`;
    m.querySelector("button").onclick=()=>{upd(S.k,x=>addQ(x,-S.t,-S.c,S.d,S.src));if(S.mn)logPace(S.d,-S.t,-S.mn*60);logAct("q",-S.t,-S.c,S.d);commit();R.saved=null;R.msg="Registro desfeito.";render()};w.appendChild(m);
    if(S.t>S.c){const e=el(`<button class="btn" type="button">Registrar um erro deste tema no caderno</button>`);e.onclick=()=>{const k=S.k;qReg=null;openTopic(k);setTimeout(()=>{const f=detGet("ew-",k);if(f){f.scrollIntoView({behavior:"smooth",block:"center"});f.focus({preventScroll:true})}},350)};w.appendChild(e)}}
  const it=R.k&&BYKEY[R.k];
  if(!it){const s=el(`<label class="qfsel"><span>Tema</span><input class="search" id="qrq" type="search" placeholder="Digite o tema (ex.: sepse, IAM, pré-eclâmpsia)" autocomplete="off"></label>`),i=s.querySelector("input");i.value=R.query||"";
    i.oninput=debounced(()=>{if(qReg!==R||R.k)return;R.query=i.value;render()});w.appendChild(s);
    const n=norm((R.query||"").trim());if(n.length>=2){const res=[...ALL,...FAC_ITEMS].map(x=>{const t=norm(x.t),sub=norm(subList(x).map(y=>y.t).join(" ")+" "+(x.sp||""));return {x,sc:t.startsWith(n)?3:t.includes(n)?2:sub.includes(n)?1:0}}).filter(r=>r.sc).sort((a,b)=>b.sc-a.sc||a.x.num-b.x.num).slice(0,7);
      const ul=el(`<ul class="qrres"></ul>`);if(!res.length)ul.appendChild(el(`<li class="how">Nenhum tema com esse nome.</li>`));
      res.forEach(({x})=>{const li=el(`<li><button type="button" class="qrpick"><b></b><span></span></button></li>`);li.querySelector("b").textContent=x.t;li.querySelector("span").textContent=`${x.own?"FAC":x.area.code} · ${x.sp||x.area.name}`;li.querySelector("button").onclick=()=>{R.k=x.key;R.msg="";render();setTimeout(()=>{const f=$("#qrt");if(f)f.focus()},30)};ul.appendChild(li)});w.appendChild(ul)}
    else w.appendChild(el(`<p class="how hx">Para questões de bancos (Medcel, Estratégia, MedCof…) ou provas antigas: escolha o tema e digite quantas fez e acertou.</p>`))}
  else{const ch=el(`<p class="qrsel"><b></b><span></span><button class="link" type="button">trocar tema</button></p>`);ch.querySelector("b").textContent=it.t;ch.querySelector("span").textContent=` · ${it.own?"FAC":it.area.code} · ${it.sp||it.area.name}`;
    ch.querySelector("button").onclick=()=>{R.k=null;render()};w.appendChild(ch);
    const f=el(`<div class="focus-form qrform"><label class="qfsel"><span>Feitas</span><input type="number" id="qrt" min="1" max="500" inputmode="numeric"></label><label class="qfsel"><span>Acertos</span><input type="number" id="qrc" min="0" max="500" inputmode="numeric"></label><label class="qfsel"><span>Dia</span><input type="date" id="qrd"></label><label class="qfsel"><span>Tempo (min)</span><input type="number" id="qrm" min="1" max="600" inputmode="numeric" placeholder="opcional"></label><label class="qfsel qrsrc"><span>Banca ou fonte</span><input type="text" id="qrb" list="qrbl" maxlength="30" placeholder="opcional (ex.: ENARE)" autocomplete="off"><datalist id="qrbl"></datalist></label><button class="btn primary" type="button" id="qrSave">Salvar</button></div>`);
    {const bi=f.querySelector("#qrb"),dl=f.querySelector("#qrbl");[...new Set([...qSrcAll(),...QSRC_SUG])].filter(x=>x!=="Claude").forEach(v=>{const o=document.createElement("option");o.value=v;dl.appendChild(o)});
      let last="";try{last=localStorage.getItem("resid-qsrc")||""}catch(e){}bi.value=R.b!==undefined?R.b:last;bi.oninput=()=>{R.b=bi.value}}
    const ti=f.querySelector("#qrt"),ci=f.querySelector("#qrc"),di=f.querySelector("#qrd");ti.value=R.t||"";ci.value=R.c||"";di.value=R.d||today();di.max=today();
    ti.oninput=()=>{R.t=ti.value};ci.oninput=()=>{R.c=ci.value};di.oninput=()=>{R.d=di.value};
    f.querySelector("#qrSave").onclick=()=>{const t=Math.round(+ti.value),c=Math.round(+ci.value),d=di.value||today();
      if(!(t>=1&&t<=500)){R.msg="Digite quantas questões fez (1 a 500).";render();return}if(!(c>=0&&c<=t)||ci.value===""){R.msg="Os acertos vão de 0 até o número de questões feitas.";render();return}
      if(!/^\d{4}-\d{2}-\d{2}$/.test(d)||d>today()){R.msg="Escolha um dia até hoje.";render();return}
      const src=qSrcKey(f.querySelector("#qrb").value);try{localStorage.setItem("resid-qsrc",src)}catch(e){}
      const mn=Math.round(+f.querySelector("#qrm").value)||0;if(f.querySelector("#qrm").value&&!(mn>=1&&mn<=600)){R.msg="Tempo de 1 a 600 minutos (ou deixe vazio).";render();return}
      upd(it.key,x=>addQ(x,t,c,d,src));logAct("q",t,c,d);if(mn)logPace(d,t,mn*60);commit();qReg={saved:{k:it.key,t,c,d,src,mn},d,query:""};render();setTimeout(()=>{const q=$("#qrq");if(q)q.focus()},30)};
    w.appendChild(f)}
  if(R.msg){const m=el(`<p class="err" role="alert"></p>`);m.textContent=R.msg;w.appendChild(m)}
  return w}
/* ----- onde ganhar pontos: incidência na prova × o quanto falta para 80% de acerto ----- */
/* "onde focar" (Lote 17): uma conta só para o simulado, o gráfico por especialidade e as Estatísticas.
   Peso² × distância de 80% no acerto estimado ((acertos+3)/(questões+5): poucos dados puxam para ~60%). Tema estudado sem questões conta como 60%; tema nunca visto não entra. */
function focusScore(it){const s=get(it.key);if(it.own||!(s.qt||s.last||s.l>0))return 0;// tema nunca estudado nem praticado é assunto do plano (tema novo), não de "onde focar"
  const w=wOf(it),est=((s.qc||0)+3)/((s.qt||0)+5);return w*w*Math.max(0,0.8-est)}
function focusRank(U){return (U||ALL).filter(i=>!i.own).map(it=>({it,sc:focusScore(it)})).filter(r=>r.sc>0).sort((a,b)=>b.sc-a.sc||wOf(b.it)-wOf(a.it)||a.it.num-b.it.num).map(r=>r.it)}
function qGainCard(U){const rows=U.filter(i=>!i.own).map(it=>{const s=get(it.key),w=wOf(it),qt=s.qt||0,qc=s.qc||0,est=(qc+3)/(qt+5);return {it,w,qt,qc,est,sc:w*w*Math.max(0,0.8-est)}}).filter(r=>r.sc>0).sort((a,b)=>b.sc-a.sc||b.w-a.w||a.it.num-b.it.num);
  const c=el(`<section class="card qgain" aria-labelledby="qgh"><div class="dhead"><h2 id="qgh">Onde ganhar pontos</h2></div></section>`);
  if(!rows.length){c.appendChild(el(`<p class="cempty">${U.some(i=>!i.own)?"Todos os temas deste filtro estão com 80% ou mais de acerto. Mantenha as revisões.":"Escolha temas da residência nos filtros para ver as prioridades."}</p>`));return c}
  c.appendChild(el(`<p class="how hx">Temas que mais caem na prova e onde o seu acerto está mais longe de 80%. Temas sem questões contam como 60% até você fazer algumas.</p>`));
  const ol=el(`<ol class="qglist"></ol>`),sh=rows.slice(0,qGainMore?20:6);
  sh.forEach((r,i)=>{const it=r.it,p=r.qt?pct(r.qc,r.qt):null,[bk]=p===null?["warn"]:band(p);
    const li=el(`<li><span class="qgn">${i+1}</span><span class="qgm"><button class="qgt" type="button"></button><span class="qgs"></span></span><span class="qga"></span></li>`);
    const tb=li.querySelector(".qgt");tb.textContent=it.t;tb.onclick=()=>openTopic(it.key);
    const sm=li.querySelector(".qgs");sm.textContent=`${it.area.code} · ${it.sp} · `;sm.appendChild(incEl(r.w,true));
    li.querySelector(".qga").innerHTML=p===null?`<b class="qgp none">sem questões</b>`:`<b class="qgp"><span class="st ${bk}">${p}%</span></b><span>${r.qc}/${r.qt}</span>`;
    const acts=el(`<span class="qgb"></span>`);
    const rg=el(`<button class="mini" type="button">Registrar</button>`);rg.onclick=()=>{qReg={k:it.key,d:today()};render();const f=$("#qReg");if(f)f.scrollIntoView({behavior:"smooth",block:"center"})};acts.appendChild(rg);
    if(!sampleOff){const g=el(`<button class="mini" type="button">Gerar questões</button>`);g.onclick=()=>{openTopic(it.key);setTimeout(()=>{const x=detGet("qf-",it.key);if(x)x.scrollIntoView({behavior:"smooth",block:"center"})},350)};acts.appendChild(g)}
    li.appendChild(acts);ol.appendChild(li)});
  c.appendChild(ol);
  if(rows.length>6){const m=el(`<button class="link" type="button">${qGainMore?"Mostrar menos":`Mostrar mais ${Math.min(rows.length,20)-6}`}</button>`);m.onclick=()=>{qGainMore=!qGainMore;render()};c.appendChild(m)}
  return c}
/* ----- evolução semanal: questões por semana (barras) e acerto (linha) ----- */
function qEvoSvg(U,width){const N=12,t=dnum(today()),ws=t-(new Date().getDay()+6)%7,start=ws-7*(N-1),W=[...Array(N)].map((_,i)=>({s:start+7*i,q:0,c:0}));
  let est=0;U.forEach(it=>{const s=get(it.key);if(s.qe&&dnum(s.qe.d)>=start)est+=s.qe.q||0;for(const d in s.qd||{}){const v=s.qd[d];if(!Array.isArray(v))continue;const n=dnum(d);if(n<start||n>t)continue;const w=W[Math.floor((n-start)/7)];if(w){w.q+=v[0]||0;w.c+=v[1]||0}}});
  const tot=W.reduce((a,w)=>a+w.q,0);if(!tot)return {html:`<p class="cempty">Sem questões nas últimas ${N} semanas${U.length<ALL.length+FAC_ITEMS.length?" neste filtro":""}.</p>`,tot};
  /* Lote 10: eixo do acerto ajustado aos dados, semana atual mais clara ("até hoje"), linha da meta semanal de questões */
  const QG=ui.prefs.qgoal||0,AC=W.filter(w=>w.q).map(w=>w.c/w.q),lo=Math.max(0,Math.floor((Math.min(...AC)-.08)*10)/10),hi=Math.min(1,Math.ceil((Math.max(...AC)+.04)*10)/10),A0=Math.min(lo,hi-.2),A1=Math.max(hi,A0+.2);
  const VW=Math.max(300,Math.round(width||600)),VH=VW<500?170:200,L=30,R=36,T=12,B=24,lstep=VW<420?3:2,cw=(VW-L-R)/N,mq=Math.max(...W.map(w=>w.q),QG),yq=v=>T+(VH-T-B)*(1-v/mq),ya=a=>T+(VH-T-B)*(1-(a-A0)/(A1-A0));
  const nice=mq<=10?mq:Math.ceil(mq/5)*5;
  let g=`<svg class="qevo" viewBox="0 0 ${VW} ${VH}" role="img" aria-label="Questões e acerto por semana nas últimas ${N} semanas">`;
  [...new Set([A0,A1,...(A0<.6&&A1>.6?[.6]:[])])].forEach(a=>{g+=`<line x1="${L}" x2="${VW-R}" y1="${ya(a)}" y2="${ya(a)}" class="${a===0.6?"qeref":"qegrid"}"/><text x="${VW-R+4}" y="${ya(a)+3.5}" class="qeax">${Math.round(a*100)}%</text>`});
  g+=`<text x="${L-4}" y="${yq(mq)+3.5}" class="qeax" text-anchor="end">${mq}</text><text x="${L-4}" y="${yq(0)+3.5}" class="qeax" text-anchor="end">0</text>`;
  W.forEach((w,i)=>{const x=L+i*cw+cw*0.18,bw=cw*0.64,ws2=fromNum(w.s),we=fromNum(Math.min(w.s+6,t)),tip=`Semana de ${br(ws2)} a ${br(we)}: ${w.q} questões${w.q?`, ${pct(w.c,w.q)}% de acerto`:""}`;
    const cur=i===N-1;
    if(w.q)g+=`<rect x="${x}" y="${yq(w.q)}" width="${bw}" height="${yq(0)-yq(w.q)}" rx="3" class="qebar${cur?" cur":""}" data-tip="${esc(tip+(cur?" (semana em andamento)":""))}"/>`;
    else g+=`<rect x="${x}" y="${T}" width="${bw}" height="${VH-T-B}" fill="transparent" data-tip="${esc(tip)}"/>`;
    if((N-1-i)%lstep===0)g+=`<text x="${x+bw/2}" y="${VH-8}" text-anchor="middle" class="qeax">${cur?"até hoje":br(ws2)}</text>`});
  if(QG)g+=`<line x1="${L}" x2="${VW-R}" y1="${yq(QG)}" y2="${yq(QG)}" class="qegoal"/><text x="${L+2}" y="${yq(QG)-4}" class="qegoalt">meta ${QG}</text>`;
  const all=W.map((w,i)=>w.q?[L+i*cw+cw/2,ya(w.c/w.q),w]:null),pts=all.filter(Boolean);
  // a linha só liga semanas seguidas com questões; semana vazia interrompe a linha
  let seg=[];const flush=()=>{if(seg.length>1)g+=`<polyline points="${seg.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" ")}" class="qeline"/>`;seg=[]};
  all.forEach(p=>{if(p)seg.push(p);else flush()});flush();
  pts.forEach(([x,y,w])=>{const p=pct(w.c,w.q),[bk]=band(p);g+=`<circle cx="${x}" cy="${y}" r="4.5" class="qedot ${bk}" data-tip="${p}% de acerto em ${w.q} questões"/>`});
  g+=`</svg>`;
  const last=W[N-1],prev=W.slice(N-5,N-1).filter(w=>w.q),pa=prev.length?prev.reduce((a,w)=>a+w.c,0)/prev.reduce((a,w)=>a+w.q,0):null;
  let note=`${tot.toLocaleString("pt-BR")} questões em ${N} semanas.`;
  if(last.q&&pa!==null){const d=Math.round(last.c/last.q*100-pa*100);note+=` Esta semana: ${pct(last.c,last.q)}% de acerto, ${d===0?"igual à":d>0?`${d} pontos acima da`:`${-d} pontos abaixo da`} média das 4 anteriores.`}
  if(est)note+=` Inclui ${est} questões antigas com data estimada.`;
  return {html:g+`<div class="clegend"><span><i class="sw" style="background:var(--accent);opacity:.35"></i>questões na semana</span><span><i class="sw" style="background:var(--ink)"></i>acerto</span><span><i class="refk"></i>60%</span><span class="qedk"><i class="qedot1 good"></i><i class="qedot1 warn"></i><i class="qedot1 bad"></i>ponto: verde ≥ 80%, amarelo 60–79%, vermelho &lt; 60%</span></div><p class="cnote">${note}</p>`,tot}}
