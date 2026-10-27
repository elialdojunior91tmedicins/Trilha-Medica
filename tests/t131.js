// t131: Lote 18 › Estatísticas (seção 9) — Faculdade: resumo do semestre (tempo de foco × nota por disciplina, a que deu mais resultado por hora,
// a de nota baixa) e quanto do tempo da faculdade no semestre também avançou temas da residência
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
(async()=>{const b=await chromium.launch();const errs=[];
for(const [name,w,h,mob] of [["note",1366,900,false],["fone",390,844,true]]){
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob});
  await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
  await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
  let r=await p.evaluate(()=>{const t=dnum(today()),D=n=>fromNum(t-n);
    fac={sems:[{id:"s",name:"6º",archived:false}],discs:[{id:"a",semId:"s",name:"Tutoria",items:["T:CM-1"],sps:[]},{id:"b",semId:"s",name:"TBL",items:["T:CM-30"],sps:[]},{id:"c",semId:"s",name:"Morfofuncional",items:[],sps:[]}],
      provas:[{id:"p1",discId:"a",name:"P1 Tutoria",date:D(20),items:["T:CM-1"],done:[],res:{d:D(19),n:9,of:10}},{id:"p2",discId:"b",name:"P1 TBL",date:D(15),items:["T:CM-30"],done:[],res:{d:D(14),n:4.5,of:10}}],own:{}};saveFac();
    const S=(id,d,sec,ref)=>({id,d:D(d),s:D(d)+"T10:00:00.000Z",sec,m:"p",ref,lab:""});
    foSess.push(S("f1",40,3600,"T:CM-1"),S("f2",30,3600,"D:a"),S("f3",25,4*3600,"T:CM-30"),S("f4",10,2*3600,"D:b"),S("f5",5,3600,"D:c"),S("f6",3,1800,"T:CM-7"));foSaveLocal();
    stSide="fac";stPer=30;backStack=[];setView("stats");render();
    const R=[...document.querySelectorAll("#stSem .stsr")].map(x=>[x.querySelector(".stsn b").textContent,x.querySelector(".stst b").textContent,x.querySelector(".stsv b").textContent+" "+x.querySelector(".stsv small").textContent,(x.querySelector(".stsb")||{}).textContent||""].join("|"));
    const fr=document.getElementById("stFacRes");return {R,fr:fr&&fr.textContent}});
  ok(r.R[0]==="Tutoria|2 h|90% 1 prova|"&&r.R[1]==="TBL|6 h|45% 1 prova|nota baixa: rever o jeito de estudar"&&r.R[2]==="Morfofuncional|1 h|– sem nota|",name+": resumo do semestre: tempo × nota (selo de resultado por hora só com 3 h+ de foco) ("+r.R.join(" ; ")+")");
  ok(/^\d+%No semestre, \d+% do que você estudou na faculdade \(.+ de 9 h\) também avançou temas da residência/.test(r.fr||""),name+": quanto da faculdade conta para a residência: "+r.fr);
  ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral");
  await ctx.close()}
ok(errs.length===0,"sem erros de JavaScript"+(errs.length?": "+errs.slice(0,3).join(" | "):""));
await b.close()})();
