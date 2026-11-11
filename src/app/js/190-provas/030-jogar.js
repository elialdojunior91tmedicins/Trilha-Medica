/* ---------- leitura no aparelho, sem o Claude (PDF com texto, questões numeradas, alternativas A) B) …) ---------- */
/* tema sugerido pelo nome: palavras do tema e dos subtópicos que aparecem no título/enunciado */
let impTIdx=null;
const IMP_SYN=[[/\bmigran[a-z]*/g," enxaqueca "],[/\btipo tensao\b/g," tensional "],[/\bcefaleias?\b/g," cefaleia cefaleias "],[/\bavc\b/g," acidente vascular "],[/\biam\b/g," infarto "],[/\bdpoc\b/g," doenca pulmonar obstrutiva "],[/\bitu\b/g," infeccao urinaria "]];
const impNT=s=>{let x=" "+norm(s||"").replace(/[^a-z0-9\s]/g," ")+" ";IMP_SYN.forEach(([r,v])=>{x=x.replace(r,v)});return x.replace(/\s+/g," ")};
/* pontua cada tema pelas palavras do nome e dos subtópicos que aparecem no título/enunciado; palavras comuns a muitos temas valem menos */
/* palavras genéricas de prova que não dizem o tema ("[Clínica]", "conduta"…) e sinônimos que o nome do tema usa */
const IMP_GEN=new Set("clinica clinico clinicos clinicas conceito conceitual conduta condutas diagnostico diagnosticos tratamento tratamentos abordagem avaliacao manejo simulado ineditas inedita questao questoes gabarito feedback detalhado baseadas baseado casos tutoria modulo fonte paciente pacientes principais exames exame".split(" "));
const IMP_SYN2=[[/\btrombocitopeni(a|as|ca|co)\b/g,"plaquetopenia"],[/\b(ttpa|coagulograma|inr|hemofilias?|hemorragicos?)\b/g,"$& coagulacao"],[/\bcoagulopatias?\b/g,"coagulacao"],[/\bhemostasia\b/g,"coagulacao"],[/\bneoplasias?\s+hematologicas?\b/g,"leucemias linfomas"]];
const impNT2=s=>{let t=impNT(s);IMP_SYN2.forEach(([r,v])=>{t=t.replace(r,v)});return t};
function impTemaScores(title,txt){if(!impTIdx){const ac=s=>(String(s).match(/\b[A-Z]{2,5}\b/g)||[]).map(x=>impNT(x).trim()).filter(Boolean);
    const w=s=>new Set([...impNT2(s).split(" ").filter(x=>x.length>=5&&!STOP.has(x)&&!IMP_GEN.has(x)),...ac(s)]);
    const L=ALL.map(it=>{const st=subList(it).map(x=>x.t).join(" ; ");return {k:it.key,sp:it.sp||"",name:w(it.t),subs:w(st)}}),df={};
    L.forEach(o=>new Set([...o.name,...o.subs]).forEach(x=>{df[x]=(df[x]||0)+1}));L.forEach(o=>{o.idf=x=>Math.log(ALL.length/(df[x]||1))});impTIdx=L}
  const T=" "+impNT2(title)+" ",X=" "+impNT2(txt)+" ",has=(S,w)=>w.length<5?S.includes(" "+w+" "):S.includes(" "+w)||w.length>7&&S.includes(" "+w.slice(0,Math.max(7,Math.ceil(w.length*.7)))),sc={};
  impTIdx.forEach(o=>{let s=0;o.name.forEach(w=>{const f=o.idf(w);if(has(T,w))s+=3*f;else if(has(X,w))s+=1.2*f});o.subs.forEach(w=>{if(o.name.has(w))return;const f=o.idf(w);if(has(T,w))s+=1.5*f;else if(has(X,w))s+=.4*f});if(s>0)sc[o.k]=s});
  return sc}
/* temas por questão (até 3: o 1º é o principal; o 2º e o 3º só quando a questão cobre mesmo mais de um), com o assunto da prova
   (cabeçalho da 1ª página, nome do arquivo e títulos das questões) dando preferência ao tema e à especialidade da prova */
function impTemas(list,examName){const raw=list.map(x=>impTemaScores(x.title,x.txt)),ctx=impTemaScores(examName+" "+list.map(x=>x.title).join(" "),"");
  const C=Object.entries(ctx).sort((a,b)=>b[1]-a[1]),top=C[0],prior=top&&top[1]>=6?top[0]:"",psp=prior&&BYKEY[prior]?BYKEY[prior].sp:"";
  return raw.map(sc=>{Object.keys(sc).forEach(k=>{if(k===prior)sc[k]=sc[k]*2.2+3;else if(psp&&BYKEY[k]&&BYKEY[k].sp===psp)sc[k]=sc[k]*1.5+1});
    const R=Object.entries(sc).sort((a,c)=>c[1]-a[1]);if(!R.length||R[0][1]<4)return [];const b=R[0][1],out=[R[0][0]];
    const ok2=x=>x&&x[1]>=Math.max(4.5,b*((psp&&BYKEY[x[0]]&&BYKEY[x[0]].sp===psp)?.6:.8));/* fora da especialidade da prova, o 2º tema precisa ser quase tão forte quanto o 1º */
    if(ok2(R[1]))out.push(R[1][0]);if(out.length===2&&R[2]&&ok2(R[2])&&R[2][1]>=b*.75)out.push(R[2][0]);return out})}
/* justificativas do gabarito comentado → porquê de cada alternativa, comentário e conceito */
function impKCParse(seg,cor){const o={porq:{},com:"",con:""};if(!seg)return o;const s=seg.replace(/\s+/g," ");let m;
  const rj=/Justificativa\s+([A-E])\b\s*(?:\(\s*correta\s*\))?\s*[:\-–—]\s*([\s\S]*?)(?=Justificativa\s+[A-E]\b|Ponto[- ]chave|Take[- ]home|Fonte\s*:|$)/gi;
  while((m=rj.exec(s)))o.porq[m[1].toUpperCase()]=m[2].trim();
  const pk=(s.match(/Ponto[- ]chave\s*:\s*([\s\S]*?)(?=Take[- ]home|Fonte\s*:|$)/i)||[])[1],th=(s.match(/Take[- ]home(?:\s+message)?\s*:\s*([\s\S]*?)(?=Fonte\s*:|$)/i)||[])[1];
  const cj=cor&&o.porq[cor];o.com=cj||(Object.keys(o.porq).length?"":s.replace(/^(?:resposta|quest[aã]o)\s*\d{1,3}\s*/i,"").replace(/^[\s\S]{0,60}?correta\s*[:=\-–—]\s*[A-E]\b\s*/i,"").replace(/(?:Ponto[- ]chave|Take[- ]home|Fonte\s*:)[\s\S]*$/i,"").trim().slice(0,1500));
  /* Ponto-chave, Take home message e Fonte ficam em campos próprios (blocos separados no gabarito) */
  o.pc=(pk||"").trim().slice(0,1200);o.th=(th||"").trim().slice(0,800);o.fonte=((s.match(/Fonte\s*:\s*([^\n]*?)(?=\s*(?:RESPOSTA|QUEST[AÃ]O)\s*\d|$)/i)||[])[1]||"").trim().slice(0,400);
  o.con="";if(cor)delete o.porq[cor];return o}
