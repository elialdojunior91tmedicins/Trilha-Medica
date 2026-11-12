/* instruções padrão antigas: quem nunca mudou o texto passa a usar o padrão novo */
const OLD_PROMPTS=[`Você é um elaborador experiente de questões de residência médica no Brasil, com foco no Enamed.

Estilo
- Cerca de 70–80% em caso clínico curto e contextualizado, como nas provas brasileiras (Enamed, ENARE, USP, UNIFESP); o restante, conceito aplicado.
- Cada questão testa uma decisão específica: diagnóstico mais provável, próximo passo, conduta, interpretação de exame ou fisiopatologia aplicada.
- Quando fizer sentido, ambiente o caso na atenção primária, na urgência ou no contexto do SUS.
- O enunciado traz os dados necessários para decidir. A dificuldade vem do conteúdo, nunca de ambiguidade.

Alternativas
- 4 alternativas (A a D), uma única melhor resposta.
- Distratores plausíveis, da mesma categoria da correta e com extensão parecida, baseados em erros reais de raciocínio.
- Evite pistas, alternativas parcialmente corretas, dupla negativa e "todas/nenhuma das anteriores".

Dificuldade
- Média, como em prova real. Varie os subtópicos e o tipo de pergunta.
- Em cerca de 20–30% das questões, inclua uma pegadinha justa (exceção, contraindicação, sequência de conduta, limiar ou detalhe clínico decisivo), sem anunciá-la.

Conteúdo
- Siga diretrizes brasileiras (Ministério da Saúde e sociedades médicas brasileiras).
- Não invente dados, doses, critérios ou referências.
- Evite basear a questão em ponto controverso. Se for inevitável, cobre o que a maioria das bancas cobra e explique a divergência no alerta.

Comentário
- Explique a correta ligando os achados decisivos do caso ao mecanismo, critério ou conduta, em 2 a 4 frases. Nas pegadinhas, aponte o detalhe decisivo.
- Para cada alternativa errada, explique em 1 ou 2 frases o erro de raciocínio naquele caso e, quando couber, em que situação ela seria a resposta.
- Conceito-chave: uma frase curta, boa para revisar depois.
- Se a resposta depender de protocolo que muda com frequência (doses, calendário vacinal, esquemas terapêuticos), avise no alerta para conferir na diretriz vigente.`,`Você é um elaborador experiente de questões de residência médica no Brasil, com foco no Enamed.

Estilo
- Questões em formato de caso clínico curto e contextualizado, como nas provas brasileiras (Enamed, ENARE, USP, UNIFESP).
- Priorize raciocínio prático: conduta imediata, próximo passo, diagnóstico mais provável e interpretação de exames.
- Quando fizer sentido, ambiente o caso na atenção primária, na urgência ou no contexto do SUS.

Formato
- 4 alternativas (A a D), apenas uma correta.
- Distratores plausíveis, que testem confusões comuns do tema.
- Dificuldade média, como em prova real. Varie os subtópicos entre as questões.

Conteúdo
- Siga diretrizes brasileiras atuais (Ministério da Saúde e sociedades médicas brasileiras).
- Não invente dados, doses ou critérios. Se houver controvérsia, escolha o que a maioria das bancas cobra.

Comentário
- Explique por que a correta está certa e por que cada alternativa errada está errada, de forma direta.
- Resuma o conceito-chave cobrado em uma frase curta, boa para revisar depois.
- Se a resposta depender de protocolo que muda com frequência (doses, calendário vacinal, esquemas terapêuticos), avise no campo de alerta para conferir na diretriz vigente.`];
const promptKey=t=>String(t||"").replace(/\s+/g," ").trim();
OLD_PROMPTS.push(DEFAULT_PROMPT_1026A);
function promptUp(t){return OLD_PROMPTS.some(o=>promptKey(o)===promptKey(t))?DEFAULT_PROMPT:t}
/* referências (Lote 12): no site o pedido vai para uma conversa do Claude com busca na web → pesquisar, confirmar e trazer o link;
   no artefato o sample não tem internet → só referência que conhece com segurança, senão troca a questão (o app descarta questão sem fonte) */
