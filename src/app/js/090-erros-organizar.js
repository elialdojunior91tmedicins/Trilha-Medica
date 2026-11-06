/* ===== Lote 21 item 6 (Proposta B): o app organiza o erro sozinho — regra, dados decisivos, raciocínio e por que não a sua =====
   Função pura a partir de e.q (questão inteira guardada). O Claude continua como melhoria opcional (src "claude"); o que o usuário corrige é src "eu". */
const EO_AGE=/\b(\d{1,3})\s*(anos|meses|dias)\b(?!\s*(?:de\s+)?(?:evolu|hist|tratament|uso|diagn))/i,EO_VIT=/\b(PA|press[ãa]o arterial|FC|frequ[êe]ncia card[ií]aca|FR|frequ[êe]ncia respirat|temperatura|SatO2|satura[çc][ãa]o)\b/i;
const EO_UNIT=/\d[\d.,]*\s*(?:mg|g\/d?l|mm³|mm3|c[ée]lulas|%|ng|mcg|µg|ui|u\/l|ml\/min|ml|mmhg|°c|cm|kg|mmol|meq|x\s*10|mil\b|cópias|log)/i;
const EO_SYM=/\b(cefaleia|dor|febre|tosse|dispneia|sangramento|v[ôo]mito|diarreia|perda|altera[çc][ãa]o|les[ãa]o|les[õo]es|placas?|massa|n[óo]dulo|adenopatia|edema|icter[íi]cia|convuls|confus|sonol|fraqueza|emagrec|sudorese|aumento|redu[çc][ãa]o|piora|recrudesc)/i;
const EO_NEG=/\b(sem|n[ãa]o|nega|aus[êe]ncia|negativ[oa]s?|normal|normais|indetect[áa]vel)\b/i;
function eoClean(t){return cmTidy(String(t||"")).replace(/^(?:Gabarito:?\s*[A-E]\)?[^.]*?(?:Por que está correta:|$))/i,"").replace(/^\s*(?:Por que (?:est[áa] )?corret[ao]:?|Correta[.:]?)\s*/i,"").replace(/\s+/g," ").trim()}
/* a justificativa da certa no comentário (sem os trechos das outras alternativas) */
function eoJust(Q){const cm=String(Q.cm||"");if(!cm)return "";let t=cm;const m=/Por que (?:est[áa] )?corret[ao]:?\s*([\s\S]*?)(?=Alternativa\s+[A-E]\b|Letra\s+[A-E]\b|$)/i.exec(cm);if(m)t=m[1];else t=t.split(/Alternativa\s+[A-E]\b|Letra\s+[A-E]\b/)[0];
  const S=clSents(eoClean(t)).filter(x=>!/^[A-E]\)/.test(x)&&x.length>12);return S.slice(0,2).join(" ")}
function eoNot(Q){const mi=Q.a.find(a=>a.l===Q.m);if(!mi||Q.m===Q.c)return "";if(mi.p)return eoClean(mi.p);
  const re=new RegExp(`(?:Alternativa|Letra)\\s+${Q.m}\\b[^:]*:\\s*([\\s\\S]*?)(?=(?:Alternativa|Letra)\\s+[A-E]\\b|$)`,"i"),m=re.exec(String(Q.cm||""));return m?eoClean(m[1]):""}
