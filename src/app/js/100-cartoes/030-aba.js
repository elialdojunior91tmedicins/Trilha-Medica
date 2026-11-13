/* Aba Cartões (13/11/2026): partes Hoje · Todos · Números (view "cartoes", #viewCards, #cSegBar, #cdBody).
   Todo caminho até os cartões passa por cdOpen(parte, opções). Desenho: docs/superpowers/specs/2026-11-13-aba-cartoes-design.md */
let cSeg="hoje";try{const v=localStorage.getItem("resid-cseg");if(["hoje","todos","numeros"].includes(v))cSeg=v}catch(e){}
let cdF={sort:(()=>{const v=lsGet("resid-cdsort","due");return ["due","lapses","new"].includes(v)?v:"due"})()},cdNewOpen=false,cdPick=null;
function setCSeg(v){cSeg=v;lsSet("resid-cseg",v);render();window.scrollTo({top:0})}
/* o={k:tema (filtro em Todos), leech:true, pick:id (abre no editor), run:[ids], gen:rótulo, go:true (começa a revisão do dia), novo:true} */
function cdOpen(seg,o){o=o||{};backStack=[];cSeg=seg||"hoje";lsSet("resid-cseg",cSeg);
  if(seg==="todos"&&(o.k||o.leech))cdF={sort:cdF.sort,...(o.k?{k:o.k}:{}),...(o.leech?{leech:true}:{})};if(o.pick)cdPick=o.pick;if(o.novo)cdNewOpen=true;
  showView("cartoes");if(o.run)cdRunStart(o.run,o.gen);else if(o.go)cdRunStart();else render();window.scrollTo({top:0})}
function renderCards(){const v=$("#viewCards"),B=$("#cdBody");if(!v||!B)return;v.dataset.cseg=cSeg;const dn=cdDue().length;
  $("#cSegBar").querySelectorAll("button").forEach(b=>{b.setAttribute("aria-pressed",b.dataset.c===cSeg);b.innerHTML={hoje:"Hoje"+(dn?`<b>${dn}</b>`:""),todos:"Todos",numeros:"Números"}[b.dataset.c];b.onclick=()=>setCSeg(b.dataset.c)});
  B.innerHTML="";const L=cSeg==="todos"?[cdAllEl()]:cSeg==="numeros"?[cdNumEl()]:cdHojeEls();L.filter(Boolean).forEach(x=>B.appendChild(x))}
/* ---- Hoje ---- */
function cdHojeEls(){const c=nCardsCard0(),h=c.querySelector("h2");h.textContent="Revisão de hoje";c.querySelector(".dhead").appendChild(helpBtn("Cartões"));const out=[c];
  if(cdRun)return out;
  const due=cdDue(),nNew=due.filter(x=>!x.f.st).length,nRev=due.length-nNew,line=el(`<p class="how cdline" id="cdLine"></p>`);
  line.textContent=due.length?`${nRev} para revisar · ${nNew} ${nNew===1?"novo":"novos"} · ~${Math.max(1,Math.round(due.length*.25))} min`:"Nada para revisar hoje.";
  c.querySelector(".dhead").after(line);
  const nb=el(`<button class="btn" type="button" id="cdNew">+ Novo cartão</button>`);nb.setAttribute("aria-expanded",cdNewOpen);nb.onclick=()=>{cdNewOpen=!cdNewOpen;render();if(cdNewOpen)setTimeout(()=>{const x=$("#cdNewBox");if(x)x.scrollIntoView({block:"nearest",behavior:"smooth"})},60)};
  const go=c.querySelector("#cdGo"),row=el(`<div class="btns cdgorow"></div>`);if(go){go.before(row);row.append(go,nb)}else{line.after(row);row.appendChild(nb)}
  if(cdNewOpen&&typeof cdNewEl==="function")row.after(cdNewEl());
  const lc=cdLeechEl();if(lc)out.push(lc);return out}