function impLocal(R){const key=impKey(R),KC=keyComments(R),probs=[],qs=[];
  const QP=R.pages.filter(p=>!R.keyPg.includes(p.n)),scanned=QP.filter(p=>p.img).map(p=>p.n);
  if(scanned.length)probs.push(`${scanned.length===1?"a página":"as páginas"} ${pgList(scanned)} não ${scanned.length===1?"tem":"têm"} texto (${R.doc?"escaneadas":"fotos"}): só o Claude lê imagem`);
  let pages=QP.filter(p=>!p.img&&p.t);if(!pages.length)return {qs,probs:probs.length?probs:["não achei texto nas páginas"]};
  {const mw=impMwPages(pages);if(mw){pages=mw.pages;if(mw.note)probs.push(mw.note)}}// B4: reimpressões da Medway
  /* cabeçalhos e rodapés repetidos saem */
  const PAG=/\s*\b(?:p[aá]g(?:ina)?\.?)\s*\d+\s*(?:(?:de|\/)\s*\d+)?\s*$/i,cl=x=>x.replace(/\s+/g," ").trim().replace(PAG,"").trim();
  const AP=R.pages.filter(p=>p.t),cnt={};AP.forEach(p=>new Set(p.t.split("\n").map(cl).filter(Boolean)).forEach(x=>{cnt[x]=(cnt[x]||0)+1}));
  const rep=new Set(Object.keys(cnt).filter(x=>AP.length>=3&&cnt[x]>=Math.max(3,AP.length*.4)&&x.length<120&&!/^\(?[A-Ea-e]\s*[).:\-–]\s/.test(x)&&!/^(?:quest[aã]o|resposta)\s*\d/i.test(x)));
  const junk=x=>!x||rep.has(x)||/^p[aá]gina\s*\d+(\s*(de|\/)\s*\d+)?$/i.test(x)||/^\d{1,3}$/.test(x)||/^\[[^\]]{1,30}\]$/.test(x);
  const lines=[];pages.forEach(p=>p.t.split("\n").forEach(x=>{x=cl(x);if(!junk(x))lines.push({p:p.n,x})}));
  const QA=/^(?:quest[aã]o|QUEST[AÃ]O)\s*(?:n[ºo°.]\s*)?(\d{1,3})\b\s*[—–\-:.)]?\s*(.*)$/i,QB=/^(\d{1,3})\s*[.)–—-]\s+(\S.*)$/,STOPL=/^(?:parte\s*\d+\s*[—–-]\s*)?(?:gabarito\b|resposta\s*\d{1,3}\b)/i;
  const starts=re=>{const out=[];let prev=0;lines.forEach((l,i)=>{const m=l.x.match(re);if(!m)return;const n=+m[1];if(n>=1&&n<=300&&(!prev||n===prev+1||n>prev&&n<=prev+3)){out.push({i,n,rest:m[2]||""});prev=n}});return out};
  let S=starts(QA);if(S.length<2){const b=starts(QB);if(b.length>S.length)S=b}
  if(!S.length)return {qs,probs:[...probs,"não consegui achar onde começa cada questão (esperava \"Questão 1\" ou \"1.\")"]};
  const join=arr=>arr.reduce((a,x)=>!a?x:/[A-Za-zÀ-ÿ]-$/.test(a)&&/^[a-zà-ÿ]/.test(x)?a.slice(0,-1)+x:a+" "+x,"").trim();
  const bad=[],few=[],noKey=[],dup=new Set();
  S.forEach((s,j)=>{const end=j+1<S.length?S[j+1].i:lines.length;let L=lines.slice(s.i+1,end);const stop=L.findIndex(l=>STOPL.test(l.x));if(stop>=0)L=L.slice(0,stop);
    const rest=s.rest.trim().replace(/\s*(?:\[[^\]]{1,24}\]|\|\s*[^|]{1,24})$/,""),title=rest&&rest.length<=90&&!/[?]$/.test(rest)?rest.replace(/^[—–\-:]\s*/,""):"",stem=[];if(rest&&!title)stem.push(rest);
    const alts=[];let cur=null;
    L.forEach(l=>{const m=l.x.match(/^\(?([A-Ea-e])\s*[).:\-–]\s*(.*)$/),want=EX_AB[alts.length];
      if(m&&m[1].toUpperCase()===want&&(alts.length||stem.length)){cur={letra:want,tx:[m[2]]};alts.push(cur)}else if(cur)cur.tx.push(l.x);else stem.push(l.x)});
    const A=alts.map(a=>({letra:a.letra,texto:join(a.tx),porque:""})).filter(a=>a.texto),en=join(stem);
    if(qs.some(r=>r.n===s.n)){dup.add(s.n);return}
    if(A.length<4||!en||en.length<15){few.push(s.n);if(A.length<2||!en)return}
    if(A.some(a=>a.texto.length>900)||en.length>6000)bad.push(s.n);
    const v=key[s.n],an=v==="X",cor=v&&v!=="X"&&A.some(a=>a.letra===v)?v:"";if(!v)noKey.push(s.n);else if(!an&&!cor&&!few.includes(s.n))bad.push(s.n);
    const kc=impKCParse(KC[s.n]&&KC[s.n].split("\n").map(cl).filter(x=>!junk(x)).join("\n"),cor);A.forEach(a=>{a.porque=(kc.porq[a.letra]||"").slice(0,1200)});
    const k="",im=/\b(imagem|figura|foto(?:grafia)?|gr[aá]fico|tabela|eletrocardiograma|ecg|radiografia|tomografia|resson[aâ]ncia|ultrassonografia)\b[^.?]{0,40}\b(abaixo|a seguir|ao lado|seguinte|anexa|apresentad[ao])/i.test(en);
    const r=exQClean({n:s.n,p:s.i<lines.length?lines[s.i].p:0,pe:(L[L.length-1]||lines[s.i]).p,k,q:{enunciado:en,alternativas:A,correta:cor,comentario:kc.com,conceito:kc.con,pc:kc.pc,th:kc.th,fonte:kc.fonte},g:v?"b":"c",an,im,ck:cor});r.tt=title;qs.push(r)});
  {const head=S.length?lines.slice(0,S[0].i).map(l=>l.x).join(" ").slice(0,600):"";
   impTemas(qs.map(r=>({title:r.tt,txt:r.q.enunciado+" "+r.q.alternativas.map(a=>a.texto).join(" ")})),(R.name||"").replace(/^[0-9a-f]{6,}[-_ ]+/i,"")+" "+head).forEach((L,i)=>{const r=qs[i];delete r.tt;const ok=L.filter(k=>BYKEY[k]);if(ok.length){r.k=ok[0];r.kg=true;if(ok.length>1)r.ks=ok.slice(1)}})}
  const nums=qs.map(r=>r.n),mx=Math.max(0,...nums,...Object.keys(key).map(Number)),miss=[];for(let n=Math.min(...nums,1);n<=mx;n++)if(!nums.includes(n)&&!few.includes(n))miss.push(n);
  const lst=a=>a.slice(0,10).join(", ")+(a.length>10?"…":"");
  if(miss.length)probs.push(`não achei ${miss.length===1?"a questão":"as questões"} ${lst(miss)}`);
  if(few.length)probs.push(`${few.length===1?"a questão":"as questões"} ${lst(few)} ${few.length===1?"saiu":"saíram"} com menos de 4 alternativas ou sem enunciado (PDF em duas colunas costuma embaralhar)`);
  if(bad.length)probs.push(`${bad.length===1?"a questão":"as questões"} ${lst(bad)} ${bad.length===1?"parece":"parecem"} misturada${bad.length===1?"":"s"} com outro texto ou com o gabarito fora das alternativas`);
  if(dup.size)probs.push(`número de questão repetido: ${lst([...dup])}`);
  if(noKey.length)probs.push(noKey.length>=qs.filter(r=>!r.an).length?(R.mwAn&&R.mwAn.length?`o PDF não traz o gabarito (só a folha de rascunho, com ${R.mwAn.length===1?"a anulada":"as anuladas"} ${R.mwAn.join(", ")}, já marcada${R.mwAn.length===1?"":"s"}). Cole o gabarito oficial, ou o Claude resolve e você confere`:"a prova veio sem gabarito: sem ele, só o Claude resolve as questões (ou cole o gabarito acima)"):`sem resposta no gabarito para ${noKey.length===1?"a questão":"as questões"} ${lst(noKey)}`);
  return {qs,probs}}