/* dados decisivos: trechos curtos do caso; valoriza exames, valores com unidade e negações ligadas ao que decide; descarta idade e sinais vitais que o comentário não usa */
function eoData(Q,ref){const S=clSents(Q.e).filter(x=>!(/\?$/.test(x)||/\b(assinale|marque|qual (?:[ée]|a|o|das|dos)|indique|aponte)\b/i.test(x)));if(!S.length)return [];
  const r=Q.a.find(a=>a.l===Q.c),K=clWords([r&&r.t,ref,Q.cm,Q.co].join(" ")),Wrong=new Set();Q.a.filter(a=>a.l!==Q.c).forEach(a=>clWords(a.t).forEach(w=>Wrong.add(w)));
  const usesAge=/\b(idade|idos[oa]|crian[çc]a|lactente|adolescente|jovem)\b/i.test([ref,Q.cm].join(" ")),usesVit=EO_VIT.test([ref,Q.cm].join(" "));
  const score=c=>{const ws=clWords(c);let v=0,hit=0;ws.forEach(w=>{if(K.has(w)&&!Wrong.has(w)){v+=1.6;hit++}else if(K.has(w))v+=.6});
    if(EO_UNIT.test(c))v+=1.3;else if(/\d/.test(c))v+=.5;if(CL_EXAM.test(c))v+=.9;if(EO_NEG.test(c)&&(hit||CL_EXAM.test(c)||EO_UNIT.test(c)))v+=.8;
    if(EO_SYM.test(c))v+=.6;if(EO_AGE.test(c)&&!usesAge&&ws.size<=6)v-=1.8;if(EO_VIT.test(c)&&!usesVit&&!hit)v-=1.2;if(/\b(é atendid|comparece|procura|é levad|é admitid|chega|realiza acompanhamento|questiona)\b/i.test(c)&&!hit)v-=1;return v/Math.max(1,Math.sqrt(ws.size/4))};
  /* corta o trecho em pedaços curtos (vírgula, ponto e vírgula, "com", "e", parênteses) e fica com o melhor de cada frase longa */
  const tidy=c=>c.trim().replace(/[.;:]+$/,"").replace(/^(?:e|mas|porém|além disso|ao exame físico,?|seu exame de|seus exames de|cujo resultado|cujo exame d[oa] \w+ mostrou:?|que resulta|apresenta(?:-se)?(?: com)?|ele está|ela está|está|foi|com)\s+/i,"").replace(/^(?:a|o)\s+(?:médic[oa]|equipe|paciente|enfermeir[oa])\s+(?:nota que|opta pela indicação de|retorna referindo|realiza)\s+/i,"").replace(/(?:^|\s)(?:é|foi)\s+(?:levad[oa]|trazid[oa]|admitid[oa]|atendid[oa])\b.*?\s(?:devido ao aparecimento de|devido a|por|com)\s+/i," ").replace(/^vivendo com HIV\s*/i,"").trim().replace(/^(?:um|uma)\s+(?:homem|mulher|paciente|menino|menina)\s+de\s+\d+\s+anos,?\s*/i,"").replace(/^vivendo com HIV,?\s*/i,"").replace(/^(?:é|foi)\s+(?:levad[oa]|trazid[oa]|admitid[oa]|atendid[oa])\b.*?\s(?:com|por)\s+/i,"").trim();
  const ONLY_T=/^(?:há|após|depois de|duas|três|quatro|\d+)\s+(?:semanas?|dias?|meses|anos|horas?)(?:\s+depois)?$/i;
  const C=[];S.forEach((x,si)=>{let neg=false;x.replace(/\b[\wÀ-ú ]{0,40}\b(?:mostrou|revelou|evidenciou|demonstrou)\s*:\s*/gi,"").split(/;\s+|,\s+|\.\s+|:\s+/).forEach(c=>{const was=neg;if(/\b(nega|sem)\b/i.test(c))neg=true;else if(c.split(/\s+/).length>3)neg=false;c=tidy(c);if(c.length<4||ONLY_T.test(c))return;if(was&&c.split(/\s+/).length<=2&&!/\b(nega|sem|n[ãa]o)\b/i.test(c))c="sem "+c;
    const parts=c.length>70?c.split(/\s+(?:com|e|mas|após|apesar de)\s+|\s*\(\s*|\s*\)\s*/).map(tidy).filter(z=>z.length>=4):[c];
    parts.forEach(z=>{const v=score(z);if(v>=1)C.push({c:z.replace(/[()]/g,"").trim(),v,o:C.length,si})})})});
  const seen=new Set(),pick=[];C.sort((a,b)=>b.v-a.v||a.o-b.o).forEach(x=>{const k=norm(x.c);if(pick.length>=6||[...seen].some(y=>y===k||y.includes(k)&&k.length>12||k.includes(y)&&y.length>12))return;seen.add(k);pick.push(x)});
  /* junta trechos vizinhos da mesma frase ("Hb 7,1 g/dL, ferritina 4 ng/mL") */
  pick.sort((a,b)=>a.o-b.o);const out=[];pick.forEach(x=>{const L=out[out.length-1];if(L&&L.si===x.si&&x.o-L.o<=2&&(L.c+", "+x.c).length<=90){L.c+=", "+(/^[A-ZÀ-Ú][a-zà-ú]/.test(x.c)?x.c.replace(/^\w/,c=>c.toLowerCase()):x.c);L.o=x.o;L.v+=x.v}else out.push({...x})});
  return out.sort((a,b)=>b.v-a.v).slice(0,4).sort((a,b)=>a.o-b.o).map(x=>clCut(x.c.replace(/^\w/,ch=>ch.toUpperCase()),90))}
