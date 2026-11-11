/* cobertura: temas estudados sem nenhuma anotação */
const noNoteKeys=()=>[...ALL,...FAC_ITEMS].filter(i=>get(i.key).last&&!(notes[i.key]||"").trim()).map(i=>i.key);
/* ---------- Anotações: PDF, filtros extras, erros junto e caderno livre ---------- */
let nSort="sp",nFlags=new Set();
const NFLAG={week:"Editadas nesta semana",peg:"Com pegadinhas",tab:"Com tabela",cards:"Com cartões"};
function nFlagOk1(k,f){const t=notes[k]||"";return f==="week"?!!(noteAt[k]&&dnum(today())-dnum(String(noteAt[k]).slice(0,10))<7):f==="peg"?pegOf(k).length>0:f==="tab"?/^\s*\|.*\|\s*$/m.test(t):cards.some(x=>x.k===k)}
function nFlagOk(k){const t=notes[k]||"";
  if(nFlags.has("week")&&!(noteAt[k]&&dnum(today())-dnum(String(noteAt[k]).slice(0,10))<7))return false;
  if(nFlags.has("peg")&&!pegOf(k).length)return false;
  if(nFlags.has("tab")&&!/^\s*\|.*\|\s*$/m.test(t))return false;
  if(nFlags.has("cards")&&!cards.some(x=>x.k===k))return false;return true}
function nSortKeys(keys){const w=k=>wordCount(notes[k]||"");
  if(nSort==="recent")return keys.sort((a,b)=>String(noteAt[b]||"").localeCompare(String(noteAt[a]||"")));
  if(nSort==="big")return keys.sort((a,b)=>w(b)-w(a));if(nSort==="small")return keys.sort((a,b)=>w(a)-w(b));
  return keys.sort((x,y)=>BYKEY[x].num-BYKEY[y].num)}
let nFOpen=(document.documentElement.dataset.layout!=="phone"||window.__noSheet)&&lsGet("resid-nfpanel","")==="1";
function renderNFlags(keys,vis){const box=$("#nFBody");if(!box)return;keys=keys||[];vis=vis||keys;
  {const c=$("#nFCount")||null;if(c)c.textContent=nArea!=="all"||nQuery||nFlags.size?`${vis.length} de ${keys.length} ${keys.length===1?"anotação":"anotações"}`:(n=>`${n} ${n===1?"página":"páginas"}`)(keys.length+freeN.length)}
  const A=[];if(nType!=="all")A.push([nType==="free"?"Só páginas livres":"Só páginas dos temas",()=>{nType="all";lsSet("resid-ntype","all")}]);if(freeTag!=="all")A.push(["#"+freeTag,()=>{freeTag="all"}]);
  Object.entries(NFLAG).forEach(([v,l])=>{if(nFlags.has(v))A.push([l,()=>nFlags.delete(v)])});
  if(nArea!=="all")A.push([fcAreaName(nArea),()=>{nArea="all";nSp="all"}]);if(nArea!=="all"&&nSp!=="all")A.push([nSp,()=>{nSp="all"}]);
  const cntF={week:k=>nFlagOk1(k,"week"),peg:k=>nFlagOk1(k,"peg"),tab:k=>nFlagOk1(k,"tab"),cards:k=>nFlagOk1(k,"cards")};
  const nnN=noNoteKeys().length;if(nNoNote)A.push(["Estudados sem anotação",()=>{nNoNote=false}]);
  /* Lote 20: Tipo e Etiquetas moram no painel (antes eram duas linhas soltas no cartão) */
  const nT=[...ALL,...FAC_ITEMS].filter(i=>(notes[i.key]||"").trim()).length,tags=[...new Set([...(nType==="topic"?[]:freeN.flatMap(f=>f.tags)),...(nType==="free"?[]:[...ALL,...FAC_ITEMS].filter(i=>(notes[i.key]||"").trim()).flatMap(i=>tgOf(i.key)))])].sort();
  if(freeTag!=="all"&&!tags.includes(freeTag))freeTag="all";
  const tyG=fcPer("nTy",nType,v=>{nType=v;lsSet("resid-ntype",v);if(v==="free")nNoNote=false},[["all",`Todas · ${freeN.length+nT}`],["free",`Livres · ${freeN.length}`],["topic",`Dos temas · ${nT}`]],"Tipo de página");
  const tgN=t=>freeN.filter(f=>f.tags.includes(t)).length+[...ALL,...FAC_ITEMS].filter(i=>(notes[i.key]||"").trim()&&tgOf(i.key).includes(t)).length;
  const tgG=tags.length&&!nNoNote?fcChips(tags.map(t=>fcChip(`#${t} · ${tgN(t)}`,freeTag===t,()=>{freeTag=freeTag===t?"all":t},null,null,null,{tag:t}))):null;
  const G=[["Tipo","páginas livres, dos temas ou todas",tyG],["Etiquetas","as que você deu às páginas",tgG],["Mostrar só","combinam com o resto",fcChips([...Object.entries(NFLAG).map(([v,l])=>fcChip(`${l} · ${keys.filter(cntF[v]).length}`,nFlags.has(v),()=>{nFlags.has(v)?nFlags.delete(v):nFlags.add(v)},null,null,null,{nf:v})),
      fcChip(`Temas estudados sem anotação · ${nnN}`,nNoNote,()=>{nNoNote=!nNoNote;if(nNoNote&&nType==="free"){nType="all";lsSet("resid-ntype","all")}},"nNoNoteB",null,"Temas que você já estudou e ainda não têm página no caderno",{nf:"nonote"})])],
    ["Onde","grande área e especialidade",fcWhere("n",nArea,nSp,(a,sp)=>keys.filter(k=>(a==="all"||BYKEY[k].area.code===a)&&(sp==="all"||BYKEY[k].sp===sp)).length,v=>{nArea=v;nSp="all"},v=>{nSp=v})]];
  fcBody(box,{tog:"nFBtn",panelId:"nFPanel",open:nFOpen,onToggle:()=>{nFOpen=!nFOpen;lsSet("resid-nfpanel",nFOpen?"1":null)},
    sort:["nSortSel",[["sp","Por especialidade"],["recent","Mais recentes primeiro"],["big","Maiores primeiro"],["small","Menores primeiro"]],nSort,v=>{nSort=v}],
    act:A,clearId:"nClear",onClear:()=>{nFlags.clear();nArea="all";nSp="all";nQuery="";frQ="";frQRaw="";nNoNote=false;nType="all";lsSet("resid-ntype","all");freeTag="all"},groups:G,
    foot:nQuery||A.length?(vis.length?`${vis.length} ${vis.length===1?"anotação encontrada":"anotações encontradas"}`:"Nenhuma anotação com esses filtros"):"",
    onDone:()=>{nFOpen=false;lsSet("resid-nfpanel",null);render();const l=$("#nlist");if(l)l.scrollIntoView({block:"start"})}})}
/* erros do caderno junto da anotação */
/* erros do tema junto da anotação: uma linha de resumo e só os erros "vivos" (vencem hoje ou teimosos), no máximo 3,
   sem os que já foram levados para a anotação (e.nt) nem os arquivados; uma linha por erro, com o conceito certo */
