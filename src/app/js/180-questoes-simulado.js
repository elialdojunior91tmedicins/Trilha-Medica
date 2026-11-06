/* ---------- Questões: partes (Resumo, Praticar, Temas), simulado misto e ritmo por questão ---------- */
let qSeg="resumo";try{const v=localStorage.getItem("resid-qseg");if(["resumo","praticar","temas"].includes(v))qSeg=v}catch(e){}
function setQSeg(v,p){qSeg=v;try{localStorage.setItem("resid-qseg",v)}catch(e){}const P=p||{praticar:"sim",resumo:"resumo",temas:"resumo"}[v];if(P){qPart=P;lsSet("resid-qpart",P)}render();window.scrollTo({top:0})}
/* ritmo: segundos e questões cronometradas por dia, no histórico (hist[d].ts / hist[d].tq) */
function logPace(d,n,sec){const h=hist[d]||(hist[d]={});h.tq=Math.max(0,(h.tq||0)+n);h.ts=Math.max(0,(h.ts||0)+Math.round(sec));try{localStorage.setItem(LSH,JSON.stringify(hist))}catch(e){}}
const fmtPace=s=>{s=Math.round(s);return s<60?`${s}s`:`${Math.floor(s/60)}min${s%60?String(s%60).padStart(2,"0")+"s":""}`};
function qPaceEl(){const t=dnum(today());let n=0,s=0,n7=0,s7=0;for(let i=0;i<30;i++){const h=hist[fromNum(t-i)];if(h&&h.tq){n+=h.tq;s+=h.ts||0;if(i<7){n7+=h.tq;s7+=h.ts||0}}}
  const ref=ui.prefs.qpace,w=el(`<div class="qpace"></div>`);
  const sel=el(`<label class="qfsel qgsel"><span>Tempo da prova</span><select id="qPaceSel"></select></label>`),sl=sel.querySelector("select");
  [[120,"2 min por questão"],[150,"2min30s"],[180,"3 min"],[210,"3min30s"],[240,"4 min"]].forEach(([v,l])=>{const o=document.createElement("option");o.value=v;o.textContent=l;sl.appendChild(o)});sl.value=String(ref);sl.onchange=()=>{ui.prefs.qpace=+sl.value;saveUI();render()};
  const ed=el(`<button class="link qgedit" type="button" id="qPaceEd"></button>`);ed.textContent=`tempo da prova: ${fmtPace(ref)} ✎`;ed.onclick=()=>cfGo("cfQ");
  if(!n){w.appendChild(el(`<p class="how qgtxt"><b>Ritmo:</b> ainda sem questões cronometradas. O simulado mede o tempo de cada questão; no registro rápido, informe quantos minutos levou.</p>`));w.appendChild(ed);return w}
  const avg=s/n,ok=avg<=ref,box=el(`<div class="qgm"><div class="qgtop"><b>${fmtPace(avg)}</b><span>por questão nos últimos 30 dias (${n} cronometradas)</span></div><div class="meter pace${ok?" ok":" slow"}"><i style="width:${Math.min(100,avg/ref/1.5*100)}%"></i><span class="pref" style="left:${100/1.5}%"></span></div><p class="how qgtxt"></p></div>`);
  box.querySelector(".qgtxt").textContent=`${ok?"Dentro":"Acima"} do tempo da prova (${fmtPace(ref)})${ok?"":`: ${fmtPace(avg-ref)} a mais por questão`}.${n7?` Últimos 7 dias: ${fmtPace(s7/n7)}.`:""}`;
  w.append(box,ed);return w}
/* simulado misto: questões de vários temas num bloco só */
let sim=null,simCfg={src:"gain",n:10,dif:"mista",est:"res"},simSubs={},simPF={q:"",area:"all",lv:"all",inc:0};
const SIM_SRC=[["pick","Escolher temas"],["week","Temas da semana"],["gain","Onde focar"],["due","Revisões de hoje"],["plan","Plano de hoje"],["errs","Meus erros"],["redo","Questões para refazer"],["filter","Filtro atual"]];
/* Lote 14: dificuldade e estilo do simulado */
const SIM_DIF=[["mista","Mista"],["facil","Fácil"],["media","Média"],["dificil","Difícil"]],SIM_EST=[["res","Residência"],["inep","ENAMED / INEP"]];
const simEstList=()=>facModels().length?[...SIM_EST,["fac","Da minha faculdade"]]:SIM_EST;
const SIM_DIF_TXT={mista:"Misture os níveis: cerca de 30% fáceis, 50% médias e 20% difíceis.",facil:"Nível fácil: casos típicos, que cobram o conceito central de forma direta, com distratores que quem estudou distingue sem dificuldade.",
  media:"Nível médio, como a média das provas de residência.",dificil:"Nível difícil: apresentações atípicas ou com o dado decisivo sutil, exceções, condutas de segunda linha e distratores muito próximos da correta (sem pegadinha de português)."};
const SIM_EST_TXT={res:"",inep:"Estilo ENAMED/INEP: cada questão é uma situação-problema contextualizada (caso clínico com os dados necessários, alguns irrelevantes, como na prática do médico generalista no SUS), com comando claro e afirmativo (sem \"exceto\", \"incorreta\" ou \"não\" no comando) e exatamente 4 alternativas (A a D), homogêneas e plausíveis, com uma única correta. Use 4 alternativas mesmo que as instruções acima falem em cinco."};
function simStyleTxt(c){c=c||simCfg;return [SIM_DIF_TXT[c.dif]||SIM_DIF_TXT.mista,c.est==="fac"?facStyleTxt():SIM_EST_TXT[c.est]||""].filter(Boolean).join("\n")}
/* Lote 18: provas antigas da faculdade (importadas como prova na íntegra e marcadas "Modelo da faculdade") ensinam ao gerador o jeito de cobrar:
   tamanho do caso, nº de alternativas, caso clínico ou pergunta direta, comando negativo, e 2 exemplos só de formato */
const facModels=()=>exams.filter(e=>e.mod&&e.qs.some(r=>r.q&&r.q.enunciado));
function facStyle(){const Q=facModels().flatMap(e=>e.qs.filter(r=>r.q&&r.q.enunciado&&!r.an).map(r=>r.q));if(!Q.length)return null;
  const words=Q.map(q=>q.enunciado.trim().split(/\s+/).length).sort((a,b)=>a-b),med=words[Math.floor(words.length/2)];
  const na={};Q.forEach(q=>{const n=q.alternativas.length;na[n]=(na[n]||0)+1});const alt=+Object.keys(na).sort((a,b)=>na[b]-na[a])[0];
  const caso=Q.filter(q=>/\b(anos|paciente|procura|admitid|comparece|refere|queixa)\b/i.test(q.enunciado)).length/Q.length,neg=Q.filter(q=>/\b(exceto|incorreta|falsa|n[ãa]o\s+(é|está|se))\b/i.test(q.enunciado.split(/[.?!]\s/).pop()||"")).length/Q.length;
  const ex=Q.filter(q=>q.enunciado.length>=120).slice(0,2);return {n:Q.length,med,alt,caso,neg,ex,names:facModels().map(e=>e.name)}}