function eOrg(e){const Q=e&&e.q&&Array.isArray(e.q.a)?e.q:null;if(!Q||!Q.c)return null;const right=Q.a.find(a=>a.l===Q.c);if(!right)return null;const P=cdErrParse(e);
  const just=eoJust(Q),pc=eoClean(e.pc||""),co=eoClean(Q.co||"");let regra=pc||co||clSents(just)[0]||eoClean(P.concept||"");regra=clSents(regra).slice(0,2).join(" ");if(regra.length>260)regra=clCut(regra,250);regra=regra.replace(/^\w/,c=>c.toUpperCase());
  const dados=eoData(Q,[regra,just].join(" ")),naoSua=eoNot(Q)||eoClean(P.why||""),passos=[];
  if(dados.length)passos.push(`No caso: ${dados.map(d=>`**${d}**`).join(" · ")}.`);
  const j=just&&!qSameTxt(clSents(just)[0],regra)?clSents(just)[0]:"";if(j)passos.push(j.replace(/\.?$/,"."));
  passos.push(`Logo: **${clCut(right.t,160)}** ✓`);
  return {regra,dados,passos,naoSua,src:"app",at:today()}}
/* alternativa marcada parecida com a certa → sugere "Confundi" */
function qLike(a,b){const A=clWords(a),B=clWords(b);if(!A.size||!B.size)return false;let n=0;A.forEach(w=>{if(B.has(w))n++});return n/Math.min(A.size,B.size)>=.4||n>=2}
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
/* rascunho a partir de uma questão respondida, montado pelo app (sem o Claude) */
function qDraft(q,mine,src){const Q=qSplit(q),m=Q.alternativas.find(a=>a.letra===mine),r=Q.alternativas.find(a=>a.letra===Q.correta);
  const w=m&&r?`Marquei ${clCut(m.texto,90)}; a certa era ${clCut(r.texto,90)}`:r?`A certa era ${clCut(r.texto,110)}`:"";
  const why=clSents(Q.comentario).slice(0,2).join(" "),parts=[];
  const co=(Q.conceito||cmTidy(Q.th||"")).trim();if(co)parts.push(co);
  if(why&&!(co&&norm(why).includes(norm(co).slice(0,40))))parts.push(clCut(why,320)+(why.length>320?"":"."));
  if(!parts.length&&r)parts.push(`Correta: ${r.texto}`);
  if(m&&m.porque&&m.letra!==Q.correta){const pq=clCut(m.porque,240)+".",mt=norm(m.texto).slice(0,18);parts.push(mt&&norm(pq).startsWith(mt)?`Por que não a minha: ${pq}`:`Por que não ${clCut(m.texto,60)}: ${pq}`)}
  return {w,p:qClueRich(Q),dd:qData(Q),pc:cmTidy(Q.pc||"").slice(0,1200),r:parts.join("\n").replace(/\.\.$/,".").trim(),t:m&&r&&m.letra!==r.letra&&qLike(m.texto,r.texto)?"confusao":"conhecimento",s:src||"",
    qf:{e:Q.enunciado.slice(0,8000),a:Q.alternativas.map(a=>({l:a.letra,t:a.texto.slice(0,2000),...(a.porque?{p:cmTidy(a.porque).slice(0,1200)}:{})})),c:Q.correta||"",m:mine||"",cm:cmTidy(Q.comentario||"").slice(0,4000),co:(Q.conceito||cmTidy(Q.pc||"")||cmTidy(Q.th||"")).trim().slice(0,600)},
    q:{e:Q.enunciado,m:m?m.texto:"",c:r?r.texto:"",cm:Q.comentario,co:Q.conceito||"",pq:m&&m.porque||""}}}