function cdLeechEl(){const L=cdLeeches(5);if(!L.length)return null;const all=cards.filter(x=>cdLive(x)&&(x.f.lapses||0)>=CD_LEECH).length;
  const c=el(`<section class="card cdleech" id="cdLeech" aria-labelledby="cdLh"><div class="dhead"><h2 id="cdLh">Cartões que você mais esquece</h2></div><p class="how">Esqueceu ${CD_LEECH} vezes ou mais. Reescrever costuma resolver: deixe a pergunta mais específica ou divida em dois cartões.</p><ul class="cdlist"></ul></section>`),ul=c.querySelector("ul");
  L.forEach(x=>{const it=BYKEY[x.k],li=el(`<li class="cdlrow"><div class="cdlq"></div><div class="cdlm how"></div><div class="btns"><button class="mini" type="button">Editar</button><button class="mini" type="button">Juntar ao lote de melhorias</button></div></li>`);
    li.querySelector(".cdlq").textContent=cdTxt(x.q);li.querySelector(".cdlm").textContent=`esqueceu ${x.f.lapses}× · ${it?it.t:""}`;
    const [e,j]=li.querySelectorAll("button");e.id="cdLE-"+x.id;e.onclick=()=>cdOpen("todos",{pick:x.id});j.id="cdLJ-"+x.id;j.onclick=()=>{x.dr=1;cdPut(x);infoToast("Foi para o lote de melhorias (fora da revisão até o Claude melhorar).","Ver o lote",()=>{cdLotOpen=true;cdOpen("hoje")});render()};
    ul.appendChild(li)});
  if(all>L.length){const m=el(`<button class="link" type="button" id="cdLAll"></button>`);m.textContent=`Ver todos os ${all}`;m.onclick=()=>cdOpen("todos",{leech:true});c.appendChild(m)}
  return c}
/* ---- Todos: busca, filtros, ordem, lista de 50 em 50, editor ao lado (computador) ou em tela própria; Selecionar vários ---- */
let cdLim=0,cdSel=null,cdBulkK=false;
/* lista de 50 em 50 no computador (rola dentro da caixa) e de 20 em 20 numa coluna só (13/11, 11h45: página longa demais) */
const cdPage=()=>twoCols()?50:20;
const CD_ST=[["","Todas"],["novo","Novos"],["aprendendo","Aprendendo"],["revisao","Em revisão"],["suspenso","Suspensos"],["rascunho","Rascunhos"]];
const CD_ORG=[["","Todas"],["erro","Erros"],["questao","Questões"],["trecho","Trechos"],["manual","Manuais"],["claude","Do Claude"]];
const CD_STL={novo:"novo",aprendendo:"aprendendo",revisao:"",suspenso:"suspenso",rascunho:"rascunho"};
function cdEdFor(x){const S=cdSplitA(x);cdEd={id:x.id,q:cdH2T(x.h?x.q:cdTxt2html(x.q)),a:S.a,x:S.x,n:S.n,r:cdH2T(x.ref||""),msg:""}}
function cdRowEl(x){const it=BYKEY[x.k],st=cdState(x),li=el(`<li class="cdrow"><button class="cdrq" type="button"></button><div class="cdrm how"></div></li>`);li.dataset.id=x.id;
  if(cdSel){const c=el(`<input type="checkbox" class="cdsel">`);c.checked=cdSel.has(x.id);c.setAttribute("aria-label","Selecionar");c.onchange=()=>{if(c.checked)cdSel.add(x.id);else cdSel.delete(x.id);render()};li.prepend(c);li.classList.add("sel")}
  const q=li.querySelector(".cdrq");q.textContent=cdTxt(x.q);if(cdPick===x.id)li.classList.add("on");q.onclick=()=>{cdPick=x.id;cdEdFor(x);render();if(!twoCols())window.scrollTo({top:0})};
  li.querySelector(".cdrm").textContent=[it?it.t:"",CD_STL[st]||"",st==="suspenso"||st==="rascunho"?"":!x.f.st?"":`próxima ${x.due<=today()?"hoje":br(x.due)}`,(x.f.lapses||0)>=CD_LEECH?`esqueceu ${x.f.lapses}×`:""].filter(Boolean).join(" · ");return li}
function cdBulkSel(){return cards.filter(x=>cdSel&&cdSel.has(x.id))}
function cdBulkDel(L){if(!L.length)return;toTrash("cards",`${L.length} ${L.length===1?"cartão apagado":"cartões apagados"}`,br(today()),L);const ids=new Set(L.map(x=>x.id));
  cards=cards.filter(x=>!ids.has(x.id));cdSaveLocal();if(cardStore){if(cardStore.delMany)cardStore.delMany([...ids]).catch(()=>{});else ids.forEach(id=>cardStore.doc(id).delete().catch(()=>{}))}}
