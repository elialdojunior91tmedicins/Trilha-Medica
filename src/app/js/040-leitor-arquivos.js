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

/* histórico de atividade (por dia): e=temas estudados, r=revisões, q=questões, c=acertos */
let hist={};const LSH="resid-hist-v1";
function logAct(f,n,c,day){const d=day||today(),h=hist[d]||(hist[d]={});h[f]=Math.max(0,(h[f]||0)+(n||1));if(c)h.c=Math.max(0,(h.c||0)+c);
  const keys=Object.keys(hist).sort();if(keys.length>400)keys.slice(0,keys.length-400).forEach(k=>delete hist[k]);
  try{localStorage.setItem(LSH,JSON.stringify(hist))}catch(e){}}
function lastDays(n){const t=dnum(today());return Array.from({length:n},(_,i)=>fromNum(t-n+1+i))}
/* Lote 20E: uma regra só de sequência (Perfil, PDF, Estatísticas, saudação, meta do Foco): dia de folga planejada (ou "Hoje não deu")
   sem estudo CONGELA (não soma nem quebra); estudar na folga soma +1. Hoje ainda sem estudo não quebra. */
const offDay=d=>dayMin(dnum(d))===0;
function runStreak(act){let n=0,t=dnum(today()),g=0;if(!act(fromNum(t)))t--;while(g++<800){const d=fromNum(t);if(act(d))n++;else if(!offDay(d))break;t--}return n}
function streak(){return runStreak(d=>{const h=hist[d];return !!(h&&(h.e||h.r||h.q))})}
/* "Hoje não deu": 1 por semana, transforma hoje em folga (empurra as revisões e zera o plano); desfaz no mesmo dia. ui.prefs.hnd = {segunda:{d,prev}} */
const hndWeek=()=>{const H=ui.prefs.hnd||{};return H[fromNum(wpMon(dnum(today())))]||null};
function hojeNaoDeu(){if(hndWeek())return;const t=dnum(today()),mon=fromNum(wpMon(t)),prev=dayMin(t),H={...(ui.prefs.hnd||{})};H[mon]={d:today(),prev};
  const ks=Object.keys(H).sort();if(ks.length>6)ks.slice(0,ks.length-6).forEach(k=>delete H[k]);ui.prefs.hnd=H;setTodayMin(0);planNote="Hoje não deu: hoje virou folga. As revisões passam para o próximo dia de estudo e a sequência fica congelada.";render()}
function hndUndo(){const W=hndWeek();if(!W||W.d!==today())return;const H={...(ui.prefs.hnd||{})};delete H[fromNum(wpMon(dnum(today())))];ui.prefs.hnd=H;setTodayMin(WP_MIN.includes(W.prev)&&W.prev?W.prev:60);planNote="Hoje voltou a ser dia de estudo.";render()}
let hndArm=false;
const pct=(a,b)=>b?Math.round(a/b*100):0;
const band=p=>p>=80?["good","Bom"]:p>=60?["warn","Regular"]:["bad","Fraco"];

/* tooltip compartilhado */
const tip=document.createElement("div");tip.className="tip";tip.setAttribute("role","tooltip");tip.hidden=true;document.body.appendChild(tip);
function placeTip(e){const t=e.target.closest&&e.target.closest("[data-tip]");
  if(!t){tip.hidden=true;return}tip.textContent=t.dataset.tip;tip.hidden=false;
  const r=tip.getBoundingClientRect(),x=Math.min(Math.max(8,e.clientX-r.width/2),innerWidth-r.width-8),y=e.clientY-r.height-14;
  tip.style.left=x+"px";tip.style.top=(y<8?e.clientY+18:y)+"px"}
document.addEventListener("pointermove",e=>{if(e.pointerType==="mouse")placeTip(e)});
/* toque (tablet/celular): tocar no gráfico mostra o detalhe; tocar fora ou rolar esconde */
document.addEventListener("pointerdown",e=>{if(e.pointerType!=="mouse")placeTip(e)});
addEventListener("scroll",()=>{tip.hidden=true},{passive:true});
document.addEventListener("pointerleave",e=>{if(e.pointerType==="mouse")tip.hidden=true});