/* "Resumir com o Claude" (opcional): reescreve o rascunho curto, com a pista e o conceito */
function eSumPrompt(D){const x=D.q||{};return `Você ajuda um estudante de medicina a montar o caderno de erros. A partir da questão abaixo, escreva em português do Brasil, curto e direto:
- "errei": 1 frase, no formato "Marquei <o que marquei>; a certa era <a certa>" (só o essencial de cada alternativa).
- "pista": a frase ou o dado do enunciado que deveria ter levado à resposta certa (copie do enunciado, até 200 caracteres).
- "conceito": 1 a 3 frases: a regra que faz a certa estar certa e por que a marcada não serve neste caso. Nada de inventar dado que não está na questão ou no comentário.
Responda só com JSON: {"errei":"...","pista":"...","conceito":"..."}

ENUNCIADO: ${String(x.e||"").slice(0,3000)}
MARQUEI: ${x.m||"(não respondi)"}
CORRETA: ${x.c||""}
${x.cm?`COMENTÁRIO: ${String(x.cm).slice(0,2500)}\n`:""}${x.co?`CONCEITO-CHAVE: ${x.co}\n`:""}${x.pq?`POR QUE A MARCADA ESTÁ ERRADA: ${x.pq}\n`:""}`}
async function eSumRun(D){if(!sampleFn||!D.q)return;D.sum={st:"loading",ctl:new AbortController()};render();const S=D.sum;
  try{const r=await sampleFn.json(eSumPrompt(D),{signal:S.ctl.signal,cache:false,title:"Resumir o erro",hint:"Cole aqui a resposta do Claude (o JSON com errei, pista e conceito)."});if(D.sum!==S)return;
    const o=r&&typeof r==="object"?r:{},t=v=>typeof v==="string"?v.trim():"";
    if(!t(o.errei)&&!t(o.conceito)){S.st="error";S.msg="O Claude não devolveu o resumo num formato que o app reconheça. Tente de novo."}
    else{S.prev={w:D.w,p:D.p,r:D.r};if(t(o.errei))D.w=t(o.errei).slice(0,2000);if(t(o.pista))D.p=t(o.pista).slice(0,600);if(t(o.conceito))D.r=t(o.conceito).slice(0,2000);S.st="done"}}
  catch(e){if(D.sum!==S)return;const code=e&&e.code;if(code==="cancelled"){delete D.sum;render();return}S.st="error";S.msg=GEN_OFF.includes(code)?"O Claude não está disponível nesta visualização.":(GEN_ERR[code]||"Não foi possível resumir agora.")}
  render()}