async function cdBulkAnki(L,b){b.disabled=true;b.textContent="Gerando…";try{const u=await apkgBuild(L);await downloadsFn.save({filename:`nexus-anki-${today()}.apkg`,data:new Blob([u],{type:"application/octet-stream"})});
  cdExp={d:today(),ids:L.map(x=>x.id)};try{localStorage.setItem("resid-cdexp",JSON.stringify(cdExp))}catch(x){}cdSel=null;infoToast("Depois de importar no Anki, confirme em Hoje › Prontos para o Anki: eles saem daqui.","Ir para Hoje",()=>cdOpen("hoje"))}
  catch(x){infoToast(x&&(x.code==="declined"||x.code==="cancelled")?"Download cancelado.":"Não foi possível gerar agora.")}render()}
function cdBulkEl(N){const L=cdBulkSel(),w=el(`<div class="cdbulk" id="cdBulk" role="toolbar" aria-label="Ações nos selecionados"><b></b><div class="btns"></div></div>`),B=w.querySelector(".btns");
  w.querySelector("b").textContent=`${L.length} ${L.length===1?"selecionado":"selecionados"}`;
  const btn=(id,t,fn,cls)=>{const b=el(`<button type="button"></button>`);b.className=cls||"mini";b.id=id;b.textContent=t;b.disabled=!L.length&&id!=="cdSelAll"&&id!=="cdSelOff";b.onclick=()=>fn(b);B.appendChild(b);return b};
  if(N>L.length)btn("cdSelAll",`Selecionar todos os ${N}`,()=>{cdFilter(cards,cdF).forEach(x=>cdSel.add(x.id));render()});
  btn("cdbK","Trocar de tema",()=>{cdBulkK=!cdBulkK;render();setTimeout(()=>{const x=$("#cdbKT");if(x)x.focus()},40)});
  btn("cdbSu","Suspender",()=>{L.forEach(x=>{x.su=1});cdPutMany(L);render()});btn("cdbRe","Reativar",()=>{const R=L.filter(x=>x.su);R.forEach(x=>{delete x.su});cdPutMany(R);render()});
  btn("cdbDel","Apagar",()=>{cdBulkDel(L);cdSel=new Set();render()});
  const ak=btn("cdbAnki","Exportar para o Anki",b=>cdBulkAnki(L.filter(x=>!x.dr&&!x.su),b));if(!downloadsFn)ak.disabled=true;
  btn("cdSelOff","Cancelar",()=>{cdSel=null;cdBulkK=false;render()},"link");
  if(cdBulkK&&L.length)w.appendChild(cdTopicPick("cdbKT",key=>{L.forEach(x=>{x.k=key});cdPutMany(L);cdBulkK=false;infoToast(`${L.length} ${L.length===1?"cartão mudou":"cartões mudaram"} de tema.`);render()},"Novo tema dos selecionados"));
  return w}
