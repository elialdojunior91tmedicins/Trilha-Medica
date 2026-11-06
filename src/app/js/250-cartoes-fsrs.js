/* ===== Cartões (Lote 5): FSRS com 4 botões, limite de novos por dia, visual Osler, cartões dos erros e exportação .apkg ===== */
const LSCD="resid-cards-v1",CD_INT=[1,2,4,8,16,32,64],CD_ANKI=40;
let cards=[],cardStore=null,cdRun=null,cdGen={},cdNew={},cdErr={},cdExp=null;
try{const v=JSON.parse(localStorage.getItem("resid-cdexp")||"null");if(v&&Array.isArray(v.ids))cdExp=v}catch(e){}
/* FSRS-4.5 (pesos padrão), em dias */
const FW=[0.4872,1.4003,3.7145,13.8206,5.1618,1.2298,0.8975,0.031,1.6474,0.1367,1.0461,2.1072,0.0793,0.3246,1.587,0.2272,2.8755],FDEC=-0.5,FFAC=19/81;
const fClamp=(v,a,b)=>Math.max(a,Math.min(b,v)),fR=(t,s)=>Math.pow(1+FFAC*t/s,FDEC),fIvl=s=>fClamp(Math.round(s),1,36500);
const fD0=g=>fClamp(FW[4]-Math.exp(FW[5]*(g-1))+1,1,10),fS0=g=>Math.max(.1,FW[g-1]);
const fND=(d,g)=>fClamp(FW[7]*fD0(4)+(1-FW[7])*(d-FW[6]*(g-3)),1,10);
const fRec=(d,s,r,g)=>s*(1+Math.exp(FW[8])*(11-d)*Math.pow(s,-FW[9])*(Math.exp(FW[10]*(1-r))-1)*(g===2?FW[15]:1)*(g===4?FW[16]:1));
const fFor=(d,s,r)=>Math.min(s,FW[11]*Math.pow(d,-FW[12])*(Math.pow(s+1,FW[13])-1)*Math.exp(FW[14]*(1-r)));
/* próximo estado para cada nota (1 Errei, 2 Difícil, 3 Bom, 4 Fácil): {f, days} (days=0 → volta nesta mesma sessão) */
function fsNext(x,g){const f=x.f||{st:0},T=today(),el=f.last?Math.max(0,dnum(T)-dnum(f.last)):0;let s,d,st,days,lap=f.lapses||0;
  if(!f.st){d=fD0(g);s=fS0(g);if(g===1){st=1;days=0}else{st=2;days=fIvl(s)}}
  else if(f.st===1||f.st===3){d=fND(f.d,g);s=f.s;if(g===1){st=f.st;days=0}else{st=2;days=fIvl(g===4?s*1.5:g===2?s*.8:s)}}
  else{const r=fR(el,f.s);d=fND(f.d,g);if(g===1){s=Math.max(.1,fFor(f.d,f.s,r));st=3;days=0;lap++}else{s=fRec(f.d,f.s,r,g);st=2;days=fIvl(s)}}
  return {f:{st,s:+s.toFixed(4),d:+d.toFixed(4),last:T,reps:(f.reps||0)+1,lapses:lap,first:f.first||T},days}}
function fsPreview(x){const P=[1,2,3,4].map(g=>fsNext(x,g).days);if(P[1]&&P[2]&&P[1]>P[2])P[1]=P[2];if(P[2]&&P[3]<=P[2])P[3]=P[2]+1;if(P[1]&&P[2]===P[1]&&P[2]>1)P[1]=Math.max(1,P[2]-1);return P}
const fsLab=d=>!d?"<10 min":d<30?`${d} d`:d<365?`${Math.round(d/30)} m`:`${(d/365).toFixed(d<3650?1:0).replace(".",",")} a`;
function cdOk(x){return !!x&&typeof x==="object"&&typeof x.id==="string"&&typeof x.k==="string"&&typeof x.q==="string"&&typeof x.a==="string"&&x.q.trim()&&x.a.trim()}
function cdClean(x){const D=/^\d{4}-\d{2}-\d{2}$/,box=Number.isInteger(x.box)&&x.box>=0&&x.box<CD_INT.length?x.box:0,n=Number.isInteger(x.n)?x.n:0,due=D.test(x.due)?x.due:today();
  let f=x.f&&typeof x.f==="object"?{st:[0,1,2,3].includes(x.f.st)?x.f.st:0,s:+x.f.s||0,d:+x.f.d||0,last:D.test(x.f.last||"")?x.f.last:"",reps:+x.f.reps||0,lapses:+x.f.lapses||0,first:D.test(x.f.first||"")?x.f.first:""}:null;
  if(!f){f=n||box?{st:2,s:CD_INT[box]||1,d:5,last:fromNum(dnum(due)-(CD_INT[box]||1)),reps:n,lapses:0,first:""}:{st:0,s:0,d:0,last:"",reps:0,lapses:0,first:""}}
  if(f.st&&!(f.s>0)){f.s=1;f.d=f.d||5}
  const o={id:x.id,k:x.k,q:x.q.slice(0,1500),a:x.a.slice(0,3000),box,due,n,ok:Number.isInteger(x.ok)?x.ok:0,src:x.src==="claude"?"claude":"eu",f};
  if(x.h)o.h=1;if(typeof x.ref==="string"&&x.ref.trim())o.ref=x.ref.slice(0,600);if(typeof x.kind==="string")o.kind=x.kind.slice(0,12);if(typeof x.eid==="string")o.eid=x.eid;if(typeof x.at==="string")o.at=x.at;if(x.dr)o.dr=1;return o}
