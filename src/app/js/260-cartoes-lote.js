/* ===== Lote 21 item 3: lote de melhorias, árvore, estudo por recorte e editor ===== */
function cdGoCards(){backStack=[];setView("notas");if(typeof setNSeg==="function")setNSeg("revisar");setTimeout(()=>{const c=document.querySelector("#viewNotas .ncards");if(c)c.scrollIntoView({block:"start",behavior:"smooth"})},80)}
const cdDrafts=()=>cards.filter(x=>x.dr&&BYKEY[x.k]);
const CD_LOT=8;// cartões por pedido ao Claude (no site, cada pedido é um copiar e colar)
let cdLot=null,cdLotOpen=false;
function cdLotItem(x,i){const e=x.eid&&errors.find(y=>y.id===x.eid),it=BYKEY[x.k],P=e?cdErrParse(e):null,Q=e&&e.q&&Array.isArray(e.q.a)?e.q:null;const L=[`### Cartão ${i+1} · código ${x.id}`,`Tema: ${it?it.t:""}${it?` (${areaLabel(it)})`:""}. Tipo do cartão: ${CDK[x.kind]||"cartão"}.`];
  if(e){L.push(`Tipo de erro: ${ETYPES[e.t]||""}${e.c?`; causa: ${e.c}`:""}.`);
    if(Q){if(Q.e)L.push(`Enunciado: ${Q.e.replace(/\s+/g," ").slice(0,2500)}`);L.push("Alternativas:\n"+Q.a.map(a=>`${a.l}) ${a.t}${a.l===Q.c?" [CORRETA]":""}${a.l===Q.m&&Q.m!==Q.c?" [MARCADA PELO ESTUDANTE]":""}${a.p?` — porquê: ${a.p}`:""}`).join("\n"));if(Q.cm)L.push(`Comentário: ${Q.cm.slice(0,2000)}`);if(Q.co)L.push(`Conceito: ${Q.co}`)}
    else L.push(`O que ele errou: ${P.mine&&P.right?`marcou "${P.mine}"; a certa era "${P.right}"`:eOneLine(e.w)}. Conceito correto: ${String(e.r||"").slice(0,1500)}`);
    if(e.pc)L.push(`Ponto-chave: ${e.pc}`);if(e.p)L.push(`Pista do caso: ${e.p}`);if(e.dd)L.push(`Dados decisivos: ${e.dd}`)}
  L.push(`Cartão atual (rascunho do app):\nquestion: ${x.q}\nanswer: ${x.a}${x.ref?`\nreference: ${x.ref}`:""}`);return L.join("\n")}
function cdLotPrompt(L,pi,pn){return `Você melhora flashcards no Padrão Osler (Anki) para um estudante de medicina. Cada cartão abaixo foi montado pelo app a partir de um erro dele numa questão${pn>1?` (parte ${pi+1} de ${pn})`:""}. Reescreva CADA cartão mantendo o mesmo tipo e o mesmo alvo (o ponto cego que causou o erro), usando a questão inteira, os porquês e o ponto-chave.
Regras do Padrão Osler:
- Question: rótulo da ENTIDADE específica em <b>negrito</b> terminado em ponto, depois a pergunta; o rótulo não pode entregar a resposta. Um conceito por cartão, respondível em segundos.
- Answer: 1ª linha = resposta em <b>negrito</b> (até ~20 palavras). Depois <br><br><i>explicação curta e didática, com 1 ou 2 termos em <b>negrito</b>, fechando na consequência prática</i>. "Note:" só quando houver armadilha, como último parágrafo dentro do itálico.
- Reference: a fonte, com título em <i>itálico</i> e publicação em <b>negrito</b>. Nunca invente título, autor ou ano: se não tiver certeza, cite de forma geral ou deixe "".
- Só as tags HTML b, i, u, br, ul, ol, li. Escreva &lt; e &gt; para comparações.
Responda apenas com um array JSON, um objeto por cartão, sem outro texto, levando o mesmo código: [{"codigo":"...","question":"...","answer":"...","reference":"..."}]
Escreva em português do Brasil.

${L.map((x,i)=>cdLotItem(x,pi*CD_LOT+i)).join("\n\n")}`}
async function cdLotRun(){if(!sampleFn)return;const L=cdDrafts();if(!L.length)return;const parts=[];for(let i=0;i<L.length;i+=CD_LOT)parts.push(L.slice(i,i+CD_LOT));
  const R=cdLot={st:"loading",i:0,n:parts.length,res:[],msg:"",ctl:new AbortController()};render();
  try{for(let pi=0;pi<parts.length;pi++){R.i=pi;render();
      const data=await sampleFn.json(cdLotPrompt(parts[pi],pi,parts.length),{signal:R.ctl.signal,cache:false,title:`Melhorar cartões${parts.length>1?` · parte ${pi+1} de ${parts.length}`:""}`,hint:"Cole aqui a resposta do Claude (o JSON com os cartões)."});if(cdLot!==R)return;
      const arr=Array.isArray(data)?data:[];parts[pi].forEach((x,j)=>{const c=arr.find(o=>o&&String(o.codigo||o.code||"").trim()===x.id)||(arr.length===parts[pi].length&&!arr.some(o=>o&&o.codigo)?arr[j]:null);
        if(c&&typeof c.question==="string"&&typeof c.answer==="string"&&c.question.trim()&&c.answer.trim())R.res.push({id:x.id,q:cdSafe(c.question),a:cdSafe(c.answer),ref:cdSafe(c.reference||""),ok:true});else R.res.push({id:x.id,miss:true})})}
    R.st="review";if(!R.res.some(r=>!r.miss)){R.st="error";R.msg="O Claude não devolveu cartões num formato que o app reconheça. Os rascunhos continuam no lote."}}
  catch(x){if(cdLot!==R)return;const code=x&&x.code;if(code==="cancelled"){cdLot=R.res.some(r=>!r.miss)?(R.st="review",R):null;render();return}
    R.st=R.res.some(r=>!r.miss)?"review":"error";R.msg=(GEN_OFF.includes(code)?"O Claude não está disponível nesta visualização.":(GEN_ERR[code]||"Não foi possível agora."))+(R.st==="review"?" Revise as partes que chegaram.":"")}
  render()}