const eAlive=e=>!e.arch&&(eDueNow(e)||(e.miss||0)>=1&&!eByCard(e));
function eConcept(e){const L=String(e.r||"").split(/\n+/).map(x=>x.trim()).filter(Boolean),t=(L.find(x=>!/^Correta:|^Por que a minha/i.test(x))||L[0]||"").replace(/\s+/g," ");
  if(t.length<=150)return t;const c=t.slice(0,150),sp=c.lastIndexOf(" ");let o=sp>90?c.slice(0,sp):c;
  for(let i=0;i<3;i++)o=o.replace(/[,;:.\s]+$/,"").replace(/\s+(e|ou|de|da|do|das|dos|a|o|as|os|em|no|na|com|para|por|que|um|uma)$/i,"");return o+"…"}
function eOpenOne(e){eGoTopic(e.k);if(e.arch)eFlags.add("arch");backStack=[];setView("erros");
  setTimeout(()=>{const x=document.querySelector(`#elist .ecard[data-eid="${e.id}"]`);if(x){x.scrollIntoView({behavior:"smooth",block:"center"});x.classList.add("eflash");setTimeout(()=>x.classList.remove("eflash"),1600)}},80)}
function noteErrsEl(k){const act=errors.filter(e=>e.k===k&&!e.arch);if(!act.length)return null;
  const alive=act.filter(eAlive),show=alive.sort((a,b)=>(b.miss||0)-(a.miss||0)||eDue(a).localeCompare(eDue(b))).slice(0,3);
  const d=el(`<div class="nerrs"><p class="nerrh"><span></span> <button class="link" type="button">ver no caderno</button></p></div>`);
  d.querySelector("span").textContent=`${act.length} ${act.length===1?"erro neste tema":"erros neste tema"}${alive.length?` · ${alive.length} ${alive.length===1?"ainda pede":"ainda pedem"} atenção`:" · nenhum pedindo atenção agora"}`;
  if(alive.length)d.classList.add("live");
  d.querySelector("button").onclick=()=>{eGoTopic(k);backStack=[];setView("erros")};
  if(show.length){const ul=el(`<ul></ul>`);show.forEach(e=>ul.appendChild(eItemEl(e)));d.appendChild(ul)}
  return d}
/* nome (alternativa) → link para o tema quando bate com um tema, página ou subtópico de um tema */
function eNameLink(name){const t=String(name||"").trim(),r=wkFind(t);if(r)return wkHTML(t);const n=norm(t);
  if(n.length>=5){const it=ALL.find(x=>subList(x).some(y=>{const m=norm(y.t);return m===n||m.length>=6&&(n.startsWith(m)||m.startsWith(n))}));if(it)return `<a class="wk" href="#" data-wk="t:${esc(it.key)}" title="Abrir ${esc(it.t)}">${esc(t)}</a>`}
  return esc(t)}
const mdBold=t=>esc(String(t||"")).replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>");
/* um erro como item: **certa:** conceito (inteiro) + subitens Errei / Pista / Ponto-chave */
function eItemEl(e){const P=cdErrParse(e),li=el(`<li class="nei"></li>`),con=P.concept||eOneLine(e.r);
  li.innerHTML=`${P.right?`<strong>${eNameLink(P.right.replace(/^[A-E]\)\s*/,""))}:</strong> `:""}${esc(con)} `;
  const b=el(`<button type="button" class="nbadge ne"></button>`);b.textContent=`⚠ ${(e.miss||0)>=1?`errou de novo ${e.miss}×`:"Erro · "+br(e.d).slice(0,5)}`;b.title="Abrir o erro no caderno";b.onclick=()=>eOpenOne(e);li.appendChild(b);
  const sub=[];if(P.mine&&P.right)sub.push(`<b>Errei:</b> marquei ${eNameLink(P.mine.replace(/^[A-E]\)\s*/,""))}; a certa era ${eNameLink(P.right.replace(/^[A-E]\)\s*/,""))}`);else if(e.w)sub.push(`<b>Errei:</b> ${esc(eOneLine(e.w))}`);
  if(ePista(e))sub.push(`<b>Pista:</b> ${mdBold(ePista(e))}`);if(e.dd)sub.push(`<b>Dados decisivos:</b> ${esc(e.dd)}`);if(e.pc)sub.push(`<b>Ponto-chave:</b> ${esc(cmTidy(e.pc))}`);if(P.why)sub.push(`<b>Por que não a sua:</b> ${esc(P.why)}`);
  if(sub.length){const ul=el(`<ul></ul>`);ul.innerHTML=sub.map(x=>`<li>${x}</li>`).join("");li.appendChild(ul)}
  return li}
/* Lote 20C: PDF do Caderno por recorte — tela, caderno todo, uma área ou Escolher (área › especialidades › temas), com as páginas livres ligadas */
function nPdfSel(keys,vis){const O=nPdfOpt,sc=O.scope;
  if(sc==="screen")return {ks:vis,title:"Seleção da tela",scope:"Como está na tela",file:"selecao"};
  if(sc==="all")return {ks:keys,title:"Minhas anotações",scope:"Todas as áreas",file:"todas",all:true};
  if(sc!=="pick"){const A=AREAS.find(a=>a.code===sc);return {ks:keys.filter(k=>BYKEY[k].area.code===sc),title:A?A.name:sc,scope:"Grande área",file:sc.toLowerCase()}}
  const inA=k=>O.area==="all"||BYKEY[k].area.code===O.area,inS=k=>!O.sps.size||O.sps.has(BYKEY[k].sp||""),base=keys.filter(k=>inA(k)&&inS(k)),ks=O.ks.size?base.filter(k=>O.ks.has(k)):base;
  const A=AREAS.find(a=>a.code===O.area),sps=[...O.sps];let title,scope;
  if(ks.length===1){const it=BYKEY[ks[0]];title=it.t;scope=[it.area.name,it.sp].filter(Boolean).join(" · ")}
  else if(O.ks.size){title=sps.length===1?sps[0]:A?A.name:"Temas escolhidos";scope=`${ks.length} temas escolhidos`}
  else if(sps.length===1){title=sps[0];scope=A?A.name:"Especialidade"}else if(sps.length>1){title=sps.join(", ");scope=A?A.name:"Especialidades"}else{title=A?A.name:"Minhas anotações";scope=A?"Grande área":"Todas as áreas"}
  return {ks,title,scope,file:norm(title).replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,40)||"selecao"}}
