/* ---------- material do estudante (opcional) para gerar questões ---------- */
/* materiais do estudante: VÁRIOS arquivos por pedido (genMat[chave] no gerador do tema, simMat no simulado).
   Conjunto: {items:[{id,name,txt,imgs,pages,ntext,scan,busy,err,note}], attach, busy}. O pedido junta tudo (msPack):
   cabe até GM_MAX caracteres e GM_IMG imagens; passando disso, corta um pouco de CADA material (não só o último) e avisa. */
let genMat={},simMat=null;const GM_MAX=30000,GM_IMG=4,GM_TOTAL=100000,FIG_MAX=30;
/* Lote 14: o material vai em PARTES de até GM_MAX caracteres (uma por pedido, revezando), somando até GM_TOTAL.
   Páginas com figura (imagem grande que não se repete em todas as páginas) viram "Figura N" (m.figs=[{page,blob}]); a parte leva as figuras das suas páginas. */
const msItemOk=i=>!i.busy&&!i.err&&!!(i.txt||(i.imgs&&i.imgs.length)||i.scan);
const genMatOn=S=>!!(S&&!S.busy&&(S.attach||(S.items||[]).some(msItemOk)));
/* ===== Lote 20C: leitor de arquivos no aparelho — Word (.docx), PowerPoint (.pptx) e texto (.txt/.md), além de PDF e foto =====
   .docx/.pptx são zip: lidos com o DecompressionStream do navegador (sem biblioteca). Títulos, listas e tabelas viram Markdown; imagens internas viram figuras. */
const DOC_ACCEPT="application/pdf,.pdf,image/*,.docx,.pptx,.txt,.md,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,.doc,.ppt";
const docKind=f=>{const n=(f.name||"").toLowerCase(),t=f.type||"";return /\.pdf$/.test(n)||t==="application/pdf"?"pdf":/^image\//.test(t)?"img":/\.docx$/.test(n)||/wordprocessingml/.test(t)?"docx":/\.pptx$/.test(n)||/presentationml/.test(t)?"pptx":/\.(txt|md|markdown)$/.test(n)||/^text\//.test(t)?"txt":/\.(doc|ppt)$/.test(n)?"old":""};
async function zipRead(buf){const u=new Uint8Array(buf),dv=new DataView(buf),out={};let e=u.length-22;while(e>=0&&dv.getUint32(e,true)!==0x06054b50)e--;if(e<0)throw new Error("zip");
  let n=dv.getUint16(e+10,true),p=dv.getUint32(e+16,true);const dec=new TextDecoder();
  for(let i=0;i<n;i++){if(dv.getUint32(p,true)!==0x02014b50)break;const meth=dv.getUint16(p+10,true),csz=dv.getUint32(p+20,true),nl=dv.getUint16(p+28,true),xl=dv.getUint16(p+30,true),cl=dv.getUint16(p+32,true),lo=dv.getUint32(p+42,true),name=dec.decode(u.subarray(p+46,p+46+nl));
    out[name]={meth,csz,lo};p+=46+nl+xl+cl}
  const get=async name=>{const x=out[name];if(!x)return null;const ln=dv.getUint16(x.lo+26,true),lx=dv.getUint16(x.lo+28,true),s=x.lo+30+ln+lx,data=u.slice(s,s+x.csz);if(x.meth===0)return data;
    if(x.meth!==8||typeof DecompressionStream==="undefined")throw new Error("deflate");const ds=new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));return new Uint8Array(await new Response(ds).arrayBuffer())};
  return {names:Object.keys(out),get,text:async n=>{const b=await get(n);return b?new TextDecoder().decode(b):""}}}
