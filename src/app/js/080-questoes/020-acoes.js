/* ---- em toda questão respondida (certa ou errada): Levar para a anotação (você marca os pontos) e Criar cartão ---- */
const qActS=new WeakMap();let qActN=0;
const qSt=q=>{let s=qActS.get(q);if(!s){s={id:"qv"+(++qActN)};qActS.set(q,s)}return s};
/* Lote 20C: pontos com contexto, sem letras: Caso (a pista do enunciado) › Resposta (a certa inteira) › Por quê › Por que não <alternativa inteira>;
   Ponto-chave, Conceito e Take home só quando não repetem o que já está marcado */
const qSame=(a,b)=>{const A=clWords(a),B=clWords(b);if(!A.size||!B.size)return false;let n=0;A.forEach(w=>{if(B.has(w))n++});return n/Math.min(A.size,B.size)>=.6};
function qCase(Q){const cl=qClueRich(Q);if(cl)return cl;const ask=clSents(Q.enunciado).filter(x=>/\?$/.test(x)).pop();return ask?clCut(ask,220):""}
function qPoints(q,mine){const Q=qSplit(q),C=Q.correta,r=Q.alternativas.find(a=>a.letra===C),L=[],keep=[];
  const add=(id,lab,t,on)=>{t=String(t||"").trim();if(!t)return;if(keep.some(x=>qSame(x,t)))return;keep.push(t);L.push({id,lab,t,on})};
  add("why","Por quê",clSents(cmTidy(Q.comentario)).slice(0,2).join(" "),true);
  add("pc","Ponto-chave",cmTidy(Q.pc||""),true);add("co","Conceito-chave",(Q.conceito||"").trim(),!Q.pc);add("th","Take home",cmTidy(Q.th||""),false);
  if(q.alerta)L.push({id:"pg",lab:"Pegadinha",t:cmTidy(String(q.alerta).replace(/^\s*(?:Aten[çc][ãa]o|Alerta):?\s*/i,"")),on:false});
  Q.alternativas.filter(a=>a.letra!==C&&a.porque).forEach(a=>add("n"+a.letra,`Por que não ${a.texto.trim().replace(/[.;:]+$/,"")}`,cmTidy(a.porque),a.letra===mine));
  return {head:qCase(Q),ans:r?r.texto.trim():"",L,ask:(clSents(Q.enunciado).filter(x=>/\?$/.test(x)).pop()||"")}}
