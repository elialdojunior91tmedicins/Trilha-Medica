/* Aba Cartões (13/11/2026): partes Hoje · Todos · Números (view "cartoes", #viewCards, #cSegBar, #cdBody).
   Todo caminho até os cartões passa por cdOpen(parte, opções). Desenho: docs/superpowers/specs/2026-11-13-aba-cartoes-design.md */
let cSeg="hoje";try{const v=localStorage.getItem("resid-cseg");if(["hoje","todos","numeros"].includes(v))cSeg=v}catch(e){}
let cdF={sort:(()=>{const v=lsGet("resid-cdsort","due");return ["due","lapses","new"].includes(v)?v:"due"})()},cdNewOpen=false,cdPick=null;
function setCSeg(v){cSeg=v;lsSet("resid-cseg",v);render();window.scrollTo({top:0})}
/* o={k:tema (filtro em Todos), leech:true, pick:id (abre no editor), run:[ids], gen:rótulo, go:true (começa a revisão do dia), novo:true} */
function cdOpen(seg,o){o=o||{};backStack=[];cSeg=seg||"hoje";lsSet("resid-cseg",cSeg);
  if(seg==="todos"&&(o.k||o.leech))cdF={sort:cdF.sort,...(o.k?{k:o.k}:{}),...(o.leech?{leech:true}:{})};if(o.pick)cdPick=o.pick;if(o.novo)cdNewOpen=true;
  showView("cartoes");if(o.run)cdRunStart(o.run,o.gen);else if(o.go)cdRunStart();else render();window.scrollTo({top:0})}
function renderCards(){const v=$("#viewCards"),B=$("#cdBody");if(!v||!B)return;v.dataset.cseg=cSeg;const dn=cdDue().length;
  $("#cSegBar").querySelectorAll("button").forEach(b=>{b.setAttribute("aria-pressed",b.dataset.c===cSeg);b.innerHTML={hoje:"Hoje"+(dn?`<b>${dn}</b>`:""),todos:"Todos",numeros:"Números"}[b.dataset.c];b.onclick=()=>setCSeg(b.dataset.c)});
  B.innerHTML="";const L=cSeg==="todos"?[cdAllEl()]:cSeg==="numeros"?[cdNumEl()]:cdHojeEls();L.filter(Boolean).forEach(x=>B.appendChild(x))}
/* ---- Hoje ---- */
function cdHojeEls(){const c=nCardsCard0(),h=c.querySelector("h2");h.textContent="Revisão de hoje";c.querySelector(".dhead").appendChild(helpBtn("Cartões"));const out=[c];
  if(cdRun)return out;
  const due=cdDue(),nNew=due.filter(x=>!x.f.st).length,nRev=due.length-nNew,line=el(`<p class="how cdline" id="cdLine"></p>`);
  line.textContent=due.length?`${nRev} para revisar · ${nNew} ${nNew===1?"novo":"novos"} · ~${Math.max(1,Math.round(due.length*.25))} min`:"Nada para revisar hoje.";
  c.querySelector(".dhead").after(line);
  const nb=el(`<button class="btn" type="button" id="cdNew">+ Novo cartão</button>`);nb.setAttribute("aria-expanded",cdNewOpen);nb.onclick=()=>{cdNewOpen=!cdNewOpen;render();if(cdNewOpen)setTimeout(()=>{const x=$("#cdNewBox");if(x)x.scrollIntoView({block:"nearest",behavior:"smooth"})},60)};
  const go=c.querySelector("#cdGo"),row=el(`<div class="btns cdgorow"></div>`);if(go){go.before(row);row.append(go,nb)}else{line.after(row);row.appendChild(nb)}
  if(cdNewOpen&&typeof cdNewEl==="function")row.after(cdNewEl());
  const lc=cdLeechEl();if(lc)out.push(lc);return out}
