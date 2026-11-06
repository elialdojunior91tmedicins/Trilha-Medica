/* ----- ler imagem ----- */
let imgR=null;// {from:k|null,dest:"tema"|"livre",k,kind,blob,url,status,text,msg,ctl,title,q}
const IMG_KIND={slide:"Slide ou foto de livro",aula:"Aula ou apostila",artigo:"Artigo ou diretriz",mao:"Anotação à mão",esquema:"Esquema ou algoritmo",clinica:"Imagem clínica (ECG, raio X, lâmina, pele)"};
/* Lote 20C: vários arquivos (foto, PDF, Word, PowerPoint, texto). Texto grande vai em partes de até GM_MAX caracteres; o resultado é uma anotação só, com uma seção por parte. */
function docParts(files){const all=files.filter(f=>f.txt).map(f=>`##### Arquivo: ${f.name}\n${f.txt}`).join("\n\n"),out=[];if(!all)return out;let rest=all;
  while(rest.length>GM_MAX){let cut=rest.lastIndexOf("\n=== ",GM_MAX);if(cut<GM_MAX*.5)cut=rest.lastIndexOf("\n\n",GM_MAX);if(cut<GM_MAX*.5)cut=rest.lastIndexOf("\n",GM_MAX);if(cut<GM_MAX*.3)cut=GM_MAX;out.push(rest.slice(0,cut).trim());rest=rest.slice(cut)}
  if(rest.trim())out.push(rest.trim());return out}
function docPrompt(kind,it,txt,i,n,hasImg){return imgPrompt(kind,it).replace(/^Você é um professor de medicina ajudando um estudante que se prepara para a prova de residência no Brasil\. Analise a imagem anexada \(tipo informado: [^)]*\)/,
  `Você é um professor de medicina ajudando um estudante que se prepara para a prova de residência no Brasil. Analise o material abaixo${hasImg?" e as imagens anexadas":""} (tipo informado: ${IMG_KIND[kind]}${n>1?`; esta é a parte ${i+1} de ${n}, escreva só sobre ela`:""})`)
  .replace("## O que a imagem mostra","## O que o material traz").replace("Não invente o que não está na imagem.","Não invente o que não está no material.")+`

Material:
"""
${txt}
"""`}
function imgPrompt(kind,it){return `Você é um professor de medicina ajudando um estudante que se prepara para a prova de residência no Brasil. Analise a imagem anexada (tipo informado: ${IMG_KIND[kind]})${it?` sobre o tema "${it.t}" (${areaLabel(it)})`:""} e escreva uma anotação de estudo em Markdown, em português do Brasil, com estas seções:

## O que a imagem mostra
Transcreva e organize o conteúdo essencial (tópicos curtos; tabelas viram tabela em Markdown com | ). Se algo estiver ilegível, escreva [ilegível]. Não invente o que não está na imagem.

## Explicação
Explique de forma didática o que é importante para a prova: conceitos, critérios, condutas e o porquê.${kind==="clinica"?" Descreva os achados visíveis, as hipóteses mais prováveis e o que confirmaria cada uma. Deixe claro que é material de estudo, não laudo.":""}

## Fluxograma
Um fluxograma do raciocínio ou da conduta, num bloco de código com a palavra fluxo, exatamente neste formato:
\`\`\`fluxo
Primeira etapa
Segunda etapa
? Pergunta de decisão
  Sim: conduta → próxima etapa
  Não: outra conduta
Etapa final
\`\`\`
(uma etapa por linha; linhas começando com ? são decisões; os caminhos ficam recuados com dois espaços e começam com o rótulo e dois-pontos; use → para encadear etapas dentro de um caminho; no máximo 10 linhas)

## Pegadinhas
De 1 a 3 linhas começando com "> ", com o que costuma cair ou confundir.

Use **negrito** só para termos-chave. Seja objetivo.`}
async function imgShrink(file){// reduz para no máximo 1600 px (JPEG), para enviar mais leve
  try{const bmp=await createImageBitmap(file),sc=Math.min(1,1600/Math.max(bmp.width,bmp.height)),cv=document.createElement("canvas");cv.width=Math.round(bmp.width*sc);cv.height=Math.round(bmp.height*sc);
    cv.getContext("2d").drawImage(bmp,0,0,cv.width,cv.height);return await new Promise(r=>cv.toBlob(b=>r(b||file),"image/jpeg",0.85))}catch(e){return file}}