function facStyleTxt(){const F=facStyle();if(!F)return "";
  return `Estilo da faculdade do estudante: imite o JEITO de cobrar das provas da faculdade dele (${F.names.slice(0,3).map(n=>`"${n}"`).join(", ")}; ${F.n} questões analisadas), não o conteúdo.
- Enunciado com cerca de ${F.med} palavras${F.caso>=.5?"; a maioria em forma de caso clínico":F.caso>=.2?"; parte em caso clínico, parte em pergunta direta":"; perguntas diretas, quase sem caso clínico"}.
- Exatamente ${F.alt} alternativas (${"ABCDEFGH".slice(0,F.alt).split("").join(", ")}), mesmo que as instruções acima falem em outro número.
- ${F.neg>=.15?`Cerca de ${Math.round(F.neg*100)}% das questões com comando negativo ("exceto", "incorreta"), como nessas provas.`:"Comando afirmativo (quase nunca \"exceto\" ou \"incorreta\")."}
${F.ex.length?`Exemplos de formato (não copie o conteúdo nem o caso):\n${F.ex.map((q,i)=>`Exemplo ${i+1}: ${q.enunciado.replace(/\s+/g," ").slice(0,600)}\n${q.alternativas.map(a=>`${a.letra}) ${a.texto.replace(/\s+/g," ").slice(0,140)}`).join("\n")}`).join("\n\n")}`:""}`}
function simCfgSnap(){return {mode:["mat","banco"].includes(simCfg.mode)?simCfg.mode:"temas",src:simCfg.src,n:simCfg.n,dif:simCfg.dif||"mista",est:simCfg.est||"res",picks:[...simPick].filter(k=>BYKEY[k]),subs:JSON.parse(JSON.stringify(simSubs)),pid:simCfg.pid||""}}
const simProva=()=>fac.provas.find(x=>x.id===simCfg.pid&&x.date>=today())||upcomingProvas().find(p=>p.items.some(refOk));
function simSrcList(){const p=simProva(),L=SIM_SRC;return p?[["prova",`Prova: ${p.name}`],...L]:L}
function simTopics(src,U){const pool=[...ALL,...FAC_ITEMS];
  if(src==="gain"||src==="weak")return focusRank(U).slice(0,15);
  if(src==="week"){const ws=fromNum(wpMon(dnum(today()))),L=pool.filter(i=>{const s=get(i.key);return (s.ed||[]).some(d=>d>=ws)||(s.last&&s.last>=ws)||(s.qd&&Object.keys(s.qd).some(d=>d>=ws))});return L}// "Pontos fracos" e "Onde ganhar pontos" viraram uma fonte só
  if(src==="due")return pool.filter(i=>isDue(get(i.key)));
  if(src==="plan")return ensurePlan().items.map(p=>BYKEY[p.k]).filter(Boolean);
  if(src==="prova"){const p=simProva();return p?topicKeysOf(p.items).map(k=>BYKEY[k]):[]}
  if(src==="errs")return [...new Set(errors.filter(e=>BYKEY[e.k]&&!e.arch).map(e=>e.k))].map(k=>BYKEY[k]);
  if(src==="redo")return [...new Set(redo.filter(x=>BYKEY[x.k]).map(x=>x.k))].map(k=>BYKEY[k]);
  if(src==="pick")return [...simPick].filter(k=>BYKEY[k]).map(k=>BYKEY[k]);
  return U}
/* fonte "Para refazer": um caso novo para cada questão do Refazer (as que vencem primeiro); acertar conta como acerto dela no Refazer */
function rdSimItems(n){return redo.filter(x=>BYKEY[x.k]).sort((a,b)=>(rdDue(a)<rdDue(b)?-1:rdDue(a)>rdDue(b)?1:0)||b.n-a.n).slice(0,n).map(x=>({k:x.k,sub:"",rd:x.id}))}
function simPrompt(items){return promptText.trim()+`

Tarefa
Monte um simulado com ${items.length} ${items.length===1?"questão inédita":"questões inéditas"}, uma para cada item abaixo, na mesma ordem (a 1ª questão é sobre o item 1, a 2ª sobre o item 2, e assim por diante):
${items.map((x,i)=>{const it=BYKEY[x.k],er=x.err&&errors.find(e=>e.id===x.err),rq=x.rd&&(redo.find(y=>y.id===x.rd)||{}).q,ra=rq&&rq.alternativas.find(a=>a.letra===rq.correta);return `${i+1}. Tema "${it.t}" (área: ${areaLabel(it)})${x.sub?`, com foco no subtópico "${x.sub}"`:""}${x.ctx?` (${x.ctx})`:""}${er?`. O estudante já errou este ponto: "${eOneLine(er.w).slice(0,300)}"; o correto é: "${eOneLine(er.r).slice(0,300)}". Crie um caso NOVO (outro paciente, outra apresentação) que cobre exatamente esse ponto, sem repetir o enunciado original`:""}${rq?`. O estudante errou uma questão sobre este ponto; a resposta certa era "${(ra?ra.texto:"").slice(0,200)}"${rq.conceito?` (conceito: ${rq.conceito.slice(0,200)})`:""}. Crie um caso NOVO que cobre exatamente esse ponto, sem repetir o enunciado original`:""}`}).join("\n")}
Varie o tipo de pergunta entre os itens (diagnóstico, conduta, exame, complicação, exceção), como numa prova de residência.
${simStyleTxt(sim&&sim.cfg)}

${fixedFormat(items.length)}`}
const SIM_DESC={week:"O que você estudou ou revisou nesta semana",prova:"Os temas da prova da faculdade",weak:"Temas com acerto abaixo de 60%",gain:"Os mais cobrados com acerto mais longe de 80%",due:"Temas com revisão hoje",plan:"Os temas de Estudar hoje",errs:"Casos novos sobre o que você já errou",redo:"Casos novos sobre as questões que você errou",pick:"Busque e marque temas e subtópicos",filter:"Os temas que aparecem com os filtros da aba"};
/* simulado a partir do material: as questões seguem o material; o Claude indica o tema da residência mais próximo de cada uma */
function simMatPrompt(n,P,avoid){return promptText.trim()+`

Tarefa
Monte um simulado com ${n} ${n===1?"questão inédita":"questões inéditas"} a partir do material do estudante abaixo, cobrindo pontos diferentes dele (pode passar por várias áreas, se o material passar). Varie o tipo de pergunta (diagnóstico, conduta, exame, complicação, exceção), como numa prova de residência.
${simStyleTxt(sim&&sim.cfg)}${avoid&&avoid.length?`
Não repita estes pontos, já cobrados nas questões anteriores deste simulado:
${avoid.map(x=>"- "+x).join("\n")}`:""}
Em cada questão, acrescente o campo "tema": a chave (ex.: "CM-34") do tema da lista TEMAS abaixo mais próximo do assunto principal da questão.

TEMAS (chave · tema · área / especialidade)
${impTopics()}`+genMatPrompt(P)+`

${fixedFormat(n)}
Cada objeto tem também o campo "tema" com a chave do tema.`}
function simGuessK(q,prev){const sc=impTemaScores(q.conceito+" "+q.enunciado.slice(0,400),q.comentario||""),b=Object.entries(sc).sort((a,c)=>c[1]-a[1])[0];if(b&&b[1]>=3)return b[0];
  const cnt={};prev.forEach(x=>{cnt[x.k]=(cnt[x.k]||0)+1});const t=Object.entries(cnt).sort((a,c)=>c[1]-a[1])[0];return t?t[0]:(b?b[0]:ALL[0].key)}
async function simStartMat(){const P0=msPack(simMat),n=simCfg.n,items=Array.from({length:n},()=>({k:"",mat:true}));
  const S=sim={status:"loading",items,qs:[],i:0,ans:{},t:{},msg:"",ctl:new AbortController(),src:"mat",mat:true,shown:0,start:0,P:P0,cfg:simCfgSnap()};render();let bi=0;
  const site=!!window.__site;
  let fails=0;
  while(S.qs.length<items.length){const k=Math.min(BATCH,items.length-S.qs.length),P=msPart(P0,bi),mo=site?{title:"Simulado do seu material",hint:(P.attach||P.scan||P.imgs.length)?"Copie o pedido, abra uma conversa nova no app do Claude ou em claude.ai, ANEXE os seus materiais (PDF, slides ou fotos) e cole o pedido.":"Copie o pedido e cole numa conversa nova no app do Claude ou em claude.ai. O texto dos seus materiais já vai junto."}:(P.imgs.length?{images:P.imgs}:{});
    try{const data=await sampleFn.json(simMatPrompt(k,P,S.qs.map(q=>q.conceito||q.enunciado.slice(0,120))),{...mo,signal:S.ctl.signal,cache:false,onText:()=>{const s=$("#simSt");if(s)s.textContent=`Escrevendo as questões ${S.qs.length+1} a ${S.qs.length+k} de ${items.length}…`}});
      if(sim!==S||S.stopped)return;const raw=Array.isArray(data)?data:(data&&Array.isArray(data.questoes)?data.questoes:[]),qs=validQs(raw).slice(0,k);
      if(!qs.length){if(++fails>=2){S.msg=GEN_ERR.invalid_json;break}continue}fails=0;bi++;
      qs.forEach(q=>{const t=String(q.tema||"").trim().toUpperCase(),kk=BYKEY[t]&&!BYKEY[t].own?t:simGuessK(q,S.qs);delete q.tema;figBind(q,P);S.qs.push({...q,k:kk,mat:true});bankAdd({...q,mat:true},"simulado",kk,P)});
      if(S.status==="loading"){S.status="run";S.start=Date.now();S.shown=Date.now()}render()}
    catch(e){if(sim!==S||S.stopped)return;const code=e&&e.code;if(code==="cancelled"){if(!S.qs.length){sim=null;render();return}break}
      S.msg=GEN_OFF.includes(code)?"A geração de questões não está disponível nesta visualização.":(GEN_ERR[code]||"Não foi possível gerar o simulado agora. Tente novamente.");break}}
  if(sim!==S||S.stopped)return;items.length=S.qs.length;if(!S.qs.length){S.status="error"}else if(S.status==="loading"){S.status="run";S.start=Date.now();S.shown=Date.now()}S.gen=true;render()}