try{const v=JSON.parse(localStorage.getItem(LSCD)||"[]");if(Array.isArray(v))cards=v.filter(cdOk).map(cdClean)}catch(e){}
function cdSaveLocal(){try{localStorage.setItem(LSCD,JSON.stringify(cards))}catch(e){}}
async function cdPut(x){cdSaveLocal();if(!cardStore)return;const k="cd:"+x.id;try{await cardStore.doc(x.id).set(JSON.parse(JSON.stringify(x)));saveOk(k)}catch(e){if(cards.includes(x))saveFail(k,"cartão",e,()=>cdPut(x))}}
async function cdDel(id){{const x=cards.find(c=>c.id===id);if(x)toTrash("card",cdPlain(x.q).slice(0,120),topicName(x.k),x)}cards=cards.filter(x=>x.id!==id);cdSaveLocal();render();if(cardStore)try{await cardStore.doc(id).delete()}catch(e){}}
function cdAdd(k,q,a,src,o){const x=cdClean({id:"cd"+Date.now().toString(36)+Math.random().toString(36).slice(2,6),k,q:q.trim(),a:a.trim(),box:0,due:today(),n:0,ok:0,src,at:new Date().toISOString(),...(o||{})});cards.push(x);cdPut(x);return x}
const cdNewLimit=()=>{const v=ui.prefs.cdNew;return Number.isInteger(v)&&v>=0&&v<=100?v:14};
const cdNewToday=()=>cards.filter(x=>x.f.first===today()).length;
/* fila de hoje: revisões e aprendizado vencidos + novos até o limite do dia */
function cdDue(){const T=today(),K=pwKeys(),pf=pwFirst(K,x=>x.k),rev=cards.filter(x=>BYKEY[x.k]&&!x.dr&&x.f.st&&x.due<=T).sort((a,b)=>pf(a,b)||(a.due<b.due?-1:a.due>b.due?1:0)),left=Math.max(0,cdNewLimit()-cdNewToday());
  const nw=left?cards.filter(x=>BYKEY[x.k]&&!x.dr&&!x.f.st).sort((a,b)=>pf(a,b)||((a.at||a.id)<(b.at||b.id)?-1:1)).slice(0,left):[];return [...rev,...nw]}
function cdAnswer(x,g){if(g===true)g=3;else if(g===false)g=1;const N=fsNext(x,g);x.f=N.f;x.n++;if(g>1)x.ok++;x.due=fromNum(dnum(today())+N.days);x.box=Math.min(CD_INT.length-1,CD_INT.findIndex(v=>v>=N.days)<0?CD_INT.length-1:CD_INT.findIndex(v=>v>=N.days));cdPut(x);return N.days}
const cdReady=()=>cards.filter(x=>BYKEY[x.k]&&x.f.st===2&&dnum(x.due)-dnum(today())>=CD_ANKI);
function cdForecast(){const T=dnum(today()),L=[];for(let i=0;i<7;i++){const d=fromNum(T+i);L.push({d,n:cards.filter(x=>BYKEY[x.k]&&x.f.st&&(i?x.due===d:x.due<=d)).length})}return L}
/* texto dos cartões: os novos (h=1) guardam HTML simples do padrão Osler; o app só deixa passar b, i, u, br, listas */
function cdSafe(html){const t=document.createElement("template");t.innerHTML=String(html||"");const ok=new Set(["B","STRONG","I","EM","U","BR","UL","OL","LI","SUB","SUP"]);
  const walk=n=>{[...n.childNodes].forEach(c=>{if(c.nodeType===1){walk(c);if(!ok.has(c.tagName)){c.replaceWith(...c.childNodes)}else[...c.attributes].forEach(a=>c.removeAttribute(a.name))}else if(c.nodeType!==3)c.remove()})};walk(t.content);return t.innerHTML}