function cdLotApply(){const R=cdLot;if(!R)return;let n=0;R.res.forEach(r=>{if(r.miss||!r.ok)return;const x=cards.find(c=>c.id===r.id);if(!x)return;x.q=r.q;x.a=r.a;if(r.ref)x.ref=r.ref;else delete x.ref;x.h=1;x.src="claude";delete x.dr;cdPut(x);n++});
  cdLot=null;cdSaveLocal();infoToast(`${n} ${n===1?"cartão melhorado entrou":"cartões melhorados entraram"} na revisão.`);render()}
function cdUseAsIs(x){delete x.dr;cdPut(x);render()}
function cdLotEl(){const L=cdDrafts(),R=cdLot;if(!L.length&&!R)return null;
  const w=el(`<div class="cdlot" id="cdLotBox"></div>`);
  if(R&&R.st==="review"){const ok=R.res.filter(r=>!r.miss&&r.ok).length;w.appendChild(el(`<div class="cdloth"><b>Antes e depois</b><span class="how">Aprove os que ficaram melhores. Aprovado = troca o rascunho e entra na revisão; o resto continua no lote.</span></div>`));
    const ol=el(`<ol class="cdba"></ol>`);R.res.forEach((r,i)=>{const x=cards.find(c=>c.id===r.id);if(!x)return;const li=el(`<li class="cdbai"><div class="cdbah"><span class="cdk"></span></div><div class="cdbac"><div><span class="glabel">Antes</span><div class="oscard mini"><div class="osq"></div><div class="osa"></div></div></div><div><span class="glabel">Depois · Claude</span><div class="oscard mini aft"><div class="osq"></div><div class="osa"></div><div class="osref"></div></div></div></div></li>`);
      li.querySelector(".cdk").textContent=`${topicName(x.k)} · ${CDK[x.kind]||"Cartão"}`;const [b0,b1]=li.querySelectorAll(".oscard");b0.querySelector(".osq").innerHTML=cdHTML(x,"q");b0.querySelector(".osa").innerHTML=cdHTML(x,"a");
      if(r.miss){b1.innerHTML=`<p class="how">O Claude não devolveu este cartão. Ele continua no lote.</p>`}
      else{b1.querySelector(".osq").innerHTML=r.q;b1.querySelector(".osa").innerHTML=r.a;const rf=b1.querySelector(".osref");if(r.ref)rf.innerHTML=r.ref;else rf.remove();
        const cb=el(`<label class="cdck cdap"><input type="checkbox"> Aprovar</label>`),inp=cb.querySelector("input");inp.id="cdAp-"+i;inp.checked=r.ok;inp.onchange=()=>{r.ok=inp.checked;render()};li.querySelector(".cdbah").appendChild(cb)}
      ol.appendChild(li)});w.appendChild(ol);
    const B=el(`<div class="btns"><button class="btn primary" type="button" id="cdLotApply"></button><button class="link" type="button" id="cdLotCancel">Descartar a melhoria</button></div>`);
    B.querySelector("#cdLotApply").textContent=`Aplicar ${ok} ${ok===1?"aprovado":"aprovados"}`;B.querySelector("#cdLotApply").disabled=!ok;B.querySelector("#cdLotApply").onclick=cdLotApply;B.querySelector("#cdLotCancel").onclick=()=>{cdLot=null;render()};w.appendChild(B);
    if(R.msg){const m=el(`<p class="err"></p>`);m.textContent=R.msg;w.appendChild(m)}return w}
  const top=el(`<div class="cdlotl"><span class="cdlotn"><b></b> esperando o Claude</span><span class="cdlota"></span></div>`);top.querySelector("b").textContent=`${L.length} ${L.length===1?"cartão":"cartões"}`;const A=top.querySelector(".cdlota");
  if(R&&R.st==="loading"){A.appendChild(el(`<span class="gstatus">Melhorando${R.n>1?` · parte ${R.i+1} de ${R.n}`:""}…</span>`));const x=el(`<button class="link" type="button">Parar</button>`);x.onclick=()=>R.ctl.abort();A.appendChild(x)}
  else{const g=el(`<button class="btn primary" type="button" id="cdLotGo">✦ Melhorar todos</button>`);g.disabled=!sampleFn||sampleOff;g.onclick=cdLotRun;A.appendChild(g);
    const v=el(`<button class="link" type="button" id="cdLotSee"></button>`);v.textContent=cdLotOpen?"Esconder":"Ver";v.onclick=()=>{cdLotOpen=!cdLotOpen;render()};A.appendChild(v)}
  w.appendChild(top);
  if(!(R&&R.st==="loading")){const n=Math.ceil(L.length/CD_LOT);w.appendChild(el(`<p class="how hx">Um pedido só${n>1?` (em ${n} partes de até ${CD_LOT})`:""}: cada cartão vai com a questão inteira, a alternativa que você marcou, a certa, os porquês e o ponto-chave. Você confere antes e depois e aprova.</p>`))}
  if(R&&R.st==="error"&&R.msg){const m=el(`<p class="err"></p>`);m.textContent=R.msg;w.appendChild(m)}
  if(cdLotOpen){const ol=el(`<ol class="cdlotlist"></ol>`);L.forEach(x=>{const li=el(`<li class="cdlotit"><div class="oscard mini"><div class="osq"></div><div class="osa"></div></div><div class="cdlotb"><button class="mini" type="button"></button><button class="mini" type="button">✎ Editar</button><button class="mini warn" type="button">Apagar</button></div></li>`);
      li.querySelector(".osq").innerHTML=cdHTML(x,"q");li.querySelector(".osa").innerHTML=cdHTML(x,"a");const [u,ed,dl]=li.querySelectorAll(".cdlotb button");u.id="cdUse-"+x.id;u.textContent="Usar como está";u.onclick=()=>cdUseAsIs(x);ed.id="cdEdL-"+x.id;ed.onclick=()=>cdEditOpen(x);dl.onclick=()=>cdDel(x.id);
      if(cdEd&&cdEd.id===x.id)li.appendChild(cdEditEl());ol.appendChild(li)});w.appendChild(ol)}
  return w}
