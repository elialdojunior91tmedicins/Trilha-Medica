/* ===== B5 (12/11/2026): conceito recorrente = a mesma ideia cobrada em 2 ou mais provas diferentes (só questões de provas: "prova" e
   "oficial"). Decidido pelo usuário: app + Claude.
   - Claude: ao comentar (cmPrompt) ou no arquivo de gabarito e comentários (cjApply), devolve "chave" = nome curto da ideia cobrada;
     fica na questão da prova (r.cr) e vai para o banco (x.cr, crs "c"). Mesma chave (crNorm) em provas diferentes = recorrente.
   - App: sugere pares de provas diferentes, do mesmo tema (e do mesmo subtópico, quando os dois têm), com palavras parecidas no conceito,
     ponto-chave e take home (ou o começo do comentário). O usuário confirma ("É a mesma ideia": as duas ganham a mesma chave, crs "u",
     que a prova não apaga) ou recusa ("Não é": ui.prefs.crno).
   - Usos: selo "Recorrente" na lista do banco, filtro/preset "HY recorrentes" (bkF.rc), +20 no sorteio (bkScore) e o cartão do Resumo. ===== */
const CR_SIM=0.34,CR_MIN_W=4,CR_KEY_SIM=0.6;
const CR_STOP=new Set(["quando","sempre","pacientes","paciente","podem","pode","deve","devem","sendo","entre","apresenta","presenca","principal","principais","questao","alternativa","correta","incorreta","diagnostico","tratamento","conduta","quadro","clinico","clinica","exame","exames","casos","indicado","indicada","maior","menor","outros","outras","porque","ainda","tambem","forma","importante","geralmente","mesmo","sobre","muito","pelos","pelas","resposta"]);
const crNorm=s=>bqT(s).split(" ").filter(w=>w.length>2).slice(0,10).join(" ").slice(0,80);
const crExamKey=x=>x.ex||bqT((x.ban||"")+" "+(x.ano||""));
const crProva=x=>(x.o==="prova"||x.o==="oficial")&&!x.del&&!x.an&&x.ks&&x.ks.length&&!!crExamKey(x);
function crWords(x){const q=x.q,t=[q.conceito,q.pc,q.th].filter(Boolean).join(" ")||String(q.comentario||"").slice(0,400);return new Set(bqT(t).split(" ").filter(w=>w.length>=5&&!CR_STOP.has(w)))}
const crJac=(A,B)=>{let n=0;A.forEach(w=>{if(B.has(w))n++});return {n,j:n/Math.max(1,A.size+B.size-n)}};
const crNo=()=>Array.isArray(ui.prefs.crno)?ui.prefs.crno:[];
const crPair=(a,b)=>a.id<b.id?a.id+"|"+b.id:b.id+"|"+a.id;
/* grupos pela chave e quem é recorrente (id → nº de provas); guardado por 1 s para a lista do banco não recalcular a cada linha */
let crMemo={t:0,v:null};
function crIndex(){if(crMemo.v&&Date.now()-crMemo.t<1000)return crMemo.v;const g=new Map();
  bank.forEach(x=>{if(!x.cr||!crProva(x))return;if(!g.has(x.cr))g.set(x.cr,[]);g.get(x.cr).push(x)});
  const rec=new Map(),groups=[];g.forEach((L,k)=>{const E=new Set(L.map(crExamKey));if(E.size<2)return;L.forEach(x=>rec.set(x.id,E.size));groups.push({k,L,n:E.size})});
  groups.sort((a,b)=>b.n-a.n||b.L.length-a.L.length);crMemo={t:Date.now(),v:{rec,groups}};return crMemo.v}
const crRec=x=>crIndex().rec.get(x.id)||0;
const crReset=()=>{crMemo={t:0,v:null}};
/* pares para conferir: provas diferentes, mesmo tema (e subtópico), palavras do conceito parecidas ou chaves do Claude parecidas */
function crSuggest(max){const no=new Set(crNo()),by=new Map(),out=[];
  bank.forEach(x=>{if(!crProva(x))return;const k=x.ks[0];if(!by.has(k))by.set(k,[]);by.get(k).push({x,W:crWords(x),K:x.cr?new Set(x.cr.split(" ").filter(w=>w.length>=4)):null})});
  by.forEach(L=>{for(let i=0;i<L.length;i++)for(let j=i+1;j<L.length;j++){const a=L[i],b=L[j];
    if(crExamKey(a.x)===crExamKey(b.x)||a.x.cr&&a.x.cr===b.x.cr||a.x.sb&&b.x.sb&&a.x.sb!==b.x.sb||no.has(crPair(a.x,b.x)))continue;
    let s=0;if(a.K&&b.K&&a.K.size&&b.K.size){const r=crJac(a.K,b.K);if(r.j>=CR_KEY_SIM)s=1+r.j}
    if(!s){const r=crJac(a.W,b.W);if(r.n>=CR_MIN_W&&r.j>=CR_SIM)s=r.j}
    if(s)out.push({a:a.x,b:b.x,s,w:[...a.W].filter(w=>b.W.has(w))})}});
  out.sort((p,q)=>q.s-p.s);return max?out.slice(0,max):out}
