// capturas do Lote 20C › Caderno (não é teste). Uso: node shots20c.js <pasta> [antes|depois|ambos] [fone,note]
// PDFs gravados como <ver>-<nome>.pdf e convertidos em PNG com pdftoppm.
const {chromium}=require('playwright');const fs=require('fs');const {execSync}=require('child_process');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');
const OUT=process.argv[2]||'.';fs.mkdirSync(OUT,{recursive:true});
const VERS=(process.argv[3]||'depois')==='ambos'?['antes','depois']:[process.argv[3]||'depois'];
const ALLDEV={fone:[390,844,true],note:[1366,900,false]};
const DEV=process.argv[4]?Object.fromEntries(process.argv[4].split(',').map(k=>[k,ALLDEV[k]])):ALLDEV;
const ONLY=(process.env.ONLY||'').split(',').filter(Boolean);
const NOTE=`## Definição e causa
A infecção pelo HIV leva à depleção progressiva dos linfócitos T CD4+, com imunossupressão celular. A transmissão é sexual, vertical e parenteral; a carga viral alta na infecção aguda aumenta muito a transmissibilidade, por isso o diagnóstico precoce importa tanto para o paciente quanto para a saúde pública.

## Diagnóstico
- Triagem com teste rápido ou ==imunoensaio de 4ª geração== (antígeno p24 + anticorpos), confirmado por carga viral.
- Na janela imunológica, o p24 aparece antes dos anticorpos; um teste negativo após exposição recente deve ser repetido em 30 dias.

| Exame | O que detecta | Quando positiva |
|---|---|---|
| Imunoensaio de 4ª geração | Anticorpos e antígeno p24 | 15 a 20 dias após a exposição |
| Teste rápido | Anticorpos | Cerca de 30 dias |
| Carga viral (RNA) | Material genético do vírus | 7 a 10 dias; confirma o diagnóstico e acompanha o tratamento |

## Tratamento
O esquema inicial preferencial é **tenofovir + lamivudina + dolutegravir**, para todos os pacientes, independentemente do CD4. Iniciar o quanto antes, idealmente no mesmo dia do diagnóstico, exceto em meningite criptocócica e tuberculose meníngea, em que se adia.

## Pegadinhas
> Profilaxia para P. jirovecii com CD4 < 200; para toxoplasmose com CD4 < 100 e IgG positivo.
> Leucoplasia pilosa oral não sai na raspagem (EBV); a candidíase sai.`;
const Q={enunciado:"Homem de 34 anos, HIV positivo sem tratamento, com placas brancas na borda lateral da língua que não saem na raspagem. CD4 de 320 células/mm³. Qual o agente e o que a lesão indica?",
  alternativas:[{letra:"A",texto:"Candida albicans; indica higienização oral inadequada",porque:"A candidíase sai na raspagem com espátula, deixando base eritematosa."},{letra:"B",texto:"Vírus Epstein-Barr (EBV); trata-se de leucoplasia pilosa oral, sinal de imunodeficiência progressiva",porque:""},
   {letra:"C",texto:"Vírus T-linfotrópico Humano tipo 1 (HTLV-1); dosagem sérica de anticorpos por ensaio imunoenzimático com confirmação por Western blot",porque:"O HTLV-1 causa leucemia/linfoma de células T do adulto e paraparesia espástica tropical, não lesão oral em placa."},{letra:"D",texto:"HPV",porque:"Causa papilomas e condilomas, não placas corrugadas."}],
  correta:"B",comentario:"A leucoplasia pilosa oral é causada pela reativação do EBV. Caracteriza-se por placas brancas corrugadas na borda lateral da língua que não são removíveis por raspagem. Sinaliza imunodeficiência moderada a avançada.",conceito:"Placa branca na borda lateral da língua que não sai na raspagem = leucoplasia pilosa por EBV.",pc:"Leucoplasia pilosa oral = EBV, não sai na raspagem, marcador de imunossupressão."};