/* ---- editor completo do cartão: frente, resposta, explicação, Note e referência (texto com **negrito** e *itálico*) ---- */
let cdEd=null;
function cdH2T(h){let t=String(h||"").replace(/<\s*(b|strong)\s*>/gi,"**").replace(/<\s*\/\s*(b|strong)\s*>/gi,"**").replace(/<\s*(i|em)\s*>/gi,"*").replace(/<\s*\/\s*(i|em)\s*>/gi,"*").replace(/<br\s*\/?>/gi,"\n").replace(/<\s*li[^>]*>/gi,"\n• ").replace(/<[^>]+>/g,"");
  const d=document.createElement("textarea");d.innerHTML=t;return d.value.replace(/\*\*\s*\*\*/g,"").replace(/\n{3,}/g,"\n\n").trim()}
function cdT2H(t){return esc(String(t||"").trim()).replace(/\*\*(.+?)\*\*/g,"<b>$1</b>").replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g,"$1<i>$2</i>").replace(/\n/g,"<br>")}
function cdSplitA(x){const h=x.h?String(x.a||""):cdTxt2html(x.a);const i=h.search(/<br\s*\/?>\s*<br\s*\/?>/i);let ans=i<0?h:h.slice(0,i),rest=i<0?"":h.slice(i).replace(/^(<br\s*\/?>\s*){2}/i,"");
  rest=rest.replace(/^\s*<i>([\s\S]*)<\/i>\s*$/i,"$1");const m=/(?:<br\s*\/?>\s*)*(?:<b>)?\s*Note:\s*(?:<\/b>)?\s*([\s\S]*)$/i.exec(rest),note=m?m[1]:"",ex=m?rest.slice(0,m.index):rest;
  return {a:cdH2T(ans),x:cdH2T(ex.replace(/<\/?i>/gi,"")),n:cdH2T(note.replace(/<\/?i>/gi,""))}}
function cdJoinA(a,x,n){const A=cdT2H(a),X=cdT2H(x),N=cdT2H(n);return A+(X||N?`<br><br><i>${X}${X&&N?"<br><br>":""}${N?"<b>Note:</b> "+N:""}</i>`:"")}
function cdEditOpen(x){const S=cdSplitA(x);if(x.dr)cdLotOpen=true;else if(!(cdRun&&cdRun.ids[cdRun.i]===x.id)&&BYKEY[x.k]){const it=BYKEY[x.k];["a:"+it.area.code,"s:"+specId(it),"t:"+x.k].forEach(i=>cdTreeOpen.add(i))}cdEd={id:x.id,q:cdH2T(x.h?x.q:cdTxt2html(x.q)),a:S.a,x:S.x,n:S.n,r:cdH2T(x.ref||""),msg:""};render();setTimeout(()=>{const t=$("#cde-q");if(t)t.focus()},50)}
function cdEditSave(){const E=cdEd,x=cards.find(c=>c.id===E.id);if(!x){cdEd=null;render();return}if(!E.q.trim()||!E.a.trim()){E.msg="Frente e resposta não podem ficar vazias.";render();return}
  x.q=cdSafe(cdT2H(E.q));x.a=cdSafe(cdJoinA(E.a,E.x,E.n));const r=cdT2H(E.r);if(r)x.ref=cdSafe(r);else delete x.ref;x.h=1;cdPut(x);cdEd=null;render()}
function cdEditEl(){const E=cdEd,w=el(`<div class="cdedit" id="cdEdit"><div class="dhead"><b>Editar cartão</b><button class="link" type="button" id="cdeX">Cancelar</button></div><p class="how">Use **negrito** e *itálico*. Enter quebra a linha.</p></div>`);
  [["q","Frente","A pergunta, com o rótulo do tema em negrito",3],["a","Resposta","A resposta em uma linha, em negrito",2],["x","Explicação","Por que é assim; pode acrescentar quanto quiser",4],["n","Note","A armadilha, se houver",2],["r","Referência","Fonte: *título*, em **publicação**",2]].forEach(([k,l,ph,rows])=>{
    const f=el(`<label class="cdef"><span>${l}</span><textarea rows="${rows}"></textarea></label>`),t=f.querySelector("textarea");t.id="cde-"+k;t.placeholder=ph;t.value=E[k];t.oninput=()=>{E[k]=t.value;const pv=$("#cdePrev");if(pv)cdPrevFill(pv)};w.appendChild(f)});
  const pv=el(`<div class="oscard mini cdeprev" id="cdePrev"><div class="osq"></div><div class="osa"></div><div class="osref"></div></div>`);cdPrevFill(pv);w.appendChild(el(`<span class="glabel">Como fica</span>`));w.appendChild(pv);
  const B=el(`<div class="btns"><button class="btn primary" type="button" id="cdeSave">Salvar</button></div>`);B.querySelector("button").onclick=cdEditSave;w.appendChild(B);w.querySelector("#cdeX").onclick=()=>{cdEd=null;render()};
  if(E.msg){const m=el(`<p class="err"></p>`);m.textContent=E.msg;w.appendChild(m)}return w}
