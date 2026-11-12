/* caderno de erros */
const byNewest=(a,b)=>a.d<b.d?1:a.d>b.d?-1:(a.id<b.id?1:-1);
function ecardEl(e,withTopic){
  const it=BYKEY[e.k];
  const c=el(`<li class="ecard" data-eid="${e.id}" data-t="${ETYPES[e.t]?e.t:"conhecimento"}"><div class="ehead"></div><p class="ebody"><b>Errei</b><span class="w"></span></p><p class="ebody epista" hidden><b>Pista do caso</b><span class="p"></span></p><p class="ebody"><b>Correto</b><span class="r"></span></p><div class="efoot"><span class="rv"></span><span class="sp"></span></div></li>`);
  const h=c.querySelector(".ehead");
  if(withTopic&&it){const tb=el(`<button class="etopic" type="button"></button>`);tb.textContent=it.t;tb.onclick=()=>openTopic(e.k);h.appendChild(tb);h.appendChild(el(`<span>${it.area.code}</span>`))}
  h.appendChild(el(`<span class="etype">${ETYPES[e.t]||""}</span>`));h.appendChild(el(`<span>${br(e.d)}</span>`));
  if(e.s){const s=el(`<span></span>`);s.textContent=e.s;h.appendChild(s)}
  if(e.c){const s=el(`<span class="ecause"></span>`);s.textContent=e.c;h.appendChild(s)}
  if(e.arch)c.classList.add("arch");
  c.querySelector(".w").textContent=e.w;eRFill(c.querySelector(".r"),e.r);if(ePista(e)){boldFill(c.querySelector(".p"),ePista(e));c.querySelector(".epista").hidden=false}eExtraBlocks(c,e,true);
  if(e.arch)c.querySelector(".rv").textContent=`Arquivado em ${br(e.arch)}${e.rev?` · revisado ${e.rev}×`:""}`;else{const du=eDue(e),bc=eByCard(e);c.querySelector(".rv").textContent=`${e.fm?`Formado em ${br(e.fm)} (volta se você errar o tema de novo)`:bc?"Revisado pelos cartões":du<=today()?"Revisar hoje":"Próxima revisão "+br(du)}${e.rev?` · revisado ${e.rev}×`:""}${e.miss?` · ainda erraria ${e.miss}×`:""}`;if(du<=today())c.querySelector(".rv").classList.add("due")}
  const ft=c.querySelector(".efoot");
  const rb=eCardBtn(e);
  const db=el(`<button class="mini${delArm===e.id?" warn":""}" type="button">${delArm===e.id?"Confirmar exclusão":"Excluir"}</button>`);
  db.onclick=()=>{if(delArm===e.id){delArm=null;delErr(e.id)}else{delArm=e.id;render()}};
  const ab=el(`<button class="mini" type="button"></button>`);ab.textContent=e.arch?"Desarquivar":"Resolvido";ab.title=e.arch?"Volta para as revisões":"Arquiva: sai das revisões e da lista (fica em Arquivados)";ab.onclick=()=>eArchive(e,!e.arch);
  const mb=el(`<button class="mini emenu" type="button" aria-expanded="${eMenu===e.id}"></button>`);mb.textContent=eMenu===e.id?"Fechar ações":"⋯ Ações";mb.onclick=()=>{eMenu=eMenu===e.id?null:e.id;render()};
  const pb=el(`<button class="mini" type="button"></button>`);pb.id="epg-"+e.id;const pgD=ePegDraft(e),pgIn=pgD.x&&pegOf(e.k).some(o=>norm(o.x)===norm(pgD.x));pb.textContent=pgIn?"Na anotação ✓":"Virar pegadinha";pb.disabled=pgIn||!pgD.x;
  pb.title="Escreve na seção Pegadinhas da anotação do tema (aparece em Caderno › Pegadinhas)";pb.onclick=()=>{pegAdd(e.k,pgD.x,pgD.why);render()};
  if(eMenu===e.id){ft.append(rb);if(e.t==="interpretacao"||e.t==="confusao")ft.append(pb);ft.append(ab,db,mb)}else ft.append(mb);if(cdErr[e.id])c.appendChild(cdErrEl(e));
  return c;
}
function eRaClean(r){if(!r||typeof r!=="object")return null;const S=(v,n)=>typeof v==="string"?v.slice(0,n):"",L=(v,n,m)=>Array.isArray(v)?v.filter(x=>typeof x==="string"&&x.trim()).slice(0,n).map(x=>x.slice(0,m)):[];
  const o={regra:S(r.regra,600),dados:L(r.dados,6,160),passos:L(r.passos,5,500),naoSua:S(r.naoSua,800),src:["app","claude","eu"].includes(r.src)?r.src:"app",at:S(r.at,10)};
  if(r.contraste&&typeof r.contraste==="object"&&Array.isArray(r.contraste.h)&&Array.isArray(r.contraste.rows)){const rows=r.contraste.rows.filter(x=>x&&typeof x==="object").slice(0,6).map(x=>({l:S(x.l,80),a:S(x.a,200),b:S(x.b,200)})).filter(x=>x.a||x.b);if(rows.length)o.contraste={h:[S(r.contraste.h[0],80),S(r.contraste.h[1],80)],rows}}
  if(r.caso2&&typeof r.caso2==="object"&&typeof r.caso2.e==="string"&&r.caso2.e.trim())o.caso2={e:S(r.caso2.e,3000),ask:S(r.caso2.ask,400),ans:S(r.caso2.ans,600)};return o}