function cdLeechEl(){const L=cdLeeches(5);if(!L.length)return null;const all=cards.filter(x=>cdLive(x)&&(x.f.lapses||0)>=CD_LEECH).length;
  const c=el(`<section class="card cdleech" id="cdLeech" aria-labelledby="cdLh"><div class="dhead"><h2 id="cdLh">Cartões que você mais esquece</h2></div><p class="how">Esqueceu ${CD_LEECH} vezes ou mais. Reescrever costuma resolver: deixe a pergunta mais específica ou divida em dois cartões.</p><ul class="cdlist"></ul></section>`),ul=c.querySelector("ul");
  L.forEach(x=>{const it=BYKEY[x.k],li=el(`<li class="cdlrow"><div class="cdlq"></div><div class="cdlm how"></div><div class="btns"><button class="mini" type="button">Editar</button><button class="mini" type="button">Juntar ao lote de melhorias</button></div></li>`);
    li.querySelector(".cdlq").textContent=cdTxt(x.q);li.querySelector(".cdlm").textContent=`esqueceu ${x.f.lapses}× · ${it?it.t:""}`;
    const [e,j]=li.querySelectorAll("button");e.id="cdLE-"+x.id;e.onclick=()=>cdEditOpen(x,true);j.id="cdLJ-"+x.id;j.onclick=()=>{x.dr=1;cdPut(x);infoToast("Foi para o lote de melhorias (fora da revisão até o Claude melhorar).","Ver o lote",()=>{cdLotOpen=true;cdOpen("hoje")});render()};
    if(cdEd&&cdEd.id===x.id)li.appendChild(cdEditEl());ul.appendChild(li)});
  if(all>L.length){const m=el(`<button class="link" type="button" id="cdLAll"></button>`);m.textContent=`Ver todos os ${all}`;m.onclick=()=>cdOpen("todos",{leech:true});c.appendChild(m)}
  return c}
/* ---- Todos e Números: preenchidos nas próximas etapas ---- */
function cdAllEl(){return el(`<section class="card cdall" id="cdAll"><div class="dhead"><h2>Todos os cartões</h2></div></section>`)}
function cdNumEl(){return el(`<section class="card cdnum" id="cdNum"><div class="dhead"><h2>Números</h2></div></section>`)}
/* ---- Criar: um cartão, colar vários, com o Claude; aviso de repetido (cdDupOf) ---- */
let cdNS={mode:"um",k:"",q:"",a:"",paste:"",prev:null,dup:"",ks:[],tq:"",msg:""};
const cdPool=()=>[...ALL,...FAC_ITEMS];
function cdNsK(){if(cdNS.kOff)return "";if(cdNS.k&&BYKEY[cdNS.k])return cdNS.k;const f=cdF.k&&BYKEY[cdF.k]?cdF.k:"",l=lsGet("resid-cdlastk","");return f||(l&&BYKEY[l]?l:"")}
/* busca de tema: atualiza só a lista (não redesenha a tela, para não perder o foco) */
function cdTopicPick(id,onPick,ph){const w=el(`<div class="cdtpick"><input class="etext" type="search" autocomplete="off"><ul class="qrres"></ul></div>`),i=w.querySelector("input"),ul=w.querySelector("ul");
  i.id=id;i.placeholder=ph||"Buscar tema (ex.: sepse, IAM)";i.setAttribute("aria-label","Buscar tema");
  const fill=()=>{ul.innerHTML="";const n=norm(i.value.trim());if(n.length<2)return;
    cdPool().map(x=>{const t=norm(x.t),sub=norm((x.sp||"")+" "+(x.own?"faculdade":""));return {x,sc:t.startsWith(n)?3:t.includes(n)?2:sub.includes(n)?1:0}}).filter(r=>r.sc).sort((a,b)=>b.sc-a.sc||(a.x.num||0)-(b.x.num||0)).slice(0,6)
      .forEach(({x},j)=>{const li=el(`<li><button type="button" class="qrpick"><b></b><span></span></button></li>`),b=li.querySelector("button");b.id=id+"-"+j;b.querySelector("b").textContent=x.t;b.querySelector("span").textContent=x.own?"Faculdade":`${x.area.code} · ${x.sp||x.area.name}`;b.onclick=()=>onPick(x.key);ul.appendChild(li)});
    if(!ul.children.length)ul.appendChild(el(`<li class="how">Nenhum tema com esse nome.</li>`))};
  i.oninput=fill;return w}
function cdNsTopicEl(){const k=cdNsK(),w=el(`<div class="cdnk"><span class="glabel">Tema</span></div>`);
  if(k){const r=el(`<div class="cdnkcur"><b></b><button class="link" type="button" id="cdnKx">Trocar</button></div>`);r.querySelector("b").textContent=BYKEY[k].t;r.querySelector("button").onclick=()=>{cdNS.kOff=true;render();setTimeout(()=>{const x=$("#cdnT");if(x)x.focus()},40)};w.appendChild(r)}
  else w.appendChild(cdTopicPick("cdnT",key=>{cdNS.k=key;cdNS.kOff=false;lsSet("resid-cdlastk",key);cdNS.dup="";render();setTimeout(()=>{const x=$("#cdnQ")||$("#cdnPaste");if(x)x.focus()},40)}));
  return w}
