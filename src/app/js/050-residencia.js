/* filtros da lista: situação (vários juntos = "ou") e atalhos (todos juntos = "e"), mais área e especialidade */
let tf={lv:new Set(),due:false,weak:false,noq:false,high:false,pin:false,sem:false,area:"all",sp:"all"};
function tfNarrow(){return !!(tf.lv.size||tf.due||tf.weak||tf.noq||tf.high||tf.pin||tf.sem)}
function tfOn(){return tf.lv.size||tf.due||tf.weak||tf.noq||tf.high||tf.pin||tf.sem||tf.area!=="all"||tf.sp!=="all"}
function tfReset(){tf={lv:new Set(),due:false,weak:false,noq:false,high:false,pin:false,sem:false,area:"all",sp:"all"};filter="all"}
/* Lote 18: temas ligados aos conteúdos da faculdade dos semestres ativos (o "mapa do que importa" no que você vê agora) */
function semKeys(){const ks=new Set();activeSems().forEach(id=>semDiscs(id).forEach(d=>topicKeysOf(discRefs(d)).forEach(k=>ks.add(k))));return ks}
let semKS=null;
const tfLevel=s=>!s.last&&!(s.l>0)?(s.ing?"i":0):(s.l||1);
function matches(it){const s=get(it.key);
  if(tf.lv.size&&!tf.lv.has(tfLevel(s)))return false;
  if(tf.sem&&!(semKS||(semKS=semKeys())).has(it.key))return false;
  if(tf.due&&!isDue(s))return false;if(tf.weak&&!isWeak(s))return false;if(tf.noq&&s.qt)return false;if(tf.high&&(it.own||wOf(it)!==3))return false;if(tf.pin&&!s.pin)return false;
  if(tf.area!=="all"&&it.area.code!==tf.area)return false;if(tf.sp!=="all"&&it.sp!==tf.sp)return false;
  return !query||norm(it.t+" "+(it.sp||"")+" "+subList(it).map(x=>x.t).join(" ")+" "+(notes[it.key]||"")).includes(query)}

/* Lote 18: próximo passo de cada tema, numa linha curta na lista ([texto, classe]); null = em dia (a data da revisão já aparece) */
function topicNext(it){const s=get(it.key),dd=dueIn(s),L=subList(it),pt=L.length?partSubs(it).pt:null;
  if(isIng(s))return [pt?`Continuar · parte ${pt[0]} de ${pt[1]}`:"Terminar os subtópicos","go"];
  if(!s.last&&!(s.l>0))return [pt?`Começar · parte 1 de ${pt[1]}`:"Começar a estudar",""];
  if(dd!==null&&dd<0)return [calmOn()?`Revisar · pendente há ${-dd} d`:`Revisar · atrasada ${-dd} d`,"late"];if(dd===0)return ["Revisar hoje","late"];
  if(lvDrop(it.key))return ["Acerto caiu: faça questões","warn"];if(isWeak(s))return ["Acerto baixo: faça questões","warn"];
  if(!s.qt)return ["Faça questões do tema",""];if(lvMeets(s))return ["Pronto para Dominado","ok"];return null}
let subQ=null;// tema com a lista rápida de subtópicos aberta na Residência
/* subtópicos: padrão (índice em s.sd) + próprios (s.cs) */
function openTopic(key){const it=BYKEY[key];if(!it)return;
  if(view!=="temas")showView("temas");
  tSeg="lista";try{localStorage.setItem("resid-tseg","lista")}catch(e){}
  openKey=key;openAreas.add(it.area.code);if(it.sp)openSpecs.add(spKey(it));tfReset();query="";$("#q").value="";render();
  const el=document.getElementById("t-"+key); if(el)el.scrollIntoView({behavior:"smooth",block:"start"});}

/* subtópicos densos: marcar à mão ou pedir sugestão ao Claude (a sua escolha nunca é trocada pela sugestão) */
let hyEdit=null,dnEdit=null,dnAsk={};
function dnPrompt(items){return `Você ajuda um estudante de medicina a planejar os estudos para a prova de residência médica. Para cada tema abaixo, aponte os subtópicos DENSOS: os que sozinhos pedem um dia de estudo ou quase (muito conteúdo e muitos detalhes cobrados em prova). Seja seletivo: em geral 0 a 2 por tema.
Responda só com JSON neste formato: {"densos":{"CHAVE":[números dos subtópicos densos]}}. Use as chaves e os números mostrados. Tema sem subtópico denso: lista vazia.

`+items.map(it=>`${it.key} · ${it.t}\n`+subList(it).map((x,i)=>`  ${i+1}. ${x.t}`).join("\n")).join("\n\n")}
function dnApply(items,data){const m=data&&typeof data==="object"?(data.densos&&typeof data.densos==="object"?data.densos:data):{};let n=0;
  items.forEach(it=>{if(!Array.isArray(m[it.key]))return;const want=new Set(m[it.key].map(Number).filter(Number.isInteger).map(i=>i-1)),L=subList(it);
    upd(it.key,s=>{const dn={...(s.dn||{})},cs=(s.cs||[]).map(c=>({...c}));
      L.forEach((x,i)=>{if(x.dn==="u"||x.dn==="n")return;const v=want.has(i);if(v)n++;if(x.i!==undefined){if(v)dn[x.i]="c";else delete dn[x.i]}else if(cs[x.j]){if(v)cs[x.j].dn="c";else delete cs[x.j].dn}});
      if(Object.keys(dn).length)s.dn=dn;else delete s.dn;if(cs.length)s.cs=cs;s.dnAt=today()})});return n}
function dnErr(e){const code=e&&e.code;return code==="cancelled"?"":GEN_OFF.includes(code)?"A sugestão não está disponível nesta visualização.":(GEN_ERR[code]||"Não foi possível pedir a sugestão agora.")}
async function dnSuggest(it){if(!sampleFn)return;const k=it.key,A=dnAsk[k]={st:"loading",msg:""};render();
  try{const data=await sampleFn.json(dnPrompt([it]),{cache:false,title:"Subtópicos densos",hint:"Cole a resposta do Claude (JSON com os subtópicos densos)."});if(dnAsk[k]!==A)return;
    const n=dnApply([it],data);A.st="done";A.msg=n?`O Claude sugeriu ${n} subtópico${n===1?"":"s"} denso${n===1?"":"s"} (tracejado). Já vale no plano; toque no selo para tirar.`:"O Claude não viu subtópico denso neste tema.";commit()}
  catch(e){if(dnAsk[k]!==A)return;A.st="error";A.msg=dnErr(e);render()}}
const DN_CHUNK=45;
function dnPending(){return ALL.filter(it=>!it.own&&!DN_DEF[it.key]&&subList(it).length>=4&&!get(it.key).dnAt)}
async function dnSuggestAll(){if(!sampleFn||(dnAsk.all&&dnAsk.all.st==="loading"))return;const L=dnPending();
  if(!L.length){dnAsk.all={st:"done",msg:"Todos os temas com 4 ou mais subtópicos já têm sugestão."};render();return}
  const G=[];for(let i=0;i<L.length;i+=DN_CHUNK)G.push(L.slice(i,i+DN_CHUNK));let tot=0;
  for(let i=0;i<G.length;i++){dnAsk.all={st:"loading",msg:`Pedindo ao Claude: parte ${i+1} de ${G.length}…`};render();
    try{const data=await sampleFn.json(dnPrompt(G[i]),{cache:false,title:`Subtópicos densos (${i+1} de ${G.length})`,hint:"Cole a resposta do Claude (JSON com os subtópicos densos)."});tot+=dnApply(G[i],data);commit()}
    catch(e){dnAsk.all={st:"error",msg:(dnErr(e)||"Interrompido.")+(i?` As partes anteriores ficaram salvas (${tot} sugeridos); peça de novo para continuar.`:"")};render();return}}
  dnAsk.all={st:"done",msg:`Pronto: ${tot} subtópico${tot===1?"":"s"} denso${tot===1?"":"s"} sugerido${tot===1?"":"s"} em ${L.length} temas. Confira em cada tema (tracejado).`};render()}