function cdAllEl(){const live=cards.filter(x=>BYKEY[x.k]),c=el(`<section class="card cdall" id="cdAll" aria-labelledby="cdAh"><div class="dhead"><h2 id="cdAh">Todos os cartões</h2><span class="todaydate"></span></div></section>`);
  c.querySelector(".todaydate").textContent=`${live.length} ${live.length===1?"cartão":"cartões"}`;c.querySelector(".dhead").appendChild(helpBtn("Cartões"));
  const x0=cdPick&&cards.find(x=>x.id===cdPick);if(cdPick&&!x0)cdPick=null;if(x0&&(!cdEd||cdEd.id!==x0.id))cdEdFor(x0);
  const edEl=()=>{if(!x0)return el(`<p class="how cdsidehint">Toque num cartão para ver e editar.</p>`);const e=cdEditEl(),xb=e.querySelector("#cdeX");if(xb)xb.onclick=()=>{cdEd=null;cdPick=null;render()};return e};
  /* celular e tablet em pé: o cartão aberto ocupa a tela */
  if(x0&&!twoCols()){const bk=el(`<button class="link cdback" type="button" id="cdBackList">‹ Voltar à lista</button>`);bk.onclick=()=>{cdPick=null;cdEd=null;render()};c.append(bk,edEl());return c}
  const top=el(`<div class="btns cdallb"><button class="btn" type="button" id="cdNew2">+ Novo cartão</button><button class="btn" type="button" id="cdSelOn"></button></div>`);
  top.querySelector("#cdNew2").onclick=()=>{cdNewOpen=!cdNewOpen;render()};const so=top.querySelector("#cdSelOn");so.textContent=cdSel?"Sair da seleção":"Selecionar";so.setAttribute("aria-pressed",!!cdSel);so.onclick=()=>{cdSel=cdSel?null:new Set();cdBulkK=false;render()};c.appendChild(top);
  if(cdNewOpen)c.appendChild(cdNewEl());
  const ctl=el(`<div class="cdctl"><label class="ffield cdqf"><span class="glabel">Buscar</span><input class="etext" id="cdQ" type="search" placeholder="Pergunta ou resposta" autocomplete="off"></label><div class="qfrow cdfrow"></div><div class="chips cdfch"></div></div>`),R=ctl.querySelector(".cdfrow");
  R.appendChild(fcSel("cdfArea","Área",[["","Todas"],...[...AREAS,FAC_AREA].map(a=>[a.code,a===FAC_AREA?"Faculdade":a.name])],cdF.area||"",v=>{cdF.area=v;cdF.k="";cdLim=0}));
  R.appendChild(fcSel("cdfSt","Situação",CD_ST,cdF.st||"",v=>{cdF.st=v;cdLim=0}));R.appendChild(fcSel("cdfOrg","Origem",CD_ORG,cdF.org||"",v=>{cdF.org=v;cdLim=0}));
  R.appendChild(fcSel("cdfSort","Ordem",[["due","Próxima revisão"],["lapses","Mais esquecidos"],["new","Mais recentes"]],cdF.sort||"due",v=>{cdF.sort=v;lsSet("resid-cdsort",v)}));
  const CH=ctl.querySelector(".cdfch");if(cdF.k&&BYKEY[cdF.k])CH.appendChild(fcChip(`Tema: ${BYKEY[cdF.k].t} ×`,true,()=>{cdF.k="";cdLim=0},"cdfK"));
  CH.appendChild(fcChip("Mais esquecidos",!!cdF.leech,()=>{cdF.leech=!cdF.leech;cdLim=0},"cdfLeech"));c.appendChild(ctl);
  const g=el(`<div class="cdallg"><div class="cdcol"><div class="cdlistw"></div></div></div>`),W=g.querySelector(".cdlistw");
  const paint=()=>{W.innerHTML="";const L=cdFilter(cards,cdF);if(cdSel)W.appendChild(cdBulkEl(L.length));
    if(!L.length){W.appendChild(el(`<p class="cempty" id="cdEmpty">${live.length?"Nenhum cartão com esses filtros.":"Nenhum cartão ainda. Toque em + Novo cartão."}</p>`));return}
    const ul=el(`<ul class="cdlist2" id="cdList"></ul>`);const lim=cdLim||cdPage();L.slice(0,lim).forEach(x=>ul.appendChild(cdRowEl(x)));W.appendChild(ul);
    if(L.length>lim){const m=el(`<button class="btn" type="button" id="cdMore"></button>`);m.textContent=`Mostrar mais ${Math.min(cdPage(),L.length-lim)} (de ${L.length})`;m.onclick=()=>{cdLim=lim+cdPage();paint()};W.appendChild(m)}
    else if(L.length>8)W.appendChild(el(`<p class="how">${L.length} ${L.length===1?"cartão":"cartões"}.</p>`))};
  const q=ctl.querySelector("#cdQ");q.value=cdF.q||"";q.oninput=()=>{cdF.q=q.value;cdLim=0;paint()};paint();
  if(twoCols()){const sd=el(`<aside class="cdside" id="cdSide" aria-label="Cartão aberto"></aside>`);sd.appendChild(edEl());g.appendChild(sd);g.classList.add("two")}
  c.appendChild(g);return c}