const cdPlain=h=>{const t=document.createElement("template");t.innerHTML=String(h||"").replace(/<br\s*\/?>/gi," ");return t.content.textContent.replace(/\s+/g," ").trim()};
const cdHTML=(x,f)=>x.h?cdSafe(x[f]):esc(x[f]).replace(/\n/g,"<br>");
function cdTxt2html(t){return esc(String(t||"")).replace(/\*\*(.+?)\*\*/g,"<b>$1</b>").replace(/\n/g,"<br>")}
/* ---- tela Cartões ---- */
function cdRunStart(ids,gen){const Q=Array.isArray(ids)?ids.map(id=>cards.find(c=>c.id===id)).filter(Boolean):cdDue();if(!Q.length)return;cdRun={ids:Q.map(x=>x.id),i:0,show:false,done:0,g:{1:0,2:0,3:0,4:0},again:{},gen:gen||""};render()}
/* revisão geral com cartões (dia de 30 min): cartões já estudados dos temas da prova da faculdade em até 7 dias ou, sem prova, dos temas estudados nesta semana */
const CD_GEN_MAX=20;
function cdGenScope(){const t=dnum(today()),up=upcomingProvas().find(p=>daysTo(p.date)<=7);
  if(up)return {lab:up.name,prova:true,keys:new Set(topicKeysOf(up.items))};
  const ws=wpMon(t),K=new Set();[...ALL,...FAC_ITEMS].forEach(i=>{if((get(i.key).ed||[]).some(d=>dnum(d)>=ws))K.add(i.key)});return {lab:"temas da semana",prova:false,keys:K}}
function cdGenIds(S){return cards.filter(x=>BYKEY[x.k]&&S.keys.has(x.k)&&x.f&&x.f.st).sort((a,b)=>a.due<b.due?-1:a.due>b.due?1:0).slice(0,CD_GEN_MAX).map(x=>x.id)}
function cdGenGo(){const S=cdGenScope(),ids=cdGenIds(S);if(!ids.length)return;backStack=[];setView("notas");if(typeof setNSeg==="function")setNSeg("revisar");cdRunStart(ids,S.prova?`Revisão geral · ${S.lab}`:"Revisão geral · temas da semana");
  setTimeout(()=>{const c=document.querySelector("#viewNotas .ncards");if(c)c.scrollIntoView({block:"start",behavior:"smooth"})},60)}
