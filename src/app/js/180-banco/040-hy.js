/* ===== B5 (12/11/2026): High Yield pelo banco. Decidido pelo usuário: o banco SUGERE, não troca. O tema mostra o que o banco viu
   ("No seu banco: caiu N vezes em M provas") e, com provas suficientes, sugere o peso e o ★ dos subtópicos; o usuário aceita com um toque
   (vira escolha dele, que sempre vence) ou dispensa ("Agora não", em ui.prefs.hyno).
   - Conta só questões de provas (origem "prova" ou "oficial"), por prova (ex/banca/ano); anuladas não contam.
   - Peso do tema: as 12 provas da base (INC_DATA/INC_SRC) já estão no peso, então as mesmas provas no banco NÃO contam de novo (hyBase).
     Contagem = base + provas novas do banco (as provas-alvo do Perfil valem HY_TGT_W; sem alvo: ENARE/ENAMED). Os temas são ordenados
     por essa contagem e recebem 3/2/1 na mesma proporção do padrão de hoje; só sugere com HY_NEW_MIN provas novas (≥ HY_NEW_Q questões)
     e quando o tema passou da fronteira por pelo menos HY_MARGIN posições (evita ficar trocando por uma questão); e só com evidência do
     banco: para subir, ≥ HY_UP_MIN questões e taxa nas provas novas ≥ 1,5× a da base; para descer, taxa ≤ metade da da base.
   - ★ dos subtópicos: a base não tinha contagem por subtópico (HY_DEF é estimativa), então valem todas as provas do banco com subtópico
     classificado (r.sb do B4). Com HY_SB_MIN questões no tema: sugere ★ nos que mais caem (≥2 questões, teto igual ao do HY_DEF) e tirar
     a ★ da estimativa que não apareceu nenhuma vez (só com 2 questões por subtópico, em média). Marca feita pelo usuário nunca recebe sugestão. ===== */
const HY_NEW_MIN=3,HY_NEW_Q=150,HY_UP_MIN=3,HY_SB_MIN=8,HY_TGT_W=2,HY_MARGIN=5,HY_BASE_Q=1182;
function hyBase(ban,ano){const b=bqT(ban),a=+ano||0;return /\benare\b/.test(b)&&a>=2020&&a<=2024||/\benamed\b/.test(b)&&a===2025||/\brevalida\b/.test(b)&&a>=2021&&a<=2026}
const HY_TGT_SKIP=new Set(["prova","provas","residencia","medica","medico","acesso","direto","selecao","pelo","pela","para","geral","hospital","universitario"]);
function hyTargets(){const W=new Set();exList().forEach(e=>bqT(e.name).split(" ").forEach(w=>{if(w.length>=4&&!HY_TGT_SKIP.has(w)&&!/^\d+$/.test(w))W.add(w)}));return W.size?W:new Set(["enare","enamed"])}
/* provas do banco: {key,name,ban,ano,base,tgt,w,qs:[questões]} */
function hyExams(){const by=new Map(),T=hyTargets();
  bkLive().forEach(x=>{if((x.o!=="prova"&&x.o!=="oficial")||x.an||!x.ks||!x.ks.length)return;const ex=x.ex&&typeof exams!=="undefined"?exams.find(e=>e.id===x.ex):null;
    const key=x.ex||bqT((x.ban||"")+" "+(x.ano||""));if(!key)return;
    let E=by.get(key);if(!E){const name=ex&&ex.name||[x.ban,x.ano].filter(Boolean).join(" ")||"Prova",hay=bqT(name+" "+(x.ban||""));
      E={key,name,ban:x.ban||"",ano:x.ano||"",base:hyBase(x.ban||name,x.ano||(String(name).match(/\b(20\d\d)\b/)||[])[1]),tgt:[...T].some(w=>new RegExp("\\b"+w+"\\b").test(hay)),qs:[]};E.w=E.tgt?HY_TGT_W:1;by.set(key,E)}
    E.qs.push(x)});return [...by.values()]}
/* contagem por tema (todas as provas, para mostrar; e só as novas, para o peso) e por subtópico */
function hyCount(){const E=hyExams(),t={},sb={};let newN=0,newQ=0,newW=0;
  E.forEach(e=>{if(!e.base){newN++;newQ+=e.qs.length;newW+=e.qs.length*e.w}
    e.qs.forEach(x=>{x.ks.forEach((k,j)=>{if(!BYKEY[k])return;const f=j?0.5:1,r=t[k]||(t[k]={n:0,pv:new Set(),nw:0});r.n+=f;r.pv.add(e.key);if(!e.base)r.nw+=f*e.w});
      const k=x.ks[0];if(x.sb&&BYKEY[k]){const S=sb[k]||(sb[k]={tot:0,c:{}}),c=S.c[x.sb]||(S.c[x.sb]={n:0,w:0});S.tot++;c.n++;c.w+=e.w}})});
  return {E,t,sb,newN,newQ,newW,ready:newN>=HY_NEW_MIN&&newQ>=HY_NEW_Q}}