function dnBoxEl(it,L){const k=it.key,ed=dnEdit===k,P=subParts(L),s=get(k),bx=el(`<div class="dnbox"></div>`);
  if(P.length>1){const pi=P.findIndex(p=>p.some(x=>!x.done));bx.appendChild(el(`<p class="how">Tema grande: o plano do dia divide em ${P.length} partes de 3 a 4 subtópicos${pi>=0&&!s.last&&pi>0?` (você está na parte ${pi+1})`:""}. Subtópico denso conta como dois.</p>`))}
  const t=el(`<button class="link" type="button" id="dnEd-${k}"></button>`);t.textContent=ed?"Pronto":"Marcar subtópicos densos";t.onclick=()=>{dnEdit=ed?null:k;render()};bx.appendChild(t);
  const A=dnAsk[k];
  if(sampleFn&&!sampleOff){const b=el(`<button class="link" type="button" id="dnAsk-${k}"></button>`);b.textContent=A&&A.st==="loading"?"Perguntando ao Claude…":s.dnAt?"Pedir nova sugestão ao Claude":"Pedir sugestão ao Claude";b.disabled=!!(A&&A.st==="loading");b.onclick=()=>dnSuggest(it);bx.appendChild(b)}
  if(L.some(x=>x.dn==="c")){const c=el(`<button class="link" type="button" id="dnOk-${k}">Confirmar sugestões</button>`);c.onclick=()=>{upd(k,s=>{const d={...(s.dn||{})};L.forEach(x=>{if(x.dn==="c"&&x.i!==undefined)d[x.i]="u"});s.dn=d;if(s.cs)s.cs=s.cs.map(x=>x.dn==="c"?{...x,dn:"u"}:x)});commit()};bx.appendChild(c)}
  if(A&&A.msg){const m=el(`<p class="how dnmsg"></p>`);m.textContent=A.msg;bx.appendChild(m)}
  else if(ed)bx.appendChild(el(`<p class="how hx">Toque em “normal” ou “denso” ao lado de cada subtópico. Tracejado = sugerido pelo Claude; a sua escolha sempre vale.</p>`));
  return bx}