async function simStart(U){if(!sampleFn)return;if(simCfg.mode==="mat"){if(genMatOn(simMat))simStartMat();return}const T=simTopics(simCfg.src,U);if(!T.length)return;
  const ts=shuffle(T),items=simCfg.src==="errs"?eSimItems(simCfg.n):simCfg.src==="redo"?rdSimItems(simCfg.n):[],used={};if(simCfg.src!=="errs"&&simCfg.src!=="redo")for(let i=0;i<simCfg.n;i++){const it=ts[i%ts.length],L=subList(it),ch=simCfg.src==="pick"&&simSubs[it.key]&&simSubs[it.key].length?simSubs[it.key].filter(t=>L.some(x=>x.t===t)):null;
    let pick="";if(ch&&ch.length){const u=used[it.key]=(used[it.key]||0);pick=ch[u%ch.length];used[it.key]++}else {const P0=L.filter(x=>x.done).length?L.filter(x=>x.done):L,PH=P0.filter(x=>x.hy);pick=P0.length?(PH.length&&Math.random()<.6?shuffle(PH):shuffle(P0))[0].t:""}items.push({k:it.key,sub:pick})}
  if(simCfg.src==="prova"){const p=simProva(),d=p&&discOf(p.discId);if(p){simCfg.pid=p.id;items.forEach(x=>{x.ctx=`para a prova "${p.name}"${d?` da disciplina ${provaDiscName(p)}`:""} da faculdade`;
    const sr=p.items.find(r=>r.startsWith("S:")&&refTopic(r).k===x.k);if(sr)x.sub=refTopic(sr).sub})}}
  const S=sim={status:"loading",items,qs:[],i:0,ans:{},t:{},msg:"",ctl:new AbortController(),src:simCfg.src,shown:0,start:0,cfg:simCfgSnap()};render();
  let fails=0;
  while(S.qs.length<items.length){const part=items.slice(S.qs.length,S.qs.length+BATCH);
    try{const data=await sampleFn.json(simPrompt(part),{signal:S.ctl.signal,cache:false,onText:()=>{const s=$("#simSt");if(s)s.textContent=`Escrevendo as questões ${S.qs.length+1} a ${S.qs.length+part.length} de ${items.length}…`}});
      if(sim!==S||S.stopped)return;const qs=validQs(data).slice(0,part.length);
      if(!qs.length){if(++fails>=2){S.msg=GEN_ERR.invalid_json;break}continue}fails=0;
      qs.forEach((q,j)=>{S.qs.push({...q,k:part[j].k,...(part[j].err?{err:part[j].err}:{}),...(part[j].rd?{rd:part[j].rd}:{})});bankAdd(q,"simulado",part[j].k)});
      if(qs.length<part.length)items.splice(S.qs.length,part.length-qs.length);
      if(S.status==="loading"){S.status="run";S.start=Date.now();S.shown=Date.now()}render()}
    catch(e){if(sim!==S||S.stopped)return;const code=e&&e.code;if(code==="cancelled"){if(!S.qs.length){sim=null;render();return}break}
      S.msg=GEN_OFF.includes(code)?"A geração de questões não está disponível nesta visualização.":(GEN_ERR[code]||"Não foi possível gerar o simulado agora. Tente novamente.");break}}
  if(sim!==S||S.stopped)return;items.length=S.qs.length;if(!S.qs.length){S.status="error"}else if(S.status==="loading"){S.status="run";S.start=Date.now();S.shown=Date.now()}S.gen=true;render()}
function simAnswer(letra){const S=sim,q=S.qs[S.i];if(!q||S.ans[S.i])return;const sec=Math.min(1800,Math.max(1,(Date.now()-S.shown)/1000));
  if(q.bk&&!S.rerun){S.ans[S.i]=letra;S.t[S.i]=sec;const x=bankById.get(q.bk);if(x)bkAnswer(x,letra,sec);return}// B3: questão do banco conta como no banco (1ª vez no tema; Refazer junto)
  S.ans[S.i]=letra;S.t[S.i]=sec;const ok=letra===q.correta;bankAns(q,"simulado",q.k,letra,Math.round(sec),S.rerun?"rerun":"sim",!S.rerun);if(S.rerun){const h=hist[today()]||(hist[today()]={});h.rq=(h.rq||0)+1;commit();return}
  upd(q.k,x=>addQ(x,1,ok?1:0,null,"Claude"));logAct("q",1,ok?1:0);logPace(today(),1,sec);if(!ok&&!q.rd&&!S.rerun)rdAdd(q.k,q,"sim",S.P);
  if(q.rd){const x=redo.find(y=>y.id===q.rd);if(x){if(ok)rdHit(x);else rdMiss(x)}}
  if(q.err){const e=errors.find(x=>x.id===q.err);if(e){if(!ok)eAnswer(e,false);else if(eDue(e)<=today())eAnswer(e,true)}}commit()}
function simNext(){const S=sim;S.i++;S.shown=Date.now();if(S.i>=S.qs.length&&S.gen){S.status="done";simSave(S)}render();const h=$("#simh");if(h)h.scrollIntoView({block:"start"})}
/* resumo antes de começar */
function simSummaryEl(mode,T,nq){const w=el(`<div class="simsum"><ul></ul></div>`),ul=w.querySelector("ul"),li=(lab,val)=>{const x=el(`<li><span></span><b></b></li>`);x.firstChild.textContent=lab;x.lastChild.textContent=val;ul.appendChild(x)};
  li("Questões",`${nq} · ≈ ${Math.max(1,Math.round(nq*ui.prefs.qpace/60))} min no seu ritmo (${fmtPace(ui.prefs.qpace)} por questão)`);
  li("Dificuldade",(SIM_DIF.find(x=>x[0]===(simCfg.dif||"mista"))||SIM_DIF[0])[1]);li("Estilo",(simEstList().find(x=>x[0]===(simCfg.est||"res"))||SIM_EST[0])[1]);
  if(mode==="mat"){const P=genMatOn(simMat)&&(simMat.items||[]).some(msItemOk)?msPack(simMat):null;li("Material",P?`${P.names.join(", ")}${P.chunks.length>1?` · ${P.chunks.length} partes`:""}${P.figs.length?` · ${P.figs.length} ${P.figs.length===1?"figura":"figuras"}`:""}`:simMat&&simMat.attach?"anexado na conversa do Claude":"nenhum ainda")}
  else if(simCfg.src==="errs")li("Temas",`casos novos sobre ${nq} ${nq===1?"erro":"erros"} do caderno`);
  else if(simCfg.src==="redo")li("Temas",`casos novos sobre ${nq} ${nq===1?"questão":"questões"} do Refazer`);
  else{const names=T.slice(0,6).map(i=>i.t+(simCfg.src==="pick"&&simSubs[i.key]&&simSubs[i.key].length?` (${simSubs[i.key].length} ${simSubs[i.key].length===1?"subtópico":"subtópicos"})`:"")).join("; ");li(`Temas · ${T.length}`,T.length?names+(T.length>6?` e mais ${T.length-6}`:""):"nenhum")}
  return w}