function cdRate(x,g){const R=cdRun,xt=R.extra&&R.extra.includes(x.id),days=xt?(g===1?0:1):cdAnswer(x,g);R.done++;R.g[g]++;if(xt)R.xn=(R.xn||0)+1;if(!days){R.ids.push(x.id);R.again[x.id]=(R.again[x.id]||0)+1}R.i++;R.show=false;cdEd=null;render()}
function nCardsCard0(){const due=cdDue(),c=el(`<section class="card ncards" aria-labelledby="nch"><div class="dhead"><h2 id="nch">Cartões</h2><span class="todaydate"></span></div></section>`);
  const nNew=due.filter(x=>!x.f.st).length,nRev=due.length-nNew;{const nl=cards.filter(x=>!x.dr).length;c.querySelector(".todaydate").textContent=nl?`${due.length} hoje · ${nl} no total`:""}
  if(cdRun){c.querySelector(".dhead").appendChild(fullBtn("cd"));const R=cdRun,x=cards.find(y=>y.id===R.ids[R.i]);
    if(R.gen){const g=el(`<p class="pnote cdgen" id="cdGenNote"></p>`);g.textContent=`${R.gen}: ${Math.min(R.i+1,R.ids.length)} de ${R.ids.length} cartões. Conta como revisão normal de cada cartão.`;c.appendChild(g)}
    if(!x||R.i>=R.ids.length){c.appendChild(el(`<p class="verdict ok">Fim por hoje: ${R.done} ${R.done===1?"resposta":"respostas"} (Errei ${R.g[1]} · Difícil ${R.g[2]} · Bom ${R.g[3]} · Fácil ${R.g[4]}).${R.xn?` ${R.xn} de treino extra, sem mudar a agenda.`:""}</p>`));
      c.appendChild(el(`<p class="how hx">Cada cartão volta no dia em que você estaria perto de esquecer (FSRS): quem você acertou com facilidade some por mais tempo.</p>`));
      const b=el(`<button class="btn primary" type="button">Fechar</button>`);b.onclick=()=>{cdRun=null;render()};c.appendChild(b);return c}
    const it=BYKEY[x.k],left=R.ids.length-R.i,card=el(`<div class="oscard${R.show?" flip":""}"><div class="oshead"><span class="qn"></span><button class="link fctopic" type="button"></button></div><div class="osq"></div><div class="osa" hidden></div><div class="osref" hidden></div></div>`);
    const xt=R.extra&&R.extra.includes(x.id);card.querySelector(".qn").textContent=`${xt?"TREINO EXTRA · NÃO MUDA A AGENDA · ":!x.f.st?"NOVO · ":x.f.st===2?"":"APRENDENDO · "}FALTAM ${left}`;if(xt)card.classList.add("osextra");const tb=card.querySelector(".fctopic");tb.textContent=it?it.t:"";tb.onclick=()=>openTopic(x.k);
    card.querySelector(".osq").innerHTML=cdHTML(x,"q");
    if(R.show){const a=card.querySelector(".osa");a.hidden=false;a.innerHTML=cdHTML(x,"a");if(x.ref){const r=card.querySelector(".osref");r.hidden=false;r.innerHTML=cdSafe(x.ref)}}
    c.appendChild(card);const a=el(`<div class="osbtns"></div>`);
    if(!R.show){const s=el(`<button class="btn primary osshow" type="button" id="cdShow">Mostrar resposta</button>`);s.onclick=()=>{R.show=true;render()};a.appendChild(s)}
    else{const P=xt?[0,null,null,null]:fsPreview(x);[[1,"Errei","cdR1"],[2,"Difícil","cdR2"],[3,"Bom","cdR3"],[4,"Fácil","cdR4"]].forEach(([g,l,id])=>{const b=el(`<button class="osb osb${g}" type="button"><span class="osi"></span><b></b></button>`);b.id=id;b.querySelector(".osi").textContent=P[g-1]===null?"treino":fsLab(P[g-1]);b.querySelector("b").textContent=l;b.onclick=()=>cdRate(x,g);a.appendChild(b)})}
    c.appendChild(a);if(R.show){if(cdEd&&cdEd.id===x.id)c.appendChild(cdEditEl());else{const eb=el(`<button class="link cdedb" type="button" id="cdEdRun">✎ Editar este cartão</button>`);eb.onclick=()=>cdEditOpen(x);c.appendChild(eb)}}
    const st=el(`<button class="link" type="button">Encerrar</button>`);st.onclick=()=>{cdRun=null;cdEd=null;render()};c.appendChild(st);
    c.appendChild(el(`<p class="how erkeys">Teclado: espaço mostra a resposta · 1 Errei · 2 Difícil · 3 Bom · 4 Fácil${fullOn.cd?" · Esc sai da tela inteira":""}</p>`));return c}
  {const lt=cdLotEl();if(lt)c.appendChild(lt)}
  if(!cards.some(x=>!x.dr)){if(cards.length){c.appendChild(cdCfgEl());return c}c.appendChild(el(`<p class="cempty">Crie cartões a partir dos seus erros (no caderno de erros, ⋯ Ações › <b>Criar cartões</b>) ou das anotações (no tema, <b>Criar cartões com o Claude</b>). Cada cartão volta no dia certo pelo FSRS, com 4 botões como no Anki.</p>`));c.appendChild(cdCfgEl());return c}
  const sum=el(`<div class="cdsum"><div class="kpi"><span class="kl">Revisões hoje</span><b></b></div><div class="kpi"><span class="kl">Novos hoje</span><b></b><span class="ks"></span></div><div class="kpi"><span class="kl">Prontos p/ Anki</span><b></b><span class="ks">≥ ${CD_ANKI} dias</span></div></div>`),K=sum.querySelectorAll("b");
  K[0].textContent=nRev;K[1].textContent=nNew;sum.querySelectorAll(".ks")[0].textContent=`${cdNewToday()} de ${cdNewLimit()} já vistos`;K[2].textContent=cdReady().length;c.appendChild(sum);
  const FC=cdForecast(),mx=Math.max(1,...FC.map(x=>x.n)),fc=el(`<figure class="cdfc"><figcaption>Revisões nos próximos 7 dias</figcaption><div class="cdfcb"></div></figure>`),fb=fc.querySelector(".cdfcb");
  FC.forEach((x,i)=>{const d=el(`<div class="cdfcc"><span class="cdfn"></span><i style="height:${Math.round(x.n/mx*100)}%"></i><span class="cdfd"></span></div>`);d.querySelector(".cdfn").textContent=x.n;d.querySelector(".cdfd").textContent=i?new Date(x.d+"T12:00").toLocaleDateString("pt-BR",{weekday:"short"}).replace(".",""):"hoje";fb.appendChild(d)});c.appendChild(fc);
  if(due.length){const go=el(`<button class="btn primary" type="button" id="cdGo"></button>`);go.textContent=`Revisar ${due.length} ${due.length===1?"cartão":"cartões"}`;go.onclick=cdRunStart;c.appendChild(go)}
  else{const nx=cards.filter(x=>x.f.st).map(x=>x.due).sort()[0];c.appendChild(el(`<p class="cempty">Nada para hoje.${nx?` O próximo volta em ${br(nx)}.`:""}${cards.some(x=>!x.f.st)?` Os novos do dia já entraram (limite ${cdNewLimit()}).`:""}</p>`))}
  {const tr=cdTreeEl();if(tr)c.appendChild(tr)}
  c.appendChild(cdAnkiEl());c.appendChild(cdCfgEl());return c}