function errOk(e){if(!e||typeof e!=="object"||!BYKEY[e.k]||typeof e.id!=="string")return false;if(e.ra!==undefined){const r=eRaClean(e.ra);if(r)e.ra=r;else delete e.ra}for(const f of ["w","r","s"])if(typeof e[f]!=="string")e[f]=String(e[f]??"");if(typeof e.d!=="string")e.d=today();
  for(const f of ["pc","dd"])if(e[f]!=null&&typeof e[f]!=="string")delete e[f];
  if(e.q!=null&&!(e.q&&typeof e.q==="object"&&typeof e.q.e==="string"&&Array.isArray(e.q.a)))delete e.q;return true}
function saveErrsLocal(){try{localStorage.setItem(LSE,JSON.stringify(errors))}catch(x){}}
async function putErr(e){saveErrsLocal();if(!errStore)return;
  const k="er:"+e.id;try{await errStore.doc(e.id).set({...e});saveOk(k)}catch(x){setSave(x&&x.code==="quota_exceeded"?"Caderno cheio na conta: exclua erros antigos para salvar novos.":"Não foi possível salvar o erro na conta; ficou salvo neste navegador");if(errors.includes(e))saveFail(k,"erro do caderno",x,()=>putErr(e))}}
async function delErr(id){{const e=errors.find(x=>x.id===id);if(e)toTrash("err",topicName(e.k),e.w,e)}errors=errors.filter(e=>e.id!==id);saveErrsLocal();render();if(errStore)try{await errStore.doc(id).delete()}catch(x){}}
/* ---------- Caderno de erros: revisão ativa, registro rápido, erros repetidos, cartão e anotação ---------- */
const E_INT=[1,3,7,15,30];
let erRun=null,eReg=null,eMenu=null;
function eBox(e){return Number.isInteger(e.box)&&e.box>=0&&e.box<E_INT.length?e.box:Math.min(e.rev||0,E_INT.length-1)}
// erros antigos (sem data marcada) entram pela data do último "revisei" ou do registro
function eDue(e){if(typeof e.due==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(e.due))return e.due;const b=/^\d{4}-\d{2}-\d{2}$/.test(e.lastRev||"")?e.lastRev:/^\d{4}-\d{2}-\d{2}$/.test(e.d||"")?e.d:today();return fromNum(dnum(b)+E_INT[eBox(e)])}
/* uma agenda por questão (Lote 17): erro que virou cartão é revisado pelo cartão, não volta na revisão de erros */
const eByCard=e=>cards.some(x=>!x.dr&&(x.eid===e.id||(e.cd&&x.id===e.cd)));
const eDueNow=e=>eDue(e)<=today()&&!eByCard(e)&&!e.fm;
const eDueList=()=>errors.filter(e=>BYKEY[e.k]&&!e.arch&&eDueNow(e));
/* auditoria 26/10: acertou no degrau de 30 dias → o erro se forma (e.fm = data): sai da revisão, continua no caderno; volta se você errar o tema de novo (eNew) */
/* Lote 21: 3 notas — 0 Errei (volta amanhã, conta como erro) · 1 Em parte (mesmo degrau, volta na metade do que o Acertei daria, mín. 2 dias: 2, 3, 7, 15) · 2 Acertei (próximo degrau). true/false antigos = 2/0 */
const E_PART_MIN=2;
const eUp=e=>eBox(e)>=E_INT.length-1?E_INT[E_INT.length-1]:E_INT[Math.min(eBox(e)+1,E_INT.length-1)];
function eNext(e,g){return g===0?1:g===1?Math.max(E_PART_MIN,Math.floor(eUp(e)/2)):eUp(e)}
function eAnswer(e,good){if(good===1){e.rev=(e.rev||0)+1;e.lastRev=today();e.due=fromNum(dnum(today())+eNext(e,1));e.lp=today();putErr(e);return}if(good===2)good=true;else if(good===0)good=false;e.rev=(e.rev||0)+1;e.lastRev=today();
  if(good&&eBox(e)>=E_INT.length-1){e.fm=today();e.due=fromNum(dnum(today())+E_INT[E_INT.length-1])}
  else if(good){e.box=Math.min(eBox(e)+1,E_INT.length-1);e.due=fromNum(dnum(today())+E_INT[e.box])}
  else{e.box=0;e.due=fromNum(dnum(today())+1);e.miss=(e.miss||0)+1;e.lastMiss=today()}
  putErr(e)}
