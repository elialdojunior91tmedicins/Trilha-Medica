function eRevCard(){const c=eRevCard0();c.querySelector(".dhead").insertBefore(helpBtn("Caderno de erros"),c.querySelector(".dhead .todaydate"));return c}
/* ===== Lote 21 item 6: Revisar erros refeito — a frente pergunta (caso + pergunta, sem resposta), o verso conclui (Certa × Sua, a regra, o raciocínio, por que não a sua) ===== */
const E_ASK=/\?$|\b(assinale|marque|qual (?:[ée]|a|o|das|dos)|indique|aponte)\b/i;
function eAskSplit(t){const S=clSents(t||"");let i=-1;for(let j=S.length-1;j>=0;j--)if(E_ASK.test(S[j])){i=j;break}return i<0?{caso:S.join(" "),ask:""}:{caso:S.filter((_,j)=>j!==i).join(" "),ask:S[i]}}
const eWrote=e=>eOneLine(e.w).replace(/;\s*a certa era .*$/i,"").replace(/^Marquei\s+/i,"Marquei ");
/* questão irmã do próprio acervo: mesmo tema, palavras da mesma regra, nunca a mesma questão nem uma que está no Refazer */
function eSister(e){const ra=e.ra;if(!ra||!ra.regra)return null;const K=clWords(ra.regra),own=norm(String(e.q&&e.q.e||"").slice(0,80)),inRd=new Set(redo.map(x=>norm(String(x.q&&x.q.enunciado||"").slice(0,80))));let best=null;
  exams.forEach(ex=>(ex.qs||[]).forEach(r=>{if(!r||!r.q||(r.k!==e.k&&!(r.ks||[]).includes(e.k)))return;const t=norm(String(r.q.enunciado||"").slice(0,80));if(!t||t===own||inRd.has(t))return;
    const W=clWords([r.q.enunciado,r.q.comentario,r.q.pc].join(" "));let n=0;K.forEach(w=>{if(W.has(w))n++});if(n>=3&&(!best||n>best.n)){const c=(r.q.alternativas||[]).find(a=>a.letra===r.q.correta);if(c)best={n,q:r.q,ans:c.texto,src:ex.name}}}));
  if(!best)return null;const A=eAskSplit(best.q.enunciado);return {e:A.caso,ask:A.ask,ans:best.ans,src:best.src}}
/* texto do caso com os dados decisivos marcados (depois de abrir) */
function eCaseFill(box,text,dados,show){box.textContent="";if(!show||!dados||!dados.length){box.textContent=text;return}
  /* cada dado vira um ou mais trechos do texto: as mesmas palavras, na mesma ordem, aceitando pontuação e parênteses entre elas */
  const R=[],re=x=>x.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  dados.forEach((d,di)=>String(d).replace(/^sem\s+/i,"").split(/,\s+|\s+e\s+(?=\S)/).forEach(f=>{const W=f.split(/[\s()]+/).map(w=>w.replace(/^[^\wÀ-ú0-9]+|[^\wÀ-ú0-9³°%]+$/g,"")).filter(Boolean);if(!W.length||f.length<4)return;
    try{const m=new RegExp(W.map(re).join("[\\s(),:;]{1,4}"),"i").exec(text);if(m)R.push([m.index,m.index+m[0].length,di])}catch(x){}}));
  R.sort((a,b)=>a[0]-b[0]);let p=0;R.forEach(([a,b,di])=>{if(a<p)return;box.append(text.slice(p,a));const m=document.createElement("mark");m.className="erdd";m.textContent=text.slice(a,b);m.dataset.di=di;m.title="Dado decisivo · toque para tirar";box.appendChild(m);p=b});box.append(text.slice(p))}