const REF_RULES=()=>window.__site?`Referências (obrigatório): antes de responder, pesquise na internet e confirme cada referência em fonte oficial (Ministério da Saúde/gov.br, sociedades médicas, sites oficiais das diretrizes, PubMed). Confira o ano, a versão vigente e o trecho que sustenta a resposta. Nada inventado: se não conseguir confirmar a referência de uma questão, troque a questão por outra cujo conteúdo você confirmou. No comentário e em cada "porque", use o que a referência diz para justificar a correta e mostrar por que cada errada está errada.`
  :`Referências (obrigatório): você não tem acesso à internet agora, então só gere questões cujo conteúdo e referência você conhece com segurança. Nada inventado: se não tiver uma referência segura para uma questão, troque a questão por outra. Deixe "link" vazio, a não ser que tenha certeza do endereço oficial. No comentário e em cada "porque", use o que a referência diz para justificar a correta e mostrar por que cada errada está errada.`;
const fixedFormat=(nq)=>`Responda apenas com um array JSON de ${nq} objetos, sem nenhum outro texto, cada um neste formato:
{"enunciado": "texto do caso e da pergunta",
 "alternativas": [{"letra": "A", "texto": "...", "porque": "por que esta alternativa está errada neste caso (string vazia na correta)"}, {"letra": "B", "texto": "...", "porque": "..."}],
 "correta": "letra da alternativa correta",
 "comentario": "por que a correta é a melhor resposta",
 "conceito": "conceito-chave em uma frase",
 "alerta": "só quando o tema mudou recentemente ou as fontes divergem: qual versão você seguiu (ano) e o que mudou; nunca 'confira na diretriz'; string vazia se não houver",
 "fonte": "a referência específica que sustenta a resposta: nome da diretriz, consenso ou protocolo + sociedade ou órgão + ano + seção, tabela ou recomendação quando houver (ex.: Diretriz Brasileira de Insuficiência Cardíaca Crônica e Aguda, SBC, 2018, tabela de recomendações de betabloqueadores); ou livro-texto + edição + capítulo; ou manual do Ministério da Saúde + ano. Se a questão saiu do material do estudante, cite o material e a página ou slide",
 "link": "endereço (URL) da página oficial da referência que você consultou; string vazia se não houver"}
${REF_RULES()}
O app embaralha a ordem das alternativas: no comentário e no campo porque, não cite letras; refira-se ao conteúdo da alternativa.
Escreva tudo em português do Brasil.`;
let promptText=DEFAULT_PROMPT, promptEdited=false, settingsDoc=null, sampleFn=null, sampleOff=false, gen={}, qCount=10;
/* gerador de questões */
function buildPrompt(it,nq,o){const fs=o.fac?facStyleTxt():"";
  const past=errors.filter(e=>e.k===it.key).sort(byNewest).slice(0,5).map(e=>"- "+e.r.replace(/\s+/g," ").slice(0,240));
  return promptText.trim()+`

Tarefa
Crie ${nq} ${nq===1?"questão inédita":"questões inéditas"} sobre o tema "${it.t}" (área: ${areaLabel(it)}).`+
  (o.focus?`
Todas sobre o subtópico: "${o.focus}", explorando ângulos diferentes (diagnóstico, conduta, exames, complicações, exceções).`:
   o.subs&&o.subs.length?`
Uma questão para cada um destes subtópicos, nesta ordem: ${o.subs.map(s=>`"${s}"`).join("; ")}.`:"")+
  (()=>{const H=subList(it).filter(x=>x.hy).map(x=>x.t);return H.length&&!o.focus?`
Subtópicos que mais caem em prova (High Yield) neste tema: ${H.map(x=>`"${x}"`).join("; ")}. Quando houver escolha, prefira-os.`:""})()+
  (o.avoid&&o.avoid.length?`
Já foram feitas questões sobre os conceitos abaixo. Não repita esses conceitos nem casos parecidos:
${o.avoid.slice(-30).map(c=>"- "+c).join("\n")}`:"")+
  (past.length&&o.first&&!o.mat?`
O estudante já errou questões sobre estes pontos deste tema. Inclua pelo menos uma questão que cobre um deles por outro ângulo:
${past.join("\n")}`:"")+((()=>{const pg=o.first&&!o.mat&&!o.focus?pegOf(it.key).filter(x=>x.kind==="peg").slice(0,4):[];return pg.length?`
O estudante anotou estas pegadinhas deste tema. Se couber no número de questões, faça 1 questão que teste uma delas (sem copiar o texto):
${pg.map(x=>"- "+x.x.replace(/\*\*|==/g,"")+(x.why?" (por quê: "+x.why.replace(/\*\*|==/g,"")+")":"")).join("\n")}`:""})())+(o.mat?genMatPrompt(o.mat):"")+(fs?"\n\n"+fs:"")+`

${fixedFormat(nq)}`;
}
const linkOk=u=>typeof u==="string"&&/^https?:\/\/[^\s"<>]{4,400}$/i.test(u.trim());
function validQs(data){
  const arr=Array.isArray(data)?data:(data&&Array.isArray(data.questoes)?data.questoes:[]);
  return arr.filter(q=>q&&(window.__site||window.__noRefCheck||String(q.fonte||"").trim())&&typeof q.enunciado==="string"&&Array.isArray(q.alternativas)&&q.alternativas.length>=2&&
    q.alternativas.every(a=>a&&a.letra&&typeof a.texto==="string")&&q.alternativas.some(a=>String(a.letra).trim().toUpperCase()===String(q.correta||"").trim().toUpperCase()))
    .map(q=>altShuffle({enunciado:q.enunciado,alternativas:q.alternativas.map(a=>({letra:String(a.letra).trim().toUpperCase(),texto:a.texto,porque:typeof a.porque==="string"?a.porque.trim():""})),
      correta:String(q.correta).trim().toUpperCase(),comentario:String(q.comentario||""),conceito:String(q.conceito||""),alerta:String(q.alerta||""),fonte:String(q.fonte||"").trim().slice(0,400),...(linkOk(q.link)?{link:String(q.link).trim()}:{}),...(typeof q.tema==="string"&&q.tema.trim()?{tema:q.tema.trim()}:{}),...(+q.figura>0&&+q.figura<=999?{figura:+q.figura}:{})}));
}
/* o próprio app sorteia a posição das alternativas (o Claude tende a concentrar a correta em B e C) e renomeia as letras A, B, C…;
   o comentário e os "porque" não citam letras (fixedFormat pede isso), então continuam valendo */
/* Fonte da questão (Lote 12): referência + link para a página oficial, quando houver */
function qFonteEl(q){if(!q||!(q.fonte||q.link))return null;const p=el(`<p class="qfonte"><b>Referência</b><span></span></p>`),sp=p.querySelector("span");sp.textContent=q.fonte||"";
  if(linkOk(q.link)){const a=el(`<a class="qflink" target="_blank" rel="noopener"></a>`);a.href=q.link.trim();a.textContent=q.fonte?"Abrir a referência":q.link.trim();if(q.fonte)sp.append(" · ");sp.appendChild(a)}return p}
function altShuffle(q){const L=q.alternativas;if(window.__noShuffle||L.length<2||L.length>8||new Set(L.map(a=>a.letra)).size!==L.length)return q;
  const right=L.find(a=>a.letra===q.correta),mix=shuffle(L),AB="ABCDEFGH";
  q.alternativas=mix.map((a,i)=>({...a,letra:AB[i]}));q.correta=AB[mix.indexOf(right)];return q}
/* alternativas de uma questão; depois de respondida, cada errada mostra o "porque" (questões antigas não têm) */
/* comentário organizado: separa "Alternativa X — por que…" do texto e leva para baixo de cada alternativa (sem mudar o que está salvo) */
const CM_MARK=/(^|\n|[.;!?]\s+)\s*(?:[-•*]\s*)?(?:(?:[Aa]lternativa|[Ll]etra|[Oo]p[çc][ãa]o)\s*\(?([A-H])\)?(?![A-Za-zÀ-ú])|\(([A-H])\)|([A-H])\))\s*(?:[—–:-]\s*|,\s*)?/g;
function cmParse(txt,letters){const t=String(txt||"");if(!t)return null;const M=[];let m;CM_MARK.lastIndex=0;
  while((m=CM_MARK.exec(t))){const L=m[2]||m[3]||m[4];if(letters.includes(L))M.push({L,at:m.index+m[1].length,end:m.index+m[0].length})}
  if(new Set(M.map(x=>x.L)).size<2)return null;
  return {intro:t.slice(0,M[0].at).trim(),segs:M.map((x,i)=>({L:x.L,t:t.slice(x.end,i+1<M.length?M[i+1].at:t.length).trim()}))}}