function crConfirm(P){const a=P.a,b=P.b;let key=a.cr||b.cr||crNorm(P.w.slice(0,6).join(" "))||crNorm(a.q.conceito||a.q.pc||"");if(!key)return;
  const old=[a.cr,b.cr].filter(k=>k&&k!==key);bank.forEach(x=>{if(x===a||x===b||x.cr&&old.includes(x.cr)){if(x.cr!==key||x.crs!=="u"){x.cr=key;x.crs="u";bkTouch(x)}}});crReset();render()}
function crReject(P){ui.prefs.crno=[...crNo().filter(k=>k!==crPair(P.a,P.b)),crPair(P.a,P.b)].slice(-500);saveUI();render()}
function crUnlink(x){if(!x.cr)return;delete x.cr;delete x.crs;bkTouch(x);crReset();render()}
/* Questões › Resumo */
function crCardEl(){const I=crIndex(),S=crSuggest(6),nP=bank.filter(crProva).length;if(!nP)return null;
  const c=el(`<section class="card crcard" aria-labelledby="crh"><div class="dhead"><h2 id="crh">Conceitos recorrentes</h2><span class="todaydate"></span></div></section>`);
  c.querySelector(".todaydate").textContent=I.groups.length?`${I.groups.length} ${I.groups.length===1?"conceito":"conceitos"}`:"";
  c.appendChild(el(`<p class="how hx">A mesma ideia cobrada em 2 ou mais provas diferentes: o High Yield mais confiável, porque vem de prova real. O Claude marca a ideia quando comenta uma prova; o app sugere pares parecidos para você confirmar.</p>`));
  if(I.groups.length){const ul=el(`<ul class="crlist"></ul>`);I.groups.slice(0,8).forEach(G=>{const x=G.L[0],it=BYKEY[x.ks[0]],li=el(`<li><b></b><span class="how"></span></li>`);
      li.querySelector("b").textContent=x.q.conceito||x.q.pc||G.k;li.querySelector("span").textContent=` · ${it?it.t:""} · ${G.n} provas`;ul.appendChild(li)});c.appendChild(ul);
    const go=el(`<button class="btn" type="button" id="crSee">Ver no banco</button>`);go.onclick=()=>{bkF=bkFDef();bkF.rc=true;bkShown=BK_PAGE;qGo("banco")};c.appendChild(go)}
  else c.appendChild(el(`<p class="cempty">Nenhum ainda. Eles aparecem quando a mesma ideia cai em duas provas diferentes do seu banco.</p>`));
  if(S.length){const h=el(`<p class="glabel crh2">Para conferir · ${crSuggest().length}</p>`);c.appendChild(h);const ol=el(`<ol class="crpairs"></ol>`);
    S.forEach((P,i)=>{const it=BYKEY[P.a.ks[0]],li=el(`<li class="crpair"><p class="crt how"></p><div class="crab"><div></div><div></div></div><div class="btns"></div></li>`);
      li.querySelector(".crt").textContent=(it?it.t:"")+(P.w.length?` · em comum: ${P.w.slice(0,5).join(", ")}`:"");
      [P.a,P.b].forEach((x,j)=>{const d=li.querySelectorAll(".crab>div")[j];d.appendChild(el(`<small class="crsrc"></small>`)).textContent=x.pv||[x.ban,x.ano].filter(Boolean).join(" ")||"Prova";
        d.appendChild(el(`<p></p>`)).textContent=clCut(x.q.conceito||x.q.pc||x.q.th||x.q.comentario||x.q.enunciado,220)});
      const ok=el(`<button class="btn primary" type="button">É a mesma ideia</button>`),no=el(`<button class="btn" type="button">Não é</button>`);ok.id="crOk-"+i;no.id="crNo-"+i;
      ok.onclick=()=>crConfirm(P);no.onclick=()=>crReject(P);li.querySelector(".btns").append(no,ok);ol.appendChild(li)});c.appendChild(ol)}
  return c}
