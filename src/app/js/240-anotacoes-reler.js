/* ---------- Anotações: reler hoje, pegadinhas, cartões e cobertura ---------- */
let nSeg="livre";try{const v=localStorage.getItem("resid-nseg2");if(["livre","revisar","pegadinhas"].includes(v))nSeg=v}catch(e){}
/* Lote 13: caderno único — "Temas" e "Livre" viraram a parte "Caderno" (nSeg "livre"); "todas" continua aceito como apelido */
function setNSeg(v){if(v==="todas")v="livre";nSeg=v;try{localStorage.setItem("resid-nseg2",v)}catch(e){}render();window.scrollTo({top:0})}
let nNoNote=false,nPegAll=false,nTodayOpen=new Set();
/* temas do dia: plano + revisões pendentes */
function notesTodayKeys(){const P=ensurePlan(),out=[],seen=new Set(),add=(k,why)=>{if(!seen.has(k)&&BYKEY[k]){seen.add(k);out.push({k,why})}};
  [...ALL,...FAC_ITEMS].filter(i=>isDue(get(i.key))).sort((a,b)=>dueIn(get(a.key))-dueIn(get(b.key))).forEach(i=>add(i.key,"Revisão de hoje"));
  P.items.forEach(p=>add(p.k,"Plano de hoje"));return out}
/* reler = parte da revisão do tema (Lote 17): a página principal do tema dentro do cartão da revisão (e do "Continuar"), recolhida;
   "Ver todas as anotações do tema" abre a aba Anotações do tema (página principal + páginas ligadas do caderno) */
let rrOpen=new Set();
function rereadEl(k){const t=(notes[k]||"").trim(),it=BYKEY[k],w=el(`<div class="reread"></div>`),open=rrOpen.has(k);
  if(!t){const p=el(`<p class="how">Sem anotação neste tema. <button class="link" type="button">Escrever</button></p>`);p.querySelector("button").onclick=()=>{detTab[k]="notas";noteMode[k]="editar";openTopic(k)};w.appendChild(p);return w}
  const h=el(`<button class="rrhead" type="button" aria-expanded="${open}"><span class="glabel">Reler a anotação</span><span class="rrw"></span><span class="pchev" aria-hidden="true"></span></button>`);
  h.querySelector(".rrw").textContent=`${wordCount(t)} palavras`;h.onclick=()=>{open?rrOpen.delete(k):rrOpen.add(k);render()};
  {const pg=pegOf(k).filter(o=>o.kind==="peg").sort((a,b)=>(pgMiss()[pgId(b.x)]||0)-(pgMiss()[pgId(a.x)]||0)).slice(0,3);if(pg.length){const d=el(`<div class="rrpeg"><span class="glabel">Pegadinhas deste tema</span><ul></ul></div>`);
    pg.forEach(o=>{const li=el(`<li></li>`);li.innerHTML=inl(o.x)+(o.why?` <span class="pgwhy">— ${inl(o.why)}</span>`:"");d.querySelector("ul").appendChild(li)});w.appendChild(d)}}
  w.appendChild(h);
  if(open){const v=el(`<div class="mdview"></div>`);v.innerHTML=md(notes[k],{fold:k});w.appendChild(v)}
  const n=(typeof freeN!=="undefined"?freeN:[]).filter(f=>(f.ks||[]).includes(k)).length,a=el(`<button class="link rrall" type="button"></button>`);
  a.textContent=n?`Ver todas as anotações do tema (+${n} ${n===1?"página ligada":"páginas ligadas"})`:"Ver todas as anotações do tema";a.onclick=()=>{detTab[k]="notas";openTopic(k)};w.appendChild(a);return w}