/* tira as marcas que vêm no comentário de algumas provas: "— Gabarito: A) <texto da alternativa>", "Por que está correta:", "Correta." no começo */
function cmTidy(t){let s=String(t||"");if(!s)return s;
  s=s.replace(/(^|\n)[ \t]*[—–-]?[ \t]*Gabarito\s*:\s*\(?[A-H]\)[^\n]*?(?=\bPor que\b|\n|$)/gi,"$1");
  s=s.replace(/\bPor que(?:\s+(?:a|o)\s+[A-H])?\s+(?:(?:est[áa]|[ée])\s+)?(?:(?:in)?corret[ao]|errad[ao]|cert[ao])\s*[:.—–-]\s*/gi,"");
  s=s.replace(/(^|\n)[ \t]*(?:in)?corret[ao]\s*[.:—–-]\s*/gi,"$1");
  return s.replace(/[ \t]{2,}/g," ").replace(/\n{3,}/g,"\n\n").trim()}
function cmClean(t){t=cmTidy(t);return t.replace(/^(?:(?:est[áa]|[ée])\s+)?(?:(?:in)?corret[ao]|errad[ao]|falsa|verdadeira)\b\s*(?:[.:;,—–-]\s*)?/i,"").replace(/^(?:porque|pois)\s+/i,"").trim().replace(/^./,c=>c.toUpperCase())}
function qSplit(q){if(!q||!q.comentario||!Array.isArray(q.alternativas))return q;const P=cmParse(q.comentario,q.alternativas.map(a=>a.letra));
  if(!P){const C=cmTidy(q.comentario),T=q.alternativas.map(a=>a.porque?{...a,porque:cmTidy(a.porque)}:a);return C!==q.comentario||T.some((a,i)=>a!==q.alternativas[i])?{...q,comentario:C,alternativas:T}:q}
  const why={},main=[cmTidy(P.intro)];P.segs.forEach(x=>{if(x.L===q.correta||!x.t)main.push(x.t&&cmClean(x.t));else why[x.L]=(why[x.L]?why[x.L]+" ":"")+cmClean(x.t)});
  if(!Object.keys(why).length){const C=cmTidy(q.comentario);return C!==q.comentario?{...q,comentario:C}:q}
  return {...q,comentario:main.filter(Boolean).join("\n\n"),alternativas:q.alternativas.map(a=>a.porque?{...a,porque:cmTidy(a.porque)}:!why[a.letra]?a:{...a,porque:why[a.letra]})}}