function cdPrevFill(pv){const E=cdEd;pv.querySelector(".osq").innerHTML=cdSafe(cdT2H(E.q));pv.querySelector(".osa").innerHTML=cdSafe(cdJoinA(E.a,E.x,E.n));const r=cdT2H(E.r);pv.querySelector(".osref").innerHTML=r?cdSafe(r):"";pv.querySelector(".osref").hidden=!r}
/* ---- árvore Grande área › Especialidade › Tema, com estudo por recorte ---- */
let cdTreeOpen=new Set(),cdTopicOpen=null;
function cdCounts(L){const T=today();return {n:L.length,d:L.filter(x=>x.f.st&&x.due<=T).length,nw:L.filter(x=>!x.f.st).length}}
function cdCountTxt(c){return `${c.n} ${c.n===1?"cartão":"cartões"}${c.d?` · <b class="cdtd">${c.d} hoje</b>`:""}${c.nw?` · ${c.nw} ${c.nw===1?"novo":"novos"}`:""}`}
/* vencidos entram como revisão normal (e os novos até o limite do dia); o resto entra como treino extra, sem mexer na agenda */
function cdSliceIds(L){const T=today(),due=L.filter(x=>x.f.st&&x.due<=T).sort((a,b)=>a.due<b.due?-1:1),left=Math.max(0,cdNewLimit()-cdNewToday()),nw=L.filter(x=>!x.f.st).slice(0,left);
  const used=new Set([...due,...nw].map(x=>x.id)),ex=L.filter(x=>!used.has(x.id)).sort((a,b)=>a.due<b.due?-1:1).slice(0,40);return {ids:[...due,...nw,...ex].map(x=>x.id),extra:ex.map(x=>x.id),n:due.length+nw.length}}
function cdSliceGo(L,lab){const S=cdSliceIds(L);if(!S.ids.length)return;cdRunStart(S.ids,`Estudar · ${lab}`);if(cdRun){cdRun.extra=S.extra;cdRun.slice=1}
  setTimeout(()=>{const c=document.querySelector("#viewNotas .ncards");if(c)c.scrollIntoView({block:"start",behavior:"smooth"})},60)}
function cdTreeEl(){const L=cards.filter(x=>BYKEY[x.k]&&!x.dr);if(!L.length)return null;const A={};
  L.forEach(x=>{const it=BYKEY[x.k],a=it.area,ak=a.code,sk=specId(it);const g=A[ak]||(A[ak]={lab:a.name,sp:{},L:[]});g.L.push(x);const sp=g.sp[sk]||(g.sp[sk]={lab:it.sp||a.name,t:{},L:[]});sp.L.push(x);(sp.t[x.k]=sp.t[x.k]||[]).push(x)});
  const w=el(`<div class="cdtree" id="cdTree"><span class="glabel">Por área, especialidade e tema</span><ul class="cdtl0"></ul></div>`),ul0=w.querySelector("ul");
  const row=(id,lab,Ls,lv,kids)=>{const li=el(`<li class="cdtn lv${lv}"><div class="cdtr"><button class="cdtt" type="button"><span class="cdtar" aria-hidden="true"></span><span class="cdtl"></span><span class="cdtc"></span></button><button class="mini cdts" type="button">Estudar</button></div></li>`);
    const open=cdTreeOpen.has(id),tb=li.querySelector(".cdtt");tb.id="cdT-"+id.replace(/[^a-zA-Z0-9-]/g,"_");tb.setAttribute("aria-expanded",open);li.querySelector(".cdtar").textContent=open?"▾":"▸";li.querySelector(".cdtl").textContent=lab;li.querySelector(".cdtc").innerHTML=cdCountTxt(cdCounts(Ls));
    tb.onclick=()=>{open?cdTreeOpen.delete(id):cdTreeOpen.add(id);render()};const sb=li.querySelector(".cdts");sb.id="cdS-"+id.replace(/[^a-zA-Z0-9-]/g,"_");sb.onclick=()=>cdSliceGo(Ls,lab);
    if(open&&kids){const u=el(`<ul></ul>`);kids(u);li.appendChild(u)}return li};
  const byN=o=>Object.entries(o).sort((a,b)=>(b[1].L||b[1]).length-(a[1].L||a[1]).length);
  const topics=(u,sp)=>byN(sp.t).forEach(([k,tl])=>u.appendChild(row("t:"+k,BYKEY[k].t,tl,2,u3=>tl.forEach(x=>u3.appendChild(cdItemEl(x))))));
  const specs=(u,g)=>byN(g.sp).forEach(([sk,sp])=>u.appendChild(row("s:"+sk,sp.lab,sp.L,1,u2=>topics(u2,sp))));
  byN(A).forEach(([ak,g])=>ul0.appendChild(row("a:"+ak,g.lab,g.L,0,u=>specs(u,g))));
  return w}
function cdItemEl(x){const li=el(`<li class="cdti"><div class="cdtq"></div><span class="cdtw"></span><button class="foeb" type="button" aria-label="Editar cartão">✎</button></li>`);li.querySelector(".cdtq").textContent=cdPlain(x.q);
  li.querySelector(".cdtw").textContent=!x.f.st?"novo":x.due<=today()?"hoje":br(x.due);const b=li.querySelector("button");b.id="cdEd-"+x.id;b.onclick=()=>cdEditOpen(x);if(cdEd&&cdEd.id===x.id)li.appendChild(cdEditEl());return li}