function eNew(k,w,r,t,s,c,p,x){const e={id:Date.now().toString(36)+Math.random().toString(36).slice(2,7),k,w:w.trim(),r:r.trim(),t:ETYPES[t]?t:"conhecimento",s:(s||"").trim(),d:today(),rev:0,box:0,due:fromNum(dnum(today())+E_INT[0])};
  if(c&&(ECAUSES[e.t]||[]).includes(c))e.c=c;
  errors.forEach(o=>{if(o.k===k&&o.fm){delete o.fm;o.box=Math.max(0,eBox(o)-2);o.due=fromNum(dnum(today())+1);putErr(o)}});/* errou o tema de novo: os erros formados dele voltam */
  if(typeof p==="string"&&p.trim())e.p=p.trim().slice(0,600);
  x=x||{};if(typeof x.pc==="string"&&x.pc.trim())e.pc=x.pc.trim().slice(0,1200);if(typeof x.dd==="string"&&x.dd.trim())e.dd=x.dd.trim().slice(0,400);
  if(x.qf&&typeof x.qf.e==="string"&&Array.isArray(x.qf.a)){e.q={e:x.qf.e,a:x.qf.a.filter(a=>a&&typeof a.t==="string").map(a=>({l:String(a.l||""),t:a.t,...(typeof a.p==="string"&&a.p.trim()?{p:a.p.trim().slice(0,1200)}:{})})),c:String(x.qf.c||""),m:String(x.qf.m||"")};
    /* Lote 20: comentário e conceito inteiros, para os cartões não saírem cortados */
    if(typeof x.qf.cm==="string"&&x.qf.cm.trim())e.q.cm=x.qf.cm.trim().slice(0,4000);if(typeof x.qf.co==="string"&&x.qf.co.trim())e.q.co=x.qf.co.trim().slice(0,600)}
  if(e.q){const o=eOrg(e);if(o)e.ra=o}/* Lote 21: o app já organiza o erro ao salvar */
  errors.push(e);putErr(e);return e}