function eRaSet(e,ch){const r={...(e.ra||{regra:"",dados:[],passos:[],naoSua:""}),...ch,src:"eu",at:today()};e.ra=eRaClean(r)||r;putErr(e);render()}
let erEd=null,eLot=null;
function erEdEl(e){const E=erEd,w=el(`<div class="eredit" id="erEdit"><div class="dhead"><b>Corrigir a organização</b><button class="link" type="button" id="erEdX">Cancelar</button></div><p class="how">O que você corrige fica seu: o app e o Claude não mexem mais sem você aprovar. Use **negrito** no raciocínio.</p></div>`);
  [["regra","A regra",2],["dados","Dados decisivos (um por linha)",3],["passos","O raciocínio (um passo por linha)",4],["naoSua","Por que não a sua",2]].forEach(([k,l,rows])=>{const f=el(`<label class="cdef"><span>${l}</span><textarea rows="${rows}"></textarea></label>`),t=f.querySelector("textarea");t.id="ere-"+k;t.value=E[k];t.oninput=()=>{E[k]=t.value};w.appendChild(f)});
  const B=el(`<div class="btns"><button class="btn primary" type="button" id="erEdOk">Salvar</button></div>`);B.querySelector("button").onclick=()=>{const L=t=>t.split("\n").map(x=>x.trim()).filter(Boolean);eRaSet(e,{regra:E.regra.trim(),dados:L(E.dados),passos:L(E.passos),naoSua:E.naoSua.trim()});erEd=null;render()};w.appendChild(B);
  w.querySelector("#erEdX").onclick=()=>{erEd=null;render()};return w}
/* ✦ Claude: um erro ou um lote; antes × depois para aprovar (no site, copiar e colar em partes de 6) */
function eLotPrompt(L,pi,pn){return `Você organiza ERROS de um estudante de medicina em questões, para revisão espaçada${pn>1?` (parte ${pi+1} de ${pn})`:""}. Para cada erro, escreva:
- "regra": a frase a guardar, curta e direta (até ~30 palavras), a regra que resolve a questão.
- "dados": 2 a 4 trechos CURTOS copiados do caso (palavras do próprio enunciado) que decidem a resposta. Nada de idade ou sinal vital se não decidir.
- "passos": 2 a 4 passos do raciocínio: dado do caso em **negrito** → o que significa → conduta; o último passo começa com "Logo:" e termina com ✓.
- "naoSua": por que a alternativa que ele marcou não serve neste caso (1 ou 2 frases).
- "contraste" (só nos erros do tipo Confundi): {"h":["A","B"],"rows":[{"l":"característica","a":"...","b":"..."}]} com 3 ou 4 linhas comparando as duas coisas confundidas.
- "caso2": um caso NOVO, com dados diferentes, que peça a MESMA regra: {"e":"caso","ask":"pergunta","ans":"resposta certa"}. Nunca copie o caso original mudando só números.
Não invente fatos; siga diretrizes brasileiras quando houver.
Responda apenas com um array JSON, um objeto por erro, levando o mesmo código: [{"codigo":"...","regra":"...","dados":["..."],"passos":["..."],"naoSua":"...","contraste":null,"caso2":{"e":"...","ask":"...","ans":"..."}}]
Escreva em português do Brasil.

${L.map((e,i)=>{const Q=e.q,it=BYKEY[e.k];return `### Erro ${pi*6+i+1} · código ${e.id}
Tema: ${it?it.t:""}. Tipo: ${ETYPES[e.t]||""}${e.t==="confusao"?" (peça o contraste)":""}.
${Q?`Enunciado: ${Q.e.replace(/\s+/g," ").slice(0,2500)}
Alternativas:
${Q.a.map(a=>`${a.l}) ${a.t}${a.l===Q.c?" [CORRETA]":""}${a.l===Q.m&&Q.m!==Q.c?" [MARCADA]":""}${a.p?` — porquê: ${a.p}`:""}`).join("\n")}${Q.cm?`\nComentário: ${Q.cm.slice(0,2000)}`:""}`:`O que ele errou: ${eOneLine(e.w)}\nCorreto: ${eOneLine(e.r)}`}${e.pc?`\nPonto-chave: ${e.pc}`:""}`}).join("\n\n")}`}
async function eLotRun(L){if(!sampleFn||!L.length)return;const parts=[];for(let i=0;i<L.length;i+=6)parts.push(L.slice(i,i+6));const R=eLot={st:"loading",i:0,n:parts.length,res:[],msg:"",ctl:new AbortController()};render();
  try{for(let pi=0;pi<parts.length;pi++){R.i=pi;render();const data=await sampleFn.json(eLotPrompt(parts[pi],pi,parts.length),{signal:R.ctl.signal,cache:false,title:`Organizar erros${parts.length>1?` · parte ${pi+1} de ${parts.length}`:""}`,hint:"Cole aqui a resposta do Claude (o JSON com os erros)."});if(eLot!==R)return;
      const arr=Array.isArray(data)?data:[];parts[pi].forEach((e,j)=>{const c=arr.find(o=>o&&String(o.codigo||"").trim()===e.id)||(arr.length===parts[pi].length&&!arr.some(o=>o&&o.codigo)?arr[j]:null);const ra=c&&eRaClean({...c,src:"claude",at:today()});
        R.res.push(ra&&ra.regra?{id:e.id,ra,ok:true}:{id:e.id,miss:true})})}
    R.st=R.res.some(r=>!r.miss)?"review":"error";if(R.st==="error")R.msg="O Claude não devolveu num formato que o app reconheça. A organização do app continua."}
  catch(x){if(eLot!==R)return;const code=x&&x.code;if(code==="cancelled"){eLot=R.res.some(r=>!r.miss)?(R.st="review",R):null;render();return}R.st=R.res.some(r=>!r.miss)?"review":"error";R.msg=GEN_OFF.includes(code)?"O Claude não está disponível nesta visualização.":(GEN_ERR[code]||"Não foi possível agora.")}
  render()}