function impLocalGet(R){const sig=[R.keyPg.join(),keyText(impKey(R)),R.pages.length,R.keyTxt.length].join("|");if(!R.loc||R.loc.sig!==sig){R.loc=impLocal(R);R.loc.sig=sig}return R.loc}
function impUseLocal(R){const L=impLocalGet(R);R.qs=L.qs.map(r=>({...r}));R.done=new Set(impQPages(R));R.fail=[];R.src="local";R.st="review";R.show=12;R.flt="all";render();
  setTimeout(()=>{const p=$("#impPanel");if(p)p.scrollIntoView({block:"start"})},40)}
function impProbEl(L,title){const w=el(`<div class="pnote implocw"><b></b><ul></ul><p></p></div>`);w.querySelector("b").textContent=title;
  L.probs.forEach(x=>{const li=document.createElement("li");li.textContent=x.charAt(0).toUpperCase()+x.slice(1)+".";w.querySelector("ul").appendChild(li)});
  w.querySelector("p").textContent=sampleOff?"Para ler direito, abra a prova pelo app do Claude ou pelo site, que passam pelo Claude.":"Passe a prova pelo Claude para ler direito: ele separa as questões, escolhe o tema e escreve o comentário.";return w}
/* fazer a prova */
function exStart(ex,mode){const P=exPg(ex.id);if(mode&&!Object.keys(P.a).length)P.mode=mode;if(P.fin){exRestart(ex);if(mode)P.mode=mode}
  let i=P.i;if(P.a[i])i=ex.qs.findIndex((r,j)=>!P.a[j]&&!r.an);if(i<0)i=0;exRun={id:ex.id,view:"q",i,shown:Date.now(),cad:{}};exEdit=null;imp=null;exPSave(ex.id);render();
  setTimeout(()=>{const h=$("#exh");if(h)h.scrollIntoView({block:"start"})},40)}