const eOneLine=s=>String(s||"").split("\n").map(cmTidy).filter(Boolean).join(" ").replace(/\s+/g," ").trim();
/* rascunho a partir de uma questão respondida (geradas, simulado, refazer) */
const CL_STOP=new Set("para pelo pela pelos pelas como mais menos sobre entre quando qual quais deve devem pode podem esta este essa esse isso isto está estão com sem que uma umas uns dos das nos nas aos foi era são ser ter tem tinha após antes desde paciente anos idade sexo masculino feminino feminina masculina apresenta apresentando refere queixa história quadro caso seguinte seguintes alternativa correta conduta diagnóstico provável mais adequada assinale".split(" "));
const clWords=t=>new Set(norm(String(t||"")).split(/[^a-z0-9]+/).filter(w=>w.length>=4&&!CL_STOP.has(w)));
const clCut=(t,n)=>{t=String(t||"").replace(/\s+/g," ").trim().replace(/[.;:]+$/,"");if(t.length<=n)return t;const c=t.slice(0,n),i=c.lastIndexOf(" ");return (i>n*.6?c.slice(0,i):c).replace(/[,;:]$/,"")+"…"};
const clSents=t=>String(t||"").replace(/\s+/g," ").trim().replace(/([.!?])\s+(?=[A-ZÀ-Ú0-9"(])/g,"$1\u0001").split("\u0001").map(x=>x.trim()).filter(Boolean);
/* "Correto" do erro na tela: tira as marcas da prova (cmTidy) e destaca "Por que não a sua" numa linha própria (nada é regravado) */
function eRFill(box,r){box.textContent="";String(r||"").split("\n").map(cmTidy).filter(Boolean).forEach((l,i)=>{const m=l.match(/^(Por que n[ãa]o[^:]{0,90}:)\s*(.*)$/);if(i&&!m)box.appendChild(document.createElement("br"));
  if(m){const b=document.createElement("b");b.className="ewhy";b.textContent="Por que não a sua";box.appendChild(b);box.append(cmTidy(m[2]))}else box.append(l)})}
/* texto com **negrito** (pista) → nós, sem HTML do usuário */
function boldFill(box,t){box.textContent="";String(t||"").split(/(\*\*[^*]+\*\*)/).forEach(x=>{if(!x)return;const m=x.match(/^\*\*([^*]+)\*\*$/);if(m){const b=document.createElement("strong");b.textContent=m[1];box.appendChild(b)}else box.append(x)})}
/* blocos extras do erro: dados decisivos (com a pista), ponto-chave (com o correto) e a questão completa */
let eQOpen=new Set();
function eExtraBlocks(card,e,show){const pi=card.querySelector(".epista");
  if(e.dd){const d=el(`<p class="ebody edd"><b>Dados decisivos</b><span></span></p>`);d.querySelector("span").textContent=e.dd;pi.after(d)}
  if(!show)return;const r=card.querySelector(".r").closest(".ebody");
  if(e.pc){const k=el(`<p class="ebody epc"><b>Ponto-chave</b><span></span></p>`);k.querySelector("span").textContent=cmTidy(e.pc);r.after(k)}
  if(e.q){const open=eQOpen.has(e.id),w=el(`<div class="eqfull"><button class="link" type="button"></button></div>`),b=w.querySelector("button");b.id="eqf-"+e.id;b.textContent=open?"Esconder a questão":"Ver a questão completa";b.setAttribute("aria-expanded",open);
    b.onclick=()=>{open?eQOpen.delete(e.id):eQOpen.add(e.id);render()};
    if(open){const st=el(`<p class="eqstem"></p>`);st.textContent=e.q.e;w.appendChild(st);const ol=el(`<ol class="eqalts"></ol>`);
      e.q.a.forEach(a=>{const li=el(`<li><b></b> <span></span></li>`);li.querySelector("b").textContent=a.l+")";li.querySelector("span").textContent=a.t;if(a.l===e.q.c)li.classList.add("right");else if(a.l===e.q.m)li.classList.add("mine");ol.appendChild(li)});w.appendChild(ol)}
    (card.querySelector(".epc")||r).after(w)}}
/* pista antiga que é só a pergunta da questão ("Qual…?") não ajuda: não aparece */
const ePista=e=>{const p=String(e.p||"").trim();return !p||/\?\s*$/.test(p)&&!/[.!]\s/.test(p)?"":p};
/* pista do caso: a frase do enunciado que mais aponta para a resposta certa (palavras da correta/comentário, números e exames) */
function qClue(q){const S=clSents(q.enunciado);if(!S.length)return "";const isAsk=x=>/\?$/.test(x)||/\b(assinale|marque|qual (?:[ée]|a|o|das|dos)|indique|aponte)\b/i.test(x);
  let C=S.filter(x=>!isAsk(x));if(!C.length)return "";/* só a pergunta, sem caso: não há pista */if(C.length===1)return clCut(C[0],220);
  const r=q.alternativas.find(a=>a.letra===q.correta),K=clWords([r&&r.texto,q.comentario,q.conceito,q.pc,q.th].join(" ")),W=[...q.alternativas.filter(a=>a.letra!==q.correta)].reduce((m,a)=>{clWords(a.texto).forEach(w=>m.add(w));return m},new Set());
  const sc=C.map((x,i)=>{const ws=clWords(x);let v=0;ws.forEach(w=>{if(K.has(w))v+=W.has(w)?0.5:2});
    if(/\d/.test(x))v+=0.8;if(/\b(exame|mostra|revela|evidencia|laborat|hemograma|tomografia|radiografia|ultrass|bi[óo]psia|ecg|eletrocardio|resson|sorologia|cultura|gasometria|achado|ausculta|palpa)/i.test(x))v+=1;
    if(i===0&&ws.size<5)v-=1;return {x,v,i}}).sort((a,b)=>b.v-a.v||a.i-b.i);
  return clCut(sc[0].x,220)}
/* pista em frase com **negrito** nas palavras que apontam para a certa (e números/achados de exame) */
const CL_EXAM=/\b(exame|mostra|revela|evidencia|laborat|hemograma|plaquetas?|leuc[oó]citos|hb|tomografia|radiografia|ultrass|bi[óo]psia|ecg|eletrocardio|resson|sorologia|cultura|gasometria|achado|ausculta|palpa|ttpa|tp|inr|ferritina|creatinina|pa\b|fc\b|febre|saturação)/i;
function qClueRich(q){const t=qClue(q);if(!t)return "";const r=q.alternativas.find(a=>a.letra===q.correta),K=clWords([r&&r.texto,q.comentario,q.conceito,q.pc].join(" ")),W=new Set();q.alternativas.filter(a=>a.letra!==q.correta).forEach(a=>clWords(a.texto).forEach(w=>W.add(w)));
  const out=t.split(/(\s+)/).map(w=>{if(/^\s+$/.test(w)||!w)return w;const m=w.match(/^([("“]*)(.*?)([),.;:!?”"]*)$/),core=m[2],n=norm(core).replace(/[^a-z0-9]/g,"");
    const pre=n.slice(0,5),inK=n.length>=4&&(K.has(n)||n.length>=5&&[...K].some(k=>k.length>=5&&k.slice(0,5)===pre)),inW=W.has(n)||n.length>=5&&[...W].some(k=>k.length>=5&&k.slice(0,5)===pre);
    const hit=core&&(/\d/.test(core)||inK&&!inW||CL_EXAM.test(core)&&core.length>=2);return hit?`${m[1]}**${core}**${m[3]}`:w}).join("");
  return out.replace(/\*\*(\s+)\*\*/g,"$1")}
/* dados decisivos: 2–3 trechos curtos do caso (números, achados de exame, palavras da certa) */
function qData(q){const S=clSents(q.enunciado).filter(x=>!(/\?$/.test(x)||/\b(assinale|marque|qual (?:[ée]|a|o|das|dos)|indique|aponte)\b/i.test(x)));if(!S.length)return "";
  const r=q.alternativas.find(a=>a.letra===q.correta),K=clWords([r&&r.texto,q.comentario,q.conceito,q.pc].join(" "));
  const C=[];S.forEach((x,i)=>x.split(/[;,]\s+|\.\s+|\s+e\s+(?=[a-zà-ú]+\s)/).forEach(c=>{c=c.trim().replace(/[.;:]+$/,"").replace(/^(?:e|mas|porém)\s+/i,"");if(c.length<6)return;const ws=clWords(c);let v=0;ws.forEach(w=>{if(K.has(w))v+=1.5});if(/\d/.test(c))v+=1.2;if(CL_EXAM.test(c))v+=1;if(i===0&&/\b(anos|homem|mulher|paciente|criança|lactente|gestante)\b/i.test(c)&&!/\d{2,}\s*(mg|g\/|mm|%)/.test(c))v-=.6;if(v>0)C.push({c,v,o:C.length})}));
  return C.sort((a,b)=>b.v-a.v||a.o-b.o).slice(0,3).sort((a,b)=>a.o-b.o).map(x=>clCut(x.c,80)).join(" · ")}
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