function nTodayCard(){const L=notesTodayKeys(),withN=L.filter(x=>(notes[x.k]||"").trim()),without=L.filter(x=>!(notes[x.k]||"").trim()),T=today(),read=withN.filter(x=>get(x.k).nread===T).length;
  const c=el(`<section class="card ntoday" aria-labelledby="nth"><div class="dhead"><h2 id="nth">Para reler hoje</h2><span class="todaydate"></span></div></section>`);
  c.querySelector(".todaydate").textContent=withN.length?`${read} de ${withN.length} relidas`:"";
  if(!L.length){c.appendChild(el(`<p class="cempty">Nenhum tema no plano ou em revisão hoje.</p>`));return c}
  if(!withN.length)c.appendChild(el(`<p class="cempty">Nenhum dos temas de hoje tem anotação ainda. Escrever um resumo curto depois de estudar ajuda nas revisões.</p>`));
  const ol=el(`<ol class="elist"></ol>`);withN.forEach(({k,why})=>{const it=BYKEY[k],done=get(k).nread===T,open=nTodayOpen.has(k);
    const li=el(`<li class="ncard${done?" nread":""}"><div class="ehead"><button class="etopic" type="button"></button><span class="nloc"></span></div><div class="mdview${open?"":" clamp"}"></div><div class="efoot"><button class="mini" type="button"></button><span class="sp"></span><button class="mini nreadb" type="button"></button></div></li>`);
    const tb=li.querySelector(".etopic");tb.textContent=it.t;tb.onclick=()=>openTopic(k);li.querySelector(".nloc").textContent=`${why} · ${it.area.code}${it.sp?" · "+it.sp:""}`;
    li.querySelector(".mdview").innerHTML=open?md(notes[k],{fold:k}):mdC(notes[k]);{const ne=noteErrsEl(k);if(ne)li.querySelector(".mdview").after(ne)}const [tg,rb]=li.querySelectorAll(".efoot .mini");tg.textContent=open?"Recolher":"Ver tudo";tg.onclick=()=>{open?nTodayOpen.delete(k):nTodayOpen.add(k);render()};
    rb.textContent=done?"✓ Reli":"Reli";rb.setAttribute("aria-pressed",done);rb.onclick=()=>{upd(k,s=>{if(s.nread===T)delete s.nread;else s.nread=T});if(!done)nTodayOpen.delete(k);commit()};ol.appendChild(li)});
  c.appendChild(ol);
  if(without.length){const p=el(`<p class="how nwithout">Sem anotação: </p>`);without.forEach(({k},i)=>{const b=el(`<button class="link" type="button"></button>`);b.textContent=BYKEY[k].t;b.onclick=()=>{detTab[k]="notas";openTopic(k)};if(i)p.append(" · ");p.appendChild(b)});c.appendChild(p)}
  return c}
/* pegadinhas e destaques (Lote 20C): linhas com "> ", "> Pegadinha: … — Por quê: …", itens "**Pegadinha:** …", textos ==destacados== e itens das seções
   Pegadinhas/Alertas/Cuidado; vale para a página do tema e para as páginas livres. Cada item guarda a seção de onde veio. */