async function imgRun(){const R=imgR;if(!R||!(R.blob||(R.files||[]).some(f=>f.txt))||!sampleFn)return;
  if((R.files||[]).some(f=>f.txt))return docRun(R);R.status="loading";R.text="";R.msg="";R.ctl=new AbortController();render();
  try{const lim=sampleFn.limits?await sampleFn.limits():{images:false};const it=R.dest==="tema"&&R.k?BYKEY[R.k]:null;
    const r=await sampleFn(imgPrompt(R.kind,it),{images:(R.files||[]).filter(f=>f.blob).map(f=>f.blob).slice(0,GM_IMG).concat(R.files&&R.files.some(f=>f.blob)?[]:[R.blob]),signal:R.ctl.signal,cache:false,modelTier:"default",onText:({text})=>{if(imgR===R){R.text=text;const v=$("#imgOut");if(v)v.innerHTML=md(text)}}});
    if(imgR!==R)return;R.text=(r&&r.text)||R.text;R.status=R.text.trim()?"done":"error";if(!R.text.trim())R.msg="O Claude não devolveu texto. Tente de novo.";if(!lim.images&&!window.__site)R.msg=""}
  catch(e){if(imgR!==R)return;const code=e&&e.code;if(code==="cancelled"){R.status="ready";render();return}R.status="error";
    R.msg=code==="not_granted"?"Você não permitiu o uso do Claude por este app.":GEN_OFF.includes(code)?"A leitura de imagem não está disponível nesta visualização.":(GEN_ERR[code]||"Não foi possível ler a imagem agora. Tente de novo.")}
  render()}
