// capturas do Lote 20A (não é teste). Uso: node shots20a.js <pasta>
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');
const OUT=process.argv[2]||'.';fs.mkdirSync(OUT,{recursive:true});
const DEV={fone:[390,844,true],note:[1366,900,false]};
(async()=>{const b=await chromium.launch();
for(const ver of ["antes","depois"])for(const [name,[w,h,mob]] of Object.entries(DEV)){
 const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,hasTouch:mob,isMobile:mob});
 await ctx.route(/googleapis|gstatic|jsdelivr|cdnjs/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);const p=await ctx.newPage();
 await p.goto('http://localhost:8765/tests/'+(ver==="antes"?"preview_antes.html":"preview.html"));await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
 await p.evaluate(()=>{const k=ALL.find(i=>/HIV/i.test(i.t)).key,LONG="Vírus T-linfotrópico Humano tipo 1 (HTLV-1); dosagem sérica de anticorpos por ensaio imunoenzimático com confirmação por Western blot";
   const q={enunciado:"Homem de 34 anos, HIV positivo sem tratamento, com placas brancas na borda lateral da língua que não saem na raspagem. Qual o agente e o que a lesão indica?",
     alternativas:[{letra:"A",texto:"Candida albicans; indica higienização oral inadequada",porque:"A candidíase sai na raspagem com espátula, deixando base eritematosa."},{letra:"B",texto:"Vírus Epstein-Barr (EBV); trata-se de leucoplasia pilosa oral, sinal de imunodeficiência progressiva (CD4 < 500)",porque:""},
       {letra:"C",texto:LONG,porque:"O HTLV-1 causa leucemia/linfoma de células T do adulto e paraparesia espástica tropical, não lesão oral em placa: a pista é a placa que não sai na raspagem, típica do EBV."},{letra:"D",texto:"HPV",porque:"Causa papilomas e condilomas, não placas corrugadas."}],
     correta:"B",comentario:"A leucoplasia pilosa oral é causada pela reativação do EBV. Caracteriza-se por placas brancas corrugadas na borda lateral da língua que não são removíveis por raspagem. Sinaliza imunodeficiência moderada a avançada.",conceito:"Placa branca na borda lateral da língua que não sai na raspagem = leucoplasia pilosa por EBV."};
   const D=qDraft(q,"C","Simulado HIV/AIDS 2");const e=eNew(k,D.w,D.r,D.t,D.s,"",D.p,{pc:D.pc,dd:D.dd,qf:D.qf});
   const ids=cdErrDrafts(e).map(c=>cdAdd(e.k,c.q,c.a,"eu",{h:1,ref:c.ref||"",kind:c.kind,eid:e.id}).id);window.__ids=ids.reverse();window.__k2=ALL[1].key});
 const shot=async(tag,fn,sel)=>{await p.evaluate(fn);await p.waitForTimeout(400);const el=sel?await p.$(sel):null;if(el)await el.screenshot({path:`${OUT}/${ver}-${tag}-${name}.png`});else await p.screenshot({path:`${OUT}/${ver}-${tag}-${name}.png`})};
 await shot("cartao",()=>{setView("notas");if(typeof setNSeg==="function")setNSeg("revisar");cdRunStart(__ids);document.querySelector(".ncards").scrollIntoView()},".ncards");
 await shot("cartao-resposta",()=>{cdRun.show=true;render();document.querySelector(".ncards").scrollIntoView()},".ncards");
 await p.evaluate(()=>{cdRun=null});
 await shot("foco",()=>{const k=__k2;upd(k,x=>{x.last=fromNum(dnum(today())-5);x.step=1;x.l=1});foAfterSet({id:"fx",d:today(),sec:1500,ref:"T:"+k,lab:""});setView("foco");render()},".foafter");
 if(ver==="depois")await shot("aviso",()=>{window.__failSet=/\/exams\//;const ex=exClean({id:"exbig",name:"ENARE 2024",banca:"ENARE",ano:"2024",qs:[{n:1,q:{enunciado:"x",alternativas:[{letra:"A",texto:"a"},{letra:"B",texto:"b"}],correta:"A"}}]});exams.unshift(ex);exPut(ex);setView("inicio");render()});
 await ctx.close()}
await b.close();console.log("ok")})();