/* seções da anotação (##/###) e a mais parecida com os pontos marcados */
function noteSecs(k){const out=[];let fen=false;String(notes[k]||"").split("\n").forEach(l=>{if(/^\s*```/.test(l)){fen=!fen;return}if(fen)return;const m=l.match(/^(#{2,3})\s+(.+?)\s*$/);if(m&&!/^conceitos das questões$/i.test(m[2]))out.push(m[2])});return out}
function noteSecSuggest(k,P){const S=noteSecs(k);if(!S.length)return "";const W=clWords([P.ans,...P.L.filter(x=>x.on).map(x=>x.t)].join(" ").replace(/\*\*/g,""));
  const it=BYKEY[k],SUBW=it?subList(it).map(x=>({t:x.t,w:clWords(x.t)})):[];let best="",bv=0;
  S.forEach(s=>{const w=clWords(s);let v=0;w.forEach(x=>{if(W.has(x))v+=2});
    if(/diagn[oó]st|exame|achado/i.test(s)&&[...W].some(x=>/diagn|exam|labor|tomogr|ecg|sorolog|bi[oó]ps/.test(x)))v+=1.5;
    if(/tratament|conduta|manejo|terap/i.test(s)&&[...W].some(x=>/trat|condut|dose|terap|prescr|indic/.test(x)))v+=1.5;
    if(/pegadinha|alerta|cuidado|armadilha/i.test(s)&&P.L.some(x=>x.on&&/^Por que não/.test(x.lab)))v+=1;
    SUBW.forEach(sb=>{if(norm(sb.t)===norm(s)){let o=0;sb.w.forEach(x=>{if(W.has(x))o++});v+=o}});if(v>bv){bv=v;best=s}});return bv>=3.5?best:""}
/* acrescenta o bloco "Da questão" na seção escolhida (padrão: "## Conceitos das questões", criada no fim se não existir) */
function conItem(P,o){const sel=P.L.filter(x=>x.on),org=o.tok?" "+o.tok:` _(${o.src||"Questão"} · ${br(today()).slice(0,5)})_`;
  const lines=[];if(P.ans)lines.push(`**Resposta:** ${P.ans}`);
  if(o.ai)String(o.ai).trim().split(/\n+/).map(x=>x.replace(/^\s*[-*•]\s+/,"").trim()).filter(Boolean).forEach(x=>lines.push(x));
  else sel.forEach(x=>lines.push(`**${x.lab}:** ${x.t}`));
  return `- **Da questão:** ${P.head||P.ask||"questão"}${org}`+lines.map(l=>`\n  - ${l}`).join("")}
function conNote(k,P,o){o=o||{};const cur=notes[k]||"",item=conItem(P,o),sec=o.sec||"";let v;
  const find=name=>{const re=new RegExp("^(#{1,3})\\s*"+name.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"\\s*$","mi");return cur.match(re)};
  const m=sec?find(sec):find("Conceitos das questões");
  if(m){const at=m.index+m[0].length,lv=m[1].length,rest=cur.slice(at),nx=rest.search(new RegExp("\\n#{1,"+lv+"}\\s")),end=nx<0?cur.length:at+nx;v=cur.slice(0,end).replace(/\s+$/,"")+"\n"+item+(end<cur.length?"\n"+cur.slice(end):"")}
  else v=(cur.trim()?cur.replace(/\s+$/,"")+"\n\n":"")+"## Conceitos das questões\n"+item;
  replaceNote(k,v)}
/* ✦ Escrever com o Claude: os pontos marcados viram 2–4 frases didáticas, sem repetir */
function conAIPrompt(k,P){const it=BYKEY[k];return `Você escreve anotações de estudo para residência médica, em português do Brasil.
Tema: ${it?it.t:""}.
A partir dos pontos abaixo, tirados de uma questão, escreva de 2 a 4 itens curtos (uma frase cada, começando com "- ") que expliquem a ideia de forma didática, no estilo de um resumo: sem repetir a mesma ideia, sem citar letras de alternativas (A, B, C…), sem "a questão", sem inventar nada que não esteja nos pontos. Use **negrito** só nos termos decisivos. Responda só com os itens.

Caso: ${String(P.head||P.ask).replace(/\*\*/g,"")}
Resposta: ${P.ans}
${P.L.filter(x=>x.on).map(x=>`${x.lab}: ${x.t}`).join("\n")}`}
async function conAIRun(st,k){const P=st.pick;if(!P||!sampleFn)return;P.busy=true;P.err="";render();
  try{const r=await sampleFn(conAIPrompt(k,P),{cache:false,modelTier:"default",title:"Escrever a anotação com o Claude",hint:"Cole aqui os itens que o Claude escreveu."});
    const t=String(r&&r.text||"").trim();if(!t)throw new Error("vazio");P.ai=t}catch(e){P.err=e&&(e.code==="declined"||e.code==="cancelled"||e.name==="AbortError")?"":"Não deu para escrever com o Claude agora. Tente de novo ou insira os pontos marcados."}
  P.busy=false;render()}
/* anotações antigas: troca os rótulos com a letra ("Por que C está certa") e, com selo de prova na íntegra, devolve as alternativas inteiras */
function conFix(){let done=0;try{if(localStorage.getItem("resid-confix")==="1")return 0}catch(x){return 0}
  Object.keys(notes).forEach(k=>{const t=notes[k];if(!t||!/Conceitos das questões/i.test(t))return;let v=t;
    v=v.replace(/^(\s+-\s+)Por que [A-E] está certa:/gm,"$1**Por quê:**");
    v=v.replace(/^-\s+\*\*(.+?)\*\*\s+\{\{q:([A-Za-z0-9_-]+):(\d+)\}\}((?:\n\s+-\s+.*)*)/gm,(all,head,xid,ix,subs)=>{const ex=exams.find(x=>x.id===xid),r=ex&&ex.qs[+ix];if(!r)return all;
      const Q=qSplit(r.q),a=Q.alternativas.find(x=>x.letra===Q.correta);let s2=subs;
      Q.alternativas.forEach(x=>{const cut=clCut(x.texto,60);if(cut!==x.texto&&cut.endsWith("…"))s2=s2.split("Por que não "+cut).join("Por que não "+x.texto.trim().replace(/[.;:]+$/,""))});
      const full=a&&clCut(a.texto,110)===head?a.texto.trim():head;return `- **${full}** {{q:${xid}:${ix}}}${s2}`});
    if(v!==t){notes[k]=v;saveNote(k,v);done++}});
  try{localStorage.setItem("resid-confix","1")}catch(x){}return done}
function qCardDrafts(q,mine,k){const Q=qSplit(q),it=BYKEY[k],L=esc(it?it.t:""),r=Q.alternativas.find(a=>a.letra===Q.correta),m=mine&&mine!==Q.correta?Q.alternativas.find(a=>a.letra===mine):null;
  const ask=(clSents(Q.enunciado).filter(x=>/\?$/.test(x)).pop()||"qual é a resposta?").replace(/^\s*/,""),clue=qData(Q)||qClue(Q),exp=cmTidy(Q.pc||Q.conceito||Q.th||clSents(cmTidy(Q.comentario)).slice(0,2).join(" "));
  const out=[{kind:"disc",q:`<b>${L}.</b> ${clue?esc(clue)+" &rarr; ":""}${esc(clCut(ask,160))}`,a:`<b>${esc(r?r.texto:"")}</b>${exp?`<br><br><i>${esc(exp)}</i>`:""}`,ref:"",keep:true}];
  if(m)out.push({kind:"nao",q:cdNaoQ(L,m.texto,!!clue),a:`<b>${esc(cmTidy(m.porque||"Não se encaixa no caso: veja o conceito."))}</b><br><br><i>A resposta é <b>${esc(r?r.texto:"")}</b>.${exp?" "+esc(exp):""}</i>`,ref:"",keep:true});
  return out}
function qActsEl(q,mine,ctx){const st=qSt(q),k=ctx.k,ok=!!BYKEY[k],w=el(`<div class="qacts"><div class="btns"></div></div>`),B=w.querySelector(".btns");
  const nb=el(`<button class="btn" type="button"></button>`);nb.id="qan-"+st.id;nb.textContent=st.noted?"Na anotação ✓":st.pick?"Fechar":"Levar para a anotação";nb.disabled=!ok||!!st.noted;if(!ok)nb.title="Escolha o tema desta questão primeiro";
  nb.onclick=()=>{if(st.pick)delete st.pick;else{st.pick=qPoints(q,mine);delete cdErr[st.id]}render()};B.appendChild(nb);
  const cb=el(`<button class="btn" type="button"></button>`);cb.id="qac-"+st.id;cb.textContent=st.cards?`${st.cards} ${st.cards===1?"cartão":"cartões"} ✓`:cdErr[st.id]?"Fechar cartões":"Criar cartão";cb.disabled=!ok||!!st.cards;if(!ok)cb.title="Escolha o tema desta questão primeiro";
  const ve=()=>{const Q=qSplit(q),r=Q.alternativas.find(a=>a.letra===Q.correta),m=Q.alternativas.find(a=>a.letra===mine),D=qDraft(q,mine,ctx.src);
    return {id:st.id,virtual:true,okq:mine===Q.correta,k,w:mine===Q.correta?`Acertei: ${r?r.texto:""}`:D.w,p:D.p.replace(/\*\*/g,""),r:[cmTidy(Q.pc||""),D.r].filter(Boolean).join("\n"),t:D.t,c:"",s:ctx.src||"",onSaved:ids=>{st.cards=ids.length}}};
  cb.onclick=()=>{if(cdErr[st.id])delete cdErr[st.id];else{cdErr[st.id]={list:qCardDrafts(q,mine,k)};delete st.pick}render()};B.appendChild(cb);
  if(st.pick){const P=st.pick,pv=el(`<div class="qpick"><span class="glabel">Levar para a anotação · marque o que vai junto</span><ul class="qpl"></ul><div class="btns"></div></div>`),ul=pv.querySelector("ul");
    P.L.forEach((x,i)=>{const li=el(`<li><label><input type="checkbox"> <span><b></b> <span class="qpt"></span></span></label></li>`),c=li.querySelector("input");c.id=`qp-${st.id}-${x.id}`;c.checked=x.on;c.onchange=()=>{x.on=c.checked;render()};
      li.querySelector("b").textContent=x.lab+":";boldFill(li.querySelector(".qpt"),x.t);ul.appendChild(li)});
    if(!P.L.length)ul.appendChild(el(`<li class="how">Esta questão não trouxe explicação para levar.</li>`));
    /* contexto fixo: o caso e a resposta vão sempre */
    {const cx=el(`<div class="qpcx"><p><b>Caso:</b> <span class="qpcase"></span></p><p><b>Resposta:</b> <span class="qpans"></span></p></div>`);boldFill(cx.querySelector(".qpcase"),P.head||P.ask||"—");cx.querySelector(".qpans").textContent=P.ans||"—";ul.before(cx)}
    /* onde entra: seção sugerida pelo conteúdo (ou Conceitos das questões) */
    {const S=noteSecs(k);if(P.sec===undefined)P.sec=noteSecSuggest(k,P);if(S.length){const lb=el(`<label class="qfsel qpsec"><span>Onde entra na anotação</span><select></select></label>`),s=lb.querySelector("select");s.id="qps-"+st.id;
      [["","Conceitos das questões (no fim)"],...S.map(x=>[x,x+(x===noteSecSuggest(k,P)?" · sugerida":"")])].forEach(([v,t])=>{const o=document.createElement("option");o.value=v;o.textContent=t;s.appendChild(o)});s.value=P.sec;s.onchange=()=>{P.sec=s.value};pv.querySelector(".btns").before(lb)}}
    if(P.ai){const ai=el(`<div class="qpai"><span class="glabel">Escrito pelo Claude · confira</span><textarea rows="5"></textarea><button class="link" type="button">Voltar aos pontos marcados</button></div>`),ta=ai.querySelector("textarea");ta.id="qpa-"+st.id;ta.value=P.ai;ta.oninput=()=>{P.ai=ta.value};ai.querySelector("button").onclick=()=>{delete P.ai;render()};pv.querySelector(".btns").before(ai)}
    if(P.err)pv.querySelector(".btns").before(el(`<p class="how">${esc(P.err)}</p>`));
    const n=P.L.filter(x=>x.on).length,go=el(`<button class="btn primary" type="button"></button>`);go.id="qpgo-"+st.id;go.textContent=`Inserir na anotação de ${BYKEY[k]?BYKEY[k].t:""}`;go.disabled=!n&&!P.ai;
    go.onclick=()=>{conNote(k,P,{tok:ctx.tok||"",src:ctx.src||"Questão",sec:P.sec||"",ai:P.ai||""});st.noted=1;delete st.pick;render()};
    if(sampleFn&&!P.ai){const ab=el(`<button class="btn" type="button"></button>`);ab.id="qpai-"+st.id;ab.textContent=P.busy?"Escrevendo…":"✦ Escrever com o Claude";ab.disabled=!!P.busy||!n;ab.onclick=()=>conAIRun(st,k);pv.querySelector(".btns").appendChild(ab)}
    const x=el(`<button class="link" type="button">Cancelar</button>`);x.onclick=()=>{delete st.pick;render()};pv.querySelector(".btns").append(go,x);w.appendChild(pv)}
  if(st.noted){const v=el(`<button class="link" type="button">ver a anotação</button>`);v.onclick=()=>{detTab[k]="notas";noteMode[k]="ler";openTopic(k)};B.appendChild(v)}
  if(cdErr[st.id])w.appendChild(cdErrEl(ve()));
  return w}