function nPdfPanel(keys,vis){const O=nPdfOpt;O.sps=O.sps||new Set();O.ks=O.ks||new Set();O.area=O.area||"all";O.q=O.q||"";if(O.link===undefined)O.link=true;
  const w=el(`<div class="npdfopt"><span class="glabel">PDF das anotações</span><label class="qfsel"><span>O que entra</span><select id="nPdfScope"></select></label><div class="npdfpick"></div><label class="fcru"><input type="checkbox" id="nPdfFree"> <span></span></label><p class="how npdfsum"></p><div class="btns"><button class="btn primary" type="button" id="nPdfGo">Gerar PDF</button><button class="link" type="button" id="nPdfX">Cancelar</button></div></div>`);
  const sel=w.querySelector("select"),cnt=c=>keys.filter(k=>BYKEY[k].area.code===c).length,opts=[];
  if(vis.length<keys.length)opts.push(["screen",`Como está na tela (${vis.length} ${vis.length===1?"tema":"temas"})`]);
  opts.push(["all",`Caderno todo (${keys.length} ${keys.length===1?"tema":"temas"})`]);AREAS.forEach(a=>{const n=cnt(a.code);if(n)opts.push([a.code,`${a.name} (${n})`])});
  if(keys.length)opts.push(["pick","Escolher especialidades ou temas…"]);
  opts.forEach(([v,t])=>{const o=document.createElement("option");o.value=v;o.textContent=t;sel.appendChild(o)});if(!opts.some(x=>x[0]===O.scope))O.scope=opts[0][0];sel.value=O.scope;sel.onchange=()=>{O.scope=sel.value;render()};
  const pk=w.querySelector(".npdfpick");
  if(O.scope==="pick"){const aSel=el(`<label class="qfsel"><span>Grande área</span><select id="nPdfArea"></select></label>`),as=aSel.querySelector("select");
    [["all",`Todas as áreas (${keys.length})`],...AREAS.filter(a=>cnt(a.code)).map(a=>[a.code,`${a.name} (${cnt(a.code)})`])].forEach(([v,t])=>{const o=document.createElement("option");o.value=v;o.textContent=t;as.appendChild(o)});
    as.value=O.area;as.onchange=()=>{O.area=as.value;O.sps.clear();O.ks.clear();render()};pk.appendChild(aSel);
    const inA=k=>O.area==="all"||BYKEY[k].area.code===O.area,SP={};keys.filter(inA).forEach(k=>{const s=BYKEY[k].sp||"";if(s)SP[s]=(SP[s]||0)+1});
    if(Object.keys(SP).length){const g=el(`<div class="tfgrp"><div class="tfgh"><span class="glabel">Especialidades</span><span class="tfhint">uma ou várias; nenhuma = todas</span></div></div>`);
      g.appendChild(fcChips(Object.entries(SP).sort((a,b)=>a[0].localeCompare(b[0])).map(([s,n],i)=>fcChip(`${s} · ${n}`,O.sps.has(s),()=>{O.sps.has(s)?O.sps.delete(s):O.sps.add(s);O.ks.clear()},"nPdfSp-"+i))));pk.appendChild(g)}
    const base=keys.filter(k=>inA(k)&&(!O.sps.size||O.sps.has(BYKEY[k].sp||""))),qq=norm(O.q.trim()),L=base.filter(k=>!qq||norm(BYKEY[k].t).includes(qq));
    const tg=el(`<div class="tfgrp"><div class="tfgh"><span class="glabel">Temas</span><span class="tfhint"></span></div><div class="tfsearch">${FC_ICO}<input class="search" id="nPdfQ" type="search" placeholder="Buscar tema" autocomplete="off"></div><ul class="npdft"></ul></div>`);
    tg.querySelector(".tfhint").textContent=O.ks.size?`${[...O.ks].filter(k=>base.includes(k)).length} de ${base.length} marcados`:`nenhum marcado = os ${base.length}`;
    const qi=tg.querySelector("input");qi.value=O.q;qi.oninput=debounced(()=>{O.q=qi.value;render();const x=$("#nPdfQ");if(x){x.focus();x.setSelectionRange(x.value.length,x.value.length)}});
    const ul=tg.querySelector("ul");L.slice(0,40).forEach(k=>{const li=el(`<li><label><input type="checkbox"> <span></span><small></small></label></li>`),cb=li.querySelector("input");cb.id="nPdfT-"+k;cb.checked=O.ks.has(k);cb.onchange=()=>{cb.checked?O.ks.add(k):O.ks.delete(k);render()};
      li.querySelector("span").textContent=BYKEY[k].t;li.querySelector("small").textContent=" · "+(BYKEY[k].sp||BYKEY[k].area.code);ul.appendChild(li)});
    if(L.length>40)ul.appendChild(el(`<li class="how">Mostrando 40 de ${L.length}: busque para achar outros.</li>`));if(!L.length)ul.appendChild(el(`<li class="how">Nenhum tema com anotação nessa escolha.</li>`));
    if(O.ks.size){const cl=el(`<button class="link" type="button" id="nPdfTX">Desmarcar todos</button>`);cl.onclick=()=>{O.ks.clear();render()};tg.appendChild(cl)}
    pk.appendChild(tg)}
  const S=nPdfSel(keys,vis),fv=freeVisible(),ksS=new Set(S.ks),linked=freeN.filter(f=>f.ks.some(k=>ksS.has(k))),cb=w.querySelector("#nPdfFree"),fl=w.querySelector(".fcru span");
  if(S.all){cb.checked=!!O.free;cb.disabled=!fv.length;fl.textContent=fv.length?`Incluir o caderno livre (${fv.length} ${fv.length===1?"página":"páginas"})`:"Caderno livre vazio";cb.onchange=()=>{O.free=cb.checked;render()}}
  else{cb.checked=!!O.link&&!!linked.length;cb.disabled=!linked.length;fl.textContent=linked.length?`Levar as páginas livres ligadas a esses temas (${linked.length})`:"Nenhuma página livre ligada a esses temas";cb.onchange=()=>{O.link=cb.checked;render()}}
  const fr=S.all?(cb.checked?fv:[]):(cb.checked?linked:[]);
  w.querySelector(".npdfsum").textContent=`“${S.title}”: capa, sumário${S.ks.length+fr.length<=3?" com as seções de cada página":""}, ${S.ks.length} ${S.ks.length===1?"tema":"temas"}${fr.length?` e ${fr.length} ${fr.length===1?"página livre":"páginas livres"}`:""}. Texto justificado, tabelas com grade e links entre temas com a página.`;
  w.querySelector("#nPdfGo").disabled=!S.ks.length&&!fr.length;
  w.querySelector("#nPdfX").onclick=()=>{nPdfOpt=null;render()};
  w.querySelector("#nPdfGo").onclick=async()=>{$("#nmsg").textContent="Gerando o PDF…";
    try{const bytes=notesPDF(S.ks,fr,{scope:S.scope,title:S.title,kicker:S.all?"CADERNO  ·  REVISÃO GERAL":"CADERNO",freeTitle:S.all?"Caderno livre":"Páginas ligadas"});await downloadsFn.save({filename:`caderno-${S.file}-${today()}.pdf`,data:new Blob([bytes],{type:"application/pdf"})});
      nPdfOpt=null;render();$("#nmsg").textContent=`PDF salvo com ${S.ks.length} ${S.ks.length===1?"tema":"temas"}${fr.length?` e ${fr.length} ${fr.length===1?"página livre":"páginas livres"}`:""}.`}
    catch(e){$("#nmsg").textContent=e&&(e.code==="declined"||e.code==="cancelled")?"Download cancelado.":"Não foi possível gerar o PDF agora."}};
  return w}