/* ---- Prontos para o Anki: .apkg com tipo de nota "Osler Flashcard (Nexus)", intervalo preservado ---- */
function cdAnkiEl(){const R=cdReady(),w=el(`<div class="cdanki"><span class="glabel">Prontos para o Anki · ${R.length}</span></div>`);
  if(cdExp&&cdExp.ids.length){const n=cdExp.ids.filter(id=>cards.some(x=>x.id===id)).length;
    w.appendChild(el(`<p class="how">Você exportou ${cdExp.ids.length} ${cdExp.ids.length===1?"cartão":"cartões"} em ${br(cdExp.d)}. Depois de importar no Anki (marque "importar o progresso"/"include scheduling"), confirme para tirá-los daqui. Eles ficam 30 dias na lixeira.</p>`));
    const b=el(`<div class="btns"><button class="btn primary" type="button" id="cdAnkiDone">Já importei no Anki</button><button class="link" type="button" id="cdAnkiUndo">Ainda não</button></div>`);
    b.querySelector("#cdAnkiDone").onclick=cdAnkiDone;b.querySelector("#cdAnkiUndo").onclick=()=>{cdExp=null;try{localStorage.removeItem("resid-cdexp")}catch(x){}render()};if(!n)b.querySelector("#cdAnkiDone").disabled=true;w.appendChild(b);return w}
  if(!R.length){w.appendChild(el(`<p class="how">Quando um cartão estiver a ${CD_ANKI} dias ou mais da próxima revisão, ele aparece aqui para ir para o Anki, com o intervalo preservado.</p>`));return w}
  w.appendChild(el(`<p class="how hx">Já estão firmes: vão para o Anki como cartões em revisão (não como novos), no tipo de nota "Osler Flashcard (Nexus)", com tags do tema e do erro.</p>`));
  const b=el(`<button class="btn" type="button" id="cdApkg"></button>`);b.textContent=`Exportar ${R.length} para o Anki (.apkg)`;b.disabled=!downloadsFn;b.onclick=async()=>{b.disabled=true;b.textContent="Gerando…";
    try{const u=await apkgBuild(R);await downloadsFn.save({filename:`nexus-anki-${today()}.apkg`,data:new Blob([u],{type:"application/octet-stream"})});cdExp={d:today(),ids:R.map(x=>x.id)};try{localStorage.setItem("resid-cdexp",JSON.stringify(cdExp))}catch(x){}}
    catch(x){b.textContent=x&&(x.code==="declined"||x.code==="cancelled")?"Download cancelado":"Não foi possível gerar agora"}render()};w.appendChild(b);return w}
function cdAnkiDone(){const ids=new Set((cdExp&&cdExp.ids)||[]),L=cards.filter(x=>ids.has(x.id));if(!L.length){cdExp=null;render();return}
  toTrash("cards",`${L.length} ${L.length===1?"cartão exportado":"cartões exportados"} para o Anki`,br(today()),L);
  L.forEach(x=>{const e=x.eid&&errors.find(y=>y.id===x.eid);if(e){e.ak=(e.ak||0)+1;putErr(e)}});
  cards=cards.filter(x=>!ids.has(x.id));cdSaveLocal();if(cardStore){if(cardStore.delMany)cardStore.delMany(L.map(x=>x.id)).catch(()=>{});else L.forEach(x=>{cardStore.doc(x.id).delete().catch(()=>{})})}cdExp=null;try{localStorage.removeItem("resid-cdexp")}catch(x){}render()}
/* ---- .apkg feito no aparelho: banco SQLite (formato do Anki, esquema 11) escrito à mão + zip sem compressão ---- */
function sqlVar(v){if(v<=0x7f)return [v];const t=[];let x=v;while(x>0){t.push(x%128);x=Math.floor(x/128)}t.reverse();return t.map((b,i)=>i<t.length-1?b|0x80:b)}
const sqlTE=new TextEncoder();
function sqlRecord(vals){const types=[],bodies=[];vals.forEach(v=>{
    if(v===null||v===undefined){types.push(0);return}
    if(typeof v==="number"){if(v===0){types.push(8);return}if(v===1){types.push(9);return}
      const sz=v>=-128&&v<=127?[1,1]:v>=-32768&&v<=32767?[2,2]:v>=-8388608&&v<=8388607?[3,3]:v>=-2147483648&&v<=2147483647?[4,4]:Math.abs(v)<=140737488355327?[5,6]:[6,8];
      types.push(sz[0]);const b=new Array(sz[1]);let x=BigInt(Math.trunc(v));if(x<0n)x+=1n<<BigInt(8*sz[1]);for(let i=sz[1]-1;i>=0;i--){b[i]=Number(x&255n);x>>=8n}bodies.push(b);return}
    const s=sqlTE.encode(String(v));types.push(s.length*2+13);bodies.push(s)});
  const tv=types.flatMap(sqlVar);let hl=tv.length+1;if(sqlVar(hl).length>1)hl=tv.length+sqlVar(hl+1).length;
  const out=[...sqlVar(hl),...tv];bodies.forEach(b=>{for(let i=0;i<b.length;i++)out.push(b[i])});return out}