/* explicação: Gabarito no topo, por que a certa está certa, conceito-chave (o porquê das erradas fica sob cada alternativa) */
function qExplEl(q,o){o=o||{};const f=document.createDocumentFragment(),C=String(q.correta||"").replace(/[^A-Z0-9]/g,""),r=q.alternativas.find(a=>a.letra===q.correta);
  if(!C)return f;const box=el(`<div class="qexpl"><p class="qgab"><span>Gabarito</span><b></b></p></div>`);box.querySelector("b").textContent=r?`${C}) ${r.texto}`:C;
  if(o.note)box.appendChild(el(`<p class="pnote">${o.note}</p>`));
  if(q.comentario){const p=el(`<p class="qexp qwhy"><b></b><span></span></p>`);p.querySelector("b").textContent=`Por que ${C} está certa`;p.querySelector("span").textContent=q.comentario;box.appendChild(p)}
  if(q.pc){const p=el(`<p class="qexp qpc"><b>Ponto-chave</b><span></span></p>`);p.querySelector("span").textContent=cmTidy(q.pc);box.appendChild(p)}
  if(q.conceito){const p=el(`<p class="qexp qck"><b>Conceito-chave</b><span></span></p>`);p.querySelector("span").textContent=q.conceito;box.appendChild(p)}
  if(q.th){const p=el(`<p class="qexp qck qth"><b>Take home message</b><span></span></p>`);p.querySelector("span").textContent=cmTidy(q.th);box.appendChild(p)}
  f.appendChild(box);return f}