function renderDetail(it,o={}){
  const s=get(it.key), d=dueIn(s), a=acc(s);
  const box=el(`<div class="detail"></div>`);
  // nível
  const g1=el(`<div class="grp dblk dlv"><span class="glabel">Nível de domínio</span><div class="seg"></div></div>`);
  const lk=lvKey(s);
  [[0,"Não iniciado"],["i","Estudando"],[1,"Estudado"],[2,"Revisado"],[3,"Dominado"]].forEach(([i,name])=>{const b=el(`<button aria-pressed="${lk===i}" data-lv="${i}">${name}</button>`);b.onclick=()=>setLevel(it,i);g1.querySelector(".seg").appendChild(b)});
  const ready=(s.l||0)<3&&s.qt>=10&&acc(s)>=0.8&&(s.step||0)>=2;
  if(ready)g1.appendChild(el(`<p class="gtext dready"><b>Você atingiu os critérios de domínio</b> (80% ou mais em 10+ questões e duas revisões seguidas sem dificuldade). Pode marcar como Dominado.</p>`));
  g1.appendChild(el(`<details class="dhow"><summary>O que cada nível quer dizer</summary><ul><li><b>Estudando:</b> começou e ainda não terminou (as revisões só começam ao concluir).</li><li><b>Estudado:</b> viu o conteúdo inteiro; a 1ª revisão fica para amanhã.</li><li><b>Revisado:</b> lembrou bem numa revisão.</li><li><b>Dominado:</b> 80% ou mais em pelo menos 10 questões e duas revisões seguidas sem dificuldade.</li></ul></details>`));
  const duo=el(`<div class="dduo"></div>`);duo.appendChild(g1);
  if(!o.fac){const lk=linkInfoEl(it);if(lk)box.insertBefore(lk,box.firstChild)}
  const fbd=facBadge(it.key);if(fbd){const x=el(`<p class="tips fbadgep"></p>`);x.textContent=`Faculdade: cai na prova “${fbd.p.name}” de ${provaDiscName(fbd.p)} (${br(fbd.p.date)}, ${inLabel(daysTo(fbd.p.date))}).`;box.insertBefore(x,box.firstChild)}
  // peso de incidência
  if(!it.own){
  const w=wOf(it),gw=el(`<div class="grp dblk dinc"><span class="glabel">Peso de incidência</span><div class="seg"></div><p class="gtext how"></p><details class="dhow"><summary>De onde vem este peso</summary><p></p></details></div>`);
  [1,2,3].forEach(v=>{const b=el(`<button aria-pressed="${w===v}"></button>`);b.appendChild(incEl(v,false,true));b.appendChild(document.createTextNode(" "+INC[v]));
    b.onclick=()=>{upd(it.key,x=>{if(v===it.w0)delete x.w;else x.w=v});commit()};gw.querySelector(".seg").appendChild(b)});
  const D=INC_DATA[it.key]||[0,0,0,0];
  gw.querySelector("p").textContent=(get(it.key).w?`Você ajustou este peso. O padrão é ${INC[it.w0].toLowerCase()}. `:"")+
    (INC_NEW.has(it.key)?"Tema novo (10/2026), ainda sem contagem própria nas 12 provas analisadas.":D[0]?`Caiu ${D[0]} ${D[0]===1?"vez":"vezes"} em ${D[1]} das 12 provas analisadas${D[2]?`, ${D[2]} no Enamed 2025`:""}${it.key==="CM-50"?" (contando toda a psiquiatria, antes de ela ser dividida em 4 temas)":""}.`:"Não apareceu com esse nome nas 12 provas analisadas.");
  gw.querySelector(".dhow p").textContent=(D[3]?"Peso elevado porque os cursinhos o apontam como prioritário. ":"")+`O peso decide quanto o tema pesa no plano do dia e no “onde ganhar pontos”. Fonte: ${INC_SRC}.`;
  if(get(it.key).w){const r=el(`<button class="link" type="button">Voltar ao padrão</button>`);r.onclick=()=>{upd(it.key,x=>{delete x.w});commit()};gw.insertBefore(r,gw.querySelector(".dhow"))}
  duo.appendChild(gw);
  }
  // revisão
  const g2=el(`<div class="grp dblk drev"><div class="dbh"><span class="glabel">Revisão espaçada</span><span class="dpill"></span></div><p class="gtext"></p><div class="btns"></div></div>`);
  const p=g2.querySelector("p"), bt=g2.querySelector(".btns"),pill=g2.querySelector(".dpill");
  if(!s.last){pill.textContent=isIng(s)?"em estudo":"sem estudo";g2.dataset.st="none";p.textContent=isIng(s)?`Estudando desde ${br(s.ing.d)}. A primeira revisão fica agendada quando você marcar todos os subtópicos ou tocar em Estudei hoje.`:"Ainda sem estudo registrado. Marque quando estudar e a primeira revisão fica agendada para amanhã.";
    const b=el(`<button class="btn primary">Estudei hoje</button>`);b.onclick=()=>{upd(it.key,x=>{x.last=today();x.step=0;x.l=Math.max(x.l||0,1)});logAct("e");adoptTopic(it.key);commit()};bt.appendChild(b);}
  else{const next=fromNum(dnum(today())+d);
    const af=adaptF(s),aa=af!==1&&!(s.adjFrom===s.last&&s.adj)?adaptAcc(s):null;pill.textContent=dueLabel(d);g2.dataset.st=d<0?"late":d===0?"today":"ok";
    p.innerHTML=`<span class="dnext">Próxima revisão: <b></b></span><span class="dsub"></span>`;p.querySelector("b").textContent=br(next);
    p.querySelector(".dsub").textContent=`Último estudo em ${br(s.last)} · intervalo atual de ${interval(s)} ${interval(s)===1?"dia":"dias"}${aa?` (${af>1?"mais longo":"mais curto"} pelo seu acerto de ${Math.round(aa.a*100)}% nas questões)`:""}.`;
    bt.appendChild(revBtns(it.key,"drevb"));}
  box.appendChild(g2);
  // subtópicos
  const L=subList(it),[sdn,stot]=subCount(it);
  const gs=el(`<div class="grp dblk dsubs"><div class="dbh"><span class="glabel">Subtópicos · ${sdn}/${stot}</span><span class="dpct">${stot?Math.round(sdn/stot*100):0}%</span></div><div class="sbar"><i style="width:${stot?sdn/stot*100:0}%"></i></div><ul class="subs"></ul></div>`);
  L.forEach((x,n)=>{const id=`sb-${it.key}-${n}`;
    const li=el(`<li class="sub"><input type="checkbox" id="${id}"${x.done?" checked":""}><label for="${id}"></label></li>`);
    li.querySelector("label").textContent=x.t;
    if(x.j!==undefined){li.querySelector("label").appendChild(el(`<span class="own">seu</span>`));
      const rm=el(`<button class="link" type="button" aria-label="Remover subtópico">remover</button>`);
      rm.onclick=()=>{upd(it.key,s=>{s.cs=(s.cs||[]).filter((_,j)=>j!==x.j);if(!s.cs.length)delete s.cs});commit()};li.appendChild(rm)}
    li.querySelector("input").onchange=()=>toggleSub(it,x);
    if(x.hy||hyEdit===it.key){const hb=el(`<button class="hyst" type="button"></button>`);hb.id=`hy-${it.key}-${n}`;hb.textContent=x.hy?"★ HY":"☆ HY";hb.setAttribute("aria-pressed",x.hy);hb.title=x.hy?"High Yield: cai muito em prova. Toque para tirar.":"Toque para marcar como High Yield";hb.onclick=()=>setHy(it,x,!x.hy);(li.querySelector(".subtags")||li.appendChild(el(`<span class="subtags"></span>`))).appendChild(hb)}
    if(dnEdit===it.key||dnHeavy(x)){const db=el(`<button class="dnb" type="button" data-dn="${x.dn}"></button>`);db.textContent=dnHeavy(x)?(x.dn==="c"?"denso · Claude":"denso"):"normal";
      db.title=dnHeavy(x)?"Subtópico denso: conta como dois no plano. Toque para tirar.":"Toque para marcar como denso";db.onclick=()=>setDn(it,x,dnHeavy(x)?"n":"u");(li.querySelector(".subtags")||li.appendChild(el(`<span class="subtags"></span>`))).appendChild(db)}
    gs.querySelector("ul").appendChild(li)});
  if(L.length>=2)gs.appendChild(dnBoxEl(it,L));
  if(L.length){const hl=el(`<p class="hyline"><button class="link" type="button"></button></p>`),hb=hl.querySelector("button");hb.id="hyEd-"+it.key;hb.textContent=hyEdit===it.key?"Pronto":`${L.some(x=>x.hy)?"Mudar":"Marcar"} os subtópicos ★ HY`;hb.onclick=()=>{hyEdit=hyEdit===it.key?null:it.key;render()};
    if(hyEdit===it.key)hl.appendChild(el(`<span class="how"> ★ = o que mais cai em prova (estimativa inicial; a sua escolha sempre vale). Os ★ vêm primeiro nas partes do tema, voltam mais no rodízio da revisão e puxam mais questões.</span>`));gs.appendChild(hl)}
  const af=el(`<form class="addsub"><input class="etext" id="as-${it.key}" maxlength="120" placeholder="Adicionar subtópico próprio" aria-label="Novo subtópico"><button class="btn" type="submit">Adicionar</button></form>`);
  const ai=af.querySelector("input");ai.value=subDraft[it.key]||"";ai.oninput=()=>subDraft[it.key]=ai.value;
  af.addEventListener("submit",ev=>{ev.preventDefault();const t=ai.value.trim();
    if(!t){subErr="Escreva o nome do subtópico.";render();return}
    if((get(it.key).cs||[]).length>=30){subErr="Limite de 30 subtópicos próprios por tema.";render();return}
    subErr="";subDraft[it.key]="";upd(it.key,s=>{s.cs=[...(s.cs||[]),{t,d:false}]});commit();
    const n=document.getElementById("as-"+it.key);if(n)n.focus()});
  gs.appendChild(af);
  if(subErr){const e=el(`<p class="err"></p>`);e.textContent=subErr;gs.appendChild(e)}
  box.appendChild(gs);if(duo.children.length)box.appendChild(duo);
  // anotações
  if(focusKey===it.key){const ph=el(`<div class="grp"><span class="glabel">Anotações</span><p class="gtext">Abertas em tela cheia.</p></div>`);box.appendChild(ph)}
  else box.appendChild(renderNotes(it,false));
  const notesEl=box.lastElementChild;if(focusKey!==it.key){const fl=freeLinkedEl(it.key),nf=notesEl.querySelector(":scope>.nfoot");if(nf)nf.after(fl);else notesEl.appendChild(fl);notesEl.appendChild(cardsBlock(it))}
  // questões
  const g3=el(`<div class="grp dblk dperf"><span class="glabel">Seu desempenho</span><div class="dpf"><div class="dbig"></div><div class="dpfr"><p class="gtext"></p><div class="dwk"></div></div></div>
    <span class="glabel dsm">Registrar questões feitas fora do app</span><form class="qform"><label for="qc-${it.key}">Acertei</label><input id="qc-${it.key}" type="number" inputmode="numeric" min="0" max="500" placeholder="0">
    <label for="qt-${it.key}">de</label><input id="qt-${it.key}" type="number" inputmode="numeric" min="1" max="500" placeholder="10"><button class="btn primary" type="submit">Registrar</button></form></div>`);
  g3.querySelector("p").textContent=s.qt?`${s.qc} acertos em ${s.qt} questões: ${Math.round(a*100)}% de acerto.${isWeak(s)?" Ponto fraco, entra no seu plano diário.":""}`:"Nenhuma questão registrada ainda. Gere questões abaixo ou registre as que fez em outro lugar.";
  {const bg=g3.querySelector(".dbig");if(s.qt){bg.textContent=Math.round(a*100)+"%";bg.dataset.c=a>=.8?"ok":a>=.65?"mid":"bad"}else{bg.textContent="—";bg.dataset.c="none"}
   const W=dWeeks(s);if(W.some(x=>x.q)){const wk=g3.querySelector(".dwk"),mx=Math.max(...W.map(x=>x.q));
     W.forEach(x=>{const b=el(`<span class="dwb"><i></i></span>`),i=b.firstChild;i.style.height=(x.q?Math.max(12,x.q/mx*100):0)+"%";if(x.q)i.dataset.c=x.c/x.q>=.8?"ok":x.c/x.q>=.65?"mid":"bad";b.title=x.q?`${x.lab}: ${x.c} de ${x.q} (${Math.round(x.c/x.q*100)}%)`:`${x.lab}: nada`;wk.appendChild(b)});
     wk.appendChild(el(`<span class="dwl">últimas 8 semanas</span>`))}}
  if(formErr){const e=el(`<p class="err"></p>`);e.textContent=formErr;g3.appendChild(e)}
  g3.querySelector("form").addEventListener("submit",ev=>{ev.preventDefault();
    const c=Number(g3.querySelector(`#qc-${it.key}`).value), t=Number(g3.querySelector(`#qt-${it.key}`).value);
    if(!Number.isInteger(c)||!Number.isInteger(t)||t<1||c<0||t>500){formErr="Preencha acertos e total com números inteiros (total entre 1 e 500).";render();return}
    if(c>t){formErr="Os acertos não podem ser maiores que o total de questões.";render();return}
    formErr="";upd(it.key,x=>addQ(x,t,c));logAct("q",t,c);commit();});
  if(s.qt){const z=el(`<button class="link${clearArm===it.key?" warn":""}" type="button"></button>`);
    z.textContent=clearArm===it.key?"Toque de novo para zerar as questões deste tema":"Zerar questões deste tema";
    z.onclick=()=>{if(clearArm===it.key){upd(it.key,x=>{delete x.qc;delete x.qt;delete x.qd});clearArm=null;commit()}else{clearArm=it.key;render()}};g3.appendChild(z)}
  box.appendChild(g3);
  // gerar questões
  const genEl=!sampleOff?renderGen(it):null;if(genEl)box.appendChild(genEl);
  const exEl=exTopicEl(it);if(exEl)box.appendChild(exEl);
  // caderno de erros
  const mine=errors.filter(e=>e.k===it.key&&!e.arch).sort(byNewest),nArch=errors.filter(e=>e.k===it.key&&e.arch).length;
  const g4=el(`<div class="grp"><span class="glabel">Caderno de erros${mine.length?" · "+mine.length:""}</span></div>`);
  if(nArch){const a=el(`<button class="link" type="button"></button>`);a.textContent=`${nArch} ${nArch===1?"arquivado":"arquivados"} (resolvidos) · ver`;a.onclick=()=>{eGoTopic(it.key);eFlags.add("arch");setView("erros")};g4.appendChild(a)}
  if(mine.length){const ul=el(`<ol class="elist"></ol>`);mine.slice(0,3).forEach(e=>ul.appendChild(ecardEl(e,false)));g4.appendChild(ul);
    if(mine.length>3){const more=el(`<button class="link" type="button">Ver os ${mine.length} erros deste tema</button>`);more.onclick=()=>{eGoTopic(it.key);setView("erros")};g4.appendChild(more)}}
  const dr=drafts[it.key]||(drafts[it.key]={w:"",r:"",t:"conhecimento",s:""});dr.k=it.key;if(eErr){dr.msg=eErr;eErr=""}
  g4.appendChild(errFormEl(dr,"",()=>{drafts[it.key]={w:"",r:"",t:dr.t,s:dr.s,c:dr.c};render()},{w:"ew-"+it.key,r:"er-"+it.key,t:"et-"+it.key,s:"es-"+it.key,c:"ec-"+it.key}));
  box.appendChild(g4);
  // abas: Estudo · Questões · Anotações · Erros
  const tabOf=c=>c===notesEl?"notas":c===g3||c===genEl||c===exEl?"questoes":c===g4?"erros":"estudo";
  let tab=detTab[it.key]||"estudo";if(formErr)tab="questoes";if(eErr)tab="erros";if(subErr)tab="estudo";detTab[it.key]=tab;
  [...box.children].forEach(c=>{c.dataset.tab=tabOf(c);c.hidden=c.dataset.tab!==tab});
  const fo=foSum(foSess.filter(x=>x.ref==="T:"+it.key)),nt=(notes[it.key]||"").trim();
  /* Lote 19: sem os quadrinhos Nível/Revisão/Acerto/Foco/Erros (repetiam a linha do tema e o bloco Revisão) */
  const tb=el(`<div class="seg dtabs" role="tablist" aria-label="Partes do tema"></div>`);
  [["estudo","Estudo"],["questoes","Questões"],["notas","Anotações"],["erros","Erros"]].forEach(([v,l])=>{const b=el(`<button type="button" role="tab" aria-pressed="${tab===v}" aria-selected="${tab===v}"></button>`);
    b.textContent=l+(v==="erros"&&mine.length?` · ${mine.length}`:v==="notas"&&nt?" ✓":"");b.dataset.dt=v;b.onclick=()=>{detTab[it.key]=v;render()};tb.appendChild(b)});
  const pn=el(`<button class="mini dpin" type="button"></button>`);pn.textContent=s.pin?"★ Fixado":"☆ Fixar";pn.setAttribute("aria-pressed",!!s.pin);pn.title=s.pin?"Tirar dos fixados":"Fixar este tema no topo da lista";pn.onclick=()=>togglePin(it.key);tb.appendChild(pn);
  const fz=el(`<button class="mini dfoco" type="button" title="Contar o tempo de estudo deste tema">⏱ Foco</button>`);fz.onclick=()=>foGo(it.key);tb.appendChild(fz);
  box.prepend(tb);
  return box;
}
let detTab={};
/* questões do tema por semana (8 semanas, a última termina hoje) */
function dWeeks(s){const t=dnum(today()),out=[];for(let w=7;w>=0;w--){const a=t-w*7-6,b=t-w*7;let q=0,c=0;Object.entries(s.qd||{}).forEach(([d,v])=>{const n=dnum(d);if(n>=a&&n<=b){q+=v[0]||0;c+=v[1]||0}});out.push({q,c,lab:w?`há ${w} sem.`:"esta semana"})}return out}
/* abre a aba certa do tema antes de procurar um campo dela (questões ou caderno de erros) */
function detGet(pre,k){detTab[k]=pre==="ew-"?"erros":pre==="nt-"?"notas":"questoes";render();return document.getElementById(pre+k)}