function pegParse(txt){const t=String(txt||"").replace(/\r/g,""),out=[];let inPeg=false,sec="",fen=false;
  const one=(raw,kind)=>{let x=raw.trim(),why="";const m=x.match(/^\*\*Pegadinha:?\*\*:?\s*(.*)$/i)||x.match(/^Pegadinha\s*:\s*(.*)$/i);if(m){x=m[1].trim();kind="peg"}const w=x.split(/\s+[—–-]\s+(?:\*\*)?Por qu[eê]:?(?:\*\*)?:?\s*/i);if(w.length>1){x=w[0].trim();why=w.slice(1).join(" ").trim()}if(x)out.push({x,why,kind,sec})};
  t.split("\n").forEach(l=>{if(/^\s*```/.test(l)){fen=!fen;return}if(fen)return;const h=l.match(/^#{1,3}\s+(.*)/);if(h){sec=h[1].replace(/\*\*|==/g,"").trim();inPeg=/pegadinha|alerta|armadilha|cuidado/i.test(h[1]);return}
    if(/^\s*>/.test(l)){one(l.replace(/^\s*>\s?/,""),"peg");return}
    const li=l.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)/);if(li&&/^\*\*Pegadinha:?\*\*/i.test(li[1])){one(li[1],"peg");return}
    if(inPeg&&li){one(li[1],"peg");return}
    (l.match(/==([^=]+)==/g)||[]).forEach(m=>out.push({x:m.slice(2,-2).trim(),why:"",kind:"dest",sec}))});
  const seen=new Set();return out.filter(o=>o.x&&!seen.has(o.x)&&seen.add(o.x))}
const pegOf=k=>pegParse(notes[k]);
const pgId=x=>{let h=0;for(const ch of norm(x))h=(h*31+ch.charCodeAt(0))|0;return "p"+(h>>>0).toString(36)};
let pgF=(()=>{try{const v=JSON.parse(localStorage.getItem("resid-pgf")||"{}");return {t:["peg","dest"].includes(v.t)?v.t:"all",today:!!v.today,prova:!!v.prova,miss:!!v.miss}}catch(e){return {t:"all",today:false,prova:false,miss:false}}})();
let pgRun=null,pgOpen=new Set();
const pgSave=()=>lsSet("resid-pgf",JSON.stringify(pgF));
const pgMiss=()=>{const m=ui.prefs.pgm;return m&&typeof m==="object"?m:{}};
function pgMark(id,ok){const m={...pgMiss()};if(ok){if(m[id])m[id]=Math.max(0,m[id]-1);if(!m[id])delete m[id]}else m[id]=(m[id]||0)+1;
  const ks=Object.keys(m);if(ks.length>400)ks.slice(0,ks.length-400).forEach(x=>delete m[x]);ui.prefs.pgm=m;saveUI()}
function pgProvaKeys(){const up=upcomingProvas().find(p=>daysTo(p.date)<=21);return up?{lab:up.name,d:daysTo(up.date),keys:new Set(topicKeysOf(up.items))}:null}
/* todos os itens (temas + páginas livres), cada um com a origem */
function pgAll(vis){const L=[];vis.forEach(k=>pegOf(k).forEach(o=>L.push({...o,k,id:pgId(o.x)})));
  (typeof freeN!=="undefined"?freeN:[]).forEach(f=>pegParse(f.b).forEach(o=>L.push({...o,f:f.id,k:(f.ks||[]).find(x=>BYKEY[x])||null,id:pgId(o.x)})));return L}
/* abrir no ponto exato: abre a anotação e rola até a linha (pisca) */
function pgGo(o){const find=root=>{if(!root)return null;const key=norm(o.x).slice(0,40);return [...root.querySelectorAll(".mdview blockquote, .mdview .callout, .mdview li, .mdview p, .mdview mark, .mdview td")].reverse().find(e=>norm(e.textContent).includes(key))};
  const flash=x=>{if(!x)return;x.scrollIntoView({behavior:"smooth",block:"center"});x.classList.add("pflash");setTimeout(()=>x.classList.remove("pflash"),1800)};
  if(o.f){const f=freeN.find(x=>x.id===o.f);if(!f)return;nType="all";frQ=frQRaw="";freeTag="all";setNSeg("livre");freeOpen.add(f.id);render();setTimeout(()=>flash(find(document.getElementById("fr-"+f.id))),120);return}
  detTab[o.k]="notas";noteMode[o.k]="ler";openTopic(o.k);setTimeout(()=>flash(find(document.getElementById("t-"+o.k))),160)}
/* folha de véspera: PDF só com as pegadinhas e destaques do recorte */
async function pgSheet(L){if(!downloadsFn||!L.length)return;const by={},fr=[];L.forEach(o=>{const line=o.kind==="peg"?`> ${o.x}${o.why?" — Por quê: "+o.why:""}`:`- ==${o.x}==`;if(o.k&&!o.f)(by[o.k]=by[o.k]||[]).push(line);else fr.push(line)});
  const ks=Object.keys(by),free=fr.length?[{id:"pgfree",t:"Das páginas livres",b:fr.join("\n"),tags:[],ks:[]}]:[];
  const bytes=notesPDF(ks,free,{title:"Folha de véspera",scope:"Pegadinhas e destaques",kicker:"CADERNO  ·  PEGADINHAS",freeTitle:"Páginas livres",textOf:k=>by[k].join("\n")});
  await downloadsFn.save({filename:`pegadinhas-${today()}.pdf`,data:new Blob([bytes],{type:"application/pdf"})})}
/* revisão rápida: uma por vez, Sabia / Não sabia; as "não sabia" sobem para o topo e podem virar cartão */
function pgRunEl(){const R=pgRun,o=R.list[R.i],c=el(`<div class="pgrun"><div class="pgrh"><span class="glabel"></span><button class="link" type="button">Encerrar</button></div><div class="pgq"></div><p class="pgw" hidden></p><div class="btns"></div></div>`);
  c.querySelector(".glabel").textContent=`Revisar pegadinhas · ${R.i+1} de ${R.list.length}`;c.querySelector(".pgrh .link").onclick=()=>{pgRun=null;render()};
  if(!o){c.querySelector(".pgq").textContent=`Fim: ${R.ok} sabia, ${R.no} não sabia.`;const b=el(`<button class="btn" type="button">Fechar</button>`);b.onclick=()=>{pgRun=null;render()};c.querySelector(".btns").appendChild(b);return c}
  const q=c.querySelector(".pgq");q.innerHTML=inl(o.x);const src=el(`<small class="pgsrc"></small>`);src.textContent=(o.k&&BYKEY[o.k]?BYKEY[o.k].t:"Página livre")+(o.sec?" · "+o.sec:"");q.appendChild(src);
  if(o.why&&R.show){const w=c.querySelector(".pgw");w.hidden=false;w.innerHTML="<b>Por quê:</b> "+inl(o.why)}
  const B=c.querySelector(".btns");
  if(o.why&&!R.show){const s=el(`<button class="btn" type="button" id="pgShow">Mostrar o porquê</button>`);s.onclick=()=>{R.show=true;render()};B.appendChild(s)}
  const y=el(`<button class="btn primary" type="button" id="pgYes">Sabia</button>`),n=el(`<button class="btn" type="button" id="pgNo">Não sabia</button>`);
  y.onclick=()=>{pgMark(o.id,true);R.ok++;R.i++;R.show=false;render()};n.onclick=()=>{pgMark(o.id,false);R.no++;R.i++;R.show=false;render()};B.append(n,y);return c}
let pgFull=false,pgFullTo=null,pgTopOpen=new Set();
function nPegCard(vis,o={}){const c=el(`<section class="card npeg${o.side?" npegside":""}${o.full?" npegall":""}" aria-labelledby="${o.full?"nphf":"nph"}"><div class="dhead"><h2 id="${o.full?"nphf":"nph"}">${o.full?"Todas as pegadinhas e destaques":"Pegadinhas e destaques"}</h2><span class="todaydate"></span></div></section>`);
  if(o.full){const x=el(`<button class="link" type="button" id="pgFullX">Fechar</button>`);x.onclick=()=>{pgFull=false;render()};c.querySelector(".dhead").appendChild(x)}
  const all=pgAll(vis),miss=pgMiss();
  if(!all.length){c.appendChild(el(`<p class="cempty">Nada marcado ainda. Nas anotações, use a ferramenta <b>Pegadinha</b> (escreve “&gt; Pegadinha: … — Por quê: …”), o <b>Destaque</b> (==texto==) ou uma seção “Pegadinhas de prova”: tudo aparece aqui, reunido por especialidade, para a revisão de véspera. Vale também para as páginas livres.</p>`));return c}
  const tk=new Set(notesTodayKeys().map(x=>x.k)),PV=pgProvaKeys();
  const okT=o=>pgF.t==="all"||o.kind===pgF.t,okD=o=>!pgF.today||o.k&&tk.has(o.k),okP=o=>!pgF.prova||PV&&o.k&&PV.keys.has(o.k),okM=o=>!pgF.miss||miss[o.id];
  const L=all.filter(o=>okT(o)&&okD(o)&&okP(o)&&okM(o)).sort((a,b)=>(miss[b.id]||0)-(miss[a.id]||0));
  c.querySelector(".todaydate").textContent=`${L.length} de ${all.length}`;
  if(o.full){c.appendChild(el(`<p class="how">Filtros, revisão e folha de véspera ficam no cartão ao lado.</p>`));if(!L.length){c.appendChild(el(`<p class="cempty">Nada com esses filtros.</p>`));return c}return pgGroupsEl(c,L,miss,true)}
  /* filtros no padrão: tipo (um) + atalhos (combinam), com contagem */
  const f=el(`<div class="pgfil"></div>`),base=all.filter(o=>okD(o)&&okP(o)&&okM(o)),pk=all.filter(o=>okT(o));
  f.appendChild(fcPer("pgT",pgF.t,v=>{pgF.t=v;pgSave()},[["all",`Tudo · ${base.length}`],["peg",`Pegadinhas · ${base.filter(o=>o.kind==="peg").length}`],["dest",`Destaques · ${base.filter(o=>o.kind==="dest").length}`]],"Tipo"));
  const ch=[fcChip(`Dos temas de hoje · ${pk.filter(o=>o.k&&tk.has(o.k)&&okP(o)&&okM(o)).length}`,pgF.today,()=>{pgF.today=!pgF.today;pgSave()},"pgToday",null,"Temas em revisão hoje e do plano do dia")];
  if(PV)ch.push(fcChip(`Da prova (${PV.lab}) · ${pk.filter(o=>o.k&&PV.keys.has(o.k)&&okD(o)&&okM(o)).length}`,pgF.prova,()=>{pgF.prova=!pgF.prova;pgSave()},"pgProva",null,`Conteúdos da prova da faculdade em ${PV.d} dias`));
  ch.push(fcChip(`Não sabia · ${pk.filter(o=>miss[o.id]&&okD(o)&&okP(o)).length}`,pgF.miss,()=>{pgF.miss=!pgF.miss;pgSave()},"pgMiss",null,"As que você marcou como Não sabia na revisão"));
  f.appendChild(fcChips(ch));c.appendChild(f);
  c.appendChild(el(`<p class="how hx">Tudo o que você marcou como pegadinha ou destaque nas páginas dos temas e nas páginas livres${vis.length<Object.keys(notes).length?" (com os filtros da aba)":""}. Toque num item para abrir a anotação no ponto exato. As que você não sabia sobem para o topo.</p>`));
  {const B=el(`<div class="btns pgacts"></div>`),go=el(`<button class="btn primary" type="button" id="pgGo"></button>`);go.textContent=`Revisar pegadinhas · ${Math.min(L.length,30)}`;go.disabled=!L.length;
    go.onclick=()=>{pgRun={list:L.slice(0,30),i:0,ok:0,no:0,show:false};render()};B.appendChild(go);
    if(downloadsFn){const s=el(`<button class="btn" type="button" id="pgPdf">Folha de véspera (PDF)</button>`);s.disabled=!L.length;s.onclick=async()=>{try{await pgSheet(L);$("#nmsg").textContent=`Folha de véspera salva com ${L.length} itens.`}catch(e){$("#nmsg").textContent="Não foi possível gerar o PDF agora."}};B.appendChild(s)}
    c.appendChild(B)}
  if(pgRun){c.appendChild(pgRunEl());return c}
  if(!L.length){c.appendChild(el(`<p class="cempty">Nada com esses filtros.</p>`));return c}
  if(o.side)return pgSideEl(c,L,miss);
  return pgGroupsEl(c,L,miss,false)}
/* Lote 21: coluna da direita = resumo. Especialidades recolhidas; temas com contagem; tema aberto mostra até 5 itens + "ver mais"; a lista inteira vai para a coluna principal */
const pgTopKey=o=>o.f?"f:"+o.f:o.k;
const pgTopName=o=>o.f?(freeN.find(x=>x.id===o.f)||{}).t||"Página livre":BYKEY[o.k].t;
const pgGroupOf=o=>{const it=o.k&&BYKEY[o.k];return o.f&&!it?"Páginas livres":`${it.area.code} · ${it.sp||it.area.name}`};
function pgItemEl(o,miss){const li=el(`<li class="${o.kind}"><button type="button" class="pgi"><span class="pgx"></span><small class="pgm"></small></button></li>`);li.querySelector(".pgx").innerHTML=(o.kind==="dest"?`<mark>${inl(o.x)}</mark>`:inl(o.x))+(o.why?` <span class="pgwhy">— ${inl(o.why)}</span>`:"");
  li.querySelector(".pgm").textContent=[o.sec,miss[o.id]?`não sabia ${miss[o.id]}×`:""].filter(Boolean).join(" · ");li.querySelector("button").title="Abrir na anotação";li.querySelector("button").onclick=()=>pgGo(o);
  if(miss[o.id]&&o.k&&BYKEY[o.k]){const cb=el(`<button class="mini pgcd" type="button">+ Cartão</button>`);cb.onclick=()=>{trStart(o.k,o.x+(o.why?" — "+o.why:""));detTab[o.k]="notas";openTopic(o.k)};li.appendChild(cb)}return li}
function pgSideEl(c,L,miss){const groups={};L.forEach(o=>{(groups[pgGroupOf(o)]=groups[pgGroupOf(o)]||[]).push(o)});
  const G=Object.keys(groups).sort((a,b)=>a==="Páginas livres"?1:b==="Páginas livres"?-1:groups[b].length-groups[a].length||a.localeCompare(b)),box=el(`<div class="pgside"></div>`);
  G.forEach((g,gi)=>{const d=el(`<details class="pgsec"${pgOpen.has(g)?" open":""}><summary><span class="glabel"></span><span class="pgn"></span></summary></details>`);d.querySelector(".glabel").textContent=g;d.querySelector(".pgn").textContent=groups[g].length;
    d.addEventListener("toggle",()=>{d.open?pgOpen.add(g):pgOpen.delete(g)});const byT={};groups[g].forEach(o=>{(byT[pgTopKey(o)]=byT[pgTopKey(o)]||[]).push(o)});
    Object.entries(byT).sort((a,b)=>b[1].length-a[1].length).forEach(([t,os],ti)=>{const on=pgTopOpen.has(t),w=el(`<div class="pgtrow"><button class="pgtb" type="button"><span class="pgtar" aria-hidden="true"></span><span class="pgtn"></span><span class="pgn"></span></button></div>`),bt=w.querySelector("button");
      bt.id=`pgt-${gi}-${ti}`;bt.setAttribute("aria-expanded",on);w.querySelector(".pgtar").textContent=on?"▾":"▸";w.querySelector(".pgtn").textContent=pgTopName(os[0]);w.querySelector(".pgn").textContent=os.length;bt.onclick=()=>{on?pgTopOpen.delete(t):pgTopOpen.add(t);render()};
      if(on){const ul=el(`<ul class="pglist"></ul>`);os.slice(0,5).forEach(o=>ul.appendChild(pgItemEl(o,miss)));w.appendChild(ul);
        if(os.length>5){const m=el(`<button class="link pgmore" type="button"></button>`);m.textContent=`ver mais ${os.length-5}`;m.onclick=()=>{pgFull=true;pgFullTo=t;pgTopOpen.delete(t);render()};w.appendChild(m)}}
      d.appendChild(w)});box.appendChild(d)});
  c.appendChild(box);const all=el(`<button class="btn pgall" type="button" id="pgAll"></button>`);all.textContent=pgFull?"Fechar a lista inteira":`Ver todas · ${L.length}`;all.onclick=()=>{pgFull=!pgFull;if(pgFull)pgTopOpen.clear();render();if(pgFull)setTimeout(()=>{const x=$("#nPegFull");if(x)x.scrollIntoView({block:"start",behavior:"smooth"})},60)};c.appendChild(all);return c}
function pgGroupsEl(c,L,miss,full){
  /* grupos por especialidade, recolhíveis, com contagem; dentro, por tema */
  const groups={};L.forEach(o=>{const it=o.k&&BYKEY[o.k],g=o.f&&!it?"Páginas livres":`${it.area.code} · ${it.sp||it.area.name}`;(groups[g]=groups[g]||[]).push(o)});
  let shown=0;const lim=nPegAll||full?1e9:40,G=Object.keys(groups).sort((a,b)=>a==="Páginas livres"?1:b==="Páginas livres"?-1:a.localeCompare(b));
  G.forEach((g,gi)=>{if(shown>=lim)return;const open=full?true:pgOpen.size?pgOpen.has(g):gi<3,d=el(`<details class="pgsec"${open?" open":""}><summary><span class="glabel"></span><span class="pgn"></span></summary></details>`);
    d.querySelector(".glabel").textContent=g;d.querySelector(".pgn").textContent=groups[g].length;d.addEventListener("toggle",()=>{if(!pgOpen.size)G.forEach((x,i)=>{if(i<3)pgOpen.add(x)});d.open?pgOpen.add(g):pgOpen.delete(g)});
    const byT={};groups[g].forEach(o=>{const t=o.f?"f:"+o.f:o.k;(byT[t]=byT[t]||[]).push(o)});
    Object.entries(byT).forEach(([t,os])=>{if(shown>=lim)return;const b=el(`<div class="pgtopic"><button class="link" type="button"></button><ul class="pglist"></ul></div>`),o0=os[0];
      b.dataset.pgt=t;b.querySelector(".link").textContent=o0.f?(freeN.find(x=>x.id===o0.f)||{}).t||"Página livre":BYKEY[o0.k].t;b.querySelector(".link").onclick=()=>pgGo({...o0,x:""});
      os.forEach(o=>{if(shown>=lim)return;shown++;const li=el(`<li class="${o.kind}"><button type="button" class="pgi"><span class="pgx"></span><small class="pgm"></small></button></li>`);li.querySelector(".pgx").innerHTML=(o.kind==="dest"?`<mark>${inl(o.x)}</mark>`:inl(o.x))+(o.why?` <span class="pgwhy">— ${inl(o.why)}</span>`:"");
        li.querySelector(".pgm").textContent=[o.sec,miss[o.id]?`não sabia ${miss[o.id]}×`:""].filter(Boolean).join(" · ");li.querySelector("button").title="Abrir na anotação";li.querySelector("button").onclick=()=>pgGo(o);
        if(miss[o.id]&&o.k&&BYKEY[o.k]){const cb=el(`<button class="mini pgcd" type="button">+ Cartão</button>`);cb.onclick=()=>{trStart(o.k,o.x+(o.why?" — "+o.why:""));detTab[o.k]="notas";openTopic(o.k)};li.appendChild(cb)}
        b.querySelector("ul").appendChild(li)});d.appendChild(b)});
    c.appendChild(d)});
  if(L.length>40&&!full){const m=el(`<button class="link" type="button">${nPegAll?"Mostrar menos":`Mostrar todas as ${L.length}`}</button>`);m.onclick=()=>{nPegAll=!nPegAll;render()};c.appendChild(m)}
  return c}
/* erro "Li errado" ou "Confundi" → sugerir pegadinha na anotação do tema (seção Pegadinhas) */
function pegAdd(k,x,why){const cur=notes[k]||"",line=`> Pegadinha: ${x.replace(/\s+/g," ").trim()}${why?" — Por quê: "+why.replace(/\s+/g," ").trim():""}`,m=cur.match(/^(#{1,3})\s*(Pegadinhas?[^\n]*|Alertas?[^\n]*|Cuidado[^\n]*)\s*$/mi);let v;
  if(m){const at=m.index+m[0].length,lv=m[1].length,rest=cur.slice(at),nx=rest.search(new RegExp("\\n#{1,"+lv+"}\\s")),end=nx<0?cur.length:at+nx;v=cur.slice(0,end).replace(/\s+$/,"")+"\n"+line+(end<cur.length?"\n"+cur.slice(end):"")}
  else v=(cur.trim()?cur.replace(/\s+$/,"")+"\n\n":"")+"## Pegadinhas\n"+line;replaceNote(k,v)}
function ePegDraft(e){const P=cdErrParse(e),x=(eConcept(e)||P.concept||"").replace(/…$/,"").replace(/[.;]+$/,"").trim(),why=P.mine&&P.right?`não é ${P.mine.replace(/^[A-E]\)\s*/,"")}; é ${P.right.replace(/^[A-E]\)\s*/,"")}`:"";return {x,why}}
/* ----- cartões de pergunta e resposta (repetição espaçada tipo Leitner) ----- */