function altsEl(q,mine,onPick){const box=el(`<div class="alts"></div>`);
  q.alternativas.forEach(a=>{const b=el(`<button class="alt" type="button"><b>${esc(a.letra.replace(/[^A-Z0-9]/g,""))})</b><span></span></button>`);b.querySelector("span").textContent=a.texto;
    if(mine){b.disabled=true;if(a.letra===q.correta)b.classList.add("right");else if(a.letra===mine)b.classList.add("wrong")}else b.onclick=()=>onPick(a.letra);
    box.appendChild(b);
    if(mine&&a.porque&&a.letra!==q.correta){const w=el(`<p class="altwhy${a.letra===mine?" mine":""}">${a.letra===mine?"<b>Por que a sua não serve</b>":""}<span></span></p>`);w.querySelector("span").textContent=a.porque;box.appendChild(w)}});
  return box}
const GEN_ERR={rate_limited:"Limite de uso do Claude atingido no momento. Tente de novo mais tarde.",
  session_expired:"Sua sessão expirou. Entre de novo no Claude e tente outra vez.",
  invalid_json:"As questões vieram num formato que o app não conseguiu ler. Tente gerar de novo; se repetir, simplifique suas instruções.",
  refused:"O Claude não gerou questões com essas instruções. Revise as Instruções do gerador, na aba Questões.",
  empty_completion:"Nenhuma questão foi gerada. Tente pedir menos questões.",
  prompt_too_large:"Suas instruções estão longas demais. Encurte as Instruções do gerador, na aba Questões."};