/* fonte "Escolher temas": busca em todos os temas, filtros e subtópicos */
function simPickerEl(){const w=el(`<div class="simpick"></div>`),pool=[...ALL,...FAC_ITEMS];
  const pk=[...simPick].filter(k=>BYKEY[k]);
  if(pk.length){const ch=el(`<div class="chips simpicked"><span class="glabel">Escolhidos · ${pk.length}</span></div>`);pk.forEach(k=>{const b=el(`<button class="chip" type="button"></button>`);b.id="spx-"+k;b.textContent=BYKEY[k].t+(simSubs[k]&&simSubs[k].length?` · ${simSubs[k].length} sub.`:"")+" ×";b.onclick=()=>{simPick.delete(k);delete simSubs[k];render()};ch.appendChild(b)});
    const cl=el(`<button class="link" type="button" id="spClear">Limpar</button>`);cl.onclick=()=>{simPick.clear();simSubs={};render()};ch.appendChild(cl);w.appendChild(ch)}
  const sr=el(`<div class="tfsearch">${FC_ICO}<input class="search" id="simPq" type="search" placeholder="Buscar tema ou subtópico" aria-label="Buscar tema para o simulado" autocomplete="off"></div>`),inp=sr.querySelector("input");inp.value=simPF.q;
  inp.oninput=debounced(()=>{simPF.q=inp.value;render();const x=$("#simPq");if(x){x.focus();x.setSelectionRange(x.value.length,x.value.length)}});w.appendChild(sr);
  const fl=el(`<div class="simpf"></div>`),sel=el(`<select id="simPa" aria-label="Grande área"><option value="all">Todas as áreas</option></select>`);
  AREAS.forEach(a=>{const o=document.createElement("option");o.value=a.code;o.textContent=a.name;sel.appendChild(o)});sel.value=simPF.area;sel.onchange=()=>{simPF.area=sel.value;render()};fl.appendChild(sel);
  const chip=(id,lab,on,fn)=>{const b=el(`<button class="chip" type="button"></button>`);b.id=id;b.textContent=lab;b.setAttribute("aria-pressed",on);if(!on&&/·\s0$/.test(lab))b.classList.add("z");b.onclick=()=>{fn();render()};fl.appendChild(b)};
  /* Lote 20: etiquetas com contagem (contam com a área e a busca escolhidas); tocar de novo desliga */
  const qq=norm(simPF.q.trim()),pre=pool.filter(it=>(simPF.area==="all"||it.area.code===simPF.area)&&(!qq||norm(it.t+" "+(it.sp||"")+" "+subList(it).map(x=>x.t).join(" ")).includes(qq)));
  const LV={nao:s=>!(s.last||isIng(s)),ing:s=>isIng(s),est:s=>!!s.last,weak:s=>s.qt>=WEAK_MIN&&s.qc/s.qt<WEAK_PCT,due:s=>isDue(s)};
  const zc=(lab,n)=>`${lab} · ${n}`;
  [["nao","Não estudados"],["ing","Estudando"],["est","Já estudados"],["weak","Pontos fracos"],["due","Revisão hoje"]].forEach(([v,l])=>{const n=pre.filter(it=>LV[v](get(it.key))&&(!simPF.inc||(!it.own&&wOf(it)>=simPF.inc))).length;chip("simPl-"+v,zc(l,n),simPF.lv===v,()=>{simPF.lv=simPF.lv===v?"all":v})});
  [[3,"Muito alta incidência"],[2,"Alta ou mais"]].forEach(([w,l])=>{const n=pre.filter(it=>!it.own&&wOf(it)>=w&&(simPF.lv==="all"||LV[simPF.lv](get(it.key)))).length;chip("simPi-"+w,zc(l,n),simPF.inc===w,()=>{simPF.inc=simPF.inc===w?0:w})});
  w.appendChild(fl);
  const q=norm(simPF.q.trim()),ok=it=>{const s=get(it.key);if(simPF.area!=="all"&&it.area.code!==simPF.area)return false;
    if(simPF.lv==="nao"&&(s.last||isIng(s)))return false;if(simPF.lv==="ing"&&!isIng(s))return false;if(simPF.lv==="est"&&!s.last)return false;
    if(simPF.lv==="weak"&&!(s.qt>=WEAK_MIN&&s.qc/s.qt<WEAK_PCT))return false;if(simPF.lv==="due"&&!isDue(s))return false;
    if(simPF.inc&&(it.own||wOf(it)<simPF.inc))return false;
    if(q&&!norm(it.t+" "+(it.sp||"")+" "+subList(it).map(x=>x.t).join(" ")).includes(q))return false;return true};
  const R=pool.filter(ok),shown=R.slice(0,30),ul=el(`<ul class="spklist"></ul>`);
  shown.forEach(it=>{const k=it.key,on=simPick.has(k),li=el(`<li class="spk${on?" on":""}"><label><input type="checkbox"><span class="spkn"></span><span class="spkm"></span></label></li>`),cb=li.querySelector("input");cb.id="spk-"+k;cb.checked=on;
    li.querySelector(".spkn").textContent=it.t;li.querySelector(".spkm").textContent=`${it.own?"FAC":it.area.code}${it.sp?" · "+it.sp:""}`;
    cb.onchange=()=>{if(cb.checked)simPick.add(k);else{simPick.delete(k);delete simSubs[k]}render()};
    if(on){const L=subList(it);if(L.length){const sel=simSubs[k]||[],d=el(`<details class="plain spsubs"${sel.length||simPF.open===k?" open":""}><summary></summary><div class="spsl"></div></details>`);d.querySelector("summary").textContent=sel.length?`Subtópicos: ${sel.length} de ${L.length}`:`Subtópicos: todos (${L.length}) · escolher`;
      d.addEventListener("toggle",()=>{if(d.open)simPF.open=k});
      L.forEach((x,i)=>{const lb=el(`<label class="spsub"><input type="checkbox"><span></span></label>`),c2=lb.querySelector("input");c2.id=`sps-${k}-${i}`;c2.checked=sel.includes(x.t);lb.querySelector("span").textContent=x.t;
        c2.onchange=()=>{const a=new Set(simSubs[k]||[]);c2.checked?a.add(x.t):a.delete(x.t);if(a.size)simSubs[k]=[...a];else delete simSubs[k];simPF.open=k;render()};d.querySelector(".spsl").appendChild(lb)});li.appendChild(d)}}
    ul.appendChild(li)});
  if(!R.length)w.appendChild(el(`<p class="how">Nenhum tema com esses filtros.</p>`));else{w.appendChild(ul);if(R.length>shown.length)w.appendChild(el(`<p class="how">Mostrando 30 de ${R.length}: busque ou filtre para achar outros.</p>`))}
  if(R.length>1&&R.length<=60){const all=el(`<button class="link" type="button" id="spAll"></button>`);const allOn=R.every(i=>simPick.has(i.key));all.textContent=allOn?`Desmarcar os ${R.length}`:`Marcar os ${R.length}`;all.onclick=()=>{R.forEach(i=>{if(allOn){simPick.delete(i.key);delete simSubs[i.key]}else simPick.add(i.key)});render()};w.appendChild(all)}
  return w}