function lvLegend(c){return [["m3","Dominados",c[3]],["m2","Revisados",c[2]],["m1","Estudados",c[1]],...(c[4]?[["mi","Estudando",c[4]]]:[]),["track","Não iniciados",c[0]-(c[4]||0)]]}
function donut(c,tot=TOTAL,unit="temas"){const R=52,C=2*Math.PI*R,gap=2;let off=0;
  const segs=[[c[3],"var(--m3)","Dominados"],[c[2],"var(--m2)","Revisados"],[c[1],"var(--m1)","Estudados"],[c[4]||0,"var(--mi)","Estudando"]];
  const arcs=segs.filter(s=>s[0]).map(([v,col,lab])=>{const len=v/tot*C,draw=Math.max(len-(len>gap*2?gap:0),0.5);
    const a=`<circle r="${R}" cx="64" cy="64" fill="none" stroke="${col}" stroke-width="14" stroke-dasharray="${draw} ${C}" stroke-dashoffset="${-off}" transform="rotate(-90 64 64)" data-tip="${lab}: ${v} de ${tot} ${unit} (${pct(v,tot)}%)"></circle>`;off+=len;return a}).join("");
  return `<svg viewBox="0 0 128 128" class="donut" role="img" aria-label="${c[3]} dominados, ${c[2]} revisados, ${c[1]} estudados, ${c[4]?c[4]+" estudando, ":""}${c[0]-(c[4]||0)} não iniciados"><circle r="${R}" cx="64" cy="64" fill="none" stroke="var(--track)" stroke-width="14"></circle>${arcs}</svg>`}

function renderDash(){
  const c=counts(ALL);let qc=0,qt=0,due=0,late=0;
  ALL.forEach(i=>{const s=get(i.key);qc+=s.qc||0;qt+=s.qt||0;if(isDue(s)){due++;if(dueIn(s)<0)late++}});
  const ac=qt?pct(qc,qt):null,[bk,bl]=ac===null?["",""]:band(ac),wp=weighted();
  $("#ring").innerHTML=donut(c)+`<div class="ringc"><b>${pct(c[3],TOTAL)}%</b><span>dominado</span></div>`;
  const L=lvLegend(c);
  $("#glegend").innerHTML=L.map(([t,lab,v])=>`<li><i class="sw" style="background:var(--${t})"></i><span>${lab}</span><b>${v}</b><em>${pct(v,TOTAL)}%</em></li>`).join("");
  $("#stats").innerHTML=`
    <div class="kpi${due?" alert":""}"><span class="kl">Revisões pendentes</span><b>${due}</b><span class="ks">${due?(late?`${late} atrasada${late>1?"s":""}`:"vencem hoje"):"tudo em dia"}</span></div>
    <div class="kpi"><span class="kl">Questões feitas</span><b>${qt.toLocaleString("pt-BR")}</b><span class="ks">${qc.toLocaleString("pt-BR")} acertos</span></div>
    <div class="kpi"><span class="kl">Acerto geral</span><b>${ac===null?"–":ac+"%"}</b><span class="ks">${ac===null?"sem questões ainda":`<span class="st ${bk}">${bl}</span>`}</span></div>
    <div class="kpi"><span class="kl">Peso da prova estudado</span><b>${wp}%</b><div class="meter" data-tip="${wp}% do peso de incidência já estudado"><i style="width:${wp}%"></i></div></div>`;
  // progresso por área
  /* progresso por área (Lote 10): uma barra empilhada por área com o nome inteiro e "21 de 40 temas"; os subtópicos ficam na dica da barra */
  $("#areaChart").innerHTML=AREAS.map(a=>{const k=counts(a.items),n=a.items.length,seen=k[1]+k[2]+k[3];
    let sd=0,st=0;a.items.forEach(it=>{const [x,y]=subCount(it);sd+=x;st+=y});const sub=`subtópicos marcados: ${sd} de ${st} (${pct(sd,st)}%)`;
    const seg=(v,t,lab)=>v?`<i style="width:${v/n*100}%;background:var(--${t})" data-tip="${esc(a.name)} · ${lab}: ${v} de ${n} · ${sub}"></i>`:"";
    return `<button type="button" class="arow" data-code="${a.code}"><span class="atop"><span class="al">${esc(a.name)}</span><span class="an"><b>${seen}</b> de ${n} temas</span></span><span class="hbar" role="img" aria-label="${esc(a.name)}: ${k[3]} dominados, ${k[2]} revisados, ${k[1]} estudados de ${n}; ${sub}" data-tip="${esc(a.name)}: ${seen} de ${n} temas · ${sub}">${seg(k[3],"m3","dominados")}${seg(k[2],"m2","revisados")}${seg(k[1],"m1","estudados")}${seg(k[4],"mi","estudando")}</span></button>`}).join("")+
    `<p class="cnote">Cores da legenda acima. Toque numa área para ver os temas dela; a dica da barra mostra os subtópicos marcados.</p>`;
  $("#areaChart").querySelectorAll(".arow").forEach(b=>b.onclick=()=>{tf.area=b.dataset.code;tf.sp="all";openAreas.add(b.dataset.code);setTSeg("lista")});
}