function exGo(ex,i){const R=exRun;if(!R)return;R.i=Math.max(0,Math.min(ex.qs.length-1,i));R.shown=Date.now();exPg(ex.id).i=R.i;exPSave(ex.id);render();const h=$("#exh");if(h)h.scrollIntoView({block:"start"})}
function exQuestionEl(ex,i,review){const R=exRun,P=exPg(ex.id),r=ex.qs[i],q=r.q,mine=P.a[i]&&P.a[i].l,show=review||P.mode==="e"&&!!mine||r.an&&!!mine;
  const card=el(`<div class="qcard exqc"><span class="qn"></span><span class="simtopic"></span><p class="qstem"></p></div>`);
  card.querySelector(".qn").textContent=`QUESTÃO ${r.n||i+1} · ${i+1} DE ${ex.qs.length}`;
  const it=r.k&&BYKEY[r.k];card.querySelector(".simtopic").textContent=show?(it?`${it.t} · ${it.area.code}${it.sp?" · "+it.sp:""}${(r.ks||[]).filter(k=>BYKEY[k]).map(k=>" + "+BYKEY[k].t).join("")}`:"Sem tema"):"";
  card.querySelector(".qstem").textContent=q.enunciado;
  if(r.fg){const src=exFig(ex,i),fw=el(`<figure class="qfig"></figure>`);if(src){const im=el(`<img alt="">`);im.src=src;im.alt=`Figura da questão ${r.n||i+1}`;im.onclick=()=>{try{window.open(src,"_blank")}catch(e){}};fw.appendChild(im)}
    const cap=el(`<figcaption></figcaption>`);cap.textContent=src?`Figura da prova · página ${r.p}${r.pe&&r.pe!==r.p?`–${r.pe}`:""}`:exFigWait[ex.id+"_"+i]===2?`A figura não está neste aparelho: veja na prova, página ${r.p}.`:"Carregando a figura…";fw.appendChild(cap);card.insertBefore(fw,card.querySelector(".qstem").nextSibling)}
  else if(r.im)card.insertBefore(el(`<p class="pnote">Esta questão tem imagem: veja na prova, página ${r.p}${r.pe&&r.pe!==r.p?` a ${r.pe}`:""}.</p>`),card.querySelector(".qstem").nextSibling);
  if(r.an)card.appendChild(el(`<p class="pnote">Questão anulada pela banca: não conta no acerto.</p>`));
  if(show&&exClash(r)){const cl=q.alternativas.find(a=>a.letra!==q.correta&&/^\s*correta\b/i.test(a.porque||""));card.appendChild(el(`<p class="pnote">O comentário desta questão contradiz o gabarito ${esc(q.correta)}${cl?`: ele diz que a certa é a ${esc(cl.letra)}`:""}. O gabarito pode ter sido lido errado na importação: confira e, se for o caso, troque a resposta em Revisar questões (o acerto é recalculado).</p>`))}
  if(show&&q.correta)card.appendChild(altsEl(qSplit(q),mine||"-",()=>{}));
  else{const box=el(`<div class="alts"></div>`);q.alternativas.forEach(a=>{const b=el(`<button class="alt" type="button"><b>${esc(a.letra)})</b><span></span></button>`);b.id=`exa-${i}-${a.letra}`;b.querySelector("span").textContent=a.texto;if(a.letra===mine)b.classList.add("pick");b.onclick=()=>{exAnswer(ex,i,a.letra)};box.appendChild(b)});card.appendChild(box)}
  if(show){if(q.correta){const ok=mine===q.correta;card.appendChild(el(`<p class="verdict ${mine?ok?"ok":"no":""}">${mine?ok?"Correta.":"Incorreta. A resposta é "+esc(q.correta)+".":"Você não respondeu. A resposta é "+esc(q.correta)+"."}${r.g!=="b"?" <span class=\"simt\">(gabarito do Claude)</span>":""}</p>`))}
    else card.appendChild(el(`<p class="pnote">Sem resposta definida: escolha a resposta em Revisar questões.</p>`));
    card.appendChild(qExplEl(qSplit(q),{note:r.ck&&q.correta&&r.ck!==q.correta?`O comentário foi escrito considerando a alternativa ${esc(r.ck)}; o gabarito oficial é ${esc(q.correta)}.`:""}));
    {const f=qFonteEl(q);if(f)card.appendChild(f)}
    if(r.kd)card.appendChild(el(`<p class="exkd">Gabarito mudou do preliminar para o definitivo nesta questão.</p>`));{const b=cmBtn(ex,i,"excq-"+i);if(b)card.appendChild(b)}
    if(mine&&q.correta&&mine!==q.correta&&r.k&&!r.an)card.appendChild(eCadEl(R.cad,i,r.k,q,mine,ex.name));
    if(mine&&q.correta&&!r.an)card.appendChild(qActsEl(q,mine,{k:r.k,src:ex.name,tok:`{{q:${ex.id}:${i}}}`}))}
  return card}
/* relógio da prova: tempo já gasto (soma das respostas) + o da questão aberta; atualiza a cada segundo só com a prova aberta */
let exClockT=null;
function exClockTick(){clearInterval(exClockT);const upd=()=>{const b=document.getElementById("exClock");if(!b||!exRun||exRun.view!=="q"){clearInterval(exClockT);exClockT=null;return}
    const ex=exams.find(x=>x.id===exRun.id);if(!ex){clearInterval(exClockT);return}const S=exScore(ex),cur=exRun.shown?(Date.now()-exRun.shown)/1000:0,a=exPg(ex.id).a[exRun.i];b.textContent=fmtClock(S.s+(a?0:cur))};
  upd();exClockT=setInterval(upd,1000)}