/* formulário de erro reaproveitável (registro na aba, simulado, refazer) */
function errFormEl(D,pre,onSave,ids){const I={w:pre+"w",r:pre+"r",t:pre+"t",s:pre+"s",c:pre+"c",p:pre+"p",d:pre+"d",k:pre+"k",...(ids||{})};
  const f=el(`<form class="eform"><label for="${I.w}">O que eu errei</label><textarea id="${I.w}" maxlength="2000" rows="3" placeholder="Ex.: marquei betabloqueador na cocaína"></textarea>
    <label for="${I.p}">Pista do caso <span class="opt">(opcional)</span></label><textarea id="${I.p}" maxlength="600" rows="2" placeholder="O dado do enunciado que deveria ter levado à resposta. Ex.: massa mediastinal em adolescente com hiperleucocitose. Use **negrito** no que decide."></textarea>
    <label for="${I.d}">Dados decisivos <span class="opt">(opcional)</span></label><textarea id="${I.d}" maxlength="400" rows="2" placeholder="Ex.: filha de pais primos · plaquetas 280 mil · sem agregação com ADP"></textarea>
    <label for="${I.r}">Conceito correto / o que lembrar</label><textarea id="${I.r}" maxlength="2000" rows="3" placeholder="Ex.: na dor torácica por cocaína, evitar betabloqueador; usar benzodiazepínico e nitrato"></textarea>
    <label for="${I.k}">Ponto-chave <span class="opt">(opcional)</span></label><textarea id="${I.k}" maxlength="1200" rows="2" placeholder="A regra que decide a questão. Ex.: coagulograma normal não descarta von Willebrand"></textarea>
    <div class="erow2"><div class="eform"><label for="${I.t}">Tipo de erro</label><select id="${I.t}">${Object.entries(ETYPES).map(([k,v])=>`<option value="${k}">${v}</option>`).join("")}</select></div>
    <div class="eform"><label for="${I.c}">Por que errei (opcional)</label><select id="${I.c}"></select></div></div>
    <div class="eform"><label for="${I.s}">Fonte (opcional)</label><input class="etext" id="${I.s}" maxlength="120" placeholder="Ex.: ENARE 2024, Q35"></div>
    <button class="btn primary" type="submit" style="align-self:flex-start">Salvar no caderno</button></form>`);
  const fw=f.querySelector(`[id="${I.w}"]`),fr=f.querySelector(`[id="${I.r}"]`),ft=f.querySelector(`[id="${I.t}"]`),fc=f.querySelector(`[id="${I.c}"]`),fs=f.querySelector(`[id="${I.s}"]`),fp=f.querySelector(`[id="${I.p}"]`),fd=f.querySelector(`[id="${I.d}"]`),fk=f.querySelector(`[id="${I.k}"]`);
  fd.value=D.dd||"";fk.value=D.pc||"";fd.oninput=()=>D.dd=fd.value;fk.oninput=()=>D.pc=fk.value;
  const fillC=()=>{fc.innerHTML="";[["","—"],...(ECAUSES[ft.value]||[]).map(c=>[c,c])].forEach(([v,t])=>{const o=document.createElement("option");o.value=v;o.textContent=t;fc.appendChild(o)});fc.value=(ECAUSES[ft.value]||[]).includes(D.c)?D.c:"";D.c=fc.value};
  fw.value=D.w||"";fr.value=D.r||"";ft.value=ETYPES[D.t]?D.t:"conhecimento";fs.value=D.s||"";fp.value=D.p||"";fp.oninput=()=>D.p=fp.value;fillC();
  {const fit=t=>{if(!t.isConnected)return;t.style.height="auto";t.style.height=Math.min(t.scrollHeight+2,320)+"px"};[fw,fp,fd,fr,fk].forEach(t=>{t.addEventListener("input",()=>fit(t));requestAnimationFrame(()=>fit(t))})}
  fw.oninput=()=>D.w=fw.value;fr.oninput=()=>D.r=fr.value;ft.onchange=()=>{D.t=ft.value;fillC()};fc.onchange=()=>D.c=fc.value;fs.oninput=()=>D.s=fs.value;
  if(D.msg){const p=el(`<p class="err"></p>`);p.textContent=D.msg;f.appendChild(p)}
  f.addEventListener("submit",ev=>{ev.preventDefault();
    if(!(D.w||"").trim()||!(D.r||"").trim()){D.msg="Preencha o que você errou e o conceito correto para salvar.";render();return}
    D.msg="";onSave(eNew(D.k,D.w,D.r,ft.value,D.s,fc.value,D.p,{pc:D.pc,dd:D.dd,qf:D.qf}))});
  return f}
