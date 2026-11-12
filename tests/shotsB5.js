// Capturas do B5 (não é teste): node tests/shotsB5.js [pasta]  — usa os mesmos dados do t152
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');
const SEED=fs.readFileSync(__dirname+'/t152.js','utf8').match(/const SEED=`([\s\S]*?)`;\n/)[1];const OUT=process.argv[2]||__dirname;
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1366,height:900},deviceScaleFactor:2});
 await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__qLegacy=false;window.__mock({},2);`);
 const p=await ctx.newPage();await p.goto('http://localhost:8765/tests/preview.html');
 await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn&&bankBootP,null,{polling:100,timeout:15000});await p.evaluate(SEED);await p.waitForTimeout(300);
 const shot=async(n,sel)=>{const e=sel?await p.$(sel):null;if(e){await e.scrollIntoViewIfNeeded();await e.screenshot({path:`${OUT}/b5-${n}.png`})}else await p.screenshot({path:`${OUT}/b5-${n}.png`})};
 /* ★ na anotação */
 await p.evaluate(()=>{notes["CM-1"]="## Tratamento\n★ IECA ou BRA é a primeira escolha no diabético com albuminúria\n- Meta de PA abaixo de 130/80\n- ★ Não associar IECA com BRA\n- Tiazídico e anlodipino como segunda droga\n> Pegadinha: BRA + IECA juntos — Por quê: mais hipercalemia e lesão renal\n==alvo < 130/80==";noteMode["CM-1"]="ler";detTab["CM-1"]="notas";openTopic("CM-1");render()});await p.waitForTimeout(400);
 await shot("1-anotacao","#t-CM-1 .notes");
 await p.evaluate(()=>{noteMode["CM-1"]="editar";render()});await p.waitForTimeout(250);await shot("2-editor","#t-CM-1 .ntools");
 await p.evaluate(()=>{setView("notas");setNSeg("pegadinhas");pgF.t="hy";render()});await p.waitForTimeout(400);await shot("3-pegadinhas",".npeg");
 /* Resumo */
 await p.evaluate(()=>{pgF.t="all";setView("quest");qGo("resumo");render()});await p.waitForTimeout(400);
 await shot("4-banca",".bkbc");await shot("5-hy",".hycard");await shot("6-recorrentes",".crcard");
 /* tema */
 await p.evaluate(()=>{const it=BYKEY["CM-1"],L=subList(it),t=L.find(x=>!x.hy),sk=sbKey(t);const qs=[];for(let i=0;i<9;i++)qs.push({n:i+1,k:"CM-1",g:"b",sb:sk,sbg:1,q:{enunciado:"Subtópico "+i+": caso de hipertensão "+i,alternativas:[{letra:"A",texto:"um "+i},{letra:"B",texto:"dois "+i}],correta:"A"}});
   exams.push(exClean({id:"exsb",name:"Revalida 2019",banca:"REVALIDA",ano:"2019",at:"2026-10-07T10:00:00.000Z",of:1,niv:"Revalida",kst:"d",qs}));bankFeedAll()});
 await p.evaluate(()=>{detTab[window.__low]="estudo";openTopic(window.__low);render()});await p.waitForTimeout(400);await shot("7-tema-peso",`#t-${await p.evaluate(()=>window.__low)} .dinc`);
 await p.evaluate(()=>{detTab["CM-1"]="estudo";openTopic("CM-1");render()});await p.waitForTimeout(400);await shot("8-tema-subtopicos","#t-CM-1 .dsubs");
 /* banco com o selo */
 await p.evaluate(()=>{crConfirm(crSuggest()[0]);setView("quest");qGo("banco");bkF=bkFDef();bkF.rc=true;render()});await p.waitForTimeout(400);await shot("9-banco","#bkBox");
 /* celular */
 await p.setViewportSize({width:390,height:844});await p.evaluate(()=>{bkF=bkFDef();qGo("resumo");render()});await p.waitForTimeout(400);
 await p.evaluate(()=>{const e=document.querySelector('.bkbc');e.scrollIntoView()});await p.screenshot({path:`${OUT}/b5-10-celular.png`});
 await b.close();console.log("ok")})();
