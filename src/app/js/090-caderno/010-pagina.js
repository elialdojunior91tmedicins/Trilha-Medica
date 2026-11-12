/* anotações */
const NOTE_MAX=60000;
let noteAt={}, noteMode={}, noteAI={}, noteUndo={}, focusKey=null, nQuery="", nArea="all", nOpen=new Set(), downloadsFn=null;
function wordCount(t){return (t.match(/\S+/g)||[]).length}
function whenLabel(iso){if(!iso)return "";const d=new Date(iso);if(isNaN(d))return "";
  const loc=x=>x.getFullYear()+"-"+x.getMonth()+"-"+x.getDate();const day=loc(d)===loc(new Date())?"hoje":d.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"});
  return day+" às "+d.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}
function saveNotesLocal(){try{localStorage.setItem(LSN,JSON.stringify(notes));localStorage.setItem(LSN+"-at",JSON.stringify(noteAt))}catch(e){}}
function setNoteStatus(k,t){document.querySelectorAll(`[data-ns="${k}"]`).forEach(s=>s.textContent=t)}
function noteFoot(k){const t=notes[k]||"";return t?`${wordCount(t)} palavras · editado ${whenLabel(noteAt[k])}`:"Salva automaticamente enquanto você escreve."}
function saveNote(k,v){const old=notes[k]||"";
  v=v.slice(0,NOTE_MAX);notes[k]=v;noteAt[k]=new Date().toISOString();if(!v.trim()){delete notes[k];delete noteAt[k];if(old.trim().length>=20)toTrash("note",topicName(k),"Anotação do tema",{k,t:old})}
  saveNotesLocal();
  document.querySelectorAll(`[data-nw="${k}"]`).forEach(s=>s.textContent=noteFoot(k));
  setNoteStatus(k,notesStore?"Salvando…":"Salvo neste navegador");
  clearTimeout(noteTimers[k]);if(!notesStore)return;
  noteTimers[k]=setTimeout(async()=>{noteTimers[k]=0;
    try{const d=notesStore.doc(k);if(notes[k])await d.set({t:notes[k],updatedAt:noteAt[k]});else await d.delete();
      setNoteStatus(k,"Salvo na sua conta");saveOk("nt:"+k)}
    catch(e){if(notes[k])saveFail("nt:"+k,`a anotação de ${topicName(k)}`,e,()=>saveNote(k,notes[k]));setNoteStatus(k,e&&e.code==="quota_exceeded"?"Espaço da conta cheio; ficou salvo neste navegador":"Não foi possível salvar na conta; ficou salvo neste navegador")}},900)}
function replaceNote(k,v){noteUndo[k]=notes[k]||"";saveNote(k,v)}

/* ===== Lote 18 › Caderno: modelos de página (Doença, Resumo de SP), cabeçalho da página, seções vazias somem na leitura, Pegadinhas em destaque,
   "+ Seção livre", cartão a partir de um trecho (seção inteira ou texto selecionado) e a leitura da véspera da prova. O modelo usado fica em state[k].nm ===== */
const TPL_DOENCA=`## Definição e causa\n\n\n## Quadro clínico\n\n\n## Diagnóstico\n\n\n## Tratamento\n\n\n## Diferenciais\n\n\n## Pegadinhas\n> `;
const NM_LAB={doenca:"Doença",sp:"Resumo de SP"};
/* SP ligada ao tema (para o modelo Resumo de SP): a SP do próprio conteúdo da faculdade ou a SP ativa que liga este tema */
function noteSP(k){const it=BYKEY[k];if(!it)return null;if(it.own){const o=fac.own[k.slice(2)];if(o&&o.spId){const d=discOf(o.discId),sp=d&&(d.sps||[]).find(x=>x.id===o.spId);if(sp)return sp}}
  const L=facLinkMap()[k];return L&&L.s||null}
function tplSP(k){const sp=noteSP(k);if(!sp)return "";return (sp.objs.length?sp.objs:["Objetivo 1"]).map(o=>`## ${o}\n\n`).join("\n")+`\n## Pegadinhas\n> `}
function useModel(k,m){const t=m==="sp"?tplSP(k):TPL_DOENCA;if(!t)return;const cur=(notes[k]||"").replace(/\s+$/,"");replaceNote(k,(cur?cur+"\n\n":"")+t);upd(k,x=>{x.nm=m});commit();noteMode[k]="editar";render()}
function modelBtns(k,cls){const w=el(`<span class="nmodels"></span>`);[["doenca","Modelo: Doença"],...(noteSP(k)?[["sp","Modelo: Resumo de SP"]]:[])].forEach(([m,lab])=>{const b=el(`<button type="button"></button>`);b.className=cls||"tool txt";b.id=`nm-${m}-${k}`;b.textContent=lab;b.onmousedown=e=>e.preventDefault();b.onclick=()=>useModel(k,m);w.appendChild(b)});return w}
/* cabeçalho da página: Caderno › especialidade › tema, com os selos RES · peso, FAC · SP e o modelo */
function npathEl(k){const it=BYKEY[k],s=get(k),L=facLinkMap()[k],sp=noteSP(k),w=el(`<div class="npath"><span class="ncrumb"></span><span class="nsels"></span></div>`);
  w.querySelector(".ncrumb").textContent=["Caderno",it.sp||it.area.name,it.t].join(" › ");const S=w.querySelector(".nsels"),add=(t,c)=>{const x=el(`<span class="nsel"></span>`);x.textContent=t;if(c)x.classList.add(c);S.appendChild(x)};
  if(!it.own&&it.area!==FAC_AREA)add(`RES · peso ${wOf(it)}`,"res");if(sp)add(`FAC · ${spShort(sp.name)}`,"fac");else if(L)add(`FAC · ${L.d.name}`,"fac");else if(it.own)add("FAC","fac");if(s.nm&&NM_LAB[s.nm])add(`Modelo ${NM_LAB[s.nm]}`,"mod");return w}