const hyNo=()=>Array.isArray(ui.prefs.hyno)?ui.prefs.hyno:[];
function hyDismiss(key){ui.prefs.hyno=[...hyNo().filter(x=>x!==key),key].slice(-300);saveUI();render()}
/* peso sugerido para cada tema da residência (só quando o banco está pronto) */
function hyWeightSugs(C){C=C||hyCount();if(!C.ready)return [];const T=ALL.filter(it=>!it.own),N=T.length,n3=T.filter(it=>it.w0===3).length,n1=T.filter(it=>it.w0===1).length,no=new Set(hyNo());
  /* base + provas novas; se as novas passarem do tamanho da base, são reduzidas para pesar no máximo o mesmo que ela */
  const sc=it=>{const D=INC_DATA[it.key]||[0];return (D[0]||0)+((C.t[it.key]||{}).nw||0)*Math.min(1,HY_BASE_Q/Math.max(C.newW,1))};
  const R=T.map(it=>[it,sc(it)]).sort((a,b)=>b[1]-a[1]||a[0].num-b[0].num),out=[];
  /* só com evidência do próprio banco: nas provas novas o tema caiu bem mais (subir) ou bem menos (descer) que na base. Sem isso, a ordem pura
     da contagem discordaria do peso atual em temas que o banco nem viu (o peso padrão também leva o consenso dos cursinhos, D[3]). */
  const rate=it=>{const D=INC_DATA[it.key]||[0];return {b:(D[0]||0)/HY_BASE_Q,n:((C.t[it.key]||{}).nw||0)/Math.max(C.newW,1),raw:(C.t[it.key]||{}).n||0}};
  R.forEach(([it,v],i)=>{const sug=i<n3?3:i>=N-n1?1:2,cur=wOf(it);if(sug===cur||get(it.key).w)return;const r=rate(it);
    if(sug>cur&&!(r.raw>=HY_UP_MIN&&r.n>=Math.max(r.b*1.5,1/HY_BASE_Q)))return;if(sug<cur&&!(r.b*C.newW>=HY_UP_MIN*2&&r.n<=r.b*0.5))return;/* descer: o banco tinha de mostrar ao menos 6 questões pelo ritmo da base e mostrou metade ou menos */
    const dist=sug===3?n3-i:sug===1?i-(N-n1)+1:Math.min(i-n3+1,N-n1-i);if(dist<HY_MARGIN)return;
    const key=`w:${it.key}:${sug}`;if(no.has(key))return;out.push({k:it.key,from:cur,to:sug,key,n:(C.t[it.key]||{}).n||0,pv:((C.t[it.key]||{}).pv||new Set()).size,exp:Math.round(r.b*C.newQ),nn:Math.round(r.raw)})});
  return out}
/* ★ sugeridas num tema: {on:[x],off:[x]} */
function hySubSug(k,C){C=C||hyCount();const it=BYKEY[k],S=C.sb[k];if(!it||it.own||!S||S.tot<HY_SB_MIN)return null;const s=get(k),L=subList(it),no=new Set(hyNo()),n=L.length;
  const teto=n<=3?1:n<=6?2:Math.ceil(n/3),cnt=x=>S.c[sbKey(x)]||{n:0,w:0},mine=x=>x.i!==undefined?!!(s.hy&&s.hy[x.i]):!!x.hy;
  const top=new Set(L.filter(x=>cnt(x).n>=2).sort((a,b)=>cnt(b).w-cnt(a).w||cnt(b).n-cnt(a).n).slice(0,teto).map(sbKey));
  const on=L.filter(x=>top.has(sbKey(x))&&!x.hy&&!mine(x)&&!no.has(`s:${k}:${sbKey(x)}:1`)),off=S.tot<2*n?[]:L.filter(x=>x.hy&&x.hyc&&!cnt(x).n&&!no.has(`s:${k}:${sbKey(x)}:0`));
  return on.length||off.length?{on,off,tot:S.tot,cnt}:null}
function hyApplySub(k,on,off){const it=BYKEY[k];upd(k,s=>{const h={...(s.hy||{})},def=HY_DEF[k]||[];
    const put=(x,v)=>{if(x.i!==undefined){if(v===def.includes(x.i))delete h[x.i];else h[x.i]=v?"u":"n"}else s.cs=(s.cs||[]).map((c,j)=>j!==x.j?c:v?{...c,hy:"u"}:(({hy,...r})=>r)(c))};
    on.forEach(x=>put(x,true));off.forEach(x=>put(x,false));if(Object.keys(h).length)s.hy=h;else delete s.hy});commit()}