function cdCfgEl(){const w=el(`<details class="plain cdcfg"><summary>Ajustes dos cartões</summary></details>`);
  const r=segRow("Novos por dia","Quantos cartões novos entram por dia. As revisões não têm limite.",[[7,"7"],[14,"14"],[20,"20"],[30,"30"]],cdNewLimit(),v=>{ui.prefs.cdNew=v;saveUI();render()});w.appendChild(r);return w}
/* ---- cartões a partir de um erro: rascunho do app (2 cartões) ou do Claude no padrão Osler ---- */
const CDK={disc:"Discriminador",nao:"Por que não a sua",lac:"Lacuna",arm:"Armadilha",con:"Contraste"};
function cdLabel(it){return it?it.t:""}
function cdErrParse(e){const R=String(e.r||"").split("\n").map(cmTidy).filter(Boolean).join("\n"),m=/^Marquei (.+?); a certa era (.+)$/.exec(eOneLine(e.w)),why=cmTidy((/(?:^|\n)Por que não[^:]*:\s*(.+)/.exec(R)||[])[1]||""),concept=R.split("\n").filter(l=>!/^Por que não/.test(l)&&!/^Correta:/.test(l)).join(" ").trim();
  const o={mine:m&&m[1],right:m&&m[2],why,concept};
  /* Lote 20: o "Errei" guarda as alternativas cortadas (~90 letras); a questão inteira (e.q) tem o texto completo, o porquê e o comentário */
  const Q=e.q&&Array.isArray(e.q.a)?e.q:null;if(Q){const mi=Q.a.find(a=>a.l===Q.m),ri=Q.a.find(a=>a.l===Q.c);
    if(ri&&ri.t)o.right=cmTidy(ri.t);if(mi&&mi.t&&Q.m!==Q.c)o.mine=cmTidy(mi.t);if(mi&&mi.p&&Q.m!==Q.c)o.why=cmTidy(mi.p);
    if(/…$/.test(o.concept)||!o.concept){const cm=clSents(cmTidy(Q.cm||"")).slice(0,2).join(" ");const full=[Q.co||"",cm].filter(Boolean).join(" ");if(full)o.concept=full}}
  return o}
/* "por que não X": alternativa curta na própria pergunta; longa (mais de ~80 letras) em linha própria, inteira */
function cdNaoQ(L,txt,ctx){const t=String(txt||"").replace(/\s+/g," ").trim();
  return t.length<=80?`<b>${L}.</b> Por que <u>não</u> ${esc(t)}${ctx?" neste caso":""}?`:`<b>${L}.</b> Por que esta alternativa <u>não</u> serve${ctx?" neste caso":""}?<br><br><i>${esc(t)}</i>`}
