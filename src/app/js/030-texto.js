/* markdown simples → HTML seguro */
function esc(s){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function inl(s){const keep=[],ph=h=>{keep.push(h);return "\u0000"+(keep.length-1)+"\u0000"};
  s=String(s).replace(/\[\[([^\[\]\n|]{1,120})(?:\|([^\[\]\n]{1,120}))?\]\]/g,(m,a,b)=>ph(wkHTML(a.trim(),(b||"").trim()))).replace(/\{\{([eq]):([A-Za-z0-9:_-]{1,80})\}\}/g,(m,t,id)=>ph(nbHTML(t,id)));
  return esc(s).replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>').replace(/(^|[\s(])(https?:\/\/[^\s<]+)/g,'$1<a href="$2" target="_blank" rel="noopener">$2</a>').replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/==(.+?)==/g,"<mark>$1</mark>").replace(/(^|[\s(])_(.+?)_(?=[\s.,;:!?)]|$)/g,"$1<em>$2</em>").replace(/(^|[\s(])\*(?!\s)(.+?)\*(?=[\s.,;:!?)]|$)/g,"$1<em>$2</em>").replace(/\u0000(\d+)\u0000/g,(m,i)=>keep[+i])}
function md(src,o){o=o||{};
  const L=String(src).replace(/\r/g,"").split("\n"),out=[];let i=0;
  const isRow=l=>/^\s*\|.*\|\s*$/.test(l), isSep=l=>/^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l);
  const cells=l=>l.trim().replace(/^\||\|$/g,"").split("|").map(c=>inl(c.trim()));
  while(i<L.length){const l=L[i];
    if(!l.trim()){i++;continue}
    if(/^\s*```/.test(l)){const lang=l.trim().slice(3).trim().toLowerCase(),b=[];i++;while(i<L.length&&!/^\s*```/.test(L[i])){b.push(L[i]);i++}i++;
      out.push(lang==="fluxo"?flowHTML(b):`<pre class="mdpre">${esc(b.join("\n"))}</pre>`);continue}
    let m;
    if(m=l.match(/^(#{1,3})\s+(.*)/)){const n=m[1].length;out.push(`\u0001${n}<h${n+2} class="mdh">${inl(m[2])}</h${n+2}>`);i++;continue}
    if(/^\s*(-{3,}|\*{3,})\s*$/.test(l)){out.push("<hr>");i++;continue}
    if(isRow(l)){const rows=[];while(i<L.length&&isRow(L[i])){rows.push(L[i]);i++}
      let head=null;if(rows.length>1&&isSep(rows[1])){head=cells(rows[0]);rows.splice(0,2)}
      const body=rows.filter(r=>!isSep(r)).map(cells);
      out.push(`<div class="mdtable"><table>${head?`<thead><tr>${head.map(c=>`<th>${c}</th>`).join("")}</tr></thead>`:""}<tbody>${body.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`);continue}
    if(/^\s*>/.test(l)){const b=[];while(i<L.length&&/^\s*>/.test(L[i])){b.push(inl(L[i].replace(/^\s*>\s?/,"")));i++}
      out.push(`<div class="callout">${b.join("<br>")}</div>`);continue}
    if(/^\s*[-*\u2022](\s+|$)/.test(l)){const b=[];while(i<L.length&&/^\s*[-*\u2022](\s+|$)/.test(L[i])){const ind=L[i].match(/^\s*/)[0].replace(/\t/g,"  ").length,cls=ind>=4?"sub3":ind>=2?"sub2":"";b.push({cls,h:inl(L[i].replace(/^\s*[-*\u2022]\s*/,""))});i++}
      out.push(`<ul>${b.map((x,j)=>{const kid=o.fold&&b[j+1]&&(x.cls===""?b[j+1].cls!=="":x.cls==="sub2"&&b[j+1].cls==="sub3");return `<li${x.cls||kid?` class="${[x.cls,kid?"haskids":""].filter(Boolean).join(" ")}"`:""}>${kid?`<button type="button" class="lfold" aria-expanded="true" aria-label="Recolher os subitens"></button>`:""}${x.h}</li>`}).join("")}</ul>`);continue}
    if(/^\s*\d+[.)](\s+|$)/.test(l)){const b=[];while(i<L.length&&/^\s*\d+[.)](\s+|$)/.test(L[i])){b.push(`<li>${inl(L[i].replace(/^\s*\d+[.)]\s*/,""))}</li>`);i++}
      out.push(`<ol>${b.join("")}</ol>`);continue}
    const p=[];while(i<L.length&&L[i].trim()&&!/^(#{1,3}\s|\s*>|\s*[-*\u2022](\s+|$)|\s*\d+[.)](\s+|$)|\s*\||\s*```)/.test(L[i])&&!/^\s*(-{3,}|\*{3,})\s*$/.test(L[i])){p.push(inl(L[i]));i++}
    if(p.length)out.push(`<p>${p.join("<br>")}</p>`);else i++;
  }
  return mdFold(out,o.fold);
}
/* tópicos que recolhem: cada título (#, ##, ###) vira uma seção que abre e fecha; o app lembra o que ficou fechado */
const LSFOLD="resid-fold-v1";let foldSt={};try{const v=JSON.parse(localStorage.getItem(LSFOLD)||"{}");if(v&&typeof v==="object")foldSt=v}catch(e){}
function foldSave(){try{localStorage.setItem(LSFOLD,JSON.stringify(foldSt))}catch(e){}}
function mdFold(out,key){if(!key)return out.map(x=>x.replace(/^\u0001\d/,"")).join("");const closed=new Set(foldSt[key]||[]);let idx=0;
  const build=(from,lv)=>{let html="",i=from;while(i<out.length){const x=out[i],m=x.match(/^\u0001(\d)/);
      if(m){const n=+m[1];if(n<=lv)break;const my=idx++;const r=build(i+1,n);html+=`<details class="mdsec" data-fk="${esc(String(key))}" data-fi="${my}"${closed.has(my)?"":" open"}><summary>${x.slice(2)}</summary><div class="mdsb">${r.html}</div></details>`;i=r.i;continue}
      html+=x;i++}
    return {html,i}};
  return build(0,0).html}
document.addEventListener("toggle",e=>{const d=e.target;if(!d||!d.matches||!d.matches("details.mdsec[data-fk]"))return;const k=d.dataset.fk,i=+d.dataset.fi,set=new Set(foldSt[k]||[]);
  if(d.open)set.delete(i);else set.add(i);if(set.size)foldSt[k]=[...set];else delete foldSt[k];foldSave()},true);
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("button.lfold");if(b){e.preventDefault();const li=b.closest("li"),lv=li.classList.contains("sub2")?2:0,open=b.getAttribute("aria-expanded")!=="true";
    b.setAttribute("aria-expanded",open);b.setAttribute("aria-label",open?"Recolher os subitens":"Mostrar os subitens");li.classList.toggle("folded",!open);
    let n=li.nextElementSibling;while(n&&(lv===0?n.matches(".sub2,.sub3"):n.matches(".sub3"))){n.hidden=!open;if(open&&n.classList.contains("folded")){let m=n.nextElementSibling;while(m&&m.matches(".sub3")){m.hidden=true;m=m.nextElementSibling}}n=n.nextElementSibling}return}
  const a=e.target.closest&&e.target.closest("a.wk[data-wk]");if(a){e.preventDefault();wkGo(a.dataset.wk);return}
  const nb=e.target.closest&&e.target.closest("button.nbadge[data-nb]");if(nb){e.preventDefault();nbGo(nb.dataset.nb)}});
/* links entre temas: [[Nome do tema]] ou [[Nome|texto]] liga a um tema da residência, da faculdade ou a uma página do caderno livre */
let wkIdx=null,wkSig="";
function wkIndex(){const sig=FAC_ITEMS.length+"|"+freeN.map(f=>f.id+":"+f.t).join(",");if(wkIdx&&sig===wkSig)return wkIdx;wkSig=sig;const m=new Map(),all=[];
  [...ALL,...FAC_ITEMS].forEach(it=>{const n=norm(it.t).trim();if(!m.has(n))m.set(n,{kind:"t",id:it.key,t:it.t});all.push({n,r:{kind:"t",id:it.key,t:it.t}})});
  freeN.forEach(f=>{const n=norm(f.t||"").trim();if(n&&!m.has(n))m.set(n,{kind:"f",id:f.id,t:f.t});if(n)all.push({n,r:{kind:"f",id:f.id,t:f.t}})});
  if(typeof mdCache!=="undefined")mdCache.clear();wkIdx={m,all};return wkIdx}
function wkFind(name){const I=wkIndex(),n=norm(String(name||"")).trim();if(!n)return null;if(I.m.has(n))return I.m.get(n);
  const c=I.all.filter(x=>x.n.startsWith(n));return c.length===1?c[0].r:null}
function wkHTML(name,alias){const r=wkFind(name),lab=alias||name;
  return r?`<a class="wk" href="#" data-wk="${esc(r.kind+":"+r.id)}" title="${esc(r.kind==="f"?"Caderno livre: ":"Abrir ")+esc(r.t||"")}">${esc(lab)}</a>`:`<span class="wk miss" title="Nenhum tema ou página com este nome">${esc(lab)}</span>`}
function wkGo(ref){const i=ref.indexOf(":"),kind=ref.slice(0,i),id=ref.slice(i+1);
  if(kind==="t"&&BYKEY[id]){detTab[id]="notas";noteMode[id]="ler";openTopic(id);return}
  if(kind==="f"&&freeN.some(f=>f.id===id)){backStack=[];freeOpen.add(id);if(typeof setNSeg==="function")nSeg="livre";setView("notas");setTimeout(()=>{const x=document.getElementById("fr-"+id);if(x)x.scrollIntoView({block:"start",behavior:"smooth"})},60)}}
/* links de uma anotação (para "Mencionado em") */
function wkLinksIn(txt){const out=[];String(txt||"").replace(/\[\[([^\[\]\n|]{1,120})(?:\|[^\[\]\n]{1,120})?\]\]/g,(m,a)=>{const r=wkFind(a.trim());if(r)out.push(r);return m});return out}
function wkSources(){const L=[];Object.keys(notes).forEach(k=>{if(BYKEY[k]&&(notes[k]||"").trim())L.push({kind:"t",id:k,t:BYKEY[k].t,txt:notes[k]})});freeN.forEach(f=>{if((f.b||"").trim())L.push({kind:"f",id:f.id,t:f.t||"Sem título",txt:f.b})});return L}
function wkBack(ref){const name=ref.kind==="t"?(BYKEY[ref.id]||{}).t:(freeN.find(f=>f.id===ref.id)||{}).t,nn=norm(name||"").trim(),men=[],unl=[];
  wkSources().forEach(S=>{if(S.kind===ref.kind&&S.id===ref.id)return;const links=wkLinksIn(S.txt);
    if(links.some(r=>r.kind===ref.kind&&r.id===ref.id)){men.push(S);return}
    if(nn.length>=5){const at=wkPlainAt(S.txt,nn);if(at>=0)unl.push({...S,at,len:nn.length})}});
  return {men,unl}}
/* posição do nome escrito sem link (fora de [[…]], de links e de títulos de código), com limites de palavra */
function wkPlainAt(txt,nn){const t=norm(txt);let from=0;while(true){const i=t.indexOf(nn,from);if(i<0)return -1;from=i+1;
  const pre=t[i-1]||" ",post=t[i+nn.length]||" ";if(/[a-z0-9]/.test(pre)||/[a-z0-9]/.test(post))continue;
  const o=t.lastIndexOf("[[",i),c=t.lastIndexOf("]]",i);if(o>=0&&o>c)continue;const ln=t.lastIndexOf("\n",i)+1;if(/^\s*```/.test(t.slice(ln)))continue;return i}}
function wkLinkify(S,ref){const name=ref.kind==="t"?BYKEY[ref.id].t:(freeN.find(f=>f.id===ref.id)||{}).t||"",at=S.at,orig=S.txt.slice(at,at+S.len),tok=orig===name?`[[${name}]]`:`[[${name}|${orig}]]`,v=S.txt.slice(0,at)+tok+S.txt.slice(at+S.len);
  if(S.kind==="t")replaceNote(S.id,v);else{const f=freeN.find(x=>x.id===S.id);if(f){f.b=v;f.at=new Date().toISOString();frPut(f)}}render()}
function wkBackEl(ref){const B=wkBack(ref),w=el(`<div class="wkback"></div>`);
  const go=S=>{const b=el(`<button class="wkchip" type="button"></button>`);b.textContent=(S.kind==="f"?"📓 ":"")+S.t;b.onclick=()=>wkGo(S.kind+":"+S.id);return b};
  const h=el(`<div class="wkrow"><span class="glabel">Mencionado em</span></div>`);if(B.men.length){const c=el(`<div class="wkchips"></div>`);B.men.forEach(S=>c.appendChild(go(S)));h.appendChild(c)}
  else h.appendChild(el(`<span class="how">Nenhuma anotação liga para cá ainda. Em outra anotação, escreva <code>[[${esc(ref.kind==="t"?BYKEY[ref.id].t:"Nome")}]]</code> para criar um link.</span>`));w.appendChild(h);
  if(B.unl.length){const u=el(`<div class="wkrow"><span class="glabel">Citado sem link · ${B.unl.length}</span><ul class="wkunl"></ul></div>`),ul=u.querySelector("ul");
    B.unl.slice(0,8).forEach((S,j)=>{const li=el(`<li><span class="wkctx"></span><button class="mini" type="button">Transformar em link</button></li>`),cx=li.querySelector(".wkctx");cx.appendChild(go(S));
      const a=Math.max(0,S.at-50),q=el(`<q></q>`);q.textContent=(a?"…":"")+S.txt.slice(a,S.at+S.len+50).replace(/\s+/g," ")+"…";cx.appendChild(q);const b=li.querySelector("button");b.id=`wkl-${j}`;b.onclick=()=>wkLinkify(S,ref);ul.appendChild(li)});
    w.appendChild(u)}
  return w}
/* selos de erro e de questão dentro do texto: {{e:<id do erro>}} e {{q:<id da prova>:<nº>}} */
function nbInfo(t,id){if(t==="e"){const e=errors.find(x=>x.id===id);return e?{lab:`Erro · ${br(e.d).slice(0,5)}`,tip:eOneLine(e.r).slice(0,120),ok:true}:{lab:"Erro apagado",ok:false}}
  const [xid,ix]=id.split(":"),ex=exams.find(x=>x.id===xid),r=ex&&ex.qs[+ix];return r?{lab:`${ex.banca||ex.name}${ex.ano?" · "+ex.ano:""} · Q${r.n||+ix+1}`,tip:r.q.enunciado.replace(/\s+/g," ").slice(0,120),ok:true}:{lab:"Questão apagada",ok:false}}
function nbHTML(t,id){const I=nbInfo(t,id);return `<button type="button" class="nbadge n${t}${I.ok?"":" gone"}" data-nb="${esc(t+":"+id)}"${I.tip?` title="${esc(I.tip)}"`:""}${I.ok?"":" disabled"}>${t==="e"?"⚠":"?"} ${esc(I.lab)}</button>`}
function nbGo(ref){const t=ref[0],id=ref.slice(2);if(t==="e"){const e=errors.find(x=>x.id===id);if(e)eOpenOne(e);return}
  const [xid,ix]=id.split(":"),ex=exams.find(x=>x.id===xid);if(!ex||!ex.qs[+ix])return;exRun={id:xid,view:"rev",i:+ix,cad:{}};exEdit=null;backStack=[];qSeg="praticar";qPart="provas";setView("quest");setTimeout(()=>{const h=$("#exh");if(h)h.scrollIntoView({block:"start"})},60)}
/* o que pode virar selo num tema: erros ativos e questões de provas na íntegra desse tema */
function nbChoices(k){const KS=new Set(Array.isArray(k)?k:[k]),many=KS.size>1,E=errors.filter(e=>KS.has(e.k)&&!e.arch).sort(byNewest).slice(0,20).map(e=>({tok:`{{e:${e.id}}}`,lab:`Erro · ${br(e.d).slice(0,5)}${many&&BYKEY[e.k]?" · "+BYKEY[e.k].t:""}`,sub:eOneLine(e.w||e.r).slice(0,90)}));
  const Q=[];exams.forEach(ex=>ex.qs.forEach((r,i)=>{if(KS.has(r.k)&&Q.length<30){const a=exPg(ex.id).a[i];Q.push({tok:`{{q:${ex.id}:${i}}}`,lab:`${ex.banca||ex.name}${ex.ano?" · "+ex.ano:""} · Q${r.n||i+1}`,sub:(a?(a.l===r.q.correta?"✓ acertou · ":"✗ errou · "):"")+r.q.enunciado.replace(/\s+/g," ").slice(0,80),w:a&&a.l!==r.q.correta})}}));
  Q.sort((a,b)=>(b.w?1:0)-(a.w?1:0));return {E,Q}}


/* editor: [[ abre a lista de temas; Tab/Shift+Tab mudam o recuo; Selo insere {{e:…}} ou {{q:…}} */
function wkPopUpdate(ta,k,pop){const c=ta.selectionStart,v=ta.value,m=/\[\[([^\[\]\n|]{0,40})$/.exec(v.slice(0,c));
  if(!m||c!==ta.selectionEnd){pop.hidden=true;ta._wk=null;return}
  const q=norm(m[1]).trim(),I=wkIndex(),seen=new Set(),L=[];
  const push=x=>{const id=x.r.kind+":"+x.r.id;if(!seen.has(id)&&!(x.r.kind==="t"&&x.r.id===k)){seen.add(id);L.push(x.r)}};
  I.all.filter(x=>!q||x.n.startsWith(q)).forEach(push);if(q)I.all.filter(x=>x.n.includes(q)).forEach(push);
  const list=L.slice(0,7);ta._wk={start:c-m[1].length-2,sel:Math.min((ta._wk&&ta._wk.sel)||0,Math.max(0,list.length-1)),list};
  pop.innerHTML="";pop.hidden=false;
  if(!list.length){pop.appendChild(el(`<p class="how">${q?"Nenhum tema ou página com esse nome.":"Digite o nome do tema."} Esc fecha.</p>`));return}
  list.forEach((r,i)=>{const b=el(`<button type="button" class="wkopt" role="option"><b></b><span></span></button>`);b.id=`wko-${i}`;b.setAttribute("aria-selected",i===ta._wk.sel);
    b.querySelector("b").textContent=r.t;const it=r.kind==="t"&&BYKEY[r.id];b.querySelector("span").textContent=r.kind==="f"?"Caderno livre":it?`${it.area.code}${it.sp?" · "+it.sp:""}${it.own?" · FAC":""}`:"";
    b.onmousedown=e=>e.preventDefault();b.onclick=()=>wkPick(ta,k,pop,i);pop.appendChild(b)})}
function wkPick(ta,k,pop,i){const W=ta._wk;if(!W||!W.list[i])return;const r=W.list[i],c=ta.selectionStart,v=ta.value,after=v.slice(c).startsWith("]]")?c+2:c,tok=`[[${r.t}]]`;
  edit(ta,k,()=>({v:v.slice(0,W.start)+tok+v.slice(after),s:W.start+tok.length,e:W.start+tok.length}));pop.hidden=true;ta._wk=null}
function wkPopKey(e,ta,k,pop){const W=ta._wk;if(!W||pop.hidden)return false;
  if(e.key==="Escape"){pop.hidden=true;ta._wk=null;e.preventDefault();e.stopPropagation();return true}
  if(!W.list.length)return false;
  if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();W.sel=(W.sel+(e.key==="ArrowDown"?1:W.list.length-1))%W.list.length;pop.querySelectorAll(".wkopt").forEach((b,j)=>b.setAttribute("aria-selected",j===W.sel));return true}
  if(e.key==="Enter"||e.key==="Tab"){e.preventDefault();wkPick(ta,k,pop,W.sel);return true}return false}
function indentLines(ta,k,out){edit(ta,k,(v,s,e)=>{const ls=v.lastIndexOf("\n",s-1)+1;let le=v.indexOf("\n",e>s&&v[e-1]==="\n"?e-1:e);if(le<0)le=v.length;
  const lines=v.slice(ls,le).split("\n");let d0=0,dt=0;const nl=lines.map((l,i)=>{let n;if(out){const r=l.match(/^ {1,2}|^\t/);n=r?l.slice(r[0].length):l;const d=n.length-l.length;if(i===0)d0=d;dt+=d}else{n="  "+l;if(i===0)d0=2;dt+=2}return n});
  const blk=nl.join("\n");return {v:v.slice(0,ls)+blk+v.slice(le),s:Math.max(ls,s+d0),e:Math.max(ls,e+dt)}})}
function nbPickEl(ta,k,close,keys){const C=nbChoices(keys||k),w=el(`<div class="nbpick" role="dialog" aria-label="Marcar questão ou erro"><div class="dhead"><b>Marcar questão ou erro na linha</b><button class="link" type="button">Fechar</button></div></div>`);
  w.querySelector(".link").onclick=close;
  const grp=(lab,L,empty)=>{w.appendChild(el(`<span class="glabel">${lab}</span>`));if(!L.length){w.appendChild(el(`<p class="how">${empty}</p>`));return}
    const ul=el(`<ul class="nbopts"></ul>`);L.forEach((x,i)=>{const li=el(`<li><button type="button"><b></b><span></span></button></li>`),b=li.querySelector("button");b.querySelector("b").textContent=x.lab;b.querySelector("span").textContent=x.sub;
      b.onmousedown=e=>e.preventDefault();b.onclick=()=>{edit(ta,k,(v,s,e)=>{const ins=(s>0&&!/\s/.test(v[s-1])?" ":"")+x.tok;return {v:v.slice(0,s)+ins+v.slice(e),s:s+ins.length,e:s+ins.length}});close()};ul.appendChild(li)});w.appendChild(ul)};
  const fr=Array.isArray(keys);if(fr&&!keys.length){w.appendChild(el(`<p class="how">Ligue esta página a um ou mais temas (em Ligar a temas, abaixo) para listar os erros e as questões deles.</p>`));return w}
  grp(fr?"Erros dos temas ligados":"Erros deste tema",C.E,fr?"Nenhum erro ativo nos temas ligados.":"Nenhum erro ativo deste tema no caderno.");grp("Questões de provas na íntegra",C.Q,fr?"Nenhuma questão de prova importada nos temas ligados.":"Nenhuma questão de prova importada ligada a este tema.");return w}
/* edição na textarea */
function edit(ta,k,fn){const s=ta.selectionStart,e=ta.selectionEnd,v=ta.value;const r=fn(v,s,e);
  ta.value=r.v;ta.focus();ta.setSelectionRange(r.s,r.e);if(typeof k==="function")k(ta.value);else saveNote(k,ta.value)}
/* Lote 20C: pegadinha estruturada "> Pegadinha: … — Por quê: …" (a linha atual vira a pegadinha; o cursor fica no porquê) */
function pegInsert(ta,k){edit(ta,k,(v,s,e)=>{const ls=v.lastIndexOf("\n",s-1)+1;let le=v.indexOf("\n",e);if(le<0)le=v.length;const line=v.slice(ls,le);if(/^\s*>/.test(line))return {v,s,e};
  const body=line.replace(/^\s*[-*•]\s+/,"").trim(),ph="o que costuma enganar";if(!body){const ins=`> Pegadinha: ${ph} — Por quê: `;return {v:v.slice(0,ls)+ins+v.slice(le),s:ls+13,e:ls+13+ph.length}}
  const ins=`> Pegadinha: ${body} — Por quê: `;return {v:v.slice(0,ls)+ins+v.slice(le),s:ls+ins.length,e:ls+ins.length}})}
function wrap(ta,k,a,b,ph){edit(ta,k,(v,s,e)=>{const sel=v.slice(s,e)||ph;return {v:v.slice(0,s)+a+sel+b+v.slice(e),s:s+a.length,e:s+a.length+sel.length}})}
function prefix(ta,k,pre,numbered){edit(ta,k,(v,s,e)=>{const ls=v.lastIndexOf("\n",s-1)+1;let le=v.indexOf("\n",e);if(le<0)le=v.length;
  let n=0;const block=v.slice(ls,le).split("\n").map(l=>(numbered?(++n)+". ":pre)+l.replace(/^(#{1,3}\s|>\s?|[-*]\s|\d+[.)]\s)/,"")).join("\n");
  return {v:v.slice(0,ls)+block+v.slice(le),s:ls,e:ls+block.length}})}
function insertBlock(ta,k,txt){edit(ta,k,(v,s,e)=>{const before=v.slice(0,s),after=v.slice(e);
  const pre=before&&!before.endsWith("\n\n")?(before.endsWith("\n")?"\n":"\n\n"):"";const post=after&&!after.startsWith("\n")?"\n\n":"";
  const ins=pre+txt+post,end=before.length+pre.length+txt.length;return {v:before+ins+after,s:end,e:end}})}
const TPL_RESUMO=`## Conceito-chave
Uma ou duas frases com o essencial.

## Quadro clínico
-

## Diagnóstico
-

## Conduta
1.

## Pegadinhas de prova
>

## Fontes
- `;
const TPL_TABELA=`| Critério | Opção A | Opção B |
|---|---|---|
| Quadro clínico |  |  |
| Diagnóstico |  |  |
| Conduta |  |  |`;
function tplSubs(it){return subList(it).map(x=>`## ${x.t}\n- `).join("\n\n")}
/* ---------- Fluxograma (bloco ```fluxo) e leitura de imagem pelo Claude ---------- */
/* sintaxe: uma etapa por linha; "? pergunta" é decisão; linhas recuadas "Rótulo: texto" são os caminhos (use → para encadear) */
function flowHTML(lines){const L=lines.map(l=>l.replace(/\t/g,"  ")).filter(l=>l.trim());let out=`<div class="flow">`,i=0,first=true;
  const box=(t,cls)=>`<div class="fl-box${cls?" "+cls:""}">${inl(t)}</div>`;
  while(i<L.length){const l=L[i];if(/^\s{2,}/.test(l)){i++;continue}
    if(!first)out+=`<div class="fl-arrow" aria-hidden="true"></div>`;first=false;
    if(/^\s*\?/.test(l)){out+=box(l.replace(/^\s*\?\s*/,"")+(/\?\s*$/.test(l)?"":"?"),"fl-q");i++;const br=[];
      while(i<L.length&&/^\s{2,}/.test(L[i])){const m=L[i].trim().replace(/^[-*]\s*/,"").match(/^([^:]{1,24}):\s*(.*)$/);br.push(m?{lab:m[1],steps:m[2].split(/\s*(?:→|->)\s*/).filter(Boolean)}:{lab:"",steps:L[i].trim().split(/\s*(?:→|->)\s*/)});i++}
      if(br.length)out+=`<div class="fl-branches">${br.map(b=>`<div class="fl-branch">${b.lab?`<span class="fl-lab">${inl(b.lab)}</span>`:""}${b.steps.map((s,j)=>(j?`<div class="fl-arrow" aria-hidden="true"></div>`:`<div class="fl-arrow sm" aria-hidden="true"></div>`)+box(s)).join("")}</div>`).join("")}</div>`;continue}
    out+=box(l.trim().replace(/^[-*]\s*/,""));i++}
  return out+`</div>`}