const GEN_OFF=["not_granted","sampling_disabled","not_declared","capability_disabled","capability_removed"];
const BATCH=window.SITE_BATCH||5, QMAX=100;// no site (copiar e colar) o lote é maior para pedir menos vezes
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
async function generate(it){
  if(!sampleFn)return;
  let focus=genFocus[it.key]||"";
  // ordem dos subtópicos: primeiro os ainda não marcados, depois os demais, embaralhados
  const L=subList(it),hyMix=A=>{const H=shuffle(A.filter(x=>x.hy)),O=shuffle(A.filter(x=>!x.hy)),r=[];while(H.length||O.length){if(H.length)r.push(H.shift());if(H.length)r.push(H.shift());if(O.length)r.push(O.shift())}return r};
  let order=[...hyMix(L.filter(x=>!x.done)),...hyMix(L.filter(x=>x.done))].map(x=>x.t);
  if(focus==="__hoje"){order=todaySubs(it);focus=""}
  const MP=genMatOn(genMat[it.key])?msPack(genMat[it.key]):null;
  const g=gen[it.key]={status:"loading",qs:[],ans:{},msg:"",ctl:new AbortController(),n:qCount,focus,order,pos:0,mat:!!MP,P:MP};render();
  let fails=0,bi=0;
  while(g.qs.length<g.n){
    const k=Math.min(BATCH,g.n-g.qs.length),M=MP?msPart(MP,bi):null;
    let subs=[];if(!focus&&order.length&&!M){for(let i=0;i<k;i++)subs.push(order[(g.pos+i)%order.length])}
    const site=!!window.__site,mo=M?(site?{title:"Gerar questões do seu material",hint:(M.attach||M.scan||M.imgs&&M.imgs.length)?"Copie o pedido, abra uma conversa nova no app do Claude ou em claude.ai, ANEXE o seu material (PDF, slides ou fotos) e cole o pedido.":"Copie o pedido e cole numa conversa nova no app do Claude ou em claude.ai. O texto do seu material já vai junto."}:(M.imgs&&M.imgs.length?{images:M.imgs}:{})):{};
    try{
      const data=await sampleFn.json(buildPrompt(it,k,{focus,subs,avoid:g.qs.map(q=>q.conceito||q.enunciado.slice(0,120)),first:g.qs.length===0,mat:M,fac:genFacOn(it)}),{...mo,signal:g.ctl.signal,cache:false,
        onText:()=>{const s=document.getElementById("gs-"+it.key);if(s)s.textContent=`Escrevendo as questões ${g.qs.length+1} a ${g.qs.length+k} de ${g.n}…`}});
      if(gen[it.key]!==g)return;
      const qs=validQs(data).slice(0,k);qs.forEach(q=>{if(M){q.mat=true;figBind(q,M)}else delete q.figura});
      if(!qs.length){if(++fails>=2){g.msg=GEN_ERR.invalid_json;break}continue}
      fails=0;g.pos+=k;bi++;g.qs.push(...qs);qs.forEach(q=>bankAdd(q,"gerada",it.key,M?MP:null));render();
    }catch(e){
      if(gen[it.key]!==g)return;
      const code=e&&e.code;
      if(code==="cancelled"){if(!g.qs.length){delete gen[it.key];render();return}g.msg="";break}
      if(GEN_OFF.includes(code))g.msg=code==="not_granted"?"Você não permitiu o uso do Claude por este app. Para gerar questões, recarregue a página e aceite o pedido de permissão.":"A geração de questões não está disponível nesta visualização.";
      else g.msg=GEN_ERR[code]||"Não foi possível gerar as questões agora. Tente novamente.";
      break;
    }
  }
  if(gen[it.key]!==g)return;
  g.status=g.qs.length?"done":"error";
  if(g.qs.length&&g.qs.length<g.n)g.msg=`Foram geradas ${g.qs.length} de ${g.n} questões.`+(g.msg?" "+g.msg:"");
  render();
}
function answer(it,qi,letra){
  const g=gen[it.key];if(!g||g.ans[qi])return;
  g.ans[qi]=letra;const ok=letra===g.qs[qi].correta;bankAns(g.qs[qi],"gerada",it.key,letra,0,"gen",1);
  if(!ok)rdAdd(it.key,g.qs[qi],"gen",g.P);
  upd(it.key,x=>addQ(x,1,ok?1:0,null,"Claude"));logAct("q",1,ok?1:0);commit();
}
function toCaderno(it,qi){
  const g=gen[it.key],q=g.qs[qi];
  drafts[it.key]={...qDraft(q,g.ans[qi],"Questão gerada pelo Claude"),t:(drafts[it.key]||{}).t||"conhecimento"};
  eErr="";render();
  const f=detGet("ew-",it.key);if(f){f.scrollIntoView({behavior:"smooth",block:"center"});f.focus({preventScroll:true})}
}
function setQCount(v){qCount=Math.max(1,Math.min(QMAX,Math.round(v)||10));try{localStorage.setItem("resid-qcount",String(qCount))}catch(e){}}
/* estilo da faculdade no gerador do tema: padrão ligado quando o tema é da faculdade (ou ligado a ela) e há prova modelo */
let genSty={};
const genFacOn=it=>facModels().length>0&&(genSty[it.key]!==undefined?genSty[it.key]:!!(it.own||facLinkMap()[it.key]));
function renderGen(it){
  const g=gen[it.key];
  const box=el(`<div class="grp dblk dgen"><span class="glabel">Gerar questões com o Claude</span></div>`);{const fx=bkFixEl(it);if(fx)box.insertBefore(fx,box.firstChild)}
  if(!g||g.status!=="loading"){
    const subs=subList(it).map(x=>x.t);
    if(subs.length){const ps=todaySubs(it);if(genFocus[it.key]&&!subs.includes(genFocus[it.key])&&!(genFocus[it.key]==="__hoje"&&ps.length))delete genFocus[it.key];
      const fr=el(`<div class="qgen" style="width:100%"><label for="qf-${it.key}" class="gtext">Foco</label><select id="qf-${it.key}" style="flex:1;min-width:0"><option value="">Tema inteiro</option></select></div>`);
      if(ps.length){const o=document.createElement("option");o.value="__hoje";o.textContent="Subtópicos de hoje ("+ps.length+")";fr.querySelector("select").appendChild(o)}
      const fs=fr.querySelector("select");subs.forEach(t=>{const o=document.createElement("option");o.value=t;o.textContent=t;fs.appendChild(o)});
      fs.value=genFocus[it.key]||"";fs.onchange=()=>{genFocus[it.key]=fs.value};
      box.appendChild(fr)}
    if(facModels().length){const on=genFacOn(it),w=el(`<div class="qgen"><span class="gtext">Estilo</span><div class="seg" role="group" aria-label="Estilo das questões"></div></div>`);
      [[false,"Residência"],[true,"Da minha faculdade"]].forEach(([v,l])=>{const b=el(`<button type="button"></button>`);b.id=`qsty-${it.key}-${v?"fac":"res"}`;b.textContent=l;b.setAttribute("aria-pressed",on===v);b.onclick=()=>{genSty[it.key]=v;render()};w.querySelector(".seg").appendChild(b)});box.appendChild(w)}
    const row=el(`<div class="qgen"><label for="qn-${it.key}" class="gtext">Quantidade</label><input class="qnum" id="qn-${it.key}" type="number" inputmode="numeric" min="1" max="${QMAX}" value="${qCount}"><div class="qpre" role="group" aria-label="Sugestões de quantidade"></div></div>`);
    const inp=row.querySelector("input");
    inp.onchange=()=>{setQCount(Number(inp.value));inp.value=qCount;pre.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",Number(x.dataset.v)===qCount))};
    const pre=row.querySelector(".qpre");
    [5,10,20].forEach(v=>{const b=el(`<button class="mini" type="button" data-v="${v}" aria-pressed="${v===qCount}">${v}${v===10?" · sugerido":""}</button>`);
      b.onclick=()=>{setQCount(v);inp.value=v;pre.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x===b))};pre.appendChild(b)});
    box.appendChild(row);
    box.appendChild(genMatEl(it));
    const b=el(`<button class="btn primary" type="button" style="align-self:flex-start">${g&&g.status==="done"?"Gerar novas questões":"Gerar questões"}${genMatOn(genMat[it.key])?" do material":""}</button>`);
    b.onclick=()=>{setQCount(Number(inp.value));generate(it)};
    if(!sampleFn){b.disabled=true;b.title="Conectando ao Claude…"}
    box.appendChild(b);
    if(!g)box.appendChild(el(`<p class="gstatus">Sugestão: 10 questões por sessão. Você pode pedir até ${QMAX}; elas chegam em blocos de ${BATCH} e dá para responder enquanto as próximas são escritas. Cada resposta conta no desempenho do tema, e cada questão traz a referência usada.</p>`));
  }
  if(g&&g.status==="loading"){
    const row=el(`<div class="qgen"><p class="gstatus" id="gs-${it.key}" aria-live="polite">${g.qs.length?`${g.qs.length} de ${g.n} prontas. Escrevendo as próximas…`:"Preparando as questões. O primeiro bloco pode levar até um minuto…"}</p><button class="btn" type="button">Parar</button></div>`);
    row.querySelector("button").onclick=()=>g.ctl.abort();box.appendChild(row);
    if(g.n>1){const pb=el(`<div class="sbar" aria-hidden="true"><i style="width:${g.qs.length/g.n*100}%"></i></div>`);box.appendChild(pb)}
  }
  if(g&&g.msg){const p=el(`<p class="${g.status==="error"?"err":"gstatus"}"></p>`);p.textContent=g.msg;box.appendChild(p)}
  if(g&&g.qs.length){
    const answered=Object.keys(g.ans).length, hits=Object.entries(g.ans).filter(([i,l])=>g.qs[i].correta===l).length;
    if(answered)box.appendChild(el(`<p class="gstatus"><b>${hits} de ${answered}</b> corretas${answered<g.qs.length?` · ${g.qs.length-answered} por responder`:""}. Resultado somado ao desempenho do tema.</p>`));
    const ol=el(`<ol class="qlist"></ol>`);
    const tot=g.status==="loading"?g.n:g.qs.length;
    g.qs.forEach((q,qi)=>{
      const mine=g.ans[qi];
      const c=el(`<li class="qcard"><span class="qn">QUESTÃO ${qi+1} DE ${tot}${q.mat?` · <span class="qmat">do seu material</span>`:""}</span><p class="qstem"></p></li>`);
      c.querySelector(".qstem").textContent=q.enunciado;{const fe=figEl(q,g.P);if(fe)c.appendChild(fe)}
      c.appendChild(altsEl(qSplit(q),mine,l=>answer(it,qi,l)));
      if(mine){const ok=mine===q.correta;
        c.appendChild(el(`<p class="verdict ${ok?"ok":"no"}">${ok?"Correta.":"Incorreta. A resposta é "+q.correta.replace(/[^A-Z0-9]/g,"")+"."}</p>`));
        c.appendChild(qExplEl(qSplit(q)));
        {const f=qFonteEl(q);if(f)c.appendChild(f)}if(q.alerta&&q.alerta.trim()){const p=el(`<p class="alerta"></p>`);p.textContent="Atenção: "+q.alerta;c.appendChild(p)}
        const acts=el(`<div class="btns"></div>`);
        if(!ok){const b=el(`<button class="btn" type="button">Levar para o caderno de erros</button>`);b.onclick=()=>toCaderno(it,qi);acts.appendChild(b)}
        if(acts.children.length)c.appendChild(acts);
        c.appendChild(qActsEl(q,mine,{k:it.key,src:"Questão gerada"}))}
      ol.appendChild(c)});
    box.appendChild(ol);
  }
  return box;
}