function qSimCard(U){const c=el(`<section class="card qsim" aria-labelledby="simh"><div class="dhead"><h2 id="simh">Simulado misto</h2><span class="todaydate" id="simClock"></span></div></section>`);
  const S=sim;if(S&&S.status!=="error")c.querySelector(".dhead").appendChild(fullBtn("sim"));
  if(!S||S.status==="error"){
    c.appendChild(el(`<p class="how hx">Um bloco de questões inéditas, uma por vez, medindo o seu tempo em cada uma. Cada resposta conta no acerto do tema; as erradas vão para Refazer.</p>`));
    /* Lote 18: bloco rápido de 5 com um toque (temas da semana misturados; sem temas na semana, onde focar) */
    {const wk=simTopics("week",U),T=wk.length?wk:simTopics("gain",U);if(T.length){const q=el(`<div class="simquick"><button class="btn primary" type="button" id="simQuick">⚡ Bloco rápido · 5 questões</button><span class="how"></span></div>`);
      q.querySelector(".how").textContent=wk.length?`Misturando ${Math.min(wk.length,5)} dos ${wk.length} temas que você estudou ou revisou nesta semana.`:"Nada estudado nesta semana ainda: vêm de Onde focar.";
      q.querySelector("button").disabled=!sampleFn;q.querySelector("button").onclick=()=>{simCfg={...simCfg,mode:"temas",src:wk.length?"week":"gain",n:5};simStart(U)};c.appendChild(q)}}
    if(S&&S.msg){const m=el(`<p class="err"></p>`);m.textContent=S.msg;c.appendChild(m)}
    const f=el(`<div class="simcfg"></div>`),mode=["mat","banco"].includes(simCfg.mode)?simCfg.mode:"temas",bkN=bankOn?bkLive().filter(x=>!x.an&&!x.dz&&bkIts(x).length).length:0;
    f.appendChild(el(`<div class="simstep"><span class="simnum">1</span><b>De onde vêm as questões</b></div>`));
    const md=el(`<div class="simmode" role="group" aria-label="Origem das questões"></div>`);[["temas","Dos meus temas"],["mat","De um material meu"],["banco","Do banco"]].forEach(([v,l])=>{const b=el(`<button type="button"></button>`);b.id="simM-"+v;b.textContent=l;b.setAttribute("aria-pressed",mode===v);b.onclick=()=>{simCfg.mode=v;render()};md.appendChild(b)});f.appendChild(md);
    if(mode==="temas"){const src=el(`<div class="chips simsrc" role="group" aria-label="Temas do simulado"></div>`);
      simSrcList().forEach(([v,lab])=>{const n=simTopics(v,U).length,b=el(`<button class="chip simsrcb" type="button" aria-pressed="${simCfg.src===v}"><b></b><span></span></button>`);b.id="simS-"+v;b.querySelector("b").textContent=v==="pick"?`${lab}${n?" · "+n:""}`:`${lab} · ${n}`;b.querySelector("span").textContent=SIM_DESC[v]||"";b.disabled=!n&&v!=="pick";b.onclick=()=>{simCfg.src=v;render()};src.appendChild(b)});
      if(simCfg.src!=="pick"&&!simTopics(simCfg.src,U).length){const alt=simSrcList().find(([v])=>v!=="pick"&&simTopics(v,U).length);if(alt&&alt[0]!==simCfg.src){simCfg.src=alt[0];src.querySelectorAll("button").forEach((b,i)=>b.setAttribute("aria-pressed",simSrcList()[i][0]===simCfg.src))}}
      f.appendChild(src);if(simCfg.src==="pick")f.appendChild(simPickerEl())}
    else if(mode==="banco"){const b=el(`<p class="how simbank"></p>`);b.textContent=bkN?`Questões que já estão no seu banco (${bkN}), sem gerar nada: sorteio inteligente, com inéditas primeiro, depois os seus pontos fracos, os temas que mais caem, o eixo da faculdade e a próxima prova. A 1ª vez de cada questão conta no acerto do tema; as que estão no Refazer contam como a revisão delas.`:"O seu banco ainda está vazio. Importe uma prova ou gere questões nos temas.";f.appendChild(b)}
    else f.appendChild(msEl(simMat,{open:true,title:"Materiais do simulado",how:"Escolha um ou mais arquivos (PDFs da aula, slides, resumos ou fotos), até 100 mil caracteres no total. As questões seguem o material, mesmo que ele passe por várias áreas; cada questão é ligada ao tema da residência mais próximo, e o acerto conta nele.",id:(t,i)=>`sm${t}${i!==undefined?"-"+i:""}`,get:()=>simMat,set:v=>{simMat=v}}));
    f.appendChild(el(`<div class="simstep"><span class="simnum">2</span><b>Como vai ser</b></div>`));
    const row=(lab,L,cur,id,fn)=>{const w=el(`<div class="simopt"><span class="simol"></span><div class="seg" role="group"></div></div>`);w.querySelector(".simol").textContent=lab;w.querySelector(".seg").setAttribute("aria-label",lab);
      L.forEach(([v,l])=>{const b=el(`<button type="button"></button>`);b.id=id+v;b.textContent=l;b.setAttribute("aria-pressed",cur===v);b.onclick=()=>{fn(v);render()};w.querySelector(".seg").appendChild(b)});f.appendChild(w)};
    row("Questões",[5,10,20,30].map(v=>[v,String(v)]),simCfg.n,"simN-",v=>{simCfg.n=v});
    if(mode!=="banco"){row("Dificuldade",SIM_DIF,simCfg.dif||"mista","simD-",v=>{simCfg.dif=v});
    if(simCfg.est==="fac"&&!facModels().length)simCfg.est="res";
    row("Estilo",simEstList(),simCfg.est||"res","simE-",v=>{simCfg.est=v})}
    if(simCfg.est==="fac"&&mode!=="banco")f.appendChild(el(`<p class="how simesth">No jeito das provas da sua faculdade marcadas como modelo (tamanho do caso, número de alternativas e forma de perguntar).</p>`));
    if(simCfg.est==="inep"&&mode!=="banco")f.appendChild(el(`<p class="how simesth">Como no ENAMED: caso clínico contextualizado da prática do generalista, comando direto e 4 alternativas (A a D).</p>`));
    const T2=mode!=="temas"?[]:simTopics(simCfg.src,U),nq=mode==="banco"?Math.min(simCfg.n,bkN):mode==="temas"&&simCfg.src==="errs"?Math.min(simCfg.n,errors.filter(e=>BYKEY[e.k]&&!e.arch).length):mode==="temas"&&simCfg.src==="redo"?Math.min(simCfg.n,redo.filter(x=>BYKEY[x.k]).length):simCfg.n;
    if(mode!=="banco"){f.appendChild(el(`<div class="simstep"><span class="simnum">3</span><b>Resumo</b></div>`));f.appendChild(simSummaryEl(mode,T2,nq))}c.appendChild(f);
    const matOn=genMatOn(simMat),go=el(`<button class="btn primary simgo" type="button" id="simGo"></button>`);
    if(mode==="banco"){go.textContent=`Começar simulado do banco · ${nq} ${nq===1?"questão":"questões"} · ≈ ${Math.max(1,Math.round(nq*ui.prefs.qpace/60))} min`;go.disabled=!nq}
    else if(mode==="mat"){go.textContent=`Começar simulado do material · ${nq} ${nq===1?"questão":"questões"}`;go.disabled=!sampleFn||!matOn;if(!matOn)c.appendChild(el(`<p class="how">Escolha pelo menos um arquivo para começar.</p>`))}
    else{go.textContent=`Começar simulado · ${nq} ${nq===1?"questão":"questões"} de ${Math.min(T2.length,nq)} ${Math.min(T2.length,nq)===1?"tema":"temas"}`;go.disabled=!sampleFn||!T2.length;if(simCfg.src==="pick"&&!T2.length)c.appendChild(el(`<p class="how">Marque pelo menos um tema na busca acima.</p>`))}
    if(sampleOff&&mode!=="banco")go.title="O Claude não está disponível nesta visualização";go.onclick=()=>mode==="banco"?simStartBank():simStart(U);c.appendChild(go);c.appendChild(simHistEl(U));
    return c}
  if(S.status==="loading"){c.appendChild(el(`<p class="gstatus" id="simSt" aria-live="polite">Preparando o simulado. O primeiro bloco pode levar até um minuto…</p>`));
    const b=el(`<button class="btn" type="button">Cancelar</button>`);b.onclick=()=>S.ctl.abort();c.appendChild(b);return c}
  if(S.status==="done"){const n=S.qs.length,hit=S.qs.filter((q,i)=>S.ans[i]===q.correta).length,tt=Object.values(S.t).reduce((a,b)=>a+b,0),ans=Object.keys(S.ans).length;
    c.appendChild(el(`<div class="kpis simres"><div class="kpi"><span class="kl">Acerto</span><b>${pct(hit,ans)}%</b><span class="ks">${hit} de ${ans}</span></div><div class="kpi"><span class="kl">Tempo total</span><b>${fmtPace(tt)}</b><span class="ks">${n} questões</span></div><div class="kpi${ans&&tt/ans>ui.prefs.qpace?" alert":""}"><span class="kl">Por questão</span><b>${ans?fmtPace(tt/ans):"–"}</b><span class="ks">prova: ${fmtPace(ui.prefs.qpace)}</span></div></div>`));
    const ul=el(`<ol class="simlist"></ol>`);S.qs.forEach((q,i)=>{const it=BYKEY[q.k],ok=S.ans[i]===q.correta,li=el(`<li><span class="simok ${S.ans[i]?ok?"ok":"no":""}">${S.ans[i]?ok?"✓":"✗":"–"}</span><button class="link" type="button"></button><span class="simt">${S.t[i]?fmtPace(S.t[i]):""}</span></li>`);
      const b=li.querySelector("button");b.textContent=it?it.t:"";b.onclick=()=>openTopic(q.k);ul.appendChild(li)});c.appendChild(ul);
    const wrong=S.qs.filter((q,i)=>S.ans[i]&&S.ans[i]!==q.correta).length;
    c.appendChild(el(`<p class="how">${S.rerun?"Refazendo um simulado: conta na meta semanal de questões (como o Refazer), mas não no acerto dos temas nem vai para o Refazer. A tentativa fica anotada em Meus simulados.":`${wrong?`${wrong} ${wrong===1?"errada foi":"erradas foram"} para Refazer as que errei. `:""}O resultado já entrou no acerto de cada tema e no seu ritmo. O simulado ficou guardado em Meus simulados.`}</p>`));
    const b=el(`<button class="btn primary" type="button">Novo simulado</button>`);b.onclick=()=>{sim=null;render()};c.appendChild(b);return c}
  // em andamento
  const q=S.qs[S.i];if(!q){c.appendChild(el(`<p class="gstatus" id="simSt">Escrevendo a próxima questão…</p>`));return c}
  const it=BYKEY[q.k],mine=S.ans[S.i],card=el(`<div class="qcard"><span class="qn"></span><span class="simtopic"></span><p class="qstem"></p></div>`);
  card.querySelector(".qn").textContent=`QUESTÃO ${S.i+1} DE ${S.items.length}${S.rerun?" · REFAZENDO (não conta)":""}`;if(q.mat)card.querySelector(".qn").appendChild(el(`<span class="qmat"> · do seu material</span>`));card.querySelector(".simtopic").textContent=mine&&it?`${it.t} · ${it.area.code}${it.sp?" · "+it.sp:""}`:"Tema revelado depois de responder";
  card.querySelector(".qstem").textContent=q.enunciado;{const bx=q.bk&&bankById.get(q.bk),fe=bx?bkFigEl(bx):figEl(q,S.P);if(fe)card.appendChild(fe)}
  card.appendChild(altsEl(qSplit(q),mine,l=>{simAnswer(l);render()}));
  if(mine){const ok=mine===q.correta;card.appendChild(el(`<p class="verdict ${ok?"ok":"no"}">${ok?"Correta.":"Incorreta. A resposta é "+esc(q.correta.replace(/[^A-Z0-9]/g,""))+"."} <span class="simt">${fmtPace(S.t[S.i])}</span></p>`));
    card.appendChild(qExplEl(qSplit(q)));
    {const f=qFonteEl(q);if(f)card.appendChild(f)}if(q.alerta&&q.alerta.trim()){const p=el(`<p class="alerta"></p>`);p.textContent="Atenção: "+q.alerta;card.appendChild(p)}
    if(!ok)card.appendChild(q.err?el(`<p class="pnote">Este ponto já está no seu caderno de erros: ele volta para revisão amanhã.</p>`):eCadEl(S.cad||(S.cad={}),S.i,q.k,q,mine,"Simulado misto"));
    card.appendChild(qActsEl(q,mine,{k:q.k,src:"Simulado misto"}))}
  c.appendChild(card);const acts=el(`<div class="btns"></div>`);
  if(mine){const nx=el(`<button class="btn primary" type="button" id="simNext"></button>`);const last=S.i+1>=S.items.length;nx.textContent=last?(S.gen?"Ver resultado":"Aguardando as próximas…"):(S.i+1<S.qs.length?"Próxima":"Aguardando a próxima…");nx.disabled=!last&&S.i+1>=S.qs.length||last&&!S.gen;nx.onclick=simNext;acts.appendChild(nx)}
  const st=el(`<button class="btn" type="button" id="simEnd">Encerrar</button>`);st.onclick=()=>{S.stopped=true;if(S.ctl)S.ctl.abort();S.gen=true;S.qs.length=Math.max(Object.keys(S.ans).length,0);S.items.length=S.qs.length;S.status=S.qs.length?"done":"error";if(S.qs.length)simSave(S);if(!S.qs.length)sim=null;render()};acts.appendChild(st);
  c.appendChild(acts);c.appendChild(el(`<p class="how erkeys">Teclado: A a E escolhem a alternativa · espaço vai para a próxima${fullOn.sim?" · Esc sai da tela inteira":""}</p>`));return c}