/* Lote 21: o rascunho usa tudo o que o erro guarda (questão inteira, porquês, ponto-chave, pista, dados decisivos, conceito) */
function cdAskOf(e){const t=e.q&&e.q.e?cmTidy(e.q.e):"";if(!t)return "";const a=clSents(t).filter(x=>/\?$/.test(x)).pop()||"";return a.length>220?"":a}
function cdErrDrafts(e){const it=BYKEY[e.k],L=esc(cdLabel(it)),P=cdErrParse(e),ref=e.s?`<i>Questão</i>, em <b>${esc(e.s)}</b>.`:"",out=[];
  const pc=e.pc?cmTidy(e.pc):"",co=e.q&&e.q.co?cmTidy(e.q.co):"",ask=cdAskOf(e),dd=e.dd?e.dd.trim():"";
  const expl=[pc,co&&!qSameTxt(co,pc)?co:"",!pc&&!co?P.concept:""].filter(Boolean).join(" ");
  const caso=dd?esc(dd):e.p?mdBold(e.p):"";
  if(P.right){
    const q=ask&&caso?`<b>${L}.</b> ${caso}<br><br>${esc(ask)}`:ask?`<b>${L}.</b> ${esc(ask)}`:`<b>${L}.</b> ${caso?caso+" &rarr; ":""}qual é a resposta?`;
    out.push({kind:"disc",q,a:`<b>${esc(P.right)}</b>${expl?`<br><br><i>${esc(expl)}</i>`:""}`,ref,keep:true});
    if(P.mine){const note=e.t==="confusao"||e.t==="interpretacao"?(e.t==="confusao"?" <b>Note:</b> você confundiu as duas; compare o que separa uma da outra.":" <b>Note:</b> leia de novo o que o enunciado pede."):"";
      out.push({kind:"nao",q:cdNaoQ(L,P.mine,!!(e.p||dd)),a:`<b>${esc(P.why||"Não se encaixa no caso: veja o conceito.")}</b><br><br><i>A resposta é <b>${esc(P.right)}</b>.${expl?" "+esc(expl):""}${note}</i>`,ref,keep:true})}}
  else out.push({kind:"disc",q:`<b>${L}.</b> ${esc(eOneLine(e.w))}${e.p?` (${esc(e.p)})`:""} &rarr; qual é o certo?`,a:`<b>${esc(eOneLine(e.r).slice(0,200))}</b>${pc?`<br><br><i>${esc(pc)}</i>`:""}`,ref,keep:true});
  return out}
const qSameTxt=(a,b)=>{const n=x=>String(x||"").toLowerCase().replace(/[^a-zà-ú0-9]+/g," ").trim();return !!a&&!!b&&(n(a)===n(b)||n(b).includes(n(a))||n(a).includes(n(b)))};
/* Lote 20: cartões do app que saíram com a alternativa cortada ("…") são refeitos pelos dados completos do erro (e.q); o agendamento (FSRS) fica.
   Só os montados pelo app (src "eu", tipos discriminador/por que não, ligados a um erro); os do Claude ficam como estão. Roda depois de carregar a conta. */
/* Lote 21: erros antigos com a questão inteira ganham a organização do app (uma vez; nunca mexe no que é do usuário ou do Claude) */
function eOrgAll(){let n=0;errors.forEach(e=>{if(e.ra||!e.q)return;const o=eOrg(e);if(o){e.ra=o;putErr(e);n++}});return n}
function cdFixCut(){eOrgAll();let n=0;cards.forEach(x=>{if(x.src!=="eu"||!x.h||!x.eid||!["disc","nao"].includes(x.kind))return;if(!/…/.test(cdPlain(x.q)+cdPlain(x.a)))return;
    const e=errors.find(y=>y.id===x.eid);if(!e||!e.q||!Array.isArray(e.q.a))return;const d=cdErrDrafts(e).find(y=>y.kind===x.kind);if(!d)return;
    if(/…/.test(cdPlain(d.q)+cdPlain(d.a))&&(cdPlain(d.q)+cdPlain(d.a)).length<=(cdPlain(x.q)+cdPlain(x.a)).length)return;
    if(d.q===x.q&&d.a===x.a)return;x.q=cdSafe(d.q);x.a=cdSafe(d.a);cdPut(x);n++});if(n)render();return n}