function eLotEl(){const R=eLot;if(!R)return null;const w=el(`<div class="cdlot elot" id="eLotBox"></div>`);
  if(R.st==="loading"){w.appendChild(el(`<p class="gstatus">Organizando com o Claude${R.n>1?` · parte ${R.i+1} de ${R.n}`:""}…</p>`));const x=el(`<button class="link" type="button">Parar</button>`);x.onclick=()=>R.ctl.abort();w.appendChild(x);return w}
  if(R.st==="error"){const m=el(`<p class="err"></p>`);m.textContent=R.msg;w.appendChild(m);const x=el(`<button class="link" type="button">Fechar</button>`);x.onclick=()=>{eLot=null;render()};w.appendChild(x);return w}
  w.appendChild(el(`<div class="cdloth"><b>Antes e depois</b><span class="how">Aprove o que ficou melhor. O que você já corrigiu à mão só muda se você aprovar aqui.</span></div>`));const ol=el(`<ol class="cdba"></ol>`);
  const blk=ra=>`<p class="errg"><span>A regra</span>${esc(ra.regra||"—")}</p>${ra.passos&&ra.passos.length?`<ol class="erps">${ra.passos.map(x=>`<li>${mdBold(x)}</li>`).join("")}</ol>`:""}${ra.dados&&ra.dados.length?`<p class="how"><b>Dados:</b> ${ra.dados.map(esc).join(" · ")}</p>`:""}`;
  R.res.forEach((r,i)=>{const e=errors.find(x=>x.id===r.id);if(!e)return;const li=el(`<li class="cdbai"><div class="cdbah"><span class="cdk"></span></div><div class="cdbac"><div><span class="glabel">Antes</span><div class="erbox"></div></div><div><span class="glabel">Depois · Claude</span><div class="erbox aft"></div></div></div></li>`);
    li.querySelector(".cdk").textContent=topicName(e.k);const [b0,b1]=li.querySelectorAll(".erbox");b0.innerHTML=e.ra?blk(e.ra):`<p class="how">Sem organização.</p>`;
    if(r.miss)b1.innerHTML=`<p class="how">O Claude não devolveu este erro.</p>`;else{b1.innerHTML=blk(r.ra)+(r.ra.contraste?`<p class="how">+ quadro de contraste</p>`:"")+(r.ra.caso2?`<p class="how">+ caso novo com a mesma regra</p>`:"");
      const cb=el(`<label class="cdck cdap"><input type="checkbox"> Aprovar</label>`),inp=cb.querySelector("input");inp.id="eAp-"+i;inp.checked=r.ok;inp.onchange=()=>{r.ok=inp.checked;render()};li.querySelector(".cdbah").appendChild(cb)}ol.appendChild(li)});w.appendChild(ol);
  const n=R.res.filter(r=>!r.miss&&r.ok).length,B=el(`<div class="btns"><button class="btn primary" type="button" id="eLotApply"></button><button class="link" type="button" id="eLotCancel">Descartar</button></div>`);
  B.querySelector("#eLotApply").textContent=`Aplicar ${n} ${n===1?"aprovado":"aprovados"}`;B.querySelector("#eLotApply").disabled=!n;B.querySelector("#eLotApply").onclick=()=>{R.res.forEach(r=>{if(r.miss||!r.ok)return;const e=errors.find(x=>x.id===r.id);if(e){e.ra=r.ra;putErr(e)}});eLot=null;render()};
  B.querySelector("#eLotCancel").onclick=()=>{eLot=null;render()};w.appendChild(B);return w}