/* ---------- Meus simulados (Lote 14): cada simulado terminado fica guardado (só texto, sem figuras), para rever, refazer ou repetir os temas ----------
   sims = [{id,d,at,mode,src,lab,dif,est,n,hit,ans,tt,cfg,qs:[{k,q,a,t}],tries:[{d,hit,ans}]}]; localStorage resid-sims-v1 + Firestore progress/sims/{id} */
const LSSIM="resid-sims-v1",SIM_MAX=40;let sims=[],simStore=null,simRev=null,simAllOpen=false,simArm=null;
function smOk(x){return !!x&&typeof x==="object"&&typeof x.id==="string"&&Array.isArray(x.qs)}
function smClean(x){const s=(v,m)=>typeof v==="string"?v.slice(0,m):"",D=/^\d{4}-\d{2}-\d{2}$/,cf=x.cfg&&typeof x.cfg==="object"?x.cfg:{};
  return {id:x.id,d:D.test(x.d||"")?x.d:today(),at:s(x.at,40),mode:["mat","banco"].includes(x.mode)?x.mode:"temas",src:s(x.src,20),lab:s(x.lab,140),dif:s(x.dif,10)||"mista",est:s(x.est,10)||"res",
    n:+x.n||0,hit:+x.hit||0,ans:+x.ans||0,tt:Math.round(+x.tt||0),
    cfg:{mode:["mat","banco"].includes(cf.mode)?cf.mode:"temas",src:s(cf.src,20),n:+cf.n||10,dif:s(cf.dif,10)||"mista",est:s(cf.est,10)||"res",picks:Array.isArray(cf.picks)?cf.picks.filter(k=>typeof k==="string").slice(0,200):[],
      subs:cf.subs&&typeof cf.subs==="object"?Object.fromEntries(Object.entries(cf.subs).filter(([k,v])=>Array.isArray(v)).map(([k,v])=>[k,v.filter(t=>typeof t==="string").slice(0,40)])):{},pid:s(cf.pid,40)},
    qs:x.qs.filter(r=>r&&typeof r.k==="string"&&r.q&&typeof r.q.enunciado==="string"&&Array.isArray(r.q.alternativas)).map(r=>({k:r.k,q:rdClean({id:"x",k:r.k,q:r.q}).q,a:s(r.a,3),t:Math.round(+r.t||0)})).slice(0,40),
    tries:Array.isArray(x.tries)?x.tries.filter(t=>t&&D.test(t.d)).map(t=>({d:t.d,hit:+t.hit||0,ans:+t.ans||0})).slice(-10):[]}}