/* leitura: seções vazias somem, Pegadinhas em destaque, cada seção com "+ Criar cartão do trecho" */
function noteDress(rv,k){rv.dataset.nk=k;rv.querySelectorAll("li").forEach(li=>{const s=li.querySelector(":scope > strong, :scope > b");if(s&&/^Da questão:?$/.test(s.textContent.trim())){li.classList.add("daq");const ul=document.createElement("ul");ul.className="daqsub";let n=li.nextElementSibling;while(n&&n.tagName==="LI"&&/\bsub[23]\b/.test(n.className)){const nx=n.nextElementSibling;ul.appendChild(n);n=nx}if(ul.children.length){li.appendChild(ul);const fb=li.querySelector(":scope > .lfold");if(fb)fb.remove()}}});
  [...rv.querySelectorAll("details.mdsec")].reverse().forEach(d=>{const b=d.querySelector(":scope>.mdsb");if(!b||!b.textContent.replace(/\s|\[\[\s*\]\]/g,"").trim()&&!b.querySelector("img,table,.flow"))d.remove()});
  rv.querySelectorAll("details.mdsec").forEach(d=>{const sm=d.querySelector(":scope>summary"),t=sm?sm.textContent.trim():"";if(/^pegadinhas?\b/i.test(t))d.classList.add("peg");
    const b=d.querySelector(":scope>.mdsb");if(!b||d.querySelector(":scope>.mdsb>details.mdsec"))return;const x=el(`<button type="button" class="ntrecho">+ Criar cartão do trecho</button>`);
    x.onclick=()=>trStart(k,(t+": "+b.textContent.replace(/\s+/g," ").trim()).slice(0,900));b.appendChild(x)})}
/* cartão a partir de um trecho: rascunho do app (lacuna no termo em negrito/destaque, ou "termo: definição") + "Melhorar com o Claude" */
let trE={};
function trDrafts(k,txt){const it=BYKEY[k],L=esc(cdLabel(it)),t=txt.replace(/\s+/g," ").trim(),src=notes[k]||"",out=[];
  const strong=(src.match(/\*\*([^*\n]{2,80})\*\*|==([^=\n]{2,80})==/g)||[]).map(x=>x.replace(/\*\*|==/g,"")).find(x=>t.includes(x));
  if(strong){out.push({kind:"lac",q:`<b>${L}.</b> ${esc(clCut(t,300)).replace(esc(strong),"[...]")}`,a:`<b>${esc(strong)}</b><br><br><i>${esc(clCut(t,300))}</i>`,ref:"",keep:true})}
  const m=t.match(/^(.{3,120}?)\s*[:=–—-]\s+(.{3,})$/);
  if(m)out.push({kind:"disc",q:`<b>${L}.</b> ${esc(m[1])}?`,a:`<b>${esc(clCut(m[2],220))}</b>`,ref:"",keep:!strong});
  if(!out.length)out.push({kind:"disc",q:`<b>${L}.</b> O que você precisa lembrar sobre: ${esc(clCut(t,140))}`,a:`<b>${esc(clCut(t,300))}</b>`,ref:"",keep:true});
  return out}
function trStart(k,txt){const id="tr-"+k;delete cdErr[id];trE[k]={id,virtual:true,trecho:txt,hy:/★/.test(txt),k,okq:true,w:"",p:"",r:txt,t:"conhecimento",c:"",s:"",onSaved:ids=>{tcMsg[k]=`${ids.length} ${ids.length===1?"cartão guardado":"cartões guardados"} em Caderno › Revisar.`;delete trE[k]}};
  cdErr[id]={list:trDrafts(k,txt)};trSel=null;render();setTimeout(()=>{const x=document.querySelector(`.cderr[data-eid="${id}"]`);if(x)x.scrollIntoView({behavior:"smooth",block:"center"})},60)}
let tcMsg={},trSel=null;
function trPrompt(e){const it=BYKEY[e.k];return `Você cria flashcards no Padrão Osler (Anki) para um estudante de medicina, a partir de um TRECHO da anotação dele.
Tema: ${it?it.t:""} (${it?areaLabel(it):""}).
Trecho: ${String(e.trecho||"").slice(0,1500)}

Crie de 1 a 3 cartões que cubram o que é importante neste trecho (pergunta direta, lacuna com [...] ou contraste). Um conceito por cartão.
Regras do Padrão Osler:
- Question: rótulo da ENTIDADE específica em <b>negrito</b> terminado em ponto, depois a pergunta ou lacuna; o rótulo não pode entregar a resposta.
- Answer: 1ª linha = resposta em <b>negrito</b>; depois <br><br><i>explicação curta</i>. "Note:" só quando houver armadilha.
- Reference: só se o trecho citar a fonte; senão "".
- Só as tags HTML b, i, u, br, ul, ol, li.
Responda apenas com um array JSON: [{"tipo":"discriminador"|"lacuna"|"contraste","question":"...","answer":"...","reference":"..."}]
Escreva em português do Brasil.`}
/* texto selecionado numa página do tema (modo Ler): aparece "Criar cartão com o trecho" */
document.addEventListener("selectionchange",()=>{const sl=window.getSelection&&window.getSelection(),tx=sl&&String(sl).replace(/\s+/g," ").trim();let k=null;
  if(tx&&tx.length>=8&&sl.rangeCount){const n=sl.getRangeAt(0).commonAncestorContainer,e=n.nodeType===1?n:n.parentElement,v=e&&e.closest&&e.closest(".mdview[data-nk]");if(v)k=v.dataset.nk}
  const b=document.getElementById("trSelBtn");if(k){trSel={k,tx:tx.slice(0,900)};if(!b){const x=el(`<button type="button" id="trSelBtn" class="trselbtn">+ Cartão com o trecho selecionado</button>`);x.onmousedown=e=>e.preventDefault();x.onclick=()=>{if(trSel)trStart(trSel.k,trSel.tx)};document.body.appendChild(x)}}
  else if(b){setTimeout(()=>{const s2=window.getSelection&&String(window.getSelection()).trim();if(!s2){const bb=document.getElementById("trSelBtn");if(bb)bb.remove();trSel=null}},200)}});