/* ---- Números: quanto lembra, por dia, previsão, situação, por área, os mais esquecidos, calendário ---- */
let cdPer=(()=>{const v=+lsGet("resid-cdper","30");return [7,30,90,0].includes(v)?v:30})();
const cdBr4=d=>d?d.split("-").reverse().join("/"):"";
const cdPct=(p,n)=>n?Math.round(p/n*100)+"%":"—";
function cdNumEl(){const w=el(`<div class="cdnum" id="cdNum"></div>`),t=dnum(today()),L=cards.filter(x=>BYKEY[x.k]),A=cdStats(L,0,t),a=cdPer?t-cdPer+1:(A.first?dnum(A.first):t),S=cdStats(L,a,t);
  const head=el(`<div class="cdnhead"><span class="glabel">Período</span></div>`);head.appendChild(fcPer("cdP",cdPer||"all",v=>{cdPer=v==="all"?0:+v;lsSet("resid-cdper",String(cdPer))},[["7","7 dias"],["30","30 dias"],["90","90 dias"],["all","Tudo"]]));w.appendChild(head);
  if(S.n<20){const f=el(`<p class="pnote" id="cdnFew"></p>`);f.textContent=`Poucas revisões registradas ainda (o histórico começou em ${cdBr4(A.first||today())}).`;w.appendChild(f)}
  const G=el(`<div class="cdnumg"></div>`);w.appendChild(G);
  /* 1. quanto lembra */
  {const c=stCard(1,"Quanto você lembra","cdnRet"),lv=n=>!S.n?"na":n>=CD_GOAL?"ok":n>=CD_GOAL-.1?"warn":"bad";
    stLead(c,`Meta do método: <b>${Math.round(CD_GOAL*100)}%</b>. Conta como lembrou Difícil, Bom ou Fácil em cartões que já estavam em revisão.`);
    const tl=el(`<div class="stvs"></div>`);tl.appendChild(stTile("No período",lv(S.n?S.pass/S.n:0),cdPct(S.pass,S.n),`${S.n} ${S.n===1?"revisão":"revisões"}`));
    tl.appendChild(stTile("Jovens",lv(S.young.n?S.young.pass/S.young.n:0),cdPct(S.young.pass,S.young.n),`intervalo < ${CD_MAT} dias · ${S.young.n}`));
    tl.appendChild(stTile("Maduros",lv(S.mat.n?S.mat.pass/S.mat.n:0),cdPct(S.mat.pass,S.mat.n),`${CD_MAT} dias ou mais · ${S.mat.n}`));c.appendChild(tl);G.appendChild(c)}
  /* 2. revisões por dia (até 30 dias; acima disso, por semana) */
  {const c=stCard(2,"Revisões por dia","cdnDay"),n=t-a+1,wk=n>31,V=[];
    if(!wk)for(let d=a;d<=t;d++){const ds=fromNum(d),v=S.byDay[ds]||0,i=d-a;V.push({v,lab:(n<=7||i%5===0||d===t)?(d===t?"hoje":String(+ds.slice(8))):"",tip:`${cdBr4(ds)}: ${v}`})}
    else{for(let s0=Math.max(a,t-52*7+1);s0<=t;s0+=7){let v=0;for(let d=s0;d<=Math.min(t,s0+6);d++)v+=S.byDay[fromNum(d)]||0;V.push({v,lab:"",tip:`semana de ${cdBr4(fromNum(s0))}: ${v}`})}if(V.length)V[V.length-1].lab="esta"}
    stLead(c,wk?"Por semana, no período.":"Cada barra é um dia.");c.appendChild(stBars(V,{aria:"Revisões de cartões por "+(wk?"semana":"dia")}));G.appendChild(c)}
  /* 3. previsão de 30 dias */
  {const c=stCard(3,"Previsão de 30 dias","cdnFc"),V=[],T=today();for(let i=0;i<30;i++){const d=fromNum(t+i),v=cards.filter(x=>cdLive(x)&&x.f.st&&(i?x.due===d:x.due<=T)).length;V.push({v,lab:i===0?"hoje":i%5===0?String(+d.slice(8)):"",tip:`${cdBr4(d)}: ${v}`})}
    stLead(c,"Cartões que vencem em cada dia (hoje inclui os atrasados).");c.appendChild(stBars(V,{aria:"Previsão de revisões"}));G.appendChild(c)}
  /* 4. situação */
  {const c=stCard(4,"Situação dos cartões","cdnMix"),M=cdMix(L);stLead(c,`Maduro = ${CD_MAT} dias ou mais até a próxima revisão.`);
    c.appendChild(stKpis([["Novos",M.novo,""],["Aprendendo",M.aprendendo,""],["Jovens",M.jovem,""],["Maduros",M.maduro,""],["Suspensos",M.suspenso,""]]));G.appendChild(c)}
  /* 5. por área */
  {const c=stCard(5,"Por área","cdnArea"),by={};L.filter(x=>!x.dr).forEach(x=>{const ar=BYKEY[x.k].area,code=ar?ar.code:"?";const o=by[code]||(by[code]={name:ar===FAC_AREA?"Faculdade":ar?ar.name:"Outros",n:0,L:[]});o.n++;o.L.push(x)});
    const R=Object.values(by).sort((p,q)=>q.n-p.n);stLead(c,"Número de cartões e quanto você lembra (com 10 revisões ou mais na área, no período).");
    if(!R.length)c.appendChild(el(`<p class="how">Nenhum cartão ainda.</p>`));R.forEach(o=>{const s=cdStats(o.L,a,t);c.appendChild(stRow(o.name,`${o.n} ${o.n===1?"cartão":"cartões"}${s.n>=10?` · lembra ${cdPct(s.pass,s.n)}`:""}`))});G.appendChild(c)}
  /* 6. os mais esquecidos */
  {const c=stCard(6,"Os mais esquecidos","cdnLeech"),X=cdLeeches(10);stLead(c,`Esqueceu ${CD_LEECH} vezes ou mais.`);if(!X.length)c.appendChild(el(`<p class="how">Nenhum por enquanto.</p>`));
    const ul=el(`<ul class="cdlist"></ul>`);X.forEach(x=>{const li=el(`<li class="cdlrow"><div class="cdlq"></div><div class="cdlm how"></div><button class="mini" type="button">Editar</button></li>`);li.querySelector(".cdlq").textContent=cdTxt(x.q);li.querySelector(".cdlm").textContent=`esqueceu ${x.f.lapses}× · ${BYKEY[x.k].t}`;const b=li.querySelector("button");b.id="cdnE-"+x.id;b.onclick=()=>cdOpen("todos",{pick:x.id});ul.appendChild(li)});c.appendChild(ul);G.appendChild(c)}
  /* 7. calendário: 26 semanas, segunda a domingo */
  {const c=stCard(7,"Calendário","cdnCal"),B=cdStats(L,t-200,t).byDay,wd=(new Date(today()+"T12:00").getDay()+6)%7,s0=t-wd-26*7,g=el(`<div class="cdcal" role="img"></div>`);let tot=0;
    for(let d=s0;d<=t;d++){const ds=fromNum(d),v=B[ds]||0;tot+=v;const q=el(`<i class="cdcd"></i>`);q.classList.add("l"+(v?v<=10?1:v<=25?2:v<=50?3:4:0));q.title=`${cdBr4(ds)}: ${v} ${v===1?"revisão":"revisões"}`;g.appendChild(q)}
    g.setAttribute("aria-label",`Revisões de cartões nas últimas 27 semanas: ${tot}`);const st=cdStreak(B,today()),sp=el(`<p class="cdstreak" id="cdnStreak"></p>`);sp.textContent=st?`${st} ${st===1?"dia seguido":"dias seguidos"} com revisão`:"Nenhuma revisão hoje nem ontem.";
    stLead(c,"Cada quadrado é um dia; mais escuro, mais revisões.");c.append(sp,g);G.appendChild(c)}
  return w}