async function docRun(R){const parts=docParts(R.files),imgs=[...R.files.filter(f=>f.blob).map(f=>f.blob),...R.files.flatMap(f=>(f.imgs||[]).filter(x=>x instanceof Blob))].slice(0,GM_IMG),it=R.dest==="tema"&&R.k?BYKEY[R.k]:null;
  R.status="loading";R.text="";R.msg="";R.ctl=new AbortController();R.part=[0,parts.length];render();const done=[];
  try{for(let i=0;i<parts.length;i++){R.part=[i,parts.length];render();
      const r=await sampleFn(docPrompt(R.kind,it,parts[i],i,parts.length,i===0&&imgs.length>0),{images:i===0&&imgs.length?imgs:undefined,signal:R.ctl.signal,cache:false,modelTier:"default",title:parts.length>1?`Ler arquivo com o Claude · parte ${i+1} de ${parts.length}`:"Ler arquivo com o Claude",hint:"Cole aqui a anotação que o Claude escreveu.",
        onText:({text})=>{if(imgR===R){R.text=[...done,(parts.length>1?`## Parte ${i+1} de ${parts.length}\n\n`:"")+text].join("\n\n");const v=$("#imgOut");if(v)v.innerHTML=md(R.text)}}});
      if(imgR!==R)return;const t=String(r&&r.text||"").trim();if(!t)throw Object.assign(new Error("vazio"),{code:"empty"});
      done.push((parts.length>1?`## Parte ${i+1} de ${parts.length}\n\n`:"")+t.replace(/^#\s/gm,"## ").replace(/^##\s/gm,parts.length>1?"### ":"## "));R.text=done.join("\n\n")}
    R.status="done";R.part=null}
  catch(e){if(imgR!==R)return;const code=e&&e.code;R.part=null;if(code==="cancelled"&&!done.length){R.status="ready";render();return}
    R.text=done.join("\n\n");R.status=done.length?"done":"error";R.msg=done.length?`Parei na parte ${done.length+1}: salve o que veio ou leia de novo.`:code==="not_granted"?"Você não permitiu o uso do Claude por este app.":code==="empty"?"O Claude não devolveu texto. Tente de novo.":(GEN_ERR[code]||"Não foi possível ler o arquivo agora. Tente de novo.")}
  render()}
function imgSave(){const R=imgR;if(!R||!R.text.trim())return;const fromDoc=(R.files||[]).some(f=>f.txt),stamp=`\n\n_Gerado pelo Claude a partir de ${fromDoc?`${R.files.length===1?"um arquivo":R.files.length+" arquivos"} (${R.files.map(f=>f.name).join(", ").slice(0,160)})`:"uma imagem"} em ${br(today())}/${today().slice(0,4)}. Confira com a fonte._`;
  if(R.dest==="tema"){if(!R.k)return;const cur=(notes[R.k]||"").replace(/\s+$/,"");replaceNote(R.k,(cur?cur+"\n\n---\n\n":"")+R.text.trim()+stamp);const k=R.k;imgR=null;noteMode[k]="ler";detTab[k]="notas";openTopic(k);return}
  const x=frClean({id:"fr"+Date.now().toString(36)+Math.random().toString(36).slice(2,6),t:R.title.trim()||(fromDoc?(R.files[0].name||"Arquivo").replace(/\.[a-z0-9]+$/i,""):"Imagem lida pelo Claude"),b:R.text.trim()+stamp,tags:[fromDoc?"arquivo":"imagem"],ks:R.k?[R.k]:[],at:new Date().toISOString()});
  freeN.push(x);frPut(x);imgR=null;nSeg="livre";try{localStorage.setItem("resid-nseg2","livre")}catch(e){}backStack=[];setView("notas");setTimeout(()=>{const c=document.getElementById("fr-"+x.id);if(c)c.scrollIntoView({behavior:"smooth",block:"center"})},80)}
function imgStart(k){imgR={from:k||null,dest:k?"tema":"livre",k:k||null,kind:"slide",blob:null,url:"",files:[],status:"pick",text:"",msg:"",title:"",q:""};render();setTimeout(()=>{const p=$("#imgPanel");if(p)p.scrollIntoView({behavior:"smooth",block:"center"})},60)}
function imgPanel(){const R=imgR,w=el(`<div class="imgpanel" id="imgPanel"><div class="dhead"><b>Ler arquivo com o Claude</b><button class="link" type="button">Fechar</button></div></div>`);
  w.querySelector(".dhead .link").onclick=()=>{if(R.ctl)R.ctl.abort();if(R.url)URL.revokeObjectURL(R.url);imgR=null;render()};
  if(sampleOff){w.appendChild(el(`<p class="err">O Claude não está disponível nesta visualização.</p>`));return w}
  // 1. imagem
  R.files=R.files||[];const pick=el(`<label class="btn imgpick"><input type="file" accept="${DOC_ACCEPT}" multiple hidden><span></span></label>`);pick.querySelector("span").textContent=R.files.length?"+ Mais arquivos":"Escolher arquivos ou tirar foto";
  pick.querySelector("input").onchange=async e=>{const fs=[...(e.target.files||[])];if(!fs.length)return;R.reading=true;render();
    for(const f of fs){if(docKind(f)==="img"){const b=await imgShrink(f);R.files.push({name:f.name||"foto.jpg",kind:"img",blob:b});if(!R.blob){R.blob=b;R.url=URL.createObjectURL(b)}}
      else{const m=await msReadOne(f,!window.__site,!!window.__site);R.files.push({name:f.name,kind:m.kind||docKind(f),txt:m.txt||"",imgs:m.imgs||[],err:m.err||"",note:m.note||"",scan:!!m.scan,pages:m.pages||0})}}
    R.reading=false;if(R.files.some(f=>f.txt||f.blob))R.status="ready";R.text="";render()};
  const row=el(`<div class="imgrow"></div>`);row.appendChild(pick);if(R.url&&!R.files.some(f=>f.txt)){const im=el(`<img class="imgprev" alt="Imagem escolhida">`);im.src=R.url;row.appendChild(im)}w.appendChild(row);
  if(R.reading)w.appendChild(el(`<p class="how">Lendo os arquivos no aparelho…</p>`));
  if(R.files.length){const ul=el(`<ul class="mslist dflist"></ul>`),KL={img:"foto",pdf:"PDF",docx:"Word",pptx:"PowerPoint",txt:"texto"};
    R.files.forEach((f,i)=>{const li=el(`<li><span class="msn"></span><small></small><button class="msx" type="button" aria-label="Tirar">×</button></li>`);li.querySelector(".msn").textContent=f.name;
      li.querySelector("small").textContent=f.err?f.err:[KL[f.kind]||f.kind,f.txt?`${Math.round(f.txt.length/1000)||1} mil caracteres`:"",f.pages?`${f.pages} ${f.kind==="pptx"?"slides":"págs."}`:"",f.note].filter(Boolean).join(" · ");if(f.err)li.classList.add("err");
      const x=li.querySelector(".msx");x.id="dfx-"+i;x.onclick=()=>{R.files.splice(i,1);if(f.blob===R.blob){if(R.url)URL.revokeObjectURL(R.url);const nb=R.files.find(z=>z.blob);R.blob=nb?nb.blob:null;R.url=nb?URL.createObjectURL(nb.blob):""}if(!R.files.some(z=>z.txt||z.blob))R.status="pick";render()};ul.appendChild(li)});w.appendChild(ul);
    const P=docParts(R.files);if(P.length>1)w.appendChild(el(`<p class="how">Arquivo grande: vai em ${P.length} partes (até ${Math.round(GM_MAX/1000)} mil caracteres cada); o resultado vira uma anotação só, com uma seção por parte.</p>`))}
  w.appendChild(el(`<p class="how hx">Lê foto, PDF, Word (.docx), PowerPoint (.pptx) e texto (.txt, .md); .doc e .ppt antigos: salve como .docx, .pptx ou PDF. O arquivo não fica salvo: só o texto que o Claude escrever, depois que você conferir.</p>`));
  // 2. tipo e destino
  const kd=el(`<div class="chips" role="group" aria-label="Tipo de imagem"></div>`);Object.entries(IMG_KIND).forEach(([v,l])=>{const b=el(`<button class="chip" type="button" aria-pressed="${R.kind===v}"></button>`);b.textContent=l;b.onclick=()=>{R.kind=v;render()};kd.appendChild(b)});
  w.append(el(`<span class="glabel">Tipo</span>`),kd);
  const ds=el(`<div class="seg" role="group" aria-label="Onde salvar"></div>`);[["tema","Na anotação de um tema"],["livre","No caderno livre"]].forEach(([v,l])=>{const b=el(`<button type="button" aria-pressed="${R.dest===v}"></button>`);b.textContent=l;b.onclick=()=>{R.dest=v;render()};ds.appendChild(b)});
  w.append(el(`<span class="glabel">Salvar</span>`),ds);
  if(R.dest==="tema"||R.dest==="livre"){const lab=R.dest==="tema"?"Tema":"Ligar a um tema (opcional)";
    if(R.k&&BYKEY[R.k]){const c=el(`<p class="qrsel"><b></b> <button class="link" type="button">trocar</button></p>`);c.querySelector("b").textContent=BYKEY[R.k].t;c.querySelector("button").onclick=()=>{R.k=null;render()};w.append(el(`<span class="glabel">${lab}</span>`),c)}
    else{const s=el(`<label class="ffield"><span class="glabel"></span><input class="etext" id="imgQ" type="search" placeholder="Buscar tema" autocomplete="off"></label>`);s.querySelector("span").textContent=lab;const i=s.querySelector("input");i.value=R.q;
      i.oninput=debounced(()=>{if(imgR!==R)return;R.q=i.value;render()});w.appendChild(s);const n=norm(R.q.trim());
      if(n.length>=2){const ul=el(`<ul class="qrres"></ul>`);[...ALL,...FAC_ITEMS].filter(x=>norm(x.t+" "+(x.sp||"")).includes(n)).slice(0,6).forEach(x=>{const li=el(`<li><button type="button" class="qrpick"><b></b><span></span></button></li>`);li.querySelector("b").textContent=x.t;li.querySelector("span").textContent=`${x.own?"FAC":x.area.code} · ${x.sp||""}`;li.querySelector("button").onclick=()=>{R.k=x.key;R.q="";render()};ul.appendChild(li)});w.appendChild(ul)}}
    if(R.dest==="livre"){const t=el(`<label class="ffield"><span class="glabel">Título</span><input class="etext" id="imgT" maxlength="120" placeholder="Ex.: Slide da aula de IAM"></label>`);const ti=t.querySelector("input");ti.value=R.title;ti.oninput=()=>R.title=ti.value;w.appendChild(t)}}
  if(R.kind==="clinica")w.appendChild(el(`<p class="pnote">Imagens clínicas: a leitura serve para estudar o raciocínio, não é laudo. O Claude pode errar achados; confira com a fonte e com o professor.</p>`));
  // 3. ler
  const go=el(`<button class="btn primary" type="button" id="imgGo"></button>`);go.textContent=R.status==="loading"?(R.part&&R.part[1]>1?`Lendo a parte ${R.part[0]+1} de ${R.part[1]}…`:"Lendo…"):R.text?"Ler de novo":"Ler com o Claude";go.disabled=!(R.blob||R.files.some(f=>f.txt))||R.status==="loading"||R.reading||!sampleFn||(R.dest==="tema"&&!R.k);
  if(R.dest==="tema"&&!R.k&&R.blob)go.title="Escolha o tema primeiro";go.onclick=imgRun;const gb=el(`<div class="btns"></div>`);gb.appendChild(go);
  if(R.status==="loading"){const st=el(`<button class="btn" type="button">Parar</button>`);st.onclick=()=>R.ctl&&R.ctl.abort();gb.appendChild(st)}w.appendChild(gb);
  if(window.__site&&R.status!=="done"){const tx=R.files.some(f=>f.txt),im=R.files.some(f=>f.blob||f.scan);
    if(im&&!tx)w.appendChild(el(`<p class="how">No site, o Claude é usado por copiar e colar: na janela que abrir, copie o pedido, abra o Claude, <b>anexe esta mesma imagem</b> na conversa e cole o pedido. Depois cole a resposta de volta aqui.</p>`));
    else if(tx)w.appendChild(el(`<p class="how">No site, o Claude é usado por copiar e colar: o texto dos arquivos já vai junto no pedido${im?"; <b>anexe também as fotos e os PDFs escaneados</b> na conversa":""}. Depois cole a resposta de volta aqui${docParts(R.files).length>1?" (uma vez por parte)":""}.</p>`))}
  if(R.msg){const m=el(`<p class="err"></p>`);m.textContent=R.msg;w.appendChild(m)}
  if(R.text){const pv=el(`<div class="aiprev"><div class="aihead"><span class="glabel">Prévia${R.status==="loading"?" · escrevendo…":""}</span></div><div class="mdview" id="imgOut"></div></div>`);pv.querySelector(".mdview").innerHTML=md(R.text);w.appendChild(pv);
    if(R.status==="done"){const ed=el(`<details class="plain"><summary>Editar o texto antes de salvar</summary><textarea class="ntext" id="imgTxt"></textarea></details>`);const ta=ed.querySelector("textarea");ta.value=R.text;ta.oninput=()=>{R.text=ta.value;const v=$("#imgOut");if(v)v.innerHTML=md(R.text)};w.appendChild(ed);
      const sv=el(`<button class="btn primary" type="button" id="imgSave"></button>`);sv.textContent=R.dest==="tema"?"Inserir na anotação do tema":"Salvar no caderno livre";sv.disabled=R.dest==="tema"&&!R.k;sv.onclick=imgSave;const b2=el(`<div class="btns"></div>`);b2.appendChild(sv);w.appendChild(b2)}}
  return w}