/* leitura da véspera: as páginas dos conteúdos da prova numa leitura só (Caderno) */
let nProvaRd=null;
function provaReadKeys(p){return topicKeysOf(p.items).filter(k=>(notes[k]||"").trim())}
function provaReadEl(){const p=fac.provas.find(x=>x.id===nProvaRd);if(!p){nProvaRd=null;return null}const K=provaReadKeys(p);
  const c=el(`<section class="card nprova" id="nProvaRead"><div class="dhead"><h2></h2><button class="link" type="button">Fechar a leitura</button></div><p class="how"></p></section>`);
  c.querySelector("h2").textContent=`Leitura da prova · ${p.name}`;c.querySelector(".dhead .link").onclick=()=>{nProvaRd=null;render()};
  c.querySelector("p.how").textContent=`${K.length} ${K.length===1?"página":"páginas"} dos conteúdos da prova (${inLabel(daysTo(p.date))}), numa leitura só. As seções vazias não aparecem; toque no título de uma seção para recolher.`;
  K.forEach(k=>{const it=BYKEY[k],sec=el(`<article class="nprp"></article>`);sec.appendChild(npathEl(k));const v=el(`<div class="mdview"></div>`);v.innerHTML=md(notes[k],{fold:k});noteDress(v,k);sec.appendChild(v);
    const a=el(`<button class="link" type="button">Abrir o tema</button>`);a.onclick=()=>{detTab[k]="notas";openTopic(k)};sec.appendChild(a);c.appendChild(sec)});
  if(!K.length)c.appendChild(el(`<p class="cempty">Nenhum conteúdo desta prova tem página no Caderno ainda.</p>`));return c}
function provaReadGo(p){nProvaRd=p.id;nSeg="livre";try{localStorage.setItem("resid-nseg2","livre")}catch(e){}backStack=[];setView("notas");setTimeout(()=>{const x=$("#nProvaRead");if(x)x.scrollIntoView({behavior:"smooth",block:"start"})},60)}
function tplErros(it){const mine=errors.filter(e=>e.k===it.key).sort(byNewest);
  return mine.length?"## Meus erros neste tema\n"+mine.map(e=>"- "+e.r.replace(/\s*\n\s*/g," — ")).join("\n"):null}

/* Claude: gerar resumo ou organizar */
function notePrompt(it,kind){
  const subs=subList(it).map(x=>x.t), errs=errors.filter(e=>e.k===it.key).sort(byNewest).slice(0,8).map(e=>"- "+e.r.replace(/\s+/g," ").slice(0,240));
  const fmt=`Use apenas esta formatação, sem nenhuma outra:
- "## " para títulos de seção
- "- " para tópicos e "1. " para passos de conduta
- **negrito** para termos-chave e ==destaque== para o que mais cai em prova
- tabelas com "|" para quadros comparativos (linha de cabeçalho, depois |---|)
- linhas começando com "> " para pegadinhas e alertas
Responda só com o texto das anotações, em português do Brasil, sem introdução nem despedida.`;
  if(kind==="resumo")return `Você é um professor de cursinho de residência médica no Brasil, com foco no Enamed. Escreva um resumo de revisão do tema "${it.t}" (área: ${areaLabel(it)}).
Organize por estes subtópicos, um título para cada, priorizando o que as bancas mais cobram: ${subs.join("; ")}.
Seja objetivo: frases curtas, tópicos, critérios e condutas. Inclua ao menos um quadro comparativo quando houver diagnósticos diferenciais ou condutas que se confundem, e uma seção final "## Pegadinhas de prova".
Siga diretrizes brasileiras atuais (Ministério da Saúde e sociedades brasileiras). Não invente doses, valores ou critérios; quando um dado depende de protocolo que muda com frequência, escreva "> Conferir na diretriz vigente: ..." no ponto.`+
    (errs.length?`\nO estudante errou questões sobre os pontos abaixo; dê destaque a eles:\n${errs.join("\n")}`:"")+`\n\n${fmt}`;
  return `Reorganize as anotações de estudo abaixo, do tema "${it.t}" (residência médica, foco Enamed), em um resumo bem estruturado.
Regras:
- Mantenha todas as informações do estudante; não remova conteúdo.
- Agrupe por assunto com títulos, transforme textos corridos em tópicos e comparações em tabelas.
- Não acrescente fatos novos. Se algo parecer incorreto ou desatualizado, mantenha e sinalize logo abaixo com "> Verificar: ...".
- Se faltar algum destes subtópicos importantes, liste no final em "## Lacunas para estudar": ${subs.join("; ")}.

${fmt}

Anotações do estudante:
"""
${(notes[it.key]||"").slice(0,NOTE_MAX)}
"""`;
}
async function noteClaude(it,kind){
  if(!sampleFn)return;const k=it.key;
  const a=noteAI[k]={kind,status:"loading",text:"",msg:"",ctl:new AbortController()};render();
  try{
    const r=await sampleFn(notePrompt(it,kind),{signal:a.ctl.signal,cache:false,modelTier:"default",
      onText:({text})=>{a.text=text;const pv=document.getElementById("ai-"+k);if(pv)pv.innerHTML=md(text)}});
    if(noteAI[k]!==a)return;
    a.text=(r.text||"").trim();a.status=a.text?"done":"error";
    a.msg=a.text?(r.truncated?"O texto foi cortado por ser longo. Você pode inserir assim mesmo ou tentar com o foco em menos subtópicos.":""):"O Claude não devolveu texto. Tente de novo.";
  }catch(e){if(noteAI[k]!==a)return;const code=e&&e.code;
    if(code==="cancelled"){a.text?(a.status="done",a.msg="Interrompido. Você pode usar o que já foi escrito."):delete noteAI[k]}
    else{a.status="error";a.text="";a.msg=GEN_OFF.includes(code)?"O Claude não está disponível nesta visualização.":(GEN_ERR[code]||"Não foi possível agora. Tente novamente.")}}
  render();
}