function lvLegend(c){return [["m3","Dominados",c[3]],["m2","Revisados",c[2]],["m1","Estudados",c[1]],...(c[4]?[["mi","Estudando",c[4]]]:[]),["track","Não iniciados",c[0]-(c[4]||0)]]}
function donut(c,tot=TOTAL,unit="temas"){const R=52,C=2*Math.PI*R,gap=2;let off=0;
  const segs=[[c[3],"var(--m3)","Dominados"],[c[2],"var(--m2)","Revisados"],[c[1],"var(--m1)","Estudados"],[c[4]||0,"var(--mi)","Estudando"]];
  const arcs=segs.filter(s=>s[0]).map(([v,col,lab])=>{const len=v/tot*C,draw=Math.max(len-(len>gap*2?gap:0),0.5);
    const a=`<circle r="${R}" cx="64" cy="64" fill="none" stroke="${col}" stroke-width="14" stroke-dasharray="${draw} ${C}" stroke-dashoffset="${-off}" transform="rotate(-90 64 64)" data-tip="${lab}: ${v} de ${tot} ${unit} (${pct(v,tot)}%)"></circle>`;off+=len;return a}).join("");
  return `<svg viewBox="0 0 128 128" class="donut" role="img" aria-label="${c[3]} dominados, ${c[2]} revisados, ${c[1]} estudados, ${c[4]?c[4]+" estudando, ":""}${c[0]-(c[4]||0)} não iniciados"><circle r="${R}" cx="64" cy="64" fill="none" stroke="var(--track)" stroke-width="14"></circle>${arcs}</svg>`}