function cdNsSave(more,force){const k=cdNsK(),q=cdNS.q.trim(),a=cdNS.a.trim();
  if(!k){cdNS.msg="Escolha o tema.";render();return}if(!q||!a){cdNS.msg="Escreva a pergunta e a resposta.";render();return}
  const d=!force&&cdDupOf(k,cdT2H(q));if(d){cdNS.dup=d.id;cdNS.msg="";render();return}
  cdAdd(k,cdT2H(q),cdT2H(a),"eu",{h:1,kind:"man"});lsSet("resid-cdlastk",k);cdNS={...cdNS,k,q:"",a:"",dup:"",msg:""};
  if(!more)cdNewOpen=false;infoToast("Cartão criado. Ele entra na revisão como novo.");render();if(more)setTimeout(()=>{const x=$("#cdnQ");if(x)x.focus()},40)}
function cdNsPrev(){const k=cdNsK(),P=cdParsePaste(cdNS.paste);cdNS.prev={k,bad:P.bad,list:P.ok.map(o=>{const d=k&&cdDupOf(k,cdT2H(o.q));return {...o,dup:d?d.id:"",keep:!d}})};render()}
function cdNsMany(){const R=cdNS.prev,k=cdNsK();if(!R||!k)return;const L=R.list.filter(o=>o.keep);L.forEach(o=>cdAdd(k,cdT2H(o.q),cdT2H(o.a),"eu",{h:1,kind:"man"}));lsSet("resid-cdlastk",k);
  cdNS={...cdNS,paste:"",prev:null};cdNewOpen=false;infoToast(`${L.length} ${L.length===1?"cartão criado":"cartões criados"}. Entram na revisão como novos.`);render()}