try{const v=JSON.parse(localStorage.getItem(LSSIM)||"[]");if(Array.isArray(v))sims=v.filter(smOk).map(smClean)}catch(e){}
function smSaveLocal(){try{localStorage.setItem(LSSIM,JSON.stringify(sims))}catch(e){}}
async function smPut(x){smSaveLocal();if(!simStore)return;const k="sm:"+x.id;try{await simStore.doc(x.id).set(JSON.parse(JSON.stringify(x)));saveOk(k)}catch(e){if(sims.includes(x))saveFail(k,"simulado",e,()=>smPut(x))}}
async function smDel(id){sims=sims.filter(x=>x.id!==id);smSaveLocal();render();if(simStore)try{await simStore.doc(id).delete()}catch(e){}}
function simLab(c,S){if(c.mode==="banco")return "Do banco de questões";if(c.mode==="mat"){const P=S&&S.P;return "Do material"+(P&&P.names&&P.names.length?": "+P.names.join(", ").slice(0,100):"")}
  const L=simSrcList().find(x=>x[0]===c.src)||SIM_SRC.find(x=>x[0]===c.src),b=L?L[1]:"Simulado";return c.src==="pick"&&c.picks.length?`${b}: ${c.picks.slice(0,3).map(k=>BYKEY[k]?BYKEY[k].t:"").filter(Boolean).join(", ")}${c.picks.length>3?` e mais ${c.picks.length-3}`:""}`:b}
/* guarda (ou, ao refazer, soma a tentativa) quando o simulado acaba */
function simSave(S){if(!S||S.saved||!S.qs.length)return;S.saved=true;const ans=Object.keys(S.ans).length;if(!ans)return;const hit=S.qs.filter((q,i)=>S.ans[i]===q.correta).length,tt=Object.values(S.t).reduce((a,b)=>a+b,0);
  if(S.rerun){const x=sims.find(y=>y.id===S.fromId);if(x){x.tries.push({d:today(),hit,ans});x.tries=x.tries.slice(-10);smPut(x)}return}
  const c=S.cfg||simCfgSnap(),x=smClean({id:"sm"+Date.now().toString(36)+Math.random().toString(36).slice(2,6),d:today(),at:new Date().toISOString(),mode:c.mode,src:S.mat?"mat":c.src,lab:simLab(c,S),dif:c.dif,est:c.est,n:S.qs.length,hit,ans,tt,cfg:c,
    qs:S.qs.map((q,i)=>({k:q.k,q:{enunciado:q.enunciado,alternativas:q.alternativas,correta:q.correta,comentario:q.comentario,conceito:q.conceito,alerta:q.alerta,fonte:q.fonte,link:q.link,mat:q.mat,fg:q.fg},a:S.ans[i]||"",t:S.t[i]||0})),tries:[]});
  sims.unshift(x);if(sims.length>SIM_MAX)sims.splice(SIM_MAX).forEach(o=>{if(simStore)simStore.doc(o.id).delete().catch(()=>{})});smPut(x);S.savedId=x.id}
/* refazer as mesmas questões (embaralhadas; não conta no acerto dos temas nem vai para o Refazer) */
function simRerun(x){const qs=x.qs.filter(r=>BYKEY[r.k]).map(r=>({...altShuffle(JSON.parse(JSON.stringify(r.q))),k:r.k}));if(!qs.length)return;
  sim={status:"run",items:qs.map(q=>({k:q.k})),qs,i:0,ans:{},t:{},msg:"",src:x.src,cfg:x.cfg,gen:true,rerun:true,fromId:x.id,start:Date.now(),shown:Date.now()};simRev=null;render();const h=$("#simh");if(h)h.scrollIntoView({block:"start"})}
/* mesmos temas e ajustes, questões novas */
function simAgain(x,U){const c=x.cfg;simCfg={...simCfg,mode:c.mode,src:c.src,n:c.n,dif:c.dif,est:c.est,pid:c.pid};if(c.src==="pick"){simPick=new Set(c.picks.filter(k=>BYKEY[k]));simSubs=JSON.parse(JSON.stringify(c.subs||{}))}
  simRev=null;sim=null;if(c.mode==="banco"){simStartBank();return}if(c.mode==="mat"&&!genMatOn(simMat)){render();const h=$("#simh");if(h)h.scrollIntoView({block:"start"});return}simStart(U)}
function simHistEl(U){const w=el(`<div class="simhist"><div class="dbh"><span class="glabel">Meus simulados${sims.length?" · "+sims.length:""}</span></div></div>`);
  if(!sims.length){w.appendChild(el(`<p class="how">Os simulados que você terminar ficam aqui, com o resultado, para rever as questões, refazer ou repetir os mesmos temas.</p>`));return w}
  const ol=el(`<ol class="smlist"></ol>`),L=simAllOpen?sims:sims.slice(0,5);
  L.forEach(x=>{const li=el(`<li class="smrow" id="sm-${x.id}"><div class="smh"><b class="smlab"></b><span class="smpct"></span></div><span class="smmeta"></span><div class="smacts"></div></li>`),p=pct(x.hit,x.ans);
    li.querySelector(".smlab").textContent=x.lab||"Simulado";const pc=li.querySelector(".smpct");pc.textContent=`${p}%`;pc.dataset.c=p>=80?"ok":p>=65?"mid":"bad";
    const tr=x.tries.length?x.tries[x.tries.length-1]:null;
    li.querySelector(".smmeta").textContent=`${br(x.d)} · ${x.hit} de ${x.ans} · ${fmtPace(x.tt)} · ${(SIM_DIF.find(d=>d[0]===x.dif)||SIM_DIF[0])[1].toLowerCase()}${x.est==="inep"?" · ENAMED":x.est==="fac"?" · estilo da faculdade":""}${tr?` · refeito em ${br(tr.d)}: ${tr.hit} de ${tr.ans}`:""}`;
    const a=li.querySelector(".smacts"),btn=(id,t,fn,cls)=>{const b=el(`<button class="mini${cls?" "+cls:""}" type="button"></button>`);b.id=id;b.textContent=t;b.onclick=fn;a.appendChild(b);return b};
    btn("smv-"+x.id,simRev&&simRev.id===x.id?"Fechar":"Rever",()=>{simRev=simRev&&simRev.id===x.id?null:{id:x.id,i:null};render()});
    btn("smr-"+x.id,"Refazer estas",()=>simRerun(x)).title="As mesmas questões, embaralhadas; não conta no acerto";
    btn("sma-"+x.id,"Mesmos temas, questões novas",()=>simAgain(x,U)).disabled=!sampleFn;
    const armed=simArm===x.id,d=btn("smd-"+x.id,armed?"Toque de novo para apagar":"Apagar",()=>{if(armed){simArm=null;smDel(x.id)}else{simArm=x.id;render()}},"smdel");if(armed)d.classList.add("warn");
    if(simRev&&simRev.id===x.id)li.appendChild(simRevEl(x));ol.appendChild(li)});
  w.appendChild(ol);
  if(sims.length>5){const m=el(`<button class="link" type="button" id="smAll"></button>`);m.textContent=simAllOpen?"Mostrar só os 5 últimos":`Ver todos (${sims.length})`;m.onclick=()=>{simAllOpen=!simAllOpen;render()};w.appendChild(m)}
  return w}
function simRevEl(x){const w=el(`<div class="smrev"><ol class="simlist"></ol></div>`),ol=w.querySelector("ol");
  x.qs.forEach((r,i)=>{const it=BYKEY[r.k],ok=r.a===r.q.correta,li=el(`<li><span class="simok ${r.a?ok?"ok":"no":""}">${r.a?ok?"✓":"✗":"–"}</span><button class="link" type="button"></button><span class="simt">${r.t?fmtPace(r.t):""}</span></li>`),b=li.querySelector("button");
    b.id=`smq-${x.id}-${i}`;b.textContent=`${i+1}. ${it?it.t:"Tema"}`;b.onclick=()=>{simRev.i=simRev.i===i?null:i;render()};ol.appendChild(li);
    if(simRev.i===i){const c=el(`<div class="qcard smq"><p class="qstem"></p></div>`);c.querySelector(".qstem").textContent=r.q.enunciado;{const fe=figEl(r.q,null);if(fe)c.appendChild(fe)}
      c.appendChild(altsEl(qSplit(r.q),r.a||"_",()=>{}));c.appendChild(el(`<p class="verdict ${ok?"ok":"no"}">${!r.a?"Sem resposta.":ok?"Você acertou.":"Você marcou "+esc(r.a)+"; a resposta é "+esc(r.q.correta)+"."}</p>`));
      c.appendChild(qExplEl(qSplit(r.q)));{const f=qFonteEl(r.q);if(f)c.appendChild(f)}if(r.a&&!ok)c.appendChild(qActsEl(r.q,r.a,{k:r.k,src:"Meus simulados"}));li.appendChild(c)}});
  return w}