function renderDash(){
  const c=counts(ALL);let qc=0,qt=0,due=0,late=0;
  ALL.forEach(i=>{const s=get(i.key);qc+=s.qc||0;qt+=s.qt||0;if(isDue(s)){due++;if(dueIn(s)<0)late++}});
  const ac=qt?pct(qc,qt):null,[bk,bl]=ac===null?["",""]:band(ac),wp=weighted();
  $("#ring").innerHTML=donut(c)+`<div class="ringc"><b>${pct(c[3],TOTAL)}%</b><span>dominado</span></div>`;
  const L=lvLegend(c);
  $("#glegend").innerHTML=L.map(([t,lab,v])=>`<li><i class="sw" style="background:var(--${t})"></i><span>${lab}</span><b>${v}</b><em>${pct(v,TOTAL)}%</em></li>`).join("");
  $("#stats").innerHTML=`
    <div class="kpi${due?" alert":""}"><span class="kl">Revisões pendentes</span><b>${due}</b><span class="ks">${due?(late?`${late} atrasada${late>1?"s":""}`:"vencem hoje"):"tudo em dia"}</span></div>
    <div class="kpi"><span class="kl">Questões feitas</span><b>${qt.toLocaleString("pt-BR")}</b><span class="ks">${qc.toLocaleString("pt-BR")} acertos</span></div>
    <div class="kpi"><span class="kl">Acerto geral</span><b>${ac===null?"–":ac+"%"}</b><span class="ks">${ac===null?"sem questões ainda":`<span class="st ${bk}">${bl}</span>`}</span></div>
    <div class="kpi"><span class="kl">Peso da prova estudado</span><b>${wp}%</b><div class="meter" data-tip="${wp}% do peso de incidência já estudado"><i style="width:${wp}%"></i></div></div>`;
  // progresso por área
  /* progresso por área (Lote 10): uma barra empilhada por área com o nome inteiro e "21 de 40 temas"; os subtópicos ficam na dica da barra */
  $("#areaChart").innerHTML=AREAS.map(a=>{const k=counts(a.items),n=a.items.length,seen=k[1]+k[2]+k[3];
    let sd=0,st=0;a.items.forEach(it=>{const [x,y]=subCount(it);sd+=x;st+=y});const sub=`subtópicos marcados: ${sd} de ${st} (${pct(sd,st)}%)`;
    const seg=(v,t,lab)=>v?`<i style="width:${v/n*100}%;background:var(--${t})" data-tip="${esc(a.name)} · ${lab}: ${v} de ${n} · ${sub}"></i>`:"";
    return `<button type="button" class="arow" data-code="${a.code}"><span class="atop"><span class="al">${esc(a.name)}</span><span class="an"><b>${seen}</b> de ${n} temas</span></span><span class="hbar" role="img" aria-label="${esc(a.name)}: ${k[3]} dominados, ${k[2]} revisados, ${k[1]} estudados de ${n}; ${sub}" data-tip="${esc(a.name)}: ${seen} de ${n} temas · ${sub}">${seg(k[3],"m3","dominados")}${seg(k[2],"m2","revisados")}${seg(k[1],"m1","estudados")}${seg(k[4],"mi","estudando")}</span></button>`}).join("")+
    `<p class="cnote">Cores da legenda acima. Toque numa área para ver os temas dela; a dica da barra mostra os subtópicos marcados.</p>`;
  $("#areaChart").querySelectorAll(".arow").forEach(b=>b.onclick=()=>{tf.area=b.dataset.code;tf.sp="all";openAreas.add(b.dataset.code);setTSeg("lista")});
}

/* celular: aba Residência dividida em Hoje | Revisões | Lista | Progresso */
let tSeg="hoje";try{const v=localStorage.getItem("resid-tseg");if(["hoje","rev","lista","prog"].includes(v))tSeg=v}catch(e){}
function setTSeg(v){tSeg=v;try{localStorage.setItem("resid-tseg",v)}catch(e){}render();window.scrollTo({top:0})}
function renderTSeg(dueN){const vt=$("#viewTemas");vt.dataset.seg=tSeg;
  $("#tSeg").querySelectorAll("button").forEach(b=>{b.setAttribute("aria-pressed",b.dataset.s===tSeg);if(b.dataset.s==="rev")b.innerHTML="Revisões"+(dueN?`<b>${dueN}</b>`:"")})}
/* ---------- Residência: filtros, agenda de revisões e "Já estudei antes" ---------- */
/* busca e filtros da Residência: cartão "Encontrar temas" com o painel Filtros (aberto/fechado lembrado no aparelho),
   pílulas dos filtros ativos (× tira um) e a ordem; ids dos chips/seletores: #tfl<nível>, #tfdue/#tfweak/#tfnoq/#tfhigh/#tfpin, #tfArea, #tfSp, #sortSel */
let tfPanel=(document.documentElement.dataset.layout!=="phone"||window.__noSheet)&&lsGet("resid-tfpanel","")==="1";
const TF_SHORT=[["due","Revisão pendente","Temas com revisão vencida hoje ou atrasada"],["weak","Pontos fracos","Acerto abaixo de 60% em 5 ou mais questões"],["noq","Sem questões","Temas sem nenhuma questão registrada"],["high","Incidência muito alta","Os que mais caem nas provas (3 barrinhas)"],["pin","★ Fixados","Temas que você fixou com a estrela"],["sem","Neste semestre","Temas ligados aos conteúdos da faculdade do semestre atual, os que mais caem na residência primeiro"]];
const TF_LV=[[0,"Não iniciados","l0"],["i","Estudando","li"],[1,"Estudados","l1"],[2,"Revisados","l2"],[3,"Dominados","l3"]];
function tfActive(){const L=[];TF_LV.forEach(([v,t])=>{if(tf.lv.has(v))L.push([t,()=>tf.lv.delete(v)])});TF_SHORT.forEach(([k,t])=>{if(tf[k])L.push([t,()=>{tf[k]=false}])});
  if(tf.area!=="all"){const A=AREAS.find(a=>a.code===tf.area);L.push([A?A.name:"Faculdade (sem área)",()=>{tf.area="all";tf.sp="all"}])}if(tf.sp!=="all")L.push([tf.sp,()=>{tf.sp="all"}]);return L}