function renderNotes(it,full){
  const k=it.key, has=!!(notes[k]||"").trim(), mode=noteMode[k]||(has?"ler":"editar");
  const box=el(`<div class="grp notes${full?" full":""}"></div>`);
  const head=el(`<div class="nhead"><span class="glabel">Página do tema<small class="nhint">também no Caderno</small></span><div class="seg nseg" role="group" aria-label="Modo das anotações"></div><span class="sp"></span></div>`);
  [["editar","Editar"],["ler","Ler"]].forEach(([v,lab])=>{const b=el(`<button type="button" aria-pressed="${mode===v}">${lab}</button>`);b.onclick=()=>{noteMode[k]=v;render();if(v==="editar"){const t=document.getElementById((full?"fnt-":"nt-")+k);if(t)t.focus()}};head.querySelector(".nseg").appendChild(b)});
  const fb=el(`<button class="mini" type="button">${full?"Fechar tela cheia":"Tela cheia"}</button>`);fb.onclick=()=>{focusKey=full?null:k;render()};head.appendChild(fb);
  box.appendChild(head);
  if(mode==="editar"){
    const tb=el(`<div class="ntools" role="toolbar" aria-label="Formatação"></div>`);
    const ta=el(`<textarea class="ntext" maxlength="${NOTE_MAX}" placeholder="Escreva seu resumo, macetes e pegadinhas. Use a barra acima para formatar ou um dos modelos."></textarea>`);
    ta.id=(full?"fnt-":"nt-")+k;ta.setAttribute("aria-label","Anotações de "+it.t);ta.value=notes[k]||"";
    const T=[["Título","H",()=>prefix(ta,k,"## ")],["Negrito","B",()=>wrap(ta,k,"**","**","texto")],["Destaque","==",()=>wrap(ta,k,"==","==","cai na prova")],
      ["Lista","•",()=>prefix(ta,k,"- ")],["Lista numerada","1.",()=>prefix(ta,k,"",true)],["Pegadinha",">",()=>pegInsert(ta,k)],["Cai muito em prova (HY): marca a linha com ★","★",()=>hyInsert(ta,k)],["Link (cole o endereço de uma foto no Drive, Google Fotos ou site)","Link",()=>edit(ta,k,(v,s0,e0)=>{const sel=v.slice(s0,e0)||"texto",ins=`[${sel}](https://)`,u=s0+sel.length+3;return {v:v.slice(0,s0)+ins+v.slice(e0),s:u,e:u+8}})],["Fluxograma","Fluxo",()=>insertBlock(ta,k,"```fluxo\nPrimeira etapa\n? Pergunta\n  Sim: conduta\n  Não: outra conduta\nEtapa final\n```")],["Tabela comparativa","Tabela",()=>insertBlock(ta,k,TPL_TABELA)],["Link para outro tema ou página: digite [[ e escolha na lista","[[ ]]",()=>{edit(ta,k,(v,s0,e0)=>{const ins="[[";return {v:v.slice(0,s0)+ins+v.slice(e0),s:s0+2,e:s0+2}});wkPopUpdate(ta,k,pop)}],["Marcar uma questão ou um erro deste tema na linha","Selo",()=>{const o=box.querySelector(".nbpick");if(o){o.remove();return}tb.after(nbPickEl(ta,k,()=>{const x=box.querySelector(".nbpick");if(x)x.remove();ta.focus()}))}]];
    const pop=el(`<div class="wkpop" role="listbox" aria-label="Temas e páginas" hidden></div>`);
    T.forEach(([title,lab,fn])=>{const b=el(`<button type="button" class="tool"></button>`);b.textContent=lab;b.title=title;b.setAttribute("aria-label",title);b.onmousedown=e=>e.preventDefault();b.onclick=fn;tb.appendChild(b)});
    const sep=el(`<span class="tsep" aria-hidden="true"></span>`);tb.appendChild(sep);
    tb.appendChild(modelBtns(k));
    [["Modelo de resumo",()=>insertBlock(ta,k,TPL_RESUMO)],["Seções dos subtópicos",()=>insertBlock(ta,k,tplSubs(it))]].forEach(([lab,fn])=>{
      const b=el(`<button type="button" class="tool txt"></button>`);b.textContent=lab;b.onmousedown=e=>e.preventDefault();b.onclick=fn;
      if(lab==="Meus erros"&&!errors.some(e=>e.k===k)){b.disabled=true;b.title="Nenhum erro deste tema no caderno"}tb.appendChild(b)});
    ta.oninput=()=>{saveNote(k,ta.value);wkPopUpdate(ta,k,pop)};ta.onblur=()=>setTimeout(()=>{if(document.activeElement!==ta){pop.hidden=true;ta._wk=null}},150);ta.onclick=()=>wkPopUpdate(ta,k,pop);
    ta.onkeydown=e=>{if(wkPopKey(e,ta,k,pop))return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="b"){e.preventDefault();wrap(ta,k,"**","**","texto")}
      if(e.key==="Tab"&&!e.ctrlKey&&!e.altKey&&!e.metaKey){const s0=ta.selectionStart,e0=ta.selectionEnd,v=ta.value,ls=v.lastIndexOf("\n",s0-1)+1,line=v.slice(ls,(v.indexOf("\n",s0)+1||v.length+1)-1);
        if(v.slice(s0,e0).includes("\n")||/^\s*([-*\u2022]|\d+[.)]|>)(\s|$)/.test(line)){e.preventDefault();indentLines(ta,k,e.shiftKey);return}}
      if(e.key==="Enter"&&!e.shiftKey){const s=ta.selectionStart,v=ta.value,ls=v.lastIndexOf("\n",s-1)+1,line=v.slice(ls,s);const m=line.match(/^(\s*)([-*\u2022]|\d+[.)]|>)\s+/);
        if(m&&s===ta.selectionEnd){e.preventDefault();if(line.trim()===m[0].trim()){edit(ta,k,(v)=>({v:v.slice(0,ls)+v.slice(s),s:ls,e:ls}));return}
          const nx=/\d/.test(m[2])?(parseInt(m[2])+1)+m[2].replace(/\d+/,""):m[2];const ins="\n"+m[1]+nx+" ";edit(ta,k,(v)=>({v:v.slice(0,s)+ins+v.slice(s),s:s+ins.length,e:s+ins.length}))}}};
    box.append(tb,ta,pop);
  }else{
    const rv=el(`<div class="mdview"></div>`);
    if(has)box.appendChild(npathEl(k));
    if(has){rv.innerHTML=md(notes[k],{fold:k});noteDress(rv,k);if(rv.querySelector("details.mdsec")){const all=el(`<button class="mini" type="button" id="nfold-${k}"></button>`),anyClosed=!!rv.querySelector("details.mdsec:not([open])");all.textContent=anyClosed?"Abrir tudo":"Fechar tudo";
        all.onclick=()=>{const D=[...document.querySelectorAll(`details.mdsec[data-fk="${k}"]`)],op=D.some(d=>!d.open);D.forEach(d=>{d.open=op});all.textContent=op?"Fechar tudo":"Abrir tudo"};head.insertBefore(all,fb)}}else{rv.classList.add("mdempty");rv.textContent="Nada anotado ainda. Comece com um modelo, toque em Editar para escrever ou peça um resumo ao Claude.";const mb=modelBtns(k,"btn");mb.classList.add("nmstart");rv.appendChild(mb)}
    box.appendChild(rv);
    if(has){const a=el(`<div class="nreadacts"><button class="mini" type="button">+ Seção livre</button><span class="how">Selecione um trecho para criar um cartão com ele.</span></div>`);a.querySelector("button").id="nsec-"+k;
      a.querySelector("button").onclick=()=>{const cur=(notes[k]||"").replace(/\s+$/,"");replaceNote(k,cur+"\n\n## Nova seção\n");noteMode[k]="editar";render();setTimeout(()=>{const t=document.getElementById((full?"fnt-":"nt-")+k);if(t){t.focus();const i=t.value.lastIndexOf("Nova seção");t.setSelectionRange(i,i+10)}},40)};box.appendChild(a)}
    if(trE[k])box.appendChild(cdErrEl(trE[k]));
    if(tcMsg[k]){const m=el(`<p class="pnote" role="status"></p>`);m.textContent=tcMsg[k];delete tcMsg[k];box.appendChild(m)}
  }
  const foot=el(`<div class="nfoot"><span data-nw="${k}"></span><span class="nstat" data-ns="${k}"></span></div>`);
  foot.firstChild.textContent=noteFoot(k);if(has||tgOf(k).length)foot.appendChild(tgRowEl(k));
  if(noteUndo[k]!==undefined){const u=el(`<button class="link" type="button">Desfazer última substituição</button>`);u.onclick=()=>{const v=noteUndo[k];delete noteUndo[k];saveNote(k,v);render()};foot.appendChild(u)}
  box.appendChild(foot);
  box.appendChild(wkBackEl({kind:"t",id:k}));
  // Claude
  if(!sampleOff){const a=noteAI[k];
    const cb=el(`<div class="nai"></div>`);
    if(!a||a.status!=="loading"){const row=el(`<div class="btns"></div>`);
      const g=el(`<button class="btn" type="button">Gerar resumo com o Claude</button>`);g.onclick=()=>noteClaude(it,"resumo");
      const o=el(`<button class="btn" type="button">Organizar minhas anotações</button>`);o.onclick=()=>noteClaude(it,"organizar");
      if(!sampleFn){g.disabled=o.disabled=true}if(!has){o.disabled=true;o.title="Escreva algo primeiro"}
      const im=el(`<button class="btn" type="button">📷 Ler imagem</button>`);im.title="Envie uma foto (slide, livro, caderno, esquema, ECG) e o Claude escreve um resumo com fluxograma";im.onclick=()=>imgStart(k);if(!sampleFn)im.disabled=true;
      row.append(g,o,im);cb.appendChild(row)}
    if(imgR&&imgR.from===k)cb.appendChild(imgPanel());
    if(a){
      const title=a.kind==="resumo"?"Resumo sugerido pelo Claude":"Anotações organizadas pelo Claude";
      const pv=el(`<div class="aiprev"><div class="aihead"><span class="glabel"></span></div><div class="mdview" id="ai-${k}"></div></div>`);
      pv.querySelector(".glabel").textContent=title+(a.status==="loading"?" · escrevendo…":"");
      pv.querySelector(".mdview").innerHTML=a.text?md(a.text):`<p class="gstatus">${a.status==="loading"?"Preparando… pode levar até um minuto.":""}</p>`;
      if(a.status==="loading"){const s=el(`<button class="mini" type="button">Parar</button>`);s.onclick=()=>a.ctl.abort();pv.querySelector(".aihead").appendChild(s)}
      if(a.msg){const p=el(`<p class="${a.status==="error"?"err":"gstatus"}"></p>`);p.textContent=a.msg;pv.appendChild(p)}
      if(a.status==="done"){const acts=el(`<div class="btns"></div>`);
        const ins=el(`<button class="btn primary" type="button">${has?"Inserir no fim":"Usar como anotação"}</button>`);ins.onclick=()=>{const cur=(notes[k]||"").replace(/\s+$/,"");replaceNote(k,cur?cur+"\n\n---\n\n"+a.text:a.text);delete noteAI[k];noteMode[k]="ler";render()};
        acts.appendChild(ins);
        if(has){const rep=el(`<button class="btn" type="button">Substituir minhas anotações</button>`);rep.onclick=()=>{replaceNote(k,a.text);delete noteAI[k];noteMode[k]="ler";render()};acts.appendChild(rep)}
        const ds=el(`<button class="btn" type="button">Descartar</button>`);ds.onclick=()=>{delete noteAI[k];render()};acts.appendChild(ds);
        pv.appendChild(acts);
        pv.appendChild(el(`<p class="gstatus">Texto gerado por IA: confira doses, critérios e condutas na diretriz antes de confiar.</p>`))}
      if(a.status==="error"&&!a.text){const ds=el(`<button class="mini" type="button">Fechar</button>`);ds.onclick=()=>{delete noteAI[k];render()};pv.appendChild(ds)}
      cb.appendChild(pv)}
    box.appendChild(cb)}
  return box;
}