function simTick(){const c=$("#simClock");if(!c||!sim||sim.status!=="run")return;const q=sim.ans[sim.i]?null:Math.floor((Date.now()-sim.shown)/1000);c.textContent=q===null?"":`${fmtPace(q)} nesta questão`}
setInterval(simTick,1000);
/* ---------- Provas na íntegra: importar o PDF (ou fotos) de uma prova, conferir as questões e fazer no app ----------
   exams = [{id,name,banca,ano,at,qs:[{n,p,pe,k,q,g:"b"|"c",an,im,ck}]}]  (questões; muda pouco: importação, gabarito, tema)
   exProg = [{id,i,mode:"p"|"e",fin,tries:[{d,hit,n,s}],a:{idx:{l,d,s}},h:{idx:[{l,d}]}}]  (respostas; documento pequeno, gravado a cada resposta)
   Cada resposta conta no acerto do tema (addQ com a banca como fonte); mudar o gabarito, anular ou trocar o tema recalcula (exChange). */
const LSEX="resid-exams-v1",LSEXP="resid-exprog-v1",PDFJS="https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/legacy/build/",EX_AB="ABCDEFGH";
let exams=[],exProg=[],exStore=null,exPStore=null,imp=null,exRun=null,exEdit=null,exArm=null,exKey=null;const exATimer={};
function exQOk(r){return !!r&&typeof r==="object"&&!!r.q&&typeof r.q.enunciado==="string"&&Array.isArray(r.q.alternativas)&&r.q.alternativas.length>=2}
function exQClean(r){const s=(v,m)=>typeof v==="string"?v.slice(0,m):"",q=r.q;
  const L=q.alternativas.filter(a=>a&&typeof a.texto==="string").map(a=>({letra:String(a.letra||"").trim().toUpperCase().slice(0,3),texto:a.texto.slice(0,2000),porque:s(a.porque,1200)}));
  const cor=String(q.correta||"").trim().toUpperCase().slice(0,3),k=typeof r.k==="string"?r.k:"";
  return {n:Number.isInteger(r.n)&&r.n>0?r.n:0,p:Number.isInteger(r.p)?r.p:0,pe:Number.isInteger(r.pe)?r.pe:0,k:BYKEY[k]&&!BYKEY[k].own?k:"",
    q:{enunciado:q.enunciado.slice(0,8000),alternativas:L,correta:L.some(a=>a.letra===cor)?cor:"",comentario:s(q.comentario,4000),conceito:s(q.conceito,600),alerta:"",...(s(q.pc,1200)?{pc:s(q.pc,1200)}:{}),...(s(q.th,800)?{th:s(q.th,800)}:{}),...(s(q.fonte,400)?{fonte:s(q.fonte,400)}:{})},
    g:r.g==="b"?"b":"c",an:!!r.an,im:!!r.im,ck:typeof r.ck==="string"?r.ck.slice(0,3):"",...(r.x?{x:true}:{}),...(exKs(r).length?{ks:exKs(r)}:{}),...(r.fg?{fg:1}:{}),...(r.kd?{kd:1}:{}),...(s(r.sb,80)?{sb:s(r.sb,80)}:{}),...(r.sbd?{sbd:1}:{}),...(r.sbg?{sbg:1}:{}),...(r.cm?{cm:1}:{})}}
/* temas extras da questão (até 2 além do principal); contam inteiros em cada tema, mas uma vez só no dia/semana */
function exKs(r){const k=typeof r.k==="string"?r.k:"";return Array.isArray(r.ks)?[...new Set(r.ks.filter(x=>typeof x==="string"&&BYKEY[x]&&!BYKEY[x].own&&x!==k))].slice(0,2):[]}
function exOk(x){return !!x&&typeof x==="object"&&typeof x.id==="string"&&Array.isArray(x.qs)}
function exClean(x){const s=(v,m)=>typeof v==="string"?v.slice(0,m):"";
  return {id:x.id,...(x.mod?{mod:1}:{}),...(x.of?{of:1}:{}),...(s(x.niv,20).trim()?{niv:s(x.niv,20)}:{}),...(x.kst==="p"||x.kst==="d"?{kst:x.kst}:{}),name:s(x.name,140)||"Prova",banca:s(x.banca,40),ano:s(String(x.ano||""),4),at:s(x.at,40)||new Date().toISOString(),links:Array.isArray(x.links)?[...new Set(x.links.filter(r=>typeof r==="string"&&/^(T|O):[A-Za-z0-9_-]{1,60}$/.test(r)))].slice(0,12):[],qs:x.qs.filter(exQOk).map(r=>{const c=exQClean(r);delete c.x;return c})}}
function exPOk(x){return !!x&&typeof x==="object"&&typeof x.id==="string"}
function exPClean(x){const D=/^\d{4}-\d{2}-\d{2}$/,a={},h={},A=x.a&&typeof x.a==="object"?x.a:{},H=x.h&&typeof x.h==="object"?x.h:{};
  for(const i in A){const v=A[i];if(v&&typeof v.l==="string"&&D.test(v.d))a[i]={l:v.l.slice(0,3),d:v.d,s:Math.max(0,Math.min(1800,Math.round(+v.s||0)))}}
  for(const i in H){const v=H[i];if(Array.isArray(v)){const L=v.filter(y=>y&&typeof y.l==="string"&&D.test(y.d)).map(y=>({l:y.l.slice(0,3),d:y.d})).slice(-10);if(L.length)h[i]=L}}
  return {id:x.id,i:Number.isInteger(x.i)&&x.i>=0?x.i:0,mode:x.mode==="e"?"e":"p",fin:D.test(x.fin||"")?x.fin:"",
    tries:Array.isArray(x.tries)?x.tries.filter(t=>t&&D.test(t.d)).map(t=>({d:t.d,hit:+t.hit||0,n:+t.n||0,s:+t.s||0})).slice(-20):[],a,h}}
try{const v=JSON.parse(localStorage.getItem(LSEX)||"[]");if(Array.isArray(v))exams=v.filter(exOk).map(exClean)}catch(e){}
try{const v=JSON.parse(localStorage.getItem(LSEXP)||"[]");if(Array.isArray(v))exProg=v.filter(exPOk).map(exPClean)}catch(e){}
function exSaveLocal(){try{localStorage.setItem(LSEX,JSON.stringify(exams))}catch(e){}try{localStorage.setItem(LSEXP,JSON.stringify(exProg))}catch(e){}bankFeedSoon()}
async function exPut(ex){exSaveLocal();if(!exStore)return;const k="ex:"+ex.id;try{await exStore.doc(ex.id).set(JSON.parse(JSON.stringify(ex)));saveOk(k)}catch(e){if(exams.includes(ex))saveFail(k,`a prova “${ex.name}”`,e,()=>exPut(ex))}}
function exPg(id){let P=exProg.find(x=>x.id===id);if(!P){P=exPClean({id});exProg.push(P)}return P}
async function exPWrite(id){const P=exProg.find(x=>x.id===id),k="exp:"+id;if(P&&exPStore)try{await exPStore.doc(id).set(JSON.parse(JSON.stringify(P)));saveOk(k)}catch(e){saveFail(k,"respostas de uma prova",e,()=>exPWrite(id))}}
function exPSave(id){exSaveLocal();clearTimeout(exATimer[id]);const t=setTimeout(async()=>{await exPWrite(id);if(exATimer[id]===t)delete exATimer[id]},1500);exATimer[id]=t}
function exFlush(){for(const id of Object.keys(exATimer)){clearTimeout(exATimer[id]);delete exATimer[id];exPWrite(id)}}