const eSrcLab={app:"montado pelo app",claude:"organizado pelo Claude",eu:"corrigido por você"};
function eRevCard0(){const due=eDueList(),c=el(`<section class="card erev" aria-labelledby="erh"><div class="dhead"><h2 id="erh">Revisar erros</h2><span class="todaydate"></span></div></section>`);
  if(erRun){const fb=el(`<button class="mini erfullb" type="button" id="erFullB"></button>`);fb.textContent=erFull?"Sair da tela inteira":"⛶ Tela inteira";fb.setAttribute("aria-pressed",erFull);fb.title=erFull?"Volta a mostrar a lista ao lado (Esc)":"Esconde a lista e mostra só a revisão";fb.onclick=()=>erFullSet(!erFull);c.querySelector(".dhead").appendChild(fb)}
  c.querySelector(".todaydate").textContent=`${due.length} para hoje · ${errors.filter(e=>!e.arch).length} no caderno`;
  {const lt=eLotEl();if(lt)c.appendChild(lt)}
  if(erRun){const R=erRun,e=errors.find(y=>y.id===R.ids[R.i]);R.res=R.res||[];
    if(!e||R.i>=R.ids.length){/* 6A.4: as regras de hoje */
      c.appendChild(el(`<p class="verdict ok">Fim: ${R.res.filter(x=>x.g===2).length} de ${R.done} acertados${R.res.some(x=>x.g===1)?`, ${R.res.filter(x=>x.g===1).length} em parte`:""}.</p>`));
      const L=[...R.res].sort((a,b)=>a.g-b.g).map(x=>({e:errors.find(y=>y.id===x.id),g:x.g})).filter(x=>x.e);
      if(L.length){const w=el(`<div class="ertoday" id="erToday"><span class="glabel">As regras de hoje</span><ul></ul></div>`),ul=w.querySelector("ul");L.forEach(x=>{const li=el(`<li class="g${x.g}"><b></b><span></span></li>`);li.querySelector("b").textContent=topicName(x.e.k);li.querySelector("span").textContent=(x.e.ra&&x.e.ra.regra)||cdErrParse(x.e).concept||eOneLine(x.e.r);ul.appendChild(li)});c.appendChild(w)}
      c.appendChild(el(`<p class="how">Errei volta amanhã; Em parte, na metade do prazo do Acertei (mín. 2 dias); Acertei sobe para o próximo intervalo (3, 7, 15 e 30 dias).</p>`));
      const b=el(`<button class="btn primary" type="button">Fechar</button>`);b.onclick=()=>{erRun=null;render()};c.appendChild(b);return c}
    const it=BYKEY[e.k],Q=e.q&&Array.isArray(e.q.a)?e.q:null,ra=e.ra||null,show=R.show,n=(e.rev||0)+1;
    const sis=Q&&(e.rev||0)>=2?(ra&&ra.caso2?{...ra.caso2,src:"Claude"}:eSister(e)):null;/* 6A.1: a partir da 3ª revisão, caso novo com a mesma regra */
    const card=el(`<div class="erv2${show?" show":""}"><div class="erprog"><div class="erpb"><i></i></div><span></span></div><div class="erhd"><h3 class="ertema"></h3><p class="ermeta"></p></div><div class="erg"><div class="erl"></div><div class="erside"></div></div></div>`);
    card.querySelector(".erprog i").style.width=`${Math.round(R.i/R.ids.length*100)}%`;card.querySelector(".erprog span").textContent=`${R.i+1} de ${R.ids.length}`;
    const tt=card.querySelector(".ertema");tt.textContent=it?it.t:"";tt.onclick=()=>openTopic(e.k);
    card.querySelector(".ermeta").textContent=[e.s||"",`errou em ${br(e.d)}`,`${n}ª revisão`,ETYPES[e.t]||""].filter(Boolean).join(" · ");
    const L=card.querySelector(".erl"),Rt=card.querySelector(".erside");
    if(Q){const A=sis||eAskSplit(Q.e),cs=el(`<div class="ercaso"><p class="ercx"></p><p class="erask"></p></div>`);if(sis)cs.prepend(el(`<span class="ersis">Caso novo com a mesma regra${sis.src?` · ${esc(sis.src)}`:""}</span>`));
      eCaseFill(cs.querySelector(".ercx"),A.caso||A.e,sis?null:ra&&ra.dados,show);cs.querySelector(".erask").textContent=A.ask||"";L.appendChild(cs);
      if(show&&!sis){cs.querySelectorAll("mark.erdd").forEach(m=>{m.onclick=()=>{const d=(ra.dados||[]).filter((_,i)=>String(i)!==m.dataset.di);eRaSet(e,{dados:d})}});
        const mk=el(`<button class="link ermark" type="button" id="erMarkSel">+ Marcar o trecho selecionado como dado decisivo</button>`);mk.onmousedown=ev=>ev.preventDefault();
        mk.onclick=()=>{const t=String(window.getSelection()||"").replace(/\s+/g," ").trim();if(t.length<3||!(Q.e||"").replace(/\s+/g," ").includes(t)){mk.textContent="Selecione um trecho do caso acima e toque de novo";return}eRaSet(e,{dados:[...((ra&&ra.dados)||[]),clCut(t,90)]})};L.appendChild(mk)}}
    else{const w=el(`<div class="ercaso"><p class="erlab">O que você errou</p><p class="ercx"></p></div>`);w.querySelector(".ercx").textContent=eWrote(e);if(ePista(e)){const p=el(`<p class="erpista"><b>Pista:</b> <span></span></p>`);boldFill(p.querySelector("span"),ePista(e));w.appendChild(p)}L.appendChild(w)}
    if(!show){const h=el(`<div class="erhint"><b>Responda de cabeça antes de abrir</b><span></span></div>`);h.querySelector("span").textContent=Q?(sis?"Qual a resposta e qual regra resolve?":"Qual a conduta e por quê?"):"O que seria o certo?";Rt.appendChild(h);
      if(Q&&R.peek){const ol=el(`<ol class="eralts"></ol>`);(sis?[]:Q.a).forEach(a=>{const li=el(`<li><b></b> <span></span></li>`);li.querySelector("b").textContent=a.l+")";li.querySelector("span").textContent=a.t;ol.appendChild(li)});if(ol.children.length){Rt.appendChild(ol);Rt.appendChild(el(`<p class="how">Com as alternativas, a revisão vale no máximo "Em parte".</p>`))}}
      const B=el(`<div class="btns erfront"></div>`),s=el(`<button class="btn primary" type="button" id="erShow">Mostrar a resposta</button>`);s.onclick=()=>{R.show=true;render()};B.appendChild(s);
      if(Q&&!sis&&!R.peek){const p=el(`<button class="btn" type="button" id="erAlts">Ver alternativas</button>`);p.onclick=()=>{R.peek=true;render()};B.appendChild(p)}Rt.appendChild(B)}
    else{/* verso: Certa × Sua (embaixo do caso), a regra, o raciocínio, por que não a sua */
      if(Q){const ri=Q.a.find(a=>a.l===Q.c),mi=Q.a.find(a=>a.l===Q.m),cs=el(`<div class="ercs"><div class="ercok"><span>${sis?"Resposta deste caso":"Certa"}</span><p></p></div>${!sis&&mi&&Q.m!==Q.c?`<div class="ercno"><span>Você marcou na prova</span><p></p></div>`:""}</div>`);
        cs.querySelector(".ercok p").textContent=sis?sis.ans:ri?ri.t:"";if(!sis&&mi&&Q.m!==Q.c)cs.querySelector(".ercno p").textContent=mi.t;L.appendChild(cs)}
      else{const cs=el(`<div class="ercs"><div class="ercok"><span>Correto</span><p class="r"></p></div></div>`);eRFill(cs.querySelector(".r"),e.r);L.appendChild(cs)}
      if(ra&&(ra.regra||ra.passos.length)){const rg=el(`<div class="errg"><span>A regra</span><p></p><small class="ersrc"></small></div>`);rg.querySelector("p").textContent=ra.regra||"";rg.querySelector(".ersrc").textContent=eSrcLab[ra.src]||"";Rt.appendChild(rg);
        if(ra.passos.length){const ps=el(`<div class="erpsw"><span class="glabel">O raciocínio</span><ol class="erps"></ol></div>`),ol=ps.querySelector("ol");ra.passos.forEach(x=>{const li=el(`<li></li>`);boldFill(li,x);ol.appendChild(li)});Rt.appendChild(ps)}
        if(ra.contraste){const T=ra.contraste,tb=el(`<div class="erct"><span class="glabel">O que separa uma da outra</span><table><thead><tr><th></th><th></th><th></th></tr></thead><tbody></tbody></table></div>`),th=tb.querySelectorAll("th");th[1].textContent=T.h[0];th[2].textContent=T.h[1];
          T.rows.forEach(r=>{const tr=el(`<tr><td></td><td></td><td></td></tr>`),td=tr.querySelectorAll("td");td[0].textContent=r.l;td[1].textContent=r.a;td[2].textContent=r.b;tb.querySelector("tbody").appendChild(tr)});Rt.appendChild(tb)}
        const ns=ra.naoSua||cdErrParse(e).why;if(ns&&!sis){const w=el(`<div class="ernao"><span class="glabel">Por que não a sua</span><p></p></div>`);w.querySelector("p").textContent=ns;Rt.appendChild(w)}}
      else if(!Q){const P=cdErrParse(e);if(e.pc){const rg=el(`<div class="errg"><span>A regra</span><p></p></div>`);rg.querySelector("p").textContent=cmTidy(e.pc);Rt.appendChild(rg)}if(P.why){const w=el(`<div class="ernao"><span class="glabel">Por que não a sua</span><p></p></div>`);w.querySelector("p").textContent=P.why;Rt.appendChild(w)}}
      if((e.miss||0)>=1){/* 6A.3: teimoso, na hora */const tm=el(`<p class="erteim" id="erTeim"><b></b> <button class="link" type="button">Reler a anotação</button> · <button class="link" type="button">Criar cartão</button></p>`);tm.querySelector("b").textContent=`${(e.miss||0)+2}ª vez que este erro volta ·`;
        const [rl,cc]=tm.querySelectorAll("button");rl.onclick=()=>{detTab[e.k]="notas";openTopic(e.k)};cc.onclick=()=>{cdErr[e.id]={list:cdErrDrafts(e)};render()};Rt.appendChild(tm)}
      if(Q){const d=el(`<details class="erfullq"><summary>Ver a questão e o comentário completo</summary><p class="eqstem"></p><ol class="eqalts"></ol><p class="erfcm"></p></details>`);d.querySelector(".eqstem").textContent=Q.e;
        Q.a.forEach(a=>{const li=el(`<li><b></b> <span></span></li>`);li.querySelector("b").textContent=a.l+")";li.querySelector("span").textContent=a.t;if(a.l===Q.c)li.classList.add("right");else if(a.l===Q.m)li.classList.add("mine");d.querySelector(".eqalts").appendChild(li)});d.querySelector(".erfcm").textContent=Q.cm||"";Rt.appendChild(d)}
      const T=el(`<div class="ertools"></div>`);
      if(ra){const ed=el(`<button class="mini" type="button" id="erEdB">✎ Corrigir</button>`);ed.onclick=()=>{erEd={id:e.id,regra:ra.regra||"",dados:(ra.dados||[]).join("\n"),passos:(ra.passos||[]).join("\n"),naoSua:ra.naoSua||""};render()};T.appendChild(ed)}
      if(Q&&!sampleOff){const ai=el(`<button class="mini" type="button" id="erAI">✦ Melhorar com o Claude</button>`);ai.disabled=!sampleFn||!!eLot;ai.onclick=()=>eLotRun([e]);T.appendChild(ai)}
      T.appendChild(eCardBtn(e));Rt.appendChild(T);if(cdErr[e.id])Rt.appendChild(cdErrEl(e));if(erEd&&erEd.id===e.id)Rt.appendChild(erEdEl(e))}
    c.appendChild(card);
    /* notas: Errei · Em parte · Acertei, cada uma com quando volta */
    const a=el(`<div class="ernotes"></div>`);
    if(show){const lab=d=>d===1?"amanhã":`em ${d} dias`;[[0,"Errei","erBad"],[1,"Em parte","erPart"],[2,"Acertei","erGood"]].forEach(([g,l,id])=>{const b=el(`<button class="ern ern${g}" type="button"><b></b><span></span></button>`);b.id=id;b.querySelector("b").textContent=l;b.querySelector("span").textContent=`volta ${lab(eNext(e,g))}`;
        if(g===2&&R.peek){b.disabled=true;b.title="Você viu as alternativas: vale no máximo Em parte"}
        b.onclick=()=>{eAnswer(e,g);R.res.push({id:e.id,g});if(g===2)R.ok++;R.done++;R.i++;R.show=false;R.peek=false;erEd=null;render()};a.appendChild(b)});
      if(eBox(e)>=2&&!R.peek){const ar=el(`<button class="link" type="button" id="erArch">Já domino: arquivar</button>`);ar.onclick=()=>{e.rev=(e.rev||0)+1;e.lastRev=today();e.arch=today();putErr(e);R.res.push({id:e.id,g:2});R.ok++;R.done++;R.i++;R.show=false;R.peek=false;render()};a.appendChild(ar)}}
    const st=el(`<button class="link ersend" type="button">Encerrar</button>`);st.onclick=()=>{erRun=null;erEd=null;render()};a.appendChild(st);c.appendChild(a);
    c.appendChild(el(`<p class="how erkeys">Teclado: espaço mostra a resposta · 1 Errei · 2 Em parte · 3 Acertei · Esc sai</p>`));return c}
  if(!due.length){const nx=errors.filter(e=>BYKEY[e.k]&&!e.arch).map(eDue).sort()[0];c.appendChild(el(`<p class="cempty">Nenhum erro para revisar hoje.${nx?` O próximo volta em ${br(nx)}.`:""}</p>`));return c}
  const by={};due.forEach(e=>{const it=BYKEY[e.k],g=it.sp||it.area.name;by[g]=(by[g]||0)+1});
  c.appendChild(el(`<p class="gtext qrdsum">${Object.entries(by).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([g,n])=>`<span><b>${n}</b> ${esc(g)}</span>`).join("")}</p>`));
  const n=Math.min(due.length,15),go=el(`<button class="btn primary" type="button" id="erGo"></button>`);go.textContent=`Revisar ${n} ${n===1?"erro":"erros"} · ≈ ${Math.max(1,Math.round(n*MIN_EST.errs))} min`;
  // os mais atrasados primeiro; dentro do mesmo dia, embaralhados
  go.onclick=()=>{const K=pwKeys();erRun={ids:shuffle(due).sort((a,b)=>pwFirst(K,x=>x.k)(a,b)||(eDue(a)<eDue(b)?-1:eDue(a)>eDue(b)?1:0)).slice(0,15).map(e=>e.id),i:0,show:false,ok:0,done:0,res:[]};render();const h=$("#erh");if(h)h.scrollIntoView({block:"start",behavior:"smooth"})};c.appendChild(go);
  c.appendChild(el(`<p class="how">Cada erro volta como pergunta: responda de cabeça e confira a regra. A questão em si fica no Refazer.</p>`));
  c.appendChild(el(`<p class="how hx">Depois de abrir, dê a nota: Errei volta amanhã; Em parte, na metade do prazo do Acertei (no mínimo 2 dias); Acertei sobe para 3, 7, 15 e 30 dias. Se você abrir as alternativas antes, vale no máximo Em parte. A partir da 3ª revisão, o erro pode voltar com um caso novo que pede a mesma regra.</p>`));
  {const L=errors.filter(e=>BYKEY[e.k]&&!e.arch&&e.q&&(!e.ra||e.ra.src==="app"));if(L.length&&!sampleOff&&!eLot){const b=el(`<button class="link" type="button" id="eLotGo"></button>`);b.textContent=`✦ Melhorar a organização dos ${L.length} com o Claude (opcional)`;b.disabled=!sampleFn;b.onclick=()=>eLotRun(L);c.appendChild(b)}}
  return c}