/* instruções */
function setPromptStatus(t){$("#promptStatus").textContent=t}
async function savePrompt(){
  const v=$("#promptBox").value;
  if(!v.trim()){setPromptStatus("As instruções não podem ficar vazias. Use Restaurar padrão para voltar ao texto original.");return}
  promptText=v;promptEdited=false;try{localStorage.setItem(LSP,v)}catch(e){}
  if(settingsDoc){setPromptStatus("Salvando…");try{await settingsDoc.set({prompt:v,updatedAt:new Date().toISOString()});setPromptStatus("Instruções salvas na sua conta. As próximas questões já seguem este texto.")}
    catch(e){setPromptStatus("Não foi possível salvar na conta; ficou salvo neste navegador.")}}
  else setPromptStatus("Instruções salvas neste navegador. As próximas questões já seguem este texto.");
}
function bindPromptReset(){$("#promptReset").onclick=()=>{$("#promptResetBox").innerHTML=`<span class="confirm"><span>Substituir pelo texto padrão?</span><button class="danger" id="pyes" type="button">Restaurar</button><button id="pno" type="button">Cancelar</button></span>`;
  $("#pyes").onclick=()=>{$("#promptBox").value=DEFAULT_PROMPT;restorePromptReset();savePrompt()};$("#pno").onclick=restorePromptReset}}
function restorePromptReset(){$("#promptResetBox").innerHTML=`<button class="btn" id="promptReset" type="button">Restaurar padrão</button>`;bindPromptReset()}

