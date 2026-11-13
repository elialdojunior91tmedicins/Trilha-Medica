// Prints da aba Cartões (não é teste; não entra em list.txt). Uso: node shotsCards.js [pasta]
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');
const OUT=process.argv[2]||__dirname+'/shots-cartoes';fs.mkdirSync(OUT,{recursive:true});
const SEED=`(()=>{cards.length=0;const T=today(),ago=n=>fromNum(dnum(T)-n),K=ALL.slice(0,30).map(i=>i.key);
  const Q=["Leucoplasia pilosa oral: qual o agente?","Sífilis latente tardia: tratamento de escolha?","Critérios de Light: quando o derrame é exsudato?","IAM com supra: tempo porta-agulha ideal?","Hipotireoidismo subclínico: quando tratar?","Pré-eclâmpsia com sinais de gravidade: droga para prevenir convulsão?","Bronquiolite: principal agente?","Cetoacidose: quando repor potássio?","DPOC exacerbado: indicação de VNI?","Meningite bacteriana no adulto: esquema empírico?"];
  for(let i=0;i<60;i++){const st=i%6===0?0:2,last=ago(5+(i%30)),ivl=i%4===0?40:6+(i%10);
    const x=cdClean({id:"cs"+i,k:K[i%K.length],q:"<b>"+BYKEY[K[i%K.length]].t.split(" ")[0]+"</b> — "+Q[i%Q.length],a:"<b>Resposta</b> do cartão "+i,h:1,src:i%5===0?"claude":"eu",...(i%7===0?{eid:"e"+i}:{}),
      due:st?fromNum(dnum(last)+ivl-(i%3===0?ivl:0)):T,f:st?{st:2,s:ivl,d:5,last,reps:5+i%9,lapses:i%11===0?5:i%3,first:ago(80)}:{st:0,s:0,d:0,last:"",reps:0,lapses:0,first:""},at:new Date(Date.now()-i*6e4).toISOString()});
    if(st)x.rv=Array.from({length:12},(_,j)=>({d:ago((j*3+i)%60),g:(i+j)%9===0?1:(i+j)%4===0?2:3,i:ivl,r:1,...(ivl>=21?{m:1}:{})}));cards.push(x)}
  cards[3].su=1;cdSaveLocal();ui.prefs.cdNew=14;render()})()`;
const DEV=process.env.DEVS?Object.fromEntries(Object.entries({fone:[390,844,true],ipad578:[578,820,true],tab1180:[1180,820,true],note:[1366,900,false],monitor:[1920,1080,false]}).filter(([k])=>process.env.DEVS.split(",").includes(k))):{fone:[390,844,true],ipad578:[578,820,true],note:[1366,900,false]};
(async()=>{const b=await chromium.launch();
for(const [name,[w,h,mob]] of Object.entries(DEV))for(const th of ["light","dark"]){if(name==="ipad578"&&th==="dark")continue;
  const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:2,hasTouch:mob,isMobile:mob,colorScheme:th,screen:name==="ipad578"?{width:1180,height:820}:undefined});
  await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
  const p=await ctx.newPage();await p.goto('http://localhost:8765/tests/preview.html');
  await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.evaluate(SEED);
  const shot=async(n,full)=>{await p.waitForTimeout(250);await p.evaluate(()=>scrollTo(0,0));await p.screenshot({path:`${OUT}/${name}-${th}-${n}.png`,fullPage:!!full})};
  await p.evaluate(()=>cdOpen("hoje"));await shot("1-hoje",true);
  await p.evaluate(()=>{cdNewOpen=true;cdNS.mode="um";cdNS.k=ALL[0].key;render()});await shot("2-novo",true);
  await p.evaluate(()=>{cdNS.mode="varios";cdNS.paste="Agente da leucoplasia pilosa :: Vírus Epstein-Barr\nlinha sem separador\nTratamento da sífilis latente tardia :: Penicilina benzatina, 3 doses";cdNsPrev()});await shot("3-colar",true);
  await p.evaluate(()=>{cdNewOpen=false;cdOpen("todos")});await shot("4-todos");
  await p.evaluate(()=>{const x=cards[1];cdPick=x.id;cdEdFor(x);render()});await shot("5-editor",!mob);
  await p.evaluate(()=>{cdPick=null;cdEd=null;cdSel=new Set(cards.slice(0,3).map(x=>x.id));render()});await shot("6-selecionar");
  await p.evaluate(()=>{cdSel=null;cdOpen("numeros")});await shot("7-numeros",true);
  await p.evaluate(()=>{cdOpen("hoje",{go:true})});await shot("8-revisao");
  if(mob){await p.evaluate(()=>{cdRun=null;setView("inicio")});await p.screenshot({path:`${OUT}/${name}-${th}-0-barra.png`,clip:{x:0,y:h-90,width:w,height:90}});
    await p.evaluate(()=>navMenuOpen());await p.waitForTimeout(400);await p.screenshot({path:`${OUT}/${name}-${th}-0-menu.png`})}
  await ctx.close()}
await b.close()})();