/* tela cheia */
function renderFocus(){
  let ov=document.getElementById("focusOv");
  if(!focusKey||!BYKEY[focusKey]){if(ov)ov.remove();document.body.classList.remove("noscroll");return}
  const it=BYKEY[focusKey];
  const active=document.activeElement&&document.activeElement.id==="fnt-"+focusKey?[document.activeElement.selectionStart,document.activeElement.selectionEnd]:null;
  if(!ov){ov=el(`<div id="focusOv" class="focusov" role="dialog" aria-modal="true"></div>`);document.body.appendChild(ov)}
  ov.setAttribute("aria-label","Anotações de "+it.t);ov.innerHTML="";
  const inner=el(`<div class="focusin"><div class="ftitle"><span class="code">${it.area.code}</span><h2></h2></div></div>`);inner.querySelector("h2").textContent=it.t;
  inner.appendChild(renderNotes(it,true));ov.appendChild(inner);document.body.classList.add("noscroll");
  if(active){const t=document.getElementById("fnt-"+focusKey);if(t){t.focus();t.setSelectionRange(active[0],active[1])}}
}
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&focusKey){focusKey=null;render()}});

/* aba Anotações */
function notesMarkdown(keys){return [...keys].sort((x,y)=>BYKEY[x].num-BYKEY[y].num).map(k=>{const it=BYKEY[k];return `# ${it.t}\n_${it.area.name} · ${it.sp}_\n\n${notes[k].trim()}`}).join("\n\n---\n\n")}
const N_PAGE=30;let nLimit=N_PAGE;
/* sumário lateral das anotações (computador com espaço à direita): área › especialidade › tema, acompanha a rolagem */
let nTocObs=null,nPdfOpt=null;
function nTocRender(shown,more){nTocRender.last=[shown,more];const T=$("#nToc"),V=$("#viewNotas");if(nTocObs){nTocObs.disconnect();nTocObs=null}
  const pl=parseFloat(getComputedStyle(document.body).paddingLeft)||0,room=window.innerWidth-pl-32,on=view==="notas"&&twoCols()&&!nNoNote&&shown.length>=2&&room>=1000&&!V.classList.contains("vfull");
  V.classList.toggle("hastoc",on);T.hidden=!on;T.innerHTML="";if(!on)return;
  T.appendChild(el(`<div class="ntoch"><b>Nesta página</b><span>${shown.length} ${shown.length===1?"tema":"temas"}${more?" (mostre mais para ver o resto)":""}</span></div>`));
  const ul=el(`<ul class="ntocl"></ul>`);let la="",ls="";
  const ord=[...shown];if(nSort!=="sp"){}else{}
  ord.forEach(k=>{const it=BYKEY[k];if(it.area.code!==la){la=it.area.code;ls="";ul.appendChild(el(`<li class="nta">${esc(it.area.code)} <span>${esc(it.area.name)}</span></li>`))}
    if(nSort==="sp"&&(it.sp||"")!==ls){ls=it.sp||"";if(ls)ul.appendChild(el(`<li class="nts">${esc(ls)}</li>`))}
    const li=el(`<li class="ntt"><button type="button"></button></li>`),b=li.querySelector("button");b.textContent=it.t;b.dataset.k=k;b.onclick=()=>{const c=document.getElementById("nc-"+k);if(c)window.scrollTo({top:c.getBoundingClientRect().top+scrollY-16,behavior:"smooth"})};ul.appendChild(li)});
  if(freeN.length&&$("#nFreeBox").firstChild){const li=el(`<li class="nta ntfree"><button type="button">Caderno livre</button></li>`);li.querySelector("button").onclick=()=>{const c=$("#nFreeBox");if(c)c.scrollIntoView({block:"start",behavior:"smooth"})};ul.appendChild(li)}
  T.appendChild(ul);
  if("IntersectionObserver" in window){const seen=new Map();nTocObs=new IntersectionObserver(es=>{es.forEach(e=>seen.set(e.target.id,e.isIntersecting?e.boundingClientRect.top:null));
      let best=null,bt=1e9;seen.forEach((t,id)=>{if(t!==null&&Math.abs(t)<bt){bt=Math.abs(t);best=id}});if(!best)return;const k=best.slice(3);
      T.querySelectorAll(".ntt button").forEach(b=>{const on=b.dataset.k===k;b.toggleAttribute("aria-current",on);if(on){const r=b.getBoundingClientRect(),tr=T.getBoundingClientRect();if(r.top<tr.top+40||r.bottom>tr.bottom-10)T.scrollTop+=r.top-tr.top-T.clientHeight/2}})},{rootMargin:"-10% 0px -60% 0px"});
    shown.forEach(k=>{const c=document.getElementById("nc-"+k);if(c)nTocObs.observe(c)})}}