/* aba Questões */
const QCH_FEW=10;let qChSort=(()=>{try{return localStorage.getItem("resid-qchsort")==="gain"?"gain":"acc"}catch(e){return "acc"}})();
let qWorse=false,qFOpen=(()=>{try{return (document.documentElement.dataset.layout!=="phone"||window.__noSheet)&&localStorage.getItem("resid-qfpanel")==="1"}catch(e){return false}})(), qArea="all", qSort="num", qWeak=false, qSpec="all", qDisc="all", qQuery="", qPer="all", qAcc="all", qInc=false, qErrF=false, qDueF=false, qChartBy="spec", qMore=false;
function aggr(items){let c=0,t=0;items.forEach(i=>{const s=get(i.key);c+=s.qc||0;t+=s.qt||0});return [c,t]}
/* questões de um tema no período escolhido na aba Questões */
const qFrom=()=>qPer==="all"?null:fromNum(dnum(today())-(+qPer)+1);
function qOf(k,from){if(!from){const s=get(k);return [s.qc||0,s.qt||0]}const r=qPeriod([k],from);return [r.c,r.q]}
function qUniverse(){// temas da residência + conteúdos da faculdade, com os filtros (menos período e acerto)
  const n=norm(qQuery.trim()),errK=new Set(errors.map(e=>e.k));
  let pool=[...ALL,...FAC_ITEMS];
  if(qArea!=="all")pool=pool.filter(i=>i.area.code===qArea);
  if(qSpec!=="all")pool=pool.filter(i=>i.sp===qSpec);
  if(qDisc!=="all"){const d=discOf(qDisc),ks=new Set(d?topicKeysOf(discRefs(d)):[]);pool=pool.filter(i=>ks.has(i.key))}
  if(n)pool=pool.filter(i=>norm(i.t+" "+(i.sp||"")+" "+i.area.name+" "+subList(i).map(x=>x.t).join(" ")).includes(n));
  if(qInc)pool=pool.filter(i=>!i.own&&wOf(i)===3);
  if(qErrF)pool=pool.filter(i=>errK.has(i.key));
  if(qDueF)pool=pool.filter(i=>isDue(get(i.key)));
  if(qWorse)pool=pool.filter(i=>{const tr=qTrend(i.key);return tr&&tr.d<=-5});
  return pool}
const accBand=(c,t)=>!t?null:c/t<WEAK_PCT?"bad":c/t<0.8?"mid":"good";
function qClearAll(){qArea="all";qSpec="all";qDisc="all";qQuery="";qPer="all";qAcc="all";qWeak=false;qInc=false;qErrF=false;qDueF=false;qWorse=false}
let qListKeep=null,qListAll=false;const QLIST_TOP=10;
const qFiltOn=()=>!!(qArea!=="all"||qDisc!=="all"||qQuery||qPer!=="all"||qAcc!=="all"||qInc||qErrF||qDueF||qWorse||qOpenK&&false);