/* ---- Criar: um cartão, colar vários, com o Claude; aviso de repetido (cdDupOf) ---- */
let cdNS={mode:"um",k:"",q:"",a:"",paste:"",prev:null,dup:"",ks:[],tq:"",msg:""};
const cdPool=()=>[...ALL,...FAC_ITEMS];
function cdNsK(){if(cdNS.kOff)return "";if(cdNS.k&&BYKEY[cdNS.k])return cdNS.k;const f=cdF.k&&BYKEY[cdF.k]?cdF.k:"",l=lsGet("resid-cdlastk","");return f||(l&&BYKEY[l]?l:"")}
/* busca de tema: atualiza só a lista (não redesenha a tela, para não perder o foco) */
function cdTopicPick(id,onPick,ph){const w=el(`<div class="cdtpick"><input class="etext" type="search" autocomplete="off"><ul class="qrres"></ul></div>`),i=w.querySelector("input"),ul=w.querySelector("ul");
  i.id=id;i.placeholder=ph||"Buscar tema (ex.: sepse, IAM)";i.setAttribute("aria-label","Buscar tema");
  const fill=()=>{ul.innerHTML="";const n=norm(i.value.trim());if(n.length<2)return;
    cdPool().map(x=>{const t=norm(x.t),sub=norm((x.sp||"")+" "+(x.own?"faculdade":""));return {x,sc:t.startsWith(n)?3:t.includes(n)?2:sub.includes(n)?1:0}}).filter(r=>r.sc).sort((a,b)=>b.sc-a.sc||(a.x.num||0)-(b.x.num||0)).slice(0,6)
      .forEach(({x},j)=>{const li=el(`<li><button type="button" class="qrpick"><b></b><span></span></button></li>`),b=li.querySelector("button");b.id=id+"-"+j;b.querySelector("b").textContent=x.t;b.querySelector("span").textContent=x.own?"Faculdade":`${x.area.code} · ${x.sp||x.area.name}`;b.onclick=()=>onPick(x.key);ul.appendChild(li)});
    if(!ul.children.length)ul.appendChild(el(`<li class="how">Nenhum tema com esse nome.</li>`))};
  i.oninput=fill;return w}
