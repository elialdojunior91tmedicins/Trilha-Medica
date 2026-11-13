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