function renderTFilters(){const box=$("#tFilters");if(!box)return;box.innerHTML="";filter=tfOn()?"on":"all";
  const pool=[...ALL,...FAC_ITEMS],cnt=f=>pool.filter(f).length,act=tfActive(),n=pool.filter(matches).length;
  {const c=$("#tfCount");if(c)c.textContent=tfOn()||query?`${n} de ${pool.length} ${pool.length===1?"tema":"temas"}`:`${pool.length} temas`}
  /* Lote 20: o mesmo cartão das outras abas (fcBody), com contagem em todos os atalhos e o painel como folha no celular */
  const SK=semKS||(semKS=semKeys()),SC={due:i=>isDue(get(i.key)),weak:i=>isWeak(get(i.key)),noq:i=>!get(i.key).qt,high:i=>!i.own&&wOf(i)===3,pin:i=>get(i.key).pin,sem:i=>SK.has(i.key)};
  const G=[["Situação","em que ponto o tema está",fcChips(TF_LV.map(([v,t,dc])=>fcChip(`${t} · ${cnt(i=>tfLevel(get(i.key))===v)}`,tf.lv.has(v),()=>{tf.lv.has(v)?tf.lv.delete(v):tf.lv.add(v)},"tfl"+v,dc)))],
    ["Mostrar só","atalhos, combinam com o resto",fcChips(TF_SHORT.map(([k,t,tip])=>fcChip(`${t} · ${cnt(SC[k])}`,tf[k],()=>{tf[k]=!tf[k]},"tf"+k,null,tip)))],
    ["Onde","grande área e especialidade",fcWhere("tf",tf.area,tf.sp,(a,sp)=>pool.filter(i=>(a==="all"||i.area.code===a)&&(sp==="all"||i.sp===sp)).length,v=>{tf.area=v;tf.sp="all";if(v!=="all")openAreas.add(v)},v=>{tf.sp=v;if(v!=="all")openSpecs.add(tf.area+":"+v)})]];
  const bk=el(`<button class="link" type="button" id="bulkB"></button>`);bk.textContent=bulk?"Sair da marcação":"Já estudei alguns temas antes do app";bk.onclick=()=>{if(bulk){bulk=null}else{bulk={sel:new Set(),lv:1};bulkUndo=null;tf.lv=new Set([0,"i"]);openKey=null}render()};
  fcBody(box,{tog:"tfTog",panelId:"tfPanel",open:tfPanel,onToggle:()=>{tfPanel=!tfPanel;lsSet("resid-tfpanel",tfPanel?"1":null)},
    sort:["sortSel",[["num","Da lista"],["inc","Mais cobrados primeiro"]],sortBy,v=>{sortBy=v;try{localStorage.setItem("resid-sort",sortBy)}catch(x){}}],
    act,clearId:"tfClear",onClear:()=>tfReset(),groups:G,
    foot:tfOn()||query?(n?`${n} ${n===1?"tema encontrado":"temas encontrados"}`:"Nenhum tema com esses filtros"):"Toque numa grande área para ver as especialidades.",links:[bk],
    onDone:()=>{tfPanel=false;lsSet("resid-tfpanel",null);render();const a=$("#areas");if(a)a.scrollIntoView({block:"start"})}});
  renderBulkBar()}
/* ----- "Já estudei antes": marcar vários temas de uma vez, com a primeira revisão espalhada ----- */
let bulk=null,bulkUndo=null;
function bulkCap(){return Math.max(3,ui.prefs.planN+1)}
function renderBulkBar(){let bar=$("#bulkBar");if(!bulk&&!bulkUndo){if(bar)bar.remove();return}
  if(!bar){bar=el(`<div class="bulkbar" id="bulkBar" role="region" aria-label="Marcação em lote"></div>`);document.body.appendChild(bar)}bar.innerHTML="";
  if(!bulk){const u=bulkUndo,m=el(`<p><span></span> <button class="link" type="button">Desfazer</button> <button class="link" type="button">Fechar</button></p>`);m.querySelector("span").textContent=`${u.keys.length} ${u.keys.length===1?"tema marcado":"temas marcados"} como já estudados.`;
    const [d,c]=m.querySelectorAll("button");d.onclick=()=>{u.keys.forEach(k=>{if(u.prev[k])state[k]=u.prev[k];else delete state[k]});bulkUndo=null;commit()};c.onclick=()=>{bulkUndo=null;render()};bar.appendChild(m);return}
  const n=bulk.sel.size,days=Math.ceil(n/bulkCap());
  const t=el(`<div class="bbtop"><b></b><span class="ks"></span></div>`);t.querySelector("b").textContent=`${n} ${n===1?"tema selecionado":"temas selecionados"}`;
  t.querySelector(".ks").textContent=n?`1ª revisão espalhada em ${days} ${days===1?"dia":"dias"} (até ${bulkCap()} por dia)`:"Toque nos temas da lista que você já estudou antes de usar o app.";bar.appendChild(t);
  const lv=el(`<div class="seg" role="group" aria-label="Como estão esses temas"></div>`);[[1,"Estudados"],[2,"Já revisados"]].forEach(([v,l])=>{const b=el(`<button type="button" aria-pressed="${bulk.lv===v}"></button>`);b.textContent=l;b.onclick=()=>{bulk.lv=v;renderBulkBar()};lv.appendChild(b)});bar.appendChild(lv);
  const a=el(`<div class="btns"></div>`),ok=el(`<button class="btn primary" type="button" id="bulkOk">Confirmar</button>`),cc=el(`<button class="btn" type="button">Cancelar</button>`);ok.disabled=!n;
  ok.onclick=()=>{const keys=[...bulk.sel].filter(k=>BYKEY[k]),prev={},cap=bulkCap(),T=today();
    keys.sort((x,y)=>wOf(BYKEY[y])-wOf(BYKEY[x])||BYKEY[x].num-BYKEY[y].num).forEach((k,i)=>{prev[k]=state[k]?{...state[k]}:null;const s={...get(k)},off=1+Math.floor(i/cap);
      s.last=T;s.step=bulk.lv===2?1:0;s.l=Math.max(s.l||0,bulk.lv);s.adj=off-INT[s.step];s.adjFrom=T;s.pre0=1;state[k]=s});
    bulkUndo={keys,prev};bulk=null;commit()};
  cc.onclick=()=>{bulk=null;render()};a.append(ok,cc);bar.appendChild(a)}
function bulkToggle(k){if(!bulk)return;bulk.sel.has(k)?bulk.sel.delete(k):bulk.sel.add(k);render()}
/* ----- agenda de revisões (próximos 14 dias) e "Equilibrar" ----- */
let agOpen=null,agMsg="";
function agItems(){return [...ALL,...FAC_ITEMS].filter(i=>get(i.key).last)}
function agDays(){const D=[...Array(14)].map(()=>[]);agItems().forEach(it=>{const d=dueIn(get(it.key));if(d===null||d>13)return;D[Math.max(0,d)].push(it)});return D}
function agCap(D){const tot=D.reduce((a,x)=>a+x.length,0);return Math.max(3,Math.ceil(tot/14*1.25))}
function agBalance(){const D=agDays(),cap=agCap(D),T=today();let moved=0;
  const setDue=(it,day)=>{const k=it.key,s={...get(k)},base=dnum(s.last)+INT[Math.min(s.step||0,INT.length-1)];s.adj=dnum(T)+day-base;s.adjFrom=s.last;state[k]=s;moved++};
  // hoje (com as atrasadas): fica o mais urgente; o resto vai para os próximos dias com espaço
  const pri=(a,b)=>dueIn(get(a.key))-dueIn(get(b.key))||wOf(b)-wOf(a);
  if(D[0].length>cap){const rest=D[0].sort(pri).slice(cap);D[0]=D[0].slice(0,cap);rest.forEach(it=>{for(let d=1;d<7;d++){if(D[d].length<cap){D[d].push(it);setDue(it,d);return}}})}
  // dias futuros cheios: adianta o excesso para dias mais leves antes deles (ou, sem espaço, adia até 3 dias)
  for(let d=1;d<14;d++){while(D[d].length>cap){let lighter=[...Array(d).keys()].slice(1).filter(x=>D[x].length<cap).sort((a,b)=>D[a].length-D[b].length||b-a)[0];
      if(lighter===undefined)lighter=[d+1,d+2,d+3].filter(x=>x<14&&D[x].length<cap)[0];// sem espaço antes: adia no máximo 3 dias
      if(lighter===undefined)break;
      const it=D[d].sort((a,b)=>wOf(a)-wOf(b)).shift();D[lighter].push(it);setDue(it,lighter)}}
  agMsg=moved?`${moved} ${moved===1?"revisão foi remanejada":"revisões foram remanejadas"} para no máximo ${cap} por dia.`:"A agenda já está equilibrada.";commit()}