function sqliteBuild(tables){const PS=4096,U=PS,X=U-35,M=Math.floor((U-12)*32/255)-23,pages=[null];
  const alloc=()=>{pages.push(new Uint8Array(PS));return pages.length-1};
  const w16=(p,o,v)=>{p[o]=v>>8&255;p[o+1]=v&255},w32=(p,o,v)=>{p[o]=v>>>24&255;p[o+1]=v>>>16&255;p[o+2]=v>>>8&255;p[o+3]=v&255};
  /* uma célula de folha: tamanho, rowid, parte local e páginas de transbordo */
  const leafCell=(rowid,rec)=>{const P=rec.length;let local=P;if(P>X){const K=M+((P-M)%(U-4));local=K<=X?K:M}
    const cell=[...sqlVar(P),...sqlVar(rowid),...rec.slice(0,local)];
    if(local<P){let rest=rec.slice(local),first=0,prev=null;while(rest.length){const pg=alloc(),chunk=rest.slice(0,U-4);rest=rest.slice(U-4);pages[pg].set(chunk,4);if(prev)w32(pages[prev],0,pg);else first=pg;prev=pg}
      cell.push(first>>>24&255,first>>>16&255,first>>>8&255,first&255)}return cell};
  const writePage=(pg,type,cells,off,right)=>{const p=pages[pg],hs=type===13?8:12;p[off]=type;w16(p,off+1,0);w16(p,off+3,cells.length);let end=PS;
    cells.forEach((c,i)=>{end-=c.length;p.set(c,end);w16(p,off+hs+2*i,end)});w16(p,off+5,end===65536?0:end);p[off+7]=0;if(type===5)w32(p,off+8,right)};
  /* árvore de uma tabela: folhas e, se precisar, páginas internas */
  const buildTree=(rows,rootPg,off)=>{const cells=rows.map(([rowid,vals])=>({rowid,c:leafCell(rowid,sqlRecord(vals))}));
    const cap=(o,h)=>PS-o-h;let leaves=[],cur=[],used=0;
    cells.forEach(x=>{const need=x.c.length+2;if(cur.length&&used+need>cap(0,8)){leaves.push(cur);cur=[];used=0}cur.push(x);used+=need});if(cur.length||!leaves.length)leaves.push(cur);
    if(leaves.length===1){const pg=rootPg||alloc();writePage(pg,13,leaves[0].map(x=>x.c),rootPg===1?off:0);return pg}
    let level=leaves.map(L=>{const pg=alloc();writePage(pg,13,L.map(x=>x.c),0);return {pg,max:L[L.length-1].rowid}});
    while(true){const groups=[];let g=[],u=0;level.forEach(n=>{const need=4+sqlVar(n.max).length+2;if(g.length&&u+need>cap(0,12)){groups.push(g);g=[];u=0}g.push(n);u+=need});groups.push(g);
      const top=groups.length===1;const next=groups.map(G=>{const pg=top&&rootPg?rootPg:alloc(),cs=G.slice(0,-1).map(n=>[n.pg>>>24&255,n.pg>>>16&255,n.pg>>>8&255,n.pg&255,...sqlVar(n.max)]);writePage(pg,5,cs,top&&rootPg===1?off:0,G[G.length-1].pg);return {pg,max:G[G.length-1].max}});
      if(top)return next[0].pg;level=next}};
  alloc();/* página 1 = sqlite_master */
  const master=tables.map((t,i)=>{const root=buildTree(t.rows,0,0);return [i+1,["table",t.name,t.name,root,t.sql]]});
  buildTree(master,1,100);
  const p1=pages[1],H=sqlTE.encode("SQLite format 3\0");p1.set(H,0);w16(p1,16,PS);p1[18]=1;p1[19]=1;p1[20]=0;p1[21]=64;p1[22]=32;p1[23]=32;w32(p1,24,1);w32(p1,28,pages.length-1);w32(p1,40,1);w32(p1,44,4);w32(p1,56,1);w32(p1,92,1);w32(p1,96,3045001);
  const out=new Uint8Array((pages.length-1)*PS);for(let i=1;i<pages.length;i++)out.set(pages[i],(i-1)*PS);return out}