function cdNsTopicEl(){const k=cdNsK(),w=el(`<div class="cdnk"><span class="glabel">Tema</span></div>`);
  if(k){const r=el(`<div class="cdnkcur"><b></b><button class="link" type="button" id="cdnKx">Trocar</button></div>`);r.querySelector("b").textContent=BYKEY[k].t;r.querySelector("button").onclick=()=>{cdNS.kOff=true;render();setTimeout(()=>{const x=$("#cdnT");if(x)x.focus()},40)};w.appendChild(r)}
  else w.appendChild(cdTopicPick("cdnT",key=>{cdNS.k=key;cdNS.kOff=false;lsSet("resid-cdlastk",key);cdNS.dup="";render();setTimeout(()=>{const x=$("#cdnQ")||$("#cdnPaste");if(x)x.focus()},40)}));
  return w}
function cdNsSave(more,force){const k=cdNsK(),q=cdNS.q.trim(),a=cdNS.a.trim();
  if(!k){cdNS.msg="Escolha o tema.";render();return}if(!q||!a){cdNS.msg="Escreva a pergunta e a resposta.";render();return}
  const d=!force&&cdDupOf(k,cdT2H(q));if(d){cdNS.dup=d.id;cdNS.msg="";render();return}
  cdAdd(k,cdT2H(q),cdT2H(a),"eu",{h:1,kind:"man"});lsSet("resid-cdlastk",k);cdNS={...cdNS,k,q:"",a:"",dup:"",msg:""};
  if(!more)cdNewOpen=false;infoToast("Cartão criado. Ele entra na revisão como novo.");render();if(more)setTimeout(()=>{const x=$("#cdnQ");if(x)x.focus()},40)}
function cdNsPrev(){const k=cdNsK(),P=cdParsePaste(cdNS.paste);cdNS.prev={k,bad:P.bad,list:P.ok.map(o=>{const d=k&&cdDupOf(k,cdT2H(o.q));return {...o,dup:d?d.id:"",keep:!d}})};render()}
function cdNsMany(){const R=cdNS.prev,k=cdNsK();if(!R||!k)return;const L=R.list.filter(o=>o.keep);L.forEach(o=>cdAdd(k,cdT2H(o.q),cdT2H(o.a),"eu",{h:1,kind:"man"}));lsSet("resid-cdlastk",k);
  cdNS={...cdNS,paste:"",prev:null};cdNewOpen=false;infoToast(`${L.length} ${L.length===1?"cartão criado":"cartões criados"}. Entram na revisão como novos.`);render()}