/* "Levar para o caderno" dentro do simulado e do refazer */
function eCadEl(H,idx,k,q,mine,src){const st=H[idx],w=el(`<div class="ecad"></div>`);
  if(st&&st.saved){w.appendChild(el(`<p class="pnote" role="status">No caderno de erros. Ele volta para você revisar amanhã.${st.rd?" Saiu do Refazer: a partir de agora esta questão é revisada só no caderno.":""}</p>`));return w}
  if(!st){const b=el(`<button class="btn" type="button">Levar para o caderno de erros</button>`);b.onclick=()=>{H[idx]={...qDraft(q,mine,src),k};render();setTimeout(()=>{const f=$("#ecq-r");if(f)f.focus()},30)};w.classList.add("bare");w.appendChild(b);return w}
  w.appendChild(el(`<span class="glabel">Levar para o caderno de erros</span>`));
  w.appendChild(el(`<p class="how">O app já resumiu a questão. Ajuste com as suas palavras: é isso que você vai revisar.</p>`));
  if(st.q&&!sampleOff){const S=st.sum,bx=el(`<div class="esum"></div>`);
    if(S&&S.st==="loading"){bx.appendChild(el(`<p class="gstatus">Resumindo com o Claude…</p>`));const x=el(`<button class="link" type="button">Cancelar</button>`);x.onclick=()=>S.ctl.abort();bx.appendChild(x)}
    else{const b=el(`<button class="btn" type="button" id="ecqSum">✦ Resumir com o Claude</button>`);b.disabled=!sampleFn;b.onclick=()=>eSumRun(st);bx.appendChild(b);
      if(S&&S.st==="done"){bx.appendChild(el(`<span class="pnote" role="status">Resumido pelo Claude.</span>`));const u=el(`<button class="link" type="button" id="ecqSumUndo">Voltar ao do app</button>`);u.onclick=()=>{Object.assign(st,S.prev);delete st.sum;render()};bx.appendChild(u)}
      if(S&&S.st==="error"){const e=el(`<span class="err"></span>`);e.textContent=S.msg;bx.appendChild(e)}
      else if(!S)bx.appendChild(el(`<span class="how">Opcional. ${window.__site?"No site, você copia o pedido, cola no Claude e traz a resposta.":"Reescreve mais curto, com a pista e o conceito."}</span>`))}
    w.appendChild(bx)}
  w.appendChild(errFormEl(st,"ecq-",()=>{H[idx]={saved:true,rd:rdForget(k,q)};render()}));
  const c=el(`<button class="link" type="button">Cancelar</button>`);c.onclick=()=>{delete H[idx];render()};w.appendChild(c);return w}
/* ----- registro rápido na própria aba ----- */
function eRegPanel(){const R=eReg,w=el(`<div class="qreg" id="eReg"><div class="dhead"><b>Registrar erro</b><button class="link" type="button">Fechar</button></div></div>`);
  w.querySelector(".dhead .link").onclick=()=>{eReg=null;render()};
  if(R.saved){const m=el(`<p class="pnote" role="status"></p>`);m.textContent=`Salvo no caderno (${BYKEY[R.saved]?BYKEY[R.saved].t:""}). Ele volta para revisão amanhã. Pode registrar outro.`;w.appendChild(m)}
  const it=R.k&&BYKEY[R.k];
  if(!it){const s=el(`<label class="qfsel"><span>Tema</span><input class="search" id="erq" type="search" placeholder="Digite o tema (ex.: sepse, IAM, pré-eclâmpsia)" autocomplete="off"></label>`),i=s.querySelector("input");i.value=R.query||"";
    i.oninput=debounced(()=>{if(eReg!==R||R.k)return;R.query=i.value;render()});w.appendChild(s);
    const n=norm((R.query||"").trim());if(n.length>=2){const res=[...ALL,...FAC_ITEMS].map(x=>{const t=norm(x.t),sub=norm(subList(x).map(y=>y.t).join(" ")+" "+(x.sp||""));return {x,sc:t.startsWith(n)?3:t.includes(n)?2:sub.includes(n)?1:0}}).filter(r=>r.sc).sort((a,b)=>b.sc-a.sc||a.x.num-b.x.num).slice(0,7);
      const ul=el(`<ul class="qrres"></ul>`);if(!res.length)ul.appendChild(el(`<li class="how">Nenhum tema com esse nome.</li>`));
      res.forEach(({x})=>{const li=el(`<li><button type="button" class="qrpick"><b></b><span></span></button></li>`);li.querySelector("b").textContent=x.t;li.querySelector("span").textContent=`${x.own?"FAC":x.area.code} · ${x.sp||x.area.name}`;li.querySelector("button").onclick=()=>{R.k=x.key;render();setTimeout(()=>{const f=$("#erg-w");if(f)f.focus()},30)};ul.appendChild(li)});w.appendChild(ul)}
    else w.appendChild(el(`<p class="how hx">Errou uma questão fora do app (banco, prova antiga, aula)? Escolha o tema e anote o erro e o conceito certo.</p>`));return w}
  const ch=el(`<p class="qrsel"><b></b><span></span><button class="link" type="button">trocar tema</button></p>`);ch.querySelector("b").textContent=it.t;ch.querySelector("span").textContent=` · ${it.own?"FAC":it.area.code} · ${it.sp||it.area.name}`;
  ch.querySelector("button").onclick=()=>{R.k=null;render()};w.appendChild(ch);
  w.appendChild(errFormEl(R,"erg-",e=>{eReg={k:e.k,t:e.t,s:e.s,w:"",r:"",saved:e.k};render()}));return w}