const xmlDoc=s=>new DOMParser().parseFromString(s,"application/xml");
const xT=(node,tag)=>[...node.getElementsByTagName(tag)];
async function docxRead(Z){const X=xmlDoc(await Z.text("word/document.xml")),body=X.getElementsByTagName("w:body")[0];if(!body)throw new Error("docx");const L=[];
  const runTxt=p=>xT(p,"w:r").map(r=>{const t=xT(r,"w:t").map(x=>x.textContent).join("")+(xT(r,"w:tab").length?" ":"");if(!t.trim())return t;const b=xT(r,"w:b").some(x=>x.getAttribute("w:val")!=="0"&&x.getAttribute("w:val")!=="false");return b?`**${t.trim()}** `:t}).join("").replace(/\*\*\s*\*\*/g,"").replace(/\s+/g," ").trim();
  const para=p=>{const st=(xT(p,"w:pStyle")[0]||{getAttribute:()=>""}).getAttribute("w:val")||"",t=runTxt(p);if(!t)return "";const h=st.match(/(?:Heading|T[íi]tulo|Ttulo)\s*(\d)/i)||(/^Title$/i.test(st)?[0,"1"]:null);
    if(h)return "#".repeat(Math.min(3,+h[1]+1))+" "+t.replace(/\*\*/g,"");const np=xT(p,"w:numPr")[0];if(np){const lv=+((xT(np,"w:ilvl")[0]||{getAttribute:()=>0}).getAttribute("w:val")||0);return "  ".repeat(lv)+"- "+t}return t};
  for(const n of [...body.childNodes]){if(n.nodeName==="w:p"){const t=para(n);L.push(t)}
    else if(n.nodeName==="w:tbl"){const rows=[...n.childNodes].filter(r=>r.nodeName==="w:tr").map(r=>[...r.childNodes].filter(x=>x.nodeName==="w:tc").map(tc=>xT(tc,"w:p").map(runTxt).filter(Boolean).join(" ").replace(/\|/g,"/")));
      if(rows.length){const nc=Math.max(...rows.map(r=>r.length));L.push("");rows.forEach((r,i)=>{while(r.length<nc)r.push("");L.push("| "+r.join(" | ")+" |");if(i===0)L.push("|"+" --- |".repeat(nc))});L.push("")}}}
  return L.join("\n").replace(/\n{3,}/g,"\n\n").trim()}
async function pptxRead(Z){const S=Z.names.filter(n=>/^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a,b)=>+a.match(/(\d+)\.xml/)[1]-+b.match(/(\d+)\.xml/)[1]),out=[];
  for(let i=0;i<S.length;i++){const X=xmlDoc(await Z.text(S[i])),ps=xT(X,"a:p").map(p=>{const t=xT(p,"a:t").map(x=>x.textContent).join("").replace(/\s+/g," ").trim();if(!t)return "";const lv=+(p.getElementsByTagName("a:pPr")[0]?.getAttribute("lvl")||0);return {t,lv}}).filter(Boolean);
    if(!ps.length)continue;const [h,...rest]=ps;out.push(`=== Slide ${i+1} ===\n## ${h.t}\n`+rest.map(x=>"  ".repeat(x.lv)+"- "+x.t).join("\n"))}
  return {txt:out.join("\n\n"),n:S.length}}
async function officeImgs(Z,dir,max){const out=[];for(const n of Z.names.filter(n=>n.startsWith(dir)&&/\.(png|jpe?g)$/i.test(n)).slice(0,max*3)){if(out.length>=max)break;const b=await Z.get(n);if(!b||b.length<12000)continue;/* ícones e logos pequenos ficam de fora */
    out.push(await imgShrink(new Blob([b],{type:/\.png$/i.test(n)?"image/png":"image/jpeg"})))}return out}
