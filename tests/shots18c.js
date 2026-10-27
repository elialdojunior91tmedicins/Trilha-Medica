// capturas do Lote 18 › Caderno (não é teste). Uso: node shots18c.js <pasta>
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const seed=fs.readFileSync(__dirname+'/seed10.js','utf8');
const OUT=process.argv[2]||'.';fs.mkdirSync(OUT,{recursive:true});
const DEV={fone:[390,844,true],note:[1366,900,false]};
const NOTE=`## Definição e causa
Ferritina baixa por **perda crônica de sangue** (menstruação, sangramento digestivo) ou dieta pobre em ferro.

## Quadro clínico
- Cansaço, palidez, queilite angular
- ==Perversão do apetite (pica)== e coiloníquia

## Diagnóstico
- Ferritina < 30 ng/mL: **diagnóstico**
- Anemia microcítica e hipocrômica, RDW alto

## Tratamento
- Sulfato ferroso oral; reavaliar em 4 semanas

## Diferenciais
Comparar com [[Anemias]] de doença crônica e talassemia.

## Pegadinhas
> Ferritina normal NÃO exclui deficiência com inflamação.
> Homem ou mulher na menopausa com ferropenia: investigar trato digestivo.`;
(async()=>{const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];
 const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1.5,hasTouch:mob,isMobile:mob});
 await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
 await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
 await p.evaluate(([src,NOTE])=>{const module={exports:{}};eval(src);module.exports();const t=dnum(today()),K=Object.keys(BYKEY).find(k=>/^Anemias/.test(BYKEY[k].t)&&!BYKEY[k].own)||"CM-34";window.__K=K;
   fac={sems:[{id:"s",name:"6º",archived:false}],discs:[{id:"d",semId:"s",name:"NCS – Tutoria",items:[],div:"sp",sps:[{id:"sp1",name:"SP 1.3 – Anemias",items:["T:"+K,"T:CM-1"],objs:["Classificar as anemias pelo VCM","Diagnosticar a anemia ferropriva"]}]}],
     provas:[{id:"p",discId:"d",name:"Prova da UC 1",date:fromNum(t+3),items:["T:"+K],done:[]}],own:{}};saveFac();
   notes[K]=NOTE;saveNotesLocal();upd(K,x=>{x.nm="doenca"});notes["CM-1"]="";commit();detTab[K]="notas";noteMode[K]="ler";openTopic(K);render()},[seed,NOTE]);
 await p.waitForTimeout(400);
 const shot=async(tag,fn,sel)=>{await p.evaluate(fn);await p.waitForTimeout(400);await p.evaluate(s=>{const c=document.querySelector(s);if(c){c.scrollIntoView({block:"start"});scrollBy(0,-90)}},sel);await p.waitForTimeout(150);await p.screenshot({path:`${OUT}/${tag}-${name}.png`})};
 await shot("1-pagina",()=>{render()},`#t-${await p.evaluate(()=>window.__K)} .npath`);
 await shot("2-pegadinhas",()=>{render()},`#t-${await p.evaluate(()=>window.__K)} details.mdsec.peg`);
 await shot("3-cartao",()=>{const K=window.__K;trStart(K,"Diagnóstico: Ferritina < 30 ng/mL: diagnóstico. Anemia microcítica e hipocrômica, RDW alto")},`.cderr`);
 await p.evaluate(()=>{const K=window.__K;delete cdErr["tr-"+K];delete trE[K];render();const v=document.querySelector(`#t-${K} .mdview[data-nk] .mdsb li`);const rg=document.createRange();rg.selectNodeContents(v);getSelection().removeAllRanges();getSelection().addRange(rg);v.scrollIntoView({block:"center"})});
 await p.waitForTimeout(300);await p.screenshot({path:`${OUT}/4-selecao-${name}.png`});await p.evaluate(()=>getSelection().removeAllRanges());
 await shot("5-vazia",()=>{detTab["CM-1"]="notas";openTopic("CM-1");render()},`#nm-doenca-CM-1`);
 await shot("6-leitura-prova",()=>{provaReadGo(fac.provas[0])},`#nProvaRead`);
 await shot("7-estudar-hoje",()=>{setView("inicio");render()},`#pFac`);
 await ctx.close()}
console.log(errs.length?"ERROS: "+errs.join(" | "):"ok");await b.close()})();