/* ----- revisão ativa: esconde o correto, você tenta lembrar ----- */
/* tela inteira na revisão (só faz diferença nas telas em duas colunas); a escolha fica salva */
let erFull=false;try{erFull=localStorage.getItem("resid-erfull")==="1"}catch(x){}
function erFullSet(v){erFull=v;try{localStorage.setItem("resid-erfull",v?"1":"0")}catch(x){}render();const h=$("#erh");if(h)h.scrollIntoView({block:"start"})}
document.addEventListener("keydown",ev=>{if(view!=="erros"||!erRun)return;const t=ev.target;if(t&&/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)||ev.metaKey||ev.ctrlKey||ev.altKey)return;
  const b=id=>{const x=$(id);if(x){ev.preventDefault();x.click();return true}};
  if(ev.key===" "||ev.key==="Enter"){if(b("#erShow"))return}
  if(ev.key==="1"){b("#erBad");return}if(ev.key==="2"){b("#erPart");return}if(ev.key==="3"){b("#erGood");return}
  if(ev.key==="Escape"){ev.preventDefault();if(erFull&&document.documentElement.dataset.cols==="2")erFullSet(false);else{erRun=null;render()}}});
/* tela inteira também nos cartões (Anotações) e no simulado (Questões); cada um lembra a própria escolha */
const FULLK={cd:"resid-cdfull",sim:"resid-simfull",fo:"resid-fofull",ex:"resid-exfull",rd:"resid-rdfull"},fullOn={cd:false,sim:false,fo:false,ex:false,rd:false};
try{for(const k in FULLK)fullOn[k]=localStorage.getItem(FULLK[k])==="1"}catch(x){}
const twoCols=()=>{const R=document.documentElement.dataset;return R.cols==="2"&&(R.layout==="desktop"||R.layout==="tablet")};
function fullSet(k,v){fullOn[k]=v;try{localStorage.setItem(FULLK[k],v?"1":"0")}catch(x){}render();const h=$(k==="cd"?"#nch":k==="sim"?"#simh":k==="ex"?"#exh":k==="rd"?"#qrdh":"#foh");if(h)h.scrollIntoView({block:"start"})}
function fullBtn(k){const on=fullOn[k],b=el(`<button class="mini erfullb" type="button"></button>`);b.id=k+"FullB";b.textContent=on?"Sair da tela inteira":"⛶ Tela inteira";b.setAttribute("aria-pressed",on);
  b.title=on?"Volta a mostrar o resto da aba (Esc)":"Esconde o resto da aba e mostra só isto";b.onclick=()=>fullSet(k,!on);return b}