async function msReadOne(f,canImg,site){const isPdf=f.type==="application/pdf"||/\.pdf$/i.test(f.name),m={id:"m"+Date.now().toString(36)+Math.random().toString(36).slice(2,6),name:f.name,txt:"",imgs:[],note:"",err:""};
  try{if(isPdf){const o=await pdfOpenTxt(f);let txt="",nt=0,sc=[];o.pages.forEach(p=>{if(p.img){sc.push(p.n);return}txt+=`=== Página ${p.n} ===\n${p.t}\n\n`;nt++});
      m.txt=txt.trim();m.pages=o.pages.length;m.ntext=nt;m.figs=[];
      try{const fp=await pdfFigPages(o.doc,o.pages.map(p=>p.n));for(const x of fp.slice(0,FIG_MAX))m.figs.push({page:x.n,blob:await pdfFigImg(await o.doc.getPage(x.n),x.rs)});
        /* página quase sem texto mas com uma figura própria (slide só com a imagem): vira figura, não "página escaneada" */
        const fs=new Set(m.figs.map(f=>f.page));sc=sc.filter(n=>!fs.has(n));
        if(fp.length>FIG_MAX)m.note=(m.note?m.note+" ":"")+`Só as ${FIG_MAX} primeiras páginas com figura viram figura.`}catch(e){m.figs=[]}
      if(sc.length){if(!site&&canImg){for(const n of sc.slice(0,GM_IMG))m.imgs.push(await pdfPageImg(await o.doc.getPage(n)));if(sc.length>GM_IMG)m.note=`Só as ${GM_IMG} primeiras páginas sem texto vão como imagem.`}
        else if(site){m.scan=true;m.note=`${sc.length} ${sc.length===1?"página sem texto":"páginas sem texto"} (escaneadas): anexe o PDF na conversa do Claude quando colar o pedido.`}
        else m.note=`${sc.length} ${sc.length===1?"página sem texto ficou":"páginas sem texto ficaram"} de fora: esta visualização não envia imagens ao Claude.`}}
    else if(["docx","pptx","txt","old"].includes(docKind(f))){const K=docKind(f);if(K==="old"){m.err="Arquivo .doc ou .ppt antigo: salve como .docx, .pptx ou PDF e escolha de novo.";return m}
      if(K==="txt"){m.txt=(await f.text()).replace(/\r/g,"").trim();m.kind="txt"}
      else{const Z=await zipRead(await f.arrayBuffer());if(K==="docx"){m.txt=await docxRead(Z);m.kind="docx";if(canImg&&!site)m.imgs=await officeImgs(Z,"word/media/",3)}
        else{const P=await pptxRead(Z);m.txt=P.txt;m.pages=P.n;m.kind="pptx";if(canImg&&!site)m.imgs=await officeImgs(Z,"ppt/media/",3)}}}
    else if(/^image\//.test(f.type)){if(site){m.imgs=[true];m.note="No site, anexe esta imagem na conversa do Claude quando colar o pedido."}else if(canImg)m.imgs.push(await imgShrink(f));else m.err="Esta visualização não envia imagens ao Claude. Use um PDF com texto, ou o site."}
    else throw new Error("tipo");
    if(!m.txt&&!m.imgs.length&&!m.scan&&!m.err)m.err="Não achei texto neste arquivo. Ele fica de fora (as questões saem dos outros materiais ou sem material)."}
  catch(e){if(!m.err)m.err="Não consegui ler este arquivo. Ele fica de fora."}
  return m}
async function msAdd(get,set,files){files=[...(files||[])];if(!files.length)return;const site=!!window.__site;let S=get();if(!S){S={items:[],attach:false,busy:false};set(S)}
  let canImg=!site;if(!site)try{const lim=sampleFn&&sampleFn.limits?await sampleFn.limits():null;canImg=!!(lim&&lim.images)}catch(e){canImg=false}
  const ph=files.map(f=>({id:"p"+Math.random().toString(36).slice(2,8),name:f.name,busy:true,txt:"",imgs:[]}));S.items.push(...ph);S.busy=true;render();
  for(let i=0;i<files.length;i++){const m=await msReadOne(files[i],canImg,site);if(get()!==S)return;const j=S.items.indexOf(ph[i]);if(j>=0)S.items[j]=m;render()}
  S.busy=S.items.some(x=>x.busy);if(get()===S)render()}
/* junta os materiais no limite do pedido: divide o espaço por igual (quem é menor usa só o que precisa e sobra para os outros) */
function msPack(S){const ok=(S.items||[]).filter(msItemOk),site=!!window.__site,lens=ok.map(i=>i.txt.length),take=lens.map(()=>0);let left=GM_TOTAL-ok.length*60,idx=ok.map((_,i)=>i).filter(i=>lens[i]).sort((a,b)=>lens[a]-lens[b]);
  while(idx.length){const share=Math.floor(Math.max(0,left)/idx.length),i=idx[0];if(lens[i]<=share){take[i]=lens[i];left-=lens[i];idx.shift()}else{idx.forEach(j=>take[j]=share);left=0;idx=[]}}
  const parts=ok.map((m,i)=>{let t=m.txt;if(take[i]<lens[i]){t=t.slice(0,take[i]);const c=t.lastIndexOf("\n");if(c>take[i]*.7)t=t.slice(0,c)}return {name:m.name,txt:t,cut:take[i]<lens[i],pct:lens[i]?Math.round(t.length/lens[i]*100):100}});
  const scans=ok.flatMap(m=>m.imgs),imgCut=false,many=ok.length>1;
  const figs=[];ok.forEach((m,mi)=>(m.figs||[]).forEach(f=>figs.push({no:figs.length+1,mi,name:m.name,page:f.page,blob:f.blob})));
  /* partes: corta nas marcas de página, cada uma até GM_MAX, sem misturar páginas de dois materiais num mesmo pedaço sem o cabeçalho */
  const chunks=[];let cur={txt:"",pg:new Set()};const push=()=>{if(cur.txt.trim())chunks.push(cur);cur={txt:"",pg:new Set()}};
  parts.forEach((p,mi)=>{if(!p.txt)return;const head=many?`##### Material: ${p.name}\n`:"";let pgN=null,opened=false;
    p.txt.split(/(?==== Página \d+ ===)/).forEach(pc=>{const m=pc.match(/^=== Página (\d+) ===/);if(m)pgN=m[1];let t=pc;
      while(t.length){const room=GM_MAX-cur.txt.length-(opened?0:head.length+2);if(room<400&&cur.txt){push();opened=false;continue}
        const tk=t.length<=room?t:t.slice(0,Math.max(400,room));if(!opened){cur.txt+=(cur.txt?"\n\n":"")+head;opened=true}
        cur.txt+=tk;if(pgN)cur.pg.add(mi+":"+pgN);t=t.slice(tk.length);if(t.length){push();opened=false}}})});push();
  /* figura em página sem texto (fora de todas as partes): vai com a parte da página anterior mais próxima do mesmo material */
  if(chunks.length)figs.forEach(f=>{const key=f.mi+":"+f.page;if(chunks.some(c=>c.pg.has(key)))return;let best=chunks[0];for(let n=f.page-1;n>=1;n--){const c=chunks.find(c=>c.pg.has(f.mi+":"+n));if(c){best=c;break}}best.pg.add(key)});
  const txt=chunks.length===1?chunks[0].txt:parts.filter(p=>p.txt).map(p=>many?`##### Material: ${p.name}\n${p.txt}`:p.txt).join("\n\n");
  return {n:ok.length,names:ok.map(m=>m.name),name:ok.length===1?ok[0].name:ok.length?`${ok.length} materiais`:"",txt,imgs:site?scans:scans.slice(0,GM_IMG),scans,figs,chunks,cut:parts.some(p=>p.cut),parts,imgCut,scan:ok.some(m=>m.scan),attach:!!S.attach}}
/* o pedaço do material para o pedido j (revezando): texto da parte, as figuras das páginas dela e, sobrando vaga, páginas escaneadas */
function msPart(P,j){if(!P)return null;const site=!!window.__site,L=P.chunks.length,c=L?P.chunks[j%L]:null,F=c?P.figs.filter(f=>c.pg.has(f.mi+":"+f.page)):[];
  let fs=site?F:F.slice(0,GM_IMG),imgs=site?P.scans:fs.map(f=>f.blob);
  if(!site&&imgs.length<GM_IMG&&P.scans.length){const off=(j*GM_IMG)%P.scans.length;for(let i=0;imgs.length<GM_IMG&&i<P.scans.length;i++)imgs.push(P.scans[(off+i)%P.scans.length])}
  if(!L&&!site&&P.scans.length){imgs=[];const off=(j*GM_IMG)%P.scans.length;for(let i=0;i<Math.min(GM_IMG,P.scans.length);i++)imgs.push(P.scans[(off+i)%P.scans.length])}
  return {...P,txt:c?c.txt:"",imgs,fsent:fs.map(f=>({no:f.no,name:f.name,page:f.page})),nfig:fs.length,part:L>1?[j%L+1,L]:null}}
/* figura da questão: o Claude devolve "figura": N; só vale se N foi mandada (ou listada, no site) naquele pedido */
function figBind(q,M){const n=+q.figura;delete q.figura;if(!M||!n)return;const f=(M.fsent||[]).find(x=>x.no===n);if(f)q.fg={no:f.no,name:f.name,page:f.page}}
const figURL=new WeakMap();function figSrc(b){if(!b)return "";if(typeof b==="string")return b;let u=figURL.get(b);if(!u){u=URL.createObjectURL(b);figURL.set(b,u)}return u}
function figEl(q,P,img){if(!q.fg)return null;const f=P&&P.figs?P.figs.find(x=>x.no===q.fg.no):null,src=img||(f?figSrc(f.blob):"");
  const w=el(`<figure class="qfig"></figure>`);if(src){const i=el(`<img alt="">`);i.src=src;i.alt=`Figura ${q.fg.no} da questão`;i.onclick=()=>{try{window.open(src,"_blank")}catch(e){}};w.appendChild(i)}
  const c=el(`<figcaption></figcaption>`);c.textContent=`Figura ${q.fg.no} · ${q.fg.name}, página ${q.fg.page}${src?"":" (a imagem não fica guardada)"}`;w.appendChild(c);return w}
/* figura da prova: JPEG até 1000 px, baixando a qualidade até caber em EXF_MAX */
async function exfData(b){try{const bm=await createImageBitmap(b),sc=Math.min(1,1000/bm.width),cv=document.createElement("canvas");cv.width=Math.round(bm.width*sc);cv.height=Math.round(bm.height*sc);
  cv.getContext("2d").drawImage(bm,0,0,cv.width,cv.height);for(const q of [.78,.62,.48,.35]){const u=cv.toDataURL("image/jpeg",q);if(u.length<=EXF_MAX)return u}return ""}catch(e){return ""}}
/* versão pequena para guardar no Refazer (só das erradas) */
async function figSmall(b){try{const bm=await createImageBitmap(b),sc=Math.min(1,640/bm.width),cv=document.createElement("canvas");cv.width=Math.round(bm.width*sc);cv.height=Math.round(bm.height*sc);
  cv.getContext("2d").drawImage(bm,0,0,cv.width,cv.height);const u=cv.toDataURL("image/jpeg",.6);return u.length<=RD_IMG_MAX?u:cv.toDataURL("image/jpeg",.4)}catch(e){return ""}}
function genMatPrompt(m){const site=!!window.__site,anexo=site&&(m.attach||m.imgs&&m.imgs.length||m.scan),many=m.n>1;
  return `

Material do estudante
O estudante enviou ${many?`${m.n} materiais de estudo (${m.names.join("; ")})`:`um material de estudo${m.name?` (${m.name})`:""}`}. Baseie as questões ${many?"neles":"nele"}: cubra o que ${many?"os materiais ensinam":"o material ensina"}, com os critérios, condutas e valores que ${many?"eles trazem":"ele traz"}, e não cobre o que não está ${many?"nos materiais":"no material"}.${many?" Distribua as questões entre os materiais.":""} Se algum ponto divergir da diretriz brasileira vigente, siga a diretriz e explique a divergência no alerta. No campo fonte, cite o material e onde está o trecho (ex.: "Material do estudante${many?", Aula de anemias":""}, slide 12") e, se usar também uma diretriz, cite-a.`+
  (m.cut?` ${many?"Os materiais foram cortados":"O material foi cortado"} por tamanho: use só o trecho abaixo.`:"")+
  (m.part?` Este pedido traz a parte ${m.part[0]} de ${m.part[1]} do texto (as outras partes vão em outros pedidos): faça as questões só com o que está nesta parte.`:"")+
  (anexo?`
O material (ou parte dele) está anexado a esta conversa (PDF, slides ou fotos). Se não houver nenhum anexo nesta conversa, use só o texto abaixo; se não houver texto, ignore esta seção e faça as questões apenas com fontes confiáveis.`:"")+
  (m.fsent&&m.fsent.length?`
FIGURAS ${site?"(páginas do PDF anexado)":`(as ${m.fsent.length===1?"primeira imagem anexada":m.fsent.length+" primeiras imagens anexadas"}, nesta ordem)`}:
${m.fsent.map(f=>`- Figura ${f.no}: ${f.name}, página ${f.page}`).join("\n")}
Use uma figura só quando ela for essencial ou enriquecer de verdade a questão (ECG, exame de imagem, lesão de pele, gráfico, esquema, tabela): escreva no enunciado "Observe a figura" e ponha o número dela no campo "figura". No máximo uma questão com figura a cada três; nas outras, "figura": 0. Nunca use o número de uma figura que não está nesta lista.`:"")+
  (!site&&m.imgs&&m.imgs.length>(m.nfig||0)?`
As ${m.nfig?"demais ":""}imagens anexadas são páginas do material (sem texto selecionável).`:"")+
  (m.txt?`
TEXTO DO MATERIAL (extraído ${many?"dos arquivos":"do arquivo"})
${m.txt}`:"")}
/* quadro dos materiais: lista com × em cada um, adicionar mais, barra de uso do espaço do pedido */
function msEl(S,o){const site=!!window.__site,on=genMatOn(S),ID=o.id,its=S?S.items:[],ok=its.filter(msItemOk);
  const d=el(`<details class="plain gmat"${S||o.open?" open":""}><summary></summary><div class="gmatb"><p class="how"></p><ul class="mslist"></ul><div class="btns"></div></div></details>`);
  d.querySelector("summary").textContent=on?(ok.length?`Material: ${ok.length===1?ok[0].name:ok.length+" arquivos"}`:"Material: anexado na conversa"):(o.title||"Usar um material meu (opcional)");
  d.querySelector(".how").textContent=o.how||`Opcional. Com material (PDFs da aula, slides, resumos ou fotos; quantos quiser), as questões saem dele e a fonte cita a página ou o slide. Sem material, o Claude usa só diretrizes e fontes confiáveis.`;
  const ul=d.querySelector(".mslist");its.forEach((m,i)=>{const li=el(`<li><span class="msn"></span><span class="mss"></span><button class="msx" type="button" aria-label="Tirar este material">×</button></li>`);li.querySelector(".msn").textContent=m.name;
    const st=li.querySelector(".mss");if(m.busy){st.textContent="lendo aqui no aparelho…";st.classList.add("gstatus")}else if(m.err){st.textContent=m.err;st.classList.add("err")}
    else{st.textContent=(m.txt?`${m.ntext} de ${m.pages} ${m.pages===1?"página lida":"páginas lidas"}${m.imgs.length&&!site?` · ${m.imgs.length} como imagem`:""}`:site?"imagem para anexar":"imagem");st.classList.add("gmok");if(m.note)st.title=m.note}
    const x=li.querySelector(".msx");x.id=ID("r",i);x.onclick=()=>{S.items.splice(i,1);S.busy=S.items.some(y=>y.busy);if(!S.items.length&&!S.attach)o.set(null);render()};ul.appendChild(li)});
  if(!its.length)ul.remove();
  const bx=d.querySelector(".btns"),pk=el(`<label class="btn imgpick"><input type="file" accept="${DOC_ACCEPT}" multiple hidden><span></span></label>`),inp=pk.querySelector("input");
  inp.id=ID("f");pk.querySelector("span").textContent=its.length?"+ Adicionar outro arquivo":"Escolher PDFs ou fotos";inp.onchange=e=>{const f=e.target.files;msAdd(o.get,o.set,f);e.target.value=""};bx.appendChild(pk);
  if(S){const x=el(`<button class="link" type="button"></button>`);x.textContent=its.length>1?"Tirar todos":"Tirar o material";x.id=ID("x");x.onclick=()=>{o.set(null);render()};bx.appendChild(x)}
  const b=d.querySelector(".gmatb");
  if(ok.length){const P=msPack(S),raw=ok.reduce((s,m)=>s+m.txt.length,0),ni=ok.reduce((s,m)=>s+m.imgs.length,0),w=Math.min(100,Math.round(raw/GM_TOTAL*100)),nc=P.chunks.length;
    const u=el(`<div class="msuse"><div class="msbar${raw>GM_TOTAL?" over":""}"><i style="width:${w}%"></i></div><span class="mst"></span></div>`);
    u.querySelector(".mst").textContent=`Material: ${raw<1000?raw+" caracteres":Math.round(raw/1000)+" mil"} de ${GM_TOTAL/1000} mil caracteres${raw>GM_TOTAL?" (passou)":""}${nc>1?` · vai em ${nc} partes, uma por pedido`:""}${P.figs.length?` · ${P.figs.length} ${P.figs.length===1?"figura":"figuras"}`:""}${!site&&ni?` · ${ni} ${ni===1?"página escaneada":"páginas escaneadas"}`:""}`;b.appendChild(u);
    if(nc>1)b.appendChild(el(`<p class="how mspart">Cada pedido ao Claude leva uma parte (até ${GM_MAX/1000} mil caracteres), revezando: com várias questões, todas as partes são cobertas.</p>`));
    if(P.figs.length)b.appendChild(el(`<p class="how msfig hx">Páginas com figura (exames, ECG, esquemas) viram figuras numeradas: o Claude pode fazer questões com elas, e a figura aparece junto da questão. Ela só fica guardada, menor, se você errar (no Refazer, até sair de lá).</p>`));
    if(P.cut){const p=el(`<p class="pnote mscut"></p>`);p.textContent=`Passou do limite: cortei um pouco de cada para caber (${P.parts.filter(x=>x.txt).map(x=>`${x.name}: ${x.pct}%`).join(" · ")}). As questões usam só esse trecho de cada um.`;b.appendChild(p)}
    if(site&&(P.scan||P.imgs.length)){b.appendChild(el(`<p class="pnote">No site, anexe na conversa do Claude os arquivos com páginas escaneadas ou fotos quando colar o pedido.</p>`))}}
  if(site&&!ok.length){const l=el(`<label class="gmatt"><input type="checkbox"> Vou anexar o material direto na conversa do Claude</label>`),c=l.querySelector("input");c.id=ID("a");c.checked=!!(S&&S.attach);
    c.onchange=()=>{if(c.checked)o.set({items:[],attach:true,busy:false});else o.set(null);render()};b.appendChild(l)}
  return d}
function genMatEl(it){return msEl(genMat[it.key],{id:(t,i)=>`gm${t}-${it.key}${i!==undefined?"-"+i:""}`,get:()=>genMat[it.key],set:v=>{if(v)genMat[it.key]=v;else delete genMat[it.key]}})}