const CRC_T=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
function crc32(u){let c=0xFFFFFFFF;for(let i=0;i<u.length;i++)c=CRC_T[(c^u[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0}
function zipStore(files){const parts=[],cen=[];let off=0;const dv=n=>{const b=new Uint8Array(n);return [b,new DataView(b.buffer)]};
  files.forEach(f=>{const name=sqlTE.encode(f.name),crc=crc32(f.data),[h,v]=dv(30);v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(8,0,true);v.setUint16(10,0,true);v.setUint16(12,0x21,true);
    v.setUint32(14,crc,true);v.setUint32(18,f.data.length,true);v.setUint32(22,f.data.length,true);v.setUint16(26,name.length,true);parts.push(h,name,f.data);
    const [c,cv]=dv(46);cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(14,0x21,true);cv.setUint32(16,crc,true);cv.setUint32(20,f.data.length,true);cv.setUint32(24,f.data.length,true);cv.setUint16(28,name.length,true);cv.setUint32(42,off,true);cen.push(c,name);
    off+=30+name.length+f.data.length});
  const cs=cen.reduce((s,b)=>s+b.length,0),[e,ev]=dv(22);ev.setUint32(0,0x06054b50,true);ev.setUint16(8,files.length,true);ev.setUint16(10,files.length,true);ev.setUint32(12,cs,true);ev.setUint32(16,off,true);
  const all=[...parts,...cen,e],u=new Uint8Array(all.reduce((s,b)=>s+b.length,0));let p=0;all.forEach(b=>{u.set(b,p);p+=b.length});return u}
const APKG_MID=1699999999123,APKG_DID=1699999999456;
const APKG_CSS=`.card{font-family:Arial,Helvetica,sans-serif;font-size:20px;line-height:1.45;color:#1d1d1f;background:#fff;text-align:center;padding:10px}
.nx-q,.nx-a{max-width:720px;margin:12px auto;border:1.5px solid #c8c8c8;border-radius:12px;padding:18px 22px}
.nx-a i{font-style:italic}.nx-a ul,.nx-a ol,.nx-q ul,.nx-q ol{display:inline-block;text-align:left;margin:6px 0}
.nx-ref{max-width:720px;margin:2px auto 0;text-align:right;color:#8b1a1a;font-size:14px}
.nightMode .card,.night_mode .card{color:#eee;background:#1e1e1e}.nightMode .nx-q,.nightMode .nx-a{border-color:#555}.nightMode .nx-ref{color:#e58a8a}`;
const apkgSlug=s=>norm(String(s||"")).replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
function apkgTags(x){const it=BYKEY[x.k],T=["nexus"];if(it){const parts=[it.own?"faculdade":it.area.name,it.sp,it.t].map(apkgSlug).filter(Boolean);T.unshift(parts.slice(0,3).join("::"));if(!it.own&&wOf(it)>=3)T.push("high-yield")}
  const e=x.eid&&errors.find(y=>y.id===x.eid);if(x.eid)T.push("erro-nexus");if(e&&e.c)T.push(apkgSlug(e.c));if(x.kind)T.push("cartao-"+apkgSlug(CDK[x.kind]||x.kind));return [...new Set(T)]}
async function apkgBuild(L){const now=Date.now(),sec=Math.floor(now/1000),crtDay=new Date(today()+"T00:00:00"),crt=Math.floor(crtDay.getTime()/1000);
  const fld=(x,f)=>x.h?cdSafe(x[f]||""):esc(x[f]||"").replace(/\n/g,"<br>");
  const model={id:APKG_MID,name:"Osler Flashcard (Nexus)",type:0,mod:sec,usn:-1,sortf:0,did:APKG_DID,tags:[],vers:[],latexsvg:false,css:APKG_CSS,req:[[0,"any",[0]]],
    latexPre:"\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n",latexPost:"\\end{document}",
    flds:["Question","Answer","Reference"].map((n,i)=>({name:n,ord:i,sticky:false,rtl:false,font:"Arial",size:20,media:[]})),
    tmpls:[{name:"Card 1",ord:0,qfmt:`<div class="nx-q">{{Question}}</div>`,afmt:`<div class="nx-q">{{Question}}</div><div id="answer" class="nx-a">{{Answer}}</div>{{#Reference}}<div class="nx-ref">{{Reference}}</div>{{/Reference}}`,bqfmt:"",bafmt:"",did:null,bfont:"",bsize:0}]};
  const deck=(id,name)=>({id,name,mod:sec,usn:-1,lrnToday:[0,0],revToday:[0,0],newToday:[0,0],timeToday:[0,0],collapsed:false,desc:"",dyn:0,conf:1,extendNew:0,extendRev:0});
  const dconf={"1":{id:1,name:"Default",mod:0,usn:0,maxTaken:60,autoplay:true,timer:0,replayq:true,dyn:false,new:{delays:[1,10],ints:[1,4,7],initialFactor:2500,separate:true,order:1,perDay:20,bury:true},lapse:{delays:[10],mult:0,minInt:1,leechFails:8,leechAction:0},rev:{perDay:200,ease4:1.3,fuzz:0.05,minSpace:1,ivlFct:1,maxIvl:36500,bury:true}}};
  const conf={activeDecks:[1],curDeck:1,newSpread:0,collapseTime:1200,timeLim:0,estTimes:true,dueCounts:true,curModel:String(APKG_MID),nextPos:1,sortType:"noteFld",sortBackwards:false,addToCur:true};
  const notesR=[],cardsR=[];
  for(let i=0;i<L.length;i++){const x=L[i],nid=now+i,cid=now+L.length+i,q=fld(x,"q"),a=fld(x,"a"),ref=x.ref?(x.h?cdSafe(x.ref):esc(x.ref)):"";
    const sf=cdPlain(q),hash=new Uint8Array(await crypto.subtle.digest("SHA-1",sqlTE.encode(sf))),csum=((hash[0]<<24)>>>0)+(hash[1]<<16)+(hash[2]<<8)+hash[3];
    notesR.push([nid,[null,"nx"+x.id,APKG_MID,sec,-1," "+apkgTags(x).join(" ")+" ",[q,a,ref].join("\x1f"),sf,csum,0,""]]);
    const ivl=Math.max(1,dnum(x.due)-dnum(x.f.last||today())),due=dnum(x.due)-dnum(today()),factor=Number.isFinite(x.f.d)?Math.round(fClamp(3000-(x.f.d-1)*(1700/9),1300,3000)):2500;
    cardsR.push([cid,[null,nid,APKG_DID,0,sec,-1,2,2,due,ivl,factor,Math.max(1,x.f.reps||x.n||1),x.f.lapses||0,0,0,0,0,""]])}
  const db=sqliteBuild([
    {name:"col",sql:"CREATE TABLE col (\n    id              integer primary key,\n    crt             integer not null,\n    mod             integer not null,\n    scm             integer not null,\n    ver             integer not null,\n    dty             integer not null,\n    usn             integer not null,\n    ls              integer not null,\n    conf            text not null,\n    models          text not null,\n    decks           text not null,\n    dconf           text not null,\n    tags            text not null\n)",
      rows:[[1,[null,crt,now,now,11,0,0,0,JSON.stringify(conf),JSON.stringify({[APKG_MID]:model}),JSON.stringify({"1":deck(1,"Default"),[APKG_DID]:deck(APKG_DID,"Nexus::Cartões dos erros")}),JSON.stringify(dconf),"{}"]]]},
    {name:"notes",sql:"CREATE TABLE notes (\n    id              integer primary key,\n    guid            text not null,\n    mid             integer not null,\n    mod             integer not null,\n    usn             integer not null,\n    tags            text not null,\n    flds            text not null,\n    sfld            integer not null,\n    csum            integer not null,\n    flags           integer not null,\n    data            text not null\n)",rows:notesR},
    {name:"cards",sql:"CREATE TABLE cards (\n    id              integer primary key,\n    nid             integer not null,\n    did             integer not null,\n    ord             integer not null,\n    mod             integer not null,\n    usn             integer not null,\n    type            integer not null,\n    queue           integer not null,\n    due             integer not null,\n    ivl             integer not null,\n    factor          integer not null,\n    reps            integer not null,\n    lapses          integer not null,\n    left            integer not null,\n    odue            integer not null,\n    odid            integer not null,\n    flags           integer not null,\n    data            text not null\n)",rows:cardsR},
    {name:"revlog",sql:"CREATE TABLE revlog (\n    id              integer primary key,\n    cid             integer not null,\n    usn             integer not null,\n    ease            integer not null,\n    ivl             integer not null,\n    lastIvl         integer not null,\n    factor          integer not null,\n    time            integer not null,\n    type            integer not null\n)",rows:[]},
    {name:"graves",sql:"CREATE TABLE graves (\n    usn             integer not null,\n    oid             integer not null,\n    type            integer not null\n)",rows:[]}]);
  return zipStore([{name:"collection.anki2",data:db},{name:"media",data:sqlTE.encode("{}")}])}
function cardsPrompt(it){return `Você vai criar cartões de memorização (pergunta e resposta) para um estudante de medicina que se prepara para a prova de residência.
Use SOMENTE o conteúdo das anotações abaixo, sobre o tema "${it.t}" (${areaLabel(it)}). Não invente nada que não esteja nelas.

Anotações:
"""
${(notes[it.key]||"").slice(0,6000)}
"""

Crie de 5 a 10 cartões. Cada pergunta testa um ponto cobrado em prova (critério diagnóstico, conduta de primeira linha, dose, exceção, pegadinha), é curta e tem uma única resposta. A resposta tem no máximo 2 frases.
Responda apenas com um array JSON, sem nenhum outro texto, neste formato:
[{"pergunta":"...","resposta":"..."}]
Escreva em português do Brasil.`}
async function cdGenerate(k){if(!sampleFn)return;const it=BYKEY[k],G=cdGen[k]={status:"loading",list:[],msg:"",ctl:new AbortController()};render();
  try{const data=await sampleFn.json(cardsPrompt(it),{signal:G.ctl.signal,cache:false});if(cdGen[k]!==G)return;
    const arr=(Array.isArray(data)?data:(data&&Array.isArray(data.cartoes)?data.cartoes:[])).filter(c=>c&&typeof c.pergunta==="string"&&typeof c.resposta==="string"&&c.pergunta.trim()&&c.resposta.trim()).slice(0,12);
    if(!arr.length){G.status="error";G.msg="O Claude não devolveu cartões num formato que o app reconheça. Tente de novo."}
    else{G.status="review";G.list=arr.map(c=>({q:c.pergunta.trim(),a:c.resposta.trim(),keep:true}))}}
  catch(e){if(cdGen[k]!==G)return;const code=e&&e.code;if(code==="cancelled"){delete cdGen[k];render();return}G.status="error";G.msg=GEN_OFF.includes(code)?"A geração não está disponível nesta visualização.":(GEN_ERR[code]||"Não foi possível criar os cartões agora.")}
  render()}
/* bloco dos cartões dentro da anotação do tema */
function cardsBlock(it){const k=it.key,mine=cards.filter(x=>x.k===k),G=cdGen[k],w=el(`<div class="grp cardsblk"><span class="glabel">Cartões de memorização${mine.length?" · "+mine.length:""}</span></div>`);
  if(G&&G.status==="loading"){w.appendChild(el(`<p class="gstatus">Criando cartões a partir das suas anotações…</p>`));const b=el(`<button class="btn" type="button">Cancelar</button>`);b.onclick=()=>G.ctl.abort();w.appendChild(b);return w}
  if(G&&G.status==="review"){w.appendChild(el(`<p class="how">Confira os cartões. Desmarque os que não quiser e salve.</p>`));const ul=el(`<ul class="cdrev"></ul>`);
    G.list.forEach((c,i)=>{const li=el(`<li><label><input type="checkbox"${c.keep?" checked":""}><span><b></b><span></span></span></label></li>`);li.querySelector("b").textContent=c.q;li.querySelector("label>span>span").textContent=c.a;li.querySelector("input").onchange=e=>{c.keep=e.target.checked};ul.appendChild(li)});w.appendChild(ul);
    const a=el(`<div class="btns"></div>`),s=el(`<button class="btn primary" type="button">Salvar cartões</button>`),x=el(`<button class="btn" type="button">Descartar</button>`);
    s.onclick=()=>{const n=G.list.filter(c=>c.keep).map(c=>cdAdd(k,c.q,c.a,"claude")).length;delete cdGen[k];nMsgCards=`${n} ${n===1?"cartão salvo":"cartões salvos"}: eles aparecem em Cartões para revisar, na aba Anotações.`;render()};x.onclick=()=>{delete cdGen[k];render()};a.append(s,x);w.appendChild(a);return w}
  if(G&&G.msg){const p=el(`<p class="err"></p>`);p.textContent=G.msg;w.appendChild(p)}
  if(nMsgCards){const p=el(`<p class="pnote" role="status"></p>`);p.textContent=nMsgCards;w.appendChild(p);nMsgCards=""}
  if(mine.length){const ul=el(`<ul class="cdmine"></ul>`);mine.forEach(x=>{const li=el(`<li><span><b></b><span></span></span><button class="foxb" type="button" aria-label="Excluir cartão">×</button></li>`);li.querySelector("b").textContent=x.q;li.querySelector("span>span").textContent=`${x.a} · próxima ${x.due<=today()?"hoje":br(x.due)}`;li.querySelector("button").onclick=()=>cdDel(x.id);ul.appendChild(li)});w.appendChild(ul)}
  const acts=el(`<div class="btns"></div>`);
  if(!sampleOff){const g=el(`<button class="btn" type="button">Criar cartões com o Claude</button>`);g.disabled=!sampleFn||!(notes[k]||"").trim();if(!(notes[k]||"").trim())g.title="Escreva a anotação primeiro";g.onclick=()=>cdGenerate(k);acts.appendChild(g)}
  const m=el(`<button class="link" type="button">+ Cartão manual</button>`);m.onclick=()=>{cdNew[k]=cdNew[k]?null:{q:"",a:""};render()};acts.appendChild(m);w.appendChild(acts);
  if(cdNew[k]){const f=el(`<div class="eform cdform"><label>Pergunta</label><textarea class="etext" id="cdq-${k}" maxlength="600" rows="2"></textarea><label>Resposta</label><textarea class="etext" id="cda-${k}" maxlength="1200" rows="2"></textarea><button class="btn primary" type="button">Salvar cartão</button></div>`);
    const [qa,aa]=f.querySelectorAll("textarea");qa.value=cdNew[k].q;aa.value=cdNew[k].a;qa.oninput=()=>cdNew[k].q=qa.value;aa.oninput=()=>cdNew[k].a=aa.value;
    f.querySelector("button").onclick=()=>{if(!qa.value.trim()||!aa.value.trim())return;cdAdd(k,qa.value,aa.value,"eu");cdNew[k]=null;render()};w.appendChild(f)}
  return w}
let nMsgCards="";
/* sessão de revisão dos cartões */

function nCardsCard(){const c=nCardsCard0();c.querySelector(".dhead").appendChild(helpBtn("Caderno"));
  return c}
/* cobertura: temas estudados sem nenhuma anotação */
const noNoteKeys=()=>[...ALL,...FAC_ITEMS].filter(i=>get(i.key).last&&!(notes[i.key]||"").trim()).map(i=>i.key);