const fmtClock=s=>{s=Math.max(0,Math.round(s));const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return (h?h+":"+String(m).padStart(2,"0"):m)+":"+String(x).padStart(2,"0")};
function exPlayEl(ex){const R=exRun,P=exPg(ex.id),c=el(`<div class="explay"></div>`);
  if(R.view==="res"){const S=exScore(ex),areas={};ex.qs.forEach((r,i)=>{const a=P.a[i];if(!a||r.an||!r.q.correta)return;const it=r.k&&BYKEY[r.k],lab=it?it.area.name:"Sem tema",x=areas[lab]||(areas[lab]={c:0,q:0});x.q++;if(a.l===r.q.correta)x.c++});
    c.appendChild(el(`<div class="kpis simres"><div class="kpi"><span class="kl">Acerto</span><b>${pct(S.hit,S.ans)}%</b><span class="ks">${S.hit} de ${S.ans}</span></div><div class="kpi"><span class="kl">Tempo total</span><b>${fmtPace(S.s)}</b><span class="ks">${S.ans} respondidas</span></div><div class="kpi${S.ans&&S.s/S.ans>ui.prefs.qpace?" alert":""}"><span class="kl">Por questão</span><b>${S.ans?fmtPace(S.s/S.ans):"–"}</b><span class="ks">prova: ${fmtPace(ui.prefs.qpace)}</span></div></div>`));
    {const lp=exLostEl(ex,R);if(lp){lp.classList.add("exlostbox");c.appendChild(lp)}}
    const rows=Object.entries(areas).sort((a,b)=>b[1].q-a[1].q).map(([k,v])=>[k,v.c,v.q]);if(rows.length>1){const f=el(`<figure class="chart exareas"><figcaption>Acerto por área</figcaption><div class="qsrows"></div></figure>`);f.querySelector("div").innerHTML=hbarRows(rows);c.appendChild(f)}
    const ul=el(`<ol class="simlist exres"></ol>`);ex.qs.forEach((r,i)=>{const a=P.a[i],ok=a&&a.l===r.q.correta,li=el(`<li><span class="simok ${r.an?"":a?ok?"ok":"no":""}">${r.an?"·":a?ok?"✓":"✗":"–"}</span><button class="link" type="button"></button><span class="simt"></span></li>`);
      const b=li.querySelector("button");b.textContent=`Questão ${r.n||i+1}${r.k&&BYKEY[r.k]?" · "+BYKEY[r.k].t:""}`;b.onclick=()=>{exRun={id:ex.id,view:"rev",i,cad:R.cad||{}};render();const h=$("#exh");if(h)h.scrollIntoView({block:"start"})};
      li.querySelector(".simt").textContent=r.an?"anulada":a&&a.s?fmtPace(a.s):"";ul.appendChild(li)});c.appendChild(ul);
    const wrong=ex.qs.filter((r,i)=>P.a[i]&&r.q.correta&&!r.an&&P.a[i].l!==r.q.correta).length;
    c.appendChild(el(`<p class="how">${wrong?`${wrong} ${wrong===1?"errada foi":"erradas foram"} para Refazer as que errei. `:""}O resultado entrou no acerto de cada tema, como “${esc(exSrc(ex))}” em Acerto por banca. Toque numa questão para ver o comentário.</p>`));
    const b=el(`<div class="btns"></div>`),x=el(`<button class="btn" type="button">Voltar às provas</button>`);x.onclick=()=>{exRun=null;render()};b.appendChild(x);c.appendChild(b);return c}
  const i=R.i,review=R.view==="rev";c.appendChild(exQuestionEl(ex,i,review));
  const acts=el(`<div class="btns"></div>`),prev=el(`<button class="btn" type="button" id="exPrev">Anterior</button>`),nx=el(`<button class="btn primary" type="button" id="exNext"></button>`);
  prev.disabled=i===0;prev.onclick=()=>exGo(ex,i-1);
  if(review){nx.textContent="Voltar ao resultado";nx.onclick=()=>{exRun={id:ex.id,view:"res",i:0,cad:R.cad};render()};acts.append(prev);
    const n2=el(`<button class="btn" type="button">Próxima</button>`);n2.disabled=i>=ex.qs.length-1;n2.onclick=()=>exGo(ex,i+1);acts.append(n2,nx)}
  else{const last=i>=ex.qs.length-1;nx.textContent=last?"Finalizar prova":"Próxima";nx.onclick=()=>last?exFinish(ex):exGo(ex,i+1);acts.append(prev,nx);
    const S=exScore(ex),fin=el(`<button class="btn" type="button" id="exEnd"></button>`);fin.textContent=exArm==="end"+ex.id?`Toque de novo: finalizar com ${S.ans} de ${S.n} respondidas`:"Finalizar agora";if(exArm==="end"+ex.id)fin.classList.add("warn");
    fin.onclick=()=>{if(exArm==="end"+ex.id){exArm=null;exFinish(ex)}else{exArm="end"+ex.id;render()}};if(!last)acts.append(fin);
    const pause=el(`<button class="link" type="button">Pausar (continua depois)</button>`);pause.onclick=()=>{exRun=null;exFlush();render()};acts.append(pause)}
  c.appendChild(acts);
  // mapa das questões
  const map=el(`<div class="exmap" role="group" aria-label="Ir para a questão"></div>`);ex.qs.forEach((r,j)=>{const a=P.a[j],b=el(`<button type="button"></button>`);b.textContent=r.n||j+1;
    if(j===i)b.setAttribute("aria-current","true");if(r.an)b.classList.add("an");else if(a&&(review||P.mode==="e")&&r.q.correta)b.classList.add(a.l===r.q.correta?"ok":"no");else if(a)b.classList.add("done");b.onclick=()=>exGo(ex,j);map.appendChild(b)});
  /* Lote 20D: no computador (2 colunas) o mapa fica fixo ao lado, com o relógio da prova; no celular continua recolhido */
  if(twoCols()){c.classList.add("exside");const S=exScore(ex),as=el(`<aside class="exaside"><div class="exclock"><span class="glabel">Tempo de prova</span><b id="exClock"></b><span class="exck2"></span></div><span class="glabel"></span></aside>`);
    as.querySelector(".exck2").textContent=S.ans?`${fmtPace(S.s/S.ans)} por questão · meta ${fmtPace(ui.prefs.qpace)}`:`meta ${fmtPace(ui.prefs.qpace)} por questão`;
    as.querySelector(":scope > .glabel").textContent=`${Object.keys(P.a).length} de ${ex.qs.length} respondidas`;as.appendChild(map);
    const lg=el(`<p class="exmapl"><span class="done">respondida</span>${review||P.mode==="e"?`<span class="ok">certa</span><span class="no">errada</span>`:""}<span class="an">anulada</span></p>`);as.appendChild(lg);
    const qa=el(`<div class="expmain"></div>`);while(c.firstChild)qa.appendChild(c.firstChild);c.append(qa,as);if(exNarrow)c.classList.add("exnarrow");setTimeout(()=>{exClockTick();if(c.isConnected){exNarrow=c.getBoundingClientRect().width<720;c.classList.toggle("exnarrow",exNarrow)}},0)}
  else{const md=el(`<details class="plain exmapd"><summary></summary></details>`);md.querySelector("summary").textContent=`Todas as questões · ${Object.keys(P.a).length} de ${ex.qs.length} respondidas`;md.appendChild(map);c.appendChild(md)}
  if(!review)(c.querySelector(".expmain")||c).appendChild(el(`<p class="how erkeys">${P.mode==="p"?"Modo prova: o resultado e os comentários aparecem no fim. Dá para voltar e trocar a resposta até finalizar.":"Modo estudo: a correção aparece a cada questão."} Teclado: A a E escolhem · → próxima · ← anterior${fullOn.ex&&twoCols()?" · Esc sai da tela inteira":""}</p>`));
  return c}
function exEditEl(ex){const S=exEdit,w=el(`<div class="exedit"></div>`);
  w.appendChild(el(`<p class="how hx">Mudar a resposta, anular ou trocar o tema recalcula o seu acerto nas questões que você já respondeu.</p>`));
  if(!S.T||!ex.qs[S.T.i])S.T=null;
  w.appendChild(exListEl(ex.qs,S,{pre:"e",T:S.T,setT:v=>{S.T=v;render()},
    setTopic:(i,k,add)=>{exChange(ex,i,r=>{if(add){if(k&&k!==r.k)r.ks=[...new Set([...(r.ks||[]),k])].slice(0,2)}else{r.k=k;r.ks=(r.ks||[]).filter(x=>x!==k);if(!k||!r.ks.length)delete r.ks}});exPut(ex);commit()},
    delTopic:(i,k)=>{exChange(ex,i,r=>{r.ks=(r.ks||[]).filter(x=>x!==k);if(!r.ks.length)delete r.ks});exPut(ex);commit()},
    setKey:(i,v)=>{exChange(ex,i,r=>{if(v==="X")r.an=true;else{r.an=false;r.q.correta=v;if(v)r.g="b"}});exPut(ex);commit()}}));
  const b=el(`<button class="btn" type="button">Fechar</button>`);b.onclick=()=>{exEdit=null;render()};w.appendChild(b);return w}