/* esconde tudo da aba menos o cartão (marca os irmãos de cada nível até a aba) */
function applyFull(){document.querySelectorAll(".fullhide,.fullpath,.vfull").forEach(x=>x.classList.remove("fullhide","fullpath","vfull"));
  document.querySelectorAll(".pfullc").forEach(x=>x.classList.remove("pfullc"));document.querySelectorAll(".pfbar").forEach(x=>x.remove());delete document.documentElement.dataset.pfull;
  const ph=isPhoneL();if(!twoCols()&&!ph)return;let v=null,card=null;
  if(view==="notas"&&cdRun&&fullOn.cd){v=$("#viewNotas");card=v&&v.querySelector(".ncards")}
  else if(view==="quest"&&sim&&sim.status!=="error"&&fullOn.sim){v=$("#viewQuest");card=v&&v.querySelector(".qsim")}
  else if(view==="foco"&&foRun&&fullOn.fo){v=$("#viewFoco");card=v&&v.querySelector(".fotimer")}
  else if(view==="quest"&&exRun&&fullOn.ex){v=$("#viewQuest");card=v&&v.querySelector(".qexam")}
  else if(view==="quest"&&rdRun&&fullOn.rd){v=$("#viewQuest");card=v&&v.querySelector(".qredo")}
  if(!v||!card)return;
  /* celular (B3): o cartão ocupa a tela inteira, em pé ou deitado, com ≡ Menu e Sair no topo */
  if(ph){const k=view==="notas"?"cd":view==="foco"?"fo":card.classList.contains("qsim")?"sim":card.classList.contains("qexam")?"ex":"rd";card.classList.add("pfullc");document.documentElement.dataset.pfull=k;
    const h=card.querySelector("h2"),bar=el(`<div class="bkfbar pfbar"><button class="bkfb" type="button" id="pfMenu" aria-label="Abrir o menu do app"><span aria-hidden="true">≡</span> Menu</button><div class="bkft"><h2></h2></div><button class="bkfb" type="button" id="pfExit" aria-label="Sair da tela inteira">Sair <span aria-hidden="true">✕</span></button></div>`);
    bar.querySelector("h2").textContent=h?h.textContent:"";bar.querySelector("#pfMenu").onclick=()=>navMenuOpen();bar.querySelector("#pfExit").onclick=()=>fullSet(k,false);card.insertBefore(bar,card.firstChild);return}
  v.classList.add("vfull");let n=card;
  while(n&&n!==v){[...n.parentElement.children].forEach(x=>{if(x!==n)x.classList.add("fullhide")});if(n.parentElement!==v)n.parentElement.classList.add("fullpath");n=n.parentElement}}
document.addEventListener("keydown",ev=>{const t=ev.target;if(t&&/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)||ev.metaKey||ev.ctrlKey||ev.altKey)return;
  const b=sel=>{const x=$(sel);if(x&&!x.disabled&&x.offsetParent!==null){ev.preventDefault();x.click();return true}return false};
  if(view==="notas"&&cdRun){if(ev.key===" "||ev.key==="Enter"){if(b("#cdShow"))return}if(/^[1-4]$/.test(ev.key)){b("#cdR"+ev.key);return}
    if(ev.key==="Escape"&&fullOn.cd&&twoCols()){ev.preventDefault();fullSet("cd",false)}return}
  if(view==="foco"&&foRun){if(ev.key===" "){b("#foPauseB");return}if(ev.key==="d"||ev.key==="D"){b("#foDist");return}
    if(ev.key==="Escape"&&fullOn.fo&&twoCols()){ev.preventDefault();fullSet("fo",false)}return}
  if(view==="quest"&&sim&&sim.status==="run"){const L=ev.key.length===1?ev.key.toUpperCase():"";
    if(/^[A-E]$/.test(L)){const alt=[...document.querySelectorAll(".qsim .alt")].find(x=>!x.disabled&&(x.querySelector("b")||{}).textContent===L+")");if(alt){ev.preventDefault();alt.click()}return}
    if(ev.key===" "||ev.key==="Enter"){b("#simNext");return}
    if(ev.key==="Escape"&&fullOn.sim&&twoCols()){ev.preventDefault();fullSet("sim",false)}return}
  if(view==="quest"&&rdRun&&!sim){const L=ev.key.length===1?ev.key.toUpperCase():"";
    if(/^[A-E]$/.test(L)){const alt=[...document.querySelectorAll(".qredo .alt")].find(x=>!x.disabled&&(x.querySelector("b")||{}).textContent===L+")");if(alt){ev.preventDefault();alt.click()}return}
    if(ev.key===" "||ev.key==="Enter"){b("#rdNext");return}
    if(ev.key==="Escape"&&fullOn.rd&&twoCols()){ev.preventDefault();fullSet("rd",false)}}});
function eRevCard(){const c=eRevCard0();c.querySelector(".dhead").insertBefore(helpBtn("Caderno de erros"),c.querySelector(".dhead .todaydate"));return c}