function hyApplyW(k,v){const it=BYKEY[k];upd(k,x=>{if(v===it.w0)delete x.w;else x.w=v});commit()}
/* no tema: o que o banco viu + sugestão de peso */
function hyTopicEl(it,C){C=C||hyCount();const r=C.t[it.key];const w=el(`<div class="hybank"></div>`);
  if(r&&r.n){const p=el(`<p class="how"></p>`);const n=Math.round(r.n*10)/10;p.textContent=`No seu banco: caiu ${String(n).replace(".",",")} ${n===1?"vez":"vezes"} em ${r.pv.size} ${r.pv.size===1?"prova":"provas"}.`;w.appendChild(p)}
  const S=hyWeightSugs(C).find(x=>x.k===it.key);if(S)w.appendChild(hySugRow(`O banco sugere peso ${INC[S.to].toLowerCase()} (hoje: ${INC[S.from].toLowerCase()}): ${hyWhy(S,C)}.`,"hyw-"+it.key,()=>hyApplyW(it.key,S.to),()=>hyDismiss(S.key)));
  return w.childNodes.length?w:null}
const hyWhy=(S,C)=>S.to>S.from?`caiu ${S.n%1?String(S.n).replace(".",","):S.n} vezes em ${S.pv} ${S.pv===1?"prova":"provas"} do banco`:`nas ${C.newN} provas novas caiu ${S.nn} ${S.nn===1?"vez":"vezes"}; pelo peso de hoje seriam umas ${S.exp}`;
function hySugRow(txt,id,ok,no){const p=el(`<div class="hysug"><span></span><button class="btn mini" type="button">Aceitar</button><button class="link" type="button">Agora não</button></div>`);
  p.querySelector("span").textContent=txt;const [a,b]=p.querySelectorAll("button");a.id=id;b.id=id+"-no";a.onclick=ok;b.onclick=no;return p}
/* nos subtópicos do tema */
function hySubEl(it,C){const G=hySubSug(it.key,C);if(!G)return null;const parts=[];if(G.on.length)parts.push(`★ em ${G.on.map(x=>`“${x.t}” (${G.cnt(x).n})`).join(", ")}`);
  if(G.off.length)parts.push(`tirar a ★ de ${G.off.map(x=>`“${x.t}”`).join(", ")} (nenhuma questão)`);
  return hySugRow(`Pelas ${G.tot} questões do banco com subtópico: ${parts.join("; ")}.`,"hys-"+it.key,()=>hyApplySub(it.key,G.on,G.off),()=>{ui.prefs.hyno=[...hyNo(),...G.on.map(x=>`s:${it.key}:${sbKey(x)}:1`),...G.off.map(x=>`s:${it.key}:${sbKey(x)}:0`)].slice(-300);saveUI();render()})}
/* Questões › Resumo: situação do HY pelo banco e todas as sugestões num lugar só */
function hyCardEl(){const C=hyCount();if(!C.E.length)return null;const c=el(`<section class="card hycard" aria-labelledby="hych"><div class="dhead"><h2 id="hych">High Yield pelo seu banco</h2></div></section>`);
  const nb=C.E.filter(e=>e.base).length;
  c.appendChild(el(`<p class="gtext"></p>`)).textContent=`${C.E.length} ${C.E.length===1?"prova":"provas"} no banco: ${C.newN} fora das 12 que já formam o peso${nb?` (${nb} já ${nb===1?"está":"estão"} na base e não ${nb===1?"conta":"contam"} de novo)`:""}.`+(C.ready?"":` As sugestões de peso começam com ${HY_NEW_MIN} provas novas (${HY_NEW_Q}+ questões); faltam ${Math.max(0,HY_NEW_MIN-C.newN)}.`);
  const W=hyWeightSugs(C),SS=ALL.filter(it=>!it.own).map(it=>[it,hySubSug(it.key,C)]).filter(([,g])=>g);
  if(!W.length&&!SS.length){c.appendChild(el(`<p class="how">Nenhuma sugestão agora. Elas aparecem aqui e no próprio tema, e só mudam algo quando você aceitar.</p>`));return c}
  const ul=el(`<ul class="hylist"></ul>`);
  W.slice(0,12).forEach(S=>{const it=BYKEY[S.k],li=el(`<li></li>`),a=el(`<button class="link" type="button"></button>`);a.textContent=it.t;a.onclick=()=>openTopic(S.k);li.appendChild(a);
    li.appendChild(hySugRow(`peso ${INC[S.from].toLowerCase()} → ${INC[S.to].toLowerCase()} · ${hyWhy(S,C)}`,"hyw-"+S.k,()=>hyApplyW(S.k,S.to),()=>hyDismiss(S.key)));ul.appendChild(li)});
  SS.slice(0,12).forEach(([it])=>{const li=el(`<li></li>`),a=el(`<button class="link" type="button"></button>`);a.textContent=it.t;a.onclick=()=>openTopic(it.key);li.appendChild(a);li.appendChild(hySubEl(it,C));ul.appendChild(li)});
  c.appendChild(ul);c.appendChild(el(`<p class="how hx">Contam só as questões de provas (na íntegra e oficiais). As provas-alvo do seu Perfil pesam o dobro. Aceitar vira escolha sua, que sempre vale; “Agora não” esconde a sugestão.</p>`));return c}