function renderAgenda(){const box=$("#revAgenda");if(!box)return;box.innerHTML="";renderAgenda0(box);if(view==="temas"){const w=weekEl();w.id="agWeek";box.appendChild(w)}}
/* "Próximos dias" (Lote 17): agenda das revisões (14 dias) + o plano dos próximos 6 dias num cartão só */
function renderAgenda0(box){const D=agDays(),cap=agCap(D),mx=Math.max(cap,...D.map(x=>x.length),1),T=dnum(today()),wd=["D","S","T","Q","Q","S","S"];
  box.appendChild(el(`<div class="dhead"><h2>Próximos dias</h2><span class="todaydate">revisões em 14 dias e plano em 6</span></div>`));
  const tot=D.reduce((a,x)=>a+x.length,0);
  if(!tot){box.appendChild(el(`<p class="cempty">Nenhuma revisão nos próximos 14 dias. Elas aparecem aqui conforme você estuda os temas.</p>`));return}
  const g=el(`<div class="agrid" role="list"></div>`);
  D.forEach((list,i)=>{const day=fromNum(T+i),dt=new Date(T*864e5),w=wd[(new Date(day+"T12:00:00").getDay())],over=list.length>cap;
    const b=el(`<button type="button" class="agday${i===0?" now":""}${over?" over":""}${agOpen===i?" sel":""}" role="listitem"><span class="agn">${list.length||""}</span><span class="agb"><i style="height:${list.length/mx*100}%"></i></span><span class="agw">${w}</span><span class="agd">${br(day).slice(0,2)}</span></button>`);
    b.dataset.tip=`${i===0?"Hoje (com as atrasadas)":["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"][new Date(day+"T12:00:00").getDay()]+" "+br(day)}: ${list.length} ${list.length===1?"revisão":"revisões"}`;b.onclick=()=>{agOpen=agOpen===i?null:i;render()};g.appendChild(b)});
  box.appendChild(g);
  const over=D.filter(x=>x.length>cap).length;
  const info=el(`<p class="how"></p>`);info.textContent=`${tot} ${tot===1?"revisão":"revisões"} em 14 dias · ritmo confortável: até ${cap} por dia.${over?` ${over} ${over===1?"dia passa":"dias passam"} disso.`:""}`;box.appendChild(info);
  if(agMsg){const m=el(`<p class="pnote" role="status"></p>`);m.textContent=agMsg;box.appendChild(m)}
  if(over){const eb=el(`<button class="btn" type="button" id="agBal">Equilibrar</button>`);eb.onclick=agBalance;box.appendChild(eb);
    box.appendChild(el(`<p class="how hx">Equilibrar adianta revisões dos dias cheios para dias mais leves (se não houver espaço antes, adia no máximo 3 dias) e, se hoje estiver acumulado, passa as menos urgentes para os próximos dias. As mais atrasadas e de maior incidência ficam primeiro.</p>`))}
  if(agOpen!==null&&D[agOpen]){const ul=el(`<ul class="uplist aglist"></ul>`);D[agOpen].sort((a,b)=>wOf(b)-wOf(a)).forEach(it=>{const li=el(`<li><span class="ud"></span><button class="link" type="button"></button></li>`);li.querySelector(".ud").textContent=dueLabel(dueIn(get(it.key)));const bt=li.querySelector("button");bt.textContent=it.t;bt.onclick=()=>openTopic(it.key);ul.appendChild(li)});
    if(!D[agOpen].length)ul.appendChild(el(`<li class="how">Nenhuma revisão neste dia.</li>`));box.appendChild(ul)}}
/* ---------- Residência: mapa, sugestões de nível ---------- */
function renderResMap(){const box=$("#resMap");if(!box)return;box.innerHTML="";
  box.appendChild(el(`<div class="dhead"><h2>Mapa da residência</h2><span class="todaydate">${TOTAL} temas</span></div>`));
  const wrap=el(`<div class="rmap"></div>`);
  AREAS.forEach(a=>{const g=el(`<div class="rmarea"><span class="rmh"><b>${a.code}</b> <span></span></span><div class="rmspecs"></div></div>`);g.querySelector(".rmh span").textContent=a.name;
    (a.specs||[{name:"",items:a.items}]).forEach(sp=>{const r=el(`<div class="rmsp"><span class="rmsn"></span><div class="rmcells"></div></div>`);r.querySelector(".rmsn").textContent=sp.name;
      sp.items.forEach(it=>{const s=get(it.key),l=tfLevel(s),c=el(`<button type="button" class="rmc l${l}${isDue(s)?" due":""}${isWeak(s)?" weak":""}"></button>`);
        c.dataset.tip=`${it.t} · ${lvName(s)}${s.qt?` · ${Math.round(acc(s)*100)}% em ${s.qt}`:""}${isDue(s)?" · revisão pendente":""}`;c.setAttribute("aria-label",c.dataset.tip);c.onclick=()=>openTopic(it.key);r.querySelector(".rmcells").appendChild(c)});
      g.querySelector(".rmspecs").appendChild(r)});
    wrap.appendChild(g)});
  box.appendChild(wrap);
  box.appendChild(el(`<div class="clegend"><span><i class="sw rmk l0"></i>não iniciado</span><span><i class="sw rmk li"></i>estudando</span><span><i class="sw rmk l1"></i>estudado</span><span><i class="sw rmk l2"></i>revisado</span><span><i class="sw rmk l3"></i>dominado</span><span><i class="sw rmk l0 due"></i>revisão pendente</span><span><i class="sw rmk l0 weak"></i>ponto fraco</span></div>`));
  box.appendChild(el(`<p class="cnote">Cada quadrado é um tema. Toque para abrir.</p>`))}
/* domínio automático: propõe subir para Dominado quando bate os critérios, e voltar para Revisado quando o acerto cai */
const lvMeets=s=>(s.l||0)===2&&s.qt>=10&&acc(s)>=0.8&&(s.step||0)>=2;
function lvDrop(k){const s=get(k);if((s.l||0)!==3)return null;const tr=qTrend(k);if(tr&&tr.rq>=5&&tr.r<70)return `${tr.r}% nos últimos 30 dias`;
  let rq=0,rc=0;const t=dnum(today());for(const d in s.qd||{}){const v=s.qd[d];if(Array.isArray(v)&&t-dnum(d)<30){rq+=v[0]||0;rc+=v[1]||0}}if(rq>=5&&rc/rq<0.7)return `${Math.round(rc/rq*100)}% nos últimos 30 dias`;return null}
function lvSuggestions(){const t=today(),out=[];[...ALL,...FAC_ITEMS].forEach(it=>{const s=get(it.key);if(s.lvDis&&dnum(t)-dnum(s.lvDis)<14)return;
  if(lvMeets(s))out.push({it,up:true,why:`${Math.round(acc(s)*100)}% em ${s.qt} questões e ${s.step} revisões seguidas sem dificuldade`});
  else{const d=lvDrop(it.key);if(d)out.push({it,up:false,why:`acerto caiu para ${d}`})}});return out.sort((a,b)=>b.up-a.up||wOf(b.it)-wOf(a.it))}
