// t137: Lote 20C — Caderno: "Levar para a anotação" com contexto (sem letras, seção sugerida, Claude opcional) e troca nas antigas;
// PDF justificado com tabela de verdade e sumário com seções; PDF por área › especialidade › tema; pegadinhas (filtros, revisar, folha de véspera,
// páginas livres, virar pegadinha, reler, pedido do gerador); leitor de arquivos (Word, PowerPoint, texto) no Caderno e nos objetivos da SP.
const {chromium}=require('playwright');const fs=require('fs');const {execSync}=require('child_process');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');
const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const TMP=require('os').tmpdir()+"/t137";fs.mkdirSync(TMP,{recursive:true});
/* arquivos Office de verdade (zip com deflate), feitos com o zipfile do Python */
execSync(`python3 - <<'E'
import zipfile
W='http://schemas.openxmlformats.org/wordprocessingml/2006/main'
doc=f'''<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="{W}"><w:body>
<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Sífilis</w:t></w:r></w:p>
<w:p><w:r><w:t xml:space="preserve">O VDRL é </w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t>não treponêmico</w:t></w:r><w:r><w:t xml:space="preserve"> e serve para seguimento.</w:t></w:r></w:p>
<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>Penicilina benzatina é o tratamento</w:t></w:r></w:p>
<w:tbl><w:tr><w:tc><w:p><w:r><w:t>Fase</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Dose</w:t></w:r></w:p></w:tc></w:tr>
<w:tr><w:tc><w:p><w:r><w:t>Primária</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>2,4 milhões UI</w:t></w:r></w:p></w:tc></w:tr></w:tbl>
</w:body></w:document>'''
z=zipfile.ZipFile('${TMP}/aula.docx','w',zipfile.ZIP_DEFLATED);z.writestr('[Content_Types].xml','<Types/>');z.writestr('word/document.xml',doc);z.close()
A='http://schemas.openxmlformats.org/drawingml/2006/main'
def sl(t,items):return f'<p:sld xmlns:p="x" xmlns:a="{A}"><p:cSld><p:spTree><p:sp><p:txBody><a:p><a:r><a:t>{t}</a:t></a:r></a:p>'+''.join(f'<a:p><a:pPr lvl="{l}"/><a:r><a:t>{x}</a:t></a:r></a:p>' for x,l in items)+'</p:txBody></p:sp></p:spTree></p:cSld></p:sld>'
z=zipfile.ZipFile('${TMP}/aula.pptx','w',zipfile.ZIP_DEFLATED)
z.writestr('ppt/slides/slide1.xml',sl('Tuberculose',[('RIPE por 6 meses',0),('2 RIPE + 4 RI',1)]));z.writestr('ppt/slides/slide2.xml',sl('ILTB',[('Isoniazida 6 a 9 meses',0)]));z.close()
open('${TMP}/notas.txt','w').write('Dengue: hidratação é a base.\\nSinais de alarme pedem internação.')
open('${TMP}/velho.doc','wb').write(b'\\xd0\\xcf\\x11\\xe0 velho')
E`);
const DEV={fone:[390,844,true],note:[1366,900,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const [name,[w,h,mob]] of Object.entries(DEV)){
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob});
 await ctx.route(/googleapis|gstatic|jsdelivr|cdnjs/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:8765/tests/preview.html');await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
 const jsc=s=>p.evaluate(s=>document.querySelector(s).click(),s).then(()=>p.waitForTimeout(200));
 await p.evaluate(()=>{window.__prompts=[];window.__saved=[];sampleFn=async(t,o)=>{__prompts.push({t,o});if(o&&o.onText)o.onText({text:"## Parcial"});return {text:/Material:/.test(t)?"## O que o material traz\n- **VDRL** não treponêmico\n\n## Pegadinhas\n> Pegadinha: VDRL cai com o tratamento — Por quê: é não treponêmico":/2 a 4 itens/.test(t)?"- A leucoplasia pilosa é do **EBV**.\n- Não sai na raspagem.":'{"tipo":"objetivos","itens":["Diagnosticar sífilis","Tratar sífilis"]}'}};
   downloadsFn={save:async x=>{__saved.push(x)}};
   const k=ALL.find(i=>/HIV/i.test(i.t)).key;window.__k=k;upd(k,s=>{s.last=fromNum(dnum(today())-3);s.step=1;s.l=1});
   notes[k]="## Definição e causa\nTexto da definição.\n\n## Diagnóstico\n- Teste rápido e carga viral.\n\n| Exame | O que detecta |\n|---|---|\n| Teste rápido | Anticorpos |\n| Carga viral | RNA do vírus, confirma o diagnóstico e acompanha o tratamento ao longo dos anos |\n\n## Tratamento\nTARV para todos.\n\n## Pegadinhas\n> Pegadinha: CD4 baixo não adia a TARV — Por quê: iniciar logo reduz mortalidade\n> Leucoplasia pilosa não sai na raspagem\n- ==4ª geração== detecta p24";
   freeN.push(frClean({id:"fpg",t:"Aula de HIV",b:"## Aula\n> Pegadinha: dolutegravir na gestação é liberado — Por quê: diretriz atual",tags:["aula"],ks:[k]}));commit()});
 /* 1. Levar para a anotação com contexto */
 const Q={enunciado:"Homem de 34 anos, HIV positivo, com placas brancas na borda lateral da língua que não saem na raspagem. Qual o agente?",
   alternativas:[{letra:"A",texto:"Candida albicans",porque:"A candidíase sai na raspagem."},{letra:"B",texto:"Vírus Epstein-Barr (EBV); leucoplasia pilosa oral, sinal de imunodeficiência progressiva",porque:""},
     {letra:"C",texto:"Vírus T-linfotrópico Humano tipo 1 (HTLV-1); dosagem sérica de anticorpos por ensaio imunoenzimático com confirmação por Western blot",porque:"O HTLV-1 causa paraparesia espástica tropical."}],
   correta:"B",comentario:"A leucoplasia pilosa oral é causada pela reativação do EBV. Não sai na raspagem.",conceito:"Leucoplasia pilosa oral é causada pela reativação do EBV e não sai na raspagem.",alerta:"Atenção: candidíase sai na raspagem; leucoplasia pilosa não."};
 const R1=await p.evaluate(Q=>{const P=qPoints(Q,"C");return {labs:P.L.map(x=>x.lab),ans:P.ans,head:P.head}},Q);
 ok(!R1.labs.some(l=>/\b[A-E] está certa|^Por que [A-E]\b/.test(l))&&R1.labs.includes("Por quê")&&R1.labs.some(l=>/Western blot$/.test(l))&&/Western|EBV/.test(R1.ans+R1.labs.join()),name+": pontos sem letras e com a alternativa inteira "+R1.labs.join(" | "));
 ok(!R1.labs.includes("Conceito-chave"),name+": conceito que repete o porquê fica de fora");
 ok(R1.labs.includes("Pegadinha"),name+": o alerta da questão vira ponto Pegadinha");
 await p.evaluate(Q=>{let box=document.createElement("section");box.id="__qb";box.className="card";document.getElementById("viewNotas").prepend(box);setView("notas");window.__Q=Q;window.__draw=()=>{const bx=document.getElementById("__qb");if(!bx)return;bx.innerHTML="";bx.appendChild(qActsEl(__Q,"C",{k:__k,src:"Simulado"}))};__draw();document.querySelector('#__qb [id^="qan-"]').click();__draw()},Q);await p.waitForTimeout(200);
 const R2=await p.evaluate(()=>{const b=document.getElementById("__qb");return {cx:(b.querySelector(".qpcx")||{}).textContent||"",sel:[...b.querySelectorAll('[id^="qps-"] option')].map(o=>o.value),ai:!!b.querySelector('[id^="qpai-"]')}});
 ok(/Caso:/.test(R2.cx)&&/Resposta:.*Epstein-Barr/.test(R2.cx),name+": a prévia mostra o caso e a resposta inteira");
 ok(R2.sel.includes("")&&R2.sel.includes("Diagnóstico")&&R2.ai,name+": escolher a seção (Conceitos das questões ou uma da anotação) e ✦ Escrever com o Claude");
 await p.evaluate(()=>{const b=document.getElementById("__qb"),s=b.querySelector('[id^="qps-"]');s.value="Diagnóstico";s.dispatchEvent(new Event("change"));b.querySelector('[id^="qpgo-"]').click();__draw()});await p.waitForTimeout(150);
 const R3=await p.evaluate(()=>{const t=notes[__k],i=t.indexOf("## Diagnóstico"),j=t.indexOf("## Tratamento"),blk=t.slice(i,j);return {inDiag:/- \*\*Da questão:\*\*/.test(blk),resp:/\*\*Resposta:\*\* Vírus Epstein-Barr \(EBV\); leucoplasia pilosa oral, sinal de imunodeficiência progressiva/.test(blk),why:/\*\*Por quê:\*\*/.test(blk),noLetter:!/Por que [A-E] está certa/.test(t)}});
 ok(R3.inDiag&&R3.resp&&R3.why&&R3.noLetter,name+": bloco Da questão entra na seção escolhida, com a resposta inteira "+JSON.stringify(R3));
 await p.evaluate(()=>{const b=document.getElementById("__qb");qActS.delete(__Q);__draw();b.querySelector('[id^="qan-"]').click();__draw()});await p.waitForTimeout(100);
 await p.evaluate(()=>{document.querySelector('#__qb [id^="qpai-"]').click()});await p.waitForTimeout(300);await p.evaluate(()=>__draw());
 const R4=await p.evaluate(()=>({ta:(document.querySelector('#__qb [id^="qpa-"]')||{}).value||"",pr:__prompts.slice(-1)[0].t}));
 ok(/EBV/.test(R4.ta)&&/sem citar letras/.test(R4.pr),name+": ✦ Escrever com o Claude devolve itens para conferir");
 await p.evaluate(()=>{document.querySelector('#__qb [id^="qpgo-"]').click();document.getElementById("__qb").remove()});await p.waitForTimeout(100);
 ok(await p.evaluate(()=>/- \*\*Da questão:\*\*[^\n]*\n  - \*\*Resposta:\*\*[^\n]*\n  - A leucoplasia pilosa é do \*\*EBV\*\*/.test(notes[__k])),name+": o texto do Claude entra no bloco (sem marcadores duplos)");
 /* 2. troca automática nas anotações antigas */
 const R5=await p.evaluate(()=>{const k2=ALL.find(i=>/Sífilis/i.test(i.t)).key,ex=exClean({id:"exo",name:"ENARE 2024",banca:"ENARE",ano:"2024",qs:[{n:1,k:k2,q:{enunciado:"x",alternativas:[{letra:"A",texto:"Penicilina benzatina 2,4 milhões UI em dose única intramuscular, repetida semanalmente por três semanas na sífilis tardia latente",porque:""},{letra:"B",texto:"Doxiciclina por 28 dias, alternativa para alérgicos fora da gestação, com seguimento sorológico trimestral",porque:"Não é a primeira escolha."}],correta:"A",comentario:"c"}}]});exams.unshift(ex);
   const L=ex.qs[0].q.alternativas;notes[k2]="## Conceitos das questões\n- **"+clCut(L[0].texto,110)+"** {{q:exo:0}}\n  - Por que A está certa: porque sim.\n  - Por que não "+clCut(L[1].texto,60)+": não é a primeira escolha.";
   try{localStorage.removeItem("resid-confix")}catch(e){}const n=conFix(),t=notes[k2];return {n,t,again:conFix()}});
 ok(R5.n===1&&/\*\*Por quê:\*\* porque sim/.test(R5.t)&&/semanalmente por três semanas na sífilis tardia latente\*\*/.test(R5.t)&&/Por que não Doxiciclina por 28 dias, alternativa para alérgicos fora da gestação, com seguimento sorológico trimestral:/.test(R5.t)&&R5.again===0,name+": anotação antiga: rótulo sem letra e alternativas inteiras pelo selo da prova; roda uma vez");
 /* 3. PDF: tabela, sem código, sumário com as seções */
 const R6=await p.evaluate(()=>{const u=notesPDF([__k],freeN.filter(f=>f.ks.includes(__k)),{title:BYKEY[__k].t,scope:"Infectologia",kicker:"CADERNO",freeTitle:"Páginas ligadas"});let s="";for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode.apply(null,u.subarray(i,i+8192));return btoa(s)});
 fs.writeFileSync(TMP+"/n.pdf",Buffer.from(R6,"base64"));const txt=execSync(`pdftotext -layout ${TMP}/n.pdf -`).toString();
 const tocPart=txt.split("Sumário")[1]||"";
 ok(/Diagnóstico/.test(tocPart.split("\f")[0])&&/Tratamento/.test(tocPart.split("\f")[0])&&/Páginas ligadas/.test(txt),name+": sumário lista as seções do tema e as páginas ligadas");
 ok(!/CM · Infectologia · \d{3}/.test(txt),name+": cabeçalho do tema sem o código");
 const raw=Buffer.from(R6,"base64").toString("latin1");
 ok(/\(Exame\) Tj/.test(raw)&&(raw.match(/ re f/g)||[]).length>8&&/RG 0\.5 w/.test(raw),name+": tabela com grade e cabeçalho com fundo");
 ok(/Da questão/.test(txt),name+": bloco Da questão no PDF");
 /* 4. PDF por especialidade e tema */
 await p.evaluate(()=>{nPdfOpt={scope:"pick",free:true};setView("notas");setNSeg("livre");render()});await p.waitForTimeout(200);
 ok(await p.evaluate(()=>!!document.querySelector("#nPdfArea")&&[...document.querySelectorAll('#nPdfScope option')].some(o=>o.value==="pick")),name+": PDF com Escolher especialidades ou temas");
 await p.evaluate(()=>{const s=document.querySelector("#nPdfArea");s.value=BYKEY[__k].area.code;s.dispatchEvent(new Event("change"))});await p.waitForTimeout(150);
 await jsc('#nPdfSp-0');await p.evaluate(k=>document.getElementById("nPdfT-"+k).click(),await p.evaluate(()=>__k));await p.waitForTimeout(150);
 const R7=await p.evaluate(()=>({sum:document.querySelector(".npdfsum").textContent,link:document.querySelector("#nPdfFree").checked,lab:document.querySelector(".fcru span").textContent}));
 ok(/HIV/.test(R7.sum)&&/seções de cada página/.test(R7.sum)&&R7.link&&/páginas livres ligadas/.test(R7.lab),name+": recorte de um tema com as páginas livres ligadas "+R7.sum.slice(0,90));
 await jsc('#nPdfGo');await p.waitForTimeout(200);
 ok(await p.evaluate(()=>__saved.length&&/caderno-hiv/.test(__saved.slice(-1)[0].filename)),name+": gera o PDF com o nome do recorte");
 /* 5. pegadinhas */
 await p.evaluate(()=>{nPdfOpt=null;setNSeg("pegadinhas");render()});await p.waitForTimeout(200);
 const R8=await p.evaluate(()=>{const c=document.querySelector(".npeg");return {t:[...c.querySelectorAll('[id^="pgT-"]')].map(b=>b.textContent).join("|"),items:[...c.querySelectorAll(".pgx")].map(x=>x.textContent),sec:[...c.querySelectorAll(".pgm")].map(x=>x.textContent)}});
 ok(/Pegadinhas · \d/.test(R8.t)&&/Destaques · \d/.test(R8.t),name+": tipo Pegadinhas · Destaques com contagem");
 ok(R8.items.some(x=>/dolutegravir/.test(x))&&R8.items.some(x=>/CD4 baixo não adia a TARV — iniciar logo/.test(x)),name+": lê páginas livres e a pegadinha estruturada com o porquê");
 ok(R8.sec.some(x=>/Pegadinhas/.test(x)),name+": cada item mostra a seção de onde veio");
 await jsc('#pgGo');ok(await p.evaluate(()=>!!document.querySelector(".pgrun #pgNo")),name+": Revisar pegadinhas abre uma por vez");
 await jsc('#pgNo');await jsc('#pgYes');
 ok(await p.evaluate(()=>Object.values(ui.prefs.pgm||{}).reduce((a,b)=>a+b,0)===1),name+": Não sabia fica guardado (prefs da conta)");
 await p.evaluate(()=>{pgRun=null;render()});await jsc('#pgMiss');
 const R9=await p.evaluate(()=>({n:document.querySelectorAll(".npeg .pgx").length,card:!!document.querySelector(".npeg .pgcd")}));
 ok(R9.n===1&&R9.card,name+": filtro Não sabia, com + Cartão");
 await jsc('#pgMiss');await jsc('#pgPdf');
 ok(await p.evaluate(()=>/pegadinhas-/.test(__saved.slice(-1)[0].filename)),name+": Folha de véspera em PDF");
 /* abrir no ponto exato */
 await p.evaluate(()=>{const b=[...document.querySelectorAll(".npeg .pgi")].find(x=>/CD4 baixo/.test(x.textContent));b.click()});await p.waitForTimeout(400);
 ok(await p.evaluate(()=>!!document.querySelector("#t-"+__k+" .pflash")),name+": tocar no item abre a anotação e marca a linha");
 /* virar pegadinha a partir de erro; reler; pedido do gerador */
 await p.evaluate(()=>{const e=eNew(__k,"Marquei A; a certa era B","Correta: B) Leucoplasia pilosa\nNão sai na raspagem.","interpretacao","Simulado","");eMenu=e.id;window.__e=e;backStack=[];setView("erros");render()});await p.waitForTimeout(200);
 await p.evaluate(()=>document.getElementById("epg-"+__e.id).click());await p.waitForTimeout(150);
 ok(await p.evaluate(()=>/> Pegadinha: Não sai na raspagem/.test(notes[__k])),name+": erro de leitura vira pegadinha na seção Pegadinhas");
 ok(await p.evaluate(()=>{const w=rereadEl(__k);return /Pegadinhas deste tema/.test(w.textContent)}),name+": Reler a anotação mostra as pegadinhas primeiro");
 ok(await p.evaluate(()=>/pegadinhas deste tema/i.test(buildPrompt(BYKEY[__k],5,{first:true}))),name+": gerador pede 1 questão que teste uma pegadinha");
 ok(await p.evaluate(()=>{const ta=document.createElement("textarea");document.body.appendChild(ta);ta.value="CD4 alto";ta.selectionStart=ta.selectionEnd=3;pegInsert(ta,()=>{});const v=ta.value;ta.remove();return /^> Pegadinha: CD4 alto — Por quê: $/.test(v)}),name+": botão Pegadinha do editor escreve a linha estruturada");
 /* 6. leitor de arquivos no Caderno */
 await p.evaluate(()=>{backStack=[];setView("notas");setNSeg("livre");imgStart(null)});await p.waitForTimeout(150);
 await p.setInputFiles('#imgPanel input[type=file]',[TMP+"/aula.docx",TMP+"/aula.pptx",TMP+"/notas.txt",TMP+"/velho.doc"]);await p.waitForTimeout(900);
 const RA=await p.evaluate(()=>({f:imgR.files.map(f=>({n:f.name,k:f.kind,t:f.txt.slice(0,400),e:f.err})),li:[...document.querySelectorAll("#imgPanel .dflist li")].map(x=>x.textContent)}));
 const D=RA.f.find(x=>x.n==="aula.docx"),PP=RA.f.find(x=>x.n==="aula.pptx"),TX=RA.f.find(x=>x.n==="notas.txt"),OL=RA.f.find(x=>x.n==="velho.doc");
 ok(D&&/^## Sífilis/m.test(D.t)&&/\*\*não treponêmico\*\*/.test(D.t)&&/^- Penicilina/m.test(D.t)&&/\| Fase \| Dose \|/.test(D.t),name+": Word lido no aparelho (título, negrito, lista, tabela) "+(D?JSON.stringify(D.t.slice(0,160)):""));
 ok(PP&&/=== Slide 1 ===\n## Tuberculose/.test(PP.t)&&/  - 2 RIPE \+ 4 RI/.test(PP.t)&&/Slide 2/.test(PP.t),name+": PowerPoint lido por slide, com níveis");
 ok(TX&&/Sinais de alarme/.test(TX.t)&&OL&&/salve como \.docx/.test(OL.e),name+": texto lido; .doc antigo avisa para salvar em .docx");
 await jsc('#imgGo');await p.waitForTimeout(400);
 const RB=await p.evaluate(()=>({st:imgR.status,pr:__prompts.slice(-1)[0].t,title:__prompts.slice(-1)[0].o.title}));
 ok(RB.st==="done"&&/Material:/.test(RB.pr)&&/##### Arquivo: aula\.docx/.test(RB.pr)&&/Isoniazida/.test(RB.pr)&&/Ler arquivo com o Claude/.test(RB.title),name+": Ler com o Claude manda o texto dos arquivos");
 await p.fill('#imgT','Aula de sífilis');await jsc('#imgSave');
 ok(await p.evaluate(()=>freeN.some(f=>f.t==="Aula de sífilis"&&/a partir de 3 arquivos|a partir de 4 arquivos/.test(f.b)&&f.tags.includes("arquivo"))),name+": salvo como página livre com a origem");
 /* arquivo grande vai em partes */
 ok(await p.evaluate(()=>docParts([{name:"g.txt",txt:("Linha de texto de estudo. ".repeat(40)+"\n\n").repeat(200)}]).length>=3),name+": arquivo grande é dividido em partes");
 /* 7. objetivos da SP por arquivo */
 const RC=await p.evaluate(async()=>{const s=fac.sems[0]||(fac.sems.push({id:"s1",name:"6º",archived:false,lv:{}}),fac.sems[0]);const sid="spx";
   const blob=new Blob([await (await fetch("data:text/plain,Objetivos: diagnosticar e tratar sífilis")).arrayBuffer()],{type:"text/plain"});const f=new File([blob],"objetivos.txt",{type:"text/plain"});
   await objFRun(sid,f);return {st:objF[sid].st,n:objF[sid].list.length,pr:__prompts.slice(-1)[0].t}});
 ok(RC.st==="rev"&&RC.n===2&&/O texto abaixo é/.test(RC.pr)&&/diagnosticar e tratar/.test(RC.pr),name+": Ler os objetivos aceita arquivo de texto");
 ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral");
 await ctx.close()}
ok(!errs.length,"sem erros de JavaScript "+errs.join(" | "));await b.close()})();