function cdNewEl(){const S=cdNS,w=el(`<div class="cdnew" id="cdNewBox"><div class="dhead"><b>Novo cartão</b><button class="link" type="button" id="cdnX">Fechar</button></div><div class="tseg cdnmodes" role="group" aria-label="Como criar"></div></div>`);
  w.querySelector("#cdnX").onclick=()=>{cdNewOpen=false;render()};const M=w.querySelector(".cdnmodes");
  [["um","Um cartão"],["varios","Colar vários"],...(sampleOff?[]:[["claude","Com o Claude"]])].forEach(([m,l])=>{const b=el(`<button type="button"></button>`);b.id="cdnM-"+m;b.textContent=l;b.setAttribute("aria-pressed",S.mode===m);b.onclick=()=>{S.mode=m;S.msg="";render()};M.appendChild(b)});
  if(S.mode==="claude"){w.appendChild(el(`<p class="how">Escolha até 5 temas. Para cada um, o Claude cria cartões a partir da sua anotação (o tema precisa ter anotação).</p>`));
    const ch=el(`<div class="chips cdnks"></div>`);S.ks.filter(k=>BYKEY[k]).forEach(k=>{const c=el(`<button class="chip" type="button" aria-pressed="true"></button>`);c.textContent=BYKEY[k].t+" ×";c.title="Tirar";c.onclick=()=>{S.ks=S.ks.filter(x=>x!==k);render()};ch.appendChild(c)});if(S.ks.length)w.appendChild(ch);
    if(S.ks.length<5)w.appendChild(cdTopicPick("cdnC",key=>{if(!S.ks.includes(key))S.ks.push(key);render()},"Buscar tema para criar com o Claude"));
    S.ks.filter(k=>BYKEY[k]).forEach(k=>{const b=el(`<div class="cdnblk"><b class="cdnbt"></b></div>`);b.dataset.k=k;b.querySelector("b").textContent=BYKEY[k].t;b.appendChild(cardsBlock(BYKEY[k]));w.appendChild(b)});return w}
  w.appendChild(cdNsTopicEl());
  if(S.mode==="um"){const f=el(`<div class="cdnf"><label class="cdef"><span>Pergunta</span><textarea id="cdnQ" rows="3" maxlength="1500" placeholder="Ex.: **Leucoplasia pilosa** — qual o agente?"></textarea></label><label class="cdef"><span>Resposta</span><textarea id="cdnA" rows="3" maxlength="3000"></textarea></label><p class="how">Use **negrito** e *itálico*.</p></div>`);
    const [q,a]=f.querySelectorAll("textarea");q.value=S.q;a.value=S.a;q.oninput=()=>{S.q=q.value;if(S.dup){S.dup="";const d=$("#cdnDup");if(d)d.remove()}};a.oninput=()=>{S.a=a.value};w.appendChild(f);
    if(S.dup){const x=cards.find(c=>c.id===S.dup);if(x){const d=el(`<div class="pnote cdndup" id="cdnDup" role="status"><span></span><div class="btns"><button class="btn" type="button" id="cdnDupGo">Criar mesmo assim</button><button class="link" type="button" id="cdnDupSee">Ver o outro</button></div></div>`);
      d.querySelector("span").textContent=`Parecido com: ${cdTxt(x.q).slice(0,140)}`;d.querySelector("#cdnDupGo").onclick=()=>cdNsSave(false,true);d.querySelector("#cdnDupSee").onclick=()=>{cdNewOpen=false;cdOpen("todos",{pick:x.id})};w.appendChild(d)}}
    const B=el(`<div class="btns"><button class="btn primary" type="button" id="cdnMore">Salvar e criar outro</button><button class="btn" type="button" id="cdnSave">Salvar</button></div>`);B.querySelector("#cdnMore").onclick=()=>cdNsSave(true);B.querySelector("#cdnSave").onclick=()=>cdNsSave(false);w.appendChild(B)}
  else{const f=el(`<label class="cdef"><span>Um cartão por linha: pergunta :: resposta (ou separados por tabulação)</span><textarea id="cdnPaste" rows="6" placeholder="Agente da leucoplasia pilosa :: Vírus Epstein-Barr&#10;Tratamento da sífilis latente tardia :: Penicilina benzatina 3 doses"></textarea></label>`),t=f.querySelector("textarea");t.value=S.paste;t.oninput=()=>{S.paste=t.value;if(S.prev){S.prev=null;const p=$("#cdnPrev");if(p)p.remove();const m=$("#cdnMany");if(m)m.remove()}};w.appendChild(f);
    const rd=el(`<div class="btns"><button class="btn" type="button" id="cdnRead">Ver prévia</button></div>`);rd.querySelector("button").onclick=cdNsPrev;w.appendChild(rd);
    const R=S.prev;if(R){const p=el(`<div class="cdnprev" id="cdnPrev"><ul class="cdrev"></ul></div>`),ul=p.querySelector("ul");
      R.list.forEach((o,i)=>{const li=el(`<li><label><input type="checkbox" class="cdnchk"><span><b></b><span></span></span></label></li>`),c=li.querySelector("input");c.id="cdnP-"+i;c.checked=o.keep;c.onchange=()=>{o.keep=c.checked;const m=$("#cdnMany");if(m){const n=R.list.filter(z=>z.keep).length;m.textContent=`Criar ${n} ${n===1?"cartão":"cartões"}`;m.disabled=!n||!cdNsK()}};
        li.querySelector("b").textContent=o.q;li.querySelector("label>span>span").textContent=o.a;if(o.dup){const x=cards.find(c=>c.id===o.dup);const d=el(`<p class="how cdndupl"></p>`);d.textContent=`Parecido com: ${x?cdTxt(x.q).slice(0,100):""}`;li.appendChild(d)}ul.appendChild(li)});
      if(!R.list.length)p.appendChild(el(`<p class="how">Nenhuma linha com pergunta e resposta.</p>`));
      if(R.bad.length){const b=el(`<p class="how cdnbad" id="cdnBad"></p>`);b.textContent=`${R.bad.length===1?"Linha":"Linhas"} sem "::" ou tabulação (não entram): ${R.bad.join(", ")}.`;p.appendChild(b)}
      const n=R.list.filter(o=>o.keep).length,mb=el(`<button class="btn primary" type="button" id="cdnMany"></button>`);mb.textContent=`Criar ${n} ${n===1?"cartão":"cartões"}`;mb.disabled=!n||!cdNsK();mb.onclick=cdNsMany;p.appendChild(mb);w.appendChild(p)}}
  if(S.msg){const m=el(`<p class="err"></p>`);m.textContent=S.msg;w.appendChild(m)}return w}