function exKeyEl(ex){const K=exKey,w=el(`<div class="exkey"></div>`),pk=parseKey(K.t),n=Object.keys(pk).length;
  const ta=el(`<textarea class="ntext exkta" id="exKeyTa" placeholder="Cole o gabarito oficial. Ex.: 1-A 2-C 3-D 4-ANULADA…"></textarea>`);ta.value=K.t;ta.oninput=debounced(()=>{K.t=ta.value;K.msg="";render()},300);
  if(!K.kst)K.kst=ex.kst==="p"?"d":ex.of&&!ex.qs.some(r=>r.g==="b")?"p":"d";{const g=el(`<div class="seg exkty" role="group" aria-label="Que gabarito é este"></div>`);[["p","Preliminar"],["d","Definitivo"]].forEach(([v,l])=>{const b=el(`<button type="button"></button>`);b.id="exKs-"+v;b.textContent=l;b.setAttribute("aria-pressed",K.kst===v);b.onclick=()=>{K.kst=v;render()};g.appendChild(b)});
    w.append(el(`<span class="glabel">Colar o gabarito oficial</span>`),g);if(ex.kst==="p")w.appendChild(el(`<p class="how">O gabarito desta prova é o <b>preliminar</b>. Quando sair o definitivo (depois dos recursos), cole aqui e escolha Definitivo: as questões que mudarem ganham o aviso "Gabarito mudou" e o seu acerto é recalculado.</p>`))}
  w.appendChild(ta);
  const st=el(`<p class="how"></p>`);st.textContent=K.msg||(n?`${n} ${n===1?"resposta reconhecida":"respostas reconhecidas"}.`:"Aceita “1-A”, “01. B”, “3 D”, “4 ANULADA” ou uma tabela com os números numa linha e as letras na de baixo.");w.appendChild(st);
  const b=el(`<div class="btns"></div>`),ap=el(`<button class="btn primary" type="button" id="exKeyGo">Aplicar gabarito</button>`);ap.disabled=!n;
  ap.onclick=()=>{let m=0,ch=0;const toD=ex.kst==="p"&&K.kst==="d";ex.qs.forEach((r,i)=>{const v=pk[r.n];if(!v)return;m++;const was=r.an+"|"+r.q.correta;
      exChange(ex,i,r=>{if(v==="X"){r.an=true;r.g="b"}else if(r.q.alternativas.some(a=>a.letra===v)){if(!r.ck)r.ck=r.q.correta;r.an=false;r.q.correta=v;r.g="b"}});if(was!==r.an+"|"+r.q.correta){ch++;if(toD)ex.qs[i].kd=1}});if(m)ex.kst=K.kst;
    const P=exPg(ex.id);if(P.fin&&P.tries.length){const S=exScore(ex),t=P.tries[P.tries.length-1];t.hit=S.hit;t.n=S.ans}
    exPut(ex);exPSave(ex.id);K.t="";K.msg=`Gabarito aplicado a ${m} ${m===1?"questão":"questões"}. ${ch?`${ch} ${ch===1?"mudou":"mudaram"} (resposta ou anulação) e o seu acerto foi recalculado.`:"Nenhuma resposta mudou."}${ex.kst==="p"?" Marcado como gabarito preliminar.":""}`;bankFeedSoon();commit()};
  const cl=el(`<button class="btn" type="button">Fechar</button>`);cl.onclick=()=>{exKey=null;render()};b.append(ap,cl);w.appendChild(b);return w}