(async()=>{const b=await chromium.launch();const errs=[];
for(const ver of VERS)for(const [name,[w,h,mob]] of Object.entries(DEV)){
 const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,hasTouch:mob,isMobile:mob,acceptDownloads:true});
 await ctx.route(/googleapis|gstatic|jsdelivr|cdnjs/,r=>r.abort());await ctx.addInitScript(mock+`;window.__noSheet=false;window.__mock({},2);`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(ver+name+":"+e.message));
 await p.goto('http://localhost:8765/tests/'+(ver==="antes"?"preview_antes.html":"preview.html"));
 await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
 await p.evaluate(([NOTE,Q])=>{const k=ALL.find(i=>/HIV/i.test(i.t)).key;window.__k=k;window.__Q=Q;upd(k,s=>{s.last=fromNum(dnum(today())-4);s.step=1;s.l=1});notes[k]=NOTE;
   const k2=ALL.find(i=>/Sífilis|Tuberculose/i.test(i.t)).key;notes[k2]="## Resumo\n- Item ==importante== do tema.\n> Pegadinha do tema 2";upd(k2,s=>{s.last=fromNum(dnum(today())-2);s.step=1;s.l=1});
   freeN.push(frClean({id:"fl1",t:"Aula de HIV (prof. Ana)",b:"## Na aula\n- Dolutegravir: cuidado com a ==gestação no 1º trimestre== (hoje liberado).\n> Pegadinha da aula: CD4 baixo não adia TARV.",tags:["aula"],ks:[k]}));
   commit();window.__hour=10;setView("notas");render()},[NOTE,Q]);
 await p.waitForTimeout(300);
 const shot=async(tag,fn,sel)=>{if(ONLY.length&&!ONLY.includes(tag))return;await p.evaluate(fn);await p.waitForTimeout(450);let el=null;try{el=sel?await p.$(sel):null}catch(e){}
   const f=`${OUT}/${ver}-${tag}-${name}.png`;if(el){await el.scrollIntoViewIfNeeded().catch(()=>{});await el.screenshot({path:f}).catch(async()=>p.screenshot({path:f}))}else await p.screenshot({path:f})};
 /* 1. Levar para a anotação: a prévia */
 await shot("levar",()=>{let box=document.getElementById("__qbox");if(box)box.remove();box=document.createElement("section");box.id="__qbox";box.className="card";box.style.cssText="position:relative;margin:12px";
   const V=document.getElementById("viewNotas");V.prepend(box);const draw=()=>{box.innerHTML="";box.appendChild(qActsEl(__Q,"C",{k:__k,src:"Simulado HIV/AIDS 2"}))};window.__draw=draw;draw();box.querySelector('[id^="qan-"]').click();draw();scrollTo(0,0)},"#__qbox");
 /* 2. anotação com o bloco levado (lida no tema) */
 await shot("levado",()=>{const P=qPoints(__Q,"C");if(conNote.length>=4)conNote(__k,P.head,P.L.filter(x=>x.on).map(x=>`${x.lab}: ${x.t}`),"","Simulado HIV/AIDS 2");else conNote(__k,P,{src:"Simulado HIV/AIDS 2"});
   const b=document.getElementById("__qbox");if(b)b.remove();nOpen.add(__k);nType="all";if(typeof setNSeg==="function")setNSeg(typeof nSeg!=="undefined"&&nSeg==="livre"?"livre":"livre");render();const x=document.getElementById("nc-"+__k);if(x)x.scrollIntoView();
   const s=[...document.querySelectorAll("#nc-"+__k+" .mdview h2, #nc-"+__k+" .mdview summary")].find(h=>/Conceitos/.test(h.textContent));if(s)s.scrollIntoView()},null);
 /* 3. painel do PDF */
 await shot("pdfpainel",()=>{nOpen.clear();nPdfOpt={scope:"pick",free:true};render();const x=document.getElementById("nPdfBox");if(x)x.scrollIntoView()},"#nPdfBox");
 await shot("pdfpainel-tema",()=>{if(nPdfOpt.scope==="pick"){nPdfOpt.area=BYKEY[__k].area.code;nPdfOpt.sps=new Set([BYKEY[__k].sp]);nPdfOpt.ks=new Set([__k])}render();const x=document.getElementById("nPdfBox");if(x)x.scrollIntoView()},"#nPdfBox");
 /* 4. pegadinhas */
 await shot("pegadinhas",()=>{nPdfOpt=null;if(typeof setNSeg==="function")setNSeg("pegadinhas");render();const x=document.querySelector(".npeg");if(x)x.scrollIntoView()},".npeg");
 /* 5. ler arquivo */
 await shot("ler",()=>{if(typeof setNSeg==="function")setNSeg("livre");if(typeof imgOpen==="function")imgOpen();else{const b=document.getElementById("nImg");if(b)b.click()}
   if(imgR&&imgR.files){imgR.files.push({name:"Aula-sifilis.docx",kind:"docx",txt:"Texto da aula. ".repeat(3500)},{name:"Slides-TB.pptx",kind:"pptx",txt:"Slide. ".repeat(1200),pages:24},{name:"resumo-antigo.doc",kind:"old",txt:"",err:"Arquivo .doc ou .ppt antigo: salve como .docx, .pptx ou PDF e escolha de novo."});imgR.kind="aula";imgR.status="ready"}render();const x=document.getElementById("imgPanel")||document.getElementById("nImgBox");if(x)x.scrollIntoView()},"#nImgBox");
 /* 6. PDFs (só uma vez por versão) */
 if(name==="note"&&(!ONLY.length||ONLY.includes("pdf"))){
   const mk=async(tag,fn)=>{const b64=await p.evaluate(fn);fs.writeFileSync(`${OUT}/${ver}-${tag}.pdf`,Buffer.from(b64,"base64"));execSync(`pdftoppm -r 70 -png ${OUT}/${ver}-${tag}.pdf ${OUT}/${ver}-${tag}`)};
   const b64=`const u=x;let s="";for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode.apply(null,u.subarray(i,i+8192));return btoa(s)`;
   await mk("pdf-tema",new Function(`const x=notesPDF([__k],freeN.filter(f=>f.ks.includes(__k)),{scope:"Clínica Médica · Infectologia",title:BYKEY[__k].t,kicker:"CADERNO",freeTitle:"Páginas ligadas"});${b64}`));
 }
 await ctx.close()}
console.log(errs.length?"ERROS: "+errs.join(" | "):"ok");await b.close()})();