/* ----- PDF das anotações (mesmo gerador do panorama) ----- */
function notesPDF(keys,free,opt){opt=opt||{};free=free||[];
  const C={ink:[20,27,45],mut:[92,99,117],acc:[22,38,74],gold:[184,145,74],goldInk:[138,106,43],l2:[44,88,150],line:[225,218,203],bg:[243,240,233],hl:[247,228,170],white:[247,243,234],soft:[214,206,190],qbg:[236,241,248]};
  const M=50,AI=new Map(AREAS.map((a,i)=>[a.code,i])),SPO=new Map();ALL.forEach(it=>{const s=it.area.code+"|"+(it.sp||"");if(!SPO.has(s))SPO.set(s,SPO.size)});
  const K=[...keys].filter(k=>BYKEY[k]).sort((a,b)=>{const x=BYKEY[a],y=BYKEY[b];return (AI.get(x.area.code)??9)-(AI.get(y.area.code)??9)||(SPO.get(x.area.code+"|"+(x.sp||""))??999)-(SPO.get(y.area.code+"|"+(y.sp||""))??999)||(x.own?1:0)-(y.own?1:0)||x.num-y.num});
  const groups=[];K.forEach(k=>{const it=BYKEY[k];let A=groups[groups.length-1];if(!A||A.code!==it.area.code){A={code:it.area.code,name:it.area.name,sps:[]};groups.push(A)}let S=A.sps[A.sps.length-1];if(!S||S.name!==(it.sp||"")){S={name:it.sp||"",keys:[]};A.sps.push(S)}S.keys.push(k)});
  /* texto com estilos: **negrito**, ==destaque==, [[link]] (p. N), [texto](url), selos */
  const runsOf=(t,pmap,base)=>{const R=[],re=/\*\*(.+?)\*\*|==(.+?)==|\[\[([^\[\]\n|]{1,120})(?:\|([^\[\]\n]{1,120}))?\]\]|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\{\{([eq]):([A-Za-z0-9:_-]{1,80})\}\}/g;let last=0,m;
    const plain=x=>x.replace(/(^|[\s(])_(.+?)_(?=[\s.,;:!?)]|$)/g,"$1$2").replace(/(^|[\s(])\*(?!\s)(.+?)\*(?=[\s.,;:!?)]|$)/g,"$1$2").replace(/`/g,"");
    t=String(t);while((m=re.exec(t))){if(m.index>last)R.push({t:plain(t.slice(last,m.index)),...base});
      if(m[1]!==undefined)R.push({t:plain(m[1]),...base,b:true});else if(m[2]!==undefined)R.push({t:plain(m[2]),...base,hl:true});
      else if(m[3]!==undefined){const r=wkFind(m[3].trim()),lab=(m[4]||m[3]).trim();R.push({t:lab,...base,lk:true});const pk=r?(r.kind==="t"?r.id:"f:"+r.id):null;if(pk&&pmap[pk])R.push({t:` (p. ${pmap[pk]})`,...base,mut:true})}
      else if(m[5]!==undefined){R.push({t:m[5],...base,lk:true});R.push({t:` (${m[6]})`,...base,mut:true,sm:true})}
      else if(m[7]!==undefined){R.push({t:` [${nbInfo(m[7],m[8]).lab}]`,...base,mut:true,sm:true})}
      last=m.index+m[0].length}
    if(last<t.length)R.push({t:plain(t.slice(last)),...base});return R};
  const content=pmap=>{const P=new MiniPDF("Anotações"),CW=P.W-2*M,starts={};let y=M,first=true;
    const need=h=>{if(y+h>P.H-M-18){P.add();y=M}};
    /* Lote 20C: parágrafos e itens justificados (a última linha fica à esquerda); bloco "Da questão" em faixa azul-clara */
    const rich=(t,o={})=>{const s=o.size||9.6,lh=s*1.45,ind=(o.indent||0)+(o.box?10:0),W=CW-ind,R=runsOf(t,pmap,{b:!!o.bold,c:o.color}),toks=[],just=o.just??!o.bold;
      R.forEach(r=>r.t.split(/(\s+)/).forEach(w=>{if(!w)return;const sp=/^\s+$/.test(w),sz=r.sm?s*.86:s;toks.push({w:sp?" ":w,sp,r,sz,wd:pdfW(sp?" ":w,sz,r.b||r.hl)})}));
      const lines=[];let cur=[],cw=0;toks.forEach(k=>{if(k.sp&&!cur.length)return;if(!k.sp&&cw+k.wd>W&&cur.length){while(cur.length&&cur[cur.length-1].sp)cur.pop();lines.push(cur);cur=[];cw=0}
        if(!k.sp&&k.wd>W){let piece="";[...k.w].forEach(ch=>{const t2=piece+ch;if(pdfW(t2,k.sz,k.r.b||k.r.hl)>W&&piece){lines.push([{...k,w:piece,wd:pdfW(piece,k.sz,k.r.b||k.r.hl)}]);piece=ch}else piece=t2});cur=[{...k,w:piece,wd:pdfW(piece,k.sz,k.r.b||k.r.hl)}];cw=cur[0].wd;return}
        cur.push(k);cw+=k.wd});while(cur.length&&cur[cur.length-1].sp)cur.pop();if(cur.length)lines.push(cur);
      lines.forEach((L,li)=>{need(lh);if(o.qbox)P.rect(M+(o.qind||0),y,CW-(o.qind||0),lh+(li===lines.length-1?2:0),C.qbg);if(o.qbox)P.rect(M+(o.qind||0),y,2.2,lh+(li===lines.length-1?2:0),C.l2);if(o.box)P.rect(M+(o.indent||0),y+1,2.4,lh,C.gold);let x=M+ind;
        const sps=L.filter((k,i)=>k.sp&&i>0&&i<L.length-1).length,used=L.reduce((a,k)=>a+k.wd,0),gap=W-used,ex=just&&li<lines.length-1&&sps&&gap>0&&gap<W*.35?gap/sps:0;
        L.forEach((k,i)=>{const r=k.r,kw=k.sp&&i>0&&i<L.length-1?k.wd+ex:k.wd;if(r.hl)P.rect(x-.6,y+1.2,kw+1.2,lh-1.4,C.hl);
          if(!k.sp)P.text(x,y+s,k.w,{size:k.sz,bold:r.b||r.hl,color:r.lk?C.l2:r.mut?C.mut:r.c||C.ink});x+=kw});y+=lh});y+=o.after??2};
    /* tabela de verdade: grade, cabeçalho com fundo, largura por coluna e quebra de linha na célula (repete o cabeçalho na página nova) */
    const cellTxt=x=>String(x).replace(/\*\*(.+?)\*\*/g,"$1").replace(/==(.+?)==/g,"$1").replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,(a,b,d)=>d||b).replace(/`/g,"").trim();
    const table=(rows,head)=>{const n=Math.max(...rows.map(r=>r.length)),sz=8.4,lh=sz*1.32,pad=4,TW=CW-6,X0=M+3;rows=rows.map(r=>{const a=r.map(cellTxt);while(a.length<n)a.push("");return a});
      const nat=[...Array(n)].map((_,j)=>Math.max(30,...rows.map((r,i)=>Math.min(pdfW(r[j],sz,head&&i===0)+2*pad,TW*.6)))),sum=nat.reduce((a,b)=>a+b,0),wd=nat.map(w=>Math.max(34,w/sum*TW));
      const fix=TW/wd.reduce((a,b)=>a+b,0);for(let j=0;j<n;j++)wd[j]*=fix;
      const draw=(r,isH)=>{const L=r.map((t,j)=>pdfWrap(t||" ",sz,isH,wd[j]-2*pad)),h=Math.max(...L.map(x=>x.length))*lh+2*pad;return {L,h}};
      const H=head?draw(rows[0],true):null;y+=3;let firstRow=true;
      const put=(D,isH)=>{if(isH)P.rect(X0,y,TW,D.h,C.bg);let x=X0;D.L.forEach((ls,j)=>{ls.forEach((l,q)=>P.text(x+pad,y+pad+sz+q*lh-1,l,{size:sz,bold:isH,color:isH?C.acc:C.ink}));x+=wd[j]});
        P.line(X0,y,X0+TW,y,C.soft,.5);P.line(X0,y+D.h,X0+TW,y+D.h,C.soft,.5);x=X0;P.line(x,y,x,y+D.h,C.soft,.5);wd.forEach(w=>{x+=w;P.line(x,y,x,y+D.h,C.soft,.5)});y+=D.h};
      rows.forEach((r,i)=>{if(head&&i===0){need(H.h+lh*2+2*pad);put(H,true);firstRow=false;return}const D=draw(r,false);if(y+D.h>P.H-M-18){P.add();y=M;if(H)put(H,true)}put(D,false)});y+=6};
    const body=(txt,key)=>{let fence=null,tb=[],daq=false,hi=0;const flush=()=>{if(!tb.length)return;const sepAt=tb.findIndex(l=>/^\s*\|?\s*:?-{2,}/.test(l)),rows=tb.filter(l=>!/^\s*\|?\s*:?-{2,}[-:|\s]*$/.test(l)).map(l=>l.trim().replace(/^\||\|$/g,"").split("|").map(x=>x.trim()));tb=[];table(rows,sepAt===1)};
      String(txt).replace(/\r/g,"").split("\n").concat([""]).forEach(l=>{if(/^\s*\|.*\|\s*$/.test(l)&&fence===null){tb.push(l);return}flush();
      if(/^\s*```/.test(l)){fence=fence===null?l.trim().slice(3).trim().toLowerCase():null;if(fence==="fluxo"){y+=2;rich("Fluxograma:",{size:9,bold:true,color:C.acc,after:1})}return}
      if(fence!==null){if(!l.trim())return;if(fence==="fluxo"){const ind=/^\s{2,}/.test(l)?26:10;rich((/^\s*\?/.test(l)?"? ":ind>10?"":"-> ")+l.trim().replace(/^\?\s*/,""),{indent:ind,size:9.2,bold:/^\s*\?/.test(l)})}else rich(l,{size:8.6,indent:8});return}
      if(!l.trim()){y+=3;return}let m;
      if(m=l.match(/^(#{1,3})\s+(.*)/)){daq=false;need(56);y+=5;if(key)starts["h:"+key+":"+(hi++)]=P.pages.length-1;rich(m[2],{size:m[1].length===1?11.2:10.4,bold:true,color:C.acc,after:1});return}
      if(/^-\s+\*\*Da questão:\*\*/.test(l)){daq=true;need(40);y+=2;rich(l.replace(/^-\s+\*\*Da questão:\*\*\s*/,"**Da questão:** "),{qbox:true,qind:4,indent:10,size:9.4,after:0});return}
      if(daq&&/^\s{2,}[-*•]\s+/.test(l)){rich("– "+l.replace(/^\s*[-*•]\s+/,""),{qbox:true,qind:4,indent:22,size:9.2,after:0});return}
      if(daq){daq=false;y+=4}
      if(/^\s*>/.test(l)){rich(l.replace(/^\s*>\s?/,""),{box:true,indent:4,size:9.4});return}
      if(m=l.match(/^(\s*)([-*•]|\d+[.)])\s+(.*)/)){const lv=m[1].replace(/\t/g,"  ").length,ind=lv>=4?34:lv>=2?22:10;rich((/\d/.test(m[2])?m[2]+" ":lv>=2?"– ":"• ")+m[3],{indent:ind});return}
      rich(l)});if(daq)y+=4};
    groups.forEach(A=>{if(!first){P.add();y=M}first=false;starts["a:"+A.code]=P.pages.length-1;
      P.rect(M,y,36,3,C.gold);y+=14;P.text(M,y+20,A.name,{size:21,bold:true,color:C.acc});y+=30;
      const n=A.sps.reduce((s,S)=>s+S.keys.length,0);P.text(M,y+9,`${n} ${n===1?"tema":"temas"} · ${A.sps.filter(S=>S.name).length} ${A.sps.filter(S=>S.name).length===1?"especialidade":"especialidades"}`,{size:9,color:C.mut});y+=22;P.line(M,y,M+CW,y,C.line,.8);y+=12;
      A.sps.forEach(S=>{if(S.name){need(80);starts["s:"+A.code+"|"+S.name]=P.pages.length-1;y+=6;P.text(M,y+13,S.name,{size:14,bold:true,color:C.goldInk});y+=19;P.line(M,y,M+90,y,C.gold,1);y+=10}
        S.keys.forEach(k=>{const it=BYKEY[k];need(64);starts[k]=P.pages.length-1;P.rect(M,y+2,3,15,C.l2);rich(it.t,{size:12.6,bold:true,color:C.l2,indent:8,after:0});
          P.text(M+8,y+8,`${it.area.code}${it.sp?" · "+it.sp:""}${it.own?" · Faculdade":""}${!it.own&&wOf(it)===3?"  ·  HY":""}`,{size:7.8,color:C.mut});y+=16;
          {const H=subList(it).filter(x=>x.hy).map(x=>x.t);if(H.length)rich(`**★ HY:** ${H.join(" · ")}`,{size:8.4,color:C.l2,indent:8,after:4,just:false})}/* Lote 21: os subtópicos que mais caem */
          body(opt.textOf?opt.textOf(k):notes[k],k);y+=10})})});
    if(free.length){if(!first){P.add();y=M}starts["a:FREE"]=P.pages.length-1;P.rect(M,y,36,3,C.gold);y+=14;P.text(M,y+20,opt.freeTitle||"Caderno livre",{size:21,bold:true,color:C.acc});y+=30;P.line(M,y,M+CW,y,C.line,.8);y+=12;
      free.forEach(f=>{need(60);starts["f:"+f.id]=P.pages.length-1;P.rect(M,y+2,3,15,C.l2);rich(f.t||"Sem título",{size:12.6,bold:true,color:C.l2,indent:8,after:1});
        if(f.tags.length||f.ks.length)rich([f.tags.map(t=>"#"+t).join(" "),f.ks.filter(k=>BYKEY[k]).map(k=>BYKEY[k].t).join(", ")].filter(Boolean).join(" · "),{size:8,color:C.mut,indent:8,after:3,just:false});body(f.b,"f:"+f.id);y+=10})}
    return {P,starts}};
  /* sumário: área › especialidade › tema, com a página */
  /* Lote 20C: com poucos temas, o sumário desce um nível e lista as seções (##, ###) de cada página */
  const deep=K.length+free.length<=3,heads=txt=>{const o=[];let fen=false;String(txt||"").replace(/\r/g,"").split("\n").forEach(l=>{if(/^\s*```/.test(l)){fen=!fen;return}if(fen)return;const m=l.match(/^(#{1,3})\s+(.*)/);if(m)o.push(m[2].replace(/\*\*|==/g,"").trim())});return o};
  const tocRows=[],hRows=(txt,id)=>{if(deep)heads(txt).forEach((h,i)=>tocRows.push({lv:4,t:h,id:"h:"+id+":"+i}))};
  groups.forEach(A=>{tocRows.push({lv:1,t:A.name,id:"a:"+A.code});A.sps.forEach(S=>{if(S.name)tocRows.push({lv:2,t:S.name,id:"s:"+A.code+"|"+S.name});S.keys.forEach(k=>{tocRows.push({lv:3,t:BYKEY[k].t,id:k});hRows(opt.textOf?opt.textOf(k):notes[k],k)})})});
  if(free.length){tocRows.push({lv:1,t:opt.freeTitle||"Caderno livre",id:"a:FREE"});free.forEach(f=>{tocRows.push({lv:3,t:f.t||"Sem título",id:"f:"+f.id});hRows(f.b,"f:"+f.id)})}
  const RH={1:24,2:18,3:15,4:13},tocPaged=()=>{const pg=[[]];let y=M+70;tocRows.forEach(r=>{const h=RH[r.lv]+(r.lv===1&&pg[pg.length-1].length?6:0);if(y+h>841.89-M-18){pg.push([]);y=M}pg[pg.length-1].push(r);y+=h});return pg};
  const TP=tocPaged(),off=1+TP.length;
  const mapOf=st=>{const m={};Object.keys(st).forEach(k=>m[k]=st[k]+off+1);return m};
  let pm={};tocRows.forEach(r=>pm[r.id]=99);let R=content(pm);for(let i=0;i<3;i++){const nm=mapOf(R.starts);if(JSON.stringify(nm)===JSON.stringify(pm))break;pm=nm;R=content(pm)}
  /* documento final: capa + sumário + conteúdo */
  const D=new MiniPDF(opt.title||"Anotações"),W=D.W,H=D.H,CW=W-2*M;
  D.rect(0,0,W,H,C.acc);D.rect(0,H-10,W,10,C.gold);
  D.line(M,150,M+70,150,C.gold,1.4);D.text(M,178,opt.kicker||"CADERNO  ·  REVISÃO GERAL",{size:10,bold:true,color:C.gold});
  const TL=pdfWrap(opt.title||"Minhas anotações",34,true,CW).slice(0,3),dy=(TL.length-1)*40;TL.forEach((l,i)=>D.text(M,226+i*40,l,{size:34,bold:true,color:C.white}));
  D.text(M,272+dy,opt.scope||"Todas as áreas",{size:15,color:C.soft});
  const nT=K.length;D.text(M,300+dy,`${nT} ${nT===1?"tema":"temas"}${free.length?` · ${free.length} ${free.length===1?"página":"páginas"} do caderno livre`:""} · ${groups.length} ${groups.length===1?"área":"áreas"}`,{size:10.5,color:C.soft});
  D.text(M,H-150,"DOCUMENTO PESSOAL",{size:8.5,bold:true,color:C.gold});D.text(M,H-128,(ui.profile.name||"").trim()||"Estudante",{size:15,bold:true,color:C.white});
  D.text(M,H-110,`Gerado em ${new Date().toLocaleDateString("pt-BR",{day:"numeric",month:"long",year:"numeric"})}`,{size:9.5,color:C.soft});
  D.text(M,H-60,"NEXUS",{size:12,bold:true,color:C.gold});D.text(M+pdfW("NEXUS ",12,true)+4,H-60,"Trilha Médica",{size:10,color:C.soft});
  TP.forEach((rows,pi)=>{D.add();let y=M;if(pi===0){D.rect(M,y,36,3,C.gold);y+=14;D.text(M,y+22,"Sumário",{size:24,bold:true,color:C.acc});y+=56}
    rows.forEach(r=>{if(r.lv===1&&y>M+70)y+=6;const sz=r.lv===1?12:r.lv===2?10.4:r.lv===3?9.4:8.6,ind=r.lv===1?0:r.lv===2?12:r.lv===3?24:38,b=r.lv<3,col=r.lv===1?C.acc:r.lv===2?C.goldInk:r.lv===3?C.ink:C.mut,pg=String(pm[r.id]||""),pw=pdfW(pg,sz,b);
      let t=r.t;const maxW=CW-ind-pw-24;while(pdfW(t,sz,b)>maxW&&t.length>4)t=t.slice(0,-2);if(t!==r.t)t=t.replace(/\s*\S?$/,"")+"…";
      D.text(M+ind,y+sz,t,{size:sz,bold:b,color:col});const tw=pdfW(t,sz,b),x0=M+ind+tw+6,x1=M+CW-pw-6;if(x1>x0){let dots="";while(pdfW(dots+" .",sz*.8,false)<x1-x0)dots+=" .";D.text(x0,y+sz,dots,{size:sz*.8,color:C.soft})}
      D.text(M+CW-pw,y+sz,pg,{size:sz,bold:b,color:col});y+=RH[r.lv]})});
  R.P.pages.forEach(pg=>D.pages.push(pg));
  const n=D.pages.length;D.pages.forEach((pg,i)=>{if(i===0)return;D.cur=pg;D.line(M,D.H-M+4,M+CW,D.H-M+4,C.line,0.4);D.text(M,D.H-M+16,`Nexus - Trilha Médica · ${opt.scope||"Anotações"}`,{size:7.6,color:C.mut});const t=`${i+1}`;D.text(M+CW-pdfW(t,7.6,false),D.H-M+16,t,{size:7.6,color:C.mut})});
  D.__pm=pm;D.__toc=tocRows;return opt.raw?D:D.output()}
/* ----- caderno livre: anotações que não são de um tema ----- */
const LSFR2="resid-free-v1";
let freeN=[],freeStore=null,freeEdit=null,freeTag="all",freeOpen=new Set(),freeArm=null;
function frOk(x){return !!x&&typeof x==="object"&&typeof x.id==="string"&&typeof x.b==="string"}
function frClean(x){return {id:x.id,t:typeof x.t==="string"?x.t.slice(0,120):"",b:x.b.slice(0,NOTE_MAX),tags:Array.isArray(x.tags)?x.tags.filter(t=>typeof t==="string"&&t.trim()).map(t=>t.trim().toLowerCase().slice(0,24)).slice(0,8):[],ks:Array.isArray(x.ks)?x.ks.filter(k=>typeof k==="string").slice(0,10):[],at:typeof x.at==="string"?x.at:new Date().toISOString()}}
try{const v=JSON.parse(localStorage.getItem(LSFR2)||"[]");if(Array.isArray(v))freeN=v.filter(frOk).map(frClean)}catch(e){}
function frSaveLocal(){try{localStorage.setItem(LSFR2,JSON.stringify(freeN))}catch(e){}}
async function frPut(x){frSaveLocal();if(!freeStore)return;const k="fr:"+x.id;try{await freeStore.doc(x.id).set({...x});saveOk(k)}catch(e){if(freeN.includes(x))saveFail(k,`a página “${x.t||"Sem título"}” do Caderno`,e,()=>frPut(x))}}
async function frDel(id){{const f=freeN.find(x=>x.id===id);if(f)toTrash("free",f.t||"Sem título",(f.b||"").replace(/\s+/g," ").slice(0,80),f)}freeN=freeN.filter(x=>x.id!==id);frSaveLocal();render();if(freeStore)try{await freeStore.doc(id).delete()}catch(e){}}
let frQ="",frQRaw="",frMsg="";
function freeVisible(){const Q=frQ||nQuery;return freeN.filter(f=>(freeTag==="all"||f.tags.includes(freeTag))&&(!Q||norm(f.t+" "+f.b+" "+f.tags.join(" ")).includes(Q))).sort((a,b)=>b.at.localeCompare(a.at))}
let nType=(()=>{const v=lsGet("resid-ntype","all");return ["all","free","topic"].includes(v)?v:"all"})();
function freeCard(){const c=el(`<section class="card nfree ns-free tfind" id="nFind" aria-labelledby="nfh"><div class="dhead"><h2 id="nfh">Caderno</h2><span class="tfcount" id="nFCount"></span><span class="sp"></span><button class="btn" id="nImg" type="button">📄 Ler arquivo</button><button class="btn primary" type="button" id="frNew">+ Nova página</button></div><div id="nImgBox"></div></section>`);
  c.querySelector("#frNew").onclick=()=>{freeEdit={t:"",b:"",tags:"",ks:[],q:""};render();setTimeout(()=>{const t=$("#frT"),ae=document.activeElement;if(t&&!(ae&&/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)))t.focus()},40)};
  if(freeEdit)c.appendChild(freeEditor());
  if(frMsg){const m=el(`<p class="pnote" role="status" id="frMsg"></p>`);m.textContent=frMsg;c.appendChild(m);frMsg=""}
  c.appendChild(el(`<p class="how ncadhow hx">Um caderno só: páginas livres (aula, plantão, dicas) e a página de cada tema, que é a mesma anotação da aba Residência. Página nova ligada a um tema que ainda não tem anotação vira a página dele.</p>`));
  {const sr=el(`<div class="tfsearch frsearch">${FC_ICO}<input class="search" id="frq" type="search" placeholder="Buscar no caderno (páginas livres e temas)" aria-label="Buscar no caderno" autocomplete="off"></div>`),i=sr.querySelector("input");i.value=frQRaw;
    i.oninput=debounced(()=>{frQRaw=i.value;frQ=norm(i.value.trim());nQuery=frQ;render();const x=$("#frq");if(x){x.focus();x.setSelectionRange(x.value.length,x.value.length)}});c.appendChild(sr)}
  c.appendChild(el(`<div class="tfilters" id="nFBody"></div>`));
  if(nType==="topic"||nNoNote)return c;
  if(!freeN.length&&!freeEdit){c.appendChild(el(`<p class="cempty">Páginas livres são para o que não é de um tema só: aula, plantão, dica de preceptor, lista de doses. Dê etiquetas (ex.: aula, plantão) e, se quiser, ligue a temas: a página aparece também dentro deles.</p>`));return c}
  if(nType==="all"&&freeN.length)c.appendChild(el(`<h3 class="nlisth">Páginas livres · ${freeN.length}</h3>`));
  const L=freeVisible(),ol=el(`<ol class="elist"></ol>`);if(!L.length&&freeN.length)ol.appendChild(el(`<li class="empty" style="padding:0">Nenhuma anotação livre com esses filtros.</li>`));
  L.forEach(f=>ol.appendChild(freeItem(f)));c.appendChild(ol);return c}
function freeItem(f){const open=freeOpen.has(f.id),li=el(`<li class="ncard" id="fr-${f.id}"><div class="ehead"><b class="frt"></b><span class="nloc"></span></div><div class="frlinks"></div><div class="mdview${open?"":" clamp"}"></div><div class="efoot"><button class="mini" type="button"></button><button class="mini" type="button">Editar</button><span class="sp"></span><button class="mini" type="button"></button></div></li>`);
  li.querySelector(".frt").textContent=f.t||"Sem título";li.querySelector(".nloc").textContent=`${f.tags.map(t=>"#"+t).join(" ")}${f.tags.length?" · ":""}${whenLabel(f.at)}`;
  const lk=li.querySelector(".frlinks");f.ks.filter(k=>BYKEY[k]).forEach(k=>{const b=el(`<button class="fchip" type="button"></button>`);b.textContent=BYKEY[k].t;b.onclick=()=>{detTab[k]="notas";openTopic(k)};lk.appendChild(b)});if(!lk.children.length)lk.remove();
  li.querySelector(".mdview").innerHTML=f.b.trim()?(open?md(f.b,{fold:"f:"+f.id}):mdC(f.b)):`<p class="mdempty">Sem texto.</p>`;if(open&&f.t)li.querySelector(".mdview").after(wkBackEl({kind:"f",id:f.id}));
  const [tg,ed,dl]=li.querySelectorAll(".efoot .mini");tg.textContent=open?"Recolher":"Ver tudo";tg.onclick=()=>{open?freeOpen.delete(f.id):freeOpen.add(f.id);render()};
  ed.onclick=()=>{freeEdit={id:f.id,t:f.t,b:f.b,tags:f.tags.join(", "),ks:[...f.ks],q:""};render();setTimeout(()=>{const e=$("#frB"),ae=document.activeElement;if(e&&!(ae&&/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)))e.focus()},40)};
  const armed=freeArm===f.id;dl.textContent=armed?"Toque de novo para excluir":"Excluir";if(armed)dl.classList.add("warn");dl.onclick=()=>{if(armed){freeArm=null;frDel(f.id)}else{freeArm=f.id;render()}};return li}
function freeEditor(){const E=freeEdit,w=el(`<div class="freeed"><label class="ffield">Título<input class="etext" id="frT" maxlength="120" placeholder="Ex.: Aula de cardiologia — IAM"></label>
  <div class="ffield">Texto<div class="ntools frtools" role="toolbar" aria-label="Formatação"></div><textarea class="ntext" id="frB" aria-label="Texto" maxlength="${NOTE_MAX}" placeholder="Use a mesma formatação das anotações: # título, - lista, > pegadinha, ==destaque==, **negrito**, [[tema]]."></textarea><div class="wkpop" role="listbox" aria-label="Temas e páginas" hidden></div></div>
  <label class="ffield">Etiquetas (separe por vírgula)<input class="etext" id="frTags" maxlength="120" placeholder="aula, plantão"></label>
  <div class="ffield">Ligar a temas<input class="etext" id="frQ" type="search" placeholder="Buscar tema para ligar" autocomplete="off"><div class="frks"></div><ul class="qrres frres"></ul></div>
  <div class="btns"><button class="btn primary" type="button" id="frSave">Salvar</button><button class="btn" type="button">Cancelar</button></div></div>`);
  const t=w.querySelector("#frT"),b=w.querySelector("#frB"),tg=w.querySelector("#frTags"),q=w.querySelector("#frQ");t.value=E.t;b.value=E.b;tg.value=E.tags;q.value=E.q;
  t.oninput=()=>E.t=t.value;
  {const K=v=>{E.b=v},pop=w.querySelector(".wkpop"),tb=w.querySelector(".frtools");
    [["Título","H",()=>prefix(b,K,"## ")],["Negrito","B",()=>wrap(b,K,"**","**","texto")],["Destaque","==",()=>wrap(b,K,"==","==","cai na prova")],["Lista","•",()=>prefix(b,K,"- ")],["Pegadinha",">",()=>pegInsert(b,K)],
     ["Link para um tema ou outra página: digite [[ e escolha na lista","[[ ]]",()=>{edit(b,K,(v,s0,e0)=>({v:v.slice(0,s0)+"[["+v.slice(e0),s:s0+2,e:s0+2}));wkPopUpdate(b,K,pop)}],
     ["Marcar uma questão ou um erro dos temas ligados","Selo",()=>{const o=w.querySelector(".nbpick");if(o){o.remove();return}tb.after(nbPickEl(b,K,()=>{const x=w.querySelector(".nbpick");if(x)x.remove();b.focus()},E.ks.filter(x=>BYKEY[x])))}]].forEach(([title,lab,fn])=>{
      const x=el(`<button type="button" class="tool"></button>`);x.textContent=lab;x.title=title;x.setAttribute("aria-label",title);x.onmousedown=e=>e.preventDefault();x.onclick=fn;tb.appendChild(x)});
    b.oninput=()=>{E.b=b.value;wkPopUpdate(b,K,pop)};b.onclick=()=>wkPopUpdate(b,K,pop);b.onblur=()=>setTimeout(()=>{if(document.activeElement!==b){pop.hidden=true;b._wk=null}},150);
    b.onkeydown=e=>{if(wkPopKey(e,b,K,pop))return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="b"){e.preventDefault();wrap(b,K,"**","**","texto")}
      if(e.key==="Tab"&&!e.ctrlKey&&!e.altKey&&!e.metaKey){const s0=b.selectionStart,e0=b.selectionEnd,v=b.value,ls=v.lastIndexOf("\n",s0-1)+1,line=v.slice(ls,(v.indexOf("\n",s0)+1||v.length+1)-1);
        if(v.slice(s0,e0).includes("\n")||/^\s*([-*\u2022]|\d+[.)]|>)(\s|$)/.test(line)){e.preventDefault();indentLines(b,K,e.shiftKey)}}}}tg.oninput=()=>E.tags=tg.value;q.oninput=debounced(()=>{if(freeEdit!==E)return;E.q=q.value;render()});
  const ks=w.querySelector(".frks");E.ks.filter(k=>BYKEY[k]).forEach(k=>{const c=el(`<button class="fchip" type="button"></button>`);c.textContent=BYKEY[k].t+" ×";c.onclick=()=>{E.ks=E.ks.filter(x=>x!==k);render()};ks.appendChild(c)});
  const n=norm((E.q||"").trim()),rs=w.querySelector(".frres");if(n.length>=2)[...ALL,...FAC_ITEMS].filter(x=>!E.ks.includes(x.key)&&norm(x.t+" "+(x.sp||"")).includes(n)).slice(0,6).forEach(x=>{const li=el(`<li><button type="button" class="qrpick"><b></b><span></span></button></li>`);li.querySelector("b").textContent=x.t;li.querySelector("span").textContent=`${x.own?"FAC":x.area.code} · ${x.sp||""}`;li.querySelector("button").onclick=()=>{E.ks.push(x.key);E.q="";render()};rs.appendChild(li)});
  const [sv,cc]=w.querySelectorAll(".btns .btn");
  sv.onclick=()=>{if(!E.t.trim()&&!E.b.trim())return;
    {const tk=E.ks.filter(k=>BYKEY[k]);if(!E.id&&tk.length===1&&!(notes[tk[0]]||"").trim()){const k=tk[0],ti=E.t.trim(),same=!ti||norm(ti)===norm(BYKEY[k].t);
      saveNote(k,(same?"":`## ${ti}\n\n`)+E.b.trim());{const T=E.tags.split(",").map(s=>s.trim()).filter(Boolean);if(T.length)tgAdd(k,T)}
      freeEdit=null;frMsg=`Virou a página do tema “${BYKEY[k].t}” (era a primeira anotação dele). Ela aparece aqui no caderno e na aba Anotações do tema${E.tags.trim()?", com as etiquetas":""}.`;render();return}}
    const x=frClean({id:E.id||"fr"+Date.now().toString(36)+Math.random().toString(36).slice(2,6),t:E.t.trim(),b:E.b,tags:E.tags.split(",").map(s=>s.trim()).filter(Boolean),ks:E.ks,at:new Date().toISOString()});
    const i=freeN.findIndex(f=>f.id===x.id);if(i>=0)freeN[i]=x;else freeN.push(x);freeEdit=null;frPut(x);render()};
  cc.onclick=()=>{freeEdit=null;render()};return w}
/* etiquetas da página do tema: state[k].tg (vão com o tema na conta e no backup) */
function tgOf(k){return Array.isArray(get(k).tg)?get(k).tg:[]}
function tgAdd(k,T){upd(k,x=>{const a=[...new Set([...(Array.isArray(x.tg)?x.tg:[]),...T.map(t=>t.replace(/^#/,"").trim().slice(0,30)).filter(Boolean)])].slice(0,12);if(a.length)x.tg=a;else delete x.tg});commit()}
function tgDel(k,t){upd(k,x=>{const a=(Array.isArray(x.tg)?x.tg:[]).filter(y=>y!==t);if(a.length)x.tg=a;else delete x.tg});commit()}
function tgRowEl(k){const w=el(`<div class="ntags" aria-label="Etiquetas da página"></div>`);tgOf(k).forEach(t=>{const b=el(`<button class="chip ntag" type="button"></button>`);b.textContent="#"+t+" ×";b.title="Tirar a etiqueta";b.onclick=()=>tgDel(k,t);w.appendChild(b)});
  const f=el(`<form class="ntagf"><input class="etext" maxlength="30" placeholder="+ etiqueta" aria-label="Nova etiqueta" id="ntg-${k}"></form>`);f.onsubmit=e=>{e.preventDefault();const v=f.querySelector("input").value.trim();if(v)tgAdd(k,v.split(","))};w.appendChild(f);return w}
/* anotações livres ligadas a um tema (aparecem dentro dele) */
function freeLinkedEl(k){const L=freeN.filter(f=>f.ks.includes(k)),has=!!(notes[k]||"").trim();
  const w=el(`<div class="grp frlinked"><div class="dbh"><span class="glabel">Outras páginas ligadas${L.length?" · "+L.length:""}</span><button class="mini" type="button" id="frlNew-${k}">+ Nova página ligada</button></div></div>`);
  const nb=w.querySelector("button");nb.onclick=()=>frOpenFor(k,null);
  if(!L.length)w.appendChild(el(`<p class="how">${has?"Páginas do caderno livre ligadas a este tema aparecem aqui: aula, caso clínico, comparação com outro tema…":"Ainda sem página do tema: a primeira página que você criar ligada a ele vira a página do tema (acima)."}</p>`));
  L.forEach(f=>{const d=el(`<details class="plain frl"><summary></summary><div class="mdview"></div><button class="link" type="button">Editar no Caderno</button></details>`);d.querySelector("summary").textContent=f.t||"Sem título";d.querySelector(".mdview").innerHTML=mdC(f.b||"");
    d.querySelector("button").onclick=()=>frOpenFor(k,f);w.appendChild(d)});return w}
/* abre o editor do caderno livre já ligado ao tema (página nova) ou numa página existente */
function frOpenFor(k,f){freeEdit=f?{id:f.id,t:f.t,b:f.b,tags:f.tags.join(", "),ks:[...f.ks],q:""}:{t:"",b:"",tags:"",ks:[k],q:""};nType="all";try{localStorage.setItem("resid-ntype","all")}catch(e){}frQ=frQRaw="";nQuery="";nNoNote=false;
  nSeg="livre";try{localStorage.setItem("resid-nseg2","livre")}catch(e){}setView("notas");setTimeout(()=>{const t=$(f?"#frB":"#frT");if(t){t.focus();t.scrollIntoView({block:"center"})}},60)}