function cdNewEl(){const S=cdNS,w=el(`<div class="cdnew" id="cdNewBox"><div class="dhead"><b>Novo cartão</b><button class="link" type="button" id="cdnX">Fechar</button></div><div class="tseg cdnmodes" role="group" aria-label="Como criar"></div></div>`);
  w.querySelector("#cdnX").onclick=()=>{cdNewOpen=false;render()};const M=w.querySelector(".cdnmodes");
  [["um","Um cartão"],["varios","Colar vários"],...(sampleOff?[]:[["claude","Com o Claude"]])].forEach(([m,l])=>{const b=el(`<button type="button"></button>`);b.id="cdnM-"+m;b.textContent=l;b.setAttribute("aria-pressed",S.mode===m);b.onclick=()=>{S.mode=m;S.msg="";render()};M.appendChild(b)});
  if(S.mode==="claude"){w.appendChild(el(`<p class="how">Escolha até 5 temas. Para cada um, o Claude cria cartões a partir da sua anotação (o tema precisa ter anotação).</p>`));
    const ch=el(`<div class="chips cdnks"></div>`);S.ks.filter(k=>BYKEY[k]).forEach(k=>{const c=el(`<button class="chip" type="button" aria-pressed="true"></button>`);c.textContent=BYKEY[k].t+" ×";c.title="Tirar";c.onclick=()=>{S.ks=S.ks.filter(x=>x!==k);render()};ch.appendChild(c)});if(S.ks.length)w.appendChild(ch);
    if(S.ks.length<5)w.appendChild(cdTopicPick("cdnC",key=>{if(!S.ks.includes(key))S.ks.push(key);render()},"Buscar tema para criar com o Claude"));
    S.ks.filter(k=>BYKEY[k]).forEach(k=>{const b=el(`<div class="cdnblk"><b class="cdnbt"></b></div>`);b.dataset.k=k;b.querySelector("b").textContent=BYKEY[k].t;b.appendChild(cardsBlock(BYKEY[k]));w.appendChild(b)});return w}
  w.appendChild(cdNsTopicEl());
  if(S.mode==="um"){const f=el(`<div class="cdnf"><label class="cdef"><span>Pergunta</span><textarea id="cdnQ" rows="3" maxlength="1500" placeholder="Ex.: **Leucoplasia pilosa** — qual o agente?"></textarea></label><label class="cdef"><span>Resposta</span><textarea id="cdnA" rows="3" maxlength="3000"></textarea></label><p class="how">Use **negrito** e *itálico*.</p></div>`);
    const [q,a]=f.querySelectorAll("textarea");q.value=S.q;a.value=S.a;q.oninput=()=>{S.q=q.value;if(S.dup){S.dup="";const d=$("#cdnDup");if(d)d.remove()}};a.oninput=()=>{S.a=a.value};w.appendChild(f);
    if(S.dup){const x=cards.find(c=>c.id===S.dup);if(x){const d=el(`<div class="pnote cdndup" id="cdnDup" role="status"><span></span><div class="btns"><button class="btn" type="button" id="cdnDupGo">Criar mesmo assim</button><button class="link" type="button" id="cdnDupSee">Ver o outro</button></div></div>`);
      d.querySelector("span").textContent=`Parecido com: ${cdTxt(x.q).slice(0,140)}`;d.querySelector("#cdnDupGo").onclick=()=>cdNsSave(false,true);d.querySelector("#cdnDupSee").onclick=()=>{cdNewOpen=false;cdOpen("todos",{pick:x.id})};w.appendChild(d)}}
    const B=el(`<div class="btns"><button class="btn primary" type="button" id="cdnMore">Salvar e criar outro</button><button class="btn" type="button" id="cdnSave">Salvar</button></div>`);B.querySelector("#cdnMore").onclick=()=>cdNsSave(true);B.querySelector("#cdnSave").onclick=()=>cdNsSave(false);w.appendChild(B)}
  else{const f=el(`<label class="cdef"><span>Um cartão por linha: pergunta :: resposta (ou separados por tabulação)</span><textarea id="cdnPaste" rows="6" placeholder="Agente da leucoplasia pilosa :: Vírus Epstein-Barr&#10;Tratamento da sífilis latente tardia :: Penicilina benzatina 3 doses"></textarea></label>`),t=f.querySelector("textarea");t.value=S.paste;t.oninput=()=>{S.paste=t.value;if(S.prev){S.prev=null;const p=$("#cdnPrev");if(p)p.remove();const m=$("#cdnMany");if(m)m.remove()}};w.appendChild(f);
    const rd=el(`<div class="btns"><button class="btn" type="button" id="cdnRead">Ver prévia</button></div>`);rd.querySelector("button").onclick=cdNsPrev;w.appendChild(rd);
    const R=S.prev;if(R){const p=el(`<div class="cdnprev" id="cdnPrev"><ul class="cdrev"></ul></div>`),ul=p.querySelector("ul");
      R.list.forEach((o,i)=>{const li=el(`<li><label><input type="checkbox" class="cdnchk"><span><b></b><span></span></span></label></li>`),c=li.querySelector("input");c.id="cdnP-"+i;c.checked=o.keep;c.onchange=()=>{o.keep=c.checked;const m=$("#cdnMany");if(m){const n=R.list.filter(z=>z.keep).length;m.textContent=`Criar ${n} ${n===1?"cartão":"cartões"}`;m.disabled=!n||!cdNsK()}};
        li.querySelector("b").textContent=o.q;li.querySelector("label>span>span").textContent=o.a;if(o.dup){const x=cards.find(c=>c.id===o.dup);const d=el(`<p class="how cdndupl"></p>`);d.textContent=`Parecido com: ${x?cdTxt(x.q).slice(0,100):""}`;li.appendChild(d)}ul.appendChild(li)});
      if(!R.list.length)p.appendChild(el(`<p class="how">Nenhuma linha com pergunta e resposta.</p>`));
      if(R.bad.length){const b=el(`<p class="how cdnbad" id="cdnBad"></p>`);b.textContent=`${R.bad.length===1?"Linha":"Linhas"} sem "::" ou tabulação (não entram): ${R.bad.join(", ")}.`;p.appendChild(b)}
      const n=R.list.filter(o=>o.keep).length,mb=el(`<button class="btn primary" type="button" id="cdnMany"></button>`);mb.textContent=`Criar ${n} ${n===1?"cartão":"cartões"}`;mb.disabled=!n||!cdNsK();mb.onclick=cdNsMany;p.appendChild(mb);w.appendChild(p)}}
  if(S.msg){const m=el(`<p class="err"></p>`);m.textContent=S.msg;w.appendChild(m)}return w}
