// capturas do Lote 21, item 3 (Cartões): node tests/shots21b.js <pasta>
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const OUT=process.argv[2]||'.';
const DEV={fone:[390,844,true],note:[1366,900,false]};
(async()=>{const b=await chromium.launch();
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,deviceScaleFactor:2});
 await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
 const p=await ctx.newPage();await p.goto('http://localhost:8765/tests/preview.html');
 await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
 const eid=await p.evaluate(()=>{cards=[];const k=ALL.find(i=>/Leucemia|HIV/i.test(i.t))||ALL[0];const q={enunciado:"Homem de 34 anos, HIV com CD4 de 120, com placas brancas na borda lateral da língua que não saem na raspagem. Qual o agente?",
     alternativas:[{letra:"A",texto:"Candida albicans",porque:"A candidíase sai na raspagem com espátula, deixando base eritematosa."},{letra:"B",texto:"Vírus Epstein-Barr",porque:""},{letra:"C",texto:"HPV",porque:"Causa papilomas."}],
     correta:"B",comentario:"A leucoplasia pilosa oral é causada pela reativação do EBV e não sai na raspagem.",conceito:"Placa branca lateral na língua que não sai na raspagem = leucoplasia pilosa por EBV."};
   const D=qDraft(q,"A","ENARE 2024");const e=eNew(k.key,D.w,D.r,D.t,D.s,"",D.p,{pc:"Não sai na raspagem: pense em leucoplasia pilosa (EBV), não em candidíase.",dd:"HIV com CD4 120 · placa que não sai na raspagem",qf:D.qf});
   eGoTopic(k.key);backStack=[];setView("erros");eMenu=e.id;render();return e.id});await p.waitForTimeout(250);
 await p.evaluate(id=>{document.querySelector('#ecd-'+id).click()},eid);await p.waitForTimeout(250);
 await p.locator(`.cderr[data-eid="${eid}"]`).screenshot({path:`${OUT}/5-previa-${name}.png`});
 await p.evaluate(id=>{document.querySelector('#cdLot-'+id).click()},eid);await p.waitForTimeout(500);
 await p.evaluate(()=>{const T=today(),mk=(k,q,a,due,st)=>{const x=cdAdd(k,q,a,"eu",{h:1});return [x.id,due,st]};const K=[ALL[0].key,ALL[1].key,ALL[2].key,ALL.find(i=>i.area.code!==ALL[0].area.code).key,ALL.filter(i=>i.area.code!==ALL[0].area.code)[3].key];
   window.__set=[mk(K[0],"<b>Hipertensão.</b> Meta de PA no diabético?","<b>&lt; 130/80 mmHg.</b>",T,2),mk(K[0],"<b>Hipertensão.</b> 1ª linha na gestante?","<b>Metildopa.</b>",fromNum(dnum(T)+12),2),mk(K[1],"<b>IC.</b> Droga que reduz mortalidade?","<b>iSGLT2.</b>",T,2),mk(K[2],"<b>FA.</b> CHA2DS2-VASc ≥ 2 no homem?","<b>Anticoagular.</b>",T,0),mk(K[3],"<b>Apendicite.</b> Sinal de Rovsing?","<b>Dor na FID ao palpar a FIE.</b>",fromNum(dnum(T)+5),2),mk(K[4],"<b>Trauma.</b> Primeiro passo do ATLS?","<b>Via aérea com proteção cervical.</b>",T,2)]});await p.waitForTimeout(500);
 await p.evaluate(()=>{const T=today();window.__set.forEach(([id,due,st])=>{const x=cards.find(c=>c.id===id);x.due=due;x.f=st?{st:2,s:10,d:5,last:fromNum(dnum(T)-8),reps:3,lapses:0,first:"2026-10-01"}:{st:0,s:0,d:0,last:"",reps:0,lapses:0,first:""};cdPut(x)});
   cdTreeOpen=new Set(["a:"+ALL[0].area.code,"s:"+specId(ALL[0])]);cdGoCards()});await p.waitForTimeout(400);
 await p.locator('.ncards').screenshot({path:`${OUT}/6-cartoes-${name}.png`});
 await p.evaluate(()=>{sampleFn.json=async(pr)=>{const ids=[...pr.matchAll(/código (cd[a-z0-9]+)/g)].map(m=>m[1]);return ids.map((id,i)=>({codigo:id,question:i?"<b>Candidíase oral.</b> Por que <u>não</u> é candidíase uma placa que não sai na raspagem?":"<b>Leucoplasia pilosa oral.</b> HIV com CD4 120 e placa branca na borda lateral da língua que não sai na raspagem: qual o agente?",answer:i?"<b>A candidíase sai na raspagem.</b><br><br><i>A placa da <b>candidíase</b> é removível e deixa base eritematosa; a que <b>não sai</b> aponta para EBV.<br><br>Note: na prova, “não sai na raspagem” é a pista.</i>":"<b>Vírus Epstein-Barr (EBV).</b><br><br><i>A <b>leucoplasia pilosa</b> é reativação do EBV e marca imunodeficiência avançada.</i>",reference:"<i>Oral hairy leukoplakia</i>, em <b>UpToDate</b>."}))};cdLotRun()});await p.waitForTimeout(500);
 await p.locator('#cdLotBox').screenshot({path:`${OUT}/7-antes-depois-${name}.png`});
 await p.evaluate(()=>{cdLot=null;cards.filter(x=>x.dr).forEach(x=>{delete x.dr});const x=cards.find(c=>c.id===window.__set[0][0]);cdEditOpen(x)});await p.waitForTimeout(300);
 await p.locator('#cdEdit').screenshot({path:`${OUT}/8-editor-${name}.png`});
 await p.evaluate(()=>{cdEd=null;const L=cards.filter(x=>x.k===ALL[0].key);cdSliceGo(L,ALL[0].sp||ALL[0].area.name);cdRun.i=1;cdRun.show=true;render()});await p.waitForTimeout(300);
 await p.locator('.ncards').screenshot({path:`${OUT}/9-treino-extra-${name}.png`});
 await ctx.close()}
await b.close()})();
