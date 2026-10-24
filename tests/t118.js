// t118: Corrigir gabarito no Refazer — depois de errar, "O gabarito está errado?" deixa escolher a letra certa (na ordem da tela, mesmo embaralhada).
// Se for a que você marcou: sai do Refazer e o erro vira acerto no tema (dia do erro). Se for outra: corrige e continua na lista. Prova na íntegra: corrige a prova junto.
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
(async()=>{const b=await chromium.launch();const errs=[];
for(const [name,w,h,mob] of [["fone",390,844,true],["note",1366,900,false]]){
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob});
  await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);window.__noShuffle=false;`);const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));
  await p.goto('http://localhost:8765/tests/preview.html');await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
  const click=async s=>{await p.evaluate(s=>{const x=document.querySelector(s);if(x)x.scrollIntoView({block:"center"})},s);await (mob?p.tap(s):p.click(s));await p.waitForTimeout(200)};
  const Q=(st,cor)=>({enunciado:st,alternativas:[{letra:"A",texto:"alfa"},{letra:"B",texto:"beta",porque:"Beta não serve"},{letra:"C",texto:"gama"},{letra:"D",texto:"delta"}],correta:cor,comentario:"Comentário",conceito:"",alerta:""});
  /* 1. gerada: erro de 2 dias atrás, gabarito errado (diz A; a certa é B) */
  const D2=await p.evaluate(Q=>{const d=fromNum(dnum(today())-2);redo=[];upd("CM-1",x=>{x.qt=0;x.qc=0;x.qd={};x.qb={};addQ(x,1,0,d,"Claude")});hist[d]={q:1};commit();
    rdAdd("CM-1",Q,"gen");const x=redo[0];x.fd=d;x.d=d;x.due=today();rdSaveLocal();setView("quest");setQSeg&&setQSeg("prac");rdStart([x.id]);return d},Q("Questão um","A"));
  await p.waitForTimeout(300);
  /* marca "beta" (a certa de verdade), que o app considera errada */
  const lb=await p.evaluate(()=>{const b=[...document.querySelectorAll('.qredo .alt')].find(b=>b.textContent.includes("beta"));b.id="pickMe";return b.querySelector("b").textContent[0]});
  await click('#pickMe');
  ok(await p.evaluate(()=>!!document.querySelector('#rdFixB')),name+": depois de errar aparece 'O gabarito está errado?'");
  await click('#rdFixB');
  const bt=await p.evaluate(()=>[...document.querySelectorAll('[id^="rdFix-"]')].map(b=>b.textContent));
  ok(bt.length===3&&bt.some(t=>t.startsWith(lb)&&/a sua/.test(t)),name+": mostra as outras letras e marca a sua "+JSON.stringify(bt));
  await click('#rdFix-'+lb);
  const R1=await p.evaluate(D=>{const s=get("CM-1");return {left:!redo.length,qc:s.qc,qt:s.qt,day:s.qd[D],src:s.qb.claude?s.qb.claude[D]:Object.values(s.qb)[0][D],h:hist[D].c||0,
    v:document.querySelector('#rdFixed')?.textContent||"",cad:!!document.querySelector('.qredo .ecad'),note:!!document.querySelector('#rdFxNote')}},D2);
  ok(R1.left&&R1.qc===1&&R1.qt===1&&JSON.stringify(R1.day)==="[1,1]"&&JSON.stringify(R1.src)==="[1,1]"&&R1.h===1,name+": era a sua → sai do Refazer e conta acerto no dia do erro "+JSON.stringify(R1));
  ok(/corrigido para/.test(R1.v)&&/Você tinha acertado/.test(R1.v)&&!R1.cad&&R1.note,name+": aviso de corrigido, sem formulário de erro, nota sobre o comentário "+JSON.stringify(R1));
  await click('#rdNext');ok(await p.evaluate(()=>/100%/.test(document.querySelector('#rdEnd')?.textContent||"")),name+": resultado conta como acerto");
  await p.evaluate(()=>{rdRun=null;render()});
  /* 2. corrigir para outra letra: continua na lista */
  await p.evaluate(Q=>{redo=[];rdAdd("CM-2",Q,"sim");const x=redo[0];x.due=today();rdStart([x.id])},Q("Questão dois","A"));await p.waitForTimeout(250);
  await p.evaluate(()=>{const b=[...document.querySelectorAll('.qredo .alt')].find(b=>b.textContent.includes("gama"));b.id="pickMe"});await click('#pickMe');await click('#rdFixB');
  const ld=await p.evaluate(()=>{const b=[...document.querySelectorAll('.qredo .alt')].find(b=>b.textContent.includes("delta"));return b.querySelector("b").textContent[0]});
  await click('#rdFix-'+ld);
  const R2=await p.evaluate(()=>({n:redo.length,cor:redo[0]&&redo[0].q.correta,fx:redo[0]&&redo[0].q.fx,v:document.querySelector('#rdFixed')?.textContent||"",cad:!!document.querySelector('.qredo .ecad'),
    st:JSON.parse(localStorage.getItem("resid-redo-v1")||"[]")[0]?.q?.correta}));
  ok(R2.n===1&&R2.cor==="D"&&R2.fx==="A"&&R2.st==="D"&&/continua errada/.test(R2.v)&&R2.cad,name+": outra letra → gabarito trocado e continua na lista "+JSON.stringify(R2));
  await p.evaluate(()=>{rdRun=null;render()});
  /* 3. prova na íntegra: corrige a prova e o tema pelo exChange */
  const E=await p.evaluate(Q=>{redo=[];const q=Q;const ex={id:"ex1",name:"Prova T",at:Date.now(),qs:[{n:1,p:1,k:"CM-3",q:JSON.parse(JSON.stringify(q)),g:"b"}]};exams.push(ex);
    exPg("ex1").mode="e";upd("CM-3",x=>{x.qt=0;x.qc=0;x.qd={}});commit();
    const P=exProg.find(x=>x.id==="ex1");exChange(ex,0,()=>{P.a[0]={l:"C",d:today(),s:5}});rdAdd("CM-3",q,"exam");const x=redo[0];x.due=today();rdStart([x.id]);return {qt:get("CM-3").qt,qc:get("CM-3").qc}},Q("Questão três","A"));
  await p.waitForTimeout(250);
  await p.evaluate(()=>{const b=[...document.querySelectorAll('.qredo .alt')].find(b=>b.textContent.includes("gama"));b.id="pickMe"});await click('#pickMe');await click('#rdFixB');
  {const id=await p.evaluate(()=>[...document.querySelectorAll('[id^="rdFix-"]')].find(b=>/a sua/.test(b.textContent)).id);await click('#'+id)}
  const R3=await p.evaluate(()=>({left:!redo.some(x=>x.k==="CM-3"),cor:exams.find(e=>e.id==="ex1").qs[0].q.correta,ck:exams.find(e=>e.id==="ex1").qs[0].ck,qt:get("CM-3").qt,qc:get("CM-3").qc,v:document.querySelector('#rdFixed')?.textContent||""}));
  ok(E.qt===1&&E.qc===0&&R3.left&&R3.cor==="C"&&R3.ck==="A"&&R3.qt===1&&R3.qc===1&&/prova na íntegra também/.test(R3.v),name+": prova → corrige a prova e o acerto do tema "+JSON.stringify([E,R3]));
  await ctx.close()}
ok(!errs.length,"sem erros de página "+errs.join(" | "));await b.close()})();