function renderLvSug(){const box=$("#lvSug");if(!box)return;box.innerHTML="";const L=lvSuggestions();box.hidden=!L.length;if(!L.length)return;
  box.appendChild(el(`<div class="dhead"><h2>Sugestões de nível</h2><span class="todaydate">${L.length}</span></div>`));
  const ul=el(`<ul class="lvlist"></ul>`);L.slice(0,5).forEach(x=>{const li=el(`<li><span class="lvt"><button class="link" type="button"></button><span class="ks"></span></span><span class="btns"></span></li>`);
    const b=li.querySelector(".link");b.textContent=x.it.t;b.onclick=()=>openTopic(x.it.key);li.querySelector(".ks").textContent=(x.up?"Pronto para Dominado: ":"Dominado, mas o ")+x.why+".";
    const go=el(`<button class="btn ${x.up?"primary":""}" type="button"></button>`);go.textContent=x.up?"Marcar como Dominado":"Voltar para Revisado";go.onclick=()=>{upd(x.it.key,s=>{s.l=x.up?3:2;delete s.lvDis});commit()};
    const no=el(`<button class="btn" type="button">Agora não</button>`);no.onclick=()=>{upd(x.it.key,s=>{s.lvDis=today()});commit()};
    li.querySelector(".btns").append(go,no);ul.appendChild(li)});
  box.appendChild(ul);if(L.length>5)box.appendChild(el(`<p class="how">+ ${L.length-5} temas com sugestão.</p>`));
  box.appendChild(el(`<p class="how hx">Dominado: 80% ou mais em 10+ questões e duas revisões seguidas sem dificuldade. Volta para Revisado se o acerto dos últimos 30 dias cair abaixo de 70% (com 5+ questões). "Agora não" esconde por 14 dias.</p>`))}
/* ---------- Residência: prévia da semana e temas fixados ---------- */
let weekOpen=false;
/* simula os próximos 6 dias supondo que você cumpre o plano e faz as revisões de cada dia (nada é salvo) */
/* simulação: estuda os subtópicos do dia; o tema só conta como estudado quando todos estiverem marcados */
function simStudy(k,subs){const it=BYKEY[k];if(!it)return;const s={...get(k)};if(s.last)return;
  if(subs&&subs.length){const sd=new Set(s.sd||[]),cs=(s.cs||[]).map(c=>({...c}));subs.forEach(t=>{const i=it.subs.indexOf(t);if(i>=0)sd.add(i);else{const j=cs.findIndex(c=>c.t===t);if(j>=0)cs[j].d=true}});
    s.sd=[...sd].sort((a,b)=>a-b);if(cs.length)s.cs=cs;if(sd.size+cs.filter(c=>c.d).length<it.subs.length+cs.length){s.ing=s.ing||{d:today(),m:"a"};state[k]=s;return}}
  s.last=today();s.step=0;s.l=Math.max(s.l||0,1);delete s.ing;state[k]=s}
function weekPreview(){const snap=state,out=[];
  try{state=JSON.parse(JSON.stringify(state));const POOL=[...ALL,...FAC_ITEMS];
    ensurePlan().items.forEach(p=>simStudy(p.k,p.subs));
    POOL.filter(x=>isDue(get(x.key))).forEach(x=>{const s={...get(x.key)};s.last=today();s.step=Math.min((s.step||0)+1,INT.length-1);delete s.adj;state[x.key]=s});
    for(let i=1;i<=6;i++){dayOff=i;const plan=buildPlan(),revs=POOL.filter(x=>isDue(get(x.key)));
      out.push({d:today(),items:plan.map(x=>({k:x.it.key,cls:x.cls,txt:x.txt})),rev:revs.length});
      plan.forEach(x=>simStudy(x.it.key,x.cls==="r-new"||x.cls==="r-cont"||x.cls==="r-eixo"?partSubs(x.it).subs:null));
      revs.forEach(x=>{const s={...get(x.key)};s.last=today();s.step=Math.min((s.step||0)+1,INT.length-1);delete s.adj;state[x.key]=s})}}
  finally{dayOff=0;state=snap}return out}
function weekEl(){const w=el(`<details class="plain pweek"${weekOpen?" open":""}><summary>Plano dos próximos 6 dias</summary></details>`);w.addEventListener("toggle",()=>{if(w.open!==weekOpen){weekOpen=w.open;render()}});
  if(!weekOpen)return w;
  const wd=["dom","seg","ter","qua","qui","sex","sáb"],ol=el(`<ol class="pwlist"></ol>`);
  weekPreview().forEach(D=>{const li=el(`<li><span class="pwd"></span><span class="pwi"></span><span class="pwr"></span></li>`);li.querySelector(".pwd").textContent=`${wd[new Date(D.d+"T12:00:00").getDay()]} ${br(D.d)}`;
    const box=li.querySelector(".pwi"),dw=wdOf(dnum(D.d));if(WK_OFF.has(dw)){li.classList.add("pwoff");box.textContent="folga"}else if(!D.items.length)box.textContent=WK_NEW.has(dw)?"sem temas novos":"sem temas novos (dia sem temas novos)";if(WK_SIM.has(dw)&&!WK_OFF.has(dw))box.append(D.items.length?" · simulado":"simulado");D.items.forEach((x,j)=>{const b=el(`<button class="link" type="button"></button>`);b.textContent=BYKEY[x.k].t;b.title=x.txt;b.onclick=()=>openTopic(x.k);if(j)box.append(" · ");box.appendChild(b)});
    li.querySelector(".pwr").textContent=D.rev?`${D.rev} ${D.rev===1?"revisão":"revisões"}`:"";ol.appendChild(li)});
  w.appendChild(ol);w.appendChild(el(`<p class="how hx">Prévia supondo que você cumpre o plano e as revisões de cada dia. O plano de cada dia só é montado naquele dia e muda conforme o que você fizer (questões, provas da faculdade, pontos fracos).</p>`));return w}
/* temas fixados (estrela) */
function togglePin(k){upd(k,s=>{if(s.pin)delete s.pin;else s.pin=1});commit()}
function renderPins(){const box=$("#pinBox");if(!box)return;box.innerHTML="";const P=[...ALL,...FAC_ITEMS].filter(i=>get(i.key).pin);box.hidden=!P.length||!!bulk;if(box.hidden)return;
  box.appendChild(el(`<div class="dhead"><h2>★ Fixados</h2><span class="todaydate">${P.length}</span></div>`));
  const ul=el(`<ul class="pinlist"></ul>`);P.forEach(it=>{const s=get(it.key),d=dueIn(s),li=el(`<li><button class="pint" type="button"><b></b><span></span></button><span class="lvl" data-l="${lvKey(s)}">${lvName(s)}</span><button class="pinx" type="button" aria-label="Desafixar" title="Desafixar">★</button></li>`);
    li.querySelector("b").textContent=it.t;li.querySelector(".pint span").textContent=`${it.own?"FAC":it.area.code} · ${it.sp||""}${d!==null?" · "+dueLabel(d):""}${s.qt?` · ${Math.round(acc(s)*100)}% em ${s.qt}`:""}`;
    li.querySelector(".pint").onclick=()=>openTopic(it.key);li.querySelector(".pinx").onclick=()=>togglePin(it.key);ul.appendChild(li)});box.appendChild(ul)}