addEventListener("resize",()=>{if(view==="notas"){clearTimeout(nTocRender._t);nTocRender._t=setTimeout(()=>render(),200)}});
function renderNotasView(){
  const keys=[...ALL,...FAC_ITEMS].filter(i=>(notes[i.key]||"").trim()).map(i=>i.key);
  $("#ncount").textContent=keys.length?String(keys.length):"";
  const words=keys.reduce((s,k)=>s+wordCount(notes[k]),0);
  $("#nsum").textContent=keys.length?`${keys.length} ${keys.length===1?"tema anotado":"temas anotados"} de ${TOTAL} · ${words.toLocaleString("pt-BR")} palavras`:"Nenhuma anotação ainda.";
  const vis=keys.filter(k=>(nArea==="all"||BYKEY[k].area.code===nArea)&&(nArea==="all"||nSp==="all"||BYKEY[k].sp===nSp)&&(!nQuery||norm(BYKEY[k].t+" "+notes[k]+" "+tgOf(k).join(" ")).includes(nQuery))&&(freeTag==="all"||tgOf(k).includes(freeTag))&&nFlagOk(k));
  {const fb=$("#nFreeBox");fb.innerHTML="";if(nProvaRd){const r=provaReadEl();if(r)fb.appendChild(r)}fb.appendChild(freeCard())}renderNFlags(keys,vis);
  {const L=$("#nlist"),H=$("#nTopicH"),hideT=nType==="free"&&!nNoNote;L.hidden=hideT;H.hidden=hideT||(nType!=="all"&&!nNoNote);
    H.textContent=nNoNote?"Temas estudados sem anotação":`Páginas dos temas · ${keys.length}`;$("#nPdf")&&($("#nPdf").closest("section").hidden=false)}
  {const ib=$("#nImgBox");ib.innerHTML="";if(imgR&&!imgR.from)ib.appendChild(imgPanel());const nb=$("#nImg");nb.hidden=sampleOff;nb.disabled=!sampleFn;nb.onclick=()=>imgStart(null)}
  // partes (celular e tablet em pé), revisar hoje, cartões, pegadinhas e cobertura
  {const vn=$("#viewNotas");vn.dataset.nseg=nSeg;const dn=cdDue().length,tn=0;
   $("#nSegBar").querySelectorAll("button").forEach(b=>{b.setAttribute("aria-pressed",b.dataset.n===nSeg);b.innerHTML={livre:"Caderno",revisar:"Revisar"+(dn+tn?`<b>${dn+tn}</b>`:""),pegadinhas:"Pegadinhas"}[b.dataset.n];b.onclick=()=>setNSeg(b.dataset.n)});
   const rb=$("#nRevBox");rb.innerHTML="";rb.append(nCardsCard());{const nn=noNoteKeys().length;if(nn){const l=el(`<p class="how nnoline" id="nNoLine"><span></span> <button class="link" type="button">ver</button></p>`);
     l.querySelector("span").textContent=`${nn} ${nn===1?"tema estudado sem anotação":"temas estudados sem anotação"}.`;l.querySelector("button").onclick=()=>{nNoNote=true;if(nType==="free"){nType="all";lsSet("resid-ntype","all")}setNSeg("livre");render();setTimeout(()=>{const x=$("#nTopicH");if(x)x.scrollIntoView({block:"start",behavior:"smooth"})},60)};rb.appendChild(l)}}const pb=$("#nPegBox");pb.innerHTML="";const two=twoCols();pb.appendChild(nPegCard(vis,two?{side:true}:{}));
     /* Lote 21: no computador, a lista inteira abre na coluna principal ("Ver todas") */
     const pf=$("#nPegFull");pf.innerHTML="";pf.hidden=!(two&&pgFull);if(two&&pgFull){pf.appendChild(nPegCard(vis,{full:true}));if(pgFullTo){const t=pgFullTo;pgFullTo=null;setTimeout(()=>{const x=document.querySelector(`#nPegFull [data-pgt="${CSS.escape(t)}"]`)||pf;x.scrollIntoView({block:"start",behavior:"smooth"})},60)}}
   }
  if(nNoNote){const list=$("#nlist");list.innerHTML="";const nn=noNoteKeys().filter(k=>(nArea==="all"||BYKEY[k].area.code===nArea)&&(nArea==="all"||nSp==="all"||BYKEY[k].sp===nSp)&&(!nQuery||norm(BYKEY[k].t).includes(nQuery)));
    if(!nn.length)list.appendChild(el(`<li class="empty" style="padding:0">Nenhum tema estudado sem anotação com esses filtros.</li>`));
    nn.sort((a,b)=>wOf(BYKEY[b])-wOf(BYKEY[a])||BYKEY[a].num-BYKEY[b].num);appendGrouped(list,nn,k=>BYKEY[k],k=>{const it=BYKEY[k],s=get(k),c=el(`<li class="ncard nnone"><div class="ehead"><button class="etopic" type="button"></button><span class="nloc"></span></div><div class="efoot"><button class="mini" type="button">Escrever resumo</button>${sampleOff?"":`<button class="mini" type="button">Resumo com o Claude</button>`}</div></li>`);
      const tb=c.querySelector(".etopic");tb.textContent=it.t;tb.onclick=()=>{detTab[k]="notas";openTopic(k)};c.querySelector(".nloc").textContent=`${it.area.code}${it.sp?" · "+it.sp:""} · estudado em ${br(s.last)}`;
      const bs=c.querySelectorAll(".efoot .mini");bs[0].onclick=()=>{detTab[k]="notas";noteMode[k]="editar";openTopic(k)};if(bs[1])bs[1].onclick=()=>{detTab[k]="notas";openTopic(k);setTimeout(()=>{const b=[...document.querySelectorAll("#t-"+k+" button")].find(x=>/Gerar resumo com o Claude/.test(x.textContent));if(b)b.click()},300)};return c},["tema","temas"]);
    $("#nCopy").disabled=$("#nDown").disabled=true;nTocRender([],false);return}
  const list=$("#nlist");list.innerHTML="";
  if(!keys.length)list.appendChild(el(`<li class="tips">Abra um tema na aba Residência e escreva no campo Anotações, use um modelo ou peça um resumo ao Claude. Tudo o que você anotar aparece aqui, reunido por área.</li>`));
  else if(!vis.length)list.appendChild(el(`<li class="empty" style="padding:0">Nenhuma anotação com esses filtros.</li>`));
  const card=k=>{const it=BYKEY[k],open=nOpen.has(k);
    const c=el(`<li class="ncard${open?" open":""}"><div class="ehead"><button class="etopic" type="button"></button><span class="nloc"></span><span></span></div><div class="mdview clamp"></div><div class="efoot"><button class="mini" type="button"></button><span class="sp"></span><button class="mini" type="button">Editar</button></div></li>`);
    const tb=c.querySelector(".etopic");tb.textContent=it.t;tb.onclick=()=>openTopic(k);
    c.querySelector(".nloc").textContent=`${it.area.code}${it.sp?" · "+it.sp:""}${tgOf(k).length?" · "+tgOf(k).map(t=>"#"+t).join(" "):""}`;
    c.querySelector(".ehead span:last-child").textContent=`${wordCount(notes[k])} palavras${noteAt[k]?" · "+whenLabel(noteAt[k]):""}`;
    const mv=c.querySelector(".mdview");c.id="nc-"+k;mv.innerHTML=open?md(notes[k],{fold:k}):mdC(notes[k]);if(open){mv.classList.remove("clamp");noteDress(mv,k);mv.before(npathEl(k))}{const ne=noteErrsEl(k);if(ne)mv.after(ne)}if(open)c.querySelector(".efoot").before(wkBackEl({kind:"t",id:k}));
    const [tg,ed]=c.querySelectorAll(".efoot .mini");tg.textContent=open?"Recolher":"Ver tudo";tg.onclick=()=>{open?nOpen.delete(k):nOpen.add(k);render()};
    ed.onclick=()=>{noteMode[k]="editar";focusKey=k;render()};
    return c};
  nSortKeys(vis);const nShow=vis.slice(0,nLimit);if(nSort==="sp")appendGrouped(list,nShow,k=>BYKEY[k],card,["tema","temas"]);else nShow.forEach(k=>list.appendChild(card(k)));
  if(vis.length>nShow.length){const m=el(`<li><button class="btn" type="button" id="nMore"></button></li>`);m.querySelector("button").textContent=`Mostrar mais ${Math.min(N_PAGE,vis.length-nShow.length)} (de ${vis.length-nShow.length} restantes)`;m.querySelector("button").onclick=()=>{nLimit+=N_PAGE;render()};list.appendChild(m)}
  $("#nPdf").hidden=!downloadsFn;$("#nPdf").disabled=!keys.length&&!freeN.length;$("#nPdf").setAttribute("aria-expanded",!!nPdfOpt);
  $("#nPdf").onclick=()=>{nPdfOpt=nPdfOpt?null:{scope:vis.length<keys.length?"screen":"all",free:true};render()};
  {const bx=$("#nPdfBox");bx.innerHTML="";if(nPdfOpt&&downloadsFn)bx.appendChild(nPdfPanel(keys,vis))}
  nTocRender(nShow,vis.length>nShow.length);
  $("#nCopy").disabled=$("#nDown").disabled=!vis.length;
  $("#nDown").hidden=!downloadsFn;
  $("#nCopy").onclick=async()=>{const txt=notesMarkdown(vis);
    try{await navigator.clipboard.writeText(txt);$("#nmsg").textContent=`${vis.length} ${vis.length===1?"anotação copiada":"anotações copiadas"} em Markdown. Cole no Notion ou em outro editor.`}
    catch(e){const t=$("#nFallback");t.hidden=false;t.value=txt;t.focus();t.select();$("#nmsg").textContent="Não foi possível copiar automaticamente. O texto está selecionado abaixo: use Copiar do seu aparelho."}};
  $("#nDown").onclick=async()=>{if(!downloadsFn)return;
    try{await downloadsFn.save({filename:`anotacoes-residencia-${today()}.md`,data:notesMarkdown(vis)});$("#nmsg").textContent="Arquivo .md salvo. No Notion, use Importar › Markdown."}
    catch(e){$("#nmsg").textContent=e&&e.code==="declined"?"Download cancelado.":"Não foi possível baixar o arquivo agora."}};
}

/* Lote 19: Caderno em duas colunas no computador — coluna da direita (#nSide) com Cartões, Pegadinhas, PDF e o sumário; no celular é display:contents */
(()=>{const V=document.getElementById("viewNotas");if(!V||document.getElementById("nSide"))return;const S=document.createElement("div");S.id="nSide";S.className="nside";
  ["nRevBox","nPegBox"].forEach(id=>{const n=document.getElementById(id);if(n)S.appendChild(n)});const ex=V.querySelector(".nexport");if(ex)S.appendChild(ex);
  const t=document.getElementById("nToc");if(t)S.appendChild(t);V.appendChild(S)})();