function cdErrPrompt(e){if(e.trecho)return trPrompt(e);const it=BYKEY[e.k],P=cdErrParse(e);return `Você cria flashcards no Padrão Osler (Anki) para um estudante de medicina, a partir de ${e.okq?"uma QUESTÃO que ele acertou (talvez no chute) e quer fixar. O cartão mira o que decide a questão":"um ERRO que ele cometeu numa questão. O cartão mira o ponto cego que causou o erro"}, não um resumo do tema.
Tema: ${it?it.t:""} (${it?areaLabel(it):""}). Tipo de erro: ${ETYPES[e.t]||""}${e.c?`; causa: ${e.c}`:""}.
O que ele errou: ${P.mine&&P.right?`marcou "${P.mine}"; a certa era "${P.right}"`:eOneLine(e.w)}${e.p?`\nPista do caso: ${e.p}`:""}${e.q&&e.q.e?`\nEnunciado da questão: ${e.q.e.replace(/\s+/g," ").slice(0,2500)}`:""}${P.why?`\nPor que a que ele marcou não serve: ${P.why}`:""}
Conceito correto: ${String(e.r||"").slice(0,1500)}${e.q&&e.q.cm?`\nComentário da questão: ${e.q.cm.slice(0,2000)}`:""}

Crie 4 cartões, um de cada tipo, nesta ordem:
1. "discriminador": o detalhe do caso que separa a resposta certa da que ele marcou (pergunta direta).
2. "por-que-nao": por que a alternativa que ele marcou não serve neste caso (pergunta direta; a armadilha vai num parágrafo "Note:").
3. "lacuna": uma frase com o dado-chave trocado por [...] (nunca use {{c1::}}).
4. "${e.t==="confusao"?"contraste":"armadilha"}": ${e.t==="confusao"?"cartão comparativo entre as duas entidades que ele confundiu (o que separa uma da outra)":"a armadilha ligada à causa do erro (leitura, exceção, conduta vs. diagnóstico)"}.
Regras do Padrão Osler:
- Question: rótulo da ENTIDADE específica em <b>negrito</b> terminado em ponto (ex.: <b>Anemia ferropriva.</b>), depois a pergunta, afirmação ou lacuna; o rótulo não pode entregar a resposta. Um conceito por cartão, respondível em segundos.
- Answer: 1ª linha = resposta em <b>negrito</b> (até ~20 palavras); na lacuna, a frase completa com o termo em <b>negrito</b>. Depois <br><br><i>explicação curta e didática, com 1 ou 2 termos em <b>negrito</b>, fechando na consequência prática</i>. "Note:" só quando houver armadilha, como último parágrafo dentro do itálico.
- Reference: a fonte, com título em <i>itálico</i> e publicação em <b>negrito</b> (ex.: <i>Treatment of iron deficiency anemia in adults</i>, em <b>UpToDate</b>.). Nunca invente título, autor ou ano: se não tiver certeza, cite de forma geral (ex.: diretriz da SBC) ou deixe "".
- Só as tags HTML b, i, u, br, ul, ol, li. Escreva &lt; e &gt; para os sinais de comparação. Nada de cor, tamanho ou estilo.
Responda apenas com um array JSON, sem outro texto: [{"tipo":"discriminador","question":"...","answer":"...","reference":"..."}]
Escreva em português do Brasil.`}
const CD_TIPO={discriminador:"disc","por-que-nao":"nao",lacuna:"lac",armadilha:"arm",contraste:"con"};
async function cdErrClaude(e){if(!sampleFn)return;const S=cdErr[e.id]||(cdErr[e.id]={list:cdErrDrafts(e)});S.st="loading";S.ctl=new AbortController();S.msg="";render();
  try{const data=await sampleFn.json(cdErrPrompt(e),{signal:S.ctl.signal,cache:false,title:"Cartões do erro",hint:"Cole aqui a resposta do Claude (o JSON com os cartões)."});if(cdErr[e.id]!==S)return;
    const arr=(Array.isArray(data)?data:[]).filter(c=>c&&typeof c.question==="string"&&typeof c.answer==="string"&&c.question.trim()&&c.answer.trim()).slice(0,4);
    if(!arr.length){S.st="error";S.msg="O Claude não devolveu cartões num formato que o app reconheça. Os do app continuam abaixo."}
    else{S.list=arr.map(c=>{const kd=CD_TIPO[String(c.tipo||"").toLowerCase()]||"disc";return {kind:kd,q:cdSafe(c.question),a:cdSafe(c.answer),ref:cdSafe(c.reference||""),keep:!!e.trecho||kd==="disc"||kd==="nao",sug:kd==="con",src:"claude"}});S.st="done"}}
  catch(x){if(cdErr[e.id]!==S)return;const code=x&&x.code;if(code==="cancelled"){S.st="";render();return}S.st="error";S.msg=GEN_OFF.includes(code)?"O Claude não está disponível nesta visualização.":(GEN_ERR[code]||"Não foi possível agora.")}
  render()}
