// capturas do Lote 18 › Questões (não é teste). Uso: node shots18q.js <pasta>
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const seed=fs.readFileSync(__dirname+'/seed10.js','utf8');
const OUT=process.argv[2]||'.';fs.mkdirSync(OUT,{recursive:true});
const DEV={fone:[390,844,true],note:[1366,900,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];
 const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1.5,hasTouch:mob,isMobile:mob});
 await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
 await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
 await p.evaluate(src=>{const module={exports:{}};eval(src);module.exports();["CM-1","CM-7","CM-34","PED-21"].forEach(k=>upd(k,x=>{x.last=today();x.ed=[today()]}));
   const A=t=>["A","B","C","D"].map(l=>({letra:l,texto:t+" "+l}));exams=[exClean({id:"exf",mod:1,name:"P1 NCS 5 – 2025",banca:"Faculdade",qs:[
     {n:1,k:"CM-1",g:"b",q:{enunciado:"Mulher de 45 anos procura a UBS com cefaleia há 3 meses, pior pela manhã, PA 168/104 mmHg em duas medidas. Qual a conduta inicial mais adequada?",alternativas:A("Conduta"),correta:"B"}},
     {n:2,k:"CM-7",g:"b",q:{enunciado:"Homem de 60 anos, tabagista, refere dor torácica em aperto há 40 minutos. ECG com supradesnível de ST em DII, DIII e aVF. Todas as condutas abaixo são adequadas, EXCETO:",alternativas:A("Opção"),correta:"C"}}]})];exSaveLocal();
   fac={sems:[{id:"s",name:"6º",archived:false}],discs:[{id:"d",semId:"s",name:"NCS",items:["T:CM-1"],sps:[]}],provas:[],own:{}};saveFac();commit();
   sim=null;simCfg={src:"week",n:5,dif:"mista",est:"fac"};backStack=[];setView("quest");setQSeg("praticar");render()},seed);
 await p.waitForTimeout(400);
 const shot=async(tag,fn,sel)=>{await p.evaluate(fn);await p.waitForTimeout(400);await p.evaluate(s=>{const c=document.querySelector(s);if(c){c.scrollIntoView({block:"start"});scrollBy(0,-90)}},sel);await p.waitForTimeout(150);await p.screenshot({path:`${OUT}/${tag}-${name}.png`})};
 await shot("1-simulado",()=>{render()},".qsim");
 await shot("2-estilo",()=>{render()},"#simE-fac");
 await shot("3-prova-modelo",()=>{render()},"#exr-exf");
 await shot("4-gerador",()=>{detTab["CM-1"]="questoes";openTopic("CM-1");render()},'[id^="qsty-CM-1"]');
 await ctx.close()}
console.log(errs.length?"ERROS: "+errs.join(" | "):"ok");await b.close()})();