function exRowCard(ex){const P=exPg(ex.id),S=exScore(ex),nAns=Object.keys(P.a).length,nb=ex.qs.filter(r=>r.g==="b"||r.an).length,run=exRun&&exRun.id===ex.id,N=ex.qs.length;
  const stt=P.fin?"fin":nAns?"run":"new";
  const li=el(`<li class="excard" data-st="${stt}" id="exr-${ex.id}"><div class="exch"><b class="exname"></b><span class="exstat"></span></div><p class="exmeta"></p><div class="exmain2"></div><div class="exsec"></div></li>`);
  li.querySelector(".exname").textContent=ex.name;
  li.querySelector(".exmeta").textContent=[[ex.banca,ex.ano].filter(Boolean).join(" "),`${N} ${N===1?"questão":"questões"}`,ex.of?`prova oficial${ex.niv?" "+ex.niv:""}`:"",ex.of&&!ex.qs.some(r=>r.g==="b"&&!r.an)?"sem gabarito: cole o oficial":nb===N?(ex.kst==="p"?"gabarito preliminar":"gabarito da banca"):nb?`gabarito da banca em ${nb}`:"gabarito do Claude"].filter(Boolean).join(" · ");
  const st=li.querySelector(".exstat"),last=P.tries[P.tries.length-1];
  st.textContent=P.fin?`Feita · ${pct(S.hit,S.ans)}%`:nAns?"Em andamento":"Não iniciada";
  const M=li.querySelector(".exmain2"),B=li.querySelector(".exsec");
  if(P.fin){const d=el(`<p class="exline"></p>`);d.textContent=`${S.hit} de ${S.ans} certas em ${br(P.fin)}${P.tries.length>1?` · ${P.tries.length} tentativas`:""}`;M.appendChild(d);
    /* Lote 20D: acerto por área em miniatura */
    const A={};ex.qs.forEach((r,i)=>{const a=P.a[i];if(!a||r.an||!r.q.correta)return;const it=r.k&&BYKEY[r.k],k=it?it.area.code:"—",x=A[k]||(A[k]={c:0,q:0});x.q++;if(a.l===r.q.correta)x.c++});
    const E=Object.entries(A).filter(([k])=>k!=="—").sort((a,b)=>b[1].q-a[1].q).slice(0,5);if(E.length>1){const m=el(`<div class="exmini" aria-label="Acerto por área"></div>`);
      E.forEach(([k,v])=>{const p=Math.round(v.c/v.q*100),s=el(`<span class="exmi"><span class="exmk"></span><span class="exmb"><i></i></span><b></b></span>`);s.querySelector(".exmk").textContent=k;s.querySelector("i").style.width=p+"%";s.querySelector("b").textContent=p+"%";s.querySelector("b").className=p>=80?"hv-good":p>=60?"hv-warn":"hv-bad";s.title=`${(AREAS.find(a=>a.code===k)||{name:k}).name}: ${v.c} de ${v.q}`;m.appendChild(s)});M.appendChild(m)}}
  else if(nAns){const w=Math.round(nAns/N*100),pg=el(`<div class="exprog"><span class="exbar"><i style="width:${w}%"></i></span><span class="exline"></span></div>`);pg.querySelector(".exline").textContent=`${nAns} de ${N} respondidas · ${P.mode==="e"?"Modo estudo":"Modo prova"}`;M.appendChild(pg)}
  else{const sg=el(`<div class="seg exmode" role="group" aria-label="Modo"></div>`);[["p","Modo prova"],["e","Modo estudo"]].forEach(([v,l])=>{const b=el(`<button type="button" aria-pressed="${P.mode===v}"></button>`);b.id=`exm-${ex.id}-${v}`;b.textContent=l;b.onclick=()=>{P.mode=v;exPSave(ex.id);render()};sg.appendChild(b)});M.appendChild(sg);
    M.appendChild(el(`<p class="how exmodeh">${P.mode==="p"?"Resultado e comentários só no fim, como na prova de verdade.":"Correção e comentário logo depois de cada questão."}</p>`));
    if(last){const d=el(`<p class="exline"></p>`);d.textContent=`Última tentativa: ${pct(last.hit,last.n)}% em ${br(last.d)}`;M.appendChild(d)}}
  const go=el(`<button class="btn primary exgo" type="button"></button>`);go.id=`exgo-${ex.id}`;go.textContent=P.fin?"Ver resultado":nAns?"Continuar":"Começar";
  go.onclick=()=>{if(P.fin){exRun={id:ex.id,view:"res",i:0,cad:{}};exEdit=null;render();setTimeout(()=>{const h=$("#exh");if(h)h.scrollIntoView({block:"start"})},40)}else exStart(ex)};if(!run)M.appendChild(go);
  {const L=(ex.links||[]).map(exLinkLabel).filter(Boolean);if(L.length){const p=el(`<p class="exlk"></p>`);p.textContent="Ligada a: "+L.join(", ");li.querySelector(".exmeta").after(p)}}
  const sb=(id,t,on,warn)=>{const b=el(`<button class="exsb" type="button"></button>`);b.id=id;b.textContent=t;b.onclick=on;if(warn)b.classList.add("warn");B.appendChild(b);return b};
  if(P.fin)sb(`exre-${ex.id}`,exArm==="re"+ex.id?"Toque de novo: refazer do zero":"Refazer",()=>{if(exArm==="re"+ex.id){exArm=null;exStart(ex)}else{exArm="re"+ex.id;render()}},exArm==="re"+ex.id);
  const ed=sb(`exed-${ex.id}`,"Revisar questões",()=>{exEdit=exEdit&&exEdit.id===ex.id?null:{id:ex.id,flt:ex.qs.some(r=>exFilterOk(r,"chk"))?"chk":"all",show:12,T:null};exKey=null;render()});ed.setAttribute("aria-expanded",!!(exEdit&&exEdit.id===ex.id));
  const lk=sb(`exlk-${ex.id}`,(ex.links||[]).length?"Ligações":"Ligar a temas",()=>{exLinkEd=exLinkEd&&exLinkEd.id===ex.id?null:{id:ex.id,q:""};exEdit=null;exKey=null;render()});lk.setAttribute("aria-expanded",!!(exLinkEd&&exLinkEd.id===ex.id));
  const kb=sb(`exkb-${ex.id}`,"Colar gabarito",()=>{exKey=exKey&&exKey.id===ex.id?null:{id:ex.id,t:"",msg:""};exEdit=null;render();setTimeout(()=>{const t=$("#exKeyTa");if(t)t.focus()},40)});kb.setAttribute("aria-expanded",!!(exKey&&exKey.id===ex.id));
  {const c=cmLineEl(ex);if(c)li.querySelector(".exmeta").after(c)}
  {const nc=cmNeed(ex).length;if(nc&&sampleFn&&!(cmRun&&cmRun.st==="run"))sb(`excm-${ex.id}`,`✦ Comentar ${nc} sem comentário`,()=>cmGo(ex,cmNeed(ex))).title="O Claude escreve o comentário (por que a certa está certa e por que cada errada não serve), em partes de 10; fica guardado"}
  sb(`exjc-${ex.id}`,"Juntar gabarito e comentários",()=>cjPick(ex)).title="Arquivo .json preparado pelo Claude com o gabarito e o comentário de cada questão desta prova";
  if(cjMsg&&cjMsg.id===ex.id){const m=el(`<p class="exline cmline" role="status"></p>`);m.textContent=cjMsg.t;li.querySelector(".exmeta").after(m)}
  {const nd=ex.qs.filter(r=>r.sbd&&r.k).length;if(nd){const b=sb(`exsbd-${ex.id}`,`Conferir subtópicos (${nd})`,()=>{sbEd=sbEd&&sbEd.id===ex.id?null:{id:ex.id,show:10};exEdit=null;exKey=null;render()});b.setAttribute("aria-expanded",!!(sbEd&&sbEd.id===ex.id))}}
  {const mb=sb(`exmod-${ex.id}`,ex.mod?"✓ Modelo da faculdade":"Usar como modelo da faculdade",()=>{if(ex.mod)delete ex.mod;else ex.mod=1;exPut(ex);render()});mb.setAttribute("aria-pressed",!!ex.mod);mb.title="Prova da sua faculdade: o gerador e o simulado imitam o jeito dela de cobrar (tamanho do caso, nº de alternativas, forma de perguntar)"}
  sb(`exdel-${ex.id}`,exArm==="del"+ex.id?"Toque de novo para excluir (vai para a lixeira)":"Excluir",()=>{if(exArm==="del"+ex.id){exArm=null;exDel(ex.id)}else{exArm="del"+ex.id;render()}},exArm==="del"+ex.id).classList.add("exdelb");
  if(exKey&&exKey.id===ex.id)li.appendChild(exKeyEl(ex));
  if(exLinkEd&&exLinkEd.id===ex.id)li.appendChild(exLinksEl(ex));
  if(exEdit&&exEdit.id===ex.id)li.appendChild(exEditEl(ex));
  if(sbEd&&sbEd.id===ex.id)li.appendChild(sbEditEl(ex));
  return li}