function cdErrSave(e,dr){const S=cdErr[e.id]||{list:cdErrDrafts(e)},ids=S.list.filter(c=>c.keep).map(c=>cdAdd(e.k,c.q,c.a,c.src==="claude"?"claude":"eu",{h:1,ref:c.ref||"",kind:c.kind,...(e.virtual?{}:{eid:e.id}),...(dr?{dr:1}:{})}).id);
  if(dr&&ids.length)setTimeout(()=>infoToast(`${ids.length} ${ids.length===1?"cartão foi":"cartões foram"} para o lote de melhorias (fora da revisão até o Claude melhorar).`,"Ver em Cartões",cdGoCards),30);
  if(e.virtual){if(e.onSaved)e.onSaved(ids)}else if(ids.length){e.cd=ids[0];putErr(e)}delete cdErr[e.id];render();return ids}
function cdErrEl(e){const S=cdErr[e.id]||(cdErr[e.id]={list:cdErrDrafts(e)}),w=el(`<div class="cderr" data-eid="${e.id}"><div class="dhead"><b>${e.trecho?"Cartões deste trecho":e.virtual?"Cartões desta questão":"Cartões deste erro"}</b><button class="link" type="button">Fechar</button></div><p class="how">${e.trecho?"Rascunhos feitos pelo app a partir do trecho (lacuna no termo em negrito ou destaque). Marque os que quer guardar: eles entram em Caderno › Revisar › Cartões. Para cartões melhores, peça ao Claude.":e.virtual?"O que decide a questão (e, se você errou, por que a sua não serve). Marque os que quer guardar: eles entram em Caderno › Revisar › Cartões.":"Dois por erro: o que separa a certa da sua e por que a sua não serve. Marque os que quer guardar."}</p><ol class="cdlist"></ol><div class="btns"></div></div>`);
  w.querySelector(".dhead .link").onclick=()=>{delete cdErr[e.id];render()};const ol=w.querySelector("ol");
  S.list.forEach((c,i)=>{const li=el(`<li class="cdit"><label class="cdck"><input type="checkbox"> <span class="cdk"></span></label><div class="oscard mini"><div class="osq"></div><div class="osa"></div><div class="osref"></div></div></li>`);
    const cb=li.querySelector("input");cb.id=`cdk-${e.id}-${i}`;cb.checked=!!c.keep;cb.onchange=()=>{c.keep=cb.checked;render()};li.querySelector(".cdk").textContent=(CDK[c.kind]||"Cartão")+(c.sug?" · sugerido para este erro":"");
    li.querySelector(".osq").innerHTML=cdSafe(c.q);li.querySelector(".osa").innerHTML=cdSafe(c.a);const r=li.querySelector(".osref");if(c.ref)r.innerHTML=cdSafe(c.ref);else r.remove();ol.appendChild(li)});
  const B=w.querySelector(".btns"),n=S.list.filter(c=>c.keep).length,sv=el(`<button class="btn primary" type="button"></button>`);sv.id="cdSave-"+e.id;sv.textContent=`Salvar ${n} ${n===1?"cartão":"cartões"}`;sv.disabled=!n;sv.title="Os cartões ficam como estão e já entram na revisão";
  sv.onclick=()=>cdErrSave(e);B.appendChild(sv);
  /* Lote 21: guardar como rascunho para o Claude melhorar em lote (fica fora da revisão) */
  if(!e.trecho){const lb=el(`<button class="btn" type="button"></button>`);lb.id="cdLot-"+e.id;lb.textContent="Juntar ao lote de melhorias";lb.disabled=!n;lb.title="Ficam parados como rascunho, fora da revisão, até o Claude melhorar o lote (em Cartões)";lb.onclick=()=>cdErrSave(e,true);B.appendChild(lb)}
  if(!sampleOff){if(S.st==="loading"){B.appendChild(el(`<span class="gstatus">Criando com o Claude…</span>`));const x=el(`<button class="link" type="button">Cancelar</button>`);x.onclick=()=>S.ctl.abort();B.appendChild(x)}
    else{const g=el(`<button class="btn" type="button"></button>`);g.id="cdAI-"+e.id;g.textContent=S.st==="done"?"✦ Gerar de novo":"✦ Melhorar com o Claude (padrão Osler)";g.disabled=!sampleFn;g.onclick=()=>cdErrClaude(e);B.appendChild(g)}}
  if(S.msg){const m=el(`<p class="err"></p>`);m.textContent=S.msg;w.appendChild(m)}
  return w}