let exNarrow=false;
function qExamCard(){const c=el(`<section class="card qexam" aria-labelledby="exh"><div class="dhead"><h2 id="exh">Provas na íntegra</h2></div></section>`);
  const run=exRun&&exams.find(x=>x.id===exRun.id);if(exRun&&!run)exRun=null;
  if(run){const h=c.querySelector(".dhead"),s=el(`<span class="todaydate"></span>`);s.textContent=run.name;h.appendChild(s);if(twoCols()||isPhoneL())h.appendChild(fullBtn("ex"));c.appendChild(exPlayEl(run));return c}
  if(!imp){const b=el(`<button class="btn primary" type="button" id="impNew">+ Importar prova</button>`);b.disabled=!sampleFn;if(sampleOff)b.title="O Claude não está disponível nesta visualização";b.onclick=impNew;c.querySelector(".dhead").appendChild(b)}
  if(imp)c.appendChild(impPanel());else if(!qLegacy())c.appendChild(ofCardEl());
  if(!exams.length){if(!imp)c.appendChild(el(`<p class="cempty">Importe o PDF de uma prova antiga (com ou sem gabarito) e faça a prova aqui, no modo prova ou no modo estudo. Cada questão entra no acerto do tema e da banca, e as erradas vão para Refazer.</p>`));return c}
  /* Lote 20D: busca e filtros no padrão (situação, banca, faculdade) e grupos por banca · ano */
  const stOf=ex=>{const P=exPg(ex.id);return P.fin?"fin":Object.keys(P.a).length?"run":"new"},bk=ex=>(ex.banca||"").trim()||"Sem banca";
  const qq=norm((exF.q||"").trim()),base=exams.filter(ex=>!qq||norm([ex.name,ex.banca,ex.ano].join(" ")).includes(qq));
  const okSt=ex=>exF.st==="all"||stOf(ex)===exF.st,okB=ex=>!exF.b||bk(ex)===exF.b,okM=ex=>!exF.fac||!!ex.mod,L=base.filter(ex=>okSt(ex)&&okB(ex)&&okM(ex));
  if(exams.length>2){const bar=el(`<div class="exfind"><div class="tfsearch">${FC_ICO}<input class="search" id="exQ" type="search" placeholder="Buscar prova (nome, banca, ano)" autocomplete="off"></div></div>`),qi=bar.querySelector("input");qi.value=exF.q||"";
    qi.oninput=debounced(()=>{exF.q=qi.value;render();const x=$("#exQ");if(x){x.focus();x.setSelectionRange(x.value.length,x.value.length)}});
    const sb=base.filter(ex=>okB(ex)&&okM(ex));bar.appendChild(fcPer("exSt",exF.st,v=>{exF.st=v;exFSave()},[["all",`Todas · ${sb.length}`],["new",`Não feitas · ${sb.filter(e=>stOf(e)==="new").length}`],["run",`Em andamento · ${sb.filter(e=>stOf(e)==="run").length}`],["fin",`Feitas · ${sb.filter(e=>stOf(e)==="fin").length}`]],"Situação"));
    const bs=[...new Set(exams.map(bk))].sort(),bb=base.filter(ex=>okSt(ex)&&okM(ex)),ch=[];
    if(bs.length>1)bs.forEach((b,i)=>ch.push(fcChip(`${b} · ${bb.filter(e=>bk(e)===b).length}`,exF.b===b,()=>{exF.b=exF.b===b?"":b;exFSave()},"exB-"+i)));
    if(exams.some(e=>e.mod))ch.push(fcChip(`Da faculdade · ${base.filter(e=>okSt(e)&&okB(e)&&e.mod).length}`,exF.fac,()=>{exF.fac=!exF.fac;exFSave()},"exFac"));
    if(ch.length)bar.appendChild(fcChips(ch));c.appendChild(bar)}
  if(!L.length){c.appendChild(el(`<p class="cempty">Nenhuma prova com esses filtros.</p>`));return c}
  const G={};L.forEach(ex=>{const g=bk(ex);(G[g]=G[g]||[]).push(ex)});const gs=Object.keys(G).sort((a,b)=>a==="Sem banca"?1:b==="Sem banca"?-1:a.localeCompare(b));
  gs.forEach((g,gi)=>{const shut=exGrpShut.has(g)&&!exF.b;if(gs.length>1||exams.length>2){/* Lote 21: grupo por banca recolhível */
      const h=el(`<h3 class="exgrp"><button type="button" class="exgrpb"><span class="exgar" aria-hidden="true"></span><span class="exgn"></span><small></small></button></h3>`),bt=h.querySelector("button");bt.id="exG-"+gi;bt.setAttribute("aria-expanded",!shut);
      h.querySelector(".exgar").textContent=shut?"▸":"▾";h.querySelector(".exgn").textContent=g;h.querySelector("small").textContent=`${G[g].length} ${G[g].length===1?"prova":"provas"}`;
      bt.onclick=()=>{shut?exGrpShut.delete(g):exGrpShut.add(g);lsSet("resid-exgrp",JSON.stringify([...exGrpShut]));render()};c.appendChild(h)}
    if(shut)return;const ol=el(`<ol class="excards"></ol>`);G[g].sort((a,b)=>String(b.ano||"").localeCompare(String(a.ano||""))||a.name.localeCompare(b.name)).forEach(ex=>ol.appendChild(exRowCard(ex)));c.appendChild(ol)});return c}
let exGrpShut=(()=>{try{const v=JSON.parse(localStorage.getItem("resid-exgrp")||"[]");return new Set(Array.isArray(v)?v.filter(x=>typeof x==="string"):[])}catch(e){return new Set()}})();
let exF=(()=>{try{const v=JSON.parse(localStorage.getItem("resid-exf")||"{}");return {q:"",st:["new","run","fin"].includes(v.st)?v.st:"all",b:typeof v.b==="string"?v.b:"",fac:!!v.fac}}catch(e){return {q:"",st:"all",b:"",fac:false}}})();
const exFSave=()=>lsSet("resid-exf",JSON.stringify({st:exF.st,b:exF.b,fac:exF.fac}));
document.addEventListener("keydown",ev=>{if(view!=="quest"||!exRun)return;const t=ev.target;if(t&&/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)||ev.metaKey||ev.ctrlKey||ev.altKey)return;
  if(ev.key==="Escape"&&fullOn.ex&&twoCols()){ev.preventDefault();fullSet("ex",false);return}if(exRun.view==="res")return;
  const ex=exams.find(x=>x.id===exRun.id);if(!ex)return;const k=ev.key;
  if(/^[a-hA-H]$/.test(k)&&exRun.view==="q"){const r=ex.qs[exRun.i],L=k.toUpperCase();if(r&&r.q.alternativas.some(a=>a.letra===L)&&!(exPg(ex.id).mode==="e"&&exPg(ex.id).a[exRun.i])){ev.preventDefault();exAnswer(ex,exRun.i,L)}}
  else if(k==="ArrowRight"){ev.preventDefault();if(exRun.i<ex.qs.length-1)exGo(ex,exRun.i+1)}else if(k==="ArrowLeft"){ev.preventDefault();if(exRun.i>0)exGo(ex,exRun.i-1)}});
